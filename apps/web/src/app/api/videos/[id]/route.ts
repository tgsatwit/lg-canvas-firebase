import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { DocumentData } from 'firebase-admin/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Get Firestore instance
    const firestoreAdmin = adminFirestore();
    if (!firestoreAdmin) {
      console.error("Firebase admin not initialized");
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    const videosDb = process.env.FIREBASE_VIDEOS_DB || "";
    const videosCollection = process.env.FIREBASE_VIDEOS_COLLECTION || "";
    
    console.log(`Attempting to fetch video with ID ${id} from ${videosDb}/${videosCollection}`);
    
    if (!videosDb) {
      console.error("Missing environment variables for videos database");
      return NextResponse.json(
        { error: "Missing environment configuration" },
        { status: 500 }
      );
    }
    
    // Determine the correct document path
    let docRef;
    if (videosCollection) {
      // Use nested path if collection is specified
      docRef = firestoreAdmin.collection(videosDb).doc(videosCollection).collection('videos').doc(id);
    } else {
      // Otherwise use direct path
      docRef = firestoreAdmin.collection(videosDb).doc(id);
    }
    
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      console.warn(`Video with ID ${id} not found`);
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }
    
    const data = snapshot.data();
    const video = {
      id: snapshot.id,
      title: data?.name || "Untitled",
      thumbnail: `https://i.vimeocdn.com/video/${data?.vimeoId || "default"}_640x360.jpg`,
      visibility: "Public", // Default value
      uploadDate: data?.createdAt || new Date().toISOString(),
      views: 0, // Default values for metrics
      likes: 0,
      comments: 0,
      duration: "00:00", // Default value
      status: data?.confirmed ? "Published" : "Processing",
    };
    
    return NextResponse.json(video);
  } catch (error) {
    console.error(`Error fetching video with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch video", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Get Firestore instance
    const firestoreAdmin = adminFirestore();
    if (!firestoreAdmin) {
      console.error("Firebase admin not initialized");
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    const videosDb = process.env.FIREBASE_VIDEOS_DB || "";
    const videosCollection = process.env.FIREBASE_VIDEOS_COLLECTION || "";
    
    console.log(`Attempting to update video with ID ${id} in ${videosDb}/${videosCollection}`);
    
    if (!videosDb) {
      console.error("Missing environment variables for videos database");
      return NextResponse.json(
        { error: "Missing environment configuration" },
        { status: 500 }
      );
    }
    
    // Convert to Firebase format
    const firebaseData: Record<string, any> = {};
    
    // Map fields from Video type to FirebaseVideo type
    if (data.title) {
      firebaseData.name = data.title;
    }
    
    // Determine the correct document path
    let docRef;
    if (videosCollection) {
      // Use nested path if collection is specified
      docRef = firestoreAdmin.collection(videosDb).doc(videosCollection).collection('videos').doc(id);
    } else {
      // Otherwise use direct path
      docRef = firestoreAdmin.collection(videosDb).doc(id);
    }
    
    await docRef.update(firebaseData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error updating video with ID ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update video", details: String(error) },
      { status: 500 }
    );
  }
} 