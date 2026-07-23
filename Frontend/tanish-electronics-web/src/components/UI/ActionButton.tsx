import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: "dark" | "gold" | "light" | "outline";
  fullWidth?: boolean;
  spinnerOnly?: boolean;
};

function ActionButton({
  loading = false,
  loadingText,
  children,
  variant = "dark",
  fullWidth = true,
  spinnerOnly = false,
  disabled,
  className = "",
  ...props
}: ActionButtonProps) {
  const baseClass =
    "inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-70";

  const widthClass = fullWidth ? "w-full" : "";

  const variantClass =
    variant === "gold"
      ? "bg-[#d6b46a] text-[#11110f] hover:bg-[#c9a85f]"
      : variant === "light"
        ? "border border-[#d8cdb6] bg-[#e8e3d8] text-[#11110f] hover:bg-[#d6b46a] dark:border-[#302c24] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]"
        : variant === "outline"
          ? "border border-[#d8cdb6] bg-transparent text-[#1f1a12] hover:bg-[#fffaf0] dark:border-[#302c24] dark:text-[#e8e3d8] dark:hover:bg-[#1a1712]"
          : "bg-[#1f1a12] text-[#f7f5ef] hover:bg-[#33291b] dark:bg-[#e8e3d8] dark:text-[#11110f] dark:hover:bg-[#d6b46a]";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClass} ${widthClass} ${variantClass} ${className}`}
    >
      {loading ? (
        <>
          <ButtonSpinner />

          {!spinnerOnly && <span>{loadingText || ""}</span>}
        </>
      ) : (
        <span>{children}</span>
      )}
    </button>
  );
}

function ButtonSpinner() {
  return (
    <span className="h-5 w-5 animate-spin-fast rounded-full border-2 border-current border-t-transparent" />
  );
}

export default ActionButton;
