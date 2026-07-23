import { apiClient } from "./apiClient";
import type { LookUpItem } from "./serviceRequestService";

export type AdminEnquiryListItem = {
  enquiryId: number;

  fullName: string;
  phoneNumber: string;
  email?: string;

  productName?: string;
  subject?: string;
  message: string;

  statusId: number;
  status: string;

  createdAt: string;
};

export type PagedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export async function getAdminEnquiries(
  params: {
    statusId?: number | null;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  },
  token?: string
) {
  const query = new URLSearchParams();

  if (params.statusId && params.statusId > 0) {
    query.append("statusId", String(params.statusId));
  }

  if (params.search?.trim()) {
    query.append("search", params.search.trim());
  }

  query.append("pageNumber", String(params.pageNumber ?? 1));
  query.append("pageSize", String(params.pageSize ?? 10));

  return await apiClient<PagedResult<AdminEnquiryListItem>>(
    `/admin/enquiries?${query.toString()}`,
    {
      authToken: token
    }
  );
}

export async function getEnquiryStatuses() {
  return await apiClient<LookUpItem[]>("/Lookups/enquiry-statuses");
}
export async function updateAdminEnquiryStatus(
  enquiryId: number,
  newStatusId: number,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/enquiries/${enquiryId}/status`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify({ newStatusId })
    }
  );
}
export type AdminEnquiryDetails = {
  enquiryId: number;

  productId?: number | null;
  productName?: string | null;
  productPrice?: number | null;

  fullName: string;
  phoneNumber: string;
  email?: string | null;

  subject?: string | null;
  message: string;

  statusId: number;
  status: string;

  createdAt: string;
};

export async function getAdminEnquiryById(
  enquiryId: number,
  token?: string | null
) {
  return await apiClient<AdminEnquiryDetails>(`/admin/enquiries/${enquiryId}`, {
    authToken: token
  });
}
export type EnquiryNote = {
  enquiryNoteId: number;
  enquiryId: number;
  note: string;
  createdAt: string;
};

export type CreateEnquiryNote = {
  note: string;
};

export async function getEnquiryNotes(
  enquiryId: number,
  token?: string | null
) {
  return await apiClient<EnquiryNote[]>(`/admin/enquiries/${enquiryId}/notes`, {
    authToken: token
  });
}

export async function addEnquiryNote(
  enquiryId: number,
  data: CreateEnquiryNote,
  token?: string | null
) {
  return await apiClient<EnquiryNote>(`/admin/enquiries/${enquiryId}/notes`, {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data)
  });
}
