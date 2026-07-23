import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.tsx";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

if (savedTheme === "light") {
  document.documentElement.classList.remove("dark");
}

if (!savedTheme) {
  document.documentElement.classList.add("dark");
  localStorage.setItem("theme", "dark");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          colorPrimary: "#d6b46a",
          colorBackground: "#fffdf7",
          colorText: "#11110f",
          colorTextSecondary: "#6f6758",
          colorInputBackground: "#fffaf0",
          colorInputText: "#11110f",
          colorNeutral: "#6f6758",
          borderRadius: "1rem",
          fontFamily: 'Georgia, "Times New Roman", serif'
        },
        elements: {
          card: "bg-[#fffdf7] text-[#11110f]",
          cardBox: "bg-[#fffdf7] shadow-2xl shadow-black/10",
          headerTitle: "text-[#11110f]",
          headerSubtitle: "text-[#6f6758]",

          navbar: "bg-[#f7f5ef]",
          navbarButton:
            "text-[#4f4638] hover:bg-[#e8e3d8] hover:text-[#11110f]",
          navbarButton__active: "bg-[#e8e3d8] text-[#11110f] font-black",

          profileSectionTitleText: "text-[#11110f]",
          profileSectionContent: "text-[#11110f]",
          formFieldLabel: "text-[#11110f]",
          formFieldInput:
            "bg-[#fffaf0] text-[#11110f] border-[#d8cdb6] focus:border-[#d6b46a]",
          formButtonPrimary: "bg-[#1f1a12] text-[#f7f5ef] hover:bg-[#33291b]",

          badge: "bg-[#e8e3d8] text-[#11110f] border border-[#d8cdb6]",
          footerActionText: "text-[#6f6758]",
          footerActionLink: "text-[#8a6624] hover:text-[#11110f]"
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);
