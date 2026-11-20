"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Package,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type { Importer } from "@/lib/types";
import { sendOneClickPersonalizedEmailApi } from "@/lib/api";
import toast from "react-hot-toast";

interface BulkEmailModalProps {
  importers: Importer[];
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SendStatus = "idle" | "sending" | "sent" | "error";

interface LeadProgress {
  importer: Importer;
  status: SendStatus;
  error?: string;
  messageId?: string;
}

export function BulkEmailModal({
  importers,
  open,
  onClose,
  onSuccess,
}: BulkEmailModalProps) {
  const [progressList, setProgressList] = useState<LeadProgress[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);

  // Initialize or reset when opened
  const validImporters = importers.filter((i) => Boolean(i.email?.trim()));
  const invalidCount = importers.length - validImporters.length;

  const handleStartBulkSend = async () => {
    if (validImporters.length === 0) {
      toast.error("None of the selected importers have an email address on file.");
      return;
    }

    setIsRunning(true);
    setDone(false);

    const initialList: LeadProgress[] = validImporters.map((imp) => ({
      importer: imp,
      status: "idle",
    }));
    setProgressList(initialList);

    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < initialList.length; i++) {
      const current = initialList[i];
      // Mark as sending
      setProgressList((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "sending" } : item))
      );

      try {
        const res = await sendOneClickPersonalizedEmailApi(current.importer._id);
        sentCount++;
        setProgressList((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "sent",
                  messageId: res.email?.messageId,
                }
              : item
          )
        );
      } catch (err: unknown) {
        failCount++;
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = e?.response?.data?.message || e?.message || "Failed to send";
        setProgressList((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error: msg,
                }
              : item
          )
        );
      }

      // Small 1.2s delay between sends to protect SMTP reputation
      if (i < initialList.length - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setIsRunning(false);
    setDone(true);
    if (sentCount > 0) {
      toast.success(`Bulk send complete: ${sentCount} delivered${failCount ? `, ${failCount} failed` : ""}`);
      onSuccess?.();
    } else {
      toast.error(`All ${failCount} emails failed to send.`);
    }
  };

  if (!open) return null;

  const total = validImporters.length;
  const processed = progressList.filter((p) => p.status === "sent" || p.status === "error").length;
  const successCount = progressList.filter((p) => p.status === "sent").length;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bulk Personalized Outreach</h2>
              <p className="text-xs text-violet-100">
                Directly mentions buyer name, company, products wanted, and destination port
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Banner */}
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-violet-950">
                  Ready to send to {validImporters.length} buyer{validImporters.length !== 1 ? "s" : ""}
                </span>
                <p className="text-xs text-violet-700 mt-0.5">
                  Sender: <span className="font-semibold">vasanth@oneroot.farm</span> (via Google Workspace SMTP)
                </p>
              </div>
              {invalidCount > 0 && (
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                  {invalidCount} skipped (no email)
                </span>
              )}
            </div>

            {/* Live Progress Bar */}
            {isRunning && (
              <div className="mt-3">
                <div className="flex justify-between text-xs font-semibold text-violet-900 mb-1">
                  <span>Sending in progress...</span>
                  <span>{processed} / {total} ({percent}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-violet-200 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 transition-all duration-300 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buyers Queue List */}
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-72 overflow-y-auto bg-slate-50/50">
            {(progressList.length > 0
              ? progressList
              : validImporters.map((i) => ({
                  importer: i,
                  status: "idle" as SendStatus,
                  error: undefined,
                }))
            ).map(({ importer, status, error }, idx) => {
                const contact = importer.contactPerson || importer.importerName || "Procurement Manager";
                const company = importer.companyName || importer.importerName;
                const products = importer.products?.join(", ") || importer.materialType || "Turmeric";

                return (
                  <div key={importer._id || idx} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{company}</span>
                          <span className="text-xs text-slate-400">({contact})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                          <span className="text-violet-700 font-medium">{importer.email}</span>
                          <span>•</span>
                          <span>{products}</span>
                          {importer.country && (
                            <>
                              <span>•</span>
                              <span>{importer.country}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      {status === "idle" && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          Queued
                        </span>
                      )}
                      {status === "sending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Sending...
                        </span>
                      )}
                      {status === "sent" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Delivered
                        </span>
                      )}
                      {status === "error" && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700"
                          title={error}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Template Info Preview */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-violet-600" />
              What each buyer receives:
            </div>
            <p className="leading-relaxed">
              Each email is personalized with the buyer’s contact name, company name, IPM-grade turmeric specs, EU MRL compliance (EC No 396/2005), lab residue test reports, and includes the attached <strong>OneRoot European Specification Deck (PDF)</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            {done ? "Close" : "Cancel"}
          </button>

          {!done ? (
            <button
              type="button"
              onClick={handleStartBulkSend}
              disabled={isRunning || validImporters.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending {processed + 1} of {total}...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Start Bulk Outreach ({validImporters.length})
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-700">
                Completed: {successCount} sent
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
