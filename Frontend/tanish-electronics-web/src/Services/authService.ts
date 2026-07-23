import { apiClient } from "./apiClient";

export type SyncUser = {
  fullName: string;
  email: string;
  phoneNumber?: string;
};

export type AuthUser = {
  appUserId: number;
  clerkUserId: string;

  fullName: string;
  email: string;
  phoneNumber?: string;

  roles: string[];
  isAdmin: boolean;
};

export async function syncUser(data: SyncUser, token: string) {
  return await apiClient<AuthUser>("/auth/sync", {
    method: "POST",
    authToken: token,
    body: JSON.stringify(data)
  });
}

export async function getCurrentAuthUser(token: string) {
  return await apiClient<AuthUser>("/auth/me", {
    authToken: token
  });
}
