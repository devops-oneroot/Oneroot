"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { fetchLeads, fetchTeamMembers, checkLeadDuplicates } from "@/lib/api";
import type { CreateLeadInput } from "@/lib/types";
import { buildReassignTeamNames } from "@/lib/utils";
import { isExportOnlyAdmin } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";
import {
  defaultLeadFormValues,
  formValuesToPayload,
  leadFormSchema,
  type LeadFormInput,
  type LeadFormValues,
} from "@/lib/leadForm";
import { LeadFormFields } from "./LeadFormFields";
import { LeadFormModeProvider } from "./LeadFormModeContext";

function firstFormErrorMessage(
  errors: FieldErrors<LeadFormInput>
): string | undefined {
  for (const value of Object.values(errors)) {
    if (!value) continue;
    if (typeof value === "object" && "message" in value) {
      const msg = value.message;
      if (typeof msg === "string" && msg) return msg;
    }
    if (typeof value === "object") {
      const nested = firstFormErrorMessage(value as FieldErrors<LeadFormInput>);
      if (nested) return nested;
    }
  }
  return undefined;
}

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateLeadModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateLeadModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const exportOnlyAdmin = isExportOnlyAdmin(user);
  const responsiblePersonName = user?.name?.trim() || "";

  const openDefaults = useMemo(
    () => ({
      ...defaultLeadFormValues,
      responsiblePerson: responsiblePersonName,
      ...(exportOnlyAdmin
        ? { leadType: "export" as const, industry: "export" as const }
        : {}),
    }),
    [responsiblePersonName, exportOnlyAdmin]
  );

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: open,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
    enabled: open && isAdmin,
  });

  const submittingRef = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: openDefaults,
  });

  useEffect(() => {
    if (open) {
      reset(openDefaults);
    }
  }, [open, openDefaults, reset]);

  const teamOptions = useMemo(
    () => buildReassignTeamNames(team, leads, [responsiblePersonName]),
    [team, leads, responsiblePersonName]
  );

  if (!open) return null;

  const submit = async (values: LeadFormValues) => {
    // A double-click used to fire two submits during the duplicate check
    // below, and both got saved. Ignore anything after the first.
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await submitOnce(values);
    } finally {
      submittingRef.current = false;
    }
  };

  const submitOnce = async (values: LeadFormValues) => {
    const { status: _, ...payload } = formValuesToPayload(values);

    // Last check before sending — the API refuses duplicates too, this just
    // reports it in the form instead of as a failed request.
    const phones = [
      ...new Set(
        (values.contacts ?? [])
          .flatMap((c) => [...(c.phones ?? []), c.phone ?? ""])
          .map((p) => String(p ?? "").trim())
          .filter(Boolean)
      ),
    ];
    const company = values.company?.trim() ?? "";

    try {
      const duplicates = await checkLeadDuplicates(
        company,
        phones,
        values.leadType === "export" ? "export" : "domestic"
      );
      if (duplicates.length) {
        const onPhone = duplicates.some((d) => d.matchedOn !== "company");
        const onCompany = duplicates.some((d) => d.matchedOn !== "phone");
        const owner = duplicates[0].createdByName || "another user";
        toast.error(
          onCompany && onPhone
            ? `This company name and phone number are already in the database (added by ${owner}).`
            : onPhone
              ? `This phone number is already in the database (added by ${owner}).`
              : `This company is already in the database (added by ${owner}).`
        );
        return;
      }
    } catch {
      // Check unavailable — let the API make the final call.
    }

    await onSubmit(payload as CreateLeadInput);
    reset();
    onClose();
  };

  const onInvalid = (fieldErrors: FieldErrors<LeadFormInput>) => {
    const message =
      firstFormErrorMessage(fieldErrors) ??
      "Please fix the highlighted fields before creating the lead.";
    toast.error(message);
  };

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
            <h2 className="truncate text-lg font-semibold">Create Lead</h2>
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
          onSubmit={(event) => handleSubmit(submit, onInvalid)(event)}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <div className="space-y-6 p-4 sm:p-6">
            <LeadFormModeProvider isNewLead>
              <LeadFormFields
                register={register}
                watch={watch}
                setValue={setValue}
                control={control}
                errors={errors}
                team={teamOptions}
                responsiblePersonLocked={!isAdmin}
                responsiblePersonName={responsiblePersonName}
                adminCanReassign={isAdmin}
                reassignLabel="Assign to *"
                leadTypeLocked={exportOnlyAdmin}
              />
            </LeadFormModeProvider>
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
              disabled={isSubmitting || isFormSubmitting}
              className="w-full rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting || isFormSubmitting ? "Creating…" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
