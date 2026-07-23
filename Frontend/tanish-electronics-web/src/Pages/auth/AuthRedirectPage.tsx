import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { syncUser } from "../../Services/authService";

function AuthRedirectPage() {
  const navigate = useNavigate();

  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();

  const { isLoaded: isUserLoaded, user } = useUser();

  const redirectRunningRef = useRef(false);

  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded) {
      return;
    }

    let cancelled = false;

    async function handleRedirect() {
      if (redirectRunningRef.current) {
        return;
      }

      if (!isSignedIn || !user) {
        navigate("/sign-in", { replace: true });
        return;
      }

      try {
        redirectRunningRef.current = true;
        setError("");

        const token = await getToken();

        if (!token) {
          throw new Error("Unable to get authentication token.");
        }

        const email = user.primaryEmailAddress?.emailAddress ?? "";

        const fullName =
          user.fullName?.trim() ||
          `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
          email.split("@")[0] ||
          "User";

        const phoneNumber = user.primaryPhoneNumber?.phoneNumber || undefined;

        const authUser = await syncUser(
          {
            fullName,
            email,
            phoneNumber
          },
          token
        );

        if (cancelled) {
          return;
        }

        navigate(
          authUser.isAdmin ? "/admin/dashboard" : "/customer/dashboard",
          { replace: true }
        );
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Authentication redirect failed."
        );
      } finally {
        if (!cancelled) {
          redirectRunningRef.current = false;
        }
      }
    }

    void handleRedirect();

    return () => {
      cancelled = true;
      redirectRunningRef.current = false;
    };
  }, [
    isAuthLoaded,
    isUserLoaded,
    isSignedIn,
    user,
    getToken,
    navigate,
    retryKey
  ]);

  function handleRetry() {
    redirectRunningRef.current = false;
    setError("");
    setRetryKey((current) => current + 1);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-4 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6">
      <section className="w-full max-w-sm rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-7 text-center shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d6b46a] text-[#11110f] shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
          Authentication
        </p>

        <h1 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
          Setting up your account
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          Syncing your profile and opening the right dashboard.
        </p>

        {!error ? (
          <div className="mt-7">
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-[#eee5d4] dark:bg-[#242016]">
              <div className="auth-progress-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-[#d6b46a]" />
            </div>

            <p className="mt-3 text-xs font-bold text-[#817867] dark:text-[#928a7d]">
              This only takes a moment
            </p>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-4 text-left dark:border-red-400/20 dark:bg-red-400/10">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />

              <div className="min-w-0">
                <p className="text-sm font-black text-red-700 dark:text-red-300">
                  Sync failed
                </p>

                <p className="mt-1 break-words text-xs font-semibold leading-5 text-red-600 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400"
            >
              Try again
            </button>
          </div>
        )}

        <p className="mt-7 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
          Admin users are sent to the admin panel. Customers are sent to their
          dashboard.
        </p>
      </section>

      <style>{`
        @keyframes auth-progress {
          from {
            transform: translateX(-110%);
          }

          to {
            transform: translateX(310%);
          }
        }

        .auth-progress-bar {
          animation: auth-progress 1.3s
            cubic-bezier(0.65, 0, 0.35, 1) infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-progress-bar {
            animation: none;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}

export default AuthRedirectPage;
