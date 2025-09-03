import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { masterVideoId } = body;

    if (!masterVideoId) {
      return NextResponse.json(
        { error: 'Master video ID is required' },
        { status: 400 }
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

    const videosCollection = process.env.FIREBASE_VIDEOS_COLLECTION || 'videos-master';

    // Get the YouTube video data
    const youtubeVideoRef = firestoreAdmin.collection('youtube-videos').doc(videoId);
    const youtubeVideoSnap = await youtubeVideoRef.get();
    
    if (!youtubeVideoSnap.exists) {
      return NextResponse.json(
        { error: 'YouTube video not found' },
        { status: 404 }
      );
    }

    const youtubeVideoData = youtubeVideoSnap.data();

    // Get the master video data to verify it exists
    const masterVideoRef = firestoreAdmin.collection(videosCollection).doc(masterVideoId);
    const masterVideoSnap = await masterVideoRef.get();
    
    if (!masterVideoSnap.exists) {
      return NextResponse.json(
        { error: 'Master video not found' },
        { status: 404 }
      );
    }

    // Update the master video with YouTube data
    const updateData = {
      youtubeStatus: 'Published on YouTube',
      youtubeLink: youtubeVideoData?.url || `https://www.youtube.com/watch?v=${youtubeVideoData?.youtubeId}`,
      youtubeUrl: youtubeVideoData?.url || `https://www.youtube.com/watch?v=${youtubeVideoData?.youtubeId}`,
      youtubeId: youtubeVideoData?.youtubeId,
      youtubeUploaded: true,
      youtubeUploadDate: youtubeVideoData?.publishedAt || new Date().toISOString(),
      linkedYouTubeVideoId: videoId,
      
      // Optionally sync some metadata if not already set
      yt_title: youtubeVideoData?.title,
      yt_description: youtubeVideoData?.description,
      yt_privacyStatus: youtubeVideoData?.privacyStatus,
      
      updated_at: new Date().toISOString(),
    };

    await masterVideoRef.update(updateData);

    // Also update the YouTube video to mark it as linked
    await youtubeVideoRef.update({
      linkedToMasterVideo: masterVideoId,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'YouTube video successfully linked to master video',
      data: {
        youtubeVideoId: videoId,
        masterVideoId,
        youtubeUrl: updateData.youtubeUrl
      }
    });

  } catch (error) {
    console.error('Error linking YouTube video to master:', error);
    return NextResponse.json(
      { error: 'Failed to link YouTube video to master video' },
      { status: 500 }
    );
  }
}