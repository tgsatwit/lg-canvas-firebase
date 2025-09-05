import { NextRequest, NextResponse } from 'next/server';
import { syncVimeoOttMembers, getVimeoOttSyncStatus } from '@/lib/firebase/vimeo-ott';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Vimeo OTT sync...');
    const result = await syncVimeoOttMembers();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        stats: result.stats
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync members' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = await getVimeoOttSyncStatus();
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Sync status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}