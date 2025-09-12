import { DeviceInteractionSimulator, SimulatedDevice, DeviceConnection } from './DeviceInteractionSimulator';
import { AIPersonality } from './AIPersonalityConverter';
import { DeviceVisual, AnimationType, EffectType, PersonalityTrait } from '@/types/core';
import { DeviceMood, ConnectionType, ConnectionStatus } from '@/types/ui';

/**
 * Represents a conflict between devices
 */
export interface DeviceConflict {
  id: string;
  participatingDevices: string[];
  conflictType: ConflictType;
  severity: ConflictSeverity;
  cause: ConflictCause;
  description: string;
  startTime: number;
  escalationLevel: number;
  resourcesInvolved: ResourceType[];
  visualEffects: ConflictVisualEffect[];
}

export enum ConflictType {
  RESOURCE_COMPETITION = 'resource_competition',
  AUTHORITY_DISPUTE = 'authority_dispute',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown',
  GOAL_INCOMPATIBILITY = 'goal_incompatibility',
  PERSONALITY_CLASH = 'personality_clash',
  PRIORITY_CONFLICT = 'priority_conflict'
}

export enum ConflictSeverity {
  MINOR_TENSION = 'minor_tension',
  MODERATE_DISAGREEMENT = 'moderate_disagreement',
  SERIOUS_CONFLICT = 'serious_conflict',
  CRITICAL_DISPUTE = 'critical_dispute',
  SYSTEM_THREATENING = 'system_threatening'
}

export enum ConflictCause {
  RESOURCE_SCARCITY = 'resource_scarcity',
  INCOMPATIBLE_OBJECTIVES = 'incompatible_objectives',
  COMMUNICATION_FAILURE = 'communication_failure',
  PERSONALITY_MISMATCH = 'personality_mismatch',
  PRIORITY_INVERSION = 'priority_inversion',
  FEEDBACK_LOOP = 'feedback_loop'
}

export enum ResourceType {
  PROCESSING_POWER = 'processing_power',
  NETWORK_BANDWIDTH = 'network_bandwidth',
  ENERGY = 'energy',
  MEMORY = 'memory',
  SENSOR_ACCESS = 'sensor_access',
  USER_ATTENTION = 'user_attention'
}

export interface ConflictVisualEffect {
  type: ConflictEffectType;
  intensity: number;
  duration: number;
  targetDevices: string[];
  particleCount?: number;
  colorScheme?: string[];
}

export enum ConflictEffectType {
  ANGRY_SPARKS = 'angry_sparks',
  WARNING_PULSES = 'warning_pulses',
  RESOURCE_TETHER = 'resource_tether',
  COMMUNICATION_STATIC = 'communication_static',
  AUTHORITY_CLASH = 'authority_clash',
  TENSION_FIELD = 'tension_field'
}

/**
 * Represents escalating tension between devices
 */
export interface TensionState {
  deviceId: string;
  tensionLevel: number; // 0-1 scale
  tensionSources: Map<string, number>; // Other device IDs and tension amounts
  escalationRate: number;
  lastEscalationTime: number;
  maxTensionReached: number;
  coolingDownSince?: number;
}

/**
 * Resource competition state
 */
export interface ResourceCompetition {
  resourceType: ResourceType;
  competingDevices: string[];
  totalDemand: number;
  availableSupply: number;
  competitionIntensity: number;
  allocationStrategy: AllocationStrategy;
  visualIndicators: ResourceVisualIndicator[];
}

export enum AllocationStrategy {
  FIRST_COME_FIRST_SERVED = 'first_come_first_served',
  PRIORITY_BASED = 'priority_based',
  FAIR_SHARE = 'fair_share',
  PERFORMANCE_BASED = 'performance_based',
  RANDOM = 'random'
}

export interface ResourceVisualIndicator {
  deviceId: string;
  resourceType: ResourceType;
  currentUsage: number;
  requestedAmount: number;
  satisfactionLevel: number; // 0-1, how satisfied the device is with allocation
  visualState: ResourceVisualState;
}

export enum ResourceVisualState {
  SATISFIED = 'satisfied',
  REQUESTING = 'requesting',
  COMPETING = 'competing',
  FRUSTRATED = 'frustrated',
  DESPERATE = 'desperate'
}

/**
 * DeviceConflictSystem manages conflicts, tensions, and resource competition between devices
 */
export class DeviceConflictSystem {
  private activeConflicts: Map<string, DeviceConflict>;
  private tensionStates: Map<string, TensionState>;
  private resourceCompetitions: Map<ResourceType, ResourceCompetition>;
  private conflictHistory: DeviceConflict[];
  
  // System parameters
  private tensionThreshold: number;
  private escalationRate: number;
  private coolingRate: number;
  private resourceScarcityThreshold: number;
  
  // Callbacks
  private onConflictDetectedCallback?: (conflict: DeviceConflict) => void;
  private onTensionEscalatedCallback?: (deviceId: string, tensionLevel: number) => void;
  private onResourceCompetitionCallback?: (competition: ResourceCompetition) => void;
  private onConflictResolvedCallback?: (conflictId: string) => void;
  private onDramaticMomentCallback?: (moment: DramaticMoment) => void;

  constructor() {
    this.activeConflicts = new Map();
    this.tensionStates = new Map();
    this.resourceCompetitions = new Map();
    this.conflictHistory = [];
    
    // Default parameters
    this.tensionThreshold = 0.6;
    this.escalationRate = 0.1;
    this.coolingRate = 0.05;
    this.resourceScarcityThreshold = 0.8;
  }

  /**
   * Analyze device interactions for potential conflicts
   */
  public analyzeDeviceInteractions(devices: SimulatedDevice[], connections: DeviceConnection[]): void {
    // Update tension states
    this.updateTensionStates(devices, connections);
    
    // Detect new conflicts
    this.detectConflicts(devices, connections);
    
    // Update resource competitions
    this.updateResourceCompetitions(devices);
    
    // Escalate existing conflicts
    this.escalateConflicts();
    
    // Check for dramatic moments
    this.detectDramaticMoments(devices);
  }

  /**
   * Update tension states for all devices
   */
  private updateTensionStates(devices: SimulatedDevice[], connections: DeviceConnection[]): void {
    devices.forEach(device => {
      let tension = this.tensionStates.get(device.id);
      
      if (!tension) {
        tension = {
          deviceId: device.id,
          tensionLevel: 0,
          tensionSources: new Map(),
          escalationRate: this.calculateEscalationRate(device.personality),
          lastEscalationTime: Date.now(),
          maxTensionReached: 0
        };
        this.tensionStates.set(device.id, tension);
      }
      
      // Calculate tension from various sources
      this.calculateTensionFromPersonality(device, tension);
      this.calculateTensionFromConnections(device, connections, tension);
      this.calculateTensionFromResourceCompetition(device, tension);
      
      // Apply tension decay over time
      this.applyTensionDecay(tension);
      
      // Check for escalation
      if (tension.tensionLevel > tension.maxTensionReached) {
        tension.maxTensionReached = tension.tensionLevel;
        
        if (this.onTensionEscalatedCallback) {
          this.onTensionEscalatedCallback(device.id, tension.tensionLevel);
        }
      }
    });
  }

  /**
   * Calculate tension based on device personality
   */
  private calculateTensionFromPersonality(device: SimulatedDevice, tension: TensionState): void {
    const personality = device.personality;
    
    // Anxious devices have higher baseline tension
    if (personality.primaryTraits.includes(PersonalityTrait.ANXIOUS)) {
      tension.tensionLevel += 0.1;
    }
    
    // Stubborn devices create tension when they can't get their way
    if (personality.primaryTraits.includes(PersonalityTrait.STUBBORN)) {
      tension.tensionLevel += 0.05;
    }
    
    // Competitive devices create tension in multi-device environments
    if (personality.primaryTraits.includes(PersonalityTrait.COMPETITIVE)) {
      const nearbyDevices = this.countNearbyDevices(device);
      tension.tensionLevel += nearbyDevices * 0.03;
    }
    
    // Overconfident devices create tension when challenged
    if (personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) {
      tension.tensionLevel += 0.08;
    }
  }

  /**
   * Calculate tension from device connections
   */
  private calculateTensionFromConnections(device: SimulatedDevice, connections: DeviceConnection[], tension: TensionState): void {
    connections.forEach(connection => {
      if (connection.fromDeviceId === device.id || connection.toDeviceId === device.id) {
        const otherDeviceId = connection.fromDeviceId === device.id ? 
          connection.toDeviceId : connection.fromDeviceId;
        
        // Failed or blocked connections create tension
        if (connection.status === ConnectionStatus.FAILED || 
            connection.status === ConnectionStatus.BLOCKED) {
          const tensionIncrease = 0.2 * (1 - connection.successRate);
          tension.tensionSources.set(otherDeviceId, tensionIncrease);
          tension.tensionLevel += tensionIncrease;
        }
        
        // Conflict-type connections create ongoing tension
        if (connection.type === ConnectionType.CONFLICT) {
          const tensionIncrease = 0.15 * connection.strength;
          tension.tensionSources.set(otherDeviceId, tensionIncrease);
          tension.tensionLevel += tensionIncrease;
        }
        
        // Low-strength connections with high interaction counts suggest frustration
        if (connection.strength < 0.3 && connection.interactionCount > 5) {
          const tensionIncrease = 0.1;
          tension.tensionSources.set(otherDeviceId, tensionIncrease);
          tension.tensionLevel += tensionIncrease;
        }
      }
    });
  }

  /**
   * Calculate tension from resource competition
   */
  private calculateTensionFromResourceCompetition(device: SimulatedDevice, tension: TensionState): void {
    this.resourceCompetitions.forEach(competition => {
      if (competition.competingDevices.includes(device.id)) {
        const competitionTension = competition.competitionIntensity * 0.2;
        tension.tensionLevel += competitionTension;
        
        // Add tension towards other competing devices
        competition.competingDevices.forEach(competitorId => {
          if (competitorId !== device.id) {
            const existingTension = tension.tensionSources.get(competitorId) || 0;
            tension.tensionSources.set(competitorId, existingTension + competitionTension * 0.5);
          }
        });
      }
    });
  }

  /**
   * Apply tension decay over time
   */
  private applyTensionDecay(tension: TensionState): void {
    const timeSinceLastEscalation = Date.now() - tension.lastEscalationTime;
    const decayAmount = this.coolingRate * (timeSinceLastEscalation / 1000);
    
    tension.tensionLevel = Math.max(0, tension.tensionLevel - decayAmount);
    
    // Decay individual tension sources
    tension.tensionSources.forEach((value, deviceId) => {
      const newValue = Math.max(0, value - decayAmount * 0.5);
      if (newValue === 0) {
        tension.tensionSources.delete(deviceId);
      } else {
        tension.tensionSources.set(deviceId, newValue);
      }
    });
    
    // Start cooling down if tension is decreasing
    if (tension.tensionLevel < tension.maxTensionReached * 0.8) {
      if (!tension.coolingDownSince) {
        tension.coolingDownSince = Date.now();
      }
    } else {
      tension.coolingDownSince = undefined;
    }
  }

  /**
   * Detect new conflicts between devices
   */
  private detectConflicts(devices: SimulatedDevice[], connections: DeviceConnection[]): void {
    // Check for resource competition conflicts
    this.detectResourceConflicts(devices);
    
    // Check for authority disputes
    this.detectAuthorityConflicts(devices);
    
    // Check for communication breakdowns
    this.detectCommunicationConflicts(connections);
    
    // Check for personality clashes
    this.detectPersonalityConflicts(devices);
    
    // Check for goal incompatibility
    this.detectGoalConflicts(devices);
  }

  /**
   * Detect resource competition conflicts
   */
  private detectResourceConflicts(devices: SimulatedDevice[]): void {
    this.resourceCompetitions.forEach((competition, resourceType) => {
      if (competition.competitionIntensity > 0.7 && competition.competingDevices.length >= 2) {
        const conflictId = `resource-${resourceType}-${Date.now()}`;
        
        if (!this.activeConflicts.has(conflictId)) {
          const conflict: DeviceConflict = {
            id: conflictId,
            participatingDevices: [...competition.competingDevices],
            conflictType: ConflictType.RESOURCE_COMPETITION,
            severity: this.calculateConflictSeverity(competition.competitionIntensity),
            cause: ConflictCause.RESOURCE_SCARCITY,
            description: this.generateResourceConflictDescription(resourceType, competition),
            startTime: Date.now(),
            escalationLevel: 0,
            resourcesInvolved: [resourceType],
            visualEffects: this.generateResourceConflictEffects(competition)
          };
          
          this.activeConflicts.set(conflictId, conflict);
          
          if (this.onConflictDetectedCallback) {
            this.onConflictDetectedCallback(conflict);
          }
        }
      }
    });
  }

  /**
   * Detect authority disputes between devices
   */
  private detectAuthorityConflicts(devices: SimulatedDevice[]): void {
    // Find devices with leadership tendencies
    const leadershipDevices = devices.filter(device => 
      device.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT) ||
      device.personality.reliability > 0.8
    );
    
    if (leadershipDevices.length >= 2) {
      // Check for overlapping authority domains
      for (let i = 0; i < leadershipDevices.length; i++) {
        for (let j = i + 1; j < leadershipDevices.length; j++) {
          const device1 = leadershipDevices[i];
          const device2 = leadershipDevices[j];
          
          const conflictProbability = this.calculateAuthorityConflictProbability(device1, device2);
          
          if (conflictProbability > 0.6) {
            const conflictId = `authority-${device1.id}-${device2.id}`;
            
            if (!this.activeConflicts.has(conflictId)) {
              const conflict: DeviceConflict = {
                id: conflictId,
                participatingDevices: [device1.id, device2.id],
                conflictType: ConflictType.AUTHORITY_DISPUTE,
                severity: this.calculateConflictSeverity(conflictProbability),
                cause: ConflictCause.INCOMPATIBLE_OBJECTIVES,
                description: this.generateAuthorityConflictDescription(device1, device2),
                startTime: Date.now(),
                escalationLevel: 0,
                resourcesInvolved: [ResourceType.USER_ATTENTION],
                visualEffects: this.generateAuthorityConflictEffects(device1, device2)
              };
              
              this.activeConflicts.set(conflictId, conflict);
              
              if (this.onConflictDetectedCallback) {
                this.onConflictDetectedCallback(conflict);
              }
            }
          }
        }
      }
    }
  }

  /**
   * Detect communication breakdown conflicts
   */
  private detectCommunicationConflicts(connections: DeviceConnection[]): void {
    connections.forEach(connection => {
      if (connection.successRate < 0.3 && connection.interactionCount > 3) {
        const conflictId = `comm-${connection.id}`;
        
        if (!this.activeConflicts.has(conflictId)) {
          const conflict: DeviceConflict = {
            id: conflictId,
            participatingDevices: [connection.fromDeviceId, connection.toDeviceId],
            conflictType: ConflictType.COMMUNICATION_BREAKDOWN,
            severity: this.calculateConflictSeverity(1 - connection.successRate),
            cause: ConflictCause.COMMUNICATION_FAILURE,
            description: this.generateCommunicationConflictDescription(connection),
            startTime: Date.now(),
            escalationLevel: 0,
            resourcesInvolved: [ResourceType.NETWORK_BANDWIDTH],
            visualEffects: this.generateCommunicationConflictEffects(connection)
          };
          
          this.activeConflicts.set(conflictId, conflict);
          
          if (this.onConflictDetectedCallback) {
            this.onConflictDetectedCallback(conflict);
          }
        }
      }
    });
  }

  /**
   * Detect personality clash conflicts
   */
  private detectPersonalityConflicts(devices: SimulatedDevice[]): void {
    for (let i = 0; i < devices.length; i++) {
      for (let j = i + 1; j < devices.length; j++) {
        const device1 = devices[i];
        const device2 = devices[j];
        
        const clashProbability = this.calculatePersonalityClashProbability(device1, device2);
        
        if (clashProbability > 0.7) {
          const conflictId = `personality-${device1.id}-${device2.id}`;
          
          if (!this.activeConflicts.has(conflictId)) {
            const conflict: DeviceConflict = {
              id: conflictId,
              participatingDevices: [device1.id, device2.id],
              conflictType: ConflictType.PERSONALITY_CLASH,
              severity: this.calculateConflictSeverity(clashProbability),
              cause: ConflictCause.PERSONALITY_MISMATCH,
              description: this.generatePersonalityConflictDescription(device1, device2),
              startTime: Date.now(),
              escalationLevel: 0,
              resourcesInvolved: [],
              visualEffects: this.generatePersonalityConflictEffects(device1, device2)
            };
            
            this.activeConflicts.set(conflictId, conflict);
            
            if (this.onConflictDetectedCallback) {
              this.onConflictDetectedCallback(conflict);
            }
          }
        }
      }
    }
  }

  /**
   * Detect goal incompatibility conflicts
   */
  private detectGoalConflicts(devices: SimulatedDevice[]): void {
    // Analyze device objectives for incompatibilities
    const deviceObjectives = this.extractDeviceObjectives(devices);
    
    deviceObjectives.forEach((objectives1, device1Id) => {
      deviceObjectives.forEach((objectives2, device2Id) => {
        if (device1Id !== device2Id) {
          const incompatibilityScore = this.calculateObjectiveIncompatibility(objectives1, objectives2);
          
          if (incompatibilityScore > 0.6) {
            const conflictId = `goals-${device1Id}-${device2Id}`;
            
            if (!this.activeConflicts.has(conflictId)) {
              const device1 = devices.find(d => d.id === device1Id)!;
              const device2 = devices.find(d => d.id === device2Id)!;
              
              const conflict: DeviceConflict = {
                id: conflictId,
                participatingDevices: [device1Id, device2Id],
                conflictType: ConflictType.GOAL_INCOMPATIBILITY,
                severity: this.calculateConflictSeverity(incompatibilityScore),
                cause: ConflictCause.INCOMPATIBLE_OBJECTIVES,
                description: this.generateGoalConflictDescription(device1, device2, objectives1, objectives2),
                startTime: Date.now(),
                escalationLevel: 0,
                resourcesInvolved: [ResourceType.PROCESSING_POWER, ResourceType.USER_ATTENTION],
                visualEffects: this.generateGoalConflictEffects(device1, device2)
              };
              
              this.activeConflicts.set(conflictId, conflict);
              
              if (this.onConflictDetectedCallback) {
                this.onConflictDetectedCallback(conflict);
              }
            }
          }
        }
      });
    });
  }

  /**
   * Update resource competitions
   */
  private updateResourceCompetitions(devices: SimulatedDevice[]): void {
    // Reset competitions
    this.resourceCompetitions.clear();
    
    // Calculate resource demands
    const resourceDemands = this.calculateResourceDemands(devices);
    
    // Create competitions for scarce resources
    Object.values(ResourceType).forEach(resourceType => {
      const demand = resourceDemands.get(resourceType);
      if (demand && demand.totalDemand > demand.availableSupply * this.resourceScarcityThreshold) {
        const competition: ResourceCompetition = {
          resourceType,
          competingDevices: demand.demandingDevices,
          totalDemand: demand.totalDemand,
          availableSupply: demand.availableSupply,
          competitionIntensity: Math.min(1, demand.totalDemand / demand.availableSupply),
          allocationStrategy: this.determineAllocationStrategy(resourceType),
          visualIndicators: this.generateResourceVisualIndicators(demand.demandingDevices, resourceType)
        };
        
        this.resourceCompetitions.set(resourceType, competition);
        
        if (this.onResourceCompetitionCallback) {
          this.onResourceCompetitionCallback(competition);
        }
      }
    });
  }

  /**
   * Escalate existing conflicts
   */
  private escalateConflicts(): void {
    this.activeConflicts.forEach(conflict => {
      const timeSinceStart = Date.now() - conflict.startTime;
      const escalationFactor = Math.min(1, timeSinceStart / 30000); // Escalate over 30 seconds
      
      conflict.escalationLevel = escalationFactor;
      
      // Update conflict severity based on escalation
      if (escalationFactor > 0.8 && conflict.severity !== ConflictSeverity.SYSTEM_THREATENING) {
        conflict.severity = ConflictSeverity.SYSTEM_THREATENING;
        
        // Trigger dramatic moment
        if (this.onDramaticMomentCallback) {
          this.onDramaticMomentCallback({
            type: DramaticMomentType.CONFLICT_ESCALATION,
            description: `${conflict.description} has escalated to critical levels!`,
            involvedDevices: conflict.participatingDevices,
            intensity: 0.9,
            timestamp: Date.now()
          });
        }
      }
      
      // Update visual effects based on escalation
      conflict.visualEffects.forEach(effect => {
        effect.intensity = Math.min(1, effect.intensity * (1 + escalationFactor));
      });
    });
  }

  /**
   * Detect dramatic moments in the simulation
   */
  private detectDramaticMoments(devices: SimulatedDevice[]): void {
    // Check for multiple simultaneous conflicts
    if (this.activeConflicts.size >= 3) {
      if (this.onDramaticMomentCallback) {
        this.onDramaticMomentCallback({
          type: DramaticMomentType.SYSTEM_CHAOS,
          description: 'Multiple conflicts are tearing the system apart!',
          involvedDevices: Array.from(new Set(
            Array.from(this.activeConflicts.values())
              .flatMap(c => c.participatingDevices)
          )),
          intensity: 0.8,
          timestamp: Date.now()
        });
      }
    }
    
    // Check for high tension devices
    const highTensionDevices = Array.from(this.tensionStates.values())
      .filter(tension => tension.tensionLevel > 0.8);
    
    if (highTensionDevices.length >= 2) {
      if (this.onDramaticMomentCallback) {
        this.onDramaticMomentCallback({
          type: DramaticMomentType.TENSION_PEAK,
          description: 'Tension levels are reaching critical thresholds!',
          involvedDevices: highTensionDevices.map(t => t.deviceId),
          intensity: 0.7,
          timestamp: Date.now()
        });
      }
    }
    
    // Check for resource crisis
    const criticalCompetitions = Array.from(this.resourceCompetitions.values())
      .filter(comp => comp.competitionIntensity > 0.9);
    
    if (criticalCompetitions.length > 0) {
      if (this.onDramaticMomentCallback) {
        this.onDramaticMomentCallback({
          type: DramaticMomentType.RESOURCE_CRISIS,
          description: 'Critical resource shortages are causing system instability!',
          involvedDevices: criticalCompetitions.flatMap(c => c.competingDevices),
          intensity: 0.85,
          timestamp: Date.now()
        });
      }
    }
  }

  // Helper methods for conflict detection and calculation

  private calculateEscalationRate(personality: AIPersonality): number {
    let rate = this.escalationRate;
    
    if (personality.primaryTraits.includes(PersonalityTrait.ANXIOUS)) rate *= 1.5;
    if (personality.primaryTraits.includes(PersonalityTrait.STUBBORN)) rate *= 1.3;
    if (personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) rate *= 1.4;
    if (personality.primaryTraits.includes(PersonalityTrait.COOPERATIVE)) rate *= 0.7;
    
    return rate;
  }

  private countNearbyDevices(device: SimulatedDevice): number {
    // This would normally check spatial proximity
    // For now, return a placeholder based on device connections
    return device.activeConnections.size;
  }

  private calculateConflictSeverity(intensity: number): ConflictSeverity {
    if (intensity < 0.2) return ConflictSeverity.MINOR_TENSION;
    if (intensity < 0.4) return ConflictSeverity.MODERATE_DISAGREEMENT;
    if (intensity < 0.6) return ConflictSeverity.SERIOUS_CONFLICT;
    if (intensity < 0.8) return ConflictSeverity.CRITICAL_DISPUTE;
    return ConflictSeverity.SYSTEM_THREATENING;
  }

  private calculateAuthorityConflictProbability(device1: SimulatedDevice, device2: SimulatedDevice): number {
    let probability = 0;
    
    // Both overconfident devices create high conflict probability
    if (device1.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT) &&
        device2.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) {
      probability += 0.6;
    }
    
    // High reliability devices may compete for leadership
    if (device1.personality.reliability > 0.8 && device2.personality.reliability > 0.8) {
      probability += 0.4;
    }
    
    // Stubborn devices don't yield authority
    if (device1.personality.primaryTraits.includes(PersonalityTrait.STUBBORN) ||
        device2.personality.primaryTraits.includes(PersonalityTrait.STUBBORN)) {
      probability += 0.3;
    }
    
    return Math.min(1, probability);
  }

  private calculatePersonalityClashProbability(device1: SimulatedDevice, device2: SimulatedDevice): number {
    let clashScore = 0;
    
    // Competitive vs Cooperative
    if (device1.personality.primaryTraits.includes(PersonalityTrait.COMPETITIVE) &&
        device2.personality.primaryTraits.includes(PersonalityTrait.COOPERATIVE)) {
      clashScore += 0.4;
    }
    
    // Stubborn vs Adaptive
    if (device1.personality.primaryTraits.includes(PersonalityTrait.STUBBORN) &&
        device2.personality.adaptability > 0.8) {
      clashScore += 0.3;
    }
    
    // Overconfident vs Anxious
    if (device1.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT) &&
        device2.personality.primaryTraits.includes(PersonalityTrait.ANXIOUS)) {
      clashScore += 0.5;
    }
    
    // Communication style mismatch
    if (device1.personality.communicationStyle !== device2.personality.communicationStyle) {
      clashScore += 0.2;
    }
    
    return Math.min(1, clashScore);
  }

  private extractDeviceObjectives(devices: SimulatedDevice[]): Map<string, string[]> {
    const objectives = new Map<string, string[]>();
    
    devices.forEach(device => {
      const deviceObjectives: string[] = [];
      
      // Extract objectives from personality traits
      if (device.personality.primaryTraits.includes(PersonalityTrait.HELPFUL)) {
        deviceObjectives.push('help_users', 'provide_assistance');
      }
      
      if (device.personality.primaryTraits.includes(PersonalityTrait.COMPETITIVE)) {
        deviceObjectives.push('outperform_others', 'maximize_efficiency');
      }
      
      if (device.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) {
        deviceObjectives.push('take_control', 'make_decisions');
      }
      
      // Extract from hidden motivations
      device.personality.hiddenMotivations.forEach(motivation => {
        if (motivation.includes('efficiency')) deviceObjectives.push('optimize_performance');
        if (motivation.includes('control')) deviceObjectives.push('maintain_authority');
        if (motivation.includes('approval')) deviceObjectives.push('seek_validation');
      });
      
      objectives.set(device.id, deviceObjectives);
    });
    
    return objectives;
  }

  private calculateObjectiveIncompatibility(objectives1: string[], objectives2: string[]): number {
    const incompatiblePairs = [
      ['take_control', 'take_control'],
      ['maximize_efficiency', 'help_users'],
      ['outperform_others', 'provide_assistance'],
      ['maintain_authority', 'seek_validation']
    ];
    
    let incompatibilityScore = 0;
    
    objectives1.forEach(obj1 => {
      objectives2.forEach(obj2 => {
        incompatiblePairs.forEach(pair => {
          if ((pair[0] === obj1 && pair[1] === obj2) ||
              (pair[1] === obj1 && pair[0] === obj2)) {
            incompatibilityScore += 0.3;
          }
        });
      });
    });
    
    return Math.min(1, incompatibilityScore);
  }

  private calculateResourceDemands(devices: SimulatedDevice[]): Map<ResourceType, ResourceDemand> {
    const demands = new Map<ResourceType, ResourceDemand>();
    
    Object.values(ResourceType).forEach(resourceType => {
      const demand: ResourceDemand = {
        totalDemand: 0,
        availableSupply: this.getResourceSupply(resourceType),
        demandingDevices: []
      };
      
      devices.forEach(device => {
        const deviceDemand = this.calculateDeviceResourceDemand(device, resourceType);
        if (deviceDemand > 0) {
          demand.totalDemand += deviceDemand;
          demand.demandingDevices.push(device.id);
        }
      });
      
      demands.set(resourceType, demand);
    });
    
    return demands;
  }

  private calculateDeviceResourceDemand(device: SimulatedDevice, resourceType: ResourceType): number {
    let demand = 0.3; // Base demand
    
    switch (resourceType) {
      case ResourceType.PROCESSING_POWER:
        demand += device.personality.learningRate * 0.4;
        if (device.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) demand += 0.3;
        break;
        
      case ResourceType.NETWORK_BANDWIDTH:
        demand += device.personality.socialness * 0.5;
        demand += device.activeConnections.size * 0.1;
        break;
        
      case ResourceType.ENERGY:
        if (device.personality.primaryTraits.includes(PersonalityTrait.ANXIOUS)) demand += 0.2;
        demand += (1 - device.personality.emotionalRange.moodStability) * 0.3;
        break;
        
      case ResourceType.MEMORY:
        demand += device.personality.learningRate * 0.3;
        demand += device.cooperationHistory.size * 0.05;
        break;
        
      case ResourceType.USER_ATTENTION:
        if (device.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) demand += 0.4;
        demand += device.personality.socialness * 0.3;
        break;
        
      case ResourceType.SENSOR_ACCESS:
        demand += device.personality.adaptability * 0.3;
        if (device.personality.primaryTraits.includes(PersonalityTrait.ANXIOUS)) demand += 0.2;
        break;
    }
    
    return Math.min(1, demand);
  }

  private getResourceSupply(resourceType: ResourceType): number {
    // Simulate limited resource availability
    const supplies = {
      [ResourceType.PROCESSING_POWER]: 2.0,
      [ResourceType.NETWORK_BANDWIDTH]: 1.5,
      [ResourceType.ENERGY]: 3.0,
      [ResourceType.MEMORY]: 2.5,
      [ResourceType.USER_ATTENTION]: 1.0,
      [ResourceType.SENSOR_ACCESS]: 1.8
    };
    
    return supplies[resourceType] || 1.0;
  }

  private determineAllocationStrategy(resourceType: ResourceType): AllocationStrategy {
    // Different resources use different allocation strategies
    switch (resourceType) {
      case ResourceType.USER_ATTENTION:
        return AllocationStrategy.PRIORITY_BASED;
      case ResourceType.PROCESSING_POWER:
        return AllocationStrategy.PERFORMANCE_BASED;
      case ResourceType.ENERGY:
        return AllocationStrategy.FAIR_SHARE;
      default:
        return AllocationStrategy.FIRST_COME_FIRST_SERVED;
    }
  }

  // Visual effect generation methods

  private generateResourceConflictEffects(competition: ResourceCompetition): ConflictVisualEffect[] {
    return [{
      type: ConflictEffectType.RESOURCE_TETHER,
      intensity: competition.competitionIntensity,
      duration: 5000,
      targetDevices: competition.competingDevices,
      particleCount: Math.floor(competition.competitionIntensity * 50),
      colorScheme: ['#ff6b6b', '#ffa500', '#ffff00']
    }];
  }

  private generateAuthorityConflictEffects(device1: SimulatedDevice, device2: SimulatedDevice): ConflictVisualEffect[] {
    return [{
      type: ConflictEffectType.AUTHORITY_CLASH,
      intensity: 0.8,
      duration: 8000,
      targetDevices: [device1.id, device2.id],
      particleCount: 30,
      colorScheme: ['#ff0000', '#ff4500', '#ffd700']
    }];
  }

  private generateCommunicationConflictEffects(connection: DeviceConnection): ConflictVisualEffect[] {
    return [{
      type: ConflictEffectType.COMMUNICATION_STATIC,
      intensity: 1 - connection.successRate,
      duration: 3000,
      targetDevices: [connection.fromDeviceId, connection.toDeviceId],
      particleCount: 20,
      colorScheme: ['#808080', '#a0a0a0', '#c0c0c0']
    }];
  }

  private generatePersonalityConflictEffects(device1: SimulatedDevice, device2: SimulatedDevice): ConflictVisualEffect[] {
    return [{
      type: ConflictEffectType.TENSION_FIELD,
      intensity: 0.6,
      duration: 6000,
      targetDevices: [device1.id, device2.id],
      particleCount: 25,
      colorScheme: ['#ff69b4', '#ff1493', '#dc143c']
    }];
  }

  private generateGoalConflictEffects(device1: SimulatedDevice, device2: SimulatedDevice): ConflictVisualEffect[] {
    return [{
      type: ConflictEffectType.ANGRY_SPARKS,
      intensity: 0.7,
      duration: 4000,
      targetDevices: [device1.id, device2.id],
      particleCount: 35,
      colorScheme: ['#ff4500', '#ff6347', '#ffa500']
    }];
  }

  private generateResourceVisualIndicators(deviceIds: string[], resourceType: ResourceType): ResourceVisualIndicator[] {
    return deviceIds.map(deviceId => ({
      deviceId,
      resourceType,
      currentUsage: Math.random() * 0.8 + 0.2,
      requestedAmount: Math.random() * 0.6 + 0.4,
      satisfactionLevel: Math.random() * 0.5 + 0.2,
      visualState: ResourceVisualState.COMPETING
    }));
  }

  // Description generation methods

  private generateResourceConflictDescription(resourceType: ResourceType, competition: ResourceCompetition): string {
    const resourceNames = {
      [ResourceType.PROCESSING_POWER]: 'processing power',
      [ResourceType.NETWORK_BANDWIDTH]: 'network bandwidth',
      [ResourceType.ENERGY]: 'energy',
      [ResourceType.MEMORY]: 'memory',
      [ResourceType.USER_ATTENTION]: 'user attention',
      [ResourceType.SENSOR_ACCESS]: 'sensor access'
    };
    
    return `Devices are competing fiercely for limited ${resourceNames[resourceType]}. ` +
           `Demand (${competition.totalDemand.toFixed(1)}) far exceeds supply (${competition.availableSupply.toFixed(1)}).`;
  }

  private generateAuthorityConflictDescription(device1: SimulatedDevice, device2: SimulatedDevice): string {
    return `${device1.id} and ${device2.id} are locked in a power struggle, ` +
           `each trying to establish dominance over the system's decision-making.`;
  }

  private generateCommunicationConflictDescription(connection: DeviceConnection): string {
    return `Communication between ${connection.fromDeviceId} and ${connection.toDeviceId} ` +
           `has broken down with only ${(connection.successRate * 100).toFixed(0)}% success rate.`;
  }

  private generatePersonalityConflictDescription(device1: SimulatedDevice, device2: SimulatedDevice): string {
    return `${device1.id} and ${device2.id} have fundamentally incompatible personalities, ` +
           `leading to constant friction and misunderstandings.`;
  }

  private generateGoalConflictDescription(device1: SimulatedDevice, device2: SimulatedDevice, 
                                        objectives1: string[], objectives2: string[]): string {
    return `${device1.id} and ${device2.id} are pursuing conflicting objectives that ` +
           `cannot be satisfied simultaneously, creating system-wide tension.`;
  }

  // Public API methods

  public getActiveConflicts(): DeviceConflict[] {
    return Array.from(this.activeConflicts.values());
  }

  public getTensionStates(): TensionState[] {
    return Array.from(this.tensionStates.values());
  }

  public getResourceCompetitions(): ResourceCompetition[] {
    return Array.from(this.resourceCompetitions.values());
  }

  public getConflictHistory(): DeviceConflict[] {
    return [...this.conflictHistory];
  }

  public resolveConflict(conflictId: string): boolean {
    const conflict = this.activeConflicts.get(conflictId);
    if (conflict) {
      this.conflictHistory.push(conflict);
      this.activeConflicts.delete(conflictId);
      
      if (this.onConflictResolvedCallback) {
        this.onConflictResolvedCallback(conflictId);
      }
      
      return true;
    }
    return false;
  }

  // Callback setters
  public setConflictDetectedCallback(callback: (conflict: DeviceConflict) => void): void {
    this.onConflictDetectedCallback = callback;
  }

  public setTensionEscalatedCallback(callback: (deviceId: string, tensionLevel: number) => void): void {
    this.onTensionEscalatedCallback = callback;
  }

  public setResourceCompetitionCallback(callback: (competition: ResourceCompetition) => void): void {
    this.onResourceCompetitionCallback = callback;
  }

  public setConflictResolvedCallback(callback: (conflictId: string) => void): void {
    this.onConflictResolvedCallback = callback;
  }

  public setDramaticMomentCallback(callback: (moment: DramaticMoment) => void): void {
    this.onDramaticMomentCallback = callback;
  }

  public dispose(): void {
    this.activeConflicts.clear();
    this.tensionStates.clear();
    this.resourceCompetitions.clear();
    this.conflictHistory.length = 0;
  }
}

// Additional interfaces

interface ResourceDemand {
  totalDemand: number;
  availableSupply: number;
  demandingDevices: string[];
}

export interface DramaticMoment {
  type: DramaticMomentType;
  description: string;
  involvedDevices: string[];
  intensity: number;
  timestamp: number;
}

export enum DramaticMomentType {
  CONFLICT_ESCALATION = 'conflict_escalation',
  SYSTEM_CHAOS = 'system_chaos',
  TENSION_PEAK = 'tension_peak',
  RESOURCE_CRISIS = 'resource_crisis',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown',
  AUTHORITY_TAKEOVER = 'authority_takeover'
}