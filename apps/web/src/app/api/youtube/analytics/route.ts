import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching YouTube Analytics data...');
    
    const youtubeService = getYouTubeService();
    
    // Test connection first
    const connectionTest = await youtubeService.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          error: 'YouTube authentication required',
          details: connectionTest.error,
          authUrl: youtubeService.getAuthUrl()
        },
        { status: 401 }
      );
    }

    // Fetch weekly analytics using the YouTube service
    const analyticsResult = await youtubeService.fetchWeeklyAnalytics();
    
    if (!analyticsResult.success) {
      // Check if it's a permission error
      if (analyticsResult.error?.includes('insufficient') || analyticsResult.error?.includes('forbidden')) {
        return NextResponse.json({
          error: 'YouTube Analytics permission required',
          details: 'Your YouTube channel may not have Analytics API access enabled, or additional permissions are needed.',
          suggestion: 'Make sure your YouTube channel is eligible for Analytics API access and has sufficient watch time/subscribers.',
          authUrl: youtubeService.getAuthUrl()
        }, { status: 403 });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch YouTube Analytics',
        details: analyticsResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analytics: analyticsResult.analytics
    });

  } catch (error: any) {
    console.error('❌ Error fetching YouTube Analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch YouTube Analytics',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 