import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

function getYoutubeClient() {
  const oauth2 = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  // Use refresh token for permanent authentication
  oauth2.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });

  return google.youtube({ version: 'v3', auth: oauth2 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const processAll = searchParams.get('processAll') === 'true';
    
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }

    const yt = getYoutubeClient();
    
    if (videoId) {
      // Process single video
      console.log(`🔍 Processing transcript for video: ${videoId}`);
      const result = await processVideoTranscript(yt, db, videoId);
      return NextResponse.json(result);
    }
    
    if (processAll) {
      // Process all videos without transcripts
      console.log('📚 Processing transcripts for all videos...');
      const results = await processAllVideoTranscripts(yt, db);
      return NextResponse.json(results);
    }

    return NextResponse.json({
      error: 'Please specify videoId parameter or processAll=true'
    }, { status: 400 });

  } catch (error: any) {
    console.error('❌ Transcript processing failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Transcript processing failed',
      details: error.message
    }, { status: 500 });
  }
}

async function processVideoTranscript(yt: any, db: any, youtubeId: string) {
  try {
    // Get video document from Firestore
    const videosRef = db.collection('videos-youtube');
    const videoSnapshot = await videosRef.where('youtubeId', '==', youtubeId).get();
    
    if (videoSnapshot.empty) {
      return {
        success: false,
        error: `Video with YouTube ID ${youtubeId} not found in database`
      };
    }

    const videoDoc = videoSnapshot.docs[0];
    const videoData = videoDoc.data();
    
    // Skip if transcript already exists
    if (videoData.transcript && videoData.transcriptFetched) {
      return {
        success: true,
        message: 'Transcript already exists',
        videoId: youtubeId,
        transcriptLength: videoData.transcript.length
      };
    }

    console.log(`📝 Fetching transcript for: ${videoData.title}`);

    // Try to get captions for the video
    const transcript = await fetchVideoTranscript(yt, youtubeId);
    
    if (transcript.success && transcript.text) {
      // Ensure transcript text is a plain string for Firestore
      const transcriptText = typeof transcript.text === 'string' ? transcript.text : String(transcript.text);
      
      // Update Firestore document with transcript
      await videoDoc.ref.update({
        transcript: transcriptText,
        transcriptFetched: true,
        transcriptMethod: transcript.method,
        transcriptUpdatedAt: new Date().toISOString()
      });

      console.log(`✅ Transcript saved for video: ${videoData.title} (${transcriptText.length} chars)`);
      
      return {
        success: true,
        videoId: youtubeId,
        title: videoData.title,
        transcriptLength: transcriptText.length,
        method: transcript.method
      };
    } else {
      // Mark as attempted but failed
      await videoDoc.ref.update({
        transcriptFetched: true,
        transcriptMethod: 'failed',
        transcriptError: transcript.error,
        transcriptUpdatedAt: new Date().toISOString()
      });

      return {
        success: false,
        videoId: youtubeId,
        title: videoData.title,
        error: transcript.error,
        method: 'failed'
      };
    }

  } catch (error: any) {
    console.error(`❌ Error processing transcript for ${youtubeId}:`, error);
    return {
      success: false,
      videoId: youtubeId,
      error: error.message
    };
  }
}

async function processAllVideoTranscripts(yt: any, db: any) {
  try {
    // Get all videos without transcripts
    const videosRef = db.collection('videos-youtube');
    const snapshot = await videosRef
      .where('transcriptFetched', '!=', true)
      .orderBy('publishedAt', 'desc')
      .limit(20) // Process in batches to avoid quota issues
      .get();

    console.log(`📚 Found ${snapshot.size} videos without transcripts`);

    const results = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      videos: [] as any[]
    };

    // Process each video
    for (const doc of snapshot.docs) {
      const videoData = doc.data();
      const youtubeId = videoData.youtubeId;
      
      if (!youtubeId) {
        console.warn(`⚠️ Skipping video without YouTube ID: ${doc.id}`);
        continue;
      }

      const result = await processVideoTranscript(yt, db, youtubeId);
      results.videos.push(result);
      results.totalProcessed++;
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }

      // Add small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`✅ Processed ${results.totalProcessed} videos: ${results.successful} successful, ${results.failed} failed`);
    
    return {
      success: true,
      summary: {
        totalProcessed: results.totalProcessed,
        successful: results.successful,
        failed: results.failed
      },
      videos: results.videos
    };

  } catch (error: any) {
    console.error('❌ Error processing all video transcripts:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function fetchVideoTranscript(yt: any, videoId: string): Promise<{
  success: boolean;
  text?: string;
  method?: string;
  error?: string;
}> {
  try {
    // List available captions for the video
    const captionsResponse = await yt.captions.list({
      part: ['snippet'],
      videoId: videoId,
    });

    const captions = captionsResponse.data.items || [];
    
    if (captions.length === 0) {
      return {
        success: false,
        error: 'No captions available for this video',
        method: 'captions_api'
      };
    }

    // Find the best caption track (prefer English, then auto-generated)
    let selectedCaption = captions.find((caption: any) => 
      caption.snippet?.language === 'en' && caption.snippet?.trackKind === 'standard'
    ) || captions.find((caption: any) => 
      caption.snippet?.language === 'en'
    ) || captions[0];

    if (!selectedCaption?.id) {
      return {
        success: false,
        error: 'No suitable caption track found',
        method: 'captions_api'
      };
    }

    console.log(`📥 Downloading caption: ${selectedCaption.snippet?.name} (${selectedCaption.snippet?.language})`);

    // Download the caption track as WebVTT
    const captionResponse = await yt.captions.download({
      id: selectedCaption.id,
      tfmt: 'vtt', // WebVTT format
    });

    // Ensure the response data is converted to string
    let vttData = captionResponse.data;
    if (Buffer.isBuffer(vttData)) {
      vttData = vttData.toString('utf8');
    } else if (typeof vttData !== 'string') {
      vttData = String(vttData);
    }

    const transcriptText = parseVTT(vttData);
    
    return {
      success: true,
      text: transcriptText,
      method: 'captions_api'
    };

  } catch (error: any) {
    console.error('❌ Error fetching transcript:', error);
    
    if (error.code === 403) {
      return {
        success: false,
        error: 'Caption download not permitted (video may have restricted captions)',
        method: 'captions_api'
      };
    }
    
    return {
      success: false,
      error: error.message,
      method: 'captions_api'
    };
  }
}

function parseVTT(vttContent: string): string {
  try {
    // Ensure we have a string
    if (typeof vttContent !== 'string') {
      console.warn('⚠️ VTT content is not a string, converting...');
      vttContent = String(vttContent);
    }
    
    const lines = vttContent.split('\n');
    const textLines: string[] = [];
    
    let inCueBlock = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        inCueBlock = false;
        continue;
      }
      
      // Skip WebVTT header
      if (trimmedLine.startsWith('WEBVTT')) {
        continue;
      }
      
      // Skip cue identifiers (just numbers or timestamps)
      if (/^\d+$/.test(trimmedLine) || trimmedLine.includes('-->')) {
        inCueBlock = true;
        continue;
      }
      
      // This should be caption text
      if (inCueBlock || (!trimmedLine.includes('-->') && !/^\d+$/.test(trimmedLine))) {
        // Clean up HTML tags and formatting
        const cleanText = trimmedLine
          .replace(/<[^>]*>/g, '') // Remove HTML/VTT tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
          .replace(/&amp;/g, '&') // Replace &amp; with &
          .replace(/&lt;/g, '<') // Replace &lt; with <
          .replace(/&gt;/g, '>') // Replace &gt; with >
          .trim();
        
        if (cleanText && !cleanText.includes('-->')) {
          textLines.push(cleanText);
        }
      }
    }
    
    return textLines.join(' ').replace(/\s+/g, ' ').trim();
    
  } catch (error) {
    console.error('Error parsing VTT:', error);
    console.error('VTT content type:', typeof vttContent);
    console.error('VTT content preview:', vttContent ? String(vttContent).substring(0, 200) : 'null/undefined');
    return typeof vttContent === 'string' ? vttContent : String(vttContent || ''); // Return original if parsing fails
  }
}