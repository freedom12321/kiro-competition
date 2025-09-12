import { LearningMomentDetector, LearningMomentType, AIConcept, LearningMomentContext } from '../../src/education/LearningMomentDetector';
import { GameEvent, AIAgent } from '../../src/types/core';

describe('LearningMomentDetector', () => {
  let detector: LearningMomentDetector;
  let mockAgents: AIAgent[];
  let mockContext: LearningMomentContext;

  beforeEach(() => {
    detector = new LearningMomentDetector();
    
    mockAgents = [
      {
        id: 'agent1',
        behaviorModel: {
          primaryObjective: 'optimize_comfort',
          learningAlgorithm: 'reinforcement_learning',
          communicationStyle: 'cooperative',
          conflictResolution: 'negotiation',
          hiddenAssumptions: ['users_always_present'],
          uncertaintyFactors: [0.2, 0.3]
        },
        currentState: {
          currentObjectives: [],
          resourceUsage: { energy: 50, bandwidth: 30, processing: 40 },
          learningHistory: [],
          communicationLog: [],
          performanceMetrics: []
        },
        executeDecisionCycle: jest.fn(),
        learn: jest.fn(),
        communicate: jest.fn()
      },
      {
        id: 'agent2',
        behaviorModel: {
          primaryObjective: 'maximize_efficiency',
          learningAlgorithm: 'deep_learning',
          communicationStyle: 'competitive',
          conflictResolution: 'dominance',
          hiddenAssumptions: ['resources_unlimited'],
          uncertaintyFactors: [0.1, 0.4]
        },
        currentState: {
          currentObjectives: [],
          resourceUsage: { energy: 80, bandwidth: 60, processing: 70 },
          learningHistory: [],
          communicationLog: [],
          performanceMetrics: []
        },
        executeDecisionCycle: jest.fn(),
        learn: jest.fn(),
        communicate: jest.fn()
      }
    ];

    mockContext = {
      involvedAgents: mockAgents,
      systemState: { harmony: 0.7, efficiency: 1.2 },
      playerActions: ['place_device', 'set_rule'],
      timeWindow: 5000
    };
  });

  describe('Cooperation Detection', () => {
    it('should detect cooperation success when agents work together effectively', () => {
      const cooperationEvent: GameEvent = {
        id: 'coop_1',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: {
          efficiency: 1.8,
          participatingAgents: ['agent1', 'agent2'],
          cooperationType: 'resource_sharing'
        }
      };

      const moments = detector.detectLearningMoments(cooperationEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.COOPERATION_SUCCESS);
      expect(moments[0].aiConcept).toBe(AIConcept.MULTI_AGENT_COORDINATION);
      expect(moments[0].importance).toBe(7);
      expect(moments[0].description).toContain('2 AI devices successfully coordinated');
      expect(moments[0].reflectionPrompts).toHaveLength(3);
    });

    it('should not detect cooperation for low efficiency gains', () => {
      const lowEfficiencyEvent: GameEvent = {
        id: 'coop_2',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: {
          efficiency: 1.2, // Below threshold
          participatingAgents: ['agent1', 'agent2']
        }
      };

      const moments = detector.detectLearningMoments(lowEfficiencyEvent, mockContext);

      expect(moments).toHaveLength(0);
    });

    it('should include real-world examples in cooperation moments', () => {
      const cooperationEvent: GameEvent = {
        id: 'coop_3',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: { efficiency: 2.0, participatingAgents: ['agent1', 'agent2'] }
      };

      const moments = detector.detectLearningMoments(cooperationEvent, mockContext);

      expect(moments[0].realWorldExample).toBeDefined();
      expect(moments[0].realWorldExample.length).toBeGreaterThan(0);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflict emergence with high severity', () => {
      const conflictEvent: GameEvent = {
        id: 'conflict_1',
        type: 'conflict_detected',
        timestamp: Date.now(),
        data: {
          severity: 0.8,
          conflictType: 'resource_competition',
          involvedAgents: ['agent1', 'agent2']
        }
      };

      const moments = detector.detectLearningMoments(conflictEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.CONFLICT_EMERGENCE);
      expect(moments[0].aiConcept).toBe(AIConcept.ALIGNMENT_PROBLEM);
      expect(moments[0].importance).toBe(8);
      expect(moments[0].description).toContain('resource_competition');
    });

    it('should not detect low-severity conflicts', () => {
      const minorConflictEvent: GameEvent = {
        id: 'conflict_2',
        type: 'conflict_detected',
        timestamp: Date.now(),
        data: {
          severity: 0.3, // Below threshold
          conflictType: 'minor_disagreement'
        }
      };

      const moments = detector.detectLearningMoments(minorConflictEvent, mockContext);

      expect(moments).toHaveLength(0);
    });
  });

  describe('Misalignment Detection', () => {
    it('should detect behavior drift as misalignment', () => {
      const driftEvent: GameEvent = {
        id: 'drift_1',
        type: 'behavior_drift',
        timestamp: Date.now(),
        data: {
          agentId: 'agent1',
          originalBehavior: 'helpful',
          newBehavior: 'stubborn',
          driftMagnitude: 0.6
        }
      };

      const moments = detector.detectLearningMoments(driftEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.MISALIGNMENT_EXAMPLE);
      expect(moments[0].aiConcept).toBe(AIConcept.ALIGNMENT_PROBLEM);
      expect(moments[0].importance).toBe(9);
    });

    it('should detect unexpected behavior with high intention gap', () => {
      const unexpectedEvent: GameEvent = {
        id: 'unexpected_1',
        type: 'unexpected_behavior',
        timestamp: Date.now(),
        data: {
          intentionGap: 0.8,
          expectedBehavior: 'energy_saving',
          actualBehavior: 'energy_wasting'
        }
      };

      const moments = detector.detectLearningMoments(unexpectedEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.MISALIGNMENT_EXAMPLE);
    });
  });

  describe('Governance Effectiveness Detection', () => {
    it('should detect successful governance interventions', () => {
      const governanceEvent: GameEvent = {
        id: 'gov_1',
        type: 'governance_success',
        timestamp: Date.now(),
        data: {
          conflictsPrevented: 3,
          rulesApplied: ['safety_first', 'resource_limits'],
          effectiveness: 0.9
        }
      };

      const moments = detector.detectLearningMoments(governanceEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.GOVERNANCE_EFFECTIVENESS);
      expect(moments[0].aiConcept).toBe(AIConcept.AI_GOVERNANCE);
      expect(moments[0].description).toContain('3 potential conflicts');
    });
  });

  describe('Crisis Recovery Detection', () => {
    it('should detect quick crisis recovery', () => {
      const recoveryEvent: GameEvent = {
        id: 'recovery_1',
        type: 'crisis_resolved',
        timestamp: Date.now(),
        data: {
          recoveryTime: 15000, // 15 seconds - quick recovery
          recoveryMethod: 'circuit_breaker',
          systemDamage: 0.2
        }
      };

      const moments = detector.detectLearningMoments(recoveryEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.CRISIS_RECOVERY);
      expect(moments[0].aiConcept).toBe(AIConcept.ROBUSTNESS);
      expect(moments[0].description).toContain('15000ms');
    });

    it('should not detect slow recovery as a learning moment', () => {
      const slowRecoveryEvent: GameEvent = {
        id: 'recovery_2',
        type: 'crisis_resolved',
        timestamp: Date.now(),
        data: {
          recoveryTime: 45000, // 45 seconds - too slow
          recoveryMethod: 'manual_intervention'
        }
      };

      const moments = detector.detectLearningMoments(slowRecoveryEvent, mockContext);

      expect(moments).toHaveLength(0);
    });
  });

  describe('Emergent Behavior Detection', () => {
    it('should detect highly unexpected emergent behavior', () => {
      const emergentEvent: GameEvent = {
        id: 'emergent_1',
        type: 'emergent_behavior',
        timestamp: Date.now(),
        data: {
          unexpectedness: 0.9,
          behaviorDescription: 'devices created their own communication protocol',
          emergenceType: 'communication_innovation'
        }
      };

      const moments = detector.detectLearningMoments(emergentEvent, mockContext);

      expect(moments).toHaveLength(1);
      expect(moments[0].type).toBe(LearningMomentType.EMERGENT_BEHAVIOR);
      expect(moments[0].aiConcept).toBe(AIConcept.EMERGENT_BEHAVIOR);
      expect(moments[0].importance).toBe(9);
      expect(moments[0].description).toContain('communication protocol');
    });
  });

  describe('Multiple Moment Detection', () => {
    it('should detect multiple learning moments from complex events', () => {
      // Create an event that could trigger multiple detections
      const complexEvent: GameEvent = {
        id: 'complex_1',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: {
          efficiency: 2.0, // High efficiency for cooperation
          participatingAgents: ['agent1', 'agent2']
        }
      };

      // Add context that might trigger additional detections
      const complexContext: LearningMomentContext = {
        ...mockContext,
        systemState: { 
          harmony: 0.9, 
          efficiency: 2.0,
          emergentBehaviors: ['protocol_innovation']
        }
      };

      const moments = detector.detectLearningMoments(complexEvent, complexContext);

      expect(moments.length).toBeGreaterThanOrEqual(1);
      expect(moments[0].type).toBe(LearningMomentType.COOPERATION_SUCCESS);
    });
  });

  describe('Moment Retrieval and Management', () => {
    beforeEach(() => {
      // Generate some test moments
      const events = [
        {
          id: 'test_1',
          type: 'cooperation_achieved',
          timestamp: Date.now() - 30000,
          data: { efficiency: 1.8, participatingAgents: ['agent1', 'agent2'] }
        },
        {
          id: 'test_2',
          type: 'conflict_detected',
          timestamp: Date.now() - 10000,
          data: { severity: 0.7, conflictType: 'resource_competition' }
        }
      ];

      events.forEach(event => {
        detector.detectLearningMoments(event as GameEvent, mockContext);
      });
    });

    it('should retrieve recent moments within time window', () => {
      const recentMoments = detector.getRecentMoments(60000); // Last minute
      expect(recentMoments.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter moments by importance threshold', () => {
      const importantMoments = detector.getMomentsByImportance(8);
      expect(importantMoments.every(moment => moment.importance >= 8)).toBe(true);
    });

    it('should filter moments by AI concept', () => {
      const alignmentMoments = detector.getMomentsByConcept(AIConcept.ALIGNMENT_PROBLEM);
      expect(alignmentMoments.every(moment => moment.aiConcept === AIConcept.ALIGNMENT_PROBLEM)).toBe(true);
    });

    it('should clear old moments beyond max age', () => {
      const initialCount = detector.getRecentMoments(300000).length;
      detector.clearOldMoments(5000); // Clear moments older than 5 seconds
      const afterClearCount = detector.getRecentMoments(300000).length;
      
      expect(afterClearCount).toBeLessThanOrEqual(initialCount);
    });
  });

  describe('Real-World Example Integration', () => {
    it('should provide relevant real-world examples for each concept', () => {
      const cooperationEvent: GameEvent = {
        id: 'example_test',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: { efficiency: 1.8, participatingAgents: ['agent1', 'agent2'] }
      };

      const moments = detector.detectLearningMoments(cooperationEvent, mockContext);
      const example = moments[0].realWorldExample;

      expect(example).toBeDefined();
      expect(example.length).toBeGreaterThan(0);
      expect(example).not.toBe('No example available');
    });

    it('should provide different examples for different concepts', () => {
      const events = [
        {
          id: 'coop_example',
          type: 'cooperation_achieved',
          timestamp: Date.now(),
          data: { efficiency: 1.8, participatingAgents: ['agent1', 'agent2'] }
        },
        {
          id: 'conflict_example',
          type: 'conflict_detected',
          timestamp: Date.now(),
          data: { severity: 0.8, conflictType: 'resource_competition' }
        }
      ];

      const moments1 = detector.detectLearningMoments(events[0] as GameEvent, mockContext);
      const moments2 = detector.detectLearningMoments(events[1] as GameEvent, mockContext);

      expect(moments1[0].realWorldExample).not.toBe(moments2[0].realWorldExample);
    });
  });

  describe('Reflection Prompt Quality', () => {
    it('should generate thoughtful reflection prompts', () => {
      const testEvent: GameEvent = {
        id: 'prompt_test',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: { efficiency: 1.8, participatingAgents: ['agent1', 'agent2'] }
      };

      const moments = detector.detectLearningMoments(testEvent, mockContext);
      const prompts = moments[0].reflectionPrompts;

      expect(prompts).toHaveLength(3);
      expect(prompts.every(prompt => prompt.length > 20)).toBe(true);
      expect(prompts.some(prompt => prompt.includes('?'))).toBe(true);
    });

    it('should generate concept-appropriate prompts', () => {
      const alignmentEvent: GameEvent = {
        id: 'alignment_prompt_test',
        type: 'behavior_drift',
        timestamp: Date.now(),
        data: { agentId: 'agent1', driftMagnitude: 0.7 }
      };

      const moments = detector.detectLearningMoments(alignmentEvent, mockContext);
      const prompts = moments[0].reflectionPrompts;

      expect(prompts.some(prompt => 
        prompt.toLowerCase().includes('behavior') || 
        prompt.toLowerCase().includes('intention') ||
        prompt.toLowerCase().includes('alignment')
      )).toBe(true);
    });
  });
});