// Client-side service that uses API endpoints instead of direct Firebase calls

export interface YouTubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  thumbnail?: {
    default?: string;
    medium?: string;
    high?: string;
    standard?: string;
    maxres?: string;
  };
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  url: string;
  studioUrl: string;
  
  // Video metadata
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
  duration?: string;
  dimension?: string;
  definition?: string;
  caption?: string;
  
  // Statistics
  viewCount?: number;
  likeCount?: number;
  dislikeCount?: number;
  favoriteCount?: number;
  commentCount?: number;
  
  // Status
  uploadStatus?: string;
  privacyStatus?: string;
  license?: string;
  embeddable?: boolean;
  publicStatsViewable?: boolean;
  
  // Transcript
  transcript?: string;
  transcriptFetched?: boolean;
  transcriptMethod?: string;
  
  // Sync metadata
  syncedAt: string;
  lastModified: string;
  source: string;
}

export interface YouTubeChannel {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails?: any;
  country?: string;
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  syncedAt: string;
  lastSyncedVideoCount: number;
}

export class YouTubeVideosService {
  private static instance: YouTubeVideosService;
  
  static getInstance(): YouTubeVideosService {
    if (!YouTubeVideosService.instance) {
      YouTubeVideosService.instance = new YouTubeVideosService();
    }
    return YouTubeVideosService.instance;
  }
  
  /**
   * Fetch all YouTube videos via API
   */
  async getYouTubeVideos(maxResults: number = 50, fetchAll: boolean = false): Promise<YouTubeVideo[]> {
    try {
      console.log(`📚 Fetching YouTube videos via API... ${fetchAll ? '(ALL)' : `(limit: ${maxResults})`}`);
      
      if (fetchAll) {
        const response = await fetch('/api/youtube/videos/stored?all=true');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Fetched ${data.videos?.length || 0} YouTube videos via API (ALL)`);
        return data.videos || [];
      }
      
      const response = await fetch(`/api/youtube/videos/stored?limit=${maxResults}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.videos?.length || 0} YouTube videos via API`);
      return data.videos || [];
      
    } catch (error) {
      console.error('❌ Error fetching YouTube videos:', error);
      throw new Error('Failed to fetch YouTube videos');
    }
  }

  /**
   * Fetch all YouTube videos with pagination support
   */
  async getAllYouTubeVideos(): Promise<YouTubeVideo[]> {
    try {
      console.log('📚 Fetching ALL YouTube videos via API...');
      
      const response = await fetch('/api/youtube/videos/stored?all=true');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.videos?.length || 0} YouTube videos via API (ALL)`);
      return data.videos || [];
      
    } catch (error) {
      console.error('❌ Error fetching all YouTube videos:', error);
      throw new Error('Failed to fetch all YouTube videos');
    }
  }
  
  /**
   * Get a specific YouTube video by ID via API
   */
  async getYouTubeVideo(videoId: string): Promise<YouTubeVideo | null> {
    try {
      console.log(`🔍 Fetching YouTube video: ${videoId}`);
      
      const response = await fetch(`/api/youtube/videos/${videoId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.video;
      
    } catch (error) {
      console.error('❌ Error fetching YouTube video:', error);
      throw new Error('Failed to fetch YouTube video');
    }
  }
  
  /**
   * Get channel information via API
   */
  async getChannelInfo(channelId: string = 'UCb435cXWG9w_iT-SPHZcsvw'): Promise<YouTubeChannel | null> {
    try {
      console.log(`📺 Fetching YouTube channel info: ${channelId}`);
      
      const response = await fetch(`/api/youtube/channel/${channelId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.channel;
      
    } catch (error) {
      console.error('❌ Error fetching YouTube channel info:', error);
      throw new Error('Failed to fetch YouTube channel info');
    }
  }
  
  /**
   * Search YouTube videos by title or description
   */
  async searchYouTubeVideos(searchTerm: string, maxResults: number = 20): Promise<YouTubeVideo[]> {
    try {
      console.log(`🔍 Searching YouTube videos for: ${searchTerm}`);
      
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchTerm)}&limit=${maxResults}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Found ${data.videos?.length || 0} matching videos`);
      return data.videos || [];
      
    } catch (error) {
      console.error('❌ Error searching YouTube videos:', error);
      throw new Error('Failed to search YouTube videos');
    }
  }
  
  /**
   * Get video statistics summary via API
   */
  async getVideoStatsSummary(): Promise<{
    totalVideos: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    averageViews: number;
    mostViewedVideo?: YouTubeVideo;
    trends?: {
      viewsTrend: number;
      likesTrend: number;
      commentsTrend: number;
      videosTrend: number;
    };
    monthlyBreakdown?: {
      currentMonth: {
        videos: number;
        views: number;
        likes: number;
        comments: number;
      };
      lastMonth: {
        videos: number;
        views: number;
        likes: number;
        comments: number;
      };
    };
  }> {
    try {
      console.log('📊 Fetching video statistics summary...');
      
      const response = await fetch('/api/youtube/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Video statistics fetched');
      return data.stats;
      
    } catch (error) {
      console.error('❌ Error fetching video statistics:', error);
      throw new Error('Failed to fetch video statistics');
    }
  }

  /**
   * Get YouTube Analytics data via API
   */
  async getYouTubeAnalytics(): Promise<{
    currentWeek: {
      views: number;
      likes: number;
      comments: number;
      subscribersGained?: number;
      subscribersLost?: number;
      netSubscribers?: number;
      estimatedMinutesWatched?: number;
      averageViewDuration?: number;
      videosPublished?: number;
      dateRange: { start: string; end: string };
    };
    previousWeek: {
      views: number;
      likes: number;
      comments: number;
      subscribersGained?: number;
      subscribersLost?: number;
      netSubscribers?: number;
      estimatedMinutesWatched?: number;
      averageViewDuration?: number;
      videosPublished?: number;
      dateRange: { start: string; end: string };
    };
    trends: {
      viewsChange: number;
      likesChange: number;
      commentsChange: number;
      subscribersChange?: number;
      watchTimeChange?: number;
    };
    summary: {
      weeklyViews: number;
      weeklyLikes: number;
      weeklySubscribers?: number;
      weeklyWatchTime?: number;
      averageViewDuration?: number;
      weeklyVideos?: number;
    };
    fallback?: boolean;
    message?: string;
  }> {
    try {
      console.log('📊 Fetching YouTube Analytics...');
      
      const response = await fetch('/api/youtube/analytics');
      
      const data = await response.json();
      
      // Check if we got fallback data (successful response but using basic stats)
      if (response.ok && data.fallback) {
        console.log('📊 Using fallback analytics data');
        return {
          ...data.analytics,
          fallback: true,
          message: data.message || 'Using basic video statistics instead of Analytics API'
        };
      }
      
      if (!response.ok) {
        // Extract specific error information from the API response
        const errorType = data.details || 'UNKNOWN_ERROR';
        let errorMessage = data.error || 'Failed to fetch YouTube Analytics';
        
        if (errorType === 'ANALYTICS_NOT_AVAILABLE') {
          errorMessage = 'ANALYTICS_NOT_AVAILABLE';
        } else if (errorType === 'AUTHENTICATION_REQUIRED') {
          errorMessage = 'AUTHENTICATION_REQUIRED';
        } else if (response.status === 401) {
          errorMessage = 'AUTHENTICATION_REQUIRED';
        } else if (response.status === 403) {
          errorMessage = 'ANALYTICS_NOT_AVAILABLE';
        }
        
        throw new Error(errorMessage);
      }
      
      console.log('✅ YouTube Analytics fetched');
      return data.analytics;
      
    } catch (error) {
      console.error('❌ Error fetching YouTube Analytics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch YouTube Analytics');
    }
  }
}

// Export singleton instance
export const youtubeVideosService = YouTubeVideosService.getInstance();