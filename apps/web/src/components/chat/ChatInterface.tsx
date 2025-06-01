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
      <div className="h-full grid grid-rows-[auto_1fr_auto] bg-white">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="hover:bg-gray-100 rounded-xl"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-medium text-gray-900">PBL Assistant</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {browserSupportsSpeechRecognition && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className={cn(
                  "hover:bg-gray-100 rounded-xl",
                  isListening && "bg-red-50 text-red-600 hover:bg-red-100",
                  hasPermission === false && "bg-orange-50 text-orange-600 hover:bg-orange-100"
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
        
        {/* Welcome Content - Middle area */}
        <div className="flex items-center justify-center px-4 bg-gray-50">
          <div className="max-w-2xl text-center">
            <h2 className="text-2xl font-medium text-gray-900 mb-3">How can I help you today?</h2>
            <p className="text-gray-600">Start a conversation by typing a message below.</p>
          </div>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="p-4 bg-white border-t border-gray-100">
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
    <div className="h-full grid grid-rows-[auto_1fr_auto] bg-white">
      {/* Header - Fixed at top */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="hover:bg-gray-100 rounded-xl"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-medium text-gray-900 truncate">
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
                "hover:bg-gray-100 rounded-xl",
                voiceMode && "bg-blue-50 text-blue-600 hover:bg-blue-100"
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
                "hover:bg-gray-100 rounded-xl",
                isListening && "bg-red-50 text-red-600 hover:bg-red-100",
                hasPermission === false && "bg-orange-50 text-orange-600 hover:bg-orange-100"
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

      {/* Messages - Middle area with overflow */}
      <div className="bg-gray-50 overflow-hidden">
        <MessageList messages={allMessages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="p-4 bg-white border-t border-gray-100">
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
  );
} 