import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useCustomAuth } from "../../contexts/CustomAuthContext";
import GoogleSignInButton from "../GoogleSignInButton";
import { useShopSettings } from "../../hooks/useShopSettings";
import TanishElectronicsLogo from "../../components/common/TanishElectronicsLogo";

type LocationState = {
  from?: string;
};

type StoredAuthUser = {
  roles?: string[];
};

function SignInPage() {
  const { settings } = useShopSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoginBusy, setPasswordLoginBusy] = useState(false);
  const [googleLoginBusy, setGoogleLoginBusy] = useState(false);

  const [error, setError] = useState("");

  const authenticationBusy = passwordLoginBusy || googleLoginBusy;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Sign In | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const routeAuthenticatedUser = useCallback(
    (roles: string[]) => {
      const normalizedRoles = roles.map((role) => role.toLowerCase());

      const isAdmin =
        normalizedRoles.includes("admin") || normalizedRoles.includes("owner");

      const requestedRoute = getSafeRequestedRoute(location.state);

      if (requestedRoute) {
        const requestedAdminRoute = requestedRoute.startsWith("/admin");

        if (requestedAdminRoute && !isAdmin) {
          navigate("/customer/dashboard", { replace: true });
          return;
        }

        navigate(requestedRoute, { replace: true });
        return;
      }

      navigate(isAdmin ? "/admin/dashboard" : "/customer/dashboard", {
        replace: true
      });
    },
    [location.state, navigate]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authenticationBusy) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      setPasswordLoginBusy(true);
      setError("");

      await login({
        email: normalizedEmail,
        password
      });

      const storedUser = readStoredAuthUser();
      routeAuthenticatedUser(storedUser?.roles ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Email or password is incorrect."
      );
    } finally {
      setPasswordLoginBusy(false);
    }
  }

  return (
    <main
      className="te-sheet-bg relative min-h-screen overflow-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 16% 18%, rgb(214 180 106 / 0.16), transparent 27%), radial-gradient(circle at 84% 80%, rgb(111 90 51 / 0.10), transparent 30%)"
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label={`Go to ${settings.shopName} home`}
            className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/25"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8cdb6]/60 bg-[#1f1a12] p-0.5 shadow-xs dark:border-[#383124] dark:bg-[#161410]">
              <TanishElectronicsLogo className="h-full w-full rounded-lg object-cover" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold sm:text-base">
                {settings.shopName}
              </span>

              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
                Repair &amp; sales
              </span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0]/85 px-4 text-xs font-bold shadow-sm backdrop-blur transition hover:border-[#d6b46a] hover:bg-[#fff4cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712]/85 dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016] sm:text-sm"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </header>

        <section className="flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7]/95 shadow-[0_32px_100px_-46px_rgba(31,26,18,0.5)] backdrop-blur dark:border-[#302c24] dark:bg-[#1a1712]/95 lg:grid-cols-[0.92fr_1.08fr]">
            <aside className="relative hidden min-h-[670px] overflow-hidden border-r border-[#302c24] bg-[#1f1a12] p-10 text-[#f7f5ef] lg:flex lg:flex-col lg:justify-between xl:p-12">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
                  backgroundSize: "38px 38px"
                }}
              />

              <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#d6b46a]/10 blur-3xl" />

              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d6b46a]/30 bg-[#d6b46a]/10 text-[#d6b46a]">
                  <ShieldCheck className="h-5 w-5" />
                </span>

                <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
                  Secure account access
                </p>

                <h1 className="font-display mt-4 max-w-md text-4xl font-semibold leading-[1.08] xl:text-5xl">
                  Your repairs and service history, securely connected.
                </h1>

                <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#c8bead]">
                  Sign in once to manage bookings, monitor repair progress and
                  open the correct workspace for your account.
                </p>
              </div>

              <div className="relative mt-12 rounded-2xl border border-[#d6b46a]/20 bg-[#1a1712]/85 p-5 backdrop-blur">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d6b46a]/10 text-[#d6b46a]">
                    <LockKeyhole className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-sm font-bold">Protected access</p>

                    <p className="mt-1 text-xs font-medium leading-5 text-[#a8a093]">
                      Google credentials are exchanged with the{" "}
                      {settings.shopName}
                      API before access is granted.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex items-center justify-center p-6 sm:p-9 lg:p-12 xl:p-14">
              <div className="w-full max-w-md">
                <div className="lg:hidden">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a] lg:mt-0">
                  Welcome back
                </p>

                <h2 className="font-display mt-3 text-4xl font-semibold leading-none">
                  Sign in
                </h2>

                <p className="mt-4 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
                  Continue securely with Google or your email and password.
                </p>

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-7">
                  <GoogleSignInButton
                    disabled={passwordLoginBusy}
                    onBusyChange={setGoogleLoginBusy}
                    onAuthenticated={routeAuthenticatedUser}
                  />
                </div>

                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-[#d8cdb6] dark:bg-[#302c24]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
                    Or use email
                  </span>
                  <span className="h-px flex-1 bg-[#d8cdb6] dark:bg-[#302c24]" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      Email address
                    </span>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setError("");
                        }}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        inputMode="email"
                        disabled={authenticationBusy}
                        required
                        className="admin-input h-12 pl-11"
                      />
                    </div>
                  </label>

                  <div className="block">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        htmlFor="sign-in-password"
                        className="text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="shrink-0 text-xs font-bold text-[#8a6624] transition hover:text-[#6f4e12] hover:underline dark:text-[#d6b46a]"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        id="sign-in-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                        }}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={authenticationBusy}
                        required
                        className="admin-input h-12 px-11"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        disabled={authenticationBusy}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] hover:text-[#1f1a12] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#928a7d] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authenticationBusy}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-bold text-[#f7f5ef] shadow-sm transition hover:bg-[#33291b] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#c9a85f]"
                  >
                    {passwordLoginBusy ? (
                      <>
                        <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-current border-t-transparent" />
                      </>
                    ) : (
                      <>
                        Sign in securely
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 border-t border-[#d8cdb6] pt-6 text-center dark:border-[#302c24]">
                  <p className="text-sm font-medium text-[#6f6758] dark:text-[#a8a093]">
                    New customer?{" "}
                    <Link
                      to="/sign-up"
                      className="font-bold text-[#8a6624] transition hover:text-[#6f4e12] dark:text-[#d6b46a]"
                    >
                      Create an account
                    </Link>
                  </p>
                </div>

                <p className="mt-6 text-center text-[11px] font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                  Your role is checked after authentication, then you are sent
                  to the appropriate dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs font-medium text-[#817867] dark:text-[#928a7d] sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {settings.shopName}
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              to="/products"
              className="transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              Products
            </Link>
            <Link
              to="/book-repair"
              className="transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              Book repair
            </Link>
            <Link
              to="/track-request"
              className="transition hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              Track request
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}

function getSafeRequestedRoute(state: unknown) {
  const requestedRoute = (state as LocationState | null)?.from;

  if (
    typeof requestedRoute !== "string" ||
    !requestedRoute.startsWith("/") ||
    requestedRoute.startsWith("//") ||
    requestedRoute === "/sign-in" ||
    requestedRoute === "/sign-up"
  ) {
    return null;
  }

  return requestedRoute;
}

function readStoredAuthUser(): StoredAuthUser | null {
  try {
    const storedUserRaw = localStorage.getItem("te_auth_user");

    if (!storedUserRaw) {
      return null;
    }

    const parsedUser = JSON.parse(storedUserRaw) as StoredAuthUser;
    return Array.isArray(parsedUser.roles) ? parsedUser : null;
  } catch {
    return null;
  }
}

export default SignInPage;
