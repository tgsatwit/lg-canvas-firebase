"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Bot, 
  Copy, 
  Volume2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const { speak, isSupported: speechSupported } = useTextToSpeech();

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleSpeakMessage = (content: string) => {
    if (speechSupported) {
      speak(content);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/60 to-slate-50/40 rounded-2xl backdrop-blur-sm border border-gray-200/40 shadow-sm blur-sm"/>
            <div className="relative bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-2xl p-8 backdrop-blur-sm border border-gray-200/60">
              <Bot className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">Ready to chat</p>
              <p className="text-sm opacity-75">Send a message to get started</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onCopy={handleCopyMessage}
            onSpeak={handleSpeakMessage}
            speechSupported={speechSupported}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface MessageItemProps {
  message: Message;
  onCopy: (content: string) => void;
  onSpeak: (content: string) => void;
  speechSupported: boolean;
}

function MessageItem({ 
  message, 
  onCopy, 
  onSpeak, 
  speechSupported 
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  return (
    <div className="group">
      <div className="flex gap-4 items-start">
        {/* Enhanced Avatar with glass effect */}
        <div className="relative shrink-0">
          <div className={cn(
            "absolute inset-0 rounded-full backdrop-blur-sm border shadow-sm",
            isUser && "bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700/60",
            isAssistant && "bg-gradient-to-r from-green-600/90 to-emerald-600/90 border-green-500/60",
            isSystem && "bg-gradient-to-r from-gray-500/90 to-gray-600/90 border-gray-400/60"
          )}/>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm relative z-10">
            {isUser && "U"}
            {isAssistant && "G"}
            {isSystem && "S"}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2">
          {/* Role Label with enhanced styling */}
          <div className={cn(
            "text-sm font-medium",
            isUser && "text-gray-800",
            isAssistant && "text-green-700",
            isSystem && "text-gray-600"
          )}>
            {isUser && "You"}
            {isAssistant && "PBL Assistant"}
            {isSystem && "System"}
          </div>

          {/* Message Content with glass bubble */}
          <div className="relative">
            <div className={cn(
              "absolute inset-0 rounded-2xl backdrop-blur-sm border shadow-sm",
              isUser && "bg-gradient-to-r from-gray-50/80 via-white/60 to-gray-50/80 border-gray-200/60",
              isAssistant && "bg-gradient-to-r from-green-50/80 via-emerald-25/60 to-green-50/80 border-green-200/60",
              isSystem && "bg-gradient-to-r from-gray-50/80 via-slate-50/60 to-gray-50/80 border-gray-200/60"
            )}/>
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent rounded-2xl"/>
            
            <div className="relative z-10 p-4">
              <div className="prose prose-gray max-w-none">
                {isAssistant ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-4 last:mb-0 text-gray-800 leading-relaxed">{children}</p>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-green-100/80 px-2 py-1 rounded text-sm font-mono text-green-800 backdrop-blur-sm">
                            {children}
                          </code>
                        ) : (
                          <div className="relative my-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-slate-900/95 rounded-lg backdrop-blur-sm border border-gray-700/60"/>
                            <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 via-transparent to-transparent rounded-lg"/>
                            <pre className="relative z-10 p-4 overflow-x-auto">
                              <code className="text-sm font-mono text-gray-100">{children}</code>
                            </pre>
                          </div>
                        );
                      },
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-800">{children}</li>,
                      h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-gray-900">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-gray-900">{children}</h3>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status indicators with enhanced styling */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pl-4">
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
            
            {message.isStreaming && (
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generating...</span>
              </div>
            )}
            
            {message.error && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>Error</span>
              </div>
            )}
          </div>

          {/* Enhanced Message Actions */}
          {!message.isStreaming && message.content && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-lg backdrop-blur-sm border border-gray-200/60"/>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(message.content)}
                  className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg bg-transparent border-0 relative z-10"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              
              {speechSupported && isAssistant && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-lg backdrop-blur-sm border border-gray-200/60"/>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSpeak(message.content)}
                    className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-lg bg-transparent border-0 relative z-10"
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Speak
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 