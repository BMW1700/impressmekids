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
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      // New service worker activated - reload once to get fresh content
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
