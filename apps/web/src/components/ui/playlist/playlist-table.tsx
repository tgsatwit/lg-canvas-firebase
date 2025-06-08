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
  FolderPlus,
} from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

type Playlist = {
  id: string;
  title: string;
  description: string;
  videoCount: number;
  visibility: "Public" | "Private" | "Unlisted";
  creationDate: string;
  status: "Published" | "Draft" | "Scheduled";
  scheduledDate?: string;
};

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Playlist> = (row, columnId, filterValue) => {
  const searchableRowContent = `${row.original.title} ${row.original.description}`.toLowerCase();
  const searchTerm = (filterValue ?? "").toLowerCase();
  return searchableRowContent.includes(searchTerm);
};

// Filter function for visibility filtering
const visibilityFilterFn: FilterFn<Playlist> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const visibility = row.getValue(columnId) as string;
  return (filterValue as string[]).includes(visibility);
};

// Filter function for status filtering
const statusFilterFn: FilterFn<Playlist> = (row, columnId, filterValue) => {
  if (!filterValue || (filterValue as string[]).length === 0) return true;
  const status = row.getValue(columnId) as string;
  return (filterValue as string[]).includes(status);
};

export function PlaylistTable({
  onCreatePlaylist,
  onEditPlaylist,
}: {
  onCreatePlaylist?: () => void;
  onEditPlaylist?: (playlist: Playlist) => void;
}) {
  const id = useId();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "videoCount",
      desc: true,
    },
  ]);

  const [data, setData] = useState<Playlist[]>([
    {
      id: "1",
      title: "Best Tutorials 2023",
      description: "Collection of best programming tutorials",
      videoCount: 15,
      visibility: "Public",
      creationDate: "2023-05-15",
      status: "Published"
    },
    {
      id: "2",
      title: "Product Demos",
      description: "Product demonstration videos",
      videoCount: 8,
      visibility: "Unlisted",
      creationDate: "2023-06-20",
      status: "Draft"
    },
    {
      id: "3",
      title: "Upcoming Features",
      description: "Videos about upcoming features",
      videoCount: 5,
      visibility: "Private",
      creationDate: "2023-07-10",
      status: "Scheduled",
      scheduledDate: "2023-08-01"
    },
    {
      id: "4",
      title: "Programming Tutorials",
      description: "Learn programming from scratch",
      videoCount: 20,
      visibility: "Public",
      creationDate: "2023-08-15",
      status: "Published"
    },
    {
      id: "5",
      title: "Design Inspirations",
      description: "UI/UX design inspirations and tips",
      videoCount: 12,
      visibility: "Public",
      creationDate: "2023-09-05",
      status: "Published"
    },
    {
      id: "6",
      title: "Marketing Strategies",
      description: "Effective digital marketing strategies",
      videoCount: 7,
      visibility: "Private",
      creationDate: "2023-10-10",
      status: "Draft"
    },
    {
      id: "7",
      title: "Customer Success Stories",
      description: "Testimonials from happy customers",
      videoCount: 9,
      visibility: "Unlisted",
      creationDate: "2023-11-20",
      status: "Scheduled",
      scheduledDate: "2023-12-15"
    }
  ]);

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const updatedData = data.filter(
      (item) => !selectedRows.some((row) => row.original.id === item.id),
    );
    setData(updatedData);
    table.resetRowSelection();
  };

  const handleRowAction = (row: Row<Playlist>) => {
    onEditPlaylist?.(row.original);
  };

  function RowActions({ row }: { row: Row<Playlist> }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex justify-end">
            <Button size="icon" variant="ghost" className="shadow-none" aria-label="Playlist actions">
              <MoreVertical size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleRowAction(row)}>
            Edit playlist
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
      case "scheduled":
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

  const columns: ColumnDef<Playlist>[] = [
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
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div 
            className="font-medium line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={() => handleRowAction(row)}
          >
            {row.getValue("title")}
          </div>
          <div className="text-xs text-muted-foreground">{row.original.description}</div>
        </div>
      ),
      size: 300,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Videos",
      accessorKey: "videoCount",
      cell: ({ row }) => {
        const videoCount = row.getValue("videoCount") as number;
        return <div className="text-sm">{videoCount}</div>;
      },
      size: 80,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className={getStatusBadgeClass(status)}>
            {status}
            {row.original.scheduledDate && status === "Scheduled" && (
              <span className="ml-1">({row.original.scheduledDate})</span>
            )}
          </div>
        );
      },
      size: 140,
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
      header: "Created",
      accessorKey: "creationDate",
      cell: ({ row }) => {
        return <div className="text-sm">{row.getValue("creationDate")}</div>;
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
              placeholder="Search playlists..."
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
                    No playlists found.
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
            Playlists per page
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