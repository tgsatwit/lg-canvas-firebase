import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

export async function GET(request: NextRequest) {
  try {
    // Check if this is a direct browser request (has Accept: text/html)
    const acceptHeader = request.headers.get('accept') || '';
    const isDirectBrowserRequest = acceptHeader.includes('text/html');
    
    // Get the YouTube service
    const youtubeService = getYouTubeService();
    
    // Get the authorization URL with updated scopes
    const authUrl = youtubeService.getAuthUrl();
    
    if (isDirectBrowserRequest) {
      // Direct browser request - redirect to YouTube OAuth
      console.log('Direct browser request - redirecting to YouTube OAuth...');
      return NextResponse.redirect(authUrl);
    } else {
      // AJAX request - return auth URL as JSON
      console.log('AJAX request - returning auth URL as JSON...');
      return NextResponse.json({ authUrl });
    }
    
  } catch (error: any) {
    console.error('Error initiating YouTube OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate YouTube authentication', details: error.message },
      { status: 500 }
    );
  }
} 