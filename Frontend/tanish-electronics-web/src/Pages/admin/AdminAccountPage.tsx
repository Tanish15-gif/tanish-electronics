import {
  BadgeCheck,
  Check,
  CircleUserRound,
  Copy,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useCustomAuth } from "../../contexts/CustomAuthContext";
import { useShopSettings } from "../../hooks/useShopSettings";

type CopiedField = "email" | "phone" | null;

function AdminAccountPage() {
  const { user } = useCustomAuth();

  const [imageFailed, setImageFailed] = useState(false);
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const { settings } = useShopSettings();

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `Administrator Profile | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profileImageUrl]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setCopiedField(null);
    }, 1600);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [copiedField]);

  const displayName = user?.fullName?.trim() || "Administrator";
  const displayEmail = user?.email?.trim() || "No email available";
  const displayPhone = user?.phoneNumber?.trim() || "";
  const roles = user?.roles?.length ? user.roles : ["Administrator"];

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean).slice(0, 2);

    return (
      parts
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase() || "AD"
    );
  }, [displayName]);

  const showImage = Boolean(user?.profileImageUrl?.trim()) && !imageFailed;

  const completedFields = [
    Boolean(user?.fullName?.trim()),
    Boolean(user?.email?.trim()),
    Boolean(user?.phoneNumber?.trim()),
    Boolean(user?.profileImageUrl?.trim())
  ].filter(Boolean).length;

  const completionPercentage = Math.round((completedFields / 4) * 100);

  async function copyValue(field: Exclude<CopiedField, null>, value: string) {
    if (!value || value === "No email available") {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
    } catch {
      setCopiedField(null);
    }
  }

  return (
    <main
      className="te-sheet-bg mx-auto w-full max-w-7xl px-4 py-6 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 sm:py-8 lg:px-8"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <ProfileHero
        displayName={displayName}
        displayEmail={displayEmail}
        roles={roles}
        initials={initials}
        imageUrl={showImage ? user?.profileImageUrl : null}
        onImageError={() => setImageFailed(true)}
        completionPercentage={completionPercentage}
        contactMethods={
          [
            Boolean(user?.email?.trim()),
            Boolean(user?.phoneNumber?.trim())
          ].filter(Boolean).length
        }
      />

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <IdentitySummaryCard
            displayName={displayName}
            displayEmail={displayEmail}
            displayPhone={displayPhone}
            roles={roles}
          />

          <ProfileCompletionCard
            completionPercentage={completionPercentage}
            hasName={Boolean(user?.fullName?.trim())}
            hasEmail={Boolean(user?.email?.trim())}
            hasPhone={Boolean(user?.phoneNumber?.trim())}
            hasImage={Boolean(user?.profileImageUrl?.trim())}
          />
        </aside>

        <section className="overflow-hidden rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-sm dark:border-[#302c24] dark:bg-[#1a1712]">
          <div className="border-b border-[#e4dbc9] bg-[#fffaf0] p-5 dark:border-[#302c24] dark:bg-[#11110f] sm:p-7">
            <SectionHeading
              eyebrow="Administrator identity"
              title="Personal profile"
              description="Account details used to identify this administrator across the system."
              icon={<UserRound className="h-5 w-5" />}
            />
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <ReadOnlyField
                label="Full name"
                value={displayName}
                icon={<UserRound className="h-4 w-4" />}
              />

              <ReadOnlyField
                label="Primary role"
                value={roles[0] || "Administrator"}
                icon={<ShieldCheck className="h-4 w-4" />}
              />

              <div className="sm:col-span-2">
                <ReadOnlyField
                  label="Account email"
                  value={displayEmail}
                  icon={<Mail className="h-4 w-4" />}
                  status="Verified identity"
                  onCopy={
                    user?.email
                      ? () => void copyValue("email", user.email)
                      : undefined
                  }
                  copied={copiedField === "email"}
                />
              </div>

              <div className="sm:col-span-2">
                <ReadOnlyField
                  label="Phone number"
                  value={displayPhone || "Not added"}
                  icon={<Phone className="h-4 w-4" />}
                  status={displayPhone ? "Contact method" : undefined}
                  onCopy={
                    displayPhone
                      ? () => void copyValue("phone", displayPhone)
                      : undefined
                  }
                  copied={copiedField === "phone"}
                />
              </div>

              <div className="sm:col-span-2">
                <RoleField roles={roles} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
                  <ShieldCheck className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-xs font-bold">Profile data ownership</p>

                  <p className="mt-1 text-xs font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                    This page displays personal administrator identity only.
                    Passwords and login providers are managed from the separate
                    Security page. Shop name, address and public business
                    contact information remain inside Admin Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileHero({
  displayName,
  displayEmail,
  roles,
  initials,
  imageUrl,
  onImageError,
  completionPercentage,
  contactMethods
}: {
  displayName: string;
  displayEmail: string;
  roles: string[];
  initials: string;
  imageUrl?: string | null;
  onImageError: () => void;
  completionPercentage: number;
  contactMethods: number;
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
            imageUrl={imageUrl}
            displayName={displayName}
            initials={initials}
            onImageError={onImageError}
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
                Administrator profile
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-300">
                <BadgeCheck className="h-3.5 w-3.5" />
                Active
              </span>
            </div>

            <h1 className="font-display mt-3 truncate text-4xl font-semibold leading-none sm:text-5xl">
              {displayName}
            </h1>

            <p className="mt-4 break-all text-sm font-medium text-[#c8bead]">
              {displayEmail}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-[#d6b46a]/25 bg-[#d6b46a]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#d6b46a]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[560px]">
          <HeroMetric
            label="Account type"
            value="Administrator"
            icon={<ShieldCheck className="h-4 w-4" />}
          />

          <HeroMetric
            label="Contact methods"
            value={`${contactMethods} available`}
            icon={<Mail className="h-4 w-4" />}
          />

          <HeroMetric
            label="Profile readiness"
            value={`${completionPercentage}% complete`}
            icon={<CircleUserRound className="h-4 w-4" />}
          />
        </div>
      </div>
    </header>
  );
}

function ProfileAvatar({
  imageUrl,
  displayName,
  initials,
  onImageError
}: {
  imageUrl?: string | null;
  displayName: string;
  initials: string;
  onImageError: () => void;
}) {
  return (
    <div className="relative shrink-0">
      <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17130e] text-2xl font-bold text-[#f7f5ef] shadow-lg sm:h-28 sm:w-28">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${displayName} profile`}
            referrerPolicy="no-referrer"
            onError={onImageError}
            className="h-full w-full object-cover"
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

function IdentitySummaryCard({
  displayName,
  displayEmail,
  displayPhone,
  roles
}: {
  displayName: string;
  displayEmail: string;
  displayPhone: string;
  roles: string[];
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <SectionHeading
        eyebrow="Identity summary"
        title="Account overview"
        description="Key administrator details at a glance."
        icon={<UserRound className="h-5 w-5" />}
        compact
      />

      <div className="mt-6 divide-y divide-[#e4dbc9] overflow-hidden rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] dark:divide-[#302c24] dark:border-[#302c24] dark:bg-[#11110f]">
        <SummaryRow
          icon={<UserRound className="h-4 w-4" />}
          label="Name"
          value={displayName}
        />

        <SummaryRow
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={displayEmail}
        />

        <SummaryRow
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={displayPhone || "Not added"}
        />

        <SummaryRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Primary role"
          value={roles[0] || "Administrator"}
        />
      </div>
    </section>
  );
}

function ProfileCompletionCard({
  completionPercentage,
  hasName,
  hasEmail,
  hasPhone,
  hasImage
}: {
  completionPercentage: number;
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasImage: boolean;
}) {
  const checks = [
    {
      label: "Full name",
      complete: hasName
    },
    {
      label: "Email address",
      complete: hasEmail
    },
    {
      label: "Phone number",
      complete: hasPhone
    },
    {
      label: "Profile photo",
      complete: hasImage
    }
  ];

  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb6] bg-[#fffdf7] p-5 shadow-sm dark:border-[#302c24] dark:bg-[#1a1712] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a6624] dark:text-[#d6b46a]">
            Profile readiness
          </p>

          <h2 className="font-display mt-1.5 text-xl font-semibold leading-none">
            {completionPercentage}% complete
          </h2>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
          <CircleUserRound className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#eee6d7] dark:bg-[#242016]">
        <div
          className="h-full rounded-full bg-[#8a6624] transition-[width] duration-500 dark:bg-[#d6b46a]"
          style={{
            width: `${completionPercentage}%`
          }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-xs font-medium text-[#6f6758] dark:text-[#a8a093]">
              {check.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                check.complete
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-[#928a7d]"
              }`}
            >
              {check.complete ? (
                <>
                  <CheckCircle2Icon />
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

function SummaryRow({
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
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
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

function ReadOnlyField({
  label,
  value,
  icon,
  status,
  onCopy,
  copied = false
}: {
  label: string;
  value: string;
  icon: ReactNode;
  status?: string;
  onCopy?: () => void;
  copied?: boolean;
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
          <p className="break-words text-sm font-bold">{value}</p>

          {status && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
              {status}
            </p>
          )}
        </div>

        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#817867] transition hover:bg-[#f2eadb] hover:text-[#1f1a12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:text-[#928a7d] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function RoleField({ roles }: { roles: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
        Account roles
      </p>

      <div className="rounded-2xl border border-[#e4dbc9] bg-[#fffaf0] px-4 py-4 dark:border-[#302c24] dark:bg-[#11110f]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
            <ShieldCheck className="h-4 w-4" />
          </span>

          <div className="flex min-w-0 flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-[#d6b46a]/35 bg-[#fff4cc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#765313] dark:border-[#d6b46a]/20 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2Icon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
      <Check className="h-2.5 w-2.5" />
    </span>
  );
}

export default AdminAccountPage;
