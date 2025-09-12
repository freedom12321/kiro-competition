import { ScenarioEngine, ScenarioEngineConfig } from '../../src/tutorial/ScenarioEngine';
import {
  Scenario,
  ScenarioInstance,
  PlayerProgress,
  DifficultyLevel,
  ScenarioCategory,
  EnvironmentType,
  DeviceCategory,
  PersonalityTrait,
  EmotionState,
  ObjectiveType,
  SuccessType,
  FailureType,
  LearningCategory
} from '../../src/types/core';

describe('ScenarioEngine', () => {
  let scenarioEngine: ScenarioEngine;
  let config: ScenarioEngineConfig;

  beforeEach(() => {
    config = {
      adaptiveDifficulty: true,
      maxScenarios: 100,
      autoUnlock: true,
      trackPerformance: true
    };

    scenarioEngine = new ScenarioEngine(config);
  });

  afterEach(() => {
    scenarioEngine.cleanup();
  });

  describe('Scenario Registration', () => {
    it('should register a scenario successfully', () => {
      const scenario = createMockScenario('test-scenario');
      
      scenarioEngine.registerScenario(scenario);
      
      const retrieved = scenarioEngine.getScenario('test-scenario');
      expect(retrieved).toEqual(scenario);
    });

    it('should get scenarios by category', () => {
      const tutorialScenario = createMockScenario('tutorial-1', ScenarioCategory.TUTORIAL);
      const challengeScenario = createMockScenario('challenge-1', ScenarioCategory.CHALLENGE);
      
      scenarioEngine.registerScenario(tutorialScenario);
      scenarioEngine.registerScenario(challengeScenario);
      
      const tutorials = scenarioEngine.getScenariosByCategory(ScenarioCategory.TUTORIAL);
      const challenges = scenarioEngine.getScenariosByCategory(ScenarioCategory.CHALLENGE);
      
      expect(tutorials).toHaveLength(2); // Including built-in tutorial scenario
      expect(challenges).toHaveLength(2); // Including built-in challenge scenario
    });

    it('should get scenarios by difficulty', () => {
      const beginnerScenario = createMockScenario('beginner-1', ScenarioCategory.TUTORIAL, DifficultyLevel.BEGINNER);
      const advancedScenario = createMockScenario('advanced-1', ScenarioCategory.CHALLENGE, DifficultyLevel.ADVANCED);
      
      scenarioEngine.registerScenario(beginnerScenario);
      scenarioEngine.registerScenario(advancedScenario);
      
      const beginnerScenarios = scenarioEngine.getScenariosByDifficulty(DifficultyLevel.BEGINNER);
      const advancedScenarios = scenarioEngine.getScenariosByDifficulty(DifficultyLevel.ADVANCED);
      
      expect(beginnerScenarios.length).toBeGreaterThan(0);
      expect(advancedScenarios.length).toBeGreaterThan(0);
    });
  });

  describe('Available Scenarios', () => {
    let playerProgress: PlayerProgress;

    beforeEach(() => {
      playerProgress = createMockPlayerProgress();
    });

    it('should return scenarios with no prerequisites', () => {
      const scenario = createMockScenario('no-prereq', ScenarioCategory.TUTORIAL, DifficultyLevel.BEGINNER, []);
      scenarioEngine.registerScenario(scenario);
      
      const available = scenarioEngine.getAvailableScenarios(playerProgress);
      
      expect(available.some(s => s.id === 'no-prereq')).toBe(true);
    });

    it('should filter scenarios based on prerequisites', () => {
      const scenario1 = createMockScenario('scenario-1', ScenarioCategory.TUTORIAL, DifficultyLevel.BEGINNER, []);
      const scenario2 = createMockScenario('scenario-2', ScenarioCategory.TUTORIAL, DifficultyLevel.BEGINNER, ['tutorial-1']);
      
      scenarioEngine.registerScenario(scenario1);
      scenarioEngine.registerScenario(scenario2);
      
      const available = scenarioEngine.getAvailableScenarios(playerProgress);
      
      expect(available.some(s => s.id === 'scenario-1')).toBe(true);
      expect(available.some(s => s.id === 'scenario-2')).toBe(false);
    });

    it('should include scenarios when prerequisites are met', () => {
      const scenario = createMockScenario('with-prereq', ScenarioCategory.TUTORIAL, DifficultyLevel.BEGINNER, ['tutorial-1']);
      scenarioEngine.registerScenario(scenario);
      
      playerProgress.completedTutorials.push('tutorial-1');
      const available = scenarioEngine.getAvailableScenarios(playerProgress);
      
      expect(available.some(s => s.id === 'with-prereq')).toBe(true);
    });
  });

  describe('Scenario Instance Management', () => {
    let scenario: Scenario;

    beforeEach(() => {
      scenario = createMockScenario('test-scenario');
      scenarioEngine.registerScenario(scenario);
    });

    it('should load scenario instance successfully', () => {
      const instance = scenarioEngine.loadScenario('test-scenario', 'player-1');
      
      expect(instance.scenarioId).toBe('test-scenario');
      expect(instance.playerId).toBe('player-1');
      expect(instance.completed).toBe(false);
      expect(instance.objectives).toHaveLength(scenario.objectives.length);
    });

    it('should throw error for non-existent scenario', () => {
      expect(() => {
        scenarioEngine.loadScenario('non-existent', 'player-1');
      }).toThrow('Scenario non-existent not found');
    });

    it('should initialize objective progress correctly', () => {
      const instance = scenarioEngine.loadScenario('test-scenario', 'player-1');
      
      expect(instance.objectives).toHaveLength(scenario.objectives.length);
      instance.objectives.forEach(obj => {
        expect(obj.completed).toBe(false);
        expect(obj.progress).toBe(0);
        expect(obj.attempts).toBe(0);
      });
    });

    it('should apply difficulty adaptations when enabled', () => {
      // This would require setting up performance history
      const instance = scenarioEngine.loadScenario('test-scenario', 'player-1');
      
      expect(instance.adaptations).toBeDefined();
      // Adaptations would be empty for new player, but system is ready
    });
  });

  describe('Objective Management', () => {
    let scenario: Scenario;
    let instance: ScenarioInstance;

    beforeEach(() => {
      scenario = createMockScenario('objective-test');
      scenarioEngine.registerScenario(scenario);
      instance = scenarioEngine.loadScenario('objective-test', 'player-1');
    });

    it('should update objective progress', () => {
      const objectiveId = scenario.objectives[0].id;
      
      scenarioEngine.updateObjectiveProgress(instance.id, objectiveId, 0.5);
      
      const objective = instance.objectives.find(obj => obj.objectiveId === objectiveId);
      expect(objective?.progress).toBe(0.5);
      expect(objective?.completed).toBe(false);
    });

    it('should complete objective when progress reaches 1', () => {
      const objectiveId = scenario.objectives[0].id;
      
      scenarioEngine.updateObjectiveProgress(instance.id, objectiveId, 1.0);
      
      const objective = instance.objectives.find(obj => obj.objectiveId === objectiveId);
      expect(objective?.completed).toBe(true);
      expect(objective?.timeToComplete).toBeDefined();
    });

    it('should complete objective directly', () => {
      const objectiveId = scenario.objectives[0].id;
      
      scenarioEngine.completeObjective(instance.id, objectiveId);
      
      const objective = instance.objectives.find(obj => obj.objectiveId === objectiveId);
      expect(objective?.completed).toBe(true);
      expect(objective?.progress).toBe(1);
    });

    it('should clamp progress between 0 and 1', () => {
      const objectiveId = scenario.objectives[0].id;
      
      scenarioEngine.updateObjectiveProgress(instance.id, objectiveId, 1.5);
      
      const objective = instance.objectives.find(obj => obj.objectiveId === objectiveId);
      expect(objective?.progress).toBe(1);
      
      scenarioEngine.updateObjectiveProgress(instance.id, objectiveId, -0.5);
      expect(objective?.progress).toBe(0);
    });
  });

  describe('Scenario Completion', () => {
    let scenario: Scenario;
    let instance: ScenarioInstance;

    beforeEach(() => {
      scenario = createMockScenario('completion-test');
      scenarioEngine.registerScenario(scenario);
      instance = scenarioEngine.loadScenario('completion-test', 'player-1');
    });

    it('should complete scenario when success criteria are met', () => {
      // Complete all objectives to meet success criteria
      scenario.objectives.forEach(obj => {
        scenarioEngine.completeObjective(instance.id, obj.id);
      });
      
      expect(instance.completed).toBe(true);
      expect(instance.success).toBe(true);
      expect(instance.endTime).toBeDefined();
    });

    it('should calculate final score correctly', () => {
      // Complete all objectives
      scenario.objectives.forEach(obj => {
        scenarioEngine.completeObjective(instance.id, obj.id);
      });
      
      expect(instance.score).toBeGreaterThan(0);
    });

    it('should calculate performance metrics', () => {
      // Complete scenario
      scenario.objectives.forEach(obj => {
        scenarioEngine.completeObjective(instance.id, obj.id);
      });
      
      expect(instance.performance.efficiency).toBeGreaterThan(0);
      expect(instance.performance.problemSolving).toBeGreaterThan(0);
      expect(instance.performance.timeManagement).toBeGreaterThan(0);
    });

    it('should clean up instance after completion', () => {
      // Complete scenario
      scenario.objectives.forEach(obj => {
        scenarioEngine.completeObjective(instance.id, obj.id);
      });
      
      expect(scenarioEngine.getAllActiveInstances()).toHaveLength(0);
    });
  });

  describe('Custom Scenario Creation', () => {
    it('should create custom scenario with default values', () => {
      const parameters = {
        name: 'Custom Test Scenario',
        description: 'A custom scenario for testing'
      };
      
      const customScenario = scenarioEngine.createCustomScenario(parameters);
      
      expect(customScenario.name).toBe('Custom Test Scenario');
      expect(customScenario.description).toBe('A custom scenario for testing');
      expect(customScenario.category).toBe(ScenarioCategory.SANDBOX);
      expect(customScenario.tags).toContain('custom');
    });

    it('should create custom scenario with provided parameters', () => {
      const parameters = {
        name: 'Advanced Custom Scenario',
        difficulty: DifficultyLevel.ADVANCED,
        timeLimit: 300,
        objectives: [
          {
            id: 'custom-objective',
            description: 'Complete custom task',
            type: ObjectiveType.CREATE_DEVICE,
            target: { type: 'string', value: 'custom' },
            measurable: true,
            weight: 1.0,
            optional: false
          }
        ]
      };
      
      const customScenario = scenarioEngine.createCustomScenario(parameters);
      
      expect(customScenario.difficulty).toBe(DifficultyLevel.ADVANCED);
      expect(customScenario.timeLimit).toBe(300);
      expect(customScenario.objectives).toHaveLength(1);
      expect(customScenario.objectives[0].id).toBe('custom-objective');
    });

    it('should register custom scenario automatically', () => {
      const parameters = { name: 'Auto-registered Scenario' };
      const customScenario = scenarioEngine.createCustomScenario(parameters);
      
      const retrieved = scenarioEngine.getScenario(customScenario.id);
      expect(retrieved).toEqual(customScenario);
    });
  });

  describe('Built-in Scenarios', () => {
    it('should have smart home harmony scenario', () => {
      const scenario = scenarioEngine.getScenario('smart-home-harmony');
      expect(scenario).toBeDefined();
      expect(scenario?.name).toBe('Smart Home Harmony');
      expect(scenario?.difficulty).toBe(DifficultyLevel.BEGINNER);
    });

    it('should have crisis management challenge', () => {
      const scenario = scenarioEngine.getScenario('crisis-management-challenge');
      expect(scenario).toBeDefined();
      expect(scenario?.name).toBe('The Great Device Rebellion');
      expect(scenario?.difficulty).toBe(DifficultyLevel.INTERMEDIATE);
    });

    it('should have proper prerequisite chain', () => {
      const harmonyScenario = scenarioEngine.getScenario('smart-home-harmony');
      const crisisScenario = scenarioEngine.getScenario('crisis-management-challenge');
      
      expect(harmonyScenario?.prerequisites).toContain('device-creation-basics');
      expect(crisisScenario?.prerequisites).toContain('smart-home-harmony');
    });

    it('should have realistic environment setups', () => {
      const harmonyScenario = scenarioEngine.getScenario('smart-home-harmony');
      
      expect(harmonyScenario?.environment.type).toBe(EnvironmentType.HOME);
      expect(harmonyScenario?.environment.layout.width).toBeGreaterThan(0);
      expect(harmonyScenario?.environment.layout.height).toBeGreaterThan(0);
      expect(harmonyScenario?.environment.furniture.length).toBeGreaterThan(0);
    });

    it('should have preset devices with proper configurations', () => {
      const harmonyScenario = scenarioEngine.getScenario('smart-home-harmony');
      
      expect(harmonyScenario?.presetDevices.length).toBeGreaterThan(0);
      
      const thermostat = harmonyScenario?.presetDevices[0];
      expect(thermostat?.type).toBe(DeviceCategory.COMFORT);
      expect(thermostat?.personality).toContain(PersonalityTrait.HELPFUL);
      expect(thermostat?.initialState.active).toBe(true);
    });
  });

  describe('Analytics', () => {
    let scenario: Scenario;
    let instance: ScenarioInstance;

    beforeEach(() => {
      scenario = createMockScenario('analytics-test');
      scenarioEngine.registerScenario(scenario);
      instance = scenarioEngine.loadScenario('analytics-test', 'player-1');
    });

    it('should provide scenario analytics', () => {
      const analytics = scenarioEngine.getScenarioAnalytics(instance.id);
      
      expect(analytics).toMatchObject({
        instanceId: instance.id,
        scenarioId: 'analytics-test',
        progress: expect.any(Number),
        score: expect.any(Number),
        timeSpent: expect.any(Number),
        objectives: expect.any(Array),
        performance: expect.any(Object),
        adaptations: expect.any(Array)
      });
    });

    it('should return null for non-existent instance', () => {
      const analytics = scenarioEngine.getScenarioAnalytics('non-existent');
      expect(analytics).toBeNull();
    });

    it('should track progress correctly', () => {
      // Complete half the objectives
      const halfObjectives = Math.ceil(scenario.objectives.length / 2);
      for (let i = 0; i < halfObjectives; i++) {
        scenarioEngine.completeObjective(instance.id, scenario.objectives[i].id);
      }
      
      const analytics = scenarioEngine.getScenarioAnalytics(instance.id);
      expect(analytics.progress).toBeCloseTo(0.5, 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid instance IDs gracefully', () => {
      expect(() => {
        scenarioEngine.updateObjectiveProgress('invalid-instance', 'objective-1', 0.5);
      }).not.toThrow();
      
      expect(() => {
        scenarioEngine.completeObjective('invalid-instance', 'objective-1');
      }).not.toThrow();
    });

    it('should handle invalid objective IDs gracefully', () => {
      const scenario = createMockScenario('error-test');
      scenarioEngine.registerScenario(scenario);
      const instance = scenarioEngine.loadScenario('error-test', 'player-1');
      
      expect(() => {
        scenarioEngine.updateObjectiveProgress(instance.id, 'invalid-objective', 0.5);
      }).not.toThrow();
    });
  });

  // Helper functions
  function createMockScenario(
    id: string,
    category: ScenarioCategory = ScenarioCategory.TUTORIAL,
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER,
    prerequisites: string[] = []
  ): Scenario {
    return {
      id,
      name: `Test Scenario ${id}`,
      description: 'A test scenario',
      difficulty,
      environment: {
        type: EnvironmentType.HOME,
        layout: {
          width: 8,
          height: 6,
          walls: [],
          doors: [],
          windows: [],
          gridSize: 1
        },
        furniture: [
          {
            id: 'test-table',
            type: 'table' as any,
            position: { x: 2, y: 2 },
            rotation: 0,
            size: { width: 2, height: 1 },
            blocksPlacement: false
          }
        ],
        constraints: [],
        ambientConditions: {
          temperature: 22,
          humidity: 45,
          lightLevel: 0.7,
          noiseLevel: 0.3,
          airQuality: 0.8
        }
      },
      presetDevices: [
        {
          id: 'test-device',
          type: DeviceCategory.COMFORT,
          position: { x: 1, y: 1 },
          personality: [PersonalityTrait.HELPFUL],
          objectives: ['Test objective'],
          constraints: [],
          initialState: {
            active: true,
            resourceUsage: { energy: 0.3, bandwidth: 0.1, processing: 0.2, memory: 0.1 },
            connections: [],
            mood: EmotionState.NEUTRAL,
            learningProgress: 0.5
          },
          locked: false
        }
      ],
      objectives: [
        {
          id: 'test-objective-1',
          description: 'Complete first test objective',
          type: ObjectiveType.CREATE_DEVICE,
          target: { type: 'string', value: 'test' },
          measurable: true,
          weight: 0.5,
          optional: false
        },
        {
          id: 'test-objective-2',
          description: 'Complete second test objective',
          type: ObjectiveType.ACHIEVE_COOPERATION,
          target: { type: 'numeric', value: 0.8 },
          measurable: true,
          weight: 0.5,
          optional: false
        }
      ],
      successCriteria: [
        {
          type: SuccessType.OBJECTIVES_COMPLETED,
          threshold: 1.0,
          description: 'Complete all objectives',
          weight: 1.0
        }
      ],
      failureConditions: [
        {
          type: FailureType.TIME_EXCEEDED,
          threshold: 600,
          description: 'Complete within time limit',
          recoverable: false
        }
      ],
      timeLimit: 600,
      hints: [],
      category,
      tags: ['test'],
      educationalFocus: [LearningCategory.AI_BASICS],
      prerequisites,
      unlocks: []
    };
  }

  function createMockPlayerProgress(): PlayerProgress {
    return {
      completedTutorials: [],
      unlockedScenarios: [],
      achievements: [],
      skillLevels: [],
      learningAnalytics: [],
      totalPlayTime: 0,
      lastPlayed: Date.now(),
      preferences: {
        difficulty: DifficultyLevel.INTERMEDIATE,
        hintFrequency: 'normal' as any,
        audioEnabled: true,
        visualEffectsLevel: 'normal' as any,
        colorScheme: 'default' as any,
        fontSize: 'medium' as any,
        autoSave: true,
        skipAnimations: false
      }
    };
  }
});