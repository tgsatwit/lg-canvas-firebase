import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { google } from 'googleapis';

const youtube = google.youtube('v3');

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing YouTube API permissions...');
    
    // Get YouTube service
    const youtubeService = getYouTubeService();
    
    // Check OAuth2 credentials
    const oauth2Client = youtubeService.oauth2Client;
    console.log('OAuth2 credentials available:', !!oauth2Client.credentials);
    console.log('Access token available:', !!oauth2Client.credentials?.access_token);
    console.log('Refresh token available:', !!oauth2Client.credentials?.refresh_token);
    
    // Try to refresh token if needed
    if (oauth2Client.credentials?.refresh_token && !oauth2Client.credentials?.access_token) {
      console.log('🔄 Refreshing OAuth2 token...');
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        console.log('✅ Token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        return NextResponse.json({
          success: false,
          error: 'Token refresh failed',
          details: refreshError instanceof Error ? refreshError.message : String(refreshError)
        }, { status: 500 });
      }
    }
    
    // Test basic channel access
    console.log('🧪 Testing channel access...');
    let channelAccess = false;
    try {
      const channelResponse = await youtube.channels.list({
        auth: oauth2Client,
        part: ['snippet'],
        mine: true,
      });
      channelAccess = !!channelResponse.data.items?.[0];
      console.log('✅ Channel access successful');
    } catch (channelError) {
      console.warn('⚠️ Channel access failed:', channelError instanceof Error ? channelError.message : String(channelError));
    }
    
    // Test captions list access with a known video
    console.log('🧪 Testing captions list access...');
    const testVideoId = 'VBmaYoFZwiY'; // One of the Pilates videos
    let captionsAccess = false;
    let captionsError = '';
    let availableCaptions: any[] = [];
    
    try {
      const captionsResponse = await youtube.captions.list({
        auth: oauth2Client,
        part: ['snippet'],
        videoId: testVideoId,
      });
      
      captionsAccess = true;
      availableCaptions = captionsResponse.data.items || [];
      console.log(`✅ Captions list successful - found ${availableCaptions.length} caption tracks`);
      
    } catch (captionsErr: any) {
      console.warn('⚠️ Captions list failed:', captionsErr.message);
      captionsError = captionsErr.message;
    }
    
    // Test captions download if we have captions
    let downloadAccess = false;
    let downloadError = '';
    
    if (availableCaptions.length > 0) {
      console.log('🧪 Testing captions download access...');
      try {
        const captionId = availableCaptions[0].id;
        const downloadResponse = await youtube.captions.download({
          auth: oauth2Client,
          id: captionId,
          tfmt: 'srt',
        });
        
        downloadAccess = !!downloadResponse.data;
        console.log('✅ Captions download successful');
        
      } catch (downloadErr: any) {
        console.warn('⚠️ Captions download failed:', downloadErr.message);
        downloadError = downloadErr.message;
      }
    }
    
    return NextResponse.json({
      success: true,
      permissions: {
        oauth2Available: !!oauth2Client.credentials,
        accessToken: !!oauth2Client.credentials?.access_token,
        refreshToken: !!oauth2Client.credentials?.refresh_token,
        channelAccess,
        captionsListAccess: captionsAccess,
        captionsDownloadAccess: downloadAccess
      },
      testResults: {
        testVideoId,
        availableCaptionsCount: availableCaptions.length,
        availableCaptions: availableCaptions.map(cap => ({
          id: cap.id,
          language: cap.snippet?.language,
          name: cap.snippet?.name,
          trackKind: cap.snippet?.trackKind
        })),
        captionsError,
        downloadError
      }
    });
    
  } catch (error: any) {
    console.error('❌ Permission test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Permission test failed',
      details: error.message
    }, { status: 500 });
  }
}