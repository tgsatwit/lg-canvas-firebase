import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { auth, ensureFirebaseInitialized } from './config';
import { Conversation, Message, MessagePage, UserReflection, SystemInstruction } from '@/types/chat';

// Collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';
const REFLECTIONS_COLLECTION = 'reflections';
const SYSTEM_INSTRUCTIONS_COLLECTION = 'systemInstructions';

// Configuration
const DEFAULT_MESSAGE_PAGE_SIZE = 50;
const MAX_MESSAGE_PAGE_SIZE = 100;

// Helper function to check auth state
const debugAuthState = () => {
  console.log('Firebase Auth State in chatService:', {
    isSignedIn: !!auth.currentUser,
    uid: auth.currentUser?.uid,
    email: auth.currentUser?.email,
  });
};

// Conversations
export async function saveConversation(conversation: Conversation): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const docRef = doc(chatDb, CONVERSATIONS_COLLECTION, conversation.id);
    
    // Prepare conversation data without messages and filter out undefined values
    const conversationData: any = {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      systemInstructions: conversation.systemInstructions,
      model: conversation.model,
      messageCount: conversation.messageCount || 0,
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they have values (not undefined)
    if (conversation.lastMessageAt !== undefined) {
      conversationData.lastMessageAt = conversation.lastMessageAt;
    }
    if (conversation.lastMessagePreview !== undefined) {
      conversationData.lastMessagePreview = conversation.lastMessagePreview;
    }
    if (conversation.metadata !== undefined) {
      conversationData.metadata = conversation.metadata;
    }
    
    try {
      await updateDoc(docRef, conversationData);
    } catch (updateError) {
      // Document doesn't exist, create it with the specific ID
      await setDoc(docRef, {
        ...conversationData,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
}

export async function loadUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    debugAuthState();
    console.log('Loading conversations for user:', userId);
    
    const q = query(
      collection(chatDb, CONVERSATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const conversations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        systemInstructions: data.systemInstructions,
        model: data.model,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        messageCount: data.messageCount || 0,
        lastMessageAt: data.lastMessageAt || null,
        lastMessagePreview: data.lastMessagePreview || null,
        metadata: data.metadata || {},
      } as Conversation;
    });
    
    console.log(`Loaded ${conversations.length} conversations`);
    return conversations;
  } catch (error) {
    console.error('Error loading conversations:', error);
    throw error;
  }
}

export async function deleteConversationFromDB(conversationId: string): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const batch = writeBatch(chatDb);
    
    // Delete conversation
    const conversationRef = doc(chatDb, CONVERSATIONS_COLLECTION, conversationId);
    batch.delete(conversationRef);
    
    // Delete associated messages in batches (Firestore batch limit is 500 operations)
    let messagesQuery = query(
      collection(chatDb, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      limit(500)
    );
    
    let hasMore = true;
    while (hasMore) {
      const messagesSnapshot = await getDocs(messagesQuery);
      
      if (messagesSnapshot.empty) {
        hasMore = false;
        break;
      }
      
      const deleteBatch = writeBatch(chatDb);
      messagesSnapshot.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      
      await deleteBatch.commit();
      
      // Check if there are more messages
      if (messagesSnapshot.docs.length < 500) {
        hasMore = false;
      } else {
        // Get next batch
        const lastDoc = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
        messagesQuery = query(
          collection(chatDb, MESSAGES_COLLECTION),
          where('conversationId', '==', conversationId),
          startAfter(lastDoc),
          limit(500)
        );
      }
    }
    
    // Commit the conversation deletion
    await batch.commit();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Messages
export async function saveMessage(message: Message): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const batch = writeBatch(chatDb);
    
    // Save the message
    const messageRef = doc(collection(chatDb, MESSAGES_COLLECTION));
    const messageData: any = {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      conversationId: message.conversationId,
      createdAt: serverTimestamp(),
    };

    // Only add optional fields if they have values (not undefined)
    if (message.attachments !== undefined) {
      messageData.attachments = message.attachments;
    }
    if (message.isStreaming !== undefined) {
      messageData.isStreaming = message.isStreaming;
    }
    if (message.error !== undefined) {
      messageData.error = message.error;
    }
    if (message.audioUrl !== undefined) {
      messageData.audioUrl = message.audioUrl;
    }
    if (message.parentMessageId !== undefined) {
      messageData.parentMessageId = message.parentMessageId;
    }
    if (message.metadata !== undefined) {
      messageData.metadata = message.metadata;
    }

    batch.set(messageRef, messageData);
    
    // Update conversation metadata
    if (message.conversationId) {
      const conversationRef = doc(chatDb, CONVERSATIONS_COLLECTION, message.conversationId);
      const conversationUpdates: any = {
        updatedAt: serverTimestamp(),
        messageCount: (await getConversationMessageCount(message.conversationId)) + 1,
      };

      // Only add optional fields if they have values
      if (message.timestamp !== undefined) {
        conversationUpdates.lastMessageAt = serverTimestamp();
      }
      if (message.content !== undefined) {
        conversationUpdates.lastMessagePreview = message.content.slice(0, 100);
      }

      batch.update(conversationRef, conversationUpdates);
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

export async function loadConversationMessages(
  conversationId: string, 
  pageSize: number = DEFAULT_MESSAGE_PAGE_SIZE,
  cursor?: QueryDocumentSnapshot
): Promise<MessagePage> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    
    // Validate page size
    const validPageSize = Math.min(Math.max(pageSize, 1), MAX_MESSAGE_PAGE_SIZE);
    
    let q = query(
      collection(chatDb, MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(validPageSize + 1) // Get one extra to check if there are more
    );
    
    // Add cursor for pagination
    if (cursor) {
      q = query(
        collection(chatDb, MESSAGES_COLLECTION),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        startAfter(cursor),
        limit(validPageSize + 1)
      );
    }
    
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    
    // Check if there are more messages
    const hasMore = docs.length > validPageSize;
    const messages = docs.slice(0, validPageSize);
    
    // Convert to Message objects and reverse to get chronological order
    const messageData = messages.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp || data.createdAt?.toMillis() || Date.now(),
        conversationId: data.conversationId,
        attachments: data.attachments || [],
        isStreaming: data.isStreaming || false,
        error: data.error || false,
        audioUrl: data.audioUrl,
        parentMessageId: data.parentMessageId,
        metadata: data.metadata || {},
      } as Message;
    }).reverse(); // Reverse to chronological order
    
    return {
      messages: messageData,
      hasMore,
      nextCursor: hasMore ? docs[validPageSize].id : undefined,
      totalCount: await getConversationMessageCount(conversationId),
    };
  } catch (error) {
    console.error('Error loading messages:', error);
    throw error;
  }
}

// Helper function to get message count
async function getConversationMessageCount(conversationId: string): Promise<number> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const conversationRef = doc(chatDb, CONVERSATIONS_COLLECTION, conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (conversationDoc.exists()) {
      return conversationDoc.data().messageCount || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
}

// Load recent messages for a conversation (most common use case)
export async function loadRecentMessages(
  conversationId: string, 
  count: number = DEFAULT_MESSAGE_PAGE_SIZE
): Promise<Message[]> {
  const result = await loadConversationMessages(conversationId, count);
  return result.messages;
}

// Batch update messages (useful for bulk operations)
export async function batchUpdateMessages(updates: Array<{ id: string; updates: Partial<Message> }>): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const batch = writeBatch(chatDb);
    
    updates.forEach(({ id, updates }) => {
      const messageRef = doc(chatDb, MESSAGES_COLLECTION, id);
      batch.update(messageRef, updates);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error batch updating messages:', error);
    throw error;
  }
}

// Reflections
export async function saveReflection(reflection: UserReflection): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    await addDoc(collection(chatDb, REFLECTIONS_COLLECTION), {
      ...reflection,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving reflection:', error);
    throw error;
  }
}

export async function loadReflections(userId: string): Promise<UserReflection[]> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const q = query(
      collection(chatDb, REFLECTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
    })) as UserReflection[];
  } catch (error) {
    console.error('Error loading reflections:', error);
    throw error;
  }
}

// System Instructions
export async function saveSystemInstruction(instruction: SystemInstruction): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    await addDoc(collection(chatDb, SYSTEM_INSTRUCTIONS_COLLECTION), {
      ...instruction,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving system instruction:', error);
    throw error;
  }
}

export async function loadSystemInstructions(userId: string): Promise<SystemInstruction[]> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    const q = query(
      collection(chatDb, SYSTEM_INSTRUCTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
    })) as SystemInstruction[];
  } catch (error) {
    console.error('Error loading system instructions:', error);
    throw error;
  }
}

// Reflection Analysis - Analyze conversations to generate insights
export async function analyzeUserStyle(userId: string, recentMessages: Message[]): Promise<UserReflection[]> {
  // This would call an AI service to analyze the user's communication style
  // and generate reflections about preferences, tone, topics, etc.
  
  const reflections: UserReflection[] = [];
  
  // Example analysis (would be replaced with actual AI analysis)
  const messageContents = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  if (messageContents.length > 100) {
    // Call AI service to analyze style
    // For now, return empty array
  }
  
  return reflections;
} 