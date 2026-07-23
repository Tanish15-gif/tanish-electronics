import { useAuth } from "@clerk/clerk-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import ActionButton from "../UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import { apiClient } from "../../Services/apiClient";
import {
  createServiceRequest,
  uploadServiceRequestsImages
} from "../../Services/serviceRequestService";
import {
  getCustomerProfile,
  type CustomerAddress,
  type CustomerProfile
} from "../../Services/customerProfileService";

type QuickBookRepairModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (serviceRequestId: number) => void;
};

type ServiceType = "Home Visit" | "Shop Repair";
type TimeSlot = "Morning" | "Afternoon" | "Evening";

type LookupItem = {
  id: number;
  name: string;
};

const timeSlotOptions: DropdownOption<TimeSlot>[] = [
  {
    value: "Morning",
    label: "Morning — 9 AM to 12 PM"
  },
  {
    value: "Afternoon",
    label: "Afternoon — 12 PM to 4 PM"
  },
  {
    value: "Evening",
    label: "Evening — 4 PM to 7 PM"
  }
];

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const maximumImageSize = 5 * 1024 * 1024;
const maximumImages = 5;

function QuickBookRepairModal({
  open,
  onClose,
  onCreated
}: QuickBookRepairModalProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [categories, setCategories] = useState<LookupItem[]>([]);

  const [locations, setLocations] = useState<LookupItem[]>([]);

  const [serviceCategoryId, setServiceCategoryId] = useState(0);

  const [serviceLocationId, setServiceLocationId] = useState(0);

  const [selectedCustomerAddressId, setSelectedCustomerAddressId] = useState(0);

  const [serviceType, setServiceType] = useState<ServiceType>("Home Visit");

  const [deviceName, setDeviceName] = useState("");
  const [brand, setBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const [preferredDate, setPreferredDate] = useState("");

  const [preferredTimeSlot, setPreferredTimeSlot] = useState<TimeSlot | null>(
    null
  );

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const defaultAddress = useMemo(() => {
    return (
      profile?.addresses?.find((address) => address.isDefault) ||
      profile?.addresses?.[0] ||
      null
    );
  }, [profile]);

  const selectedAddress = useMemo(() => {
    if (!profile?.addresses?.length) {
      return null;
    }

    if (selectedCustomerAddressId > 0) {
      return (
        profile.addresses.find(
          (address) => address.customerAddressId === selectedCustomerAddressId
        ) || defaultAddress
      );
    }

    return defaultAddress;
  }, [profile, selectedCustomerAddressId, defaultAddress]);

  const categoryOptions = useMemo<DropdownOption<number>[]>(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name
      })),
    [categories]
  );

  const locationOptions = useMemo<DropdownOption<number>[]>(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: location.name
      })),
    [locations]
  );

  const addressOptions = useMemo<DropdownOption<number>[]>(
    () =>
      (profile?.addresses || []).map((address) => ({
        value: address.customerAddressId,
        label: `${
          address.label ? `${address.label} — ` : ""
        }${formatAddress(address)}${address.isDefault ? " (Default)" : ""}`
      })),
    [profile]
  );

  const minimumVisitDate = useMemo(() => {
    const today = new Date();

    const localToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60_000
    );

    return localToday.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (!open || !isLoaded || !isSignedIn) {
      return;
    }

    void loadInitialData();
  }, [open, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, saving]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const [profileData, categoryData, locationData] = await Promise.all([
        getCustomerProfile(token),

        apiClient<LookupItem[]>("/LookUps/service-categories"),

        apiClient<LookupItem[]>("/LookUps/service-locations")
      ]);

      setProfile(profileData);
      setCategories(categoryData);
      setLocations(locationData);

      const profileDefaultAddress =
        profileData.addresses?.find((address) => address.isDefault) ||
        profileData.addresses?.[0];

      setSelectedCustomerAddressId(
        profileDefaultAddress?.customerAddressId ?? 0
      );

      setServiceCategoryId(categoryData[0]?.id ?? 0);

      setServiceLocationId(locationData[0]?.id ?? 0);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load quick booking."
      );
    } finally {
      setLoading(false);
    }
  }

  function validateImages(files: File[]) {
    if (files.length > maximumImages) {
      return `Maximum ${maximumImages} images are allowed.`;
    }

    for (const file of files) {
      const lowerFileName = file.name.toLowerCase();

      const validExtension = allowedImageExtensions.some((extension) =>
        lowerFileName.endsWith(extension)
      );

      if (!allowedImageTypes.has(file.type) || !validExtension) {
        return "Only JPG, JPEG, PNG and WEBP images are allowed.";
      }

      if (file.size > maximumImageSize) {
        return "Each image must be smaller than 5MB.";
      }
    }

    return "";
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const mergedImages = [...selectedImages, ...files];

    const uniqueImages = mergedImages.filter(
      (image, index, allImages) =>
        index ===
        allImages.findIndex(
          (item) =>
            item.name === image.name &&
            item.size === image.size &&
            item.lastModified === image.lastModified
        )
    );

    const validationError = validateImages(uniqueImages);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedImages(uniqueImages);
    setError("");
  }

  function removeSelectedImage(file: File) {
    setSelectedImages((currentImages) =>
      currentImages.filter(
        (image) =>
          !(
            image.name === file.name &&
            image.size === file.size &&
            image.lastModified === file.lastModified
          )
      )
    );
  }

  function resetForm() {
    setServiceType("Home Visit");

    setServiceCategoryId(categories[0]?.id ?? 0);

    setServiceLocationId(locations[0]?.id ?? 0);

    setSelectedCustomerAddressId(defaultAddress?.customerAddressId ?? 0);

    setDeviceName("");
    setBrand("");
    setModelName("");
    setIssueDescription("");

    setPreferredDate("");
    setPreferredTimeSlot(null);

    setSelectedImages([]);

    setError("");
  }

  function handleClose() {
    if (saving) return;

    resetForm();
    setSuccess("");
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) {
      setError("Customer profile is not loaded.");
      return;
    }

    if (!profile.phoneNumber) {
      setError("Please add your phone number in your profile first.");
      return;
    }

    if (serviceCategoryId <= 0) {
      setError("Please select a service category.");
      return;
    }

    if (!issueDescription.trim()) {
      setError("Please describe the device issue.");
      return;
    }

    if (serviceType === "Home Visit" && !selectedAddress) {
      setError("Please select or add an address for the home visit.");
      return;
    }

    if (serviceType === "Home Visit" && serviceLocationId <= 0) {
      setError("Please select your service location.");
      return;
    }

    if (preferredDate && preferredDate < minimumVisitDate) {
      setError("Preferred date cannot be in the past.");
      return;
    }

    if (preferredDate && !preferredTimeSlot) {
      setError("Please select a preferred time slot.");
      return;
    }

    if (preferredTimeSlot && !preferredDate) {
      setError("Please select a preferred date.");
      return;
    }

    const imageValidationError = validateImages(selectedImages);

    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const visitAddress =
        serviceType === "Home Visit" && selectedAddress
          ? formatAddress(selectedAddress)
          : undefined;

      const result = await createServiceRequest(
        {
          customerName: profile.fullName,
          phoneNumber: profile.phoneNumber,
          email: profile.email,

          serviceCategoryId,

          serviceLocationId:
            serviceType === "Home Visit" && serviceLocationId > 0
              ? serviceLocationId
              : undefined,

          customerAddressId:
            serviceType === "Home Visit" && selectedAddress
              ? selectedAddress.customerAddressId
              : undefined,

          deviceName: deviceName.trim() || undefined,

          brand: brand.trim() || undefined,

          modelName: modelName.trim() || undefined,

          issueDescription: issueDescription.trim(),

          serviceType,
          visitAddress,

          preferredDate: preferredDate || undefined,

          preferredTimeSlot: preferredTimeSlot ?? undefined
        },
        token
      );

      if (selectedImages.length > 0) {
        await uploadServiceRequestsImages(
          result.serviceRequestId,
          selectedImages
        );
      }

      resetForm();

      if (onCreated) {
        onCreated(result.serviceRequestId);
        onClose();
      } else {
        setSuccess("Repair request created successfully.");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to book repair."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const profileReady = Boolean(
    profile && profile.isProfileCompleted && profile.phoneNumber
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-booking-title"
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#fffdf7] text-[#1f1a12] shadow-2xl dark:bg-[#1a1712] dark:text-[#e8e3d8] sm:h-auto sm:max-h-[92dvh] sm:max-w-[980px] sm:rounded-[1.75rem] sm:border sm:border-[#d8cdb6] sm:dark:border-[#302c24]"
      >
        {/* Sticky header */}
        <header className="z-30 flex shrink-0 items-start justify-between gap-4 border-b border-[#d8cdb6] bg-[#fffaf0] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#302c24] dark:bg-[#11110f] sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
              Quick booking
            </p>

            <h2
              id="quick-booking-title"
              className="font-display mt-1 text-2xl font-bold leading-tight sm:text-3xl"
            >
              Book a repair
            </h2>

            <p className="mt-1 hidden text-xs font-semibold text-[#6f6758] dark:text-[#a8a093] sm:block">
              Your saved profile details will be used automatically.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            disabled={saving}
            aria-label="Close quick booking"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] text-xl font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            ×
          </button>
        </header>

        {loading ? (
          <QuickBookingLoading />
        ) : !profileReady || !profile ? (
          <ProfileRequiredState onClose={handleClose} />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
                {/* Desktop profile panel */}
                <aside className="hidden border-r border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f] lg:block">
                  <div className="sticky top-5">
                    <ProfileSummary
                      profile={profile}
                      serviceType={serviceType}
                      selectedAddress={selectedAddress}
                    />
                  </div>
                </aside>

                {/* Main form */}
                <div className="min-w-0 p-4 sm:p-6">
                  {/* Compact mobile profile */}
                  <MobileProfileSummary
                    profile={profile}
                    serviceType={serviceType}
                    selectedAddress={selectedAddress}
                  />

                  {(error || success) && (
                    <div className="mb-5 space-y-3">
                      {error && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                        >
                          {error}
                        </div>
                      )}

                      {success && (
                        <div
                          role="status"
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                        >
                          {success}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-5">
                    <QuickSection
                      number="1"
                      title="Repair details"
                      description="Tell us what needs to be checked."
                    >
                      <div className="space-y-4">
                        <UniversalDropdown<number>
                          label="Service category"
                          options={categoryOptions}
                          value={serviceCategoryId || null}
                          onChange={setServiceCategoryId}
                          placeholder="Select service category"
                        />

                        <ServiceTypeSelector
                          value={serviceType}
                          onChange={setServiceType}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <InputField
                            label="Device name"
                            value={deviceName}
                            onChange={setDeviceName}
                            placeholder="Example: LED TV"
                          />

                          <InputField
                            label="Brand"
                            value={brand}
                            onChange={setBrand}
                            placeholder="Example: Samsung"
                          />

                          <div className="sm:col-span-2">
                            <InputField
                              label="Model number"
                              value={modelName}
                              onChange={setModelName}
                              placeholder="Example: UA32..."
                            />
                          </div>
                        </div>

                        <div>
                          <FormLabel required>Describe the issue</FormLabel>

                          <textarea
                            value={issueDescription}
                            onChange={(event) =>
                              setIssueDescription(event.target.value)
                            }
                            rows={4}
                            placeholder="Example: The TV display is black, but sound is working."
                            className="admin-input resize-none"
                          />
                        </div>
                      </div>
                    </QuickSection>

                    <QuickSection
                      number="2"
                      title="Visit preferences"
                      description="Select the address, preferred timing and add photos."
                    >
                      <div className="space-y-4">
                        {serviceType === "Home Visit" && (
                          <>
                            {addressOptions.length > 0 ? (
                              <UniversalDropdown<number>
                                label="Visit address"
                                options={addressOptions}
                                value={selectedCustomerAddressId || null}
                                onChange={setSelectedCustomerAddressId}
                                placeholder="Select visit address"
                              />
                            ) : (
                              <NoAddressWarning />
                            )}

                            <UniversalDropdown<number>
                              label="Service location"
                              options={locationOptions}
                              value={serviceLocationId || null}
                              onChange={setServiceLocationId}
                              placeholder="Select service location"
                            />
                          </>
                        )}

                        {serviceType === "Shop Repair" && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold leading-6 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300">
                            Bring the device to the shop. No home address or
                            service location is required.
                          </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <InputField
                            label="Preferred date"
                            type="date"
                            min={minimumVisitDate}
                            value={preferredDate}
                            onChange={setPreferredDate}
                          />

                          <UniversalDropdown<TimeSlot>
                            label="Preferred time"
                            options={timeSlotOptions}
                            value={preferredTimeSlot}
                            onChange={setPreferredTimeSlot}
                            placeholder="Select time slot"
                          />
                        </div>

                        <RepairImageUpload
                          images={selectedImages}
                          onChange={handleImageChange}
                          onRemove={removeSelectedImage}
                        />
                      </div>
                    </QuickSection>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <footer className="z-30 shrink-0 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_25px_rgba(0,0,0,0.08)] dark:border-[#302c24] dark:bg-[#11110f] sm:px-6 sm:py-4">
              <div className="mb-3 flex items-center justify-between gap-4 sm:mb-0">
                <Link
                  to="/book-repair"
                  onClick={handleClose}
                  className="text-xs font-black text-[#8a6624] underline-offset-4 hover:underline dark:text-[#d6b46a]"
                >
                  Open full booking form
                </Link>

                <p className="text-[11px] font-semibold text-[#817867] dark:text-[#928a7d]">
                  Fields marked * are required
                </p>
              </div>

              <div className="mt-3 grid grid-cols-[0.8fr_1.2fr] gap-3 sm:mt-0 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="h-12 rounded-xl border border-[#d8cdb6] px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:hover:bg-[#242016] sm:min-w-[110px]"
                >
                  Cancel
                </button>

                <ActionButton
                  type="submit"
                  loading={saving}
                  loadingText="Creating..."
                  variant="gold"
                  fullWidth={false}
                  className="h-12 w-full cursor-pointer rounded-xl px-5 py-0 sm:min-w-[170px]"
                >
                  Create Repair
                </ActionButton>
              </div>
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

function QuickSection({
  number,
  title,
  description,
  children
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 dark:border-[#302c24] dark:bg-[#1a1712] sm:p-5">
      <div className="flex items-start gap-3 border-b border-[#eadfca] pb-4 dark:border-[#302c24]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1f1a12] text-xs font-black text-[#f7f5ef] dark:bg-[#d6b46a] dark:text-[#11110f]">
          {number}
        </span>

        <div>
          <h3 className="text-base font-black">{title}</h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function ServiceTypeSelector({
  value,
  onChange
}: {
  value: ServiceType;
  onChange: (value: ServiceType) => void;
}) {
  return (
    <div>
      <FormLabel required>Repair type</FormLabel>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] p-1.5 dark:border-[#302c24] dark:bg-[#11110f]">
        <button
          type="button"
          aria-pressed={value === "Home Visit"}
          onClick={() => onChange("Home Visit")}
          className={`min-h-12 rounded-lg px-3 text-xs font-black transition sm:text-sm ${
            value === "Home Visit"
              ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#d6b46a] dark:text-[#11110f]"
              : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
          }`}
        >
          Home Visit
        </button>

        <button
          type="button"
          aria-pressed={value === "Shop Repair"}
          onClick={() => onChange("Shop Repair")}
          className={`min-h-12 rounded-lg px-3 text-xs font-black transition sm:text-sm ${
            value === "Shop Repair"
              ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#d6b46a] dark:text-[#11110f]"
              : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
          }`}
        >
          Shop Repair
        </button>
      </div>
    </div>
  );
}

function ProfileSummary({
  profile,
  serviceType,
  selectedAddress
}: {
  profile: CustomerProfile;
  serviceType: ServiceType;
  selectedAddress: CustomerAddress | null;
}) {
  return (
    <div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8e3d8] text-sm font-black text-[#11110f]">
        TE
      </div>

      <h3 className="mt-4 text-lg font-black">{profile.fullName}</h3>

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
        {profile.email}
      </p>

      <div className="mt-5 space-y-4">
        <InfoMini title="Phone" value={profile.phoneNumber || "Not added"} />

        <InfoMini title="Repair type" value={serviceType} />

        {serviceType === "Home Visit" && selectedAddress && (
          <InfoMini
            title="Visit address"
            value={formatAddress(selectedAddress)}
          />
        )}
      </div>

      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
        Your saved contact information will be attached to the repair request.
      </div>

      <Link
        to="/customer/profile"
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#d8cdb6] text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
      >
        Edit profile
      </Link>
    </div>
  );
}

function MobileProfileSummary({
  profile,
  serviceType,
  selectedAddress
}: {
  profile: CustomerProfile;
  serviceType: ServiceType;
  selectedAddress: CustomerAddress | null;
}) {
  return (
    <details className="mb-5 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f] lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
            Booking as
          </p>

          <p className="mt-1 truncate text-sm font-black">{profile.fullName}</p>

          <p className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
            {profile.phoneNumber}
          </p>
        </div>

        <span className="shrink-0 text-xs font-black text-[#8a6624] dark:text-[#d6b46a]">
          View details
        </span>
      </summary>

      <div className="border-t border-[#d8cdb6] p-4 dark:border-[#302c24]">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoMini title="Email" value={profile.email} />

          <InfoMini title="Repair type" value={serviceType} />

          {serviceType === "Home Visit" && selectedAddress && (
            <div className="sm:col-span-2">
              <InfoMini
                title="Visit address"
                value={formatAddress(selectedAddress)}
              />
            </div>
          )}
        </div>

        <Link
          to="/customer/profile"
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#d8cdb6] text-xs font-black dark:border-[#302c24]"
        >
          Edit profile
        </Link>
      </div>
    </details>
  );
}

function RepairImageUpload({
  images,
  onChange,
  onRemove
}: {
  images: File[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (file: File) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <FormLabel>Repair photos</FormLabel>

        <span className="text-[11px] font-bold text-[#817867] dark:text-[#928a7d]">
          {images.length}/{maximumImages}
        </span>
      </div>

      <label className="flex min-h-24 cursor-pointer items-center justify-between gap-4 rounded-xl border border-dashed border-[#c9b998] bg-[#fffaf0] p-4 transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#40392e] dark:bg-[#11110f] dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016]">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={onChange}
          className="hidden"
        />

        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            <UploadIcon />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-black">Add repair photos</p>

            <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
              JPG, PNG or WEBP · 5MB each
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-lg bg-[#1f1a12] px-3 py-2 text-xs font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]">
          Choose
        </span>
      </label>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((file) => (
            <SelectedImageCard
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              onRemove={() => onRemove(file)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectedImageCard({
  file,
  onRemove
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[#d8cdb6] bg-[#fff8e7] dark:border-[#302c24] dark:bg-[#11110f]">
      <div className="aspect-square">
        <img
          src={previewUrl}
          alt={file.name}
          className="h-full w-full object-cover"
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-black text-white backdrop-blur-sm transition hover:bg-red-700"
      >
        ×
      </button>

      <div className="p-2">
        <p title={file.name} className="truncate text-[10px] font-black">
          {file.name}
        </p>

        <p className="mt-0.5 text-[9px] font-semibold text-[#817867] dark:text-[#928a7d]">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  );
}

function ProfileRequiredState({ onClose }: { onClose: () => void }) {
  return (
    <div className="te-modal-scroll flex min-h-0 flex-1 items-center overflow-y-auto p-4 sm:p-8">
      <div className="mx-auto w-full max-w-lg rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
        <h3 className="text-2xl font-black">Complete your profile</h3>

        <p className="mt-3 text-sm font-semibold leading-6">
          Quick booking requires your name and phone number. Home visits also
          require a saved address.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            to="/customer/profile"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
          >
            Complete profile
          </Link>

          <Link
            to="/book-repair"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-amber-300 px-5 text-sm font-black dark:border-amber-400/30"
          >
            Use full form
          </Link>
        </div>
      </div>
    </div>
  );
}

function NoAddressWarning() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
      No saved address was found. Add an address in your profile or choose Shop
      Repair.
    </div>
  );
}

function QuickBookingLoading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

        <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          Preparing quick booking...
        </p>
      </div>
    </div>
  );
}

function FormLabel({
  required = false,
  children
}: {
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
      {children}

      {required && (
        <span className="ml-1 text-red-600 dark:text-red-300">*</span>
      )}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  return (
    <div>
      <FormLabel>{label}</FormLabel>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-input"
      />
    </div>
  );
}

function InfoMini({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {title}
      </p>

      <p className="mt-1 break-words text-sm font-black leading-5">{value}</p>
    </div>
  );
}

function formatAddress(address: CustomerAddress) {
  return [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 16V5m0 0L8 9m4-4 4 4M5 15v4h14v-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default QuickBookRepairModal;
