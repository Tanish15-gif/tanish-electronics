import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";
import App from "./App.tsx";
import { CustomAuthProvider } from "./contexts/CustomAuthContext.tsx";

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

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  throw new Error("VITE_GOOGLE_CLIENT_ID is missing.");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <CustomAuthProvider>
        <App />
      </CustomAuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);

