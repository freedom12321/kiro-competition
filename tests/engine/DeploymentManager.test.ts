import { DeploymentManager, createDefaultDeploymentConfig, DeploymentConfig } from '../../src/engine/DeploymentManager';

// Mock DOM elements
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => ({
      rel: '',
      href: '',
      as: '',
      crossOrigin: '',
      onload: null,
      onerror: null,
      httpEquiv: '',
      content: ''
    })),
    head: {
      appendChild: jest.fn()
    }
  }
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    hardwareConcurrency: 8,
    serviceWorker: {
      register: jest.fn().mockResolvedValue({ scope: '/' })
    }
  }
});

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000000 // 4GB
    }
  }
});

// Mock canvas and WebGL
const mockCanvas = {
  getContext: jest.fn((type: string) => {
    if (type === 'webgl' || type === 'experimental-webgl') {
      return { version: 'WebGL 1.0' };
    }
    if (type === 'webgl2') {
      return { version: 'WebGL 2.0' };
    }
    return null;
  })
};

Object.defineProperty(global, 'document', {
  value: {
    ...global.document,
    createElement: jest.fn((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return {
        rel: '',
        href: '',
        as: '',
        crossOrigin: '',
        onload: null,
        onerror: null,
        httpEquiv: '',
        content: ''
      };
    })
  }
});

// Mock WebAssembly
Object.defineProperty(global, 'WebAssembly', {
  value: {}
});

// Mock Worker
Object.defineProperty(global, 'Worker', {
  value: function Worker() {}
});

// Mock OffscreenCanvas
Object.defineProperty(global, 'OffscreenCanvas', {
  value: function OffscreenCanvas() {}
});

// Mock PerformanceObserver
Object.defineProperty(global, 'PerformanceObserver', {
  value: function PerformanceObserver() {}
});

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  value: function IntersectionObserver() {}
});

// Mock Storage
Object.defineProperty(global, 'Storage', {
  value: function Storage() {}
});

describe('DeploymentManager', () => {
  let deploymentManager: DeploymentManager;
  let mockConfig: DeploymentConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = createDefaultDeploymentConfig('development');
    deploymentManager = new DeploymentManager(mockConfig);
  });

  describe('Initialization', () => {
    it('should initialize with development config', () => {
      const devManager = new DeploymentManager(createDefaultDeploymentConfig('development'));
      const config = devManager.getConfig();
      
      expect(config.environment).toBe('development');
      expect(config.features.enableDebugMode).toBe(true);
      expect(config.analytics.enabled).toBe(false);
      expect(config.assets.enableCaching).toBe(false);
    });

    it('should initialize with production config', () => {
      const prodManager = new DeploymentManager(createDefaultDeploymentConfig('production'));
      const config = prodManager.getConfig();
      
      expect(config.environment).toBe('production');
      expect(config.features.enableDebugMode).toBe(false);
      expect(config.analytics.enabled).toBe(true);
      expect(config.assets.enableCaching).toBe(true);
      expect(config.assets.enableCompression).toBe(true);
    });

    it('should initialize with staging config', () => {
      const stagingManager = new DeploymentManager(createDefaultDeploymentConfig('staging'));
      const config = stagingManager.getConfig();
      
      expect(config.environment).toBe('staging');
      expect(config.features.enableDebugMode).toBe(true);
      expect(config.analytics.enabled).toBe(true);
      expect(config.assets.enableCaching).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should return configuration', () => {
      const config = deploymentManager.getConfig();
      
      expect(config.environment).toBe('development');
      expect(config.version).toBeDefined();
      expect(config.buildId).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should update configuration', () => {
      deploymentManager.updateConfig({
        version: '2.0.0',
        features: { ...mockConfig.features, enableAnalytics: false }
      });
      
      const config = deploymentManager.getConfig();
      expect(config.version).toBe('2.0.0');
      expect(config.features.enableAnalytics).toBe(false);
    });

    it('should enable and disable features', () => {
      deploymentManager.disableFeature('enableAnalytics');
      expect(deploymentManager.isFeatureEnabled('enableAnalytics')).toBe(false);
      
      deploymentManager.enableFeature('enableAnalytics');
      expect(deploymentManager.isFeatureEnabled('enableAnalytics')).toBe(true);
    });
  });

  describe('Build Information', () => {
    it('should provide build information', () => {
      const buildInfo = deploymentManager.getBuildInfo();
      
      expect(buildInfo.version).toBeDefined();
      expect(buildInfo.buildId).toBeDefined();
      expect(buildInfo.buildTime).toBeGreaterThan(0);
      expect(buildInfo.environment).toBe('development');
    });

    it('should include git information when available', () => {
      process.env.GIT_COMMIT = 'abc123';
      process.env.GIT_BRANCH = 'main';
      
      const manager = new DeploymentManager(mockConfig);
      const buildInfo = manager.getBuildInfo();
      
      expect(buildInfo.gitCommit).toBe('abc123');
      expect(buildInfo.gitBranch).toBe('main');
      
      delete process.env.GIT_COMMIT;
      delete process.env.GIT_BRANCH;
    });
  });

  describe('Compatibility Detection', () => {
    it('should detect browser compatibility', () => {
      const compatibilityInfo = deploymentManager.getCompatibilityInfo();
      
      expect(compatibilityInfo.browserSupport.chrome).toBeDefined();
      expect(compatibilityInfo.browserSupport.mobile).toBe(false);
    });

    it('should detect device support', () => {
      const compatibilityInfo = deploymentManager.getCompatibilityInfo();
      
      expect(compatibilityInfo.deviceSupport.webGL).toBe(true);
      expect(compatibilityInfo.deviceSupport.webGL2).toBe(true);
      expect(compatibilityInfo.deviceSupport.webAssembly).toBe(true);
    });

    it('should detect feature support', () => {
      const compatibilityInfo = deploymentManager.getCompatibilityInfo();
      
      expect(compatibilityInfo.featureSupport.localStorage).toBe(true);
      expect(compatibilityInfo.featureSupport.webWorkers).toBe(true);
      expect(compatibilityInfo.featureSupport.offscreenCanvas).toBe(true);
      expect(compatibilityInfo.featureSupport.performanceObserver).toBe(true);
      expect(compatibilityInfo.featureSupport.intersectionObserver).toBe(true);
    });

    it('should check overall compatibility', () => {
      // Mock WebGL support for test environment
      const mockCanvas = document.createElement('canvas');
      const mockContext = {
        getParameter: jest.fn(),
        getExtension: jest.fn()
      };
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext as any);
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      const compatibility = deploymentManager.checkCompatibility();
      
      expect(compatibility.isSupported).toBe(true);
      expect(Array.isArray(compatibility.warnings)).toBe(true);
      expect(Array.isArray(compatibility.errors)).toBe(true);
    });
  });

  describe('Asset Management', () => {
    it('should generate asset URLs', () => {
      const assetUrl = deploymentManager.getAssetUrl('models/device.json');
      
      expect(assetUrl).toContain('models/device.json');
    });

    it('should generate versioned asset URLs when caching is enabled', () => {
      const prodManager = new DeploymentManager(createDefaultDeploymentConfig('production'));
      const assetUrl = prodManager.getAssetUrl('models/device.json');
      
      expect(assetUrl).toContain('?v=');
    });

    it('should use CDN URL when configured', () => {
      const configWithCDN = {
        ...mockConfig,
        assets: {
          ...mockConfig.assets,
          cdnUrl: 'https://cdn.example.com'
        }
      };
      
      const manager = new DeploymentManager(configWithCDN);
      const assetUrl = manager.getAssetUrl('models/device.json');
      
      expect(assetUrl).toContain('https://cdn.example.com');
    });

    it('should preload assets', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      // Mock successful asset loading
      createElementSpy.mockImplementation((tagName) => {
        const element = document.createElement(tagName);
        setTimeout(() => {
          if (element.onload) element.onload({} as Event);
        }, 10);
        return element;
      });
      
      await deploymentManager.preloadAssets();
      
      expect(createElementSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
    }, 10000);

    it('should load assets lazily', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      
      // Mock successful asset loading
      createElementSpy.mockImplementation((tagName) => {
        const element = document.createElement(tagName);
        setTimeout(() => {
          if (element.onload) element.onload({} as Event);
        }, 10);
        return element;
      });
      
      await deploymentManager.loadAssetLazily('assets/models/advanced-devices.json');
      
      expect(createElementSpy).toHaveBeenCalled();
    }, 10000);
  });

  describe('Performance Recommendations', () => {
    it('should provide performance recommendations for high-end devices', () => {
      // Mock high-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 16 });
      
      const manager = new DeploymentManager(mockConfig);
      const recommendations = manager.getPerformanceRecommendations();
      
      expect(recommendations.qualityLevel).toBe('high');
      expect(recommendations.targetFPS).toBe(60);
      expect(recommendations.maxDevices).toBe(50);
    });

    it('should provide performance recommendations for low-end devices', () => {
      // Mock low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
      Object.defineProperty(performance, 'memory', {
        value: {
          jsHeapSizeLimit: 500000000 // 500MB
        },
        configurable: true
      });
      
      const manager = new DeploymentManager(mockConfig);
      const recommendations = manager.getPerformanceRecommendations();
      
      // With 2 cores and 500MB memory, score should be low
      expect(recommendations.qualityLevel).toBe('low');
      expect(recommendations.targetFPS).toBe(30);
      expect(recommendations.maxDevices).toBe(15);
    });
  });

  describe('Environment Information', () => {
    it('should provide environment information', () => {
      const envInfo = deploymentManager.getEnvironmentInfo();
      
      expect(envInfo.environment).toBe('development');
      expect(envInfo.version).toBeDefined();
      expect(envInfo.buildId).toBeDefined();
      expect(envInfo.features).toBeDefined();
      expect(envInfo.performance).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    it('should set up Content Security Policy in production', () => {
      const prodConfig = createDefaultDeploymentConfig('production');
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      new DeploymentManager(prodConfig);
      
      expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should not set up CSP in development', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      new DeploymentManager(mockConfig);
      
      // CSP should not be set up in development
      const cspCalls = appendChildSpy.mock.calls.filter(call => 
        call[0] && (call[0] as any).httpEquiv === 'Content-Security-Policy'
      );
      expect(cspCalls).toHaveLength(0);
    });
  });

  describe('Service Worker Registration', () => {
    it('should register service worker in production', () => {
      const prodConfig = createDefaultDeploymentConfig('production');
      const registerSpy = jest.spyOn(navigator.serviceWorker, 'register');
      
      new DeploymentManager(prodConfig);
      
      expect(registerSpy).toHaveBeenCalledWith('/sw.js');
    });

    it('should not register service worker in development', () => {
      const registerSpy = jest.spyOn(navigator.serviceWorker, 'register');
      
      new DeploymentManager(mockConfig);
      
      expect(registerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Feature Flag Adaptation', () => {
    it('should disable features based on compatibility', () => {
      // Mock environment without localStorage
      Object.defineProperty(global, 'Storage', { value: undefined });
      
      const manager = new DeploymentManager(mockConfig);
      
      expect(manager.isFeatureEnabled('enableSaveLoad')).toBe(false);
    });

    it('should disable advanced features on low-end devices', () => {
      // Mock very low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 1, configurable: true });
      Object.defineProperty(performance, 'memory', {
        value: {
          jsHeapSizeLimit: 100000000 // 100MB
        },
        configurable: true
      });
      
      // Mock no WebGL support to further reduce score
      const mockCanvas = document.createElement('canvas');
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(null);
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      const manager = new DeploymentManager(mockConfig);
      
      expect(manager.isFeatureEnabled('enableAdvancedScenarios')).toBe(false);
      expect(manager.isFeatureEnabled('enableBetaFeatures')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebGL detection errors gracefully', () => {
      // Mock canvas creation failure
      const originalCreateElement = document.createElement;
      (document.createElement as jest.Mock).mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          throw new Error('Canvas creation failed');
        }
        return originalCreateElement.call(document, tag);
      });
      
      expect(() => new DeploymentManager(mockConfig)).not.toThrow();
      
      // Restore original implementation
      (document.createElement as jest.Mock).mockImplementation(originalCreateElement);
    });

    it('should handle service worker registration failure', async () => {
      const prodConfig = createDefaultDeploymentConfig('production');
      const registerSpy = jest.spyOn(navigator.serviceWorker, 'register');
      registerSpy.mockRejectedValueOnce(new Error('Service worker registration failed'));
      
      expect(() => new DeploymentManager(prodConfig)).not.toThrow();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Asset Preloading Error Handling', () => {
    it('should handle asset preload failures gracefully', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      createElementSpy.mockImplementation((tagName) => {
        const element = document.createElement(tagName);
        setTimeout(() => {
          if (element.onerror) element.onerror({} as Event);
        }, 10);
        return element;
      });
      
      // Should not throw even if some assets fail to preload
      await expect(deploymentManager.preloadAssets()).resolves.not.toThrow();
    }, 10000);
  });
});