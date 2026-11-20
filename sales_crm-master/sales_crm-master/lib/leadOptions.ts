export type LeadType = "supplier" | "export" | "domestic";

export type CreateLeadType = "export" | "domestic";

/** Types shown on Create Lead (suppliers use the Suppliers tab). */
export const CREATE_LEAD_TYPES: { id: CreateLeadType; label: string }[] = [
  { id: "export", label: "Export" },
  { id: "domestic", label: "Domestic" },
];

export const LEAD_TYPES: { id: LeadType; label: string }[] = [
  { id: "supplier", label: "Supplier" },
  ...CREATE_LEAD_TYPES,
];

export const SUPPLIER_TYPES = [
  "Aggregator",
  "Farmer",
  "Trader",
  "Mandi Operator",
  "Processor",
  "Auction",
  "Govt",
  "NGO",
  "FPO",
] as const;

export const MATERIAL_TYPES = [
  "Fresh Bulb",
  "Fresh Finger",
  "Dry Finger",
  "Bulb Finger",
  "Kocha",
  "Panangalli",
  "Feed",
  "Cattle feed",
  "Bird feed",
  "Soya seed",
  "Jowar",
  "Maize",
] as const;

export const POLISH_LEVELS = [
  "UnPolish",
  "Farmer Polish",
  "Single Polish",
  "1 1/2 Polish",
  "Double Polish",
  "Thukdi",
  "Powder",
] as const;

export const EXPORT_INDUSTRY_TYPES = [
  "Trader",
  "Exporter",
  "Merchant Importer",
  "Curcumin Extraction",
  "Oleoresin Extraction",
  "Masala",
  "Solvent Extraction Plant",
  "Edible oil extraction plant",
  "Ethanol plant",
  "Animal feed plant",
] as const;

export const LEAD_SOURCES = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "social_media", label: "Social media" },
  { id: "custom_data", label: "Custom data" },
  { id: "self_own", label: "Self/own" },
  { id: "trade_fair", label: "Trade fair" },
] as const;

export type LeadSourceId = (typeof LEAD_SOURCES)[number]["id"];

export const ACCEPT_GRADES = [
  "Normal",
  "IPM",
  "Organic",
  "Other",
  "Export",
  "Global GAP",
] as const;

export const INCOTERMS = ["FCA", "EXW", "FAS", "FOB", "CFB", "CIP"] as const;

export const GINGER_INDUSTRY_TYPES = ["Ginger Oil", "Powder"] as const;

export const GINGER_MATERIAL_TYPES = ["Himachal", "Sunami", "Regodi"] as const;

export function isGingerProduct(productNames?: readonly string[]): boolean {
  return (productNames ?? []).includes("ginger");
}

/** Feed byproducts — polish level and min curcumin are optional. */
export const FEED_BYPRODUCT_PRODUCTS = [
  "rice_ddgs",
  "corn_ddgs",
  "dorb",
  "rsm",
] as const;

export type FeedByproductProduct =
  (typeof FEED_BYPRODUCT_PRODUCTS)[number];

export function isFeedByproductProduct(
  productNames?: readonly string[]
): boolean {
  return (productNames ?? []).some((name) =>
    (FEED_BYPRODUCT_PRODUCTS as readonly string[]).includes(name)
  );
}

/** Grains — polish level and curcumin do not apply at all. */
export const GRAIN_PRODUCTS = ["maize", "soya_seed", "jowar"] as const;

/** True when every selected product is a grain: polish / curcumin are hidden. */
export function hidesCurcuminPolishFields(
  productNames?: readonly string[]
): boolean {
  const names = productNames ?? [];
  if (!names.length) return false;
  return names.every((name) =>
    (GRAIN_PRODUCTS as readonly string[]).includes(name)
  );
}

/**
 * Skip mandatory polish / curcumin when nothing selected needs them: only
 * feed byproducts and grains, or ginger.
 */
export function skipsCurcuminPolishRequirements(
  productNames?: readonly string[]
): boolean {
  const names = productNames ?? [];
  if (!names.length) return false;
  if (isGingerProduct(names)) return true;
  return names.every(
    (name) =>
      (FEED_BYPRODUCT_PRODUCTS as readonly string[]).includes(name) ||
      (GRAIN_PRODUCTS as readonly string[]).includes(name)
  );
}

export const YES_NO = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
] as const;

/** User-selectable on lead edit — excludes auto "new lead" from outreach. */
export const DAILY_ACTIVITY_SELECTABLE_TYPES = [
  { id: "call_initiated", label: "Call initiated" },
  { id: "email", label: "Email" },
  { id: "whatsapp_text", label: "WhatsApp text/Zalo" },
  { id: "response", label: "Response" },
  { id: "meeting", label: "Meeting" },
  { id: "price_discussion", label: "Price discussion" },
  { id: "payment_discussion", label: "Payment discussion" },
  { id: "sample_discussion", label: "Sample discussion" },
  { id: "sample_sent", label: "Sample sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "sent_quotations", label: "Sent quotations" },
  { id: "email_reply", label: "Email reply" },
  { id: "follow_up_calls", label: "Follow up calls" },
] as const;

/** Outreach columns — includes auto "new lead" when lead created that day. */
export const DAILY_ACTIVITY_TYPES = [
  { id: "new_lead", label: "New lead" },
  ...DAILY_ACTIVITY_SELECTABLE_TYPES,
] as const;

export type DailyActivityTypeId = (typeof DAILY_ACTIVITY_TYPES)[number]["id"];
export type DailyActivitySelectableId =
  (typeof DAILY_ACTIVITY_SELECTABLE_TYPES)[number]["id"];

const SELECTABLE_IDS = new Set(
  DAILY_ACTIVITY_SELECTABLE_TYPES.map((item) => item.id)
);

export function leadDailyActivitiesFromLead(lead: {
  dailyActivities?: string[];
  dailyActivity?: string;
}): DailyActivitySelectableId[] {
  if (Array.isArray(lead.dailyActivities) && lead.dailyActivities.length) {
    return lead.dailyActivities.filter((id): id is DailyActivitySelectableId =>
      SELECTABLE_IDS.has(id as DailyActivitySelectableId)
    );
  }
  const single = lead.dailyActivity?.trim();
  if (single && SELECTABLE_IDS.has(single as DailyActivitySelectableId)) {
    return [single as DailyActivitySelectableId];
  }
  return [];
}

export const LEAD_PROGRESS_STATUSES = [
  { id: "interested", label: "Interested" },
  { id: "not_interested", label: "Not interested" },
  { id: "set_sample", label: "Set sample" },
  { id: "no_response", label: "No response" },
  { id: "replied", label: "Replied" },
  { id: "negotiations_going", label: "Negotiations going" },
  { id: "deal_closed", label: "Deal closed" },
  { id: "deal_dropped", label: "Deal dropped" },
  { id: "sample_sent", label: "Sample sent" },
] as const;

export type LeadProgressStatusId =
  (typeof LEAD_PROGRESS_STATUSES)[number]["id"];
