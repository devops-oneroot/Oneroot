import type { Lead, LeadContactEntry } from "./types";

export function normalizeStringList(items?: string[]): string[] {
  return (items ?? []).map((s) => s.trim()).filter(Boolean);
}

export function emptyContactEntry(): LeadContactEntry {
  return {
    name: "",
    phones: [""],
    phone: "",
    email: "",
    designation: "",
    linkedIn: "",
    otherDetails: [],
  };
}

/** All numbers for one person, oldest field shape included, de-duplicated. */
export function contactPhones(contact: LeadContactEntry): string[] {
  const all = [...(contact.phones ?? []), contact.phone ?? ""];
  return [...new Set(normalizeStringList(all))];
}

/** For read-only display: "98765 43210, 91234 56789". */
export function contactPhonesDisplay(contact: LeadContactEntry): string {
  return contactPhones(contact).join(", ");
}

export function contactsFromLead(lead: Lead): LeadContactEntry[] {
  if (lead.contacts?.length) {
    const legacyLinkedIn = lead.linkedIn?.trim() || "";
    return lead.contacts.map((c, i) => {
      const phones = contactPhones(c);
      return {
      name: c.name?.trim() || "",
      phones: phones.length ? phones : [""],
      phone: phones[0] || "",
      email: c.email?.trim() || "",
      designation: c.designation?.trim() || "",
      linkedIn:
        c.linkedIn?.trim() || (i === 0 ? legacyLinkedIn : ""),
      otherDetails: normalizeStringList(c.otherDetails),
      };
    });
  }

  const names = contactPersonsFromLead(lead);
  const emails = emailsFromLead(lead);
  const count = Math.max(names.length, emails.length, 1);
  const legacyPhone = lead.phone?.trim() || "";

  return Array.from({ length: count }, (_, i) => ({
    name: names[i] || "",
    phones: i === 0 && legacyPhone ? [legacyPhone] : [""],
    phone: i === 0 ? legacyPhone : "",
    email: emails[i] || "",
    designation: i === 0 ? lead.designation?.trim() || "" : "",
    linkedIn: i === 0 ? lead.linkedIn?.trim() || "" : "",
    otherDetails: [],
  }));
}

export function contactPersonsFromLead(lead: Lead): string[] {
  const fromContacts = normalizeStringList(
    (lead.contacts ?? []).map((c) => c.name ?? "")
  );
  if (fromContacts.length) return fromContacts;

  if (lead.contactPersons?.length) {
    return normalizeStringList(lead.contactPersons);
  }
  if (lead.contactPerson?.trim()) {
    return [lead.contactPerson.trim()];
  }
  return [];
}

export function emailsFromLead(lead: Lead): string[] {
  const fromContacts = normalizeStringList(
    (lead.contacts ?? []).map((c) => c.email ?? "")
  );
  if (fromContacts.length) return fromContacts;

  if (lead.emails?.length) {
    return normalizeStringList(lead.emails);
  }
  if (lead.email?.trim()) {
    return [lead.email.trim()];
  }
  return [];
}

/** All WhatsApp numbers on the lead, oldest field shape included, de-duplicated. */
export function whatsappNumbersFromLead(lead: Lead): string[] {
  const all = [...(lead.whatsappNumbers ?? []), lead.whatsappNumber ?? ""];
  return [...new Set(normalizeStringList(all))];
}

export function contactPersonsDisplay(lead: Lead): string {
  const list = contactPersonsFromLead(lead);
  return list.length ? list.join(", ") : "";
}

export function emailsDisplay(lead: Lead): string {
  const list = emailsFromLead(lead);
  return list.length ? list.join(", ") : "";
}

export function normalizeContactsForPayload(
  contacts?: LeadContactEntry[]
): LeadContactEntry[] {
  return (contacts ?? [])
    .map((c) => {
      const phones = contactPhones(c);
      return {
        name: c.name?.trim() || "",
        phones,
        // Mirrors phones[0] so anything reading a single phone still works.
        phone: phones[0] || "",
        email: c.email?.trim() || "",
        designation: c.designation?.trim() || "",
        linkedIn: c.linkedIn?.trim() || "",
        otherDetails: normalizeStringList(c.otherDetails),
      };
    })
    .filter(
      (c) =>
        c.name ||
        c.phone ||
        c.email ||
        c.designation ||
        c.linkedIn ||
        c.otherDetails.length > 0
    );
}
