/**
 * Social Media API Services
 * 
 * This module exports functions for interacting with various social media platforms.
 */

export * from './instagram';
export * from './facebook';
export * from './youtube';

// Types for combined/uniform social comment interface
export interface SocialComment {
  id: string;
  platform: 'instagram' | 'facebook' | 'youtube';
  author: string;
  content: string;
  postId: string;
  postTitle?: string;
  date: string;
  answered: boolean;
  profilePicture?: string;
  url?: string;
  mediaUrl?: string;
  mediaType?: string;
  likes?: number;
}

/**
 * Fetch comments from all social media platforms
 */
export async function fetchAllSocialComments(
  platforms: ('instagram' | 'facebook' | 'youtube')[] = ['instagram', 'facebook', 'youtube'],
  limit: number = 25,
  since?: string
): Promise<SocialComment[]> {
  const { fetchInstagramComments } = await import('./instagram');
  const { fetchFacebookComments } = await import('./facebook');
  const { fetchYouTubeComments } = await import('./youtube');
  
  // Prepare empty array for combined results
  const allComments: SocialComment[] = [];
  
  // Fetch comments from each requested platform
  const fetchPromises: Promise<void>[] = [];
  
  if (platforms.includes('instagram')) {
    fetchPromises.push(
      fetchInstagramComments(limit, since)
        .then(comments => {
          // Transform Instagram comments to unified format
          comments.forEach(comment => {
            allComments.push({
              id: comment.id,
              platform: 'instagram',
              author: comment.username,
              content: comment.text,
              postId: comment.media_id,
              postTitle: comment.media_type || 'Instagram Post',
              date: comment.timestamp,
              answered: false, // Would be tracked in your database
              profilePicture: undefined, // Instagram API would provide this
              url: comment.permalink,
              mediaUrl: comment.media_url,
              mediaType: comment.media_type
            });
          });
        })
        .catch(err => console.error('Error fetching Instagram comments:', err))
    );
  }
  
  if (platforms.includes('facebook')) {
    fetchPromises.push(
      fetchFacebookComments(limit, since)
        .then(comments => {
          // Transform Facebook comments to unified format
          comments.forEach(comment => {
            allComments.push({
              id: comment.id,
              platform: 'facebook',
              author: comment.from.name,
              content: comment.message,
              postId: comment.post_id,
              postTitle: comment.post_title || 'Facebook Post',
              date: comment.created_time,
              answered: false, // Would be tracked in your database
              profilePicture: undefined, // Facebook API would provide this
              url: undefined, // Facebook API would provide this
              mediaUrl: comment.attachment?.url,
              mediaType: comment.attachment?.type
            });
          });
        })
        .catch(err => console.error('Error fetching Facebook comments:', err))
    );
  }
  
  if (platforms.includes('youtube')) {
    fetchPromises.push(
      fetchYouTubeComments(limit, since)
        .then(comments => {
          // Transform YouTube comments to unified format
          comments.forEach(comment => {
            allComments.push({
              id: comment.id,
              platform: 'youtube',
              author: comment.authorDisplayName,
              content: comment.textDisplay,
              postId: comment.videoId,
              postTitle: comment.videoTitle || 'YouTube Video',
              date: comment.publishedAt,
              answered: false, // Would be tracked in your database
              profilePicture: comment.authorProfileImageUrl,
              url: `https://www.youtube.com/watch?v=${comment.videoId}&lc=${comment.id}`,
              likes: comment.likeCount
            });
          });
        })
        .catch(err => console.error('Error fetching YouTube comments:', err))
    );
  }
  
  // Wait for all fetch operations to complete
  await Promise.all(fetchPromises);
  
  // Sort comments by date, newest first
  allComments.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Apply overall limit
  return allComments.slice(0, limit);
}

/**
 * Send a reply to a comment on any social platform
 */
export async function replySocialComment(
  platform: 'instagram' | 'facebook' | 'youtube',
  commentId: string,
  reply: string
): Promise<boolean> {
  try {
    switch (platform) {
      case 'instagram': {
        const { replyToInstagramComment } = await import('./instagram');
        return await replyToInstagramComment(commentId, reply);
      }
      case 'facebook': {
        const { replyToFacebookComment } = await import('./facebook');
        return await replyToFacebookComment(commentId, reply);
      }
      case 'youtube': {
        const { replyToYouTubeComment } = await import('./youtube');
        return await replyToYouTubeComment(commentId, reply);
      }
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Error replying to ${platform} comment:`, error);
    return false;
  }
}

/**
 * Mark a comment as answered/read on any social platform
 */
export async function markSocialCommentAsAnswered(
  platform: 'instagram' | 'facebook' | 'youtube',
  commentId: string
): Promise<boolean> {
  try {
    switch (platform) {
      case 'instagram': {
        const { markInstagramCommentAsRead } = await import('./instagram');
        return await markInstagramCommentAsRead(commentId);
      }
      case 'facebook': {
        const { markFacebookCommentAsRead } = await import('./facebook');
        return await markFacebookCommentAsRead(commentId);
      }
      case 'youtube': {
        const { markYouTubeCommentAsRead } = await import('./youtube');
        return await markYouTubeCommentAsRead(commentId);
      }
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error(`Error marking ${platform} comment as answered:`, error);
    return false;
  }
} 