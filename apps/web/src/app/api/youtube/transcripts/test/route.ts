import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing transcript API endpoint...');
    
    // Test with a sample video ID (you can change this to an actual video ID from your database)
    const testVideoId = 'dQw4w9WgXcQ'; // Rick Roll video ID for testing
    
    const transcriptResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/youtube/transcripts?videoId=${testVideoId}`);
    const transcriptData = await transcriptResponse.json();
    
    return NextResponse.json({
      success: true,
      test: 'transcript-api',
      endpoint: `/api/youtube/transcripts?videoId=${testVideoId}`,
      result: transcriptData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Transcript API test failed:', error);
    return NextResponse.json({
      success: false,
      test: 'transcript-api',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}