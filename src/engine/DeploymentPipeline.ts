import { AnalyticsManager } from './AnalyticsManager';
import { PerformanceOptimizer } from './PerformanceOptimizer';

export interface AssetManifest {
  version: string;
  assets: {
    [key: string]: {
      url: string;
      size: number;
      hash: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      type: 'script' | 'style' | 'image' | 'audio' | 'model' | 'data';
    };
  };
  chunks: {
    [key: string]: {
      files: string[];
      dependencies: string[];
      size: number;
    };
  };
}

export interface LoadingProgress {
  phase: 'initializing' | 'loading-critical' | 'loading-core' | 'loading-assets' | 'complete';
  progress: number;
  currentAsset?: string;
  totalAssets: number;
  loadedAssets: number;
  errors: string[];
}

export interface BrowserCompatibility {
  webgl: boolean;
  webgl2: boolean;
  webAudio: boolean;
  localStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  webAssembly: boolean;
  es6Modules: boolean;
  score: number;
  warnings: string[];
}

export class DeploymentPipeline {
  private analytics: AnalyticsManager;
  private performanceOptimizer: PerformanceOptimizer;
  private assetManifest: AssetManifest | null = null;
  private loadingCallbacks: ((progress: LoadingProgress) => void)[] = [];
  private serviceWorker: ServiceWorker | null = null;

  constructor() {
    this.analytics = new AnalyticsManager();
    this.performanceOptimizer = new PerformanceOptimizer();
  }

  /**
   * Initialize the deployment pipeline and start progressive loading
   */
  async initialize(): Promise<void> {
    try {
      // Check browser compatibility
      const compatibility = this.checkBrowserCompatibility();
      this.analytics.trackEvent('deployment_init', {
        compatibility_score: compatibility.score,
        warnings: compatibility.warnings
      });

      // Register service worker for caching
      await this.registerServiceWorker();

      // Load asset manifest
      await this.loadAssetManifest();

      // Start progressive loading
      await this.startProgressiveLoading();

    } catch (error) {
      this.analytics.trackError('deployment_init_failed', error as Error);
      throw error;
    }
  }

  /**
   * Check browser compatibility and feature support
   */
  checkBrowserCompatibility(): BrowserCompatibility {
    const compatibility: BrowserCompatibility = {
      webgl: this.checkWebGLSupport(),
      webgl2: this.checkWebGL2Support(),
      webAudio: this.checkWebAudioSupport(),
      localStorage: this.checkLocalStorageSupport(),
      indexedDB: this.checkIndexedDBSupport(),
      serviceWorker: this.checkServiceWorkerSupport(),
      webAssembly: this.checkWebAssemblySupport(),
      es6Modules: this.checkES6ModuleSupport(),
      score: 0,
      warnings: []
    };

    // Calculate compatibility score
    const features = Object.keys(compatibility).filter(key => key !== 'score' && key !== 'warnings');
    const supportedFeatures = features.filter(key => compatibility[key as keyof BrowserCompatibility] === true);
    compatibility.score = (supportedFeatures.length / features.length) * 100;

    // Generate warnings for unsupported features
    if (!compatibility.webgl) {
      compatibility.warnings.push('WebGL not supported - 3D rendering will be disabled');
    }
    if (!compatibility.webAudio) {
      compatibility.warnings.push('Web Audio API not supported - audio features will be limited');
    }
    if (!compatibility.serviceWorker) {
      compatibility.warnings.push('Service Worker not supported - offline functionality disabled');
    }

    return compatibility;
  }

  /**
   * Register service worker for asset caching and offline support
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorker = registration.active;
      
      this.analytics.trackEvent('service_worker_registered', {
        scope: registration.scope
      });
    } catch (error) {
      this.analytics.trackError('service_worker_registration_failed', error as Error);
    }
  }

  /**
   * Load asset manifest for progressive loading
   */
  private async loadAssetManifest(): Promise<void> {
    try {
      const response = await fetch('/assets/manifest.json');
      this.assetManifest = await response.json();
      
      this.analytics.trackEvent('asset_manifest_loaded', {
        version: this.assetManifest.version,
        total_assets: Object.keys(this.assetManifest.assets).length
      });
    } catch (error) {
      this.analytics.trackError('asset_manifest_load_failed', error as Error);
      throw new Error('Failed to load asset manifest');
    }
  }

  /**
   * Start progressive loading of game assets
   */
  private async startProgressiveLoading(): Promise<void> {
    if (!this.assetManifest) {
      throw new Error('Asset manifest not loaded');
    }

    const startTime = performance.now();
    const totalAssets = Object.keys(this.assetManifest.assets).length;
    let loadedAssets = 0;
    const errors: string[] = [];

    // Phase 1: Load critical assets
    this.notifyProgress({
      phase: 'loading-critical',
      progress: 0,
      totalAssets,
      loadedAssets,
      errors
    });

    const criticalAssets = this.getCriticalAssets();
    for (const asset of criticalAssets) {
      try {
        await this.loadAsset(asset);
        loadedAssets++;
        this.notifyProgress({
          phase: 'loading-critical',
          progress: (loadedAssets / totalAssets) * 100,
          currentAsset: asset.url,
          totalAssets,
          loadedAssets,
          errors
        });
      } catch (error) {
        errors.push(`Failed to load critical asset: ${asset.url}`);
        this.analytics.trackError('critical_asset_load_failed', error as Error, {
          asset_url: asset.url
        });
      }
    }

    // Phase 2: Load core game assets
    this.notifyProgress({
      phase: 'loading-core',
      progress: (loadedAssets / totalAssets) * 100,
      totalAssets,
      loadedAssets,
      errors
    });

    const coreAssets = this.getCoreAssets();
    await this.loadAssetsInParallel(coreAssets, (asset, error) => {
      if (error) {
        errors.push(`Failed to load core asset: ${asset.url}`);
      } else {
        loadedAssets++;
      }
      this.notifyProgress({
        phase: 'loading-core',
        progress: (loadedAssets / totalAssets) * 100,
        currentAsset: asset.url,
        totalAssets,
        loadedAssets,
        errors
      });
    });

    // Phase 3: Load remaining assets in background
    this.notifyProgress({
      phase: 'loading-assets',
      progress: (loadedAssets / totalAssets) * 100,
      totalAssets,
      loadedAssets,
      errors
    });

    const remainingAssets = this.getRemainingAssets();
    this.loadAssetsInBackground(remainingAssets, (asset, error) => {
      if (error) {
        errors.push(`Failed to load asset: ${asset.url}`);
      } else {
        loadedAssets++;
      }
      this.notifyProgress({
        phase: loadedAssets === totalAssets ? 'complete' : 'loading-assets',
        progress: (loadedAssets / totalAssets) * 100,
        currentAsset: asset.url,
        totalAssets,
        loadedAssets,
        errors
      });
    });

    const loadTime = performance.now() - startTime;
    this.analytics.trackEvent('progressive_loading_complete', {
      load_time: loadTime,
      total_assets: totalAssets,
      loaded_assets: loadedAssets,
      error_count: errors.length
    });
  }

  /**
   * Load a single asset with caching and error handling
   */
  private async loadAsset(asset: AssetManifest['assets'][string]): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(asset.url, {
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Verify asset integrity if hash is provided
      if (asset.hash) {
        const arrayBuffer = await response.arrayBuffer();
        const hash = await this.calculateHash(arrayBuffer);
        if (hash !== asset.hash) {
          throw new Error('Asset integrity check failed');
        }
      }

      const loadTime = performance.now() - startTime;
      this.analytics.trackEvent('asset_loaded', {
        url: asset.url,
        type: asset.type,
        size: asset.size,
        load_time: loadTime
      });

    } catch (error) {
      this.analytics.trackError('asset_load_failed', error as Error, {
        asset_url: asset.url,
        asset_type: asset.type
      });
      throw error;
    }
  }

  /**
   * Load multiple assets in parallel with concurrency control
   */
  private async loadAssetsInParallel(
    assets: AssetManifest['assets'][string][],
    onProgress: (asset: AssetManifest['assets'][string], error?: Error) => void,
    maxConcurrency: number = 6
  ): Promise<void> {
    const semaphore = new Array(maxConcurrency).fill(null);
    let index = 0;

    const loadNext = async (): Promise<void> => {
      if (index >= assets.length) return;
      
      const asset = assets[index++];
      try {
        await this.loadAsset(asset);
        onProgress(asset);
      } catch (error) {
        onProgress(asset, error as Error);
      }
      
      await loadNext();
    };

    await Promise.all(semaphore.map(() => loadNext()));
  }

  /**
   * Load assets in background with low priority
   */
  private loadAssetsInBackground(
    assets: AssetManifest['assets'][string][],
    onProgress: (asset: AssetManifest['assets'][string], error?: Error) => void
  ): void {
    const loadAsset = async (asset: AssetManifest['assets'][string]) => {
      try {
        // Use requestIdleCallback for background loading
        await new Promise(resolve => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(resolve);
          } else {
            setTimeout(resolve, 0);
          }
        });
        
        await this.loadAsset(asset);
        onProgress(asset);
      } catch (error) {
        onProgress(asset, error as Error);
      }
    };

    assets.forEach(asset => loadAsset(asset));
  }

  /**
   * Get critical assets that must be loaded first
   */
  private getCriticalAssets(): AssetManifest['assets'][string][] {
    if (!this.assetManifest) return [];
    
    return Object.values(this.assetManifest.assets)
      .filter(asset => asset.priority === 'critical')
      .sort((a, b) => a.size - b.size); // Load smaller assets first
  }

  /**
   * Get core game assets needed for basic functionality
   */
  private getCoreAssets(): AssetManifest['assets'][string][] {
    if (!this.assetManifest) return [];
    
    return Object.values(this.assetManifest.assets)
      .filter(asset => asset.priority === 'high')
      .sort((a, b) => a.size - b.size);
  }

  /**
   * Get remaining assets for background loading
   */
  private getRemainingAssets(): AssetManifest['assets'][string][] {
    if (!this.assetManifest) return [];
    
    return Object.values(this.assetManifest.assets)
      .filter(asset => asset.priority === 'medium' || asset.priority === 'low')
      .sort((a, b) => a.size - b.size);
  }

  /**
   * Calculate hash for asset integrity verification
   */
  private async calculateHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Register callback for loading progress updates
   */
  onLoadingProgress(callback: (progress: LoadingProgress) => void): void {
    this.loadingCallbacks.push(callback);
  }

  /**
   * Notify all registered callbacks of loading progress
   */
  private notifyProgress(progress: LoadingProgress): void {
    this.loadingCallbacks.forEach(callback => callback(progress));
  }

  // Browser compatibility check methods
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch {
      return false;
    }
  }

  private checkWebAudioSupport(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  private checkLocalStorageSupport(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private checkIndexedDBSupport(): boolean {
    return !!window.indexedDB;
  }

  private checkServiceWorkerSupport(): boolean {
    return 'serviceWorker' in navigator;
  }

  private checkWebAssemblySupport(): boolean {
    return 'WebAssembly' in window;
  }

  private checkES6ModuleSupport(): boolean {
    try {
      new Function('import("")');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get deployment statistics for analytics
   */
  getDeploymentStats(): {
    compatibility: BrowserCompatibility;
    loadingTime: number;
    assetCount: number;
    cacheHitRate: number;
  } {
    return {
      compatibility: this.checkBrowserCompatibility(),
      loadingTime: this.performanceOptimizer.getMetrics().averageFrameTime,
      assetCount: this.assetManifest ? Object.keys(this.assetManifest.assets).length : 0,
      cacheHitRate: 0 // Would be calculated from actual cache statistics
    };
  }
}