"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, Loader2, Search, Paperclip } from 'lucide-react';
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
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
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
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
              "pl-16 pr-24 py-4 text-base placeholder:text-gray-400 dark:placeholder:text-gray-500",
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
        {showWebSearch && (
          <div className="flex items-center justify-center gap-1">
            <Search className="h-3 w-3" />
            <span>Web search enabled</span>
          </div>
        )}
        <div>PBL Chat can make mistakes. Check important info.</div>
      </div>
    </div>
  );
} 