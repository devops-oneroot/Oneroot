"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X, Globe } from "lucide-react";
import { FormField } from "@/components/leads/FormField";
import { fetchCountries } from "@/lib/countries";
import { fetchTeamMembers } from "@/lib/api";
import { teamMemberNames } from "@/lib/utils";
import {
  defaultImporterFormValues,
  IMPORTER_TYPES,
  importerFormSchema,
  importerFormToPayload,
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
import { LEAD_STATUSES, PRODUCT_OPTIONS } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";
import type { CreateImporterInput } from "@/lib/types";

interface AddImporterModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateImporterInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddImporterModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: AddImporterModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const responsiblePersonName = user?.name?.trim() || "";

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: open,
  });

  const { data: countries = [] } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    enabled: open,
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
    defaultValues: {
      ...defaultImporterFormValues,
      responsiblePerson: responsiblePersonName,
    },
  });

  useEffect(() => {
    if (open && responsiblePersonName) {
      reset({
        ...defaultImporterFormValues,
        responsiblePerson: responsiblePersonName,
      });
    }
  }, [open, responsiblePersonName, reset]);

  const teamOptions = [
    ...new Set([...teamMemberNames(team), responsiblePersonName].filter(Boolean)),
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

  const onValidSubmit = async (values: ImporterFormValues) => {
    try {
      const payload = importerFormToPayload(values);
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create importer";
      toast.error(msg);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Importer</h2>
              <p className="text-xs text-slate-500">
                Register an international buyer or importing partner
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

        <form
          onSubmit={handleSubmit(onValidSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Section 1: Importer Details */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                1. Importer Information
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Importer / Firm Name *"
                  error={errors.importerName?.message}
                >
                  <input
                    {...register("importerName")}
                    placeholder="e.g. Pacific Spices Inc"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Contact Number / Phone *"
                  error={errors.importerNumber?.message}
                >
                  <input
                    {...register("importerNumber")}
                    placeholder="e.g. +1 555-0199"
                    type="tel"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Contact Person" error={errors.contactPerson?.message}>
                  <input
                    {...register("contactPerson")}
                    placeholder="e.g. John Doe / Procurement Mgr"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Email" error={errors.email?.message}>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="procurement@example.com"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="VAT / Tax ID / Registration" error={errors.taxIdOrIec?.message}>
                  <input
                    {...register("taxIdOrIec")}
                    placeholder="e.g. US-EIN / EU VAT"
                    className={inputClass}
                  />
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
                    <option value="">Select importer type</option>
                    {IMPORTER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Website" error={errors.website?.message}>
                  <input
                    {...register("website")}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            {/* Section 2: Products & Requirements */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                2. Required Commodities & Specifications
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
                    placeholder="e.g. 3.5"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Cultivation / Grade" error={errors.grade?.message}>
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
                    placeholder="e.g. 150"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Quantity Needed (kg)" error={errors.quantityKg?.message}>
                  <input
                    type="number"
                    min={0}
                    {...register("quantityKg", { valueAsNumber: true })}
                    placeholder="e.g. 25000"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            {/* Section 3: Shipping & Commercial Terms */}
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
                  <input
                    {...register("portOfDischarge")}
                    placeholder="e.g. Port of Los Angeles, Jebel Ali, Rotterdam"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Preferred Port of Loading" error={errors.portOfLoading?.message}>
                  <input
                    {...register("portOfLoading")}
                    placeholder="e.g. JNPT Mumbai, Chennai, Mundra"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
                  <input
                    {...register("paymentTerms")}
                    placeholder="e.g. 100% LC at sight, 20% Adv + 80% CAD"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Credit / Payment Days" error={errors.paymentDays?.message}>
                  <input
                    type="number"
                    min={0}
                    {...register("paymentDays", { valueAsNumber: true })}
                    placeholder="e.g. 30"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="City / Address" error={errors.address?.message}>
                  <input
                    {...register("address")}
                    placeholder="State/Province, City, Street Address"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            {/* Section 4: Assignment & CRM Pipeline */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                4. Pipeline & Team Assignment
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
                    <option value="">Select team member</option>
                    {teamOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Lead Pipeline Status" error={errors.status?.message}>
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
                    placeholder="Quality parameters, packaging requirement (jute/PP bags, palletized), certifications..."
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>
          </div>

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
              disabled={isSubmitting}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save Importer"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

