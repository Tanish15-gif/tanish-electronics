import { apiClient } from "./apiClient";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type CustomerRepairImage = {
  serviceRequestImageId: number;
  imageUrl: string;
  originalFileName?: string | null;
  createdAt: string;
};

export type CustomerRepairStatusHistory = {
  statusHistoryId: number;
  oldStatus?: string | null;
  newStatus: string;
  changedByName?: string | null;
  note?: string | null;
  changedAt: string;
};

export type CustomerRepairDetails = {
  serviceRequestId: number;
  requestNumber: string;

  customerName: string;
  phoneNumber: string;
  email?: string | null;

  serviceCategory: string;
  currentStatus: string;

  deviceName?: string | null;
  brand?: string | null;
  modelName?: string | null;

  issueDescription: string;
  serviceType: string;
  visitAddress?: string | null;

  preferredDate?: string | null;
  preferredTimeSlot?: string | null;

  diagnosis?: string | null;
  workNotes?: string | null;
  partsUsed?: string | null;
  warrantyNote?: string | null;
  showRepairNotesToCustomer: boolean;

  estimatedPrice?: number | null;
  finalPrice?: number | null;

  paymentStatus: string;
  paidAt?: string | null;

  feedback?: CustomerRepairFeedback | null;

  createdAt: string;
  updatedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;

  images: CustomerRepairImage[];
  statusHistory: CustomerRepairStatusHistory[];
};

export async function getCustomerRepairDetails(
  serviceRequestId: number,
  token: string
) {
  return await apiClient<CustomerRepairDetails>(
    `/CustomerRepairs/${serviceRequestId}`,
    {
      authToken: token
    }
  );
}

export function getRepairImageUrl(imageUrl: string) {
  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${BASE_URL}${imageUrl}`;
}
export type CustomerRepairFeedback = {
  customerRepairFeedbackId: number;
  serviceRequestId: number;
  rating: number;
  comment?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type UpsertCustomerRepairFeedback = {
  rating: number;
  comment?: string | null;
};
export async function upsertCustomerRepairFeedback(
  serviceRequestId: number,
  data: UpsertCustomerRepairFeedback,
  token: string
) {
  return await apiClient<CustomerRepairFeedback>(
    `/CustomerRepairs/${serviceRequestId}/feedback`,
    {
      method: "POST",
      authToken: token,
      body: JSON.stringify(data)
    }
  );
}
export type CustomerRepairFeedbackCenterItem = {
  serviceRequestId: number;
  requestNumber: string;

  serviceCategory: string;
  currentStatus: string;

  deviceName?: string | null;
  brand?: string | null;
  modelName?: string | null;

  createdAt: string;
  completedAt?: string | null;

  canGiveFeedback: boolean;
  hasFeedback: boolean;

  rating?: number | null;
  comment?: string | null;
};

export async function getCustomerRepairFeedbackCenter(token: string) {
  return await apiClient<CustomerRepairFeedbackCenterItem[]>(
    "/CustomerRepairs/feedbacks",
    {
      authToken: token
    }
  );
}
