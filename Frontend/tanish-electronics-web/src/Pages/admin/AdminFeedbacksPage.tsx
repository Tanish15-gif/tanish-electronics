import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
import { Link } from "react-router-dom";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  getAdminRepairFeedbacks,
  updateFeedbackPublicStatus,
  type AdminRepairFeedback
} from "../../Services/adminRepairFeedbackService";
import { exportFeedbacks } from "../../Services/adminExportService";
import { useShopSettings } from "../../hooks/useShopSettings";

type PublicFilter = "all" | "public" | "private";

const ratingOptions: DropdownOption<number>[] = [
  { value: 0, label: "All ratings" },
  { value: 5, label: "5 stars" },
  { value: 4, label: "4 stars" },
  { value: 3, label: "3 stars" },
  { value: 2, label: "2 stars" },
  { value: 1, label: "1 star" }
];

const visibilityOptions: DropdownOption<PublicFilter>[] = [
  { value: "all", label: "All visibility" },
  { value: "public", label: "Public feedback" },
  { value: "private", label: "Private feedback" }
];

function AdminFeedbacksPage() {
  const { settings } = useShopSettings();
  const { getToken } = useApiAuth();

  const [feedbacks, setFeedbacks] = useState<AdminRepairFeedback[]>([]);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [rating, setRating] = useState(0);
  const [publicFilter, setPublicFilter] = useState<PublicFilter>("all");

  const [feedbackToToggle, setFeedbackToToggle] =
    useState<AdminRepairFeedback | null>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const startRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalRecords);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Customer Feedback | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const loadFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const isPublic = getIsPublicValue(publicFilter);

      const data = await getAdminRepairFeedbacks(
        {
          rating: rating > 0 ? rating : null,
          isPublic,
          search: appliedSearch,
          pageNumber,
          pageSize
        },
        token
      );

      const safeTotalPages = Math.max(data.totalPages, 1);

      setFeedbacks(data.items);
      setTotalPages(safeTotalPages);
      setTotalRecords(data.totalRecords);

      if (pageNumber > safeTotalPages) {
        setPageNumber(safeTotalPages);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load customer feedback."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, rating, publicFilter, appliedSearch, pageNumber]);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  const publicCount = useMemo(
    () => feedbacks.filter((feedback) => feedback.isPublic).length,
    [feedbacks]
  );

  const privateCount = feedbacks.length - publicCount;

  const averageRating = useMemo(() => {
    if (feedbacks.length === 0) {
      return "0.0";
    }

    const totalRating = feedbacks.reduce(
      (total, feedback) => total + feedback.rating,
      0
    );

    return (totalRating / feedbacks.length).toFixed(1);
  }, [feedbacks]);

  const hasActiveFilters =
    appliedSearch.trim() !== "" || rating !== 0 || publicFilter !== "all";

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageNumber(1);
    setAppliedSearch(search.trim());
  }

  function handleRatingChange(value: number) {
    setRating(value);
    setPageNumber(1);
  }

  function handleVisibilityChange(value: PublicFilter) {
    setPublicFilter(value);
    setPageNumber(1);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setRating(0);
    setPublicFilter("all");
    setPageNumber(1);
  }

  function goToPreviousPage() {
    setPageNumber((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((current) => Math.min(current + 1, totalPages));
  }

  async function handleExportFeedbacks() {
    if (exporting) {
      return;
    }

    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await exportFeedbacks(token, {
        search: appliedSearch.trim() || undefined,
        rating: rating === 0 ? null : rating,
        isPublic: getIsPublicValue(publicFilter)
      });

      setSuccess("Feedback CSV downloaded successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to export feedback."
      );
    } finally {
      setExporting(false);
    }
  }

  async function confirmPublicStatusChange() {
    if (!feedbackToToggle) return;

    const newPublicStatus = !feedbackToToggle.isPublic;

    try {
      setUpdatingId(feedbackToToggle.customerRepairFeedbackId);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const result = await updateFeedbackPublicStatus(
        feedbackToToggle.customerRepairFeedbackId,
        newPublicStatus,
        token
      );

      setSuccess(
        result.message ||
          (newPublicStatus
            ? "Feedback published successfully."
            : "Feedback changed to private.")
      );

      setFeedbackToToggle(null);

      await loadFeedbacks();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update feedback visibility."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Customer experience
              </p>

              <h1 className="font-display mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Customer feedback
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Review repair ratings and control which customer feedback can
                appear publicly.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryCard label="Total" value={totalRecords.toString()} />

              <SummaryCard
                label="This page public"
                value={publicCount.toString()}
              />

              <SummaryCard
                label="This page private"
                value={privateCount.toString()}
              />

              <SummaryCard label="This page avg" value={`${averageRating} ★`} />
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <form
            onSubmit={handleSearchSubmit}
            className="grid gap-3 lg:grid-cols-[minmax(250px,1fr)_190px_210px_auto] lg:items-end"
          >
            <div>
              <label
                htmlFor="feedback-search"
                className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#5f574a] dark:text-[#b5ada0]"
              >
                Search feedback
              </label>

              <div className="relative">
                <SearchIcon />

                <input
                  id="feedback-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Request, customer, phone or comment..."
                  className="h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-11 pr-11 text-sm font-semibold text-[#11110f] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#817a6e]"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear feedback search"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] dark:hover:bg-[#242016]"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            <UniversalDropdown<number>
              label="Rating"
              options={ratingOptions}
              value={rating}
              onChange={handleRatingChange}
              placeholder="All ratings"
            />

            <UniversalDropdown<PublicFilter>
              label="Visibility"
              options={visibilityOptions}
              value={publicFilter}
              onChange={handleVisibilityChange}
              placeholder="All visibility"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="h-12 flex-1 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] lg:flex-none"
              >
                Search
              </button>

              <button
                type="button"
                onClick={() => void handleExportFeedbacks()}
                disabled={exporting || loading || totalRecords === 0}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016] lg:flex-none"
              >
                {exporting ? (
                  <>
                    <SmallSpinner />
                    Exporting...
                  </>
                ) : (
                  <>
                    <DownloadIcon />
                    Export CSV
                  </>
                )}
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
          <FeedbackLoading />
        ) : feedbacks.length === 0 ? (
          <EmptyFeedback
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />
        ) : (
          <section className="mt-6">
            <div className="mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
                Showing {startRecord}-{endRecord} of {totalRecords} feedbacks
              </p>

              <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Public feedback may be displayed to customers.
              </p>
            </div>

            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <FeedbackCard
                  key={feedback.customerRepairFeedbackId}
                  feedback={feedback}
                  updating={updatingId === feedback.customerRepairFeedbackId}
                  onVisibilityChange={() => setFeedbackToToggle(feedback)}
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

      <FeedbackVisibilityModal
        feedback={feedbackToToggle}
        updating={
          feedbackToToggle !== null &&
          updatingId === feedbackToToggle.customerRepairFeedbackId
        }
        onCancel={() => {
          if (!updatingId) {
            setFeedbackToToggle(null);
          }
        }}
        onConfirm={() => void confirmPublicStatusChange()}
      />
    </main>
  );
}

function getIsPublicValue(publicFilter: PublicFilter) {
  if (publicFilter === "public") {
    return true;
  }

  if (publicFilter === "private") {
    return false;
  }

  return null;
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
        Showing {startRecord}-{endRecord} of {totalRecords} feedbacks
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pageNumber <= 1 || loading}
          onClick={onPrevious}
          className="rounded-xl border border-[#d8cdb6] px-4 py-2 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:hover:bg-[#242016]"
        >
          Previous
        </button>

        <span className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-2 text-sm font-black dark:border-[#302c24] dark:bg-[#11110f]">
          Page {pageNumber} of {totalPages}
        </span>

        <button
          type="button"
          disabled={pageNumber >= totalPages || loading}
          onClick={onNext}
          className="rounded-xl bg-[#1f1a12] px-4 py-2 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function FeedbackCard({
  feedback,
  updating,
  onVisibilityChange
}: {
  feedback: AdminRepairFeedback;
  updating: boolean;
  onVisibilityChange: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm transition hover:border-[#c8b98f] hover:shadow-md dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Stars rating={feedback.rating} />

              <span className="text-sm font-black">{feedback.rating}/5</span>
            </div>

            <VisibilityBadge isPublic={feedback.isPublic} />
          </div>

          <blockquote className="mt-5 rounded-xl border border-[#eadfca] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
            <QuoteIcon />

            <p className="mt-3 whitespace-pre-line text-base font-semibold leading-7 text-[#4f4638] dark:text-[#d8cdb6]">
              {feedback.comment?.trim() ||
                "The customer submitted a rating without a written comment."}
            </p>
          </blockquote>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoLine label="Customer" value={feedback.customerName} />

            <InfoLine label="Phone" value={feedback.phoneNumber} />

            <InfoLine label="Request" value={feedback.requestNumber} />

            <InfoLine label="Service" value={feedback.serviceCategory} />
          </div>
        </div>

        <aside className="flex flex-col border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
            Submitted
          </p>

          <p className="mt-1 text-sm font-black">
            {formatDateTime(feedback.createdAt)}
          </p>

          <div className="mt-5 space-y-3">
            <Link
              to={`/admin/service-requests/${feedback.serviceRequestId}`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              View repair
              <ArrowRightIcon />
            </Link>

            <button
              type="button"
              onClick={onVisibilityChange}
              disabled={updating}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                feedback.isPublic
                  ? "border-[#d8cdb6] hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              }`}
            >
              {updating ? (
                <>
                  <SmallSpinner />
                  Updating...
                </>
              ) : feedback.isPublic ? (
                <>
                  <PrivateIcon />
                  Make private
                </>
              ) : (
                <>
                  <PublicIcon />
                  Publish feedback
                </>
              )}
            </button>
          </div>

          <p className="mt-auto pt-5 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
            {feedback.isPublic
              ? "This feedback can appear on public customer-facing sections."
              : "This feedback is visible only to administrators."}
          </p>
        </aside>
      </div>
    </article>
  );
}

function FeedbackVisibilityModal({
  feedback,
  updating,
  onCancel,
  onConfirm
}: {
  feedback: AdminRepairFeedback | null;
  updating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!feedback) return null;

  const publishing = !feedback.isPublic;

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !updating) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-visibility-title"
        className="w-full max-w-md rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#302c24] dark:bg-[#1a1712]"
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            publishing
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]"
          }`}
        >
          {publishing ? <PublicIcon /> : <PrivateIcon />}
        </div>

        <h2 id="feedback-visibility-title" className="mt-5 text-2xl font-black">
          {publishing
            ? "Publish this feedback?"
            : "Make this feedback private?"}
        </h2>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {publishing
            ? `This customer feedback may become visible on Home Page.`
            : "This feedback will be removed from public sections but will remain available in the admin panel."}
        </p>

        <div className="mt-5 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
          <Stars rating={feedback.rating} />

          <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6">
            {feedback.comment || "No written comment provided."}
          </p>

          <p className="mt-3 text-xs font-black text-[#817867] dark:text-[#928a7d]">
            {feedback.customerName} · {feedback.requestNumber}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={updating}
            className="h-12 rounded-xl border border-[#d8cdb6] text-sm font-black transition hover:bg-[#f2eadb] disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={updating}
            className={`h-12 rounded-xl text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
              publishing
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-[#1f1a12] text-[#f7f5ef] hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
            }`}
          >
            {updating ? "Updating..." : publishing ? "Publish" : "Make private"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[90px] rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 py-3 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={`text-xl ${
            star <= rating
              ? "text-[#d6b46a]"
              : "text-[#d8cdb6] dark:text-[#40392e]"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
      Public
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-3 py-1.5 text-[10px] font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
      Private
    </span>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p title={value} className="mt-1 truncate text-sm font-black">
        {value}
      </p>
    </div>
  );
}

function FeedbackLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 dark:border-[#302c24] dark:bg-[#1a1712]"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div>
              <div className="h-6 w-36 rounded bg-[#eee5d4] dark:bg-[#302c24]" />

              <div className="mt-5 h-28 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />

              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="h-10 rounded bg-[#eee5d4] dark:bg-[#302c24]"
                  />
                ))}
              </div>
            </div>

            <div className="h-36 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeedback({
  hasActiveFilters,
  onClear
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7] px-6 py-14 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <StarIcon />
      </div>

      <h2 className="mt-5 text-xl font-black">No feedback found</h2>

      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        No repair feedback matches the current search and filters.
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

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function SmallSpinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
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

function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 text-[#8a6624] dark:text-[#d6b46a]"
    >
      <path
        d="M5 11h5v7H4v-5c0-4 2-7 6-8M14 11h5v7h-6v-5c0-4 2-7 6-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PublicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PrivateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
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

export default AdminFeedbacksPage;
