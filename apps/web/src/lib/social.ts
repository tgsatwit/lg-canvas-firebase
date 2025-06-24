/**
 * Types and utility functions for social media integrations
 */

export interface SocialComment {
  id: string;
  platform: string;
  author: string;
  content: string;
  date: string;
  postTitle?: string;
  postId: string;
  answered: boolean;
}

export type PlatformType = 'facebook' | 'instagram' | 'youtube' | 'all';

export interface SocialStats {
  facebook: number;
  instagram: number;
  youtube: number;
  total: number;
  unanswered: number;
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
    // In a real implementation, this would use the appropriate platform API
    // Here we're just mocking the functionality
    
    // Call the API endpoint to send the reply
    const response = await fetch('/api/social/send-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        commentId,
        reply,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send reply: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`Error replying to ${platform} comment:`, error);
    return false;
  }
}

/**
 * Generate AI-powered replies for comments
 */
export async function generateReplies(
  comments: SocialComment[],
  tone: 'friendly' | 'professional' | 'casual' = 'professional',
  maxLength: number = 200
): Promise<Record<string, string>> {
  try {
    const response = await fetch('/api/social/generate-replies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comments: comments.map(comment => ({
          id: comment.id,
          platform: comment.platform,
          author: comment.author,
          content: comment.content,
          postTitle: comment.postTitle,
        })),
        tone,
        maxLength,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate replies: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert array of replies to a Record object keyed by comment ID
    const repliesRecord: Record<string, string> = {};
    data.replies.forEach((reply: any) => {
      repliesRecord[reply.id] = reply.generatedReply;
    });
    
    return repliesRecord;
  } catch (error) {
    console.error('Error generating replies:', error);
    return {};
  }
} 