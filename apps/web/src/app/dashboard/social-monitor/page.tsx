"use client";

import { useState } from "react";
import { DashboardShell } from '@/components/dashboard/shell';
import { SocialTable } from '@/components/ui/social/social-table';
import { 
  SocialModal, 
  Dialog, 
  DialogContent 
} from '@/components/ui/social/social-modal';
import { useToast } from "@/hooks/use-toast";
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Define the comment type to match SocialTable and SocialModal
type Comment = {
  id: number;
  platform: string;
  author: string;
  content: string;
  postTitle: string;
  date: string;
  answered: boolean;
};

// AI-generated responses that could be fetched from an API
const SUGGESTED_REPLIES: Record<string, string> = {
  "1": "Thank you for your interest! We'll be releasing the blue version next month. Would you like to be notified when it becomes available?",
  "3": "Thanks for the feedback! We're planning an advanced features tutorial for next week. Is there anything specific you'd like us to cover?",
  "4": "Thanks for asking! We just restocked size S on our website. If you're having trouble finding it, try refreshing the page or feel free to DM us for direct assistance!",
  "5": "Great question! Our product is fully compatible with both Android and iPhone devices. Let me know if you have any other compatibility questions!"
};

export default function SocialMonitorPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  
  // Function to handle refreshing comments
  const handleRefresh = async () => {
    toast({
      title: "Refreshing comments",
      description: "Fetching latest comments from all platforms...",
    });
    
    // In a real implementation, this would fetch the latest comments from all connected platforms
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Comments refreshed",
      description: "Latest comments have been loaded",
    });
  };
  
  // Function to handle selecting a comment
  const handleSelectComment = (comment: Comment) => {
    setSelectedComment(comment);
    setIsModalOpen(true);
  };
  
  // Function to generate a reply using AI
  const handleGenerateReply = async (commentId: number): Promise<string> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a suggested reply if available, or a generic one if not
    return SUGGESTED_REPLIES[commentId.toString()] || 
      "Thank you for your comment! We appreciate your feedback and will get back to you shortly.";
  };
  
  // Function to send a reply
  const handleSendReply = async (commentId: number, reply: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Reply sent",
      description: "Your reply has been posted successfully",
    });
    
    // Close the modal after successful reply
    setIsModalOpen(false);
  };

  return (
    <DashboardShell>
      <div 
        className="relative min-h-screen"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(148, 163, 184, 0.08) 0%,
              rgba(203, 213, 225, 0.04) 50%,
              rgba(148, 163, 184, 0.08) 100%
            )
          `,
        }}
      >
        {/* Ambient background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 40% 20%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 60% 80%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
              `,
            }}
          />
        </div>

        {/* Header */}
        <div 
          className="relative z-10 mx-6 mt-6 p-6 rounded-2xl border"
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Social Monitor</h1>
            <p className="text-gray-600 mt-1">Monitor and respond to comments across all your social platforms.</p>
          </div>
        </div>

        {/* Content */}
        <div 
          className="relative z-10 px-6 py-8 md:px-8 md:py-10 mt-6 mx-6 rounded-2xl border"
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
          <SocialTable 
            onRefresh={handleRefresh}
            onSelectComment={handleSelectComment}
          />
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogPrimitive.Title 
                className="absolute w-1 h-1 overflow-hidden m-[-1px] p-0 border-0 clip"
              >
                {selectedComment ? `Comment from ${selectedComment.author}` : 'Social Media Comment'}
              </DialogPrimitive.Title>
              <SocialModal
                comment={selectedComment}
                onGenerateReply={handleGenerateReply}
                onSendReply={handleSendReply}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardShell>
  );
} 