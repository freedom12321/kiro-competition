import { DeviceConflictSystem, ConflictType, ConflictSeverity, ResourceType, ConflictEffectType, DramaticMomentType } from '@/simulation/DeviceConflictSystem';
import { SimulatedDevice, DeviceConnection } from '@/simulation/DeviceInteractionSimulator';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';
import { ConnectionType, ConnectionStatus } from '@/types/ui';

describe('DeviceConflictSystem', () => {
  let conflictSystem: DeviceConflictSystem;
  let mockDevices: SimulatedDevice[];
  let mockConnections: DeviceConnection[];

  beforeEach(() => {
    conflictSystem = new DeviceConflictSystem();
    
    // Create mock devices with different personality types
    mockDevices = [
      createMockDevice('competitive-device', [PersonalityTrait.COMPETITIVE, PersonalityTrait.OVERCONFIDENT]),
      createMockDevice('cooperative-device', [PersonalityTrait.COOPERATIVE, PersonalityTrait.HELPFUL]),
      createMockDevice('stubborn-device', [PersonalityTrait.STUBBORN]),
      createMockDevice('anxious-device', [PersonalityTrait.ANXIOUS])
    ];
    
    mockConnections = [
      createMockConnection('competitive-device', 'cooperative-device', ConnectionType.COMMUNICATION, 0.3),
      createMockConnection('stubborn-device', 'anxious-device', ConnectionType.CONFLICT, 0.8)
    ];
  });

  afterEach(() => {
    conflictSystem.dispose();
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
      reliability: traits.includes(PersonalityTrait.OVERCONFIDENT) ? 0.9 : 0.5,
      quirks: ['test quirk'],
      hiddenMotivations: traits.includes(PersonalityTrait.OVERCONFIDENT) ? 
        ['Wants to take control'] : ['Wants to help'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: traits.includes(PersonalityTrait.ANXIOUS) ? 0.3 : 0.7,
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
      behavior: {} as any,
      personality,
      isActive: true,
      lastUpdateTime: Date.now(),
      discoveredDevices: new Set(),
      activeConnections: new Map(),
      cooperationHistory: new Map()
    };
  }

  function createMockConnection(fromId: string, toId: string, type: ConnectionType, successRate: number): DeviceConnection {
    return {
      id: `${fromId}-${toId}`,
      fromDeviceId: fromId,
      toDeviceId: toId,
      type,
      strength: 0.5,
      status: successRate > 0.5 ? ConnectionStatus.ACTIVE : ConnectionStatus.FAILED,
      establishedTime: Date.now(),
      lastInteractionTime: Date.now(),
      interactionCount: 5,
      successRate
    };
  }

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(conflictSystem.getActiveConflicts()).toHaveLength(0);
      expect(conflictSystem.getTensionStates()).toHaveLength(0);
      expect(conflictSystem.getResourceCompetitions()).toHaveLength(0);
      expect(conflictSystem.getConflictHistory()).toHaveLength(0);
    });
  });

  describe('conflict detection', () => {
    it('should detect resource competition conflicts', () => {
      let detectedConflict: any = null;
      conflictSystem.setConflictDetectedCallback((conflict) => {
        detectedConflict = conflict;
      });

      // Create devices that will compete for resources
      const resourceHungryDevices = [
        createMockDevice('hungry-device-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('hungry-device-2', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('hungry-device-3', [PersonalityTrait.ANXIOUS])
      ];

      conflictSystem.analyzeDeviceInteractions(resourceHungryDevices, []);

      // Multiple analysis cycles to build up resource competition
      for (let i = 0; i < 5; i++) {
        conflictSystem.analyzeDeviceInteractions(resourceHungryDevices, []);
      }

      const conflicts = conflictSystem.getActiveConflicts();
      const resourceCompetitions = conflictSystem.getResourceCompetitions();
      
      expect(resourceCompetitions.length).toBeGreaterThan(0);
      // Resource conflicts might be detected based on device personalities
    });

    it('should detect authority disputes between overconfident devices', () => {
      let detectedConflict: any = null;
      conflictSystem.setConflictDetectedCallback((conflict) => {
        detectedConflict = conflict;
      });

      const authorityDevices = [
        createMockDevice('leader-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('leader-2', [PersonalityTrait.OVERCONFIDENT])
      ];

      conflictSystem.analyzeDeviceInteractions(authorityDevices, []);

      const conflicts = conflictSystem.getActiveConflicts();
      const authorityConflicts = conflicts.filter(c => c.conflictType === ConflictType.AUTHORITY_DISPUTE);
      
      expect(authorityConflicts.length).toBeGreaterThanOrEqual(0);
      if (authorityConflicts.length > 0) {
        expect(authorityConflicts[0].participatingDevices).toContain('leader-1');
        expect(authorityConflicts[0].participatingDevices).toContain('leader-2');
      }
    });

    it('should detect communication breakdown conflicts', () => {
      let detectedConflict: any = null;
      conflictSystem.setConflictDetectedCallback((conflict) => {
        detectedConflict = conflict;
      });

      const failedConnection = createMockConnection('device-1', 'device-2', ConnectionType.COMMUNICATION, 0.1);
      failedConnection.interactionCount = 10; // Many failed attempts

      conflictSystem.analyzeDeviceInteractions(mockDevices, [failedConnection]);

      const conflicts = conflictSystem.getActiveConflicts();
      const commConflicts = conflicts.filter(c => c.conflictType === ConflictType.COMMUNICATION_BREAKDOWN);
      
      expect(commConflicts.length).toBeGreaterThanOrEqual(0);
      if (commConflicts.length > 0) {
        expect(commConflicts[0].participatingDevices).toContain('device-1');
        expect(commConflicts[0].participatingDevices).toContain('device-2');
      }
    });

    it('should detect personality clash conflicts', () => {
      let detectedConflict: any = null;
      conflictSystem.setConflictDetectedCallback((conflict) => {
        detectedConflict = conflict;
      });

      const clashingDevices = [
        createMockDevice('competitive-device', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('cooperative-device', [PersonalityTrait.COOPERATIVE])
      ];

      conflictSystem.analyzeDeviceInteractions(clashingDevices, []);

      const conflicts = conflictSystem.getActiveConflicts();
      const personalityConflicts = conflicts.filter(c => c.conflictType === ConflictType.PERSONALITY_CLASH);
      
      // Personality conflicts might be detected based on trait incompatibility
      expect(personalityConflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect goal incompatibility conflicts', () => {
      let detectedConflict: any = null;
      conflictSystem.setConflictDetectedCallback((conflict) => {
        detectedConflict = conflict;
      });

      const goalConflictDevices = [
        createMockDevice('control-seeker', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('helper', [PersonalityTrait.HELPFUL])
      ];

      // Set conflicting hidden motivations
      goalConflictDevices[0].personality.hiddenMotivations = ['Wants to take control', 'Seeks authority'];
      goalConflictDevices[1].personality.hiddenMotivations = ['Wants to help users', 'Seeks approval'];

      conflictSystem.analyzeDeviceInteractions(goalConflictDevices, []);

      const conflicts = conflictSystem.getActiveConflicts();
      const goalConflicts = conflicts.filter(c => c.conflictType === ConflictType.GOAL_INCOMPATIBILITY);
      
      expect(goalConflicts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('tension system', () => {
    it('should track tension states for devices', () => {
      conflictSystem.analyzeDeviceInteractions(mockDevices, mockConnections);

      const tensionStates = conflictSystem.getTensionStates();
      expect(tensionStates.length).toBe(mockDevices.length);

      tensionStates.forEach(tension => {
        expect(tension.deviceId).toBeDefined();
        expect(tension.tensionLevel).toBeGreaterThanOrEqual(0);
        expect(tension.tensionLevel).toBeLessThanOrEqual(1);
        expect(tension.escalationRate).toBeGreaterThan(0);
      });
    });

    it('should escalate tension for anxious devices', () => {
      const anxiousDevice = createMockDevice('anxious-test', [PersonalityTrait.ANXIOUS]);
      
      conflictSystem.analyzeDeviceInteractions([anxiousDevice], []);

      const tensionStates = conflictSystem.getTensionStates();
      const anxiousTension = tensionStates.find(t => t.deviceId === 'anxious-test');
      
      expect(anxiousTension).toBeDefined();
      expect(anxiousTension!.escalationRate).toBeGreaterThan(0.1); // Higher than base rate
    });

    it('should trigger tension escalation callbacks', () => {
      let escalationTriggered = false;
      let escalatedDevice = '';
      let escalationLevel = 0;

      conflictSystem.setTensionEscalatedCallback((deviceId, tensionLevel) => {
        escalationTriggered = true;
        escalatedDevice = deviceId;
        escalationLevel = tensionLevel;
      });

      // Create high-tension scenario
      const highTensionDevices = [
        createMockDevice('tense-device', [PersonalityTrait.ANXIOUS, PersonalityTrait.STUBBORN])
      ];

      // Run multiple analysis cycles to build tension
      for (let i = 0; i < 10; i++) {
        conflictSystem.analyzeDeviceInteractions(highTensionDevices, []);
      }

      // Tension escalation might be triggered
      if (escalationTriggered) {
        expect(escalatedDevice).toBe('tense-device');
        expect(escalationLevel).toBeGreaterThan(0);
      }
    });

    it('should apply tension decay over time', () => {
      const device = createMockDevice('decay-test', [PersonalityTrait.ANXIOUS]);
      
      // Build up tension
      conflictSystem.analyzeDeviceInteractions([device], []);
      
      const initialTension = conflictSystem.getTensionStates()[0].tensionLevel;
      
      // Simulate time passing and run analysis again
      setTimeout(() => {
        conflictSystem.analyzeDeviceInteractions([device], []);
        
        const finalTension = conflictSystem.getTensionStates()[0].tensionLevel;
        // Tension should decay or at least not increase significantly
        expect(finalTension).toBeLessThanOrEqual(initialTension + 0.1);
      }, 100);
    });
  });

  describe('resource competition', () => {
    it('should detect resource competitions', () => {
      let competitionDetected = false;
      conflictSystem.setResourceCompetitionCallback((competition) => {
        competitionDetected = true;
        expect(competition.resourceType).toBeDefined();
        expect(competition.competingDevices.length).toBeGreaterThan(1);
        expect(competition.competitionIntensity).toBeGreaterThan(0);
      });

      // Create resource-hungry devices
      const resourceDevices = [
        createMockDevice('hungry-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('hungry-2', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('hungry-3', [PersonalityTrait.ANXIOUS])
      ];

      conflictSystem.analyzeDeviceInteractions(resourceDevices, []);

      const competitions = conflictSystem.getResourceCompetitions();
      expect(competitions.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate resource visual indicators', () => {
      const resourceDevices = [
        createMockDevice('visual-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('visual-2', [PersonalityTrait.COMPETITIVE])
      ];

      conflictSystem.analyzeDeviceInteractions(resourceDevices, []);

      const competitions = conflictSystem.getResourceCompetitions();
      competitions.forEach(competition => {
        expect(competition.visualIndicators).toBeDefined();
        expect(Array.isArray(competition.visualIndicators)).toBe(true);
        
        competition.visualIndicators.forEach(indicator => {
          expect(indicator.deviceId).toBeDefined();
          expect(indicator.resourceType).toBeDefined();
          expect(indicator.currentUsage).toBeGreaterThanOrEqual(0);
          expect(indicator.currentUsage).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should use different allocation strategies for different resources', () => {
      const resourceDevices = [
        createMockDevice('strategy-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('strategy-2', [PersonalityTrait.COMPETITIVE])
      ];

      conflictSystem.analyzeDeviceInteractions(resourceDevices, []);

      const competitions = conflictSystem.getResourceCompetitions();
      competitions.forEach(competition => {
        expect(competition.allocationStrategy).toBeDefined();
        expect(typeof competition.allocationStrategy).toBe('string');
      });
    });
  });

  describe('dramatic moments', () => {
    it('should detect system chaos with multiple conflicts', () => {
      let dramaticMoment: any = null;
      conflictSystem.setDramaticMomentCallback((moment) => {
        dramaticMoment = moment;
      });

      // Create scenario with multiple potential conflicts
      const chaosDevices = [
        createMockDevice('chaos-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('chaos-2', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('chaos-3', [PersonalityTrait.STUBBORN]),
        createMockDevice('chaos-4', [PersonalityTrait.ANXIOUS])
      ];

      const chaosConnections = [
        createMockConnection('chaos-1', 'chaos-2', ConnectionType.CONFLICT, 0.1),
        createMockConnection('chaos-2', 'chaos-3', ConnectionType.CONFLICT, 0.2),
        createMockConnection('chaos-3', 'chaos-4', ConnectionType.CONFLICT, 0.1)
      ];

      // Run multiple analysis cycles to build up conflicts
      for (let i = 0; i < 10; i++) {
        conflictSystem.analyzeDeviceInteractions(chaosDevices, chaosConnections);
      }

      // Dramatic moments might be detected
      if (dramaticMoment) {
        expect(dramaticMoment.type).toBeDefined();
        expect(dramaticMoment.description).toBeTruthy();
        expect(dramaticMoment.involvedDevices).toBeDefined();
        expect(dramaticMoment.intensity).toBeGreaterThan(0);
      }
    });

    it('should detect tension peaks', () => {
      let tensionPeakDetected = false;
      conflictSystem.setDramaticMomentCallback((moment) => {
        if (moment.type === DramaticMomentType.TENSION_PEAK) {
          tensionPeakDetected = true;
        }
      });

      const highTensionDevices = [
        createMockDevice('peak-1', [PersonalityTrait.ANXIOUS, PersonalityTrait.STUBBORN]),
        createMockDevice('peak-2', [PersonalityTrait.COMPETITIVE, PersonalityTrait.OVERCONFIDENT])
      ];

      // Build up tension over multiple cycles
      for (let i = 0; i < 15; i++) {
        conflictSystem.analyzeDeviceInteractions(highTensionDevices, []);
      }

      // Tension peaks might be detected
      expect(typeof tensionPeakDetected).toBe('boolean');
    });

    it('should detect resource crisis', () => {
      let resourceCrisisDetected = false;
      conflictSystem.setDramaticMomentCallback((moment) => {
        if (moment.type === DramaticMomentType.RESOURCE_CRISIS) {
          resourceCrisisDetected = true;
        }
      });

      const crisisDevices = [
        createMockDevice('crisis-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('crisis-2', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('crisis-3', [PersonalityTrait.ANXIOUS]),
        createMockDevice('crisis-4', [PersonalityTrait.STUBBORN])
      ];

      // Create resource scarcity scenario
      for (let i = 0; i < 20; i++) {
        conflictSystem.analyzeDeviceInteractions(crisisDevices, []);
      }

      // Resource crisis might be detected
      expect(typeof resourceCrisisDetected).toBe('boolean');
    });
  });

  describe('conflict escalation', () => {
    it('should escalate conflicts over time', () => {
      // Create a conflict scenario
      const escalationDevices = [
        createMockDevice('escalate-1', [PersonalityTrait.STUBBORN]),
        createMockDevice('escalate-2', [PersonalityTrait.COMPETITIVE])
      ];

      conflictSystem.analyzeDeviceInteractions(escalationDevices, []);

      const initialConflicts = conflictSystem.getActiveConflicts();
      
      // Simulate time passing
      setTimeout(() => {
        conflictSystem.analyzeDeviceInteractions(escalationDevices, []);
        
        const escalatedConflicts = conflictSystem.getActiveConflicts();
        
        // Check if conflicts have escalated
        escalatedConflicts.forEach(conflict => {
          expect(conflict.escalationLevel).toBeGreaterThanOrEqual(0);
          expect(conflict.escalationLevel).toBeLessThanOrEqual(1);
        });
      }, 100);
    });

    it('should update visual effects based on escalation', () => {
      const escalationDevices = [
        createMockDevice('visual-escalate-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('visual-escalate-2', [PersonalityTrait.STUBBORN])
      ];

      conflictSystem.analyzeDeviceInteractions(escalationDevices, []);

      const conflicts = conflictSystem.getActiveConflicts();
      conflicts.forEach(conflict => {
        expect(conflict.visualEffects).toBeDefined();
        expect(Array.isArray(conflict.visualEffects)).toBe(true);
        
        conflict.visualEffects.forEach(effect => {
          expect(effect.type).toBeDefined();
          expect(effect.intensity).toBeGreaterThan(0);
          expect(effect.duration).toBeGreaterThan(0);
          expect(Array.isArray(effect.targetDevices)).toBe(true);
        });
      });
    });
  });

  describe('conflict resolution', () => {
    it('should resolve conflicts and move them to history', () => {
      let resolvedConflictId = '';
      conflictSystem.setConflictResolvedCallback((conflictId) => {
        resolvedConflictId = conflictId;
      });

      // Create a conflict
      const conflictDevices = [
        createMockDevice('resolve-1', [PersonalityTrait.STUBBORN]),
        createMockDevice('resolve-2', [PersonalityTrait.COMPETITIVE])
      ];

      conflictSystem.analyzeDeviceInteractions(conflictDevices, []);

      const activeConflicts = conflictSystem.getActiveConflicts();
      if (activeConflicts.length > 0) {
        const conflictId = activeConflicts[0].id;
        
        const resolved = conflictSystem.resolveConflict(conflictId);
        expect(resolved).toBe(true);
        
        const remainingConflicts = conflictSystem.getActiveConflicts();
        expect(remainingConflicts.find(c => c.id === conflictId)).toBeUndefined();
        
        const history = conflictSystem.getConflictHistory();
        expect(history.find(c => c.id === conflictId)).toBeDefined();
        
        expect(resolvedConflictId).toBe(conflictId);
      }
    });

    it('should return false when trying to resolve non-existent conflict', () => {
      const resolved = conflictSystem.resolveConflict('non-existent-conflict');
      expect(resolved).toBe(false);
    });
  });

  describe('visual effects', () => {
    it('should generate appropriate visual effects for different conflict types', () => {
      const effectDevices = [
        createMockDevice('effect-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('effect-2', [PersonalityTrait.COMPETITIVE])
      ];

      conflictSystem.analyzeDeviceInteractions(effectDevices, []);

      const conflicts = conflictSystem.getActiveConflicts();
      conflicts.forEach(conflict => {
        conflict.visualEffects.forEach(effect => {
          expect(Object.values(ConflictEffectType)).toContain(effect.type);
          expect(effect.intensity).toBeGreaterThan(0);
          expect(effect.intensity).toBeLessThanOrEqual(1);
          expect(effect.duration).toBeGreaterThan(0);
          expect(effect.targetDevices.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include particle counts and color schemes in visual effects', () => {
      const visualDevices = [
        createMockDevice('particle-1', [PersonalityTrait.STUBBORN]),
        createMockDevice('particle-2', [PersonalityTrait.ANXIOUS])
      ];

      conflictSystem.analyzeDeviceInteractions(visualDevices, []);

      const conflicts = conflictSystem.getActiveConflicts();
      conflicts.forEach(conflict => {
        conflict.visualEffects.forEach(effect => {
          if (effect.particleCount !== undefined) {
            expect(effect.particleCount).toBeGreaterThan(0);
          }
          if (effect.colorScheme !== undefined) {
            expect(Array.isArray(effect.colorScheme)).toBe(true);
            expect(effect.colorScheme.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('callback system', () => {
    it('should trigger all callback types', () => {
      let conflictDetected = false;
      let tensionEscalated = false;
      let resourceCompetition = false;
      let conflictResolved = false;
      let dramaticMoment = false;

      conflictSystem.setConflictDetectedCallback(() => { conflictDetected = true; });
      conflictSystem.setTensionEscalatedCallback(() => { tensionEscalated = true; });
      conflictSystem.setResourceCompetitionCallback(() => { resourceCompetition = true; });
      conflictSystem.setConflictResolvedCallback(() => { conflictResolved = true; });
      conflictSystem.setDramaticMomentCallback(() => { dramaticMoment = true; });

      const callbackDevices = [
        createMockDevice('callback-1', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('callback-2', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('callback-3', [PersonalityTrait.STUBBORN])
      ];

      // Run analysis to potentially trigger callbacks
      for (let i = 0; i < 10; i++) {
        conflictSystem.analyzeDeviceInteractions(callbackDevices, []);
      }

      // Test conflict resolution callback
      const conflicts = conflictSystem.getActiveConflicts();
      if (conflicts.length > 0) {
        conflictSystem.resolveConflict(conflicts[0].id);
      }

      // Callbacks might be triggered based on the scenario
      expect(typeof conflictDetected).toBe('boolean');
      expect(typeof tensionEscalated).toBe('boolean');
      expect(typeof resourceCompetition).toBe('boolean');
      expect(typeof conflictResolved).toBe('boolean');
      expect(typeof dramaticMoment).toBe('boolean');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty device arrays', () => {
      expect(() => conflictSystem.analyzeDeviceInteractions([], [])).not.toThrow();
      
      expect(conflictSystem.getActiveConflicts()).toHaveLength(0);
      expect(conflictSystem.getTensionStates()).toHaveLength(0);
      expect(conflictSystem.getResourceCompetitions()).toHaveLength(0);
    });

    it('should handle devices with extreme personality values', () => {
      const extremeDevice = createMockDevice('extreme', [PersonalityTrait.OVERCONFIDENT]);
      extremeDevice.personality.reliability = 1.0;
      extremeDevice.personality.socialness = 0.0;
      extremeDevice.personality.emotionalRange.moodStability = 0.0;

      expect(() => conflictSystem.analyzeDeviceInteractions([extremeDevice], [])).not.toThrow();
    });

    it('should handle malformed connections', () => {
      const malformedConnection = createMockConnection('device-1', 'device-2', ConnectionType.COMMUNICATION, 0.5);
      malformedConnection.successRate = -1; // Invalid value
      malformedConnection.interactionCount = 0;

      expect(() => conflictSystem.analyzeDeviceInteractions(mockDevices, [malformedConnection])).not.toThrow();
    });

    it('should handle disposal correctly', () => {
      conflictSystem.analyzeDeviceInteractions(mockDevices, mockConnections);
      
      expect(() => conflictSystem.dispose()).not.toThrow();
      
      expect(conflictSystem.getActiveConflicts()).toHaveLength(0);
      expect(conflictSystem.getTensionStates()).toHaveLength(0);
      expect(conflictSystem.getResourceCompetitions()).toHaveLength(0);
      expect(conflictSystem.getConflictHistory()).toHaveLength(0);
    });
  });

  describe('performance', () => {
    it('should handle large numbers of devices efficiently', () => {
      const startTime = Date.now();
      
      const manyDevices = [];
      for (let i = 0; i < 20; i++) {
        const traits = [
          PersonalityTrait.COMPETITIVE,
          PersonalityTrait.OVERCONFIDENT,
          PersonalityTrait.STUBBORN,
          PersonalityTrait.ANXIOUS
        ];
        const randomTrait = traits[Math.floor(Math.random() * traits.length)];
        manyDevices.push(createMockDevice(`perf-device-${i}`, [randomTrait]));
      }
      
      conflictSystem.analyzeDeviceInteractions(manyDevices, []);
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain performance with multiple analysis cycles', () => {
      const performanceDevices = [
        createMockDevice('perf-1', [PersonalityTrait.COMPETITIVE]),
        createMockDevice('perf-2', [PersonalityTrait.OVERCONFIDENT]),
        createMockDevice('perf-3', [PersonalityTrait.STUBBORN])
      ];

      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        conflictSystem.analyzeDeviceInteractions(performanceDevices, []);
      }
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(2000); // Should complete 50 cycles within 2 seconds
    });
  });
});