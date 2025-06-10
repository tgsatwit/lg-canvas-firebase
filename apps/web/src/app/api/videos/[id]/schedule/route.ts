import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { upload_time } = await request.json();
    
    if (!upload_time) {
      return NextResponse.json(
        { error: "upload_time is required" },
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
    
    console.log(`Scheduling video ${id} for upload at ${upload_time}`);
    
    // Use direct collection reference like the main videos API
    const docRef = firestoreAdmin.collection(collectionName).doc(id);
    
    // Update the document with scheduling information
    await docRef.update({
      upload_time: upload_time,
      upload_scheduled: 'Yes',
      youtubeStatus: 'Scheduled for YouTube',
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Video scheduled for upload successfully"
    });
  } catch (error) {
    const { id } = await params;
    console.error(`Error scheduling upload for video ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to schedule upload", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    
    console.log(`Cancelling scheduled upload for video ${id}`);
    
    // Use direct collection reference like the main videos API
    const docRef = firestoreAdmin.collection(collectionName).doc(id);
    
    // Remove scheduling information and set status back to ready for youtube
    await docRef.update({
      upload_time: null,
      upload_scheduled: null,
      youtubeStatus: 'Ready for YouTube', // Back to ready state after cancelling schedule
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Scheduled upload cancelled successfully"
    });
  } catch (error) {
    const { id } = await params;
    console.error(`Error cancelling scheduled upload for video ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled upload", details: String(error) },
      { status: 500 }
    );
  }
} 