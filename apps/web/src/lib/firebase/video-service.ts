import { 
  collection, 
  query, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { chatDb } from './config'; // Use chatDb for pbl-backend database

// Collection name
const VIDEOS_COLLECTION = 'videos';

// Video item interface
export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  createdAt: Timestamp;
  updatedAt: Timestamp;
  uploadedToYoutube: boolean;
  youtubeUrl?: string;
  scheduledUploadDate?: Timestamp;
  vimeoId?: string;
  vimeoTags?: string[];
  vimeoCategories?: string[];
  baseStorageUrl: string;
  transcript?: string;
}

// Helper to convert Firestore timestamps
const convertTimestamps = (data: DocumentData): any => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key];
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertTimestamps(result[key]);
    }
  });
  return result;
};

// Get all videos
export const getAllVideos = async (): Promise<VideoItem[]> => {
  const q = query(
    collection(chatDb, VIDEOS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  } as VideoItem));
};

// Get a single video by ID
export const getVideoById = async (videoId: string): Promise<VideoItem | null> => {
  const docRef = doc(chatDb, VIDEOS_COLLECTION, videoId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...convertTimestamps(docSnap.data())
    } as VideoItem;
  }
  
  return null;
};

// Update a video
export const updateVideo = async (videoId: string, data: Partial<VideoItem>): Promise<void> => {
  const docRef = doc(chatDb, VIDEOS_COLLECTION, videoId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Generate transcript
export const generateTranscript = async (videoId: string, videoUrl: string): Promise<string> => {
  // This would call an API service that generates a transcript
  // Mock implementation for now
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const transcript = "This is a mock transcript generated for the video...";
  
  // Update the video with the transcript
  await updateVideo(videoId, { transcript });
  
  return transcript;
};

// Generate AI content based on transcript
export const generateWithAI = async (
  prompt: string, 
  transcript: string, 
  type: 'description' | 'tags' | 'social'
): Promise<string> => {
  // This would call an AI service (like OpenAI) to generate content
  // Mock implementation for now
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  switch (type) {
    case 'description':
      return "AI-generated description based on the transcript...";
    case 'tags':
      return "tag1, tag2, tag3, tag4, tag5";
    case 'social':
      return "Check out our latest video! #content #video";
    default:
      return "";
  }
}; 