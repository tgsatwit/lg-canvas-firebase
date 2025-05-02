import useSWR, { mutate } from 'swr';
import { toast } from '@/hooks/use-toast';
import { SocialPlatform, SocialComment } from '@/lib/firebase/social';

const API_BASE = '/api/social';

/**
 * Format API errors for display
 */
function handleApiError(error: any): string {
  if (error.response) {
    try {
      const data = error.response.data;
      if (data && data.error) {
        return data.error;
      }
    } catch (e) {
      // Fall back to generic error
    }
  }
  return error.message || 'Something went wrong';
}

/**
 * Hook for accessing and managing social media monitoring data
 */
export function useSocialApi() {
  /**
   * Fetch social media comments with optional filtering
   */
  const getComments = (options?: {
    platform?: SocialPlatform;
    answered?: boolean;
    limit?: number;
  }) => {
    const { platform, answered, limit } = options || {};
    
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);
    if (answered !== undefined) params.append('answered', String(answered));
    if (limit) params.append('limit', String(limit));
    
    const queryString = params.toString();
    const url = `${API_BASE}/get-comments${queryString ? `?${queryString}` : ''}`;
    
    return useSWR<{ success: boolean; data: SocialComment[] }>(
      url,
      async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const error = new Error('Failed to fetch comments');
          const data = await res.json().catch(() => ({}));
          (error as any).response = { data };
          throw error;
        }
        return res.json();
      }
    );
  };
  
  /**
   * Fetch social media stats
   */
  const getStats = () => {
    return useSWR<{ 
      success: boolean; 
      data: Record<SocialPlatform, { 
        total: number; 
        answered: number; 
        unanswered: number; 
      }> 
    }>(
      `${API_BASE}/get-stats`,
      async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const error = new Error('Failed to fetch stats');
          const data = await res.json().catch(() => ({}));
          (error as any).response = { data };
          throw error;
        }
        return res.json();
      }
    );
  };
  
  /**
   * Mark a comment as answered or unanswered
   */
  const markCommentAnswered = async (
    commentId: string,
    platform: SocialPlatform,
    answered: boolean = true
  ) => {
    try {
      const response = await fetch(`${API_BASE}/mark-answered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          platform,
          answered,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update comment status');
      }
      
      // Invalidate both comments and stats caches to reflect the change
      await mutate((key) => 
        typeof key === 'string' && key.startsWith(`${API_BASE}/get-comments`)
      );
      await mutate(`${API_BASE}/get-stats`);
      
      toast({
        title: 'Success',
        description: `Comment ${answered ? 'marked as answered' : 'marked as unanswered'}`,
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      
      return false;
    }
  };
  
  return {
    getComments,
    getStats,
    markCommentAnswered,
  };
} 