import {
  useEffect,
  useState,
  useMemo,
  type FormEvent,
  type ReactNode
} from "react";
import { Link, useParams } from "react-router-dom";
import { useApiAuth } from "../../hooks/useApiAuth";
import {
  getAdminServiceRequestById,
  getServiceStatuses,
  updateAdminServiceRequestPricing,
  updateAdminServiceRequestStatus,
  updateRepairWorkNotes,
  type AdminServiceRequestDetails
} from "../../Services/adminServiceRequestService";
import type { LookUpItem } from "../../Services/serviceRequestService";
import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import { useShopSettings } from "../../hooks/useShopSettings";

type RequestTab = "overview" | "repair" | "activity";

const paymentStatusOptions: DropdownOption<string>[] = [
  {
    value: "Pending",
    label: "Pending"
  },
  {
    value: "Paid",
    label: "Paid"
  },
  {
    value: "Not Required",
    label: "Not Required"
  }
];
function AdminServiceRequestDetailsPage() {
  const { settings } = useShopSettings();
  const { id } = useParams();

  const [request, setRequest] = useState<AdminServiceRequestDetails | null>(
    null
  );
  const [statuses, setStatuses] = useState<LookUpItem[]>([]);

  const [selectedStatusId, setSelectedStatusId] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [estimatedPrice, setEstimatedPrice] = useState<string>("");
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");

  const [savingPricing, setSavingPricing] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  const [isCorrection, setIsCorrection] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [workNotes, setWorkNotes] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [warrantyNote, setWarrantyNote] = useState("");
  const [showRepairNotesToCustomer, setShowRepairNotesToCustomer] =
    useState(true);

  const [savingWorkNotes, setSavingWorkNotes] = useState(false);

  const [activeTab, setActiveTab] = useState<RequestTab>("overview");

  const { getToken } = useApiAuth();

  useEffect(() => {
    const previousTitle = document.title;
    if (request) {
      document.title = `${request.requestNumber} | ${settings.shopName}`;
    } else {
      document.title = `Service Request | ${settings.shopName}`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [request]);

  const statusOptions = useMemo<DropdownOption<number>[]>(
    () =>
      statuses.map((status) => ({
        value: status.id,
        label: status.name
      })),
    [statuses]
  );

  const currentStatusNormalized = request?.currentStatus.toLowerCase() ?? "";

  const isTerminalRequest =
    currentStatusNormalized.includes("completed") ||
    currentStatusNormalized.includes("cancelled");

  const statusHasChanged =
    selectedStatusId > 0 && selectedStatusId !== request?.currentStatusId;

  useEffect(() => {
    loadPageData();
  }, [id]);

  async function loadPageData() {
    try {
      if (!id) return;

      const token = await getToken();

      setLoading(true);
      setError("");

      const [requestData, statusData] = await Promise.all([
        getAdminServiceRequestById(Number(id), token),
        getServiceStatuses()
      ]);

      setRequest(requestData);
      setStatuses(statusData);
      setSelectedStatusId(requestData.currentStatusId);
      setEstimatedPrice(requestData.estimatedPrice?.toString() ?? "");
      setFinalPrice(requestData.finalPrice?.toString() ?? "");
      setAdminNotes(requestData.adminNotes ?? "");
      setPaymentStatus(requestData.paymentStatus || "Pending");
      setDiagnosis(requestData.diagnosis ?? "");
      setWorkNotes(requestData.workNotes ?? "");
      setPartsUsed(requestData.partsUsed ?? "");
      setWarrantyNote(requestData.warrantyNote ?? "");
      setShowRepairNotesToCustomer(
        requestData.showRepairNotesToCustomer ?? true
      );
    } catch {
      setError("Failed to load service request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!request) return;

    if (selectedStatusId === request.currentStatusId) {
      setError("Please select a different status.");
      return;
    }

    const currentStatus = request.currentStatus.toLowerCase();
    const isTerminalStatus =
      currentStatus.includes("completed") ||
      currentStatus.includes("cancelled");

    if (isTerminalStatus && !isCorrection) {
      setError(
        "Tick correction before changing a completed/cancelled request."
      );
      return;
    }

    if (isTerminalStatus && note.trim() === "") {
      setError("Correction note is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      const result = await updateAdminServiceRequestStatus(
        request.serviceRequestId,
        {
          newStatusId: selectedStatusId,
          note,
          isCorrection
        },
        token
      );

      setSuccess(result.message);
      setNote("");
      setIsCorrection(false);

      const updatedRequest = await getAdminServiceRequestById(
        request.serviceRequestId,
        token
      );

      setRequest(updatedRequest);
      setSelectedStatusId(updatedRequest.currentStatusId);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update status.");
      }
    } finally {
      setSaving(false);
    }
  }

  function toNullableNumber(value: string) {
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      return null;
    }

    return Number(trimmedValue);
  }

  async function handlePricingUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!request) return;

    const parsedEstimatedPrice = toNullableNumber(estimatedPrice);
    const parsedFinalPrice = toNullableNumber(finalPrice);

    if (parsedEstimatedPrice !== null && Number.isNaN(parsedEstimatedPrice)) {
      setError("Estimated price must be a valid number.");
      return;
    }

    if (parsedFinalPrice !== null && Number.isNaN(parsedFinalPrice)) {
      setError("Final price must be a valid number.");
      return;
    }

    try {
      setSavingPricing(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      const result = await updateAdminServiceRequestPricing(
        request.serviceRequestId,
        {
          estimatedPrice: parsedEstimatedPrice,
          finalPrice: parsedFinalPrice,
          adminNotes: adminNotes.trim() || null,
          paymentStatus
        },
        token
      );

      const updatedRequest = await getAdminServiceRequestById(
        request.serviceRequestId,
        token
      );

      setRequest(updatedRequest);
      setEstimatedPrice(updatedRequest.estimatedPrice?.toString() ?? "");
      setFinalPrice(updatedRequest.finalPrice?.toString() ?? "");
      setAdminNotes(updatedRequest.adminNotes ?? "");
      setPaymentStatus(updatedRequest.paymentStatus || "Pending");

      setSuccess(result.message);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update pricing.");
      }
    } finally {
      setSavingPricing(false);
    }
  }

  function formatPrice(price?: number | null) {
    if (price === null || price === undefined) {
      return "Not added";
    }

    return `₹${price.toLocaleString("en-IN")}`;
  }

  function getWhatsappNumber(phoneNumber: string) {
    let digits = phoneNumber.replace(/\D/g, "");

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
  function getWhatsappMessage() {
    if (!request) {
      return "";
    }

    return encodeURIComponent(
      `Hello ${request.customerName}, this is ${settings.shopName} regarding your service request ${request.requestNumber}.`
    );
  }
  async function handleRepairWorkNotesUpdate() {
    if (!request) return;

    if (diagnosis.trim().length > 1000) {
      setError("Diagnosis cannot be more than 1000 characters.");
      return;
    }

    if (workNotes.trim().length > 1500) {
      setError("Work notes cannot be more than 1500 characters.");
      return;
    }

    if (partsUsed.trim().length > 1000) {
      setError("Parts used cannot be more than 1000 characters.");
      return;
    }

    if (warrantyNote.trim().length > 500) {
      setError("Warranty note cannot be more than 500 characters.");
      return;
    }

    try {
      setSavingWorkNotes(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      await updateRepairWorkNotes(
        request.serviceRequestId,
        {
          diagnosis: diagnosis.trim() || null,
          workNotes: workNotes.trim() || null,
          partsUsed: partsUsed.trim() || null,
          warrantyNote: warrantyNote.trim() || null,
          showRepairNotesToCustomer
        },
        token
      );

      const updatedRequest = await getAdminServiceRequestById(
        request.serviceRequestId,
        token
      );

      setRequest(updatedRequest);
      setDiagnosis(updatedRequest.diagnosis ?? "");
      setWorkNotes(updatedRequest.workNotes ?? "");
      setPartsUsed(updatedRequest.partsUsed ?? "");
      setWarrantyNote(updatedRequest.warrantyNote ?? "");
      setShowRepairNotesToCustomer(updatedRequest.showRepairNotesToCustomer);

      setSuccess("Repair diagnosis and work notes updated.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update repair work notes."
      );
    } finally {
      setSavingWorkNotes(false);
    }
  }

  if (loading) {
    return (
      <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl py-16 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#d8cdb6] border-t-[#8a6624] dark:border-[#302c24] dark:border-t-[#d6b46a]" />
          <p className="mt-4 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
            Loading service request...
          </p>
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="te-sheet-bg min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error || "Request not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="te-sheet-bg min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <title>{request.requestNumber} | Admin Service Request</title>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Back navigation */}
        <Link
          to="/admin/service-requests"
          className="inline-flex items-center gap-2 text-sm font-black text-[#8a6624] transition hover:text-[#5e4315] dark:text-[#d6b46a] dark:hover:text-[#e7cb89]"
        >
          <BackIcon />
          Service requests
        </Link>

        {/* Request header */}
        <header className="mt-5 overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
                Service request
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl">
                  {request.requestNumber}
                </h1>

                <StatusBadge status={request.currentStatus} />
              </div>

              <p className="mt-3 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Created {new Date(request.createdAt).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${request.phoneNumber}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-transparent px-5 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:hover:bg-[#242016]"
              >
                <PhoneIcon />
                Call
              </a>

              <a
                href={`https://api.whatsapp.com/send?phone=${getWhatsappNumber(
                  request.phoneNumber
                )}&text=${getWhatsappMessage()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] transition hover:bg-[#33291b] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#c9a85f]"
              >
                <MessageIcon />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Compact summary */}
          <div className="grid grid-cols-2 border-t border-[#d8cdb6] dark:border-[#302c24] lg:grid-cols-4">
            <RequestSummaryItem label="Customer" value={request.customerName} />

            <RequestSummaryItem
              label="Service"
              value={request.serviceCategory}
            />

            <RequestSummaryItem label="Type" value={request.serviceType} />

            <RequestSummaryItem
              label="Final price"
              value={formatPrice(request.finalPrice)}
            />
          </div>
        </header>

        {/* Alerts */}
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

        {/* Tab navigation */}
        <RequestTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Tab content */}
          <div className="min-w-0">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <InfoCard
                  title="Customer"
                  description="Customer contact and account information."
                >
                  <InfoRow label="Name" value={request.customerName} />

                  <InfoRow label="Phone" value={request.phoneNumber} />

                  <InfoRow
                    label="Email"
                    value={request.email || "Not provided"}
                  />
                </InfoCard>

                <InfoCard
                  title="Service information"
                  description="Device, visit and booking details."
                >
                  <InfoRow label="Category" value={request.serviceCategory} />

                  <InfoRow label="Service type" value={request.serviceType} />

                  <InfoRow
                    label="Device"
                    value={
                      [request.deviceName, request.brand, request.modelName]
                        .filter(Boolean)
                        .join(" • ") || "Not provided"
                    }
                  />

                  <InfoRow
                    label="Preferred date"
                    value={request.preferredDate || "Not selected"}
                  />

                  <InfoRow
                    label="Preferred time"
                    value={request.preferredTimeSlot || "Not selected"}
                  />

                  <InfoRow
                    label="Visit address"
                    value={request.visitAddress || "Not provided"}
                  />

                  <InfoRow
                    label="Payment"
                    value={request.paymentStatus || "Pending"}
                  />

                  <InfoRow
                    label="Paid at"
                    value={
                      request.paidAt
                        ? new Date(request.paidAt).toLocaleString("en-IN")
                        : "Not paid yet"
                    }
                  />
                </InfoCard>

                <InfoCard
                  title="Reported issue"
                  description="Problem described by the customer."
                >
                  <p className="whitespace-pre-line text-sm font-semibold leading-7 text-[#6f6758] dark:text-[#a8a093]">
                    {request.issueDescription}
                  </p>
                </InfoCard>

                <InfoCard
                  title="Pricing summary"
                  description="Current estimate, final price and internal notes."
                >
                  <InfoRow
                    label="Estimated price"
                    value={formatPrice(request.estimatedPrice)}
                  />

                  <InfoRow
                    label="Final price"
                    value={formatPrice(request.finalPrice)}
                  />

                  <InfoRow
                    label="Admin notes"
                    value={request.adminNotes || "No notes"}
                  />
                </InfoCard>
              </div>
            )}

            {activeTab === "repair" && (
              <RepairWorkNotesCard
                diagnosis={diagnosis}
                setDiagnosis={setDiagnosis}
                workNotes={workNotes}
                setWorkNotes={setWorkNotes}
                partsUsed={partsUsed}
                setPartsUsed={setPartsUsed}
                warrantyNote={warrantyNote}
                setWarrantyNote={setWarrantyNote}
                showRepairNotesToCustomer={showRepairNotesToCustomer}
                setShowRepairNotesToCustomer={setShowRepairNotesToCustomer}
                saving={savingWorkNotes}
                onSave={handleRepairWorkNotesUpdate}
              />
            )}

            {activeTab === "activity" && (
              <div className="space-y-6">
                <InfoCard
                  title="Customer photos"
                  description="Images uploaded with this repair request."
                >
                  <CustomerPhotos images={request.images || []} />
                </InfoCard>

                <InfoCard
                  title="Status history"
                  description="Complete service-request activity."
                >
                  <StatusHistoryTimeline
                    history={request.statusHistory || []}
                  />
                </InfoCard>
              </div>
            )}
          </div>

          {/* Actions */}
          <aside className="space-y-6 xl:sticky xl:top-24">
            {/* Status update */}
            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Workflow
              </p>

              <h2 className="mt-2 text-2xl font-black">Update status</h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Current status:{" "}
                <span className="font-black text-[#1f1a12] dark:text-[#e8e3d8]">
                  {request.currentStatus}
                </span>
              </p>

              <form className="mt-5 space-y-4" onSubmit={handleStatusUpdate}>
                <UniversalDropdown<number>
                  label="New status"
                  options={statusOptions}
                  value={selectedStatusId || null}
                  onChange={setSelectedStatusId}
                  placeholder="Select request status"
                />

                <div>
                  <label className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
                    Status note
                  </label>

                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add an update for the customer..."
                    rows={4}
                    className="admin-input resize-none"
                  />
                </div>

                {isTerminalRequest && (
                  <label className="flex cursor-pointer gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
                    <input
                      type="checkbox"
                      checked={isCorrection}
                      onChange={(event) =>
                        setIsCorrection(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 accent-[#d6b46a]"
                    />

                    <span>
                      Correct terminal status
                      <span className="mt-1 block text-xs font-semibold">
                        Enable only when Completed or Cancelled was selected by
                        mistake.
                      </span>
                    </span>
                  </label>
                )}

                <ActionButton
                  type="submit"
                  loading={saving}
                  variant="dark"
                  fullWidth
                  className="h-12 cursor-pointer rounded-xl"
                  spinnerOnly
                  disabled={!statusHasChanged}
                >
                  {statusHasChanged
                    ? "Update Status"
                    : "Current Status Selected"}
                </ActionButton>
              </form>
            </section>

            {/* Pricing update */}
            <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Billing
              </p>

              <h2 className="mt-2 text-2xl font-black">Price and payment</h2>

              <form onSubmit={handlePricingUpdate} className="mt-5 space-y-4">
                <PriceInput
                  label="Estimated price"
                  value={estimatedPrice}
                  onChange={setEstimatedPrice}
                  placeholder="Example: 800"
                />

                <PriceInput
                  label="Final price"
                  value={finalPrice}
                  onChange={setFinalPrice}
                  placeholder="Example: 1200"
                />

                <UniversalDropdown<string>
                  label="Payment status"
                  options={paymentStatusOptions}
                  value={paymentStatus}
                  onChange={setPaymentStatus}
                  placeholder="Select payment status"
                />

                <div>
                  <label className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
                    Internal notes
                  </label>

                  <textarea
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    rows={4}
                    className="admin-input resize-none"
                    placeholder="Notes visible only to admin..."
                  />
                </div>

                <ActionButton
                  type="submit"
                  loading={savingPricing}
                  variant="gold"
                  fullWidth
                  spinnerOnly
                  className="h-12 cursor-pointer rounded-xl"
                >
                  Save Pricing
                </ActionButton>
              </form>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );

  type InfoCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
  };

  function InfoCard({ title, description, children }: InfoCardProps) {
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
      <div className="grid gap-1 border-b border-[#eadfca] pb-4 last:border-0 last:pb-0 dark:border-[#302c24] sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6">
        <dt className="text-xs font-black uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
          {label}
        </dt>

        <dd className="break-words text-sm font-bold leading-6">{value}</dd>
      </div>
    );
  }
  type CustomerPhotosProps = {
    images: {
      serviceRequestImageId: number;
      imageUrl: string;
      originalFileName?: string | null;
      createdAt: string;
    }[];
  };

  function CustomerPhotos({ images }: CustomerPhotosProps) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    function getImageUrl(imageUrl: string) {
      if (imageUrl.startsWith("http")) {
        return imageUrl;
      }

      return `${apiBaseUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
    }

    if (images.length === 0) {
      return (
        <p className="text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          No photos uploaded by customer.
        </p>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <a
            key={image.serviceRequestImageId}
            href={getImageUrl(image.imageUrl)}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#d8cdb6]/40 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:shadow-black/30"
          >
            <img
              src={getImageUrl(image.imageUrl)}
              alt={image.originalFileName || "Customer uploaded repair photo"}
              className="h-40 w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <div className="p-3">
              <p className="truncate text-xs font-black">
                {image.originalFileName || "Repair photo"}
              </p>

              <p className="mt-1 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                {new Date(image.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </a>
        ))}
      </div>
    );
  }

  type StatusHistoryTimelineProps = {
    history: {
      oldStatus?: string | null;
      newStatus: string;
      note?: string | null;
      changedAt: string;
    }[];
  };

  function StatusHistoryTimeline({ history }: StatusHistoryTimelineProps) {
    if (history.length === 0) {
      return (
        <p className="text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
          No status history available yet.
        </p>
      );
    }

    return (
      <div className="space-y-5">
        {history.map((item, index) => (
          <div
            key={`${item.changedAt}-${item.newStatus}-${index}`}
            className="relative grid gap-4 rounded-2xl border border-[#eadfca] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f] sm:grid-cols-[44px_1fr]"
          >
            <div className="relative flex justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d6b46a]/50 bg-[#fff4cc] text-sm font-black text-[#7a570f] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                {history.length - index}
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {item.oldStatus && (
                    <>
                      <StatusMiniBadge status={item.oldStatus} />
                      <span className="text-xs font-black text-[#6f6758] dark:text-[#a8a093]">
                        →
                      </span>
                    </>
                  )}

                  <StatusMiniBadge status={item.newStatus} />
                </div>

                <p className="text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  {new Date(item.changedAt).toLocaleString("en-IN")}
                </p>
              </div>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
                {item.note || "No note added."}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  type StatusMiniBadgeProps = {
    status: string;
  };

  function StatusMiniBadge({ status }: StatusMiniBadgeProps) {
    return (
      <span className="rounded-full border border-[#d6b46a]/50 bg-[#fff4cc] px-3 py-1 text-xs font-black text-[#7a570f] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        {status}
      </span>
    );
  }

  type StatusBadgeProps = {
    status: string;
  };

  function StatusBadge({ status }: StatusBadgeProps) {
    const normalizedStatus = status.toLowerCase();

    let className =
      "border-[#d6b46a]/50 bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";

    if (normalizedStatus.includes("accepted")) {
      className =
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300";
    }

    if (normalizedStatus.includes("progress")) {
      className =
        "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300";
    }

    if (normalizedStatus.includes("completed")) {
      className =
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
    }

    if (normalizedStatus.includes("cancelled")) {
      className =
        "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
    }

    return (
      <span
        className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-black ${className}`}
      >
        {status}
      </span>
    );
  }

  function RepairWorkNotesCard({
    diagnosis,
    setDiagnosis,
    workNotes,
    setWorkNotes,
    partsUsed,
    setPartsUsed,
    warrantyNote,
    setWarrantyNote,
    showRepairNotesToCustomer,
    setShowRepairNotesToCustomer,
    saving,
    onSave
  }: {
    diagnosis: string;
    setDiagnosis: (value: string) => void;
    workNotes: string;
    setWorkNotes: (value: string) => void;
    partsUsed: string;
    setPartsUsed: (value: string) => void;
    warrantyNote: string;
    setWarrantyNote: (value: string) => void;
    showRepairNotesToCustomer: boolean;
    setShowRepairNotesToCustomer: (value: boolean) => void;
    saving: boolean;
    onSave: () => void;
  }) {
    return (
      <div className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="flex flex-col gap-4 border-b border-[#d8cdb6] pb-5 dark:border-[#302c24] sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
              Repair Work
            </p>

            <h2 className="font-display mt-2 text-3xl font-bold">
              Diagnosis & Work Notes
            </h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Add actual fault, repair work, parts used and warranty note.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#d8cdb6] bg-[#fff8e7] px-4 py-3 dark:border-[#302c24] dark:bg-[#11110f]">
            <input
              type="checkbox"
              checked={showRepairNotesToCustomer}
              onChange={(event) =>
                setShowRepairNotesToCustomer(event.target.checked)
              }
              className="h-4 w-4 accent-[#d6b46a]"
            />

            <span className="text-xs font-black text-[#1f1a12] dark:text-[#e8e3d8]">
              Show to customer
            </span>
          </label>
        </div>

        <div className="mt-5 grid gap-5">
          <WorkNoteTextarea
            label="Diagnosis"
            value={diagnosis}
            onChange={setDiagnosis}
            maxLength={1000}
            placeholder="Example: Backlight issue found. Power board is working."
          />

          <WorkNoteTextarea
            label="Work Notes"
            value={workNotes}
            onChange={setWorkNotes}
            maxLength={1500}
            placeholder="Example: Opened TV, checked panel, tested backlight strip."
          />

          <WorkNoteTextarea
            label="Parts Used"
            value={partsUsed}
            onChange={setPartsUsed}
            maxLength={1000}
            placeholder="Example: Backlight strip, capacitor, remote sensor."
          />

          <WorkNoteTextarea
            label="Warranty Note"
            value={warrantyNote}
            onChange={setWarrantyNote}
            maxLength={500}
            placeholder="Example: 7 days checking warranty on replaced part."
          />
        </div>

        <div className="mt-6 flex justify-end">
          <ActionButton
            type="button"
            loading={saving}
            loadingText=""
            variant="gold"
            fullWidth={false}
            className="h-12 min-w-[180px] px-5 py-0"
            onClick={onSave}
          >
            Save Work Notes
          </ActionButton>
        </div>
      </div>
    );
  }

  function WorkNoteTextarea({
    label,
    value,
    onChange,
    maxLength,
    placeholder
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    placeholder: string;
  }) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-xs font-black uppercase tracking-[0.12em] text-[#8a6624] dark:text-[#d6b46a]">
            {label}
          </label>

          <span className="text-[11px] font-bold text-[#8f8778]">
            {value.length}/{maxLength}
          </span>
        </div>

        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-4 py-3 text-sm font-semibold text-[#11110f] outline-none transition placeholder:text-[#9b907d] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
        />
      </div>
    );
  }
  function RequestTabs({
    activeTab,
    onChange
  }: {
    activeTab: RequestTab;
    onChange: (tab: RequestTab) => void;
  }) {
    const tabs: {
      value: RequestTab;
      label: string;
    }[] = [
      {
        value: "overview",
        label: "Overview"
      },
      {
        value: "repair",
        label: "Repair Work"
      },
      {
        value: "activity",
        label: "Activity"
      }
    ];

    return (
      <div className="mt-6 rounded-[1.5rem] border border-[#d8cdb6] bg-[#fffdf7] p-1.5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
        <div
          role="tablist"
          aria-label="Service request sections"
          className="grid grid-cols-3 gap-1.5"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(tab.value)}
                className={`min-h-11 rounded-xl px-3 text-xs font-black transition sm:text-sm ${
                  active
                    ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#d6b46a] dark:text-[#11110f]"
                    : "text-[#6f6758] hover:bg-[#f2eadb] dark:text-[#a8a093] dark:hover:bg-[#242016]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function RequestSummaryItem({
    label,
    value
  }: {
    label: string;
    value: string;
  }) {
    return (
      <div className="min-w-0 border-b border-r border-[#d8cdb6] px-5 py-4 last:border-r-0 dark:border-[#302c24] lg:border-b-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-black">{value}</p>
      </div>
    );
  }

  function BackIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4"
      >
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4"
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

  function MessageIcon() {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path
          d="M4 5h16v12H9l-5 3V5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
}
export default AdminServiceRequestDetailsPage;
type PriceInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

function PriceInput({ label, value, onChange, placeholder }: PriceInputProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black text-[#5f574a] dark:text-[#b5ada0]">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#8a6624] dark:text-[#d6b46a]">
          ₹
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="admin-input pl-9"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
