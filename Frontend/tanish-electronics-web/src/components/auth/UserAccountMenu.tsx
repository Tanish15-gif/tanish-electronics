import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronRight,
  LoaderCircle,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  X
} from "lucide-react";

type AppearanceMode = "light" | "dark" | "system";

type UserMenuProps = {
  displayName: string;
  email: string;
  imageUrl?: string | null;
  manageAccountTo?: string;
  securityTo?: string;
  accountLabel?: string;
  onLogout: () => Promise<void> | void;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  mobile: boolean;
};
const THEME_STORAGE_KEY = "theme";

function UserAccountMenu({
  displayName,
  email,
  imageUrl,
  manageAccountTo = "/customer/profile",
  securityTo = "/customer/security",
  accountLabel = "Customer account",
  onLogout
}: UserMenuProps) {
  const location = useLocation();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuRoute, setMenuRoute] = useState(location.key);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [appearance, setAppearance] =
    useState<AppearanceMode>(getInitialAppearance);
  const [position, setPosition] = useState<MenuPosition>({
    top: 64,
    left: 12,
    width: 352,
    mobile: false
  });
  const showImage = Boolean(imageUrl?.trim()) && failedImageUrl !== imageUrl;
  const initials = getInitials(displayName);

  if (menuRoute !== location.key) {
    setMenuRoute(location.key);
    setOpen(false);
  }

  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rectangle = trigger.getBoundingClientRect();
      if (rectangle.width === 0 && rectangle.height === 0) {
        setOpen(false);
        return;
      }
      const padding = 12;
      const mobile = window.innerWidth < 640;
      const width = Math.min(352, window.innerWidth - padding * 2);
      const height = Math.min(
        menuRef.current?.scrollHeight ?? 440,
        window.innerHeight - padding * 2
      );
      setPosition({
        top: Math.max(
          padding,
          Math.min(rectangle.bottom + 10, window.innerHeight - height - padding)
        ),
        left: mobile
          ? (window.innerWidth - width) / 2
          : Math.max(
              padding,
              Math.min(
                rectangle.right - width,
                window.innerWidth - width - padding
              )
            ),
        width,
        mobile
      });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, logoutError]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() =>
      menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus()
    );
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      )
        setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
      if (event.key === "Tab") {
        const controls = Array.from(
          menuRef.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not(:disabled)"
          ) ?? []
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault();
          if (window.innerWidth < 640) {
            (event.shiftKey ? last : first)?.focus();
          } else {
            setOpen(false);
            triggerRef.current?.focus();
          }
        }
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    function syncAppearance() {
      setAppearance(getInitialAppearance());
    }
    window.addEventListener("storage", syncAppearance);
    window.addEventListener("te-theme-changed", syncAppearance);
    return () => {
      window.removeEventListener("storage", syncAppearance);
      window.removeEventListener("te-theme-changed", syncAppearance);
    };
  }, []);

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    function applyTheme() {
      const dark =
        appearance === "dark" ||
        (appearance === "system" && systemTheme.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    }
    applyTheme();
    systemTheme.addEventListener("change", applyTheme);
    return () => systemTheme.removeEventListener("change", applyTheme);
  }, [appearance]);

  function selectAppearance(mode: AppearanceMode) {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    setAppearance(mode);
    window.dispatchEvent(new Event("te-theme-changed"));
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await onLogout();
      setOpen(false);
    } catch {
      setLogoutError("Couldn't sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const avatar = showImage ? (
    <img
      src={imageUrl!}
      alt=""
      className="h-full w-full object-cover"
      referrerPolicy="no-referrer"
      onError={() => setFailedImageUrl(imageUrl ?? null)}
    />
  ) : (
    initials
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setLogoutError("");
          setOpen((current) => !current);
        }}
        aria-label={accountLabel + " menu for " + displayName}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-[#fffaf0] text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/25 dark:bg-[#1a1712] " +
          (open
            ? "border-[#a4803e] ring-2 ring-[#d6b46a]/25"
            : "border-[#d8cdb6] hover:border-[#a4803e] dark:border-[#50483b]")
        }
      >
        {avatar}
      </button>
      {open &&
        createPortal(
          <>
            {position.mobile && (
              <div
                aria-hidden="true"
                className="fixed inset-0 z-[901] bg-black/40 dark:bg-black/60"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              />
            )}
            <div
              ref={menuRef}
              id={menuId}
              role="dialog"
              aria-modal={position.mobile || undefined}
              aria-label={accountLabel}
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: "calc(100dvh - " + (position.top + 12) + "px)",
                fontFamily: "var(--font-ui)"
              }}
              className="te-modal-scroll fixed z-[902] overflow-y-auto rounded-2xl border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-[0_18px_60px_-15px_rgba(31,26,18,0.3)] dark:border-[#3a342a] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:shadow-black/50"
            >
              <header className="relative border-b border-[#e8dfce] p-5 dark:border-[#302c24]">
                <p className="pr-8 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6624] dark:text-[#d6b46a]">
                  {accountLabel}
                </p>
                <button
                  type="button"
                  aria-label="Close account menu"
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b46a] dark:text-[#a8a093] dark:hover:bg-[#242016]"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2eadb] text-sm font-semibold text-[#8a6624] ring-1 ring-[#d8cdb6] dark:bg-[#292319] dark:text-[#d6b46a] dark:ring-[#50483b]">
                    {avatar}
                  </div>
                  <div className="min-w-0">
                    <p
                      title={displayName}
                      className="truncate text-sm font-semibold"
                    >
                      {displayName}
                    </p>
                    <p
                      title={email}
                      className="mt-1 truncate text-xs text-[#716958] dark:text-[#b3aa99]"
                    >
                      {email}
                    </p>
                  </div>
                </div>
              </header>
              <nav aria-label="Account settings" className="space-y-1 p-2">
                <Link
                  to={manageAccountTo}
                  onClick={() => setOpen(false)}
                  className="group flex min-h-16 items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[#f3eee3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d6b46a] dark:hover:bg-[#242016]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#292319] dark:text-[#d6b46a]">
                    <UserRound className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">
                      Manage account
                    </span>
                    <span className="mt-1 block text-[11px] text-[#716958] dark:text-[#b3aa99]">
                      Profile and contact details
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#a39780] transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to={securityTo}
                  onClick={() => setOpen(false)}
                  className="group flex min-h-16 items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[#f3eee3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d6b46a] dark:hover:bg-[#242016]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#292319] dark:text-[#d6b46a]">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">
                      Security &amp; password
                    </span>
                    <span className="mt-1 block text-[11px] text-[#716958] dark:text-[#b3aa99]">
                      Password and sign-in methods
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#a39780] transition group-hover:translate-x-0.5" />
                </Link>
              </nav>
              <section
                aria-label="Appearance"
                className="border-t border-[#e8dfce] px-5 py-4 dark:border-[#302c24]"
              >
                <p className="text-xs font-semibold">Appearance</p>
                <div
                  role="group"
                  aria-label="Theme preference"
                  className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-[#e4dac5] bg-[#f3eee3] p-1 dark:border-[#3a342a] dark:bg-[#11110f]"
                >
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <ThemeButton
                      key={mode}
                      mode={mode}
                      selected={appearance === mode}
                      onClick={() => selectAppearance(mode)}
                    />
                  ))}
                </div>
              </section>
              <footer className="border-t border-[#e8dfce] p-2 dark:border-[#302c24]">
                {logoutError && (
                  <p
                    role="alert"
                    className="px-3 pb-2 text-xs text-red-700 dark:text-red-300"
                  >
                    {logoutError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  aria-busy={loggingOut}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-[#8b4035] transition hover:bg-[#fbeeec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d6b46a] disabled:cursor-wait disabled:opacity-60 dark:text-[#e6a093] dark:hover:bg-[#2a1c18]"
                >
                  {loggingOut ? (
                    <LoaderCircle className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" />
                  ) : (
                    <LogOut className="h-[18px] w-[18px]" />
                  )}
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              </footer>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function ThemeButton({
  mode,
  selected,
  onClick
}: {
  mode: AppearanceMode;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      aria-pressed={selected}
      title={mode === "system" ? "Follow your device theme" : undefined}
      onClick={onClick}
      className={
        "flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b46a] " +
        (selected
          ? "border-[#d8cdb6] bg-[#fffdf7] text-[#72521c] shadow-sm dark:border-[#776036] dark:bg-[#2b251a] dark:text-[#e5c680]"
          : "border-transparent text-[#716958] hover:text-[#1f1a12] dark:text-[#b3aa99] dark:hover:text-[#e8e3d8]")
      }
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
    </button>
  );
}

function getInitialAppearance(): AppearanceMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "CU"
  );
}

export default UserAccountMenu;
