"use client";

import { Calendar, ClipboardList, MessageSquare, UserRound } from "lucide-react";
import {
  formatActivityTime,
  type DailyActivityReport,
} from "@/lib/dailyActivity";
import { leadStatusLabel } from "@/lib/types";

function statusLabel(id: string): string {
  return leadStatusLabel(id);
}

function clientLabel(row: {
  name: string;
  company: string;
  contactPerson: string;
}): string {
  const parts = [
    row.company?.trim(),
    row.name?.trim(),
    row.contactPerson?.trim(),
  ].filter(Boolean);
  return parts[0] || "—";
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

export function DailyReportView({ report }: { report: DailyActivityReport }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Leads added"
          value={report.summary.leadsAdded}
          icon={<ClipboardList className="h-3.5 w-3.5" />}
        />
        <SummaryCard
          label="Status updates"
          value={report.summary.statusChanges}
          icon={<Calendar className="h-3.5 w-3.5" />}
        />
        <SummaryCard
          label="Reassignments"
          value={report.summary.reassignments ?? report.reassignments?.length ?? 0}
          icon={<UserRound className="h-3.5 w-3.5" />}
        />
        <SummaryCard
          label="Lead remarks"
          value={report.summary.remarksAdded}
          icon={<MessageSquare className="h-3.5 w-3.5" />}
        />
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Leads added ({report.leadsAdded.length})
        </h3>
        {report.leadsAdded.length === 0 ? (
          <p className="text-sm text-slate-500">No new leads on this date.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {report.leadsAdded.map((row) => (
              <li key={row.leadId} className="px-3 py-2.5 text-sm">
                <p className="font-medium text-slate-900">{clientLabel(row)}</p>
                <p className="text-xs text-slate-500">
                  Status: {statusLabel(row.status)} ·{" "}
                  {formatActivityTime(row.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Status changes ({report.statusChanges.length})
        </h3>
        {report.statusChanges.length === 0 ? (
          <p className="text-sm text-slate-500">
            No status changes on this date.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {report.statusChanges.map((row, i) => (
              <li
                key={`${row.leadId}-${row.at}-${i}`}
                className="px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-slate-900">{clientLabel(row)}</p>
                <p className="text-xs text-violet-700">
                  {statusLabel(row.fromStatus)} → {statusLabel(row.toStatus)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatActivityTime(row.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Reassignments ({report.reassignments?.length ?? 0})
        </h3>
        {!report.reassignments?.length ? (
          <p className="text-sm text-slate-500">
            No reassignments on this date.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {report.reassignments.map((row, i) => (
              <li
                key={`${row.leadId}-${row.at}-${i}`}
                className="px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-slate-900">{clientLabel(row)}</p>
                <p className="text-xs text-amber-700">
                  {row.fromResponsible || "—"} → {row.toResponsible || "—"}
                </p>
                <p className="text-xs text-slate-500">
                  {row.reassignedBy
                    ? `By ${row.reassignedBy} · `
                    : ""}
                  {formatActivityTime(row.at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">
          Lead remarks ({report.remarks.length})
        </h3>
        {report.remarks.length === 0 ? (
          <p className="text-sm text-slate-500">No remarks on this date.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {report.remarks.map((row) => (
              <li
                key={row.remarkId || `${row.leadId}-${row.at}-${row.text}`}
                className="px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-slate-900">
                  {clientLabel(row)}
                  <span className="ml-2 font-normal text-slate-400">
                    {formatActivityTime(row.at)}
                  </span>
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">
                  {row.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
