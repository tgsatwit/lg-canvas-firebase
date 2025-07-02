import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    
    if (!searchTerm.trim()) {
      return NextResponse.json({
        success: true,
        videos: [],
        total: 0
      });
    }
    
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    console.log(`🔍 Searching YouTube videos for: "${searchTerm}"`);
    
    // Note: Firestore doesn't support full-text search natively
    // For production, you might want to use Algolia, Elasticsearch, or similar
    // For now, we'll get all videos and filter server-side
    
    const videosRef = db.collection('videos-youtube');
    const snapshot = await videosRef
      .orderBy('publishedAt', 'desc')
      .limit(100) // Get more videos to search through
      .get();
    
    const allVideos: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      allVideos.push({
        id: doc.id,
        ...data
      });
    });
    
    // Filter videos based on search term
    const searchTermLower = searchTerm.toLowerCase();
    const filteredVideos = allVideos
      .filter(video => 
        video.title?.toLowerCase().includes(searchTermLower) ||
        video.description?.toLowerCase().includes(searchTermLower) ||
        (video.tags && video.tags.some((tag: string) => tag.toLowerCase().includes(searchTermLower)))
      )
      .slice(0, limit);
    
    console.log(`✅ Found ${filteredVideos.length} matching videos`);
    
    return NextResponse.json({
      success: true,
      videos: filteredVideos,
      total: filteredVideos.length,
      searchTerm: searchTerm
    });
    
  } catch (error: any) {
    console.error('❌ Error searching YouTube videos:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search YouTube videos',
        details: error.message 
      },
      { status: 500 }
    );
  }
}