import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CustomAuthProvider>
      <App />
    </CustomAuthProvider>
  </StrictMode>
);

