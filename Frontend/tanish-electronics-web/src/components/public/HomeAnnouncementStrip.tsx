import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type TouchEvent
} from "react";
import { Link } from "react-router-dom";

import {
  getPublicAnnouncements,
  type PublicAnnouncement
} from "../../Services/publicAnnouncementService";

import { startAnnouncementRealtime } from "../../Services/announcementRealtimeService";
import { useShopSettings } from "../../hooks/useShopSettings";

const SLIDE_DURATION = 6000;
const SWIPE_THRESHOLD = 55;

function HomeAnnouncementStrip() {
  const { settings } = useShopSettings();
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [isPaused, setIsPaused] = useState(false);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPublicAnnouncements("Homepage", "All", 6);

      setAnnouncements(data);

      setActiveIndex((currentIndex) => {
        if (data.length === 0) {
          return 0;
        }

        return Math.min(currentIndex, data.length - 1);
      });
    } catch (error) {
      console.error("Failed to load homepage announcements:", error);

      setAnnouncements([]);
      setActiveIndex(0);
      setError("Shop updates could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Initial loading.
   */
  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  /*
   * Realtime updates through SignalR.
   */
  useEffect(() => {
    const stopRealtime = startAnnouncementRealtime(() => {
      console.log("Homepage announcement update received.");

      void loadAnnouncements();
    });

    return stopRealtime;
  }, [loadAnnouncements]);

  /*
   * Respect reduced-motion preferences.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setPrefersReducedMotion(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  /*
   * Automatically open the next slide.
   *
   * setTimeout means manual navigation restarts
   * the complete six-second duration.
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
  }, [announcements.length, activeIndex, isPaused, prefersReducedMotion]);

  /*
   * Keep the current index valid when realtime
   * data adds or removes announcements.
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

  function handleKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
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

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
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
        Math.abs(horizontalDistance) > SWIPE_THRESHOLD &&
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
    return <AnnouncementStripLoading />;
  }

  if (announcements.length === 0 && error) {
    return (
      <AnnouncementStripError
        message={error}
        onRetry={() => void loadAnnouncements()}
      />
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <section className="bg-transparent px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <style>
        {`
          @keyframes homeAnnouncementProgress {
            from {
              transform: scaleX(0);
            }

            to {
              transform: scaleX(1);
            }
          }
        `}
      </style>

      <div className="mx-auto max-w-7xl">
        {/* Section title */}
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a] sm:text-[11px]">
              Latest updates
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#1f1a12] dark:text-[#e8e3d8] sm:text-3xl">
              News from {settings.shopName}
            </h2>

            <p className="mt-2 hidden max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093] sm:block">
              Service notices, product updates and important shop information.
            </p>
          </div>

          {announcements.length > 1 && (
            <p className="shrink-0 rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-3 py-2 text-[11px] font-black text-[#817867] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#928a7d] lg:hidden">
              {String(activeIndex + 1).padStart(2, "0")}

              <span className="mx-1.5 opacity-50">/</span>

              {String(announcements.length).padStart(2, "0")}
            </p>
          )}
        </div>

        <article
          tabIndex={announcements.length > 1 ? 0 : -1}
          aria-label="Homepage announcements"
          aria-roledescription="carousel"
          onKeyDown={handleKeyboard}
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
          className="relative overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf8] shadow-[0_25px_70px_-45px_rgba(31,26,18,0.6)] outline-none transition focus-visible:border-[#d6b46a] focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#181612] lg:rounded-[2rem]"
        >
          {/* Sliding track */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="flex touch-pan-y transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`
            }}
          >
            {announcements.map((announcement, index) => {
              const nextIndex =
                index === announcements.length - 1 ? 0 : index + 1;

              return (
                <AnnouncementSlide
                  key={announcement.announcementId}
                  announcement={announcement}
                  nextAnnouncement={announcements[nextIndex]}
                  active={activeIndex === index}
                  index={index}
                  total={announcements.length}
                  onPrevious={goPrevious}
                  onNext={goNext}
                  onOpenNext={() => openSlide(nextIndex)}
                />
              );
            })}
          </div>

          {/* Mobile navigation */}
          {announcements.length > 1 && (
            <div className="relative z-20 flex items-center justify-between gap-4 border-t border-[#d8cdb6] bg-[#faf7f0] px-4 py-4 dark:border-[#302c24] dark:bg-[#13110e] sm:px-5 lg:hidden">
              <div className="flex min-w-0 items-center gap-2">
                {announcements.map((announcement, index) => (
                  <button
                    key={announcement.announcementId}
                    type="button"
                    onClick={() => openSlide(index)}
                    aria-label={`Open announcement ${index + 1}`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeIndex === index
                        ? "w-7 bg-[#8a6624] dark:bg-[#d6b46a]"
                        : "w-2 bg-[#d8cdb6] hover:bg-[#b8aa90] dark:bg-[#3a352c] dark:hover:bg-[#5b5346]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevious}
                  aria-label="Previous announcement"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-transparent text-[#1f1a12] transition hover:bg-[#f2eadb] active:scale-95 dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                >
                  <ChevronLeftIcon />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next announcement"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1a12] text-white transition hover:bg-[#352f26] active:scale-95 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}

          {/* Automatic progress */}
          {announcements.length > 1 && !prefersReducedMotion && (
            <div className="absolute inset-x-0 bottom-0 z-30 h-1 overflow-hidden bg-[#e8e1d4] dark:bg-[#2b2720]">
              <div
                key={activeIndex}
                className="h-full origin-left bg-[#b88932]"
                style={{
                  animationName: "homeAnnouncementProgress",
                  animationDuration: `${SLIDE_DURATION}ms`,
                  animationTimingFunction: "linear",
                  animationFillMode: "forwards",
                  animationPlayState: isPaused ? "paused" : "running"
                }}
              />
            </div>
          )}
        </article>

        {announcements.length > 1 && (
          <p className="mt-3 text-center text-[11px] font-semibold text-[#8a8172] dark:text-[#746d61] sm:hidden">
            Swipe left or right to view more updates
          </p>
        )}
      </div>
    </section>
  );
}

function AnnouncementSlide({
  announcement,
  nextAnnouncement,
  active,
  index,
  total,
  onPrevious,
  onNext,
  onOpenNext
}: {
  announcement: PublicAnnouncement;
  nextAnnouncement: PublicAnnouncement;
  active: boolean;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onOpenNext: () => void;
}) {
  const hasAction =
    Boolean(announcement.buttonText) && Boolean(announcement.buttonLink);

  return (
    <div
      aria-hidden={!active}
      aria-label={`${index + 1} of ${total}`}
      aria-roledescription="slide"
      className={`min-w-full ${active ? "" : "pointer-events-none"}`}
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_290px] xl:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main slide */}
        <div className="min-w-0 p-5 sm:min-h-[390px] sm:p-8 lg:p-10">
          <div
            className={`grid h-full gap-7 ${
              announcement.imageUrl
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-stretch"
                : ""
            }`}
          >
            {/* Text */}
            <div className="flex min-w-0 flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#d8cdb6] bg-[#f2eadb] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#725522] dark:border-[#302c24] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a] sm:text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d6b46a]" />

                    {formatAnnouncementType(announcement.announcementType)}
                  </span>

                  {announcement.endAt && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#817867] dark:text-[#928a7d] sm:text-xs">
                      <CalendarIcon />
                      Valid until {formatDate(announcement.endAt)}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 max-w-3xl text-[2rem] font-black leading-[1.08] tracking-[-0.035em] text-[#1f1a12] dark:text-[#f1ede5] sm:mt-6 sm:text-4xl lg:text-[2.65rem]">
                  {announcement.title}
                </h3>

                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093] sm:text-base sm:leading-7">
                  {announcement.message}
                </p>
              </div>

              {/* Actions */}
              <div
                className={`mt-7 grid gap-3 sm:flex sm:items-center ${
                  hasAction ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {hasAction && (
                  <SmartAnnouncementLink
                    to={announcement.buttonLink!}
                    tabIndex={active ? 0 : -1}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 py-3 text-center text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#352f26] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                  >
                    {announcement.buttonText}

                    <ArrowUpRightIcon />
                  </SmartAnnouncementLink>
                )}

                <a
                  href="tel:8850973399"
                  tabIndex={active ? 0 : -1}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-transparent px-5 py-3 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#3b372f] dark:text-[#e8e3d8] dark:hover:bg-[#242016] ${
                    hasAction ? "" : "sm:min-w-40"
                  }`}
                >
                  <PhoneIcon />
                  Call shop
                </a>
              </div>
            </div>

            {/* Image */}
            {announcement.imageUrl && (
              <div className="order-first overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffaf0] shadow-sm dark:border-[#302c24] dark:bg-[#11110f] lg:order-none">
                <div className="relative aspect-[16/10] w-full sm:aspect-[16/9] lg:h-full lg:min-h-[290px] lg:aspect-auto">
                  <AnnouncementImage
                    imageUrl={announcement.imageUrl}
                    title={announcement.title}
                    active={active}
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop navigation */}
        {total > 1 && (
          <aside className="hidden flex-col justify-between border-l border-[#d8cdb6] bg-[#faf7f0] p-7 dark:border-[#302c24] dark:bg-[#13110e] lg:flex xl:p-8">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#817867] dark:text-[#928a7d]">
                  Announcement
                </p>

                <p className="text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                  {String(index + 1).padStart(2, "0")}

                  <span className="mx-1.5 text-[#b0a795]">/</span>

                  {String(total).padStart(2, "0")}
                </p>
              </div>

              <div className="mt-8 border-t border-[#ddd4c3] pt-6 dark:border-[#302c24]">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#817867] dark:text-[#928a7d]">
                  Next update
                </p>

                <button
                  type="button"
                  tabIndex={active ? 0 : -1}
                  onClick={onOpenNext}
                  className="mt-3 line-clamp-4 text-left text-base font-black leading-6 text-[#1f1a12] transition hover:text-[#8a6624] focus-visible:outline-none focus-visible:text-[#8a6624] dark:text-[#e8e3d8] dark:hover:text-[#d6b46a]"
                >
                  {nextAnnouncement.title}
                </button>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3">
              <button
                type="button"
                tabIndex={active ? 0 : -1}
                onClick={onPrevious}
                aria-label="Previous announcement"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d8cdb6] bg-white text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                <ChevronLeftIcon />
              </button>

              <button
                type="button"
                tabIndex={active ? 0 : -1}
                onClick={onNext}
                aria-label="Next announcement"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1f1a12] text-white transition hover:bg-[#352f26] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function AnnouncementImage({
  imageUrl,
  title,
  active
}: {
  imageUrl: string;
  title: string;
  active: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (imageFailed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#f2eadb] text-[#8a6624] dark:bg-[#11110f] dark:text-[#d6b46a]">
        <div className="text-center">
          <ImageIcon />

          <p className="mt-2 text-xs font-black">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      loading={active ? "eager" : "lazy"}
      onError={() => setImageFailed(true)}
      className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
    />
  );
}

function AnnouncementStripLoading() {
  return (
    <section className="bg-transparent px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="h-3 w-28 animate-pulse rounded bg-[#e8dfcf] dark:bg-[#302c24]" />

        <div className="mt-3 h-8 w-72 max-w-full animate-pulse rounded-lg bg-[#e8dfcf] dark:bg-[#302c24]" />

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf8] p-5 dark:border-[#302c24] dark:bg-[#181612] sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <div className="h-7 w-28 animate-pulse rounded-full bg-[#eee5d4] dark:bg-[#302c24]" />

              <div className="mt-6 h-11 w-4/5 animate-pulse rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />

              <div className="mt-3 h-11 w-3/5 animate-pulse rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />

              <div className="mt-5 h-4 w-full animate-pulse rounded bg-[#f3ebdc] dark:bg-[#242016]" />

              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-[#f3ebdc] dark:bg-[#242016]" />

              <div className="mt-7 h-12 w-40 animate-pulse rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
            </div>

            <div className="aspect-[16/10] animate-pulse rounded-[1.5rem] bg-[#eee5d4] dark:bg-[#302c24] lg:aspect-auto lg:min-h-[290px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AnnouncementStripError({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="bg-[#f7f5ef] px-4 py-9 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <p className="text-sm font-black">Shop updates unavailable</p>

            <p className="mt-1 text-xs font-semibold">{message}</p>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-black transition hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:hover:bg-red-400/20 sm:mt-0"
          >
            <RefreshIcon />
            Try again
          </button>
        </div>
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
    return "Customer story";
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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7.5 4.5 10 8l-2 2c1.3 2.7 3.3 4.7 6 6l2-2 3.5 2.5c.3.2.5.6.4 1-.3 1.6-1.7 2.8-3.4 2.5C9.6 18.9 5.1 14.4 4 7.5 3.7 5.8 4.9 4.4 6.5 4.1c.4-.1.8.1 1 .4Z"
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

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mx-auto h-7 w-7"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle cx="8" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="m5 17 4-4 3 3 2-2 5 3"
        stroke="currentColor"
        strokeWidth="1.8"
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

export default HomeAnnouncementStrip;
