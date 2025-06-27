"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Share
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { Conversation } from '@/types/chat';

interface ChatHeaderProps {
  conversation: Conversation;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  voiceMode: boolean;
  onVoiceModeToggle: () => void;
  isListening: boolean;
  onVoiceToggle: () => void;
  isSpeaking: boolean;
  browserSupportsSpeechRecognition: boolean;
  speechSynthesisSupported: boolean;
}

export function ChatHeader({
  conversation,
  sidebarCollapsed,
  onToggleSidebar,
  voiceMode,
  onVoiceModeToggle,
  isListening,
  onVoiceToggle,
  isSpeaking,
  browserSupportsSpeechRecognition,
  speechSynthesisSupported,
}: ChatHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  
  const { updateConversation, deleteConversation } = useChatStore();

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      await updateConversation(conversation.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditingTitle(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(conversation.id);
    }
  };

  const handleExportConversation = () => {
    const exportData = {
      title: conversation.title,
      // TODO: Add messages when available from proper context
      // messages: [], 
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareConversation = async () => {
    // TODO: Access messages from proper context when available
    const shareText = `${conversation.title}\n\nConversation details available for sharing.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversation.title,
          text: shareText,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        // You could show a toast notification here
        console.log('Conversation copied to clipboard');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyPress}
              className="text-lg font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary"
              autoFocus
            />
          ) : (
            <h1 
              className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {conversation.title}
            </h1>
          )}
          
          {conversation.model && (
            <Badge variant="secondary" className="text-xs">
              {conversation.model}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Voice Controls */}
        {browserSupportsSpeechRecognition && (
          <Button
            variant={isListening ? "default" : "ghost"}
            size="sm"
            onClick={onVoiceToggle}
            className={isListening ? "animate-pulse" : ""}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        {speechSynthesisSupported && (
          <Button
            variant={voiceMode ? "default" : "ghost"}
            size="sm"
            onClick={onVoiceModeToggle}
            className={isSpeaking ? "animate-pulse" : ""}
            title={voiceMode ? "Disable voice mode" : "Enable voice mode"}
          >
            {voiceMode ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Settings and Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Title
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportConversation}>
              <Download className="h-4 w-4 mr-2" />
              Export Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShareConversation}>
              <Share className="h-4 w-4 mr-2" />
              Share Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteConversation}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 