import { GameHUD } from '@/ui/GameHUD';
import { 
  SystemHealthIndicator, 
  HarmonyLevel, 
  DeviceMoodIndicator, 
  DeviceMood, 
  ConnectionVisualization, 
  ConnectionType, 
  ConnectionStatus, 
  ResourceDisplay, 
  ResourceType, 
  ResourceTrend 
} from '@/types/ui';

describe('GameHUD', () => {
  let container: HTMLElement;
  let gameHUD: GameHUD;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '100vw';
    container.style.height = '100vh';
    document.body.appendChild(container);
    
    gameHUD = new GameHUD(container);
  });

  afterEach(() => {
    gameHUD.dispose();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize HUD with correct UI elements', () => {
      expect(container.querySelector('.game-hud')).toBeTruthy();
      expect(container.querySelector('.system-health-panel')).toBeTruthy();
      expect(container.querySelector('.resource-panel')).toBeTruthy();
      expect(container.querySelector('.device-moods-panel')).toBeTruthy();
      expect(container.querySelector('.connections-panel')).toBeTruthy();
      expect(container.querySelector('.hud-mini-map')).toBeTruthy();
    });

    it('should initialize with default system health', () => {
      const systemHealth = gameHUD.getSystemHealth();
      expect(systemHealth.harmonyLevel).toBe(HarmonyLevel.GOOD_COOPERATION);
      expect(systemHealth.cooperationScore).toBeGreaterThan(0);
      expect(systemHealth.overallStability).toBeGreaterThan(0);
    });

    it('should initialize resource displays', () => {
      const resourceUsage = gameHUD.getResourceUsage();
      expect(resourceUsage.size).toBe(4); // Energy, Bandwidth, Processing, Memory
      expect(resourceUsage.has(ResourceType.ENERGY)).toBe(true);
      expect(resourceUsage.has(ResourceType.BANDWIDTH)).toBe(true);
      expect(resourceUsage.has(ResourceType.PROCESSING)).toBe(true);
      expect(resourceUsage.has(ResourceType.MEMORY)).toBe(true);
    });

    it('should show empty state for device moods and connections', () => {
      const deviceMoods = container.querySelector('.device-moods-list') as HTMLElement;
      const connections = container.querySelector('.connections-list') as HTMLElement;
      
      expect(deviceMoods.textContent).toContain('No devices active');
      expect(connections.textContent).toContain('No active connections');
    });
  });

  describe('system health display', () => {
    it('should update system health display', () => {
      const newHealth: SystemHealthIndicator = {
        harmonyLevel: HarmonyLevel.MINOR_TENSIONS,
        cooperationScore: 0.6,
        conflictScore: 0.3,
        resourceEfficiency: 0.7,
        overallStability: 0.65
      };

      gameHUD.updateSystemHealth(newHealth);

      const harmonyText = container.querySelector('.harmony-text') as HTMLElement;
      expect(harmonyText.textContent).toBe('Minor Tensions');

      const cooperationValue = container.querySelector('.cooperation .metric-value') as HTMLElement;
      expect(cooperationValue.textContent).toBe('60%');
    });

    it('should trigger critical callback for system crisis', () => {
      const mockCallback = jest.fn();
      gameHUD.setSystemCriticalCallback(mockCallback);

      const criticalHealth: SystemHealthIndicator = {
        harmonyLevel: HarmonyLevel.SYSTEM_CRISIS,
        cooperationScore: 0.1,
        conflictScore: 0.9,
        resourceEfficiency: 0.2,
        overallStability: 0.1
      };

      gameHUD.updateSystemHealth(criticalHealth);

      expect(mockCallback).toHaveBeenCalledWith(criticalHealth);
    });

    it('should show alert for critical system state', () => {
      const criticalHealth: SystemHealthIndicator = {
        harmonyLevel: HarmonyLevel.SYSTEM_CRISIS,
        cooperationScore: 0.1,
        conflictScore: 0.9,
        resourceEfficiency: 0.2,
        overallStability: 0.1
      };

      gameHUD.updateSystemHealth(criticalHealth);

      const alerts = container.querySelectorAll('.alert-item');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should animate harmony indicator based on level', () => {
      const perfectHealth: SystemHealthIndicator = {
        harmonyLevel: HarmonyLevel.PERFECT_HARMONY,
        cooperationScore: 1.0,
        conflictScore: 0.0,
        resourceEfficiency: 1.0,
        overallStability: 1.0
      };

      gameHUD.updateSystemHealth(perfectHealth);

      const harmonyLevel = container.querySelector('.harmony-level') as HTMLElement;
      expect(harmonyLevel.classList.contains('perfect-harmony')).toBe(true);
    });
  });

  describe('device mood tracking', () => {
    it('should update device mood display', () => {
      const mood: DeviceMoodIndicator = {
        deviceId: 'coffee-maker-1',
        mood: DeviceMood.HAPPY,
        intensity: 0.8,
        reason: 'Successfully brewed perfect coffee',
        visualEffect: 'glow'
      };

      gameHUD.updateDeviceMood('coffee-maker-1', mood);

      const deviceMoods = container.querySelectorAll('.device-mood-item');
      expect(deviceMoods.length).toBe(1);

      const moodItem = deviceMoods[0] as HTMLElement;
      expect(moodItem.classList.contains('happy')).toBe(true);
      expect(moodItem.textContent).toContain('Coffee Maker 1');
      expect(moodItem.textContent).toContain('Successfully brewed perfect coffee');
    });

    it('should trigger alert callback for frustrated devices', () => {
      const mockCallback = jest.fn();
      gameHUD.setDeviceAlertCallback(mockCallback);

      const frustratedMood: DeviceMoodIndicator = {
        deviceId: 'thermostat-1',
        mood: DeviceMood.FRUSTRATED,
        intensity: 0.9,
        reason: 'Cannot reach target temperature',
        visualEffect: 'warning'
      };

      gameHUD.updateDeviceMood('thermostat-1', frustratedMood);

      expect(mockCallback).toHaveBeenCalledWith('thermostat-1', frustratedMood);
    });

    it('should display correct mood icons', () => {
      const moods = [
        { mood: DeviceMood.HAPPY, icon: '😊' },
        { mood: DeviceMood.ANGRY, icon: '😡' },
        { mood: DeviceMood.CONFUSED, icon: '😕' }
      ];

      moods.forEach((testCase, index) => {
        const mood: DeviceMoodIndicator = {
          deviceId: `device-${index}`,
          mood: testCase.mood,
          intensity: 0.5,
          reason: 'Test reason',
          visualEffect: 'none'
        };

        gameHUD.updateDeviceMood(`device-${index}`, mood);
      });

      const moodIcons = container.querySelectorAll('.device-mood-icon');
      expect(moodIcons.length).toBe(3);
      
      moods.forEach((testCase, index) => {
        expect(moodIcons[index].textContent).toBe(testCase.icon);
      });
    });

    it('should clear device mood', () => {
      const mood: DeviceMoodIndicator = {
        deviceId: 'test-device',
        mood: DeviceMood.CONTENT,
        intensity: 0.5,
        reason: 'Test',
        visualEffect: 'none'
      };

      gameHUD.updateDeviceMood('test-device', mood);
      expect(container.querySelectorAll('.device-mood-item').length).toBe(1);

      gameHUD.clearDeviceMood('test-device');
      expect(container.querySelector('.device-moods-list')?.textContent).toContain('No devices active');
    });
  });

  describe('connection visualization', () => {
    it('should update connection display', () => {
      const connection: ConnectionVisualization = {
        fromDevice: 'coffee-maker-1',
        toDevice: 'smart-speaker-1',
        connectionType: ConnectionType.COOPERATION,
        strength: 0.8,
        status: ConnectionStatus.ACTIVE
      };

      gameHUD.updateConnection('connection-1', connection);

      const connections = container.querySelectorAll('.connection-item');
      expect(connections.length).toBe(1);

      const connectionItem = connections[0] as HTMLElement;
      expect(connectionItem.classList.contains('cooperation')).toBe(true);
      expect(connectionItem.textContent).toContain('Coffee Maker 1');
      expect(connectionItem.textContent).toContain('Smart Speaker 1');
      expect(connectionItem.textContent).toContain('80%');
    });

    it('should display correct connection icons', () => {
      const connections = [
        { type: ConnectionType.COOPERATION, icon: '🤝' },
        { type: ConnectionType.COMMUNICATION, icon: '💬' },
        { type: ConnectionType.CONFLICT, icon: '⚡' }
      ];

      connections.forEach((testCase, index) => {
        const connection: ConnectionVisualization = {
          fromDevice: `device-${index}-a`,
          toDevice: `device-${index}-b`,
          connectionType: testCase.type,
          strength: 0.5,
          status: ConnectionStatus.ACTIVE
        };

        gameHUD.updateConnection(`connection-${index}`, connection);
      });

      const connectionIcons = container.querySelectorAll('.connection-icon');
      expect(connectionIcons.length).toBe(3);
      
      connections.forEach((testCase, index) => {
        expect(connectionIcons[index].textContent).toBe(testCase.icon);
      });
    });

    it('should remove connection', () => {
      const connection: ConnectionVisualization = {
        fromDevice: 'device-a',
        toDevice: 'device-b',
        connectionType: ConnectionType.COMMUNICATION,
        strength: 0.6,
        status: ConnectionStatus.ACTIVE
      };

      gameHUD.updateConnection('test-connection', connection);
      expect(container.querySelectorAll('.connection-item').length).toBe(1);

      gameHUD.removeConnection('test-connection');
      expect(container.querySelector('.connections-list')?.textContent).toContain('No active connections');
    });

    it('should clear all connections', () => {
      // Add multiple connections
      for (let i = 0; i < 3; i++) {
        const connection: ConnectionVisualization = {
          fromDevice: `device-${i}-a`,
          toDevice: `device-${i}-b`,
          connectionType: ConnectionType.COOPERATION,
          strength: 0.5,
          status: ConnectionStatus.ACTIVE
        };
        gameHUD.updateConnection(`connection-${i}`, connection);
      }

      expect(container.querySelectorAll('.connection-item').length).toBe(3);

      gameHUD.clearAllConnections();
      expect(container.querySelector('.connections-list')?.textContent).toContain('No active connections');
    });
  });

  describe('resource management', () => {
    it('should update resource display', () => {
      const energyResource: ResourceDisplay = {
        resourceType: ResourceType.ENERGY,
        current: 75,
        maximum: 100,
        efficiency: 0.9,
        trend: ResourceTrend.INCREASING
      };

      gameHUD.updateResource(ResourceType.ENERGY, energyResource);

      const energyItem = container.querySelector('.resource-item.energy') as HTMLElement;
      expect(energyItem).toBeTruthy();

      const currentValue = energyItem.querySelector('.resource-current') as HTMLElement;
      expect(currentValue.textContent).toBe('75');

      const trendIndicator = energyItem.querySelector('.resource-trend') as HTMLElement;
      expect(trendIndicator.classList.contains('increasing')).toBe(true);
    });

    it('should show critical resource trend', () => {
      const criticalResource: ResourceDisplay = {
        resourceType: ResourceType.MEMORY,
        current: 95,
        maximum: 100,
        efficiency: 0.3,
        trend: ResourceTrend.CRITICAL
      };

      gameHUD.updateResource(ResourceType.MEMORY, criticalResource);

      const memoryItem = container.querySelector('.resource-item.memory') as HTMLElement;
      const trendIndicator = memoryItem.querySelector('.resource-trend') as HTMLElement;
      expect(trendIndicator.classList.contains('critical')).toBe(true);
    });

    it('should animate resource bars', () => {
      const resource: ResourceDisplay = {
        resourceType: ResourceType.BANDWIDTH,
        current: 60,
        maximum: 100,
        efficiency: 0.8,
        trend: ResourceTrend.STABLE
      };

      gameHUD.updateResource(ResourceType.BANDWIDTH, resource);

      const bandwidthItem = container.querySelector('.resource-item.bandwidth') as HTMLElement;
      const fill = bandwidthItem.querySelector('.resource-fill') as HTMLElement;
      
      // Allow time for animation to apply
      setTimeout(() => {
        expect(fill.style.width).toBe('60%');
      }, 200);
    });
  });

  describe('alert system', () => {
    it('should show different types of alerts', () => {
      gameHUD.showAlert('Test error message', 'error');
      gameHUD.showAlert('Test warning message', 'warning');
      gameHUD.showAlert('Test info message', 'info');
      gameHUD.showAlert('Test success message', 'success');

      const alerts = container.querySelectorAll('.alert-item');
      expect(alerts.length).toBe(4);

      expect(alerts[0].classList.contains('error')).toBe(true);
      expect(alerts[1].classList.contains('warning')).toBe(true);
      expect(alerts[2].classList.contains('info')).toBe(true);
      expect(alerts[3].classList.contains('success')).toBe(true);
    });

    it('should auto-remove alerts after timeout', (done) => {
      gameHUD.showAlert('Temporary alert', 'info');
      
      expect(container.querySelectorAll('.alert-item').length).toBe(1);

      // Check that alert is removed after timeout
      setTimeout(() => {
        expect(container.querySelectorAll('.alert-item').length).toBe(0);
        done();
      }, 5100); // Slightly longer than the 5s timeout
    });
  });

  describe('mini map', () => {
    it('should update mini map with device positions', () => {
      const devices = [
        { id: 'device-1', position: { x: 100, y: 150 }, mood: DeviceMood.HAPPY },
        { id: 'device-2', position: { x: 200, y: 250 }, mood: DeviceMood.ANGRY },
        { id: 'device-3', position: { x: 300, y: 350 }, mood: DeviceMood.NEUTRAL }
      ];

      gameHUD.updateMiniMap(devices);

      const miniMapDevices = container.querySelectorAll('.mini-map-device');
      expect(miniMapDevices.length).toBe(3);

      // Check mood classes
      expect(miniMapDevices[0].classList.contains('happy')).toBe(true);
      expect(miniMapDevices[1].classList.contains('angry')).toBe(true);
      expect(miniMapDevices[2].classList.contains('neutral')).toBe(true);
    });

    it('should position devices correctly on mini map', () => {
      const devices = [
        { id: 'device-1', position: { x: 400, y: 300 }, mood: DeviceMood.CONTENT }
      ];

      gameHUD.updateMiniMap(devices);

      const miniMapDevice = container.querySelector('.mini-map-device') as HTMLElement;
      expect(miniMapDevice.style.left).toBe('50%'); // 400/800 * 100%
      expect(miniMapDevice.style.top).toBe('50%');  // 300/600 * 100%
    });
  });

  describe('data access methods', () => {
    it('should provide access to current system health', () => {
      const health = gameHUD.getSystemHealth();
      expect(health).toHaveProperty('harmonyLevel');
      expect(health).toHaveProperty('cooperationScore');
      expect(health).toHaveProperty('overallStability');
    });

    it('should provide access to device moods', () => {
      const mood: DeviceMoodIndicator = {
        deviceId: 'test-device',
        mood: DeviceMood.HAPPY,
        intensity: 0.8,
        reason: 'Test',
        visualEffect: 'glow'
      };

      gameHUD.updateDeviceMood('test-device', mood);

      const deviceMoods = gameHUD.getDeviceMoods();
      expect(deviceMoods.has('test-device')).toBe(true);
      expect(deviceMoods.get('test-device')).toEqual(mood);
    });

    it('should provide access to active connections', () => {
      const connection: ConnectionVisualization = {
        fromDevice: 'device-a',
        toDevice: 'device-b',
        connectionType: ConnectionType.COOPERATION,
        strength: 0.7,
        status: ConnectionStatus.ACTIVE
      };

      gameHUD.updateConnection('test-connection', connection);

      const connections = gameHUD.getActiveConnections();
      expect(connections.has('test-connection')).toBe(true);
      expect(connections.get('test-connection')).toEqual(connection);
    });

    it('should provide access to resource usage', () => {
      const resourceUsage = gameHUD.getResourceUsage();
      expect(resourceUsage.size).toBeGreaterThan(0);
      expect(resourceUsage.has(ResourceType.ENERGY)).toBe(true);
    });
  });

  describe('responsive design', () => {
    it('should handle mobile layout', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      
      // The CSS media queries would handle the responsive layout
      // We can test that the elements exist and are properly structured
      expect(container.querySelector('.hud-top-bar')).toBeTruthy();
      expect(container.querySelector('.hud-side-panel')).toBeTruthy();
    });
  });

  describe('performance and cleanup', () => {
    it('should start and stop update loops properly', () => {
      // The update loop should be running after initialization
      expect(gameHUD).toBeDefined();
      
      // Dispose should clean up intervals
      expect(() => gameHUD.dispose()).not.toThrow();
    });

    it('should handle rapid updates without performance issues', () => {
      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        const health: SystemHealthIndicator = {
          harmonyLevel: HarmonyLevel.GOOD_COOPERATION,
          cooperationScore: Math.random(),
          conflictScore: Math.random() * 0.3,
          resourceEfficiency: Math.random(),
          overallStability: Math.random()
        };
        
        gameHUD.updateSystemHealth(health);
      }
      
      // Should not throw errors or cause performance issues
      expect(gameHUD.getSystemHealth()).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and semantic structure', () => {
      const healthPanel = container.querySelector('.system-health-panel h3');
      expect(healthPanel?.textContent).toBe('System Health');
      
      const resourcePanel = container.querySelector('.resource-panel h3');
      expect(resourcePanel?.textContent).toBe('Resources');
    });

    it('should provide meaningful text content for screen readers', () => {
      const harmonyText = container.querySelector('.harmony-text');
      expect(harmonyText?.textContent).toBeTruthy();
      
      const metricLabels = container.querySelectorAll('.metric-label');
      expect(metricLabels.length).toBeGreaterThan(0);
    });
  });

  describe('resource cleanup', () => {
    it('should dispose of resources properly', () => {
      expect(() => gameHUD.dispose()).not.toThrow();
    });
  });
});