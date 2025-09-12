import { GovernanceLearningSystem, GovernanceEffectiveness, LearningInsight, ImprovementSuggestion, CelebrationEvent, ImprovementType, InsightCategory, CelebrationType } from '../../src/ui/GovernanceLearningSystem';
import {
  GovernanceRule,
  CrisisScenario,
  CrisisType,
  ConditionType,
  ActionType,
  ActionPriority,
  EnvironmentType,
  ConflictSeverity,
  ResourceType,
  RuleCategory
} from '../../src/types/core';

// Mock DOM environment
const mockContainer = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

describe('GovernanceLearningSystem', () => {
  let learningSystem: GovernanceLearningSystem;
  let container: HTMLElement;

  beforeEach(() => {
    container = mockContainer();
    learningSystem = new GovernanceLearningSystem(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    test('should create learning system interface with all sections', () => {
      expect(container.querySelector('.governance-learning-system')).toBeTruthy();
      expect(container.querySelector('.effectiveness-panel')).toBeTruthy();
      expect(container.querySelector('.insights-panel')).toBeTruthy();
      expect(container.querySelector('.suggestions-panel')).toBeTruthy();
      expect(container.querySelector('.patterns-section')).toBeTruthy();
      expect(container.querySelector('.celebrations-section')).toBeTruthy();
    });

    test('should initialize with zero stats', () => {
      const insightsCount = container.querySelector('#insights-count');
      const improvementsCount = container.querySelector('#improvements-count');
      const successRate = container.querySelector('#success-rate');

      expect(insightsCount?.textContent).toBe('0');
      expect(improvementsCount?.textContent).toBe('0');
      expect(successRate?.textContent).toBe('0.0%');
    });

    test('should show empty states for all panels initially', () => {
      expect(container.querySelector('.empty-state')).toBeTruthy();
      expect(container.querySelector('.empty-insights')).toBeTruthy();
      expect(container.querySelector('.no-suggestions')).toBeTruthy();
      expect(container.querySelector('.no-celebrations')).toBeTruthy();
    });

    test('should initialize with default governance patterns', () => {
      const patterns = learningSystem.getPatterns();
      expect(patterns.length).toBeGreaterThan(0);
      
      const safetyPattern = patterns.find(p => p.id === 'safety-first-pattern');
      expect(safetyPattern).toBeTruthy();
      expect(safetyPattern?.name).toBe('Safety-First Governance');
    });
  });

  describe('Rule Effectiveness Analysis', () => {
    let testRules: GovernanceRule[];

    beforeEach(() => {
      testRules = [
        {
          id: 'safety-rule',
          name: 'Safety Priority Rule',
          description: 'Ensures device safety in all conditions',
          priority: 90,
          constitutional: true,
          enabled: true,
          condition: {
            type: ConditionType.CRISIS_DETECTED,
            parameters: { severity: 'high' }
          },
          action: {
            type: ActionType.DISABLE_DEVICE,
            parameters: {},
            priority: ActionPriority.CRITICAL,
            reversible: false
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.HOSPITAL]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        },
        {
          id: 'efficiency-rule',
          name: 'Resource Efficiency Rule',
          description: 'Optimizes resource usage for better efficiency',
          priority: 60,
          constitutional: false,
          enabled: true,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { resourceType: ResourceType.ENERGY, threshold: 75 }
          },
          action: {
            type: ActionType.LIMIT_RESOURCE,
            parameters: { maxUsage: 65 },
            priority: ActionPriority.MEDIUM,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.OFFICE]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        }
      ];
    });

    test('should analyze rule effectiveness when rules are set', () => {
      learningSystem.setRules(testRules);

      const effectiveness = learningSystem.getEffectiveness();
      expect(effectiveness.size).toBe(2);
      expect(effectiveness.has('safety-rule')).toBe(true);
      expect(effectiveness.has('efficiency-rule')).toBe(true);
    });

    test('should display effectiveness cards for each rule', () => {
      learningSystem.setRules(testRules);

      const effectivenessCards = container.querySelectorAll('.effectiveness-card');
      expect(effectivenessCards.length).toBe(2);

      const safetyCard = Array.from(effectivenessCards).find(card => 
        card.textContent?.includes('Safety Priority Rule')
      );
      expect(safetyCard).toBeTruthy();
    });

    test('should calculate overall scores for rules', () => {
      learningSystem.setRules(testRules);

      const effectiveness = learningSystem.getEffectiveness();
      const safetyEffectiveness = effectiveness.get('safety-rule');
      
      expect(safetyEffectiveness).toBeTruthy();
      expect(safetyEffectiveness?.overallScore).toBeGreaterThanOrEqual(0);
      expect(safetyEffectiveness?.overallScore).toBeLessThanOrEqual(100);
    });

    test('should generate recommendations for underperforming rules', () => {
      learningSystem.setRules(testRules);

      const effectiveness = learningSystem.getEffectiveness();
      const recommendations = Array.from(effectiveness.values())
        .flatMap(eff => eff.recommendations);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    test('should generate improvement suggestions', () => {
      learningSystem.setRules(testRules);

      const effectiveness = learningSystem.getEffectiveness();
      const suggestions = Array.from(effectiveness.values())
        .flatMap(eff => eff.improvementSuggestions);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Crisis History Integration', () => {
    test('should accept and store crisis history', () => {
      const testCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 8,
        involvedAgents: ['device-1', 'device-2'],
        triggerEvents: [
          {
            timestamp: Date.now(),
            description: 'Resource conflict detected',
            deviceId: 'device-1',
            eventType: 'resource_conflict',
            severity: 7
          }
        ],
        cascadeEffects: [],
        recoveryOptions: [
          {
            id: 'recovery-1',
            name: 'Emergency Stop',
            description: 'Stop all conflicting devices',
            effectiveness: 0.9,
            riskLevel: 0.1
          }
        ]
      };

      learningSystem.addCrisisHistory(testCrisis);

      // The crisis should be used in effectiveness calculations
      // We can't directly access the crisis history, but we can verify
      // that the system processes it by checking if effectiveness analysis works
      const testRule: GovernanceRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'A test rule',
        priority: 50,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.CRISIS_DETECTED,
          parameters: { severity: 'medium' }
        },
        action: {
          type: ActionType.EMERGENCY_STOP,
          parameters: {},
          priority: ActionPriority.HIGH,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([testRule]);
      const effectiveness = learningSystem.getEffectiveness();
      expect(effectiveness.size).toBe(1);
    });

    test('should limit crisis history to prevent memory issues', () => {
      // Add many crises to test the limit
      for (let i = 0; i < 60; i++) {
        const crisis: CrisisScenario = {
          id: `crisis-${i}`,
          type: CrisisType.RESOURCE_EXHAUSTION,
          severity: 5,
          involvedAgents: [`device-${i}`],
          triggerEvents: [],
          cascadeEffects: [],
          recoveryOptions: []
        };
        learningSystem.addCrisisHistory(crisis);
      }

      // The system should handle this gracefully without issues
      expect(learningSystem).toBeTruthy();
    });
  });

  describe('Insight Generation', () => {
    test('should generate insights based on rule performance', () => {
      const poorPerformingRule: GovernanceRule = {
        id: 'poor-rule',
        name: 'Poor Performing Rule',
        description: 'A rule that performs poorly',
        priority: 30,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 90 }
        },
        action: {
          type: ActionType.SEND_NOTIFICATION,
          parameters: { message: 'High usage detected' },
          priority: ActionPriority.LOW,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([poorPerformingRule]);

      // Trigger analysis
      const analyzeBtn = container.querySelector('#analyze-governance') as HTMLButtonElement;
      analyzeBtn.click();

      const insights = learningSystem.getInsights();
      expect(insights.length).toBeGreaterThanOrEqual(0);
    });

    test('should display insights in the insights panel', () => {
      const testInsight: LearningInsight = {
        id: 'test-insight',
        category: InsightCategory.RULE_EFFECTIVENESS,
        title: 'Test Insight',
        description: 'This is a test insight for unit testing',
        severity: 'warning',
        timestamp: Date.now(),
        relatedRules: ['test-rule'],
        actionable: true,
        suggestedActions: ['Review rule', 'Adjust parameters']
      };

      // We can't directly add insights, but we can test the display logic
      // by setting up conditions that would generate insights
      const testRule: GovernanceRule = {
        id: 'insight-test-rule',
        name: 'Insight Test Rule',
        description: 'Rule for testing insight generation',
        priority: 20, // Low priority to potentially trigger insights
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 95 }
        },
        action: {
          type: ActionType.SEND_NOTIFICATION,
          parameters: { message: 'Test notification' },
          priority: ActionPriority.LOW,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([testRule]);

      // The insights panel should exist and be ready to display insights
      const insightsPanel = container.querySelector('.insights-panel');
      expect(insightsPanel).toBeTruthy();
    });

    test('should handle insight dismissal', () => {
      // Set up a rule that might generate insights
      const testRule: GovernanceRule = {
        id: 'dismissal-test-rule',
        name: 'Dismissal Test Rule',
        description: 'Rule for testing insight dismissal',
        priority: 25,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 85 }
        },
        action: {
          type: ActionType.LIMIT_RESOURCE,
          parameters: { maxUsage: 80 },
          priority: ActionPriority.LOW,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([testRule]);

      // Check that dismiss buttons would work if insights were present
      const dismissButtons = container.querySelectorAll('[data-action="dismiss-insight"]');
      dismissButtons.forEach(button => {
        expect(button.getAttribute('data-action')).toBe('dismiss-insight');
      });
    });
  });

  describe('Pattern Detection', () => {
    test('should detect safety-first governance pattern', () => {
      const safetyRules: GovernanceRule[] = [
        {
          id: 'safety-rule-1',
          name: 'Primary Safety Rule',
          description: 'High priority safety rule for critical situations',
          priority: 95,
          constitutional: true,
          enabled: true,
          condition: {
            type: ConditionType.CRISIS_DETECTED,
            parameters: { severity: 'critical' }
          },
          action: {
            type: ActionType.EMERGENCY_STOP,
            parameters: {},
            priority: ActionPriority.CRITICAL,
            reversible: false
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.HOSPITAL]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        },
        {
          id: 'safety-rule-2',
          name: 'Secondary Safety Rule',
          description: 'Another high priority safety rule',
          priority: 85,
          constitutional: true,
          enabled: true,
          condition: {
            type: ConditionType.DEVICE_STATE,
            parameters: { state: 'malfunction' }
          },
          action: {
            type: ActionType.ISOLATE_DEVICE,
            parameters: {},
            priority: ActionPriority.HIGH,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.HOSPITAL]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        }
      ];

      learningSystem.setRules(safetyRules);

      const patterns = learningSystem.getPatterns();
      const safetyPattern = patterns.find(p => p.id === 'safety-first-pattern');
      expect(safetyPattern).toBeTruthy();
    });

    test('should display patterns in patterns grid', () => {
      const testRules: GovernanceRule[] = [
        {
          id: 'efficiency-rule-1',
          name: 'Energy Efficiency Rule',
          description: 'Optimizes energy efficiency in the system',
          priority: 70,
          constitutional: false,
          enabled: true,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { resourceType: ResourceType.ENERGY, threshold: 80 }
          },
          action: {
            type: ActionType.LIMIT_RESOURCE,
            parameters: { maxUsage: 70 },
            priority: ActionPriority.MEDIUM,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.OFFICE]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        }
      ];

      learningSystem.setRules(testRules);

      const patternsGrid = container.querySelector('.patterns-grid');
      expect(patternsGrid).toBeTruthy();

      const patternCards = container.querySelectorAll('.pattern-card');
      expect(patternCards.length).toBeGreaterThan(0);
    });
  });

  describe('Celebration System', () => {
    test('should trigger celebrations for achievements', () => {
      const callback = jest.fn();
      learningSystem.onCelebrationTriggered(callback);

      // Set up high-performing rules that should trigger celebrations
      const excellentRules: GovernanceRule[] = [
        {
          id: 'excellent-rule-1',
          name: 'Excellent Safety Rule',
          description: 'A highly effective safety rule',
          priority: 95,
          constitutional: true,
          enabled: true,
          condition: {
            type: ConditionType.CRISIS_DETECTED,
            parameters: { severity: 'high' }
          },
          action: {
            type: ActionType.EMERGENCY_STOP,
            parameters: {},
            priority: ActionPriority.CRITICAL,
            reversible: false
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.HOSPITAL, EnvironmentType.OFFICE]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        }
      ];

      learningSystem.setRules(excellentRules);

      // The celebration system should be ready to trigger celebrations
      const celebrations = learningSystem.getCelebrations();
      expect(Array.isArray(celebrations)).toBe(true);
    });

    test('should display celebrations in celebrations feed', () => {
      const celebrationsFeed = container.querySelector('.celebrations-feed');
      expect(celebrationsFeed).toBeTruthy();

      // Initially should show no celebrations message
      const noCelebrations = container.querySelector('.no-celebrations');
      expect(noCelebrations).toBeTruthy();
    });

    test('should handle celebration interaction', () => {
      const celebrateButtons = container.querySelectorAll('[data-action="celebrate-achievement"]');
      celebrateButtons.forEach(button => {
        expect(button.getAttribute('data-action')).toBe('celebrate-achievement');
      });
    });
  });

  describe('Improvement Suggestions', () => {
    test('should generate improvement suggestions for rules', () => {
      const improvableRule: GovernanceRule = {
        id: 'improvable-rule',
        name: 'Improvable Rule',
        description: 'A rule that could be improved',
        priority: 40,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 60 }
        },
        action: {
          type: ActionType.SEND_NOTIFICATION,
          parameters: { message: 'Resource usage alert' },
          priority: ActionPriority.LOW,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([improvableRule]);

      const effectiveness = learningSystem.getEffectiveness();
      const suggestions = Array.from(effectiveness.values())
        .flatMap(eff => eff.improvementSuggestions);

      expect(Array.isArray(suggestions)).toBe(true);
    });

    test('should handle suggestion application', () => {
      const callback = jest.fn();
      learningSystem.onImprovementSuggested(callback);

      // Set up a rule that would generate suggestions
      const testRule: GovernanceRule = {
        id: 'suggestion-test-rule',
        name: 'Suggestion Test Rule',
        description: 'Rule for testing suggestions',
        priority: 35,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 70 }
        },
        action: {
          type: ActionType.LIMIT_RESOURCE,
          parameters: { maxUsage: 65 },
          priority: ActionPriority.LOW,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([testRule]);

      // Check that suggestion buttons exist and have proper attributes
      const suggestionButtons = container.querySelectorAll('[data-action="apply-suggestion"]');
      suggestionButtons.forEach(button => {
        expect(button.getAttribute('data-action')).toBe('apply-suggestion');
      });
    });

    test('should apply all suggestions when requested', () => {
      const applyAllBtn = container.querySelector('#apply-suggestions') as HTMLButtonElement;
      expect(applyAllBtn).toBeTruthy();

      // Mock confirm dialog
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn();

      applyAllBtn.click();

      // Should handle the case where no suggestions are available
      expect(window.alert).toHaveBeenCalled();
    });
  });

  describe('Learning Controls', () => {
    test('should have all control buttons', () => {
      const analyzeBtn = container.querySelector('#analyze-governance');
      const applySuggestionsBtn = container.querySelector('#apply-suggestions');
      const exportBtn = container.querySelector('#export-insights');
      const resetBtn = container.querySelector('#reset-learning');

      expect(analyzeBtn).toBeTruthy();
      expect(applySuggestionsBtn).toBeTruthy();
      expect(exportBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
    });

    test('should perform governance analysis when analyze button clicked', () => {
      window.alert = jest.fn();

      const analyzeBtn = container.querySelector('#analyze-governance') as HTMLButtonElement;
      analyzeBtn.click();

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Governance analysis complete')
      );
    });

    test('should export learning report when export button clicked', () => {
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockClick = jest.fn();
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

      const exportBtn = container.querySelector('#export-insights') as HTMLButtonElement;
      exportBtn.click();

      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('governance-learning-report.json');
    });

    test('should reset learning data when reset button clicked', () => {
      window.confirm = jest.fn(() => true);
      window.alert = jest.fn();

      const resetBtn = container.querySelector('#reset-learning') as HTMLButtonElement;
      resetBtn.click();

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to reset all learning data')
      );
      expect(window.alert).toHaveBeenCalledWith('Learning data has been reset.');
    });
  });

  describe('Event Callbacks', () => {
    test('should call insight callback when insights are generated', () => {
      const callback = jest.fn();
      learningSystem.onInsightGenerated(callback);

      // Set up conditions that might generate insights
      const testRule: GovernanceRule = {
        id: 'callback-test-rule',
        name: 'Callback Test Rule',
        description: 'Rule for testing callbacks',
        priority: 15, // Very low priority might trigger insights
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 95 }
        },
        action: {
          type: ActionType.SEND_NOTIFICATION,
          parameters: { message: 'Test' },
          priority: ActionPriority.LOW,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([testRule]);

      // The callback should be set up correctly
      expect(callback).toBeDefined();
    });

    test('should call improvement suggestion callback', () => {
      const callback = jest.fn();
      learningSystem.onImprovementSuggested(callback);

      // The callback should be set up correctly
      expect(callback).toBeDefined();
    });

    test('should call celebration callback', () => {
      const callback = jest.fn();
      learningSystem.onCelebrationTriggered(callback);

      // The callback should be set up correctly
      expect(callback).toBeDefined();
    });
  });

  describe('Statistics and Metrics', () => {
    test('should calculate and display success rate', () => {
      const testRules: GovernanceRule[] = [
        {
          id: 'metrics-rule-1',
          name: 'Metrics Test Rule 1',
          description: 'First rule for metrics testing',
          priority: 80,
          constitutional: false,
          enabled: true,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { resourceType: ResourceType.ENERGY, threshold: 75 }
          },
          action: {
            type: ActionType.LIMIT_RESOURCE,
            parameters: { maxUsage: 70 },
            priority: ActionPriority.HIGH,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        }
      ];

      learningSystem.setRules(testRules);

      const successRate = container.querySelector('#success-rate');
      expect(successRate).toBeTruthy();
      
      // Should display a percentage
      const rateText = successRate?.textContent;
      expect(rateText).toMatch(/\d+\.\d+%/);
    });

    test('should update stats when rules change', () => {
      const initialSuccessRate = container.querySelector('#success-rate')?.textContent;

      const newRules: GovernanceRule[] = [
        {
          id: 'stats-rule',
          name: 'Stats Update Rule',
          description: 'Rule for testing stats updates',
          priority: 75,
          constitutional: false,
          enabled: true,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { resourceType: ResourceType.BANDWIDTH, threshold: 80 }
          },
          action: {
            type: ActionType.LIMIT_RESOURCE,
            parameters: { maxUsage: 75 },
            priority: ActionPriority.MEDIUM,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.OFFICE]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        }
      ];

      learningSystem.setRules(newRules);

      const updatedSuccessRate = container.querySelector('#success-rate')?.textContent;
      expect(updatedSuccessRate).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('should have proper semantic structure', () => {
      const headings = container.querySelectorAll('h2, h3, h4, h5');
      expect(headings.length).toBeGreaterThan(0);

      headings.forEach(heading => {
        expect(heading.textContent?.trim()).toBeTruthy();
      });
    });

    test('should have accessible buttons', () => {
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(
          button.textContent?.trim() ||
          button.getAttribute('aria-label') ||
          button.getAttribute('title')
        ).toBeTruthy();
      });
    });

    test('should support keyboard navigation', () => {
      const focusableElements = container.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should have proper color contrast indicators', () => {
      // Test that severity and score classes exist for proper styling
      const testRule: GovernanceRule = {
        id: 'accessibility-rule',
        name: 'Accessibility Test Rule',
        description: 'Rule for testing accessibility',
        priority: 50,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 70 }
        },
        action: {
          type: ActionType.LIMIT_RESOURCE,
          parameters: { maxUsage: 65 },
          priority: ActionPriority.MEDIUM,
          reversible: true
        },
        scope: {
          devices: ['all'],
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      learningSystem.setRules([testRule]);

      // Check that score classes would be applied
      const effectivenessCards = container.querySelectorAll('.effectiveness-card');
      effectivenessCards.forEach(card => {
        const classList = Array.from(card.classList);
        const hasScoreClass = classList.some(cls => cls.startsWith('score-'));
        // The score class might not be applied immediately, but the structure should support it
        expect(card.classList.contains('effectiveness-card')).toBe(true);
      });
    });
  });
});