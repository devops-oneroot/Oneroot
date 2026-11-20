"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Key,
  Link2,
  Loader2,
  LogOut,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import type { ConnectLinkedInInput, LinkedInAccountStatus } from "@/lib/types";
import {
  connectLinkedInAccount,
  disconnectLinkedInAccount,
  fetchLinkedInAccountStatus,
} from "@/lib/api";

interface ConnectLinkedInModalProps {
  open: boolean;
  onClose: () => void;
  onRefresh?: () => any;
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-[#f8f9fa] px-3.5 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/20";

export function ConnectLinkedInModal({
  open,
  onClose,
  onRefresh,
}: ConnectLinkedInModalProps) {
  const queryClient = useQueryClient();

  const [authMethod, setAuthMethod] = useState<"session_cookie" | "api_key" | "oauth">(
    "session_cookie"
  );
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [sessionCookie, setSessionCookie] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const { data: status, refetch } = useQuery({
    queryKey: ["linkedin-account-status"],
    queryFn: fetchLinkedInAccountStatus,
    enabled: open,
  });

  useEffect(() => {
    if (status?.isConnected) {
      setAccountName(status.accountName || "");
      setAccountEmail(status.accountEmail || "");
      setProfileUrl(status.profileUrl || "");
      if (status.authMethod) setAuthMethod(status.authMethod);
    }
  }, [status]);

  const connectMutation = useMutation({
    mutationFn: (input: ConnectLinkedInInput) => connectLinkedInAccount(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-account-status"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-leads"] });
      toast.success(res.message);
      onRefresh?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to connect account"
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectLinkedInAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-account-status"] });
      toast.success("LinkedIn account disconnected");
      onRefresh?.();
      refetch();
    },
    onError: () => toast.error("Failed to disconnect account"),
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      toast.error("Please enter an Account Name");
      return;
    }

    connectMutation.mutate({
      accountName: accountName.trim(),
      accountEmail: accountEmail.trim(),
      profileUrl: profileUrl.trim(),
      authMethod,
      sessionCookie: sessionCookie.trim(),
      apiKey: apiKey.trim(),
      accessToken: accessToken.trim(),
    });
  };

  const isConnected = Boolean(status?.isConnected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2] text-white shadow-sm">
              <LinkedInIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Connect LinkedIn Account
                </h2>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Connect your LinkedIn profile or scraper credentials to source leads
                directly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {/* If already connected, show active status card */}
            {isConnected && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        Connected as {status?.accountName}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        {status?.profileUrl || "Active for Live Sourcing"} • Auth Method:{" "}
                        <span className="font-semibold uppercase">
                          {status?.authMethod?.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Account Name / Label *
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe (Procurement)"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Your LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                LinkedIn Account Email (Optional)
              </label>
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="name@company.com"
                className={inputClass}
              />
            </div>

            {/* Method Tabs */}
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Connection & Lead Scraping Method:
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod("session_cookie")}
                  className={`rounded-lg border p-2.5 text-center text-xs font-semibold transition ${
                    authMethod === "session_cookie"
                      ? "border-[#0A66C2] bg-blue-50/60 text-[#0A66C2] shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Session Cookie</span>
                  </div>
                  <div className="mt-0.5 text-[10px] font-normal opacity-80">
                    li_at (Recommended)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod("api_key")}
                  className={`rounded-lg border p-2.5 text-center text-xs font-semibold transition ${
                    authMethod === "api_key"
                      ? "border-[#0A66C2] bg-blue-50/60 text-[#0A66C2] shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Key className="h-3.5 w-3.5" />
                    <span>Scraper API</span>
                  </div>
                  <div className="mt-0.5 text-[10px] font-normal opacity-80">
                    RapidAPI / Proxycurl
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod("oauth")}
                  className={`rounded-lg border p-2.5 text-center text-xs font-semibold transition ${
                    authMethod === "oauth"
                      ? "border-[#0A66C2] bg-blue-50/60 text-[#0A66C2] shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>OAuth Token</span>
                  </div>
                  <div className="mt-0.5 text-[10px] font-normal opacity-80">
                    Developer Token
                  </div>
                </button>
              </div>
            </div>

            {/* Method A: li_at cookie */}
            {authMethod === "session_cookie" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0A66C2]" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      How to get your LinkedIn session cookie (li_at):
                    </span>
                    <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[11px] text-slate-600">
                      <li>Open linkedin.com in your browser where you are logged in.</li>
                      <li>
                        Press <kbd className="font-mono">F12</kbd> (or right-click &gt; Inspect)
                        to open Developer Tools.
                      </li>
                      <li>
                        Go to <strong>Application</strong> tab (or <strong>Storage</strong> in
                        Firefox) &gt; expand <strong>Cookies</strong> &gt;{" "}
                        <code>https://www.linkedin.com</code>.
                      </li>
                      <li>
                        Copy the value of the cookie named <code>li_at</code> and paste below.
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-800">
                    li_at Cookie Value:
                  </label>
                  <input
                    type="password"
                    value={sessionCookie}
                    onChange={(e) => setSessionCookie(e.target.value)}
                    placeholder="AQEDAT... (Paste your li_at cookie here)"
                    className={`${inputClass} font-mono text-xs`}
                  />
                </div>
              </div>
            )}

            {/* Method B: API Key */}
            {authMethod === "api_key" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <label className="text-xs font-semibold text-slate-800">
                  RapidAPI / Proxycurl API Key:
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here"
                  className={`${inputClass} font-mono text-xs`}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Used to query live LinkedIn public profiles and company headcount data.
                </p>
              </div>
            )}

            {/* Method C: OAuth Access Token */}
            {authMethod === "oauth" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
                <label className="text-xs font-semibold text-slate-800">
                  LinkedIn App Access Token:
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Bearer AQV..."
                  className={`${inputClass} font-mono text-xs`}
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  OAuth token from your LinkedIn Developer Portal application.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084e96] disabled:opacity-50"
            >
              {connectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting…</span>
                </>
              ) : (
                <span>Save & Connect Account</span>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

