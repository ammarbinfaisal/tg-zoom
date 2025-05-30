import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zoomRecords } from '@/lib/schema';
import { desc, like } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    let recordings;
    
    if (query) {
      // Search for recordings matching the query
      recordings = await db
        .select()
        .from(zoomRecords)
        .where(like(zoomRecords.title, `%${query}%`))
        .orderBy(desc(zoomRecords.createdAt));
    } else {
      // Get all recordings
      recordings = await db
        .select()
        .from(zoomRecords)
        .orderBy(desc(zoomRecords.createdAt));
    }
    
    return NextResponse.json(recordings);
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}
