import { useEffect, useState, type SVGProps } from "react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ease-out
        border-[#d6dbe1] bg-white hover:bg-[#f5f7f9] active:scale-95
        dark:border-[#2b2e36] dark:bg-[#14161b] dark:hover:bg-[#1b1e24]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#33404f]/40 dark:focus-visible:ring-[#d6b46a]/50"
    >
      <SunGlyph
        className={`absolute h-[18px] w-[18px] text-[#33404f] transition-all duration-300 ease-out ${
          isDark
            ? "scale-50 rotate-45 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
      />
      <MoonGlyph
        className={`absolute h-4 w-4 text-[#d6b46a] transition-all duration-300 ease-out ${
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-50 -rotate-45 opacity-0"
        }`}
      />
    </button>
  );
}

function SunGlyph({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.55 1.55M18.25 18.25l1.55 1.55M2 12h2.2M19.8 12H22M4.2 19.8l1.55-1.55M18.25 5.75l1.55-1.55" />
    </svg>
  );
}

function MoonGlyph({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.4 14.9c-1.1.4-2.2.6-3.4.6-5 0-9-4-9-9 0-1.2.2-2.3.6-3.4C4.5 4.4 2 8 2 12.2 2 17.6 6.4 22 11.8 22c4.2 0 7.8-2.5 9.4-6.1-.3 0-.5.1-.8.1-.4 0-.7 0-1-.1Z" />
    </svg>
  );
}

export default ThemeToggle;
