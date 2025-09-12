import { DeviceInteractionSimulator } from '@/simulation/DeviceInteractionSimulator';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { DeviceVisual, PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';

describe('DeviceInteractionSimulator Integration Tests', () => {
  let simulator: DeviceInteractionSimulator;

  beforeEach(() => {
    simulator = new DeviceInteractionSimulator();
  });

  afterEach(() => {
    simulator.dispose();
  });

  describe('basic functionality', () => {
    it('should create simulator and add devices', () => {
      const personality: AIPersonality = {
        primaryTraits: [PersonalityTrait.HELPFUL],
        secondaryTraits: ['test-trait'],
        communicationStyle: CommunicationStyle.FRIENDLY,
        conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
        learningRate: 0.7,
        adaptability: 0.8,
        socialness: 0.6,
        reliability: 0.9,
        quirks: ['test quirk'],
        hiddenMotivations: ['test motivation'],
        emotionalRange: {
          defaultMood: FacialExpression.HAPPY,
          moodStability: 0.7,
          empathy: 0.8,
          patience: 0.6,
          enthusiasm: 0.7,
          anxiety: 0.3
        },
        visualPersonality: {
          colorScheme: {
            primary: '#10b981',
            secondary: '#ecfdf5',
            accent: '#059669',
            glow: '#6ee7b7'
          },
          animationStyle: AnimationStyle.SMOOTH,
          expressiveness: 0.8,
          visualQuirks: ['test visual quirk']
        }
      };

      const deviceVisual: DeviceVisual = {
        id: 'test-device',
        model3D: {} as any,
        position: { x: 0, y: 0, z: 0 },
        animations: {} as any,
        personalityIndicators: [],
        connectionEffects: []
      };

      simulator.addDevice('test-device', deviceVisual, personality);
      
      const devices = simulator.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe('test-device');
    });

    it('should start and stop simulation without errors', () => {
      expect(() => simulator.startSimulation()).not.toThrow();
      expect(() => simulator.stopSimulation()).not.toThrow();
    });

    it('should handle device removal', () => {
      const personality: AIPersonality = {
        primaryTraits: [PersonalityTrait.HELPFUL],
        secondaryTraits: [],
        communicationStyle: CommunicationStyle.FRIENDLY,
        conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
        learningRate: 0.5,
        adaptability: 0.5,
        socialness: 0.5,
        reliability: 0.5,
        quirks: [],
        hiddenMotivations: [],
        emotionalRange: {
          defaultMood: FacialExpression.NEUTRAL,
          moodStability: 0.5,
          empathy: 0.5,
          patience: 0.5,
          enthusiasm: 0.5,
          anxiety: 0.5
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

      const deviceVisual: DeviceVisual = {
        id: 'removable-device',
        model3D: {} as any,
        position: { x: 0, y: 0, z: 0 },
        animations: {} as any,
        personalityIndicators: [],
        connectionEffects: []
      };

      simulator.addDevice('removable-device', deviceVisual, personality);
      expect(simulator.getDevices()).toHaveLength(1);
      
      simulator.removeDevice('removable-device');
      expect(simulator.getDevices()).toHaveLength(0);
    });
  });

  describe('performance validation', () => {
    it('should handle multiple devices efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 3; i++) {
        const personality: AIPersonality = {
          primaryTraits: [PersonalityTrait.COOPERATIVE],
          secondaryTraits: [],
          communicationStyle: CommunicationStyle.FRIENDLY,
          conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
          learningRate: 0.5,
          adaptability: 0.5,
          socialness: 0.8,
          reliability: 0.5,
          quirks: [],
          hiddenMotivations: [],
          emotionalRange: {
            defaultMood: FacialExpression.HAPPY,
            moodStability: 0.5,
            empathy: 0.5,
            patience: 0.5,
            enthusiasm: 0.5,
            anxiety: 0.5
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

        const deviceVisual: DeviceVisual = {
          id: `perf-device-${i}`,
          model3D: {} as any,
          position: { x: i * 2, y: 0, z: 0 },
          animations: {} as any,
          personalityIndicators: [],
          connectionEffects: []
        };

        simulator.addDevice(`perf-device-${i}`, deviceVisual, personality);
      }
      
      const setupTime = Date.now() - startTime;
      expect(setupTime).toBeLessThan(1000); // Should setup quickly
      
      expect(simulator.getDevices()).toHaveLength(3);
    });
  });
});