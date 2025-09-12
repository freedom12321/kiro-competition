import { EducationalPopupSystem, PopupPriority, ElementType } from '../../src/education/EducationalPopupSystem';
import { LearningMoment, LearningMomentType, AIConcept } from '../../src/education/LearningMomentDetector';

// Mock DOM methods
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
  value: jest.fn(() => ({
    remove: jest.fn()
  }))
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

describe('EducationalPopupSystem', () => {
  let popupSystem: EducationalPopupSystem;
  let mockLearningMoment: LearningMoment;

  beforeEach(() => {
    popupSystem = new EducationalPopupSystem();
    
    mockLearningMoment = {
      id: 'moment_1',
      type: LearningMomentType.COOPERATION_SUCCESS,
      timestamp: Date.now(),
      gameEvent: {
        id: 'event_1',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: { efficiency: 1.8 }
      },
      aiConcept: AIConcept.MULTI_AGENT_COORDINATION,
      description: 'Two AI devices successfully coordinated to achieve 1.8x efficiency',
      realWorldExample: 'Autonomous vehicles coordinating at intersections',
      reflectionPrompts: [
        'What enabled these AI devices to work together?',
        'How might this apply to real-world AI systems?',
        'What could go wrong if coordination failed?'
      ],
      importance: 7
    };
  });

  describe('Popup Creation', () => {
    it('should create popup from learning moment', () => {
      const popup = popupSystem.createPopupFromLearningMoment(mockLearningMoment);

      expect(popup.id).toBe('popup_moment_1');
      expect(popup.learningMoment).toBe(mockLearningMoment);
      expect(popup.title).toContain('Coordination');
      expect(popup.content).toContain('1.8x efficiency');
      expect(popup.priority).toBe(PopupPriority.HIGH);
    });
  });

  describe('Interactive Elements', () => {
    it('should generate appropriate interactive elements', () => {
      const popup = popupSystem.createPopupFromLearningMoment(mockLearningMoment);

      expect(popup.interactiveElements.length).toBeGreaterThan(0);
      
      const hasReflectionPrompt = popup.interactiveElements.some(
        element => element.type === ElementType.REFLECTION_PROMPT
      );
      const hasRealWorldExample = popup.interactiveElements.some(
        element => element.type === ElementType.REAL_WORLD_EXAMPLE
      );

      expect(hasReflectionPrompt).toBe(true);
      expect(hasRealWorldExample).toBe(true);
    });

    it('should include all reflection prompts as interactive elements', () => {
      const popup = popupSystem.createPopupFromLearningMoment(mockLearningMoment);
      
      const reflectionElements = popup.interactiveElements.filter(
        element => element.type === ElementType.REFLECTION_PROMPT
      );

      expect(reflectionElements).toHaveLength(mockLearningMoment.reflectionPrompts.length);
    });
  });

  describe('Priority Calculation', () => {
    it('should assign critical priority to importance 9+', () => {
      const criticalMoment = { ...mockLearningMoment, importance: 9 };
      const popup = popupSystem.createPopupFromLearningMoment(criticalMoment);

      expect(popup.priority).toBe(PopupPriority.CRITICAL);
    });

    it('should assign high priority to importance 7-8', () => {
      const highMoment = { ...mockLearningMoment, importance: 7 };
      const popup = popupSystem.createPopupFromLearningMoment(highMoment);

      expect(popup.priority).toBe(PopupPriority.HIGH);
    });

    it('should assign medium priority to importance 5-6', () => {
      const mediumMoment = { ...mockLearningMoment, importance: 5 };
      const popup = popupSystem.createPopupFromLearningMoment(mediumMoment);

      expect(popup.priority).toBe(PopupPriority.MEDIUM);
    });

    it('should assign low priority to importance below 5', () => {
      const lowMoment = { ...mockLearningMoment, importance: 3 };
      const popup = popupSystem.createPopupFromLearningMoment(lowMoment);

      expect(popup.priority).toBe(PopupPriority.LOW);
    });
  });

  describe('Display Duration Calculation', () => {
    it('should calculate longer duration for higher importance', () => {
      const lowImportance = { ...mockLearningMoment, importance: 3 };
      const highImportance = { ...mockLearningMoment, importance: 9 };

      const lowPopup = popupSystem.createPopupFromLearningMoment(lowImportance);
      const highPopup = popupSystem.createPopupFromLearningMoment(highImportance);

      expect(highPopup.displayDuration).toBeGreaterThan(lowPopup.displayDuration);
    });

    it('should not exceed maximum duration', () => {
      const longDescription = { 
        ...mockLearningMoment, 
        importance: 10,
        description: 'A'.repeat(1000) // Very long description
      };

      const popup = popupSystem.createPopupFromLearningMoment(longDescription);

      expect(popup.displayDuration).toBeLessThanOrEqual(30000); // Max 30 seconds
    });
  });

  describe('Position Calculation', () => {
    it('should assign different positions based on moment type', () => {
      const cooperationMoment = { 
        ...mockLearningMoment, 
        type: LearningMomentType.COOPERATION_SUCCESS 
      };
      const conflictMoment = { 
        ...mockLearningMoment, 
        type: LearningMomentType.CONFLICT_EMERGENCE 
      };

      const cooperationPopup = popupSystem.createPopupFromLearningMoment(cooperationMoment);
      const conflictPopup = popupSystem.createPopupFromLearningMoment(conflictMoment);

      expect(cooperationPopup.position.anchor).not.toBe(conflictPopup.position.anchor);
    });
  });

  describe('Popup Queue Management', () => {
    it('should respect maximum concurrent popups limit', () => {
      popupSystem.setMaxConcurrentPopups(1);

      const popup1 = popupSystem.createPopupFromLearningMoment(mockLearningMoment);
      const popup2 = popupSystem.createPopupFromLearningMoment({
        ...mockLearningMoment,
        id: 'moment_2'
      });

      popupSystem.showPopup(popup1);
      popupSystem.showPopup(popup2);

      expect(popupSystem.getActivePopupCount()).toBe(1);
      expect(popupSystem.getQueuedPopupCount()).toBe(1);
    });

    it('should process queue when popup is dismissed', () => {
      popupSystem.setMaxConcurrentPopups(1);

      const popup1 = popupSystem.createPopupFromLearningMoment(mockLearningMoment);
      const popup2 = popupSystem.createPopupFromLearningMoment({
        ...mockLearningMoment,
        id: 'moment_2'
      });

      popupSystem.showPopup(popup1);
      popupSystem.showPopup(popup2);

      expect(popupSystem.getQueuedPopupCount()).toBe(1);

      popupSystem.dismissPopup(popup1.id);

      expect(popupSystem.getActivePopupCount()).toBe(1);
      expect(popupSystem.getQueuedPopupCount()).toBe(0);
    });

    it('should prioritize higher priority popups in queue', () => {
      popupSystem.setMaxConcurrentPopups(1);

      const lowPriorityMoment = { ...mockLearningMoment, importance: 3 };
      const highPriorityMoment = { ...mockLearningMoment, id: 'moment_high', importance: 9 };

      const lowPopup = popupSystem.createPopupFromLearningMoment(lowPriorityMoment);
      const highPopup = popupSystem.createPopupFromLearningMoment(highPriorityMoment);

      // Show low priority first to fill the slot
      popupSystem.showPopup(lowPopup);
      
      // Queue both (high priority should jump ahead)
      popupSystem.showPopup(lowPopup);
      popupSystem.showPopup(highPopup);

      expect(popupSystem.getQueuedPopupCount()).toBe(2);
    });
  });

  describe('Popup Management', () => {
    it('should clear all popups', () => {
      const popup1 = popupSystem.createPopupFromLearningMoment(mockLearningMoment);
      const popup2 = popupSystem.createPopupFromLearningMoment({
        ...mockLearningMoment,
        id: 'moment_2'
      });

      popupSystem.showPopup(popup1);
      popupSystem.showPopup(popup2);

      popupSystem.clearAllPopups();

      expect(popupSystem.getActivePopupCount()).toBe(0);
      expect(popupSystem.getQueuedPopupCount()).toBe(0);
    });

    it('should update max concurrent popups setting', () => {
      popupSystem.setMaxConcurrentPopups(3);

      const popup1 = popupSystem.createPopupFromLearningMoment(mockLearningMoment);
      const popup2 = popupSystem.createPopupFromLearningMoment({
        ...mockLearningMoment,
        id: 'moment_2'
      });
      const popup3 = popupSystem.createPopupFromLearningMoment({
        ...mockLearningMoment,
        id: 'moment_3'
      });

      popupSystem.showPopup(popup1);
      popupSystem.showPopup(popup2);
      popupSystem.showPopup(popup3);

      expect(popupSystem.getActivePopupCount()).toBe(3);
      expect(popupSystem.getQueuedPopupCount()).toBe(0);
    });
  });

  describe('Content Generation', () => {
    it('should format concept names properly', () => {
      const popup = popupSystem.createPopupFromLearningMoment(mockLearningMoment);

      expect(popup.content).toContain('Multi Agent Coordination');
    });

    it('should include moment description in content', () => {
      const popup = popupSystem.createPopupFromLearningMoment(mockLearningMoment);

      expect(popup.content).toContain(mockLearningMoment.description);
    });
  });
});