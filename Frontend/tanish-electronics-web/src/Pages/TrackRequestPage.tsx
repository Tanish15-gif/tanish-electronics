import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import ActionButton from "../components/UI/ActionButton";
import {
  trackServiceRequest,
  type TrackServiceRequestResult
} from "../Services/serviceRequestService";
import { useShopSettings } from "../hooks/useShopSettings";

const statusSteps = [
  "Pending",
  "Accepted",
  "In Progress",
  "Completed"
] as const;

type TrackFormErrors = {
  requestNumber?: string;
  phoneNumber?: string;
};

function TrackRequestPage() {
  const { settings } = useShopSettings();
  const [searchParams] = useSearchParams();

  const requestNumberFromUrl = searchParams.get("requestNumber") ?? "";

  const phoneNumberFromUrl = searchParams.get("phoneNumber") ?? "";

  const [requestNumber, setRequestNumber] = useState(
    requestNumberFromUrl.toUpperCase()
  );

  const [phoneNumber, setPhoneNumber] = useState(phoneNumberFromUrl);

  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<TrackFormErrors>({});

  const [apiError, setApiError] = useState("");

  const [result, setResult] = useState<TrackServiceRequestResult | null>(null);

  const resultSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `Track Repair | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    if (requestNumberFromUrl) {
      setRequestNumber(requestNumberFromUrl.toUpperCase());
    }

    if (phoneNumberFromUrl) {
      setPhoneNumber(phoneNumberFromUrl);
    }
  }, [requestNumberFromUrl, phoneNumberFromUrl]);

  useEffect(() => {
    if (!result) return;

    const isMobile = window.matchMedia("(max-width: 1023px)").matches;

    if (!isMobile) return;

    const timer = window.setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [result]);

  function validateForm() {
    const errors: TrackFormErrors = {};

    if (!requestNumber.trim()) {
      errors.requestNumber = "Request number is required.";
    }

    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    } else if (phoneNumber.trim().length < 10) {
      errors.phoneNumber = "Enter at least 10 digits.";
    }

    return errors;
  }

  async function handleTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm();

    setFieldErrors(errors);
    setApiError("");

    if (Object.keys(errors).length > 0) {
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const data = await trackServiceRequest(
        requestNumber.trim(),
        phoneNumber.trim()
      );

      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError("Unable to track this repair request.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="te-sheet-bg min-h-screen text-[#1f1a12] dark:text-[#e8e3d8]">
      {/* Compact page heading */}
      <section className="te-sheet-bg border-b border-[#d8cdb6] bg-[#f7f5ef] dark:border-[#302c24] dark:bg-[#11110f]">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Repair tracking
              </p>

              <h1 className="font-display mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Track your repair request
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093] sm:text-base">
                Enter your request number and phone number to check the latest
                repair status.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/book-repair"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 text-sm font-black transition hover:border-[#c7b98e] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:bg-[#242016]"
              >
                Book new repair
              </Link>

              <a
                href="tel:8850973399"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                <PhoneIcon />
                Call shop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tracking content */}
      <section className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8 lg:py-12">
        {/* Tracking form */}
        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                <TrackIcon />
              </span>

              <div>
                <h2 className="text-lg font-black">Tracking details</h2>

                <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  Use the details provided during booking.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleTrack} noValidate>
              <div>
                <FieldLabel
                  htmlFor="request-number"
                  label="Request number"
                  required
                />

                <input
                  id="request-number"
                  type="text"
                  value={requestNumber}
                  disabled={loading}
                  placeholder="TE-2026-00001"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(fieldErrors.requestNumber)}
                  onChange={(event) => {
                    setRequestNumber(event.target.value.toUpperCase());

                    setFieldErrors((current) => ({
                      ...current,
                      requestNumber: undefined
                    }));

                    setApiError("");
                  }}
                  className={getInputClassName(
                    Boolean(fieldErrors.requestNumber)
                  )}
                />

                {fieldErrors.requestNumber && (
                  <ErrorText message={fieldErrors.requestNumber} />
                )}
              </div>

              <div>
                <FieldLabel
                  htmlFor="phone-number"
                  label="Phone number"
                  required
                />

                <input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  disabled={loading}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9999999999"
                  maxLength={15}
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                  onChange={(event) => {
                    const numbersOnly = event.target.value.replace(/\D/g, "");

                    setPhoneNumber(numbersOnly.slice(0, 15));

                    setFieldErrors((current) => ({
                      ...current,
                      phoneNumber: undefined
                    }));

                    setApiError("");
                  }}
                  className={getInputClassName(
                    Boolean(fieldErrors.phoneNumber)
                  )}
                />

                {fieldErrors.phoneNumber && (
                  <ErrorText message={fieldErrors.phoneNumber} />
                )}
              </div>

              {apiError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  <span className="mt-0.5 shrink-0">
                    <AlertIcon />
                  </span>

                  <span>{apiError}</span>
                </div>
              )}

              <ActionButton
                type="submit"
                loading={loading}
                loadingText="Tracking..."
                variant="dark"
                fullWidth
                className="h-12 cursor-pointer rounded-xl"
              >
                Track Request
              </ActionButton>
            </form>
          </div>

          {/* Compact contact card */}
          <div className="mt-4 rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
            <p className="text-sm font-black">Lost the request number?</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href="tel:8850973399"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
              >
                <PhoneIcon />
                Call
              </a>

              <a
                href="https://wa.me/918850973399?text=Hello%20Tanish%20Electronics%2C%20I%20lost%20my%20repair%20request%20number."
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                <WhatsAppIcon />
                WhatsApp
              </a>
            </div>
          </div>
        </aside>

        {/* Result */}
        <section ref={resultSectionRef} className="min-w-0 scroll-mt-24">
          {!result ? <EmptyState /> : <TrackedRequestResult result={result} />}
        </section>
      </section>
    </main>
  );
}

function TrackedRequestResult({
  result
}: {
  result: TrackServiceRequestResult;
}) {
  return (
    <article
      aria-live="polite"
      className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6"
    >
      {/* Request header */}
      <div className="flex flex-col gap-4 border-b border-[#d8cdb6] pb-5 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
            Request number
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="break-all text-2xl font-black sm:text-3xl">
              {result.requestNumber}
            </h2>

            <CopyRequestButton value={result.requestNumber} />
          </div>
        </div>

        <StatusBadge status={result.currentStatus} />
      </div>

      {/* Timeline */}
      <div className="mt-5">
        <StatusTimeline currentStatus={result.currentStatus} />
      </div>

      {/* Information */}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <DetailSection title="Request details" icon={<UserIcon />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="Customer" value={result.customerName} />

            <InfoItem label="Phone" value={result.phoneNumber} />

            <InfoItem label="Service" value={result.serviceCategory} />

            <InfoItem label="Service type" value={result.serviceType} />
          </div>
        </DetailSection>

        <DetailSection title="Device" icon={<DeviceIcon />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoItem label="Device" value={result.deviceName} />

            <InfoItem label="Brand" value={result.brand} />

            <InfoItem label="Model" value={result.modelName} />
          </div>
        </DetailSection>

        <DetailSection title="Pricing" icon={<PriceIcon />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <PriceItem
              label="Estimated price"
              value={formatPrice(result.estimatedPrice)}
            />

            <PriceItem
              label="Final price"
              value={formatPrice(result.finalPrice)}
              emphasized={
                result.finalPrice !== null && result.finalPrice !== undefined
              }
            />
          </div>

          <p className="mt-3 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
            Final price is confirmed after inspection.
          </p>
        </DetailSection>

        <DetailSection title="Timing" icon={<CalendarIcon />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoItem
              label="Preferred date"
              value={formatDateOnly(result.preferredDate)}
            />

            <InfoItem label="Preferred time" value={result.preferredTimeSlot} />

            <InfoItem
              label="Created"
              value={formatDateTime(result.createdAt)}
            />
          </div>
        </DetailSection>
      </div>

      {/* Issue */}
      <div className="mt-4 rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f] sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
          Reported problem
        </p>

        <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#1f1a12] dark:text-[#e8e3d8]">
          {result.issueDescription || "No issue description provided."}
        </p>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] px-5 py-12 text-center shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <TrackIcon large />
      </span>

      <h2 className="mt-5 text-2xl font-black">Enter your tracking details</h2>

      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Your status, device information and pricing will appear here.
      </p>

      <Link
        to="/book-repair"
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
      >
        Book New Repair
        <ArrowRightIcon />
      </Link>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  label,
  required = false
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]"
    >
      {label}

      {required && (
        <>
          <span
            aria-hidden="true"
            className="ml-1 font-black text-red-600 dark:text-red-400"
          >
            *
          </span>

          <span className="sr-only"> required</span>
        </>
      )}
    </label>
  );
}

function DetailSection({
  title,
  icon,
  children
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f] sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          {icon}
        </span>

        <h3 className="text-base font-black">{title}</h3>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-3 dark:border-[#302c24] dark:bg-[#1a1712]">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-black">
        {displayValue(value)}
      </p>
    </div>
  );
}

function PriceItem({
  label,
  value,
  emphasized = false
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        emphasized
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10"
          : "border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.1em] ${
          emphasized
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-[#817867] dark:text-[#928a7d]"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-black ${getStatusStyles(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const normalizedStatus = currentStatus.toLowerCase();

  const isCancelled =
    normalizedStatus.includes("cancelled") ||
    normalizedStatus.includes("canceled") ||
    normalizedStatus.includes("rejected");

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-400/20 dark:bg-red-400/10">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-red-600 dark:text-red-300">
            <AlertIcon />
          </span>

          <div>
            <p className="text-sm font-black text-red-700 dark:text-red-300">
              Request {currentStatus}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-red-700/80 dark:text-red-200/80">
              Contact the shop for further assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = getCurrentStatusIndex(currentStatus);

  return (
    <section className="rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-black">Repair progress</h3>

        <span className="text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
          Step {currentIndex + 1} of {statusSteps.length}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statusSteps.map((status, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;

          return (
            <div
              key={status}
              className={`relative rounded-xl border p-3 transition ${
                current
                  ? "border-[#d6b46a] bg-[#fff4cc] shadow-sm dark:border-[#d6b46a]/50 dark:bg-[#d6b46a]/10"
                  : completed
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                    : "border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${
                  current
                    ? "bg-[#8a6624] text-white dark:bg-[#d6b46a] dark:text-[#11110f]"
                    : completed
                      ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-[#11110f]"
                      : "bg-[#e6dcc9] text-[#817867] dark:bg-[#302c24] dark:text-[#a8a093]"
                }`}
              >
                {completed ? "✓" : index + 1}
              </span>

              <p className="mt-2 text-xs font-black">{status}</p>

              {current && (
                <p className="mt-1 text-[10px] font-semibold text-[#8a6624] dark:text-[#d6b46a]">
                  Current
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CopyRequestButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-8 items-center justify-center rounded-lg border border-[#d8cdb6] bg-[#fffaf0] px-3 text-[10px] font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function getInputClassName(hasError: boolean) {
  return `w-full rounded-xl border bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#8f8778] ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:border-red-400/60"
      : "border-[#d8cdb6] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:focus:border-[#d6b46a]"
  }`;
}

function getCurrentStatusIndex(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized.includes("completed") || normalized.includes("delivered")) {
    return 3;
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("repairing") ||
    normalized.includes("repair started")
  ) {
    return 2;
  }

  if (
    normalized.includes("accepted") ||
    normalized.includes("approved") ||
    normalized.includes("assigned")
  ) {
    return 1;
  }

  return 0;
}

function getStatusStyles(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("cancelled") ||
    normalized.includes("canceled") ||
    normalized.includes("rejected")
  ) {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300";
  }

  if (normalized.includes("completed") || normalized.includes("delivered")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (normalized.includes("progress") || normalized.includes("repair")) {
    return "border-[#d6b46a]/50 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";
  }

  if (normalized.includes("accepted") || normalized.includes("approved")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300";
  }

  return "border-[#d8cdb6] bg-[#fff8e7] text-[#6f4e12] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]";
}

function displayValue(value?: string | null) {
  if (!value || !value.trim()) {
    return "Not available";
  }

  return value;
}

function formatPrice(price?: number | null) {
  if (price === null || price === undefined) {
    return "To be confirmed";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}

function formatDateOnly(value?: string | null) {
  if (!value) {
    return "Not selected";
  }

  const dateValue = value.includes("T") ? value : `${value}T00:00:00`;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function TrackIcon({ large = false }: { large?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={large ? "h-7 w-7" : "h-5 w-5"}
    >
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M8.4 3.5 10 7.2 7.8 9c1.3 2.8 3.5 5 6.2 6.2l1.8-2.2 3.7 1.6v3c0 1-.8 1.9-1.9 1.9A14.1 14.1 0 0 1 4.5 6.4c0-1 .8-1.9 1.9-1.9h2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M16.04 3C9.43 3 4.05 8.38 4.05 14.99c0 2.11.55 4.17 1.6 5.99L4 29l8.25-1.62a11.9 11.9 0 0 0 5.79 1.48h.01c6.61 0 11.99-5.38 11.99-11.99S22.65 3 16.04 3Zm0 23.84h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-4.9.96.98-4.78-.24-.39a9.9 9.9 0 0 1-1.5-5.25c0-5.49 4.47-9.96 9.96-9.96S26 10.3 26 15.79s-4.47 11.05-9.96 11.05Zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.16 4.56.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M5 21a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 21h6M12 17v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 5h10M7 9h10M9 5c4 0 5 2 5 4s-1 4-5 4l6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 3v4M16 3v4M4 10h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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

export default TrackRequestPage;
