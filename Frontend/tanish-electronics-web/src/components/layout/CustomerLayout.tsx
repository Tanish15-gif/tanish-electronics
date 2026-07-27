import { useCustomAuth } from "../../contexts/CustomAuthContext";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";
import { createPortal } from "react-dom";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom";
import CustomerNotificationBell from "../../Pages/customer/CustomerNotificationBell";

import {
  getCustomerProfile,
  type CustomerAddress,
  type CustomerProfile
} from "../../Services/customerProfileService";

import {
  getCustomerNotifications,
  type CustomerNotification
} from "../../Services/customerNotificationService";
import { useApiAuth } from "../../hooks/useApiAuth";
import UserAccountMenu from "../customer/UserAccountMenu";

function CustomerLayout() {
  const { isLoaded, isSignedIn, getToken } = useApiAuth();
  const { user, logout } = useCustomAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [notifications, setNotifications] = useState<CustomerNotification[]>(
    []
  );

  const loadProfile = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setProfile(null);
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        setProfile(null);
        return;
      }

      const data = await getCustomerProfile(token);

      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, [isLoaded, isSignedIn, getToken]);

  const loadNotifications = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setNotifications([]);
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        setNotifications([]);
        return;
      }

      const data = await getCustomerNotifications(token);

      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile, location.pathname]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, location.pathname]);

  /*
   * Close the drawer after navigation, including
   * browser back and forward navigation.
   */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  /*
   * Close mobile navigation if the viewport
   * changes to desktop size.
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
   * Lock background scrolling while the mobile
   * drawer is open and restore existing body styles.
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

  const defaultAddress =
    profile?.addresses.find((address) => address.isDefault) ?? null;

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const displayName =
    profile?.fullName?.trim() || user?.fullName?.trim() || "Customer Account";

  const displayEmail = profile?.email || user?.email || "Signed-in customer";

  const profileImageUrl =
    profile?.profileImageUrl ?? user?.profileImageUrl ?? null;

  function closeMenu() {
    setMenuOpen(false);
  }
  async function handleLogout() {
    await logout();

    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 flex-col border-r border-[#d8cdb6] bg-[#fffdf7] p-5 dark:border-[#302c24] dark:bg-[#1a1712] lg:flex">
        <CustomerBrand />

        <div className="te-modal-scroll mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {/* Navigation */}
          <nav aria-label="Customer navigation" className="mt-6 space-y-1">
            <CustomerNavLink to="/customer/dashboard" icon={<DashboardIcon />}>
              Dashboard
            </CustomerNavLink>

            <CustomerNavLink to="/customer/repairs" icon={<RepairIcon />}>
              My Repairs
            </CustomerNavLink>

            <CustomerNavLink to="/customer/feedbacks" icon={<FeedbackIcon />}>
              My Feedback
            </CustomerNavLink>

            <CustomerNavLink to="/customer/enquiries" icon={<EnquiriesIcon />}>
              My Enquiries
            </CustomerNavLink>

            <CustomerNavLink to="/products" icon={<ProductsIcon />}>
              Products
            </CustomerNavLink>
          </nav>

          {/* Quick actions */}
          <section className="mt-6 border-t border-[#d8cdb6] pt-5 dark:border-[#302c24]">
            <p className="px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#817867] dark:text-[#928a7d]">
              Quick actions
            </p>

            <div className="mt-2 space-y-1">
              <SidebarActionLink to="/book-repair" icon={<RepairIcon />}>
                Book repair
              </SidebarActionLink>

              <SidebarActionLink to="/track-request" icon={<TrackIcon />}>
                Track request
              </SidebarActionLink>

              <SidebarActionLink to="/" icon={<PublicIcon />}>
                Public site
              </SidebarActionLink>
            </div>
          </section>
        </div>

        {/* Default address stays outside scrolling content */}
        <div className="mt-4 shrink-0 rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              <LocationIcon />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-black">Default address</p>

              <p className="mt-1 max-h-[60px] overflow-hidden break-words text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                {defaultAddress
                  ? formatAddress(defaultAddress)
                  : "No default address saved."}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="min-w-0 lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-40 border-b border-[#d8cdb6] bg-[#f7f5ef]/95 px-4 backdrop-blur-xl dark:border-[#302c24] dark:bg-[#11110f]/95 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Mobile brand */}
            <Link
              to="/customer/dashboard"
              className="flex min-w-0 items-center gap-3 lg:hidden"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f1a12] text-xs font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]">
                TE
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-black">
                  Customer
                </span>

                <span className="block truncate text-[10px] font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  Tanish Electronics
                </span>
              </span>
            </Link>

            {/* Desktop title */}
            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-black">Customer workspace</p>

              <p className="mt-0.5 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Manage repairs, enquiries and profile
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <CustomerNotificationBell />

              <UserAccountMenu
                displayName={displayName}
                email={displayEmail}
                imageUrl={profileImageUrl}
                manageAccountTo="/customer/profile"
                securityTo="/customer/security"
                accountLabel="Customer account"
                onLogout={handleLogout}
              />

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open customer menu"
                aria-expanded={menuOpen}
                aria-controls="customer-mobile-menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016] lg:hidden"
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <CustomerMobileDrawer
            open={menuOpen}
            profile={profile}
            profileImageUrl={profileImageUrl}
            displayName={displayName}
            displayEmail={displayEmail}
            unreadNotificationCount={unreadNotificationCount}
            closeButtonRef={closeButtonRef}
            onClose={closeMenu}
          />,
          document.body
        )}
    </div>
  );
}

type CustomerMobileDrawerProps = {
  open: boolean;
  profile: CustomerProfile | null;
  profileImageUrl: string | null;
  displayName: string;
  displayEmail: string;
  unreadNotificationCount: number;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

function CustomerMobileDrawer({
  open,
  profile,
  closeButtonRef,
  onClose
}: CustomerMobileDrawerProps) {
  const defaultAddress =
    profile?.addresses.find((address) => address.isDefault) ?? null;

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
        onClick={onClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        id="customer-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Customer navigation"
        className={`absolute left-0 top-0 flex h-[100dvh] w-[88vw] max-w-[360px] flex-col border-r border-[#d8cdb6] bg-[#f7f5ef] text-[#1f1a12] shadow-2xl transition-transform duration-300 ease-out dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#d8cdb6] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#302c24]">
          <CustomerBrand compact onClick={onClose} />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close customer menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          {/* Main navigation */}
          <section className="mt-7">
            <MenuSectionLabel>Navigation</MenuSectionLabel>

            <nav className="mt-3 space-y-1">
              <CustomerMobileNavLink
                to="/customer/dashboard"
                icon={<DashboardIcon />}
                onClick={onClose}
              >
                Dashboard
              </CustomerMobileNavLink>

              <CustomerMobileNavLink
                to="/customer/repairs"
                icon={<RepairIcon />}
                onClick={onClose}
              >
                My Repairs
              </CustomerMobileNavLink>

              <CustomerMobileNavLink
                to="/customer/feedbacks"
                icon={<FeedbackIcon />}
                onClick={onClose}
              >
                My Feedback
              </CustomerMobileNavLink>

              <CustomerMobileNavLink
                to="/customer/enquiries"
                icon={<EnquiriesIcon />}
                onClick={onClose}
              >
                My Enquiries
              </CustomerMobileNavLink>

              <CustomerMobileNavLink
                to="/products"
                icon={<ProductsIcon />}
                onClick={onClose}
              >
                Products
              </CustomerMobileNavLink>
            </nav>
          </section>

          {/* Quick actions */}
          <section className="mt-7 border-t border-[#d8cdb6] pt-6 dark:border-[#302c24]">
            <MenuSectionLabel>Quick actions</MenuSectionLabel>

            <div className="mt-3 space-y-1">
              <CustomerMobileActionLink
                to="/book-repair"
                icon={<RepairIcon />}
                onClick={onClose}
              >
                Book new repair
              </CustomerMobileActionLink>

              <CustomerMobileActionLink
                to="/track-request"
                icon={<TrackIcon />}
                onClick={onClose}
              >
                Track request
              </CustomerMobileActionLink>

              <a
                href="tel:8850973399"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#4f4638] transition hover:bg-[#fffaf0] dark:text-[#a8a093] dark:hover:bg-[#1a1712]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
                  <PhoneIcon />
                </span>

                <span>Call shop</span>
              </a>

              <CustomerMobileActionLink
                to="/"
                icon={<PublicIcon />}
                onClick={onClose}
              >
                Public site
              </CustomerMobileActionLink>
            </div>
          </section>

          {/* Default address */}
          <section className="mt-7 rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                <LocationIcon />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-black">Default address</p>

                <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                  {defaultAddress
                    ? formatAddress(defaultAddress)
                    : "No default address saved."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#302c24] dark:bg-[#11110f]">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
            Customer account
          </p>
        </footer>
      </aside>
    </div>
  );
}

function CustomerBrand({
  compact = false,
  onClick
}: {
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to="/customer/dashboard"
      onClick={onClick}
      className="flex min-w-0 items-center gap-3"
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-[#1f1a12] font-black text-[#f7f5ef] shadow-sm dark:bg-[#e8e3d8] dark:text-[#11110f] ${
          compact ? "h-10 w-10 text-xs" : "h-11 w-11 text-sm"
        }`}
      >
        TE
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-black leading-tight">
          Tanish Electronics
        </span>

        <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#817867] dark:text-[#928a7d]">
          Customer Panel
        </span>
      </span>
    </Link>
  );
}

type CustomerNavLinkProps = {
  to: string;
  children: ReactNode;
  icon: ReactNode;
};

function CustomerNavLink({ to, children, icon }: CustomerNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === "/customer/dashboard"}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-black transition ${
          isActive
            ? "bg-[#1f1a12] text-[#f7f5ef] shadow-sm dark:bg-[#e8e3d8] dark:text-[#11110f]"
            : "text-[#6f6758] hover:bg-[#fff8e7] hover:text-[#1f1a12] dark:text-[#a8a093] dark:hover:bg-[#11110f] dark:hover:text-[#e8e3d8]"
        }`
      }
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span className="min-w-0 flex-1">{children}</span>
    </NavLink>
  );
}

function SidebarActionLink({
  to,
  icon,
  children
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#6f6758] transition hover:bg-[#fff8e7] hover:text-[#1f1a12] dark:text-[#a8a093] dark:hover:bg-[#11110f] dark:hover:text-[#e8e3d8]"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span className="truncate">{children}</span>
    </Link>
  );
}

type CustomerMobileNavLinkProps = {
  to: string;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
};

function CustomerMobileNavLink({
  to,
  children,
  icon,
  onClick
}: CustomerMobileNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === "/customer/dashboard"}
      onClick={onClick}
      className={({ isActive }) =>
        `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-black transition ${
          isActive
            ? "bg-[#1f1a12] text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]"
            : "text-[#4f4638] hover:bg-[#fffaf0] dark:text-[#a8a093] dark:hover:bg-[#1a1712]"
        }`
      }
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        {icon}
      </span>

      <span className="min-w-0 flex-1">{children}</span>
    </NavLink>
  );
}

function CustomerMobileActionLink({
  to,
  icon,
  children,
  onClick
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#4f4638] transition hover:bg-[#fffaf0] dark:text-[#a8a093] dark:hover:bg-[#1a1712]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2eadb] text-[#8a6624] dark:bg-[#242016] dark:text-[#d6b46a]">
        {icon}
      </span>

      <span>{children}</span>
    </Link>
  );
}

function MenuSectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#817867] dark:text-[#928a7d]">
      {children}
    </p>
  );
}

function formatAddress(address: CustomerAddress) {
  return [address.addressLine, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
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

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
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

function EnquiriesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 5h14v11H9l-4 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8 9h8M8 12h5"
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

function FeedbackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 5h14v11H9l-4 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m9 10 1.5 1.5L15 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
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

export function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PublicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />

      <path
        d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.2 5.4 3.2 9s-1 6.6-3.2 9c-2.2-2.4-3.2-5.4-3.2-9S9.8 5.4 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
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

export default CustomerLayout;
