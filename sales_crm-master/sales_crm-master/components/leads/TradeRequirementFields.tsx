"use client";

import { useEffect } from "react";
import type {
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
import { FormField } from "./FormField";
import { LeadStateDistrictSelect } from "./LeadStateDistrictSelect";

interface TradeRequirementFieldsProps {
  variant: "export" | "domestic";
  title: string;
  register: UseFormRegister<LeadFormInput>;
  watch: UseFormWatch<LeadFormInput>;
  setValue: UseFormSetValue<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
}

export function TradeRequirementFields({
  variant,
  title,
  register,
  watch,
  setValue,
  errors,
}: TradeRequirementFieldsProps) {
  const deliveryState = watch("deliveryState") ?? "";
  const deliveryDistrict = watch("deliveryDistrict") ?? "";
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
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          label="Industry type *"
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
          label="Material type *"
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
              label="Moisture level % *"
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
              label="Minimum oil content % *"
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
              label={
                optionalCurcuminPolish
                  ? "Polish level"
                  : "Polish level *"
              }
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
              label={
                optionalCurcuminPolish
                  ? "Min curcumin %"
                  : "Min curcumin % *"
              }
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
        <FormField label="Kg per bag" error={errors.tradeKgPerBag?.message}>
          <input
            type="number"
            min={0}
            {...register("tradeKgPerBag", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Price" error={errors.maxPrice?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register("maxPrice", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField
          label="Payment days"
          error={
            variant === "domestic"
              ? errors.tradePaymentDays?.message
              : errors.paymentDaysAfterSailing?.message
          }
        >
          {variant === "domestic" ? (
            <input
              type="number"
              min={0}
              {...register("tradePaymentDays", { valueAsNumber: true })}
              className={inputClass}
            />
          ) : (
            <input
              type="number"
              min={0}
              {...register("paymentDaysAfterSailing", { valueAsNumber: true })}
              className={inputClass}
            />
          )}
        </FormField>

        {variant === "domestic" ? (
          <LeadStateDistrictSelect
            stateLabel="Delivery location (state)"
            districtLabel="Delivery location (district)"
            stateValue={deliveryState}
            districtValue={deliveryDistrict}
            onStateChange={(value) =>
              setValue("deliveryState", value, { shouldDirty: true })
            }
            onDistrictChange={(value) =>
              setValue("deliveryDistrict", value, { shouldDirty: true })
            }
            stateError={errors.deliveryState?.message}
            districtError={errors.deliveryDistrict?.message}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
