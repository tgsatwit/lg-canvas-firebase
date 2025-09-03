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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


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
  Eye,
  Filter,
  ListFilter,
  Pencil,
  Copy,
  Youtube,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";



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
    tags?: string[];
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
  linkedYouTubeVideoId?: string;
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
  onEditVideo,
  videos = [],
  isLoading = false,
  customActions,
  showSearchAndFilters = false,
}: {
  onEditVideo?: (video: Video) => void;
  videos?: Video[];
  isLoading?: boolean;
  customActions?: (video: Video) => React.ReactNode;
  showSearchAndFilters?: boolean;
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
      case "do not upload":
        return cn(baseClasses, "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400");
      default:
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
    }
  };

  const getYouTubeStatusBadgeClass = (status: string) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium";
    switch (status?.toLowerCase()) {
      case "published":
      case "published on youtube":
        return cn(baseClasses, "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400");
      case "draft":
      case "preparing for youtube":
        return cn(baseClasses, "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400");
      case "processing":
      case "ready for youtube":
        return cn(baseClasses, "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400");
      case "scheduled for youtube":
        return cn(baseClasses, "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400");
      case "do not upload":
        return cn(baseClasses, "bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400");
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
    } else if (youtubeStatus === 'do not upload') {
      return "Do Not Upload";
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
          <div className="relative h-20 w-36 overflow-hidden rounded-md">
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
            {customActions ? (
              customActions(video)
            ) : (
              <>
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
              </>
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
      {/* Search and Filter Bar */}
      {showSearchAndFilters && (
        <div className="bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  ref={inputRef}
                  placeholder="Search videos by title..."
                  value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("title")?.setFilterValue(event.target.value)
                  }
                  className="pl-10 h-9 border-gray-200 dark:border-gray-800"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-gray-200 dark:border-gray-800"
                  >
                    <ListFilter className="h-4 w-4 mr-2" />
                    Status
                    {selectedCustomStatuses.length > 0 && (
                      <div className="ml-2 flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-xs">
                        {selectedCustomStatuses.length}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filter by Status</Label>
                    <div className="space-y-2">
                      {uniqueCustomStatusValues.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={selectedCustomStatuses.includes(status)}
                            onCheckedChange={(checked) => handleCustomStatusChange(checked as boolean, status)}
                          />
                          <Label htmlFor={`status-${status}`} className="text-sm flex-1 cursor-pointer">
                            {status}
                          </Label>
                          <div className="text-xs text-gray-500">
                            {customStatusCounts.get(status) || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Visibility Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-gray-200 dark:border-gray-800"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visibility
                    {selectedVisibilities.length > 0 && (
                      <div className="ml-2 flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-xs">
                        {selectedVisibilities.length}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filter by Visibility</Label>
                    <div className="space-y-2">
                      {uniqueVisibilityValues.map((visibility) => (
                        <div key={visibility} className="flex items-center space-x-2">
                          <Checkbox
                            id={`visibility-${visibility}`}
                            checked={selectedVisibilities.includes(visibility)}
                            onCheckedChange={(checked) => handleVisibilityChange(checked as boolean, visibility)}
                          />
                          <Label htmlFor={`visibility-${visibility}`} className="text-sm flex-1 cursor-pointer">
                            {visibility}
                          </Label>
                          <div className="text-xs text-gray-500">
                            {visibilityCounts.get(visibility) || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* YouTube Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-gray-200 dark:border-gray-800"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    YouTube
                    {selectedYouTubeStatuses.length > 0 && (
                      <div className="ml-2 flex h-4 w-4 items-center justify-center rounded bg-primary text-primary-foreground text-xs">
                        {selectedYouTubeStatuses.length}
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filter by YouTube Status</Label>
                    <div className="space-y-2">
                      {uniqueYouTubeStatusValues.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`youtube-${status}`}
                            checked={selectedYouTubeStatuses.includes(status)}
                            onCheckedChange={(checked) => handleYouTubeStatusChange(checked as boolean, status)}
                          />
                          <Label htmlFor={`youtube-${status}`} className="text-sm flex-1 cursor-pointer">
                            {status}
                          </Label>
                          <div className="text-xs text-gray-500">
                            {youtubeStatusCounts.get(status) || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {(columnFilters.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.resetColumnFilters()}
                  className="h-9 border-gray-200 dark:border-gray-800"
                >
                  <CircleX className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{table.getSelectedRowModel().rows.length} videos selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <BulkConfirmDetailsDropdown 
                    selectedVideos={table.getSelectedRowModel().rows.map(row => row.original)}
                    onConfirmDetails={() => {
                      table.toggleAllPageRowsSelected(false);
                      window.location.reload(); // Refresh the data
                    }}
                  />
                  <BulkStatusUpdateDropdown 
                    selectedVideos={table.getSelectedRowModel().rows.map(row => row.original)}
                    onStatusUpdate={() => {
                      table.toggleAllPageRowsSelected(false);
                      window.location.reload(); // Refresh the data
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Summary */}
          {columnFilters.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Active filters:</span>
                {columnFilters.map((filter) => (
                  <Badge key={filter.id} variant="secondary" className="text-xs">
                    {filter.id === 'title' ? `Search: "${filter.value}"` : 
                     filter.id === 'customStatus' ? `Status: ${(filter.value as string[]).join(', ')}` :
                     filter.id === 'visibility' ? `Visibility: ${(filter.value as string[]).join(', ')}` :
                     filter.id === 'youtubeStatus' ? `YouTube: ${(filter.value as string[]).join(', ')}` :
                     `${filter.id}: ${filter.value}`}
                  </Badge>
                ))}
                <span className="ml-2">
                  Showing {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} videos
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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

// Bulk Confirm Details Component
interface BulkConfirmDetailsDropdownProps {
  selectedVideos: Video[];
  onConfirmDetails: () => void;
}

function BulkConfirmDetailsDropdown({ selectedVideos, onConfirmDetails }: BulkConfirmDetailsDropdownProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    yt_title: '',
    yt_description: '',
    yt_tags: [] as string[],
    yt_privacyStatus: 'private',
    yt_category: '26'
  });
  const [useOttTags, setUseOttTags] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const handleConfirmDetails = async () => {
    if (selectedVideos.length === 0) return;

    setIsConfirming(true);
    try {
      const videoIds = selectedVideos.map(video => video.id);
      
      // Prepare the request body
      const requestBody: any = {
        videoIds,
        useOttTags
      };

      // Only include global settings if they're provided
      if (globalSettings.yt_title || globalSettings.yt_description || tagsInput || globalSettings.yt_privacyStatus !== 'private') {
        requestBody.globalSettings = {
          ...globalSettings,
          yt_tags: tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : []
        };
      }

      const response = await fetch('/api/videos/bulk-confirm-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully confirmed details for ${result.summary.successful} videos!\n` +
              `Failed: ${result.summary.failed}`);
        setIsDialogOpen(false);
        onConfirmDetails();
      } else {
        const errorData = await response.json();
        alert(`Failed to confirm details: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error confirming details:', error);
      alert('Failed to confirm details. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Check if any selected video has OTT tags
  const hasOttTags = selectedVideos.some(video => 
    video.vimeoOttMetadata?.tags && video.vimeoOttMetadata.tags.length > 0
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Confirm Details ({selectedVideos.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Confirm YouTube Details</DialogTitle>
          <DialogDescription>
            Confirm YouTube details for {selectedVideos.length} selected videos. Leave fields empty to use individual video data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Copy OTT Tags Option */}
          {hasOttTags && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="use-ott-tags"
                checked={useOttTags}
                onCheckedChange={(checked) => setUseOttTags(checked as boolean)}
              />
              <Label htmlFor="use-ott-tags" className="text-sm font-medium">
                Copy YouTube tags from OTT metadata
              </Label>
            </div>
          )}

          {/* Global Title */}
          <div className="space-y-2">
            <Label htmlFor="global-title" className="text-sm font-medium">
              Global Title (optional)
            </Label>
            <Input
              id="global-title"
              placeholder="Leave empty to use individual video titles"
              value={globalSettings.yt_title}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, yt_title: e.target.value }))}
            />
          </div>

          {/* Global Description */}
          <div className="space-y-2">
            <Label htmlFor="global-description" className="text-sm font-medium">
              Global Description (optional)
            </Label>
            <Textarea
              id="global-description"
              placeholder="Leave empty to use individual video descriptions"
              value={globalSettings.yt_description}
              onChange={(e) => setGlobalSettings(prev => ({ ...prev, yt_description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Global Tags */}
          {!useOttTags && (
            <div className="space-y-2">
              <Label htmlFor="global-tags" className="text-sm font-medium">
                Global Tags (optional)
              </Label>
              <Input
                id="global-tags"
                placeholder="Comma-separated tags (e.g. tutorial, howto, tips)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          )}

          {/* Privacy Status */}
          <div className="space-y-2">
            <Label htmlFor="privacy-status" className="text-sm font-medium">
              Privacy Status
            </Label>
            <Select 
              value={globalSettings.yt_privacyStatus} 
              onValueChange={(value) => setGlobalSettings(prev => ({ ...prev, yt_privacyStatus: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDetails} disabled={isConfirming}>
            {isConfirming ? 'Confirming...' : `Confirm ${selectedVideos.length} Videos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Status Update Component
interface BulkStatusUpdateDropdownProps {
  selectedVideos: Video[];
  onStatusUpdate: () => void;
}

function BulkStatusUpdateDropdown({ selectedVideos, onStatusUpdate }: BulkStatusUpdateDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    if (selectedVideos.length === 0) return;

    const confirmed = confirm(`Update ${selectedVideos.length} videos to "${status}"?`);
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      const videoIds = selectedVideos.map(video => video.id);
      const response = await fetch('/api/videos/bulk-update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds, status })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully updated ${result.data.updatedCount} videos to "${status}"`);
        onStatusUpdate();
      } else {
        const errorData = await response.json();
        alert(`Failed to update videos: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating video statuses:', error);
      alert('Failed to update video statuses. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: 'Preparing for YouTube', label: 'Preparing for YouTube', color: 'bg-yellow-50 text-yellow-700' },
    { value: 'Ready for YouTube', label: 'Ready for YouTube', color: 'bg-blue-50 text-blue-700' },
    { value: 'Scheduled for YouTube', label: 'Scheduled for YouTube', color: 'bg-purple-50 text-purple-700' },
    { value: 'Published on YouTube', label: 'Published on YouTube', color: 'bg-green-50 text-green-700' },
    { value: 'Do Not Upload', label: 'Do Not Upload', color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating}>
          {isUpdating ? 'Updating...' : 'Update Status'}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Update {selectedVideos.length} videos to:</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusUpdate(option.value)}
            className="flex items-center gap-2"
          >
            <div className={`w-3 h-3 rounded-full ${option.color}`} />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 