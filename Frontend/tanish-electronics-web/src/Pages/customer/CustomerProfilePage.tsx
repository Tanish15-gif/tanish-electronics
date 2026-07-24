import { useCustomAuth } from "../../contexts/CustomAuthContext";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent
} from "react";
import { createPortal } from "react-dom";

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

    document.title = "My Profile | Tanish Electronics";

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
    <main className="mx-auto min-h-full w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Profile identity header */}
      <section className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="h-20 bg-gradient-to-r from-[#1f1a12] via-[#4b3b21] to-[#8a6624] dark:from-[#090907] dark:via-[#1a1712] dark:to-[#5f471c] sm:h-32" />

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <ProfileAvatar
                imageUrl={null}
                name={displayName}
                initials={initials}
              />

              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                    {displayName}
                  </h1>

                  <ProfileStatusBadge completed={profile.isProfileCompleted} />
                </div>

                <p className="mt-1 truncate text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  {displayEmail}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => void loadProfile(true)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016] sm:w-fit"
            >
              <RefreshIcon spinning={refreshing} />

              {refreshing ? "Refreshing..." : "Refresh Profile"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <ProfileSummaryCard
              label="Profile completion"
              value={`${completionPercentage}%`}
            />
            <ProfileSummaryCard
              label="Saved addresses"
              value={profile.addresses.length}
            />
            <ProfileSummaryCard
              label="Default address"
              value={defaultAddress ? "Available" : "Missing"}
            />
          </div>
        </div>
      </section>

      {/* Messages */}
      <div aria-live="polite" className="mt-5 space-y-3">
        {pageError && <MessageBox type="error" message={pageError} />}

        {success && <MessageBox type="success" message={success} />}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Profile sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-black">Profile completion</h2>

              <span className="text-sm font-black text-[#8a6624] dark:text-[#d6b46a]">
                {completionPercentage}%
              </span>
            </div>

            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8dcc4] dark:bg-[#302c24]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercentage}
            >
              <div
                className="h-full rounded-full bg-[#8a6624] transition-all duration-500 dark:bg-[#d6b46a]"
                style={{
                  width: `${completionPercentage}%`
                }}
              />
            </div>

            <div className="mt-5 space-y-3">
              <CompletionItem
                completed={Boolean(profile.fullName?.trim())}
                text="Full name"
              />

              <CompletionItem
                completed={Boolean(profile.phoneNumber?.trim())}
                text="Phone number"
              />

              <CompletionItem
                completed={Boolean(profile.email?.trim())}
                text="Account email"
              />

              <CompletionItem
                completed={profile.addresses.length > 0}
                text="Saved address"
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
            <h2 className="text-base font-black">Contact information</h2>

            <div className="mt-4 space-y-3">
              <ContactRow
                icon={<MailIcon />}
                label="Email"
                value={displayEmail}
              />

              <ContactRow
                icon={<PhoneIcon />}
                label="Phone"
                value={profile.phoneNumber || "Not added"}
              />
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                <LocationIcon />
              </span>

              <div className="min-w-0">
                <h2 className="text-sm font-black">Default address</h2>

                <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  {defaultAddress
                    ? formatAddress(defaultAddress)
                    : "No default address selected."}
                </p>
              </div>
            </div>
          </section>
        </aside>

        {/* Main profile content */}
        <div className="space-y-6">
          {/* Personal details */}
          <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
            <div className="border-b border-[#d8cdb6] pb-5 dark:border-[#302c24]">
              <h2 className="text-xl font-bold">Personal details</h2>

              <p className="mt-1 text-sm font-medium text-[#6f6758] dark:text-[#a8a093]">
                Information used for repair bookings and contact.
              </p>
            </div>

            <form className="mt-6" onSubmit={handleSaveProfile} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="profile-full-name"
                    label="Full name"
                    required
                  />

                  <input
                    id="profile-full-name"
                    type="text"
                    value={fullName}
                    disabled={savingProfile}
                    autoComplete="name"
                    placeholder="Enter your full name"
                    onChange={(event) => {
                      setFullName(event.target.value);

                      setProfileError("");
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="profile-phone"
                    label="Phone number"
                    required
                  />

                  <input
                    id="profile-phone"
                    type="tel"
                    value={phoneNumber}
                    disabled={savingProfile}
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={15}
                    placeholder="9999999999"
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15);

                      setPhoneNumber(value);
                      setProfileError("");
                    }}
                    className={inputClassName}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="profile-email" label="Account email" />

                  <div className="relative">
                    <input
                      id="profile-email"
                      type="email"
                      value={displayEmail}
                      disabled
                      className={`${inputClassName} pr-28 opacity-70`}
                    />

                    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      Signed in
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                    Email is managed by your signed-in account.
                  </p>
                </div>
              </div>

              {profileError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                >
                  {profileError}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <ActionButton
                  type="submit"
                  loading={savingProfile}
                  loadingText="Saving..."
                  variant="dark"
                  fullWidth={false}
                  className="h-12 min-w-[180px] rounded-xl"
                >
                  Save Profile
                </ActionButton>
              </div>
            </form>
          </section>

          {/* Address book */}
          <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#d8cdb6] pb-5 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black">Address book</h2>

                <p className="mt-1 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  Saved addresses can be used during home-visit booking.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddAddress}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] sm:w-fit"
              >
                <PlusIcon />
                Add Address
              </button>
            </div>

            {profile.addresses.length === 0 ? (
              <AddressEmptyState onAdd={openAddAddress} />
            ) : (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
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

function ProfileAvatar({
  imageUrl,
  name,
  initials
}: {
  imageUrl?: string | null;
  name: string;
  initials: string;
}) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] border-4 border-[#fffdf7] bg-[#1f1a12] text-xl font-black text-[#f7f5ef] shadow-lg dark:border-[#1a1712] dark:bg-[#e8e3d8] dark:text-[#11110f] sm:h-24 sm:w-24">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${name} profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

function ProfileStatusBadge({ completed }: { completed: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black ${
        completed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
      }`}
    >
      {completed ? "Profile complete" : "Profile incomplete"}
    </span>
  );
}

function ProfileSummaryCard({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-3 dark:border-[#302c24] dark:bg-[#11110f] sm:p-4">
      <p className="text-lg font-black sm:text-xl">{value}</p>

      <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.08em] text-[#817867] dark:text-[#928a7d] sm:text-xs">
        {label}
      </p>
    </div>
  );
}

function CompletionItem({
  completed,
  text
}: {
  completed: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          completed
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
            : "bg-[#eee5d4] text-[#817867] dark:bg-[#302c24] dark:text-[#928a7d]"
        }`}
      >
        {completed ? (
          <CheckIcon />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </span>

      <span
        className={`text-sm font-semibold ${
          completed
            ? "text-[#1f1a12] dark:text-[#e8e3d8]"
            : "text-[#6f6758] dark:text-[#a8a093]"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-3 dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
          {label}
        </p>

        <p className="mt-1 break-words text-xs font-black">{value}</p>
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
      className={`flex h-full flex-col rounded-[1.25rem] border bg-[#fffaf0] p-4 transition dark:bg-[#11110f] sm:p-5 ${
        address.isDefault
          ? "border-[#d6b46a]/70 shadow-sm dark:border-[#d6b46a]/40"
          : "border-[#d8cdb6] hover:border-[#c7b98e] dark:border-[#302c24] dark:hover:border-[#50483b]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          <LocationIcon />
        </span>

        {address.isDefault && (
          <span className="rounded-full border border-[#d6b46a]/40 bg-[#fff4cc] px-3 py-1 text-[10px] font-black text-[#7a570f] dark:border-[#d6b46a]/25 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
            Default
          </span>
        )}
      </div>

      <h3 className="mt-4 text-lg font-black">{address.label || "Address"}</h3>

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        {formatAddress(address)}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <button
          type="button"
          disabled={busy}
          onClick={onEdit}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 text-xs font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
        >
          <EditIcon />
          Edit
        </button>

        {!address.isDefault && (
          <button
            type="button"
            disabled={busy}
            onClick={onSetDefault}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d8cdb6] bg-[#fffdf7] px-3 text-xs font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            {busy ? "Updating..." : "Make Default"}
          </button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
        >
          <TrashIcon />
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
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onMouseDown={onClose}
      />

      <div className="relative flex h-full items-end justify-center sm:items-center sm:p-4">
        <form
          onSubmit={onSubmit}
          onMouseDown={(event) => event.stopPropagation()}
          className="flex max-h-[100dvh] w-full flex-col overflow-hidden bg-[#f7f5ef] text-[#1f1a12] shadow-2xl dark:bg-[#11110f] dark:text-[#e8e3d8] sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-[1.5rem] sm:border sm:border-[#d8cdb6] dark:sm:border-[#302c24]"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#d8cdb6] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#302c24] sm:px-6 sm:pt-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
                Address book
              </p>

              <h2 className="mt-2 text-xl font-black sm:text-2xl">
                {editing ? "Edit address" : "Add new address"}
              </h2>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              aria-label="Close address form"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel
                  htmlFor="address-label"
                  label="Address label"
                  required
                />

                <input
                  id="address-label"
                  type="text"
                  value={form.label}
                  disabled={saving}
                  placeholder="Home, Work or Shop"
                  onChange={(event) => onChange("label", event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="address-pincode"
                  label="Pincode"
                  required
                />

                <input
                  id="address-pincode"
                  type="text"
                  value={form.pincode}
                  disabled={saving}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="400054"
                  onChange={(event) =>
                    onChange(
                      "pincode",
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  className={inputClassName}
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel
                  htmlFor="address-line"
                  label="Full address"
                  required
                />

                <textarea
                  id="address-line"
                  value={form.addressLine}
                  disabled={saving}
                  rows={4}
                  placeholder="Building, room number, road and landmark"
                  onChange={(event) =>
                    onChange("addressLine", event.target.value)
                  }
                  className={`${inputClassName} resize-none`}
                />
              </div>

              <div>
                <FieldLabel htmlFor="address-city" label="City" required />

                <input
                  id="address-city"
                  type="text"
                  value={form.city}
                  disabled={saving}
                  placeholder="Mumbai"
                  onChange={(event) => onChange("city", event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <FieldLabel htmlFor="address-state" label="State" required />

                <input
                  id="address-state"
                  type="text"
                  value={form.state}
                  disabled={saving}
                  placeholder="Maharashtra"
                  onChange={(event) => onChange("state", event.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
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
                <span className="block text-sm font-black">
                  Use as default address
                </span>

                <span className="mt-1 block text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  This address will be selected first during home-visit
                  bookings.
                </span>
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
              >
                {error}
              </div>
            )}
          </div>

          <footer className="grid shrink-0 gap-3 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#302c24] dark:bg-[#11110f] sm:grid-cols-2 sm:px-6 sm:pb-5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-12 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
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
              {editing ? "Update Address" : "Add Address"}
            </ActionButton>
          </footer>
        </form>
      </div>
    </div>
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
    <div className="fixed inset-0 z-[820] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full bg-[#f7f5ef] p-5 text-[#1f1a12] shadow-2xl dark:bg-[#11110f] dark:text-[#e8e3d8] sm:max-w-md sm:rounded-[1.5rem] sm:border sm:border-[#d8cdb6] sm:p-6 dark:sm:border-[#302c24]">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <TrashIcon />
        </span>

        <h2 className="mt-5 text-xl font-black">Delete this address?</h2>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          <strong className="text-[#1f1a12] dark:text-[#e8e3d8]">
            {address.label || "Address"}
          </strong>{" "}
          will be removed from your address book.
        </p>

        {address.isDefault && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            This is currently your default address.
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="h-11 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-sm font-black transition hover:bg-[#f2eadb] disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="h-11 rounded-xl bg-red-700 px-4 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-300 dark:text-red-950"
          >
            {deleting ? "Deleting..." : "Delete Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-5 flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8cdb6] bg-[#fffaf0] px-5 py-10 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <LocationIcon />
      </span>

      <h3 className="mt-4 text-lg font-black">No saved addresses</h3>

      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Add an address to make home-visit repair booking faster.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1f1a12] px-5 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
      >
        <PlusIcon />
        Add Address
      </button>
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
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex min-h-[55vh] items-center justify-center rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />

          <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Loading profile...
          </p>
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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-10 text-center dark:border-red-400/20 dark:bg-red-400/10">
        <h1 className="text-xl font-black text-red-700 dark:text-red-300">
          Could not load profile
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

function formatAddress(address: CustomerAddress) {
  return [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

const inputClassName =
  "w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#1f1a12] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:placeholder:text-[#8f8778] dark:focus:border-[#d6b46a]";

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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="m7 12 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
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

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m14 5 5 5-9 9H5v-5l9-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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

export default CustomerProfilePage;
