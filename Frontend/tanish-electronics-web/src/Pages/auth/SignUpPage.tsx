import { SignUp } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function SignUpPage() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });

    return () => observer.disconnect();
  }, []);

  const cardBackground = isDark ? "#1a1712" : "#fffdf7";
  const pageText = isDark ? "#e8e3d8" : "#1f1a12";
  const mutedText = isDark ? "#a8a093" : "#6f6758";
  const inputBackground = isDark ? "#11110f" : "#fffaf0";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5ef] text-[#1f1a12] dark:bg-[#11110f] dark:text-[#e8e3d8]">
      <title>Sign Up</title>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#d6b46a]/20 blur-3xl dark:bg-[#d6b46a]/10" />
        <div className="absolute bottom-0 left-10 h-[300px] w-[300px] rounded-full bg-[#6f5a33]/10 blur-3xl dark:bg-[#6f5a33]/20" />
        <div className="absolute right-10 top-32 h-[300px] w-[300px] rounded-full bg-[#d6b46a]/10 blur-3xl dark:bg-[#6f5a33]/20" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f1a12] text-sm font-black text-[#f7f5ef] dark:bg-[#e8e3d8] dark:text-[#11110f]">
              TE
            </div>

            <div>
              <h1 className="text-xl font-bold leading-none">
                Tanish Electronics
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093]">
                Repair & Sales
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="rounded-2xl border border-[#d8cdb6] bg-[#fffaf0] px-5 py-3 text-sm font-black text-[#1f1a12] transition hover:bg-[#f2eadb] dark:border-[#302c24] dark:bg-[#1a1712] dark:text-[#e8e3d8] dark:hover:bg-[#242016]"
          >
            Home
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-[470px]">
            <SignUp
              key={isDark ? "dark-signup" : "light-signup"}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              forceRedirectUrl="/auth/redirect"
              fallbackRedirectUrl="/auth/redirect"
              appearance={{
                variables: {
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  colorPrimary: "#d6b46a",
                  colorDanger: "#ef4444",
                  colorBackground: cardBackground,
                  colorText: pageText,
                  colorTextSecondary: mutedText,
                  colorInputBackground: inputBackground,
                  colorInputText: pageText,
                  borderRadius: "18px"
                },
                elements: {
                  rootBox: "w-full",

                  cardBox: `!w-full !overflow-hidden !rounded-[2rem] !border !shadow-2xl !shadow-black/20 ${
                    isDark
                      ? "!border-[#302c24] !bg-[#1a1712]"
                      : "!border-[#d8cdb6] !bg-[#fffdf7]"
                  }`,

                  card: `!rounded-none !border-0 !shadow-none ${
                    isDark ? "!bg-[#1a1712]" : "!bg-[#fffdf7]"
                  }`,

                  main: isDark ? "!bg-[#1a1712]" : "!bg-[#fffdf7]",
                  header: isDark ? "!bg-[#1a1712]" : "!bg-[#fffdf7]",

                  headerTitle: `!text-3xl !font-bold ${
                    isDark ? "!text-[#e8e3d8]" : "!text-[#1f1a12]"
                  }`,

                  headerSubtitle: `!font-semibold ${
                    isDark ? "!text-[#a8a093]" : "!text-[#6f6758]"
                  }`,

                  socialButtonsBlockButton: `!border !shadow-none ${
                    isDark
                      ? "!border-[#302c24] !bg-[#11110f] !text-[#e8e3d8] hover:!bg-[#242016]"
                      : "!border-[#d8cdb6] !bg-[#fffaf0] !text-[#1f1a12] hover:!bg-[#f2eadb]"
                  }`,

                  socialButtonsBlockButtonText: `!font-bold ${
                    isDark ? "!text-[#e8e3d8]" : "!text-[#1f1a12]"
                  }`,

                  dividerLine: isDark ? "!bg-[#302c24]" : "!bg-[#d8cdb6]",

                  dividerText: isDark ? "!text-[#a8a093]" : "!text-[#6f6758]",

                  formFieldLabel: `!font-bold ${
                    isDark ? "!text-[#e8e3d8]" : "!text-[#1f1a12]"
                  }`,

                  formFieldInput: `!border ${
                    isDark
                      ? "!border-[#302c24] !bg-[#11110f] !text-[#e8e3d8] placeholder:!text-[#8f8778] focus:!border-[#d6b46a]"
                      : "!border-[#d8cdb6] !bg-[#fffaf0] !text-[#1f1a12] placeholder:!text-[#9b907d] focus:!border-[#d6b46a]"
                  }`,

                  formButtonPrimary:
                    "!bg-[#d6b46a] !text-[#11110f] !shadow-none hover:!bg-[#c9a85f]",

                  footer: `!m-0 !rounded-none !border-t ${
                    isDark
                      ? "!border-[#302c24] !bg-[#1a1712]"
                      : "!border-[#d8cdb6] !bg-[#fffdf7]"
                  }`,

                  footerAction: `!m-0 !border-0 !shadow-none ${
                    isDark ? "!bg-[#1a1712]" : "!bg-[#fffdf7]"
                  }`,

                  footerActionText: isDark
                    ? "!text-[#a8a093]"
                    : "!text-[#6f6758]",

                  footerActionLink:
                    "!font-bold !text-[#8a6624] hover:!text-[#6f4e12]",

                  footerPages: `!m-0 !rounded-none !rounded-b-[2rem] !border-t ${
                    isDark
                      ? "!border-[#302c24] !bg-[#1a1712]"
                      : "!border-[#d8cdb6] !bg-[#fffdf7]"
                  }`,

                  footerPagesLink: "!text-[#8a6624]",
                  footerPagesLogo: isDark
                    ? "!text-[#a8a093]"
                    : "!text-[#6f6758]",

                  formFieldInputShowPasswordButton: isDark
                    ? "!text-[#a8a093]"
                    : "!text-[#6f6758]",

                  alternativeMethodsBlockButton: "!font-bold !text-[#8a6624]"
                }
              }}
            />
          </div>
        </section>

        <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm font-semibold text-[#6f6758] dark:text-[#a8a093] sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Tanish Electronics</p>

          <div className="flex items-center gap-5">
            <Link
              to="/products"
              className="hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              Products
            </Link>
            <Link
              to="/book-repair"
              className="hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              Book Repair
            </Link>
            <Link
              to="/track-request"
              className="hover:text-[#8a6624] dark:hover:text-[#d6b46a]"
            >
              Track Request
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default SignUpPage;
