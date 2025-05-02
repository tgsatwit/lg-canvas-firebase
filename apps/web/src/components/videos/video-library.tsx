"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { VideoTable } from './video-table';
import { VideoModal } from './video-modal';
import { getAllVideos, updateVideo, VideoItem } from '@/lib/firebase/video-service';
import { useToast } from '@/hooks/use-toast';
import { LoadingContent } from '@/components/ui/loading-content';

// Mock data for initial testing
const mockVideos: VideoItem[] = [
  {
    id: '1',
    title: 'Introduction to Product Features',
    description: 'A comprehensive overview of the key features in our latest product release.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?q=80&w=2940&auto=format&fit=crop',
    duration: 343, // 5:43
    createdAt: { toMillis: () => Date.now() - 86400000 * 7 } as any, // 7 days ago
    updatedAt: { toMillis: () => Date.now() - 86400000 * 5 } as any,
    uploadedToYoutube: true,
    youtubeUrl: 'https://youtube.com/watch?v=example1',
    vimeoId: '123456789',
    vimeoTags: ['product', 'features', 'tutorial'],
    vimeoCategories: ['Education'],
    baseStorageUrl: 'https://storage.example.com/videos/intro-product-features.mp4',
    transcript: 'Hello and welcome to this overview of our product features...'
  },
  {
    id: '2',
    title: 'Advanced User Workflows',
    description: 'Learn how to optimize your workflow using advanced techniques.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2874&auto=format&fit=crop',
    duration: 721, // 12:01
    createdAt: { toMillis: () => Date.now() - 86400000 * 3 } as any, // 3 days ago
    updatedAt: { toMillis: () => Date.now() - 86400000 * 2 } as any,
    uploadedToYoutube: false,
    scheduledUploadDate: { toMillis: () => Date.now() + 86400000 * 2 } as any, // 2 days in future
    vimeoId: '987654321',
    vimeoTags: ['advanced', 'workflow', 'productivity'],
    vimeoCategories: ['Tutorials'],
    baseStorageUrl: 'https://storage.example.com/videos/advanced-workflows.mp4'
  },
  {
    id: '3',
    title: 'Quick Tips & Tricks',
    description: 'Short video highlighting 5 lesser-known features that will boost your productivity.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?q=80&w=2870&auto=format&fit=crop',
    duration: 187, // 3:07
    createdAt: { toMillis: () => Date.now() - 86400000 } as any, // 1 day ago
    updatedAt: { toMillis: () => Date.now() - 86400000 } as any,
    uploadedToYoutube: false,
    vimeoId: '543216789',
    vimeoTags: ['tips', 'tricks', 'productivity'],
    vimeoCategories: ['How-to'],
    baseStorageUrl: 'https://storage.example.com/videos/tips-tricks.mp4'
  }
];

// Filter mock videos for demonstration
const filterVideos = (videos: VideoItem[], filter: string) => {
  if (filter === 'all') return videos;
  if (filter === 'published') return videos.filter(v => v.uploadedToYoutube);
  if (filter === 'scheduled') return videos.filter(v => v.scheduledUploadDate && !v.uploadedToYoutube);
  return videos;
};

interface VideoLibraryProps {
  filter?: string;
}

export const VideoLibrary = forwardRef<{ fetchVideos: () => Promise<void> }, VideoLibraryProps>(
  (props, ref) => {
    const { filter = 'all' } = props;
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { toast } = useToast();
    
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // In a real implementation, this would call the actual service
        // For now, we'll use the mock data
        // const data = await getAllVideos();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        
        // Apply filter
        const filteredVideos = filterVideos(mockVideos, filter);
        setVideos(filteredVideos);
      } catch (err) {
        console.error(err);
        setError('Failed to load videos. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load videos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Expose fetchVideos method to parent component
    useImperativeHandle(ref, () => ({
      fetchVideos
    }));
    
    useEffect(() => {
      fetchVideos();
    }, [filter]);
    
    const handleSelectVideo = (video: VideoItem) => {
      setSelectedVideo(video);
      setIsModalOpen(true);
    };
    
    const handleUpdateVideo = async (updatedVideo: VideoItem) => {
      try {
        // In a real implementation, this would call the actual service
        // await updateVideo(updatedVideo.id, updatedVideo);
        
        // For now, we'll just update the local state
        setVideos(videos.map(v => v.id === updatedVideo.id ? updatedVideo : v));
        
        toast({
          title: "Success",
          description: "Video updated successfully",
        });
        
        setIsModalOpen(false);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to update video",
          variant: "destructive",
        });
      }
    };
    
    return (
      <div>
        <LoadingContent loading={isLoading} error={error}>
          <VideoTable
            videos={videos}
            isLoading={isLoading}
            onSelect={handleSelectVideo}
          />
        </LoadingContent>
        
        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUpdate={handleUpdateVideo}
          />
        )}
      </div>
    );
  }
);

VideoLibrary.displayName = 'VideoLibrary'; 