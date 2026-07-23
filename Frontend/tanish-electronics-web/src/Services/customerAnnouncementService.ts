import { apiClient } from "./apiClient";
import type { PublicAnnouncement } from "./publicAnnouncementService";

/**
 * Returns every active customer announcement for the slideshow.
 * ShowOnce announcements are also included.
 */
export async function getCustomerAnnouncements(
  token: string,
  location = "CustomerDashboard",
  limit = 6
) {
  const params = new URLSearchParams({
    location,
    limit: limit.toString()
  });

  return await apiClient<PublicAnnouncement[]>(
    `/customer/announcements?${params.toString()}`,
    {
      authToken: token
    }
  );
}

/**
 * Returns one unviewed ShowOnce announcement.
 * Returns null when no popup announcement is available.
 */
export async function getCustomerPopupAnnouncement(
  token: string,
  location = "CustomerDashboard"
) {
  const params = new URLSearchParams({
    location
  });

  return await apiClient<PublicAnnouncement | null>(
    `/customer/announcements/popup?${params.toString()}`,
    {
      authToken: token
    }
  );
}

/**
 * Marks the one-time popup as viewed for the current customer.
 */
export async function markCustomerAnnouncementAsViewed(
  announcementId: number,
  token: string
) {
  return await apiClient<{ message: string }>(
    `/customer/announcements/${announcementId}/view`,
    {
      method: "POST",
      authToken: token
    }
  );
}
