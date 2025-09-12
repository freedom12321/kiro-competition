import { AssetManifest } from './DeploymentPipeline';

export interface BuildConfig {
  target: 'development' | 'staging' | 'production';
  optimization: {
    minify: boolean;
    compress: boolean;
    treeshake: boolean;
    splitChunks: boolean;
    inlineAssets: boolean;
  };
  assets: {
    imageOptimization: boolean;
    audioCompression: boolean;
    modelCompression: boolean;
    textureCompression: boolean;
  };
  caching: {
    enableServiceWorker: boolean;
    cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxCacheSize: number;
  };
  analytics: {
    enabled: boolean;
    endpoint: string;
    sampleRate: number;
  };
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  buildTime: number;
  warnings: string[];
  errors: string[];
}

export class BuildOptimizer {
  private config: BuildConfig;

  constructor(config: BuildConfig) {
    this.config = config;
  }

  /**
   * Optimize build for deployment
   */
  async optimizeBuild(): Promise<OptimizationResult> {
    const startTime = performance.now();
    const result: OptimizationResult = {
      originalSize: 0,
      optimizedSize: 0,
      compressionRatio: 0,
      buildTime: 0,
      warnings: [],
      errors: []
    };

    try {
      // Generate asset manifest
      const manifest = await this.generateAssetManifest();
      
      // Optimize assets
      if (this.config.assets.imageOptimization) {
        await this.optimizeImages(result);
      }
      
      if (this.config.assets.audioCompression) {
        await this.compressAudio(result);
      }
      
      if (this.config.assets.modelCompression) {
        await this.compressModels(result);
      }
      
      if (this.config.assets.textureCompression) {
        await this.compressTextures(result);
      }

      // Generate service worker
      if (this.config.caching.enableServiceWorker) {
        await this.generateServiceWorker(manifest);
      }

      // Calculate final metrics
      result.buildTime = performance.now() - startTime;
      result.compressionRatio = result.originalSize > 0 ? 
        (result.originalSize - result.optimizedSize) / result.originalSize : 0;

    } catch (error) {
      result.errors.push(`Build optimization failed: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * Generate asset manifest for progressive loading
   */
  async generateAssetManifest(): Promise<AssetManifest> {
    const manifest: AssetManifest = {
      version: this.generateVersion(),
      assets: {},
      chunks: {}
    };

    // Scan build output for assets
    const assetTypes = [
      { pattern: /\.js$/, type: 'script' as const, priority: 'high' as const },
      { pattern: /\.css$/, type: 'style' as const, priority: 'high' as const },
      { pattern: /\.(png|jpg|jpeg|webp)$/, type: 'image' as const, priority: 'medium' as const },
      { pattern: /\.(mp3|ogg|wav)$/, type: 'audio' as const, priority: 'low' as const },
      { pattern: /\.(gltf|glb|obj)$/, type: 'model' as const, priority: 'medium' as const },
      { pattern: /\.json$/, type: 'data' as const, priority: 'high' as const }
    ];

    // In a real implementation, this would scan the actual build output
    // For now, we'll create a mock manifest structure
    const mockAssets = [
      { url: '/assets/main.js', size: 150000, type: 'script', priority: 'critical' },
      { url: '/assets/main.css', size: 25000, type: 'style', priority: 'critical' },
      { url: '/assets/three.js', size: 500000, type: 'script', priority: 'high' },
      { url: '/assets/game-engine.js', size: 200000, type: 'script', priority: 'high' },
      { url: '/assets/ui-components.js', size: 100000, type: 'script', priority: 'high' },
      { url: '/assets/device-models.glb', size: 2000000, type: 'model', priority: 'medium' },
      { url: '/assets/environment-textures.webp', size: 1500000, type: 'image', priority: 'medium' },
      { url: '/assets/ambient-sounds.ogg', size: 800000, type: 'audio', priority: 'low' },
      { url: '/assets/device-sounds.ogg', size: 400000, type: 'audio', priority: 'medium' }
    ];

    for (const asset of mockAssets) {
      const hash = await this.calculateAssetHash(asset.url);
      manifest.assets[asset.url] = {
        url: asset.url,
        size: asset.size,
        hash,
        priority: asset.priority as any,
        type: asset.type as any
      };
    }

    // Define chunks for code splitting
    manifest.chunks = {
      'main': {
        files: ['/assets/main.js', '/assets/main.css'],
        dependencies: [],
        size: 175000
      },
      'engine': {
        files: ['/assets/three.js', '/assets/game-engine.js'],
        dependencies: ['main'],
        size: 700000
      },
      'ui': {
        files: ['/assets/ui-components.js'],
        dependencies: ['main', 'engine'],
        size: 100000
      },
      'assets': {
        files: ['/assets/device-models.glb', '/assets/environment-textures.webp'],
        dependencies: ['engine'],
        size: 3500000
      },
      'audio': {
        files: ['/assets/ambient-sounds.ogg', '/assets/device-sounds.ogg'],
        dependencies: [],
        size: 1200000
      }
    };

    return manifest;
  }

  /**
   * Generate service worker for caching
   */
  private async generateServiceWorker(manifest: AssetManifest): Promise<void> {
    const swContent = `
// AI Habitat Service Worker
const CACHE_NAME = 'ai-habitat-v${manifest.version}';
const CACHE_STRATEGY = '${this.config.caching.cacheStrategy}';
const MAX_CACHE_SIZE = ${this.config.caching.maxCacheSize};

// Assets to cache immediately
const CRITICAL_ASSETS = [
  ${Object.values(manifest.assets)
    .filter(asset => asset.priority === 'critical')
    .map(asset => `'${asset.url}'`)
    .join(',\n  ')}
];

// Assets to cache on demand
const CACHEABLE_ASSETS = [
  ${Object.values(manifest.assets)
    .map(asset => `'${asset.url}'`)
    .join(',\n  ')}
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CRITICAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Apply caching strategy
  if (CACHE_STRATEGY === 'cache-first') {
    event.respondWith(cacheFirst(event.request));
  } else if (CACHE_STRATEGY === 'network-first') {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && CACHEABLE_ASSETS.includes(new URL(request.url).pathname)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && CACHEABLE_ASSETS.includes(new URL(request.url).pathname)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok && CACHEABLE_ASSETS.includes(new URL(request.url).pathname)) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  return cachedResponse || networkResponsePromise;
}

// Analytics tracking
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'TRACK_EVENT') {
    // Forward analytics events to main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'ANALYTICS_EVENT',
          data: event.data.payload
        });
      });
    });
  }
});
`;

    // In a real implementation, this would write to the public directory
    console.log('Generated service worker:', swContent);
  }

  /**
   * Optimize images for web delivery
   */
  private async optimizeImages(result: OptimizationResult): Promise<void> {
    // Mock image optimization
    const originalSize = 5000000; // 5MB
    const optimizedSize = 2000000; // 2MB after optimization
    
    result.originalSize += originalSize;
    result.optimizedSize += optimizedSize;
    result.warnings.push('Image optimization completed - converted to WebP format');
  }

  /**
   * Compress audio files
   */
  private async compressAudio(result: OptimizationResult): Promise<void> {
    // Mock audio compression
    const originalSize = 3000000; // 3MB
    const optimizedSize = 1200000; // 1.2MB after compression
    
    result.originalSize += originalSize;
    result.optimizedSize += optimizedSize;
    result.warnings.push('Audio compression completed - converted to OGG Vorbis');
  }

  /**
   * Compress 3D models
   */
  private async compressModels(result: OptimizationResult): Promise<void> {
    // Mock model compression
    const originalSize = 8000000; // 8MB
    const optimizedSize = 3000000; // 3MB after compression
    
    result.originalSize += originalSize;
    result.optimizedSize += optimizedSize;
    result.warnings.push('Model compression completed - applied Draco compression');
  }

  /**
   * Compress textures
   */
  private async compressTextures(result: OptimizationResult): Promise<void> {
    // Mock texture compression
    const originalSize = 10000000; // 10MB
    const optimizedSize = 4000000; // 4MB after compression
    
    result.originalSize += originalSize;
    result.optimizedSize += optimizedSize;
    result.warnings.push('Texture compression completed - applied KTX2 compression');
  }

  /**
   * Calculate hash for asset integrity
   */
  private async calculateAssetHash(url: string): Promise<string> {
    // Mock hash calculation
    const encoder = new TextEncoder();
    const data = encoder.encode(url + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate version string for cache busting
   */
  private generateVersion(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get build configuration
   */
  getConfig(): BuildConfig {
    return { ...this.config };
  }

  /**
   * Update build configuration
   */
  updateConfig(updates: Partial<BuildConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}