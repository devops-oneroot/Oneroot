"use client";

import { createContext, useContext, useMemo } from "react";
import type { LeadContactEntry } from "@/lib/types";
import { contactPhones } from "@/lib/leadContacts";

interface LeadFormMode {
  /** True only while creating a lead — duplicate checks are a create-time rule. */
  isNewLead: boolean;
  /**
   * When set, phone numbers and emails already saved on the lead are shown
   * read-only: the user may add more but not change or remove what is there.
   * Admins never get this; the API enforces the same rule.
   */
  lockedContacts: {
    phones: Set<string>;
    emails: Set<string>;
    /** How many contact cards existed when the form opened. */
    savedCount: number;
  } | null;
  /**
   * WhatsApp numbers already saved on the lead — same rule as phones, but the
   * field lives on the lead itself, not per contact, so it's tracked separately.
   */
  lockedWhatsappNumbers: Set<string> | null;
}

/** Defaults to edit mode, so a form that forgets to opt in never blocks a save. */
const LeadFormModeContext = createContext<LeadFormMode>({
  isNewLead: false,
  lockedContacts: null,
  lockedWhatsappNumbers: null,
});

export function LeadFormModeProvider({
  isNewLead,
  lockSavedContacts,
  lockSavedWhatsappNumbers,
  children,
}: {
  isNewLead: boolean;
  /** The lead's contacts as saved — pass for non-admins editing a lead. */
  lockSavedContacts?: LeadContactEntry[] | null;
  /** The lead's WhatsApp numbers as saved — pass for non-admins editing a lead. */
  lockSavedWhatsappNumbers?: string[] | null;
  children: React.ReactNode;
}) {
  const value = useMemo<LeadFormMode>(() => {
    const lockedContacts = (() => {
      if (!lockSavedContacts) return null;
      const phones = new Set<string>();
      const emails = new Set<string>();
      for (const c of lockSavedContacts) {
        for (const p of contactPhones(c)) phones.add(p);
        const e = c.email?.trim().toLowerCase();
        if (e) emails.add(e);
      }
      return { phones, emails, savedCount: lockSavedContacts.length };
    })();

    const lockedWhatsappNumbers = lockSavedWhatsappNumbers?.length
      ? new Set(
          lockSavedWhatsappNumbers.map((n) => n.trim()).filter(Boolean)
        )
      : null;

    return { isNewLead, lockedContacts, lockedWhatsappNumbers };
  }, [isNewLead, lockSavedContacts, lockSavedWhatsappNumbers]);

  return (
    <LeadFormModeContext.Provider value={value}>
      {children}
    </LeadFormModeContext.Provider>
  );
}

export function useLeadFormMode(): LeadFormMode {
  return useContext(LeadFormModeContext);
}
