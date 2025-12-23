import * as Sentry from "@sentry/react";

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("Sentry DSN not configured - error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    // Environment
    environment: import.meta.env.MODE,
  });
};

// Helper to capture errors with context
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, { extra: context });
};

// Helper to set user context
export const setUserContext = (userId: string, email?: string, role?: string) => {
  Sentry.setUser({ id: userId, email, role });
};

// Helper to clear user context on logout
export const clearUserContext = () => {
  Sentry.setUser(null);
};
