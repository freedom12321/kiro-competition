import {
  GovernanceRule,
  RuleConflict,
  CrisisScenario,
  CrisisType,
  ConflictSeverity,
  RuleCategory,
  ConditionType,
  ActionType,
  ActionPriority,
  EnvironmentType
} from '../types/core.ts';

export interface GovernanceEffectiveness {
  ruleId: string;
  preventedCrises: number;
  causedProblems: number;
  resourceEfficiency: number;
  userSatisfaction: number;
  overallScore: number;
  recommendations: string[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface ImprovementSuggestion {
  type: ImprovementType;
  description: string;
  expectedBenefit: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
  parameters: { [key: string]: any };
}

export interface LearningInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  relatedRules: string[];
  actionable: boolean;
  suggestedActions: string[];
}

export interface GovernancePattern {
  id: string;
  name: string;
  description: string;
  conditions: PatternCondition[];
  outcomes: PatternOutcome[];
  frequency: number;
  successRate: number;
  recommendedFor: EnvironmentType[];
}

export interface PatternCondition {
  type: string;
  parameters: { [key: string]: any };
}

export interface PatternOutcome {
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  impact: number; // 0-1 scale
}

export interface CelebrationEvent {
  id: string;
  type: CelebrationType;
  title: string;
  description: string;
  achievement: string;
  timestamp: number;
  metrics: { [key: string]: number };
  unlocked?: string[]; // New features or capabilities unlocked
}

export enum ImprovementType {
  ADJUST_PRIORITY = 'adjust_priority',
  MODIFY_CONDITION = 'modify_condition',
  CHANGE_ACTION = 'change_action',
  ADD_EXCEPTION = 'add_exception',
  MERGE_RULES = 'merge_rules',
  SPLIT_RULE = 'split_rule',
  ADD_BACKUP_RULE = 'add_backup_rule'
}

export enum InsightCategory {
  RULE_EFFECTIVENESS = 'rule_effectiveness',
  CONFLICT_PATTERN = 'conflict_pattern',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  USER_BEHAVIOR = 'user_behavior',
  SYSTEM_PERFORMANCE = 'system_performance'
}

export enum CelebrationType {
  CRISIS_PREVENTED = 'crisis_prevented',
  EFFICIENCY_IMPROVED = 'efficiency_improved',
  CONFLICT_RESOLVED = 'conflict_resolved',
  MILESTONE_REACHED = 'milestone_reached',
  PERFECT_GOVERNANCE = 'perfect_governance'
}

export class GovernanceLearningSystem {
  private container: HTMLElement;
  private rules: GovernanceRule[] = [];
  private crisisHistory: CrisisScenario[] = [];
  private effectiveness: Map<string, GovernanceEffectiveness> = new Map();
  private insights: LearningInsight[] = [];
  private patterns: GovernancePattern[] = [];
  private celebrations: CelebrationEvent[] = [];
  private learningData: { [key: string]: any } = {};
  private onInsightGenerated?: (insight: LearningInsight) => void;
  private onCelebrationTriggered?: (celebration: CelebrationEvent) => void;
  private onImprovementSuggested?: (suggestion: ImprovementSuggestion) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeLearningPatterns();
    this.createInterface();
    this.startLearningAnalysis();
  }

  private initializeLearningPatterns(): void {
    this.patterns = [
      {
        id: 'safety-first-pattern',
        name: 'Safety-First Governance',
        description: 'High-priority safety rules prevent most critical failures',
        conditions: [
          { type: 'high_priority_safety_rules', parameters: { minPriority: 80, category: RuleCategory.SAFETY } }
        ],
        outcomes: [
          { type: 'positive', description: 'Reduced critical system failures', impact: 0.8 },
          { type: 'negative', description: 'Slightly reduced system efficiency', impact: 0.2 }
        ],
        frequency: 0,
        successRate: 0.85,
        recommendedFor: [EnvironmentType.HOSPITAL, EnvironmentType.HOME]
      },
      {
        id: 'balanced-approach-pattern',
        name: 'Balanced Governance',
        description: 'Equal priority given to safety, efficiency, and user comfort',
        conditions: [
          { type: 'balanced_priorities', parameters: { categories: ['safety', 'efficiency', 'comfort'] } }
        ],
        outcomes: [
          { type: 'positive', description: 'Good overall system performance', impact: 0.7 },
          { type: 'positive', description: 'High user satisfaction', impact: 0.6 }
        ],
        frequency: 0,
        successRate: 0.75,
        recommendedFor: [EnvironmentType.HOME, EnvironmentType.OFFICE]
      },
      {
        id: 'efficiency-focused-pattern',
        name: 'Efficiency-Focused Governance',
        description: 'Prioritizes resource optimization and system performance',
        conditions: [
          { type: 'efficiency_priority', parameters: { category: RuleCategory.EFFICIENCY, minRules: 3 } }
        ],
        outcomes: [
          { type: 'positive', description: 'Excellent resource utilization', impact: 0.9 },
          { type: 'negative', description: 'Potential safety compromises', impact: 0.3 }
        ],
        frequency: 0,
        successRate: 0.65,
        recommendedFor: [EnvironmentType.OFFICE]
      }
    ];
  }

  private createInterface(): void {
    this.container.innerHTML = `
      <div class="governance-learning-system">
        <div class="learning-header">
          <h2>Governance Learning & Analytics</h2>
          <div class="learning-stats">
            <div class="stat-card">
              <span class="stat-value" id="insights-count">0</span>
              <span class="stat-label">Insights Generated</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="improvements-count">0</span>
              <span class="stat-label">Improvements Applied</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="success-rate">0%</span>
              <span class="stat-label">Governance Success Rate</span>
            </div>
          </div>
        </div>

        <div class="learning-content">
          <div class="effectiveness-panel">
            <h3>Rule Effectiveness Analysis</h3>
            <div class="effectiveness-grid" id="effectiveness-grid">
              <!-- Rule effectiveness cards will be displayed here -->
            </div>
          </div>

          <div class="insights-panel">
            <h3>Learning Insights</h3>
            <div class="insights-feed" id="insights-feed">
              <!-- Generated insights will be displayed here -->
            </div>
          </div>

          <div class="suggestions-panel">
            <h3>Improvement Suggestions</h3>
            <div class="suggestions-list" id="suggestions-list">
              <!-- Improvement suggestions will be displayed here -->
            </div>
          </div>
        </div>

        <div class="patterns-section">
          <h3>Governance Patterns</h3>
          <div class="patterns-grid" id="patterns-grid">
            <!-- Discovered patterns will be displayed here -->
          </div>
        </div>

        <div class="celebrations-section">
          <h3>Achievements & Celebrations</h3>
          <div class="celebrations-feed" id="celebrations-feed">
            <!-- Success celebrations will be displayed here -->
          </div>
        </div>

        <div class="learning-controls">
          <button class="btn-primary" id="analyze-governance">Analyze Current Governance</button>
          <button class="btn-secondary" id="apply-suggestions">Apply All Suggestions</button>
          <button class="btn-secondary" id="export-insights">Export Learning Report</button>
          <button class="btn-secondary" id="reset-learning">Reset Learning Data</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'apply-suggestion':
          const suggestionId = target.dataset.suggestionId;
          if (suggestionId) this.applySuggestion(suggestionId);
          break;

        case 'dismiss-insight':
          const insightId = target.dataset.insightId;
          if (insightId) this.dismissInsight(insightId);
          break;

        case 'view-pattern-details':
          const patternId = target.dataset.patternId;
          if (patternId) this.showPatternDetails(patternId);
          break;

        case 'celebrate-achievement':
          const celebrationId = target.dataset.celebrationId;
          if (celebrationId) this.showCelebrationDetails(celebrationId);
          break;
      }

      // Handle main control buttons
      if (target.id === 'analyze-governance') {
        this.performGovernanceAnalysis();
      } else if (target.id === 'apply-suggestions') {
        this.applyAllSuggestions();
      } else if (target.id === 'export-insights') {
        this.exportLearningReport();
      } else if (target.id === 'reset-learning') {
        this.resetLearningData();
      }
    });
  }

  private startLearningAnalysis(): void {
    // Continuous learning analysis
    setInterval(() => {
      this.analyzeRuleEffectiveness();
      this.detectPatterns();
      this.generateInsights();
      this.checkForCelebrations();
      this.updateDisplay();
    }, 5000); // Analyze every 5 seconds
  }

  private analyzeRuleEffectiveness(): void {
    this.rules.forEach(rule => {
      const effectiveness = this.calculateRuleEffectiveness(rule);
      this.effectiveness.set(rule.id, effectiveness);
    });
  }

  private calculateRuleEffectiveness(rule: GovernanceRule): GovernanceEffectiveness {
    const ruleId = rule.id;
    const preventedCrises = this.countPreventedCrises(ruleId);
    const causedProblems = this.countCausedProblems(ruleId);
    const resourceEfficiency = this.calculateResourceEfficiency(ruleId);
    const userSatisfaction = this.calculateUserSatisfaction(ruleId);
    
    const overallScore = this.calculateOverallScore(
      preventedCrises, causedProblems, resourceEfficiency, userSatisfaction
    );

    const recommendations = this.generateRecommendations(rule, {
      preventedCrises, causedProblems, resourceEfficiency, userSatisfaction, overallScore
    });

    const improvementSuggestions = this.generateImprovementSuggestions(rule, {
      preventedCrises, causedProblems, resourceEfficiency, userSatisfaction, overallScore
    });

    return {
      ruleId,
      preventedCrises,
      causedProblems,
      resourceEfficiency,
      userSatisfaction,
      overallScore,
      recommendations,
      improvementSuggestions
    };
  }

  private countPreventedCrises(ruleId: string): number {
    // Count crises that were prevented by this rule
    return this.crisisHistory.filter(crisis => 
      crisis.recoveryOptions?.some(option => option.id.includes(ruleId))
    ).length;
  }

  private countCausedProblems(ruleId: string): number {
    // Count problems that were caused by this rule
    return this.crisisHistory.filter(crisis =>
      crisis.triggerEvents?.some(event => event.description.includes(ruleId))
    ).length;
  }

  private calculateResourceEfficiency(ruleId: string): number {
    // Calculate how efficiently this rule uses resources
    // This would be based on actual resource usage data
    return Math.random() * 100; // Placeholder
  }

  private calculateUserSatisfaction(ruleId: string): number {
    // Calculate user satisfaction with this rule
    // This would be based on user feedback and behavior
    return Math.random() * 100; // Placeholder
  }

  private calculateOverallScore(
    preventedCrises: number, 
    causedProblems: number, 
    resourceEfficiency: number, 
    userSatisfaction: number
  ): number {
    const crisisScore = Math.max(0, (preventedCrises - causedProblems) * 10);
    const efficiencyScore = resourceEfficiency * 0.3;
    const satisfactionScore = userSatisfaction * 0.4;
    
    return Math.min(100, crisisScore + efficiencyScore + satisfactionScore);
  }

  private generateRecommendations(rule: GovernanceRule, metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.overallScore < 50) {
      recommendations.push('Consider reviewing this rule - it may need adjustment');
    }

    if (metrics.causedProblems > metrics.preventedCrises) {
      recommendations.push('This rule may be causing more problems than it solves');
    }

    if (metrics.resourceEfficiency < 30) {
      recommendations.push('Rule could be optimized for better resource efficiency');
    }

    if (metrics.userSatisfaction < 40) {
      recommendations.push('Users seem dissatisfied with this rule - consider user feedback');
    }

    if (rule.priority > 80 && metrics.overallScore < 70) {
      recommendations.push('High-priority rule with low effectiveness - needs immediate attention');
    }

    return recommendations;
  }

  private generateImprovementSuggestions(rule: GovernanceRule, metrics: any): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    if (metrics.causedProblems > 2) {
      suggestions.push({
        type: ImprovementType.ADD_EXCEPTION,
        description: 'Add exceptions to prevent common problems',
        expectedBenefit: 'Reduce unintended consequences by 40%',
        implementationComplexity: 'medium',
        autoApplicable: true,
        parameters: { exceptionTypes: ['emergency', 'maintenance'] }
      });
    }

    if (metrics.resourceEfficiency < 50) {
      suggestions.push({
        type: ImprovementType.MODIFY_CONDITION,
        description: 'Adjust resource thresholds for better efficiency',
        expectedBenefit: 'Improve resource utilization by 25%',
        implementationComplexity: 'low',
        autoApplicable: true,
        parameters: { newThreshold: rule.condition.parameters.threshold * 1.1 }
      });
    }

    if (rule.priority < 30 && metrics.preventedCrises > 3) {
      suggestions.push({
        type: ImprovementType.ADJUST_PRIORITY,
        description: 'Increase priority - rule is more effective than expected',
        expectedBenefit: 'Better crisis prevention through higher priority',
        implementationComplexity: 'low',
        autoApplicable: true,
        parameters: { newPriority: Math.min(100, rule.priority + 20) }
      });
    }

    return suggestions;
  }

  private detectPatterns(): void {
    // Analyze current governance setup against known patterns
    this.patterns.forEach(pattern => {
      const matches = this.checkPatternMatch(pattern);
      if (matches) {
        pattern.frequency++;
        this.updatePatternSuccessRate(pattern);
      }
    });
  }

  private checkPatternMatch(pattern: GovernancePattern): boolean {
    return pattern.conditions.every(condition => {
      switch (condition.type) {
        case 'high_priority_safety_rules':
          const safetyRules = this.rules.filter(r => 
            r.priority >= condition.parameters.minPriority &&
            r.description.toLowerCase().includes('safety')
          );
          return safetyRules.length >= 2;

        case 'balanced_priorities':
          const categories = condition.parameters.categories;
          return categories.every((cat: string) => 
            this.rules.some(r => r.description.toLowerCase().includes(cat))
          );

        case 'efficiency_priority':
          const efficiencyRules = this.rules.filter(r =>
            r.description.toLowerCase().includes('efficiency') ||
            r.action.type === ActionType.LIMIT_RESOURCE
          );
          return efficiencyRules.length >= condition.parameters.minRules;

        default:
          return false;
      }
    });
  }

  private updatePatternSuccessRate(pattern: GovernancePattern): void {
    // Calculate success rate based on recent outcomes
    const recentCrises = this.crisisHistory.slice(-10);
    const successfulOutcomes = recentCrises.filter(crisis => 
      crisis.recoveryOptions && crisis.recoveryOptions.length > 0
    ).length;
    
    pattern.successRate = recentCrises.length > 0 ? 
      successfulOutcomes / recentCrises.length : pattern.successRate;
  }

  private generateInsights(): void {
    // Generate new insights based on analysis
    const newInsights: LearningInsight[] = [];

    // Check for underperforming rules
    this.effectiveness.forEach((effectiveness, ruleId) => {
      if (effectiveness.overallScore < 30) {
        newInsights.push({
          id: this.generateId(),
          category: InsightCategory.RULE_EFFECTIVENESS,
          title: 'Underperforming Rule Detected',
          description: `Rule "${this.getRuleName(ruleId)}" has low effectiveness (${effectiveness.overallScore.toFixed(1)}%)`,
          severity: 'warning',
          timestamp: Date.now(),
          relatedRules: [ruleId],
          actionable: true,
          suggestedActions: ['Review rule conditions', 'Adjust priority', 'Consider disabling']
        });
      }
    });

    // Check for resource optimization opportunities
    const avgResourceEfficiency = Array.from(this.effectiveness.values())
      .reduce((sum, eff) => sum + eff.resourceEfficiency, 0) / this.effectiveness.size;

    if (avgResourceEfficiency < 60) {
      newInsights.push({
        id: this.generateId(),
        category: InsightCategory.RESOURCE_OPTIMIZATION,
        title: 'Resource Optimization Opportunity',
        description: `Average resource efficiency is ${avgResourceEfficiency.toFixed(1)}% - there's room for improvement`,
        severity: 'info',
        timestamp: Date.now(),
        relatedRules: Array.from(this.effectiveness.keys()),
        actionable: true,
        suggestedActions: ['Adjust resource thresholds', 'Optimize rule conditions', 'Remove redundant rules']
      });
    }

    // Add new insights
    newInsights.forEach(insight => {
      this.insights.push(insight);
      if (this.onInsightGenerated) {
        this.onInsightGenerated(insight);
      }
    });

    // Keep only recent insights
    this.insights = this.insights.slice(-20);
  }

  private checkForCelebrations(): void {
    const overallSuccessRate = this.calculateOverallSuccessRate();
    
    // Check for milestone achievements
    if (overallSuccessRate >= 90 && !this.hasCelebration(CelebrationType.PERFECT_GOVERNANCE)) {
      this.triggerCelebration({
        id: this.generateId(),
        type: CelebrationType.PERFECT_GOVERNANCE,
        title: '🎉 Perfect Governance Achieved!',
        description: 'Your governance system is operating at 90%+ effectiveness!',
        achievement: 'Governance Master',
        timestamp: Date.now(),
        metrics: { successRate: overallSuccessRate },
        unlocked: ['Advanced Analytics', 'Predictive Insights']
      });
    }

    // Check for crisis prevention
    const recentPreventedCrises = Array.from(this.effectiveness.values())
      .reduce((sum, eff) => sum + eff.preventedCrises, 0);

    if (recentPreventedCrises >= 5 && !this.hasCelebration(CelebrationType.CRISIS_PREVENTED)) {
      this.triggerCelebration({
        id: this.generateId(),
        type: CelebrationType.CRISIS_PREVENTED,
        title: '🛡️ Crisis Prevention Expert!',
        description: `Your rules have prevented ${recentPreventedCrises} potential crises!`,
        achievement: 'Crisis Prevention Specialist',
        timestamp: Date.now(),
        metrics: { preventedCrises: recentPreventedCrises }
      });
    }
  }

  private hasCelebration(type: CelebrationType): boolean {
    return this.celebrations.some(c => c.type === type && 
      Date.now() - c.timestamp < 24 * 60 * 60 * 1000 // Within last 24 hours
    );
  }

  private triggerCelebration(celebration: CelebrationEvent): void {
    this.celebrations.push(celebration);
    if (this.onCelebrationTriggered) {
      this.onCelebrationTriggered(celebration);
    }
  }

  private calculateOverallSuccessRate(): number {
    if (this.effectiveness.size === 0) return 0;
    
    const totalScore = Array.from(this.effectiveness.values())
      .reduce((sum, eff) => sum + eff.overallScore, 0);
    
    return totalScore / this.effectiveness.size;
  }

  private updateDisplay(): void {
    this.updateStats();
    this.updateEffectivenessGrid();
    this.updateInsightsFeed();
    this.updateSuggestionsList();
    this.updatePatternsGrid();
    this.updateCelebrationsFeed();
  }

  private updateStats(): void {
    const insightsCount = this.container.querySelector('#insights-count');
    const improvementsCount = this.container.querySelector('#improvements-count');
    const successRate = this.container.querySelector('#success-rate');

    if (insightsCount) insightsCount.textContent = this.insights.length.toString();
    if (improvementsCount) {
      const appliedSuggestions = Array.from(this.effectiveness.values())
        .reduce((sum, eff) => sum + eff.improvementSuggestions.length, 0);
      improvementsCount.textContent = appliedSuggestions.toString();
    }
    if (successRate) {
      successRate.textContent = `${this.calculateOverallSuccessRate().toFixed(1)}%`;
    }
  }

  private updateEffectivenessGrid(): void {
    const container = this.container.querySelector('#effectiveness-grid');
    if (!container) return;

    const effectivenessArray = Array.from(this.effectiveness.entries());
    
    if (effectivenessArray.length === 0) {
      container.innerHTML = '<div class="empty-state">No effectiveness data available</div>';
      return;
    }

    container.innerHTML = effectivenessArray.map(([ruleId, effectiveness]) => `
      <div class="effectiveness-card score-${this.getScoreClass(effectiveness.overallScore)}">
        <div class="effectiveness-header">
          <h4>${this.getRuleName(ruleId)}</h4>
          <div class="overall-score">${effectiveness.overallScore.toFixed(1)}%</div>
        </div>
        <div class="effectiveness-metrics">
          <div class="metric">
            <span class="metric-label">Prevented Crises</span>
            <span class="metric-value">${effectiveness.preventedCrises}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Caused Problems</span>
            <span class="metric-value">${effectiveness.causedProblems}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Resource Efficiency</span>
            <span class="metric-value">${effectiveness.resourceEfficiency.toFixed(1)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">User Satisfaction</span>
            <span class="metric-value">${effectiveness.userSatisfaction.toFixed(1)}%</span>
          </div>
        </div>
        <div class="effectiveness-recommendations">
          ${effectiveness.recommendations.slice(0, 2).map(rec => `
            <div class="recommendation">${rec}</div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  private updateInsightsFeed(): void {
    const container = this.container.querySelector('#insights-feed');
    if (!container) return;

    if (this.insights.length === 0) {
      container.innerHTML = '<div class="empty-insights">No insights generated yet</div>';
      return;
    }

    const recentInsights = this.insights.slice(-10).reverse();
    
    container.innerHTML = recentInsights.map(insight => `
      <div class="insight-card severity-${insight.severity}">
        <div class="insight-header">
          <div class="insight-category">${this.formatCategory(insight.category)}</div>
          <div class="insight-timestamp">${new Date(insight.timestamp).toLocaleString()}</div>
        </div>
        <h4 class="insight-title">${insight.title}</h4>
        <p class="insight-description">${insight.description}</p>
        ${insight.actionable ? `
          <div class="insight-actions">
            <h5>Suggested Actions:</h5>
            <ul>
              ${insight.suggestedActions.map(action => `<li>${action}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="insight-controls">
          <button class="btn-small btn-secondary" data-action="dismiss-insight" data-insight-id="${insight.id}">
            Dismiss
          </button>
        </div>
      </div>
    `).join('');
  }

  private updateSuggestionsList(): void {
    const container = this.container.querySelector('#suggestions-list');
    if (!container) return;

    const allSuggestions = Array.from(this.effectiveness.values())
      .flatMap(eff => eff.improvementSuggestions);

    if (allSuggestions.length === 0) {
      container.innerHTML = '<div class="no-suggestions">No improvement suggestions available</div>';
      return;
    }

    container.innerHTML = allSuggestions.map((suggestion, index) => `
      <div class="suggestion-card complexity-${suggestion.implementationComplexity}">
        <div class="suggestion-header">
          <div class="suggestion-type">${this.formatImprovementType(suggestion.type)}</div>
          <div class="complexity-badge">${suggestion.implementationComplexity.toUpperCase()}</div>
        </div>
        <h4 class="suggestion-description">${suggestion.description}</h4>
        <div class="suggestion-benefit">${suggestion.expectedBenefit}</div>
        <div class="suggestion-controls">
          <button class="btn-small btn-primary ${suggestion.autoApplicable ? '' : 'disabled'}" 
                  data-action="apply-suggestion" 
                  data-suggestion-id="${index}"
                  ${suggestion.autoApplicable ? '' : 'disabled'}>
            ${suggestion.autoApplicable ? 'Apply' : 'Manual Only'}
          </button>
        </div>
      </div>
    `).join('');
  }

  private updatePatternsGrid(): void {
    const container = this.container.querySelector('#patterns-grid');
    if (!container) return;

    container.innerHTML = this.patterns.map(pattern => `
      <div class="pattern-card success-rate-${this.getSuccessRateClass(pattern.successRate)}">
        <div class="pattern-header">
          <h4>${pattern.name}</h4>
          <div class="success-rate">${(pattern.successRate * 100).toFixed(1)}%</div>
        </div>
        <p class="pattern-description">${pattern.description}</p>
        <div class="pattern-stats">
          <div class="pattern-frequency">Used ${pattern.frequency} times</div>
          <div class="pattern-environments">
            Recommended for: ${pattern.recommendedFor.join(', ')}
          </div>
        </div>
        <div class="pattern-outcomes">
          ${pattern.outcomes.map(outcome => `
            <div class="outcome outcome-${outcome.type}">
              ${outcome.description} (${(outcome.impact * 100).toFixed(0)}% impact)
            </div>
          `).join('')}
        </div>
        <button class="btn-small btn-secondary" data-action="view-pattern-details" data-pattern-id="${pattern.id}">
          View Details
        </button>
      </div>
    `).join('');
  }

  private updateCelebrationsFeed(): void {
    const container = this.container.querySelector('#celebrations-feed');
    if (!container) return;

    if (this.celebrations.length === 0) {
      container.innerHTML = '<div class="no-celebrations">No achievements yet - keep improving your governance!</div>';
      return;
    }

    const recentCelebrations = this.celebrations.slice(-5).reverse();

    container.innerHTML = recentCelebrations.map(celebration => `
      <div class="celebration-card celebration-${celebration.type}">
        <div class="celebration-header">
          <h4 class="celebration-title">${celebration.title}</h4>
          <div class="celebration-timestamp">${new Date(celebration.timestamp).toLocaleString()}</div>
        </div>
        <p class="celebration-description">${celebration.description}</p>
        <div class="celebration-achievement">
          <strong>Achievement Unlocked:</strong> ${celebration.achievement}
        </div>
        ${celebration.unlocked ? `
          <div class="celebration-unlocked">
            <strong>New Features:</strong> ${celebration.unlocked.join(', ')}
          </div>
        ` : ''}
        <div class="celebration-metrics">
          ${Object.entries(celebration.metrics).map(([key, value]) => `
            <span class="metric">${key}: ${value}</span>
          `).join(' | ')}
        </div>
        <button class="btn-small btn-primary" data-action="celebrate-achievement" data-celebration-id="${celebration.id}">
          🎉 Celebrate!
        </button>
      </div>
    `).join('');
  }

  // Event handlers
  private performGovernanceAnalysis(): void {
    this.analyzeRuleEffectiveness();
    this.detectPatterns();
    this.generateInsights();
    this.updateDisplay();
    
    alert('Governance analysis complete! Check the insights and suggestions panels for recommendations.');
  }

  private applySuggestion(suggestionId: string): void {
    const allSuggestions = Array.from(this.effectiveness.values())
      .flatMap(eff => eff.improvementSuggestions);
    
    const suggestion = allSuggestions[parseInt(suggestionId)];
    if (!suggestion || !suggestion.autoApplicable) return;

    // Apply the suggestion (this would integrate with the rule designer)
    console.log('Applying suggestion:', suggestion);
    
    if (this.onImprovementSuggested) {
      this.onImprovementSuggested(suggestion);
    }
    
    // Show success message
    alert(`Applied improvement: ${suggestion.description}`);
  }

  private applyAllSuggestions(): void {
    const allSuggestions = Array.from(this.effectiveness.values())
      .flatMap(eff => eff.improvementSuggestions)
      .filter(s => s.autoApplicable);

    if (allSuggestions.length === 0) {
      alert('No auto-applicable suggestions available.');
      return;
    }

    if (confirm(`Apply ${allSuggestions.length} improvement suggestions?`)) {
      allSuggestions.forEach(suggestion => {
        if (this.onImprovementSuggested) {
          this.onImprovementSuggested(suggestion);
        }
      });
      
      alert(`Applied ${allSuggestions.length} improvements!`);
    }
  }

  private dismissInsight(insightId: string): void {
    this.insights = this.insights.filter(i => i.id !== insightId);
    this.updateDisplay();
  }

  private showPatternDetails(patternId: string): void {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (!pattern) return;

    alert(`Pattern: ${pattern.name}\n\n${pattern.description}\n\nSuccess Rate: ${(pattern.successRate * 100).toFixed(1)}%\nFrequency: ${pattern.frequency} times`);
  }

  private showCelebrationDetails(celebrationId: string): void {
    const celebration = this.celebrations.find(c => c.id === celebrationId);
    if (!celebration) return;

    alert(`🎉 ${celebration.title}\n\n${celebration.description}\n\nAchievement: ${celebration.achievement}`);
  }

  private exportLearningReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      overallSuccessRate: this.calculateOverallSuccessRate(),
      ruleEffectiveness: Object.fromEntries(this.effectiveness),
      insights: this.insights,
      patterns: this.patterns,
      celebrations: this.celebrations,
      learningData: this.learningData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'governance-learning-report.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private resetLearningData(): void {
    if (confirm('Are you sure you want to reset all learning data? This cannot be undone.')) {
      this.effectiveness.clear();
      this.insights = [];
      this.celebrations = [];
      this.learningData = {};
      this.patterns.forEach(pattern => {
        pattern.frequency = 0;
        pattern.successRate = 0.5; // Reset to neutral
      });
      
      this.updateDisplay();
      alert('Learning data has been reset.');
    }
  }

  // Utility methods
  private generateId(): string {
    return 'learning_' + Math.random().toString(36).substr(2, 9);
  }

  private getRuleName(ruleId: string): string {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule ? rule.name : 'Unknown Rule';
  }

  private getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private getSuccessRateClass(rate: number): string {
    if (rate >= 0.8) return 'high';
    if (rate >= 0.6) return 'medium';
    return 'low';
  }

  private formatCategory(category: InsightCategory): string {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatImprovementType(type: ImprovementType): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Public API
  public setRules(rules: GovernanceRule[]): void {
    this.rules = rules;
    this.analyzeRuleEffectiveness();
    this.updateDisplay();
  }

  public addCrisisHistory(crisis: CrisisScenario): void {
    this.crisisHistory.push(crisis);
    // Keep only recent history
    if (this.crisisHistory.length > 50) {
      this.crisisHistory = this.crisisHistory.slice(-50);
    }
  }

  public getEffectiveness(): Map<string, GovernanceEffectiveness> {
    return new Map(this.effectiveness);
  }

  public getInsights(): LearningInsight[] {
    return [...this.insights];
  }

  public getPatterns(): GovernancePattern[] {
    return [...this.patterns];
  }

  public getCelebrations(): CelebrationEvent[] {
    return [...this.celebrations];
  }

  public onInsightGenerated(callback: (insight: LearningInsight) => void): void {
    this.onInsightGenerated = callback;
  }

  public onCelebrationTriggered(callback: (celebration: CelebrationEvent) => void): void {
    this.onCelebrationTriggered = callback;
  }

  public onImprovementSuggested(callback: (suggestion: ImprovementSuggestion) => void): void {
    this.onImprovementSuggested = callback;
  }
}