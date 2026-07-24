import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent
} from "react";
import { Link } from "react-router-dom";

import type { PublicAnnouncement } from "../../Services/publicAnnouncementService";

import { getCustomerAnnouncements } from "../../Services/customerAnnouncementService";

import { startAnnouncementRealtime } from "../../Services/announcementRealtimeService";

const SLIDE_DURATION = 6000;
const SWIPE_THRESHOLD = 55;

type LoadOptions = {
  showLoader?: boolean;
};

function CustomerDashboardAnnouncements() {
  const { getToken, isLoaded, isSignedIn } = useApiAuth();

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  const activeAnnouncementIdRef = useRef<number | null>(null);

  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [isPaused, setIsPaused] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const [error, setError] = useState("");

  const loadAnnouncements = useCallback(
    async (options: LoadOptions = {}) => {
      const { showLoader = false } = options;

      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const token = await getToken();

        if (!token) {
          setAnnouncements([]);
          setActiveIndex(0);
          return;
        }

        const data = await getCustomerAnnouncements(
          token,
          "CustomerDashboard",
          6
        );

        /*
         * Every active Customer Dashboard
         * announcement stays in this slideshow.
         *
         * showOnce only controls whether the
         * same announcement also appears once
         * in the popup.
         */
        const currentAnnouncementId = activeAnnouncementIdRef.current;

        setAnnouncements(data);

        setActiveIndex((currentIndex) => {
          if (data.length === 0) {
            return 0;
          }

          if (currentAnnouncementId !== null) {
            const matchingIndex = data.findIndex(
              (announcement) =>
                announcement.announcementId === currentAnnouncementId
            );

            if (matchingIndex >= 0) {
              return matchingIndex;
            }
          }

          return Math.min(currentIndex, data.length - 1);
        });
      } catch (error) {
        console.error("Failed to load customer announcements:", error);

        /*
         * Keep existing announcements during a
         * failed realtime refresh. Only clear them
         * when the initial request fails.
         */
        if (showLoader) {
          setAnnouncements([]);
          setActiveIndex(0);
        }

        setError("Failed to load shop updates.");
      } finally {
        if (showLoader) {
          setLoading(false);
        }

        setRefreshing(false);
      }
    },
    [getToken]
  );

  /*
   * Remember the currently visible announcement
   * so realtime updates do not jump back to slide 1.
   */
  useEffect(() => {
    activeAnnouncementIdRef.current =
      announcements[activeIndex]?.announcementId ?? null;
  }, [announcements, activeIndex]);

  /*
   * Initial authenticated request.
   */
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setAnnouncements([]);
      setActiveIndex(0);
      setLoading(false);
      return;
    }

    void loadAnnouncements({
      showLoader: true
    });
  }, [isLoaded, isSignedIn, loadAnnouncements]);

  /*
   * SignalR refresh.
   *
   * This runs silently so the complete slideshow
   * does not turn into a skeleton after every update.
   */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const stopRealtime = startAnnouncementRealtime(() => {
      console.log("Customer dashboard announcement update received.");

      void loadAnnouncements({
        showLoader: false
      });
    });

    return stopRealtime;
  }, [isLoaded, isSignedIn, loadAnnouncements]);

  /*
   * Respect reduced-motion settings.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    function handlePreferenceChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handlePreferenceChange);

    return () => {
      mediaQuery.removeEventListener("change", handlePreferenceChange);
    };
  }, []);

  /*
   * Automatic slideshow movement.
   *
   * A timeout restarts the full duration whenever
   * the customer changes slides manually.
   */
  useEffect(() => {
    if (announcements.length <= 1 || isPaused || prefersReducedMotion) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((currentIndex) =>
        currentIndex >= announcements.length - 1 ? 0 : currentIndex + 1
      );
    }, SLIDE_DURATION);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeIndex, announcements.length, isPaused, prefersReducedMotion]);

  /*
   * Protect against an invalid index when an
   * announcement is removed through SignalR.
   */
  useEffect(() => {
    if (announcements.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= announcements.length) {
      setActiveIndex(announcements.length - 1);
    }
  }, [announcements.length, activeIndex]);

  function goPrevious() {
    if (announcements.length <= 1) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? announcements.length - 1 : currentIndex - 1
    );
  }

  function goNext() {
    if (announcements.length <= 1) {
      return;
    }

    setActiveIndex((currentIndex) =>
      currentIndex >= announcements.length - 1 ? 0 : currentIndex + 1
    );
  }

  function openSlide(index: number) {
    if (index < 0 || index >= announcements.length) {
      return;
    }

    setActiveIndex(index);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    setIsPaused(true);
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }

  function handleTouchEnd() {
    const start = touchStartRef.current;

    const current = touchCurrentRef.current;

    if (start && current) {
      const horizontalDistance = current.x - start.x;

      const verticalDistance = current.y - start.y;

      const isHorizontalSwipe =
        Math.abs(horizontalDistance) >= SWIPE_THRESHOLD &&
        Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.2;

      if (isHorizontalSwipe) {
        if (horizontalDistance > 0) {
          goPrevious();
        } else {
          goNext();
        }
      }
    }

    touchStartRef.current = null;
    touchCurrentRef.current = null;

    setIsPaused(false);
  }

  if (loading) {
    return <AnnouncementsLoading />;
  }

  if (announcements.length === 0 && !error) {
    return null;
  }

  if (announcements.length === 0 && error) {
    return (
      <AnnouncementsError
        message={error}
        onRetry={() =>
          void loadAnnouncements({
            showLoader: true
          })
        }
      />
    );
  }

  return (
    <section
      aria-label="Customer dashboard announcements"
      aria-roledescription="carousel"
      tabIndex={announcements.length > 1 ? 0 : -1}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrevious();
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget as Node | null;

        if (
          !nextFocusedElement ||
          !event.currentTarget.contains(nextFocusedElement)
        ) {
          setIsPaused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="group relative self-start overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#1f1a12] text-white shadow-[0_24px_70px_-40px_rgba(31,26,18,0.75)] outline-none transition focus-visible:border-[#d6b46a] focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#0c0b09] sm:rounded-[1.75rem]"
    >
      <style>
        {`
          @keyframes dashboardAnnouncementProgress {
            from {
              transform: scaleX(0);
            }

            to {
              transform: scaleX(1);
            }
          }
        `}
      </style>

      {/* Top controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-sm backdrop-blur-md">
          <AnnouncementIcon />

          <span>Shop updates</span>

          {refreshing && (
            <span
              aria-label="Refreshing announcements"
              className="ml-1 h-2 w-2 animate-pulse rounded-full bg-[#d6b46a]"
            />
          )}
        </div>

        {announcements.length > 1 && (
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-white/15 bg-black/40 px-3 py-2 text-[10px] font-black tracking-[0.12em] text-white backdrop-blur-md sm:block">
              {String(activeIndex + 1).padStart(2, "0")}

              <span className="mx-1.5 text-white/45">/</span>

              {String(announcements.length).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous announcement"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:border-white/40 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              <ChevronLeftIcon />
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Next announcement"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white text-[#1f1a12] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#d6b46a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="absolute inset-x-4 top-20 z-30 rounded-xl border border-red-300/20 bg-red-950/80 px-4 py-3 text-xs font-bold text-red-100 shadow-lg backdrop-blur-md sm:inset-x-auto sm:right-5 sm:max-w-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => void loadAnnouncements()}
              className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition hover:bg-white/20"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Sliding track */}
      <div className="overflow-hidden">
        <div
          className="flex touch-pan-y transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translateX(-${activeIndex * 100}%)`
          }}
        >
          {announcements.map((announcement, index) => (
            <DashboardAnnouncementSlide
              key={announcement.announcementId}
              announcement={announcement}
              active={activeIndex === index}
              index={index}
              total={announcements.length}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      {announcements.length > 1 && (
        <footer className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 px-5 pb-5 sm:px-7 sm:pb-6">
          <p className="hidden text-[11px] font-bold text-white/60 sm:block"></p>

          <div className="mx-auto flex items-center gap-2 sm:mx-0">
            {announcements.map((announcement, index) => (
              <button
                key={announcement.announcementId}
                type="button"
                onClick={() => openSlide(index)}
                aria-label={`Open announcement ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`h-2 rounded-full shadow-sm transition-all duration-300 ${
                  activeIndex === index
                    ? "w-8 bg-[#d6b46a]"
                    : "w-2 bg-white/35 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </footer>
      )}

      {/* Automatic progress */}
      {announcements.length > 1 && !prefersReducedMotion && (
        <div className="absolute inset-x-0 bottom-0 z-40 h-1 overflow-hidden bg-white/10">
          <div
            key={activeIndex}
            className="h-full origin-left bg-[#d6b46a]"
            style={{
              animationName: "dashboardAnnouncementProgress",
              animationDuration: `${SLIDE_DURATION}ms`,
              animationTimingFunction: "linear",
              animationFillMode: "forwards",
              animationPlayState: isPaused ? "paused" : "running"
            }}
          />
        </div>
      )}
    </section>
  );
}

function DashboardAnnouncementSlide({
  announcement,
  active,
  index,
  total
}: {
  announcement: PublicAnnouncement;
  active: boolean;
  index: number;
  total: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [announcement.imageUrl]);

  const hasImage = Boolean(announcement.imageUrl) && !imageFailed;

  const hasAction =
    Boolean(announcement.buttonText) && Boolean(announcement.buttonLink);

  return (
    <article
      aria-hidden={!active}
      aria-live={active ? "polite" : "off"}
      aria-label={`Announcement ${index + 1} of ${total}`}
      aria-roledescription="slide"
      className={`relative min-h-[410px] min-w-full overflow-hidden sm:min-h-[440px] lg:min-h-[460px] ${
        active ? "" : "pointer-events-none"
      }`}
    >
      {/* Background image */}
      <div className="absolute inset-0 bg-[#11110f]">
        {hasImage ? (
          <img
            src={announcement.imageUrl!}
            alt=""
            loading={active ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 84% 18%, rgba(214,180,106,0.34), transparent 30%), radial-gradient(circle at 12% 90%, rgba(138,102,36,0.34), transparent 36%), linear-gradient(135deg, #1f1a12 0%, #342716 52%, #11110f 100%)"
            }}
          />
        )}
      </div>

      {/* Only one horizontal overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(12,11,9,0.86) 0%, rgba(12,11,9,0.68) 38%, rgba(12,11,9,0.22) 70%, rgba(12,11,9,0.06) 100%)"
        }}
      />

      {/* Only one bottom overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, rgba(12,11,9,0.78) 0%, rgba(12,11,9,0.10) 48%, rgba(12,11,9,0.14) 100%)"
        }}
      />

      {/* Subtle edge protection */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

      {!hasImage && (
        <>
          <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full border border-[#d6b46a]/20" />

          <div className="pointer-events-none absolute right-12 top-36 h-36 w-36 rounded-full border border-[#d6b46a]/15" />

          <div className="pointer-events-none absolute right-24 top-48 h-16 w-16 rounded-full bg-[#d6b46a]/15 blur-xl" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex min-h-[410px] items-end px-5 pb-16 pt-24 sm:min-h-[440px] sm:px-7 sm:pb-20 lg:min-h-[460px] lg:px-9">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6b46a]/40 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#f3d68e] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d6b46a]" />

              {formatAnnouncementType(announcement.announcementType)}
            </span>

            {announcement.priority >= 3 && (
              <span className="rounded-full border border-amber-300/30 bg-black/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-200 backdrop-blur-sm">
                {announcement.priority >= 4 ? "Urgent" : "Important"}
              </span>
            )}

            {announcement.endAt && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/80 sm:text-xs">
                <CalendarIcon />
                Available until {formatDate(announcement.endAt)}
              </span>
            )}
          </div>

          <h2 className="mt-5 max-w-3xl text-3xl font-black leading-[1.05] tracking-[-0.035em] text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
            {announcement.title}
          </h2>

          <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm font-semibold leading-6 text-white/80 drop-shadow-sm sm:text-base sm:leading-7">
            {announcement.message}
          </p>

          {hasAction && (
            <div className="mt-6">
              <SmartAnnouncementLink
                to={announcement.buttonLink!}
                tabIndex={active ? 0 : -1}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f7f5ef] px-6 py-3 text-sm font-black text-[#1f1a12] shadow-xl shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#d6b46a] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              >
                {announcement.buttonText}

                <ArrowUpRightIcon />
              </SmartAnnouncementLink>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AnnouncementsLoading() {
  return (
    <section
      aria-label="Loading customer announcements"
      className="relative min-h-[410px] overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#1f1a12] shadow-xl dark:border-[#302c24] sm:min-h-[440px] sm:rounded-[1.75rem]"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(214,180,106,0.22), transparent 30%), linear-gradient(135deg, #1f1a12, #11110f)"
        }}
      />

      <div className="absolute left-4 top-4 h-9 w-28 animate-pulse rounded-full bg-white/10 sm:left-5 sm:top-5" />

      <div className="relative flex min-h-[410px] items-end p-5 pb-16 sm:min-h-[440px] sm:p-8 sm:pb-20">
        <div className="w-full max-w-2xl">
          <div className="h-7 w-28 animate-pulse rounded-full bg-white/10" />

          <div className="mt-5 h-10 w-4/5 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-3 h-10 w-3/5 animate-pulse rounded-xl bg-white/10" />

          <div className="mt-5 h-4 w-full animate-pulse rounded bg-white/10" />

          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-white/10" />

          <div className="mt-6 h-12 w-36 animate-pulse rounded-xl bg-white/15" />
        </div>
      </div>
    </section>
  );
}

function AnnouncementsError({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-red-300/20 bg-[#1f1a12] p-6 text-white shadow-xl sm:rounded-[1.75rem]">
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative flex min-h-40 flex-col justify-center sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-lg font-black">Shop updates unavailable</p>

          <p className="mt-2 text-sm font-semibold text-white/60">{message}</p>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#1f1a12] transition hover:bg-[#d6b46a] sm:mt-0"
        >
          <RefreshIcon />
          Try again
        </button>
      </div>
    </section>
  );
}

function SmartAnnouncementLink({
  to,
  children,
  className,
  tabIndex
}: {
  to: string;
  children: ReactNode;
  className: string;
  tabIndex?: number;
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
        tabIndex={tabIndex}
      >
        {children}
      </a>
    );
  }

  if (isSpecial) {
    return (
      <a href={to} className={className} tabIndex={tabIndex}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} tabIndex={tabIndex}>
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

function AnnouncementIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 13V9l12-5v14L4 13Zm0 0v5h4v-3.3M18 8.5a4 4 0 0 1 0 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      className="h-3.5 w-3.5 shrink-0"
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

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M20 7v5h-5M4 17v-5h5M6.1 8.2A7 7 0 0 1 18.7 7M17.9 15.8A7 7 0 0 1 5.3 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CustomerDashboardAnnouncements;
