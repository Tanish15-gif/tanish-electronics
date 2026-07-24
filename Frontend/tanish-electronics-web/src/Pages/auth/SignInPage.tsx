import { useEffect, useState, type FormEvent } from "react";
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

type LocationState = {
  from?: string;
};

type StoredAuthUser = {
  roles?: string[];
};

function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useCustomAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Sign In | Tanish Electronics";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

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
      setLoading(true);
      setError("");

      await login({
        email: normalizedEmail,
        password
      });

      const requestedRoute = getSafeRequestedRoute(location.state);

      if (requestedRoute) {
        navigate(requestedRoute, { replace: true });
        return;
      }

      const storedUser = readStoredAuthUser();
      const roles = storedUser?.roles ?? [];

      const isAdmin = roles.some((role) =>
        ["admin", "owner"].includes(role.toLowerCase())
      );

      navigate(isAdmin ? "/admin/dashboard" : "/customer/dashboard", {
        replace: true
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-30"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, rgb(214 180 106 / 0.22), transparent 28%), radial-gradient(circle at 82% 78%, rgb(111 90 51 / 0.14), transparent 30%)"
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#8a6624 1px, transparent 1px), linear-gradient(90deg, #8a6624 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)"
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Go to Tanish Electronics home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f1a12] text-xs font-black text-[#f7f5ef] shadow-sm dark:bg-[#e8e3d8] dark:text-[#11110f]">
              TE
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold sm:text-base">
                Tanish Electronics
              </span>

              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
                Repair &amp; sales
              </span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0]/80 px-4 text-xs font-bold transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#1a1712]/80 dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016] sm:text-sm"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </header>

        <section className="flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-[0_30px_90px_-40px_rgba(31,26,18,0.45)] dark:border-[#302c24] dark:bg-[#1a1712] lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative hidden overflow-hidden border-r border-[#302c24] bg-[#1f1a12] p-10 text-[#f7f5ef] lg:flex lg:flex-col lg:justify-between xl:p-12">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
                  backgroundSize: "36px 36px"
                }}
              />

              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d6b46a]/30 bg-[#d6b46a]/10 text-[#d6b46a]">
                  <ShieldCheck className="h-5 w-5" />
                </span>

                <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
                  Secure account access
                </p>

                <h1 className="font-display mt-4 max-w-sm text-4xl font-semibold leading-tight xl:text-5xl">
                  Your repairs, updates and service history in one place.
                </h1>

                <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#c8bead]">
                  Sign in to track active repairs, manage your profile and
                  access the correct dashboard for your account.
                </p>
              </div>

              <div className="relative mt-12 rounded-2xl border border-[#d6b46a]/20 bg-[#1a1712]/80 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d6b46a]/10 text-[#d6b46a]">
                    <LockKeyhole className="h-4 w-4" />
                  </span>

                  <div>
                    <p className="text-sm font-bold">Protected sign-in</p>
                    <p className="mt-1 text-xs font-medium text-[#a8a093]">
                      Customer and admin access are routed automatically.
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
                  Enter your account details to continue.
                </p>

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      Email address
                    </span>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        inputMode="email"
                        disabled={loading}
                        className="admin-input h-12 pl-11"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      Password
                    </span>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={loading}
                        className="admin-input h-12 px-11"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        disabled={loading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] hover:text-[#1f1a12] disabled:cursor-not-allowed dark:text-[#928a7d] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-bold text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#c9a85f]"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-current border-t-transparent" />
                      </>
                    ) : (
                      <>
                        Sign in
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
                  Admin and customer access is selected automatically after
                  authentication.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs font-medium text-[#817867] dark:text-[#928a7d] sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Tanish Electronics</p>

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
