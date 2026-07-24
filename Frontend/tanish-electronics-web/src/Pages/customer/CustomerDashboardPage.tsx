import { useApiAuth } from "../../hooks/useApiAuth";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCustomerDashboard,
  type CustomerDashboard,
  type CustomerDashboardServiceRequest
} from "../../Services/customerDashboardService";
import { useNavigate } from "react-router-dom";
import QuickBookRepairModal from "../../components/customer/QuickBookRepairModal";
import CustomerDashboardAnnouncements from "../../components/customer/CustomerDashboardAnnouncements";
import CustomerDashboardAnnouncementPopup from "../../components/customer/CustomerDashboardAnnouncementPopup";

function CustomerDashboardPage() {
  const { isLoaded, isSignedIn, getToken } = useApiAuth();

  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [quickBookOpen, setQuickBookOpen] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = await getToken();

        if (!token) {
          setError("Please sign in again.");
          return;
        }

        const data = await getCustomerDashboard(token);
        setDashboard(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [isLoaded, isSignedIn, getToken]);

  if (loading || !isLoaded) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
            <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
              Loading dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          {error}
        </div>
      </main>
    );
  }

  if (!dashboard) return null;

  const totalRequests = dashboard.serviceRequests.length;

  const activeRequests = dashboard.serviceRequests.filter(
    (request) =>
      !request.currentStatus.toLowerCase().includes("completed") &&
      !request.currentStatus.toLowerCase().includes("cancelled")
  ).length;

  const completedRequests = dashboard.serviceRequests.filter((request) =>
    request.currentStatus.toLowerCase().includes("completed")
  ).length;

  const totalEnquiries = dashboard.enquiries.length;
  const latestRequest = dashboard.serviceRequests[0] || null;
  const recentRequests = dashboard.serviceRequests.slice(0, 3);

  return (
    <main className="px-4 py-8 sm:px-6 lg:px-8">
      <title>Customer | Dashboard</title>
      <CustomerDashboardAnnouncementPopup />
      <section className="overflow-hidden rounded-[2.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_420px] xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a6624] dark:text-[#d6b46a]">
              Customer Dashboard
            </p>

            <h1 className="font-display mt-4 text-5xl font-bold leading-[0.95] sm:text-6xl">
              Welcome back,{" "}
              <span className="text-[#8a6624] dark:text-[#d6b46a]">
                {dashboard.fullName.split(" ")[0]}
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
              Quick overview of your repairs, enquiries and account activity.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setQuickBookOpen(true)}
                className="inline-flex justify-center rounded-2xl bg-[#e8e3d8] px-6 py-4 text-sm font-black text-[#11110f] transition hover:bg-[#d6b46a]"
              >
                Book Repair
              </button>

              <Link
                to="/customer/repairs"
                className="inline-flex justify-center rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-6 py-4 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                View Repairs
              </Link>
            </div>
          </div>

          <LatestRequestCard request={latestRequest} />
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          title="Total Requests"
          value={totalRequests}
          helper="All repair bookings"
        />
        <DashboardStat
          title="Active Requests"
          value={activeRequests}
          helper="Pending or in progress"
        />
        <DashboardStat
          title="Completed"
          value={completedRequests}
          helper="Finished repairs"
        />
        <DashboardStat
          title="Enquiries"
          value={totalEnquiries}
          helper="Product enquiries"
        />
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          <CustomerDashboardAnnouncements />

          <aside className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
            <DashboardActionCard
              title="My Profile"
              text="Manage phone number and saved addresses."
              to="/customer/profile"
              buttonText="Open Profile"
            />

            <DashboardActionCard
              title="Product Enquiries"
              text={`${totalEnquiries} enquiry records available.`}
              to="/customer/enquiries"
              buttonText="View Enquiries"
            />

            <DashboardActionCard
              title="Need Help?"
              text="Call the shop for urgent repair updates."
              to="tel:8850973399"
              buttonText="Call Shop"
              external
            />
          </aside>
        </div>

        {/* Right column */}
        <section className="self-start overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[#d8cdb6] px-5 py-5 dark:border-[#302c24]">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Repair activity
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1f1a12] dark:text-[#e8e3d8]">
                Recent requests
              </h2>

              <p className="mt-1 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                Your latest repair bookings
              </p>
            </div>

            <Link
              to="/customer/repairs"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#d8cdb6] px-3 py-2 text-xs font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
            >
              View all
              <ArrowUpRightIcon />
            </Link>
          </div>

          {/* Requests */}
          {recentRequests.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                <RepairIcon />
              </div>

              <h3 className="mt-4 text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                No repair requests
              </h3>

              <p className="mt-1 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                Your recent bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e4dac5] dark:divide-[#302c24]">
              {recentRequests.map((request) => (
                <RepairRequestRow
                  key={request.serviceRequestId}
                  request={request}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          {recentRequests.length > 0 && (
            <div className="border-t border-[#d8cdb6] bg-[#faf7f0] px-5 py-3 dark:border-[#302c24] dark:bg-[#15130f]">
              <p className="text-center text-[11px] font-semibold text-[#817867] dark:text-[#928a7d]">
                Showing your {recentRequests.length} latest requests
              </p>
            </div>
          )}
        </section>
      </div>

      <QuickBookRepairModal
        open={quickBookOpen}
        onClose={() => setQuickBookOpen(false)}
        onCreated={(serviceRequestId) => {
          setQuickBookOpen(false);
          navigate(`/customer/repairs/${serviceRequestId}`);
        }}
      />
    </main>
  );
}

function DashboardStat({
  title,
  value,
  helper
}: {
  title: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </p>

      <p className="mt-4 text-5xl font-black leading-none">{value}</p>

      <p className="mt-4 text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
        {helper}
      </p>
    </div>
  );
}

function LatestRequestCard({
  request
}: {
  request: CustomerDashboardServiceRequest | null;
}) {
  if (!request) {
    return (
      <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fff8e7] p-6 dark:border-[#302c24] dark:bg-[#11110f]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
          Latest Update
        </p>

        <h2 className="font-display mt-4 text-3xl font-bold leading-none">
          No repair yet
        </h2>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          Book your first repair request to see updates here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fff8e7] p-6 dark:border-[#302c24] dark:bg-[#11110f]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Latest Repair
          </p>

          <h2 className="font-display mt-4 text-3xl font-bold leading-none">
            {request.serviceCategory}
          </h2>
        </div>

        <span className="rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          {request.currentStatus}
        </span>
      </div>

      <p className="mt-4 text-sm font-black">{request.requestNumber}</p>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {[request.deviceName, request.brand, request.modelName]
          .filter(Boolean)
          .join(" • ") || request.serviceType}
      </p>

      <Link
        to="/track-request"
        className="mt-5 inline-flex rounded-2xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
      >
        Track Request
      </Link>
    </div>
  );
}

function RepairRequestRow({
  request
}: {
  request: CustomerDashboardServiceRequest;
}) {
  const deviceDetails =
    [request.deviceName, request.brand, request.modelName]
      .filter(Boolean)
      .join(" • ") || request.serviceType;

  return (
    <Link
      to={`/customer/repairs/${request.serviceRequestId}`}
      className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[#faf7f0] dark:hover:bg-[#211e18]"
    >
      {/* Icon */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] text-[#8a6624] transition group-hover:border-[#c8b68e] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]">
        <RepairIcon />
      </div>

      {/* Main information */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            {request.serviceCategory}
          </h3>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${getRepairStatusClasses(
              request.currentStatus
            )}`}
          >
            {request.currentStatus}
          </span>
        </div>

        <p className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {deviceDetails}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[#8a8172] dark:text-[#817a6e]">
          <span>{request.requestNumber}</span>

          <span aria-hidden="true">•</span>

          <span>{formatDate(request.createdAt)}</span>
        </div>
      </div>

      <ChevronRightIcon />
    </Link>
  );
}
function getRepairStatusClasses(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("completed")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (normalizedStatus.includes("cancelled")) {
    return "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300";
  }

  if (
    normalizedStatus.includes("progress") ||
    normalizedStatus.includes("repair")
  ) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300";
  }

  return "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300";
}

function RepairIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M14.7 6.3a4 4 0 01-5 5L4 17l3 3 5.7-5.7a4 4 0 005-5l-2.4 2.4-3-3 2.4-2.4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-[#aaa18f] transition group-hover:translate-x-0.5 group-hover:text-[#8a6624] dark:text-[#615b50] dark:group-hover:text-[#d6b46a]"
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

function ArrowUpRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="M7 17L17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardActionCard({
  title,
  text,
  to,
  buttonText,
  external = false
}: {
  title: string;
  text: string;
  to: string;
  buttonText: string;
  external?: boolean;
}) {
  const content = (
    <>
      <h3 className="font-display text-3xl font-bold leading-none">{title}</h3>

      <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {text}
      </p>

      <span className="mt-5 inline-flex rounded-2xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]">
        {buttonText}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={to}
        className="block rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={to}
      className="block rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]"
    >
      {content}
    </Link>
  );
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default CustomerDashboardPage;
