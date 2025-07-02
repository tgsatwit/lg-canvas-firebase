import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing YouTube service connectivity...');
    
    const youtubeService = getYouTubeService();
    
    // Test basic connection
    const connectionTest = await youtubeService.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'Connection test failed',
        details: connectionTest.error,
        authUrl: youtubeService.getAuthUrl(),
        step: 'connection_test'
      }, { status: 401 });
    }
    
    // Test video fetching
    let videoFetchTest = null;
    try {
      const videoResult = await youtubeService.fetchChannelVideos(undefined, 5);
      videoFetchTest = {
        success: videoResult.success,
        videoCount: videoResult.videos?.length || 0,
        error: videoResult.error
      };
    } catch (error: any) {
      videoFetchTest = {
        success: false,
        error: error.message
      };
    }
    
    // Test analytics (but don't fail if it doesn't work)
    let analyticsTest = null;
    try {
      const analyticsResult = await youtubeService.fetchWeeklyAnalytics();
      analyticsTest = {
        success: analyticsResult.success,
        error: analyticsResult.error,
        fallback: analyticsResult.error === 'ANALYTICS_NOT_AVAILABLE' ? true : false
      };
    } catch (error: any) {
      analyticsTest = {
        success: false,
        error: error.message,
        fallback: true
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'YouTube service connectivity test completed',
      results: {
        connection: connectionTest,
        videoFetch: videoFetchTest,
        analytics: analyticsTest
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error testing YouTube service:', error);
    return NextResponse.json({
      success: false,
      error: 'Service test failed',
      details: error.message,
      step: 'general_error'
    }, { status: 500 });
  }
} 