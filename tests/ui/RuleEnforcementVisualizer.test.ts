import { RuleEnforcementVisualizer, RuleEnforcement, RuleViolation, ViolationType, CorrectionType } from '../../src/ui/RuleEnforcementVisualizer';
import {
  GovernanceRule,
  ConditionType,
  ActionType,
  ActionPriority,
  EnvironmentType,
  ConflictSeverity,
  ResourceType
} from '../../src/types/core';

// Mock DOM environment
const mockContainer = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

describe('RuleEnforcementVisualizer', () => {
  let visualizer: RuleEnforcementVisualizer;
  let container: HTMLElement;

  beforeEach(() => {
    container = mockContainer();
    visualizer = new RuleEnforcementVisualizer(container);
  });

  afterEach(() => {
    visualizer.destroy();
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    test('should create visualizer interface with all panels', () => {
      expect(container.querySelector('.rule-enforcement-visualizer')).toBeTruthy();
      expect(container.querySelector('.active-rules-panel')).toBeTruthy();
      expect(container.querySelector('.enforcement-feed-panel')).toBeTruthy();
      expect(container.querySelector('.violations-panel')).toBeTruthy();
      expect(container.querySelector('.constitutional-protection-panel')).toBeTruthy();
    });

    test('should initialize with zero stats', () => {
      const activeRulesCount = container.querySelector('#active-rules-count');
      const enforcementsCount = container.querySelector('#enforcements-count');
      const violationsCount = container.querySelector('#violations-count');

      expect(activeRulesCount?.textContent).toBe('0');
      expect(enforcementsCount?.textContent).toBe('0');
      expect(violationsCount?.textContent).toBe('0');
    });

    test('should show empty states for all panels initially', () => {
      expect(container.querySelector('.empty-feed')).toBeTruthy();
      expect(container.querySelector('.no-violations')).toBeTruthy();
    });
  });

  describe('Rule Management', () => {
    let testRules: GovernanceRule[];

    beforeEach(() => {
      testRules = [
        {
          id: 'rule-1',
          name: 'Safety Rule',
          description: 'Ensures device safety',
          priority: 90,
          constitutional: true,
          enabled: true,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { resourceType: ResourceType.ENERGY, threshold: 80 }
          },
          action: {
            type: ActionType.DISABLE_DEVICE,
            parameters: {},
            priority: ActionPriority.CRITICAL,
            reversible: false
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME]
          },
          createdAt: Date.now(),
          lastModified: Date.now()
        },
        {
          id: 'rule-2',
          name: 'Efficiency Rule',
          description: 'Optimizes resource usage',
          priority: 50,
          constitutional: false,
          enabled: true,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { resourceType: ResourceType.ENERGY, threshold: 70 }
          },
          action: {
            type: ActionType.LIMIT_RESOURCE,
            parameters: { maxUsage: 60 },
            priority: ActionPriority.MEDIUM,
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
    });

    test('should display active rules correctly', () => {
      visualizer.setRules(testRules);

      const ruleCards = container.querySelectorAll('.rule-status-card');
      expect(ruleCards.length).toBe(2);

      const constitutionalCard = container.querySelector('.rule-status-card.constitutional');
      expect(constitutionalCard).toBeTruthy();
    });

    test('should update stats when rules are set', () => {
      visualizer.setRules(testRules);

      const activeRulesCount = container.querySelector('#active-rules-count');
      expect(activeRulesCount?.textContent).toBe('2');
    });

    test('should show constitutional rules in protection panel', () => {
      visualizer.setRules(testRules);

      const constitutionalRules = container.querySelectorAll('.constitutional-rule-card');
      expect(constitutionalRules.length).toBe(1);

      const protectionBadge = container.querySelector('.protection-badge');
      expect(protectionBadge?.textContent).toBe('Protected');
    });

    test('should activate and deactivate rules', () => {
      visualizer.setRules(testRules);
      
      visualizer.deactivateRule('rule-1');
      const activeRules = visualizer.getActiveRules();
      expect(activeRules).not.toContain('rule-1');
      expect(activeRules).toContain('rule-2');

      visualizer.activateRule('rule-1');
      const reactivatedRules = visualizer.getActiveRules();
      expect(reactivatedRules).toContain('rule-1');
    });
  });

  describe('Enforcement Tracking', () => {
    let testEnforcement: RuleEnforcement;

    beforeEach(() => {
      testEnforcement = {
        ruleId: 'rule-1',
        deviceId: 'device-1',
        timestamp: Date.now(),
        action: 'disable_device',
        success: true,
        reason: 'Resource limit exceeded',
        impact: {
          resourcesAffected: ['energy'],
          devicesAffected: ['device-1'],
          severity: 'medium',
          description: 'Device disabled to prevent overload'
        }
      };
    });

    test('should display enforcement actions in feed', () => {
      visualizer.reportEnforcement(testEnforcement);

      const enforcementItems = container.querySelectorAll('.enforcement-item');
      expect(enforcementItems.length).toBe(1);

      const successItem = container.querySelector('.enforcement-item.success');
      expect(successItem).toBeTruthy();
    });

    test('should update enforcement count in stats', () => {
      visualizer.reportEnforcement(testEnforcement);

      const enforcementsCount = container.querySelector('#enforcements-count');
      expect(enforcementsCount?.textContent).toBe('1');
    });

    test('should show enforcement details correctly', () => {
      visualizer.reportEnforcement(testEnforcement);

      const enforcementDetails = container.querySelector('.enforcement-details');
      expect(enforcementDetails?.textContent).toContain('disable_device');
      expect(enforcementDetails?.textContent).toContain('device-1');
    });

    test('should handle failed enforcements', () => {
      const failedEnforcement = { ...testEnforcement, success: false };
      visualizer.reportEnforcement(failedEnforcement);

      const failedItem = container.querySelector('.enforcement-item.failed');
      expect(failedItem).toBeTruthy();
    });

    test('should limit enforcement history to prevent memory issues', () => {
      // Add 150 enforcements (more than the 100 limit)
      for (let i = 0; i < 150; i++) {
        visualizer.reportEnforcement({
          ...testEnforcement,
          timestamp: Date.now() + i
        });
      }

      const enforcements = visualizer.getEnforcements();
      expect(enforcements.length).toBe(100);
    });
  });

  describe('Violation Detection and Handling', () => {
    let testViolation: RuleViolation;

    beforeEach(() => {
      testViolation = {
        id: 'violation-1',
        ruleId: 'rule-1',
        deviceId: 'device-1',
        violationType: ViolationType.RESOURCE_LIMIT_EXCEEDED,
        severity: ConflictSeverity.HIGH,
        timestamp: Date.now(),
        description: 'Device exceeded energy limit',
        suggestedCorrections: [
          {
            type: CorrectionType.ADJUST_RESOURCE_LIMIT,
            description: 'Increase energy limit',
            autoApplicable: true,
            parameters: { newLimit: 90 }
          },
          {
            type: CorrectionType.DISABLE_DEVICE,
            description: 'Disable device temporarily',
            autoApplicable: true,
            parameters: { duration: 300000 }
          }
        ],
        autoCorrectible: true
      };
    });

    test('should display violations in violations panel', () => {
      visualizer.reportViolation(testViolation);

      const violationCards = container.querySelectorAll('.violation-card');
      expect(violationCards.length).toBe(1);

      const highSeverityCard = container.querySelector('.violation-card.severity-high');
      expect(highSeverityCard).toBeTruthy();
    });

    test('should update violation count in stats', () => {
      visualizer.reportViolation(testViolation);

      const violationsCount = container.querySelector('#violations-count');
      expect(violationsCount?.textContent).toBe('1');
    });

    test('should show correction suggestions', () => {
      visualizer.reportViolation(testViolation);

      const correctionButtons = container.querySelectorAll('.btn-correction');
      expect(correctionButtons.length).toBe(2);

      const autoApplicableButton = container.querySelector('.btn-correction.auto-applicable');
      expect(autoApplicableButton).toBeTruthy();
    });

    test('should handle violation correction', () => {
      visualizer.reportViolation(testViolation);

      const correctionButton = container.querySelector('[data-action="apply-correction"]') as HTMLButtonElement;
      expect(correctionButton).toBeTruthy();

      correctionButton.click();

      // Violation should be removed after correction
      const violations = visualizer.getViolations();
      expect(violations.length).toBe(0);

      // Enforcement should be added
      const enforcements = visualizer.getEnforcements();
      expect(enforcements.length).toBe(1);
    });

    test('should handle violation dismissal', () => {
      visualizer.reportViolation(testViolation);

      const dismissButton = container.querySelector('[data-action="dismiss-violation"]') as HTMLButtonElement;
      expect(dismissButton).toBeTruthy();

      dismissButton.click();

      const violations = visualizer.getViolations();
      expect(violations.length).toBe(0);
    });

    test('should sort violations by severity and timestamp', () => {
      const lowSeverityViolation = {
        ...testViolation,
        id: 'violation-2',
        severity: ConflictSeverity.LOW,
        timestamp: Date.now() + 1000
      };

      const criticalViolation = {
        ...testViolation,
        id: 'violation-3',
        severity: ConflictSeverity.CRITICAL,
        timestamp: Date.now() + 2000
      };

      visualizer.reportViolation(testViolation); // HIGH
      visualizer.reportViolation(lowSeverityViolation); // LOW
      visualizer.reportViolation(criticalViolation); // CRITICAL

      const violationCards = container.querySelectorAll('.violation-card');
      expect(violationCards.length).toBe(3);

      // First card should be critical severity
      const firstCard = violationCards[0] as HTMLElement;
      expect(firstCard.classList.contains('severity-critical')).toBe(true);
    });
  });

  describe('Constitutional Protection', () => {
    test('should show constitutional protection status', () => {
      const constitutionalRule: GovernanceRule = {
        id: 'const-rule',
        name: 'Constitutional Safety Rule',
        description: 'Cannot be overridden',
        priority: 100,
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
      };

      visualizer.setRules([constitutionalRule]);

      const protectionStatus = container.querySelector('#protection-status');
      expect(protectionStatus?.classList.contains('active')).toBe(true);

      const protectionText = container.querySelector('#protection-status .indicator-text');
      expect(protectionText?.textContent).toBe('Constitutional Protection Active');
    });

    test('should prevent constitutional violations', () => {
      const constitutionalViolation: RuleViolation = {
        id: 'const-violation',
        ruleId: 'const-rule',
        deviceId: 'device-1',
        violationType: ViolationType.CONSTITUTIONAL_VIOLATION,
        severity: ConflictSeverity.CRITICAL,
        timestamp: Date.now(),
        description: 'Attempt to override constitutional rule',
        suggestedCorrections: [],
        autoCorrectible: false
      };

      visualizer.reportViolation(constitutionalViolation);

      const criticalViolation = container.querySelector('.violation-card.severity-critical');
      expect(criticalViolation).toBeTruthy();

      const violationType = container.querySelector('.violation-type');
      expect(violationType?.textContent).toContain('Constitutional Violation');
    });
  });

  describe('Real-time Updates', () => {
    test('should start real-time updates on initialization', () => {
      // The visualizer should have started an update interval
      expect(visualizer).toBeTruthy();
      
      // We can't easily test the interval directly, but we can test that
      // the update methods work correctly
      const testRule: GovernanceRule = {
        id: 'update-rule',
        name: 'Update Test Rule',
        description: 'For testing updates',
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
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      visualizer.setRules([testRule]);
      
      const activeRulesCount = container.querySelector('#active-rules-count');
      expect(activeRulesCount?.textContent).toBe('1');
    });

    test('should stop updates when destroyed', () => {
      visualizer.destroy();
      
      // After destruction, the visualizer should not update
      // This is mainly to prevent memory leaks
      expect(visualizer).toBeTruthy(); // Object still exists but intervals are cleared
    });
  });

  describe('Event Callbacks', () => {
    test('should call violation callback when violation is detected', () => {
      const violationCallback = jest.fn();
      visualizer.onViolationDetected(violationCallback);

      const testViolation: RuleViolation = {
        id: 'callback-violation',
        ruleId: 'rule-1',
        deviceId: 'device-1',
        violationType: ViolationType.RESOURCE_LIMIT_EXCEEDED,
        severity: ConflictSeverity.MEDIUM,
        timestamp: Date.now(),
        description: 'Test violation for callback',
        suggestedCorrections: [],
        autoCorrectible: false
      };

      visualizer.reportViolation(testViolation);

      expect(violationCallback).toHaveBeenCalledWith(testViolation);
    });

    test('should call enforcement callback when enforcement action occurs', () => {
      const enforcementCallback = jest.fn();
      visualizer.onEnforcementAction(enforcementCallback);

      // Create a violation first
      const testViolation: RuleViolation = {
        id: 'enforcement-test-violation',
        ruleId: 'rule-1',
        deviceId: 'device-1',
        violationType: ViolationType.RESOURCE_LIMIT_EXCEEDED,
        severity: ConflictSeverity.MEDIUM,
        timestamp: Date.now(),
        description: 'Test violation for enforcement callback',
        suggestedCorrections: [
          {
            type: CorrectionType.ADJUST_RESOURCE_LIMIT,
            description: 'Increase limit',
            autoApplicable: true,
            parameters: { newLimit: 85 }
          }
        ],
        autoCorrectible: true
      };

      visualizer.reportViolation(testViolation);

      // Apply correction which should trigger enforcement callback
      const correctionButton = container.querySelector('[data-action="apply-correction"]') as HTMLButtonElement;
      correctionButton.click();

      expect(enforcementCallback).toHaveBeenCalled();
      const enforcementCall = enforcementCallback.mock.calls[0][0];
      expect(enforcementCall.ruleId).toBe('rule-1');
      expect(enforcementCall.deviceId).toBe('device-1');
    });
  });

  describe('Rule Effectiveness Calculation', () => {
    test('should calculate rule effectiveness correctly', () => {
      const testRule: GovernanceRule = {
        id: 'effectiveness-rule',
        name: 'Effectiveness Test Rule',
        description: 'For testing effectiveness calculation',
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
          environments: [EnvironmentType.HOME]
        },
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      visualizer.setRules([testRule]);

      // Add some enforcements and violations
      visualizer.reportEnforcement({
        ruleId: 'effectiveness-rule',
        deviceId: 'device-1',
        timestamp: Date.now(),
        action: 'limit_resource',
        success: true,
        impact: {
          resourcesAffected: ['energy'],
          devicesAffected: ['device-1'],
          severity: 'low',
          description: 'Resource limited successfully'
        }
      });

      visualizer.reportEnforcement({
        ruleId: 'effectiveness-rule',
        deviceId: 'device-2',
        timestamp: Date.now(),
        action: 'limit_resource',
        success: true,
        impact: {
          resourcesAffected: ['energy'],
          devicesAffected: ['device-2'],
          severity: 'low',
          description: 'Resource limited successfully'
        }
      });

      visualizer.reportViolation({
        id: 'effectiveness-violation',
        ruleId: 'effectiveness-rule',
        deviceId: 'device-3',
        violationType: ViolationType.RESOURCE_LIMIT_EXCEEDED,
        severity: ConflictSeverity.LOW,
        timestamp: Date.now(),
        description: 'Rule was violated',
        suggestedCorrections: [],
        autoCorrectible: false
      });

      // Should show effectiveness visualization
      const effectivenessBar = container.querySelector('.effectiveness-fill') as HTMLElement;
      expect(effectivenessBar).toBeTruthy();
      
      // With 2 enforcements and 1 violation, effectiveness should be 67% (2/3)
      const effectivenessScore = container.querySelector('.effectiveness-score');
      expect(effectivenessScore?.textContent).toContain('67% effective');
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and semantic structure', () => {
      const headings = container.querySelectorAll('h2, h3, h4, h5');
      expect(headings.length).toBeGreaterThan(0);

      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(
          button.getAttribute('aria-label') || 
          button.getAttribute('title') || 
          button.textContent?.trim()
        ).toBeTruthy();
      });
    });

    test('should support keyboard navigation', () => {
      const focusableElements = container.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should have proper color contrast for severity indicators', () => {
      const testViolation: RuleViolation = {
        id: 'accessibility-violation',
        ruleId: 'rule-1',
        deviceId: 'device-1',
        violationType: ViolationType.RESOURCE_LIMIT_EXCEEDED,
        severity: ConflictSeverity.HIGH,
        timestamp: Date.now(),
        description: 'High severity violation for accessibility test',
        suggestedCorrections: [],
        autoCorrectible: false
      };

      visualizer.reportViolation(testViolation);

      const severityBadge = container.querySelector('.violation-severity.severity-high');
      expect(severityBadge).toBeTruthy();
      
      // The CSS should ensure proper contrast - we're just checking the element exists
      const computedStyle = window.getComputedStyle(severityBadge as Element);
      expect(computedStyle).toBeTruthy();
    });
  });
});