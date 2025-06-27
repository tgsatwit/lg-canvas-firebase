import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { ensureFirebaseInitialized } from './config';
import { Conversation, Message } from '@/types/chat';
import { saveMessage } from './chatService';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

interface LegacyConversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  systemInstructions: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  metadata?: any;
}

/**
 * Migrate conversations from embedded messages to separate message storage
 * This should be run once to migrate existing data
 */
export async function migrateConversationsToSeparateMessages(userId: string): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    console.log(`Starting migration for user: ${userId}`);

    // Load all conversations for the user
    const conversationsQuery = query(
      collection(chatDb, CONVERSATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const conversationsSnapshot = await getDocs(conversationsQuery);
    const batch = writeBatch(chatDb);
    let messageCount = 0;
    let conversationCount = 0;

    for (const conversationDoc of conversationsSnapshot.docs) {
      const data = conversationDoc.data() as LegacyConversation;
      
      // Skip if already migrated (no embedded messages)
      if (!data.messages || data.messages.length === 0) {
        console.log(`Conversation ${data.id} already migrated or has no messages`);
        continue;
      }

      console.log(`Migrating conversation ${data.id} with ${data.messages.length} messages`);

      // Save each message to the messages collection
      for (const message of data.messages) {
        const messageWithConversationId = {
          ...message,
          conversationId: data.id,
        };
        
        try {
          await saveMessage(messageWithConversationId);
          messageCount++;
        } catch (error) {
          console.error(`Failed to migrate message ${message.id}:`, error);
        }
      }

      // Update conversation to remove embedded messages and add metadata
      const updatedConversation: Partial<Conversation> = {
        messageCount: data.messages.length,
        updatedAt: Date.now(),
      };

      // Only add optional fields if they have values
      if (data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        if (lastMessage.timestamp !== undefined) {
          updatedConversation.lastMessageAt = lastMessage.timestamp;
        }
        if (lastMessage.content !== undefined) {
          updatedConversation.lastMessagePreview = lastMessage.content.slice(0, 100);
        }
      }

      const conversationRef = doc(chatDb, CONVERSATIONS_COLLECTION, data.id);
      const updateData: any = {
        ...updatedConversation,
        // Remove the embedded messages field
        messages: null, // This will remove the field
        migratedAt: serverTimestamp(),
      };

      batch.update(conversationRef, updateData);

      conversationCount++;
    }

    // Commit all conversation updates
    if (conversationCount > 0) {
      await batch.commit();
    }

    console.log(`Migration completed: ${conversationCount} conversations, ${messageCount} messages`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Check if a user needs migration
 */
export async function needsMigration(userId: string): Promise<boolean> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    
    const conversationsQuery = query(
      collection(chatDb, CONVERSATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(conversationsQuery);
    
    // Check if any conversation has embedded messages
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Backup conversations before migration
 */
export async function backupConversations(userId: string): Promise<void> {
  try {
    const { chatDb } = ensureFirebaseInitialized();
    
    const conversationsQuery = query(
      collection(chatDb, CONVERSATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(conversationsQuery);
    const backup = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Store backup in browser storage
    localStorage.setItem(`conversation_backup_${userId}`, JSON.stringify(backup));
    console.log(`Backed up ${backup.length} conversations for user ${userId}`);
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
} 