import { useApiAuth } from "../../hooks/useApiAuth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import QuickBookRepairModal from "../../components/customer/QuickBookRepairModal";

import {
  getCustomerDashboard,
  type CustomerDashboard,
  type CustomerDashboardEnquiry
} from "../../Services/customerDashboardService";
import { useShopSettings } from "../../hooks/useShopSettings";

type StatusFilter = "All" | "New" | "Pending" | "Contacted" | "Closed";

const statusFilters: StatusFilter[] = [
  "All",
  "New",
  "Pending",
  "Contacted",
  "Closed"
];

const statusOptions: DropdownOption<StatusFilter>[] = statusFilters.map(
  (status) => ({
    value: status,
    label: status
  })
);

function CustomerEnquiriesPage() {
  const { settings } = useShopSettings();
  const { getToken } = useApiAuth();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("All");

  const [quickBookOpen, setQuickBookOpen] = useState(false);

  const enquiries = useMemo(() => dashboard?.enquiries ?? [], [dashboard]);

  const loadEnquiries = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token = await getToken();

        if (!token) {
          setError("Your session has expired. Please sign in again.");

          return;
        }

        const data = await getCustomerDashboard(token);

        setDashboard(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load enquiries."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `My Enquiries | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const statusCounts = useMemo<Record<StatusFilter, number>>(() => {
    return {
      All: enquiries.length,
      New: enquiries.filter((enquiry) =>
        matchesEnquiryStatus(enquiry.status, "New")
      ).length,
      Pending: enquiries.filter((enquiry) =>
        matchesEnquiryStatus(enquiry.status, "Pending")
      ).length,
      Contacted: enquiries.filter((enquiry) =>
        matchesEnquiryStatus(enquiry.status, "Contacted")
      ).length,
      Closed: enquiries.filter((enquiry) =>
        matchesEnquiryStatus(enquiry.status, "Closed")
      ).length
    };
  }, [enquiries]);

  const activeCount = useMemo(
    () => enquiries.filter((enquiry) => !isClosedStatus(enquiry.status)).length,
    [enquiries]
  );

  const contactedCount = useMemo(
    () =>
      enquiries.filter((enquiry) =>
        matchesEnquiryStatus(enquiry.status, "Contacted")
      ).length,
    [enquiries]
  );

  const closedCount = useMemo(
    () => enquiries.filter((enquiry) => isClosedStatus(enquiry.status)).length,
    [enquiries]
  );

  const filteredEnquiries = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return [...enquiries]
      .filter((enquiry) => {
        const matchesStatus =
          selectedStatus === "All" ||
          matchesEnquiryStatus(enquiry.status, selectedStatus);

        const searchableText = [
          `ENQ-${enquiry.enquiryId}`,
          enquiry.enquiryId.toString(),
          enquiry.productName,
          enquiry.subject,
          enquiry.message,
          enquiry.status,
          enquiry.createdAt
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !searchText || searchableText.includes(searchText);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (first, second) =>
          getDateTimestamp(second.createdAt) - getDateTimestamp(first.createdAt)
      );
  }, [enquiries, search, selectedStatus]);

  if (loading) {
    return <EnquiriesLoadingState />;
  }

  if (error && !dashboard) {
    return (
      <EnquiriesErrorState
        message={error}
        onRetry={() => void loadEnquiries()}
      />
    );
  }

  return (
    <main className="te-sheet-bg mx-auto min-h-full w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Product enquiries
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              My Enquiries
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Check the latest status of your product enquiries.
            </p>
          </div>

          <div className="grid gap-2 sm:flex">
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void loadEnquiries(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
            >
              <RefreshIcon spinning={refreshing} />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              to="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              Browse Products
              <ArrowRightIcon />
            </Link>

            <button
              type="button"
              onClick={() => setQuickBookOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
            >
              <RepairIcon />
              Book Repair
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <SummaryCard
            label="Active"
            value={activeCount}
            icon="active"
            emphasized={activeCount > 0}
          />

          <SummaryCard
            label="Contacted"
            value={contactedCount}
            icon="contacted"
          />

          <SummaryCard label="Closed" value={closedCount} icon="closed" />
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadEnquiries(true)}
            className="shrink-0 text-xs font-black underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter workspace */}
      <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="border-b border-[#d8cdb6] p-4 dark:border-[#302c24] sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
            />

            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <UniversalDropdown<StatusFilter>
                label="Status"
                options={statusOptions}
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder="Select status"
              />
            </div>

            {/* Desktop status tabs */}
            <div className="hidden gap-2 overflow-x-auto sm:flex">
              {statusFilters.map((status) => (
                <StatusFilterButton
                  key={status}
                  status={status}
                  count={statusCounts[status]}
                  active={selectedStatus === status}
                  onClick={() => setSelectedStatus(status)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black">
              {selectedStatus === "All"
                ? "All enquiries"
                : `${selectedStatus} enquiries`}
            </p>

            <p className="text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
              {filteredEnquiries.length}{" "}
              {filteredEnquiries.length === 1 ? "result" : "results"}
            </p>
          </div>

          {filteredEnquiries.length === 0 ? (
            <EnquiriesEmptyState
              searching={Boolean(search.trim())}
              filtered={selectedStatus !== "All"}
              onReset={() => {
                setSearch("");
                setSelectedStatus("All");
              }}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredEnquiries.map((enquiry) => (
                <EnquiryCard key={enquiry.enquiryId} enquiry={enquiry} />
              ))}
            </div>
          )}
        </div>
      </section>

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

function EnquiryCard({ enquiry }: { enquiry: CustomerDashboardEnquiry }) {
  const title = enquiry.productName || enquiry.subject || "Product enquiry";

  const showSubject =
    Boolean(enquiry.subject) &&
    enquiry.subject?.trim().toLowerCase() !== title.trim().toLowerCase();

  return (
    <article className="flex h-full min-w-0 flex-col rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffaf0] p-4 transition duration-300 hover:border-[#c7b98e] hover:shadow-md dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#50483b] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-3 py-1 text-[10px] font-black text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          ENQ-{enquiry.enquiryId}
        </span>

        <StatusBadge status={enquiry.status} />
      </div>

      <h2 className="mt-4 break-words text-xl font-black leading-tight">
        {title}
      </h2>

      {showSubject && (
        <p className="mt-2 text-sm font-black text-[#4f4638] dark:text-[#d8cdb6]">
          {enquiry.subject}
        </p>
      )}

      <div className="mt-4 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
          Your message
        </p>

        <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#4f4638] dark:text-[#d8cdb6]">
          {enquiry.message?.trim() || "No message provided."}
        </p>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-3 dark:border-[#302c24] dark:bg-[#1a1712]">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          <MessageIcon />
        </span>

        <div>
          <p className="text-xs font-black">{getStatusTitle(enquiry.status)}</p>

          <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {getStatusDescription(enquiry.status)}
          </p>
        </div>
      </div>

      <footer className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
            Submitted
          </p>

          <p className="mt-1 text-xs font-black">
            {formatDateTime(enquiry.createdAt)}
          </p>
        </div>

        {enquiry.productId ? (
          <Link
            to={`/products/${enquiry.productId}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            View Product
            <ArrowRightIcon />
          </Link>
        ) : (
          <Link
            to="/products"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            Browse Products
            <ArrowRightIcon />
          </Link>
        )}
      </footer>
    </article>
  );
}

function SearchInput({
  value,
  onChange,
  onClear
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label
        htmlFor="enquiry-search"
        className="mb-2 block text-sm font-black text-[#4f4638] dark:text-[#d8cdb6]"
      >
        Search enquiries
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]">
          <SearchIcon />
        </span>

        <input
          id="enquiry-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search product, subject or message"
          className="h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] pl-11 pr-11 text-sm font-semibold outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:placeholder:text-[#8f8778]"
        />

        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] dark:text-[#928a7d] dark:hover:bg-[#242016]"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function StatusFilterButton({
  status,
  count,
  active,
  onClick
}: {
  status: StatusFilter;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-black transition ${
        active
          ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#e8e3d8] dark:text-[#11110f]"
          : "border border-[#d8cdb6] bg-[#fffaf0] text-[#6f6758] hover:bg-[#f2eadb] hover:text-[#1f1a12] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
      }`}
    >
      {status}

      <span
        className={`rounded-full px-2 py-0.5 text-[10px] ${
          active
            ? "bg-white/15 dark:bg-black/10"
            : "bg-[#e8dcc4] dark:bg-[#302c24]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  emphasized = false
}: {
  label: string;
  value: number;
  icon: "active" | "contacted" | "closed";
  emphasized?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
        emphasized
          ? "border-[#d6b46a]/60 bg-[#fff4cc] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10"
          : "border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xl font-black sm:text-2xl">{value}</p>

        <span className="hidden text-[#8a6624] dark:text-[#d6b46a] sm:block">
          <SummaryIcon type={icon} />
        </span>
      </div>

      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.08em] text-[#817867] dark:text-[#928a7d] sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function EnquiriesEmptyState({
  searching,
  filtered,
  onReset
}: {
  searching: boolean;
  filtered: boolean;
  onReset: () => void;
}) {
  const hasFilter = searching || filtered;

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8cdb6] bg-[#fffaf0] px-5 py-10 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <InboxIcon />
      </span>

      <h2 className="mt-4 text-xl font-black">
        {hasFilter ? "No matching enquiries" : "No enquiries yet"}
      </h2>

      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {hasFilter
          ? "Try changing the search text or status filter."
          : "Enquiries submitted from product pages will appear here."}
      </p>

      {hasFilter ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
        >
          Clear Filters
        </button>
      ) : (
        <Link
          to="/products"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1f1a12] px-5 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Browse Products
          <ArrowRightIcon />
        </Link>
      )}
    </div>
  );
}

function EnquiriesLoadingState() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex min-h-[55vh] items-center justify-center rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

          <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Loading enquiries...
          </p>
        </div>
      </div>
    </main>
  );
}

function EnquiriesErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-10 text-center dark:border-red-400/20 dark:bg-red-400/10">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <AlertIcon />
        </span>

        <h1 className="mt-4 text-xl font-black text-red-700 dark:text-red-300">
          Could not load enquiries
        </h1>

        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-red-700/80 dark:text-red-200/80">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 h-11 rounded-xl bg-red-700 px-5 text-sm font-black text-white transition hover:bg-red-800 dark:bg-red-300 dark:text-red-950"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);

  let styles =
    "border-[#d6b46a]/40 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    styles =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  } else if (normalized.includes("contacted")) {
    styles =
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300";
  } else if (normalized.includes("pending")) {
    styles =
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";
  } else if (normalized.includes("new")) {
    styles =
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300";
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black ${styles}`}
    >
      {status}
    </span>
  );
}

function getStatusTitle(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    return "Enquiry completed";
  }

  if (normalized.includes("contacted")) {
    return "Shop has contacted you";
  }

  if (normalized.includes("pending")) {
    return "Waiting for response";
  }

  if (normalized.includes("new")) {
    return "Enquiry received";
  }

  return "Enquiry update";
}

function getStatusDescription(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized.includes("closed") || normalized.includes("resolved")) {
    return "No further action is currently required.";
  }

  if (normalized.includes("contacted")) {
    return "Check your phone or WhatsApp for the shop's response.";
  }

  if (normalized.includes("pending")) {
    return "The shop is reviewing your enquiry.";
  }

  if (normalized.includes("new")) {
    return "Your enquiry has been submitted successfully.";
  }

  return "Check back later for another status update.";
}

function matchesEnquiryStatus(
  currentStatus: string,
  expectedStatus: StatusFilter
) {
  if (expectedStatus === "All") {
    return true;
  }

  return normalizeStatus(currentStatus).includes(
    normalizeStatus(expectedStatus)
  );
}

function isClosedStatus(status: string) {
  const normalized = normalizeStatus(status);

  return normalized.includes("closed") || normalized.includes("resolved");
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function getDateTimestamp(value: string) {
  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Not available";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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
        d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RepairIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M5 5h14v11H9l-4 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M4 5h16v14H4V5Zm0 9h5l1.5 2h3L15 14h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 4 3 20h18L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M12 9v5M12 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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

function SummaryIcon({ type }: { type: "active" | "contacted" | "closed" }) {
  if (type === "contacted") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path
          d="M5 5h14v11H9l-4 3V5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        <path
          d="M8 9h8M8 12h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "closed") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

        <path
          d="m8 12 2.5 2.5L16 9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default CustomerEnquiriesPage;
