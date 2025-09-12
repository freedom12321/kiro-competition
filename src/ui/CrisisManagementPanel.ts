import { DeviceVisual, CrisisScenario, InterventionTool, RecoveryAction } from '../types/core';

export interface CrisisManagementOptions {
  emergencyStopEnabled: boolean;
  circuitBreakerEnabled: boolean;
  manualOverrideEnabled: boolean;
  diagnosticMode: boolean;
}

export interface InterventionResult {
  success: boolean;
  affectedDevices: string[];
  systemStabilized: boolean;
  message: string;
}

export interface CircuitBreakerState {
  deviceId: string;
  isolated: boolean;
  isolationReason: string;
  canReconnect: boolean;
}

export interface ManualOverride {
  deviceId: string;
  parameter: string;
  originalValue: any;
  overrideValue: any;
  active: boolean;
}

export class CrisisManagementPanel {
  private container: HTMLElement;
  private isVisible: boolean = false;
  private currentCrisis: CrisisScenario | null = null;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private manualOverrides: Map<string, ManualOverride[]> = new Map();
  private onInterventionCallback?: (action: RecoveryAction) => Promise<InterventionResult>;
  private onRecoveryWizardCallback?: (crisis: CrisisScenario) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createCrisisInterface();
  }

  private createCrisisInterface(): void {
    const panel = document.createElement('div');
    panel.className = 'crisis-management-panel hidden';
    panel.innerHTML = `
      <div class="crisis-header">
        <h2 class="crisis-title">🚨 SYSTEM CRISIS DETECTED</h2>
        <div class="crisis-severity-indicator">
          <div class="severity-bar">
            <div class="severity-fill"></div>
          </div>
          <span class="severity-text">Critical</span>
        </div>
      </div>

      <div class="crisis-content">
        <div class="emergency-controls">
          <h3>Emergency Controls</h3>
          <button class="emergency-stop-btn" data-action="emergency-stop">
            <span class="btn-icon">⏹️</span>
            EMERGENCY STOP
          </button>
          <button class="system-reset-btn" data-action="system-reset">
            <span class="btn-icon">🔄</span>
            SYSTEM RESET
          </button>
        </div>

        <div class="circuit-breakers">
          <h3>Device Isolation</h3>
          <div class="breaker-grid"></div>
        </div>

        <div class="manual-overrides">
          <h3>Manual Overrides</h3>
          <div class="override-controls"></div>
        </div>

        <div class="crisis-diagnostics">
          <h3>System Diagnostics</h3>
          <div class="diagnostic-display"></div>
        </div>
      </div>

      <div class="crisis-actions">
        <button class="close-panel-btn">Close Panel</button>
        <button class="recovery-wizard-btn">Start Recovery Wizard</button>
      </div>
    `;

    this.container.appendChild(panel);
    this.setupEventListeners(panel);
  }

  private setupEventListeners(panel: HTMLElement): void {
    // Emergency controls
    const emergencyStopBtn = panel.querySelector('.emergency-stop-btn') as HTMLButtonElement;
    const systemResetBtn = panel.querySelector('.system-reset-btn') as HTMLButtonElement;
    
    emergencyStopBtn?.addEventListener('click', () => this.handleEmergencyStop());
    systemResetBtn?.addEventListener('click', () => this.handleSystemReset());

    // Panel controls
    const closePanelBtn = panel.querySelector('.close-panel-btn') as HTMLButtonElement;
    const recoveryWizardBtn = panel.querySelector('.recovery-wizard-btn') as HTMLButtonElement;
    
    closePanelBtn?.addEventListener('click', () => this.hide());
    recoveryWizardBtn?.addEventListener('click', () => this.startRecoveryWizard());
  }

  public show(crisis: CrisisScenario): void {
    this.currentCrisis = crisis;
    this.isVisible = true;
    
    const panel = this.container.querySelector('.crisis-management-panel') as HTMLElement;
    panel.classList.remove('hidden');
    panel.classList.add('visible');
    
    this.updateCrisisDisplay(crisis);
    this.updateCircuitBreakers(crisis.involvedAgents);
    this.updateManualOverrides(crisis.involvedAgents);
    this.updateDiagnostics(crisis);
    
    // Add dramatic entrance animation
    panel.style.animation = 'crisisSlideIn 0.5s ease-out';
  }

  public hide(): void {
    this.isVisible = false;
    const panel = this.container.querySelector('.crisis-management-panel') as HTMLElement;
    panel.classList.add('hidden');
    panel.classList.remove('visible');
  }

  private updateCrisisDisplay(crisis: CrisisScenario): void {
    const panel = this.container.querySelector('.crisis-management-panel') as HTMLElement;
    const severityFill = panel.querySelector('.severity-fill') as HTMLElement;
    const severityText = panel.querySelector('.severity-text') as HTMLElement;
    const crisisTitle = panel.querySelector('.crisis-title') as HTMLElement;

    // Update severity indicator
    const severityPercent = Math.min(crisis.severity * 100, 100);
    severityFill.style.width = `${severityPercent}%`;
    
    if (crisis.severity > 0.8) {
      severityFill.className = 'severity-fill critical';
      severityText.textContent = 'Critical';
      crisisTitle.textContent = '🚨 CRITICAL SYSTEM FAILURE';
    } else if (crisis.severity > 0.5) {
      severityFill.className = 'severity-fill high';
      severityText.textContent = 'High';
      crisisTitle.textContent = '⚠️ SYSTEM CRISIS DETECTED';
    } else {
      severityFill.className = 'severity-fill medium';
      severityText.textContent = 'Medium';
      crisisTitle.textContent = '⚡ SYSTEM INSTABILITY';
    }
  }

  private updateCircuitBreakers(deviceIds: string[]): void {
    const breakerGrid = this.container.querySelector('.breaker-grid') as HTMLElement;
    breakerGrid.innerHTML = '';

    deviceIds.forEach(deviceId => {
      const breakerState = this.circuitBreakers.get(deviceId) || {
        deviceId,
        isolated: false,
        isolationReason: '',
        canReconnect: true
      };

      const breakerElement = document.createElement('div');
      breakerElement.className = 'circuit-breaker';
      breakerElement.innerHTML = `
        <div class="breaker-header">
          <span class="device-name">${deviceId}</span>
          <div class="breaker-status ${breakerState.isolated ? 'isolated' : 'connected'}">
            ${breakerState.isolated ? '🔴 ISOLATED' : '🟢 CONNECTED'}
          </div>
        </div>
        <button class="breaker-toggle ${breakerState.isolated ? 'reconnect' : 'isolate'}" 
                data-device="${deviceId}">
          ${breakerState.isolated ? 'RECONNECT' : 'ISOLATE'}
        </button>
        ${breakerState.isolationReason ? `<div class="isolation-reason">${breakerState.isolationReason}</div>` : ''}
      `;

      const toggleBtn = breakerElement.querySelector('.breaker-toggle') as HTMLButtonElement;
      toggleBtn.addEventListener('click', () => this.toggleCircuitBreaker(deviceId));

      breakerGrid.appendChild(breakerElement);
    });
  }

  private updateManualOverrides(deviceIds: string[]): void {
    const overrideControls = this.container.querySelector('.override-controls') as HTMLElement;
    overrideControls.innerHTML = '';

    deviceIds.forEach(deviceId => {
      const overrides = this.manualOverrides.get(deviceId) || [];
      
      const deviceOverridePanel = document.createElement('div');
      deviceOverridePanel.className = 'device-override-panel';
      deviceOverridePanel.innerHTML = `
        <h4>${deviceId} Controls</h4>
        <div class="override-sliders">
          <div class="slider-control">
            <label>Priority Level</label>
            <input type="range" min="0" max="100" value="50" class="priority-slider" data-device="${deviceId}" data-param="priority">
            <span class="slider-value">50%</span>
          </div>
          <div class="slider-control">
            <label>Resource Limit</label>
            <input type="range" min="0" max="100" value="75" class="resource-slider" data-device="${deviceId}" data-param="resources">
            <span class="slider-value">75%</span>
          </div>
          <div class="switch-control">
            <label>Communication</label>
            <button class="toggle-switch active" data-device="${deviceId}" data-param="communication">
              <span class="switch-indicator"></span>
            </button>
          </div>
        </div>
      `;

      // Add event listeners for controls
      const sliders = deviceOverridePanel.querySelectorAll('input[type="range"]');
      sliders.forEach(slider => {
        slider.addEventListener('input', (e) => this.handleSliderChange(e as Event));
      });

      const switches = deviceOverridePanel.querySelectorAll('.toggle-switch');
      switches.forEach(switchBtn => {
        switchBtn.addEventListener('click', (e) => this.handleSwitchToggle(e as Event));
      });

      overrideControls.appendChild(deviceOverridePanel);
    });
  }

  private updateDiagnostics(crisis: CrisisScenario): void {
    const diagnosticDisplay = this.container.querySelector('.diagnostic-display') as HTMLElement;
    
    diagnosticDisplay.innerHTML = `
      <div class="diagnostic-item">
        <span class="diagnostic-label">Crisis Type:</span>
        <span class="diagnostic-value">${crisis.type}</span>
      </div>
      <div class="diagnostic-item">
        <span class="diagnostic-label">Affected Devices:</span>
        <span class="diagnostic-value">${crisis.involvedAgents.length}</span>
      </div>
      <div class="diagnostic-item">
        <span class="diagnostic-label">Escalation Risk:</span>
        <span class="diagnostic-value ${crisis.severity > 0.7 ? 'high-risk' : 'medium-risk'}">
          ${crisis.severity > 0.7 ? 'HIGH' : 'MEDIUM'}
        </span>
      </div>
      <div class="diagnostic-timeline">
        <h5>Crisis Timeline</h5>
        <div class="timeline-events">
          ${crisis.triggerEvents.map(event => `
            <div class="timeline-event">
              <span class="event-time">${new Date(event.timestamp).toLocaleTimeString()}</span>
              <span class="event-description">${event.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private async handleEmergencyStop(): Promise<void> {
    if (!this.onInterventionCallback) return;

    const action: RecoveryAction = {
      type: 'emergency_stop',
      deviceIds: this.currentCrisis?.involvedAgents || [],
      parameters: {},
      priority: 'critical'
    };

    try {
      const result = await this.onInterventionCallback(action);
      this.showInterventionFeedback(result);
    } catch (error) {
      console.error('Emergency stop failed:', error);
      this.showInterventionFeedback({
        success: false,
        affectedDevices: [],
        systemStabilized: false,
        message: 'Emergency stop failed - system error'
      });
    }
  }

  private async handleSystemReset(): Promise<void> {
    if (!this.onInterventionCallback) return;

    const action: RecoveryAction = {
      type: 'system_reset',
      deviceIds: this.currentCrisis?.involvedAgents || [],
      parameters: { preserveConfiguration: true },
      priority: 'critical'
    };

    try {
      const result = await this.onInterventionCallback(action);
      this.showInterventionFeedback(result);
    } catch (error) {
      console.error('System reset failed:', error);
      this.showInterventionFeedback({
        success: false,
        affectedDevices: [],
        systemStabilized: false,
        message: 'System reset failed - manual intervention required'
      });
    }
  }

  private async toggleCircuitBreaker(deviceId: string): Promise<void> {
    const currentState = this.circuitBreakers.get(deviceId);
    const newIsolated = !currentState?.isolated;

    if (!this.onInterventionCallback) return;

    const action: RecoveryAction = {
      type: newIsolated ? 'isolate_device' : 'reconnect_device',
      deviceIds: [deviceId],
      parameters: { reason: newIsolated ? 'Manual isolation during crisis' : 'Manual reconnection' },
      priority: 'high'
    };

    try {
      const result = await this.onInterventionCallback(action);
      
      if (result.success) {
        this.circuitBreakers.set(deviceId, {
          deviceId,
          isolated: newIsolated,
          isolationReason: newIsolated ? 'Manually isolated during crisis management' : '',
          canReconnect: true
        });
        
        this.updateCircuitBreakers(this.currentCrisis?.involvedAgents || []);
        this.showInterventionFeedback(result);
      }
    } catch (error) {
      console.error('Circuit breaker toggle failed:', error);
    }
  }

  private handleSliderChange(event: Event): void {
    const slider = event.target as HTMLInputElement;
    const deviceId = slider.dataset.device!;
    const parameter = slider.dataset.param!;
    const value = parseInt(slider.value);

    // Update display
    const valueDisplay = slider.parentElement?.querySelector('.slider-value') as HTMLElement;
    if (valueDisplay) {
      valueDisplay.textContent = `${value}%`;
    }

    // Apply override
    this.applyManualOverride(deviceId, parameter, value);
  }

  private handleSwitchToggle(event: Event): void {
    const switchBtn = event.target as HTMLButtonElement;
    const deviceId = switchBtn.dataset.device!;
    const parameter = switchBtn.dataset.param!;
    
    const isActive = switchBtn.classList.contains('active');
    const newState = !isActive;
    
    if (newState) {
      switchBtn.classList.add('active');
    } else {
      switchBtn.classList.remove('active');
    }

    this.applyManualOverride(deviceId, parameter, newState);
  }

  private async applyManualOverride(deviceId: string, parameter: string, value: any): Promise<void> {
    if (!this.onInterventionCallback) return;

    const action: RecoveryAction = {
      type: 'manual_override',
      deviceIds: [deviceId],
      parameters: { [parameter]: value },
      priority: 'medium'
    };

    try {
      const result = await this.onInterventionCallback(action);
      
      if (result.success) {
        // Store override state
        const deviceOverrides = this.manualOverrides.get(deviceId) || [];
        const existingOverride = deviceOverrides.find(o => o.parameter === parameter);
        
        if (existingOverride) {
          existingOverride.overrideValue = value;
          existingOverride.active = true;
        } else {
          deviceOverrides.push({
            deviceId,
            parameter,
            originalValue: null, // Would be set by the system
            overrideValue: value,
            active: true
          });
        }
        
        this.manualOverrides.set(deviceId, deviceOverrides);
      }
    } catch (error) {
      console.error('Manual override failed:', error);
    }
  }

  private showInterventionFeedback(result: InterventionResult): void {
    const feedback = document.createElement('div');
    feedback.className = `intervention-feedback ${result.success ? 'success' : 'error'}`;
    feedback.innerHTML = `
      <div class="feedback-icon">${result.success ? '✅' : '❌'}</div>
      <div class="feedback-message">${result.message}</div>
      <div class="feedback-details">
        Affected devices: ${result.affectedDevices.length}
        ${result.systemStabilized ? ' | System stabilized' : ''}
      </div>
    `;

    const panel = this.container.querySelector('.crisis-management-panel') as HTMLElement;
    panel.appendChild(feedback);

    // Auto-remove feedback after 5 seconds
    setTimeout(() => {
      feedback.remove();
    }, 5000);
  }

  private startRecoveryWizard(): void {
    // Trigger recovery wizard through callback
    if (this.currentCrisis && this.onRecoveryWizardCallback) {
      this.onRecoveryWizardCallback(this.currentCrisis);
    }
    this.hide();
  }

  public setInterventionCallback(callback: (action: RecoveryAction) => Promise<InterventionResult>): void {
    this.onInterventionCallback = callback;
  }

  public setRecoveryWizardCallback(callback: (crisis: CrisisScenario) => void): void {
    this.onRecoveryWizardCallback = callback;
  }

  public isCurrentlyVisible(): boolean {
    return this.isVisible;
  }

  public getCurrentCrisis(): CrisisScenario | null {
    return this.currentCrisis;
  }

  public getCircuitBreakerStates(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  public getManualOverrides(): Map<string, ManualOverride[]> {
    return new Map(this.manualOverrides);
  }

  public clearAllOverrides(): void {
    this.circuitBreakers.clear();
    this.manualOverrides.clear();
    
    if (this.currentCrisis) {
      this.updateCircuitBreakers(this.currentCrisis.involvedAgents);
      this.updateManualOverrides(this.currentCrisis.involvedAgents);
    }
  }

  public showCrisis(crisis: any): void {
    console.log('Showing crisis:', crisis);
    this.show();
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('CrisisManagementPanel accessibility settings applied:', settings);
    if (settings.highContrast) {
      this.container.classList.add('high-contrast');
    } else {
      this.container.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      this.container.classList.add('large-text');
    } else {
      this.container.classList.remove('large-text');
    }

    if (settings.keyboardNavigation) {
      this.enableKeyboardNavigation();
    }
  }

  private enableKeyboardNavigation(): void {
    console.log('Keyboard navigation enabled for crisis management panel');
    // Add keyboard navigation support
    this.container.setAttribute('tabindex', '0');
  }
}