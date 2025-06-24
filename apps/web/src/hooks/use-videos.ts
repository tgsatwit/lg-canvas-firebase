import { useState, useEffect } from 'react';

// Define the Video type with all the rich metadata from the Firestore document
export type Video = {
  id: string;
  title: string;
  thumbnail: string;
  visibility: "Public" | "Private" | "Unlisted" | "public" | "private" | "unlisted" | "-";
  uploadDate: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  status: "Published" | "Draft" | "Processing";
  
  // Vimeo metadata
  vimeoId?: string;
  vimeoOttId?: string;
  
  // File details
  fileType?: string;
  fileSize?: string;
  
  // Download info
  downloadUrl?: string;
  downloadInfo?: any;
  
  // Links
  link?: string;
  gcpLink?: string;
  
  // Descriptions
  description?: string;
  vimeoDescription?: string;
  
  // Thumbnails
  thumbnails?: Array<{
    uri?: string;
    height?: number;
    width?: number;
  }>;
  
  // Tags
  tags?: string[];
  
  // Created dates
  createdAt?: string;
  
  // Video metadata
  videoMetadata?: {
    created_time?: string;
    description?: string;
    duration?: number;
  } | null;
  
  // Vimeo OTT metadata
  vimeoOttMetadata?: {
    created_at?: string;
    description?: string;
    duration?: number;
    files_href?: string;
    id?: string;
    link?: string;
  } | null;
  
  // Raw data for debugging
  rawData?: any;
  
  // YouTube specific fields
  youtubeStatus?: string;
  youtubeLink?: string;
  upload_scheduled?: string;
  upload_time?: string;
  yt_title?: string;
  yt_description?: string;
  yt_tags?: string[];
  yt_privacyStatus?: string;
  details_confirmed?: string;
};

export const useVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVideos = async () => {
      try {
        setLoading(true);
        // Use the API route instead of direct Firebase access
        const response = await fetch('/api/videos');
        
        if (!response.ok) {
          throw new Error(`Error fetching videos: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setVideos(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch videos'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVideos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Add a function to fetch a specific video
  const getVideo = async (id: string): Promise<Video | null> => {
    try {
      const response = await fetch(`/api/videos/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching video: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching video with ID ${id}:`, error);
      return null;
    }
  };

  // Add a function to update a video
  const updateVideo = async (id: string, data: Partial<Video>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating video: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating video with ID ${id}:`, error);
      return false;
    }
  };

  return { videos, loading, error, getVideo, updateVideo };
}; 