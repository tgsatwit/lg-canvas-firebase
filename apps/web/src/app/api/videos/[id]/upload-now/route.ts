import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';
import { getServerUser } from '@/lib/auth';
import { createScopedLogger } from "@/utils/logger";

const logger = createScopedLogger("api/videos/upload-now");

// Increase timeout for large file uploads (10 minutes)
export const maxDuration = 600;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { testMode = false } = await request.json().catch(() => ({}));
    
    // Enhanced authentication debugging
    console.log('Checking user authentication...');
    const session = await getServerUser();
    
    // TEMPORARY: Allow uploads even if authentication fails for debugging
    if (!session) {
      console.error('Authentication failed: No valid session found');
      
      // Check if Firebase Admin is initialized
      const firestoreAdmin = adminFirestore();
      console.log('Firebase Admin available:', !!firestoreAdmin);
      
      console.warn('⚠️ TEMPORARY: Bypassing authentication for debugging');
      
      // Continue with a mock session for debugging
      // TODO: Remove this bypass after fixing authentication
    } else {
      console.log('Authentication successful for user:', session.uid);
    }

    logger.info(`Initiating immediate YouTube upload for video ${id}`);

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
    
    console.log(`Uploading video ${id} to YouTube now`);
    
    // Get video document
    const docRef = firestoreAdmin.collection(collectionName).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }
    
    const videoData = doc.data();
    
    console.log('Video data for upload:', {
      id,
      hasGcpLink: !!(videoData?.gcpLink || videoData?.gcp_link),
      hasYtTitle: !!videoData?.yt_title,
      hasYtDescription: !!videoData?.yt_description,
      gcpLink: videoData?.gcpLink || videoData?.gcp_link,
      ytTitle: videoData?.yt_title,
      ytDescription: videoData?.yt_description?.substring(0, 100) + '...'
    });
    
    // Check if video has GCP link
    if (!videoData?.gcpLink && !videoData?.gcp_link) {
      return NextResponse.json(
        { error: "Video does not have a GCP link" },
        { status: 400 }
      );
    }
    
    // Check if video has YouTube metadata
    if (!videoData?.yt_title || !videoData?.yt_description) {
      return NextResponse.json(
        { error: "Please confirm YouTube details before uploading" },
        { status: 400 }
      );
    }
    
    const gcpLink = videoData.gcpLink || videoData.gcp_link;
    
    try {
      // Get YouTube service
      const youtubeService = getYouTubeService();
      
      // Set test mode if requested
      if (testMode) {
        youtubeService.setTestMode(true);
        console.log('YouTube upload running in test mode');
      }
      
      // Get stored YouTube tokens from somewhere (you'll need to implement token storage)
      // For now, we'll return an error asking the user to authenticate
      console.log('Checking for YouTube tokens...');
      const tokens = await getStoredYouTubeTokens();
      
      console.log('YouTube tokens result:', { 
        hasTokens: !!tokens, 
        hasAccessToken: !!(tokens?.access_token),
        hasRefreshToken: !!(tokens?.refresh_token)
      });
      
      if (!tokens) {
        console.log('No YouTube tokens found - generating auth URL');
        const authUrl = youtubeService.getAuthUrl();
        console.log('Generated auth URL:', authUrl);
        
        return NextResponse.json(
          { 
            error: "YouTube authentication required",
            authUrl: authUrl
          },
          { status: 401 }
        );
      }
      
      console.log('Setting YouTube credentials...');
      youtubeService.setCredentials(tokens);
      
      console.log('Starting YouTube upload...');
      
      // Upload video to YouTube with progress tracking
      const { videoId, youtubeUrl, uploadId } = await youtubeService.uploadVideoFromGCS(
        gcpLink,
        {
          title: videoData.yt_title,
          description: videoData.yt_description,
          tags: videoData.yt_tags || [],
          privacyStatus: videoData.yt_privacyStatus || 'private',
          categoryId: '28', // Science & Technology
        },
        (progress) => {
          // In a real application, you might emit this progress to websockets
          console.log(`Upload progress for ${id}: ${progress.progress}%`);
        }
      );
      
      // Update Firestore with YouTube info
      await docRef.update({
        youtube_link: youtubeUrl,
        youtubeLink: youtubeUrl,
        youtubeId: videoId,
        youtube_id: videoId,
        youtubeStatus: 'Published on YouTube',
        youtube_status: 'Published on YouTube',
        upload_scheduled: null,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        uploadId: uploadId // Store upload ID for tracking
      });

      const uploadResult = {
        success: true,
        videoId: id,
        youtubeId: videoId,
        uploadId: uploadId,
        status: 'uploaded',
        message: 'Video uploaded to YouTube successfully',
        youtube_link: youtubeUrl,
        youtube_id: videoId
      };

      logger.info(`Upload completed for video ${id} with YouTube ID ${videoId}`);

      return NextResponse.json(uploadResult);
      
    } catch (uploadError: any) {
      console.error(`Error uploading to YouTube:`, uploadError);
      
      // If it's an auth error, return auth URL
      if (uploadError.message?.includes('auth') || uploadError.code === 401) {
        const youtubeService = getYouTubeService();
        return NextResponse.json(
          { 
            error: "YouTube authentication required",
            authUrl: youtubeService.getAuthUrl(),
            details: uploadError.message
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to upload video to YouTube", 
          details: uploadError.message 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    logger.error(`Error initiating upload: ${String(error)}`);
    return NextResponse.json(
      { error: "Failed to initiate upload", details: String(error) },
      { status: 500 }
    );
  }
}

// Get stored YouTube tokens from cookies
async function getStoredYouTubeTokens() {
  try {
    console.log('Getting YouTube tokens from cookies...');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    
    console.log('Cookie tokens:', {
      hasAccessTokenCookie: !!accessToken?.value,
      hasRefreshTokenCookie: !!refreshToken?.value
    });
    
    if (accessToken?.value) {
      console.log('Found tokens in cookies');
      return {
        access_token: accessToken.value,
        refresh_token: refreshToken?.value,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
    }
    
    // Fallback to environment variables for testing
    console.log('Checking environment variables for YouTube tokens...');
    const hasEnvTokens = !!(process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN);
    console.log('Environment tokens available:', hasEnvTokens);
    
    if (process.env.YOUTUBE_ACCESS_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN) {
      console.log('Using environment variable tokens');
      return {
        access_token: process.env.YOUTUBE_ACCESS_TOKEN,
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
      };
    }
    
    console.log('No YouTube tokens found anywhere');
  } catch (error) {
    console.error('Error getting YouTube tokens:', error);
  }
  
  return null;
} 