/**
 * Error Logging and Monitoring Utility
 * Centralized error handling for production monitoring
 */

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  log(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : context.url || 'unknown',
    };

    // Store in memory (limited)
    this.errors.push(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorEntry);
    }

    // Send to server in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendToServer(errorEntry);
    }

    return errorEntry;
  }

  async sendToServer(errorEntry) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorEntry),
        keepalive: true,
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } catch (e) {
      // Silently fail
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  // Global error handlers
  setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise,
      });
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.log(event.error || new Error(event.message), {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.log(new Error(`Resource failed to load: ${event.target.src || event.target.href}`), {
          type: 'resourceError',
          target: event.target.tagName,
        });
      }
    }, true);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// React Error Boundary helper
export function logErrorBoundary(error, errorInfo) {
  errorLogger.log(error, {
    type: 'reactErrorBoundary',
    componentStack: errorInfo.componentStack,
  });
}

// API error wrapper
export async function apiCall(fn, context = {}) {
  try {
    return await fn();
  } catch (error) {
    errorLogger.log(error, { type: 'apiError', ...context });
    throw error;
  }
}

// Initialize on client
if (typeof window !== 'undefined') {
  errorLogger.setupGlobalHandlers();
}

export default errorLogger;
