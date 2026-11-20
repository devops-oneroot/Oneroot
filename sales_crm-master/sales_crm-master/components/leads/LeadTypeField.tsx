"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import { CREATE_LEAD_TYPES } from "@/lib/leadOptions";
import { FormField } from "./FormField";

interface LeadTypeFieldProps {
  register: UseFormRegister<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  setValue: UseFormSetValue<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
  className?: string;
  locked?: boolean;
}

export function LeadTypeField({
  register,
  watch,
  setValue,
  errors,
  className,
  locked = false,
}: LeadTypeFieldProps) {
  return (
    <FormField label="Type *" error={errors.leadType?.message} className={className}>
      {locked ? (
        <>
          <input type="hidden" {...register("leadType")} />
          <input
            type="text"
            readOnly
            value="Export"
            className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-700`}
          />
        </>
      ) : (
      <select
        {...register("leadType")}
        className={inputClass}
        onChange={(e) => {
          const value = e.target.value as LeadFormInput["leadType"];
          register("leadType").onChange(e);
          if (value === "export") {
            setValue("industry", "export");
          } else if (value === "domestic") {
            setValue("industry", "domestic");
          }
          if (Number.isNaN(watch("productQuantity"))) {
            setValue("productQuantity", 0);
          }
          if (Number.isNaN(watch("productPrice"))) {
            setValue("productPrice", 0);
          }
        }}
      >
        {CREATE_LEAD_TYPES.map((type) => (
          <option key={type.id} value={type.id}>
            {type.label}
          </option>
        ))}
      </select>
      )}
    </FormField>
  );
}
