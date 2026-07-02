import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { setupGlobalErrorHandler } from "./lib/globalErrorHandler";
import ErrorBoundary from "./components/error/ErrorBoundary";
import { initCapacitor } from "./lib/native/capacitorBootstrap";

const PRODUCTION_BUILD_MARKER = "r2-cdn-followup-2026-07-02-0945";

// Initialize monitoring after first paint so it does not slow the landing screen.
const startMonitoring = () => initSentry();
globalThis.setTimeout(startMonitoring, 5000);

// Set up global error handlers for uncaught errors
setupGlobalErrorHandler();

// Initialize Capacitor native bridges (no-op on web)
initCapacitor();

// Harmless deploy marker: forces a fresh frontend bundle hash for CDN verification.
document.documentElement.dataset.deployMarker = PRODUCTION_BUILD_MARKER;

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

// Unconditionally unregister all service workers and clear caches to prevent tab-switch reloads
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => {});

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);
