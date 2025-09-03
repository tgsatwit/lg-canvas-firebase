"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatInterface, ChatSidebar } from '@/components/chat';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/stores/chatStore';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed and hidden
  const [isLoading, setIsLoading] = useState(false);
  const [newConversationId, setNewConversationId] = useState<string | null>(null);
  
  const {
    conversations,
    activeConversationId,
    loadConversations,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useChatStore();

  // Load conversations when user is available
  useEffect(() => {
    if (user?.uid) {
      const initializeChat = async () => {
        try {
          // Load existing conversations first
          await loadConversations(user.uid);
        } catch (error) {
          console.error('Failed to initialize chat:', error);
        } finally {
          // No loading state needed
        }
      };

      initializeChat();
    }
  }, [user?.uid, loadConversations]);

  // Create a new conversation if none exist after loading
  useEffect(() => {
    if (user?.uid && !isLoading && Object.keys(conversations).length === 0 && !newConversationId) {
      const createInitialConversation = async () => {
        try {
          const conversationId = await createConversation(user.uid, {
            title: 'New Chat',
          });
          setNewConversationId(conversationId);
          await setActiveConversation(conversationId);
        } catch (error) {
          console.error('Failed to create initial conversation:', error);
        }
      };

      createInitialConversation();
    }
  }, [user?.uid, isLoading, conversations, newConversationId, createConversation, setActiveConversation]);

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

  // Show the chat immediately, no loading screen needed

  if (!user) {
    return (
      <div 
        className="flex h-screen items-center justify-center relative"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(236, 72, 153, 0.08) 0%,
              rgba(139, 92, 246, 0.04) 50%,
              rgba(236, 72, 153, 0.08) 100%
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
                radial-gradient(circle at 30% 40%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(236, 72, 153, 0.08) 0%, transparent 40%)
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
    <div className="h-full flex overflow-hidden bg-white relative">
      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 relative">
        <ChatInterface
          conversationId={activeConversationId || newConversationId || ''}
          userId={user.uid}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewChat={async () => {
            if (!user?.uid) return;
            try {
              const conversationId = await createConversation(user.uid, {
                title: 'New Chat',
              });
              setNewConversationId(conversationId);
              await setActiveConversation(conversationId);
            } catch (error) {
              console.error('Failed to create new conversation:', error);
            }
          }}
        />
      </div>

      {/* Chat Sidebar - Right Side Overlay */}
      <div className={`absolute top-0 right-0 h-full transition-transform duration-300 ease-in-out z-50 ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}`}>
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId || newConversationId || ''}
          onSelectConversation={setActiveConversation}
          onDeleteConversation={handleDeleteConversation}
          collapsed={false}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userId={user.uid}
        />
      </div>

      {/* Backdrop when sidebar is open */}
      {!sidebarCollapsed && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}
