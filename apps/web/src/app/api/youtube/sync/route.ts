import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { TranscriptService } from '@/lib/youtube/transcript-service';
import { adminFirestore } from '@/lib/firebase/admin';

const CHANNEL_ID = 'UCb435cXWG9w_iT-SPHZcsvw';

// Helper function to remove undefined values from objects
const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }
  return cleaned;
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting YouTube sync process...');
    
    // Get Firestore instance
    const db = adminFirestore();
    if (!db) {
      console.error("Firebase admin not initialized");
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    // Get YouTube service
    const youtubeService = getYouTubeService();
    
    // Test connection first
    console.log('🧪 Testing YouTube connection...');
    const connectionTest = await youtubeService.testConnection();
    
    if (!connectionTest.success) {
      console.error('❌ YouTube connection test failed:', connectionTest.error);
      return NextResponse.json(
        { 
          error: 'YouTube connection failed', 
          details: connectionTest.error,
          authMethod: connectionTest.authMethod,
          suggestion: 'Check YouTube API credentials and authentication'
        },
        { status: 500 }
      );
    }
    
    console.log(`✅ YouTube connection successful using ${connectionTest.authMethod}`);
    
    // Fetch videos from YouTube channel
    console.log(`📡 Fetching videos from YouTube channel: ${CHANNEL_ID}`);
    const result = await youtubeService.fetchChannelVideos(CHANNEL_ID, 50);
    
    if (!result.success) {
      console.error('❌ Failed to fetch YouTube videos:', result.error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch YouTube videos', 
          details: result.error,
          authMethod: result.authMethod,
          channelId: CHANNEL_ID
        },
        { status: 500 }
      );
    }
    
    const { videos, channel } = result;
    console.log(`✅ Fetched ${videos?.length || 0} videos from YouTube`);
    
    // Initialize transcript service with OAuth2 client (force OAuth2 for captions)
    // Make sure we use OAuth2 for transcript fetching since service accounts may not have access
    // Ensure OAuth2 client has proper tokens for captions API
    if (youtubeService.oauth2Client.credentials?.refresh_token && !youtubeService.oauth2Client.credentials?.access_token) {
      console.log('🔄 Refreshing OAuth2 token for transcript service...');
      try {
        const { credentials } = await youtubeService.oauth2Client.refreshAccessToken();
        youtubeService.oauth2Client.setCredentials(credentials);
        console.log('✅ OAuth2 token refreshed for transcript service');
      } catch (refreshError) {
        console.warn('⚠️ Could not refresh OAuth2 token for transcripts:', refreshError);
      }
    }
    
    const transcriptService = new TranscriptService(youtubeService.oauth2Client);
    
    // Store videos in Firestore (using the pbl-backend database)
    const batch = db.batch();
    const videosCollection = db.collection('videos-youtube');
    
    const processedVideos = [];
    
    for (const video of videos || []) {
      try {
        console.log(`📝 Processing video: ${video.title}`);
        
        // Check if video already exists in database to preserve transcript data
        const existingVideoQuery = await videosCollection.where('youtubeId', '==', video.id).get();
        let existingTranscriptData: any = {};
        
        if (!existingVideoQuery.empty) {
          const existingVideo = existingVideoQuery.docs[0].data();
          // Preserve existing transcript data
          if (existingVideo.transcript && existingVideo.transcriptFetched) {
            existingTranscriptData = {
              transcript: existingVideo.transcript,
              transcriptFetched: existingVideo.transcriptFetched,
              transcriptMethod: existingVideo.transcriptMethod,
              transcriptUpdatedAt: existingVideo.transcriptUpdatedAt
            };
            console.log(`✅ Preserving existing transcript for video: ${video.id}`);
          }
        }
        
        // Only fetch transcript if we don't already have one
        let newTranscriptData: any = {};
        if (!(existingTranscriptData as any).transcript) {
          console.log(`🔍 No existing transcript found, attempting to fetch for video: ${video.id}`);
          
          try {
            const transcriptResult = await transcriptService.fetchTranscript(video.id);
            
            if (transcriptResult.success && transcriptResult.transcript) {
              newTranscriptData = {
                transcript: transcriptResult.transcript,
                transcriptFetched: true,
                transcriptMethod: transcriptResult.method || 'unknown',
                transcriptUpdatedAt: new Date().toISOString()
              };
              console.log(`✅ New transcript fetched for video: ${video.id} (method: ${transcriptResult.method})`);
            } else {
              console.log(`ℹ️ No transcript available for video: ${video.id} - ${transcriptResult.error}`);
              // Don't set transcript fields if fetch failed - let them remain undefined
            }
          } catch (transcriptError) {
            console.warn(`⚠️ Could not fetch transcript for video ${video.id}:`, transcriptError);
            // Don't set transcript fields if fetch failed - let them remain undefined
          }
        }
        
        // Prepare video document with only defined values
        const videoDoc = removeUndefined({
          // Basic video info
          youtubeId: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          publishedAt: video.publishedAt,
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          url: video.url,
          studioUrl: video.studioUrl,
          
          // Video metadata
          tags: video.tags || [],
          categoryId: video.categoryId,
          defaultLanguage: video.defaultLanguage,
          duration: video.duration,
          dimension: video.dimension,
          definition: video.definition,
          caption: video.caption,
          
          // Statistics
          viewCount: video.viewCount || 0,
          likeCount: video.likeCount || 0,
          dislikeCount: video.dislikeCount || 0,
          favoriteCount: video.favoriteCount || 0,
          commentCount: video.commentCount || 0,
          
          // Status
          uploadStatus: video.uploadStatus,
          privacyStatus: video.privacyStatus,
          license: video.license,
          embeddable: video.embeddable,
          publicStatsViewable: video.publicStatsViewable,
          
          // Transcript data (preserve existing or add new)
          ...existingTranscriptData,
          ...newTranscriptData,
          
          // Sync metadata
          syncedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          source: 'youtube_sync'
        });
        
        const docRef = videosCollection.doc(video.id);
        batch.set(docRef, videoDoc, { merge: true });
        
        processedVideos.push({
          id: video.id,
          title: video.title,
          transcriptFetched: (existingTranscriptData as any).transcriptFetched || (newTranscriptData as any).transcriptFetched || false,
          transcriptMethod: (existingTranscriptData as any).transcriptMethod || (newTranscriptData as any).transcriptMethod || 'none',
          transcriptStatus: (existingTranscriptData as any).transcript ? 'preserved' : 
                          (newTranscriptData as any).transcript ? 'newly_fetched' : 'none'
        });
        
      } catch (videoError) {
        console.error(`❌ Error processing video ${video.id}:`, videoError);
      }
    }
    
    // Commit batch write
    console.log(`💾 Saving ${processedVideos.length} videos to Firestore...`);
    await batch.commit();
    
    // Also store channel info if available
    if (channel) {
      const channelDoc = removeUndefined({
        channelId: channel.id,
        title: channel.title,
        description: channel.description,
        customUrl: channel.customUrl,
        publishedAt: channel.publishedAt,
        thumbnails: channel.thumbnails,
        country: channel.country,
        viewCount: channel.viewCount || 0,
        subscriberCount: channel.subscriberCount || 0,
        videoCount: channel.videoCount || 0,
        syncedAt: new Date().toISOString(),
        lastSyncedVideoCount: processedVideos.length
      });
      
      await db.collection('youtube-channels').doc(CHANNEL_ID).set(channelDoc, { merge: true });
    }
    
    console.log(`✅ YouTube sync completed successfully`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${processedVideos.length} videos`,
      videosProcessed: processedVideos.length,
      channelInfo: channel ? {
        title: channel.title,
        videoCount: channel.videoCount,
        subscriberCount: channel.subscriberCount
      } : null,
      processedVideos
    });
    
  } catch (error: any) {
    console.error('❌ Error in YouTube sync:', error);
    
    // Provide more detailed error information
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code,
      status: error.status,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : undefined
    };
    
    console.error('Full error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during YouTube sync', 
        details: error.message || 'Unknown error',
        fullError: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

