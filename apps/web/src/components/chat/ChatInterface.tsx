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
  Plus,
  Send,
  Loader2,
  Video,
  Mail,
  Database,
  StopCircle,
  Bot,
  X
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { generateChatResponse } from '@/utils/ai/chat';
import { Message } from '@/types/chat';
import { MessageList } from '@/components/chat/MessageList';
import { FilePickerButton } from '@/components/chat/FilePickerButton';
import { AttachmentFile } from '@/components/chat/FileAttachment';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  userId: string;
  conversationId: string | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNewChat?: () => void;
}

export function ChatInterface({
  userId,
  conversationId,
  sidebarCollapsed,
  onToggleSidebar,
  onNewChat,
}: ChatInterfaceProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [ragSearchType, setRagSearchType] = useState<'video' | 'email' | null>(null);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const { toast } = useToast();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setMessage(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleRagSearch = async (query: string, type: 'video' | 'email') => {
    try {
      const response = await fetch(`/api/rag/${type}-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: query,
          userId,
          limit: 5
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (error) {
      console.error(`RAG ${type} search failed:`, error);
    }
    return [];
  };

  const handleSendMessage = async (messageToSend?: string) => {
    const contentToSend = messageToSend || message.trim();
    if ((!contentToSend && attachments.length === 0) || isGenerating) return;

    let currentConversationId = conversationId;

    // Create new conversation if none exists
    if (!currentConversationId) {
      try {
        currentConversationId = await createConversation(userId, {
          title: contentToSend.slice(0, 50) + (contentToSend.length > 50 ? '...' : ''),
        });
        setActiveConversation(currentConversationId);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    const conversation = conversations[currentConversationId];
    if (!conversation) return;

    // Enhanced message with RAG search if enabled
    let enhancedContent = contentToSend;
    let ragContext = '';

    if (ragSearchType) {
      try {
        const ragResults = await handleRagSearch(contentToSend, ragSearchType);
        if (ragResults.length > 0) {
          ragContext = ragResults.map((result: any, index: number) => 
            `[${ragSearchType.toUpperCase()} ${index + 1}] ${result.title || result.subject}: ${result.description || result.content?.substring(0, 200) || result.transcript?.substring(0, 200) || ''}`
          ).join('\n\n');
          
          enhancedContent = `${contentToSend}\n\n[CONTEXT FROM ${ragSearchType.toUpperCase()} LIBRARY]\n${ragContext}`;
        }
      } catch (error) {
        console.error('RAG search failed:', error);
      }
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: contentToSend || (attachments.length > 0 ? `[Sent ${attachments.length} file${attachments.length > 1 ? 's' : ''}]` : ''), // Show original message to user
      timestamp: Date.now(),
      ...(attachments.length > 0 && { attachments: attachments }),
    };

    await addMessage(currentConversationId, userMessage);
    setMessage('');
    setAttachments([]); // Clear attachments after sending
    resetTranscript();

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
      // Web search enhancement
      let searchResults = '';
      if (isWebSearchEnabled) {
        try {
          const webSearchResponse = await fetch('/api/agents/web-search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: contentToSend,
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
              
              enhancedContent += '\n\n[Assistant: I searched the web for current information.]' + searchResults;
            }
          }
        } catch (searchError) {
          console.error('Web search failed:', searchError);
        }
      }

      await generateChatResponse({
        messages: [...conversation.messages, { ...userMessage, content: enhancedContent }],
        systemInstructions: (isWebSearchEnabled || ragSearchType) 
          ? conversation.systemInstructions + `\n\nYou have access to ${isWebSearchEnabled ? 'current web search results' : ''}${ragSearchType ? ` and relevant ${ragSearchType} content from the user's library` : ''}. Use this information to provide accurate, contextual responses. When referencing ${ragSearchType} content, mention the source clearly.`
          : conversation.systemInstructions,
        userId,
        reflections,
        model: 'gpt-5',  // Hardwired to GPT-5
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
          
          // Update conversation title if this is the first message
          if (conversation.title === 'New Chat' && conversation.messages.length === 0) {
            const { updateConversation } = useChatStore.getState();
            await updateConversation(currentConversationId!, {
              title: contentToSend.slice(0, 50) + (contentToSend.length > 50 ? '...' : ''),
            });
          }
          
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceToggle = () => {
    if (hasPermission === false) {
      requestMicrophoneAccess();
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      // Reset to no active conversation to show welcome screen
      setActiveConversation('');
      // Clear any current message input
      setMessage('');
      setAttachments([]);
      // Clear streaming states
      setIsGenerating(false);
      setStreamingMessage(null);
      setShowTypingIndicator(false);
      // Reset voice states
      if (isListening) {
        stopListening();
      }
      resetTranscript();
    }
  };

  // Show ChatGPT-like welcome interface when no conversation or empty conversation
  if (!conversationId || !activeConversation || activeConversation.messages.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-gray-900">PBL Chat</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Start new chat"
            >
              <Plus className="h-5 w-5 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Show chat history"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </header>

        {/* Welcome Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-2xl text-center">
            <div className="mb-8">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(236, 72, 153, 0.9) 0%,
                      rgba(139, 92, 246, 0.9) 100%
                    )
                  `
                }}
              >
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-3">
                How can I help you today?
              </h2>
              <p className="text-gray-600">
                I can help you with content creation, video planning, marketing strategies, and more.
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                {
                  title: "Generate content ideas",
                  description: "Get fresh ideas for your next video or campaign",
                  prompt: "Help me brainstorm content ideas for my upcoming video series"
                },
                {
                  title: "Search my videos",
                  description: "Find specific videos from your library",
                  prompt: "Search my video library for content about social media marketing"
                },
                {
                  title: "Analyze performance",
                  description: "Review your content performance and get insights",
                  prompt: "Analyze my recent video performance and suggest improvements"
                },
                {
                  title: "Create marketing copy",
                  description: "Generate compelling marketing messages",
                  prompt: "Help me write marketing copy for my new product launch"
                }
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(suggestion.prompt)}
                  className="p-4 text-left border border-gray-200 hover:border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <h3 className="font-medium text-gray-900 mb-2">{suggestion.title}</h3>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Input */}
        <div className="bg-white shrink-0">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl focus-within:shadow-xl transition-shadow">
              {/* Show attachments above the input area if they exist */}
              {attachments.length > 0 && (
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                      >
                        <span className="text-gray-700 max-w-xs truncate" title={attachment.name}>
                          {attachment.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* File picker button - repositioned to bottom left */}
              <div className="absolute left-4 bottom-3">
                <FilePickerButton
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  disabled={isGenerating}
                />
              </div>
              
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message PBL Chat..."
                className={cn(
                  "w-full resize-none border-0 bg-transparent pl-16 pr-20 py-4 text-base placeholder:text-gray-500 focus:outline-none min-h-[56px] max-h-[200px] rounded-2xl",
                  attachments.length > 0 ? "pt-2" : ""
                )}
                rows={1}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {browserSupportsSpeechRecognition && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceToggle}
                    className={cn(
                      "h-10 w-10 p-0 rounded-full transition-all",
                      isListening 
                        ? "text-white bg-red-500 hover:bg-red-600 shadow-md" 
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    )}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                )}
                
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!message.trim() && attachments.length === 0) || isGenerating}
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 rounded-full transition-all shadow-md",
                    (message.trim() || attachments.length > 0) && !isGenerating
                      ? "bg-pink-500 hover:bg-pink-600 text-white hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-sm"
                  )}
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>


            {/* Search Options */}
            <div className="flex items-center justify-center gap-3 mt-3">
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                className={cn(
                  "text-xs",
                  isWebSearchEnabled ? "text-pink-600 bg-pink-50" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Search className="h-3 w-3 mr-1" />
                Web Search
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRagSearchType(ragSearchType === 'video' ? null : 'video')}
                className={cn(
                  "text-xs",
                  ragSearchType === 'video' ? "text-purple-600 bg-purple-50" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Video className="h-3 w-3 mr-1" />
                Video Library
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRagSearchType(ragSearchType === 'email' ? null : 'email')}
                className={cn(
                  "text-xs",
                  ragSearchType === 'email' ? "text-purple-600 bg-purple-50" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Mail className="h-3 w-3 mr-1" />
                Email Archive
              </Button>
            </div>

            {/* Voice Indicator */}
            {isListening && (
              <div className="flex items-center justify-center mt-3">
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening...
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center mt-3">
              PBL Chat can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  const allMessages = streamingMessage 
    ? [
        ...activeConversation.messages.filter((msg: Message) => msg.id !== streamingMessage.id),
        streamingMessage,
      ]
    : activeConversation.messages;

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Header - keep same as welcome state */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-medium text-gray-900">{activeConversation.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Start new chat"
          >
            <Plus className="h-5 w-5 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Show chat history"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </header>

      {/* Messages - positioned at top, not centered */}
      <div className="flex-1 overflow-y-auto bg-white">
        <MessageList messages={allMessages} />
        <div ref={messagesEndRef} />
        
      </div>

      {/* Sticky Input - keep same as welcome state */}
      <div className="bg-white shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl focus-within:shadow-xl transition-shadow">
            {/* Show attachments above the input area if they exist */}
            {attachments.length > 0 && (
              <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-gray-700 max-w-xs truncate" title={attachment.name}>
                        {attachment.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter(a => a.id !== attachment.id))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* File picker button - repositioned to bottom left */}
            <div className="absolute left-4 bottom-3">
              <FilePickerButton
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                disabled={isGenerating}
              />
            </div>
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message PBL Chat..."
              disabled={isGenerating}
              className={cn(
                "w-full resize-none border-0 bg-transparent pl-16 pr-20 py-4 text-base placeholder:text-gray-500 focus:outline-none min-h-[56px] max-h-[200px] disabled:bg-gray-50 disabled:cursor-not-allowed rounded-2xl",
                attachments.length > 0 ? "pt-2" : ""
              )}
              rows={1}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {browserSupportsSpeechRecognition && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceToggle}
                  disabled={isGenerating}
                  className={cn(
                    "h-10 w-10 p-0 rounded-full transition-all",
                    isListening 
                      ? "text-white bg-red-500 hover:bg-red-600 shadow-md" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
              
              <Button
                onClick={() => handleSendMessage()}
                disabled={(!message.trim() && attachments.length === 0) || isGenerating}
                size="sm"
                className={cn(
                  "h-10 w-10 p-0 rounded-full transition-all shadow-md",
                  (message.trim() || attachments.length > 0) && !isGenerating
                    ? "bg-pink-500 hover:bg-pink-600 text-white hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-sm"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Search Options */}
          <div className="flex items-center justify-center gap-3 mt-3">
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
              disabled={isGenerating}
              className={cn(
                "text-xs",
                isWebSearchEnabled ? "text-pink-600 bg-pink-50" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Search className="h-3 w-3 mr-1" />
              Web Search
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRagSearchType(ragSearchType === 'video' ? null : 'video')}
              disabled={isGenerating}
              className={cn(
                "text-xs",
                ragSearchType === 'video' ? "text-purple-600 bg-purple-50" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Video className="h-3 w-3 mr-1" />
              Video Library
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRagSearchType(ragSearchType === 'email' ? null : 'email')}
              disabled={isGenerating}
              className={cn(
                "text-xs",
                ragSearchType === 'email' ? "text-purple-600 bg-purple-50" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Mail className="h-3 w-3 mr-1" />
              Email Archive
            </Button>
          </div>

          {/* Voice Indicator */}
          {isListening && (
            <div className="flex items-center justify-center mt-3">
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening...
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center mt-3">
            PBL Chat can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
}