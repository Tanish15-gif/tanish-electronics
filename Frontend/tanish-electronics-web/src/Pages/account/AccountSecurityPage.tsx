import {
  CalendarClock,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
  MonitorSmartphone,
  LogOut,
  MonitorOff,
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  Globe2,
  RefreshCw
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import {
  getActiveSessions,
  revokeSession,
  signOutAllSessions,
  signOutOtherSessions,
  type ActiveSession
} from "../../Services/customAuthService";

import ActionButton from "../../components/UI/ActionButton";
import {
  changePassword,
  clearAuthSession,
  completeSetPassword,
  getSecuritySummary,
  reauthenticateGoogleForPassword,
  type SecuritySummary
} from "../../Services/customAuthService";

function AccountSecurityPage() {
  const redirectTimerRef = useRef<number | null>(null);

  const [security, setSecurity] = useState<SecuritySummary | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(true);
  const [securityError, setSecurityError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [sessionAction, setSessionAction] = useState<"others" | "all" | null>(
    null
  );

  const [sessionMessage, setSessionMessage] = useState("");

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  const [loadingSessions, setLoadingSessions] = useState(true);

  const [sessionsError, setSessionsError] = useState("");

  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null
  );

  type CreatePasswordStep = "google" | "password";

  const [createPasswordStep, setCreatePasswordStep] =
    useState<CreatePasswordStep>("google");

  const [setupToken, setSetupToken] = useState("");

  const [creatingPassword, setCreatingPassword] = useState(false);

  const connectedProviders = useMemo(
    () => security?.connectedProviders ?? [],
    [security?.connectedProviders]
  );

  const accessMethodCount =
    (security?.hasPassword ? 1 : 0) + connectedProviders.length;

  async function handleGoogleReauthentication(credential?: string) {
    if (!credential) {
      setFormError("Google verification failed.");
      return;
    }

    try {
      setCreatingPassword(true);
      setFormError("");
      setFormSuccess("");

      const response = await reauthenticateGoogleForPassword(credential);

      setSetupToken(response.setupToken);
      setCreatePasswordStep("password");
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Google verification failed."
      );
    } finally {
      setCreatingPassword(false);
    }
  }

  const loadActiveSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      setSessionsError("");

      const response = await getActiveSessions();

      setActiveSessions(response);
    } catch (error) {
      setActiveSessions([]);

      setSessionsError(
        error instanceof Error
          ? error.message
          : "Unable to load active sessions."
      );
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  async function handleCreatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!setupToken) {
      setFormError(
        "Your verification session expired. Verify with Google again."
      );

      setCreatePasswordStep("google");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setCreatingPassword(true);
      setFormError("");
      setFormSuccess("");

      const response = await completeSetPassword({
        setupToken,
        newPassword
      });

      setFormSuccess(response.message);
      setSetupToken("");

      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setSecurity((current) =>
        current
          ? {
              ...current,
              hasPassword: true,
              passwordUpdatedAt: new Date().toISOString()
            }
          : current
      );
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create password."
      );
    } finally {
      setCreatingPassword(false);
    }
  }

  async function handleSignOutOtherSessions() {
    try {
      setSessionAction("others");
      setFormError("");
      setSessionMessage("");

      const response = await signOutOtherSessions();

      setSessionMessage(response.message);

      setSecurity((current) =>
        current
          ? {
              ...current,
              activeSessionCount: 1
            }
          : current
      );

      await loadActiveSessions();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign out other devices."
      );
    } finally {
      setSessionAction(null);
    }
  }

  async function handleSignOutAllSessions() {
    try {
      setSessionAction("all");
      setFormError("");
      setSessionMessage("");

      await signOutAllSessions();

      clearAuthSession();
      window.location.assign("/sign-in");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign out all devices."
      );
    } finally {
      setSessionAction(null);
    }
  }

  const loadSecurity = useCallback(async () => {
    try {
      setLoadingSecurity(true);
      setSecurityError("");

      const response = await getSecuritySummary();

      setSecurity(response);
    } catch (caughtError) {
      setSecurity(null);

      setSecurityError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load account security."
      );
    } finally {
      setLoadingSecurity(false);
    }
  }, []);

  async function handleRevokeSession(userSessionId: string) {
    try {
      setRevokingSessionId(userSessionId);
      setSessionsError("");
      setSessionMessage("");

      const response = await revokeSession(userSessionId);

      setActiveSessions((current) =>
        current.filter((session) => session.userSessionId !== userSessionId)
      );

      setSecurity((current) =>
        current
          ? {
              ...current,
              activeSessionCount: Math.max(0, current.activeSessionCount - 1)
            }
          : current
      );

      setSessionMessage(response.message);
    } catch (error) {
      setSessionsError(
        error instanceof Error
          ? error.message
          : "Unable to sign out this device."
      );
    } finally {
      setRevokingSessionId(null);
    }
  }

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Security Center | Tanish Electronics";

    void loadSecurity();
    void loadActiveSessions();

    return () => {
      document.title = previousTitle;

      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [loadSecurity, loadActiveSessions]);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError("");
    setFormSuccess("");

    if (!currentPassword.trim()) {
      setFormError("Enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setFormError(
        "Your new password must be different from your current password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("The new passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await changePassword({
        currentPassword,
        newPassword
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setFormSuccess(
        response.message || "Your password was changed successfully."
      );

      redirectTimerRef.current = window.setTimeout(() => {
        clearAuthSession();
        window.location.assign("/sign-in");
      }, 1500);
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to change your password."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      className="te-sheet-bg mx-auto w-full max-w-7xl px-4 py-6 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <SecurityHero
        security={security}
        loading={loadingSecurity}
        accessMethodCount={accessMethodCount}
      />

      {securityError && (
        <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold">
              Security information unavailable
            </p>

            <p className="mt-1 text-xs font-medium leading-5">
              {securityError}
            </p>
          </div>

          <ActionButton
            type="button"
            onClick={() => void loadSecurity()}
            loading={loadingSecurity}
            spinnerOnly
            fullWidth={false}
            variant="outline"
            className="!min-h-10 !shrink-0 !rounded-xl !px-4 !py-2 !text-xs"
          >
            Retry
          </ActionButton>
        </section>
      )}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PasswordSecurityCard
          security={security}
          loading={loadingSecurity}
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          showCurrentPassword={showCurrentPassword}
          showNewPassword={showNewPassword}
          showConfirmPassword={showConfirmPassword}
          submitting={submitting}
          createPasswordStep={createPasswordStep}
          creatingPassword={creatingPassword}
          googleConnected={connectedProviders.some((provider) =>
            provider.trim().toLowerCase().includes("google")
          )}
          error={formError}
          success={formSuccess}
          onCurrentPasswordChange={(value) => {
            setCurrentPassword(value);
            setFormError("");
            setFormSuccess("");
          }}
          onNewPasswordChange={(value) => {
            setNewPassword(value);
            setFormError("");
            setFormSuccess("");
          }}
          onConfirmPasswordChange={(value) => {
            setConfirmPassword(value);
            setFormError("");
            setFormSuccess("");
          }}
          onToggleCurrentPassword={() =>
            setShowCurrentPassword((current) => !current)
          }
          onToggleNewPassword={() => setShowNewPassword((current) => !current)}
          onToggleConfirmPassword={() =>
            setShowConfirmPassword((current) => !current)
          }
          onSubmit={handleChangePassword}
          onGoogleReauthentication={handleGoogleReauthentication}
          onGoogleError={() => {
            setFormError("Google verification failed.");
            setFormSuccess("");
          }}
          onCreatePassword={handleCreatePassword}
          onRestartGoogleVerification={() => {
            setSetupToken("");
            setCreatePasswordStep("google");
            setNewPassword("");
            setConfirmPassword("");
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setFormError("");
            setFormSuccess("");
          }}
        />

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
            <SectionHeading
              eyebrow="Session overview"
              title="Device access"
              description="Review the devices currently trusted by this account."
              icon={<MonitorSmartphone className="h-5 w-5" />}
              compact
            />

            <div className="mt-6 space-y-3">
              <StatusRow
                icon={<MonitorSmartphone className="h-4 w-4" />}
                label="Active sessions"
                value={
                  loadingSessions
                    ? "Checking"
                    : `${activeSessions.length} active`
                }
                successful={activeSessions.length > 0}
              />

              <StatusRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Current device"
                value={
                  activeSessions.some((session) => session.isCurrent)
                    ? "Recognized"
                    : "Not identified"
                }
                successful={activeSessions.some((session) => session.isCurrent)}
              />
            </div>
          </section>

          <ConnectedAccountsCard
            providers={connectedProviders}
            loading={loadingSecurity}
          />
        </aside>
      </div>

      <ActiveSessionsCard
        sessions={activeSessions}
        loading={loadingSessions}
        error={sessionsError}
        message={sessionMessage}
        revokingSessionId={revokingSessionId}
        sessionAction={sessionAction}
        onRefresh={loadActiveSessions}
        onRevokeSession={handleRevokeSession}
        onSignOutOtherSessions={handleSignOutOtherSessions}
        onSignOutAllSessions={handleSignOutAllSessions}
      />
    </main>
  );
}

function SecurityHero({
  security,
  loading,
  accessMethodCount
}: {
  security: SecuritySummary | null;
  loading: boolean;
  accessMethodCount: number;
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
          maskImage: "linear-gradient(to right, black, transparent 75%)"
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#d6b46a]/12 blur-3xl"
      />

      <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d6b46a]/25 bg-[#d6b46a]/10 text-[#d6b46a]">
            <ShieldCheck className="h-6 w-6" />
          </span>

          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
            Account protection
          </p>

          <h1 className="font-display mt-3 text-4xl font-semibold leading-none sm:text-5xl">
            Security center
          </h1>

          <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#c8bead]">
            Review sign-in methods, verify account protection and update the
            password used to access your administrator account.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[590px]">
          <HeroMetric
            label="Access methods"
            value={
              loading
                ? "Checking"
                : `${accessMethodCount} method${
                    accessMethodCount === 1 ? "" : "s"
                  }`
            }
            icon={<KeyRound className="h-4 w-4" />}
          />

          <HeroMetric
            label="Email status"
            value={
              loading
                ? "Checking"
                : security?.emailConfirmed
                  ? "Verified"
                  : "Unverified"
            }
            icon={<MailCheck className="h-4 w-4" />}
          />

          <HeroMetric
            label="Password updated"
            value={
              loading ? "Checking" : formatLongDate(security?.passwordUpdatedAt)
            }
            icon={<CalendarClock className="h-4 w-4" />}
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

function PasswordSecurityCard({
  security,
  loading,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  submitting,
  createPasswordStep,
  creatingPassword,
  googleConnected,
  error,
  success,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
  onGoogleReauthentication,
  onGoogleError,
  onCreatePassword,
  onRestartGoogleVerification
}: {
  security: SecuritySummary | null;
  loading: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  submitting: boolean;
  createPasswordStep: "google" | "password";
  creatingPassword: boolean;
  googleConnected: boolean;
  error: string;
  success: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onGoogleReauthentication: (credential?: string) => Promise<void>;
  onGoogleError: () => void;
  onCreatePassword: (event: FormEvent<HTMLFormElement>) => void;
  onRestartGoogleVerification: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-7">
        <SectionHeading
          eyebrow="Password protection"
          title={
            security?.hasPassword ? "Change password" : "Create a password"
          }
          description={
            security?.hasPassword
              ? "Update the password used for email and password sign-in."
              : "Verify your connected Google account before enabling password sign-in."
          }
          icon={<LockKeyhole className="h-5 w-5" />}
        />

        {!loading && security && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InlineStatus
              label="Password sign-in"
              value={security.hasPassword ? "Enabled" : "Not configured"}
              positive={security.hasPassword}
            />

            <InlineStatus
              label="Last password update"
              value={formatLongDate(security.passwordUpdatedAt)}
              positive={Boolean(security.passwordUpdatedAt)}
            />
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7">
        {loading ? (
          <PasswordFormSkeleton />
        ) : !security ? (
          <SecurityDetailsUnavailable />
        ) : security.hasPassword ? (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              visible={showCurrentPassword}
              autoComplete="current-password"
              placeholder="Enter your current password"
              disabled={submitting}
              onChange={onCurrentPasswordChange}
              onToggle={onToggleCurrentPassword}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <PasswordField
                id="new-password"
                label="New password"
                value={newPassword}
                visible={showNewPassword}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                disabled={submitting}
                onChange={onNewPasswordChange}
                onToggle={onToggleNewPassword}
              />

              <PasswordField
                id="confirm-password"
                label="Confirm password"
                value={confirmPassword}
                visible={showConfirmPassword}
                autoComplete="new-password"
                placeholder="Repeat the new password"
                disabled={submitting}
                onChange={onConfirmPasswordChange}
                onToggle={onToggleConfirmPassword}
              />
            </div>

            <PasswordRequirements
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
            />

            {error && <MessageBox type="error" message={error} />}

            {success && <MessageBox type="success" message={success} />}

            <div className="rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
                  <ShieldCheck className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-xs font-bold">Session protection</p>

                  <p className="mt-1 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                    After your password changes, this account is signed out and
                    must authenticate again using the new password.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <ActionButton
                type="submit"
                loading={submitting}
                spinnerOnly
                fullWidth={false}
                variant="dark"
                className="min-h-12 w-full sm:min-w-[210px] sm:w-auto"
              >
                Change password
              </ActionButton>
            </div>
          </form>
        ) : (
          <CreatePasswordAccess
            step={createPasswordStep}
            googleConnected={googleConnected}
            creating={creatingPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            error={error}
            success={success}
            onGoogleSuccess={onGoogleReauthentication}
            onGoogleError={onGoogleError}
            onNewPasswordChange={onNewPasswordChange}
            onConfirmPasswordChange={onConfirmPasswordChange}
            onToggleNewPassword={onToggleNewPassword}
            onToggleConfirmPassword={onToggleConfirmPassword}
            onSubmit={onCreatePassword}
            onRestartGoogleVerification={onRestartGoogleVerification}
          />
        )}
      </div>
    </section>
  );
}

function ConnectedAccountsCard({
  providers,
  loading
}: {
  providers: string[];
  loading: boolean;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <SectionHeading
        eyebrow="Login providers"
        title="Connected accounts"
        description="External providers approved to sign in."
        icon={<Link2 className="h-5 w-5" />}
        compact
      />

      <div className="mt-6">
        {loading ? (
          <ConnectedProvidersSkeleton />
        ) : providers.length > 0 ? (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] px-4 py-4 dark:border-[#302c24] dark:bg-[#11110f]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-[#1a1712]">
                    <ProviderMark provider={provider} />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{provider}</p>

                    <p className="mt-1 text-[11px] font-medium text-[#817867] dark:text-[#928a7d]">
                      External sign-in
                    </p>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connected
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d8cdb6] bg-[#fffaf0] p-5 text-center dark:border-[#302c24] dark:bg-[#11110f]">
            <Link2 className="mx-auto h-6 w-6 text-[#8a6624] dark:text-[#d6b46a]" />

            <p className="mt-3 text-sm font-bold">No connected providers</p>

            <p className="mt-2 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
              This account currently has no external sign-in provider.
            </p>
          </div>
        )}
      </div>
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

function InlineStatus({
  label,
  value,
  positive
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e4dbc9] bg-[#fffdf7] px-4 py-3 dark:border-[#302c24] dark:bg-[#1a1712]">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#817867] dark:text-[#928a7d]">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            positive ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />

        <p className="text-xs font-bold">{value}</p>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  visible,
  autoComplete,
  placeholder,
  disabled,
  onChange,
  onToggle
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        {label}
      </span>

      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="admin-input h-12 px-11"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] hover:text-[#1f1a12] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#928a7d] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}

function PasswordRequirements({
  currentPassword,
  newPassword,
  confirmPassword
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const checks = [
    {
      label: "At least 8 characters",
      passed: newPassword.length >= 8
    },
    {
      label: "Different from current password",
      passed:
        newPassword.length > 0 &&
        currentPassword.length > 0 &&
        newPassword !== currentPassword
    },
    {
      label: "Passwords match",
      passed: confirmPassword.length > 0 && newPassword === confirmPassword
    }
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {checks.map((check) => (
        <div
          key={check.label}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            check.passed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "border-[#e4dbc9] bg-[#fffaf0] text-[#817867] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#928a7d]"
          }`}
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          {check.label}
        </div>
      ))}
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
  successful
}: {
  icon: ReactNode;
  label: string;
  value: string;
  successful: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-3.5 dark:border-[#302c24] dark:bg-[#11110f]">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          successful
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
            : "bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]"
        }`}
      >
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

function CreatePasswordAccess({
  step,
  googleConnected,
  creating,
  newPassword,
  confirmPassword,
  showNewPassword,
  showConfirmPassword,
  error,
  success,
  onGoogleSuccess,
  onGoogleError,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
  onRestartGoogleVerification
}: {
  step: "google" | "password";
  googleConnected: boolean;
  creating: boolean;
  newPassword: string;
  confirmPassword: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  error: string;
  success: string;
  onGoogleSuccess: (credential?: string) => Promise<void>;
  onGoogleError: () => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRestartGoogleVerification: () => void;
}) {
  if (!googleConnected) {
    return (
      <div className="rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] p-6 text-center dark:border-[#302c24] dark:bg-[#11110f]">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          <Link2 className="h-5 w-5" />
        </span>

        <h3 className="mt-4 text-base font-bold">
          Google verification is unavailable
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
          This account does not have a connected Google login that can be used
          to securely create a password.
        </p>
      </div>
    );
  }

  if (step === "google") {
    return (
      <div className="rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
            <ShieldCheck className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a6624] dark:text-[#d6b46a]">
              Identity verification
            </p>

            <h3 className="font-display mt-1.5 text-2xl font-semibold leading-none">
              Verify with Google
            </h3>

            <p className="mt-3 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
              Use the Google account already connected to this profile. After
              verification, you can create a password for email sign-in.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5">
            <MessageBox type="error" message={error} />
          </div>
        )}

        {success && (
          <div className="mt-5">
            <MessageBox type="success" message={success} />
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-[#e4dbc9] bg-[#fffdf7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
          {creating ? (
            <div
              className="flex min-h-11 items-center justify-center"
              aria-label="Verifying Google account"
            >
              <span className="h-5 w-5 animate-spin-fast rounded-full border-2 border-[#8a6624] border-t-transparent dark:border-[#d6b46a] dark:border-t-transparent" />
            </div>
          ) : (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={(response: CredentialResponse) => {
                  void onGoogleSuccess(response.credential);
                }}
                onError={onGoogleError}
                useOneTap={false}
                text="continue_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
          Verification does not change your Google password or grant access to
          your Google account data.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>

          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              Google account verified
            </p>

            <p className="mt-1 text-xs font-medium leading-5 text-emerald-700 dark:text-emerald-300">
              Your verification session is ready. Create the password now.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={creating}
          onClick={onRestartGoogleVerification}
          className="shrink-0 text-xs font-bold text-emerald-800 underline-offset-4 hover:underline disabled:opacity-50 dark:text-emerald-200"
        >
          Verify again
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          id="create-password"
          label="Create password"
          value={newPassword}
          visible={showNewPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          disabled={creating}
          onChange={onNewPasswordChange}
          onToggle={onToggleNewPassword}
        />

        <PasswordField
          id="confirm-created-password"
          label="Confirm password"
          value={confirmPassword}
          visible={showConfirmPassword}
          autoComplete="new-password"
          placeholder="Enter password again"
          disabled={creating}
          onChange={onConfirmPasswordChange}
          onToggle={onToggleConfirmPassword}
        />
      </div>

      <CreatePasswordRequirements
        newPassword={newPassword}
        confirmPassword={confirmPassword}
      />

      {error && <MessageBox type="error" message={error} />}
      {success && <MessageBox type="success" message={success} />}

      <div className="rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
            <KeyRound className="h-4 w-4" />
          </span>

          <div>
            <p className="text-xs font-bold">New sign-in method</p>

            <p className="mt-1 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
              After creation, this account can sign in using either Google or
              its email and password.
            </p>
          </div>
        </div>
      </div>

      <ActionButton
        type="submit"
        loading={creating}
        spinnerOnly
        variant="dark"
        className="min-h-14"
      >
        Create password
      </ActionButton>
    </form>
  );
}
function ActiveSessionsCard({
  sessions,
  loading,
  error,
  message,
  revokingSessionId,
  sessionAction,
  onRefresh,
  onRevokeSession,
  onSignOutOtherSessions,
  onSignOutAllSessions
}: {
  sessions: ActiveSession[];
  loading: boolean;
  error: string;
  message: string;
  revokingSessionId: string | null;
  sessionAction: "others" | "all" | null;
  onRefresh: () => Promise<void>;
  onRevokeSession: (userSessionId: string) => Promise<void>;
  onSignOutOtherSessions: () => Promise<void>;
  onSignOutAllSessions: () => Promise<void>;
}) {
  const otherSessionCount = sessions.filter(
    (session) => !session.isCurrent
  ).length;

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-6 lg:border-b-0 lg:border-r">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
            <MonitorSmartphone className="h-5 w-5" />
          </span>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
            Signed-in devices
          </p>

          <h2 className="font-display mt-2 text-2xl font-semibold leading-none">
            Active sessions
          </h2>

          <p className="mt-3 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
            Devices that can currently access this account.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d8cdb6] bg-[#fffdf7] px-3 py-1.5 text-xs font-bold dark:border-[#302c24] dark:bg-[#1a1712]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {loading
              ? "Checking devices"
              : `${sessions.length} active ${
                  sessions.length === 1 ? "session" : "sessions"
                }`}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-[#e4dbc9] px-5 py-4 dark:border-[#302c24] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-bold">Devices with account access</p>

              <p className="mt-1 text-xs font-medium text-[#817867] dark:text-[#928a7d]">
                Sign out a device you do not recognize.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={loading || sessionAction !== null}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-3.5 text-xs font-bold transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016] sm:w-auto"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {message && (
            <div className="border-b border-[#e4dbc9] px-5 py-4 dark:border-[#302c24] sm:px-6">
              <MessageBox type="success" message={message} />
            </div>
          )}

          {error && !loading && (
            <div className="border-b border-[#e4dbc9] px-5 py-4 dark:border-[#302c24] sm:px-6">
              <MessageBox type="error" message={error} />
            </div>
          )}

          <div className="divide-y divide-[#e4dbc9] dark:divide-[#302c24]">
            {loading ? (
              <ActiveSessionsSkeleton />
            ) : sessions.length === 0 ? (
              <ActiveSessionsEmptyState />
            ) : (
              sessions.map((session) => (
                <ActiveSessionRow
                  key={session.userSessionId}
                  session={session}
                  revokingSessionId={revokingSessionId}
                  onRevokeSession={onRevokeSession}
                />
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e4dbc9] bg-[#fffaf0] px-5 py-5 dark:border-[#302c24] dark:bg-[#11110f] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="max-w-xl text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
              Signing out a device immediately revokes its current session. The
              device must authenticate again before it can access the account.
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <ActionButton
                type="button"
                onClick={() => void onSignOutOtherSessions()}
                loading={sessionAction === "others"}
                spinnerOnly
                disabled={sessionAction !== null || otherSessionCount === 0}
                fullWidth={false}
                variant="outline"
                className="!min-h-10 w-full !rounded-xl !px-4 !py-2.5 !text-xs sm:w-auto"
              >
                <span className="inline-flex items-center gap-2">
                  <MonitorOff className="h-3.5 w-3.5" />
                  Sign out other devices
                </span>
              </ActionButton>

              <ActionButton
                type="button"
                onClick={() => void onSignOutAllSessions()}
                loading={sessionAction === "all"}
                spinnerOnly
                disabled={sessionAction !== null || sessions.length === 0}
                fullWidth={false}
                variant="outline"
                className="!min-h-10 w-full !rounded-xl !border-red-300 !bg-red-50 !px-4 !py-2.5 !text-xs !text-red-700 hover:!bg-red-100 dark:!border-red-400/20 dark:!bg-red-400/10 dark:!text-red-300 dark:hover:!bg-red-400/15 sm:w-auto"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out all
                </span>
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ActiveSessionRow({
  session,
  revokingSessionId,
  onRevokeSession
}: {
  session: ActiveSession;
  revokingSessionId: string | null;
  onRevokeSession: (userSessionId: string) => Promise<void>;
}) {
  const browser = session.browserVersion
    ? `${session.browserName} ${session.browserVersion}`
    : session.browserName;

  const isRevoking = revokingSessionId === session.userSessionId;

  return (
    <article
      className={`px-5 py-5 transition sm:px-6 ${
        session.isCurrent
          ? "bg-emerald-50/45 dark:bg-emerald-400/[0.035]"
          : "hover:bg-[#fffaf0] dark:hover:bg-[#11110f]"
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-start">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
            session.isCurrent
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "border-[#e4dbc9] bg-[#fffaf0] text-[#4f4638] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#d8cdb6]"
          }`}
        >
          <DeviceIcon deviceType={session.deviceType} />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold sm:text-base">
              {session.deviceName || "Unknown device"}
            </h3>

            {session.isCurrent && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                This device
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1.5">
            <p className="text-xs font-medium text-[#4f4638] dark:text-[#d8cdb6]">
              {browser || "Unknown browser"}
              {session.operatingSystem ? ` · ${session.operatingSystem}` : ""}
            </p>

            <p className="flex items-center gap-2 break-all text-xs font-medium text-[#817867] dark:text-[#928a7d]">
              <Globe2 className="h-3.5 w-3.5 shrink-0" />
              {session.ipAddress || "IP address unavailable"}
            </p>

            <p className="text-xs font-medium text-[#817867] dark:text-[#928a7d]">
              {formatSessionActivity(session.lastSeenAt, session.isCurrent)}
            </p>
          </div>
        </div>

        <div className="flex sm:justify-end">
          {session.isCurrent ? (
            <span className="inline-flex h-10 items-center justify-center rounded-xl border border-[#e4dbc9] bg-[#fffdf7] px-3.5 text-xs font-bold text-[#817867] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#928a7d]">
              Current session
            </span>
          ) : (
            <ActionButton
              type="button"
              onClick={() => void onRevokeSession(session.userSessionId)}
              loading={isRevoking}
              spinnerOnly
              disabled={isRevoking}
              fullWidth={false}
              variant="outline"
              className="!min-h-10 w-full !rounded-xl !border-red-300 !bg-transparent !px-4 !py-2.5 !text-xs !text-red-700 hover:!bg-red-50 dark:!border-red-400/20 dark:!text-red-300 dark:hover:!bg-red-400/10 sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-3.5 w-3.5" />
                Sign out device
              </span>
            </ActionButton>
          )}
        </div>
      </div>
    </article>
  );
}

function ActiveSessionsSkeleton() {
  return (
    <div aria-label="Loading active sessions">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid animate-pulse gap-4 px-5 py-5 sm:grid-cols-[52px_minmax(0,1fr)_120px] sm:px-6"
        >
          <span className="h-12 w-12 rounded-xl bg-[#eee6d7] dark:bg-[#242016]" />

          <div className="min-w-0">
            <div className="h-3.5 w-36 rounded bg-[#e8decb] dark:bg-[#242016]" />
            <div className="mt-3 h-3 w-48 rounded bg-[#eee6d7] dark:bg-[#201d18]" />
            <div className="mt-2 h-3 w-40 rounded bg-[#eee6d7] dark:bg-[#201d18]" />
            <div className="mt-2 h-3 w-28 rounded bg-[#eee6d7] dark:bg-[#201d18]" />
          </div>

          <span className="h-10 rounded-xl bg-[#eee6d7] dark:bg-[#242016]" />
        </div>
      ))}
    </div>
  );
}

function ActiveSessionsEmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        <MonitorSmartphone className="h-6 w-6" />
      </span>

      <h3 className="font-display mt-5 text-2xl font-semibold">
        No active sessions
      </h3>

      <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        No trusted device sessions were returned for this account.
      </p>
    </div>
  );
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
    case "phone":
      return <Smartphone className="h-5 w-5" />;

    case "tablet":
      return <Tablet className="h-5 w-5" />;

    case "tv":
      return <Tv className="h-5 w-5" />;

    case "desktop":
    case "computer":
    case "laptop":
    default:
      return <Laptop className="h-5 w-5" />;
  }
}

function formatSessionActivity(
  value: string | null | undefined,
  isCurrent: boolean
) {
  if (!value) {
    return isCurrent ? "Active now" : "Last activity unavailable";
  }

  const utcValue =
    value.endsWith("Z") || value.includes("+") ? value : `${value}Z`;

  const date = new Date(utcValue);

  if (Number.isNaN(date.getTime())) {
    return isCurrent ? "Active now" : "Last activity unavailable";
  }

  const now = new Date();

  const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const dateKey = dateKeyFormatter.format(date);
  const todayKey = dateKeyFormatter.format(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = dateKeyFormatter.format(yesterday);

  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);

  if (dateKey === todayKey) {
    return isCurrent ? `Active now · Today at ${time}` : `Today at ${time}`;
  }

  if (dateKey === yesterdayKey) {
    return `Yesterday at ${time}`;
  }

  const dayDifference = Math.floor(
    (now.getTime() - date.getTime()) / 86_400_000
  );

  if (dayDifference > 1 && dayDifference < 7) {
    const weekday = new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      timeZone: "Asia/Kolkata"
    }).format(date);

    return `Last ${weekday} at ${time}`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function CreatePasswordRequirements({
  newPassword,
  confirmPassword
}: {
  newPassword: string;
  confirmPassword: string;
}) {
  const checks = [
    {
      label: "At least 8 characters",
      passed: newPassword.length >= 8
    },
    {
      label: "Passwords match",
      passed: confirmPassword.length > 0 && newPassword === confirmPassword
    }
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {checks.map((check) => (
        <div
          key={check.label}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            check.passed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              : "border-[#e4dbc9] bg-[#fffaf0] text-[#817867] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#928a7d]"
          }`}
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          {check.label}
        </div>
      ))}
    </div>
  );
}

function SecurityDetailsUnavailable() {
  return (
    <div className="rounded-2xl border border-dashed border-[#d8cdb6] bg-[#fffaf0] p-6 text-center dark:border-[#302c24] dark:bg-[#11110f]">
      <ShieldCheck className="mx-auto h-6 w-6 text-[#8a6624] dark:text-[#d6b46a]" />

      <p className="mt-3 text-sm font-bold">
        Security details could not be loaded
      </p>

      <p className="mt-2 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
        Use the retry action above before changing or creating a password.
      </p>
    </div>
  );
}

function ProviderMark({ provider }: { provider: string }) {
  if (provider.trim().toLowerCase().includes("google")) {
    return (
      <span aria-hidden="true" className="text-base font-black text-[#4285F4]">
        G
      </span>
    );
  }

  return <Link2 className="h-4 w-4 text-[#8a6624] dark:text-[#d6b46a]" />;
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
    <p
      role={successful ? "status" : "alert"}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold leading-6 ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      }`}
    >
      {message}
    </p>
  );
}

function PasswordFormSkeleton() {
  return (
    <div
      aria-label="Loading password security"
      className="animate-pulse space-y-5"
    >
      {[0, 1, 2].map((item) => (
        <div key={item}>
          <div className="h-3 w-28 rounded bg-[#e8decb] dark:bg-[#242016]" />
          <div className="mt-2 h-12 rounded-2xl bg-[#eee6d7] dark:bg-[#11110f]" />
        </div>
      ))}

      <div className="h-14 rounded-2xl bg-[#e8decb] dark:bg-[#242016]" />
    </div>
  );
}

function ConnectedProvidersSkeleton() {
  return (
    <div
      aria-label="Loading connected accounts"
      className="animate-pulse space-y-3"
    >
      {[0, 1].map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]"
        >
          <span className="h-10 w-10 rounded-xl bg-[#e8decb] dark:bg-[#242016]" />

          <div className="flex-1">
            <div className="h-3 w-24 rounded bg-[#e8decb] dark:bg-[#242016]" />
            <div className="mt-2 h-2.5 w-32 rounded bg-[#eee6d7] dark:bg-[#201d18]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatLongDate(value?: string | null) {
  if (!value) {
    return "Not recorded";
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

export default AccountSecurityPage;
