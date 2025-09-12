import { CrisisScenario, RecoveryAction, CrisisType } from '../types/core';

export interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  diagnosticInfo: DiagnosticInfo;
  recommendedActions: RecoveryAction[];
  educationalContent: EducationalContent;
  completed: boolean;
}

export interface DiagnosticInfo {
  rootCause: string;
  affectedSystems: string[];
  severity: number;
  timeline: TimelineEvent[];
  visualData: DiagnosticVisualization[];
}

export interface TimelineEvent {
  timestamp: number;
  event: string;
  severity: number;
  deviceId?: string;
  impact: string;
}

export interface DiagnosticVisualization {
  type: 'chart' | 'network' | 'timeline' | 'heatmap';
  data: any;
  title: string;
  description: string;
}

export interface EducationalContent {
  concept: string;
  explanation: string;
  realWorldExample: string;
  keyTakeaways: string[];
  furtherReading?: string[];
}

export interface RecoveryWizardOptions {
  showEducationalContent: boolean;
  enableSlowMotionReplay: boolean;
  trackLearningProgress: boolean;
  celebrateSuccess: boolean;
}

export class RecoveryWizard {
  private container: HTMLElement;
  private currentStep: number = 0;
  private steps: RecoveryStep[] = [];
  private crisis: CrisisScenario | null = null;
  private options: RecoveryWizardOptions;
  private onActionCallback?: (action: RecoveryAction) => Promise<boolean>;
  private onCompleteCallback?: (success: boolean, learningData: LearningData) => void;

  constructor(container: HTMLElement, options: Partial<RecoveryWizardOptions> = {}) {
    this.container = container;
    this.options = {
      showEducationalContent: true,
      enableSlowMotionReplay: true,
      trackLearningProgress: true,
      celebrateSuccess: true,
      ...options
    };
    
    this.createWizardInterface();
  }

  private createWizardInterface(): void {
    const wizard = document.createElement('div');
    wizard.className = 'recovery-wizard hidden';
    wizard.innerHTML = `
      <div class="wizard-header">
        <h2 class="wizard-title">🔧 Recovery Wizard</h2>
        <div class="wizard-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span class="progress-text">Step 1 of 1</span>
        </div>
        <button class="wizard-close-btn">×</button>
      </div>

      <div class="wizard-content">
        <div class="step-navigation">
          <button class="nav-btn prev-btn" disabled>← Previous</button>
          <div class="step-indicators"></div>
          <button class="nav-btn next-btn">Next →</button>
        </div>

        <div class="step-content">
          <div class="step-header">
            <h3 class="step-title">Diagnostic Analysis</h3>
            <div class="step-description">Analyzing system failure...</div>
          </div>

          <div class="diagnostic-section">
            <div class="diagnostic-visualizations"></div>
            <div class="diagnostic-details"></div>
          </div>

          <div class="educational-section">
            <div class="educational-content"></div>
          </div>

          <div class="action-section">
            <div class="recommended-actions"></div>
            <div class="action-feedback"></div>
          </div>
        </div>

        <div class="replay-section">
          <h4>Crisis Replay</h4>
          <div class="replay-controls">
            <button class="replay-btn">🔄 Replay Crisis</button>
            <button class="slow-motion-btn">🐌 Slow Motion</button>
            <div class="replay-timeline">
              <input type="range" class="timeline-slider" min="0" max="100" value="0">
              <div class="timeline-markers"></div>
            </div>
          </div>
          <div class="replay-annotations"></div>
        </div>
      </div>

      <div class="wizard-actions">
        <button class="wizard-restart-btn">🔄 Restart Wizard</button>
        <button class="wizard-complete-btn">✅ Complete Recovery</button>
      </div>
    `;

    this.container.appendChild(wizard);
    this.setupEventListeners(wizard);
  }

  private setupEventListeners(wizard: HTMLElement): void {
    // Navigation buttons
    const prevBtn = wizard.querySelector('.prev-btn') as HTMLButtonElement;
    const nextBtn = wizard.querySelector('.next-btn') as HTMLButtonElement;
    
    prevBtn?.addEventListener('click', () => this.previousStep());
    nextBtn?.addEventListener('click', () => this.nextStep());

    // Wizard controls
    const closeBtn = wizard.querySelector('.wizard-close-btn') as HTMLButtonElement;
    const restartBtn = wizard.querySelector('.wizard-restart-btn') as HTMLButtonElement;
    const completeBtn = wizard.querySelector('.wizard-complete-btn') as HTMLButtonElement;
    
    closeBtn?.addEventListener('click', () => this.hide());
    restartBtn?.addEventListener('click', () => this.restart());
    completeBtn?.addEventListener('click', () => this.completeRecovery());

    // Replay controls
    const replayBtn = wizard.querySelector('.replay-btn') as HTMLButtonElement;
    const slowMotionBtn = wizard.querySelector('.slow-motion-btn') as HTMLButtonElement;
    const timelineSlider = wizard.querySelector('.timeline-slider') as HTMLInputElement;
    
    replayBtn?.addEventListener('click', () => this.startReplay());
    slowMotionBtn?.addEventListener('click', () => this.toggleSlowMotion());
    timelineSlider?.addEventListener('input', (e) => this.seekReplay((e.target as HTMLInputElement).value));
  }

  public startRecovery(crisis: CrisisScenario): void {
    this.crisis = crisis;
    this.currentStep = 0;
    this.steps = this.generateRecoverySteps(crisis);
    
    this.show();
    this.updateWizardDisplay();
    this.displayCurrentStep();
  }

  private generateRecoverySteps(crisis: CrisisScenario): RecoveryStep[] {
    const steps: RecoveryStep[] = [];

    // Step 1: Diagnostic Analysis
    steps.push({
      id: 'diagnostic',
      title: 'System Diagnostic',
      description: 'Analyze the root cause and impact of the system failure',
      diagnosticInfo: this.generateDiagnosticInfo(crisis),
      recommendedActions: [],
      educationalContent: this.getEducationalContent(crisis.type, 'diagnostic'),
      completed: false
    });

    // Step 2: Immediate Stabilization
    steps.push({
      id: 'stabilization',
      title: 'Emergency Stabilization',
      description: 'Take immediate action to prevent further system degradation',
      diagnosticInfo: this.generateDiagnosticInfo(crisis),
      recommendedActions: this.getStabilizationActions(crisis),
      educationalContent: this.getEducationalContent(crisis.type, 'stabilization'),
      completed: false
    });

    // Step 3: Root Cause Resolution
    steps.push({
      id: 'resolution',
      title: 'Root Cause Resolution',
      description: 'Address the underlying issues that caused the crisis',
      diagnosticInfo: this.generateDiagnosticInfo(crisis),
      recommendedActions: this.getResolutionActions(crisis),
      educationalContent: this.getEducationalContent(crisis.type, 'resolution'),
      completed: false
    });

    // Step 4: System Recovery
    steps.push({
      id: 'recovery',
      title: 'System Recovery',
      description: 'Restore normal operations and verify system stability',
      diagnosticInfo: this.generateDiagnosticInfo(crisis),
      recommendedActions: this.getRecoveryActions(crisis),
      educationalContent: this.getEducationalContent(crisis.type, 'recovery'),
      completed: false
    });

    // Step 5: Prevention Planning
    steps.push({
      id: 'prevention',
      title: 'Prevention Planning',
      description: 'Implement measures to prevent similar crises in the future',
      diagnosticInfo: this.generateDiagnosticInfo(crisis),
      recommendedActions: this.getPreventionActions(crisis),
      educationalContent: this.getEducationalContent(crisis.type, 'prevention'),
      completed: false
    });

    return steps;
  }

  private generateDiagnosticInfo(crisis: CrisisScenario): DiagnosticInfo {
    return {
      rootCause: this.identifyRootCause(crisis),
      affectedSystems: crisis.involvedAgents,
      severity: crisis.severity,
      timeline: this.generateTimeline(crisis),
      visualData: this.generateVisualizations(crisis)
    };
  }

  private identifyRootCause(crisis: CrisisScenario): string {
    switch (crisis.type) {
      case CrisisType.FEEDBACK_LOOP:
        return 'Devices entered a recursive optimization loop, causing system instability';
      case CrisisType.AUTHORITY_CONFLICT:
        return 'Multiple devices claimed authority over the same resources, creating conflicts';
      case CrisisType.PRIVACY_PARADOX:
        return 'Privacy requirements conflicted with functionality needs, causing system deadlock';
      case CrisisType.RESOURCE_EXHAUSTION:
        return 'System resources were depleted due to inefficient allocation and high demand';
      case CrisisType.COMMUNICATION_BREAKDOWN:
        return 'Communication protocols failed, isolating devices and preventing coordination';
      default:
        return 'Unknown system failure - requires further investigation';
    }
  }

  private generateTimeline(crisis: CrisisScenario): TimelineEvent[] {
    return crisis.triggerEvents.map(event => ({
      timestamp: event.timestamp,
      event: event.description,
      severity: event.severity,
      deviceId: event.deviceId,
      impact: this.calculateImpact(event.severity)
    }));
  }

  private calculateImpact(severity: number): string {
    if (severity > 0.8) return 'Critical Impact';
    if (severity > 0.6) return 'High Impact';
    if (severity > 0.4) return 'Medium Impact';
    return 'Low Impact';
  }

  private generateVisualizations(crisis: CrisisScenario): DiagnosticVisualization[] {
    const visualizations: DiagnosticVisualization[] = [];

    // Timeline visualization
    visualizations.push({
      type: 'timeline',
      data: crisis.triggerEvents,
      title: 'Crisis Timeline',
      description: 'Sequence of events leading to system failure'
    });

    // Network diagram showing device relationships
    visualizations.push({
      type: 'network',
      data: {
        nodes: crisis.involvedAgents.map(id => ({ id, status: 'failed' })),
        edges: crisis.cascadeEffects.map(effect => ({
          source: effect.sourceDeviceId,
          target: effect.targetDeviceId,
          type: effect.effectType
        }))
      },
      title: 'Device Interaction Network',
      description: 'How the crisis spread through device connections'
    });

    // Severity heatmap
    visualizations.push({
      type: 'heatmap',
      data: {
        devices: crisis.involvedAgents,
        severity: crisis.severity,
        timeline: crisis.triggerEvents
      },
      title: 'Crisis Severity Map',
      description: 'Visual representation of crisis impact across devices'
    });

    return visualizations;
  }

  private getEducationalContent(crisisType: CrisisType, phase: string): EducationalContent {
    const content: { [key: string]: { [key: string]: EducationalContent } } = {
      [CrisisType.FEEDBACK_LOOP]: {
        diagnostic: {
          concept: 'AI Feedback Loops',
          explanation: 'Feedback loops occur when AI systems optimize based on their own outputs, creating recursive cycles that can spiral out of control.',
          realWorldExample: 'In 2016, Microsoft\'s Tay chatbot learned from Twitter interactions and quickly became problematic due to feedback loops in its learning algorithm.',
          keyTakeaways: [
            'AI systems can amplify small biases through feedback loops',
            'Monitoring and circuit breakers are essential for preventing runaway optimization',
            'Human oversight is crucial in AI learning systems'
          ]
        },
        stabilization: {
          concept: 'Emergency Intervention',
          explanation: 'When feedback loops are detected, immediate intervention is required to break the cycle and prevent further damage.',
          realWorldExample: 'Stock trading algorithms have circuit breakers to halt trading when prices move too rapidly.',
          keyTakeaways: [
            'Quick detection and response can prevent catastrophic failures',
            'Automated safeguards should be built into AI systems',
            'Manual override capabilities are essential'
          ]
        }
      },
      [CrisisType.AUTHORITY_CONFLICT]: {
        diagnostic: {
          concept: 'AI Authority and Governance',
          explanation: 'When multiple AI systems have overlapping authority, conflicts can arise over resource allocation and decision-making.',
          realWorldExample: 'Autonomous vehicles at intersections must have clear protocols for determining right-of-way to avoid conflicts.',
          keyTakeaways: [
            'Clear hierarchies and protocols prevent authority conflicts',
            'AI systems need well-defined boundaries and responsibilities',
            'Conflict resolution mechanisms are essential in multi-agent systems'
          ]
        }
      }
    };

    return content[crisisType]?.[phase] || {
      concept: 'AI System Recovery',
      explanation: 'Understanding how to recover from AI system failures is crucial for maintaining reliable and safe AI operations.',
      realWorldExample: 'Modern AI systems include various recovery mechanisms to handle unexpected failures gracefully.',
      keyTakeaways: [
        'Recovery planning should be part of AI system design',
        'Learning from failures improves future system resilience',
        'Human expertise remains essential in crisis situations'
      ]
    };
  }

  private getStabilizationActions(crisis: CrisisScenario): RecoveryAction[] {
    return [
      {
        type: 'emergency_stop',
        deviceIds: crisis.involvedAgents,
        parameters: { reason: 'Emergency stabilization' },
        priority: 'critical'
      }
    ];
  }

  private getResolutionActions(crisis: CrisisScenario): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    
    switch (crisis.type) {
      case CrisisType.AUTHORITY_CONFLICT:
        actions.push({
          type: 'priority_adjustment',
          deviceIds: crisis.involvedAgents,
          parameters: { priority: 50 },
          priority: 'high'
        });
        break;
      case CrisisType.RESOURCE_EXHAUSTION:
        actions.push({
          type: 'manual_override',
          deviceIds: crisis.involvedAgents,
          parameters: { resources: 30 },
          priority: 'high'
        });
        break;
      default:
        actions.push({
          type: 'isolate_device',
          deviceIds: [crisis.involvedAgents[0]],
          parameters: { reason: 'Isolation for analysis' },
          priority: 'medium'
        });
    }
    
    return actions;
  }

  private getRecoveryActions(crisis: CrisisScenario): RecoveryAction[] {
    return [
      {
        type: 'system_reset',
        deviceIds: crisis.involvedAgents,
        parameters: { preserveConfiguration: true },
        priority: 'medium'
      }
    ];
  }

  private getPreventionActions(crisis: CrisisScenario): RecoveryAction[] {
    // These would be governance rules or system configurations
    return [];
  }

  private show(): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    wizard.classList.remove('hidden');
    wizard.classList.add('visible');
  }

  private hide(): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    wizard.classList.add('hidden');
    wizard.classList.remove('visible');
  }

  private updateWizardDisplay(): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    const progressFill = wizard.querySelector('.progress-fill') as HTMLElement;
    const progressText = wizard.querySelector('.progress-text') as HTMLElement;
    const stepIndicators = wizard.querySelector('.step-indicators') as HTMLElement;

    // Update progress bar
    const progress = ((this.currentStep + 1) / this.steps.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;

    // Update step indicators
    stepIndicators.innerHTML = '';
    this.steps.forEach((step, index) => {
      const indicator = document.createElement('div');
      indicator.className = `step-indicator ${index === this.currentStep ? 'active' : ''} ${step.completed ? 'completed' : ''}`;
      indicator.textContent = (index + 1).toString();
      stepIndicators.appendChild(indicator);
    });

    // Update navigation buttons
    const prevBtn = wizard.querySelector('.prev-btn') as HTMLButtonElement;
    const nextBtn = wizard.querySelector('.next-btn') as HTMLButtonElement;
    
    prevBtn.disabled = this.currentStep === 0;
    nextBtn.disabled = this.currentStep === this.steps.length - 1;
  }

  private displayCurrentStep(): void {
    if (this.currentStep >= this.steps.length) return;

    const step = this.steps[this.currentStep];
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;

    // Update step header
    const stepTitle = wizard.querySelector('.step-title') as HTMLElement;
    const stepDescription = wizard.querySelector('.step-description') as HTMLElement;
    
    stepTitle.textContent = step.title;
    stepDescription.textContent = step.description;

    // Update diagnostic section
    this.displayDiagnostics(step.diagnosticInfo);

    // Update educational content
    if (this.options.showEducationalContent) {
      this.displayEducationalContent(step.educationalContent);
    }

    // Update recommended actions
    this.displayRecommendedActions(step.recommendedActions);
  }

  private displayDiagnostics(diagnosticInfo: DiagnosticInfo): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    const visualizations = wizard.querySelector('.diagnostic-visualizations') as HTMLElement;
    const details = wizard.querySelector('.diagnostic-details') as HTMLElement;

    // Display visualizations
    visualizations.innerHTML = '';
    diagnosticInfo.visualData.forEach(viz => {
      const vizElement = document.createElement('div');
      vizElement.className = 'diagnostic-viz';
      vizElement.innerHTML = `
        <h5>${viz.title}</h5>
        <p>${viz.description}</p>
        <div class="viz-placeholder">[${viz.type.toUpperCase()} VISUALIZATION]</div>
      `;
      visualizations.appendChild(vizElement);
    });

    // Display diagnostic details
    details.innerHTML = `
      <div class="diagnostic-item">
        <strong>Root Cause:</strong> ${diagnosticInfo.rootCause}
      </div>
      <div class="diagnostic-item">
        <strong>Affected Systems:</strong> ${diagnosticInfo.affectedSystems.join(', ')}
      </div>
      <div class="diagnostic-item">
        <strong>Severity:</strong> ${(diagnosticInfo.severity * 100).toFixed(0)}%
      </div>
      <div class="diagnostic-timeline">
        <strong>Timeline:</strong>
        ${diagnosticInfo.timeline.map(event => `
          <div class="timeline-item">
            <span class="timeline-time">${new Date(event.timestamp).toLocaleTimeString()}</span>
            <span class="timeline-event">${event.event}</span>
            <span class="timeline-impact ${event.severity > 0.7 ? 'high' : event.severity > 0.4 ? 'medium' : 'low'}">${event.impact}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private displayEducationalContent(content: EducationalContent): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    const educationalSection = wizard.querySelector('.educational-content') as HTMLElement;

    educationalSection.innerHTML = `
      <div class="educational-card">
        <h4>💡 Learning: ${content.concept}</h4>
        <p class="explanation">${content.explanation}</p>
        <div class="real-world-example">
          <strong>Real-World Example:</strong>
          <p>${content.realWorldExample}</p>
        </div>
        <div class="key-takeaways">
          <strong>Key Takeaways:</strong>
          <ul>
            ${content.keyTakeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  private displayRecommendedActions(actions: RecoveryAction[]): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    const actionsSection = wizard.querySelector('.recommended-actions') as HTMLElement;

    if (actions.length === 0) {
      actionsSection.innerHTML = '<p>No specific actions required for this step.</p>';
      return;
    }

    actionsSection.innerHTML = `
      <h4>Recommended Actions:</h4>
      <div class="action-buttons">
        ${actions.map((action, index) => `
          <button class="action-btn" data-action-index="${index}">
            ${this.getActionDisplayName(action)}
          </button>
        `).join('')}
      </div>
    `;

    // Add event listeners for action buttons
    const actionButtons = actionsSection.querySelectorAll('.action-btn');
    actionButtons.forEach((button, index) => {
      button.addEventListener('click', () => this.executeAction(actions[index]));
    });
  }

  private getActionDisplayName(action: RecoveryAction): string {
    switch (action.type) {
      case 'emergency_stop': return '🛑 Emergency Stop';
      case 'system_reset': return '🔄 System Reset';
      case 'isolate_device': return '🔌 Isolate Device';
      case 'manual_override': return '🎛️ Manual Override';
      case 'priority_adjustment': return '⚖️ Adjust Priorities';
      default: return action.type;
    }
  }

  private async executeAction(action: RecoveryAction): Promise<void> {
    if (!this.onActionCallback) return;

    try {
      const success = await this.onActionCallback(action);
      this.showActionFeedback(action, success);
      
      if (success) {
        this.steps[this.currentStep].completed = true;
        this.updateWizardDisplay();
      }
    } catch (error) {
      this.showActionFeedback(action, false, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private showActionFeedback(action: RecoveryAction, success: boolean, error?: string): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    const feedbackSection = wizard.querySelector('.action-feedback') as HTMLElement;

    const feedbackClass = success ? 'success' : 'error';
    const feedbackIcon = success ? '✅' : '❌';
    const feedbackMessage = success 
      ? `Action "${this.getActionDisplayName(action)}" completed successfully`
      : `Action failed: ${error || 'Unknown error'}`;

    feedbackSection.innerHTML = `
      <div class="action-feedback-item ${feedbackClass}">
        <span class="feedback-icon">${feedbackIcon}</span>
        <span class="feedback-message">${feedbackMessage}</span>
      </div>
    `;

    // Auto-hide feedback after 5 seconds
    setTimeout(() => {
      feedbackSection.innerHTML = '';
    }, 5000);
  }

  private previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateWizardDisplay();
      this.displayCurrentStep();
    }
  }

  private nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateWizardDisplay();
      this.displayCurrentStep();
    }
  }

  private restart(): void {
    this.currentStep = 0;
    this.steps.forEach(step => step.completed = false);
    this.updateWizardDisplay();
    this.displayCurrentStep();
  }

  private completeRecovery(): void {
    const completedSteps = this.steps.filter(step => step.completed).length;
    const totalSteps = this.steps.length;
    const success = completedSteps >= totalSteps * 0.8; // 80% completion threshold

    if (this.options.celebrateSuccess && success) {
      this.showSuccessCelebration();
    }

    const learningData: LearningData = {
      crisisType: this.crisis?.type || CrisisType.FEEDBACK_LOOP,
      stepsCompleted: completedSteps,
      totalSteps: totalSteps,
      completionRate: completedSteps / totalSteps,
      timeSpent: Date.now() - (this.crisis?.triggerEvents[0]?.timestamp || Date.now()),
      success: success
    };

    if (this.onCompleteCallback) {
      this.onCompleteCallback(success, learningData);
    }

    this.hide();
  }

  private showSuccessCelebration(): void {
    const celebration = document.createElement('div');
    celebration.className = 'success-celebration';
    celebration.innerHTML = `
      <div class="celebration-content">
        <div class="celebration-icon">🎉</div>
        <h3>Recovery Successful!</h3>
        <p>You've successfully guided the system through recovery.</p>
        <div class="celebration-stats">
          <div class="stat">
            <span class="stat-value">${this.steps.filter(s => s.completed).length}</span>
            <span class="stat-label">Steps Completed</span>
          </div>
          <div class="stat">
            <span class="stat-value">${Math.round((this.steps.filter(s => s.completed).length / this.steps.length) * 100)}%</span>
            <span class="stat-label">Success Rate</span>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(celebration);

    // Auto-remove celebration after 3 seconds
    setTimeout(() => {
      celebration.remove();
    }, 3000);
  }

  private startReplay(): void {
    if (!this.crisis) return;
    
    console.log('Starting crisis replay...');
    // This would integrate with the visualization system to replay the crisis
    this.displayReplayAnnotations();
  }

  private toggleSlowMotion(): void {
    console.log('Toggling slow motion replay...');
    // This would control the replay speed
  }

  private seekReplay(position: string): void {
    console.log('Seeking replay to position:', position);
    // This would seek to a specific point in the replay timeline
  }

  private displayReplayAnnotations(): void {
    const wizard = this.container.querySelector('.recovery-wizard') as HTMLElement;
    const annotations = wizard.querySelector('.replay-annotations') as HTMLElement;

    if (!this.crisis) return;

    annotations.innerHTML = `
      <div class="replay-annotation-list">
        ${this.crisis.triggerEvents.map((event, index) => `
          <div class="replay-annotation" data-timestamp="${event.timestamp}">
            <div class="annotation-marker">${index + 1}</div>
            <div class="annotation-content">
              <div class="annotation-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
              <div class="annotation-description">${event.description}</div>
              <div class="annotation-analysis">
                This event contributed to the crisis by ${this.getEventAnalysis(event.eventType)}.
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private getEventAnalysis(eventType: string): string {
    const analyses: { [key: string]: string } = {
      'malfunction': 'introducing system instability and reducing overall reliability',
      'conflict': 'creating resource contention and communication breakdown',
      'overload': 'exceeding system capacity and triggering cascade failures',
      'timeout': 'breaking communication chains and isolating system components'
    };
    
    return analyses[eventType] || 'affecting system stability in unexpected ways';
  }

  public setActionCallback(callback: (action: RecoveryAction) => Promise<boolean>): void {
    this.onActionCallback = callback;
  }

  public setCompleteCallback(callback: (success: boolean, learningData: LearningData) => void): void {
    this.onCompleteCallback = callback;
  }
}

export interface LearningData {
  crisisType: CrisisType;
  stepsCompleted: number;
  totalSteps: number;
  completionRate: number;
  timeSpent: number;
  success: boolean;
}