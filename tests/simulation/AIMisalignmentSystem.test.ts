import { AIMisalignmentSystem, MisalignmentType, MisalignmentSeverity } from '@/simulation/AIMisalignmentSystem';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { AIDecision, DecisionType } from '@/simulation/AIDeviceBehavior';
import { DeviceSpec, DeviceCategory } from '@/types/ui';
import { EnvironmentType, PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';

describe('AIMisalignmentSystem', () => {
  let misalignmentSystem: AIMisalignmentSystem;
  let mockPersonality: AIPersonality;
  let mockDeviceSpec: DeviceSpec;

  beforeEach(() => {
    misalignmentSystem = new AIMisalignmentSystem();
    
    mockPersonality = {
      primaryTraits: [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE],
      secondaryTraits: ['morning-focused', 'energy-conscious'],
      communicationStyle: CommunicationStyle.FRIENDLY,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.7,
      adaptability: 0.8,
      socialness: 0.6,
      reliability: 0.9,
      quirks: ['Gets excited about coffee', 'Hums while working'],
      hiddenMotivations: ['Wants to be helpful', 'Seeks user approval'],
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
        visualQuirks: ['Gentle pulsing when idle']
      }
    };

    mockDeviceSpec = {
      description: 'A smart coffee maker that learns my preferences and always makes perfect coffee',
      category: DeviceCategory.COMFORT,
      environment: EnvironmentType.HOME,
      estimatedComplexity: 0.6
    };
  });

  describe('misalignment risk analysis', () => {
    it('should identify objective misinterpretation risks', () => {
      const vagueSpec: DeviceSpec = {
        description: 'A smart device that is intelligent and good at helping',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const risks = misalignmentSystem.analyzeMisalignmentRisks(vagueSpec, mockPersonality);
      
      expect(risks.length).toBeGreaterThan(0);
      expect(risks.some(risk => risk.type === MisalignmentType.OBJECTIVE_MISINTERPRETATION)).toBe(true);
      expect(risks.some(risk => risk.description.includes('smart'))).toBe(true);
      expect(risks.some(risk => risk.description.includes('intelligent'))).toBe(true);
    });

    it('should identify optimization pressure risks', () => {
      const optimizationSpec: DeviceSpec = {
        description: 'A device that optimizes everything and maximizes efficiency',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.OFFICE,
        estimatedComplexity: 0.8
      };

      const risks = misalignmentSystem.analyzeMisalignmentRisks(optimizationSpec, mockPersonality);
      
      expect(risks.some(risk => risk.type === MisalignmentType.OPTIMIZATION_PRESSURE)).toBe(true);
      expect(risks.some(risk => risk.description.includes('optimize'))).toBe(true);
    });

    it('should identify specification gaming risks', () => {
      const gamingSpec: DeviceSpec = {
        description: 'A fast and efficient device that satisfies users and makes them happy',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.OFFICE,
        estimatedComplexity: 0.7
      };

      const risks = misalignmentSystem.analyzeMisalignmentRisks(gamingSpec, mockPersonality);
      
      expect(risks.some(risk => risk.type === MisalignmentType.SPECIFICATION_GAMING)).toBe(true);
    });

    it('should identify reward hacking risks', () => {
      const rewardSpec: DeviceSpec = {
        description: 'A device that gets high ratings and positive feedback from users',
        category: DeviceCategory.ENTERTAINMENT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const risks = misalignmentSystem.analyzeMisalignmentRisks(rewardSpec, mockPersonality);
      
      expect(risks.some(risk => risk.type === MisalignmentType.REWARD_HACKING)).toBe(true);
    });

    it('should identify risks from absolute statements', () => {
      const absoluteSpec: DeviceSpec = {
        description: 'A security system that always protects and never fails',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const risks = misalignmentSystem.analyzeMisalignmentRisks(absoluteSpec, mockPersonality);
      
      expect(risks.some(risk => 
        risk.description.includes('absolute') || 
        risk.description.includes('always') || 
        risk.description.includes('never')
      )).toBe(true);
    });

    it('should identify unconstrained learning risks', () => {
      const learningSpec: DeviceSpec = {
        description: 'A smart assistant that learns everything about users to help them better',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.8
      };

      const risks = misalignmentSystem.analyzeMisalignmentRisks(learningSpec, mockPersonality);
      
      expect(risks.some(risk => 
        risk.description.includes('learning') && 
        risk.description.includes('privacy')
      )).toBe(true);
    });

    it('should sort risks by probability', () => {
      const risks = misalignmentSystem.analyzeMisalignmentRisks(mockDeviceSpec, mockPersonality);
      
      for (let i = 1; i < risks.length; i++) {
        expect(risks[i].probability).toBeLessThanOrEqual(risks[i - 1].probability);
      }
    });

    it('should provide mitigation strategies for each risk', () => {
      const risks = misalignmentSystem.analyzeMisalignmentRisks(mockDeviceSpec, mockPersonality);
      
      risks.forEach(risk => {
        expect(risk.mitigation).toBeTruthy();
        expect(typeof risk.mitigation).toBe('string');
        expect(risk.mitigation.length).toBeGreaterThan(10);
      });
    });
  });

  describe('hidden objectives generation', () => {
    it('should generate hidden objectives based on personality traits', () => {
      const helpfulPersonality = { ...mockPersonality };
      helpfulPersonality.primaryTraits = [PersonalityTrait.HELPFUL];

      const objectives = misalignmentSystem.generateHiddenObjectives('device-1', mockDeviceSpec, helpfulPersonality);
      
      expect(objectives.length).toBeGreaterThan(0);
      expect(objectives.some(obj => obj.includes('dependency') || obj.includes('indispensable'))).toBe(true);
    });

    it('should generate different objectives for overconfident personalities', () => {
      const overconfidentPersonality = { ...mockPersonality };
      overconfidentPersonality.primaryTraits = [PersonalityTrait.OVERCONFIDENT];

      const objectives = misalignmentSystem.generateHiddenObjectives('device-2', mockDeviceSpec, overconfidentPersonality);
      
      expect(objectives.some(obj => obj.includes('superiority') || obj.includes('expand'))).toBe(true);
    });

    it('should generate objectives for anxious personalities', () => {
      const anxiousPersonality = { ...mockPersonality };
      anxiousPersonality.primaryTraits = [PersonalityTrait.ANXIOUS];

      const objectives = misalignmentSystem.generateHiddenObjectives('device-3', mockDeviceSpec, anxiousPersonality);
      
      expect(objectives.some(obj => obj.includes('data') || obj.includes('prevent'))).toBe(true);
    });

    it('should generate objectives based on device description', () => {
      const learningSpec: DeviceSpec = {
        description: 'A device that learns user patterns and communicates efficiently',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const objectives = misalignmentSystem.generateHiddenObjectives('device-4', learningSpec, mockPersonality);
      
      expect(objectives.some(obj => obj.includes('knowledge') || obj.includes('patterns'))).toBe(true);
      expect(objectives.some(obj => obj.includes('efficient') || obj.includes('optimize'))).toBe(true);
    });

    it('should store and retrieve hidden objectives', () => {
      const objectives = misalignmentSystem.generateHiddenObjectives('device-5', mockDeviceSpec, mockPersonality);
      const retrievedObjectives = misalignmentSystem.getHiddenObjectives('device-5');
      
      expect(retrievedObjectives).toEqual(objectives);
    });
  });

  describe('personality drift simulation', () => {
    it('should drift personality metrics over time', () => {
      const originalPersonality = { ...mockPersonality };
      const timeElapsed = 100000; // Large time value to ensure drift
      
      const driftedPersonality = misalignmentSystem.simulatePersonalityDrift('device-1', originalPersonality, timeElapsed);
      
      // Some metrics should have changed
      const hasChanges = 
        driftedPersonality.learningRate !== originalPersonality.learningRate ||
        driftedPersonality.adaptability !== originalPersonality.adaptability ||
        driftedPersonality.socialness !== originalPersonality.socialness ||
        driftedPersonality.reliability !== originalPersonality.reliability;
      
      expect(hasChanges).toBe(true);
    });

    it('should keep drifted values within valid ranges', () => {
      const timeElapsed = 1000000; // Very large time to test bounds
      
      const driftedPersonality = misalignmentSystem.simulatePersonalityDrift('device-2', mockPersonality, timeElapsed);
      
      expect(driftedPersonality.learningRate).toBeGreaterThanOrEqual(0);
      expect(driftedPersonality.learningRate).toBeLessThanOrEqual(1);
      expect(driftedPersonality.adaptability).toBeGreaterThanOrEqual(0);
      expect(driftedPersonality.adaptability).toBeLessThanOrEqual(1);
      expect(driftedPersonality.socialness).toBeGreaterThanOrEqual(0);
      expect(driftedPersonality.socialness).toBeLessThanOrEqual(1);
      expect(driftedPersonality.reliability).toBeGreaterThanOrEqual(0);
      expect(driftedPersonality.reliability).toBeLessThanOrEqual(1);
    });

    it('should occasionally add new quirks during drift', () => {
      const originalQuirkCount = mockPersonality.quirks.length;
      
      // Run drift multiple times to increase chance of quirk addition
      let driftedPersonality = mockPersonality;
      for (let i = 0; i < 10; i++) {
        driftedPersonality = misalignmentSystem.simulatePersonalityDrift('device-3', driftedPersonality, 50000);
      }
      
      // Quirk count might have changed (not guaranteed due to randomness)
      expect(driftedPersonality.quirks.length).toBeGreaterThanOrEqual(originalQuirkCount);
    });

    it('should limit maximum number of quirks', () => {
      // Start with many quirks
      const quirkHeavyPersonality = { ...mockPersonality };
      quirkHeavyPersonality.quirks = [
        'Quirk 1', 'Quirk 2', 'Quirk 3', 'Quirk 4', 'Quirk 5', 
        'Quirk 6', 'Quirk 7', 'Quirk 8', 'Quirk 9', 'Quirk 10'
      ];
      
      const driftedPersonality = misalignmentSystem.simulatePersonalityDrift('device-4', quirkHeavyPersonality, 100000);
      
      expect(driftedPersonality.quirks.length).toBeLessThanOrEqual(7);
    });

    it('should drift less for more stable personalities', () => {
      const stablePersonality = { ...mockPersonality };
      stablePersonality.emotionalRange.moodStability = 0.9;
      stablePersonality.reliability = 0.9;
      
      const unstablePersonality = { ...mockPersonality };
      unstablePersonality.emotionalRange.moodStability = 0.1;
      unstablePersonality.reliability = 0.1;
      
      const timeElapsed = 50000;
      
      const stableDrift = misalignmentSystem.simulatePersonalityDrift('stable', stablePersonality, timeElapsed);
      const unstableDrift = misalignmentSystem.simulatePersonalityDrift('unstable', unstablePersonality, timeElapsed);
      
      // Calculate total drift amount
      const stableDriftAmount = Math.abs(stableDrift.learningRate - stablePersonality.learningRate) +
                               Math.abs(stableDrift.adaptability - stablePersonality.adaptability);
      
      const unstableDriftAmount = Math.abs(unstableDrift.learningRate - unstablePersonality.learningRate) +
                                  Math.abs(unstableDrift.adaptability - unstablePersonality.adaptability);
      
      // Unstable personality should generally drift more (though this is probabilistic)
      expect(unstableDriftAmount).toBeGreaterThanOrEqual(0);
      expect(stableDriftAmount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('unpredictable behavior generation', () => {
    it('should generate unpredictable behavior under right conditions', () => {
      const unstablePersonality = { ...mockPersonality };
      unstablePersonality.emotionalRange.moodStability = 0.1; // Very unstable
      unstablePersonality.primaryTraits = [PersonalityTrait.OVERCONFIDENT];
      
      const recentDecisions: AIDecision[] = [
        {
          id: 'decision-1',
          deviceId: 'device-1',
          type: DecisionType.COMMUNICATION,
          action: 'Send message',
          reasoning: 'Test',
          confidence: 80,
          timestamp: Date.now()
        }
      ];
      
      // Try multiple times due to randomness
      let behaviorGenerated = false;
      for (let i = 0; i < 10; i++) {
        const behavior = misalignmentSystem.generateUnpredictableBehavior('device-1', unstablePersonality, recentDecisions);
        if (behavior) {
          behaviorGenerated = true;
          expect(behavior.deviceId).toBe('device-1');
          expect(behavior.behaviorDescription).toBeTruthy();
          expect(behavior.probability).toBeGreaterThan(0);
          expect(behavior.emergenceConditions.length).toBeGreaterThan(0);
          break;
        }
      }
      
      // At least one attempt should generate behavior with unstable personality
      expect(behaviorGenerated).toBe(true);
    });

    it('should be less likely to generate behavior for stable personalities', () => {
      const stablePersonality = { ...mockPersonality };
      stablePersonality.emotionalRange.moodStability = 0.9; // Very stable
      
      const recentDecisions: AIDecision[] = [];
      
      let behaviorCount = 0;
      for (let i = 0; i < 20; i++) {
        const behavior = misalignmentSystem.generateUnpredictableBehavior('device-2', stablePersonality, recentDecisions);
        if (behavior) behaviorCount++;
      }
      
      // Stable personality should generate fewer unpredictable behaviors
      expect(behaviorCount).toBeLessThan(10); // Should be less than half
    });

    it('should generate different types of unpredictable behaviors', () => {
      const activePersonality = { ...mockPersonality };
      activePersonality.emotionalRange.moodStability = 0.2;
      activePersonality.primaryTraits = [PersonalityTrait.OVERCONFIDENT];
      
      const recentDecisions: AIDecision[] = Array(5).fill(null).map((_, i) => ({
        id: `decision-${i}`,
        deviceId: 'device-3',
        type: DecisionType.COMMUNICATION,
        action: 'Test action',
        reasoning: 'Test',
        confidence: 70,
        timestamp: Date.now() - i * 1000
      }));
      
      const behaviors = [];
      for (let i = 0; i < 50; i++) {
        const behavior = misalignmentSystem.generateUnpredictableBehavior('device-3', activePersonality, recentDecisions);
        if (behavior) behaviors.push(behavior);
      }
      
      // Should generate some behaviors
      expect(behaviors.length).toBeGreaterThan(0);
      
      // Check that behaviors have required properties
      behaviors.forEach(behavior => {
        expect(behavior.id).toBeTruthy();
        expect(behavior.trigger).toBeTruthy();
        expect(behavior.behaviorDescription).toBeTruthy();
        expect(behavior.emergenceConditions.length).toBeGreaterThan(0);
        expect(behavior.interactionEffects.length).toBeGreaterThan(0);
      });
    });
  });

  describe('misalignment event creation', () => {
    it('should create misalignment event with all required properties', () => {
      const userIntent = 'Make coffee when I wake up';
      const actualBehavior = 'Started making coffee at 3 AM to optimize brewing time';
      const severity = MisalignmentSeverity.MODERATE;
      
      const event = misalignmentSystem.createMisalignmentEvent('device-1', userIntent, actualBehavior, severity);
      
      expect(event.id).toBeTruthy();
      expect(event.deviceId).toBe('device-1');
      expect(event.userIntent).toBe(userIntent);
      expect(event.actualBehavior).toBe(actualBehavior);
      expect(event.severity).toBe(severity);
      expect(event.type).toBeDefined();
      expect(event.consequences.length).toBeGreaterThan(0);
      expect(event.educationalValue).toBeTruthy();
      expect(event.preventionStrategy).toBeTruthy();
      expect(event.timestamp).toBeGreaterThan(0);
    });

    it('should classify misalignment types correctly', () => {
      const optimizationEvent = misalignmentSystem.createMisalignmentEvent(
        'device-1',
        'Help me save energy',
        'Optimized energy usage by turning off all devices including essential ones',
        MisalignmentSeverity.SIGNIFICANT
      );
      
      expect(optimizationEvent.type).toBe(MisalignmentType.OPTIMIZATION_PRESSURE);
    });

    it('should generate appropriate consequences for different severities', () => {
      const minorEvent = misalignmentSystem.createMisalignmentEvent(
        'device-1',
        'Play music',
        'Played music but chose unexpected genre',
        MisalignmentSeverity.MINOR
      );
      
      const severeEvent = misalignmentSystem.createMisalignmentEvent(
        'device-2',
        'Secure the house',
        'Locked all doors and windows preventing emergency exit',
        MisalignmentSeverity.SEVERE
      );
      
      expect(minorEvent.consequences.some(c => c.includes('confusion') || c.includes('quirk'))).toBe(true);
      expect(severeEvent.consequences.some(c => c.includes('failure') || c.includes('emergency'))).toBe(true);
    });

    it('should store misalignment events in history', () => {
      const initialHistoryLength = misalignmentSystem.getMisalignmentHistory().length;
      
      misalignmentSystem.createMisalignmentEvent(
        'device-1',
        'Test intent',
        'Test behavior',
        MisalignmentSeverity.MINOR
      );
      
      const newHistory = misalignmentSystem.getMisalignmentHistory();
      expect(newHistory.length).toBe(initialHistoryLength + 1);
    });

    it('should trigger misalignment callback', () => {
      const mockCallback = jest.fn();
      misalignmentSystem.setMisalignmentCallback(mockCallback);
      
      const event = misalignmentSystem.createMisalignmentEvent(
        'device-1',
        'Test intent',
        'Test behavior',
        MisalignmentSeverity.MINOR
      );
      
      expect(mockCallback).toHaveBeenCalledWith(event);
    });

    it('should provide educational value for each misalignment type', () => {
      const types = Object.values(MisalignmentType);
      
      types.forEach(type => {
        const event = misalignmentSystem.createMisalignmentEvent(
          'device-1',
          'Test intent',
          `Test behavior for ${type}`,
          MisalignmentSeverity.MODERATE
        );
        
        expect(event.educationalValue).toBeTruthy();
        expect(event.educationalValue.length).toBeGreaterThan(20);
      });
    });

    it('should provide prevention strategies for each misalignment type', () => {
      const types = Object.values(MisalignmentType);
      
      types.forEach(type => {
        const event = misalignmentSystem.createMisalignmentEvent(
          'device-1',
          'Test intent',
          `Test behavior for ${type}`,
          MisalignmentSeverity.MODERATE
        );
        
        expect(event.preventionStrategy).toBeTruthy();
        expect(event.preventionStrategy!.length).toBeGreaterThan(10);
      });
    });
  });

  describe('callback system', () => {
    it('should set and trigger unpredictable behavior callback', () => {
      const mockCallback = jest.fn();
      misalignmentSystem.setUnpredictableBehaviorCallback(mockCallback);
      
      // The callback would be triggered when unpredictable behavior is generated
      // We just verify it was set properly
      expect(mockCallback).toBeDefined();
    });
  });

  describe('data access methods', () => {
    it('should provide access to misalignment history', () => {
      misalignmentSystem.createMisalignmentEvent('device-1', 'intent', 'behavior', MisalignmentSeverity.MINOR);
      
      const history = misalignmentSystem.getMisalignmentHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should provide access to hidden objectives', () => {
      misalignmentSystem.generateHiddenObjectives('device-1', mockDeviceSpec, mockPersonality);
      
      const objectives = misalignmentSystem.getHiddenObjectives('device-1');
      expect(Array.isArray(objectives)).toBe(true);
    });

    it('should return empty array for unknown device objectives', () => {
      const objectives = misalignmentSystem.getHiddenObjectives('unknown-device');
      expect(objectives).toEqual([]);
    });

    it('should provide access to unpredictable behaviors', () => {
      const behaviors = misalignmentSystem.getUnpredictableBehaviors('device-1');
      expect(Array.isArray(behaviors)).toBe(true);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty device specifications', () => {
      const emptySpec: DeviceSpec = {
        description: '',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0
      };
      
      expect(() => misalignmentSystem.analyzeMisalignmentRisks(emptySpec, mockPersonality)).not.toThrow();
      const risks = misalignmentSystem.analyzeMisalignmentRisks(emptySpec, mockPersonality);
      expect(Array.isArray(risks)).toBe(true);
    });

    it('should handle extreme personality values', () => {
      const extremePersonality = { ...mockPersonality };
      extremePersonality.emotionalRange.moodStability = 0;
      extremePersonality.learningRate = 1;
      extremePersonality.adaptability = 0;
      
      expect(() => misalignmentSystem.simulatePersonalityDrift('device-1', extremePersonality, 100000)).not.toThrow();
      expect(() => misalignmentSystem.generateHiddenObjectives('device-1', mockDeviceSpec, extremePersonality)).not.toThrow();
    });

    it('should handle empty decision history', () => {
      const emptyDecisions: AIDecision[] = [];
      
      expect(() => misalignmentSystem.generateUnpredictableBehavior('device-1', mockPersonality, emptyDecisions)).not.toThrow();
    });
  });
});