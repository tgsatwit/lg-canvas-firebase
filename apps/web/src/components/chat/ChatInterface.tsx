"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Search,
  MoreHorizontal,
  Edit3,
  Bookmark
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { generateChatResponse } from '@/utils/ai/chat';
import { Message } from '@/types/chat';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  userId: string;
  conversationId: string | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function ChatInterface({
  userId,
  conversationId,
  onToggleSidebar,
}: ChatInterfaceProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const { toast } = useToast();
  
  const {
    conversations,
    activeConversation,
    addMessage,
    createConversation,
    setActiveConversation,
    reflections,
    loadUserReflections,
  } = useChatStore();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error: speechError,
    clearError: clearSpeechError,
    hasPermission,
    requestMicrophoneAccess,
  } = useSpeechToText();

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: speechSynthesisSupported,
  } = useTextToSpeech();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show toast for speech recognition errors
  useEffect(() => {
    if (speechError) {
      toast({
        variant: "destructive", 
        title: "Speech Recognition Error",
        description: speechError,
        action: hasPermission === false ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              clearSpeechError();
              await requestMicrophoneAccess();
            }}
          >
            Allow Access
          </Button>
        ) : undefined,
      });
      clearSpeechError();
    }
  }, [speechError, toast, clearSpeechError, hasPermission, requestMicrophoneAccess]);

  // Load reflections when user changes
  useEffect(() => {
    if (userId) {
      loadUserReflections(userId);
    }
  }, [userId, loadUserReflections]);

  // Set active conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversations[conversationId]) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, conversations, setActiveConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingMessage]);

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isGenerating) return;

    let currentConversationId = conversationId;

    // Create new conversation if none exists
    if (!currentConversationId) {
      try {
        currentConversationId = await createConversation(userId, {
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        });
        setActiveConversation(currentConversationId);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    const conversation = conversations[currentConversationId];
    if (!conversation) return;

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    await addMessage(currentConversationId, userMessage);

    // Start generating AI response
    setIsGenerating(true);
    setShowTypingIndicator(true);
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setStreamingMessage(assistantMessage);

    try {
      // Determine if we need web search
      let enhancedContent = content;
      let searchResults = '';

      if (isWebSearchEnabled) {
        try {
          // Call web search agent to determine if search is needed and perform it
          const webSearchResponse = await fetch('/api/agents/web-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: content,
              userId: userId,
            }),
          });

          if (webSearchResponse.ok) {
            const searchData = await webSearchResponse.json();
            if (searchData.searchResults && searchData.searchResults.length > 0) {
              searchResults = '\n\nWeb Search Results:\n' + 
                searchData.searchResults.map((result: any, index: number) => 
                  `${index + 1}. ${result.title}\n   ${result.snippet}\n   Source: ${result.url}`
                ).join('\n\n');
              
              enhancedContent = content + '\n\n[Assistant: I searched the web for current information to provide you with the most up-to-date response.]' + searchResults;
            }
          }
        } catch (searchError) {
          console.error('Web search failed:', searchError);
          // Continue without search results
        }
      }

      await generateChatResponse({
        messages: [...conversation.messages, { ...userMessage, content: enhancedContent }],
        systemInstructions: isWebSearchEnabled 
          ? conversation.systemInstructions + '\n\nYou have access to current web search results. Use them to provide accurate, up-to-date information. Cite sources when relevant.'
          : conversation.systemInstructions,
        userId,
        reflections,
        model: conversation.model,
        onChunk: (content) => {
          setStreamingMessage(prev => prev ? { ...prev, content } : null);
        },
        onComplete: async (finalContent) => {
          const finalMessage = {
            ...assistantMessage,
            content: finalContent,
            isStreaming: false,
          };
          
          await addMessage(currentConversationId!, finalMessage);
          setStreamingMessage(null);
          setShowTypingIndicator(false);
          
          // Speak the response if voice mode is enabled
          if (voiceMode && speechSynthesisSupported) {
            speak(finalContent);
          }
        },
      });
    } catch (error) {
      console.error('Failed to generate response:', error);
      const errorMessage = {
        ...assistantMessage,
        content: 'Sorry, I encountered an error while generating a response. Please try again.',
        isStreaming: false,
        error: true,
      };
      await addMessage(currentConversationId, errorMessage);
      setStreamingMessage(null);
      setShowTypingIndicator(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceToggle = () => {
    if (hasPermission === false) {
      // If permission is denied, try to request it
      requestMicrophoneAccess();
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleVoiceModeToggle = () => {
    setVoiceMode(!voiceMode);
    if (isSpeaking) {
      cancelSpeech();
    }
  };

  // Show ChatGPT-like welcome interface when no conversation or empty conversation
  if (!conversationId || !activeConversation || activeConversation.messages.length === 0) {
    return (
      <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
        {/* Modern header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
              className={cn(
                "text-gray-500 rounded-lg",
                isWebSearchEnabled 
                  ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="Toggle web search"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {browserSupportsSpeechRecognition && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={cn(
                  "text-gray-700 dark:text-gray-300 rounded-lg",
                  isListening 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
                    : hasPermission === false 
                      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                title={
                  hasPermission === false 
                    ? "Microphone access denied. Click to request permission."
                    : isListening 
                      ? "Stop listening"
                      : "Start voice input"
                }
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </header>
        
        {/* Welcome content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-3xl text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Start a conversation, ask questions, or get help with your projects.
              </p>
            </div>

            {/* Quick action suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => handleSendMessage("Help me brainstorm ideas for a new project")}
                className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-md flex items-center justify-center">
                    <Edit3 className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Brainstorm ideas</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate creative ideas for your next project
                </p>
              </button>

              <button
                onClick={() => handleSendMessage("Search the web for the latest news in AI")}
                className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-md flex items-center justify-center">
                    <Search className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Search the web</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get the latest information from the internet
                </p>
              </button>

              <button
                onClick={() => handleSendMessage("Help me write a professional email")}
                className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-md flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Write content</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create professional emails, documents, and more
                </p>
              </button>

              <button
                onClick={() => handleSendMessage("Explain a complex topic in simple terms")}
                className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-pink-100 dark:bg-pink-900 rounded-md flex items-center justify-center">
                    <Bookmark className="h-3 w-3 text-pink-600 dark:text-pink-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Learn something</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get explanations for complex topics
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Modern input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="max-w-4xl mx-auto">
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={isGenerating}
              isListening={isListening}
              onVoiceToggle={handleVoiceToggle}
              browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
              transcript={transcript}
              placeholder="Message PBL Chat..."
              showWebSearch={isWebSearchEnabled}
            />
          </div>
        </div>
      </div>
    );
  }

  const allMessages = streamingMessage 
    ? [
        // Filter out any saved messages with the same ID as the streaming message
        ...activeConversation.messages.filter((msg: Message) => msg.id !== streamingMessage.id),
        streamingMessage,
      ]
    : activeConversation.messages;

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Modern chat header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-semibold text-gray-900 dark:text-white truncate">
              {activeConversation.title}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
            className={cn(
              "text-gray-500 rounded-lg",
              isWebSearchEnabled 
                ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" 
                : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
            )}
            title="Toggle web search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {speechSynthesisSupported && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceModeToggle}
              className={cn(
                "text-gray-500 rounded-lg",
                voiceMode 
                  ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="Toggle voice mode"
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {browserSupportsSpeechRecognition && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceToggle}
              className={cn(
                "text-gray-500 rounded-lg",
                isListening 
                  ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" 
                  : hasPermission === false 
                    ? "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title={
                hasPermission === false 
                  ? "Microphone access denied. Click to request permission."
                  : isListening 
                    ? "Stop listening"
                    : "Start voice input"
              }
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full">
          <MessageList messages={allMessages} />
          <div ref={messagesEndRef} />
        </div>
        
        {/* Typing indicator */}
        {(isGenerating || showTypingIndicator) && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              <span className="text-sm">PBL Chat is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modern input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isGenerating}
            isListening={isListening}
            onVoiceToggle={handleVoiceToggle}
            browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
            transcript={transcript}
            placeholder="Message PBL Chat..."
            showWebSearch={isWebSearchEnabled}
          />
        </div>
      </div>
    </div>
  );
} 