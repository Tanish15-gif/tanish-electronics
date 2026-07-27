import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { Link } from "react-router-dom";
import { useApiAuth } from "../../hooks/useApiAuth";
import { Download } from "lucide-react";
import {
  getAdminServiceRequests,
  getServiceStatuses,
  type AdminServiceRequestListItem
} from "../../Services/adminServiceRequestService";
import type { LookUpItem } from "../../Services/serviceRequestService";
import { exportServiceRequests } from "../../Services/adminExportService";

function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<AdminServiceRequestListItem[]>([]);
  const [statuses, setStatuses] = useState<LookUpItem[]>([]);

  const [search, setSearch] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [statusId, setStatusId] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const { getToken } = useApiAuth();

  const startRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;

  const endRecord = Math.min(pageNumber * pageSize, totalRecords);

  useEffect(() => {
    document.title = "Service Requests | Tanish Electronics";

    return () => {
      document.title = "Tanish Electronics";
    };
  }, []);

  useEffect(() => {
    void loadStatuses();
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await getAdminServiceRequests(token, {
        statusId: statusId > 0 ? statusId : null,
        search: appliedSearch,
        pageNumber,
        pageSize
      });

      setRequests(data.items);
      setTotalPages(Math.max(data.totalPages, 1));
      setTotalRecords(data.totalRecords);
    } catch {
      setError("Failed to load service requests.");
    } finally {
      setLoading(false);
    }
  }, [getToken, statusId, appliedSearch, pageNumber]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  async function loadStatuses() {
    try {
      const data = await getServiceStatuses();
      setStatuses(data);
    } catch {
      setError("Failed to load statuses.");
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageNumber(1);
    setAppliedSearch(search.trim());
  }

  function handleStatusChange(value: number) {
    setStatusId(value);
    setPageNumber(1);
  }

  async function handleExportServiceRequests() {
    if (exporting) return;

    try {
      setExporting(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await exportServiceRequests(token, {
        search: appliedSearch,
        statusId: statusId > 0 ? statusId : null
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to export service requests."
      );
    } finally {
      setExporting(false);
    }
  }

  function goToPreviousPage() {
    setPageNumber((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((current) => Math.min(current + 1, totalPages));
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <title>Service Requests</title>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col justify-between gap-6 border-b border-[#d8cdb6] pb-8 dark:border-[#302c24] md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Admin Panel
            </p>

            <h1 className="font-display mt-3 text-5xl font-bold leading-none tracking-tight sm:text-6xl">
              Service Requests
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6f6758] dark:text-[#a8a093] sm:text-base">
              View repair bookings, search customers and filter by current
              status.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-stretch">
            <div className="min-w-[150px] rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] px-5 py-4 text-sm shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              <p className="font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Total Requests
              </p>

              <p className="mt-1 text-3xl font-black text-[#8a6624] dark:text-[#d6b46a]">
                {totalRecords}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleExportServiceRequests()}
              disabled={exporting || loading || totalRecords === 0}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-black transition hover:border-[#d6b46a] hover:bg-[#fff4cc] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016]"
            >
              {exporting ? (
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              {exporting ? "Exporting..." : "Export Results"}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-4 md:grid-cols-[1fr_240px_140px]"
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by request number, customer name or phone"
              className="w-full rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#8f8778] dark:focus:border-[#d6b46a]"
            />

            <DropdownField
              value={statusId}
              placeholder="All Status"
              options={statuses}
              onChange={handleStatusChange}
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="py-16 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

            <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
              Loading service requests...
            </p>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="mt-8 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-10 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
            <h2 className="font-display text-4xl font-bold">
              No service requests found
            </h2>

            <p className="mt-3 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
              Try changing filters or wait for a new repair booking.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="te-scrollbar overflow-x-auto">
              <table className="w-full min-w-[1050px] table-fixed text-left text-sm">
                <thead className="border-b border-[#d8cdb6] bg-[#fff8e7] text-xs uppercase tracking-wide text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
                  <tr>
                    <th className="w-[210px] px-5 py-4">Request</th>
                    <th className="w-[220px] px-5 py-4">Customer</th>
                    <th className="w-[220px] px-5 py-4">Service</th>
                    <th className="w-[150px] px-5 py-4">Status</th>
                    <th className="w-[150px] px-5 py-4">Preferred</th>
                    <th className="w-[120px] px-5 py-4">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.serviceRequestId}
                      className="border-b border-[#eadfca] last:border-0 dark:border-[#302c24]"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/admin/service-requests/${request.serviceRequestId}`}
                          className="block truncate font-black text-[#8a6624] transition hover:text-[#6f4e12] dark:text-[#d6b46a]"
                          title={request.requestNumber}
                        >
                          {request.requestNumber}
                        </Link>

                        <p className="mt-1 text-xs font-semibold text-[#8f8778]">
                          #{request.serviceRequestId}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p
                          className="truncate font-black"
                          title={request.customerName}
                        >
                          {request.customerName}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                          {request.phoneNumber}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p
                          className="truncate font-black"
                          title={request.serviceCategory}
                        >
                          {request.serviceCategory}
                        </p>

                        <p
                          className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]"
                          title={request.serviceType}
                        >
                          {request.serviceType}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={request.currentStatus} />
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#6f6758] dark:text-[#a8a093]">
                        <p className="truncate">
                          {request.preferredDate || "Not selected"}
                        </p>

                        <p className="mt-1 truncate text-xs">
                          {request.preferredTimeSlot || "No time slot"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#6f6758] dark:text-[#a8a093]">
                        {new Date(request.createdAt).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#d8cdb6] px-5 py-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
                Showing {startRecord}-{endRecord} of {totalRecords} requests
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={pageNumber <= 1 || loading}
                  className="rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#1f1a12] transition hover:bg-[#fff4cc] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712]"
                >
                  Previous
                </button>

                <span className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-2 text-sm font-black text-[#1f1a12] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]">
                  Page {pageNumber} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={pageNumber >= totalPages || loading}
                  className="rounded-xl bg-[#1f1a12] px-4 py-2 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

type DropdownFieldProps = {
  value: number;
  placeholder: string;
  options: LookUpItem[];
  onChange: (value: number) => void;
};

function DropdownField({
  value,
  placeholder,
  options,
  onChange
}: DropdownFieldProps) {
  const [open, setOpen] = useState<boolean>(false);

  const selectedOption = options.find((option) => option.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-left text-sm font-semibold text-[#1f1a12] outline-none transition focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
      >
        <span className="truncate">{selectedOption?.name || placeholder}</span>

        <svg
          className={`h-5 w-5 shrink-0 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="m5 7.5 5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] shadow-2xl shadow-black/20 dark:border-[#302c24] dark:bg-[#11110f]">
          <DropdownOption
            active={value === 0}
            onClick={() => {
              onChange(0);
              setOpen(false);
            }}
          >
            {placeholder}
          </DropdownOption>

          {options.map((option) => (
            <DropdownOption
              key={option.id}
              active={value === option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              {option.name}
            </DropdownOption>
          ))}
        </div>
      )}
    </div>
  );
}

type DropdownOptionProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function DropdownOption({ active, onClick, children }: DropdownOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-3 text-left text-sm font-bold transition ${
        active
          ? "bg-[#d6b46a] text-[#11110f]"
          : "text-[#1f1a12] hover:bg-[#fff4cc] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712]"
      }`}
    >
      {children}
    </button>
  );
}

type StatusBadgeProps = {
  status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  let className =
    "border-[#d6b46a]/50 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";

  if (normalizedStatus.includes("accepted")) {
    className =
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300";
  }

  if (normalizedStatus.includes("progress")) {
    className =
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300";
  }

  if (normalizedStatus.includes("completed")) {
    className =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (normalizedStatus.includes("cancelled")) {
    className =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${className}`}
    >
      {status}
    </span>
  );
}

export default AdminServiceRequestsPage;
