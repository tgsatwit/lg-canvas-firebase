import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('YouTube OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/videos?error=youtube_auth_failed', request.url)
      );
    }
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }
    
    // Exchange code for tokens
    const youtubeService = getYouTubeService();
    let tokens;
    
    try {
      tokens = await youtubeService.getTokens(code);
    } catch (error: any) {
      console.error('Token exchange failed:', error.message);
      
      // Handle specific OAuth errors
      if (error.message.includes('invalid_grant')) {
        return NextResponse.redirect(
          new URL('/dashboard/videos?error=youtube_auth_expired', request.url)
        );
      }
      
      return NextResponse.redirect(
        new URL('/dashboard/videos?error=youtube_auth_error', request.url)
      );
    }
    
    // Store tokens securely
    // For now, we'll store in HTTP-only cookies
    // In production, consider storing in database with encryption
    const cookieStore = await cookies();
    
    // Store access token (expires in 1 hour)
    cookieStore.set('youtube_access_token', tokens.access_token || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    
    // Store refresh token (long-lived)
    if (tokens.refresh_token) {
      cookieStore.set('youtube_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }
    
    // Redirect back to videos page with success message
    return NextResponse.redirect(
      new URL('/dashboard/videos?youtube_auth=success', request.url)
    );
    
  } catch (error) {
    console.error('Error handling YouTube OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/videos?error=youtube_auth_error', request.url)
    );
  }
} 