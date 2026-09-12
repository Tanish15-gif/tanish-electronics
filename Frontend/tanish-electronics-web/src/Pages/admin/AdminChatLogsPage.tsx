import { useApiAuth } from "../../hooks/useApiAuth";
import { useShopSettings } from "../../hooks/useShopSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  Wrench,
  HelpCircle,
  Clock,
  X,
  User,
  ExternalLink,
  Globe,
  MapPin
} from "lucide-react";
import {
  getAdminChatLogs,
  getAdminChatSession,
  getAdminChatStats,
  type ChatLogItem,
  type ChatLogStats,
  type ChatSessionDetail
} from "../../Services/adminChatLogService";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

function initialsFor(name?: string | null) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letters.join("") || null;
}

/** Small metric tile used in the summary strip. */
function StatTile({
  icon,
  label,
  value,
  tint
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tint: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-4 transition hover:border-[#c9bb9a] hover:shadow-[0_2px_16px_-6px_rgba(31,26,18,0.15)] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#3d3729]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${tint}1f`, color: tint }}
        >
          {icon}
        </span>
        <span className="text-[13px] font-medium text-[#6f6758] dark:text-[#a8a093]">
          {label}
        </span>
      </div>
      <p className="mt-3 text-[26px] font-bold leading-none tabular-nums text-[#1f1a12] dark:text-[#f7f5ef]">
        {value}
      </p>
    </div>
  );
}

export default function AdminChatLogsPage() {
  const { getToken } = useApiAuth();
  const { settings } = useShopSettings();

  const [logs, setLogs] = useState<ChatLogItem[]>([]);
  const [stats, setStats] = useState<ChatLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Selected session for viewing transcript
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [transcriptDetail, setTranscriptDetail] =
    useState<ChatSessionDetail | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = `AI Chat Logs | ${settings.shopName || "Tanish Electronics"}`;
  }, [settings.shopName]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();
      if (!token) {
        throw new Error("Your session has expired. Sign in again.");
      }

      const [logsRes, statsRes] = await Promise.all([
        getAdminChatLogs(token, {
          page,
          pageSize: 15,
          search: appliedSearch
        }),
        getAdminChatStats(token)
      ]);

      setLogs(logsRes.items);
      setTotalPages(logsRes.totalPages);
      setTotalRecords(logsRes.totalRecords);
      setStats(statsRes);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err?.message || "Couldn't load conversations. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [getToken, page, appliedSearch]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Open transcript modal
  const handleOpenTranscript = async (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setTranscriptDetail(null);
    setLoadingTranscript(true);
    setModalEntered(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      const detail = await getAdminChatSession(token, sessionId);
      setTranscriptDetail(detail);
    } catch {
      // transcript detail will show error
    } finally {
      setLoadingTranscript(false);
    }
  };

  const handleCloseTranscript = useCallback(() => {
    setModalEntered(false);
    // let the close transition play before unmounting
    window.setTimeout(() => {
      setSelectedSessionId(null);
      setTranscriptDetail(null);
    }, 150);
  }, []);

  // Trigger enter transition + focus the close button once the modal mounts
  useEffect(() => {
    if (selectedSessionId === null) return;
    const raf = requestAnimationFrame(() => setModalEntered(true));
    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
      160
    );
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(focusTimer);
    };
  }, [selectedSessionId]);

  // Close on Escape
  useEffect(() => {
    if (selectedSessionId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseTranscript();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedSessionId, handleCloseTranscript]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#d8cdb6]/70 pb-6 dark:border-[#302c24]/70 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1f1a12] dark:text-[#f7f5ef] sm:text-4xl">
            AI chat conversations
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6f6758] dark:text-[#a8a093]">
            Every repair booking, enquiry, and product question the assistant
            has handled, in one place.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:flex-col sm:items-end sm:gap-1.5">
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 py-2.5 text-sm font-semibold text-[#1f1a12] shadow-sm transition hover:bg-[#fff8e7] disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {lastRefreshed && !loading && (
            <span className="text-xs text-[#928a7d]">
              Updated {formatTime(lastRefreshed.toISOString())}
            </span>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          icon={<MessageSquare className="h-4 w-4" />}
          label="Total sessions"
          value={stats?.totalSessions ?? "—"}
          tint="#b8934a"
        />
        <StatTile
          icon={<Sparkles className="h-4 w-4" />}
          label="Total messages"
          value={stats?.totalMessages ?? "—"}
          tint="#8a6624"
        />
        <StatTile
          icon={<Wrench className="h-4 w-4" />}
          label="Bookings created"
          value={stats?.bookingsTriggered ?? "—"}
          tint="#10b981"
        />
        <StatTile
          icon={<HelpCircle className="h-4 w-4" />}
          label="Enquiries taken"
          value={stats?.enquiriesTriggered ?? "—"}
          tint="#d97706"
        />
        <StatTile
          icon={<Clock className="h-4 w-4" />}
          label="Sessions today"
          value={stats?.sessionsToday ?? "—"}
          tint="#0ea5e9"
        />
      </div>

      {/* Search Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setAppliedSearch(search.trim());
        }}
        className="relative mt-6"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a093]" />
        <input
          type="text"
          placeholder="Search by customer name, message, or reply..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#d8cdb6] bg-[#fffdf7] py-2.5 pl-10 pr-16 text-sm text-[#1f1a12] outline-none transition placeholder:text-[#a8a093] focus:border-[#b8934a] focus:ring-2 focus:ring-[#d6b46a]/25 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setAppliedSearch("");
              setPage(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#928a7d] hover:text-[#1f1a12] dark:hover:text-[#e8e3d8]"
          >
            Clear
          </button>
        )}
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Sessions Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d8cdb6] bg-[#f7f5ef] text-xs font-semibold text-[#6f6758] dark:border-[#302c24] dark:bg-[#14120e] dark:text-[#a8a093]">
              <tr>
                <th className="px-5 py-3.5 font-semibold">User / visitor</th>
                <th className="px-5 py-3.5 font-semibold">Session key</th>
                <th className="px-5 py-3.5 font-semibold">IP address</th>
                <th className="px-5 py-3.5 font-semibold">Messages</th>
                <th className="px-5 py-3.5 font-semibold">Outcome</th>
                <th className="px-5 py-3.5 font-semibold">Time</th>
                <th className="px-5 py-3.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e1cd] dark:divide-[#241f17]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#928a7d]">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#b8934a]" />
                    <p className="mt-2 text-sm">Loading conversations...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-[#928a7d]">
                    <MessageSquare className="mx-auto h-8 w-8 text-[#d8cdb6] dark:text-[#3d3729]" />
                    <p className="mt-3 text-sm font-medium text-[#6f6758] dark:text-[#a8a093]">
                      {appliedSearch
                        ? `No conversations match "${appliedSearch}".`
                        : "No chat sessions yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((item) => {
                  const initials = initialsFor(item.userName);
                  return (
                    <tr
                      key={item.chatSessionId}
                      onClick={() => handleOpenTranscript(item.chatSessionId)}
                      className="cursor-pointer border-l-2 border-l-transparent transition hover:border-l-[#b8934a] hover:bg-[#fff8e7] dark:hover:bg-[#14120e]"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff4cc] text-xs font-bold text-[#8a6624] ring-1 ring-[#e8d9a6] dark:bg-[#d6b46a]/15 dark:text-[#d6b46a] dark:ring-[#3d3729]">
                            {initials ?? <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1f1a12] dark:text-[#f7f5ef]">
                              {item.userName || "Guest visitor"}
                            </p>
                            {item.userPhone && (
                              <p className="text-xs text-[#817867] dark:text-[#928a7d]">
                                {item.userPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Session Key */}
                      <td className="px-5 py-4">
                        <code className="rounded-md bg-[#f7f5ef] px-1.5 py-0.5 font-mono text-xs text-[#6f6758] dark:bg-[#11110f] dark:text-[#a8a093]">
                          {item.sessionKey.length > 12
                            ? `${item.sessionKey.substring(0, 12)}...`
                            : item.sessionKey}
                        </code>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
                          <Globe className="h-3.5 w-3.5 text-[#b8b09a] dark:text-[#5a5648]" />
                          {item.ipAddress || "127.0.0.1"}
                        </div>
                      </td>

                      {/* Message Count */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#d8cdb6] bg-[#f7f5ef] px-2.5 py-0.5 text-xs font-semibold text-[#1f1a12] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]">
                          <MessageSquare className="h-3 w-3 text-[#b8934a]" />
                          {item.messageCount}{" "}
                          {item.messageCount === 1 ? "turn" : "turns"}
                        </span>
                      </td>

                      {/* Outcome Badges */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.hasBooking && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400">
                              <Wrench className="h-3 w-3" /> Booking
                            </span>
                          )}
                          {item.hasEnquiry && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                              <HelpCircle className="h-3 w-3" /> Enquiry
                            </span>
                          )}
                          {!item.hasBooking && !item.hasEnquiry && (
                            <span className="text-xs text-[#a8a093]">
                              General
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#817867] dark:text-[#928a7d]">
                        <p className="font-medium text-[#1f1a12] dark:text-[#f7f5ef]">
                          {formatDate(item.lastMessageAt)}
                        </p>
                        <p>{formatTime(item.lastMessageAt)}</p>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTranscript(item.chatSessionId);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cdb6] bg-[#fffaf0] px-3 py-1.5 text-xs font-semibold text-[#1f1a12] transition hover:border-[#b8934a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                        >
                          Inspect
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col gap-4 border-t border-[#d8cdb6] bg-[#fffaf0]/60 px-5 py-4 dark:border-[#302c24] dark:bg-[#11110f]/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-[#817867] dark:text-[#928a7d]">
            {totalRecords === 0
              ? "No conversations recorded yet"
              : `${totalRecords} conversation${totalRecords === 1 ? "" : "s"} across ${totalPages} page${totalPages === 1 ? "" : "s"}`}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 py-1.5 text-xs font-semibold text-[#1f1a12] transition hover:bg-[#fff8e7] disabled:cursor-not-allowed disabled:border-[#e8e1cd] disabled:bg-transparent disabled:text-[#c9c2b0] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016] dark:disabled:border-[#241f17] dark:disabled:bg-transparent dark:disabled:text-[#5a5648]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <span className="text-xs font-medium text-[#928a7d]">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 py-1.5 text-xs font-semibold text-[#1f1a12] transition hover:bg-[#fff8e7] disabled:cursor-not-allowed disabled:border-[#e8e1cd] disabled:bg-transparent disabled:text-[#c9c2b0] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016] dark:disabled:border-[#241f17] dark:disabled:bg-transparent dark:disabled:text-[#5a5648]"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Dialog Modal */}
      {selectedSessionId !== null && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Conversation transcript"
        >
          <div
            onClick={handleCloseTranscript}
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150 ${
              modalEntered ? "opacity-100" : "opacity-0"
            }`}
          />

          <div
            className={`relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#d8cdb6] bg-[#f7f5ef] text-[#1f1a12] shadow-2xl transition-all duration-150 ease-out dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] ${
              modalEntered
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.97] opacity-0"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#d8cdb6] px-6 py-4 dark:border-[#302c24]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4cc] text-xs font-bold text-[#8a6624] ring-1 ring-[#e8d9a6] dark:bg-[#d6b46a]/15 dark:text-[#d6b46a] dark:ring-[#3d3729]">
                  {initialsFor(transcriptDetail?.userName) ?? (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold leading-tight text-[#1f1a12] dark:text-[#f7f5ef]">
                    {transcriptDetail?.userName || "Guest visitor"}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[#817867] dark:text-[#928a7d]">
                    {transcriptDetail?.userPhone && (
                      <span>{transcriptDetail.userPhone}</span>
                    )}
                    {transcriptDetail?.userPhone && <span>•</span>}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Started{" "}
                      {transcriptDetail?.startedAt
                        ? `${formatDate(transcriptDetail.startedAt)} at ${formatTime(transcriptDetail.startedAt)}`
                        : "—"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                onClick={handleCloseTranscript}
                aria-label="Close transcript"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#928a7d] transition hover:bg-[#fff8e7] hover:text-[#1f1a12] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b46a]/40 dark:hover:bg-[#1a1712] dark:hover:text-[#e8e3d8]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {loadingTranscript ? (
                <div className="py-14 text-center text-[#928a7d]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#b8934a]" />
                  <p className="mt-2 text-sm">Loading transcript...</p>
                </div>
              ) : !transcriptDetail ||
                transcriptDetail.messages.length === 0 ? (
                <div className="py-14 text-center text-[#928a7d]">
                  <MessageSquare className="mx-auto h-7 w-7 text-[#d8cdb6] dark:text-[#3d3729]" />
                  <p className="mt-2 text-sm">
                    No messages recorded in this session.
                  </p>
                </div>
              ) : (
                transcriptDetail.messages.map((msg, idx) => (
                  <div key={msg.chatMessageId || idx} className="space-y-3">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#b8934a] px-4 py-2.5 text-sm text-white shadow-sm">
                        <p className="leading-relaxed">{msg.userMessage}</p>
                        <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-white/80">
                          {msg.currentPath && (
                            <span className="rounded bg-white/15 px-1.5 py-[1px]">
                              {msg.currentPath}
                            </span>
                          )}
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bot Reply */}
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-tl-sm border border-[#d8cdb6] bg-[#fffdf7] px-4 py-3 text-sm text-[#1f1a12] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]">
                        <div className="flex items-center gap-1.5 pb-1 text-xs font-semibold text-[#b8934a]">
                          <Sparkles className="h-3.5 w-3.5" />
                          Tanish Electronics Assistant
                        </div>
                        <p className="whitespace-pre-line leading-relaxed text-sm">
                          {msg.botReply}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#e8e1cd] pt-2 text-[11px] text-[#a8a093] dark:border-[#28241c]">
                          <span>{formatTime(msg.createdAt)}</span>
                          {msg.bookingCreated && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <Wrench className="h-3 w-3" /> Booking created
                            </span>
                          )}
                          {msg.enquiryCreated && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <HelpCircle className="h-3 w-3" /> Enquiry
                              submitted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#d8cdb6] bg-[#fffaf0]/60 px-6 py-3 dark:border-[#302c24] dark:bg-[#14120e]">
              <span className="text-xs text-[#928a7d]">
                {transcriptDetail
                  ? `${transcriptDetail.messages.length} ${transcriptDetail.messages.length === 1 ? "turn" : "turns"}`
                  : ""}
              </span>
              <button
                onClick={handleCloseTranscript}
                className="rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 py-2 text-xs font-semibold text-[#1f1a12] transition hover:bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

