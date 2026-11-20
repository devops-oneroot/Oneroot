"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  /** Always show page buttons 1 … N (e.g. 5) plus Leads-style neighbors / last. */
  leadingPages?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}

function visiblePages(
  page: number,
  totalPages: number,
  leadingPages?: number
): number[] {
  const set = new Set<number>();

  if (leadingPages != null && leadingPages > 0) {
    for (let i = 1; i <= Math.min(leadingPages, totalPages); i++) {
      set.add(i);
    }
  }

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
    ) {
      set.add(p);
    }
  }

  return Array.from(set).sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "leads",
  leadingPages,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = visiblePages(page, totalPages, leadingPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-700">{start}</span>–
          <span className="font-medium text-slate-700">{end}</span> of{" "}
          <span className="font-medium text-slate-700">{totalItems}</span>{" "}
          {itemLabel}
        </p>
        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-violet-400"
              aria-label="Leads per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-1 text-slate-400">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "min-w-9 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                  page === p
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
