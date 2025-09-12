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

/**
 * GameHUD provides real-time system health indicators and visual feedback
 */
export class GameHUD {
  private container: HTMLElement;
  private systemHealthContainer: HTMLElement;
  private deviceMoodsContainer: HTMLElement;
  private connectionsContainer: HTMLElement;
  private resourcesContainer: HTMLElement;
  private alertsContainer: HTMLElement;
  
  // Current system state
  private currentHealth: SystemHealthIndicator;
  private deviceMoods: Map<string, DeviceMoodIndicator> = new Map();
  private activeConnections: Map<string, ConnectionVisualization> = new Map();
  private resourceUsage: Map<ResourceType, ResourceDisplay> = new Map();
  
  // Animation and update intervals
  private updateInterval: number | null = null;
  private animationFrameId: number | null = null;
  
  // Callbacks
  private onSystemCriticalCallback?: (health: SystemHealthIndicator) => void;
  private onDeviceAlertCallback?: (deviceId: string, mood: DeviceMoodIndicator) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeDefaultState();
    this.initializeUI();
    this.startUpdateLoop();
  }

  private initializeDefaultState(): void {
    this.currentHealth = {
      harmonyLevel: HarmonyLevel.GOOD_COOPERATION,
      cooperationScore: 0.8,
      conflictScore: 0.1,
      resourceEfficiency: 0.9,
      overallStability: 0.85
    };

    // Initialize resource displays
    Object.values(ResourceType).forEach(type => {
      this.resourceUsage.set(type, {
        resourceType: type,
        current: 50,
        maximum: 100,
        efficiency: 0.8,
        trend: ResourceTrend.STABLE
      });
    });
  }

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="game-hud">
        <div class="hud-top-bar">
          <div class="system-health-panel">
            <div class="health-header">
              <h3>System Health</h3>
              <div class="harmony-indicator">
                <div class="harmony-level"></div>
                <div class="harmony-text">Good Cooperation</div>
              </div>
            </div>
            <div class="health-metrics">
              <div class="metric cooperation">
                <div class="metric-label">Cooperation</div>
                <div class="metric-bar">
                  <div class="metric-fill cooperation-fill"></div>
                </div>
                <div class="metric-value">80%</div>
              </div>
              <div class="metric conflict">
                <div class="metric-label">Conflict</div>
                <div class="metric-bar">
                  <div class="metric-fill conflict-fill"></div>
                </div>
                <div class="metric-value">10%</div>
              </div>
              <div class="metric efficiency">
                <div class="metric-label">Efficiency</div>
                <div class="metric-bar">
                  <div class="metric-fill efficiency-fill"></div>
                </div>
                <div class="metric-value">90%</div>
              </div>
              <div class="metric stability">
                <div class="metric-label">Stability</div>
                <div class="metric-bar">
                  <div class="metric-fill stability-fill"></div>
                </div>
                <div class="metric-value">85%</div>
              </div>
            </div>
          </div>
          
          <div class="resource-panel">
            <div class="resource-header">
              <h3>Resources</h3>
            </div>
            <div class="resource-grid">
              <div class="resource-item energy">
                <div class="resource-icon">⚡</div>
                <div class="resource-info">
                  <div class="resource-name">Energy</div>
                  <div class="resource-bar">
                    <div class="resource-fill"></div>
                  </div>
                  <div class="resource-stats">
                    <span class="resource-current">50</span>/<span class="resource-max">100</span>
                    <span class="resource-trend stable">●</span>
                  </div>
                </div>
              </div>
              <div class="resource-item bandwidth">
                <div class="resource-icon">📡</div>
                <div class="resource-info">
                  <div class="resource-name">Bandwidth</div>
                  <div class="resource-bar">
                    <div class="resource-fill"></div>
                  </div>
                  <div class="resource-stats">
                    <span class="resource-current">50</span>/<span class="resource-max">100</span>
                    <span class="resource-trend stable">●</span>
                  </div>
                </div>
              </div>
              <div class="resource-item processing">
                <div class="resource-icon">🧠</div>
                <div class="resource-info">
                  <div class="resource-name">Processing</div>
                  <div class="resource-bar">
                    <div class="resource-fill"></div>
                  </div>
                  <div class="resource-stats">
                    <span class="resource-current">50</span>/<span class="resource-max">100</span>
                    <span class="resource-trend stable">●</span>
                  </div>
                </div>
              </div>
              <div class="resource-item memory">
                <div class="resource-icon">💾</div>
                <div class="resource-info">
                  <div class="resource-name">Memory</div>
                  <div class="resource-bar">
                    <div class="resource-fill"></div>
                  </div>
                  <div class="resource-stats">
                    <span class="resource-current">50</span>/<span class="resource-max">100</span>
                    <span class="resource-trend stable">●</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="hud-side-panel">
          <div class="device-moods-panel">
            <div class="moods-header">
              <h3>Device Status</h3>
              <div class="mood-legend">
                <span class="mood-indicator happy">😊</span>
                <span class="mood-indicator content">😌</span>
                <span class="mood-indicator neutral">😐</span>
                <span class="mood-indicator confused">😕</span>
                <span class="mood-indicator frustrated">😤</span>
                <span class="mood-indicator angry">😡</span>
              </div>
            </div>
            <div class="device-moods-list"></div>
          </div>
          
          <div class="connections-panel">
            <div class="connections-header">
              <h3>Active Connections</h3>
              <div class="connection-legend">
                <span class="connection-type cooperation">🤝</span>
                <span class="connection-type communication">💬</span>
                <span class="connection-type resource-sharing">🔄</span>
                <span class="connection-type conflict">⚡</span>
              </div>
            </div>
            <div class="connections-list"></div>
          </div>
        </div>
        
        <div class="hud-alerts">
          <div class="alerts-container"></div>
        </div>
        
        <div class="hud-mini-map">
          <div class="mini-map-header">Room Overview</div>
          <div class="mini-map-canvas"></div>
        </div>
      </div>
    `;

    // Get references to containers
    this.systemHealthContainer = this.container.querySelector('.system-health-panel') as HTMLElement;
    this.deviceMoodsContainer = this.container.querySelector('.device-moods-list') as HTMLElement;
    this.connectionsContainer = this.container.querySelector('.connections-list') as HTMLElement;
    this.resourcesContainer = this.container.querySelector('.resource-grid') as HTMLElement;
    this.alertsContainer = this.container.querySelector('.alerts-container') as HTMLElement;

    // Apply styles
    this.applyStyles();
    
    // Initialize displays
    this.updateSystemHealthDisplay();
    this.updateResourceDisplays();
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .game-hud {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 100;
      }
      
      .game-hud > * {
        pointer-events: auto;
      }
      
      .hud-top-bar {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        display: flex;
        gap: 20px;
        z-index: 101;
      }
      
      .system-health-panel {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        flex: 1;
        max-width: 400px;
      }
      
      .health-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .health-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
      }
      
      .harmony-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .harmony-level {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #10b981;
        animation: pulse 2s infinite;
      }
      
      .harmony-level.perfect-harmony { background: #059669; }
      .harmony-level.good-cooperation { background: #10b981; }
      .harmony-level.minor-tensions { background: #f59e0b; }
      .harmony-level.active-conflicts { background: #ef4444; }
      .harmony-level.system-crisis { background: #dc2626; animation: flash 0.5s infinite; }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
      
      @keyframes flash {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      
      .harmony-text {
        font-size: 14px;
        font-weight: 500;
        color: #475569;
      }
      
      .health-metrics {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .metric {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .metric-label {
        font-size: 12px;
        font-weight: 500;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .metric-bar {
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .metric-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.5s ease;
      }
      
      .cooperation-fill { background: linear-gradient(90deg, #10b981, #059669); }
      .conflict-fill { background: linear-gradient(90deg, #ef4444, #dc2626); }
      .efficiency-fill { background: linear-gradient(90deg, #3b82f6, #2563eb); }
      .stability-fill { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
      
      .metric-value {
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
        text-align: right;
      }
      
      .resource-panel {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        flex: 1;
        max-width: 300px;
      }
      
      .resource-header h3 {
        margin: 0 0 16px 0;
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
      }
      
      .resource-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      .resource-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      
      .resource-icon {
        font-size: 16px;
        width: 24px;
        text-align: center;
      }
      
      .resource-info {
        flex: 1;
        min-width: 0;
      }
      
      .resource-name {
        font-size: 11px;
        font-weight: 500;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      
      .resource-bar {
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 2px;
      }
      
      .resource-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      
      .resource-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #64748b;
      }
      
      .resource-trend {
        font-size: 8px;
      }
      
      .resource-trend.increasing { color: #10b981; }
      .resource-trend.stable { color: #64748b; }
      .resource-trend.decreasing { color: #f59e0b; }
      .resource-trend.critical { color: #ef4444; animation: flash 1s infinite; }
      
      .hud-side-panel {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 280px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        z-index: 101;
      }
      
      .device-moods-panel,
      .connections-panel {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .moods-header,
      .connections-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .moods-header h3,
      .connections-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 14px;
        font-weight: 600;
      }
      
      .mood-legend,
      .connection-legend {
        display: flex;
        gap: 4px;
      }
      
      .mood-indicator,
      .connection-type {
        font-size: 12px;
      }
      
      .device-moods-list,
      .connections-list {
        max-height: 150px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .device-mood-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: #f8fafc;
        border-radius: 6px;
        border-left: 3px solid #e2e8f0;
        transition: all 0.2s ease;
      }
      
      .device-mood-item.happy { border-left-color: #10b981; }
      .device-mood-item.content { border-left-color: #3b82f6; }
      .device-mood-item.neutral { border-left-color: #64748b; }
      .device-mood-item.confused { border-left-color: #f59e0b; }
      .device-mood-item.frustrated { border-left-color: #ef4444; }
      .device-mood-item.angry { border-left-color: #dc2626; animation: shake 0.5s infinite; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }
      
      .device-mood-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }
      
      .device-mood-info {
        flex: 1;
        min-width: 0;
      }
      
      .device-mood-name {
        font-size: 12px;
        font-weight: 500;
        color: #1e293b;
        margin-bottom: 2px;
      }
      
      .device-mood-reason {
        font-size: 10px;
        color: #64748b;
        line-height: 1.2;
      }
      
      .connection-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: #f8fafc;
        border-radius: 6px;
        border-left: 3px solid #e2e8f0;
      }
      
      .connection-item.cooperation { border-left-color: #10b981; }
      .connection-item.communication { border-left-color: #3b82f6; }
      .connection-item.resource-sharing { border-left-color: #8b5cf6; }
      .connection-item.conflict { border-left-color: #ef4444; }
      
      .connection-icon {
        font-size: 14px;
        width: 18px;
        text-align: center;
      }
      
      .connection-info {
        flex: 1;
        min-width: 0;
      }
      
      .connection-devices {
        font-size: 11px;
        font-weight: 500;
        color: #1e293b;
        margin-bottom: 2px;
      }
      
      .connection-strength {
        font-size: 10px;
        color: #64748b;
      }
      
      .hud-alerts {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 102;
      }
      
      .alerts-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }
      
      .alert-item {
        background: rgba(239, 68, 68, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
        animation: slideUp 0.3s ease, fadeOut 0.3s ease 4.7s forwards;
        max-width: 400px;
        text-align: center;
      }
      
      .alert-item.warning {
        background: rgba(245, 158, 11, 0.95);
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
      }
      
      .alert-item.info {
        background: rgba(59, 130, 246, 0.95);
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
      }
      
      .alert-item.success {
        background: rgba(16, 185, 129, 0.95);
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
      }
      
      @keyframes slideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes fadeOut {
        to { opacity: 0; transform: translateY(-20px); }
      }
      
      .hud-mini-map {
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 200px;
        height: 150px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 101;
      }
      
      .mini-map-header {
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
        text-align: center;
      }
      
      .mini-map-canvas {
        width: 100%;
        height: calc(100% - 24px);
        background: #f8fafc;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
        position: relative;
        overflow: hidden;
      }
      
      .mini-map-device {
        position: absolute;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3b82f6;
        border: 1px solid white;
      }
      
      .mini-map-device.happy { background: #10b981; }
      .mini-map-device.content { background: #3b82f6; }
      .mini-map-device.neutral { background: #64748b; }
      .mini-map-device.confused { background: #f59e0b; }
      .mini-map-device.frustrated { background: #ef4444; }
      .mini-map-device.angry { background: #dc2626; animation: pulse 1s infinite; }
      
      @media (max-width: 1024px) {
        .hud-top-bar {
          flex-direction: column;
          right: 300px;
        }
        
        .hud-side-panel {
          width: 260px;
        }
        
        .health-metrics {
          grid-template-columns: 1fr;
        }
        
        .resource-grid {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 768px) {
        .hud-top-bar {
          right: 20px;
          left: 20px;
        }
        
        .hud-side-panel {
          position: relative;
          width: 100%;
          top: auto;
          right: auto;
          margin-top: 20px;
        }
        
        .hud-mini-map {
          display: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  private startUpdateLoop(): void {
    // Update displays every 100ms for smooth animations
    this.updateInterval = window.setInterval(() => {
      this.updateAnimations();
    }, 100);
  }

  private updateAnimations(): void {
    // Animate metric bars
    this.animateMetricBars();
    
    // Update resource trend indicators
    this.updateResourceTrends();
    
    // Pulse harmony indicator
    this.updateHarmonyIndicator();
  }

  private animateMetricBars(): void {
    const cooperationFill = this.container.querySelector('.cooperation-fill') as HTMLElement;
    const conflictFill = this.container.querySelector('.conflict-fill') as HTMLElement;
    const efficiencyFill = this.container.querySelector('.efficiency-fill') as HTMLElement;
    const stabilityFill = this.container.querySelector('.stability-fill') as HTMLElement;
    
    if (cooperationFill) {
      cooperationFill.style.width = `${this.currentHealth.cooperationScore * 100}%`;
    }
    if (conflictFill) {
      conflictFill.style.width = `${this.currentHealth.conflictScore * 100}%`;
    }
    if (efficiencyFill) {
      efficiencyFill.style.width = `${this.currentHealth.resourceEfficiency * 100}%`;
    }
    if (stabilityFill) {
      stabilityFill.style.width = `${this.currentHealth.overallStability * 100}%`;
    }
  }

  private updateResourceTrends(): void {
    this.resourceUsage.forEach((resource, type) => {
      const resourceItem = this.container.querySelector(`.resource-item.${type}`) as HTMLElement;
      if (!resourceItem) return;
      
      const fill = resourceItem.querySelector('.resource-fill') as HTMLElement;
      const current = resourceItem.querySelector('.resource-current') as HTMLElement;
      const trend = resourceItem.querySelector('.resource-trend') as HTMLElement;
      
      if (fill) {
        fill.style.width = `${(resource.current / resource.maximum) * 100}%`;
      }
      if (current) {
        current.textContent = resource.current.toString();
      }
      if (trend) {
        trend.className = `resource-trend ${resource.trend}`;
      }
    });
  }

  private updateHarmonyIndicator(): void {
    const harmonyLevel = this.container.querySelector('.harmony-level') as HTMLElement;
    const harmonyText = this.container.querySelector('.harmony-text') as HTMLElement;
    
    if (harmonyLevel) {
      harmonyLevel.className = `harmony-level ${this.currentHealth.harmonyLevel.replace('_', '-')}`;
    }
    
    if (harmonyText) {
      harmonyText.textContent = this.getHarmonyDisplayText(this.currentHealth.harmonyLevel);
    }
  }

  private getHarmonyDisplayText(level: HarmonyLevel): string {
    switch (level) {
      case HarmonyLevel.PERFECT_HARMONY:
        return 'Perfect Harmony';
      case HarmonyLevel.GOOD_COOPERATION:
        return 'Good Cooperation';
      case HarmonyLevel.MINOR_TENSIONS:
        return 'Minor Tensions';
      case HarmonyLevel.ACTIVE_CONFLICTS:
        return 'Active Conflicts';
      case HarmonyLevel.SYSTEM_CRISIS:
        return 'System Crisis';
      default:
        return 'Unknown';
    }
  }

  // Public API methods
  public updateSystemHealth(health: SystemHealthIndicator): void {
    this.currentHealth = health;
    this.updateSystemHealthDisplay();
    
    // Check for critical conditions
    if (health.harmonyLevel === HarmonyLevel.SYSTEM_CRISIS || health.overallStability < 0.3) {
      if (this.onSystemCriticalCallback) {
        this.onSystemCriticalCallback(health);
      }
      this.showAlert('System stability critical! Immediate intervention required.', 'error');
    }
  }

  private updateSystemHealthDisplay(): void {
    // Update metric values
    const cooperationValue = this.container.querySelector('.cooperation .metric-value') as HTMLElement;
    const conflictValue = this.container.querySelector('.conflict .metric-value') as HTMLElement;
    const efficiencyValue = this.container.querySelector('.efficiency .metric-value') as HTMLElement;
    const stabilityValue = this.container.querySelector('.stability .metric-value') as HTMLElement;
    
    if (cooperationValue) {
      cooperationValue.textContent = `${Math.round(this.currentHealth.cooperationScore * 100)}%`;
    }
    if (conflictValue) {
      conflictValue.textContent = `${Math.round(this.currentHealth.conflictScore * 100)}%`;
    }
    if (efficiencyValue) {
      efficiencyValue.textContent = `${Math.round(this.currentHealth.resourceEfficiency * 100)}%`;
    }
    if (stabilityValue) {
      stabilityValue.textContent = `${Math.round(this.currentHealth.overallStability * 100)}%`;
    }
  }

  public updateDeviceMood(deviceId: string, mood: DeviceMoodIndicator): void {
    this.deviceMoods.set(deviceId, mood);
    this.renderDeviceMoods();
    
    // Check for device alerts
    if (mood.mood === DeviceMood.ANGRY || mood.mood === DeviceMood.FRUSTRATED) {
      if (this.onDeviceAlertCallback) {
        this.onDeviceAlertCallback(deviceId, mood);
      }
    }
  }

  private renderDeviceMoods(): void {
    this.deviceMoodsContainer.innerHTML = '';
    
    if (this.deviceMoods.size === 0) {
      this.deviceMoodsContainer.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 12px; padding: 20px;">No devices active</div>';
      return;
    }
    
    this.deviceMoods.forEach((mood, deviceId) => {
      const moodElement = document.createElement('div');
      moodElement.className = `device-mood-item ${mood.mood}`;
      moodElement.innerHTML = `
        <div class="device-mood-icon">${this.getMoodIcon(mood.mood)}</div>
        <div class="device-mood-info">
          <div class="device-mood-name">${this.getDeviceName(deviceId)}</div>
          <div class="device-mood-reason">${mood.reason}</div>
        </div>
      `;
      
      this.deviceMoodsContainer.appendChild(moodElement);
    });
  }

  private getMoodIcon(mood: DeviceMood): string {
    const icons = {
      [DeviceMood.HAPPY]: '😊',
      [DeviceMood.CONTENT]: '😌',
      [DeviceMood.NEUTRAL]: '😐',
      [DeviceMood.CONFUSED]: '😕',
      [DeviceMood.FRUSTRATED]: '😤',
      [DeviceMood.ANGRY]: '😡'
    };
    
    return icons[mood] || '🤖';
  }

  private getDeviceName(deviceId: string): string {
    // This would normally get the actual device name
    // For now, generate a friendly name from the ID
    return deviceId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  public updateConnection(connectionId: string, connection: ConnectionVisualization): void {
    this.activeConnections.set(connectionId, connection);
    this.renderConnections();
  }

  public removeConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    this.renderConnections();
  }

  private renderConnections(): void {
    this.connectionsContainer.innerHTML = '';
    
    if (this.activeConnections.size === 0) {
      this.connectionsContainer.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 12px; padding: 20px;">No active connections</div>';
      return;
    }
    
    this.activeConnections.forEach((connection, connectionId) => {
      const connectionElement = document.createElement('div');
      connectionElement.className = `connection-item ${connection.connectionType.replace('_', '-')}`;
      connectionElement.innerHTML = `
        <div class="connection-icon">${this.getConnectionIcon(connection.connectionType)}</div>
        <div class="connection-info">
          <div class="connection-devices">${this.getDeviceName(connection.fromDevice)} ↔ ${this.getDeviceName(connection.toDevice)}</div>
          <div class="connection-strength">Strength: ${Math.round(connection.strength * 100)}% • ${connection.status}</div>
        </div>
      `;
      
      this.connectionsContainer.appendChild(connectionElement);
    });
  }

  private getConnectionIcon(type: ConnectionType): string {
    const icons = {
      [ConnectionType.COOPERATION]: '🤝',
      [ConnectionType.COMMUNICATION]: '💬',
      [ConnectionType.RESOURCE_SHARING]: '🔄',
      [ConnectionType.CONFLICT]: '⚡',
      [ConnectionType.DEPENDENCY]: '🔗'
    };
    
    return icons[type] || '🔗';
  }

  public updateResource(type: ResourceType, resource: ResourceDisplay): void {
    this.resourceUsage.set(type, resource);
    this.updateResourceDisplays();
  }

  private updateResourceDisplays(): void {
    // Resource displays are updated in the animation loop
    // This method can be used for immediate updates if needed
    this.updateResourceTrends();
  }

  public showAlert(message: string, type: 'error' | 'warning' | 'info' | 'success' = 'info'): void {
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item ${type}`;
    alertElement.textContent = message;
    
    this.alertsContainer.appendChild(alertElement);
    
    // Remove alert after 5 seconds
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.parentNode.removeChild(alertElement);
      }
    }, 5000);
  }

  public updateMiniMap(devices: { id: string; position: { x: number; y: number }; mood: DeviceMood }[]): void {
    const miniMapCanvas = this.container.querySelector('.mini-map-canvas') as HTMLElement;
    
    // Clear existing devices
    const existingDevices = miniMapCanvas.querySelectorAll('.mini-map-device');
    existingDevices.forEach(device => device.remove());
    
    // Add devices to mini map
    devices.forEach(device => {
      const deviceElement = document.createElement('div');
      deviceElement.className = `mini-map-device ${device.mood}`;
      deviceElement.style.left = `${(device.position.x / 800) * 100}%`;
      deviceElement.style.top = `${(device.position.y / 600) * 100}%`;
      deviceElement.title = this.getDeviceName(device.id);
      
      miniMapCanvas.appendChild(deviceElement);
    });
  }

  public clearDeviceMood(deviceId: string): void {
    this.deviceMoods.delete(deviceId);
    this.renderDeviceMoods();
  }

  public clearAllConnections(): void {
    this.activeConnections.clear();
    this.renderConnections();
  }

  // Callback setters
  public setSystemCriticalCallback(callback: (health: SystemHealthIndicator) => void): void {
    this.onSystemCriticalCallback = callback;
  }

  public setDeviceAlertCallback(callback: (deviceId: string, mood: DeviceMoodIndicator) => void): void {
    this.onDeviceAlertCallback = callback;
  }

  // Utility methods
  public getSystemHealth(): SystemHealthIndicator {
    return this.currentHealth;
  }

  public getDeviceMoods(): Map<string, DeviceMoodIndicator> {
    return new Map(this.deviceMoods);
  }

  public getActiveConnections(): Map<string, ConnectionVisualization> {
    return new Map(this.activeConnections);
  }

  public getResourceUsage(): Map<ResourceType, ResourceDisplay> {
    return new Map(this.resourceUsage);
  }

  /**
   * Dispose of resources and stop update loops
   */
  public dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Additional missing methods for GameIntegrationSystem
  public displayInteraction(interaction: any): void {
    console.log('Displaying interaction:', interaction);
  }

  public displayStoryMoment(moment: any): void {
    console.log('Displaying story moment:', moment);
  }

  public handleUIClick(element: any): boolean {
    console.log('Handling UI click:', element);
    return true;
  }

  public hideTutorialOverlay(): void {
    console.log('Tutorial overlay hidden');
  }

  public showMainMenu(): void {
    console.log('Main menu shown');
  }

  public toggleHelp(): void {
    console.log('Help toggled');
  }

  public showTutorialPauseMenu(): void {
    console.log('Tutorial pause menu shown');
  }

  public showPauseMenu(): void {
    console.log('Pause menu shown');
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('GameHUD accessibility settings applied:', settings);
  }

  // Additional mode-specific UI methods
  public showFreePlayUI(): void {
    console.log('Free play UI shown');
  }

  public showTutorialOverlay(): void {
    console.log('Tutorial overlay shown');
  }

  public showScenarioUI(): void {
    console.log('Scenario UI shown');
  }

  public showCrisisUI(): void {
    console.log('Crisis UI shown');
  }

  public showTutorialStep(step: any): void {
    console.log('Tutorial step shown:', step);
  }

  public showCrisisAlert(crisis: any): void {
    console.log('Crisis alert shown:', crisis);
  }

  public displayStoryMoment(moment: any): void {
    console.log('Story moment displayed:', moment);
  }
}