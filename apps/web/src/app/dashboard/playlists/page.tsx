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
      <div className="relative min-h-screen bg-background">
        <div className="px-6 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Playlists</h1>
              <p className="text-muted-foreground mt-2">
                Organize your videos into collections
              </p>
            </div>
            
            <div className="apple-card p-0 overflow-hidden">
              <PlaylistTable 
                onEditPlaylist={handleEditPlaylist}
                onCreatePlaylist={handleCreatePlaylist}
              />
            </div>
          </div>
          
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