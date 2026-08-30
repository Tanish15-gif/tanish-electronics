import { useApiAuth } from "../../hooks/useApiAuth";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCustomerNotifications,
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
  type CustomerNotification
} from "../../Services/customerNotificationService";
import { startCustomerNotificationRealtime } from "../../Services/notificationRealtimeService";

function CustomerNotificationBell() {
  const { getToken, isLoaded, isSignedIn } = useApiAuth();
  const navigate = useNavigate();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);

  const [notifications, setNotifications] = useState<CustomerNotification[]>(
    []
  );

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 639px)").matches;
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const latestNotifications = notifications.slice(0, 5);

  /*
   * Detect whether the mobile or desktop notification layout should be used.
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    function updateMobileState() {
      setIsMobile(mediaQuery.matches);
    }

    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);

    return () => {
      mediaQuery.removeEventListener("change", updateMobileState);
    };
  }, []);

  /*
   * Load notifications initially, listen for real-time SignalR pushes,
   * and refresh when the tab becomes active.
   */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    loadNotifications(false);

    const unsubscribe = startCustomerNotificationRealtime((newNotification) => {
      setNotifications((current) => {
        if (
          current.some(
            (item) =>
              item.customerNotificationId ===
              newNotification.customerNotificationId
          )
        ) {
          return current;
        }
        return [newNotification, ...current];
      });
    });

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadNotifications(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, getToken]);

  /*
   * Close when the customer clicks outside the bell or notification panel.
   * The panel may be rendered in a portal, so both refs must be checked.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const clickedBellArea = dropdownRef.current?.contains(target) ?? false;

      const clickedNotificationPanel =
        panelRef.current?.contains(target) ?? false;

      if (!clickedBellArea && !clickedNotificationPanel) {
        closeNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  /*
   * Escape closes the panel.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeNotifications();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  /*
   * Stop the dashboard page from scrolling behind the mobile notification
   * sheet.
   */
  useEffect(() => {
    if (!open || !isMobile) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isMobile]);

  /*
   * Move keyboard focus into the opened notification panel.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    window.requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
  }, [open, isMobile]);

  async function loadNotifications(showLoader = true) {
    const shouldShowLoader = showLoader && notifications.length === 0;

    try {
      if (shouldShowLoader) {
        setLoading(true);
      }

      setError("");

      const token = await getToken();

      if (!token) {
        setError("Please sign in again.");
        return;
      }

      const data = await getCustomerNotifications(token);
      setNotifications(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load notifications."
      );
    } finally {
      if (shouldShowLoader) {
        setLoading(false);
      }
    }
  }

  function openNotifications() {
    setOpen(true);
    loadNotifications(true);
  }

  function closeNotifications(returnFocus = true) {
    setOpen(false);

    if (returnFocus) {
      window.requestAnimationFrame(() => {
        bellButtonRef.current?.focus();
      });
    }
  }

  function toggleNotifications() {
    if (open) {
      closeNotifications();
      return;
    }

    openNotifications();
  }

  async function handleNotificationClick(notification: CustomerNotification) {
    try {
      const token = await getToken();

      if (token && !notification.isRead) {
        await markCustomerNotificationAsRead(
          notification.customerNotificationId,
          token
        );

        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item.customerNotificationId === notification.customerNotificationId
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
        navigate(`/customer/repairs/${notification.serviceRequestId}`);
        return;
      }

      navigate("/customer/notifications");
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
        setError("Please sign in again.");
        return;
      }

      await markAllCustomerNotificationsAsRead(token);

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

  const notificationPanel = (
    <div
      ref={panelRef}
      id="customer-notification-panel"
      role="dialog"
      aria-modal={isMobile || undefined}
      aria-labelledby="customer-notification-title"
      tabIndex={-1}
      className={
        isMobile
          ? "fixed bottom-3 left-3 right-3 z-[500] flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl shadow-black/60 outline-none dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
          : "absolute right-0 top-full z-[500] mt-3 flex max-h-[560px] w-[400px] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl shadow-black/40 outline-none dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
      }
    >
      {/* Mobile drag indicator */}
      {isMobile && (
        <div className="flex shrink-0 justify-center bg-[#fffaf0] pt-2.5 dark:bg-[#11110f]">
          <span className="h-1 w-10 rounded-full bg-[#c8bfaf] dark:bg-[#494238]" />
        </div>
      )}

      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#d8cdb6] bg-[#fffaf0] px-5 py-4 dark:border-[#302c24] dark:bg-[#11110f]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="customer-notification-title" className="text-xl font-black">
              Notifications
            </h3>

            {unreadCount > 0 && (
              <span className="rounded-full bg-[#d6b46a]/20 px-2.5 py-1 text-[10px] font-black text-[#8a6624] dark:text-[#d6b46a]">
                {unreadCount} unread
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Repair and feedback updates
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs font-black text-[#8a6624] transition hover:text-[#5e4315] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#d6b46a] dark:hover:text-[#e9ca80]"
            >
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          )}

          {isMobile && (
            <button
              type="button"
              onClick={() => closeNotifications()}
              aria-label="Close notifications"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8cdb6] text-lg font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Notification content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {loading ? (
          <NotificationLoading />
        ) : latestNotifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="te-notification-scroll h-full overflow-y-auto overscroll-contain">
            {latestNotifications.map((notification) => (
              <NotificationRow
                key={notification.customerNotificationId}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 dark:border-[#302c24] dark:bg-[#11110f]">
        <Link
          to="/customer/notifications"
          onClick={() => setOpen(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
        >
          View all notifications
          <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Notification bell */}
      <button
        ref={bellButtonRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? "customer-notification-panel" : undefined}
        onClick={toggleNotifications}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] outline-none transition hover:bg-[#fff4cc] focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6b46a] px-1 text-[10px] font-black text-[#11110f] ring-2 ring-[#fffdf7] dark:ring-[#1a1712]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {isMobile
            ? createPortal(
                <>
                  {/* Mobile overlay */}
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => closeNotifications()}
                    className="fixed inset-0 z-[490] bg-black/55 backdrop-blur-[2px]"
                  />

                  {notificationPanel}
                </>,
                document.body
              )
            : notificationPanel}
        </>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onClick
}: {
  notification: CustomerNotification;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group block w-full border-b border-[#eadfca] px-5 py-4 text-left outline-none transition last:border-b-0 focus-visible:bg-[#f2eadb] dark:border-[#302c24] dark:focus-visible:bg-[#242016] ${
        notification.isRead
          ? "hover:bg-[#fff8e7] dark:hover:bg-[#211e18]"
          : "bg-[#fff8e7] hover:bg-[#f8eed9] dark:bg-[#211d16] dark:hover:bg-[#282219]"
      }`}
    >
      <div className="flex gap-3">
        {/* Unread indicator */}
        <div className="mt-1.5 w-2 shrink-0">
          {!notification.isRead && (
            <span className="block h-2 w-2 rounded-full bg-[#d6b46a]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`line-clamp-1 text-sm ${
                notification.isRead
                  ? "font-bold text-[#514a40] dark:text-[#b5ada0]"
                  : "font-black text-[#1f1a12] dark:text-[#e8e3d8]"
              }`}
            >
              {notification.title}
            </p>

            <p className="shrink-0 whitespace-nowrap text-[11px] font-bold text-[#8f8778] dark:text-[#827a6d]">
              {formatNotificationTime(notification.createdAt)}
            </p>
          </div>

          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {notification.message}
          </p>

          <div className="mt-2 flex items-center gap-1 text-[11px] font-black text-[#8a6624] opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 dark:text-[#d6b46a]">
            {notification.serviceRequestId
              ? "View repair"
              : "Open notification"}

            <ArrowRightIcon />
          </div>
        </div>
      </div>
    </button>
  );
}

function NotificationLoading() {
  return (
    <div className="flex min-h-[220px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin-fast rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

        <p className="mt-3 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          Loading notifications...
        </p>
      </div>
    </div>
  );
}

function EmptyNotifications() {
  return (
    <div className="flex min-h-[240px] items-center justify-center px-5 py-10 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          <BellIcon />
        </div>

        <h4 className="mt-4 text-lg font-black">You're all caught up</h4>

        <p className="mt-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          New repair updates will appear here.
        </p>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 17H9m10-1.5c-1.1-1.2-1.7-2.7-1.7-4.3V9a5.3 5.3 0 0 0-10.6 0v2.2c0 1.6-.6 3.1-1.7 4.3-.5.5-.1 1.5.7 1.5h12.6c.8 0 1.2-1 .7-1.5ZM14 20a2.2 2.2 0 0 1-4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

function formatNotificationTime(date: string) {
  const notificationDate = new Date(date);
  const now = new Date();

  const diffMs = Math.max(0, now.getTime() - notificationDate.getTime());

  const diffMinutes = Math.floor(diffMs / 60000);
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

export default CustomerNotificationBell;
