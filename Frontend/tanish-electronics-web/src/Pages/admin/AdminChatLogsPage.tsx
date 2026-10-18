import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Wrench,
  X
} from "lucide-react";
import { useApiAuth } from "../../hooks/useApiAuth";
import { useShopSettings } from "../../hooks/useShopSettings";
import {
  getAdminChatLogs,
  getAdminChatSession,
  getAdminChatStats,
  type ChatLogItem,
  type ChatLogStats,
  type ChatSessionDetail
} from "../../Services/adminChatLogService";

const MUTED = "text-[#716958] dark:text-[#b3aa99]";
const BUTTON =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 text-xs font-medium transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a4803e] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3a342a] dark:bg-[#1a1712] dark:hover:bg-[#292319]";
const INPUT =
  "min-h-11 min-w-0 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 text-sm outline-none transition placeholder:text-[#928a7d] focus:border-[#a4803e] focus:ring-2 focus:ring-[#a4803e]/20 dark:border-[#3a342a] dark:bg-[#11110f]";
const EMPTY_FILTERS = { search: "", from: "", to: "" };
const PAGE_SIZE = 15;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
}
function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown time"
    : date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
}
function initialsFor(name?: string | null) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || null
  );
}
function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminChatLogsPage() {
  const { getToken } = useApiAuth();
  const { settings } = useShopSettings();
  const [logs, setLogs] = useState<ChatLogItem[]>([]);
  const [stats, setStats] = useState<ChatLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterError, setFilterError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedSession, setSelectedSession] = useState<ChatLogItem | null>(
    null
  );
  const hasFilters = Boolean(filters.search || filters.from || filters.to);

  useEffect(() => {
    const previousTitle = document.title;
    document.title =
      "AI Chat Logs | " + (settings.shopName || "Tanish Electronics");
    return () => {
      document.title = previousTitle;
    };
  }, [settings.shopName]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSessions() {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        if (!token) throw new Error("Your session has expired. Sign in again.");
        if (controller.signal.aborted) return;
        const result = await getAdminChatLogs(
          token,
          {
            page,
            pageSize: PAGE_SIZE,
            search: filters.search,
            from: filters.from ? filters.from + "T00:00:00" : undefined,
            to: filters.to ? filters.to + "T23:59:59.999" : undefined
          },
          controller.signal
        );
        if (controller.signal.aborted) return;
        const pages = Math.max(1, result.totalPages);
        if (page > pages) {
          setPage(pages);
          return;
        }
        setLogs(result.items);
        setTotalRecords(result.totalRecords);
        setTotalPages(pages);
        setLastRefreshed(new Date());
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            errorMessage(err, "Couldn't load conversations. Try again.")
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadSessions();
    return () => controller.abort();
  }, [
    getToken,
    page,
    filters.search,
    filters.from,
    filters.to,
    refreshVersion
  ]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadStats() {
      setStatsLoading(true);
      setStatsError("");
      try {
        const token = await getToken();
        if (!token) throw new Error("Sign in to view the summary.");
        if (controller.signal.aborted) return;
        const result = await getAdminChatStats(token, controller.signal);
        if (!controller.signal.aborted) setStats(result);
      } catch {
        if (!controller.signal.aborted)
          setStatsError("Summary couldn't refresh. Refresh to try again.");
      } finally {
        if (!controller.signal.aborted) setStatsLoading(false);
      }
    }
    void loadStats();
    return () => controller.abort();
  }, [getToken, refreshVersion]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) {
      setFilterError("Choose an end date on or after the start date.");
      return;
    }
    setFilterError("");
    setPage(1);
    setFilters({ ...draft, search: draft.search.trim() });
  }
  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    setFilterError("");
    setPage(1);
  }

  return (
    <div
      style={{ fontFamily: "var(--font-ui)" }}
      className="mx-auto max-w-7xl px-4 py-6 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 lg:px-8"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className={
              "text-[11px] font-medium uppercase tracking-[0.12em] " + MUTED
            }
          >
            Assistant activity
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            AI chat conversations
          </h1>
          <p className={"mt-2 max-w-2xl text-sm leading-6 " + MUTED}>
            Review customer questions, assistant replies and the bookings or
            enquiries they created.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setRefreshVersion((v) => v + 1)}
            disabled={loading || statsLoading}
            className={BUTTON}
          >
            <RefreshCw
              className={
                "h-4 w-4 " +
                (loading || statsLoading
                  ? "animate-spin motion-reduce:animate-none"
                  : "")
              }
            />
            {loading || statsLoading ? "Refreshing..." : "Refresh"}
          </button>
          {lastRefreshed && (
            <p className={"text-[11px] " + MUTED}>
              Updated {formatTime(lastRefreshed.toISOString())}
            </p>
          )}
        </div>
      </header>

      <section aria-label="Conversation summary" className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className={"text-xs " + MUTED}>Overall activity</p>
          {statsError && (
            <p
              role="status"
              className="text-xs text-amber-700 dark:text-amber-300"
            >
              {statsError}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatTile
            icon={<MessageSquare size={16} />}
            label="Conversations"
            value={stats?.totalSessions}
          />
          <StatTile
            icon={<Sparkles size={16} />}
            label="Logged turns"
            value={stats?.totalMessages}
          />
          <StatTile
            icon={<Wrench size={16} />}
            label="Bookings logged"
            value={stats?.bookingsTriggered}
          />
          <StatTile
            icon={<HelpCircle size={16} />}
            label="Enquiries logged"
            value={stats?.enquiriesTriggered}
          />
          <StatTile
            icon={<Clock size={16} />}
            label="Started today"
            value={stats?.sessionsToday}
          />
        </div>
      </section>

      <section
        aria-labelledby="conversation-list-title"
        className="mt-6 overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
      >
        <div className="border-b border-[#e8dfce] p-4 dark:border-[#302c24] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="conversation-list-title" className="text-sm font-semibold">
              Conversation history
            </h2>
            <p className={"text-xs " + MUTED}>
              {hasFilters ? "Filtered results" : "Most recent activity first"}
            </p>
          </div>
          <form onSubmit={applyFilters}>
            <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_155px_155px_auto]">
              <label className="block min-w-0">
                <span className={"mb-1.5 block text-xs " + MUTED}>
                  Search conversations
                </span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#928a7d]" />
                  <input
                    type="search"
                    value={draft.search}
                    onChange={(e) =>
                      setDraft({ ...draft, search: e.target.value })
                    }
                    placeholder="Customer name or message text"
                    className={INPUT + " w-full pl-9"}
                  />
                </span>
              </label>
              <label className="block">
                <span className={"mb-1.5 block text-xs " + MUTED}>
                  Started from
                </span>
                <input
                  type="date"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                  className={INPUT + " w-full"}
                />
              </label>
              <label className="block">
                <span className={"mb-1.5 block text-xs " + MUTED}>
                  Started through
                </span>
                <input
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                  className={INPUT + " w-full"}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={
                    BUTTON +
                    " min-h-11 border-[#272116] bg-[#272116] text-[#fffaf0] hover:bg-[#493b24] dark:border-[#d6b46a] dark:bg-[#d6b46a] dark:text-[#1a1712] dark:hover:bg-[#e3c786]"
                  }
                >
                  Apply
                </button>
                {(hasFilters || draft.search || draft.from || draft.to) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={BUTTON + " min-h-11"}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            {filterError && (
              <p
                role="alert"
                className="mt-3 text-xs text-red-700 dark:text-red-300"
              >
                {filterError}
              </p>
            )}
          </form>
        </div>

        <div aria-busy={loading}>
          {loading ? (
            <div
              role="status"
              className={
                "flex min-h-64 flex-col items-center justify-center gap-3 text-sm " +
                MUTED
              }
            >
              <RefreshCw className="h-5 w-5 animate-spin text-[#a4803e] motion-reduce:animate-none" />
              Loading conversations...
            </div>
          ) : error ? (
            <div role="alert" className="p-8 text-center">
              <p className="text-sm font-semibold">
                Couldn't load conversations
              </p>
              <p className={"mt-2 text-sm " + MUTED}>{error}</p>
              <button
                type="button"
                onClick={() => setRefreshVersion((v) => v + 1)}
                className={BUTTON + " mt-4"}
              >
                Try again
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-[#a4803e]" />
              <h3 className="mt-4 text-sm font-semibold">
                {hasFilters
                  ? "No matching conversations"
                  : "No conversations yet"}
              </h3>
              <p className={"mt-2 text-sm " + MUTED}>
                {hasFilters
                  ? "Try a different search or widen the session start dates."
                  : "Saved assistant conversations will appear here."}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={BUTTON + " mt-4"}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">
                Customer conversations ordered by latest activity
              </caption>
              <thead
                className={
                  "border-b border-[#e8dfce] bg-[#f7f5ef] text-[11px] dark:border-[#302c24] dark:bg-[#15130f] " +
                  MUTED
                }
              >
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium sm:px-5">
                    Customer / visitor
                  </th>
                  <th
                    scope="col"
                    className="hidden w-20 px-3 py-3 font-medium md:table-cell"
                  >
                    Turns
                  </th>
                  <th
                    scope="col"
                    className="hidden w-44 px-3 py-3 font-medium sm:table-cell"
                  >
                    Outcome
                  </th>
                  <th
                    scope="col"
                    className="hidden w-40 px-3 py-3 font-medium lg:table-cell"
                  >
                    Last activity
                  </th>
                  <th
                    scope="col"
                    className="w-20 px-4 py-3 text-right font-medium sm:w-28 sm:px-5"
                  >
                    <span className="sr-only">View conversation</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8dfce] dark:divide-[#302c24]">
                {logs.map((item) => (
                  <tr
                    key={item.chatSessionId}
                    className="transition hover:bg-[#f7f2e8] dark:hover:bg-[#211d16]"
                  >
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f2eadb] text-[11px] font-semibold text-[#8a6624] dark:bg-[#2b251a] dark:text-[#d6b46a]"
                        >
                          {initialsFor(item.userName) || <User size={16} />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="truncate text-[13px] font-semibold">
                              {item.userName || "Guest visitor"}
                            </span>
                            <span
                              className={"text-[10px] tabular-nums " + MUTED}
                            >
                              #{item.chatSessionId}
                            </span>
                          </div>
                          {item.userPhone && (
                            <p className={"mt-1 text-xs tabular-nums " + MUTED}>
                              {item.userPhone}
                            </p>
                          )}
                          <p className={"mt-1 text-[11px] lg:hidden " + MUTED}>
                            {formatDate(item.lastMessageAt)} at{" "}
                            {formatTime(item.lastMessageAt)}
                          </p>
                          <div className="mt-2 sm:hidden">
                            <OutcomeBadges
                              booking={item.hasBooking}
                              enquiry={item.hasEnquiry}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      title="One turn contains a visitor message and an assistant reply"
                      className={
                        "hidden px-3 py-4 text-xs tabular-nums md:table-cell " +
                        MUTED
                      }
                    >
                      {item.messageCount.toLocaleString("en-IN")}
                    </td>
                    <td className="hidden px-3 py-4 sm:table-cell">
                      <OutcomeBadges
                        booking={item.hasBooking}
                        enquiry={item.hasEnquiry}
                      />
                    </td>
                    <td
                      className={
                        "hidden px-3 py-4 text-[11px] tabular-nums lg:table-cell " +
                        MUTED
                      }
                    >
                      <p className="font-medium text-[#1f1a12] dark:text-[#e8e3d8]">
                        {formatDate(item.lastMessageAt)}
                      </p>
                      <p className="mt-1">{formatTime(item.lastMessageAt)}</p>
                    </td>
                    <td className="px-4 py-4 text-right sm:px-5">
                      <button
                        type="button"
                        onClick={() => setSelectedSession(item)}
                        aria-label={
                          "View conversation " +
                          item.chatSessionId +
                          " with " +
                          (item.userName || "guest visitor")
                        }
                        className={BUTTON + " px-2 sm:px-3"}
                      >
                        <span>View</span>
                        <ChevronRight size={14} className="hidden sm:block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8dfce] px-4 py-3 dark:border-[#302c24] sm:px-5">
          <p role="status" className={"text-xs " + MUTED}>
            {loading
              ? "Updating results..."
              : error
                ? "Results unavailable"
                : totalRecords > 0
                  ? "Showing " +
                    ((page - 1) * PAGE_SIZE + 1) +
                    "-" +
                    Math.min(page * PAGE_SIZE, totalRecords) +
                    " of " +
                    totalRecords.toLocaleString("en-IN") +
                    " conversations"
                  : "0 conversations"}
          </p>
          <nav
            aria-label="Conversation pagination"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              aria-label="Previous page"
              disabled={loading || Boolean(error) || page <= 1}
              onClick={() => setPage((v) => v - 1)}
              className={BUTTON + " px-2"}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={"px-1 text-xs tabular-nums " + MUTED}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={loading || Boolean(error) || page >= totalPages}
              onClick={() => setPage((v) => v + 1)}
              className={BUTTON + " px-2"}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </footer>
      </section>
      {selectedSession && (
        <ConversationDialog
          key={selectedSession.chatSessionId}
          session={selectedSession}
          shopName={settings.shopName || "Tanish Electronics"}
          getToken={getToken}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 py-4 dark:border-[#302c24] dark:bg-[#1a1712]">
      <div
        className={"flex items-center justify-between gap-2 text-xs " + MUTED}
      >
        <span>{label}</span>
        <span aria-hidden="true" className="text-[#a4803e] dark:text-[#d6b46a]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums">
        {value === undefined ? "--" : value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
function OutcomeBadges({
  booking,
  enquiry
}: {
  booking: boolean;
  enquiry: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {booking && (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          <Wrench size={11} />
          Booking
        </span>
      )}
      {enquiry && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <HelpCircle size={11} />
          Enquiry
        </span>
      )}
      {!booking && !enquiry && (
        <span className={"text-[11px] " + MUTED}>General</span>
      )}
    </div>
  );
}

function ConversationDialog({
  session,
  shopName,
  getToken,
  onClose
}: {
  session: ChatLogItem;
  shopName: string;
  getToken: () => Promise<string | null>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<ChatSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );
  const visitorName = detail?.userName || session.userName || "Guest visitor";
  const startedAt = detail?.startedAt || session.startedAt;

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTranscript() {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        if (!token) throw new Error("Your session has expired. Sign in again.");
        if (controller.signal.aborted) return;
        const result = await getAdminChatSession(
          token,
          session.chatSessionId,
          controller.signal
        );
        if (!controller.signal.aborted) setDetail(result);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(errorMessage(err, "Couldn't load this transcript."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadTranscript();
    return () => controller.abort();
  }, [getToken, session.chatSessionId, retry]);

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  async function copyTranscript() {
    if (!detail) return;
    const text = [
      "Conversation #" + session.chatSessionId + " - " + visitorName,
      "Started " + formatDate(startedAt) + " at " + formatTime(startedAt),
      ...detail.messages.flatMap((message) => [
        "",
        "Visitor (" + formatTime(message.createdAt) + ")",
        message.userMessage,
        "",
        shopName + " Assistant",
        message.botReply
      ])
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="chat-transcript-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{ fontFamily: "var(--font-ui)" }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#f7f5ef] p-0 text-[#1f1a12] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:border-[#3a342a] dark:bg-[#11110f] dark:text-[#e8e3d8]"
    >
      <div className="flex h-[min(800px,calc(100dvh-2rem))] min-h-0 flex-col">
        <header className="shrink-0 border-b border-[#d8cdb6] bg-[#fffdf7] px-4 py-4 dark:border-[#302c24] dark:bg-[#1a1712] sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className={
                  "text-[10px] font-medium uppercase tracking-[0.12em] " + MUTED
                }
              >
                Conversation #{session.chatSessionId}
              </p>
              <h2
                id="chat-transcript-title"
                className="mt-1 truncate text-lg font-semibold"
              >
                {visitorName}
              </h2>
              <p className={"mt-1 text-xs " + MUTED}>
                Started {formatDate(startedAt)} at {formatTime(startedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close transcript"
              className={BUTTON + " h-10 w-10 shrink-0 px-0"}
            >
              <X size={18} />
            </button>
          </div>
          <details className="mt-3 text-xs">
            <summary
              className={
                "w-fit cursor-pointer rounded py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a4803e] " +
                MUTED
              }
            >
              Session details
            </summary>
            <dl className="mt-2 grid gap-3 rounded-xl border border-[#e8dfce] bg-[#f7f5ef] p-3 dark:border-[#302c24] dark:bg-[#11110f] sm:grid-cols-2">
              <div>
                <dt className={MUTED}>Phone</dt>
                <dd className="mt-1">
                  {detail?.userPhone || session.userPhone || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className={MUTED}>IP address</dt>
                <dd className="mt-1 break-all">
                  {session.ipAddress || "Not recorded"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={MUTED}>Session key</dt>
                <dd className="mt-1 break-all font-mono text-[11px]">
                  {session.sessionKey}
                </dd>
              </div>
            </dl>
          </details>
        </header>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e8dfce] px-4 py-2 dark:border-[#302c24] sm:px-6">
          <p className={"text-[11px] " + MUTED}>
            Oldest first
            {detail
              ? " / " +
                detail.messages.length +
                (detail.messages.length === 1 ? " turn" : " turns")
              : ""}
          </p>
          <button
            type="button"
            disabled={loading || Boolean(error) || !detail?.messages.length}
            onClick={() =>
              bodyRef.current?.scrollTo({
                top: bodyRef.current.scrollHeight,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth"
              })
            }
            className={
              BUTTON +
              " min-h-8 border-transparent bg-transparent text-[11px] dark:border-transparent dark:bg-transparent"
            }
          >
            <ArrowDown size={13} />
            Latest message
          </button>
        </div>
        <div
          ref={bodyRef}
          aria-busy={loading}
          className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
        >
          {loading ? (
            <div
              role="status"
              className={
                "flex h-full min-h-40 flex-col items-center justify-center gap-3 text-sm " +
                MUTED
              }
            >
              <RefreshCw className="h-5 w-5 animate-spin motion-reduce:animate-none" />
              Loading transcript...
            </div>
          ) : error ? (
            <div role="alert" className="py-12 text-center">
              <h3 className="text-sm font-semibold">Transcript unavailable</h3>
              <p className={"mt-2 text-sm " + MUTED}>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((v) => v + 1)}
                className={BUTTON + " mt-4"}
              >
                Try again
              </button>
            </div>
          ) : !detail?.messages.length ? (
            <p className={"py-12 text-center text-sm " + MUTED}>
              No messages were recorded in this conversation.
            </p>
          ) : (
            <div className="space-y-7">
              {detail.messages.map((message, index) => (
                <article
                  key={message.chatMessageId || index}
                  aria-label={"Turn " + (index + 1)}
                  className="space-y-3"
                >
                  {(index === 0 ||
                    formatDate(message.createdAt) !==
                      formatDate(detail.messages[index - 1].createdAt)) && (
                    <p className={"py-2 text-center text-[11px] " + MUTED}>
                      {formatDate(message.createdAt)}
                    </p>
                  )}
                  <div className="ml-auto max-w-[94%] sm:max-w-[85%]">
                    <div
                      className={
                        "mb-1.5 flex items-center justify-end gap-2 text-[10px] " +
                        MUTED
                      }
                    >
                      <span className="font-medium">
                        {visitorName === "Guest visitor"
                          ? "Visitor"
                          : visitorName}
                      </span>
                      <time dateTime={message.createdAt}>
                        {formatTime(message.createdAt)}
                      </time>
                    </div>
                    <div className="rounded-2xl rounded-tr-sm border border-[#ddc68c] bg-[#f4e7c8] px-4 py-3 text-[13px] leading-6 text-[#33291b] dark:border-[#57472b] dark:bg-[#302819] dark:text-[#f0e2c4]">
                      <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {message.userMessage || "No visitor text recorded."}
                      </p>
                    </div>
                  </div>
                  <div className="max-w-[97%] sm:max-w-[94%]">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-[#8a6624] dark:text-[#d6b46a]">
                      <Sparkles size={12} />
                      {shopName} Assistant
                    </p>
                    <div className="rounded-2xl rounded-tl-sm border border-[#d8cdb6] bg-[#fffdf7] px-4 py-4 text-[13px] leading-6 dark:border-[#302c24] dark:bg-[#1a1712]">
                      <TranscriptText
                        text={
                          message.botReply || "No assistant reply recorded."
                        }
                      />
                      <div
                        className={
                          "mt-4 flex flex-wrap items-center gap-3 border-t border-[#e8dfce] pt-2 text-[10px] dark:border-[#302c24] " +
                          MUTED
                        }
                      >
                        <time dateTime={message.createdAt}>
                          {formatTime(message.createdAt)}
                        </time>
                        {message.currentPath && (
                          <span
                            title="Page where the message was sent"
                            className="max-w-full break-all rounded bg-[#f3eee3] px-1.5 dark:bg-[#292319]"
                          >
                            {message.currentPath}
                          </span>
                        )}
                        {(message.bookingCreated || message.enquiryCreated) && (
                          <OutcomeBadges
                            booking={message.bookingCreated}
                            enquiry={message.enquiryCreated}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#d8cdb6] bg-[#fffdf7] px-4 py-3 dark:border-[#302c24] dark:bg-[#1a1712] sm:px-6">
          <p role="status" className={"text-[11px] " + MUTED}>
            {copyStatus === "failed"
              ? "Couldn't copy. You can select the message text instead."
              : copyStatus === "copied"
                ? "Transcript copied"
                : "Visitor messages and assistant replies"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copyTranscript()}
              disabled={loading || Boolean(error) || !detail?.messages.length}
              className={BUTTON}
            >
              {copyStatus === "copied" ? (
                <Check size={14} />
              ) : (
                <Copy size={14} />
              )}
              Copy transcript
            </button>
            <button type="button" onClick={onClose} className={BUTTON}>
              Close
            </button>
          </div>
        </footer>
      </div>
    </dialog>,
    document.body
  );
}

// React renders all log text as text nodes. Support common formatting without
// interpreting stored HTML or allowing script/data URLs from assistant output.
function inlineText(text: string): ReactNode[] {
  return text
    .split(
      /(\*\*[^*\n]+\*\*|`[^`\n]+`|(?<![\\*])\*(?![\s*])[^*\n]*[^\s*]\*(?!\*)|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g
    )
    .map((part, index) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.length > 2 && part.startsWith("`") && part.endsWith("`"))
        return (
          <code
            key={index}
            className="rounded bg-[#f3eee3] px-1 py-0.5 font-mono text-[11px] dark:bg-[#292319]"
          >
            {part.slice(1, -1)}
          </code>
        );
      if (
        part.length > 2 &&
        part.startsWith("*") &&
        !part.startsWith("**") &&
        part.endsWith("*")
      )
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (link)
        return (
          <a
            key={index}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#8a6624] underline underline-offset-2 dark:text-[#d6b46a]"
          >
            {link[1]}
          </a>
        );
      return part;
    });
}
function splitMarkdownTableRow(line: string): string[] {
  const value = line.trim();
  const cells: string[] = [];
  let cell = "";
  let codeTicks = 0;
  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (character === "\\" && value[index + 1] === "|") {
      cell += "|";
      index++;
      continue;
    }
    if (character === "`") {
      let count = 1;
      while (value[index + count] === "`") count++;
      if (codeTicks === 0) codeTicks = count;
      else if (codeTicks === count) codeTicks = 0;
      cell += "`".repeat(count);
      index += count - 1;
      continue;
    }
    if (character === "|" && codeTicks === 0) {
      cells.push(cell.trim());
      cell = "";
    } else cell += character;
  }
  cells.push(cell.trim());
  if (value.startsWith("|")) cells.shift();
  if (value.endsWith("|") && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function parseMarkdownTable(lines: string[], start: number) {
  if (!lines[start]?.includes("|") || !lines[start + 1]) return null;
  const headers = splitMarkdownTableRow(lines[start]);
  const separators = splitMarkdownTableRow(lines[start + 1]);
  if (
    !headers.length ||
    headers.length !== separators.length ||
    !separators.every((cell) => /^:?-{3,}:?$/.test(cell))
  )
    return null;
  const alignments = separators.map((cell) =>
    cell.startsWith(":") && cell.endsWith(":")
      ? ("center" as const)
      : cell.endsWith(":")
        ? ("right" as const)
        : ("left" as const)
  );
  const rows: string[][] = [];
  let endIndex = start + 2;
  while (
    endIndex < lines.length &&
    lines[endIndex].trim() &&
    lines[endIndex].includes("|")
  ) {
    const cells = splitMarkdownTableRow(lines[endIndex]);
    // Keep incomplete streaming rows visible as text until the next chunk arrives.
    if (cells.length !== headers.length) break;
    rows.push(cells);
    endIndex++;
  }
  return { headers, alignments, rows, endIndex };
}

function isMarkdownDivider(line: string): boolean {
  return /^([-*_])(?:\s*\1){2,}$/.test(line.trim());
}

function TranscriptText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index++;
      continue;
    }
    if (isMarkdownDivider(line)) {
      blocks.push(
        <hr
          key={index++}
          className="my-3 border-0 border-t border-[#d8cdb6] dark:border-[#3a3428]"
        />
      );
      continue;
    }
    const table = parseMarkdownTable(lines, index);
    if (table) {
      blocks.push(
        <div key={index} className="min-w-0">
          <div
            tabIndex={0}
            role="region"
            aria-label="Assistant response table"
            className="my-2 max-w-full overflow-x-auto rounded-lg border border-[#d8cdb6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a4803e] dark:border-[#3a3428]"
          >
            <table className="w-full border-collapse text-left text-xs leading-5">
              <caption className="sr-only">Assistant response table</caption>
              <thead className="bg-[#f2eadb] text-[#5f491f] dark:bg-[#292319] dark:text-[#e5c680]">
                <tr>
                  {table.headers.map((cell, column) => (
                    <th
                      key={column}
                      scope="col"
                      style={{ textAlign: table.alignments[column] }}
                      className="min-w-20 border-b border-[#d8cdb6] px-3 py-2.5 font-semibold [overflow-wrap:anywhere] dark:border-[#3a3428]"
                    >
                      {inlineText(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8dfce] dark:divide-[#302c24]">
                {table.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="even:bg-[#f7f2e8] dark:even:bg-[#211d16]"
                  >
                    {row.map((cell, column) => (
                      <td
                        key={column}
                        style={{ textAlign: table.alignments[column] }}
                        className="min-w-20 px-3 py-2.5 align-top [overflow-wrap:anywhere]"
                      >
                        {inlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      index = table.endIndex;
      continue;
    }
    if (line.startsWith("```")) {
      const code: string[] = [];
      const key = index++;
      while (index < lines.length && !lines[index].trim().startsWith("```"))
        code.push(lines[index++]);
      if (index < lines.length) index++;
      blocks.push(
        <pre
          key={key}
          className="overflow-x-auto rounded-lg bg-[#f3eee3] p-3 font-mono text-xs dark:bg-[#11110f]"
        >
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push(
        <p key={index++} className="font-semibold">
          {inlineText(heading[1])}
        </p>
      );
      continue;
    }
    const ordered = line.match(/^(\d+)[.)]\s+(.+)$/);
    const bullet = line.match(/^[-*\u2022]\s+(.+)$/);
    if (ordered || bullet) {
      const key = index;
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const match = lines[index]
          .trim()
          .match(ordered ? /^(\d+)[.)]\s+(.+)$/ : /^[-*\u2022]\s+(.+)$/);
        if (!match) break;
        items.push(
          <li key={index++} className="pl-1">
            {inlineText(match[ordered ? 2 : 1])}
          </li>
        );
      }
      blocks.push(
        ordered ? (
          <ol
            key={key}
            start={Number(ordered[1])}
            className="list-decimal space-y-1 pl-5"
          >
            {items}
          </ol>
        ) : (
          <ul key={key} className="list-disc space-y-1 pl-5">
            {items}
          </ul>
        )
      );
      continue;
    }
    const key = index;
    const paragraph: string[] = [lines[index++]];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !parseMarkdownTable(lines, index) &&
      !isMarkdownDivider(lines[index]) &&
      !/^(#{1,6}\s|[-*\u2022]\s|\d+[.)]\s|```)/.test(lines[index].trim())
    )
      paragraph.push(lines[index++]);
    blocks.push(
      <p key={key} className="whitespace-pre-line">
        {inlineText(paragraph.join("\n"))}
      </p>
    );
  }
  return <div className="space-y-3 [overflow-wrap:anywhere]">{blocks}</div>;
}
