import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zoomRecords } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const [recording] = await db
      .select()
      .from(zoomRecords)
      .where(eq(zoomRecords.id, id));
    
    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }
    
    if (!recording.filePath) {
      return NextResponse.json(
        { error: 'File not available' },
        { status: 404 }
      );
    }
    
    try {
      // Check if file exists
      await fs.access(recording.filePath);
      
      // Get file stats
      const stats = await fs.stat(recording.filePath);
      
      // Read file
      const fileBuffer = await fs.readFile(recording.filePath);
      
      // Get file extension
      const fileExt = path.extname(recording.filePath).substring(1);
      
      // Set content type based on file extension
      const contentType = getContentType(fileExt);
      
      // Create response with file
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${path.basename(recording.filePath)}"`,
          'Content-Length': stats.size.toString(),
        },
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json(
        { error: 'File not found or inaccessible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error downloading recording:', error);
    return NextResponse.json(
      { error: 'Failed to download recording' },
      { status: 500 }
    );
  }
}

// Helper function to determine content type
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    txt: 'text/plain',
    // Add more as needed
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}
