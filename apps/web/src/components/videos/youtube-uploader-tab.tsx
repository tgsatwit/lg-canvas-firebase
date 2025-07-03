"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { YouTubeTable } from '@/components/ui/youtube/youtube-table';
import { GripVertical, Search, Filter, SortAsc, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Define the Video type to match the one in use-videos.ts
type Video = {
  id: string;
  title: string;
  thumbnail: string;
  visibility: "Public" | "Private" | "Unlisted" | "public" | "private" | "unlisted" | "-";
  uploadDate: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  status: "Published" | "Draft" | "Processing";
  
  // Vimeo metadata
  vimeoId?: string;
  vimeoOttId?: string;
  
  // File details
  fileType?: string;
  fileSize?: string;
  
  // Download info
  downloadUrl?: string;
  downloadInfo?: any;
  
  // Links
  link?: string;
  gcpLink?: string;
  
  // Descriptions
  description?: string;
  vimeoDescription?: string;
  
  // Thumbnails
  thumbnails?: Array<{
    uri?: string;
    height?: number;
    width?: number;
  }>;
  
  // Tags
  tags?: string[];
  
  // Created dates
  createdAt?: string;
  
  // Video metadata
  videoMetadata?: {
    created_time?: string;
    description?: string;
    duration?: number;
  } | null;
  
  // Vimeo OTT metadata
  vimeoOttMetadata?: {
    created_at?: string;
    description?: string;
    duration?: number;
    files_href?: string;
    id?: string;
    link?: string;
  } | null;
  
  // Raw data for debugging
  rawData?: any;
  
  // Legacy YouTube fields (kept for backward compatibility)
  youtubeDescription?: string;
  youtubeUploaded?: boolean;
  youtubeUrl?: string;
  youtubeLink?: string;
  youtubeUploadDate?: string;
  youtubeStatus?: string;
  scheduledUploadDate?: string;
  vimeoTags?: string[];
  vimeoCategories?: string[];
  storageUrl?: string;
  
  // YouTube metadata fields
  yt_title?: string;
  yt_description?: string;
  yt_tags?: string[];
  yt_privacyStatus?: string;
  details_confirmed?: string;
  
  // Upload order for drag and drop
  uploadOrder?: number;
};

// Upload progress interface
interface UploadProgress {
  videoId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  message?: string;
}

interface YouTubeUploaderTabProps {
  videos?: Video[];
  loading?: boolean;
  onEditVideo?: (video: Video) => void;
}

// Custom draggable table component
interface DraggableTableProps {
  videos: Video[];
  onEditVideo?: (video: Video) => void;
  renderCustomActions: (video: Video) => React.ReactNode;
  onReorder: (videos: Video[]) => void;
}

function DraggableVideoTable({ videos, onEditVideo, renderCustomActions, onReorder }: DraggableTableProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update upload order
    const reorderedVideos = items.map((video, index) => ({
      ...video,
      uploadOrder: index
    }));
    
    onReorder(reorderedVideos);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="videos">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''} p-2 rounded-lg transition-colors`}
          >
            {videos.map((video, index) => (
              <Draggable key={video.id} draggableId={video.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all ${
                      snapshot.isDragging ? 'shadow-lg scale-105 rotate-1' : 'shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Drag handle */}
                      <div 
                        {...provided.dragHandleProps}
                        className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Order number */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      {/* Video thumbnail */}
                      <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                        />
                        {video.duration && (
                          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
                            {video.duration}
                          </div>
                        )}
                      </div>
                      
                      {/* Video info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {video.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {video.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {video.youtubeStatus || 'Ready for YouTube'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {video.visibility || 'Private'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {onEditVideo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditVideo(video)}
                            className="h-8 px-2"
                          >
                            Edit
                          </Button>
                        )}
                        {renderCustomActions(video)}
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export function YouTubeUploaderTab({ videos = [], loading = false, onEditVideo }: YouTubeUploaderTabProps) {
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDragView, setShowDragView] = useState(false);
  const [orderedVideos, setOrderedVideos] = useState<Video[]>([]);

  // Storage key for persisting upload order
  const ORDER_STORAGE_KEY = 'youtube-upload-order';

  // Filter videos to show only those with "ready for YouTube" status
  const readyForYouTubeVideos = useMemo(() => {
    return videos.filter(video => 
      video.youtubeStatus?.toLowerCase() === 'ready for youtube'
    );
  }, [videos]);

  // Initialize ordered videos from localStorage or default order
  useEffect(() => {
    const savedOrder = localStorage.getItem(ORDER_STORAGE_KEY);
    if (savedOrder) {
      try {
        const orderMap = JSON.parse(savedOrder) as Record<string, number>;
        const videosWithOrder = readyForYouTubeVideos.map(video => ({
          ...video,
          uploadOrder: orderMap[video.id] ?? 999
        }));
        
        // Sort by upload order
        videosWithOrder.sort((a, b) => (a.uploadOrder || 999) - (b.uploadOrder || 999));
        setOrderedVideos(videosWithOrder);
      } catch (error) {
        console.error('Error loading upload order:', error);
        setOrderedVideos(readyForYouTubeVideos);
      }
    } else {
      // Default order with uploadOrder property
      const defaultOrderedVideos = readyForYouTubeVideos.map((video, index) => ({
        ...video,
        uploadOrder: index
      }));
      setOrderedVideos(defaultOrderedVideos);
    }
  }, [readyForYouTubeVideos]);

  // Save order to localStorage
  const saveOrder = useCallback((videos: Video[]) => {
    const orderMap: Record<string, number> = {};
    videos.forEach((video, index) => {
      orderMap[video.id] = index;
    });
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderMap));
  }, []);

  // Handle reordering
  const handleReorder = useCallback((newOrderedVideos: Video[]) => {
    setOrderedVideos(newOrderedVideos);
    saveOrder(newOrderedVideos);
  }, [saveOrder]);

  // Reset to default order
  const handleResetOrder = useCallback(() => {
    const defaultOrderedVideos = readyForYouTubeVideos.map((video, index) => ({
      ...video,
      uploadOrder: index
    }));
    setOrderedVideos(defaultOrderedVideos);
    localStorage.removeItem(ORDER_STORAGE_KEY);
  }, [readyForYouTubeVideos]);

  // Filter videos based on search term
  const filteredVideos = useMemo(() => {
    if (!searchTerm) return orderedVideos;
    
    return orderedVideos.filter(video =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.youtubeStatus?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orderedVideos, searchTerm]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUploadVideo = useCallback(async (video: Video) => {
    try {
      // Initialize progress tracking
      setUploadProgress(prev => new Map(prev.set(video.id, {
        videoId: video.id,
        progress: 0,
        status: 'uploading',
        message: 'Starting upload...'
      })));

      const response = await fetch(`/api/videos/${video.id}/upload-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Upload successful
        setUploadProgress(prev => new Map(prev.set(video.id, {
          videoId: video.id,
          progress: 100,
          status: 'completed',
          message: 'Upload completed successfully!'
        })));

        setNotification({
          type: 'success',
          message: `${video.title} uploaded to YouTube successfully!`
        });

        // Reload the page after a short delay to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } else if (response.status === 401 && result.authUrl) {
        // Authentication required
        setUploadProgress(prev => {
          const newMap = new Map(prev);
          newMap.delete(video.id);
          return newMap;
        });

        setNotification({
          type: 'error',
          message: 'YouTube authentication required. Redirecting...'
        });

        // Redirect to YouTube authentication
        setTimeout(() => {
          window.location.href = result.authUrl;
        }, 1000);

      } else {
        // Upload failed
        setUploadProgress(prev => new Map(prev.set(video.id, {
          videoId: video.id,
          progress: 0,
          status: 'failed',
          message: result.error || 'Upload failed'
        })));

        setNotification({
          type: 'error',
          message: result.error || 'Failed to upload video to YouTube'
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadProgress(prev => new Map(prev.set(video.id, {
        videoId: video.id,
        progress: 0,
        status: 'failed',
        message: 'Network error during upload'
      })));

      setNotification({
        type: 'error',
        message: 'Network error: Failed to upload video'
      });
    }
  }, []);

  const renderCustomActions = useCallback((video: Video) => {
    const progress = uploadProgress.get(video.id);
    
    if (progress?.status === 'uploading') {
      return (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Uploading...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          {progress.message && (
            <span className="text-xs text-gray-600">{progress.message}</span>
          )}
        </div>
      );
    }

    if (progress?.status === 'completed') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-4 h-4">✓</div>
          <span className="text-sm">Uploaded</span>
        </div>
      );
    }

    if (progress?.status === 'failed') {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-4 h-4">✗</div>
            <span className="text-sm">Failed</span>
          </div>
          <button
            onClick={() => handleUploadVideo(video)}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      );
    }

    // Default state - show upload button
    return (
      <button
        onClick={() => handleUploadVideo(video)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        Upload
      </button>
    );
  }, [uploadProgress, handleUploadVideo]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="font-medium">
            {notification.message}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">        
        {readyForYouTubeVideos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos ready for upload</h3>
            <p className="text-gray-600 mb-4">Videos will appear here once they have been prepared for YouTube upload.</p>
            <p className="text-sm text-gray-500">To prepare a video, edit it from the Videos tab and confirm the YouTube details.</p>
          </div>
                ) : (
          <div className="p-6">
            {showDragView ? (
               <div className="space-y-4">
                 {/* Drag view header with search and controls */}
                 <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                   <div className="flex flex-col md:flex-row gap-4">
                     {/* Search Input - takes available space */}
                     <div className="flex-1">
                       <div className="relative">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                         <Input
                           placeholder="Search videos..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-10 h-9 border-gray-200 dark:border-gray-800"
                         />
                       </div>
                     </div>

                     {/* Controls */}
                     <div className="flex gap-2 items-center">
                       <Badge variant="outline" className="text-xs">
                         {filteredVideos.length} videos
                       </Badge>
                       
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={handleResetOrder}
                         className="flex items-center gap-2 h-9 border-gray-200 dark:border-gray-800"
                       >
                         <RotateCcw className="h-4 w-4" />
                         Reset Order
                       </Button>

                       {/* Table View Button - Black */}
                       <Button
                         size="sm"
                         onClick={() => setShowDragView(!showDragView)}
                         className="flex items-center gap-2 h-9 bg-black hover:bg-gray-800 text-white"
                       >
                         <SortAsc className="h-4 w-4" />
                         Table View
                       </Button>
                     </div>
                   </div>
                   
                   <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                     <p className="text-sm text-gray-600">
                       Drag videos to reorder them. The order will be saved automatically.
                     </p>
                   </div>
                 </div>
                 
                 {filteredVideos.length > 0 ? (
                   <DraggableVideoTable
                     videos={filteredVideos}
                     onEditVideo={onEditVideo}
                     renderCustomActions={renderCustomActions}
                     onReorder={handleReorder}
                   />
                 ) : (
                   <div className="text-center py-8">
                     <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                     <p className="text-gray-500">No videos found matching your search.</p>
                   </div>
                 )}
               </div>
             ) : (
               <div className="space-y-4">
                 {/* Custom search and filter bar with reorder button */}
                 <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                   <div className="flex flex-col md:flex-row gap-4">
                     {/* Search Input - takes available space */}
                     <div className="flex-1">
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <Filter className="h-4 w-4 text-gray-400" />
                         </div>
                         <Input
                           placeholder="Search videos by title..."
                           className="pl-10 h-9 border-gray-200 dark:border-gray-800"
                         />
                       </div>
                     </div>

                     {/* Filters and Reorder Button */}
                     <div className="flex gap-2 items-center">
                       {/* Status Filter Placeholder */}
                       <Button variant="outline" size="sm" className="h-9 border-gray-200 dark:border-gray-800">
                         <Filter className="h-4 w-4 mr-2" />
                         Status
                       </Button>
                       
                       {/* Visibility Filter Placeholder */}
                       <Button variant="outline" size="sm" className="h-9 border-gray-200 dark:border-gray-800">
                         <Filter className="h-4 w-4 mr-2" />
                         Visibility
                       </Button>
                       
                       {/* YouTube Filter Placeholder */}
                       <Button variant="outline" size="sm" className="h-9 border-gray-200 dark:border-gray-800">
                         <Filter className="h-4 w-4 mr-2" />
                         YouTube
                       </Button>

                       {/* Reorder View Button - Black */}
                       <Button
                         size="sm"
                         onClick={() => setShowDragView(!showDragView)}
                         className="flex items-center gap-2 h-9 bg-black hover:bg-gray-800 text-white"
                       >
                         <SortAsc className="h-4 w-4" />
                         Reorder View
                       </Button>
                     </div>
                   </div>
                 </div>
                 
                 <YouTubeTable 
                   videos={orderedVideos}
                   isLoading={loading}
                   onEditVideo={onEditVideo}
                   customActions={renderCustomActions}
                   showSearchAndFilters={false}
                 />
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
} 