import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import type { PublicAnnouncement } from "../../Services/publicAnnouncementService";

import {
  getCustomerPopupAnnouncement,
  markCustomerAnnouncementAsViewed
} from "../../Services/customerAnnouncementService";

import { startAnnouncementRealtime } from "../../Services/announcementRealtimeService";

type LoadPopupOptions = {
  silent?: boolean;
  keepCurrent?: boolean;
};

function CustomerDashboardAnnouncementPopup() {
  const { getToken, isLoaded, isSignedIn } = useApiAuth();

  const dialogRef = useRef<HTMLElement | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const closingRef = useRef(false);

  const activeAnnouncementRef = useRef<PublicAnnouncement | null>(null);

  const [activeAnnouncement, setActiveAnnouncement] =
    useState<PublicAnnouncement | null>(null);

  const [imageFailed, setImageFailed] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    activeAnnouncementRef.current = activeAnnouncement;
  }, [activeAnnouncement]);

  const loadPopupAnnouncement = useCallback(
    async (options: LoadPopupOptions = {}) => {
      const { silent = false, keepCurrent = false } = options;

      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const token = await getToken();

        if (!token) {
          if (!keepCurrent) {
            setActiveAnnouncement(null);
          }

          return;
        }

        const announcement = await getCustomerPopupAnnouncement(
          token,
          "CustomerDashboard"
        );

        /*
         * During a realtime refresh, do not replace
         * a popup that the customer is already reading.
         */
        if (keepCurrent && activeAnnouncementRef.current) {
          return;
        }

        setActiveAnnouncement(announcement);
      } catch (error) {
        console.error("Failed to load popup announcement:", error);

        if (!keepCurrent || !activeAnnouncementRef.current) {
          setActiveAnnouncement(null);
        }

        setError("The latest shop update could not be loaded.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [getToken]
  );

  /*
   * Load the popup after Clerk authentication
   * finishes loading.
   */
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setActiveAnnouncement(null);
      setLoading(false);
      return;
    }

    void loadPopupAnnouncement();
  }, [isLoaded, isSignedIn, loadPopupAnnouncement]);

  /*
   * Check for a newly created one-time popup
   * whenever SignalR reports an announcement change.
   */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const stopRealtime = startAnnouncementRealtime(() => {
      void loadPopupAnnouncement({
        silent: true,
        keepCurrent: true
      });
    });

    return stopRealtime;
  }, [isLoaded, isSignedIn, loadPopupAnnouncement]);

  useEffect(() => {
    setImageFailed(false);
  }, [activeAnnouncement?.announcementId, activeAnnouncement?.imageUrl]);

  const closePopup = useCallback(async () => {
    const announcement = activeAnnouncementRef.current;

    if (!announcement || closingRef.current) {
      return;
    }

    closingRef.current = true;

    const announcementId = announcement.announcementId;

    /*
     * Close immediately so the interface feels
     * responsive. Save the viewed record afterwards.
     */
    setActiveAnnouncement(null);

    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      await markCustomerAnnouncementAsViewed(announcementId, token);
    } catch (error) {
      console.error("Failed to mark popup announcement as viewed:", error);
    } finally {
      closingRef.current = false;
    }
  }, [getToken]);

  /*
   * Lock page scrolling, focus the popup,
   * close with Escape, and trap keyboard focus.
   */
  useEffect(() => {
    if (!activeAnnouncement) {
      return;
    }

    const scrollPosition = window.scrollY;

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = "fixed";

    document.body.style.top = `-${scrollPosition}px`;

    document.body.style.left = "0";

    document.body.style.right = "0";

    document.body.style.width = "100%";

    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        void closePopup();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        [
          "a[href]",
          "button:not([disabled])",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          '[tabindex]:not([tabindex="-1"])'
        ].join(",")
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];

      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.position = previousBodyStyles.position;

      document.body.style.top = previousBodyStyles.top;

      document.body.style.left = previousBodyStyles.left;

      document.body.style.right = previousBodyStyles.right;

      document.body.style.width = previousBodyStyles.width;

      document.body.style.overflow = previousBodyStyles.overflow;

      window.scrollTo(0, scrollPosition);

      previouslyFocusedElement?.focus();
    };
  }, [activeAnnouncement, closePopup]);

  if (typeof document === "undefined") {
    return null;
  }

  if (loading && !activeAnnouncement) {
    return null;
  }

  if (!activeAnnouncement) {
    return null;
  }

  const hasImage = Boolean(activeAnnouncement.imageUrl) && !imageFailed;

  const hasActionButton =
    Boolean(activeAnnouncement.buttonText) &&
    Boolean(activeAnnouncement.buttonLink);

  const isImportant = activeAnnouncement.priority >= 3;

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-black/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          void closePopup();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-announcement-title"
        aria-describedby="customer-announcement-message"
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl shadow-black/50 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] sm:rounded-[1.75rem] ${
          hasImage ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        {/* Mobile drag indicator */}
        <div className="relative z-40 flex shrink-0 justify-center bg-[#fffdf7] pb-1 pt-2.5 dark:bg-[#1a1712] sm:hidden">
          <span className="h-1 w-10 rounded-full bg-[#d8cdb6] dark:bg-[#4a443a]" />
        </div>

        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => void closePopup()}
          aria-label="Close announcement"
          className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#1f1a12] shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/30 dark:border-white/15 dark:bg-black/55 dark:text-white dark:hover:bg-black/75 sm:right-5 sm:top-5"
        >
          <CloseIcon />
        </button>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
            hasImage
              ? "lg:grid lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]"
              : ""
          }`}
        >
          {/* Image panel */}
          {hasImage && (
            <div className="relative min-h-[220px] overflow-hidden border-b border-[#d8cdb6] bg-[#11110f] dark:border-[#302c24] sm:min-h-[280px] lg:min-h-full lg:border-b-0 lg:border-r">
              {/* Blurred ambient backdrop */}
              <img
                src={activeAnnouncement.imageUrl!}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-30 blur-2xl"
              />

              {/* Main image fitting the full panel */}
              <img
                src={activeAnnouncement.imageUrl!}
                alt={activeAnnouncement.title}
                loading="eager"
                decoding="async"
                onError={() => setImageFailed(true)}
                className="relative z-10 h-full w-full object-cover object-center"
              />

              {/* Subtle lighting overlay */}
              <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-black/10 lg:bg-gradient-to-r lg:from-transparent lg:to-black/20" />

              <div className="pointer-events-none absolute inset-0 z-20 ring-1 ring-inset ring-white/10" />
            </div>
          )}

          {/* Content panel */}
          <div className="flex min-h-full flex-col">
            <div className="flex-1 p-5 pt-6 sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-center gap-2 pr-12">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b46a]/45 bg-[#fff4cc] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#765313] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#f3d68e]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d6b46a]" />

                  {formatAnnouncementType(activeAnnouncement.announcementType)}
                </span>

                {isImportant && (
                  <span className="rounded-full border border-amber-300/50 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
                    {activeAnnouncement.priority >= 4 ? "Urgent" : "Important"}
                  </span>
                )}
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Customer update
              </p>

              <h2
                id="customer-announcement-title"
                className="mt-2 text-3xl font-black leading-[1.08] tracking-[-0.03em] sm:text-4xl"
              >
                {activeAnnouncement.title}
              </h2>

              <p
                id="customer-announcement-message"
                className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093] sm:text-base sm:leading-7"
              >
                {activeAnnouncement.message}
              </p>

              {activeAnnouncement.endAt && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#eadfca] bg-[#fff8e7] px-4 py-3 text-xs font-bold text-[#765313] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] dark:bg-[#242016]">
                    <CalendarIcon />
                  </span>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-70">
                      Available until
                    </p>

                    <p className="mt-0.5">
                      {formatDate(activeAnnouncement.endAt)}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="shrink-0 border-t border-[#eadfca] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#15130f] sm:p-6">
              <div
                className={`grid gap-3 ${
                  hasActionButton ? "sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {hasActionButton && (
                  <SmartAnnouncementLink
                    to={activeAnnouncement.buttonLink!}
                    onClick={() => void closePopup()}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 py-3 text-center text-sm font-black text-[#f7f5ef] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#33291b] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                  >
                    {activeAnnouncement.buttonText}

                    <ArrowUpRightIcon />
                  </SmartAnnouncementLink>
                )}

                <button
                  type="button"
                  onClick={() => void closePopup()}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 py-3 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                >
                  Got it
                </button>
              </div>

              <p className="mt-4 text-center text-[11px] font-semibold leading-5 text-[#8f8778]">
                This announcement will remain available in your dashboard
                slideshow.
              </p>
            </div>
          </div>
        </div>

        <div className="h-[env(safe-area-inset-bottom)] shrink-0 bg-[#fffaf0] dark:bg-[#15130f]" />
      </section>
    </div>,
    document.body
  );
}

function SmartAnnouncementLink({
  to,
  children,
  className,
  onClick
}: {
  to: string;
  children: ReactNode;
  className: string;
  onClick?: () => void;
}) {
  const isExternal = to.startsWith("http://") || to.startsWith("https://");

  const isSpecial = to.startsWith("tel:") || to.startsWith("mailto:");

  if (isExternal) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  if (isSpecial) {
    return (
      <a href={to} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function formatAnnouncementType(type: string) {
  if (type === "ServiceAlert") {
    return "Service alert";
  }

  if (type === "ShopNotice") {
    return "Shop notice";
  }

  if (type === "RepairReminder") {
    return "Repair reminder";
  }

  if (type === "FeedbackHighlight") {
    return "Customer update";
  }

  if (type === "Product") {
    return "New product";
  }

  if (type === "Offer") {
    return "Special offer";
  }

  return type;
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No expiry";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CustomerDashboardAnnouncementPopup;
