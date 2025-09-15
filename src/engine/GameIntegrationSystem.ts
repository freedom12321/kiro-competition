import { GameState, GameMode, TransitionType, IntegrationError } from '../types/core';
import { ErrorHandlingSystem } from './ErrorHandlingSystem';
import { GameRenderer } from './GameRenderer';
import { InputManager } from './InputManager';
import { SaveManager } from './SaveManager';
import { AnalyticsManager } from './AnalyticsManager';
import { DeviceCreationPanel } from '../ui/DeviceCreationPanel';
import { RoomDesigner } from '../ui/RoomDesigner';
import { GameHUD } from '../ui/GameHUD';
import { CrisisManagementPanel } from '../ui/CrisisManagementPanel';
import { TutorialManager } from '../tutorial/TutorialManager';
import { ScenarioEngine } from '../tutorial/ScenarioEngine';
import { AchievementSystem } from '../tutorial/AchievementSystem';
import { DeviceInteractionSimulator } from '../simulation/DeviceInteractionSimulator';
import { CrisisManagementSystem } from '../simulation/CrisisManagementSystem';
import { EmergentStorySystem } from '../simulation/EmergentStorySystem';
import { AudioManager } from '../audio/AudioManager';
import { VisualEffectsManager } from '../visual-effects/VisualEffectsManager';
import { AccessibilityManager } from '../accessibility/AccessibilityManager';

/**
 * Central integration system that orchestrates all game components
 * and manages seamless transitions between different game modes
 */
export class GameIntegrationSystem {
  private currentGameState: GameState;
  private currentMode: GameMode;
  private isTransitioning: boolean = false;
  private errorHandlingSystem: ErrorHandlingSystem;
  private systemsInitialized: boolean = false;

  // Core engine systems
  private gameRenderer: GameRenderer;
  private inputManager: InputManager;
  private saveManager: SaveManager;
  private analyticsManager: AnalyticsManager;

  // UI systems
  private deviceCreationPanel: DeviceCreationPanel;
  private roomDesigner: RoomDesigner;
  private gameHUD: GameHUD;
  private crisisManagementPanel: CrisisManagementPanel;

  // Tutorial and progression systems
  private tutorialManager: TutorialManager;
  private scenarioEngine: ScenarioEngine;
  private achievementSystem: AchievementSystem;

  // Simulation systems
  private deviceSimulator: DeviceInteractionSimulator;
  private crisisSystem: CrisisManagementSystem;
  private storySystem: EmergentStorySystem;

  // Audio and visual systems
  private audioManager: AudioManager;
  private visualEffectsManager: VisualEffectsManager;
  private accessibilityManager: AccessibilityManager;

  constructor(gameContainer?: HTMLElement) {
    this.errorHandlingSystem = new ErrorHandlingSystem();
    this.setupErrorHandling();
    this.currentMode = GameMode.MAIN_MENU;
    this.currentGameState = this.createInitialGameState();
    this.initializeSystems(gameContainer);
  }

  /**
   * Initialize all game systems and establish connections
   */
  private initializeSystems(gameContainer?: HTMLElement): void {
    try {
      console.log('Initializing game systems...');
      
      // Initialize core engine systems
      this.gameRenderer = new GameRenderer(gameContainer || document.getElementById('game-container')!);
      this.inputManager = new InputManager(
        (this.gameRenderer as any).camera,
        (this.gameRenderer as any).renderer,
        gameContainer || document.getElementById('game-container')!
      );
      this.saveManager = new SaveManager();
      this.analyticsManager = new AnalyticsManager();

      // Initialize UI systems
      this.deviceCreationPanel = new DeviceCreationPanel();
      this.roomDesigner = new RoomDesigner();
      this.gameHUD = new GameHUD();
      this.crisisManagementPanel = new CrisisManagementPanel();

      // Initialize tutorial and progression systems
      this.tutorialManager = new TutorialManager();
      this.scenarioEngine = new ScenarioEngine();
      this.achievementSystem = new AchievementSystem();

      // Initialize simulation systems
      this.deviceSimulator = new DeviceInteractionSimulator();
      this.crisisSystem = new CrisisManagementSystem();
      this.storySystem = new EmergentStorySystem();

      // Initialize audio and visual systems
      this.audioManager = new AudioManager();
      this.visualEffectsManager = new VisualEffectsManager();
      this.accessibilityManager = new AccessibilityManager();

      // Connect systems
      this.connectSystems();
      this.setupEventHandlers();
      
      // Start the renderer
      this.gameRenderer.start();
      
      this.systemsInitialized = true;
      console.log('Game systems initialized successfully');
    } catch (error) {
      this.handleError(new IntegrationError('SYSTEM_INITIALIZATION_FAILED', error as Error));
    }
  }

  /**
   * Establish connections between systems for seamless integration
   */
  private connectSystems(): void {
    console.log('Establishing system connections...');

    // Connect device creation to simulation
    this.deviceCreationPanel.onDeviceCreated = (device) => {
      this.deviceSimulator?.addDevice?.(device);
      this.analyticsManager?.trackEvent?.('device_created', { 
        deviceType: device.type, 
        personality: device.personality 
      });
      this.achievementSystem?.checkDeviceCreationAchievements?.(device);
    };

    // Connect room designer to simulation
    this.roomDesigner.onDevicePlaced = (device, position) => {
      this.deviceSimulator?.placeDevice?.(device.id, position);
      this.gameRenderer?.updateDevicePosition?.(device.id, position);
      this.analyticsManager?.trackEvent?.('device_placed', { deviceId: device.id, position });
    };

    this.roomDesigner.onEnvironmentChanged = (environment) => {
      this.currentGameState.environment = environment;
      this.gameRenderer?.updateEnvironment?.(environment);
      this.deviceSimulator?.updateEnvironment?.(environment);
    };

    // Connect simulation to UI feedback
    this.deviceSimulator.onInteractionDetected = (interaction) => {
      this.gameHUD?.displayInteraction?.(interaction);
      this.visualEffectsManager?.showInteractionEffect?.(interaction);
      this.audioManager?.playInteractionSound?.(interaction);
      this.storySystem?.processInteraction?.(interaction);
      this.analyticsManager?.trackEvent?.('device_interaction', { 
        type: interaction.type, 
        devices: interaction.devices 
      });
    };

    // Connect crisis detection to management UI
    this.crisisSystem.onCrisisDetected = (crisis) => {
      this.transitionToMode(GameMode.CRISIS_MANAGEMENT);
      this.crisisManagementPanel?.showCrisis?.(crisis);
      this.gameHUD?.showCrisisAlert?.(crisis);
      this.visualEffectsManager?.showCrisisEffect?.(crisis);
      this.audioManager?.playCrisisSound?.(crisis);
      this.analyticsManager?.trackEvent?.('crisis_detected', { 
        type: crisis.type, 
        severity: crisis.severity 
      });
    };

    this.crisisManagementPanel.onCrisisResolved = (crisis, resolution) => {
      this.crisisSystem?.resolveCrisis?.(crisis.id, resolution);
      this.transitionToMode(GameMode.FREE_PLAY);
      this.achievementSystem?.checkCrisisAchievements?.(crisis, resolution);
      this.analyticsManager?.trackEvent?.('crisis_resolved', { 
        crisisType: crisis.type, 
        strategy: resolution.strategy 
      });
    };

    // Connect story system to UI
    this.storySystem.onStoryMoment = (moment) => {
      this.gameHUD?.displayStoryMoment?.(moment);
      this.visualEffectsManager?.showStoryEffect?.(moment);
      this.audioManager?.playStorySound?.(moment);
      this.achievementSystem?.checkStoryAchievements?.(moment);
      this.analyticsManager?.trackEvent?.('story_moment', { 
        type: moment.title, 
        educationalValue: moment.educationalValue 
      });
    };

    // Connect tutorial system
    this.tutorialManager.onTutorialStep = (step) => {
      this.gameHUD?.showTutorialStep?.(step);
      this.inputManager?.enableTutorialMode?.(step.constraints);
      this.analyticsManager?.trackEvent?.('tutorial_step', { stepId: step.id });
    };

    this.tutorialManager.onTutorialStart = (tutorialId) => {
      this.analyticsManager?.trackEvent?.('tutorial_started', { tutorialId, category: 'learning' });
    };

    this.tutorialManager.onTutorialComplete = (tutorialId) => {
      this.transitionToMode(GameMode.FREE_PLAY);
      this.achievementSystem?.unlockTutorialAchievement?.(tutorialId);
      this.analyticsManager?.trackEvent?.('tutorial_completed', { tutorialId });
    };

    // Connect scenario system
    this.scenarioEngine.onScenarioComplete = (scenario, result) => {
      this.achievementSystem?.checkScenarioAchievements?.(scenario, result);
      this.analyticsManager?.trackEvent?.('scenario_completed', { 
        scenarioId: scenario.id, 
        score: result.score 
      });
    };

    // Connect accessibility system
    this.accessibilityManager.onSettingsChanged = (settings) => {
      this.applyAccessibilitySettings(settings);
      this.currentGameState.settings = settings;
      this.analyticsManager?.trackEvent?.('accessibility_changed', { settings });
    };

    // Connect input system to all UI components
    this.inputManager.setDeviceDragCallback((device, position) => {
      return this.roomDesigner?.handleDeviceDrag?.(device, position) || 'success';
    });

    this.inputManager.setRoomInteractionCallback((position) => {
      return this.roomDesigner?.handleRoomInteraction?.(position) || 'empty_space';
    });

    this.inputManager.setUIClickCallback((element) => {
      return this.gameHUD?.handleUIClick?.(element) || 'handled';
    });

    console.log('System connections established successfully');
  }

  /**
   * Set up global event handlers for system coordination
   */
  private setupEventHandlers(): void {
    console.log('Setting up event handlers...');

    // Handle window resize
    window.addEventListener('resize', () => {
      this.gameRenderer.onWindowResize();
    });

    // Handle visibility changes (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseActiveSimulations();
      } else {
        this.resumeActiveSimulations();
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.saveCurrentGame();
      this.shutdown();
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      this.handleGlobalKeyboard(event);
    });

    // Handle errors globally
    window.addEventListener('error', (event) => {
      this.handleError(new IntegrationError('GLOBAL_ERROR', new Error(event.message)));
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new IntegrationError('UNHANDLED_PROMISE_REJECTION', new Error(event.reason)));
    });

    console.log('Event handlers set up successfully');
  }

  /**
   * Transition smoothly between different game modes
   */
  public async transitionToMode(newMode: GameMode, transitionType: TransitionType = TransitionType.SMOOTH): Promise<void> {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    
    try {
      console.log(`Transitioning from ${this.currentMode} to ${newMode} with ${transitionType} transition`);

      // Pre-transition cleanup
      await this.cleanupCurrentMode();

      // Update mode
      const previousMode = this.currentMode;
      this.currentMode = newMode;

      // Initialize new mode
      await this.initializeMode(newMode);

      // Update game state
      this.currentGameState.mode = newMode;
      this.currentGameState.timestamp = Date.now();

      console.log(`Successfully transitioned to ${newMode}`);

    } catch (error) {
      this.handleError(new IntegrationError('MODE_TRANSITION_FAILED', error as Error));
      // Rollback to previous mode if transition failed
      this.currentMode = this.currentGameState.mode;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Clean up resources from current mode
   */
  private async cleanupCurrentMode(): Promise<void> {
    console.log(`Cleaning up resources for ${this.currentMode} mode`);
    
    try {
      switch (this.currentMode) {
        case GameMode.TUTORIAL:
          this.tutorialManager?.pauseTutorial?.();
          this.gameHUD?.hideTutorialOverlay?.();
          break;
        case GameMode.SCENARIO:
          this.scenarioEngine?.pauseScenario?.();
          break;
        case GameMode.FREE_PLAY:
          this.deviceSimulator?.pauseSimulation?.();
          break;
        case GameMode.CRISIS_MANAGEMENT:
          this.crisisManagementPanel?.hide?.();
          break;
        case GameMode.DEVICE_CREATION:
          this.deviceCreationPanel?.hide?.();
          break;
        case GameMode.ROOM_DESIGN:
          this.roomDesigner?.hide?.();
          break;
        default:
          console.log('No specific cleanup needed');
      }
    } catch (error) {
      console.warn(`Failed to cleanup ${this.currentMode} mode:`, error);
      // Continue with cleanup rather than failing
    }
  }

  /**
   * Initialize systems for new mode
   */
  private async initializeMode(mode: GameMode): Promise<void> {
    console.log(`Initializing ${mode} mode`);
    
    try {
      switch (mode) {
        case GameMode.TUTORIAL:
          if (this.tutorialManager?.shouldShowTutorialForMode?.(mode)) {
            const tutorial = this.tutorialManager.getTutorialForMode(mode);
            await this.tutorialManager.startTutorial(tutorial.id);
            this.gameHUD?.showTutorialOverlay?.();
          }
          break;
        case GameMode.SCENARIO:
          await this.scenarioEngine?.loadCurrentScenario?.();
          this.gameHUD?.showScenarioUI?.();
          break;
        case GameMode.FREE_PLAY:
          this.deviceSimulator?.resumeSimulation?.();
          this.gameHUD?.showFreePlayUI?.();
          break;
        case GameMode.CRISIS_MANAGEMENT:
          this.crisisManagementPanel?.show?.();
          this.gameHUD?.showCrisisUI?.();
          break;
        case GameMode.DEVICE_CREATION:
          this.deviceCreationPanel?.show?.();
          this.roomDesigner?.enableQuickAccess?.();
          break;
        case GameMode.ROOM_DESIGN:
          this.roomDesigner?.show?.();
          this.deviceCreationPanel?.enableQuickAccess?.();
          break;
        case GameMode.MAIN_MENU:
          this.gameHUD?.showMainMenu?.();
          break;
        default:
          console.log('No specific initialization needed');
      }
    } catch (error) {
      console.warn(`Failed to initialize ${mode} mode:`, error);
      // Continue with partial initialization rather than failing completely
    }
  }

  // Simplified methods for core functionality

  /**
   * Save current game state
   */
  public async saveCurrentGame(): Promise<void> {
    try {
      const gameState = this.captureCurrentGameState();
      await this.saveManager.saveGameState(gameState);
      this.analyticsManager.trackEvent('game_saved', { mode: this.currentMode });
      console.log('Game saved successfully');
    } catch (error) {
      this.handleError(new IntegrationError('SAVE_FAILED', error as Error));
    }
  }

  /**
   * Load game state
   */
  public async loadGame(saveId: string): Promise<void> {
    try {
      console.log(`Loading game with ID: ${saveId}`);
      const loadResult = await this.saveManager.loadGameState(saveId);
      
      if (!loadResult.success || !loadResult.gameState) {
        throw new Error(`Failed to load game: ${loadResult.errors?.join(', ') || 'Unknown error'}`);
      }
      
      await this.restoreGameState(loadResult.gameState);
      this.analyticsManager.trackEvent('game_loaded', { saveId, mode: loadResult.gameState.mode });
      console.log('Game loaded successfully');
    } catch (error) {
      this.handleError(new IntegrationError('LOAD_FAILED', error as Error));
    }
  }

  /**
   * Capture current game state for saving
   */
  private captureCurrentGameState(): GameState {
    return {
      mode: this.currentMode,
      devices: this.deviceSimulator?.getAllDevices?.() || [],
      environment: this.roomDesigner?.getCurrentEnvironment?.() || this.currentGameState.environment,
      tutorialProgress: this.tutorialManager?.getProgress?.() || { completedTutorials: [] },
      scenarioProgress: this.scenarioEngine?.getProgress?.() || { completedScenarios: [], unlockedScenarios: [] },
      achievements: this.achievementSystem?.getUnlockedAchievements?.() || [],
      settings: this.accessibilityManager?.getCurrentSettings?.() || this.currentGameState.settings,
      timestamp: Date.now()
    };
  }

  /**
   * Restore game state from save data
   */
  private async restoreGameState(gameState: GameState): Promise<void> {
    console.log('Restoring game state:', gameState);
    
    try {
      // Update current state
      this.currentGameState = gameState;
      
      // Restore individual system states
      this.deviceSimulator?.loadDevices?.(gameState.devices);
      this.roomDesigner?.loadEnvironment?.(gameState.environment);
      this.tutorialManager?.restoreProgress?.(gameState.tutorialProgress);
      this.scenarioEngine?.restoreProgress?.(gameState.scenarioProgress);
      this.achievementSystem?.restoreAchievements?.(gameState.achievements);
      this.accessibilityManager?.applySettings?.(gameState.settings);
      
      // Transition to saved mode
      await this.transitionToMode(gameState.mode);
      
      console.log('Game state restored successfully');
    } catch (error) {
      console.warn('Failed to restore some game state:', error);
      // Continue with partial restoration
    }
  }

  /**
   * Create initial game state
   */
  private createInitialGameState(): GameState {
    return {
      mode: GameMode.MAIN_MENU,
      devices: [],
      environment: this.roomDesigner?.getDefaultEnvironment() || {
        id: 'default',
        type: 'home' as any,
        layout: {
          width: 10,
          height: 10,
          walls: [],
          doors: [],
          windows: [],
          gridSize: 1
        },
        devices: [],
        rules: []
      },
      tutorialProgress: this.tutorialManager?.getInitialProgress() || { completedTutorials: [] },
      scenarioProgress: this.scenarioEngine?.getInitialProgress() || { completedScenarios: [], unlockedScenarios: [] },
      achievements: [],
      settings: this.accessibilityManager?.getDefaultSettings() || {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        audioDescriptions: false,
        keyboardNavigation: false
      },
      timestamp: Date.now()
    };
  }

  /**
   * Apply accessibility settings across all systems
   */
  private applyAccessibilitySettings(settings: any): void {
    console.log('Applying accessibility settings:', settings);
    
    try {
      // Apply to all UI systems
      this.gameHUD?.applyAccessibilitySettings?.(settings);
      this.deviceCreationPanel?.applyAccessibilitySettings?.(settings);
      this.roomDesigner?.applyAccessibilitySettings?.(settings);
      this.crisisManagementPanel?.applyAccessibilitySettings?.(settings);
      
      // Apply to visual systems
      this.gameRenderer?.applyAccessibilitySettings?.(settings);
      this.visualEffectsManager?.applyAccessibilitySettings?.(settings);
      
      // Apply to audio system
      this.audioManager?.applyAccessibilitySettings?.(settings);
      
      // Apply to input system
      this.inputManager?.applyAccessibilitySettings?.(settings);
    } catch (error) {
      console.warn('Failed to apply some accessibility settings:', error);
    }
  }

  /**
   * Pause active simulations (e.g., when tab is hidden)
   */
  private pauseActiveSimulations(): void {
    this.deviceSimulator?.pauseSimulation?.();
    this.crisisSystem?.pauseMonitoring?.();
    this.audioManager?.pauseAll?.();
    this.analyticsManager?.trackEvent?.('simulation_paused', { reason: 'tab_hidden' });
  }

  /**
   * Resume active simulations (e.g., when tab becomes visible)
   */
  private resumeActiveSimulations(): void {
    this.deviceSimulator?.resumeSimulation?.();
    this.crisisSystem?.resumeMonitoring?.();
    this.audioManager?.resumeAll?.();
    this.analyticsManager?.trackEvent?.('simulation_resumed', { reason: 'tab_visible' });
  }

  /**
   * Handle global keyboard shortcuts
   */
  private handleGlobalKeyboard(event: KeyboardEvent): void {
    // Handle accessibility shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          this.saveCurrentGame();
          break;
        case 'z':
          event.preventDefault();
          // Undo last action if possible
          break;
        case 'h':
          event.preventDefault();
          this.gameHUD.toggleHelp();
          break;
      }
    }

    // Handle mode switching shortcuts
    if (event.altKey) {
      switch (event.key) {
        case '1':
          event.preventDefault();
          this.transitionToMode(GameMode.DEVICE_CREATION);
          break;
        case '2':
          event.preventDefault();
          this.transitionToMode(GameMode.ROOM_DESIGN);
          break;
        case '3':
          event.preventDefault();
          this.transitionToMode(GameMode.FREE_PLAY);
          break;
      }
    }

    // Handle escape key
    if (event.key === 'Escape') {
      this.handleEscapeKey();
    }
  }

  /**
   * Handle escape key press
   */
  private handleEscapeKey(): void {
    switch (this.currentMode) {
      case GameMode.CRISIS_MANAGEMENT:
        // Don't allow escape during crisis - must resolve it
        break;
      case GameMode.DEVICE_CREATION:
      case GameMode.ROOM_DESIGN:
        this.transitionToMode(GameMode.FREE_PLAY);
        break;
      case GameMode.TUTORIAL:
        // Show tutorial pause menu
        this.gameHUD.showTutorialPauseMenu();
        break;
      default:
        this.gameHUD.showPauseMenu();
        break;
    }
  }

  /**
   * Set up comprehensive error handling
   */
  private setupErrorHandling(): void {
    // Register error callback to handle UI updates
    this.errorHandlingSystem.onError((error) => {
      console.log('Error detected:', error);
      const result = this.errorHandlingSystem.handleError(error);
      
      if (result.userMessage) {
        console.log('User message:', result.userMessage);
      }
      
      // Handle safe mode activation
      if (result.safeModeRequired) {
        this.enableSafeMode();
      }
    });

    // Register system-specific error handlers
    this.errorHandlingSystem.registerErrorHandler('RENDERING_ERROR', {
      handle: (error, context) => {
        console.log('Handling rendering error:', error.message);
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Rendering issue detected. Switching to compatibility mode.',
          technicalDetails: error.message,
          suggestedActions: ['Try refreshing the page', 'Check browser compatibility']
        };
      }
    });

    this.errorHandlingSystem.registerErrorHandler('SIMULATION_ERROR', {
      handle: (error, context) => {
        console.log('Handling simulation error:', error.message);
        
        try {
          // Pause simulation and enable safe mode
          this.deviceSimulator?.pauseSimulation?.();
          this.deviceSimulator?.enableSafeMode?.();
        } catch (handlerError) {
          console.warn('Failed to pause simulation during error handling:', handlerError);
        }
        
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: true,
          userMessage: 'Simulation paused due to error. You can continue with device creation.',
          technicalDetails: error.message,
          suggestedActions: ['Check device configurations', 'Restart simulation']
        };
      }
    });

    this.errorHandlingSystem.registerErrorHandler('AUDIO_ERROR', {
      handle: (error, context) => {
        console.log('Handling audio error:', error.message);
        return {
          handled: true,
          recoveryAttempted: true,
          safeModeRequired: false,
          userMessage: 'Audio system error. Game will continue without sound.',
          technicalDetails: error.message,
          suggestedActions: ['Check audio settings', 'Try refreshing the page']
        };
      }
    });

    this.errorHandlingSystem.registerErrorHandler('LOAD_FAILED', {
      handle: (error, context) => {
        console.log('Handling load error:', error.message);
        return {
          handled: true,
          recoveryAttempted: false,
          safeModeRequired: false,
          userMessage: 'Failed to load saved game. Starting fresh session.',
          technicalDetails: error.message,
          suggestedActions: ['Try loading a different save', 'Start a new game']
        };
      }
    });
  }

  /**
   * Handle integration errors with graceful degradation
   */
  private handleError(error: IntegrationError): void {
    console.error('Integration Error:', error);
    
    // Use centralized error handling system
    const result = this.errorHandlingSystem.handleError(error);
    
    console.log('Error handled:', result);
  }

  /**
   * Enable safe mode with reduced functionality
   */
  private enableSafeMode(): void {
    if (this.errorHandlingSystem.isSafeModeEnabled()) {
      return; // Already in safe mode
    }
    
    console.log('Enabling safe mode');
    this.errorHandlingSystem.enableSafeMode();
    console.log('Safe mode enabled');
  }

  /**
   * Get current game mode
   */
  public getCurrentMode(): GameMode {
    return this.currentMode;
  }

  /**
   * Cleanup and dispose of all systems
   */
  public dispose(): void {
    if (this.gameRenderer) {
      this.gameRenderer.stop();
      this.gameRenderer.dispose();
    }
    
    if (this.visualEffectsManager) {
      this.visualEffectsManager.shutdown();
    }
    
    this.systemsInitialized = false;
  }

  /**
   * Get current game state
   */
  public getCurrentGameState(): GameState {
    return this.currentGameState;
  }

  /**
   * Check if system is currently transitioning
   */
  public isCurrentlyTransitioning(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get system references for external access
   */
  public getSystemReferences() {
    return {
      gameRenderer: this.gameRenderer,
      inputManager: this.inputManager,
      saveManager: this.saveManager,
      analyticsManager: this.analyticsManager,
      deviceSimulator: this.deviceSimulator,
      tutorialManager: this.tutorialManager,
      scenarioEngine: this.scenarioEngine,
      achievementSystem: this.achievementSystem,
      crisisSystem: this.crisisSystem,
      storySystem: this.storySystem,
      audioManager: this.audioManager,
      visualEffectsManager: this.visualEffectsManager,
      accessibilityManager: this.accessibilityManager,
      deviceCreationPanel: this.deviceCreationPanel,
      roomDesigner: this.roomDesigner,
      gameHUD: this.gameHUD,
      crisisManagementPanel: this.crisisManagementPanel
    };
  }

  /**
   * Check if all systems are properly initialized
   */
  public areSystemsInitialized(): boolean {
    return this.systemsInitialized;
  }

  /**
   * Get current system health status
   */
  public getSystemHealth() {
    return {
      initialized: this.systemsInitialized,
      currentMode: this.currentMode,
      isTransitioning: this.isTransitioning,
      safeModeEnabled: this.errorHandlingSystem.isSafeModeEnabled(),
      deviceCount: this.deviceSimulator?.getDeviceCount() || 0,
      lastSaveTime: this.currentGameState.timestamp
    };
  }

  /**
   * Force a system health check and recovery if needed
   */
  public async performHealthCheck(): Promise<void> {
    try {
      console.log('Performing system health check...');
      
      // Check each system
      const healthChecks = [
        this.gameRenderer?.isHealthy?.() ?? true,
        this.deviceSimulator?.isHealthy?.() ?? true,
        this.audioManager?.isHealthy?.() ?? true,
        this.visualEffectsManager?.isHealthy?.() ?? true
      ];

      const unhealthySystems = healthChecks.filter(check => !check).length;
      
      if (unhealthySystems > 0) {
        console.warn(`${unhealthySystems} systems are unhealthy, attempting recovery...`);
        await this.recoverUnhealthySystems();
      }
      
      console.log('System health check completed');
    } catch (error) {
      this.handleError(new IntegrationError('HEALTH_CHECK_FAILED', error as Error));
    }
  }

  /**
   * Attempt to recover unhealthy systems
   */
  private async recoverUnhealthySystems(): Promise<void> {
    // Attempt to reinitialize problematic systems
    try {
      if (!this.gameRenderer?.isHealthy?.()) {
        console.log('Recovering game renderer...');
        // Reinitialize renderer if needed
      }
      
      if (!this.deviceSimulator?.isHealthy?.()) {
        console.log('Recovering device simulator...');
        this.deviceSimulator.enableSafeMode();
      }
      
      if (!this.audioManager?.isHealthy?.()) {
        console.log('Recovering audio manager...');
        // Reinitialize audio if needed
      }
    } catch (error) {
      console.error('Failed to recover systems:', error);
      this.enableSafeMode();
    }
  }

  /**
   * Shutdown all systems gracefully
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('Shutting down game systems...');
      
      // Save current state before shutdown
      try {
        await this.saveCurrentGame();
      } catch (error) {
        console.warn('Failed to save game during shutdown:', error);
      }
      
      // Shutdown individual systems
      try {
        this.deviceSimulator?.shutdown?.();
      } catch (error) {
        console.warn('Failed to shutdown device simulator:', error);
      }
      
      try {
        this.gameRenderer?.dispose?.();
      } catch (error) {
        console.warn('Failed to dispose game renderer:', error);
      }
      
      try {
        this.inputManager?.dispose?.();
      } catch (error) {
        console.warn('Failed to dispose input manager:', error);
      }
      
      try {
        this.audioManager?.dispose?.();
      } catch (error) {
        console.warn('Failed to dispose audio manager:', error);
      }
      
      try {
        this.visualEffectsManager?.dispose?.();
      } catch (error) {
        console.warn('Failed to dispose visual effects manager:', error);
      }
      
      // Mark systems as shut down
      this.systemsInitialized = false;
      
      console.log('Game systems shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}