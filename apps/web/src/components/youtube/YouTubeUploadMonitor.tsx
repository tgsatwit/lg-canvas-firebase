'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, Square, AlertTriangle, CheckCircle, Upload, Eye, Trash2, 
  Search, Calendar, Play, Edit, X, Check, Clock 
} from 'lucide-react';
import { firestore as getFirestore } from '@/lib/firebase/client';
import { 
  collection, query, orderBy, limit, onSnapshot, where, Timestamp, 
  doc, updateDoc, deleteDoc, getDocs 
} from 'firebase/firestore';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UploadData {
  uploadId: string;
  videoId: string;
  status: 'initializing' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
  currentChunk?: number;
  totalChunks?: number;
  uploadSpeed?: number;
  estimatedTimeRemaining?: number;
  error?: string;
  youtubeUrl?: string;
  gcsUrl: string;
  videoTitle: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  testMode?: boolean;
}

interface VideoData {
  id: string;
  title: string;
  yt_title?: string;
  upload_scheduled?: string;
  scheduled_date?: string;
  youtube_status?: string;
  youtubeLink?: string;
  gcpLink?: string;
  gcp_link?: string;
}

export default function YouTubeUploadMonitor() {
  const [uploads, setUploads] = useState<UploadData[]>([]);
  const [scheduledVideos, setScheduledVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [newScheduledDate, setNewScheduledDate] = useState<Date | null>(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch upload records
  useEffect(() => {
    let timeLimit = new Date();
    switch (selectedTimeFilter) {
      case '24h':
        timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        timeLimit = new Date(0); // Beginning of time
        break;
    }
    
    const firestore = getFirestore();
    if (!firestore) {
      setError('Firebase Firestore is not initialized');
      setIsLoading(false);
      return;
    }
    
    const q = query(
      collection(firestore, 'youtube_uploads'),
      where('createdAt', '>', timeLimit),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const uploadsData: UploadData[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as UploadData;
          uploadsData.push({
            ...data,
            uploadId: doc.id,
          });
        });
        
        setUploads(uploadsData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error listening to uploads:', error);
        setError('Failed to load uploads');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedTimeFilter]);

  // Fetch scheduled videos
  useEffect(() => {
    const fetchScheduledVideos = async () => {
      try {
        const collectionName = process.env.NEXT_PUBLIC_FIREBASE_VIDEOS_COLLECTION || 'videos-master';
        const q = query(
          collection(getFirestore(), collectionName),
          where('upload_scheduled', '==', 'Yes'),
          orderBy('scheduled_date', 'asc')
        );
        
        const snapshot = await getDocs(q);
        const videos: VideoData[] = [];
        
        snapshot.forEach((doc) => {
          videos.push({
            id: doc.id,
            ...doc.data()
          } as VideoData);
        });
        
        setScheduledVideos(videos);
      } catch (error) {
        console.error('Error fetching scheduled videos:', error);
      }
    };

    fetchScheduledVideos();
    
    // Refresh scheduled videos every 30 seconds
    const interval = setInterval(fetchScheduledVideos, 30000);
    return () => clearInterval(interval);
  }, []);

  const cancelUpload = async (uploadId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/face-by-lisa/us-central1';
      
      const response = await fetch(`${functionsUrl}/api/youtube/cancel/${uploadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Upload Cancelled",
          description: `Upload ${uploadId} has been cancelled`,
        });
      } else {
        throw new Error(result.error || 'Failed to cancel upload');
      }
    } catch (err: any) {
      console.error('Cancel upload error:', err);
      toast({
        title: "Error",
        description: `Failed to cancel upload: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteFailedUpload = async (uploadId: string, videoId?: string) => {
    try {
      // Delete from youtube_uploads collection
      await deleteDoc(doc(getFirestore(), 'youtube_uploads', uploadId));
      
      // Update video status if videoId exists
      if (videoId) {
        const collectionName = process.env.NEXT_PUBLIC_FIREBASE_VIDEOS_COLLECTION || 'videos-master';
        await updateDoc(doc(getFirestore(), collectionName, videoId), {
          youtube_status: 'Not uploaded',
          upload_error: null,
          updated_at: new Date().toISOString()
        });
      }
      
      toast({
        title: "Upload Deleted",
        description: "Failed upload record has been deleted",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to delete upload: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const updateScheduledDate = async (videoId: string, newDate: Date | null) => {
    try {
      const collectionName = process.env.NEXT_PUBLIC_FIREBASE_VIDEOS_COLLECTION || 'videos-master';
      
      if (newDate) {
        // Update scheduled date
        await updateDoc(doc(getFirestore(), collectionName, videoId), {
          scheduled_date: newDate.toISOString(),
          upload_scheduled: 'Yes',
          updated_at: new Date().toISOString()
        });
        
        toast({
          title: "Schedule Updated",
          description: `Video scheduled for ${format(newDate, 'PPpp')}`,
        });
      } else {
        // Remove scheduling
        await updateDoc(doc(getFirestore(), collectionName, videoId), {
          scheduled_date: null,
          upload_scheduled: null,
          updated_at: new Date().toISOString()
        });
        
        toast({
          title: "Schedule Removed",
          description: "Video scheduling has been removed",
        });
      }
      
      setEditingSchedule(null);
      setNewScheduledDate(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to update schedule: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const initiateUploadNow = async (video: VideoData) => {
    try {
      const response = await fetch(`/api/videos/${video.id}/upload-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testMode: false }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove from scheduled
        const collectionName = process.env.NEXT_PUBLIC_FIREBASE_VIDEOS_COLLECTION || 'videos-master';
        await updateDoc(doc(getFirestore(), collectionName, video.id), {
          upload_scheduled: null,
          scheduled_date: null,
          updated_at: new Date().toISOString()
        });
        
        toast({
          title: "Upload Started",
          description: `Upload initiated for "${video.yt_title || video.title}"`,
        });
        
        // Remove from scheduled list
        setScheduledVideos(prev => prev.filter(v => v.id !== video.id));
      } else {
        throw new Error(result.error || 'Failed to initiate upload');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to initiate upload: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === Infinity) return 'Calculating...';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString();
  };

  // Filter uploads based on status and search
  const filteredUploads = uploads.filter((upload) => {
    // Filter by status
    if (filter === 'active' && !['initializing', 'uploading'].includes(upload.status)) return false;
    if (filter === 'completed' && upload.status !== 'completed') return false;
    if (filter === 'failed' && !['failed', 'cancelled'].includes(upload.status)) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        upload.videoTitle.toLowerCase().includes(query) ||
        upload.uploadId.toLowerCase().includes(query) ||
        upload.videoId?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Filter scheduled videos by search
  const filteredScheduledVideos = scheduledVideos.filter((video) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (video.yt_title || video.title || '').toLowerCase().includes(query) ||
        video.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeCount = uploads.filter(u => ['initializing', 'uploading'].includes(u.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">YouTube Upload Monitor</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{uploads.length} Total</Badge>
          <Badge variant={activeCount > 0 ? "default" : "secondary"}>
            {activeCount} Active
          </Badge>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {scheduledVideos.length} Scheduled
          </Badge>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title, upload ID, or video ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTimeFilter} onValueChange={(value: any) => setSelectedTimeFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({uploads.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('completed')}
              >
                Completed ({uploads.filter(u => u.status === 'completed').length})
              </Button>
              <Button
                variant={filter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('failed')}
              >
                Failed ({uploads.filter(u => ['failed', 'cancelled'].includes(u.status)).length})
              </Button>
              <Button
                variant={filter === 'scheduled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('scheduled')}
              >
                <Clock className="h-3 w-3 mr-1" />
                Scheduled ({scheduledVideos.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : filter === 'scheduled' ? (
            // Show scheduled videos
            filteredScheduledVideos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No scheduled videos found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredScheduledVideos.map((video) => (
                  <div key={video.id} className="p-4 border rounded-lg space-y-3 bg-blue-50 border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{video.yt_title || video.title}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          Video ID: {video.id}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled for: {video.scheduled_date ? format(new Date(video.scheduled_date), 'PPpp') : 'Not set'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => initiateUploadNow(video)}
                          variant="default"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Upload Now</span>
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingSchedule(video.id);
                            setNewScheduledDate(video.scheduled_date ? new Date(video.scheduled_date) : null);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Show upload records
            filteredUploads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No uploads found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUploads.map((upload) => (
                  <div key={upload.uploadId} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{upload.videoTitle}</h4>
                          {upload.testMode && (
                            <Badge variant="outline" className="text-xs">Test Mode</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Upload ID: {upload.uploadId}
                        </div>
                        {upload.videoId && (
                          <div className="text-sm text-gray-600">
                            Video ID: {upload.videoId}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          Started: {formatDate(upload.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          upload.status === 'completed' ? 'default' :
                          upload.status === 'failed' ? 'destructive' :
                          upload.status === 'cancelled' ? 'secondary' :
                          'outline'
                        }>
                          {upload.status}
                        </Badge>
                        {['initializing', 'uploading'].includes(upload.status) && (
                          <Button
                            onClick={() => cancelUpload(upload.uploadId)}
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                        {['failed', 'cancelled'].includes(upload.status) && (
                          <Button
                            onClick={() => deleteFailedUpload(upload.uploadId, upload.videoId)}
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {upload.status === 'uploading' && (
                      <>
                        <Progress value={upload.progress} className="w-full" />
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Progress:</span>
                            <span className="ml-1 font-medium">{upload.progress}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Uploaded:</span>
                            <span className="ml-1 font-medium">
                              {formatBytes(upload.bytesUploaded)} / {formatBytes(upload.totalBytes)}
                            </span>
                          </div>
                          {upload.currentChunk && upload.totalChunks && (
                            <div>
                              <span className="text-gray-600">Chunk:</span>
                              <span className="ml-1 font-medium">
                                {upload.currentChunk} / {upload.totalChunks}
                              </span>
                            </div>
                          )}
                          {upload.uploadSpeed && (
                            <div>
                              <span className="text-gray-600">Speed:</span>
                              <span className="ml-1 font-medium">
                                {formatBytes(upload.uploadSpeed)}/s
                              </span>
                            </div>
                          )}
                          {upload.estimatedTimeRemaining && (
                            <div className="col-span-2">
                              <span className="text-gray-600">ETA:</span>
                              <span className="ml-1 font-medium">
                                {formatTime(upload.estimatedTimeRemaining)}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {upload.status === 'completed' && upload.youtubeUrl && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <a
                          href={upload.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View on YouTube</span>
                        </a>
                      </div>
                    )}

                    {upload.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <span className="font-medium">Error:</span> {upload.error}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Last updated: {formatDate(upload.lastUpdated)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Schedule Edit Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Upload Schedule</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this video upload, or remove scheduling entirely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <DateTimePicker
              date={newScheduledDate}
              setDate={setNewScheduledDate}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (editingSchedule) {
                  updateScheduledDate(editingSchedule, null);
                }
              }}
            >
              Remove Schedule
            </Button>
            <Button
              onClick={() => {
                if (editingSchedule && newScheduledDate) {
                  updateScheduledDate(editingSchedule, newScheduledDate);
                }
              }}
              disabled={!newScheduledDate}
            >
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 