"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SupplierLeadFields } from "@/components/leads/SupplierLeadFields";
import { FormField } from "@/components/leads/FormField";
import { fetchTeamMembers, updateSupplier } from "@/lib/api";
import { teamMemberNames } from "@/lib/utils";
import { inputClass } from "@/lib/supplierForm";
import {
  supplierFormSchema,
  supplierFormToPayload,
  supplierToFormValues,
  type SupplierFormInput,
  type SupplierFormValues,
} from "@/lib/supplierForm";
import { LEAD_STATUSES } from "@/lib/types";
import type { Supplier } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";

interface SupplierDetailPanelProps {
  supplier: Supplier | null;
  onClose: () => void;
}

export function SupplierDetailPanel({
  supplier,
  onClose,
}: SupplierDetailPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: !!supplier,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SupplierFormInput, unknown, SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
  });

  const displayName =
    watch("supplierName") ||
    supplier?.supplierDetails?.supplierName ||
    supplier?.name;

  const currentResponsible = String(
    watch("responsiblePerson") || supplier?.responsiblePerson || ""
  ).trim();

  const teamOptions = [
    ...new Set([...teamMemberNames(team), currentResponsible].filter(Boolean)),
  ];

  useEffect(() => {
    if (supplier) reset(supplierToFormValues(supplier));
  }, [supplier, reset]);

  useEffect(() => {
    if (!supplier) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [supplier, onClose]);

  const saveMutation = useMutation({
    mutationFn: (values: SupplierFormValues) =>
      updateSupplier(supplier!._id, supplierFormToPayload(values)),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      reset(supplierToFormValues(updated));
      toast.success("Supplier updated");
    },
    onError: () => toast.error("Failed to update supplier"),
  });

  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e1e] px-4 py-3 text-white sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo surface="on-dark" className="hidden h-8 w-28 shrink-0 sm:block" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold sm:text-xl">
                {displayName || "Supplier"}
              </h2>
              <p className="text-xs text-slate-400 sm:text-sm">Edit supplier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <SupplierLeadFields
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />

          <div className="mt-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignment
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Responsible person *"
                error={errors.responsiblePerson?.message}
              >
                {!isAdmin && currentResponsible ? (
                  <>
                    <input type="hidden" {...register("responsiblePerson")} />
                    <input
                      type="text"
                      readOnly
                      value={currentResponsible}
                      className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-700`}
                    />
                  </>
                ) : (
                  <select
                    {...register("responsiblePerson")}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select team member
                    </option>
                    {teamOptions.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
              <FormField
                label="Follow-up date"
                error={errors.followUpDate?.message}
              >
                <input
                  type="date"
                  {...register("followUpDate")}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Status" error={errors.status?.message}>
                <select {...register("status")} className={inputClass}>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isDirty || saveMutation.isPending}
            className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
