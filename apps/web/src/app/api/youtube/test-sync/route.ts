import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

const CHANNEL_ID = 'UCb435cXWG9w_iT-SPHZcsvw';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing YouTube service...');
    
    // Get YouTube service
    const youtubeService = getYouTubeService();
    
    console.log('🔍 Testing connection...');
    const connectionTest = await youtubeService.testConnection();
    console.log('Connection test result:', connectionTest);
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'YouTube service connection failed',
        details: connectionTest.error,
        authMethod: connectionTest.authMethod,
        suggestion: 'Check YouTube API credentials and authentication'
      }, { status: 500 });
    }
    
    console.log(`📡 Testing video fetch from channel: ${CHANNEL_ID}`);
    const result = await youtubeService.fetchChannelVideos(CHANNEL_ID, 5); // Just fetch 5 videos for testing
    
    console.log('Fetch result:', {
      success: result.success,
      videosCount: result.videos?.length || 0,
      channelTitle: result.channel?.title,
      error: result.error
    });
    
    return NextResponse.json({
      success: true,
      connectionTest,
      fetchTest: {
        success: result.success,
        videosCount: result.videos?.length || 0,
        channelTitle: result.channel?.title,
        error: result.error,
        authMethod: result.authMethod,
        sampleVideo: result.videos?.[0] ? {
          id: result.videos[0].id,
          title: result.videos[0].title,
          publishedAt: result.videos[0].publishedAt
        } : null
      }
    });
    
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}