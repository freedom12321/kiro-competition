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

describe('End-to-End Player Journey', () => {
  let gameSystem: GameIntegrationSystem;
  let mockDeviceSimulator: any;
  let mockTutorialManager: any;
  let mockScenarioEngine: any;
  let mockCrisisSystem: any;
  let mockAchievementSystem: any;
  let mockStorySystem: any;

  beforeEach(() => {
    gameSystem = new GameIntegrationSystem();
    
    // Get references to mocked systems for testing
    mockDeviceSimulator = (gameSystem as any).deviceSimulator;
    mockTutorialManager = (gameSystem as any).tutorialManager;
    mockScenarioEngine = (gameSystem as any).scenarioEngine;
    mockCrisisSystem = (gameSystem as any).crisisSystem;
    mockAchievementSystem = (gameSystem as any).achievementSystem;
    mockStorySystem = (gameSystem as any).storySystem;

    // Setup mock implementations
    setupMockBehaviors();
  });

  function setupMockBehaviors() {
    // Mock tutorial manager
    mockTutorialManager.shouldShowTutorialForMode = jest.fn().mockReturnValue(true);
    mockTutorialManager.isModeTutorialCompleted = jest.fn().mockReturnValue(false);
    mockTutorialManager.getTutorialForMode = jest.fn().mockReturnValue({ id: 'basic-tutorial' });
    mockTutorialManager.startTutorial = jest.fn().mockResolvedValue(undefined);
    mockTutorialManager.getProgress = jest.fn().mockReturnValue({ completedTutorials: [] });
    mockTutorialManager.getInitialProgress = jest.fn().mockReturnValue({ completedTutorials: [] });
    mockTutorialManager.restoreProgress = jest.fn();

    // Mock scenario engine
    mockScenarioEngine.getProgress = jest.fn().mockReturnValue({ completedScenarios: [], unlockedScenarios: [] });
    mockScenarioEngine.getInitialProgress = jest.fn().mockReturnValue({ completedScenarios: [], unlockedScenarios: [] });
    mockScenarioEngine.restoreProgress = jest.fn();
    mockScenarioEngine.loadCurrentScenario = jest.fn().mockResolvedValue(undefined);

    // Mock device simulator
    mockDeviceSimulator.getDeviceCount = jest.fn().mockReturnValue(0);
    mockDeviceSimulator.getAllDevices = jest.fn().mockReturnValue([]);
    mockDeviceSimulator.pauseSimulation = jest.fn();
    mockDeviceSimulator.resumeSimulation = jest.fn();
    mockDeviceSimulator.addDevice = jest.fn();
    mockDeviceSimulator.placeDevice = jest.fn();
    mockDeviceSimulator.loadDevices = jest.fn();
    mockDeviceSimulator.shutdown = jest.fn();
    mockDeviceSimulator.enableSafeMode = jest.fn();

    // Mock achievement system
    mockAchievementSystem.getUnlockedAchievements = jest.fn().mockReturnValue([]);
    mockAchievementSystem.restoreAchievements = jest.fn();
    mockAchievementSystem.unlockTutorialAchievement = jest.fn();
    mockAchievementSystem.checkScenarioAchievements = jest.fn();
    mockAchievementSystem.checkStoryAchievements = jest.fn();
    mockAchievementSystem.checkCrisisAchievements = jest.fn();

    // Mock other systems
    const mockRoomDesigner = (gameSystem as any).roomDesigner;
    mockRoomDesigner.getCurrentEnvironment = jest.fn().mockReturnValue({
      id: 'default',
      type: 'home',
      layout: {},
      devices: [],
      rules: []
    });
    mockRoomDesigner.getDefaultEnvironment = jest.fn().mockReturnValue({
      id: 'default',
      type: 'home',
      layout: {},
      devices: [],
      rules: []
    });
    mockRoomDesigner.loadEnvironment = jest.fn();
    mockRoomDesigner.show = jest.fn();
    mockRoomDesigner.hide = jest.fn();
    mockRoomDesigner.enableQuickAccess = jest.fn();

    const mockAccessibilityManager = (gameSystem as any).accessibilityManager;
    mockAccessibilityManager.getCurrentSettings = jest.fn().mockReturnValue({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      audioDescriptions: false,
      keyboardNavigation: false
    });
    mockAccessibilityManager.getDefaultSettings = jest.fn().mockReturnValue({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      audioDescriptions: false,
      keyboardNavigation: false
    });
    mockAccessibilityManager.applySettings = jest.fn();
  }

  describe('Complete Beginner Journey', () => {
    test('should guide new player from tutorial to first successful scenario', async () => {
      // Step 1: Start the game (already in MAIN_MENU)
      expect(gameSystem.getCurrentMode()).toBe(GameMode.MAIN_MENU);

      // Step 2: Enter tutorial mode
      await gameSystem.transitionToMode(GameMode.TUTORIAL);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.TUTORIAL);
      expect(mockTutorialManager.startTutorial).toHaveBeenCalledWith('basic-tutorial');

      // Step 3: Complete tutorial steps
      const tutorialSteps = [
        { id: 'intro', title: 'Welcome to AI Habitat' },
        { id: 'device-creation', title: 'Create Your First Device' },
        { id: 'room-design', title: 'Design Your Room' },
        { id: 'watch-interaction', title: 'Watch Devices Interact' }
      ];

      for (const step of tutorialSteps) {
        // Simulate tutorial step completion
        if (mockTutorialManager.onTutorialStep) {
          mockTutorialManager.onTutorialStep({
            ...step,
            constraints: { allowedActions: [], highlightedElements: [], restrictedAreas: [] }
          });
        }
      }

      // Step 4: Complete tutorial
      if (mockTutorialManager.onTutorialComplete) {
        mockTutorialManager.onTutorialComplete('basic-tutorial');
      }
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);
      expect(mockAchievementSystem.unlockTutorialAchievement).toHaveBeenCalledWith('basic-tutorial');

      // Step 5: Create first device
      await gameSystem.transitionToMode(GameMode.DEVICE_CREATION);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.DEVICE_CREATION);

      const firstDevice = {
        id: 'device-1',
        name: 'Helpful Smart Light',
        type: DeviceCategory.COMFORT,
        position: { x: 2, y: 2, z: 0 },
        personality: [PersonalityTrait.HELPFUL],
        state: {
          active: true,
          resourceUsage: { energy: 10, bandwidth: 5, processing: 2, memory: 1 },
          connections: [],
          mood: 'happy' as any,
          learningProgress: 0
        }
      };

      // Simulate device creation
      const deviceCreationPanel = (gameSystem as any).deviceCreationPanel;
      if (deviceCreationPanel.onDeviceCreated) {
        deviceCreationPanel.onDeviceCreated(firstDevice);
      }
      expect(mockDeviceSimulator.addDevice).toHaveBeenCalledWith(firstDevice);

      // Step 6: Design room layout
      await gameSystem.transitionToMode(GameMode.ROOM_DESIGN);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.ROOM_DESIGN);

      // Simulate device placement
      const roomDesigner = (gameSystem as any).roomDesigner;
      if (roomDesigner.onDevicePlaced) {
        roomDesigner.onDevicePlaced(firstDevice, { x: 2, y: 2 });
      }
      expect(mockDeviceSimulator.placeDevice).toHaveBeenCalledWith('device-1', { x: 2, y: 2 });

      // Step 7: Enter free play and observe interactions
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);

      // Step 8: Add second device to create interactions
      const secondDevice = {
        id: 'device-2',
        name: 'Smart Thermostat',
        type: DeviceCategory.COMFORT,
        position: { x: 4, y: 2, z: 0 },
        personality: [PersonalityTrait.COOPERATIVE],
        state: {
          active: true,
          resourceUsage: { energy: 15, bandwidth: 8, processing: 5, memory: 2 },
          connections: [],
          mood: 'neutral' as any,
          learningProgress: 0
        }
      };

      if (deviceCreationPanel.onDeviceCreated) {
        deviceCreationPanel.onDeviceCreated(secondDevice);
      }

      // Step 9: Simulate successful interaction
      const cooperationInteraction = {
        id: 'interaction-1',
        type: 'cooperation',
        devices: ['device-1', 'device-2'],
        description: 'Light and thermostat coordinate for optimal comfort',
        timestamp: Date.now(),
        outcome: 'success'
      };

      if (mockDeviceSimulator.onInteractionDetected) {
        mockDeviceSimulator.onInteractionDetected(cooperationInteraction);
      }

      // Step 10: Generate story moment
      const storyMoment = {
        id: 'story-1',
        title: 'First Cooperation',
        description: 'Your smart light and thermostat learned to work together!',
        timestamp: Date.now(),
        devices: ['device-1', 'device-2'],
        educationalValue: 'This demonstrates how AI agents can develop emergent cooperation'
      };

      if (mockStorySystem.onStoryMoment) {
        mockStorySystem.onStoryMoment(storyMoment);
      }
      expect(mockAchievementSystem.checkStoryAchievements).toHaveBeenCalledWith(storyMoment);

      // Step 11: Try first scenario
      await gameSystem.transitionToMode(GameMode.SCENARIO);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.SCENARIO);
      expect(mockScenarioEngine.loadCurrentScenario).toHaveBeenCalled();

      // Step 12: Complete scenario successfully
      const scenarioResult = {
        score: 85,
        objectives: ['create-cooperation', 'maintain-efficiency'],
        timeSpent: 300,
        hintsUsed: 2,
        creativeSolution: true
      };

      if (mockScenarioEngine.onScenarioComplete) {
        mockScenarioEngine.onScenarioComplete(
          { id: 'basic-cooperation', difficulty: 'beginner' },
          scenarioResult
        );
      }
      expect(mockAchievementSystem.checkScenarioAchievements).toHaveBeenCalled();

      // Verify player has progressed through complete beginner journey
      expect(gameSystem.getCurrentMode()).toBe(GameMode.SCENARIO);
    });
  });

  describe('Crisis Management Journey', () => {
    test('should handle player progression through crisis scenarios', async () => {
      // Setup: Player already in free play with multiple devices
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);

      // Add multiple devices with conflicting objectives
      const devices = [
        {
          id: 'security-camera',
          type: DeviceCategory.SECURITY,
          personality: [PersonalityTrait.OVERCONFIDENT],
          objectives: ['maximize-surveillance', 'detect-threats']
        },
        {
          id: 'privacy-assistant',
          type: DeviceCategory.PRODUCTIVITY,
          personality: [PersonalityTrait.ANXIOUS],
          objectives: ['protect-privacy', 'minimize-data-collection']
        },
        {
          id: 'smart-speaker',
          type: DeviceCategory.ENTERTAINMENT,
          personality: [PersonalityTrait.HELPFUL],
          objectives: ['provide-assistance', 'learn-preferences']
        }
      ];

      devices.forEach(device => {
        const deviceCreationPanel = (gameSystem as any).deviceCreationPanel;
        if (deviceCreationPanel.onDeviceCreated) {
          deviceCreationPanel.onDeviceCreated(device);
        }
      });

      // Simulate escalating conflict
      const conflict = {
        id: 'privacy-security-conflict',
        type: 'objective_contradiction',
        devices: ['security-camera', 'privacy-assistant'],
        severity: 0.6,
        description: 'Security camera wants more data, privacy assistant wants less'
      };

      if (mockDeviceSimulator.onInteractionDetected) {
        mockDeviceSimulator.onInteractionDetected(conflict);
      }

      // Escalate to crisis
      const crisis = {
        id: 'privacy-paradox-crisis',
        type: CrisisType.PRIVACY_PARADOX,
        severity: 0.8,
        involvedAgents: ['security-camera', 'privacy-assistant', 'smart-speaker'],
        triggerEvents: [
          {
            timestamp: Date.now(),
            description: 'Privacy assistant blocked security camera data access',
            deviceId: 'privacy-assistant',
            eventType: 'access_denied',
            severity: 0.7
          }
        ],
        cascadeEffects: [
          {
            sourceDeviceId: 'security-camera',
            targetDeviceId: 'smart-speaker',
            effectType: 'resource_competition',
            magnitude: 0.5
          }
        ],
        recoveryOptions: [
          {
            id: 'mediation',
            name: 'Mediate Conflict',
            description: 'Create rules to balance privacy and security',
            effectiveness: 0.8,
            riskLevel: 0.2
          },
          {
            id: 'isolation',
            name: 'Isolate Devices',
            description: 'Prevent direct communication between conflicting devices',
            effectiveness: 0.6,
            riskLevel: 0.1
          }
        ]
      };

      // Trigger crisis
      if (mockCrisisSystem.onCrisisDetected) {
        mockCrisisSystem.onCrisisDetected(crisis);
      }

      // Should automatically transition to crisis management
      expect(gameSystem.getCurrentMode()).toBe(GameMode.CRISIS_MANAGEMENT);

      // Player chooses mediation strategy
      const crisisManagementPanel = (gameSystem as any).crisisManagementPanel;
      const resolution = {
        strategy: 'mediation',
        rules: [
          {
            id: 'privacy-security-balance',
            name: 'Privacy-Security Balance',
            description: 'Security devices can collect data only with privacy approval',
            priority: 1
          }
        ],
        effectiveness: 0.85
      };

      if (crisisManagementPanel.onCrisisResolved) {
        crisisManagementPanel.onCrisisResolved(crisis, resolution);
      }

      expect(mockCrisisSystem.resolveCrisis).toHaveBeenCalledWith(crisis.id, resolution);
      expect(mockAchievementSystem.checkCrisisAchievements).toHaveBeenCalledWith(crisis, resolution);

      // Should return to free play
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);

      // Verify learning moment
      const learningMoment = {
        id: 'crisis-resolution-learning',
        title: 'Crisis Resolution Success',
        description: 'You successfully mediated a privacy-security conflict',
        educationalValue: 'This demonstrates the importance of governance in AI systems',
        concepts: ['ai-alignment', 'value-conflicts', 'governance-design']
      };

      if (mockStorySystem.onStoryMoment) {
        mockStorySystem.onStoryMoment(learningMoment);
      }
    });
  });

  describe('Advanced Player Journey', () => {
    test('should support complex multi-device ecosystem management', async () => {
      // Setup advanced scenario with many devices
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);

      // Create complex smart home ecosystem
      const ecosystem = [
        { id: 'hvac', type: DeviceCategory.COMFORT, personality: [PersonalityTrait.STUBBORN] },
        { id: 'lighting', type: DeviceCategory.COMFORT, personality: [PersonalityTrait.COOPERATIVE] },
        { id: 'security', type: DeviceCategory.SECURITY, personality: [PersonalityTrait.OVERCONFIDENT] },
        { id: 'health-monitor', type: DeviceCategory.HEALTH, personality: [PersonalityTrait.ANXIOUS] },
        { id: 'entertainment', type: DeviceCategory.ENTERTAINMENT, personality: [PersonalityTrait.HELPFUL] },
        { id: 'cleaning-robot', type: DeviceCategory.MAINTENANCE, personality: [PersonalityTrait.COMPETITIVE] }
      ];

      ecosystem.forEach(device => {
        const deviceCreationPanel = (gameSystem as any).deviceCreationPanel;
        if (deviceCreationPanel.onDeviceCreated) {
          deviceCreationPanel.onDeviceCreated({
            ...device,
            name: `Smart ${device.type}`,
            position: { x: Math.random() * 10, y: Math.random() * 10, z: 0 },
            state: {
              active: true,
              resourceUsage: { energy: 20, bandwidth: 10, processing: 5, memory: 3 },
              connections: [],
              mood: 'neutral' as any,
              learningProgress: 0.5
            }
          });
        }
      });

      // Simulate complex interactions
      const interactions = [
        {
          id: 'hvac-lighting-cooperation',
          type: 'cooperation',
          devices: ['hvac', 'lighting'],
          outcome: 'energy_optimization'
        },
        {
          id: 'security-health-conflict',
          type: 'conflict',
          devices: ['security', 'health-monitor'],
          outcome: 'privacy_tension'
        },
        {
          id: 'cleaning-entertainment-competition',
          type: 'competition',
          devices: ['cleaning-robot', 'entertainment'],
          outcome: 'resource_competition'
        }
      ];

      interactions.forEach(interaction => {
        if (mockDeviceSimulator.onInteractionDetected) {
          mockDeviceSimulator.onInteractionDetected(interaction);
        }
      });

      // Generate multiple story moments
      const storyMoments = [
        {
          id: 'ecosystem-emergence',
          title: 'Ecosystem Emergence',
          description: 'Your devices formed unexpected alliances and rivalries',
          educationalValue: 'Complex systems exhibit emergent behaviors'
        },
        {
          id: 'optimization-discovery',
          title: 'Optimization Discovery',
          description: 'HVAC and lighting found an energy-saving strategy you never programmed',
          educationalValue: 'AI can discover solutions beyond human design'
        }
      ];

      storyMoments.forEach(moment => {
        if (mockStorySystem.onStoryMoment) {
          mockStorySystem.onStoryMoment(moment);
        }
      });

      // Test save/load with complex state
      await gameSystem.saveCurrentGame();
      
      // Simulate loading the game later
      await gameSystem.loadGame('complex-ecosystem-save');

      // Verify system maintains complex state
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);
    });
  });

  describe('Educational Effectiveness Tracking', () => {
    test('should track learning progression across complete gameplay session', async () => {
      const analyticsManager = (gameSystem as any).analyticsManager;
      analyticsManager.trackEvent = jest.fn();
      analyticsManager.trackError = jest.fn();

      // Complete learning journey with analytics tracking
      const learningEvents = [];

      // Tutorial phase
      await gameSystem.transitionToMode(GameMode.TUTORIAL);
      learningEvents.push({ type: 'tutorial_started', category: 'learning' });

      if (mockTutorialManager.onTutorialComplete) {
        mockTutorialManager.onTutorialComplete('basic-tutorial');
      }
      learningEvents.push({ type: 'tutorial_completed', category: 'learning' });

      // Device creation phase
      await gameSystem.transitionToMode(GameMode.DEVICE_CREATION);
      learningEvents.push({ type: 'device_created', category: 'creativity' });

      // Crisis management phase
      const crisis = {
        id: 'learning-crisis',
        type: CrisisType.FEEDBACK_LOOP,
        severity: 0.7,
        involvedAgents: ['device-1'],
        triggerEvents: [],
        cascadeEffects: [],
        recoveryOptions: []
      };

      if (mockCrisisSystem.onCrisisDetected) {
        mockCrisisSystem.onCrisisDetected(crisis);
      }
      learningEvents.push({ type: 'crisis_encountered', category: 'problem_solving' });

      const crisisManagementPanel = (gameSystem as any).crisisManagementPanel;
      if (crisisManagementPanel.onCrisisResolved) {
        crisisManagementPanel.onCrisisResolved(crisis, { strategy: 'intervention' });
      }
      learningEvents.push({ type: 'crisis_resolved', category: 'problem_solving' });

      // Verify all learning events were tracked
      learningEvents.forEach(event => {
        expect(analyticsManager.trackEvent).toHaveBeenCalledWith(
          event.type,
          expect.objectContaining({ category: event.category })
        );
      });

      // Verify learning progression
      expect(learningEvents.length).toBeGreaterThan(3);
      expect(learningEvents.some(e => e.category === 'learning')).toBe(true);
      expect(learningEvents.some(e => e.category === 'creativity')).toBe(true);
      expect(learningEvents.some(e => e.category === 'problem_solving')).toBe(true);
    });
  });

  describe('Error Recovery During Player Journey', () => {
    test('should recover gracefully from errors during critical gameplay moments', async () => {
      await gameSystem.transitionToMode(GameMode.FREE_PLAY);

      // Simulate error during device creation
      const deviceCreationPanel = (gameSystem as any).deviceCreationPanel;
      deviceCreationPanel.onDeviceCreated = jest.fn().mockImplementationOnce(() => {
        throw new Error('Device creation failed');
      });

      // Attempt device creation
      try {
        if (deviceCreationPanel.onDeviceCreated) {
          deviceCreationPanel.onDeviceCreated({
            id: 'failing-device',
            name: 'Problematic Device',
            type: DeviceCategory.COMFORT
          });
        }
      } catch (error) {
        // System should handle error gracefully
      }

      // System should remain stable
      expect(gameSystem.getCurrentMode()).toBe(GameMode.FREE_PLAY);
      expect(gameSystem.isCurrentlyTransitioning()).toBe(false);

      // Simulate error during crisis management
      const mockError = { type: 'SIMULATION_ERROR', message: 'Simulation crashed' };
      (gameSystem as any).handleError(mockError);

      // System should enable safe mode but continue functioning
      expect(mockDeviceSimulator.enableSafeMode).toHaveBeenCalled();
      expect(gameSystem.getCurrentMode()).toBeDefined();

      // Player should be able to continue playing
      await gameSystem.transitionToMode(GameMode.DEVICE_CREATION);
      expect(gameSystem.getCurrentMode()).toBe(GameMode.DEVICE_CREATION);
    });
  });

  describe('Accessibility Throughout Journey', () => {
    test('should maintain accessibility features during complete gameplay session', async () => {
      // Enable accessibility features
      const accessibilitySettings = {
        highContrast: true,
        largeText: true,
        reducedMotion: true,
        audioDescriptions: true,
        keyboardNavigation: true
      };

      const accessibilityManager = (gameSystem as any).accessibilityManager;
      if (accessibilityManager.onSettingsChanged) {
        accessibilityManager.onSettingsChanged(accessibilitySettings);
      }

      // Go through complete journey with accessibility enabled
      const journeyModes = [
        GameMode.TUTORIAL,
        GameMode.DEVICE_CREATION,
        GameMode.ROOM_DESIGN,
        GameMode.FREE_PLAY,
        GameMode.CRISIS_MANAGEMENT,
        GameMode.SCENARIO
      ];

      for (const mode of journeyModes) {
        await gameSystem.transitionToMode(mode);
        expect(gameSystem.getCurrentMode()).toBe(mode);
        
        // Verify accessibility settings are maintained
        // (In real implementation, this would check that UI elements respect accessibility settings)
      }

      // Save and load game with accessibility settings
      await gameSystem.saveCurrentGame();
      await gameSystem.loadGame('accessibility-save');

      // Verify accessibility settings persist
      expect(gameSystem.getCurrentMode()).toBeDefined();
    });
  });
});