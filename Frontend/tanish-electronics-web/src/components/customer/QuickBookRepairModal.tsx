import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  ImagePlus,
  MapPin,
  Store,
  UserRound,
  Wrench,
  X
} from "lucide-react";
import { useApiAuth } from "../../hooks/useApiAuth";
import UniversalDropdown from "../UI/UniversalDropdown";
import { apiClient } from "../../Services/apiClient";
import {
  createServiceRequest,
  uploadServiceRequestsImages,
  type CreateServiceRequest,
  type ServiceRequestCreated
} from "../../Services/serviceRequestService";
import {
  getCustomerProfile,
  type CustomerAddress,
  type CustomerProfile
} from "../../Services/customerProfileService";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: number) => void;
};
type Lookup = { id: number; name: string };
type ServiceType = "Home Visit" | "Shop Repair";
type TimeSlot = "Morning" | "Afternoon" | "Evening";
const times: { value: TimeSlot; label: string }[] = [
  { value: "Morning", label: "Morning · 9 AM–12 PM" },
  { value: "Afternoon", label: "Afternoon · 12–4 PM" },
  { value: "Evening", label: "Evening · 4–7 PM" }
];
const muted = "text-[#706655] dark:text-[#b5ac9b]";
const outline = "border border-[#d8cdb6] dark:border-[#393328]";
const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b68c35]";
const secondary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-[#f2eadb] disabled:cursor-wait disabled:opacity-50 dark:hover:bg-[#282319] ${outline} ${focus}`;
const primary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#d6b46a] px-5 py-2.5 text-sm font-semibold text-[#19160f] transition hover:bg-[#e2c681] disabled:cursor-wait disabled:opacity-60 ${focus}`;
const input = `min-h-11 w-full rounded-xl bg-[#fffdf7] px-3.5 py-2.5 text-sm font-normal text-[#201c15] placeholder:text-[#827b6e] focus:border-[#b68c35] focus:outline-none focus:ring-2 focus:ring-[#d6b46a]/20 dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#a39a89] ${outline}`;

function QuickBookRepairModal({ open, onClose, onCreated }: Props) {
  const { getToken, isLoaded, isSignedIn } = useApiAuth();
  const id = useId();
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const submitting = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const savedRepair = useRef<ServiceRequestCreated | null>(null);
  const [step, setStep] = useState<"details" | "review">("details");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [locations, setLocations] = useState<Lookup[]>([]);
  const [categoryId, setCategoryId] = useState(0);
  const [locationId, setLocationId] = useState(0);
  const [addressId, setAddressId] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("Home Visit");
  const [device, setDevice] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState<TimeSlot | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<ServiceRequestCreated | null>(null);
  const [photosPending, setPhotosPending] = useState(false);
  const selectedAddress = profile?.addresses.find(
    (address) => address.customerAddressId === addressId
  );
  const profileReady = Boolean(
    profile?.fullName.trim() && profile.phoneNumber?.trim()
  );

  useEffect(() => {
    if (!open || !isLoaded) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      setError("");
      setCreated(null);
      savedRepair.current = null;
      setPhotosPending(false);
      setStep("details");
      setCategoryId(0);
      setLocationId(0);
      setDevice("");
      setBrand("");
      setModel("");
      setIssue("");
      setDate("");
      setTime(null);
      setImages([]);
      attempt.current = null;
      try {
        const token = isSignedIn ? await getToken() : null;
        if (!token)
          throw new Error("Your session has expired. Please sign in again.");
        const [customer, categoryData, locationData] = await Promise.all([
          getCustomerProfile(token),
          apiClient<Lookup[]>("/LookUps/service-categories"),
          apiClient<Lookup[]>("/LookUps/service-locations")
        ]);
        if (cancelled) return;
        setProfile(customer);
        setCategories(categoryData);
        setLocations(locationData);
        setAddressId(
          (
            customer.addresses.find((address) => address.isDefault) ??
            customer.addresses[0]
          )?.customerAddressId ?? 0
        );
        setServiceType(
          customer.addresses.length ? "Home Visit" : "Shop Repair"
        );
      } catch (cause) {
        if (!cancelled)
          setLoadError(
            errorMessage(cause, "Quick booking could not be loaded.")
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, isLoaded, isSignedIn, getToken, retry]);

  useEffect(() => {
    if (!open) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const page = document.getElementById("root");
    const wasInert = page?.inert ?? false;
    if (page) page.inert = true;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => closeButton.current?.focus());
    let dropdownWasOpen = false;
    function captureEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dropdownWasOpen = Boolean(
          dialog.current?.querySelector(
            '[role="combobox"][aria-expanded="true"]'
          )
        );
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      // Dropdowns also prevent Escape when closed; only defer if one was open.
      if (event.defaultPrevented && (event.key !== "Escape" || dropdownWasOpen))
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (!submitting.current) {
          if (savedRepair.current)
            onCreated?.(savedRepair.current.serviceRequestId);
          onClose();
        }
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const elements = Array.from(
        dialog.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
        )
      ).filter(
        (element) =>
          !element.matches(":disabled") && element.getClientRects().length > 0
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.current.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", captureEscape, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keydown", captureEscape, true);
      document.body.style.overflow = previousOverflow;
      if (page) page.inert = wasInert;
      if (opener?.isConnected) opener.focus();
    };
  }, [open, onClose, onCreated]);

  useEffect(() => {
    if (error) errorBox.current?.focus();
  }, [error]);

  function changeStep(next: "details" | "review") {
    setError("");
    setStep(next);
    requestAnimationFrame(() => {
      scroll.current?.scrollTo({ top: 0 });
      heading.current?.focus();
    });
  }
  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files ?? []);
    event.target.value = "";
    const combined = [...images, ...incoming].filter(
      (file, index, files) =>
        files.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified
        ) === index
    );
    const validation = validateImages(combined);
    if (validation) {
      setError(validation);
      return;
    }
    setImages(combined);
    setError("");
  }
  function finish(result: ServiceRequestCreated) {
    onCreated?.(result.serviceRequestId);
    onClose();
  }
  function closeModal() {
    if (submitting.current) return;
    if (savedRepair.current) onCreated?.(savedRepair.current.serviceRequestId);
    onClose();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || created || !profileReady || !profile) return;
    if (!categories.some((category) => category.id === categoryId)) {
      setError("Choose the repair category.");
      return;
    }
    if (issue.trim().length < 5 || issue.trim().length > 800) {
      setError("Describe the issue in 5–800 characters.");
      return;
    }
    if (step === "details") {
      changeStep("review");
      return;
    }
    if (serviceType === "Home Visit" && !selectedAddress) {
      setError(
        "Add a saved address in your profile, or go back and choose Shop Repair."
      );
      return;
    }
    if (
      serviceType === "Home Visit" &&
      !locations.some((location) => location.id === locationId)
    ) {
      setError("Choose the service area for your home visit.");
      return;
    }
    if (
      date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        date < localDate())
    ) {
      setError("Choose today or a future date.");
      return;
    }
    if (Boolean(date) !== Boolean(time)) {
      setError("Choose both a preferred date and time, or leave both empty.");
      return;
    }
    const imageError = validateImages(images);
    if (imageError) {
      setError(imageError);
      return;
    }
    const payload: CreateServiceRequest = {
      customerName: profile.fullName.trim(),
      phoneNumber: profile.phoneNumber!.trim(),
      email: profile.email,
      serviceCategoryId: categoryId,
      serviceType,
      issueDescription: issue.trim(),
      deviceName: device.trim() || undefined,
      brand: brand.trim() || undefined,
      modelName: model.trim() || undefined,
      serviceLocationId: serviceType === "Home Visit" ? locationId : undefined,
      customerAddressId:
        serviceType === "Home Visit"
          ? selectedAddress?.customerAddressId
          : undefined,
      visitAddress:
        serviceType === "Home Visit" && selectedAddress
          ? formatAddress(selectedAddress)
          : undefined,
      preferredDate: date || undefined,
      preferredTimeSlot: time ?? undefined
    };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token)
        throw new Error("Your session has expired. Please sign in again.");
      const result = await createServiceRequest(
        payload,
        token,
        attempt.current.key
      );
      savedRepair.current = result;
      setCreated(result);
      if (images.length) {
        try {
          await uploadServiceRequestsImages(
            result.serviceRequestId,
            images,
            result.uploadToken
          );
        } catch {
          setPhotosPending(true);
          return; // Booking succeeded. Never send another create request for a photo failure.
        }
      }
      if (onCreated) finish(result);
    } catch (cause) {
      setError(
        errorMessage(
          cause,
          "The booking could not be confirmed. Retry with the same details to check this request."
        )
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  if (!open) return null;
  const category = categories.find((item) => item.id === categoryId)?.name;
  return createPortal(
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-5"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        tabIndex={-1}
        className={`flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f9f6ee] text-[#241e14] shadow-2xl outline-none dark:bg-[#161510] dark:text-[#e8e3d8] sm:h-auto sm:max-h-[90dvh] sm:max-w-[760px] sm:rounded-3xl ${outline}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d8cdb6] bg-[#fffdf7] px-5 py-5 dark:border-[#393328] dark:bg-[#11110f] sm:px-7">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#896421] dark:text-[#d6b46a]">
              Quick booking
            </p>
            <h2
              id={`${id}-title`}
              className="text-3xl leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Book a repair
            </h2>
            <p
              id={`${id}-description`}
              className={`mt-2 text-sm leading-relaxed ${muted}`}
            >
              Tell us what needs fixing. We’ll contact you to confirm.
            </p>
          </div>
          <button
            ref={closeButton}
            type="button"
            aria-label="Close quick booking"
            disabled={saving}
            onClick={closeModal}
            className={`${secondary} !px-3`}
          >
            <X size={18} />
          </button>
        </header>
        {!loading && !loadError && profileReady && !created && (
          <ol
            aria-label="Booking steps"
            className="flex shrink-0 items-center gap-3 border-b border-[#d8cdb6] px-5 py-3 text-xs dark:border-[#393328] sm:px-7"
          >
            {(["details", "review"] as const).map((value, index) => (
              <li
                key={value}
                aria-current={step === value ? "step" : undefined}
                className={`flex items-center gap-2 ${step === value ? "font-semibold" : muted}`}
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mr-1 h-px w-6 bg-[#b6a780]/50 sm:w-12"
                  />
                )}
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${step === value ? "bg-[#d6b46a] text-[#19160f]" : "bg-[#b6a780]/15"}`}
                >
                  {step === "review" && index === 0 ? (
                    <Check size={13} />
                  ) : (
                    index + 1
                  )}
                </span>
                {index === 0 ? "Repair details" : "Visit & review"}
              </li>
            ))}
          </ol>
        )}
        <div
          ref={scroll}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6"
        >
          {loading ? (
            <div role="status" className="space-y-4 py-8">
              <p className={`text-center text-sm ${muted}`}>
                Loading your saved details…
              </p>
              <div
                aria-hidden="true"
                className="h-20 animate-pulse rounded-xl bg-[#b6a780]/10"
              />
              <div
                aria-hidden="true"
                className="h-32 animate-pulse rounded-xl bg-[#b6a780]/10"
              />
            </div>
          ) : loadError ? (
            <div className="py-8 text-center">
              <h3 className="text-lg font-semibold">
                Quick booking is unavailable
              </h3>
              <p
                role="alert"
                className={`mx-auto mt-3 max-w-md text-sm leading-relaxed ${muted}`}
              >
                {loadError}
              </p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className={`${secondary} mt-5`}
              >
                Try again
              </button>
            </div>
          ) : !profileReady ? (
            <div className="py-6 text-center">
              <UserRound className="mx-auto mb-4 text-[#a17b2f]" size={28} />
              <h3 className="text-lg font-semibold">
                Add your contact details first
              </h3>
              <p
                className={`mx-auto mt-2 max-w-sm text-sm leading-relaxed ${muted}`}
              >
                Save your name and phone number so the shop can contact you. A
                home visit also needs a saved address.
              </p>
              <Link
                to="/customer/profile"
                onClick={closeModal}
                className={`${primary} mt-5`}
              >
                Complete profile <ArrowRight size={16} />
              </Link>
            </div>
          ) : created ? (
            <div className="py-4">
              <CheckCircle2
                size={32}
                className="mb-4 text-emerald-700 dark:text-emerald-400"
              />
              <h3 className="text-xl font-semibold">Your repair is booked</h3>
              <p className={`mt-2 text-sm ${muted}`}>
                Reference{" "}
                <strong className="text-[#241e14] dark:text-[#e8e3d8]">
                  {created.requestNumber}
                </strong>
              </p>
              {photosPending && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed"
                >
                  The booking was created, but the photo upload could not be
                  confirmed. Open your repair to check the photos. If they are
                  missing, share them with the shop.
                </p>
              )}
              <p className={`mt-4 text-sm leading-relaxed ${muted}`}>
                The shop will contact you to confirm availability. Follow
                progress from your repairs.
              </p>
            </div>
          ) : (
            <form id={`${id}-form`} onSubmit={submit} noValidate>
              <fieldset
                disabled={saving}
                className="min-w-0 space-y-5 disabled:opacity-70"
              >
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fffdf7] px-4 py-3 dark:bg-[#11110f] ${outline}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <UserRound size={17} className="shrink-0 text-[#967329]" />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold">
                        {profile?.fullName}
                      </p>
                      <p className={`mt-0.5 text-xs ${muted}`}>
                        {profile?.phoneNumber} · Saved contact
                      </p>
                    </div>
                  </div>
                  {!saving && (
                    <Link
                      to="/customer/profile"
                      onClick={onClose}
                      className={`rounded px-2 py-2 text-xs font-semibold text-[#7a581b] hover:underline dark:text-[#d6b46a] ${focus}`}
                    >
                      Edit profile
                    </Link>
                  )}
                </div>
                <div>
                  <h3
                    ref={heading}
                    tabIndex={-1}
                    className="mb-4 text-base font-semibold outline-none"
                  >
                    {step === "details"
                      ? "What needs fixing?"
                      : "Check your booking"}
                  </h3>
                  {step === "details" ? (
                    <div className="space-y-5">
                      <UniversalDropdown
                        menuClassName="[font-family:var(--font-ui)] [&_button]:!font-medium"
                        label="Repair category"
                        required
                        options={categories.map((item) => ({
                          value: item.id,
                          label: item.name
                        }))}
                        value={categoryId || null}
                        onChange={setCategoryId}
                        placeholder="Choose a category"
                      />
                      {categories.length === 0 && (
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                          No repair categories are available. Please contact the
                          shop.
                        </p>
                      )}
                      <fieldset>
                        <legend className="mb-2 text-sm font-medium">
                          How would you like it repaired?
                        </legend>
                        <div className="grid grid-cols-2 gap-3">
                          {(["Home Visit", "Shop Repair"] as const).map(
                            (value) => {
                              const Icon =
                                value === "Home Visit" ? MapPin : Store;
                              return (
                                <label
                                  key={value}
                                  className={`relative flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition focus-within:ring-2 focus-within:ring-[#b68c35] ${serviceType === value ? "border-[#ae842e] bg-[#d6b46a]/15" : "border-[#d8cdb6] bg-[#fffdf7] dark:border-[#393328] dark:bg-[#11110f]"}`}
                                >
                                  <input
                                    type="radio"
                                    name={`${id}-type`}
                                    value={value}
                                    checked={serviceType === value}
                                    onChange={() => setServiceType(value)}
                                    className="sr-only"
                                  />
                                  <Icon
                                    aria-hidden="true"
                                    size={18}
                                    className="mt-0.5 shrink-0 text-[#967329] dark:text-[#d6b46a]"
                                  />
                                  <span>
                                    <span className="block text-sm font-semibold">
                                      {value}
                                    </span>
                                    <span
                                      className={`mt-1 block text-xs leading-relaxed ${muted}`}
                                    >
                                      {value === "Home Visit"
                                        ? "A technician comes to you"
                                        : "Bring your device to the shop"}
                                    </span>
                                  </span>
                                </label>
                              );
                            }
                          )}
                        </div>
                      </fieldset>
                      <Field
                        label="Device name"
                        htmlFor={`${id}-device`}
                        optional
                      >
                        <input
                          id={`${id}-device`}
                          value={device}
                          onChange={(event) => setDevice(event.target.value)}
                          maxLength={120}
                          placeholder="e.g. Samsung 43-inch TV"
                          className={input}
                        />
                      </Field>
                      <Field
                        label="Describe the issue"
                        htmlFor={`${id}-issue`}
                        required
                      >
                        <textarea
                          id={`${id}-issue`}
                          required
                          minLength={5}
                          maxLength={800}
                          value={issue}
                          onChange={(event) => setIssue(event.target.value)}
                          rows={3}
                          placeholder="What happens when you use the device?"
                          aria-describedby={`${id}-issue-hint`}
                          className={`${input} resize-y`}
                        />
                        <p
                          id={`${id}-issue-hint`}
                          className={`mt-1.5 flex justify-between gap-3 text-xs ${muted}`}
                        >
                          <span>
                            Include symptoms, such as lines on the screen or no
                            sound.
                          </span>
                          <span className="shrink-0">{issue.length}/800</span>
                        </p>
                      </Field>
                      <details className={`rounded-xl ${outline}`}>
                        <summary
                          className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-medium ${focus}`}
                        >
                          Add brand, model or photos{" "}
                          <span className={`font-normal ${muted}`}>
                            (optional
                            {images.length ? ` · ${images.length} photos` : ""})
                          </span>
                        </summary>
                        <div className="space-y-4 border-t border-[#d8cdb6] p-4 dark:border-[#393328]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Brand" htmlFor={`${id}-brand`}>
                              <input
                                id={`${id}-brand`}
                                value={brand}
                                onChange={(event) =>
                                  setBrand(event.target.value)
                                }
                                maxLength={100}
                                placeholder="e.g. Samsung"
                                className={input}
                              />
                            </Field>
                            <Field label="Model number" htmlFor={`${id}-model`}>
                              <input
                                id={`${id}-model`}
                                value={model}
                                onChange={(event) =>
                                  setModel(event.target.value)
                                }
                                maxLength={100}
                                placeholder="e.g. UA43…"
                                className={input}
                              />
                            </Field>
                          </div>
                          <div>
                            <label
                              htmlFor={`${id}-photos`}
                              className="mb-2 flex items-center gap-2 text-sm font-medium"
                            >
                              <ImagePlus size={16} />
                              Photos of the issue
                            </label>
                            <input
                              id={`${id}-photos`}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                              multiple
                              onChange={addImages}
                              aria-describedby={`${id}-photos-hint`}
                              className={`block w-full rounded-lg text-xs file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border file:border-[#b6a780]/40 file:bg-transparent file:px-3 file:font-medium file:text-inherit ${focus}`}
                            />
                            <p
                              id={`${id}-photos-hint`}
                              className={`mt-2 text-xs ${muted}`}
                            >
                              Up to 5 JPG, PNG or WebP images, 5 MB each.
                            </p>
                          </div>
                          {images.length > 0 && (
                            <ul className="grid gap-2 sm:grid-cols-2">
                              {images.map((file, index) => (
                                <Photo
                                  key={`${file.name}-${file.lastModified}`}
                                  file={file}
                                  onRemove={() =>
                                    setImages((current) =>
                                      current.filter(
                                        (_, position) => position !== index
                                      )
                                    )
                                  }
                                />
                              ))}
                            </ul>
                          )}
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div
                        className={`rounded-xl bg-[#fffdf7] p-4 dark:bg-[#11110f] ${outline}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="flex items-center gap-2 text-sm font-semibold">
                              <Wrench
                                size={15}
                                className="text-[#967329] dark:text-[#d6b46a]"
                              />
                              {category} · {serviceType}
                            </p>
                            {(device || brand || model) && (
                              <p
                                className={`mt-2 break-words text-sm ${muted}`}
                              >
                                {[device.trim(), brand.trim(), model.trim()]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => changeStep("details")}
                            className={`shrink-0 rounded px-2 py-2 text-xs font-semibold text-[#7a581b] hover:underline dark:text-[#d6b46a] ${focus}`}
                          >
                            Edit
                          </button>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {issue.trim()}
                        </p>
                        {images.length > 0 && (
                          <p className={`mt-3 text-xs ${muted}`}>
                            {images.length}{" "}
                            {images.length === 1 ? "photo" : "photos"} attached
                          </p>
                        )}
                      </div>
                      {serviceType === "Home Visit" ? (
                        <div className="space-y-4">
                          <UniversalDropdown
                            menuClassName="[font-family:var(--font-ui)] [&_button]:!font-medium"
                            label="Visit address"
                            required
                            options={(profile?.addresses ?? []).map(
                              (address) => ({
                                value: address.customerAddressId,
                                label: `${address.label ? `${address.label} · ` : ""}${formatAddress(address)}`
                              })
                            )}
                            value={addressId || null}
                            onChange={setAddressId}
                            placeholder="Choose a saved address"
                          />
                          {selectedAddress ? (
                            <p
                              className={`-mt-2 break-words text-xs leading-relaxed ${muted}`}
                            >
                              {formatAddress(selectedAddress)}
                            </p>
                          ) : (
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              Save an address in{" "}
                              <Link
                                to="/customer/profile"
                                onClick={onClose}
                                className="font-semibold underline"
                              >
                                your profile
                              </Link>
                              , or go back and choose Shop Repair.
                            </p>
                          )}
                          <UniversalDropdown
                            menuClassName="[font-family:var(--font-ui)] [&_button]:!font-medium"
                            label="Service area"
                            required
                            options={locations.map((item) => ({
                              value: item.id,
                              label: item.name
                            }))}
                            value={locationId || null}
                            onChange={setLocationId}
                            placeholder="Choose the area for this visit"
                          />
                          <p className={`-mt-2 text-xs ${muted}`}>
                            Choose the area that matches your visit address.
                          </p>
                        </div>
                      ) : (
                        <p className="flex items-start gap-3 rounded-xl bg-[#d6b46a]/10 p-4 text-sm leading-relaxed">
                          <Store
                            size={19}
                            className="mt-0.5 shrink-0 text-[#967329] dark:text-[#d6b46a]"
                          />
                          Bring your device to the shop after the team confirms
                          your request. No visit address is needed.
                        </p>
                      )}
                      <details className={`rounded-xl ${outline}`}>
                        <summary
                          className={`cursor-pointer rounded-xl px-4 py-3 text-sm font-medium ${focus}`}
                        >
                          Preferred date & time{" "}
                          <span className={`font-normal ${muted}`}>
                            (
                            {date
                              ? `${date}${time ? ` · ${time}` : ""}`
                              : "optional"}
                            )
                          </span>
                        </summary>
                        <div className="space-y-3 border-t border-[#d8cdb6] p-4 dark:border-[#393328]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label="Preferred date"
                              htmlFor={`${id}-date`}
                            >
                              <input
                                id={`${id}-date`}
                                type="date"
                                min={localDate()}
                                value={date}
                                onChange={(event) =>
                                  setDate(event.target.value)
                                }
                                className={`${input} [color-scheme:light] dark:[color-scheme:dark]`}
                              />
                            </Field>
                            <UniversalDropdown
                              menuClassName="[font-family:var(--font-ui)] [&_button]:!font-medium"
                              label="Preferred time"
                              options={times}
                              value={time}
                              onChange={setTime}
                              placeholder="Choose a time slot"
                            />
                          </div>
                          <p
                            className={`flex items-start gap-2 text-xs leading-relaxed ${muted}`}
                          >
                            <Clock3 size={14} className="shrink-0" />
                            This is a preference. The shop will confirm
                            availability.
                          </p>
                          {(date || time) && (
                            <button
                              type="button"
                              onClick={() => {
                                setDate("");
                                setTime(null);
                              }}
                              className={`min-h-11 rounded px-2 text-xs font-medium underline ${focus}`}
                            >
                              Clear preference
                            </button>
                          )}
                        </div>
                      </details>
                      <p className={`text-xs leading-relaxed ${muted}`}>
                        Your saved contact details will be attached. No online
                        payment is required.
                      </p>
                    </div>
                  )}
                </div>
                {error && (
                  <div
                    ref={errorBox}
                    tabIndex={-1}
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm leading-relaxed text-red-800 outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300"
                  >
                    {error}
                  </div>
                )}
              </fieldset>
            </form>
          )}
        </div>
        <footer className="shrink-0 border-t border-[#d8cdb6] bg-[#fffdf7] px-5 py-4 dark:border-[#393328] dark:bg-[#11110f] sm:px-7">
          {created ? (
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={closeModal}
                className={secondary}
              >
                Close
              </button>
              {saving ? (
                <button
                  type="button"
                  disabled
                  className={primary}
                  aria-busy="true"
                >
                  Uploading photos…
                </button>
              ) : (
                <Link
                  to={`/customer/repairs/${created.serviceRequestId}`}
                  onClick={() => finish(created)}
                  className={primary}
                >
                  View repair <ArrowRight size={16} />
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              {!saving && (
                <Link
                  to="/book-repair"
                  onClick={onClose}
                  className={`rounded py-2 text-xs font-medium text-[#7a581b] hover:underline dark:text-[#d6b46a] ${focus}`}
                >
                  Open full booking form
                </Link>
              )}
              <div className="flex w-full gap-3 sm:ml-auto sm:w-auto">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    step === "review" && !loadError
                      ? changeStep("details")
                      : onClose()
                  }
                  className={`${secondary} flex-1 sm:flex-none`}
                >
                  {step === "review" && !loadError ? (
                    <>
                      <ArrowLeft size={15} />
                      Back
                    </>
                  ) : (
                    "Cancel"
                  )}
                </button>
                {!loadError && profileReady && !loading && (
                  <button
                    type="submit"
                    form={`${id}-form`}
                    disabled={saving || categories.length === 0}
                    className={`${primary} flex-1 sm:flex-none`}
                    aria-busy={saving}
                  >
                    {saving
                      ? "Booking…"
                      : step === "details"
                        ? "Continue"
                        : "Confirm booking"}
                    {!saving &&
                      (step === "details" ? (
                        <ArrowRight size={16} />
                      ) : (
                        <Check size={16} />
                      ))}
                  </button>
                )}
              </div>
            </div>
          )}
        </footer>
      </section>
    </div>,
    document.body
  );
}

function Field({
  label,
  htmlFor,
  optional,
  required,
  children
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium">
        {label}
        {required && (
          <>
            <span
              aria-hidden="true"
              className="ml-1 text-red-700 dark:text-red-300"
            >
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        )}
        {optional && (
          <span className={`ml-1 font-normal ${muted}`}>(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}
function Photo({ file, onRemove }: { file: File; onRemove: () => void }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <li
      className={`flex min-w-0 items-center gap-2 rounded-xl bg-[#fffdf7] p-2 dark:bg-[#11110f] ${outline}`}
    >
      <img
        ref={image}
        alt=""
        className="h-11 w-11 shrink-0 rounded-lg object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium" title={file.name}>
          {file.name}
        </span>
        <span className={`mt-1 block text-[11px] ${muted}`}>
          {(file.size / 1024 / 1024).toFixed(1)} MB
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-red-500/10 ${focus}`}
      >
        <X size={16} />
      </button>
    </li>
  );
}
function validateImages(files: File[]) {
  if (files.length > 5) return "Choose up to 5 photos.";
  for (const file of files) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    )
      return "Use JPG, PNG or WebP photos.";
    if (file.size > 5 * 1024 * 1024)
      return `“${file.name}” is too large. Each photo must be 5 MB or smaller.`;
    if (file.size === 0)
      return `“${file.name}” is empty. Choose another photo.`;
  }
  return "";
}
function formatAddress(address: CustomerAddress) {
  return [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}
function localDate() {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}
function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
export default QuickBookRepairModal;
