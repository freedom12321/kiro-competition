import {
  GovernanceRule,
  RuleConflict,
  ActionType,
  ConflictSeverity,
  DeviceCategory,
  EnvironmentType,
  ResourceType
} from '../types/core.ts';

export interface RuleEnforcement {
  ruleId: string;
  deviceId: string;
  timestamp: number;
  action: string;
  success: boolean;
  reason?: string;
  impact: EnforcementImpact;
}

export interface EnforcementImpact {
  resourcesAffected: string[];
  devicesAffected: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface RuleViolation {
  id: string;
  ruleId: string;
  deviceId: string;
  violationType: ViolationType;
  severity: ConflictSeverity;
  timestamp: number;
  description: string;
  suggestedCorrections: CorrectionSuggestion[];
  autoCorrectible: boolean;
}

export interface CorrectionSuggestion {
  type: CorrectionType;
  description: string;
  autoApplicable: boolean;
  parameters: { [key: string]: any };
}

export enum ViolationType {
  RESOURCE_LIMIT_EXCEEDED = 'resource_limit_exceeded',
  UNAUTHORIZED_ACTION = 'unauthorized_action',
  CONSTITUTIONAL_VIOLATION = 'constitutional_violation',
  PRIORITY_OVERRIDE = 'priority_override',
  SCOPE_VIOLATION = 'scope_violation'
}

export enum CorrectionType {
  ADJUST_RESOURCE_LIMIT = 'adjust_resource_limit',
  DISABLE_DEVICE = 'disable_device',
  MODIFY_RULE_SCOPE = 'modify_rule_scope',
  INCREASE_RULE_PRIORITY = 'increase_rule_priority',
  ADD_EXCEPTION = 'add_exception'
}

export class RuleEnforcementVisualizer {
  private container: HTMLElement;
  private rules: GovernanceRule[] = [];
  private enforcements: RuleEnforcement[] = [];
  private violations: RuleViolation[] = [];
  private activeRules: Set<string> = new Set();
  private constitutionalRules: Set<string> = new Set();
  private updateInterval: number | null = null;
  private onViolationDetected?: (violation: RuleViolation) => void;
  private onEnforcementAction?: (enforcement: RuleEnforcement) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createInterface();
    this.startRealTimeUpdates();
  }

  private createInterface(): void {
    this.container.innerHTML = `
      <div class="rule-enforcement-visualizer">
        <div class="visualizer-header">
          <h2>Rule Enforcement Monitor</h2>
          <div class="enforcement-stats">
            <div class="stat-item">
              <span class="stat-value" id="active-rules-count">0</span>
              <span class="stat-label">Active Rules</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="enforcements-count">0</span>
              <span class="stat-label">Enforcements</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" id="violations-count">0</span>
              <span class="stat-label">Violations</span>
            </div>
          </div>
        </div>

        <div class="visualizer-content">
          <div class="active-rules-panel">
            <h3>Active Rules</h3>
            <div class="rules-status-grid" id="rules-status">
              <!-- Active rules will be displayed here -->
            </div>
          </div>

          <div class="enforcement-feed-panel">
            <h3>Real-time Enforcement Feed</h3>
            <div class="enforcement-feed" id="enforcement-feed">
              <!-- Real-time enforcement actions will be displayed here -->
            </div>
          </div>

          <div class="violations-panel">
            <h3>Rule Violations</h3>
            <div class="violations-list" id="violations-list">
              <!-- Rule violations will be displayed here -->
            </div>
          </div>
        </div>

        <div class="constitutional-protection-panel">
          <h3>Constitutional Rule Protection</h3>
          <div class="constitutional-rules" id="constitutional-rules">
            <!-- Constitutional rules that cannot be overridden -->
          </div>
          <div class="protection-status">
            <div class="protection-indicator" id="protection-status">
              <span class="indicator-light active"></span>
              <span class="indicator-text">Constitutional Protection Active</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle violation correction buttons
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'apply-correction':
          const violationId = target.dataset.violationId;
          const correctionType = target.dataset.correctionType;
          if (violationId && correctionType) {
            this.applyCorrectionSuggestion(violationId, correctionType as CorrectionType);
          }
          break;

        case 'dismiss-violation':
          const dismissId = target.dataset.violationId;
          if (dismissId) {
            this.dismissViolation(dismissId);
          }
          break;

        case 'auto-correct-all':
          this.autoCorrectAllViolations();
          break;

        case 'pause-enforcement':
          this.pauseEnforcement();
          break;

        case 'resume-enforcement':
          this.resumeEnforcement();
          break;
      }
    });
  }

  private startRealTimeUpdates(): void {
    this.updateInterval = window.setInterval(() => {
      this.updateEnforcementDisplay();
      this.checkForViolations();
    }, 1000); // Update every second
  }

  private stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updateEnforcementDisplay(): void {
    this.updateStats();
    this.updateActiveRulesDisplay();
    this.updateEnforcementFeed();
    this.updateViolationsDisplay();
    this.updateConstitutionalProtection();
  }

  private updateStats(): void {
    const activeRulesCount = this.container.querySelector('#active-rules-count');
    const enforcementsCount = this.container.querySelector('#enforcements-count');
    const violationsCount = this.container.querySelector('#violations-count');

    if (activeRulesCount) activeRulesCount.textContent = this.activeRules.size.toString();
    if (enforcementsCount) enforcementsCount.textContent = this.enforcements.length.toString();
    if (violationsCount) violationsCount.textContent = this.violations.length.toString();
  }

  private updateActiveRulesDisplay(): void {
    const container = this.container.querySelector('#rules-status');
    if (!container) return;

    const activeRulesList = this.rules.filter(rule => rule.enabled);
    
    container.innerHTML = activeRulesList.map(rule => `
      <div class="rule-status-card ${rule.constitutional ? 'constitutional' : ''}" data-rule-id="${rule.id}">
        <div class="rule-status-header">
          <h4>${rule.name}</h4>
          <div class="rule-status-indicators">
            <div class="status-indicator ${this.activeRules.has(rule.id) ? 'active' : 'inactive'}">
              <span class="indicator-dot"></span>
              <span class="indicator-text">${this.activeRules.has(rule.id) ? 'Active' : 'Inactive'}</span>
            </div>
            <div class="priority-indicator priority-${this.getPriorityClass(rule.priority)}">
              ${rule.priority}
            </div>
          </div>
        </div>
        <div class="rule-enforcement-stats">
          <div class="enforcement-count">
            <span class="count">${this.getEnforcementCount(rule.id)}</span>
            <span class="label">Enforcements</span>
          </div>
          <div class="violation-count">
            <span class="count">${this.getViolationCount(rule.id)}</span>
            <span class="label">Violations</span>
          </div>
        </div>
        <div class="rule-impact-visualization">
          ${this.renderRuleImpactVisualization(rule)}
        </div>
      </div>
    `).join('');
  }

  private updateEnforcementFeed(): void {
    const container = this.container.querySelector('#enforcement-feed');
    if (!container) return;

    // Show last 10 enforcement actions
    const recentEnforcements = this.enforcements
      .slice(-10)
      .reverse();

    if (recentEnforcements.length === 0) {
      container.innerHTML = '<div class="empty-feed">No enforcement actions yet</div>';
      return;
    }

    container.innerHTML = recentEnforcements.map(enforcement => `
      <div class="enforcement-item ${enforcement.success ? 'success' : 'failed'}">
        <div class="enforcement-timestamp">
          ${new Date(enforcement.timestamp).toLocaleTimeString()}
        </div>
        <div class="enforcement-details">
          <div class="enforcement-rule">
            Rule: ${this.getRuleName(enforcement.ruleId)}
          </div>
          <div class="enforcement-action">
            Action: ${this.formatActionType(enforcement.action)}
          </div>
          <div class="enforcement-target">
            Target: ${enforcement.deviceId}
          </div>
          ${enforcement.reason ? `<div class="enforcement-reason">${enforcement.reason}</div>` : ''}
        </div>
        <div class="enforcement-status">
          <span class="status-icon">${enforcement.success ? '✅' : '❌'}</span>
        </div>
        <div class="enforcement-impact">
          <div class="impact-severity severity-${enforcement.impact.severity}">
            ${enforcement.impact.severity.toUpperCase()}
          </div>
          <div class="impact-description">
            ${enforcement.impact.description}
          </div>
        </div>
      </div>
    `).join('');
  }

  private updateViolationsDisplay(): void {
    const container = this.container.querySelector('#violations-list');
    if (!container) return;

    if (this.violations.length === 0) {
      container.innerHTML = '<div class="no-violations">✅ No rule violations detected</div>';
      return;
    }

    // Sort violations by severity and timestamp
    const sortedViolations = [...this.violations].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp - a.timestamp;
    });

    container.innerHTML = sortedViolations.map(violation => `
      <div class="violation-card severity-${violation.severity}">
        <div class="violation-header">
          <div class="violation-type">${this.formatViolationType(violation.violationType)}</div>
          <div class="violation-severity severity-${violation.severity}">
            ${violation.severity.toUpperCase()}
          </div>
          <div class="violation-timestamp">
            ${new Date(violation.timestamp).toLocaleString()}
          </div>
        </div>
        <div class="violation-details">
          <div class="violation-rule">Rule: ${this.getRuleName(violation.ruleId)}</div>
          <div class="violation-device">Device: ${violation.deviceId}</div>
          <div class="violation-description">${violation.description}</div>
        </div>
        <div class="violation-corrections">
          <h5>Suggested Corrections:</h5>
          <div class="correction-buttons">
            ${violation.suggestedCorrections.map(correction => `
              <button class="btn-correction ${correction.autoApplicable ? 'auto-applicable' : ''}"
                      data-action="apply-correction"
                      data-violation-id="${violation.id}"
                      data-correction-type="${correction.type}">
                ${correction.description}
                ${correction.autoApplicable ? ' (Auto)' : ''}
              </button>
            `).join('')}
          </div>
          <div class="violation-actions">
            <button class="btn-dismiss" data-action="dismiss-violation" data-violation-id="${violation.id}">
              Dismiss
            </button>
            ${violation.autoCorrectible ? `
              <button class="btn-auto-correct" data-action="apply-correction" 
                      data-violation-id="${violation.id}" data-correction-type="auto">
                Auto-Correct
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  private updateConstitutionalProtection(): void {
    const container = this.container.querySelector('#constitutional-rules');
    if (!container) return;

    const constitutionalRules = this.rules.filter(rule => rule.constitutional);
    
    container.innerHTML = constitutionalRules.map(rule => `
      <div class="constitutional-rule-card">
        <div class="constitutional-rule-header">
          <h4>${rule.name}</h4>
          <div class="protection-badge">Protected</div>
        </div>
        <div class="constitutional-rule-description">
          ${rule.description}
        </div>
        <div class="constitutional-rule-status">
          <div class="enforcement-indicator ${this.activeRules.has(rule.id) ? 'enforcing' : 'standby'}">
            <span class="indicator-dot"></span>
            <span class="indicator-text">
              ${this.activeRules.has(rule.id) ? 'Actively Enforcing' : 'Standby'}
            </span>
          </div>
        </div>
      </div>
    `).join('');

    // Update protection status
    const protectionStatus = this.container.querySelector('#protection-status');
    if (protectionStatus) {
      const activeConstitutionalRules = constitutionalRules.filter(rule => this.activeRules.has(rule.id));
      const isProtected = activeConstitutionalRules.length > 0;
      
      protectionStatus.className = `protection-indicator ${isProtected ? 'active' : 'inactive'}`;
      protectionStatus.querySelector('.indicator-text')!.textContent = 
        isProtected ? 'Constitutional Protection Active' : 'Constitutional Protection Inactive';
    }
  }

  private renderRuleImpactVisualization(rule: GovernanceRule): string {
    const enforcementCount = this.getEnforcementCount(rule.id);
    const violationCount = this.getViolationCount(rule.id);
    const effectivenessScore = this.calculateRuleEffectiveness(rule.id);

    return `
      <div class="impact-visualization">
        <div class="effectiveness-bar">
          <div class="effectiveness-fill" style="width: ${effectivenessScore}%"></div>
        </div>
        <div class="effectiveness-score">${effectivenessScore}% effective</div>
        <div class="impact-metrics">
          <span class="metric">
            <span class="metric-value">${enforcementCount}</span>
            <span class="metric-label">enforced</span>
          </span>
          <span class="metric">
            <span class="metric-value">${violationCount}</span>
            <span class="metric-label">violated</span>
          </span>
        </div>
      </div>
    `;
  }

  private checkForViolations(): void {
    // This would be called by the simulation engine to report violations
    // For now, we'll simulate some violations for demonstration
    if (Math.random() < 0.1) { // 10% chance of violation per check
      this.simulateViolation();
    }
  }

  private simulateViolation(): void {
    if (this.rules.length === 0) return;

    const randomRule = this.rules[Math.floor(Math.random() * this.rules.length)];
    const violation: RuleViolation = {
      id: this.generateId(),
      ruleId: randomRule.id,
      deviceId: `device_${Math.floor(Math.random() * 10)}`,
      violationType: ViolationType.RESOURCE_LIMIT_EXCEEDED,
      severity: ConflictSeverity.MEDIUM,
      timestamp: Date.now(),
      description: `Device exceeded resource limit defined by rule "${randomRule.name}"`,
      suggestedCorrections: [
        {
          type: CorrectionType.ADJUST_RESOURCE_LIMIT,
          description: 'Increase resource limit threshold',
          autoApplicable: true,
          parameters: { newLimit: 90 }
        },
        {
          type: CorrectionType.DISABLE_DEVICE,
          description: 'Temporarily disable violating device',
          autoApplicable: true,
          parameters: { duration: 300000 } // 5 minutes
        }
      ],
      autoCorrectible: true
    };

    this.addViolation(violation);
  }

  private applyCorrectionSuggestion(violationId: string, correctionType: CorrectionType): void {
    const violation = this.violations.find(v => v.id === violationId);
    if (!violation) return;

    const correction = violation.suggestedCorrections.find(c => c.type === correctionType);
    if (!correction) return;

    // Apply the correction
    const enforcement: RuleEnforcement = {
      ruleId: violation.ruleId,
      deviceId: violation.deviceId,
      timestamp: Date.now(),
      action: `Applied correction: ${correction.description}`,
      success: true,
      impact: {
        resourcesAffected: ['energy', 'bandwidth'],
        devicesAffected: [violation.deviceId],
        severity: 'medium',
        description: `Corrected violation by ${correction.description.toLowerCase()}`
      }
    };

    this.addEnforcement(enforcement);
    this.removeViolation(violationId);

    if (this.onEnforcementAction) {
      this.onEnforcementAction(enforcement);
    }
  }

  private dismissViolation(violationId: string): void {
    this.removeViolation(violationId);
  }

  private autoCorrectAllViolations(): void {
    const autoCorrectibleViolations = this.violations.filter(v => v.autoCorrectible);
    
    autoCorrectibleViolations.forEach(violation => {
      const autoCorrection = violation.suggestedCorrections.find(c => c.autoApplicable);
      if (autoCorrection) {
        this.applyCorrectionSuggestion(violation.id, autoCorrection.type);
      }
    });
  }

  private pauseEnforcement(): void {
    this.stopRealTimeUpdates();
    // Update UI to show paused state
    const protectionStatus = this.container.querySelector('#protection-status');
    if (protectionStatus) {
      protectionStatus.classList.add('paused');
      protectionStatus.querySelector('.indicator-text')!.textContent = 'Enforcement Paused';
    }
  }

  private resumeEnforcement(): void {
    this.startRealTimeUpdates();
    // Update UI to show active state
    const protectionStatus = this.container.querySelector('#protection-status');
    if (protectionStatus) {
      protectionStatus.classList.remove('paused');
      protectionStatus.querySelector('.indicator-text')!.textContent = 'Constitutional Protection Active';
    }
  }

  // Utility methods
  private generateId(): string {
    return 'violation_' + Math.random().toString(36).substr(2, 9);
  }

  private getPriorityClass(priority: number): string {
    if (priority >= 80) return 'high';
    if (priority >= 50) return 'medium';
    return 'low';
  }

  private getRuleName(ruleId: string): string {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule ? rule.name : 'Unknown Rule';
  }

  private formatActionType(action: string): string {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatViolationType(type: ViolationType): string {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getEnforcementCount(ruleId: string): number {
    return this.enforcements.filter(e => e.ruleId === ruleId).length;
  }

  private getViolationCount(ruleId: string): number {
    return this.violations.filter(v => v.ruleId === ruleId).length;
  }

  private calculateRuleEffectiveness(ruleId: string): number {
    const enforcements = this.getEnforcementCount(ruleId);
    const violations = this.getViolationCount(ruleId);
    const total = enforcements + violations;
    
    if (total === 0) return 100;
    return Math.round((enforcements / total) * 100);
  }

  private addEnforcement(enforcement: RuleEnforcement): void {
    this.enforcements.push(enforcement);
    // Keep only last 100 enforcements
    if (this.enforcements.length > 100) {
      this.enforcements = this.enforcements.slice(-100);
    }
  }

  private addViolation(violation: RuleViolation): void {
    this.violations.push(violation);
    if (this.onViolationDetected) {
      this.onViolationDetected(violation);
    }
  }

  private removeViolation(violationId: string): void {
    this.violations = this.violations.filter(v => v.id !== violationId);
  }

  // Public API
  public setRules(rules: GovernanceRule[]): void {
    this.rules = rules;
    this.activeRules.clear();
    this.constitutionalRules.clear();
    
    rules.forEach(rule => {
      if (rule.enabled) {
        this.activeRules.add(rule.id);
      }
      if (rule.constitutional) {
        this.constitutionalRules.add(rule.id);
      }
    });
    
    this.updateEnforcementDisplay();
  }

  public reportEnforcement(enforcement: RuleEnforcement): void {
    this.addEnforcement(enforcement);
  }

  public reportViolation(violation: RuleViolation): void {
    this.addViolation(violation);
  }

  public activateRule(ruleId: string): void {
    this.activeRules.add(ruleId);
    this.updateEnforcementDisplay();
  }

  public deactivateRule(ruleId: string): void {
    this.activeRules.delete(ruleId);
    this.updateEnforcementDisplay();
  }

  public getActiveRules(): string[] {
    return Array.from(this.activeRules);
  }

  public getViolations(): RuleViolation[] {
    return [...this.violations];
  }

  public getEnforcements(): RuleEnforcement[] {
    return [...this.enforcements];
  }

  public onViolationDetected(callback: (violation: RuleViolation) => void): void {
    this.onViolationDetected = callback;
  }

  public onEnforcementAction(callback: (enforcement: RuleEnforcement) => void): void {
    this.onEnforcementAction = callback;
  }

  public destroy(): void {
    this.stopRealTimeUpdates();
  }
}