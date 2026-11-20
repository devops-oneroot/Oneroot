"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ExternalLink, Globe, Mail, Phone, Sparkles, Trash2, User as UserIcon, X } from "lucide-react";
import { FormField } from "@/components/leads/FormField";
import { fetchCountries } from "@/lib/countries";
import { deleteImporter, fetchTeamMembers, updateImporter } from "@/lib/api";
import { ImporterEmailConversations } from "./ImporterEmailConversations";
import { OneClickEmailModal } from "./OneClickEmailModal";
import { teamMemberNames } from "@/lib/utils";
import {
  IMPORTER_TYPES,
  importerFormSchema,
  importerFormToPayload,
  importerToFormValues,
  inputClass,
  selectClass,
  type ImporterFormInput,
  type ImporterFormValues,
} from "@/lib/importerForm";
import {
  ACCEPT_GRADES,
  INCOTERMS,
  MATERIAL_TYPES,
  POLISH_LEVELS,
} from "@/lib/leadOptions";
import { LEAD_STATUSES, PRODUCT_OPTIONS, type Importer } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

interface ImporterDetailPanelProps {
  importer: Importer | null;
  onClose: () => void;
  initialTab?: "profile" | "emails";
}

export function ImporterDetailPanel({
  importer,
  onClose,
  initialTab = "profile",
}: ImporterDetailPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showOneClickModal, setShowOneClickModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "emails">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: !!importer,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    enabled: !!importer,
    staleTime: Infinity,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ImporterFormInput, unknown, ImporterFormValues>({
    resolver: zodResolver(importerFormSchema),
  });

  const displayName =
    watch("importerName") ||
    importer?.importerName ||
    importer?.companyName ||
    "Importer Details";

  const importerNumberVal = watch("importerNumber") || importer?.importerNumber;
  const emailVal = watch("email") || importer?.email;
  const websiteVal = watch("website") || importer?.website;

  const currentResponsible = String(
    watch("responsiblePerson") || importer?.responsiblePerson || ""
  ).trim();

  const teamOptions = [
    ...new Set([...teamMemberNames(team), currentResponsible].filter(Boolean)),
  ];

  const selectedProducts = watch("products") || [];

  const toggleProduct = (prodId: string) => {
    const current = new Set(selectedProducts);
    if (current.has(prodId)) {
      current.delete(prodId);
    } else {
      current.add(prodId);
    }
    setValue("products", Array.from(current), { shouldDirty: true });
  };

  useEffect(() => {
    if (importer) {
      reset(importerToFormValues(importer));
      setConfirmDelete(false);
    }
  }, [importer, reset]);

  useEffect(() => {
    if (!importer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [importer, onClose]);

  const saveMutation = useMutation({
    mutationFn: (values: ImporterFormValues) =>
      updateImporter(importer!._id, importerFormToPayload(values)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["importers"] });
      reset(importerToFormValues(updated));
      toast.success("Importer updated successfully");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update importer";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteImporter(importer!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importers"] });
      toast.success("Importer deleted");
      onClose();
    },
    onError: () => toast.error("Failed to delete importer"),
  });

  if (!importer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-4">
      <button
        type="button"
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-label="Close panel overlay"
      />

      <div className="relative flex h-[92vh] max-h-[92vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white shadow-2xl overflow-hidden sm:rounded-2xl my-auto">
        <header className="shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">
                  Created on {new Date(importer.createdAt).toLocaleDateString()}
                </span>
                {importerNumberVal && (
                  <a
                    href={`tel:${String(importerNumberVal).replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    title={`Call ${importerNumberVal}`}
                  >
                    <Phone className="h-3 w-3" />
                    <span>Call {importerNumberVal}</span>
                  </a>
                )}
                {emailVal && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOneClickModal(true)}
                      className="inline-flex items-center gap-1 rounded bg-violet-600 px-2 py-0.5 text-xs font-bold text-white transition-colors hover:bg-violet-700 shadow-2xs"
                      title={`1-Click Automated Email to ${importer.contactPerson || importer.importerName}`}
                    >
                      <Sparkles className="h-3 w-3 text-amber-300" />
                      <span>Send Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("emails")}
                      className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      title={`View and reply to emails with ${emailVal}`}
                    >
                      <Mail className="h-3 w-3" />
                      <span>Email & Replies</span>
                    </button>
                  </>
                )}
                {websiteVal && (
                  <a
                    href={websiteVal.startsWith("http") ? websiteVal : `https://${websiteVal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    title="Open website"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Website</span>
                  </a>
                )}
              </div>
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

        {/* Navigation Tabs */}
        <div className="shrink-0 flex border-b border-slate-200 bg-slate-50/60 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition ${
              activeTab === "profile"
                ? "border-violet-600 text-violet-700 bg-white rounded-t-lg -mb-px"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Profile & Specifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("emails")}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 px-3 text-xs font-semibold transition ${
              activeTab === "emails"
                ? "border-indigo-600 text-indigo-700 bg-white rounded-t-lg -mb-px"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email Conversations & Replies</span>
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              Live Thread
            </span>
          </button>
        </div>

        {activeTab === "emails" ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <ImporterEmailConversations importer={importer} />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
            className="flex flex-1 flex-col overflow-hidden min-h-0"
          >
          <div className="flex-1 space-y-6 overflow-y-auto p-6 min-h-0">
            {/* 1. Core Profile */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                1. Importer Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Importer / Firm Name *"
                  error={errors.importerName?.message}
                >
                  <input {...register("importerName")} className={inputClass} />
                </FormField>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Contact Number / Phone *
                    </label>
                    {importerNumberVal && (
                      <a
                        href={`tel:${String(importerNumberVal).replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        title="Click to call"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    )}
                  </div>
                  <input
                    {...register("importerNumber")}
                    type="tel"
                    className={inputClass}
                  />
                  {errors.importerNumber?.message && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.importerNumber.message}
                    </p>
                  )}
                </div>

                <FormField label="Contact Person" error={errors.contactPerson?.message}>
                  <input {...register("contactPerson")} className={inputClass} />
                </FormField>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>
                    {emailVal && (
                      <a
                        href={`mailto:${emailVal}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        title="Click to send email"
                      >
                        <Mail className="h-3 w-3" />
                        Send mail
                      </a>
                    )}
                  </div>
                  <input
                    {...register("email")}
                    type="email"
                    className={inputClass}
                  />
                  {errors.email?.message && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <FormField label="Tax ID / VAT / Registration" error={errors.taxIdOrIec?.message}>
                  <input {...register("taxIdOrIec")} className={inputClass} />
                </FormField>

                <FormField label="Destination Country" error={errors.country?.message}>
                  <select {...register("country")} className={selectClass}>
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Importer Type" error={errors.importerType?.message}>
                  <select {...register("importerType")} className={selectClass}>
                    <option value="">Select type</option>
                    {IMPORTER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Website" error={errors.website?.message}>
                  <input {...register("website")} className={inputClass} />
                </FormField>
              </div>
            </div>

            {/* 2. Commodities & Requirements */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                2. Products & Specifications
              </h3>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Products Interested In
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_OPTIONS.map((prod) => {
                    const active = selectedProducts.includes(prod.id);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleProduct(prod.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-violet-600 bg-violet-50 text-violet-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {prod.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Material Type" error={errors.materialType?.message}>
                  <select {...register("materialType")} className={selectClass}>
                    <option value="">Select material</option>
                    {MATERIAL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Polish Level" error={errors.polishLevel?.message}>
                  <select {...register("polishLevel")} className={selectClass}>
                    <option value="">Select polish</option>
                    {POLISH_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Required Curcumin %" error={errors.curcuminPercent?.message}>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("curcuminPercent", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Grade / Cultivation" error={errors.grade?.message}>
                  <select {...register("grade")} className={selectClass}>
                    <option value="">Select grade</option>
                    {ACCEPT_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Target Buying Price (₹ / $)" error={errors.price?.message}>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("price", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Quantity (kg)" error={errors.quantityKg?.message}>
                  <input
                    type="number"
                    min={0}
                    {...register("quantityKg", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            {/* 3. Commercial Terms & Shipping */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                3. Shipping & Commercial Terms
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Incoterm" error={errors.incoterm?.message}>
                  <select {...register("incoterm")} className={selectClass}>
                    <option value="">Select Incoterm</option>
                    {INCOTERMS.map((term) => (
                      <option key={term} value={term}>
                        {term}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Port of Discharge (Destination)" error={errors.portOfDischarge?.message}>
                  <input {...register("portOfDischarge")} className={inputClass} />
                </FormField>

                <FormField label="Preferred Port of Loading" error={errors.portOfLoading?.message}>
                  <input {...register("portOfLoading")} className={inputClass} />
                </FormField>

                <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
                  <input {...register("paymentTerms")} className={inputClass} />
                </FormField>

                <FormField label="Credit / Payment Days" error={errors.paymentDays?.message}>
                  <input
                    type="number"
                    min={0}
                    {...register("paymentDays", { valueAsNumber: true })}
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Address / Region" error={errors.address?.message}>
                  <input {...register("address")} className={inputClass} />
                </FormField>
              </div>
            </div>

            {/* 4. CRM Assignment & Follow up */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                4. Pipeline & Follow-up
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  label="Responsible Person *"
                  error={errors.responsiblePerson?.message}
                >
                  <select
                    {...register("responsiblePerson")}
                    className={selectClass}
                  >
                    {teamOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Pipeline Status" error={errors.status?.message}>
                  <select {...register("status")} className={selectClass}>
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Follow-up Date" error={errors.followUpDate?.message}>
                  <input
                    type="date"
                    {...register("followUpDate")}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="mt-3">
                <FormField label="Remarks / Requirements Notes" error={errors.remarks?.message}>
                  <textarea
                    {...register("remarks")}
                    rows={2}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div>
              {isAdmin && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Importer
                </button>
              )}
              {isAdmin && confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-red-600">
                    Are you sure?
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded bg-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </footer>
        </form>
        )}
      </div>

      <OneClickEmailModal
        importer={importer}
        open={showOneClickModal}
        onClose={() => setShowOneClickModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["importers"] });
          queryClient.invalidateQueries({ queryKey: ["importer-emails", importer?._id] });
        }}
      />
    </div>
  );
}

