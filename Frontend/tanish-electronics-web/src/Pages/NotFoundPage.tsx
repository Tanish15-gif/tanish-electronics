import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Cog, Home, Search } from "lucide-react";
import { useEffect } from "react";

function NotFoundPage() {
  const location = useLocation();

  const requestedPath = location.pathname || "/";
  const errorCode = buildErrorCode(requestedPath);

  useEffect(() => {
    document.title = "404 | Not found";

    return () => {
      document.title = "Tanish Electronics";
    };
  }, []);

  return (
    <main className="te-sheet-bg relative flex min-h-screen flex-col overflow-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <style>{`
        @keyframes nf-gear-clockwise {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes nf-gear-counter {
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes nf-float {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes nf-pulse {
          0%, 100% {
            opacity: 0.45;
          }

          50% {
            opacity: 1;
          }
        }

        .nf-gear-clockwise {
          animation: nf-gear-clockwise 20s linear infinite;
        }

        .nf-gear-counter {
          animation: nf-gear-counter 16s linear infinite;
        }

        .nf-float {
          animation: nf-float 5s ease-in-out infinite;
        }

        .nf-pulse {
          animation: nf-pulse 2.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .nf-gear-clockwise,
          .nf-gear-counter,
          .nf-float,
          .nf-pulse {
            animation: none;
          }
        }
      `}</style>

      {/* Subtle warm background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgb(214 180 106 / 0.16), transparent 48%)"
        }}
      />

      {/* Decorative gears */}
      <Cog className="nf-gear-clockwise pointer-events-none absolute -left-16 top-[22%] h-52 w-52 text-[#d6b46a]/10 sm:h-72 sm:w-72" />

      <Cog className="nf-gear-counter pointer-events-none absolute -right-20 bottom-[12%] h-64 w-64 text-[#8a6624]/10 dark:text-[#d6b46a]/10 sm:h-80 sm:w-80" />

      <Cog className="nf-gear-counter pointer-events-none absolute right-[16%] top-[16%] h-16 w-16 text-[#d6b46a]/15 sm:h-24 sm:w-24" />

      {/* Header */}
      <header className="relative z-10 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            to="/"
            className="text-sm font-black uppercase tracking-[0.18em] text-[#1f1a12] transition hover:text-[#8a6624] dark:text-[#f7f5ef] dark:hover:text-[#d6b46a]"
          >
            Tanish Electronics
          </Link>

          <span className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#928a7d] sm:flex">
            <span className="nf-pulse h-1.5 w-1.5 rounded-full bg-[#d6b46a]" />
            Route unavailable
          </span>
        </div>
      </header>

      {/* Main 404 */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 text-center sm:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <div className="nf-float relative">
            <p className="relative z-10 mb-5 text-[10px] font-black uppercase tracking-[0.28em] text-[#8a6624] dark:text-[#d6b46a] sm:text-xs">
              Page not found
            </p>

            <h1 className="font-display text-[9rem] font-bold leading-none tracking-[-0.07em] text-[#1f1a12] dark:text-[#f7f5ef] sm:text-[13rem] lg:text-[17rem]">
              404
            </h1>

            <div className="mx-auto mt-8 h-px w-20 bg-[#d6b46a]" />
          </div>
          <h2 className="font-display mt-8 text-2xl font-bold tracking-tight text-[#1f1a12] dark:text-[#f7f5ef] sm:text-3xl">
            This page is missing from the circuit.
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-[#6f6758] dark:text-[#a8a093]">
            The address may be incorrect, or the page may have been moved. Your
            repair information and account remain safe.
          </p>

          {/* Small route information */}
          <div className="mx-auto mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-[#d8cdb6] bg-[#fffaf0]/70 px-4 py-2 font-mono text-[10px] font-bold text-[#928a7d] backdrop-blur dark:border-[#302c24] dark:bg-[#1a1712]/70">
            <span className="max-w-[180px] truncate sm:max-w-[320px]">
              {requestedPath}
            </span>

            <span className="text-[#d6b46a]">•</span>

            <span>{errorCode}</span>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1f1a12] px-6 text-sm font-black text-[#f7f5ef] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#302c24] dark:bg-[#d6b46a] dark:text-[#11110f] dark:hover:bg-[#c9a85f] sm:w-auto"
            >
              <Home className="h-4 w-4" />
              Back to home
            </Link>

            <Link
              to="/track-request"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-6 text-sm font-black text-[#1f1a12] transition hover:-translate-y-0.5 hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016] sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Track a repair
            </Link>
          </div>

          <Link
            to="/book-repair"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-black text-[#8a6624] transition hover:gap-2.5 dark:text-[#d6b46a]"
          >
            Book a repair
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 px-5 pb-7 text-center sm:px-8">
        <p className="text-[11px] font-semibold text-[#928a7d]">
          Tanish Electronics · Service &amp; repair
        </p>
      </footer>
    </main>
  );
}

function buildErrorCode(path: string) {
  let hash = 0;

  for (let index = 0; index < path.length; index += 1) {
    hash = (hash * 31 + path.charCodeAt(index)) >>> 0;
  }

  const code = (hash % 9000) + 1000;

  return `ERR-${code}`;
}

export default NotFoundPage;
