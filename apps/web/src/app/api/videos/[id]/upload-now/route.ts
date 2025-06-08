import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
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
      
      // Get stored YouTube tokens from somewhere (you'll need to implement token storage)
      // For now, we'll return an error asking the user to authenticate
      const tokens = await getStoredYouTubeTokens();
      
      if (!tokens) {
        return NextResponse.json(
          { 
            error: "YouTube authentication required",
            authUrl: youtubeService.getAuthUrl()
          },
          { status: 401 }
        );
      }
      
      youtubeService.setCredentials(tokens);
      
      // Upload video to YouTube
      const { videoId, youtubeUrl } = await youtubeService.uploadVideoFromGCS(
        gcpLink,
        {
          title: videoData.yt_title,
          description: videoData.yt_description,
          tags: videoData.yt_tags || [],
          privacyStatus: videoData.yt_privacyStatus || 'private',
          categoryId: '28', // Science & Technology
        }
      );
      
      // Update Firestore with YouTube info
      await docRef.update({
        youtube_link: youtubeUrl,
        youtubeLink: youtubeUrl,
        youtubeId: videoId,
        youtube_id: videoId,
        youtubeStatus: 'published on youtube',
        youtube_status: 'published on youtube',
        upload_scheduled: null,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return NextResponse.json({ 
        success: true,
        message: "Video uploaded to YouTube successfully",
        youtube_link: youtubeUrl,
        youtube_id: videoId
      });
      
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
    const { id } = await params;
    console.error(`Error processing upload for video ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to process video upload", details: String(error) },
      { status: 500 }
    );
  }
}

// Get stored YouTube tokens from cookies
async function getStoredYouTubeTokens() {
  try {
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
    
    // Fallback to environment variables for testing
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