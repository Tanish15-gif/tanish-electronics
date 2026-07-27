import { useApiAuth } from "../../hooks/useApiAuth";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDashboardSummary,
  type AdminDashboardSummary
} from "../../Services/adminDashboardService";

type DashboardTab = "overview" | "activity";

function AdminDashboardPage() {
  const { getToken } = useApiAuth();

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    document.title = "Admin Dashboard | Tanish Electronics";

    return () => {
      document.title = "Tanish Electronics";
    };
  }, []);

  async function loadDashboard(backgroundRefresh = false) {
    try {
      if (backgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await getAdminDashboardSummary(token);

      setSummary({
        ...data,
        recentServiceRequests: data.recentServiceRequests || [],
        recentEnquiries: data.recentEnquiries || []
      });

      setLastUpdated(new Date());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading && !summary) {
    return <DashboardLoading />;
  }

  if (!summary) {
    return (
      <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error || "Dashboard could not be loaded."}
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-4 h-11 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const attentionCount =
    summary.pendingServiceRequests +
    summary.newEnquiries +
    summary.lowStockProducts;

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Admin control centre
              </p>

              <h1 className="font-display mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Monitor repair work, customer enquiries and product inventory.
              </p>

              {lastUpdated && (
                <p className="mt-3 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                  Last updated{" "}
                  {lastUpdated.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/admin/service-requests"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#d8cdb6] px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                Service requests
              </Link>

              <Link
                to="/admin/products/new"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                <PlusIcon />
                Add product
              </Link>

              <button
                type="button"
                disabled={refreshing}
                onClick={() => void loadDashboard(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                <RefreshIcon spinning={refreshing} />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              className="shrink-0 underline"
            >
              Retry
            </button>
          </div>
        )}

        <DashboardTabs
          activeTab={activeTab}
          attentionCount={attentionCount}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && (
          <div className="mt-6 space-y-6">
            {/* Attention area */}
            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
              <div className="flex flex-col gap-2 border-b border-[#d8cdb6] pb-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">Needs attention</h2>

                  <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                    Tasks that may require an admin action.
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                  {attentionCount} items
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <AttentionCard
                  to="/admin/service-requests"
                  label="Pending repairs"
                  value={summary.pendingServiceRequests}
                  description="Repair bookings waiting for action."
                  tone="amber"
                  icon={<RepairIcon />}
                />

                <AttentionCard
                  to="/admin/enquiries"
                  label="New enquiries"
                  value={summary.newEnquiries}
                  description="Customers waiting for a response."
                  tone="blue"
                  icon={<MessageIcon />}
                />

                <AttentionCard
                  to="/admin/products"
                  label="Low stock"
                  value={summary.lowStockProducts}
                  description="Products with one unit or less."
                  tone={summary.lowStockProducts > 0 ? "red" : "green"}
                  icon={<BoxIcon />}
                />
              </div>
            </section>

            {/* Main metrics */}
            <section>
              <div className="mb-4 px-1">
                <h2 className="text-xl font-black">Business overview</h2>

                <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  Current repair and inventory totals.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  to="/admin/service-requests"
                  label="Total requests"
                  value={summary.totalServiceRequests}
                  helper="All repair bookings"
                />

                <MetricCard
                  to="/admin/service-requests"
                  label="In progress"
                  value={summary.inProgressServiceRequests}
                  helper="Currently being worked on"
                  tone="blue"
                />

                <MetricCard
                  to="/admin/service-requests"
                  label="Completed"
                  value={summary.completedServiceRequests}
                  helper="Finished repair requests"
                  tone="green"
                />

                <MetricCard
                  to="/admin/products"
                  label="Available products"
                  value={summary.availableProducts}
                  helper="Visible public listings"
                />

                <MetricCard
                  to="/admin/products"
                  label="Featured products"
                  value={summary.featuredProducts}
                  helper="Highlighted listings"
                  tone="gold"
                />

                <MetricCard
                  to="/admin/enquiries"
                  label="Product enquiries"
                  value={summary.newEnquiries}
                  helper="New customer leads"
                  tone="blue"
                />
              </div>
            </section>

            {/* Quick management */}
            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
              <div className="border-b border-[#d8cdb6] pb-4 dark:border-[#302c24]">
                <h2 className="text-xl font-black">Quick management</h2>

                <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  Open frequently used admin sections.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink
                  to="/admin/service-requests"
                  title="Repair requests"
                  description="Manage repair workflow"
                />

                <QuickLink
                  to="/admin/enquiries"
                  title="Enquiries"
                  description="Respond to product leads"
                />

                <QuickLink
                  to="/admin/products"
                  title="Products"
                  description="Manage inventory"
                />

                <QuickLink
                  to="/admin/announcements"
                  title="Announcements"
                  description="Publish customer updates"
                />
              </div>
            </section>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
            <RecentRequestsCard requests={summary.recentServiceRequests} />

            <RecentEnquiriesCard enquiries={summary.recentEnquiries} />
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardTabs({
  activeTab,
  attentionCount,
  onChange
}: {
  activeTab: DashboardTab;
  attentionCount: number;
  onChange: (tab: DashboardTab) => void;
}) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-1.5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="grid grid-cols-2 gap-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          onClick={() => onChange("overview")}
          className={`min-h-11 rounded-xl px-3 text-xs font-black transition sm:text-sm ${
            activeTab === "overview"
              ? "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]"
              : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
          }`}
        >
          Overview
          {attentionCount > 0 && (
            <span className="ml-2 rounded-full bg-current/10 px-2 py-0.5 text-[10px]">
              {attentionCount}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "activity"}
          onClick={() => onChange("activity")}
          className={`min-h-11 rounded-xl px-3 text-xs font-black transition sm:text-sm ${
            activeTab === "activity"
              ? "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]"
              : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
          }`}
        >
          Recent activity
        </button>
      </div>
    </div>
  );
}

function AttentionCard({
  to,
  label,
  value,
  description,
  tone,
  icon
}: {
  to: string;
  label: string;
  value: number;
  description: string;
  tone: "amber" | "blue" | "red" | "green";
  icon: ReactNode;
}) {
  const toneClasses = {
    amber:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
    blue: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
    red: "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
  };

  return (
    <Link
      to={to}
      className={`group rounded-[1.25rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${toneClasses[tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 dark:bg-black/10">
          {icon}
        </div>

        <span className="text-3xl font-black">{value}</span>
      </div>

      <h3 className="mt-4 text-sm font-black">{label}</h3>

      <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
        {description}
      </p>

      <p className="mt-4 inline-flex items-center gap-1 text-xs font-black">
        Review now
        <ArrowRightIcon />
      </p>
    </Link>
  );
}

function MetricCard({
  to,
  label,
  value,
  helper,
  tone = "default"
}: {
  to: string;
  label: string;
  value: number;
  helper: string;
  tone?: "default" | "gold" | "green" | "blue";
}) {
  const valueClasses = {
    default: "text-[#1f1a12] dark:text-[#e8e3d8]",
    gold: "text-[#8a6624] dark:text-[#d6b46a]",
    green: "text-emerald-700 dark:text-emerald-300",
    blue: "text-sky-700 dark:text-sky-300"
  };

  return (
    <Link
      to={to}
      className="group rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c8b98f] hover:shadow-md dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
          {label}
        </p>

        <ArrowRightIcon />
      </div>

      <p
        className={`mt-4 text-4xl font-black leading-none ${valueClasses[tone]}`}
      >
        {value}
      </p>

      <p className="mt-3 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
        {helper}
      </p>
    </Link>
  );
}

function QuickLink({
  to,
  title,
  description
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-4 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] p-4 transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016]"
    >
      <div>
        <p className="text-sm font-black">{title}</p>

        <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>

      <ArrowRightIcon />
    </Link>
  );
}

function RecentRequestsCard({
  requests = []
}: {
  requests?: AdminDashboardSummary["recentServiceRequests"];
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <CardHeader
        eyebrow="Repairs"
        title="Recent requests"
        link="/admin/service-requests"
      />

      {requests.length === 0 ? (
        <EmptyActivity message="No recent service requests." />
      ) : (
        <div className="mt-5 space-y-3">
          {requests.map((request) => (
            <Link
              key={request.serviceRequestId}
              to={`/admin/service-requests/${request.serviceRequestId}`}
              className="block rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/40 dark:hover:bg-[#242016]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#8a6624] dark:text-[#d6b46a]">
                    {request.requestNumber}
                  </p>

                  <p className="mt-1 truncate text-sm font-black">
                    {request.customerName}
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                    {request.serviceCategory}
                  </p>
                </div>

                <StatusBadge status={request.currentStatus} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentEnquiriesCard({
  enquiries = []
}: {
  enquiries?: AdminDashboardSummary["recentEnquiries"];
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <CardHeader
        eyebrow="Product leads"
        title="Recent enquiries"
        link="/admin/enquiries"
      />

      {enquiries.length === 0 ? (
        <EmptyActivity message="No recent enquiries." />
      ) : (
        <div className="mt-5 space-y-3">
          {enquiries.map((enquiry) => (
            <Link
              key={enquiry.enquiryId}
              to={`/admin/enquiries/${enquiry.enquiryId}`}
              className="block rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/40 dark:hover:bg-[#242016]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {enquiry.fullName}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#8a6624] dark:text-[#d6b46a]">
                    {enquiry.phoneNumber}
                  </p>

                  <p className="mt-2 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                    {enquiry.productName || "General enquiry"}
                  </p>
                </div>

                <EnquiryBadge status={enquiry.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function CardHeader({
  eyebrow,
  title,
  link
}: {
  eyebrow: string;
  title: string;
  link: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#d8cdb6] pb-4 dark:border-[#302c24]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-xl font-black">{title}</h2>
      </div>

      <Link
        to={link}
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#d8cdb6] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
      >
        View all
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

function EmptyActivity({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-[#d8cdb6] bg-[#fff8e7] p-8 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
        {message}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let className =
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";

  if (normalized.includes("accepted") || normalized.includes("progress")) {
    className =
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300";
  }

  if (normalized.includes("completed")) {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (normalized.includes("cancel")) {
    className =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  }

  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${className}`}
    >
      {status}
    </span>
  );
}

function EnquiryBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let className =
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";

  if (normalized.includes("contact") || normalized.includes("progress")) {
    className =
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300";
  }

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${className}`}
    >
      {status}
    </span>
  );
}

function DashboardLoading() {
  return (
    <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-8 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-44 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="mt-6 h-14 rounded-[1.5rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="mt-6 h-72 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 rounded-[1.5rem] bg-[#eee5d4] dark:bg-[#242016]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
    >
      <path
        d="M20 7v5h-5M4 17v-5h5M18.5 9A7 7 0 0 0 6 7M5.5 15A7 7 0 0 0 18 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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

function RepairIcon() {
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

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 5h16v12H9l-5 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AdminDashboardPage;
