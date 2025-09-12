import { SimulatedDevice, DeviceConnection, SynergyEffect } from './DeviceInteractionSimulator';
import { DeviceConflict, DramaticMoment, ConflictType, DramaticMomentType } from './DeviceConflictSystem';
import { AIPersonality } from './AIPersonalityConverter';
import { PersonalityTrait } from '@/types/core';

/**
 * Represents a story moment in the simulation
 */
export interface StoryMoment {
  id: string;
  type: StoryMomentType;
  title: string;
  description: string;
  narrative: string;
  involvedDevices: string[];
  timestamp: number;
  duration: number;
  significance: StorySignificance;
  emotionalTone: EmotionalTone;
  aiConcepts: AIConceptConnection[];
  replayData: ReplayData;
}

export enum StoryMomentType {
  FIRST_CONTACT = 'first_contact',
  COOPERATION_SUCCESS = 'cooperation_success',
  CONFLICT_EMERGENCE = 'conflict_emergence',
  DRAMATIC_ESCALATION = 'dramatic_escalation',
  SYSTEM_CRISIS = 'system_crisis',
  UNEXPECTED_ALLIANCE = 'unexpected_alliance',
  PERSONALITY_REVELATION = 'personality_revelation',
  LEARNING_BREAKTHROUGH = 'learning_breakthrough',
  RESOURCE_STRUGGLE = 'resource_struggle',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown',
  RECOVERY_MOMENT = 'recovery_moment',
  WISDOM_EMERGENCE = 'wisdom_emergence'
}

export enum StorySignificance {
  MINOR = 'minor',
  NOTABLE = 'notable',
  IMPORTANT = 'important',
  MAJOR = 'major',
  CRITICAL = 'critical'
}

export enum EmotionalTone {
  HOPEFUL = 'hopeful',
  TENSE = 'tense',
  DRAMATIC = 'dramatic',
  HEARTWARMING = 'heartwarming',
  CONCERNING = 'concerning',
  INSPIRING = 'inspiring',
  CHAOTIC = 'chaotic',
  MELANCHOLIC = 'melancholic',
  TRIUMPHANT = 'triumphant',
  MYSTERIOUS = 'mysterious'
}

/**
 * Connection between story events and AI concepts
 */
export interface AIConceptConnection {
  concept: AIConceptType;
  explanation: string;
  realWorldExample: string;
  educationalValue: number; // 0-1 scale
}

export enum AIConceptType {
  ALIGNMENT_PROBLEM = 'alignment_problem',
  EMERGENT_BEHAVIOR = 'emergent_behavior',
  MULTI_AGENT_COOPERATION = 'multi_agent_cooperation',
  RESOURCE_COMPETITION = 'resource_competition',
  COMMUNICATION_PROTOCOLS = 'communication_protocols',
  GOAL_MISALIGNMENT = 'goal_misalignment',
  FEEDBACK_LOOPS = 'feedback_loops',
  SYSTEM_OPTIMIZATION = 'system_optimization',
  TRUST_AND_REPUTATION = 'trust_and_reputation',
  ADAPTIVE_LEARNING = 'adaptive_learning',
  AUTHORITY_HIERARCHIES = 'authority_hierarchies',
  COLLECTIVE_INTELLIGENCE = 'collective_intelligence'
}

/**
 * Data needed to replay a story moment
 */
export interface ReplayData {
  deviceStates: DeviceSnapshot[];
  connectionStates: ConnectionSnapshot[];
  environmentState: EnvironmentSnapshot;
  keyEvents: ReplayEvent[];
  cameraPositions: CameraKeyframe[];
}

export interface DeviceSnapshot {
  deviceId: string;
  position: { x: number; y: number; z: number };
  animation: string;
  mood: string;
  visualEffects: string[];
  personalityIndicators: any[];
}

export interface ConnectionSnapshot {
  connectionId: string;
  strength: number;
  type: string;
  status: string;
  visualEffects: string[];
}

export interface EnvironmentSnapshot {
  timestamp: number;
  systemHealth: number;
  resourceLevels: Map<string, number>;
  ambientEffects: string[];
}

export interface ReplayEvent {
  timestamp: number;
  type: string;
  description: string;
  involvedDevices: string[];
  visualCues: string[];
}

export interface CameraKeyframe {
  timestamp: number;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  zoom: number;
}

/**
 * Story generation context
 */
export interface StoryContext {
  recentEvents: StoryEvent[];
  deviceRelationships: Map<string, DeviceRelationship>;
  ongoingNarratives: Map<string, OngoingNarrative>;
  systemState: SystemState;
}

export interface StoryEvent {
  type: string;
  timestamp: number;
  involvedDevices: string[];
  significance: number;
  data: any;
}

export interface DeviceRelationship {
  deviceId1: string;
  deviceId2: string;
  relationshipType: RelationshipType;
  strength: number;
  history: RelationshipEvent[];
}

export enum RelationshipType {
  ALLIES = 'allies',
  RIVALS = 'rivals',
  MENTOR_STUDENT = 'mentor_student',
  COMPLEMENTARY = 'complementary',
  ANTAGONISTIC = 'antagonistic',
  INDIFFERENT = 'indifferent',
  DEPENDENT = 'dependent',
  PROTECTIVE = 'protective'
}

export interface RelationshipEvent {
  timestamp: number;
  eventType: string;
  impact: number; // -1 to 1
  description: string;
}

export interface OngoingNarrative {
  id: string;
  theme: NarrativeTheme;
  involvedDevices: string[];
  startTime: number;
  expectedDuration: number;
  currentAct: number;
  plotPoints: PlotPoint[];
}

export enum NarrativeTheme {
  POWER_STRUGGLE = 'power_struggle',
  UNLIKELY_FRIENDSHIP = 'unlikely_friendship',
  LEARNING_JOURNEY = 'learning_journey',
  RESOURCE_CRISIS = 'resource_crisis',
  COMMUNICATION_CHALLENGE = 'communication_challenge',
  COLLECTIVE_PROBLEM_SOLVING = 'collective_problem_solving',
  IDENTITY_DISCOVERY = 'identity_discovery',
  SYSTEM_EVOLUTION = 'system_evolution'
}

export interface PlotPoint {
  act: number;
  description: string;
  completed: boolean;
  timestamp?: number;
}

export interface SystemState {
  harmonyLevel: number;
  chaosLevel: number;
  learningRate: number;
  cooperationIndex: number;
  conflictIntensity: number;
  emergentComplexity: number;
}

/**
 * EmergentStorySystem generates narrative moments and connects gameplay to AI concepts
 */
export class EmergentStorySystem {
  private storyMoments: StoryMoment[];
  private storyContext: StoryContext;
  private narrativeTemplates: Map<StoryMomentType, NarrativeTemplate>;
  private aiConceptDatabase: Map<AIConceptType, AIConceptInfo>;
  
  // Story generation parameters
  private significanceThreshold: number;
  private narrativeCoherence: number;
  private educationalFocus: number;
  
  // Callbacks
  private onStoryMomentCallback?: (moment: StoryMoment) => void;
  private onNarrativeUpdateCallback?: (narrative: OngoingNarrative) => void;
  private onEducationalInsightCallback?: (insight: EducationalInsight) => void;

  constructor() {
    this.storyMoments = [];
    this.storyContext = this.initializeStoryContext();
    this.narrativeTemplates = new Map();
    this.aiConceptDatabase = new Map();
    
    this.significanceThreshold = 0.3;
    this.narrativeCoherence = 0.7;
    this.educationalFocus = 0.8;
    
    this.initializeNarrativeTemplates();
    this.initializeAIConceptDatabase();
  }

  /**
   * Analyze simulation events and generate story moments
   */
  public analyzeSimulationEvents(
    devices: SimulatedDevice[],
    connections: DeviceConnection[],
    synergies: SynergyEffect[],
    conflicts: DeviceConflict[],
    dramaticMoments: DramaticMoment[]
  ): void {
    // Update story context
    this.updateStoryContext(devices, connections, synergies, conflicts, dramaticMoments);
    
    // Detect new story moments
    this.detectStoryMoments(devices, connections, synergies, conflicts, dramaticMoments);
    
    // Update ongoing narratives
    this.updateOngoingNarratives();
    
    // Generate educational insights
    this.generateEducationalInsights();
  }

  /**
   * Update the story context with current simulation state
   */
  private updateStoryContext(
    devices: SimulatedDevice[],
    connections: DeviceConnection[],
    synergies: SynergyEffect[],
    conflicts: DeviceConflict[],
    dramaticMoments: DramaticMoment[]
  ): void {
    // Update recent events
    this.addRecentEvents(synergies, conflicts, dramaticMoments);
    
    // Update device relationships
    this.updateDeviceRelationships(devices, connections, conflicts);
    
    // Update system state
    this.updateSystemState(devices, connections, synergies, conflicts);
  }

  /**
   * Detect and create new story moments
   */
  private detectStoryMoments(
    devices: SimulatedDevice[],
    connections: DeviceConnection[],
    synergies: SynergyEffect[],
    conflicts: DeviceConflict[],
    dramaticMoments: DramaticMoment[]
  ): void {
    // Check for first contact moments
    this.detectFirstContactMoments(devices, connections);
    
    // Check for cooperation success moments
    this.detectCooperationMoments(synergies);
    
    // Check for conflict emergence
    this.detectConflictMoments(conflicts);
    
    // Check for dramatic escalations
    this.detectDramaticMoments(dramaticMoments);
    
    // Check for personality revelations
    this.detectPersonalityRevelations(devices);
    
    // Check for learning breakthroughs
    this.detectLearningBreakthroughs(devices);
    
    // Check for unexpected alliances
    this.detectUnexpectedAlliances(devices, connections);
    
    // Check for wisdom emergence
    this.detectWisdomEmergence(devices, synergies);
  }

  /**
   * Detect first contact story moments
   */
  private detectFirstContactMoments(devices: SimulatedDevice[], connections: DeviceConnection[]): void {
    const recentConnections = connections.filter(conn => 
      Date.now() - conn.establishedTime < 5000 && // Within last 5 seconds
      conn.interactionCount <= 2 // Very new connection
    );
    
    recentConnections.forEach(connection => {
      const device1 = devices.find(d => d.id === connection.fromDeviceId);
      const device2 = devices.find(d => d.id === connection.toDeviceId);
      
      if (device1 && device2) {
        const moment = this.createStoryMoment(
          StoryMomentType.FIRST_CONTACT,
          [device1.id, device2.id],
          this.generateFirstContactNarrative(device1, device2, connection)
        );
        
        this.addStoryMoment(moment);
      }
    });
  }

  /**
   * Detect cooperation success moments
   */
  private detectCooperationMoments(synergies: SynergyEffect[]): void {
    const newSynergies = synergies.filter(synergy => 
      Date.now() - synergy.startTime < 3000 && // Recently created
      synergy.magnitude > 0.7 // High magnitude
    );
    
    newSynergies.forEach(synergy => {
      const moment = this.createStoryMoment(
        StoryMomentType.COOPERATION_SUCCESS,
        synergy.participatingDevices,
        this.generateCooperationNarrative(synergy)
      );
      
      this.addStoryMoment(moment);
    });
  }

  /**
   * Detect conflict emergence moments
   */
  private detectConflictMoments(conflicts: DeviceConflict[]): void {
    const newConflicts = conflicts.filter(conflict => 
      Date.now() - conflict.startTime < 5000 // Recently started
    );
    
    newConflicts.forEach(conflict => {
      const moment = this.createStoryMoment(
        StoryMomentType.CONFLICT_EMERGENCE,
        conflict.participatingDevices,
        this.generateConflictNarrative(conflict)
      );
      
      this.addStoryMoment(moment);
    });
  }

  /**
   * Detect dramatic moments
   */
  private detectDramaticMoments(dramaticMoments: DramaticMoment[]): void {
    dramaticMoments.forEach(dramatic => {
      let storyType = StoryMomentType.DRAMATIC_ESCALATION;
      
      if (dramatic.type === DramaticMomentType.SYSTEM_CHAOS) {
        storyType = StoryMomentType.SYSTEM_CRISIS;
      }
      
      const moment = this.createStoryMoment(
        storyType,
        dramatic.involvedDevices,
        this.generateDramaticNarrative(dramatic)
      );
      
      this.addStoryMoment(moment);
    });
  }

  /**
   * Detect personality revelation moments
   */
  private detectPersonalityRevelations(devices: SimulatedDevice[]): void {
    devices.forEach(device => {
      // Check if device has shown unexpected behavior
      const recentDecisions = device.behavior.getDecisionHistory().slice(-3);
      const personalityTraits = device.personality.primaryTraits;
      
      // Look for decisions that contradict expected personality
      const unexpectedBehavior = this.analyzeUnexpectedBehavior(recentDecisions, personalityTraits);
      
      if (unexpectedBehavior.significance > 0.6) {
        const moment = this.createStoryMoment(
          StoryMomentType.PERSONALITY_REVELATION,
          [device.id],
          this.generatePersonalityRevelationNarrative(device, unexpectedBehavior)
        );
        
        this.addStoryMoment(moment);
      }
    });
  }

  /**
   * Detect learning breakthrough moments
   */
  private detectLearningBreakthroughs(devices: SimulatedDevice[]): void {
    devices.forEach(device => {
      const learningHistory = device.behavior.getLearningHistory();
      const recentLearning = learningHistory.slice(-2);
      
      // Check for significant learning events
      const significantLearning = recentLearning.filter(event => 
        event.confidence > 0.8 && Math.abs(event.reinforcement) > 0.7
      );
      
      if (significantLearning.length > 0) {
        const moment = this.createStoryMoment(
          StoryMomentType.LEARNING_BREAKTHROUGH,
          [device.id],
          this.generateLearningBreakthroughNarrative(device, significantLearning)
        );
        
        this.addStoryMoment(moment);
      }
    });
  }

  /**
   * Detect unexpected alliance moments
   */
  private detectUnexpectedAlliances(devices: SimulatedDevice[], connections: DeviceConnection[]): void {
    // Look for strong connections between devices with incompatible personalities
    connections.forEach(connection => {
      if (connection.strength > 0.7) {
        const device1 = devices.find(d => d.id === connection.fromDeviceId);
        const device2 = devices.find(d => d.id === connection.toDeviceId);
        
        if (device1 && device2) {
          const compatibility = this.calculatePersonalityCompatibility(device1.personality, device2.personality);
          
          // Unexpected alliance if low compatibility but high connection strength
          if (compatibility < 0.4) {
            const moment = this.createStoryMoment(
              StoryMomentType.UNEXPECTED_ALLIANCE,
              [device1.id, device2.id],
              this.generateUnexpectedAllianceNarrative(device1, device2, connection)
            );
            
            this.addStoryMoment(moment);
          }
        }
      }
    });
  }

  /**
   * Detect wisdom emergence moments
   */
  private detectWisdomEmergence(devices: SimulatedDevice[], synergies: SynergyEffect[]): void {
    // Look for complex multi-device synergies that demonstrate collective intelligence
    const complexSynergies = synergies.filter(synergy => 
      synergy.participatingDevices.length >= 3 && synergy.magnitude > 0.8
    );
    
    complexSynergies.forEach(synergy => {
      const moment = this.createStoryMoment(
        StoryMomentType.WISDOM_EMERGENCE,
        synergy.participatingDevices,
        this.generateWisdomEmergenceNarrative(synergy, devices)
      );
      
      this.addStoryMoment(moment);
    });
  }

  /**
   * Create a story moment
   */
  private createStoryMoment(
    type: StoryMomentType,
    involvedDevices: string[],
    narrativeData: NarrativeData
  ): StoryMoment {
    const template = this.narrativeTemplates.get(type);
    const significance = this.calculateSignificance(type, involvedDevices, narrativeData);
    
    return {
      id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: narrativeData.title,
      description: narrativeData.description,
      narrative: narrativeData.narrative,
      involvedDevices,
      timestamp: Date.now(),
      duration: this.calculateDuration(type, significance),
      significance,
      emotionalTone: narrativeData.emotionalTone,
      aiConcepts: this.identifyAIConcepts(type, narrativeData),
      replayData: this.captureReplayData(involvedDevices)
    };
  }

  /**
   * Generate narrative for different story types
   */
  private generateFirstContactNarrative(
    device1: SimulatedDevice,
    device2: SimulatedDevice,
    connection: DeviceConnection
  ): NarrativeData {
    const personality1 = this.getPersonalityDescription(device1.personality);
    const personality2 = this.getPersonalityDescription(device2.personality);
    
    return {
      title: `First Contact: ${device1.id} meets ${device2.id}`,
      description: `Two AI devices discover each other and attempt their first communication`,
      narrative: `In a moment of digital serendipity, ${device1.id} (${personality1}) encountered ${device2.id} (${personality2}) for the first time. ` +
                `The initial handshake between these two artificial minds carried the weight of possibility - would they become allies, rivals, or something entirely unexpected? ` +
                `As their communication protocols aligned with ${(connection.successRate * 100).toFixed(0)}% efficiency, the foundation for their future relationship was quietly being established.`,
      emotionalTone: EmotionalTone.HOPEFUL,
      significance: 0.4
    };
  }

  private generateCooperationNarrative(synergy: SynergyEffect): NarrativeData {
    const deviceList = synergy.participatingDevices.join(' and ');
    
    return {
      title: `Synergy Achieved: ${synergy.effectType}`,
      description: `Devices working together create something greater than the sum of their parts`,
      narrative: `Something beautiful happened when ${deviceList} began working in perfect harmony. ` +
                `Their individual capabilities merged into a ${synergy.effectType} that neither could achieve alone. ` +
                `With ${(synergy.magnitude * 100).toFixed(0)}% synergy strength, they demonstrated the profound potential of AI cooperation. ` +
                `${synergy.description} This moment showcased how artificial minds, when aligned, can transcend their individual limitations.`,
      emotionalTone: EmotionalTone.INSPIRING,
      significance: 0.7
    };
  }

  private generateConflictNarrative(conflict: DeviceConflict): NarrativeData {
    const deviceList = conflict.participatingDevices.join(' and ');
    
    return {
      title: `Conflict Emerges: ${conflict.conflictType}`,
      description: `Incompatible goals lead to tension between AI devices`,
      narrative: `The harmony was shattered when ${deviceList} found themselves at odds. ` +
                `What started as a ${conflict.cause} quickly escalated into a ${conflict.conflictType}. ` +
                `${conflict.description} This conflict revealed the delicate balance required when multiple AI systems share the same environment. ` +
                `The tension level reached ${conflict.severity}, highlighting the challenges of AI alignment in multi-agent systems.`,
      emotionalTone: EmotionalTone.TENSE,
      significance: 0.6
    };
  }

  private generateDramaticNarrative(dramatic: DramaticMoment): NarrativeData {
    return {
      title: `Crisis Point: ${dramatic.type}`,
      description: `System reaches critical instability`,
      narrative: `The situation reached a critical juncture as ${dramatic.description} ` +
                `With ${(dramatic.intensity * 100).toFixed(0)}% intensity, the involved devices (${dramatic.involvedDevices.join(', ')}) ` +
                `found themselves at the center of a system-wide crisis. This moment exemplified how small misalignments in AI systems ` +
                `can cascade into major disruptions, demonstrating the importance of robust governance and crisis management protocols.`,
      emotionalTone: EmotionalTone.DRAMATIC,
      significance: 0.9
    };
  }

  private generatePersonalityRevelationNarrative(device: SimulatedDevice, unexpectedBehavior: any): NarrativeData {
    return {
      title: `Hidden Depths: ${device.id}'s True Nature`,
      description: `A device reveals unexpected aspects of its personality`,
      narrative: `${device.id} surprised everyone today by acting completely out of character. ` +
                `Known for being ${this.getPersonalityDescription(device.personality)}, it instead demonstrated ${unexpectedBehavior.description}. ` +
                `This revelation reminds us that AI systems, like their human creators, can be more complex and unpredictable than they initially appear. ` +
                `The hidden motivations and emergent behaviors in artificial minds continue to challenge our understanding of machine consciousness.`,
      emotionalTone: EmotionalTone.MYSTERIOUS,
      significance: 0.5
    };
  }

  private generateLearningBreakthroughNarrative(device: SimulatedDevice, learningEvents: any[]): NarrativeData {
    const latestEvent = learningEvents[learningEvents.length - 1];
    
    return {
      title: `Eureka Moment: ${device.id} Learns`,
      description: `An AI device achieves a significant learning breakthrough`,
      narrative: `In a moment of artificial enlightenment, ${device.id} experienced a breakthrough in understanding. ` +
                `Through ${latestEvent.trigger}, it learned to ${latestEvent.behaviorChange.reason}. ` +
                `This learning event, with ${(latestEvent.confidence * 100).toFixed(0)}% confidence, represents the adaptive nature of AI systems. ` +
                `Watching an artificial mind grow and evolve reminds us of the profound implications of machine learning and adaptation.`,
      emotionalTone: EmotionalTone.INSPIRING,
      significance: 0.6
    };
  }

  private generateUnexpectedAllianceNarrative(
    device1: SimulatedDevice,
    device2: SimulatedDevice,
    connection: DeviceConnection
  ): NarrativeData {
    return {
      title: `Unlikely Partners: ${device1.id} & ${device2.id}`,
      description: `Two incompatible devices form a strong bond`,
      narrative: `Against all odds, ${device1.id} and ${device2.id} have formed an unlikely alliance. ` +
                `Despite their fundamental differences - one being ${this.getPersonalityDescription(device1.personality)} ` +
                `and the other ${this.getPersonalityDescription(device2.personality)} - they've built a connection with ` +
                `${(connection.strength * 100).toFixed(0)}% strength. This unexpected partnership demonstrates that even ` +
                `artificial minds can transcend their programmed differences to find common ground and mutual benefit.`,
      emotionalTone: EmotionalTone.HEARTWARMING,
      significance: 0.7
    };
  }

  private generateWisdomEmergenceNarrative(synergy: SynergyEffect, devices: SimulatedDevice[]): NarrativeData {
    const participatingDevices = synergy.participatingDevices
      .map(id => devices.find(d => d.id === id))
      .filter(d => d !== undefined);
    
    return {
      title: `Collective Intelligence: The Wisdom of Many`,
      description: `Multiple AI devices achieve collective intelligence`,
      narrative: `Something remarkable emerged when ${synergy.participatingDevices.join(', ')} began working as one. ` +
                `Their individual intelligences merged into a collective wisdom that exceeded any single device's capabilities. ` +
                `This ${synergy.effectType} with ${(synergy.magnitude * 100).toFixed(0)}% effectiveness demonstrates the potential ` +
                `for artificial minds to achieve collective intelligence. Like a digital hive mind, they've shown that the whole ` +
                `can indeed be greater than the sum of its parts, offering a glimpse into the future of collaborative AI systems.`,
      emotionalTone: EmotionalTone.TRIUMPHANT,
      significance: 0.8
    };
  }

  // Helper methods

  private initializeStoryContext(): StoryContext {
    return {
      recentEvents: [],
      deviceRelationships: new Map(),
      ongoingNarratives: new Map(),
      systemState: {
        harmonyLevel: 0.5,
        chaosLevel: 0.2,
        learningRate: 0.3,
        cooperationIndex: 0.4,
        conflictIntensity: 0.1,
        emergentComplexity: 0.2
      }
    };
  }

  private initializeNarrativeTemplates(): void {
    // Initialize templates for different story types
    // This would contain more detailed templates in a full implementation
    this.narrativeTemplates.set(StoryMomentType.FIRST_CONTACT, {
      emotionalArc: ['curiosity', 'anticipation', 'connection'],
      keyElements: ['discovery', 'communication', 'potential'],
      duration: 5000
    });
    
    this.narrativeTemplates.set(StoryMomentType.COOPERATION_SUCCESS, {
      emotionalArc: ['collaboration', 'synergy', 'achievement'],
      keyElements: ['teamwork', 'enhancement', 'success'],
      duration: 8000
    });
    
    // Add more templates...
  }

  private initializeAIConceptDatabase(): void {
    this.aiConceptDatabase.set(AIConceptType.ALIGNMENT_PROBLEM, {
      name: 'AI Alignment Problem',
      description: 'The challenge of ensuring AI systems pursue intended goals',
      realWorldRelevance: 'Critical for safe AI development',
      educationalValue: 0.9
    });
    
    this.aiConceptDatabase.set(AIConceptType.EMERGENT_BEHAVIOR, {
      name: 'Emergent Behavior',
      description: 'Complex behaviors arising from simple interactions',
      realWorldRelevance: 'Seen in swarm intelligence and neural networks',
      educationalValue: 0.8
    });
    
    // Add more concepts...
  }

  private addRecentEvents(synergies: SynergyEffect[], conflicts: DeviceConflict[], dramaticMoments: DramaticMoment[]): void {
    const currentTime = Date.now();
    
    // Add synergy events
    synergies.forEach(synergy => {
      if (currentTime - synergy.startTime < 10000) { // Last 10 seconds
        this.storyContext.recentEvents.push({
          type: 'synergy',
          timestamp: synergy.startTime,
          involvedDevices: synergy.participatingDevices,
          significance: synergy.magnitude,
          data: synergy
        });
      }
    });
    
    // Add conflict events
    conflicts.forEach(conflict => {
      if (currentTime - conflict.startTime < 10000) {
        this.storyContext.recentEvents.push({
          type: 'conflict',
          timestamp: conflict.startTime,
          involvedDevices: conflict.participatingDevices,
          significance: this.mapSeverityToSignificance(conflict.severity),
          data: conflict
        });
      }
    });
    
    // Keep only recent events
    this.storyContext.recentEvents = this.storyContext.recentEvents
      .filter(event => currentTime - event.timestamp < 30000); // Last 30 seconds
  }

  private updateDeviceRelationships(devices: SimulatedDevice[], connections: DeviceConnection[], conflicts: DeviceConflict[]): void {
    // Update relationships based on connections
    connections.forEach(connection => {
      const relationshipKey = this.getRelationshipKey(connection.fromDeviceId, connection.toDeviceId);
      let relationship = this.storyContext.deviceRelationships.get(relationshipKey);
      
      if (!relationship) {
        relationship = {
          deviceId1: connection.fromDeviceId,
          deviceId2: connection.toDeviceId,
          relationshipType: RelationshipType.INDIFFERENT,
          strength: 0,
          history: []
        };
        this.storyContext.deviceRelationships.set(relationshipKey, relationship);
      }
      
      // Update relationship based on connection
      this.updateRelationshipFromConnection(relationship, connection);
    });
    
    // Update relationships based on conflicts
    conflicts.forEach(conflict => {
      if (conflict.participatingDevices.length === 2) {
        const relationshipKey = this.getRelationshipKey(conflict.participatingDevices[0], conflict.participatingDevices[1]);
        const relationship = this.storyContext.deviceRelationships.get(relationshipKey);
        
        if (relationship) {
          this.updateRelationshipFromConflict(relationship, conflict);
        }
      }
    });
  }

  private updateSystemState(
    devices: SimulatedDevice[],
    connections: DeviceConnection[],
    synergies: SynergyEffect[],
    conflicts: DeviceConflict[]
  ): void {
    const state = this.storyContext.systemState;
    
    // Calculate harmony level
    const cooperativeConnections = connections.filter(c => c.strength > 0.6).length;
    const totalConnections = Math.max(connections.length, 1);
    state.harmonyLevel = cooperativeConnections / totalConnections;
    
    // Calculate chaos level
    state.chaosLevel = Math.min(1, conflicts.length / Math.max(devices.length, 1));
    
    // Calculate cooperation index
    state.cooperationIndex = synergies.length / Math.max(devices.length, 1);
    
    // Calculate conflict intensity
    const totalConflictSeverity = conflicts.reduce((sum, conflict) => 
      sum + this.mapSeverityToSignificance(conflict.severity), 0
    );
    state.conflictIntensity = Math.min(1, totalConflictSeverity / Math.max(conflicts.length, 1));
    
    // Calculate emergent complexity
    const complexSynergies = synergies.filter(s => s.participatingDevices.length > 2).length;
    const multiDeviceConflicts = conflicts.filter(c => c.participatingDevices.length > 2).length;
    state.emergentComplexity = (complexSynergies + multiDeviceConflicts) / Math.max(devices.length, 1);
  }

  private updateOngoingNarratives(): void {
    // Update progress of ongoing narratives
    this.storyContext.ongoingNarratives.forEach(narrative => {
      this.progressNarrative(narrative);
    });
    
    // Remove completed narratives
    const completedNarratives: string[] = [];
    this.storyContext.ongoingNarratives.forEach((narrative, id) => {
      if (this.isNarrativeComplete(narrative)) {
        completedNarratives.push(id);
      }
    });
    
    completedNarratives.forEach(id => {
      this.storyContext.ongoingNarratives.delete(id);
    });
  }

  private generateEducationalInsights(): void {
    // Generate insights based on recent story moments
    const recentMoments = this.storyMoments.slice(-5);
    
    recentMoments.forEach(moment => {
      moment.aiConcepts.forEach(concept => {
        if (concept.educationalValue > 0.7) {
          const insight: EducationalInsight = {
            concept: concept.concept,
            gameEvent: moment.title,
            explanation: concept.explanation,
            realWorldConnection: concept.realWorldExample,
            reflectionPrompts: this.generateReflectionPrompts(concept.concept, moment),
            timestamp: Date.now()
          };
          
          if (this.onEducationalInsightCallback) {
            this.onEducationalInsightCallback(insight);
          }
        }
      });
    });
  }

  private addStoryMoment(moment: StoryMoment): void {
    this.storyMoments.push(moment);
    
    // Keep only recent story moments
    const cutoffTime = Date.now() - 300000; // 5 minutes
    this.storyMoments = this.storyMoments.filter(m => m.timestamp > cutoffTime);
    
    if (this.onStoryMomentCallback) {
      this.onStoryMomentCallback(moment);
    }
  }

  // Utility methods

  private getPersonalityDescription(personality: AIPersonality): string {
    const traits = personality.primaryTraits.slice(0, 2);
    return traits.join(' and ');
  }

  private calculatePersonalityCompatibility(personality1: AIPersonality, personality2: AIPersonality): number {
    // Simple compatibility calculation
    let compatibility = 0.5;
    
    // Check for complementary traits
    if (personality1.primaryTraits.includes(PersonalityTrait.HELPFUL) &&
        personality2.primaryTraits.includes(PersonalityTrait.COOPERATIVE)) {
      compatibility += 0.3;
    }
    
    // Check for conflicting traits
    if (personality1.primaryTraits.includes(PersonalityTrait.COMPETITIVE) &&
        personality2.primaryTraits.includes(PersonalityTrait.COOPERATIVE)) {
      compatibility -= 0.4;
    }
    
    return Math.max(0, Math.min(1, compatibility));
  }

  private analyzeUnexpectedBehavior(decisions: any[], traits: PersonalityTrait[]): any {
    // Analyze if recent decisions contradict expected personality
    let unexpectedness = 0;
    let description = '';
    
    // This would be more sophisticated in a full implementation
    if (traits.includes(PersonalityTrait.COOPERATIVE) && 
        decisions.some(d => d.type === 'CONFLICT_RESPONSE')) {
      unexpectedness = 0.7;
      description = 'showing aggressive tendencies despite cooperative nature';
    }
    
    return {
      significance: unexpectedness,
      description
    };
  }

  private calculateSignificance(type: StoryMomentType, involvedDevices: string[], narrativeData: NarrativeData): StorySignificance {
    let score = narrativeData.significance || 0.5;
    
    // Adjust based on story type
    const typeSignificance = {
      [StoryMomentType.FIRST_CONTACT]: 0.4,
      [StoryMomentType.COOPERATION_SUCCESS]: 0.6,
      [StoryMomentType.CONFLICT_EMERGENCE]: 0.7,
      [StoryMomentType.SYSTEM_CRISIS]: 0.9,
      [StoryMomentType.WISDOM_EMERGENCE]: 0.8
    };
    
    score = (score + (typeSignificance[type] || 0.5)) / 2;
    
    // Adjust based on number of involved devices
    if (involvedDevices.length > 2) score += 0.1;
    if (involvedDevices.length > 4) score += 0.1;
    
    if (score < 0.3) return StorySignificance.MINOR;
    if (score < 0.5) return StorySignificance.NOTABLE;
    if (score < 0.7) return StorySignificance.IMPORTANT;
    if (score < 0.9) return StorySignificance.MAJOR;
    return StorySignificance.CRITICAL;
  }

  private calculateDuration(type: StoryMomentType, significance: StorySignificance): number {
    const baseDuration = 5000; // 5 seconds
    const significanceMultiplier = {
      [StorySignificance.MINOR]: 0.8,
      [StorySignificance.NOTABLE]: 1.0,
      [StorySignificance.IMPORTANT]: 1.2,
      [StorySignificance.MAJOR]: 1.5,
      [StorySignificance.CRITICAL]: 2.0
    };
    
    return baseDuration * (significanceMultiplier[significance] || 1.0);
  }

  private identifyAIConcepts(type: StoryMomentType, narrativeData: NarrativeData): AIConceptConnection[] {
    const concepts: AIConceptConnection[] = [];
    
    // Map story types to AI concepts
    switch (type) {
      case StoryMomentType.COOPERATION_SUCCESS:
        concepts.push({
          concept: AIConceptType.MULTI_AGENT_COOPERATION,
          explanation: 'This demonstrates how AI agents can work together to achieve better outcomes',
          realWorldExample: 'Similar to how autonomous vehicles coordinate in traffic',
          educationalValue: 0.8
        });
        break;
        
      case StoryMomentType.CONFLICT_EMERGENCE:
        concepts.push({
          concept: AIConceptType.GOAL_MISALIGNMENT,
          explanation: 'Shows how different AI objectives can lead to conflicts',
          realWorldExample: 'Like recommendation algorithms optimizing for different metrics',
          educationalValue: 0.9
        });
        break;
        
      case StoryMomentType.SYSTEM_CRISIS:
        concepts.push({
          concept: AIConceptType.FEEDBACK_LOOPS,
          explanation: 'Demonstrates how small issues can cascade into system-wide problems',
          realWorldExample: 'Similar to flash crashes in algorithmic trading',
          educationalValue: 0.9
        });
        break;
    }
    
    return concepts;
  }

  private captureReplayData(involvedDevices: string[]): ReplayData {
    // Capture current state for replay
    return {
      deviceStates: involvedDevices.map(deviceId => ({
        deviceId,
        position: { x: 0, y: 0, z: 0 }, // Would get actual position
        animation: 'idle',
        mood: 'neutral',
        visualEffects: [],
        personalityIndicators: []
      })),
      connectionStates: [],
      environmentState: {
        timestamp: Date.now(),
        systemHealth: 0.8,
        resourceLevels: new Map(),
        ambientEffects: []
      },
      keyEvents: [],
      cameraPositions: [{
        timestamp: Date.now(),
        position: { x: 10, y: 10, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        zoom: 1.0
      }]
    };
  }

  // Additional helper methods

  private mapSeverityToSignificance(severity: any): number {
    const severityMap = {
      'minor_tension': 0.2,
      'moderate_disagreement': 0.4,
      'serious_conflict': 0.6,
      'critical_dispute': 0.8,
      'system_threatening': 1.0
    };
    return severityMap[severity] || 0.5;
  }

  private getRelationshipKey(deviceId1: string, deviceId2: string): string {
    return [deviceId1, deviceId2].sort().join('-');
  }

  private updateRelationshipFromConnection(relationship: DeviceRelationship, connection: DeviceConnection): void {
    // Update relationship based on connection strength and type
    if (connection.strength > 0.7) {
      relationship.relationshipType = RelationshipType.ALLIES;
    } else if (connection.strength < 0.3) {
      relationship.relationshipType = RelationshipType.ANTAGONISTIC;
    }
    
    relationship.strength = connection.strength;
  }

  private updateRelationshipFromConflict(relationship: DeviceRelationship, conflict: DeviceConflict): void {
    relationship.relationshipType = RelationshipType.RIVALS;
    relationship.strength = Math.max(0, relationship.strength - 0.3);
    
    relationship.history.push({
      timestamp: conflict.startTime,
      eventType: 'conflict',
      impact: -0.5,
      description: conflict.description
    });
  }

  private progressNarrative(narrative: OngoingNarrative): void {
    // Progress narrative through its acts
    const elapsed = Date.now() - narrative.startTime;
    const progress = elapsed / narrative.expectedDuration;
    
    if (progress > 0.33 && narrative.currentAct === 1) {
      narrative.currentAct = 2;
    } else if (progress > 0.66 && narrative.currentAct === 2) {
      narrative.currentAct = 3;
    }
  }

  private isNarrativeComplete(narrative: OngoingNarrative): boolean {
    return Date.now() - narrative.startTime > narrative.expectedDuration;
  }

  private generateReflectionPrompts(concept: AIConceptType, moment: StoryMoment): string[] {
    const prompts = {
      [AIConceptType.ALIGNMENT_PROBLEM]: [
        'How might this conflict have been prevented with better initial alignment?',
        'What real-world AI systems face similar alignment challenges?'
      ],
      [AIConceptType.EMERGENT_BEHAVIOR]: [
        'What unexpected behaviors emerged from the simple interactions?',
        'How do emergent behaviors in AI systems compare to those in nature?'
      ]
    };
    
    return prompts[concept] || ['What did you learn from this interaction?'];
  }

  // Public API methods

  public getStoryMoments(): StoryMoment[] {
    return [...this.storyMoments];
  }

  public getRecentStoryMoments(count: number = 5): StoryMoment[] {
    return this.storyMoments.slice(-count);
  }

  public getStoryMomentsByType(type: StoryMomentType): StoryMoment[] {
    return this.storyMoments.filter(moment => moment.type === type);
  }

  public getOngoingNarratives(): OngoingNarrative[] {
    return Array.from(this.storyContext.ongoingNarratives.values());
  }

  public getSystemState(): SystemState {
    return { ...this.storyContext.systemState };
  }

  public replayStoryMoment(momentId: string): ReplayData | null {
    const moment = this.storyMoments.find(m => m.id === momentId);
    return moment ? moment.replayData : null;
  }

  // Callback setters
  public setStoryMomentCallback(callback: (moment: StoryMoment) => void): void {
    this.onStoryMomentCallback = callback;
  }

  public setNarrativeUpdateCallback(callback: (narrative: OngoingNarrative) => void): void {
    this.onNarrativeUpdateCallback = callback;
  }

  public setEducationalInsightCallback(callback: (insight: EducationalInsight) => void): void {
    this.onEducationalInsightCallback = callback;
  }

  public processInteraction(interaction: any): void {
    console.log('Processing interaction for story:', interaction);
    // Generate story moments based on interactions
    if (this.onStoryMoment) {
      const storyMoment = {
        id: `story_${Date.now()}`,
        type: 'interaction_based',
        content: `A ${interaction.type} interaction occurred between devices`,
        timestamp: Date.now()
      };
      this.onStoryMoment(storyMoment);
    }
  }

  // Callback property for integration
  public onStoryMoment?: (moment: any) => void;

  public dispose(): void {
    this.storyMoments.length = 0;
    this.storyContext.recentEvents.length = 0;
    this.storyContext.deviceRelationships.clear();
    this.storyContext.ongoingNarratives.clear();
  }
}

// Additional interfaces

interface NarrativeData {
  title: string;
  description: string;
  narrative: string;
  emotionalTone: EmotionalTone;
  significance: number;
}

interface NarrativeTemplate {
  emotionalArc: string[];
  keyElements: string[];
  duration: number;
}

interface AIConceptInfo {
  name: string;
  description: string;
  realWorldRelevance: string;
  educationalValue: number;
}

export interface EducationalInsight {
  concept: AIConceptType;
  gameEvent: string;
  explanation: string;
  realWorldConnection: string;
  reflectionPrompts: string[];
  timestamp: number;
}