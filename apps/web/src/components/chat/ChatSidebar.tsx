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
      <div className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4 hover:bg-gray-100 rounded-xl"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewConversation}
          disabled={isCreating}
          className="mb-4 hover:bg-gray-100 rounded-xl"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>

        <ScrollArea className="flex-1 w-full">
          <div className="space-y-2 px-2">
            {conversationList.slice(0, 10).map((conversation) => (
              <Button
                key={conversation.id}
                variant={activeConversationId === conversation.id ? "default" : "ghost"}
                size="icon"
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full rounded-xl",
                  activeConversationId === conversation.id 
                    ? "bg-gray-900 text-white hover:bg-gray-800" 
                    : "hover:bg-gray-100"
                )}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hover:bg-gray-100 rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {conversationList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs opacity-75">Start a new chat to get started</p>
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
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const messageCount = conversation.messages.length;

  return (
    <div
      className={cn(
        "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-gray-100 border border-gray-200" 
          : "hover:bg-gray-50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate mb-1 text-gray-900">
            {conversation.title}
          </h3>
          
          {lastMessage && (
            <p className="text-xs text-gray-500 truncate">
              {lastMessage.role === 'user' ? 'You: ' : 'AI: '}
              {lastMessage.content}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {new Date(conversation.updatedAt).toLocaleDateString()}
            </span>
            
            {messageCount > 0 && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
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
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-gray-200 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-gray-200">
            <DropdownMenuItem 
              className="text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                // Add edit functionality here
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 hover:bg-red-50 rounded-lg"
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