import { create } from 'zustand';
import { Conversation, ConversationWithMessages, Message, MessagePage, SystemInstruction, UserReflection } from '@/types/chat';
import { 
  saveConversation, 
  loadUserConversations, 
  deleteConversationFromDB,
  saveMessage,
  loadRecentMessages,
  loadConversationMessages,
  loadReflections,
  saveReflection,
  loadSystemInstructions,
  saveSystemInstruction
} from '@/lib/firebase/chatService';

interface ChatStore {
  // Conversations
  conversations: Record<string, ConversationWithMessages>;
  activeConversationId: string | null;
  activeConversation: ConversationWithMessages | null;
  
  // Loading states
  loadingConversations: boolean;
  
  // Reflections
  reflections: UserReflection[];
  
  // System Instructions
  systemInstructions: SystemInstruction[];
  
  // Actions
  loadConversations: (userId: string) => Promise<void>;
  createConversation: (userId: string, data: Partial<Conversation>) => Promise<string>;
  setActiveConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  
  // Message loading
  loadConversationMessages: (conversationId: string, forceReload?: boolean) => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;
  
  // Reflections
  loadUserReflections: (userId: string) => Promise<void>;
  addReflection: (userId: string, reflection: Omit<UserReflection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  
  // System Instructions
  loadUserSystemInstructions: (userId: string) => Promise<void>;
  createSystemInstruction: (userId: string, instruction: Omit<SystemInstruction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: {},
  activeConversationId: null,
  activeConversation: null,
  loadingConversations: false,
  reflections: [],
  systemInstructions: [],

  loadConversations: async (userId: string) => {
    set({ loadingConversations: true });
    try {
      const conversations = await loadUserConversations(userId);
      const conversationsMap = conversations.reduce((acc, conv) => {
        acc[conv.id] = {
          ...conv,
          messages: [],
          messagesLoaded: false,
          hasMoreMessages: true,
          loadingMessages: false,
        };
        return acc;
      }, {} as Record<string, ConversationWithMessages>);
      
      set({ conversations: conversationsMap });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      set({ loadingConversations: false });
    }
  },

  createConversation: async (userId: string, data: Partial<Conversation>) => {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      userId,
      title: data.title || 'New Conversation',
      systemInstructions: data.systemInstructions || 'You are a helpful AI assistant.',
      model: data.model || 'claude-3-5-sonnet-latest',
      messageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...data,
    };

    await saveConversation(conversation);
    
    const conversationWithMessages: ConversationWithMessages = {
      ...conversation,
      messages: [],
      messagesLoaded: true, // New conversation, no messages to load
      hasMoreMessages: false,
      loadingMessages: false,
    };
    
    set(state => ({
      conversations: {
        ...state.conversations,
        [conversation.id]: conversationWithMessages
      }
    }));

    return conversation.id;
  },

  setActiveConversation: async (id: string) => {
    const { conversations, loadConversationMessages } = get();
    const conversation = conversations[id];
    
    if (!conversation) return;
    
    set({ 
      activeConversationId: id,
      activeConversation: conversation
    });
    
    // Load messages if not already loaded
    if (!conversation.messagesLoaded && !conversation.loadingMessages) {
      await loadConversationMessages(id);
    }
  },

  loadConversationMessages: async (conversationId: string, forceReload = false) => {
    const { conversations } = get();
    const conversation = conversations[conversationId];
    
    if (!conversation) return;
    
    // Skip if already loaded and not forcing reload
    if (conversation.messagesLoaded && !forceReload) return;
    
    set(state => ({
      conversations: {
        ...state.conversations,
        [conversationId]: {
          ...conversation,
          loadingMessages: true,
        }
      }
    }));

    try {
      const messages = await loadRecentMessages(conversationId, 50);
      
      set(state => ({
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            messages,
            messagesLoaded: true,
            loadingMessages: false,
            hasMoreMessages: messages.length >= 50, // Assume more if we got a full page
          }
        },
        activeConversation: state.activeConversationId === conversationId 
          ? {
              ...state.conversations[conversationId],
              messages,
              messagesLoaded: true,
              loadingMessages: false,
              hasMoreMessages: messages.length >= 50,
            }
          : state.activeConversation
      }));
    } catch (error) {
      console.error('Failed to load messages:', error);
      set(state => ({
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            loadingMessages: false,
          }
        }
      }));
    }
  },

  loadOlderMessages: async (conversationId: string) => {
    const { conversations } = get();
    const conversation = conversations[conversationId];
    
    if (!conversation || !conversation.hasMoreMessages || conversation.loadingMessages) return;
    
    set(state => ({
      conversations: {
        ...state.conversations,
        [conversationId]: {
          ...conversation,
          loadingMessages: true,
        }
      }
    }));

    try {
      // This would use pagination with cursor from the oldest message
      // For now, we'll just mark as no more messages
      set(state => ({
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            loadingMessages: false,
            hasMoreMessages: false,
          }
        }
      }));
    } catch (error) {
      console.error('Failed to load older messages:', error);
      set(state => ({
        conversations: {
          ...state.conversations,
          [conversationId]: {
            ...state.conversations[conversationId],
            loadingMessages: false,
          }
        }
      }));
    }
  },

  addMessage: async (conversationId: string, message: Message) => {
    const { conversations } = get();
    const conversation = conversations[conversationId];
    
    if (!conversation) return;

    // Add conversationId to message for storage
    const messageWithConversationId = {
      ...message,
      conversationId,
    };

    // Optimistically update the UI
    const updatedMessages = [...conversation.messages, message];
    const updatedConversation = {
      ...conversation,
      messages: updatedMessages,
      messageCount: conversation.messageCount + 1,
      lastMessageAt: Date.now(),
      lastMessagePreview: message.content.slice(0, 100),
      updatedAt: Date.now(),
    };

    set(state => ({
      conversations: {
        ...state.conversations,
        [conversationId]: updatedConversation
      },
      activeConversation: state.activeConversationId === conversationId 
        ? updatedConversation 
        : state.activeConversation
    }));

    // Save to database asynchronously
    try {
      await saveMessage(messageWithConversationId);
    } catch (error) {
      console.error('Failed to save message:', error);
      // TODO: Implement retry logic or show error state
    }
  },

  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
    set(state => {
      const conversation = state.conversations[conversationId];
      if (!conversation) return state;

      const updatedMessages = conversation.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      );

      const updatedConversation = {
        ...conversation,
        messages: updatedMessages,
        updatedAt: Date.now(),
      };

      return {
        conversations: {
          ...state.conversations,
          [conversationId]: updatedConversation
        },
        activeConversation: state.activeConversationId === conversationId 
          ? updatedConversation 
          : state.activeConversation
      };
    });
  },

  updateConversation: async (conversationId: string, updates: Partial<Conversation>) => {
    const { conversations } = get();
    const conversation = conversations[conversationId];
    
    if (!conversation) return;

    const updatedConversation = {
      ...conversation,
      ...updates,
      updatedAt: Date.now(),
    };

    // Update store immediately
    set(state => ({
      conversations: {
        ...state.conversations,
        [conversationId]: updatedConversation
      },
      activeConversation: state.activeConversationId === conversationId 
        ? updatedConversation 
        : state.activeConversation
    }));

    // Save to database
    try {
      await saveConversation(updatedConversation);
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  },

  deleteConversation: async (id: string) => {
    await deleteConversationFromDB(id);
    
    set(state => {
      const { [id]: deleted, ...rest } = state.conversations;
      return {
        conversations: rest,
        activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        activeConversation: state.activeConversationId === id ? null : state.activeConversation,
      };
    });
  },

  loadUserReflections: async (userId: string) => {
    try {
      const reflections = await loadReflections(userId);
      set({ reflections });
    } catch (error) {
      console.error('Failed to load reflections:', error);
    }
  },

  addReflection: async (userId: string, reflection: Omit<UserReflection, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReflection: UserReflection = {
      ...reflection,
      id: crypto.randomUUID(),
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveReflection(newReflection);
    
    set(state => ({
      reflections: [...state.reflections, newReflection]
    }));
  },

  loadUserSystemInstructions: async (userId: string) => {
    try {
      const instructions = await loadSystemInstructions(userId);
      set({ systemInstructions: instructions });
    } catch (error) {
      console.error('Failed to load system instructions:', error);
    }
  },

  createSystemInstruction: async (userId: string, instruction: Omit<SystemInstruction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInstruction: SystemInstruction = {
      ...instruction,
      id: crypto.randomUUID(),
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveSystemInstruction(newInstruction);
    
    set(state => ({
      systemInstructions: [...state.systemInstructions, newInstruction]
    }));
  },
})); 