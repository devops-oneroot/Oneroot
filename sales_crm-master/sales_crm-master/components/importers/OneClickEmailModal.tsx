"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  Package,
  Paperclip,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type { Importer } from "@/lib/types";
import { sendOneClickPersonalizedEmailApi } from "@/lib/api";
import toast from "react-hot-toast";

interface OneClickEmailModalProps {
  importer: Importer | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OneClickEmailModal({
  importer,
  open,
  onClose,
  onSuccess,
}: OneClickEmailModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (importer && open) {
      const contact =
        importer.contactPerson || importer.importerName || "Procurement Manager";
      const company =
        importer.companyName || importer.importerName || "Your Company";
      const country = importer.country || "your market";
      const city = importer.city ? `${importer.city}, ` : "";

      const productWanted =
        Array.isArray(importer.products) && importer.products.length > 0
          ? importer.products.join(", ")
          : importer.materialType || "Export Grade Dry Turmeric Fingers";

      setSubject(`Direct Sourcing: ${productWanted} (EU MRL Compliant) for ${company}`);
      setBody(`Dear ${contact},

I am writing to you directly regarding ${company}'s sourcing and procurement of ${productWanted} in ${city}${country}.

At OneRoot Farm (Karnataka, India), we contract-grow IPM-grade Turmeric across 6,000 acres with 3,000 farmers (15,000 MT season capacity), specifically cultivated to comply with EU Maximum Residue Levels (Regulation EC No 396/2005).

Unlike conventional supply sorted at the end, our turmeric is grown with our in-house biological inputs (fyto) for elevated curcumin, low residue profiles, and field-level traceability.

Attached is our official European Specification Deck (PDF) with complete technical and agronomy parameters.

Could we schedule a brief 10-minute introductory call next week to discuss ${company}'s sourcing requirements for the upcoming harvest?

Looking forward to your reply.

Warm regards,
OneRoot Exports Team
International Trade & Exports Division
OneRoot Farm | Email: export@oneroot.farm | Web: https://oneroot.farm`);
    }
  }, [importer, open]);

  if (!open || !importer) return null;

  const handleSend = async () => {
    if (!importer.email) {
      toast.error("Buyer has no email address configured!");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendOneClickPersonalizedEmailApi(importer._id, {
        customSubject: subject,
        customBody: body,
      });

      if (res.success) {
        toast.success(
          `Outreach email delivered to ${importer.contactPerson || importer.companyName || importer.email}!`,
          { duration: 4500 }
        );
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to deliver email"
      );
    } finally {
      setIsSending(false);
    }
  };

  const productBadge =
    Array.isArray(importer.products) && importer.products.length > 0
      ? importer.products.join(", ")
      : importer.materialType || "Dry Turmeric Fingers";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shadow-inner">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                1-Click Automated Email Outreach
              </h3>
              <p className="text-xs text-white/80">
                Buyer name, company, and products are auto-populated
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Personalization Badges */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Auto-Merged Lead Context
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 shadow-2xs">
              <User className="h-3.5 w-3.5 text-violet-600" />
              <span className="font-medium text-slate-500">Buyer:</span>
              <span className="font-bold">
                {importer.contactPerson || importer.importerName || "—"}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-slate-500">Company:</span>
              <span className="font-bold">
                {importer.companyName || importer.importerName}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 shadow-2xs">
              <Package className="h-3.5 w-3.5 text-amber-600" />
              <span className="font-medium text-slate-500">Product:</span>
              <span className="font-bold text-amber-900">{productBadge}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 shadow-2xs">
              <Globe className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium text-slate-500">Country:</span>
              <span className="font-bold">{importer.country || "—"}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-800 shadow-2xs">
              <Mail className="h-3.5 w-3.5 text-rose-600" />
              <span className="font-medium text-slate-500">Recipient:</span>
              <span className="font-bold text-rose-900 font-mono text-[11px]">
                {importer.email || "No email"}
              </span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800 shadow-2xs font-semibold">
              <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
              <span>Attachment: oneroot_IPM_Turmeric_Europe_v4.pdf</span>
            </span>
          </div>
        </div>

        {/* Content Preview & Editing */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 shadow-2xs focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Body (Auto-Personalized)
            </label>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans shadow-2xs focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <p className="text-xs text-slate-500">
            Delivers via configured inbox & tracks in CRM thread
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSending}
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSending || !importer.email}
              onClick={handleSend}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Delivering Email...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Email Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
