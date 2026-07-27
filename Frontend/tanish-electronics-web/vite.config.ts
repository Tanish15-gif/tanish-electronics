import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: "0.0.0.0",

    allowedHosts: ["arbitrary-drank-jeep.ngrok-free.dev", ".ngrok-free.dev"],

    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    },

    proxy: {
      "/api": {
        target: "http://localhost:5229",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, "")
      },

      "/hubs": {
        target: "http://localhost:5229",
        changeOrigin: true,
        secure: false,
        ws: true
      },

      "/uploads": {
        target: "http://localhost:5229",
        changeOrigin: true,
        secure: false
      }
    }
  },

  preview: {
    host: "0.0.0.0",
    port: 4173,

    allowedHosts: ["arbitrary-drank-jeep.ngrok-free.dev", ".ngrok-free.dev"],

    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    },

    proxy: {
      "/api": {
        target: "http://localhost:5229",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, "")
      },

      "/hubs": {
        target: "http://localhost:5229",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
