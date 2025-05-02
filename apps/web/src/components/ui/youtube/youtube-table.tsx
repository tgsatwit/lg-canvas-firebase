"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  CircleAlert,
  CircleX,
  Columns3,
  Ellipsis,
  Eye,
  Filter,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  Share2,
  Trash,
  Upload,
  Copy,
  ExternalLink,
  FileText,
  Link,
  MessageSquare,
  Tag,
  ThumbsUp,
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
  MoreHorizontal,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Calendar as CalendarIcon,
  Check,
  Download,
  User,
  Play,
} from "lucide-react";

type Video = {
  id: string;
  title: string;
  thumbnail: string;
  visibility: "Public" | "Private" | "Unlisted";
  uploadDate: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  status: "Published" | "Draft" | "Processing";
  description?: string;
  youtubeDescription?: string;
  youtubeUploaded?: boolean;
  youtubeUrl?: string;
  youtubeUploadDate?: string;
  scheduledUploadDate?: string;
  vimeoId?: string;
  vimeoTags?: string[];
  vimeoCategories?: string[];
  storageUrl?: string;
  fileType?: string;
  fileSize?: string;
  transcript?: string;
};

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Video> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.title}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Filter function for visibility filtering
const visibilityFilterFn: FilterFn<Video> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const visibility = row.getValue(columnId) as string;
  return (filterValue as string[]).includes(visibility);
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
}: {
  onCreateVideo?: () => void;
  onEditVideo?: (video: Video) => void;
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "views",
      desc: true,
    },
  ]);

  const [data, setData] = useState<Video[]>([
    {
      id: "v1d3o-001",
      title: "How to Build a React Component Library",
      thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Public",
      uploadDate: "2023-10-15",
      views: 12543,
      likes: 1243,
      comments: 89,
      duration: "12:34",
      status: "Published",
    },
    {
      id: "v1d3o-002",
      title: "Advanced TypeScript Tips for React Developers",
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Public",
      uploadDate: "2023-11-02",
      views: 8765,
      likes: 765,
      comments: 42,
      duration: "18:22",
      status: "Published",
    },
    {
      id: "v1d3o-003",
      title: "Building a SaaS Application from Scratch",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Private",
      uploadDate: "2023-12-01",
      views: 0,
      likes: 0,
      comments: 0,
      duration: "32:10",
      status: "Draft",
    },
    {
      id: "v1d3o-004",
      title: "Next.js 14 Full Course - Server Components, App Router, and More",
      thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Unlisted",
      uploadDate: "2023-12-10",
      views: 3421,
      likes: 421,
      comments: 32,
      duration: "1:24:56",
      status: "Published",
    },
    {
      id: "v1d3o-005",
      title: "Tailwind CSS Masterclass - From Beginner to Expert",
      thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Public",
      uploadDate: "2024-01-05",
      views: 7654,
      likes: 876,
      comments: 54,
      duration: "45:21",
      status: "Published",
    },
    {
      id: "v1d3o-006",
      title: "State Management in 2024 - Redux vs. Context vs. Zustand",
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Public",
      uploadDate: "2024-01-20",
      views: 5432,
      likes: 432,
      comments: 21,
      duration: "28:45",
      status: "Published",
    },
    {
      id: "v1d3o-007",
      title: "Building a Custom Video Player with React",
      thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Unlisted",
      uploadDate: "2024-02-01",
      views: 2134,
      likes: 187,
      comments: 14,
      duration: "22:18",
      status: "Published",
    },
    {
      id: "v1d3o-008",
      title: "Introduction to Web3 Development",
      thumbnail: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      visibility: "Private",
      uploadDate: "2024-02-15",
      views: 0,
      likes: 0,
      comments: 0,
      duration: "15:42",
      status: "Processing",
    },
  ]);

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const updatedData = data.filter(
      (item) => !selectedRows.some((row) => row.original.id === item.id),
    );
    setData(updatedData);
    table.resetRowSelection();
  };

  const handleRowAction = (row: Row<Video>) => {
    setSelectedVideo(row.original);
    setIsModalOpen(true);
    onEditVideo?.(row.original);
  };

  function RowActions({ row }: { row: Row<Video> }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button size="icon" variant="ghost" className="shadow-none" aria-label="Video actions">
              <MoreVertical size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleRowAction(row)}>
            View details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simplified badge styling
  const getStatusBadgeClass = (status: string) => {
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
    switch (visibility) {
      case "Private":
        return cn(baseClasses, "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400");
      case "Unlisted":
        return cn(baseClasses, "bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400");
      case "Public":
        return cn(baseClasses, "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400");
      default:
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
    }
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
      header: "Video",
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
              {row.original.duration}
            </div>
          </div>
          <div className="flex flex-col">
            <div 
              className="font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => handleRowAction(row)}
            >
              {row.getValue("title")}
            </div>
            <div className="text-xs text-muted-foreground">ID: {row.original.id}</div>
          </div>
        </div>
      ),
      size: 300,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className={getStatusBadgeClass(status)}>
            {status}
          </div>
        );
      },
      size: 100,
      filterFn: statusFilterFn,
    },
    {
      header: "Visibility",
      accessorKey: "visibility",
      cell: ({ row }) => {
        const visibility = row.getValue("visibility") as string;
        return (
          <div className={getVisibilityBadgeClass(visibility)}>
            {visibility}
          </div>
        );
      },
      size: 100,
      filterFn: visibilityFilterFn,
    },
    {
      header: "Date",
      accessorKey: "uploadDate",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("uploadDate")}</div>;
      },
      size: 120,
    },
    {
      header: "Views",
      accessorKey: "views",
      cell: ({ row }) => {
        const views = row.getValue("views") as number;
        return <div className="text-sm text-right">{views.toLocaleString()}</div>;
      },
      size: 80,
    },
    {
      header: "Likes",
      accessorKey: "likes",
      cell: ({ row }) => {
        const likes = row.getValue("likes") as number;
        return <div className="text-sm text-right">{likes.toLocaleString()}</div>;
      },
      size: 80,
    },
    {
      header: "Comments",
      accessorKey: "comments",
      cell: ({ row }) => {
        const comments = row.getValue("comments") as number;
        return <div className="text-sm text-right">{comments.toLocaleString()}</div>;
      },
      size: 100,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions row={row} />,
      size: 60,
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

  // Get unique visibility values
  const uniqueVisibilityValues = useMemo(() => {
    const visibilityColumn = table.getColumn("visibility");
    if (!visibilityColumn) return [];
    const values = Array.from(visibilityColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table.getColumn("visibility")?.getFacetedUniqueValues()]);

  // Get visibility counts
  const visibilityCounts = useMemo(() => {
    const visibilityColumn = table.getColumn("visibility");
    if (!visibilityColumn) return new Map();
    return visibilityColumn.getFacetedUniqueValues();
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

  // Get unique status values
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn("status");
    if (!statusColumn) return [];
    const values = Array.from(statusColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table.getColumn("status")?.getFacetedUniqueValues()]);

  // Get status counts
  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn("status");
    if (!statusColumn) return new Map();
    return statusColumn.getFacetedUniqueValues();
  }, [table.getColumn("status")?.getFacetedUniqueValues()]);

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("status")?.getFilterValue()]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("status")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
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
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-900/10 dark:to-purple-800/10 p-8 rounded-2xl">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-50 to-purple-100">Video Library</h1>
          <p className="text-muted-foreground text-purple-200 mt-1">Manage and optimize your video content</p>
        </div>
        <Button onClick={onCreateVideo} size="lg" className="bg-white hover:bg-purple-100 text-purple-700 w-full md:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </div>

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
                        {value}{" "}
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
          
          {/* Status filter with same styling */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="ml-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs font-medium">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Status</div>
                <div className="space-y-3">
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-status-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) => handleStatusChange(checked, value)}
                      />
                      <Label
                        htmlFor={`${id}-status-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {statusCounts.get(value)}
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
      
      {/* Video Details Modal */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-[1200px] h-[90vh] p-0 overflow-hidden">
          {selectedVideo && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6">
                <div className="flex flex-col">
                  <AlertDialogTitle className="text-xl font-semibold">
                    {selectedVideo.title}
                  </AlertDialogTitle>
                  <p className="text-sm text-muted-foreground">Last modified: {selectedVideo.uploadDate}</p>
                </div>
                <AlertDialogCancel className="h-8 w-8 p-0">×</AlertDialogCancel>
              </div>

              <Tabs defaultValue="overview" className="flex-1">
                <div className="px-2 flex flex-col h-full">
                  <TabsList className="w-full justify-start rounded-none p-0 h-12 bg-transparent">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">Overview</TabsTrigger>
                    <TabsTrigger value="thumbnails" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">Thumbnails</TabsTrigger>
                    <TabsTrigger value="content" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">Content</TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">Analytics</TabsTrigger>
                    <TabsTrigger value="ai-tools" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">AI Tools</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      {/* Overview Tab */}
                      <TabsContent value="overview" className="mt-0 space-y-6 animate-in fade-in-50 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Video Preview Section */}
                          <div className="space-y-4">
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                              <img 
                                src={selectedVideo.thumbnail} 
                                alt={selectedVideo.title} 
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Button variant="outline" className="bg-background/90">
                                  <Play className="h-4 w-4 mr-2" />
                                  Preview Video
                                </Button>
                              </div>
                              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                                {selectedVideo.duration}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">File Details</h3>
                                <div className="space-y-1">
                                  <div className="text-sm">Type: {selectedVideo.fileType || "MP4"}</div>
                                  <div className="text-sm">Size: {selectedVideo.fileSize || "Unknown"}</div>
                                  <div className="text-sm">Duration: {selectedVideo.duration}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Storage</h3>
                                <div className="space-y-1">
                                  <div className="text-sm">ID: {selectedVideo.id}</div>
                                  <div className="text-sm flex items-center gap-1">
                                    Status: <Badge variant="outline" className={getStatusBadgeClass(selectedVideo.status)}>{selectedVideo.status}</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Video Details Section */}
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Video Details</h3>
                                <Button variant="outline" size="sm">
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Details
                                </Button>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="relative group">
                                  <Label>Title</Label>
                                  <Input value={selectedVideo.title} readOnly className="mt-1.5" />
                                  <CopyButton text={selectedVideo.title} />
                                </div>
                                
                                <div className="relative group">
                                  <Label>Description</Label>
                                  <Textarea 
                                    value={selectedVideo.description || "No description available."} 
                                    readOnly 
                                    className="mt-1.5 min-h-[100px]"
                                  />
                                  <CopyButton text={selectedVideo.description || "No description available."} />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Visibility</Label>
                                    <Select defaultValue={selectedVideo.visibility.toLowerCase()}>
                                      <SelectTrigger className="mt-1.5">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="unlisted">Unlisted</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Upload Date</Label>
                                    <Input value={selectedVideo.uploadDate} readOnly className="mt-1.5" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                              <h3 className="text-lg font-medium">Analytics Overview</h3>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="bg-muted/30 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Views</span>
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="text-2xl font-semibold">{selectedVideo.views.toLocaleString()}</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Likes</span>
                                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="text-2xl font-semibold">{selectedVideo.likes.toLocaleString()}</div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Comments</span>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div className="text-2xl font-semibold">{selectedVideo.comments.toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Content Tab */}
                      <TabsContent value="content" className="mt-0 space-y-6 animate-in fade-in-50 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Transcript Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium">Transcript</h3>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            </div>
                            
                            <div className="border rounded-lg p-4">
                              <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4">
                                  {selectedVideo.transcript ? (
                                    <p className="whitespace-pre-line text-sm">
                                      {selectedVideo.transcript}
                                    </p>
                                  ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p>No transcript available</p>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>

                          {/* Content Management */}
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium mb-4">Content Management</h3>
                              <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                  <h4 className="text-sm font-medium mb-2">Chapters</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input placeholder="00:00" className="w-24" />
                                      <Input placeholder="Chapter title" />
                                      <Button variant="ghost" size="icon">
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                  <h4 className="text-sm font-medium mb-2">Cards</h4>
                                  <div className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Card
                                    </Button>
                                  </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                  <h4 className="text-sm font-medium mb-2">End Screen</h4>
                                  <div className="space-y-2">
                                    <Button variant="outline" className="w-full justify-start">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add End Screen Element
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium mb-4">Captions</h3>
                              <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-medium">Available Languages</h4>
                                  <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Language
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between py-2 border-b">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">EN</Badge>
                                      <span className="text-sm">English</span>
                                    </div>
                                    <Button variant="ghost" size="sm">Edit</Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Thumbnails Tab */}
                      <TabsContent value="thumbnails" className="mt-0 space-y-6 animate-in fade-in-50 duration-500">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Thumbnail Management</h3>
                            <Button>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Source Image
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Source Image */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Source Image</h4>
                              <div className="border rounded-lg p-4">
                                <div className="aspect-[16/9] bg-muted rounded-lg overflow-hidden">
                                  <img 
                                    src={selectedVideo.thumbnail} 
                                    alt="Source thumbnail" 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <div className="text-sm text-muted-foreground">
                                    Original size: 1920x1080
                                  </div>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Generated Thumbnails */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Generated Thumbnails</h4>
                                <Button variant="outline" size="sm">
                                  <Zap className="h-4 w-4 mr-2" />
                                  Generate All
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {/* YouTube */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Youtube className="h-4 w-4" />
                                      <span className="text-sm font-medium">YouTube (1280x720)</span>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                </div>

                                {/* Twitter */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Twitter className="h-4 w-4" />
                                      <span className="text-sm font-medium">Twitter (1200x675)</span>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                </div>

                                {/* LinkedIn */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Linkedin className="h-4 w-4" />
                                      <span className="text-sm font-medium">LinkedIn (1200x627)</span>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                </div>

                                {/* Instagram */}
                                <div className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Instagram className="h-4 w-4" />
                                      <span className="text-sm font-medium">Instagram (1080x1080)</span>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Analytics Tab */}
                      <TabsContent value="analytics" className="mt-0 space-y-6 animate-in fade-in-50 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Overview Cards */}
                          <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-muted/30 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Total Views</span>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="text-2xl font-semibold">{selectedVideo.views.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground mt-1">+12% from last month</div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Engagement Rate</span>
                                <Target className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="text-2xl font-semibold">8.2%</div>
                              <div className="text-sm text-muted-foreground mt-1">+2.1% from last month</div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Watch Time</span>
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="text-2xl font-semibold">4.5K hrs</div>
                              <div className="text-sm text-muted-foreground mt-1">+8% from last month</div>
                            </div>
                          </div>

                          {/* Detailed Stats */}
                          <div className="lg:col-span-2 space-y-6">
                            <div className="border rounded-lg p-4">
                              <h3 className="text-sm font-medium mb-4">Performance Over Time</h3>
                              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Performance chart will be displayed here</p>
                              </div>
                            </div>
                            <div className="border rounded-lg p-4">
                              <h3 className="text-sm font-medium mb-4">Audience Retention</h3>
                              <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-lg">
                                <p className="text-sm text-muted-foreground">Retention graph will be displayed here</p>
                              </div>
                            </div>
                          </div>

                          {/* Demographics */}
                          <div className="space-y-6">
                            <div className="border rounded-lg p-4">
                              <h3 className="text-sm font-medium mb-4">Viewer Demographics</h3>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Age 18-24</span>
                                    <span>35%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full">
                                    <div className="h-full w-[35%] bg-primary rounded-full"></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Age 25-34</span>
                                    <span>45%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full">
                                    <div className="h-full w-[45%] bg-primary rounded-full"></div>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Age 35-44</span>
                                    <span>20%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full">
                                    <div className="h-full w-[20%] bg-primary rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border rounded-lg p-4">
                              <h3 className="text-sm font-medium mb-4">Top Countries</h3>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">United States</span>
                                  <span className="text-sm text-muted-foreground">45%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">United Kingdom</span>
                                  <span className="text-sm text-muted-foreground">15%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Canada</span>
                                  <span className="text-sm text-muted-foreground">12%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Australia</span>
                                  <span className="text-sm text-muted-foreground">8%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Germany</span>
                                  <span className="text-sm text-muted-foreground">6%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* AI Tools Tab */}
                      <TabsContent value="ai-tools" className="mt-0 space-y-6 animate-in fade-in-50 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* AI Generation Tools */}
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-medium mb-4">Content Generation</h3>
                              <div className="space-y-4">
                                <div className="border rounded-lg p-4 transition-colors hover:bg-muted/50">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Youtube className="h-4 w-4" />
                                      <h4 className="font-medium">YouTube Optimization</h4>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Generate SEO-optimized title, description, tags, and thumbnail suggestions.
                                  </p>
                                </div>

                                <div className="border rounded-lg p-4 transition-colors hover:bg-muted/50">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4" />
                                      <h4 className="font-medium">Social Media Content</h4>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Create engaging posts for Twitter, LinkedIn, and other platforms.
                                  </p>
                                </div>

                                <div className="border rounded-lg p-4 transition-colors hover:bg-muted/50">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <h4 className="font-medium">Blog Post</h4>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Convert video content into a well-structured blog post.
                                  </p>
                                </div>

                                <div className="border rounded-lg p-4 transition-colors hover:bg-muted/50">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      <h4 className="font-medium">Email Newsletter</h4>
                                    </div>
                                    <Button variant="outline" size="sm">Generate</Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Create an email newsletter featuring your video content.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AI Output Preview */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium">Generated Content</h3>
                              <Button variant="outline" size="sm">
                                <Copy className="h-4 w-4 mr-2" />
                                Copy All
                              </Button>
                            </div>

                            <div className="border rounded-lg">
                              <Tabs defaultValue="preview">
                                <TabsList className="grid w-full grid-cols-2 bg-transparent">
                                  <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">Preview</TabsTrigger>
                                  <TabsTrigger value="json" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 transition-all duration-300">JSON</TabsTrigger>
                                </TabsList>
                                <TabsContent value="preview" className="animate-in fade-in-50 duration-500">
                                  <ScrollArea className="h-[500px]">
                                    <div className="p-4">
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Generated Title</Label>
                                          <div className="text-sm p-2 bg-muted rounded-md">
                                            How to Build Amazing React Components - Best Practices and Tips
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label>Description</Label>
                                          <div className="text-sm p-2 bg-muted rounded-md whitespace-pre-line">
                                            Master the art of building React components with our comprehensive guide! In this video, we'll cover:

                                            🔹 Component architecture best practices
                                            🔹 Performance optimization techniques
                                            🔹 Reusability patterns
                                            🔹 State management strategies

                                            Perfect for both beginners and experienced developers looking to level up their React skills.
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label>Tags</Label>
                                          <div className="flex flex-wrap gap-1">
                                            <Badge variant="outline">react</Badge>
                                            <Badge variant="outline">javascript</Badge>
                                            <Badge variant="outline">webdev</Badge>
                                            <Badge variant="outline">programming</Badge>
                                            <Badge variant="outline">tutorial</Badge>
                                          </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="space-y-2">
                                          <Label>Social Media Posts</Label>
                                          <div className="space-y-2">
                                            <div className="text-sm p-2 bg-muted rounded-md">
                                              🚀 Just dropped a new video on React component best practices!
                                              
                                              Learn how to build scalable, maintainable components that your team will love.
                                              
                                              Watch now: [link]
                                              
                                              #React #WebDev #JavaScript
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </ScrollArea>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </ScrollArea>
                </div>
              </Tabs>

              <div className="border-t p-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Last edited: {selectedVideo?.uploadDate}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 