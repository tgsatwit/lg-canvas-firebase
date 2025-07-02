import { useState, useEffect } from 'react';
import { YouTubeVideo, YouTubeChannel, youtubeVideosService } from '@/lib/firebase/youtube-videos-service';

export interface UseYouTubeVideosReturn {
  videos: YouTubeVideo[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  searchVideos: (searchTerm: string) => Promise<void>;
  isSearching: boolean;
}

export function useYouTubeVideos(maxResults: number = 50): UseYouTubeVideosReturn {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedVideos = await youtubeVideosService.getYouTubeVideos(maxResults);
      setVideos(fetchedVideos);
      
    } catch (err) {
      console.error('Error fetching YouTube videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch YouTube videos'));
    } finally {
      setLoading(false);
    }
  };

  const searchVideos = async (searchTerm: string) => {
    try {
      setIsSearching(true);
      setError(null);
      
      if (!searchTerm.trim()) {
        // If search term is empty, fetch all videos
        await fetchVideos();
        return;
      }
      
      const searchResults = await youtubeVideosService.searchYouTubeVideos(searchTerm, maxResults);
      setVideos(searchResults);
      
    } catch (err) {
      console.error('Error searching YouTube videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to search YouTube videos'));
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [maxResults]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
    searchVideos,
    isSearching
  };
}

export interface UseYouTubeChannelReturn {
  channel: YouTubeChannel | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useYouTubeChannel(channelId: string = 'UCb435cXWG9w_iT-SPHZcsvw'): UseYouTubeChannelReturn {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChannel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedChannel = await youtubeVideosService.getChannelInfo(channelId);
      setChannel(fetchedChannel);
      
    } catch (err) {
      console.error('Error fetching YouTube channel:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch YouTube channel'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannel();
  }, [channelId]);

  return {
    channel,
    loading,
    error,
    refetch: fetchChannel
  };
}

export interface UseYouTubeStatsReturn {
  stats: {
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
  } | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useYouTubeStats(): UseYouTubeStatsReturn {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedStats = await youtubeVideosService.getVideoStatsSummary();
      setStats(fetchedStats);
      
    } catch (err) {
      console.error('Error fetching YouTube stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch YouTube stats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

export interface UseYouTubeAnalyticsReturn {
  analytics: {
    currentWeek: {
      views: number;
      likes: number;
      comments: number;
      subscribersGained: number;
      subscribersLost: number;
      netSubscribers: number;
      estimatedMinutesWatched: number;
      averageViewDuration: number;
      dateRange: { start: string; end: string };
    };
    previousWeek: {
      views: number;
      likes: number;
      comments: number;
      subscribersGained: number;
      subscribersLost: number;
      netSubscribers: number;
      estimatedMinutesWatched: number;
      averageViewDuration: number;
      dateRange: { start: string; end: string };
    };
    trends: {
      viewsChange: number;
      likesChange: number;
      commentsChange: number;
      subscribersChange: number;
      watchTimeChange: number;
    };
    summary: {
      weeklyViews: number;
      weeklyLikes: number;
      weeklySubscribers: number;
      weeklyWatchTime: number;
      averageViewDuration: number;
    };
  } | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useYouTubeAnalytics(): UseYouTubeAnalyticsReturn {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedAnalytics = await youtubeVideosService.getYouTubeAnalytics();
      setAnalytics(fetchedAnalytics);
      
    } catch (err: unknown) {
      console.error('Error fetching YouTube Analytics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch YouTube Analytics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
}