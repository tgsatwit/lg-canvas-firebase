import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 Generating YouTube authentication URL...');
    
    const youtubeService = getYouTubeService();
    const authUrl = youtubeService.getAuthUrl();
    
    console.log('✅ YouTube auth URL generated');
    
    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Visit this URL to authenticate with YouTube'
    });
    
  } catch (error: any) {
    console.error('❌ Error generating YouTube auth URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate auth URL', 
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 