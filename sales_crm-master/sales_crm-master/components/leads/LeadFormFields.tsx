"use client";

import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import { LEAD_PROGRESS_STATUSES } from "@/lib/leadOptions";
import { DailyActivityField } from "./DailyActivityField";
import { LEAD_STATUSES } from "@/lib/types";
import { DomesticLeadFields } from "./DomesticLeadFields";
import { ExportLeadFields } from "./ExportLeadFields";
import { FormField } from "./FormField";
import { LeadTypeField } from "./LeadTypeField";

interface LeadFormFieldsProps {
  register: UseFormRegister<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  setValue: UseFormSetValue<LeadFormInput>;
  control: Control<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
  team: string[];
  showStatus?: boolean;
  showDailyActivity?: boolean;
  showLeadStatus?: boolean;
  responsiblePersonLocked?: boolean;
  responsiblePersonName?: string;
  adminCanReassign?: boolean;
  reassignLabel?: string;
  hideLeadType?: boolean;
  hideFollowUpDate?: boolean;
  hideDailyActivity?: boolean;
  leadTypeLocked?: boolean;
}

export function LeadFormFields({
  register,
  watch,
  setValue,
  control,
  errors,
  team,
  showStatus = false,
  showDailyActivity = false,
  showLeadStatus = false,
  responsiblePersonLocked,
  responsiblePersonName,
  adminCanReassign = false,
  reassignLabel = "Reassign to *",
  hideLeadType = false,
  hideFollowUpDate = false,
  hideDailyActivity = false,
  leadTypeLocked = false,
}: LeadFormFieldsProps) {
  const leadType = watch("leadType") ?? "domestic";

  return (
    <div className="space-y-5">
      {!hideLeadType && (
        <LeadTypeField
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          locked={leadTypeLocked}
        />
      )}

      {leadType === "export" && (
        <ExportLeadFields
          register={register}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />
      )}

      {leadType === "domestic" && (
        <DomesticLeadFields
          register={register}
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />
      )}

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assignment
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label={adminCanReassign ? reassignLabel : "Responsible person *"}
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
              <>
                <select {...register("responsiblePerson")} className={inputClass}>
                  <option value="" disabled>
                    Select team member
                  </option>
                  {team.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
                {adminCanReassign && (
                  <p className="mt-1 text-xs text-slate-500">
                    Only admins can reassign this lead to another user.
                  </p>
                )}
              </>
            )}
          </FormField>
          {!hideFollowUpDate && (
            <FormField label="Follow-up date" error={errors.followUpDate?.message}>
              <input
                type="date"
                {...register("followUpDate")}
                className={inputClass}
              />
            </FormField>
          )}
          {showStatus && (
            <FormField label="Status" error={errors.status?.message}>
              <select {...register("status")} className={inputClass}>
                {LEAD_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          {showLeadStatus && (
            <FormField label="Lead status" error={errors.leadStatus?.message}>
              <select {...register("leadStatus")} className={inputClass}>
                <option value="">Select lead status</option>
                {LEAD_PROGRESS_STATUSES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          {showDailyActivity && !hideDailyActivity && (
            <DailyActivityField
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
            />
          )}
        </div>
      </div>
    </div>
  );
}
