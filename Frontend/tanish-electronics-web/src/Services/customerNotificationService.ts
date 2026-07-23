import { apiClient } from "./apiClient";

export type CustomerNotification = {
  customerNotificationId: number;
  serviceRequestId?: number | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export async function getCustomerNotifications(token: string) {
  return await apiClient<CustomerNotification[]>("/CustomerNotifications", {
    authToken: token
  });
}

export async function markCustomerNotificationAsRead(
  notificationId: number,
  token: string
) {
  return await apiClient<{ message: string }>(
    `/CustomerNotifications/${notificationId}/read`,
    {
      method: "PUT",
      authToken: token
    }
  );
}

export async function markAllCustomerNotificationsAsRead(token: string) {
  return await apiClient<{ message: string }>(
    "/CustomerNotifications/read-all",
    {
      method: "PUT",
      authToken: token
    }
  );
}
