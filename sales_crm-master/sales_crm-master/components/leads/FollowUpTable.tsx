"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Pencil, Search } from "lucide-react";
import { contactPersonsDisplay } from "@/lib/leadContacts";
import { getLeadDisplayTitle } from "@/lib/products";
import type { Lead } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";
import {
  compareLeadsByFollowUp,
  daysFollowUpOverdue,
  followUpBadgeClass,
  formatFollowUpDate,
  getFollowUpUrgency,
  isFollowUpOverdue,
} from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 15;

interface FollowUpTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export function FollowUpTable({ leads, onSelectLead }: FollowUpTableProps) {
  const [search, setSearch] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statusMap = useMemo(
    () => Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s.label])),
    []
  );

  const overdueLeads = useMemo(
    () =>
      leads
        .filter((lead) => isFollowUpOverdue(lead.followUpDate))
        .sort(compareLeadsByFollowUp),
    [leads]
  );

  const responsibleOptions = useMemo(() => {
    const names = new Set(
      overdueLeads.map((l) => l.responsiblePerson?.trim()).filter(Boolean)
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [overdueLeads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return overdueLeads.filter((lead) => {
      const matchesSearch =
        !q ||
        getLeadDisplayTitle(lead).toLowerCase().includes(q) ||
        contactPersonsDisplay(lead).toLowerCase().includes(q) ||
        lead.company?.toLowerCase().includes(q) ||
        lead.responsiblePerson.toLowerCase().includes(q);
      const matchesResponsible =
        responsibleFilter === "all" ||
        lead.responsiblePerson === responsibleFilter;
      return matchesSearch && matchesResponsible;
    });
  }, [overdueLeads, search, responsibleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, responsibleFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="p-3 sm:p-4">
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <span className="font-semibold">{overdueLeads.length}</span> lead
          {overdueLeads.length === 1 ? "" : "s"} with overdue follow-up dates.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact, responsible…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          />
        </div>
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
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-[#f8f9fa] py-16 text-center">
          <p className="text-slate-500">
            {overdueLeads.length === 0
              ? "No overdue follow-ups. All leads are on track."
              : "No overdue leads match your search."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-[#f8f9fa]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Company
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Responsible
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Follow-up date
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Days overdue
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="w-24 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginated.map((lead) => {
                  const daysOverdue = daysFollowUpOverdue(lead.followUpDate);
                  return (
                    <tr
                      key={lead._id}
                      onClick={() => onSelectLead(lead)}
                      className="cursor-pointer bg-red-50/40 transition-colors hover:bg-red-50"
                      title="Click to view and edit customer"
                    >
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {getLeadDisplayTitle(lead)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {contactPersonsDisplay(lead) || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {lead.responsiblePerson}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${followUpBadgeClass[getFollowUpUrgency(lead.followUpDate)]}`}
                        >
                          {formatFollowUpDate(lead.followUpDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {daysOverdue} day{daysOverdue === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {statusMap[lead.status]}
                        </span>
                      </td>
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

          <ul className="space-y-3 md:hidden">
            {paginated.map((lead) => {
              const daysOverdue = daysFollowUpOverdue(lead.followUpDate);
              return (
                <li key={lead._id}>
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className="w-full rounded-lg border border-red-200 bg-red-50/50 p-4 text-left"
                  >
                    <p className="font-semibold text-slate-900">
                      {getLeadDisplayTitle(lead)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {contactPersonsDisplay(lead) || "No contact"} ·{" "}
                      {lead.responsiblePerson}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${followUpBadgeClass.overdue}`}
                      >
                        {formatFollowUpDate(lead.followUpDate)}
                      </span>
                      <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        {daysOverdue} day{daysOverdue === 1 ? "" : "s"} overdue
                      </span>
                      <span className="inline-flex rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {statusMap[lead.status]}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
