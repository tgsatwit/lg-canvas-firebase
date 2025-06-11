"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
      <div 
        className="flex h-screen items-center justify-center relative"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(6, 182, 212, 0.1) 0%,
              rgba(99, 102, 241, 0.05) 50%,
              rgba(34, 197, 94, 0.1) 100%
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
                radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)
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
          <LoadingContent loading={true} error={null}>
            <div className="text-gray-800 text-lg">Loading chat...</div>
          </LoadingContent>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div 
        className="flex h-screen items-center justify-center relative"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(6, 182, 212, 0.1) 0%,
              rgba(99, 102, 241, 0.05) 50%,
              rgba(34, 197, 94, 0.1) 100%
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
                radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)
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
    <div 
      className="h-[calc(100vh-4rem)] -m-6 pt-6 flex overflow-hidden relative"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(6, 182, 212, 0.1) 0%,
            rgba(99, 102, 241, 0.05) 50%,
            rgba(34, 197, 94, 0.1) 100%
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
              radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Sidebar - only show when not collapsed */}
      {!sidebarCollapsed && (
        <div className="relative z-10">
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId || newConversationId}
            onSelectConversation={setActiveConversation}
            onDeleteConversation={handleDeleteConversation}
            collapsed={false}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            userId={session.user.id}
          />
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 h-full">
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
