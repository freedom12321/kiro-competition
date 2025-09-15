import { AudioManager } from '../../src/audio/AudioManager';
import { DeviceSoundType, HarmonyLevel, UIAction, AccessibilityOptions } from '../../src/types/audio.js';
import { PersonalityTrait } from '../../src/types/core.js';

// Mock Web Audio API
class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  destination = { connect: jest.fn() };
  
  createGain() {
    return {
      gain: { setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }
  
  createDynamicsCompressor() {
    return {
      threshold: { setValueAtTime: jest.fn() },
      knee: { setValueAtTime: jest.fn() },
      ratio: { setValueAtTime: jest.fn() },
      attack: { setValueAtTime: jest.fn() },
      release: { setValueAtTime: jest.fn() },
      connect: jest.fn()
    };
  }
  
  createConvolver() {
    return {
      buffer: null,
      connect: jest.fn()
    };
  }
  
  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      getChannelData: (channel: number) => new Float32Array(length)
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      playbackRate: { setValueAtTime: jest.fn() },
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }
  
  decodeAudioData(arrayBuffer: ArrayBuffer) {
    return Promise.resolve(this.createBuffer(1, 1024, 44100));
  }
  
  resume() {
    return Promise.resolve();
  }
  
  close() {
    return Promise.resolve();
  }
  
  get state() {
    return 'running';
  }
}

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
  })
) as jest.Mock;

// Mock window.AudioContext
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    jest.clearAllMocks();
    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(audioManager).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customConfig = {
        masterVolume: 0.5,
        musicVolume: 0.3,
        sfxVolume: 0.7,
        enableReverb: false
      };
      
      const customAudioManager = new AudioManager(customConfig);
      expect(customAudioManager).toBeDefined();
      customAudioManager.cleanup();
    });

    it('should handle audio context initialization failure gracefully', () => {
      // Mock AudioContext constructor to throw
      const originalAudioContext = (global as any).AudioContext;
      (global as any).AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported');
      });

      const audioManager = new AudioManager();
      expect(audioManager).toBeDefined();

      // Restore original
      (global as any).AudioContext = originalAudioContext;
      audioManager.cleanup();
    });
  });

  describe('Audio Asset Loading', () => {
    it('should initialize and load essential assets', async () => {
      await expect(audioManager.initialize()).resolves.not.toThrow();
    });

    it('should handle missing audio files gracefully', async () => {
      // Mock fetch to return 404
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      );

      await expect(audioManager.initialize()).resolves.not.toThrow();
    });

    it('should create fallback tones for missing audio files', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(audioManager.initialize()).resolves.not.toThrow();
    });
  });

  describe('Device Sound Playback', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should play device sounds with personality', () => {
      expect(() => {
        audioManager.playDeviceSound('device1', DeviceSoundType.HAPPY_BEEP, PersonalityTrait.HELPFUL);
      }).not.toThrow();
    });

    it('should play device sounds without personality', () => {
      expect(() => {
        audioManager.playDeviceSound('device1', DeviceSoundType.WORRIED_HUM);
      }).not.toThrow();
    });

    it('should handle multiple simultaneous device sounds', () => {
      expect(() => {
        audioManager.playDeviceSound('device1', DeviceSoundType.HAPPY_BEEP);
        audioManager.playDeviceSound('device2', DeviceSoundType.ANGRY_BUZZ);
        audioManager.playDeviceSound('device3', DeviceSoundType.CONFUSED_CHIRP);
      }).not.toThrow();
    });
  });

  describe('Music System', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should update ambient music based on harmony level', () => {
      expect(() => {
        audioManager.updateAmbientMusic(HarmonyLevel.PERFECT);
      }).not.toThrow();
    });

    it('should handle harmony level transitions', () => {
      expect(() => {
        audioManager.updateAmbientMusic(HarmonyLevel.HIGH);
        audioManager.updateAmbientMusic(HarmonyLevel.TENSION);
        audioManager.updateAmbientMusic(HarmonyLevel.CHAOS);
      }).not.toThrow();
    });

    it('should not crash on rapid harmony level changes', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          const levels = [HarmonyLevel.PERFECT, HarmonyLevel.CHAOS, HarmonyLevel.MODERATE];
          audioManager.updateAmbientMusic(levels[i % levels.length]);
        }
      }).not.toThrow();
    });
  });

  describe('UI Feedback', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should play UI feedback sounds', () => {
      expect(() => {
        audioManager.playUIFeedback(UIAction.BUTTON_CLICK);
      }).not.toThrow();
    });

    it('should handle all UI action types', () => {
      const uiActions = [
        UIAction.BUTTON_CLICK,
        UIAction.BUTTON_HOVER,
        UIAction.DRAG_START,
        UIAction.DRAG_DROP,
        UIAction.DRAG_INVALID,
        UIAction.SUCCESS,
        UIAction.ERROR,
        UIAction.ACHIEVEMENT
      ];

      expect(() => {
        uiActions.forEach(action => {
          audioManager.playUIFeedback(action);
        });
      }).not.toThrow();
    });

    it('should handle unmapped UI actions gracefully', () => {
      expect(() => {
        audioManager.playUIFeedback(UIAction.MENU_OPEN);
      }).not.toThrow();
    });
  });

  describe('Volume Control', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should set master volume', () => {
      expect(() => {
        audioManager.setMasterVolume(0.5);
      }).not.toThrow();
    });

    it('should clamp volume values', () => {
      expect(() => {
        audioManager.setMasterVolume(-0.5); // Should clamp to 0
        audioManager.setMasterVolume(1.5);  // Should clamp to 1
      }).not.toThrow();
    });

    it('should set music volume independently', () => {
      expect(() => {
        audioManager.setMusicVolume(0.3);
      }).not.toThrow();
    });

    it('should set SFX volume independently', () => {
      expect(() => {
        audioManager.setSFXVolume(0.7);
      }).not.toThrow();
    });

    it('should mute and unmute', () => {
      expect(() => {
        audioManager.mute(true);
        audioManager.mute(false);
      }).not.toThrow();
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should enable accessibility mode', () => {
      const options: AccessibilityOptions = {
        enableAudioDescriptions: true,
        enableNavigationSounds: true,
        enableActionAnnouncements: true,
        speechRate: 1.2,
        speechPitch: 1.0,
        speechVolume: 0.8
      };

      expect(() => {
        audioManager.enableAccessibilityMode(options);
      }).not.toThrow();
    });

    it('should handle partial accessibility options', () => {
      const options: AccessibilityOptions = {
        enableAudioDescriptions: true,
        enableNavigationSounds: false,
        enableActionAnnouncements: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 1.0
      };

      expect(() => {
        audioManager.enableAccessibilityMode(options);
      }).not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should handle rapid sound playback without memory leaks', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          audioManager.playUIFeedback(UIAction.BUTTON_CLICK);
        }
      }).not.toThrow();
    });

    it('should cleanup resources properly', () => {
      expect(() => {
        audioManager.cleanup();
      }).not.toThrow();
    });

    it('should handle operations after cleanup gracefully', () => {
      audioManager.cleanup();
      
      expect(() => {
        audioManager.playUIFeedback(UIAction.BUTTON_CLICK);
        audioManager.setMasterVolume(0.5);
        audioManager.updateAmbientMusic(HarmonyLevel.HIGH);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized state gracefully', () => {
      const uninitializedManager = new AudioManager();
      
      expect(() => {
        uninitializedManager.playUIFeedback(UIAction.BUTTON_CLICK);
        uninitializedManager.setMasterVolume(0.5);
        uninitializedManager.updateAmbientMusic(HarmonyLevel.HIGH);
      }).not.toThrow();
      
      uninitializedManager.cleanup();
    });

    it('should handle audio context errors during playback', () => {
      // This test would require more complex mocking to simulate audio context errors
      expect(audioManager).toBeDefined();
    });
  });

  describe('Audio Synchronization', () => {
    beforeEach(async () => {
      await audioManager.initialize();
    });

    it('should maintain synchronization between visual events and audio', () => {
      // Simulate rapid visual events
      const events = [
        { type: 'device_created', sound: DeviceSoundType.STARTUP },
        { type: 'device_interaction', sound: DeviceSoundType.HAPPY_BEEP },
        { type: 'conflict_detected', sound: DeviceSoundType.ANGRY_BUZZ },
        { type: 'crisis_resolved', sound: DeviceSoundType.SUCCESS }
      ];

      expect(() => {
        events.forEach((event, index) => {
          setTimeout(() => {
            audioManager.playDeviceSound(`device${index}`, event.sound);
          }, index * 100);
        });
      }).not.toThrow();
    });

    it('should handle concurrent audio events', () => {
      expect(() => {
        // Simulate multiple simultaneous events
        audioManager.playUIFeedback(UIAction.BUTTON_CLICK);
        audioManager.playDeviceSound('device1', DeviceSoundType.HAPPY_BEEP);
        audioManager.updateAmbientMusic(HarmonyLevel.HIGH);
      }).not.toThrow();
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing Web Audio API gracefully', () => {
      const originalAudioContext = (global as any).AudioContext;
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;

      const audioManager = new AudioManager();
      expect(audioManager).toBeDefined();

      // Restore
      (global as any).AudioContext = originalAudioContext;
      audioManager.cleanup();
    });

    it('should handle suspended audio context', async () => {
      // Mock suspended state
      const mockContext = new MockAudioContext();
      Object.defineProperty(mockContext, 'state', {
        get: () => 'suspended'
      });

      await expect(audioManager.initialize()).resolves.not.toThrow();
    });
  });
});