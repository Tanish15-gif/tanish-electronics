import { useEffect } from "react";
import { apiClient } from "../../Services/apiClient";

const ACCESS_TOKEN_KEY = "te_access_token";

export default function SessionWatcher() {
  useEffect(() => {
    async function validateSession() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!accessToken) {
        return;
      }

      try {
        await apiClient<void>("/auth/custom/sessions/validate", {
          method: "GET"
        });
      } catch {
        // apiClient globally handles revoked sessions,
        // clears storage, and redirects.
      }
    }

    const handleWindowFocus = () => {
      void validateSession();
    };

    void validateSession();

    const intervalId = window.setInterval(validateSession, 60_000);

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  return null;
}
