import { apiClient } from "./apiClient";

export type LookUpItem = {
  id: number;
  name: string;
};

export type CreateServiceRequest = {
  customerName: string;
  phoneNumber: string;
  email?: string;
  serviceCategoryId: number;
  serviceLocationId?: number;
  deviceName?: string;
  brand?: string;
  modelName?: string;
  issueDescription: string;
  serviceType: string;
  customerAddressId?: number;
  visitAddress?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
};

export type ServiceRequestCreated = {
  uploadToken?: string;
  serviceRequestId: number;
  requestNumber: string;
  status: string;
  message: string;
};
export type TrackServiceRequestResult = {
  trackingToken?: string;
  requestNumber: string;
  customerName: string;
  phoneNumber: string;
  serviceCategory: string;
  currentStatus: string;
  deviceName?: string;
  brand?: string;
  modelName?: string;
  issueDescription: string;
  serviceType: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  createdAt: string;
};

export async function getServiceCategory() {
  return await apiClient<LookUpItem[]>("/LookUps/service-categories");
}
export async function getServiceLocations() {
  return await apiClient<LookUpItem[]>("/LookUps/service-locations");
}
export async function createServiceRequest(
  data: CreateServiceRequest,
  token?: string | null,
  idempotencyKey?: string
) {
  return await apiClient<ServiceRequestCreated>("/ServiceRequests", {
    method: "POST",
    authToken: token,
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    body: JSON.stringify(data)
  });
}
export async function trackServiceRequest(
  requestNumber: string,
  phoneNumber: string
) {
  return await apiClient<TrackServiceRequestResult>(
    `/ServiceRequests/track?requestNumber=${encodeURIComponent(requestNumber)}&phoneNumber=${encodeURIComponent(phoneNumber)}`
  );
}
export type uploadServiceRequestsImagesReponse = {
  message: string;
  imageUrls: string[];
};
export async function uploadServiceRequestsImages(
  serviceRequestId: number,
  images: File[],
  uploadToken?: string
) {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append("images", image);
  });

  return await apiClient<uploadServiceRequestsImagesReponse>(
    `/ServiceRequests/${serviceRequestId}/images`,
    {
      method: "POST",
      body: formData,
      headers: uploadToken ? { "X-Repair-Upload-Token": uploadToken } : undefined
    }
  );
}
