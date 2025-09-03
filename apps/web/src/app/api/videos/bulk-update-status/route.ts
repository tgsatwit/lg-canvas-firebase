import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoIds, status } = body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: 'Video IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

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
    const batch = firestoreAdmin.batch();
    const timestamp = new Date().toISOString();
    
    const updateData: any = {
      youtubeStatus: status,
      updated_at: timestamp,
    };

    // Clear YouTube-related fields if status is "Do Not Upload"
    if (status === 'Do Not Upload') {
      updateData.youtubeLink = null;
      updateData.youtubeUrl = null;
      updateData.youtubeId = null;
      updateData.youtubeUploaded = false;
      updateData.scheduledUploadDate = null;
    }

    // Add each video to the batch
    videoIds.forEach((videoId: string) => {
      const videoRef = firestoreAdmin.collection(collectionName).doc(videoId);
      batch.update(videoRef, updateData);
    });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${videoIds.length} videos to status: ${status}`,
      data: {
        updatedCount: videoIds.length,
        status,
        videoIds
      }
    });

  } catch (error) {
    console.error('Error bulk updating video statuses:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update video statuses' },
      { status: 500 }
    );
  }
}