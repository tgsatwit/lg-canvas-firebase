"use client";

import { useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VideoItem } from '@/lib/firebase/video-service';
import { formatDuration } from '@/lib/utils';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export function VideoTable({ 
  videos, 
  isLoading, 
  onSelect 
}: { 
  videos: VideoItem[], 
  isLoading: boolean,
  onSelect: (video: VideoItem) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof VideoItem>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filtering and sorting logic
  const filteredVideos = videos
    .filter(video => 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      if (sortDirection === 'asc') {
        return String(aValue).localeCompare(String(bValue));
      } else {
        return String(bValue).localeCompare(String(aValue));
      }
    });
  
  const handleSort = (field: keyof VideoItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>Manage and optimize your video content</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Title</span>
                  {sortField === 'title' && (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Duration</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-primary"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {sortField === 'createdAt' && (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>YouTube Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.map((video) => (
              <TableRow 
                key={video.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelect(video)}
              >
                <TableCell>
                  <div className="h-16 w-28 relative overflow-hidden rounded-md">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="h-full w-full object-cover" 
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{video.title}</TableCell>
                <TableCell>{formatDuration(video.duration)}</TableCell>
                <TableCell>{new Date(video.createdAt.toMillis()).toLocaleDateString()}</TableCell>
                <TableCell>
                  {video.uploadedToYoutube ? (
                    <span className="text-green-600">Uploaded</span>
                  ) : video.scheduledUploadDate ? (
                    <span className="text-amber-600">Scheduled</span>
                  ) : (
                    <span className="text-gray-400">Not uploaded</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredVideos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No videos found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 