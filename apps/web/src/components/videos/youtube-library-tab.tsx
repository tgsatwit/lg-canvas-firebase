"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Clock, 
  Eye,
  Users,
  RefreshCw,
  Search,
  ExternalLink,
  Calendar,
  ThumbsUp,
  MessageCircle,
  FileText,
  Youtube,
  TrendingUp,
  TrendingDown,
  Minus,
  Video,
  BarChart3
} from 'lucide-react';
import { useYouTubeVideos, useYouTubeStats, useYouTubeChannel, useYouTubeAnalytics } from '@/hooks/use-youtube-videos';
import { YouTubeVideo } from '@/lib/firebase/youtube-videos-service';
import { YouTubeVideoModal } from './youtube-video-modal';

export function YouTubeLibraryTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'shorts' | 'videos'>('all');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'private' | 'unlisted' | 'members'>('all');
  const { videos, loading, error, refetch, searchVideos, isSearching } = useYouTubeVideos(50);
  const { stats, loading: statsLoading } = useYouTubeStats();
  const { channel, loading: channelLoading } = useYouTubeChannel();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useYouTubeAnalytics();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      console.log('🔄 Starting sync request...');
      const response = await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Sync response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sync successful:', result);
        await refetch(); // Refresh the videos list
        alert(`Successfully synced ${result.videosProcessed} videos!`);
      } else {
        const errorData = await response.json();
        console.error('❌ Sync failed:', errorData);
        
        // Create detailed error message
        let errorMessage = `Sync failed: ${errorData.error || 'Unknown error'}`;
        if (errorData.details) {
          errorMessage += `\nDetails: ${errorData.details}`;
        }
        if (errorData.authMethod) {
          errorMessage += `\nAuth Method: ${errorData.authMethod}`;
        }
        if (errorData.suggestion) {
          errorMessage += `\nSuggestion: ${errorData.suggestion}`;
        }
        if (errorData.channelId) {
          errorMessage += `\nChannel ID: ${errorData.channelId}`;
        }
        
        alert(errorMessage);
      }
    } catch (error: unknown) {
      console.error('💥 Sync request failed:', error);
      alert(`Sync request failed: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchVideos(searchTerm);
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  // Helper function to determine if a video is a Short
  const isShort = (video: YouTubeVideo) => {
    if (!video.duration) return false;
    
    // Parse YouTube duration format (PT1M30S)
    const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return false;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds <= 60; // 60 seconds or less = Short
  };

  // Filter videos based on type and privacy
  const filteredVideos = videos.filter(video => {
    // Type filter (Shorts vs regular videos)
    if (filterType === 'shorts' && !isShort(video)) return false;
    if (filterType === 'videos' && isShort(video)) return false;
    
    // Privacy filter
    if (filterPrivacy !== 'all') {
      const privacy = video.privacyStatus?.toLowerCase();
      if (filterPrivacy === 'members' && privacy !== 'members') return false;
      if (filterPrivacy !== 'members' && privacy !== filterPrivacy) return false;
    }
    
    return true;
  });

  // Get stats for filtered videos
  const filteredStats = {
    total: filteredVideos.length,
    shorts: filteredVideos.filter(isShort).length,
    videos: filteredVideos.filter(v => !isShort(v)).length,
    public: filteredVideos.filter(v => v.privacyStatus?.toLowerCase() === 'public').length,
    private: filteredVideos.filter(v => v.privacyStatus?.toLowerCase() === 'private').length,
    unlisted: filteredVideos.filter(v => v.privacyStatus?.toLowerCase() === 'unlisted').length,
    members: filteredVideos.filter(v => v.privacyStatus?.toLowerCase() === 'members').length,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return 'N/A';
    // YouTube duration is in ISO 8601 format (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const renderTrend = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{trend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-3 w-3" />
          <span className="text-xs font-medium">{trend}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <Minus className="h-3 w-3" />
          <span className="text-xs font-medium">0%</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Button and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            <Select value={filterType} onValueChange={(value: 'all' | 'shorts' | 'videos') => setFilterType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({filteredStats.total})</SelectItem>
                <SelectItem value="videos">Videos ({filteredStats.videos})</SelectItem>
                <SelectItem value="shorts">Shorts ({filteredStats.shorts})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Privacy:</span>
            <Select value={filterPrivacy} onValueChange={(value: 'all' | 'public' | 'private' | 'unlisted' | 'members') => setFilterPrivacy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({videos.length})</SelectItem>
                <SelectItem value="public">Public ({filteredStats.public})</SelectItem>
                <SelectItem value="private">Private ({filteredStats.private})</SelectItem>
                <SelectItem value="unlisted">Unlisted ({filteredStats.unlisted})</SelectItem>
                <SelectItem value="members">Members ({filteredStats.members})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Videos'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalVideos || 0}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Published on YouTube</p>
              {!statsLoading && stats?.trends && renderTrend(stats.trends.videosTrend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatNumber(stats?.totalViews || 0)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Across {videos.length} videos
                {filteredVideos.length !== videos.length && ` (${filteredVideos.length} filtered)`}
              </p>
              {!statsLoading && stats?.trends && renderTrend(stats.trends.viewsTrend)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channelLoading ? '...' : formatNumber(channel?.subscriberCount || 0)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Channel subscribers</p>
              {/* Note: Subscriber trends would need historical data */}
              <div className="flex items-center gap-1 text-gray-400">
                <Minus className="h-3 w-3" />
                <span className="text-xs">N/A</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatNumber(stats?.totalLikes || 0)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total likes received
                {filteredVideos.length !== videos.length && ` (${filteredVideos.length} filtered)`}
              </p>
              {!statsLoading && stats?.trends && renderTrend(stats.trends.likesTrend)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : (analyticsError ? 'N/A' : formatNumber(analytics?.summary?.weeklyViews || 0))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">From new content</p>
              {!analyticsLoading && analytics?.trends && renderTrend(analytics.trends.viewsChange)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : (analyticsError ? 'N/A' : formatNumber(analytics?.summary?.weeklyLikes || 0))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">From new content</p>
              {!analyticsLoading && analytics?.trends && renderTrend(analytics.trends.likesChange)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Published</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : (analyticsError ? 'N/A' : 
                videos.filter(video => {
                  const publishDate = new Date(video.publishedAt);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return publishDate >= weekAgo;
                }).length.toString()
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Past 7 days</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? '...' : (analyticsError || !analytics?.summary?.weeklyViews ? 'N/A' : 
                stats?.totalVideos && stats.totalVideos > 0 
                  ? formatNumber(Math.round((stats.totalViews || 0) / stats.totalVideos))
                  : '0'
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Avg views per video</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Error Message */}
      {analyticsError && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <ExternalLink className="h-4 w-4" />
              <p className="text-sm font-medium">
                {analyticsError.message?.includes('ANALYTICS_NOT_AVAILABLE') 
                  ? 'YouTube Analytics Not Available' 
                  : analyticsError.message?.includes('AUTHENTICATION_REQUIRED')
                  ? 'YouTube Authentication Required'
                  : 'YouTube Analytics Unavailable'
                }
              </p>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              {analyticsError.message?.includes('ANALYTICS_NOT_AVAILABLE') ? (
                <>
                  Weekly analytics require YouTube Partner Program eligibility (1000+ subscribers and 4000+ watch hours). 
                  <br />Your channel may not meet these requirements yet.
                </>
              ) : analyticsError.message?.includes('AUTHENTICATION_REQUIRED') ? (
                'Please re-authenticate with YouTube to access Analytics data.'
              ) : (
                'Weekly analytics require YouTube Analytics API access. This feature may not be available for all channels.'
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Search Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search videos by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Videos ({filteredVideos.length})
            {filterType !== 'all' && (
              <Badge variant="secondary" className="ml-2">
                {filterType === 'shorts' ? 'Shorts' : 'Regular Videos'}
              </Badge>
            )}
            {filterPrivacy !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {filterPrivacy.charAt(0).toUpperCase() + filterPrivacy.slice(1)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {searchTerm ? `Search results for "${searchTerm}"` : 'YouTube videos from your channel'}
            {filteredVideos.length !== videos.length && (
              <span className="ml-2 text-blue-600">
                (Filtered from {videos.length} total)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading videos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading videos: {error.message}</p>
              <Button onClick={refetch} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <Youtube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No videos found matching your search.' : 'No videos found. Click "Sync Videos" to fetch your YouTube videos.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync Videos
                </Button>
              )}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-8">
              <Youtube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                No videos match the current filters.
              </p>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterType('all');
                    setFilterPrivacy('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  onClick={() => handleVideoClick(video)}
                  isShort={isShort(video)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Details Modal */}
      <YouTubeVideoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        video={selectedVideo}
      />
    </div>
  );
}

function VideoCard({ video, onClick, isShort }: { video: YouTubeVideo; onClick: () => void; isShort?: boolean }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return 'N/A';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div 
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {video.thumbnail?.medium || video.thumbnail?.default ? (
            <img
              src={video.thumbnail.medium || video.thumbnail.default}
              alt={video.title}
              className="w-32 h-24 object-cover rounded bg-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-32 h-24 bg-gray-200 rounded flex items-center justify-center"><span class="text-gray-500 text-xs">No Image</span></div>';
                }
              }}
            />
          ) : (
            <div className="w-32 h-24 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-gray-500 text-xs">No Image</span>
            </div>
          )}
        </div>
        
        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-4">
                <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                  {video.title}
                </h3>
                {isShort && (
                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 border-red-200">
                    Short
                  </Badge>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatNumber(video.viewCount || 0)}
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {formatNumber(video.likeCount || 0)}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {formatNumber(video.commentCount || 0)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(video.duration)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(video.publishedAt)}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(video.url, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Watch
              </Button>
              
              {video.transcriptFetched === true && (
                <Button
                  size="sm"
                  variant="outline"
                  title="Transcript available"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 