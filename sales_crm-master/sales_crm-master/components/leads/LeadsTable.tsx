"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Pencil, Search } from "lucide-react";
import { contactPersonsDisplay } from "@/lib/leadContacts";
import { formatProductsLabel, getLeadDisplayTitle } from "@/lib/products";
import type { Lead } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import { isLeadStale, staleLeadRowClass } from "@/lib/leadStale";
import {
  cn,
  followUpBadgeClass,
  formatCurrency,
  formatDateTimeParts,
  formatFollowUpDate,
  getFollowUpUrgency,
} from "@/lib/utils";
import { CountryFlag } from "@/components/country/CountryFlag";
import { Pagination } from "@/components/ui/Pagination";
import { CountryFilterSelect } from "./CountryFilterSelect";

import { ReassignLeadSelect } from "./ReassignLeadSelect";
import { fetchLeads, fetchTeamMembers, type LeadListParams } from "@/lib/api";
import { buildReassignTeamNames } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_PAGE_SIZE = 10;

/** Which timestamp the date filter and the ordering apply to. */
const DATE_FIELDS = [
  { id: "createdAt", label: "Created date" },
  { id: "updatedAt", label: "Updated date" },
] as const;

type DateFieldId = (typeof DATE_FIELDS)[number]["id"];
type SortOrder = "desc" | "asc";

const PAGE_SIZE_OPTIONS = [10, 100, 200, 300] as const;
/** ~10 table rows — list scrolls inside when per-page is higher */
const TABLE_VIEWPORT_CLASS = "max-h-[520px] overflow-y-auto overflow-x-auto";

interface LeadsTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  isAdmin?: boolean;
}

export function LeadsTable({ leads, onSelectLead, isAdmin = false }: LeadsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [dateField, setDateField] = useState<DateFieldId>("createdAt");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: isAdmin,
  });

  const teamOptions = useMemo(
    () => buildReassignTeamNames(team, leads),
    [team, leads]
  );

  const statusMap = useMemo(
    () => Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s.label])),
    []
  );

  const responsibleOptions = useMemo(() => {
    const names = new Set(
      leads.map((l) => l.responsiblePerson?.trim()).filter(Boolean)
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [leads]);

  // The search box types faster than the network; wait for a pause.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const listParams = useMemo(
    () => ({
      status: statusFilter as LeadListParams["status"],
      responsible: responsibleFilter,
      country: countryFilter,
      search: debouncedSearch,
      dateField,
      from: dateFrom,
      to: dateTo,
      sort: sortOrder,
    }),
    [
      statusFilter,
      responsibleFilter,
      countryFilter,
      debouncedSearch,
      dateField,
      dateFrom,
      dateTo,
      sortOrder,
    ]
  );

  // Filtering and ordering are done by the API, not in the browser.
  const { data: rows = [], isFetching } = useQuery({
    queryKey: ["leads", "table", listParams],
    queryFn: () => fetchLeads(listParams),
    placeholderData: (previous) => previous,
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    countryFilter,
    responsibleFilter,
    dateField,
    dateFrom,
    dateTo,
    sortOrder,
    pageSize,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
        <CountryFilterSelect
          leads={leads}
          value={countryFilter}
          onChange={setCountryFilter}
          className="rounded-lg border border-slate-200 bg-[#f8f9fa] px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400"
        />
        <select
          value={responsibleFilter}
          onChange={(e) => setResponsibleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-[#f8f9fa] px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400"
        >
          <option value="all">All responsible</option>
          {responsibleOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-[#f8f9fa] px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400"
        >
          <option value="all">All Status</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-[#f8f9fa] p-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filter by
          </span>
          <select
            value={dateField}
            onChange={(e) => setDateField(e.target.value as DateFieldId)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
          >
            {DATE_FIELDS.map((field) => (
              <option key={field.id} value={field.id}>
                {field.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Order
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400"
          >
            <option value="desc">Newest first (descending)</option>
            <option value="asc">Oldest first (ascending)</option>
          </select>
        </label>

        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white"
          >
            Clear dates
          </button>
        )}

        <p className="text-xs text-slate-500 sm:ml-auto sm:pb-2">
          Showing {rows.length} of {leads.length} leads
          {isFetching && " · updating…"}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-[#f8f9fa] py-16 text-center">
          <p className="text-slate-500">
            {leads.length === 0
              ? "No leads yet. Click Create Lead to get started."
              : "No leads match your search."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className={cn("space-y-3 md:hidden", TABLE_VIEWPORT_CLASS)}>
            {paginated.map((lead) => {
              const stale = isLeadStale(lead);
              const followUpLabel = formatFollowUpDate(lead.followUpDate);
              const followUpUrgency = getFollowUpUrgency(lead.followUpDate);
              return (
                <li key={lead._id}>
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className={cn(
                      "w-full rounded-lg border p-4 text-left shadow-sm transition-colors",
                      stale
                        ? "border-red-500 bg-red-100 text-red-950 active:bg-red-200"
                        : "border-slate-200 bg-white active:bg-violet-50/40"
                    )}
                    title={
                      stale ? "No activity on this lead for 10+ days" : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {getLeadDisplayTitle(lead)}
                      </p>
                      <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        {statusMap[lead.status]}
                      </span>
                    </div>
                    {contactPersonsDisplay(lead) && (
                      <p className="mt-1 text-sm text-slate-600">
                        {contactPersonsDisplay(lead)}
                      </p>
                    )}
                    {lead.country && (
                      <p className="mt-1.5">
                        <CountryFlag
                          countryName={lead.country}
                          showName
                          size={18}
                        />
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      Created {formatDateTimeParts(lead.createdAt)?.date ?? "-"}
                      {" · "}
                      Updated {formatDateTimeParts(lead.updatedAt)?.date ?? "-"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="capitalize">{lead.industry}</span>
                      {formatProductsLabel(lead) && (
                        <span>{formatProductsLabel(lead)}</span>
                      )}
                      {isAdmin ? (
                        <ReassignLeadSelect
                          leadId={lead._id}
                          value={lead.responsiblePerson}
                          team={teamOptions}
                          compact
                        />
                      ) : (
                        <span>{lead.responsiblePerson}</span>
                      )}
                    </div>
                    {followUpLabel && (
                      <p className="mt-2">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${followUpBadgeClass[followUpUrgency]}`}
                        >
                          {followUpLabel}
                        </span>
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hidden rounded-lg border border-slate-200 md:block">
            <div className={TABLE_VIEWPORT_CLASS}>
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-200 bg-[#f1f3f5]">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Company name
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Contact person
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Country
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Responsible
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Follow-up
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  {DATE_FIELDS.map((field) => {
                    const active = dateField === field.id;
                    return (
                      <th
                        key={field.id}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (active) {
                              setSortOrder(
                                sortOrder === "desc" ? "asc" : "desc"
                              );
                            } else {
                              setDateField(field.id);
                            }
                          }}
                          className={cn(
                            "inline-flex items-center gap-1 uppercase tracking-wide hover:text-violet-700",
                            active && "text-violet-700"
                          )}
                          title={
                            active
                              ? "Click to reverse the order"
                              : "Sort by this date"
                          }
                        >
                          {field.id === "createdAt" ? "Created" : "Updated"}
                          {active &&
                            (sortOrder === "desc" ? (
                              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpNarrowWide className="h-3.5 w-3.5" />
                            ))}
                        </button>
                      </th>
                    );
                  })}
                  <th className="w-24 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginated.map((lead) => {
                  const stale = isLeadStale(lead);
                  const cellMuted = stale ? "text-red-900" : "text-slate-600";
                  return (
                  <tr
                    key={lead._id}
                    onClick={() => onSelectLead(lead)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      staleLeadRowClass(stale)
                    )}
                    title={
                      stale
                        ? "No activity on this lead for 10+ days"
                        : "Click to edit lead"
                    }
                  >
                    <td
                      className={cn(
                        "px-4 py-3.5 font-medium",
                        stale ? "text-red-950" : "text-slate-900"
                      )}
                    >
                      {getLeadDisplayTitle(lead)}
                    </td>
                    <td className={cn("px-4 py-3.5", cellMuted)}>
                      {contactPersonsDisplay(lead) || "—"}
                    </td>
                    <td className={cn("px-4 py-3.5", cellMuted)}>
                      {lead.country ? (
                        <CountryFlag
                          countryName={lead.country}
                          showName
                          size={18}
                        />
                      ) : (
                        <span className={stale ? "text-red-700" : "text-slate-400"}>
                          —
                        </span>
                      )}
                    </td>
                    <td className={cn("px-4 py-3.5", cellMuted)}>
                      {formatProductsLabel(lead)
                        ? `${formatProductsLabel(lead)} · ${formatCurrency(lead.product?.price || 0)}`
                        : "—"}
                    </td>
                    <td className={cn("px-4 py-3.5 capitalize", cellMuted)}>
                      {lead.industry}
                    </td>
                    <td
                      className={cn("px-4 py-3.5", cellMuted)}
                      onClick={(e) => isAdmin && e.stopPropagation()}
                    >
                      {isAdmin ? (
                        <ReassignLeadSelect
                          leadId={lead._id}
                          value={lead.responsiblePerson}
                          team={teamOptions}
                          compact
                        />
                      ) : (
                        lead.responsiblePerson
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {lead.followUpDate ? (
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${followUpBadgeClass[getFollowUpUrgency(lead.followUpDate)]}`}
                        >
                          {formatFollowUpDate(lead.followUpDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        {statusMap[lead.status]}
                      </span>
                    </td>
                    {DATE_FIELDS.map((field) => {
                      const parts = formatDateTimeParts(lead[field.id]);
                      return (
                        <td
                          key={field.id}
                          className={cn(
                            "px-4 py-3.5 whitespace-nowrap",
                            cellMuted
                          )}
                        >
                          {parts ? (
                            <>
                              <span className="block">{parts.date}</span>
                              <span
                                className={cn(
                                  "block text-xs",
                                  stale ? "text-red-700" : "text-slate-400"
                                )}
                              >
                                {parts.time}
                              </span>
                            </>
                          ) : (
                            <span
                              className={stale ? "text-red-700" : "text-slate-400"}
                            >
                              &mdash;
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={rows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
