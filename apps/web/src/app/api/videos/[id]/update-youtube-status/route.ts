import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = [
      'Preparing for YouTube',
      'Ready for YouTube',
      'Scheduled for YouTube',
      'Published on YouTube',
      'Do Not Upload'
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
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

    const collectionName = process.env.FIREBASE_VIDEOS_COLLECTION || 'videos-master';
    
    // Update the video document in Firestore
    const videoRef = firestoreAdmin.collection(collectionName).doc(id);
    
    const updateData: any = {
      youtubeStatus: status,
      updated_at: new Date().toISOString(),
    };

    // Clear YouTube-related fields if status is "Do Not Upload"
    if (status === 'Do Not Upload') {
      updateData.youtubeLink = null;
      updateData.youtubeUrl = null;
      updateData.youtubeId = null;
      updateData.youtubeUploaded = false;
      updateData.scheduledUploadDate = null;
    }

    await videoRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Video status updated to: ${status}`,
      data: {
        status
      }
    });

  } catch (error) {
    console.error('Error updating YouTube status:', error);
    return NextResponse.json(
      { error: 'Failed to update YouTube status' },
      { status: 500 }
    );
  }
}
