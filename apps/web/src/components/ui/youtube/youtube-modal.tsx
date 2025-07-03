'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Youtube, X, Info, FileVideo, Clock,
  Video, Copy, Check, ExternalLink, Database, 
  ImageIcon, Tag, Calendar, PlayCircle,
  Zap, Loader2, Upload, Edit
} from "lucide-react"

// Define interfaces for our metadata
interface VimeoThumbnail {
  width?: number;
  height?: number;
  url?: string;
  uri?: string;
}

interface VimeoMetadata {
  id?: string | number;
  name?: string;
  description?: string | null;
  duration?: number;
  thumbnail?: string;
  thumbnails?: any[];
  link?: string;
  created_time?: string;
  download_links?: any[];
  [key: string]: any; // Allow for additional properties
}

interface VimeoOttMetadata {
  id?: string | number;
  title?: string;
  description?: string | null;
  duration?: number;
  link?: string;
  files_href?: string;
  created_at?: string;
  tags?: string[];
  thumbnail?: VimeoThumbnail | null;
  [key: string]: any; // Allow for additional properties
}

interface VideoData {
  document_id: string;
  name: string;
  vimeoId: string;
  vimeoOttId: string;
  gcpLink: string;
  downloadLink: string;
  confirmed: boolean;
  createdAt: string;
  fileType: string;
  gcp_info_last_updated: string;
  description: string;
  videoMetadata: VimeoMetadata | null;
  vimeoOttMetadata: VimeoOttMetadata | null;
  youtubeStatus: string;
  youtubeLink: string;
  // Additional fields that are needed for fallback display
  duration?: number | string;
  thumbnail?: string;
  // New YouTube scheduling fields
  youtube_link?: string;
  upload_scheduled?: string;
  upload_time?: string;
  // New YouTube metadata fields
  yt_title?: string;
  yt_description?: string;
  yt_tags?: string[];
  yt_privacyStatus?: string;
  yt_category?: string;
  details_confirmed?: string;
}

interface VideoEditorModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
  videoData?: any
}

const VideoEditorModal = ({ open, onOpenChange, children, videoData }: VideoEditorModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      {open && (
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 flex flex-col">
            <VideoEditorTabs videoData={videoData} />
          </DialogContent>
        </DialogPortal>
      )}
    </Dialog>
  )
}

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Content
    ref={ref}
    className={cn(
      'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg bg-white shadow-lg',
      className
    )}
    {...props}
  >
    {children}
    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </DialogPrimitive.Content>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

interface TabData {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
}

// YouTube Status Card Component
interface YoutubeStatusCardProps {
  status: 'Uploaded' | 'Scheduled' | 'Confirm Details' | 'Not Scheduled';
  styles: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
  videoId: string;
  uploadTime?: string;
  youtubeLink?: string;
  ytTitle?: string;
  ytDescription?: string;
  ytTags?: string[];
  ytPrivacyStatus?: string;
}

const YoutubeStatusCard = ({ 
  status, 
  styles, 
  videoId, 
  uploadTime, 
  youtubeLink,
  ytTitle,
  ytDescription,
  ytTags,
  ytPrivacyStatus
}: YoutubeStatusCardProps) => {
  const [scheduledDateTime, setScheduledDateTime] = React.useState('');
  const [isScheduling, setIsScheduling] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);

  // Convert scheduled time to local datetime input format (GMT+10)
  React.useEffect(() => {
    if (uploadTime) {
      // Convert the stored time to local input format
      const date = new Date(uploadTime);
      const localDate = new Date(date.getTime() + (10 * 60 * 60 * 1000)); // Add 10 hours for GMT+10
      const isoString = localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
      setScheduledDateTime(isoString);
    }
  }, [uploadTime]);

  const handleScheduleUpload = async () => {
    if (!scheduledDateTime) {
      alert('Please select a date and time');
      return;
    }

    setIsScheduling(true);
    try {
      // Convert local time to UTC for storage
      const localDate = new Date(scheduledDateTime);
      const utcDate = new Date(localDate.getTime() - (10 * 60 * 60 * 1000)); // Subtract 10 hours for GMT+10
      
      const response = await fetch(`/api/videos/${videoId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upload_time: utcDate.toISOString(),
        }),
      });

      if (response.ok) {
        window.location.reload(); // Refresh to show updated status
      } else {
        throw new Error('Failed to schedule upload');
      }
    } catch (error) {
      console.error('Error scheduling upload:', error);
      alert('Failed to schedule upload. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUploadNow = async () => {
    setIsUploading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/upload-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testMode: false
        })
      });

      // Check if we got redirected to login (HTML response instead of JSON)
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('You need to be logged in to upload videos. Please log in and try again.');
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to upload monitor
        window.location.href = data.monitorUrl || '/dashboard/youtube-uploads';
      } else if (response.status === 401) {
        if (data.authUrl) {
          // YouTube authentication required
          if (confirm('YouTube authentication is required. Would you like to authenticate now?')) {
            window.location.href = data.authUrl;
          }
        } else {
          // General authentication required
          throw new Error('You need to be logged in to upload videos. Please log in and try again.');
        }
      } else {
        throw new Error(data.error || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        alert('You need to be logged in to upload videos. Please log in and try again.');
      } else {
        alert(error instanceof Error ? error.message : 'Failed to upload video. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDetails = async () => {
    // Get the current YouTube tab values
    const ytTitleElement = document.querySelector('#youtube-title') as HTMLInputElement;
    const ytDescriptionElement = document.querySelector('#youtube-description') as HTMLTextAreaElement;
    const ytPrivacyElement = document.querySelector('[data-testid="privacy-select"]') as HTMLElement;
    
    // Get tags from the current state (this will need to be passed down or managed differently)
    const currentTitle = ytTitleElement?.value || ytTitle || '';
    const currentDescription = ytDescriptionElement?.value || ytDescription || '';
    const currentPrivacy = ytPrivacyStatus || 'private';
    const currentTags = ytTags || [];

    if (!currentTitle.trim() || !currentDescription.trim()) {
      alert('Please fill in both title and description before confirming details.');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/confirm-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yt_title: currentTitle,
          yt_description: currentDescription,
          yt_tags: currentTags,
          yt_privacyStatus: currentPrivacy,
        }),
      });

      if (response.ok) {
        // Instead of reloading, wait a moment and then reload to ensure DB has updated
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('Failed to confirm details');
      }
    } catch (error) {
      console.error('Error confirming details:', error);
      alert('Failed to confirm details. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelSchedule = async () => {
    setIsScheduling(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/schedule`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload(); // Refresh to show updated status
      } else {
        throw new Error('Failed to cancel scheduled upload');
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Failed to cancel scheduled upload. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClearDetails = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/confirm-details`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload(); // Refresh to show updated status
      } else {
        throw new Error('Failed to clear details');
      }
    } catch (error) {
      console.error('Error clearing details:', error);
      alert('Failed to clear details. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className={`rounded-lg p-4 ${styles.bg} border ${styles.border}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Youtube className={`h-5 w-5 mr-2 ${styles.icon}`} />
          <h3 className={`font-medium ${styles.text}`}>YouTube</h3>
        </div>
        {status !== 'Not Scheduled' && (
          <Badge variant="outline" className={`${styles.bg} ${styles.text} ${styles.border}`}>
            {status}
          </Badge>
        )}
      </div>

      {status === 'Uploaded' && youtubeLink && (
        <div className="mt-3 space-y-2">
          <a 
            href={youtubeLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-blue-600 hover:underline inline-flex items-center"
          >
            View on YouTube
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleUploadNow}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
            Re-upload to YouTube
          </Button>
        </div>
      )}

      {status === 'Scheduled' && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            Scheduled for: {uploadTime ? new Date(uploadTime).toLocaleString('en-AU', { 
              timeZone: 'Australia/Sydney',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Unknown'}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancelSchedule}
            disabled={isScheduling}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            {isScheduling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel Schedule'}
          </Button>
        </div>
      )}

      {status === 'Confirm Details' && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete YouTube metadata in the YouTube tab, then confirm details to proceed.
          </p>
          <Button 
            size="sm" 
            onClick={handleConfirmDetails}
            disabled={isConfirming}
            className="w-full"
            variant="default"
          >
            {isConfirming ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
            Confirm Details
          </Button>
        </div>
      )}

      {status === 'Not Scheduled' && (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Ready for Upload</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ready for YouTube
              </Badge>
            </div>
            {ytTitle && (
              <div className="text-xs p-2 bg-muted rounded">
                <span className="font-medium">Title: </span>
                <span className="text-muted-foreground">{ytTitle.substring(0, 60)}{ytTitle.length > 60 ? '...' : ''}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              YouTube metadata confirmed. Video is ready to upload.
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={handleUploadNow}
            disabled={isUploading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
            Upload Now
          </Button>
        </div>
      )}
    </div>
  );
};

const VideoEditorTabs = ({ videoData }: { videoData?: any }) => {
  // Helper to pick first non-nullish value
  const pick = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null);

  // Only log basic info for debugging if needed (remove verbose logging)
  // console.log("Raw videoData (stringified):", JSON.stringify(videoData, null, 2));
  
  // Helper function to extract nested Firestore data
  const extractFirestoreData = (data: any, fieldName: string) => {
    // First try direct access
    if (data && data[fieldName]) {
      return data[fieldName];
    }
    
    // Check for nested objects with deep access
    if (data && typeof data === 'object') {
      // Try field_value access - common Firestore pattern
      if (data[`${fieldName}_field_value`]) {
        return data[`${fieldName}_field_value`];
      }
      
      // Try nested_fields access - Firestore sometimes nests complex objects
      if (data.nested_fields && data.nested_fields[fieldName]) {
        return data.nested_fields[fieldName];
      }
      
      // Handle array_contents access for array fields - Firestore sometimes puts arrays here
      if (data.array_contents && data.array_contents[fieldName]) {
        return data.array_contents[fieldName];
      }
      
      // Attempt to locate complex nested objects with . notation access
      // For example, vimeo_metadata.duration might be saved as vimeo_metadata_duration
      const nestedKeys = Object.keys(data).filter(key => key.startsWith(`${fieldName}_`));
      if (nestedKeys.length > 0) {
        const nestedObj: any = {};
        nestedKeys.forEach(key => {
          // Extract the property name after the fieldName_ prefix
          const propName = key.substring(fieldName.length + 1);
          nestedObj[propName] = data[key];
        });
        if (Object.keys(nestedObj).length > 0) {
          // console.log(`Found nested ${fieldName} data via property name matching:`, nestedObj);
          return nestedObj;
        }
      }
    }
    
    // If still not found, check field_types to see if it exists but is null
    if (data && data.field_types && data.field_types[fieldName]) {
      // console.log(`Field ${fieldName} exists in field_types but not in data`);
    }
    
    return null;
  };
  
  const data: VideoData = React.useMemo(() => {
    // Extract metadata from possible naming variants with minimal logging
    // console.log("VideoData structure keys:", Object.keys(videoData || {}));

    // Try to extract Vimeo metadata with multiple approaches
    const vimeoMetadata = pick(
      videoData.videoMetadata,
      videoData.vimeoMetadata,
      videoData.vimeo_metadata,
      extractFirestoreData(videoData, 'vimeo_metadata'),
      extractFirestoreData(videoData, 'videoMetadata')
    ) || null;
    
    // console.log("Extracted vimeoMetadata:", vimeoMetadata);

    // Try to extract Vimeo OTT metadata with multiple approaches
    const vimeoOttMetadataRaw = pick(
      videoData.vimeoOttMetadata,
      videoData.vimeo_ott_metadata,
      extractFirestoreData(videoData, 'vimeo_ott_metadata'),
      extractFirestoreData(videoData, 'vimeoOttMetadata')
    );

    const vimeoOttMetadata = vimeoOttMetadataRaw || null;
    // console.log("Extracted vimeoOttMetadata:", vimeoOttMetadata);

    // Also try to directly access duration fields that might exist at the root level
    const directDuration = pick(
      videoData.duration,
      videoData.video_duration,
      videoData.vimeo_duration,
      videoData.vimeo_metadata_duration,
      videoData.vimeo_ott_metadata_duration
    );

    // console.log("Direct duration value:", directDuration);

    // Normalize Vimeo metadata structure so the UI can reliably render it
    const normalizedVimeoMetadata: any = vimeoMetadata || null;

    // Ensure correct data structure for Vimeo metadata
    if (normalizedVimeoMetadata) {
        // Ensure duration exists and is properly typed
        if (normalizedVimeoMetadata.duration === undefined || normalizedVimeoMetadata.duration === null) {
            // Check if duration is missing but available elsewhere
            if (directDuration !== undefined) {
                normalizedVimeoMetadata.duration = directDuration;
            }
            // Try duration inside document
            else if (videoData.duration) {
                normalizedVimeoMetadata.duration = videoData.duration;
            }
            // Look for nested duration field
            else if (videoData.vimeo_metadata_duration) {
                normalizedVimeoMetadata.duration = videoData.vimeo_metadata_duration;
            }
        }
        
        // Ensure description exists
        if (normalizedVimeoMetadata.description === undefined && videoData.description) {
            normalizedVimeoMetadata.description = videoData.description;
        }

        // Convert string duration (MM:SS or HH:MM:SS) to seconds
        if (typeof normalizedVimeoMetadata.duration === 'string' && normalizedVimeoMetadata.duration.includes(':')) {
            const parts = normalizedVimeoMetadata.duration.split(':');
            if (parts.length === 2) {
                // MM:SS format
                normalizedVimeoMetadata.duration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            } else if (parts.length === 3) {
                // HH:MM:SS format
                normalizedVimeoMetadata.duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
            } else {
                normalizedVimeoMetadata.duration = parseInt(normalizedVimeoMetadata.duration);
            }
        } else if (normalizedVimeoMetadata.duration !== undefined) {
            // Ensure it's a number
            normalizedVimeoMetadata.duration = Number(normalizedVimeoMetadata.duration);
        }
    }
    
    // Normalize Vimeo OTT metadata structure so the UI can reliably render it
    const normalizedVimeoOttMetadata: any = vimeoOttMetadata || null;

    if (normalizedVimeoOttMetadata) {
      // Ensure tags is an array of strings
      if (normalizedVimeoOttMetadata.tags && !Array.isArray(normalizedVimeoOttMetadata.tags)) {
        if (typeof normalizedVimeoOttMetadata.tags === 'string') {
          normalizedVimeoOttMetadata.tags = normalizedVimeoOttMetadata.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean);
        } else if (typeof normalizedVimeoOttMetadata.tags === 'object') {
          // Sometimes Firestore flattens arrays into keyed objects (0,1,2,...)
          normalizedVimeoOttMetadata.tags = Object.values(normalizedVimeoOttMetadata.tags).map((t) => String(t));
        }
      }

      // Ensure thumbnail is an object with url/uri keys
      if (normalizedVimeoOttMetadata.thumbnail && typeof normalizedVimeoOttMetadata.thumbnail === 'string') {
        normalizedVimeoOttMetadata.thumbnail = { url: normalizedVimeoOttMetadata.thumbnail };
      }

      // Ensure duration exists and is properly typed for OTT metadata
      if (normalizedVimeoOttMetadata.duration === undefined || normalizedVimeoOttMetadata.duration === null) {
        // Try direct duration field
        if (directDuration !== undefined) {
          normalizedVimeoOttMetadata.duration = directDuration;
        }
        // Try duration inside document
        else if (videoData.duration) {
          normalizedVimeoOttMetadata.duration = videoData.duration;
        }
        // Look for nested duration field
        else if (videoData.vimeo_ott_metadata_duration) {
          normalizedVimeoOttMetadata.duration = videoData.vimeo_ott_metadata_duration;
        }
      }
      
      // Convert string duration (MM:SS or HH:MM:SS) to seconds
      if (typeof normalizedVimeoOttMetadata.duration === 'string' && normalizedVimeoOttMetadata.duration.includes(':')) {
        const parts = normalizedVimeoOttMetadata.duration.split(':');
        if (parts.length === 2) {
          // MM:SS format
          normalizedVimeoOttMetadata.duration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
          // HH:MM:SS format
          normalizedVimeoOttMetadata.duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } else {
          normalizedVimeoOttMetadata.duration = parseInt(normalizedVimeoOttMetadata.duration);
        }
      } else if (normalizedVimeoOttMetadata.duration !== undefined) {
        // Ensure it's a number
        normalizedVimeoOttMetadata.duration = Number(normalizedVimeoOttMetadata.duration);
      }
    }
    
    // Map API property names to our expected structure, using normalized metadata where relevant
    const mappedData = {
      document_id: videoData.id || videoData.document_id || "",
      name: videoData.title || videoData.name || "Untitled Video",
      vimeoId: videoData.vimeoId || "",
      vimeoOttId: videoData.vimeoOttId || "",
      gcpLink: videoData.gcp_link || videoData.gcpLink || "",
      downloadLink: videoData.download_link || videoData.downloadUrl || "",
      confirmed: videoData.confirmed || videoData.status === "Published" || false,
      createdAt: videoData.createdAt || videoData.uploadDate || "",
      fileType: videoData.file_type || videoData.fileType || "",
      gcp_info_last_updated: videoData.gcp_info_last_updated || "",
      
      // YouTube status tracking and link
      youtubeStatus: videoData.youtubeStatus || videoData.youtube_status || videoData.status || "Preparing for YouTube",
      youtubeLink: videoData.youtubeLink || videoData.youtube_link || videoData.youtubeUrl || videoData.youtube_url || "",
      
      // Handle descriptions
      description: videoData.description || 
                  normalizedVimeoOttMetadata?.description ||
                  vimeoMetadata?.description || "",
      
      // Handle Vimeo metadata
      videoMetadata: normalizedVimeoMetadata || null,
      
      // Default vimeoOttMetadata
      vimeoOttMetadata: normalizedVimeoOttMetadata,
      
      // Add direct duration and thumbnail fields for fallback
      duration: directDuration || videoData.duration || 
                normalizedVimeoMetadata?.duration ||
                normalizedVimeoOttMetadata?.duration || 0,
      
      thumbnail: videoData.thumbnail || 
                normalizedVimeoMetadata?.thumbnail ||
                (normalizedVimeoMetadata?.thumbnails && normalizedVimeoMetadata.thumbnails[0]?.url) ||
                (normalizedVimeoOttMetadata?.thumbnail && 
                ((normalizedVimeoOttMetadata.thumbnail as any)?.url || 
                (normalizedVimeoOttMetadata.thumbnail as any)?.uri)) || '',
      
      // New YouTube scheduling fields
      youtube_link: videoData.youtube_link || "",
      upload_scheduled: videoData.upload_scheduled || "",
      upload_time: videoData.upload_time || "",
      
      // New YouTube metadata fields - use extractFirestoreData for proper handling
      yt_title: pick(videoData.yt_title, extractFirestoreData(videoData, 'yt_title')) || "",
      yt_description: pick(videoData.yt_description, extractFirestoreData(videoData, 'yt_description')) || "",
      yt_tags: pick(videoData.yt_tags, extractFirestoreData(videoData, 'yt_tags')) || [],
      yt_privacyStatus: pick(videoData.yt_privacyStatus, extractFirestoreData(videoData, 'yt_privacyStatus')) || "",
      yt_category: pick(videoData.yt_category, extractFirestoreData(videoData, 'yt_category')) || "",
      details_confirmed: pick(videoData.details_confirmed, extractFirestoreData(videoData, 'details_confirmed')) || "",
    };
    
    // If we don't have metadata but have an ID, create minimal metadata
    if (!mappedData.videoMetadata && videoData.vimeoId) {
      // console.log("Creating minimal videoMetadata from vimeoId");
      mappedData.videoMetadata = {
        id: videoData.vimeoId,
        name: videoData.title || videoData.name || "",
        description: videoData.description || "",
        duration: 0, // Will be properly set by the formatTime function when displayed
        thumbnail: videoData.thumbnail || "",
        thumbnails: videoData.thumbnails || [],
        link: videoData.link || `https://vimeo.com/${videoData.vimeoId}`,
        created_time: videoData.createdAt || "",
        download_links: videoData.downloadInfo ? [videoData.downloadInfo] : []
      };
    }
    
    // If we don't have OTT metadata but have an ID, create minimal metadata
    if (!mappedData.vimeoOttMetadata && videoData.vimeoOttId) {
      // console.log("Creating minimal vimeoOttMetadata from vimeoOttId");
      mappedData.vimeoOttMetadata = {
        id: videoData.vimeoOttId,
        title: videoData.title || videoData.name || "",
        description: videoData.description || "",
        duration: 0, // Will be properly set by the formatTime function when displayed
        link: videoData.vimeoOttLink || videoData.vimeo_ott_link || "",
        files_href: "",
        created_at: videoData.createdAt || "",
        tags: videoData.tags || [],
        thumbnail: null
      };
    }
    
    // console.log("Final mapped vimeoOttMetadata:", mappedData.vimeoOttMetadata);
    
    // Add a fallback description if not in videoMetadata but available elsewhere
    if (normalizedVimeoMetadata && !normalizedVimeoMetadata.description && videoData.description) {
      mappedData.description = videoData.description;
    }
    
    return mappedData;
  }, [videoData]);

  // Format time function (seconds to MM:SS)
  const formatTime = (seconds: any) => {
    // Handle case when seconds is undefined, null, or not a number
    if (seconds === undefined || seconds === null || isNaN(Number(seconds))) {
      return "00:00";
    }
    
    // Handle string format "MM:SS" or "HH:MM:SS"
    if (typeof seconds === 'string' && seconds.includes(':')) {
      return seconds; // Already in the right format
    }
    
    // Convert to number
    const totalSeconds = Number(seconds);
    
    // Handle hours if needed
    if (totalSeconds >= 3600) {
      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = Math.floor(totalSeconds % 60);
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.floor(totalSeconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Format date function
  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const [copySuccess, setCopySuccess] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(fieldName);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Check if video has been uploaded to YouTube
  const isUploadedToYouTube = data.youtubeStatus?.toLowerCase() === 'published on youtube' || 
                              data.youtubeLink || 
                              data.youtube_link;

  const tabs: TabData[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <Info className="h-4 w-4" />,
      content: (
        <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - Video preview and basic info */}
              <div className="flex-1 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{data.name || "Untitled Video"}</h2>
                  </div>
                  
                  {/* Video thumbnail with duration overlay */}
                  <div className="relative aspect-video w-full max-w-[50%] rounded-lg overflow-hidden border border-border bg-muted">
                    {(data.videoMetadata?.thumbnail || 
                      (data.vimeoOttMetadata?.thumbnail && 
                       ((data.vimeoOttMetadata.thumbnail as any)?.url || (data.vimeoOttMetadata.thumbnail as any)?.uri))) ? (
                      <img 
                        src={
                          data.videoMetadata?.thumbnail || 
                          (data.vimeoOttMetadata?.thumbnail && 
                           ((data.vimeoOttMetadata.thumbnail as any)?.url || (data.vimeoOttMetadata.thumbnail as any)?.uri)) || 
                          'https://placehold.co/640x360?text=No+Thumbnail'
                        } 
                        alt={data.name || "Video thumbnail"} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Image load error, falling back to placeholder");
                          e.currentTarget.src = 'https://placehold.co/1280x720?text=No+Thumbnail';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                    
                    {(data.videoMetadata && data.videoMetadata.duration !== undefined) && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatTime(data.videoMetadata.duration)}
                      </div>
                    )}
                    
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                      <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Description</h3>
                    
                    {data.description || data.vimeoOttMetadata?.description || data.videoMetadata?.description ? (
                      <div className="rounded-md border p-3 text-sm whitespace-pre-line bg-muted/30">
                        {data.description || data.vimeoOttMetadata?.description || data.videoMetadata?.description}
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground italic">
                        No description available
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tags */}
                {data.vimeoOttMetadata?.tags && data.vimeoOttMetadata.tags.length > 0 && (
          <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.vimeoOttMetadata.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
          </div>
                )}
                
                {/* Video metadata summary */}
          <div className="space-y-2">
                  <h3 className="text-sm font-medium">Video Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {data.document_id && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Database className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Document ID:</span>
                        <span className="font-medium">{data.document_id}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 -ml-1" 
                          onClick={() => copyToClipboard(data.document_id, 'documentId')}
                        >
                          {copySuccess === 'documentId' ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  
                    {data.fileType && (
                      <div className="flex items-center gap-2">
                        <FileVideo className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">File Type:</span>
                        <span className="font-medium">{data.fileType}</span>
                      </div>
                    )}
                    
                    {(data.videoMetadata && data.videoMetadata.duration !== undefined) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {formatTime(data.videoMetadata.duration)}
                        </span>
                      </div>
                    )}
                    
                    {data.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">{formatDate(data.createdAt)}</span>
                      </div>
                    )}

                    {data.gcp_info_last_updated && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">GCP Info Updated:</span>
                        <span className="font-medium">{formatDate(data.gcp_info_last_updated)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right column - Details and metadata */}
              <div className="w-full lg:w-80 space-y-5">
                {/* YouTube status card */}
                {(() => {
                  // Use youtubeStatus as the primary driver for status determination
                  const youtubeStatus = (data.youtubeStatus || '').toLowerCase();
                  
                  // Fallback checks for backward compatibility
                  const hasYoutubeLink = !!(data.youtubeLink || data.youtube_link);
                  const hasUploadScheduled = !!(data.upload_scheduled);
                  const hasDetailsConfirmed = !!(data.details_confirmed || data.yt_title);
                  
                  // Debug logging to understand status determination (only for debugging issues)
                  const shouldDebug = process.env.NODE_ENV === 'development' && 
                    (!data.youtubeStatus || data.youtubeStatus === 'unknown');
                  
                  if (shouldDebug) {
                    console.log('YouTube Status Debug:', {
                      youtubeStatus: data.youtubeStatus,
                      youtubeStatusLower: youtubeStatus,
                      hasYoutubeLink,
                      hasUploadScheduled,
                      hasDetailsConfirmed,
                      details_confirmed: data.details_confirmed,
                      yt_title: data.yt_title,
                      youtube_link: data.youtube_link,
                      upload_scheduled: data.upload_scheduled
                    });
                  }
                  
                  let status: 'Uploaded' | 'Scheduled' | 'Confirm Details' | 'Not Scheduled';
                  
                  // Primary logic: Use youtubeStatus field
                  if (youtubeStatus === 'published on youtube' || hasYoutubeLink) {
                    status = 'Uploaded';
                  } else if (youtubeStatus === 'scheduled for youtube' || hasUploadScheduled) {
                    status = 'Scheduled';
                  } else if (youtubeStatus === 'ready for youtube') {
                    // When status is 'ready for youtube', details are confirmed and ready to schedule
                    status = 'Not Scheduled';
                  } else if (youtubeStatus === 'preparing for youtube' || !youtubeStatus) {
                    // When status is 'preparing for youtube' or empty, need to confirm details
                    // But check if details were confirmed via other fields for backward compatibility
                    if (hasDetailsConfirmed && !youtubeStatus) {
                      status = 'Not Scheduled'; // Legacy fallback
                    } else {
                      status = 'Confirm Details';
                    }
                  } else {
                    // Fallback to legacy logic if youtubeStatus has an unexpected value
                    if (hasDetailsConfirmed) {
                      status = 'Not Scheduled';
                    } else {
                      status = 'Confirm Details';
                    }
                  }

                  if (shouldDebug) {
                    console.log('Determined YouTube Status:', status);
                  }

                  const statusStyles: Record<typeof status, {
                    bg: string;
                    border: string;
                    text: string;
                    icon: string;
                  }> = {
                    'Uploaded': {
                      bg: 'bg-green-50 dark:bg-green-950/20',
                      border: 'border-green-200 dark:border-green-900',
                      text: 'text-green-700 dark:text-green-400',
                      icon: 'text-green-600 dark:text-green-400'
                    },
                    'Scheduled': {
                      bg: 'bg-purple-50 dark:bg-purple-950/20',
                      border: 'border-purple-200 dark:border-purple-900',
                      text: 'text-purple-700 dark:text-purple-400',
                      icon: 'text-purple-600 dark:text-purple-400'
                    },
                    'Confirm Details': {
                      bg: 'bg-blue-50 dark:bg-blue-950/20',
                      border: 'border-blue-200 dark:border-blue-900',
                      text: 'text-blue-700 dark:text-blue-400',
                      icon: 'text-blue-600 dark:text-blue-400'
                    },
                    'Not Scheduled': {
                      bg: 'bg-gray-50 dark:bg-gray-950/20',
                      border: 'border-gray-200 dark:border-gray-900',
                      text: 'text-gray-700 dark:text-gray-400',
                      icon: 'text-gray-600 dark:text-gray-400'
                    }
                  };

                  const styles = statusStyles[status];

                  return (
                    <YoutubeStatusCard 
                      status={status}
                      styles={styles}
                      videoId={data.document_id}
                      uploadTime={data.upload_time}
                      youtubeLink={data.youtubeLink || data.youtube_link}
                      ytTitle={data.yt_title}
                      ytDescription={data.yt_description}
                      ytTags={data.yt_tags}
                      ytPrivacyStatus={data.yt_privacyStatus}
                    />
                  );
                })()}
                
                {/* Key details */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-medium text-sm">Key Details</h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {data.vimeoId && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Vimeo ID</Label>
                        <div className="flex items-center space-x-1">
                          <Input 
                            value={data.vimeoId} 
                            readOnly 
                            className="h-8 text-xs bg-muted/50" 
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 relative" 
                            onClick={() => copyToClipboard(data.vimeoId, 'vimeoId')}
                          >
                            {copySuccess === 'vimeoId' ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
          </div>
                    )}
                    
                    {data.vimeoOttId && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Vimeo OTT ID</Label>
                        <div className="flex items-center space-x-1">
                          <Input 
                            value={data.vimeoOttId} 
                            readOnly 
                            className="h-8 text-xs bg-muted/50" 
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 relative" 
                            onClick={() => copyToClipboard(data.vimeoOttId, 'vimeoOttId')}
                          >
                            {copySuccess === 'vimeoOttId' ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* External links */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-medium text-sm">External Links</h3>
                  
                  <div className="space-y-3">
                    {data.gcpLink && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <Database className="h-3 w-3 mr-1" />
                          GCP Storage
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 overflow-hidden text-ellipsis border rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                            {data.gcpLink}
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 shrink-0 relative" 
                            onClick={() => copyToClipboard(data.gcpLink, 'gcpLink')}
                          >
                            {copySuccess === 'gcpLink' ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {(data.videoMetadata?.link || data.vimeoId) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <Video className="h-3 w-3 mr-1" />
                          Vimeo Link
                        </Label>
                        <a 
                          href={data.videoMetadata?.link || `https://vimeo.com/manage/videos/${data.vimeoId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between text-xs border rounded-md px-3 py-2 text-primary hover:bg-primary/5 transition-colors group"
                        >
                          <span className="truncate mr-2">Manage in Vimeo</span>
                          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>
                    )}
                    
                    {(data.vimeoOttMetadata?.link || data.vimeoOttId) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <FileVideo className="h-3 w-3 mr-1" />
                          Vimeo OTT Link
                        </Label>
                        <a 
                          href={`https://pbl.vhx.tv/admin/manage/videos/${data.vimeoOttId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between text-xs border rounded-md px-3 py-2 text-primary hover:bg-primary/5 transition-colors group"
                        >
                          <span className="truncate mr-2">Manage in Vimeo OTT</span>
                          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>
                    )}
                    
                    {data.youtubeLink && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <Youtube className="h-3 w-3 mr-1" />
                          YouTube Link
                        </Label>
                        <a 
                          href={data.youtubeLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between text-xs border rounded-md px-3 py-2 text-primary hover:bg-primary/5 transition-colors group"
                        >
                          <span className="truncate mr-2">Open on YouTube</span>
                          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
      )
    },
    // Only show Edit Details tab if video hasn't been uploaded to YouTube
    ...(!isUploadedToYouTube ? [{
      id: "edit-details",
      label: "Edit Details",
      icon: <Youtube className="h-4 w-4" />,
      content: (
        <ScrollArea className="h-full max-h-[calc(90vh-48px)]">
          <YouTubeTabContent videoData={data} />
        </ScrollArea>
      )
    }] : []),
    {
      id: "vimeo-metadata",
      label: "Vimeo",
      icon: <Video className="h-4 w-4" />,
      content: (
        <ScrollArea className="h-full max-h-[calc(90vh-48px)]">
          <div className="p-6 space-y-6">
            {data.videoMetadata ? (
              <>
                {/* Top section: thumbnail + ID */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Thumbnail */}
                  <div className="w-full md:w-1/3 max-w-sm">
                    <img
                      src={data.videoMetadata?.thumbnail || data.videoMetadata?.thumbnails?.[0]?.url || 'https://placehold.co/640x360?text=No+Thumbnail'}
                      onError={(e)=>{e.currentTarget.src='https://placehold.co/640x360?text=No+Thumbnail'}}
                      alt="Vimeo thumbnail"
                      className="w-full h-auto rounded-md border object-cover"
                    />
                  </div>
                  {/* ID & Link */}
                  <div className="flex-1 space-y-4">
                    {/* Title/Name */}
                    <div className="mb-3">
                      <h2 className="text-xl font-semibold">{data.videoMetadata?.name || data.name}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-24">ID</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <p className="text-sm font-medium">{data.videoMetadata?.id || data.vimeoId}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>copyToClipboard(String(data.videoMetadata?.id || data.vimeoId),'vimeoMetadataId')}>
                          {copySuccess==='vimeoMetadataId'?<Check className="h-3 w-3 text-green-500"/>:<Copy className="h-3 w-3"/>}
                        </Button>
                      </div>
                    </div>
                    {(data.videoMetadata?.link || data.vimeoId) && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-24">Vimeo Link</Label>
                        <a 
                          href={data.videoMetadata?.link || `https://vimeo.com/${data.vimeoId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          Open in Vimeo <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {/* Duration moved up */}
                    {(data.videoMetadata?.duration !== undefined || data.duration) && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-24">Duration</Label>
                        <p className="text-sm font-medium flex-1">{formatTime(data.videoMetadata?.duration || data.duration)} ({data.videoMetadata?.duration || data.duration} seconds)</p>
                      </div>
                    )}
                    {/* Created Time */}
                    {(data.videoMetadata?.created_time || data.createdAt) && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-24">Created Time</Label>
                        <p className="text-sm font-medium flex-1">{formatDate(data.videoMetadata?.created_time || data.createdAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {(data.videoMetadata?.description || data.description) && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground block">Description</Label>
                    <div className="text-sm whitespace-pre-line p-3 bg-muted/30 rounded-md border">
                      {data.videoMetadata?.description || data.description}
                    </div>
                  </div>
                )}
              </>
            ) : data.vimeoId ? (
              // Fallback when we only have vimeoId but no metadata
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 max-w-sm">
                  <img
                    src={data.thumbnail || (data.vimeoId ? `https://i.vimeocdn.com/video/${data.vimeoId}_640x360.jpg` : 'https://placehold.co/640x360?text=No+Thumbnail')}
                    onError={(e)=>{e.currentTarget.src='https://placehold.co/640x360?text=No+Thumbnail'}}
                    alt="Vimeo thumbnail"
                    className="w-full h-auto rounded-md border object-cover"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="mb-3">
                    <h2 className="text-xl font-semibold">{data.name}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground w-24">ID</Label>
                    <div className="flex items-center gap-2 flex-1">
                      <p className="text-sm font-medium">{data.vimeoId}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>copyToClipboard(String(data.vimeoId),'vimeoId')}>
                        {copySuccess==='vimeoId'?<Check className="h-3 w-3 text-green-500"/>:<Copy className="h-3 w-3"/>}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground w-24">Vimeo Link</Label>
                    <a 
                      href={`https://vimeo.com/${data.vimeoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Open in Vimeo <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {data.duration && (
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-24">Duration</Label>
                      <p className="text-sm font-medium flex-1">{formatTime(data.duration)} ({data.duration} seconds)</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No Vimeo metadata available.</div>
            )}
          </div>
        </ScrollArea>
      )
    },
    {
      id: "vimeo-ott-metadata",
      label: "Vimeo OTT",
      icon: <FileVideo className="h-4 w-4" />,
      content: (
        <ScrollArea className="h-full max-h-[calc(90vh-48px)]">
          <div className="p-6 space-y-6">
            {data.vimeoOttMetadata ? (
              <>
                {/* Top section: thumbnail + ID */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Thumbnail */}
                  {data.vimeoOttMetadata?.thumbnail && (
                    <div className="w-full md:w-1/3 max-w-sm">
                      <img
                        src={(data.vimeoOttMetadata.thumbnail as any)?.url || (data.vimeoOttMetadata.thumbnail as any)?.uri || 'https://placehold.co/640x360?text=No+Thumbnail'}
                        onError={(e)=>{e.currentTarget.src='https://placehold.co/640x360?text=No+Thumbnail'}}
                        alt="Vimeo OTT thumbnail"
                        className="w-full h-auto rounded-md border object-cover"
                      />
                    </div>
                  )}
                  {/* ID & Link */}
                  <div className="flex-1 space-y-4">
                    {/* Title/Name */}
                    <div className="mb-3">
                      <h2 className="text-xl font-semibold">{data.vimeoOttMetadata?.title || data.name}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground w-24">ID</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <p className="text-sm font-medium">{data.vimeoOttMetadata?.id}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>copyToClipboard(String(data.vimeoOttMetadata?.id || ''),'vimeoOttId')}>
                          {copySuccess==='vimeoOttId'?<Check className="h-3 w-3 text-green-500"/>:<Copy className="h-3 w-3"/>}
                        </Button>
                      </div>
                    </div>
                    {(data.vimeoOttMetadata?.link || data.vimeoOttId) && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-24">Vimeo OTT Link</Label>
                        <a href={`https://pbl.vhx.tv/admin/manage/videos/${data.vimeoOttId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          Manage in Vimeo OTT <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {/* Duration moved up */}
                    {data.vimeoOttMetadata?.duration !== undefined && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-24">Duration</Label>
                        <p className="text-sm font-medium flex-1">{formatTime(data.vimeoOttMetadata?.duration)} ({data.vimeoOttMetadata?.duration} seconds)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {data.vimeoOttMetadata?.description && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground block">Description</Label>
                    <div className="text-sm whitespace-pre-line p-3 bg-muted/30 rounded-md border">
                      {data.vimeoOttMetadata?.description}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {data.vimeoOttMetadata?.tags && data.vimeoOttMetadata.tags.length>0 && (
                  <div className="space-y-2">
                                          <Label className="text-xs text-muted-foreground block">Tags ({data.vimeoOttMetadata?.tags?.length || 0})</Label>
                      <div className="flex flex-wrap gap-2">
                        {data.vimeoOttMetadata?.tags?.map((tag: string, i: number)=>(<Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>))}
                    </div>
                  </div>
                )}
              </>
            ) : data.vimeoOttId ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Vimeo OTT ID found but metadata not available.</div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No Vimeo OTT metadata available.</div>
            )}
          </div>
        </ScrollArea>
      )
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Edit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{data.name || "Edit Video"}</h1>
            <p className="text-sm text-muted-foreground">Manage your video content and settings</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
        <div className="border-b bg-background">
          <TabsList className="w-full flex justify-start px-6 border-b-0 rounded-none bg-transparent h-14">
        {tabs.map((tab) => (
                      <TabsTrigger 
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 rounded-lg border-2 border-transparent py-2.5 px-4 mx-1 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/5 data-[state=active]:text-primary hover:bg-muted/50 transition-all duration-200"
            >
                          {tab.icon}
              <span className="font-medium">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      </div>
        <div className="flex-1 min-h-0">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="h-full m-0 outline-none">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {tab.content}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}

// YouTube tab content component
function YouTubeTabContent({ videoData }: { videoData: VideoData }) {
  // AI Dialog state
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [aiDialogType, setAiDialogType] = React.useState<'title' | 'description' | 'tags'>('title');
  
  // Content state - Initialize with confirmed details from Firestore if available
  const [youtubeTitle, setYoutubeTitle] = React.useState(
    videoData.yt_title || videoData.name || videoData.videoMetadata?.name || videoData.vimeoOttMetadata?.title || ""
  );
  const [youtubeDescription, setYoutubeDescription] = React.useState(
    videoData.yt_description || videoData.videoMetadata?.description || videoData.vimeoOttMetadata?.description || ""
  );
  const [youtubeTags, setYoutubeTags] = React.useState<string[]>(() => {
    // Get tags from multiple sources with fallbacks
    let tags: any = videoData.yt_tags || videoData.vimeoOttMetadata?.tags || [];
    
    // Handle different data formats from Firestore
    if (typeof tags === 'string') {
      // If it's a string, try to split it
      tags = tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    } else if (tags && typeof tags === 'object' && !Array.isArray(tags)) {
      // If it's an object (like Firestore might return), try to extract array
      if (tags.arrayValue && tags.arrayValue.values) {
        // Firestore array format
        tags = tags.arrayValue.values.map((v: any) => v.stringValue || v).filter(Boolean);
      } else if (Object.values(tags).length > 0) {
        // Try to get values from object
        tags = Object.values(tags).filter(v => typeof v === 'string' && v.length > 0);
      } else {
        tags = [];
      }
    }
    
    // Ensure we have an array of strings
    return Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag.length > 0) : [];
  });
  const [youtubePrivacy, setYoutubePrivacy] = React.useState(
          videoData.yt_privacyStatus || "private"
  );
  const [youtubeCategory, setYoutubeCategory] = React.useState(
          videoData.yt_category || "26" // Default to "HowTo" category
  );
  
  const [newTag, setNewTag] = React.useState("");
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !youtubeTags.includes(newTag.trim())) {
      setYoutubeTags([...youtubeTags, newTag.trim()]);
      setNewTag("");
    }
  };
  
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleRemoveTag = (index: number) => {
    const newTags = [...youtubeTags];
    newTags.splice(index, 1);
    setYoutubeTags(newTags);
  };

  // Confirm details function
  const handleConfirmDetails = async () => {
    if (!youtubeTitle.trim() || !youtubeDescription.trim()) {
      alert('Please fill in both title and description before confirming details.');
      return;
    }

    setIsConfirming(true);
    try {
      const response = await fetch(`/api/videos/${videoData.document_id}/confirm-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yt_title: youtubeTitle,
          yt_description: youtubeDescription,
          yt_tags: youtubeTags,
          yt_privacyStatus: youtubePrivacy,
          yt_category: youtubeCategory,
        }),
      });

      if (response.ok) {
        // Instead of reloading, wait a moment and then reload to ensure DB has updated
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error('Failed to confirm details');
      }
    } catch (error) {
      console.error('Error confirming details:', error);
      alert('Failed to confirm details. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };
  
  // AI content generation
  const handleContentGenerated = (content: string | string[]) => {
    if (aiDialogType === 'title') {
      setYoutubeTitle(content as string);
    } else if (aiDialogType === 'description') {
      setYoutubeDescription(content as string);
    } else if (aiDialogType === 'tags') {
      setYoutubeTags(content as string[]);
    }
  };

  const copyFromVimeo = (contentType: 'title' | 'description') => {
    if (contentType === 'title') {
      setYoutubeTitle(videoData.videoMetadata?.name || videoData.name || '');
    } else if (contentType === 'description') {
      setYoutubeDescription(videoData.videoMetadata?.description || '');
    }
  };

  const copyFromVimeoOtt = (contentType: 'title' | 'description' | 'tags') => {
    if (contentType === 'title') {
      setYoutubeTitle(videoData.vimeoOttMetadata?.title || videoData.name || '');
    } else if (contentType === 'description') {
      setYoutubeDescription(videoData.vimeoOttMetadata?.description || '');
    } else if (contentType === 'tags') {
      setYoutubeTags(videoData.vimeoOttMetadata?.tags || []);
    }
  };

  const openAiDialog = (type: 'title' | 'description' | 'tags') => {
    setAiDialogType(type);
    setAiDialogOpen(true);
  };

  const getYoutubeStatusUI = () => {
    const status = videoData.youtubeStatus || '';
    const hasConfirmed = !!(videoData.details_confirmed || videoData.yt_title);
    
    if (hasConfirmed) {
      return (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">Details Confirmed</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            YouTube metadata is ready. You can now schedule or upload your video.
          </p>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Ready to Confirm</span>
          <span className="text-xs text-blue-600">Review and confirm details to proceed</span>
        </div>
        <Button 
          size="sm" 
          onClick={handleConfirmDetails}
          disabled={isConfirming}
          className="h-7 px-3 text-xs"
        >
          {isConfirming ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Confirm Details
        </Button>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium">YouTube Publishing</h3>
          {(() => {
            const status = (videoData.youtubeStatus || '').toLowerCase();
            const badgeStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
              'preparing for youtube': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Preparing' },
              'ready for youtube': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Ready' },
              'scheduled for youtube': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Scheduled' },
              'published on youtube': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Published' }
            };
            const bs = badgeStyles[status] || badgeStyles['preparing for youtube'];
            return (
              <Badge variant="outline" className={`${bs.bg} ${bs.text} ${bs.border}`}>{bs.label}</Badge>
            );
          })()}
        </div>
        
        {/* Confirm Details Button */}
        {!(videoData.details_confirmed || videoData.yt_title) && (
          <Button 
            onClick={handleConfirmDetails}
            disabled={isConfirming}
            size="sm"
            className="h-8"
          >
            {isConfirming ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
            Confirm Details
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="youtube-title">YouTube Title</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                title="Copy from Vimeo"
                onClick={() => copyFromVimeo('title')}
              >
                <Video className="h-3 w-3 mr-1" />
                Copy from Vimeo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                title="Copy from Vimeo OTT"
                onClick={() => copyFromVimeoOtt('title')}
              >
                <FileVideo className="h-3 w-3 mr-1" />
                Copy from OTT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                onClick={() => openAiDialog('title')}
              >
                <Zap className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>
          <Input 
            id="youtube-title" 
            placeholder="Enter YouTube title" 
            value={youtubeTitle}
            onChange={(e) => setYoutubeTitle(e.target.value)}
            disabled={isConfirming}
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Pro tip:</span> Keep titles under 60 characters for best results
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="youtube-description">YouTube Description</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                title="Copy from Vimeo"
                onClick={() => copyFromVimeo('description')}
                disabled={isConfirming}
              >
                <Video className="h-3 w-3 mr-1" />
                Copy from Vimeo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                title="Copy from Vimeo OTT"
                onClick={() => copyFromVimeoOtt('description')}
                disabled={isConfirming}
              >
                <FileVideo className="h-3 w-3 mr-1" />
                Copy from OTT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                onClick={() => openAiDialog('description')}
                disabled={isConfirming}
              >
                <Zap className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>
          <Textarea 
            id="youtube-description" 
            placeholder="Enter YouTube description" 
            className="min-h-32"
            value={youtubeDescription}
            onChange={(e) => setYoutubeDescription(e.target.value)}
            disabled={isConfirming}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Include relevant keywords, links, and timestamps to improve discoverability
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="youtube-tags">YouTube Tags</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs" 
                title="Copy from Vimeo OTT Tags"
                onClick={() => copyFromVimeoOtt('tags')}
                disabled={isConfirming}
              >
                <FileVideo className="h-3 w-3 mr-1" />
                Copy from OTT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                onClick={() => openAiDialog('tags')}
                disabled={isConfirming}
              >
                <Zap className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2 min-h-6 p-1">
            {youtubeTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                {tag}
                {!isConfirming && (
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveTag(i)}
                  />
                )}
              </Badge>
            ))}
          </div>
          {!isConfirming && (
            <div className="flex gap-2">
              <Input 
                id="youtube-tags" 
                placeholder="Add tags (press Enter to add)" 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyPress}
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>Add</Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Separate tags with commas. Include relevant keywords to improve discoverability.
          </p>
        </div>
        
        
        <div className="space-y-2">
          <Label htmlFor="youtube-visibility">YouTube Visibility</Label>
          <Select 
            value={youtubePrivacy} 
            onValueChange={setYoutubePrivacy} 
            disabled={isConfirming}
          >
            <SelectTrigger data-testid="privacy-select">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube-category">YouTube Category</Label>
          <Select 
            value={youtubeCategory} 
            onValueChange={setYoutubeCategory} 
            disabled={isConfirming}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Film & Animation</SelectItem>
              <SelectItem value="2">Autos & Vehicles</SelectItem>
              <SelectItem value="10">Music</SelectItem>
              <SelectItem value="15">Pets & Animals</SelectItem>
              <SelectItem value="17">Sports</SelectItem>
              <SelectItem value="19">Travel & Events</SelectItem>
              <SelectItem value="20">Gaming</SelectItem>
              <SelectItem value="22">People & Blogs</SelectItem>
              <SelectItem value="23">Comedy</SelectItem>
              <SelectItem value="24">Entertainment</SelectItem>
              <SelectItem value="25">News & Politics</SelectItem>
              <SelectItem value="26">HowTo & Style</SelectItem>
              <SelectItem value="27">Education</SelectItem>
              <SelectItem value="28">Science & Technology</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
      
      <div className="pt-4 flex justify-end gap-3">
        {!(videoData.details_confirmed || videoData.yt_title) ? (
          <>
            <Button variant="outline">Save as Draft</Button>
            <Button onClick={handleConfirmDetails} disabled={isConfirming}>
              {isConfirming ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Confirm Details
            </Button>
          </>
        ) : (
          <>
            {videoData.youtubeStatus?.toLowerCase() === 'ready for youtube' ? (
              <Button onClick={handleConfirmDetails} disabled={isConfirming}>
                {isConfirming ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Edit className="h-3 w-3 mr-1" />}
                Update
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  // Clear confirmed details to allow editing again
                  fetch(`/api/videos/${videoData.document_id}/confirm-details`, { method: 'DELETE' })
                    .then(() => window.location.reload());
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Details
              </Button>
            )}
          </>
        )}
      </div>
      
      <AIGenerateDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        contentType={aiDialogType}
        videoData={videoData}
        onGenerated={handleContentGenerated}
      />
    </div>
  );
}

export { 
  VideoEditorModal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose
}

// Add a dialog for AI content generation
interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'title' | 'description' | 'tags';
  videoData: any;
  onGenerated: (content: string | string[]) => void;
}

const AIGenerateDialog = ({
  open,
  onOpenChange,
  contentType,
  videoData,
  onGenerated
}: AIGenerateDialogProps) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedContent, setGeneratedContent] = React.useState<string | string[]>(contentType === 'tags' ? [] : '');
  
  const generateContent = () => {
    setIsGenerating(true);
    
    // This would be replaced with an actual API call to Anthropic
    setTimeout(() => {
      let result: string | string[] = '';
      
      // Simulate AI generation
      switch(contentType) {
        case 'title':
          result = `${videoData.name || 'Video'} - Expert Tips for Success [${new Date().getFullYear()} Guide]`;
          break;
        case 'description':
          result = `🔥 In this insightful video, we dive deep into ${videoData.name || 'important topics'} that will transform how you approach this subject.\n\n${videoData.description || ''}\n\n✅ KEY TIMESTAMPS:\n00:00 - Introduction\n01:30 - Core Concepts\n05:45 - Expert Tips\n10:20 - Case Studies\n15:30 - Practical Applications\n\n🔗 RESOURCES MENTIONED:\nOur website: https://example.com\nFree guide: https://example.com/guide\n\n#Educational #ExpertTips #2023Guide`;
          break;
        case 'tags':
          result = [
            'Educational', 
            'Expert Tips', 
            'How To Guide', 
            'Professional Development', 
            'Best Practices', 
            `${new Date().getFullYear()} Guide`, 
            'Training Video',
            'Learning Resources'
          ];
          break;
      }
      
      setGeneratedContent(result);
      setIsGenerating(false);
    }, 1500);
  };
  
  React.useEffect(() => {
    if (open) {
      generateContent();
    } else {
      // Reset state when dialog closes
      setGeneratedContent(contentType === 'tags' ? [] : '');
      setIsGenerating(false);
    }
  }, [open, contentType]);
  
  const handleUseContent = () => {
    onGenerated(generatedContent);
    onOpenChange(false);
  };
  
  const getTitle = () => {
    switch(contentType) {
      case 'title': return 'Generate SEO-Optimized Title';
      case 'description': return 'Generate SEO-Optimized Description';
      case 'tags': return 'Generate SEO-Optimized Tags';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          
          <div className="rounded-md border bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">AI-Powered Content Optimization</p>
            <p>Using Anthropic's AI capabilities to generate content designed for maximum YouTube algorithm performance, audience engagement, and search visibility.</p>
          </div>
          
          {isGenerating ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <Zap className="h-8 w-8 text-purple-500 mb-3" />
                <p className="text-sm text-muted-foreground">Generating optimized content...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border p-4 bg-white">
                {contentType === 'tags' ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(generatedContent) && generatedContent.map((tag, i) => (
                      <Badge key={i} className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="whitespace-pre-line">
                    {generatedContent as string}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleUseContent} className="bg-purple-600 hover:bg-purple-700">
                  Use This Content
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};