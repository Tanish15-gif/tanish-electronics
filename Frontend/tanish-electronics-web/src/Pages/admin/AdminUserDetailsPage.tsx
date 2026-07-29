import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CircleUserRound,
  Clock3,
  Globe2,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  MailCheck,
  MonitorSmartphone,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Tv,
  UserRound
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { Link, useParams } from "react-router-dom";

import {
  getAdminUserDetails,
  updateAdminUserStatus,
  unlockAdminUser,
  revokeAdminUserSessions,
  type AdminUserDetails
} from "../../Services/adminUsersService";

import ActionButton from "../../components/UI/ActionButton";

type AdminUserAction = "activate" | "deactivate" | "unlock" | "revoke-sessions";

type ActionMessage = {
  type: "success" | "error";
  text: string;
} | null;

export default function AdminUserDetailsPage() {
  const { appUserId } = useParams();

  const [user, setUser] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [pendingAction, setPendingAction] = useState<AdminUserAction | null>(
    null
  );

  const [processingAction, setProcessingAction] =
    useState<AdminUserAction | null>(null);

  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);

  const loadUser = useCallback(
    async (silent = false) => {
      const parsedUserId = Number(appUserId);

      if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        setError("Invalid user identifier.");
        setLoading(false);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await getAdminUserDetails(parsedUserId);

        setUser(response);
      } catch (requestError) {
        if (!silent) {
          setUser(null);
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load user details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appUserId]
  );

  async function handleConfirmAction() {
    if (!user || !pendingAction) {
      return;
    }

    const action = pendingAction;

    try {
      setProcessingAction(action);
      setActionMessage(null);

      switch (action) {
        case "activate":
          await updateAdminUserStatus(user.appUserId, true);
          break;

        case "deactivate":
          await updateAdminUserStatus(user.appUserId, false);
          break;

        case "unlock":
          await unlockAdminUser(user.appUserId);
          break;

        case "revoke-sessions":
          await revokeAdminUserSessions(user.appUserId);
          break;
      }

      const refreshedUser = await getAdminUserDetails(user.appUserId);

      setUser(refreshedUser);
      setPendingAction(null);

      setActionMessage({
        type: "success",
        text: getActionSuccessMessage(action)
      });
    } catch (requestError) {
      setPendingAction(null);

      setActionMessage({
        type: "error",
        text:
          requestError instanceof Error
            ? requestError.message
            : "The account action could not be completed."
      });
    } finally {
      setProcessingAction(null);
    }
  }

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "User Details | Tanish Electronics";

    void loadUser();

    return () => {
      document.title = previousTitle;
    };
  }, [loadUser]);

  const signInMethods = useMemo(() => {
    if (!user) {
      return [];
    }

    return Array.from(
      new Set(
        [
          user.hasPassword ? "Password" : null,
          ...user.connectedProviders
        ].filter(Boolean) as string[]
      )
    );
  }, [user]);

  if (loading) {
    return <UserDetailsSkeleton />;
  }

  if (!user) {
    return (
      <UserDetailsError
        message={error || "User account was not found."}
        onRetry={() => void loadUser()}
      />
    );
  }

  const accountState = getAccountState(user);

  return (
    <main
      className="te-sheet-bg min-h-full px-4 py-6 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <div className="mx-auto w-full max-w-[1500px]">
        {/* Top bar: back link + refresh only. Alert moved to its own row below
            so it never has to fight these two for horizontal space. */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/admin/users"
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#8a6624] transition hover:opacity-70 dark:text-[#d6b46a]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>

          <ActionButton
            type="button"
            onClick={() => void loadUser(true)}
            loading={refreshing}
            spinnerOnly
            fullWidth={false}
            variant="outline"
            className="!min-h-10 !rounded-xl !px-4 !py-2.5 !text-xs"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh account
            </span>
          </ActionButton>
        </div>

        {actionMessage && (
          <ActionAlert
            message={actionMessage}
            onClose={() => setActionMessage(null)}
          />
        )}

        <AdminActionConfirmModal
          action={pendingAction}
          user={user}
          processing={processingAction !== null}
          onCancel={() => {
            if (!processingAction) {
              setPendingAction(null);
            }
          }}
          onConfirm={() => {
            void handleConfirmAction();
          }}
        />

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </div>
        )}

        <UserHero
          user={user}
          signInMethodCount={signInMethods.length}
          accountState={accountState}
        />

        <section className="mt-6 overflow-hidden rounded-[1.9rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <SectionHeader
            eyebrow="Account dossier"
            title="Identity and access"
            description="The account record, access configuration and verification state."
            icon={<CircleUserRound className="h-5 w-5" />}
          />

          <div className="grid xl:grid-cols-[minmax(0,1.25fr)_420px]">
            <div className="divide-y divide-[#e4dbc9] dark:divide-[#302c24]">
              <InformationSection
                title="Profile information"
                description="Identity and contact details stored for this account."
                icon={<UserRound className="h-4 w-4" />}
              >
                <DetailsGrid>
                  <DetailRow
                    label="Full name"
                    value={user.fullName || "Unnamed user"}
                  />

                  <DetailRow label="Email address" value={user.email} />

                  <DetailRow
                    label="Phone number"
                    value={user.phoneNumber || "Not added"}
                  />

                  <DetailRow
                    label="User identifier"
                    value={`#${user.appUserId}`}
                  />

                  <DetailRow
                    label="Joined"
                    value={formatDate(user.createdAt)}
                  />

                  <DetailRow
                    label="Last updated"
                    value={formatDate(user.updatedAt)}
                  />
                </DetailsGrid>
              </InformationSection>

              <InformationSection
                title="Authentication"
                description="Methods available to authenticate this account."
                icon={<KeyRound className="h-4 w-4" />}
              >
                <div className="flex flex-wrap gap-2">
                  {signInMethods.length > 0 ? (
                    signInMethods.map((method) => (
                      <MethodBadge key={method}>{method}</MethodBadge>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-[#817867] dark:text-[#928a7d]">
                      No sign-in methods found.
                    </span>
                  )}
                </div>

                <DetailsGrid className="mt-5">
                  <DetailRow
                    label="Password sign-in"
                    value={user.hasPassword ? "Configured" : "Not configured"}
                  />

                  <DetailRow
                    label="Password updated"
                    value={formatDate(user.passwordUpdatedAt)}
                  />

                  <DetailRow
                    label="Failed login attempts"
                    value={String(user.accessFailedCount)}
                  />

                  <DetailRow
                    label="Lockout ends"
                    value={
                      user.isLocked
                        ? formatDate(user.lockoutEndAt)
                        : "Not locked"
                    }
                  />
                </DetailsGrid>
              </InformationSection>
            </div>

            {/* Sidebar: now a single visual unit. The old version stacked three
                separate bordered cards (overview list, info note, actions card)
                inside this already-bordered aside. That's flattened below into
                one flow with consistent section labels and dividers instead of
                repeated borders. */}
            <aside className="border-t border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-6 xl:border-l xl:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
                Access overview
              </p>

              <h2 className="font-display mt-2 text-2xl font-semibold leading-none">
                Account state
              </h2>

              <p className="mt-3 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
                Current access, verification and provider coverage.
              </p>

              <div className="mt-6 divide-y divide-[#e4dbc9] rounded-2xl border border-[#e4dbc9] bg-[#fffdf7] px-4 dark:divide-[#302c24] dark:border-[#302c24] dark:bg-[#1a1712]">
                <OverviewRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Account access"
                  valueNode={
                    <StatusBadge
                      label={accountState}
                      tone={
                        user.isLocked
                          ? "danger"
                          : user.isActive
                            ? "success"
                            : "warning"
                      }
                    />
                  }
                />

                <OverviewRow
                  icon={<MailCheck className="h-4 w-4" />}
                  label="Email verification"
                  valueNode={
                    <StatusBadge
                      label={user.emailConfirmed ? "Verified" : "Unverified"}
                      tone={user.emailConfirmed ? "success" : "warning"}
                    />
                  }
                />

                <OverviewRow
                  icon={<KeyRound className="h-4 w-4" />}
                  label="Password"
                  value={user.hasPassword ? "Configured" : "Not configured"}
                />

                <OverviewRow
                  icon={<Globe2 className="h-4 w-4" />}
                  label="Providers"
                  value={
                    user.connectedProviders.length > 0
                      ? user.connectedProviders.join(", ")
                      : "None"
                  }
                />
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-[#d8cdb6] px-4 py-3 dark:border-[#302c24]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6624] dark:text-[#d6b46a]" />

                <p className="text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                  This view is read-only and reflects the latest account state
                  returned by the administration API.
                </p>
              </div>

              <div className="mt-8 border-t border-[#e4dbc9] pt-6 dark:border-[#302c24]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
                  Administrator controls
                </p>

                <h3 className="font-display mt-2 text-xl font-semibold leading-none">
                  Account actions
                </h3>

                <p className="mt-2 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                  Changes apply immediately and affect this user's access.
                </p>

                <div className="mt-5 space-y-3">
                  <AdminActionButton
                    title={
                      user.isActive ? "Deactivate account" : "Activate account"
                    }
                    description={
                      user.isActive
                        ? "Block account access and sign the user out from every device."
                        : "Restore access to this user account."
                    }
                    tone={user.isActive ? "danger" : "success"}
                    loading={
                      processingAction ===
                      (user.isActive ? "deactivate" : "activate")
                    }
                    onClick={() =>
                      setPendingAction(
                        user.isActive ? "deactivate" : "activate"
                      )
                    }
                    icon={<AccountAccessIcon />}
                  />

                  <AdminActionButton
                    title="Unlock account"
                    description={
                      user.isLocked
                        ? "Remove the current lockout and reset failed login attempts."
                        : "This account is not currently locked."
                    }
                    tone="warning"
                    disabled={!user.isLocked}
                    loading={processingAction === "unlock"}
                    onClick={() => setPendingAction("unlock")}
                    icon={<UnlockIcon />}
                  />

                  <AdminActionButton
                    title="Revoke all sessions"
                    description={
                      user.activeSessionCount > 0
                        ? `Sign the user out from ${user.activeSessionCount} active ${
                            user.activeSessionCount === 1 ? "device" : "devices"
                          }.`
                        : "This account has no active sessions."
                    }
                    tone="danger"
                    disabled={user.activeSessionCount === 0}
                    loading={processingAction === "revoke-sessions"}
                    onClick={() => setPendingAction("revoke-sessions")}
                    icon={<RevokeSessionsIcon />}
                  />
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.9rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <SectionHeader
            eyebrow="Account activity"
            title="Authentication timeline"
            description="Recent sign-in, sign-out and account-presence timestamps."
            icon={<Activity className="h-5 w-5" />}
          />

          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            <TimelineMetric
              icon={<Clock3 className="h-4 w-4" />}
              label="Last login"
              value={formatDate(user.lastLoginAt)}
            />

            <TimelineMetric
              icon={<Activity className="h-4 w-4" />}
              label="Last seen"
              value={formatDate(user.lastSeenAt)}
            />

            <TimelineMetric
              icon={<CalendarClock className="h-4 w-4" />}
              label="Last logout"
              value={formatDate(user.lastLogoutAt)}
            />

            <TimelineMetric
              icon={<MonitorSmartphone className="h-4 w-4" />}
              label="Active sessions"
              value={String(user.activeSessionCount)}
              last
            />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.9rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <SectionHeader
            eyebrow="Trusted devices"
            title={`Active sessions (${user.activeSessions.length})`}
            description="Devices that currently hold a valid session for this account."
            icon={<MonitorSmartphone className="h-5 w-5" />}
          />

          {user.activeSessions.length === 0 ? (
            <SessionsEmptyState />
          ) : (
            <div className="divide-y divide-[#e4dbc9] dark:divide-[#302c24]">
              {user.activeSessions.map((session) => (
                <SessionRow key={session.userSessionId} session={session} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function UserHero({
  user,
  signInMethodCount,
  accountState
}: {
  user: AdminUserDetails;
  signInMethodCount: number;
  accountState: string;
}) {
  return (
    <header className="relative mt-5 overflow-hidden rounded-[2rem] border border-[#302c24] bg-[#1f1a12] p-6 text-[#f7f5ef] shadow-[0_24px_70px_-36px_rgba(17,16,15,0.8)] sm:p-8 lg:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "linear-gradient(to right, black, transparent 78%)"
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#d6b46a]/12 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar user={user} />

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
              User account #{user.appUserId}
            </p>

            <h1 className="font-display mt-3 truncate text-4xl font-semibold leading-none sm:text-5xl">
              {user.fullName || "Unnamed user"}
            </h1>

            <div className="mt-4 space-y-2 text-sm font-medium text-[#c8bead]">
              <p className="flex items-center gap-2 break-all">
                <Mail className="h-4 w-4 shrink-0 text-[#d6b46a]" />
                {user.email}
              </p>

              {user.phoneNumber && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[#d6b46a]" />
                  {user.phoneNumber}
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-[#d6b46a]/25 bg-[#d6b46a]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#d6b46a]"
                >
                  {role}
                </span>
              ))}

              <StatusBadge
                label={accountState}
                tone={
                  user.isLocked
                    ? "danger"
                    : user.isActive
                      ? "success"
                      : "warning"
                }
              />

              <StatusBadge
                label={
                  user.emailConfirmed ? "Email verified" : "Email unverified"
                }
                tone={user.emailConfirmed ? "success" : "warning"}
              />
            </div>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[620px]">
          <HeroMetric
            label="Active sessions"
            value={String(user.activeSessionCount)}
            icon={<MonitorSmartphone className="h-4 w-4" />}
          />

          <HeroMetric
            label="Failed logins"
            value={String(user.accessFailedCount)}
            icon={<LockKeyhole className="h-4 w-4" />}
          />

          <HeroMetric
            label="Sign-in methods"
            value={String(signInMethodCount)}
            icon={<KeyRound className="h-4 w-4" />}
          />
        </div>
      </div>
    </header>
  );
}

function UserAvatar({ user }: { user: AdminUserDetails }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user.profileImageUrl]);

  const initials = (user.fullName || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const showImage = Boolean(user.profileImageUrl?.trim()) && !imageFailed;

  return (
    <div className="relative shrink-0">
      <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17130e] text-2xl font-bold shadow-lg sm:h-28 sm:w-28">
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

      <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#1f1a12] bg-emerald-500 text-white">
        <BadgeCheck className="h-4 w-4" />
      </span>
    </div>
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

        <p className="text-[10px] font-bold uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>

      <p className="mt-3 text-xl font-black tabular-nums text-[#f7f5ef]">
        {value}
      </p>
    </div>
  );
}

function SectionHeader({
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
    <div className="flex items-start gap-4 border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-6">
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

function InformationSection({
  title,
  description,
  icon,
  children
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          {icon}
        </span>

        <div>
          <h3 className="text-sm font-bold">{title}</h3>

          <p className="mt-1 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function DetailsGrid({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-x-8 sm:grid-cols-2 ${className}`}>{children}</div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-[#eee6d7] py-3 last:border-b-0 dark:border-[#28251e]">
      <span className="text-xs font-medium text-[#817867] dark:text-[#928a7d]">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-sm font-bold">
        {value}
      </span>
    </div>
  );
}

function OverviewRow({
  icon,
  label,
  value,
  valueNode
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          {icon}
        </span>

        <span className="text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
          {label}
        </span>
      </div>

      <span className="max-w-[52%] break-words text-right text-xs font-bold">
        {valueNode ?? value}
      </span>
    </div>
  );
}

function TimelineMetric({
  icon,
  label,
  value,
  last = false
}: {
  icon: ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`p-5 sm:p-6 ${
        last
          ? ""
          : "border-b border-[#e4dbc9] dark:border-[#302c24] sm:border-r xl:border-b-0"
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        {icon}
      </span>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold leading-6">{value}</p>
    </div>
  );
}

function SessionRow({
  session
}: {
  session: AdminUserDetails["activeSessions"][number];
}) {
  const browser = session.browserVersion
    ? `${session.browserName} ${session.browserVersion}`
    : session.browserName;

  return (
    <article className="grid gap-4 px-5 py-5 transition hover:bg-[#fffaf0] dark:hover:bg-[#11110f] sm:grid-cols-[56px_minmax(0,1fr)_220px] sm:items-center sm:px-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e4dbc9] bg-[#fffaf0] text-[#8a6624] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d6b46a]">
        <DeviceIcon deviceType={session.deviceType} />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-bold sm:text-base">
            {session.deviceName || "Unknown device"}
          </h3>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            Active
          </span>
        </div>

        <p className="mt-1 text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
          {browser || "Unknown browser"}
          {session.operatingSystem ? ` · ${session.operatingSystem}` : ""}
        </p>

        <p className="mt-2 flex items-center gap-2 break-all text-xs font-medium text-[#817867] dark:text-[#928a7d]">
          <Globe2 className="h-3.5 w-3.5 shrink-0" />
          {session.ipAddress || "IP address unavailable"}
        </p>
      </div>

      <div className="border-t border-[#e4dbc9] pt-3 text-left dark:border-[#302c24] sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
        <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#817867] dark:text-[#928a7d]">
          Last activity
        </p>

        <p className="mt-1 text-xs font-bold">
          {formatRelativeDate(session.lastSeenAt)}
        </p>

        <p className="mt-2 text-[10px] font-medium text-[#928a7d]">
          Signed in {formatDate(session.createdAt)}
        </p>
      </div>
    </article>
  );
}

function SessionsEmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        <MonitorSmartphone className="h-6 w-6" />
      </span>

      <h3 className="font-display mt-5 text-2xl font-semibold">
        No active sessions
      </h3>

      <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        This user is not currently signed in on any trusted device.
      </p>
    </div>
  );
}

function MethodBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-lg border border-[#d8cdb6] bg-[#fffaf0] px-2.5 py-1 text-[10px] font-bold text-[#6f6758] dark:border-[#302c24] dark:bg-[#191711] dark:text-[#c8bfae]">
      {children}
    </span>
  );
}

function StatusBadge({
  label,
  tone
}: {
  label: string;
  tone: "success" | "warning" | "danger";
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${className}`}
    >
      {label}
    </span>
  );
}

function UserDetailsSkeleton() {
  return (
    <main className="te-sheet-bg min-h-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1500px] animate-pulse">
        <div className="h-10 w-40 rounded-xl bg-[#e8dfcd] dark:bg-[#28251e]" />

        <div className="mt-5 h-[310px] rounded-[2rem] bg-[#1f1a12]" />

        <div className="mt-6 h-[640px] rounded-[1.9rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#11110f]" />

        <div className="mt-6 h-[250px] rounded-[1.9rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#11110f]" />

        <div className="mt-6 h-[360px] rounded-[1.9rem] border border-[#d8cdb6] bg-[#fffdf7] dark:border-[#302c24] dark:bg-[#11110f]" />
      </div>
    </main>
  );
}

function UserDetailsError({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="te-sheet-bg min-h-full px-4 py-8 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[900px]">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#8a6624] dark:text-[#d6b46a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>

        <section className="mt-6 rounded-[1.75rem] border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          <h1 className="text-lg font-bold">Unable to load user</h1>

          <p className="mt-2 text-sm font-medium">{message}</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </section>
      </div>
    </main>
  );
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
  const type = deviceType.toLowerCase();

  if (type.includes("mobile") || type.includes("phone")) {
    return <Smartphone className="h-5 w-5" />;
  }

  if (type.includes("tablet")) {
    return <Tablet className="h-5 w-5" />;
  }

  if (type.includes("tv")) {
    return <Tv className="h-5 w-5" />;
  }

  return <Laptop className="h-5 w-5" />;
}

function getAccountState(user: AdminUserDetails) {
  if (user.isLocked) {
    return "Locked";
  }

  if (user.isActive) {
    return "Active";
  }

  return "Inactive";
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

// Tone-matched icon chip so the action button's icon visually agrees with
// its color story instead of a flat bg-white/70 regardless of tone.
const ACTION_ICON_TONE_CLASSES: Record<
  "success" | "warning" | "danger",
  string
> = {
  success: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300",
  warning: "bg-amber-600/15 text-amber-800 dark:text-amber-300",
  danger: "bg-red-600/15 text-red-800 dark:text-red-300"
};

function AdminActionButton({
  title,
  description,
  icon,
  tone,
  disabled = false,
  loading = false,
  onClick
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tone: "success" | "warning" | "danger";
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/15"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300 dark:hover:bg-amber-400/15"
        : "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/15";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${toneClasses} ${
        disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACTION_ICON_TONE_CLASSES[tone]}`}
      >
        {loading ? <LoadingSpinner /> : icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-black">
          {loading ? "Processing..." : title}
        </span>

        <span className="mt-1 block text-xs font-semibold leading-5 opacity-75">
          {description}
        </span>
      </span>
    </button>
  );
}

function AdminActionConfirmModal({
  action,
  user,
  processing,
  onCancel,
  onConfirm
}: {
  action: AdminUserAction | null;
  user: AdminUserDetails;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!action) {
      return;
    }

    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !processing) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;

      window.removeEventListener("keydown", handleEscape);
    };
  }, [action, processing, onCancel]);

  if (!action) {
    return null;
  }

  const content = getActionModalContent(action, user);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        disabled={processing}
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-action-title"
        className="relative w-full max-w-md rounded-3xl border border-[#d8cdb6] bg-[#fffdf7] p-6 text-[#1f1a12] shadow-2xl dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8]"
      >
        {/* was h-13 w-13 — not a real Tailwind size, so this box rendered
            with no explicit width/height. Fixed to h-12 w-12. */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${content.iconClassName}`}
        >
          {content.icon}
        </div>

        <h2 id="admin-action-title" className="mt-5 text-xl font-black">
          {content.title}
        </h2>

        <p className="mt-2 text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#aaa193]">
          {content.description}
        </p>

        <div className="mt-4 rounded-2xl border border-[#e3dac8] bg-[#fffaf0] px-4 py-3 dark:border-[#28251e] dark:bg-[#0c0c0b]">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867]">
            Selected user
          </p>

          <p className="mt-1 truncate text-sm font-black">{user.fullName}</p>

          <p className="mt-1 break-all text-xs font-semibold text-[#817867]">
            {user.email}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={processing}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8cdb6] bg-transparent px-5 text-sm font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:hover:bg-[#242016]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={onConfirm}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${content.confirmClassName}`}
          >
            {processing && <LoadingSpinner />}

            {processing ? "Processing..." : content.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function getActionModalContent(
  action: AdminUserAction,
  user: AdminUserDetails
) {
  switch (action) {
    case "activate":
      return {
        title: "Activate this account?",
        description:
          "The user will regain access and will be able to sign in again.",
        confirmLabel: "Activate account",
        confirmClassName: "bg-emerald-600 hover:bg-emerald-700",
        iconClassName:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
        icon: <AccountAccessIcon />
      };

    case "deactivate":
      return {
        title: "Deactivate this account?",
        description:
          "The account will be blocked immediately. All active sessions and refresh tokens will also be revoked.",
        confirmLabel: "Deactivate account",
        confirmClassName: "bg-red-600 hover:bg-red-700",
        iconClassName:
          "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
        icon: <AccountAccessIcon />
      };

    case "unlock":
      return {
        title: "Unlock this account?",
        description:
          "The lockout will be removed and all failed login attempts will be reset.",
        confirmLabel: "Unlock account",
        confirmClassName: "bg-amber-600 hover:bg-amber-700",
        iconClassName:
          "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
        icon: <UnlockIcon />
      };

    case "revoke-sessions":
      return {
        title: "Revoke all active sessions?",
        description: `This will sign ${user.fullName} out from all ${user.activeSessionCount} active ${
          user.activeSessionCount === 1 ? "device" : "devices"
        }.`,
        confirmLabel: "Revoke sessions",
        confirmClassName: "bg-red-600 hover:bg-red-700",
        iconClassName:
          "bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300",
        icon: <RevokeSessionsIcon />
      };
  }
}

function getActionSuccessMessage(action: AdminUserAction) {
  switch (action) {
    case "activate":
      return "The user account has been activated.";

    case "deactivate":
      return "The user account has been deactivated and all sessions were revoked.";

    case "unlock":
      return "The user account has been unlocked.";

    case "revoke-sessions":
      return "All active user sessions have been revoked.";
  }
}

function ActionAlert({
  message,
  onClose
}: {
  message: Exclude<ActionMessage, null>;
  onClose: () => void;
}) {
  const successful = message.type === "success";

  return (
    <div
      className={`mt-5 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5">
          {successful ? <SuccessIcon /> : <ErrorIcon />}
        </span>

        <p className="text-sm font-bold leading-6">{message.text}</p>
      </div>

      <button
        type="button"
        aria-label="Dismiss message"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 transition hover:bg-black/5 dark:hover:bg-white/5"
      >
        <CloseSmallIcon />
      </button>
    </div>
  );
}

function AccountAccessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M3.5 19c.4-3.8 2.2-5.7 5.5-5.7 2.2 0 3.8.9 4.7 2.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M16 13v7M12.5 16.5h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 10V7.5A3.5 3.5 0 0 1 15.5 5.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function RevokeSessionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 20h8M12 16v4M8 8l8 4M16 8l-8 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M12 7.5v6M12 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LoadingSpinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-25"
      />

      <path
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatRelativeDate(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const utcValue =
    value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;

  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  const now = new Date();
  const differenceMs = now.getTime() - date.getTime();
  const differenceMinutes = Math.floor(differenceMs / 60_000);

  if (differenceMinutes < 1) {
    return "Active now";
  }

  if (differenceMinutes < 60) {
    return `${differenceMinutes} min ago`;
  }

  const differenceHours = Math.floor(differenceMinutes / 60);

  if (differenceHours < 24) {
    return `${differenceHours} hr ago`;
  }

  const differenceDays = Math.floor(differenceHours / 24);

  if (differenceDays < 7) {
    return `${differenceDays} day${differenceDays === 1 ? "" : "s"} ago`;
  }

  return formatDate(value);
}
