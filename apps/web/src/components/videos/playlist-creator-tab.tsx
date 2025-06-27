"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Plus, 
  GripVertical
} from 'lucide-react';

export function PlaylistCreatorTab() {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const mockVideos = [
    { id: '1', title: 'Morning Warm-up Routine', duration: '8:32', thumbnail: '/placeholder.jpg' },
    { id: '2', title: 'Full Body HIIT Workout', duration: '15:45', thumbnail: '/placeholder.jpg' },
    { id: '3', title: 'Core Strength Training', duration: '12:18', thumbnail: '/placeholder.jpg' },
    { id: '4', title: 'Yoga Flow for Beginners', duration: '20:30', thumbnail: '/placeholder.jpg' },
  ];

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectedVideoDetails = selectedVideos.map(id => 
    mockVideos.find(video => video.id === id)
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Playlist Details</CardTitle>
            <CardDescription>Configure your new playlist settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-title">Playlist Title</Label>
              <Input 
                id="playlist-title" 
                placeholder="Enter playlist title..."
                defaultValue="My Workout Collection"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description</Label>
              <Textarea 
                id="playlist-description" 
                placeholder="Describe your playlist..."
                rows={3}
                defaultValue="A comprehensive collection of workout videos for all fitness levels."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy Setting</Label>
              <Select defaultValue="public">
                <SelectTrigger>
                  <SelectValue placeholder="Select privacy setting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Playlist 
              <Badge variant="secondary">{selectedVideos.length} videos</Badge>
            </CardTitle>
            <CardDescription>Videos selected for this playlist</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedVideoDetails.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No videos selected yet</p>
                <p className="text-sm">Choose videos from the library to add them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedVideoDetails.map((video, index) => (
                  <div key={video!.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                      <Play className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{video!.title}</p>
                      <p className="text-xs text-gray-500">{video!.duration}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <Button variant="outline">
          Preview Playlist
        </Button>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Publish Playlist
        </Button>
      </div>
    </div>
  );
} 