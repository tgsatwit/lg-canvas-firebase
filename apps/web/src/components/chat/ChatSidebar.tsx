"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ChevronRight,
  Search
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
      <div className="w-16 bg-white dark:bg-gray-900 flex flex-col h-full border-r border-gray-200 dark:border-gray-700" style={{ boxShadow: '8px 0 30px rgba(0, 0, 0, 0.4), 4px 0 15px rgba(0, 0, 0, 0.3), 2px 0 8px rgba(0, 0, 0, 0.2)' }}>
        <div className="flex flex-col items-center py-4 space-y-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewConversation}
            disabled={isCreating}
            className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg"
            title="New chat"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 pb-4">
            {conversationList.slice(0, 8).map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                size="icon"
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "w-full rounded-lg transition-colors",
                  activeConversationId === conversation.id 
                    ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                title={conversation.title}
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
    <div className="w-80 bg-white dark:bg-gray-900 flex flex-col h-full border-r border-gray-200 dark:border-gray-700" style={{ boxShadow: '8px 0 30px rgba(0, 0, 0, 0.4), 4px 0 15px rgba(0, 0, 0, 0.3), 2px 0 8px rgba(0, 0, 0, 0.2)' }}>
      {/* Modern header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              PBL Chat
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white border-0 rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversationList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">No conversations yet</p>
              <p className="text-xs">Start a new chat to get started</p>
            </div>
          ) : (
            <>
              {/* Today section */}
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                  Today
                </h3>
                <div className="space-y-1">
                  {conversationList
                    .filter(conv => isToday(conv.updatedAt))
                    .map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isActive={activeConversationId === conversation.id}
                        onSelect={() => onSelectConversation(conversation.id)}
                        onDelete={() => handleDeleteConversation(conversation.id)}
                      />
                    ))}
                </div>
              </div>

              {/* Previous 7 days section */}
              {conversationList.some(conv => isThisWeek(conv.updatedAt) && !isToday(conv.updatedAt)) && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                    Previous 7 days
                  </h3>
                  <div className="space-y-1">
                    {conversationList
                      .filter(conv => isThisWeek(conv.updatedAt) && !isToday(conv.updatedAt))
                      .map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isActive={activeConversationId === conversation.id}
                          onSelect={() => onSelectConversation(conversation.id)}
                          onDelete={() => handleDeleteConversation(conversation.id)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Older section */}
              {conversationList.some(conv => !isThisWeek(conv.updatedAt)) && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
                    Older
                  </h3>
                  <div className="space-y-1">
                    {conversationList
                      .filter(conv => !isThisWeek(conv.updatedAt))
                      .map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          isActive={activeConversationId === conversation.id}
                          onSelect={() => onSelectConversation(conversation.id)}
                          onDelete={() => handleDeleteConversation(conversation.id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

// Helper functions for date filtering
function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp);
  return date.toDateString() === today.toDateString();
}

function isThisWeek(timestamp: number): boolean {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const date = new Date(timestamp);
  return date >= oneWeekAgo;
}
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
  return (
    <div
      className={cn(
        "group relative rounded-lg cursor-pointer transition-colors px-3 py-2",
        isActive 
          ? "bg-pink-50 dark:bg-pink-900/20" 
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className={cn(
              "h-3 w-3 flex-shrink-0",
              isActive ? "text-pink-500" : "text-gray-400 dark:text-gray-500"
            )} />
            <h3 className={cn(
              "font-medium text-sm truncate",
              isActive ? "text-pink-600 dark:text-pink-400" : "text-gray-700 dark:text-gray-300"
            )}>
              {conversation.title}
            </h3>
          </div>
          
          {conversation.lastMessagePreview && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate ml-5">
              {conversation.lastMessagePreview}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem 
              className="text-gray-700 dark:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                // Add edit functionality here
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-600 dark:text-red-400"
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