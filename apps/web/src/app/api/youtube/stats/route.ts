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
    
    console.log('📊 Calculating video statistics summary with trends...');
    
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
    
    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalVideos: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          averageViews: 0,
          trends: {
            viewsTrend: 0,
            likesTrend: 0,
            commentsTrend: 0,
            videosTrend: 0
          }
        }
      });
    }

    // Get current date and calculate date ranges
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    // Separate videos by month published
    const currentMonthVideos = videos.filter(video => {
      const publishDate = new Date(video.publishedAt);
      return publishDate >= currentMonth;
    });
    
    const lastMonthVideos = videos.filter(video => {
      const publishDate = new Date(video.publishedAt);
      return publishDate >= lastMonth && publishDate < currentMonth;
    });
    
    // Calculate current month stats (convert strings to numbers)
    const currentViews = currentMonthVideos.reduce((sum, video) => sum + (Number(video.viewCount) || 0), 0);
    const currentLikes = currentMonthVideos.reduce((sum, video) => sum + (Number(video.likeCount) || 0), 0);
    const currentComments = currentMonthVideos.reduce((sum, video) => sum + (Number(video.commentCount) || 0), 0);
    const currentVideoCount = currentMonthVideos.length;
    
    // Calculate last month stats (convert strings to numbers)
    const lastViews = lastMonthVideos.reduce((sum, video) => sum + (Number(video.viewCount) || 0), 0);
    const lastLikes = lastMonthVideos.reduce((sum, video) => sum + (Number(video.likeCount) || 0), 0);
    const lastComments = lastMonthVideos.reduce((sum, video) => sum + (Number(video.commentCount) || 0), 0);
    const lastVideoCount = lastMonthVideos.length;
    
    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    const trends = {
      viewsTrend: calculateTrend(currentViews, lastViews),
      likesTrend: calculateTrend(currentLikes, lastLikes),
      commentsTrend: calculateTrend(currentComments, lastComments),
      videosTrend: calculateTrend(currentVideoCount, lastVideoCount)
    };
    
    // Calculate totals (convert strings to numbers)
    const totalViews = videos.reduce((sum, video) => sum + (Number(video.viewCount) || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (Number(video.likeCount) || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + (Number(video.commentCount) || 0), 0);
    const averageViews = Math.round(totalViews / videos.length);
    
    // Find most viewed video (convert strings to numbers for comparison)
    const mostViewedVideo = videos.reduce((max, video) => 
      (Number(video.viewCount) || 0) > (Number(max.viewCount) || 0) ? video : max
    );
    
    console.log('✅ Video statistics with trends calculated');
    
    return NextResponse.json({
      success: true,
      stats: {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        totalComments,
        averageViews,
        mostViewedVideo,
        trends,
        monthlyBreakdown: {
          currentMonth: {
            videos: currentVideoCount,
            views: currentViews,
            likes: currentLikes,
            comments: currentComments
          },
          lastMonth: {
            videos: lastVideoCount,
            views: lastViews,
            likes: lastLikes,
            comments: lastComments
          }
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error calculating video statistics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate video statistics',
        details: error.message 
      },
      { status: 500 }
    );
  }
}