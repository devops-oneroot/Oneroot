"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  DAILY_PRICE_FARMING_METHODS,
  emptyDailyPriceByMethod,
  normalizeDailyPriceByMethod,
  todayDateInputValue,
  type DailyPriceByMethod,
  type DailyPriceEntry,
  type DailyPriceFarmingMethodId,
  type DailyPriceLocationId,
  type DailyPriceRowId,
} from "@/lib/dailyPrice";
import { inputClass } from "@/lib/leadForm";
import { DailyPriceTable } from "./DailyPriceTable";

interface DailyPriceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    date: string;
    prices: DailyPriceByMethod;
  }) => Promise<void>;
  isSubmitting?: boolean;
  entry?: DailyPriceEntry | null;
  /** When set, modal edits only this farming method table. */
  editingMethod?: DailyPriceFarmingMethodId | null;
}

export function DailyPriceModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  entry,
  editingMethod = null,
}: DailyPriceModalProps) {
  const [date, setDate] = useState(todayDateInputValue());
  const [prices, setPrices] = useState<DailyPriceByMethod>(
    emptyDailyPriceByMethod()
  );

  const isMethodEdit = !!entry && !!editingMethod;
  const isCreate = !entry;
  const methodsToShow = isMethodEdit
    ? DAILY_PRICE_FARMING_METHODS.filter((m) => m.id === editingMethod)
    : DAILY_PRICE_FARMING_METHODS;

  const methodLabel = DAILY_PRICE_FARMING_METHODS.find(
    (m) => m.id === editingMethod
  )?.label;

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setDate(entry.date);
      setPrices(normalizeDailyPriceByMethod(entry.prices));
    } else {
      setDate(todayDateInputValue());
      setPrices(emptyDailyPriceByMethod());
    }
  }, [open, entry]);

  if (!open) return null;

  const setCell = (
    methodId: DailyPriceFarmingMethodId,
    rowId: DailyPriceRowId,
    locId: DailyPriceLocationId,
    value: string
  ) => {
    setPrices((prev) => {
      const next = { ...prev };
      const grid = { ...next[methodId] };
      const row = { ...grid[rowId] };
      if (value === "") {
        delete row[locId];
      } else {
        const num = Number(value);
        row[locId] = Number.isFinite(num) ? num : undefined;
      }
      grid[rowId] = row;
      next[methodId] = grid;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isMethodEdit && editingMethod) {
      const payload = emptyDailyPriceByMethod();
      payload[editingMethod] = prices[editingMethod];
      await onSubmit({ date, prices: payload });
      return;
    }

    await onSubmit({ date, prices });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[min(92dvh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isMethodEdit
                ? `Edit ${methodLabel}`
                : isCreate
                  ? "Add daily price"
                  : "Edit daily price"}
            </h2>
            <p className="text-sm text-slate-500">
              {isMethodEdit
                ? "Update prices for this farming method only"
                : "Each farming method has its own location × polish type table"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-6">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} mt-1 max-w-xs`}
              required
              readOnly={isMethodEdit}
              disabled={isMethodEdit}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-auto px-3 py-4 sm:px-6">
            {methodsToShow.map((method) => (
              <section key={method.id}>
                {!isMethodEdit && (
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-violet-700">
                    {method.label}
                  </h3>
                )}
                <DailyPriceTable
                  prices={prices[method.id]}
                  editable
                  onCellChange={(rowId, locId, value) =>
                    setCell(method.id, rowId, locId, value)
                  }
                  getCellValue={(rowId, locId) =>
                    prices[method.id][rowId]?.[locId]
                  }
                />
              </section>
            ))}
          </div>

          <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving…"
                : isMethodEdit
                  ? `Save ${methodLabel}`
                  : isCreate
                    ? "Save daily price"
                    : "Save changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
