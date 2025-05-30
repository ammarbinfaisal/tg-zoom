import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, like, desc } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { users, zoomRecords } from './src/schema';

const execAsync = promisify(exec);

interface ZoomLinkData {
  title: string;
  date: string;
  url: string;
  passcode: string;
}

class ZoomTelegramBot {
  private bot: TelegramBot;
  private db: ReturnType<typeof drizzle>;
  private app: express.Application;
  private downloadsDir: string;
  private allowedUploaders: Set<number> = new Set();

  constructor(private botToken: string, private port: number = 3000) {
    this.bot = new TelegramBot(botToken, { polling: true });
    this.app = express();
    this.downloadsDir = path.join(process.cwd(), 'downloads');    
    this.initializeApp();
  }

  private async initializeApp() {
    await this.initializeDirectories();
    await this.loadAllowedUploaders();
    this.setupBotHandlers();
    this.setupWebServer();
  }

  private async initializeDirectories() {
    try {
      await fs.access(this.downloadsDir);
    } catch {
      await fs.mkdir(this.downloadsDir, { recursive: true });
    }
  }

  private async loadAllowedUploaders() {
    const allowedUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.canUpload, "yes"));
    
    this.allowedUploaders = new Set(allowedUsers.map(user => user.telegramId));
  }

  private setupBotHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const username = msg.from?.username;

      if (userId) {
        await this.registerUser(userId, username);
      }

      await this.bot.sendMessage(chatId, `
🎓 *Arabic Class Zoom Bot*

Send me a Zoom recording link with password and I'll download and store it for you!

*Commands:*
/search [query] - Search for recordings
/list - Show recent recordings
/help - Show this help message

*For uploaders:* Just paste the Zoom share link with details
      `, { parse_mode: 'Markdown' });
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot.sendMessage(chatId, `
*How to use:*

📤 *Upload (Authorized users only):*
Just paste your Zoom recording details like:
\`\`\`
Ammar
Date: May 27, 2025 05:35 AM
Duration: 00:59:54
https://us06web.zoom.us/rec/share/...
Passcode: 1I?N7@?L
\`\`\`

🔍 *Search:*
/search arabic grammar
/search may 2025

📋 *List recent:*
/list

The bot will automatically download and store recordings for easy access!
      `, { parse_mode: 'Markdown' });
    });

    // Search command
    this.bot.onText(/\/search (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match?.[1];

      if (!query) {
        await this.bot.sendMessage(chatId, 'Please provide a search query!');
        return;
      }

      await this.searchRecordings(chatId, query);
    });

    // List command
    this.bot.onText(/\/list/, async (msg) => {
      const chatId = msg.chat.id;
      await this.listRecentRecordings(chatId);
    });

    // Admin commands
    this.bot.onText(/\/adduploader (\d+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      const targetUserId = match?.[1] ? parseInt(match[1]) : null;

      // Only allow bot admin (you can hardcode your telegram ID here)
      if (userId !== 123456789) { // Replace with your telegram ID
        await this.bot.sendMessage(chatId, '❌ Unauthorized');
        return;
      }

      if (targetUserId) {
        await this.addUploader(targetUserId);
        await this.bot.sendMessage(chatId, `✅ User ${targetUserId} can now upload recordings`);
      }
    });

    // Handle Zoom link messages
    this.bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.handlePotentialZoomLink(msg);
      }
    });
  }

  private async registerUser(telegramId: number, username?: string) {
    try {
      await this.db.insert(users).values({
        telegramId,
        username: username || null,
        canUpload: "no",
      }).onConflictDoUpdate({
        target: users.telegramId,
        set: {
          username: username || null,
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
    }
  }

  private async addUploader(telegramId: number) {
    await this.db.update(users)
      .set({ canUpload: "yes" })
      .where(eq(users.telegramId, telegramId));
    
    this.allowedUploaders.add(telegramId);
  }

  private parseZoomMessage(text: string): ZoomLinkData | null {
    const lines = text.split('\n').map(line => line.trim());
    
    let title = '';
    let date = '';
    let url = '';
    let passcode = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // First non-empty line is usually the title
      if (!title && line && !line.includes('Date:') && !line.includes('Duration:') && !line.includes('http')) {
        title = line;
      }
      
      // Look for date
      if (line.includes('Date:')) {
        date = line.replace('Date:', '').trim();
      }
      
      // Look for Zoom URL
      if (line.includes('zoom.us')) {
        url = line;
      }
      
      // Look for passcode
      if (line.includes('Passcode:') || line.includes('Password:')) {
        passcode = line.split(':')[1]?.trim() || '';
      }
    }

    if (url && passcode) {
      return {
        title: title || 'Untitled Recording',
        date: date || new Date().toLocaleDateString(),
        url,
        passcode
      };
    }

    return null;
  }

  private async handlePotentialZoomLink(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const text = msg.text;

    if (!userId || !text) return;

    // Check if user can upload
    if (!this.allowedUploaders.has(userId)) {
      return; // Silently ignore non-uploaders
    }

    const zoomData = this.parseZoomMessage(text);
    if (!zoomData) return;

    await this.bot.sendMessage(chatId, '🔍 Zoom link detected! Starting download...');

    try {
      // Store in database
      const [record] = await this.db.insert(zoomRecords).values({
        title: zoomData.title,
        date: zoomData.date,
        zoomUrl: zoomData.url,
        passcode: zoomData.passcode,
        uploadedBy: userId,
        status: 'downloading'
      }).returning();

      // Start download process
      this.downloadZoomRecording(record, chatId);

    } catch (error) {
      console.error('Error processing Zoom link:', error);
      await this.bot.sendMessage(chatId, '❌ Error processing the Zoom link');
    }
  }

  private async downloadZoomRecording(record: any, chatId: number) {
    try {
      const filename = `${record.title.replace(/[^a-zA-Z0-9]/g, '_')}_${record.id}`;
      const outputPath = path.join(this.downloadsDir, filename);

      // Use yt-dlp to download
      const command = `yt-dlp --video-password "${record.passcode}" -o "${outputPath}.%(ext)s" "${record.zoomUrl}"`;
      
      await this.bot.sendMessage(chatId, '⬇️ Downloading recording...');
      
      const { stdout, stderr } = await execAsync(command);
      
      // Find the actual downloaded file
      const files = await fs.readdir(this.downloadsDir);
      const downloadedFile = files.find(file => file.startsWith(filename));
      
      if (downloadedFile) {
        const filePath = path.join(this.downloadsDir, downloadedFile);
        
        // Update database
        await this.db.update(zoomRecords)
          .set({ 
            filePath,
            status: 'completed' 
          })
          .where(eq(zoomRecords.id, record.id));

        await this.bot.sendMessage(chatId, '✅ Recording downloaded successfully!');
        
        // Send the file
        await this.sendRecordingFile(chatId, filePath, record.title);
        
      } else {
        throw new Error('Downloaded file not found');
      }

    } catch (error) {
      console.error('Download error:', error);
      
      await this.db.update(zoomRecords)
        .set({ status: 'failed' })
        .where(eq(zoomRecords.id, record.id));
      
      await this.bot.sendMessage(chatId, `❌ Download failed: ${error}`);
    }
  }

  private async sendRecordingFile(chatId: number, filePath: string, title: string) {
    try {
      const stats = await fs.stat(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 50) { // Telegram's file size limit
        await this.bot.sendMessage(chatId, `📁 *${title}*\n\n⚠️ File too large for Telegram (${fileSizeMB.toFixed(1)}MB)\nFile saved locally: ${path.basename(filePath)}`, 
          { parse_mode: 'Markdown' });
      } else {
        const message = await this.bot.sendDocument(chatId, filePath, {
          caption: `📁 *${title}*`,
          parse_mode: 'Markdown'
        });

        // Store file_id for future reference
        if (message.document) {
          await this.db.update(zoomRecords)
            .set({ fileId: message.document.file_id })
            .where(eq(zoomRecords.filePath, filePath));
        }
      }
    } catch (error) {
      console.error('Error sending file:', error);
      await this.bot.sendMessage(chatId, `❌ Error sending file: ${error}`);
    }
  }

  private async searchRecordings(chatId: number, query: string) {
    try {
      const records = await this.db
        .select()
        .from(zoomRecords)
        .where(like(zoomRecords.title, `%${query}%`))
        .orderBy(desc(zoomRecords.createdAt))
        .limit(10);

      if (records.length === 0) {
        await this.bot.sendMessage(chatId, `🔍 No recordings found for "${query}"`);
        return;
      }

      let response = `🔍 *Search Results for "${query}":*\n\n`;
      
      for (const record of records) {
        response += `📁 *${record.title}*\n`;
        response += `📅 ${record.date}\n`;
        response += `📊 Status: ${record.status}\n\n`;
      }

      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

      // Send files that are available
      for (const record of records) {
        if (record.status === 'completed') {
          if (record.fileId) {
            // Send using file_id (faster)
            await this.bot.sendDocument(chatId, record.fileId);
          } else if (record.filePath) {
            // Send using file path
            await this.sendRecordingFile(chatId, record.filePath, record.title);
          }
        }
      }

    } catch (error) {
      console.error('Search error:', error);
      await this.bot.sendMessage(chatId, '❌ Error searching recordings');
    }
  }

  private async listRecentRecordings(chatId: number) {
    try {
      const records = await this.db
        .select()
        .from(zoomRecords)
        .orderBy(desc(zoomRecords.createdAt))
        .limit(5);

      if (records.length === 0) {
        await this.bot.sendMessage(chatId, '📂 No recordings found');
        return;
      }

      let response = '📂 *Recent Recordings:*\n\n';
      
      for (const record of records) {
        response += `📁 *${record.title}*\n`;
        response += `📅 ${record.date}\n`;
        response += `📊 ${record.status}\n\n`;
      }

      await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('List error:', error);
      await this.bot.sendMessage(chatId, '❌ Error listing recordings');
    }
  }

  private setupWebServer() {
    this.app.use(express.json());

    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/recordings', async (req, res) => {
      try {
        const records = await this.db
          .select()
          .from(zoomRecords)
          .orderBy(desc(zoomRecords.createdAt));
        
        res.json(records);
      } catch (error) {
        res.status(500).json({ error: 'Database error' });
      }
    });

    this.app.listen(this.port, () => {
      console.log(`🚀 Bot server running on port ${this.port}`);
    });
  }

  public start() {

    console.log('🤖 Telegram Zoom Bot started!');
  }
}

// Usage
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const PORT = parseInt(process.env.PORT || '3000');

const bot = new ZoomTelegramBot(BOT_TOKEN, PORT);
bot.start();

export default ZoomTelegramBot;