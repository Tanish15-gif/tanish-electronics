import { useApiAuth } from "../../hooks/useApiAuth";
import { useCallback, useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Download,
  RefreshCw,
  TrendingUp,
  Users
} from "lucide-react";

import {
  getAdminAnalyticsSummary,
  getAdminWebsiteVisits,
  type AdminAnalyticsSummary,
  type AdminDailyVisit,
  type AdminRecentVisit,
  type AdminTopPage
} from "../../Services/adminAnalyticsService";
import { exportWebsiteVisits } from "../../Services/adminExportService";

function AdminAnalyticsPage() {
  const { getToken } = useApiAuth();

  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [recentVisits, setRecentVisits] = useState<AdminRecentVisit[]>([]);

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Analytics | Tanish Electronics Admin";

    return () => {
      document.title = "Tanish Electronics";
    };
  }, []);

  const loadAnalytics = useCallback(
    async (isRefresh: boolean, requestedPage: number) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token = await getToken();

        if (!token) {
          throw new Error("Your session has expired. Please sign in again.");
        }

        const [summaryData, visitsData] = await Promise.all([
          getAdminAnalyticsSummary(token),
          getAdminWebsiteVisits(
            {
              pageNumber: requestedPage,
              pageSize
            },
            token
          )
        ]);

        setSummary(summaryData);
        setRecentVisits(visitsData.items ?? []);
        setPageNumber(visitsData.pageNumber);
        setTotalPages(visitsData.totalPages);
        setTotalRecords(visitsData.totalRecords);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load analytics data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, pageSize]
  );

  useEffect(() => {
    void loadAnalytics(false, 1);
  }, [loadAnalytics]);

  async function handlePageChange(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === pageNumber ||
      visitsLoading
    ) {
      return;
    }

    try {
      setVisitsLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await getAdminWebsiteVisits(
        {
          pageNumber: nextPage,
          pageSize
        },
        token
      );

      setRecentVisits(data.items ?? []);
      setPageNumber(data.pageNumber);
      setTotalPages(data.totalPages);
      setTotalRecords(data.totalRecords);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load website visits."
      );
    } finally {
      setVisitsLoading(false);
    }
  }

  async function handleExportWebsiteVisits() {
    try {
      setExporting(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await exportWebsiteVisits(token);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to export website visits."
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <AnalyticsLoading />;
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d6b46a] text-[#11110f] shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Website performance
              </p>

              <h1 className="font-display mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Analytics
              </h1>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Track public website visits, popular pages, unique visitors and
              recent traffic activity.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={() => void handleExportWebsiteVisits()}
                disabled={exporting}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#d8cdb6] bg-transparent px-5 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                <Download
                  className={`h-4 w-4 ${exporting ? "animate-bounce" : ""}`}
                />

                {exporting ? "Exporting..." : "Export CSV"}
              </button>

              <button
                type="button"
                onClick={() => void loadAnalytics(true, pageNumber)}
                disabled={refreshing || visitsLoading}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#d6b46a] px-5 text-sm font-black text-[#11110f] transition hover:bg-[#c9a85f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />

                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {!summary ? (
          <EmptyAnalyticsState />
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AnalyticsStatCard
                label="Total visits"
                value={formatNumber(summary.totalVisits)}
                helper="All tracked page visits"
                icon={<Activity className="h-5 w-5" />}
              />

              <AnalyticsStatCard
                label="Today"
                value={formatNumber(summary.todayVisits)}
                helper="Visits since midnight"
                icon={<TrendingUp className="h-5 w-5" />}
              />

              <AnalyticsStatCard
                label="Last 7 days"
                value={formatNumber(summary.last7DaysVisits)}
                helper="Recent public traffic"
                icon={<ArrowUpRight className="h-5 w-5" />}
              />

              <AnalyticsStatCard
                label="Unique visitors"
                value={formatNumber(summary.uniqueVisitors)}
                helper="Based on visitor ID"
                icon={<Users className="h-5 w-5" />}
              />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <DailyVisitsChart dailyVisits={summary.dailyVisits ?? []} />

              <TopPagesCard topPages={summary.topPages ?? []} />
            </section>

            <RecentVisitsSection
              recentVisits={recentVisits}
              pageNumber={pageNumber}
              totalPages={totalPages}
              totalRecords={totalRecords}
              loading={visitsLoading}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>
    </main>
  );
}

function AnalyticsStatCard({
  label,
  value,
  helper,
  icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#11110f] dark:text-[#d6b46a]">
        {icon}
      </div>

      <p className="mt-5 text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tabular-nums tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
        {helper}
      </p>
    </article>
  );
}

type HoveredDayPoint = {
  index: number;
};

function DailyVisitsChart({ dailyVisits }: { dailyVisits: AdminDailyVisit[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredDayPoint | null>(
    null
  );

  const width = 720;
  const height = 260;
  const paddingX = 42;
  const paddingY = 30;

  const observedMax = Math.max(
    1,
    ...dailyVisits.map((item) => item.visitCount)
  );

  const maxValue = Math.max(2, Math.ceil(observedMax * 1.25));

  const values = dailyVisits.map((item) => item.visitCount);

  const linePath = buildTimelinePath(
    values,
    maxValue,
    width,
    height,
    paddingX,
    paddingY
  );
  const areaPath = buildTimelineAreaPath(
    values,
    maxValue,
    width,
    height,
    paddingX,
    paddingY
  );

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const totalVisits = values.reduce((sum, value) => sum + value, 0);
  const averageVisits = dailyVisits.length
    ? Math.round(totalVisits / dailyVisits.length)
    : 0;

  const first = dailyVisits[0];
  const last = dailyVisits[dailyVisits.length - 1];
  const trendPercent =
    first && last && first.visitCount > 0
      ? Math.round(
          ((last.visitCount - first.visitCount) / first.visitCount) * 100
        )
      : null;

  const hoveredSnapshot =
    hoveredPoint && dailyVisits[hoveredPoint.index]
      ? dailyVisits[hoveredPoint.index]
      : null;

  const hoveredX =
    hoveredPoint && hoveredSnapshot
      ? getTimelineX(hoveredPoint.index, dailyVisits.length, width, paddingX)
      : 0;

  const hoveredY = hoveredSnapshot
    ? getTimelineY(hoveredSnapshot.visitCount, maxValue, height, paddingY)
    : 0;

  function handleChartHover(event: MouseEvent<SVGRectElement>) {
    if (dailyVisits.length === 0) return;

    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * width;

    const chartWidth = width - paddingX * 2;
    const ratio = (mouseX - paddingX) / chartWidth;

    const index =
      dailyVisits.length === 1
        ? 0
        : Math.round(ratio * (dailyVisits.length - 1));
    const safeIndex = Math.min(Math.max(index, 0), dailyVisits.length - 1);

    setHoveredPoint((current) => {
      if (current?.index === safeIndex) return current;
      return { index: safeIndex };
    });
  }

  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Traffic trend
          </p>

          <h2 className="mt-1 text-xl font-black">Last 7 days visits</h2>

          <p className="mt-1 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Daily average {formatNumber(averageVisits)} visits
            {trendPercent !== null && (
              <span
                className={`ml-2 inline-flex items-center gap-0.5 font-black ${
                  trendPercent >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                <ArrowUpRight
                  className={`h-3 w-3 ${trendPercent < 0 ? "rotate-90" : ""}`}
                />
                {trendPercent >= 0 ? "+" : ""}
                {trendPercent}%
              </span>
            )}
          </p>
        </div>

        {last && (
          <div className="rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f]">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#817867] dark:text-[#928a7d]">
              Latest day
            </p>

            <p className="mt-0.5 text-lg font-black tabular-nums">
              {formatNumber(last.visitCount)} visits
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f] sm:p-4">
        {dailyVisits.length === 0 ? (
          <MiniEmptyState message="No daily visit data yet." />
        ) : (
          <div className="relative select-none">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-72 w-full select-none"
              role="img"
              aria-label="Daily website visits timeline"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {gridLevels.map((level) => {
                const y = height - paddingY - level * (height - paddingY * 2);

                return (
                  <g key={level}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-[#e4dac7] dark:text-[#302c24]"
                    />

                    <text
                      x="6"
                      y={y + 4}
                      className="fill-[#d8cdb6] text-[10px] font-black tabular-nums dark:fill-[#c7bda9]"
                    >
                      {Math.round(level * maxValue)}
                    </text>
                  </g>
                );
              })}

              <path
                d={areaPath}
                className="fill-[#d6b46a]/15 dark:fill-[#d6b46a]/10"
              />

              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#d6b46a]"
              />

              {dailyVisits.map((item, index) => {
                const x = getTimelineX(
                  index,
                  dailyVisits.length,
                  width,
                  paddingX
                );
                const y = getTimelineY(
                  item.visitCount,
                  maxValue,
                  height,
                  paddingY
                );

                return (
                  <circle
                    key={item.date}
                    cx={x}
                    cy={y}
                    r="3"
                    className="fill-[#d6b46a] opacity-70"
                  />
                );
              })}

              {hoveredSnapshot && hoveredPoint && (
                <g pointerEvents="none">
                  <line
                    x1={hoveredX}
                    y1={paddingY}
                    x2={hoveredX}
                    y2={height - paddingY}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-[#d6b46a]/70"
                  />

                  <rect
                    x={hoveredX - 30}
                    y={height - paddingY + 6}
                    width={60}
                    height={16}
                    rx={4}
                    className="fill-[#d6b46a]"
                  />

                  <text
                    x={hoveredX}
                    y={height - paddingY + 18}
                    textAnchor="middle"
                    className="fill-[#11110f] text-[10px] font-black tabular-nums"
                  >
                    {formatShortDate(hoveredSnapshot.date)}
                  </text>

                  <circle
                    cx={hoveredX}
                    cy={hoveredY}
                    r="5"
                    className="fill-[#d6b46a] stroke-[#fffaf0] dark:stroke-[#11110f]"
                    strokeWidth="2"
                  />
                </g>
              )}

              <rect
                x={paddingX}
                y={paddingY}
                width={width - paddingX * 2}
                height={height - paddingY * 2}
                fill="transparent"
                className="cursor-crosshair"
                onMouseMove={handleChartHover}
              />

              {!hoveredPoint &&
                dailyVisits.map((item, index) => {
                  const x = getTimelineX(
                    index,
                    dailyVisits.length,
                    width,
                    paddingX
                  );

                  return (
                    <text
                      key={item.date}
                      x={x}
                      y={height - 4}
                      textAnchor="middle"
                      className="fill-[#d8cdb6] text-[10px] font-black tabular-nums dark:fill-[#c7bda9]"
                    >
                      {formatShortDate(item.date)}
                    </text>
                  );
                })}
            </svg>

            {hoveredSnapshot && hoveredPoint && (
              <div
                className="pointer-events-none absolute z-20 min-w-40 rounded-2xl border border-[#d6b46a] bg-[#11110f] px-4 py-3 text-[#f7f5ef] shadow-2xl shadow-black/40"
                style={{
                  left: `${(hoveredX / width) * 100}%`,
                  top: `${(hoveredY / height) * 100}%`,
                  transform: `translate(${
                    hoveredX > width * 0.68 ? "calc(-100% - 16px)" : "16px"
                  }, calc(-100% - 8px))`,
                  willChange: "transform"
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6b46a]">
                  {formatShortDate(hoveredSnapshot.date)}
                </p>

                <p className="mt-2 text-lg font-black tabular-nums">
                  {formatNumber(hoveredSnapshot.visitCount)} visits
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TopPagesCard({ topPages }: { topPages: AdminTopPage[] }) {
  const maxPageCount = Math.max(...topPages.map((page) => page.visitCount), 1);

  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
        Popular pages
      </p>

      <h2 className="mt-1 text-xl font-black">Top visited routes</h2>

      {topPages.length === 0 ? (
        <MiniEmptyState message="No top pages yet." />
      ) : (
        <div className="mt-6 space-y-4">
          {topPages.map((page, index) => {
            const width = Math.max(
              8,
              Math.round((page.visitCount / maxPageCount) * 100)
            );

            return (
              <article key={page.path}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#f2eadb] text-[10px] font-black text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
                      {index + 1}
                    </span>

                    <p className="min-w-0 truncate text-sm font-black">
                      {page.path}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs font-black tabular-nums text-[#8a6624] dark:text-[#d6b46a]">
                    {formatNumber(page.visitCount)}
                  </p>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee5d4] dark:bg-[#242016]">
                  <div
                    className="h-full rounded-full bg-[#d6b46a] transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentVisitsSection({
  recentVisits,
  pageNumber,
  totalPages,
  totalRecords,
  loading,
  onPageChange
}: {
  recentVisits: AdminRecentVisit[];
  pageNumber: number;
  totalPages: number;
  totalRecords: number;
  loading: boolean;
  onPageChange: (page: number) => void | Promise<void>;
}) {
  const visiblePages = getVisiblePageNumbers(pageNumber, totalPages);

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="flex flex-col gap-3 border-b border-[#d8cdb6] px-5 py-4 dark:border-[#302c24] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Live activity
          </p>

          <h2 className="mt-1 text-xl font-black">Recent visits</h2>

          <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Latest public website visits captured by the tracker.
          </p>
        </div>

        <p className="text-xs font-black tabular-nums text-[#817867] dark:text-[#928a7d]">
          {totalRecords === 0
            ? "0 visits"
            : `Page ${pageNumber} of ${Math.max(totalPages, 1)} · ${formatNumber(
                totalRecords
              )} visits`}
        </p>
      </div>

      {loading ? (
        <RecentVisitsLoading />
      ) : recentVisits.length === 0 ? (
        <EmptyRecentVisits />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-[#d8cdb6] bg-[#fff8e7] text-[11px] font-black uppercase tracking-[0.14em] text-[#817867] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#928a7d]">
                <tr>
                  <th className="px-5 py-4">Path</th>
                  <th className="px-5 py-4">Visitor</th>
                  <th className="px-5 py-4">IP Address</th>
                  <th className="px-5 py-4">Referrer</th>
                  <th className="px-5 py-4">Device</th>
                  <th className="px-5 py-4">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#d8cdb6] dark:divide-[#302c24]">
                {recentVisits.map((visit) => (
                  <tr
                    key={visit.websiteVisitId}
                    className="align-top transition hover:bg-[#fff8e7] dark:hover:bg-[#11110f]"
                  >
                    <td className="px-5 py-4">
                      <p className="max-w-[220px] truncate text-sm font-black">
                        {visit.path}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[220px] truncate text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
                        {visit.visitorId || "Unknown visitor"}
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-[#817867] dark:text-[#928a7d]">
                        AppUser: {visit.appUserId ?? "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <code className="rounded-lg bg-[#fff8e7] px-2 py-1 text-xs font-bold text-[#6f6758] dark:bg-[#11110f] dark:text-[#a8a093]">
                        {visit.ipAddress || "—"}
                      </code>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[220px] truncate text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
                        {getVisitReferrer(visit)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p
                        title={visit.userAgent || ""}
                        className="max-w-[240px] truncate text-xs font-bold text-[#6f6758] dark:text-[#a8a093]"
                      >
                        {formatUserAgent(visit.userAgent)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-black tabular-nums">
                        {formatLongDate(visit.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#d8cdb6] dark:divide-[#302c24] lg:hidden">
            {recentVisits.map((visit) => (
              <article key={visit.websiteVisitId} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#d8cdb6] bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#8a6624] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                    {visit.path}
                  </span>

                  <span className="rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-3 py-1 text-xs font-black tabular-nums dark:border-[#302c24] dark:bg-[#11110f]">
                    {formatLongDate(visit.createdAt)}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-xs font-bold text-[#817867] dark:text-[#928a7d]">
                  <p>Visitor: {visit.visitorId || "Unknown visitor"}</p>
                  <p>AppUser: {visit.appUserId ?? "—"}</p>
                  <p>IP: {visit.ipAddress || "—"}</p>
                  <p>Referrer: {getVisitReferrer(visit)}</p>
                  <p>Device: {formatUserAgent(visit.userAgent)}</p>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Website visits pagination"
              className="flex flex-col gap-3 border-t border-[#d8cdb6] px-5 py-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between"
            >
              <button
                type="button"
                onClick={() => void onPageChange(pageNumber - 1)}
                disabled={pageNumber <= 1 || loading}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-transparent px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                Previous
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => void onPageChange(page)}
                    disabled={loading}
                    aria-current={page === pageNumber ? "page" : undefined}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black tabular-nums transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      page === pageNumber
                        ? "bg-[#d6b46a] text-[#11110f]"
                        : "border border-[#d8cdb6] bg-transparent hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void onPageChange(pageNumber + 1)}
                disabled={pageNumber >= totalPages || loading}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-transparent px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function RecentVisitsLoading() {
  return (
    <div className="animate-pulse divide-y divide-[#d8cdb6] dark:divide-[#302c24]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid gap-3 px-5 py-5 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="h-4 rounded-full bg-[#eee5d4] dark:bg-[#242016]"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 0) {
    return [];
  }

  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, startPage + 4);

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );
}

function MiniEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-[1.25rem] border border-dashed border-[#d8cdb6] bg-[#fff8e7] px-4 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
        {message}
      </p>
    </div>
  );
}

function EmptyAnalyticsState() {
  return (
    <div className="mt-6 rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] px-5 py-16 text-center shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-xl font-black text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        !
      </div>

      <h2 className="mt-4 text-xl font-black">No analytics data loaded</h2>

      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Refresh the page after public visitors open the website.
      </p>
    </div>
  );
}

function EmptyRecentVisits() {
  return (
    <div className="px-5 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-xl font-black text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        0
      </div>

      <h3 className="mt-4 text-xl font-black">No recent visits</h3>

      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Visit the public website pages to generate analytics data.
      </p>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-8 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-40 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-[1.5rem] bg-[#eee5d4] dark:bg-[#242016]"
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-96 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />
          <div className="h-96 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />
        </div>

        <div className="mt-6 h-96 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />
      </div>
    </main>
  );
}

function buildTimelinePath(
  values: number[],
  maxValue: number,
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
) {
  if (values.length === 0) return "";

  return values
    .map((value, index) => {
      const x = getTimelineX(index, values.length, width, paddingX);
      const y = getTimelineY(value, maxValue, height, paddingY);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildTimelineAreaPath(
  values: number[],
  maxValue: number,
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
) {
  if (values.length === 0) return "";

  const linePath = values
    .map((value, index) => {
      const x = getTimelineX(index, values.length, width, paddingX);
      const y = getTimelineY(value, maxValue, height, paddingY);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const firstX = getTimelineX(0, values.length, width, paddingX);
  const lastX = getTimelineX(values.length - 1, values.length, width, paddingX);
  const bottomY = height - paddingY;

  return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}

function getTimelineX(
  index: number,
  total: number,
  width: number,
  paddingX: number
) {
  if (total <= 1) return paddingX;

  return paddingX + (index / (total - 1)) * (width - paddingX * 2);
}

function getTimelineY(
  value: number,
  maxValue: number,
  height: number,
  paddingY: number
) {
  const safeMax = Math.max(maxValue, 1);
  const ratio = Math.min(Math.max(value / safeMax, 0), 1);

  return height - paddingY - ratio * (height - paddingY * 2);
}

function formatNumber(value: number | null | undefined) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
}

function getVisitReferrer(visit: AdminRecentVisit) {
  const visitWithReferrer = visit as AdminRecentVisit & {
    referrer?: string | null;
    refferer?: string | null;
  };

  return (
    visitWithReferrer.referrer?.trim() ||
    visitWithReferrer.refferer?.trim() ||
    "Direct"
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });
}

function formatUserAgent(userAgent?: string | null) {
  if (!userAgent?.trim()) {
    return "Unknown device";
  }

  if (userAgent.includes("Edg")) {
    return "Microsoft Edge";
  }

  if (userAgent.includes("Chrome")) {
    return "Chrome";
  }

  if (userAgent.includes("Firefox")) {
    return "Firefox";
  }

  if (userAgent.includes("Safari")) {
    return "Safari";
  }

  return userAgent;
}
function formatLongDate(value?: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const utcValue =
    value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;

  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
}
export default AdminAnalyticsPage;
