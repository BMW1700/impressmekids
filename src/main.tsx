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

// Guard against runaway history.replaceState loops (prevents blank-screen crash)
// Some browsers throw a SecurityError if replaceState is called >100 times / 10s.
(() => {
  const original = window.history.replaceState;
  const windowMs = 10_000;
  const maxCalls = 90; // stay under browser threshold
  let timestamps: number[] = [];

  window.history.replaceState = function (...args: any[]) {
    const now = Date.now();
    timestamps = timestamps.filter((t) => now - t < windowMs);
    timestamps.push(now);

    if (timestamps.length > maxCalls) {
      if (!import.meta.env.PROD) {
        // eslint-disable-next-line no-console
        console.warn('[nav] replaceState throttled to prevent crash');
      }
      // No-op to avoid triggering the browser SecurityError.
      return;
    }

    return (original as any).apply(this, args);
  } as any;
})();

// Listen for Service Worker updates.
// IMPORTANT: do NOT force reload here; repeated SW_UPDATED messages can remount the app and
// trigger the browser's replaceState safety limit.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_UPDATED") {
      try {
        sessionStorage.setItem("sw_updated_available", "1");
      } catch {
        // ignore
      }
      if (!import.meta.env.PROD) {
        // eslint-disable-next-line no-console
        console.log('[sw] update available');
      }
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
