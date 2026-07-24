import { useCallback } from "react";
import { getAccessToken } from "../Services/customAuthService";

export function useApiAuth() {
  const getToken = useCallback(async () => {
    return getAccessToken();
  }, []); // stable reference forever, since getAccessToken doesn't depend on props/state

  return {
    isLoaded: true,
    isSignedIn: Boolean(getAccessToken()),
    getToken
  };
}
