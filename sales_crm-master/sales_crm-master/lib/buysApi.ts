import { api } from "./api";
import type {
  BuysLeadMatchesResponse,
  BuysMatchesResponse,
} from "./buysTypes";

export async function fetchBuysMatches(options?: {
  minScore?: number;
  limit?: number;
}) {
  const { data } = await api.get<BuysMatchesResponse>("/match/matches", {
    params: {
      min_score: options?.minScore,
      limit: options?.limit,
    },
  });
  return data;
}

export async function fetchBuysLeadMatches(options?: {
  minScore?: number;
  page?: number;
  pageSize?: number;
  limit?: number;
}) {
  const { data } = await api.get<BuysLeadMatchesResponse>("/match/leads", {
    params: {
      min_score: options?.minScore,
      page: options?.page,
      page_size: options?.pageSize,
      limit: options?.limit,
    },
  });
  return data;
}
