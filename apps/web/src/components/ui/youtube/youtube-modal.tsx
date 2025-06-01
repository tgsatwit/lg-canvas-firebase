'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Youtube, Globe, X, Info, FileVideo, Clock,
  Video, Copy, Check, Download, ExternalLink, Database, 
  ImageIcon, Tag, Calendar, AlertCircle, PlayCircle,
  Zap
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
          <DialogContent className="max-w-[90vw] w-full max-h-[90vh] p-0">
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

const VideoEditorTabs = ({ videoData }: { videoData?: any }) => {
  // Helper to pick first non-nullish value
  const pick = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null);

  // Deep debugging of the exact data structure
  console.log("Raw videoData (stringified):", JSON.stringify(videoData, null, 2));
  
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
          console.log(`Found nested ${fieldName} data via property name matching:`, nestedObj);
          return nestedObj;
        }
      }
    }
    
    // If still not found, check field_types to see if it exists but is null
    if (data && data.field_types && data.field_types[fieldName]) {
      console.log(`Field ${fieldName} exists in field_types but not in data`);
    }
    
    return null;
  };
  
  const data: VideoData = React.useMemo(() => {
    // Extract metadata from possible naming variants with better logging
    console.log("VideoData structure keys:", Object.keys(videoData || {}));

    // Try to extract Vimeo metadata with multiple approaches
    const vimeoMetadata = pick(
      videoData.videoMetadata,
      videoData.vimeoMetadata,
      videoData.vimeo_metadata,
      extractFirestoreData(videoData, 'vimeo_metadata'),
      extractFirestoreData(videoData, 'videoMetadata')
    ) || null;
    
    console.log("Extracted vimeoMetadata:", vimeoMetadata);

    // Try to extract Vimeo OTT metadata with multiple approaches
    const vimeoOttMetadataRaw = pick(
      videoData.vimeoOttMetadata,
      videoData.vimeo_ott_metadata,
      extractFirestoreData(videoData, 'vimeo_ott_metadata'),
      extractFirestoreData(videoData, 'vimeoOttMetadata')
    );

    const vimeoOttMetadata = vimeoOttMetadataRaw || null;
    console.log("Extracted vimeoOttMetadata:", vimeoOttMetadata);

    // Also try to directly access duration fields that might exist at the root level
    const directDuration = pick(
      videoData.duration,
      videoData.video_duration,
      videoData.vimeo_duration,
      videoData.vimeo_metadata_duration,
      videoData.vimeo_ott_metadata_duration
    );

    console.log("Direct duration value:", directDuration);

    // Normalize Vimeo metadata structure so the UI can reliably render it
    let normalizedVimeoMetadata: any = vimeoMetadata || null;

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
    let normalizedVimeoOttMetadata: any = vimeoOttMetadata || null;

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
      youtubeStatus: videoData.youtubeStatus || videoData.youtube_status || videoData.status || "preparing for youtube",
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
                (normalizedVimeoOttMetadata.thumbnail as any)?.uri)) || ''
    };
    
    // If we don't have metadata but have an ID, create minimal metadata
    if (!mappedData.videoMetadata && videoData.vimeoId) {
      console.log("Creating minimal videoMetadata from vimeoId");
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
      console.log("Creating minimal vimeoOttMetadata from vimeoOttId");
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
    
    console.log("Final mapped vimeoOttMetadata:", mappedData.vimeoOttMetadata);
    
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

  const tabs: TabData[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <Info className="h-4 w-4" />,
      content: (
        <ScrollArea className="h-full max-h-[calc(90vh-48px)]">
          <div className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - Video preview and basic info */}
              <div className="flex-1 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">{data.name || "Untitled Video"}</h2>
                    {(() => {
                      const status = (data.youtubeStatus || '').toLowerCase();
                      const statusBadgeStyles: Record<string, { bg: string; text: string; border: string; icon?: React.ReactNode }> = {
                        'preparing for youtube': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
                        'ready for youtube': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                        'scheduled for youtube': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                        'published on youtube': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
                      };

                      const st = statusBadgeStyles[status];
                      if (!st) return null;
                      return (
                        <Badge variant="outline" className={`${st.bg} ${st.text} ${st.border} capitalize`}>
                          {status}
                        </Badge>
                      );
                    })()}
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
                  const status = (data.youtubeStatus || '').toLowerCase();

                  const statusStyles: Record<string, {
                    bg: string;
                    border: string;
                    text: string;
                    icon: string;
                  }> = {
                    'preparing for youtube': {
                      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
                      border: 'border-yellow-200 dark:border-yellow-900',
                      text: 'text-yellow-700 dark:text-yellow-400',
                      icon: 'text-yellow-600 dark:text-yellow-400'
                    },
                    'ready for youtube': {
                      bg: 'bg-blue-50 dark:bg-blue-950/20',
                      border: 'border-blue-200 dark:border-blue-900',
                      text: 'text-blue-700 dark:text-blue-400',
                      icon: 'text-blue-600 dark:text-blue-400'
                    },
                    'scheduled for youtube': {
                      bg: 'bg-purple-50 dark:bg-purple-950/20',
                      border: 'border-purple-200 dark:border-purple-900',
                      text: 'text-purple-700 dark:text-purple-400',
                      icon: 'text-purple-600 dark:text-purple-400'
                    },
                    'published on youtube': {
                      bg: 'bg-green-50 dark:bg-green-950/20',
                      border: 'border-green-200 dark:border-green-900',
                      text: 'text-green-700 dark:text-green-400',
                      icon: 'text-green-600 dark:text-green-400'
                    }
                  };

                  const styles = statusStyles[status] || statusStyles['preparing for youtube'];

                  const renderActionButton = () => {
                    switch (status) {
                      case 'preparing for youtube':
                        return (
                          <Button size="sm" className="mt-3 bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-950/70">
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Mark Ready
                          </Button>
                        );
                      case 'ready for youtube':
                        return (
                          <Button size="sm" className="mt-3 bg-white text-blue-700 border-blue-300 hover:bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/70">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            Schedule Upload
                          </Button>
                        );
                      case 'scheduled for youtube':
                        return (
                          <Button size="sm" className="mt-3 bg-white text-purple-700 border-purple-300 hover:bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950/70">
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Mark Published
                          </Button>
                        );
                      default:
                        return null;
                    }
                  };

                  return (
                    <div className={`rounded-lg p-4 ${styles.bg} border ${styles.border}`}>
                      <div className="flex items-center">
                        <Youtube className={`h-5 w-5 mr-2 ${styles.icon}`} />
                        <h3 className={`font-medium ${styles.text}`}>YouTube Status</h3>
                      </div>
                      <p className={`mt-1 text-sm ${styles.text} capitalize`}>{status}</p>
                      {renderActionButton()}
                    </div>
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
                    
                    {data.videoMetadata?.link && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <Video className="h-3 w-3 mr-1" />
                          Vimeo Link
                        </Label>
                        <a 
                          href={data.videoMetadata.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between text-xs border rounded-md px-3 py-2 text-primary hover:bg-primary/5 transition-colors group"
                        >
                          <span className="truncate mr-2">Open in Vimeo</span>
                          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                      </div>
                    )}
                    
                    {data.vimeoOttMetadata?.link && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <FileVideo className="h-3 w-3 mr-1" />
                          Vimeo OTT Link
                        </Label>
                        <a 
                          href={data.vimeoOttMetadata.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between text-xs border rounded-md px-3 py-2 text-primary hover:bg-primary/5 transition-colors group"
                        >
                          <span className="truncate mr-2">Open in Vimeo OTT</span>
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
          </div>
        </ScrollArea>
      )
    },
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
                    {data.vimeoOttMetadata?.link && (
                      <div className="flex items-center gap-3">
                        <Label className="text-xs text-muted-foreground w-24">Vimeo OTT Link</Label>
                        <a href={data.vimeoOttMetadata?.link || ''} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          Open on Vimeo OTT <ExternalLink className="h-3 w-3" />
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
    {
      id: "youtube",
      label: "YouTube",
      icon: <Youtube className="h-4 w-4" />,
      content: (
        <ScrollArea className="h-full max-h-[calc(90vh-48px)]">
          <YouTubeTabContent videoData={data} />
        </ScrollArea>
      )
    },
  ];

  return (
    <Tabs defaultValue="overview" className="h-full">
      <div className="border-b sticky top-0 bg-background z-10">
        <TabsList className="w-full flex justify-start px-1 border-b-0 rounded-none bg-transparent h-12">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id}
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent py-3 px-4 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent hover:bg-muted/50"
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0 outline-none">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

// YouTube tab content component
function YouTubeTabContent({ videoData }: { videoData: VideoData }) {
  // AI Dialog state
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [aiDialogType, setAiDialogType] = React.useState<'title' | 'description' | 'tags'>('title');
  
  // Content state
  const [youtubeTitle, setYoutubeTitle] = React.useState(
    videoData.name || videoData.videoMetadata?.name || videoData.vimeoOttMetadata?.title || ""
  );
  const [youtubeDescription, setYoutubeDescription] = React.useState(
    videoData.videoMetadata?.description || videoData.vimeoOttMetadata?.description || ""
  );
  const [youtubeTags, setYoutubeTags] = React.useState<string[]>(
    videoData.vimeoOttMetadata?.tags || []
  );
  const [tagInput, setTagInput] = React.useState("");
  
  // Handle tag operations
  const handleAddTag = () => {
    if (tagInput.trim()) {
      setYoutubeTags([...youtubeTags, tagInput.trim()]);
      setTagInput("");
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
  
  // Copy from other tabs
  const copyFromVimeo = (contentType: 'title' | 'description') => {
    if (contentType === 'title') {
      setYoutubeTitle(videoData.videoMetadata?.name || "");
    } else if (contentType === 'description') {
      setYoutubeDescription(videoData.videoMetadata?.description || "");
    }
  };
  
  const copyFromVimeoOtt = (contentType: 'title' | 'description' | 'tags') => {
    if (contentType === 'title') {
      setYoutubeTitle(videoData.vimeoOttMetadata?.title || "");
    } else if (contentType === 'description') {
      setYoutubeDescription(videoData.vimeoOttMetadata?.description || "");
    } else if (contentType === 'tags') {
      setYoutubeTags(videoData.vimeoOttMetadata?.tags || []);
    }
  };
  
  // Open AI dialog
  const openAiDialog = (type: 'title' | 'description' | 'tags') => {
    setAiDialogType(type);
    setAiDialogOpen(true);
  };
  
  const getYoutubeStatusUI = () => {
    const status = (videoData.youtubeStatus || '').toLowerCase();
    
    switch (status) {
      case 'preparing for youtube':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950/20 dark:border-yellow-900">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">Preparing for YouTube</h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                  This video is currently being prepared for YouTube. Update metadata and mark it ready when finished.
                </p>
              </div>
            </div>
          </div>
        );
      case 'ready for youtube':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-900">
            <div className="flex items-start">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-400">Ready for YouTube</h4>
                <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                  This video is ready to be scheduled for upload.
                </p>
              </div>
            </div>
          </div>
        );
      case 'scheduled for youtube':
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 dark:bg-purple-950/20 dark:border-purple-900">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-purple-700 dark:text-purple-400">Scheduled for YouTube</h4>
                <p className="text-sm text-purple-600 dark:text-purple-500 mt-1">
                  This video has been scheduled for upload on YouTube.
                </p>
              </div>
            </div>
          </div>
        );
      case 'published on youtube':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/20 dark:border-green-900">
            <div className="flex items-start">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" />
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-400">Published on YouTube</h4>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  This video is live on YouTube.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
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
      
      {getYoutubeStatusUI()}
      
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
              >
                <FileVideo className="h-3 w-3 mr-1" />
                Copy from OTT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                onClick={() => openAiDialog('description')}
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
              >
                <FileVideo className="h-3 w-3 mr-1" />
                Copy from OTT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                onClick={() => openAiDialog('tags')}
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
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveTag(i)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              id="youtube-tags" 
              placeholder="Add tags (press Enter to add)" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyPress}
            />
            <Button variant="outline" size="sm" onClick={handleAddTag}>Add</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Separate tags with commas. Include relevant keywords to improve discoverability.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="youtube-category">YouTube Category</Label>
          <Select defaultValue="education">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="entertainment">Entertainment</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="tech">Science & Technology</SelectItem>
              <SelectItem value="howto">How-to & Style</SelectItem>
              <SelectItem value="gaming">Gaming</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="youtube-visibility">YouTube Visibility</Label>
          <Select defaultValue="public">
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="youtube-comments" className="flex items-center gap-2">
              Allow comments
            </Label>
            <Switch id="youtube-comments" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="youtube-embed" className="flex items-center gap-2">
              Allow embedding
            </Label>
            <Switch id="youtube-embed" defaultChecked />
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end gap-3">
        <Button variant="outline">Save as Draft</Button>
        <Button>Publish to YouTube</Button>
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

export const AIGenerateDialog = ({
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