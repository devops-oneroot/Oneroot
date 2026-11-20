import { z } from "zod";
import { optionalNumber } from "./formCommon";
import {
  contactsFromLead,
  emptyContactEntry,
  normalizeContactsForPayload,
  normalizeStringList,
  whatsappNumbersFromLead,
} from "./leadContacts";
import {
  DAILY_ACTIVITY_SELECTABLE_TYPES,
  isGingerProduct,
  skipsCurcuminPolishRequirements,
  LEAD_PROGRESS_STATUSES,
  LEAD_SOURCES,
} from "./leadOptions";
import { parseProductNamesFromLead } from "./products";
import {
  CREDIT_RATINGS,
  PRODUCT_OPTIONS,
  type CreateLeadInput,
  type Lead,
  type LeadStatus,
  type LeadType,
  type ProductName,
  normalizeLeadStatus,
} from "./types";

const VALID_PRODUCTS = PRODUCT_OPTIONS.map((p) => p.id) as [
  ProductName,
  ...ProductName[],
];
const VALID_CREDIT_RATINGS = CREDIT_RATINGS.map((r) => r.id) as [
  string,
  ...string[],
];
const VALID_LEAD_SOURCES = LEAD_SOURCES.map((s) => s.id) as [
  string,
  ...string[],
];
const VALID_DAILY_ACTIVITY_TYPES = DAILY_ACTIVITY_SELECTABLE_TYPES.map(
  (t) => t.id
) as [string, ...string[]];
const VALID_LEAD_PROGRESS_STATUSES = LEAD_PROGRESS_STATUSES.map((s) => s.id) as [
  string,
  ...string[],
];

const productNameEnum = z.enum(VALID_PRODUCTS);

const contactEntrySchema = z.object({
  name: z.string().optional(),
  phones: z.array(z.string()).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  designation: z.string().optional(),
  linkedIn: z.string().optional(),
  otherDetails: z.array(z.string()).optional(),
});

/** Export / domestic leads only — suppliers use supplierFormSchema. */
export const leadFormSchema = z
  .object({
    leadType: z.enum(["export", "domestic"]),
    company: z.string().optional(),
    contacts: z.array(contactEntrySchema).optional(),
    whatsappNumbers: z.array(z.string()).optional(),
    website: z.string().optional(),
    leadSource: z.enum([...VALID_LEAD_SOURCES, ""]).optional(),
    address: z.string().optional(),
    country: z.string().optional(),
    industryType: z
      .enum([
        "extraction",
        "masala",
        "feed",
        "ethanol",
        "starch",
        "TRADING",
        "FMCG",
        "",
      ])
      .optional(),
    creditRating: z.enum([...VALID_CREDIT_RATINGS, ""]).optional(),
    companyTurnover: optionalNumber,
    sourcingRegion: z.string().optional(),
    productNames: z.array(productNameEnum).optional(),
    productQuantity: optionalNumber,
    productPrice: optionalNumber,
    industry: z.enum(["export", "domestic"]).optional(),
    responsiblePerson: z.string().min(1, "Select a responsible person"),
    followUpDate: z.string().optional(),
    dailyActivities: z.array(z.enum(VALID_DAILY_ACTIVITY_TYPES)).optional(),
    dailyActivityNote: z.string().optional(),
    leadStatus: z.enum([...VALID_LEAD_PROGRESS_STATUSES, ""]).optional(),
    status: z.enum([
      "lead_generation",
      "contact_established",
      "requirement_understood",
      "quotation_sent",
      "closed_won",
      "closed_lost",
    ]),
    exportIndustryType: z.string().optional(),
    exportMaterialType: z.string().optional(),
    exportPolishLevel: z.string().optional(),
    minCurcumin: optionalNumber,
    moistureLevel: optionalNumber,
    minOilContent: optionalNumber,
    acceptGrade: z.string().optional(),
    preferredOrigin: z.string().optional(),
    quantityNeededKg: optionalNumber,
    incoterm: z.string().optional(),
    portDelivery: z.string().optional(),
    paymentDaysAfterSailing: optionalNumber,
    deliveryState: z.string().optional(),
    deliveryDistrict: z.string().optional(),
    maxPrice: optionalNumber,
    tradeKgPerBag: optionalNumber,
    tradePaymentDays: optionalNumber,
  })
  .superRefine((data, ctx) => {
    (data.contacts ?? []).forEach((contact, index) => {
      const trimmed = contact.email?.trim();
      if (!trimmed) return;
      const valid = z.string().email().safeParse(trimmed).success;
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email",
          path: ["contacts", index, "email"],
        });
      }
    });

    if (data.leadType === "export" || data.leadType === "domestic") {
      if (!data.company?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company name is required",
          path: ["company"],
        });
      }
      if (!data.productNames?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one product",
          path: ["productNames"],
        });
      }
    }

    if (data.leadType === "domestic") {
      const ginger = isGingerProduct(data.productNames);

      if (!data.exportIndustryType?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Industry type is required",
          path: ["exportIndustryType"],
        });
      }
      if (!data.exportMaterialType?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Material type is required",
          path: ["exportMaterialType"],
        });
      }

      if (ginger) {
        if (
          data.moistureLevel === undefined ||
          data.moistureLevel === null ||
          Number.isNaN(Number(data.moistureLevel))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Moisture level is required",
            path: ["moistureLevel"],
          });
        }
        if (
          data.minOilContent === undefined ||
          data.minOilContent === null ||
          Number.isNaN(Number(data.minOilContent))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Minimum oil content is required",
            path: ["minOilContent"],
          });
        }
      } else if (!skipsCurcuminPolishRequirements(data.productNames)) {
        if (!data.exportPolishLevel?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Polish level is required",
            path: ["exportPolishLevel"],
          });
        }
        if (
          data.minCurcumin === undefined ||
          data.minCurcumin === null ||
          Number.isNaN(Number(data.minCurcumin))
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Min curcumin % is required",
            path: ["minCurcumin"],
          });
        }
      }
    }
  });

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;

export function inferLeadType(lead: Lead): LeadType {
  if (lead.leadType === "export" || lead.leadType === "domestic") {
    return lead.leadType;
  }
  if (lead.industry === "export" || lead.exportDetails) {
    return "export";
  }
  return "domestic";
}

/** Lead form only supports export / domestic (suppliers use Suppliers tab). */
export function toFormLeadType(lead: Lead): "export" | "domestic" {
  const type = inferLeadType(lead);
  return type === "export" ? "export" : "domestic";
}

export const defaultLeadFormValues: Partial<LeadFormInput> = {
  leadType: "domestic",
  industry: "domestic",
  contacts: [emptyContactEntry()],
  whatsappNumbers: [""],
  productNames: [],
  productQuantity: 0,
  productPrice: 0,
  status: "lead_generation",
};

export function leadToFormValues(lead: Lead): LeadFormValues {
  const productNames = parseProductNamesFromLead(lead);
  const leadType = toFormLeadType(lead);
  const ed = lead.exportDetails;

  return {
    leadType,
    company: lead.company?.trim() || lead.name?.trim() || "",
    contacts: (() => {
      const list = contactsFromLead(lead);
      return list.length ? list : [emptyContactEntry()];
    })(),
    whatsappNumbers: (() => {
      const list = whatsappNumbersFromLead(lead);
      return list.length ? list : [""];
    })(),
    website: lead.website ?? "",
    leadSource: VALID_LEAD_SOURCES.includes(lead.leadSource ?? "")
      ? (lead.leadSource as (typeof VALID_LEAD_SOURCES)[number])
      : "",
    address: lead.address ?? "",
    country: lead.country ?? "",
    industryType: lead.industryType ?? "",
    creditRating: VALID_CREDIT_RATINGS.includes(lead.creditRating ?? "")
      ? (lead.creditRating as (typeof VALID_CREDIT_RATINGS)[number])
      : "",
    companyTurnover: lead.companyTurnover ?? undefined,
    sourcingRegion: lead.sourcingRegion ?? "",
    productNames: productNames.length ? productNames : [],
    productQuantity: lead.product?.quantity ?? 0,
    productPrice: lead.product?.price ?? 0,
    industry: lead.industry ?? "domestic",
    responsiblePerson: String(lead.responsiblePerson || "").trim(),
    followUpDate: toDateInputValue(lead.followUpDate),
    // Always empty: the form only ever composes a NEW activity entry. Past
    // ones are permanent and live in the history list, never back in here.
    dailyActivities: [],
    dailyActivityNote: "",
    leadStatus: VALID_LEAD_PROGRESS_STATUSES.includes(lead.leadStatus ?? "")
      ? (lead.leadStatus as (typeof VALID_LEAD_PROGRESS_STATUSES)[number])
      : "",
    status: normalizeLeadStatus(lead.status, lead.pipelineStatus),
    exportIndustryType: ed?.exportIndustryType ?? "",
    exportMaterialType: ed?.materialType ?? "",
    exportPolishLevel: ed?.polishLevel ?? "",
    minCurcumin: ed?.minCurcumin,
    moistureLevel: ed?.moistureLevel,
    minOilContent: ed?.minOilContent,
    acceptGrade: ed?.acceptGrade ?? "",
    preferredOrigin: ed?.preferredOrigin ?? "",
    quantityNeededKg: ed?.quantityNeededKg,
    incoterm: ed?.incoterm ?? "",
    portDelivery: ed?.portDelivery ?? "",
    paymentDaysAfterSailing: ed?.paymentDaysAfterSailing,
    deliveryState: ed?.deliveryState ?? "",
    deliveryDistrict: ed?.deliveryDistrict ?? "",
    maxPrice:
      ed?.maxPrice ??
      (lead.product?.price && lead.product.price > 0
        ? lead.product.price
        : undefined),
    tradeKgPerBag: ed?.kgPerBag,
    tradePaymentDays: ed?.paymentDays,
  };
}

export function formValuesToPayload(
  values: LeadFormValues
): Partial<CreateLeadInput> & {
  followUpDate?: string | null;
  status?: LeadStatus;
  contactPerson?: string;
  products?: { name: string; quantity: number; price: number }[];
} {
  const leadType = values.leadType;
  const company = values.company?.trim() ?? "";
  const contacts = normalizeContactsForPayload(values.contacts);
  const contactPersons = normalizeStringList(
    contacts.map((c) => c.name ?? "")
  );
  const emails = normalizeStringList(contacts.map((c) => c.email ?? ""));
  const contactPerson = contactPersons[0] ?? "";
  const productNames = values.productNames ?? [];
  const whatsappNumbers = normalizeStringList(values.whatsappNumbers);

  const base: Partial<CreateLeadInput> & {
    followUpDate?: string | null;
    status?: LeadStatus;
  } = {
    leadType,
    responsiblePerson: values.responsiblePerson,
    followUpDate: values.followUpDate
      ? new Date(values.followUpDate).toISOString()
      : null,
    dailyActivities: values.dailyActivities?.length
      ? values.dailyActivities
      : undefined,
    dailyActivity: values.dailyActivities?.[0] || undefined,
    dailyActivityNote: values.dailyActivityNote?.trim() || undefined,
    leadStatus: values.leadStatus || undefined,
    status: values.status,
  };

  const products = productNames.map((name) => ({
    name,
    quantity: values.productQuantity ?? 0,
    price: values.productPrice ?? 0,
  }));

  const shared = {
    ...base,
    name: company || contactPerson,
    company,
    contactPerson: contactPerson || undefined,
    contactPersons: contactPersons.length ? contactPersons : undefined,
    contacts: contacts.length ? contacts : undefined,
    designation: contacts[0]?.designation || undefined,
    phone: contacts[0]?.phone || undefined,
    whatsappNumbers: whatsappNumbers.length ? whatsappNumbers : undefined,
    whatsappNumber: whatsappNumbers[0] || undefined,
    email: emails[0] || undefined,
    emails: emails.length ? emails : undefined,
    website: values.website || undefined,
    linkedIn: contacts[0]?.linkedIn?.trim() || undefined,
    leadSource: values.leadSource || undefined,
    address: values.address?.trim() || undefined,
    country: values.country || undefined,
    industryType: values.industryType || undefined,
    creditRating: values.creditRating || undefined,
    companyTurnover: values.companyTurnover,
    sourcingRegion: values.sourcingRegion || undefined,
    products,
    product: {
      name: productNames.join(", "),
      quantity: values.productQuantity ?? 0,
      price: values.productPrice ?? 0,
    },
    industry: leadType === "export" ? "export" : values.industry,
  };

  const resolvedMaxPrice =
    values.maxPrice ??
    (values.productPrice && values.productPrice > 0
      ? values.productPrice
      : undefined);

  const exportDetails = {
    exportIndustryType: values.exportIndustryType,
    materialType: values.exportMaterialType,
    polishLevel: values.exportPolishLevel,
    minCurcumin: values.minCurcumin,
    moistureLevel: values.moistureLevel,
    minOilContent: values.minOilContent,
    acceptGrade: values.acceptGrade,
    preferredOrigin: values.preferredOrigin,
    quantityNeededKg: values.quantityNeededKg,
    kgPerBag: values.tradeKgPerBag,
    maxPrice: resolvedMaxPrice,
    paymentDays: values.tradePaymentDays,
    deliveryState: values.deliveryState,
    deliveryDistrict: values.deliveryDistrict,
    incoterm: values.incoterm,
    portDelivery: values.portDelivery,
    paymentDaysAfterSailing: values.paymentDaysAfterSailing,
  };

  if (leadType === "export") {
    return {
      ...shared,
      exportDetails: {
        ...exportDetails,
        paymentDays: undefined,
        deliveryState: undefined,
        deliveryDistrict: undefined,
      },
    };
  }

  return {
    ...shared,
    exportDetails,
  };
}

export function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export { inputClass } from "./formCommon";
