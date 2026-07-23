import { apiClient } from "./apiClient";

export type AdminNotification = {
  adminNotificationId: number;
  serviceRequestId?: number | null;
  enquiryId?: number | null;
  productId?: number | null;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
};

export async function getAdminNotifications(token: string) {
  return await apiClient<AdminNotification[]>("/admin/notifications", {
    authToken: token
  });
}

export async function markAdminNotificationAsRead(
  notificationId: number,
  token: string
) {
  return await apiClient<{ message: string }>(
    `/admin/notifications/${notificationId}/read`,
    {
      method: "PUT",
      authToken: token
    }
  );
}

export async function markAllAdminNotificationsAsRead(token: string) {
  return await apiClient<{ message: string }>("/admin/notifications/read-all", {
    method: "PUT",
    authToken: token
  });
}
