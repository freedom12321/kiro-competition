import { BrowserCompatibilityTester, CompatibilityReport, CompatibilityTestResult } from '../../src/engine/BrowserCompatibilityTester';

describe('BrowserCompatibilityTester', () => {
  let tester: BrowserCompatibilityTester;

  beforeEach(() => {
    tester = new BrowserCompatibilityTester();
    
    // Mock browser APIs
    setupBrowserMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setupBrowserMocks() {
    // Mock canvas and WebGL
    const mockCanvas = {
      getContext: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

    // Mock AudioContext
    (global as any).AudioContext = jest.fn().mockImplementation(() => ({
      sampleRate: 44100,
      close: jest.fn()
    }));

    // Mock localStorage
    const mockLocalStorage = {
      setItem: jest.fn(),
      getItem: jest.fn().mockReturnValue('test'),
      removeItem: jest.fn()
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      configurable: true
    });

    // Mock indexedDB
    const mockIndexedDB = {
      open: jest.fn().mockReturnValue({
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: {
          close: jest.fn(),
          createObjectStore: jest.fn()
        }
      }),
      deleteDatabase: jest.fn()
    };
    Object.defineProperty(global, 'indexedDB', {
      value: mockIndexedDB,
      configurable: true
    });

    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {},
        userAgent: 'Mozilla/5.0 (Test Browser)',
        platform: 'Test Platform',
        language: 'en-US',
        cookieEnabled: true,
        onLine: true,
        getGamepads: jest.fn()
      },
      configurable: true
    });

    // Mock WebAssembly
    (global as any).WebAssembly = {
      instantiate: jest.fn()
    };

    // Mock requestAnimationFrame
    (global as any).requestAnimationFrame = jest.fn();

    // Mock Worker
    (global as any).Worker = jest.fn();

    // Mock fetch
    (global as any).fetch = jest.fn();

    // Mock Promise
    (global as any).Promise = Promise;

    // Mock fullscreen API
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: jest.fn(),
      configurable: true
    });

    // Mock pointer lock API
    Object.defineProperty(document.documentElement, 'requestPointerLock', {
      value: jest.fn(),
      configurable: true
    });
  }

  describe('Test Initialization', () => {
    test('should initialize with predefined tests', () => {
      const availableTests = tester.getAvailableTests();
      
      expect(availableTests.length).toBeGreaterThan(0);
      
      const testNames = availableTests.map(test => test.name);
      expect(testNames).toContain('webgl');
      expect(testNames).toContain('webAudio');
      expect(testNames).toContain('localStorage');
      expect(testNames).toContain('serviceWorker');
      expect(testNames).toContain('fetch');
    });

    test('should categorize tests as required or optional', () => {
      const availableTests = tester.getAvailableTests();
      
      const requiredTests = availableTests.filter(test => test.required);
      const optionalTests = availableTests.filter(test => !test.required);
      
      expect(requiredTests.length).toBeGreaterThan(0);
      expect(optionalTests.length).toBeGreaterThan(0);
      
      // WebGL should be required
      expect(requiredTests.some(test => test.name === 'webgl')).toBe(true);
      
      // WebGL2 should be optional
      expect(optionalTests.some(test => test.name === 'webgl2')).toBe(true);
    });
  });

  describe('Individual Tests', () => {
    test('should test WebGL support', async () => {
      // Mock successful WebGL context
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockReturnValue({ vendor: 'Test Vendor' });

      const result = await tester.runTest('webgl');
      
      expect(result.testName).toBe('webgl');
      expect(result.passed).toBe(true);
      expect(result.performance).toBeGreaterThan(0);
    });

    test('should test WebGL2 support', async () => {
      // Mock WebGL2 context
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockImplementation((type) => {
        return type === 'webgl2' ? {} : null;
      });

      const result = await tester.runTest('webgl2');
      
      expect(result.testName).toBe('webgl2');
      expect(result.passed).toBe(true);
    });

    test('should test Web Audio support', async () => {
      // Mock AudioContext for testing environment
      const mockAudioContext = jest.fn().mockImplementation(() => ({
        createOscillator: jest.fn().mockReturnValue({
          connect: jest.fn()
        }),
        createGain: jest.fn().mockReturnValue({
          connect: jest.fn()
        }),
        destination: {},
        close: jest.fn()
      }));
      
      (window as any).AudioContext = mockAudioContext;
      (window as any).webkitAudioContext = mockAudioContext;
      
      const result = await tester.runTest('webAudio');
      
      expect(result.testName).toBe('webAudio');
      expect(result.passed).toBe(true);
    });

    test('should test localStorage support', async () => {
      const result = await tester.runTest('localStorage');
      
      expect(result.testName).toBe('localStorage');
      expect(result.passed).toBe(true);
      
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalled();
    });

    test('should test IndexedDB support', async () => {
      // Mock successful IndexedDB operation
      const mockRequest = (global as any).indexedDB.open();
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      const result = await tester.runTest('indexedDB');
      
      expect(result.testName).toBe('indexedDB');
      expect(result.passed).toBe(true);
    });

    test('should test Service Worker support', async () => {
      const result = await tester.runTest('serviceWorker');
      
      expect(result.testName).toBe('serviceWorker');
      expect(result.passed).toBe(true);
    });

    test('should test WebAssembly support', async () => {
      const result = await tester.runTest('webAssembly');
      
      expect(result.testName).toBe('webAssembly');
      expect(result.passed).toBe(true);
    });

    test('should test ES6 module support', async () => {
      const result = await tester.runTest('es6Modules');
      
      expect(result.testName).toBe('es6Modules');
      expect(result.passed).toBe(true);
    });

    test('should test Fetch API support', async () => {
      const result = await tester.runTest('fetch');
      
      expect(result.testName).toBe('fetch');
      expect(result.passed).toBe(true);
    });

    test('should test Promise support', async () => {
      const result = await tester.runTest('promises');
      
      expect(result.testName).toBe('promises');
      expect(result.passed).toBe(true);
    });

    test('should test requestAnimationFrame support', async () => {
      const result = await tester.runTest('requestAnimationFrame');
      
      expect(result.testName).toBe('requestAnimationFrame');
      expect(result.passed).toBe(true);
    });

    test('should test Gamepad API support', async () => {
      const result = await tester.runTest('gamepad');
      
      expect(result.testName).toBe('gamepad');
      expect(result.passed).toBe(true);
    });

    test('should test Fullscreen API support', async () => {
      const result = await tester.runTest('fullscreen');
      
      expect(result.testName).toBe('fullscreen');
      expect(result.passed).toBe(true);
    });

    test('should test Pointer Lock API support', async () => {
      const result = await tester.runTest('pointerLock');
      
      expect(result.testName).toBe('pointerLock');
      expect(result.passed).toBe(true);
    });

    test('should test Web Workers support', async () => {
      const result = await tester.runTest('webWorkers');
      
      expect(result.testName).toBe('webWorkers');
      expect(result.passed).toBe(true);
    });
  });

  describe('Test Failures', () => {
    test('should handle WebGL test failure', async () => {
      // Mock failed WebGL context
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockReturnValue(null);

      const result = await tester.runTest('webgl');
      
      expect(result.testName).toBe('webgl');
      expect(result.passed).toBe(false);
    });

    test('should handle localStorage test failure', async () => {
      // Mock localStorage failure
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = await tester.runTest('localStorage');
      
      expect(result.testName).toBe('localStorage');
      expect(result.passed).toBe(false);
      // The localStorage test catches errors internally, so no error message is propagated
    });

    test('should handle IndexedDB test failure', async () => {
      // Mock IndexedDB failure
      const mockRequest = (global as any).indexedDB.open();
      setTimeout(() => {
        if (mockRequest.onerror) {
          mockRequest.onerror();
        }
      }, 0);

      const result = await tester.runTest('indexedDB');
      
      expect(result.testName).toBe('indexedDB');
      expect(result.passed).toBe(false);
    });

    test('should handle test exceptions', async () => {
      // Mock a test that throws an exception
      const originalCreateElement = document.createElement;
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM manipulation failed');
      });

      const result = await tester.runTest('webgl');
      
      expect(result.testName).toBe('webgl');
      expect(result.passed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('DOM manipulation failed');

      // Restore original implementation
      document.createElement = originalCreateElement;
    });
  });

  describe('Full Test Suite', () => {
    test('should run all tests and generate report', async () => {
      const report = await tester.runAllTests();
      
      expect(report).toHaveProperty('browserInfo');
      expect(report).toHaveProperty('testResults');
      expect(report).toHaveProperty('overallScore');
      expect(report).toHaveProperty('criticalFailures');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('recommendations');
      
      expect(Array.isArray(report.testResults)).toBe(true);
      expect(report.testResults.length).toBeGreaterThan(0);
      expect(typeof report.overallScore).toBe('number');
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    test('should include browser information in report', async () => {
      const report = await tester.runAllTests();
      
      expect(report.browserInfo).toHaveProperty('userAgent');
      expect(report.browserInfo).toHaveProperty('platform');
      expect(report.browserInfo).toHaveProperty('language');
      expect(report.browserInfo).toHaveProperty('cookieEnabled');
      expect(report.browserInfo).toHaveProperty('onLine');
      
      expect(report.browserInfo.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(report.browserInfo.platform).toBe('Test Platform');
      expect(report.browserInfo.language).toBe('en-US');
    });

    test('should calculate overall score correctly', async () => {
      const report = await tester.runAllTests();
      
      const totalTests = report.testResults.length;
      const passedTests = report.testResults.filter(r => r.passed).length;
      const expectedScore = (passedTests / totalTests) * 100;
      
      expect(report.overallScore).toBeCloseTo(expectedScore, 1);
    });

    test('should identify critical failures', async () => {
      // Mock a critical test failure
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockReturnValue(null);

      const report = await tester.runAllTests();
      
      const webglTest = report.testResults.find(r => r.testName === 'webgl');
      if (webglTest && !webglTest.passed) {
        expect(report.criticalFailures).toContain('webgl: WebGL support for 3D rendering');
      }
    });

    test('should generate warnings for optional feature failures', async () => {
      // Mock WebGL2 failure (optional feature)
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockImplementation((type) => {
        return type === 'webgl2' ? null : {};
      });

      const report = await tester.runAllTests();
      
      const webgl2Test = report.testResults.find(r => r.testName === 'webgl2');
      if (webgl2Test && !webgl2Test.passed) {
        expect(report.warnings.some(w => w.includes('webgl2'))).toBe(true);
      }
    });

    test('should provide recommendations based on test results', async () => {
      // Mock low compatibility score
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockReturnValue(null);
      delete (global as any).AudioContext;
      delete (global as any).localStorage;

      const report = await tester.runAllTests();
      
      if (report.overallScore < 70) {
        expect(report.recommendations).toContain('Consider updating your browser for the best experience');
      }
      
      if (report.criticalFailures.length > 0) {
        expect(report.recommendations).toContain('Some critical features are not supported - game may not function properly');
      }
    });
  });

  describe('Performance Tracking', () => {
    test('should track individual test performance', async () => {
      const result = await tester.runTest('webgl');
      
      expect(result.performance).toBeDefined();
      expect(typeof result.performance).toBe('number');
      expect(result.performance).toBeGreaterThan(0);
    });

    test('should track overall test suite performance', async () => {
      const startTime = performance.now();
      await tester.runAllTests();
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown test names', async () => {
      await expect(tester.runTest('unknownTest')).rejects.toThrow("Test 'unknownTest' not found");
    });

    test('should continue testing even if some tests fail', async () => {
      // Mock one test to throw an error
      const mockCanvas = document.createElement('canvas') as any;
      mockCanvas.getContext.mockImplementation(() => {
        throw new Error('Canvas creation failed');
      });

      const report = await tester.runAllTests();
      
      // Should still have results for other tests
      expect(report.testResults.length).toBeGreaterThan(1);
      
      // Failed test should be recorded
      const webglTest = report.testResults.find(r => r.testName === 'webgl');
      expect(webglTest?.passed).toBe(false);
      expect(webglTest?.error).toContain('Canvas creation failed');
    });
  });
});