import {
  getStoredAuthUser,
  type AuthUser as CustomAuthUser
} from "./customAuthService";

export type SyncUser = {
  fullName: string;
  email: string;
  phoneNumber?: string;
};

export type AuthUser = {
  appUserId: number;
  clerkUserId?: string | null;

  fullName: string;
  email: string;
  phoneNumber?: string | null;

  roles: string[];
  isAdmin: boolean;
};

function mapCustomUser(user: CustomAuthUser): AuthUser {
  const isAdmin = user.roles.some((role) =>
    ["admin", "owner"].includes(role.toLowerCase())
  );

  return {
    appUserId: user.appUserId,
    clerkUserId: null,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    roles: user.roles,
    isAdmin
  };
}

export async function syncUser(_data: SyncUser, _token: string) {
  const storedUser = getStoredAuthUser();

  if (!storedUser) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return mapCustomUser(storedUser);
}

export async function getCurrentAuthUser(_token?: string | null) {
  const storedUser = getStoredAuthUser();

  if (!storedUser) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return mapCustomUser(storedUser);
}
