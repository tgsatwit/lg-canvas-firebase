"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  // Remove AlertDialog imports since we're not using them anymore
  // AlertDialog,
  // AlertDialogCancel,
  // AlertDialogContent,
  // AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleX,
  Columns3,
  Eye,
  Filter,
  ListFilter,
  Pencil,
  Plus,
  Upload,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
  Video as VideoIcon,
  Youtube,
  Zap,
  BarChart,
  Target,
  Mail,
  Image,
  Twitter,
  Linkedin,
  Instagram,
  Check,
  Download,
  Play,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

// Add utility function to format time
const formatTime = (duration: string | number | undefined | null): string => {
  // Return empty string if no duration
  if (duration === undefined || duration === null) return "";
  
  // If already in "MM:SS" or "HH:MM:SS" format, return as is
  if (typeof duration === 'string' && duration.includes(':')) {
    return duration;
  }
  
  // Try to convert to seconds
  let seconds: number;
  try {
    seconds = typeof duration === 'string' ? parseInt(duration) : duration as number;
    if (isNaN(seconds)) return "";
  } catch (e) {
    return "";
  }
  
  // Format seconds to MM:SS or HH:MM:SS
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
};

// Extract duration from video object for display
const extractVideoDuration = (video: Video): string => {
  // Try different duration sources in order of preference
  const duration = 
    video.duration ||
    (video.videoMetadata && video.videoMetadata.duration) ||
    (video.vimeoOttMetadata && video.vimeoOttMetadata.duration) ||
    0;
    
  return formatTime(duration);
};

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
  transcript?: string;
  
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
};

// Custom filter function for multi-column searching
// Helper function to transform raw visibility values to display values
const transformVisibilityToDisplay = (rawValue: string): string => {
  if (rawValue === "-") return "-";
  const capitalizedValue = rawValue.charAt(0).toUpperCase() + rawValue.slice(1);
  return capitalizedValue === "Unlisted" ? "Members" : capitalizedValue;
};

const multiColumnFilterFn: FilterFn<Video> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.title}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Filter function for visibility filtering
const visibilityFilterFn: FilterFn<Video> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const rawVisibility = row.getValue(columnId) as string;
  const displayVisibility = transformVisibilityToDisplay(rawVisibility);
  return (filterValue as string[]).includes(displayVisibility);
};

// Filter function for status filtering
const statusFilterFn: FilterFn<Video> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const status = row.getValue(columnId) as string;
  return (filterValue as string[]).includes(status);
};

export function YouTubeTable({
  onCreateVideo,
  onEditVideo,
  videos = [],
  isLoading = false,
}: {
  onCreateVideo?: () => void;
  onEditVideo?: (video: Video) => void;
  videos?: Video[];
  isLoading?: boolean;
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  // Remove unused state
  // const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "title",
      desc: false,
    },
  ]);

  // Use the videos from props instead of mock data
  const [data, setData] = useState<Video[]>([]);
  
  // Update data when videos prop changes
  useEffect(() => {
    if (videos && videos.length > 0) {
      setData(videos);
    }
  }, [videos]);

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const updatedData = data.filter(
      (item) => !selectedRows.some((row) => row.original.id === item.id),
    );
    setData(updatedData);
    table.resetRowSelection();
  };

  const handleRowAction = (row: Row<Video>) => {
    // Only call onEditVideo but don't open local modal
    onEditVideo?.(row.original);
  };

  // Simplified badge styling (matches modal styling)
  const getStatusBadgeClass = (status: string) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium";
    switch (status?.toLowerCase()) {
      case "uploaded":
        return cn(baseClasses, "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400");
      case "scheduled":
        return cn(baseClasses, "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400");
      case "confirm details":
        return cn(baseClasses, "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400");
      case "not scheduled":
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
      default:
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
    }
  };

  const getYouTubeStatusBadgeClass = (status: string) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium";
    switch (status?.toLowerCase()) {
      case "published":
        return cn(baseClasses, "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400");
      case "draft":
        return cn(baseClasses, "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400");
      case "processing":
        return cn(baseClasses, "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400");
      default:
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
    }
  };

  const getVisibilityBadgeClass = (visibility: string) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium";
    switch (visibility?.toLowerCase()) {
      case "private":
        return cn(baseClasses, "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400");
      case "members":
        return cn(baseClasses, "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400");
      case "public":
        return cn(baseClasses, "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400");
      case "-":
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
      default:
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
    }
  };

  // Function to determine custom status based on video data (matches modal logic)
  const getCustomStatus = (video: Video): string => {
    // Use youtubeStatus as the primary driver for status determination
    const youtubeStatus = (video.youtubeStatus || '').toLowerCase();
    
    // Fallback checks for backward compatibility
    const hasYoutubeLink = !!(video.youtubeLink || video.youtubeUrl);
    const hasUploadScheduled = !!(video.scheduledUploadDate);
    const hasDetailsConfirmed = !!(video.yt_title);
    
    // Primary logic: Use youtubeStatus field (matching modal logic)
    if (youtubeStatus === 'published on youtube' || hasYoutubeLink) {
      return "Uploaded";
    } else if (youtubeStatus === 'scheduled for youtube' || hasUploadScheduled) {
      return "Scheduled";
    } else if (youtubeStatus === 'ready for youtube') {
      // When status is 'ready for youtube', details are confirmed and ready to schedule
      return "Not Scheduled";
    } else if (youtubeStatus === 'preparing for youtube' || !youtubeStatus) {
      // When status is 'preparing for youtube' or empty, need to confirm details
      // But check if details were confirmed via other fields for backward compatibility
      if (hasDetailsConfirmed && !youtubeStatus) {
        return "Not Scheduled"; // Legacy fallback
      } else {
        return "Confirm Details";
      }
    } else {
      // Fallback to legacy logic if youtubeStatus has an unexpected value
      if (hasDetailsConfirmed) {
        return "Not Scheduled";
      } else {
        return "Confirm Details";
      }
    }
  };

  // Function to get YouTube status from the video data
  const getYouTubeStatus = (video: Video): string => {
    return video.youtubeStatus || video.status || "Draft";
  };

  const columns: ColumnDef<Video>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Name",
      accessorKey: "title",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-28 overflow-hidden rounded-md">
            <img 
              src={row.original.thumbnail} 
              alt={row.getValue("title")} 
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
              {extractVideoDuration(row.original)}
            </div>
          </div>
          <div className="flex flex-col">
            <div 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleRowAction(row)}
            >
              {row.getValue("title")}
            </div>
          </div>
        </div>
      ),
      size: 300,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Status",
      accessorKey: "customStatus",
      cell: ({ row }) => {
        const customStatus = getCustomStatus(row.original);
        return (
          <div className={getStatusBadgeClass(customStatus)}>
            {customStatus}
          </div>
        );
      },
      size: 120,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || (filterValue as string[]).length === 0) return true;
        const customStatus = getCustomStatus(row.original);
        return (filterValue as string[]).includes(customStatus);
      },
    },
    {
      header: "YouTube Status",
      accessorKey: "youtubeStatus",
      cell: ({ row }) => {
        const youtubeStatus = getYouTubeStatus(row.original);
        return (
          <div className={getYouTubeStatusBadgeClass(youtubeStatus)}>
            {youtubeStatus}
          </div>
        );
      },
      size: 130,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || (filterValue as string[]).length === 0) return true;
        const youtubeStatus = getYouTubeStatus(row.original);
        return (filterValue as string[]).includes(youtubeStatus);
      },
    },
    {
      header: "Visibility",
      accessorKey: "visibility",
      cell: ({ row }) => {
        const visibility = row.getValue("visibility") as string;
        
        // Handle dash case
        if (visibility === "-") {
          return (
            <div className={getVisibilityBadgeClass("-")}>
              -
            </div>
          );
        }
        
        // Capitalize first letter for display
        const capitalizedVisibility = visibility.charAt(0).toUpperCase() + visibility.slice(1);
        
        // Map "Unlisted" to "Members" for display
        const displayVisibility = capitalizedVisibility === "Unlisted" ? "Members" : capitalizedVisibility;
        return (
          <div className={getVisibilityBadgeClass(displayVisibility)}>
            {displayVisibility}
          </div>
        );
      },
      size: 100,
      filterFn: visibilityFilterFn,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const video = row.original;
        const youtubeUrl = video.youtubeUrl || video.youtubeLink;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRowAction(row)}
              className="h-8"
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {youtubeUrl && (
              <Button
                size="sm"
                variant="outline"
                asChild
                className="h-8"
              >
                <a 
                  href={youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Youtube className="h-4 w-4 mr-1" />
                  YouTube
                </a>
              </Button>
            )}
          </div>
        );
      },
      size: 160,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  });

  // Get unique visibility values - transform raw values to display values
  const uniqueVisibilityValues = useMemo(() => {
    const visibilityColumn = table.getColumn("visibility");
    if (!visibilityColumn) return [];
    const rawValues = Array.from(visibilityColumn.getFacetedUniqueValues().keys());
    const displayValues = rawValues.map(transformVisibilityToDisplay);
    return Array.from(new Set(displayValues)).sort();
  }, [table.getColumn("visibility")?.getFacetedUniqueValues()]);

  // Get visibility counts - transform raw values to display values
  const visibilityCounts = useMemo(() => {
    const visibilityColumn = table.getColumn("visibility");
    if (!visibilityColumn) return new Map();
    const rawCounts = visibilityColumn.getFacetedUniqueValues();
    const displayCounts = new Map<string, number>();
    
    rawCounts.forEach((count, rawValue) => {
      const displayValue = transformVisibilityToDisplay(rawValue);
      displayCounts.set(displayValue, (displayCounts.get(displayValue) || 0) + count);
    });
    
    return displayCounts;
  }, [table.getColumn("visibility")?.getFacetedUniqueValues()]);

  const selectedVisibilities = useMemo(() => {
    const filterValue = table.getColumn("visibility")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("visibility")?.getFilterValue()]);

  const handleVisibilityChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("visibility")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("visibility")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Get unique custom status values
  const uniqueCustomStatusValues = useMemo(() => {
    const customStatusValues = data.map(video => getCustomStatus(video));
    return Array.from(new Set(customStatusValues)).sort();
  }, [data]);

  // Get custom status counts
  const customStatusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.forEach(video => {
      const status = getCustomStatus(video);
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    return counts;
  }, [data]);

  const selectedCustomStatuses = useMemo(() => {
    const filterValue = table.getColumn("customStatus")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("customStatus")?.getFilterValue()]);

  const handleCustomStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("customStatus")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("customStatus")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Get unique YouTube status values
  const uniqueYouTubeStatusValues = useMemo(() => {
    const youtubeStatusValues = data.map(video => getYouTubeStatus(video));
    return Array.from(new Set(youtubeStatusValues)).sort();
  }, [data]);

  // Get YouTube status counts
  const youtubeStatusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data.forEach(video => {
      const status = getYouTubeStatus(video);
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    return counts;
  }, [data]);

  const selectedYouTubeStatuses = useMemo(() => {
    const filterValue = table.getColumn("youtubeStatus")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("youtubeStatus")?.getFilterValue()]);

  const handleYouTubeStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("youtubeStatus")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("youtubeStatus")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Add the CopyButton component near the top of the file
  function CopyButton({ text }: { text: string }) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => navigator.clipboard.writeText(text)}
      >
        <Copy className="h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="space-y-6 w-full">

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter by title */}
          <div className="relative flex-1 min-w-[200px]">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer w-full ps-9 rounded-lg border-gray-200 dark:border-gray-800 focus:ring-purple-500",
                Boolean(table.getColumn("title")?.getFilterValue()) && "pe-9",
              )}
              value={(table.getColumn("title")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
              placeholder="Search videos..."
              type="text"
              aria-label="Filter by title"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("title")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("title")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          
          {/* Filter buttons with updated styling */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                Status
                {selectedCustomStatuses.length > 0 && (
                  <span className="ml-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs font-medium">
                    {selectedCustomStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Status</div>
                <div className="space-y-3">
                  {uniqueCustomStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-status-${i}`}
                        checked={selectedCustomStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleCustomStatusChange(checked, value)}
                      />
                      <Label
                        htmlFor={`${id}-status-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {customStatusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                YouTube Status
                {selectedYouTubeStatuses.length > 0 && (
                  <span className="ml-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs font-medium">
                    {selectedYouTubeStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">YouTube Status</div>
                <div className="space-y-3">
                  {uniqueYouTubeStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-youtube-status-${i}`}
                        checked={selectedYouTubeStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleYouTubeStatusChange(checked, value)}
                      />
                      <Label
                        htmlFor={`${id}-youtube-status-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {youtubeStatusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                Visibility
                {selectedVisibilities.length > 0 && (
                  <span className="ml-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs font-medium">
                    {selectedVisibilities.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Visibility</div>
                <div className="space-y-3">
                  {uniqueVisibilityValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-visibility-${i}`}
                        checked={selectedVisibilities.includes(value)}
                        onCheckedChange={(checked: boolean) => handleVisibilityChange(checked, value)}
                      />
                      <Label
                        htmlFor={`${id}-visibility-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value === "Unlisted" ? "Members" : value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {visibilityCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Columns visibility with same styling */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Columns3 className="mr-2 h-4 w-4" aria-hidden="true" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Upload Button */}
        {onCreateVideo && (
          <div className="flex justify-end">
            <Button
              onClick={onCreateVideo}
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm overflow-hidden">
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-gray-200 dark:border-gray-800">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 0 ? `${header.getSize()}px` : undefined }}
                        className="h-11 text-gray-600 dark:text-gray-400 font-medium"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                "flex h-full cursor-pointer select-none items-center gap-2",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (
                                header.column.getCanSort() &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }}
                            tabIndex={header.column.getCanSort() ? 0 : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: (
                                <ChevronUp
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              ),
                              desc: (
                                <ChevronDown
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              ),
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No videos found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination with updated styling */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="hidden md:inline-block text-sm text-gray-600 dark:text-gray-400">
            Videos per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger id={id} className="h-9 w-[70px] border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-gray-200 dark:border-gray-800 disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirst className="h-4 w-4" aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-gray-200 dark:border-gray-800 disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-gray-200 dark:border-gray-800 disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-gray-200 dark:border-gray-800 disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLast className="h-4 w-4" aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
} 