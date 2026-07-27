import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode
} from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import ActionButton from "../../components/UI/ActionButton";
import {
  requestForgotPasswordOtp,
  resetPassword,
  verifyForgotPasswordOtp
} from "../../Services/customAuthService";

type ForgotPasswordStep = "email" | "otp" | "password" | "success";

type BusyAction = "request" | "verify" | "resend" | "reset" | null;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [step, setStep] = useState<ForgotPasswordStep>("email");

  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  const [email, setEmail] = useState("");

  const [otpDigits, setOtpDigits] = useState<string[]>(createEmptyOtp());

  const [resetToken, setResetToken] = useState("");
  const [resetTokenSeconds, setResetTokenSeconds] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resendSeconds, setResendSeconds] = useState(0);

  const [error, setError] = useState("");
  const [information, setInformation] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const otpCode = otpDigits.join("");
  const busy = busyAction !== null;

  useEffect(() => {
    const previousTitle = document.title;

    document.title = "Reset Password | Tanish Electronics";

    return () => {
      document.title = previousTitle;
    };
  }, []);

  /*
   * Resend countdown.
   */
  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [resendSeconds]);

  /*
   * Reset-token countdown.
   */
  useEffect(() => {
    if (step !== "password" || !resetToken || resetTokenSeconds <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setResetTokenSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [step, resetToken, resetTokenSeconds]);

  /*
   * Move back to OTP verification when the
   * temporary reset token expires.
   */
  useEffect(() => {
    if (step !== "password" || !resetToken || resetTokenSeconds > 0) {
      return;
    }

    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setInformation("");
    setError(
      "Your secure reset session expired. Request or verify a new code."
    );

    setStep("otp");
  }, [step, resetToken, resetTokenSeconds]);

  async function handleRequestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setBusyAction("request");
      clearMessages();

      const response = await requestForgotPasswordOtp({
        email: normalizedEmail
      });

      setEmail(normalizedEmail);
      setOtpDigits(createEmptyOtp());

      clearResetSession();

      setInformation(response.message);
      setRequestSubmitted(true);
      setResendSeconds(RESEND_SECONDS);
    } catch (caughtError) {
      setRequestSubmitted(false);
      setInformation("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send the reset code."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setError("Enter the complete six-digit verification code.");
      return;
    }

    try {
      setBusyAction("verify");
      clearMessages();

      const response = await verifyForgotPasswordOtp({
        email: email.trim().toLowerCase(),
        code: otpCode
      });

      if (!response.resetToken) {
        throw new Error("The server did not return a password reset token.");
      }

      setResetToken(response.resetToken);

      setResetTokenSeconds(Math.max(1, Number(response.expiresInSeconds) || 1));

      setOtpDigits(createEmptyOtp());

      setInformation(
        "Code verified. Create your new password before this secure session expires."
      );

      setStep("password");

      window.requestAnimationFrame(() => {
        document.getElementById("new-password")?.focus();
      });
    } catch (caughtError) {
      setError(
        getErrorMessage(
          caughtError,
          "The verification code is invalid or has expired."
        )
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    if (!resetToken || resetTokenSeconds <= 0) {
      setError(
        "Your secure reset session has expired. Verify a new code first."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setBusyAction("reset");
      clearMessages();

      const response = await resetPassword({
        resetToken,
        newPassword
      });

      setSuccessMessage(
        response.message || "Your password was updated successfully."
      );

      setEmail("");
      setRequestSubmitted(false);
      setOtpDigits(createEmptyOtp());

      clearResetSession();

      setStep("success");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Unable to reset your password."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleResendOtp() {
    if (busy || resendSeconds > 0) {
      return;
    }

    try {
      setBusyAction("resend");
      clearMessages();

      const response = await requestForgotPasswordOtp({
        email: email.trim().toLowerCase()
      });

      setOtpDigits(createEmptyOtp());

      clearResetSession();

      setInformation(response.message);
      setResendSeconds(RESEND_SECONDS);
      setStep("otp");

      focusFirstOtpInput();
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError, "Unable to resend the verification code.")
      );
    } finally {
      setBusyAction(null);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (busy) {
      return;
    }

    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpDigits((current) => {
      const next = [...current];

      next[index] = digit;

      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }

    setError("");
  }

  function handleOtpKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      event.preventDefault();

      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();

      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();

      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    if (busy) {
      return;
    }

    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedCode) {
      return;
    }

    const nextDigits = createEmptyOtp();

    pastedCode.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setOtpDigits(nextDigits);
    setError("");

    const focusIndex = Math.min(pastedCode.length, OTP_LENGTH - 1);

    otpInputRefs.current[focusIndex]?.focus();
  }

  function returnToEmailStep() {
    if (busy) {
      return;
    }

    setStep("email");
    setRequestSubmitted(false);
    setOtpDigits(createEmptyOtp());
    setResendSeconds(0);

    clearResetSession();
    clearMessages();
  }

  function continueToOtpStep() {
    if (busy || !requestSubmitted) {
      return;
    }

    setError("");
    setStep("otp");
    focusFirstOtpInput();
  }

  function tryAnotherEmail() {
    if (busy) {
      return;
    }

    setRequestSubmitted(false);
    setEmail("");
    setOtpDigits(createEmptyOtp());
    setResendSeconds(0);

    clearResetSession();
    clearMessages();

    window.requestAnimationFrame(() => {
      document.getElementById("forgot-email")?.focus();
    });
  }

  function returnToOtpStep() {
    if (busy) {
      return;
    }

    clearResetSession();

    setInformation("");
    setError("");
    setStep("otp");

    focusFirstOtpInput();
  }

  function clearResetSession() {
    setResetToken("");
    setResetTokenSeconds(0);

    setNewPassword("");
    setConfirmPassword("");

    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }

  function clearMessages() {
    setError("");
    setInformation("");
  }

  function focusFirstOtpInput() {
    window.requestAnimationFrame(() => {
      otpInputRefs.current[0]?.focus();
    });
  }

  return (
    <main
      className="te-sheet-bg relative min-h-screen overflow-hidden px-4 py-5 text-[#1f1a12] dark:text-[#e8e3d8] sm:px-6 sm:py-7 lg:px-8"
      style={{
        fontFamily: "var(--font-ui)"
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 14% 14%, rgb(214 180 106 / 0.16), transparent 27%), radial-gradient(circle at 86% 86%, rgb(111 90 51 / 0.11), transparent 30%)"
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="Go to Tanish Electronics home"
            className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/25"
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
            to="/sign-in"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cdb6] bg-[#fffaf0]/85 px-3 text-xs font-bold shadow-sm backdrop-blur transition hover:border-[#d6b46a] hover:bg-[#fff4cc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b46a]/20 dark:border-[#302c24] dark:bg-[#1a1712]/85 dark:hover:border-[#d6b46a]/50 dark:hover:bg-[#242016] sm:px-4 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">Back to sign in</span>

            <span className="sm:hidden">Sign in</span>
          </Link>
        </header>

        <section className="flex flex-1 items-center py-7 sm:py-9 lg:py-11">
          <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#d8cdb6] bg-[#fffdf7]/95 shadow-[0_32px_100px_-46px_rgba(31,26,18,0.52)] backdrop-blur dark:border-[#302c24] dark:bg-[#1a1712]/95 lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr]">
            <RecoverySidePanel />

            <div className="flex items-center justify-center p-6 sm:p-9 lg:p-12 xl:p-14">
              <div className="w-full max-w-md">
                <RecoveryProgress step={step} />

                {step === "email" && (
                  <EmailStep
                    email={email}
                    loading={busyAction === "request"}
                    requestSubmitted={requestSubmitted}
                    error={error}
                    information={information}
                    onEmailChange={(value) => {
                      setEmail(value);
                      setError("");
                      setInformation("");
                      setRequestSubmitted(false);
                    }}
                    onContinue={continueToOtpStep}
                    onTryAnother={tryAnotherEmail}
                    onSubmit={handleRequestOtp}
                  />
                )}

                {step === "otp" && (
                  <OtpStep
                    email={email}
                    otpDigits={otpDigits}
                    otpInputRefs={otpInputRefs}
                    verifying={busyAction === "verify"}
                    resending={busyAction === "resend"}
                    busy={busy}
                    resendSeconds={resendSeconds}
                    error={error}
                    information={information}
                    onOtpChange={handleOtpChange}
                    onOtpKeyDown={handleOtpKeyDown}
                    onOtpPaste={handleOtpPaste}
                    onSubmit={handleVerifyOtp}
                    onResend={handleResendOtp}
                    onChangeEmail={returnToEmailStep}
                  />
                )}

                {step === "password" && (
                  <PasswordStep
                    email={email}
                    newPassword={newPassword}
                    confirmPassword={confirmPassword}
                    showNewPassword={showNewPassword}
                    showConfirmPassword={showConfirmPassword}
                    resetTokenSeconds={resetTokenSeconds}
                    loading={busyAction === "reset"}
                    error={error}
                    information={information}
                    onNewPasswordChange={(value) => {
                      setNewPassword(value);
                      setError("");
                    }}
                    onConfirmPasswordChange={(value) => {
                      setConfirmPassword(value);
                      setError("");
                    }}
                    onToggleNewPassword={() =>
                      setShowNewPassword((current) => !current)
                    }
                    onToggleConfirmPassword={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    onSubmit={handleResetPassword}
                    onBack={returnToOtpStep}
                  />
                )}

                {step === "success" && (
                  <SuccessStep
                    message={successMessage}
                    onSignIn={() =>
                      navigate("/sign-in", {
                        replace: true
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 pb-1 text-center text-[11px] font-medium text-[#817867] dark:text-[#928a7d] sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} Tanish Electronics</p>

          <p>Secure account recovery</p>
        </footer>
      </div>
    </main>
  );
}

function RecoverySidePanel() {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[#302c24] bg-[#1f1a12] p-10 text-[#f7f5ef] lg:flex lg:flex-col lg:justify-between xl:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#d6b46a 1px, transparent 1px), linear-gradient(90deg, #d6b46a 1px, transparent 1px)",
          backgroundSize: "38px 38px"
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#d6b46a]/10 blur-3xl"
      />

      <div className="relative">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d6b46a]/30 bg-[#d6b46a]/10 text-[#d6b46a]">
          <ShieldCheck className="h-5 w-5" />
        </span>

        <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6b46a]">
          Secure account recovery
        </p>

        <h1 className="font-display mt-4 max-w-md text-4xl font-semibold leading-[1.08] xl:text-5xl">
          Recover access without losing your service history.
        </h1>

        <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#c8bead]">
          Your email code is verified first. A short-lived reset session is then
          created before your password can be changed.
        </p>
      </div>

      <div className="relative mt-12 space-y-3">
        <RecoveryFeature text="Email ownership verification" />

        <RecoveryFeature text="Short-lived secure reset token" />

        <RecoveryFeature text="Password changed only after verification" />
      </div>
    </aside>
  );
}

function RecoveryFeature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#d6b46a]/15 bg-[#1a1712]/75 px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d6b46a]/10 text-[#d6b46a]">
        <Check className="h-4 w-4" />
      </span>

      <p className="text-xs font-medium text-[#c8bead]">{text}</p>
    </div>
  );
}

function RecoveryProgress({ step }: { step: ForgotPasswordStep }) {
  const activeIndex =
    step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  const items = [
    {
      label: "Email",
      number: "1"
    },
    {
      label: "Verify",
      number: "2"
    },
    {
      label: "Password",
      number: "3"
    },
    {
      label: "Done",
      number: "4"
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center">
        {items.map((item, index) => {
          const completed = index < activeIndex;

          const active = index === activeIndex;

          return (
            <div
              key={item.label}
              className={`flex items-center ${
                index < items.length - 1 ? "flex-1" : ""
              }`}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                    completed || active
                      ? "border-[#8a6624] bg-[#8a6624] text-white dark:border-[#d6b46a] dark:bg-[#d6b46a] dark:text-[#11110f]"
                      : "border-[#d8cdb6] bg-[#fffaf0] text-[#817867] dark:border-[#302c24] dark:bg-[#11110f] dark:text-[#928a7d]"
                  }`}
                >
                  {completed ? <Check className="h-4 w-4" /> : item.number}
                </span>

                <span
                  className={`mt-2 text-[9px] font-bold uppercase tracking-[0.08em] sm:text-[10px] ${
                    completed || active
                      ? "text-[#8a6624] dark:text-[#d6b46a]"
                      : "text-[#928a7d]"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {index < items.length - 1 && (
                <span
                  className={`mx-2 mb-5 h-px flex-1 sm:mx-3 ${
                    index < activeIndex
                      ? "bg-[#8a6624] dark:bg-[#d6b46a]"
                      : "bg-[#d8cdb6] dark:bg-[#302c24]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type EmailStepProps = {
  email: string;
  loading: boolean;
  requestSubmitted: boolean;
  error: string;
  information: string;
  onEmailChange: (value: string) => void;
  onContinue: () => void;
  onTryAnother: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function EmailStep({
  email,
  loading,
  requestSubmitted,
  error,
  information,
  onEmailChange,
  onContinue,
  onTryAnother,
  onSubmit
}: EmailStepProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <StepLabel>Account recovery</StepLabel>

      <h2 className="font-display mt-3 text-4xl font-semibold leading-none">
        Forgot your password?
      </h2>

      <p className="mt-4 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        Enter the email connected to your account. We will send a six-digit
        verification code.
      </p>

      <label className="mt-7 block" htmlFor="forgot-email">
        <span className="mb-2 block text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
          Email address
        </span>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            disabled={loading || requestSubmitted}
            className="admin-input h-12 pl-11"
          />

          {requestSubmitted && (
            <CheckCircle2 className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600 dark:text-emerald-300" />
          )}
        </div>
      </label>

      <AuthMessage type="error" message={error} />
      <AuthMessage type="information" message={information} />

      {!requestSubmitted && (
        <ActionButton
          type="submit"
          loading={loading}
          spinnerOnly
          variant="dark"
          className="mt-6 min-h-14"
        >
          Send reset code
        </ActionButton>
      )}

      {requestSubmitted && (
        <div className="mt-6 space-y-3">
          <ActionButton
            type="button"
            onClick={onContinue}
            variant="dark"
            className="min-h-14"
          >
            I received a code
          </ActionButton>

          <ActionButton
            type="button"
            onClick={onTryAnother}
            variant="outline"
            className="min-h-12"
          >
            Try another email
          </ActionButton>
        </div>
      )}

      <p className="mt-6 text-center text-sm font-medium text-[#6f6758] dark:text-[#a8a093]">
        Remembered your password?{" "}
        <Link
          to="/sign-in"
          className="font-bold text-[#8a6624] transition hover:text-[#6f4e12] dark:text-[#d6b46a]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

type OtpStepProps = {
  email: string;
  otpDigits: string[];

  otpInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;

  verifying: boolean;
  resending: boolean;
  busy: boolean;

  resendSeconds: number;

  error: string;
  information: string;

  onOtpChange: (index: number, value: string) => void;

  onOtpKeyDown: (index: number, event: KeyboardEvent<HTMLInputElement>) => void;

  onOtpPaste: (event: ClipboardEvent<HTMLInputElement>) => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  onResend: () => void;
  onChangeEmail: () => void;
};

function OtpStep({
  email,
  otpDigits,
  otpInputRefs,
  verifying,
  resending,
  busy,
  resendSeconds,
  error,
  information,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onSubmit,
  onResend,
  onChangeEmail
}: OtpStepProps) {
  return (
    <form onSubmit={onSubmit}>
      <StepLabel>Verify your email</StepLabel>

      <h2 className="font-display mt-3 text-4xl font-semibold leading-none">
        Enter the six-digit code
      </h2>

      <p className="mt-4 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        We sent a verification code to{" "}
        <span className="break-all font-bold text-[#1f1a12] dark:text-[#e8e3d8]">
          {email}
        </span>
        .
      </p>

      <button
        type="button"
        onClick={onChangeEmail}
        disabled={busy}
        className="mt-2 text-xs font-bold text-[#8a6624] transition hover:text-[#6f4e12] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#d6b46a]"
      >
        Use a different email
      </button>

      <fieldset className="mt-7" disabled={busy}>
        <legend className="text-xs font-bold text-[#4f4638] dark:text-[#d8cdb6]">
          Verification code
        </legend>

        <div className="mt-3 grid grid-cols-6 gap-2 sm:gap-3">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                otpInputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(event) => onOtpChange(index, event.target.value)}
              onKeyDown={(event) => onOtpKeyDown(index, event)}
              onPaste={onOtpPaste}
              aria-label={`Verification digit ${index + 1}`}
              className="aspect-square min-w-0 rounded-xl border border-[#d8cdb6] bg-[#fffaf0] text-center text-lg font-bold outline-none transition focus:border-[#8a6624] focus:ring-4 focus:ring-[#d6b46a]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#302c24] dark:bg-[#11110f] dark:focus:border-[#d6b46a] sm:text-xl"
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-col gap-3 text-xs font-medium sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[#817867] dark:text-[#928a7d]">
          Code expires after 10 minutes
        </span>

        <ActionButton
          type="button"
          onClick={onResend}
          loading={resending}
          spinnerOnly
          disabled={resendSeconds > 0 || verifying}
          fullWidth={false}
          variant="outline"
          className="!min-h-9 !min-w-[120px] !rounded-xl !px-3 !py-2 !text-xs"
        >
          {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
        </ActionButton>
      </div>

      <AuthMessage type="information" message={information} />

      <AuthMessage type="error" message={error} />

      <ActionButton
        type="submit"
        loading={verifying}
        spinnerOnly
        disabled={resending}
        variant="dark"
        className="mt-6 min-h-14"
      >
        Verify code
      </ActionButton>
    </form>
  );
}

type PasswordStepProps = {
  email: string;

  newPassword: string;
  confirmPassword: string;

  showNewPassword: boolean;
  showConfirmPassword: boolean;

  resetTokenSeconds: number;
  loading: boolean;

  error: string;
  information: string;

  onNewPasswordChange: (value: string) => void;

  onConfirmPasswordChange: (value: string) => void;

  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  onBack: () => void;
};

function PasswordStep({
  email,
  newPassword,
  confirmPassword,
  showNewPassword,
  showConfirmPassword,
  resetTokenSeconds,
  loading,
  error,
  information,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSubmit,
  onBack
}: PasswordStepProps) {
  return (
    <form onSubmit={onSubmit}>
      <StepLabel>Email verified</StepLabel>

      <h2 className="font-display mt-3 text-4xl font-semibold leading-none">
        Create a new password
      </h2>

      <p className="mt-4 text-sm font-medium leading-6 text-[#6f6758] dark:text-[#a8a093]">
        You verified{" "}
        <span className="break-all font-bold text-[#1f1a12] dark:text-[#e8e3d8]">
          {email}
        </span>
        . Complete the reset before the secure session expires.
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#d6b46a]/35 bg-[#fff8e7] px-4 py-3 dark:border-[#d6b46a]/20 dark:bg-[#d6b46a]/10">
        <span className="text-xs font-semibold text-[#765313] dark:text-[#d6b46a]">
          Secure reset session
        </span>

        <span className="font-mono text-xs font-bold text-[#765313] dark:text-[#d6b46a]">
          {formatSeconds(resetTokenSeconds)}
        </span>
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="mt-3 text-xs font-bold text-[#8a6624] transition hover:text-[#6f4e12] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#d6b46a]"
      >
        Verify another code
      </button>

      <div className="mt-7 space-y-5">
        <PasswordField
          id="new-password"
          label="New password"
          value={newPassword}
          visible={showNewPassword}
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          disabled={loading}
          onChange={onNewPasswordChange}
          onToggle={onToggleNewPassword}
        />

        <PasswordField
          id="confirm-new-password"
          label="Confirm new password"
          value={confirmPassword}
          visible={showConfirmPassword}
          autoComplete="new-password"
          placeholder="Enter the password again"
          disabled={loading}
          onChange={onConfirmPasswordChange}
          onToggle={onToggleConfirmPassword}
        />
      </div>

      <AuthMessage type="information" message={information} />

      <AuthMessage type="error" message={error} />

      <ActionButton
        type="submit"
        loading={loading}
        spinnerOnly
        variant="dark"
        className="mt-6 min-h-14"
      >
        Reset password
      </ActionButton>
    </form>
  );
}

function SuccessStep({
  message,
  onSignIn
}: {
  message: string;
  onSignIn: () => void;
}) {
  return (
    <section className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
        <CheckCircle2 className="h-8 w-8" />
      </span>

      <StepLabel className="mt-7">Password updated</StepLabel>

      <h2 className="font-display mt-3 text-4xl font-semibold leading-none">
        Your account is ready
      </h2>

      <p className="mx-auto mt-5 max-w-sm text-sm font-medium leading-7 text-[#6f6758] dark:text-[#a8a093]">
        {message || "Your password was updated successfully."}
      </p>

      <ActionButton
        type="button"
        onClick={onSignIn}
        variant="dark"
        className="mt-8 min-h-14"
      >
        Continue to sign in
      </ActionButton>
    </section>
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
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817867] dark:text-[#928a7d]" />

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          className="admin-input h-12 px-11"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
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

function AuthMessage({
  type,
  message
}: {
  type: "error" | "information";
  message: string;
}) {
  if (!message) {
    return null;
  }

  const className =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
      : "border-[#d6b46a]/40 bg-[#fff8e7] text-[#765313] dark:border-[#d6b46a]/20 dark:bg-[#d6b46a]/10 dark:text-[#d6b46a]";

  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={`mt-5 rounded-xl border px-4 py-3 text-xs font-semibold leading-5 ${className}`}
    >
      {message}
    </p>
  );
}

function StepLabel({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6624] dark:text-[#d6b46a] ${className}`}
    >
      {children}
    </p>
  );
}

function createEmptyOtp() {
  return Array<string>(OTP_LENGTH).fill("");
}

function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);

  const minutes = Math.floor(safeSeconds / 60);

  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default ForgotPasswordPage;
