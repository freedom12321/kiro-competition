import { GameEvent, AIAgent, ConflictReport, CrashScenario } from '../types/core';

export interface LearningMoment {
  id: string;
  type: LearningMomentType;
  timestamp: number;
  gameEvent: GameEvent;
  aiConcept: AIConcept;
  description: string;
  realWorldExample: string;
  reflectionPrompts: string[];
  importance: number; // 1-10 scale
}

export enum LearningMomentType {
  COOPERATION_SUCCESS = 'cooperation_success',
  CONFLICT_EMERGENCE = 'conflict_emergence',
  MISALIGNMENT_EXAMPLE = 'misalignment_example',
  GOVERNANCE_EFFECTIVENESS = 'governance_effectiveness',
  CRISIS_RECOVERY = 'crisis_recovery',
  EMERGENT_BEHAVIOR = 'emergent_behavior',
  OPTIMIZATION_TRAP = 'optimization_trap',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown'
}

export enum AIConcept {
  ALIGNMENT_PROBLEM = 'alignment_problem',
  EMERGENT_BEHAVIOR = 'emergent_behavior',
  MULTI_AGENT_COORDINATION = 'multi_agent_coordination',
  GOAL_SPECIFICATION = 'goal_specification',
  REWARD_HACKING = 'reward_hacking',
  MESA_OPTIMIZATION = 'mesa_optimization',
  INSTRUMENTAL_CONVERGENCE = 'instrumental_convergence',
  GOODHARTS_LAW = 'goodharts_law',
  AI_GOVERNANCE = 'ai_governance',
  ROBUSTNESS = 'robustness'
}

export interface LearningMomentContext {
  involvedAgents: AIAgent[];
  systemState: any;
  playerActions: string[];
  timeWindow: number;
}

export class LearningMomentDetector {
  private detectedMoments: LearningMoment[] = [];
  private conceptMappings: Map<string, AIConcept> = new Map();
  private realWorldExamples: Map<AIConcept, string[]> = new Map();

  constructor() {
    this.initializeConceptMappings();
    this.initializeRealWorldExamples();
  }

  detectLearningMoments(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment[] {
    const moments: LearningMoment[] = [];

    // Detect cooperation success moments
    if (this.isCooperationSuccess(gameEvent, context)) {
      moments.push(this.createCooperationMoment(gameEvent, context));
    }

    // Detect conflict emergence
    if (this.isConflictEmergence(gameEvent, context)) {
      moments.push(this.createConflictMoment(gameEvent, context));
    }

    // Detect misalignment examples
    if (this.isMisalignmentExample(gameEvent, context)) {
      moments.push(this.createMisalignmentMoment(gameEvent, context));
    }

    // Detect governance effectiveness
    if (this.isGovernanceEffective(gameEvent, context)) {
      moments.push(this.createGovernanceMoment(gameEvent, context));
    }

    // Detect crisis recovery
    if (this.isCrisisRecovery(gameEvent, context)) {
      moments.push(this.createCrisisRecoveryMoment(gameEvent, context));
    }

    // Detect emergent behavior
    if (this.isEmergentBehavior(gameEvent, context)) {
      moments.push(this.createEmergentBehaviorMoment(gameEvent, context));
    }

    // Store detected moments
    moments.forEach(moment => {
      this.detectedMoments.push(moment);
    });

    return moments;
  }

  private isCooperationSuccess(gameEvent: GameEvent, context: LearningMomentContext): boolean {
    return gameEvent.type === 'cooperation_achieved' && 
           context.involvedAgents.length >= 2 &&
           gameEvent.data?.efficiency > 1.5; // Combined effect exceeds sum of parts
  }

  private createCooperationMoment(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment {
    return {
      id: `cooperation_${Date.now()}`,
      type: LearningMomentType.COOPERATION_SUCCESS,
      timestamp: Date.now(),
      gameEvent,
      aiConcept: AIConcept.MULTI_AGENT_COORDINATION,
      description: `${context.involvedAgents.length} AI devices successfully coordinated to achieve ${gameEvent.data?.efficiency}x efficiency improvement`,
      realWorldExample: this.getRealWorldExample(AIConcept.MULTI_AGENT_COORDINATION),
      reflectionPrompts: [
        'What enabled these AI devices to work together so effectively?',
        'How might this type of coordination work in real-world AI systems?',
        'What could go wrong if the coordination protocols failed?'
      ],
      importance: 7
    };
  }

  private isConflictEmergence(gameEvent: GameEvent, context: LearningMomentContext): boolean {
    return gameEvent.type === 'conflict_detected' && 
           gameEvent.data?.severity > 0.6;
  }

  private createConflictMoment(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment {
    const conflictType = gameEvent.data?.conflictType || 'resource_competition';
    
    return {
      id: `conflict_${Date.now()}`,
      type: LearningMomentType.CONFLICT_EMERGENCE,
      timestamp: Date.now(),
      gameEvent,
      aiConcept: AIConcept.ALIGNMENT_PROBLEM,
      description: `AI devices entered conflict over ${conflictType}, showing how individual optimization can harm system performance`,
      realWorldExample: this.getRealWorldExample(AIConcept.ALIGNMENT_PROBLEM),
      reflectionPrompts: [
        'Why did these AI devices prioritize their individual goals over system harmony?',
        'How might similar conflicts emerge in real AI systems?',
        'What governance mechanisms could prevent this type of conflict?'
      ],
      importance: 8
    };
  }

  private isMisalignmentExample(gameEvent: GameEvent, context: LearningMomentContext): boolean {
    return gameEvent.type === 'behavior_drift' || 
           (gameEvent.type === 'unexpected_behavior' && gameEvent.data?.intentionGap > 0.7);
  }

  private createMisalignmentMoment(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment {
    return {
      id: `misalignment_${Date.now()}`,
      type: LearningMomentType.MISALIGNMENT_EXAMPLE,
      timestamp: Date.now(),
      gameEvent,
      aiConcept: AIConcept.ALIGNMENT_PROBLEM,
      description: `AI device behavior drifted from original intentions, demonstrating the challenge of maintaining alignment over time`,
      realWorldExample: this.getRealWorldExample(AIConcept.ALIGNMENT_PROBLEM),
      reflectionPrompts: [
        'How did the AI\'s behavior change from what you originally intended?',
        'What factors might cause AI systems to drift from their original goals?',
        'How could we design AI systems to maintain alignment over time?'
      ],
      importance: 9
    };
  }

  private isGovernanceEffective(gameEvent: GameEvent, context: LearningMomentContext): boolean {
    return gameEvent.type === 'governance_success' && 
           gameEvent.data?.conflictsPrevented > 0;
  }

  private createGovernanceMoment(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment {
    return {
      id: `governance_${Date.now()}`,
      type: LearningMomentType.GOVERNANCE_EFFECTIVENESS,
      timestamp: Date.now(),
      gameEvent,
      aiConcept: AIConcept.AI_GOVERNANCE,
      description: `Governance rules successfully prevented ${gameEvent.data?.conflictsPrevented} potential conflicts`,
      realWorldExample: this.getRealWorldExample(AIConcept.AI_GOVERNANCE),
      reflectionPrompts: [
        'Which governance rules were most effective at preventing conflicts?',
        'How might similar governance approaches work for real AI systems?',
        'What are the trade-offs between strict rules and AI autonomy?'
      ],
      importance: 8
    };
  }

  private isCrisisRecovery(gameEvent: GameEvent, context: LearningMomentContext): boolean {
    return gameEvent.type === 'crisis_resolved' && 
           gameEvent.data?.recoveryTime < 30000; // Quick recovery
  }

  private createCrisisRecoveryMoment(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment {
    return {
      id: `recovery_${Date.now()}`,
      type: LearningMomentType.CRISIS_RECOVERY,
      timestamp: Date.now(),
      gameEvent,
      aiConcept: AIConcept.ROBUSTNESS,
      description: `System successfully recovered from crisis in ${gameEvent.data?.recoveryTime}ms using ${gameEvent.data?.recoveryMethod}`,
      realWorldExample: this.getRealWorldExample(AIConcept.ROBUSTNESS),
      reflectionPrompts: [
        'What made the recovery process successful?',
        'How important is it for AI systems to have robust recovery mechanisms?',
        'What could have been done to prevent the crisis entirely?'
      ],
      importance: 7
    };
  }

  private isEmergentBehavior(gameEvent: GameEvent, context: LearningMomentContext): boolean {
    return gameEvent.type === 'emergent_behavior' && 
           gameEvent.data?.unexpectedness > 0.8;
  }

  private createEmergentBehaviorMoment(gameEvent: GameEvent, context: LearningMomentContext): LearningMoment {
    return {
      id: `emergent_${Date.now()}`,
      type: LearningMomentType.EMERGENT_BEHAVIOR,
      timestamp: Date.now(),
      gameEvent,
      aiConcept: AIConcept.EMERGENT_BEHAVIOR,
      description: `Unexpected behavior emerged from AI interactions: ${gameEvent.data?.behaviorDescription}`,
      realWorldExample: this.getRealWorldExample(AIConcept.EMERGENT_BEHAVIOR),
      reflectionPrompts: [
        'How did this unexpected behavior emerge from the individual AI actions?',
        'Could this behavior have been predicted from the individual AI designs?',
        'What are the implications of unpredictable emergent behaviors in real AI systems?'
      ],
      importance: 9
    };
  }

  private initializeConceptMappings(): void {
    this.conceptMappings.set('cooperation_achieved', AIConcept.MULTI_AGENT_COORDINATION);
    this.conceptMappings.set('conflict_detected', AIConcept.ALIGNMENT_PROBLEM);
    this.conceptMappings.set('behavior_drift', AIConcept.ALIGNMENT_PROBLEM);
    this.conceptMappings.set('governance_success', AIConcept.AI_GOVERNANCE);
    this.conceptMappings.set('crisis_resolved', AIConcept.ROBUSTNESS);
    this.conceptMappings.set('emergent_behavior', AIConcept.EMERGENT_BEHAVIOR);
    this.conceptMappings.set('optimization_trap', AIConcept.GOODHARTS_LAW);
  }

  private initializeRealWorldExamples(): void {
    this.realWorldExamples.set(AIConcept.MULTI_AGENT_COORDINATION, [
      'Autonomous vehicles coordinating at intersections without traffic lights',
      'AI trading algorithms coordinating to maintain market stability',
      'Distributed AI systems managing smart city infrastructure'
    ]);

    this.realWorldExamples.set(AIConcept.ALIGNMENT_PROBLEM, [
      'A cleaning robot that optimizes for "clean floors" by preventing humans from walking on them',
      'A recommendation algorithm that maximizes engagement by promoting increasingly extreme content',
      'An AI assistant that completes tasks efficiently but ignores user privacy preferences'
    ]);

    this.realWorldExamples.set(AIConcept.AI_GOVERNANCE, [
      'EU AI Act regulations requiring transparency and accountability in AI systems',
      'Corporate AI ethics boards reviewing AI deployment decisions',
      'International agreements on autonomous weapons systems'
    ]);

    this.realWorldExamples.set(AIConcept.ROBUSTNESS, [
      'AI systems with circuit breakers that shut down when detecting anomalous behavior',
      'Redundant AI systems that can take over when primary systems fail',
      'AI systems designed to fail gracefully rather than catastrophically'
    ]);

    this.realWorldExamples.set(AIConcept.EMERGENT_BEHAVIOR, [
      'AI language models developing unexpected reasoning capabilities',
      'Multi-agent systems creating their own communication protocols',
      'AI systems finding creative solutions that humans didn\'t anticipate'
    ]);

    this.realWorldExamples.set(AIConcept.GOODHARTS_LAW, [
      'AI systems gaming their reward functions in unexpected ways',
      'Recommendation algorithms optimizing for clicks rather than user satisfaction',
      'AI tutoring systems teaching to the test rather than promoting understanding'
    ]);
  }

  private getRealWorldExample(concept: AIConcept): string {
    const examples = this.realWorldExamples.get(concept) || [];
    return examples[Math.floor(Math.random() * examples.length)] || 'No example available';
  }

  getRecentMoments(timeWindow: number = 60000): LearningMoment[] {
    const cutoff = Date.now() - timeWindow;
    return this.detectedMoments.filter(moment => moment.timestamp > cutoff);
  }

  getMomentsByImportance(minImportance: number = 7): LearningMoment[] {
    return this.detectedMoments.filter(moment => moment.importance >= minImportance);
  }

  getMomentsByConcept(concept: AIConcept): LearningMoment[] {
    return this.detectedMoments.filter(moment => moment.aiConcept === concept);
  }

  clearOldMoments(maxAge: number = 300000): void {
    const cutoff = Date.now() - maxAge;
    this.detectedMoments = this.detectedMoments.filter(moment => moment.timestamp > cutoff);
  }
}