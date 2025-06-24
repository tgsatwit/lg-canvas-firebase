import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createScopedLogger } from '@/utils/logger';
import { getServerUser } from '@/lib/auth';
import { getSocialComments, SocialPlatform } from '@/lib/firebase/social';

const logger = createScopedLogger('api/social/get-comments');

const querySchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'youtube']).optional(),
  answered: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const answered = searchParams.get('answered');
    const limitParam = searchParams.get('limit');
    
    const params = querySchema.parse({
      platform: platform || undefined,
      answered: answered || undefined,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    });
    
    logger.info('Fetching social comments', params);
    
    const user = await getServerUser();
    
    if (!user?.uid) {
      logger.warn('Unauthorized request to fetch social comments');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = user.uid;
    
    const comments = await getSocialComments(userId, {
      platform: params.platform as SocialPlatform | undefined,
      answered: params.answered,
      limit: params.limit,
    });
    
    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error: any) {
    logger.error('Error fetching social comments', { error: error.message || error });
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
} 