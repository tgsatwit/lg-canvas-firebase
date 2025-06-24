import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('youtube_access_token');
    const refreshToken = cookieStore.get('youtube_refresh_token');
    
    return NextResponse.json({
      hasToken: !!(accessToken?.value || refreshToken?.value),
      accessToken: accessToken?.value || null,
      hasRefreshToken: !!refreshToken?.value,
    });
  } catch (error) {
    console.error('Error checking YouTube tokens:', error);
    return NextResponse.json(
      { error: 'Failed to check tokens', hasToken: false },
      { status: 500 }
    );
  }
} 