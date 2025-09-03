"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  X
} from 'lucide-react';
import { Conversation } from '@/types/chat';
import { useChatStore } from '@/stores/chatStore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { createConversation, updateConversation, deleteConversation: deleteConversationFromStore } = useChatStore();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { toast } = useToast();

  const conversationList = Object.values(conversations)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(conv => 
      !searchQuery || 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const conversationId = await createConversation(userId, {
        title: 'New Chat',
      });
      onSelectConversation(conversationId);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        variant: "destructive",
        title: "Failed to create conversation",
        description: "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      if (onDeleteConversation) {
        await onDeleteConversation(conversationId);
      } else {
        await deleteConversationFromStore(conversationId);
      }
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete conversation",
        description: "Please try again.",
      });
    }
  };

  const handleRenameStart = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleRenameSubmit = async (conversationId: string) => {
    if (!editingTitle.trim()) return;
    
    try {
      await updateConversation(conversationId, { title: editingTitle.trim() });
      setEditingId(null);
      setEditingTitle('');
      toast({
        title: "Conversation renamed",
        description: "The conversation title has been updated.",
      });
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      toast({
        variant: "destructive",
        title: "Failed to rename conversation",
        description: "Please try again.",
      });
    }
  };

  const groupConversationsByDate = (conversations: Conversation[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      thisWeek: [] as Conversation[],
      thisMonth: [] as Conversation[],
      older: [] as Conversation[]
    };

    conversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt);
      
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= thisWeek) {
        groups.thisWeek.push(conv);
      } else if (convDate >= thisMonth) {
        groups.thisMonth.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  };

  const conversationGroups = groupConversationsByDate(conversationList);

  if (collapsed) {
    return (
      <div className="w-16 bg-gray-50 flex flex-col h-full border-r border-gray-200">
        <div className="flex flex-col items-center py-4 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            disabled={isCreating}
            className="h-10 w-10 p-0 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-200 hover:border-gray-300"
            title="New chat"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 px-2 pb-4">
            {conversationList.slice(0, 10).map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                size="sm"
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "h-10 w-10 p-0 rounded-lg transition-colors",
                  activeConversationId === conversation.id 
                    ? "bg-gray-200 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
    <div className="w-80 bg-gray-50 flex flex-col h-full border-l border-gray-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg flex-shrink-0"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl font-medium transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {isCreating ? 'Creating...' : 'New Chat'}
        </Button>
      </div>

      {/* Search */}
      {conversationList.length > 5 && (
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-gray-300 focus:ring-0 rounded-lg"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1 overflow-x-hidden">
        <div className="px-2 pb-4">
          {conversationList.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500 mb-1">No conversations yet</p>
              <p className="text-xs text-gray-400">Start a new chat to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Today */}
              {conversationGroups.today.length > 0 && (
                <ConversationGroup
                  title="Today"
                  conversations={conversationGroups.today}
                  activeConversationId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelectConversation={onSelectConversation}
                  onRenameStart={handleRenameStart}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                  onDeleteConversation={handleDeleteConversation}
                />
              )}

              {/* Yesterday */}
              {conversationGroups.yesterday.length > 0 && (
                <ConversationGroup
                  title="Yesterday"
                  conversations={conversationGroups.yesterday}
                  activeConversationId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelectConversation={onSelectConversation}
                  onRenameStart={handleRenameStart}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                  onDeleteConversation={handleDeleteConversation}
                />
              )}

              {/* Previous 7 days */}
              {conversationGroups.thisWeek.length > 0 && (
                <ConversationGroup
                  title="Previous 7 days"
                  conversations={conversationGroups.thisWeek}
                  activeConversationId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelectConversation={onSelectConversation}
                  onRenameStart={handleRenameStart}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                  onDeleteConversation={handleDeleteConversation}
                />
              )}

              {/* Previous 30 days */}
              {conversationGroups.thisMonth.length > 0 && (
                <ConversationGroup
                  title="Previous 30 days"
                  conversations={conversationGroups.thisMonth}
                  activeConversationId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelectConversation={onSelectConversation}
                  onRenameStart={handleRenameStart}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                  onDeleteConversation={handleDeleteConversation}
                />
              )}

              {/* Older */}
              {conversationGroups.older.length > 0 && (
                <ConversationGroup
                  title="Older"
                  conversations={conversationGroups.older}
                  activeConversationId={activeConversationId}
                  editingId={editingId}
                  editingTitle={editingTitle}
                  setEditingTitle={setEditingTitle}
                  onSelectConversation={onSelectConversation}
                  onRenameStart={handleRenameStart}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={handleRenameCancel}
                  onDeleteConversation={handleDeleteConversation}
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ConversationGroupProps {
  title: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSelectConversation: (id: string) => void;
  onRenameStart: (conversation: Conversation) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
  onDeleteConversation: (id: string) => void;
}

function ConversationGroup({
  title,
  conversations,
  activeConversationId,
  editingId,
  editingTitle,
  setEditingTitle,
  onSelectConversation,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
  onDeleteConversation,
}: ConversationGroupProps) {
  return (
    <div className="w-full">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2 truncate">
        {title}
      </h3>
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={activeConversationId === conversation.id}
            isEditing={editingId === conversation.id}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
            onSelect={() => onSelectConversation(conversation.id)}
            onRenameStart={() => onRenameStart(conversation)}
            onRenameSubmit={() => onRenameSubmit(conversation.id)}
            onRenameCancel={onRenameCancel}
            onDelete={() => onDeleteConversation(conversation.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSelect: () => void;
  onRenameStart: () => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDelete: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  isEditing,
  editingTitle,
  setEditingTitle,
  onSelect,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
  onDelete,
}: ConversationItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onRenameCancel();
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg transition-colors mx-2 overflow-hidden",
        isActive ? "bg-gray-200" : "hover:bg-gray-100"
      )}
    >
      {isEditing ? (
        <div className="px-3 py-2">
          <Input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onRenameSubmit}
            className="h-7 text-sm border-0 bg-transparent focus:ring-1 focus:ring-gray-300 px-0 w-full"
            autoFocus
          />
        </div>
      ) : (
        <div
          className="cursor-pointer px-3 py-2 flex items-start gap-2"
          onClick={onSelect}
        >
          <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500 mt-0.5" />
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-medium text-sm text-gray-900 break-words line-clamp-2">
              {conversation.title}
            </h3>
            
            {conversation.lastMessagePreview && (
              <p className="text-xs text-gray-500 break-words line-clamp-1 mt-1">
                {conversation.lastMessagePreview}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                className="text-gray-700 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameStart();
                }}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
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
      )}
    </div>
  );
}