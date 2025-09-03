"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Bot, 
  Copy, 
  Volume2, 
  AlertCircle,
  Loader2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Share
} from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
  onRegenerateMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export function MessageList({ 
  messages, 
  onRegenerateMessage,
  onEditMessage 
}: MessageListProps) {
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
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium mb-1">Ready to chat</p>
          <p className="text-sm">Send a message to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onCopy={handleCopyMessage}
            onSpeak={handleSpeakMessage}
            onRegenerate={onRegenerateMessage}
            onEdit={onEditMessage}
            speechSupported={speechSupported}
          />
        ))}
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  onCopy: (content: string) => void;
  onSpeak: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  speechSupported: boolean;
}

function MessageItem({ 
  message, 
  onCopy, 
  onSpeak, 
  onRegenerate,
  speechSupported 
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  if (isUser) {
    // User messages on the left
    return (
      <div className="group w-full flex justify-start">
        <div className="flex gap-3 items-start max-w-2xl">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-1">
            {/* Author Name */}
            <div className="text-sm font-semibold text-gray-900">You</div>

            {/* Message Bubble */}
            <div className="relative p-4 rounded-2xl bg-gray-100 text-gray-900">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-sm">
                {message.content}
              </p>
            </div>

            {/* Message Actions */}
            {message.content && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(message.content)}
                  className="h-7 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
                  title="Copy message"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Assistant messages on the right
  return (
    <div className="group w-full flex justify-end">
      <div className="flex gap-3 items-start max-w-2xl">
        {/* Message Content */}
        <div className="space-y-1">
          {/* Author Name */}
          <div className="text-sm font-semibold text-gray-900 text-right">PBL Chat</div>

          {/* Message Bubble */}
          <div className="relative p-4 rounded-2xl bg-white border border-gray-200 text-gray-900">
            {/* Message Content */}
            <div className="prose prose-gray max-w-none text-sm">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 last:mb-0 text-gray-900 leading-relaxed">
                      {children}
                    </p>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono text-gray-900">
                        {children}
                      </code>
                    ) : (
                      <div className="my-3 bg-gray-900 rounded-lg overflow-hidden">
                        <pre className="p-3 overflow-x-auto">
                          <code className="text-xs font-mono text-gray-100">{children}</code>
                        </pre>
                      </div>
                    );
                  },
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-900">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-900">{children}</ol>,
                  li: ({ children }) => <li className="text-gray-900">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 text-gray-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-900">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 text-gray-900">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Status indicators */}
            {message.isStreaming && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Generating response...</span>
              </div>
            )}
            
            {message.error && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-3">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs">Error generating response</span>
              </div>
            )}
          </div>

          {/* Message Actions */}
          {!message.isStreaming && message.content && (
            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(message.content)}
                className="h-7 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
                title="Copy message"
              >
                <Copy className="h-3 w-3" />
              </Button>
              
              {speechSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSpeak(message.content)}
                  className="h-7 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
                  title="Read aloud"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}

              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate(message.id)}
                  className="h-7 px-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg text-xs"
                  title="Regenerate response"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(236, 72, 153, 0.9) 0%,
                  rgba(139, 92, 246, 0.9) 100%
                )
              `
            }}
          >
            <Bot className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
} 