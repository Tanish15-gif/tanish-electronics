import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Home,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useCustomAuth } from "../../contexts/CustomAuthContext";
import GoogleSignInButton from "../GoogleSignInButton";
import { useShopSettings } from "../../hooks/useShopSettings";
import TanishElectronicsLogo from "../../components/common/TanishElectronicsLogo";

function SignUpPage() {
  const { settings } = useShopSettings();
  const navigate = useNavigate();
  const { register } = useCustomAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const authenticationBusy = loading || googleLoading;

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `Create Account | ${settings.shopName}`;

    return () => {
      document.title = previousTitle;
    };
  }, []);

  function handleGoogleAuthenticated(roles: string[]) {
    const normalizedRoles = roles.map((role) => role.toLowerCase());

    const isAdmin =
      normalizedRoles.includes("admin") || normalizedRoles.includes("owner");

    navigate(isAdmin ? "/admin/dashboard" : "/customer/dashboard", {
      replace: true
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authenticationBusy) {
      return;
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    if (normalizedName.length < 2) {
      setError("Enter your full name.");
      return;
    }

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (
      normalizedPhone &&
      (normalizedPhone.length < 10 || normalizedPhone.length > 15)
    ) {
      setError("Enter a valid phone number between 10 and 15 digits.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register({
        fullName: normalizedName,
        email: normalizedEmail,
        phoneNumber: normalizedPhone || null,
        password
      });

      navigate("/customer/dashboard", {
        replace: true
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="te-sheet-bg relative min-h-screen overflow-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-30"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, rgb(214 180 106 / 0.22), transparent 28%), radial-gradient(circle at 82% 78%, rgb(111 90 51 / 0.14), transparent 30%)"
        }}
      />

      {/* Background grid */}
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
        {/* Header */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label={`Go to ${settings.shopName} home`}
            className="flex min-w-0 items-center gap-3"
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
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0]/80 px-4 text-xs font-bold transition hover:border-[#d6b46a] hover:bg-[#fff4cc] dark:border-[#302c24] dark:bg-[#1a1712]/80 dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016] sm:text-sm"
          >
            <Home className="h-4 w-4" />

            <span className="hidden sm:inline">Home</span>
          </Link>
        </header>

        {/* Authentication area */}
        <section className="flex flex-1 items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7] shadow-[0_30px_90px_-40px_rgba(31,26,18,0.45)] dark:border-[#302c24] dark:bg-[#1a1712] lg:grid-cols-[0.9fr_1.1fr]">
            {/* Desktop information panel */}
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
                  Customer account
                </p>

                <h1 className="font-display mt-4 max-w-sm text-4xl font-semibold leading-tight xl:text-5xl">
                  Manage every repair request from one secure account.
                </h1>

                <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#c8bead]">
                  Create an account to book repairs, track progress, save
                  addresses and receive service updates.
                </p>
              </div>

              <div className="relative mt-12 space-y-3">
                <FeatureItem text="Track active repair requests" />
                <FeatureItem text="Save addresses for home visits" />
                <FeatureItem text="Receive repair and payment updates" />
              </div>
            </aside>

            {/* Sign-up form */}
            <div className="flex items-center justify-center p-6 sm:p-9 lg:p-12 xl:p-14">
              <div className="w-full max-w-md">
                <div className="lg:hidden">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4cc] text-[#8a6624] dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a] lg:mt-0">
                  Create account
                </p>

                <h2 className="font-display mt-3 text-4xl font-semibold leading-none">
                  Join {settings.shopName}
                </h2>

                <p className="mt-4 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
                  Enter your details to create your customer account.
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
                    mode="signup"
                    disabled={authenticationBusy}
                    onBusyChange={setGoogleLoading}
                    onAuthenticated={handleGoogleAuthenticated}
                  />
                </div>

                <div className="my-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-[#d8cdb6] dark:bg-[#302c24]" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#817867] dark:text-[#928a7d]">
                    Or create with email
                  </span>

                  <span className="h-px flex-1 bg-[#d8cdb6] dark:bg-[#302c24]" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full name */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      Full name
                    </span>

                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={fullName}
                        onChange={(event) => {
                          setFullName(event.target.value);
                          setError("");
                        }}
                        type="text"
                        placeholder="Your full name"
                        autoComplete="name"
                        disabled={authenticationBusy}
                        className="admin-input h-12 pl-11"
                      />
                    </div>
                  </label>

                  {/* Email */}
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
                        className="admin-input h-12 pl-11"
                      />
                    </div>
                  </label>

                  {/* Phone number */}
                  <label className="block">
                    <span className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      <span>Phone number</span>

                      <span className="font-medium text-[#817867] dark:text-[#928a7d]">
                        Optional
                      </span>
                    </span>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={phoneNumber}
                        onChange={(event) => {
                          const value = event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 15);

                          setPhoneNumber(value);
                          setError("");
                        }}
                        type="tel"
                        placeholder="Mobile number"
                        autoComplete="tel"
                        inputMode="numeric"
                        maxLength={15}
                        disabled={authenticationBusy}
                        className="admin-input h-12 pl-11"
                      />
                    </div>
                  </label>

                  {/* Password */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      Password
                    </span>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setError("");
                        }}
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                        disabled={authenticationBusy}
                        className="admin-input h-12 px-11"
                      />

                      <PasswordVisibilityButton
                        visible={showPassword}
                        disabled={authenticationBusy}
                        onClick={() => setShowPassword((current) => !current)}
                      />
                    </div>
                  </label>

                  {/* Confirm password */}
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
                      Confirm password
                    </span>

                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

                      <input
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setError("");
                        }}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        disabled={authenticationBusy}
                        className="admin-input h-12 px-11"
                      />

                      <PasswordVisibilityButton
                        visible={showConfirmPassword}
                        disabled={authenticationBusy}
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={authenticationBusy}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f1a12] px-5 text-sm font-bold text-[#f7f5ef] transition hover:bg-[#33291b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#c9a85f]"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-current border-t-transparent" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-7 border-t border-[#d8cdb6] pt-6 text-center dark:border-[#302c24]">
                  <p className="text-sm font-medium text-[#6f6758] dark:text-[#a8a093]">
                    Already have an account?{" "}
                    <Link
                      to="/sign-in"
                      className="font-bold text-[#8a6624] transition hover:text-[#6f4e12] dark:text-[#d6b46a]"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <p className="mt-6 text-center text-[11px] font-medium leading-5 text-[#817867] dark:text-[#928a7d]">
                  By creating an account, your information can be used for
                  repair bookings and service communication.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
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

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#d6b46a]/15 bg-[#1a1712]/70 px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d6b46a]/10 text-[#d6b46a]">
        <Check className="h-4 w-4" />
      </span>

      <p className="text-xs font-medium text-[#c8bead]">{text}</p>
    </div>
  );
}

function PasswordVisibilityButton({
  visible,
  disabled,
  onClick
}: {
  visible: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#817867] transition hover:bg-[#f2eadb] hover:text-[#1f1a12] disabled:cursor-not-allowed dark:text-[#928a7d] dark:hover:bg-[#242016] dark:hover:text-[#e8e3d8]"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

export default SignUpPage;
