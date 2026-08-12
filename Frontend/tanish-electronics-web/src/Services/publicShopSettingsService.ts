import { apiClient } from "./apiClient";

export type PublicShopSettings = {
  shopName: string;
  ownerName: string;
  primaryPhone: string;
  secondaryPhone: string;
  whatsAppNumber: string;
  email: string;
  address: string;
  city: string;
  area: string;
  localServiceRadiusKm: number;
  homeVisitMessage: string | null;
};

export const fallbackShopSettings: PublicShopSettings = {
  shopName: "Tanish Electronics",
  ownerName: "Mr. Subhash Mohanlal Gupta",
  primaryPhone: "8850973399",
  secondaryPhone: "8097026781",
  whatsAppNumber: "918097026781",
  email: "",
  address:
    "Hanuman Chowk, Behind Hanuman Mandir, Opp. Sonali Wine Shop, Gajdhar Bandh, Santacruz West, Mumbai - 400054",
  city: "Mumbai",
  area: "Santacruz West",
  localServiceRadiusKm: 8,
  homeVisitMessage:
    "Home visit depends on location and availability. Our shop will call you to confirm."
};

let cachedShopSettings: PublicShopSettings | null = null;

export async function getPublicShopSettings() {
  if (cachedShopSettings) {
    return cachedShopSettings;
  }

  const data = await apiClient<PublicShopSettings>("/public/shop-settings");

  cachedShopSettings = data;

  return data;
}
export function getCachedShopSettings(): PublicShopSettings {
  return cachedShopSettings ?? fallbackShopSettings;
}
