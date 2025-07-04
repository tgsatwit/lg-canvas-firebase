import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { videoId, updates } = await request.json();

    if (!videoId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, updates' },
        { status: 400 }
      );
    }

    // Update the video document with draft data
    const videoRef = doc(db, 'videos-master', videoId);
    
    await updateDoc(videoRef, {
      draft: {
        title: updates.title,
        description: updates.description,
        tags: updates.tags,
        privacyStatus: updates.privacyStatus,
        lastUpdated: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Draft saved successfully' 
    });

  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}