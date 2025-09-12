import {
  GovernanceRule,
  RuleTemplate,
  RuleConflict,
  RuleCategory,
  ConditionType,
  ActionType,
  ConflictSeverity,
  DeviceCategory,
  PersonalityTrait,
  ResourceType,
  ComparisonOperator,
  ActionPriority,
  EnvironmentType,
  ConflictResolution,
  ConflictType,
  ResolutionType
} from '../types/core.ts';

export class GovernanceRuleDesigner {
  private container: HTMLElement;
  private rules: GovernanceRule[] = [];
  private templates: RuleTemplate[] = [];
  private conflicts: RuleConflict[] = [];
  private draggedElement: HTMLElement | null = null;
  private onRuleChange?: (rules: GovernanceRule[]) => void;
  private onConflictDetected?: (conflicts: RuleConflict[]) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeTemplates();
    this.createInterface();
    this.setupEventListeners();
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'safety-first',
        name: 'Safety First',
        description: 'Prioritize safety over efficiency in all situations',
        category: RuleCategory.SAFETY,
        template: {
          name: 'Safety Priority Rule',
          priority: 100,
          constitutional: true,
          condition: {
            type: ConditionType.CRISIS_DETECTED,
            parameters: { severity: 'medium' }
          },
          action: {
            type: ActionType.DISABLE_DEVICE,
            parameters: { safetyOverride: true },
            priority: ActionPriority.CRITICAL,
            reversible: false
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.HOSPITAL, EnvironmentType.OFFICE]
          }
        },
        customizable: ['priority', 'scope.devices']
      },
      {
        id: 'efficiency-focus',
        name: 'Efficiency Focus',
        description: 'Optimize for maximum resource efficiency',
        category: RuleCategory.EFFICIENCY,
        template: {
          name: 'Efficiency Optimization Rule',
          priority: 50,
          constitutional: false,
          condition: {
            type: ConditionType.RESOURCE_USAGE,
            parameters: { threshold: 80, resourceType: 'energy' }
          },
          action: {
            type: ActionType.LIMIT_RESOURCE,
            parameters: { maxUsage: 70 },
            priority: ActionPriority.MEDIUM,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME, EnvironmentType.OFFICE]
          }
        },
        customizable: ['priority', 'condition.parameters.threshold', 'action.parameters.maxUsage']
      },
      {
        id: 'privacy-protection',
        name: 'Privacy Protection',
        description: 'Protect user privacy and data security',
        category: RuleCategory.PRIVACY,
        template: {
          name: 'Privacy Protection Rule',
          priority: 80,
          constitutional: true,
          condition: {
            type: ConditionType.USER_PRESENT,
            parameters: { detected: false }
          },
          action: {
            type: ActionType.DISABLE_DEVICE,
            parameters: { deviceCategories: [DeviceCategory.SECURITY] },
            priority: ActionPriority.HIGH,
            reversible: true
          },
          scope: {
            devices: ['all'],
            environments: [EnvironmentType.HOME]
          }
        },
        customizable: ['action.parameters.deviceCategories', 'scope.environments']
      }
    ];
  }

  private createInterface(): void {
    this.container.innerHTML = `
      <div class="governance-designer">
        <div class="designer-header">
          <h2>Governance Rule Designer</h2>
          <div class="header-controls">
            <button class="btn-primary" id="add-rule">Add Custom Rule</button>
            <button class="btn-secondary" id="validate-rules">Validate Rules</button>
            <button class="btn-secondary" id="export-rules">Export Rules</button>
          </div>
        </div>

        <div class="designer-content">
          <div class="templates-panel">
            <h3>Rule Templates</h3>
            <div class="template-categories">
              ${Object.values(RuleCategory).map(category => `
                <div class="category-section" data-category="${category}">
                  <h4>${this.formatCategoryName(category)}</h4>
                  <div class="template-list" id="templates-${category}">
                    ${this.renderTemplatesForCategory(category)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="rules-panel">
            <h3>Active Rules</h3>
            <div class="priority-visualization">
              <div class="priority-scale">
                <div class="scale-label">Low Priority</div>
                <div class="scale-bar"></div>
                <div class="scale-label">High Priority</div>
              </div>
            </div>
            <div class="rules-list" id="active-rules">
              ${this.renderActiveRules()}
            </div>
          </div>

          <div class="conflicts-panel">
            <h3>Rule Conflicts</h3>
            <div class="conflicts-list" id="conflicts-list">
              ${this.renderConflicts()}
            </div>
          </div>
        </div>

        <div class="rule-editor-modal" id="rule-editor" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="editor-title">Edit Rule</h3>
              <button class="close-btn" id="close-editor">&times;</button>
            </div>
            <div class="modal-body">
              ${this.renderRuleEditor()}
            </div>
            <div class="modal-footer">
              <button class="btn-primary" id="save-rule">Save Rule</button>
              <button class="btn-secondary" id="cancel-edit">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private formatCategoryName(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  }

  private renderTemplatesForCategory(category: RuleCategory): string {
    const categoryTemplates = this.templates.filter(t => t.category === category);
    return categoryTemplates.map(template => `
      <div class="template-card" data-template-id="${template.id}" draggable="true">
        <div class="template-header">
          <h4>${template.name}</h4>
          <div class="template-category ${template.category}">${this.formatCategoryName(template.category)}</div>
        </div>
        <p class="template-description">${template.description}</p>
        <div class="template-actions">
          <button class="btn-small btn-primary" data-action="use-template">Use Template</button>
          <button class="btn-small btn-secondary" data-action="preview-template">Preview</button>
        </div>
      </div>
    `).join('');
  }

  private renderActiveRules(): string {
    if (this.rules.length === 0) {
      return '<div class="empty-state">No rules created yet. Drag templates here or create custom rules.</div>';
    }

    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);
    return sortedRules.map(rule => `
      <div class="rule-card ${rule.constitutional ? 'constitutional' : ''}" 
           data-rule-id="${rule.id}" 
           style="order: ${100 - rule.priority}">
        <div class="rule-header">
          <div class="rule-info">
            <h4>${rule.name}</h4>
            <div class="rule-meta">
              <span class="priority-badge priority-${this.getPriorityClass(rule.priority)}">${rule.priority}</span>
              ${rule.constitutional ? '<span class="constitutional-badge">Constitutional</span>' : ''}
              <span class="status-badge ${rule.enabled ? 'enabled' : 'disabled'}">${rule.enabled ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div class="rule-controls">
            <button class="btn-icon" data-action="edit-rule" title="Edit Rule">✏️</button>
            <button class="btn-icon" data-action="toggle-rule" title="${rule.enabled ? 'Disable' : 'Enable'} Rule">
              ${rule.enabled ? '⏸️' : '▶️'}
            </button>
            <button class="btn-icon" data-action="delete-rule" title="Delete Rule" ${rule.constitutional ? 'disabled' : ''}>🗑️</button>
          </div>
        </div>
        <div class="rule-summary">
          <p>${rule.description}</p>
          <div class="rule-details">
            <span class="condition-summary">When: ${this.formatCondition(rule.condition)}</span>
            <span class="action-summary">Then: ${this.formatAction(rule.action)}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  private renderConflicts(): string {
    if (this.conflicts.length === 0) {
      return '<div class="no-conflicts">✅ No rule conflicts detected</div>';
    }

    return this.conflicts.map(conflict => `
      <div class="conflict-card severity-${conflict.severity}">
        <div class="conflict-header">
          <div class="conflict-type">${this.formatConflictType(conflict.conflictType)}</div>
          <div class="severity-badge severity-${conflict.severity}">${conflict.severity.toUpperCase()}</div>
        </div>
        <p class="conflict-description">${conflict.description}</p>
        <div class="conflict-rules">
          <span>Conflicting Rules: ${this.getRuleName(conflict.rule1Id)} ↔ ${this.getRuleName(conflict.rule2Id)}</span>
        </div>
        <div class="conflict-resolutions">
          <h5>Suggested Resolutions:</h5>
          ${conflict.suggestions.map(suggestion => `
            <div class="resolution-option">
              <button class="btn-small btn-secondary" data-action="apply-resolution" data-conflict-id="${conflict.id}" data-resolution-type="${suggestion.type}">
                ${suggestion.description}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  private renderRuleEditor(): string {
    return `
      <form id="rule-form">
        <div class="form-group">
          <label for="rule-name">Rule Name</label>
          <input type="text" id="rule-name" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="rule-description">Description</label>
          <textarea id="rule-description" name="description" rows="3"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="rule-priority">Priority (1-100)</label>
            <input type="range" id="rule-priority" name="priority" min="1" max="100" value="50">
            <span class="priority-value">50</span>
          </div>
          
          <div class="form-group">
            <label>
              <input type="checkbox" id="rule-constitutional" name="constitutional">
              Constitutional Rule (Cannot be disabled)
            </label>
          </div>
        </div>
        
        <div class="form-section">
          <h4>Condition (When)</h4>
          <div class="form-group">
            <label for="condition-type">Condition Type</label>
            <select id="condition-type" name="conditionType">
              ${Object.values(ConditionType).map(type => `
                <option value="${type}">${this.formatConditionType(type)}</option>
              `).join('')}
            </select>
          </div>
          <div id="condition-parameters">
            <!-- Dynamic condition parameters will be inserted here -->
          </div>
        </div>
        
        <div class="form-section">
          <h4>Action (Then)</h4>
          <div class="form-group">
            <label for="action-type">Action Type</label>
            <select id="action-type" name="actionType">
              ${Object.values(ActionType).map(type => `
                <option value="${type}">${this.formatActionType(type)}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="action-priority">Action Priority</label>
            <select id="action-priority" name="actionPriority">
              ${Object.values(ActionPriority).map(priority => `
                <option value="${priority}">${priority.toUpperCase()}</option>
              `).join('')}
            </select>
          </div>
          <div id="action-parameters">
            <!-- Dynamic action parameters will be inserted here -->
          </div>
        </div>
        
        <div class="form-section">
          <h4>Scope</h4>
          <div class="form-group">
            <label for="scope-devices">Target Devices</label>
            <select id="scope-devices" name="scopeDevices" multiple>
              <option value="all">All Devices</option>
              ${Object.values(DeviceCategory).map(category => `
                <option value="${category}">${this.formatCategoryName(category)} Devices</option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label for="scope-environments">Environments</label>
            <select id="scope-environments" name="scopeEnvironments" multiple>
              ${Object.values(EnvironmentType).map(env => `
                <option value="${env}">${env.toUpperCase()}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </form>
    `;
  }

  private setupEventListeners(): void {
    // Template drag and drop
    this.container.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('template-card')) {
        this.draggedElement = target;
        e.dataTransfer?.setData('text/plain', target.dataset.templateId || '');
      }
    });

    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      const rulesPanel = (e.target as HTMLElement).closest('.rules-list');
      if (rulesPanel && this.draggedElement) {
        const templateId = this.draggedElement.dataset.templateId;
        if (templateId) {
          this.createRuleFromTemplate(templateId);
        }
      }
      this.draggedElement = null;
    });

    // Button event listeners
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'use-template':
          const templateCard = target.closest('.template-card') as HTMLElement;
          const templateId = templateCard?.dataset.templateId;
          if (templateId) this.createRuleFromTemplate(templateId);
          break;

        case 'preview-template':
          const previewCard = target.closest('.template-card') as HTMLElement;
          const previewId = previewCard?.dataset.templateId;
          if (previewId) this.previewTemplate(previewId);
          break;

        case 'edit-rule':
          const ruleCard = target.closest('.rule-card') as HTMLElement;
          const ruleId = ruleCard?.dataset.ruleId;
          if (ruleId) this.editRule(ruleId);
          break;

        case 'toggle-rule':
          const toggleCard = target.closest('.rule-card') as HTMLElement;
          const toggleId = toggleCard?.dataset.ruleId;
          if (toggleId) this.toggleRule(toggleId);
          break;

        case 'delete-rule':
          const deleteCard = target.closest('.rule-card') as HTMLElement;
          const deleteId = deleteCard?.dataset.ruleId;
          if (deleteId) this.deleteRule(deleteId);
          break;

        case 'apply-resolution':
          const conflictId = target.dataset.conflictId;
          const resolutionType = target.dataset.resolutionType;
          if (conflictId && resolutionType) this.applyConflictResolution(conflictId, resolutionType);
          break;
      }

      // Handle main buttons
      if (target.id === 'add-rule') {
        this.openRuleEditor();
      } else if (target.id === 'validate-rules') {
        this.validateRules();
      } else if (target.id === 'export-rules') {
        this.exportRules();
      } else if (target.id === 'save-rule') {
        this.saveRule();
      } else if (target.id === 'cancel-edit' || target.id === 'close-editor') {
        this.closeRuleEditor();
      }
    });

    // Priority slider update
    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'rule-priority') {
        const valueSpan = this.container.querySelector('.priority-value');
        if (valueSpan) valueSpan.textContent = target.value;
      }
    });

    // Dynamic form updates
    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.id === 'condition-type') {
        this.updateConditionParameters(target.value as ConditionType);
      } else if (target.id === 'action-type') {
        this.updateActionParameters(target.value as ActionType);
      }
    });
  }

  private createRuleFromTemplate(templateId: string): void {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const rule: GovernanceRule = {
      id: this.generateId(),
      name: template.template.name || template.name,
      description: template.description,
      priority: template.template.priority || 50,
      condition: template.template.condition!,
      action: template.template.action!,
      scope: template.template.scope!,
      constitutional: template.template.constitutional || false,
      enabled: true,
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    this.rules.push(rule);
    this.detectConflicts();
    this.updateDisplay();
    this.notifyRuleChange();
  }

  private previewTemplate(templateId: string): void {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    // Show preview modal or tooltip with template details
    console.log('Preview template:', template);
  }

  private editRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;

    this.openRuleEditor(rule);
  }

  private toggleRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return;

    rule.enabled = !rule.enabled;
    rule.lastModified = Date.now();
    this.updateDisplay();
    this.notifyRuleChange();
  }

  private deleteRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule || rule.constitutional) return;

    if (confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      this.rules = this.rules.filter(r => r.id !== ruleId);
      this.detectConflicts();
      this.updateDisplay();
      this.notifyRuleChange();
    }
  }

  private openRuleEditor(rule?: GovernanceRule): void {
    const modal = this.container.querySelector('#rule-editor') as HTMLElement;
    const form = this.container.querySelector('#rule-form') as HTMLFormElement;
    
    if (rule) {
      // Populate form with existing rule data
      (form.querySelector('#rule-name') as HTMLInputElement).value = rule.name;
      (form.querySelector('#rule-description') as HTMLTextAreaElement).value = rule.description;
      (form.querySelector('#rule-priority') as HTMLInputElement).value = rule.priority.toString();
      (form.querySelector('#rule-constitutional') as HTMLInputElement).checked = rule.constitutional;
      
      // Set condition and action types
      (form.querySelector('#condition-type') as HTMLSelectElement).value = rule.condition.type;
      (form.querySelector('#action-type') as HTMLSelectElement).value = rule.action.type;
      (form.querySelector('#action-priority') as HTMLSelectElement).value = rule.action.priority;
      
      this.updateConditionParameters(rule.condition.type);
      this.updateActionParameters(rule.action.type);
      
      form.dataset.editingRuleId = rule.id;
    } else {
      form.reset();
      form.removeAttribute('data-editing-rule-id');
      this.updateConditionParameters(ConditionType.RESOURCE_USAGE);
      this.updateActionParameters(ActionType.LIMIT_RESOURCE);
    }
    
    modal.style.display = 'block';
  }

  private closeRuleEditor(): void {
    const modal = this.container.querySelector('#rule-editor') as HTMLElement;
    modal.style.display = 'none';
  }

  private saveRule(): void {
    const form = this.container.querySelector('#rule-form') as HTMLFormElement;
    const formData = new FormData(form);
    const editingId = form.dataset.editingRuleId;

    const rule: GovernanceRule = {
      id: editingId || this.generateId(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      priority: parseInt(formData.get('priority') as string),
      constitutional: formData.has('constitutional'),
      enabled: true,
      condition: this.buildConditionFromForm(form),
      action: this.buildActionFromForm(form),
      scope: this.buildScopeFromForm(form),
      createdAt: editingId ? this.rules.find(r => r.id === editingId)?.createdAt || Date.now() : Date.now(),
      lastModified: Date.now()
    };

    if (editingId) {
      const index = this.rules.findIndex(r => r.id === editingId);
      if (index !== -1) {
        this.rules[index] = rule;
      }
    } else {
      this.rules.push(rule);
    }

    this.detectConflicts();
    this.updateDisplay();
    this.notifyRuleChange();
    this.closeRuleEditor();
  }

  private validateRules(): void {
    this.detectConflicts();
    this.updateDisplay();
    
    const conflictCount = this.conflicts.length;
    const message = conflictCount === 0 
      ? '✅ All rules validated successfully! No conflicts detected.'
      : `⚠️ ${conflictCount} conflict${conflictCount > 1 ? 's' : ''} detected. Please review the conflicts panel.`;
    
    alert(message);
  }

  private exportRules(): void {
    const exportData = {
      rules: this.rules,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'governance-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private detectConflicts(): void {
    this.conflicts = [];
    
    for (let i = 0; i < this.rules.length; i++) {
      for (let j = i + 1; j < this.rules.length; j++) {
        const rule1 = this.rules[i];
        const rule2 = this.rules[j];
        
        const conflict = this.checkRuleConflict(rule1, rule2);
        if (conflict) {
          this.conflicts.push(conflict);
        }
      }
    }
    
    if (this.onConflictDetected) {
      this.onConflictDetected(this.conflicts);
    }
  }

  private checkRuleConflict(rule1: GovernanceRule, rule2: GovernanceRule): RuleConflict | null {
    // Check for priority conflicts
    if (rule1.priority === rule2.priority && this.scopesOverlap(rule1.scope, rule2.scope)) {
      return {
        id: this.generateId(),
        rule1Id: rule1.id,
        rule2Id: rule2.id,
        conflictType: ConflictType.PRIORITY_CONFLICT,
        severity: ConflictSeverity.MEDIUM,
        description: `Rules "${rule1.name}" and "${rule2.name}" have the same priority and overlapping scopes.`,
        suggestions: [
          {
            type: ResolutionType.ADJUST_PRIORITY,
            description: 'Adjust priority of one rule',
            autoApplicable: true,
            changes: []
          }
        ]
      };
    }

    // Check for action contradictions
    if (this.actionsContradict(rule1.action, rule2.action) && this.scopesOverlap(rule1.scope, rule2.scope)) {
      return {
        id: this.generateId(),
        rule1Id: rule1.id,
        rule2Id: rule2.id,
        conflictType: ConflictType.ACTION_CONTRADICTION,
        severity: ConflictSeverity.HIGH,
        description: `Rules "${rule1.name}" and "${rule2.name}" have contradictory actions for overlapping scopes.`,
        suggestions: [
          {
            type: ResolutionType.MODIFY_SCOPE,
            description: 'Modify scope to avoid overlap',
            autoApplicable: false,
            changes: []
          }
        ]
      };
    }

    return null;
  }

  private scopesOverlap(scope1: any, scope2: any): boolean {
    // Simplified scope overlap check
    const devices1 = Array.isArray(scope1.devices) ? scope1.devices : [scope1.devices];
    const devices2 = Array.isArray(scope2.devices) ? scope2.devices : [scope2.devices];
    
    return devices1.some(d1 => devices2.some(d2 => d1 === d2 || d1 === 'all' || d2 === 'all'));
  }

  private actionsContradict(action1: any, action2: any): boolean {
    // Check if actions are contradictory
    if (action1.type === ActionType.ENABLE_DEVICE && action2.type === ActionType.DISABLE_DEVICE) {
      return true;
    }
    if (action1.type === ActionType.DISABLE_DEVICE && action2.type === ActionType.ENABLE_DEVICE) {
      return true;
    }
    return false;
  }

  private applyConflictResolution(conflictId: string, resolutionType: string): void {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    const resolution = conflict.suggestions.find(s => s.type === resolutionType);
    if (!resolution) return;

    // Apply the resolution
    switch (resolutionType) {
      case ResolutionType.ADJUST_PRIORITY:
        const rule2 = this.rules.find(r => r.id === conflict.rule2Id);
        if (rule2) {
          rule2.priority = rule2.priority + 1;
          rule2.lastModified = Date.now();
        }
        break;
      // Add other resolution types as needed
    }

    this.detectConflicts();
    this.updateDisplay();
    this.notifyRuleChange();
  }

  private updateDisplay(): void {
    const rulesContainer = this.container.querySelector('#active-rules');
    const conflictsContainer = this.container.querySelector('#conflicts-list');
    
    if (rulesContainer) {
      rulesContainer.innerHTML = this.renderActiveRules();
    }
    
    if (conflictsContainer) {
      conflictsContainer.innerHTML = this.renderConflicts();
    }
  }

  private updateConditionParameters(conditionType: ConditionType): void {
    const container = this.container.querySelector('#condition-parameters');
    if (!container) return;

    let parametersHtml = '';
    
    switch (conditionType) {
      case ConditionType.RESOURCE_USAGE:
        parametersHtml = `
          <div class="form-group">
            <label for="resource-type">Resource Type</label>
            <select id="resource-type" name="resourceType">
              ${Object.values(ResourceType).map(type => `
                <option value="${type}">${type.toUpperCase()}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="threshold">Threshold (%)</label>
            <input type="number" id="threshold" name="threshold" min="0" max="100" value="80">
          </div>
        `;
        break;
      case ConditionType.TIME_BASED:
        parametersHtml = `
          <div class="form-group">
            <label for="start-time">Start Time</label>
            <input type="time" id="start-time" name="startTime">
          </div>
          <div class="form-group">
            <label for="end-time">End Time</label>
            <input type="time" id="end-time" name="endTime">
          </div>
        `;
        break;
      // Add other condition types as needed
    }
    
    container.innerHTML = parametersHtml;
  }

  private updateActionParameters(actionType: ActionType): void {
    const container = this.container.querySelector('#action-parameters');
    if (!container) return;

    let parametersHtml = '';
    
    switch (actionType) {
      case ActionType.LIMIT_RESOURCE:
        parametersHtml = `
          <div class="form-group">
            <label for="max-usage">Maximum Usage (%)</label>
            <input type="number" id="max-usage" name="maxUsage" min="0" max="100" value="70">
          </div>
        `;
        break;
      case ActionType.SEND_NOTIFICATION:
        parametersHtml = `
          <div class="form-group">
            <label for="notification-message">Notification Message</label>
            <textarea id="notification-message" name="message" rows="2"></textarea>
          </div>
        `;
        break;
      // Add other action types as needed
    }
    
    container.innerHTML = parametersHtml;
  }

  private buildConditionFromForm(form: HTMLFormElement): any {
    const conditionType = (form.querySelector('#condition-type') as HTMLSelectElement).value;
    const parameters: any = {};
    
    switch (conditionType) {
      case ConditionType.RESOURCE_USAGE:
        parameters.resourceType = (form.querySelector('#resource-type') as HTMLSelectElement)?.value;
        parameters.threshold = parseInt((form.querySelector('#threshold') as HTMLInputElement)?.value || '80');
        break;
      case ConditionType.TIME_BASED:
        parameters.startTime = (form.querySelector('#start-time') as HTMLInputElement)?.value;
        parameters.endTime = (form.querySelector('#end-time') as HTMLInputElement)?.value;
        break;
    }
    
    return {
      type: conditionType,
      parameters
    };
  }

  private buildActionFromForm(form: HTMLFormElement): any {
    const actionType = (form.querySelector('#action-type') as HTMLSelectElement).value;
    const actionPriority = (form.querySelector('#action-priority') as HTMLSelectElement).value;
    const parameters: any = {};
    
    switch (actionType) {
      case ActionType.LIMIT_RESOURCE:
        parameters.maxUsage = parseInt((form.querySelector('#max-usage') as HTMLInputElement)?.value || '70');
        break;
      case ActionType.SEND_NOTIFICATION:
        parameters.message = (form.querySelector('#notification-message') as HTMLTextAreaElement)?.value;
        break;
    }
    
    return {
      type: actionType,
      parameters,
      priority: actionPriority,
      reversible: true
    };
  }

  private buildScopeFromForm(form: HTMLFormElement): any {
    const devicesSelect = form.querySelector('#scope-devices') as HTMLSelectElement;
    const environmentsSelect = form.querySelector('#scope-environments') as HTMLSelectElement;
    
    const devices = Array.from(devicesSelect.selectedOptions).map(option => option.value);
    const environments = Array.from(environmentsSelect.selectedOptions).map(option => option.value);
    
    return {
      devices: devices.length > 0 ? devices : ['all'],
      environments: environments.length > 0 ? environments : Object.values(EnvironmentType)
    };
  }

  // Utility methods
  private generateId(): string {
    return 'rule_' + Math.random().toString(36).substr(2, 9);
  }

  private getPriorityClass(priority: number): string {
    if (priority >= 80) return 'high';
    if (priority >= 50) return 'medium';
    return 'low';
  }

  private formatCondition(condition: any): string {
    switch (condition.type) {
      case ConditionType.RESOURCE_USAGE:
        return `${condition.parameters.resourceType} usage > ${condition.parameters.threshold}%`;
      case ConditionType.TIME_BASED:
        return `Between ${condition.parameters.startTime} and ${condition.parameters.endTime}`;
      default:
        return condition.type.replace('_', ' ');
    }
  }

  private formatAction(action: any): string {
    switch (action.type) {
      case ActionType.LIMIT_RESOURCE:
        return `Limit resource usage to ${action.parameters.maxUsage}%`;
      case ActionType.DISABLE_DEVICE:
        return 'Disable affected devices';
      case ActionType.SEND_NOTIFICATION:
        return `Send notification: "${action.parameters.message}"`;
      default:
        return action.type.replace('_', ' ');
    }
  }

  private formatConditionType(type: string): string {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private formatActionType(type: string): string {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private formatConflictType(type: string): string {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  private getRuleName(ruleId: string): string {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule ? rule.name : 'Unknown Rule';
  }

  private notifyRuleChange(): void {
    if (this.onRuleChange) {
      this.onRuleChange(this.rules);
    }
  }

  // Public API
  public setRules(rules: GovernanceRule[]): void {
    this.rules = rules;
    this.detectConflicts();
    this.updateDisplay();
  }

  public getRules(): GovernanceRule[] {
    return [...this.rules];
  }

  public getConflicts(): RuleConflict[] {
    return [...this.conflicts];
  }

  public onRuleChanged(callback: (rules: GovernanceRule[]) => void): void {
    this.onRuleChange = callback;
  }

  public onConflictsDetected(callback: (conflicts: RuleConflict[]) => void): void {
    this.onConflictDetected = callback;
  }

  public importRules(rulesData: any): void {
    try {
      if (rulesData.rules && Array.isArray(rulesData.rules)) {
        this.rules = rulesData.rules;
        this.detectConflicts();
        this.updateDisplay();
        this.notifyRuleChange();
      }
    } catch (error) {
      console.error('Failed to import rules:', error);
      alert('Failed to import rules. Please check the file format.');
    }
  }
}