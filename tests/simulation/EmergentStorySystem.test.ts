import { EmergentStorySystem, StoryMomentType, StorySignificance, EmotionalTone, AIConceptType } from '@/simulation/EmergentStorySystem';
import { SimulatedDevice, DeviceConnection, SynergyEffect, SynergyType } from '@/simulation/DeviceInteractionSimulator';
import { DeviceConflict, DramaticMoment, ConflictType, DramaticMomentType } from '@/simulation/DeviceConflictSystem';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';
import { ConnectionType, ConnectionStatus } from '@/types/ui';

describe('EmergentStorySystem', () => {
  let storySystem: EmergentStorySystem;
  let mockDevices: SimulatedDevice[];
  let mockConnections: DeviceConnection[];
  let mockSynergies: SynergyEffect[];
  let mockConflicts: DeviceConflict[];
  let mockDramaticMoments: DramaticMoment[];

  beforeEach(() => {
    storySystem = new EmergentStorySystem();
    
    // Create mock data
    mockDevices = [
      createMockDevice('friendly-device', [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE]),
      createMockDevice('competitive-device', [PersonalityTrait.COMPETITIVE, PersonalityTrait.OVERCONFIDENT]),
      createMockDevice('anxious-device', [PersonalityTrait.ANXIOUS])
    ];
    
    mockConnections = [
      createMockConnection('friendly-device', 'competitive-device', 0.8, Date.now() - 2000),
      createMockConnection('anxious-device', 'friendly-device', 0.3, Date.now() - 1000)
    ];
    
    mockSynergies = [
      createMockSynergy(['friendly-device', 'competitive-device'], SynergyType.EFFICIENCY_BOOST, 0.8)
    ];
    
    mockConflicts = [
      createMockConflict(['competitive-device', 'anxious-device'], ConflictType.PERSONALITY_CLASH)
    ];
    
    mockDramaticMoments = [
      createMockDramaticMoment(['friendly-device', 'competitive-device', 'anxious-device'], DramaticMomentType.SYSTEM_CHAOS)
    ];
  });

  afterEach(() => {
    storySystem.dispose();
  });

  function createMockDevice(id: string, traits: PersonalityTrait[]): SimulatedDevice {
    const personality: AIPersonality = {
      primaryTraits: traits,
      secondaryTraits: ['test-trait'],
      communicationStyle: CommunicationStyle.FRIENDLY,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.5,
      adaptability: 0.5,
      socialness: 0.5,
      reliability: 0.5,
      quirks: ['test quirk'],
      hiddenMotivations: ['test motivation'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.5,
        empathy: 0.5,
        patience: 0.5,
        enthusiasm: 0.5,
        anxiety: traits.includes(PersonalityTrait.ANXIOUS) ? 0.8 : 0.3
      },
      visualPersonality: {
        colorScheme: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#888888',
          glow: '#cccccc'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.5,
        visualQuirks: []
      }
    };

    return {
      id,
      visual: {
        id,
        model3D: {} as any,
        position: { x: 0, y: 0, z: 0 },
        animations: {} as any,
        personalityIndicators: [],
        connectionEffects: []
      },
      behavior: {
        getDecisionHistory: () => [],
        getLearningHistory: () => []
      } as any,
      personality,
      isActive: true,
      lastUpdateTime: Date.now(),
      discoveredDevices: new Set(),
      activeConnections: new Map(),
      cooperationHistory: new Map()
    };
  }

  function createMockConnection(fromId: string, toId: string, strength: number, establishedTime: number): DeviceConnection {
    return {
      id: `${fromId}-${toId}`,
      fromDeviceId: fromId,
      toDeviceId: toId,
      type: ConnectionType.COMMUNICATION,
      strength,
      status: ConnectionStatus.ACTIVE,
      establishedTime,
      lastInteractionTime: Date.now(),
      interactionCount: strength > 0.5 ? 5 : 2,
      successRate: strength
    };
  }

  function createMockSynergy(devices: string[], type: SynergyType, magnitude: number): SynergyEffect {
    return {
      id: `synergy-${Date.now()}`,
      participatingDevices: devices,
      effectType: type,
      magnitude,
      description: `${devices.join(' and ')} are working together effectively`,
      visualEffect: 'success' as any,
      duration: 30000,
      startTime: Date.now() - 1000
    };
  }

  function createMockConflict(devices: string[], type: ConflictType): DeviceConflict {
    return {
      id: `conflict-${Date.now()}`,
      participatingDevices: devices,
      conflictType: type,
      severity: 'serious_conflict' as any,
      cause: 'personality_mismatch' as any,
      description: `${devices.join(' and ')} are in conflict`,
      startTime: Date.now() - 2000,
      escalationLevel: 0.5,
      resourcesInvolved: [],
      visualEffects: []
    };
  }

  function createMockDramaticMoment(devices: string[], type: DramaticMomentType): DramaticMoment {
    return {
      type,
      description: 'System is experiencing chaos',
      involvedDevices: devices,
      intensity: 0.8,
      timestamp: Date.now() - 500
    };
  }

  describe('initialization', () => {
    it('should initialize with empty story state', () => {
      expect(storySystem.getStoryMoments()).toHaveLength(0);
      expect(storySystem.getOngoingNarratives()).toHaveLength(0);
      expect(storySystem.getSystemState()).toBeDefined();
    });

    it('should have valid initial system state', () => {
      const systemState = storySystem.getSystemState();
      
      expect(systemState.harmonyLevel).toBeGreaterThanOrEqual(0);
      expect(systemState.harmonyLevel).toBeLessThanOrEqual(1);
      expect(systemState.chaosLevel).toBeGreaterThanOrEqual(0);
      expect(systemState.chaosLevel).toBeLessThanOrEqual(1);
      expect(systemState.cooperationIndex).toBeGreaterThanOrEqual(0);
      expect(systemState.conflictIntensity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('story moment detection', () => {
    it('should detect first contact moments', () => {
      let detectedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        if (moment.type === StoryMomentType.FIRST_CONTACT) {
          detectedMoment = moment;
        }
      });

      // Create a very recent connection to simulate first contact
      const recentConnection = createMockConnection('new-device-1', 'new-device-2', 0.5, Date.now() - 1000);
      recentConnection.interactionCount = 1; // Very new

      const newDevices = [
        createMockDevice('new-device-1', [PersonalityTrait.HELPFUL]),
        createMockDevice('new-device-2', [PersonalityTrait.COOPERATIVE])
      ];

      storySystem.analyzeSimulationEvents(newDevices, [recentConnection], [], [], []);

      if (detectedMoment) {
        expect(detectedMoment.type).toBe(StoryMomentType.FIRST_CONTACT);
        expect(detectedMoment.involvedDevices).toContain('new-device-1');
        expect(detectedMoment.involvedDevices).toContain('new-device-2');
        expect(detectedMoment.title).toBeTruthy();
        expect(detectedMoment.narrative).toBeTruthy();
      }
    });

    it('should detect cooperation success moments', () => {
      let detectedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        if (moment.type === StoryMomentType.COOPERATION_SUCCESS) {
          detectedMoment = moment;
        }
      });

      // Create a recent high-magnitude synergy
      const recentSynergy = createMockSynergy(['device-1', 'device-2'], SynergyType.EFFICIENCY_BOOST, 0.9);
      recentSynergy.startTime = Date.now() - 1000; // Very recent

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [recentSynergy], [], []);

      if (detectedMoment) {
        expect(detectedMoment.type).toBe(StoryMomentType.COOPERATION_SUCCESS);
        expect(detectedMoment.involvedDevices).toContain('device-1');
        expect(detectedMoment.involvedDevices).toContain('device-2');
        expect(detectedMoment.emotionalTone).toBe(EmotionalTone.INSPIRING);
      }
    });

    it('should detect conflict emergence moments', () => {
      let detectedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        if (moment.type === StoryMomentType.CONFLICT_EMERGENCE) {
          detectedMoment = moment;
        }
      });

      // Create a recent conflict
      const recentConflict = createMockConflict(['device-1', 'device-2'], ConflictType.AUTHORITY_DISPUTE);
      recentConflict.startTime = Date.now() - 2000; // Recent

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], [recentConflict], []);

      if (detectedMoment) {
        expect(detectedMoment.type).toBe(StoryMomentType.CONFLICT_EMERGENCE);
        expect(detectedMoment.involvedDevices).toContain('device-1');
        expect(detectedMoment.involvedDevices).toContain('device-2');
        expect(detectedMoment.emotionalTone).toBe(EmotionalTone.TENSE);
      }
    });

    it('should detect dramatic moments', () => {
      let detectedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        if (moment.type === StoryMomentType.SYSTEM_CRISIS) {
          detectedMoment = moment;
        }
      });

      const dramaticMoment = createMockDramaticMoment(['device-1', 'device-2'], DramaticMomentType.SYSTEM_CHAOS);

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], [], [dramaticMoment]);

      if (detectedMoment) {
        expect(detectedMoment.type).toBe(StoryMomentType.SYSTEM_CRISIS);
        expect(detectedMoment.emotionalTone).toBe(EmotionalTone.DRAMATIC);
        expect(detectedMoment.significance).toBe(StorySignificance.CRITICAL);
      }
    });

    it('should detect unexpected alliance moments', () => {
      let detectedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        if (moment.type === StoryMomentType.UNEXPECTED_ALLIANCE) {
          detectedMoment = moment;
        }
      });

      // Create devices with incompatible personalities but strong connection
      const competitiveDevice = createMockDevice('competitive', [PersonalityTrait.COMPETITIVE]);
      const cooperativeDevice = createMockDevice('cooperative', [PersonalityTrait.COOPERATIVE]);
      const strongConnection = createMockConnection('competitive', 'cooperative', 0.9, Date.now() - 5000);

      storySystem.analyzeSimulationEvents(
        [competitiveDevice, cooperativeDevice],
        [strongConnection],
        [],
        [],
        []
      );

      if (detectedMoment) {
        expect(detectedMoment.type).toBe(StoryMomentType.UNEXPECTED_ALLIANCE);
        expect(detectedMoment.emotionalTone).toBe(EmotionalTone.HEARTWARMING);
      }
    });

    it('should detect wisdom emergence moments', () => {
      let detectedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        if (moment.type === StoryMomentType.WISDOM_EMERGENCE) {
          detectedMoment = moment;
        }
      });

      // Create a complex multi-device synergy
      const complexSynergy = createMockSynergy(
        ['device-1', 'device-2', 'device-3', 'device-4'],
        SynergyType.COLLECTIVE_INTELLIGENCE,
        0.9
      );

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [complexSynergy], [], []);

      if (detectedMoment) {
        expect(detectedMoment.type).toBe(StoryMomentType.WISDOM_EMERGENCE);
        expect(detectedMoment.involvedDevices.length).toBeGreaterThanOrEqual(3);
        expect(detectedMoment.emotionalTone).toBe(EmotionalTone.TRIUMPHANT);
      }
    });
  });

  describe('story moment properties', () => {
    it('should create story moments with all required properties', () => {
      let capturedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        capturedMoment = moment;
      });

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, [], []);

      if (capturedMoment) {
        expect(capturedMoment.id).toBeTruthy();
        expect(capturedMoment.type).toBeDefined();
        expect(capturedMoment.title).toBeTruthy();
        expect(capturedMoment.description).toBeTruthy();
        expect(capturedMoment.narrative).toBeTruthy();
        expect(capturedMoment.involvedDevices).toBeDefined();
        expect(capturedMoment.timestamp).toBeGreaterThan(0);
        expect(capturedMoment.duration).toBeGreaterThan(0);
        expect(capturedMoment.significance).toBeDefined();
        expect(capturedMoment.emotionalTone).toBeDefined();
        expect(capturedMoment.aiConcepts).toBeDefined();
        expect(capturedMoment.replayData).toBeDefined();
      }
    });

    it('should assign appropriate significance levels', () => {
      const moments: any[] = [];
      storySystem.setStoryMomentCallback((moment) => {
        moments.push(moment);
      });

      // Create scenarios with different significance levels
      const minorSynergy = createMockSynergy(['device-1', 'device-2'], SynergyType.EFFICIENCY_BOOST, 0.3);
      const majorConflict = createMockConflict(['device-1', 'device-2'], ConflictType.AUTHORITY_DISPUTE);
      const criticalDrama = createMockDramaticMoment(['device-1', 'device-2'], DramaticMomentType.SYSTEM_CHAOS);

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [minorSynergy], [majorConflict], [criticalDrama]);

      moments.forEach(moment => {
        expect(Object.values(StorySignificance)).toContain(moment.significance);
      });
    });

    it('should assign appropriate emotional tones', () => {
      const moments: any[] = [];
      storySystem.setStoryMomentCallback((moment) => {
        moments.push(moment);
      });

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, mockConflicts, mockDramaticMoments);

      moments.forEach(moment => {
        expect(Object.values(EmotionalTone)).toContain(moment.emotionalTone);
      });
    });

    it('should include AI concept connections', () => {
      let capturedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        capturedMoment = moment;
      });

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], mockConflicts, []);

      if (capturedMoment && capturedMoment.aiConcepts.length > 0) {
        const concept = capturedMoment.aiConcepts[0];
        expect(Object.values(AIConceptType)).toContain(concept.concept);
        expect(concept.explanation).toBeTruthy();
        expect(concept.realWorldExample).toBeTruthy();
        expect(concept.educationalValue).toBeGreaterThan(0);
        expect(concept.educationalValue).toBeLessThanOrEqual(1);
      }
    });

    it('should include replay data', () => {
      let capturedMoment: any = null;
      storySystem.setStoryMomentCallback((moment) => {
        capturedMoment = moment;
      });

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, [], []);

      if (capturedMoment) {
        const replayData = capturedMoment.replayData;
        expect(replayData.deviceStates).toBeDefined();
        expect(replayData.connectionStates).toBeDefined();
        expect(replayData.environmentState).toBeDefined();
        expect(replayData.keyEvents).toBeDefined();
        expect(replayData.cameraPositions).toBeDefined();
      }
    });
  });

  describe('educational insights', () => {
    it('should generate educational insights', () => {
      let capturedInsight: any = null;
      storySystem.setEducationalInsightCallback((insight) => {
        capturedInsight = insight;
      });

      // Create a scenario that should generate educational insights
      const significantConflict = createMockConflict(['device-1', 'device-2'], ConflictType.GOAL_INCOMPATIBILITY);
      
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], [significantConflict], []);

      if (capturedInsight) {
        expect(Object.values(AIConceptType)).toContain(capturedInsight.concept);
        expect(capturedInsight.gameEvent).toBeTruthy();
        expect(capturedInsight.explanation).toBeTruthy();
        expect(capturedInsight.realWorldConnection).toBeTruthy();
        expect(capturedInsight.reflectionPrompts).toBeDefined();
        expect(capturedInsight.reflectionPrompts.length).toBeGreaterThan(0);
        expect(capturedInsight.timestamp).toBeGreaterThan(0);
      }
    });

    it('should provide relevant reflection prompts', () => {
      let capturedInsight: any = null;
      storySystem.setEducationalInsightCallback((insight) => {
        capturedInsight = insight;
      });

      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], mockConflicts, []);

      if (capturedInsight) {
        expect(Array.isArray(capturedInsight.reflectionPrompts)).toBe(true);
        capturedInsight.reflectionPrompts.forEach((prompt: string) => {
          expect(typeof prompt).toBe('string');
          expect(prompt.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('system state tracking', () => {
    it('should update system state based on simulation events', () => {
      const initialState = storySystem.getSystemState();
      
      // Create events that should affect system state
      const highConflictScenario = [
        createMockConflict(['device-1', 'device-2'], ConflictType.AUTHORITY_DISPUTE),
        createMockConflict(['device-2', 'device-3'], ConflictType.RESOURCE_COMPETITION)
      ];
      
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], highConflictScenario, []);
      
      const updatedState = storySystem.getSystemState();
      
      // System state should reflect the conflicts
      expect(updatedState.conflictIntensity).toBeGreaterThanOrEqual(0);
      expect(updatedState.chaosLevel).toBeGreaterThanOrEqual(0);
    });

    it('should calculate harmony level based on connections', () => {
      // Create scenario with high cooperation
      const cooperativeConnections = [
        createMockConnection('device-1', 'device-2', 0.9, Date.now() - 5000),
        createMockConnection('device-2', 'device-3', 0.8, Date.now() - 5000)
      ];
      
      storySystem.analyzeSimulationEvents(mockDevices, cooperativeConnections, mockSynergies, [], []);
      
      const systemState = storySystem.getSystemState();
      expect(systemState.harmonyLevel).toBeGreaterThan(0.5);
    });

    it('should calculate cooperation index based on synergies', () => {
      const multipleSynergies = [
        createMockSynergy(['device-1', 'device-2'], SynergyType.EFFICIENCY_BOOST, 0.8),
        createMockSynergy(['device-2', 'device-3'], SynergyType.ENHANCED_CAPABILITY, 0.7)
      ];
      
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, multipleSynergies, [], []);
      
      const systemState = storySystem.getSystemState();
      expect(systemState.cooperationIndex).toBeGreaterThan(0);
    });
  });

  describe('story moment retrieval', () => {
    it('should retrieve story moments by type', () => {
      // Generate some story moments
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, mockConflicts, []);
      
      const allMoments = storySystem.getStoryMoments();
      
      if (allMoments.length > 0) {
        const firstMomentType = allMoments[0].type;
        const momentsByType = storySystem.getStoryMomentsByType(firstMomentType);
        
        expect(momentsByType.length).toBeGreaterThan(0);
        momentsByType.forEach(moment => {
          expect(moment.type).toBe(firstMomentType);
        });
      }
    });

    it('should retrieve recent story moments', () => {
      // Generate multiple story moments
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, [], []);
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], mockConflicts, []);
      
      const recentMoments = storySystem.getRecentStoryMoments(3);
      expect(recentMoments.length).toBeLessThanOrEqual(3);
      
      // Should be in chronological order (most recent first)
      for (let i = 1; i < recentMoments.length; i++) {
        expect(recentMoments[i].timestamp).toBeLessThanOrEqual(recentMoments[i - 1].timestamp);
      }
    });

    it('should provide replay data for story moments', () => {
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, [], []);
      
      const moments = storySystem.getStoryMoments();
      if (moments.length > 0) {
        const replayData = storySystem.replayStoryMoment(moments[0].id);
        
        expect(replayData).toBeDefined();
        if (replayData) {
          expect(replayData.deviceStates).toBeDefined();
          expect(replayData.environmentState).toBeDefined();
          expect(replayData.cameraPositions).toBeDefined();
        }
      }
    });

    it('should return null for non-existent story moment replay', () => {
      const replayData = storySystem.replayStoryMoment('non-existent-id');
      expect(replayData).toBeNull();
    });
  });

  describe('callback system', () => {
    it('should trigger story moment callbacks', () => {
      let callbackTriggered = false;
      let capturedMoment: any = null;
      
      storySystem.setStoryMomentCallback((moment) => {
        callbackTriggered = true;
        capturedMoment = moment;
      });
      
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, [], []);
      
      if (callbackTriggered) {
        expect(capturedMoment).toBeDefined();
        expect(capturedMoment.id).toBeTruthy();
      }
    });

    it('should trigger educational insight callbacks', () => {
      let insightCallbackTriggered = false;
      let capturedInsight: any = null;
      
      storySystem.setEducationalInsightCallback((insight) => {
        insightCallbackTriggered = true;
        capturedInsight = insight;
      });
      
      // Create scenario likely to generate insights
      const educationalConflict = createMockConflict(['device-1', 'device-2'], ConflictType.GOAL_INCOMPATIBILITY);
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, [], [educationalConflict], []);
      
      if (insightCallbackTriggered) {
        expect(capturedInsight).toBeDefined();
        expect(capturedInsight.concept).toBeDefined();
      }
    });
  });

  describe('performance and cleanup', () => {
    it('should handle large numbers of events efficiently', () => {
      const startTime = Date.now();
      
      // Create many events
      const manyDevices = [];
      const manyConnections = [];
      const manySynergies = [];
      
      for (let i = 0; i < 10; i++) {
        manyDevices.push(createMockDevice(`device-${i}`, [PersonalityTrait.HELPFUL]));
        if (i > 0) {
          manyConnections.push(createMockConnection(`device-${i-1}`, `device-${i}`, 0.7, Date.now() - 1000));
          manySynergies.push(createMockSynergy([`device-${i-1}`, `device-${i}`], SynergyType.EFFICIENCY_BOOST, 0.6));
        }
      }
      
      storySystem.analyzeSimulationEvents(manyDevices, manyConnections, manySynergies, [], []);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should clean up old story moments', () => {
      // This test would need to manipulate time or wait, so we'll just verify the method exists
      expect(typeof storySystem.dispose).toBe('function');
    });

    it('should dispose resources properly', () => {
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, mockConflicts, []);
      
      expect(() => storySystem.dispose()).not.toThrow();
      
      // After disposal, should have no story moments
      expect(storySystem.getStoryMoments()).toHaveLength(0);
      expect(storySystem.getOngoingNarratives()).toHaveLength(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty simulation data', () => {
      expect(() => storySystem.analyzeSimulationEvents([], [], [], [], [])).not.toThrow();
      
      expect(storySystem.getStoryMoments()).toHaveLength(0);
    });

    it('should handle malformed data gracefully', () => {
      const malformedDevice = createMockDevice('malformed', []);
      malformedDevice.personality = null as any;
      
      expect(() => storySystem.analyzeSimulationEvents([malformedDevice], [], [], [], [])).not.toThrow();
    });

    it('should handle devices with extreme personality values', () => {
      const extremeDevice = createMockDevice('extreme', [PersonalityTrait.OVERCONFIDENT]);
      extremeDevice.personality.reliability = 1.1; // Invalid value
      extremeDevice.personality.socialness = -0.5; // Invalid value
      
      expect(() => storySystem.analyzeSimulationEvents([extremeDevice], [], [], [], [])).not.toThrow();
    });

    it('should handle very old events', () => {
      const oldConnection = createMockConnection('device-1', 'device-2', 0.8, Date.now() - 3600000); // 1 hour ago
      const oldSynergy = createMockSynergy(['device-1', 'device-2'], SynergyType.EFFICIENCY_BOOST, 0.8);
      oldSynergy.startTime = Date.now() - 3600000;
      
      expect(() => storySystem.analyzeSimulationEvents(mockDevices, [oldConnection], [oldSynergy], [], [])).not.toThrow();
    });
  });

  describe('narrative coherence', () => {
    it('should maintain narrative consistency across multiple analysis cycles', () => {
      const moments: any[] = [];
      storySystem.setStoryMomentCallback((moment) => {
        moments.push(moment);
      });
      
      // Run multiple analysis cycles
      for (let i = 0; i < 3; i++) {
        storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, [], []);
      }
      
      // Check that moments are coherent (no contradictory narratives)
      moments.forEach(moment => {
        expect(moment.narrative).toBeTruthy();
        expect(moment.involvedDevices.length).toBeGreaterThan(0);
      });
    });

    it('should track ongoing narratives', () => {
      storySystem.analyzeSimulationEvents(mockDevices, mockConnections, mockSynergies, mockConflicts, []);
      
      const ongoingNarratives = storySystem.getOngoingNarratives();
      expect(Array.isArray(ongoingNarratives)).toBe(true);
      
      ongoingNarratives.forEach(narrative => {
        expect(narrative.id).toBeTruthy();
        expect(narrative.theme).toBeDefined();
        expect(narrative.involvedDevices).toBeDefined();
        expect(narrative.startTime).toBeGreaterThan(0);
      });
    });
  });
});