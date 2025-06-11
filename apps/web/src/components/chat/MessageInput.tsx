"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isListening?: boolean;
  onVoiceToggle?: () => void;
  browserSupportsSpeechRecognition?: boolean;
  transcript?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  isListening = false,
  onVoiceToggle,
  browserSupportsSpeechRecognition = false,
  transcript = '',
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
      <form onSubmit={handleSubmit} className="flex gap-3 items-end mb-2">
        <div className="flex-1 relative">
          <div className="relative">
            {/* Glass background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-2xl backdrop-blur-sm border border-gray-200/60 shadow-sm"/>
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent rounded-2xl"/>
            
            {/* Enhanced background for listening state */}
            {isListening && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-red-50/80 via-orange-50/60 to-red-50/80 rounded-2xl backdrop-blur-sm border border-red-200/60"/>
                <div className="absolute inset-0 bg-gradient-to-b from-red-50/40 via-transparent to-transparent rounded-2xl"/>
              </>
            )}
            
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening 
                  ? "Listening..." 
                  : "Message PBL Assistant..."
              }
              disabled={disabled}
              className={cn(
                "min-h-[44px] max-h-[88px] resize-none border-0 bg-transparent relative z-10",
                "px-4 py-2.5 pr-12 text-sm placeholder:text-gray-500",
                "focus:outline-none focus:ring-0 rounded-2xl",
                isListening && "placeholder:text-red-400"
              )}
              rows={1}
            />
            
            {/* Send Button */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-lg backdrop-blur-sm"/>
                <Button
                  type="submit"
                  disabled={disabled || !message.trim()}
                  size="icon"
                  className={cn(
                    "relative h-6 w-6 rounded-lg border-0 bg-transparent",
                    "text-white hover:bg-white/20 disabled:bg-gray-300/80 disabled:text-gray-500",
                    "transition-all duration-200"
                  )}
                >
                  {disabled ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            
            {isListening && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-600 font-medium">Recording</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voice button */}
        {browserSupportsSpeechRecognition && onVoiceToggle && (
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-xl backdrop-blur-sm border",
              isListening 
                ? "bg-gradient-to-r from-red-50/80 via-orange-50/60 to-red-50/80 border-red-200/60" 
                : "bg-gradient-to-r from-white/60 via-white/80 to-white/60 border-gray-200/60"
            )}/>
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent rounded-xl"/>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onVoiceToggle}
              disabled={disabled}
              className={cn(
                "h-[44px] w-[44px] rounded-xl border-0 bg-transparent relative z-10",
                isListening 
                  ? "text-red-600 hover:bg-red-100/60" 
                  : "text-gray-700 hover:bg-white/60"
              )}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </form>

      {transcript && (
        <div className="mb-2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/80 via-orange-50/60 to-red-50/80 rounded-xl backdrop-blur-sm border border-red-200/60"/>
          <div className="absolute inset-0 bg-gradient-to-b from-red-50/40 via-transparent to-transparent rounded-xl"/>
          <div className="relative p-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-xs text-red-700">
                <span className="font-medium">Voice:</span> {transcript}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center">
        PBL Assistant can make mistakes. Check important info.
      </p>
    </div>
  );
} 