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

// Service Worker hotfix for tab-switch reload loops:
// 1) unregister stale workers once
// 2) clear stale NabuLearn caches once
// 3) avoid SW message listeners entirely
if ("serviceWorker" in navigator) {
  const SW_HOTFIX_KEY = "sw_tab_reload_hotfix_v1";

  (async () => {
    try {
      if (localStorage.getItem(SW_HOTFIX_KEY) === "1") return;

      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("nabulearn-"))
            .map((k) => caches.delete(k))
        );
      }

      localStorage.setItem(SW_HOTFIX_KEY, "1");
      if (!import.meta.env.PROD) {
        // eslint-disable-next-line no-console
        console.log("[sw] tab-reload hotfix applied");
      }
    } catch {
      // ignore
    }
  })();
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
