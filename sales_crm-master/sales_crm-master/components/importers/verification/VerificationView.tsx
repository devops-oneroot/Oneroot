"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  ExternalLink,
  FileCheck2,
  Globe,
  HelpCircle,
  Loader2,
  MailCheck,
  RotateCw,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchVerificationStatus,
  verifyImporters,
  type VerificationStatus,
} from "@/lib/api";
import type { Importer } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 15;

const EMAIL_CHIP: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", cls: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  risky: { label: "Risky", cls: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  invalid: { label: "Invalid", cls: "bg-rose-100 text-rose-800", icon: XCircle },
  unverified: { label: "Unverified", cls: "bg-slate-100 text-slate-600", icon: HelpCircle },
};

const GRADE_CHIP: Record<string, string> = {
  A: "bg-emerald-600 text-white",
  B: "bg-sky-600 text-white",
  C: "bg-slate-300 text-slate-700",
  Unrated: "bg-slate-100 text-slate-400",
};

function errMessage(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

function fmtDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}

interface VerificationViewProps {
  importers: Importer[];
  onRefresh?: () => unknown;
}

export function VerificationView({ importers, onRefresh }: VerificationViewProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [busy, setBusy] = useState<"" | "all" | "selected" | string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [gradeFilter, setGradeFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadStatus = useCallback(() => fetchVerificationStatus().then(setStatus).catch(() => undefined), []);

  useEffect(() => {
    let cancelled = false;
    fetchVerificationStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [importers]);

  const counts = useMemo(() => {
    const c = { never: 0, verified: 0, risky: 0, invalid: 0, unverified: 0, A: 0, B: 0, C: 0 };
    for (const i of importers) {
      if (!i.verification_checked_at) c.never++;
      const es = (i.email_status || "unverified") as keyof typeof c;
      if (es in c) c[es]++;
      const g = i.verification_grade as keyof typeof c;
      if (g === "A" || g === "B" || g === "C") c[g]++;
    }
    return c;
  }, [importers]);

  const filtered = useMemo(
    () =>
      importers
        .filter((i) => gradeFilter === "all" || (i.verification_grade || "Unrated") === gradeFilter)
        .filter((i) => emailFilter === "all" || (i.email_status || "unverified") === emailFilter)
        .sort((a, b) => (b.verification_score ?? -1) - (a.verification_score ?? -1)),
    [importers, gradeFilter, emailFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const runVerify = async (ids: string[] | undefined, mode: string) => {
    setBusy(mode);
    const n = ids?.length ?? Math.min(counts.never || importers.length, 100);
    const toastId = toast.loading(`Verifying ${n} importer${n === 1 ? "" : "s"} — checking websites and emails…`);
    try {
      const r = await verifyImporters(ids);
      const parts = [
        `${r.checked} checked`,
        `${r.verified} verified`,
        r.risky && `${r.risky} risky`,
        r.invalid && `${r.invalid} invalid`,
        r.unverified && `${r.unverified} not checkable`,
        `grades A:${r.gradeA} B:${r.gradeB} C:${r.gradeC}`,
      ].filter(Boolean);
      toast.success(parts.join(" · ") + (r.remaining ? ` · ${r.remaining} more — run again` : ""), { id: toastId, duration: 9000 });
      if (!r.verifierConfigured && r.unverified) {
        toast(`Emails can't be marked verified until an email-verifier key is set (${r.verifierNote}).`, { icon: "ℹ️", duration: 9000 });
      }
      setSelected(new Set());
      await onRefresh?.();
      await loadStatus();
    } catch (err) {
      toast.error(errMessage(err, "Verification failed"), { id: toastId });
    } finally {
      setBusy("");
    }
  };

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r._id));

  return (
    <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <FileCheck2 className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Lead Verification</h2>
              {status && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    status.verifierConfigured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                  title={status.verifierNote || undefined}
                >
                  <MailCheck className="h-3 w-3" />
                  {status.verifierConfigured
                    ? `Email verifier: ${status.provider === "neverbounce" ? "NeverBounce" : "ZeroBounce"}`
                    : "No verifier key — DNS check only"}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs text-slate-500 sm:text-sm">
              Checks each importer&apos;s website is live and its email accepts mail, then scores and grades it.{" "}
              <b>A</b> = verified email + live website · <b>B</b> = verified email (site down) or risky email + live
              site · <b>C</b> = everything else.
            </p>
            {status && !status.verifierConfigured && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                Without a verifier key, emails whose domain has no mail server are marked <b>invalid</b>, but no email
                can be marked <b>verified</b>. Add <code>EMAIL_VERIFIER_PROVIDER</code> (neverbounce or zerobounce) and{" "}
                <code>EMAIL_VERIFIER_API_KEY</code> to the backend .env.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selected.size > 0 && (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => runVerify([...selected], "selected")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                {busy === "selected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                Verify selected ({selected.size})
              </button>
            )}
            <button
              type="button"
              disabled={Boolean(busy) || counts.never === 0}
              onClick={() => runVerify(undefined, "all")}
              title={counts.never === 0 ? "Every importer has been checked — select rows to re-verify" : undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {busy === "all" ? "Verifying…" : `Verify unchecked (${counts.never})`}
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Not checked", value: counts.never, cls: "border-slate-200 bg-slate-50 text-slate-800", f: () => { setEmailFilter("all"); setGradeFilter("Unrated"); } },
            { label: "Verified", value: counts.verified, cls: "border-emerald-100 bg-emerald-50/50 text-emerald-900", f: () => { setGradeFilter("all"); setEmailFilter("verified"); } },
            { label: "Risky", value: counts.risky, cls: "border-amber-100 bg-amber-50/50 text-amber-900", f: () => { setGradeFilter("all"); setEmailFilter("risky"); } },
            { label: "Invalid", value: counts.invalid, cls: "border-rose-100 bg-rose-50/50 text-rose-900", f: () => { setGradeFilter("all"); setEmailFilter("invalid"); } },
            { label: "Grade A", value: counts.A, cls: "border-emerald-200 bg-white text-emerald-700", f: () => { setEmailFilter("all"); setGradeFilter("A"); } },
            { label: "Grade B", value: counts.B, cls: "border-sky-200 bg-white text-sky-700", f: () => { setEmailFilter("all"); setGradeFilter("B"); } },
            { label: "Grade C", value: counts.C, cls: "border-slate-200 bg-white text-slate-600", f: () => { setEmailFilter("all"); setGradeFilter("C"); } },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => {
                c.f();
                setPage(1);
              }}
              className={`rounded-xl border p-3 text-center transition hover:shadow-sm ${c.cls}`}
            >
              <p className="text-[11px] font-semibold opacity-80">{c.label}</p>
              <p className="mt-0.5 text-2xl font-black">{c.value}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700"
            aria-label="Filter by grade"
          >
            <option value="all">All grades</option>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
            <option value="Unrated">Not graded</option>
          </select>
          <select
            value={emailFilter}
            onChange={(e) => {
              setEmailFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700"
            aria-label="Filter by email status"
          >
            <option value="all">All email statuses</option>
            <option value="verified">Verified</option>
            <option value="risky">Risky</option>
            <option value="invalid">Invalid</option>
            <option value="unverified">Unverified</option>
          </select>
          {(gradeFilter !== "all" || emailFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setGradeFilter("all");
                setEmailFilter("all");
              }}
              className="text-xs font-semibold text-violet-600 hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} importers</span>
        </div>

        {importers.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No importers yet — add some from Discovery or an Excel/CSV import.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={() =>
                        setSelected((s) => {
                          const next = new Set(s);
                          for (const r of pageRows) {
                            if (allOnPageSelected) next.delete(r._id);
                            else next.add(r._id);
                          }
                          return next;
                        })
                      }
                      aria-label="Select page"
                    />
                  </th>
                  <th className="px-3 py-2 font-semibold">Importer</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Website</th>
                  <th className="px-3 py-2 font-semibold">Score</th>
                  <th className="px-3 py-2 font-semibold">Grade</th>
                  <th className="px-3 py-2 font-semibold">Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((i) => {
                  const chip = EMAIL_CHIP[i.email_status || "unverified"] || EMAIL_CHIP.unverified;
                  const ChipIcon = chip.icon;
                  const checked = Boolean(i.verification_checked_at);
                  return (
                    <tr key={i._id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(i._id)}
                          onChange={() =>
                            setSelected((s) => {
                              const next = new Set(s);
                              if (next.has(i._id)) next.delete(i._id);
                              else next.add(i._id);
                              return next;
                            })
                          }
                          aria-label={`Select ${i.companyName || i.importerName}`}
                        />
                      </td>
                      <td className="max-w-[220px] px-3 py-2">
                        <p className="truncate font-semibold text-slate-900">{i.companyName || i.importerName}</p>
                        <p className="truncate text-[11px] text-slate-400">
                          {[i.country, i.buyer_type?.replace("_", " / ")].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>
                      <td className="max-w-[240px] px-3 py-2">
                        {i.email ? (
                          <>
                            <p className="truncate text-slate-800">{i.email}</p>
                            <span
                              className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${chip.cls}`}
                              title={i.email_check_detail || undefined}
                            >
                              <ChipIcon className="h-3 w-3" />
                              {chip.label}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <CircleSlash className="h-3.5 w-3.5" /> no email
                          </span>
                        )}
                      </td>
                      <td className="max-w-[200px] px-3 py-2">
                        {i.website ? (
                          <>
                            <a
                              href={/^https?:/i.test(i.website) ? i.website : `https://${i.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-full items-center gap-1 truncate text-violet-600 hover:underline"
                            >
                              <span className="truncate">{i.website_domain || i.website}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                            {checked && (
                              <p
                                className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold ${i.website_live ? "text-emerald-700" : "text-rose-700"}`}
                                title={i.website_check_detail || undefined}
                              >
                                <Globe className="h-3 w-3" /> {i.website_live ? "Live" : "Down"}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {checked ? (
                          <div className="w-16">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${(i.verification_score ?? 0) >= 80 ? "bg-emerald-500" : (i.verification_score ?? 0) >= 50 ? "bg-sky-500" : "bg-slate-400"}`}
                                style={{ width: `${i.verification_score ?? 0}%` }}
                              />
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">{i.verification_score ?? 0}/100</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-black ${GRADE_CHIP[i.verification_grade || "Unrated"]}`}
                        >
                          {i.verification_grade && i.verification_grade !== "Unrated" ? i.verification_grade : "–"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{fmtDate(i.verification_checked_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-3">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemLabel="importers"
            />
          </div>
        )}
      </div>
    </div>
  );
}
