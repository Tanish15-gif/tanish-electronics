import { useApiAuth } from "../../hooks/useApiAuth";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCustomerNotifications,
  markAllCustomerNotificationsAsRead,
  markCustomerNotificationAsRead,
  type CustomerNotification
} from "../../Services/customerNotificationService";
import { NotificationIcon } from "../../components/layout/CustomerLayout";

function CustomerNotificationsPage() {
  const { getToken, isLoaded, isSignedIn } = useApiAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<CustomerNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.isRead);
    }

    return notifications;
  }, [notifications, filter]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    loadNotifications();
  }, [isLoaded, isSignedIn]);

  async function loadNotifications() {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }

  async function handleOpenNotification(notification: CustomerNotification) {
    try {
      const token = await getToken();

      if (!token) {
        setError("Please sign in again.");
        return;
      }

      if (!notification.isRead) {
        await markCustomerNotificationAsRead(
          notification.customerNotificationId,
          token
        );

        setNotifications((current) =>
          current.map((item) =>
            item.customerNotificationId === notification.customerNotificationId
              ? { ...item, isRead: true }
              : item
          )
        );
      }

      if (notification.serviceRequestId) {
        navigate(`/customer/repairs/${notification.serviceRequestId}`);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to open notification."
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        setError("Please sign in again.");
        return;
      }

      const result = await markAllCustomerNotificationsAsRead(token);

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true
        }))
      );

      setSuccess(result.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to mark notifications as read."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
            <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
              Loading notifications...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8">
      <title>Notifications</title>
      <section className="rounded-[2.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
        <div className="flex flex-col gap-6 border-b border-[#d8cdb6] pb-7 dark:border-[#302c24] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a6624] dark:text-[#d6b46a]">
              Customer Alerts
            </p>

            <h1 className="font-display mt-3 text-5xl font-bold leading-none">
              Notifications
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
              Track updates for repair status, pricing, and payment changes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/customer/repairs"
              className="inline-flex justify-center rounded-2xl border border-[#d8cdb6] bg-[#e8e3d8] px-5 py-3 text-sm font-black text-[#11110f] transition hover:bg-[#d6b46a] dark:border-[#302c24] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              My Repairs
            </Link>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={saving || unreadCount === 0}
              className="inline-flex justify-center rounded-2xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:bg-[#b9b0a0] disabled:text-[#4f4638] disabled:opacity-100 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] dark:disabled:bg-[#8f8778] dark:disabled:text-[#1f1a12]"
            >
              {saving ? "Updating..." : "Mark all read"}
            </button>
          </div>
        </div>

        {(error || success) && (
          <div className="mt-6 space-y-3">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full border px-5 py-2 text-sm font-black transition ${
              filter === "all"
                ? "border-[#d6b46a] bg-[#d6b46a] text-[#11110f]"
                : "border-[#d8cdb6] bg-[#fff8e7] text-[#1f1a12] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712]"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-full border px-5 py-2 text-sm font-black transition ${
              filter === "unread"
                ? "border-[#d6b46a] bg-[#d6b46a] text-[#11110f]"
                : "border-[#d8cdb6] bg-[#fff8e7] text-[#1f1a12] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712]"
            }`}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        </div>

        <div className="mt-7 space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d8cdb6] bg-[#fff8e7] p-10 text-center dark:border-[#302c24] dark:bg-[#11110f]">
              <p className="text-4xl flex items-center justify-center">
                <NotificationIcon />
              </p>

              <h2 className="font-display mt-4 text-3xl font-bold">
                No notifications
              </h2>

              <p className="mt-3 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                New repair updates will appear here.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.customerNotificationId}
                notification={notification}
                onOpen={() => handleOpenNotification(notification)}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function NotificationCard({
  notification,
  onOpen
}: {
  notification: CustomerNotification;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`block w-full rounded-[2rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
        notification.isRead
          ? "border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]"
          : "border-[#d6b46a]/60 bg-[#fff4cc] shadow-sm dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!notification.isRead && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#d6b46a]" />
            )}

            <h2 className="text-base font-black">{notification.title}</h2>
          </div>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
            {notification.message}
          </p>

          <p className="mt-3 text-xs font-bold text-[#8a6624] dark:text-[#d6b46a]">
            {formatDateTime(notification.createdAt)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${
            notification.isRead
              ? "border-[#d8cdb6] bg-[#fff8e7] text-[#1f1a12] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
              : "border-[#d6b46a] bg-[#d6b46a] text-[#11110f]"
          }`}
        >
          {notification.isRead ? "Read" : "New"}
        </span>
      </div>
    </button>
  );
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default CustomerNotificationsPage;
