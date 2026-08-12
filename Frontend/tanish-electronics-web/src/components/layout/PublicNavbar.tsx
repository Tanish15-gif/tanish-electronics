import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentAuthUser, type AuthUser } from "../../Services/authService";
import ThemeToggle from "../UI/ThemeToggle";
import { useShopSettings } from "../../hooks/useShopSettings";
import { useApiAuth } from "../../hooks/useApiAuth";
import { useCustomAuth } from "../../contexts/CustomAuthContext";
import UserAccountMenu from "../auth/UserAccountMenu";

function PublicNavbar() {
  const { isLoaded, isSignedIn, getToken } = useApiAuth();

  const location = useLocation();

  const { user, logout } = useCustomAuth();

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();

  const displayName = user?.fullName?.trim() || "Customer Account";

  const displayEmail = user?.email || "Signed-in customer";

  const profileImageUrl = user?.profileImageUrl ?? null;

  async function handleLogout() {
    await logout();

    navigate("/sign-in", { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAuthUser() {
      if (!isLoaded || !isSignedIn) {
        if (!cancelled) {
          setAuthUser(null);
        }

        return;
      }

      try {
        const token = await getToken();

        if (!token) {
          if (!cancelled) {
            setAuthUser(null);
          }

          return;
        }

        const user = await getCurrentAuthUser(token);

        if (!cancelled) {
          setAuthUser(user);
        }
      } catch {
        if (!cancelled) {
          setAuthUser(null);
        }
      }
    }

    void loadAuthUser();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /*
   * Close the mobile menu after route navigation.
   */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  /*
   * Close the mobile drawer when resizing to desktop.
   */
  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1024px)");

    function handleDesktopChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMenuOpen(false);
      }
    }

    desktopMedia.addEventListener("change", handleDesktopChange);

    return () => {
      desktopMedia.removeEventListener("change", handleDesktopChange);
    };
  }, []);

  /*
   * Lock background scrolling while preserving
   * the user's current page position.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const scrollPosition = window.scrollY;

    const previousStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPosition}px`;

    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      document.body.style.position = previousStyles.position;

      document.body.style.top = previousStyles.top;

      document.body.style.left = previousStyles.left;

      document.body.style.right = previousStyles.right;

      document.body.style.width = previousStyles.width;

      document.body.style.overflow = previousStyles.overflow;

      window.scrollTo(0, scrollPosition);
    };
  }, [menuOpen]);

  const dashboardPath = authUser?.isAdmin
    ? "/admin/dashboard"
    : "/customer/dashboard";

  const dashboardLabel = authUser?.isAdmin ? "Admin Dashboard" : "My Dashboard";

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[90] border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled
            ? "border-[#d8cdb6] bg-[#f7f5ef]/95 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-[#302c24] dark:bg-[#11110f]/95 dark:shadow-black/20"
            : "border-black/10 bg-[#f7f5ef]/90 backdrop-blur-lg dark:border-white/10 dark:bg-[#11110f]/90"
        }`}
      >
        {/* Mobile header */}
        <nav
          aria-label="Mobile navigation"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:hidden"
        >
          <Brand onClick={closeMenu} compact />

          <div className="ml-3 flex shrink-0 items-center gap-2">
            <ThemeToggle />

            {isSignedIn ?? (
              <UserAccountMenu
                displayName={displayName}
                email={displayEmail}
                imageUrl={profileImageUrl}
                manageAccountTo="/customer/profile"
                securityTo="/customer/security"
                accountLabel="Customer account"
                onLogout={handleLogout}
              />
            )}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] text-[#1f1a12] shadow-sm transition hover:border-[#c7b98e] hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:border-[#50483b] dark:hover:bg-[#242016]"
            >
              <MenuIcon />
            </button>
          </div>
        </nav>

        {/* Desktop header */}
        <nav
          aria-label="Primary navigation"
          className="mx-auto hidden h-[72px] max-w-7xl items-center px-4 sm:px-6 lg:flex lg:px-8"
        >
          <Brand />

          <div className="flex flex-1 justify-center px-5">
            <div className="flex items-center gap-1">
              <DesktopNavItem to="/">Home</DesktopNavItem>

              <DesktopNavItem to="/track-request">Track Request</DesktopNavItem>

              <DesktopNavItem to="/products">Products</DesktopNavItem>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <Link
              to="/book-repair"
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#33291b] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
            >
              Book Repair
              <ArrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            {isLoaded && !isSignedIn && (
              <Link
                to="/sign-in"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-sm font-black transition hover:border-[#c7b98e] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:bg-[#242016]"
              >
                Sign In
              </Link>
            )}

            {isLoaded && isSignedIn && (
              <>
                <Link
                  to={dashboardPath}
                  className="hidden h-11 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-sm font-black transition hover:border-[#c7b98e] hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#50483b] dark:hover:bg-[#242016] xl:inline-flex"
                >
                  <DashboardIcon />
                  {dashboardLabel}
                </Link>

                <UserAccountMenu
                  displayName={displayName}
                  email={displayEmail}
                  imageUrl={profileImageUrl}
                  manageAccountTo="/customer/profile"
                  securityTo="/customer/security"
                  accountLabel="Customer account"
                  onLogout={handleLogout}
                />
              </>
            )}

            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Prevent fixed navbar from covering page content */}
      <div aria-hidden="true" className="h-16 lg:h-[72px]" />

      {typeof document !== "undefined" &&
        createPortal(
          <MobileNavigationDrawer
            open={menuOpen}
            closeButtonRef={closeButtonRef}
            signedIn={Boolean(isLoaded && isSignedIn)}
            dashboardPath={dashboardPath}
            dashboardLabel={dashboardLabel}
            isAdmin={Boolean(authUser?.isAdmin)}
            profileImageUrl={profileImageUrl}
            onClose={closeMenu}
          />,
          document.body
        )}
    </>
  );
}

function Brand({
  onClick,
  compact = false
}: {
  onClick?: () => void;
  compact?: boolean;
}) {
  const { settings } = useShopSettings();
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label={`${settings.shopName} home`}
      className="group flex min-w-0 shrink-0 items-center gap-3"
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-[#1f1a12] font-black text-[#f7f5ef] shadow-sm transition group-hover:scale-[1.03] dark:bg-[#e8e3d8] dark:text-[#11110f] ${
          compact ? "h-10 w-10 text-xs" : "h-11 w-11 text-sm"
        }`}
      >
        TE
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[15px] font-black leading-tight text-[#1f1a12] dark:text-[#e8e3d8] sm:text-base">
          {settings.shopName}
        </span>

        <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#817867] dark:text-[#928a7d] sm:text-[11px]">
          Repair &amp; Sales
        </span>
      </span>
    </Link>
  );
}

function DesktopNavItem({ to, children }: { to: string; children: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `relative inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-black transition ${
          isActive
            ? "bg-[#f2eadb] text-[#1f1a12] dark:bg-[#242016] dark:text-[#e8e3d8]"
            : "text-[#6f6758] hover:bg-[#f2eadb]/70 hover:text-[#1f1a12] dark:text-[#a8a093] dark:hover:bg-[#242016]/80 dark:hover:text-[#e8e3d8]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function MobileNavigationDrawer({
  open,
  closeButtonRef,
  signedIn,
  dashboardPath,
  dashboardLabel,
  isAdmin,
  profileImageUrl,
  onClose
}: {
  open: boolean;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  signedIn: boolean;
  dashboardPath: string;
  dashboardLabel: string;
  isAdmin: boolean;
  profileImageUrl: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-[700] lg:hidden ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        role="presentation"
        onMouseDown={onClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        id="public-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`absolute left-0 top-0 flex h-[100dvh] w-[88vw] max-w-[360px] flex-col border-r border-[#d8cdb6] bg-[#f7f5ef] text-[#1f1a12] shadow-2xl transition-transform duration-300 ease-out dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#d8cdb6] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#302c24]">
          <Brand onClick={onClose} compact />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          {/* Primary mobile CTA */}
          <Link
            to="/book-repair"
            onClick={onClose}
            className="group flex min-h-12 w-full items-center justify-between rounded-xl bg-[#1f1a12] px-5 text-sm font-black text-[#f7f5ef] shadow-md transition hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
          >
            <span className="flex items-center gap-3">
              <RepairIcon />
              Book a Repair
            </span>

            <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Navigation */}
          <section className="mt-7">
            <MenuSectionLabel>Navigation</MenuSectionLabel>

            <div className="mt-3 space-y-1">
              <MobileNavItem to="/" icon={<HomeIcon />} onClick={onClose}>
                Home
              </MobileNavItem>

              <MobileNavItem
                to="/track-request"
                icon={<TrackIcon />}
                onClick={onClose}
              >
                Track Request
              </MobileNavItem>

              <MobileNavItem
                to="/products"
                icon={<ProductsIcon />}
                onClick={onClose}
              >
                Products
              </MobileNavItem>
            </div>
          </section>

          {/* Account */}
          <section className="mt-7 border-t border-[#d8cdb6] pt-6 dark:border-[#302c24]">
            <MenuSectionLabel>Account</MenuSectionLabel>

            <div className="mt-3">
              {!signedIn ? (
                <Link
                  to="/sign-in"
                  onClick={onClose}
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[#d8cdb6] bg-[#fffdf7] px-4 text-sm font-black transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
                >
                  <span>Sign in to your account</span>
                  <ArrowRightIcon />
                </Link>
              ) : (
                <div className="rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-3 dark:border-[#302c24] dark:bg-[#1a1712]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#d8cdb6] bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#242016]">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Your profile"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <UserIcon />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black">Signed-in account</p>

                      <p className="mt-0.5 text-xs font-semibold text-[#817867] dark:text-[#928a7d]">
                        {isAdmin ? "Administrator access" : "Customer access"}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={dashboardPath}
                    onClick={onClose}
                    className="mt-3 flex min-h-11 w-full items-center justify-between rounded-lg bg-[#f2eadb] px-4 text-xs font-black transition hover:bg-[#e8dcc4] dark:bg-[#242016] dark:hover:bg-[#302c24]"
                  >
                    <span className="flex items-center gap-2">
                      <DashboardIcon />
                      {dashboardLabel}
                    </span>

                    <ArrowRightIcon />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Contact */}
          <section className="mt-7 border-t border-[#d8cdb6] pt-6 dark:border-[#302c24]">
            <MenuSectionLabel>Contact the shop</MenuSectionLabel>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <a
                href="tel:8850973399"
                onClick={onClose}
                className="flex min-h-20 flex-col items-start justify-between rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-4 transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016]"
              >
                <PhoneIcon />

                <span>
                  <span className="block text-xs font-black">Call Shop</span>

                  <span className="mt-1 block text-[10px] font-semibold text-[#817867] dark:text-[#928a7d]">
                    8850973399
                  </span>
                </span>
              </a>

              <a
                href="https://wa.me/918850973399?text=Hello%20Tanish%20Electronics%2C%20I%20need%20repair%20help."
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
                className="flex min-h-20 flex-col items-start justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
              >
                <WhatsAppIcon />

                <span>
                  <span className="block text-xs font-black">WhatsApp</span>

                  <span className="mt-1 block text-[10px] font-semibold opacity-75">
                    Message us
                  </span>
                </span>
              </a>
            </div>
          </section>

          {/* Service area */}
          <section className="mt-7 rounded-xl border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                <LocationIcon />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
                  Local service area
                </p>

                <p className="mt-2 text-sm font-black leading-6">
                  Santacruz West, Gajdhar Bandh and nearby supported areas.
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#302c24] dark:bg-[#11110f]">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#817867] dark:text-[#928a7d]">
            Local electronics repair &amp; sales
          </p>
        </footer>
      </aside>
    </div>
  );
}

function MenuSectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#817867] dark:text-[#928a7d]">
      {children}
    </p>
  );
}

function MobileNavItem({
  to,
  children,
  icon,
  onClick
}: {
  to: string;
  children: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex min-h-12 items-center justify-between rounded-xl border px-3.5 text-sm font-black transition ${
          isActive
            ? "border-[#d6b46a]/50 bg-[#fff4cc] text-[#1f1a12] dark:border-[#d6b46a]/30 dark:bg-[#d6b46a]/10 dark:text-[#e8e3d8]"
            : "border-transparent text-[#4f4638] hover:border-[#d8cdb6] hover:bg-[#fffdf7] dark:text-[#a8a093] dark:hover:border-[#302c24] dark:hover:bg-[#1a1712]"
        }`
      }
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
          {icon}
        </span>

        <span className="truncate">{children}</span>
      </span>

      <ArrowRightIcon className="shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </NavLink>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 7h14M5 12h14M5 17h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="m4 11.5 8-6.5 8 6.5V20H5a1 1 0 0 1-1-1v-7.5ZM9 20v-6h6v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RepairIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="m14 6 4-2 2 2-2 4-4 1-5 5-3-3 5-5 1-4 2 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 7h16v13H4V7Zm3 0a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-[55%] w-[55%] text-[#8a6624] dark:text-[#d6b46a]"
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
      className="h-5 w-5 shrink-0"
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

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M16.04 3C9.43 3 4.05 8.38 4.05 14.99c0 2.11.55 4.17 1.6 5.99L4 29l8.25-1.62a11.9 11.9 0 0 0 5.79 1.48h.01c6.61 0 11.99-5.38 11.99-11.99S22.65 3 16.04 3Zm0 23.84h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-4.9.96.98-4.78-.24-.39a9.9 9.9 0 0 1-1.5-5.25c0-5.49 4.47-9.96 9.96-9.96S26 10.3 26 15.79s-4.47 11.05-9.96 11.05Zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.16 4.56.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
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

export default PublicNavbar;
