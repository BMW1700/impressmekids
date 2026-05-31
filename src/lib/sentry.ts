import * as Sentry from "@sentry/react";

/**
 * Sentry initialization — Kids-app & COPPA hardened.
 *
 * Key rules (Apple Guideline 5.1.4 + COPPA):
 *   - No email or name ever sent to Sentry
 *   - Session Replay masks all text + blocks all media
 *   - `beforeSend` strips request URLs of query params (PII leakage guard)
 *   - User context only carries an opaque user_id + role
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    if (!import.meta.env.PROD) {
      console.warn("Sentry DSN not configured - error monitoring disabled");
    }
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend(event) {
      // Strip any email/name that may have leaked through
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete (event.user as Record<string, unknown>).name;
        delete event.user.ip_address;
      }
      // Strip query strings from request URLs
      if (event.request?.url) {
        try {
          const u = new URL(event.request.url);
          event.request.url = `${u.origin}${u.pathname}`;
        } catch {
          // ignore malformed
        }
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Drop console breadcrumbs that may include PII
      if (breadcrumb.category === "console" && breadcrumb.level === "log") {
        return null;
      }
      return breadcrumb;
    },
  });
};

export const captureError = (error: Error, context?: Record<string, unknown>) => {
  Sentry.captureException(error, { extra: context });
};

/**
 * Set Sentry user context.
 *
 * NOTE: We deliberately ignore the `email` parameter to comply with
 * COPPA / App Privacy: Sentry must not receive PII. Callers may keep
 * passing email for backward compatibility, but it is dropped here.
 */
export const setUserContext = (
  userId: string,
  _email?: string,
  role?: string,
) => {
  Sentry.setUser({ id: userId, ...(role ? { role } : {}) });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};
