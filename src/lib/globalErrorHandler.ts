import * as Sentry from '@sentry/react';

/**
 * Sets up global error handlers for uncaught errors and unhandled promise rejections.
 * Should be called once at app initialization.
 */
export const setupGlobalErrorHandler = () => {
  // Handle uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    
    if (error) {
      Sentry.captureException(error, {
        extra: {
          source,
          lineno,
          colno,
          type: 'uncaught_error',
        },
      });
    } else {
      Sentry.captureMessage(`Uncaught error: ${message}`, {
        level: 'error',
        extra: {
          source,
          lineno,
          colno,
          type: 'uncaught_error',
        },
      });
    }
    
    return false; // Don't prevent default error handling
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason instanceof Error) {
      Sentry.captureException(event.reason, {
        extra: {
          type: 'unhandled_promise_rejection',
        },
      });
    } else {
      Sentry.captureMessage(`Unhandled promise rejection: ${String(event.reason)}`, {
        level: 'error',
        extra: {
          reason: event.reason,
          type: 'unhandled_promise_rejection',
        },
      });
    }
  };

  // Log that global error handling is active
  if (import.meta.env.DEV) {
    console.log('Global error handlers initialized');
  }
};
