import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

import { useApiAuth } from "../../hooks/useApiAuth";

const STORAGE_KEY = "te_sign_in_modal_seen";
const MODAL_DELAY = 8000;
const DIALOG_RETRY_DELAY = 1500;

const excludedPaths = ["/sign-in", "/sign-up", "/customer", "/admin"];

function SignInExperienceModal() {
  const { isLoaded, isSignedIn } = useApiAuth();
  const location = useLocation();

  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);

  const currentPath = location.pathname + location.search;

  const isExcludedPath = excludedPaths.some(
    (path) =>
      location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    if (!isLoaded || isSignedIn || isExcludedPath) {
      setOpen(false);
      return;
    }

    let initialTimerId: number | null = null;
    let retryTimerId: number | null = null;
    let cancelled = false;

    const alreadySeen = sessionStorage.getItem(STORAGE_KEY) === "true";

    if (alreadySeen) {
      return;
    }

    function isActuallyVisible(element: HTMLElement) {
      const styles = window.getComputedStyle(element);
      const rectangle = element.getBoundingClientRect();

      return (
        styles.display !== "none" &&
        styles.visibility !== "hidden" &&
        Number(styles.opacity) > 0 &&
        element.getAttribute("aria-hidden") !== "true" &&
        rectangle.width > 0 &&
        rectangle.height > 0 &&
        rectangle.bottom > 0 &&
        rectangle.right > 0 &&
        rectangle.top < window.innerHeight &&
        rectangle.left < window.innerWidth
      );
    }

    function tryOpeningModal() {
      if (cancelled) {
        return;
      }

      const visibleDialog = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"]:not([data-sign-in-experience-dialog])'
        )
      ).find(isActuallyVisible);

      if (visibleDialog) {
        retryTimerId = window.setTimeout(tryOpeningModal, DIALOG_RETRY_DELAY);

        return;
      }

      setOpen(true);
    }

    initialTimerId = window.setTimeout(tryOpeningModal, MODAL_DELAY);

    return () => {
      cancelled = true;

      if (initialTimerId !== null) {
        window.clearTimeout(initialTimerId);
      }

      if (retryTimerId !== null) {
        window.clearTimeout(retryTimerId);
      }
    };
  }, [
    isLoaded,
    isSignedIn,
    isExcludedPath,
    location.pathname,
    location.search
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeModal() {
    setOpen(false);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  if (
    !isLoaded ||
    !open ||
    isSignedIn ||
    isExcludedPath ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <div
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-[900] flex items-end justify-center bg-black/60 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-experience-title"
        aria-describedby="sign-in-experience-description"
        tabIndex={-1}
        className="te-modal-scroll max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl shadow-black/50 outline-none dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] sm:rounded-[2rem]"
      >
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Customer account
              </p>

              <h2
                id="sign-in-experience-title"
                className="font-display mt-3 text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-[#1f1a12] dark:text-[#e8e3d8] sm:text-4xl"
              >
                Sign in for faster bookings and repair tracking.
              </h2>
            </div>

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close sign-in suggestion"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
            >
              <CloseIcon />
            </button>
          </div>

          <p
            id="sign-in-experience-description"
            className="mt-4 text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]"
          >
            Save your contact details and addresses, book repairs faster, track
            every request, and manage product enquiries from one dashboard.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to={`/sign-in?redirect_url=${encodeURIComponent(currentPath)}`}
              onClick={closeModal}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1f1a12] px-5 py-3 text-center text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/25 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              Sign in
            </Link>

            <Link
              to={`/sign-up?redirect_url=${encodeURIComponent(currentPath)}`}
              onClick={closeModal}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d8cdb6] bg-transparent px-5 py-3 text-center text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
            >
              Create account
            </Link>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-[#6f6758] transition hover:bg-[#fff8e7] hover:text-[#1f1a12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/15 dark:text-[#a8a093] dark:hover:bg-[#11110f] dark:hover:text-[#e8e3d8]"
          >
            Continue as guest
          </button>

          <p className="mt-3 text-center text-[11px] font-semibold text-[#8f8778] dark:text-[#817a6e]">
            You can browse products and book repairs without creating an
            account.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default SignInExperienceModal;
