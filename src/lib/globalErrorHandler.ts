import { captureError } from './sentry';

/**
 * Sets up global error handlers for uncaught errors and unhandled promise rejections.
 * Should be called once at app initialization.
 */
export const setupGlobalErrorHandler = () => {
  // Handle uncaught errors
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', { message, source, lineno, colno, error });
    
    if (error) {
      captureError(error, { source, lineno, colno, type: 'uncaught_error' });
    } else {
      captureError(new Error(`Uncaught error: ${message}`), { source, lineno, colno, type: 'uncaught_error' });
    }
    
    return false; // Don't prevent default error handling
  };

  // Handle unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason instanceof Error) {
      captureError(event.reason, { type: 'unhandled_promise_rejection' });
    } else {
      captureError(new Error(`Unhandled promise rejection: ${String(event.reason)}`), {
        reason: event.reason,
        type: 'unhandled_promise_rejection',
      });
    }
  };

  // Log that global error handling is active
  if (import.meta.env.DEV) {
    console.log('Global error handlers initialized');
  }
};
