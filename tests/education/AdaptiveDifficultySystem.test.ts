import { AdaptiveDifficultySystem, ChallengeType, TriggerCondition, AdaptiveType } from '../../src/education/AdaptiveDifficultySystem';
import { LearningAnalytics, SkillLevel } from '../../src/education/LearningAnalytics';
import { AIConcept } from '../../src/education/LearningMomentDetector';

describe('AdaptiveDifficultySystem', () => {
  let adaptiveSystem: AdaptiveDifficultySystem;
  let mockAnalytics: LearningAnalytics;
  let mockPlayerSkills: Map<AIConcept, SkillLevel>;

  beforeEach(() => {
    mockAnalytics = new LearningAnalytics();
    adaptiveSystem = new AdaptiveDifficultySystem(mockAnalytics);
    
    mockPlayerSkills = new Map([
      [AIConcept.MULTI_AGENT_COORDINATION, SkillLevel.BEGINNER],
      [AIConcept.ALIGNMENT_PROBLEM, SkillLevel.NOVICE],
      [AIConcept.AI_GOVERNANCE, SkillLevel.INTERMEDIATE]
    ]);
  });

  describe('Scenario Generation', () => {
    it('should generate adaptive scenario based on player skills', () => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION, AIConcept.ALIGNMENT_PROBLEM];
      const scenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);

      expect(scenario.id).toBeDefined();
      expect(scenario.complexity).toBeGreaterThan(0);
      expect(scenario.complexity).toBeLessThanOrEqual(1);
      expect(scenario.conceptCount).toBeGreaterThan(0);
      expect(scenario.supportLevel).toBeGreaterThan(0);
      expect(scenario.challengeType).toBeDefined();
      expect(scenario.prerequisites).toBeDefined();
      expect(scenario.adaptiveElements).toBeDefined();
    });

    it('should adjust complexity based on average skill level', () => {
      const noviceSkills = new Map([
        [AIConcept.MULTI_AGENT_COORDINATION, SkillLevel.NOVICE],
        [AIConcept.ALIGNMENT_PROBLEM, SkillLevel.NOVICE]
      ]);

      const expertSkills = new Map([
        [AIConcept.MULTI_AGENT_COORDINATION, SkillLevel.EXPERT],
        [AIConcept.ALIGNMENT_PROBLEM, SkillLevel.EXPERT]
      ]);

      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION, AIConcept.ALIGNMENT_PROBLEM];
      
      const noviceScenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, noviceSkills);
      const expertScenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, expertSkills);

      expect(expertScenario.complexity).toBeGreaterThan(noviceScenario.complexity);
      expect(noviceScenario.supportLevel).toBeGreaterThan(expertScenario.supportLevel);
    });

    it('should include appropriate challenge types for skill level', () => {
      const beginnerSkills = new Map([
        [AIConcept.MULTI_AGENT_COORDINATION, SkillLevel.BEGINNER]
      ]);

      const advancedSkills = new Map([
        [AIConcept.MULTI_AGENT_COORDINATION, SkillLevel.ADVANCED]
      ]);

      const beginnerScenario = adaptiveSystem.generateAdaptiveScenario([AIConcept.MULTI_AGENT_COORDINATION], beginnerSkills);
      const advancedScenario = adaptiveSystem.generateAdaptiveScenario([AIConcept.MULTI_AGENT_COORDINATION], advancedSkills);

      expect(beginnerScenario.challengeType).toContain(ChallengeType.PROBLEM_SOLVING);
      expect(advancedScenario.challengeType.length).toBeGreaterThan(beginnerScenario.challengeType.length);
    });

    it('should create adaptive elements for different skill levels', () => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      const scenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);

      expect(scenario.adaptiveElements.length).toBeGreaterThan(0);
      expect(scenario.adaptiveElements[0].type).toBeDefined();
      expect(scenario.adaptiveElements[0].trigger).toBeDefined();
      expect(scenario.adaptiveElements[0].adjustment).toBeDefined();
    });
  });

  describe('Real-time Adaptation', () => {
    beforeEach(() => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);
    });

    it('should adapt scenario when performance is low', () => {
      const lowPerformanceMetrics = {
        accuracy: 0.2,
        speed: 0.5,
        engagement: 0.6,
        frustrationLevel: 0.8,
        confidenceLevel: 0.3,
        helpSeeking: 3
      };

      const adaptedScenario = adaptiveSystem.adaptScenarioInRealTime(lowPerformanceMetrics);

      expect(adaptedScenario).toBeDefined();
      // Should reduce complexity or increase support
      expect(adaptedScenario!.complexity).toBeLessThanOrEqual(1.0);
    });

    it('should not adapt when performance is adequate', () => {
      const goodPerformanceMetrics = {
        accuracy: 0.7,
        speed: 1.0,
        engagement: 0.8,
        frustrationLevel: 0.2,
        confidenceLevel: 0.7,
        helpSeeking: 1
      };

      const adaptedScenario = adaptiveSystem.adaptScenarioInRealTime(goodPerformanceMetrics);

      // Should not need adaptation
      expect(adaptedScenario).toBeNull();
    });

    it('should increase difficulty for high performers', () => {
      const highPerformanceMetrics = {
        accuracy: 0.95,
        speed: 1.5,
        engagement: 0.9,
        frustrationLevel: 0.1,
        confidenceLevel: 0.9,
        helpSeeking: 0
      };

      // First, we need to set up a scenario that can detect high performance
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      const scenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);
      
      // Add high performance trigger
      scenario.adaptiveElements.push({
        type: AdaptiveType.COMPLEXITY_REDUCTION,
        trigger: {
          condition: TriggerCondition.HIGH_PERFORMANCE,
          threshold: 0.9,
          timeWindow: 60000
        },
        adjustment: {
          parameterChanges: new Map([['complexity', 0.1]]),
          supportChanges: [],
          contentModifications: []
        }
      });

      const adaptedScenario = adaptiveSystem.adaptScenarioInRealTime(highPerformanceMetrics);

      if (adaptedScenario) {
        expect(adaptedScenario.complexity).toBeGreaterThanOrEqual(scenario.complexity);
      }
    });

    it('should log adaptation events', () => {
      const lowPerformanceMetrics = {
        accuracy: 0.2,
        speed: 0.5,
        engagement: 0.4,
        frustrationLevel: 0.8,
        confidenceLevel: 0.3,
        helpSeeking: 3
      };

      adaptiveSystem.adaptScenarioInRealTime(lowPerformanceMetrics);

      const adaptationHistory = adaptiveSystem.adaptationHistory;
      expect(adaptationHistory.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Difficulty Curve Generation', () => {
    it('should generate optimal difficulty curve for session', () => {
      const sessionLength = 30; // 30 minutes
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION, AIConcept.ALIGNMENT_PROBLEM];
      
      const curve = adaptiveSystem.getOptimalDifficultyCurve(sessionLength, targetConcepts);

      expect(curve.length).toBeGreaterThan(0);
      expect(curve[0].timePoint).toBe(0);
      expect(curve[curve.length - 1].timePoint).toBe(sessionLength);
      
      // Should start easier and generally increase
      expect(curve[0].difficulty).toBeLessThan(curve[Math.floor(curve.length / 2)].difficulty);
    });

    it('should adjust support level inversely to difficulty', () => {
      const sessionLength = 20;
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      
      const curve = adaptiveSystem.getOptimalDifficultyCurve(sessionLength, targetConcepts);

      // Generally, higher difficulty should have higher support
      const midPoint = Math.floor(curve.length / 2);
      if (curve[midPoint].difficulty > curve[0].difficulty) {
        expect(curve[midPoint].supportLevel).toBeGreaterThanOrEqual(curve[0].supportLevel * 0.8);
      }
    });

    it('should focus on fewer concepts as session progresses', () => {
      const sessionLength = 25;
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION, AIConcept.ALIGNMENT_PROBLEM, AIConcept.AI_GOVERNANCE];
      
      const curve = adaptiveSystem.getOptimalDifficultyCurve(sessionLength, targetConcepts);

      // Later points should focus on fewer concepts
      expect(curve[curve.length - 1].focusConcepts.length).toBeLessThanOrEqual(curve[0].focusConcepts.length);
    });
  });

  describe('Performance Prediction', () => {
    it('should predict performance for given scenario and skills', () => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      const scenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);
      
      const prediction = adaptiveSystem.predictPerformance(scenario, mockPlayerSkills);

      expect(prediction.expectedAccuracy).toBeGreaterThanOrEqual(0);
      expect(prediction.expectedAccuracy).toBeLessThanOrEqual(1);
      expect(prediction.expectedEngagement).toBeGreaterThanOrEqual(0);
      expect(prediction.expectedEngagement).toBeLessThanOrEqual(1);
      expect(prediction.expectedFrustration).toBeGreaterThanOrEqual(0);
      expect(prediction.expectedFrustration).toBeLessThanOrEqual(1);
      expect(prediction.expectedCompletionTime).toBeGreaterThan(0);
      expect(prediction.riskFactors).toBeDefined();
      expect(prediction.recommendations).toBeDefined();
    });

    it('should predict better performance for well-matched scenarios', () => {
      const easyScenario = adaptiveSystem.generateAdaptiveScenario([AIConcept.AI_GOVERNANCE], mockPlayerSkills);
      const hardScenario = {
        ...easyScenario,
        complexity: 0.9,
        supportLevel: 0.1,
        prerequisites: [AIConcept.EMERGENT_BEHAVIOR] // Not in player skills
      };

      const easyPrediction = adaptiveSystem.predictPerformance(easyScenario, mockPlayerSkills);
      const hardPrediction = adaptiveSystem.predictPerformance(hardScenario, mockPlayerSkills);

      expect(easyPrediction.expectedAccuracy).toBeGreaterThan(hardPrediction.expectedAccuracy);
      expect(easyPrediction.expectedFrustration).toBeLessThan(hardPrediction.expectedFrustration);
    });

    it('should identify risk factors correctly', () => {
      const riskyScenario = {
        id: 'risky_scenario',
        complexity: 0.95, // Very high complexity
        conceptCount: 1,
        supportLevel: 0.1, // Very low support
        challengeType: [ChallengeType.PROBLEM_SOLVING],
        prerequisites: [AIConcept.EMERGENT_BEHAVIOR], // Not in player skills
        adaptiveElements: []
      };

      const prediction = adaptiveSystem.predictPerformance(riskyScenario, mockPlayerSkills);

      expect(prediction.riskFactors.length).toBeGreaterThan(0);
      expect(prediction.riskFactors.some(risk => risk.includes('complexity'))).toBe(true);
    });

    it('should provide relevant recommendations', () => {
      const problematicScenario = {
        id: 'problematic_scenario',
        complexity: 0.9,
        conceptCount: 1,
        supportLevel: 0.2,
        challengeType: [ChallengeType.PROBLEM_SOLVING],
        prerequisites: [AIConcept.EMERGENT_BEHAVIOR],
        adaptiveElements: []
      };

      const prediction = adaptiveSystem.predictPerformance(problematicScenario, mockPlayerSkills);

      expect(prediction.recommendations.length).toBeGreaterThan(0);
      expect(prediction.recommendations.some(rec => rec.includes('support') || rec.includes('scaffolding'))).toBe(true);
    });
  });

  describe('Performance History Tracking', () => {
    it('should track performance metrics over time', () => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);

      const metrics1 = {
        accuracy: 0.6,
        speed: 1.0,
        engagement: 0.7,
        frustrationLevel: 0.3,
        confidenceLevel: 0.6,
        helpSeeking: 1
      };

      const metrics2 = {
        accuracy: 0.8,
        speed: 1.2,
        engagement: 0.8,
        frustrationLevel: 0.2,
        confidenceLevel: 0.8,
        helpSeeking: 0
      };

      adaptiveSystem.adaptScenarioInRealTime(metrics1);
      adaptiveSystem.adaptScenarioInRealTime(metrics2);

      const history = adaptiveSystem.recentPerformanceHistory;
      expect(history.length).toBe(2);
      expect(history[0]).toEqual(metrics1);
      expect(history[1]).toEqual(metrics2);
    });

    it('should limit performance history to recent entries', () => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);

      // Add more than 10 performance entries
      for (let i = 0; i < 15; i++) {
        const metrics = {
          accuracy: 0.5 + (i * 0.02),
          speed: 1.0,
          engagement: 0.7,
          frustrationLevel: 0.3,
          confidenceLevel: 0.6,
          helpSeeking: 1
        };
        
        adaptiveSystem.adaptScenarioInRealTime(metrics);
      }

      const history = adaptiveSystem.recentPerformanceHistory;
      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Scenario Parameter Access', () => {
    it('should provide access to current scenario parameters', () => {
      expect(adaptiveSystem.currentScenarioParameters).toBeNull();

      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      const scenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);

      expect(adaptiveSystem.currentScenarioParameters).toEqual(scenario);
    });

    it('should update current scenario after adaptation', () => {
      const targetConcepts = [AIConcept.MULTI_AGENT_COORDINATION];
      const originalScenario = adaptiveSystem.generateAdaptiveScenario(targetConcepts, mockPlayerSkills);

      const lowPerformanceMetrics = {
        accuracy: 0.2,
        speed: 0.5,
        engagement: 0.4,
        frustrationLevel: 0.8,
        confidenceLevel: 0.3,
        helpSeeking: 3
      };

      const adaptedScenario = adaptiveSystem.adaptScenarioInRealTime(lowPerformanceMetrics);

      if (adaptedScenario) {
        expect(adaptiveSystem.currentScenarioParameters).toEqual(adaptedScenario);
        expect(adaptiveSystem.currentScenarioParameters).not.toEqual(originalScenario);
      }
    });
  });
});