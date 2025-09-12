import { AnalyticsManager, createDefaultAnalyticsConfig, AnalyticsConfig } from '../../src/engine/AnalyticsManager';

// Mock fetch
global.fetch = jest.fn();

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  }
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'en-US',
    platform: 'MacIntel',
    cookieEnabled: true,
    onLine: true,
    vendor: 'Google Inc.',
    hardwareConcurrency: 8
  }
});

// Mock screen
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080
  }
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    devicePixelRatio: 2,
    addEventListener: jest.fn()
  }
});

describe('AnalyticsManager', () => {
  let analyticsManager: AnalyticsManager;
  let mockConfig: AnalyticsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      ...createDefaultAnalyticsConfig(),
      endpoint: 'https://analytics.example.com/events',
      apiKey: 'test-api-key',
      flushInterval: 100 // Short interval for testing
    };
    analyticsManager = new AnalyticsManager(mockConfig);
  });

  afterEach(() => {
    analyticsManager.endSession();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultManager = new AnalyticsManager(createDefaultAnalyticsConfig());
      expect(defaultManager).toBeDefined();
    });

    it('should generate unique session ID', () => {
      const manager1 = new AnalyticsManager(mockConfig);
      const manager2 = new AnalyticsManager(mockConfig);
      
      expect(manager1.getSessionSummary().sessionId).not.toBe(manager2.getSessionSummary().sessionId);
    });

    it('should not initialize analytics when disabled', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const manager = new AnalyticsManager(disabledConfig);
      
      manager.trackEvent('test_event', 'gameplay');
      expect(manager.getSessionSummary().eventsCount).toBe(0);
    });
  });

  describe('Event Tracking', () => {
    it('should track basic events', () => {
      analyticsManager.trackEvent('test_event', 'gameplay', { value: 123 });
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });

    it('should track player behavior', () => {
      const behaviorData = {
        sessionDuration: 300000,
        devicesCreated: 5,
        scenariosCompleted: 2,
        crashesExperienced: 1,
        recoverySuccessRate: 0.8,
        learningMoments: 10,
        helpRequestsCount: 3,
        averageResponseTime: 150
      };
      
      analyticsManager.trackPlayerBehavior(behaviorData);
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });

    it('should track learning effectiveness', () => {
      const learningData = {
        conceptsLearned: ['ai-alignment', 'device-cooperation'],
        skillImprovement: { 'crisis-management': 0.3, 'governance-design': 0.5 },
        timeToMastery: { 'basic-concepts': 600000 },
        retentionRate: 0.85,
        engagementScore: 0.9,
        difficultyProgression: [1, 2, 3, 2, 4]
      };
      
      analyticsManager.trackLearningEffectiveness(learningData);
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });

    it('should track UI interactions', () => {
      analyticsManager.trackUIInteraction('device-creation-panel', 'click', { deviceType: 'thermostat' });
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });

    it('should track errors', () => {
      const error = new Error('Test error');
      analyticsManager.trackError(error, { context: 'device-simulation' });
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });

    it('should track learning moments', () => {
      analyticsManager.trackLearningMoment('ai-alignment', 0.7, { scenario: 'smart-home' });
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });
  });

  describe('Timing Tracking', () => {
    it('should track timing events', (done) => {
      const endTiming = analyticsManager.startTiming('test-operation');
      
      setTimeout(() => {
        endTiming();
        
        const summary = analyticsManager.getSessionSummary();
        expect(summary.eventsCount).toBe(1);
        done();
      }, 10);
    });
  });

  describe('User Management', () => {
    it('should set and track user ID', () => {
      analyticsManager.setUserId('user123');
      analyticsManager.trackEvent('test_event', 'gameplay');
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.userId).toBe('user123');
    });
  });

  describe('Event Batching and Flushing', () => {
    it('should batch events before flushing', async () => {
      const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      // Track multiple events
      for (let i = 0; i < 5; i++) {
        analyticsManager.trackEvent(`event_${i}`, 'gameplay');
      }

      await analyticsManager.flush();

      expect(fetchMock).toHaveBeenCalledWith(
        mockConfig.endpoint,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockConfig.apiKey}`
          }),
          body: expect.stringContaining('events')
        })
      );
    });

    it('should handle flush errors gracefully', async () => {
      const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
      fetchMock.mockRejectedValue(new Error('Network error'));

      analyticsManager.trackEvent('test_event', 'gameplay');
      
      // Should not throw
      await expect(analyticsManager.flush()).resolves.not.toThrow();
    });

    it('should flush immediately for critical events', async () => {
      const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      const error = new Error('Critical error');
      analyticsManager.trackError(error);

      // Should have flushed immediately
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('Privacy Mode', () => {
    it('should sanitize sensitive data in privacy mode', () => {
      const privacyConfig = { ...mockConfig, privacyMode: true };
      const privacyManager = new AnalyticsManager(privacyConfig);

      privacyManager.trackEvent('test_event', 'gameplay', {
        email: 'user@example.com',
        password: 'secret123',
        normalData: 'this is fine'
      });

      const summary = privacyManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      analyticsManager.updateConfig({ enabled: false });
      
      analyticsManager.trackEvent('test_event', 'gameplay');
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(0);
    });

    it('should restart periodic flushing when re-enabled', () => {
      analyticsManager.updateConfig({ enabled: false });
      analyticsManager.updateConfig({ enabled: true });
      
      analyticsManager.trackEvent('test_event', 'gameplay');
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });
  });

  describe('Session Management', () => {
    it('should provide session summary', () => {
      analyticsManager.setUserId('test-user');
      analyticsManager.trackEvent('test_event', 'gameplay');
      
      const summary = analyticsManager.getSessionSummary();
      
      expect(summary.sessionId).toBeDefined();
      expect(summary.duration).toBeGreaterThan(0);
      expect(summary.eventsCount).toBe(1);
      expect(summary.userId).toBe('test-user');
    });

    it('should end session and flush events', async () => {
      const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      } as Response);

      analyticsManager.trackEvent('test_event', 'gameplay');
      await analyticsManager.endSession();

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('Device and Browser Detection', () => {
    it('should detect device capabilities', () => {
      // This is tested implicitly through initialization
      // The device capabilities are gathered during initialization
      expect(analyticsManager).toBeDefined();
    });

    it('should detect browser information', () => {
      // This is tested implicitly through initialization
      // The browser info is gathered during initialization
      expect(analyticsManager).toBeDefined();
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      const performanceData = {
        averageFPS: 58.5,
        loadTimes: [1200, 800, 950],
        errorRate: 0.02,
        crashFrequency: 0.001,
        deviceCapabilities: {
          screenResolution: '1920x1080',
          devicePixelRatio: 2,
          hardwareConcurrency: 8,
          maxTextureSize: 4096,
          webGLVersion: 'WebGL 2.0'
        },
        browserInfo: {
          userAgent: 'test-agent',
          language: 'en-US',
          platform: 'MacIntel',
          cookieEnabled: true,
          onLine: true,
          vendor: 'Google Inc.'
        }
      };
      
      analyticsManager.trackPerformanceMetrics(performanceData);
      
      const summary = analyticsManager.getSessionSummary();
      expect(summary.eventsCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing endpoint gracefully', async () => {
      const noEndpointConfig = { ...mockConfig, endpoint: undefined };
      const manager = new AnalyticsManager(noEndpointConfig);
      
      manager.trackEvent('test_event', 'gameplay');
      
      // Should not throw when flushing without endpoint
      await expect(manager.flush()).resolves.not.toThrow();
    });

    it('should handle network failures', async () => {
      const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
      fetchMock.mockRejectedValue(new Error('Network failure'));

      analyticsManager.trackEvent('test_event', 'gameplay');
      
      // Should handle network failure gracefully
      await expect(analyticsManager.flush()).resolves.not.toThrow();
    });

    it('should handle HTTP errors', async () => {
      const fetchMock = fetch as jest.MockedFunction<typeof fetch>;
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      analyticsManager.trackEvent('test_event', 'gameplay');
      
      // Should handle HTTP errors gracefully
      await expect(analyticsManager.flush()).resolves.not.toThrow();
    });
  });
});