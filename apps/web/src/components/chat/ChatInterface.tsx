"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { 
  Menu, 
  Settings, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare
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
  sidebarCollapsed,
  onToggleSidebar,
}: ChatInterfaceProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const { toast } = useToast();
  
  const {
    conversations,
    activeConversation,
    addMessage,
    updateMessage,
    createConversation,
    setActiveConversation,
    loadConversationMessages,
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
  }, [transcript, isListening]);

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
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setStreamingMessage(assistantMessage);

    try {
      await generateChatResponse({
        messages: [...conversation.messages, userMessage],
        systemInstructions: conversation.systemInstructions,
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

  // Show simple new chat interface when no conversation or empty conversation
  if (!conversationId || !activeConversation || activeConversation.messages.length === 0) {
    return (
      <div className="h-full relative overflow-hidden">
        {/* Enhanced background with light liquid glass effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white"/>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-25/30 to-purple-50/60"/>
          <div className="absolute inset-0 backdrop-blur-xl"/>
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/60 rounded-full blur-2xl"/>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-100/60 rounded-full blur-xl"/>
        </div>

        <div className="h-full grid grid-rows-[auto_1fr_auto] relative z-10">
          {/* Enhanced header with liquid glass effect */}
          <header className="relative border-b border-gray-200/60">
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl"/>
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent"/>
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
            <div className="relative flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleSidebar}
                  className="text-gray-700 hover:bg-white/60 hover:text-gray-900 rounded-xl transition-all duration-200"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {browserSupportsSpeechRecognition && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceToggle}
                    className={cn(
                      "text-gray-700 rounded-xl transition-all duration-200",
                      isListening 
                        ? "bg-gradient-to-r from-red-50/80 to-orange-50/60 text-red-600 hover:bg-red-100/80" 
                        : hasPermission === false 
                          ? "bg-gradient-to-r from-orange-50/80 to-yellow-50/60 text-orange-600 hover:bg-orange-100/80"
                          : "hover:bg-white/60 hover:text-gray-900"
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
            </div>
          </header>
          
          {/* Enhanced welcome content with glass styling */}
          <div className="flex items-center justify-center px-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 pointer-events-none"/>
            <div className="max-w-2xl text-center relative z-10">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-50/60 to-rose-50/40 rounded-2xl backdrop-blur-sm border border-pink-200/40 shadow-sm blur-sm"/>
                <div className="relative bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-2xl p-8 backdrop-blur-sm border border-gray-200/60">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-600">Start a conversation by typing a message below.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced input area with glass styling */}
          <div className="relative border-t border-gray-200/60">
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl"/>
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent"/>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
            <div className="relative p-6">
              <div className="max-w-4xl mx-auto">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  disabled={isGenerating}
                  isListening={isListening}
                  onVoiceToggle={handleVoiceToggle}
                  browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                  transcript={transcript}
                />
              </div>
            </div>
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
    <div className="h-full relative overflow-hidden">
      {/* Enhanced background with light liquid glass effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-white"/>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 via-rose-25/30 to-purple-50/60"/>
        <div className="absolute inset-0 backdrop-blur-xl"/>
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/60 rounded-full blur-2xl"/>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-100/60 rounded-full blur-xl"/>
      </div>

      <div className="h-full grid grid-rows-[auto_1fr_auto] relative z-10">
        {/* Enhanced header with liquid glass effect */}
        <header className="relative border-b border-gray-200/60">
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl"/>
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent"/>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
          <div className="relative flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="text-gray-700 hover:bg-white/60 hover:text-gray-900 rounded-xl transition-all duration-200"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">
                {activeConversation.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {speechSynthesisSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceModeToggle}
                  className={cn(
                    "text-gray-700 rounded-xl transition-all duration-200",
                    voiceMode 
                      ? "bg-gradient-to-r from-pink-50/80 to-rose-50/60 text-pink-600 hover:bg-pink-100/80"
                      : "hover:bg-white/60 hover:text-gray-900"
                  )}
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
                    "text-gray-700 rounded-xl transition-all duration-200",
                    isListening 
                      ? "bg-gradient-to-r from-red-50/80 to-orange-50/60 text-red-600 hover:bg-red-100/80" 
                      : hasPermission === false 
                        ? "bg-gradient-to-r from-orange-50/80 to-yellow-50/60 text-orange-600 hover:bg-orange-100/80"
                        : "hover:bg-white/60 hover:text-gray-900"
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
          </div>
        </header>

        {/* Enhanced messages area with glass effect */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/30 pointer-events-none"/>
          <div className="relative z-10">
            <MessageList messages={allMessages} />
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced input area with glass styling */}
        <div className="relative border-t border-gray-200/60">
          <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/80 to-white/70 backdrop-blur-xl"/>
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent"/>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
          <div className="relative p-6">
            <div className="max-w-4xl mx-auto">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isGenerating}
                isListening={isListening}
                onVoiceToggle={handleVoiceToggle}
                browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                transcript={transcript}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 