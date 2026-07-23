import { apiClient } from "./apiClient";

export type PublicAnnouncement = {
  announcementId: number;

  title: string;
  message: string;

  announcementType: string;
  audience?: string;
  displayLocation: string;

  imageUrl?: string | null;

  buttonText?: string | null;
  buttonLink?: string | null;

  priority: number;
  showOnce: boolean;

  endAt?: string | null;
};

export async function getPublicAnnouncements(
  location = "Homepage",
  audience = "All",
  limit = 3
) {
  const params = new URLSearchParams();

  params.append("location", location);
  params.append("audience", audience);
  params.append("limit", limit.toString());
  return await apiClient<PublicAnnouncement[]>(
    `/public/announcements?${params.toString()}`
  );
}
