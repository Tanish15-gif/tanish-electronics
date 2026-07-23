import { apiClient } from "./apiClient";
import type { PagedResult } from "./adminServiceRequestService";

export type AdminAnnouncement = {
  announcementId: number;

  title: string;
  message: string;

  announcementType: string;
  audience: string;
  displayLocation: string;

  imageUrl?: string | null;

  buttonText?: string | null;
  buttonLink?: string | null;

  startAt?: string | null;
  endAt?: string | null;

  priority: number;
  isActive: boolean;
  showOnce: boolean;

  totalViews?: number;

  createdByName?: string | null;
  createdByEmail?: string | null;

  createdAt: string;
  updatedAt?: string | null;
};

export type CreateAnnouncement = {
  title: string;
  message: string;

  announcementType: string;
  audience: string;
  displayLocation: string;

  imageUrl?: string | null;

  buttonText?: string | null;
  buttonLink?: string | null;

  startAt?: string | null;
  endAt?: string | null;

  priority: number;
  isActive: boolean;
  showOnce: boolean;
};

export type AdminAnnouncementFilters = {
  search?: string;
  announcementType?: string;
  audience?: string;
  displayLocation?: string;
  isActive?: boolean | null;
  pageNumber?: number;
  pageSize?: number;
};

function buildAnnouncementQuery(filters: AdminAnnouncementFilters) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.announcementType?.trim()) {
    params.append("announcementType", filters.announcementType.trim());
  }

  if (filters.audience?.trim()) {
    params.append("audience", filters.audience.trim());
  }

  if (filters.displayLocation?.trim()) {
    params.append("displayLocation", filters.displayLocation.trim());
  }

  if (filters.isActive !== undefined && filters.isActive !== null) {
    params.append("isActive", String(filters.isActive));
  }

  params.append("pageNumber", String(filters.pageNumber ?? 1));
  params.append("pageSize", String(filters.pageSize ?? 10));

  return params.toString();
}

export async function getAdminAnnouncements(
  filters: AdminAnnouncementFilters,
  token?: string | null
) {
  const queryString = buildAnnouncementQuery(filters);

  return await apiClient<PagedResult<AdminAnnouncement>>(
    `/admin/announcements?${queryString}`,
    {
      authToken: token
    }
  );
}

export async function createAnnouncement(
  data: CreateAnnouncement,
  token?: string | null
) {
  return await apiClient<AdminAnnouncement>("/admin/announcements", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data)
  });
}

export async function updateAnnouncement(
  announcementId: number,
  data: CreateAnnouncement,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/announcements/${announcementId}`,
    {
      method: "PUT",
      authToken: token,
      body: JSON.stringify(data)
    }
  );
}

export async function deleteAnnouncement(
  announcementId: number,
  token?: string | null
) {
  return await apiClient<{ message: string }>(
    `/admin/announcements/${announcementId}`,
    {
      method: "DELETE",
      authToken: token
    }
  );
}

export type AnnouncementImageUploadResult = {
  imageUrl: string;
};

export async function uploadAnnouncementImage(
  announcementId: number,
  image: File,
  token?: string | null
) {
  const formData = new FormData();

  formData.append("image", image);

  return await apiClient<AnnouncementImageUploadResult>(
    `/admin/announcements/${announcementId}/image`,
    {
      method: "POST",
      authToken: token,
      body: formData
    }
  );
}
