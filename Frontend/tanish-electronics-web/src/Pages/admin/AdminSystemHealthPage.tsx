import { useApiAuth } from "../../hooks/useApiAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
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
    document.title = "System Health";

    return () => {
      document.title = "Tanish Electronics";
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

type HoveredTimelinePoint = {
  index: number;
  mouseY: number;
};

function HealthTimelineChart({ snapshots }: { snapshots: HealthSnapshot[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredTimelinePoint | null>(
    null
  );

  const width = 720;
  const height = 220;
  const paddingX = 42;
  const paddingY = 30;

  const observedMax = Math.max(
    1,
    ...snapshots.flatMap((snapshot) => [
      snapshot.totalDurationMs,
      snapshot.sqlLatencyMs,
      snapshot.cacheDurationMs
    ])
  );

  const maxValue = Math.max(2, Math.ceil(observedMax * 1.25 * 100) / 100);

  const totalValues = snapshots.map((item) => item.totalDurationMs);
  const sqlValues = snapshots.map((item) => item.sqlLatencyMs);
  const cacheValues = snapshots.map((item) => item.cacheDurationMs);

  const totalPath = buildTimelinePath(
    totalValues,
    maxValue,
    width,
    height,
    paddingX,
    paddingY
  );

  const sqlPath = buildTimelinePath(
    sqlValues,
    maxValue,
    width,
    height,
    paddingX,
    paddingY
  );

  const cachePath = buildTimelinePath(
    cacheValues,
    maxValue,
    width,
    height,
    paddingX,
    paddingY
  );

  const totalAreaPath = buildTimelineAreaPath(
    totalValues,
    maxValue,
    width,
    height,
    paddingX,
    paddingY
  );

  const latest = snapshots[snapshots.length - 1];
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const hoveredSnapshot =
    hoveredPoint && snapshots[hoveredPoint.index]
      ? snapshots[hoveredPoint.index]
      : null;

  const hoveredX =
    hoveredPoint && hoveredSnapshot
      ? getTimelineX(hoveredPoint.index, snapshots.length, width, paddingX)
      : 0;

  const hoveredTotalY = hoveredSnapshot
    ? getTimelineY(hoveredSnapshot.totalDurationMs, maxValue, height, paddingY)
    : 0;

  const hoveredSqlY = hoveredSnapshot
    ? getTimelineY(hoveredSnapshot.sqlLatencyMs, maxValue, height, paddingY)
    : 0;

  const hoveredCacheY = hoveredSnapshot
    ? getTimelineY(hoveredSnapshot.cacheDurationMs, maxValue, height, paddingY)
    : 0;

  const crosshairValue = hoveredPoint
    ? getTimelineValueFromY(hoveredPoint.mouseY, maxValue, height, paddingY)
    : 0;

  function handleChartHover(event: MouseEvent<SVGRectElement>) {
    if (snapshots.length < 2) return;

    const svg = event.currentTarget.ownerSVGElement;

    if (!svg) return;

    const rect = svg.getBoundingClientRect();

    const mouseX = ((event.clientX - rect.left) / rect.width) * width;
    const mouseY = ((event.clientY - rect.top) / rect.height) * height;

    const chartWidth = width - paddingX * 2;
    const ratio = (mouseX - paddingX) / chartWidth;

    const index = Math.round(ratio * (snapshots.length - 1));
    const safeIndex = Math.min(Math.max(index, 0), snapshots.length - 1);

    const clampedY = Math.min(Math.max(mouseY, paddingY), height - paddingY);

    setHoveredPoint((current) => {
      if (current?.index === safeIndex && current.mouseY === clampedY) {
        return current;
      }

      return {
        index: safeIndex,
        mouseY: clampedY
      };
    });
  }

  return (
    <section className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Live performance
          </p>

          <h2 className="mt-1 text-xl font-black text-[#1f1a12] dark:text-[#f7f5ef]">
            Response timeline
          </h2>

          <p className="mt-1 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Last {snapshots.length} checks · refreshes every 15 seconds
          </p>
        </div>

        {latest && (
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f]">
            <Metric label="Total" value={latest.totalDurationMs} />
            <Metric label="SQL" value={latest.sqlLatencyMs} />
            <Metric label="Cache" value={latest.cacheDurationMs} />
          </div>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f] sm:p-4">
        {snapshots.length < 2 ? (
          <div className="flex h-64 items-center justify-center text-center">
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
            <div className="relative select-none">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-64 w-full select-none"
                role="img"
                aria-label="System health response-time timeline"
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
                        {formatDecimalMs(level * maxValue)}
                      </text>
                    </g>
                  );
                })}

                <path
                  d={totalAreaPath}
                  className="fill-[#d6b46a]/15 dark:fill-[#d6b46a]/10"
                />

                <path
                  d={totalPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#d6b46a]"
                />

                <path
                  d={sqlPath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-500 dark:text-emerald-400"
                />

                <path
                  d={cachePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6 6"
                  className="text-[#a8a093]"
                />

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

                    <line
                      x1={paddingX}
                      y1={hoveredPoint.mouseY}
                      x2={width - paddingX}
                      y2={hoveredPoint.mouseY}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="text-[#d6b46a]/70"
                    />

                    <rect
                      x={2}
                      y={hoveredPoint.mouseY - 8}
                      width={paddingX - 4}
                      height={16}
                      rx={4}
                      className="fill-[#d6b46a]"
                    />

                    <text
                      x={2 + (paddingX - 4) / 2}
                      y={hoveredPoint.mouseY + 4}
                      textAnchor="middle"
                      className="fill-[#11110f] text-[10px] font-black tabular-nums"
                    >
                      {formatDecimalMs(crosshairValue)}
                    </text>

                    <rect
                      x={hoveredX - 26}
                      y={height - paddingY + 6}
                      width={52}
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
                      {hoveredSnapshot.timeLabel}
                    </text>

                    <circle
                      cx={hoveredX}
                      cy={hoveredTotalY}
                      r="5"
                      className="fill-[#d6b46a] stroke-[#fffaf0] dark:stroke-[#11110f]"
                      strokeWidth="2"
                    />

                    <circle
                      cx={hoveredX}
                      cy={hoveredSqlY}
                      r="4.5"
                      className="fill-emerald-500 stroke-[#fffaf0] dark:fill-emerald-400 dark:stroke-[#11110f]"
                      strokeWidth="2"
                    />

                    <circle
                      cx={hoveredX}
                      cy={hoveredCacheY}
                      r="4.5"
                      className="fill-[#a8a093] stroke-[#fffaf0] dark:stroke-[#11110f]"
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

                {!hoveredPoint && (
                  <>
                    <text
                      x={paddingX}
                      y={height - 4}
                      className="fill-[#d8cdb6] text-[10px] font-black tabular-nums dark:fill-[#c7bda9]"
                    >
                      {snapshots[0]?.timeLabel}
                    </text>

                    <text
                      x={width - paddingX}
                      y={height - 4}
                      textAnchor="end"
                      className="fill-[#d8cdb6] text-[10px] font-black tabular-nums dark:fill-[#c7bda9]"
                    >
                      {latest?.timeLabel}
                    </text>
                  </>
                )}
              </svg>

              {hoveredSnapshot && hoveredPoint && (
                <TimelineHtmlTooltip
                  x={hoveredX}
                  y={Math.min(hoveredTotalY, hoveredSqlY, hoveredCacheY)}
                  width={width}
                  height={height}
                  timeLabel={hoveredSnapshot.timeLabel}
                  rows={[
                    {
                      label: "Total duration",
                      value: hoveredSnapshot.totalDurationMs,
                      dotClass: "bg-[#d6b46a]"
                    },
                    {
                      label: "SQL latency",
                      value: hoveredSnapshot.sqlLatencyMs,
                      dotClass: "bg-emerald-500"
                    },
                    {
                      label: "Cache duration",
                      value: hoveredSnapshot.cacheDurationMs,
                      dotClass: "bg-[#a8a093]"
                    }
                  ]}
                />
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#d8cdb6] pt-3 text-xs font-bold text-[#6f6758] dark:border-[#302c24] dark:text-[#a8a093]">
              <LegendDot className="bg-[#d6b46a]" label="Total duration" />

              <LegendDot
                className="bg-emerald-500 dark:bg-emerald-400"
                label="SQL latency"
              />

              <LegendDot className="bg-[#a8a093]" label="Cache duration" />

              <span className="tabular-nums sm:ml-auto">
                Scale: 0–{formatDecimalMs(maxValue)} ms
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TimelineHtmlTooltip({
  x,
  y,
  width,
  height,
  timeLabel,
  rows
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  timeLabel: string;
  rows: { label: string; value: number; dotClass: string }[];
}) {
  const leftPercent = (x / width) * 100;
  const topPercent = (y / height) * 100;

  const showOnLeft = x > width * 0.68;
  const showBelow = y < height * 0.4;

  const translateX = showOnLeft ? "calc(-100% - 16px)" : "16px";
  const translateY = showBelow ? "0px" : "calc(-100% - 0px)";

  return (
    <div
      className="pointer-events-none absolute z-20 min-w-44 rounded-2xl border border-[#d6b46a] bg-[#11110f] px-4 py-3 text-[#f7f5ef] shadow-2xl shadow-black/40"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        transform: `translate(${translateX}, ${translateY})`,
        willChange: "transform"
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d6b46a]">
        {timeLabel}
      </p>

      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-[11px] font-bold text-[#a8a093]">
              <span className={`h-2 w-2 rounded-full ${row.dotClass}`} />
              {row.label}
            </span>

            <span className="text-sm font-black tabular-nums text-[#f7f5ef]">
              {formatDecimalMs(row.value)} ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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

function getTimelineValueFromY(
  y: number,
  maxValue: number,
  height: number,
  paddingY: number
) {
  const ratio = Math.min(
    Math.max((height - paddingY - y) / (height - paddingY * 2), 0),
    1
  );

  return ratio * maxValue;
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
