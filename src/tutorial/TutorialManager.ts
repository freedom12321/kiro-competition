import {
  Tutorial,
  TutorialStep,
  TutorialSession,
  TutorialState,
  StepProgress,
  Hint,
  CompletionTrigger,
  TriggerCondition,
  LearningObjective,
  CompletionCriteria,
  LearningMistake,
  TutorialStepType,
  CompletionType,
  HintTrigger,
  TriggerType,
  LearningCategory,
  DifficultyLevel,
  MistakeCategory
} from '../types/core';

export interface TutorialManagerConfig {
  autoSave: boolean;
  hintDelay: number;
  maxHintsPerStep: number;
  allowSkipping: boolean;
  trackAnalytics: boolean;
}

export interface GameState {
  devices: any[];
  environment: any;
  ui: any;
  [key: string]: any;
}

export class TutorialManager {
  private tutorials: Map<string, Tutorial> = new Map();
  private activeSessions: Map<string, TutorialSession> = new Map();
  private config: TutorialManagerConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private gameStateProvider: () => GameState;
  private uiController: any;

  constructor(
    config: TutorialManagerConfig,
    gameStateProvider: () => GameState,
    uiController: any
  ) {
    this.config = config;
    this.gameStateProvider = gameStateProvider;
    this.uiController = uiController;
    this.initializeBuiltInTutorials();
  }

  // Tutorial Management
  registerTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
    this.emit('tutorialRegistered', { tutorial });
  }

  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  getAvailableTutorials(playerProgress?: any): Tutorial[] {
    const tutorials = Array.from(this.tutorials.values());
    
    if (!playerProgress) {
      return tutorials.filter(t => t.prerequisites.length === 0);
    }

    return tutorials.filter(tutorial => {
      // Check if prerequisites are met
      const prerequisitesMet = tutorial.prerequisites.every(prereqId => 
        playerProgress.completedTutorials.includes(prereqId)
      );
      
      // Check if not already completed
      const notCompleted = !playerProgress.completedTutorials.includes(tutorial.id);
      
      return prerequisitesMet && notCompleted;
    });
  }

  // Session Management
  startTutorial(tutorialId: string, playerId: string): TutorialSession {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      throw new Error(`Tutorial ${tutorialId} not found`);
    }

    const session: TutorialSession = {
      id: `${tutorialId}_${playerId}_${Date.now()}`,
      tutorialId,
      playerId,
      startTime: Date.now(),
      currentStep: 0,
      completed: false,
      score: 0,
      hintsUsed: 0,
      timeSpent: 0,
      mistakes: [],
      state: {
        gameState: this.gameStateProvider(),
        stepProgress: tutorial.steps.map(step => ({
          stepId: step.id,
          started: false,
          completed: false,
          attempts: 0,
          timeSpent: 0,
          hintsUsed: []
        })),
        availableHints: [],
        restrictedActions: [],
        highlightedElements: []
      }
    };

    this.activeSessions.set(session.id, session);
    this.startStep(session, 0);
    this.emit('tutorialStarted', { session, tutorial });
    
    // Call start callback
    if (this.onTutorialStart) {
      this.onTutorialStart(tutorialId);
    }
    
    return session;
  }

  private startStep(session: TutorialSession, stepIndex: number): void {
    const tutorial = this.tutorials.get(session.tutorialId)!;
    const step = tutorial.steps[stepIndex];
    
    if (!step) {
      this.completeTutorial(session);
      return;
    }

    session.currentStep = stepIndex;
    const stepProgress = session.state.stepProgress[stepIndex];
    stepProgress.started = true;

    // Update UI restrictions and highlights
    this.updateUIForStep(session, step);
    
    // Schedule hints
    this.scheduleHints(session, step);
    
    // Set up completion monitoring
    this.monitorStepCompletion(session, step);
    
    this.emit('stepStarted', { session, step, stepIndex });
  }

  private updateUIForStep(session: TutorialSession, step: TutorialStep): void {
    // Update restricted actions
    session.state.restrictedActions = step.restrictedActions || [];
    
    // Update highlighted elements
    session.state.highlightedElements = step.targetElement ? [step.targetElement] : [];
    
    // Apply UI constraints
    if (this.uiController) {
      this.uiController.setTutorialMode(true);
      this.uiController.setAllowedActions(step.allowedActions);
      this.uiController.setRestrictedActions(step.restrictedActions);
      
      if (step.highlightArea) {
        this.uiController.highlightArea(step.highlightArea);
      }
      
      if (step.targetElement) {
        this.uiController.highlightElement(step.targetElement);
      }
    }
    
    // Show step instructions
    this.showStepInstructions(step);
  }

  private showStepInstructions(step: TutorialStep): void {
    if (this.uiController && this.uiController.showTutorialInstructions) {
      this.uiController.showTutorialInstructions({
        title: step.title,
        description: step.description,
        instructions: step.instructions,
        type: step.type,
        skipAllowed: step.skipAllowed
      });
    }
  }

  private scheduleHints(session: TutorialSession, step: TutorialStep): void {
    step.hints.forEach(hint => {
      if (hint.trigger.type === HintTrigger.TIME_DELAY) {
        setTimeout(() => {
          this.showHint(session, hint);
        }, hint.delay * 1000);
      } else if (hint.trigger.type === HintTrigger.INACTIVITY) {
        // Set up inactivity timer
        this.setupInactivityTimer(session, hint);
      }
    });
  }

  private setupInactivityTimer(session: TutorialSession, hint: Hint): void {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.showHint(session, hint);
      }, hint.delay * 1000);
    };

    // Listen for user activity
    this.on('userActivity', resetTimer);
    resetTimer();
  }

  private showHint(session: TutorialSession, hint: Hint): void {
    const stepProgress = session.state.stepProgress[session.currentStep];
    
    if (stepProgress.hintsUsed.includes(hint.id)) {
      return; // Hint already shown
    }

    stepProgress.hintsUsed.push(hint.id);
    session.hintsUsed++;
    
    if (this.uiController && this.uiController.showHint) {
      this.uiController.showHint({
        text: hint.text,
        visual: hint.visual,
        priority: hint.priority
      });
    }
    
    this.emit('hintShown', { session, hint });
  }

  private monitorStepCompletion(session: TutorialSession, step: TutorialStep): void {
    const checkCompletion = () => {
      if (this.isStepCompleted(session, step)) {
        this.completeStep(session, session.currentStep);
      }
    };

    // Set up completion monitoring based on trigger type
    switch (step.completionTrigger.type) {
      case TriggerType.CLICK:
        this.on('click', checkCompletion);
        break;
      case TriggerType.DRAG:
        this.on('drag', checkCompletion);
        break;
      case TriggerType.INPUT:
        this.on('input', checkCompletion);
        break;
      case TriggerType.STATE_CHANGE:
        this.on('stateChange', checkCompletion);
        break;
      case TriggerType.TIME_ELAPSED:
        if (step.completionTrigger.timeout) {
          setTimeout(() => {
            this.completeStep(session, session.currentStep);
          }, step.completionTrigger.timeout * 1000);
        }
        break;
    }

    // Auto-complete after time limit if specified
    if (step.timeLimit) {
      setTimeout(() => {
        if (!session.state.stepProgress[session.currentStep].completed) {
          this.recordMistake(session, {
            timestamp: Date.now(),
            description: 'Step timed out',
            category: MistakeCategory.TIMING_ERROR,
            corrected: false,
            hintsUsed: session.state.stepProgress[session.currentStep].hintsUsed.length
          });
          this.completeStep(session, session.currentStep);
        }
      }, step.timeLimit * 1000);
    }
  }

  private isStepCompleted(session: TutorialSession, step: TutorialStep): boolean {
    const gameState = this.gameStateProvider();
    
    return step.completionTrigger.conditions.every(condition => {
      return this.evaluateCondition(condition, gameState, session);
    });
  }

  private evaluateCondition(condition: TriggerCondition, gameState: GameState, session: TutorialSession): boolean {
    // Get the target value from game state
    const targetValue = this.getValueFromPath(gameState, condition.target);
    
    // Compare with expected value using operator
    switch (condition.operator) {
      case 'eq':
        return targetValue === condition.value;
      case 'neq':
        return targetValue !== condition.value;
      case 'gt':
        return targetValue > condition.value;
      case 'gte':
        return targetValue >= condition.value;
      case 'lt':
        return targetValue < condition.value;
      case 'lte':
        return targetValue <= condition.value;
      default:
        return false;
    }
  }

  private getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private completeStep(session: TutorialSession, stepIndex: number): void {
    const stepProgress = session.state.stepProgress[stepIndex];
    stepProgress.completed = true;
    stepProgress.timeSpent = Date.now() - session.startTime;
    
    // Calculate step score
    const stepScore = this.calculateStepScore(session, stepIndex);
    session.score += stepScore;
    
    // Clear UI restrictions for this step
    this.clearStepUI();
    
    this.emit('stepCompleted', { session, stepIndex, score: stepScore });
    
    // Move to next step
    this.startStep(session, stepIndex + 1);
  }

  private calculateStepScore(session: TutorialSession, stepIndex: number): number {
    const stepProgress = session.state.stepProgress[stepIndex];
    const tutorial = this.tutorials.get(session.tutorialId)!;
    const step = tutorial.steps[stepIndex];
    
    let score = 100; // Base score
    
    // Deduct points for hints used
    score -= stepProgress.hintsUsed.length * 10;
    
    // Deduct points for time taken (if there's a time limit)
    if (step.timeLimit && stepProgress.timeSpent > step.timeLimit * 1000) {
      score -= 20;
    }
    
    // Deduct points for attempts
    score -= (stepProgress.attempts - 1) * 5;
    
    return Math.max(0, score);
  }

  private clearStepUI(): void {
    if (this.uiController) {
      this.uiController.clearHighlights();
      this.uiController.hideTutorialInstructions();
    }
  }

  private completeTutorial(session: TutorialSession): void {
    session.completed = true;
    session.timeSpent = Date.now() - session.startTime;
    
    // Calculate final score
    const tutorial = this.tutorials.get(session.tutorialId)!;
    const completionBonus = this.calculateCompletionBonus(session, tutorial);
    session.score += completionBonus;
    
    // Clear all UI restrictions
    if (this.uiController) {
      this.uiController.setTutorialMode(false);
      this.uiController.clearAllRestrictions();
    }
    
    this.emit('tutorialCompleted', { session, tutorial });
    
    // Call completion callback
    if (this.onTutorialComplete) {
      this.onTutorialComplete(session.tutorialId);
    }
    
    // Clean up session
    this.activeSessions.delete(session.id);
  }

  private calculateCompletionBonus(session: TutorialSession, tutorial: Tutorial): number {
    let bonus = 0;
    
    // Bonus for completing without hints
    if (session.hintsUsed === 0) {
      bonus += 50;
    }
    
    // Bonus for completing quickly
    const expectedTime = tutorial.estimatedDuration * 60 * 1000; // Convert to ms
    if (session.timeSpent < expectedTime * 0.8) {
      bonus += 30;
    }
    
    // Bonus for no mistakes
    if (session.mistakes.length === 0) {
      bonus += 20;
    }
    
    return bonus;
  }

  // Mistake tracking
  recordMistake(session: TutorialSession, mistake: LearningMistake): void {
    session.mistakes.push(mistake);
    this.emit('mistakeMade', { session, mistake });
  }

  // Hint system
  requestHint(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const tutorial = this.tutorials.get(session.tutorialId)!;
    const step = tutorial.steps[session.currentStep];
    
    // Find next available hint
    const availableHints = step.hints.filter(hint => 
      !session.state.stepProgress[session.currentStep].hintsUsed.includes(hint.id)
    );
    
    if (availableHints.length > 0) {
      const nextHint = availableHints.sort((a, b) => a.priority - b.priority)[0];
      this.showHint(session, nextHint);
    }
  }

  // Skip functionality
  skipStep(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    const tutorial = this.tutorials.get(session.tutorialId)!;
    const step = tutorial.steps[session.currentStep];
    
    if (!step.skipAllowed) return false;
    
    // Record as skipped
    this.recordMistake(session, {
      timestamp: Date.now(),
      description: 'Step skipped',
      category: MistakeCategory.UNDERSTANDING_ERROR,
      corrected: false,
      hintsUsed: session.state.stepProgress[session.currentStep].hintsUsed.length
    });
    
    this.completeStep(session, session.currentStep);
    return true;
  }

  skipTutorial(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || !this.config.allowSkipping) return false;
    
    session.completed = true;
    session.timeSpent = Date.now() - session.startTime;
    session.score = 0; // No score for skipped tutorial
    
    this.emit('tutorialSkipped', { session });
    this.activeSessions.delete(sessionId);
    
    return true;
  }

  // Event system
  private on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // User activity tracking
  trackUserActivity(activityType: string, data?: any): void {
    this.emit('userActivity', { type: activityType, data });
  }

  // Built-in tutorials
  private initializeBuiltInTutorials(): void {
    // Basic Device Creation Tutorial
    const deviceCreationTutorial: Tutorial = {
      id: 'device-creation-basics',
      name: 'Creating Your First AI Device',
      description: 'Learn how to create AI devices using natural language descriptions',
      difficulty: DifficultyLevel.BEGINNER,
      estimatedDuration: 5,
      prerequisites: [],
      unlocks: ['room-design-basics'],
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to AI Habitat!',
          description: 'Let\'s start by creating your first AI device',
          type: TutorialStepType.INTRODUCTION,
          instructions: 'Click the "Create Device" button to begin',
          hints: [
            {
              id: 'find-create-button',
              text: 'Look for the "Create Device" button in the toolbar',
              trigger: { type: HintTrigger.TIME_DELAY },
              delay: 10,
              priority: 1
            }
          ],
          completionTrigger: {
            type: TriggerType.CLICK,
            conditions: [
              {
                type: 'click',
                target: 'create-device-button',
                value: true,
                operator: 'eq'
              }
            ]
          },
          allowedActions: ['click-create-device'],
          restrictedActions: [],
          skipAllowed: false
        },
        {
          id: 'describe-device',
          title: 'Describe Your Device',
          description: 'Use natural language to describe what you want your device to do',
          type: TutorialStepType.GUIDED_PRACTICE,
          instructions: 'Type: "A helpful smart lamp that adjusts brightness based on the time of day"',
          hints: [
            {
              id: 'typing-hint',
              text: 'Try describing the device\'s personality and main function',
              trigger: { type: HintTrigger.INACTIVITY },
              delay: 15,
              priority: 1
            }
          ],
          completionTrigger: {
            type: TriggerType.INPUT,
            conditions: [
              {
                type: 'input',
                target: 'device-description',
                value: 'lamp',
                operator: 'contains'
              }
            ]
          },
          allowedActions: ['type-description'],
          restrictedActions: [],
          timeLimit: 60,
          skipAllowed: true
        }
      ],
      objectives: [
        {
          id: 'learn-device-creation',
          description: 'Understand how to create AI devices using natural language',
          category: LearningCategory.DEVICE_CREATION,
          measurable: true,
          assessmentCriteria: ['Successfully created a device', 'Used descriptive language']
        }
      ],
      completionCriteria: [
        {
          type: CompletionType.ACTION_PERFORMED,
          parameters: { action: 'device-created' },
          required: true,
          weight: 1.0
        }
      ]
    };

    this.registerTutorial(deviceCreationTutorial);

    // Crisis Management Tutorial
    const crisisManagementTutorial: Tutorial = {
      id: 'crisis-management-basics',
      name: 'Managing AI Device Conflicts',
      description: 'Learn how to handle conflicts and crises between AI devices',
      difficulty: DifficultyLevel.INTERMEDIATE,
      estimatedDuration: 10,
      prerequisites: ['device-creation-basics', 'room-design-basics'],
      unlocks: ['governance-design-basics'],
      steps: [
        {
          id: 'observe-conflict',
          title: 'Observe the Conflict',
          description: 'Watch as two devices compete for the same resource',
          type: TutorialStepType.DEMONSTRATION,
          instructions: 'Notice the red warning indicators showing device conflict',
          hints: [
            {
              id: 'conflict-indicators',
              text: 'Look for red glowing connections between devices',
              trigger: { type: HintTrigger.TIME_DELAY },
              delay: 5,
              priority: 1,
              visual: {
                type: 'highlight',
                target: '.conflict-indicator',
                animation: 'pulse',
                duration: 2000,
                color: '#ff0000'
              }
            }
          ],
          completionTrigger: {
            type: TriggerType.TIME_ELAPSED,
            conditions: [],
            timeout: 10
          },
          allowedActions: ['observe'],
          restrictedActions: [],
          skipAllowed: false
        },
        {
          id: 'use-circuit-breaker',
          title: 'Use Emergency Tools',
          description: 'Use the circuit breaker to stop the conflict',
          type: TutorialStepType.GUIDED_PRACTICE,
          instructions: 'Click the "Circuit Breaker" button to isolate the conflicting devices',
          hints: [
            {
              id: 'find-circuit-breaker',
              text: 'The circuit breaker is in the crisis management panel',
              trigger: { type: HintTrigger.INACTIVITY },
              delay: 10,
              priority: 1
            }
          ],
          completionTrigger: {
            type: TriggerType.CLICK,
            conditions: [
              {
                type: 'click',
                target: 'circuit-breaker-button',
                value: true,
                operator: 'eq'
              }
            ]
          },
          allowedActions: ['click-circuit-breaker'],
          restrictedActions: [],
          timeLimit: 30,
          skipAllowed: true
        }
      ],
      objectives: [
        {
          id: 'learn-crisis-management',
          description: 'Understand how to identify and resolve device conflicts',
          category: LearningCategory.CRISIS_MANAGEMENT,
          measurable: true,
          assessmentCriteria: ['Identified conflict indicators', 'Used emergency tools effectively']
        }
      ],
      completionCriteria: [
        {
          type: CompletionType.ACTION_PERFORMED,
          parameters: { action: 'crisis-resolved' },
          required: true,
          weight: 1.0
        }
      ]
    };

    this.registerTutorial(crisisManagementTutorial);
  }

  // Analytics and progress tracking
  getSessionAnalytics(sessionId: string): any {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.id,
      tutorialId: session.tutorialId,
      progress: (session.currentStep + 1) / this.tutorials.get(session.tutorialId)!.steps.length,
      score: session.score,
      hintsUsed: session.hintsUsed,
      timeSpent: Date.now() - session.startTime,
      mistakes: session.mistakes.length,
      currentStep: session.currentStep
    };
  }

  getAllSessions(): TutorialSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Additional methods needed for integration
  public shouldShowTutorialForMode(mode: any): boolean {
    // Only show tutorial for tutorial mode
    return mode === 'tutorial';
  }

  public isModeTutorialCompleted(mode: any): boolean {
    return this.completedTutorials.has('basic-tutorial');
  }

  public getTutorialForMode(mode: any): any {
    return { id: 'basic-tutorial' };
  }

  public pauseTutorial(): void {
    console.log('Tutorial paused');
    if (this.currentTutorial) {
      this.isPaused = true;
    }
  }

  public getProgress(): any {
    return { completedTutorials: Array.from(this.completedTutorials) };
  }

  public getInitialProgress(): any {
    return { completedTutorials: [] };
  }

  public restoreProgress(progress: any): void {
    console.log('Restoring tutorial progress:', progress);
  }

  // Callback properties for integration
  public onTutorialStart?: (tutorialId: string) => void;
  public onTutorialStep?: (step: any) => void;
  public onTutorialComplete?: (tutorialId: string) => void;

  // Additional state properties
  private completedTutorials: Set<string> = new Set();
  private currentTutorial: any = null;
  private isPaused: boolean = false;

  // Cleanup
  cleanup(): void {
    this.activeSessions.clear();
    this.eventListeners.clear();
    
    if (this.uiController) {
      this.uiController.setTutorialMode(false);
      this.uiController.clearAllRestrictions();
    }
  }
}