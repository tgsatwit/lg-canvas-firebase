import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { videoId, updates } = await request.json();

    if (!videoId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, updates' },
        { status: 400 }
      );
    }

    // Get the video document to get the YouTube ID
    const videoRef = doc(db, 'videos-master', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoData = videoDoc.data();
    const youtubeId = videoData.youtubeId;

    if (!youtubeId) {
      return NextResponse.json(
        { error: 'YouTube ID not found for this video' },
        { status: 400 }
      );
    }

    // Initialize YouTube API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // Get stored OAuth credentials
    const credentials = {
      access_token: process.env.YOUTUBE_ACCESS_TOKEN,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    };

    oauth2Client.setCredentials(credentials);

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // Update video on YouTube
    await youtube.videos.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: youtubeId,
        snippet: {
          title: updates.title,
          description: updates.description,
          tags: updates.tags,
          categoryId: videoData.categoryId || '22' // Default to People & Blogs
        },
        status: {
          privacyStatus: updates.privacyStatus
        }
      },
    });

    // Update the video document in Firestore
    await updateDoc(videoRef, {
      title: updates.title,
      description: updates.description,
      tags: updates.tags,
      privacyStatus: updates.privacyStatus,
      lastYouTubeUpdate: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Clear draft after successful update
      draft: null
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Video updated successfully on YouTube and local database' 
    });

  } catch (error) {
    console.error('Error updating video:', error);
    
    // Handle OAuth errors
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'YouTube authentication expired. Please re-authenticate.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}