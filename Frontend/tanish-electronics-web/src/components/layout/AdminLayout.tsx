import { useCustomAuth } from "../../contexts/CustomAuthContext";
import { useApiAuth } from "../../hooks/useApiAuth";
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

import AdminNotificationBell from "../../Pages/admin/AdminNotificationBell";

import { Users, MessageSquare } from "lucide-react";

import {
  getAdminNotifications,
  type AdminNotification
} from "../../Services/adminNotificationService";

import UserAccountMenu from "../auth/UserAccountMenu";
import { useShopSettings } from "../../hooks/useShopSettings";
import TanishElectronicsLogo from "../common/TanishElectronicsLogo";

function AdminLayout() {
  const { settings } = useShopSettings();
  const { isLoaded, isSignedIn, getToken } = useApiAuth();
  const { user, logout } = useCustomAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  async function handleLogout() {
    await logout();

    navigate("/sign-in", { replace: true });
  }

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

      const data = await getAdminNotifications(token);

      setNotifications(data);
    } catch {
      setNotifications([]);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

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

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const displayName = user?.fullName?.trim() || "Administrator";

  const displayEmail = user?.email || "Owner account";

  const profileImageUrl = user?.profileImageUrl ?? null;

  const pageTitle = getAdminPageTitle(location.pathname);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-72 flex-col border-r border-[#d8cdb6] bg-[#fffdf7] p-5 dark:border-[#302c24] dark:bg-[#1a1712] lg:flex">
        <AdminBrand />

        <div className="te-modal-scroll mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          {/* Admin identity */}

          {/* Main navigation */}
          <nav aria-label="Admin navigation" className="mt-6 space-y-1">
            <AdminNavLink to="/admin/dashboard" icon={<DashboardIcon />}>
              Dashboard
            </AdminNavLink>

            <AdminNavLink
              to="/admin/users"
              icon={<Users className="h-5 w-5" />}
            >
              Users
            </AdminNavLink>

            <AdminNavLink to="/admin/service-requests" icon={<RequestsIcon />}>
              Service Requests
            </AdminNavLink>

            <AdminNavLink
              to="/admin/chat-logs"
              icon={<MessageSquare className="h-5 w-5" />}
            >
              Chat Logs
            </AdminNavLink>

            <AdminNavLink to="/admin/enquiries" icon={<EnquiriesIcon />}>
              Enquiries
            </AdminNavLink>

            <AdminNavLink to="/admin/products" icon={<ProductsIcon />}>
              Products
            </AdminNavLink>

            <AdminNavLink to="/admin/feedbacks" icon={<FeedbackIcon />}>
              Feedback
            </AdminNavLink>

            <AdminNavLink to="/admin/announcements" icon={<AnnouncementIcon />}>
              Announcements
            </AdminNavLink>
            <AdminNavLink to="/admin/system-health" icon={<HealthIcon />}>
              System Health
            </AdminNavLink>

            <AdminNavLink to="/admin/audit-logs" icon={<AuditLogIcon />}>
              Audit Logs
            </AdminNavLink>

            <AdminNavLink to="/admin/analytics" icon={<AnalyticsIcon />}>
              Analytics
            </AdminNavLink>
          </nav>

          {/* Quick actions */}
          <section className="mt-6 border-t border-[#d8cdb6] pt-5 dark:border-[#302c24]">
            <MenuSectionLabel>Quick actions</MenuSectionLabel>

            <div className="mt-2 space-y-1">
              <SidebarActionLink to="/admin/products/new" icon={<PlusIcon />}>
                Add product
              </SidebarActionLink>

              <SidebarActionLink
                to="/admin/announcements"
                icon={<AnnouncementIcon />}
              >
                Manage announcements
              </SidebarActionLink>

              <SidebarActionLink to="/" icon={<PublicIcon />}>
                Public site
              </SidebarActionLink>
            </div>
          </section>
        </div>

        {/* Bottom access card */}
        <div className="mt-4 shrink-0 rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#11110f]">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
              <ShieldIcon />
            </span>

            <div>
              <p className="text-xs font-black">Protected workspace</p>

              <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                Administration tools for ${settings.shopName}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="min-w-0 lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[#d8cdb6] bg-[#f7f5ef]/95 px-4 backdrop-blur-xl dark:border-[#302c24] dark:bg-[#11110f]/95 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Mobile brand */}
            <Link
              to="/admin/dashboard"
              className="flex min-w-0 items-center gap-3 lg:hidden"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-0.5 shadow-xs dark:border-[#383124] dark:bg-[#161410]">
                <TanishElectronicsLogo className="h-full w-full rounded-lg object-cover" />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-black">Admin</span>

                <span className="block truncate text-[10px] font-semibold text-[#6f6758] dark:text-[#a8a093]">
                  {settings.shopName}
                </span>
              </span>
            </Link>

            {/* Desktop current page */}
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-black">{pageTitle}</p>

              <p className="mt-0.5 text-xs font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Admin workspace
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <AdminNotificationBell />

              <Link
                to="/admin/settings"
                aria-label="Open shop settings"
                title="Shop settings"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffaf0] text-[#1f1a12] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
              >
                <SettingsIcon />
              </Link>

              <UserAccountMenu
                displayName={displayName}
                email={displayEmail}
                imageUrl={profileImageUrl}
                manageAccountTo="/admin/account"
                securityTo="/admin/security"
                accountLabel="Administrator account"
                onLogout={handleLogout}
              />

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open admin menu"
                aria-expanded={menuOpen}
                aria-controls="admin-mobile-menu"
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
          <AdminMobileDrawer
            open={menuOpen}
            displayName={displayName}
            displayEmail={displayEmail}
            profileImageUrl={profileImageUrl}
            unreadNotificationCount={unreadNotificationCount}
            closeButtonRef={closeButtonRef}
            onClose={closeMenu}
          />,
          document.body
        )}
    </div>
  );

  type AdminMobileDrawerProps = {
    open: boolean;
    displayName: string;
    displayEmail: string;
    profileImageUrl: string | null;
    unreadNotificationCount: number;
    closeButtonRef: RefObject<HTMLButtonElement | null>;
    onClose: () => void;
  };

  function AdminMobileDrawer({
    open,
    closeButtonRef,
    onClose
  }: AdminMobileDrawerProps) {
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
          id="admin-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={`absolute left-0 top-0 flex h-[100dvh] w-[88vw] max-w-[360px] flex-col border-r border-[#d8cdb6] bg-[#f7f5ef] text-[#1f1a12] shadow-2xl transition-transform duration-300 ease-out dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#e8e3d8] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#d8cdb6] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-[#302c24]">
            <AdminBrand compact onClick={onClose} />

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close admin menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8cdb6] bg-[#fffdf7] transition hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712] dark:hover:bg-[#242016]"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="te-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
            {/* Navigation */}
            <section className="mt-7">
              <MenuSectionLabel>Navigation</MenuSectionLabel>

              <nav className="mt-3 space-y-1">
                <AdminMobileNavLink
                  to="/admin/dashboard"
                  icon={<DashboardIcon />}
                  onClick={onClose}
                >
                  Dashboard
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/users"
                  icon={<Users className="h-5 w-5" />}
                  onClick={onClose}
                >
                  Users
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/service-requests"
                  icon={<RequestsIcon />}
                  onClick={onClose}
                >
                  Service Requests
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/chat-logs"
                  icon={<MessageSquare className="h-5 w-5" />}
                  onClick={onClose}
                >
                  Chat Logs
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/enquiries"
                  icon={<EnquiriesIcon />}
                  onClick={onClose}
                >
                  Enquiries
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/products"
                  icon={<ProductsIcon />}
                  onClick={onClose}
                >
                  Products
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/feedbacks"
                  icon={<FeedbackIcon />}
                  onClick={onClose}
                >
                  Feedback
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/announcements"
                  icon={<AnnouncementIcon />}
                  onClick={onClose}
                >
                  Announcements
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/system-health"
                  icon={<HealthIcon />}
                  onClick={onClose}
                >
                  System Health
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/audit-logs"
                  icon={<AuditLogIcon />}
                  onClick={onClose}
                >
                  Audit Logs
                </AdminMobileNavLink>

                <AdminMobileNavLink
                  to="/admin/analytics"
                  icon={<AnalyticsIcon />}
                  onClick={onClose}
                >
                  Analytics
                </AdminMobileNavLink>
              </nav>
            </section>

            {/* Quick actions */}
            <section className="mt-7 border-t border-[#d8cdb6] pt-6 dark:border-[#302c24]">
              <MenuSectionLabel>Quick actions</MenuSectionLabel>

              <div className="mt-3 space-y-1">
                <AdminMobileActionLink
                  to="/admin/products/new"
                  icon={<PlusIcon />}
                  onClick={onClose}
                >
                  Add product
                </AdminMobileActionLink>

                <AdminMobileActionLink
                  to="/admin/announcements"
                  icon={<AnnouncementIcon />}
                  onClick={onClose}
                >
                  Manage announcements
                </AdminMobileActionLink>

                <AdminMobileActionLink
                  to="/"
                  icon={<PublicIcon />}
                  onClick={onClose}
                >
                  Public site
                </AdminMobileActionLink>
              </div>
            </section>

            {/* Protected-access card */}
            <section className="mt-7 rounded-[1.25rem] border border-[#d8cdb6] bg-[#fff8e7] p-4 dark:border-[#302c24] dark:bg-[#1a1712]">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                  <ShieldIcon />
                </span>

                <div>
                  <p className="text-xs font-black">Protected workspace</p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-[#6f6758] dark:text-[#a8a093]">
                    Owner and administration tools for the business.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <footer className="shrink-0 border-t border-[#d8cdb6] bg-[#fffaf0] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 dark:border-[#302c24] dark:bg-[#11110f]">
            <p className="text-center text-[10px] font-black uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
              Administrator account
            </p>
          </footer>
        </aside>
      </div>
    );
  }

  function AdminBrand({
    compact = false,
    onClick
  }: {
    compact?: boolean;
    onClick?: () => void;
  }) {
    return (
      <Link
        to="/admin/dashboard"
        onClick={onClick}
        className="flex min-w-0 items-center gap-3"
      >
        <span
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-0.5 shadow-xs dark:border-[#383124] dark:bg-[#161410] ${
            compact ? "h-10 w-10" : "h-11 w-11"
          }`}
        >
          <TanishElectronicsLogo className="h-full w-full rounded-lg object-cover" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-black leading-tight">
            {settings.shopName}
          </span>

          <span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#817867] dark:text-[#928a7d]">
            Admin Panel
          </span>
        </span>
      </Link>
    );
  }
}

type AdminNavLinkProps = {
  to: string;
  children: ReactNode;
  icon: ReactNode;
};

function AdminNavLink({ to, children, icon }: AdminNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === "/admin/dashboard"}
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

type AdminMobileNavLinkProps = {
  to: string;
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
};

function AdminMobileNavLink({
  to,
  children,
  icon,
  onClick
}: AdminMobileNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === "/admin/dashboard"}
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

function AdminMobileActionLink({
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
    <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#817867] dark:text-[#928a7d]">
      {children}
    </p>
  );
}

function getAdminPageTitle(pathname: string) {
  if (pathname.startsWith("/admin/products/new")) {
    return "Add Product";
  }

  if (pathname.startsWith("/admin/service-requests")) {
    return "Service Requests";
  }

  if (pathname.startsWith("/admin/enquiries")) {
    return "Enquiries";
  }

  if (pathname.startsWith("/admin/products")) {
    return "Products";
  }

  if (pathname.startsWith("/admin/feedbacks")) {
    return "Customer Feedback";
  }

  if (pathname.startsWith("/admin/announcements")) {
    return "Announcements";
  }

  if (pathname.startsWith("/admin/notifications")) {
    return "Notifications";
  }

  if (pathname.startsWith("/admin/system-health")) {
    return "System Health";
  }

  if (pathname.startsWith("/admin/audit-logs")) {
    return "Audit Logs";
  }

  if (pathname.startsWith("/admin/analytics")) {
    return "Analytics";
  }

  if (pathname.startsWith("/admin/settings")) {
    return "Settings";
  }

  if (pathname.startsWith("/admin/users")) {
    return "Users";
  }

  if (pathname.startsWith("/admin/chat-logs")) {
    return "AI Chat Logs";
  }

  return "Dashboard";
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

function RequestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 4h10l2 2v14H5V6l2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8 10h8M8 14h8M8 18h5"
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

function AnnouncementIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 10v4h4l7 4V6l-7 4H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M18 9a4 4 0 0 1 0 6M8 14l1 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HealthIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 21s-7-4.35-7-10.2C5 7.55 7.55 5 10.7 5c1.35 0 2.62.5 3.3 1.45C14.68 5.5 15.95 5 17.3 5 20.45 5 23 7.55 23 10.8 23 16.65 16 21 16 21h-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 12h2l1-2.2 1.8 4.4 1.2-2.2h2"
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuditLogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 4h10l2 2v14H5V6l2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M8 10h8M8 14h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="m15.5 17.5 1.2 1.2 2.8-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M5 19V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M5 19h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M8 16v-4M12 16V8M16 16v-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M19.4 13.5a7.9 7.9 0 0 0 0-3l2-1.5-2-3.4-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.6A8.2 8.2 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.5a7.9 7.9 0 0 0 0 3l-2 1.5 2 3.4 2.4-1a8.2 8.2 0 0 0 2.6 1.5L10 21.5h4l.4-2.6a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default AdminLayout;
