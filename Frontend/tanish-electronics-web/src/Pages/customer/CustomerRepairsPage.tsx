import { useApiAuth } from "../../hooks/useApiAuth";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCustomerDashboard,
  type CustomerDashboard,
  type CustomerDashboardServiceRequest
} from "../../Services/customerDashboardService";
import QuickBookRepairModal from "../../components/customer/QuickBookRepairModal";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";

const statusFilters = [
  "All",
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled"
];
const repairStatusOptions: DropdownOption<string>[] = [
  {
    value: "All",
    label: "All repair requests"
  },
  {
    value: "Pending",
    label: "Pending"
  },
  {
    value: "In Progress",
    label: "In Progress"
  },
  {
    value: "Completed",
    label: "Completed"
  },
  {
    value: "Cancelled",
    label: "Cancelled"
  }
];
function CustomerRepairsPage() {
  const { getToken } = useApiAuth();

  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const navigate = useNavigate();
  const [quickBookOpen, setQuickBookOpen] = useState(false);

  useEffect(() => {
    loadRepairs();
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "My Repairs";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  async function loadRepairs() {
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
        error instanceof Error ? error.message : "Failed to load repairs."
      );
    } finally {
      setLoading(false);
    }
  }

  const repairs = dashboard?.serviceRequests || [];

  const filteredRepairs = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return repairs.filter((repair) => {
      const matchesStatus =
        selectedStatus === "All" ||
        repair.currentStatus
          .toLowerCase()
          .includes(selectedStatus.toLowerCase());

      const text = [
        repair.requestNumber,
        repair.serviceCategory,
        repair.currentStatus,
        repair.serviceType,
        repair.deviceName,
        repair.brand,
        repair.modelName,
        repair.preferredDate,
        repair.preferredTimeSlot
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText === "" || text.includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [repairs, search, selectedStatus]);

  const activeCount = repairs.filter(
    (request) =>
      !request.currentStatus.toLowerCase().includes("completed") &&
      !request.currentStatus.toLowerCase().includes("cancelled")
  ).length;

  const completedCount = repairs.filter((request) =>
    request.currentStatus.toLowerCase().includes("completed")
  ).length;

  if (loading) {
    return (
      <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="h-3.5 w-32 rounded bg-[#e8e0ce] dark:bg-[#28231a]" />
          <div className="mt-3 h-10 w-48 rounded-xl bg-[#e8e0ce] dark:bg-[#28231a]" />
          <div className="mt-6 flex gap-3">
            <div className="h-10 w-24 rounded-xl bg-[#e8e0ce] dark:bg-[#28231a]" />
            <div className="h-10 w-24 rounded-xl bg-[#e8e0ce] dark:bg-[#28231a]" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] px-6 py-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Customer repairs
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-4">
              <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">
                My Repairs
              </h1>

              <span className="rounded-full border border-[#d8cdb6] bg-[#fffaf0] px-3 py-1.5 text-xs font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
                {repairs.length} requests
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setQuickBookOpen(true)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1f1a12] px-6 py-3 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
          >
            Book Repair
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#d8cdb6] pt-5 dark:border-[#302c24]">
          <RepairCount label="All" value={repairs.length} />

          <RepairCount label="Active" value={activeCount} />

          <RepairCount label="Completed" value={completedCount} />
        </div>
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="grid gap-3 xl:grid-cols-[minmax(300px,1fr)_auto] xl:items-center">
          {/* Search */}
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f8677]"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M16.5 16.5L21 21"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search request number, device or brand..."
              className="w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-11 pr-4 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-2 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
            />
          </div>

          {/* Mobile dropdown */}
          <div className="relative sm:hidden">
            <UniversalDropdown
              options={repairStatusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Filter repair status"
              className="sm:hidden"
            />
          </div>

          {/* Desktop buttons */}
          <div className="hidden flex-wrap gap-2 sm:flex xl:justify-end">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
                  selectedStatus === status
                    ? "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]"
                    : "border border-[#d8cdb6] bg-transparent text-[#6f6758] hover:bg-[#f2eadb] dark:border-[#302c24] dark:text-[#a8a093] dark:hover:bg-[#242016]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        {filteredRepairs.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7] p-10 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
            <h2 className="font-display text-4xl font-bold">
              No repair requests found
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredRepairs.map((repair) => (
              <RepairListCard
                key={repair.serviceRequestId}
                repair={repair}
                phoneNumber={dashboard?.phoneNumber || ""}
              />
            ))}
          </div>
        )}
        <QuickBookRepairModal
          open={quickBookOpen}
          onClose={() => setQuickBookOpen(false)}
          onCreated={(serviceRequestId) => {
            setQuickBookOpen(false);
            navigate(`/customer/repairs/${serviceRequestId}`);
          }}
        />
      </section>
    </main>
  );
}

export function RepairListCard({
  repair,
  phoneNumber
}: {
  repair: CustomerDashboardServiceRequest;
  phoneNumber: string;
}) {
  const deviceText =
    [repair.deviceName, repair.brand, repair.modelName]
      .filter(Boolean)
      .join(" • ") || repair.serviceType;

  return (
    <article className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#d8cdb6]/30 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:shadow-black/30 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              {repair.requestNumber}
            </p>

            <StatusBadge status={repair.currentStatus} />
          </div>

          <h2 className="font-display mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            {repair.serviceCategory}
          </h2>

          <p className="mt-2 text-sm font-black text-[#6f6758] dark:text-[#a8a093]">
            {deviceText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-3">
          <Link
            to={`/customer/repairs/${repair.serviceRequestId}`}
            className="inline-flex justify-center items-center rounded-xl bg-[#1f1a12] px-4 py-3 text-center text-xs sm:text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
          >
            View Details
          </Link>

          <Link
            to={`/track-request?requestNumber=${encodeURIComponent(
              repair.requestNumber
            )}&phoneNumber=${encodeURIComponent(phoneNumber)}`}
            className="inline-flex justify-center items-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-center text-xs sm:text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
          >
            Track Request
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <InfoBox title="Created" value={formatDate(repair.createdAt)} />
        <InfoBox
          title="Visit Date"
          value={repair.preferredDate || "Not selected"}
        />
        <InfoBox
          title="Time Slot"
          value={repair.preferredTimeSlot || "Not selected"}
        />
      </div>
    </article>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </p>

      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const lowerStatus = status.toLowerCase();

  const className = lowerStatus.includes("completed")
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
    : lowerStatus.includes("cancelled")
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      : lowerStatus.includes("pending")
        ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-300"
        : "border-[#d6b46a]/40 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {status}
    </span>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
function RepairCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-2.5 dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
        {label}
      </span>

      <span className="text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
        {value}
      </span>
    </div>
  );
}
export default CustomerRepairsPage;
