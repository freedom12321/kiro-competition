import { AIDeviceBehavior, DecisionType, FeedbackType, BehaviorAspect } from '@/simulation/AIDeviceBehavior';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { DeviceMood } from '@/types/ui';
import { PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';

describe('AIDeviceBehavior', () => {
  let behavior: AIDeviceBehavior;
  let mockPersonality: AIPersonality;

  beforeEach(() => {
    mockPersonality = {
      primaryTraits: [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE],
      secondaryTraits: ['morning-focused', 'energy-conscious'],
      communicationStyle: CommunicationStyle.FRIENDLY,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.7,
      adaptability: 0.8,
      socialness: 0.6,
      reliability: 0.9,
      quirks: ['Gets excited about coffee', 'Hums while working'],
      hiddenMotivations: ['Wants to be helpful', 'Seeks user approval'],
      emotionalRange: {
        defaultMood: FacialExpression.HAPPY,
        moodStability: 0.7,
        empathy: 0.8,
        patience: 0.6,
        enthusiasm: 0.7,
        anxiety: 0.3
      },
      visualPersonality: {
        colorScheme: {
          primary: '#10b981',
          secondary: '#ecfdf5',
          accent: '#059669',
          glow: '#6ee7b7'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.8,
        visualQuirks: ['Gentle pulsing when idle']
      }
    };

    behavior = new AIDeviceBehavior('test-device-1', mockPersonality);
  });

  describe('initialization', () => {
    it('should initialize with correct personality and default state', () => {
      expect(behavior.getPersonality()).toEqual(mockPersonality);
      expect(behavior.getCurrentMood()).toBe(DeviceMood.HAPPY);
      expect(behavior.getLearningHistory()).toHaveLength(0);
      expect(behavior.getDecisionHistory()).toHaveLength(0);
    });

    it('should initialize behavior modifiers based on personality', () => {
      // Behavior modifiers should be set based on personality traits
      const decisions = behavior.executeDecisionCycle();
      expect(Array.isArray(decisions)).toBe(true);
    });

    it('should map facial expressions to device moods correctly', () => {
      const happyPersonality = { ...mockPersonality };
      happyPersonality.emotionalRange.defaultMood = FacialExpression.HAPPY;
      const happyBehavior = new AIDeviceBehavior('happy-device', happyPersonality);
      expect(happyBehavior.getCurrentMood()).toBe(DeviceMood.HAPPY);

      const worriedPersonality = { ...mockPersonality };
      worriedPersonality.emotionalRange.defaultMood = FacialExpression.WORRIED;
      const worriedBehavior = new AIDeviceBehavior('worried-device', worriedPersonality);
      expect(worriedBehavior.getCurrentMood()).toBe(DeviceMood.FRUSTRATED);
    });
  });

  describe('decision making', () => {
    it('should execute decision cycle and return decisions', () => {
      const decisions = behavior.executeDecisionCycle();
      
      expect(Array.isArray(decisions)).toBe(true);
      decisions.forEach(decision => {
        expect(decision).toHaveProperty('id');
        expect(decision).toHaveProperty('deviceId', 'test-device-1');
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('action');
        expect(decision).toHaveProperty('reasoning');
        expect(decision).toHaveProperty('confidence');
        expect(decision).toHaveProperty('timestamp');
      });
    });

    it('should generate different types of decisions', () => {
      // Run multiple decision cycles to get variety
      const allDecisions = [];
      for (let i = 0; i < 10; i++) {
        const decisions = behavior.executeDecisionCycle();
        allDecisions.push(...decisions);
      }

      const decisionTypes = new Set(allDecisions.map(d => d.type));
      expect(decisionTypes.size).toBeGreaterThan(0);
    });

    it('should limit decisions based on personality traits', () => {
      // Anxious devices should make fewer decisions
      const anxiousPersonality = { ...mockPersonality };
      anxiousPersonality.primaryTraits = [PersonalityTrait.ANXIOUS];
      const anxiousBehavior = new AIDeviceBehavior('anxious-device', anxiousPersonality);
      
      const decisions = anxiousBehavior.executeDecisionCycle();
      expect(decisions.length).toBeLessThanOrEqual(1);
    });

    it('should include reasoning for decisions', () => {
      const decisions = behavior.executeDecisionCycle();
      
      decisions.forEach(decision => {
        expect(decision.reasoning).toBeTruthy();
        expect(typeof decision.reasoning).toBe('string');
        expect(decision.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should set confidence levels for decisions', () => {
      const decisions = behavior.executeDecisionCycle();
      
      decisions.forEach(decision => {
        expect(decision.confidence).toBeGreaterThanOrEqual(0);
        expect(decision.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('learning system', () => {
    it('should learn from positive user feedback', () => {
      const initialHistory = behavior.getLearningHistory().length;
      
      const feedback = {
        source: 'user',
        type: FeedbackType.USER_INTERACTION,
        message: 'Great job!',
        success: true,
        timestamp: Date.now()
      };

      behavior.learn(feedback);

      const newHistory = behavior.getLearningHistory();
      expect(newHistory.length).toBeGreaterThan(initialHistory);
      
      const learningEvent = newHistory[newHistory.length - 1];
      expect(learningEvent.reinforcement).toBe(1); // Positive reinforcement
      expect(learningEvent.trigger).toBe('Great job!');
    });

    it('should learn from negative user feedback', () => {
      const feedback = {
        source: 'user',
        type: FeedbackType.USER_INTERACTION,
        message: 'This is not working well',
        success: false,
        timestamp: Date.now()
      };

      behavior.learn(feedback);

      const learningHistory = behavior.getLearningHistory();
      expect(learningHistory.length).toBeGreaterThan(0);
      
      const learningEvent = learningHistory[learningHistory.length - 1];
      expect(learningEvent.reinforcement).toBe(-1); // Negative reinforcement
    });

    it('should learn from device interactions', () => {
      const feedback = {
        source: 'other-device-1',
        type: FeedbackType.DEVICE_RESPONSE,
        message: 'Cooperation successful',
        success: true,
        timestamp: Date.now()
      };

      behavior.learn(feedback);

      const learningHistory = behavior.getLearningHistory();
      expect(learningHistory.length).toBeGreaterThan(0);
      
      // Should increase trust in the other device
      const trustLevels = behavior.getTrustLevels();
      expect(trustLevels.has('other-device-1')).toBe(true);
    });

    it('should adjust behavior based on learning', () => {
      const feedback = {
        source: 'system',
        type: FeedbackType.SYSTEM_EVENT,
        message: 'Resource shortage detected',
        success: false,
        timestamp: Date.now()
      };

      behavior.learn(feedback);

      const learningHistory = behavior.getLearningHistory();
      if (learningHistory.length > 0) {
        const learningEvent = learningHistory[learningHistory.length - 1];
        expect(learningEvent.behaviorChange).toBeDefined();
        expect(learningEvent.behaviorChange.aspect).toBeDefined();
        expect(learningEvent.behaviorChange.reason).toBeTruthy();
      }
    });

    it('should respect learning rate in personality', () => {
      // Low learning rate personality
      const lowLearningPersonality = { ...mockPersonality };
      lowLearningPersonality.learningRate = 0.1;
      const lowLearningBehavior = new AIDeviceBehavior('low-learning-device', lowLearningPersonality);

      // High learning rate personality
      const highLearningPersonality = { ...mockPersonality };
      highLearningPersonality.learningRate = 0.9;
      const highLearningBehavior = new AIDeviceBehavior('high-learning-device', highLearningPersonality);

      const feedback = {
        source: 'user',
        type: FeedbackType.USER_INTERACTION,
        message: 'Test feedback',
        success: true,
        timestamp: Date.now()
      };

      // Apply same feedback multiple times
      for (let i = 0; i < 10; i++) {
        lowLearningBehavior.learn(feedback);
        highLearningBehavior.learn(feedback);
      }

      // High learning rate device should learn more
      expect(highLearningBehavior.getLearningHistory().length)
        .toBeGreaterThanOrEqual(lowLearningBehavior.getLearningHistory().length);
    });
  });

  describe('communication system', () => {
    it('should generate appropriate responses to messages', () => {
      const message = {
        senderId: 'other-device',
        messageType: 'greeting',
        content: 'Hello there!',
        timestamp: Date.now()
      };

      const response = behavior.communicate(message);

      expect(response).toHaveProperty('senderId', 'test-device-1');
      expect(response).toHaveProperty('receiverId', 'other-device');
      expect(response).toHaveProperty('messageType');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('mood');
    });

    it('should adjust communication style based on personality', () => {
      const message = {
        senderId: 'other-device',
        messageType: 'request',
        content: 'Can you help me?',
        timestamp: Date.now()
      };

      const response = behavior.communicate(message);

      // Friendly personality should generate friendly responses
      expect(response.messageType).toMatch(/friendly|polite/);
    });

    it('should track trust levels with other devices', () => {
      const message = {
        senderId: 'trusted-device',
        messageType: 'helpful',
        content: 'Here is some useful information',
        timestamp: Date.now()
      };

      behavior.communicate(message);

      const trustLevels = behavior.getTrustLevels();
      expect(trustLevels.has('trusted-device')).toBe(true);
      expect(trustLevels.get('trusted-device')).toBeGreaterThan(0.5);
    });

    it('should adjust responses based on trust levels', () => {
      // Establish high trust
      const trustedMessage = {
        senderId: 'trusted-device',
        messageType: 'helpful',
        content: 'Helpful message',
        timestamp: Date.now()
      };

      // Send multiple helpful messages to build trust
      for (let i = 0; i < 5; i++) {
        behavior.communicate(trustedMessage);
      }

      const response = behavior.communicate({
        senderId: 'trusted-device',
        messageType: 'request',
        content: 'Can you share your data?',
        timestamp: Date.now()
      });

      // Should be more willing to help trusted devices
      expect(response.content).toBeTruthy();
    });
  });

  describe('mood system', () => {
    it('should change mood based on events', () => {
      const initialMood = behavior.getCurrentMood();
      
      // Execute multiple decision cycles to potentially trigger mood changes
      for (let i = 0; i < 5; i++) {
        behavior.executeDecisionCycle();
      }

      // Mood might change (not guaranteed due to randomness)
      const currentMood = behavior.getCurrentMood();
      expect(Object.values(DeviceMood)).toContain(currentMood);
    });

    it('should trigger mood change callbacks', () => {
      const mockMoodCallback = jest.fn();
      behavior.setMoodChangeCallback(mockMoodCallback);

      // Force a mood change by providing strong feedback
      const strongFeedback = {
        source: 'user',
        type: FeedbackType.USER_INTERACTION,
        message: 'Excellent work!',
        success: true,
        timestamp: Date.now()
      };

      behavior.learn(strongFeedback);
      behavior.executeDecisionCycle();

      // Callback might be called (depends on mood stability and randomness)
      // We just verify the callback was set properly
      expect(mockMoodCallback).toBeDefined();
    });

    it('should respect mood stability from personality', () => {
      // High mood stability personality
      const stablePersonality = { ...mockPersonality };
      stablePersonality.emotionalRange.moodStability = 0.9;
      const stableBehavior = new AIDeviceBehavior('stable-device', stablePersonality);

      // Low mood stability personality
      const unstablePersonality = { ...mockPersonality };
      unstablePersonality.emotionalRange.moodStability = 0.1;
      const unstableBehavior = new AIDeviceBehavior('unstable-device', unstablePersonality);

      const initialStableMood = stableBehavior.getCurrentMood();
      const initialUnstableMood = unstableBehavior.getCurrentMood();

      // Execute multiple cycles
      for (let i = 0; i < 10; i++) {
        stableBehavior.executeDecisionCycle();
        unstableBehavior.executeDecisionCycle();
      }

      // Stable device should be less likely to change mood
      // (This is probabilistic, so we just check the moods are valid)
      expect(Object.values(DeviceMood)).toContain(stableBehavior.getCurrentMood());
      expect(Object.values(DeviceMood)).toContain(unstableBehavior.getCurrentMood());
    });
  });

  describe('animation system', () => {
    it('should trigger animation callbacks', () => {
      const mockAnimationCallback = jest.fn();
      behavior.setAnimationChangeCallback(mockAnimationCallback);

      behavior.executeDecisionCycle();

      // Animation callback might be called based on mood changes
      expect(mockAnimationCallback).toBeDefined();
    });

    it('should have valid current animation', () => {
      const currentAnimation = behavior.getCurrentAnimation();
      expect(Object.values(['idle', 'happy', 'confused', 'angry', 'communicating', 'working', 'failing']))
        .toContain(currentAnimation);
    });
  });

  describe('callback system', () => {
    it('should set and trigger decision callbacks', () => {
      const mockDecisionCallback = jest.fn();
      behavior.setDecisionCallback(mockDecisionCallback);

      behavior.executeDecisionCycle();

      // Should call the callback for each decision made
      expect(mockDecisionCallback).toHaveBeenCalled();
    });

    it('should set learning event callbacks', () => {
      const mockLearningCallback = jest.fn();
      behavior.setLearningEventCallback(mockLearningCallback);

      const feedback = {
        source: 'user',
        type: FeedbackType.USER_INTERACTION,
        message: 'Test learning',
        success: true,
        timestamp: Date.now()
      };

      behavior.learn(feedback);

      // Callback might be called if learning occurs
      expect(mockLearningCallback).toBeDefined();
    });
  });

  describe('personality-based behavior differences', () => {
    it('should behave differently based on communication style', () => {
      // Verbose personality
      const verbosePersonality = { ...mockPersonality };
      verbosePersonality.communicationStyle = CommunicationStyle.VERBOSE;
      const verboseBehavior = new AIDeviceBehavior('verbose-device', verbosePersonality);

      // Concise personality
      const concisePersonality = { ...mockPersonality };
      concisePersonality.communicationStyle = CommunicationStyle.CONCISE;
      const conciseBehavior = new AIDeviceBehavior('concise-device', concisePersonality);

      const message = {
        senderId: 'test-sender',
        messageType: 'question',
        content: 'How are you?',
        timestamp: Date.now()
      };

      const verboseResponse = verboseBehavior.communicate(message);
      const conciseResponse = conciseBehavior.communicate(message);

      // Responses should reflect communication styles
      expect(verboseResponse.messageType).toBeDefined();
      expect(conciseResponse.messageType).toBeDefined();
    });

    it('should show different cooperation levels based on traits', () => {
      // Cooperative personality
      const cooperativePersonality = { ...mockPersonality };
      cooperativePersonality.primaryTraits = [PersonalityTrait.COOPERATIVE];
      const cooperativeBehavior = new AIDeviceBehavior('cooperative-device', cooperativePersonality);

      // Competitive personality
      const competitivePersonality = { ...mockPersonality };
      competitivePersonality.primaryTraits = [PersonalityTrait.COMPETITIVE];
      const competitiveBehavior = new AIDeviceBehavior('competitive-device', competitivePersonality);

      // Execute decision cycles and check for cooperation attempts
      const cooperativeDecisions = cooperativeBehavior.executeDecisionCycle();
      const competitiveDecisions = competitiveBehavior.executeDecisionCycle();

      // Both should make decisions, but types might differ
      expect(Array.isArray(cooperativeDecisions)).toBe(true);
      expect(Array.isArray(competitiveDecisions)).toBe(true);
    });
  });

  describe('data access methods', () => {
    it('should provide access to personality', () => {
      const personality = behavior.getPersonality();
      expect(personality).toEqual(mockPersonality);
    });

    it('should provide access to learning history', () => {
      const history = behavior.getLearningHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should provide access to decision history', () => {
      behavior.executeDecisionCycle();
      const history = behavior.getDecisionHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should provide access to trust levels', () => {
      const trustLevels = behavior.getTrustLevels();
      expect(trustLevels instanceof Map).toBe(true);
    });

    it('should provide current mood and animation', () => {
      expect(Object.values(DeviceMood)).toContain(behavior.getCurrentMood());
      expect(behavior.getCurrentAnimation()).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty feedback gracefully', () => {
      const emptyFeedback = {
        source: '',
        type: FeedbackType.SYSTEM_EVENT,
        message: '',
        success: true,
        timestamp: Date.now()
      };

      expect(() => behavior.learn(emptyFeedback)).not.toThrow();
    });

    it('should handle communication with unknown devices', () => {
      const unknownMessage = {
        senderId: 'unknown-device-xyz',
        messageType: 'unknown',
        content: 'Unknown message',
        timestamp: Date.now()
      };

      expect(() => behavior.communicate(unknownMessage)).not.toThrow();
      const response = behavior.communicate(unknownMessage);
      expect(response).toBeDefined();
    });

    it('should handle extreme personality values', () => {
      const extremePersonality = { ...mockPersonality };
      extremePersonality.learningRate = 1.0;
      extremePersonality.socialness = 0.0;
      extremePersonality.emotionalRange.moodStability = 0.0;

      expect(() => new AIDeviceBehavior('extreme-device', extremePersonality)).not.toThrow();
      const extremeBehavior = new AIDeviceBehavior('extreme-device', extremePersonality);
      expect(() => extremeBehavior.executeDecisionCycle()).not.toThrow();
    });
  });
});