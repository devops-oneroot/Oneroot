"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Ban,
  CheckSquare,
  FileCheck2,
  FileSpreadsheet,
  Loader2,
  Globe,
  Kanban,
  Layers,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Square,
  UserCheck,
} from "lucide-react";
import type { Importer } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { CountryFlag } from "@/components/country/CountryFlag";
import { DiscoveryView } from "./discovery/DiscoveryView";
import { VerificationView } from "./verification/VerificationView";
import { OutreachView } from "./outreach/OutreachView";
import { OneClickEmailModal } from "./OneClickEmailModal";
import { BulkEmailModal } from "./BulkEmailModal";

interface ImportersTableProps {
  importers: Importer[];
  onSelectImporter: (importer: Importer, initialTab?: "profile" | "emails") => void;
  onAddImporter?: () => void;
  onRefresh?: () => any;
}

export type ImporterSubView =
  | "discovery"
  | "verification"
  | "outreach"
  | "linkedin"
  | "pipeline";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const SUB_VIEWS: { id: ImporterSubView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "discovery", label: "1. Import (CSV / Excel)", icon: FileSpreadsheet },
  { id: "verification", label: "2. Verification", icon: FileCheck2 },
  { id: "outreach", label: "3. Outreach", icon: Mail },
  { id: "linkedin", label: "4. LinkedIn Queue", icon: LinkedInIcon },
  { id: "pipeline", label: "5. Pipeline", icon: Kanban },
];

const PAGE_SIZE = 10;

export function ImportersTable({
  importers,
  onSelectImporter,
  onAddImporter,
  onRefresh,
}: ImportersTableProps) {
  const [subView, setSubView] = useState<ImporterSubView>("discovery");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [oneClickImporter, setOneClickImporter] = useState<Importer | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);

  const statusMap = useMemo(
    () => Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s])),
    []
  );

  const countries = useMemo(() => {
    const list = new Set(importers.map((e) => e.country?.trim()).filter(Boolean));
    return [...list].sort();
  }, [importers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return importers.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      if (
        countryFilter !== "all" &&
        item.country?.toLowerCase() !== countryFilter.toLowerCase()
      ) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        item.importerName,
        item.companyName,
        item.contactPerson,
        item.importerNumber,
        item.email,
        item.website,
        item.country,
        item.taxIdOrIec,
        item.importerType,
        item.materialType,
        item.polishLevel,
        item.incoterm,
        item.portOfLoading,
        item.portOfDischarge,
        item.responsiblePerson,
        ...(item.products || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [importers, search, statusFilter, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, countryFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const selectedImporters = useMemo(
    () => importers.filter((i) => selectedIds.has(i._id)),
    [importers, selectedIds]
  );

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllPaginatedSelected =
    paginated.length > 0 && paginated.every((i) => selectedIds.has(i._id));

  const toggleSelectAll = () => {
    if (isAllPaginatedSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((i) => next.delete(i._id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((i) => next.add(i._id));
        return next;
      });
    }
  };

  return (
    <div>
      {/* Importers Sub-views Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 pt-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-px scrollbar-none">
          {SUB_VIEWS.map(({ id, label, icon: Icon }) => {
            const active = subView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSubView(id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all sm:text-sm whitespace-nowrap ${active
                  ? "border-violet-600 text-violet-700 bg-violet-50/60 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-violet-600" : "text-slate-400"}`} />
                <span>{label}</span>
                {id === "linkedin" && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-view: 1. Discovery */}
      {subView === "discovery" && (
        <DiscoveryView onLeadAdded={onRefresh} />
      )}

      {/* Sub-view: 2. Verification */}
      {subView === "verification" && <VerificationView importers={importers} onRefresh={onRefresh} />}

      {/* Sub-view: 3. Outreach */}
      {subView === "outreach" && (
        <OutreachView
          importers={importers}
          onRefresh={onRefresh}
          onSelectImporter={onSelectImporter}
        />
      )}

      {/* Sub-view: 4. LinkedIn Queue (Coming Soon) */}
      {subView === "linkedin" && (
        <div className="p-8 text-center bg-slate-50 min-h-[440px] flex items-center justify-center">
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
              <LinkedInIcon className="h-7 w-7" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Coming Soon</span>
            </span>

            <h3 className="text-lg font-bold text-slate-900">
              LinkedIn Outreach Queue
            </h3>
          </div>
        </div>
      )}

      {/* Sub-view: 5. Pipeline / All Importers Table */}
      {subView === "pipeline" && (
        <div className="p-3 sm:p-4">
          {/* CSV / Excel Import & Manual Entry Action Bar */}
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Buyers are added via <span className="font-semibold text-slate-800">CSV / Excel spreadsheet import</span> or <span className="font-semibold text-slate-800">manual entry</span>. Web scraping has been removed for clean data integrity.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {onRefresh && (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  title="Refresh importers list"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSubView("discovery")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Import CSV / Excel</span>
              </button>
              {onAddImporter && (
                <button
                  type="button"
                  onClick={onAddImporter}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-violet-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Manually</span>
                </button>
              )}
            </div>
          </div>

          {importers.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No importers yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Extract and import international buyers from your CSV or Excel files, or add them manually.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSubView("discovery")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import CSV / Excel</span>
                </button>
                {onAddImporter && (
                  <button
                    type="button"
                    onClick={onAddImporter}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Manually</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search importers by name, country, Tax ID, products…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {countries.length > 0 && (
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-violet-400"
                    >
                      <option value="all">All Countries</option>
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-violet-400"
                  >
                    <option value="all">All Statuses</option>
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Action Toolbar */}
              {selectedIds.size > 0 && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/90 p-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-violet-600 px-2 py-1 text-xs font-bold text-white">
                      {selectedIds.size} Selected
                    </span>
                    <span className="text-xs text-violet-950 font-medium">
                      {selectedImporters.filter((i) => i.email).length} have email address
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkEmailModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-700 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>⚡ Bulk Send Outreach</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPaginatedSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          title={isAllPaginatedSelected ? "Deselect page" : "Select all on page"}
                        />
                      </th>
                      <th className="px-3 py-3">Importer / Firm</th>
                      <th className="px-3 py-3">Contact</th>
                      <th className="px-3 py-3">Country</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Products & Specs</th>
                      <th className="hidden px-3 py-3 md:table-cell">Ports / Logistics</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="hidden px-3 py-3 lg:table-cell">Owner</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {paginated.map((item) => {
                      const statusInfo = statusMap[item.status];
                      const isSelected = selectedIds.has(item._id);
                      return (
                        <tr
                          key={item._id}
                          className={`cursor-pointer transition-colors ${isSelected ? "bg-violet-50/50 hover:bg-violet-50/80" : "hover:bg-slate-50"
                            }`}
                          onClick={() => onSelectImporter(item)}
                        >
                          <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(item._id)}
                              className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-900">
                              {item.importerName}
                            </div>
                            {item.companyName && item.companyName !== item.importerName && (
                              <div className="text-xs text-slate-500">{item.companyName}</div>
                            )}
                            {item.contactPerson && (
                              <div className="text-xs text-violet-700 font-medium">
                                Attn: {item.contactPerson}
                              </div>
                            )}
                            {item.website && (
                              <a
                                href={
                                  item.website.startsWith("http")
                                    ? item.website
                                    : `https://${item.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                {item.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                              </a>
                            )}
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-1">
                              {item.importerNumber ? (
                                <a
                                  href={`tel:${item.importerNumber.replace(/\s+/g, "")}`}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline hover:text-emerald-800"
                                  title="Click to call"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{item.importerNumber}</span>
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}

                              {item.email ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectImporter(item, "emails");
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline hover:text-indigo-900"
                                  title="Click to view & reply to emails in CRM"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>{item.email}</span>
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <CountryFlag countryName={item.country || "United States"} />
                              <span>{item.country || "United States"}</span>
                            </div>
                            {(item.city || item.state) && (
                              <div className="text-xs text-slate-500">
                                {[item.city, item.state].filter(Boolean).join(", ")}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {item.importerType || "Buyer"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(item.products || ["turmeric"]).map((p) => (
                                <span
                                  key={p}
                                  className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800"
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {[
                                item.materialType,
                                item.curcuminPercent ? `${item.curcuminPercent}% Curcumin` : null,
                                item.quantityKg ? `${item.quantityKg.toLocaleString()} kg` : null,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          </td>
                          <td className="hidden px-3 py-3 md:table-cell">
                            <div className="text-xs font-medium text-slate-800">
                              {item.incoterm || "CIF"}
                            </div>
                            {(item.portOfLoading || item.portOfDischarge) && (
                              <div className="text-xs text-slate-500">
                                {[item.portOfLoading, item.portOfDischarge]
                                  .filter(Boolean)
                                  .join(" → ")}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: `${statusInfo?.color ?? "#6366f1"}18`,
                                color: statusInfo?.color ?? "#6366f1",
                              }}
                            >
                              {statusInfo?.label ?? item.status}
                            </span>
                          </td>
                          <td className="hidden px-3 py-3 text-slate-700 lg:table-cell">
                            {item.responsiblePerson || "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.email ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOneClickImporter(item);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-violet-700 transition"
                                  title={`1-Click Automated Email to ${item.contactPerson || item.companyName} with ${item.products?.[0] || 'Turmeric'}`}
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                  <span>Send Email</span>
                                </button>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic px-2 py-1"
                                  title="No email address on file"
                                >
                                  No email
                                </span>
                              )}

                              {item.email && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectImporter(item, "emails");
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                                  title="Open email thread in CRM"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>Thread</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onSelectImporter(item, "profile")}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && importers.length > 0 && (
                <p className="mt-4 text-center text-sm text-slate-500">
                  No importers match your search or filter.
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
            </>
          )}
        </div>
      )}

      {/* 1-Click Automated Email Outreach Modal */}
      <OneClickEmailModal
        importer={oneClickImporter}
        open={Boolean(oneClickImporter)}
        onClose={() => setOneClickImporter(null)}
        onSuccess={() => onRefresh?.()}
      />

      {/* Bulk Automated Email Outreach Modal */}
      <BulkEmailModal
        importers={selectedImporters}
        open={bulkEmailModalOpen}
        onClose={() => setBulkEmailModalOpen(false)}
        onSuccess={() => {
          setSelectedIds(new Set());
          onRefresh?.();
        }}
      />
    </div>
  );
}