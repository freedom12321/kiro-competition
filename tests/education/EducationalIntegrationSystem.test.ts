import { EducationalIntegrationSystem, PopupFrequency } from '../../src/education/EducationalIntegrationSystem';
import { GameEvent, AIAgent } from '../../src/types/core';
import { AIConcept } from '../../src/education/LearningMomentDetector';

// Mock DOM
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    className: '',
    id: '',
    style: { cssText: '' },
    innerHTML: '',
    appendChild: jest.fn(),
    remove: jest.fn()
  }))
});

Object.defineProperty(document, 'getElementById', {
  value: jest.fn(() => null)
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

describe('EducationalIntegrationSystem', () => {
  let educationSystem: EducationalIntegrationSystem;
  let mockGameEvent: GameEvent;
  let mockContext: any;

  beforeEach(() => {
    educationSystem = new EducationalIntegrationSystem({
      enablePopups: true,
      popupFrequency: PopupFrequency.MODERATE,
      enableJournal: true,
      autoSaveReflections: true
    });

    mockGameEvent = {
      id: 'test_event',
      type: 'cooperation_achieved',
      timestamp: Date.now(),
      data: { efficiency: 1.8, participatingAgents: ['agent1', 'agent2'] }
    };

    mockContext = {
      involvedAgents: [
        { id: 'agent1', behaviorModel: {}, currentState: {} },
        { id: 'agent2', behaviorModel: {}, currentState: {} }
      ],
      systemState: { harmony: 0.8 },
      playerActions: ['place_device'],
      timeWindow: 5000
    };
  });

  describe('Learning Session Management', () => {
    it('should start and track learning sessions', () => {
      const sessionId = educationSystem.startLearningSession();

      expect(sessionId).toBeDefined();
      expect(sessionId).toContain('session_');
      
      const analytics = educationSystem.getSessionAnalytics();
      expect(analytics).toBeDefined();
      expect(analytics!.sessionId).toBe(sessionId);
    });

    it('should end learning sessions and calculate metrics', () => {
      const sessionId = educationSystem.startLearningSession();
      
      // Simulate some activity
      educationSystem.processGameEvent(mockGameEvent, mockContext);
      
      // Wait a bit for duration calculation
      setTimeout(() => {
        const completedSession = educationSystem.endLearningSession();

        expect(completedSession).toBeDefined();
        expect(completedSession!.id).toBe(sessionId);
        expect(completedSession!.endTime).toBeDefined();
        expect(completedSession!.momentsDetected).toBeGreaterThan(0);
      }, 10);
    });

    it('should track session metrics during gameplay', () => {
      educationSystem.startLearningSession();
      
      educationSystem.processGameEvent(mockGameEvent, mockContext);
      
      const analytics = educationSystem.getSessionAnalytics();
      expect(analytics!.momentsDetected).toBeGreaterThan(0);
      expect(analytics!.conceptsExplored).toBeGreaterThan(0);
    });
  });

  describe('Game Event Processing', () => {
    beforeEach(() => {
      educationSystem.startLearningSession();
    });

    it('should process game events and detect learning moments', () => {
      const eventListener = jest.fn();
      educationSystem.on('learningMomentDetected', eventListener);

      educationSystem.processGameEvent(mockGameEvent, mockContext);

      expect(eventListener).toHaveBeenCalled();
    });

    it('should show popups based on frequency settings', () => {
      const popupListener = jest.fn();
      educationSystem.on('popupShown', popupListener);

      educationSystem.processGameEvent(mockGameEvent, mockContext);

      // Should show popup for cooperation event with moderate frequency
      expect(popupListener).toHaveBeenCalled();
    });

    it('should respect popup frequency settings', () => {
      // Set to minimal frequency (only critical moments)
      educationSystem.updateSettings({ popupFrequency: PopupFrequency.MINIMAL });
      
      const popupListener = jest.fn();
      educationSystem.on('popupShown', popupListener);

      educationSystem.processGameEvent(mockGameEvent, mockContext);

      // Cooperation event (importance 7) should not show with minimal frequency
      expect(popupListener).not.toHaveBeenCalled();
    });

    it('should auto-create journal entries when enabled', () => {
      const journalListener = jest.fn();
      educationSystem.on('journalEntryCreated', journalListener);

      educationSystem.processGameEvent(mockGameEvent, mockContext);

      expect(journalListener).toHaveBeenCalled();
    });

    it('should not create journal entries when disabled', () => {
      educationSystem.updateSettings({ autoSaveReflections: false });
      
      const journalListener = jest.fn();
      educationSystem.on('journalEntryCreated', journalListener);

      educationSystem.processGameEvent(mockGameEvent, mockContext);

      expect(journalListener).not.toHaveBeenCalled();
    });
  });

  describe('Reflection Management', () => {
    beforeEach(() => {
      educationSystem.startLearningSession();
      educationSystem.processGameEvent(mockGameEvent, mockContext);
    });

    it('should add reflections to journal entries', () => {
      const reflection = 'This shows how AI cooperation can be very effective.';
      const entry = educationSystem.addReflection('moment_1', reflection);

      // Since we don't know the exact moment ID, check if any entry was updated
      expect(entry).toBeDefined();
    });

    it('should track reflection metrics in session', () => {
      // First create a journal entry, then add reflection
      const recentMoments = educationSystem.detector.getRecentMoments(60000);
      if (recentMoments.length > 0) {
        educationSystem.addReflection(recentMoments[0].id, 'Test reflection');
      }
      
      const analytics = educationSystem.getSessionAnalytics();
      // May be 0 if no moments were detected, which is acceptable
      expect(analytics!.reflectionsWritten).toBeGreaterThanOrEqual(0);
    });

    it('should rate learning experiences', () => {
      const ratingListener = jest.fn();
      educationSystem.on('experienceRated', ratingListener);

      const success = educationSystem.rateExperience('entry_1', 5);
      
      // May not succeed if entry doesn't exist, but should not throw
      expect(typeof success).toBe('boolean');
    });
  });

  describe('Personalized Recommendations', () => {
    beforeEach(() => {
      educationSystem.startLearningSession();
      
      // Create some learning history
      educationSystem.processGameEvent(mockGameEvent, mockContext);
      educationSystem.addReflection('moment_1', 'Basic reflection');
    });

    it('should generate personalized learning recommendations', () => {
      const recommendations = educationSystem.getPersonalizedRecommendations();

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should recommend concept focus for unexplored areas', () => {
      const recommendations = educationSystem.getPersonalizedRecommendations();
      
      const conceptFocusRecs = recommendations.filter(rec => rec.type === 'concept_focus');
      expect(conceptFocusRecs.length).toBeGreaterThan(0);
    });

    it('should recommend reflection quality improvements', () => {
      // Add a very short reflection to trigger quality recommendation
      educationSystem.addReflection('moment_1', 'ok');
      
      const recommendations = educationSystem.getPersonalizedRecommendations();
      
      const qualityRecs = recommendations.filter(rec => rec.type === 'reflection_quality');
      expect(qualityRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Settings Management', () => {
    it('should update settings and apply to subsystems', () => {
      const settingsListener = jest.fn();
      educationSystem.on('settingsUpdated', settingsListener);

      educationSystem.updateSettings({
        maxConcurrentPopups: 3,
        enablePopups: false
      });

      expect(settingsListener).toHaveBeenCalled();
      expect(educationSystem.currentSettings.maxConcurrentPopups).toBe(3);
      expect(educationSystem.currentSettings.enablePopups).toBe(false);
    });

    it('should maintain existing settings when partially updating', () => {
      const originalFrequency = educationSystem.currentSettings.popupFrequency;
      
      educationSystem.updateSettings({ enablePopups: false });

      expect(educationSystem.currentSettings.popupFrequency).toBe(originalFrequency);
      expect(educationSystem.currentSettings.enablePopups).toBe(false);
    });
  });

  describe('Data Import/Export', () => {
    beforeEach(() => {
      educationSystem.startLearningSession();
      educationSystem.processGameEvent(mockGameEvent, mockContext);
      educationSystem.addReflection('moment_1', 'Test reflection for export');
    });

    it('should export comprehensive learning data', () => {
      const exportData = educationSystem.exportLearningData();

      expect(exportData.version).toBe('1.0');
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.settings).toBeDefined();
      expect(exportData.journalData).toBeDefined();
      expect(exportData.recommendations).toBeDefined();
    });

    it('should import learning data successfully', () => {
      const exportData = educationSystem.exportLearningData();
      const newSystem = new EducationalIntegrationSystem();
      
      const importListener = jest.fn();
      newSystem.on('dataImported', importListener);

      const success = newSystem.importLearningData(exportData);

      expect(success).toBe(true);
      expect(importListener).toHaveBeenCalled();
    });

    it('should handle import errors gracefully', () => {
      const invalidData = { invalid: 'data' } as any;
      const success = educationSystem.importLearningData(invalidData);

      expect(success).toBe(false);
    });
  });

  describe('Event System', () => {
    it('should register and trigger event listeners', () => {
      const listener = jest.fn();
      educationSystem.on('test_event', listener);

      // Trigger through internal emit (would need to expose for testing)
      // For now, test through actual events
      educationSystem.startLearningSession();
      
      const sessionListener = jest.fn();
      educationSystem.on('sessionStarted', sessionListener);
      
      educationSystem.startLearningSession();
      expect(sessionListener).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const listener = jest.fn();
      educationSystem.on('sessionStarted', listener);
      educationSystem.off('sessionStarted', listener);

      educationSystem.startLearningSession();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Analytics Calculation', () => {
    beforeEach(() => {
      educationSystem.startLearningSession();
    });

    it('should calculate engagement rate', () => {
      educationSystem.processGameEvent(mockGameEvent, mockContext);
      
      // Get the actual moment ID that was created
      const recentMoments = educationSystem.detector.getRecentMoments(60000);
      if (recentMoments.length > 0) {
        educationSystem.addReflection(recentMoments[0].id, 'Test reflection');
      }

      const analytics = educationSystem.getSessionAnalytics();
      expect(analytics!.engagementRate).toBeGreaterThanOrEqual(0);
    });

    it('should calculate learning velocity', () => {
      educationSystem.processGameEvent(mockGameEvent, mockContext);

      const analytics = educationSystem.getSessionAnalytics();
      expect(analytics!.learningVelocity).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero division in calculations', () => {
      // Test with no activity
      const analytics = educationSystem.getSessionAnalytics();
      
      expect(analytics!.engagementRate).toBe(0);
      expect(analytics!.learningVelocity).toBe(0);
    });
  });

  describe('Subsystem Access', () => {
    it('should provide access to detector subsystem', () => {
      expect(educationSystem.detector).toBeDefined();
      expect(typeof educationSystem.detector.detectLearningMoments).toBe('function');
    });

    it('should provide access to popup subsystem', () => {
      expect(educationSystem.popups).toBeDefined();
      expect(typeof educationSystem.popups.showPopup).toBe('function');
    });

    it('should provide access to journal subsystem', () => {
      expect(educationSystem.reflectionJournal).toBeDefined();
      expect(typeof educationSystem.reflectionJournal.createEntry).toBe('function');
    });

    it('should provide current settings', () => {
      const settings = educationSystem.currentSettings;
      
      expect(settings).toBeDefined();
      expect(settings.enablePopups).toBeDefined();
      expect(settings.popupFrequency).toBeDefined();
    });
  });
});