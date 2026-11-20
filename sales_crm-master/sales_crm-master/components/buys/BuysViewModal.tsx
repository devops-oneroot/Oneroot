"use client";

import { X } from "lucide-react";
import {
  BUYS_FIELD_LABELS,
  type BuysLeadRow,
  type BuysMatchField,
  type BuysSupplierMatch,
} from "@/lib/buysTypes";
import { cn } from "@/lib/utils";

interface BuysViewModalProps {
  row: BuysLeadRow | null;
  onClose: () => void;
}

function leadTypeLabel(type: string) {
  return type === "export" ? "Export" : "Domestic";
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

function DetailPanel({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        className="shrink-0 border-b border-slate-100 border-t-4 px-4 py-3"
        style={{ borderTopColor: accent }}
      >
        <h4 className="font-semibold text-slate-900">{title}</h4>
      </div>
      <dl className="flex-1 overflow-y-auto p-4">{children}</dl>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function formatVal(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function BreakdownChips({ match }: { match: BuysSupplierMatch }) {
  const fields: BuysMatchField[] = [
    "polish",
    "material",
    "curcumin",
    "price",
    "origin",
  ];
  return (
    <div className="col-span-2 mt-2 flex flex-wrap gap-1.5">
      {fields.map((field) => {
        const score = match.breakdown[field];
        if (score === undefined) return null;
        return (
          <span
            key={field}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              score >= 60
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {BUYS_FIELD_LABELS[field]}: {score}%
          </span>
        );
      })}
    </div>
  );
}

export function BuysViewModal({ row, onClose }: BuysViewModalProps) {
  if (!row) return null;

  const best = row.bestMatch;
  const ld = row.leadDetails;
  const leadName = row.leadName;
  const supplierName = best?.supplierName ?? "—";

  const supplierPanel = best
    ? {
        name: best.supplierName,
        details: best.supplierDetails,
        snapshot: best.supplierSnapshot,
      }
    : null;

  const leadPanel = best
    ? {
        name: best.leadName,
        type: best.leadType,
        snapshot: best.leadSnapshot,
        status: best.leadStatus,
        owner: best.responsiblePerson,
      }
    : {
        name: row.leadName,
        type: row.leadType,
        snapshot: {
          polishLevel: ld?.polishLevel,
          materialType: ld?.materialType,
          minCurcumin: ld?.minCurcumin,
          maxPrice: ld?.maxPrice,
          preferredOrigin: ld?.preferredOrigin,
        },
        status: row.leadStatus,
        owner: row.responsiblePerson,
      };

  const supplierOrigin = supplierPanel?.details
    ? [supplierPanel.details.variety, supplierPanel.details.region]
        .filter(Boolean)
        .join(" · ") || "—"
    : supplierPanel?.snapshot?.origin || "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Match comparison
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900">
              {leadName}
              {best ? ` ↔ ${supplierName}` : ""}
            </h3>
            {best ? (
              <p className="mt-1 text-sm text-slate-500">
                <span
                  className={cn(
                    "mr-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                    scoreTone(best.matchScore)
                  )}
                >
                  {best.matchScore}% match
                </span>
                {leadTypeLabel(best.leadType)} lead
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">No matching supplier</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {!best ? (
          <div className="bg-white p-8 text-center text-slate-500">
            No supplier meets the minimum match % for this lead.
          </div>
        ) : (
          <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2">
            <DetailPanel title="Supplier" accent="#c9a227">
              <FieldRow label="Name" value={supplierPanel?.name} />
              <FieldRow
                label="Supplier number"
                value={formatVal(supplierPanel?.details?.supplierNumber)}
              />
              <FieldRow
                label="Polish level"
                value={formatVal(
                  supplierPanel?.details?.polishLevel ??
                    supplierPanel?.snapshot?.polishLevel
                )}
              />
              <FieldRow
                label="Material type"
                value={formatVal(
                  supplierPanel?.details?.materialType ??
                    supplierPanel?.snapshot?.materialType
                )}
              />
              <FieldRow
                label="Curcumin %"
                value={
                  supplierPanel?.details?.curcuminPercent != null
                    ? `${supplierPanel.details.curcuminPercent}%`
                    : supplierPanel?.snapshot?.curcuminPercent != null
                      ? `${supplierPanel.snapshot.curcuminPercent}%`
                      : "—"
                }
              />
              <FieldRow
                label="Price"
                value={
                  supplierPanel?.details?.price != null
                    ? `₹${supplierPanel.details.price}`
                    : supplierPanel?.snapshot?.price != null
                      ? `₹${supplierPanel.snapshot.price}`
                      : "—"
                }
              />
              <FieldRow label="Origin" value={supplierOrigin} />
              <FieldRow
                label="Grade"
                value={formatVal(supplierPanel?.details?.grade)}
              />
            </DetailPanel>

            <DetailPanel
              title={`Lead (${leadTypeLabel(leadPanel.type)})`}
              accent="#2f9e7a"
            >
              <FieldRow label="Company / name" value={leadPanel.name} />
              <FieldRow label="Type" value={leadTypeLabel(leadPanel.type)} />
              <FieldRow
                label="Polish level"
                value={formatVal(leadPanel.snapshot?.polishLevel)}
              />
              <FieldRow
                label="Material type"
                value={formatVal(leadPanel.snapshot?.materialType)}
              />
              <FieldRow
                label="Curcumin"
                value={
                  leadPanel.snapshot?.minCurcumin != null
                    ? `${leadPanel.snapshot.minCurcumin}%`
                    : "—"
                }
              />
              <FieldRow
                label="Price"
                value={
                  leadPanel.snapshot?.maxPrice != null
                    ? `₹${leadPanel.snapshot.maxPrice}`
                    : "—"
                }
              />
              <FieldRow
                label="Preferred origin"
                value={formatVal(leadPanel.snapshot?.preferredOrigin)}
              />
              <FieldRow label="Owner" value={formatVal(leadPanel.owner)} />
              <FieldRow label="Status" value={formatVal(leadPanel.status)} />
              <div className="grid grid-cols-[130px_1fr] gap-2 pt-2">
                <dt className="font-medium text-slate-500">Field scores</dt>
                <dd>
                  <BreakdownChips match={best} />
                </dd>
              </div>
            </DetailPanel>
          </div>
        )}
      </div>
    </div>
  );
}
