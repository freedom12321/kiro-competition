export interface AnalyticsEvent {
  name: string;
  category: 'gameplay' | 'learning' | 'performance' | 'ui' | 'error';
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface PlayerBehaviorData {
  sessionDuration: number;
  devicesCreated: number;
  scenariosCompleted: number;
  crashesExperienced: number;
  recoverySuccessRate: number;
  learningMoments: number;
  helpRequestsCount: number;
  averageResponseTime: number;
}

export interface LearningEffectivenessData {
  conceptsLearned: string[];
  skillImprovement: Record<string, number>;
  timeToMastery: Record<string, number>;
  retentionRate: number;
  engagementScore: number;
  difficultyProgression: number[];
}

export interface PerformanceAnalytics {
  averageFPS: number;
  loadTimes: number[];
  errorRate: number;
  crashFrequency: number;
  deviceCapabilities: DeviceCapabilities;
  browserInfo: BrowserInfo;
}

export interface DeviceCapabilities {
  screenResolution: string;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  maxTextureSize: number;
  webGLVersion: string;
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
  vendor: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number;
  enablePerformanceTracking: boolean;
  enableLearningAnalytics: boolean;
  enableErrorTracking: boolean;
  privacyMode: boolean;
}

export class AnalyticsManager {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: number;
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    
    if (this.config.enabled) {
      this.initializeAnalytics();
    }
  }

  private initializeAnalytics(): void {
    // Start periodic flushing
    this.startPeriodicFlush();
    
    // Initialize performance tracking
    if (this.config.enablePerformanceTracking) {
      this.initializePerformanceTracking();
    }
    
    // Initialize error tracking
    if (this.config.enableErrorTracking) {
      this.initializeErrorTracking();
    }
    
    // Track session start
    this.trackEvent('session_start', 'gameplay', {
      deviceCapabilities: this.getDeviceCapabilities(),
      browserInfo: this.getBrowserInfo()
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public trackEvent(name: string, category: AnalyticsEvent['category'], properties: Record<string, any> = {}): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      name,
      category,
      properties: this.config.privacyMode ? this.sanitizeProperties(properties) : properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.eventQueue.push(event);

    // Flush immediately for critical events
    if (this.isCriticalEvent(name)) {
      this.flush();
    } else if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  public trackPlayerBehavior(data: PlayerBehaviorData): void {
    this.trackEvent('player_behavior', 'gameplay', data);
  }

  public trackLearningEffectiveness(data: LearningEffectivenessData): void {
    this.trackEvent('learning_effectiveness', 'learning', data);
  }

  public trackPerformanceMetrics(data: PerformanceAnalytics): void {
    this.trackEvent('performance_metrics', 'performance', data);
  }

  public trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error', 'error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: context || {}
    });
  }

  public trackUIInteraction(element: string, action: string, properties: Record<string, any> = {}): void {
    this.trackEvent('ui_interaction', 'ui', {
      element,
      action,
      ...properties
    });
  }

  public trackGameplayEvent(eventType: string, properties: Record<string, any> = {}): void {
    this.trackEvent(eventType, 'gameplay', properties);
  }

  public trackLearningMoment(concept: string, understanding: number, context: Record<string, any> = {}): void {
    this.trackEvent('learning_moment', 'learning', {
      concept,
      understanding,
      context
    });
  }

  public startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.trackEvent('timing', 'performance', {
        name,
        duration
      });
    };
  }

  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.config.enabled) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events for retry (with limit to prevent infinite growth)
      if (this.eventQueue.length < 1000) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  public getSessionSummary(): {
    sessionId: string;
    duration: number;
    eventsCount: number;
    userId?: string;
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      eventsCount: this.eventQueue.length,
      userId: this.userId
    };
  }

  public updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (!this.config.enabled && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    } else if (this.config.enabled && !this.flushTimer) {
      this.startPeriodicFlush();
    }
  }

  public async endSession(): Promise<void> {
    this.trackEvent('session_end', 'gameplay', {
      duration: Date.now() - this.sessionStartTime,
      eventsCount: this.eventQueue.length
    });
    
    await this.flush();
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private initializePerformanceTracking(): void {
    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackEvent('page_load', 'performance', {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        });
      }

      // Set up performance observer for ongoing monitoring
      if ('PerformanceObserver' in window) {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.trackEvent('performance_measure', 'performance', {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          }
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure'] });
      }
    }
  }

  private initializeErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error || new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          type: 'unhandledrejection'
        });
      });
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      // If no endpoint is configured, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics events:', events);
      }
      return;
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify({
        events,
        sessionId: this.sessionId,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Analytics request failed: ${response.status} ${response.statusText}`);
    }
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = ['error', 'crash', 'session_end'];
    return criticalEvents.includes(eventName);
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Remove potentially sensitive data
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && this.containsSensitiveData(value)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = ['password', 'email', 'phone', 'address', 'ssn', 'credit'];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  private containsSensitiveData(value: string): boolean {
    // Basic patterns for sensitive data
    const patterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
    ];
    
    return patterns.some(pattern => pattern.test(value));
  }

  private getDeviceCapabilities(): DeviceCapabilities {
    const capabilities: DeviceCapabilities = {
      screenResolution: `${screen.width}x${screen.height}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      maxTextureSize: 0,
      webGLVersion: 'unknown'
    };

    // Get WebGL info
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        capabilities.webGLVersion = 'WebGL 1.0';
        capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      } else {
        const gl2 = canvas.getContext('webgl2');
        if (gl2) {
          capabilities.webGLVersion = 'WebGL 2.0';
          capabilities.maxTextureSize = gl2.getParameter(gl2.MAX_TEXTURE_SIZE);
        }
      }
    } catch (error) {
      // WebGL not supported
    }

    // Get memory info if available
    if ('memory' in performance) {
      capabilities.memoryInfo = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      };
    }

    return capabilities;
  }

  private getBrowserInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      vendor: navigator.vendor || 'unknown'
    };
  }

  private getFirstPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint?.startTime;
  }

  private getFirstContentfulPaint(): number | undefined {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint?.startTime;
  }
}

export const createDefaultAnalyticsConfig = (): AnalyticsConfig => ({
  enabled: true,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  enablePerformanceTracking: true,
  enableLearningAnalytics: true,
  enableErrorTracking: true,
  privacyMode: false
});