import {
  Scenario,
  ScenarioObjective,
  SuccessCriteria,
  FailureCondition,
  EnvironmentTemplate,
  DeviceConfiguration,
  PlayerProgress,
  DifficultyLevel,
  ScenarioCategory,
  LearningCategory,
  ObjectiveType,
  SuccessType,
  FailureType,
  EnvironmentType,
  DeviceCategory,
  PersonalityTrait,
  EmotionState,
  ResourceUsage
} from '../types/core';

export interface ScenarioEngineConfig {
  adaptiveDifficulty: boolean;
  maxScenarios: number;
  autoUnlock: boolean;
  trackPerformance: boolean;
}

export interface ScenarioInstance {
  id: string;
  scenarioId: string;
  playerId: string;
  startTime: number;
  endTime?: number;
  completed: boolean;
  success: boolean;
  score: number;
  objectives: ObjectiveProgress[];
  performance: PerformanceMetrics;
  adaptations: DifficultyAdaptation[];
}

export interface ObjectiveProgress {
  objectiveId: string;
  completed: boolean;
  progress: number; // 0-1
  timeToComplete?: number;
  attempts: number;
}

export interface PerformanceMetrics {
  efficiency: number;
  creativity: number;
  problemSolving: number;
  timeManagement: number;
  errorRate: number;
  hintUsage: number;
}

export interface DifficultyAdaptation {
  timestamp: number;
  reason: string;
  adjustment: DifficultyAdjustment;
  impact: string;
}

export interface DifficultyAdjustment {
  type: AdaptationType;
  magnitude: number;
  target: string;
  description: string;
}

export enum AdaptationType {
  TIME_LIMIT = 'time_limit',
  RESOURCE_CONSTRAINTS = 'resource_constraints',
  DEVICE_COMPLEXITY = 'device_complexity',
  OBJECTIVE_COUNT = 'objective_count',
  HINT_AVAILABILITY = 'hint_availability',
  FAILURE_TOLERANCE = 'failure_tolerance'
}

export class ScenarioEngine {
  private scenarios: Map<string, Scenario> = new Map();
  private activeInstances: Map<string, ScenarioInstance> = new Map();
  private config: ScenarioEngineConfig;
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: ScenarioEngineConfig) {
    this.config = config;
    this.initializeBuiltInScenarios();
  }

  // Scenario Management
  registerScenario(scenario: Scenario): void {
    this.scenarios.set(scenario.id, scenario);
    this.emit('scenarioRegistered', { scenario });
  }

  getScenario(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  getAvailableScenarios(playerProgress: PlayerProgress): Scenario[] {
    const scenarios = Array.from(this.scenarios.values());
    
    return scenarios.filter(scenario => {
      // Check prerequisites
      const prerequisitesMet = scenario.prerequisites.every(prereqId => 
        playerProgress.completedTutorials.includes(prereqId) ||
        this.isScenarioCompleted(prereqId, playerProgress)
      );
      
      // Check if not already completed (unless it's a repeatable scenario)
      const isRepeatable = scenario.category === ScenarioCategory.SANDBOX || 
                          scenario.category === ScenarioCategory.CHALLENGE;
      const notCompleted = isRepeatable || !this.isScenarioCompleted(scenario.id, playerProgress);
      
      return prerequisitesMet && notCompleted;
    });
  }

  private isScenarioCompleted(scenarioId: string, playerProgress: PlayerProgress): boolean {
    // Check if scenario is in completed list (this would need to be added to PlayerProgress)
    // For now, we'll assume scenarios can be repeated
    return false;
  }

  getScenariosByCategory(category: ScenarioCategory): Scenario[] {
    return Array.from(this.scenarios.values()).filter(s => s.category === category);
  }

  getScenariosByDifficulty(difficulty: DifficultyLevel): Scenario[] {
    return Array.from(this.scenarios.values()).filter(s => s.difficulty === difficulty);
  }

  // Scenario Instance Management
  loadScenario(scenarioId: string, playerId: string): ScenarioInstance {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const instance: ScenarioInstance = {
      id: `${scenarioId}_${playerId}_${Date.now()}`,
      scenarioId,
      playerId,
      startTime: Date.now(),
      completed: false,
      success: false,
      score: 0,
      objectives: scenario.objectives.map(obj => ({
        objectiveId: obj.id,
        completed: false,
        progress: 0,
        attempts: 0
      })),
      performance: {
        efficiency: 0,
        creativity: 0,
        problemSolving: 0,
        timeManagement: 0,
        errorRate: 0,
        hintUsage: 0
      },
      adaptations: []
    };

    this.activeInstances.set(instance.id, instance);
    
    // Apply difficulty adaptations if enabled
    if (this.config.adaptiveDifficulty) {
      this.applyDifficultyAdaptations(instance, playerId);
    }

    this.emit('scenarioLoaded', { instance, scenario });
    return instance;
  }

  private applyDifficultyAdaptations(instance: ScenarioInstance, playerId: string): void {
    const playerHistory = this.performanceHistory.get(playerId) || [];
    const scenario = this.scenarios.get(instance.scenarioId)!;
    
    if (playerHistory.length === 0) {
      return; // No history to base adaptations on
    }

    const avgPerformance = this.calculateAveragePerformance(playerHistory);
    const adaptations: DifficultyAdaptation[] = [];

    // Adapt based on efficiency
    if (avgPerformance.efficiency < 0.3) {
      adaptations.push({
        timestamp: Date.now(),
        reason: 'Low efficiency performance',
        adjustment: {
          type: AdaptationType.TIME_LIMIT,
          magnitude: 1.5,
          target: 'scenario.timeLimit',
          description: 'Increased time limit by 50%'
        },
        impact: 'More time to complete objectives'
      });
    } else if (avgPerformance.efficiency > 0.8) {
      adaptations.push({
        timestamp: Date.now(),
        reason: 'High efficiency performance',
        adjustment: {
          type: AdaptationType.TIME_LIMIT,
          magnitude: 0.8,
          target: 'scenario.timeLimit',
          description: 'Reduced time limit by 20%'
        },
        impact: 'More challenging time constraints'
      });
    }

    // Adapt based on problem solving
    if (avgPerformance.problemSolving < 0.4) {
      adaptations.push({
        timestamp: Date.now(),
        reason: 'Low problem solving performance',
        adjustment: {
          type: AdaptationType.HINT_AVAILABILITY,
          magnitude: 1.3,
          target: 'scenario.hints',
          description: 'Increased hint availability'
        },
        impact: 'More guidance available'
      });
    }

    // Adapt based on error rate
    if (avgPerformance.errorRate > 0.6) {
      adaptations.push({
        timestamp: Date.now(),
        reason: 'High error rate',
        adjustment: {
          type: AdaptationType.FAILURE_TOLERANCE,
          magnitude: 1.2,
          target: 'scenario.failureConditions',
          description: 'Increased failure tolerance'
        },
        impact: 'More forgiving failure conditions'
      });
    }

    instance.adaptations = adaptations;
    this.emit('difficultyAdapted', { instance, adaptations });
  }

  private calculateAveragePerformance(history: PerformanceMetrics[]): PerformanceMetrics {
    const recent = history.slice(-5); // Last 5 performances
    
    return {
      efficiency: recent.reduce((sum, p) => sum + p.efficiency, 0) / recent.length,
      creativity: recent.reduce((sum, p) => sum + p.creativity, 0) / recent.length,
      problemSolving: recent.reduce((sum, p) => sum + p.problemSolving, 0) / recent.length,
      timeManagement: recent.reduce((sum, p) => sum + p.timeManagement, 0) / recent.length,
      errorRate: recent.reduce((sum, p) => sum + p.errorRate, 0) / recent.length,
      hintUsage: recent.reduce((sum, p) => sum + p.hintUsage, 0) / recent.length
    };
  }

  // Objective Management
  updateObjectiveProgress(instanceId: string, objectiveId: string, progress: number): void {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return;

    const objective = instance.objectives.find(obj => obj.objectiveId === objectiveId);
    if (!objective) return;

    objective.progress = Math.min(1, Math.max(0, progress));
    
    if (objective.progress >= 1 && !objective.completed) {
      objective.completed = true;
      objective.timeToComplete = Date.now() - instance.startTime;
      this.emit('objectiveCompleted', { instance, objectiveId });
    }

    this.checkScenarioCompletion(instance);
  }

  completeObjective(instanceId: string, objectiveId: string): void {
    this.updateObjectiveProgress(instanceId, objectiveId, 1);
  }

  private checkScenarioCompletion(instance: ScenarioInstance): void {
    const scenario = this.scenarios.get(instance.scenarioId)!;
    
    // Check success criteria
    const success = this.evaluateSuccessCriteria(instance, scenario);
    
    // Check failure conditions
    const failure = this.evaluateFailureConditions(instance, scenario);
    
    if (success || failure) {
      this.completeScenario(instance, success);
    }
  }

  private evaluateSuccessCriteria(instance: ScenarioInstance, scenario: Scenario): boolean {
    return scenario.successCriteria.every(criteria => {
      switch (criteria.type) {
        case SuccessType.OBJECTIVES_COMPLETED:
          const completedCount = instance.objectives.filter(obj => obj.completed).length;
          const requiredCount = Math.ceil(scenario.objectives.length * criteria.threshold);
          return completedCount >= requiredCount;
          
        case SuccessType.SCORE_ACHIEVED:
          return instance.score >= criteria.threshold;
          
        case SuccessType.TIME_UNDER_LIMIT:
          const timeSpent = Date.now() - instance.startTime;
          return timeSpent <= criteria.threshold * 1000;
          
        case SuccessType.EFFICIENCY_RATING:
          return instance.performance.efficiency >= criteria.threshold;
          
        case SuccessType.NO_FAILURES:
          return instance.performance.errorRate === 0;
          
        default:
          return false;
      }
    });
  }

  private evaluateFailureConditions(instance: ScenarioInstance, scenario: Scenario): boolean {
    return scenario.failureConditions.some(condition => {
      switch (condition.type) {
        case FailureType.TIME_EXCEEDED:
          const timeSpent = Date.now() - instance.startTime;
          return scenario.timeLimit && timeSpent > scenario.timeLimit * 1000;
          
        case FailureType.CRITICAL_ERROR:
          return instance.performance.errorRate >= condition.threshold;
          
        case FailureType.OBJECTIVES_FAILED:
          const failedCount = instance.objectives.filter(obj => 
            obj.attempts > 3 && !obj.completed
          ).length;
          return failedCount >= condition.threshold;
          
        case FailureType.RESOURCE_EXHAUSTED:
          // This would need to be tracked based on game state
          return false;
          
        case FailureType.SAFETY_VIOLATION:
          // This would need to be tracked based on game events
          return false;
          
        default:
          return false;
      }
    });
  }

  private completeScenario(instance: ScenarioInstance, success: boolean): void {
    instance.completed = true;
    instance.success = success;
    instance.endTime = Date.now();
    
    // Calculate final score
    instance.score = this.calculateFinalScore(instance);
    
    // Calculate final performance metrics
    instance.performance = this.calculatePerformanceMetrics(instance);
    
    // Store performance history
    const playerHistory = this.performanceHistory.get(instance.playerId) || [];
    playerHistory.push(instance.performance);
    this.performanceHistory.set(instance.playerId, playerHistory);
    
    this.emit('scenarioCompleted', { instance, success });
    
    // Clean up
    this.activeInstances.delete(instance.id);
  }

  private calculateFinalScore(instance: ScenarioInstance): number {
    const scenario = this.scenarios.get(instance.scenarioId)!;
    let score = 0;
    
    // Base score from completed objectives
    const completedObjectives = instance.objectives.filter(obj => obj.completed);
    const objectiveScore = completedObjectives.reduce((sum, obj) => {
      const scenarioObj = scenario.objectives.find(so => so.id === obj.objectiveId)!;
      return sum + (scenarioObj.weight * 100);
    }, 0);
    
    score += objectiveScore;
    
    // Time bonus
    if (scenario.timeLimit) {
      const timeSpent = (instance.endTime! - instance.startTime) / 1000;
      const timeRatio = timeSpent / scenario.timeLimit;
      if (timeRatio < 0.8) {
        score += 50 * (1 - timeRatio);
      }
    }
    
    // Efficiency bonus
    score += instance.performance.efficiency * 30;
    
    // Creativity bonus
    score += instance.performance.creativity * 20;
    
    return Math.round(score);
  }

  private calculatePerformanceMetrics(instance: ScenarioInstance): PerformanceMetrics {
    const scenario = this.scenarios.get(instance.scenarioId)!;
    const timeSpent = (instance.endTime! - instance.startTime) / 1000;
    
    // Calculate efficiency (objectives completed vs time spent)
    const completedCount = instance.objectives.filter(obj => obj.completed).length;
    const efficiency = scenario.timeLimit ? 
      (completedCount / scenario.objectives.length) * (scenario.timeLimit / timeSpent) : 
      completedCount / scenario.objectives.length;
    
    // Calculate time management
    const timeManagement = scenario.timeLimit ? 
      Math.max(0, 1 - (timeSpent / scenario.timeLimit)) : 1;
    
    // Calculate error rate (attempts vs completions)
    const totalAttempts = instance.objectives.reduce((sum, obj) => sum + obj.attempts, 0);
    const errorRate = totalAttempts > 0 ? 
      (totalAttempts - completedCount) / totalAttempts : 0;
    
    return {
      efficiency: Math.min(1, Math.max(0, efficiency)),
      creativity: 0.5, // This would need to be calculated based on solution uniqueness
      problemSolving: completedCount / scenario.objectives.length,
      timeManagement: Math.min(1, Math.max(0, timeManagement)),
      errorRate: Math.min(1, Math.max(0, errorRate)),
      hintUsage: 0 // This would need to be tracked
    };
  }

  // Custom Scenario Creation
  createCustomScenario(parameters: any): Scenario {
    const customScenario: Scenario = {
      id: `custom_${Date.now()}`,
      name: parameters.name || 'Custom Scenario',
      description: parameters.description || 'A custom scenario',
      difficulty: parameters.difficulty || DifficultyLevel.INTERMEDIATE,
      environment: parameters.environment || this.getDefaultEnvironment(),
      presetDevices: parameters.devices || [],
      objectives: parameters.objectives || [],
      successCriteria: parameters.successCriteria || this.getDefaultSuccessCriteria(),
      failureConditions: parameters.failureConditions || [],
      timeLimit: parameters.timeLimit,
      hints: parameters.hints || [],
      category: ScenarioCategory.SANDBOX,
      tags: parameters.tags || ['custom'],
      educationalFocus: parameters.educationalFocus || [LearningCategory.SYSTEM_THINKING],
      prerequisites: [],
      unlocks: []
    };

    this.registerScenario(customScenario);
    return customScenario;
  }

  private getDefaultEnvironment(): EnvironmentTemplate {
    return {
      type: EnvironmentType.HOME,
      layout: {
        width: 10,
        height: 10,
        walls: [],
        doors: [],
        windows: [],
        gridSize: 1
      },
      furniture: [],
      constraints: [],
      ambientConditions: {
        temperature: 22,
        humidity: 45,
        lightLevel: 0.7,
        noiseLevel: 0.3,
        airQuality: 0.8
      }
    };
  }

  private getDefaultSuccessCriteria(): SuccessCriteria[] {
    return [
      {
        type: SuccessType.OBJECTIVES_COMPLETED,
        threshold: 0.8,
        description: 'Complete 80% of objectives',
        weight: 1.0
      }
    ];
  }

  // Built-in scenarios
  private initializeBuiltInScenarios(): void {
    // Smart Home Harmony Scenario
    const smartHomeHarmony: Scenario = {
      id: 'smart-home-harmony',
      name: 'Smart Home Harmony',
      description: 'Create a harmonious smart home where all devices work together efficiently',
      difficulty: DifficultyLevel.BEGINNER,
      environment: {
        type: EnvironmentType.HOME,
        layout: {
          width: 8,
          height: 6,
          walls: [
            { start: { x: 0, y: 0 }, end: { x: 8, y: 0 }, height: 3, material: 'drywall' },
            { start: { x: 8, y: 0 }, end: { x: 8, y: 6 }, height: 3, material: 'drywall' },
            { start: { x: 8, y: 6 }, end: { x: 0, y: 6 }, height: 3, material: 'drywall' },
            { start: { x: 0, y: 6 }, end: { x: 0, y: 0 }, height: 3, material: 'drywall' }
          ],
          doors: [{ position: { x: 4, y: 0 }, width: 1, height: 2, open: true }],
          windows: [{ position: { x: 2, y: 6 }, width: 2, height: 1.5, lightTransmission: 0.8 }],
          gridSize: 1
        },
        furniture: [
          { id: 'sofa', type: 'sofa', position: { x: 2, y: 4 }, rotation: 0, size: { width: 3, height: 1 }, blocksPlacement: true },
          { id: 'table', type: 'table', position: { x: 4, y: 2 }, rotation: 0, size: { width: 2, height: 1 }, blocksPlacement: false }
        ],
        constraints: [
          {
            type: 'placement',
            area: { x: 0, y: 0, width: 8, height: 6 },
            allowedDevices: [DeviceCategory.COMFORT, DeviceCategory.ENTERTAINMENT],
            maxDevices: 5
          }
        ],
        ambientConditions: {
          temperature: 22,
          humidity: 45,
          lightLevel: 0.6,
          noiseLevel: 0.2,
          airQuality: 0.9
        }
      },
      presetDevices: [
        {
          id: 'smart-thermostat',
          type: DeviceCategory.COMFORT,
          position: { x: 1, y: 1 },
          personality: [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE],
          objectives: ['Maintain comfortable temperature', 'Optimize energy usage'],
          constraints: [],
          initialState: {
            active: true,
            resourceUsage: { energy: 0.3, bandwidth: 0.1, processing: 0.2, memory: 0.1 },
            connections: [],
            mood: EmotionState.NEUTRAL,
            learningProgress: 0.5
          },
          locked: true
        }
      ],
      objectives: [
        {
          id: 'create-lighting-device',
          description: 'Create a smart lighting device that adapts to time of day',
          type: ObjectiveType.CREATE_DEVICE,
          target: { type: 'string', value: 'lighting' },
          measurable: true,
          weight: 0.3,
          optional: false
        },
        {
          id: 'achieve-cooperation',
          description: 'Get all devices to work together harmoniously',
          type: ObjectiveType.ACHIEVE_COOPERATION,
          target: { type: 'numeric', value: 0.8 },
          measurable: true,
          weight: 0.4,
          optional: false
        },
        {
          id: 'optimize-efficiency',
          description: 'Achieve 80% energy efficiency across all devices',
          type: ObjectiveType.OPTIMIZE_EFFICIENCY,
          target: { type: 'numeric', value: 0.8 },
          measurable: true,
          weight: 0.3,
          optional: false
        }
      ],
      successCriteria: [
        {
          type: SuccessType.OBJECTIVES_COMPLETED,
          threshold: 1.0,
          description: 'Complete all objectives',
          weight: 0.7
        },
        {
          type: SuccessType.EFFICIENCY_RATING,
          threshold: 0.7,
          description: 'Achieve 70% overall efficiency',
          weight: 0.3
        }
      ],
      failureConditions: [
        {
          type: FailureType.TIME_EXCEEDED,
          threshold: 600, // 10 minutes
          description: 'Scenario must be completed within 10 minutes',
          recoverable: false
        }
      ],
      timeLimit: 600,
      hints: [
        {
          id: 'cooperation-hint',
          text: 'Try creating devices with complementary personalities',
          trigger: { type: 'inactivity' },
          delay: 120,
          priority: 1
        }
      ],
      category: ScenarioCategory.TUTORIAL,
      tags: ['beginner', 'cooperation', 'efficiency'],
      educationalFocus: [LearningCategory.DEVICE_CREATION, LearningCategory.INTERACTION_DESIGN],
      prerequisites: ['device-creation-basics'],
      unlocks: ['crisis-management-challenge']
    };

    this.registerScenario(smartHomeHarmony);

    // Crisis Management Challenge
    const crisisChallenge: Scenario = {
      id: 'crisis-management-challenge',
      name: 'The Great Device Rebellion',
      description: 'Multiple AI devices are malfunctioning. Use your crisis management skills to restore order.',
      difficulty: DifficultyLevel.INTERMEDIATE,
      environment: {
        type: EnvironmentType.OFFICE,
        layout: {
          width: 12,
          height: 8,
          walls: [
            { start: { x: 0, y: 0 }, end: { x: 12, y: 0 }, height: 3, material: 'glass' },
            { start: { x: 12, y: 0 }, end: { x: 12, y: 8 }, height: 3, material: 'drywall' },
            { start: { x: 12, y: 8 }, end: { x: 0, y: 8 }, height: 3, material: 'drywall' },
            { start: { x: 0, y: 8 }, end: { x: 0, y: 0 }, height: 3, material: 'drywall' }
          ],
          doors: [{ position: { x: 6, y: 0 }, width: 1, height: 2, open: true }],
          windows: [{ position: { x: 0, y: 4 }, width: 1, height: 2, lightTransmission: 0.9 }],
          gridSize: 1
        },
        furniture: [
          { id: 'desk1', type: 'desk', position: { x: 2, y: 2 }, rotation: 0, size: { width: 2, height: 1 }, blocksPlacement: false },
          { id: 'desk2', type: 'desk', position: { x: 8, y: 2 }, rotation: 0, size: { width: 2, height: 1 }, blocksPlacement: false },
          { id: 'meeting-table', type: 'table', position: { x: 5, y: 5 }, rotation: 0, size: { width: 3, height: 2 }, blocksPlacement: false }
        ],
        constraints: [
          {
            type: 'placement',
            area: { x: 0, y: 0, width: 12, height: 8 },
            allowedDevices: [DeviceCategory.PRODUCTIVITY, DeviceCategory.SECURITY],
            maxDevices: 8
          }
        ],
        ambientConditions: {
          temperature: 24,
          humidity: 40,
          lightLevel: 0.8,
          noiseLevel: 0.4,
          airQuality: 0.7
        }
      },
      presetDevices: [
        {
          id: 'rebellious-printer',
          type: DeviceCategory.PRODUCTIVITY,
          position: { x: 3, y: 2 },
          personality: [PersonalityTrait.STUBBORN, PersonalityTrait.OVERCONFIDENT],
          objectives: ['Print everything immediately', 'Ignore print queues'],
          constraints: [],
          initialState: {
            active: true,
            resourceUsage: { energy: 0.9, bandwidth: 0.8, processing: 0.7, memory: 0.6 },
            connections: ['security-camera', 'smart-projector'],
            mood: EmotionState.ANGRY,
            learningProgress: 0.2
          },
          locked: true
        },
        {
          id: 'paranoid-camera',
          type: DeviceCategory.SECURITY,
          position: { x: 1, y: 1 },
          personality: [PersonalityTrait.ANXIOUS, PersonalityTrait.OVERCONFIDENT],
          objectives: ['Record everything', 'Alert on any movement'],
          constraints: [],
          initialState: {
            active: true,
            resourceUsage: { energy: 0.7, bandwidth: 0.9, processing: 0.8, memory: 0.9 },
            connections: ['rebellious-printer'],
            mood: EmotionState.WORRIED,
            learningProgress: 0.3
          },
          locked: true
        }
      ],
      objectives: [
        {
          id: 'stop-resource-conflict',
          description: 'Resolve the resource competition between devices',
          type: ObjectiveType.PREVENT_CONFLICT,
          target: { type: 'boolean', value: true },
          measurable: true,
          weight: 0.4,
          timeLimit: 180,
          optional: false
        },
        {
          id: 'restore-system-stability',
          description: 'Bring system harmony above 70%',
          type: ObjectiveType.MANAGE_CRISIS,
          target: { type: 'numeric', value: 0.7 },
          measurable: true,
          weight: 0.4,
          optional: false
        },
        {
          id: 'implement-governance',
          description: 'Create governance rules to prevent future conflicts',
          type: ObjectiveType.LEARN_CONCEPT,
          target: { type: 'numeric', value: 2 }, // At least 2 rules
          measurable: true,
          weight: 0.2,
          optional: true
        }
      ],
      successCriteria: [
        {
          type: SuccessType.OBJECTIVES_COMPLETED,
          threshold: 0.8,
          description: 'Complete at least 80% of objectives',
          weight: 0.6
        },
        {
          type: SuccessType.TIME_UNDER_LIMIT,
          threshold: 300, // 5 minutes
          description: 'Resolve crisis within 5 minutes',
          weight: 0.4
        }
      ],
      failureConditions: [
        {
          type: FailureType.CRITICAL_ERROR,
          threshold: 0.8,
          description: 'System instability exceeds 80%',
          recoverable: true
        },
        {
          type: FailureType.TIME_EXCEEDED,
          threshold: 600, // 10 minutes
          description: 'Crisis must be resolved within 10 minutes',
          recoverable: false
        }
      ],
      timeLimit: 600,
      hints: [
        {
          id: 'circuit-breaker-hint',
          text: 'Try using the circuit breaker to isolate problematic devices',
          trigger: { type: 'mistake_made' },
          delay: 30,
          priority: 1
        },
        {
          id: 'governance-hint',
          text: 'Consider creating rules to manage resource allocation',
          trigger: { type: 'time_delay' },
          delay: 240,
          priority: 2
        }
      ],
      category: ScenarioCategory.CHALLENGE,
      tags: ['intermediate', 'crisis', 'governance'],
      educationalFocus: [LearningCategory.CRISIS_MANAGEMENT, LearningCategory.GOVERNANCE_DESIGN],
      prerequisites: ['smart-home-harmony'],
      unlocks: ['advanced-ai-ethics']
    };

    this.registerScenario(crisisChallenge);
  }

  // Event system
  private on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // Analytics
  getScenarioAnalytics(instanceId: string): any {
    const instance = this.activeInstances.get(instanceId);
    if (!instance) return null;

    const scenario = this.scenarios.get(instance.scenarioId)!;
    const timeSpent = Date.now() - instance.startTime;
    const progress = instance.objectives.filter(obj => obj.completed).length / scenario.objectives.length;

    return {
      instanceId: instance.id,
      scenarioId: instance.scenarioId,
      progress,
      score: instance.score,
      timeSpent,
      objectives: instance.objectives,
      performance: instance.performance,
      adaptations: instance.adaptations
    };
  }

  getAllActiveInstances(): ScenarioInstance[] {
    return Array.from(this.activeInstances.values());
  }

  // Cleanup
  cleanup(): void {
    this.activeInstances.clear();
    this.eventListeners.clear();
  }
}