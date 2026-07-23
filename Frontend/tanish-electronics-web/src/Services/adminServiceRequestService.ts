import { apiClient } from "./apiClient";
import type { LookUpItem } from "./serviceRequestService";

export type AdminServiceRequestListItem = {
  serviceRequestId: number;
  requestNumber: string;
  customerName: string;
  phoneNumber: string;
  serviceCategory: string;
  currentStatus: string;
  serviceType: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
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

export type AdminServiceRequestDetails = {
  serviceRequestId: number;
  requestNumber: string;

  customerName: string;
  phoneNumber: string;
  email?: string;

  serviceCategory: string;
  currentStatus: string;
  currentStatusId: number;

  deviceName?: string;
  brand?: string;
  modelName?: string;

  issueDescription: string;

  images: AdminServiceRequestImage[];

  serviceType: string;
  visitAddress?: string;

  preferredDate?: string;
  preferredTimeSlot?: string;

  diagnosis?: string | null;
  workNotes?: string | null;
  partsUsed?: string | null;
  warrantyNote?: string | null;
  showRepairNotesToCustomer: boolean;

  estimatedPrice?: number;
  finalPrice?: number;

  paymentStatus: string;
  paidAt?: string | null;

  statusHistory: AdminServiceRequestStatusHistory[];

  adminNotes?: string;

  createdAt: string;
  updatedAt?: string;
};
export type UpdateServiceRequestStatus = {
  newStatusId: number;
  note?: string;
  isCorrection: boolean;
};

export async function getAdminServiceRequests(
  token: string,
  params: {
    statusId?: number | null;
    search?: string;
    pageNumber?: number;
    pageSize?: number;
  }
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

  return await apiClient<PagedResult<AdminServiceRequestListItem>>(
    `/admin/service-requests?${query.toString()}`,
    {
      authToken: token
    }
  );
}
export async function getServiceStatuses() {
  return await apiClient<LookUpItem[]>("/LookUps/service-statuses");
}

export async function getAdminServiceRequestById(
  id: number,
  token?: string | null
) {
  return await apiClient<AdminServiceRequestDetails>(
    `/admin/service-requests/${id}`,
    {
      authToken: token
    }
  );
}
export async function updateAdminServiceRequestStatus(
  id: number,
  data: UpdateServiceRequestStatus,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/service-requests/${id}/status`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify(data)
    }
  );
}

export type UpdateServiceRequestPricing = {
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  adminNotes?: string | null;
  paymentStatus?: string | null;
};
export async function updateAdminServiceRequestPricing(
  id: number,
  data: UpdateServiceRequestPricing,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/service-requests/${id}/pricing`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify(data)
    }
  );
}

export type AdminServiceRequestImage = {
  serviceRequestImageId: number;
  imageUrl: string;
  originalFileName?: string | null;
  createdAt: string;
};

export type AdminServiceRequestStatusHistory = {
  oldStatus?: string | null;
  newStatus: string;
  note?: string | null;
  changedAt: string;
};
export type UpdateRepairWorkNotes = {
  diagnosis?: string | null;
  workNotes?: string | null;
  partsUsed?: string | null;
  warrantyNote?: string | null;
  showRepairNotesToCustomer: boolean;
};

export async function updateRepairWorkNotes(
  serviceRequestId: number,
  data: UpdateRepairWorkNotes,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/service-requests/${serviceRequestId}/repair-work-notes`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify(data)
    }
  );
}
