export interface LeadDuplicateMatch {
  _id: string;
  company: string;
  name: string;
  responsiblePerson: string;
  createdBy?: string;
  createdByName: string;
  createdAt: string;
  /** Which field collided. */
  matchedOn?: "company" | "phone" | "both";
  matchedPhone?: string;
}

export function duplicateMatchTitle(match: LeadDuplicateMatch): string {
  return match.company?.trim() || match.name?.trim() || "—";
}

/** Digits only, last 10 — so +91 / 0 prefixes compare equal. */
export function phoneKey(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 6) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function duplicateReason(match: LeadDuplicateMatch): string {
  if (match.matchedOn === "phone") return "same phone number";
  if (match.matchedOn === "both") return "same name and phone number";
  return "same company name";
}
