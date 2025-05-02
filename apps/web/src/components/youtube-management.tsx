"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Youtube,
  MessageCircle,
  Video,
  Filter,
  Search,
  RefreshCw,
  Wand2,
  Send,
  Eye,
  CheckCircle2,
  X,
  Edit, 
  Copy, 
  Trash, 
  Check
} from 'lucide-react';
import { fetchYouTubeComments, fetchYouTubeVideos, markYouTubeCommentAsRead, replyToYouTubeComment, YouTubeComment } from '@/lib/social/youtube';
import { SocialComment } from '@/lib/social';
import { useToast } from '@/hooks/use-toast';

// Extended YouTube comment interface for our UI purposes
interface ExtendedYouTubeComment extends SocialComment {
  profilePicture?: string;
  url?: string;
  likes?: number;
}

// Type for the YouTubeComment from the API with our additional fields
type YouTubeCommentWithMeta = YouTubeComment & {
  markedAsRead?: boolean;
}

export default function YouTubeManagement() {
  const [activeTab, setActiveTab] = useState('comments');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [customReplies, setCustomReplies] = useState<Record<string, string>>({});
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [comments, setComments] = useState<ExtendedYouTubeComment[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [replySending, setReplySending] = useState<Record<string, boolean>>({});
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const { toast } = useToast();

  // Load YouTube data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load comments
        setLoadingComments(true);
        const youtubeComments = await fetchYouTubeComments(30);
        const formattedComments: ExtendedYouTubeComment[] = youtubeComments.map(comment => ({
          id: comment.id,
          platform: 'youtube',
          author: comment.authorDisplayName,
          content: comment.textDisplay,
          postId: comment.videoId,
          postTitle: comment.videoTitle || 'YouTube Video',
          date: comment.publishedAt,
          answered: false, // We'll set this manually from our app
          profilePicture: comment.authorProfileImageUrl,
          url: `https://www.youtube.com/watch?v=${comment.videoId}&lc=${comment.id}`,
          likes: comment.likeCount
        }));
        setComments(formattedComments);
        setLoadingComments(false);

        // Load videos
        setLoadingVideos(true);
        const youtubeVideos = await fetchYouTubeVideos(20);
        setVideos(youtubeVideos);
        setLoadingVideos(false);
      } catch (error) {
        console.error('Error loading YouTube data:', error);
        toast({
          title: "Error",
          description: "Failed to load YouTube data. Please try again.",
          variant: "destructive",
        });
        setLoadingComments(false);
        setLoadingVideos(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter comments based on current filter and search query
  const filteredComments = comments.filter(comment => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'answered' && comment.answered) || 
      (filter === 'unanswered' && !comment.answered);
    
    const matchesSearch = 
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.postTitle && comment.postTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  // Handle selecting all comments
  const handleSelectAllComments = () => {
    if (selectedComments.length === filteredComments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(filteredComments.map(comment => comment.id));
    }
  };

  // Handle toggling comment selection
  const handleToggleCommentSelection = (commentId: string) => {
    if (selectedComments.includes(commentId)) {
      setSelectedComments(selectedComments.filter(id => id !== commentId));
    } else {
      setSelectedComments([...selectedComments, commentId]);
    }
  };

  // Handle comment selection for expansion
  const handleSelectComment = (commentId: string) => {
    setSelectedComment(selectedComment === commentId ? null : commentId);
  };

  // Handle starting edit of reply
  const handleStartEditReply = (commentId: string) => {
    setEditingReply(commentId);
  };

  // Handle canceling edit of reply
  const handleCancelEditReply = () => {
    setEditingReply(null);
  };

  // Handle updating reply text
  const handleUpdateReply = (commentId: string, text: string) => {
    setCustomReplies({
      ...customReplies,
      [commentId]: text
    });
  };

  // Handle deleting a reply
  const handleDeleteReply = (commentId: string) => {
    const newReplies = { ...customReplies };
    delete newReplies[commentId];
    setCustomReplies(newReplies);
  };

  // Handle copying a reply to clipboard
  const handleCopyReply = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Reply copied to clipboard",
    });
  };

  // Handle generating a reply with AI
  const handleGenerateReply = async (commentId: string) => {
    setIsGeneratingReply(true);
    try {
      // Simulate AI generation (would be replaced with actual AI call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      const comment = comments.find(c => c.id === commentId);
      
      // Generate contextual reply based on comment content
      let aiReply = `Thank you for your comment on our YouTube video! `;
      
      if (comment?.content.includes("question")) {
        aiReply += `I'd be happy to answer your question. Please provide more details or check out our FAQ section for immediate assistance.`;
      } else if (comment?.content.includes("love") || comment?.content.includes("great")) {
        aiReply += `We're thrilled you enjoyed our content! Your support means a lot to us.`;
      } else if (comment?.content.includes("help") || comment?.content.includes("problem")) {
        aiReply += `I'm sorry to hear you're experiencing issues. Please email our support team at support@example.com with details, and we'll help resolve this promptly.`;
      } else {
        aiReply += `We appreciate your engagement and would love to hear more about your thoughts on this topic.`;
      }
      
      setCustomReplies({
        ...customReplies,
        [commentId]: aiReply
      });
      
      toast({
        title: "Reply Generated",
        description: "AI has generated a reply for this comment",
      });
    } catch (error) {
      console.error('Error generating reply:', error);
      toast({
        title: "Error",
        description: "Failed to generate reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // Handle sending a reply to YouTube
  const handleSendReply = async (commentId: string) => {
    const replyText = customReplies[commentId];
    if (!replyText) return;

    setReplySending({
      ...replySending,
      [commentId]: true
    });

    try {
      const success = await replyToYouTubeComment(commentId, replyText);
      
      if (success) {
        // Mark comment as answered
        await markYouTubeCommentAsRead(commentId);
        
        // Update local state
        setComments(comments.map(comment => 
          comment.id === commentId ? { ...comment, answered: true } : comment
        ));
        
        toast({
          title: "Reply Sent",
          description: "Your reply has been posted to YouTube",
        });
      } else {
        throw new Error("Failed to send reply");
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply to YouTube. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReplySending({
        ...replySending,
        [commentId]: false
      });
    }
  };

  // Handle marking a comment as read/answered
  const handleMarkAsRead = async (commentId: string) => {
    try {
      const success = await markYouTubeCommentAsRead(commentId);
      
      if (success) {
        // Update local state
        setComments(comments.map(comment => 
          comment.id === commentId ? { ...comment, answered: true } : comment
        ));
        
        toast({
          title: "Marked as Read",
          description: "Comment has been marked as read",
        });
      } else {
        throw new Error("Failed to mark as read");
      }
    } catch (error) {
      console.error('Error marking comment as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark comment as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle marking selected comments as read
  const handleMarkSelectedAsRead = async () => {
    try {
      const promises = selectedComments.map(commentId => markYouTubeCommentAsRead(commentId));
      await Promise.all(promises);
      
      // Update local state
      setComments(comments.map(comment => 
        selectedComments.includes(comment.id) ? { ...comment, answered: true } : comment
      ));
      
      toast({
        title: "Marked as Read",
        description: `${selectedComments.length} comments marked as read`,
      });
      
      // Clear selection
      setSelectedComments([]);
    } catch (error) {
      console.error('Error marking comments as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark comments as read. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num);
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Youtube className="h-8 w-8 text-red-600 mr-3" />
        <h1 className="text-2xl font-bold">YouTube Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>YouTube Comments</CardTitle>
                  <CardDescription>Manage and respond to comments from your YouTube channels</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedComments.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleMarkSelectedAsRead}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark {selectedComments.length} as Read
                    </Button>
                  )}
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Comments</SelectItem>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="unanswered">Unanswered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search comments..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="select-all"
                    checked={filteredComments.length > 0 && selectedComments.length === filteredComments.length}
                    onCheckedChange={handleSelectAllComments}
                  />
                  <Label htmlFor="select-all" className="text-sm">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {loadingComments ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-6 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </div>
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-5 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))
                  ) : filteredComments.length === 0 ? (
                    <div className="text-center p-6">
                      <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-1">No Comments Found</h3>
                      <p className="text-muted-foreground">
                        {searchQuery ? "Try adjusting your search or filters" : "You don't have any YouTube comments matching the current filter"}
                      </p>
                    </div>
                  ) : (
                    filteredComments.map(comment => (
                      <div 
                        key={comment.id}
                        className={`p-4 border rounded-lg hover:bg-slate-50 transition-colors ${
                          selectedComments.includes(comment.id) ? 'border-indigo-300 bg-indigo-50/50' : ''
                        }`}
                        onClick={() => handleSelectComment(comment.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedComments.includes(comment.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCommentSelection(comment.id);
                              }}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={comment.profilePicture} alt={comment.author} />
                              <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{comment.author}</span>
                            {comment.answered && (
                              <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Answered
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{formatDate(comment.date)}</span>
                        </div>
                        <p className="text-slate-600 mb-2">{comment.content}</p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Video: {comment.postTitle}</span>
                          <div className="flex items-center gap-4">
                            {comment.likes !== undefined && (
                              <span className="flex items-center">
                                👍 {formatNumber(comment.likes)}
                              </span>
                            )}
                            <a 
                              href={comment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Eye className="h-3 w-3" /> View on YouTube
                            </a>
                          </div>
                        </div>
                        
                        {selectedComment === comment.id && (!comment.answered || customReplies[comment.id]) && (
                          <div className="mt-4 space-y-3 border-t pt-4">
                            {customReplies[comment.id] && !editingReply ? (
                              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-indigo-700">Your Reply</span>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditReply(comment.id);
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyReply(customReplies[comment.id]);
                                      }}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteReply(comment.id);
                                      }}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600">{customReplies[comment.id]}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Write your reply here or generate one with AI..."
                                  value={customReplies[comment.id] || ''}
                                  onChange={(e) => handleUpdateReply(comment.id, e.target.value)}
                                  className="min-h-[80px]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                
                                <div className="flex justify-between">
                                  <div className="flex items-center gap-2">
                                    {editingReply === comment.id && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelEditReply();
                                        }}
                                      >
                                        <Check className="h-3 w-3" />
                                        Done Editing
                                      </Button>
                                    )}
                                    
                                    {!customReplies[comment.id] && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleGenerateReply(comment.id);
                                        }}
                                        disabled={isGeneratingReply}
                                      >
                                        {isGeneratingReply ? (
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Wand2 className="h-3 w-3" />
                                        )}
                                        Generate Reply
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    {!comment.answered && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkAsRead(comment.id);
                                        }}
                                      >
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Mark as Read
                                      </Button>
                                    )}
                                    
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="gap-1"
                                      disabled={replySending[comment.id] || !customReplies[comment.id]}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSendReply(comment.id);
                                      }}
                                    >
                                      {replySending[comment.id] ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Send className="h-3 w-3" />
                                      )}
                                      Reply on YouTube
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>YouTube Videos</CardTitle>
              <CardDescription>Manage and monitor your YouTube video performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  className="pl-8"
                />
              </div>
              <div className="space-y-4">
                {loadingVideos ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 border rounded-lg">
                      <Skeleton className="h-24 w-40 rounded-md" />
                      <div className="flex-grow">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-3" />
                        <div className="flex gap-3">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : videos.length === 0 ? (
                  <div className="text-center p-6">
                    <Video className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-1">No Videos Found</h3>
                    <p className="text-muted-foreground">You don't have any YouTube videos to display</p>
                  </div>
                ) : (
                  videos.map(video => (
                    <div key={video.id} className="flex gap-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="relative h-24 w-40 rounded-md overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                          {formatNumber(video.viewCount)} views
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
                        <p className="text-sm text-slate-500 mb-2 line-clamp-1">{video.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            👍 {formatNumber(video.likeCount)}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            💬 {formatNumber(video.commentCount)}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Published: {new Date(video.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          asChild
                        >
                          <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3" /> 
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 