import { useCustomAuth } from "../../contexts/CustomAuthContext";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  Home,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  X
} from "lucide-react";

import ActionButton from "../../components/UI/ActionButton";
import {
  addCustomerAddress,
  deleteCustomerAddress,
  getCustomerProfile,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  updateCustomerProfile,
  type CustomerAddress,
  type CustomerProfile
} from "../../Services/customerProfileService";
import { useApiAuth } from "../../hooks/useApiAuth";

type AddressFormState = {
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const emptyAddressForm: AddressFormState = {
  label: "Home",
  addressLine: "",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "",
  isDefault: false
};

function CustomerProfilePage() {
  const { getToken } = useApiAuth();
  const { user } = useCustomAuth();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  const [savingAddress, setSavingAddress] = useState(false);

  const [addressActionId, setAddressActionId] = useState<number | null>(null);

  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(
    null
  );

  const [addressForm, setAddressForm] =
    useState<AddressFormState>(emptyAddressForm);

  const [deleteTarget, setDeleteTarget] = useState<CustomerAddress | null>(
    null
  );

  const [profileError, setProfileError] = useState("");

  const [addressError, setAddressError] = useState("");

  const [pageError, setPageError] = useState("");

  const [success, setSuccess] = useState("");

  const profileImageUrl =
    profile?.profileImageUrl ?? user?.profileImageUrl ?? null;

  const applyProfile = useCallback((data: CustomerProfile) => {
    setProfile(data);
    setFullName(data.fullName ?? "");
    setPhoneNumber(data.phoneNumber ?? "");
  }, []);

  const loadProfile = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
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

        const data = await getCustomerProfile(token);

        applyProfile(data);
      } catch (error) {
        setPageError(
          error instanceof Error ? error.message : "Failed to load profile."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, applyProfile]
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "My Profile";

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

  const modalOpen = addressModalOpen || Boolean(deleteTarget);

  useEffect(() => {
    if (!modalOpen) return;

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
      if (event.key !== "Escape") return;

      if (savingAddress || addressActionId !== null) {
        return;
      }

      setAddressModalOpen(false);
      setDeleteTarget(null);
      setAddressError("");
    }

    document.addEventListener("keydown", handleKeyDown);

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
  }, [modalOpen, savingAddress, addressActionId]);

  const displayName =
    profile?.fullName?.trim() || user?.fullName?.trim() || "Customer Account";

  const displayEmail = profile?.email || user?.email || "Signed-in customer";

  const initials = useMemo(() => {
    const values = displayName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (values.length === 0) {
      return "CU";
    }

    return values
      .map((value) => value.charAt(0))
      .join("")
      .toUpperCase();
  }, [displayName]);

  const defaultAddress = useMemo(
    () => profile?.addresses.find((address) => address.isDefault) ?? null,
    [profile]
  );

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;

    let percentage = 0;

    if (profile.fullName?.trim()) {
      percentage += 30;
    }

    if (profile.phoneNumber?.trim()) {
      percentage += 30;
    }

    if (profile.email?.trim()) {
      percentage += 20;
    }

    if (profile.addresses.length > 0) {
      percentage += 20;
    }

    return percentage;
  }, [profile]);

  async function refreshProfileData(token: string) {
    const refreshed = await getCustomerProfile(token);

    applyProfile(refreshed);
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.replace(/\D/g, "");

    if (!trimmedName) {
      setProfileError("Full name is required.");

      return;
    }

    if (trimmedPhone.length < 10 || trimmedPhone.length > 15) {
      setProfileError("Enter a valid phone number between 10 and 15 digits.");

      return;
    }

    try {
      setSavingProfile(true);
      setProfileError("");
      setPageError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        setProfileError("Your session has expired. Please sign in again.");

        return;
      }

      const updated = await updateCustomerProfile(
        {
          fullName: trimmedName,
          phoneNumber: trimmedPhone
        },
        token
      );

      applyProfile(updated);
      setSuccess("Profile details updated successfully.");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function openAddAddress() {
    const shouldBeDefault = !profile || profile.addresses.length === 0;

    setEditingAddress(null);

    setAddressForm({
      ...emptyAddressForm,
      isDefault: shouldBeDefault
    });

    setAddressError("");
    setAddressModalOpen(true);
  }

  function openEditAddress(address: CustomerAddress) {
    setEditingAddress(address);

    setAddressForm({
      label: address.label || "Home",
      addressLine: address.addressLine || "",
      city: address.city || "Mumbai",
      state: address.state || "Maharashtra",
      pincode: address.pincode || "",
      isDefault: address.isDefault
    });

    setAddressError("");
    setAddressModalOpen(true);
  }

  function closeAddressModal() {
    if (savingAddress) return;

    setAddressModalOpen(false);
    setEditingAddress(null);
    setAddressError("");
  }

  function updateAddressField<Key extends keyof AddressFormState>(
    key: Key,
    value: AddressFormState[Key]
  ) {
    setAddressForm((current) => ({
      ...current,
      [key]: value
    }));

    setAddressError("");
  }

  async function handleSaveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedLabel = addressForm.label.trim();

    const trimmedAddress = addressForm.addressLine.trim();

    const trimmedCity = addressForm.city.trim();

    const trimmedState = addressForm.state.trim();

    const trimmedPincode = addressForm.pincode.replace(/\D/g, "");

    if (!trimmedLabel) {
      setAddressError("Address label is required.");

      return;
    }

    if (trimmedAddress.length < 5) {
      setAddressError("Enter a complete address.");

      return;
    }

    if (!trimmedCity) {
      setAddressError("City is required.");
      return;
    }

    if (!trimmedState) {
      setAddressError("State is required.");
      return;
    }

    if (trimmedPincode.length !== 6) {
      setAddressError("Enter a valid 6-digit pincode.");

      return;
    }

    try {
      setSavingAddress(true);
      setAddressError("");
      setPageError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        setAddressError("Your session has expired. Please sign in again.");

        return;
      }

      const payload = {
        label: trimmedLabel,
        addressLine: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
        isDefault: addressForm.isDefault
      };

      if (editingAddress) {
        await updateCustomerAddress(
          editingAddress.customerAddressId,
          payload,
          token
        );
      } else {
        await addCustomerAddress(payload, token);
      }

      await refreshProfileData(token);

      setAddressModalOpen(false);
      setEditingAddress(null);

      setSuccess(
        editingAddress
          ? "Address updated successfully."
          : "Address added successfully."
      );
    } catch (error) {
      setAddressError(
        error instanceof Error ? error.message : "Failed to save address."
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSetDefault(addressId: number) {
    try {
      setAddressActionId(addressId);
      setPageError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        setPageError("Your session has expired. Please sign in again.");

        return;
      }

      await setDefaultCustomerAddress(addressId, token);

      await refreshProfileData(token);

      setSuccess("Default address updated successfully.");
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to update default address."
      );
    } finally {
      setAddressActionId(null);
    }
  }

  async function handleDeleteAddress() {
    if (!deleteTarget) return;

    try {
      setAddressActionId(deleteTarget.customerAddressId);

      setPageError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        setPageError("Your session has expired. Please sign in again.");

        return;
      }

      await deleteCustomerAddress(deleteTarget.customerAddressId, token);

      await refreshProfileData(token);

      setDeleteTarget(null);

      setSuccess("Address deleted successfully.");
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Failed to delete address."
      );
    } finally {
      setAddressActionId(null);
    }
  }

  if (loading) {
    return <ProfileLoadingState />;
  }

  if (!profile) {
    return (
      <ProfileErrorState
        message={pageError || "Profile not found."}
        onRetry={() => void loadProfile()}
      />
    );
  }

  return (
    <main
      className="te-sheet-bg mx-auto min-h-full w-full max-w-7xl px-4 py-6 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <CustomerProfileHero
        profile={profile}
        displayName={displayName}
        displayEmail={displayEmail}
        profileImageUrl={profileImageUrl}
        initials={initials}
        completionPercentage={completionPercentage}
        defaultAddress={defaultAddress}
        refreshing={refreshing}
        onRefresh={() => void loadProfile(true)}
      />

      <div aria-live="polite" className="mt-5 space-y-3">
        {pageError && <MessageBox type="error" message={pageError} />}
        {success && <MessageBox type="success" message={success} />}
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24">
          <ProfileCompletionCard
            percentage={completionPercentage}
            hasName={Boolean(profile.fullName?.trim())}
            hasPhone={Boolean(profile.phoneNumber?.trim())}
            hasEmail={Boolean(profile.email?.trim())}
            hasAddress={profile.addresses.length > 0}
          />

          <ContactInformationCard
            email={displayEmail}
            phone={profile.phoneNumber || "Not added"}
          />

          <DefaultAddressCard address={defaultAddress} />
        </aside>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-7">
              <SectionHeading
                eyebrow="Customer identity"
                title="Personal details"
                description="Information used for repair bookings, service updates and shop contact."
                icon={<UserRound className="h-5 w-5" />}
              />
            </div>

            <form
              className="p-5 sm:p-7"
              onSubmit={handleSaveProfile}
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  id="profile-full-name"
                  label="Full name"
                  value={fullName}
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  disabled={savingProfile}
                  required
                  icon={<UserRound className="h-4 w-4" />}
                  onChange={(value) => {
                    setFullName(value);
                    setProfileError("");
                  }}
                />

                <TextField
                  id="profile-phone"
                  label="Phone number"
                  value={phoneNumber}
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="9999999999"
                  disabled={savingProfile}
                  required
                  icon={<Phone className="h-4 w-4" />}
                  onChange={(value) => {
                    setPhoneNumber(value.replace(/\D/g, "").slice(0, 15));
                    setProfileError("");
                  }}
                />

                <div className="sm:col-span-2">
                  <ReadOnlyIdentityField
                    label="Account email"
                    value={displayEmail}
                    icon={<Mail className="h-4 w-4" />}
                    status="Signed-in identity"
                  />
                </div>
              </div>

              {profileError && (
                <div className="mt-5">
                  <MessageBox type="error" message={profileError} />
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-xs font-bold">Account-managed email</p>

                    <p className="mt-1 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                      Your email is tied to the authenticated account and cannot
                      be changed from this customer profile form.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <ActionButton
                  type="submit"
                  loading={savingProfile}
                  spinnerOnly
                  variant="dark"
                  fullWidth={false}
                  className="min-h-12 w-full sm:min-w-[190px] sm:w-auto"
                >
                  Save profile
                </ActionButton>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="flex flex-col gap-5 border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <SectionHeading
                eyebrow="Home-visit details"
                title="Address book"
                description="Save trusted addresses for faster repair and home-visit bookings."
                icon={<MapPin className="h-5 w-5" />}
              />

              <ActionButton
                type="button"
                onClick={openAddAddress}
                fullWidth={false}
                variant="dark"
                className="min-h-11 w-full shrink-0 !rounded-xl !px-5 !py-3 sm:w-auto"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add address
                </span>
              </ActionButton>
            </div>

            <div className="p-5 sm:p-7">
              {profile.addresses.length === 0 ? (
                <AddressEmptyState onAdd={openAddAddress} />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {profile.addresses.map((address) => (
                    <AddressCard
                      key={address.customerAddressId}
                      address={address}
                      busy={addressActionId === address.customerAddressId}
                      onEdit={() => openEditAddress(address)}
                      onSetDefault={() =>
                        void handleSetDefault(address.customerAddressId)
                      }
                      onDelete={() => setDeleteTarget(address)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {addressModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <AddressModal
            editing={Boolean(editingAddress)}
            form={addressForm}
            saving={savingAddress}
            error={addressError}
            onChange={updateAddressField}
            onClose={closeAddressModal}
            onSubmit={handleSaveAddress}
          />,
          document.body
        )}

      {deleteTarget &&
        typeof document !== "undefined" &&
        createPortal(
          <DeleteAddressModal
            address={deleteTarget}
            deleting={addressActionId === deleteTarget.customerAddressId}
            onCancel={() => {
              if (addressActionId !== null) {
                return;
              }

              setDeleteTarget(null);
            }}
            onConfirm={() => void handleDeleteAddress()}
          />,
          document.body
        )}
    </main>
  );
}

function CustomerProfileHero({
  profile,
  displayName,
  displayEmail,
  profileImageUrl,
  initials,
  completionPercentage,
  defaultAddress,
  refreshing,
  onRefresh
}: {
  profile: CustomerProfile;
  displayName: string;
  displayEmail: string;
  profileImageUrl?: string | null;
  initials: string;
  completionPercentage: number;
  defaultAddress: CustomerAddress | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[#302c24] bg-[#1f1a12] p-6 text-[#f7f5ef] shadow-[0_24px_70px_-36px_rgba(17,16,15,0.75)] sm:p-8 lg:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "linear-gradient(to right, black, transparent 74%)"
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[#d6b46a]/12 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar
            imageUrl={profileImageUrl}
            name={displayName}
            initials={initials}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
                Customer profile
              </p>

              <ProfileStatusBadge completed={profile.isProfileCompleted} />
            </div>

            <h1 className="font-display mt-3 truncate text-4xl font-semibold leading-none sm:text-5xl">
              {displayName}
            </h1>

            <p className="mt-4 break-all text-sm font-medium text-[#c8bead]">
              {displayEmail}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[610px]">
          <div className="grid gap-3 sm:grid-cols-3">
            <HeroMetric
              label="Profile readiness"
              value={`${completionPercentage}% complete`}
              icon={<UserRound className="h-4 w-4" />}
            />

            <HeroMetric
              label="Saved addresses"
              value={`${profile.addresses.length} saved`}
              icon={<MapPin className="h-4 w-4" />}
            />

            <HeroMetric
              label="Default address"
              value={defaultAddress ? "Available" : "Missing"}
              icon={<Home className="h-4 w-4" />}
            />
          </div>

          <div className="flex justify-end">
            <ActionButton
              type="button"
              onClick={onRefresh}
              loading={refreshing}
              spinnerOnly
              fullWidth={false}
              variant="light"
              className="min-h-11 !rounded-xl !px-4 !py-2.5"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh profile
              </span>
            </ActionButton>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileAvatar({
  imageUrl,
  name,
  initials
}: {
  imageUrl?: string | null;
  name: string;
  initials: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const showImage = Boolean(imageUrl?.trim()) && !imageFailed;

  return (
    <div className="relative shrink-0">
      <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17130e] text-2xl font-bold text-[#f7f5ef] shadow-lg sm:h-28 sm:w-28">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={`${name} profile`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          initials
        )}
      </span>

      <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#1f1a12] bg-emerald-500 text-white">
        <Check className="h-4 w-4" />
      </span>
    </div>
  );
}

function ProfileStatusBadge({ completed }: { completed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
        completed
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
          : "border-amber-300/20 bg-amber-400/10 text-amber-300"
      }`}
    >
      {completed ? (
        <BadgeCheck className="h-3.5 w-3.5" />
      ) : (
        <UserRound className="h-3.5 w-3.5" />
      )}

      {completed ? "Profile complete" : "Profile incomplete"}
    </span>
  );
}

function HeroMetric({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#17130e]/85 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-[#d6b46a]">
        {icon}

        <p className="text-[10px] font-bold uppercase tracking-[0.11em]">
          {label}
        </p>
      </div>

      <p className="mt-3 truncate text-sm font-bold text-[#f7f5ef]">{value}</p>
    </div>
  );
}

function ProfileCompletionCard({
  percentage,
  hasName,
  hasPhone,
  hasEmail,
  hasAddress
}: {
  percentage: number;
  hasName: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasAddress: boolean;
}) {
  const items = [
    { label: "Full name", completed: hasName },
    { label: "Phone number", completed: hasPhone },
    { label: "Account email", completed: hasEmail },
    { label: "Saved address", completed: hasAddress }
  ];

  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
            Profile readiness
          </p>

          <h2 className="font-display mt-1.5 text-2xl font-semibold leading-none">
            {percentage}% complete
          </h2>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          <UserRound className="h-5 w-5" />
        </span>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-[#eee6d7] dark:bg-[#242016]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-[#8a6624] transition-[width] duration-500 dark:bg-[#d6b46a]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
              {item.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                item.completed
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-[#928a7d]"
              }`}
            >
              {item.completed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Added
                </>
              ) : (
                "Missing"
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactInformationCard({
  email,
  phone
}: {
  email: string;
  phone: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <SectionHeading
        eyebrow="Contact methods"
        title="Contact information"
        description="Details the shop can use for service updates."
        icon={<Mail className="h-5 w-5" />}
        compact
      />

      <div className="mt-6 divide-y divide-[#e4dbc9] overflow-hidden rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] dark:divide-[#302c24] dark:border-[#302c24] dark:bg-[#11110f]">
        <ContactRow
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={email}
        />

        <ContactRow
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={phone}
        />
      </div>
    </section>
  );
}

function DefaultAddressCard({ address }: { address: CustomerAddress | null }) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          <Navigation className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
            Booking preference
          </p>

          <h2 className="font-display mt-1.5 text-xl font-semibold leading-none">
            Default address
          </h2>
        </div>
      </div>

      {address ? (
        <div className="mt-5 rounded-2xl border border-[#d6b46a]/35 bg-[#fff8e7] p-4 dark:border-[#d6b46a]/20 dark:bg-[#d6b46a]/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">
              {address.label || "Default address"}
            </p>

            <span className="rounded-full bg-[#fff4cc] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#765313] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              Default
            </span>
          </div>

          <p className="mt-2 break-words text-xs font-medium leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {formatAddress(address)}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#d8cdb6] bg-[#fffaf0] p-4 text-center dark:border-[#302c24] dark:bg-[#11110f]">
          <MapPin className="mx-auto h-5 w-5 text-[#8a6624] dark:text-[#d6b46a]" />

          <p className="mt-3 text-xs font-bold">No default address selected</p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
            Add or mark an address as default for quicker booking.
          </p>
        </div>
      )}
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  compact = false
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a] ${
          compact ? "h-10 w-10" : "h-11 w-11"
        }`}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
          {eyebrow}
        </p>

        <h2
          className={`font-display mt-1.5 font-semibold leading-none ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          {title}
        </h2>

        <p className="mt-2 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#817867] dark:text-[#928a7d]">
          {label}
        </p>

        <p className="mt-1 break-words text-xs font-bold">{value}</p>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  type,
  autoComplete,
  inputMode,
  maxLength,
  placeholder,
  disabled,
  required,
  icon,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  type: "text" | "tel";
  autoComplete: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  placeholder: string;
  disabled: boolean;
  required?: boolean;
  icon: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        {label}

        {required && (
          <span className="ml-1 text-red-600 dark:text-red-400">*</span>
        )}
      </span>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-[#817867] dark:text-[#928a7d]">
          {icon}
        </span>

        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="admin-input h-12 pl-11"
        />
      </div>
    </label>
  );
}

function ReadOnlyIdentityField({
  label,
  value,
  icon,
  status
}: {
  label: string;
  value: string;
  icon: ReactNode;
  status: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        {label}
      </p>

      <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] px-4 py-3 dark:border-[#302c24] dark:bg-[#11110f]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-all text-sm font-bold">{value}</p>

          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
            {status}
          </p>
        </div>

        <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
      </div>
    </div>
  );
}

function AddressCard({
  address,
  busy,
  onEdit,
  onSetDefault,
  onDelete
}: {
  address: CustomerAddress;
  busy: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border bg-[#fffaf0] p-5 transition dark:bg-[#11110f] ${
        address.isDefault
          ? "border-[#d6b46a]/70 shadow-sm dark:border-[#d6b46a]/40"
          : "border-[#e4dbc9] hover:border-[#c7b98e] dark:border-[#302c24] dark:hover:border-[#50483b]"
      }`}
    >
      {address.isDefault && (
        <div className="absolute inset-x-0 top-0 h-1 bg-[#d6b46a]" />
      )}

      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          {getAddressIcon(address.label)}
        </span>

        {address.isDefault && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d6b46a]/35 bg-[#fff4cc] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#765313] dark:border-[#d6b46a]/20 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Default
          </span>
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold">
        {address.label || "Saved address"}
      </h3>

      <p className="mt-2 break-words text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {formatAddress(address)}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-6">
        <button
          type="button"
          disabled={busy}
          onClick={onEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-3.5 text-xs font-bold transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>

        {!address.isDefault && (
          <ActionButton
            type="button"
            onClick={onSetDefault}
            loading={busy}
            spinnerOnly
            disabled={busy}
            fullWidth={false}
            variant="outline"
            className="!min-h-10 !rounded-xl !px-3.5 !py-2 !text-xs"
          >
            Make default
          </ActionButton>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}

function AddressModal({
  editing,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit
}: {
  editing: boolean;
  form: AddressFormState;
  saving: boolean;
  error: string;
  onChange: <Key extends keyof AddressFormState>(
    key: Key,
    value: AddressFormState[Key]
  ) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-[800]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onMouseDown={onClose}
      />

      <div className="relative flex h-full items-end justify-center sm:items-center sm:p-4">
        <form
          onSubmit={onSubmit}
          onMouseDown={(event) => event.stopPropagation()}
          className="flex max-h-[100dvh] w-full flex-col overflow-hidden bg-[#f7f5ef] text-[#1f1a12] shadow-2xl dark:bg-[#11110f] dark:text-[#e8e3d8] sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-[1.75rem] sm:border sm:border-[#302c24]"
        >
          <header className="relative shrink-0 overflow-hidden border-b border-[#302c24] bg-[#1f1a12] px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-[#f7f5ef] sm:px-7 sm:pt-6">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
                backgroundSize: "34px 34px"
              }}
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d6b46a]/25 bg-[#d6b46a]/10 text-[#d6b46a]">
                  <MapPin className="h-5 w-5" />
                </span>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d6b46a]">
                    Address book
                  </p>

                  <h2 className="font-display mt-2 text-2xl font-semibold">
                    {editing ? "Edit address" : "Add new address"}
                  </h2>

                  <p className="mt-2 text-xs font-medium leading-5 text-[#c8bead]">
                    Save accurate location details for home-visit repair
                    bookings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                aria-label="Close address form"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#e8e3d8] transition hover:bg-white/10 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <ModalTextField
                id="address-label"
                label="Address label"
                value={form.label}
                placeholder="Home, Work or Shop"
                disabled={saving}
                required
                icon={<Building2 className="h-4 w-4" />}
                onChange={(value) => onChange("label", value)}
              />

              <ModalTextField
                id="address-pincode"
                label="Pincode"
                value={form.pincode}
                placeholder="400054"
                disabled={saving}
                required
                inputMode="numeric"
                maxLength={6}
                icon={<Navigation className="h-4 w-4" />}
                onChange={(value) =>
                  onChange("pincode", value.replace(/\D/g, "").slice(0, 6))
                }
              />

              <div className="sm:col-span-2">
                <label className="block" htmlFor="address-line">
                  <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                    Full address
                    <span className="ml-1 text-red-600 dark:text-red-400">
                      *
                    </span>
                  </span>

                  <textarea
                    id="address-line"
                    value={form.addressLine}
                    disabled={saving}
                    rows={4}
                    placeholder="Building, room number, road and landmark"
                    onChange={(event) =>
                      onChange("addressLine", event.target.value)
                    }
                    className="admin-input min-h-28 resize-none py-3"
                  />
                </label>
              </div>

              <ModalTextField
                id="address-city"
                label="City"
                value={form.city}
                placeholder="Mumbai"
                disabled={saving}
                required
                icon={<Building2 className="h-4 w-4" />}
                onChange={(value) => onChange("city", value)}
              />

              <ModalTextField
                id="address-state"
                label="State"
                value={form.state}
                placeholder="Maharashtra"
                disabled={saving}
                required
                icon={<MapPin className="h-4 w-4" />}
                onChange={(value) => onChange("state", value)}
              />
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
              <input
                type="checkbox"
                checked={form.isDefault}
                disabled={saving}
                onChange={(event) =>
                  onChange("isDefault", event.target.checked)
                }
                className="mt-0.5 h-4 w-4 accent-[#8a6624]"
              />

              <span>
                <span className="block text-sm font-bold">
                  Use as default address
                </span>

                <span className="mt-1 block text-xs font-medium leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  This address will be selected first during home-visit
                  bookings.
                </span>
              </span>
            </label>

            {error && (
              <div className="mt-5">
                <MessageBox type="error" message={error} />
              </div>
            )}
          </div>

          <footer className="grid shrink-0 gap-3 border-t border-[#d8cdb6] bg-[#fffaf0] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#302c24] dark:bg-[#11110f] sm:grid-cols-2 sm:px-7 sm:pb-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-12 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 text-sm font-bold transition hover:bg-[#f2eadb] disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
            >
              Cancel
            </button>

            <ActionButton
              type="submit"
              loading={saving}
              spinnerOnly
              variant="dark"
              fullWidth
              className="min-h-12 !rounded-xl"
            >
              {editing ? "Update address" : "Add address"}
            </ActionButton>
          </footer>
        </form>
      </div>
    </div>
  );
}

function ModalTextField({
  id,
  label,
  value,
  placeholder,
  disabled,
  required,
  inputMode,
  maxLength,
  icon,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  required?: boolean;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  icon: ReactNode;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        {label}

        {required && (
          <span className="ml-1 text-red-600 dark:text-red-400">*</span>
        )}
      </span>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-[#817867] dark:text-[#928a7d]">
          {icon}
        </span>

        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="admin-input h-12 pl-11"
        />
      </div>
    </label>
  );
}

function DeleteAddressModal({
  address,
  deleting,
  onCancel,
  onConfirm
}: {
  address: CustomerAddress;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[820] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section className="w-full overflow-hidden bg-[#f7f5ef] text-[#1f1a12] shadow-2xl dark:bg-[#11110f] dark:text-[#e8e3d8] sm:max-w-md sm:rounded-[1.75rem] sm:border sm:border-[#302c24]">
        <header className="border-b border-red-900/20 bg-red-950 px-5 py-6 text-white sm:px-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-300/20 bg-red-400/10 text-red-200">
            <Trash2 className="h-5 w-5" />
          </span>

          <h2 className="font-display mt-5 text-2xl font-semibold">
            Delete this address?
          </h2>

          <p className="mt-2 text-sm font-medium leading-6 text-red-100/75">
            This removes the address from your saved booking locations.
          </p>
        </header>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
            <p className="text-sm font-bold">
              {address.label || "Saved address"}
            </p>

            <p className="mt-2 text-xs font-medium leading-5 text-[#6f6758] dark:text-[#a8a093]">
              {formatAddress(address)}
            </p>
          </div>

          {address.isDefault && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
              This is currently your default booking address.
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={onCancel}
              className="h-12 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-sm font-bold transition hover:bg-[#f2eadb] disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
            >
              Cancel
            </button>

            <ActionButton
              type="button"
              onClick={onConfirm}
              loading={deleting}
              spinnerOnly
              variant="dark"
              className="min-h-12 !rounded-xl !bg-red-700 !text-white hover:!bg-red-800 dark:!bg-red-300 dark:!text-red-950 dark:hover:!bg-red-200"
            >
              Delete address
            </ActionButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function AddressEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[270px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#d8cdb6] bg-[#fffaf0] px-5 py-10 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        <MapPin className="h-6 w-6" />
      </span>

      <h3 className="font-display mt-5 text-2xl font-semibold">
        No saved addresses
      </h3>

      <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Add a trusted address to make home-visit repair booking faster.
      </p>

      <ActionButton
        type="button"
        onClick={onAdd}
        fullWidth={false}
        variant="dark"
        className="mt-6 min-h-11 !rounded-xl !px-5 !py-3"
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add address
        </span>
      </ActionButton>
    </div>
  );
}

function MessageBox({
  type,
  message
}: {
  type: "success" | "error";
  message: string;
}) {
  const successful = type === "success";

  return (
    <div
      role={successful ? "status" : "alert"}
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      {message}
    </div>
  );
}

function ProfileLoadingState() {
  return (
    <main
      className="te-sheet-bg mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <div className="animate-pulse">
        <div className="h-[310px] rounded-[2rem] border border-[#302c24] bg-[#1f1a12] sm:h-[260px]" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-52 rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="h-[430px] rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />

            <div className="h-[390px] rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileErrorState({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main
      className="te-sheet-bg mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-[2rem] border border-red-200 bg-red-50 px-5 py-12 text-center dark:border-red-400/20 dark:bg-red-400/10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <RefreshCw className="h-6 w-6" />
        </span>

        <h1 className="font-display mt-5 text-3xl font-semibold text-red-700 dark:text-red-300">
          Could not load profile
        </h1>

        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-red-700/80 dark:text-red-200/80">
          {message}
        </p>

        <ActionButton
          type="button"
          onClick={onRetry}
          fullWidth={false}
          variant="dark"
          className="mt-6 min-h-11 !rounded-xl !px-5 !py-3"
        >
          Try again
        </ActionButton>
      </div>
    </main>
  );
}

function getAddressIcon(label?: string | null) {
  const normalized = label?.trim().toLowerCase() ?? "";

  if (normalized.includes("home")) {
    return <Home className="h-5 w-5" />;
  }

  if (
    normalized.includes("work") ||
    normalized.includes("office") ||
    normalized.includes("shop")
  ) {
    return <Building2 className="h-5 w-5" />;
  }

  return <MapPin className="h-5 w-5" />;
}

function formatAddress(address: CustomerAddress) {
  return [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

export default CustomerProfilePage;
