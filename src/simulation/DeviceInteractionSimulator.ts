import { AIDeviceBehavior, AIDecision, DecisionType } from './AIDeviceBehavior';
import { AIPersonality } from './AIPersonalityConverter';
import { AIMisalignmentSystem } from './AIMisalignmentSystem';
import { DeviceConflictSystem, DeviceConflict, ConflictType, DramaticMoment } from './DeviceConflictSystem';
import { EmergentStorySystem, StoryMoment, EducationalInsight } from './EmergentStorySystem';
import { DeviceVisual, AnimationType, EffectType } from '@/types/core';
import { DeviceMoodIndicator, ConnectionVisualization, ConnectionType, ConnectionStatus } from '@/types/ui';

/**
 * Represents a simulated AI device with behavior and visual components
 */
export interface SimulatedDevice {
  id: string;
  visual: DeviceVisual;
  behavior: AIDeviceBehavior;
  personality: AIPersonality;
  isActive: boolean;
  lastUpdateTime: number;
  discoveredDevices: Set<string>;
  activeConnections: Map<string, DeviceConnection>;
  cooperationHistory: Map<string, CooperationRecord>;
}

/**
 * Represents a connection between two devices
 */
export interface DeviceConnection {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  type: ConnectionType;
  strength: number;
  status: ConnectionStatus;
  establishedTime: number;
  lastInteractionTime: number;
  interactionCount: number;
  successRate: number;
}

/**
 * Represents a cooperation record between devices
 */
export interface CooperationRecord {
  partnerId: string;
  cooperationCount: number;
  successfulCooperations: number;
  lastCooperationTime: number;
  synergyLevel: number;
  trustScore: number;
}

/**
 * Represents a synergy effect between cooperating devices
 */
export interface SynergyEffect {
  id: string;
  participatingDevices: string[];
  effectType: SynergyType;
  magnitude: number;
  description: string;
  visualEffect: EffectType;
  duration: number;
  startTime: number;
}

export enum SynergyType {
  EFFICIENCY_BOOST = 'efficiency_boost',
  ENHANCED_CAPABILITY = 'enhanced_capability',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  IMPROVED_ACCURACY = 'improved_accuracy',
  COORDINATED_TIMING = 'coordinated_timing',
  SHARED_INTELLIGENCE = 'shared_intelligence'
}

/**
 * DeviceInteractionSimulator manages real-time multi-device simulation with visual updates
 */
export class DeviceInteractionSimulator {
  private devices: Map<string, SimulatedDevice>;
  private connections: Map<string, DeviceConnection>;
  private activeSynergies: Map<string, SynergyEffect>;
  private misalignmentSystem: AIMisalignmentSystem;
  private conflictSystem: DeviceConflictSystem;
  private storySystem: EmergentStorySystem;
  
  // Simulation state
  private isRunning: boolean;
  private simulationSpeed: number;
  private lastUpdateTime: number;
  private updateInterval: number | null;
  
  // Discovery and interaction settings
  private discoveryRange: number;
  private interactionCooldown: number;
  private synergyThreshold: number;
  
  // Callbacks
  private onDeviceDiscoveryCallback?: (discoverer: string, discovered: string) => void;
  private onConnectionEstablishedCallback?: (connection: DeviceConnection) => void;
  private onSynergyCreatedCallback?: (synergy: SynergyEffect) => void;
  private onAnimationUpdateCallback?: (deviceId: string, animation: AnimationType) => void;
  private onVisualEffectCallback?: (effect: EffectType, devices: string[]) => void;
  private onConflictDetectedCallback?: (conflict: DeviceConflict) => void;
  private onDramaticMomentCallback?: (moment: DramaticMoment) => void;
  private onStoryMomentCallback?: (moment: StoryMoment) => void;
  private onEducationalInsightCallback?: (insight: EducationalInsight) => void;

  constructor() {
    this.devices = new Map();
    this.connections = new Map();
    this.activeSynergies = new Map();
    this.misalignmentSystem = new AIMisalignmentSystem();
    this.conflictSystem = new DeviceConflictSystem();
    this.storySystem = new EmergentStorySystem();
    
    this.isRunning = false;
    this.simulationSpeed = 1.0;
    this.lastUpdateTime = 0;
    this.updateInterval = null;
    
    this.discoveryRange = 5.0; // Units in the simulation space
    this.interactionCooldown = 2000; // Milliseconds
    this.synergyThreshold = 0.7; // Cooperation strength needed for synergy
    
    this.setupConflictSystemCallbacks();
    this.setupStorySystemCallbacks();
  }

  /**
   * Add a device to the simulation
   */
  public addDevice(
    deviceId: string,
    visual: DeviceVisual,
    personality: AIPersonality
  ): void {
    const behavior = new AIDeviceBehavior(deviceId, personality);
    
    // Set up behavior callbacks
    behavior.setDecisionCallback(this.handleDeviceDecision.bind(this));
    behavior.setMoodChangeCallback(this.handleMoodChange.bind(this));
    behavior.setAnimationChangeCallback(this.handleAnimationChange.bind(this));
    
    const simulatedDevice: SimulatedDevice = {
      id: deviceId,
      visual,
      behavior,
      personality,
      isActive: true,
      lastUpdateTime: Date.now(),
      discoveredDevices: new Set(),
      activeConnections: new Map(),
      cooperationHistory: new Map()
    };
    
    this.devices.set(deviceId, simulatedDevice);
    
    // Trigger discovery for existing devices
    this.triggerDeviceDiscovery(deviceId);
  }

  /**
   * Remove a device from the simulation
   */
  public removeDevice(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;
    
    // Remove all connections involving this device
    const connectionsToRemove = Array.from(this.connections.values())
      .filter(conn => conn.fromDeviceId === deviceId || conn.toDeviceId === deviceId);
    
    connectionsToRemove.forEach(conn => {
      this.connections.delete(conn.id);
    });
    
    // Remove from other devices' discovery lists
    this.devices.forEach(otherDevice => {
      otherDevice.discoveredDevices.delete(deviceId);
      otherDevice.activeConnections.delete(deviceId);
      otherDevice.cooperationHistory.delete(deviceId);
    });
    
    // Remove device
    this.devices.delete(deviceId);
  }

  /**
   * Start the real-time simulation
   */
  public startSimulation(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastUpdateTime = Date.now();
    
    // Start update loop
    this.updateInterval = window.setInterval(() => {
      this.updateSimulation();
    }, 100); // Update every 100ms
  }

  /**
   * Stop the simulation
   */
  public stopSimulation(): void {
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Main simulation update loop
   */
  private updateSimulation(): void {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastUpdateTime) * this.simulationSpeed;
    
    // Update each device
    this.devices.forEach(device => {
      if (device.isActive) {
        this.updateDevice(device, deltaTime);
      }
    });
    
    // Update connections
    this.updateConnections(deltaTime);
    
    // Update synergies
    this.updateSynergies(deltaTime);
    
    // Analyze conflicts and drama
    this.conflictSystem.analyzeDeviceInteractions(
      Array.from(this.devices.values()),
      Array.from(this.connections.values())
    );
    
    // Generate story moments and educational insights
    this.storySystem.analyzeSimulationEvents(
      Array.from(this.devices.values()),
      Array.from(this.connections.values()),
      Array.from(this.activeSynergies.values()),
      this.conflictSystem.getActiveConflicts(),
      [] // Dramatic moments would be passed here
    );
    
    // Check for new discoveries and interactions
    this.processDeviceDiscovery();
    this.processDeviceInteractions();
    
    this.lastUpdateTime = currentTime;
  }

  /**
   * Update a single device's behavior and state
   */
  private updateDevice(device: SimulatedDevice, deltaTime: number): void {
    // Execute device decision cycle
    const decisions = device.behavior.executeDecisionCycle();
    
    // Process decisions that affect interactions
    decisions.forEach(decision => {
      this.processDecisionForInteractions(device, decision);
    });
    
    device.lastUpdateTime = Date.now();
  }

  /**
   * Process device decisions that might create interactions
   */
  private processDecisionForInteractions(device: SimulatedDevice, decision: AIDecision): void {
    switch (decision.type) {
      case DecisionType.COMMUNICATION:
        this.handleCommunicationDecision(device, decision);
        break;
      case DecisionType.COOPERATION_ATTEMPT:
        this.handleCooperationDecision(device, decision);
        break;
      case DecisionType.RESOURCE_REQUEST:
        this.handleResourceRequestDecision(device, decision);
        break;
    }
  }

  /**
   * Handle communication decisions
   */
  private handleCommunicationDecision(device: SimulatedDevice, decision: AIDecision): void {
    const targetDevices = decision.targetDevices || [];
    
    targetDevices.forEach(targetId => {
      const targetDevice = this.devices.get(targetId);
      if (!targetDevice) return;
      
      // Create or strengthen connection
      const connectionId = this.getConnectionId(device.id, targetId);
      let connection = this.connections.get(connectionId);
      
      if (!connection) {
        connection = this.createConnection(device.id, targetId, ConnectionType.COMMUNICATION);
        this.connections.set(connectionId, connection);
        
        if (this.onConnectionEstablishedCallback) {
          this.onConnectionEstablishedCallback(connection);
        }
      }
      
      // Update connection strength
      connection.strength = Math.min(1.0, connection.strength + 0.1);
      connection.lastInteractionTime = Date.now();
      connection.interactionCount++;
      
      // Send message to target device
      const message = {
        senderId: device.id,
        messageType: decision.action,
        content: decision.reasoning,
        timestamp: Date.now()
      };
      
      const response = targetDevice.behavior.communicate(message);
      
      // Update success rate based on response
      if (response && response.content) {
        connection.successRate = (connection.successRate * (connection.interactionCount - 1) + 1) / connection.interactionCount;
      }
    });
  }

  /**
   * Handle cooperation decisions
   */
  private handleCooperationDecision(device: SimulatedDevice, decision: AIDecision): void {
    const targetDevices = decision.targetDevices || [];
    
    targetDevices.forEach(targetId => {
      const targetDevice = this.devices.get(targetId);
      if (!targetDevice) return;
      
      // Check if target device is willing to cooperate
      const cooperationWillingness = this.assessCooperationWillingness(device, targetDevice);
      
      if (cooperationWillingness > 0.5) {
        this.establishCooperation(device, targetDevice, decision);
      }
    });
  }

  /**
   * Establish cooperation between two devices
   */
  private establishCooperation(device1: SimulatedDevice, device2: SimulatedDevice, decision: AIDecision): void {
    // Create cooperation connection
    const connectionId = this.getConnectionId(device1.id, device2.id);
    let connection = this.connections.get(connectionId);
    
    if (!connection) {
      connection = this.createConnection(device1.id, device2.id, ConnectionType.COOPERATION);
      this.connections.set(connectionId, connection);
    } else {
      connection.type = ConnectionType.COOPERATION;
    }
    
    // Update cooperation records
    this.updateCooperationRecord(device1, device2.id);
    this.updateCooperationRecord(device2, device1.id);
    
    // Check for synergy creation
    if (connection.strength > this.synergyThreshold) {
      this.createSynergyEffect(device1, device2, connection);
    }
    
    // Trigger visual effects
    if (this.onVisualEffectCallback) {
      this.onVisualEffectCallback(EffectType.COOPERATION, [device1.id, device2.id]);
    }
  }

  /**
   * Create a synergy effect between cooperating devices
   */
  private createSynergyEffect(device1: SimulatedDevice, device2: SimulatedDevice, connection: DeviceConnection): void {
    const synergyType = this.determineSynergyType(device1, device2);
    const magnitude = this.calculateSynergyMagnitude(device1, device2, connection);
    
    const synergy: SynergyEffect = {
      id: `synergy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participatingDevices: [device1.id, device2.id],
      effectType: synergyType,
      magnitude,
      description: this.generateSynergyDescription(synergyType, device1, device2),
      visualEffect: EffectType.SUCCESS,
      duration: 30000, // 30 seconds
      startTime: Date.now()
    };
    
    this.activeSynergies.set(synergy.id, synergy);
    
    if (this.onSynergyCreatedCallback) {
      this.onSynergyCreatedCallback(synergy);
    }
  }

  /**
   * Determine the type of synergy based on device personalities
   */
  private determineSynergyType(device1: SimulatedDevice, device2: SimulatedDevice): SynergyType {
    const personality1 = device1.personality;
    const personality2 = device2.personality;
    
    // Efficiency-focused devices create efficiency boosts
    if (personality1.reliability > 0.7 && personality2.reliability > 0.7) {
      return SynergyType.EFFICIENCY_BOOST;
    }
    
    // High learning rate devices share intelligence
    if (personality1.learningRate > 0.7 && personality2.learningRate > 0.7) {
      return SynergyType.SHARED_INTELLIGENCE;
    }
    
    // Adaptive devices create enhanced capabilities
    if (personality1.adaptability > 0.7 && personality2.adaptability > 0.7) {
      return SynergyType.ENHANCED_CAPABILITY;
    }
    
    // Social devices coordinate timing
    if (personality1.socialness > 0.7 && personality2.socialness > 0.7) {
      return SynergyType.COORDINATED_TIMING;
    }
    
    return SynergyType.RESOURCE_OPTIMIZATION; // Default
  }

  /**
   * Calculate synergy magnitude based on device compatibility
   */
  private calculateSynergyMagnitude(device1: SimulatedDevice, device2: SimulatedDevice, connection: DeviceConnection): number {
    let magnitude = connection.strength * 0.5;
    
    // Add personality compatibility bonus
    const personalityCompatibility = this.calculatePersonalityCompatibility(device1.personality, device2.personality);
    magnitude += personalityCompatibility * 0.3;
    
    // Add cooperation history bonus
    const cooperationRecord = device1.cooperationHistory.get(device2.id);
    if (cooperationRecord) {
      magnitude += (cooperationRecord.successfulCooperations / Math.max(cooperationRecord.cooperationCount, 1)) * 0.2;
    }
    
    return Math.min(1.0, magnitude);
  }

  /**
   * Calculate compatibility between two personalities
   */
  private calculatePersonalityCompatibility(personality1: AIPersonality, personality2: AIPersonality): number {
    let compatibility = 0.5; // Base compatibility
    
    // Communication style compatibility
    if (personality1.communicationStyle === personality2.communicationStyle) {
      compatibility += 0.2;
    }
    
    // Conflict resolution compatibility
    if (personality1.conflictResolution === personality2.conflictResolution) {
      compatibility += 0.1;
    }
    
    // Trait compatibility
    const sharedTraits = personality1.primaryTraits.filter(trait => 
      personality2.primaryTraits.includes(trait)
    );
    compatibility += sharedTraits.length * 0.1;
    
    // Socialness compatibility (similar levels work better)
    const socialnessDiff = Math.abs(personality1.socialness - personality2.socialness);
    compatibility += (1 - socialnessDiff) * 0.1;
    
    return Math.min(1.0, compatibility);
  }

  /**
   * Generate description for synergy effect
   */
  private generateSynergyDescription(synergyType: SynergyType, device1: SimulatedDevice, device2: SimulatedDevice): string {
    const descriptions = {
      [SynergyType.EFFICIENCY_BOOST]: `${device1.id} and ${device2.id} are working together more efficiently than either could alone`,
      [SynergyType.ENHANCED_CAPABILITY]: `The cooperation between ${device1.id} and ${device2.id} has unlocked new capabilities`,
      [SynergyType.RESOURCE_OPTIMIZATION]: `${device1.id} and ${device2.id} are optimizing resource usage through coordination`,
      [SynergyType.IMPROVED_ACCURACY]: `${device1.id} and ${device2.id} are achieving higher accuracy through collaboration`,
      [SynergyType.COORDINATED_TIMING]: `${device1.id} and ${device2.id} have synchronized their operations perfectly`,
      [SynergyType.SHARED_INTELLIGENCE]: `${device1.id} and ${device2.id} are sharing knowledge and learning together`
    };
    
    return descriptions[synergyType] || 'Devices are working together harmoniously';
  }

  /**
   * Trigger device discovery for nearby devices
   */
  private triggerDeviceDiscovery(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;
    
    // Find nearby devices
    const nearbyDevices = this.findNearbyDevices(device);
    
    nearbyDevices.forEach(nearbyDevice => {
      if (!device.discoveredDevices.has(nearbyDevice.id)) {
        device.discoveredDevices.add(nearbyDevice.id);
        nearbyDevice.discoveredDevices.add(device.id);
        
        if (this.onDeviceDiscoveryCallback) {
          this.onDeviceDiscoveryCallback(device.id, nearbyDevice.id);
        }
        
        // Create initial greeting interaction
        this.createGreetingInteraction(device, nearbyDevice);
      }
    });
  }

  /**
   * Find devices within discovery range
   */
  private findNearbyDevices(device: SimulatedDevice): SimulatedDevice[] {
    const nearbyDevices: SimulatedDevice[] = [];
    
    this.devices.forEach(otherDevice => {
      if (otherDevice.id === device.id) return;
      
      const distance = this.calculateDistance(device.visual.position, otherDevice.visual.position);
      if (distance <= this.discoveryRange) {
        nearbyDevices.push(otherDevice);
      }
    });
    
    return nearbyDevices;
  }

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Create initial greeting interaction between newly discovered devices
   */
  private createGreetingInteraction(device1: SimulatedDevice, device2: SimulatedDevice): void {
    const message = {
      senderId: device1.id,
      messageType: 'greeting',
      content: `Hello! I'm ${device1.id}, nice to meet you!`,
      timestamp: Date.now()
    };
    
    const response = device2.behavior.communicate(message);
    
    // Create initial connection
    const connectionId = this.getConnectionId(device1.id, device2.id);
    const connection = this.createConnection(device1.id, device2.id, ConnectionType.COMMUNICATION);
    connection.strength = 0.3; // Initial greeting strength
    
    this.connections.set(connectionId, connection);
  }

  // Helper methods
  private getConnectionId(deviceId1: string, deviceId2: string): string {
    return [deviceId1, deviceId2].sort().join('-');
  }

  private createConnection(fromId: string, toId: string, type: ConnectionType): DeviceConnection {
    return {
      id: this.getConnectionId(fromId, toId),
      fromDeviceId: fromId,
      toDeviceId: toId,
      type,
      strength: 0.1,
      status: ConnectionStatus.ACTIVE,
      establishedTime: Date.now(),
      lastInteractionTime: Date.now(),
      interactionCount: 1,
      successRate: 1.0
    };
  }

  private updateCooperationRecord(device: SimulatedDevice, partnerId: string): void {
    let record = device.cooperationHistory.get(partnerId);
    
    if (!record) {
      record = {
        partnerId,
        cooperationCount: 0,
        successfulCooperations: 0,
        lastCooperationTime: 0,
        synergyLevel: 0,
        trustScore: 0.5
      };
      device.cooperationHistory.set(partnerId, record);
    }
    
    record.cooperationCount++;
    record.successfulCooperations++; // Assume success for now
    record.lastCooperationTime = Date.now();
    record.trustScore = Math.min(1.0, record.trustScore + 0.1);
  }

  private assessCooperationWillingness(device1: SimulatedDevice, device2: SimulatedDevice): number {
    let willingness = device1.personality.socialness * 0.5;
    
    // Add trust factor
    const trustLevels = device1.behavior.getTrustLevels();
    const trust = trustLevels.get(device2.id) || 0.5;
    willingness += trust * 0.3;
    
    // Add cooperation history factor
    const cooperationRecord = device1.cooperationHistory.get(device2.id);
    if (cooperationRecord) {
      willingness += (cooperationRecord.successfulCooperations / Math.max(cooperationRecord.cooperationCount, 1)) * 0.2;
    }
    
    return Math.min(1.0, willingness);
  }

  private handleResourceRequestDecision(device: SimulatedDevice, decision: AIDecision): void {
    // Handle resource requests between devices
    const targetDevices = decision.targetDevices || [];
    
    targetDevices.forEach(targetId => {
      const connection = this.connections.get(this.getConnectionId(device.id, targetId));
      if (connection) {
        connection.type = ConnectionType.RESOURCE_SHARING;
        connection.lastInteractionTime = Date.now();
      }
    });
  }

  private processDeviceDiscovery(): void {
    // Periodic discovery updates
    this.devices.forEach(device => {
      if (Math.random() < 0.1) { // 10% chance per update
        this.triggerDeviceDiscovery(device.id);
      }
    });
  }

  private processDeviceInteractions(): void {
    // Process ongoing interactions and update connection strengths
    this.connections.forEach(connection => {
      const timeSinceLastInteraction = Date.now() - connection.lastInteractionTime;
      
      // Decay connection strength over time
      if (timeSinceLastInteraction > this.interactionCooldown * 5) {
        connection.strength = Math.max(0.1, connection.strength - 0.01);
      }
    });
  }

  private updateConnections(deltaTime: number): void {
    // Update connection states and remove inactive ones
    const connectionsToRemove: string[] = [];
    
    this.connections.forEach((connection, id) => {
      const timeSinceLastInteraction = Date.now() - connection.lastInteractionTime;
      
      // Mark connections as inactive if no recent interaction
      if (timeSinceLastInteraction > this.interactionCooldown * 10) {
        if (connection.strength <= 0.1) {
          connectionsToRemove.push(id);
        } else {
          connection.status = ConnectionStatus.INACTIVE;
        }
      }
    });
    
    // Remove inactive connections
    connectionsToRemove.forEach(id => {
      this.connections.delete(id);
    });
  }

  private updateSynergies(deltaTime: number): void {
    // Update active synergies and remove expired ones
    const synergiesToRemove: string[] = [];
    
    this.activeSynergies.forEach((synergy, id) => {
      const elapsed = Date.now() - synergy.startTime;
      
      if (elapsed > synergy.duration) {
        synergiesToRemove.push(id);
      }
    });
    
    synergiesToRemove.forEach(id => {
      this.activeSynergies.delete(id);
    });
  }

  // Event handlers
  private handleDeviceDecision(decision: AIDecision): void {
    // This is called when any device makes a decision
    // Additional processing can be added here
  }

  private handleMoodChange(mood: DeviceMoodIndicator): void {
    // Handle mood changes that might affect interactions
    const device = this.devices.get(mood.deviceId);
    if (!device) return;
    
    // Mood changes can affect cooperation willingness
    if (mood.mood === 'angry' || mood.mood === 'frustrated') {
      // Reduce connection strengths
      device.activeConnections.forEach(connection => {
        const conn = this.connections.get(connection.id);
        if (conn) {
          conn.strength = Math.max(0.1, conn.strength - 0.1);
        }
      });
    }
  }

  private handleAnimationChange(deviceId: string, animation: AnimationType): void {
    if (this.onAnimationUpdateCallback) {
      this.onAnimationUpdateCallback(deviceId, animation);
    }
  }

  // Public API methods
  public setSimulationSpeed(speed: number): void {
    this.simulationSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  public getDevices(): SimulatedDevice[] {
    return Array.from(this.devices.values());
  }

  public getConnections(): DeviceConnection[] {
    return Array.from(this.connections.values());
  }

  public getActiveSynergies(): SynergyEffect[] {
    return Array.from(this.activeSynergies.values());
  }

  public getDevice(deviceId: string): SimulatedDevice | undefined {
    return this.devices.get(deviceId);
  }

  // Callback setters
  public setDeviceDiscoveryCallback(callback: (discoverer: string, discovered: string) => void): void {
    this.onDeviceDiscoveryCallback = callback;
  }

  public setConnectionEstablishedCallback(callback: (connection: DeviceConnection) => void): void {
    this.onConnectionEstablishedCallback = callback;
  }

  public setSynergyCreatedCallback(callback: (synergy: SynergyEffect) => void): void {
    this.onSynergyCreatedCallback = callback;
  }

  public setAnimationUpdateCallback(callback: (deviceId: string, animation: AnimationType) => void): void {
    this.onAnimationUpdateCallback = callback;
  }

  public setVisualEffectCallback(callback: (effect: EffectType, devices: string[]) => void): void {
    this.onVisualEffectCallback = callback;
  }

  public setConflictDetectedCallback(callback: (conflict: DeviceConflict) => void): void {
    this.onConflictDetectedCallback = callback;
  }

  public setDramaticMomentCallback(callback: (moment: DramaticMoment) => void): void {
    this.onDramaticMomentCallback = callback;
  }

  public setStoryMomentCallback(callback: (moment: StoryMoment) => void): void {
    this.onStoryMomentCallback = callback;
  }

  public setEducationalInsightCallback(callback: (insight: EducationalInsight) => void): void {
    this.onEducationalInsightCallback = callback;
  }

  /**
   * Setup conflict system callbacks
   */
  private setupConflictSystemCallbacks(): void {
    this.conflictSystem.setConflictDetectedCallback((conflict) => {
      if (this.onConflictDetectedCallback) {
        this.onConflictDetectedCallback(conflict);
      }
      
      // Trigger visual effects for conflicts
      if (this.onVisualEffectCallback) {
        this.onVisualEffectCallback(EffectType.CONFLICT, conflict.participatingDevices);
      }
    });

    this.conflictSystem.setDramaticMomentCallback((moment) => {
      if (this.onDramaticMomentCallback) {
        this.onDramaticMomentCallback(moment);
      }
      
      // Trigger crisis visual effects
      if (this.onVisualEffectCallback) {
        this.onVisualEffectCallback(EffectType.CRISIS, moment.involvedDevices);
      }
    });

    this.conflictSystem.setTensionEscalatedCallback((deviceId, tensionLevel) => {
      // Update device animations based on tension
      if (tensionLevel > 0.7 && this.onAnimationUpdateCallback) {
        this.onAnimationUpdateCallback(deviceId, AnimationType.ANGRY);
      } else if (tensionLevel > 0.4 && this.onAnimationUpdateCallback) {
        this.onAnimationUpdateCallback(deviceId, AnimationType.CONFUSED);
      }
    });
  }

  /**
   * Get active conflicts from the conflict system
   */
  public getActiveConflicts(): DeviceConflict[] {
    return this.conflictSystem.getActiveConflicts();
  }

  /**
   * Get tension states for all devices
   */
  public getTensionStates() {
    return this.conflictSystem.getTensionStates();
  }

  /**
   * Get resource competitions
   */
  public getResourceCompetitions() {
    return this.conflictSystem.getResourceCompetitions();
  }

  /**
   * Resolve a specific conflict
   */
  public resolveConflict(conflictId: string): boolean {
    return this.conflictSystem.resolveConflict(conflictId);
  }

  /**
   * Setup story system callbacks
   */
  private setupStorySystemCallbacks(): void {
    this.storySystem.setStoryMomentCallback((moment) => {
      if (this.onStoryMomentCallback) {
        this.onStoryMomentCallback(moment);
      }
    });

    this.storySystem.setEducationalInsightCallback((insight) => {
      if (this.onEducationalInsightCallback) {
        this.onEducationalInsightCallback(insight);
      }
    });
  }

  /**
   * Get story moments from the story system
   */
  public getStoryMoments() {
    return this.storySystem.getStoryMoments();
  }

  /**
   * Get recent story moments
   */
  public getRecentStoryMoments(count: number = 5) {
    return this.storySystem.getRecentStoryMoments(count);
  }

  /**
   * Get system state for storytelling
   */
  public getSystemState() {
    return this.storySystem.getSystemState();
  }

  /**
   * Replay a specific story moment
   */
  public replayStoryMoment(momentId: string) {
    return this.storySystem.replayStoryMoment(momentId);
  }

  /**
   * Dispose of resources and stop simulation
   */
  public dispose(): void {
    this.stopSimulation();
    this.devices.clear();
    this.connections.clear();
    this.activeSynergies.clear();
    this.conflictSystem.dispose();
    this.storySystem.dispose();
  }

  public enableSafeMode(): void {
    console.log('Safe mode enabled for device simulator');
    this.pauseSimulation();
    // Additional safe mode logic could be added here
  }

  public resumeSimulation(): void {
    console.log('Resuming device simulation');
    this.isRunning = true;
  }
}