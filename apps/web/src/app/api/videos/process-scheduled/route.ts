import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';

// This endpoint should be called by a cron job/scheduler
// It processes all videos scheduled for upload
export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (e.g., from a cron job)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get Firestore instance
    const firestoreAdmin = adminFirestore();
    if (!firestoreAdmin) {
      console.error("Firebase admin not initialized");
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    const collectionName = process.env.FIREBASE_VIDEOS_COLLECTION || 'videos-master';
    const now = new Date();
    
    // Query for videos scheduled for upload
    const scheduledVideos = await firestoreAdmin
      .collection(collectionName)
      .where('upload_scheduled', '==', 'Yes')
      .where('upload_time', '<=', now.toISOString())
      .where('youtubeStatus', '==', 'Scheduled for YouTube')
      .get();
    
    console.log(`Found ${scheduledVideos.size} videos scheduled for upload`);
    
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as any[]
    };
    
    // Get YouTube tokens
    const tokens = await getStoredYouTubeTokens();
    
    if (!tokens) {
      return NextResponse.json(
        { 
          error: 'YouTube authentication required',
          message: 'No YouTube tokens found. Please authenticate first.'
        },
        { status: 401 }
      );
    }
    
    const youtubeService = getYouTubeService();
    youtubeService.setCredentials(tokens);
    
    // Process each scheduled video
    for (const doc of scheduledVideos.docs) {
      results.processed++;
      const videoData = doc.data();
      const videoId = doc.id;
      
      try {
        console.log(`Processing scheduled upload for video ${videoId}`);
        
        // Check required fields
        if (!videoData.gcpLink && !videoData.gcp_link) {
          throw new Error('No GCP link found');
        }
        
        if (!videoData.yt_title || !videoData.yt_description) {
          throw new Error('Missing YouTube metadata');
        }
        
        const gcpLink = videoData.gcpLink || videoData.gcp_link;
        
        // Upload to YouTube
        const { videoId: youtubeVideoId, youtubeUrl } = await youtubeService.uploadVideoFromGCS(
          gcpLink,
          {
            title: videoData.yt_title,
            description: videoData.yt_description,
            tags: videoData.yt_tags || [],
            privacyStatus: videoData.yt_privacyStatus || 'unlisted',
            categoryId: '28', // Science & Technology
          }
        );
        
        // Update Firestore with success
        await doc.ref.update({
          youtube_link: youtubeUrl,
          youtubeLink: youtubeUrl,
          youtubeId: youtubeVideoId,
          youtube_id: youtubeVideoId,
          youtubeStatus: 'Published on YouTube',
          youtube_status: 'Published on YouTube',
          upload_scheduled: null,
          upload_time: null,
          uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        results.succeeded++;
        console.log(`Successfully uploaded video ${videoId} to YouTube`);
        
      } catch (error: any) {
        results.failed++;
        console.error(`Failed to upload video ${videoId}:`, error);
        
        results.errors.push({
          videoId,
          error: error.message || String(error)
        });
        
        // Update status to indicate failure
        await doc.ref.update({
          youtubeStatus: 'upload failed',
          youtube_status: 'upload failed',
          upload_error: error.message || String(error),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Error processing scheduled uploads:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled uploads', details: String(error) },
      { status: 500 }
    );
  }
}

// Get stored YouTube tokens from cookies or environment
async function getStoredYouTubeTokens() {
  try {
    // First try cookies (for manual trigger from UI)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    
    if (accessToken?.value) {
      return {
        access_token: accessToken.value,
        refresh_token: refreshToken?.value,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
    }
    
    // For cron jobs, use environment variables
    if (process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN) {
      return {
        access_token: process.env.YOUTUBE_ACCESS_TOKEN,
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
    }
  } catch (error) {
    console.error('Error getting YouTube tokens:', error);
  }
  
  return null;
} 