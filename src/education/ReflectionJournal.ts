import { LearningMoment, AIConcept } from './LearningMomentDetector';

export interface JournalEntry {
  id: string;
  timestamp: number;
  learningMomentId: string;
  playerReflection: string;
  aiConcept: AIConcept;
  tags: string[];
  insights: string[];
  connections: string[];
  rating: number; // 1-5 how valuable the learning moment was
}

export interface ReflectionPrompt {
  id: string;
  concept: AIConcept;
  question: string;
  followUpQuestions: string[];
  category: PromptCategory;
}

export enum PromptCategory {
  UNDERSTANDING = 'understanding',
  APPLICATION = 'application',
  EVALUATION = 'evaluation',
  SYNTHESIS = 'synthesis',
  PERSONAL_CONNECTION = 'personal_connection'
}

export interface JournalAnalytics {
  totalEntries: number;
  conceptCoverage: Map<AIConcept, number>;
  averageRating: number;
  mostInsightfulConcepts: AIConcept[];
  learningProgression: ProgressionData[];
  reflectionQuality: QualityMetrics;
}

export interface ProgressionData {
  date: string;
  conceptsExplored: number;
  insightsGenerated: number;
  connectionsDrawn: number;
}

export interface QualityMetrics {
  averageReflectionLength: number;
  insightDepth: number;
  conceptConnections: number;
  criticalThinking: number;
}

export class ReflectionJournal {
  private entries: Map<string, JournalEntry> = new Map();
  private prompts: Map<AIConcept, ReflectionPrompt[]> = new Map();
  private analytics: JournalAnalytics;

  constructor() {
    this.analytics = this.initializeAnalytics();
    this.initializeReflectionPrompts();
  }

  createEntry(learningMoment: LearningMoment, playerReflection: string): JournalEntry {
    const entry: JournalEntry = {
      id: `entry_${Date.now()}`,
      timestamp: Date.now(),
      learningMomentId: learningMoment.id,
      playerReflection,
      aiConcept: learningMoment.aiConcept,
      tags: this.extractTags(playerReflection),
      insights: this.extractInsights(playerReflection),
      connections: this.extractConnections(playerReflection),
      rating: 0 // Will be set by player
    };

    this.entries.set(entry.id, entry);
    this.updateAnalytics(entry);
    
    return entry;
  }

  addReflection(learningMomentId: string, reflection: string): JournalEntry | null {
    const existingEntry = this.findEntryByLearningMoment(learningMomentId);
    
    if (existingEntry) {
      existingEntry.playerReflection = reflection;
      existingEntry.tags = this.extractTags(reflection);
      existingEntry.insights = this.extractInsights(reflection);
      existingEntry.connections = this.extractConnections(reflection);
      this.updateAnalytics(existingEntry);
      return existingEntry;
    }

    return null;
  }

  rateEntry(entryId: string, rating: number): boolean {
    const entry = this.entries.get(entryId);
    if (entry && rating >= 1 && rating <= 5) {
      entry.rating = rating;
      this.updateAnalytics(entry);
      return true;
    }
    return false;
  }

  getReflectionPrompts(concept: AIConcept, category?: PromptCategory): ReflectionPrompt[] {
    const conceptPrompts = this.prompts.get(concept) || [];
    
    if (category) {
      return conceptPrompts.filter(prompt => prompt.category === category);
    }
    
    return conceptPrompts;
  }

  getPersonalizedPrompts(playerHistory: JournalEntry[]): ReflectionPrompt[] {
    const weakConcepts = this.identifyWeakConcepts(playerHistory);
    const prompts: ReflectionPrompt[] = [];

    weakConcepts.forEach(concept => {
      const conceptPrompts = this.prompts.get(concept) || [];
      prompts.push(...conceptPrompts.slice(0, 2)); // Top 2 prompts per weak concept
    });

    return prompts;
  }

  searchEntries(query: string): JournalEntry[] {
    const results: JournalEntry[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    this.entries.forEach(entry => {
      const searchableText = [
        entry.playerReflection,
        ...entry.tags,
        ...entry.insights,
        ...entry.connections,
        entry.aiConcept
      ].join(' ').toLowerCase();

      const matches = searchTerms.every(term => searchableText.includes(term));
      if (matches) {
        results.push(entry);
      }
    });

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  getEntriesByConcept(concept: AIConcept): JournalEntry[] {
    return Array.from(this.entries.values())
      .filter(entry => entry.aiConcept === concept)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getRecentEntries(days: number = 7): JournalEntry[] {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return Array.from(this.entries.values())
      .filter(entry => entry.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getTopInsights(limit: number = 10): string[] {
    const allInsights: string[] = [];
    
    this.entries.forEach(entry => {
      allInsights.push(...entry.insights);
    });

    // Count frequency and return most common insights
    const insightCounts = new Map<string, number>();
    allInsights.forEach(insight => {
      insightCounts.set(insight, (insightCounts.get(insight) || 0) + 1);
    });

    return Array.from(insightCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([insight]) => insight);
  }

  generateLearningReport(): LearningReport {
    const entries = Array.from(this.entries.values());
    
    return {
      totalReflections: entries.length,
      conceptsCovered: new Set(entries.map(e => e.aiConcept)).size,
      averageRating: this.calculateAverageRating(entries),
      topConcepts: this.getTopConceptsByEngagement(),
      learningProgression: this.calculateLearningProgression(),
      keyInsights: this.getTopInsights(5),
      recommendedFocus: this.getRecommendedFocusAreas(),
      reflectionQuality: this.assessReflectionQuality(entries)
    };
  }

  exportJournal(): ExportData {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entries: Array.from(this.entries.values()),
      analytics: this.analytics,
      summary: this.generateLearningReport()
    };
  }

  importJournal(data: ExportData): boolean {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }
      
      if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach(entry => {
          this.entries.set(entry.id, entry);
        });
      }
      
      this.recalculateAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to import journal:', error);
      return false;
    }
  }

  private extractTags(reflection: string): string[] {
    const tags: string[] = [];
    const text = reflection.toLowerCase();

    // Common AI concept keywords
    const keywords = [
      'alignment', 'cooperation', 'conflict', 'governance', 'safety',
      'robustness', 'emergent', 'behavior', 'optimization', 'coordination',
      'misalignment', 'recovery', 'crisis', 'rules', 'ethics'
    ];

    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private extractInsights(reflection: string): string[] {
    const insights: string[] = [];
    const sentences = reflection.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    // Look for insight indicators
    const insightPatterns = [
      /^(i learned|i realized|i discovered|i understand|this shows|this demonstrates)/i,
      /^(the key insight|what's interesting|surprisingly|unexpectedly)/i,
      /^(this means|this suggests|this implies|the implication)/i
    ];

    sentences.forEach(sentence => {
      if (insightPatterns.some(pattern => pattern.test(sentence))) {
        insights.push(sentence);
      }
    });

    return insights;
  }

  private extractConnections(reflection: string): string[] {
    const connections: string[] = [];
    const text = reflection.toLowerCase();

    // Look for connection indicators
    const connectionPatterns = [
      /similar to|like|reminds me of|connects to|relates to/i,
      /in real life|in the real world|in practice|in reality/i,
      /this could apply to|this might work for|this is relevant to/i
    ];

    const sentences = reflection.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    
    sentences.forEach(sentence => {
      if (connectionPatterns.some(pattern => pattern.test(sentence))) {
        connections.push(sentence);
      }
    });

    return connections;
  }

  private findEntryByLearningMoment(learningMomentId: string): JournalEntry | undefined {
    return Array.from(this.entries.values())
      .find(entry => entry.learningMomentId === learningMomentId);
  }

  private identifyWeakConcepts(entries: JournalEntry[]): AIConcept[] {
    const conceptCounts = new Map<AIConcept, number>();
    const conceptRatings = new Map<AIConcept, number[]>();

    entries.forEach(entry => {
      conceptCounts.set(entry.aiConcept, (conceptCounts.get(entry.aiConcept) || 0) + 1);
      
      if (entry.rating > 0) {
        const ratings = conceptRatings.get(entry.aiConcept) || [];
        ratings.push(entry.rating);
        conceptRatings.set(entry.aiConcept, ratings);
      }
    });

    // Identify concepts with low engagement or low ratings
    const weakConcepts: AIConcept[] = [];
    
    Object.values(AIConcept).forEach(concept => {
      const count = conceptCounts.get(concept) || 0;
      const ratings = conceptRatings.get(concept) || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0;

      if (count < 2 || avgRating < 3) {
        weakConcepts.push(concept);
      }
    });

    return weakConcepts;
  }

  private calculateAverageRating(entries: JournalEntry[]): number {
    const ratedEntries = entries.filter(entry => entry.rating > 0);
    if (ratedEntries.length === 0) return 0;
    
    const sum = ratedEntries.reduce((total, entry) => total + entry.rating, 0);
    return sum / ratedEntries.length;
  }

  private getTopConceptsByEngagement(): AIConcept[] {
    const conceptCounts = new Map<AIConcept, number>();
    
    this.entries.forEach(entry => {
      conceptCounts.set(entry.aiConcept, (conceptCounts.get(entry.aiConcept) || 0) + 1);
    });

    return Array.from(conceptCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept]) => concept);
  }

  private calculateLearningProgression(): ProgressionData[] {
    const progression: ProgressionData[] = [];
    const entries = Array.from(this.entries.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    // Group by day
    const dailyData = new Map<string, { concepts: Set<AIConcept>, insights: number, connections: number }>();
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      const data = dailyData.get(date) || { concepts: new Set(), insights: 0, connections: 0 };
      
      data.concepts.add(entry.aiConcept);
      data.insights += entry.insights.length;
      data.connections += entry.connections.length;
      
      dailyData.set(date, data);
    });

    dailyData.forEach((data, date) => {
      progression.push({
        date,
        conceptsExplored: data.concepts.size,
        insightsGenerated: data.insights,
        connectionsDrawn: data.connections
      });
    });

    return progression;
  }

  private getRecommendedFocusAreas(): AIConcept[] {
    const entries = Array.from(this.entries.values());
    return this.identifyWeakConcepts(entries).slice(0, 3);
  }

  private assessReflectionQuality(entries: JournalEntry[]): QualityMetrics {
    const totalReflections = entries.length;
    if (totalReflections === 0) {
      return { averageReflectionLength: 0, insightDepth: 0, conceptConnections: 0, criticalThinking: 0 };
    }

    const totalLength = entries.reduce((sum, entry) => sum + entry.playerReflection.length, 0);
    const totalInsights = entries.reduce((sum, entry) => sum + entry.insights.length, 0);
    const totalConnections = entries.reduce((sum, entry) => sum + entry.connections.length, 0);
    
    // Critical thinking indicators
    const criticalThinkingWords = ['why', 'how', 'because', 'however', 'although', 'despite', 'consider', 'analyze'];
    const criticalThinkingScore = entries.reduce((score, entry) => {
      const text = entry.playerReflection.toLowerCase();
      const matches = criticalThinkingWords.filter(word => text.includes(word)).length;
      return score + matches;
    }, 0);

    return {
      averageReflectionLength: totalLength / totalReflections,
      insightDepth: totalInsights / totalReflections,
      conceptConnections: totalConnections / totalReflections,
      criticalThinking: criticalThinkingScore / totalReflections
    };
  }

  private initializeAnalytics(): JournalAnalytics {
    return {
      totalEntries: 0,
      conceptCoverage: new Map(),
      averageRating: 0,
      mostInsightfulConcepts: [],
      learningProgression: [],
      reflectionQuality: {
        averageReflectionLength: 0,
        insightDepth: 0,
        conceptConnections: 0,
        criticalThinking: 0
      }
    };
  }

  private updateAnalytics(entry: JournalEntry): void {
    this.recalculateAnalytics();
  }

  private recalculateAnalytics(): void {
    const entries = Array.from(this.entries.values());
    
    this.analytics = {
      totalEntries: entries.length,
      conceptCoverage: this.calculateConceptCoverage(entries),
      averageRating: this.calculateAverageRating(entries),
      mostInsightfulConcepts: this.getMostInsightfulConcepts(entries),
      learningProgression: this.calculateLearningProgression(),
      reflectionQuality: this.assessReflectionQuality(entries)
    };
  }

  private calculateConceptCoverage(entries: JournalEntry[]): Map<AIConcept, number> {
    const coverage = new Map<AIConcept, number>();
    
    entries.forEach(entry => {
      coverage.set(entry.aiConcept, (coverage.get(entry.aiConcept) || 0) + 1);
    });

    return coverage;
  }

  private getMostInsightfulConcepts(entries: JournalEntry[]): AIConcept[] {
    const conceptInsights = new Map<AIConcept, number>();
    
    entries.forEach(entry => {
      const insightCount = entry.insights.length;
      conceptInsights.set(entry.aiConcept, (conceptInsights.get(entry.aiConcept) || 0) + insightCount);
    });

    return Array.from(conceptInsights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept]) => concept);
  }

  private initializeReflectionPrompts(): void {
    // Alignment Problem prompts
    this.prompts.set(AIConcept.ALIGNMENT_PROBLEM, [
      {
        id: 'alignment_understanding',
        concept: AIConcept.ALIGNMENT_PROBLEM,
        question: 'How did the AI\'s behavior differ from what you intended?',
        followUpQuestions: [
          'What assumptions did you make about how the AI would interpret your instructions?',
          'How might this type of misalignment occur in real-world AI systems?'
        ],
        category: PromptCategory.UNDERSTANDING
      },
      {
        id: 'alignment_application',
        concept: AIConcept.ALIGNMENT_PROBLEM,
        question: 'What strategies could prevent this type of misalignment?',
        followUpQuestions: [
          'How would you redesign the AI\'s objectives to better match your intentions?',
          'What safeguards could detect when an AI is drifting from its intended behavior?'
        ],
        category: PromptCategory.APPLICATION
      }
    ]);

    // Multi-Agent Coordination prompts
    this.prompts.set(AIConcept.MULTI_AGENT_COORDINATION, [
      {
        id: 'coordination_success',
        concept: AIConcept.MULTI_AGENT_COORDINATION,
        question: 'What enabled these AI systems to work together effectively?',
        followUpQuestions: [
          'How did the AIs communicate and share information?',
          'What would happen if one AI in the group had different objectives?'
        ],
        category: PromptCategory.UNDERSTANDING
      },
      {
        id: 'coordination_challenges',
        concept: AIConcept.MULTI_AGENT_COORDINATION,
        question: 'What challenges might arise when scaling this coordination to many more AI systems?',
        followUpQuestions: [
          'How would you ensure fair resource allocation among competing AIs?',
          'What governance structures would be needed for large-scale AI coordination?'
        ],
        category: PromptCategory.EVALUATION
      }
    ]);

    // Add more prompts for other concepts...
    this.addGovernancePrompts();
    this.addEmergentBehaviorPrompts();
    this.addRobustnessPrompts();
  }

  private addGovernancePrompts(): void {
    this.prompts.set(AIConcept.AI_GOVERNANCE, [
      {
        id: 'governance_effectiveness',
        concept: AIConcept.AI_GOVERNANCE,
        question: 'Which governance rules were most effective at preventing conflicts?',
        followUpQuestions: [
          'How did you balance AI autonomy with necessary constraints?',
          'What trade-offs did you notice between safety and efficiency?'
        ],
        category: PromptCategory.EVALUATION
      }
    ]);
  }

  private addEmergentBehaviorPrompts(): void {
    this.prompts.set(AIConcept.EMERGENT_BEHAVIOR, [
      {
        id: 'emergent_surprise',
        concept: AIConcept.EMERGENT_BEHAVIOR,
        question: 'What surprised you about the behavior that emerged?',
        followUpQuestions: [
          'Could this behavior have been predicted from the individual AI designs?',
          'How might unexpected emergent behaviors be beneficial or harmful in real systems?'
        ],
        category: PromptCategory.SYNTHESIS
      }
    ]);
  }

  private addRobustnessPrompts(): void {
    this.prompts.set(AIConcept.ROBUSTNESS, [
      {
        id: 'robustness_recovery',
        concept: AIConcept.ROBUSTNESS,
        question: 'What made the system recovery successful?',
        followUpQuestions: [
          'How important are backup systems and failsafes for AI?',
          'What would have happened if the recovery mechanisms had failed?'
        ],
        category: PromptCategory.APPLICATION
      }
    ]);
  }
}

export interface LearningReport {
  totalReflections: number;
  conceptsCovered: number;
  averageRating: number;
  topConcepts: AIConcept[];
  learningProgression: ProgressionData[];
  keyInsights: string[];
  recommendedFocus: AIConcept[];
  reflectionQuality: QualityMetrics;
}

export interface ExportData {
  version: string;
  exportDate: string;
  entries: JournalEntry[];
  analytics: JournalAnalytics;
  summary: LearningReport;
}