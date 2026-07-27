import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  updateAnnouncement,
  uploadAnnouncementImage,
  type AdminAnnouncement,
  type CreateAnnouncement
} from "../../Services/adminAnnouncementService";
import { exportAnnouncements } from "../../Services/adminExportService";

type AnnouncementTab = "overview" | "editor";

type AnnouncementFilter =
  "all" | "active" | "inactive" | "scheduled" | "expired";

type AnnouncementForm = {
  title: string;
  message: string;
  announcementType: string;
  audience: string;
  displayLocation: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  startAt: string;
  endAt: string;
  priority: number;
  isActive: boolean;
  showOnce: boolean;
};

const announcementTypes = [
  "Product",
  "Offer",
  "ServiceAlert",
  "ShopNotice",
  "RepairReminder",
  "FeedbackHighlight"
];

const audiences = ["All", "SignedCustomers", "UnsignedVisitors"];

const displayLocations = [
  "Homepage",
  "CustomerDashboard",
  "ProductsPage",
  "BookRepairPage",
  "AllPublicPages"
];

const priorityOptions: DropdownOption<number>[] = [
  {
    value: 1,
    label: "Low"
  },
  {
    value: 2,
    label: "Normal"
  },
  {
    value: 3,
    label: "High"
  },
  {
    value: 4,
    label: "Urgent"
  }
];

const filterOptions: DropdownOption<AnnouncementFilter>[] = [
  {
    value: "all",
    label: "All announcements"
  },
  {
    value: "active",
    label: "Active"
  },
  {
    value: "inactive",
    label: "Inactive"
  },
  {
    value: "scheduled",
    label: "Scheduled"
  },
  {
    value: "expired",
    label: "Expired"
  }
];

const emptyForm: AnnouncementForm = {
  title: "",
  message: "",
  announcementType: "ServiceAlert",
  audience: "All",
  displayLocation: "Homepage",
  imageUrl: "",
  buttonText: "Book Repair",
  buttonLink: "/book-repair",
  startAt: "",
  endAt: "",
  priority: 2,
  isActive: true,
  showOnce: false
};

function AdminAnnouncementsPage() {
  const { getToken } = useApiAuth();

  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);

  const [form, setForm] = useState<AnnouncementForm>(emptyForm);

  const [activeTab, setActiveTab] = useState<AnnouncementTab>("overview");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [announcementToDelete, setAnnouncementToDelete] =
    useState<AdminAnnouncement | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AnnouncementFilter>("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [exporting, setExporting] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");

  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const startRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalRecords);

  useEffect(() => {
    if (activeTab === "editor") {
      document.title = editingId
        ? `Edit Announcement #${editingId} | Tanish Electronics Admin`
        : "Create Announcement | Tanish Electronics Admin";
    } else {
      document.title = "Announcements | Tanish Electronics Admin";
    }

    return () => {
      document.title = "Tanish Electronics";
    };
  }, [activeTab, editingId]);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  const announcementTypeOptions = useMemo<DropdownOption<string>[]>(
    () =>
      announcementTypes.map((type) => ({
        value: type,
        label: formatAnnouncementType(type)
      })),
    []
  );

  const audienceOptions = useMemo<DropdownOption<string>[]>(
    () =>
      audiences.map((audience) => ({
        value: audience,
        label: formatAnnouncementType(audience)
      })),
    []
  );

  const displayLocationOptions = useMemo<DropdownOption<string>[]>(
    () =>
      displayLocations.map((location) => ({
        value: location,
        label: formatAnnouncementType(location)
      })),
    []
  );

  // NOTE: these three counts only reflect the current page of results
  // (max `pageSize`), not the full dataset. A backend endpoint that
  // returns counts-by-state would be needed for fully accurate totals.
  const activeCount = useMemo(() => {
    return announcements.filter(
      (announcement) => getAnnouncementState(announcement) === "active"
    ).length;
  }, [announcements]);

  const scheduledCount = useMemo(() => {
    return announcements.filter(
      (announcement) => getAnnouncementState(announcement) === "scheduled"
    ).length;
  }, [announcements]);

  const expiredCount = useMemo(() => {
    return announcements.filter(
      (announcement) => getAnnouncementState(announcement) === "expired"
    ).length;
  }, [announcements]);

  // FIX (bug 1): this filtered list was previously computed but never
  // rendered — the list below was mapping over `announcements` directly,
  // which meant picking "Scheduled" or "Expired" in the dropdown had no
  // visible effect. It's now actually used below.
  const visibleAnnouncements = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return announcements.filter((announcement) => {
      const announcementState = getAnnouncementState(announcement);

      const matchesFilter = filter === "all" || announcementState === filter;

      const searchableText = [
        announcement.title,
        announcement.message,
        announcement.announcementType,
        announcement.audience,
        announcement.displayLocation
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch === "" || searchableText.includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [announcements, search, filter]);

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // FIX (bug 1): the backend only understands `isActive`, not
      // "scheduled"/"expired" as query concepts. For those two filters we
      // still need active=true from the server, then narrow down to the
      // precise state client-side via `visibleAnnouncements` above.
      const isActiveParam =
        filter === "active" || filter === "scheduled" || filter === "expired"
          ? true
          : filter === "inactive"
            ? false
            : null;

      const data = await getAdminAnnouncements(
        {
          search: appliedSearch,
          isActive: isActiveParam,
          pageNumber,
          pageSize
        },
        token
      );

      const safeTotalPages = Math.max(data.totalPages, 1);

      setAnnouncements(data.items);
      setTotalPages(safeTotalPages);
      setTotalRecords(data.totalRecords);

      if (pageNumber > safeTotalPages) {
        setPageNumber(safeTotalPages);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load announcements."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, appliedSearch, filter, pageNumber]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  async function handleExportAnnouncements() {
    try {
      setExporting(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // FIX (bug 3): was reading live `search` state instead of
      // `appliedSearch`. If the person had typed in the search box but not
      // yet pressed Search, the exported CSV silently used different
      // criteria than what's shown on screen.
      await exportAnnouncements(token, {
        search: appliedSearch.trim() || undefined,

        isActive:
          filter === "active" ? true : filter === "inactive" ? false : null
      });

      setSuccess("Announcements CSV downloaded successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to export announcements."
      );
    } finally {
      setExporting(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageNumber(1);
    setAppliedSearch(search.trim());
  }

  function handleFilterChange(value: AnnouncementFilter) {
    setFilter(value);
    setPageNumber(1);
  }

  function clearFilters() {
    setSearch("");
    setAppliedSearch("");
    setFilter("all");
    setPageNumber(1);
  }

  function goToPreviousPage() {
    setPageNumber((current) => Math.max(current - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((current) => Math.min(current + 1, totalPages));
  }

  function updateField<K extends keyof AnnouncementForm>(
    key: K,
    value: AnnouncementForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));

    if (error) {
      setError("");
    }
  }

  function validateForm() {
    if (form.title.trim().length < 3) {
      return "Announcement title must contain at least 3 characters.";
    }

    if (form.message.trim().length < 5) {
      return "Announcement message must contain at least 5 characters.";
    }

    const hasButtonText = form.buttonText.trim() !== "";
    const hasButtonLink = form.buttonLink.trim() !== "";

    if (hasButtonText !== hasButtonLink) {
      return "Button text and button link must both be provided.";
    }

    if (hasButtonLink && !isValidAnnouncementLink(form.buttonLink.trim())) {
      return "Button link must be a website URL, phone link, email link or internal path.";
    }

    if (form.imageUrl.trim() && !isValidImageUrl(form.imageUrl.trim())) {
      return "Image URL must start with http://, https:// or /.";
    }

    const startDate = form.startAt ? new Date(form.startAt) : null;

    const endDate = form.endAt ? new Date(form.endAt) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      return "Enter a valid start date.";
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      return "Enter a valid end date.";
    }

    if (startDate && endDate && endDate <= startDate) {
      return "End date must be after the start date.";
    }

    return "";
  }
  function handleAnnouncementImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setImageError("");

    if (!file) {
      return;
    }

    const validationError = validateAnnouncementImage(file);

    if (validationError) {
      setSelectedImage(null);
      setImagePreview("");
      setImageError(validationError);
      event.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));

    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      setSuccess("");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      return;
    }

    if (imageError) {
      setError(imageError);
      setSuccess("");
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

      const payload = toPayload(form);

      if (editingId !== null) {
        await updateAnnouncement(editingId, payload, token);

        if (selectedImage) {
          await uploadAnnouncementImage(editingId, selectedImage, token);
        }

        setSuccess("Announcement updated successfully.");
      } else {
        const createdAnnouncement = await createAnnouncement(payload, token);

        if (selectedImage) {
          await uploadAnnouncementImage(
            createdAnnouncement.announcementId,
            selectedImage,
            token
          );
        }

        setSuccess("Announcement created successfully.");
      }

      resetForm();
      setActiveTab("overview");

      await loadAnnouncements();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to save announcement."
      );
    } finally {
      setSaving(false);
    }
  }
  function removeAnnouncementImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");
    setImageError("");
  }

  function handleCreateNew() {
    resetForm();
    setActiveTab("editor");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function handleEdit(announcement: AdminAnnouncement) {
    setEditingId(announcement.announcementId);

    setForm({
      title: announcement.title,
      message: announcement.message,
      announcementType: announcement.announcementType,
      audience: announcement.audience,
      displayLocation: announcement.displayLocation,
      imageUrl: announcement.imageUrl || "",
      buttonText: announcement.buttonText || "",
      buttonLink: announcement.buttonLink || "",
      startAt: toDateTimeLocal(announcement.startAt),
      endAt: toDateTimeLocal(announcement.endAt),
      priority: announcement.priority,
      isActive: announcement.isActive,
      showOnce: announcement.showOnce
    });

    setActiveTab("editor");
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function handleCancelEdit() {
    resetForm();
    setActiveTab("overview");
  }

  async function handleToggleActive(announcement: AdminAnnouncement) {
    try {
      setTogglingId(announcement.announcementId);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const nextActiveState = !announcement.isActive;

      await updateAnnouncement(
        announcement.announcementId,
        announcementToPayload(announcement, nextActiveState),
        token
      );

      setAnnouncements((currentAnnouncements) =>
        currentAnnouncements.map((item) =>
          item.announcementId === announcement.announcementId
            ? {
                ...item,
                isActive: nextActiveState
              }
            : item
        )
      );

      setSuccess(
        nextActiveState
          ? "Announcement activated."
          : "Announcement deactivated."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update announcement."
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDeleteAnnouncement() {
    if (!announcementToDelete) return;

    try {
      setDeletingId(announcementToDelete.announcementId);

      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await deleteAnnouncement(announcementToDelete.announcementId, token);

      setAnnouncements((currentAnnouncements) =>
        currentAnnouncements.filter(
          (announcement) =>
            announcement.announcementId !== announcementToDelete.announcementId
        )
      );

      if (editingId === announcementToDelete.announcementId) {
        resetForm();
      }

      setSuccess(`"${announcementToDelete.title}" was deleted.`);

      setAnnouncementToDelete(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete announcement."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function resetForm() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setEditingId(null);
    setForm(emptyForm);

    setSelectedImage(null);
    setImagePreview("");
    setImageError("");
  }

  const hasActiveFilters = appliedSearch.trim() !== "" || filter !== "all";

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Customer communication
              </p>

              <h1 className="font-display mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Announcements
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Create and manage customer-facing updates, service alerts,
                product notices and offers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* FIX (bug 2): was `announcements.length`, which is only the
                  current page (max `pageSize`). `totalRecords` is the real
                  total across all pages. */}
              <SummaryBox label="Total" value={totalRecords} />

              <SummaryBox label="Active" value={activeCount} />

              <SummaryBox label="Scheduled" value={scheduledCount} />

              <SummaryBox label="Expired" value={expiredCount} />
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

        {/* Two sections */}
        <AnnouncementTabs
          activeTab={activeTab}
          editing={editingId !== null}
          onChange={(tab) => {
            if (tab === "editor" && activeTab !== "editor") {
              resetForm();
            }

            setActiveTab(tab);
          }}
        />

        {activeTab === "overview" && (
          <section className="mt-6">
            <div className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-4 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              <form
                onSubmit={handleSearchSubmit}
                className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_230px_auto] lg:items-end"
              >
                <div>
                  <label
                    htmlFor="announcement-search"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#5f574a] dark:text-[#b5ada0]"
                  >
                    Search announcements
                  </label>

                  <div className="relative">
                    <SearchIcon />

                    <input
                      id="announcement-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search title, message or location..."
                      className="h-12 w-full rounded-xl border border-[#d8cdb6] bg-[#fffaf0] py-3 pl-11 pr-11 text-sm font-semibold outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
                    />

                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear announcement search"
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] dark:hover:bg-[#242016]"
                      >
                        <CloseIcon />
                      </button>
                    )}
                  </div>
                </div>

                <UniversalDropdown<AnnouncementFilter>
                  label="Status"
                  options={filterOptions}
                  value={filter}
                  onChange={handleFilterChange}
                  placeholder="All announcements"
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 flex-1 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] lg:flex-none"
                  >
                    Search
                  </button>

                  <ActionButton
                    type="button"
                    variant="outline"
                    fullWidth={false}
                    loading={exporting}
                    loadingText=""
                    onClick={() => void handleExportAnnouncements()}
                    disabled={loading || totalRecords === 0}
                    className="h-12 flex-1 px-5 lg:flex-none"
                  >
                    <span className="inline-flex items-center gap-2">
                      <DownloadIcon />
                      Export CSV
                    </span>
                  </ActionButton>

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

                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a] lg:flex-none"
                  >
                    <PlusIcon />
                    New announcement
                  </button>
                </div>
              </form>
            </div>

            {loading ? (
              <AnnouncementsLoading />
            ) : visibleAnnouncements.length === 0 ? (
              <EmptyAnnouncements
                hasFilters={hasActiveFilters}
                onClear={clearFilters}
                onCreate={handleCreateNew}
              />
            ) : (
              <>
                <div className="mt-6 mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
                    Showing {startRecord}-{endRecord} of {totalRecords}{" "}
                    announcements
                  </p>

                  <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                    Page {pageNumber} of {totalPages}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* FIX (bug 1): was mapping over `announcements` directly,
                      which ignored the Scheduled/Expired filter entirely.
                      `visibleAnnouncements` applies the client-side state
                      filter (and search) on top of the fetched page. */}
                  {visibleAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.announcementId}
                      announcement={announcement}
                      toggling={togglingId === announcement.announcementId}
                      onEdit={() => handleEdit(announcement)}
                      onDelete={() => setAnnouncementToDelete(announcement)}
                      onToggleActive={() =>
                        void handleToggleActive(announcement)
                      }
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
              </>
            )}
          </section>
        )}

        {activeTab === "editor" && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]"
          >
            <div className="min-w-0 space-y-6">
              <FormSection
                title={
                  editingId
                    ? `Edit announcement #${editingId}`
                    : "Announcement content"
                }
                description="Write the main title and customer-facing message."
              >
                <div className="space-y-5">
                  <FormField
                    label="Title"
                    required
                    count={`${form.title.length}/150`}
                  >
                    <input
                      value={form.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      maxLength={150}
                      placeholder="Same-day TV checkup available"
                      className="admin-input"
                    />
                  </FormField>

                  <FormField
                    label="Message"
                    required
                    count={`${form.message.length}/1000`}
                  >
                    <textarea
                      value={form.message}
                      onChange={(event) =>
                        updateField("message", event.target.value)
                      }
                      maxLength={1000}
                      rows={6}
                      placeholder="Book your TV repair request today..."
                      className="admin-input resize-none"
                    />
                  </FormField>
                </div>
              </FormSection>

              <FormSection
                title="Delivery settings"
                description="Choose who should see the announcement and where it appears."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <UniversalDropdown<string>
                    label="Announcement type"
                    options={announcementTypeOptions}
                    value={form.announcementType}
                    onChange={(value) => updateField("announcementType", value)}
                    placeholder="Select type"
                  />

                  <UniversalDropdown<string>
                    label="Audience"
                    options={audienceOptions}
                    value={form.audience}
                    onChange={(value) => updateField("audience", value)}
                    placeholder="Select audience"
                  />

                  <div className="sm:col-span-2">
                    <UniversalDropdown<string>
                      label="Display location"
                      options={displayLocationOptions}
                      value={form.displayLocation}
                      onChange={(value) =>
                        updateField("displayLocation", value)
                      }
                      placeholder="Select location"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Action and media"
                description="Add an optional action button and image."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Button text">
                    <input
                      value={form.buttonText}
                      onChange={(event) =>
                        updateField("buttonText", event.target.value)
                      }
                      placeholder="Book Repair"
                      className="admin-input"
                    />
                  </FormField>

                  <FormField label="Button link">
                    <input
                      value={form.buttonLink}
                      onChange={(event) =>
                        updateField("buttonLink", event.target.value)
                      }
                      placeholder="/book-repair"
                      className="admin-input"
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <div className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <label className="block text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                            Announcement Image
                          </label>

                          <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                            JPG, PNG or WEBP only. Max 5MB.
                          </p>
                        </div>

                        {selectedImage && (
                          <button
                            type="button"
                            onClick={removeAnnouncementImage}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[#d8cdb6] bg-white px-5 py-8 text-center transition hover:bg-[#f7f5ef] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAnnouncementImageChange}
                          className="hidden"
                        />

                        <span className="text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                          Click to upload announcement image
                        </span>

                        <span className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                          This image will show in popup and slideshow
                        </span>
                      </label>

                      {imageError && (
                        <p className="mt-3 text-sm font-bold text-red-600 dark:text-red-300">
                          {imageError}
                        </p>
                      )}

                      {(imagePreview || form.imageUrl) && (
                        <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#d8cdb6] bg-white dark:border-[#302c24] dark:bg-[#1a1712]">
                          <img
                            src={imagePreview || form.imageUrl}
                            alt="Announcement preview"
                            className="h-56 w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection
                title="Schedule and behaviour"
                description="Control timing, priority and repeat behaviour."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Start date and time">
                    <input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(event) =>
                        updateField("startAt", event.target.value)
                      }
                      className="admin-input"
                    />
                  </FormField>

                  <FormField label="End date and time">
                    <input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(event) =>
                        updateField("endAt", event.target.value)
                      }
                      className="admin-input"
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <UniversalDropdown<number>
                      label="Priority"
                      options={priorityOptions}
                      value={form.priority}
                      onChange={(value) => updateField("priority", value)}
                      placeholder="Select priority"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <ToggleCard
                    checked={form.isActive}
                    onChange={(checked) => updateField("isActive", checked)}
                    title="Active"
                    description="Allow this announcement to be shown."
                  />

                  <ToggleCard
                    checked={form.showOnce}
                    onChange={(checked) => updateField("showOnce", checked)}
                    title="Show as one-time popup"
                    description="Turn on to show this announcement once in a popup. Turn off to keep it in the dashboard slideshow."
                  />
                </div>
              </FormSection>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24">
              <AnnouncementPreview form={form} imagePreview={imagePreview} />

              <section className="rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
                <h2 className="text-lg font-black">
                  {editingId ? "Save changes" : "Publish announcement"}
                </h2>

                <p className="mt-2 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  Review the preview before saving this announcement.
                </p>

                <div className="mt-5 space-y-2">
                  <ChecklistItem completed={form.title.trim().length >= 3}>
                    Title added
                  </ChecklistItem>

                  <ChecklistItem completed={form.message.trim().length >= 5}>
                    Message added
                  </ChecklistItem>

                  <ChecklistItem completed={form.announcementType !== ""}>
                    Type selected
                  </ChecklistItem>

                  <ChecklistItem completed={form.displayLocation !== ""}>
                    Location selected
                  </ChecklistItem>

                  <ChecklistItem
                    completed={
                      Boolean(form.buttonText.trim()) ===
                      Boolean(form.buttonLink.trim())
                    }
                  >
                    Button configuration valid
                  </ChecklistItem>
                </div>

                <div className="mt-6 space-y-3">
                  <ActionButton
                    type="submit"
                    loading={saving}
                    loadingText="Saving..."
                    variant="dark"
                    fullWidth
                    spinnerOnly
                    className="h-12 cursor-pointer rounded-xl"
                  >
                    {editingId ? "Update Announcement" : "Create Announcement"}
                  </ActionButton>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="h-12 w-full rounded-xl border border-[#d8cdb6] text-sm font-black transition hover:bg-[#f2eadb] disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016]"
                  >
                    {editingId ? "Cancel edit" : "Back to overview"}
                  </button>
                </div>
              </section>
            </aside>
          </form>
        )}
      </section>

      <DeleteAnnouncementModal
        announcement={announcementToDelete}
        deleting={
          announcementToDelete !== null &&
          deletingId === announcementToDelete.announcementId
        }
        onCancel={() => {
          if (!deletingId) {
            setAnnouncementToDelete(null);
          }
        }}
        onConfirm={() => void confirmDeleteAnnouncement()}
      />
    </main>
  );
}

function AnnouncementTabs({
  activeTab,
  editing,
  onChange
}: {
  activeTab: AnnouncementTab;
  editing: boolean;
  onChange: (tab: AnnouncementTab) => void;
}) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-1.5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div
        role="tablist"
        aria-label="Announcement sections"
        className="grid grid-cols-2 gap-1.5"
      >
        <TabButton
          active={activeTab === "overview"}
          onClick={() => onChange("overview")}
        >
          Overview
        </TabButton>

        <TabButton
          active={activeTab === "editor"}
          onClick={() => onChange("editor")}
        >
          {editing ? "Edit Announcement" : "Create Announcement"}
        </TabButton>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-11 rounded-xl px-3 text-xs font-black transition sm:text-sm ${
        active
          ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#d6b46a] dark:text-[#11110f]"
          : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
      }`}
    >
      {children}
    </button>
  );
}

function AnnouncementCard({
  announcement,
  toggling,
  onEdit,
  onDelete,
  onToggleActive
}: {
  announcement: AdminAnnouncement;
  toggling: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const state = getAnnouncementState(announcement);

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm transition hover:border-[#c8b98f] hover:shadow-md dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b]">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AnnouncementStateBadge state={state} />

            <MetaBadge>
              {formatAnnouncementType(announcement.announcementType)}
            </MetaBadge>

            <MetaBadge>
              {formatAnnouncementType(announcement.displayLocation)}
            </MetaBadge>
          </div>

          <h2 className="mt-4 text-xl font-black leading-tight sm:text-2xl">
            {announcement.title}
          </h2>

          <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
            {announcement.message}
          </p>

          <div className="mt-5 grid gap-4 border-t border-[#eadfca] pt-5 dark:border-[#302c24] sm:grid-cols-2 xl:grid-cols-4">
            <InfoItem
              label="Audience"
              value={formatAnnouncementType(announcement.audience)}
            />

            <InfoItem
              label="Starts"
              value={formatDateTime(announcement.startAt) || "Immediately"}
            />

            <InfoItem
              label="Ends"
              value={formatDateTime(announcement.endAt) || "No expiry"}
            />

            <InfoItem
              label="Priority"
              value={getPriorityLabel(announcement.priority)}
            />
          </div>
        </div>

        <aside className="border-t border-[#eadfca] pt-5 dark:border-[#302c24] lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-xs font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
            >
              <EditIcon />
              Edit
            </button>

            <button
              type="button"
              disabled={toggling}
              onClick={onToggleActive}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8cdb6] px-4 text-xs font-black transition hover:bg-[#f2eadb] disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016]"
            >
              {toggling
                ? "Updating..."
                : announcement.isActive
                  ? "Deactivate"
                  : "Activate"}
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-black text-red-700 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10 lg:col-span-1"
            >
              <DeleteIcon />
              Delete announcement
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-[#fff8e7] p-4 dark:bg-[#11110f]">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Behaviour
            </p>

            <p className="mt-2 text-xs font-bold">
              {announcement.showOnce ? "Show once" : "Can appear again"}
            </p>

            <p className="mt-1 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
              {announcement.buttonText
                ? `Action: ${announcement.buttonText}`
                : "No action button"}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function FormSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
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
  count,
  children
}: {
  label: string;
  required?: boolean;
  count?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
        <span>
          {label}

          {required && (
            <span className="ml-1 text-red-600 dark:text-red-300">*</span>
          )}
        </span>

        {count && <span className="font-semibold text-[#8f8778]">{count}</span>}
      </span>

      {children}
    </label>
  );
}

function ToggleCard({
  checked,
  onChange,
  title,
  description
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition ${
        checked
          ? "border-[#d6b46a] bg-[#fff4cc] dark:border-[#d6b46a]/50 dark:bg-[#d6b46a]/10"
          : "border-[#d8cdb6] bg-[#fffaf0] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-black">{title}</p>

        <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />

      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-[#1f1a12] dark:bg-[#d6b46a]"
            : "bg-[#cfc4ae] dark:bg-[#40392e]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </label>
  );
}

function AnnouncementPreview({
  form,
  imagePreview
}: {
  form: AnnouncementForm;
  imagePreview: string;
}) {
  const previewImage = imagePreview || form.imageUrl.trim();

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="border-b border-[#d8cdb6] px-5 py-4 dark:border-[#302c24]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
          Live preview
        </p>
      </div>

      {previewImage && (
        <div className="flex h-44 items-center justify-center overflow-hidden bg-[#f3efe6] dark:bg-[#0f0e0c]">
          <img
            src={previewImage}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <MetaBadge>{formatAnnouncementType(form.announcementType)}</MetaBadge>

          <AnnouncementStateBadge
            state={form.isActive ? "active" : "inactive"}
          />
        </div>

        <h2 className="mt-4 text-2xl font-black leading-tight">
          {form.title.trim() || "Announcement title"}
        </h2>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {form.message.trim() || "Your announcement message will appear here."}
        </p>

        {form.buttonText.trim() && (
          <div className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1f1a12] px-5 text-xs font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]">
            {form.buttonText}
          </div>
        )}

        <div className="mt-5 border-t border-[#d8cdb6] pt-4 dark:border-[#302c24]">
          <InfoItem
            label="Audience"
            value={formatAnnouncementType(form.audience)}
          />

          <div className="mt-3">
            <InfoItem
              label="Location"
              value={formatAnnouncementType(form.displayLocation)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChecklistItem({
  completed,
  children
}: {
  completed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
          completed
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
            : "border-[#d8cdb6] dark:border-[#302c24]"
        }`}
      >
        {completed ? "✓" : ""}
      </span>

      <p className="text-xs font-bold">{children}</p>
    </div>
  );
}

function DeleteAnnouncementModal({
  announcement,
  deleting,
  onCancel,
  onConfirm
}: {
  announcement: AdminAnnouncement | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!announcement) return null;

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-announcement-title"
        className="w-full max-w-md rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 shadow-2xl dark:border-[#302c24] dark:bg-[#1a1712]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300">
          <DeleteIcon />
        </div>

        <h2 id="delete-announcement-title" className="mt-5 text-2xl font-black">
          Delete this announcement?
        </h2>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            {announcement.title}
          </span>{" "}
          will be permanently removed.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="h-12 rounded-xl border border-[#d8cdb6] text-sm font-black transition hover:bg-[#f2eadb] disabled:opacity-60 dark:border-[#302c24] dark:hover:bg-[#242016]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="h-12 rounded-xl bg-red-700 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsLoading() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
        />
      ))}
    </div>
  );
}

function EmptyAnnouncements({
  hasFilters,
  onClear,
  onCreate
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#d8cdb6] bg-[#fffdf7] px-6 py-14 text-center dark:border-[#302c24] dark:bg-[#1a1712]">
      <h2 className="text-xl font-black">No announcements found</h2>

      <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Create a customer update or change the current search and filter.
      </p>

      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-[#d8cdb6] px-5 py-3 text-sm font-black dark:border-[#302c24]"
          >
            Clear filters
          </button>
        )}

        <button
          type="button"
          onClick={onCreate}
          className="rounded-xl bg-[#1f1a12] px-5 py-3 text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Create announcement
        </button>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 py-3 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black">{value}</p>
    </div>
  );
}

function MetaBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#d8cdb6] bg-[#fff8e7] px-3 py-1 text-[10px] font-black text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]">
      {children}
    </span>
  );
}

function AnnouncementStateBadge({ state }: { state: AnnouncementFilter }) {
  const styles = {
    all: "",
    active:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
    inactive:
      "border-[#d8cdb6] bg-[#fff8e7] text-[#6f6758] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093]",
    scheduled:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
    expired:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black capitalize ${styles[state]}`}
    >
      {state}
    </span>
  );
}

function getAnnouncementState(
  announcement: Pick<AdminAnnouncement, "startAt" | "endAt" | "isActive">
): Exclude<AnnouncementFilter, "all"> {
  if (!announcement.isActive) {
    return "inactive";
  }

  const now = new Date();

  if (announcement.startAt) {
    const startDate = new Date(announcement.startAt);

    if (!Number.isNaN(startDate.getTime()) && startDate > now) {
      return "scheduled";
    }
  }

  if (announcement.endAt) {
    const endDate = new Date(announcement.endAt);

    if (!Number.isNaN(endDate.getTime()) && endDate <= now) {
      return "expired";
    }
  }

  return "active";
}

function toPayload(form: AnnouncementForm): CreateAnnouncement {
  return {
    title: form.title.trim(),
    message: form.message.trim(),
    announcementType: form.announcementType,
    audience: form.audience,
    displayLocation: form.displayLocation,
    imageUrl: form.imageUrl.trim() || null,
    buttonText: form.buttonText.trim() || null,
    buttonLink: form.buttonLink.trim() || null,

    startAt: toUtcIso(form.startAt),
    endAt: toUtcIso(form.endAt),

    priority: form.priority,
    isActive: form.isActive,
    showOnce: form.showOnce
  };
}

function announcementToPayload(
  announcement: AdminAnnouncement,
  isActive: boolean
): CreateAnnouncement {
  return {
    title: announcement.title,
    message: announcement.message,
    announcementType: announcement.announcementType,
    audience: announcement.audience,
    displayLocation: announcement.displayLocation,
    imageUrl: announcement.imageUrl || null,
    buttonText: announcement.buttonText || null,
    buttonLink: announcement.buttonLink || null,
    startAt: announcement.startAt || null,
    endAt: announcement.endAt || null,
    priority: announcement.priority,
    isActive,
    showOnce: announcement.showOnce
  };
}

function isValidAnnouncementLink(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("tel:") ||
    value.startsWith("mailto:")
  );
}

function isValidImageUrl(value: string) {
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getPriorityLabel(priority: number) {
  if (priority === 1) return "Low";
  if (priority === 3) return "High";
  if (priority === 4) return "Urgent";

  return "Normal";
}

function formatAnnouncementType(type: string) {
  if (type === "ServiceAlert") return "Service Alert";
  if (type === "ShopNotice") return "Shop Notice";
  if (type === "RepairReminder") return "Repair Reminder";
  if (type === "FeedbackHighlight") return "Customer Trust";
  if (type === "CustomerDashboard") return "Customer Dashboard";
  if (type === "ProductsPage") return "Products Page";
  if (type === "BookRepairPage") return "Book Repair Page";
  if (type === "AllPublicPages") return "All Public Pages";
  if (type === "SignedCustomers") return "Signed Customers";
  if (type === "UnsignedVisitors") return "Unsigned Visitors";

  return type;
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
        Showing {startRecord}-{endRecord} of {totalRecords} announcements
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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m5 19 3.5-.7L18 8.8 15.2 6 5.7 15.5 5 19Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 7h14M10 11v5M14 11v5M8 7l1-3h6l1 3M7 7l1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function toUtcIso(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
const allowedAnnouncementImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedAnnouncementImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const maxAnnouncementImageSize = 5 * 1024 * 1024;

function validateAnnouncementImage(file: File) {
  const fileName = file.name.toLowerCase();

  const hasAllowedType = allowedAnnouncementImageTypes.includes(file.type);

  const hasAllowedExtension = allowedAnnouncementImageExtensions.some(
    (extension) => fileName.endsWith(extension)
  );

  if (!hasAllowedType || !hasAllowedExtension) {
    return "Only JPG, PNG and WEBP images are allowed.";
  }

  if (file.size > maxAnnouncementImageSize) {
    return "Image must be less than 5MB.";
  }

  return "";
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
export default AdminAnnouncementsPage;
