import { useCallback, useEffect, useRef, useState } from "react";

import { googleLogin } from "../Services/customAuthService";
import { useCustomAuth } from "../contexts/CustomAuthContext";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonOptions = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  button_auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  itp_support?: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: GoogleIdConfiguration) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonOptions
          ) => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  mode?: "signin" | "signup";
  disabled?: boolean;
  onAuthenticated: (roles: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
};

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let googleScriptPromise: Promise<void> | null = null;
let initializedGoogleClientId: string | null = null;

let activeCredentialConsumer:
  ((response: GoogleCredentialResponse) => void) | null = null;

function GoogleSignInButton({
  mode = "signin",
  disabled = false,
  onAuthenticated,
  onBusyChange
}: GoogleSignInButtonProps) {
  const { setUser } = useCustomAuth();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonHostRef = useRef<HTMLDivElement | null>(null);

  const processingRef = useRef(false);
  const disabledRef = useRef(disabled);
  const lastRenderedWidthRef = useRef(0);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (processingRef.current || disabledRef.current) {
        return;
      }

      if (!response.credential) {
        setError("Google did not return a valid sign-in credential.");
        return;
      }

      try {
        processingRef.current = true;
        setProcessing(true);
        setError("");
        onBusyChange?.(true);

        const result = await googleLogin(response.credential);

        setUser(result.user);
        onAuthenticated(result.user.roles ?? []);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Google sign-in failed. Please try again."
        );
      } finally {
        processingRef.current = false;
        setProcessing(false);
        onBusyChange?.(false);
      }
    },
    [onAuthenticated, onBusyChange, setUser]
  );

  useEffect(() => {
    let cancelled = false;
    let resizeTimer: number | null = null;

    async function setupGoogleButton() {
      try {
        setStatus("loading");
        setError("");

        const clientId = String(
          import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""
        ).trim();

        if (!clientId) {
          throw new Error(
            "Google sign-in is not configured. VITE_GOOGLE_CLIENT_ID is missing."
          );
        }

        await loadGoogleIdentityServices();

        if (
          cancelled ||
          !window.google?.accounts?.id ||
          !containerRef.current ||
          !buttonHostRef.current
        ) {
          return;
        }

        activeCredentialConsumer = handleCredential;
        initializeGoogleIdentity(clientId);

        function renderGoogleButton() {
          const container = containerRef.current;
          const host = buttonHostRef.current;
          const googleId = window.google?.accounts?.id;

          if (cancelled || !container || !host || !googleId) {
            return;
          }

          const measuredWidth = Math.floor(
            container.getBoundingClientRect().width
          );

          if (measuredWidth <= 0) {
            return;
          }

          const buttonWidth = Math.min(Math.max(measuredWidth, 220), 400);

          /*
           * Only rebuild the Google iframe when its width actually changes.
           * This prevents the old ResizeObserver render loop and page shaking.
           */
          if (
            host.childElementCount > 0 &&
            Math.abs(lastRenderedWidthRef.current - buttonWidth) < 8
          ) {
            setStatus("ready");
            return;
          }

          lastRenderedWidthRef.current = buttonWidth;
          host.replaceChildren();

          googleId.renderButton(host, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: mode === "signup" ? "signup_with" : "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: buttonWidth
          });

          setStatus("ready");
        }

        window.requestAnimationFrame(renderGoogleButton);

        function handleWindowResize() {
          if (resizeTimer !== null) {
            window.clearTimeout(resizeTimer);
          }

          resizeTimer = window.setTimeout(() => {
            window.requestAnimationFrame(renderGoogleButton);
          }, 180);
        }

        window.addEventListener("resize", handleWindowResize);

        return () => {
          window.removeEventListener("resize", handleWindowResize);
        };
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Google sign-in is currently unavailable."
        );

        return undefined;
      }
    }

    let removeResizeListener: (() => void) | undefined;

    void setupGoogleButton().then((cleanup) => {
      removeResizeListener = cleanup;
    });

    return () => {
      cancelled = true;
      removeResizeListener?.();

      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }

      if (activeCredentialConsumer === handleCredential) {
        activeCredentialConsumer = null;
      }

      onBusyChange?.(false);
    };
  }, [handleCredential, mode, onBusyChange, retryKey]);

  const unavailable = disabled || processing || status !== "ready";

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        aria-busy={status === "loading" || processing}
        className="relative h-11 w-full"
      >
        <div
          ref={buttonHostRef}
          className={`flex h-11 w-full items-center justify-center overflow-hidden transition-opacity ${
            unavailable ? "pointer-events-none opacity-60" : "opacity-100"
          }`}
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#11110f]">
            <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-[#8a6624] border-t-transparent dark:border-[#d6b46a] dark:border-t-transparent" />

            <span className="ml-2 text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
              {mode === "signup"
                ? "Loading Google sign-up…"
                : "Loading Google…"}
            </span>
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7]/95 backdrop-blur-sm dark:border-[#302c24] dark:bg-[#11110f]/95">
            <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-[#8a6624] border-t-transparent dark:border-[#d6b46a] dark:border-t-transparent" />

            <span className="ml-2 text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
              {mode === "signup"
                ? "Creating your account…"
                : "Verifying securely…"}
            </span>
          </div>
        )}
      </div>

      {status === "error" && (
        <button
          type="button"
          onClick={() => {
            lastRenderedWidthRef.current = 0;
            setRetryKey((current) => current + 1);
          }}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/15"
        >
          Google sign-in unavailable — retry
        </button>
      )}

      {error && status !== "error" && (
        <p
          role="alert"
          className="text-center text-xs font-semibold leading-5 text-red-600 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function initializeGoogleIdentity(clientId: string) {
  const googleId = window.google?.accounts?.id;

  if (!googleId) {
    throw new Error("Google Identity Services is unavailable.");
  }

  if (initializedGoogleClientId && initializedGoogleClientId !== clientId) {
    throw new Error(
      "Google Identity Services was initialized with another client ID."
    );
  }

  if (initializedGoogleClientId === clientId) {
    return;
  }

  googleId.initialize({
    client_id: clientId,
    callback: (response) => {
      activeCredentialConsumer?.(response);
    },
    auto_select: false,
    button_auto_select: false,
    cancel_on_tap_outside: true,
    context: "signin",
    ux_mode: "popup",
    itp_support: true
  });

  initializedGoogleClientId = clientId;
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    let script = document.getElementById(
      GOOGLE_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const timeoutId = window.setTimeout(() => {
      googleScriptPromise = null;
      reject(new Error("Google sign-in took too long to load."));
    }, 10_000);

    function finishLoading() {
      if (!window.google?.accounts?.id) {
        window.clearTimeout(timeoutId);
        googleScriptPromise = null;
        reject(new Error("Google sign-in loaded incorrectly."));
        return;
      }

      window.clearTimeout(timeoutId);
      resolve();
    }

    script.addEventListener("load", finishLoading, { once: true });

    script.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeoutId);
        googleScriptPromise = null;
        reject(new Error("Failed to load Google sign-in."));
      },
      { once: true }
    );
  }).catch((error) => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

export default GoogleSignInButton;
