"use client";

import { useState, useEffect } from 'react';
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
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['all']));
  const [selectedPrivacy, setSelectedPrivacy] = useState<Set<string>>(new Set(['all']));
  const { videos, loading, error, refetch, searchVideos, isSearching, updateVideo, pagination, displayedVideos } = useYouTubeVideos(50, true);
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

  // Helper functions for filter management
  const toggleTypeFilter = (type: string) => {
    const newSelectedTypes = new Set(selectedTypes);
    
    if (type === 'all') {
      setSelectedTypes(new Set(['all']));
    } else {
      // Remove 'all' if selecting specific types
      newSelectedTypes.delete('all');
      
      if (newSelectedTypes.has(type)) {
        newSelectedTypes.delete(type);
      } else {
        newSelectedTypes.add(type);
      }
      
      // If no specific types selected, default back to 'all'
      if (newSelectedTypes.size === 0) {
        newSelectedTypes.add('all');
      }
      
      setSelectedTypes(newSelectedTypes);
    }
  };

  const togglePrivacyFilter = (privacy: string) => {
    const newSelectedPrivacy = new Set(selectedPrivacy);
    
    if (privacy === 'all') {
      setSelectedPrivacy(new Set(['all']));
    } else {
      // Remove 'all' if selecting specific privacy levels
      newSelectedPrivacy.delete('all');
      
      if (newSelectedPrivacy.has(privacy)) {
        newSelectedPrivacy.delete(privacy);
      } else {
        newSelectedPrivacy.add(privacy);
      }
      
      // If no specific privacy levels selected, default back to 'all'
      if (newSelectedPrivacy.size === 0) {
        newSelectedPrivacy.add('all');
      }
      
      setSelectedPrivacy(newSelectedPrivacy);
    }
  };

  const clearAllFilters = () => {
    setSelectedTypes(new Set(['all']));
    setSelectedPrivacy(new Set(['all']));
  };

  // Reset pagination when filters change
  useEffect(() => {
    pagination.setCurrentPage(1);
  }, [selectedTypes, selectedPrivacy, searchTerm]);

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
    if (!selectedTypes.has('all')) {
      const videoIsShort = isShort(video);
      const shouldInclude = 
        (selectedTypes.has('shorts') && videoIsShort) ||
        (selectedTypes.has('videos') && !videoIsShort);
      
      if (!shouldInclude) return false;
    }
    
    // Privacy filter
    if (!selectedPrivacy.has('all')) {
      const privacy = video.privacyStatus?.toLowerCase() || 'unknown';
      if (!selectedPrivacy.has(privacy)) return false;
    }
    
    return true;
  });

  // Apply pagination to filtered videos
  const totalFilteredItems = filteredVideos.length;
  const totalFilteredPages = Math.ceil(totalFilteredItems / pagination.itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
  const endIndex = startIndex + pagination.itemsPerPage;
  const paginatedFilteredVideos = filteredVideos.slice(startIndex, endIndex);


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
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatNumber(stats?.totalLikes || 0)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total likes • {analyticsLoading ? '...' : (analyticsError ? 'N/A' : 
                  videos.filter(video => {
                    const publishDate = new Date(video.publishedAt);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return publishDate >= weekAgo;
                  }).length
                )} recent videos
              </p>
              {!statsLoading && stats?.trends && renderTrend(stats.trends.likesTrend)}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Analytics Information */}
      {(analyticsError || analytics?.fallback) && (
        <Card className={analytics?.fallback ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50"}>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-2 ${analytics?.fallback ? 'text-blue-800' : 'text-yellow-800'}`}>
              <ExternalLink className="h-4 w-4" />
              <p className="text-sm font-medium">
                {analytics?.fallback 
                  ? 'Using Basic Analytics' 
                  : analyticsError?.message?.includes('ANALYTICS_NOT_AVAILABLE') 
                  ? 'YouTube Analytics Not Available' 
                  : analyticsError?.message?.includes('AUTHENTICATION_REQUIRED')
                  ? 'YouTube Authentication Required'
                  : 'YouTube Analytics Unavailable'
                }
              </p>
            </div>
            <p className={`text-xs mt-1 ${analytics?.fallback ? 'text-blue-700' : 'text-yellow-700'}`}>
              {analytics?.fallback ? (
                <>
                  {analytics.message || 'YouTube Analytics API not available - using basic video statistics instead.'} 
                  <br />Some metrics may be limited or unavailable.
                </>
              ) : analyticsError?.message?.includes('ANALYTICS_NOT_AVAILABLE') ? (
                <>
                  Weekly analytics require YouTube Partner Program eligibility (1000+ subscribers and 4000+ watch hours). 
                  <br />Your channel may not meet these requirements yet.
                </>
              ) : analyticsError?.message?.includes('AUTHENTICATION_REQUIRED') ? (
                'Please re-authenticate with YouTube to access Analytics data.'
              ) : (
                'Weekly analytics require YouTube Analytics API access. This feature may not be available for all channels.'
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search Bar and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Videos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          
          {/* Filters */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Filters:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 min-w-[60px]">Type:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'all', label: 'All', count: filteredStats.total },
                    { key: 'videos', label: 'Videos', count: filteredStats.videos },
                    { key: 'shorts', label: 'Shorts', count: filteredStats.shorts }
                  ].map((type) => (
                    <Button
                      key={type.key}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTypeFilter(type.key)}
                      className={`h-6 px-2 text-xs transition-all duration-200 ${
                        selectedTypes.has(type.key) 
                          ? 'bg-pink-600 text-white hover:bg-pink-700 border-pink-600' 
                          : 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-700 border-gray-200'
                      }`}
                    >
                      {type.label} ({type.count})
                    </Button>
                  ))}
                </div>
              </div>

              {/* Privacy Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 min-w-[60px]">Privacy:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: 'all', label: 'All', count: videos.length },
                    { key: 'public', label: 'Public', count: filteredStats.public },
                    { key: 'private', label: 'Private', count: filteredStats.private },
                    { key: 'unlisted', label: 'Unlisted', count: filteredStats.unlisted },
                    { key: 'members', label: 'Members', count: filteredStats.members }
                  ].map((privacy) => (
                    <Button
                      key={privacy.key}
                      variant="outline"
                      size="sm"
                      onClick={() => togglePrivacyFilter(privacy.key)}
                      className={`h-6 px-2 text-xs transition-all duration-200 ${
                        selectedPrivacy.has(privacy.key) 
                          ? 'bg-pink-600 text-white hover:bg-pink-700 border-pink-600' 
                          : 'bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-700 border-gray-200'
                      }`}
                    >
                      {privacy.label} ({privacy.count})
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>
                Videos ({filteredVideos.length})
                {!selectedTypes.has('all') && selectedTypes.size > 0 && (
                  <div className="inline-flex ml-2 gap-1">
                    {Array.from(selectedTypes).map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type === 'shorts' ? 'Shorts' : type === 'videos' ? 'Videos' : type}
                      </Badge>
                    ))}
                  </div>
                )}
                {!selectedPrivacy.has('all') && selectedPrivacy.size > 0 && (
                  <div className="inline-flex ml-2 gap-1">
                    {Array.from(selectedPrivacy).map(privacy => (
                      <Badge key={privacy} variant="outline" className="text-xs">
                        {privacy.charAt(0).toUpperCase() + privacy.slice(1)}
                      </Badge>
                    ))}
                  </div>
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
            </div>
            
            {/* Items per page selector and sync button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <Select 
                  value={pagination.itemsPerPage.toString()} 
                  onValueChange={(value) => pagination.setItemsPerPage(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSync} 
                disabled={isSyncing}
                size="sm"
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
            </div>
          </div>
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
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedFilteredVideos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onClick={() => handleVideoClick(video)}
                    isShort={isShort(video)}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalFilteredPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredItems)} of {totalFilteredItems} videos
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.setCurrentPage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                        let pageNum;
                        if (totalFilteredPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= totalFilteredPages - 2) {
                          pageNum = totalFilteredPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => pagination.setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.setCurrentPage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === totalFilteredPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Video Details Modal */}
      <YouTubeVideoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        video={selectedVideo}
        onVideoUpdate={updateVideo}
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

  // Enhanced thumbnail URL getter with multiple fallbacks
  const getThumbnailUrl = (video: YouTubeVideo) => {
    // Try stored thumbnail URLs first
    const thumbnail = video.thumbnail;
    if (thumbnail) {
      const storedUrl = thumbnail.maxres || 
                      thumbnail.high || 
                      thumbnail.standard || 
                      thumbnail.medium || 
                      thumbnail.default;
      if (storedUrl) {
        return storedUrl;
      }
    }
    
    // Fallback to constructing URL from YouTube ID
    if (video.youtubeId) {
      return `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`;
    }
    
    // Try to extract YouTube ID from URL
    if (video.url) {
      const urlMatch = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (urlMatch && urlMatch[1]) {
        const extractedId = urlMatch[1];
        return `https://i.ytimg.com/vi/${extractedId}/mqdefault.jpg`;
      }
    }
    
    // Final fallback - try to extract from video.id if it contains YouTube ID
    if (video.id && video.id.length === 11) {
      return `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
    }
    
    return null;
  };

  return (
    <div 
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {getThumbnailUrl(video) ? (
            <img
              src={getThumbnailUrl(video)!}
              alt={video.title}
              className="w-32 h-24 object-cover rounded bg-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Try fallback URL using video ID if original fails
                const fallbackUrl = video.youtubeId 
                  ? `https://i.ytimg.com/vi/${video.youtubeId}/default.jpg`
                  : null;
                
                if (fallbackUrl && target.src !== fallbackUrl) {
                  target.src = fallbackUrl;
                } else {
                  // If fallback also fails, show no image placeholder
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-32 h-24 bg-gray-200 rounded flex items-center justify-center"><span class="text-gray-500 text-xs">No Image</span></div>';
                  }
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
              
              <Button
                size="sm"
                variant="outline"
                title={video.transcriptFetched ? "Transcript available - click to refresh" : "Fetch transcript"}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(); // This will open the modal where transcript can be fetched
                }}
                className={video.transcriptFetched ? "bg-green-50 border-green-200 text-green-700" : ""}
              >
                <FileText className="h-4 w-4" />
                {video.transcriptFetched && <span className="ml-1 text-xs">✓</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 