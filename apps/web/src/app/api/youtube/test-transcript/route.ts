import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';
import { TranscriptService } from '@/lib/youtube/transcript-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId') || 'VBmaYoFZwiY'; // Default to one of the Pilates videos

    console.log(`🧪 Testing transcript extraction for video: ${videoId}`);
    
    // Get YouTube service
    const youtubeService = getYouTubeService();
    
    // Initialize transcript service
    const transcriptService = new TranscriptService(youtubeService.oauth2Client);
    
    console.log('🔍 Attempting to fetch transcript...');
    const result = await transcriptService.fetchTranscript(videoId);
    
    console.log('📊 Transcript test result:', {
      success: result.success,
      method: result.method,
      transcriptLength: result.transcript?.length || 0,
      error: result.error
    });
    
    return NextResponse.json({
      success: true,
      videoId,
      transcriptResult: {
        success: result.success,
        method: result.method,
        transcriptLength: result.transcript?.length || 0,
        transcriptPreview: result.transcript ? result.transcript.substring(0, 200) + '...' : null,
        error: result.error
      }
    });
    
  } catch (error: any) {
    console.error('❌ Transcript test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Transcript test failed',
      details: error.message
    }, { status: 500 });
  }
}