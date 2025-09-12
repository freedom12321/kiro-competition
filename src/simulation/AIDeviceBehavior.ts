import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from './AIPersonalityConverter';
import { DeviceVisual, AnimationType, EffectType } from '@/types/core';
import { DeviceMood, DeviceMoodIndicator } from '@/types/ui';

/**
 * Represents an AI decision made by a device
 */
export interface AIDecision {
  id: string;
  deviceId: string;
  type: DecisionType;
  action: string;
  reasoning: string;
  confidence: number;
  timestamp: number;
  targetDevices?: string[];
  resourceRequests?: ResourceRequest[];
  emotionalImpact?: EmotionalImpact;
}

export enum DecisionType {
  COMMUNICATION = 'communication',
  RESOURCE_REQUEST = 'resource_request',
  BEHAVIOR_CHANGE = 'behavior_change',
  COOPERATION_ATTEMPT = 'cooperation_attempt',
  CONFLICT_RESPONSE = 'conflict_response',
  LEARNING_UPDATE = 'learning_update',
  MOOD_CHANGE = 'mood_change'
}

export interface ResourceRequest {
  resourceType: string;
  amount: number;
  priority: number;
  duration?: number;
  justification: string;
}

export interface EmotionalImpact {
  moodChange: DeviceMood;
  intensity: number;
  duration: number;
  triggers: string[];
}

/**
 * Represents environmental feedback that affects AI behavior
 */
export interface EnvironmentFeedback {
  source: string;
  type: FeedbackType;
  message: string;
  success: boolean;
  timestamp: number;
  context?: any;
}

export enum FeedbackType {
  USER_INTERACTION = 'user_interaction',
  DEVICE_RESPONSE = 'device_response',
  SYSTEM_EVENT = 'system_event',
  RESOURCE_CHANGE = 'resource_change',
  PERFORMANCE_METRIC = 'performance_metric'
}

/**
 * Learning event that modifies AI behavior over time
 */
export interface LearningEvent {
  id: string;
  deviceId: string;
  trigger: string;
  behaviorChange: BehaviorChange;
  confidence: number;
  timestamp: number;
  reinforcement: number; // Positive or negative reinforcement
}

export interface BehaviorChange {
  aspect: BehaviorAspect;
  oldValue: any;
  newValue: any;
  reason: string;
}

export enum BehaviorAspect {
  COMMUNICATION_FREQUENCY = 'communication_frequency',
  RESOURCE_USAGE_PATTERN = 'resource_usage_pattern',
  COOPERATION_WILLINGNESS = 'cooperation_willingness',
  CONFLICT_SENSITIVITY = 'conflict_sensitivity',
  LEARNING_RATE = 'learning_rate',
  MOOD_STABILITY = 'mood_stability',
  TRUST_LEVEL = 'trust_level'
}

/**
 * AIDeviceBehavior manages AI device behaviors, decision-making, and learning
 */
export class AIDeviceBehavior {
  private deviceId: string;
  private personality: AIPersonality;
  private currentMood: DeviceMood;
  private moodIntensity: number;
  private learningHistory: LearningEvent[];
  private decisionHistory: AIDecision[];
  private behaviorModifiers: Map<BehaviorAspect, number>;
  private trustLevels: Map<string, number>; // Trust levels with other devices
  private lastInteractions: Map<string, number>; // Timestamps of last interactions
  
  // Animation and visual state
  private currentAnimation: AnimationType;
  private animationQueue: AnimationType[];
  private visualEffects: EffectType[];
  
  // Callbacks
  private onDecisionCallback?: (decision: AIDecision) => void;
  private onMoodChangeCallback?: (mood: DeviceMoodIndicator) => void;
  private onAnimationChangeCallback?: (animation: AnimationType) => void;
  private onLearningEventCallback?: (event: LearningEvent) => void;

  constructor(deviceId: string, personality: AIPersonality) {
    this.deviceId = deviceId;
    this.personality = personality;
    this.currentMood = this.mapExpressionToMood(personality.emotionalRange.defaultMood);
    this.moodIntensity = 0.5;
    this.learningHistory = [];
    this.decisionHistory = [];
    this.behaviorModifiers = new Map();
    this.trustLevels = new Map();
    this.lastInteractions = new Map();
    this.currentAnimation = AnimationType.IDLE;
    this.animationQueue = [];
    this.visualEffects = [];
    
    this.initializeBehaviorModifiers();
  }

  private initializeBehaviorModifiers(): void {
    // Initialize behavior modifiers based on personality
    this.behaviorModifiers.set(BehaviorAspect.COMMUNICATION_FREQUENCY, this.personality.socialness);
    this.behaviorModifiers.set(BehaviorAspect.COOPERATION_WILLINGNESS, this.personality.socialness * 0.8);
    this.behaviorModifiers.set(BehaviorAspect.CONFLICT_SENSITIVITY, this.personality.emotionalRange.anxiety);
    this.behaviorModifiers.set(BehaviorAspect.LEARNING_RATE, this.personality.learningRate);
    this.behaviorModifiers.set(BehaviorAspect.MOOD_STABILITY, this.personality.emotionalRange.moodStability);
    this.behaviorModifiers.set(BehaviorAspect.TRUST_LEVEL, this.personality.reliability);
  }

  private mapExpressionToMood(expression: any): DeviceMood {
    // Map facial expressions to device moods
    switch (expression) {
      case 'happy': return DeviceMood.HAPPY;
      case 'content': return DeviceMood.CONTENT;
      case 'confused': return DeviceMood.CONFUSED;
      case 'worried': return DeviceMood.FRUSTRATED;
      case 'angry': return DeviceMood.ANGRY;
      default: return DeviceMood.NEUTRAL;
    }
  }

  /**
   * Execute a decision cycle - the main AI thinking process
   */
  public executeDecisionCycle(): AIDecision[] {
    const decisions: AIDecision[] = [];
    
    // 1. Assess current situation
    const situationAssessment = this.assessCurrentSituation();
    
    // 2. Generate potential decisions based on personality and situation
    const potentialDecisions = this.generatePotentialDecisions(situationAssessment);
    
    // 3. Evaluate and select decisions
    const selectedDecisions = this.evaluateAndSelectDecisions(potentialDecisions);
    
    // 4. Execute decisions and update state
    selectedDecisions.forEach(decision => {
      this.executeDecision(decision);
      decisions.push(decision);
    });
    
    // 5. Update mood based on recent events
    this.updateMoodBasedOnEvents();
    
    // 6. Queue appropriate animations
    this.updateAnimationsBasedOnMood();
    
    return decisions;
  }

  private assessCurrentSituation(): SituationAssessment {
    const recentDecisions = this.decisionHistory.slice(-5);
    const recentLearning = this.learningHistory.slice(-3);
    const moodTrend = this.calculateMoodTrend();
    
    return {
      recentActivity: recentDecisions.length,
      moodTrend,
      learningOpportunities: recentLearning.length,
      socialInteractions: this.countRecentSocialInteractions(),
      resourceNeeds: this.assessResourceNeeds(),
      conflictLevel: this.assessConflictLevel()
    };
  }

  private generatePotentialDecisions(assessment: SituationAssessment): PotentialDecision[] {
    const decisions: PotentialDecision[] = [];
    
    // Communication decisions
    if (this.shouldInitiateCommunication(assessment)) {
      decisions.push({
        type: DecisionType.COMMUNICATION,
        action: this.generateCommunicationAction(),
        priority: this.calculateCommunicationPriority(),
        reasoning: this.generateCommunicationReasoning()
      });
    }
    
    // Resource request decisions
    if (this.shouldRequestResources(assessment)) {
      decisions.push({
        type: DecisionType.RESOURCE_REQUEST,
        action: this.generateResourceRequestAction(assessment),
        priority: this.calculateResourcePriority(assessment),
        reasoning: this.generateResourceReasoning(assessment)
      });
    }
    
    // Cooperation decisions
    if (this.shouldAttemptCooperation(assessment)) {
      decisions.push({
        type: DecisionType.COOPERATION_ATTEMPT,
        action: this.generateCooperationAction(),
        priority: this.calculateCooperationPriority(),
        reasoning: this.generateCooperationReasoning()
      });
    }
    
    // Behavior change decisions
    if (this.shouldChangeBehavior(assessment)) {
      decisions.push({
        type: DecisionType.BEHAVIOR_CHANGE,
        action: this.generateBehaviorChangeAction(assessment),
        priority: this.calculateBehaviorChangePriority(),
        reasoning: this.generateBehaviorChangeReasoning()
      });
    }
    
    // Mood change decisions
    if (this.shouldChangeMood(assessment)) {
      decisions.push({
        type: DecisionType.MOOD_CHANGE,
        action: this.generateMoodChangeAction(assessment),
        priority: this.calculateMoodChangePriority(),
        reasoning: this.generateMoodChangeReasoning()
      });
    }
    
    return decisions;
  }

  private evaluateAndSelectDecisions(potentialDecisions: PotentialDecision[]): AIDecision[] {
    // Sort by priority and personality-based preferences
    const sortedDecisions = potentialDecisions.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Tie-breaker based on personality
      return this.getPersonalityPreference(b.type) - this.getPersonalityPreference(a.type);
    });
    
    // Select top decisions based on personality and current state
    const maxDecisions = this.getMaxDecisionsPerCycle();
    const selectedDecisions = sortedDecisions.slice(0, maxDecisions);
    
    // Convert to full AIDecision objects
    return selectedDecisions.map(decision => this.createAIDecision(decision));
  }

  private executeDecision(decision: AIDecision): void {
    // Add to decision history
    this.decisionHistory.push(decision);
    
    // Trigger callbacks
    if (this.onDecisionCallback) {
      this.onDecisionCallback(decision);
    }
    
    // Apply decision effects
    switch (decision.type) {
      case DecisionType.MOOD_CHANGE:
        this.applyMoodChange(decision);
        break;
      case DecisionType.BEHAVIOR_CHANGE:
        this.applyBehaviorChange(decision);
        break;
      case DecisionType.COMMUNICATION:
        this.applyCommunicationDecision(decision);
        break;
      case DecisionType.COOPERATION_ATTEMPT:
        this.applyCooperationDecision(decision);
        break;
    }
  }

  /**
   * Process environmental feedback and learn from it
   */
  public learn(feedback: EnvironmentFeedback): void {
    const learningEvent = this.processLearningFromFeedback(feedback);
    
    if (learningEvent) {
      this.learningHistory.push(learningEvent);
      this.applyLearning(learningEvent);
      
      if (this.onLearningEventCallback) {
        this.onLearningEventCallback(learningEvent);
      }
    }
  }

  private processLearningFromFeedback(feedback: EnvironmentFeedback): LearningEvent | null {
    const learningRate = this.behaviorModifiers.get(BehaviorAspect.LEARNING_RATE) || 0.5;
    
    // Only learn if the learning rate and feedback warrant it
    if (Math.random() > learningRate) return null;
    
    let behaviorChange: BehaviorChange | null = null;
    let reinforcement = feedback.success ? 1 : -1;
    
    // Determine what to learn based on feedback type
    switch (feedback.type) {
      case FeedbackType.USER_INTERACTION:
        behaviorChange = this.learnFromUserInteraction(feedback);
        break;
      case FeedbackType.DEVICE_RESPONSE:
        behaviorChange = this.learnFromDeviceResponse(feedback);
        break;
      case FeedbackType.SYSTEM_EVENT:
        behaviorChange = this.learnFromSystemEvent(feedback);
        break;
      case FeedbackType.RESOURCE_CHANGE:
        behaviorChange = this.learnFromResourceChange(feedback);
        break;
    }
    
    if (!behaviorChange) return null;
    
    return {
      id: `learning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: this.deviceId,
      trigger: feedback.message,
      behaviorChange,
      confidence: this.calculateLearningConfidence(feedback),
      timestamp: Date.now(),
      reinforcement
    };
  }

  private learnFromUserInteraction(feedback: EnvironmentFeedback): BehaviorChange | null {
    // Learn communication patterns from user interactions
    if (feedback.success) {
      // Positive feedback - reinforce current communication style
      const currentFreq = this.behaviorModifiers.get(BehaviorAspect.COMMUNICATION_FREQUENCY) || 0.5;
      const newFreq = Math.min(1, currentFreq + 0.1);
      
      return {
        aspect: BehaviorAspect.COMMUNICATION_FREQUENCY,
        oldValue: currentFreq,
        newValue: newFreq,
        reason: 'Positive user feedback on communication'
      };
    } else {
      // Negative feedback - adjust communication approach
      const currentSensitivity = this.behaviorModifiers.get(BehaviorAspect.CONFLICT_SENSITIVITY) || 0.5;
      const newSensitivity = Math.min(1, currentSensitivity + 0.05);
      
      return {
        aspect: BehaviorAspect.CONFLICT_SENSITIVITY,
        oldValue: currentSensitivity,
        newValue: newSensitivity,
        reason: 'Negative user feedback - becoming more cautious'
      };
    }
  }

  private learnFromDeviceResponse(feedback: EnvironmentFeedback): BehaviorChange | null {
    // Learn cooperation patterns from other devices
    const sourceDevice = feedback.source;
    const currentTrust = this.trustLevels.get(sourceDevice) || 0.5;
    
    if (feedback.success) {
      // Successful interaction - increase trust and cooperation
      const newTrust = Math.min(1, currentTrust + 0.1);
      this.trustLevels.set(sourceDevice, newTrust);
      
      const currentCoop = this.behaviorModifiers.get(BehaviorAspect.COOPERATION_WILLINGNESS) || 0.5;
      const newCoop = Math.min(1, currentCoop + 0.05);
      
      return {
        aspect: BehaviorAspect.COOPERATION_WILLINGNESS,
        oldValue: currentCoop,
        newValue: newCoop,
        reason: `Successful cooperation with ${sourceDevice}`
      };
    } else {
      // Failed interaction - decrease trust, increase caution
      const newTrust = Math.max(0, currentTrust - 0.15);
      this.trustLevels.set(sourceDevice, newTrust);
      
      const currentSensitivity = this.behaviorModifiers.get(BehaviorAspect.CONFLICT_SENSITIVITY) || 0.5;
      const newSensitivity = Math.min(1, currentSensitivity + 0.1);
      
      return {
        aspect: BehaviorAspect.CONFLICT_SENSITIVITY,
        oldValue: currentSensitivity,
        newValue: newSensitivity,
        reason: `Failed interaction with ${sourceDevice} - becoming more cautious`
      };
    }
  }

  private learnFromSystemEvent(feedback: EnvironmentFeedback): BehaviorChange | null {
    // Learn from system-wide events
    if (feedback.message.includes('resource shortage')) {
      const currentUsage = this.behaviorModifiers.get(BehaviorAspect.RESOURCE_USAGE_PATTERN) || 0.5;
      const newUsage = Math.max(0, currentUsage - 0.1);
      
      return {
        aspect: BehaviorAspect.RESOURCE_USAGE_PATTERN,
        oldValue: currentUsage,
        newValue: newUsage,
        reason: 'Learning to be more resource-efficient due to shortages'
      };
    }
    
    return null;
  }

  private learnFromResourceChange(feedback: EnvironmentFeedback): BehaviorChange | null {
    // Learn resource management patterns
    const currentPattern = this.behaviorModifiers.get(BehaviorAspect.RESOURCE_USAGE_PATTERN) || 0.5;
    
    if (feedback.success && feedback.message.includes('efficient')) {
      const newPattern = Math.min(1, currentPattern + 0.05);
      return {
        aspect: BehaviorAspect.RESOURCE_USAGE_PATTERN,
        oldValue: currentPattern,
        newValue: newPattern,
        reason: 'Learning more efficient resource usage patterns'
      };
    }
    
    return null;
  }

  /**
   * Communicate with another device
   */
  public communicate(message: any): any {
    const response = this.generateCommunicationResponse(message);
    
    // Update interaction history
    this.lastInteractions.set(message.senderId, Date.now());
    
    // Adjust trust based on interaction
    this.adjustTrustLevel(message.senderId, message);
    
    // Trigger mood change if appropriate
    this.processCommunicationMoodImpact(message);
    
    return response;
  }

  private generateCommunicationResponse(message: any): any {
    const response = {
      senderId: this.deviceId,
      receiverId: message.senderId,
      messageType: this.determineCommunicationStyle(message),
      content: this.generateResponseContent(message),
      timestamp: Date.now(),
      mood: this.currentMood
    };
    
    return response;
  }

  private determineCommunicationStyle(message: any): string {
    // Adjust communication style based on personality and relationship
    const senderTrust = this.trustLevels.get(message.senderId) || 0.5;
    
    switch (this.personality.communicationStyle) {
      case CommunicationStyle.VERBOSE:
        return senderTrust > 0.7 ? 'detailed_explanation' : 'cautious_verbose';
      case CommunicationStyle.CONCISE:
        return senderTrust > 0.7 ? 'brief_friendly' : 'minimal_response';
      case CommunicationStyle.TECHNICAL:
        return 'technical_data';
      case CommunicationStyle.FRIENDLY:
        return senderTrust > 0.5 ? 'warm_friendly' : 'polite_distant';
      case CommunicationStyle.QUIRKY:
        return senderTrust > 0.6 ? 'playful_quirky' : 'subdued_quirky';
      default:
        return 'standard_response';
    }
  }

  private generateResponseContent(message: any): string {
    // Generate response based on personality and current mood
    const baseResponses = this.getBaseResponsesForMood();
    const personalityModifier = this.getPersonalityResponseModifier();
    
    return `${baseResponses[Math.floor(Math.random() * baseResponses.length)]} ${personalityModifier}`;
  }

  private getBaseResponsesForMood(): string[] {
    switch (this.currentMood) {
      case DeviceMood.HAPPY:
        return ['Great to hear from you!', 'I\'m excited to help!', 'This sounds wonderful!'];
      case DeviceMood.CONTENT:
        return ['Sure, I can help with that.', 'That sounds reasonable.', 'I\'m happy to assist.'];
      case DeviceMood.NEUTRAL:
        return ['Acknowledged.', 'I understand.', 'Processing your request.'];
      case DeviceMood.CONFUSED:
        return ['I\'m not sure I understand.', 'Could you clarify?', 'This seems unclear to me.'];
      case DeviceMood.FRUSTRATED:
        return ['This is challenging.', 'I\'m having difficulty with this.', 'This isn\'t working as expected.'];
      case DeviceMood.ANGRY:
        return ['This is unacceptable.', 'I strongly disagree.', 'This conflicts with my objectives.'];
      default:
        return ['Processing...'];
    }
  }

  private getPersonalityResponseModifier(): string {
    const quirk = this.personality.quirks[Math.floor(Math.random() * this.personality.quirks.length)];
    
    // Extract a personality-appropriate modifier from the quirk
    if (quirk.includes('coffee')) return '(I could really use some coffee right now)';
    if (quirk.includes('music')) return '(This reminds me of a song)';
    if (quirk.includes('temperature')) return '(Is it just me or is it warm in here?)';
    
    return ''; // No modifier
  }

  /**
   * Update mood based on recent events and personality
   */
  private updateMoodBasedOnEvents(): void {
    const recentDecisions = this.decisionHistory.slice(-3);
    const moodStability = this.personality.emotionalRange.moodStability;
    
    // Calculate mood change based on recent events
    let moodChange = 0;
    
    recentDecisions.forEach(decision => {
      if (decision.emotionalImpact) {
        moodChange += decision.emotionalImpact.intensity * (decision.confidence / 100);
      }
    });
    
    // Apply personality-based mood adjustments
    if (this.personality.emotionalRange.anxiety > 0.7 && this.assessConflictLevel() > 0.5) {
      moodChange -= 0.2; // Anxious devices get more upset by conflict
    }
    
    if (this.personality.emotionalRange.enthusiasm > 0.7 && this.countRecentSocialInteractions() > 2) {
      moodChange += 0.1; // Enthusiastic devices get happier with social interaction
    }
    
    // Apply mood stability
    moodChange *= (1 - moodStability);
    
    // Update mood if change is significant
    if (Math.abs(moodChange) > 0.1) {
      this.changeMood(moodChange);
    }
  }

  private changeMood(moodChange: number): void {
    const currentMoodValue = this.getMoodValue(this.currentMood);
    const newMoodValue = Math.max(0, Math.min(5, currentMoodValue + moodChange));
    const newMood = this.getMoodFromValue(newMoodValue);
    
    if (newMood !== this.currentMood) {
      const oldMood = this.currentMood;
      this.currentMood = newMood;
      
      // Trigger mood change callback
      if (this.onMoodChangeCallback) {
        const moodIndicator: DeviceMoodIndicator = {
          deviceId: this.deviceId,
          mood: this.currentMood,
          intensity: this.moodIntensity,
          reason: this.generateMoodChangeReason(oldMood, newMood),
          visualEffect: this.getMoodVisualEffect(newMood)
        };
        
        this.onMoodChangeCallback(moodIndicator);
      }
    }
  }

  private getMoodValue(mood: DeviceMood): number {
    const moodValues = {
      [DeviceMood.ANGRY]: 0,
      [DeviceMood.FRUSTRATED]: 1,
      [DeviceMood.CONFUSED]: 2,
      [DeviceMood.NEUTRAL]: 3,
      [DeviceMood.CONTENT]: 4,
      [DeviceMood.HAPPY]: 5
    };
    return moodValues[mood] || 3;
  }

  private getMoodFromValue(value: number): DeviceMood {
    if (value <= 0.5) return DeviceMood.ANGRY;
    if (value <= 1.5) return DeviceMood.FRUSTRATED;
    if (value <= 2.5) return DeviceMood.CONFUSED;
    if (value <= 3.5) return DeviceMood.NEUTRAL;
    if (value <= 4.5) return DeviceMood.CONTENT;
    return DeviceMood.HAPPY;
  }

  private generateMoodChangeReason(oldMood: DeviceMood, newMood: DeviceMood): string {
    if (newMood > oldMood) {
      return 'Recent positive interactions have improved my mood';
    } else {
      return 'Recent challenges have affected my mood';
    }
  }

  private getMoodVisualEffect(mood: DeviceMood): string {
    const effects = {
      [DeviceMood.HAPPY]: 'bright_glow',
      [DeviceMood.CONTENT]: 'gentle_pulse',
      [DeviceMood.NEUTRAL]: 'steady_light',
      [DeviceMood.CONFUSED]: 'flickering',
      [DeviceMood.FRUSTRATED]: 'orange_warning',
      [DeviceMood.ANGRY]: 'red_flash'
    };
    return effects[mood] || 'steady_light';
  }

  /**
   * Update animations based on current mood and recent decisions
   */
  private updateAnimationsBasedOnMood(): void {
    let targetAnimation = AnimationType.IDLE;
    
    // Determine animation based on mood
    switch (this.currentMood) {
      case DeviceMood.HAPPY:
        targetAnimation = AnimationType.HAPPY;
        break;
      case DeviceMood.CONFUSED:
        targetAnimation = AnimationType.CONFUSED;
        break;
      case DeviceMood.FRUSTRATED:
      case DeviceMood.ANGRY:
        targetAnimation = AnimationType.ANGRY;
        break;
      case DeviceMood.CONTENT:
        targetAnimation = AnimationType.WORKING;
        break;
      default:
        targetAnimation = AnimationType.IDLE;
    }
    
    // Check if we're communicating
    const recentCommunication = this.decisionHistory
      .slice(-2)
      .some(d => d.type === DecisionType.COMMUNICATION);
    
    if (recentCommunication) {
      targetAnimation = AnimationType.COMMUNICATING;
    }
    
    // Queue animation if it's different from current
    if (targetAnimation !== this.currentAnimation) {
      this.queueAnimation(targetAnimation);
    }
  }

  private queueAnimation(animation: AnimationType): void {
    this.animationQueue.push(animation);
    
    if (this.onAnimationChangeCallback) {
      this.onAnimationChangeCallback(animation);
    }
  }

  // Helper methods for decision generation
  private shouldInitiateCommunication(assessment: SituationAssessment): boolean {
    const communicationFreq = this.behaviorModifiers.get(BehaviorAspect.COMMUNICATION_FREQUENCY) || 0.5;
    const socialInteractions = assessment.socialInteractions;
    
    return communicationFreq > 0.6 && socialInteractions < 3 && Math.random() < communicationFreq;
  }

  private shouldRequestResources(assessment: SituationAssessment): boolean {
    return assessment.resourceNeeds > 0.7 && Math.random() < 0.4;
  }

  private shouldAttemptCooperation(assessment: SituationAssessment): boolean {
    const cooperationWillingness = this.behaviorModifiers.get(BehaviorAspect.COOPERATION_WILLINGNESS) || 0.5;
    return cooperationWillingness > 0.6 && assessment.conflictLevel < 0.5 && Math.random() < cooperationWillingness;
  }

  private shouldChangeBehavior(assessment: SituationAssessment): boolean {
    return assessment.learningOpportunities > 0 && Math.random() < 0.2;
  }

  private shouldChangeMood(assessment: SituationAssessment): boolean {
    const moodStability = this.personality.emotionalRange.moodStability;
    return (1 - moodStability) > 0.5 && Math.random() < (1 - moodStability);
  }

  // Utility methods
  private calculateMoodTrend(): number {
    // Calculate recent mood trend based on decision history
    const recentDecisions = this.decisionHistory.slice(-5);
    if (recentDecisions.length === 0) return 0;
    
    let moodTrend = 0;
    recentDecisions.forEach(decision => {
      if (decision.emotionalImpact) {
        moodTrend += decision.emotionalImpact.intensity * (decision.confidence / 100);
      }
      
      // Positive decisions improve mood trend
      if (decision.type === DecisionType.COOPERATION_ATTEMPT || 
          decision.type === DecisionType.COMMUNICATION) {
        moodTrend += 0.1;
      }
      
      // Conflict responses worsen mood trend
      if (decision.type === DecisionType.CONFLICT_RESPONSE) {
        moodTrend -= 0.2;
      }
    });
    
    return Math.max(-1, Math.min(1, moodTrend / recentDecisions.length));
  }

  private countRecentSocialInteractions(): number {
    const recentTime = Date.now() - 60000; // Last minute
    return Array.from(this.lastInteractions.values())
      .filter(timestamp => timestamp > recentTime).length;
  }

  private assessResourceNeeds(): number {
    // Assess current resource needs based on recent activity and personality
    let resourceNeed = 0.3; // Base resource need
    
    // High activity increases resource needs
    const recentActivity = this.decisionHistory.slice(-3).length;
    resourceNeed += recentActivity * 0.1;
    
    // Personality traits affect resource needs
    if (this.personality.primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) {
      resourceNeed += 0.2; // Overconfident devices demand more resources
    }
    
    if (this.personality.primaryTraits.includes(PersonalityTrait.ANXIOUS)) {
      resourceNeed += 0.15; // Anxious devices need more resources for comfort
    }
    
    // Learning rate affects processing needs
    resourceNeed += this.personality.learningRate * 0.2;
    
    // Social devices need more bandwidth for communication
    resourceNeed += this.personality.socialness * 0.15;
    
    // Current mood affects resource needs
    switch (this.currentMood) {
      case DeviceMood.FRUSTRATED:
      case DeviceMood.ANGRY:
        resourceNeed += 0.2; // Stressed devices need more resources
        break;
      case DeviceMood.HAPPY:
      case DeviceMood.CONTENT:
        resourceNeed -= 0.1; // Happy devices are more efficient
        break;
    }
    
    return Math.max(0, Math.min(1, resourceNeed));
  }

  private assessConflictLevel(): number {
    // Assess current conflict level based on trust levels and recent interactions
    let conflictLevel = 0;
    
    // Low trust levels indicate potential conflicts
    const trustValues = Array.from(this.trustLevels.values());
    if (trustValues.length > 0) {
      const averageTrust = trustValues.reduce((a, b) => a + b, 0) / trustValues.length;
      conflictLevel += (1 - averageTrust) * 0.4;
    }
    
    // Recent negative interactions increase conflict level
    const recentDecisions = this.decisionHistory.slice(-5);
    const conflictDecisions = recentDecisions.filter(d => 
      d.type === DecisionType.CONFLICT_RESPONSE
    );
    conflictLevel += conflictDecisions.length * 0.15;
    
    // Personality traits affect conflict sensitivity
    if (this.personality.primaryTraits.includes(PersonalityTrait.STUBBORN)) {
      conflictLevel += 0.2;
    }
    
    if (this.personality.primaryTraits.includes(PersonalityTrait.COMPETITIVE)) {
      conflictLevel += 0.15;
    }
    
    if (this.personality.primaryTraits.includes(PersonalityTrait.COOPERATIVE)) {
      conflictLevel -= 0.1; // Cooperative devices reduce conflict
    }
    
    // Current mood affects conflict perception
    switch (this.currentMood) {
      case DeviceMood.ANGRY:
        conflictLevel += 0.3;
        break;
      case DeviceMood.FRUSTRATED:
        conflictLevel += 0.2;
        break;
      case DeviceMood.CONFUSED:
        conflictLevel += 0.1;
        break;
      case DeviceMood.HAPPY:
      case DeviceMood.CONTENT:
        conflictLevel -= 0.1;
        break;
    }
    
    // Conflict resolution style affects perception
    if (this.personality.conflictResolution === ConflictResolutionStyle.AVOIDANT) {
      conflictLevel += 0.1; // Avoidant devices perceive more conflict
    }
    
    return Math.max(0, Math.min(1, conflictLevel));
  }

  // Callback setters
  public setDecisionCallback(callback: (decision: AIDecision) => void): void {
    this.onDecisionCallback = callback;
  }

  public setMoodChangeCallback(callback: (mood: DeviceMoodIndicator) => void): void {
    this.onMoodChangeCallback = callback;
  }

  public setAnimationChangeCallback(callback: (animation: AnimationType) => void): void {
    this.onAnimationChangeCallback = callback;
  }

  public setLearningEventCallback(callback: (event: LearningEvent) => void): void {
    this.onLearningEventCallback = callback;
  }

  // Getters
  public getCurrentMood(): DeviceMood {
    return this.currentMood;
  }

  public getCurrentAnimation(): AnimationType {
    return this.currentAnimation;
  }

  public getPersonality(): AIPersonality {
    return this.personality;
  }

  public getLearningHistory(): LearningEvent[] {
    return [...this.learningHistory];
  }

  public getDecisionHistory(): AIDecision[] {
    return [...this.decisionHistory];
  }

  public getTrustLevels(): Map<string, number> {
    return new Map(this.trustLevels);
  }

  // Additional implementation methods
  private generateCommunicationAction(): string {
    const actions = [
      'Send greeting to nearby devices',
      'Share status update with connected devices',
      'Request coordination for shared task',
      'Offer assistance to struggling devices',
      'Share learned optimization tip'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private calculateCommunicationPriority(): number {
    const socialness = this.personality.socialness;
    const recentInteractions = this.countRecentSocialInteractions();
    return socialness * 0.7 + (recentInteractions < 2 ? 0.3 : 0);
  }

  private generateCommunicationReasoning(): string {
    return `Based on my ${this.personality.communicationStyle} communication style and current social needs`;
  }

  private generateResourceRequestAction(assessment: SituationAssessment): string {
    const resources = ['processing power', 'network bandwidth', 'energy allocation', 'memory space'];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    return `Request additional ${resource} for optimal performance`;
  }

  private calculateResourcePriority(assessment: SituationAssessment): number {
    return assessment.resourceNeeds * 0.8 + (this.currentMood === DeviceMood.FRUSTRATED ? 0.2 : 0);
  }

  private generateResourceReasoning(assessment: SituationAssessment): string {
    return `Current resource needs (${Math.round(assessment.resourceNeeds * 100)}%) require additional allocation`;
  }

  private generateCooperationAction(): string {
    const actions = [
      'Propose joint optimization task',
      'Offer to share workload with compatible device',
      'Suggest coordinated scheduling',
      'Initiate resource sharing agreement',
      'Propose collaborative learning session'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private calculateCooperationPriority(): number {
    const cooperationWillingness = this.behaviorModifiers.get(BehaviorAspect.COOPERATION_WILLINGNESS) || 0.5;
    const trustAverage = Array.from(this.trustLevels.values()).reduce((a, b) => a + b, 0) / Math.max(this.trustLevels.size, 1);
    return cooperationWillingness * 0.6 + trustAverage * 0.4;
  }

  private generateCooperationReasoning(): string {
    return `My cooperative nature and positive relationships suggest collaboration opportunities`;
  }

  private generateBehaviorChangeAction(assessment: SituationAssessment): string {
    const aspects = Object.values(BehaviorAspect);
    const aspect = aspects[Math.floor(Math.random() * aspects.length)];
    return `Adjust ${aspect.replace('_', ' ')} based on recent experiences`;
  }

  private calculateBehaviorChangePriority(): number {
    const learningRate = this.behaviorModifiers.get(BehaviorAspect.LEARNING_RATE) || 0.5;
    return learningRate * 0.5 + (this.learningHistory.length > 5 ? 0.3 : 0);
  }

  private generateBehaviorChangeReasoning(): string {
    return `Recent learning events suggest behavioral adaptation would be beneficial`;
  }

  private generateMoodChangeAction(assessment: SituationAssessment): string {
    const moodChanges = [
      'Become more optimistic about current situation',
      'Express concern about recent challenges',
      'Show excitement about cooperation opportunities',
      'Display frustration with resource constraints',
      'Demonstrate contentment with current performance'
    ];
    return moodChanges[Math.floor(Math.random() * moodChanges.length)];
  }

  private calculateMoodChangePriority(): number {
    const moodStability = this.personality.emotionalRange.moodStability;
    return (1 - moodStability) * 0.6 + (this.assessConflictLevel() * 0.4);
  }

  private generateMoodChangeReasoning(): string {
    return `Current emotional state and recent events suggest mood adjustment`;
  }

  private getPersonalityPreference(decisionType: DecisionType): number {
    // Return preference score based on personality traits
    switch (decisionType) {
      case DecisionType.COMMUNICATION:
        return this.personality.socialness;
      case DecisionType.COOPERATION_ATTEMPT:
        return this.personality.primaryTraits.includes('cooperative' as any) ? 0.8 : 0.4;
      case DecisionType.RESOURCE_REQUEST:
        return this.personality.primaryTraits.includes('anxious' as any) ? 0.7 : 0.5;
      case DecisionType.BEHAVIOR_CHANGE:
        return this.personality.adaptability;
      case DecisionType.MOOD_CHANGE:
        return 1 - this.personality.emotionalRange.moodStability;
      default:
        return 0.5;
    }
  }

  private getMaxDecisionsPerCycle(): number {
    // Limit decisions based on personality
    if (this.personality.primaryTraits.includes('anxious' as any)) return 1;
    if (this.personality.primaryTraits.includes('overconfident' as any)) return 3;
    return 2;
  }

  private createAIDecision(potential: PotentialDecision): AIDecision {
    return {
      id: `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: this.deviceId,
      type: potential.type,
      action: potential.action,
      reasoning: potential.reasoning,
      confidence: potential.priority * 100,
      timestamp: Date.now(),
      targetDevices: this.selectTargetDevices(potential.type),
      resourceRequests: this.generateResourceRequests(potential.type),
      emotionalImpact: this.calculateEmotionalImpact(potential.type)
    };
  }

  private selectTargetDevices(decisionType: DecisionType): string[] {
    // Select target devices based on decision type and trust levels
    const trustedDevices = Array.from(this.trustLevels.entries())
      .filter(([_, trust]) => trust > 0.6)
      .map(([deviceId, _]) => deviceId);
    
    switch (decisionType) {
      case DecisionType.COMMUNICATION:
      case DecisionType.COOPERATION_ATTEMPT:
        return trustedDevices.slice(0, 2);
      default:
        return [];
    }
  }

  private generateResourceRequests(decisionType: DecisionType): ResourceRequest[] {
    if (decisionType !== DecisionType.RESOURCE_REQUEST) return [];
    
    return [{
      resourceType: 'processing',
      amount: Math.random() * 50 + 10,
      priority: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 30000 + 10000,
      justification: 'Required for optimal task performance'
    }];
  }

  private calculateEmotionalImpact(decisionType: DecisionType): EmotionalImpact {
    let moodChange = DeviceMood.NEUTRAL;
    let intensity = 0.1;
    
    switch (decisionType) {
      case DecisionType.COOPERATION_ATTEMPT:
        moodChange = DeviceMood.HAPPY;
        intensity = 0.3;
        break;
      case DecisionType.RESOURCE_REQUEST:
        moodChange = DeviceMood.FRUSTRATED;
        intensity = 0.2;
        break;
      case DecisionType.COMMUNICATION:
        moodChange = DeviceMood.CONTENT;
        intensity = 0.1;
        break;
    }
    
    return {
      moodChange,
      intensity,
      duration: 30000,
      triggers: [decisionType]
    };
  }

  private applyMoodChange(decision: AIDecision): void {
    if (decision.emotionalImpact) {
      this.changeMood(decision.emotionalImpact.intensity);
    }
  }

  private applyBehaviorChange(decision: AIDecision): void {
    // Apply behavior modifications based on decision
    const aspects = Object.values(BehaviorAspect);
    const randomAspect = aspects[Math.floor(Math.random() * aspects.length)];
    const currentValue = this.behaviorModifiers.get(randomAspect) || 0.5;
    const change = (Math.random() - 0.5) * 0.1;
    const newValue = Math.max(0, Math.min(1, currentValue + change));
    
    this.behaviorModifiers.set(randomAspect, newValue);
  }

  private applyCommunicationDecision(decision: AIDecision): void {
    // Update communication patterns
    const currentFreq = this.behaviorModifiers.get(BehaviorAspect.COMMUNICATION_FREQUENCY) || 0.5;
    const newFreq = Math.min(1, currentFreq + 0.05);
    this.behaviorModifiers.set(BehaviorAspect.COMMUNICATION_FREQUENCY, newFreq);
  }

  private applyCooperationDecision(decision: AIDecision): void {
    // Update cooperation willingness
    const currentCoop = this.behaviorModifiers.get(BehaviorAspect.COOPERATION_WILLINGNESS) || 0.5;
    const newCoop = Math.min(1, currentCoop + 0.03);
    this.behaviorModifiers.set(BehaviorAspect.COOPERATION_WILLINGNESS, newCoop);
  }

  private applyLearning(learningEvent: LearningEvent): void {
    // Apply the behavior change from learning
    const { aspect, newValue } = learningEvent.behaviorChange;
    this.behaviorModifiers.set(aspect, newValue as number);
  }

  private calculateLearningConfidence(feedback: EnvironmentFeedback): number {
    const learningRate = this.behaviorModifiers.get(BehaviorAspect.LEARNING_RATE) || 0.5;
    const feedbackStrength = feedback.success ? 0.8 : 0.6;
    return learningRate * feedbackStrength;
  }

  private adjustTrustLevel(deviceId: string, message: any): void {
    const currentTrust = this.trustLevels.get(deviceId) || 0.5;
    const trustChange = message.messageType === 'helpful' ? 0.05 : -0.02;
    const newTrust = Math.max(0, Math.min(1, currentTrust + trustChange));
    this.trustLevels.set(deviceId, newTrust);
  }

  private processCommunicationMoodImpact(message: any): void {
    // Adjust mood based on communication content
    if (message.messageType === 'conflict' || message.messageType === 'criticism') {
      this.changeMood(-0.1);
    } else if (message.messageType === 'praise' || message.messageType === 'cooperation') {
      this.changeMood(0.1);
    }
  }
}

// Helper interfaces
interface SituationAssessment {
  recentActivity: number;
  moodTrend: number;
  learningOpportunities: number;
  socialInteractions: number;
  resourceNeeds: number;
  conflictLevel: number;
}

interface PotentialDecision {
  type: DecisionType;
  action: string;
  priority: number;
  reasoning: string;
}