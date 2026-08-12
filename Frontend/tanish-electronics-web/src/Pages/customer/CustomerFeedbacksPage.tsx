import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import ActionButton from "../../components/UI/ActionButton";
import {
  getCustomerRepairFeedbackCenter,
  upsertCustomerRepairFeedback,
  type CustomerRepairFeedbackCenterItem
} from "../../Services/customerRepairService";
import { useShopSettings } from "../../hooks/useShopSettings";

type FeedbackTab = "needs" | "submitted" | "waiting";

const ratingLabels: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent"
};

function CustomerFeedbacksPage() {
  const { settings } = useShopSettings();
  const { getToken } = useApiAuth();

  const initialTabSelectedRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [items, setItems] = useState<CustomerRepairFeedbackCenterItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<FeedbackTab>("needs");

  const [searchTerm, setSearchTerm] = useState("");

  const [activeId, setActiveId] = useState<number | null>(null);

  const [savingId, setSavingId] = useState<number | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [pageError, setPageError] = useState("");

  const [formError, setFormError] = useState("");

  const [success, setSuccess] = useState("");

  const needsFeedback = useMemo(
    () => items.filter((item) => item.canGiveFeedback && !item.hasFeedback),
    [items]
  );

  const submittedFeedback = useMemo(
    () => items.filter((item) => item.hasFeedback),
    [items]
  );

  const waitingForCompletion = useMemo(
    () => items.filter((item) => !item.canGiveFeedback && !item.hasFeedback),
    [items]
  );

  const activeItem = useMemo(
    () => items.find((item) => item.serviceRequestId === activeId) ?? null,
    [items, activeId]
  );

  const currentTabItems = useMemo(() => {
    if (activeTab === "submitted") {
      return submittedFeedback;
    }

    if (activeTab === "waiting") {
      return waitingForCompletion;
    }

    return needsFeedback;
  }, [activeTab, needsFeedback, submittedFeedback, waitingForCompletion]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return currentTabItems;
    }

    return currentTabItems.filter((item) => {
      const searchableText = [
        item.requestNumber,
        item.serviceCategory,
        item.currentStatus,
        item.deviceName,
        item.brand,
        item.modelName
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [currentTabItems, searchTerm]);

  const loadFeedbacks = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError("");

        const token = await getToken();

        if (!token) {
          setPageError("Your session has expired. Please sign in again.");

          return;
        }

        const data = await getCustomerRepairFeedbackCenter(token);

        setItems(data);

        if (!initialTabSelectedRef.current) {
          const hasNeeds = data.some(
            (item) => item.canGiveFeedback && !item.hasFeedback
          );

          const hasSubmitted = data.some((item) => item.hasFeedback);

          if (hasNeeds) {
            setActiveTab("needs");
          } else if (hasSubmitted) {
            setActiveTab("submitted");
          } else {
            setActiveTab("waiting");
          }

          initialTabSelectedRef.current = true;
        }
      } catch (error) {
        setPageError(
          error instanceof Error ? error.message : "Failed to load feedback."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `My Feedback | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  const closeFeedbackForm = useCallback(() => {
    if (savingId !== null) return;

    setActiveId(null);
    setRating(5);
    setComment("");
    setFormError("");
  }, [savingId]);

  useEffect(() => {
    if (activeId === null) return;

    const scrollPosition = window.scrollY;

    const previousStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPosition}px`;

    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFeedbackForm();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.position = previousStyles.position;

      document.body.style.top = previousStyles.top;

      document.body.style.left = previousStyles.left;

      document.body.style.right = previousStyles.right;

      document.body.style.width = previousStyles.width;

      document.body.style.overflow = previousStyles.overflow;

      window.scrollTo(0, scrollPosition);
    };
  }, [activeId, closeFeedbackForm]);

  function openFeedbackForm(item: CustomerRepairFeedbackCenterItem) {
    if (!item.canGiveFeedback && !item.hasFeedback) {
      return;
    }

    setActiveId(item.serviceRequestId);
    setRating(item.rating ?? 5);
    setComment(item.comment ?? "");
    setFormError("");
    setPageError("");
  }

  async function handleSubmitFeedback(
    event: FormEvent<HTMLFormElement>,
    item: CustomerRepairFeedbackCenterItem
  ) {
    event.preventDefault();

    if (rating < 1 || rating > 5) {
      setFormError("Please select a rating.");

      return;
    }

    if (comment.trim().length > 1000) {
      setFormError("Comment cannot exceed 1000 characters.");

      return;
    }

    const wasExistingFeedback = item.hasFeedback;

    try {
      setSavingId(item.serviceRequestId);
      setFormError("");
      setPageError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        setFormError("Your session has expired. Please sign in again.");

        return;
      }

      const feedback = await upsertCustomerRepairFeedback(
        item.serviceRequestId,
        {
          rating,
          comment: comment.trim() || null
        },
        token
      );

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.serviceRequestId === item.serviceRequestId
            ? {
                ...currentItem,
                hasFeedback: true,
                rating: feedback.rating,
                comment: feedback.comment
              }
            : currentItem
        )
      );

      setActiveId(null);
      setRating(5);
      setComment("");
      setFormError("");
      setActiveTab("submitted");

      setSuccess(
        wasExistingFeedback
          ? "Feedback updated successfully."
          : "Feedback submitted. Thank you."
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save feedback."
      );
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <FeedbackLoadingState />;
  }

  return (
    <main className="te-sheet-bg mx-auto min-h-full w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page header */}
      <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Repair feedback
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              My Feedback
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Rate completed repairs or update feedback you already submitted.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadFeedbacks(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016] sm:w-fit"
          >
            <RefreshIcon spinning={refreshing} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          <SummaryCard
            label="Need feedback"
            value={needsFeedback.length}
            icon="star"
            active={needsFeedback.length > 0}
          />

          <SummaryCard
            label="Submitted"
            value={submittedFeedback.length}
            icon="check"
          />

          <SummaryCard
            label="Waiting"
            value={waitingForCompletion.length}
            icon="clock"
          />
        </div>
      </section>

      {/* Messages */}
      <div aria-live="polite" className="mt-5 space-y-3">
        {pageError && <MessageBox type="error" message={pageError} />}

        {success && <MessageBox type="success" message={success} />}
      </div>

      {/* Feedback workspace */}
      <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="border-b border-[#d8cdb6] p-3 dark:border-[#302c24] sm:p-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FeedbackTabButton
              active={activeTab === "needs"}
              label="Needs Feedback"
              count={needsFeedback.length}
              onClick={() => setActiveTab("needs")}
            />

            <FeedbackTabButton
              active={activeTab === "submitted"}
              label="Submitted"
              count={submittedFeedback.length}
              onClick={() => setActiveTab("submitted")}
            />

            <FeedbackTabButton
              active={activeTab === "waiting"}
              label="Waiting"
              count={waitingForCompletion.length}
              onClick={() => setActiveTab("waiting")}
            />
          </div>

          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]">
              <SearchIcon />
            </span>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search request, service or device"
              className="h-11 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:placeholder:text-[#8f8778]"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <FeedbackEmptyState
              tab={activeTab}
              searching={Boolean(searchTerm.trim())}
              onClearSearch={() => setSearchTerm("")}
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredItems.map((item) => (
                <RepairFeedbackCard
                  key={item.serviceRequestId}
                  item={item}
                  tab={activeTab}
                  onFeedback={() => openFeedbackForm(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {activeItem &&
        typeof document !== "undefined" &&
        createPortal(
          <FeedbackModal
            item={activeItem}
            rating={rating}
            setRating={setRating}
            comment={comment}
            setComment={setComment}
            error={formError}
            saving={savingId === activeItem.serviceRequestId}
            closeButtonRef={closeButtonRef}
            onClose={closeFeedbackForm}
            onSubmit={(event) => handleSubmitFeedback(event, activeItem)}
          />,
          document.body
        )}
    </main>
  );
}

function RepairFeedbackCard({
  item,
  tab,
  onFeedback
}: {
  item: CustomerRepairFeedbackCenterItem;
  tab: FeedbackTab;
  onFeedback: () => void;
}) {
  const submitted = item.hasFeedback;
  const waiting = tab === "waiting";

  return (
    <article className="flex h-full flex-col rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffaf0] p-4 transition hover:border-[#c7b98e] hover:shadow-md dark:border-[#302c24] dark:bg-[#11110f] dark:hover:border-[#50483b] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={item.currentStatus} />

        <p className="text-xs font-black text-[#817867] dark:text-[#928a7d]">
          {item.requestNumber}
        </p>
      </div>

      <h2 className="mt-4 text-xl font-black leading-tight">
        {item.serviceCategory}
      </h2>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {getDeviceText(item)}
      </p>

      {submitted && item.rating && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Stars rating={item.rating} />

          <span className="text-xs font-black text-[#817867] dark:text-[#928a7d]">
            {ratingLabels[item.rating] ?? `${item.rating}/5`}
          </span>
        </div>
      )}

      {submitted && item.comment && (
        <blockquote className="mt-4 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-4 text-sm font-semibold leading-6 text-[#4f4638] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#d8cdb6]">
          “{item.comment}”
        </blockquote>
      )}

      {waiting && (
        <div className="mt-4 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-3 text-xs font-semibold leading-5 text-[#6f6758] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#a8a093]">
          Feedback becomes available after the repair is completed.
        </div>
      )}

      <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
        <Link
          to={`/customer/repairs/${item.serviceRequestId}`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
        >
          View Repair
        </Link>

        {!waiting && (
          <button
            type="button"
            onClick={onFeedback}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1f1a12] px-4 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
          >
            {submitted ? "Edit Feedback" : "Give Feedback"}
          </button>
        )}
      </div>
    </article>
  );
}

function FeedbackModal({
  item,
  rating,
  setRating,
  comment,
  setComment,
  error,
  saving,
  closeButtonRef,
  onClose,
  onSubmit
}: {
  item: CustomerRepairFeedbackCenterItem;
  rating: number;
  setRating: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  error: string;
  saving: boolean;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[800]">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onMouseDown={onClose}
      />

      <div className="relative flex h-full items-end justify-center sm:items-center sm:p-4">
        <form
          onSubmit={onSubmit}
          onMouseDown={(event) => event.stopPropagation()}
          className="flex max-h-[100dvh] w-full flex-col overflow-hidden bg-[#f7f5ef] text-[#1f1a12] shadow-2xl dark:bg-[#11110f] dark:text-[#e8e3d8] sm:max-h-[90dvh] sm:max-w-xl sm:rounded-[1.5rem] sm:border sm:border-[#d8cdb6] dark:sm:border-[#302c24]"
        >
          {/* Header */}
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d8cdb6] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#302c24] sm:px-6 sm:pt-5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
                {item.hasFeedback ? "Update feedback" : "Give feedback"}
              </p>

              <h2 className="mt-2 truncate text-xl font-black sm:text-2xl">
                {item.serviceCategory}
              </h2>

              <p className="mt-1 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                {item.requestNumber}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close feedback form"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
            >
              <CloseIcon />
            </button>
          </header>

          {/* Content */}
          <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            <div className="rounded-xl border border-[#d8cdb6] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
              <p className="text-sm font-black">
                Your rating{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </p>

              <div
                role="radiogroup"
                aria-label="Repair rating"
                className="mt-4 flex justify-between gap-2 sm:justify-start"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    disabled={saving}
                    onClick={() => setRating(star)}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border text-2xl transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      star <= rating
                        ? "border-[#d6b46a] bg-[#fff4cc] text-[#c28b17] dark:border-[#d6b46a]/50 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]"
                        : "border-[#d8cdb6] bg-[#fffdf7] text-[#c9bfad] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#5f584d] dark:hover:bg-[#242016]"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <p className="mt-3 text-sm font-black text-[#8a6624] dark:text-[#d6b46a]">
                {ratingLabels[rating]}
              </p>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="feedback-comment"
                  className="text-sm font-black"
                >
                  Comment
                  <span className="ml-1 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                    Optional
                  </span>
                </label>

                <span className="text-xs font-bold text-[#817867] dark:text-[#928a7d]">
                  {comment.length}/1000
                </span>
              </div>

              <textarea
                id="feedback-comment"
                value={comment}
                disabled={saving}
                maxLength={1000}
                rows={5}
                placeholder="Share your experience with the repair service."
                onChange={(event) => {
                  setComment(event.target.value);
                }}
                className="w-full resize-none rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#1a1712] dark:placeholder:text-[#8f8778]"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="grid shrink-0 gap-3 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#302c24] dark:bg-[#11110f] sm:grid-cols-2 sm:px-6 sm:pb-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-12 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
            >
              Cancel
            </button>

            <ActionButton
              type="submit"
              loading={saving}
              loadingText="Saving..."
              variant="dark"
              fullWidth
              className="h-12 rounded-xl"
            >
              {item.hasFeedback ? "Update Feedback" : "Submit Feedback"}
            </ActionButton>
          </footer>
        </form>
      </div>
    </div>
  );
}

function FeedbackTabButton({
  active,
  label,
  count,
  onClick
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-black transition ${
        active
          ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#e8e3d8] dark:text-[#11110f]"
          : "bg-[#fffaf0] text-[#6f6758] hover:bg-[#f2eadb] hover:text-[#1f1a12] dark:bg-[#11110f] dark:text-[#a8a093] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
      }`}
    >
      {label}

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
  active = false
}: {
  label: string;
  value: number;
  icon: "star" | "check" | "clock";
  active?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 sm:p-4 ${
        active
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

function FeedbackEmptyState({
  tab,
  searching,
  onClearSearch
}: {
  tab: FeedbackTab;
  searching: boolean;
  onClearSearch: () => void;
}) {
  const content = {
    needs: {
      title: "No feedback required",
      description: "Completed repairs waiting for feedback will appear here."
    },
    submitted: {
      title: "No submitted feedback",
      description: "Feedback you share will appear here."
    },
    waiting: {
      title: "No repairs waiting",
      description: "Repairs still in progress will appear here."
    }
  }[tab];

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8cdb6] bg-[#fffaf0] px-5 py-10 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <FeedbackIcon />
      </span>

      <h2 className="mt-4 text-lg font-black">
        {searching ? "No matching repairs" : content.title}
      </h2>

      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {searching
          ? "Try another request number, service or device name."
          : content.description}
      </p>

      {searching && (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-5 h-10 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
        >
          Clear Search
        </button>
      )}

      {!searching && tab === "needs" && (
        <Link
          to="/customer/repairs"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-4 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
        >
          View My Repairs
        </Link>
      )}
    </div>
  );
}

function FeedbackLoadingState() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex min-h-[55vh] items-center justify-center rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

          <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Loading feedback...
          </p>
        </div>
      </div>
    </main>
  );
}

function MessageBox({
  type,
  message
}: {
  type: "success" | "error";
  message: string;
}) {
  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      {message}
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
          className={`text-lg ${
            star <= rating
              ? "text-[#d6b46a]"
              : "text-[#d8cdb6] dark:text-[#4b463d]"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let styles =
    "border-[#d6b46a]/40 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";

  if (normalized.includes("completed") || normalized.includes("delivered")) {
    styles =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  } else if (
    normalized.includes("cancelled") ||
    normalized.includes("canceled") ||
    normalized.includes("rejected")
  ) {
    styles =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  } else if (normalized.includes("pending")) {
    styles =
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";
  } else if (normalized.includes("progress")) {
    styles =
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300";
  }

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black ${styles}`}
    >
      {status}
    </span>
  );
}

function getDeviceText(item: CustomerRepairFeedbackCenterItem) {
  return (
    [item.deviceName, item.brand, item.modelName].filter(Boolean).join(" • ") ||
    "Device details not added"
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 5h14v11H9l-4 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m12 8 .8 1.7 1.9.2-1.4 1.3.4 1.8-1.7-.9-1.7.9.4-1.8-1.4-1.3 1.9-.2L12 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SummaryIcon({ type }: { type: "star" | "check" | "clock" }) {
  if (type === "check") {
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

  if (type === "clock") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-5 w-5"
      >
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

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CustomerFeedbacksPage;
