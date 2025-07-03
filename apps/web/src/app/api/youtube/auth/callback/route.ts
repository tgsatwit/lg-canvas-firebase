import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Get base URL for absolute redirects
    const baseUrl = new URL(request.url).origin;

    // Handle OAuth errors
    if (error) {
      console.error('YouTube OAuth error:', error);
      const errorDescription = searchParams.get('error_description') || 'Unknown error';
      return NextResponse.redirect(
        new URL(`/dashboard/videos?error=auth_failed&message=${encodeURIComponent(errorDescription)}`, baseUrl)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/dashboard/videos?error=no_code&message=${encodeURIComponent('No authorization code received')}`, baseUrl)
      );
    }

    // Exchange code for tokens
    const youtubeService = getYouTubeService();
    const tokens = await youtubeService.getTokens(code);

    // Store tokens in HTTP-only cookies
    const cookieStore = await cookies();
    
    // Set secure, HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };

    cookieStore.set('youtube_access_token', tokens.access_token!, cookieOptions);
    
    if (tokens.refresh_token) {
      cookieStore.set('youtube_refresh_token', tokens.refresh_token, cookieOptions);
    }

    // Store additional token metadata
    if (tokens.expiry_date) {
      cookieStore.set('youtube_token_expiry', tokens.expiry_date.toString(), cookieOptions);
    }

    // Test the connection
    youtubeService.setCredentials(tokens);
    const connectionTest = await youtubeService.testConnection();

    if (connectionTest.success) {
      console.log('YouTube authentication successful for:', connectionTest.user?.channelTitle);
      
      // Redirect to the library page with success message
      return NextResponse.redirect(
        new URL(`/dashboard/videos?success=authenticated&channel=${encodeURIComponent(connectionTest.user?.channelTitle || 'YouTube Channel')}`, baseUrl)
      );
    } else {
      console.error('YouTube connection test failed:', connectionTest.error);
      return NextResponse.redirect(
        new URL(`/dashboard/videos?error=connection_failed&message=${encodeURIComponent(connectionTest.error || 'Connection test failed')}`, baseUrl)
      );
    }

  } catch (error: any) {
    console.error('Error in YouTube OAuth callback:', error);
    return NextResponse.redirect(
      `/dashboard/videos?error=callback_error&message=${encodeURIComponent(error.message || 'Authentication failed')}`
    );
  }
} 