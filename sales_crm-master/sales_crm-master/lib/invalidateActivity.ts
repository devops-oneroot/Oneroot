import type { QueryClient } from "@tanstack/react-query";

/** Keep leads list and My Days saved reports in sync after CRM activity. */
export function invalidateLeadActivity(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["leads"] });
  queryClient.invalidateQueries({ queryKey: ["saved-days"] });
  queryClient.invalidateQueries({ queryKey: ["saved-day"] });
  queryClient.invalidateQueries({ queryKey: ["daily-activity"] });
  queryClient.invalidateQueries({ queryKey: ["outreach-table"] });
  queryClient.invalidateQueries({ queryKey: ["lead-activity-log"] });
}
