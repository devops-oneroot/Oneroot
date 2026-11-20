"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Inbox,
  Loader2,
  RefreshCw,
  RotateCw,
  Search,
  UploadCloud,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchDiscoveryLog,
  fetchDiscoveryLogs,
  uploadDiscoveryCsv,
} from "@/lib/api";
import type { DiscoveryLog, DiscoveryLogItem } from "@/lib/types";

const STATUS_STYLE: Record<DiscoveryLogItem["status"], string> = {
  added: "bg-emerald-100 text-emerald-800",
  duplicate: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  error: "bg-red-100 text-red-800",
};

function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

interface DiscoveryViewProps {
  onLeadAdded?: () => void;
}

export function DiscoveryView({ onLeadAdded }: DiscoveryViewProps) {
  const [logs, setLogs] = useState<DiscoveryLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DiscoveryLog | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [itemFilter, setItemFilter] = useState<"all" | DiscoveryLogItem["status"]>("all");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const loadLogs = useCallback(async () => {
    try {
      const recent = await fetchDiscoveryLogs(15);
      setLogs(recent);
      if (recent.length > 0 && !selectedLog) {
        setSelectedLog(recent[0]);
      }
    } catch {
      /* ignore */
    }
  }, [selectedLog]);

  const pollRun = useCallback(
    (id: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const log = await fetchDiscoveryLog(id);
          setSelectedLog(log);
          if (log.status !== "running") {
            stopPolling();
            if (log.status === "completed") {
              toast.success(log.message || "Spreadsheet extraction finished");
              if (log.stats.added > 0) onLeadAdded?.();
            } else {
              toast.error(log.message || "File processing failed");
            }
            void loadLogs();
          }
        } catch {
          /* transient; keep polling */
        }
      }, 1500);
    },
    [loadLogs, onLeadAdded]
  );

  useEffect(() => {
    void loadLogs();
    return () => stopPolling();
  }, [loadLogs]);

  // Resume polling if selected log is actively running
  useEffect(() => {
    if (selectedLog?.status === "running" && !pollRef.current) {
      pollRun(selectedLog._id);
    }
  }, [selectedLog, pollRun]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && isValidFile(file.name)) {
      setCsvFile(file);
    } else {
      toast.error("Please drop a valid .csv, .xlsx, .xls, or .tsv file");
    }
  };

  const isValidFile = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    return ["csv", "xlsx", "xls", "tsv"].includes(ext || "");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isValidFile(file.name)) {
        setCsvFile(file);
      } else {
        toast.error("Please select a .csv, .xlsx, .xls, or .tsv file");
      }
    }
  };

  const handleStartUpload = async () => {
    if (!csvFile) return;
    setIsUploading(true);
    try {
      const { log } = await uploadDiscoveryCsv(csvFile);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedLog(log);
      setItemFilter("all");
      pollRun(log._id);
      toast.success(`Processing ${csvFile.name}…`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e?.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      "companyName,contactPerson,phone,email,website,country,city,products,curcuminPercent,materialType,quantityKg,incoterm,portOfDischarge\n" +
      "Rotterdam Spices BV,Jan de Vries,+31-10-555-1234,jan@rotterdamspices.nl,https://www.rotterdamspices.nl,Netherlands,Rotterdam,Turmeric Whole;Curcumin,3.8,Double Polished,25000,CIF,Rotterdam Port\n" +
      "Hamburg Gewürze GmbH,Klaus Weber,+49-40-777-8899,weber@hamburg-gewuerze.de,https://hamburg-gewuerze.de,Germany,Hamburg,Salem Turmeric,4.2,Finger,50000,CIF,Hamburg Port\n" +
      "London Seasonings Ltd,David Smith,+44-20-7946-0912,procurement@londonseasonings.co.uk,https://londonseasonings.co.uk,United Kingdom,London,Turmeric Fingers,3.5,Single Polished,18000,FOB,Felixstowe\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "oneroot_buyers_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample CSV template");
  };

  const visibleItems = useMemo(
    () => (selectedLog?.items ?? []).filter((i) => itemFilter === "all" || i.status === itemFilter),
    [selectedLog, itemFilter]
  );

  const progressPct =
    selectedLog?.progress && selectedLog.progress.total > 0
      ? Math.round((selectedLog.progress.processed / selectedLog.progress.total) * 100)
      : 0;

  const isRunning = selectedLog?.status === "running";

  return (
    <div className="space-y-6 bg-slate-50/50 p-4 sm:p-6">
      {/* View Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Import Buyers (CSV & Excel)
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Spreadsheet Only
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Add buyers strictly from your CSV or Excel files. Web scraping has been disabled for clean provenance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              title="Download a formatted sample CSV file with all accepted columns"
            >
              <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
              <span>Sample Template</span>
            </button>
            <button
              type="button"
              onClick={() => void loadLogs()}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 transition"
              title="Refresh logs"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="mt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${isDragOver
                ? "border-emerald-500 bg-emerald-50/60"
                : "border-slate-300 bg-slate-50/50 hover:border-emerald-400 hover:bg-slate-50"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.tsv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload-input"
            />

            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-emerald-600">
              <UploadCloud className="h-7 w-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {csvFile ? csvFile.name : "Choose a spreadsheet file to extract buyers"}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              {csvFile
                ? `${(csvFile.size / 1024).toFixed(1)} KB — Ready to ingest`
                : "Drag & drop your CSV or Excel (.xlsx, .xls) file here, or click Browse"}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <FileText className="h-4 w-4 text-slate-500" />
                <span>{csvFile ? "Change File" : "Browse Files"}</span>
              </label>

              {csvFile && (
                <button
                  type="button"
                  disabled={isUploading || isRunning}
                  onClick={handleStartUpload}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {isUploading || isRunning ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Extracting…</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Extract & Ingest Buyers</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Supported formats: <span className="font-semibold text-slate-600">.csv, .xlsx, .xls, .tsv</span> (up to 15 MB)
            </p>
          </div>
        </div>

        {/* Accepted Columns Guide */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Supported Spreadsheet Headers:</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "companyName / Company",
              "contactPerson",
              "phone / Mobile",
              "email",
              "website",
              "country",
              "city",
              "products",
              "curcuminPercent",
              "materialType",
              "quantityKg",
              "incoterm",
              "portOfDischarge",
            ].map((col) => (
              <span
                key={col}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-mono text-slate-700 shadow-2xs"
              >
                {col}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            • Header matching is case-insensitive. Missing optional columns are safely skipped. Nameless rows are rejected.
          </p>
        </div>
      </div>

      {/* Progress & Run Results */}
      {selectedLog && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Import Result:
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedLog.sourceResults?.[0]?.name || "Spreadsheet Run"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${selectedLog.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedLog.status === "running"
                          ? "bg-sky-100 text-sky-800 animate-pulse"
                          : "bg-rose-100 text-rose-800"
                      }`}
                  >
                    {selectedLog.status}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {fmtTime(selectedLog.createdAt)}
                  {selectedLog.triggerType && ` • Trigger: ${selectedLog.triggerType}`}
                </div>
              </div>

              {/* Past runs switcher */}
              {logs.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">History:</span>
                  <select
                    value={selectedLog._id}
                    onChange={(e) => {
                      const found = logs.find((l) => l._id === e.target.value);
                      if (found) setSelectedLog(found);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    {logs.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.sourceResults?.[0]?.name?.slice(0, 30) || "Import"} ({fmtTime(l.createdAt)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Live Progress Bar */}
            {isRunning && (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Processing rows…</span>
                  <span>
                    {selectedLog.progress?.processed || 0} / {selectedLog.progress?.total || "?"} ({progressPct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metrics Breakdown */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="text-xs font-medium text-slate-500">Total Found</span>
                <p className="mt-1 text-xl font-extrabold text-slate-900">
                  {selectedLog.stats?.found ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <span className="text-xs font-medium text-emerald-800">Added to CRM</span>
                <p className="mt-1 text-xl font-extrabold text-emerald-700">
                  {selectedLog.stats?.added ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <span className="text-xs font-medium text-amber-800">Duplicates Skipped</span>
                <p className="mt-1 text-xl font-extrabold text-amber-700">
                  {selectedLog.stats?.duplicates ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                <span className="text-xs font-medium text-rose-800">Rejected / Errors</span>
                <p className="mt-1 text-xl font-extrabold text-rose-700">
                  {(selectedLog.stats?.rejected ?? 0) + (selectedLog.stats?.errorCount ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Extracted Records ({visibleItems.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Deterministic provenance tracking for every row in the spreadsheet
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1">
                {(["all", "added", "duplicate", "rejected", "error"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setItemFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${itemFilter === st
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {visibleItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No items match the current filter.
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50/80 text-left text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3">Source Row / Origin</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.companyName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {item.source_url}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLE[item.status] || "bg-slate-100 text-slate-700"
                              }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.reason || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
