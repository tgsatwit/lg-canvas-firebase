"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  PlusIcon, 
  MessageSquare, 
  MoreHorizontal, 
  Trash2, 
  Edit3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Conversation } from '@/types/chat';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userId: string;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  collapsed,
  onToggleCollapse,
  userId,
}: ChatSidebarProps) {
  const { createConversation, deleteConversation: deleteConversationFromStore } = useChatStore();
  const [isCreating, setIsCreating] = useState(false);

  const conversationList = Object.values(conversations).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const conversationId = await createConversation(userId, {
        title: 'New Conversation',
      });
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (onDeleteConversation) {
      // Use the prop function if provided (allows parent to handle navigation)
      await onDeleteConversation(conversationId);
    } else {
      // Fall back to store method if no prop function provided
      try {
        await deleteConversationFromStore(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
  };

  if (collapsed) {
    return (
      <div className="w-16 border-r border-gray-200/60 relative overflow-hidden">
        {/* Enhanced background with light liquid glass effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white"/>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-25/30 to-purple-50/60"/>
          <div className="absolute inset-0 backdrop-blur-xl"/>
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-100/60 rounded-full blur-xl"/>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-rose-100/60 rounded-full blur-lg"/>
        </div>
        
        <div className="flex flex-col items-center py-4 relative z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="mb-4 text-gray-700 hover:bg-white/60 hover:text-gray-900 rounded-xl transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            disabled={isCreating}
            className="mb-4 text-gray-700 hover:bg-white/60 hover:text-gray-900 rounded-xl transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>

          <ScrollArea className="flex-1 w-full">
            <div className="space-y-2 px-2">
              {conversationList.slice(0, 10).map((conversation) => (
                <Button
                  key={conversation.id}
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full rounded-xl transition-all duration-200",
                    activeConversationId === conversation.id 
                      ? "bg-gradient-to-r from-pink-50/80 to-rose-50/60 text-pink-700 hover:bg-pink-100/80" 
                      : "text-gray-700 hover:bg-white/60 hover:text-gray-900"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200/60 relative overflow-hidden">
      {/* Enhanced background with light liquid glass effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white"/>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-25/30 to-purple-50/60"/>
        <div className="absolute inset-0 backdrop-blur-xl"/>
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/60 rounded-full blur-2xl"/>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-100/60 rounded-full blur-xl"/>
      </div>
      
      <div className="flex flex-col h-full relative z-10">
        {/* Enhanced header with glass effect */}
        <div className="relative border-b border-gray-200/60">
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl"/>
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent"/>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Conversations
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="text-gray-700 hover:bg-white/60 hover:text-gray-900 rounded-xl transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-50/60 to-rose-50/40 rounded-xl backdrop-blur-sm border border-pink-200/40 shadow-sm"/>
              <Button
                onClick={handleNewConversation}
                disabled={isCreating}
                className="w-full relative bg-transparent hover:bg-white/40 text-gray-800 border-0 rounded-xl font-medium transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversationList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-50/60 to-slate-50/40 rounded-xl backdrop-blur-sm border border-gray-200/40 shadow-sm blur-sm"/>
                  <div className="relative bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-xl p-6 backdrop-blur-sm border border-gray-200/60">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs opacity-75">Start a new chat to get started</p>
                  </div>
                </div>
              </div>
            ) : (
              conversationList.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeConversationId === conversation.id}
                  onSelect={() => onSelectConversation(conversation.id)}
                  onDelete={() => handleDeleteConversation(conversation.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  // Use available properties from Conversation type
  const messageCount = conversation.messageCount || 0;

  return (
    <div
      className={cn(
        "group relative rounded-xl cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-gradient-to-r from-pink-50/80 to-rose-50/60 backdrop-blur-sm border border-pink-200/40 shadow-sm" 
          : "hover:bg-white/60"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between p-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium text-sm truncate mb-1",
            isActive ? "text-pink-800" : "text-gray-900"
          )}>
            {conversation.title}
          </h3>
          
          {conversation.lastMessagePreview && (
            <p className={cn(
              "text-xs truncate",
              isActive ? "text-pink-600" : "text-gray-500"
            )}>
              {conversation.lastMessagePreview}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className={cn(
              "text-xs",
              isActive ? "text-pink-500" : "text-gray-400"
            )}>
              {new Date(conversation.updatedAt).toLocaleDateString()}
            </span>
            
            {messageCount > 0 && (
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                isActive 
                  ? "bg-pink-100/80 text-pink-700" 
                  : "bg-gray-200 text-gray-600"
              )}>
                {messageCount}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-white/60 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-gray-200 bg-white/95 backdrop-blur-xl">
            <DropdownMenuItem 
              className="text-gray-700 hover:bg-gray-50/80 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                // Add edit functionality here
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 hover:bg-red-50/80 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 