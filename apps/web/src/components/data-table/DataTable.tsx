"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  // server-side pagination
  meta?: Meta | null;
  onPageChange?: (page: number) => void;
}

export function DataTable<TData>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  loading = false,
  meta,
  onPageChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const isServerPaginated = !!meta && !!onPageChange;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    // only use client-side pagination when not server paginated
    ...(isServerPaginated
      ? { manualPagination: true, pageCount: meta.last_page }
      : {}),
  });

  const currentPage = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder={searchPlaceholder}
          value={
            searchColumn
              ? ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? "")
              : globalFilter
          }
          onChange={(e) =>
            searchColumn
              ? table.getColumn(searchColumn)?.setFilterValue(e.target.value)
              : setGlobalFilter(e.target.value)
          }
          className="w-full h-10 pl-9 text-sm border border-slate-300 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-500"
        />
      </div>

      {/* Table */}
      <div className="border border-slate-300 bg-slate-50 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-black hover:bg-black border-black">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined }}
                      className={cn(
                        "text-table-h1 font-bold text-white uppercase tracking-wide select-none",
                        canSort && "cursor-pointer hover:text-white/80"
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <span className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-white/50">
                              {sorted === "asc" ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : sorted === "desc" ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                              )}
                            </span>
                          )}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-b border-slate-300 bg-white/40 dark:bg-slate-900/40">
                  {columns.map((col, j) => {
                    const size = col.size;
                    const isSmall = size && size <= 60;

                    // Vary the width class dynamically to look like organic text data
                    let widthClass = "w-full";
                    if (!isSmall) {
                      const pattern = (i * 3 + j * 7) % 4;
                      if (pattern === 0) widthClass = "w-3/4";
                      else if (pattern === 1) widthClass = "w-5/6";
                      else if (pattern === 2) widthClass = "w-2/3";
                      else widthClass = "w-1/2";
                    }

                    return (
                      <TableCell key={j} className="py-3.5">
                        <Skeleton
                          className={cn(
                            "h-4 rounded-sm",
                            isSmall ? "h-5 w-5 mx-auto rounded" : widthClass
                          )}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-slate-300 hover:bg-slate-100 cursor-pointer transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined }} className="text-table-data py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-700 text-sm">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-100">
          <p className="text-sm text-slate-700">
            {isServerPaginated
              ? `Showing ${meta.from ?? 0} to ${meta.to ?? 0} of ${meta.total} results`
              : (() => {
                  const { pageIndex, pageSize } = table.getState().pagination;
                  const total = table.getFilteredRowModel().rows.length;
                  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
                  const to = Math.min((pageIndex + 1) * pageSize, total);
                  return `Showing ${from} to ${to} of ${total} results`;
                })()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => isServerPaginated ? onPageChange(currentPage - 1) : table.previousPage()}
              disabled={isServerPaginated ? currentPage <= 1 : !table.getCanPreviousPage()}
              className="flex h-8 w-8 items-center justify-center border border-slate-200 text-text-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-text-muted" />
            </button>

            {isServerPaginated
              ? Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={cn(
                      "h-8 w-8 text-sm font-semibold cursor-pointer transition-colors",
                      currentPage === p
                        ? "bg-black text-white"
                        : "border border-slate-200 text-text-muted hover:bg-slate-100"
                    )}
                  >
                    {p}
                  </button>
                ))
              : Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIndex) => (
                  <button
                    key={pageIndex}
                    onClick={() => table.setPageIndex(pageIndex)}
                    className={cn(
                      "h-8 w-8 text-sm font-semibold cursor-pointer transition-colors",
                      table.getState().pagination.pageIndex === pageIndex
                        ? "bg-black text-white"
                        : "border border-slate-200 text-text-muted hover:bg-slate-100"
                    )}
                  >
                    {pageIndex + 1}
                  </button>
                ))}

            <button
              onClick={() => isServerPaginated ? onPageChange(currentPage + 1) : table.nextPage()}
              disabled={isServerPaginated ? currentPage >= lastPage : !table.getCanNextPage()}
              className="flex h-8 w-8 items-center justify-center border border-slate-200 text-text-muted hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
