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
      <div 
        className="relative min-h-screen"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(239, 68, 68, 0.1) 0%,
              rgba(147, 51, 234, 0.05) 50%,
              rgba(236, 72, 153, 0.1) 100%
            )
          `,
        }}
      >
        {/* Ambient background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 25% 35%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 75% 65%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)
              `,
            }}
          />
        </div>

        {notification && (
          <div 
            className={`relative z-20 mx-6 mt-6 p-6 rounded-2xl border ${
              notification.type === 'success' 
                ? 'ring-2 ring-green-200' 
                : 'ring-2 ring-red-200'
            }`}
            style={{
              background: `
                linear-gradient(135deg, 
                  ${notification.type === 'success' 
                    ? 'rgba(34, 197, 94, 0.15)' 
                    : 'rgba(239, 68, 68, 0.15)'} 0%,
                  ${notification.type === 'success' 
                    ? 'rgba(34, 197, 94, 0.05)' 
                    : 'rgba(239, 68, 68, 0.05)'} 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: `1px solid ${notification.type === 'success' 
                ? 'rgba(34, 197, 94, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'}`,
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <p className={`text-base font-medium ${
              notification.type === 'success' 
                ? 'text-green-800' 
                : 'text-red-800'
            }`}>
              {notification.message}
            </p>
          </div>
        )}
        
        <div 
          className="relative z-10 px-6 py-8 md:px-8 md:py-10 mt-6 mx-6 rounded-2xl border"
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
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-gray-900">YouTube Manager</h1>
              
              {/* YouTube Authentication Button */}
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
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 0, 0, 0.8) 0%,
                      rgba(204, 0, 0, 0.9) 100%
                    )
                  `,
                  boxShadow: `
                    0 4px 16px rgba(255, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2)
                  `,
                }}
              >
                🔐 Authenticate YouTube
              </button>
            </div>
            
            {/* Status summary */}
            <div className="flex gap-6 mt-6">
              <div 
                className="p-6 rounded-2xl border flex-1"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(59, 130, 246, 0.15) 0%,
                      rgba(59, 130, 246, 0.05) 100%
                    )
                  `,
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: `
                    0 8px 24px rgba(59, 130, 246, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready for Upload</h3>
                <p className="text-3xl font-bold text-blue-900">{readyCount}</p>
              </div>
              <div 
                className="p-6 rounded-2xl border flex-1"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(147, 51, 234, 0.15) 0%,
                      rgba(147, 51, 234, 0.05) 100%
                    )
                  `,
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  boxShadow: `
                    0 8px 24px rgba(147, 51, 234, 0.1),
                    inset 0 1px 0 rgba(255, 255, 255, 0.4)
                  `,
                }}
              >
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Scheduled</h3>
                <p className="text-3xl font-bold text-purple-900">{scheduledCount}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div 
                className="h-12 w-full sm:w-[300px] rounded-xl animate-pulse"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.2) 0%,
                      rgba(255, 255, 255, 0.1) 100%
                    )
                  `,
                  backdropFilter: 'blur(8px)',
                }}
              />
              <div 
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.15) 0%,
                      rgba(255, 255, 255, 0.05) 100%
                    )
                  `,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div className="h-[400px] animate-pulse" />
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