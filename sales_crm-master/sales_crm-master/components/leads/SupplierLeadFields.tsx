"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { inputClass } from "@/lib/supplierForm";
import type { SupplierFormInput } from "@/lib/supplierForm";
import {
  MATERIAL_TYPES,
  POLISH_LEVELS,
  SUPPLIER_TYPES,
  YES_NO,
} from "@/lib/leadOptions";
import { LeadStateDistrictSelect } from "./LeadStateDistrictSelect";
import { FormField } from "./FormField";

interface SupplierLeadFieldsProps {
  register: UseFormRegister<SupplierFormInput>;
  watch: UseFormWatch<SupplierFormInput>;
  setValue: UseFormSetValue<SupplierFormInput>;
  errors: FieldErrors<SupplierFormInput>;
}

export function SupplierLeadFields({
  register,
  watch,
  setValue,
  errors,
}: SupplierLeadFieldsProps) {
  const region = watch("region") ?? "";
  const variety = watch("variety") ?? "";
  const loadingState = watch("loadingState") ?? "";
  const loadingDistrict = watch("loadingDistrict") ?? "";

  return (
    <div className="space-y-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Supplier details
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Supplier name *" error={errors.supplierName?.message}>
          <input {...register("supplierName")} className={inputClass} />
        </FormField>
        <FormField label="Supplier number *" error={errors.supplierNumber?.message}>
          <input
            {...register("supplierNumber")}
            className={inputClass}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Phone or reference number"
          />
        </FormField>
        <FormField label="Supplier type *" error={errors.supplierType?.message}>
          <select {...register("supplierType")} className={inputClass}>
            <option value="">Select type</option>
            {SUPPLIER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Material type *" error={errors.materialType?.message}>
          <select {...register("materialType")} className={inputClass}>
            <option value="">Select material</option>
            {MATERIAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Polish level *" error={errors.polishLevel?.message}>
          <select {...register("polishLevel")} className={inputClass}>
            <option value="">Select polish</option>
            {POLISH_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </FormField>
        <LeadStateDistrictSelect
          stateLabel="Region (state) *"
          districtLabel="Variety (district) *"
          stateValue={region}
          districtValue={variety}
          onStateChange={(value) => setValue("region", value, { shouldDirty: true })}
          onDistrictChange={(value) =>
            setValue("variety", value, { shouldDirty: true })
          }
          stateError={errors.region?.message}
          districtError={errors.variety?.message}
        />
        <FormField label="Curcumin % *" error={errors.curcuminPercent?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register("curcuminPercent", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Grade" error={errors.grade?.message}>
          <input {...register("grade")} className={inputClass} />
        </FormField>
        <FormField label="Price *" error={errors.supplierPrice?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register("supplierPrice", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Quantity (kg)" error={errors.quantityKg?.message}>
          <input
            type="number"
            min={0}
            {...register("quantityKg", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField
          label="Free kgs per quantity"
          error={errors.freeKgsPerQuantity?.message}
        >
          <input
            type="number"
            min={0}
            {...register("freeKgsPerQuantity", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Kg per bag" error={errors.kgPerBag?.message}>
          <input
            type="number"
            min={0}
            {...register("kgPerBag", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="Each bag cost" error={errors.eachBagCost?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register("eachBagCost", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <LeadStateDistrictSelect
          stateLabel="Loading location (state)"
          districtLabel="Loading location (district)"
          stateValue={loadingState}
          districtValue={loadingDistrict}
          onStateChange={(value) =>
            setValue("loadingState", value, { shouldDirty: true })
          }
          onDistrictChange={(value) =>
            setValue("loadingDistrict", value, { shouldDirty: true })
          }
          stateError={errors.loadingState?.message}
          districtError={errors.loadingDistrict?.message}
        />
        <FormField label="Payment days" error={errors.paymentDays?.message}>
          <input
            type="number"
            min={0}
            {...register("paymentDays", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
        <FormField label="APMC" error={errors.apmc?.message}>
          <select {...register("apmc")} className={inputClass}>
            <option value="">Select</option>
            {YES_NO.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Labour and other expenses"
          error={errors.labourAndOtherExpenses?.message}
        >
          <input
            type="number"
            min={0}
            step="0.01"
            {...register("labourAndOtherExpenses", { valueAsNumber: true })}
            className={inputClass}
          />
        </FormField>
      </div>
    </div>
  );
}
