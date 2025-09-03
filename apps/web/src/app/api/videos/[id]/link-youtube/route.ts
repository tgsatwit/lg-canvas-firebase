import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { youtubeUrl, youtubeId } = body;

    if (!youtubeUrl && !youtubeId) {
      return NextResponse.json(
        { error: 'YouTube URL or ID is required' },
        { status: 400 }
      );
    }

    // Extract YouTube ID from URL if provided
    let extractedYoutubeId = youtubeId;
    if (youtubeUrl && !youtubeId) {
      const urlPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
      const match = youtubeUrl.match(urlPattern);
      if (match && match[1]) {
        extractedYoutubeId = match[1];
      } else {
        return NextResponse.json(
          { error: 'Invalid YouTube URL format' },
          { status: 400 }
        );
      }
    }

    // Construct the YouTube URL if only ID was provided
    const finalYoutubeUrl = youtubeUrl || `https://www.youtube.com/watch?v=${extractedYoutubeId}`;

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
    
    // Update the video document in Firestore
    const videoRef = firestoreAdmin.collection(collectionName).doc(id);
    
    const updateData = {
      youtubeStatus: 'Published on YouTube',
      youtubeLink: finalYoutubeUrl,
      youtubeUrl: finalYoutubeUrl,
      youtubeId: extractedYoutubeId,
      youtubeUploaded: true,
      youtubeUploadDate: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await videoRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Video successfully linked to YouTube',
      data: {
        youtubeUrl: finalYoutubeUrl,
        youtubeId: extractedYoutubeId,
        status: 'Published on YouTube'
      }
    });

  } catch (error) {
    console.error('Error linking YouTube video:', error);
    return NextResponse.json(
      { error: 'Failed to link YouTube video' },
      { status: 500 }
    );
  }
}
