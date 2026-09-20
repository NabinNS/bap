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
import { useEffect, useRef, useState, type ComponentType } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Printer, Sheet, MoreVertical } from "lucide-react";
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
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
  // Fired when focus leaves the row entirely (relatedTarget not inside it) —
  // lets a row with inline inputs commit once as a unit instead of per-field.
  onRowBlur?: (row: TData, e: React.FocusEvent<HTMLTableRowElement>) => void;
  tableClassName?: string;
  // server-side pagination
  meta?: Meta | null;
  onPageChange?: (page: number) => void;
  // Hide the pagination footer and scroll the rows within a fixed-height body instead
  // (all `data` is already rendered regardless — this table never slices client-side).
  hidePagination?: boolean;
  maxBodyHeight?: string;
  // Stretch to fill the parent's available height (parent must constrain height, e.g.
  // via flex + min-h-0) instead of capping at a fixed maxBodyHeight — avoids a second,
  // independent scroll region opening on the page around a fixed-height table.
  fillHeight?: boolean;
  // Scroll the internal body to the bottom whenever `scrollToBottomKey` changes (e.g. a
  // ledger whose last row is an "add new" row the user should land on). Keyed rather than
  // tied to `data` itself, since callers often rebuild that array on every render —
  // reacting to the array identity would re-trigger the scroll on unrelated re-renders.
  scrollToBottomOnLoad?: boolean;
  scrollToBottomKey?: string | number;
  // Optional actions shown next to the search bar — the caller owns the actual print/export
  // logic since it knows how this table's data should be laid out on paper/in a spreadsheet.
  onPrint?: () => void;
  onExportCsv?: () => void;
  // Extra actions tucked behind a "more" (⋮) button after Print/Excel, for things too
  // situational to earn their own always-visible button (e.g. a view-mode toggle).
  moreActions?: { label: string; onClick: () => void; icon?: ComponentType<{ className?: string }> }[];
}

export function DataTable<TData>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  loading = false,
  onRowClick,
  onRowDoubleClick,
  onRowBlur,
  tableClassName,
  meta,
  onPageChange,
  hidePagination = false,
  maxBodyHeight,
  fillHeight = false,
  scrollToBottomOnLoad = false,
  scrollToBottomKey,
  onPrint,
  onExportCsv,
  moreActions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
    }
    if (moreMenuOpen) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (scrollToBottomOnLoad && data.length > 0 && scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = scrollBodyRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed intentionally, see prop doc
  }, [scrollToBottomKey, scrollToBottomOnLoad]);

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

  const scrollsInternally = !!maxBodyHeight || fillHeight;

  return (
    <div className={cn("space-y-4", fillHeight && "flex-1 min-h-0 min-w-0 flex flex-col")}>
      {/* Search */}
      <div className="flex items-stretch shrink-0">
        <div className="relative w-full h-10">
          <Search className="absolute left-3 inset-y-0 my-auto h-4 w-4 text-slate-400 pointer-events-none" />
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
            className="w-full h-10 pl-9 text-sm border border-slate-400 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-slate-500"
          />
        </div>
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex h-10 shrink-0 items-center gap-1.5 px-3 border border-l-0 border-slate-400 text-sm font-medium text-text-muted hover:bg-slate-50 hover:text-text-default cursor-pointer transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        )}
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="flex h-10 shrink-0 items-center gap-1.5 px-3 border border-l-0 border-slate-400 text-sm font-medium text-text-muted hover:bg-slate-50 hover:text-text-default cursor-pointer transition-colors"
          >
            <Sheet className="h-4 w-4" />
            Excel
          </button>
        )}
        {moreActions && moreActions.length > 0 && (
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreMenuOpen((v) => !v)}
              className="flex h-10 items-center justify-center border border-l-0 border-slate-400 px-2 text-text-muted hover:bg-slate-50 hover:text-text-default cursor-pointer transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 shadow-md z-50">
                {moreActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => { action.onClick(); setMoreMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {action.icon && <action.icon className="h-3.5 w-3.5 text-text-muted" />}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className={cn("border border-slate-300 bg-slate-50 overflow-hidden min-w-0", fillHeight && "flex-1 min-h-0 flex flex-col")}>
        <div
          ref={scrollBodyRef}
          className={cn("overflow-x-auto", scrollsInternally && "overflow-y-auto", fillHeight && "flex-1 min-h-0")}
          style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
        >
        <Table className={cn("min-w-max", tableClassName)}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={cn("bg-black hover:bg-black border-black", scrollsInternally && "sticky top-0 z-10")}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : undefined }}
                      className={cn(
                        "text-table-h1 font-bold text-white uppercase tracking-wide select-none",
                        header.colSpan > 1 && "text-center",
                        header.subHeaders.length > 0 && "border-b border-white/30 pb-1.5",
                        (header.column.columnDef.meta as { borderLeft?: boolean } | undefined)?.borderLeft && "border-l border-white/20",
                        canSort && "cursor-pointer hover:text-white/80"
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <span className={cn("flex items-center gap-1", header.colSpan > 1 && "justify-center")}>
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
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  onBlur={onRowBlur ? (e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) onRowBlur(row.original, e);
                  } : undefined}
                  className={`border-b border-slate-300 hover:bg-slate-100 transition-colors ${onRowClick || onRowDoubleClick ? "cursor-pointer" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined }}
                      className={cn(
                        "text-table-data py-3",
                        (cell.column.columnDef.meta as { borderLeft?: boolean } | undefined)?.borderLeft && "border-l border-slate-300"
                      )}
                    >
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
        </div>

        {/* Pagination */}
        {!hidePagination && <div className={cn("flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-100", fillHeight && "shrink-0")}>
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
        </div>}
      </div>
    </div>
  );
}
