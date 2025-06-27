"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/shell';
import { VideoEditorModal } from '@/components/ui/youtube/youtube-modal';
import { VideoUploadModal } from "@/components/videos/video-upload-modal";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useVideos } from '@/hooks/use-videos';

// Import the tab content components
import { VideosTab } from '@/components/videos/videos-tab';
import { YouTubeLibraryTab } from '@/components/videos/youtube-library-tab';
import { YouTubeSchedulerTab } from '@/components/videos/youtube-scheduler-tab';
import { YouTubeUploaderTab } from '@/components/videos/youtube-uploader-tab';
import { YouTubePlaylistsTab } from '@/components/videos/youtube-playlists-tab';
import { PlaylistCreatorTab } from '@/components/videos/playlist-creator-tab';

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









function VideosPageContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState('videos');
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
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCreateVideo = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = (videoId: string) => {
    console.log('Video uploaded successfully:', videoId);
    setIsUploadModalOpen(false);
    window.location.reload();
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'videos':
        return 'Workout Master Library';
      case 'youtube-library':
        return 'YouTube Library';
      case 'youtube-scheduler':
        return 'YouTube Scheduler';
      case 'youtube-uploader':
        return 'YouTube Uploader';
      case 'youtube-playlists':
        return 'YouTube Playlists';
      case 'playlist-creator':
        return 'Playlist Creator';
      default:
        return 'Workout Master Library';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'videos':
        return <VideosTab videos={videos} loading={loading} onEditVideo={handleEditVideo} />;
      case 'youtube-library':
        return <YouTubeLibraryTab />;
      case 'youtube-scheduler':
        return <YouTubeSchedulerTab />;
      case 'youtube-uploader':
        return <YouTubeUploaderTab videos={videos} loading={loading} onEditVideo={handleEditVideo} />;
      case 'youtube-playlists':
        return <YouTubePlaylistsTab />;
      case 'playlist-creator':
        return <PlaylistCreatorTab />;
      default:
        return <VideosTab videos={videos} loading={loading} onEditVideo={handleEditVideo} />;
    }
  };

  if (error) {
    return (
      <DashboardShell>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800">Error loading videos</h3>
            <p className="mt-1 text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div 
        className="relative min-h-screen"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(148, 163, 184, 0.08) 0%,
              rgba(203, 213, 225, 0.04) 50%,
              rgba(148, 163, 184, 0.08) 100%
            )
          `,
        }}
      >
        {/* Ambient background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 35% 25%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 65% 75%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
              `,
            }}
          />
        </div>

        <div className="relative z-10 p-6">
          {notification && (
            <div className={`p-4 rounded-lg border mb-6 ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-medium">
                {notification.message}
              </p>
            </div>
          )}
          
          {/* Header */}
          <div 
            className="p-6 rounded-2xl border mb-6"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{getTabTitle()}</h1>
              <p className="text-gray-600 mt-1">Manage your video library, YouTube uploads, and content scheduling.</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div 
            className="p-6 rounded-2xl border mb-6"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('videos')}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setActiveTab('youtube-library')}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeTab === 'youtube-library'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                YouTube Library
              </button>
              <button
                onClick={() => setActiveTab('youtube-scheduler')}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeTab === 'youtube-scheduler'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                YouTube Scheduler
              </button>
              <button
                onClick={() => setActiveTab('youtube-uploader')}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeTab === 'youtube-uploader'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                YouTube Uploader
              </button>
              <button
                onClick={() => setActiveTab('youtube-playlists')}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeTab === 'youtube-playlists'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                YouTube Playlists
              </button>
              <button
                onClick={() => setActiveTab('playlist-creator')}
                className={`text-sm font-medium pb-2 whitespace-nowrap ${
                  activeTab === 'playlist-creator'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Playlist Creator
              </button>
            </nav>
          </div>

          {/* Content */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            {renderTabContent()}
            
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
      </div>
    </DashboardShell>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <DashboardShell>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardShell>
    }>
      <VideosPageContent />
    </Suspense>
  );
} 