import { apiClient } from "./apiClient";

export type AdminShopSettings = {
  shopBusinessSettingId: number;

  shopName: string;
  ownerName: string;

  primaryPhone: string;
  secondaryPhone?: string | null;
  whatsAppNumber: string;
  email?: string | null;

  address: string;
  city: string;
  area: string;

  homeVisitMessage: string;
  openingHours?: string | null;
  bookingNotice?: string | null;

  localServiceRadiusKm: number;

  updatedAt?: string | null;
  createdAt: string;
};

export type UpdateShopSettingsRequest = {
  shopName: string;
  ownerName: string;

  primaryPhone: string;
  secondaryPhone?: string | null;
  whatsAppNumber: string;
  email?: string | null;

  address: string;
  city: string;
  area: string;

  homeVisitMessage: string;
  openingHours?: string | null;
  bookingNotice?: string | null;

  localServiceRadiusKm: number;
};

export type UpdateShopSettingsResponse = {
  message: string;
  settings: AdminShopSettings;
};

export async function getAdminShopSettings(token: string) {
  return await apiClient<AdminShopSettings>("/admin/settings", {
    authToken: token
  });
}

export async function updateAdminShopSettings(
  token: string,
  payload: UpdateShopSettingsRequest
) {
  return await apiClient<UpdateShopSettingsResponse>("/admin/settings", {
    method: "PUT",
    authToken: token,
    body: JSON.stringify(payload)
  });
}
