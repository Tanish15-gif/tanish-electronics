import { useApiAuth } from "../../hooks/useApiAuth";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCustomerRepairDetails,
  getRepairImageUrl,
  upsertCustomerRepairFeedback,
  type CustomerRepairDetails,
  type CustomerRepairStatusHistory
} from "../../Services/customerRepairService";
import { generateRepairReceiptPdf } from "../../utils/generateRepairReceiptPdf";
import ActionButton from "../../components/UI/ActionButton";
import { useShopSettings } from "../../hooks/useShopSettings";
import { getCachedShopSettings } from "../../Services/publicShopSettingsService";
import { useRepairTrackingSignalR } from "../../hooks/useRepairTrackingSignalR";

function CustomerRepairDetailsPage() {
  const { settings } = useShopSettings();
  const { id } = useParams();
  const { getToken } = useApiAuth();

  const [repair, setRepair] = useState<CustomerRepairDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  const handleLiveTrackingUpdate = useCallback(() => {
    void loadRepairDetails();
  }, [id]);

  const { isLiveConnected } = useRepairTrackingSignalR(
    repair?.requestNumber,
    handleLiveTrackingUpdate
  );

  useEffect(() => {
    loadRepairDetails();
  }, [id]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${repair?.requestNumber} | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, [repair]);

  async function loadRepairDetails() {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        setError("Please sign in again.");
        return;
      }

      const data = await getCustomerRepairDetails(Number(id), token);
      setRepair(data);
      setFeedbackRating(data.feedback?.rating ?? 5);
      setFeedbackComment(data.feedback?.comment ?? "");

      const completed = data.currentStatus.toLowerCase().includes("completed");
      const dismissKey = `repair-feedback-dismissed-${data.serviceRequestId}`;

      if (
        completed &&
        !data.feedback &&
        localStorage.getItem(dismissKey) !== "true"
      ) {
        setFeedbackModalOpen(true);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load repair details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedbackSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repair) return;

    if (feedbackRating < 1 || feedbackRating > 5) {
      setError("Please select a rating between 1 and 5.");
      return;
    }

    if (feedbackComment.trim().length > 1000) {
      setError("Feedback comment cannot be more than 1000 characters.");
      return;
    }

    try {
      setSavingFeedback(true);
      setError("");

      const token = await getToken();

      if (!token) {
        setError("Please sign in again.");
        return;
      }

      const feedback = await upsertCustomerRepairFeedback(
        repair.serviceRequestId,
        {
          rating: feedbackRating,
          comment: feedbackComment.trim() || null
        },
        token
      );

      setRepair({
        ...repair,
        feedback
      });

      localStorage.removeItem(
        `repair-feedback-dismissed-${repair.serviceRequestId}`
      );

      setFeedbackModalOpen(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save feedback."
      );
    } finally {
      setSavingFeedback(false);
    }
  }

  function handleFeedbackNotNow() {
    if (!repair) return;

    localStorage.setItem(
      `repair-feedback-dismissed-${repair.serviceRequestId}`,
      "true"
    );

    setFeedbackModalOpen(false);
  }

  if (loading) {
    return (
      <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="rounded-[2.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 dark:border-[#302c24] dark:bg-[#1a1712] sm:p-8">
          <div className="h-4 w-32 rounded bg-[#e8e0ce] dark:bg-[#28231a]" />
          <div className="mt-4 h-10 w-3/4 max-w-md rounded-xl bg-[#e8e0ce] dark:bg-[#28231a]" />
          <div className="mt-4 h-4 w-1/2 max-w-sm rounded bg-[#e8e0ce] dark:bg-[#28231a]" />
          <div className="mt-6 flex gap-3">
            <div className="h-12 w-36 rounded-2xl bg-[#e8e0ce] dark:bg-[#28231a]" />
            <div className="h-12 w-36 rounded-2xl bg-[#e8e0ce] dark:bg-[#28231a]" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="h-72 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />
          <div className="h-72 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />
        </div>
      </main>
    );
  }

  if (error || !repair) {
    return (
      <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          {error || "Repair request not found."}
        </div>

        <Link
          to="/customer/repairs"
          className="mt-5 inline-flex rounded-2xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Back to My Repairs
        </Link>
      </main>
    );
  }

  const deviceText =
    [repair.deviceName, repair.brand, repair.modelName]
      .filter(Boolean)
      .join(" • ") || repair.serviceType;

  const isCompleted = repair.currentStatus.toLowerCase().includes("completed");

  const trackUrl = `/track-request?requestNumber=${encodeURIComponent(
    repair.requestNumber
  )}&phoneNumber=${encodeURIComponent(repair.phoneNumber)}`;
  return (
    <main className="te-sheet-bg px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_380px] xl:items-center">
          <div>
            <Link
              to="/customer/repairs"
              className="inline-flex rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-2 text-xs font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
            >
              ← Back to My Repairs
            </Link>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#8a6624] dark:text-[#d6b46a]">
              Repair Details
            </p>

            <h1 className="font-display mt-4 text-3xl font-bold leading-[1.05] xs:text-4xl sm:text-5xl lg:text-6xl">
              {repair.serviceCategory}
            </h1>

            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
              {repair.issueDescription}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={trackUrl}
                className="inline-flex justify-center rounded-2xl bg-[#1f1a12] px-6 py-4 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                Track Request
              </Link>

              <a
                href={settings.primaryPhone ? `tel:${settings.primaryPhone}` : "tel:8850973399"}
                className="inline-flex min-w-[148px] justify-center items-center rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-6 py-4 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                Call Shop
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Current Status
              </p>
              {isLiveConnected && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-black tracking-wide text-emerald-800 shadow-xs dark:border-emerald-700/60 dark:bg-emerald-950/70 dark:text-emerald-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  Live Sync Active
                </span>
              )}
            </div>

            <div className="mt-4">
              <StatusBadge status={repair.currentStatus} />
            </div>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Request Number
            </p>

            <p className="mt-2 break-words text-2xl font-black">
              {repair.requestNumber}
            </p>
          </div>
        </div>
      </section>

      <RepairProgressTracker repair={repair} />

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <Card title="Device Information" heading="Repair item details">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBox
                title="Service Category"
                value={repair.serviceCategory}
              />
              <InfoBox title="Service Type" value={repair.serviceType} />
              <InfoBox title="Device" value={deviceText} />
              <InfoBox title="Status" value={repair.currentStatus} />
            </div>
          </Card>

          <Card title="Visit Details" heading="Address and timing">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBox
                title="Visit Address"
                value={repair.visitAddress || "Not provided"}
              />
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
          </Card>

          {repair.showRepairNotesToCustomer &&
            (repair.diagnosis ||
              repair.workNotes ||
              repair.partsUsed ||
              repair.warrantyNote) && (
              <CustomerRepairWorkSummary repair={repair} />
            )}

          <Card title="Photos" heading="Uploaded images">
            {repair.images.length === 0 ? (
              <EmptyBox text="No photos uploaded for this request." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {repair.images.map((image) => (
                  <a
                    key={image.serviceRequestImageId}
                    href={getRepairImageUrl(image.imageUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]"
                  >
                    <img
                      src={getRepairImageUrl(image.imageUrl)}
                      alt={image.originalFileName || "Repair image"}
                      className="h-44 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </Card>

          <Card title="Status Timeline" heading="Repair progress">
            {repair.statusHistory.length === 0 ? (
              <div className="space-y-4">
                <TimelineItem
                  title="Request Created"
                  text={`Repair request created on ${formatDate(
                    repair.createdAt
                  )}.`}
                  active
                />

                <TimelineItem
                  title={repair.currentStatus}
                  text="This is the current repair status."
                  active
                />
              </div>
            ) : (
              <div className="space-y-4">
                {repair.statusHistory.map((history) => (
                  <TimelineHistoryItem
                    key={history.statusHistoryId}
                    history={history}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>

        <aside className="h-fit space-y-6 xl:sticky xl:top-24">
          <section className="rounded-[2rem] border border-[#302c24] bg-[#1f1a12] p-6 text-[#f7f5ef] shadow-sm dark:bg-[#1a1712]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d6b46a]">
              Quick Help
            </p>

            <h2 className="font-display mt-2 text-3xl font-bold leading-none">
              Need update?
            </h2>

            <p className="mt-4 text-sm font-semibold leading-6 text-[#d8cdb6] dark:text-[#a8a093]">
              For urgent update, call the shop or WhatsApp with your request
              number.
            </p>

            <div className="mt-5 grid gap-3">
              <a
                href="tel:8850973399"
                className="rounded-2xl bg-[#e8e3d8] px-5 py-3 text-center text-sm font-black text-[#11110f] transition hover:bg-[#d6b46a]"
              >
                Call Shop
              </a>

              <a
                href={`https://api.whatsapp.com/send?phone=918850973399&text=${encodeURIComponent(
                  `Hello ${settings.shopName}, I need update for request ${repair.requestNumber}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-[#d8cdb6]/30 px-5 py-3 text-center text-sm font-black text-[#f7f5ef] transition hover:bg-white/10"
              >
                WhatsApp
              </a>
              {isCompleted && (
                <button
                  type="button"
                  onClick={() => generateRepairReceiptPdf(repair)}
                  className="rounded-2xl border border-[#d8cdb6]/30 px-5 py-3 text-center text-sm font-black text-[#f7f5ef] transition hover:bg-white/10"
                >
                  Download Receipt PDF
                </button>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Account
            </p>

            <h2 className="font-display mt-2 text-3xl font-bold leading-none">
              Manage profile
            </h2>

            <p className="mt-4 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Keep your phone number and address updated for faster repair
              service.
            </p>

            <Link
              to="/customer/profile"
              className="mt-5 inline-flex w-full justify-center rounded-2xl border border-[#d8cdb6] bg-[#e8e3d8] px-5 py-3 text-sm font-black text-[#11110f] transition hover:bg-[#d6b46a] dark:border-[#302c24] dark:bg-[#e8e3d8] dark:text-[#11110f]"
            >
              My Profile
            </Link>
          </section>
        </aside>
      </div>
      <FeedbackModal
        open={feedbackModalOpen}
        rating={feedbackRating}
        setRating={setFeedbackRating}
        comment={feedbackComment}
        setComment={setFeedbackComment}
        saving={savingFeedback}
        onSubmit={handleFeedbackSubmit}
        onNotNow={handleFeedbackNotNow}
      />
    </main>
  );
}

function Card({
  title,
  heading,
  children
}: {
  title: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </p>

      <h2 className="font-display mt-2 text-4xl font-bold leading-none">
        {heading}
      </h2>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </p>

      <p className="mt-2 break-words text-sm font-black">{value}</p>
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
      className={`inline-flex rounded-full border px-4 py-2 text-xs font-black ${className}`}
    >
      {status}
    </span>
  );
}

function TimelineHistoryItem({
  history
}: {
  history: CustomerRepairStatusHistory;
}) {
  return (
    <TimelineItem
      title={history.newStatus}
      text={`${history.note || "Status updated."} ${
        history.changedByName ? `Updated by ${history.changedByName}.` : ""
      } ${formatDateTime(history.changedAt)}`}
      active
    />
  );
}

function TimelineItem({
  title,
  text,
  active = false
}: {
  title: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={`h-4 w-4 rounded-full border ${
            active
              ? "border-[#d6b46a] bg-[#d6b46a]"
              : "border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#11110f]"
          }`}
        />
        <span className="mt-2 h-full w-px bg-[#d8cdb6] dark:bg-[#302c24]" />
      </div>

      <div className="pb-5">
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {text}
        </p>
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#d8cdb6] bg-[#fff8e7] p-6 text-center text-sm font-bold text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
      {text}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
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

const repairSteps = [
  {
    title: "Request Created",
    description: "Your repair request was received."
  },
  {
    title: "Pending",
    description: "Waiting for shop confirmation."
  },
  {
    title: "In Progress",
    description: "Repair or inspection work is ongoing."
  },
  {
    title: "Completed",
    description: "Repair work is completed."
  }
];

function RepairProgressTracker({ repair }: { repair: CustomerRepairDetails }) {
  const lowerStatus = repair.currentStatus.toLowerCase();

  const currentIndex = lowerStatus.includes("completed")
    ? 3
    : lowerStatus.includes("progress") ||
        lowerStatus.includes("inspection") ||
        lowerStatus.includes("repair")
      ? 2
      : lowerStatus.includes("pending")
        ? 1
        : 0;

  const isCancelled = lowerStatus.includes("cancelled");

  return (
    <section className="mt-8 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex flex-col gap-3 border-b border-[#d8cdb6] pb-5 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
            Live Progress
          </p>

          <h2 className="font-display mt-2 text-4xl font-bold leading-none">
            Repair tracking
          </h2>
        </div>

        <StatusBadge status={repair.currentStatus} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <PriceSummaryBox
          title="Estimated Price"
          value={repair.estimatedPrice}
          emptyText="Estimate not added yet"
          helper="Approximate repair cost shared after inspection."
        />

        <PriceSummaryBox
          title="Final Price"
          value={repair.finalPrice}
          emptyText="Waiting for final price"
          helper="Final amount after repair completion."
        />
        <PaymentStatusBox
          paymentStatus={repair.paymentStatus || "Pending"}
          paidAt={repair.paidAt}
        />
      </div>

      {repair.finalPrice != null ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          Final repair price has been updated by{" "}
          {getCachedShopSettings().shopName}.
        </div>
      ) : repair.estimatedPrice != null ? (
        <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-700 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-300">
          Estimate is available. Final price will be updated after repair.
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-4 text-sm font-bold text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
          Price estimate is not added yet.
        </div>
      )}

      {isCancelled ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          This repair request was cancelled. Contact the shop for more details.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {repairSteps.map((step, index) => {
            const isDone = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div
                key={step.title}
                className={`rounded-[1.5rem] border p-4 transition ${
                  isDone
                    ? "border-[#d6b46a]/50 bg-[#fff4cc] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10"
                    : "border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black ${
                      isDone
                        ? "border-[#d6b46a] bg-[#d6b46a] text-[#11110f]"
                        : "border-[#d8cdb6] bg-[#fffdf7] text-[#6f6758] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#a8a093]"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </span>

                  <div>
                    <p className="text-sm font-black">{step.title}</p>

                    {isCurrent && (
                      <p className="mt-1 text-xs font-black text-[#8a6624] dark:text-[#d6b46a]">
                        Current step
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
function PaymentStatusBox({
  paymentStatus,
  paidAt
}: {
  paymentStatus: string;
  paidAt?: string | null;
}) {
  const normalizedStatus = paymentStatus.toLowerCase();

  const statusClass = normalizedStatus.includes("paid")
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
    : normalizedStatus.includes("not required")
      ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300"
      : "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-400/20 dark:bg-yellow-400/10 dark:text-yellow-300";

  return (
    <div className="mt-4 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
            Payment Status
          </p>

          <p className="mt-3 text-2xl font-black">{paymentStatus}</p>

          <p className="mt-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {paidAt
              ? `Paid on ${formatDateTime(paidAt)}`
              : paymentStatus === "Not Required"
                ? "No payment is required for this request."
                : "Payment is not marked as paid yet."}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-4 py-2 text-xs font-black ${statusClass}`}
        >
          {paymentStatus}
        </span>
      </div>
    </div>
  );
}
function PriceSummaryBox({
  title,
  value,
  emptyText,
  helper
}: {
  title: string;
  value?: number | null;
  emptyText: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black leading-none">
        {value != null ? formatMoney(value) : "—"}
      </p>

      <p className="mt-3 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
        {value != null ? helper : emptyText}
      </p>
    </div>
  );
}
function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}
function CustomerRepairWorkSummary({
  repair
}: {
  repair: CustomerRepairDetails;
}) {
  return (
    <section className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
        Repair Update
      </p>

      <h2 className="font-display mt-2 text-3xl font-bold">
        Diagnosis & Work Summary
      </h2>

      <div className="mt-5 grid gap-4">
        {repair.diagnosis && (
          <CustomerRepairNote title="Diagnosis" value={repair.diagnosis} />
        )}

        {repair.workNotes && (
          <CustomerRepairNote title="Work Done" value={repair.workNotes} />
        )}

        {repair.partsUsed && (
          <CustomerRepairNote title="Parts Used" value={repair.partsUsed} />
        )}

        {repair.warrantyNote && (
          <CustomerRepairNote
            title="Warranty Note"
            value={repair.warrantyNote}
          />
        )}
      </div>
    </section>
  );
}

function CustomerRepairNote({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7">
        {value}
      </p>
    </div>
  );
}
function FeedbackModal({
  open,
  rating,
  setRating,
  comment,
  setComment,
  saving,
  onSubmit,
  onNotNow
}: {
  open: boolean;
  rating: number;
  setRating: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNotNow: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl shadow-black/40 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]">
        <div className="border-b border-[#d8cdb6] bg-[#fff8e7] p-6 dark:border-[#302c24] dark:bg-[#11110f]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
            Repair Completed
          </p>

          <h2 className="font-display mt-3 text-4xl font-bold leading-none">
            How was our service?
          </h2>

          <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
            Please rate your repair experience with{" "}
            {getCachedShopSettings().shopName}.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div>
            <label className="mb-3 block text-sm font-black">
              Select Rating
            </label>

            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-xl font-black transition ${
                    star <= rating
                      ? "border-[#d6b46a] bg-[#d6b46a] text-[#11110f]"
                      : "border-[#d8cdb6] bg-[#fff8e7] text-[#6f6758] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <p className="mt-2 text-xs font-bold text-[#6f6758] dark:text-[#a8a093]">
              Selected rating: {rating}/5
            </p>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-black">Comment</label>

              <span className="text-xs font-bold text-[#8f8778]">
                {comment.length}/1000
              </span>
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Example: Good service, fast repair and polite communication."
              className="w-full resize-none rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#11110f] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onNotNow}
              disabled={saving}
              className="rounded-2xl border border-[#d8cdb6] bg-transparent px-5 py-4 text-sm font-black text-[#1f1a12] transition hover:bg-[#fff8e7] disabled:opacity-70 dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#11110f]"
            >
              Not Now
            </button>

            <ActionButton
              type="submit"
              loading={saving}
              loadingText=""
              variant="gold"
              fullWidth={false}
              className="h-12 min-w-[150px] px-5 py-0"
            >
              Submit
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
export default CustomerRepairDetailsPage;
