import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { getServerUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DirectYouTubeUploader } from '@/lib/youtube/direct-upload';

export async function GET(request: NextRequest) {
  // Allow GET requests for easier testing
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Testing direct YouTube upload system...');

    // Test YouTube API connectivity
    const uploader = new DirectYouTubeUploader();
    const testResult = await uploader.testConnection();

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API connection failed',
        details: testResult.error,
        architecture: 'direct-nextjs-youtube'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Direct YouTube upload system is working correctly',
      channelTitle: testResult.channelTitle,
      subscriberCount: testResult.subscriberCount,
      architecture: 'direct-nextjs-youtube',
      capabilities: [
        'OAuth2 authentication working',
        'YouTube API connectivity verified',
        'Channel access confirmed',
        'Ready for direct uploads up to 256GB'
      ]
    });

  } catch (error) {
    console.error('YouTube test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      architecture: 'direct-nextjs-youtube'
    }, { status: 500 });
  }
}

// Helper function to get stored YouTube tokens
async function getStoredYouTubeTokens() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    
    if (accessToken?.value) {
      return {
        access_token: accessToken.value,
        refresh_token: refreshToken?.value,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
    }
    
    // Fallback to environment variables for testing
    if (process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN) {
      return {
        access_token: process.env.YOUTUBE_ACCESS_TOKEN,
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
    }
  } catch (error) {
    console.error('Error getting YouTube tokens:', error);
  }
  
  return null;
} 