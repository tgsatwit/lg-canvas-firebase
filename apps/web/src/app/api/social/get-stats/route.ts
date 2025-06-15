import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createScopedLogger } from '@/utils/logger';
import { getServerUser } from '@/lib/auth';
import { getSocialStats } from '@/lib/firebase/social';

const logger = createScopedLogger('api/social/get-stats');

export async function GET(req: NextRequest) {
  try {
    logger.info('Fetching social media stats');
    
    const user = await getServerUser();
    
    if (!user?.uid) {
      logger.warn('Unauthorized request to fetch social stats');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = user.uid;
    
    const stats = await getSocialStats(userId);
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Error fetching social stats', { error: error.message || error });
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 