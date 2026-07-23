import { apiClient } from "./apiClient";
import type { PagedResult } from "./adminServiceRequestService";

export type AdminTopPage = {
  path: string;
  visitCount: number;
};

export type AdminDailyVisit = {
  date: string;
  visitCount: number;
};

export type AdminRecentVisit = {
  websiteVisitId: number;
  visitorId?: string | null;
  appUserId?: number | null;
  path: string;

  // Backend DTO currently uses Refferer spelling.
  refferer?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export type AdminAnalyticsSummary = {
  totalVisits: number;
  todayVisits: number;
  last7DaysVisits: number;
  uniqueVisitors: number;
  topPages: AdminTopPage[];
  dailyVisits: AdminDailyVisit[];

  // Keep this for dashboard preview only.
  recentVisits: AdminRecentVisit[];
};

export type AdminWebsiteVisitFilters = {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

function buildWebsiteVisitQuery(filters: AdminWebsiteVisitFilters) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  params.append("pageNumber", String(filters.pageNumber ?? 1));
  params.append("pageSize", String(filters.pageSize ?? 10));

  return params.toString();
}

export async function getAdminAnalyticsSummary(token?: string | null) {
  return await apiClient<AdminAnalyticsSummary>("/admin/analytics/summary", {
    authToken: token
  });
}

export async function getAdminWebsiteVisits(
  filters: AdminWebsiteVisitFilters,
  token?: string | null
) {
  const queryString = buildWebsiteVisitQuery(filters);

  return await apiClient<PagedResult<AdminRecentVisit>>(
    `/admin/analytics/website-visits?${queryString}`,
    {
      authToken: token
    }
  );
}
