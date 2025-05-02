"use client";

import { useState, useRef } from 'react';
import { DashboardShell } from '@/components/dashboard/shell';
import { cn } from '@/lib/utils';
import { YouTubeTable } from '@/components/ui/youtube/youtube-table';
import { 
  VideoEditorModal, 
  Dialog, 
  DialogTrigger, 
  DialogContent 
} from '@/components/ui/youtube/youtube-modal';
import * as DialogPrimitive from '@radix-ui/react-dialog';

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
};

export default function VideosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  const handleEditVideo = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCreateVideo = () => {
    setSelectedVideo(null);
    setIsModalOpen(true);
  };

  return (
    <DashboardShell>
      <div className="relative min-h-screen">
        <div className="relative px-4 py-6 md:px-6 md:py-8">
          <YouTubeTable 
            onEditVideo={handleEditVideo}
            onCreateVideo={handleCreateVideo}
          />
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogPrimitive.Title 
                className="absolute w-1 h-1 overflow-hidden m-[-1px] p-0 border-0 clip"
              >
                {selectedVideo ? `Edit Video: ${selectedVideo.title}` : 'Create New Video'}
              </DialogPrimitive.Title>
              {/* Modal content is provided by the VideoEditorTabs component inside DialogContent */}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardShell>
  );
} 