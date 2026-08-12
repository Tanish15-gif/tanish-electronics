import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  type AdminNotification
} from "../../Services/adminNotificationService";

type PanelPosition = {
  top: number;
  right: number;
};

const mobileBreakpoint = 640;

function AdminNotificationBell() {
  const { getToken, isLoaded, isSignedIn } = useApiAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const [error, setError] = useState("");

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.innerWidth < mobileBreakpoint;
  });

  const [panelPosition, setPanelPosition] = useState<PanelPosition>({
    top: 76,
    right: 16
  });

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const latestNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications]
  );

  const loadNotifications = useCallback(
    async (showLoader = true) => {
      if (!isLoaded || !isSignedIn) {
        setNotifications([]);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError("");

        const token = await getToken();

        if (!token) {
          setError("Your session has expired. Please sign in again.");

          return;
        }

        const data = await getAdminNotifications(token);

        setNotifications(data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load notifications."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [getToken, isLoaded, isSignedIn]
  );

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current || window.innerWidth < mobileBreakpoint) {
      return;
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();

    setPanelPosition({
      top: buttonRect.bottom + 10,
      right: Math.max(16, window.innerWidth - buttonRect.right)
    });
  }, []);

  /*
   * Initial loading and background polling.
   */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    void loadNotifications(false);

    const intervalId = window.setInterval(() => {
      void loadNotifications(false);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoaded, isSignedIn, loadNotifications]);

  /*
   * Track mobile and desktop breakpoint.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${mobileBreakpoint - 1}px)`
    );

    function handleScreenChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);

      if (!event.matches) {
        window.requestAnimationFrame(updatePanelPosition);
      }
    }

    setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleScreenChange);

    return () => {
      mediaQuery.removeEventListener("change", handleScreenChange);
    };
  }, [updatePanelPosition]);

  useEffect(() => {
    if (!open || isMobile) {
      return;
    }

    updatePanelPosition();

    function handlePositionChange() {
      updatePanelPosition();
    }

    window.addEventListener("resize", handlePositionChange);

    window.addEventListener("scroll", handlePositionChange, true);

    return () => {
      window.removeEventListener("resize", handlePositionChange);

      window.removeEventListener("scroll", handlePositionChange, true);
    };
  }, [open, isMobile, updatePanelPosition]);

  /*
   * Close after route navigation.
   */
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  /*
   * Escape key and initial focus.
   */
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    if (isMobile) {
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isMobile]);

  /*
   * Lock background scrolling when the
   * mobile bottom sheet is open.
   */
  useEffect(() => {
    if (!open || !isMobile) {
      return;
    }

    const scrollPosition = window.scrollY;

    const previousStyles = {
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

    return () => {
      document.body.style.position = previousStyles.position;

      document.body.style.top = previousStyles.top;

      document.body.style.left = previousStyles.left;

      document.body.style.right = previousStyles.right;

      document.body.style.width = previousStyles.width;

      document.body.style.overflow = previousStyles.overflow;

      window.scrollTo(0, scrollPosition);
    };
  }, [open, isMobile]);

  async function handleToggle() {
    const nextOpenState = !open;

    setOpen(nextOpenState);

    if (nextOpenState) {
      setError("");

      if (!isMobile) {
        updatePanelPosition();
      }

      await loadNotifications(true);
    }
  }

  async function handleNotificationClick(notification: AdminNotification) {
    try {
      const token = await getToken();

      if (!token) {
        setError("Your session has expired. Please sign in again.");

        return;
      }

      if (!notification.isRead) {
        await markAdminNotificationAsRead(
          notification.adminNotificationId,
          token
        );

        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.adminNotificationId === notification.adminNotificationId
              ? {
                  ...item,
                  isRead: true
                }
              : item
          )
        );
      }

      setOpen(false);

      if (notification.serviceRequestId) {
        navigate(`/admin/service-requests/${notification.serviceRequestId}`);

        return;
      }

      if (notification.notificationType?.toLowerCase().includes("enquiry")) {
        if (notification.enquiryId) {
          navigate(`/admin/enquiries/${notification.enquiryId}`);
        } else {
          navigate("/admin/enquiries");
        }

        return;
      }

      if (notification.productId) {
        navigate(`/admin/products/${notification.productId}/edit`);

        return;
      }

      navigate("/admin/notifications");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to open notification."
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      setMarkingAll(true);
      setError("");

      const token = await getToken();

      if (!token) {
        setError("Your session has expired. Please sign in again.");

        return;
      }

      await markAllAdminNotificationsAsRead(token);

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true
        }))
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  const desktopPanelStyles: CSSProperties | undefined = isMobile
    ? undefined
    : {
        top: panelPosition.top,
        right: panelPosition.right
      };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void handleToggle()}
        aria-label={
          unreadCount > 0
            ? `Open notifications, ${unreadCount} unread`
            : "Open notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className="cursor-pointer relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] transition hover:border-[#c7b98e] hover:bg-[#fff4cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:border-[#50483b] dark:hover:bg-[#242016]"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6b46a] px-1 text-[10px] font-black text-[#11110f] ring-2 ring-[#f7f5ef] dark:ring-[#11110f]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="te-modal-scroll fixed inset-0 z-[800]">
            {/* Backdrop */}
            <div
              role="presentation"
              onMouseDown={() => setOpen(false)}
              className={`absolute inset-0 transition-opacity ${
                isMobile ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
              }`}
            />

            <section
              role="dialog"
              aria-modal={isMobile}
              aria-label="Admin notifications"
              style={desktopPanelStyles}
              onMouseDown={(event) => event.stopPropagation()}
              className={`flex overflow-hidden border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl shadow-black/30 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] ${
                isMobile
                  ? "absolute inset-x-0 bottom-0 max-h-[82dvh] flex-col rounded-t-[1.5rem]"
                  : "fixed max-h-[calc(100vh-5rem)] w-[390px] flex-col rounded-[1.25rem]"
              }`}
            >
              {/* Mobile drag indicator */}
              {isMobile && (
                <div className="flex shrink-0 justify-center pt-2.5">
                  <span className="h-1 w-10 rounded-full bg-[#d8cdb6] dark:bg-[#4a443a]" />
                </div>
              )}

              {/* Header */}
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#d8cdb6] bg-[#fffaf0] px-4 py-4 dark:border-[#302c24] dark:bg-[#11110f] sm:px-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black sm:text-xl">
                      Notifications
                    </h2>

                    {unreadCount > 0 && (
                      <span className="rounded-full bg-[#d6b46a] px-2 py-0.5 text-[10px] font-black text-[#11110f]">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                    Latest admin alerts
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMarkAllRead()}
                    disabled={markingAll || unreadCount === 0}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 text-[11px] font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
                  >
                    {markingAll ? "Marking..." : "Mark all"}
                  </button>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </header>

              {error && (
                <div
                  role="alert"
                  className="mx-4 mt-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              {/* Notification content */}
              <div className="te-notification-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loading ? (
                  <NotificationLoadingState />
                ) : latestNotifications.length === 0 ? (
                  <NotificationEmptyState />
                ) : (
                  latestNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.adminNotificationId}
                      notification={notification}
                      onClick={() => void handleNotificationClick(notification)}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <footer className="shrink-0 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 dark:border-[#302c24] dark:bg-[#11110f] sm:pb-4">
                <Link
                  to="/admin/notifications"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  View all notifications
                  <ArrowRightIcon />
                </Link>
              </footer>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}

function NotificationItem({
  notification,
  onClick
}: {
  notification: AdminNotification;
  onClick: () => void;
}) {
  const notificationType = notification.notificationType || "Update";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group block w-full border-b border-[#eadfca] px-4 py-4 text-left transition last:border-b-0 dark:border-[#302c24] sm:px-5 ${
        notification.isRead
          ? "bg-transparent hover:bg-[#fff8e7] dark:hover:bg-[#11110f]"
          : "bg-[#fff4cc]/75 hover:bg-[#ffeab0] dark:bg-[#d6b46a]/10 dark:hover:bg-[#d6b46a]/15"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            notification.isRead
              ? "bg-[#f2eadb] text-[#817867] dark:bg-[#242016] dark:text-[#928a7d]"
              : "bg-[#d6b46a] text-[#11110f]"
          }`}
        >
          <NotificationTypeIcon type={notificationType} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-sm font-black leading-5">
              {notification.title}
            </h3>

            {!notification.isRead && (
              <span
                aria-label="Unread"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#d6b46a]"
              />
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {notification.message}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[#d8cdb6] bg-[#fffdf7] px-2 py-1 text-[9px] font-black uppercase tracking-[0.06em] text-[#8a6624] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]">
              {notificationType}
            </span>

            <span className="text-[10px] font-bold text-[#8f8778]">
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function NotificationLoadingState() {
  return (
    <div className="flex min-h-[220px] items-center justify-center px-5 py-10">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

        <p className="mt-3 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          Loading notifications...
        </p>
      </div>
    </div>
  );
}

function NotificationEmptyState() {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <BellIcon />
      </span>

      <h3 className="mt-4 text-base font-black">No notifications</h3>

      <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
        New repair requests, enquiries and product updates will appear here.
      </p>
    </div>
  );
}

function NotificationTypeIcon({ type }: { type: string }) {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("enquiry")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path
          d="M5 5h14v11H9l-4 3V5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M8 9h8M8 12h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (normalizedType.includes("product")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path
          d="M4 7h16v13H4V7Zm3 0a5 5 0 0 1 10 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="m14 6 4-2 2 2-2 4-4 1-5 5-3-3 5-5 1-4 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M15 17H9m10-1.5c-1.1-1.2-1.7-2.7-1.7-4.3V9a5.3 5.3 0 0 0-10.6 0v2.2c0 1.6-.6 3.1-1.7 4.3-.5.5-.1 1.5.7 1.5h12.6c.8 0 1.2-1 .7-1.5ZM14 20a2.2 2.2 0 0 1-4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatNotificationTime(date: string) {
  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) {
    return "Recently";
  }

  const now = new Date();

  const diffMilliseconds = now.getTime() - notificationDate.getTime();

  const diffMinutes = Math.max(0, Math.floor(diffMilliseconds / 60000));

  const diffHours = Math.floor(diffMinutes / 60);

  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return notificationDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default AdminNotificationBell;
