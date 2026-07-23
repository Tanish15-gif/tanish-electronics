import { apiClient } from "./apiClient";

export type CustomerDashboardServiceRequest = {
  serviceRequestId: number;
  requestNumber: string;
  serviceCategory: string;
  currentStatus: string;
  serviceType: string;
  deviceName?: string | null;
  brand?: string | null;
  modelName?: string | null;
  preferredDate?: string | null;
  preferredTimeSlot?: string | null;
  createdAt: string;
};

export type CustomerDashboardEnquiry = {
  enquiryId: number;
  productId?: number | null;
  productName?: string | null;
  subject?: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export type CustomerDashboard = {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  totalRequest: number;
  activeRequest: number;
  completedRequest: number;
  totalEnquiries: number;
  serviceRequests: CustomerDashboardServiceRequest[];
  enquiries: CustomerDashboardEnquiry[];
};

export async function getCustomerDashboard(token: string) {
  return await apiClient<CustomerDashboard>("/CustomerDashboard", {
    authToken: token
  });
}
