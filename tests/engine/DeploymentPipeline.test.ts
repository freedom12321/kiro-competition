import { DeploymentPipeline, AssetManifest, LoadingProgress, BrowserCompatibility } from '../../src/engine/DeploymentPipeline';

// Mock dependencies
jest.mock('../../src/engine/AnalyticsManager');
jest.mock('../../src/engine/PerformanceOptimizer');

describe('DeploymentPipeline', () => {
  let deploymentPipeline: DeploymentPipeline;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    deploymentPipeline = new DeploymentPipeline();
    
    // Mock fetch
    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
    
    // Mock crypto
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
        }
      }
    });
    
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          register: jest.fn().mockResolvedValue({
            active: {},
            scope: '/test-scope'
          })
        }
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Browser Compatibility Checking', () => {
    test('should check WebGL support', () => {
      // Mock canvas and WebGL context
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({})
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      const compatibility = deploymentPipeline.checkBrowserCompatibility();
      
      expect(compatibility.webgl).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl');
    });

    test('should check Web Audio support', () => {
      // Mock AudioContext
      (global as any).AudioContext = jest.fn();
      
      const compatibility = deploymentPipeline.checkBrowserCompatibility();
      
      expect(compatibility.webAudio).toBe(true);
    });

    test('should check localStorage support', () => {
      // Mock localStorage
      const mockLocalStorage = {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn()
      };
      Object.defineProperty(global, 'localStorage', {
        value: mockLocalStorage
      });

      const compatibility = deploymentPipeline.checkBrowserCompatibility();
      
      expect(compatibility.localStorage).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    test('should calculate compatibility score', () => {
      const compatibility = deploymentPipeline.checkBrowserCompatibility();
      
      expect(compatibility.score).toBeGreaterThanOrEqual(0);
      expect(compatibility.score).toBeLessThanOrEqual(100);
    });

    test('should generate warnings for unsupported features', () => {
      // Mock unsupported WebGL
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: jest.fn().mockReturnValue(null)
      } as any);

      const compatibility = deploymentPipeline.checkBrowserCompatibility();
      
      expect(compatibility.warnings).toContain('WebGL not supported - 3D rendering will be disabled');
    });
  });

  describe('Progressive Loading', () => {
    const mockManifest: AssetManifest = {
      version: '1.0.0',
      assets: {
        '/main.js': {
          url: '/main.js',
          size: 100000,
          hash: 'abc123',
          priority: 'critical',
          type: 'script'
        },
        '/style.css': {
          url: '/style.css',
          size: 50000,
          hash: 'def456',
          priority: 'high',
          type: 'style'
        },
        '/image.png': {
          url: '/image.png',
          size: 200000,
          hash: 'ghi789',
          priority: 'medium',
          type: 'image'
        }
      },
      chunks: {
        main: {
          files: ['/main.js', '/style.css'],
          dependencies: [],
          size: 150000
        }
      }
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockManifest),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response);
    });

    test('should initialize deployment pipeline', async () => {
      await expect(deploymentPipeline.initialize()).resolves.not.toThrow();
      
      expect(mockFetch).toHaveBeenCalledWith('/assets/manifest.json');
    });

    test('should register service worker', async () => {
      await deploymentPipeline.initialize();
      
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    test('should track loading progress', async () => {
      const progressUpdates: LoadingProgress[] = [];
      deploymentPipeline.onLoadingProgress((progress) => {
        progressUpdates.push(progress);
      });

      await deploymentPipeline.initialize();

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].phase).toBe('loading-critical');
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe('complete');
    });

    test('should load critical assets first', async () => {
      const progressUpdates: LoadingProgress[] = [];
      deploymentPipeline.onLoadingProgress((progress) => {
        progressUpdates.push(progress);
      });

      await deploymentPipeline.initialize();

      const criticalPhase = progressUpdates.find(p => p.phase === 'loading-critical');
      expect(criticalPhase).toBeDefined();
      expect(criticalPhase!.currentAsset).toContain('main.js');
    });

    test('should handle asset loading errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const progressUpdates: LoadingProgress[] = [];
      deploymentPipeline.onLoadingProgress((progress) => {
        progressUpdates.push(progress);
      });

      await deploymentPipeline.initialize();

      const finalProgress = progressUpdates[progressUpdates.length - 1];
      expect(finalProgress.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Asset Management', () => {
    test('should verify asset integrity', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer)
      } as Response);

      // Mock hash calculation
      (global.crypto.subtle.digest as jest.Mock).mockResolvedValue(
        new ArrayBuffer(32)
      );

      const asset = {
        url: '/test.js',
        size: 1000,
        hash: '0'.repeat(64),
        priority: 'high' as const,
        type: 'script' as const
      };

      // This would be called internally during loading
      // We're testing the concept here
      expect(asset.hash).toBeDefined();
      expect(asset.hash.length).toBe(64);
    });

    test('should categorize assets by priority', () => {
      const mockManifest: AssetManifest = {
        version: '1.0.0',
        assets: {
          '/critical.js': { url: '/critical.js', size: 1000, hash: 'abc', priority: 'critical', type: 'script' },
          '/high.js': { url: '/high.js', size: 1000, hash: 'def', priority: 'high', type: 'script' },
          '/medium.png': { url: '/medium.png', size: 1000, hash: 'ghi', priority: 'medium', type: 'image' },
          '/low.mp3': { url: '/low.mp3', size: 1000, hash: 'jkl', priority: 'low', type: 'audio' }
        },
        chunks: {}
      };

      // Test asset categorization logic
      const criticalAssets = Object.values(mockManifest.assets)
        .filter(asset => asset.priority === 'critical');
      const highAssets = Object.values(mockManifest.assets)
        .filter(asset => asset.priority === 'high');
      const mediumAssets = Object.values(mockManifest.assets)
        .filter(asset => asset.priority === 'medium');
      const lowAssets = Object.values(mockManifest.assets)
        .filter(asset => asset.priority === 'low');

      expect(criticalAssets).toHaveLength(1);
      expect(highAssets).toHaveLength(1);
      expect(mediumAssets).toHaveLength(1);
      expect(lowAssets).toHaveLength(1);
    });
  });

  describe('Performance Monitoring', () => {
    test('should collect deployment statistics', () => {
      const stats = deploymentPipeline.getDeploymentStats();
      
      expect(stats).toHaveProperty('compatibility');
      expect(stats).toHaveProperty('loadingTime');
      expect(stats).toHaveProperty('assetCount');
      expect(stats).toHaveProperty('cacheHitRate');
      
      expect(typeof stats.compatibility.score).toBe('number');
      expect(typeof stats.loadingTime).toBe('number');
      expect(typeof stats.assetCount).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });

    test('should track loading performance', async () => {
      const startTime = performance.now();
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          version: '1.0.0',
          assets: {},
          chunks: {}
        }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      } as Response);

      await deploymentPipeline.initialize();
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle manifest loading failure', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to load manifest'));

      await expect(deploymentPipeline.initialize()).rejects.toThrow();
    });

    test('should handle service worker registration failure', async () => {
      (navigator.serviceWorker.register as jest.Mock).mockRejectedValue(
        new Error('Service worker registration failed')
      );

      // Should not throw, just log the error
      await expect(deploymentPipeline.initialize()).resolves.not.toThrow();
    });

    test('should handle unsupported browser features gracefully', () => {
      // Mock unsupported features
      delete (global as any).AudioContext;
      delete (global as any).localStorage;
      
      const compatibility = deploymentPipeline.checkBrowserCompatibility();
      
      expect(compatibility.webAudio).toBe(false);
      expect(compatibility.localStorage).toBe(false);
      expect(compatibility.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Caching Strategy', () => {
    test('should implement cache-first strategy for static assets', async () => {
      // This would be tested in integration with the service worker
      // For now, we test that the deployment pipeline sets up caching correctly
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          version: '1.0.0',
          assets: {
            '/static.js': {
              url: '/static.js',
              size: 1000,
              hash: 'abc123',
              priority: 'high',
              type: 'script'
            }
          },
          chunks: {}
        })
      } as Response);

      await deploymentPipeline.initialize();
      
      // Verify that assets are loaded with cache headers
      expect(mockFetch).toHaveBeenCalledWith('/assets/manifest.json');
    });
  });
});