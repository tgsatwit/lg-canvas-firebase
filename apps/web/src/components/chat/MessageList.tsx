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
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
    </ScrollArea>
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
  const isSystem = message.role === 'system';

  return (
    <div className={cn(
      "group",
      isAssistant && "bg-gray-50 dark:bg-gray-800/50"
    )}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-4 items-start">
          {/* Modern Avatar */}
          <div className="flex-shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm",
              isUser && "bg-gray-500 dark:bg-gray-600",
              isAssistant && "bg-pink-500",
              isSystem && "bg-gray-500"
            )}>
              {isUser && <User className="h-4 w-4" />}
              {isAssistant && <Bot className="h-4 w-4" />}
              {isSystem && "S"}
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 space-y-2">
            {/* Role Label */}
            <div className={cn(
              "text-sm font-semibold",
              isUser && "text-gray-900 dark:text-white",
              isAssistant && "text-gray-900 dark:text-white",
              isSystem && "text-gray-600 dark:text-gray-400"
            )}>
              {isUser && "You"}
              {isAssistant && "PBL Chat"}
              {isSystem && "System"}
            </div>

            {/* Message Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {isAssistant ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-4 last:mb-0 text-gray-900 dark:text-gray-100 leading-relaxed">
                        {children}
                      </p>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                          {children}
                        </code>
                      ) : (
                        <div className="my-4 bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                          <pre className="p-4 overflow-x-auto">
                            <code className="text-sm font-mono text-gray-100">{children}</code>
                          </pre>
                        </div>
                      );
                    },
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-gray-900 dark:text-gray-100">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-900 dark:text-gray-100">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-900 dark:text-gray-100">{children}</li>,
                    h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">{children}</h3>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>

            {/* Status indicators */}
            {message.isStreaming && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating response...</span>
              </div>
            )}
            
            {message.error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Error generating response</span>
              </div>
            )}

            {/* Message Actions */}
            {!message.isStreaming && message.content && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(message.content)}
                  className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  title="Copy message"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {speechSupported && isAssistant && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSpeak(message.content)}
                    className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    title="Read aloud"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                )}

                {onRegenerate && isAssistant && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerate(message.id)}
                    className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                    title="Regenerate response"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  title="Like"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  title="Dislike"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  title="Share"
                >
                  <Share className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 