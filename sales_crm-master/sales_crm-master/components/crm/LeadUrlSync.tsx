"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { fetchLead } from "@/lib/api";
import type { CrmTab } from "@/components/crm/CrmShell";
import type { Lead } from "@/lib/types";

interface LeadUrlSyncProps {
  leads: Lead[];
  onOpenLead: (lead: Lead, tab: CrmTab) => void;
}

export function LeadUrlSync({ leads, onOpenLead }: LeadUrlSyncProps) {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const tabParam = searchParams.get("tab");
  const openedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!leadId || tabParam !== "leads") return;
    if (openedRef.current === leadId) return;

    const cached = leads.find((l) => l._id === leadId);
    if (cached) {
      openedRef.current = leadId;
      onOpenLead(cached, "leads");
      return;
    }

    let cancelled = false;
    fetchLead(leadId)
      .then((lead) => {
        if (cancelled) return;
        openedRef.current = leadId;
        onOpenLead(lead, "leads");
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not open lead");
      });

    return () => {
      cancelled = true;
    };
  }, [leadId, tabParam, leads, onOpenLead]);

  return null;
}
