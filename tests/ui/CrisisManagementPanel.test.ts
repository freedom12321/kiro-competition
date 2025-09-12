// Jest globals: describe, it, expect, beforeEach, afterEach
import { CrisisManagementPanel, InterventionResult } from '@/ui/CrisisManagementPanel';
import { CrisisScenario, CrisisType, RecoveryAction } from '@/types/core';

// Mock DOM environment
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

describe('CrisisManagementPanel', () => {
  let container: HTMLElement;
  let panel: CrisisManagementPanel;
  let mockInterventionCallback: jest.MockedFunction<(action: RecoveryAction) => Promise<InterventionResult>>;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock intervention callback
    mockInterventionCallback = jest.fn();

    // Create panel instance
    panel = new CrisisManagementPanel(container);
    panel.setInterventionCallback(mockInterventionCallback);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Panel Creation and Visibility', () => {
    it('should create crisis management panel with correct structure', () => {
      const panelElement = container.querySelector('.crisis-management-panel');
      expect(panelElement).toBeTruthy();
      expect(panelElement?.classList.contains('hidden')).toBe(true);
    });

    it('should have all required sections', () => {
      const panelElement = container.querySelector('.crisis-management-panel');
      
      expect(panelElement?.querySelector('.crisis-header')).toBeTruthy();
      expect(panelElement?.querySelector('.emergency-controls')).toBeTruthy();
      expect(panelElement?.querySelector('.circuit-breakers')).toBeTruthy();
      expect(panelElement?.querySelector('.manual-overrides')).toBeTruthy();
      expect(panelElement?.querySelector('.crisis-diagnostics')).toBeTruthy();
      expect(panelElement?.querySelector('.crisis-actions')).toBeTruthy();
    });

    it('should show panel when crisis is triggered', () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [{
          timestamp: Date.now(),
          description: 'Test crisis event',
          deviceId: 'device1',
          eventType: 'malfunction',
          severity: 0.8
        }],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);

      const panelElement = container.querySelector('.crisis-management-panel');
      expect(panelElement?.classList.contains('visible')).toBe(true);
      expect(panelElement?.classList.contains('hidden')).toBe(false);
      expect(panel.isCurrentlyVisible()).toBe(true);
    });

    it('should hide panel when requested', () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);
      panel.hide();

      const panelElement = container.querySelector('.crisis-management-panel');
      expect(panelElement?.classList.contains('hidden')).toBe(true);
      expect(panel.isCurrentlyVisible()).toBe(false);
    });
  });

  describe('Crisis Display Updates', () => {
    it('should update crisis severity indicator correctly', () => {
      const highSeverityCrisis: CrisisScenario = {
        id: 'high-severity',
        type: CrisisType.RESOURCE_EXHAUSTION,
        severity: 0.9,
        involvedAgents: ['device1', 'device2', 'device3'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(highSeverityCrisis);

      const severityFill = container.querySelector('.severity-fill') as HTMLElement;
      const severityText = container.querySelector('.severity-text') as HTMLElement;
      const crisisTitle = container.querySelector('.crisis-title') as HTMLElement;

      expect(severityFill.style.width).toBe('90%');
      expect(severityFill.classList.contains('critical')).toBe(true);
      expect(severityText.textContent).toBe('Critical');
      expect(crisisTitle.textContent).toContain('CRITICAL SYSTEM FAILURE');
    });

    it('should display medium severity crisis correctly', () => {
      const mediumSeverityCrisis: CrisisScenario = {
        id: 'medium-severity',
        type: CrisisType.COMMUNICATION_BREAKDOWN,
        severity: 0.4,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mediumSeverityCrisis);

      const severityFill = container.querySelector('.severity-fill') as HTMLElement;
      const severityText = container.querySelector('.severity-text') as HTMLElement;

      expect(severityFill.style.width).toBe('40%');
      expect(severityFill.classList.contains('medium')).toBe(true);
      expect(severityText.textContent).toBe('Medium');
    });
  });

  describe('Emergency Controls', () => {
    it('should handle emergency stop button click', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1', 'device2'],
        systemStabilized: true,
        message: 'Emergency stop successful'
      });

      panel.show(mockCrisis);

      const emergencyStopBtn = container.querySelector('.emergency-stop-btn') as HTMLButtonElement;
      emergencyStopBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockInterventionCallback).toHaveBeenCalledWith({
        type: 'emergency_stop',
        deviceIds: ['device1', 'device2'],
        parameters: {},
        priority: 'critical'
      });
    });

    it('should handle system reset button click', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1'],
        systemStabilized: true,
        message: 'System reset successful'
      });

      panel.show(mockCrisis);

      const systemResetBtn = container.querySelector('.system-reset-btn') as HTMLButtonElement;
      systemResetBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockInterventionCallback).toHaveBeenCalledWith({
        type: 'system_reset',
        deviceIds: ['device1'],
        parameters: { preserveConfiguration: true },
        priority: 'critical'
      });
    });

    it('should show feedback for successful interventions', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.PRIVACY_PARADOX,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1'],
        systemStabilized: true,
        message: 'Intervention successful'
      });

      panel.show(mockCrisis);

      const emergencyStopBtn = container.querySelector('.emergency-stop-btn') as HTMLButtonElement;
      emergencyStopBtn.click();

      await new Promise(resolve => setTimeout(resolve, 200));

      const feedback = container.querySelector('.intervention-feedback');
      expect(feedback).toBeTruthy();
      expect(feedback?.classList.contains('success')).toBe(true);
      expect(feedback?.querySelector('.feedback-message')?.textContent).toBe('Intervention successful');
    });
  });

  describe('Circuit Breakers', () => {
    it('should create circuit breakers for involved devices', () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.RESOURCE_EXHAUSTION,
        severity: 0.7,
        involvedAgents: ['device1', 'device2', 'device3'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);

      const breakerGrid = container.querySelector('.breaker-grid');
      const breakers = breakerGrid?.querySelectorAll('.circuit-breaker');
      
      expect(breakers?.length).toBe(3);
      
      const deviceNames = Array.from(breakers || []).map(breaker => 
        breaker.querySelector('.device-name')?.textContent
      );
      
      expect(deviceNames).toContain('device1');
      expect(deviceNames).toContain('device2');
      expect(deviceNames).toContain('device3');
    });

    it('should handle circuit breaker toggle', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.COMMUNICATION_BREAKDOWN,
        severity: 0.8,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1'],
        systemStabilized: false,
        message: 'Device isolated'
      });

      panel.show(mockCrisis);

      const breakerToggle = container.querySelector('.breaker-toggle') as HTMLButtonElement;
      expect(breakerToggle.textContent?.trim()).toBe('ISOLATE');
      
      breakerToggle.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockInterventionCallback).toHaveBeenCalledWith({
        type: 'isolate_device',
        deviceIds: ['device1'],
        parameters: { reason: 'Manual isolation during crisis' },
        priority: 'high'
      });
    });

    it('should update circuit breaker states after successful isolation', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1'],
        systemStabilized: false,
        message: 'Device isolated successfully'
      });

      panel.show(mockCrisis);

      const breakerToggle = container.querySelector('.breaker-toggle') as HTMLButtonElement;
      breakerToggle.click();

      await new Promise(resolve => setTimeout(resolve, 200));

      const circuitBreakerStates = panel.getCircuitBreakerStates();
      const device1State = circuitBreakerStates.get('device1');
      
      expect(device1State?.isolated).toBe(true);
      expect(device1State?.isolationReason).toContain('Manually isolated during crisis management');
    });
  });

  describe('Manual Overrides', () => {
    it('should create manual override controls for involved devices', () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);

      const overrideControls = container.querySelector('.override-controls');
      const devicePanels = overrideControls?.querySelectorAll('.device-override-panel');
      
      expect(devicePanels?.length).toBe(2);
      
      // Check for slider controls
      const sliders = overrideControls?.querySelectorAll('input[type="range"]');
      expect(sliders?.length).toBe(4); // 2 devices × 2 sliders each
      
      // Check for switch controls
      const switches = overrideControls?.querySelectorAll('.toggle-switch');
      expect(switches?.length).toBe(2); // 1 switch per device
    });

    it('should handle slider value changes', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.RESOURCE_EXHAUSTION,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1'],
        systemStabilized: false,
        message: 'Manual override applied'
      });

      panel.show(mockCrisis);

      const prioritySlider = container.querySelector('.priority-slider') as HTMLInputElement;
      prioritySlider.value = '75';
      prioritySlider.dispatchEvent(new Event('input'));

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockInterventionCallback).toHaveBeenCalledWith({
        type: 'manual_override',
        deviceIds: ['device1'],
        parameters: { priority: 75 },
        priority: 'medium'
      });

      // Check that slider value display is updated
      const sliderValue = prioritySlider.parentElement?.querySelector('.slider-value');
      expect(sliderValue?.textContent).toBe('75%');
    });

    it('should handle switch toggle', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.COMMUNICATION_BREAKDOWN,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockResolvedValue({
        success: true,
        affectedDevices: ['device1'],
        systemStabilized: false,
        message: 'Communication toggled'
      });

      panel.show(mockCrisis);

      const toggleSwitch = container.querySelector('.toggle-switch') as HTMLButtonElement;
      expect(toggleSwitch.classList.contains('active')).toBe(true);
      
      toggleSwitch.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockInterventionCallback).toHaveBeenCalledWith({
        type: 'manual_override',
        deviceIds: ['device1'],
        parameters: { communication: false },
        priority: 'medium'
      });

      expect(toggleSwitch.classList.contains('active')).toBe(false);
    });
  });

  describe('Crisis Diagnostics', () => {
    it('should display crisis information correctly', () => {
      const mockCrisis: CrisisScenario = {
        id: 'diagnostic-test',
        type: CrisisType.PRIVACY_PARADOX,
        severity: 0.85,
        involvedAgents: ['device1', 'device2', 'device3'],
        triggerEvents: [
          {
            timestamp: Date.now() - 5000,
            description: 'Privacy violation detected',
            deviceId: 'device1',
            eventType: 'privacy_breach',
            severity: 0.7
          },
          {
            timestamp: Date.now() - 2000,
            description: 'Data sharing conflict',
            deviceId: 'device2',
            eventType: 'data_conflict',
            severity: 0.8
          }
        ],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);

      const diagnosticItems = container.querySelectorAll('.diagnostic-item');
      const diagnosticValues = Array.from(diagnosticItems).map(item => 
        item.querySelector('.diagnostic-value')?.textContent
      );

      expect(diagnosticValues).toContain('privacy_paradox');
      expect(diagnosticValues).toContain('3'); // affected devices
      expect(diagnosticValues).toContain('HIGH'); // escalation risk

      // Check timeline events
      const timelineEvents = container.querySelectorAll('.timeline-event');
      expect(timelineEvents.length).toBe(2);
      
      const eventDescriptions = Array.from(timelineEvents).map(event =>
        event.querySelector('.event-description')?.textContent
      );
      
      expect(eventDescriptions).toContain('Privacy violation detected');
      expect(eventDescriptions).toContain('Data sharing conflict');
    });

    it('should show high risk indicator for severe crises', () => {
      const severeCrisis: CrisisScenario = {
        id: 'severe-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.95,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(severeCrisis);

      const riskValue = container.querySelector('.diagnostic-value.high-risk');
      expect(riskValue).toBeTruthy();
      expect(riskValue?.textContent).toBe('HIGH');
    });
  });

  describe('Panel Actions', () => {
    it('should close panel when close button is clicked', () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);
      expect(panel.isCurrentlyVisible()).toBe(true);

      const closeBtn = container.querySelector('.close-panel-btn') as HTMLButtonElement;
      closeBtn.click();

      expect(panel.isCurrentlyVisible()).toBe(false);
    });

    it('should start recovery wizard when button is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.RESOURCE_EXHAUSTION,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);

      const recoveryWizardBtn = container.querySelector('.recovery-wizard-btn') as HTMLButtonElement;
      recoveryWizardBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith('Starting recovery wizard...');
      expect(panel.isCurrentlyVisible()).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should track current crisis correctly', () => {
      const mockCrisis: CrisisScenario = {
        id: 'state-test',
        type: CrisisType.COMMUNICATION_BREAKDOWN,
        severity: 0.6,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      expect(panel.getCurrentCrisis()).toBeNull();

      panel.show(mockCrisis);
      expect(panel.getCurrentCrisis()).toEqual(mockCrisis);

      panel.hide();
      expect(panel.getCurrentCrisis()).toEqual(mockCrisis); // Crisis data persists when hidden
    });

    it('should clear all overrides when requested', () => {
      const mockCrisis: CrisisScenario = {
        id: 'clear-test',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panel.show(mockCrisis);
      
      // Simulate some overrides being applied
      const circuitBreakerStates = panel.getCircuitBreakerStates();
      const manualOverrides = panel.getManualOverrides();
      
      // Initially should be empty
      expect(circuitBreakerStates.size).toBe(0);
      expect(manualOverrides.size).toBe(0);

      panel.clearAllOverrides();
      
      expect(panel.getCircuitBreakerStates().size).toBe(0);
      expect(panel.getManualOverrides().size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle intervention callback errors gracefully', async () => {
      const mockCrisis: CrisisScenario = {
        id: 'error-test',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      mockInterventionCallback.mockRejectedValue(new Error('Network error'));

      panel.show(mockCrisis);

      const emergencyStopBtn = container.querySelector('.emergency-stop-btn') as HTMLButtonElement;
      emergencyStopBtn.click();

      await new Promise(resolve => setTimeout(resolve, 200));

      const feedback = container.querySelector('.intervention-feedback');
      expect(feedback).toBeTruthy();
      expect(feedback?.classList.contains('error')).toBe(true);
      expect(feedback?.querySelector('.feedback-message')?.textContent).toContain('Emergency stop failed');
    });

    it('should handle missing intervention callback', async () => {
      const panelWithoutCallback = new CrisisManagementPanel(container);
      
      const mockCrisis: CrisisScenario = {
        id: 'no-callback-test',
        type: CrisisType.PRIVACY_PARADOX,
        severity: 0.5,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      panelWithoutCallback.show(mockCrisis);

      const emergencyStopBtn = container.querySelector('.emergency-stop-btn') as HTMLButtonElement;
      
      // Should not throw error when callback is missing
      expect(() => emergencyStopBtn.click()).not.toThrow();
    });
  });
});