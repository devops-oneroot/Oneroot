"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { Lead } from "@/lib/types";

interface DeleteLeadDialogProps {
  lead: Lead;
  open: boolean;
  onCancel: () => void;
  onConfirm: (confirmName: string) => Promise<void>;
  isDeleting?: boolean;
}

/**
 * Deleting a lead cannot be undone, so the admin has to type the lead's name
 * before the button turns on.
 */
export function DeleteLeadDialog({
  lead,
  open,
  onCancel,
  onConfirm,
  isDeleting,
}: DeleteLeadDialogProps) {
  const [typed, setTyped] = useState("");

  const leadName = lead.company?.trim() || lead.name?.trim() || "";
  const matches =
    typed.trim().toLowerCase() === leadName.toLowerCase() && leadName.length > 0;

  const remarks = lead.remarks?.length ?? 0;
  const documents = lead.documents?.length ?? 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={isDeleting ? undefined : onCancel}
        aria-label="Cancel"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-lead-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-xl bg-white shadow-2xl sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h2
                id="delete-lead-title"
                className="text-base font-semibold text-red-900"
              >
                Delete this lead permanently?
              </h2>
              <p className="mt-0.5 text-sm text-red-800">
                This cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg p-1 text-red-700 hover:bg-red-100 disabled:opacity-50"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <p className="font-semibold text-slate-900">{leadName || "—"}</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Responsible: {lead.responsiblePerson || "—"}
            </p>
            {(remarks > 0 || documents > 0) && (
              <p className="mt-1 text-xs text-slate-600">
                {remarks > 0 && `${remarks} remark${remarks === 1 ? "" : "s"}`}
                {remarks > 0 && documents > 0 && " · "}
                {documents > 0 &&
                  `${documents} document${documents === 1 ? "" : "s"}`}
                {" will be deleted with it."}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-600">
            Its entries in Outreach and My Days are kept, so past reports stay
            accurate.
          </p>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Type <span className="font-bold text-slate-900">{leadName}</span>{" "}
              to confirm
            </span>
            <input
              type="text"
              value={typed}
              autoFocus
              autoComplete="off"
              disabled={isDeleting}
              onChange={(event) => setTyped(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
              placeholder={leadName}
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || isDeleting}
            onClick={() => onConfirm(typed.trim())}
            className="w-full rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isDeleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
