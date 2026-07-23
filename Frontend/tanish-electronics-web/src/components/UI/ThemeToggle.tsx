import { useEffect, useState } from "react";

function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");

    if (nextDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    setIsDark(nextDark);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center cursor-pointer rounded-xl border border-slate-300 bg-white text-slate-950 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-yellow-300 dark:hover:bg-slate-800"
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1Zm0-20a1 1 0 0 1 1-1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1 1Zm10 10a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1ZM2 12a1 1 0 0 1 1-1v0a1 1 0 1 1 0 2v0a1 1 0 0 1-1-1Zm16.95 6.536a1 1 0 0 1 1.414 0v0a1 1 0 1 1-1.414 1.414v0a1 1 0 0 1 0-1.414ZM3.636 5.05A1 1 0 0 1 5.05 3.636v0A1 1 0 1 1 3.636 5.05v0Zm15.314-1.414a1 1 0 0 1 1.414 1.414v0A1 1 0 1 1 18.95 3.636v0ZM3.636 18.95a1 1 0 0 1 1.414-1.414v0A1 1 0 1 1 3.636 18.95v0Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3c0 .34-.02.67-.02 1a7 7 0 0 0 7 7c.33 0 .66-.02 1-.06.28-.03.55-.08.81-.15Z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
