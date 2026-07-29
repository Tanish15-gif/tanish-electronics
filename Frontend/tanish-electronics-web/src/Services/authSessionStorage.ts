export const ACCESS_TOKEN_KEY = "te_access_token";
export const REFRESH_TOKEN_KEY = "te_refresh_token";
export const AUTH_USER_KEY = "te_auth_user";

const LOGIN_ROUTE = "/sign-in";

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);

  localStorage.removeItem("te_role");
  localStorage.removeItem("te_user_id");
}

export function clearAuthSessionAndRedirect(): void {
  clearAuthSession();

  if (window.location.pathname !== LOGIN_ROUTE) {
    window.location.replace(`${LOGIN_ROUTE}?reason=session-ended`);
  }
}
