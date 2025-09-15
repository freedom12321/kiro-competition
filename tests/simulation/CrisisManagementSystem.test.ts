// Jest globals: describe, it, expect, beforeEach, afterEach
import { CrisisManagementSystem, SystemHealthMetrics, DeviceState } from '@/simulation/CrisisManagementSystem';
import { CrisisType, RecoveryActionType, ActionPriority } from '@/types/core';

// Mock DOM environment
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

describe('CrisisManagementSystem', () => {
  let container: HTMLElement;
  let crisisSystem: CrisisManagementSystem;
  let mockSystemUpdateCallback: jest.MockedFunction<(devices: DeviceState[]) => void>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    crisisSystem = new CrisisManagementSystem(container, {
      autoDetectionEnabled: true,
      interventionThreshold: 0.7,
      emergencyProtocolsEnabled: true,
      manualOverrideAllowed: true
    });

    mockSystemUpdateCallback = jest.fn();
    crisisSystem.setSystemUpdateCallback(mockSystemUpdateCallback);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('System Initialization', () => {
    it('should initialize with default system health metrics', () => {
      const health = crisisSystem.getSystemHealth();
      
      expect(health.harmonyLevel).toBe(1.0);
      expect(health.resourceUtilization).toBe(0.5);
      expect(health.communicationEfficiency).toBe(1.0);
      expect(health.conflictIntensity).toBe(0.0);
      expect(health.stabilityIndex).toBe(1.0);
    });

    it('should initialize intervention tools correctly', () => {
      const tools = crisisSystem.getInterventionTools();
      
      expect(tools.length).toBe(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('Emergency Stop');
      expect(toolNames).toContain('Circuit Breaker');
      expect(toolNames).toContain('Manual Override');
      expect(toolNames).toContain('Priority Control');
    });

    it('should not be in crisis initially', () => {
      expect(crisisSystem.isInCrisis()).toBe(false);
      expect(crisisSystem.getActiveCrisis()).toBeNull();
    });
  });

  describe('Device Management', () => {
    it('should register devices with default state', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2', { priority: 75, resourceUsage: 0.6 });

      const devices = crisisSystem.getDeviceStates();
      expect(devices.length).toBe(2);

      const device1 = devices.find(d => d.id === 'device1');
      const device2 = devices.find(d => d.id === 'device2');

      expect(device1?.operational).toBe(true);
      expect(device1?.priority).toBe(50);
      expect(device1?.resourceUsage).toBe(0.3);

      expect(device2?.priority).toBe(75);
      expect(device2?.resourceUsage).toBe(0.6);
    });

    it('should update device states and trigger callback', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.updateDeviceState('device1', { 
        operational: false, 
        resourceUsage: 0.9 
      });

      expect(mockSystemUpdateCallback).toHaveBeenCalled();
      
      const devices = crisisSystem.getDeviceStates();
      const device1 = devices.find(d => d.id === 'device1');
      
      expect(device1?.operational).toBe(false);
      expect(device1?.resourceUsage).toBe(0.9);
    });

    it('should unregister devices correctly', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');
      
      expect(crisisSystem.getDeviceStates().length).toBe(2);
      
      crisisSystem.unregisterDevice('device1');
      
      const devices = crisisSystem.getDeviceStates();
      expect(devices.length).toBe(1);
      expect(devices[0].id).toBe('device2');
    });
  });

  describe('Crisis Detection', () => {
    it('should detect crisis when stability index drops below threshold', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');

      // Update system health to trigger crisis
      crisisSystem.updateSystemHealth({
        stabilityIndex: 0.6, // Below threshold of 0.7
        conflictIntensity: 0.8,
        harmonyLevel: 0.3
      });

      expect(crisisSystem.isInCrisis()).toBe(true);
      
      const crisis = crisisSystem.getActiveCrisis();
      expect(crisis).toBeTruthy();
      expect(crisis?.severity).toBeGreaterThan(0);
    });

    it('should detect different crisis types based on system metrics', () => {
      crisisSystem.registerDevice('device1');

      // Test resource exhaustion detection
      crisisSystem.updateSystemHealth({
        stabilityIndex: 0.6,
        resourceUtilization: 0.95
      });

      let crisis = crisisSystem.getActiveCrisis();
      expect(crisis?.type).toBe(CrisisType.RESOURCE_EXHAUSTION);

      // Reset and test communication breakdown
      crisisSystem.resolveCrisis();
      crisisSystem.updateSystemHealth({
        stabilityIndex: 0.6,
        communicationEfficiency: 0.2
      });

      crisis = crisisSystem.getActiveCrisis();
      expect(crisis?.type).toBe(CrisisType.COMMUNICATION_BREAKDOWN);
    });

    it('should not trigger crisis when auto-detection is disabled', () => {
      const systemWithoutAutoDetection = new CrisisManagementSystem(container, {
        autoDetectionEnabled: false,
        interventionThreshold: 0.7
      });

      systemWithoutAutoDetection.registerDevice('device1');
      systemWithoutAutoDetection.updateSystemHealth({
        stabilityIndex: 0.5 // Below threshold
      });

      expect(systemWithoutAutoDetection.isInCrisis()).toBe(false);
    });
  });

  describe('Manual Crisis Triggering', () => {
    it('should trigger crisis manually with specified type', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');

      crisisSystem.triggerCrisis(CrisisType.AUTHORITY_CONFLICT, ['device1', 'device2']);

      expect(crisisSystem.isInCrisis()).toBe(true);
      
      const crisis = crisisSystem.getActiveCrisis();
      expect(crisis?.type).toBe(CrisisType.AUTHORITY_CONFLICT);
      expect(crisis?.involvedAgents).toEqual(['device1', 'device2']);
    });

    it('should escalate existing crisis when new crisis is triggered', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');

      // Trigger initial crisis
      crisisSystem.triggerCrisis(CrisisType.COMMUNICATION_BREAKDOWN, ['device1']);
      const initialSeverity = crisisSystem.getActiveCrisis()?.severity || 0;

      // Trigger escalation
      crisisSystem.triggerCrisis(CrisisType.AUTHORITY_CONFLICT, ['device2']);
      
      const escalatedCrisis = crisisSystem.getActiveCrisis();
      expect(escalatedCrisis?.severity).toBeGreaterThan(initialSeverity);
      expect(escalatedCrisis?.type).toBe(CrisisType.AUTHORITY_CONFLICT);
      expect(escalatedCrisis?.involvedAgents).toContain('device1');
      expect(escalatedCrisis?.involvedAgents).toContain('device2');
    });
  });

  describe('Emergency Stop Intervention', () => {
    it('should execute emergency stop successfully', async () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');
      
      crisisSystem.triggerCrisis(CrisisType.FEEDBACK_LOOP, ['device1', 'device2']);

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.EMERGENCY_STOP,
        deviceIds: ['device1', 'device2'],
        parameters: {},
        priority: ActionPriority.CRITICAL
      });

      expect(result.success).toBe(true);
      expect(result.affectedDevices).toEqual(['device1', 'device2']);
      expect(result.systemStabilized).toBe(true);

      // Check device states
      const devices = crisisSystem.getDeviceStates();
      devices.forEach(device => {
        expect(device.operational).toBe(false);
        expect(device.communicationActive).toBe(false);
        expect(device.resourceUsage).toBe(0);
      });

      // Check system health improvement
      const health = crisisSystem.getSystemHealth();
      expect(health.stabilityIndex).toBe(0.8);
      expect(health.conflictIntensity).toBe(0.1);
    });
  });

  describe('System Reset Intervention', () => {
    it('should execute system reset with configuration preservation', async () => {
      crisisSystem.registerDevice('device1', { priority: 80 });
      crisisSystem.updateDeviceState('device1', { operational: false, isolated: true });

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.SYSTEM_RESET,
        deviceIds: ['device1'],
        parameters: { preserveConfiguration: true },
        priority: ActionPriority.CRITICAL
      });

      expect(result.success).toBe(true);
      expect(result.systemStabilized).toBe(true);

      const device = crisisSystem.getDeviceStates().find(d => d.id === 'device1');
      expect(device?.operational).toBe(true);
      expect(device?.isolated).toBe(false);
      expect(device?.priority).toBe(80); // Preserved
      expect(device?.communicationActive).toBe(true);

      // Crisis should be resolved
      expect(crisisSystem.getActiveCrisis()).toBeNull();
    });

    it('should reset device priorities when configuration is not preserved', async () => {
      crisisSystem.registerDevice('device1', { priority: 80 });

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.SYSTEM_RESET,
        deviceIds: ['device1'],
        parameters: { preserveConfiguration: false },
        priority: ActionPriority.CRITICAL
      });

      expect(result.success).toBe(true);

      const device = crisisSystem.getDeviceStates().find(d => d.id === 'device1');
      expect(device?.priority).toBe(50); // Reset to default
    });
  });

  describe('Device Isolation Intervention', () => {
    it('should isolate device successfully', async () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.ISOLATE_DEVICE,
        deviceIds: ['device1'],
        parameters: { reason: 'Manual isolation test' },
        priority: ActionPriority.HIGH
      });

      expect(result.success).toBe(true);
      expect(result.affectedDevices).toEqual(['device1']);

      const device1 = crisisSystem.getDeviceStates().find(d => d.id === 'device1');
      expect(device1?.isolated).toBe(true);
      expect(device1?.communicationActive).toBe(false);
      expect(device1?.resourceUsage).toBe(0);
    });

    it('should fail to isolate non-existent device', async () => {
      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.ISOLATE_DEVICE,
        deviceIds: ['nonexistent'],
        parameters: {},
        priority: ActionPriority.HIGH
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Device nonexistent not found');
    });
  });

  describe('Device Reconnection Intervention', () => {
    it('should reconnect isolated device successfully', async () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.updateDeviceState('device1', { 
        isolated: true, 
        operational: false,
        communicationActive: false 
      });

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.RECONNECT_DEVICE,
        deviceIds: ['device1'],
        parameters: {},
        priority: ActionPriority.HIGH
      });

      expect(result.success).toBe(true);
      expect(result.affectedDevices).toEqual(['device1']);

      const device1 = crisisSystem.getDeviceStates().find(d => d.id === 'device1');
      expect(device1?.isolated).toBe(false);
      expect(device1?.operational).toBe(true);
      expect(device1?.communicationActive).toBe(true);
    });

    it('should fail to reconnect non-isolated device', async () => {
      crisisSystem.registerDevice('device1'); // Not isolated

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.RECONNECT_DEVICE,
        deviceIds: ['device1'],
        parameters: {},
        priority: ActionPriority.HIGH
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Device device1 is not isolated');
    });
  });

  describe('Manual Override Intervention', () => {
    it('should apply manual overrides to device parameters', async () => {
      crisisSystem.registerDevice('device1');

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.MANUAL_OVERRIDE,
        deviceIds: ['device1'],
        parameters: { 
          priority: 90, 
          resources: 25, 
          communication: false 
        },
        priority: ActionPriority.MEDIUM
      });

      expect(result.success).toBe(true);
      expect(result.affectedDevices).toEqual(['device1']);

      const device1 = crisisSystem.getDeviceStates().find(d => d.id === 'device1');
      expect(device1?.overridden).toBe(true);
      expect(device1?.priority).toBe(90);
      expect(device1?.resourceUsage).toBe(0.25);
      expect(device1?.communicationActive).toBe(false);
    });

    it('should clamp parameter values to valid ranges', async () => {
      crisisSystem.registerDevice('device1');

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.MANUAL_OVERRIDE,
        deviceIds: ['device1'],
        parameters: { 
          priority: 150, // Should be clamped to 100
          resources: -10  // Should be clamped to 0
        },
        priority: ActionPriority.MEDIUM
      });

      expect(result.success).toBe(true);

      const device1 = crisisSystem.getDeviceStates().find(d => d.id === 'device1');
      expect(device1?.priority).toBe(100);
      expect(device1?.resourceUsage).toBe(0);
    });
  });

  describe('Priority Adjustment Intervention', () => {
    it('should adjust priorities for multiple devices', async () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.registerDevice('device2');
      crisisSystem.registerDevice('device3');

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.PRIORITY_ADJUSTMENT,
        deviceIds: ['device1', 'device2', 'device3'],
        parameters: { priority: 75 },
        priority: ActionPriority.MEDIUM
      });

      expect(result.success).toBe(true);
      expect(result.affectedDevices).toEqual(['device1', 'device2', 'device3']);

      const devices = crisisSystem.getDeviceStates();
      devices.forEach(device => {
        expect(device.priority).toBe(75);
      });
    });

    it('should improve system health for authority conflicts', async () => {
      crisisSystem.registerDevice('device1');
      
      // Set up initial system health with high conflict
      crisisSystem['updateSystemHealth']({
        conflictIntensity: 0.9,
        stabilityIndex: 0.2
      });
      
      crisisSystem.triggerCrisis(CrisisType.AUTHORITY_CONFLICT, ['device1']);
      
      const initialHealth = crisisSystem.getSystemHealth();

      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.PRIORITY_ADJUSTMENT,
        deviceIds: ['device1'],
        parameters: { priority: 60 },
        priority: ActionPriority.MEDIUM
      });

      expect(result.success).toBe(true);

      const newHealth = crisisSystem.getSystemHealth();
      expect(newHealth.conflictIntensity).toBeLessThan(initialHealth.conflictIntensity);
      expect(newHealth.stabilityIndex).toBeGreaterThan(initialHealth.stabilityIndex);
    });
  });

  describe('Tool Management', () => {
    it('should enable and disable intervention tools', () => {
      const tools = crisisSystem.getInterventionTools();
      const emergencyStopTool = tools.find(t => t.id === 'emergency_stop');
      
      expect(emergencyStopTool?.enabled).toBe(true);

      crisisSystem.disableTool('emergency_stop');
      const updatedTools = crisisSystem.getInterventionTools();
      const disabledTool = updatedTools.find(t => t.id === 'emergency_stop');
      
      expect(disabledTool?.enabled).toBe(false);

      crisisSystem.enableTool('emergency_stop');
      const reenabledTools = crisisSystem.getInterventionTools();
      const reenabledTool = reenabledTools.find(t => t.id === 'emergency_stop');
      
      expect(reenabledTool?.enabled).toBe(true);
    });
  });

  describe('Crisis Resolution', () => {
    it('should resolve crisis and restore system health', () => {
      crisisSystem.registerDevice('device1');
      crisisSystem.triggerCrisis(CrisisType.FEEDBACK_LOOP, ['device1']);

      expect(crisisSystem.isInCrisis()).toBe(true);

      crisisSystem.resolveCrisis();

      expect(crisisSystem.isInCrisis()).toBe(false);
      expect(crisisSystem.getActiveCrisis()).toBeNull();

      const health = crisisSystem.getSystemHealth();
      expect(health.stabilityIndex).toBe(0.9);
      expect(health.conflictIntensity).toBe(0.1);
      expect(health.harmonyLevel).toBe(0.8);
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown intervention types gracefully', async () => {
      crisisSystem.registerDevice('device1');

      const result = await crisisSystem['handleIntervention']({
        type: 'unknown_type' as RecoveryActionType,
        deviceIds: ['device1'],
        parameters: {},
        priority: ActionPriority.MEDIUM
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown intervention type');
    });

    it('should return error result for failed interventions', async () => {
      // Try to operate on non-existent device
      const result = await crisisSystem['handleIntervention']({
        type: RecoveryActionType.MANUAL_OVERRIDE,
        deviceIds: ['nonexistent'],
        parameters: { priority: 50 },
        priority: ActionPriority.MEDIUM
      });

      expect(result.success).toBe(false);
      expect(result.affectedDevices).toEqual([]);
      expect(result.systemStabilized).toBe(false);
      expect(result.message).toContain('Intervention failed');
    });
  });

  describe('System Health Updates', () => {
    it('should update system health metrics correctly', () => {
      const newMetrics: Partial<SystemHealthMetrics> = {
        harmonyLevel: 0.6,
        conflictIntensity: 0.4,
        resourceUtilization: 0.8
      };

      crisisSystem.updateSystemHealth(newMetrics);

      const health = crisisSystem.getSystemHealth();
      expect(health.harmonyLevel).toBe(0.6);
      expect(health.conflictIntensity).toBe(0.4);
      expect(health.resourceUtilization).toBe(0.8);
      // Other metrics should remain unchanged
      expect(health.communicationEfficiency).toBe(1.0);
      expect(health.stabilityIndex).toBe(1.0);
    });
  });
});