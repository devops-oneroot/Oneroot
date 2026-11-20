"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import type { LinkedInConnectionStatus, LinkedInLead } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { CountryFlag } from "@/components/country/CountryFlag";
import {
  convertLinkedInToImporter,
  fetchLinkedInAccountStatus,
  searchLiveLinkedInLeads,
  syncLinkedInLeadsApi,
} from "@/lib/api";
import { ConnectLinkedInModal } from "./ConnectLinkedInModal";
import toast from "react-hot-toast";

interface LinkedInLeadsTableProps {
  leads: LinkedInLead[];
  onSelectLead: (lead: LinkedInLead) => void;
  onAddLead?: () => void;
  onRefresh?: () => any;
}

const PAGE_SIZE = 10;

const CONNECTION_STATUS_MAP: Record<
  LinkedInConnectionStatus,
  { label: string; bg: string; text: string }
> = {
  not_connected: {
    label: "Not Connected",
    bg: "bg-slate-100",
    text: "text-slate-700",
  },
  connection_sent: {
    label: "Invite Sent",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  connected: {
    label: "1st Degree Connected",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  messaged: {
    label: "InMail / Messaged",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  in_discussion: {
    label: "In Discussion",
    bg: "bg-amber-50",
    text: "text-amber-800",
  },
  converted: {
    label: "Converted to Importer",
    bg: "bg-purple-50",
    text: "text-purple-700",
  },
};

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

export function LinkedInLeadsTable({
  leads,
  onSelectLead,
  onAddLead,
  onRefresh,
}: LinkedInLeadsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [syncAlert, setSyncAlert] = useState<{
    type: "success" | "error";
    text: string;
    details?: string;
  } | null>(null);

  const { data: accountStatus, refetch: refetchAccount } = useQuery({
    queryKey: ["linkedin-account-status"],
    queryFn: fetchLinkedInAccountStatus,
  });

  const countries = useMemo(() => {
    const list = new Set(leads.map((e) => e.country?.trim()).filter(Boolean));
    return [...list].sort();
  }, [leads]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncAlert(null);
    try {
      let res;
      if (accountStatus?.isConnected) {
        res = await searchLiveLinkedInLeads("Turmeric Buyer");
      } else {
        res = await syncLinkedInLeadsApi();
      }

      if (res.success) {
        setSyncAlert({
          type: "success",
          text: `LinkedIn Lead Sourcing: Added ${res.stats.newAdded} new spice buyer leads!`,
          details: `${res.stats.duplicatesSkipped} duplicates were skipped. Newly added: ${res.newLeads.slice(0, 3).join(", ")}${res.newLeads.length > 3 ? "..." : ""}`,
        });
        await onRefresh?.();
        refetchAccount();
      } else {
        setSyncAlert({
          type: "error",
          text: `Sync failed: ${res.message || "Unknown error"}`,
        });
      }
    } catch (err: any) {
      setSyncAlert({
        type: "error",
        text: `Sync error: ${err?.response?.data?.message || err?.message || "Failed to reach LinkedIn lead service"}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConvert = async (lead: LinkedInLead) => {
    setConvertingId(lead._id);
    try {
      const res = await convertLinkedInToImporter(lead._id);
      toast.success(res.message);
      await onRefresh?.();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to convert lead"
      );
    } finally {
      setConvertingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return leads.filter((item) => {
      if (statusFilter !== "all" && item.connectionStatus !== statusFilter) {
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
        item.fullName,
        item.headline,
        item.companyName,
        item.jobTitle,
        item.location,
        item.country,
        item.email,
        item.phone,
        item.responsiblePerson,
        ...(item.targetProducts || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [leads, search, statusFilter, countryFilter]);

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

  return (
    <div className="p-3 sm:p-4">
      {/* LinkedIn Leads Banner */}
      <div className="mb-4 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 via-blue-50/50 to-white p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2] text-white shadow-sm">
              <LinkedInIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-800">
                  LinkedIn Spice & Turmeric Buyers Sourcing
                </h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Target: Procurement & Sourcing Directors
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                Identifies global procurement heads, raw spice buyers, and food ingredient
                import managers on LinkedIn with direct profile links and 1-click InMail
                outreach.
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {accountStatus?.isConnected ? (
                  <button
                    type="button"
                    onClick={() => setConnectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                    title="Click to view or manage connected LinkedIn account"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected: {accountStatus.accountName}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConnectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Link2 className="h-3 w-3 text-[#0A66C2]" />
                    <span>Connect LinkedIn Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!accountStatus?.isConnected && (
              <button
                type="button"
                onClick={() => setConnectModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#0A66C2] bg-white px-3 py-2 text-xs font-semibold text-[#0A66C2] hover:bg-blue-50 transition shadow-xs"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Connect Account</span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={() => onRefresh()}
                title="Refresh LinkedIn leads"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#084e96] disabled:opacity-60 transition"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sourcing LinkedIn Leads...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Fetch New LinkedIn Leads</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync notification banner */}
        {syncAlert && (
          <div
            className={`mt-3 flex items-start justify-between rounded-lg p-2.5 text-xs ${
              syncAlert.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <div className="flex items-start gap-2">
              {syncAlert.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              )}
              <div>
                <p className="font-semibold">{syncAlert.text}</p>
                {syncAlert.details && (
                  <p className="mt-0.5 text-[11px] opacity-90">{syncAlert.details}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSyncAlert(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-[#0A66C2]">
            <LinkedInIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            No LinkedIn leads yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Discover verified raw material buyers and spice procurement directors on
            LinkedIn, or add contacts manually.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084e96]"
            >
              <Sparkles className="h-4 w-4" />
              Fetch New LinkedIn Leads
            </button>
            {onAddLead && (
              <button
                type="button"
                onClick={onAddLead}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Add Manually
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Search & Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search LinkedIn leads by name, title, company, country…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {countries.length > 0 && (
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-sky-400"
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-sky-400"
              >
                <option value="all">All Connection States</option>
                {Object.entries(CONNECTION_STATUS_MAP).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Lead / Executive</th>
                  <th className="px-3 py-3">Company & Location</th>
                  <th className="px-3 py-3">LinkedIn Profile</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Connection Status</th>
                  <th className="px-3 py-3">Target Products</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginated.map((item) => {
                  const statusInfo =
                    CONNECTION_STATUS_MAP[item.connectionStatus] ||
                    CONNECTION_STATUS_MAP.not_connected;
                  const isConverting = convertingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                      onClick={() => onSelectLead(item)}
                    >
                      {/* Name & Headline */}
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{item.fullName}</span>
                        </div>
                        {item.headline ? (
                          <div className="text-xs text-slate-500 max-w-xs truncate">
                            {item.headline}
                          </div>
                        ) : item.jobTitle ? (
                          <div className="text-xs text-slate-500">{item.jobTitle}</div>
                        ) : null}
                      </td>

                      {/* Company & Country */}
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.companyName}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <CountryFlag countryName={item.country || "United States"} />
                          <span>{item.location || item.country || "—"}</span>
                        </div>
                      </td>

                      {/* LinkedIn Profile Link */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={item.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-[#0A66C2]/10 px-2.5 py-1 text-xs font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/20 transition"
                          title="Open LinkedIn profile in new tab"
                        >
                          <LinkedInIcon className="h-3.5 w-3.5" />
                          <span>View Profile</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>

                      {/* Contact Info */}
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 text-xs">
                          {item.email ? (
                            <a
                              href={`mailto:${item.email}`}
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-indigo-600 hover:underline"
                            >
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{item.email}</span>
                            </a>
                          ) : null}
                          {item.phone ? (
                            <a
                              href={`tel:${item.phone.replace(/\s+/g, "")}`}
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600 hover:underline"
                            >
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{item.phone}</span>
                            </a>
                          ) : null}
                          {!item.email && !item.phone && (
                            <span className="text-slate-400">Via LinkedIn InMail</span>
                          )}
                        </div>
                      </td>

                      {/* Connection Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Target Products */}
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(item.targetProducts || ["Turmeric"]).map((p) => (
                            <span
                              key={p}
                              className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        {item.curcuminPercent ? (
                          <div className="mt-1 text-xs text-slate-500">
                            {item.curcuminPercent}% Curcumin
                          </div>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {item.connectionStatus !== "converted" && (
                            <button
                              type="button"
                              onClick={() => handleConvert(item)}
                              disabled={isConverting}
                              className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/70 px-2 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition disabled:opacity-50"
                              title="Convert this LinkedIn contact into an Importer"
                            >
                              {isConverting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <UserPlus className="h-3.5 w-3.5" />
                              )}
                              <span>To Importer</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectLead(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                            View / Outreach
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && leads.length > 0 && (
            <p className="mt-4 text-center text-sm text-slate-500">
              No LinkedIn leads match your search or filter.
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

      <ConnectLinkedInModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onRefresh={() => {
          onRefresh?.();
          refetchAccount();
        }}
      />
    </div>
  );
}

