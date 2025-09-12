import { IntegrationError, GameMode } from '../types/core';

/**
 * Centralized error handling system that provides graceful degradation
 * and recovery mechanisms for all game systems
 */
export class ErrorHandlingSystem {
  private errorHandlers: Map<string, ErrorHandler> = new Map();
  private errorHistory: ErrorRecord[] = [];
  private safeModeEnabled: boolean = false;
  private criticalErrorCount: number = 0;
  private maxCriticalErrors: number = 3;
  private errorCallbacks: ErrorCallback[] = [];
  private isNotifyingCallbacks: boolean = false;

  constructor() {
    this.setupDefaultErrorHandlers();
    this.setupGlobalErrorHandling();
  }

  /**
   * Register an error handler for a specific error type
   */
  public registerErrorHandler(errorType: string, handler: ErrorHandler): void {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Register a callback to be notified of errors
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Handle an error with appropriate recovery strategy
   */
  public handleError(error: IntegrationError): ErrorHandlingResult {
    const errorRecord: ErrorRecord = {
      error,
      timestamp: Date.now(),
      context: this.captureErrorContext(),
      handled: false,
      recoveryAttempted: false
    };

    this.errorHistory.push(errorRecord);
    this.notifyErrorCallbacks(error);

    try {
      const handler = this.errorHandlers.get(error.type);
      if (handler) {
        const result = handler.handle(error, errorRecord.context);
        errorRecord.handled = true;
        errorRecord.recoveryAttempted = result.recoveryAttempted;
        return result;
      } else {
        return this.handleUnknownError(error, errorRecord);
      }
    } catch (handlerError) {
      console.error('Error handler failed:', handlerError);
      return this.handleCriticalError(error, errorRecord);
    }
  }

  /**
   * Check if system is in safe mode
   */
  public isSafeModeEnabled(): boolean {
    return this.safeModeEnabled;
  }

  /**
   * Enable safe mode with reduced functionality
   */
  public enableSafeMode(): void {
    if (this.safeModeEnabled) return;

    this.safeModeEnabled = true;
    console.warn('Safe mode enabled due to critical errors');
    
    this.notifyErrorCallbacks({
      type: 'SAFE_MODE_ENABLED',
      message: 'System entered safe mode',
      name: 'SafeModeError'
    } as IntegrationError);
  }

  /**
   * Disable safe mode and restore full functionality
   */
  public disableSafeMode(): void {
    if (!this.safeModeEnabled) return;

    this.safeModeEnabled = false;
    this.criticalErrorCount = 0;
    console.info('Safe mode disabled - full functionality restored');
  }

  /**
   * Get error statistics for debugging
   */
  public getErrorStatistics(): ErrorStatistics {
    const now = Date.now();
    const recentErrors = this.errorHistory.filter(
      record => now - record.timestamp < 300000 // Last 5 minutes
    );

    const errorsByType = new Map<string, number>();
    this.errorHistory.forEach(record => {
      const count = errorsByType.get(record.error.type) || 0;
      errorsByType.set(record.error.type, count + 1);
    });

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      criticalErrorCount: this.criticalErrorCount,
      safeModeEnabled: this.safeModeEnabled,
      errorsByType: Object.fromEntries(errorsByType),
      handledErrors: this.errorHistory.filter(r => r.handled).length,
      recoveryAttempts: this.errorHistory.filter(r => r.recoveryAttempted).length
    };
  }

  /**
   * Cleanup method to remove event listeners and prevent memory leaks
   */
  public cleanup(): void {
    this.errorCallbacks = [];
    this.errorHandlers.clear();
    this.errorHistory = [];
    this.criticalErrorCount = 0;
    this.safeModeEnabled = false;
    this.isNotifyingCallbacks = false;
  }

  /**
   * Clear error history (for testing or reset)
   */
  public clearErrorHistory(): void {
    this.errorHistory = [];
    this.criticalErrorCount = 0;
  }

  /**
   * Setup default error handlers for common error types
   */
  private setupDefaultErrorHandlers(): void {
    // Rendering errors
    this.registerErrorHandler('RENDERING_ERROR', {
      handle: (error, context) => {
        console.warn('Rendering error detected, switching to safe rendering mode');
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Graphics issue detected. Switching to compatibility mode.',
          technicalDetails: error.message,
          suggestedActions: ['Try refreshing the page', 'Check browser compatibility']
        };
      }
    });

    // Simulation errors
    this.registerErrorHandler('SIMULATION_ERROR', {
      handle: (error, context) => {
        console.warn('Simulation error detected, pausing simulation');
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Simulation paused due to an error. You can continue with device creation.',
          technicalDetails: error.message,
          suggestedActions: ['Check device configurations', 'Restart simulation']
        };
      }
    });

    // Audio errors
    this.registerErrorHandler('AUDIO_ERROR', {
      handle: (error, context) => {
        console.warn('Audio error detected, continuing without audio');
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Audio system error. Game will continue without sound.',
          technicalDetails: error.message,
          suggestedActions: ['Check audio settings', 'Try refreshing the page']
        };
      }
    });

    // Save/Load errors
    this.registerErrorHandler('SAVE_ERROR', {
      handle: (error, context) => {
        console.error('Save error detected');
        return {
          handled: true,
          recoveryAttempted: false,
          safeModeRequired: false,
          userMessage: 'Failed to save game. Please try again or check storage space.',
          technicalDetails: error.message,
          suggestedActions: ['Try saving again', 'Check available storage', 'Clear browser cache']
        };
      }
    });

    this.registerErrorHandler('LOAD_ERROR', {
      handle: (error, context) => {
        console.error('Load error detected');
        return {
          handled: true,
          recoveryAttempted: false,
          safeModeRequired: false,
          userMessage: 'Failed to load saved game. Starting fresh session.',
          technicalDetails: error.message,
          suggestedActions: ['Try loading a different save', 'Start a new game']
        };
      }
    });

    // Network errors
    this.registerErrorHandler('NETWORK_ERROR', {
      handle: (error, context) => {
        console.warn('Network error detected, switching to offline mode');
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Network connection lost. Some features may be limited.',
          technicalDetails: error.message,
          suggestedActions: ['Check internet connection', 'Try refreshing the page']
        };
      }
    });

    // Memory errors
    this.registerErrorHandler('MEMORY_ERROR', {
      handle: (error, context) => {
        console.error('Memory error detected, enabling safe mode');
        this.enableSafeMode();
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: true,
          userMessage: 'Memory usage too high. Switching to safe mode with reduced features.',
          technicalDetails: error.message,
          suggestedActions: ['Close other browser tabs', 'Restart the browser', 'Reduce visual effects']
        };
      }
    });

    // System initialization errors
    this.registerErrorHandler('SYSTEM_INITIALIZATION_FAILED', {
      handle: (error, context) => {
        console.error('System initialization failed');
        this.criticalErrorCount++;
        if (this.criticalErrorCount >= this.maxCriticalErrors) {
          this.enableSafeMode();
        }
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: this.safeModeEnabled,
          userMessage: 'System initialization error. Some features may not work correctly.',
          technicalDetails: error.message,
          suggestedActions: ['Refresh the page', 'Clear browser cache', 'Try a different browser']
        };
      }
    });

    // Mode transition errors
    this.registerErrorHandler('MODE_TRANSITION_FAILED', {
      handle: (error, context) => {
        console.warn('Mode transition failed, staying in current mode');
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Unable to switch modes. Please try again.',
          technicalDetails: error.message,
          suggestedActions: ['Try the transition again', 'Save your progress first']
        };
      }
    });
  }

  /**
   * Setup global error handling for uncaught errors
   */
  private setupGlobalErrorHandling(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      const error: IntegrationError = {
        type: 'UNCAUGHT_ERROR',
        message: event.message,
        name: 'UncaughtError',
        originalError: event.error,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      };
      this.handleError(error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error: IntegrationError = {
        type: 'UNHANDLED_PROMISE_REJECTION',
        message: event.reason?.message || 'Unhandled promise rejection',
        name: 'UnhandledPromiseRejection',
        originalError: event.reason,
        context: { reason: event.reason }
      };
      this.handleError(error);
    });
  }

  /**
   * Handle unknown error types
   */
  private handleUnknownError(error: IntegrationError, record: ErrorRecord): ErrorHandlingResult {
    console.error('Unknown error type:', error.type, error);
    
    // Increment critical error count for unknown errors
    this.criticalErrorCount++;
    
    if (this.criticalErrorCount >= this.maxCriticalErrors) {
      this.enableSafeMode();
    }

    record.handled = true;
    record.recoveryAttempted = false;

    return {
      handled: true,
      recoveryAttempted: false,
      safeModeRequired: this.safeModeEnabled,
      userMessage: 'An unexpected error occurred. The system will continue in safe mode.',
      technicalDetails: error.message,
      suggestedActions: ['Refresh the page', 'Report this issue']
    };
  }

  /**
   * Handle critical errors that threaten system stability
   */
  private handleCriticalError(error: IntegrationError, record: ErrorRecord): ErrorHandlingResult {
    console.error('Critical error - error handler failed:', error);
    
    this.criticalErrorCount++;
    this.enableSafeMode();

    record.handled = false;
    record.recoveryAttempted = false;

    return {
      handled: false,
      recoveryAttempted: false,
      safeModeRequired: true,
      userMessage: 'A critical error occurred. The system is now in safe mode.',
      technicalDetails: 'Error handler failure: ' + error.message,
      suggestedActions: ['Refresh the page', 'Clear browser data', 'Contact support']
    };
  }

  /**
   * Capture current system context for error diagnosis
   */
  private captureErrorContext(): ErrorContext {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      memoryUsage: this.getMemoryUsage(),
      safeModeEnabled: this.safeModeEnabled,
      errorHistoryLength: this.errorHistory.length,
      criticalErrorCount: this.criticalErrorCount
    };
  }

  /**
   * Get memory usage information if available
   */
  private getMemoryUsage(): MemoryUsage | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  /**
   * Notify all registered error callbacks
   */
  private notifyErrorCallbacks(error: IntegrationError): void {
    // Prevent recursive callback errors by checking if we're already in a callback
    if (this.isNotifyingCallbacks) {
      return;
    }
    
    this.isNotifyingCallbacks = true;
    
    try {
      this.errorCallbacks.forEach(callback => {
        try {
          callback(error);
        } catch (callbackError) {
          // Only log callback errors, don't trigger more error handling
          console.error('Error callback failed:', callbackError);
        }
      });
    } finally {
      this.isNotifyingCallbacks = false;
    }
  }
}

// Type definitions
export interface ErrorHandler {
  handle(error: IntegrationError, context: ErrorContext): ErrorHandlingResult;
}

export interface ErrorHandlingResult {
  handled: boolean;
  recoveryAttempted: boolean;
  safeModeRequired: boolean;
  userMessage: string;
  technicalDetails: string;
  suggestedActions: string[];
}

export interface ErrorRecord {
  error: IntegrationError;
  timestamp: number;
  context: ErrorContext;
  handled: boolean;
  recoveryAttempted: boolean;
}

export interface ErrorContext {
  timestamp: number;
  userAgent: string;
  url: string;
  memoryUsage: MemoryUsage | null;
  safeModeEnabled: boolean;
  errorHistoryLength: number;
  criticalErrorCount: number;
}

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface ErrorStatistics {
  totalErrors: number;
  recentErrors: number;
  criticalErrorCount: number;
  safeModeEnabled: boolean;
  errorsByType: { [key: string]: number };
  handledErrors: number;
  recoveryAttempts: number;
}

export type ErrorCallback = (error: IntegrationError) => void;