import { 
  CrisisScenario, 
  CrisisType, 
  RecoveryAction, 
  InterventionTool,
  ActionPriority,
  RecoveryActionType,
  InterventionType
} from '../types/core';
import { CrisisManagementPanel, InterventionResult } from '../ui/CrisisManagementPanel';
import { RecoveryWizard, LearningData } from '../ui/RecoveryWizard';

export interface CrisisManagementOptions {
  autoDetectionEnabled: boolean;
  interventionThreshold: number;
  emergencyProtocolsEnabled: boolean;
  manualOverrideAllowed: boolean;
}

export interface SystemHealthMetrics {
  harmonyLevel: number;
  resourceUtilization: number;
  communicationEfficiency: number;
  conflictIntensity: number;
  stabilityIndex: number;
}

export interface DeviceState {
  id: string;
  operational: boolean;
  isolated: boolean;
  overridden: boolean;
  priority: number;
  resourceUsage: number;
  communicationActive: boolean;
  lastActivity: number;
}

export class CrisisManagementSystem {
  private panel: CrisisManagementPanel;
  private recoveryWizard: RecoveryWizard;
  private activeCrisis: CrisisScenario | null = null;
  private interventionTools: Map<string, InterventionTool> = new Map();
  private deviceStates: Map<string, DeviceState> = new Map();
  private systemHealth: SystemHealthMetrics;
  private options: CrisisManagementOptions;
  private onSystemUpdateCallback?: (devices: DeviceState[]) => void;

  constructor(container: HTMLElement, options: Partial<CrisisManagementOptions> = {}) {
    this.options = {
      autoDetectionEnabled: true,
      interventionThreshold: 0.7,
      emergencyProtocolsEnabled: true,
      manualOverrideAllowed: true,
      ...options
    };

    this.systemHealth = {
      harmonyLevel: 1.0,
      resourceUtilization: 0.5,
      communicationEfficiency: 1.0,
      conflictIntensity: 0.0,
      stabilityIndex: 1.0
    };

    this.panel = new CrisisManagementPanel(container);
    this.panel.setInterventionCallback(this.handleIntervention.bind(this));
    this.panel.setRecoveryWizardCallback(this.startRecoveryWizard.bind(this));
    
    this.recoveryWizard = new RecoveryWizard(container, {
      showEducationalContent: true,
      enableSlowMotionReplay: true,
      trackLearningProgress: true,
      celebrateSuccess: true
    });
    this.recoveryWizard.setActionCallback(this.handleRecoveryAction.bind(this));
    this.recoveryWizard.setCompleteCallback(this.handleRecoveryComplete.bind(this));
    
    this.initializeInterventionTools();
  }

  private initializeInterventionTools(): void {
    const tools: InterventionTool[] = [
      {
        id: 'emergency_stop',
        name: 'Emergency Stop',
        type: InterventionType.EMERGENCY_STOP,
        enabled: this.options.emergencyProtocolsEnabled,
        cooldown: 0
      },
      {
        id: 'circuit_breaker',
        name: 'Circuit Breaker',
        type: InterventionType.CIRCUIT_BREAKER,
        enabled: true,
        cooldown: 1000
      },
      {
        id: 'manual_override',
        name: 'Manual Override',
        type: InterventionType.MANUAL_OVERRIDE,
        enabled: this.options.manualOverrideAllowed,
        cooldown: 500
      },
      {
        id: 'priority_control',
        name: 'Priority Control',
        type: InterventionType.PRIORITY_CONTROL,
        enabled: true,
        cooldown: 2000
      }
    ];

    tools.forEach(tool => {
      this.interventionTools.set(tool.id, tool);
    });
  }

  public registerDevice(deviceId: string, initialState?: Partial<DeviceState>): void {
    const defaultState: DeviceState = {
      id: deviceId,
      operational: true,
      isolated: false,
      overridden: false,
      priority: 50,
      resourceUsage: 0.3,
      communicationActive: true,
      lastActivity: Date.now()
    };

    this.deviceStates.set(deviceId, { ...defaultState, ...initialState });
  }

  public unregisterDevice(deviceId: string): void {
    this.deviceStates.delete(deviceId);
  }

  public updateSystemHealth(metrics: Partial<SystemHealthMetrics>): void {
    this.systemHealth = { ...this.systemHealth, ...metrics };
    
    // Check for crisis conditions
    if (this.options.autoDetectionEnabled && !this.activeCrisis) {
      this.checkForCrisisConditions();
    }
  }

  public updateDeviceState(deviceId: string, updates: Partial<DeviceState>): void {
    const currentState = this.deviceStates.get(deviceId);
    if (currentState) {
      this.deviceStates.set(deviceId, { ...currentState, ...updates });
      
      if (this.onSystemUpdateCallback) {
        this.onSystemUpdateCallback(Array.from(this.deviceStates.values()));
      }
    }
  }

  private checkForCrisisConditions(): void {
    const crisisThreshold = this.options.interventionThreshold;
    
    // Check various crisis conditions
    if (this.systemHealth.stabilityIndex < crisisThreshold) {
      this.triggerCrisis(this.detectCrisisType());
    }
  }

  private detectCrisisType(): CrisisType {
    const { harmonyLevel, conflictIntensity, communicationEfficiency, resourceUtilization } = this.systemHealth;
    
    if (resourceUtilization > 0.9) {
      return CrisisType.RESOURCE_EXHAUSTION;
    } else if (communicationEfficiency < 0.3) {
      return CrisisType.COMMUNICATION_BREAKDOWN;
    } else if (conflictIntensity > 0.8) {
      return CrisisType.AUTHORITY_CONFLICT;
    } else if (harmonyLevel < 0.2 && conflictIntensity > 0.6) {
      return CrisisType.FEEDBACK_LOOP;
    } else {
      return CrisisType.PRIVACY_PARADOX;
    }
  }

  public triggerCrisis(crisisType: CrisisType, involvedDevices?: string[]): void {
    if (this.activeCrisis) {
      // Escalate existing crisis
      this.escalateCrisis(crisisType);
      return;
    }

    const devices = involvedDevices || this.getProblematicDevices();
    
    const crisis: CrisisScenario = {
      id: `crisis_${Date.now()}`,
      type: crisisType,
      severity: this.calculateCrisisSeverity(),
      involvedAgents: devices,
      triggerEvents: this.generateTriggerEvents(devices),
      cascadeEffects: this.predictCascadeEffects(devices),
      recoveryOptions: this.generateRecoveryOptions(crisisType)
    };

    this.activeCrisis = crisis;
    this.panel.show(crisis);
    
    console.log(`Crisis triggered: ${crisisType} affecting ${devices.length} devices`);
  }

  private getProblematicDevices(): string[] {
    return Array.from(this.deviceStates.entries())
      .filter(([_, state]) => 
        !state.operational || 
        state.resourceUsage > 0.8 || 
        !state.communicationActive
      )
      .map(([id, _]) => id);
  }

  private calculateCrisisSeverity(): number {
    const { stabilityIndex, conflictIntensity, harmonyLevel } = this.systemHealth;
    return Math.max(0, Math.min(1, 
      (1 - stabilityIndex) * 0.4 + 
      conflictIntensity * 0.4 + 
      (1 - harmonyLevel) * 0.2
    ));
  }

  private generateTriggerEvents(deviceIds: string[]): any[] {
    return deviceIds.map(deviceId => ({
      timestamp: Date.now() - Math.random() * 30000,
      description: `Device ${deviceId} entered unstable state`,
      deviceId,
      eventType: 'state_change',
      severity: Math.random() * 0.5 + 0.5
    }));
  }

  private predictCascadeEffects(deviceIds: string[]): any[] {
    const effects: any[] = [];
    
    deviceIds.forEach(sourceId => {
      deviceIds.forEach(targetId => {
        if (sourceId !== targetId && Math.random() > 0.7) {
          effects.push({
            sourceDeviceId: sourceId,
            targetDeviceId: targetId,
            effectType: 'resource_drain',
            magnitude: Math.random() * 0.5 + 0.3
          });
        }
      });
    });
    
    return effects;
  }

  private generateRecoveryOptions(crisisType: CrisisType): any[] {
    const baseOptions = [
      {
        id: 'emergency_stop',
        name: 'Emergency Stop All Devices',
        description: 'Immediately halt all device operations',
        effectiveness: 0.9,
        riskLevel: 0.1
      },
      {
        id: 'isolate_problematic',
        name: 'Isolate Problematic Devices',
        description: 'Disconnect devices causing the crisis',
        effectiveness: 0.7,
        riskLevel: 0.3
      }
    ];

    // Add crisis-specific options
    switch (crisisType) {
      case CrisisType.RESOURCE_EXHAUSTION:
        baseOptions.push({
          id: 'resource_reallocation',
          name: 'Emergency Resource Reallocation',
          description: 'Redistribute resources to critical devices',
          effectiveness: 0.8,
          riskLevel: 0.2
        });
        break;
      case CrisisType.AUTHORITY_CONFLICT:
        baseOptions.push({
          id: 'priority_reset',
          name: 'Reset Device Priorities',
          description: 'Clear all priority conflicts and restart',
          effectiveness: 0.6,
          riskLevel: 0.4
        });
        break;
      case CrisisType.COMMUNICATION_BREAKDOWN:
        baseOptions.push({
          id: 'communication_reset',
          name: 'Reset Communication Protocols',
          description: 'Restart all device communication systems',
          effectiveness: 0.7,
          riskLevel: 0.3
        });
        break;
    }

    return baseOptions;
  }

  private escalateCrisis(newCrisisType: CrisisType): void {
    if (!this.activeCrisis) return;

    this.activeCrisis.severity = Math.min(1.0, this.activeCrisis.severity + 0.2);
    this.activeCrisis.type = newCrisisType;
    
    // Add more devices to the crisis
    const additionalDevices = this.getProblematicDevices()
      .filter(id => !this.activeCrisis!.involvedAgents.includes(id));
    
    this.activeCrisis.involvedAgents.push(...additionalDevices);
    
    this.panel.show(this.activeCrisis);
  }

  private async handleIntervention(action: RecoveryAction): Promise<InterventionResult> {
    console.log(`Executing intervention: ${action.type} on devices:`, action.deviceIds);

    try {
      switch (action.type) {
        case RecoveryActionType.EMERGENCY_STOP:
          return await this.executeEmergencyStop(action.deviceIds);
        
        case RecoveryActionType.SYSTEM_RESET:
          return await this.executeSystemReset(action.deviceIds, action.parameters);
        
        case RecoveryActionType.ISOLATE_DEVICE:
          return await this.executeDeviceIsolation(action.deviceIds[0], action.parameters);
        
        case RecoveryActionType.RECONNECT_DEVICE:
          return await this.executeDeviceReconnection(action.deviceIds[0]);
        
        case RecoveryActionType.MANUAL_OVERRIDE:
          return await this.executeManualOverride(action.deviceIds[0], action.parameters);
        
        case RecoveryActionType.PRIORITY_ADJUSTMENT:
          return await this.executePriorityAdjustment(action.deviceIds, action.parameters);
        
        default:
          throw new Error(`Unknown intervention type: ${action.type}`);
      }
    } catch (error) {
      console.error('Intervention failed:', error);
      return {
        success: false,
        affectedDevices: [],
        systemStabilized: false,
        message: `Intervention failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeEmergencyStop(deviceIds: string[]): Promise<InterventionResult> {
    const affectedDevices: string[] = [];
    
    deviceIds.forEach(deviceId => {
      const state = this.deviceStates.get(deviceId);
      if (state) {
        this.updateDeviceState(deviceId, { 
          operational: false, 
          communicationActive: false,
          resourceUsage: 0
        });
        affectedDevices.push(deviceId);
      }
    });

    // Simulate system stabilization
    await this.simulateDelay(1000);
    
    this.updateSystemHealth({
      stabilityIndex: 0.8,
      conflictIntensity: 0.1,
      harmonyLevel: 0.6
    });

    return {
      success: true,
      affectedDevices,
      systemStabilized: true,
      message: `Emergency stop executed on ${affectedDevices.length} devices. System stabilized.`
    };
  }

  private async executeSystemReset(deviceIds: string[], parameters: any): Promise<InterventionResult> {
    const affectedDevices: string[] = [];
    const preserveConfig = parameters.preserveConfiguration || false;
    
    deviceIds.forEach(deviceId => {
      const state = this.deviceStates.get(deviceId);
      if (state) {
        this.updateDeviceState(deviceId, {
          operational: true,
          isolated: false,
          overridden: false,
          priority: preserveConfig ? state.priority : 50,
          resourceUsage: 0.3,
          communicationActive: true,
          lastActivity: Date.now()
        });
        affectedDevices.push(deviceId);
      }
    });

    await this.simulateDelay(2000);
    
    this.updateSystemHealth({
      stabilityIndex: 0.9,
      conflictIntensity: 0.0,
      harmonyLevel: 0.8,
      communicationEfficiency: 1.0
    });

    this.activeCrisis = null;

    return {
      success: true,
      affectedDevices,
      systemStabilized: true,
      message: `System reset completed for ${affectedDevices.length} devices. All systems operational.`
    };
  }

  private async executeDeviceIsolation(deviceId: string, parameters: any): Promise<InterventionResult> {
    const state = this.deviceStates.get(deviceId);
    if (!state) {
      throw new Error(`Device ${deviceId} not found`);
    }

    this.updateDeviceState(deviceId, {
      isolated: true,
      communicationActive: false,
      resourceUsage: 0
    });

    await this.simulateDelay(500);

    // Check if isolation helped stabilize the system
    const remainingProblematicDevices = this.getProblematicDevices()
      .filter(id => id !== deviceId);
    
    const systemImproved = remainingProblematicDevices.length < this.getProblematicDevices().length;
    
    if (systemImproved) {
      this.updateSystemHealth({
        stabilityIndex: Math.min(1.0, this.systemHealth.stabilityIndex + 0.2),
        conflictIntensity: Math.max(0.0, this.systemHealth.conflictIntensity - 0.3)
      });
    }

    return {
      success: true,
      affectedDevices: [deviceId],
      systemStabilized: systemImproved,
      message: `Device ${deviceId} isolated successfully. ${systemImproved ? 'System stability improved.' : 'System still unstable.'}`
    };
  }

  private async executeDeviceReconnection(deviceId: string): Promise<InterventionResult> {
    const state = this.deviceStates.get(deviceId);
    if (!state) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (!state.isolated) {
      throw new Error(`Device ${deviceId} is not isolated`);
    }

    this.updateDeviceState(deviceId, {
      isolated: false,
      operational: true,
      communicationActive: true,
      resourceUsage: 0.3,
      lastActivity: Date.now()
    });

    await this.simulateDelay(1000);

    return {
      success: true,
      affectedDevices: [deviceId],
      systemStabilized: false, // Reconnection might cause instability
      message: `Device ${deviceId} reconnected successfully. Monitor system stability.`
    };
  }

  private async executeManualOverride(deviceId: string, parameters: any): Promise<InterventionResult> {
    const state = this.deviceStates.get(deviceId);
    if (!state) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const updates: Partial<DeviceState> = { overridden: true };
    
    if (parameters.priority !== undefined) {
      updates.priority = Math.max(0, Math.min(100, parameters.priority));
    }
    
    if (parameters.resources !== undefined) {
      updates.resourceUsage = Math.max(0, Math.min(1, parameters.resources / 100));
    }
    
    if (parameters.communication !== undefined) {
      updates.communicationActive = parameters.communication;
    }

    this.updateDeviceState(deviceId, updates);

    await this.simulateDelay(300);

    return {
      success: true,
      affectedDevices: [deviceId],
      systemStabilized: false,
      message: `Manual override applied to device ${deviceId}. Parameters updated.`
    };
  }

  private async executePriorityAdjustment(deviceIds: string[], parameters: any): Promise<InterventionResult> {
    const affectedDevices: string[] = [];
    const newPriority = parameters.priority || 50;
    
    deviceIds.forEach(deviceId => {
      const state = this.deviceStates.get(deviceId);
      if (state) {
        this.updateDeviceState(deviceId, { priority: newPriority });
        affectedDevices.push(deviceId);
      }
    });

    await this.simulateDelay(800);

    // Priority adjustments can help resolve authority conflicts
    if (this.activeCrisis?.type === CrisisType.AUTHORITY_CONFLICT) {
      this.updateSystemHealth({
        conflictIntensity: Math.max(0.0, this.systemHealth.conflictIntensity - 0.4),
        stabilityIndex: Math.min(1.0, this.systemHealth.stabilityIndex + 0.3)
      });
    }

    return {
      success: true,
      affectedDevices,
      systemStabilized: this.systemHealth.stabilityIndex > 0.7,
      message: `Priority adjusted for ${affectedDevices.length} devices. Conflict resolution in progress.`
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public resolveCrisis(): void {
    this.activeCrisis = null;
    this.panel.hide();
    
    // Reset system to stable state
    this.updateSystemHealth({
      stabilityIndex: 0.9,
      conflictIntensity: 0.1,
      harmonyLevel: 0.8
    });
  }

  public getSystemHealth(): SystemHealthMetrics {
    return { ...this.systemHealth };
  }

  public getDeviceStates(): DeviceState[] {
    return Array.from(this.deviceStates.values());
  }

  public getActiveCrisis(): CrisisScenario | null {
    return this.activeCrisis;
  }

  public isInCrisis(): boolean {
    return this.activeCrisis !== null;
  }

  public setSystemUpdateCallback(callback: (devices: DeviceState[]) => void): void {
    this.onSystemUpdateCallback = callback;
  }

  public getInterventionTools(): InterventionTool[] {
    return Array.from(this.interventionTools.values());
  }

  public enableTool(toolId: string): void {
    const tool = this.interventionTools.get(toolId);
    if (tool) {
      tool.enabled = true;
    }
  }

  public disableTool(toolId: string): void {
    const tool = this.interventionTools.get(toolId);
    if (tool) {
      tool.enabled = false;
    }
  }

  public startRecoveryWizard(crisis: CrisisScenario): void {
    console.log('Starting recovery wizard for crisis:', crisis.type);
    this.recoveryWizard.startRecovery(crisis);
  }

  private async handleRecoveryAction(action: RecoveryAction): Promise<boolean> {
    try {
      const result = await this.handleIntervention(action);
      return result.success;
    } catch (error) {
      console.error('Recovery action failed:', error);
      return false;
    }
  }

  private handleRecoveryComplete(success: boolean, learningData: LearningData): void {
    console.log('Recovery wizard completed:', { success, learningData });
    
    if (success) {
      // Crisis was successfully resolved
      this.resolveCrisis();
      
      // Track learning progress
      this.trackLearningProgress(learningData);
      
      console.log('✅ Crisis successfully resolved through guided recovery!');
    } else {
      console.log('⚠️ Recovery wizard completed with partial success');
    }
  }

  private trackLearningProgress(learningData: LearningData): void {
    // This would integrate with a learning analytics system
    const progressData = {
      timestamp: Date.now(),
      crisisType: learningData.crisisType,
      completionRate: learningData.completionRate,
      timeSpent: learningData.timeSpent,
      success: learningData.success,
      skillImprovement: this.calculateSkillImprovement(learningData)
    };
    
    console.log('📊 Learning Progress Tracked:', progressData);
    
    // Store learning data (would integrate with persistent storage)
    this.storeLearningData(progressData);
  }

  private calculateSkillImprovement(learningData: LearningData): number {
    // Calculate skill improvement based on completion rate and time
    const baseImprovement = learningData.completionRate * 0.5;
    const timeBonus = Math.max(0, (300000 - learningData.timeSpent) / 300000) * 0.3; // 5 minute baseline
    const successBonus = learningData.success ? 0.2 : 0;
    
    return Math.min(1.0, baseImprovement + timeBonus + successBonus);
  }

  private storeLearningData(progressData: any): void {
    // This would store learning data for analytics and progress tracking
    // For now, just log it
    console.log('💾 Storing learning data:', progressData);
  }

  // Public methods for triggering crises (for testing and simulation)
  public triggerCrisis(crisis: CrisisScenario): void {
    this.activeCrisis = crisis;
    if (this.onCrisisDetected) {
      this.onCrisisDetected(crisis);
    }
  }

  public resolveCrisis(result: any): void {
    if (this.activeCrisis && this.onCrisisResolved) {
      this.onCrisisResolved(this.activeCrisis, result);
      this.activeCrisis = null;
    }
  }

  // Callback properties for integration
  public onCrisisDetected?: (crisis: CrisisScenario) => void;
  public onCrisisResolved?: (crisis: CrisisScenario, result: any) => void;
}