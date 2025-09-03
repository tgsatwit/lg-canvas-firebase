"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Send, Mic, MicOff, Loader2, Search, Paperclip, Video, Mail, Database, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isListening?: boolean;
  onVoiceToggle?: () => void;
  browserSupportsSpeechRecognition?: boolean;
  transcript?: string;
  placeholder?: string;
  showWebSearch?: boolean;
  onRagSearch?: (query: string, type: 'video' | 'email') => Promise<any[]>;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  isListening = false,
  onVoiceToggle,
  browserSupportsSpeechRecognition = false,
  transcript = '',
  placeholder = "Message PBL Chat...",
  showWebSearch = false,
  onRagSearch,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [ragEnabled, setRagEnabled] = useState(false);
  const [ragType, setRagType] = useState<'video' | 'email'>('video');
  const [ragResults, setRagResults] = useState<any[]>([]);
  const [showRagResults, setShowRagResults] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      let enhancedMessage = message.trim();
      
      // If RAG is enabled, search for relevant content
      if (ragEnabled && onRagSearch) {
        try {
          const results = await onRagSearch(message.trim(), ragType);
          if (results.length > 0) {
            const ragContext = results.map((result, index) => 
              `[${ragType.toUpperCase()} ${index + 1}] ${result.title}: ${result.description || result.transcript?.substring(0, 200) || result.content?.substring(0, 200) || ''}`
            ).join('\n\n');
            
            enhancedMessage = `${message.trim()}\n\n[CONTEXT FROM ${ragType.toUpperCase()} LIBRARY]\n${ragContext}`;
          }
        } catch (error) {
          console.error('RAG search failed:', error);
          // Continue with original message if RAG fails
        }
      }
      
      onSendMessage(enhancedMessage);
      setMessage('');
      setShowRagResults(false);
      setRagResults([]);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    
    // Auto-search for RAG results when typing
    if (ragEnabled && onRagSearch && newMessage.length > 3) {
      try {
        const results = await onRagSearch(newMessage, ragType);
        setRagResults(results);
        setShowRagResults(results.length > 0);
      } catch (error) {
        console.error('RAG search failed:', error);
      }
    } else {
      setRagResults([]);
      setShowRagResults(false);
    }
  };

  return (
    <div className="w-full">
      {/* Voice recording indicator */}
      {isListening && (
        <div className="mb-3 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-full text-sm border border-pink-200 dark:border-pink-800">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            <span>Listening...</span>
          </div>
        </div>
      )}

      {/* Enhanced input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl shadow-lg hover:shadow-xl focus-within:border-pink-500 dark:focus-within:border-pink-400 transition-all duration-200">
          {/* Left action buttons */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* RAG Search Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 w-9 p-0 rounded-lg transition-colors",
                    ragEnabled 
                      ? "text-purple-600 bg-purple-50 hover:bg-purple-100" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  title="Search knowledge base"
                >
                  <Database className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem 
                  onClick={() => {
                    setRagEnabled(!ragEnabled);
                    setRagType('video');
                    if (!ragEnabled) setShowRagResults(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  <span>Search Video Library</span>
                  {ragEnabled && ragType === 'video' && <div className="w-2 h-2 bg-purple-500 rounded-full ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setRagEnabled(!ragEnabled);
                    setRagType('email');
                    if (!ragEnabled) setShowRagResults(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  <span>Search Email Archive</span>
                  {ragEnabled && ragType === 'email' && <div className="w-2 h-2 bg-purple-500 rounded-full ml-auto" />}
                </DropdownMenuItem>
                {ragEnabled && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setRagEnabled(false);
                      setShowRagResults(false);
                      setRagResults([]);
                    }}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <span>Disable Search</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent",
              "pl-20 pr-24 py-4 text-base placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none focus:ring-0 rounded-2xl",
              "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            )}
            rows={1}
          />

          {/* Right action buttons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Voice button */}
            {browserSupportsSpeechRecognition && onVoiceToggle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onVoiceToggle}
                disabled={disabled}
                className={cn(
                  "h-9 w-9 p-0 rounded-lg transition-all duration-200",
                  isListening 
                    ? "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 scale-110" 
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Send button */}
            <Button
              type="submit"
              disabled={disabled || !message.trim()}
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-lg transition-all duration-200",
                !disabled && message.trim()
                  ? "bg-pink-500 hover:bg-pink-600 text-white shadow-md hover:shadow-lg scale-105" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
              title="Send message"
            >
              {disabled ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* RAG Results Preview */}
        {showRagResults && ragResults.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                {ragType === 'video' ? <Video className="h-4 w-4 text-purple-500" /> : <Mail className="h-4 w-4 text-purple-500" />}
                <span>Found {ragResults.length} relevant {ragType === 'video' ? 'videos' : 'emails'}</span>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {ragResults.slice(0, 3).map((result, index) => (
                <div key={result.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-900 mb-1">{result.title || result.subject}</div>
                  <div className="text-xs text-gray-600 line-clamp-2">
                    {result.description || result.content?.substring(0, 100) || result.transcript?.substring(0, 100)}...
                  </div>
                  {result.matchType && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                        {result.matchType}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Voice transcript display */}
      {transcript && (
        <div className="mt-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
            <span className="text-sm">
              <span className="font-medium">Voice input:</span> {transcript}
            </span>
          </div>
        </div>
      )}

      {/* Status text */}
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center space-y-1">
        <div className="flex items-center justify-center gap-4">
          {showWebSearch && (
            <div className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              <span>Web search enabled</span>
            </div>
          )}
          {ragEnabled && (
            <div className="flex items-center gap-1">
              {ragType === 'video' ? <Video className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
              <span>{ragType === 'video' ? 'Video' : 'Email'} search enabled</span>
            </div>
          )}
        </div>
        <div>PBL Chat can make mistakes. Check important info.</div>
      </div>
    </div>
  );
} 