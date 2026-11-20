"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  IDLE_BUCKETS,
  activeLeads,
  groupLeadsByIdleBucket,
  leadActiveLabel,
  leadAlertLabel,
  type IdleBucketId,
} from "@/lib/leadIdle";
import { getLeadDisplayTitle } from "@/lib/products";
import { leadStatusLabel, type Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IdleLeadAlertsProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  /** Whose leads these are, when a Responsible person filter is active. */
  scopeLabel?: string;
}

type PanelId = IdleBucketId | "active";

interface Panel {
  id: PanelId;
  label: string;
  hint: string;
  explanation: string;
  items: Lead[];
  rowLabel: (lead: Lead) => string;
  /** Solid colours the button blinks between; undefined = steady. */
  blink?: React.CSSProperties;
  activeClass: string;
  dot: string;
  icon: React.ReactNode;
}

/**
 * Three follow-up alerts plus Active, above the board. An alert pulses while
 * it has leads in it; Active is steady. Hovering (or tapping, on touch) lists
 * the leads, and picking one opens it.
 */
export function IdleLeadAlerts({
  leads,
  onSelectLead,
  scopeLabel,
}: IdleLeadAlertsProps) {
  const [open, setOpen] = useState<PanelId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const panels = useMemo<Panel[]>(() => {
    const groups = groupLeadsByIdleBucket(leads);
    const alerts: Panel[] = IDLE_BUCKETS.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      hint: bucket.hint,
      explanation:
        "A follow-up date that has passed with nothing done since, or a lead with no follow-up booked and no activity. Booking a follow-up or logging any activity clears it.",
      items: groups[bucket.id],
      rowLabel: leadAlertLabel,
      blink: bucket.buttonAlert,
      activeClass: bucket.active,
      dot: bucket.dot,
      icon: (
        <AlertTriangle
          className={cn(
            "h-4 w-4",
            bucket.id === "risk"
              ? "text-red-600"
              : bucket.id === "idle_critical"
                ? "text-orange-500"
                : "text-amber-500"
          )}
        />
      ),
    }));
    alerts.push({
      id: "active",
      label: "Active",
      hint: "Being worked — recent activity or a follow-up booked",
      explanation:
        "Leads in none of the alerts: something was done recently, or a follow-up is booked for today or later.",
      items: activeLeads(leads),
      rowLabel: leadActiveLabel,
      activeClass: "bg-emerald-700 text-white border-emerald-700",
      dot: "bg-emerald-500",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    });
    return alerts;
  }, [leads]);

  // Tap-to-open on touch devices needs a way to close again.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="flex flex-wrap items-center gap-2">
      {panels.map((panel) => {
        const count = panel.items.length;
        const isOpen = open === panel.id;
        const isActivePanel = panel.id === "active";
        const lit = count > 0 && !isOpen;

        return (
          <div
            key={panel.id}
            className="relative"
            onMouseEnter={() => count > 0 && setOpen(panel.id)}
            onMouseLeave={() =>
              setOpen((current) => (current === panel.id ? null : current))
            }
          >
            <button
              type="button"
              onClick={() => count > 0 && setOpen(isOpen ? null : panel.id)}
              onFocus={() => count > 0 && setOpen(panel.id)}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              aria-label={`${panel.label}: ${count} lead${count === 1 ? "" : "s"}, ${panel.hint}`}
              style={lit && panel.blink ? panel.blink : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm transition-colors",
                // Alert with leads in it: solid alert colour, blinking.
                lit && panel.blink && "alert-blink text-white",
                // Active with leads in it: solid green, steady.
                lit && !panel.blink && "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
                // Open: solid, steady.
                isOpen && panel.activeClass,
                // Empty: quiet.
                count === 0 && "cursor-default border-slate-200 bg-slate-50 text-slate-400"
              )}
              title={panel.hint}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  count > 0 ? "bg-white" : panel.dot
                )}
              />
              {panel.label}
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
                  count > 0
                    ? "bg-white text-slate-900"
                    : "bg-white text-slate-500 ring-1 ring-slate-200"
                )}
              >
                {count}
              </span>
            </button>

            {isOpen && count > 0 && (
              <div
                role="dialog"
                aria-label={`${panel.label} leads`}
                className="absolute left-0 top-full z-40 mt-1.5 w-[min(92vw,22rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
              >
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  {panel.icon}
                  <p className="text-xs font-semibold text-slate-800">
                    {panel.label} · {count} lead{count === 1 ? "" : "s"}
                    {scopeLabel ? ` · ${scopeLabel}` : ""}
                  </p>
                  {!isActivePanel && (
                    <p className="ml-auto text-[11px] text-slate-500">
                      {panel.hint}
                    </p>
                  )}
                </div>
                <p className="border-b border-slate-100 px-3 py-1.5 text-[11px] text-slate-500">
                  {panel.explanation}
                </p>
                <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                  {panel.items.map((lead) => (
                    <li key={lead._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(null);
                          onSelectLead(lead);
                        }}
                        className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left hover:bg-violet-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {getLeadDisplayTitle(lead)}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {lead.responsiblePerson || "Unassigned"} ·{" "}
                            {leadStatusLabel(lead.status)}
                            {lead.country ? ` · ${lead.country}` : ""}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums",
                            isActivePanel ? "text-emerald-700" : "text-slate-600"
                          )}
                        >
                          {panel.rowLabel(lead)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
