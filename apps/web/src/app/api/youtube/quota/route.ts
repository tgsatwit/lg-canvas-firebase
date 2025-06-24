import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { createScopedLogger } from '@/utils/logger';

const logger = createScopedLogger('api/youtube/quota');

export async function GET(request: NextRequest) {
  try {
    // Get YouTube tokens from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    
    if (!accessToken?.value) {
      return NextResponse.json(
        { error: 'YouTube authentication required' },
        { status: 401 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken.value,
      token_type: 'Bearer',
    });

    // Get YouTube client
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    try {
      // Try to get channel info to verify authentication
      const channelResponse = await youtube.channels.list({
        part: ['statistics', 'contentDetails', 'status'],
        mine: true,
      });

      const channel = channelResponse.data.items?.[0];
      
      if (!channel) {
        throw new Error('No channel found');
      }

      // Get recent uploads to check quota usage
      const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
      
      let recentUploads: any[] = [];
      if (uploadsPlaylistId) {
        const playlistResponse = await youtube.playlistItems.list({
          part: ['snippet'],
          playlistId: uploadsPlaylistId,
          maxResults: 50,
        });

        recentUploads = playlistResponse.data.items || [];
      }

      // Count uploads in last 24 hours
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const uploadsLast24Hours = recentUploads.filter(item => {
        const publishedAt = new Date(item.snippet?.publishedAt || '');
        return publishedAt > last24Hours;
      });

      // Count uploads in last 7 days
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const uploadsLast7Days = recentUploads.filter(item => {
        const publishedAt = new Date(item.snippet?.publishedAt || '');
        return publishedAt > last7Days;
      });

      return NextResponse.json({
        channel: {
          title: channel.snippet?.title,
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        },
        quotaInfo: {
          uploadsLast24Hours: uploadsLast24Hours.length,
          uploadsLast7Days: uploadsLast7Days.length,
          recentUploads: uploadsLast24Hours.map(item => ({
            title: item.snippet?.title,
            publishedAt: item.snippet?.publishedAt,
            videoId: item.snippet?.resourceId?.videoId,
          })),
        },
        status: 'active',
        timestamp: new Date().toISOString(),
      });

    } catch (apiError: any) {
      logger.error('YouTube API error:', { error: String(apiError) });
      
      // Parse quota error
      if (apiError.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        return NextResponse.json({
          error: 'YouTube API quota exceeded',
          quotaExceeded: true,
          details: 'Your YouTube API quota has been exceeded. Please wait until it resets.',
        }, { status: 429 });
      }

      throw apiError;
    }

  } catch (error) {
    logger.error('Error checking YouTube quota:', { error: String(error) });
    
    return NextResponse.json(
      { 
        error: 'Failed to check YouTube quota',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 