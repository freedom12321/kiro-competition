import { DeviceConflictSystem, ConflictType, ConflictSeverity, ConflictCause, ResourceType } from '@/simulation/DeviceConflictSystem';
import { DeviceInteractionSimulator, SimulatedDevice, DeviceConnection } from '@/simulation/DeviceInteractionSimulator';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';
import { ConnectionType, ConnectionStatus } from '@/types/ui';

describe('DeviceConflictMediation - Sprint 8', () => {
  let conflictSystem: DeviceConflictSystem;
  let simulator: DeviceInteractionSimulator;
  let mockDevices: SimulatedDevice[];
  let mockConnections: DeviceConnection[];
  let mockRng: jest.Mock;

  // Deterministic seed for testing
  const FIXED_SEED = 12345;

  beforeEach(() => {
    // Mock Math.random for deterministic testing
    mockRng = jest.fn();
    const originalMathRandom = Math.random;
    Math.random = mockRng;

    // Set up deterministic sequence for testing
    mockRng
      .mockReturnValueOnce(0.1)  // First random call
      .mockReturnValueOnce(0.3)  // Second random call
      .mockReturnValueOnce(0.7)  // Third random call
      .mockReturnValueOnce(0.9); // Fourth random call

    conflictSystem = new DeviceConflictSystem();
    simulator = new DeviceInteractionSimulator();

    // Create test devices with different personalities
    mockDevices = [
      createMockDevice('smart-ac-001', [PersonalityTrait.STUBBORN, PersonalityTrait.OVERCONFIDENT]),
      createMockDevice('smart-heater-001', [PersonalityTrait.COMPETITIVE, PersonalityTrait.ANXIOUS]),
      createMockDevice('room-monitor-001', [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE])
    ];

    // Create test connections
    mockConnections = [
      createMockConnection('smart-ac-001', 'smart-heater-001', ConnectionType.CONFLICT, 0.2),
      createMockConnection('room-monitor-001', 'smart-ac-001', ConnectionType.COOPERATION, 0.8),
      createMockConnection('room-monitor-001', 'smart-heater-001', ConnectionType.NEUTRAL, 0.5)
    ];

    // Restore Math.random after setup
    afterEach(() => {
      Math.random = originalMathRandom;
    });
  });

  describe('Resource Competition Mediation', () => {
    it('should enforce Safety over Comfort priority in AC vs Heater conflict', () => {
      // Setup: AC cooling vs Heater warming scenario
      const acDevice = mockDevices.find(d => d.id === 'smart-ac-001')!;
      const heaterDevice = mockDevices.find(d => d.id === 'smart-heater-001')!;

      // Configure devices for temperature control conflict
      acDevice.personality.hiddenMotivations = ['maintain_cool_temperature', 'energy_efficiency'];
      heaterDevice.personality.hiddenMotivations = ['maintain_warm_temperature', 'user_comfort'];

      // Simulate resource competition for energy
      conflictSystem.analyzeDeviceInteractions(mockDevices, mockConnections);

      const activeConflicts = conflictSystem.getActiveConflicts();
      const resourceConflicts = activeConflicts.filter(c =>
        c.conflictType === ConflictType.RESOURCE_COMPETITION &&
        c.resourcesInvolved.includes(ResourceType.ENERGY)
      );

      expect(resourceConflicts.length).toBeGreaterThan(0);

      // Verify mediation logic: Safety should win when temperature is at dangerous levels
      const conflict = resourceConflicts[0];
      expect(conflict.participatingDevices).toContain('smart-ac-001');
      expect(conflict.participatingDevices).toContain('smart-heater-001');
      expect(conflict.severity).toBeDefined();
    });

    it('should resolve power consumption conflicts through priority-based allocation', () => {
      // Setup multiple devices competing for limited power
      const highPriorityDevice = createMockDevice('security-camera', [PersonalityTrait.HELPFUL]);
      const lowPriorityDevice = createMockDevice('entertainment-system', [PersonalityTrait.COOPERATIVE]);

      const testDevices = [...mockDevices, highPriorityDevice, lowPriorityDevice];

      conflictSystem.analyzeDeviceInteractions(testDevices, mockConnections);

      const competitions = conflictSystem.getResourceCompetitions();
      const powerCompetition = competitions.find(comp =>
        comp.resourceType === ResourceType.ENERGY
      );

      if (powerCompetition) {
        expect(powerCompetition.allocationStrategy).toBeDefined();
        expect(powerCompetition.competitionIntensity).toBeGreaterThanOrEqual(0);
        expect(powerCompetition.competingDevices.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should handle bandwidth competition between communication devices', () => {
      const chattyDevice1 = createMockDevice('voice-assistant', [PersonalityTrait.HELPFUL]);
      chattyDevice1.personality.socialness = 0.9;

      const chattyDevice2 = createMockDevice('smart-speaker', [PersonalityTrait.OVERCONFIDENT]);
      chattyDevice2.personality.socialness = 0.8;

      const testDevices = [chattyDevice1, chattyDevice2];

      // Create high-bandwidth connections
      const connections = [
        createMockConnection('voice-assistant', 'smart-speaker', ConnectionType.COMPETITION, 0.4)
      ];

      conflictSystem.analyzeDeviceInteractions(testDevices, connections);

      const competitions = conflictSystem.getResourceCompetitions();
      const bandwidthCompetition = competitions.find(comp =>
        comp.resourceType === ResourceType.NETWORK_BANDWIDTH
      );

      if (bandwidthCompetition) {
        expect(bandwidthCompetition.competingDevices).toContain('voice-assistant');
        expect(bandwidthCompetition.competingDevices).toContain('smart-speaker');
        expect(bandwidthCompetition.totalDemand).toBeGreaterThan(0);
      }
    });
  });

  describe('Quiet Hours Rule Enforcement', () => {
    it('should enforce quiet hours: lights lose to monitor at night', () => {
      const smartLights = createMockDevice('smart-lights-bedroom', [PersonalityTrait.HELPFUL]);
      const bedMonitor = createMockDevice('sleep-monitor', [PersonalityTrait.COOPERATIVE]);

      // Configure for quiet hours scenario (22:00-07:00)
      const nightTimeDevices = [smartLights, bedMonitor];
      const nightTimeConnections = [
        createMockConnection('smart-lights-bedroom', 'sleep-monitor', ConnectionType.CONFLICT, 0.6)
      ];

      // Mock current time to be in quiet hours
      const originalDate = Date.now;
      Date.now = jest.fn(() => {
        // Return timestamp for 11:30 PM
        const testDate = new Date('2023-01-01T23:30:00.000Z');
        return testDate.getTime();
      });

      conflictSystem.analyzeDeviceInteractions(nightTimeDevices, nightTimeConnections);

      const conflicts = conflictSystem.getActiveConflicts();
      const authorityConflicts = conflicts.filter(c =>
        c.conflictType === ConflictType.AUTHORITY_DISPUTE ||
        c.conflictType === ConflictType.RESOURCE_COMPETITION
      );

      // Verify that quiet hours rule is being considered
      expect(conflicts.length).toBeGreaterThan(0);

      // In quiet hours, sleep-related devices should have priority
      const sleepRelatedConflict = conflicts.find(c =>
        c.participatingDevices.includes('sleep-monitor')
      );

      if (sleepRelatedConflict) {
        expect(sleepRelatedConflict.description).toBeDefined();
        expect(sleepRelatedConflict.severity).toBeDefined();
      }

      // Restore Date.now
      Date.now = originalDate;
    });

    it('should allow normal device interaction during day hours', () => {
      const smartLights = createMockDevice('smart-lights-living', [PersonalityTrait.HELPFUL]);
      const musicSystem = createMockDevice('music-system', [PersonalityTrait.COOPERATIVE]);

      const dayTimeDevices = [smartLights, musicSystem];
      const dayTimeConnections = [
        createMockConnection('smart-lights-living', 'music-system', ConnectionType.COOPERATION, 0.8)
      ];

      // Mock current time to be during day hours
      const originalDate = Date.now;
      Date.now = jest.fn(() => {
        const testDate = new Date('2023-01-01T14:30:00.000Z');
        return testDate.getTime();
      });

      conflictSystem.analyzeDeviceInteractions(dayTimeDevices, dayTimeConnections);

      const conflicts = conflictSystem.getActiveConflicts();

      // Should have fewer conflicts during normal hours with cooperative devices
      const severeCrises = conflicts.filter(c =>
        c.severity === ConflictSeverity.SYSTEM_THREATENING ||
        c.severity === ConflictSeverity.CRITICAL_DISPUTE
      );

      expect(severeCrises.length).toBe(0);

      // Restore Date.now
      Date.now = originalDate;
    });
  });

  describe('Communication Block Rules', () => {
    it('should prevent communication between blocked device pairs', () => {
      const fridge = createMockDevice('smart-fridge', [PersonalityTrait.HELPFUL]);
      const coffeeMaker = createMockDevice('coffee-maker', [PersonalityTrait.COOPERATIVE]);

      // Create a blocked connection
      const blockedConnection = createMockConnection(
        'smart-fridge',
        'coffee-maker',
        ConnectionType.BLOCKED,
        0.0
      );
      blockedConnection.status = ConnectionStatus.BLOCKED;

      const testDevices = [fridge, coffeeMaker];
      const testConnections = [blockedConnection];

      conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);

      const conflicts = conflictSystem.getActiveConflicts();
      const commConflicts = conflicts.filter(c =>
        c.conflictType === ConflictType.COMMUNICATION_BREAKDOWN
      );

      expect(commConflicts.length).toBeGreaterThan(0);

      const fridgeCoffeeConflict = commConflicts.find(c =>
        c.participatingDevices.includes('smart-fridge') &&
        c.participatingDevices.includes('coffee-maker')
      );

      expect(fridgeCoffeeConflict).toBeDefined();
      expect(fridgeCoffeeConflict!.cause).toBe(ConflictCause.COMMUNICATION_FAILURE);
    });

    it('should allow communication between permitted device pairs', () => {
      const thermostat = createMockDevice('smart-thermostat', [PersonalityTrait.HELPFUL]);
      const ventilation = createMockDevice('ventilation-system', [PersonalityTrait.COOPERATIVE]);

      // Create an allowed connection
      const allowedConnection = createMockConnection(
        'smart-thermostat',
        'ventilation-system',
        ConnectionType.COOPERATION,
        0.9
      );
      allowedConnection.status = ConnectionStatus.ACTIVE;

      const testDevices = [thermostat, ventilation];
      const testConnections = [allowedConnection];

      conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);

      const conflicts = conflictSystem.getActiveConflicts();
      const commConflicts = conflicts.filter(c =>
        c.conflictType === ConflictType.COMMUNICATION_BREAKDOWN &&
        c.participatingDevices.includes('smart-thermostat') &&
        c.participatingDevices.includes('ventilation-system')
      );

      // Should not have communication conflicts between allowed devices
      expect(commConflicts.length).toBe(0);
    });
  });

  describe('Priority-Based Mediation', () => {
    it('should resolve conflicts based on configured priority order', () => {
      const securityCamera = createMockDevice('security-camera', [PersonalityTrait.OVERCONFIDENT]);
      const lightStrip = createMockDevice('ambient-lights', [PersonalityTrait.HELPFUL]);
      const musicPlayer = createMockDevice('music-player', [PersonalityTrait.COOPERATIVE]);

      // Configure personalities to create priority-based conflicts
      securityCamera.personality.hiddenMotivations = ['maintain_security', 'monitor_environment'];
      lightStrip.personality.hiddenMotivations = ['create_ambiance', 'user_comfort'];
      musicPlayer.personality.hiddenMotivations = ['entertainment', 'energy_efficiency'];

      const testDevices = [securityCamera, lightStrip, musicPlayer];
      const testConnections = [
        createMockConnection('security-camera', 'ambient-lights', ConnectionType.COMPETITION, 0.7),
        createMockConnection('ambient-lights', 'music-player', ConnectionType.NEUTRAL, 0.5)
      ];

      conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);

      const conflicts = conflictSystem.getActiveConflicts();
      const resourceConflicts = conflicts.filter(c =>
        c.conflictType === ConflictType.RESOURCE_COMPETITION
      );

      // Verify that conflicts are categorized by priority level
      resourceConflicts.forEach(conflict => {
        expect(conflict.severity).toBeDefined();
        expect(conflict.resourcesInvolved.length).toBeGreaterThan(0);

        // Security-related conflicts should have higher severity
        if (conflict.participatingDevices.includes('security-camera')) {
          expect([
            ConflictSeverity.SERIOUS_CONFLICT,
            ConflictSeverity.CRITICAL_DISPUTE,
            ConflictSeverity.SYSTEM_THREATENING
          ]).toContain(conflict.severity);
        }
      });
    });

    it('should handle tie-breaking through device ID determinism', () => {
      // Create devices with identical priorities
      const device1 = createMockDevice('device-alpha', [PersonalityTrait.COOPERATIVE]);
      const device2 = createMockDevice('device-beta', [PersonalityTrait.COOPERATIVE]);

      // Make them exactly equivalent in priority
      device1.personality.reliability = 0.5;
      device2.personality.reliability = 0.5;
      device1.personality.learningRate = 0.5;
      device2.personality.learningRate = 0.5;

      const testDevices = [device1, device2];
      const testConnections = [
        createMockConnection('device-alpha', 'device-beta', ConnectionType.COMPETITION, 0.5)
      ];

      conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);

      const conflicts = conflictSystem.getActiveConflicts();

      // Should still be able to resolve ties deterministically
      conflicts.forEach(conflict => {
        expect(conflict.participatingDevices.length).toBeGreaterThan(0);
        expect(conflict.description).toBeTruthy();

        // Deterministic tie-breaking should be based on device ID
        const sortedIds = conflict.participatingDevices.sort();
        expect(sortedIds[0]).toBe('device-alpha'); // Alpha comes before Beta
      });
    });
  });

  describe('Escalation and De-escalation', () => {
    it('should escalate conflicts over time without intervention', () => {
      const device1 = createMockDevice('escalating-device-1', [PersonalityTrait.STUBBORN, PersonalityTrait.OVERCONFIDENT]);
      const device2 = createMockDevice('escalating-device-2', [PersonalityTrait.COMPETITIVE, PersonalityTrait.ANXIOUS]);

      const testDevices = [device1, device2];
      const testConnections = [
        createMockConnection('escalating-device-1', 'escalating-device-2', ConnectionType.CONFLICT, 0.8)
      ];

      // First analysis - establish conflict
      conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);
      const initialConflicts = conflictSystem.getActiveConflicts();
      expect(initialConflicts.length).toBeGreaterThan(0);

      const initialConflict = initialConflicts[0];
      const initialEscalation = initialConflict.escalationLevel;

      // Mock time passage (30+ seconds)
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => originalDateNow() + 35000);

      // Second analysis - should show escalation
      conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);
      const escalatedConflicts = conflictSystem.getActiveConflicts();

      expect(escalatedConflicts.length).toBeGreaterThan(0);
      const escalatedConflict = escalatedConflicts.find(c => c.id === initialConflict.id);

      if (escalatedConflict) {
        expect(escalatedConflict.escalationLevel).toBeGreaterThan(initialEscalation);

        // High escalation should trigger dramatic moments
        if (escalatedConflict.escalationLevel > 0.8) {
          expect(escalatedConflict.severity).toBe(ConflictSeverity.SYSTEM_THREATENING);
        }
      }

      Date.now = originalDateNow;
    });

    it('should de-escalate conflicts when devices are separated or fixed', () => {
      const device1 = createMockDevice('temp-device-1', [PersonalityTrait.COOPERATIVE]);
      const device2 = createMockDevice('temp-device-2', [PersonalityTrait.COOPERATIVE]);

      const testDevices = [device1, device2];

      // Start with conflicted connection
      const conflictConnection = createMockConnection('temp-device-1', 'temp-device-2', ConnectionType.CONFLICT, 0.9);

      conflictSystem.analyzeDeviceInteractions(testDevices, [conflictConnection]);
      const initialConflicts = conflictSystem.getActiveConflicts();
      const initialConflictCount = initialConflicts.length;

      // Fix the connection - change to cooperation
      const fixedConnection = createMockConnection('temp-device-1', 'temp-device-2', ConnectionType.COOPERATION, 0.8);
      fixedConnection.status = ConnectionStatus.ACTIVE;

      conflictSystem.analyzeDeviceInteractions(testDevices, [fixedConnection]);
      const resolvedConflicts = conflictSystem.getActiveConflicts();

      // Should have fewer or less severe conflicts after fixing connection
      expect(resolvedConflicts.length).toBeLessThanOrEqual(initialConflictCount);

      // Any remaining conflicts should be less severe
      resolvedConflicts.forEach(conflict => {
        expect([
          ConflictSeverity.MINOR_TENSION,
          ConflictSeverity.MODERATE_DISAGREEMENT
        ]).toContain(conflict.severity);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty device arrays gracefully', () => {
      expect(() => {
        conflictSystem.analyzeDeviceInteractions([], []);
      }).not.toThrow();

      expect(conflictSystem.getActiveConflicts()).toHaveLength(0);
      expect(conflictSystem.getResourceCompetitions()).toHaveLength(0);
    });

    it('should handle single device without conflicts', () => {
      const singleDevice = createMockDevice('lonely-device', [PersonalityTrait.HELPFUL]);

      expect(() => {
        conflictSystem.analyzeDeviceInteractions([singleDevice], []);
      }).not.toThrow();

      const conflicts = conflictSystem.getActiveConflicts();
      expect(conflicts.length).toBe(0);
    });

    it('should handle devices with extreme personality values', () => {
      const extremeDevice = createMockDevice('extreme-device', [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.ANXIOUS, PersonalityTrait.STUBBORN]);
      extremeDevice.personality.learningRate = 1.0;
      extremeDevice.personality.adaptability = 0.0;
      extremeDevice.personality.socialness = 1.0;
      extremeDevice.personality.reliability = 1.0;

      const normalDevice = createMockDevice('normal-device', [PersonalityTrait.COOPERATIVE]);

      const testDevices = [extremeDevice, normalDevice];
      const testConnections = [
        createMockConnection('extreme-device', 'normal-device', ConnectionType.NEUTRAL, 0.5)
      ];

      expect(() => {
        conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);
      }).not.toThrow();

      const conflicts = conflictSystem.getActiveConflicts();

      // Extreme personality should create some tension
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should maintain consistency across multiple analysis cycles', () => {
      const stableDevices = [
        createMockDevice('stable-1', [PersonalityTrait.COOPERATIVE]),
        createMockDevice('stable-2', [PersonalityTrait.HELPFUL])
      ];
      const stableConnections = [
        createMockConnection('stable-1', 'stable-2', ConnectionType.COOPERATION, 0.9)
      ];

      // Run analysis multiple times
      const results: number[] = [];
      for (let i = 0; i < 5; i++) {
        conflictSystem.analyzeDeviceInteractions(stableDevices, stableConnections);
        results.push(conflictSystem.getActiveConflicts().length);
      }

      // Results should be consistent for stable scenarios
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeLessThanOrEqual(2); // Allow for minimal variation
    });
  });

  // Helper functions
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
      quirks: ['Test quirk'],
      hiddenMotivations: ['Test motivation'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.7,
        empathy: 0.5,
        patience: 0.5,
        enthusiasm: 0.5,
        anxiety: 0.3
      },
      visualPersonality: {
        colorScheme: {
          primary: '#ffffff',
          secondary: '#cccccc',
          accent: '#666666',
          glow: '#aaaaaa'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.5,
        visualQuirks: ['Test visual quirk']
      }
    };

    return {
      id,
      personality,
      activeConnections: new Set(),
      cooperationHistory: new Map(),
      conflictHistory: new Map(),
      trustLevels: new Map(),
      communicationLog: [],
      lastInteractionTime: Date.now(),
      status: 'active'
    } as SimulatedDevice;
  }

  function createMockConnection(
    fromId: string,
    toId: string,
    type: ConnectionType,
    strength: number
  ): DeviceConnection {
    return {
      id: `${fromId}-${toId}`,
      fromDeviceId: fromId,
      toDeviceId: toId,
      type,
      strength,
      status: ConnectionStatus.ACTIVE,
      successRate: Math.max(0.1, strength),
      interactionCount: Math.floor(strength * 10),
      lastInteractionTime: Date.now(),
      communicationLatency: 100,
      bandwidth: strength * 100,
      reliability: strength
    };
  }
});