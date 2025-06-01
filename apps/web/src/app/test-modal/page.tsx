"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideoEditorModal } from '@/components/ui/youtube/youtube-modal';

export default function TestModalPage() {
  const [isOpen, setIsOpen] = useState(false);

  // Sample data that matches the format from the example
  const sampleVideo = {
    name: "Detachment Meditation",
    vimeoId: "1066283908",
    vimeoOttId: "1837377",
    gcpLink: "gs://face-by-lisa.firebasestorage.app/raw/1066283908_detachment_meditation.mp4",
    videoMetadata: {
      link: "https://vimeo.com/1066283908",
      description: null,
      duration: 301,
      thumbnail: "https://i.vimeocdn.com/video/1993967318-73e841afa8a686134d4a449c725889989929440ae8fabc555377a54cc737...",
      id: "1066283908",
      thumbnails: [],
      createdTime: "2025-03-16T09:22:27+00:00",
      downloadLinks: [],
      name: "Detachment Meditation"
    },
    vimeoOttMetadata: {
      createdAt: "2021-10-30T07:34:10Z",
      description: "This meditation is all about detachment and living happily in the moment, without relying on any results or perceived success. Having goals and clear intentions gives us purpose and motivation in life, however, our happiness is not dependent on reaching that goal. This meditation is designed to help you learn to be happy, fulfilled and free as you enjoy the process, regardless of the outcome.",
      tags: ["Detachment Meditation", "Meditation", "Detachment", "Retreat", "mindfulness", "relax", "anxiety", "breathe", "meditation"],
      thumbnail: {
        height: 720,
        url: "https://vhx.imgix.net/pbltest/assets/c8dcc89c-bb18-4cf7-9380-7158fa27f5f2?auto=format%2Ccompress&fit=crop&h=720&w=1280",
        width: 1280
      },
      id: "1837377",
      duration: 301,
      link: "https://online.pilatesbylisa.com.au/videos/detachment-meditation",
      filesHref: "https://api.vhx.tv/videos/1837377/files",
      title: "Detachment Meditation"
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Video Editor Modal Test</h1>
      
      <Button onClick={() => setIsOpen(true)}>
        Open Video Modal
      </Button>
      
      <VideoEditorModal
        open={isOpen}
        onOpenChange={setIsOpen}
        videoData={sampleVideo}
      />
    </div>
  );
} 