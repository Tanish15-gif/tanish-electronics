import { useAuth } from "@clerk/clerk-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileClock,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck
} from "lucide-react";

import {
  getAdminAuditLogs,
  type AdminAuditLog
} from "../../Services/adminAuditLogService";
import { exportAuditLogs } from "../../Services/adminExportService";

type AuditFilters = {
  search: string;
  action: string;
  entityName: string;
};

const EMPTY_FILTERS: AuditFilters = {
  search: "",
  action: "",
  entityName: ""
};

const PAGE_SIZE = 10;

function AdminAuditLogsPage() {
  const { getToken } = useAuth();

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [draftFilters, setDraftFilters] = useState<AuditFilters>({
    ...EMPTY_FILTERS
  });
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>({
    ...EMPTY_FILTERS
  });

  const [pageNumber, setPageNumber] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const requestIdRef = useRef(0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Audit Logs | Tanish Electronics Admin";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const loadAuditLogs = useCallback(
    async (filters: AuditFilters, requestedPage: number) => {
      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);
        setError("");

        const token = await getToken();

        if (!token) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        const data = await getAdminAuditLogs(token, {
          search: filters.search,
          action: filters.action,
          entityName: filters.entityName,
          pageNumber: requestedPage,
          pageSize: PAGE_SIZE
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const safeTotalPages = Math.max(data.totalPages, 1);

        setTotalRecords(data.totalRecords);
        setTotalPages(safeTotalPages);

        if (requestedPage > safeTotalPages) {
          setPageNumber(safeTotalPages);
          return;
        }

        setAuditLogs(data.items);
        setLastUpdatedAt(new Date());
      } catch (caughtError) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setAuditLogs([]);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load audit logs."
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [getToken]
  );

  useEffect(() => {
    void loadAuditLogs(appliedFilters, pageNumber);
  }, [appliedFilters, loadAuditLogs, pageNumber]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(appliedFilters).filter((value) => value.trim().length > 0)
        .length,
    [appliedFilters]
  );

  const hasDraftOrAppliedFilters = useMemo(
    () =>
      [...Object.values(draftFilters), ...Object.values(appliedFilters)].some(
        (value) => value.trim().length > 0
      ),
    [appliedFilters, draftFilters]
  );

  const firstVisibleRecord =
    totalRecords === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1;

  const lastVisibleRecord = Math.min(pageNumber * PAGE_SIZE, totalRecords);

  function updateDraftFilter(field: keyof AuditFilters, value: string) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAppliedFilters({
      search: draftFilters.search.trim(),
      action: draftFilters.action.trim(),
      entityName: draftFilters.entityName.trim()
    });

    setPageNumber(1);
  }

  function clearFilters() {
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setPageNumber(1);
  }

  async function handleExportAuditLogs() {
    if (exporting) {
      return;
    }

    try {
      setExporting(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await exportAuditLogs(token, {
        search: appliedFilters.search,
        action: appliedFilters.action,
        entityName: appliedFilters.entityName
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to export audit logs."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                <ShieldCheck className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                  Security history
                </p>

                <h1 className="font-display mt-2 text-4xl font-semibold leading-none sm:text-5xl">
                  Audit logs
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
                  Review protected admin activity, including status changes,
                  product updates, announcements and account operations.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleExportAuditLogs()}
              disabled={exporting || loading}
              className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-bold transition hover:border-[#d6b46a] hover:bg-[#fff4cc] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016] sm:w-fit"
            >
              {exporting ? (
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {exporting ? "" : "Export current results"}
            </button>
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<FileClock className="h-4 w-4" />}
            label="Total records"
            value={totalRecords}
            helper="Matching audit events"
          />

          <SummaryCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Current page"
            value={`${pageNumber} / ${totalPages}`}
            helper={`Showing ${firstVisibleRecord}–${lastVisibleRecord}`}
          />

          <SummaryCard
            icon={<Filter className="h-4 w-4" />}
            label="Active filters"
            value={activeFilterCount}
            helper={
              lastUpdatedAt
                ? `Synced ${formatTime(lastUpdatedAt)}`
                : "Waiting for data"
            }
          />
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              <Search className="h-4 w-4" />
            </span>

            <div>
              <h2 className="text-base font-bold">Find audit activity</h2>
              <p className="mt-1 text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
                Filters apply after you press the Filter button.
              </p>
            </div>
          </div>

          <form onSubmit={handleFilterSubmit}>
            <div className="grid gap-4 lg:grid-cols-3">
              <FilterField label="Search activity">
                <input
                  value={draftFilters.search}
                  onChange={(event) =>
                    updateDraftFilter("search", event.target.value)
                  }
                  placeholder="Description, admin or IP"
                  className="admin-input"
                />
              </FilterField>

              <FilterField label="Entity">
                <input
                  value={draftFilters.entityName}
                  onChange={(event) =>
                    updateDraftFilter("entityName", event.target.value)
                  }
                  placeholder="Example: Product"
                  className="admin-input"
                />
              </FilterField>

              <FilterField label="Action">
                <input
                  value={draftFilters.action}
                  onChange={(event) =>
                    updateDraftFilter("action", event.target.value)
                  }
                  placeholder="Example: UpdateStatus"
                  className="admin-input"
                />
              </FilterField>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-[#d8cdb6] pt-5 dark:border-[#302c24] sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasDraftOrAppliedFilters || loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-bold transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-6 text-sm font-bold text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                <Filter className="h-4 w-4" />
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="flex flex-col gap-2 border-b border-[#d8cdb6] px-5 py-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Activity timeline</h2>
              <p className="mt-1 text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
                Newest matching records appear first.
              </p>
            </div>

            {activeFilterCount > 0 && (
              <span className="w-fit rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                Filtered results
              </span>
            )}
          </div>

          {loading ? (
            <AuditLogsLoading />
          ) : auditLogs.length === 0 ? (
            <EmptyState filtered={activeFilterCount > 0} />
          ) : (
            <>
              <div className="te-scrollbar hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1080px] text-left">
                  <thead className="border-b border-[#d8cdb6] bg-[#fff8e7] text-[10px] font-bold uppercase tracking-[0.14em] text-[#817867] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#928a7d]">
                    <tr>
                      <th className="px-5 py-4">Action</th>
                      <th className="px-5 py-4">Entity</th>
                      <th className="px-5 py-4">Performed by</th>
                      <th className="px-5 py-4">Description</th>
                      <th className="px-5 py-4">IP address</th>
                      <th className="px-5 py-4">Time</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#d8cdb6] dark:divide-[#302c24]">
                    {auditLogs.map((log) => (
                      <tr
                        key={log.auditLogId}
                        className="align-top transition hover:bg-[#fff8e7] dark:hover:bg-[#11110f]"
                      >
                        <td className="px-5 py-4">
                          <ActionBadge action={log.action} />
                        </td>

                        <td className="px-5 py-4">
                          <p
                            className="max-w-[170px] truncate text-sm font-bold"
                            title={log.entityName}
                          >
                            {log.entityName || "Unknown"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
                            ID: {log.entityId ?? "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p
                            className="max-w-[180px] truncate text-sm font-bold"
                            title={log.adminName || "System"}
                          >
                            {log.adminName || "System"}
                          </p>

                          <p
                            className="mt-1 max-w-[210px] truncate text-xs font-medium text-[#817867] dark:text-[#928a7d]"
                            title={log.adminEmail || "No email"}
                          >
                            {log.adminEmail || "No email"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p
                            className="max-w-[340px] text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]"
                            title={
                              log.description || "No description provided."
                            }
                          >
                            {log.description || "No description provided."}
                          </p>

                          {log.userAgent && (
                            <p
                              title={log.userAgent}
                              className="mt-2 max-w-[340px] truncate text-[11px] font-medium text-[#817867] dark:text-[#928a7d]"
                            >
                              {log.userAgent}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <code className="whitespace-nowrap rounded-lg border border-[#d8cdb6] bg-[#fff8e7] px-2 py-1 text-xs font-semibold text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
                            {log.ipAddress || "—"}
                          </code>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="text-sm font-bold">
                            {formatDate(log.createdAt)}
                          </p>

                          <p className="mt-1 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
                            {formatAuditTime(log.createdAt)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#d8cdb6] dark:divide-[#302c24] lg:hidden">
                {auditLogs.map((log) => (
                  <AuditLogMobileCard key={log.auditLogId} log={log} />
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 border-t border-[#d8cdb6] bg-[#fffaf0]/60 px-5 py-4 dark:border-[#302c24] dark:bg-[#11110f]/40 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-[#817867] dark:text-[#928a7d]">
              {totalRecords === 0
                ? "No records to display"
                : `Showing ${firstVisibleRecord}–${lastVisibleRecord} of ${totalRecords}`}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                disabled={pageNumber <= 1 || loading}
                onClick={() =>
                  setPageNumber((current) => Math.max(current - 1, 1))
                }
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-bold transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={pageNumber >= totalPages || loading}
                onClick={() =>
                  setPageNumber((current) => Math.min(current + 1, totalPages))
                }
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-bold transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function FilterField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <article className="rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#817867] dark:text-[#928a7d]">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold">{value}</p>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          {icon}
        </span>
      </div>

      <p className="mt-2 truncate text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
        {helper}
      </p>
    </article>
  );
}

function AuditLogMobileCard({ log }: { log: AdminAuditLog }) {
  return (
    <article className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <ActionBadge action={log.action} />

        <span className="rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-3 py-1 text-[11px] font-bold dark:border-[#302c24] dark:bg-[#11110f]">
          {log.entityName || "Unknown"} #{log.entityId ?? "—"}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {log.description || "No description provided."}
      </p>

      <dl className="mt-5 grid gap-3 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 text-xs dark:border-[#302c24] dark:bg-[#11110f]">
        <MobileDetail label="Admin" value={log.adminName || "System"} />
        <MobileDetail label="Email" value={log.adminEmail || "No email"} />
        <MobileDetail label="IP address" value={log.ipAddress || "—"} />
        <MobileDetail label="Time" value={formatDateTime(log.createdAt)} />
      </dl>

      {log.userAgent && (
        <p
          title={log.userAgent}
          className="mt-3 truncate text-[11px] font-medium text-[#817867] dark:text-[#928a7d]"
        >
          {log.userAgent}
        </p>
      )}
    </article>
  );
}

function MobileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
      <dt className="font-medium text-[#817867] dark:text-[#928a7d]">
        {label}
      </dt>
      <dd className="min-w-0 break-words font-semibold text-[#1f1a12] dark:text-[#e8e3d8]">
        {value}
      </dd>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span
      title={action}
      className="inline-flex max-w-[190px] truncate rounded-full border border-[#d6b46a]/45 bg-[#fff4cc] px-3 py-1 text-xs font-bold text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]"
    >
      {formatActionName(action)}
    </span>
  );
}

function AuditLogsLoading() {
  return (
    <div className="space-y-3 p-5" aria-label="Loading audit logs">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl border border-[#e3d8c4] bg-[#eee5d4]/70 dark:border-[#302c24] dark:bg-[#242016]"
        />
      ))}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="px-5 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <ShieldCheck className="h-6 w-6" />
      </span>

      <h3 className="mt-4 text-xl font-bold">
        {filtered ? "No matching audit logs" : "No audit logs yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {filtered
          ? "Try clearing or changing the filters to find a different activity record."
          : "Protected admin actions will appear here after activity is recorded."}
      </p>
    </div>
  );
}

function formatActionName(action: string) {
  if (!action) {
    return "Unknown action";
  }

  return action
    .replaceAll("_", " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string) {
  const date = parseDate(value);

  if (!date) {
    return "Unknown date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatAuditTime(value: string) {
  const date = parseDate(value);

  if (!date) {
    return "Unknown time";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateTime(value: string) {
  const date = parseDate(value);

  if (!date) {
    return "Unknown time";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatTime(value: Date) {
  return value.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default AdminAuditLogsPage;
