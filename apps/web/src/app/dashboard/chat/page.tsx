"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { ChatInterface, ChatSidebar } from '@/components/chat';
import { LoadingContent } from '@/components/ui/loading-content';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/stores/chatStore';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed and hidden
  const [isLoading, setIsLoading] = useState(true);
  const [newConversationId, setNewConversationId] = useState<string | null>(null);
  
  const {
    conversations,
    activeConversationId,
    loadConversations,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useChatStore();

  // Auto-create a new conversation when the page loads
  useEffect(() => {
    if (session?.user?.id && !activeConversationId && !newConversationId) {
      const initializeChat = async () => {
        try {
          // Load existing conversations first
          await loadConversations(session.user.id);
          
          // Create a new conversation to start with
          const conversationId = await createConversation(session.user.id, {
            title: 'New Chat',
          });
          setNewConversationId(conversationId);
          await setActiveConversation(conversationId);
        } catch (error) {
          console.error('Failed to initialize chat:', error);
        } finally {
          setIsLoading(false);
        }
      };

      initializeChat();
    } else if (session?.user?.id) {
      loadConversations(session.user.id).finally(() => setIsLoading(false));
    }
  }, [session?.user?.id, activeConversationId, newConversationId, loadConversations, createConversation, setActiveConversation]);

  // Handle conversation deletion with proper navigation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!session?.user?.id) return;

    try {
      await deleteConversation(conversationId);
      
      // Show success toast
      toast({
        title: "Conversation deleted",
        description: "The conversation has been successfully deleted.",
      });

      // If we deleted the active conversation, create a new one
      if (conversationId === activeConversationId || conversationId === newConversationId) {
        try {
          const newId = await createConversation(session.user.id, {
            title: 'New Chat',
          });
          setNewConversationId(newId);
          await setActiveConversation(newId);
        } catch (error) {
          console.error('Failed to create new conversation:', error);
          // If we can't create a new conversation, at least clear the active one
          setActiveConversation('');
          setNewConversationId(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete conversation",
        description: "Please try again later.",
      });
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <LoadingContent loading={true} error={null}>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-3 border-muted"></div>
              <div className="absolute inset-0 rounded-full border-3 border-primary border-t-transparent animate-spin"></div>
            </div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </LoadingContent>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <Card className="apple-card max-w-sm text-center">
          <p className="text-muted-foreground">Please sign in to access the chat.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex bg-background overflow-hidden">
      {/* Sidebar - only show when not collapsed */}
      {!sidebarCollapsed && (
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId || newConversationId}
          onSelectConversation={setActiveConversation}
          onDeleteConversation={handleDeleteConversation}
          collapsed={false}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userId={session.user.id}
        />
      )}
      
      {/* Main Chat Area */}
      <div className="flex-1 h-full">
        <ChatInterface
          userId={session.user.id}
          conversationId={activeConversationId || newConversationId}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
    </div>
  );
}
