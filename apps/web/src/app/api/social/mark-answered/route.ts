import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createScopedLogger } from '@/utils/logger';
import { getServerUser } from '@/lib/auth';
import { updateCommentStatus as updateFirebaseCommentStatus, SocialPlatform } from '@/lib/firebase/social';

const logger = createScopedLogger('api/social/mark-answered');

const requestSchema = z.object({
  commentId: z.string(),
  platform: z.enum(['facebook', 'instagram', 'youtube']),
  answered: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, platform, answered } = requestSchema.parse(body);
    
    logger.info('Marking comment as answered', { commentId, platform, answered });
    
    const user = await getServerUser();
    
    if (!user?.uid) {
      logger.warn('Unauthorized request to mark comment as answered', { commentId, platform });
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.uid;
    
    const result = await updateFirebaseCommentStatus(
      userId,
      commentId,
      platform as SocialPlatform,
      answered
    );
    
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error('Error marking comment as answered', { error: error.message || error });
    return NextResponse.json(
      { success: false, error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

/**
 * Mock function to update comment status
 * In a real implementation, this would update records in the database
 * and potentially call each platform's API if needed
 */
async function updateCommentStatus(
  commentIds: number[],
  answered: boolean,
  platform?: string
): Promise<number[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Log the operation (would interact with real APIs/database in production)
  const platformInfo = platform ? ` on ${platform}` : '';
  console.log(`[MOCK] Marking ${commentIds.length} comments as ${answered ? 'answered' : 'unanswered'}${platformInfo}`);
  
  // In a real implementation, we would update the status in a database
  // and potentially make API calls to update status on the platforms if they support it
  
  // Simulate a scenario where a small percentage of updates might fail
  const successfulUpdates = commentIds.filter(() => Math.random() < 0.95);
  
  return successfulUpdates;
} 