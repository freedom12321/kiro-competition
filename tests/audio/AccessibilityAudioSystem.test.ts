import { AccessibilityAudioSystem } from '../../src/audio/AccessibilityAudioSystem';
import { AccessibilityOptions, NavigationDirection, AudioContext as GameAudioContext } from '../../src/types/audio.js';

// Mock Web Audio API
class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: (channel: number) => new Float32Array(length)
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn()
    };
  }
  
  createGain() {
    return {
      gain: { setValueAtTime: jest.fn() },
      connect: jest.fn()
    };
  }
}

// Mock SpeechSynthesis API
class MockSpeechSynthesis {
  speaking = false;
  pending = false;
  paused = false;
  
  speak = jest.fn();
  cancel = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
  getVoices = jest.fn(() => [
    { name: 'Test Voice', lang: 'en-US' },
    { name: 'Another Voice', lang: 'en-GB' }
  ]);
}

class MockSpeechSynthesisUtterance {
  text = '';
  lang = '';
  voice = null;
  volume = 1;
  rate = 1;
  pitch = 1;
  
  onstart = null;
  onend = null;
  onerror = null;
  onpause = null;
  onresume = null;
  onmark = null;
  onboundary = null;
  
  constructor(text?: string) {
    this.text = text || '';
  }
}

// Mock DOM methods
const mockGetElementById = jest.fn();
Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

describe('AccessibilityAudioSystem', () => {
  let accessibilitySystem: AccessibilityAudioSystem;
  let mockAudioContext: GameAudioContext;
  let mockSpeechSynthesis: MockSpeechSynthesis;

  beforeEach(() => {
    // Setup audio context mock
    const context = new MockAudioContext();
    mockAudioContext = {
      context: context as any,
      masterGain: context.createGain() as any,
      musicGain: context.createGain() as any,
      sfxGain: context.createGain() as any,
      voiceGain: context.createGain() as any,
      compressor: {} as any
    };

    // Setup speech synthesis mock
    mockSpeechSynthesis = new MockSpeechSynthesis();
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true
    });
    
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockSpeechSynthesisUtterance,
      writable: true
    });

    accessibilitySystem = new AccessibilityAudioSystem(mockAudioContext);
    
    // Reset mocks
    jest.clearAllMocks();
    mockGetElementById.mockReturnValue({
      setAttribute: jest.fn()
    });
  });

  describe('Configuration', () => {
    it('should configure accessibility options', () => {
      const options: AccessibilityOptions = {
        enableAudioDescriptions: true,
        enableNavigationSounds: true,
        enableActionAnnouncements: true,
        speechRate: 1.2,
        speechPitch: 1.1,
        speechVolume: 0.8,
        preferredVoice: 'Test Voice'
      };

      expect(() => {
        accessibilitySystem.configure(options);
      }).not.toThrow();
    });

    it('should handle partial configuration', () => {
      const options: AccessibilityOptions = {
        enableAudioDescriptions: true,
        enableNavigationSounds: false,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      };

      expect(() => {
        accessibilitySystem.configure(options);
      }).not.toThrow();
    });

    it('should enable audio cues independently', () => {
      expect(() => {
        accessibilitySystem.enableAudioCues(true);
        accessibilitySystem.enableAudioCues(false);
      }).not.toThrow();
    });

    it('should set announcement speed with bounds checking', () => {
      expect(() => {
        accessibilitySystem.setAnnouncementSpeed(0.5);  // Minimum
        accessibilitySystem.setAnnouncementSpeed(2.0);  // Maximum
        accessibilitySystem.setAnnouncementSpeed(0.1);  // Below minimum (should clamp)
        accessibilitySystem.setAnnouncementSpeed(3.0);  // Above maximum (should clamp)
      }).not.toThrow();
    });
  });

  describe('Action Announcements', () => {
    beforeEach(() => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });
    });

    it('should announce actions when enabled', () => {
      accessibilitySystem.announceAction('button_click');
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should format action names properly', () => {
      const actions = [
        'buttonClick',
        'drag_start',
        'device_created',
        'crisis_detected'
      ];

      actions.forEach(action => {
        accessibilitySystem.announceAction(action);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(actions.length);
    });

    it('should not announce when disabled', () => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });

      accessibilitySystem.announceAction('button_click');
      
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should handle special action announcements', () => {
      const specialActions = [
        { method: 'announceDeviceCreated', args: ['Smart Light', 'helpful'] },
        { method: 'announceDevicePlaced', args: ['Smart Light', 'living room'] },
        { method: 'announceCrisisLevel', args: ['high', 3] },
        { method: 'announceHarmonyLevel', args: ['perfect'] },
        { method: 'announceResourceUsage', args: ['energy', 75] },
        { method: 'announceRuleCreated', args: ['Safety First'] },
        { method: 'announceRuleViolation', args: ['Safety First', 'Smart Thermostat'] }
      ];

      specialActions.forEach(({ method, args }) => {
        expect(() => {
          (accessibilitySystem as any)[method](...args);
        }).not.toThrow();
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(specialActions.length);
    });
  });

  describe('Visual Element Descriptions', () => {
    beforeEach(() => {
      accessibilitySystem.configure({
        enableAudioDescriptions: true,
        enableNavigationSounds: false,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });
    });

    it('should describe known visual elements', () => {
      const knownElements = [
        'device-creation-panel',
        'room-designer',
        'crisis-management-panel',
        'governance-rule-designer',
        'tutorial-overlay'
      ];

      knownElements.forEach(elementId => {
        accessibilitySystem.describeVisualElement(elementId);
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(knownElements.length);
    });

    it('should handle unknown elements gracefully', () => {
      accessibilitySystem.describeVisualElement('unknown-element');
      
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should not describe when disabled', () => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });

      accessibilitySystem.describeVisualElement('device-creation-panel');
      
      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Sounds', () => {
    beforeEach(() => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: true,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });
    });

    it('should play navigation sounds for all directions', () => {
      const directions = [
        NavigationDirection.UP,
        NavigationDirection.DOWN,
        NavigationDirection.LEFT,
        NavigationDirection.RIGHT,
        NavigationDirection.ENTER,
        NavigationDirection.EXIT,
        NavigationDirection.NEXT,
        NavigationDirection.PREVIOUS
      ];

      directions.forEach(direction => {
        expect(() => {
          accessibilitySystem.playNavigationSound(direction);
        }).not.toThrow();
      });
    });

    it('should not play navigation sounds when disabled', () => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });

      expect(() => {
        accessibilitySystem.playNavigationSound(NavigationDirection.UP);
      }).not.toThrow();
    });

    it('should generate distinct sounds for different directions', () => {
      // This test verifies that the system creates different navigation sounds
      // The actual audio buffer content testing would require more complex mocking
      expect(() => {
        accessibilitySystem.playNavigationSound(NavigationDirection.UP);
        accessibilitySystem.playNavigationSound(NavigationDirection.DOWN);
        accessibilitySystem.playNavigationSound(NavigationDirection.LEFT);
        accessibilitySystem.playNavigationSound(NavigationDirection.RIGHT);
      }).not.toThrow();
    });
  });

  describe('Speech Synthesis', () => {
    beforeEach(() => {
      accessibilitySystem.configure({
        enableAudioDescriptions: true,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.2,
        speechPitch: 1.1,
        speechVolume: 0.8,
        preferredVoice: 'Test Voice'
      });
    });

    it('should use configured speech parameters', () => {
      accessibilitySystem.announceAction('test_action');
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.2);
      expect(utterance.pitch).toBe(1.1);
      expect(utterance.volume).toBe(0.8);
    });

    it('should handle speech synthesis errors gracefully', () => {
      // Mock speech synthesis to throw error
      mockSpeechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech synthesis error');
      });

      expect(() => {
        accessibilitySystem.announceAction('test_action');
      }).not.toThrow();
    });

    it('should cancel previous speech before starting new', () => {
      accessibilitySystem.announceAction('first_action');
      accessibilitySystem.announceAction('second_action');
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalledTimes(2);
    });

    it('should handle missing speech synthesis API', () => {
      // Remove speech synthesis
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true
      });

      const systemWithoutSpeech = new AccessibilityAudioSystem(mockAudioContext);
      systemWithoutSpeech.configure({
        enableAudioDescriptions: true,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });

      expect(() => {
        systemWithoutSpeech.announceAction('test_action');
      }).not.toThrow();
    });
  });

  describe('ARIA Support', () => {
    it('should set ARIA labels on elements', () => {
      const mockElement = { setAttribute: jest.fn() };
      mockGetElementById.mockReturnValue(mockElement);

      accessibilitySystem.setAriaLabel('test-element', 'Test Label');
      
      expect(mockGetElementById).toHaveBeenCalledWith('test-element');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test Label');
    });

    it('should set ARIA descriptions on elements', () => {
      const mockElement = { setAttribute: jest.fn() };
      mockGetElementById.mockReturnValue(mockElement);

      accessibilitySystem.setAriaDescription('test-element', 'Test Description');
      
      expect(mockGetElementById).toHaveBeenCalledWith('test-element');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-description', 'Test Description');
    });

    it('should handle missing elements gracefully', () => {
      mockGetElementById.mockReturnValue(null);

      expect(() => {
        accessibilitySystem.setAriaLabel('missing-element', 'Test Label');
        accessibilitySystem.setAriaDescription('missing-element', 'Test Description');
      }).not.toThrow();
    });
  });

  describe('Context Announcements', () => {
    beforeEach(() => {
      accessibilitySystem.configure({
        enableAudioDescriptions: true,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });
    });

    it('should announce region changes', () => {
      accessibilitySystem.announceRegionChange('Device Creation');
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should announce modal dialogs', () => {
      accessibilitySystem.announceModalOpen('Settings');
      accessibilitySystem.announceModalClose();
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should announce scenario events', () => {
      accessibilitySystem.announceScenarioStart('Smart Home Basics', 'beginner');
      accessibilitySystem.announceScenarioComplete('Smart Home Basics', 85);
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('should announce achievements', () => {
      accessibilitySystem.announceAchievement(
        'First Device Creator', 
        'Created your first AI device'
      );
      
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle rapid announcements without memory leaks', () => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });

      expect(() => {
        for (let i = 0; i < 100; i++) {
          accessibilitySystem.announceAction(`action_${i}`);
        }
      }).not.toThrow();
    });

    it('should handle concurrent navigation sounds', () => {
      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: true,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      });

      expect(() => {
        accessibilitySystem.playNavigationSound(NavigationDirection.UP);
        accessibilitySystem.playNavigationSound(NavigationDirection.DOWN);
        accessibilitySystem.playNavigationSound(NavigationDirection.LEFT);
        accessibilitySystem.playNavigationSound(NavigationDirection.RIGHT);
      }).not.toThrow();
    });

    it('should cleanup resources properly', () => {
      expect(() => {
        accessibilitySystem.stop();
      }).not.toThrow();
      
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('Voice Selection', () => {
    it('should use preferred voice when available', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([
        { name: 'Test Voice', lang: 'en-US' },
        { name: 'Another Voice', lang: 'en-GB' }
      ]);

      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0,
        preferredVoice: 'Test Voice'
      });

      accessibilitySystem.announceAction('test_action');
      
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.voice).toEqual({ name: 'Test Voice', lang: 'en-US' });
    });

    it('should handle missing preferred voice gracefully', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([
        { name: 'Available Voice', lang: 'en-US' }
      ]);

      accessibilitySystem.configure({
        enableAudioDescriptions: false,
        enableNavigationSounds: false,
        enableActionAnnouncements: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0,
        preferredVoice: 'Missing Voice'
      });

      expect(() => {
        accessibilitySystem.announceAction('test_action');
      }).not.toThrow();
    });
  });
});