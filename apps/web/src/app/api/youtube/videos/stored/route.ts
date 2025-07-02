import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    console.log(`📚 Fetching ${limit} stored YouTube videos from Firestore...`);
    
    const videosRef = db.collection('videos-youtube');
    const snapshot = await videosRef
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();
    
    const videos: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Fetched ${videos.length} stored YouTube videos`);
    
    return NextResponse.json({
      success: true,
      videos,
      total: videos.length
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