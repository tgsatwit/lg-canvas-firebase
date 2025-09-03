import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoIds, globalSettings, useOttTags = false } = body;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: 'Video IDs array is required and must not be empty' },
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
    
    // First, get all videos to read their existing data
    const videoRefs = videoIds.map((id: string) => 
      firestoreAdmin.collection(collectionName).doc(id)
    );
    
    const videoSnapshots = await Promise.all(videoRefs.map(ref => ref.get()));
    
    // Process each video
    const batch = firestoreAdmin.batch();
    const results: any[] = [];
    
    for (let i = 0; i < videoSnapshots.length; i++) {
      const snapshot = videoSnapshots[i];
      const videoId = videoIds[i];
      
      if (!snapshot.exists) {
        results.push({
          videoId,
          success: false,
          error: 'Video not found'
        });
        continue;
      }

      const videoData = snapshot.data();
      
      if (!videoData) {
        results.push({
          videoId,
          success: false,
          error: 'Video data not found'
        });
        continue;
      }
      
      // Prepare update data
      const updateData: any = {
        details_confirmed: 'Yes',
        youtubeStatus: 'Ready for YouTube',
        updated_at: new Date().toISOString()
      };

      // Use global settings if provided, otherwise use video's existing data
      updateData.yt_title = globalSettings?.yt_title || videoData.title || videoData.name || '';
      updateData.yt_description = globalSettings?.yt_description || videoData.description || videoData.vimeoDescription || '';
      updateData.yt_privacyStatus = globalSettings?.yt_privacyStatus || 'private';
      updateData.yt_category = globalSettings?.yt_category || '26'; // Default to HowTo category
      
      // Handle tags based on useOttTags setting
      if (useOttTags && videoData.vimeoOttMetadata?.tags) {
        updateData.yt_tags = videoData.vimeoOttMetadata.tags;
      } else if (globalSettings?.yt_tags) {
        updateData.yt_tags = globalSettings.yt_tags;
      } else {
        // Fallback to existing tags or OTT tags or empty array
        updateData.yt_tags = videoData.yt_tags || videoData.vimeoOttMetadata?.tags || videoData.vimeoTags || [];
      }

      // Validate required fields
      if (!updateData.yt_title || !updateData.yt_description) {
        results.push({
          videoId,
          success: false,
          error: 'Missing required title or description'
        });
        continue;
      }

      batch.update(videoRefs[i], updateData);
      results.push({
        videoId,
        success: true,
        data: {
          yt_title: updateData.yt_title,
          yt_description: updateData.yt_description,
          yt_tags: updateData.yt_tags,
          yt_privacyStatus: updateData.yt_privacyStatus
        }
      });
    }

    // Commit the batch
    await batch.commit();

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Bulk confirm completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: videoIds.length,
        successful: successCount,
        failed: failureCount,
        useOttTags
      }
    });

  } catch (error) {
    console.error('Error bulk confirming details:', error);
    return NextResponse.json(
      { error: 'Failed to bulk confirm details' },
      { status: 500 }
    );
  }
}