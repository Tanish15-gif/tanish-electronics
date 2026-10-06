import { useApiAuth } from "../../hooks/useApiAuth";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCustomerDashboard,
  type CustomerDashboard,
  type CustomerDashboardServiceRequest
} from "../../Services/customerDashboardService";
import QuickBookRepairModal from "../../components/customer/QuickBookRepairModal";
import CustomerDashboardAnnouncements from "../../components/customer/CustomerDashboardAnnouncements";
import CustomerDashboardAnnouncementPopup from "../../components/customer/CustomerDashboardAnnouncementPopup";
import { useShopSettings } from "../../hooks/useShopSettings";

/* ─── helpers ────────────────────────────────────────────────── */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}



function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getRepairStatusVariant(status: string) {
  const s = status.toLowerCase();
  if (s.includes("completed"))
    return { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300", label: "Completed" };
  if (s.includes("cancelled"))
    return { dot: "bg-red-400", badge: "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300", label: "Cancelled" };
  if (s.includes("progress") || s.includes("repair"))
    return { dot: "bg-blue-500 animate-pulse", badge: "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300", label: status };
  if (s.includes("pending") || s.includes("received"))
    return { dot: "bg-amber-400 animate-pulse", badge: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300", label: status };
  return { dot: "bg-[#d6b46a]", badge: "bg-[#f2eadb] text-[#725522] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]", label: status };
}

function getRepairStage(status: string): 0 | 1 | 2 | 3 {
  const s = status.toLowerCase();
  if (s.includes("completed")) return 3;
  if (s.includes("progress") || s.includes("repair")) return 2;
  if (s.includes("inspect") || s.includes("diagnos")) return 1;
  return 0;
}

/* ─── page component ─────────────────────────────────────────── */

function CustomerDashboardPage() {
  const { isLoaded, isSignedIn, getToken } = useApiAuth();
  const { settings } = useShopSettings();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickBookOpen, setQuickBookOpen] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!isLoaded) return;
      if (!isSignedIn) { setLoading(false); return; }
      try {
        setLoading(true);
        setError("");
        const token = await getToken();
        if (!token) { setError("Please sign in again."); return; }
        setDashboard(await getCustomerDashboard(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    const prev = document.title;
    document.title = "My Dashboard — Tanish Electronics";
    return () => { document.title = prev; };
  }, []);

  if (loading || !isLoaded) return <DashboardSkeleton />;

  if (error) {
    return (
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-400/20 dark:bg-red-400/5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-400/10 dark:text-red-400">
            <ErrorAlertIcon />
          </div>
          <p className="text-sm font-black text-red-800 dark:text-red-300">Unable to load dashboard</p>
          <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  if (!dashboard) return null;

  const totalRequests = dashboard.serviceRequests.length;
  const activeRequests = dashboard.serviceRequests.filter(
    r => !r.currentStatus.toLowerCase().includes("completed") && !r.currentStatus.toLowerCase().includes("cancelled")
  ).length;
  const completedRequests = dashboard.serviceRequests.filter(
    r => r.currentStatus.toLowerCase().includes("completed")
  ).length;
  const totalEnquiries = dashboard.enquiries.length;
  const firstName = dashboard.fullName.split(" ")[0];
  const latestRequest = dashboard.serviceRequests[0] ?? null;
  const recentRequests = dashboard.serviceRequests.slice(0, 5);

  const shopPhone = settings.primaryPhone || "8850973399";
  const rawWa = (settings.whatsAppNumber || shopPhone).replace(/\D/g, "");
  const waNumber = rawWa.startsWith("91") && rawWa.length >= 12 ? rawWa : `91${rawWa}`;
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Hello Tanish Electronics, I am contacting you from my customer dashboard regarding my device service."
  )}`;

  return (
    <main className="te-sheet-bg min-h-screen">
      <CustomerDashboardAnnouncementPopup />

      {/* ── Page Header (full-bleed, editorial) ── */}
      <div className="relative overflow-hidden border-b border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]">
        {/* Subtle geometric accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#d6b46a]/10 blur-3xl dark:bg-[#d6b46a]/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-[#d6b46a]/5 blur-2xl dark:bg-[#d6b46a]/3"
        />

        <div className="relative px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8 lg:pb-12 lg:pt-12">
          {/* Live portal badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8cdb6] bg-[#fffaf0] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#8a6624] shadow-sm dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Customer Portal · Workshop Live
          </div>

          {/* Greeting */}
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#817867] dark:text-[#928a7d]">
                {getGreeting()}
              </p>
              <h1 className="mt-1.5 text-3xl font-black leading-[1.05] tracking-tight text-[#1f1a12] dark:text-[#f7f5ef] sm:text-4xl lg:text-5xl xl:text-6xl">
                {firstName}&rsquo;s&ensp;
                <span className="text-[#8a6624] dark:text-[#d6b46a]">Dashboard</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-[#6f6758] dark:text-[#a8a093]">
                Track your repairs in real time, browse enquiries, and manage every service from one executive command centre.
              </p>

              {/* CTAs */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuickBookOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1f1a12] px-6 py-3 text-sm font-black text-[#f7f5ef] shadow-md ring-2 ring-[#1f1a12]/0 transition hover:-translate-y-px hover:bg-[#352f26] hover:shadow-lg hover:ring-[#d6b46a]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/30 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                >
                  <PlusCircleIcon />
                  Book a Repair
                </button>

                <Link
                  to="/track-request"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black text-[#1f1a12] shadow-sm transition hover:-translate-y-px hover:bg-[#f2eadb] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/30 dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                >
                  <RadarIcon />
                  Track a Device
                </Link>

                <Link
                  to="/customer/repairs"
                  className="group inline-flex items-center gap-1 text-sm font-bold text-[#8a6624] transition hover:gap-2 dark:text-[#d6b46a]"
                >
                  All repairs
                  <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Latest ticket card — visible on desktop in the header */}
            {latestRequest && (
              <LatestTicketPill request={latestRequest} />
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        {/* Metric row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Repairs"
            value={totalRequests}
            sub="Lifetime bookings"
            icon={<WrenchIcon />}
            to="/customer/repairs"
          />
          <MetricCard
            label="In Progress"
            value={activeRequests}
            sub={activeRequests > 0 ? "Active in workshop" : "No active repairs"}
            icon={<FlameIcon />}
            to="/customer/repairs"
            pulse={activeRequests > 0}
            accent={activeRequests > 0}
          />
          <MetricCard
            label="Completed"
            value={completedRequests}
            sub="Delivered & verified"
            icon={<CheckRingIcon />}
            to="/customer/repairs"
            success={completedRequests > 0}
          />
          <MetricCard
            label="Enquiries"
            value={totalEnquiries}
            sub="Product quotes & requests"
            icon={<InboxIcon />}
            to="/customer/enquiries"
          />
        </div>

        {/* Announcements */}
        <div className="mt-10">
          <CustomerDashboardAnnouncements />
        </div>

        {/* Main 2-col layout */}
        <div className="mt-10 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* LEFT — Repair Activity + Hub */}
          <div className="space-y-8">

            {/* Repair Activity */}
            <section className="overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 border-b border-[#e4dac8] bg-[#fffaf0] px-6 py-5 dark:border-[#302c24] dark:bg-[#15130f]">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                    <ActivityIcon />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                      Workshop Activity
                    </p>
                    <h2 className="mt-0.5 text-lg font-black leading-tight text-[#1f1a12] dark:text-[#e8e3d8]">
                      Repair History
                    </h2>
                  </div>
                </div>

                <Link
                  to="/customer/repairs"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 py-2 text-xs font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
                >
                  View all&nbsp;({totalRequests})
                  <ArrowUpRightMiniIcon />
                </Link>
              </div>

              {/* Rows */}
              {recentRequests.length === 0 ? (
                <EmptyRepairs onBook={() => setQuickBookOpen(true)} />
              ) : (
                <div className="divide-y divide-[#ede5d3] dark:divide-[#252018]">
                  {recentRequests.map((r) => (
                    <RepairRow key={r.serviceRequestId} request={r} />
                  ))}
                </div>
              )}

              {recentRequests.length > 0 && (
                <div className="flex items-center justify-between border-t border-[#e4dac8] bg-[#faf7f0] px-6 py-3 dark:border-[#302c24] dark:bg-[#15130f]">
                  <p className="text-[11px] font-semibold text-[#8a8172] dark:text-[#746d61]">
                    Showing {recentRequests.length} most recent repairs
                  </p>
                  <Link
                    to="/customer/repairs"
                    className="text-[11px] font-black text-[#8a6624] hover:underline dark:text-[#d6b46a]"
                  >
                    Manage all →
                  </Link>
                </div>
              )}
            </section>

            {/* Customer Hub */}
            <div className="grid gap-4 sm:grid-cols-3">
              <HubCard
                title="My Profile"
                description="Update personal info, email and addresses."
                to="/customer/profile"
                cta="Open Profile"
                icon={<UserCircleIcon />}
              />
              <HubCard
                title="Enquiries"
                description={`${totalEnquiries} active product enquiry records.`}
                to="/customer/enquiries"
                cta="View Enquiries"
                icon={<InboxIcon />}
              />
              <HubCard
                title="My Reviews"
                description="Rate completed repairs and share feedback."
                to="/customer/feedbacks"
                cta="My Feedback"
                icon={<StarIcon />}
              />
            </div>
          </div>

          {/* RIGHT — sidebar */}
          <div className="space-y-6">

            {/* Workshop Direct */}
            <section className="overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              {/* Top accent strip */}
              <div className="h-1 w-full bg-gradient-to-r from-[#8a6624] via-[#d6b46a] to-[#8a6624]" />

              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
                      Workshop Direct
                    </p>
                    <h3 className="mt-1 text-xl font-black leading-tight text-[#1f1a12] dark:text-[#e8e3d8]">
                      {settings.shopName || "Tanish Electronics"}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
                      Founded by Subhash Gupta · 20+ Years Experience
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Open Today
                  </span>
                </div>

                {/* Info block */}
                <div className="mt-5 space-y-2.5 rounded-2xl border border-[#ddd4c0] bg-[#fffaf2] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
                  <div className="flex items-start gap-2.5 text-xs font-semibold">
                    <span className="mt-0.5 shrink-0 text-[#8a6624] dark:text-[#d6b46a]"><LocationIcon /></span>
                    <span className="leading-relaxed text-[#4f4638] dark:text-[#c8bfb0]">
                      Hanuman Chowk, Gajdhar Bandh,<br />Santacruz West, Mumbai – 400054
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 border-t border-[#e8dfc9] pt-2.5 text-xs font-semibold dark:border-[#252018]">
                    <span className="shrink-0 text-[#8a6624] dark:text-[#d6b46a]"><ClockIcon /></span>
                    <span className="text-[#6f6758] dark:text-[#a8a093]">Mon – Sat, 10:00 AM – 9:00 PM</span>
                  </div>
                </div>

                {/* Contact buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${shopPhone}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#352f26] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
                  >
                    <PhoneCallIcon />
                    Call Shop
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </a>
                </div>
              </div>
            </section>

            {/* Quick Actions Rail */}
            <section className="overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
              <div className="border-b border-[#e4dac8] px-5 py-4 dark:border-[#252018]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                  Quick Actions
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                  Jump to any service instantly
                </p>
              </div>
              <div className="divide-y divide-[#ede5d3] dark:divide-[#252018]">
                <QuickActionItem
                  icon={<PlusCircleIcon />}
                  label="Book a new repair"
                  sub="TV, remote, soundbar & more"
                  onClick={() => setQuickBookOpen(true)}
                />
                <QuickActionItem
                  icon={<RadarIcon />}
                  label="Track a repair request"
                  sub="Enter tracking ID or phone"
                  to="/track-request"
                />
                <QuickActionItem
                  icon={<InboxIcon />}
                  label="View product enquiries"
                  sub={`${totalEnquiries} enquiry records`}
                  to="/customer/enquiries"
                />
                <QuickActionItem
                  icon={<StarIcon />}
                  label="Submit feedback"
                  sub="Rate your latest repair"
                  to="/customer/feedbacks"
                />
              </div>
            </section>

            {/* Service promo */}
            <section className="relative overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-gradient-to-br from-[#fff8e7] to-[#fdf3d4] p-6 shadow-sm dark:border-[#302c24] dark:from-[#1a1712] dark:to-[#15130d]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#d6b46a]/20 blur-2xl"
              />
              <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
                Need Another Service?
              </p>
              <h3 className="relative mt-2 text-lg font-black leading-snug text-[#1f1a12] dark:text-[#e8e3d8]">
                Home Visit & Workshop Drop‑off
              </h3>
              <p className="relative mt-2 text-xs font-medium leading-relaxed text-[#6f6758] dark:text-[#a8a093]">
                Expert repair for LED, LCD, Smart TV, QLED, Box TVs, Soundbars, Remotes and Adapters. Fast turnaround across Santacruz, Bandra, Khar, Juhu & Vile Parle.
              </p>
              <button
                type="button"
                onClick={() => setQuickBookOpen(true)}
                className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8a6624] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#a67d32] hover:shadow-md dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#e2c473]"
              >
                <PlusCircleIcon />
                Book a Service Now
              </button>
            </section>
          </div>
        </div>
      </div>

      <QuickBookRepairModal
        open={quickBookOpen}
        onClose={() => setQuickBookOpen(false)}
        onCreated={(id) => { setQuickBookOpen(false); navigate(`/customer/repairs/${id}`); }}
      />
    </main>
  );
}

/* ─── LatestTicketPill ───────────────────────────────────────── */

function LatestTicketPill({ request }: { request: CustomerDashboardServiceRequest }) {
  const variant = getRepairStatusVariant(request.currentStatus);
  const stage = getRepairStage(request.currentStatus);
  const progressPercent = stage === 3 ? 100 : stage === 2 ? 75 : stage === 1 ? 45 : 20;

  const device = [request.deviceName, request.brand]
    .filter(Boolean)
    .join(" · ") || request.serviceType;

  return (
    <Link
      to={`/customer/repairs/${request.serviceRequestId}`}
      className="group block shrink-0 rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm transition hover:border-[#c8b68e] hover:shadow-md dark:border-[#302c24] dark:bg-[#1a1712] sm:min-w-[280px] lg:min-w-[300px]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a6624] dark:text-[#d6b46a]">
          Latest Ticket
        </p>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black ${variant.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${variant.dot.replace(" animate-pulse", "")}`} />
          {variant.label}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-black leading-tight text-[#1f1a12] dark:text-[#f7f5ef]">
        {request.serviceCategory}
      </h3>
      <p className="mt-0.5 text-xs font-semibold text-[#8a8172] dark:text-[#817a6e]">
        {device}
      </p>
      <p className="mt-1 text-[11px] font-black text-[#8a6624] dark:text-[#d6b46a]">
        {request.requestNumber}
      </p>

      {/* Thin progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#8a8172] dark:text-[#746d61]">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#e8dfc9] dark:bg-[#252018]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stage === 3
                ? "bg-emerald-500"
                : "bg-[#8a6624] dark:bg-[#d6b46a]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-[#8a6624] transition group-hover:gap-2 dark:text-[#d6b46a]">
        Track repair
        <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

/* ─── MetricCard ─────────────────────────────────────────────── */

function MetricCard({
  label, value, sub, icon, to, pulse, accent, success
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  to?: string;
  pulse?: boolean;
  accent?: boolean;
  success?: boolean;
}) {
  const base = (
    <div
      className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-sm transition ${
        accent
          ? "border-[#d6b46a]/50 bg-[#fffbf0] dark:border-[#d6b46a]/30 dark:bg-[#1a1610]"
          : success
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-950/30"
          : "border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]"
      } ${to ? "cursor-pointer hover:-translate-y-1 hover:shadow-md" : ""}`}
    >
      {/* Ambient glow for accented cards */}
      {accent && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#d6b46a]/20 blur-2xl"
        />
      )}

      <div className="relative flex items-start justify-between gap-2">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            accent
              ? "bg-[#d6b46a]/20 text-[#8a6624] dark:text-[#d6b46a]"
              : success
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
              : "bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]"
          }`}
        >
          {icon}
        </span>
        {to && (
          <span className="text-[#b0a790] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#8a6624] dark:text-[#504a40] dark:group-hover:text-[#d6b46a]">
            <ArrowUpRightMiniIcon />
          </span>
        )}
      </div>

      <p
        className={`relative mt-4 text-5xl font-black leading-none tracking-tight ${
          accent
            ? "text-[#8a6624] dark:text-[#d6b46a]"
            : success && value > 0
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-[#1f1a12] dark:text-[#f7f5ef]"
        }`}
      >
        {value}
        {pulse && value > 0 && (
          <span className="ml-2 inline-flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
        )}
      </p>

      <p className="relative mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a6624] dark:text-[#d6b46a]">
        {label}
      </p>
      <p className="relative mt-0.5 text-xs font-medium text-[#8a8172] dark:text-[#746d61]">
        {sub}
      </p>
    </div>
  );

  return to ? <Link to={to} className="block">{base}</Link> : base;
}

/* ─── RepairRow ──────────────────────────────────────────────── */

function RepairRow({ request }: { request: CustomerDashboardServiceRequest }) {
  const variant = getRepairStatusVariant(request.currentStatus);
  const stage = getRepairStage(request.currentStatus);
  const device = [request.deviceName, request.brand, request.modelName].filter(Boolean).join(" · ") || request.serviceType;

  return (
    <Link
      to={`/customer/repairs/${request.serviceRequestId}`}
      className="group flex items-center gap-4 px-6 py-4 transition hover:bg-[#faf7f0] dark:hover:bg-[#1e1b14]"
    >
      {/* Stage indicator */}
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] text-[#8a6624] transition group-hover:border-[#c8b68e] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]">
        <RepairStageIcon stage={stage} />
        <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#fffaf0] dark:border-[#11110f] ${variant.dot}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">
            {request.serviceCategory}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black ${variant.badge}`}>
            {variant.label}
          </span>
        </div>

        <p className="mt-0.5 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
          {device}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#a8a093] dark:text-[#817a6e]">
          <span className="font-black text-[#8a6624] dark:text-[#d6b46a]">{request.requestNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(request.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{request.serviceType}</span>
        </div>
      </div>

      <ChevronRightIcon />
    </Link>
  );
}

function RepairStageIcon({ stage }: { stage: 0 | 1 | 2 | 3 }) {
  if (stage === 3) return <CheckRingIcon />;
  if (stage === 2) return <WrenchIcon />;
  if (stage === 1) return <SearchIcon />;
  return <CalendarCheckIcon />;
}

/* ─── HubCard ────────────────────────────────────────────────── */

function HubCard({ title, description, to, cta, icon }: {
  title: string;
  description: string;
  to: string;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#c8b98f] hover:shadow-md dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#d6b46a]/40"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          {icon}
        </span>
        <span className="text-[#b0a790] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#8a6624] dark:text-[#504a40] dark:group-hover:text-[#d6b46a]">
          <ArrowUpRightMiniIcon />
        </span>
      </div>

      <h3 className="mt-4 text-base font-black leading-tight text-[#1f1a12] dark:text-[#f7f5ef]">
        {title}
      </h3>
      <p className="mt-1.5 flex-1 text-xs font-medium leading-relaxed text-[#6f6758] dark:text-[#a8a093]">
        {description}
      </p>

      <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-[#1f1a12] px-4 py-2 text-xs font-black text-white transition group-hover:bg-[#352f26] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:group-hover:bg-[#d6b46a]">
        {cta}
        <ArrowRightIcon className="" />
      </span>
    </Link>
  );
}

/* ─── QuickActionItem ────────────────────────────────────────── */

function QuickActionItem({ icon, label, sub, to, onClick }: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  to?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#faf7f0] dark:hover:bg-[#1e1b14]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-[#1f1a12] dark:text-[#e8e3d8]">{label}</p>
        <p className="text-[11px] font-semibold text-[#8a8172] dark:text-[#746d61]">{sub}</p>
      </div>
      <span className="shrink-0 text-[#b0a790] transition group-hover:translate-x-0.5 dark:text-[#504a40]">
        <ChevronRightIcon />
      </span>
    </div>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
}

/* ─── EmptyRepairs ───────────────────────────────────────────── */

function EmptyRepairs({ onBook }: { onBook: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        <WrenchIcon />
      </div>
      <h3 className="mt-4 text-base font-black text-[#1f1a12] dark:text-[#e8e3d8]">
        No repair bookings yet
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-xs font-medium leading-relaxed text-[#817867] dark:text-[#928a7d]">
        Book a TV, soundbar, remote or adapter repair to start tracking live workshop progress.
      </p>
      <button
        type="button"
        onClick={onBook}
        className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1f1a12] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#352f26] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
      >
        <PlusCircleIcon />
        Book Your First Repair
      </button>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <main className="animate-pulse">
      {/* Header skeleton */}
      <div className="border-b border-[#d8cdb6] bg-[#fffdf7] px-4 py-10 sm:px-6 lg:px-8 dark:border-[#302c24] dark:bg-[#1a1712]">
        <div className="h-4 w-36 rounded-full bg-[#e8e0ce] dark:bg-[#28231a]" />
        <div className="mt-4 h-10 w-72 max-w-full rounded-xl bg-[#e8e0ce] dark:bg-[#28231a]" />
        <div className="mt-3 h-4 w-1/2 max-w-xs rounded bg-[#ede5d8] dark:bg-[#242016]" />
        <div className="mt-6 flex gap-3">
          <div className="h-12 w-36 rounded-2xl bg-[#e8e0ce] dark:bg-[#28231a]" />
          <div className="h-12 w-36 rounded-2xl bg-[#e8e0ce] dark:bg-[#28231a]" />
        </div>
      </div>
      {/* Body skeleton */}
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 dark:border-[#302c24] dark:bg-[#1a1712]">
              <div className="h-9 w-9 rounded-xl bg-[#e8e0ce] dark:bg-[#28231a]" />
              <div className="mt-5 h-12 w-16 rounded bg-[#e8e0ce] dark:bg-[#28231a]" />
              <div className="mt-2 h-3 w-24 rounded bg-[#ede5d8] dark:bg-[#242016]" />
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-80 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />
          <div className="h-80 rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#1a1712]" />
        </div>
      </div>
    </main>
  );
}

/* ═══ ICONS ═══════════════════════════════════════════════════ */

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M14.7 6.3a4 4 0 01-5 5L4 17l3 3 5.7-5.7a4 4 0 005-5l-2.4 2.4-3-3 2.4-2.4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M12 2c0 0-4 4.5-4 8a4 4 0 0 0 8 0 5 5 0 0 0-1-3c0 0 .5 3-2 3s-2-2.5-2-4c0-1.5 1-4 1-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 15.5A4 4 0 0 0 16 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckRingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PhoneCallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M20.5 12A8.5 8.5 0 0 1 7.8 19.3L3.5 20.5l1.2-4.1A8.5 8.5 0 1 1 20.5 12z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 9.5c.3-.6.6-.6.9-.6h.7c.2 0 .4.1.5.4.3.7.8 2 .9 2.2.1.2 0 .4-.1.6l-.4.5c-.1.2-.3.3-.1.6.4.7 1.2 1.5 2 1.9.3.2.5 0 .7-.2l.6-.7c.2-.2.4-.2.6-.1.3.1 1.6.8 1.8.9.3.2.4.3.3.6-.1.6-.9 1.5-1.7 1.5-.7 0-2.3-.6-3.8-2.1-1.6-1.5-2.2-3.1-2.2-3.8 0-.8.8-1.5 1.5-1.7z" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0 text-[#b0a790] transition group-hover:translate-x-0.5 group-hover:text-[#8a6624] dark:text-[#504a40] dark:group-hover:text-[#d6b46a]">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpRightMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`h-3.5 w-3.5 ${className}`}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 2v3M17 2v3M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m9 16 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorAlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default CustomerDashboardPage;
