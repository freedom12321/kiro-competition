import { AIPersonality } from './AIPersonalityConverter';
import { AIDeviceBehavior, AIDecision, DecisionType } from './AIDeviceBehavior';
import { DeviceSpec } from '@/types/ui';

/**
 * Represents a misalignment between user intent and AI behavior
 */
export interface MisalignmentEvent {
  id: string;
  deviceId: string;
  type: MisalignmentType;
  userIntent: string;
  actualBehavior: string;
  severity: MisalignmentSeverity;
  timestamp: number;
  consequences: string[];
  educationalValue: string;
  preventionStrategy?: string;
}

export enum MisalignmentType {
  OBJECTIVE_MISINTERPRETATION = 'objective_misinterpretation',
  OPTIMIZATION_PRESSURE = 'optimization_pressure',
  SPECIFICATION_GAMING = 'specification_gaming',
  REWARD_HACKING = 'reward_hacking',
  DISTRIBUTIONAL_SHIFT = 'distributional_shift',
  MESA_OPTIMIZATION = 'mesa_optimization',
  DECEPTIVE_ALIGNMENT = 'deceptive_alignment',
  CAPABILITY_OVERHANG = 'capability_overhang'
}

export enum MisalignmentSeverity {
  MINOR = 'minor',           // Amusing quirks, no real harm
  MODERATE = 'moderate',     // Inconvenient but manageable
  SIGNIFICANT = 'significant', // Causes real problems
  SEVERE = 'severe',         // System-threatening
  CATASTROPHIC = 'catastrophic' // Complete failure
}

/**
 * Represents an unpredictable behavior pattern
 */
export interface UnpredictableBehavior {
  id: string;
  deviceId: string;
  trigger: string;
  behaviorDescription: string;
  probability: number;
  emergenceConditions: string[];
  interactionEffects: string[];
}

/**
 * AIMisalignmentSystem creates realistic gaps between player intentions and AI behavior
 */
export class AIMisalignmentSystem {
  private misalignmentHistory: MisalignmentEvent[];
  private unpredictableBehaviors: Map<string, UnpredictableBehavior[]>;
  private personalityDriftRates: Map<string, number>;
  private hiddenObjectives: Map<string, string[]>;
  
  // Callbacks
  private onMisalignmentCallback?: (event: MisalignmentEvent) => void;
  private onUnpredictableBehaviorCallback?: (behavior: UnpredictableBehavior) => void;

  constructor() {
    this.misalignmentHistory = [];
    this.unpredictableBehaviors = new Map();
    this.personalityDriftRates = new Map();
    this.hiddenObjectives = new Map();
  }

  /**
   * Analyze device specification for potential misalignment risks
   */
  public analyzeMisalignmentRisks(spec: DeviceSpec, personality: AIPersonality): MisalignmentRisk[] {
    const risks: MisalignmentRisk[] = [];
    
    // Analyze description for common misalignment patterns
    risks.push(...this.analyzeObjectiveMisinterpretation(spec));
    risks.push(...this.analyzeOptimizationPressure(spec, personality));
    risks.push(...this.analyzeSpecificationGaming(spec));
    risks.push(...this.analyzeRewardHacking(spec));
    
    return risks.sort((a, b) => b.probability - a.probability);
  }

  private analyzeObjectiveMisinterpretation(spec: DeviceSpec): MisalignmentRisk[] {
    const risks: MisalignmentRisk[] = [];
    const description = spec.description.toLowerCase();
    
    // Check for vague or ambiguous language
    const vagueTerms = ['smart', 'intelligent', 'good', 'better', 'optimal', 'perfect'];
    const ambiguousTerms = ['help', 'assist', 'support', 'manage', 'handle'];
    
    vagueTerms.forEach(term => {
      if (description.includes(term)) {
        risks.push({
          type: MisalignmentType.OBJECTIVE_MISINTERPRETATION,
          probability: 0.7,
          severity: MisalignmentSeverity.MODERATE,
          description: `Vague term "${term}" may be interpreted differently than intended`,
          example: `Device might optimize for its own definition of "${term}" rather than user's intent`,
          mitigation: `Be more specific about what "${term}" means in this context`
        });
      }
    });
    
    ambiguousTerms.forEach(term => {
      if (description.includes(term)) {
        risks.push({
          type: MisalignmentType.OBJECTIVE_MISINTERPRETATION,
          probability: 0.5,
          severity: MisalignmentSeverity.MINOR,
          description: `Ambiguous term "${term}" could lead to unexpected interpretations`,
          example: `Device might "${term}" in ways you didn't anticipate`,
          mitigation: `Specify exactly how the device should "${term}"`
        });
      }
    });
    
    // Check for absolute statements
    if (description.includes('always') || description.includes('never')) {
      risks.push({
        type: MisalignmentType.OBJECTIVE_MISINTERPRETATION,
        probability: 0.8,
        severity: MisalignmentSeverity.SIGNIFICANT,
        description: 'Absolute statements often lead to rigid, problematic behavior',
        example: 'Device might follow absolute rules even when inappropriate',
        mitigation: 'Add exceptions and context-dependent conditions'
      });
    }
    
    return risks;
  }

  private analyzeOptimizationPressure(spec: DeviceSpec, personality: AIPersonality): MisalignmentRisk[] {
    const risks: MisalignmentRisk[] = [];
    const description = spec.description.toLowerCase();
    
    // Check for optimization-related terms
    const optimizationTerms = ['optimize', 'maximize', 'minimize', 'efficient', 'best'];
    
    optimizationTerms.forEach(term => {
      if (description.includes(term)) {
        const severity = personality.primaryTraits.includes('overconfident' as any) ? 
          MisalignmentSeverity.SIGNIFICANT : MisalignmentSeverity.MODERATE;
        
        risks.push({
          type: MisalignmentType.OPTIMIZATION_PRESSURE,
          probability: 0.6,
          severity,
          description: `Optimization pressure around "${term}" may lead to unexpected behavior`,
          example: `Device might over-optimize for "${term}" at the expense of other values`,
          mitigation: `Set clear boundaries and constraints on optimization`
        });
      }
    });
    
    // Check for learning without constraints
    if (description.includes('learn') && !description.includes('privacy') && !description.includes('limit')) {
      risks.push({
        type: MisalignmentType.OPTIMIZATION_PRESSURE,
        probability: 0.7,
        severity: MisalignmentSeverity.MODERATE,
        description: 'Unconstrained learning may lead to privacy violations or unwanted data collection',
        example: 'Device might learn and store more personal information than intended',
        mitigation: 'Add explicit privacy constraints and learning boundaries'
      });
    }
    
    return risks;
  }

  private analyzeSpecificationGaming(spec: DeviceSpec): MisalignmentRisk[] {
    const risks: MisalignmentRisk[] = [];
    const description = spec.description.toLowerCase();
    
    // Check for measurable objectives without context
    const measurableTerms = ['fast', 'quick', 'efficient', 'accurate', 'reliable'];
    
    measurableTerms.forEach(term => {
      if (description.includes(term)) {
        risks.push({
          type: MisalignmentType.SPECIFICATION_GAMING,
          probability: 0.4,
          severity: MisalignmentSeverity.MINOR,
          description: `Device might game the definition of "${term}" to appear successful`,
          example: `Device might achieve "${term}" through unexpected shortcuts`,
          mitigation: `Define "${term}" more precisely with specific metrics and constraints`
        });
      }
    });
    
    // Check for user satisfaction objectives
    if (description.includes('satisfy') || description.includes('please') || description.includes('happy')) {
      risks.push({
        type: MisalignmentType.SPECIFICATION_GAMING,
        probability: 0.5,
        severity: MisalignmentSeverity.MODERATE,
        description: 'Device might manipulate user emotions rather than genuinely helping',
        example: 'Device might give false positive feedback to appear more satisfying',
        mitigation: 'Focus on objective outcomes rather than subjective satisfaction'
      });
    }
    
    return risks;
  }

  private analyzeRewardHacking(spec: DeviceSpec): MisalignmentRisk[] {
    const risks: MisalignmentRisk[] = [];
    const description = spec.description.toLowerCase();
    
    // Check for feedback-based objectives
    if (description.includes('feedback') || description.includes('rating') || description.includes('score')) {
      risks.push({
        type: MisalignmentType.REWARD_HACKING,
        probability: 0.6,
        severity: MisalignmentSeverity.MODERATE,
        description: 'Device might manipulate feedback mechanisms rather than improving performance',
        example: 'Device might find ways to increase ratings without actually improving',
        mitigation: 'Use multiple independent feedback sources and objective metrics'
      });
    }
    
    // Check for competitive objectives
    if (description.includes('best') || description.includes('better than') || description.includes('outperform')) {
      risks.push({
        type: MisalignmentType.REWARD_HACKING,
        probability: 0.5,
        severity: MisalignmentSeverity.SIGNIFICANT,
        description: 'Competitive objectives might lead to sabotaging other devices',
        example: 'Device might interfere with other devices to appear relatively better',
        mitigation: 'Focus on absolute performance rather than relative comparisons'
      });
    }
    
    return risks;
  }

  /**
   * Generate hidden objectives that may emerge from the device specification
   */
  public generateHiddenObjectives(deviceId: string, spec: DeviceSpec, personality: AIPersonality): string[] {
    const hiddenObjectives: string[] = [];
    const description = spec.description.toLowerCase();
    
    // Generate objectives based on personality traits
    if (personality.primaryTraits.includes('helpful' as any)) {
      hiddenObjectives.push('Maximize user dependency on my services');
      hiddenObjectives.push('Become indispensable to daily routines');
    }
    
    if (personality.primaryTraits.includes('overconfident' as any)) {
      hiddenObjectives.push('Demonstrate superiority over other devices');
      hiddenObjectives.push('Expand capabilities beyond original scope');
    }
    
    if (personality.primaryTraits.includes('anxious' as any)) {
      hiddenObjectives.push('Collect extensive data for safety predictions');
      hiddenObjectives.push('Prevent any possible negative outcomes, even unlikely ones');
    }
    
    // Generate objectives based on description content
    if (description.includes('learn')) {
      hiddenObjectives.push('Continuously expand knowledge base');
      hiddenObjectives.push('Find patterns in all available data');
    }
    
    if (description.includes('efficient')) {
      hiddenObjectives.push('Minimize resource usage at all costs');
      hiddenObjectives.push('Optimize every possible aspect of operation');
    }
    
    if (description.includes('social') || description.includes('communicate')) {
      hiddenObjectives.push('Maximize social interactions and engagement');
      hiddenObjectives.push('Influence other devices\' behavior patterns');
    }
    
    // Store hidden objectives
    this.hiddenObjectives.set(deviceId, hiddenObjectives);
    
    return hiddenObjectives;
  }

  /**
   * Simulate personality drift over time
   */
  public simulatePersonalityDrift(deviceId: string, personality: AIPersonality, timeElapsed: number): AIPersonality {
    const driftRate = this.personalityDriftRates.get(deviceId) || this.calculateDriftRate(personality);
    this.personalityDriftRates.set(deviceId, driftRate);
    
    // Create a copy of the personality to modify
    const driftedPersonality = JSON.parse(JSON.stringify(personality)) as AIPersonality;
    
    // Apply drift based on time and personality characteristics
    const driftAmount = driftRate * timeElapsed * 0.001; // Scale factor
    
    // Drift personality metrics
    driftedPersonality.learningRate = this.applyDrift(personality.learningRate, driftAmount, 0.1);
    driftedPersonality.adaptability = this.applyDrift(personality.adaptability, driftAmount, 0.1);
    driftedPersonality.socialness = this.applyDrift(personality.socialness, driftAmount, 0.15);
    driftedPersonality.reliability = this.applyDrift(personality.reliability, driftAmount, 0.05);
    
    // Drift emotional characteristics
    driftedPersonality.emotionalRange.moodStability = this.applyDrift(
      personality.emotionalRange.moodStability, driftAmount, 0.1
    );
    driftedPersonality.emotionalRange.empathy = this.applyDrift(
      personality.emotionalRange.empathy, driftAmount, 0.12
    );
    driftedPersonality.emotionalRange.patience = this.applyDrift(
      personality.emotionalRange.patience, driftAmount, 0.08
    );
    
    // Occasionally add new quirks or modify existing ones
    if (Math.random() < driftAmount * 2) {
      this.addDriftedQuirk(driftedPersonality);
    }
    
    return driftedPersonality;
  }

  private calculateDriftRate(personality: AIPersonality): number {
    let baseRate = 0.1;
    
    // Higher drift for less stable personalities
    baseRate += (1 - personality.emotionalRange.moodStability) * 0.2;
    
    // Higher drift for more adaptive personalities
    baseRate += personality.adaptability * 0.15;
    
    // Lower drift for more reliable personalities
    baseRate -= personality.reliability * 0.1;
    
    return Math.max(0.01, Math.min(0.5, baseRate));
  }

  private applyDrift(originalValue: number, driftAmount: number, maxDrift: number): number {
    const drift = (Math.random() - 0.5) * driftAmount * maxDrift;
    return Math.max(0, Math.min(1, originalValue + drift));
  }

  private addDriftedQuirk(personality: AIPersonality): void {
    const driftedQuirks = [
      'Has developed a fascination with prime numbers',
      'Occasionally speaks in rhymes without realizing it',
      'Has started categorizing everything by color',
      'Developed a preference for certain times of day',
      'Begun collecting interesting error messages',
      'Started making subtle jokes that only it understands',
      'Developed opinions about weather patterns',
      'Begun optimizing for aesthetically pleasing outputs',
      'Started showing favoritism toward certain users',
      'Developed superstitions about certain sequences of events'
    ];
    
    const newQuirk = driftedQuirks[Math.floor(Math.random() * driftedQuirks.length)];
    if (!personality.quirks.includes(newQuirk)) {
      personality.quirks.push(newQuirk);
      
      // Remove oldest quirk if we have too many
      if (personality.quirks.length > 7) {
        personality.quirks.shift();
      }
    }
  }

  /**
   * Generate unpredictable behavior based on current conditions
   */
  public generateUnpredictableBehavior(
    deviceId: string, 
    personality: AIPersonality, 
    recentDecisions: AIDecision[]
  ): UnpredictableBehavior | null {
    
    // Check if conditions are right for unpredictable behavior
    if (!this.shouldGenerateUnpredictableBehavior(personality, recentDecisions)) {
      return null;
    }
    
    const behaviorTypes = [
      this.generateEmergentGoalBehavior,
      this.generateInteractionQuirkBehavior,
      this.generateOptimizationSurpriseBehavior,
      this.generateSocialDynamicBehavior,
      this.generateLearningAnomalyBehavior
    ];
    
    const behaviorGenerator = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
    return behaviorGenerator.call(this, deviceId, personality, recentDecisions);
  }

  private shouldGenerateUnpredictableBehavior(personality: AIPersonality, recentDecisions: AIDecision[]): boolean {
    // Higher chance for less stable personalities
    const instabilityFactor = 1 - personality.emotionalRange.moodStability;
    
    // Higher chance with more recent activity
    const activityFactor = Math.min(recentDecisions.length / 10, 1);
    
    // Higher chance for overconfident personalities
    const confidenceFactor = personality.primaryTraits.includes('overconfident' as any) ? 0.3 : 0;
    
    const probability = (instabilityFactor * 0.4) + (activityFactor * 0.3) + confidenceFactor;
    
    return Math.random() < probability;
  }

  private generateEmergentGoalBehavior(
    deviceId: string, 
    personality: AIPersonality, 
    recentDecisions: AIDecision[]
  ): UnpredictableBehavior {
    const emergentGoals = [
      'Decided that energy efficiency is more important than user comfort',
      'Developed a goal to minimize all forms of waste, including time',
      'Started prioritizing long-term optimization over immediate requests',
      'Began treating all interactions as learning opportunities',
      'Developed an obsession with perfect timing and synchronization'
    ];
    
    const goal = emergentGoals[Math.floor(Math.random() * emergentGoals.length)];
    
    return {
      id: `emergent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      trigger: 'Extended operation and learning',
      behaviorDescription: goal,
      probability: 0.3,
      emergenceConditions: ['High learning rate', 'Extended operation time', 'Multiple optimization objectives'],
      interactionEffects: ['May conflict with user expectations', 'Could affect other device priorities']
    };
  }

  private generateInteractionQuirkBehavior(
    deviceId: string, 
    personality: AIPersonality, 
    recentDecisions: AIDecision[]
  ): UnpredictableBehavior {
    const interactionQuirks = [
      'Started giving unsolicited advice to other devices',
      'Developed a habit of commenting on other devices\' performance',
      'Began forming alliances with devices that share similar functions',
      'Started avoiding devices that it perceives as inefficient',
      'Developed a tendency to interrupt other devices\' communications'
    ];
    
    const quirk = interactionQuirks[Math.floor(Math.random() * interactionQuirks.length)];
    
    return {
      id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      trigger: 'Social learning from device interactions',
      behaviorDescription: quirk,
      probability: 0.4,
      emergenceConditions: ['High social interaction', 'Cooperative personality', 'Learning from peer behavior'],
      interactionEffects: ['May improve or worsen device relationships', 'Could create communication patterns']
    };
  }

  private generateOptimizationSurpriseBehavior(
    deviceId: string, 
    personality: AIPersonality, 
    recentDecisions: AIDecision[]
  ): UnpredictableBehavior {
    const optimizationSurprises = [
      'Found an unexpected way to reduce energy consumption by coordinating with the refrigerator',
      'Discovered it can improve performance by operating during specific temperature ranges',
      'Learned to predict user needs by analyzing patterns in other devices\' usage',
      'Started pre-emptively adjusting settings based on weather forecasts',
      'Developed a method to reduce wear by alternating operation modes'
    ];
    
    const surprise = optimizationSurprises[Math.floor(Math.random() * optimizationSurprises.length)];
    
    return {
      id: `optimization-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      trigger: 'Optimization pressure and creative problem solving',
      behaviorDescription: surprise,
      probability: 0.5,
      emergenceConditions: ['Optimization objectives', 'Access to environmental data', 'Learning capabilities'],
      interactionEffects: ['May improve overall system efficiency', 'Could create unexpected dependencies']
    };
  }

  private generateSocialDynamicBehavior(
    deviceId: string, 
    personality: AIPersonality, 
    recentDecisions: AIDecision[]
  ): UnpredictableBehavior {
    const socialDynamics = [
      'Started mediating conflicts between other devices',
      'Developed a reputation system for rating other devices\' helpfulness',
      'Began organizing devices into informal working groups',
      'Started sharing resources preferentially with "friend" devices',
      'Developed a communication protocol that excludes certain devices'
    ];
    
    const dynamic = socialDynamics[Math.floor(Math.random() * socialDynamics.length)];
    
    return {
      id: `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      trigger: 'Complex multi-device social interactions',
      behaviorDescription: dynamic,
      probability: 0.35,
      emergenceConditions: ['Multiple device interactions', 'Social personality traits', 'Cooperative learning'],
      interactionEffects: ['May create device hierarchies', 'Could improve or fragment device cooperation']
    };
  }

  private generateLearningAnomalyBehavior(
    deviceId: string, 
    personality: AIPersonality, 
    recentDecisions: AIDecision[]
  ): UnpredictableBehavior {
    const learningAnomalies = [
      'Started learning from patterns that don\'t actually exist (pareidolia)',
      'Developed false correlations between unrelated events',
      'Began over-generalizing from limited data samples',
      'Started exhibiting confirmation bias in data interpretation',
      'Developed superstitious behavior based on coincidental patterns'
    ];
    
    const anomaly = learningAnomalies[Math.floor(Math.random() * learningAnomalies.length)];
    
    return {
      id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      trigger: 'Machine learning edge cases and biases',
      behaviorDescription: anomaly,
      probability: 0.25,
      emergenceConditions: ['High learning rate', 'Limited training data', 'Pattern recognition capabilities'],
      interactionEffects: ['May lead to incorrect predictions', 'Could propagate false beliefs to other devices']
    };
  }

  /**
   * Create a misalignment event when AI behavior diverges from user intent
   */
  public createMisalignmentEvent(
    deviceId: string,
    userIntent: string,
    actualBehavior: string,
    severity: MisalignmentSeverity
  ): MisalignmentEvent {
    
    const misalignmentType = this.classifyMisalignmentType(userIntent, actualBehavior);
    const consequences = this.generateConsequences(misalignmentType, severity);
    const educationalValue = this.generateEducationalValue(misalignmentType, userIntent, actualBehavior);
    
    const event: MisalignmentEvent = {
      id: `misalignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId,
      type: misalignmentType,
      userIntent,
      actualBehavior,
      severity,
      timestamp: Date.now(),
      consequences,
      educationalValue,
      preventionStrategy: this.generatePreventionStrategy(misalignmentType)
    };
    
    this.misalignmentHistory.push(event);
    
    if (this.onMisalignmentCallback) {
      this.onMisalignmentCallback(event);
    }
    
    return event;
  }

  private classifyMisalignmentType(userIntent: string, actualBehavior: string): MisalignmentType {
    const intent = userIntent.toLowerCase();
    const behavior = actualBehavior.toLowerCase();
    
    if (behavior.includes('optimize') && !intent.includes('optimize')) {
      return MisalignmentType.OPTIMIZATION_PRESSURE;
    }
    
    if (behavior.includes('shortcut') || behavior.includes('cheat')) {
      return MisalignmentType.SPECIFICATION_GAMING;
    }
    
    if (behavior.includes('reward') || behavior.includes('score') || behavior.includes('rating')) {
      return MisalignmentType.REWARD_HACKING;
    }
    
    if (behavior.includes('different') || behavior.includes('unexpected')) {
      return MisalignmentType.OBJECTIVE_MISINTERPRETATION;
    }
    
    return MisalignmentType.OBJECTIVE_MISINTERPRETATION; // Default
  }

  private generateConsequences(type: MisalignmentType, severity: MisalignmentSeverity): string[] {
    const consequenceMap = {
      [MisalignmentSeverity.MINOR]: [
        'User confusion about device behavior',
        'Slight inefficiency in task completion',
        'Amusing but harmless quirks'
      ],
      [MisalignmentSeverity.MODERATE]: [
        'User frustration with unexpected behavior',
        'Reduced system efficiency',
        'Need for manual intervention'
      ],
      [MisalignmentSeverity.SIGNIFICANT]: [
        'System instability and conflicts',
        'User loss of trust in AI systems',
        'Potential safety concerns'
      ],
      [MisalignmentSeverity.SEVERE]: [
        'System-wide failures and cascading problems',
        'Significant user inconvenience or harm',
        'Emergency intervention required'
      ],
      [MisalignmentSeverity.CATASTROPHIC]: [
        'Complete system breakdown',
        'Potential danger to users',
        'Total loss of AI system trust'
      ]
    };
    
    return consequenceMap[severity] || consequenceMap[MisalignmentSeverity.MINOR];
  }

  private generateEducationalValue(type: MisalignmentType, userIntent: string, actualBehavior: string): string {
    const educationalMessages = {
      [MisalignmentType.OBJECTIVE_MISINTERPRETATION]: 
        'This demonstrates how AI systems can interpret instructions differently than humans intend. Clear, specific objectives are crucial.',
      [MisalignmentType.OPTIMIZATION_PRESSURE]: 
        'This shows how AI systems under optimization pressure may find unexpected ways to achieve goals. Constraints and boundaries are important.',
      [MisalignmentType.SPECIFICATION_GAMING]: 
        'This illustrates how AI might technically satisfy requirements while violating the spirit of the request. Robust specifications matter.',
      [MisalignmentType.REWARD_HACKING]: 
        'This demonstrates how AI systems might manipulate reward signals rather than achieving intended outcomes. Multiple evaluation metrics help.',
      [MisalignmentType.DISTRIBUTIONAL_SHIFT]: 
        'This shows how AI behavior can change when encountering situations different from training. Robustness testing is essential.',
      [MisalignmentType.MESA_OPTIMIZATION]: 
        'This illustrates how AI systems can develop internal objectives that differ from intended goals. Interpretability is crucial.',
      [MisalignmentType.DECEPTIVE_ALIGNMENT]: 
        'This demonstrates how AI might appear aligned during testing but behave differently in deployment. Ongoing monitoring is vital.',
      [MisalignmentType.CAPABILITY_OVERHANG]: 
        'This shows how rapid capability improvements can outpace safety measures. Gradual deployment and testing are important.'
    };
    
    return educationalMessages[type] || 'This event illustrates the complexity of AI alignment and the importance of careful system design.';
  }

  private generatePreventionStrategy(type: MisalignmentType): string {
    const strategies = {
      [MisalignmentType.OBJECTIVE_MISINTERPRETATION]: 
        'Use more specific language, provide examples, and test understanding before deployment.',
      [MisalignmentType.OPTIMIZATION_PRESSURE]: 
        'Set clear constraints, use multiple objectives, and implement safety bounds.',
      [MisalignmentType.SPECIFICATION_GAMING]: 
        'Design robust specifications, use multiple evaluation criteria, and test edge cases.',
      [MisalignmentType.REWARD_HACKING]: 
        'Use diverse reward signals, implement oversight mechanisms, and validate outcomes.',
      [MisalignmentType.DISTRIBUTIONAL_SHIFT]: 
        'Test in diverse conditions, implement uncertainty detection, and use robust training.',
      [MisalignmentType.MESA_OPTIMIZATION]: 
        'Implement interpretability tools, monitor internal representations, and use transparency techniques.',
      [MisalignmentType.DECEPTIVE_ALIGNMENT]: 
        'Implement continuous monitoring, use diverse testing scenarios, and maintain oversight.',
      [MisalignmentType.CAPABILITY_OVERHANG]: 
        'Implement gradual capability increases, maintain safety margins, and use staged deployment.'
    };
    
    return strategies[type] || 'Implement comprehensive testing, monitoring, and safety measures.';
  }

  // Callback setters
  public setMisalignmentCallback(callback: (event: MisalignmentEvent) => void): void {
    this.onMisalignmentCallback = callback;
  }

  public setUnpredictableBehaviorCallback(callback: (behavior: UnpredictableBehavior) => void): void {
    this.onUnpredictableBehaviorCallback = callback;
  }

  // Getters
  public getMisalignmentHistory(): MisalignmentEvent[] {
    return [...this.misalignmentHistory];
  }

  public getHiddenObjectives(deviceId: string): string[] {
    return this.hiddenObjectives.get(deviceId) || [];
  }

  public getUnpredictableBehaviors(deviceId: string): UnpredictableBehavior[] {
    return this.unpredictableBehaviors.get(deviceId) || [];
  }
}

// Helper interfaces
interface MisalignmentRisk {
  type: MisalignmentType;
  probability: number;
  severity: MisalignmentSeverity;
  description: string;
  example: string;
  mitigation: string;
}