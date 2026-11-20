"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  CheckCheck,
  Clock,
  Copy,
  FileText,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import type { EmailMessage, EmailTemplate, Importer } from "@/lib/types";
import {
  fetchEmailTemplates,
  fetchImporterEmails,
  markEmailAsRead,
  sendImporterEmailReply,
} from "@/lib/api";

interface ImporterEmailConversationsProps {
  importer: Importer;
}

export function ImporterEmailConversations({
  importer,
}: ImporterEmailConversationsProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Fetch email thread for this importer
  const {
    data: emails = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["importer-emails", importer._id],
    queryFn: () => fetchImporterEmails(importer._id),
    staleTime: 5000,
  });

  // Fetch quick export templates
  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates", importer._id],
    queryFn: () => fetchEmailTemplates(importer._id),
    staleTime: 60000,
  });

  // Automatically pre-fill default subject if empty and last message exists
  useEffect(() => {
    if (!subject && emails.length > 0) {
      const lastInbound = [...emails].reverse().find((e) => e.direction === "inbound");
      if (lastInbound?.subject) {
        setSubject(
          lastInbound.subject.startsWith("Re:")
            ? lastInbound.subject
            : `Re: ${lastInbound.subject}`
        );
      } else {
        setSubject(`Re: Indian Turmeric Inquiry - ${importer.importerName}`);
      }
    }
  }, [emails, subject, importer.importerName]);

  // Scroll to bottom on load/update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mutation to send email reply
  const sendReplyMutation = useMutation({
    mutationFn: (payload: { subject: string; body: string }) =>
      sendImporterEmailReply(importer._id, {
        to: importer.email,
        subject: payload.subject,
        body: payload.body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["importer-emails", importer._id],
      });
      queryClient.invalidateQueries({ queryKey: ["importers"] });
      toast.success(
        `Email reply sent to ${importer.contactPerson || importer.importerName}!`
      );
      setBody("");
      setSelectedTemplateId(null);
      setTimeout(scrollToBottom, 200);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to send email reply"
      );
    },
  });

  // Handle template selection
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplateId(template.id);
    if (template.subject) setSubject(template.subject);
    if (template.body) setBody(template.body);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!subject.trim()) {
      toast.error("Please enter an email subject");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a message body");
      return;
    }
    sendReplyMutation.mutate({ subject: subject.trim(), body: body.trim() });
  };

  // Keyboard shortcut Ctrl+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const copyEmail = () => {
    if (!importer.email) return;
    navigator.clipboard.writeText(importer.email);
    toast.success("Email copied to clipboard");
  };

  const unreadCount = emails.filter((e) => e.status === "unread").length;

  return (
    <div className="flex flex-1 flex-col bg-slate-50/60 min-h-0 overflow-hidden">
      {/* Top Conversation Header */}
      <div className="shrink-0 flex flex-wrap items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">
                {importer.contactPerson || importer.importerName}
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{importer.email || "No email on file"}</span>
              {importer.email && (
                <button
                  type="button"
                  onClick={copyEmail}
                  title="Copy email"
                  className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <Copy className="h-3 w-3" />
                </button>
              )}
              {importer.country && (
                <>
                  <span>•</span>
                  <span>{importer.country}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh email thread"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin text-indigo-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Email Thread Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 min-h-0 overscroll-contain">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-sm text-slate-500">Loading conversation…</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <Inbox className="mx-auto h-8 w-8 text-slate-400" />
            <h4 className="mt-2 text-sm font-semibold text-slate-800">
              No emails exchanged yet
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              Send the first turmeric quotation or price inquiry below to start the email
              thread.
            </p>
          </div>
        ) : (
          emails.map((email) => {
            const isInbound = email.direction === "inbound";
            const dateStr = email.receivedAt || email.sentAt || email.createdAt;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={email._id}
                className={`rounded-xl border p-4 shadow-xs transition-all ${
                  isInbound
                    ? "border-indigo-100 bg-white"
                    : "border-slate-200 bg-[#fbfcfe]"
                }`}
              >
                {/* Email Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        isInbound
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isInbound ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {isInbound
                            ? email.senderName || importer.contactPerson || "Buyer"
                            : email.senderName || "OneRoot Sales Team"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          &lt;{isInbound ? email.senderEmail : email.recipientEmail}&gt;
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isInbound ? "Received" : "Sent to buyer"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formattedDate}</span>
                    {!isInbound && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCheck className="h-3 w-3" />
                        Sent
                      </span>
                    )}
                    {isInbound && email.status === "unread" && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        New
                      </span>
                    )}
                  </div>
                </div>

                {/* Email Subject */}
                <div className="mt-2 text-xs font-bold text-slate-800">
                  Subject: {email.subject}
                </div>

                {/* Email Body */}
                <div className="mt-2 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                  {email.body}
                </div>

                {/* Quick Action Button for Inbound */}
                {isInbound && (
                  <div className="mt-3 flex justify-end border-t border-slate-50 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubject(
                          email.subject.startsWith("Re:")
                            ? email.subject
                            : `Re: ${email.subject}`
                        );
                        // Focus on reply textarea
                        const textarea = document.getElementById("email-reply-body");
                        textarea?.focus();
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      ↩ Quote & Reply to this message
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Built-in Reply & Compose Box */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-4 shadow-lg sm:p-5 max-h-[38vh] overflow-y-auto">
        <form onSubmit={handleSend} className="space-y-3">
          {/* Quick Export Templates Bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Quick Export Templates:</span>
              </label>
              <span className="text-[11px] text-slate-400">
                1-click auto-fills pricing & specs
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50 font-semibold text-indigo-700 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {tpl.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email Subject…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>

          {/* Message Body Field */}
          <div>
            <textarea
              id="email-reply-body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write your email reply to ${
                importer.contactPerson || importer.importerName
              } here… (or choose a quick template above)`}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20 font-sans"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono">Ctrl+Enter</kbd> to send
            </span>

            <div className="flex items-center gap-2">
              {body && (
                <button
                  type="button"
                  onClick={() => {
                    setBody("");
                    setSelectedTemplateId(null);
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  Clear
                </button>
              )}

              <button
                type="submit"
                disabled={sendReplyMutation.isPending || !body.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {sendReplyMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending Reply…</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Email Reply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

