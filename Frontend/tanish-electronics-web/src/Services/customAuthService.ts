import { apiClient } from "./apiClient";

const ACCESS_TOKEN_KEY = "te_access_token";
const REFRESH_TOKEN_KEY = "te_refresh_token";
const AUTH_USER_KEY = "te_auth_user";

export type AuthUser = {
  appUserId: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  roles: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export function saveAuthSession(response: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export async function registerUser(request: RegisterRequest) {
  const response = await apiClient<AuthResponse>("/auth/custom/register", {
    method: "POST",
    body: JSON.stringify(request)
  });

  saveAuthSession(response);

  return response;
}

export async function loginUser(request: LoginRequest) {
  const response = await apiClient<AuthResponse>("/auth/custom/login", {
    method: "POST",
    body: JSON.stringify(request)
  });

  saveAuthSession(response);

  return response;
}

export async function refreshAuthSession() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  const response = await apiClient<AuthResponse>("/auth/custom/refresh", {
    method: "POST",
    body: JSON.stringify({
      refreshToken
    })
  });

  saveAuthSession(response);

  return response;
}

export async function logoutUser() {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await apiClient<void>("/auth/custom/logout", {
        method: "POST",
        body: JSON.stringify({
          refreshToken
        })
      });
    } catch {
      // Even if backend logout fails, clear frontend session.
    }
  }

  clearAuthSession();
}

export function userHasRole(user: AuthUser | null, role: string) {
  return (
    user?.roles.some((item) => item.toLowerCase() === role.toLowerCase()) ??
    false
  );
}

export function userHasAnyRole(user: AuthUser | null, roles: string[]) {
  return roles.some((role) => userHasRole(user, role));
}
