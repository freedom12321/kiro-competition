export interface BrowserTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  required: boolean;
  fallback?: string;
}

export interface CompatibilityTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  performance?: number;
  details?: any;
}

export interface CompatibilityReport {
  browserInfo: {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
  };
  testResults: CompatibilityTestResult[];
  overallScore: number;
  criticalFailures: string[];
  warnings: string[];
  recommendations: string[];
}

export class BrowserCompatibilityTester {
  private tests: BrowserTest[] = [];

  constructor() {
    this.initializeTests();
  }

  /**
   * Initialize all compatibility tests
   */
  private initializeTests(): void {
    this.tests = [
      {
        name: 'webgl',
        description: 'WebGL support for 3D rendering',
        required: true,
        test: this.testWebGL.bind(this),
        fallback: 'Canvas 2D rendering with limited 3D effects'
      },
      {
        name: 'webgl2',
        description: 'WebGL 2.0 support for advanced rendering',
        required: false,
        test: this.testWebGL2.bind(this),
        fallback: 'WebGL 1.0 with reduced visual effects'
      },
      {
        name: 'webAudio',
        description: 'Web Audio API for immersive sound',
        required: true,
        test: this.testWebAudio.bind(this),
        fallback: 'HTML5 audio with limited features'
      },
      {
        name: 'localStorage',
        description: 'Local storage for game saves',
        required: true,
        test: this.testLocalStorage.bind(this),
        fallback: 'Session-only storage'
      },
      {
        name: 'indexedDB',
        description: 'IndexedDB for large data storage',
        required: false,
        test: this.testIndexedDB.bind(this),
        fallback: 'Local storage with size limitations'
      },
      {
        name: 'serviceWorker',
        description: 'Service Worker for offline support',
        required: false,
        test: this.testServiceWorker.bind(this),
        fallback: 'Online-only functionality'
      },
      {
        name: 'webAssembly',
        description: 'WebAssembly for performance optimization',
        required: false,
        test: this.testWebAssembly.bind(this),
        fallback: 'JavaScript-only implementation'
      },
      {
        name: 'es6Modules',
        description: 'ES6 module support',
        required: true,
        test: this.testES6Modules.bind(this),
        fallback: 'Bundled JavaScript fallback'
      },
      {
        name: 'fetch',
        description: 'Fetch API for network requests',
        required: true,
        test: this.testFetch.bind(this),
        fallback: 'XMLHttpRequest fallback'
      },
      {
        name: 'promises',
        description: 'Promise support for async operations',
        required: true,
        test: this.testPromises.bind(this),
        fallback: 'Callback-based implementation'
      },
      {
        name: 'requestAnimationFrame',
        description: 'RequestAnimationFrame for smooth animations',
        required: true,
        test: this.testRequestAnimationFrame.bind(this),
        fallback: 'setTimeout-based animation'
      },
      {
        name: 'gamepad',
        description: 'Gamepad API for controller support',
        required: false,
        test: this.testGamepad.bind(this),
        fallback: 'Keyboard and mouse only'
      },
      {
        name: 'fullscreen',
        description: 'Fullscreen API for immersive experience',
        required: false,
        test: this.testFullscreen.bind(this),
        fallback: 'Windowed mode only'
      },
      {
        name: 'pointerLock',
        description: 'Pointer Lock API for camera control',
        required: false,
        test: this.testPointerLock.bind(this),
        fallback: 'Standard mouse interaction'
      },
      {
        name: 'webWorkers',
        description: 'Web Workers for background processing',
        required: false,
        test: this.testWebWorkers.bind(this),
        fallback: 'Main thread processing'
      }
    ];
  }

  /**
   * Run all compatibility tests
   */
  async runAllTests(): Promise<CompatibilityReport> {
    const startTime = performance.now();
    const testResults: CompatibilityTestResult[] = [];
    const criticalFailures: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Run tests in parallel for better performance
    const testPromises = this.tests.map(async (test) => {
      const testStartTime = performance.now();
      try {
        const passed = await test.test();
        const testTime = performance.now() - testStartTime;
        
        const result: CompatibilityTestResult = {
          testName: test.name,
          passed,
          performance: testTime
        };

        if (!passed) {
          if (test.required) {
            criticalFailures.push(`${test.name}: ${test.description}`);
          } else {
            warnings.push(`${test.name}: ${test.description} - ${test.fallback}`);
          }
        }

        return result;
      } catch (error) {
        const result: CompatibilityTestResult = {
          testName: test.name,
          passed: false,
          error: (error as Error).message,
          performance: performance.now() - testStartTime
        };

        if (test.required) {
          criticalFailures.push(`${test.name}: ${(error as Error).message}`);
        } else {
          warnings.push(`${test.name}: ${(error as Error).message} - ${test.fallback}`);
        }

        return result;
      }
    });

    const results = await Promise.all(testPromises);
    testResults.push(...results);

    // Calculate overall score
    const passedTests = testResults.filter(r => r.passed).length;
    const overallScore = (passedTests / testResults.length) * 100;

    // Generate recommendations
    if (overallScore < 70) {
      recommendations.push('Consider updating your browser for the best experience');
    }
    if (criticalFailures.length > 0) {
      recommendations.push('Some critical features are not supported - game may not function properly');
    }
    if (warnings.length > 3) {
      recommendations.push('Many optional features are not supported - consider using a modern browser');
    }

    const totalTime = performance.now() - startTime;
    console.log(`Compatibility tests completed in ${totalTime.toFixed(2)}ms`);

    return {
      browserInfo: this.getBrowserInfo(),
      testResults,
      overallScore,
      criticalFailures,
      warnings,
      recommendations
    };
  }

  /**
   * Get browser information
   */
  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  // Individual test implementations
  private async testWebGL(): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  private async testWebGL2(): Promise<boolean> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      return !!gl;
    } catch {
      return false;
    }
  }

  private async testWebAudio(): Promise<boolean> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return false;
      
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      return true;
    } catch {
      return false;
    }
  }

  private async testLocalStorage(): Promise<boolean> {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      const result = localStorage.getItem(test) === test;
      localStorage.removeItem(test);
      return result;
    } catch {
      return false;
    }
  }

  private async testIndexedDB(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(false);
        return;
      }

      try {
        const request = indexedDB.open('test', 1);
        request.onerror = () => resolve(false);
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('test');
          resolve(true);
        };
        request.onupgradeneeded = () => {
          request.result.createObjectStore('test');
        };
      } catch {
        resolve(false);
      }
    });
  }

  private async testServiceWorker(): Promise<boolean> {
    return 'serviceWorker' in navigator;
  }

  private async testWebAssembly(): Promise<boolean> {
    try {
      return 'WebAssembly' in window && typeof WebAssembly.instantiate === 'function';
    } catch {
      return false;
    }
  }

  private async testES6Modules(): Promise<boolean> {
    try {
      new Function('import("")');
      return true;
    } catch {
      return false;
    }
  }

  private async testFetch(): Promise<boolean> {
    return 'fetch' in window;
  }

  private async testPromises(): Promise<boolean> {
    return 'Promise' in window;
  }

  private async testRequestAnimationFrame(): Promise<boolean> {
    return 'requestAnimationFrame' in window;
  }

  private async testGamepad(): Promise<boolean> {
    return 'getGamepads' in navigator;
  }

  private async testFullscreen(): Promise<boolean> {
    const element = document.documentElement;
    return !!(
      element.requestFullscreen ||
      (element as any).webkitRequestFullscreen ||
      (element as any).mozRequestFullScreen ||
      (element as any).msRequestFullscreen
    );
  }

  private async testPointerLock(): Promise<boolean> {
    const element = document.documentElement;
    return !!(
      element.requestPointerLock ||
      (element as any).webkitRequestPointerLock ||
      (element as any).mozRequestPointerLock
    );
  }

  private async testWebWorkers(): Promise<boolean> {
    return 'Worker' in window;
  }

  /**
   * Run a specific test by name
   */
  async runTest(testName: string): Promise<CompatibilityTestResult> {
    const test = this.tests.find(t => t.name === testName);
    if (!test) {
      throw new Error(`Test '${testName}' not found`);
    }

    const startTime = performance.now();
    try {
      const passed = await test.test();
      return {
        testName: test.name,
        passed,
        performance: performance.now() - startTime
      };
    } catch (error) {
      return {
        testName: test.name,
        passed: false,
        error: (error as Error).message,
        performance: performance.now() - startTime
      };
    }
  }

  /**
   * Get list of all available tests
   */
  getAvailableTests(): { name: string; description: string; required: boolean }[] {
    return this.tests.map(test => ({
      name: test.name,
      description: test.description,
      required: test.required
    }));
  }
}