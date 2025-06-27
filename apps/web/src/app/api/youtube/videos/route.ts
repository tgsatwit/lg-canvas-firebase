import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { getServerUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const pageToken = searchParams.get('pageToken');
    const channelId = searchParams.get('channelId') || process.env.YOUTUBE_CHANNEL_ID || undefined; // For service account use

    const youtubeService = getYouTubeService();
    
    // Try service account first
    console.log('🎬 Attempting to fetch videos with service account...');
    const serviceAccountResult = await youtubeService.fetchChannelVideos(channelId, maxResults);
    
    if (serviceAccountResult.success) {
      console.log('✅ Successfully fetched videos using service account');
      return NextResponse.json({
        success: true,
        channel: serviceAccountResult.channel,
        videos: serviceAccountResult.videos,
        authMethod: 'service_account',
        pagination: {
          // Note: Service account method doesn't support pagination yet
          // Would need to implement with pageToken
          totalResults: serviceAccountResult.videos?.length,
          resultsPerPage: maxResults,
        }
      });
    }

    console.log('⚠️ Service account failed, trying OAuth2:', serviceAccountResult.error);
    
    // Fall back to OAuth2 method
    const cookieStore = await cookies();
    const hasCredentials = await youtubeService.loadCredentialsFromCookies(cookieStore);
    
    if (!hasCredentials) {
      const authUrl = youtubeService.getAuthUrl();
      return NextResponse.json(
        { 
          error: "YouTube authentication required",
          authUrl: authUrl,
          serviceAccountError: serviceAccountResult.error,
          suggestion: "Service account authentication failed. You can either fix the service account setup or use OAuth2 authentication."
        },
        { status: 401 }
      );
    }

    // Use the existing OAuth2 method
    const { google } = require('googleapis');
    const youtube = google.youtube('v3');

    // First, get the channel information to get the uploads playlist
    const channelResponse = await youtube.channels.list({
      auth: youtubeService['oauth2Client'],
      part: ['contentDetails', 'snippet', 'statistics'],
      mine: true,
    });

    const channel = channelResponse.data.items?.[0];
    if (!channel) {
      return NextResponse.json(
        { error: "No YouTube channel found" },
        { status: 404 }
      );
    }

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      return NextResponse.json(
        { error: "No uploads playlist found" },
        { status: 404 }
      );
    }

    // Get videos from the uploads playlist
    const playlistResponse = await youtube.playlistItems.list({
      auth: youtubeService['oauth2Client'],
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: maxResults,
      pageToken: pageToken || undefined,
    });

    const playlistItems = playlistResponse.data.items || [];
    
    // Get detailed video information for all videos
    const videoIds = playlistItems
      .map((item: any) => item.contentDetails?.videoId)
      .filter((id: any): id is string => Boolean(id));

    let videos: any[] = [];
    
    if (videoIds.length > 0) {
      const videosResponse = await youtube.videos.list({
        auth: youtubeService['oauth2Client'],
        part: ['snippet', 'statistics', 'status', 'contentDetails'],
        id: videoIds,
      } as any);

      videos = (videosResponse.data.items || []).map((video: any) => ({
        id: video.id,
        title: video.snippet?.title || 'Untitled',
        description: video.snippet?.description || '',
        thumbnail: {
          default: video.snippet?.thumbnails?.default?.url,
          medium: video.snippet?.thumbnails?.medium?.url,
          high: video.snippet?.thumbnails?.high?.url,
          standard: video.snippet?.thumbnails?.standard?.url,
          maxres: video.snippet?.thumbnails?.maxres?.url,
        },
        publishedAt: video.snippet?.publishedAt,
        channelId: video.snippet?.channelId,
        channelTitle: video.snippet?.channelTitle,
        tags: video.snippet?.tags || [],
        categoryId: video.snippet?.categoryId,
        defaultLanguage: video.snippet?.defaultLanguage,
        
        // Statistics
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        dislikeCount: parseInt(video.statistics?.dislikeCount || '0'),
        favoriteCount: parseInt(video.statistics?.favoriteCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        
        // Status
        uploadStatus: video.status?.uploadStatus,
        privacyStatus: video.status?.privacyStatus,
        license: video.status?.license,
        embeddable: video.status?.embeddable,
        publicStatsViewable: video.status?.publicStatsViewable,
        
        // Content Details
        duration: video.contentDetails?.duration,
        dimension: video.contentDetails?.dimension,
        definition: video.contentDetails?.definition,
        caption: video.contentDetails?.caption,
        
        // Video URL
        url: `https://www.youtube.com/watch?v=${video.id}`,
        
        // Studio URL
        studioUrl: `https://studio.youtube.com/video/${video.id}/edit`,
      }));
    }

    // Channel information
    const channelInfo = {
      id: channel.id,
      title: channel.snippet?.title,
      description: channel.snippet?.description,
      customUrl: channel.snippet?.customUrl,
      publishedAt: channel.snippet?.publishedAt,
      thumbnails: channel.snippet?.thumbnails,
      country: channel.snippet?.country,
      
      // Statistics
      viewCount: parseInt(channel.statistics?.viewCount || '0'),
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount,
      videoCount: parseInt(channel.statistics?.videoCount || '0'),
    };

    return NextResponse.json({
      success: true,
      channel: channelInfo,
      videos,
      authMethod: 'oauth2',
      pagination: {
        nextPageToken: playlistResponse.data.nextPageToken,
        prevPageToken: playlistResponse.data.prevPageToken,
        totalResults: playlistResponse.data.pageInfo?.totalResults,
        resultsPerPage: playlistResponse.data.pageInfo?.resultsPerPage,
      }
    });

  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error);
    
    // Handle specific YouTube API errors
    if (error.response?.status === 401) {
      const youtubeService = getYouTubeService();
      const authUrl = youtubeService.getAuthUrl();
      return NextResponse.json(
        { 
          error: "YouTube authentication required",
          authUrl: authUrl,
          details: error.message
        },
        { status: 401 }
      );
    }

    if (error.response?.status === 403) {
      return NextResponse.json(
        { 
          error: "YouTube API quota exceeded or access forbidden",
          details: error.message
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to fetch YouTube videos", 
        details: error.message 
      },
      { status: 500 }
    );
  }
} 