import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { getServerUser } from '@/lib/auth';
import { DirectYouTubeUploader } from '@/lib/youtube/direct-upload';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body = await request.json();
    const { testMode = false } = body;
    
    // Check authentication
    const session = await getServerUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get video data from Firestore
    const firestore = adminFirestore();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Firebase admin not initialized' },
        { status: 500 }
      );
    }
    
    const collectionName = process.env.FIREBASE_VIDEOS_COLLECTION || 'videos-master';
    const videoDoc = await firestore.collection(collectionName).doc(videoId).get();
    
    if (!videoDoc.exists) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }
    
    const videoData = videoDoc.data();
    
    // Validate video has required data
    const gcpLink = videoData?.gcpLink || videoData?.gcp_link;
    if (!gcpLink) {
      return NextResponse.json(
        { error: 'Video does not have a GCP storage link' },
        { status: 400 }
      );
    }
    
    const youtubeTitle = videoData?.yt_title || videoData?.youtubeTitle;
    const youtubeDescription = videoData?.yt_description || videoData?.youtubeDescription;
    
    if (!youtubeTitle || !youtubeDescription) {
      return NextResponse.json(
        { error: 'Video is missing YouTube metadata (title/description)' },
        { status: 400 }
      );
    }
    
    // Generate unique upload ID
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[${uploadId}] Initiating direct YouTube upload for video ${videoId}`);
    console.log(`[${uploadId}] Title: ${youtubeTitle}`);
    console.log(`[${uploadId}] GCS Link: ${gcpLink}`);
    console.log(`[${uploadId}] Test Mode: ${testMode}`);
    
    // Start the upload process in the background using the googleapis library
    // We don't await this to avoid timeout issues
    const uploader = new DirectYouTubeUploader();
    uploader.uploadVideo(
      uploadId,
      gcpLink,
      youtubeTitle,
      youtubeDescription,
      testMode
    ).catch((error: any) => {
      console.error(`[${uploadId}] Background upload failed:`, error);
    });
    
    // Return success immediately with monitor URL
    return NextResponse.json({
      success: true,
      uploadId: uploadId,
      message: 'Direct YouTube upload initiated successfully',
      monitorUrl: `/dashboard/youtube-uploads?highlight=${uploadId}`,
      architecture: 'direct-nextjs-youtube',
      note: 'Upload is processing in the background. Monitor progress via the provided URL.'
    });
    
  } catch (error) {
    console.error('Error in direct YouTube upload route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initiate direct YouTube upload',
        details: error instanceof Error ? error.message : 'Unknown error',
        architecture: 'direct-nextjs-youtube'
      },
      { status: 500 }
    );
  }
} 