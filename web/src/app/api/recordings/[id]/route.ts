import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { zoomRecords } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
    
    return NextResponse.json(recording);
  } catch (error) {
    console.error('Error fetching recording:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recording' },
      { status: 500 }
    );
  }
}
