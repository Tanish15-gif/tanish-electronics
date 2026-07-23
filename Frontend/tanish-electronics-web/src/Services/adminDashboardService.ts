import { apiClient } from "./apiClient";

export type RecentServiceRequest = {
  serviceRequestId: number;
  requestNumber: string;
  customerName: string;
  serviceCategory: string;
  currentStatus: string;
  createdAt: string;
};

export type RecentEnquiry = {
  enquiryId: number;
  fullName: string;
  phoneNumber: string;
  productName?: string;
  status: string;
  createdAt: string;
};

export type AdminDashboardSummary = {
  totalServiceRequests: number;
  pendingServiceRequests: number;
  inProgressServiceRequests: number;
  completedServiceRequests: number;

  totalEnquiries: number;
  newEnquiries: number;

  totalProducts: number;
  availableProducts: number;
  featuredProducts: number;
  lowStockProducts: number;

  recentServiceRequests: RecentServiceRequest[];
  recentEnquiries: RecentEnquiry[];
};

export async function getAdminDashboardSummary(token?: string | null) {
  return await apiClient<AdminDashboardSummary>("/admin/dashboard/summary", {
    authToken: token
  });
}
