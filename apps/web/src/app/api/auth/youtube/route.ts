import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

export async function GET(request: NextRequest) {
  try {
    // Get the YouTube service
    const youtubeService = getYouTubeService();
    
    // Get the authorization URL with updated scopes
    const authUrl = youtubeService.getAuthUrl();
    
    console.log('Redirecting to YouTube OAuth with updated scopes...');
    
    // Redirect to YouTube OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error: any) {
    console.error('Error initiating YouTube OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate YouTube authentication', details: error.message },
      { status: 500 }
    );
  }
} 