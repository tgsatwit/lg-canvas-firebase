import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { google } from 'googleapis';

// const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

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
    const force = searchParams.get('force') === 'true';
    
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
      console.log(`🔍 Processing transcript for video: ${videoId}${force ? ' (force refresh)' : ''}`);
      const result = await processVideoTranscript(yt, db, videoId, force);
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

async function processVideoTranscript(yt: any, db: any, youtubeId: string, force = false) {
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
    
    // Skip if transcript already exists (unless force refresh is requested)
    if (videoData.transcript && videoData.transcriptFetched && !force) {
      return {
        success: true,
        message: 'Transcript already exists',
        videoId: youtubeId,
        transcriptLength: videoData.transcript.length
      };
    }

    console.log(`📝 ${force ? 'Force refreshing' : 'Fetching'} transcript for: ${videoData.title}`);

    // Try to get captions for the video
    const transcript = await fetchVideoTranscript(yt, youtubeId);
    
    if (transcript.success && transcript.text && transcript.text.trim().length > 0) {
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
        transcript: transcriptText, // Include the transcript in the response
        transcriptLength: transcriptText.length,
        method: transcript.method,
        isValidTranscript: transcriptText !== '[object Blob]' && transcriptText !== '[object Object]',
        forced: force
      };
    } else {
      // Mark as attempted but failed - ensure no undefined values for Firestore
      const updateData: any = {
        transcriptFetched: true,
        transcriptMethod: 'failed',
        transcriptUpdatedAt: new Date().toISOString()
      };
      
      // Only add transcriptError if it's not undefined
      if (transcript.error) {
        updateData.transcriptError = transcript.error;
      }
      
      await videoDoc.ref.update(updateData);

      return {
        success: false,
        videoId: youtubeId,
        title: videoData.title,
        error: transcript.error || 'Unknown error occurred',
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
    
    // Simplified queries without orderBy to avoid composite index requirements
    // Get videos where transcriptFetched is not true
    const snapshot1 = await videosRef
      .where('transcriptFetched', '!=', true)
      .limit(30)
      .get();
    
    // Also get videos where transcript field is empty or null
    const snapshot2 = await videosRef
      .where('transcript', '==', '')
      .limit(30)
      .get();
    
    // Combine and deduplicate by YouTube ID
    const allDocs = new Map();
    [...snapshot1.docs, ...snapshot2.docs].forEach(doc => {
      const data = doc.data();
      if (data.youtubeId && !allDocs.has(data.youtubeId)) {
        allDocs.set(data.youtubeId, { doc, data });
      }
    });
    
    // Sort by publishedAt in JavaScript (descending - newest first)
    const sortedDocs = Array.from(allDocs.values())
      .sort((a, b) => {
        const dateA = new Date(a.data.publishedAt || 0);
        const dateB = new Date(b.data.publishedAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 20) // Limit to 20 total
      .map(item => item.doc);

    console.log(`📚 Found ${sortedDocs.length} videos without transcripts`);

    const results = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      videos: [] as any[]
    };

    // Process each video
    for (const doc of sortedDocs) {
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
    const selectedCaption = captions.find((caption: any) => 
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

    // Properly handle the response data which might be a Blob
    let vttData = captionResponse.data;
    
    // Handle different response types with better error handling
    if (Buffer.isBuffer(vttData)) {
      vttData = vttData.toString('utf8');
    } else if (vttData && typeof vttData === 'object') {
      // Handle various object types that might contain transcript data
      try {
        if (vttData.constructor.name === 'Blob' || (vttData.arrayBuffer && typeof vttData.arrayBuffer === 'function')) {
          const arrayBuffer = await vttData.arrayBuffer();
          vttData = new TextDecoder('utf-8').decode(arrayBuffer);
        } else if (vttData.text && typeof vttData.text === 'function') {
          vttData = await vttData.text();
        } else if (vttData.data && typeof vttData.data === 'string') {
          vttData = vttData.data;
        } else if (vttData.toString && typeof vttData.toString === 'function') {
          vttData = vttData.toString();
        } else {
          // Try to extract any string-like property
          const stringProps = Object.keys(vttData).filter(key => 
            typeof vttData[key] === 'string' && vttData[key].length > 50
          );
          if (stringProps.length > 0) {
            vttData = vttData[stringProps[0]];
          } else {
            vttData = JSON.stringify(vttData);
          }
        }
      } catch (conversionError) {
        console.error('❌ Error converting response data:', conversionError);
        vttData = String(vttData);
      }
    } else if (typeof vttData !== 'string') {
      console.warn('⚠️ Unknown response data type:', typeof vttData, vttData?.constructor?.name);
      vttData = String(vttData);
    }
    
    // Final validation
    if (!vttData || typeof vttData !== 'string') {
      return {
        success: false,
        error: 'Caption data could not be converted to readable text',
        method: 'captions_api'
      };
    }
    
    // Check for common conversion failures
    if (vttData === '[object Blob]' || vttData === '[object Object]' || vttData.length < 10) {
      return {
        success: false,
        error: 'Caption data was not properly converted from response format',
        method: 'captions_api'
      };
    }

    const transcriptText = parseVTT(vttData);
    
    // Check if we got meaningful content
    if (!transcriptText || transcriptText.trim().length === 0) {
      return {
        success: false,
        error: 'Caption track downloaded but no text content could be extracted. The video may have empty captions or unsupported format.',
        method: 'captions_api'
      };
    }
    
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
    // Validate input
    if (!vttContent) {
      console.warn('⚠️ VTT content is empty or null');
      return '';
    }
    
    // Ensure we have a string
    if (typeof vttContent !== 'string') {
      console.warn('⚠️ VTT content is not a string, converting...');
      vttContent = String(vttContent);
    }
    
    // Check for [object Blob] or similar invalid strings
    if (vttContent === '[object Blob]' || vttContent === '[object Object]') {
      console.error('❌ VTT content is not properly converted from Blob/Object');
      return '';
    }
    
    // Debug: Log first 500 characters of VTT content
    console.log(`🔍 VTT Content Preview (${vttContent.length} chars):`, vttContent.substring(0, 500));
    
    const lines = vttContent.split('\n');
    const textLines: string[] = [];
    const seenText = new Set<string>(); // Track seen text to prevent duplicates
    const debugLines: string[] = []; // Track what we're processing
    
    let inCueBlock = false;
    // let skipNextTextLine = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        inCueBlock = false;
        // skipNextTextLine = false;
        continue;
      }
      
      debugLines.push(`Line ${i}: "${trimmedLine}"`);
      
      // Skip WebVTT header and related metadata
      if (trimmedLine.startsWith('WEBVTT') || 
          trimmedLine.startsWith('Kind:') || 
          trimmedLine.startsWith('Language:') ||
          trimmedLine.match(/^NOTE\s/i)) {
        console.log(`🚫 Skipping metadata line ${i}: "${trimmedLine}"`);
        continue;
      }
      
      // Skip cue settings lines (contain positioning/styling info)
      if (trimmedLine.includes('align:') || 
          trimmedLine.includes('position:') || 
          trimmedLine.includes('size:') ||
          trimmedLine.includes('line:')) {
        console.log(`🚫 Skipping cue settings line ${i}: "${trimmedLine}"`);
        continue;
      }
      
      // Check for timestamp lines (contains -->)
      if (trimmedLine.includes('-->')) {
        console.log(`⏰ Found timestamp line ${i}: "${trimmedLine}"`);
        inCueBlock = true;
        // skipNextTextLine = false;
        continue;
      }
      
      // Skip cue identifiers (just numbers or alphanumeric IDs) - but be more lenient
      if (/^[\w\d-]+$/.test(trimmedLine) && trimmedLine.length < 20 && !inCueBlock) {
        console.log(`🔢 Skipping cue ID line ${i}: "${trimmedLine}"`);
        // skipNextTextLine = false; // Don't skip the next line, it might be content
        continue;
      }
      
      // If this looks like text content (more lenient approach)
      if (trimmedLine.length > 0 && 
          !trimmedLine.includes('-->') && 
          !trimmedLine.startsWith('WEBVTT') &&
          !trimmedLine.startsWith('Kind:') &&
          !trimmedLine.startsWith('Language:')) {
        
        // Clean up HTML tags and formatting
        let cleanText = trimmedLine
          .replace(/<[^>]*>/g, '') // Remove HTML/VTT tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
          .replace(/&amp;/g, '&') // Replace &amp; with &
          .replace(/&lt;/g, '<') // Replace &lt; with <
          .replace(/&gt;/g, '>') // Replace &gt; with >
          .replace(/&quot;/g, '"') // Replace &quot; with "
          .replace(/&#39;/g, "'") // Replace &#39; with '
          .replace(/&apos;/g, "'") // Replace &apos; with '
          .trim();
        
        // Additional cleaning for VTT-specific artifacts
        cleanText = cleanText
          .replace(/^[-\s]*/, '') // Remove leading dashes and spaces
          .replace(/[-\s]*$/, '') // Remove trailing dashes and spaces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // More lenient validation - accept any text that's not pure numbers/timestamps
        if (cleanText && 
            cleanText.length > 1 && 
            !cleanText.includes('-->') && 
            !cleanText.match(/^[\d\s:.-]+$/) && // Skip pure timestamp/number lines
            !cleanText.match(/^\d+$/) && // Skip pure numbers
            !seenText.has(cleanText.toLowerCase())) {
          
          console.log(`✅ Adding text line ${i}: "${cleanText}"`);
          textLines.push(cleanText);
          seenText.add(cleanText.toLowerCase());
        } else {
          console.log(`🚫 Rejected text line ${i}: "${cleanText}" (length: ${cleanText.length})`);
        }
      }
    }
    
    // Join all text and perform final cleanup
    let finalTranscript = textLines.join(' ').replace(/\s+/g, ' ').trim();
    
    // Remove any remaining duplicated phrases (handles cases where content is repeated)
    finalTranscript = removeDuplicatedContent(finalTranscript);
    
    // Improve punctuation formatting
    finalTranscript = improvePunctuation(finalTranscript);
    
    // Enhanced logging
    console.log(`✅ Parsed VTT successfully: ${finalTranscript.length} characters, ${textLines.length} segments, ${seenText.size} unique`);
    
    // If we got no content, log debug info
    if (finalTranscript.length === 0) {
      console.warn('⚠️ No text content extracted from VTT. Debug info:');
      console.warn(`- Total lines: ${lines.length}`);
      console.warn(`- Lines processed: ${debugLines.length}`);
      console.warn('- First 10 processed lines:', debugLines.slice(0, 10));
      console.warn('- VTT content structure:', {
        hasWebVTT: vttContent.includes('WEBVTT'),
        hasTimestamps: vttContent.includes('-->'),
        hasKind: vttContent.includes('Kind:'),
        totalLength: vttContent.length
      });
    }
    
    return finalTranscript;
    
  } catch (error) {
    console.error('Error parsing VTT:', error);
    console.error('VTT content type:', typeof vttContent);
    console.error('VTT content preview:', vttContent ? String(vttContent).substring(0, 200) : 'null/undefined');
    return typeof vttContent === 'string' ? vttContent : String(vttContent || ''); // Return original if parsing fails
  }
}

// Helper function to improve punctuation and formatting
function improvePunctuation(text: string): string {
  if (!text || text.length < 10) {
    return text;
  }
  
  let result = text;
  
  // Add periods at the end of sentences that don't have punctuation
  result = result.replace(/([a-zA-Z])\s+([A-Z][a-z])/g, '$1. $2');
  
  // Fix spacing around punctuation
  result = result.replace(/\s+([.!?])/g, '$1'); // Remove space before punctuation
  result = result.replace(/([.!?])([A-Z])/g, '$1 $2'); // Add space after punctuation before capital letter
  
  // Fix multiple spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  // Ensure the text ends with proper punctuation
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }
  
  return result;
}

// Helper function to remove duplicated content patterns
function removeDuplicatedContent(text: string): string {
  if (!text || text.length < 100) {
    return text;
  }
  
  // Split into sentences for analysis
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  if (sentences.length < 3) {
    return text;
  }
  
  // Look for repeated patterns
  const seenSentences = new Set<string>();
  const uniqueSentences: string[] = [];
  
  for (const sentence of sentences) {
    const normalizedSentence = sentence.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Skip very short sentences or already seen ones
    if (normalizedSentence.length > 10 && !seenSentences.has(normalizedSentence)) {
      uniqueSentences.push(sentence);
      seenSentences.add(normalizedSentence);
    }
  }
  
  // Rejoin sentences
  let result = uniqueSentences.join('. ').trim();
  
  // Add final period if needed
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }
  
  return result;
}