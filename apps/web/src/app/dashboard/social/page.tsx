'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SocialCommentStream } from '@/components/social/social-comment-stream';
import { SocialStats, SocialComment, PlatformType } from '@/lib/social';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Youtube, MessageSquarePlus, Send, Loader2 } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

const mockComments: SocialComment[] = [
  {
    id: '1',
    platform: 'facebook',
    author: 'Jane Smith',
    content: 'When will you release the new product?',
    date: '2023-05-15T14:30:00Z',
    postTitle: 'Product Announcement',
    postId: 'post123',
    answered: false,
  },
  {
    id: '2',
    platform: 'instagram',
    author: 'john_doe',
    content: 'Love your content! Keep it up!',
    date: '2023-05-14T10:15:00Z',
    postTitle: 'Feature Preview',
    postId: 'post456',
    answered: false,
  },
  {
    id: '3',
    platform: 'youtube',
    author: 'TechFan2023',
    content: 'Could you make a tutorial on how to use this feature?',
    date: '2023-05-13T18:45:00Z',
    postTitle: 'Product Demo',
    postId: 'post789',
    answered: false,
  },
  {
    id: '4',
    platform: 'facebook',
    author: 'Alex Johnson',
    content: 'I found a bug in your latest release. The download button doesn\'t work.',
    date: '2023-05-12T09:20:00Z',
    postTitle: 'Release Announcement',
    postId: 'post321',
    answered: true,
  },
];

export default function SocialMonitorPage() {
  const { toast } = useToast();
  const { copy } = useCopyToClipboard();
  
  // State for comments and filtering
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<PlatformType>('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // State for selection
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  
  // State for replies
  const [customReplies, setCustomReplies] = useState<Record<string, string>>({});
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [replySending, setReplySending] = useState<Record<string, boolean>>({});
  
  // Stats state
  const [stats, setStats] = useState<SocialStats>({
    facebook: 0,
    instagram: 0,
    youtube: 0,
    total: 0,
    unanswered: 0
  });
  
  // Load comments data
  useEffect(() => {
    // Simulate API call
    const loadData = () => {
      setTimeout(() => {
        setComments(mockComments);
        
        // Calculate stats
        const newStats = mockComments.reduce((acc, comment) => {
          acc[comment.platform as keyof Omit<SocialStats, 'total' | 'unanswered'>] += 1;
          acc.total += 1;
          if (!comment.answered) acc.unanswered += 1;
          return acc;
        }, {
          facebook: 0,
          instagram: 0,
          youtube: 0,
          total: 0,
          unanswered: 0
        });
        
        setStats(newStats);
        setIsLoading(false);
      }, 1500);
    };
    
    loadData();
  }, []);
  
  // Filter comments based on current filter
  const filteredComments = comments.filter(comment => {
    if (filter !== 'all' && comment.platform !== filter) return false;
    if (showOnlySelected && !selectedComments.includes(comment.id)) return false;
    return true;
  });
  
  // Handle comment selection
  const handleSelectComment = (commentId: string) => {
    setSelectedComment(commentId === selectedComment ? null : commentId);
  };
  
  const handleSelectCommentToggle = (commentId: string) => {
    setSelectedComments(prev => 
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    );
  };
  
  const handleSelectAllComments = () => {
    setSelectedComments(
      selectedComments.length === filteredComments.length
        ? []
        : filteredComments.map(comment => comment.id)
    );
  };
  
  // Handle reply editing
  const handleStartEditReply = (commentId: string) => {
    setEditingReply(commentId);
  };
  
  const handleCancelEditReply = () => {
    setEditingReply(null);
  };
  
  const handleUpdateReply = (commentId: string, text: string) => {
    setCustomReplies(prev => ({
      ...prev,
      [commentId]: text
    }));
  };
  
  const handleDeleteReply = (commentId: string) => {
    setCustomReplies(prev => {
      const newReplies = { ...prev };
      delete newReplies[commentId];
      return newReplies;
    });
    toast({
      description: "Reply draft deleted",
    });
  };
  
  const handleCopyReply = (text: string) => {
    copy(text);
    toast({
      description: "Reply copied to clipboard",
    });
  };
  
  // Handle reply generation and sending
  const handleGenerateReply = async (commentId: string) => {
    setIsGeneratingReplies(true);
    
    // Simulate API call to generate reply
    setTimeout(() => {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        const generatedReply = `Thank you for your comment about "${comment.postTitle}". We appreciate your feedback!`;
        setCustomReplies(prev => ({
          ...prev,
          [commentId]: generatedReply
        }));
      }
      setIsGeneratingReplies(false);
    }, 2000);
  };
  
  const handleSendReply = async (commentId: string, platform: string) => {
    const replyText = customReplies[commentId];
    if (!replyText) return;
    
    setReplySending(prev => ({
      ...prev,
      [commentId]: true
    }));
    
    // Simulate API call to send reply
    setTimeout(() => {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, answered: true } : c
      ));
      
      setCustomReplies(prev => {
        const newReplies = { ...prev };
        delete newReplies[commentId];
        return newReplies;
      });
      
      setReplySending(prev => {
        const newSending = { ...prev };
        delete newSending[commentId];
        return newSending;
      });
      
      setSelectedComments(prev => prev.filter(id => id !== commentId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unanswered: prev.unanswered - 1
      }));
      
      toast({
        title: "Reply sent",
        description: `Your reply was sent on ${platform}`,
      });
    }, 1500);
  };
  
  // Handle generating replies for all selected comments
  const handleGenerateAllReplies = async () => {
    if (selectedComments.length === 0) return;
    
    setIsGeneratingReplies(true);
    
    // Simulate API call to generate multiple replies
    setTimeout(() => {
      const newReplies = { ...customReplies };
      
      selectedComments.forEach(commentId => {
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          newReplies[commentId] = `Thank you for your comment about "${comment.postTitle}". We appreciate your feedback!`;
        }
      });
      
      setCustomReplies(newReplies);
      setIsGeneratingReplies(false);
      
      toast({
        title: "Replies generated",
        description: `Generated ${selectedComments.length} replies`,
      });
    }, 3000);
  };
  
  // Handle sending all selected replies
  const handleSendAllReplies = async () => {
    const commentsToSend = selectedComments.filter(id => customReplies[id]);
    if (commentsToSend.length === 0) return;
    
    const newSending = { ...replySending };
    commentsToSend.forEach(id => {
      newSending[id] = true;
    });
    setReplySending(newSending);
    
    // Simulate API call to send multiple replies
    setTimeout(() => {
      setComments(prev => prev.map(c => 
        commentsToSend.includes(c.id) ? { ...c, answered: true } : c
      ));
      
      const newReplies = { ...customReplies };
      commentsToSend.forEach(id => {
        delete newReplies[id];
      });
      setCustomReplies(newReplies);
      
      const newSending = { ...replySending };
      commentsToSend.forEach(id => {
        delete newSending[id];
      });
      setReplySending(newSending);
      
      setSelectedComments(prev => prev.filter(id => !commentsToSend.includes(id)));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        unanswered: prev.unanswered - commentsToSend.length
      }));
      
      toast({
        title: "Replies sent",
        description: `Sent ${commentsToSend.length} replies`,
      });
    }, 2000);
  };
  
  const renderPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };
  
  return (
    <div 
      className="relative min-h-screen"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(219, 39, 119, 0.1) 0%,
            rgba(251, 146, 60, 0.05) 50%,
            rgba(59, 130, 246, 0.1) 100%
          )
        `,
      }}
    >
      {/* Ambient background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, rgba(219, 39, 119, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(251, 146, 60, 0.15) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto p-6">
        <div className="flex flex-col gap-6">
          {selectedComments.length > 0 && (
            <div 
              className="flex justify-end gap-3 p-4 rounded-2xl border"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.2) 0%,
                    rgba(255, 255, 255, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(15px) saturate(130%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 8px 24px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `,
              }}
            >
              <Button 
                variant="outline" 
                className="gap-2 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={handleGenerateAllReplies}
                disabled={isGeneratingReplies}
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.3) 0%,
                      rgba(255, 255, 255, 0.15) 100%
                    )
                  `,
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                {isGeneratingReplies ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquarePlus className="h-4 w-4" />
                )}
                Generate {selectedComments.length} Replies
              </Button>
              
              <Button 
                className="gap-2 rounded-xl transition-all duration-300 hover:scale-[1.02] bg-black hover:bg-gray-800"
                onClick={handleSendAllReplies}
                disabled={Object.keys(replySending).length > 0 || selectedComments.filter(id => customReplies[id]).length === 0}
              >
                <Send className="h-4 w-4" />
                Send {selectedComments.filter(id => customReplies[id]).length} Replies
              </Button>
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div 
              className="p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.25) 0%,
                    rgba(255, 255, 255, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `,
              }}
            >
              <div className="pb-3">
                <h3 className="text-base font-medium text-gray-800">Total Comments</h3>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.unanswered} unanswered
                </p>
              </div>
            </div>
            
            <div 
              className="p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(59, 130, 246, 0.15) 0%,
                    rgba(59, 130, 246, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(59, 130, 246, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `,
              }}
            >
              <div className="pb-3 flex flex-row items-center justify-between space-y-0">
                <h3 className="text-base font-medium text-blue-800">Facebook</h3>
                <Facebook className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-900">{stats.facebook}</div>
              </div>
            </div>
            
            <div 
              className="p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(236, 72, 153, 0.15) 0%,
                    rgba(236, 72, 153, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(236, 72, 153, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `,
              }}
            >
              <div className="pb-3 flex flex-row items-center justify-between space-y-0">
                <h3 className="text-base font-medium text-pink-800">Instagram</h3>
                <Instagram className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-900">{stats.instagram}</div>
              </div>
            </div>
            
            <div 
              className="p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(239, 68, 68, 0.15) 0%,
                    rgba(239, 68, 68, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(150%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: `
                  0 8px 32px rgba(239, 68, 68, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.4)
                `,
              }}
            >
              <div className="pb-3 flex flex-row items-center justify-between space-y-0">
                <h3 className="text-base font-medium text-red-800">YouTube</h3>
                <Youtube className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-3xl font-bold text-red-900">{stats.youtube}</div>
              </div>
            </div>
          </div>
          
          {/* Comment Stream */}
          <div 
            className="h-[600px] rounded-2xl border overflow-hidden"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <SocialCommentStream
              comments={filteredComments}
              isLoading={isLoading}
              selectedComments={selectedComments}
              selectedComment={selectedComment}
              onSelectComment={handleSelectComment}
              onSelectCommentToggle={handleSelectCommentToggle}
              onSelectAllComments={handleSelectAllComments}
              onFilterChange={(platform) => setFilter(platform as PlatformType)}
              currentFilter={filter}
              onShowOnlySelected={() => setShowOnlySelected(!showOnlySelected)}
              showOnlySelected={showOnlySelected}
              customReplies={customReplies}
              editingReply={editingReply}
              onStartEditReply={handleStartEditReply}
              onCancelEditReply={handleCancelEditReply}
              onUpdateReply={handleUpdateReply}
              onDeleteReply={handleDeleteReply}
              onCopyReply={handleCopyReply}
              onGenerateReply={handleGenerateReply}
              onSendReply={handleSendReply}
              isGeneratingReplies={isGeneratingReplies}
              replySending={replySending}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 