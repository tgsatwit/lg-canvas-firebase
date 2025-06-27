"use client";

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/dashboard/shell';
import { YouTubeManagerTable } from '@/components/ui/youtube/youtube-manager-table';
import { VideoEditorModal } from '@/components/ui/youtube/youtube-modal';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useVideos } from '@/hooks/use-videos';

// Import the Video type from useVideos to ensure consistency
import type { Video } from '@/hooks/use-videos';

export default function YouTubeManagerPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { videos, loading, error } = useVideos();

  // Filter videos for YouTube management (ready for youtube and scheduled for youtube)
  const youtubeVideos = videos.filter(video => {
    const status = (video.youtubeStatus || '').toLowerCase();
    return status === 'ready for youtube' || status === 'scheduled for youtube';
  });

  // Count videos by status
  const readyCount = youtubeVideos.filter(video => 
    (video.youtubeStatus || '').toLowerCase() === 'ready for youtube'
  ).length;
  
  const scheduledCount = youtubeVideos.filter(video => 
    (video.youtubeStatus || '').toLowerCase() === 'scheduled for youtube'
  ).length;

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

  const handleUploadNow = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/upload-firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode: false
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNotification({
          type: 'success',
          message: 'Video upload initiated successfully! Check the upload monitor for progress.'
        });
        // Redirect to upload monitor after 2 seconds
        setTimeout(() => {
          window.location.href = result.monitorUrl || '/dashboard/youtube-uploads';
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload video. Please try again.'
      });
    }
  };

  const handleScheduleUpload = async (videoId: string, uploadTime: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/schedule-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upload_time: uploadTime }),
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Video upload scheduled successfully!'
        });
        // Refresh the page to update the status
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Failed to schedule video upload');
      }
    } catch (error) {
      console.error('Error scheduling video upload:', error);
      setNotification({
        type: 'error',
        message: 'Failed to schedule video upload. Please try again.'
      });
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
      <div className="min-h-screen bg-gray-50">
        {notification && (
          <div className={`mx-6 mt-6 p-4 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="font-medium">
              {notification.message}
            </p>
          </div>
        )}
        
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">YouTube Manager</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your YouTube uploads and scheduled content
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/youtube');
                    const data = await response.json();
                    if (data.authUrl) {
                      window.location.href = data.authUrl;
                    }
                  } catch (error) {
                    console.error('Error getting auth URL:', error);
                    setNotification({
                      type: 'error',
                      message: 'Failed to initiate YouTube authentication'
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Connect YouTube
              </button>
            </div>
            
            {/* Status summary cards */}
            <div className="flex gap-6 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-1">Ready for Upload</h3>
                <p className="text-2xl font-bold text-blue-900">{readyCount}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex-1">
                <h3 className="text-sm font-medium text-purple-800 mb-1">Scheduled</h3>
                <p className="text-2xl font-bold text-purple-900">{scheduledCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
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
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg">
              <YouTubeManagerTable 
                videos={youtubeVideos}
                isLoading={loading}
                onEditVideo={handleEditVideo}
                onUploadNow={handleUploadNow}
                onScheduleUpload={handleScheduleUpload}
              />
            </div>
          )}
          
          <VideoEditorModal 
            open={isModalOpen} 
            onOpenChange={setIsModalOpen}
            videoData={selectedVideo}
          >
            <DialogPrimitive.Title 
              className="absolute w-1 h-1 overflow-hidden m-[-1px] p-0 border-0 clip"
            >
              {selectedVideo ? `Edit Video: ${selectedVideo.title}` : 'Edit Video'}
            </DialogPrimitive.Title>
          </VideoEditorModal>
        </div>
      </div>
    </DashboardShell>
  );
} 