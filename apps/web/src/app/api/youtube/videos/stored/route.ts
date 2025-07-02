import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const all = searchParams.get('all') === 'true';
    const cursor = searchParams.get('cursor');
    
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    console.log(`📚 Fetching stored YouTube videos from Firestore... ${all ? 'ALL' : `limit: ${limit}`}`);
    
    const videosRef = db.collection('videos-youtube');
    let query = videosRef.orderBy('publishedAt', 'desc');
    
    // If cursor is provided, start after that document
    if (cursor && !all) {
      const cursorDoc = await videosRef.doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }
    
    // Apply limit only if not fetching all
    if (!all) {
      query = query.limit(limit);
    }
    
    const snapshot = await query.get();
    
    const videos: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        ...data
      });
    });
    
    // Get total count for pagination info
    let totalCount = videos.length;
    if (!all) {
      const totalSnapshot = await videosRef.select().get();
      totalCount = totalSnapshot.size;
    }
    
    const hasNextPage = !all && videos.length === limit;
    const nextCursor = hasNextPage && videos.length > 0 ? videos[videos.length - 1].id : null;
    
    console.log(`✅ Fetched ${videos.length} stored YouTube videos${all ? ' (ALL)' : ` of ${totalCount} total`}`);
    
    return NextResponse.json({
      success: true,
      videos,
      total: videos.length,
      totalCount,
      hasNextPage,
      nextCursor,
      pagination: {
        limit,
        cursor,
        hasNextPage,
        nextCursor
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching stored YouTube videos:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stored YouTube videos',
        details: error.message 
      },
      { status: 500 }
    );
  }
}