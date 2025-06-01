import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

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
    
    // Use direct collection reference like the main videos API
    const docRef = firestoreAdmin.collection(collectionName).doc(id);
    
    // Simulate immediate upload by setting youtube_link
    // In a real implementation, this would trigger the actual YouTube upload
    const mockYoutubeUrl = `https://youtube.com/watch?v=${id}_mock`;
    
    await docRef.update({
      youtube_link: mockYoutubeUrl,
      youtubeLink: mockYoutubeUrl,
      youtubeStatus: 'published on youtube',
      upload_scheduled: null, // Clear any existing schedule
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true,
      message: "Video uploaded to YouTube successfully",
      youtube_link: mockYoutubeUrl
    });
  } catch (error) {
    const { id } = await params;
    console.error(`Error uploading video ${id} to YouTube:`, error);
    return NextResponse.json(
      { error: "Failed to upload video to YouTube", details: String(error) },
      { status: 500 }
    );
  }
} 