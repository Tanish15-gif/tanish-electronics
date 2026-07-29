import { apiClient } from "./apiClient";
import type { PagedResult } from "../Types/PagedResult";

// Change the import path above to your existing PagedResult location.

export type AdminUserListItem = {
  appUserId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;

  roles: string[];
  connectedProviders: string[];

  hasPassword: boolean;
  emailConfirmed: boolean;
  isActive: boolean;
  isLocked: boolean;
  lockoutEndAt: string | null;

  activeSessionCount: number;

  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

export type AdminUsersSummary = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  googleUsers: number;
  passwordUsers: number;
  activeSessions: number;
};

export type AdminUsersQuery = {
  search?: string;
  role?: string;
  status?: "all" | "active" | "inactive" | "locked";
  signInMethod?: "all" | "password" | "google" | "both";
  emailConfirmed?: boolean | null;
  sortBy?: "newest" | "oldest" | "name" | "lastLogin" | "sessions";
  page?: number;
  pageSize?: number;
};

export async function getAdminUsers(
  query: AdminUsersQuery
): Promise<PagedResult<AdminUserListItem>> {
  const parameters = new URLSearchParams();

  if (query.search?.trim()) {
    parameters.set("search", query.search.trim());
  }

  if (query.role?.trim()) {
    parameters.set("role", query.role.trim());
  }

  if (query.status) {
    parameters.set("status", query.status);
  }

  if (query.signInMethod) {
    parameters.set("signInMethod", query.signInMethod);
  }

  if (query.emailConfirmed !== null && query.emailConfirmed !== undefined) {
    parameters.set("emailConfirmed", String(query.emailConfirmed));
  }

  if (query.sortBy) {
    parameters.set("sortBy", query.sortBy);
  }

  parameters.set("page", String(query.page ?? 1));
  parameters.set("pageSize", String(query.pageSize ?? 10));

  return apiClient<PagedResult<AdminUserListItem>>(
    `/admin/users?${parameters.toString()}`
  );
}

export async function getAdminUsersSummary(): Promise<AdminUsersSummary> {
  return apiClient<AdminUsersSummary>("/admin/users/summary");
}

export type AdminUserSession = {
  userSessionId: string;
  deviceType: string;
  deviceName: string;
  browserName: string;
  browserVersion: string | null;
  operatingSystem: string;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
};

export type AdminUserDetails = {
  appUserId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profileImageUrl: string | null;

  roles: string[];
  connectedProviders: string[];

  hasPassword: boolean;
  emailConfirmed: boolean;
  isActive: boolean;
  isLocked: boolean;

  accessFailedCount: number;
  lockoutEndAt: string | null;

  activeSessionCount: number;

  passwordUpdatedAt: string | null;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  lastLogoutAt: string | null;
  createdAt: string;
  updatedAt: string | null;

  activeSessions: AdminUserSession[];
};

export async function getAdminUserDetails(
  appUserId: number
): Promise<AdminUserDetails> {
  return apiClient<AdminUserDetails>(`/admin/users/${appUserId}`);
}

export async function updateAdminUserStatus(
  appUserId: number,
  isActive: boolean
): Promise<void> {
  await apiClient<void>(`/admin/users/${appUserId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      isActive
    })
  });
}

export async function unlockAdminUser(appUserId: number): Promise<void> {
  await apiClient<void>(`/admin/users/${appUserId}/unlock`, {
    method: "POST"
  });
}

export async function revokeAdminUserSessions(
  appUserId: number
): Promise<void> {
  await apiClient<void>(`/admin/users/${appUserId}/sessions/revoke-all`, {
    method: "POST"
  });
}
