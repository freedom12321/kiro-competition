// Jest globals: describe, it, expect, beforeEach, afterEach
import { RecoveryWizard, LearningData } from '@/ui/RecoveryWizard';
import { CrisisScenario, CrisisType, RecoveryAction } from '@/types/core';

// Mock DOM environment
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

describe('RecoveryWizard', () => {
  let container: HTMLElement;
  let wizard: RecoveryWizard;
  let mockActionCallback: jest.MockedFunction<(action: RecoveryAction) => Promise<boolean>>;
  let mockCompleteCallback: jest.MockedFunction<(success: boolean, learningData: LearningData) => void>;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create mock callbacks
    mockActionCallback = jest.fn();
    mockCompleteCallback = jest.fn();

    // Create wizard instance
    wizard = new RecoveryWizard(container, {
      showEducationalContent: true,
      enableSlowMotionReplay: true,
      trackLearningProgress: true,
      celebrateSuccess: true
    });

    wizard.setActionCallback(mockActionCallback);
    wizard.setCompleteCallback(mockCompleteCallback);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe('Wizard Creation and Structure', () => {
    it('should create recovery wizard with correct structure', () => {
      const wizardElement = container.querySelector('.recovery-wizard');
      expect(wizardElement).toBeTruthy();
      expect(wizardElement?.classList.contains('hidden')).toBe(true);
    });

    it('should have all required sections', () => {
      const wizardElement = container.querySelector('.recovery-wizard');
      
      expect(wizardElement?.querySelector('.wizard-header')).toBeTruthy();
      expect(wizardElement?.querySelector('.wizard-content')).toBeTruthy();
      expect(wizardElement?.querySelector('.step-navigation')).toBeTruthy();
      expect(wizardElement?.querySelector('.step-content')).toBeTruthy();
      expect(wizardElement?.querySelector('.replay-section')).toBeTruthy();
      expect(wizardElement?.querySelector('.wizard-actions')).toBeTruthy();
    });

    it('should have navigation and control buttons', () => {
      const wizardElement = container.querySelector('.recovery-wizard');
      
      expect(wizardElement?.querySelector('.prev-btn')).toBeTruthy();
      expect(wizardElement?.querySelector('.next-btn')).toBeTruthy();
      expect(wizardElement?.querySelector('.wizard-close-btn')).toBeTruthy();
      expect(wizardElement?.querySelector('.wizard-restart-btn')).toBeTruthy();
      expect(wizardElement?.querySelector('.wizard-complete-btn')).toBeTruthy();
    });
  });

  describe('Recovery Process Initiation', () => {
    it('should start recovery process with crisis data', () => {
      const mockCrisis: CrisisScenario = {
        id: 'test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [{
          timestamp: Date.now() - 10000,
          description: 'Feedback loop detected',
          deviceId: 'device1',
          eventType: 'feedback_loop',
          severity: 0.8
        }],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(mockCrisis);

      const wizardElement = container.querySelector('.recovery-wizard');
      expect(wizardElement?.classList.contains('visible')).toBe(true);
      expect(wizardElement?.classList.contains('hidden')).toBe(false);
    });

    it('should generate appropriate recovery steps for different crisis types', () => {
      const feedbackLoopCrisis: CrisisScenario = {
        id: 'feedback-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(feedbackLoopCrisis);

      // Check that step indicators are created
      const stepIndicators = container.querySelectorAll('.step-indicator');
      expect(stepIndicators.length).toBe(5); // 5 standard recovery steps

      // Check that first step is active
      const activeIndicator = container.querySelector('.step-indicator.active');
      expect(activeIndicator).toBeTruthy();
    });

    it('should display crisis-specific diagnostic information', () => {
      const authorityCrisis: CrisisScenario = {
        id: 'authority-crisis',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.6,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [{
          timestamp: Date.now() - 5000,
          description: 'Authority conflict detected',
          deviceId: 'device1',
          eventType: 'authority_conflict',
          severity: 0.6
        }],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(authorityCrisis);

      // Check diagnostic information is displayed
      const diagnosticDetails = container.querySelector('.diagnostic-details');
      expect(diagnosticDetails?.textContent).toContain('Authority conflict');
      expect(diagnosticDetails?.textContent).toContain('device1, device2');
      expect(diagnosticDetails?.textContent).toContain('60%');
    });
  });

  describe('Step Navigation', () => {
    beforeEach(() => {
      const mockCrisis: CrisisScenario = {
        id: 'nav-test-crisis',
        type: CrisisType.RESOURCE_EXHAUSTION,
        severity: 0.5,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(mockCrisis);
    });

    it('should disable previous button on first step', () => {
      const prevBtn = container.querySelector('.prev-btn') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });

    it('should enable next button navigation', () => {
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      expect(nextBtn.disabled).toBe(false);

      nextBtn.click();

      // Check that step changed
      const progressText = container.querySelector('.progress-text');
      expect(progressText?.textContent).toContain('Step 2 of 5');
    });

    it('should update progress bar as steps advance', () => {
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      const progressFill = container.querySelector('.progress-fill') as HTMLElement;

      // Initial progress (step 1 of 5 = 20%)
      expect(progressFill.style.width).toBe('20%');

      nextBtn.click();

      // After advancing (step 2 of 5 = 40%)
      expect(progressFill.style.width).toBe('40%');
    });

    it('should disable next button on last step', () => {
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;

      // Navigate to last step
      for (let i = 0; i < 4; i++) {
        nextBtn.click();
      }

      expect(nextBtn.disabled).toBe(true);
      
      const progressText = container.querySelector('.progress-text');
      expect(progressText?.textContent).toContain('Step 5 of 5');
    });
  });

  describe('Educational Content Display', () => {
    it('should display educational content for feedback loop crisis', () => {
      const feedbackCrisis: CrisisScenario = {
        id: 'educational-test',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(feedbackCrisis);

      const educationalContent = container.querySelector('.educational-content');
      expect(educationalContent?.textContent).toContain('AI Feedback Loops');
      expect(educationalContent?.textContent).toContain('recursive cycles');
      expect(educationalContent?.textContent).toContain('Key Takeaways');
    });

    it('should display real-world examples in educational content', () => {
      const authorityCrisis: CrisisScenario = {
        id: 'example-test',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(authorityCrisis);

      const realWorldExample = container.querySelector('.real-world-example');
      expect(realWorldExample).toBeTruthy();
      expect(realWorldExample?.textContent).toContain('Real-World Example');
    });
  });

  describe('Recovery Actions', () => {
    beforeEach(() => {
      const mockCrisis: CrisisScenario = {
        id: 'action-test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['device1', 'device2'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(mockCrisis);
    });

    it('should display recommended actions for stabilization step', () => {
      // Navigate to stabilization step (step 2)
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();

      const actionButtons = container.querySelectorAll('.action-btn');
      expect(actionButtons.length).toBeGreaterThan(0);
      
      const emergencyStopBtn = Array.from(actionButtons).find(btn => 
        btn.textContent?.includes('Emergency Stop')
      );
      expect(emergencyStopBtn).toBeTruthy();
    });

    it('should execute recovery actions when buttons are clicked', async () => {
      mockActionCallback.mockResolvedValue(true);

      // Navigate to stabilization step
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();

      const actionBtn = container.querySelector('.action-btn') as HTMLButtonElement;
      actionBtn.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockActionCallback).toHaveBeenCalled();
      
      const actionCall = mockActionCallback.mock.calls[0][0];
      expect(actionCall.type).toBe('emergency_stop');
      expect(actionCall.deviceIds).toEqual(['device1', 'device2']);
    });

    it('should show success feedback for successful actions', async () => {
      mockActionCallback.mockResolvedValue(true);

      // Navigate to stabilization step
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();

      const actionBtn = container.querySelector('.action-btn') as HTMLButtonElement;
      actionBtn.click();

      await new Promise(resolve => setTimeout(resolve, 200));

      const feedback = container.querySelector('.action-feedback-item.success');
      expect(feedback).toBeTruthy();
      expect(feedback?.textContent).toContain('completed successfully');
    });

    it('should show error feedback for failed actions', async () => {
      mockActionCallback.mockResolvedValue(false);

      // Navigate to stabilization step
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();

      const actionBtn = container.querySelector('.action-btn') as HTMLButtonElement;
      actionBtn.click();

      await new Promise(resolve => setTimeout(resolve, 200));

      const feedback = container.querySelector('.action-feedback-item.error');
      expect(feedback).toBeTruthy();
      expect(feedback?.textContent).toContain('Action failed');
    });
  });

  describe('Crisis Replay System', () => {
    beforeEach(() => {
      const mockCrisis: CrisisScenario = {
        id: 'replay-test-crisis',
        type: CrisisType.COMMUNICATION_BREAKDOWN,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [{
          timestamp: Date.now() - 30000,
          description: 'Communication timeout',
          deviceId: 'device1',
          eventType: 'timeout',
          severity: 0.6
        }],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(mockCrisis);
    });

    it('should have replay controls', () => {
      const replayBtn = container.querySelector('.replay-btn');
      const slowMotionBtn = container.querySelector('.slow-motion-btn');
      const timelineSlider = container.querySelector('.timeline-slider');

      expect(replayBtn).toBeTruthy();
      expect(slowMotionBtn).toBeTruthy();
      expect(timelineSlider).toBeTruthy();
    });

    it('should display replay annotations when replay is started', () => {
      const replayBtn = container.querySelector('.replay-btn') as HTMLButtonElement;
      replayBtn.click();

      const annotations = container.querySelector('.replay-annotations');
      const annotationItems = container.querySelectorAll('.replay-annotation');

      expect(annotations).toBeTruthy();
      expect(annotationItems.length).toBeGreaterThan(0);
    });

    it('should show timeline events in replay annotations', () => {
      const replayBtn = container.querySelector('.replay-btn') as HTMLButtonElement;
      replayBtn.click();

      const annotationDescription = container.querySelector('.annotation-description');
      expect(annotationDescription?.textContent).toContain('Communication timeout');
    });
  });

  describe('Wizard Completion', () => {
    beforeEach(() => {
      const mockCrisis: CrisisScenario = {
        id: 'completion-test-crisis',
        type: CrisisType.PRIVACY_PARADOX,
        severity: 0.5,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(mockCrisis);
    });

    it('should complete recovery and call completion callback', () => {
      const completeBtn = container.querySelector('.wizard-complete-btn') as HTMLButtonElement;
      completeBtn.click();

      expect(mockCompleteCallback).toHaveBeenCalled();
      
      const callArgs = mockCompleteCallback.mock.calls[0];
      const success = callArgs[0];
      const learningData = callArgs[1];

      expect(typeof success).toBe('boolean');
      expect(learningData).toHaveProperty('crisisType');
      expect(learningData).toHaveProperty('completionRate');
      expect(learningData).toHaveProperty('timeSpent');
    });

    it('should show success celebration for successful completion', () => {
      // Mark some steps as completed to trigger success
      mockActionCallback.mockResolvedValue(true);

      const completeBtn = container.querySelector('.wizard-complete-btn') as HTMLButtonElement;
      completeBtn.click();

      // Check if celebration was shown (would be visible briefly)
      const celebration = container.querySelector('.success-celebration');
      expect(celebration).toBeTruthy();
    });

    it('should hide wizard after completion', () => {
      const completeBtn = container.querySelector('.wizard-complete-btn') as HTMLButtonElement;
      completeBtn.click();

      const wizardElement = container.querySelector('.recovery-wizard');
      expect(wizardElement?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Wizard Controls', () => {
    beforeEach(() => {
      const mockCrisis: CrisisScenario = {
        id: 'controls-test-crisis',
        type: CrisisType.RESOURCE_EXHAUSTION,
        severity: 0.7,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(mockCrisis);
    });

    it('should close wizard when close button is clicked', () => {
      const closeBtn = container.querySelector('.wizard-close-btn') as HTMLButtonElement;
      closeBtn.click();

      const wizardElement = container.querySelector('.recovery-wizard');
      expect(wizardElement?.classList.contains('hidden')).toBe(true);
    });

    it('should restart wizard when restart button is clicked', () => {
      // Navigate to a later step
      const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();
      nextBtn.click();

      // Restart wizard
      const restartBtn = container.querySelector('.wizard-restart-btn') as HTMLButtonElement;
      restartBtn.click();

      // Check that we're back to step 1
      const progressText = container.querySelector('.progress-text');
      expect(progressText?.textContent).toContain('Step 1 of 5');

      const prevBtn = container.querySelector('.prev-btn') as HTMLButtonElement;
      expect(prevBtn.disabled).toBe(true);
    });
  });

  describe('Diagnostic Visualizations', () => {
    it('should generate appropriate visualizations for crisis data', () => {
      const complexCrisis: CrisisScenario = {
        id: 'viz-test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.9,
        involvedAgents: ['device1', 'device2', 'device3'],
        triggerEvents: [
          {
            timestamp: Date.now() - 20000,
            description: 'Initial feedback detected',
            deviceId: 'device1',
            eventType: 'feedback_start',
            severity: 0.3
          },
          {
            timestamp: Date.now() - 10000,
            description: 'Feedback loop escalated',
            deviceId: 'device2',
            eventType: 'feedback_escalation',
            severity: 0.7
          }
        ],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(complexCrisis);

      const visualizations = container.querySelectorAll('.diagnostic-viz');
      expect(visualizations.length).toBe(3); // Timeline, Network, Heatmap

      const vizTitles = Array.from(visualizations).map(viz => 
        viz.querySelector('h5')?.textContent
      );

      expect(vizTitles).toContain('Crisis Timeline');
      expect(vizTitles).toContain('Device Interaction Network');
      expect(vizTitles).toContain('Crisis Severity Map');
    });

    it('should display timeline events with severity indicators', () => {
      const timelineCrisis: CrisisScenario = {
        id: 'timeline-test',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.8,
        involvedAgents: ['device1'],
        triggerEvents: [{
          timestamp: Date.now() - 15000,
          description: 'High severity event',
          deviceId: 'device1',
          eventType: 'authority_conflict',
          severity: 0.9
        }],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(timelineCrisis);

      const timelineItems = container.querySelectorAll('.timeline-item');
      expect(timelineItems.length).toBeGreaterThan(0);

      const highImpactItem = container.querySelector('.timeline-impact.high');
      expect(highImpactItem).toBeTruthy();
      expect(highImpactItem?.textContent).toBe('Critical Impact');
    });
  });

  describe('Learning Progress Tracking', () => {
    it('should track learning data with correct structure', () => {
      const trackingCrisis: CrisisScenario = {
        id: 'tracking-test',
        type: CrisisType.COMMUNICATION_BREAKDOWN,
        severity: 0.6,
        involvedAgents: ['device1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      wizard.startRecovery(trackingCrisis);

      const completeBtn = container.querySelector('.wizard-complete-btn') as HTMLButtonElement;
      completeBtn.click();

      expect(mockCompleteCallback).toHaveBeenCalled();
      
      const learningData = mockCompleteCallback.mock.calls[0][1];
      expect(learningData).toHaveProperty('crisisType', CrisisType.COMMUNICATION_BREAKDOWN);
      expect(learningData).toHaveProperty('stepsCompleted');
      expect(learningData).toHaveProperty('totalSteps', 5);
      expect(learningData).toHaveProperty('completionRate');
      expect(learningData).toHaveProperty('timeSpent');
      expect(learningData).toHaveProperty('success');
    });
  });
});