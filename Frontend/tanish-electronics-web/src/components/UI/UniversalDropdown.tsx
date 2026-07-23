import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";

export type DropdownOption<T extends string | number = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type UniversalDropdownProps<T extends string | number> = {
  label?: ReactNode;
  required?: boolean;
  options: DropdownOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
};

function UniversalDropdown<T extends string | number>({
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder = "Select option",
  disabled = false,
  error,
  className = ""
}: UniversalDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const listboxId = useId();

  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const selectedIndex = options.findIndex(
      (option) => option.value === value && !option.disabled
    );

    const firstEnabledIndex = options.findIndex((option) => !option.disabled);

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex);
  }, [open, options, value]);

  function findNextEnabledIndex(currentIndex: number, direction: 1 | -1) {
    if (options.length === 0) return -1;

    let nextIndex = currentIndex;

    for (let attempt = 0; attempt < options.length; attempt++) {
      nextIndex = (nextIndex + direction + options.length) % options.length;

      if (!options[nextIndex].disabled) {
        return nextIndex;
      }
    }

    return currentIndex;
  }

  function selectOption(option: DropdownOption<T>) {
    if (option.disabled) return;

    onChange(option.value);
    setOpen(false);

    window.requestAnimationFrame(() => {
      buttonRef.current?.focus();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightedIndex((currentIndex) =>
        findNextEnabledIndex(currentIndex, 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        return;
      }

      setHighlightedIndex((currentIndex) =>
        findNextEnabledIndex(currentIndex, -1)
      );
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        return;
      }

      const highlightedOption = options[highlightedIndex];

      if (highlightedOption) {
        selectOption(highlightedOption);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }

    if (event.key === "Home" && open) {
      event.preventDefault();

      setHighlightedIndex(options.findIndex((option) => !option.disabled));
    }

    if (event.key === "End" && open) {
      event.preventDefault();

      const reversedIndex = [...options]
        .reverse()
        .findIndex((option) => !option.disabled);

      if (reversedIndex >= 0) {
        setHighlightedIndex(options.length - 1 - reversedIndex);
      }
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-bold text-[#4f4638] dark:text-[#d8cdb6]">
          {label}

          {required && (
            <>
              <span
                aria-hidden="true"
                className="ml-1 font-black text-red-600 dark:text-red-400"
              >
                *
              </span>

              <span className="sr-only"> required</span>
            </>
          )}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={`flex min-h-12 w-full items-center justify-between gap-4 rounded-xl border bg-[#fffaf0] px-4 py-3 text-left text-sm font-bold outline-none transition dark:bg-[#11110f] ${
          error
            ? "border-red-500 focus:ring-4 focus:ring-red-500/10"
            : open
              ? "border-[#d6b46a] ring-4 ring-[#d6b46a]/15"
              : "border-[#d8cdb6] hover:border-[#c8b98f] focus:border-[#d6b46a] focus:ring-4 focus:ring-[#d6b46a]/15 dark:border-[#302c24]"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span
          className={
            selectedOption
              ? "truncate text-[#1f1a12] dark:text-[#e8e3d8]"
              : "truncate text-[#9b907d] dark:text-[#817a6e]"
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDownIcon open={open} />
      </button>

      {open && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-64 overflow-y-auto rounded-xl border border-[#d8cdb6] bg-[#fffdf7] p-1.5 shadow-[0_18px_50px_-20px_rgba(31,26,18,0.45)] dark:border-[#302c24] dark:bg-[#181612] dark:shadow-black/60"
        >
          {options.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm font-semibold text-[#817867] dark:text-[#928a7d]">
              No options available
            </p>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = highlightedIndex === index;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                  className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-left text-sm font-bold transition ${
                    option.disabled
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer"
                  } ${
                    isHighlighted
                      ? "bg-[#f2eadb] text-[#1f1a12] dark:bg-[#29241c] dark:text-[#e8e3d8]"
                      : "text-[#5f574a] dark:text-[#b7afa1]"
                  } ${isSelected ? "text-[#8a6624] dark:text-[#d6b46a]" : ""}`}
                >
                  <span className="truncate">{option.label}</span>

                  {isSelected && <CheckIcon />}
                </button>
              );
            })
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`h-5 w-5 shrink-0 text-[#8a6624] transition-transform duration-200 dark:text-[#d6b46a] ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M5 12.5l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default UniversalDropdown;
