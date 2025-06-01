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
          <Bot className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium mb-1">Ready to chat</p>
          <p className="text-sm opacity-75">Send a message to get started</p>
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
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0",
          isUser && "bg-black",
          isAssistant && "bg-green-600",
          isSystem && "bg-gray-500"
        )}>
          {isUser && "U"}
          {isAssistant && "G"}
          {isSystem && "S"}
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-2">
          {/* Role Label */}
          <div className="text-sm font-medium text-gray-900">
            {isUser && "You"}
            {isAssistant && "PBL Assistant"}
            {isSystem && "System"}
          </div>

          {/* Message Content */}
          <div className="prose prose-gray max-w-none">
            {isAssistant ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-4 last:mb-0 text-gray-800 leading-relaxed">{children}</p>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ) : (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                        <code className="text-sm font-mono">{children}</code>
                      </pre>
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

          {/* Status indicators */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
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

          {/* Message Actions */}
          {!message.isStreaming && message.content && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(message.content)}
                className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              
              {speechSupported && isAssistant && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSpeak(message.content)}
                  className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Speak
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 