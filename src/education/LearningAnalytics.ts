import { LearningMoment, AIConcept } from './LearningMomentDetector';
import { JournalEntry } from './ReflectionJournal';

export enum SkillLevel {
  NOVICE = 'novice',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum MasteryType {
  UNDERSTANDING = 'understanding',
  APPLICATION = 'application',
  ANALYSIS = 'analysis',
  SYNTHESIS = 'synthesis',
  EVALUATION = 'evaluation'
}

export interface PlayerSkill {
  concept: AIConcept;
  level: SkillLevel;
  experiencePoints: number;
  confidence: number; // 0-1
  masteryIndicators: MasteryIndicator[];
  lastUpdated: number;
  learningHistory: LearningEvent[];
}

export interface MasteryIndicator {
  type: MasteryType;
  evidence: string;
  strength: number; // 0-1
  timestamp: number;
}

export interface LearningEvent {
  momentId: string;
  timestamp: number;
  performance: PerformanceData;
  reflection: ReflectionData;
}

export interface PerformanceData {
  accuracy: number;
  speed: number;
  engagement: number;
  difficulty: number;
}

export interface ReflectionData {
  quality: number; // 0-1
  insightCount: number;
  connectionCount: number;
  length: number;
  rating: number;
}

export interface ProgressMetrics {
  learningVelocity: number; // concepts per hour
  engagementLevel: number; // 0-1
  retentionRate: number; // 0-1
  conceptMastery: number; // 0-1
  reflectionQuality: number; // 0-1
  overallProgress: number; // 0-1
}

export interface DifficultySettings {
  scenarioComplexity: number; // 0-1
  conceptIntroductionRate: number; // concepts per session
  supportLevel: number; // 0-1
  challengeIntensity: number; // 0-1
  adaptationSensitivity: number; // 0-1
}

export interface LearningPath {
  currentFocus: AIConcept[];
  skillGaps: SkillGap[];
  learningGoals: LearningGoal[];
  recommendedScenarios: string[];
  estimatedTimeToCompletion: number;
}

export interface SkillGap {
  concept: AIConcept;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  priority: number; // 0-1
  recommendedActions: string[];
}

export interface LearningGoal {
  id: string;
  concept: AIConcept;
  targetLevel: SkillLevel;
  description: string;
  milestones: Milestone[];
  progress: number; // 0-1
  deadline?: number;
}

export interface Milestone {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: number;
  evidence?: string;
}

export interface PersonalizedRecommendation {
  type: string;
  title: string;
  description: string;
  priority: number; // 0-1
  actions: string[];
  estimatedTime: number;
  difficulty: number; // 0-1
}

export interface ProgressReport {
  overallProgress: number; // 0-1
  conceptProgress: Map<AIConcept, number>;
  learningTrends: TrendData[];
  timeSpent: number;
  skillLevelDistribution: Map<SkillLevel, number>;
  recommendedNextSteps: string[];
  strengths: string[];
  areasForImprovement: string[];
}

export interface TrendData {
  date: string;
  metric: string;
  value: number;
}

export class LearningAnalytics {
  private skillLevels: Map<AIConcept, PlayerSkill> = new Map();
  private learningHistory: LearningEvent[] = [];
  private difficultySettings: DifficultySettings;
  private progressMetrics: ProgressMetrics;

  constructor() {
    this.initializeSkillLevels();
    this.difficultySettings = this.getDefaultDifficultySettings();
    this.progressMetrics = this.initializeProgressMetrics();
  }

  trackLearningMoment(moment: LearningMoment, journalEntry: JournalEntry): void {
    const performanceData = this.extractPerformanceData(moment, journalEntry);
    const reflectionData = this.extractReflectionData(journalEntry);

    const learningEvent: LearningEvent = {
      momentId: moment.id,
      timestamp: moment.timestamp,
      performance: performanceData,
      reflection: reflectionData
    };

    this.learningHistory.push(learningEvent);
    this.updateSkillLevel(moment.aiConcept, learningEvent);
    this.updateProgressMetrics();
    this.adaptDifficulty();
  }

  private initializeSkillLevels(): void {
    Object.values(AIConcept).forEach(concept => {
      this.skillLevels.set(concept, {
        concept,
        level: SkillLevel.NOVICE,
        experiencePoints: 0,
        confidence: 0.1,
        masteryIndicators: [],
        lastUpdated: Date.now(),
        learningHistory: []
      });
    });
  }

  private extractPerformanceData(moment: LearningMoment, entry: JournalEntry): PerformanceData {
    return {
      accuracy: this.calculateAccuracy(moment, entry),
      speed: this.calculateSpeed(moment, entry),
      engagement: this.calculateEngagement(entry),
      difficulty: moment.importance / 10
    };
  }

  private extractReflectionData(entry: JournalEntry): ReflectionData {
    return {
      quality: this.assessReflectionQuality(entry),
      insightCount: entry.insights.length,
      connectionCount: entry.connections.length,
      length: entry.playerReflection.length,
      rating: entry.rating
    };
  }

  private calculateAccuracy(moment: LearningMoment, entry: JournalEntry): number {
    // Base accuracy on reflection quality and rating
    const ratingScore = entry.rating / 5;
    const insightScore = Math.min(entry.insights.length / 3, 1);
    const connectionScore = Math.min(entry.connections.length / 2, 1);
    
    return (ratingScore * 0.5) + (insightScore * 0.3) + (connectionScore * 0.2);
  }

  private calculateSpeed(moment: LearningMoment, entry: JournalEntry): number {
    // Estimate speed based on reflection length and quality
    const wordsPerMinute = 50; // Average typing speed
    const estimatedTime = entry.playerReflection.split(' ').length / wordsPerMinute;
    
    // Normalize to 0-1 scale (faster is better)
    return Math.max(0, 1 - (estimatedTime / 10)); // 10 minutes as baseline
  }

  private calculateEngagement(entry: JournalEntry): number {
    let engagement = 0;
    
    // Length indicates engagement
    if (entry.playerReflection.length > 100) engagement += 0.3;
    if (entry.playerReflection.length > 300) engagement += 0.2;
    
    // Insights indicate deep thinking
    engagement += Math.min(entry.insights.length * 0.2, 0.3);
    
    // Connections indicate application
    engagement += Math.min(entry.connections.length * 0.1, 0.2);
    
    return Math.min(engagement, 1);
  }

  private assessReflectionQuality(entry: JournalEntry): number {
    let quality = 0;
    
    const text = entry.playerReflection.toLowerCase();
    
    // Check for analytical thinking
    const analyticalWords = ['because', 'therefore', 'however', 'although', 'since', 'thus'];
    const analyticalCount = analyticalWords.filter(word => text.includes(word)).length;
    quality += Math.min(analyticalCount * 0.1, 0.3);
    
    // Check for questioning
    const questionCount = (text.match(/\?/g) || []).length;
    quality += Math.min(questionCount * 0.05, 0.2);
    
    // Check for examples
    const exampleWords = ['example', 'instance', 'case', 'situation'];
    const exampleCount = exampleWords.filter(word => text.includes(word)).length;
    quality += Math.min(exampleCount * 0.1, 0.2);
    
    // Length indicates depth
    if (text.length > 200) quality += 0.2;
    if (text.length > 500) quality += 0.1;
    
    return Math.min(quality, 1);
  }

  private updateSkillLevel(concept: AIConcept, event: LearningEvent): void {
    const skill = this.skillLevels.get(concept)!;
    
    // Add experience points based on performance
    const experienceGain = this.calculateExperienceGain(event);
    skill.experiencePoints += experienceGain;
    
    // Update confidence based on consistency
    skill.confidence = this.calculateConfidence(skill, event);
    
    // Add mastery indicators
    const indicators = this.identifyMasteryIndicators(event);
    skill.masteryIndicators.push(...indicators);
    
    // Update skill level based on experience and confidence
    skill.level = this.determineSkillLevel(skill);
    
    // Add to learning history
    skill.learningHistory.push(event);
    skill.lastUpdated = Date.now();
    
    this.skillLevels.set(concept, skill);
  }

  private calculateExperienceGain(event: LearningEvent): number {
    const baseGain = 10;
    const performanceMultiplier = (event.performance.accuracy + event.performance.engagement) / 2;
    const reflectionMultiplier = event.reflection.quality;
    
    return baseGain * performanceMultiplier * reflectionMultiplier;
  }

  private calculateConfidence(skill: PlayerSkill, event: LearningEvent): number {
    const recentEvents = skill.learningHistory.slice(-5); // Last 5 events
    recentEvents.push(event);
    
    if (recentEvents.length === 0) return 0.1;
    
    const averagePerformance = recentEvents.reduce((sum, e) => 
      sum + (e.performance.accuracy + e.performance.engagement) / 2, 0) / recentEvents.length;
    
    const consistency = this.calculateConsistency(recentEvents);
    
    return Math.min((averagePerformance * 0.7) + (consistency * 0.3), 1);
  }

  private calculateConsistency(events: LearningEvent[]): number {
    if (events.length < 2) return 0.5;
    
    const performances = events.map(e => (e.performance.accuracy + e.performance.engagement) / 2);
    const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const variance = performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / performances.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (standardDeviation * 2));
  }

  private identifyMasteryIndicators(event: LearningEvent): MasteryIndicator[] {
    const indicators: MasteryIndicator[] = [];
    
    // Understanding indicators
    if (event.reflection.quality > 0.5) {
      indicators.push({
        type: MasteryType.UNDERSTANDING,
        evidence: 'High-quality reflection demonstrating comprehension',
        strength: event.reflection.quality,
        timestamp: event.timestamp
      });
    }
    
    // Application indicators
    if (event.reflection.connectionCount > 0) {
      indicators.push({
        type: MasteryType.APPLICATION,
        evidence: 'Made connections to real-world applications',
        strength: Math.min(event.reflection.connectionCount / 3, 1),
        timestamp: event.timestamp
      });
    }
    
    // Analysis indicators
    if (event.reflection.insightCount > 0) {
      indicators.push({
        type: MasteryType.ANALYSIS,
        evidence: 'Generated multiple insights from experience',
        strength: Math.min(event.reflection.insightCount / 4, 1),
        timestamp: event.timestamp
      });
    }
    
    return indicators;
  }

  private determineSkillLevel(skill: PlayerSkill): SkillLevel {
    const experienceThresholds = {
      [SkillLevel.NOVICE]: 0,
      [SkillLevel.BEGINNER]: 50,
      [SkillLevel.INTERMEDIATE]: 150,
      [SkillLevel.ADVANCED]: 300,
      [SkillLevel.EXPERT]: 500
    };
    
    const confidenceThresholds = {
      [SkillLevel.NOVICE]: 0,
      [SkillLevel.BEGINNER]: 0.3,
      [SkillLevel.INTERMEDIATE]: 0.5,
      [SkillLevel.ADVANCED]: 0.7,
      [SkillLevel.EXPERT]: 0.85
    };
    
    // Determine level based on both experience and confidence
    let level = SkillLevel.NOVICE;
    
    for (const [skillLevel, expThreshold] of Object.entries(experienceThresholds)) {
      const confThreshold = confidenceThresholds[skillLevel as SkillLevel];
      
      if (skill.experiencePoints >= expThreshold && skill.confidence >= confThreshold) {
        level = skillLevel as SkillLevel;
      }
    }
    
    return level;
  }

  private updateProgressMetrics(): void {
    this.progressMetrics = {
      learningVelocity: this.calculateLearningVelocity(),
      engagementLevel: this.calculateEngagementLevel(),
      retentionRate: this.calculateRetentionRate(),
      conceptMastery: this.calculateConceptMastery(),
      reflectionQuality: this.calculateAverageReflectionQuality(),
      overallProgress: this.calculateOverallProgress()
    };
  }

  private calculateLearningVelocity(): number {
    const recentEvents = this.learningHistory.filter(e => 
      Date.now() - e.timestamp < 3600000 // Last hour
    );
    
    if (recentEvents.length === 0) return 0;
    
    const uniqueConcepts = new Set(recentEvents.map(e => {
      // Find the concept for this event
      for (const [concept, skill] of this.skillLevels.entries()) {
        if (skill.learningHistory.some(h => h.momentId === e.momentId)) {
          return concept;
        }
      }
      return null;
    }).filter(c => c !== null));
    
    return uniqueConcepts.size; // Concepts per hour
  }

  private calculateEngagementLevel(): number {
    if (this.learningHistory.length === 0) return 0;
    
    const recentEvents = this.learningHistory.slice(-10);
    const averageEngagement = recentEvents.reduce((sum, e) => 
      sum + e.performance.engagement, 0) / recentEvents.length;
    
    return averageEngagement;
  }

  private calculateRetentionRate(): number {
    // Simplified retention calculation based on skill confidence
    const confidenceValues = Array.from(this.skillLevels.values()).map(s => s.confidence);
    if (confidenceValues.length === 0) return 0;
    
    return confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
  }

  private calculateConceptMastery(): number {
    const skillLevels = Array.from(this.skillLevels.values());
    const levelValues = {
      [SkillLevel.NOVICE]: 0,
      [SkillLevel.BEGINNER]: 0.2,
      [SkillLevel.INTERMEDIATE]: 0.4,
      [SkillLevel.ADVANCED]: 0.7,
      [SkillLevel.EXPERT]: 1.0
    };
    
    const averageLevel = skillLevels.reduce((sum, skill) => 
      sum + levelValues[skill.level], 0) / skillLevels.length;
    
    return averageLevel;
  }

  private calculateAverageReflectionQuality(): number {
    if (this.learningHistory.length === 0) return 0;
    
    const recentEvents = this.learningHistory.slice(-20);
    return recentEvents.reduce((sum, e) => sum + e.reflection.quality, 0) / recentEvents.length;
  }

  private calculateOverallProgress(): number {
    const metrics = this.progressMetrics;
    return (
      metrics.conceptMastery * 0.4 +
      metrics.engagementLevel * 0.2 +
      metrics.reflectionQuality * 0.2 +
      metrics.retentionRate * 0.2
    );
  }

  private adaptDifficulty(): void {
    const metrics = this.progressMetrics;
    
    // Increase complexity if performing well
    if (metrics.overallProgress > 0.7 && metrics.engagementLevel > 0.6) {
      this.difficultySettings.scenarioComplexity = Math.min(1, 
        this.difficultySettings.scenarioComplexity + 0.1);
      this.difficultySettings.challengeIntensity = Math.min(1,
        this.difficultySettings.challengeIntensity + 0.05);
    }
    
    // Decrease complexity if struggling
    if (metrics.overallProgress < 0.3 || metrics.engagementLevel < 0.3) {
      this.difficultySettings.scenarioComplexity = Math.max(0.1,
        this.difficultySettings.scenarioComplexity - 0.1);
      this.difficultySettings.supportLevel = Math.min(1,
        this.difficultySettings.supportLevel + 0.1);
    }
    
    // Adjust concept introduction rate
    if (metrics.learningVelocity > 2) {
      this.difficultySettings.conceptIntroductionRate = Math.min(5,
        this.difficultySettings.conceptIntroductionRate + 0.5);
    } else if (metrics.learningVelocity < 0.5) {
      this.difficultySettings.conceptIntroductionRate = Math.max(1,
        this.difficultySettings.conceptIntroductionRate - 0.5);
    }
  }

  generateLearningPath(): LearningPath {
    const skillGaps = this.identifySkillGaps();
    const currentFocus = this.determineCurrentFocus();
    const learningGoals = this.createLearningGoals(skillGaps);
    const recommendedScenarios = this.recommendScenarios(currentFocus, skillGaps);
    
    return {
      currentFocus,
      skillGaps,
      learningGoals,
      recommendedScenarios,
      estimatedTimeToCompletion: this.estimateCompletionTime(learningGoals)
    };
  }

  private identifySkillGaps(): SkillGap[] {
    const gaps: SkillGap[] = [];
    
    this.skillLevels.forEach((skill, concept) => {
      const targetLevel = this.determineTargetLevel(concept);
      
      if (this.getSkillLevelValue(skill.level) < this.getSkillLevelValue(targetLevel)) {
        gaps.push({
          concept,
          currentLevel: skill.level,
          targetLevel,
          priority: this.calculateGapPriority(skill, targetLevel),
          recommendedActions: this.getRecommendedActions(concept, skill.level, targetLevel)
        });
      }
    });
    
    return gaps.sort((a, b) => b.priority - a.priority);
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

  private determineTargetLevel(concept: AIConcept): SkillLevel {
    // Core concepts should reach intermediate, specialized ones can stay at beginner
    const coreConcepts = [
      AIConcept.ALIGNMENT_PROBLEM,
      AIConcept.MULTI_AGENT_COORDINATION,
      AIConcept.AI_GOVERNANCE
    ];
    
    return coreConcepts.includes(concept) ? SkillLevel.INTERMEDIATE : SkillLevel.BEGINNER;
  }

  private calculateGapPriority(skill: PlayerSkill, targetLevel: SkillLevel): number {
    const levelGap = this.getSkillLevelValue(targetLevel) - this.getSkillLevelValue(skill.level);
    const confidenceBonus = 1 - skill.confidence; // Lower confidence = higher priority
    const recencyBonus = Date.now() - skill.lastUpdated > 86400000 ? 0.2 : 0; // 1 day
    
    return (levelGap * 0.5) + (confidenceBonus * 0.3) + recencyBonus;
  }

  private getRecommendedActions(concept: AIConcept, current: SkillLevel, target: SkillLevel): string[] {
    const actions: string[] = [];
    
    if (current === SkillLevel.NOVICE) {
      actions.push(`Start with basic ${concept.replace(/_/g, ' ')} scenarios`);
      actions.push('Focus on understanding core concepts');
    }
    
    if (this.getSkillLevelValue(target) >= this.getSkillLevelValue(SkillLevel.INTERMEDIATE)) {
      actions.push('Practice applying concepts to new situations');
      actions.push('Make connections to real-world examples');
    }
    
    if (this.getSkillLevelValue(target) >= this.getSkillLevelValue(SkillLevel.ADVANCED)) {
      actions.push('Analyze complex multi-concept scenarios');
      actions.push('Evaluate different approaches and trade-offs');
    }
    
    return actions;
  }

  private determineCurrentFocus(): AIConcept[] {
    const gaps = this.identifySkillGaps();
    return gaps.slice(0, 3).map(gap => gap.concept);
  }

  private createLearningGoals(skillGaps: SkillGap[]): LearningGoal[] {
    return skillGaps.slice(0, 5).map((gap, index) => ({
      id: `goal_${Date.now()}_${index}`,
      concept: gap.concept,
      targetLevel: gap.targetLevel,
      description: `Advance ${gap.concept.replace(/_/g, ' ')} from ${gap.currentLevel} to ${gap.targetLevel}`,
      milestones: this.createMilestones(gap),
      progress: 0,
      deadline: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    }));
  }

  private createMilestones(gap: SkillGap): Milestone[] {
    const milestones: Milestone[] = [];
    const currentValue = this.getSkillLevelValue(gap.currentLevel);
    const targetValue = this.getSkillLevelValue(gap.targetLevel);
    
    for (let i = currentValue + 1; i <= targetValue; i++) {
      const level = Object.values(SkillLevel)[i];
      milestones.push({
        id: `milestone_${Date.now()}_${i}`,
        description: `Reach ${level} level in ${gap.concept.replace(/_/g, ' ')}`,
        completed: false
      });
    }
    
    return milestones;
  }

  private recommendScenarios(focus: AIConcept[], gaps: SkillGap[]): string[] {
    const scenarios: string[] = [];
    
    focus.forEach(concept => {
      const conceptName = concept.toLowerCase();
      scenarios.push(`${conceptName}_basic_scenario`);
      scenarios.push(`${conceptName}_intermediate_scenario`);
    });
    
    // Add mixed scenarios for advanced learners
    if (gaps.some(gap => this.getSkillLevelValue(gap.currentLevel) >= 2)) {
      scenarios.push('multi_concept_integration_scenario');
      scenarios.push('complex_system_design_scenario');
    }
    
    return scenarios;
  }

  private estimateCompletionTime(goals: LearningGoal[]): number {
    // Estimate based on current learning velocity and goal complexity
    const velocity = this.progressMetrics.learningVelocity || 0.5;
    const totalMilestones = goals.reduce((sum, goal) => sum + goal.milestones.length, 0);
    
    // Assume 2 hours per milestone on average
    return (totalMilestones * 2) / Math.max(velocity, 0.1);
  }

  getPersonalizedRecommendations(): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];
    const skillGaps = this.identifySkillGaps();
    const metrics = this.progressMetrics;
    
    // Skill development recommendations
    skillGaps.slice(0, 3).forEach(gap => {
      recommendations.push({
        type: 'skill_development',
        title: `Improve ${gap.concept.replace(/_/g, ' ')} Skills`,
        description: `Focus on advancing from ${gap.currentLevel} to ${gap.targetLevel}`,
        priority: gap.priority,
        actions: gap.recommendedActions,
        estimatedTime: 2, // hours
        difficulty: this.getSkillLevelValue(gap.targetLevel) / 4
      });
    });
    
    // Engagement recommendations
    if (metrics.engagementLevel < 0.5) {
      recommendations.push({
        type: 'engagement',
        title: 'Increase Learning Engagement',
        description: 'Try more interactive scenarios and reflection exercises',
        priority: 0.8,
        actions: [
          'Participate in collaborative scenarios',
          'Write longer, more detailed reflections',
          'Connect learning to personal interests'
        ],
        estimatedTime: 1,
        difficulty: 0.3
      });
    }
    
    // Reflection quality recommendations
    if (metrics.reflectionQuality < 0.6) {
      recommendations.push({
        type: 'reflection_quality',
        title: 'Enhance Reflection Skills',
        description: 'Develop deeper analytical thinking in your reflections',
        priority: 0.7,
        actions: [
          'Ask "why" and "how" questions',
          'Make connections to real-world examples',
          'Analyze cause and effect relationships'
        ],
        estimatedTime: 0.5,
        difficulty: 0.4
      });
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  getProgressReport(): ProgressReport {
    const conceptProgress = new Map<AIConcept, number>();
    this.skillLevels.forEach((skill, concept) => {
      const progress = this.getSkillLevelValue(skill.level) / 4; // Normalize to 0-1
      conceptProgress.set(concept, progress);
    });
    
    const skillLevelDistribution = new Map<SkillLevel, number>();
    Object.values(SkillLevel).forEach(level => {
      const count = Array.from(this.skillLevels.values())
        .filter(skill => skill.level === level).length;
      skillLevelDistribution.set(level, count);
    });
    
    return {
      overallProgress: this.progressMetrics.overallProgress,
      conceptProgress,
      learningTrends: this.calculateLearningTrends(),
      timeSpent: this.calculateTimeSpent(),
      skillLevelDistribution,
      recommendedNextSteps: this.getRecommendedNextSteps(),
      strengths: this.identifyStrengths(),
      areasForImprovement: this.identifyAreasForImprovement()
    };
  }

  private calculateLearningTrends(): TrendData[] {
    const trends: TrendData[] = [];
    const days = 7;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dayStart = date.setHours(0, 0, 0, 0);
      const dayEnd = date.setHours(23, 59, 59, 999);
      
      const dayEvents = this.learningHistory.filter(e => 
        e.timestamp >= dayStart && e.timestamp <= dayEnd
      );
      
      trends.push({
        date: date.toISOString().split('T')[0],
        metric: 'learning_events',
        value: dayEvents.length
      });
    }
    
    return trends.reverse();
  }

  private calculateTimeSpent(): number {
    // Estimate based on learning events (assume 10 minutes per event)
    return this.learningHistory.length * 10 * 60 * 1000; // milliseconds
  }

  private getRecommendedNextSteps(): string[] {
    const recommendations = this.getPersonalizedRecommendations();
    return recommendations.slice(0, 3).map(rec => rec.title);
  }

  private identifyStrengths(): string[] {
    const strengths: string[] = [];
    
    this.skillLevels.forEach((skill, concept) => {
      if (skill.confidence > 0.7) {
        strengths.push(`Strong understanding of ${concept.replace(/_/g, ' ')}`);
      }
    });
    
    if (this.progressMetrics.reflectionQuality > 0.7) {
      strengths.push('High-quality reflective thinking');
    }
    
    if (this.progressMetrics.engagementLevel > 0.7) {
      strengths.push('High engagement with learning materials');
    }
    
    return strengths;
  }

  private identifyAreasForImprovement(): string[] {
    const areas: string[] = [];
    
    const skillGaps = this.identifySkillGaps();
    skillGaps.slice(0, 3).forEach(gap => {
      areas.push(`${gap.concept.replace(/_/g, ' ')} needs development`);
    });
    
    if (this.progressMetrics.reflectionQuality < 0.5) {
      areas.push('Reflection depth and analysis');
    }
    
    if (this.progressMetrics.engagementLevel < 0.5) {
      areas.push('Learning engagement and participation');
    }
    
    return areas;
  }

  private getDefaultDifficultySettings(): DifficultySettings {
    return {
      scenarioComplexity: 0.3,
      conceptIntroductionRate: 2,
      supportLevel: 0.7,
      challengeIntensity: 0.4,
      adaptationSensitivity: 0.5
    };
  }

  private initializeProgressMetrics(): ProgressMetrics {
    return {
      learningVelocity: 0,
      engagementLevel: 0,
      retentionRate: 0,
      conceptMastery: 0,
      reflectionQuality: 0,
      overallProgress: 0
    };
  }

  // Public getters
  get playerSkillLevels(): Map<AIConcept, PlayerSkill> {
    return new Map(this.skillLevels);
  }

  get currentProgressMetrics(): ProgressMetrics {
    return { ...this.progressMetrics };
  }

  get currentDifficultySettings(): DifficultySettings {
    return { ...this.difficultySettings };
  }

  get totalLearningEvents(): number {
    return this.learningHistory.length;
  }
}