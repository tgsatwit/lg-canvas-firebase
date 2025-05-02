"use client";

import { useState } from "react";
import { DashboardShell } from '@/components/dashboard/shell';
import { SocialTable } from '@/components/ui/social/social-table';
import { 
  SocialModal, 
  Dialog, 
  DialogTrigger, 
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
      <div className="relative min-h-screen">
        <div className="relative px-4 py-6 md:px-6 md:py-8">
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