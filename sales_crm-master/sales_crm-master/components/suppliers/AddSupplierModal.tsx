"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { SupplierLeadFields } from "@/components/leads/SupplierLeadFields";
import { FormField } from "@/components/leads/FormField";
import { fetchTeamMembers } from "@/lib/api";
import { teamMemberNames } from "@/lib/utils";
import { inputClass } from "@/lib/supplierForm";
import {
  defaultSupplierFormValues,
  supplierFormSchema,
  type SupplierFormInput,
  type SupplierFormValues,
} from "@/lib/supplierForm";
import { LEAD_STATUSES } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";
import type { CreateSupplierInput } from "@/lib/types";
import type { FieldErrors } from "react-hook-form";

interface AddSupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierInput) => Promise<void>;
  isSubmitting?: boolean;
}

function firstFormErrorMessage(
  errors: FieldErrors<SupplierFormInput>
): string | undefined {
  for (const value of Object.values(errors)) {
    if (!value) continue;
    if (typeof value === "object" && "message" in value) {
      const msg = value.message;
      if (typeof msg === "string" && msg) return msg;
    }
    if (typeof value === "object") {
      const nested = firstFormErrorMessage(value as FieldErrors<SupplierFormInput>);
      if (nested) return nested;
    }
  }
  return undefined;
}

export function AddSupplierModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: AddSupplierModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const responsiblePersonLocked = !isAdmin;
  const responsiblePersonName = user?.name?.trim() || "";

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormInput, unknown, SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      ...defaultSupplierFormValues,
      responsiblePerson: responsiblePersonName,
    },
  });

  useEffect(() => {
    if (open && responsiblePersonName) {
      reset({
        ...defaultSupplierFormValues,
        responsiblePerson: responsiblePersonName,
      });
    }
  }, [open, responsiblePersonName, reset]);

  const teamOptions = [
    ...new Set([...teamMemberNames(team), responsiblePersonName].filter(Boolean)),
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-xl">
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e1e] px-4 py-3 text-white sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo surface="on-dark" className="hidden h-8 w-28 sm:block" />
            <h2 className="truncate text-lg font-semibold">Add Supplier</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(
            async (values) => {
              const { supplierFormToPayload } = await import("@/lib/supplierForm");
              await onSubmit(supplierFormToPayload(values));
              reset();
              onClose();
            },
            (fieldErrors) => {
              toast.error(
                firstFormErrorMessage(fieldErrors) ??
                  "Please fix the highlighted fields."
              );
            }
          )}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-6 p-4 sm:p-6">
            <SupplierLeadFields
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assignment
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  label="Responsible person *"
                  error={errors.responsiblePerson?.message}
                >
                  {responsiblePersonLocked && responsiblePersonName ? (
                    <>
                      <input type="hidden" {...register("responsiblePerson")} />
                      <input
                        type="text"
                        readOnly
                        value={responsiblePersonName}
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
          </div>

          <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Saving…" : "Add Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
