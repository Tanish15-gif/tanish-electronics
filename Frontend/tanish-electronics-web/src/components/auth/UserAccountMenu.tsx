import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { LoadingSpinner } from "../../Pages/admin/AdminUserDetailsPage";

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
};

const THEME_STORAGE_KEY = "theme";

function UserAccountMenu({
  displayName,
  email,
  imageUrl,
  manageAccountTo = "/customer/profile",
  securityTo = "/customer/profile?section=security",
  accountLabel = "Customer account",
  onLogout
}: UserMenuProps) {
  const location = useLocation();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [appearance, setAppearance] =
    useState<AppearanceMode>(getInitialAppearance);

  const [position, setPosition] = useState<MenuPosition>({
    top: 64,
    left: 12,
    width: 360
  });

  const initials = getInitials(displayName);

  const showImage = Boolean(imageUrl?.trim()) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;

      if (!trigger) {
        return;
      }

      const rectangle = trigger.getBoundingClientRect();

      const viewportPadding = 12;
      const mobileBreakpoint = 640;

      const isMobile = window.innerWidth < mobileBreakpoint;

      /*
       * Mobile:
       * Use the complete viewport width with 12px space
       * on both sides.
       *
       * Desktop:
       * Keep the Clerk-style 360px dropdown aligned
       * with the profile trigger.
       */
      const menuWidth = isMobile
        ? window.innerWidth - viewportPadding * 2
        : 360;

      const preferredLeft = isMobile
        ? viewportPadding
        : rectangle.right - menuWidth;

      const maximumLeft = window.innerWidth - menuWidth - viewportPadding;

      const clampedLeft = Math.min(
        Math.max(preferredLeft, viewportPadding),
        Math.max(viewportPadding, maximumLeft)
      );

      setPosition({
        top: rectangle.bottom + 8,
        left: clampedLeft,
        width: menuWidth
      });
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      const clickedTrigger = triggerRef.current?.contains(target);

      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const useDark =
        appearance === "dark" ||
        (appearance === "system" && systemTheme.matches);

      document.documentElement.classList.toggle("dark", useDark);

      document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    }

    localStorage.setItem(THEME_STORAGE_KEY, appearance);

    applyTheme();

    if (appearance === "system") {
      systemTheme.addEventListener("change", applyTheme);
    }

    return () => {
      systemTheme.removeEventListener("change", applyTheme);
    };
  }, [appearance]);

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await onLogout();
      setOpen(false);
    } finally {
      setLoggingOut(false);
    }
  }

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Customer account menu"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: `calc(100dvh - ${position.top + 12}px)`
      }}
      className="te-modal-scroll fixed z-[902] overflow-y-auto rounded-[1.4rem] border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-2xl outline-none dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8]"
    >
      {/* User details */}
      <section className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f1a12] text-sm font-black text-white dark:bg-[#e8e3d8] dark:text-[#11110f]">
            {showImage ? (
              <img
                src={imageUrl!}
                alt={`${displayName} profile`}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
              />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{displayName}</p>

            <p className="mt-0.5 truncate text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
              {email}
            </p>
          </div>
        </div>

        {/* Clerk-style main buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={manageAccountTo}
            onClick={() => setOpen(false)}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 text-xs font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
          >
            <ProfileIcon />
            Manage account
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] px-3 text-xs font-black transition hover:bg-[#f2eadb] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:hover:bg-[#242016]"
          >
            <LogoutIcon />

            {loggingOut ? <LoadingSpinner /> : "Sign out"}
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-[#d8cdb6] p-2 dark:border-[#302c24]">
        <Link
          to={securityTo}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[#fff8e7] dark:hover:bg-[#11110f]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
            <SecurityIcon />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">
              Security & password
            </span>

            <span className="mt-0.5 block truncate text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
              Password and connected accounts
            </span>
          </span>

          <ChevronIcon />
        </Link>
      </section>

      {/* Compact appearance */}
      <section className="border-t border-[#d8cdb6] p-4 dark:border-[#302c24]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black">Appearance</p>

            <p className="mt-0.5 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
              Theme preference
            </p>
          </div>

          <AppearanceIcon />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <ThemeButton
            label="Light"
            selected={appearance === "light"}
            onClick={() => setAppearance("light")}
          />

          <ThemeButton
            label="Dark"
            selected={appearance === "dark"}
            onClick={() => setAppearance("dark")}
          />

          <ThemeButton
            label="System"
            selected={appearance === "system"}
            onClick={() => setAppearance("system")}
          />
        </div>
      </section>

      <footer className="border-t border-[#d8cdb6] bg-[#faf7f0] px-4 py-3 text-center dark:border-[#302c24] dark:bg-[#15130f]">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
          {accountLabel}
        </p>
      </footer>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`${accountLabel} menu`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d8cdb6] bg-[#fffaf0] text-xs font-black transition hover:border-[#c7b98e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712]"
      >
        {showImage ? (
          <img
            src={imageUrl!}
            alt={`${displayName} profile`}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          initials
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(menu, document.body)}
    </>
  );
}

function ThemeButton({
  label,
  selected,
  onClick
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-9 rounded-xl border px-2 text-xs font-black transition ${
        selected
          ? "border-[#8a6624] bg-[#fff4cc] text-[#7a570f] dark:border-[#d6b46a] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]"
          : "border-[#d8cdb6] bg-[#fffdf7] text-[#6f6758] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#a8a093] dark:hover:bg-[#242016]"
      }`}
    >
      {label}
    </button>
  );
}

function getInitialAppearance(): AppearanceMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }

  return "system";
}

function getInitials(name?: string | null) {
  if (!name?.trim()) {
    return "CU";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M5 21a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M10 6H6v12h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="m14 8 4 4-4 4M18 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 3 19 6v5c0 4.8-2.9 8-7 10-4.1-2-7-5.2-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AppearanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 text-[#8a6624] dark:text-[#d6b46a]"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-[#aaa18f]"
    >
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

export default UserAccountMenu;
