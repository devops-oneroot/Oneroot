"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import type { LinkedInConnectionStatus, LinkedInLead } from "@/lib/types";
import { CountryFlag } from "@/components/country/CountryFlag";
import {
  convertLinkedInToImporter,
  deleteLinkedInLead,
  fetchLinkedInLead,
  fetchTeamMembers,
  recordLinkedInOutreach,
  updateLinkedInLead,
} from "@/lib/api";
import { teamMemberNames } from "@/lib/utils";

interface LinkedInLeadDetailPanelProps {
  lead: LinkedInLead | null;
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

export function LinkedInLeadDetailPanel({
  lead,
  onClose,
  onRefresh,
}: LinkedInLeadDetailPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"outreach" | "profile">("outreach");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Form states for editable fields
  const [connectionStatus, setConnectionStatus] = useState<LinkedInConnectionStatus>(
    lead?.connectionStatus || "not_connected"
  );
  const [notes, setNotes] = useState(lead?.notes || "");
  const [email, setEmail] = useState(lead?.email || "");
  const [phone, setPhone] = useState(lead?.phone || "");
  const [responsiblePerson, setResponsiblePerson] = useState(
    lead?.responsiblePerson || ""
  );

  // Fetch full details with templates
  const { data: fullLead } = useQuery({
    queryKey: ["linkedin-lead", lead?._id],
    queryFn: () => fetchLinkedInLead(lead!._id),
    enabled: !!lead,
  });

  const activeLead = fullLead || lead;

  useEffect(() => {
    if (activeLead) {
      setConnectionStatus(activeLead.connectionStatus || "not_connected");
      setNotes(activeLead.notes || "");
      setEmail(activeLead.email || "");
      setPhone(activeLead.phone || "");
      setResponsiblePerson(activeLead.responsiblePerson || "");
    }
  }, [activeLead]);

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: !!lead,
  });

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Record outreach mutation
  const logOutreachMutation = useMutation({
    mutationFn: (payload: { messageType: string; text: string }) =>
      recordLinkedInOutreach(activeLead!._id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-lead", activeLead!._id] });
      setConnectionStatus(updated.connectionStatus);
      toast.success("Outreach message logged successfully!");
      onRefresh?.();
    },
    onError: () => toast.error("Failed to log outreach message"),
  });

  // Convert to Importer mutation
  const convertMutation = useMutation({
    mutationFn: () => convertLinkedInToImporter(activeLead!._id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["importers"] });
      toast.success(res.message);
      onRefresh?.();
    },
    onError: () => toast.error("Failed to convert lead to importer"),
  });

  // Save changes mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      updateLinkedInLead(activeLead!._id, {
        connectionStatus,
        notes,
        email,
        phone,
        responsiblePerson,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-leads"] });
      toast.success("Lead details updated!");
      onRefresh?.();
    },
    onError: () => toast.error("Failed to update lead"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteLinkedInLead(activeLead!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-leads"] });
      toast.success("LinkedIn lead deleted");
      onRefresh?.();
      onClose();
    },
    onError: () => toast.error("Failed to delete lead"),
  });

  if (!lead || !activeLead) return null;

  const templates = activeLead.templates || {
    connectionNote: `Hi ${activeLead.fullName.split(" ")[0]}, noticed you lead spice sourcing at ${activeLead.companyName}. OneRoot is an Indian turmeric grower & exporter (Salem/Nizamabad, 3.5%-5% curcumin). Would love to connect and share harvest pricing!`,
    inmailSubject: `Direct Indian Turmeric Sourcing for ${activeLead.companyName}`,
    inmailBody: `Hi ${activeLead.fullName.split(" ")[0]},\n\nWe supply export-grade Indian turmeric fingers and powder directly to international spice grinders and food manufacturers.\n\nWould you be open to receiving a 500g testing sample kit for your laboratory evaluation?\n\nWarm regards,\nOneRoot Exports`,
    followUpNote: `Hi ${activeLead.fullName.split(" ")[0]}, following up on our turmeric sourcing note. Let me know if you would like our latest harvest price sheet!`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2] text-white shadow-sm">
              <LinkedInIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeLead.fullName}
                </h2>
                <a
                  href={activeLead.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-[#0A66C2] hover:bg-sky-100 transition"
                  title="Open LinkedIn Profile"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>LinkedIn Profile</span>
                </a>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                {activeLead.headline || activeLead.jobTitle} •{" "}
                <span className="font-semibold text-slate-800">
                  {activeLead.companyName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeLead.connectionStatus !== "converted" && (
              <button
                type="button"
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>
                  {convertMutation.isPending ? "Converting…" : "Convert to Importer"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("outreach")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition ${
              activeTab === "outreach"
                ? "border-[#0A66C2] text-[#0A66C2] bg-white rounded-t-lg -mb-px"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>LinkedIn Outreach Assistant</span>
            <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
              Copy & Paste
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition ${
              activeTab === "profile"
                ? "border-violet-600 text-violet-700 bg-white rounded-t-lg -mb-px"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile & Lead Details</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "outreach" ? (
            <div className="space-y-5">
              {/* Box 1: Connection Request Note */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-[#0A66C2]" />
                      <span>1. LinkedIn Connection Request Note</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Personalized 300-character note to include with your connection invite.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {templates.connectionNote.length} / 300 chars
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(templates.connectionNote, "connectionNote")
                      }
                      className="inline-flex items-center gap-1 rounded bg-[#0A66C2] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#084e96] transition"
                    >
                      {copiedType === "connectionNote" ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 font-sans">
                  {templates.connectionNote}
                </div>

                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      logOutreachMutation.mutate({
                        messageType: "connection_request",
                        text: templates.connectionNote,
                      })
                    }
                    className="text-xs font-medium text-blue-700 hover:underline"
                  >
                    ✓ Mark Connection Request Sent
                  </button>
                </div>
              </div>

              {/* Box 2: InMail Commercial Offer */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                      <span>2. InMail / Direct Message Pitch</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Comprehensive commercial offer detailing curcumin %, lab testing, and sample kit.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(templates.inmailBody, "inmail")}
                    className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    {copiedType === "inmail" ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy InMail</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-800">
                  Subject: {templates.inmailSubject}
                </div>

                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-800 font-sans whitespace-pre-wrap">
                  {templates.inmailBody}
                </div>

                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      logOutreachMutation.mutate({
                        messageType: "inmail",
                        text: templates.inmailBody,
                      })
                    }
                    className="text-xs font-medium text-indigo-700 hover:underline"
                  >
                    ✓ Mark InMail Sent
                  </button>
                </div>
              </div>

              {/* Outreach History Timeline */}
              {activeLead.outreachMessages && activeLead.outreachMessages.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    Outreach Activity History
                  </h4>
                  <div className="space-y-2">
                    {activeLead.outreachMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs border-b border-slate-100 pb-2 last:border-b-0"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                        <div>
                          <span className="font-semibold capitalize text-slate-800">
                            {msg.messageType.replace("_", " ")}
                          </span>
                          <span className="text-slate-400 ml-2">
                            {new Date(msg.sentAt).toLocaleString()}
                          </span>
                          <p className="mt-0.5 text-slate-600 line-clamp-2">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Profile & Edit Tab */
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Connection Status
                  </label>
                  <select
                    value={connectionStatus}
                    onChange={(e) =>
                      setConnectionStatus(e.target.value as LinkedInConnectionStatus)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0A66C2]"
                  >
                    <option value="not_connected">Not Connected</option>
                    <option value="connection_sent">Invite Sent</option>
                    <option value="connected">1st Degree Connected</option>
                    <option value="messaged">InMail / Messaged</option>
                    <option value="in_discussion">In Discussion</option>
                    <option value="converted">Converted to Importer</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Responsible Sales Person
                  </label>
                  <select
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0A66C2]"
                  >
                    {teamMemberNames(team).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Direct Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0A66C2]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 415 890 3341"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#0A66C2]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Lead & Requirement Notes
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes about their spice requirements, curcumin preferences, target ports…"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-3 text-xs outline-none focus:border-[#0A66C2]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Lead</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Delete lead?</span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate()}
                  className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

