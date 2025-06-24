"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar,
  Clock,
  Upload,
  Edit,
  Play,
  ExternalLink
} from "lucide-react";

import type { Video } from '@/hooks/use-videos';

interface YouTubeManagerTableProps {
  videos: Video[];
  isLoading: boolean;
  onEditVideo: (video: Video) => void;
  onUploadNow: (videoId: string) => void;
  onScheduleUpload: (videoId: string, uploadTime: string) => void;
}

export function YouTubeManagerTable({
  videos,
  isLoading,
  onEditVideo,
  onUploadNow,
  onScheduleUpload,
}: YouTubeManagerTableProps) {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not scheduled";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusLower = (status || '').toLowerCase();
    
    if (statusLower === 'ready for youtube') {
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Ready for Upload
        </Badge>
      );
    } else if (statusLower === 'scheduled for youtube') {
      return (
        <Badge className="bg-purple-50 text-purple-700 border-purple-200">
          Scheduled
        </Badge>
      );
    } else if (statusLower === 'published on youtube') {
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200">
          Published
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {status || 'Unknown'}
        </Badge>
      );
    }
  };

  const handleScheduleClick = (videoId: string) => {
    setSelectedVideoId(videoId);
    setScheduleModalOpen(true);
    
    // Set default to tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime("09:00");
  };

  const handleScheduleSubmit = () => {
    if (selectedVideoId && scheduleDate && scheduleTime) {
      const scheduledDateTime = `${scheduleDate}T${scheduleTime}:00`;
      onScheduleUpload(selectedVideoId, scheduledDateTime);
      setScheduleModalOpen(false);
      setSelectedVideoId(null);
      setScheduleDate("");
      setScheduleTime("");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-20 h-6 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No videos ready for YouTube</h3>
        <p className="mt-1 text-sm text-gray-500">
          Videos with status "Ready for YouTube" or "Scheduled for YouTube" will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Video</TableHead>
              <TableHead>YouTube Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Privacy</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{video.title}</div>
                      <div className="text-xs text-gray-500">
                        {video.duration && `${video.duration} • `}
                        {video.createdAt && formatDate(video.createdAt)}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {video.yt_title || video.title}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(video.youtubeStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(video.upload_time)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {video.yt_privacyStatus || 'Private'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {video.youtubeStatus?.toLowerCase() === 'ready for youtube' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => onUploadNow(video.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScheduleClick(video.id)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </>
                    )}
                    
                    {video.youtubeStatus?.toLowerCase() === 'scheduled for youtube' && (
                      <Button
                        size="sm"
                        onClick={() => onUploadNow(video.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload Now
                      </Button>
                    )}
                    
                    {video.youtubeLink && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(video.youtubeLink, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditVideo(video)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Schedule Upload Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule YouTube Upload</DialogTitle>
            <DialogDescription>
              Choose when you want this video to be uploaded to YouTube.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule-date" className="text-right">
                Date
              </Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="col-span-3"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="schedule-time" className="text-right">
                Time
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit}>
              Schedule Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 