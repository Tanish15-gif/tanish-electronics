import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  getAdminEnquiries,
  getEnquiryStatuses,
  updateAdminEnquiryStatus,
  type AdminEnquiryListItem
} from "../../Services/adminEnquiryService";
import type { LookUpItem } from "../../Services/serviceRequestService";
import { exportEnquiries } from "../../Services/adminExportService";

function AdminEnquiriesPage() {
  const { getToken } = useApiAuth();
  const [searchParams] = useSearchParams();

  const selectedEnquiryId = Number(searchParams.get("enquiryId") || 0);

  const [enquiries, setEnquiries] = useState<AdminEnquiryListItem[]>([]);
  const [statuses, setStatuses] = useState<LookUpItem[]>([]);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusId, setStatusId] = useState(0);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const startRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;

  const endRecord = Math.min(pageNumber * pageSize, totalRecords);

  useEffect(() => {
    document.title = "Product Enquiries | Tanish Electronics Admin";

    return () => {
      document.title = "Tanish Electronics";
    };
  }, []);

  useEffect(() => {
    void loadStatuses();
  }, []);

  const loadEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await getAdminEnquiries(
        {
          statusId: statusId > 0 ? statusId : null,
          search: appliedSearch,
          pageNumber,
          pageSize
        },
        token
      );

      const safeTotalPages = Math.max(data.totalPages, 1);

      setTotalPages(safeTotalPages);
      setTotalRecords(data.totalRecords);

      if (pageNumber > safeTotalPages) {
        setPageNumber(safeTotalPages);
        return;
      }

      setEnquiries(data.items);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load enquiries."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, statusId, appliedSearch, pageNumber]);

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  useEffect(() => {
    if (!selectedEnquiryId || enquiries.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      const element = document.getElementById(`enquiry-${selectedEnquiryId}`);

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  }, [selectedEnquiryId, enquiries]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  async function loadStatuses() {
    try {
      setLoadingStatuses(true);
      setError("");

      const data = await getEnquiryStatuses();

      setStatuses(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load enquiry statuses."
      );
    } finally {
      setLoadingStatuses(false);
    }
  }

  const statusOptions = useMemo<DropdownOption<number>[]>(
    () =>
      statuses.map((status) => ({
        value: status.id,
        label: status.name
      })),
    [statuses]
  );

  const filterStatusOptions = useMemo<DropdownOption<number>[]>(
    () => [
      {
        value: 0,
        label: "All statuses"
      },
      ...statusOptions
    ],
    [statusOptions]
  );

  const openEnquiryCount = useMemo(() => {
    return enquiries.filter((enquiry) => !isClosedStatus(enquiry.status))
      .length;
  }, [enquiries]);

  const closedEnquiryCount = enquiries.length - openEnquiryCount;

  const hasActiveFilters = appliedSearch.trim() !== "" || statusId !== 0;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageNumber(1);
    setAppliedSearch(search.trim());
  }

  function handleStatusFilterChange(value: number) {
    setStatusId(value);
    setPageNumber(1);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatusId(0);
    setPageNumber(1);
  }

  function goToPreviousPage() {
    setPageNumber((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((current) => Math.min(current + 1, totalPages));
  }

  async function handleEnquiryStatusChange(
    enquiry: AdminEnquiryListItem,
    newStatusId: number
  ) {
    if (newStatusId <= 0 || newStatusId === enquiry.statusId) {
      return;
    }

    try {
      setUpdatingId(enquiry.enquiryId);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await updateAdminEnquiryStatus(enquiry.enquiryId, newStatusId, token);

      setSuccess(`Enquiry #${enquiry.enquiryId} status updated.`);

      await loadEnquiries();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update enquiry status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleExportCsv() {
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

      await exportEnquiries(token, {
        search: appliedSearch,
        statusId: statusId > 0 ? statusId : null
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to export enquiries."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Admin inbox
              </p>

              <h1 className="font-display mt-2 text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                Product enquiries
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Review customer messages, contact customers and manage enquiry
                progress.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <SummaryCard label="Total" value={totalRecords} />

                <SummaryCard label="This page open" value={openEnquiryCount} />

                <SummaryCard
                  label="This page closed"
                  value={closedEnquiryCount}
                />
              </div>

              <ActionButton
                type="button"
                variant="outline"
                fullWidth={false}
                loading={exporting}
                loadingText="Exporting..."
                onClick={() => void handleExportCsv()}
                disabled={enquiries.length === 0}
                className="min-h-12 px-5"
              >
                <span className="inline-flex items-center gap-2">
                  <DownloadIcon />
                  Export CSV
                </span>
              </ActionButton>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-5">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px_auto] lg:items-end"
          >
            <div>
              <label
                htmlFor="enquiry-search"
                className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#5f574a] dark:text-[#b5ada0]"
              >
                Search enquiries
              </label>

              <div className="relative">
                <SearchIcon />

                <input
                  id="enquiry-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Customer, phone, product or subject..."
                  className="h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-11 pr-11 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-2 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#817a6e]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] dark:text-[#928a7d] dark:hover:bg-[#242016]"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            <UniversalDropdown<number>
              label="Status"
              options={filterStatusOptions}
              value={statusId}
              onChange={handleStatusFilterChange}
              placeholder="All statuses"
              disabled={loadingStatuses}
            />

            <div className="flex gap-3 lg:self-end">
              <button
                type="submit"
                disabled={loading}
                className="h-12 flex-1 rounded-xl bg-[#1f1a12] px-6 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] lg:flex-none"
              >
                Search
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={loading}
                  className="h-12 flex-1 rounded-xl border border-[#d8cdb6] px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016] lg:flex-none"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </section>

        {(error || success) && (
          <div className="mt-5 space-y-3">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                {success}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <EnquiriesLoading />
        ) : enquiries.length === 0 ? (
          <EmptyEnquiries
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <section className="mt-6">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
                  Total Records: {totalRecords}
                </p>
              </div>

              <p className="text-sm font-black">
                Page {pageNumber} of {totalPages}
              </p>
            </div>

            <div className="space-y-4">
              {enquiries.map((enquiry) => (
                <EnquiryListCard
                  key={enquiry.enquiryId}
                  enquiry={enquiry}
                  statusOptions={statusOptions}
                  selected={enquiry.enquiryId === selectedEnquiryId}
                  updating={updatingId === enquiry.enquiryId}
                  onStatusChange={(newStatusId) =>
                    void handleEnquiryStatusChange(enquiry, newStatusId)
                  }
                />
              ))}
            </div>

            <PaginationBar
              pageNumber={pageNumber}
              totalPages={totalPages}
              totalRecords={totalRecords}
              startRecord={startRecord}
              endRecord={endRecord}
              loading={loading}
              onPrevious={goToPreviousPage}
              onNext={goToNextPage}
            />
          </section>
        )}
      </section>
    </main>
  );
}

type EnquiryListCardProps = {
  enquiry: AdminEnquiryListItem;
  statusOptions: DropdownOption<number>[];
  selected: boolean;
  updating: boolean;
  onStatusChange: (statusId: number) => void;
};

function EnquiryListCard({
  enquiry,
  statusOptions,
  selected,
  updating,
  onStatusChange
}: EnquiryListCardProps) {
  return (
    <article
      id={`enquiry-${enquiry.enquiryId}`}
      className={`scroll-mt-24 overflow-visible rounded-[1.5rem] border bg-[#fffdf7] shadow-sm transition dark:bg-[#1a1712] ${
        selected
          ? "border-[#d6b46a] ring-4 ring-[#d6b46a]/15 dark:border-[#d6b46a]/60"
          : "border-[#d8cdb6] hover:border-[#c8b98f] hover:shadow-md dark:border-[#302c24] dark:hover:border-[#50483b]"
      }`}
    >
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[220px_minmax(0,1fr)_250px] lg:items-start">
        {/* Customer */}
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
            Customer
          </p>

          <h2 className="mt-1 truncate text-base font-black">
            {enquiry.fullName}
          </h2>

          <a
            href={`tel:${enquiry.phoneNumber}`}
            className="mt-2 block truncate text-xs font-bold text-[#8a6624] transition hover:underline dark:text-[#d6b46a]"
          >
            {enquiry.phoneNumber}
          </a>

          <p
            title={enquiry.email || "No email"}
            className="mt-1 truncate text-xs font-semibold text-[#817867] dark:text-[#928a7d]"
          >
            {enquiry.email || "No email provided"}
          </p>
        </div>

        {/* Message */}
        <div className="min-w-0 border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-[#8a6624] dark:text-[#d6b46a]">
              {enquiry.productName || "General enquiry"}
            </p>

            <span className="text-[10px] font-black text-[#817867] dark:text-[#928a7d]">
              #{enquiry.enquiryId}
            </span>
          </div>

          <p
            title={enquiry.subject || "No subject"}
            className="mt-2 truncate text-sm font-black"
          >
            {enquiry.subject || "No subject"}
          </p>

          <p
            title={enquiry.message}
            className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]"
          >
            {enquiry.message || "No message provided."}
          </p>

          <p className="mt-3 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
            Received {formatDate(enquiry.createdAt)}
          </p>
        </div>

        {/* Status and actions */}
        <div className="border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
                Current status
              </p>

              <div className="mt-2">
                <EnquiryStatusBadge status={enquiry.status} />
              </div>
            </div>

            {updating && (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
            )}
          </div>

          <div className="mt-4">
            <UniversalDropdown<number>
              label="Change status"
              options={statusOptions}
              value={enquiry.statusId}
              onChange={onStatusChange}
              disabled={updating}
              placeholder="Select status"
            />
          </div>

          <Link
            to={`/admin/enquiries/${enquiry.enquiryId}`}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
          >
            Open enquiry
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </article>
  );
}
function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[88px] rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 py-3 text-center dark:border-[#302c24] dark:bg-[#11110f] sm:min-w-[105px] sm:px-4">
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black sm:text-2xl">{value}</p>
    </div>
  );
}

function EnquiryStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  let className =
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";

  if (
    normalizedStatus.includes("contact") ||
    normalizedStatus.includes("progress")
  ) {
    className =
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300";
  }

  if (
    normalizedStatus.includes("closed") ||
    normalizedStatus.includes("resolved") ||
    normalizedStatus.includes("completed")
  ) {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (
    normalizedStatus.includes("cancel") ||
    normalizedStatus.includes("reject")
  ) {
    className =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-black ${className}`}
    >
      {status}
    </span>
  );
}
function PaginationBar({
  pageNumber,
  totalPages,
  totalRecords,
  startRecord,
  endRecord,
  loading,
  onPrevious,
  onNext
}: {
  pageNumber: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] px-5 py-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
        Showing {startRecord}-{endRecord} of {totalRecords} enquiries
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <ActionButton
          type="button"
          variant="outline"
          fullWidth={false}
          disabled={pageNumber <= 1 || loading}
          onClick={onPrevious}
          className="!py-2"
        >
          Previous
        </ActionButton>

        <span className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-2 text-sm font-black text-[#1f1a12] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]">
          Page {pageNumber} of {totalPages}
        </span>

        <ActionButton
          type="button"
          variant="dark"
          fullWidth={false}
          disabled={pageNumber >= totalPages || loading}
          onClick={onNext}
          className="!py-2"
        >
          Next
        </ActionButton>
      </div>
    </div>
  );
}
function EnquiriesLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 dark:border-[#302c24] dark:bg-[#1a1712]"
        >
          <div className="grid gap-5 lg:grid-cols-4">
            <div>
              <div className="h-4 w-24 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
              <div className="mt-3 h-5 w-36 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
            </div>

            <div>
              <div className="h-5 w-48 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
              <div className="mt-3 h-12 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
            </div>

            <div className="h-9 w-24 rounded-full bg-[#eee5d4] dark:bg-[#302c24]" />

            <div className="h-12 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyEnquiries({
  hasActiveFilters,
  onClear
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7] px-6 py-14 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <InboxIcon />
      </div>

      <h2 className="mt-5 text-xl font-black">No enquiries found</h2>

      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        No product enquiries match the current search and status filter.
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function isClosedStatus(status: string) {
  const normalizedStatus = status.toLowerCase();

  return (
    normalizedStatus.includes("closed") ||
    normalizedStatus.includes("resolved") ||
    normalizedStatus.includes("completed") ||
    normalizedStatus.includes("cancelled") ||
    normalizedStatus.includes("rejected")
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f8677]"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="m16.5 16.5 4 4"
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M4 5h16v14H4V5Zm0 9h4l2 2h4l2-2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AdminEnquiriesPage;
