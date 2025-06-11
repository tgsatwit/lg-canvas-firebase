"use client";

import { useState } from 'react';
import { DashboardShell } from '@/components/dashboard/shell';
import { PlaylistTable } from '@/components/ui/playlist/playlist-table';
import { 
  PlaylistEditorModal, 
  Dialog, 
  DialogTrigger, 
  DialogContent 
} from '@/components/ui/playlist/playlist-modal';
import * as DialogPrimitive from '@radix-ui/react-dialog';

type Playlist = {
  id: string;
  title: string;
  description: string;
  videoCount: number;
  visibility: "Public" | "Private" | "Unlisted";
  creationDate: string;
  status: "Published" | "Draft" | "Scheduled";
  scheduledDate?: string;
};

export default function PlaylistsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  
  const handleEditPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setIsModalOpen(true);
  };

  const handleCreatePlaylist = () => {
    setSelectedPlaylist(null);
    setIsModalOpen(true);
  };

  return (
    <DashboardShell>
      <div 
        className="relative min-h-screen"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(139, 92, 246, 0.1) 0%,
              rgba(20, 184, 166, 0.05) 50%,
              rgba(168, 85, 247, 0.1) 100%
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
                radial-gradient(circle at 45% 25%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 55% 75%, rgba(20, 184, 166, 0.15) 0%, transparent 50%)
              `,
            }}
          />
        </div>

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
          <PlaylistTable 
            onEditPlaylist={handleEditPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
          />
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
              <DialogPrimitive.Title 
                className="absolute w-1 h-1 overflow-hidden m-[-1px] p-0 border-0 clip"
              >
                {selectedPlaylist ? `Edit Playlist: ${selectedPlaylist.title}` : 'Create New Playlist'}
              </DialogPrimitive.Title>
              {/* Modal content is provided by the PlaylistEditorTabs component inside DialogContent */}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardShell>
  );
} 