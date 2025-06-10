import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { yt_title, yt_description, yt_tags, yt_privacyStatus } = await request.json();
    
    if (!yt_title || !yt_description) {
      return NextResponse.json(
        { error: "yt_title and yt_description are required" },
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
    
    console.log(`Confirming YouTube details for video ${id}`);
    
    // Use direct collection reference like the main videos API
    const docRef = firestoreAdmin.collection(collectionName).doc(id);
    
    // Update the document with YouTube metadata
    await docRef.update({
      yt_title: yt_title,
      yt_description: yt_description,
      yt_tags: yt_tags || [],
      yt_privacyStatus: yt_privacyStatus || 'private',
      details_confirmed: 'Yes',
      youtubeStatus: 'Ready for YouTube',
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: true,
      message: "YouTube details confirmed successfully"
    });
  } catch (error) {
    const { id } = await params;
    console.error(`Error confirming YouTube details for video ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to confirm YouTube details", details: String(error) },
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
    
    console.log(`Clearing confirmed YouTube details for video ${id}`);
    
    // Use direct collection reference like the main videos API
    const docRef = firestoreAdmin.collection(collectionName).doc(id);
    
    // Remove confirmed details
    await docRef.update({
      yt_title: null,
      yt_description: null,
      yt_tags: null,
      yt_privacyStatus: null,
      details_confirmed: null,
      youtubeStatus: 'Preparing for YouTube',
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: "YouTube details cleared successfully"
    });
  } catch (error) {
    const { id } = await params;
    console.error(`Error clearing YouTube details for video ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to clear YouTube details", details: String(error) },
      { status: 500 }
    );
  }
} 