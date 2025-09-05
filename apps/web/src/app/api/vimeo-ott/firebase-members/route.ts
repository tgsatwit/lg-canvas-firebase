import { NextRequest, NextResponse } from 'next/server';
import { getVimeoOttMembers } from '@/lib/firebase/vimeo-ott';

export async function GET(request: NextRequest) {
  try {
    const members = await getVimeoOttMembers();
    
    // Calculate statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: members.length,
      byStatus: {
        enabled: members.filter(m => m.status === 'enabled').length,
        cancelled: members.filter(m => m.status === 'cancelled').length,
        expired: members.filter(m => m.status === 'expired').length,
        disabled: members.filter(m => m.status === 'disabled').length,
        paused: members.filter(m => m.status === 'paused').length,
        refunded: members.filter(m => m.status === 'refunded').length,
      },
      thisWeek: {
        joined: members.filter(m => m.joinedThisWeek).length,
        cancelled: members.filter(m => m.cancelledThisWeek).length
      }
    };

    return NextResponse.json({
      success: true,
      members,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firebase members API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members from Firebase' },
      { status: 500 }
    );
  }
}