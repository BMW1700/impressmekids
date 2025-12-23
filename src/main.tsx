import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { setupGlobalErrorHandler } from "./lib/globalErrorHandler";
import ErrorBoundary from "./components/error/ErrorBoundary";

// Initialize Sentry for error monitoring
initSentry();

// Set up global error handlers for uncaught errors
setupGlobalErrorHandler();

// Listen for Service Worker updates and reload gracefully
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATED") {
      // Prevent reload loops: only reload once per session (and not more than once per minute)
      try {
        const key = "sw_updated_reload_at";
        const last = Number(sessionStorage.getItem(key) || "0");
        const now = Date.now();
        if (now - last < 60_000) return;
        sessionStorage.setItem(key, String(now));
      } catch {
        // If sessionStorage is blocked, fall back to a single in-memory guard
        (window as any).__swReloaded = (window as any).__swReloaded ?? false;
        if ((window as any).__swReloaded) return;
        (window as any).__swReloaded = true;
      }

      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
