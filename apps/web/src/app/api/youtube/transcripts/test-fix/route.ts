import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId') || 'dQw4w9WgXcQ'; // Default test video
    
    console.log(`🧪 Testing transcript fetch for video: ${videoId}`);
    
    // Call the transcript API directly
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const transcriptResponse = await fetch(`${baseUrl}/api/youtube/transcripts?videoId=${videoId}&force=true`);
    const transcriptData = await transcriptResponse.json();
    
    // Log the results for debugging
    console.log('📊 Test Results:', {
      success: transcriptData.success,
      hasTranscript: !!transcriptData.transcript,
      transcriptLength: transcriptData.transcript?.length || 0,
      transcriptPreview: transcriptData.transcript?.substring(0, 100) || 'No transcript',
      isObjectBlob: transcriptData.transcript === '[object Blob]',
      method: transcriptData.method,
      error: transcriptData.error
    });
    
    return NextResponse.json({
      success: true,
      testVideoId: videoId,
      transcriptApiResponse: transcriptData,
      blobDetected: transcriptData.transcript === '[object Blob]',
      transcriptValid: transcriptData.transcript && 
                     transcriptData.transcript !== '[object Blob]' && 
                     transcriptData.transcript !== '[object Object]',
      summary: {
        transcriptLength: transcriptData.transcript?.length || 0,
        method: transcriptData.method,
        success: transcriptData.success
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Transcript test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Transcript test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 