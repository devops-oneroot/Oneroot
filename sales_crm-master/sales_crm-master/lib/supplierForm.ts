import { z } from "zod";
import {
  optionalNumber,
  requiredNonNegativeNumber,
  requiredPositiveNumber,
} from "./formCommon";
import type { CreateSupplierInput, Supplier, LeadStatus } from "./types";

/** Suppliers tab only — not used for export/domestic leads. */
export const supplierFormSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierNumber: z.string().min(1, "Supplier number is required"),
  supplierType: z.string().min(1, "Supplier type is required"),
  materialType: z.string().min(1, "Material type is required"),
  polishLevel: z.string().min(1, "Polish level is required"),
  region: z.string().min(1, "Region is required"),
  variety: z.string().min(1, "Variety is required"),
  curcuminPercent: requiredNonNegativeNumber("Curcumin %"),
  grade: z.string().optional(),
  supplierPrice: requiredPositiveNumber("Price"),
  quantityKg: optionalNumber,
  freeKgsPerQuantity: optionalNumber,
  kgPerBag: optionalNumber,
  eachBagCost: optionalNumber,
  loadingState: z.string().optional(),
  loadingDistrict: z.string().optional(),
  paymentDays: optionalNumber,
  apmc: z.enum(["yes", "no", ""]).optional(),
  labourAndOtherExpenses: optionalNumber,
  responsiblePerson: z.string().min(1, "Select a responsible person"),
  followUpDate: z.string().optional(),
  status: z
    .enum([
      "lead_generation",
      "contact_established",
      "requirement_understood",
      "quotation_sent",
      "closed_won",
      "closed_lost",
    ])
    .optional(),
});

export type SupplierFormInput = z.input<typeof supplierFormSchema>;
export type SupplierFormValues = z.output<typeof supplierFormSchema>;

export const defaultSupplierFormValues: Partial<SupplierFormInput> = {
  supplierNumber: "",
  apmc: "",
  status: "lead_generation",
};

export function supplierToFormValues(supplier: Supplier): SupplierFormValues {
  const sd = supplier.supplierDetails;
  return {
    supplierName: sd?.supplierName ?? supplier.name ?? "",
    supplierNumber: sd?.supplierNumber ?? "",
    supplierType: sd?.supplierType ?? "",
    materialType: sd?.materialType ?? "",
    polishLevel: sd?.polishLevel ?? "",
    region: sd?.region ?? "",
    variety: sd?.variety ?? "",
    curcuminPercent: sd?.curcuminPercent ?? 0,
    grade: sd?.grade ?? "",
    supplierPrice: sd?.price ?? 0,
    quantityKg: sd?.quantityKg,
    freeKgsPerQuantity: sd?.freeKgsPerQuantity,
    kgPerBag: sd?.kgPerBag,
    eachBagCost: sd?.eachBagCost,
    loadingState: sd?.loadingState ?? "",
    loadingDistrict: sd?.loadingDistrict ?? "",
    paymentDays: sd?.paymentDays,
    apmc: sd?.apmc ?? "",
    labourAndOtherExpenses: sd?.labourAndOtherExpenses,
    responsiblePerson: supplier.responsiblePerson ?? "",
    followUpDate: supplier.followUpDate
      ? new Date(supplier.followUpDate).toISOString().slice(0, 10)
      : "",
    status: supplier.status,
  };
}

export function supplierFormToPayload(
  values: SupplierFormValues
): CreateSupplierInput {
  const supplierName = values.supplierName.trim();
  return {
    responsiblePerson: values.responsiblePerson,
    followUpDate: values.followUpDate
      ? new Date(values.followUpDate).toISOString()
      : null,
    status: values.status as LeadStatus | undefined,
    supplierDetails: {
      supplierName,
      supplierNumber: values.supplierNumber.trim(),
      supplierType: values.supplierType,
      materialType: values.materialType,
      polishLevel: values.polishLevel,
      region: values.region,
      variety: values.variety,
      curcuminPercent: values.curcuminPercent,
      grade: values.grade,
      price: values.supplierPrice,
      quantityKg: values.quantityKg,
      freeKgsPerQuantity: values.freeKgsPerQuantity,
      kgPerBag: values.kgPerBag,
      eachBagCost: values.eachBagCost,
      loadingState: values.loadingState,
      loadingDistrict: values.loadingDistrict,
      paymentDays: values.paymentDays,
      apmc: values.apmc || undefined,
      labourAndOtherExpenses: values.labourAndOtherExpenses,
    },
  };
}

export { inputClass } from "./formCommon";
