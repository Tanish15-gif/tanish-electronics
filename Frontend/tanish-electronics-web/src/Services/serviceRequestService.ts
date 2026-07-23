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
  serviceRequestId: number;
  requestNumber: string;
  status: string;
  message: string;
};
export type TrackServiceRequestResult = {
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
  token?: string | null
) {
  return await apiClient<ServiceRequestCreated>("/ServiceRequests", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data)
  });
}
export async function trackServiceRequest(
  requestNumber: string,
  phoneNumber: string
) {
  return await apiClient<TrackServiceRequestResult>(
    `/ServiceRequests/track?requestNumber=${requestNumber}&phoneNumber=${phoneNumber}`
  );
}
export type uploadServiceRequestsImagesReponse = {
  message: string;
  images: File[];
};
export async function uploadServiceRequestsImages(
  serviceRequestId: number,
  images: File[]
) {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append("images", image);
  });

  return await apiClient<uploadServiceRequestsImagesReponse>(
    `/ServiceRequests/${serviceRequestId}/images`,
    {
      method: "POST",
      body: formData
    }
  );
}
