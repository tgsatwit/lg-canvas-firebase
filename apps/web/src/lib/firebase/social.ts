import { getDb, FieldValue } from './index';
import { createScopedLogger } from '@/utils/logger';

const logger = createScopedLogger('lib/firebase/social');

export type SocialPlatform = 'facebook' | 'instagram' | 'youtube';

export interface SocialComment {
  id: string;
  platform: SocialPlatform;
  content: string;
  author: string;
  authorId: string;
  postId: string;
  postUrl?: string;
  createdAt: Date;
  answered: boolean;
  answeredAt?: Date;
  metadata?: Record<string, any>;
}

const COLLECTION = 'social_comments';

/**
 * Get all social comments for a user, optionally filtered by platform and answered status
 */
export async function getSocialComments(
  userId: string,
  options?: {
    platform?: SocialPlatform;
    answered?: boolean;
    limit?: number;
  }
) {
  try {
    const db = getDb();
    const { platform, answered, limit = 100 } = options || {};
    
    let query = db.collection(COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');
    
    if (platform) {
      query = query.where('platform', '==', platform);
    }
    
    if (answered !== undefined) {
      query = query.where('answered', '==', answered);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      answeredAt: doc.data().answeredAt?.toDate()
    })) as SocialComment[];
  } catch (error) {
    logger.error('Error getting social comments', { error, userId, options });
    throw error;
  }
}

/**
 * Mark a social comment as answered or unanswered
 */
export async function updateCommentStatus(
  userId: string,
  commentId: string,
  platform: SocialPlatform,
  answered: boolean
) {
  try {
    const db = getDb();
    const docRef = db.collection(COLLECTION).doc(commentId);
    
    const data: Record<string, any> = {
      answered,
      updatedAt: FieldValue.serverTimestamp()
    };
    
    if (answered) {
      data.answeredAt = FieldValue.serverTimestamp();
    } else {
      data.answeredAt = null;
    }
    
    await docRef.update(data);
    
    logger.info('Updated comment status', { 
      userId, 
      commentId, 
      platform, 
      answered 
    });
    
    return { success: true };
  } catch (error) {
    logger.error('Error updating comment status', { 
      error, 
      userId, 
      commentId, 
      platform 
    });
    throw error;
  }
}

/**
 * Add a new social comment
 */
export async function addSocialComment(
  userId: string,
  comment: Omit<SocialComment, 'id'>
) {
  try {
    const db = getDb();
    const docRef = db.collection(COLLECTION).doc();
    
    await docRef.set({
      ...comment,
      userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      answered: false
    });
    
    logger.info('Added new social comment', { 
      userId, 
      commentId: docRef.id, 
      platform: comment.platform 
    });
    
    return { 
      id: docRef.id,
      success: true 
    };
  } catch (error) {
    logger.error('Error adding social comment', { 
      error, 
      userId, 
      platform: comment.platform 
    });
    throw error;
  }
}

/**
 * Get social comment statistics by platform
 */
export async function getSocialStats(userId: string) {
  try {
    const db = getDb();
    
    // Get counts for each platform
    const platforms: SocialPlatform[] = ['facebook', 'instagram', 'youtube'];
    const stats: Record<string, any> = {};
    
    for (const platform of platforms) {
      // Get total count
      const totalSnapshot = await db.collection(COLLECTION)
        .where('userId', '==', userId)
        .where('platform', '==', platform)
        .count()
        .get();
      
      // Get unanswered count
      const unansweredSnapshot = await db.collection(COLLECTION)
        .where('userId', '==', userId)
        .where('platform', '==', platform)
        .where('answered', '==', false)
        .count()
        .get();
      
      stats[platform] = {
        total: totalSnapshot.data().count,
        unanswered: unansweredSnapshot.data().count,
        answered: totalSnapshot.data().count - unansweredSnapshot.data().count
      };
    }
    
    logger.info('Retrieved social stats', { userId });
    
    return stats;
  } catch (error) {
    logger.error('Error getting social stats', { error, userId });
    throw error;
  }
} 