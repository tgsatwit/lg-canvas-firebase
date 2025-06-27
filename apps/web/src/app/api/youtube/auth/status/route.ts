import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';
import { getServerUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerUser();
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        error: "User not logged in" 
      }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    const tokenExpiry = cookieStore.get('youtube_token_expiry');

    if (!accessToken?.value) {
      return NextResponse.json({
        authenticated: false,
        error: "No YouTube access token found",
        authUrl: getYouTubeService().getAuthUrl()
      });
    }

    // Set up the YouTube service with stored tokens
    const youtubeService = getYouTubeService();
    const tokens = {
      access_token: accessToken.value,
      refresh_token: refreshToken?.value,
      expiry_date: tokenExpiry?.value ? parseInt(tokenExpiry.value) : undefined,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/youtube'
    };

    youtubeService.setCredentials(tokens);

    // Test the connection
    const connectionTest = await youtubeService.testConnection();

    if (connectionTest.success) {
      return NextResponse.json({
        authenticated: true,
        user: connectionTest.user,
        tokenExpiry: tokenExpiry?.value ? new Date(parseInt(tokenExpiry.value)) : null
      });
    } else {
      // If connection fails, it might be due to expired tokens
      return NextResponse.json({
        authenticated: false,
        error: connectionTest.error,
        authUrl: youtubeService.getAuthUrl(),
        expired: connectionTest.error?.includes('auth') || connectionTest.error?.includes('401')
      });
    }

  } catch (error: any) {
    console.error('Error checking YouTube auth status:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message,
      authUrl: getYouTubeService().getAuthUrl()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerUser();
    
    if (!session) {
      return NextResponse.json({ error: "User not logged in" }, { status: 401 });
    }

    // Clear YouTube tokens from cookies
    const cookieStore = await cookies();
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Expire immediately
    };

    cookieStore.set('youtube_access_token', '', cookieOptions);
    cookieStore.set('youtube_refresh_token', '', cookieOptions);
    cookieStore.set('youtube_token_expiry', '', cookieOptions);

    return NextResponse.json({
      success: true,
      message: "YouTube authentication cleared"
    });

  } catch (error: any) {
    console.error('Error clearing YouTube auth:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 