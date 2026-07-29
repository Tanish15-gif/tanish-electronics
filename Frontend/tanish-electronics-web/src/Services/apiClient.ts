const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ACCESS_TOKEN_KEY = "te_access_token";
const REFRESH_TOKEN_KEY = "te_refresh_token";
const AUTH_USER_KEY = "te_auth_user";

let refreshRequest: Promise<string | null> | null = null;

type ApiClientOptions = RequestInit & {
  authToken?: string | null;
  skipAuthRefresh?: boolean;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: {
    appUserId: number;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    emailConfirmed: boolean;
    roles: string[];
  };
};

function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveAuthResponse(response: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
}

let authRedirectStarted = false;

export function clearAuthStorage(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function clearAuthStorageAndRedirect(): void {
  clearAuthStorage();

  if (authRedirectStarted) {
    return;
  }

  authRedirectStarted = true;

  if (!window.location.pathname.startsWith("/sign-in")) {
    window.location.replace("/sign-in?reason=session-ended");
  }
}

async function refreshAccessToken() {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = refreshAccessTokenInternal();

  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}

async function refreshAccessTokenInternal(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    clearAuthStorageAndRedirect();
    return null;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/auth/custom/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refreshToken
      })
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your connection."
    );
  }

  // Refresh token expired, revoked, or session revoked.
  if (response.status === 401 || response.status === 403) {
    clearAuthStorageAndRedirect();
    return null;
  }

  if (!response.ok) {
    return await parseResponse<string | null>(response);
  }

  const data = (await response.json()) as AuthResponse;

  saveAuthResponse(data);

  return data.accessToken;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  let data: any = null;

  if (responseText && contentType.includes("application/json")) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a minute and try again.");
    }

    const validationErrors =
      data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors).flat().join(" ")
        : "";

    const errorMessage =
      data?.message ||
      data?.title ||
      data?.detail ||
      validationErrors ||
      responseText ||
      `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  if (!responseText) {
    return null as T;
  }

  if (data) {
    return data as T;
  }

  return responseText as T;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const fixedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const {
    authToken,
    headers: optionHeaders,
    skipAuthRefresh,
    ...fetchOptions
  } = options;

  const headers = new Headers(optionHeaders);

  const isFormData = fetchOptions.body instanceof FormData;

  if (fetchOptions.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const customAccessToken = getStoredAccessToken();
  const finalAuthToken = authToken || customAccessToken;

  if (finalAuthToken) {
    headers.set("Authorization", `Bearer ${finalAuthToken}`);
  }

  const response = await fetch(`${BASE_URL}${fixedEndpoint}`, {
    ...fetchOptions,
    headers
  });

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    fixedEndpoint !== "/auth/custom/login" &&
    fixedEndpoint !== "/auth/custom/google-login" &&
    fixedEndpoint !== "/auth/custom/register" &&
    fixedEndpoint !== "/auth/custom/refresh" &&
    fixedEndpoint !== "/auth/custom/logout"
  ) {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      throw new Error("Your session has ended. Please sign in again.");
    }

    const retryHeaders = new Headers(optionHeaders);

    if (fetchOptions.body && !isFormData && !retryHeaders.has("Content-Type")) {
      retryHeaders.set("Content-Type", "application/json");
    }

    retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

    const retryResponse = await fetch(`${BASE_URL}${fixedEndpoint}`, {
      ...fetchOptions,
      headers: retryHeaders
    });

    if (retryResponse.status === 401 || retryResponse.status === 403) {
      clearAuthStorageAndRedirect();

      throw new Error("Your session has ended. Please sign in again.");
    }

    return await parseResponse<T>(retryResponse);
  }

  return await parseResponse<T>(response);
}
