import { GameIntegrationSystem } from '../../src/engine/GameIntegrationSystem';
import { GameMode, DeviceCategory, PersonalityTrait, CrisisType } from '../../src/types/core';

// Mock all dependencies
jest.mock('../../src/engine/GameRenderer');
jest.mock('../../src/engine/InputManager');
jest.mock('../../src/engine/SaveManager');
jest.mock('../../src/engine/AnalyticsManager');
jest.mock('../../src/ui/DeviceCreationPanel');
jest.mock('../../src/ui/RoomDesigner');
jest.mock('../../src/ui/GameHUD');
jest.mock('../../src/ui/CrisisManagementPanel');
jest.mock('../../src/tutorial/TutorialManager');
jest.mock('../../src/tutorial/ScenarioEngine');
jest.mock('../../src/tutorial/AchievementSystem');
jest.mock('../../src/simulation/DeviceInteractionSimulator');
jest.mock('../../src/simulation/CrisisManagementSystem');
jest.mock('../../src/simulation/EmergentStorySystem');
jest.mock('../../src/audio/AudioManager');
jest.mock('../../src/visual-effects/VisualEffectsManager');
jest.mock('../../src/accessibility/AccessibilityManager');

describe('Seamless Gameplay Integration', () => {
  let gameSystem: GameIntegrationSystem;
  let mockGameContainer: HTMLElement;

  beforeEach(() => {
    // Create mock game container
    mockGameContainer = document.createElement('div');
    mockGameContainer.id = 'game-container';
    document.body.appendChild(mockGameContainer);
    
    gameSystem = new GameIntegrationSystem(mockGameContainer);
    
    // Setup comprehensive mock behaviors
    setupMockBehaviors();
  });

  afterEach(() => {
    if (mockGameContainer.parentElement) {
      mockGameContainer.parentElement.removeChild(mockGameContainer);
    }
    jest.clearAllMocks();
  });

  function setupMockBehaviors() {
    const systems = gameSystem.getSystemReferences();

    // Mock all system methods to prevent errors
    Object.values(systems).forEach(system => {
      if (system && typeof system === 'object') {
        // Add common mock methods
        if (!system.show) system.show = jest.fn();
        if (!system.hide) system.hide = jest.fn();
        if (!system.dispose) system.dispose = jest.fn();
        if (!system.shutdown) system.shutdown = jest.fn();
        if (!system.isHealthy) system.isHealthy = jest.fn().mockReturnValue(true);
        if (!system.enableSafeMode) system.enableSafeMode = jest.fn();
        if (!system.pauseSimulation) system.pauseSimulation = jest.fn();
        if (!system.resumeSimulation) system.resumeSimulation = jest.fn();
        if (!system.pauseAll) system.pauseAll = jest.fn();
        if (!system.resumeAll) system.resumeAll = jest.fn();
        if (!system.pauseMonitoring) system.pauseMonitoring = jest.fn();
        if (!system.resumeMonitoring) system.resumeMonitoring = jest.fn();
        if (!system.applyAccessibilitySettings) system.applyAccessibilitySettings = jest.fn();
      }
    });

    // Setup specific system behaviors
    systems.tutorialManager.shouldShowTutorialForMode = jest.fn().mockReturnValue(false);
    systems.tutorialManager.getTutorialForMode = jest.fn().mockReturnValue({ id: 'test-tutorial' });
    systems.tutorialManager.startTutorial = jest.fn().mockResolvedValue(undefined);
    systems.tutorialManager.pauseTutorial = jest.fn();
    systems.tutorialManager.getProgress = jest.fn().mockReturnValue({ completedTutorials: [] });
    systems.tutorialManager.getInitialProgress = jest.fn().mockReturnValue({ completedTutorials: [] });
    systems.tutorialManager.restoreProgress = jest.fn();
    systems.tutorialManager.isModeTutorialCompleted = jest.fn().mockReturnValue(false);

    systems.scenarioEngine.loadCurrentScenario = jest.fn().mockResolvedValue(undefined);
    systems.scenarioEngine.pauseScenario = jest.fn();
    systems.scenarioEngine.getProgress = jest.fn().mockReturnValue({ completedScenarios: [], unlockedScenarios: [] });
    systems.scenarioEngine.getInitialProgress = jest.fn().mockReturnValue({ completedScenarios: [], unlockedScenarios: [] });
    systems.scenarioEngine.restoreProgress = jest.fn();

    systems.deviceSimulator.addDevice = jest.fn();
    systems.deviceSimulator.placeDevice = jest.fn();
    systems.deviceSimulator.getAllDevices = jest.fn().mockReturnValue([]);
    systems.deviceSimulator.loadDevices = jest.fn();
    systems.deviceSimulator.getDeviceCount = jest.fn().mockReturnValue(0);

    systems.roomDesigner.getCurrentEnvironment = jest.fn().mockReturnValue({
      id: 'default',
      type: 'home',
      layout: {},
      devices: [],
      rules: []
    });
    systems.roomDesigner.getDefaultEnvironment = jest.fn().mockReturnValue({
      id: 'default',
      type: 'home',
      layout: {},
      devices: [],
      rules: []
    });
    systems.roomDesigner.loadEnvironment = jest.fn();
    systems.roomDesigner.handleDeviceDrag = jest.fn().mockReturnValue('success');
    systems.roomDesigner.handleRoomInteraction = jest.fn().mockReturnValue('empty_space');
    systems.roomDesigner.enableQuickAccess = jest.fn();

    systems.achievementSystem.getUnlockedAchievements = jest.fn().mockReturnValue([]);
    systems.achievementSystem.restoreAchievements = jest.fn();
    systems.achievementSystem.checkDeviceCreationAchievements = jest.fn();
    systems.achievementSystem.checkCrisisAchievements = jest.fn();
    systems.achievementSystem.checkStoryAchievements = jest.fn();
    systems.achievementSystem.checkScenarioAchievements = jest.fn();
    systems.achievementSystem.unlockTutorialAchievement = jest.fn();

    systems.accessibilityManager.getCurrentSettings = jest.fn().mockReturnValue({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      audioDescriptions: false,
      keyboardNavigation: false
    });
    systems.accessibilityManager.getDefaultSettings = jest.fn().mockReturnValue({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      audioDescriptions: false,
      keyboardNavigation: false
    });
    systems.accessibilityManager.applySettings = jest.fn();

    systems.gameHUD.handleUIClick = jest.fn().mockReturnValue('handled');
    systems.gameHUD.displayInteraction = jest.fn();
    systems.gameHUD.showCrisisAlert = jest.fn();
    systems.gameHUD.displayStoryMoment = jest.fn();
    systems.gameHUD.showTutorialStep = jest.fn();
    systems.gameHUD.showTutorialOverlay = jest.fn();
    systems.gameHUD.hideTutorialOverlay = jest.fn();
    systems.gameHUD.showScenarioUI = jest.fn();
    systems.gameHUD.showFreePlayUI = jest.fn();
    systems.gameHUD.showCrisisUI = jest.fn();
    systems.gameHUD.showMainMenu = jest.fn();
    systems.gameHUD.showTutorialPauseMenu = jest.fn();
    systems.gameHUD.showPauseMenu = jest.fn();
    systems.gameHUD.toggleHelp = jest.fn();

    systems.crisisManagementPanel.showCrisis = jest.fn();

    systems.gameRenderer.updateDevicePosition = jest.fn();
    systems.gameRenderer.updateEnvironment = jest.fn();
    systems.gameRenderer.onWindowResize = jest.fn();

    systems.inputManager.enableTutorialMode = jest.fn();
    systems.inputManager.setDeviceDragCallback = jest.fn();
    systems.inputManager.setRoomInteractionCallback = jest.fn();
    systems.inputManager.setUIClickCallback = jest.fn();

    systems.visualEffectsManager.showInteractionEffect = jest.fn();
    systems.visualEffectsManager.showCrisisEffect = jest.fn();
    systems.visualEffectsManager.showStoryEffect = jest.fn();

    systems.audioManager.playInteractionSound = jest.fn();
    systems.audioManager.playCrisisSound = jest.fn();
    systems.playStorySound = jest.fn();

    systems.analyticsManager.trackEvent = jest.fn();
  }

  describe('Complete Seamless Workflow', () => {
    test('should handle complete player journey with seamless transitions', async () => {
      // Start in main menu
      expect(gameSystem.getCurrentMode()).toBe(GameMode.MAIN_MENU);
      expect(gameSystem.areSystemsInitialized()).toBe(true);

      // Transition to tutorial
      await gameSystem.transitionToMode(GameMode.TUTORIAL);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.TUTORIAL);

      const systems = gameSystem.getSystemReferences();
      expect(systems.gameHUD.showTutorialOverlay).toHaveBeenCalled();

      // Complete tutorial and transition to device creation
      if (systems.tutorialManager.onTutorialComplete) {
        systems.tutorialManager.onTutorialComplete('basic-tutorial');
      }
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);

      // Transition to device creation
      await gameSystem.transitionToMode(GameMode.DEVICE_CREATION);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.DEVICE_CREATION);
      expect(systems.deviceCreationPanel.show).toHaveBeenCalled();

      // Create a device
      const testDevice = {
        id: 'test-device-1',
        name: 'Smart Light',
        type: DeviceCategory.COMFORT,
        personality: [PersonalityTrait.HELPFUL],
        position: { x: 0, y: 0, z: 0 },
        state: {
          active: true,
          resourceUsage: { energy: 10, bandwidth: 5, processing: 2, memory: 1 },
          connections: [],
          mood: 'happy' as any,
          learningProgress: 0
        }
      };

      if (systems.deviceCreationPanel.onDeviceCreated) {
        systems.deviceCreationPanel.onDeviceCreated(testDevice);
      }

      expect(systems.deviceSimulator.addDevice).toHaveBeenCalledWith(testDevice);
      expect(systems.analyticsManager.trackEvent).toHaveBeenCalledWith('device_created', expect.any(Object));

      // Transition to room design
      await gameSystem.transitionToMode(GameMode.ROOM_DESIGN);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.ROOM_DESIGN);
      expect(systems.roomDesigner.show).toHaveBeenCalled();

      // Place device in room
      if (systems.roomDesigner.onDevicePlaced) {
        systems.roomDesigner.onDevicePlaced(testDevice, { x: 2, y: 2 });
      }

      expect(systems.deviceSimulator.placeDevice).toHaveBeenCalledWith('test-device-1', { x: 2, y: 2 });
      expect(systems.gameRenderer.updateDevicePosition).toHaveBeenCalledWith('test-device-1', { x: 2, y: 2 });

      // Transition to free play
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);
      expect(systems.deviceSimulator.resumeSimulation).toHaveBeenCalled();

      // Simulate device interaction
      const interaction = {
        id: 'interaction-1',
        type: 'cooperation',
        devices: ['test-device-1'],
        description: 'Device is working normally',
        timestamp: Date.now(),
        outcome: 'success'
      };

      if (systems.deviceSimulator.onInteractionDetected) {
        systems.deviceSimulator.onInteractionDetected(interaction);
      }

      expect(systems.gameHUD.displayInteraction).toHaveBeenCalledWith(interaction);
      expect(systems.visualEffectsManager.showInteractionEffect).toHaveBeenCalledWith(interaction);

      // Simulate crisis
      const crisis = {
        id: 'test-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.8,
        involvedAgents: ['test-device-1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      if (systems.crisisSystem.onCrisisDetected) {
        systems.crisisSystem.onCrisisDetected(crisis);
      }

      expect(gameSystem.getCurrentMode()).toBe(GameMode.CRISIS_MANAGEMENT);
      expect(systems.crisisManagementPanel.showCrisis).toHaveBeenCalledWith(crisis);

      // Resolve crisis
      const resolution = { strategy: 'intervention', effectiveness: 0.9 };
      if (systems.crisisManagementPanel.onCrisisResolved) {
        systems.crisisManagementPanel.onCrisisResolved(crisis, resolution);
      }

      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);
      expect(systems.crisisSystem.resolveCrisis).toHaveBeenCalledWith(crisis.id, resolution);

      // Verify all transitions were seamless
      expect(gameSystem.isCurrentlyTransitioning()).toBe(false);
    });

    test('should maintain state consistency across all transitions', async () => {
      const systems = gameSystem.getSystemReferences();

      // Create initial state
      const initialState = gameSystem.getCurrentGameState();
      expect(initialState.mode).toBe(GameMode.MAIN_MENU);

      // Add some devices and change environment
      const testDevice = {
        id: 'state-test-device',
        name: 'State Test Device',
        type: DeviceCategory.SECURITY,
        personality: [PersonalityTrait.ANXIOUS]
      };

      await gameSystem.transitionToMode(GameMode.DEVICE_CREATION);
      if (systems.deviceCreationPanel.onDeviceCreated) {
        systems.deviceCreationPanel.onDeviceCreated(testDevice);
      }

      // Change environment
      const newEnvironment = {
        id: 'test-environment',
        type: 'office' as any,
        layout: { width: 15, height: 15 },
        devices: [testDevice],
        rules: []
      };

      if (systems.roomDesigner.onEnvironmentChanged) {
        systems.roomDesigner.onEnvironmentChanged(newEnvironment);
      }

      // Transition through multiple modes
      const modes = [GameMode.ROOM_DESIGN, GameMode.FREE_PLAY, GameMode.SCENARIO];
      for (const mode of modes) {
        await gameSystem.transitionToMode(mode);
        const currentState = gameSystem.getCurrentGameState();
        expect(currentState.mode).toBe(mode);
        expect(currentState.timestamp).toBeGreaterThan(initialState.timestamp);
      }

      // Verify state consistency
      const finalState = gameSystem.getCurrentGameState();
      expect(finalState.environment.id).toBe('test-environment');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle system errors gracefully during transitions', async () => {
      const systems = gameSystem.getSystemReferences();

      // Mock a system failure
      systems.deviceSimulator.resumeSimulation = jest.fn().mockImplementationOnce(() => {
        throw new Error('Simulation system failure');
      });

      // Attempt transition that should fail
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);

      // System should remain stable
      expect(gameSystem.getCurrentMode()).toBeDefined();
      expect(gameSystem.isCurrentlyTransitioning()).toBe(false);
    });

    test('should recover from unhealthy systems', async () => {
      const systems = gameSystem.getSystemReferences();

      // Mock unhealthy systems
      systems.deviceSimulator.isHealthy = jest.fn().mockReturnValue(false);
      systems.gameRenderer.isHealthy = jest.fn().mockReturnValue(false);

      // Perform health check
      await gameSystem.performHealthCheck();

      // Verify recovery attempts
      expect(systems.deviceSimulator.enableSafeMode).toHaveBeenCalled();
    });

    test('should handle save/load errors gracefully', async () => {
      const systems = gameSystem.getSystemReferences();

      // Mock save error
      const mockSaveManager = systems.saveManager as any;
      mockSaveManager.saveGameState = jest.fn().mockRejectedValue(new Error('Save failed'));

      // Attempt save
      await gameSystem.saveCurrentGame();

      // System should remain stable
      expect(gameSystem.getCurrentMode()).toBeDefined();
    });
  });

  describe('Accessibility Integration', () => {
    test('should apply accessibility settings across all systems', async () => {
      const systems = gameSystem.getSystemReferences();

      const accessibilitySettings = {
        highContrast: true,
        largeText: true,
        reducedMotion: true,
        audioDescriptions: true,
        keyboardNavigation: true
      };

      // Apply settings
      if (systems.accessibilityManager.onSettingsChanged) {
        systems.accessibilityManager.onSettingsChanged(accessibilitySettings);
      }

      // Verify settings applied to all systems
      expect(systems.gameHUD.applyAccessibilitySettings).toHaveBeenCalledWith(accessibilitySettings);
      expect(systems.gameRenderer.applyAccessibilitySettings).toHaveBeenCalledWith(accessibilitySettings);
      expect(systems.audioManager.applyAccessibilitySettings).toHaveBeenCalledWith(accessibilitySettings);

      // Verify settings persist across mode transitions
      await gameSystem.transitionToMode(GameMode.TUTORIAL);
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);

      const currentState = gameSystem.getCurrentGameState();
      expect(currentState.settings).toEqual(accessibilitySettings);
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle resource cleanup during mode transitions', async () => {
      const systems = gameSystem.getSystemReferences();

      // Transition through multiple modes rapidly
      const modes = [
        GameMode.TUTORIAL,
        GameMode.DEVICE_CREATION,
        GameMode.ROOM_DESIGN,
        GameMode.FREE_PLAY,
        GameMode.SCENARIO
      ];

      for (const mode of modes) {
        await gameSystem.transitionToMode(mode);
        expect(gameSystem.getCurrentMode()).toBe(mode);
      }

      // Verify cleanup was called for each transition
      expect(systems.tutorialManager.pauseTutorial).toHaveBeenCalled();
      expect(systems.deviceCreationPanel.hide).toHaveBeenCalled();
      expect(systems.roomDesigner.hide).toHaveBeenCalled();
      expect(systems.deviceSimulator.pauseSimulation).toHaveBeenCalled();
    });

    test('should handle tab visibility changes', async () => {
      const systems = gameSystem.getSystemReferences();

      await gameSystem.transitionToMode(GameMode.FREE_PLAY);

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(systems.deviceSimulator.pauseSimulation).toHaveBeenCalled();
      expect(systems.audioManager.pauseAll).toHaveBeenCalled();

      // Simulate tab becoming visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(systems.deviceSimulator.resumeSimulation).toHaveBeenCalled();
      expect(systems.audioManager.resumeAll).toHaveBeenCalled();
    });

    test('should shutdown gracefully', async () => {
      const systems = gameSystem.getSystemReferences();

      await gameSystem.shutdown();

      // Verify all systems were shut down
      expect(systems.deviceSimulator.shutdown).toHaveBeenCalled();
      expect(systems.gameRenderer.dispose).toHaveBeenCalled();
      expect(systems.inputManager.dispose).toHaveBeenCalled();
      expect(systems.audioManager.dispose).toHaveBeenCalled();
    });
  });

  describe('Analytics and Learning Integration', () => {
    test('should track all major gameplay events', async () => {
      const systems = gameSystem.getSystemReferences();

      // Device creation
      const testDevice = {
        id: 'analytics-device',
        type: DeviceCategory.COMFORT,
        personality: [PersonalityTrait.HELPFUL]
      };

      if (systems.deviceCreationPanel.onDeviceCreated) {
        systems.deviceCreationPanel.onDeviceCreated(testDevice);
      }

      expect(systems.analyticsManager.trackEvent).toHaveBeenCalledWith('device_created', expect.any(Object));

      // Device interaction
      const interaction = {
        id: 'analytics-interaction',
        type: 'cooperation',
        devices: ['analytics-device']
      };

      if (systems.deviceSimulator.onInteractionDetected) {
        systems.deviceSimulator.onInteractionDetected(interaction);
      }

      expect(systems.analyticsManager.trackEvent).toHaveBeenCalledWith('device_interaction', expect.any(Object));

      // Crisis detection
      const crisis = {
        id: 'analytics-crisis',
        type: CrisisType.AUTHORITY_CONFLICT,
        severity: 0.7
      };

      if (systems.crisisSystem.onCrisisDetected) {
        systems.crisisSystem.onCrisisDetected(crisis);
      }

      expect(systems.analyticsManager.trackEvent).toHaveBeenCalledWith('crisis_detected', expect.any(Object));

      // Story moment
      const storyMoment = {
        id: 'analytics-story',
        title: 'Test Story',
        educationalValue: 'Test learning'
      };

      if (systems.storySystem.onStoryMoment) {
        systems.storySystem.onStoryMoment(storyMoment);
      }

      expect(systems.analyticsManager.trackEvent).toHaveBeenCalledWith('story_moment', expect.any(Object));
    });
  });
});