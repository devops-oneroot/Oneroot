import { z } from "zod";
import { optionalNumber } from "./formCommon";
import type { CreateImporterInput, Importer, LeadStatus } from "./types";
import {
  ACCEPT_GRADES,
  INCOTERMS,
  MATERIAL_TYPES,
  POLISH_LEVELS,
} from "./leadOptions";

export const IMPORTER_TYPES = [
  "Direct Importer",
  "Wholesale Distributor",
  "Extraction & Processing Plant",
  "Spice Brand / Packager",
  "Trading Company",
  "Supermarket Chain / Retailer",
  "Food Manufacturer / Masala Co",
] as const;

export const importerFormSchema = z.object({
  importerName: z.string().min(1, "Importer name is required"),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  importerNumber: z.string().min(1, "Contact / Phone number is required"),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),
  website: z.string().optional(),
  country: z.string().optional(),
  taxIdOrIec: z.string().optional(),
  importerType: z.string().optional(),
  products: z.array(z.string()).optional(),
  materialType: z.string().optional(),
  polishLevel: z.string().optional(),
  curcuminPercent: optionalNumber,
  grade: z.string().optional(),
  price: optionalNumber,
  quantityKg: optionalNumber,
  incoterm: z.string().optional(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  paymentTerms: z.string().optional(),
  paymentDays: optionalNumber,
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  remarks: z.string().optional(),
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

export type ImporterFormInput = z.input<typeof importerFormSchema>;
export type ImporterFormValues = z.output<typeof importerFormSchema>;

export const defaultImporterFormValues: Partial<ImporterFormInput> = {
  country: "United States",
  status: "lead_generation",
  products: ["turmeric"],
};

export function importerToFormValues(importer: Importer): ImporterFormValues {
  return {
    importerName: importer.importerName ?? "",
    companyName: importer.companyName ?? "",
    contactPerson: importer.contactPerson ?? "",
    importerNumber: importer.importerNumber ?? "",
    email: importer.email ?? "",
    website: importer.website ?? "",
    country: importer.country ?? "United States",
    taxIdOrIec: importer.taxIdOrIec ?? "",
    importerType: importer.importerType ?? "",
    products: importer.products ?? [],
    materialType: importer.materialType ?? "",
    polishLevel: importer.polishLevel ?? "",
    curcuminPercent: importer.curcuminPercent,
    grade: importer.grade ?? "",
    price: importer.price,
    quantityKg: importer.quantityKg,
    incoterm: importer.incoterm ?? "",
    portOfLoading: importer.portOfLoading ?? "",
    portOfDischarge: importer.portOfDischarge ?? "",
    paymentTerms: importer.paymentTerms ?? "",
    paymentDays: importer.paymentDays,
    state: importer.state ?? "",
    city: importer.city ?? "",
    address: importer.address ?? "",
    remarks: importer.remarks ?? "",
    responsiblePerson: importer.responsiblePerson ?? "",
    followUpDate: importer.followUpDate
      ? new Date(importer.followUpDate).toISOString().slice(0, 10)
      : "",
    status: importer.status,
  };
}

export function importerFormToPayload(
  values: ImporterFormValues
): CreateImporterInput {
  return {
    importerName: values.importerName.trim(),
    companyName: values.companyName?.trim() || values.importerName.trim(),
    contactPerson: values.contactPerson?.trim(),
    importerNumber: values.importerNumber.trim(),
    email: values.email?.trim() || undefined,
    website: values.website?.trim() || undefined,
    country: values.country?.trim() || "United States",
    taxIdOrIec: values.taxIdOrIec?.trim() || undefined,
    importerType: values.importerType || undefined,
    products: values.products || [],
    materialType: values.materialType || undefined,
    polishLevel: values.polishLevel || undefined,
    curcuminPercent: values.curcuminPercent,
    grade: values.grade || undefined,
    price: values.price,
    quantityKg: values.quantityKg,
    incoterm: values.incoterm || undefined,
    portOfLoading: values.portOfLoading?.trim() || undefined,
    portOfDischarge: values.portOfDischarge?.trim() || undefined,
    paymentTerms: values.paymentTerms?.trim() || undefined,
    paymentDays: values.paymentDays,
    state: values.state?.trim() || undefined,
    city: values.city?.trim() || undefined,
    address: values.address?.trim() || undefined,
    remarks: values.remarks?.trim() || undefined,
    responsiblePerson: values.responsiblePerson,
    followUpDate: values.followUpDate
      ? new Date(values.followUpDate).toISOString()
      : null,
    status: values.status as LeadStatus | undefined,
  };
}

export { inputClass, selectClass } from "./formCommon";

