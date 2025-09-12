import { LearningAnalytics, DifficultySettings, SkillLevel } from './LearningAnalytics';
import { AIConcept } from './LearningMomentDetector';

export interface ScenarioParameters {
  id: string;
  complexity: number; // 0-1
  conceptCount: number; // Number of AI concepts involved
  timeLimit?: number; // Optional time constraint
  supportLevel: number; // 0-1, amount of hints/guidance
  challengeType: ChallengeType[];
  prerequisites: AIConcept[];
  adaptiveElements: AdaptiveElement[];
}

export enum ChallengeType {
  PROBLEM_SOLVING = 'problem_solving',
  PATTERN_RECOGNITION = 'pattern_recognition',
  CRITICAL_ANALYSIS = 'critical_analysis',
  CREATIVE_APPLICATION = 'creative_application',
  SYSTEM_DESIGN = 'system_design',
  ETHICAL_REASONING = 'ethical_reasoning'
}

export interface AdaptiveElement {
  type: AdaptiveType;
  trigger: AdaptiveTrigger;
  adjustment: DifficultyAdjustment;
}

export enum AdaptiveType {
  HINT_AVAILABILITY = 'hint_availability',
  TIME_EXTENSION = 'time_extension',
  COMPLEXITY_REDUCTION = 'complexity_reduction',
  ADDITIONAL_EXAMPLES = 'additional_examples',
  GUIDED_REFLECTION = 'guided_reflection',
  PEER_COMPARISON = 'peer_comparison'
}

export interface AdaptiveTrigger {
  condition: TriggerCondition;
  threshold: number;
  timeWindow: number; // milliseconds
}

export enum TriggerCondition {
  LOW_PERFORMANCE = 'low_performance',
  HIGH_PERFORMANCE = 'high_performance',
  STUCK_TOO_LONG = 'stuck_too_long',
  RAPID_SUCCESS = 'rapid_success',
  REPEATED_MISTAKES = 'repeated_mistakes',
  DISENGAGEMENT = 'disengagement'
}

export interface DifficultyAdjustment {
  parameterChanges: Map<string, number>;
  supportChanges: SupportChange[];
  contentModifications: ContentModification[];
}

export interface SupportChange {
  type: SupportType;
  intensity: number; // -1 to 1 (remove to add)
  duration: number; // milliseconds
}

export enum SupportType {
  HINTS = 'hints',
  EXAMPLES = 'examples',
  GUIDED_QUESTIONS = 'guided_questions',
  CONCEPT_REMINDERS = 'concept_reminders',
  PROGRESS_FEEDBACK = 'progress_feedback',
  ENCOURAGEMENT = 'encouragement'
}

export interface ContentModification {
  type: ModificationType;
  target: string;
  change: any;
}

export enum ModificationType {
  ADD_CONCEPT = 'add_concept',
  REMOVE_CONCEPT = 'remove_concept',
  SIMPLIFY_LANGUAGE = 'simplify_language',
  ADD_VISUAL_AID = 'add_visual_aid',
  CHANGE_SCENARIO_CONTEXT = 'change_scenario_context',
  ADJUST_PACING = 'adjust_pacing'
}

export interface PerformanceMetrics {
  accuracy: number; // 0-1
  speed: number; // tasks per minute
  engagement: number; // 0-1
  frustrationLevel: number; // 0-1
  confidenceLevel: number; // 0-1
  helpSeeking: number; // frequency of help requests
}

export class AdaptiveDifficultySystem {
  private analytics: LearningAnalytics;
  private currentScenario: ScenarioParameters | null = null;
  private performanceHistory: PerformanceMetrics[] = [];
  private adaptationLog: AdaptationEvent[] = [];

  constructor(analytics: LearningAnalytics) {
    this.analytics = analytics;
  }

  generateAdaptiveScenario(targetConcepts: AIConcept[], playerSkills: Map<AIConcept, SkillLevel>): ScenarioParameters {
    const difficultySettings = this.analytics.currentDifficultySettings;
    const averageSkillLevel = this.calculateAverageSkillLevel(targetConcepts, playerSkills);
    
    const scenario: ScenarioParameters = {
      id: `adaptive_scenario_${Date.now()}`,
      complexity: this.calculateComplexity(averageSkillLevel, difficultySettings),
      conceptCount: this.determineConceptCount(targetConcepts, difficultySettings),
      supportLevel: this.calculateSupportLevel(averageSkillLevel, difficultySettings),
      challengeType: this.selectChallengeTypes(targetConcepts, averageSkillLevel),
      prerequisites: this.determinePrerequisites(targetConcepts, playerSkills),
      adaptiveElements: this.createAdaptiveElements(averageSkillLevel)
    };

    this.currentScenario = scenario;
    return scenario;
  }

  adaptScenarioInRealTime(performanceMetrics: PerformanceMetrics): ScenarioParameters | null {
    if (!this.currentScenario) return null;

    this.performanceHistory.push(performanceMetrics);
    
    // Check if adaptation is needed
    const adaptationNeeded = this.assessAdaptationNeed(performanceMetrics);
    
    if (adaptationNeeded.length === 0) return null;

    // Apply adaptations
    const adaptedScenario = { ...this.currentScenario };
    
    adaptationNeeded.forEach(adaptation => {
      this.applyAdaptation(adaptedScenario, adaptation, performanceMetrics);
    });

    // Log the adaptation
    this.logAdaptation(adaptationNeeded, performanceMetrics);
    
    this.currentScenario = adaptedScenario;
    return adaptedScenario;
  }

  getOptimalDifficultyCurve(sessionLength: number, targetConcepts: AIConcept[]): DifficultyPoint[] {
    const curve: DifficultyPoint[] = [];
    const segments = Math.max(3, Math.floor(sessionLength / 10)); // 10-minute segments minimum
    
    for (let i = 0; i < segments; i++) {
      const progress = i / (segments - 1); // 0 to 1
      const difficulty = this.calculateOptimalDifficulty(progress, targetConcepts);
      
      curve.push({
        timePoint: (sessionLength * progress),
        difficulty,
        supportLevel: this.calculateOptimalSupport(progress, difficulty),
        focusConcepts: this.selectFocusConceptsForPoint(progress, targetConcepts)
      });
    }

    return curve;
  }

  predictPerformance(scenario: ScenarioParameters, playerSkills: Map<AIConcept, SkillLevel>): PerformancePrediction {
    const skillMatch = this.calculateSkillMatch(scenario, playerSkills);
    const complexityFit = this.assessComplexityFit(scenario, playerSkills);
    const supportAdequacy = this.assessSupportAdequacy(scenario, playerSkills);

    const predictedAccuracy = (skillMatch + complexityFit + supportAdequacy) / 3;
    const predictedEngagement = this.predictEngagement(scenario, playerSkills);
    const predictedFrustration = Math.max(0, 1 - complexityFit - supportAdequacy);

    return {
      expectedAccuracy: predictedAccuracy,
      expectedEngagement: predictedEngagement,
      expectedFrustration: predictedFrustration,
      expectedCompletionTime: this.estimateCompletionTime(scenario, playerSkills),
      riskFactors: this.identifyRiskFactors(scenario, playerSkills),
      recommendations: this.generatePreemptiveRecommendations(scenario, playerSkills)
    };
  }

  private calculateAverageSkillLevel(concepts: AIConcept[], skills: Map<AIConcept, SkillLevel>): number {
    const skillValues = concepts.map(concept => {
      const skill = skills.get(concept);
      return this.getSkillLevelValue(skill || SkillLevel.NOVICE);
    });

    return skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length;
  }

  private getSkillLevelValue(level: SkillLevel): number {
    const values = {
      [SkillLevel.NOVICE]: 0,
      [SkillLevel.BEGINNER]: 1,
      [SkillLevel.INTERMEDIATE]: 2,
      [SkillLevel.ADVANCED]: 3,
      [SkillLevel.EXPERT]: 4
    };
    return values[level];
  }

  private calculateComplexity(averageSkill: number, settings: DifficultySettings): number {
    // Base complexity on skill level and settings
    const baseComplexity = (averageSkill / 4) * 0.7; // 70% based on skill
    const settingsInfluence = settings.scenarioComplexity * 0.3; // 30% from settings
    
    return Math.max(0.1, Math.min(1.0, baseComplexity + settingsInfluence));
  }

  private determineConceptCount(concepts: AIConcept[], settings: DifficultySettings): number {
    const baseCount = Math.min(concepts.length, Math.ceil(settings.conceptIntroductionRate));
    return Math.max(1, baseCount);
  }

  private calculateSupportLevel(averageSkill: number, settings: DifficultySettings): number {
    // More support for lower skill levels
    const skillBasedSupport = 1 - (averageSkill / 4);
    const settingsSupport = settings.supportLevel;
    
    return (skillBasedSupport * 0.6) + (settingsSupport * 0.4);
  }

  private selectChallengeTypes(concepts: AIConcept[], averageSkill: number): ChallengeType[] {
    const types: ChallengeType[] = [];
    
    // Always include problem solving
    types.push(ChallengeType.PROBLEM_SOLVING);
    
    // Add more challenge types based on skill level
    if (averageSkill >= 1) {
      types.push(ChallengeType.PATTERN_RECOGNITION);
    }
    
    if (averageSkill >= 2) {
      types.push(ChallengeType.CRITICAL_ANALYSIS);
    }
    
    if (averageSkill >= 3) {
      types.push(ChallengeType.CREATIVE_APPLICATION);
    }

    return types;
  }

  private determinePrerequisites(concepts: AIConcept[], skills: Map<AIConcept, SkillLevel>): AIConcept[] {
    return concepts.filter(concept => {
      const skill = skills.get(concept);
      return skill && this.getSkillLevelValue(skill) >= 1; // At least beginner
    });
  }

  private createAdaptiveElements(averageSkill: number): AdaptiveElement[] {
    const elements: AdaptiveElement[] = [];

    // Add hint system for lower skill levels
    if (averageSkill < 2) {
      elements.push({
        type: AdaptiveType.HINT_AVAILABILITY,
        trigger: {
          condition: TriggerCondition.STUCK_TOO_LONG,
          threshold: 120000, // 2 minutes
          timeWindow: 300000 // 5 minutes
        },
        adjustment: {
          parameterChanges: new Map([['hintLevel', 1]]),
          supportChanges: [{
            type: SupportType.HINTS,
            intensity: 0.5,
            duration: 60000
          }],
          contentModifications: []
        }
      });
    }

    // Add complexity reduction for struggling players
    elements.push({
      type: AdaptiveType.COMPLEXITY_REDUCTION,
      trigger: {
        condition: TriggerCondition.LOW_PERFORMANCE,
        threshold: 0.3,
        timeWindow: 180000 // 3 minutes
      },
      adjustment: {
        parameterChanges: new Map([['complexity', -0.2]]),
        supportChanges: [{
          type: SupportType.GUIDED_QUESTIONS,
          intensity: 0.7,
          duration: 120000
        }],
        contentModifications: [{
          type: ModificationType.SIMPLIFY_LANGUAGE,
          target: 'instructions',
          change: { level: 'basic' }
        }]
      }
    });

    return elements;
  }

  private assessAdaptationNeed(metrics: PerformanceMetrics): AdaptiveElement[] {
    if (!this.currentScenario) return [];

    const neededAdaptations: AdaptiveElement[] = [];

    this.currentScenario.adaptiveElements.forEach(element => {
      if (this.shouldTriggerAdaptation(element.trigger, metrics)) {
        neededAdaptations.push(element);
      }
    });

    return neededAdaptations;
  }

  private shouldTriggerAdaptation(trigger: AdaptiveTrigger, metrics: PerformanceMetrics): boolean {
    switch (trigger.condition) {
      case TriggerCondition.LOW_PERFORMANCE:
        return metrics.accuracy < trigger.threshold;
      
      case TriggerCondition.HIGH_PERFORMANCE:
        return metrics.accuracy > trigger.threshold;
      
      case TriggerCondition.DISENGAGEMENT:
        return metrics.engagement < trigger.threshold;
      
      case TriggerCondition.STUCK_TOO_LONG:
        // For stuck detection, we need to track time spent, not speed
        // This is a simplified check - in real implementation, we'd track time
        return metrics.speed < 0.1; // Very low speed indicates being stuck
      
      case TriggerCondition.REPEATED_MISTAKES:
        return metrics.accuracy < 0.5 && metrics.frustrationLevel > 0.7;
      
      default:
        return false;
    }
  }

  private applyAdaptation(scenario: ScenarioParameters, adaptation: AdaptiveElement, metrics: PerformanceMetrics): void {
    // Apply parameter changes
    adaptation.adjustment.parameterChanges.forEach((change, parameter) => {
      switch (parameter) {
        case 'complexity':
          scenario.complexity = Math.max(0.1, Math.min(1.0, scenario.complexity + change));
          break;
        case 'supportLevel':
          scenario.supportLevel = Math.max(0.0, Math.min(1.0, scenario.supportLevel + change));
          break;
      }
    });

    // Apply support changes (would be handled by the UI system)
    // Apply content modifications (would be handled by the content system)
  }

  private logAdaptation(adaptations: AdaptiveElement[], metrics: PerformanceMetrics): void {
    const event: AdaptationEvent = {
      timestamp: Date.now(),
      scenarioId: this.currentScenario?.id || 'unknown',
      adaptations: adaptations.map(a => a.type),
      triggerMetrics: { ...metrics },
      reason: this.determineAdaptationReason(adaptations, metrics)
    };

    this.adaptationLog.push(event);
  }

  private determineAdaptationReason(adaptations: AdaptiveElement[], metrics: PerformanceMetrics): string {
    if (metrics.accuracy < 0.3) return 'Low performance detected';
    if (metrics.engagement < 0.4) return 'Disengagement detected';
    if (metrics.frustrationLevel > 0.7) return 'High frustration detected';
    return 'Optimization adjustment';
  }

  private calculateOptimalDifficulty(progress: number, concepts: AIConcept[]): number {
    // Gradual increase with slight dip at the end for consolidation
    if (progress < 0.1) return 0.3; // Easy start
    if (progress < 0.8) return 0.3 + (progress * 0.5); // Gradual increase
    return 0.8 - ((progress - 0.8) * 0.2); // Slight decrease for consolidation
  }

  private calculateOptimalSupport(progress: number, difficulty: number): number {
    // More support at the beginning and when difficulty is high
    const progressSupport = 1 - progress; // Decrease over time
    const difficultySupport = difficulty; // More support for higher difficulty
    
    return (progressSupport * 0.6) + (difficultySupport * 0.4);
  }

  private selectFocusConceptsForPoint(progress: number, concepts: AIConcept[]): AIConcept[] {
    const conceptsPerPoint = Math.max(1, Math.floor(concepts.length * (1 - progress)) + 1);
    return concepts.slice(0, conceptsPerPoint);
  }

  private calculateSkillMatch(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): number {
    const requiredSkills = scenario.prerequisites;
    const matches = requiredSkills.filter(concept => {
      const skill = skills.get(concept);
      return skill && this.getSkillLevelValue(skill) >= 1;
    });

    return requiredSkills.length > 0 ? matches.length / requiredSkills.length : 1;
  }

  private assessComplexityFit(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): number {
    const averageSkill = this.calculateAverageSkillLevel(scenario.prerequisites, skills);
    const skillLevel = averageSkill / 4; // Normalize to 0-1
    
    // Optimal complexity should be slightly above skill level
    const optimalComplexity = Math.min(1, skillLevel + 0.2);
    const complexityDiff = Math.abs(scenario.complexity - optimalComplexity);
    
    return Math.max(0, 1 - complexityDiff);
  }

  private assessSupportAdequacy(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): number {
    const averageSkill = this.calculateAverageSkillLevel(scenario.prerequisites, skills);
    const neededSupport = 1 - (averageSkill / 4); // More support for lower skills
    
    const supportDiff = Math.abs(scenario.supportLevel - neededSupport);
    return Math.max(0, 1 - supportDiff);
  }

  private predictEngagement(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): number {
    const complexityFit = this.assessComplexityFit(scenario, skills);
    const challengeVariety = scenario.challengeType.length / 4; // Normalize
    const conceptRelevance = scenario.prerequisites.length / scenario.conceptCount;
    
    return (complexityFit * 0.5) + (challengeVariety * 0.3) + (conceptRelevance * 0.2);
  }

  private estimateCompletionTime(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): number {
    const baseTime = 15; // 15 minutes base
    const complexityMultiplier = 1 + scenario.complexity;
    const skillMultiplier = 1 / (this.calculateAverageSkillLevel(scenario.prerequisites, skills) / 4 + 0.5);
    
    return baseTime * complexityMultiplier * skillMultiplier;
  }

  private identifyRiskFactors(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): string[] {
    const risks: string[] = [];
    
    if (scenario.complexity > 0.8) {
      risks.push('High complexity may cause frustration');
    }
    
    if (scenario.supportLevel < 0.3) {
      risks.push('Low support level may lead to confusion');
    }
    
    const skillMatch = this.calculateSkillMatch(scenario, skills);
    if (skillMatch < 0.5) {
      risks.push('Skill prerequisites not met');
    }

    return risks;
  }

  private generatePreemptiveRecommendations(scenario: ScenarioParameters, skills: Map<AIConcept, SkillLevel>): string[] {
    const recommendations: string[] = [];
    
    const risks = this.identifyRiskFactors(scenario, skills);
    
    if (risks.includes('High complexity may cause frustration')) {
      recommendations.push('Consider adding more scaffolding and examples');
    }
    
    if (risks.includes('Low support level may lead to confusion')) {
      recommendations.push('Increase hint availability and guided questions');
    }
    
    if (risks.includes('Skill prerequisites not met')) {
      recommendations.push('Provide prerequisite concept review before starting');
    }

    return recommendations;
  }

  // Getter methods
  get currentScenarioParameters(): ScenarioParameters | null {
    return this.currentScenario;
  }

  get recentPerformanceHistory(): PerformanceMetrics[] {
    return this.performanceHistory.slice(-10);
  }

  get adaptationHistory(): AdaptationEvent[] {
    return [...this.adaptationLog];
  }
}

// Supporting interfaces
interface DifficultyPoint {
  timePoint: number;
  difficulty: number;
  supportLevel: number;
  focusConcepts: AIConcept[];
}

interface PerformancePrediction {
  expectedAccuracy: number;
  expectedEngagement: number;
  expectedFrustration: number;
  expectedCompletionTime: number;
  riskFactors: string[];
  recommendations: string[];
}

interface AdaptationEvent {
  timestamp: number;
  scenarioId: string;
  adaptations: AdaptiveType[];
  triggerMetrics: PerformanceMetrics;
  reason: string;
}