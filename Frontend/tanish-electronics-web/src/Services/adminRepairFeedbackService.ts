import { apiClient } from "./apiClient";
import type { PagedResult } from "./adminServiceRequestService";

export type AdminRepairFeedback = {
  customerRepairFeedbackId: number;

  serviceRequestId: number;
  requestNumber: string;

  customerName: string;
  phoneNumber: string;
  email?: string | null;

  serviceCategory: string;

  currentStatus: string;

  rating: number;
  comment?: string | null;

  isPublic: boolean;

  createdAt: string;
  updatedAt?: string | null;
};

export type AdminFeedbackFilters = {
  rating?: number | null;
  isPublic?: boolean | null;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
};

function buildFeedbackQuery(filters: AdminFeedbackFilters) {
  const params = new URLSearchParams();

  if (filters.rating && filters.rating > 0) {
    params.append("rating", filters.rating.toString());
  }

  if (filters.isPublic !== undefined && filters.isPublic !== null) {
    params.append("isPublic", String(filters.isPublic));
  }

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  params.append("pageNumber", String(filters.pageNumber ?? 1));
  params.append("pageSize", String(filters.pageSize ?? 10));

  return params.toString();
}

export async function getAdminRepairFeedbacks(
  filters: AdminFeedbackFilters,
  token?: string | null
) {
  const queryString = buildFeedbackQuery(filters);

  return await apiClient<PagedResult<AdminRepairFeedback>>(
    `/admin/feedbacks?${queryString}`,
    {
      authToken: token
    }
  );
}

export async function updateFeedbackPublicStatus(
  feedbackId: number,
  isPublic: boolean,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/feedbacks/${feedbackId}/public-status`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify({ isPublic })
    }
  );
}
