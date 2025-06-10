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
      const response = await fetch(`/api/videos/${videoId}/upload-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotification({
          type: 'success',
          message: 'Video upload initiated successfully!'
        });
        // Refresh the page to update the status
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setNotification({
        type: 'error',
        message: 'Failed to upload video. Please try again.'
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">YouTube Manager</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage videos ready for upload and scheduled uploads
            </p>
            
            {/* Status summary */}
            <div className="flex gap-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Ready for Upload</h3>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{readyCount}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300">Scheduled</h3>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{scheduledCount}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-full sm:w-[300px] bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="h-[400px] bg-gray-100 dark:bg-gray-900 animate-pulse" />
              </div>
            </div>
          ) : (
            <YouTubeManagerTable 
              videos={youtubeVideos}
              isLoading={loading}
              onEditVideo={handleEditVideo}
              onUploadNow={handleUploadNow}
              onScheduleUpload={handleScheduleUpload}
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
              {selectedVideo ? `Edit Video: ${selectedVideo.title}` : 'Edit Video'}
            </DialogPrimitive.Title>
          </VideoEditorModal>
        </div>
      </div>
    </DashboardShell>
  );
} 