"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Search } from "lucide-react";
import type { Supplier } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";

interface SuppliersTableProps {
  suppliers: Supplier[];
  onSelectSupplier: (supplier: Supplier) => void;
}

const PAGE_SIZE = 10;

export function SuppliersTable({
  suppliers,
  onSelectSupplier,
}: SuppliersTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;

    return suppliers.filter((item) => {
      const sd = item.supplierDetails;
      const haystack = [
        item.name,
        sd?.supplierName,
        sd?.supplierNumber,
        sd?.supplierType,
        sd?.materialType,
        sd?.polishLevel,
        sd?.region,
        sd?.variety,
        sd?.grade,
        item.responsiblePerson,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [suppliers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  if (suppliers.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No suppliers yet. Click <strong>Add Supplier</strong> to create one.
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search suppliers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Supplier</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Material</th>
              <th className="px-3 py-3">Polish</th>
              <th className="px-3 py-3">Region</th>
              <th className="px-3 py-3">Variety</th>
              <th className="px-3 py-3">Curcumin %</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Qty (kg)</th>
              <th className="px-3 py-3 hidden lg:table-cell">Responsible</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginated.map((item) => {
              const sd = item.supplierDetails;
              return (
                <tr key={item._id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {sd?.supplierName || item.name}
                  </td>
                  <td className="hidden px-3 py-3 text-slate-700 md:table-cell">
                    {sd?.supplierNumber || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.supplierType || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.materialType || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.polishLevel || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.region || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.variety || "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.curcuminPercent != null ? `${sd.curcuminPercent}%` : "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.price != null ? `₹${sd.price}` : "—"}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {sd?.quantityKg != null ? sd.quantityKg : "—"}
                  </td>
                  <td className="hidden px-3 py-3 text-slate-700 lg:table-cell">
                    {item.responsiblePerson || "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectSupplier(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && suppliers.length > 0 && (
        <p className="mt-4 text-center text-sm text-slate-500">
          No suppliers match your search.
        </p>
      )}

      <div className="mt-4">
        <Pagination
          page={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        />
      </div>
    </div>
  );
}
