import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET() {
  try {
    // Get Firestore instance
    const firestoreAdmin = adminFirestore();
    if (!firestoreAdmin) {
      console.error("Firebase admin not initialized");
      return NextResponse.json(
        { error: "Firebase admin not initialized" },
        { status: 500 }
      );
    }
    
    const collectionName = process.env.FIREBASE_VIDEOS_COLLECTION || 'videos-master';
    
    const collectionRef = firestoreAdmin.collection(collectionName);
    const snapshot = await collectionRef.get();
    const docs: QueryDocumentSnapshot<DocumentData>[] = snapshot.docs;
    
    // Extract duration from various possible locations
    const extractDuration = (data: any): string | number => {
      // Check different possible locations for duration
      const duration = 
        data.duration || 
        (data.vimeo_metadata && data.vimeo_metadata.duration) ||
        (data.video_metadata && data.video_metadata.duration) ||
        (data.vimeo_ott_metadata && data.vimeo_ott_metadata.duration) ||
        (data.vimeoMetadata && data.vimeoMetadata.duration) ||
        (data.videoMetadata && data.videoMetadata.duration) ||
        (data.vimeoOttMetadata && data.vimeoOttMetadata.duration) ||
        "00:00";
        
      return duration;
    };
    
    const videos = docs.map((doc) => {
      const data = doc.data();
      
      // Define thumbnail interface to avoid type errors
      interface ThumbnailObject {
        uri?: string;
        url?: string;
        height?: number;
        width?: number;
        url_with_play_button?: string;
        [key: string]: any;
      }
      
      // Check for thumbnails field with numeric keys
      if (data.thumbnails) {
        // If it has numeric keys, it might not show up properly in the log
        if (typeof data.thumbnails === 'object' && !Array.isArray(data.thumbnails)) {
          // Log a specific entry if it exists
          if ('0' in data.thumbnails) {
            // Thumbnail processing logic here
          }
        }
      }
      
      // Extract nested vimeo_ott_metadata if present
      const nestedVimeoOttMetadata = data.vimeo_ott_metadata || (data.nested_fields && data.nested_fields.vimeo_ott_metadata) || null;
      const nestedVimeoMetadata = data.vimeo_metadata || (data.nested_fields && data.nested_fields.vimeo_metadata) || null;

      // Extract gcpLink possibly nested
      const extractedGcpLink = data.gcp_link || (data.nested_fields && data.nested_fields.gcp_link) || "";

      // Extract video metadata from the document
      const toIso = (val: any): string => {
        if (!val) return "";
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
          if (val._seconds !== undefined) {
            return new Date(val._seconds * 1000).toISOString();
          }
          if (val.seconds !== undefined) {
            return new Date(val.seconds * 1000).toISOString();
          }
        }
        return String(val);
      };
      
      const uploadDateIso = toIso(data.uploadDate || data.createdAt || data.created_time);
      const createdAtIso = toIso(data.createdAt || data.created_time);
      
      return {
        id: doc.id,
        title: data.name || data.title || "Untitled",
        
        // Use thumbnail from various possible sources in the document
        thumbnail: data.thumbnail || 
                  (data.thumbnails && data.thumbnails[0]?.uri) ||
                  (nestedVimeoMetadata && (nestedVimeoMetadata.thumbnail || (nestedVimeoMetadata.thumbnails && nestedVimeoMetadata.thumbnails[0]?.url))) ||
                  (data.vimeoId ? `https://i.vimeocdn.com/video/${data.vimeoId}_640x360.jpg` : 
                  'https://via.placeholder.com/640x360'),
                  
        // Visibility, status and other metadata
        visibility: data.visibility || "Public",
        uploadDate: uploadDateIso,
        views: data.views || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        
        // Extract duration properly from all possible locations
        duration: extractDuration(data),
        status: data.status || (data.confirmed ? "Published" : "Processing"),
        
        // Add Vimeo-specific metadata
        vimeoId: data.vimeoId || data.id || "",
        vimeoOttId: data.vimeoOttId || data.vimeoOttMetadata?.id || data.vimeo_ott_metadata?.id || "",
        
        // Add file details
        fileType: data.file_type || "mp4",
        fileSize: data.file_size || "",
        
        // Add download info
        downloadUrl: data.download_link || "",
        downloadInfo: data.download_info || null,
        
        // Add links
        link: data.link || "",
        gcpLink: extractedGcpLink,
        
        // Add descriptions - check all possible locations based on screenshot
        description: data.description || 
                    (data.video_metadata && data.video_metadata.description) || 
                    "",
        vimeoDescription: (nestedVimeoMetadata && nestedVimeoMetadata.description) || data.description || "",
        
        // Add thumbnails array handling different structures
        thumbnails: (() => {
          let thumbnails = [];
          
          // First check if there's a direct thumbnails field with numeric indices (0, 1, 2, etc.)
          if (data.thumbnails && typeof data.thumbnails === 'object') {
            // Check if it's an object with numeric keys
            const keys = Object.keys(data.thumbnails);
            const hasNumericKeys = keys.some(k => !isNaN(Number(k)));
            
            if (hasNumericKeys) {
              // Convert the object with numeric keys to an array
              const maxIndex = Math.max(...keys.map(k => Number(k)));
              thumbnails = Array(maxIndex + 1).fill(null);
              
              for (const [key, value] of Object.entries(data.thumbnails)) {
                const index = Number(key);
                if (!isNaN(index) && value && typeof value === 'object') {
                  const thumbObj = value as ThumbnailObject;
                  thumbnails[index] = {
                    uri: thumbObj.uri || "",
                    height: thumbObj.height || 0,
                    width: thumbObj.width || 0,
                    url_with_play_button: thumbObj.url_with_play_button || ""
                  };
                }
              }
              // Filter out null entries
              thumbnails = thumbnails.filter(Boolean);
              if (thumbnails.length > 0) {
                return thumbnails;
              }
            }
          }
          
          // Next try the vimeo_metadata thumbnails with same approach
          if (data.vimeo_metadata && data.vimeo_metadata.thumbnails) {
            const thumbnailsObj = data.vimeo_metadata.thumbnails;
            if (typeof thumbnailsObj === 'object' && !Array.isArray(thumbnailsObj)) {
              const keys = Object.keys(thumbnailsObj);
              const hasNumericKeys = keys.some(k => !isNaN(Number(k)));
              
              if (hasNumericKeys) {
                // Convert the object with numeric keys to an array
                const maxIndex = Math.max(...keys.map(k => Number(k)));
                thumbnails = Array(maxIndex + 1).fill(null);
                
                for (const [key, value] of Object.entries(thumbnailsObj)) {
                  const index = Number(key);
                  if (!isNaN(index) && value && typeof value === 'object') {
                    const thumbObj = value as ThumbnailObject;
                    thumbnails[index] = {
                      uri: thumbObj.uri || "",
                      height: thumbObj.height || 0,
                      width: thumbObj.width || 0,
                      url_with_play_button: thumbObj.url_with_play_button || ""
                    };
                  }
                }
                // Filter out null entries
                thumbnails = thumbnails.filter(Boolean);
                if (thumbnails.length > 0) {
                  return thumbnails;
                }
              }
            }
          }
          
          // Rest of the original function
          // ... existing code ...
          
          return thumbnails;
        })(),
        
        // Add tags
        tags: data.tags || [],
        
        // Add created dates
        createdAt: createdAtIso,
        
        // Add video metadata with explicit duration handling
        videoMetadata: {
          ...(data.video_metadata || (data.nested_fields && data.nested_fields.video_metadata) || {}),
          duration: (data.video_metadata && data.video_metadata.duration) || 
                    (nestedVimeoMetadata && nestedVimeoMetadata.duration) || 
                    data.duration || 0
        },
        vimeoOttMetadata: {
          ...(nestedVimeoOttMetadata || {}),
          duration: (nestedVimeoOttMetadata && nestedVimeoOttMetadata.duration) || 
                    data.duration || 0
        },
        vimeo_metadata: nestedVimeoMetadata,
        
        // YouTube fields
        youtubeStatus: data.youtubeStatus || data.youtube_status || "",
        youtubeLink: data.youtubeLink || data.youtube_link || "",
        
        // Add raw data for debugging in development
        rawData: process.env.NODE_ENV === 'development' ? data : undefined
      };
    });
    
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos", details: String(error) },
      { status: 500 }
    );
  }
} 