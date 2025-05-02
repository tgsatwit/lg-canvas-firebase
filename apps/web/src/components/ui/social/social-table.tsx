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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Card,
  CardContent
} from "@/components/ui/card";
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
  Filter,
  ListFilter,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

type Comment = {
  id: number;
  platform: string;
  author: string;
  content: string;
  postTitle: string;
  date: string;
  answered: boolean;
};

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Comment> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.author} ${row.original.content} ${row.original.postTitle}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Filter function for platform filtering
const platformFilterFn: FilterFn<Comment> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const platform = row.getValue(columnId) as string;
  return (filterValue as string[]).includes(platform);
};

// Filter function for answered filtering
const answeredFilterFn: FilterFn<Comment> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const answered = row.getValue(columnId) as boolean;
  return (filterValue as string[]).includes(answered.toString());
};

export function SocialTable({
  onRefresh,
  onSelectComment,
}: {
  onRefresh?: () => void;
  onSelectComment?: (comment: Comment) => void;
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "date",
      desc: true,
    },
  ]);

  // Mock data for demonstration
  const [data, setData] = useState<Comment[]>([
    {
      id: 1,
      platform: "instagram",
      author: "user123",
      content: "Love this product! When will it be available in blue?",
      postTitle: "New Product Announcement",
      date: "2023-05-15T10:30:00Z",
      answered: false,
    },
    {
      id: 2,
      platform: "facebook",
      author: "jane_smith",
      content: "How much does shipping cost to Canada?",
      postTitle: "Summer Sale Post",
      date: "2023-05-14T15:45:00Z",
      answered: true,
    },
    {
      id: 3,
      platform: "youtube",
      author: "tech_reviewer",
      content: "Great tutorial! Could you make one about advanced features?",
      postTitle: "Product Tutorial Video",
      date: "2023-05-13T09:15:00Z",
      answered: false,
    },
    {
      id: 4,
      platform: "instagram",
      author: "fashionista22",
      content: "Does this come in size S? All I see is M and L on your website.",
      postTitle: "Product Showcase",
      date: "2023-05-12T14:20:00Z",
      answered: false,
    },
    {
      id: 5,
      platform: "facebook",
      author: "curious_customer",
      content: "Is this compatible with Android? Or only for iPhone?",
      postTitle: "Tech Announcement",
      date: "2023-05-11T09:30:00Z",
      answered: false,
    },
  ]);

  function getPlatformIcon(platform: string) {
    switch(platform) {
      case "instagram": return <Instagram className="h-4 w-4 text-pink-600" />;
      case "facebook": return <Facebook className="h-4 w-4 text-blue-600" />;
      case "youtube": return <Youtube className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const handleRowAction = (row: Row<Comment>) => {
    onSelectComment?.(row.original);
  };

  function RowActions({ row }: { row: Row<Comment> }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button size="icon" variant="ghost" className="shadow-none" aria-label="Comment actions">
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

  const getStatusBadgeClass = (answered: boolean) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium";
    return answered 
      ? cn(baseClasses, "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-400")
      : cn(baseClasses, "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400");
  };

  const getPlatformBadgeClass = (platform: string) => {
    const baseClasses = "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium";
    switch (platform) {
      case "instagram":
        return cn(baseClasses, "bg-pink-50 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400");
      case "facebook":
        return cn(baseClasses, "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400");
      case "youtube":
        return cn(baseClasses, "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400");
      default:
        return cn(baseClasses, "bg-gray-50 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400");
    }
  };

  const columns: ColumnDef<Comment>[] = [
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
      header: "Platform",
      accessorKey: "platform",
      cell: ({ row }) => {
        const platform = row.getValue("platform") as string;
        return (
          <div className="flex items-center gap-2">
            {getPlatformIcon(platform)}
            <div className={getPlatformBadgeClass(platform)}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </div>
          </div>
        );
      },
      size: 120,
      filterFn: platformFilterFn,
    },
    {
      header: "Author",
      accessorKey: "author",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("author")}</div>;
      },
      size: 120,
    },
    {
      header: "Content",
      accessorKey: "content",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div 
            className="font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => handleRowAction(row)}
          >
            {row.getValue("content")}
          </div>
          <div className="text-xs text-muted-foreground">
            On: {row.original.postTitle}
          </div>
        </div>
      ),
      size: 300,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Status",
      accessorKey: "answered",
      cell: ({ row }) => {
        const answered = row.getValue("answered") as boolean;
        return (
          <div className={getStatusBadgeClass(answered)}>
            <div className="flex items-center gap-1">
              {answered ? <CheckCircle2 className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {answered ? "Answered" : "Pending"}
            </div>
          </div>
        );
      },
      size: 100,
      filterFn: answeredFilterFn,
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: ({ row }) => {
        return <div className="text-sm">{formatDate(row.getValue("date") as string)}</div>;
      },
      size: 120,
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

  // Get unique platform values
  const uniquePlatformValues = useMemo(() => {
    const platformColumn = table.getColumn("platform");
    if (!platformColumn) return [];
    const values = Array.from(platformColumn.getFacetedUniqueValues().keys());
    return values.sort();
  }, [table.getColumn("platform")?.getFacetedUniqueValues()]);

  // Get platform counts
  const platformCounts = useMemo(() => {
    const platformColumn = table.getColumn("platform");
    if (!platformColumn) return new Map();
    return platformColumn.getFacetedUniqueValues();
  }, [table.getColumn("platform")?.getFacetedUniqueValues()]);

  const selectedPlatforms = useMemo(() => {
    const filterValue = table.getColumn("platform")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("platform")?.getFilterValue()]);

  const handlePlatformChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("platform")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("platform")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Handle status filtering
  const statusValues = ["true", "false"];
  const statusLabels = { "true": "Answered", "false": "Pending" };
  
  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("answered")?.getFilterValue() as string[];
    return filterValue ?? [];
  }, [table.getColumn("answered")?.getFilterValue()]);

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("answered")?.getFilterValue() as string[];
    const newFilterValue = filterValue ? [...filterValue] : [];

    if (checked) {
      newFilterValue.push(value);
    } else {
      const index = newFilterValue.indexOf(value);
      if (index > -1) {
        newFilterValue.splice(index, 1);
      }
    }

    table.getColumn("answered")?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
  };

  // Stats about the social comments
  const stats = {
    total: data.length,
    answered: data.filter(c => c.answered).length,
    unanswered: data.filter(c => !c.answered).length,
    instagram: data.filter(c => c.platform === "instagram").length,
    facebook: data.filter(c => c.platform === "facebook").length,
    youtube: data.filter(c => c.platform === "youtube").length,
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-900/10 dark:to-purple-800/10 p-8 rounded-2xl">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-50 to-purple-100">Social Monitor</h1>
          <p className="text-muted-foreground text-purple-200 mt-1">Monitor and respond to comments across your social platforms</p>
        </div>
        <Button onClick={onRefresh} size="lg" className="bg-white hover:bg-purple-100 text-purple-700 w-full md:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="bg-white dark:bg-gray-900/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-sm">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-sm">Answered</p>
            <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.unanswered}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Instagram className="h-3 w-3 text-pink-600" /> Instagram
            </p>
            <p className="text-2xl font-bold text-pink-600">{stats.instagram}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Facebook className="h-3 w-3 text-blue-600" /> Facebook
            </p>
            <p className="text-2xl font-bold text-blue-600">{stats.facebook}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-900/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Youtube className="h-3 w-3 text-red-600" /> YouTube
            </p>
            <p className="text-2xl font-bold text-red-600">{stats.youtube}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900/50 p-4 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter by content */}
          <div className="relative flex-1 min-w-[200px]">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer w-full ps-9 rounded-lg border-gray-200 dark:border-gray-800 focus:ring-purple-500",
                Boolean(table.getColumn("content")?.getFilterValue()) && "pe-9",
              )}
              value={(table.getColumn("content")?.getFilterValue() ?? "") as string}
              onChange={(e) => table.getColumn("content")?.setFilterValue(e.target.value)}
              placeholder="Search comments..."
              type="text"
              aria-label="Filter by content"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} strokeWidth={2} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("content")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("content")?.setFilterValue("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
              >
                <CircleX size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
          
          {/* Platform filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                Platform
                {selectedPlatforms.length > 0 && (
                  <span className="ml-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-xs font-medium">
                    {selectedPlatforms.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Platform</div>
                <div className="space-y-3">
                  {uniquePlatformValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-platform-${i}`}
                        checked={selectedPlatforms.includes(value)}
                        onCheckedChange={(checked: boolean) => handlePlatformChange(checked, value)}
                      />
                      <Label
                        htmlFor={`${id}-platform-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        <span className="flex items-center gap-1">
                          {getPlatformIcon(value)}
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </span>
                        <span className="ms-2 text-xs text-muted-foreground">
                          {platformCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Status filter */}
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
                  {statusValues.map((value, i) => (
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
                        {statusLabels[value as keyof typeof statusLabels]}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {value === "true" ? stats.answered : stats.unanswered}
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
                    No comments found.
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
            Comments per page
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