"use client";

import { Check, X } from "lucide-react";
import {
  DAILY_PRICE_LOCATIONS,
  DAILY_PRICE_ROWS,
  type DailyPriceGrid,
  type DailyPriceLocationId,
  type DailyPriceRowId,
  type LocationColumnMeta,
  type MethodPriceMeta,
} from "@/lib/dailyPrice";

function formatPrice(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(value);
}

function locationHasPrices(
  prices: DailyPriceGrid,
  locationId: DailyPriceLocationId
): boolean {
  return DAILY_PRICE_ROWS.some(
    (row) => prices[row.id]?.[locationId] != null
  );
}

interface DailyPriceTableProps {
  prices: DailyPriceGrid;
  columnMeta?: MethodPriceMeta;
  editable?: boolean;
  canApprove?: boolean;
  onApprove?: (locationId: DailyPriceLocationId) => void;
  onReject?: (locationId: DailyPriceLocationId) => void;
  actionLocationId?: DailyPriceLocationId | null;
  onCellChange?: (
    rowId: DailyPriceRowId,
    locId: DailyPriceLocationId,
    value: string
  ) => void;
  getCellValue?: (
    rowId: DailyPriceRowId,
    locId: DailyPriceLocationId
  ) => number | undefined;
}

const DAILY_PRICE_APPROVER_LABEL = "Deelep sir";

function ApprovalControls({
  meta,
  hasPrices,
  canApprove,
  locationId,
  onApprove,
  onReject,
  acting,
}: {
  meta?: LocationColumnMeta;
  hasPrices: boolean;
  canApprove?: boolean;
  locationId: DailyPriceLocationId;
  onApprove?: (locationId: DailyPriceLocationId) => void;
  onReject?: (locationId: DailyPriceLocationId) => void;
  acting?: boolean;
}) {
  if (!hasPrices) {
    return <p className="mt-1 text-[10px] text-slate-400">No prices</p>;
  }

  if (meta?.approved) {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">
        <Check className="h-3 w-3 shrink-0" />
        Approved by {DAILY_PRICE_APPROVER_LABEL}
      </div>
    );
  }

  if (meta?.rejected && meta.rejectedByName) {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[10px] font-bold text-red-800">
        <X className="h-3 w-3 shrink-0" />
        Wrong · {meta.rejectedByName}
      </div>
    );
  }

  if (canApprove && onApprove && onReject) {
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onApprove(locationId)}
          disabled={acting}
          title="Approve (Right)"
          className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          <Check className="h-3 w-3" />
          Right
        </button>
        <button
          type="button"
          onClick={() => onReject(locationId)}
          disabled={acting}
          title="Reject (Wrong)"
          className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-800 hover:bg-red-100 disabled:opacity-60"
        >
          <X className="h-3 w-3" />
          Wrong
        </button>
      </div>
    );
  }

  return (
    <p className="mt-1.5 text-[10px] font-semibold text-amber-700">
      Pending approval
    </p>
  );
}

function LocationMetaBlock({
  label,
  meta,
  hasPrices,
  canApprove,
  locationId,
  onApprove,
  onReject,
  acting,
}: {
  label: string;
  meta?: LocationColumnMeta;
  hasPrices: boolean;
  canApprove?: boolean;
  locationId: DailyPriceLocationId;
  onApprove?: (locationId: DailyPriceLocationId) => void;
  onReject?: (locationId: DailyPriceLocationId) => void;
  acting?: boolean;
}) {
  const addedBy = meta?.addedByName?.trim();
  const updatedBy = meta?.updatedByName?.trim();
  const showUpdated =
    updatedBy && updatedBy.toLowerCase() !== addedBy?.toLowerCase();

  return (
    <div className="space-y-0.5 text-[10px] leading-snug">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {addedBy && (
        <p className="text-slate-500">
          Added: <span className="font-semibold text-slate-700">{addedBy}</span>
        </p>
      )}
      {showUpdated && (
        <p className="text-slate-500">
          Updated:{" "}
          <span className="font-semibold text-slate-700">{updatedBy}</span>
        </p>
      )}
      {!addedBy && !showUpdated && hasPrices && (
        <p className="text-slate-400">User not recorded</p>
      )}
      <ApprovalControls
        meta={meta}
        hasPrices={hasPrices}
        canApprove={canApprove}
        locationId={locationId}
        onApprove={onApprove}
        onReject={onReject}
        acting={acting}
      />
    </div>
  );
}

export function DailyPriceTable({
  prices,
  columnMeta,
  editable = false,
  canApprove = false,
  onApprove,
  onReject,
  actionLocationId = null,
  onCellChange,
  getCellValue,
}: DailyPriceTableProps) {
  const readCell = (polishId: DailyPriceRowId, locId: DailyPriceLocationId) =>
    getCellValue
      ? getCellValue(polishId, locId)
      : prices[polishId]?.[locId];

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      {editable && (
        <p className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Save prices first. Approve on the main table in each location row using{" "}
          <span className="font-bold">Right ✓</span> or{" "}
          <span className="font-bold">Wrong ✗</span>.
        </p>
      )}
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-[#f1f3f5]">
            <th className="sticky left-0 z-10 min-w-[10rem] border-r border-slate-200 bg-[#f1f3f5] px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
              Location
            </th>
            {DAILY_PRICE_ROWS.map((polish) => (
              <th
                key={polish.id}
                className="min-w-[6.5rem] border-r border-slate-200 px-2 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600 last:border-r-0"
              >
                {polish.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAILY_PRICE_LOCATIONS.map((loc, locIndex) => {
            const meta = columnMeta?.[loc.id];
            const approved = meta?.approved;
            const rejected = meta?.rejected;
            const hasPrices = locationHasPrices(prices, loc.id);
            const rowTint = approved
              ? "bg-emerald-50/50"
              : rejected
                ? "bg-red-50/50"
                : locIndex % 2 === 0
                  ? "bg-white"
                  : "bg-[#f8f9fa]";

            return (
              <tr key={loc.id} className={rowTint}>
                <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-4 py-3 align-top">
                  <LocationMetaBlock
                    label={loc.label}
                    meta={meta}
                    hasPrices={hasPrices}
                    canApprove={canApprove}
                    locationId={loc.id}
                    onApprove={onApprove}
                    onReject={onReject}
                    acting={actionLocationId === loc.id}
                  />
                </td>
                {DAILY_PRICE_ROWS.map((polish) => {
                  const value = readCell(polish.id, loc.id);

                  return (
                    <td
                      key={polish.id}
                      className="relative border-r border-slate-100 px-2 py-2 text-center text-slate-700 last:border-r-0"
                    >
                      {!editable && approved && (
                        <Check className="pointer-events-none absolute right-1 top-1 h-3 w-3 text-emerald-600" />
                      )}
                      {!editable && rejected && (
                        <X className="pointer-events-none absolute right-1 top-1 h-3 w-3 text-red-600" />
                      )}
                      {editable && onCellChange ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={value ?? ""}
                          onChange={(e) =>
                            onCellChange(polish.id, loc.id, e.target.value)
                          }
                          placeholder="—"
                          className="w-full min-w-[4.5rem] rounded-md border border-slate-200 px-2 py-1.5 text-center text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                        />
                      ) : (
                        <span className="tabular-nums">{formatPrice(value)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
