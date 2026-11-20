"use client";

import { useEffect } from "react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { LeadFormInput } from "@/lib/leadForm";
import { inputClass } from "@/lib/leadForm";
import {
  ACCEPT_GRADES,
  EXPORT_INDUSTRY_TYPES,
  GINGER_INDUSTRY_TYPES,
  GINGER_MATERIAL_TYPES,
  INCOTERMS,
  isGingerProduct,
  hidesCurcuminPolishFields,
  skipsCurcuminPolishRequirements,
  MATERIAL_TYPES,
  POLISH_LEVELS,
} from "@/lib/leadOptions";
import { CREDIT_RATINGS, INDUSTRY_TYPES } from "@/lib/types";
import { CompanyNameField } from "./CompanyNameField";
import { CountrySelect } from "./CountrySelect";
import { ProductMultiSelect } from "./ProductMultiSelect";
import { FormField } from "./FormField";
import { LeadContactFields } from "./LeadContactFields";
import { LeadContactsField } from "./LeadContactsField";

interface ExportLeadFieldsProps {
  register: UseFormRegister<LeadFormInput>;
  control: Control<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  setValue: UseFormSetValue<LeadFormInput>;
}

export function ExportLeadFields({
  register,
  control,
  errors,
  watch,
  setValue,
}: ExportLeadFieldsProps) {
  const productNames = watch("productNames");
  const isGinger = isGingerProduct(productNames);
  const optionalCurcuminPolish =
    skipsCurcuminPolishRequirements(productNames);
  const hideCurcuminPolish = hidesCurcuminPolishFields(productNames);
  const industryTypes = isGinger
    ? GINGER_INDUSTRY_TYPES
    : EXPORT_INDUSTRY_TYPES;
  const materialTypes = isGinger ? GINGER_MATERIAL_TYPES : MATERIAL_TYPES;
  const exportIndustryType = watch("exportIndustryType") ?? "";
  const exportMaterialType = watch("exportMaterialType") ?? "";

  useEffect(() => {
    if (
      exportIndustryType &&
      !industryTypes.includes(exportIndustryType as never)
    ) {
      setValue("exportIndustryType", "", { shouldDirty: true });
    }
    if (
      exportMaterialType &&
      !materialTypes.includes(exportMaterialType as never)
    ) {
      setValue("exportMaterialType", "", { shouldDirty: true });
    }
    if (isGinger || optionalCurcuminPolish) {
      setValue("exportPolishLevel", "", { shouldDirty: true });
      setValue("minCurcumin", undefined, { shouldDirty: true });
    } else {
      setValue("moistureLevel", undefined, { shouldDirty: true });
      setValue("minOilContent", undefined, { shouldDirty: true });
    }
  }, [
    isGinger,
    optionalCurcuminPolish,
    industryTypes,
    materialTypes,
    exportIndustryType,
    exportMaterialType,
    setValue,
  ]);

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
          <FormField label="Country" error={errors.country?.message}>
            <CountrySelect register={register} watch={watch} />
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
          <FormField label="Legacy industry type" error={errors.industryType?.message}>
            <select {...register("industryType")} className={inputClass}>
              <option value="">Optional</option>
              {INDUSTRY_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
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

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Export requirements
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Industry type"
            error={errors.exportIndustryType?.message}
          >
            <select {...register("exportIndustryType")} className={inputClass}>
              <option value="">Select industry type</option>
              {industryTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Material type"
            error={errors.exportMaterialType?.message}
          >
            <select {...register("exportMaterialType")} className={inputClass}>
              <option value="">Select material</option>
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>
          {isGinger ? (
            <>
              <FormField
                label="Moisture level %"
                error={errors.moistureLevel?.message}
              >
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("moistureLevel", { valueAsNumber: true })}
                  className={inputClass}
                />
              </FormField>
              <FormField
                label="Minimum oil content %"
                error={errors.minOilContent?.message}
              >
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("minOilContent", { valueAsNumber: true })}
                  className={inputClass}
                />
              </FormField>
            </>
          ) : hideCurcuminPolish ? null : (
            <>
              <FormField
                label="Polish level"
                error={errors.exportPolishLevel?.message}
              >
                <select {...register("exportPolishLevel")} className={inputClass}>
                  <option value="">Select polish</option>
                  {POLISH_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="Min curcumin %"
                error={errors.minCurcumin?.message}
              >
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("minCurcumin", { valueAsNumber: true })}
                  className={inputClass}
                />
              </FormField>
            </>
          )}
          <FormField
            label="Cultivation methods"
            error={errors.acceptGrade?.message}
          >
            <select {...register("acceptGrade")} className={inputClass}>
              <option value="">Select cultivation method</option>
              {ACCEPT_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Preferred origin"
            error={errors.preferredOrigin?.message}
          >
            <input {...register("preferredOrigin")} className={inputClass} />
          </FormField>
          <FormField
            label="Quantity needed (kg)"
            error={errors.quantityNeededKg?.message}
          >
            <input
              type="number"
              min={0}
              {...register("quantityNeededKg", { valueAsNumber: true })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Max price (₹)" error={errors.maxPrice?.message}>
            <input
              type="number"
              min={0}
              step="0.01"
              {...register("maxPrice", { valueAsNumber: true })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Incoterm" error={errors.incoterm?.message}>
            <select {...register("incoterm")} className={inputClass}>
              <option value="">Select incoterm</option>
              {INCOTERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Port delivery"
            error={errors.portDelivery?.message}
          >
            <input {...register("portDelivery")} className={inputClass} />
          </FormField>
          <FormField
            label="Payment days after sailing from port of loading"
            error={errors.paymentDaysAfterSailing?.message}
          >
            <input
              type="number"
              min={0}
              {...register("paymentDaysAfterSailing", { valueAsNumber: true })}
              className={inputClass}
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
