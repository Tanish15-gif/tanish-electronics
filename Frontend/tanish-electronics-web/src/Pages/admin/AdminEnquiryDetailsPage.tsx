import { useApiAuth } from "../../hooks/useApiAuth";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { Link, useParams } from "react-router-dom";
import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import {
  addEnquiryNote,
  getAdminEnquiryById,
  getEnquiryNotes,
  getEnquiryStatuses,
  updateAdminEnquiryStatus,
  type AdminEnquiryDetails,
  type EnquiryNote
} from "../../Services/adminEnquiryService";
import type { LookUpItem } from "../../Services/serviceRequestService";

type EnquiryTab = "overview" | "follow-up";

function AdminEnquiryDetailsPage() {
  const { id } = useParams();
  const { getToken } = useApiAuth();

  const [enquiry, setEnquiry] = useState<AdminEnquiryDetails | null>(null);

  const [statuses, setStatuses] = useState<LookUpItem[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState(0);

  const [activeTab, setActiveTab] = useState<EnquiryTab>("overview");

  const [notes, setNotes] = useState<EnquiryNote[]>([]);
  const [noteText, setNoteText] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void loadPage();
  }, [id]);

  useEffect(() => {
    if (enquiry) {
      document.title = `Enquiry #${enquiry.enquiryId} | Tanish Electronics Admin`;
    } else {
      document.title = "Enquiry Details | Tanish Electronics Admin";
    }

    return () => {
      document.title = "Tanish Electronics";
    };
  }, [enquiry]);

  const statusOptions = useMemo<DropdownOption<number>[]>(
    () =>
      statuses.map((status) => ({
        value: status.id,
        label: status.name
      })),
    [statuses]
  );

  const statusChanged =
    enquiry !== null &&
    selectedStatusId > 0 &&
    selectedStatusId !== enquiry.statusId;

  async function loadPage() {
    try {
      const enquiryId = Number(id);

      if (!id || Number.isNaN(enquiryId) || enquiryId <= 0) {
        setError("Invalid enquiry ID.");
        setEnquiry(null);
        return;
      }

      setLoading(true);
      setNotesLoading(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const [enquiryData, statusData, notesData] = await Promise.all([
        getAdminEnquiryById(enquiryId, token),
        getEnquiryStatuses(),
        getEnquiryNotes(enquiryId, token)
      ]);

      setEnquiry(enquiryData);
      setSelectedStatusId(enquiryData.statusId);
      setStatuses(statusData);
      setNotes(notesData);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load enquiry."
      );

      setEnquiry(null);
    } finally {
      setLoading(false);
      setNotesLoading(false);
    }
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enquiry) return;

    if (selectedStatusId <= 0) {
      setError("Please select an enquiry status.");
      return;
    }

    if (selectedStatusId === enquiry.statusId) {
      setError("Please select a different status.");
      return;
    }

    try {
      setSavingStatus(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      await updateAdminEnquiryStatus(
        enquiry.enquiryId,
        selectedStatusId,
        token
      );

      const updatedEnquiry = await getAdminEnquiryById(
        enquiry.enquiryId,
        token
      );

      setEnquiry(updatedEnquiry);
      setSelectedStatusId(updatedEnquiry.statusId);
      setSuccess("Enquiry status updated successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update enquiry status."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!enquiry) return;

    const cleanNote = noteText.trim();

    if (!cleanNote) {
      setError("Please write a follow-up note.");
      return;
    }

    if (cleanNote.length > 1000) {
      setError("Note cannot be more than 1000 characters.");
      return;
    }

    try {
      setNoteSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const createdNote = await addEnquiryNote(
        enquiry.enquiryId,
        {
          note: cleanNote
        },
        token
      );

      setNotes((currentNotes) => [createdNote, ...currentNotes]);

      setNoteText("");
      setSuccess("Follow-up note added successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to add follow-up note."
      );
    } finally {
      setNoteSaving(false);
    }
  }

  if (loading) {
    return <EnquiryLoading />;
  }

  if (!enquiry) {
    return (
      <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/enquiries"
            className="inline-flex items-center gap-2 text-sm font-black text-[#8a6624] dark:text-[#d6b46a]"
          >
            <BackIcon />
            Back to enquiries
          </Link>

          <div className="mt-8 rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error || "Enquiry not found."}
          </div>
        </div>
      </main>
    );
  }

  const whatsappPhone = formatWhatsappPhone(enquiry.phoneNumber);

  const whatsappMessage = encodeURIComponent(
    [
      `Hello ${enquiry.fullName},`,
      "This is Tanish Electronics regarding your enquiry.",
      enquiry.productName
        ? `Product: ${enquiry.productName}`
        : "General enquiry",
      `Enquiry number: #${enquiry.enquiryId}`
    ].join("\n")
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/admin/enquiries"
          className="inline-flex items-center gap-2 text-sm font-black text-[#8a6624] transition hover:text-[#5e4315] dark:text-[#d6b46a]"
        >
          <BackIcon />
          Enquiries
        </Link>

        {/* Header */}
        <header className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Product enquiry
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                  Enquiry #{enquiry.enquiryId}
                </h1>

                <EnquiryStatusBadge status={enquiry.status} />
              </div>

              <p className="mt-3 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Received {formatDateTime(enquiry.createdAt)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <a
                href={`tel:${enquiry.phoneNumber}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] px-4 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                <PhoneIcon />
                Call
              </a>

              <a
                href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-4 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#d6b46a] dark:text-[#11110f]"
              >
                <MessageIcon />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-[#d8cdb6] dark:border-[#302c24] lg:grid-cols-4">
            <SummaryItem label="Customer" value={enquiry.fullName} />

            <SummaryItem label="Phone" value={enquiry.phoneNumber} />

            <SummaryItem
              label="Product"
              value={enquiry.productName || "General enquiry"}
            />

            <SummaryItem
              label="Price"
              value={
                enquiry.productPrice !== null &&
                enquiry.productPrice !== undefined
                  ? formatPrice(enquiry.productPrice)
                  : "Not available"
              }
            />
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

        <EnquiryTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          noteCount={notes.length}
        />

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <InfoCard
                  title="Customer details"
                  description="Contact details submitted with this enquiry."
                >
                  <InfoRow label="Full name" value={enquiry.fullName} />

                  <InfoRow label="Phone number" value={enquiry.phoneNumber} />

                  <InfoRow
                    label="Email address"
                    value={enquiry.email || "Not provided"}
                  />
                </InfoCard>

                <InfoCard
                  title="Enquiry message"
                  description="The subject and message sent by the customer."
                >
                  <InfoRow
                    label="Subject"
                    value={enquiry.subject || "No subject"}
                  />

                  <div className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-5 dark:border-[#302c24] dark:bg-[#11110f]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
                      Customer message
                    </p>

                    <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-7 text-[#4f4638] dark:text-[#d8cdb6]">
                      {enquiry.message || "No message provided."}
                    </p>
                  </div>
                </InfoCard>

                <ProductSummaryCard enquiry={enquiry} />
              </div>
            )}

            {activeTab === "follow-up" && (
              <FollowUpNotesCard
                notes={notes}
                noteText={noteText}
                setNoteText={setNoteText}
                notesLoading={notesLoading}
                noteSaving={noteSaving}
                onSubmit={handleAddNote}
              />
            )}
          </div>

          {/* Sticky action panel */}
          <aside className="space-y-6 xl:sticky xl:top-24">
            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Workflow
              </p>

              <h2 className="mt-2 text-2xl font-black">Update enquiry</h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Current status:{" "}
                <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                  {enquiry.status}
                </span>
              </p>

              <form onSubmit={handleStatusUpdate} className="mt-5 space-y-4">
                <UniversalDropdown<number>
                  label="New status"
                  options={statusOptions}
                  value={selectedStatusId || null}
                  onChange={setSelectedStatusId}
                  placeholder="Select enquiry status"
                />

                <ActionButton
                  type="submit"
                  loading={savingStatus}
                  loadingText="Updating..."
                  variant="dark"
                  fullWidth
                  spinnerOnly
                  disabled={!statusChanged}
                  className="h-12 cursor-pointer rounded-xl"
                >
                  {statusChanged ? "Update Status" : "Current Status Selected"}
                </ActionButton>
              </form>
            </section>

            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
              <h2 className="text-xl font-black">Contact customer</h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Reach the customer about availability, price or pickup.
              </p>

              <div className="mt-5 grid gap-3">
                <a
                  href={`tel:${enquiry.phoneNumber}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
                >
                  <PhoneIcon />
                  Call {enquiry.fullName}
                </a>

                <a
                  href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
                >
                  <MessageIcon />
                  Send WhatsApp
                </a>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function EnquiryTabs({
  activeTab,
  onChange,
  noteCount
}: {
  activeTab: EnquiryTab;
  onChange: (tab: EnquiryTab) => void;
  noteCount: number;
}) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-1.5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div
        role="tablist"
        aria-label="Enquiry details sections"
        className="grid grid-cols-2 gap-1.5"
      >
        <TabButton
          active={activeTab === "overview"}
          onClick={() => onChange("overview")}
        >
          Overview
        </TabButton>

        <TabButton
          active={activeTab === "follow-up"}
          onClick={() => onChange("follow-up")}
        >
          Follow-up Notes
          {noteCount > 0 && (
            <span className="ml-2 rounded-full bg-current/10 px-2 py-0.5 text-[10px]">
              {noteCount}
            </span>
          )}
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

function ProductSummaryCard({ enquiry }: { enquiry: AdminEnquiryDetails }) {
  return (
    <InfoCard
      title="Product details"
      description="Product associated with this enquiry."
    >
      <InfoRow
        label="Product"
        value={enquiry.productName || "General enquiry"}
      />

      <InfoRow
        label="Listed price"
        value={
          enquiry.productPrice !== null && enquiry.productPrice !== undefined
            ? formatPrice(enquiry.productPrice)
            : "Not available"
        }
      />

      {enquiry.productId ? (
        <Link
          to={`/admin/products/${enquiry.productId}/edit`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f]"
        >
          Open Product
          <ArrowRightIcon />
        </Link>
      ) : (
        <p className="text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          This enquiry is not connected to a specific product.
        </p>
      )}
    </InfoCard>
  );
}

function InfoCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="border-b border-[#d8cdb6] pb-4 dark:border-[#302c24]">
        <h2 className="text-xl font-black tracking-tight">{title}</h2>

        {description && (
          <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
            {description}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[#eadfca] pb-4 last:border-0 last:pb-0 dark:border-[#302c24] sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="break-words text-sm font-bold leading-6">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-r border-[#d8cdb6] px-5 py-4 last:border-r-0 dark:border-[#302c24] lg:border-b-0">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function FollowUpNotesCard({
  notes,
  noteText,
  setNoteText,
  notesLoading,
  noteSaving,
  onSubmit
}: {
  notes: EnquiryNote[];
  noteText: string;
  setNoteText: (value: string) => void;
  notesLoading: boolean;
  noteSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="border-b border-[#d8cdb6] pb-5 dark:border-[#302c24]">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
          Internal activity
        </p>

        <h2 className="mt-2 text-2xl font-black">Follow-up notes</h2>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
          Save call updates, customer replies, price discussion and next steps.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-5">
        <label
          htmlFor="enquiry-follow-up-note"
          className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]"
        >
          Add note
        </label>

        <textarea
          id="enquiry-follow-up-note"
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Example: Called customer. They will visit tomorrow evening."
          className="admin-input resize-none"
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-bold text-[#8f8778]">
            {noteText.length}/1000 characters
          </p>

          <ActionButton
            type="submit"
            loading={noteSaving}
            loadingText="Adding..."
            variant="gold"
            fullWidth={false}
            className="h-11 min-w-[130px] cursor-pointer rounded-xl px-5 py-0"
          >
            Add Note
          </ActionButton>
        </div>
      </form>

      <div className="mt-6 border-t border-[#d8cdb6] pt-5 dark:border-[#302c24]">
        {notesLoading ? (
          <p className="text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Loading follow-up notes...
          </p>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8cdb6] bg-[#fff8e7] p-6 text-center dark:border-[#302c24] dark:bg-[#11110f]">
            <p className="text-sm font-black">No follow-up notes</p>

            <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
              Add the first note after contacting the customer.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <article
                key={note.enquiryNoteId}
                className="rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]"
              >
                <p className="whitespace-pre-line text-sm font-semibold leading-6">
                  {note.note}
                </p>

                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#8f8778]">
                  {formatDateTime(note.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EnquiryStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let styles =
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";

  if (normalized.includes("contact") || normalized.includes("progress")) {
    styles =
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300";
  }

  if (
    normalized.includes("completed") ||
    normalized.includes("closed") ||
    normalized.includes("resolved")
  ) {
    styles =
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (normalized.includes("cancel") || normalized.includes("reject")) {
    styles =
      "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${styles}`}
    >
      {status}
    </span>
  );
}

function EnquiryLoading() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 dark:bg-[#11110f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-32 rounded bg-[#eee5d4] dark:bg-[#302c24]" />

        <div className="mt-6 rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-7 dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="h-10 w-64 rounded-lg bg-[#eee5d4] dark:bg-[#302c24]" />
          <div className="mt-4 h-5 w-44 rounded bg-[#eee5d4] dark:bg-[#302c24]" />
          <div className="mt-8 h-20 rounded-xl bg-[#eee5d4] dark:bg-[#302c24]" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="h-96 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />
          <div className="h-80 rounded-[1.75rem] bg-[#eee5d4] dark:bg-[#242016]" />
        </div>
      </div>
    </main>
  );
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString("en-IN")}`;
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

function formatWhatsappPhone(phone: string) {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  return digits;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M4 5h16v12H9l-5 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
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

export default AdminEnquiryDetailsPage;
