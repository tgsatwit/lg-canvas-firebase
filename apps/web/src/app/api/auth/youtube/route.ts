import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeService } from '@/lib/youtube/youtube-service';

export async function GET(request: NextRequest) {
  try {
    const youtubeService = getYouTubeService();
    const authUrl = youtubeService.getAuthUrl();
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error getting YouTube auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to get YouTube auth URL' },
      { status: 500 }
    );
  }
} 