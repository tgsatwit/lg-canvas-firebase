"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Loader2,
  Save,
  Upload,
  Wand2,
  Instagram,
  Mail,
  BookOpen,
  Youtube,
  RotateCcw
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
  
  // Update video form state
  const [updateForm, setUpdateForm] = useState({
    title: '',
    description: '',
    tags: '',
    privacyStatus: 'public'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isUpdatingYoutube, setIsUpdatingYoutube] = useState(false);
  
  // Generate content form state
  const [contentType, setContentType] = useState('youtube-post');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Reset forms when video changes
  useEffect(() => {
    setCopiedField(null);
    if (video) {
      setUpdateForm({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags?.join(', ') || '',
        privacyStatus: video.privacyStatus || 'public'
      });
    }
    setGeneratedContent('');
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

  // Helper functions for update tab
  const generateMetadata = async (type: 'title' | 'description' | 'tags') => {
    if (!video?.transcript) {
      alert('No transcript available. Please fetch the transcript first.');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/youtube/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          type,
          transcript: video.transcript,
          currentTitle: video.title,
          currentDescription: video.description,
          currentTags: video.tags
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUpdateForm(prev => ({
          ...prev,
          [type]: data.generated
        }));
      } else {
        const error = await response.json();
        alert(`Failed to generate ${type}: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Failed to generate ${type}:`, error);
      alert(`Failed to generate ${type}: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!video?.id) return;
    
    setIsSavingDraft(true);
    try {
      const response = await fetch('/api/youtube/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          updates: {
            title: updateForm.title,
            description: updateForm.description,
            tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            privacyStatus: updateForm.privacyStatus
          }
        }),
      });
      
      if (response.ok) {
        alert('Draft saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save draft: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert(`Failed to save draft: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const updateYouTube = async () => {
    if (!video?.id) return;
    
    setIsUpdatingYoutube(true);
    try {
      const response = await fetch('/api/youtube/update-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          updates: {
            title: updateForm.title,
            description: updateForm.description,
            tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            privacyStatus: updateForm.privacyStatus
          }
        }),
      });
      
      if (response.ok) {
        alert('YouTube video updated successfully!');
        // Update the video in the parent component
        if (onVideoUpdate) {
          onVideoUpdate(video.id, {
            title: updateForm.title,
            description: updateForm.description,
            tags: updateForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            privacyStatus: updateForm.privacyStatus
          });
        }
      } else {
        const error = await response.json();
        alert(`Failed to update YouTube video: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to update YouTube video:', error);
      alert(`Failed to update YouTube video: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsUpdatingYoutube(false);
    }
  };

  const generateContent = async () => {
    if (!video?.transcript) {
      alert('No transcript available. Please fetch the transcript first.');
      return;
    }
    
    setIsGeneratingContent(true);
    try {
      const response = await fetch('/api/youtube/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: video.id,
          contentType,
          transcript: video.transcript,
          videoTitle: video.title,
          videoDescription: video.description,
          videoTags: video.tags
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.content);
      } else {
        const error = await response.json();
        alert(`Failed to generate content: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert(`Failed to generate content: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const resetToOriginalValues = () => {
    if (video) {
      setUpdateForm({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags?.join(', ') || '',
        privacyStatus: video.privacyStatus || 'public'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-semibold pr-8 line-clamp-2">
            {video.title}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-2 border-b flex-shrink-0">
            <TabsList className="grid w-full grid-cols-5 text-xs md:text-sm">
              <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="description" className="text-xs md:text-sm">Description</TabsTrigger>
              <TabsTrigger value="transcript" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Transcript</span>
                <span className="sm:hidden">Script</span>
                {hasTranscript && <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>}
              </TabsTrigger>
              <TabsTrigger value="update" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Update Video</span>
                <span className="sm:hidden">Update</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="text-xs md:text-sm">
                <span className="hidden sm:inline">Generate Content</span>
                <span className="sm:hidden">Generate</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6 py-4">
            <TabsContent value="overview" className="space-y-6 mt-0">
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

            <TabsContent value="description" className="space-y-4 mt-0">
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

            <TabsContent value="transcript" className="space-y-4 mt-0">
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
              <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] border">
                <div>
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
              </div>
            </TabsContent>

            <TabsContent value="update" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Update Video
                </h3>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateMetadata('title')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Input
                      value={updateForm.title}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Video title"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500">{updateForm.title.length}/100 characters</p>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateMetadata('description')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={updateForm.description}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Video description"
                      rows={6}
                      maxLength={5000}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">{updateForm.description.length}/5000 characters</p>
                  </div>
                  
                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateMetadata('tags')}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Input
                      value={updateForm.tags}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="Comma-separated tags"
                    />
                    <p className="text-xs text-gray-500">Separate tags with commas</p>
                  </div>
                  
                  {/* Privacy Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Privacy Status</label>
                    <Select
                      value={updateForm.privacyStatus}
                      onValueChange={(value) => setUpdateForm(prev => ({ ...prev, privacyStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={resetToOriginalValues}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveDraft}
                      disabled={isSavingDraft}
                    >
                      {isSavingDraft ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Draft
                    </Button>
                    <Button
                      onClick={updateYouTube}
                      disabled={isUpdatingYoutube}
                    >
                      {isUpdatingYoutube ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Update YouTube
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="generate" className="space-y-6 mt-0">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Generate Content
                </h3>
                
                <div className="space-y-4">
                  {/* Content Type Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Content Type</label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube-post">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4" />
                            YouTube Post
                          </div>
                        </SelectItem>
                        <SelectItem value="instagram-post">
                          <div className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Instagram Post
                          </div>
                        </SelectItem>
                        <SelectItem value="blog-article">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Blog Article
                          </div>
                        </SelectItem>
                        <SelectItem value="email-snippet">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Snippet
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Generate Button */}
                  <Button
                    onClick={generateContent}
                    disabled={isGeneratingContent}
                    className="w-full"
                  >
                    {isGeneratingContent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate {contentType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </>
                    )}
                  </Button>
                  
                  {/* Generated Content */}
                  {generatedContent && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Generated Content</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent, 'generated-content')}
                        >
                          {copiedField === 'generated-content' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}