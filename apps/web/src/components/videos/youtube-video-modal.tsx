"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ExternalLink, 
  Calendar, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Clock, 
  Globe, 
  Lock, 
  Users, 
  Shield,
  FileText,
  Tag,
  Play,
  Copy,
  CheckCircle,
  Download,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { YouTubeVideo } from '@/lib/firebase/youtube-videos-service';

interface YouTubeVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: YouTubeVideo | null;
  onVideoUpdate?: (videoId: string, updates: Partial<YouTubeVideo>) => void;
}

export function YouTubeVideoModal({ open, onOpenChange, video, onVideoUpdate }: YouTubeVideoModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);

  // Reset copied field when video changes
  useEffect(() => {
    setCopiedField(null);
  }, [video?.id]);

  if (!video) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getPrivacyIcon = (privacyStatus?: string) => {
    switch (privacyStatus?.toLowerCase()) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'private':
        return <Lock className="h-4 w-4 text-red-600" />;
      case 'unlisted':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      case 'members':
        return <Users className="h-4 w-4 text-blue-600" />;
      default:
        return <Globe className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPrivacyColor = (privacyStatus?: string) => {
    switch (privacyStatus?.toLowerCase()) {
      case 'public':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'private':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unlisted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'members':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const fetchTranscript = async () => {
    if (!video?.youtubeId || fetchingTranscript) return;
    
    setFetchingTranscript(true);
    try {
      // Add force parameter to always refresh
      const response = await fetch(`/api/youtube/transcripts?videoId=${video.youtubeId}&force=true`);
      const data = await response.json();
      
      if (data.success) {
        const transcriptText = data.transcript || 'Transcript fetched successfully but is empty.';
        
        // Update the video in the parent component to refresh the UI
        if (video?.id && onVideoUpdate) {
          onVideoUpdate(video.id, {
            transcript: transcriptText,
            transcriptMethod: data.method,
            transcriptFetched: true
          });
        }
        
        // Also update the local video object for immediate UI update
        if (video && typeof video === 'object') {
          video.transcript = transcriptText;
          video.transcriptMethod = data.method;
          video.transcriptFetched = true;
        }
      } else {
        alert(`Failed to fetch transcript: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
      alert(`Failed to fetch transcript: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setFetchingTranscript(false);
    }
  };

  // Use transcript directly from video data
  const currentTranscript = video?.transcript;
  const hasTranscript = !!(video?.transcript || video?.transcriptFetched);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold pr-8">
            {video.title}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="transcript">
              Transcript
              {hasTranscript && <Badge variant="secondary" className="ml-2">✓</Badge>}
            </TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[calc(90vh-180px)] mt-4 pr-4">
            <TabsContent value="overview" className="space-y-6">
              {/* Video Preview and Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thumbnail */}
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    {video.thumbnail?.high || video.thumbnail?.medium || video.thumbnail?.default ? (
                      <img
                        src={video.thumbnail.high || video.thumbnail.medium || video.thumbnail.default}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load thumbnail:', video.thumbnail);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200"><div class="h-12 w-12 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-full w-full"><polygon points="5,3 19,12 5,21"></polygon></svg></div></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Play className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(video.url, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch on YouTube
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(video.studioUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Studio
                    </Button>
                  </div>
                </div>

                {/* Video Stats and Details */}
                <div className="space-y-4">
                  {/* Privacy Status */}
                  <div className="flex items-center gap-2">
                    {getPrivacyIcon(video.privacyStatus)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPrivacyColor(video.privacyStatus)}`}>
                      {(video.privacyStatus || 'Unknown').charAt(0).toUpperCase() + (video.privacyStatus || 'unknown').slice(1)}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Eye className="h-4 w-4" />
                        Views
                      </div>
                      <div className="text-lg font-semibold">{formatNumber(video.viewCount || 0)}</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <ThumbsUp className="h-4 w-4" />
                        Likes
                      </div>
                      <div className="text-lg font-semibold">{formatNumber(video.likeCount || 0)}</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MessageCircle className="h-4 w-4" />
                        Comments
                      </div>
                      <div className="text-lg font-semibold">{formatNumber(video.commentCount || 0)}</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4" />
                        Duration
                      </div>
                      <div className="text-lg font-semibold">{formatDuration(video.duration)}</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Published:</span>
                      <span className="font-medium">{formatDate(video.publishedAt)}</span>
                    </div>
                    {video.syncedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Last Synced:</span>
                        <span className="font-medium">{formatDate(video.syncedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags ({video.tags.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(video.description, 'description')}
                >
                  {copiedField === 'description' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                <p className="text-sm whitespace-pre-wrap">
                  {video.description || 'No description available'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcript
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTranscript}
                    disabled={fetchingTranscript}
                  >
                    {fetchingTranscript ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {hasTranscript ? 'Refresh Transcript' : 'Fetch Transcript'}
                      </>
                    )}
                  </Button>
                  {currentTranscript && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentTranscript, 'transcript')}
                    >
                      {copiedField === 'transcript' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>


              {/* Transcript Content */}
              <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-hidden">
                <ScrollArea className="h-full w-full">
                <div className="pr-4">
                  {fetchingTranscript ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Fetching and processing transcript...</p>
                      </div>
                    </div>
                  ) : currentTranscript ? (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {currentTranscript}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-2">No transcript available</p>
                      <p className="text-xs text-gray-500 mb-4">
                        Click "Fetch Transcript" to retrieve and process the video transcript
                      </p>
                      <Button
                        variant="outline"
                        onClick={fetchTranscript}
                        disabled={fetchingTranscript}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Fetch Transcript
                      </Button>
                    </div>
                  )}
                </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Video Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Video ID:</span>
                        <span className="text-sm font-mono">{video.youtubeId || video.id}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Channel ID:</span>
                        <span className="text-sm font-mono">{video.channelId}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Channel:</span>
                        <span className="text-sm">{video.channelTitle}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Category ID:</span>
                        <span className="text-sm">{video.categoryId || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Language:</span>
                        <span className="text-sm">{video.defaultLanguage || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Video Properties</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Definition:</span>
                        <span className="text-sm">{video.definition || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Dimension:</span>
                        <span className="text-sm">{video.dimension || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Captions:</span>
                        <span className="text-sm">{video.caption || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Embeddable:</span>
                        <span className="text-sm">{video.embeddable ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Public Stats:</span>
                        <span className="text-sm">{video.publicStatsViewable ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Metadata */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Sync Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Upload Status:</span>
                        <span className="text-sm">{video.uploadStatus || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">License:</span>
                        <span className="text-sm">{video.license || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Source:</span>
                        <span className="text-sm">{video.source || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-sm text-gray-600">Transcript Fetched:</span>
                        <span className="text-sm">{video.transcriptFetched ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}