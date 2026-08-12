import { useApiAuth } from "../../hooks/useApiAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Server,
  ShieldCheck
} from "lucide-react";

import {
  getHealthDetails,
  type HealthCheckItem,
  type HealthReport,
  type HealthStatus
} from "../../Services/healthService";
import { useShopSettings } from "../../hooks/useShopSettings";

const MAX_HEALTH_HISTORY_POINTS = 20;
const HEALTH_REFRESH_INTERVAL_MS = 15_000;
const HEALTH_HISTORY_STORAGE_KEY = "admin-health-history";

type HealthSnapshot = {
  timeLabel: string;
  status: HealthStatus;
  totalDurationMs: number;
  sqlLatencyMs: number;
  cacheDurationMs: number;
};

function AdminSystemHealthPage() {
  const { settings } = useShopSettings();
  const { getToken } = useApiAuth();

  const [health, setHealth] = useState<HealthReport | null>(null);
  const [history, setHistory] = useState<HealthSnapshot[]>(() => {
    const savedHistory = sessionStorage.getItem(HEALTH_HISTORY_STORAGE_KEY);

    if (!savedHistory) return [];

    try {
      return JSON.parse(savedHistory) as HealthSnapshot[];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `System Health | ${settings.shopName}`;

    return () => {
      document.title = `${settings.shopName}`;
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(HEALTH_HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const loadHealth = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) {
          setRefreshing(true);
        }

        setError("");

        const token = await getToken();
        const data = await getHealthDetails(token);
        const now = new Date();

        setHealth(data);
        setLastUpdatedAt(now);

        setHistory((current) => {
          const snapshot: HealthSnapshot = {
            timeLabel: now.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            }),
            status: data.status,
            totalDurationMs: data.totalDurationMs,
            sqlLatencyMs: getHealthCheckLatency(data, "sql-server"),
            cacheDurationMs: getHealthCheckDuration(data, "memory-cache")
          };

          return [...current, snapshot].slice(-MAX_HEALTH_HISTORY_POINTS);
        });
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to load system health."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    void loadHealth(true);
  }, [loadHealth]);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;

      void loadHealth(false);
    }, HEALTH_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, loadHealth]);

  const sortedChecks = useMemo(() => {
    if (!health) return [];

    return [...health.checks].sort(
      (a, b) => getStatusOrder(a.status) - getStatusOrder(b.status)
    );
  }, [health]);

  const healthyChecks = useMemo(
    () =>
      health?.checks.filter((check) => check.status === "Healthy").length ?? 0,
    [health]
  );

  return (
    <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-6 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d6b46a] text-[#11110f] shadow-sm">
                <Activity className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                  System monitoring
                </p>

                <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-[#1f1a12] dark:text-[#f7f5ef] sm:text-4xl">
                  System health
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                  Monitor API availability, database latency and cache response
                  time.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold text-[#817867] dark:text-[#928a7d]">
                  Last updated
                </p>

                <p className="mt-0.5 text-sm font-black tabular-nums text-[#1f1a12] dark:text-[#f7f5ef]">
                  {lastUpdatedAt
                    ? lastUpdatedAt.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })
                    : "Not available"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoRefresh((current) => !current)}
                aria-pressed={autoRefresh}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    autoRefresh ? "bg-emerald-500" : "bg-[#928a7d]"
                  }`}
                />
                Auto refresh {autoRefresh ? "on" : "off"}
              </button>

              <button
                type="button"
                onClick={() => void loadHealth(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#d6b46a] px-4 text-sm font-black text-[#11110f] transition hover:bg-[#c9a85f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />

                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <HealthLoading />
        ) : health ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <SummaryCard
                label="Overall status"
                value={health.status}
                helper={
                  health.status === "Healthy"
                    ? "All monitored services are working"
                    : "One or more services need attention"
                }
                status={health.status}
                icon={<ShieldCheck className="h-5 w-5" />}
              />

              <SummaryCard
                label="Response time"
                value={`${formatDecimalMs(health.totalDurationMs)} ms`}
                helper="Total health-check duration"
                status={getDurationStatus(health.totalDurationMs)}
                icon={<Clock3 className="h-5 w-5" />}
              />

              <SummaryCard
                label="Dependencies"
                value={`${healthyChecks}/${health.checks.length}`}
                helper="Services currently operational"
                status={
                  healthyChecks === health.checks.length
                    ? "Healthy"
                    : health.status
                }
                icon={<Server className="h-5 w-5" />}
              />
            </section>

            <HealthTimelineChart snapshots={history} />

            <section className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              <div className="border-b border-[#d8cdb6] px-5 py-4 dark:border-[#302c24] sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#11110f] dark:text-[#d6b46a]">
                    <Database className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="font-black text-[#1f1a12] dark:text-[#f7f5ef]">
                      Dependency checks
                    </h2>

                    <p className="mt-0.5 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                      Live status of connected infrastructure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#d8cdb6] dark:divide-[#302c24]">
                {sortedChecks.map((check) => (
                  <HealthCheckRow key={check.name} check={check} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-8 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
            <h2 className="text-lg font-black">No health data found</h2>

            <p className="mt-2 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
              Refresh the page to run another health check.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  status,
  icon
}: {
  label: string;
  value: string;
  helper: string;
  status: HealthStatus;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#11110f] dark:text-[#d6b46a]">
          {icon}
        </div>

        <StatusBadge status={status} />
      </div>

      <p className="mt-5 text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
        {label}
      </p>

      <p
        className={`mt-1 text-3xl font-black tabular-nums ${getStatusTextClass(
          status
        )}`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
        {helper}
      </p>
    </article>
  );
}

function HealthCheckRow({ check }: { check: HealthCheckItem }) {
  const latency =
    typeof check.data?.latencyMs === "number"
      ? check.data.latencyMs
      : check.durationMs;

  return (
    <article className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${getStatusIconClass(
            check.status
          )}`}
        >
          <StatusIcon status={check.status} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black capitalize text-[#1f1a12] dark:text-[#f7f5ef]">
              {formatCheckName(check.name)}
            </h3>

            <StatusBadge status={check.status} />
          </div>

          <p className="mt-1 text-sm font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {check.description || "No additional details provided."}
          </p>
        </div>
      </div>

      <div className="shrink-0 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 dark:border-[#302c24] dark:bg-[#11110f] sm:text-right">
        <p className="text-xs font-bold text-[#817867] dark:text-[#928a7d]">
          Latency
        </p>

        <p className="mt-1 text-base font-black tabular-nums text-[#1f1a12] dark:text-[#f7f5ef]">
          {formatDecimalMs(latency)} ms
        </p>
      </div>
    </article>
  );
}

function HealthTimelineChart({ snapshots }: { snapshots: HealthSnapshot[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pointerInside, setPointerInside] = useState(false);
  const [compactChart, setCompactChart] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");

    function syncCompactChart() {
      setCompactChart(mediaQuery.matches);
    }

    syncCompactChart();
    mediaQuery.addEventListener("change", syncCompactChart);

    return () => {
      mediaQuery.removeEventListener("change", syncCompactChart);
    };
  }, []);

  useEffect(() => {
    if (snapshots.length === 0) {
      setActiveIndex(0);
      return;
    }

    /*
     * Follow the newest value when a new health snapshot arrives,
     * unless the currently selected index still points to an item.
     */
    setActiveIndex(snapshots.length - 1);
  }, [snapshots.length]);

  const width = compactChart ? 380 : 900;
  const height = compactChart ? 260 : 320;
  const paddingLeft = compactChart ? 34 : 52;
  const paddingRight = compactChart ? 16 : 24;
  const paddingTop = compactChart ? 22 : 24;
  const paddingBottom = compactChart ? 34 : 38;

  const plotLeft = paddingLeft;
  const plotRight = width - paddingRight;
  const plotTop = paddingTop;
  const plotBottom = height - paddingBottom;
  const plotHeight = plotBottom - plotTop;

  const observedMax = Math.max(
    1,
    ...snapshots.flatMap((snapshot) => [
      snapshot.totalDurationMs,
      snapshot.sqlLatencyMs,
      snapshot.cacheDurationMs
    ])
  );

  const maxValue = getNiceChartMaximum(observedMax);

  const totalValues = snapshots.map((snapshot) => snapshot.totalDurationMs);

  const sqlValues = snapshots.map((snapshot) => snapshot.sqlLatencyMs);

  const cacheValues = snapshots.map((snapshot) => snapshot.cacheDurationMs);

  const totalPath = buildTimelinePathWithBounds(
    totalValues,
    maxValue,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom
  );

  const sqlPath = buildTimelinePathWithBounds(
    sqlValues,
    maxValue,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom
  );

  const cachePath = buildTimelinePathWithBounds(
    cacheValues,
    maxValue,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom
  );

  const totalAreaPath = buildTimelineAreaPathWithBounds(
    totalValues,
    maxValue,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom
  );

  const latest = snapshots.at(-1);

  const safeActiveIndex =
    snapshots.length === 0
      ? 0
      : Math.min(Math.max(activeIndex, 0), snapshots.length - 1);

  const activeSnapshot = snapshots[safeActiveIndex] ?? null;

  const activeX = activeSnapshot
    ? getTimelineXWithinBounds(
        safeActiveIndex,
        snapshots.length,
        plotLeft,
        plotRight
      )
    : plotLeft;

  const activeTotalY = activeSnapshot
    ? getTimelineYWithinBounds(
        activeSnapshot.totalDurationMs,
        maxValue,
        plotTop,
        plotBottom
      )
    : plotBottom;

  const activeSqlY = activeSnapshot
    ? getTimelineYWithinBounds(
        activeSnapshot.sqlLatencyMs,
        maxValue,
        plotTop,
        plotBottom
      )
    : plotBottom;

  const activeCacheY = activeSnapshot
    ? getTimelineYWithinBounds(
        activeSnapshot.cacheDurationMs,
        maxValue,
        plotTop,
        plotBottom
      )
    : plotBottom;

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const timeTickIndexes = getTimelineTickIndexes(
    snapshots.length,
    compactChart ? 3 : 4
  );

  /*
   * Each item owns a full vertical region bounded by the
   * midpoint between itself and the neighbouring points.
   *
   * The first and last regions extend all the way to the
   * SVG edges, so edge nodes are no longer difficult to select.
   */
  const hitZones = snapshots.map((_, index) => {
    const pointX = getTimelineXWithinBounds(
      index,
      snapshots.length,
      plotLeft,
      plotRight
    );

    const previousX =
      index === 0
        ? 0
        : getTimelineXWithinBounds(
            index - 1,
            snapshots.length,
            plotLeft,
            plotRight
          );

    const nextX =
      index === snapshots.length - 1
        ? width
        : getTimelineXWithinBounds(
            index + 1,
            snapshots.length,
            plotLeft,
            plotRight
          );

    const zoneStart = index === 0 ? 0 : (previousX + pointX) / 2;

    const zoneEnd =
      index === snapshots.length - 1 ? width : (pointX + nextX) / 2;

    return {
      index,
      x: zoneStart,
      width: Math.max(1, zoneEnd - zoneStart)
    };
  });

  function selectNearestPoint(event: ReactPointerEvent<SVGSVGElement>) {
    if (snapshots.length === 0) {
      return;
    }

    const rectangle = event.currentTarget.getBoundingClientRect();

    const svgX = ((event.clientX - rectangle.left) / rectangle.width) * width;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    snapshots.forEach((_, index) => {
      const pointX = getTimelineXWithinBounds(
        index,
        snapshots.length,
        plotLeft,
        plotRight
      );

      const distance = Math.abs(svgX - pointX);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
  }

  return (
    <section className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Live performance
          </p>

          <h2 className="font-display mt-1 text-3xl font-bold tracking-tight text-[#1f1a12] dark:text-[#f7f5ef]">
            Response timeline
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
            Last {snapshots.length} checks · refreshes every 15 seconds
          </p>
        </div>

        {latest && (
          <div className="grid grid-cols-3 gap-2 rounded-[1.2rem] border border-[#d8cdb6] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f] sm:gap-4">
            <Metric label="Total" value={latest.totalDurationMs} />

            <Metric label="SQL" value={latest.sqlLatencyMs} />

            <Metric label="Cache" value={latest.cacheDurationMs} />
          </div>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffaf0] dark:border-[#302c24] dark:bg-[#11110f]">
        {snapshots.length < 2 ? (
          <div className="flex h-64 items-center justify-center px-4 text-center">
            <div>
              <Activity className="mx-auto h-6 w-6 text-[#928a7d]" />

              <p className="mt-3 text-sm font-black text-[#6f6758] dark:text-[#a8a093]">
                Waiting for more health checks
              </p>

              <p className="mt-1 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                The graph appears after the next refresh.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#2a241c] dark:bg-[#090907]">
              {/* Trading-style chart toolbar */}
              <div className="flex items-center justify-between gap-3 border-b border-[#e4dbc9] bg-[#fffaf0] px-4 py-3 dark:border-[#2a241c] dark:bg-[#0d0c09]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    Live
                  </span>

                  <span className="rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#817867] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#a8a093]">
                    15s
                  </span>
                </div>

                {activeSnapshot && (
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
                    {activeSnapshot.timeLabel}
                  </span>
                )}
              </div>

              <div className="relative">
                {!compactChart && activeSnapshot && (
                  <DesktopTimelineInspector snapshot={activeSnapshot} />
                )}

                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="block h-[280px] w-full select-none touch-none sm:h-[350px]"
                  role="img"
                  aria-label="Interactive system health response-time timeline"
                  onPointerEnter={() => setPointerInside(true)}
                  onPointerLeave={() => setPointerInside(false)}
                  onPointerMove={(event) => {
                    setPointerInside(true);
                    selectNearestPoint(event);
                  }}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);

                    setPointerInside(true);
                    selectNearestPoint(event);
                  }}
                >
                  <defs>
                    <linearGradient
                      id="health-total-area"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#d6b46a" stopOpacity="0.3" />

                      <stop
                        offset="100%"
                        stopColor="#d6b46a"
                        stopOpacity="0.015"
                      />
                    </linearGradient>

                    <filter
                      id="health-line-glow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="2.5" result="blur" />

                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {gridLevels.map((level) => {
                    const y = plotBottom - level * plotHeight;

                    return (
                      <g key={level}>
                        <line
                          x1={plotLeft}
                          y1={y}
                          x2={plotRight}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeDasharray="4 7"
                          className="text-[#e4dbc9] dark:text-[#3a3022]"
                          opacity="0.8"
                        />

                        <text
                          x={4}
                          y={y + 4}
                          className="fill-[#8a6624] text-[10px] font-black tabular-nums dark:fill-[#d6b46a]"
                        >
                          {formatDecimalMs(level * maxValue)}
                        </text>
                      </g>
                    );
                  })}

                  {timeTickIndexes.map((index) => {
                    const x = getTimelineXWithinBounds(
                      index,
                      snapshots.length,
                      plotLeft,
                      plotRight
                    );

                    return (
                      <g key={index}>
                        <line
                          x1={x}
                          y1={plotTop}
                          x2={x}
                          y2={plotBottom}
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeDasharray="3 8"
                          className="text-[#eee6d7] dark:text-[#221d16]"
                        />

                        <text
                          x={x}
                          y={height - 10}
                          textAnchor={
                            index === 0
                              ? "start"
                              : index === snapshots.length - 1
                                ? "end"
                                : "middle"
                          }
                          className="fill-[#8a6624] text-[10px] font-black tabular-nums dark:fill-[#d6b46a]"
                        >
                          {snapshots[index]?.timeLabel}
                        </text>
                      </g>
                    );
                  })}

                  <path d={totalAreaPath} fill="url(#health-total-area)" />

                  <path
                    d={totalPath}
                    fill="none"
                    stroke="#d6b46a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#health-line-glow)"
                  />

                  <path
                    d={sqlPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d={cachePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="7 7"
                    className="text-[#817867] dark:text-[#d3cec5]"
                  />

                  {hitZones.map((zone) => (
                    <rect
                      key={zone.index}
                      x={zone.x}
                      y={plotTop}
                      width={zone.width}
                      height={plotHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onPointerEnter={() => setActiveIndex(zone.index)}
                      onPointerDown={() => setActiveIndex(zone.index)}
                    />
                  ))}

                  {activeSnapshot && (
                    <g pointerEvents="none">
                      <line
                        x1={activeX}
                        y1={plotTop}
                        x2={activeX}
                        y2={plotBottom}
                        stroke="#d6b46a"
                        strokeWidth="1.2"
                        strokeDasharray="4 5"
                        opacity={pointerInside ? 0.95 : 0.65}
                      />

                      <line
                        x1={plotLeft}
                        y1={activeTotalY}
                        x2={plotRight}
                        y2={activeTotalY}
                        stroke="#d6b46a"
                        strokeWidth="1"
                        strokeDasharray="3 7"
                        opacity="0.3"
                      />

                      <SelectedTimelinePoint
                        x={activeX}
                        y={activeTotalY}
                        fill="#d6b46a"
                      />

                      <SelectedTimelinePoint
                        x={activeX}
                        y={activeSqlY}
                        fill="#10b981"
                        radius={4.8}
                      />

                      <SelectedTimelinePoint
                        x={activeX}
                        y={activeCacheY}
                        fill="#d3cec5"
                        radius={4.4}
                      />
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {activeSnapshot && compactChart && (
              <MobileTimelineInspector snapshot={activeSnapshot} />
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#d8cdb6] px-4 py-3 text-xs font-bold text-[#6f6758] dark:border-[#302c24] dark:text-[#a8a093]">
              <LegendDot className="bg-[#d6b46a]" label="Total duration" />

              <LegendDot
                className="bg-emerald-500 dark:bg-emerald-400"
                label="SQL latency"
              />

              <LegendDot className="bg-[#a8a093]" label="Cache duration" />

              <span className="tabular-nums sm:ml-auto">
                Scale: 0–
                {formatDecimalMs(maxValue)} ms
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function DesktopTimelineInspector({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 w-[260px] rounded-[1.4rem] border border-[#d6b46a]/70 bg-[#fffdf7]/95 px-4 py-3 text-[#1f1a12] shadow-[0_22px_70px_rgba(31,26,18,0.18)] backdrop-blur dark:bg-[#090907]/95 dark:text-[#f7f5ef] dark:shadow-[0_22px_70px_rgba(0,0,0,0.48)]">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
        {snapshot.timeLabel}
      </p>

      <div className="mt-3 space-y-2">
        <TimelineInspectorRow
          label="Total duration"
          value={snapshot.totalDurationMs}
          dotClass="bg-[#d6b46a]"
        />

        <TimelineInspectorRow
          label="SQL latency"
          value={snapshot.sqlLatencyMs}
          dotClass="bg-emerald-500"
        />

        <TimelineInspectorRow
          label="Cache duration"
          value={snapshot.cacheDurationMs}
          dotClass="bg-[#817867] dark:bg-[#d3cec5]"
        />
      </div>
    </div>
  );
}

function MobileTimelineInspector({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <div className="border-t border-[#d8cdb6] px-4 py-4 dark:border-[#302c24]">
      <div className="rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
            Selected check
          </p>

          <span className="rounded-full border border-[#d8cdb6] bg-[#fffaf0] px-2.5 py-1 text-[10px] font-black tabular-nums dark:border-[#302c24] dark:bg-[#11110f]">
            {snapshot.timeLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <CompactMetric
            label="Total"
            value={snapshot.totalDurationMs}
            valueClassName="text-[#8a6624] dark:text-[#d6b46a]"
          />

          <CompactMetric
            label="SQL"
            value={snapshot.sqlLatencyMs}
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />

          <CompactMetric label="Cache" value={snapshot.cacheDurationMs} />
        </div>
      </div>
    </div>
  );
}

function TimelineInspectorRow({
  label,
  value,
  dotClass
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-[11px] font-bold text-[#6f6758] dark:text-[#c8c1b6]">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />

        {label}
      </span>

      <span className="text-sm font-black tabular-nums text-[#1f1a12] dark:text-[#f7f5ef]">
        {formatDecimalMs(value)} ms
      </span>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  valueClassName = "text-[#1f1a12] dark:text-[#f7f5ef]"
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e4dbc9] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="truncate text-[9px] font-black uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p
        className={`mt-1 truncate text-sm font-black tabular-nums ${valueClassName}`}
      >
        {formatDecimalMs(value)}
      </p>

      <p className="text-[9px] font-bold text-[#928a7d]">ms</p>
    </div>
  );
}

function SelectedTimelinePoint({
  x,
  y,
  fill,
  radius = 5.4
}: {
  x: number;
  y: number;
  fill: string;
  radius?: number;
}) {
  return (
    <>
      <circle cx={x} cy={y} r={radius + 4} fill={fill} opacity="0.13" />

      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={fill}
        stroke="currentColor"
        strokeWidth="2.4"
        className="text-[#fffdf7] dark:text-[#090907]"
      />
    </>
  );
}

function getTimelineTickIndexes(total: number, requestedTickCount: number) {
  if (total <= 0) {
    return [];
  }

  if (total <= requestedTickCount) {
    return Array.from({ length: total }, (_, index) => index);
  }

  const indexes = new Set<number>();

  for (let tick = 0; tick < requestedTickCount; tick += 1) {
    indexes.add(Math.round((tick / (requestedTickCount - 1)) * (total - 1)));
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

function getNiceChartMaximum(observedMaximum: number) {
  const paddedMaximum = Math.max(observedMaximum * 1.18, 2);

  const magnitude = 10 ** Math.floor(Math.log10(paddedMaximum));

  const normalized = paddedMaximum / magnitude;

  const niceNormalized =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;

  return niceNormalized * magnitude;
}

function buildTimelinePathWithBounds(
  values: number[],
  maxValue: number,
  left: number,
  right: number,
  top: number,
  bottom: number
) {
  if (values.length === 0) {
    return "";
  }

  return values
    .map((value, index) => {
      const x = getTimelineXWithinBounds(index, values.length, left, right);

      const y = getTimelineYWithinBounds(value, maxValue, top, bottom);

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildTimelineAreaPathWithBounds(
  values: number[],
  maxValue: number,
  left: number,
  right: number,
  top: number,
  bottom: number
) {
  if (values.length === 0) {
    return "";
  }

  const linePath = buildTimelinePathWithBounds(
    values,
    maxValue,
    left,
    right,
    top,
    bottom
  );

  const firstX = getTimelineXWithinBounds(0, values.length, left, right);

  const lastX = getTimelineXWithinBounds(
    values.length - 1,
    values.length,
    left,
    right
  );

  return `${linePath} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
}

function getTimelineXWithinBounds(
  index: number,
  total: number,
  left: number,
  right: number
) {
  if (total <= 1) {
    return left;
  }

  return left + (index / (total - 1)) * (right - left);
}

function getTimelineYWithinBounds(
  value: number,
  maxValue: number,
  top: number,
  bottom: number
) {
  const safeMaximum = Math.max(maxValue, 1);

  const ratio = Math.min(Math.max(value / safeMaximum, 0), 1);

  return bottom - ratio * (bottom - top);
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-black tabular-nums text-[#1f1a12] dark:text-[#f7f5ef]">
        {formatDecimalMs(value)} ms
      </p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${getStatusBadgeClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === "Healthy") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  return <Activity className="h-4 w-4" />;
}

function HealthLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
          />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />
    </div>
  );
}

function getHealthCheckLatency(report: HealthReport, checkName: string) {
  const check = report.checks.find((item) => item.name === checkName);

  if (!check) return 0;

  const latency = check.data?.latencyMs;

  return typeof latency === "number" ? latency : check.durationMs;
}

function getHealthCheckDuration(report: HealthReport, checkName: string) {
  return report.checks.find((item) => item.name === checkName)?.durationMs ?? 0;
}

function getStatusOrder(status: HealthStatus) {
  if (status === "Unhealthy") return 1;
  if (status === "Degraded") return 2;

  return 3;
}

function getStatusBadgeClass(status: HealthStatus) {
  if (status === "Healthy") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (status === "Degraded") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
}

function getStatusTextClass(status: HealthStatus) {
  if (status === "Healthy") return "text-emerald-600 dark:text-emerald-400";
  if (status === "Degraded") return "text-amber-600 dark:text-amber-400";

  return "text-red-600 dark:text-red-400";
}

function getStatusIconClass(status: HealthStatus) {
  if (status === "Healthy") {
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (status === "Degraded") {
    return "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300";
  }

  return "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300";
}

function getDurationStatus(durationMs: number): HealthStatus {
  if (durationMs > 1_000) return "Unhealthy";
  if (durationMs > 500) return "Degraded";

  return "Healthy";
}

function formatCheckName(name: string) {
  return name.replaceAll("-", " ");
}

function formatDecimalMs(value: number) {
  return value.toFixed(2);
}

export default AdminSystemHealthPage;
