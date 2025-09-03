export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  conversationId?: string; // For database storage
  attachments?: MessageAttachment[];
  isStreaming?: boolean;
  error?: boolean;
  audioUrl?: string; // For voice messages
  parentMessageId?: string; // For threading/replies
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // base64 encoded content
  preview?: string; // for images
  url?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  systemInstructions: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number; // Track total message count
  lastMessageAt?: number; // Timestamp of last message
  lastMessagePreview?: string; // Preview of last message for UI
  metadata?: {
    totalTokens?: number;
    lastModel?: string;
    tags?: string[];
    archived?: boolean;
  };
}

// New interface for message loading
export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

// Chat state interface for the store
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
  messagesLoaded: boolean;
  hasMoreMessages: boolean;
  loadingMessages: boolean;
}

export interface UserReflection {
  id: string;
  userId: string;
  category: 'style' | 'preference' | 'context' | 'knowledge';
  content: string;
  confidence: number; // 0-1
  examples: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SystemInstruction {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ChatMode = 'text' | 'voice' | 'speech-to-speech';

export interface ChatSettings {
  mode: ChatMode;
  model: string;
  temperature: number;
  maxTokens: number;
  enableReflections: boolean;
  voiceSettings: {
    speechRate: number;
    speechPitch: number;
    speechVolume: number;
  };
} 