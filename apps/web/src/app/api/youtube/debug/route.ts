import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    console.log('🔍 Debugging YouTube video data...');
    
    const videosRef = db.collection('videos-youtube');
    const snapshot = await videosRef.get();
    
    const videos: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      videos.push({
        id: doc.id,
        ...data
      });
    });
    
    // Analyze privacy statuses
    const privacyStats = {
      public: videos.filter(v => v.privacyStatus?.toLowerCase() === 'public').length,
      private: videos.filter(v => v.privacyStatus?.toLowerCase() === 'private').length,
      unlisted: videos.filter(v => v.privacyStatus?.toLowerCase() === 'unlisted').length,
      members: videos.filter(v => v.privacyStatus?.toLowerCase() === 'members').length,
      unknown: videos.filter(v => !v.privacyStatus).length,
    };
    
    // Analyze durations and shorts
    const durationStats = {
      shorts: 0,
      videos: 0,
      unknown: 0
    };
    
    videos.forEach(video => {
      if (!video.duration) {
        durationStats.unknown++;
        return;
      }
      
      const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) {
        durationStats.unknown++;
        return;
      }
      
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      if (totalSeconds <= 60) {
        durationStats.shorts++;
      } else {
        durationStats.videos++;
      }
    });
    
    // Sample privacy statuses
    const privacyStatusSamples = [...new Set(videos.map(v => v.privacyStatus))].filter(Boolean);
    
    // Calculate total stats
    const totalViews = videos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + (video.commentCount || 0), 0);
    
    return NextResponse.json({
      success: true,
      summary: {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalComments,
        averageViews: Math.round(totalViews / videos.length)
      },
      privacyStats,
      durationStats,
      privacyStatusSamples,
      sampleVideos: videos.slice(0, 3).map(v => ({
        id: v.id,
        title: v.title,
        privacyStatus: v.privacyStatus,
        duration: v.duration,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        publishedAt: v.publishedAt
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Error debugging YouTube data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug YouTube data',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 