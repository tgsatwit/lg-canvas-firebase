import { NextResponse } from 'next/server';
import { adminFirestore } from '../../../../lib/firebase/admin';

// GET - Fetch sync status
export async function GET() {
  try {
    const db = adminFirestore();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    const syncStatusRef = db.collection('mailchimp-sync-status').doc('current');
    const doc = await syncStatusRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({
        success: true,
        status: {
          isRunning: false,
          lastSync: null,
          totalLists: 0,
          totalMembers: 0,
          error: null
        }
      });
    }

    return NextResponse.json({
      success: true,
      status: doc.data()
    });
    
  } catch (error) {
    console.error('Error fetching Mailchimp sync status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}