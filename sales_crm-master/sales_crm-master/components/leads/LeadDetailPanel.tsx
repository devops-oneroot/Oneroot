"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { X, MessageSquare, Calendar, Clock, Trash2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  addRemark,
  deleteLead,
  fetchLeadActivityLog,
  fetchLeads,
  fetchTeamMembers,
  updateLead,
} from "@/lib/api";
import { invalidateLeadActivity } from "@/lib/invalidateActivity";
import type { Lead } from "@/lib/types";
import { INDUSTRY_TYPES, leadStatusLabel } from "@/lib/types";
import { isExportOnlyAdmin } from "@/lib/auth";
import { useAuth } from "@/providers/AuthProvider";
import {
  buildReassignTeamNames,
  followUpBadgeClass,
  formatCurrency,
  formatFollowUpDate,
  formatTurnoverCr,
  getFollowUpUrgency,
} from "@/lib/utils";
import {
  formValuesToPayload,
  inferLeadType,
  inputClass,
  leadFormSchema,
  leadToFormValues,
  type LeadFormInput,
  type LeadFormValues,
} from "@/lib/leadForm";
import {
  DAILY_ACTIVITY_SELECTABLE_TYPES,
  LEAD_PROGRESS_STATUSES,
  LEAD_TYPES,
  leadDailyActivitiesFromLead,
} from "@/lib/leadOptions";
import { DeleteLeadDialog } from "./DeleteLeadDialog";
import { LeadFormModeProvider } from "./LeadFormModeContext";
import { contactsFromLead, whatsappNumbersFromLead } from "@/lib/leadContacts";
import { LeadDocuments } from "./LeadDocuments";
import { DailyActivityField } from "./DailyActivityField";
import { FormField } from "./FormField";
import { LeadFormFields } from "./LeadFormFields";
import { LeadTypeField } from "./LeadTypeField";

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
}

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState("");
  const [detailLead, setDetailLead] = useState(lead);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const exportOnlyAdmin = isExportOnlyAdmin(user);

  const { data: team = [] } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeamMembers,
    enabled: !!lead,
  });

  const { data: allLeads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
    enabled: !!lead && isAdmin,
  });

  const {
    data: activityHistory = [],
    isLoading: activityHistoryLoading,
    isError: activityHistoryError,
  } = useQuery({
      queryKey: ["lead-activity-log", lead?._id],
      queryFn: () => fetchLeadActivityLog(lead!._id),
      enabled: !!lead,
    });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
  });

  const displayName =
    watch("company") ||
    lead?.company ||
    watch("contacts")?.find((c) => c.name?.trim())?.name ||
    lead?.contactPerson ||
    lead?.name;

  const currentResponsible =
    String(watch("responsiblePerson") || lead?.responsiblePerson || "").trim();

  const followUpDateValue = watch("followUpDate") ?? "";

  const teamOptions = useMemo(
    () => buildReassignTeamNames(team, allLeads, [currentResponsible]),
    [team, allLeads, currentResponsible]
  );

  useEffect(() => {
    if (lead) {
      setDetailLead(lead);
      setConfirmDelete(false);
      reset(leadToFormValues(lead));
    }
  }, [lead, reset]);

  useEffect(() => {
    if (!lead) return;
    setRemark("");
    setRemarkError("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lead, onClose]);

  const saveMutation = useMutation({
    mutationFn: (values: LeadFormValues) =>
      updateLead(lead!._id, formValuesToPayload(values)),
    onSuccess: (updated) => {
      setDetailLead(updated);
      invalidateLeadActivity(queryClient);
      reset(leadToFormValues(updated));
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Failed to update customer";
      toast.error(message);
    },
  });

  const remarkMutation = useMutation({
    mutationFn: (text: string) =>
      addRemark(lead!._id, text, user?.name?.trim() || undefined),
    onSuccess: () => {
      invalidateLeadActivity(queryClient);
      setRemark("");
    },
    onError: () => toast.error("Failed to add remark"),
  });

  // Non-admins see saved phone numbers and emails read-only; admins edit freely.
  const lockedContactsForForm = useMemo(() => {
    const source = detailLead ?? lead;
    if (isAdmin || !source) return null;
    return contactsFromLead(source);
  }, [isAdmin, detailLead, lead]);

  // Non-admins see saved WhatsApp numbers read-only; admins edit freely.
  const lockedWhatsappNumbersForForm = useMemo(() => {
    const source = detailLead ?? lead;
    if (isAdmin || !source) return null;
    return whatsappNumbersFromLead(source);
  }, [isAdmin, detailLead, lead]);

  const deleteMutation = useMutation({
    mutationFn: (confirmName: string) => deleteLead(lead!._id, confirmName),
    onSuccess: (result) => {
      invalidateLeadActivity(queryClient);
      queryClient.invalidateQueries({ queryKey: ["lead-activity-log"] });
      toast.success(`"${result.deleted.name}" deleted`);
      setConfirmDelete(false);
      onClose();
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Failed to delete lead";
      toast.error(message);
    },
  });

  const isSaving = saveMutation.isPending || remarkMutation.isPending;
  const canSave = isDirty || remark.trim().length > 0;

  const handleSaveAll = handleSubmit(async (values) => {
    const remarkText = remark.trim();
    let valid = true;
    clearErrors(["dailyActivityNote", "dailyActivities"]);
    setRemarkError("");

    if (values.dailyActivities?.length && !values.dailyActivityNote?.trim()) {
      setError("dailyActivityNote", {
        type: "manual",
        message: "Activity note is required",
      });
      valid = false;
    }

    // A note with no activity ticked is discarded by the API — stop the save
    // and say so, rather than losing what they typed.
    if (
      values.dailyActivityNote?.trim() &&
      !values.dailyActivities?.length
    ) {
      setError("dailyActivities", {
        type: "manual",
        message: "Tick the activity this note is about",
      });
      valid = false;
    }

    if (values.followUpDate?.trim() && dirtyFields.followUpDate && !remarkText) {
      setRemarkError("Remark is required when follow-up date is set");
      valid = false;
    }

    if (!valid) {
      toast.error("Please complete required fields");
      return;
    }

    if (!isDirty && !remarkText) return;

    try {
      if (isDirty) {
        await saveMutation.mutateAsync(values);
      }
      if (remarkText) {
        await remarkMutation.mutateAsync(remarkText);
      }
      if (isDirty && remarkText) {
        toast.success("Customer updated and remark added");
      } else if (isDirty) {
        toast.success("Customer updated");
      } else if (remarkText) {
        toast.success("Remark added");
      }
    } catch {
      // Individual mutations already show errors
    }
  });

  if (!lead) return null;

  const statusLabel = leadStatusLabel(lead.status);
  const industryTypeLabel = lead.industryType
    ? (INDUSTRY_TYPES.find((t) => t.id === lead.industryType)?.label ??
      lead.industryType)
    : null;
  const followUpUrgency = getFollowUpUrgency(lead.followUpDate);
  const followUpLabel = formatFollowUpDate(lead.followUpDate);
  const dailyActivityLabels = leadDailyActivitiesFromLead(detailLead ?? lead)
    .map(
      (id) =>
        DAILY_ACTIVITY_SELECTABLE_TYPES.find((t) => t.id === id)?.label ?? id
    )
    .join(", ");
  const leadProgressLabel = lead.leadStatus
    ? (LEAD_PROGRESS_STATUSES.find((t) => t.id === lead.leadStatus)?.label ??
      lead.leadStatus)
    : null;
  const createdAtSource = (detailLead ?? lead).createdAt;
  const createdLabel = createdAtSource
    ? new Date(createdAtSource).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0e1e] px-4 py-3 text-white sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo surface="on-dark" className="hidden h-8 w-28 shrink-0 sm:block" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold sm:text-xl">
                {displayName || "Customer"}
              </h2>
              <p className="text-xs text-slate-400 sm:text-sm">
                View & edit customer
                {createdLabel && (
                  <span className="text-slate-500"> · Created {createdLabel}</span>
                )}
              </p>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {createdLabel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                <Clock className="h-3.5 w-3.5" />
                Created {createdLabel}
              </span>
            )}
            <span className="inline-flex rounded-md bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
              {statusLabel}
            </span>
            <span className="inline-flex rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
              {LEAD_TYPES.find((t) => t.id === inferLeadType(lead))?.label ??
                lead.leadType ??
                lead.industry}
            </span>
            {industryTypeLabel && (
              <span className="inline-flex rounded-md bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {industryTypeLabel}
              </span>
            )}
            {lead.creditRating && (
              <span className="inline-flex rounded-md bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Credit: {lead.creditRating}
              </span>
            )}
            {lead.companyTurnover != null && lead.companyTurnover > 0 && (
              <span className="inline-flex rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                Turnover: {formatTurnoverCr(lead.companyTurnover)}
              </span>
            )}
            {lead.sourcingRegion && (
              <span className="inline-flex rounded-md bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                Sourcing: {lead.sourcingRegion}
              </span>
            )}
            {followUpLabel && (
              <span
                className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold ${followUpBadgeClass[followUpUrgency]}`}
              >
                Follow-up: {followUpLabel}
                {followUpUrgency === "overdue" && " · Overdue"}
                {followUpUrgency === "today" && " · Due today"}
              </span>
            )}
            {leadProgressLabel && (
              <span className="inline-flex rounded-md bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-900">
                Lead status: {leadProgressLabel}
              </span>
            )}
            {dailyActivityLabels && (
              <span className="inline-flex rounded-md bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                Daily activity: {dailyActivityLabels}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveAll} className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <LeadTypeField
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
                className="mb-5 block w-full"
                locked={exportOnlyAdmin}
              />
              <LeadFormModeProvider
                isNewLead={false}
                lockSavedContacts={lockedContactsForForm}
                lockSavedWhatsappNumbers={lockedWhatsappNumbersForForm}
              >
                <LeadFormFields
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  control={control}
                  errors={errors}
                  team={teamOptions}
                  showStatus
                  // showLeadStatus — hidden from the edit form; the value is kept on the lead
                  responsiblePersonLocked={!isAdmin}
                  responsiblePersonName={currentResponsible}
                  adminCanReassign={isAdmin}
                  hideLeadType
                  hideFollowUpDate
                  hideDailyActivity
                />
              </LeadFormModeProvider>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                <DailyActivityField
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                  history={activityHistory}
                  historyLoading={activityHistoryLoading}
                  historyError={activityHistoryError}
                />
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <Calendar className="h-5 w-5 text-violet-600" />
                    Follow-up
                  </h3>
                  <FormField
                    label="Follow-up date"
                    error={errors.followUpDate?.message}
                  >
                    <input
                      type="date"
                      {...register("followUpDate")}
                      className={`${inputClass} w-full bg-white`}
                    />
                  </FormField>
                  {followUpDateValue && (
                    <FormField label="Remarks *" error={remarkError}>
                      <textarea
                        value={remark}
                        onChange={(e) => {
                          setRemark(e.target.value);
                          if (remarkError) setRemarkError("");
                        }}
                        placeholder="Write a remark about this follow-up…"
                        rows={3}
                        className={`${inputClass} resize-y bg-white`}
                      />
                    </FormField>
                  )}
                  <p className="text-xs text-slate-500">
                    Changing the follow-up date counts once per lead per day in
                    Outreach. Daily Activity is reflected in the Outreach tab.
                  </p>
                </div>
              </div>

              {(detailLead?.remarks?.length ?? lead.remarks?.length) ? (
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MessageSquare className="h-4 w-4 text-violet-600" />
                    Previous remarks
                  </h4>
                  <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 sm:max-h-72">
                    {(
                      detailLead?.remarks?.length
                        ? [...detailLead.remarks]
                        : [...(lead.remarks ?? [])]
                    )
                      .reverse()
                      .map((r) => (
                        <li
                          key={r._id}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        >
                          <p className="whitespace-pre-wrap">{r.text}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            {new Date(r.createdAt).toLocaleString()}
                          </p>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <button
              type="submit"
              disabled={!canSave || isSaving}
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>

            {isAdmin && (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Deleting removes this lead for everyone and cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isSaving || deleteMutation.isPending}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete lead
                </button>
              </div>
            )}
          </form>

          <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:mt-6 sm:p-5">
            <LeadDocuments lead={lead} />
          </section>
        </div>
      </div>

      {isAdmin && (
        <DeleteLeadDialog
          lead={detailLead ?? lead}
          open={confirmDelete}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async (confirmName) => {
            await deleteMutation.mutateAsync(confirmName);
          }}
        />
      )}
    </div>
  );
}
