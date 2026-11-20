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
import { CREDIT_RATINGS } from "@/lib/types";
import { CompanyNameField } from "./CompanyNameField";
import { ProductMultiSelect } from "./ProductMultiSelect";
import { FormField } from "./FormField";
import { LeadContactFields } from "./LeadContactFields";
import { LeadContactsField } from "./LeadContactsField";
import { TradeRequirementFields } from "./TradeRequirementFields";

interface DomesticLeadFieldsProps {
  register: UseFormRegister<LeadFormInput>;
  control: Control<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  setValue: UseFormSetValue<LeadFormInput>;
}

export function DomesticLeadFields({
  register,
  control,
  errors,
  watch,
  setValue,
}: DomesticLeadFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Customer details
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <CompanyNameField
            register={register}
            watch={watch}
            error={errors.company?.message}
          />
          <LeadContactsField
            control={control}
            register={register}
            errors={errors}
          />
          <FormField label="Website" error={errors.website?.message}>
            <input {...register("website")} className={inputClass} />
          </FormField>
          <LeadContactFields register={register} errors={errors} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Company profile
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Credit rating" error={errors.creditRating?.message}>
            <select {...register("creditRating")} className={inputClass}>
              <option value="">Select credit rating</option>
              {CREDIT_RATINGS.map((rating) => (
                <option key={rating.id} value={rating.id}>
                  {rating.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Company turnover"
            error={errors.companyTurnover?.message}
          >
            <div className="flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
              <input
                type="number"
                min={0}
                step="0.01"
                {...register("companyTurnover", { valueAsNumber: true })}
                className="min-w-0 flex-1 border-0 px-3 py-2 text-sm outline-none"
              />
              <span className="flex items-center border-l border-slate-300 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                cr
              </span>
            </div>
          </FormField>
          <FormField
            label="Sourcing region"
            error={errors.sourcingRegion?.message}
          >
            <input {...register("sourcingRegion")} className={inputClass} />
          </FormField>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Product
        </h3>
        <FormField label="Products *" error={errors.productNames?.message}>
          <ProductMultiSelect control={control} errors={errors} />
        </FormField>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FormField label="Quantity" error={errors.productQuantity?.message}>
            <input
              type="number"
              min={0}
              {...register("productQuantity", { valueAsNumber: true })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Price ($)" error={errors.productPrice?.message}>
            <input
              type="number"
              min={0}
              step="0.01"
              {...register("productPrice", { valueAsNumber: true })}
              className={inputClass}
            />
          </FormField>
        </div>
      </div>

      <TradeRequirementFields
        variant="domestic"
        title="Domestic market requirements"
        register={register}
        watch={watch}
        setValue={setValue}
        errors={errors}
      />
    </div>
  );
}
