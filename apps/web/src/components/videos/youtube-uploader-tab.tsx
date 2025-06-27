"use client";

import { useState, useCallback, useEffect } from 'react';
import { YouTubeTable } from '@/components/ui/youtube/youtube-table';

// Define the Video type to match the one in use-videos.ts
type Video = {
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
  
  // Legacy YouTube fields (kept for backward compatibility)
  youtubeDescription?: string;
  youtubeUploaded?: boolean;
  youtubeUrl?: string;
  youtubeLink?: string;
  youtubeUploadDate?: string;
  youtubeStatus?: string;
  scheduledUploadDate?: string;
  vimeoTags?: string[];
  vimeoCategories?: string[];
  storageUrl?: string;
  
  // YouTube metadata fields
  yt_title?: string;
  yt_description?: string;
  yt_tags?: string[];
  yt_privacyStatus?: string;
  details_confirmed?: string;
};

// Upload progress interface
interface UploadProgress {
  videoId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  message?: string;
}

interface YouTubeUploaderTabProps {
  videos?: Video[];
  loading?: boolean;
  onEditVideo?: (video: Video) => void;
}

export function YouTubeUploaderTab({ videos = [], loading = false, onEditVideo }: YouTubeUploaderTabProps) {
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter videos to show only those with "ready for YouTube" status
  const readyForYouTubeVideos = videos.filter(video => 
    video.youtubeStatus?.toLowerCase() === 'ready for youtube'
  );

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUploadVideo = useCallback(async (video: Video) => {
    try {
      // Initialize progress tracking
      setUploadProgress(prev => new Map(prev.set(video.id, {
        videoId: video.id,
        progress: 0,
        status: 'uploading',
        message: 'Starting upload...'
      })));

      const response = await fetch(`/api/videos/${video.id}/upload-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Upload successful
        setUploadProgress(prev => new Map(prev.set(video.id, {
          videoId: video.id,
          progress: 100,
          status: 'completed',
          message: 'Upload completed successfully!'
        })));

        setNotification({
          type: 'success',
          message: `${video.title} uploaded to YouTube successfully!`
        });

        // Reload the page after a short delay to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } else if (response.status === 401 && result.authUrl) {
        // Authentication required
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(video.id);
          return newMap;
        });

        setNotification({
          type: 'error',
          message: 'YouTube authentication required. Redirecting...'
        });

        // Redirect to YouTube authentication
        setTimeout(() => {
          window.location.href = result.authUrl;
        }, 1000);

      } else {
        // Upload failed
        setUploadProgress(prev => new Map(prev.set(video.id, {
          videoId: video.id,
          progress: 0,
          status: 'failed',
          message: result.error || 'Upload failed'
        })));

        setNotification({
          type: 'error',
          message: result.error || 'Failed to upload video to YouTube'
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadProgress(prev => new Map(prev.set(video.id, {
        videoId: video.id,
        progress: 0,
        status: 'failed',
        message: 'Network error during upload'
      })));

      setNotification({
        type: 'error',
        message: 'Network error: Failed to upload video'
      });
    }
  }, []);

  const renderCustomActions = useCallback((video: Video) => {
    const progress = uploadProgress.get(video.id);
    
    if (progress?.status === 'uploading') {
      return (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Uploading...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          {progress.message && (
            <span className="text-xs text-gray-600">{progress.message}</span>
          )}
        </div>
      );
    }

    if (progress?.status === 'completed') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-4 h-4">✓</div>
          <span className="text-sm">Uploaded</span>
        </div>
      );
    }

    if (progress?.status === 'failed') {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-4 h-4">✗</div>
            <span className="text-sm">Failed</span>
          </div>
          <button
            onClick={() => handleUploadVideo(video)}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      );
    }

    // Default state - show upload button
    return (
      <button
        onClick={() => handleUploadVideo(video)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        Upload
      </button>
    );
  }, [uploadProgress, handleUploadVideo]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="font-medium">
            {notification.message}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Videos Ready for YouTube Upload
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {readyForYouTubeVideos.length} video{readyForYouTubeVideos.length !== 1 ? 's' : ''} ready to upload
          </p>
        </div>
        
        {readyForYouTubeVideos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos ready for upload</h3>
            <p className="text-gray-600 mb-4">Videos will appear here once they have been prepared for YouTube upload.</p>
            <p className="text-sm text-gray-500">To prepare a video, edit it from the Videos tab and confirm the YouTube details.</p>
          </div>
        ) : (
          <YouTubeTable 
            videos={readyForYouTubeVideos}
            isLoading={loading}
            onEditVideo={onEditVideo}
            customActions={renderCustomActions}
          />
        )}
      </div>
    </div>
  );
} 