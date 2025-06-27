import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  limit, 
  Timestamp,
  onSnapshot,
  DocumentData
} from 'firebase/firestore';
import { chatDb } from './config';
import { 
  SocialAccount, 
  SocialComment, 
  ReplyTemplate, 
  UserPreferences,
  SocialPlatform 
} from './schemas';

// Collection names
const ACCOUNTS_COLLECTION = 'socialAccounts';
const COMMENTS_COLLECTION = 'socialComments';
const POSTS_COLLECTION = 'socialPosts';
const TEMPLATES_COLLECTION = 'replyTemplates';
const PREFERENCES_COLLECTION = 'userPreferences';

// Helper function to convert timestamps to numbers
const convertTimestamps = (data: DocumentData): any => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toMillis();
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });
  return result;
};

// Social Accounts
export const getSocialAccounts = async (userId: string): Promise<SocialAccount[]> => {
  const q = query(
    collection(chatDb, ACCOUNTS_COLLECTION),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...convertTimestamps(data)
    } as SocialAccount;
  });
};

export const getSocialAccountsByPlatform = async (
  userId: string,
  platform: SocialPlatform
): Promise<SocialAccount[]> => {
  const q = query(
    collection(chatDb, ACCOUNTS_COLLECTION),
    where('userId', '==', userId),
    where('platform', '==', platform)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...convertTimestamps(data)
    } as SocialAccount;
  });
};

export const addSocialAccount = async (account: Omit<SocialAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(chatDb, ACCOUNTS_COLLECTION), {
    ...account,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateSocialAccount = async (id: string, data: Partial<SocialAccount>): Promise<void> => {
  const docRef = doc(chatDb, ACCOUNTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now()
  });
};

export const deleteSocialAccount = async (id: string): Promise<void> => {
  await deleteDoc(doc(chatDb, ACCOUNTS_COLLECTION, id));
};

// Social Comments
export const getSocialComments = async (
  accountId: string,
  filters: {
    answered?: boolean;
    startDate?: number;
    endDate?: number;
    limit?: number;
  } = {}
): Promise<SocialComment[]> => {
  let q = query(
    collection(chatDb, COMMENTS_COLLECTION),
    where('accountId', '==', accountId)
  );
  
  if (filters.answered !== undefined) {
    q = query(q, where('answered', '==', filters.answered));
  }
  
  if (filters.startDate && filters.endDate) {
    q = query(
      q, 
      where('createdAt', '>=', filters.startDate),
      where('createdAt', '<=', filters.endDate)
    );
  }
  
  q = query(q, orderBy('createdAt', 'desc'));
  
  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...convertTimestamps(data)
    } as SocialComment;
  });
};

export const markCommentAsAnswered = async (
  commentId: string, 
  answered: boolean = true,
  replyId?: string
): Promise<void> => {
  const docRef = doc(chatDb, COMMENTS_COLLECTION, commentId);
  const updateData: Partial<SocialComment> = {
    answered,
    updatedAt: Date.now()
  };
  
  if (replyId) {
    updateData.replyId = replyId;
  }
  
  await updateDoc(docRef, updateData);
};

export const addComment = async (comment: Omit<SocialComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(chatDb, COMMENTS_COLLECTION), {
    ...comment,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

// Subscribe to comments (real-time updates)
export const subscribeToComments = (
  accountId: string,
  callback: (comments: SocialComment[]) => void,
  filters: {
    answered?: boolean;
    limit?: number;
  } = {}
) => {
  let q = query(
    collection(chatDb, COMMENTS_COLLECTION),
    where('accountId', '==', accountId)
  );
  
  if (filters.answered !== undefined) {
    q = query(q, where('answered', '==', filters.answered));
  }
  
  q = query(q, orderBy('createdAt', 'desc'));
  
  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }
  
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestamps(data)
      } as SocialComment;
    });
    callback(comments);
  });
};

// Reply Templates
export const getReplyTemplates = async (userId: string): Promise<ReplyTemplate[]> => {
  const q = query(
    collection(chatDb, TEMPLATES_COLLECTION),
    where('userId', '==', userId),
    orderBy('useCount', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...convertTimestamps(data)
    } as ReplyTemplate;
  });
};

export const addReplyTemplate = async (
  template: Omit<ReplyTemplate, 'id' | 'useCount' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(chatDb, TEMPLATES_COLLECTION), {
    ...template,
    useCount: 0,
    createdAt: now,
    updatedAt: now
  });
  return docRef.id;
};

export const updateReplyTemplate = async (
  id: string, 
  data: Partial<ReplyTemplate>
): Promise<void> => {
  const docRef = doc(chatDb, TEMPLATES_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now()
  });
};

export const incrementTemplateUseCount = async (id: string): Promise<void> => {
  const docRef = doc(chatDb, TEMPLATES_COLLECTION, id);
  const templateDoc = await getDoc(docRef);
  if (templateDoc.exists()) {
    const template = templateDoc.data() as ReplyTemplate;
    await updateDoc(docRef, {
      useCount: (template.useCount || 0) + 1,
      updatedAt: Date.now()
    });
  }
};

export const deleteReplyTemplate = async (id: string): Promise<void> => {
  await deleteDoc(doc(chatDb, TEMPLATES_COLLECTION, id));
};

// User Preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const q = query(
    collection(chatDb, PREFERENCES_COLLECTION),
    where('userId', '==', userId),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...convertTimestamps(data)
  } as UserPreferences;
};

export const createOrUpdateUserPreferences = async (
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const q = query(
    collection(chatDb, PREFERENCES_COLLECTION),
    where('userId', '==', userId),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  const now = Date.now();
  
  if (querySnapshot.empty) {
    // Create new preferences
    const defaultPreferences: Omit<UserPreferences, 'id'> = {
      userId,
      enabledPlatforms: ['facebook', 'instagram', 'youtube'],
      autoRefreshInterval: 300, // 5 minutes
      notificationSettings: {
        email: true,
        push: true,
        notifyOnNewComments: true,
        notifyOnMentions: true
      },
      defaultFilters: {},
      createdAt: now,
      updatedAt: now
    };
    
    await addDoc(collection(chatDb, PREFERENCES_COLLECTION), {
      ...defaultPreferences,
      ...preferences
    });
  } else {
    // Update existing preferences
    const docRef = doc(chatDb, PREFERENCES_COLLECTION, querySnapshot.docs[0].id);
    await updateDoc(docRef, {
      ...preferences,
      updatedAt: now
    });
  }
}; 