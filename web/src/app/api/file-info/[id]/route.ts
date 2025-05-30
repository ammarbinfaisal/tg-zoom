import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zoomRecords } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const id = parseInt(p.id);
    
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
      
      return NextResponse.json({
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: recording.filePath,
      });
    } catch (error) {
      console.error('Error reading file info:', error);
      return NextResponse.json(
        { error: 'File not found or inaccessible' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching file info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file info' },
      { status: 500 }
    );
  }
}
