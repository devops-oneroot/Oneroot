"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { fetchBuysLeadMatches } from "@/lib/buysApi";
import { BUYS_FIELD_WEIGHTS, type BuysLeadRow } from "@/lib/buysTypes";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import { BuysViewModal } from "./BuysViewModal";

const PAGE_SIZE = 10;

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function leadTypeLabel(type: string) {
  return type === "export" ? "Export" : "Domestic";
}

export function BuysDashboard() {
  const [minScore, setMinScore] = useState(40);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState<BuysLeadRow | null>(null);

  useEffect(() => {
    setPage(1);
  }, [minScore, search]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["match-leads", minScore, page],
    queryFn: () =>
      fetchBuysLeadMatches({
        minScore,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const filteredLeads = useMemo(() => {
    const rows = data?.leads ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const haystack = `${row.leadName} ${row.bestMatch?.supplierName ?? ""} ${row.responsiblePerson}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [data?.leads, search]);

  const summary = data?.summary;
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.total ?? 0;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Lead ↔ Supplier matching
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Match dashboard
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Every export and domestic lead with its best matching supplier, or
            no matching when none qualify.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </button>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Buyer leads" value={summary.buyerCount} />
          <SummaryCard label="Suppliers" value={summary.supplierCount} />
          <SummaryCard label="With match" value={summary.leadsWithMatches} />
          <SummaryCard
            label="No match"
            value={summary.leadsWithoutMatches}
          />
          <SummaryCard
            label="Avg best match"
            value={`${summary.avgBestScore}%`}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[140px] flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Min match %</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value) || 0)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Search this page</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lead or supplier name"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </label>
      </div>

      <p className="text-xs text-slate-500">
        Priority: polish {BUYS_FIELD_WEIGHTS.polish}% → material{" "}
        {BUYS_FIELD_WEIGHTS.material}% → curcumin {BUYS_FIELD_WEIGHTS.curcumin}%
        → price {BUYS_FIELD_WEIGHTS.price}% → origin {BUYS_FIELD_WEIGHTS.origin}%
      </p>

      {isLoading && (
        <p className="py-12 text-center text-slate-500">Computing matches…</p>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Could not load matches. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !isError && totalItems === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          <p className="font-medium text-slate-700">No buyer leads yet</p>
          <p className="mt-1 text-sm">
            Add export or domestic leads with matching fields filled in.
          </p>
        </div>
      )}

      {!isLoading && !isError && totalItems > 0 && filteredLeads.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          <p className="font-medium text-slate-700">No leads on this page match search</p>
        </div>
      )}

      {!isLoading && !isError && filteredLeads.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Lead</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Polish</th>
                  <th className="px-3 py-3">Material</th>
                  <th className="px-3 py-3">Curcumin</th>
                  <th className="px-3 py-3">Max price</th>
                  <th className="px-3 py-3">Best supplier</th>
                  <th className="px-3 py-3 text-center">Match</th>
                  <th className="px-3 py-3 text-center">Suppliers</th>
                  <th className="px-3 py-3 text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((row) => {
                  const best = row.bestMatch;
                  const ld = row.leadDetails;

                  return (
                    <tr
                      key={row.leadId}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {row.leadName}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-violet-700">
                        {leadTypeLabel(row.leadType)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {ld.polishLevel || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {ld.materialType || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {ld.minCurcumin != null ? `${ld.minCurcumin}%` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {ld.maxPrice != null ? `₹${ld.maxPrice}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {best?.supplierName ?? (
                          <span className="text-slate-400">No matching</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {best ? (
                          <span
                            className={cn(
                              "inline-block min-w-[3rem] rounded-full px-2 py-0.5 text-xs font-bold",
                              scoreTone(best.matchScore)
                            )}
                          >
                            {best.matchScore}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          {row.matchCount}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setViewRow(row)}
                          disabled={!best}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-violet-700 transition-colors hover:border-violet-400 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="leads"
            leadingPages={5}
          />
        </div>
      )}

      <BuysViewModal row={viewRow} onClose={() => setViewRow(null)} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
