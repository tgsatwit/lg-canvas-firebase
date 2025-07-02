import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    
    const db = adminFirestore();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    console.log(`📺 Fetching YouTube channel info: ${channelId}`);
    
    const channelRef = db.collection('youtube-channels').doc(channelId);
    const channelSnap = await channelRef.get();
    
    if (!channelSnap.exists) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }
    
    const channelData = channelSnap.data();
    
    return NextResponse.json({
      success: true,
      channel: channelData
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching YouTube channel info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch YouTube channel info',
        details: error.message 
      },
      { status: 500 }
    );
  }
}