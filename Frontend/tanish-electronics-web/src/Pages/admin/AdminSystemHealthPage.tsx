import { useApiAuth } from "../../hooks/useApiAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  FolderArchive,
  HardDrive,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  Zap
} from "lucide-react";

import {
  getHealthDetails,
  type HealthCheckItem,
  type HealthReport,
  type HealthStatus
} from "../../Services/healthService";
import { useShopSettings } from "../../hooks/useShopSettings";

const MAX_HEALTH_HISTORY_POINTS = 24;
const HEALTH_REFRESH_INTERVAL_MS = 30_000;
const HEALTH_HISTORY_STORAGE_KEY = "admin-health-history";

type HealthSnapshot = {
  timeLabel: string;
  status: HealthStatus;
  totalDurationMs: number;
  sqlLatencyMs: number;
  cacheDurationMs: number;
};

type ServiceCategory = "all" | "database" | "system" | "ai";

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
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");

  useEffect(() => {
    document.title = `System Health | ${settings.shopName}`;
    return () => {
      document.title = `${settings.shopName}`;
    };
  }, [settings.shopName]);

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

  const filteredChecks = useMemo(() => {
    if (activeCategory === "all") return sortedChecks;
    return sortedChecks.filter((c) => getCheckCategory(c.name) === activeCategory);
  }, [sortedChecks, activeCategory]);

  const healthyChecks = useMemo(
    () => health?.checks.filter((check) => check.status === "Healthy").length ?? 0,
    [health]
  );

  const sqlLatency = useMemo(() => {
    if (!health) return 0;
    return getHealthCheckLatency(health, "sql-server");
  }, [health]);

  const groqLatency = useMemo(() => {
    if (!health) return 0;
    return getHealthCheckLatency(health, "groq-ai");
  }, [health]);

  return (
    <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-3 py-4 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header - Fully Mobile Responsive */}
        <header className="rounded-[1.4rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#2b271f] dark:bg-[#181510] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d6b46a] text-[#11110f] shadow-sm sm:h-12 sm:w-12">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a] sm:text-[11px]">
                    System Telemetry
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 sm:text-[10px]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    LIVE
                  </span>
                </div>

                <h1 className="font-display truncate text-xl font-bold tracking-tight text-[#1f1a12] dark:text-[#f7f5ef] sm:text-2xl lg:text-3xl">
                  System Health
                </h1>
              </div>
            </div>

            {/* Toolbar Buttons - Responsive on Mobile */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 py-1.5 text-xs dark:border-[#2b271f] dark:bg-[#11110f] sm:justify-start sm:py-2">
                <span className="text-[#817867] dark:text-[#928a7d]">Last Ping:</span>
                <span className="font-mono font-bold tabular-nums text-[#1f1a12] dark:text-[#f7f5ef]">
                  {lastUpdatedAt
                    ? lastUpdatedAt.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })
                    : "Connecting..."}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() => setAutoRefresh((current) => !current)}
                  aria-pressed={autoRefresh}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 text-xs font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#2b271f] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#201c15] sm:h-10 sm:px-3.5"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      autoRefresh ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-[#928a7d]"
                    }`}
                  />
                  Auto: {autoRefresh ? "30s" : "Off"}
                </button>

                <button
                  type="button"
                  onClick={() => void loadHealth(true)}
                  disabled={refreshing}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#d6b46a] px-3.5 text-xs font-black text-[#11110f] shadow-sm transition hover:bg-[#c9a85f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:px-4"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Checking..." : "Ping Now"}
                </button>
              </div>
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
            {/* Top 4 Summary Cards - 2x2 Grid on Mobile, 4-col on Large */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <SummaryCard
                label="System Status"
                value={health.status}
                helper="All services operational"
                status={health.status}
                icon={<ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />}
              />

              <SummaryCard
                label="Database"
                value={`${formatDecimalMs(sqlLatency)} ms`}
                helper="SQL Server query"
                status={sqlLatency > 1000 ? "Unhealthy" : sqlLatency > 300 ? "Degraded" : "Healthy"}
                icon={<Database className="h-4 w-4 sm:h-5 sm:w-5" />}
              />

              <SummaryCard
                label="Groq AI Cloud"
                value={groqLatency > 0 ? `${formatDecimalMs(groqLatency)} ms` : "Online"}
                helper="LLaMA 3.3 (Cached 3m)"
                status={groqLatency > 2500 ? "Degraded" : "Healthy"}
                icon={<Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />}
              />

              <SummaryCard
                label="Services"
                value={`${healthyChecks} / ${health.checks.length}`}
                helper="Healthy components"
                status={healthyChecks === health.checks.length ? "Healthy" : health.status}
                icon={<Server className="h-4 w-4 sm:h-5 sm:w-5" />}
              />
            </section>

            {/* Enhanced Smooth Response Timeline Graph */}
            <HealthTimelineChart snapshots={history} />

            {/* Subsystem Breakdown List */}
            <section className="rounded-[1.4rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#2b271f] dark:bg-[#181510]">
              <div className="flex flex-col gap-3 border-b border-[#d8cdb6] p-4 dark:border-[#2b271f] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div>
                  <h2 className="text-sm font-bold text-[#1f1a12] dark:text-[#f7f5ef] sm:text-base">
                    Subsystem Diagnostics ({health.checks.length})
                  </h2>
                  <p className="text-[11px] text-[#6f6758] dark:text-[#a8a093] sm:text-xs">
                    Live telemetry metrics for connected infrastructure.
                  </p>
                </div>

                {/* Horizontally Scrollable Category Filter Pills on Mobile */}
                <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5 sm:mx-0 sm:overflow-visible sm:px-0">
                  {(
                    [
                      { id: "all", label: "All Services" },
                      { id: "database", label: "Database & Auth" },
                      { id: "system", label: "Host & Storage" },
                      { id: "ai", label: "AI Cloud" }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition sm:px-3 ${
                        activeCategory === tab.id
                          ? "bg-[#d6b46a] text-[#11110f] shadow-sm"
                          : "border border-[#d8cdb6]/70 bg-[#fffaf0] text-[#6f6758] hover:text-[#1f1a12] dark:border-[#2b271f] dark:bg-[#11110f] dark:text-[#a8a093] dark:hover:text-[#f7f5ef]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-[#d8cdb6]/60 dark:divide-[#2b271f]">
                {filteredChecks.map((check) => (
                  <HealthCheckRow key={check.name} check={check} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-[1.4rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 text-center dark:border-[#2b271f] dark:bg-[#181510] sm:p-8">
            <h2 className="text-base font-black sm:text-lg">No health data available</h2>
            <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093] sm:text-sm">
              Click the Ping Now button above to run live diagnostics.
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
    <article className="flex flex-col justify-between rounded-[1.2rem] border border-[#d8cdb6] bg-[#fffdf7] p-3.5 shadow-sm dark:border-[#2b271f] dark:bg-[#181510] sm:rounded-[1.3rem] sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-black uppercase tracking-wider text-[#6f6758] dark:text-[#a8a093] sm:text-[11px]">
          {label}
        </span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#201c15] dark:text-[#d6b46a] sm:h-8 sm:w-8">
          {icon}
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-1.5">
        <p className={`truncate text-lg font-black tabular-nums sm:text-2xl ${getStatusTextClass(status)}`}>
          {value}
        </p>
        <StatusBadge status={status} compact />
      </div>

      <p className="mt-1.5 truncate text-[10px] font-medium text-[#817867] dark:text-[#928a7d] sm:text-[11px]">
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

  const meta = getCheckMeta(check);

  return (
    <article className="flex flex-col gap-2.5 p-3.5 transition hover:bg-[#fffaf0]/60 dark:hover:bg-[#1f1b14]/50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
      {/* Mobile Top Row: Icon + Title + Status Badge */}
      <div className="flex items-start justify-between gap-3 sm:min-w-0 sm:items-center sm:justify-start sm:gap-3.5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-3.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#201c15] dark:text-[#d6b46a] sm:mt-0 sm:h-9 sm:w-9">
            {meta.icon}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-xs font-bold text-[#1f1a12] dark:text-[#f7f5ef] sm:text-sm">
                {meta.displayName}
              </h3>
              <span className="rounded border border-[#d8cdb6]/60 bg-[#fffaf0] px-1.5 py-0.2 text-[9px] font-bold text-[#817867] dark:border-[#2b271f] dark:bg-[#11110f] dark:text-[#928a7d] sm:text-[10px]">
                {meta.categoryLabel}
              </span>
            </div>

            <p className="mt-0.5 text-[11px] text-[#6f6758] dark:text-[#a8a093] sm:text-xs">
              {check.description || "Component operating normally."}
            </p>
          </div>
        </div>

        <div className="shrink-0 sm:hidden">
          <StatusBadge status={check.status} />
        </div>
      </div>

      {/* Metrics & Execution Time */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 sm:pt-0">
        {meta.badges.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px]">
            {meta.badges.map((b, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md border border-[#e4dbc9]/70 bg-[#fbf9f4] px-1.5 py-0.5 font-mono text-[#8a6624] dark:border-[#2b271f] dark:bg-[#11110f] dark:text-[#d6b46a]"
              >
                <span>{b.label}:</span>
                <span className="font-bold text-[#1f1a12] dark:text-[#f7f5ef]">{b.value}</span>
              </span>
            ))}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="font-mono text-xs font-bold tabular-nums text-[#1f1a12] dark:text-[#f7f5ef] sm:text-sm">
            {formatDecimalMs(latency)} ms
          </span>
          <div className="hidden sm:block">
            <StatusBadge status={check.status} />
          </div>
        </div>
      </div>
    </article>
  );
}

function HealthTimelineChart({ snapshots }: { snapshots: HealthSnapshot[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
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
    setActiveIndex(snapshots.length - 1);
  }, [snapshots.length]);

  const width = compactChart ? 360 : 900;
  const height = compactChart ? 170 : 220;
  const paddingLeft = compactChart ? 40 : 48;
  const paddingRight = compactChart ? 12 : 24;
  const paddingTop = 14;
  const paddingBottom = 26;

  const plotLeft = paddingLeft;
  const plotRight = width - paddingRight;
  const plotTop = paddingTop;
  const plotBottom = height - paddingBottom;

  const observedMax = Math.max(
    1,
    ...snapshots.flatMap((snapshot) => [
      snapshot.totalDurationMs,
      snapshot.sqlLatencyMs
    ])
  );

  const maxValue = getNiceChartMaximum(observedMax);

  const totalPoints = snapshots.map((s, idx) => ({
    x: getTimelineXWithinBounds(idx, snapshots.length, plotLeft, plotRight),
    y: getTimelineYWithinBounds(s.totalDurationMs, maxValue, plotTop, plotBottom)
  }));

  const sqlPoints = snapshots.map((s, idx) => ({
    x: getTimelineXWithinBounds(idx, snapshots.length, plotLeft, plotRight),
    y: getTimelineYWithinBounds(s.sqlLatencyMs, maxValue, plotTop, plotBottom)
  }));

  const totalSmoothPath = buildSmoothPath(totalPoints);
  const sqlSmoothPath = buildSmoothPath(sqlPoints);
  const totalSmoothArea = totalPoints.length > 0
    ? `${totalSmoothPath} L ${totalPoints[totalPoints.length - 1].x} ${plotBottom} L ${totalPoints[0].x} ${plotBottom} Z`
    : "";

  const safeActiveIndex =
    snapshots.length === 0 ? 0 : Math.min(Math.max(activeIndex, 0), snapshots.length - 1);
  const activeSnapshot = snapshots[safeActiveIndex] ?? null;

  const activePoint = totalPoints[safeActiveIndex] ?? null;
  const activeSqlPoint = sqlPoints[safeActiveIndex] ?? null;

  const gridLevels = [0, 0.5, 1];
  const timeTickIndexes = getTimelineTickIndexes(snapshots.length, compactChart ? 3 : 5);

  const hitZones = snapshots.map((_, index) => {
    const pointX = getTimelineXWithinBounds(index, snapshots.length, plotLeft, plotRight);
    const previousX =
      index === 0
        ? 0
        : getTimelineXWithinBounds(index - 1, snapshots.length, plotLeft, plotRight);
    const nextX =
      index === snapshots.length - 1
        ? width
        : getTimelineXWithinBounds(index + 1, snapshots.length, plotLeft, plotRight);

    const zoneStart = index === 0 ? 0 : (previousX + pointX) / 2;
    const zoneEnd = index === snapshots.length - 1 ? width : (pointX + nextX) / 2;

    return {
      index,
      x: zoneStart,
      width: Math.max(1, zoneEnd - zoneStart)
    };
  });

  function selectNearestPoint(event: ReactPointerEvent<SVGSVGElement>) {
    if (snapshots.length === 0) return;
    const rectangle = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rectangle.left) / rectangle.width) * width;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    snapshots.forEach((_, index) => {
      const pointX = getTimelineXWithinBounds(index, snapshots.length, plotLeft, plotRight);
      const distance = Math.abs(pointX - svgX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
  }

  return (
    <section className="rounded-[1.4rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#2b271f] dark:bg-[#181510] sm:p-6">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1f1a12] dark:text-[#f7f5ef] sm:text-base">
            Response Time Trend
          </h2>
          <p className="text-[11px] text-[#6f6758] dark:text-[#a8a093] sm:text-xs">
            Historical telemetry over the last {snapshots.length} pings.
          </p>
        </div>

        {activeSnapshot && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-2.5 py-1 text-[11px] font-bold dark:border-[#2b271f] dark:bg-[#11110f] sm:px-3 sm:py-1.5 sm:text-xs">
            <span className="text-[#817867] dark:text-[#928a7d]">{activeSnapshot.timeLabel}:</span>
            <span className="text-[#8a6624] dark:text-[#d6b46a]">Total: {formatDecimalMs(activeSnapshot.totalDurationMs)} ms</span>
            <span className="text-emerald-600 dark:text-emerald-400">SQL: {formatDecimalMs(activeSnapshot.sqlLatencyMs)} ms</span>
          </div>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-[#e4dbc9] bg-[#fbf9f4] dark:border-[#2b271f] dark:bg-[#0c0b09] sm:mt-4 sm:rounded-2xl">
        {snapshots.length < 2 ? (
          <div className="flex h-36 items-center justify-center p-4 text-center text-xs font-bold text-[#817867] dark:text-[#928a7d] sm:h-44 sm:p-6">
            Accumulating ping snapshots... History builds every 30 seconds.
          </div>
        ) : (
          <>
            <div className="p-1 sm:p-3">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full touch-none select-none"
                onPointerDown={selectNearestPoint}
                onPointerMove={selectNearestPoint}
              >
                <defs>
                  <linearGradient id="total-grad-smooth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d6b46a" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#d6b46a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid */}
                {gridLevels.map((level) => {
                  const y = plotBottom - level * (plotBottom - plotTop);
                  const labelValue = maxValue * level;
                  return (
                    <g key={level}>
                      <line
                        x1={plotLeft}
                        y1={y}
                        x2={plotRight}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        className="text-[#d8cdb6]/40 dark:text-[#2b271f]"
                      />
                      <text
                        x={plotLeft - 6}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-[#817867] text-[9px] font-bold tabular-nums dark:fill-[#928a7d] sm:text-[10px]"
                      >
                        {labelValue >= 1000 ? `${(labelValue / 1000).toFixed(1)}s` : `${Math.round(labelValue)}ms`}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Time Labels */}
                {timeTickIndexes.map((idx) => {
                  const snap = snapshots[idx];
                  if (!snap) return null;
                  const x = getTimelineXWithinBounds(idx, snapshots.length, plotLeft, plotRight);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={plotBottom + 16}
                      textAnchor="middle"
                      className="fill-[#817867] text-[9px] font-bold tabular-nums dark:fill-[#928a7d] sm:text-[10px]"
                    >
                      {snap.timeLabel}
                    </text>
                  );
                })}

                {/* Smooth Area & Line for Total */}
                <path d={totalSmoothArea} fill="url(#total-grad-smooth)" />
                <path
                  d={totalSmoothPath}
                  fill="none"
                  stroke="#d6b46a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Smooth SQL Line */}
                <path
                  d={sqlSmoothPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Active Hover Marker */}
                {activePoint && activeSqlPoint && (
                  <>
                    <line
                      x1={activePoint.x}
                      y1={plotTop}
                      x2={activePoint.x}
                      y2={plotBottom}
                      stroke="#d6b46a"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                    <circle cx={activePoint.x} cy={activePoint.y} r={4} fill="#d6b46a" stroke="#fff" strokeWidth="1.5" />
                    <circle cx={activeSqlPoint.x} cy={activeSqlPoint.y} r={3} fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                  </>
                )}

                {/* Hit zones */}
                {hitZones.map((zone) => (
                  <rect
                    key={zone.index}
                    x={zone.x}
                    y={plotTop}
                    width={zone.width}
                    height={plotBottom - plotTop}
                    fill="transparent"
                    className="cursor-crosshair"
                  />
                ))}
              </svg>
            </div>

            <div className="flex flex-col justify-between gap-1.5 border-t border-[#e4dbc9] px-3 py-2 text-[10px] font-bold text-[#6f6758] dark:border-[#2b271f] dark:text-[#a8a093] sm:flex-row sm:items-center sm:px-4 sm:py-2.5 sm:text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#d6b46a]" />
                  Total Health Check Duration
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                  SQL Latency
                </span>
              </div>
              <span className="text-[10px] text-[#817867] dark:text-[#928a7d] sm:text-[11px]">
                Peak: {formatDecimalMs(maxValue)} ms
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// --- Helpers & Visual Metadata ---

function getCheckCategory(name: string): "database" | "system" | "ai" {
  if (name.includes("sql") || name.includes("session") || name.includes("cache")) return "database";
  if (name.includes("groq") || name.includes("ai")) return "ai";
  return "system";
}

function getCheckMeta(check: HealthCheckItem): {
  displayName: string;
  categoryLabel: string;
  icon: ReactNode;
  badges: Array<{ label: string; value: string }>;
} {
  const data = check.data || {};
  const name = check.name.toLowerCase();

  if (name.includes("sql")) {
    return {
      displayName: "SQL Server Database",
      categoryLabel: "Core DB",
      icon: <Database className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Query", value: "SELECT 1" },
        { label: "Latency", value: `${formatDecimalMs(typeof data.latencyMs === "number" ? data.latencyMs : check.durationMs)} ms` }
      ]
    };
  }

  if (name.includes("session")) {
    return {
      displayName: "User Session Store",
      categoryLabel: "Auth DB",
      icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Active Sessions", value: String(data.activeSessionCount ?? "1") }
      ]
    };
  }

  if (name.includes("memory-cache")) {
    return {
      displayName: "In-Memory Application Cache",
      categoryLabel: "RAM Cache",
      icon: <Layers className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Engine", value: "IMemoryCache" },
        { label: "State", value: "Verified" }
      ]
    };
  }

  if (name.includes("groq") || name.includes("ai")) {
    return {
      displayName: "Groq AI Inference Service",
      categoryLabel: "AI Cloud",
      icon: <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Model", value: String(data.configuredModel ?? "llama-3.3-70b-versatile") },
        { label: "Ping (Cached 3m)", value: `${formatDecimalMs(typeof data.latencyMs === "number" ? data.latencyMs : check.durationMs)} ms` }
      ]
    };
  }

  if (name.includes("process-memory")) {
    return {
      displayName: "Server Host & RAM Memory",
      categoryLabel: "Process",
      icon: <Cpu className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Working Set", value: `${data.workingSetMb ?? "0"} MB` },
        { label: "GC Heap", value: `${data.gcAllocatedMb ?? "0"} MB` },
        { label: "Threads", value: String(data.threadCount ?? "0") }
      ]
    };
  }

  if (name.includes("disk")) {
    return {
      displayName: "Server Disk Storage",
      categoryLabel: "Storage",
      icon: <HardDrive className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Free", value: `${data.freeGb ?? "0"} GB` },
        { label: "Total", value: `${data.totalGb ?? "0"} GB (${data.freePercentage ?? "0"}%)` }
      ]
    };
  }

  if (name.includes("upload")) {
    return {
      displayName: "Uploads Media Storage",
      categoryLabel: "File System",
      icon: <FolderArchive className="h-4 w-4 sm:h-5 sm:w-5" />,
      badges: [
        { label: "Folder", value: "wwwroot/uploads" },
        { label: "Permissions", value: "Read/Write OK" }
      ]
    };
  }

  return {
    displayName: check.name.replaceAll("-", " ").toUpperCase(),
    categoryLabel: "Service",
    icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5" />,
    badges: []
  };
}

function StatusBadge({ status, compact }: { status: HealthStatus; compact?: boolean }) {
  if (status === "Healthy") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ${compact ? "px-1.5 py-0.2 text-[9px] sm:px-2 sm:text-[10px]" : "px-2 py-0.5 text-[10px] sm:text-[11px]"}`}>
        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        Healthy
      </span>
    );
  }

  if (status === "Degraded") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 font-black text-amber-800 dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-300 ${compact ? "px-1.5 py-0.2 text-[9px] sm:px-2 sm:text-[10px]" : "px-2 py-0.5 text-[10px] sm:text-[11px]"}`}>
        <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        Degraded
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 font-black text-red-800 dark:border-red-700 dark:bg-red-950/80 dark:text-red-300 ${compact ? "px-1.5 py-0.2 text-[9px] sm:px-2 sm:text-[10px]" : "px-2 py-0.5 text-[10px] sm:text-[11px]"}`}>
      <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
      Unhealthy
    </span>
  );
}

function HealthLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[1.2rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#2b271f] dark:bg-[#181510] sm:h-32 sm:rounded-[1.3rem]"
          />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-[1.4rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#2b271f] dark:bg-[#181510] sm:h-64" />
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

function getStatusTextClass(status: HealthStatus) {
  if (status === "Healthy") return "text-emerald-600 dark:text-emerald-400";
  if (status === "Degraded") return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function formatDecimalMs(value: number) {
  return value.toFixed(2);
}

function getTimelineTickIndexes(total: number, requestedTickCount: number) {
  if (total <= 0) return [];
  if (total <= requestedTickCount) return Array.from({ length: total }, (_, index) => index);
  const indexes = new Set<number>();
  for (let tick = 0; tick < requestedTickCount; tick += 1) {
    indexes.add(Math.round((tick / (requestedTickCount - 1)) * (total - 1)));
  }
  return Array.from(indexes).sort((left, right) => left - right);
}

function getNiceChartMaximum(observedMaximum: number) {
  const paddedMaximum = Math.max(observedMaximum * 1.15, 5);
  const magnitude = 10 ** Math.floor(Math.log10(paddedMaximum));
  const normalized = paddedMaximum / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function getTimelineXWithinBounds(index: number, total: number, left: number, right: number) {
  if (total <= 1) return left;
  return left + (index / (total - 1)) * (right - left);
}

function getTimelineYWithinBounds(value: number, maxValue: number, top: number, bottom: number) {
  const safeMaximum = Math.max(maxValue, 1);
  const ratio = Math.min(Math.max(value / safeMaximum, 0), 1);
  return bottom - ratio * (bottom - top);
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default AdminSystemHealthPage;
