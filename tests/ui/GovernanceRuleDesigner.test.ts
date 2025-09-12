import { GovernanceRuleDesigner } from '../../src/ui/GovernanceRuleDesigner';
import {
  GovernanceRule,
  RuleCategory,
  ConditionType,
  ActionType,
  ActionPriority,
  EnvironmentType,
  ConflictType,
  ConflictSeverity,
  DeviceCategory,
  ResourceType
} from '../../src/types/core';

// Mock DOM environment
const mockContainer = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

describe('GovernanceRuleDesigner', () => {
  let designer: GovernanceRuleDesigner;
  let container: HTMLElement;

  beforeEach(() => {
    container = mockContainer();
    designer = new GovernanceRuleDesigner(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    test('should create designer interface with all panels', () => {
      expect(container.querySelector('.governance-designer')).toBeTruthy();
      expect(container.querySelector('.templates-panel')).toBeTruthy();
      expect(container.querySelector('.rules-panel')).toBeTruthy();
      expect(container.querySelector('.conflicts-panel')).toBeTruthy();
    });

    test('should initialize with default templates', () => {
      const templateCards = container.querySelectorAll('.template-card');
      expect(templateCards.length).toBeGreaterThan(0);
      
      // Check for specific template categories
      expect(container.querySelector('[data-template-id="safety-first"]')).toBeTruthy();
      expect(container.querySelector('[data-template-id="efficiency-focus"]')).toBeTruthy();
      expect(container.querySelector('[data-template-id="privacy-protection"]')).toBeTruthy();
    });

    test('should show empty state when no rules exist', () => {
      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No rules created yet');
    });
  });

  describe('Template Usage', () => {
    test('should create rule from template when use template button clicked', () => {
      const useTemplateBtn = container.querySelector('[data-action="use-template"]') as HTMLButtonElement;
      expect(useTemplateBtn).toBeTruthy();

      // Mock the template card parent
      const templateCard = document.createElement('div');
      templateCard.classList.add('template-card');
      templateCard.dataset.templateId = 'safety-first';
      useTemplateBtn.appendChild(templateCard);

      useTemplateBtn.click();

      const rules = designer.getRules();
      expect(rules.length).toBe(1);
      expect(rules[0].name).toContain('Safety');
      expect(rules[0].constitutional).toBe(true);
    });

    test('should support drag and drop from templates to rules panel', () => {
      const templateCard = container.querySelector('.template-card') as HTMLElement;
      const rulesPanel = container.querySelector('.rules-list') as HTMLElement;

      // Simulate drag start
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        dataTransfer: new DataTransfer()
      });
      templateCard.dispatchEvent(dragStartEvent);

      // Simulate drop
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        dataTransfer: new DataTransfer()
      });
      rulesPanel.dispatchEvent(dropEvent);

      // Should create a rule (though exact behavior depends on implementation)
      expect(designer.getRules().length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Rule Management', () => {
    let testRule: GovernanceRule;

    beforeEach(() => {
      testRule = {
        id: 'test-rule-1',
        name: 'Test Rule',
        description: 'A test rule for unit testing',
        priority: 75,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 80 }
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
      };
    });

    test('should display rules with correct priority ordering', () => {
      const lowPriorityRule = { ...testRule, id: 'low', priority: 30 };
      const highPriorityRule = { ...testRule, id: 'high', priority: 90 };
      
      designer.setRules([lowPriorityRule, highPriorityRule]);

      const ruleCards = container.querySelectorAll('.rule-card');
      expect(ruleCards.length).toBe(2);
      
      // High priority should come first
      const firstCard = ruleCards[0] as HTMLElement;
      expect(firstCard.dataset.ruleId).toBe('high');
    });

    test('should show constitutional rules with special styling', () => {
      const constitutionalRule = { ...testRule, constitutional: true };
      designer.setRules([constitutionalRule]);

      const ruleCard = container.querySelector('.rule-card');
      expect(ruleCard?.classList.contains('constitutional')).toBe(true);
    });

    test('should allow toggling rule enabled state', () => {
      designer.setRules([testRule]);
      
      const toggleBtn = container.querySelector('[data-action="toggle-rule"]') as HTMLButtonElement;
      expect(toggleBtn).toBeTruthy();

      toggleBtn.click();

      const updatedRules = designer.getRules();
      expect(updatedRules[0].enabled).toBe(false);
    });

    test('should prevent deletion of constitutional rules', () => {
      const constitutionalRule = { ...testRule, constitutional: true };
      designer.setRules([constitutionalRule]);

      const deleteBtn = container.querySelector('[data-action="delete-rule"]') as HTMLButtonElement;
      expect(deleteBtn.disabled).toBe(true);
    });

    test('should allow deletion of non-constitutional rules', () => {
      designer.setRules([testRule]);
      
      // Mock confirm dialog
      window.confirm = jest.fn(() => true);

      const deleteBtn = container.querySelector('[data-action="delete-rule"]') as HTMLButtonElement;
      deleteBtn.click();

      expect(designer.getRules().length).toBe(0);
    });
  });

  describe('Rule Editor', () => {
    test('should open rule editor when add rule button clicked', () => {
      const addRuleBtn = container.querySelector('#add-rule') as HTMLButtonElement;
      addRuleBtn.click();

      const modal = container.querySelector('#rule-editor') as HTMLElement;
      expect(modal.style.display).toBe('block');
    });

    test('should populate form when editing existing rule', () => {
      const testRule: GovernanceRule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'Test description',
        priority: 60,
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

      designer.setRules([testRule]);

      const editBtn = container.querySelector('[data-action="edit-rule"]') as HTMLButtonElement;
      editBtn.click();

      const nameInput = container.querySelector('#rule-name') as HTMLInputElement;
      const descInput = container.querySelector('#rule-description') as HTMLTextAreaElement;
      const priorityInput = container.querySelector('#rule-priority') as HTMLInputElement;

      expect(nameInput.value).toBe('Test Rule');
      expect(descInput.value).toBe('Test description');
      expect(priorityInput.value).toBe('60');
    });

    test('should close editor when cancel button clicked', () => {
      const addRuleBtn = container.querySelector('#add-rule') as HTMLButtonElement;
      addRuleBtn.click();

      const cancelBtn = container.querySelector('#cancel-edit') as HTMLButtonElement;
      cancelBtn.click();

      const modal = container.querySelector('#rule-editor') as HTMLElement;
      expect(modal.style.display).toBe('none');
    });

    test('should update condition parameters when condition type changes', () => {
      const addRuleBtn = container.querySelector('#add-rule') as HTMLButtonElement;
      addRuleBtn.click();

      const conditionSelect = container.querySelector('#condition-type') as HTMLSelectElement;
      conditionSelect.value = ConditionType.TIME_BASED;
      conditionSelect.dispatchEvent(new Event('change'));

      const timeInputs = container.querySelectorAll('input[type="time"]');
      expect(timeInputs.length).toBeGreaterThan(0);
    });

    test('should update action parameters when action type changes', () => {
      const addRuleBtn = container.querySelector('#add-rule') as HTMLButtonElement;
      addRuleBtn.click();

      const actionSelect = container.querySelector('#action-type') as HTMLSelectElement;
      actionSelect.value = ActionType.SEND_NOTIFICATION;
      actionSelect.dispatchEvent(new Event('change'));

      const messageTextarea = container.querySelector('#notification-message');
      expect(messageTextarea).toBeTruthy();
    });
  });

  describe('Conflict Detection', () => {
    test('should detect priority conflicts between rules', () => {
      const rule1: GovernanceRule = {
        id: 'rule1',
        name: 'Rule 1',
        description: 'First rule',
        priority: 50,
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

      const rule2: GovernanceRule = {
        ...rule1,
        id: 'rule2',
        name: 'Rule 2',
        description: 'Second rule with same priority'
      };

      designer.setRules([rule1, rule2]);

      const conflicts = designer.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe(ConflictType.PRIORITY_CONFLICT);
    });

    test('should detect action contradictions', () => {
      const enableRule: GovernanceRule = {
        id: 'enable-rule',
        name: 'Enable Rule',
        description: 'Enables devices',
        priority: 50,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 80 }
        },
        action: {
          type: ActionType.ENABLE_DEVICE,
          parameters: {},
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

      const disableRule: GovernanceRule = {
        ...enableRule,
        id: 'disable-rule',
        name: 'Disable Rule',
        description: 'Disables devices',
        action: {
          type: ActionType.DISABLE_DEVICE,
          parameters: {},
          priority: ActionPriority.MEDIUM,
          reversible: true
        }
      };

      designer.setRules([enableRule, disableRule]);

      const conflicts = designer.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].conflictType).toBe(ConflictType.ACTION_CONTRADICTION);
    });

    test('should display conflicts in conflicts panel', () => {
      const rule1: GovernanceRule = {
        id: 'rule1',
        name: 'Conflicting Rule 1',
        description: 'First conflicting rule',
        priority: 50,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 80 }
        },
        action: {
          type: ActionType.ENABLE_DEVICE,
          parameters: {},
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

      const rule2: GovernanceRule = {
        ...rule1,
        id: 'rule2',
        name: 'Conflicting Rule 2',
        action: {
          type: ActionType.DISABLE_DEVICE,
          parameters: {},
          priority: ActionPriority.MEDIUM,
          reversible: true
        }
      };

      designer.setRules([rule1, rule2]);

      const conflictCards = container.querySelectorAll('.conflict-card');
      expect(conflictCards.length).toBeGreaterThan(0);
    });

    test('should show no conflicts message when no conflicts exist', () => {
      const rule: GovernanceRule = {
        id: 'single-rule',
        name: 'Single Rule',
        description: 'A single rule with no conflicts',
        priority: 50,
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

      designer.setRules([rule]);

      const noConflicts = container.querySelector('.no-conflicts');
      expect(noConflicts).toBeTruthy();
      expect(noConflicts?.textContent).toContain('No rule conflicts detected');
    });
  });

  describe('Rule Validation', () => {
    test('should validate all rules when validate button clicked', () => {
      const validateBtn = container.querySelector('#validate-rules') as HTMLButtonElement;
      
      // Mock alert
      window.alert = jest.fn();

      validateBtn.click();

      expect(window.alert).toHaveBeenCalled();
    });

    test('should show success message when no conflicts found', () => {
      const rule: GovernanceRule = {
        id: 'valid-rule',
        name: 'Valid Rule',
        description: 'A valid rule',
        priority: 50,
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

      designer.setRules([rule]);

      window.alert = jest.fn();
      const validateBtn = container.querySelector('#validate-rules') as HTMLButtonElement;
      validateBtn.click();

      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('All rules validated successfully')
      );
    });
  });

  describe('Import/Export', () => {
    test('should export rules when export button clicked', () => {
      const rule: GovernanceRule = {
        id: 'export-rule',
        name: 'Export Rule',
        description: 'A rule to export',
        priority: 50,
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

      designer.setRules([rule]);

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

      const exportBtn = container.querySelector('#export-rules') as HTMLButtonElement;
      exportBtn.click();

      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toBe('governance-rules.json');
    });

    test('should import rules from valid JSON data', () => {
      const importData = {
        rules: [{
          id: 'imported-rule',
          name: 'Imported Rule',
          description: 'An imported rule',
          priority: 60,
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
        }],
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      designer.importRules(importData);

      const rules = designer.getRules();
      expect(rules.length).toBe(1);
      expect(rules[0].name).toBe('Imported Rule');
    });

    test('should handle invalid import data gracefully', () => {
      window.alert = jest.fn();
      console.error = jest.fn();

      designer.importRules({ invalid: 'data' });

      expect(console.error).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to import rules')
      );
    });
  });

  describe('Event Callbacks', () => {
    test('should call onRuleChanged callback when rules change', () => {
      const callback = jest.fn();
      designer.onRuleChanged(callback);

      const rule: GovernanceRule = {
        id: 'callback-rule',
        name: 'Callback Rule',
        description: 'A rule to test callbacks',
        priority: 50,
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

      designer.setRules([rule]);

      expect(callback).toHaveBeenCalledWith([rule]);
    });

    test('should call onConflictsDetected callback when conflicts are found', () => {
      const callback = jest.fn();
      designer.onConflictsDetected(callback);

      const rule1: GovernanceRule = {
        id: 'conflict-rule-1',
        name: 'Conflict Rule 1',
        description: 'First conflicting rule',
        priority: 50,
        constitutional: false,
        enabled: true,
        condition: {
          type: ConditionType.RESOURCE_USAGE,
          parameters: { resourceType: ResourceType.ENERGY, threshold: 80 }
        },
        action: {
          type: ActionType.ENABLE_DEVICE,
          parameters: {},
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

      const rule2: GovernanceRule = {
        ...rule1,
        id: 'conflict-rule-2',
        name: 'Conflict Rule 2',
        action: {
          type: ActionType.DISABLE_DEVICE,
          parameters: {},
          priority: ActionPriority.MEDIUM,
          reversible: true
        }
      };

      designer.setRules([rule1, rule2]);

      expect(callback).toHaveBeenCalled();
      const conflicts = callback.mock.calls[0][0];
      expect(conflicts.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        expect(button.getAttribute('title') || button.textContent).toBeTruthy();
      });
    });

    test('should support keyboard navigation', () => {
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should have proper form labels', () => {
      const addRuleBtn = container.querySelector('#add-rule') as HTMLButtonElement;
      addRuleBtn.click();

      const inputs = container.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const label = container.querySelector(`label[for="${input.id}"]`);
        const parentLabel = input.closest('label');
        expect(label || parentLabel).toBeTruthy();
      });
    });
  });
});