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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
