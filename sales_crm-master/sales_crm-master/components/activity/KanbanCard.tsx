"use client";

import { contactPersonsDisplay } from "@/lib/leadContacts";
import {
  idleBucketMeta,
  leadAlertLabel,
  leadIdleBucket,
} from "@/lib/leadIdle";
import { formatProductsLabel, getLeadDisplayTitle } from "@/lib/products";
import type { Lead } from "@/lib/types";
import {
  cn,
  followUpBadgeClass,
  formatCurrency,
  formatFollowUpDate,
  getFollowUpUrgency,
} from "@/lib/utils";
import { CountryFlag } from "@/components/country/CountryFlag";
import { ReassignLeadSelect } from "@/components/leads/ReassignLeadSelect";
import { Building2, Calendar, FileText, User } from "lucide-react";

interface KanbanCardProps {
  lead: Lead;
  onClick: () => void;
  isAdmin?: boolean;
  team?: string[];
}

export function KanbanCard({
  lead,
  onClick,
  isAdmin = false,
  team = [],
}: KanbanCardProps) {
  const bucketId = leadIdleBucket(lead);
  const bucket = bucketId ? idleBucketMeta(bucketId) : null;
  // Kept as the single switch for the tinted text below.
  const stale = bucket !== null;
  const remarkCount = lead.remarks?.length ?? 0;
  const latestRemark = lead.remarks?.[lead.remarks.length - 1];
  const followUpLabel = formatFollowUpDate(lead.followUpDate);
  const followUpUrgency = getFollowUpUrgency(lead.followUpDate);
  const docCount = lead.documents?.length ?? 0;

  const mutedText = bucket ? bucket.cardText.muted : "text-slate-500";
  const bodyText = bucket ? bucket.cardText.body : "text-slate-600";
  const titleText = bucket ? bucket.cardText.title : "text-slate-900";
  const strongText = bucket ? bucket.cardText.title : "text-slate-900";

  return (
    <div
      onClick={onClick}
      style={bucket?.card}
      className={cn(
        "cursor-pointer rounded-lg border p-3 shadow-sm transition-all",
        bucket
          ? "alert-blink hover:shadow-md"
          : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-md"
      )}
      title={
        bucket
          ? `${bucket.label}: ${leadAlertLabel(lead)}`
          : undefined
      }
    >
      {bucket && (
        <p
          className={cn(
            "mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide",
            bucket.cardText.tag
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", bucket.dot)} />
          {bucket.label} · {leadAlertLabel(lead)}
        </p>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className={cn("font-semibold leading-snug", titleText)}>
            {getLeadDisplayTitle(lead)}
          </h4>
          {contactPersonsDisplay(lead) && (
            <p className={cn("mt-0.5 text-xs", mutedText)}>
              {contactPersonsDisplay(lead)}
            </p>
          )}
        </div>

        <div
          className="shrink-0"
          onClick={(e) => isAdmin && e.stopPropagation()}
          onMouseDown={(e) => isAdmin && e.stopPropagation()}
        >
          {isAdmin ? (
            <ReassignLeadSelect
              leadId={lead._id}
              value={lead.responsiblePerson}
              team={team}
              compact
              className="max-w-[7.5rem] border-violet-200 bg-violet-50/80 text-[11px] font-medium text-violet-800 shadow-sm"
            />
          ) : (
            <span
              className={cn(
                "inline-flex max-w-[7.5rem] items-center gap-1 truncate rounded-md border px-2 py-1 text-[11px] font-medium",
                stale
                  ? "border-black/10 bg-white/60 text-current"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              )}
              title={lead.responsiblePerson}
            >
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.responsiblePerson}</span>
            </span>
          )}
        </div>
      </div>

      <p className={cn("mt-1.5 text-xs", bodyText)}>
        Qty: <span className={cn("font-semibold", strongText)}>{lead.product?.quantity ?? 0}</span>
        <span className={cn("mx-1.5", stale ? "opacity-50" : "text-slate-300")}>
          ·
        </span>
        Price:{" "}
        <span className={cn("font-semibold", strongText)}>
          {formatCurrency(lead.product?.price ?? 0)}
        </span>
      </p>
      {lead.company && (
        <p className={cn("mt-1 flex items-center gap-1 text-xs", mutedText)}>
          <Building2 className="h-3 w-3 shrink-0" />
          {lead.company}
        </p>
      )}
      {lead.country && (
        <p className="mt-1">
          <CountryFlag countryName={lead.country} showName size={18} />
        </p>
      )}
      {followUpLabel && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium",
            followUpBadgeClass[followUpUrgency]
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" />
          Follow-up: {followUpLabel}
          {followUpUrgency === "overdue" && " (Overdue)"}
          {followUpUrgency === "today" && " (Today)"}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
            stale ? "bg-black/10 text-current" : "bg-violet-50 text-violet-700"
          )}
        >
          {lead.industry}
        </span>
        {formatProductsLabel(lead) && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px]",
              stale ? "bg-black/10 text-current" : "bg-slate-100 text-slate-600"
            )}
          >
            {formatProductsLabel(lead)}
          </span>
        )}
      </div>
      {latestRemark && (
        <p
          className={cn(
            "mt-2 line-clamp-2 border-t pt-2 text-xs italic",
            stale
              ? cn("border-black/10", bodyText)
              : "border-slate-100 text-slate-500"
          )}
        >
          {latestRemark.text}
        </p>
      )}
      <div
        className={cn(
          "mt-1 flex flex-wrap gap-2 text-[10px]",
          stale ? mutedText : "text-slate-400"
        )}
      >
        {remarkCount > 0 && (
          <span>
            {remarkCount} remark{remarkCount !== 1 ? "s" : ""}
          </span>
        )}
        {docCount > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5",
              stale ? mutedText : "text-violet-600"
            )}
          >
            <FileText className="h-3 w-3" />
            {docCount} doc{docCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
