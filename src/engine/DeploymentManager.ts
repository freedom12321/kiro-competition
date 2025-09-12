export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  buildId: string;
  features: FeatureFlags;
  assets: AssetConfig;
  analytics: AnalyticsConfig;
  performance: PerformanceConfig;
  security: SecurityConfig;
}

export interface FeatureFlags {
  enableAnalytics: boolean;
  enableSaveLoad: boolean;
  enableSharing: boolean;
  enableTutorials: boolean;
  enableAdvancedScenarios: boolean;
  enablePerformanceOptimization: boolean;
  enableDebugMode: boolean;
  enableBetaFeatures: boolean;
}

export interface AssetConfig {
  baseUrl: string;
  cdnUrl?: string;
  enableCompression: boolean;
  enableCaching: boolean;
  cacheVersion: string;
  preloadAssets: string[];
  lazyLoadAssets: string[];
}

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  trackingId?: string;
  enableUserTracking: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
}

export interface PerformanceConfig {
  enableOptimization: boolean;
  targetFPS: number;
  maxDevices: number;
  enableLOD: boolean;
  enableCulling: boolean;
  enableInstancing: boolean;
  memoryLimit: number;
}

export interface SecurityConfig {
  enableCSP: boolean;
  allowedOrigins: string[];
  enableSRI: boolean;
  enableHTTPS: boolean;
  enableCORS: boolean;
}

export interface BuildInfo {
  version: string;
  buildId: string;
  buildTime: number;
  gitCommit?: string;
  gitBranch?: string;
  environment: string;
}

export interface CompatibilityInfo {
  browserSupport: BrowserSupport;
  deviceSupport: DeviceSupport;
  featureSupport: FeatureSupport;
}

export interface BrowserSupport {
  chrome: string;
  firefox: string;
  safari: string;
  edge: string;
  mobile: boolean;
}

export interface DeviceSupport {
  minRAM: number;
  minCPU: string;
  webGL: boolean;
  webGL2: boolean;
  webAssembly: boolean;
}

export interface FeatureSupport {
  localStorage: boolean;
  webWorkers: boolean;
  offscreenCanvas: boolean;
  performanceObserver: boolean;
  intersectionObserver: boolean;
}

export class DeploymentManager {
  private config: DeploymentConfig;
  private buildInfo: BuildInfo;
  private compatibilityInfo: CompatibilityInfo;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.buildInfo = this.generateBuildInfo();
    this.compatibilityInfo = this.detectCompatibility();
    
    this.initializeDeployment();
  }

  private initializeDeployment(): void {
    // Set up environment-specific configurations
    this.configureEnvironment();
    
    // Initialize feature flags
    this.initializeFeatureFlags();
    
    // Set up asset loading
    this.configureAssetLoading();
    
    // Initialize security measures
    this.configureSecurity();
    
    // Set up performance monitoring
    this.configurePerformanceMonitoring();
  }

  public getConfig(): DeploymentConfig {
    return { ...this.config };
  }

  public getBuildInfo(): BuildInfo {
    return { ...this.buildInfo };
  }

  public getCompatibilityInfo(): CompatibilityInfo {
    return { ...this.compatibilityInfo };
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  public getAssetUrl(assetPath: string): string {
    const baseUrl = this.config.assets.cdnUrl || this.config.assets.baseUrl;
    const versionedPath = this.config.assets.enableCaching ? 
      `${assetPath}?v=${this.config.assets.cacheVersion}` : 
      assetPath;
    
    return `${baseUrl}/${versionedPath}`;
  }

  public async preloadAssets(): Promise<void> {
    const preloadPromises = this.config.assets.preloadAssets.map(asset => 
      this.preloadAsset(this.getAssetUrl(asset))
    );
    
    try {
      await Promise.all(preloadPromises);
      console.log('All critical assets preloaded successfully');
    } catch (error) {
      console.error('Failed to preload some assets:', error);
    }
  }

  public async loadAssetLazily(assetPath: string): Promise<void> {
    if (this.config.assets.lazyLoadAssets.includes(assetPath)) {
      await this.preloadAsset(this.getAssetUrl(assetPath));
    }
  }

  public checkCompatibility(): {
    isSupported: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    let isSupported = true;

    // Check browser support
    if (!this.compatibilityInfo.featureSupport.webGL) {
      errors.push('WebGL is not supported');
      isSupported = false;
    }

    if (!this.compatibilityInfo.featureSupport.localStorage) {
      warnings.push('localStorage is not available - save/load features will be limited');
    }

    if (!this.compatibilityInfo.featureSupport.webWorkers) {
      warnings.push('Web Workers not supported - performance may be reduced');
    }

    // Check device capabilities
    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo && memoryInfo.jsHeapSizeLimit < this.config.performance.memoryLimit) {
      warnings.push('Device may have limited memory - consider reducing quality settings');
    }

    return { isSupported, warnings, errors };
  }

  public getPerformanceRecommendations(): {
    targetFPS: number;
    maxDevices: number;
    enableLOD: boolean;
    qualityLevel: 'low' | 'medium' | 'high';
  } {
    const deviceScore = this.calculateDeviceScore();
    
    if (deviceScore >= 0.8) {
      return {
        targetFPS: 60,
        maxDevices: 50,
        enableLOD: false,
        qualityLevel: 'high'
      };
    } else if (deviceScore >= 0.5) {
      return {
        targetFPS: 45,
        maxDevices: 30,
        enableLOD: true,
        qualityLevel: 'medium'
      };
    } else {
      return {
        targetFPS: 30,
        maxDevices: 15,
        enableLOD: true,
        qualityLevel: 'low'
      };
    }
  }

  public updateConfig(updates: Partial<DeploymentConfig>): void {
    this.config = { ...this.config, ...updates };
    this.configureEnvironment();
  }

  public enableFeature(feature: keyof FeatureFlags): void {
    this.config.features[feature] = true;
  }

  public disableFeature(feature: keyof FeatureFlags): void {
    this.config.features[feature] = false;
  }

  public getEnvironmentInfo(): {
    environment: string;
    version: string;
    buildId: string;
    features: FeatureFlags;
    performance: PerformanceConfig;
  } {
    return {
      environment: this.config.environment,
      version: this.config.version,
      buildId: this.config.buildId,
      features: { ...this.config.features },
      performance: { ...this.config.performance }
    };
  }

  private configureEnvironment(): void {
    switch (this.config.environment) {
      case 'development':
        this.config.features.enableDebugMode = true;
        this.config.analytics.enabled = false;
        this.config.assets.enableCaching = false;
        break;
      
      case 'staging':
        this.config.features.enableDebugMode = true;
        this.config.analytics.enabled = true;
        this.config.assets.enableCaching = true;
        break;
      
      case 'production':
        this.config.features.enableDebugMode = false;
        this.config.analytics.enabled = true;
        this.config.assets.enableCaching = true;
        this.config.assets.enableCompression = true;
        break;
    }
  }

  private initializeFeatureFlags(): void {
    // Apply compatibility-based feature flags
    if (!this.compatibilityInfo.featureSupport.localStorage) {
      this.config.features.enableSaveLoad = false;
    }

    if (!this.compatibilityInfo.featureSupport.webWorkers) {
      this.config.features.enablePerformanceOptimization = false;
    }

    // Apply performance-based feature flags
    const deviceScore = this.calculateDeviceScore();
    if (deviceScore < 0.3) {
      this.config.features.enableAdvancedScenarios = false;
      this.config.features.enableBetaFeatures = false;
    }
  }

  private configureAssetLoading(): void {
    if (this.config.assets.enableCaching) {
      this.setupAssetCaching();
    }

    if (this.config.assets.enableCompression) {
      this.setupAssetCompression();
    }
  }

  private configureSecurity(): void {
    if (this.config.security.enableCSP) {
      this.setupContentSecurityPolicy();
    }

    if (this.config.security.enableCORS) {
      this.setupCORSHeaders();
    }
  }

  private configurePerformanceMonitoring(): void {
    if (this.config.performance.enableOptimization) {
      // Performance monitoring is handled by PerformanceOptimizer
      console.log('Performance optimization enabled');
    }
  }

  private generateBuildInfo(): BuildInfo {
    return {
      version: this.config.version,
      buildId: this.config.buildId,
      buildTime: Date.now(),
      environment: this.config.environment,
      // In a real build system, these would be injected
      gitCommit: process.env.GIT_COMMIT,
      gitBranch: process.env.GIT_BRANCH
    };
  }

  private detectCompatibility(): CompatibilityInfo {
    return {
      browserSupport: this.detectBrowserSupport(),
      deviceSupport: this.detectDeviceSupport(),
      featureSupport: this.detectFeatureSupport()
    };
  }

  private detectBrowserSupport(): BrowserSupport {
    const userAgent = navigator.userAgent;
    
    return {
      chrome: this.extractVersion(userAgent, /Chrome\/(\d+)/),
      firefox: this.extractVersion(userAgent, /Firefox\/(\d+)/),
      safari: this.extractVersion(userAgent, /Safari\/(\d+)/),
      edge: this.extractVersion(userAgent, /Edge\/(\d+)/),
      mobile: /Mobile|Android|iPhone|iPad/.test(userAgent)
    };
  }

  private detectDeviceSupport(): DeviceSupport {
    return {
      minRAM: 2048, // 2GB minimum
      minCPU: 'dual-core',
      webGL: this.isWebGLSupported(),
      webGL2: this.isWebGL2Supported(),
      webAssembly: this.isWebAssemblySupported()
    };
  }

  private detectFeatureSupport(): FeatureSupport {
    return {
      localStorage: typeof Storage !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      performanceObserver: typeof PerformanceObserver !== 'undefined',
      intersectionObserver: typeof IntersectionObserver !== 'undefined'
    };
  }

  private extractVersion(userAgent: string, regex: RegExp): string {
    const match = userAgent.match(regex);
    return match ? match[1] : 'unknown';
  }

  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private isWebGL2Supported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch {
      return false;
    }
  }

  private isWebAssemblySupported(): boolean {
    return typeof WebAssembly !== 'undefined';
  }

  private calculateDeviceScore(): number {
    let score = 0;
    
    // CPU score
    const cores = navigator.hardwareConcurrency || 1;
    score += Math.min(cores / 8, 0.3); // Max 0.3 for CPU
    
    // Memory score
    const memoryInfo = this.getMemoryInfo();
    if (memoryInfo) {
      const memoryGB = memoryInfo.jsHeapSizeLimit / (1024 * 1024 * 1024);
      score += Math.min(memoryGB / 8, 0.3); // Max 0.3 for memory
    }
    
    // WebGL score
    if (this.compatibilityInfo.deviceSupport.webGL2) {
      score += 0.2;
    } else if (this.compatibilityInfo.deviceSupport.webGL) {
      score += 0.1;
    }
    
    // Feature support score
    const features = this.compatibilityInfo.featureSupport;
    const supportedFeatures = Object.values(features).filter(Boolean).length;
    score += (supportedFeatures / Object.keys(features).length) * 0.2;
    
    return Math.min(score, 1.0);
  }

  private getMemoryInfo(): { jsHeapSizeLimit: number; usedJSHeapSize: number; totalJSHeapSize: number } | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  private async preloadAsset(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      // Determine asset type
      if (url.endsWith('.js')) {
        link.as = 'script';
      } else if (url.endsWith('.css')) {
        link.as = 'style';
      } else if (url.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        link.as = 'image';
      } else if (url.match(/\.(woff|woff2|ttf|otf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      }
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${url}`));
      
      document.head.appendChild(link);
    });
  }

  private setupAssetCaching(): void {
    // Set up service worker for asset caching
    if ('serviceWorker' in navigator && this.config.environment === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  private setupAssetCompression(): void {
    // Asset compression is typically handled at build time
    console.log('Asset compression enabled');
  }

  private setupContentSecurityPolicy(): void {
    if (this.config.security.enableCSP) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "connect-src 'self' " + this.config.security.allowedOrigins.join(' '),
        "font-src 'self'",
        "media-src 'self'"
      ].join('; ');
      
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = csp;
      document.head.appendChild(meta);
    }
  }

  private setupCORSHeaders(): void {
    // CORS headers are typically set by the server
    console.log('CORS configuration enabled');
  }
}

export const createDefaultDeploymentConfig = (environment: DeploymentConfig['environment']): DeploymentConfig => ({
  environment,
  version: '1.0.0',
  buildId: `build_${Date.now()}`,
  features: {
    enableAnalytics: true,
    enableSaveLoad: true,
    enableSharing: true,
    enableTutorials: true,
    enableAdvancedScenarios: true,
    enablePerformanceOptimization: true,
    enableDebugMode: environment === 'development',
    enableBetaFeatures: environment !== 'production'
  },
  assets: {
    baseUrl: '',
    enableCompression: environment === 'production',
    enableCaching: environment !== 'development',
    cacheVersion: '1.0.0',
    preloadAssets: [
      'assets/models/device-library.json',
      'assets/textures/ui-sprites.png',
      'assets/audio/ui-sounds.mp3'
    ],
    lazyLoadAssets: [
      'assets/models/advanced-devices.json',
      'assets/textures/environment-textures.png'
    ]
  },
  analytics: {
    enabled: environment !== 'development',
    enableUserTracking: true,
    enablePerformanceTracking: true,
    enableErrorTracking: true
  },
  performance: {
    enableOptimization: true,
    targetFPS: 60,
    maxDevices: 50,
    enableLOD: true,
    enableCulling: true,
    enableInstancing: true,
    memoryLimit: 512 * 1024 * 1024 // 512MB
  },
  security: {
    enableCSP: environment === 'production',
    allowedOrigins: ['https://api.aihabitat.com'],
    enableSRI: environment === 'production',
    enableHTTPS: environment === 'production',
    enableCORS: true
  }
});