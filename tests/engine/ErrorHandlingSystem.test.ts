import { ErrorHandlingSystem, ErrorHandler } from '../../src/engine/ErrorHandlingSystem';
import { IntegrationError } from '../../src/types/core';

describe('ErrorHandlingSystem', () => {
  let errorHandlingSystem: ErrorHandlingSystem;

  beforeEach(() => {
    errorHandlingSystem = new ErrorHandlingSystem();
    // Clear any existing error history
    errorHandlingSystem.clearErrorHistory();
  });

  afterEach(() => {
    errorHandlingSystem.cleanup();
    jest.clearAllMocks();
  });

  describe('Error Handler Registration', () => {
    test('should register custom error handlers', () => {
      const customHandler: ErrorHandler = {
        handle: jest.fn().mockReturnValue({
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Custom error handled',
          technicalDetails: 'Custom error details',
          suggestedActions: ['Custom action']
        })
      };

      errorHandlingSystem.registerErrorHandler('CUSTOM_ERROR', customHandler);

      const error: IntegrationError = {
        type: 'CUSTOM_ERROR',
        message: 'Test custom error',
        name: 'CustomError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(customHandler.handle).toHaveBeenCalledWith(error, expect.any(Object));
      expect(result.handled).toBe(true);
      expect(result.userMessage).toBe('Custom error handled');
    });

    test('should allow overriding default error handlers', () => {
      const overrideHandler: ErrorHandler = {
        handle: jest.fn().mockReturnValue({
          handled: true,
          recoveryAttempted: false,
          safeModeRequired: true,
          userMessage: 'Override handler',
          technicalDetails: 'Override details',
          suggestedActions: ['Override action']
        })
      };

      errorHandlingSystem.registerErrorHandler('RENDERING_ERROR', overrideHandler);

      const error: IntegrationError = {
        type: 'RENDERING_ERROR',
        message: 'Test rendering error',
        name: 'RenderingError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(overrideHandler.handle).toHaveBeenCalled();
      expect(result.userMessage).toBe('Override handler');
    });
  });

  describe('Default Error Handling', () => {
    test('should handle rendering errors with safe mode fallback', () => {
      const error: IntegrationError = {
        type: 'RENDERING_ERROR',
        message: 'WebGL context lost',
        name: 'RenderingError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(result.handled).toBe(true);
      expect(result.recoveryAttempted).toBe(true);
      expect(result.safeModeRequired).toBe(false);
      expect(result.userMessage).toContain('compatibility mode');
    });

    test('should handle simulation errors by pausing simulation', () => {
      const error: IntegrationError = {
        type: 'SIMULATION_ERROR',
        message: 'Device interaction failed',
        name: 'SimulationError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(result.handled).toBe(true);
      expect(result.recoveryAttempted).toBe(true);
      expect(result.userMessage).toContain('Simulation paused');
      expect(result.suggestedActions).toContain('Check device configurations');
    });

    test('should handle audio errors gracefully', () => {
      const error: IntegrationError = {
        type: 'AUDIO_ERROR',
        message: 'Audio context suspended',
        name: 'AudioError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain('without sound');
      expect(result.safeModeRequired).toBe(false);
    });

    test('should handle save/load errors with user guidance', () => {
      const saveError: IntegrationError = {
        type: 'SAVE_ERROR',
        message: 'Storage quota exceeded',
        name: 'SaveError'
      };

      const result = errorHandlingSystem.handleError(saveError);

      expect(result.handled).toBe(true);
      expect(result.recoveryAttempted).toBe(false);
      expect(result.userMessage).toContain('Failed to save');
      expect(result.suggestedActions).toContain('Check available storage');
    });

    test('should handle memory errors by enabling safe mode', () => {
      const error: IntegrationError = {
        type: 'MEMORY_ERROR',
        message: 'Out of memory',
        name: 'MemoryError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(result.handled).toBe(true);
      expect(result.safeModeRequired).toBe(true);
      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(true);
      expect(result.userMessage).toContain('safe mode');
    });
  });

  describe('Safe Mode Management', () => {
    test('should enable safe mode after multiple critical errors', () => {
      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(false);

      // Trigger multiple critical errors
      for (let i = 0; i < 3; i++) {
        const error: IntegrationError = {
          type: 'SYSTEM_INITIALIZATION_FAILED',
          message: `Critical error ${i + 1}`,
          name: 'CriticalError'
        };
        errorHandlingSystem.handleError(error);
      }

      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(true);
    });

    test('should allow disabling safe mode', () => {
      // Enable safe mode
      errorHandlingSystem.enableSafeMode();
      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(true);

      // Disable safe mode
      errorHandlingSystem.disableSafeMode();
      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(false);
    });

    test('should reset critical error count when disabling safe mode', () => {
      // Trigger critical errors to enable safe mode
      for (let i = 0; i < 3; i++) {
        const error: IntegrationError = {
          type: 'SYSTEM_INITIALIZATION_FAILED',
          message: `Critical error ${i + 1}`,
          name: 'CriticalError'
        };
        errorHandlingSystem.handleError(error);
      }

      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(true);

      // Disable safe mode
      errorHandlingSystem.disableSafeMode();

      // Should not immediately re-enable safe mode on next error
      const error: IntegrationError = {
        type: 'SYSTEM_INITIALIZATION_FAILED',
        message: 'Another critical error',
        name: 'CriticalError'
      };
      errorHandlingSystem.handleError(error);

      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(false);
    });
  });

  describe('Unknown Error Handling', () => {
    test('should handle unknown error types gracefully', () => {
      const error: IntegrationError = {
        type: 'UNKNOWN_ERROR_TYPE',
        message: 'This is an unknown error',
        name: 'UnknownError'
      };

      const result = errorHandlingSystem.handleError(error);

      expect(result.handled).toBe(true);
      expect(result.recoveryAttempted).toBe(false);
      expect(result.userMessage).toContain('unexpected error');
      expect(result.suggestedActions).toContain('Refresh the page');
    });

    test('should enable safe mode after multiple unknown errors', () => {
      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(false);

      // Trigger multiple unknown errors
      for (let i = 0; i < 3; i++) {
        const error: IntegrationError = {
          type: `UNKNOWN_ERROR_${i}`,
          message: `Unknown error ${i + 1}`,
          name: 'UnknownError'
        };
        errorHandlingSystem.handleError(error);
      }

      expect(errorHandlingSystem.isSafeModeEnabled()).toBe(true);
    });
  });

  describe('Error Statistics and History', () => {
    test('should track error statistics', () => {
      const errors = [
        { type: 'RENDERING_ERROR', message: 'Render error 1', name: 'RenderingError' },
        { type: 'RENDERING_ERROR', message: 'Render error 2', name: 'RenderingError' },
        { type: 'AUDIO_ERROR', message: 'Audio error 1', name: 'AudioError' },
        { type: 'SIMULATION_ERROR', message: 'Sim error 1', name: 'SimulationError' }
      ];

      errors.forEach(error => {
        errorHandlingSystem.handleError(error as IntegrationError);
      });

      const stats = errorHandlingSystem.getErrorStatistics();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType['RENDERING_ERROR']).toBe(2);
      expect(stats.errorsByType['AUDIO_ERROR']).toBe(1);
      expect(stats.errorsByType['SIMULATION_ERROR']).toBe(1);
      expect(stats.handledErrors).toBe(4);
    });

    test('should track recent errors separately', () => {
      // Add some errors
      const error: IntegrationError = {
        type: 'TEST_ERROR',
        message: 'Test error',
        name: 'TestError'
      };

      errorHandlingSystem.handleError(error);

      const stats = errorHandlingSystem.getErrorStatistics();
      expect(stats.recentErrors).toBe(1);
      expect(stats.totalErrors).toBe(1);
    });

    test('should clear error history', () => {
      const error: IntegrationError = {
        type: 'TEST_ERROR',
        message: 'Test error',
        name: 'TestError'
      };

      errorHandlingSystem.handleError(error);
      
      let stats = errorHandlingSystem.getErrorStatistics();
      expect(stats.totalErrors).toBe(1);

      errorHandlingSystem.clearErrorHistory();
      
      stats = errorHandlingSystem.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.criticalErrorCount).toBe(0);
    });
  });

  describe('Error Callbacks', () => {
    test('should notify registered error callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      errorHandlingSystem.onError(callback1);
      errorHandlingSystem.onError(callback2);

      const error: IntegrationError = {
        type: 'TEST_ERROR',
        message: 'Test error',
        name: 'TestError'
      };

      errorHandlingSystem.handleError(error);

      expect(callback1).toHaveBeenCalledWith(error);
      expect(callback2).toHaveBeenCalledWith(error);
    });

    test('should handle callback errors gracefully', () => {
      const failingCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback failed');
      });
      const workingCallback = jest.fn();

      errorHandlingSystem.onError(failingCallback);
      errorHandlingSystem.onError(workingCallback);

      const error: IntegrationError = {
        type: 'TEST_ERROR',
        message: 'Test error',
        name: 'TestError'
      };

      // Should not throw despite failing callback
      expect(() => {
        errorHandlingSystem.handleError(error);
      }).not.toThrow();

      expect(failingCallback).toHaveBeenCalled();
      expect(workingCallback).toHaveBeenCalled();
    });
  });

  describe('Global Error Handling', () => {
    test('should handle uncaught JavaScript errors', () => {
      const callback = jest.fn();
      errorHandlingSystem.onError(callback);

      // Simulate uncaught error
      const errorEvent = new ErrorEvent('error', {
        message: 'Uncaught error',
        filename: 'test.js',
        lineno: 42,
        colno: 10,
        error: new Error('Test error')
      });

      window.dispatchEvent(errorEvent);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNCAUGHT_ERROR',
          message: 'Uncaught error'
        })
      );
    });

    test('should handle unhandled promise rejections', () => {
      const callback = jest.fn();
      errorHandlingSystem.onError(callback);

      // Create a mock promise rejection event
      const mockReason = new Error('Promise rejection');
      const rejectionEvent = new Event('unhandledrejection') as any;
      
      // Add the reason property to the event
      rejectionEvent.reason = mockReason;

      window.dispatchEvent(rejectionEvent);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UNHANDLED_PROMISE_REJECTION',
          message: 'Promise rejection'
        })
      );
    });
  });

  describe('Error Context Capture', () => {
    test('should capture error context for debugging', () => {
      const customHandler: ErrorHandler = {
        handle: jest.fn().mockReturnValue({
          handled: true,
          recoveryAttempted: false,
          safeModeRequired: false,
          userMessage: 'Test',
          technicalDetails: 'Test',
          suggestedActions: []
        })
      };

      errorHandlingSystem.registerErrorHandler('CONTEXT_TEST', customHandler);

      const error: IntegrationError = {
        type: 'CONTEXT_TEST',
        message: 'Context test error',
        name: 'ContextTestError'
      };

      errorHandlingSystem.handleError(error);

      expect(customHandler.handle).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          timestamp: expect.any(Number),
          userAgent: expect.any(String),
          url: expect.any(String),
          safeModeEnabled: expect.any(Boolean),
          errorHistoryLength: expect.any(Number),
          criticalErrorCount: expect.any(Number)
        })
      );
    });
  });
});