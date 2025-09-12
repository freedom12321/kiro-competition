import { BuildOptimizer, BuildConfig, OptimizationResult } from '../../src/engine/BuildOptimizer';

describe('BuildOptimizer', () => {
  let buildOptimizer: BuildOptimizer;
  let mockConfig: BuildConfig;

  beforeEach(() => {
    mockConfig = {
      target: 'production',
      optimization: {
        minify: true,
        compress: true,
        treeshake: true,
        splitChunks: true,
        inlineAssets: false
      },
      assets: {
        imageOptimization: true,
        audioCompression: true,
        modelCompression: true,
        textureCompression: true
      },
      caching: {
        enableServiceWorker: true,
        cacheStrategy: 'stale-while-revalidate',
        maxCacheSize: 50 * 1024 * 1024 // 50MB
      },
      analytics: {
        enabled: true,
        endpoint: 'https://analytics.example.com',
        sampleRate: 0.1
      }
    };

    buildOptimizer = new BuildOptimizer(mockConfig);

    // Mock crypto for hash generation
    Object.defineProperty(global, 'crypto', {
      value: {
        subtle: {
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
        },
        randomBytes: jest.fn().mockReturnValue(Buffer.from('12345678', 'hex'))
      }
    });
  });

  describe('Build Configuration', () => {
    test('should initialize with provided configuration', () => {
      const config = buildOptimizer.getConfig();
      
      expect(config.target).toBe('production');
      expect(config.optimization.minify).toBe(true);
      expect(config.assets.imageOptimization).toBe(true);
      expect(config.caching.enableServiceWorker).toBe(true);
    });

    test('should allow configuration updates', () => {
      const updates = {
        target: 'staging' as const,
        optimization: {
          ...mockConfig.optimization,
          minify: false
        }
      };

      buildOptimizer.updateConfig(updates);
      const config = buildOptimizer.getConfig();
      
      expect(config.target).toBe('staging');
      expect(config.optimization.minify).toBe(false);
    });
  });

  describe('Asset Manifest Generation', () => {
    test('should generate asset manifest with version and build time', async () => {
      const manifest = await buildOptimizer.generateAssetManifest();
      
      expect(manifest).toHaveProperty('version');
      expect(manifest).toHaveProperty('assets');
      expect(manifest).toHaveProperty('chunks');
      expect(typeof manifest.version).toBe('string');
      expect(manifest.version.length).toBeGreaterThan(0);
    });

    test('should categorize assets by type and priority', async () => {
      const manifest = await buildOptimizer.generateAssetManifest();
      
      const assets = Object.values(manifest.assets);
      
      // Check that we have different asset types
      const scriptAssets = assets.filter(asset => asset.type === 'script');
      const styleAssets = assets.filter(asset => asset.type === 'style');
      const imageAssets = assets.filter(asset => asset.type === 'image');
      const audioAssets = assets.filter(asset => asset.type === 'audio');
      const modelAssets = assets.filter(asset => asset.type === 'model');
      
      expect(scriptAssets.length).toBeGreaterThan(0);
      expect(styleAssets.length).toBeGreaterThan(0);
      expect(imageAssets.length).toBeGreaterThan(0);
      expect(audioAssets.length).toBeGreaterThan(0);
      expect(modelAssets.length).toBeGreaterThan(0);
      
      // Check that we have different priorities
      const criticalAssets = assets.filter(asset => asset.priority === 'critical');
      const highAssets = assets.filter(asset => asset.priority === 'high');
      const mediumAssets = assets.filter(asset => asset.priority === 'medium');
      const lowAssets = assets.filter(asset => asset.priority === 'low');
      
      expect(criticalAssets.length).toBeGreaterThan(0);
      expect(highAssets.length).toBeGreaterThan(0);
      expect(mediumAssets.length).toBeGreaterThan(0);
      expect(lowAssets.length).toBeGreaterThan(0);
    });

    test('should generate chunks with dependencies', async () => {
      const manifest = await buildOptimizer.generateAssetManifest();
      
      expect(manifest.chunks).toHaveProperty('main');
      expect(manifest.chunks).toHaveProperty('engine');
      expect(manifest.chunks).toHaveProperty('assets');
      expect(manifest.chunks).toHaveProperty('audio');
      
      // Check chunk structure
      const mainChunk = manifest.chunks.main;
      expect(mainChunk).toHaveProperty('files');
      expect(mainChunk).toHaveProperty('dependencies');
      expect(mainChunk).toHaveProperty('size');
      expect(Array.isArray(mainChunk.files)).toBe(true);
      expect(Array.isArray(mainChunk.dependencies)).toBe(true);
      expect(typeof mainChunk.size).toBe('number');
      
      // Check that engine chunk depends on main
      const engineChunk = manifest.chunks.engine;
      expect(engineChunk.dependencies).toContain('main');
    });

    test('should include asset hashes for integrity checking', async () => {
      const manifest = await buildOptimizer.generateAssetManifest();
      
      const assets = Object.values(manifest.assets);
      assets.forEach(asset => {
        expect(asset).toHaveProperty('hash');
        expect(typeof asset.hash).toBe('string');
        expect(asset.hash.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Build Optimization', () => {
    test('should optimize build and return results', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('optimizedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('buildTime');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');
      
      expect(typeof result.originalSize).toBe('number');
      expect(typeof result.optimizedSize).toBe('number');
      expect(typeof result.compressionRatio).toBe('number');
      expect(typeof result.buildTime).toBe('number');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should apply image optimization when enabled', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      expect(result.originalSize).toBeGreaterThan(result.optimizedSize);
      expect(result.warnings).toContain('Image optimization completed - converted to WebP format');
    });

    test('should apply audio compression when enabled', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      expect(result.warnings).toContain('Audio compression completed - converted to OGG Vorbis');
    });

    test('should apply model compression when enabled', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      expect(result.warnings).toContain('Model compression completed - applied Draco compression');
    });

    test('should apply texture compression when enabled', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      expect(result.warnings).toContain('Texture compression completed - applied KTX2 compression');
    });

    test('should calculate compression ratio correctly', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      if (result.originalSize > 0) {
        const expectedRatio = (result.originalSize - result.optimizedSize) / result.originalSize;
        expect(result.compressionRatio).toBeCloseTo(expectedRatio, 2);
      }
    });

    test('should skip optimizations when disabled', async () => {
      const disabledConfig = {
        ...mockConfig,
        assets: {
          imageOptimization: false,
          audioCompression: false,
          modelCompression: false,
          textureCompression: false
        }
      };

      const optimizer = new BuildOptimizer(disabledConfig);
      const result = await optimizer.optimizeBuild();
      
      expect(result.warnings).not.toContain('Image optimization completed');
      expect(result.warnings).not.toContain('Audio compression completed');
      expect(result.warnings).not.toContain('Model compression completed');
      expect(result.warnings).not.toContain('Texture compression completed');
    });
  });

  describe('Service Worker Generation', () => {
    test('should generate service worker when enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await buildOptimizer.optimizeBuild();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Generated service worker:')
      );
      
      consoleSpy.mockRestore();
    });

    test('should skip service worker generation when disabled', async () => {
      const disabledConfig = {
        ...mockConfig,
        caching: {
          ...mockConfig.caching,
          enableServiceWorker: false
        }
      };

      const optimizer = new BuildOptimizer(disabledConfig);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await optimizer.optimizeBuild();
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Generated service worker:')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Version Generation', () => {
    test('should generate unique versions', async () => {
      const manifest1 = await buildOptimizer.generateAssetManifest();
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const manifest2 = await buildOptimizer.generateAssetManifest();
      
      expect(manifest1.version).not.toBe(manifest2.version);
    });

    test('should generate version with timestamp and hash', async () => {
      const manifest = await buildOptimizer.generateAssetManifest();
      
      // Version should contain date and hash separated by dash
      const versionParts = manifest.version.split('-');
      expect(versionParts.length).toBeGreaterThanOrEqual(2);
      
      // First part should be date-like
      expect(versionParts[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Last part should be hash-like
      expect(versionParts[versionParts.length - 1]).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Error Handling', () => {
    test('should handle optimization errors gracefully', async () => {
      // Mock an error during optimization
      const errorConfig = {
        ...mockConfig,
        assets: {
          ...mockConfig.assets,
          imageOptimization: true
        }
      };

      const optimizer = new BuildOptimizer(errorConfig);
      
      // Override a method to throw an error
      (optimizer as any).optimizeImages = jest.fn().mockRejectedValue(
        new Error('Image optimization failed')
      );

      const result = await optimizer.optimizeBuild();
      
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Build optimization failed');
    });

    test('should continue optimization even if some steps fail', async () => {
      const optimizer = new BuildOptimizer(mockConfig);
      
      // Mock one optimization step to fail
      (optimizer as any).optimizeImages = jest.fn().mockRejectedValue(
        new Error('Image optimization failed')
      );

      const result = await optimizer.optimizeBuild();
      
      // Should still complete other optimizations
      expect(result.buildTime).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking', () => {
    test('should track build time', async () => {
      const startTime = performance.now();
      const result = await buildOptimizer.optimizeBuild();
      const endTime = performance.now();
      
      expect(result.buildTime).toBeGreaterThan(0);
      expect(result.buildTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });

    test('should provide meaningful optimization metrics', async () => {
      const result = await buildOptimizer.optimizeBuild();
      
      // Should have processed some assets
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.optimizedSize).toBeGreaterThan(0);
      
      // Compression ratio should be reasonable
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
    });
  });
});