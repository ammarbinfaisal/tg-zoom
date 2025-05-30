import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import path from 'path';

// Get the database URL from environment variables or use a default
const dbPath = path.resolve(process.cwd(), '../zoom_bot.db');
const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

// Create a database client
const client = createClient({
  url: dbUrl,
});

// Create a drizzle instance
export const db = drizzle(client);

// Export the client for direct queries if needed
export { client };
