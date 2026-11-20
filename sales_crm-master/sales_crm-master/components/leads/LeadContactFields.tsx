"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import { LEAD_SOURCES } from "@/lib/leadOptions";
import { FormField } from "./FormField";

interface LeadContactFieldsProps {
  register: UseFormRegister<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
}

export function LeadContactFields({ register, errors }: LeadContactFieldsProps) {
  return (
    <>
      <FormField label="Lead source" error={errors.leadSource?.message}>
        <select {...register("leadSource")} className={inputClass}>
          <option value="">Select lead source</option>
          {LEAD_SOURCES.map((source) => (
            <option key={source.id} value={source.id}>
              {source.label}
            </option>
          ))}
        </select>
      </FormField>
      <div className="sm:col-span-2">
        <FormField label="Address" error={errors.address?.message}>
          <textarea
            rows={2}
            {...register("address")}
            className={inputClass}
          />
        </FormField>
      </div>
    </>
  );
}
