"use client";

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/shell';
import { YouTubeTable } from '@/components/ui/youtube/youtube-table';
import { 
  Dialog, 
  DialogContent,
  VideoEditorModal
} from '@/components/ui/youtube/youtube-modal';
import { VideoUploadModal } from "@/components/videos/video-upload-modal";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useVideos } from '@/hooks/use-videos';


// Define the Video type to match the one in use-videos.ts
type Video = {
  id: string;
  title: string;
  thumbnail: string;
  visibility: "Public" | "Private" | "Unlisted";
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
};

export default function VideosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { videos, loading, error } = useVideos();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for YouTube auth success/error
    const youtubeAuth = searchParams.get('youtube_auth');
    const errorParam = searchParams.get('error');
    
    if (youtubeAuth === 'success') {
      setNotification({
        type: 'success',
        message: 'YouTube authentication successful! You can now upload videos.'
      });
      // Clear the URL params
      window.history.replaceState({}, '', '/dashboard/videos');
    } else if (errorParam === 'youtube_auth_failed' || errorParam === 'youtube_auth_error') {
      setNotification({
        type: 'error',
        message: 'YouTube authentication failed. Please try again.'
      });
      // Clear the URL params
      window.history.replaceState({}, '', '/dashboard/videos');
    } else if (errorParam === 'youtube_auth_expired') {
      setNotification({
        type: 'error',
        message: 'YouTube authorization expired. Please try the authentication process again.'
      });
      // Clear the URL params
      window.history.replaceState({}, '', '/dashboard/videos');
    }
  }, [searchParams]);
  
  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  const handleEditVideo = (video: Video) => {
    // Only log when editing a video (not on every load)
    // console.log("Selected video data:", {
    //   id: video.id,
    //   title: video.title,
    //   vimeoId: video.vimeoId,
    //   vimeoOttId: video.vimeoOttId,
    //   gcpLink: video.gcpLink,
    //   hasVimeoMetadata: !!video.videoMetadata,
    //   hasVimeoOttMetadata: !!video.vimeoOttMetadata
    // });
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCreateVideo = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = (videoId: string) => {
    console.log('Video uploaded successfully:', videoId);
    setIsUploadModalOpen(false);
    // Optionally refresh the videos list or show a success message
    // The useVideos hook should automatically refresh the list
    window.location.reload(); // Simple refresh for now
  };

  if (error) {
    return (
      <DashboardShell>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error loading videos</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error.message}</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="relative min-h-screen">
        {notification && (
          <div className={`mx-4 mt-4 p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <p className={`text-sm ${
              notification.type === 'success' 
                ? 'text-green-800 dark:text-green-300' 
                : 'text-red-800 dark:text-red-300'
            }`}>
              {notification.message}
            </p>
          </div>
        )}
        <div className="relative px-4 py-6 md:px-6 md:py-8">
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-full sm:w-[300px] bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="h-[400px] bg-gray-100 dark:bg-gray-900 animate-pulse" />
              </div>
            </div>
          ) : (
            <YouTubeTable 
              onEditVideo={handleEditVideo}
              onCreateVideo={handleCreateVideo}
              videos={videos}
              isLoading={loading}
            />
          )}
          
          <VideoEditorModal 
            open={isModalOpen} 
            onOpenChange={setIsModalOpen}
            videoData={selectedVideo}
          >
            <DialogPrimitive.Title 
              className="absolute w-1 h-1 overflow-hidden m-[-1px] p-0 border-0 clip"
            >
              {selectedVideo ? `Edit Video: ${selectedVideo.title}` : 'Create New Video'}
            </DialogPrimitive.Title>
          </VideoEditorModal>
          
          <VideoUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadComplete={handleUploadComplete}
          />
        </div>
      </div>
    </DashboardShell>
  );
} 