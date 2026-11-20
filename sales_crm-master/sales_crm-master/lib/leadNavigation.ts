export function leadDetailUrl(leadId: string): string {
  const params = new URLSearchParams({
    tab: "leads",
    leadId,
  });
  return `/?${params.toString()}`;
}

export function openLeadDetailInNewTab(leadId: string): void {
  window.open(leadDetailUrl(leadId), "_blank", "noopener,noreferrer");
}
