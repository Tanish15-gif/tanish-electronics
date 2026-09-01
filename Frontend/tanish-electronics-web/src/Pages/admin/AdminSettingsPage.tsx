import { useApiAuth } from "../../hooks/useApiAuth";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getAdminShopSettings,
  updateAdminShopSettings,
  type AdminShopSettings
} from "../../Services/adminSettingsService";
import { useShopSettings } from "../../hooks/useShopSettings";

type SettingsForm = {
  shopName: string;
  ownerName: string;

  primaryPhone: string;
  secondaryPhone: string;
  whatsAppNumber: string;
  email: string;

  address: string;
  city: string;
  area: string;

  homeVisitMessage: string;
  openingHours: string;
  bookingNotice: string;

  localServiceRadiusKm: string;
};

const initialSettingsForm: SettingsForm = {
  shopName: "",
  ownerName: "",

  primaryPhone: "",
  secondaryPhone: "",
  whatsAppNumber: "",
  email: "",

  address: "",
  city: "",
  area: "",

  homeVisitMessage: "",
  openingHours: "",
  bookingNotice: "",

  localServiceRadiusKm: "8"
};

function AdminSettingsPage() {
  const { getToken } = useApiAuth();
  const { settings } = useShopSettings();

  const [form, setForm] = useState<SettingsForm>(initialSettingsForm);
  const [setting, setSettings] = useState<AdminShopSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const lastUpdatedText = useMemo(() => {
    if (!setting?.updatedAt) {
      return setting?.createdAt
        ? `Created ${formatDateTime(setting.createdAt)}`
        : "Not updated yet";
    }

    return `Updated ${formatDateTime(setting.updatedAt)}`;
  }, [setting]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Settings | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const data = await getAdminShopSettings(token);

      setSettings(data);
      setForm(mapSettingsToForm(data));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load shop settings."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      setSuccess("");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

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

      const response = await updateAdminShopSettings(token, {
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),

        primaryPhone: form.primaryPhone.trim(),
        secondaryPhone: normalizeOptional(form.secondaryPhone),
        whatsAppNumber: form.whatsAppNumber.trim(),
        email: normalizeOptional(form.email),

        address: form.address.trim(),
        city: form.city.trim(),
        area: form.area.trim(),

        homeVisitMessage: form.homeVisitMessage.trim(),
        openingHours: normalizeOptional(form.openingHours),
        bookingNotice: normalizeOptional(form.bookingNotice),

        localServiceRadiusKm: Number(form.localServiceRadiusKm)
      });

      setSettings(response.settings);
      setForm(mapSettingsToForm(response.settings));
      setSuccess(response.message || "Shop settings updated successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update shop settings."
      );
    } finally {
      setSaving(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  }

  if (loading) {
    return <SettingsLoading />;
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
            Business configuration
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Shop settings
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Manage public business information used across the website,
                booking pages, footer, contact buttons and customer messages.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-3 dark:border-[#302c24] dark:bg-[#11110f]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#817867] dark:text-[#928a7d]">
                Status
              </p>

              <p className="mt-1 text-sm font-black">{lastUpdatedText}</p>
            </div>
          </div>
        </header>

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

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="min-w-0 space-y-6">
            <SettingsSection
              title="Business identity"
              description="Core shop details displayed across the public website."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Shop name" required>
                  <input
                    value={form.shopName}
                    onChange={(event) =>
                      updateField("shopName", event.target.value)
                    }
                    className="admin-input"
                    placeholder="Tanish Electronics"
                  />
                </FormField>

                <FormField label="Owner name" required>
                  <input
                    value={form.ownerName}
                    onChange={(event) =>
                      updateField("ownerName", event.target.value)
                    }
                    className="admin-input"
                    placeholder="Mr. Subhash Mohanlal Gupta"
                  />
                </FormField>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Contact details"
              description="Phone, WhatsApp and email used for customer communication."
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Primary phone" required>
                  <input
                    value={form.primaryPhone}
                    onChange={(event) =>
                      updateField("primaryPhone", event.target.value)
                    }
                    className="admin-input"
                    placeholder="8850973399"
                    inputMode="tel"
                  />
                </FormField>

                <FormField label="Secondary phone">
                  <input
                    value={form.secondaryPhone}
                    onChange={(event) =>
                      updateField("secondaryPhone", event.target.value)
                    }
                    className="admin-input"
                    placeholder="8097026781"
                    inputMode="tel"
                  />
                </FormField>

                <FormField label="WhatsApp number" required>
                  <input
                    value={form.whatsAppNumber}
                    onChange={(event) =>
                      updateField("whatsAppNumber", event.target.value)
                    }
                    className="admin-input"
                    placeholder="918097026781"
                    inputMode="tel"
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="admin-input"
                    placeholder="shop@example.com"
                    type="email"
                  />
                </FormField>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Location"
              description="Public address and service area information."
            >
              <div className="space-y-5">
                <FormField label="Full address" required>
                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    className="admin-input resize-none"
                    rows={4}
                    placeholder="Full shop address"
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="City" required>
                    <input
                      value={form.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      className="admin-input"
                      placeholder="Mumbai"
                    />
                  </FormField>

                  <FormField label="Area" required>
                    <input
                      value={form.area}
                      onChange={(event) =>
                        updateField("area", event.target.value)
                      }
                      className="admin-input"
                      placeholder="Santacruz West"
                    />
                  </FormField>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Customer messages"
              description="Messages shown to customers while booking or contacting the shop."
            >
              <div className="space-y-5">
                <FormField label="Home visit message" required>
                  <textarea
                    value={form.homeVisitMessage}
                    onChange={(event) =>
                      updateField("homeVisitMessage", event.target.value)
                    }
                    className="admin-input resize-none"
                    rows={4}
                    placeholder="Home visit depends on location and availability..."
                  />
                </FormField>

                <FormField label="Opening hours">
                  <input
                    value={form.openingHours}
                    onChange={(event) =>
                      updateField("openingHours", event.target.value)
                    }
                    className="admin-input"
                    placeholder="Monday to Sunday, 10:00 AM - 9:00 PM"
                  />
                </FormField>

                <FormField label="Booking notice">
                  <textarea
                    value={form.bookingNotice}
                    onChange={(event) =>
                      updateField("bookingNotice", event.target.value)
                    }
                    className="admin-input resize-none"
                    rows={3}
                    placeholder="Same-day visit depends on workload and distance."
                  />
                </FormField>
              </div>
            </SettingsSection>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24">
            <SettingsPreview form={form} />

            <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              <h2 className="text-lg font-black">Save settings</h2>

              <p className="mt-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                Updating settings will refresh public website contact
                information and create an audit log entry.
              </p>

              <div className="mt-5 space-y-2">
                <ChecklistItem completed={form.shopName.trim().length > 0}>
                  Shop name added
                </ChecklistItem>

                <ChecklistItem completed={form.primaryPhone.trim().length > 0}>
                  Primary phone added
                </ChecklistItem>

                <ChecklistItem
                  completed={form.whatsAppNumber.trim().length > 0}
                >
                  WhatsApp number added
                </ChecklistItem>

                <ChecklistItem completed={form.address.trim().length > 0}>
                  Address added
                </ChecklistItem>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
              >
                {saving ? "Saving..." : "Save settings"}
              </button>

              <button
                type="button"
                onClick={() => void loadSettings()}
                disabled={saving}
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-70 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
              >
                Reset changes
              </button>
            </section>
          </aside>
        </form>
      </section>
    </main>
  );
}

function SettingsSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="border-b border-[#d8cdb6] pb-4 dark:border-[#302c24]">
        <h2 className="text-xl font-black tracking-tight">{title}</h2>

        <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required = false,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
        {label}

        {required && (
          <span className="ml-1 text-red-600 dark:text-red-300">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

function SettingsPreview({ form }: { form: SettingsForm }) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="border-b border-[#d8cdb6] px-5 py-4 dark:border-[#302c24]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
          Public preview
        </p>
      </div>

      <div className="p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1f1a12] text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]">
          TE
        </div>

        <h2 className="mt-4 text-2xl font-black leading-tight">
          {form.shopName.trim() || "Shop name"}
        </h2>

        <p className="mt-1 text-sm font-bold text-[#6f6758] dark:text-[#a8a093]">
          {form.ownerName.trim() || "Owner name"}
        </p>

        <div className="mt-5 space-y-3 rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] p-4 text-sm font-semibold leading-6 text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
          <p>
            <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
              Phone:
            </span>{" "}
            {form.primaryPhone.trim() || "—"}
          </p>

          <p>
            <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
              WhatsApp:
            </span>{" "}
            {form.whatsAppNumber.trim() || "—"}
          </p>

          <p>
            <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
              Area:
            </span>{" "}
            {form.area.trim() || "—"}, {form.city.trim() || "—"}
          </p>

          <p>
            <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
              Hours:
            </span>{" "}
            {form.openingHours.trim() || "Not specified"}
          </p>
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-[#817867] dark:text-[#928a7d]">
          {form.homeVisitMessage.trim() ||
            "Home visit message will appear here."}
        </p>
      </div>
    </section>
  );
}

function ChecklistItem({
  completed,
  children
}: {
  completed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
          completed
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
            : "border-[#d8cdb6] text-[#817867] dark:border-[#302c24] dark:text-[#928a7d]"
        }`}
      >
        {completed ? "✓" : ""}
      </span>

      <p className="text-xs font-bold">{children}</p>
    </div>
  );
}

function SettingsLoading() {
  return (
    <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-8 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-40 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-72 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]"
              />
            ))}
          </div>

          <div className="h-[520px] rounded-[1.5rem] bg-[#eee5d4] dark:bg-[#242016]" />
        </div>
      </div>
    </main>
  );
}

function mapSettingsToForm(settings: AdminShopSettings): SettingsForm {
  return {
    shopName: settings.shopName || "",
    ownerName: settings.ownerName || "",

    primaryPhone: settings.primaryPhone || "",
    secondaryPhone: settings.secondaryPhone || "",
    whatsAppNumber: settings.whatsAppNumber || "",
    email: settings.email || "",

    address: settings.address || "",
    city: settings.city || "",
    area: settings.area || "",

    homeVisitMessage: settings.homeVisitMessage || "",
    openingHours: settings.openingHours || "",
    bookingNotice: settings.bookingNotice || "",

    localServiceRadiusKm: String(settings.localServiceRadiusKm || 8)
  };
}

function validateForm(form: SettingsForm) {
  if (!form.shopName.trim()) {
    return "Shop name is required.";
  }

  if (!form.ownerName.trim()) {
    return "Owner name is required.";
  }

  if (!form.primaryPhone.trim()) {
    return "Primary phone number is required.";
  }

  if (!form.whatsAppNumber.trim()) {
    return "WhatsApp number is required.";
  }

  if (!form.address.trim()) {
    return "Address is required.";
  }

  if (!form.city.trim()) {
    return "City is required.";
  }

  if (!form.area.trim()) {
    return "Area is required.";
  }

  if (!form.homeVisitMessage.trim()) {
    return "Home visit message is required.";
  }

  return "";
}

function normalizeOptional(value: string) {
  return value.trim() ? value.trim() : null;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export default AdminSettingsPage;
