import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 YouTube Debug endpoint called');
    const youtubeService = getYouTubeService();
    
    // Check environment variables
    const envCheck = {
      clientId: !!process.env.YOUTUBE_CLIENT_ID,
      clientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
      redirectUrl: process.env.YOUTUBE_REDIRECT_URL,
    };

    // Check cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    const tokenExpiry = cookieStore.get('youtube_token_expiry');

    const cookieCheck = {
      hasAccessToken: !!accessToken?.value,
      hasRefreshToken: !!refreshToken?.value,
      tokenExpiry: tokenExpiry?.value,
      accessTokenLength: accessToken?.value?.length || 0,
    };

    // Try to load credentials and test connection
    let connectionTest = null;
    let serviceAccountTest = null;
    try {
      console.log('🧪 Testing service account...');
      // Test service account first
      serviceAccountTest = await youtubeService.testServiceAccountConnection();
      console.log('Service account test result:', serviceAccountTest);
      
      // Test OAuth2 if service account fails
      console.log('🧪 Testing OAuth2...');
      const hasCredentials = await youtubeService.loadCredentialsFromCookies(cookieStore);
      if (hasCredentials) {
        connectionTest = await youtubeService.testConnection();
        console.log('OAuth2 test result:', connectionTest);
      } else {
        console.log('No OAuth2 credentials found');
      }
    } catch (error: any) {
      console.error('Error in debug test:', error);
      connectionTest = { error: error.message };
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      cookies: cookieCheck,
      serviceAccount: serviceAccountTest,
      connection: connectionTest,
      authUrl: youtubeService.getAuthUrl(),
      instructions: {
        step1: "Environment variables are configured",
        step2: serviceAccountTest?.success ? "Service account authentication working!" : (accessToken ? "You have OAuth2 tokens" : "You need to authenticate"),
        step3: (serviceAccountTest?.success || connectionTest?.success) ? "Connection successful" : "Use the authUrl to authenticate",
        preferredMethod: serviceAccountTest?.success ? "service_account" : "oauth2"
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 