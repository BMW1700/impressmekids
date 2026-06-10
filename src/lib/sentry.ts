import * as Sentry from "@sentry/react";

/**
 * Sentry initialization — Kids-app & COPPA hardened.
 *
 * Key rules (Apple Guideline 5.1.4 + COPPA + FERPA):
 *   - No email or name ever sent to Sentry
 *   - Session Replay masks all text + blocks all media
 *   - Session Replay is fully DISABLED for student accounts (school-mode default)
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
    // NOTE: replay rates start at 0 and are raised only for non-student
    // roles via `setStudentMode(false)` after auth resolves. Keeping these
    // at 0 here guarantees no replay is captured before we know the role.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete (event.user as Record<string, unknown>).name;
        delete event.user.ip_address;
      }
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
 * COPPA / App Privacy: Sentry must not receive PII.
 */
export const setUserContext = (
  userId: string,
  _email?: string,
  role?: string,
) => {
  Sentry.setUser({ id: userId, ...(role ? { role } : {}) });
  // Auto-apply student mode based on role.
  setStudentMode(role === "student");
};

export const clearUserContext = () => {
  Sentry.setUser(null);
  // Be safe: when logged out, do not capture replay until role is known again.
  setStudentMode(true);
};

/**
 * Toggle Session Replay sampling based on whether the current user is a student.
 *
 * Students (kids under 13) NEVER get replay captured, even with all masking
 * applied — this is the COPPA-safe default. Adults (teacher / parent / admin)
 * get the standard 10% session / 100% on-error replay sampling.
 */
export const setStudentMode = (isStudent: boolean) => {
  try {
    const client = Sentry.getClient();
    if (!client) return;
    const options = client.getOptions() as {
      replaysSessionSampleRate?: number;
      replaysOnErrorSampleRate?: number;
    };
    if (isStudent) {
      options.replaysSessionSampleRate = 0;
      options.replaysOnErrorSampleRate = 0;
    } else {
      options.replaysSessionSampleRate = 0.1;
      options.replaysOnErrorSampleRate = 1.0;
    }
  } catch {
    // Replay integration may not be present; ignore.
  }
};
