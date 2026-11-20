"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, ExternalLink, X } from "lucide-react";
import { fetchLead } from "@/lib/api";
import { dailyActivityLabel, formatOutreachTime, type OutreachLeadDetail } from "@/lib/outreachReport";
import { leadStatusLabel, type Lead } from "@/lib/types";
import { formatFollowUpDate } from "@/lib/utils";

export interface OutreachLeadPreviewSelection {
  row: OutreachLeadDetail;
  activityLabel: string;
}

interface OutreachLeadPreviewModalProps {
  open: boolean;
  selection: OutreachLeadPreviewSelection | null;
  onClose: () => void;
  onMoreDetail: (lead: Lead) => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:w-28">
        {label}
      </dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );
}

export function OutreachLeadPreviewModal({
  open,
  selection,
  onClose,
  onMoreDetail,
}: OutreachLeadPreviewModalProps) {
  const leadId = selection?.row.leadId ?? "";

  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => fetchLead(leadId),
    enabled: open && !!leadId,
  });

  if (!open || !selection) return null;

  const { row, activityLabel } = selection;
  const statusLabel = lead ? leadStatusLabel(lead.status) : null;
  const createdLabel = lead?.createdAt
    ? new Date(lead.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Close preview"
      />
      <div className="relative z-10 flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-[#0b0e1e] px-4 py-4 text-white sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-300">
              Lead preview
            </p>
            <h3 className="mt-1 truncate text-lg font-bold">
              {row.company?.trim() || row.name?.trim() || "Lead"}
            </h3>
            <p className="text-sm text-slate-400">{activityLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {isLoading && (
            <p className="py-10 text-center text-slate-500">Loading lead…</p>
          )}
          {isError && (
            <p className="py-10 text-center text-red-600">
              Could not load this lead.
            </p>
          )}
          {lead && !isLoading && (
            <dl className="space-y-3">
              <DetailRow label="Company" value={lead.company || lead.name} />
              <DetailRow label="Contact" value={row.contactPerson || lead.contactPerson} />
              <DetailRow label="Phone" value={lead.phone || lead.whatsappNumber} />
              <DetailRow label="Email" value={lead.email} />
              <DetailRow label="Country" value={lead.country} />
              <DetailRow label="Assignee" value={lead.responsiblePerson} />
              <DetailRow label="Status" value={statusLabel} />
              <DetailRow
                label="Follow-up"
                value={formatFollowUpDate(lead.followUpDate) || row.followUpDate}
              />
              <DetailRow label="Created" value={createdLabel} />
            </dl>
          )}

          <div className="mt-5 rounded-lg border border-violet-100 bg-violet-50/80 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Outreach activity
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{activityLabel}</p>
            {row.dailyActivityType && (
              <p className="mt-0.5 text-xs text-slate-600">
                {dailyActivityLabel(row.dailyActivityType)}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {formatOutreachTime(row.at)}
            </p>
            {row.remarkText && (
              <p className="mt-2 text-sm text-slate-700">{row.remarkText}</p>
            )}
            {row.followUpDate && (
              <p className="mt-2 inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                <Calendar className="h-3.5 w-3.5" />
                Follow-up {row.followUpDate}
              </p>
            )}
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <button
            type="button"
            disabled={!lead || isLoading}
            onClick={() => {
              if (lead) onMoreDetail(lead);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <ExternalLink className="h-4 w-4" />
            More detail
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Opens full lead edit in a new browser tab
          </p>
        </footer>
      </div>
    </div>
  );
}
