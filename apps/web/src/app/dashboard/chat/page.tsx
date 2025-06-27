"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatInterface, ChatSidebar } from '@/components/chat';
import { LoadingContent } from '@/components/ui/loading-content';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/stores/chatStore';

export default function ChatPage() {
  const { user, loading } = useAuth();
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
    if (user?.uid && !activeConversationId && !newConversationId) {
      const initializeChat = async () => {
        try {
          // Load existing conversations first
          await loadConversations(user.uid);
          
          // Create a new conversation to start with
          const conversationId = await createConversation(user.uid, {
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
    } else if (user?.uid) {
      loadConversations(user.uid).finally(() => setIsLoading(false));
    }
  }, [user?.uid, activeConversationId, newConversationId, loadConversations, createConversation, setActiveConversation]);

  // Handle conversation deletion with proper navigation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user?.uid) return;

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
          const newId = await createConversation(user.uid, {
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

  if (loading || isLoading) {
    return (
      <div 
        className="flex h-screen items-center justify-center relative"
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
                radial-gradient(circle at 30% 40%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
              `,
            }}
          />
        </div>

        <div 
          className="relative z-10 p-8 rounded-2xl border"
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
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-pink-500 rounded-full animate-pulse"></div>
            <div className="text-gray-800 text-lg">Loading chat...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="flex h-screen items-center justify-center relative"
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
                radial-gradient(circle at 30% 40%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
              `,
            }}
          />
        </div>

        <div 
          className="relative z-10 p-8 rounded-2xl border"
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
          <p className="text-gray-800 text-lg">Please sign in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden bg-white dark:bg-gray-900">
      {/* Chat Sidebar */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-80'} flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
        <div className={`h-full ${sidebarCollapsed ? 'hidden' : 'block'}`}>
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId || newConversationId || ''}
            onSelectConversation={setActiveConversation}
            onDeleteConversation={handleDeleteConversation}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            userId={user.uid}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <ChatInterface
          conversationId={activeConversationId || newConversationId || ''}
          userId={user.uid}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
    </div>
  );
}
