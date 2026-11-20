const BUSINESS_TZ = "Asia/Kolkata";

export function todayBusinessDate(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ }).format(
    new Date()
  );
}
