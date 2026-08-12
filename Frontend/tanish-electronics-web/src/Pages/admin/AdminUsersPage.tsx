import {
  Activity,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  KeyRound,
  LockKeyhole,
  MailCheck,
  MonitorSmartphone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserRound,
  Users,
  UserX
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import {
  getAdminUsers,
  getAdminUsersSummary,
  type AdminUserListItem,
  type AdminUsersSummary
} from "../../Services/adminUsersService";

import ActionButton from "../../components/UI/ActionButton";
import UniversalDropdown, {
  type DropdownOption
} from "../../components/UI/UniversalDropdown";
import { useNavigate } from "react-router-dom";
import { useShopSettings } from "../../hooks/useShopSettings";

const EMPTY_SUMMARY: AdminUsersSummary = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  lockedUsers: 0,
  googleUsers: 0,
  passwordUsers: 0,
  activeSessions: 0
};

type StatusFilter = "all" | "active" | "inactive" | "locked";
type SignInFilter = "all" | "password" | "google" | "both";
type EmailFilter = "all" | "verified" | "unverified";
type SortBy = "newest" | "oldest" | "name" | "lastLogin" | "sessions";

const ROLE_OPTIONS: DropdownOption<string>[] = [
  { value: "", label: "All roles" },
  { value: "Customer", label: "Customer" },
  { value: "Admin", label: "Admin" }
];

const STATUS_OPTIONS: DropdownOption<StatusFilter>[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "locked", label: "Locked" }
];

const SIGN_IN_OPTIONS: DropdownOption<SignInFilter>[] = [
  { value: "all", label: "All sign-ins" },
  { value: "password", label: "Password only" },
  { value: "google", label: "Google only" },
  { value: "both", label: "Google + password" }
];

const EMAIL_OPTIONS: DropdownOption<EmailFilter>[] = [
  { value: "all", label: "All emails" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" }
];

const SORT_OPTIONS: DropdownOption<SortBy>[] = [
  { value: "newest", label: "Newest users" },
  { value: "oldest", label: "Oldest users" },
  { value: "name", label: "Name A–Z" },
  { value: "lastLogin", label: "Recent login" },
  { value: "sessions", label: "Most sessions" }
];

const PAGE_SIZE_OPTIONS: DropdownOption<number>[] = [
  { value: 10, label: "10 per page" },
  { value: 20, label: "20 per page" },
  { value: 50, label: "50 per page" }
];

export default function AdminUsersPage() {
  const { settings } = useShopSettings();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>(EMPTY_SUMMARY);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [role, setRole] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [signInMethod, setSignInMethod] = useState<SignInFilter>("all");
  const [emailConfirmed, setEmailConfirmed] = useState<EmailFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summaryError, setSummaryError] = useState("");
  const [usersError, setUsersError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `User Administration | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPageNumber(1);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      setSummaryError("");

      const response = await getAdminUsersSummary();
      setSummary(response);
    } catch (requestError) {
      setSummaryError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load user summary."
      );
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setUsersError("");

      const response = await getAdminUsers({
        search: debouncedSearch,
        role: role || undefined,
        status,
        signInMethod,
        emailConfirmed:
          emailConfirmed === "all" ? null : emailConfirmed === "verified",
        sortBy,
        page: pageNumber,
        pageSize
      });

      setUsers(response.items);
      setTotalRecords(response.totalRecords);
      setTotalPages(response.totalPages);

      if (response.totalPages > 0 && pageNumber > response.totalPages) {
        setPageNumber(response.totalPages);
      }
    } catch (requestError) {
      setUsers([]);
      setTotalRecords(0);
      setTotalPages(0);

      setUsersError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load users."
      );
    } finally {
      setLoadingUsers(false);
    }
  }, [
    debouncedSearch,
    emailConfirmed,
    pageNumber,
    pageSize,
    role,
    signInMethod,
    sortBy,
    status
  ]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const visibleRange = useMemo(() => {
    if (totalRecords === 0) {
      return {
        start: 0,
        end: 0
      };
    }

    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalRecords);

    return {
      start,
      end
    };
  }, [pageNumber, pageSize, totalRecords]);

  const activeFilterCount = useMemo(() => {
    return [
      Boolean(search.trim()),
      Boolean(role),
      status !== "all",
      signInMethod !== "all",
      emailConfirmed !== "all"
    ].filter(Boolean).length;
  }, [emailConfirmed, role, search, signInMethod, status]);

  const activeUserRate = getPercentage(summary.activeUsers, summary.totalUsers);

  const lockedUserRate = getPercentage(summary.lockedUsers, summary.totalUsers);

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);

      await Promise.all([loadSummary(), loadUsers()]);
    } finally {
      setRefreshing(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setRole("");
    setStatus("all");
    setSignInMethod("all");
    setEmailConfirmed("all");
    setSortBy("newest");
    setPageNumber(1);
  }

  return (
    <main
      className="te-sheet-bg min-h-full px-4 py-6 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <div className="mx-auto w-full max-w-[1600px]">
        <UsersHero
          summary={summary}
          totalRecords={totalRecords}
          activeUserRate={activeUserRate}
          loading={loadingSummary}
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
        />

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total users"
            value={summary.totalUsers}
            helper="Registered customer and administrator accounts"
            icon={<Users className="h-5 w-5" />}
            loading={loadingSummary}
            tone="gold"
          />

          <SummaryCard
            label="Active users"
            value={summary.activeUsers}
            helper={`${activeUserRate}% of all registered accounts`}
            icon={<UserCheck className="h-5 w-5" />}
            loading={loadingSummary}
            tone="green"
          />

          <SummaryCard
            label="Locked accounts"
            value={summary.lockedUsers}
            helper={`${lockedUserRate}% currently restricted`}
            icon={<LockKeyhole className="h-5 w-5" />}
            loading={loadingSummary}
            tone="red"
          />

          <SummaryCard
            label="Active sessions"
            value={summary.activeSessions}
            helper="Trusted devices currently signed in"
            icon={<MonitorSmartphone className="h-5 w-5" />}
            loading={loadingSummary}
            tone="blue"
          />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <AccessDistributionCard summary={summary} loading={loadingSummary} />

          <AccountStateCard summary={summary} loading={loadingSummary} />
        </section>

        {(summaryError || usersError) && (
          <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold">
                User administration data is incomplete
              </p>

              <p className="mt-1 text-xs font-medium leading-5">
                {[summaryError, usersError].filter(Boolean).join(" ")}
              </p>
            </div>

            <ActionButton
              type="button"
              onClick={() => void handleRefresh()}
              loading={refreshing}
              spinnerOnly
              fullWidth={false}
              variant="outline"
              className="!min-h-10 !shrink-0 !rounded-xl !px-4 !py-2 !text-xs"
            >
              Retry
            </ActionButton>
          </section>
        )}

        <FilterPanel
          search={search}
          role={role}
          status={status}
          signInMethod={signInMethod}
          emailConfirmed={emailConfirmed}
          sortBy={sortBy}
          activeFilterCount={activeFilterCount}
          loading={loadingUsers}
          onSearchChange={setSearch}
          onRoleChange={(value) => {
            setRole(value);
            setPageNumber(1);
          }}
          onStatusChange={(value) => {
            setStatus(value);
            setPageNumber(1);
          }}
          onSignInChange={(value) => {
            setSignInMethod(value);
            setPageNumber(1);
          }}
          onEmailChange={(value) => {
            setEmailConfirmed(value);
            setPageNumber(1);
          }}
          onSortChange={(value) => {
            setSortBy(value);
            setPageNumber(1);
          }}
          onClear={clearFilters}
        />

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <UsersSectionHeader
            totalRecords={totalRecords}
            visibleRange={visibleRange}
            loading={loadingUsers}
          />

          <div className="hidden overflow-x-auto xl:block">
            <UsersTable
              users={users}
              loading={loadingUsers}
              onOpenUser={(appUserId) => navigate(`/admin/users/${appUserId}`)}
            />
          </div>

          <div className="xl:hidden">
            <MobileUsersList
              users={users}
              loading={loadingUsers}
              onOpenUser={(appUserId) => navigate(`/admin/users/${appUserId}`)}
            />
          </div>

          <PaginationFooter
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalRecords={totalRecords}
            visibleRange={visibleRange}
            loading={loadingUsers}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPageNumber(1);
            }}
            onPrevious={() =>
              setPageNumber((current) => Math.max(1, current - 1))
            }
            onNext={() =>
              setPageNumber((current) => Math.min(totalPages, current + 1))
            }
          />
        </section>
      </div>
    </main>
  );
}

function UsersHero({
  summary,
  totalRecords,
  activeUserRate,
  loading,
  refreshing,
  onRefresh
}: {
  summary: AdminUsersSummary;
  totalRecords: number;
  activeUserRate: number;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] p-6 text-[#1f1a12] shadow-[0_24px_70px_-36px_rgba(17,16,15,0.75)] dark:border-[#302c24] dark:bg-[#1f1a12] dark:text-[#f7f5ef] sm:p-8 lg:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "linear-gradient(to right, black, transparent 76%)"
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#d6b46a]/12 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d6b46a]/25 bg-[#d6b46a]/10 text-[#d6b46a]">
            <Users className="h-6 w-6" />
          </span>

          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a]">
            Identity administration
          </p>

          <h1 className="font-display mt-3 text-4xl font-semibold leading-none sm:text-5xl">
            User directory
          </h1>

          <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#6f6758] dark:text-[#c8bead]">
            Review customer and administrator identities, authentication
            methods, account state and trusted-device activity.
          </p>

          <div className="mt-6">
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
                Refresh directory
              </span>
            </ActionButton>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[600px]">
          <HeroMetric
            label="Registered users"
            value={
              loading ? "Checking" : String(totalRecords || summary.totalUsers)
            }
            icon={<CircleUserRound className="h-4 w-4" />}
          />

          <HeroMetric
            label="Active accounts"
            value={loading ? "Checking" : `${activeUserRate}% active`}
            icon={<BadgeCheck className="h-4 w-4" />}
          />

          <HeroMetric
            label="Live sessions"
            value={loading ? "Checking" : `${summary.activeSessions} connected`}
            icon={<Activity className="h-4 w-4" />}
          />
        </div>
      </div>
    </header>
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
    <div className="rounded-2xl border border-[#e4dbc9] bg-[#fffaf0]/90 p-4 backdrop-blur dark:border-white/10 dark:bg-[#17130e]/85">
      <div className="flex items-center gap-2 text-[#8a6624] dark:text-[#d6b46a]">
        {icon}

        <p className="text-[10px] font-bold uppercase tracking-[0.11em]">
          {label}
        </p>
      </div>

      <p className="mt-3 truncate text-sm font-bold text-[#1f1a12] dark:text-[#f7f5ef]">
        {value}
      </p>
    </div>
  );
}

type SummaryTone = "gold" | "green" | "red" | "blue";

function SummaryCard({
  label,
  value,
  helper,
  icon,
  loading,
  tone
}: {
  label: string;
  value: number;
  helper: string;
  icon: ReactNode;
  loading: boolean;
  tone: SummaryTone;
}) {
  const toneClass = getSummaryToneClass(tone);

  return (
    <article className="relative overflow-hidden rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div
        aria-hidden="true"
        className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl ${toneClass.glow}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClass.icon}`}
        >
          {icon}
        </span>

        <ShieldCheck className="h-4 w-4 text-[#b7a98e] dark:text-[#6f6758]" />
      </div>

      <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      {loading ? (
        <div className="relative mt-3 h-9 w-20 animate-pulse rounded-lg bg-[#e8dfcd] dark:bg-[#28251e]" />
      ) : (
        <p className="relative mt-2 text-4xl font-black tabular-nums">
          {value}
        </p>
      )}

      <p className="relative mt-3 text-xs font-medium leading-5 text-[#6f6758] dark:text-[#a8a093]">
        {helper}
      </p>
    </article>
  );
}

function AccessDistributionCard({
  summary,
  loading
}: {
  summary: AdminUsersSummary;
  loading: boolean;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <SectionHeading
        eyebrow="Authentication coverage"
        title="Sign-in distribution"
        description="Methods currently available across registered accounts."
        icon={<KeyRound className="h-5 w-5" />}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <AccessMetric
          label="Password sign-in"
          value={summary.passwordUsers}
          total={summary.totalUsers}
          loading={loading}
          icon={<KeyRound className="h-4 w-4" />}
        />

        <AccessMetric
          label="Google sign-in"
          value={summary.googleUsers}
          total={summary.totalUsers}
          loading={loading}
          icon={<GoogleMark />}
        />
      </div>
    </section>
  );
}

function AccountStateCard({
  summary,
  loading
}: {
  summary: AdminUsersSummary;
  loading: boolean;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <SectionHeading
        eyebrow="Risk overview"
        title="Account state"
        description="Accounts that may require administrator attention."
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <StateMetric
          label="Inactive"
          value={summary.inactiveUsers}
          loading={loading}
          icon={<UserX className="h-4 w-4" />}
          warning={summary.inactiveUsers > 0}
        />

        <StateMetric
          label="Locked"
          value={summary.lockedUsers}
          loading={loading}
          icon={<LockKeyhole className="h-4 w-4" />}
          warning={summary.lockedUsers > 0}
        />
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  icon
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
          {eyebrow}
        </p>

        <h2 className="font-display mt-1.5 text-2xl font-semibold leading-none">
          {title}
        </h2>

        <p className="mt-2 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
          {description}
        </p>
      </div>
    </div>
  );
}

function AccessMetric({
  label,
  value,
  total,
  loading,
  icon
}: {
  label: string;
  value: number;
  total: number;
  loading: boolean;
  icon: ReactNode;
}) {
  const percentage = getPercentage(value, total);

  return (
    <div className="rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          {icon}
        </span>

        <span className="text-xs font-bold text-[#817867] dark:text-[#928a7d]">
          {loading ? "—" : `${percentage}%`}
        </span>
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.09em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-[#e8dfcd] dark:bg-[#28251e]" />
      ) : (
        <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
      )}

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e8dfcd] dark:bg-[#242016]">
        <div
          className="h-full rounded-full bg-[#8a6624] transition-[width] dark:bg-[#d6b46a]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StateMetric({
  label,
  value,
  loading,
  icon,
  warning
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: ReactNode;
  warning: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        warning
          ? "border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10"
          : "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          warning
            ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-4 text-xs font-bold uppercase tracking-[0.09em] ${
          warning
            ? "text-amber-700 dark:text-amber-300"
            : "text-emerald-700 dark:text-emerald-300"
        }`}
      >
        {label}
      </p>

      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
      ) : (
        <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
      )}
    </div>
  );
}

function FilterPanel({
  search,
  role,
  status,
  signInMethod,
  emailConfirmed,
  sortBy,
  activeFilterCount,
  loading,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onSignInChange,
  onEmailChange,
  onSortChange,
  onClear
}: {
  search: string;
  role: string;
  status: StatusFilter;
  signInMethod: SignInFilter;
  emailConfirmed: EmailFilter;
  sortBy: SortBy;
  activeFilterCount: number;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSignInChange: (value: SignInFilter) => void;
  onEmailChange: (value: EmailFilter) => void;
  onSortChange: (value: SortBy) => void;
  onClear: () => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="flex flex-col gap-4 border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
            <SlidersHorizontal className="h-4 w-4" />
          </span>

          <div>
            <h2 className="text-sm font-bold">Directory filters</h2>

            <p className="mt-1 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
              Narrow the directory by identity, access and account state.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <span className="rounded-full border border-[#d6b46a]/35 bg-[#fff4cc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#765313] dark:border-[#d6b46a]/20 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              {activeFilterCount} active
            </span>
          )}

          <button
            type="button"
            onClick={onClear}
            disabled={loading || activeFilterCount === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-3.5 text-xs font-bold transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(280px,1.55fr)_repeat(5,minmax(150px,1fr))]">
          <label className="relative">
            <span className="sr-only">Search users</span>

            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, email or phone"
              className="admin-input h-12 pl-11"
            />
          </label>

          <UniversalDropdown
            value={role}
            options={ROLE_OPTIONS}
            onChange={onRoleChange}
          />

          <UniversalDropdown
            value={status}
            options={STATUS_OPTIONS}
            onChange={onStatusChange}
          />

          <UniversalDropdown
            value={signInMethod}
            options={SIGN_IN_OPTIONS}
            onChange={onSignInChange}
          />

          <UniversalDropdown
            value={emailConfirmed}
            options={EMAIL_OPTIONS}
            onChange={onEmailChange}
          />

          <UniversalDropdown
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={onSortChange}
          />
        </div>
      </div>
    </section>
  );
}

function UsersSectionHeader({
  totalRecords,
  visibleRange,
  loading
}: {
  totalRecords: number;
  visibleRange: {
    start: number;
    end: number;
  };
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#e4dbc9] bg-[#fffaf0] px-5 py-5 dark:border-[#302c24] dark:bg-[#11110f] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          <UserRound className="h-4 w-4" />
        </span>

        <div>
          <h2 className="font-display text-2xl font-semibold leading-none">
            Account directory
          </h2>

          <p className="mt-2 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
            {loading
              ? "Loading account records"
              : totalRecords === 0
                ? "No matching accounts"
                : `Showing ${visibleRange.start}–${visibleRange.end} of ${totalRecords}`}
          </p>
        </div>
      </div>

      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-3 py-1.5 text-xs font-bold dark:border-[#302c24] dark:bg-[#1a1712]">
        <span
          className={`h-2 w-2 rounded-full ${
            loading ? "animate-pulse bg-amber-500" : "bg-emerald-500"
          }`}
        />

        {loading ? "Updating" : "Directory ready"}
      </span>
    </div>
  );
}

function UsersTable({
  users,
  loading,
  onOpenUser
}: {
  users: AdminUserListItem[];
  loading: boolean;
  onOpenUser: (appUserId: number) => void;
}) {
  return (
    <table className="w-full min-w-[1180px]">
      <thead className="sticky top-0 z-10 border-b border-[#d8cdb6] bg-[#f2eadb]/90 text-left backdrop-blur dark:border-[#302c24] dark:bg-[#191711]/95">
        <tr className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6f6758] dark:text-[#aaa193]">
          <th className="px-6 py-4">User</th>

          <th className="px-5 py-4">Roles</th>

          <th className="px-5 py-4">Sign-in</th>

          <th className="px-5 py-4">Email</th>

          <th className="px-5 py-4">Status</th>

          <th className="px-5 py-4">Sessions</th>

          <th className="px-5 py-4">Last login</th>

          <th className="px-6 py-4">Joined</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-[#e6ddcb] dark:divide-[#28251e]">
        {loading ? (
          <UsersTableSkeleton />
        ) : users.length === 0 ? (
          <tr>
            <td colSpan={8}>
              <UsersEmptyState />
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <UserRow
              key={user.appUserId}
              user={user}
              onOpen={() => onOpenUser(user.appUserId)}
            />
          ))
        )}
      </tbody>
    </table>
  );
}

function UserRow({
  user,
  onOpen
}: {
  user: AdminUserListItem;
  onOpen: () => void;
}) {
  const signInMethods = getSignInMethods(user);

  return (
    <tr
      tabIndex={0}
      role="link"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer transition hover:bg-[#fffaf0] focus:bg-[#fffaf0] focus:outline-none dark:hover:bg-[#17150f] dark:focus:bg-[#17150f]"
    >
      <td className="px-6 py-4">
        <UserIdentity user={user} />
      </td>

      <td className="px-5 py-4">
        <BadgeList values={user.roles} emptyLabel="No role" />
      </td>

      <td className="px-5 py-4">
        <BadgeList values={signInMethods} emptyLabel="Unavailable" />
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          type={user.emailConfirmed ? "success" : "warning"}
          label={user.emailConfirmed ? "Verified" : "Unverified"}
        />
      </td>

      <td className="px-5 py-4">
        <AccountStatusBadge user={user} />
      </td>

      <td className="px-5 py-4">
        <SessionCount value={user.activeSessionCount} />
      </td>

      <td className="px-5 py-4">
        <DateValue value={user.lastLoginAt} />
      </td>

      <td className="px-6 py-4">
        <DateValue value={user.createdAt} />
      </td>
    </tr>
  );
}

function MobileUsersList({
  users,
  loading,
  onOpenUser
}: {
  users: AdminUserListItem[];
  loading: boolean;
  onOpenUser: (appUserId: number) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <MobileUserCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <UsersEmptyState />;
  }

  return (
    <div className="divide-y divide-[#e4dbc9] dark:divide-[#302c24]">
      {users.map((user) => (
        <MobileUserCard
          key={user.appUserId}
          user={user}
          onOpen={() => onOpenUser(user.appUserId)}
        />
      ))}
    </div>
  );
}

function MobileUserCard({
  user,
  onOpen
}: {
  user: AdminUserListItem;
  onOpen: () => void;
}) {
  const signInMethods = getSignInMethods(user);

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer p-4 transition hover:bg-[#fffaf0] focus:bg-[#fffaf0] focus:outline-none dark:hover:bg-[#17150f] dark:focus:bg-[#17150f] sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <UserIdentity user={user} />

        <AccountStatusBadge user={user} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MobileDetail
          label="Email status"
          icon={<MailCheck className="h-4 w-4" />}
        >
          <StatusBadge
            type={user.emailConfirmed ? "success" : "warning"}
            label={user.emailConfirmed ? "Verified" : "Unverified"}
          />
        </MobileDetail>

        <MobileDetail
          label="Sessions"
          icon={<MonitorSmartphone className="h-4 w-4" />}
        >
          <span className="text-sm font-black tabular-nums">
            {user.activeSessionCount}
          </span>
        </MobileDetail>

        <MobileDetail label="Last login" icon={<Clock3 className="h-4 w-4" />}>
          <DateValue value={user.lastLoginAt} compact />
        </MobileDetail>

        <MobileDetail
          label="Joined"
          icon={<CalendarDays className="h-4 w-4" />}
        >
          <DateValue value={user.createdAt} compact />
        </MobileDetail>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#817867] dark:text-[#928a7d]">
              Roles
            </p>

            <div className="mt-2">
              <BadgeList values={user.roles} emptyLabel="No role" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#817867] dark:text-[#928a7d]">
              Sign-in methods
            </p>

            <div className="mt-2">
              <BadgeList values={signInMethods} emptyLabel="Unavailable" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function UserIdentity({ user }: { user: AdminUserListItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar user={user} />

      <div className="min-w-0">
        <p className="truncate text-sm font-black">
          {user.fullName || "Unnamed user"}
        </p>

        <p className="mt-1 truncate text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
          {user.email}
        </p>

        {user.phoneNumber && (
          <p className="mt-1 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
            {user.phoneNumber}
          </p>
        )}
      </div>
    </div>
  );
}

function UserAvatar({ user }: { user: AdminUserListItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user.profileImageUrl]);

  const showImage = Boolean(user.profileImageUrl?.trim()) && !imageFailed;

  const initials = (user.fullName || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d8cdb6] bg-[#f2eadb] text-sm font-black text-[#8a6624] shadow-sm dark:border-[#302c24] dark:bg-[#242016] dark:text-[#d6b46a]">
      {showImage ? (
        <img
          src={user.profileImageUrl!}
          alt={`${user.fullName || "User"} profile`}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials || "U"
      )}
    </span>
  );
}

function BadgeList({
  values,
  emptyLabel
}: {
  values: string[];
  emptyLabel: string;
}) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  if (uniqueValues.length === 0) {
    return (
      <span className="text-xs font-medium text-[#817867] dark:text-[#928a7d]">
        {emptyLabel}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueValues.map((value) => (
        <Badge key={value}>{value}</Badge>
      ))}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-lg border border-[#d8cdb6] bg-[#fffaf0] px-2.5 py-1 text-[10px] font-bold text-[#6f6758] dark:border-[#302c24] dark:bg-[#191711] dark:text-[#c8bfae]">
      {children}
    </span>
  );
}

type StatusBadgeType = "success" | "warning" | "danger" | "neutral";

function StatusBadge({
  label,
  type
}: {
  label: string;
  type: StatusBadgeType;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${getStatusBadgeClass(
        type
      )}`}
    >
      {label}
    </span>
  );
}

function AccountStatusBadge({ user }: { user: AdminUserListItem }) {
  if (user.isLocked) {
    return <StatusBadge type="danger" label="Locked" />;
  }

  if (user.isActive) {
    return <StatusBadge type="success" label="Active" />;
  }

  return <StatusBadge type="warning" label="Inactive" />;
}

function SessionCount({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-[#e4dbc9] bg-[#fffaf0] px-3 py-2 text-xs font-black tabular-nums dark:border-[#302c24] dark:bg-[#11110f]">
      <MonitorSmartphone className="h-4 w-4 text-[#8a6624] dark:text-[#d6b46a]" />
      {value}
    </span>
  );
}

function DateValue({
  value,
  compact = false
}: {
  value?: string | null;
  compact?: boolean;
}) {
  return (
    <span
      className={`font-semibold text-[#6f6758] dark:text-[#aaa193] ${
        compact ? "text-[11px] leading-5" : "text-xs leading-5"
      }`}
    >
      {formatDate(value)}
    </span>
  );
}

function MobileDetail({
  label,
  icon,
  children
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-3 dark:border-[#302c24] dark:bg-[#11110f]">
      <div className="flex items-center gap-2 text-[#8a6624] dark:text-[#d6b46a]">
        {icon}

        <p className="text-[9px] font-bold uppercase tracking-[0.09em]">
          {label}
        </p>
      </div>

      <div className="mt-2 min-w-0">{children}</div>
    </div>
  );
}

function PaginationFooter({
  pageNumber,
  pageSize,
  totalPages,
  totalRecords,
  visibleRange,
  loading,
  onPageSizeChange,
  onPrevious,
  onNext
}: {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  visibleRange: {
    start: number;
    end: number;
  };
  loading: boolean;
  onPageSizeChange: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="flex flex-col gap-4 border-t border-[#d8cdb6] bg-[#fffaf0] px-5 py-4 dark:border-[#302c24] dark:bg-[#11110f] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-xs font-medium text-[#6f6758] dark:text-[#aaa193]">
        Showing{" "}
        <strong className="text-[#1f1a12] dark:text-[#e8e3d8]">
          {visibleRange.start}–{visibleRange.end}
        </strong>{" "}
        of{" "}
        <strong className="text-[#1f1a12] dark:text-[#e8e3d8]">
          {totalRecords}
        </strong>{" "}
        users
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <UniversalDropdown
          value={pageSize}
          options={PAGE_SIZE_OPTIONS}
          onChange={onPageSizeChange}
          className="w-full sm:w-40"
        />

        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <button
            type="button"
            disabled={pageNumber <= 1 || loading}
            onClick={onPrevious}
            aria-label="Previous users page"
            className={paginationButtonClassName}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-28 text-center text-xs font-black">
            Page {totalPages === 0 ? 0 : pageNumber} of {totalPages}
          </span>

          <button
            type="button"
            disabled={pageNumber >= totalPages || totalPages === 0 || loading}
            onClick={onNext}
            aria-label="Next users page"
            className={paginationButtonClassName}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}

function UsersTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: 8 }).map((_, cellIndex) => (
            <td key={cellIndex} className="px-5 py-5">
              <div
                className={`animate-pulse rounded-lg bg-[#e8dfcd] dark:bg-[#28251e] ${
                  cellIndex === 0 ? "h-10 w-52" : "h-7 w-24"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function MobileUserCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[1.5rem] border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
      <div className="flex items-center gap-3">
        <span className="h-12 w-12 rounded-2xl bg-[#e8dfcd] dark:bg-[#28251e]" />

        <div className="flex-1">
          <div className="h-3.5 w-36 rounded bg-[#e8dfcd] dark:bg-[#28251e]" />
          <div className="mt-2 h-3 w-48 rounded bg-[#eee6d7] dark:bg-[#201d18]" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <span
            key={index}
            className="h-20 rounded-2xl bg-[#eee6d7] dark:bg-[#201d18]"
          />
        ))}
      </div>
    </div>
  );
}

function UsersEmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        <Users className="h-6 w-6" />
      </span>

      <h3 className="font-display mt-5 text-2xl font-semibold">
        No users found
      </h3>

      <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        No account matches the current search and filter combination.
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <span aria-hidden="true" className="text-sm font-black text-[#4285F4]">
      G
    </span>
  );
}

function getSignInMethods(user: AdminUserListItem) {
  return [
    user.hasPassword ? "Password" : null,
    ...user.connectedProviders
  ].filter(Boolean) as string[];
}

function getPercentage(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function getSummaryToneClass(tone: SummaryTone) {
  if (tone === "green") {
    return {
      icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
      glow: "bg-emerald-400/10 dark:bg-emerald-400/5"
    };
  }

  if (tone === "red") {
    return {
      icon: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
      glow: "bg-red-400/10 dark:bg-red-400/5"
    };
  }

  if (tone === "blue") {
    return {
      icon: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
      glow: "bg-sky-400/10 dark:bg-sky-400/5"
    };
  }

  return {
    icon: "bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]",
    glow: "bg-[#d6b46a]/12 dark:bg-[#d6b46a]/6"
  };
}

function getStatusBadgeClass(type: StatusBadgeType) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300";
  }

  if (type === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300";
  }

  if (type === "danger") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";
  }

  return "border-[#d8cdb6] bg-[#fffaf0] text-[#6f6758] dark:border-[#302c24] dark:bg-[#191711] dark:text-[#c8bfae]";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Never";
  }

  const utcValue =
    value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;

  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

const paginationButtonClassName =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]";
