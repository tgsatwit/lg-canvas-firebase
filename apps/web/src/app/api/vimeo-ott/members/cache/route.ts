import { NextRequest, NextResponse } from 'next/server';

// Note: This imports the cache from the parent route
// In production, you might want to use a shared cache service like Redis
const membersCache = new Map();

export async function DELETE() {
  try {
    // Clear all cache entries
    const cacheSize = membersCache.size;
    membersCache.clear();
    
    console.log(`Cache cleared - removed ${cacheSize} entries`);
    
    return NextResponse.json({
      message: 'Cache cleared successfully',
      entriesRemoved: cacheSize
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cacheEntries = Array.from(membersCache.entries()).map(([key, entry]) => ({
      key,
      age: Math.round((Date.now() - entry.timestamp) / 1000),
      expiresIn: Math.round((entry.expires - Date.now()) / 1000),
      dataSize: JSON.stringify(entry.data).length
    }));
    
    return NextResponse.json({
      totalEntries: membersCache.size,
      entries: cacheEntries
    });
  } catch (error) {
    console.error('Cache status error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}