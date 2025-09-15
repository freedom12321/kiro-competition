import { DeviceSoundEngine } from '../../src/audio/DeviceSoundEngine';
import { PersonalityTrait, EmotionState, CrisisType } from '../../src/types/core.js';
import { InteractionType, AudioContext as GameAudioContext } from '../../src/types/audio.js';

// Mock Web Audio API components
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
      loop: false,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    };
  }
  
  createGain() {
    return {
      gain: { setValueAtTime: jest.fn() },
      connect: jest.fn()
    };
  }
}

describe('DeviceSoundEngine', () => {
  let deviceSoundEngine: DeviceSoundEngine;
  let mockAudioContext: GameAudioContext;

  beforeEach(() => {
    const context = new MockAudioContext();
    mockAudioContext = {
      context: context as any,
      masterGain: context.createGain() as any,
      musicGain: context.createGain() as any,
      sfxGain: context.createGain() as any,
      voiceGain: context.createGain() as any,
      compressor: {} as any
    };
    
    deviceSoundEngine = new DeviceSoundEngine(mockAudioContext);
  });

  describe('Personality Sound Generation', () => {
    it('should generate unique sounds for different personalities', () => {
      const helpfulSound = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.HELPFUL, 
        EmotionState.HAPPY
      );
      const stubbornSound = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.STUBBORN, 
        EmotionState.HAPPY
      );

      expect(helpfulSound).toBeDefined();
      expect(stubbornSound).toBeDefined();
      expect(helpfulSound.id).not.toBe(stubbornSound.id);
    });

    it('should generate different sounds for different emotions', () => {
      const happySound = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.HELPFUL, 
        EmotionState.HAPPY
      );
      const angrySound = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.HELPFUL, 
        EmotionState.ANGRY
      );

      expect(happySound.volume).not.toBe(angrySound.volume);
      expect(happySound.pitch).not.toBe(angrySound.pitch);
    });

    it('should cache generated sounds', () => {
      const sound1 = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.HELPFUL, 
        EmotionState.HAPPY
      );
      const sound2 = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.HELPFUL, 
        EmotionState.HAPPY
      );

      expect(sound1).toBe(sound2); // Should return cached instance
    });

    it('should generate sounds for all personality traits', () => {
      const personalities = [
        PersonalityTrait.HELPFUL,
        PersonalityTrait.STUBBORN,
        PersonalityTrait.ANXIOUS,
        PersonalityTrait.OVERCONFIDENT,
        PersonalityTrait.COOPERATIVE,
        PersonalityTrait.COMPETITIVE
      ];

      personalities.forEach(personality => {
        expect(() => {
          const sound = deviceSoundEngine.generatePersonalitySound(personality, EmotionState.NEUTRAL);
          expect(sound).toBeDefined();
          expect(sound.audioBuffer).toBeDefined();
          expect(sound.duration).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });

    it('should generate sounds for all emotion states', () => {
      const emotions = [
        EmotionState.HAPPY,
        EmotionState.NEUTRAL,
        EmotionState.CONFUSED,
        EmotionState.FRUSTRATED,
        EmotionState.EXCITED,
        EmotionState.WORRIED,
        EmotionState.ANGRY
      ];

      emotions.forEach(emotion => {
        expect(() => {
          const sound = deviceSoundEngine.generatePersonalitySound(PersonalityTrait.HELPFUL, emotion);
          expect(sound).toBeDefined();
          expect(sound.audioBuffer).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Interaction Sound Generation', () => {
    it('should play interaction sounds', () => {
      expect(() => {
        deviceSoundEngine.playInteractionSound(InteractionType.DEVICE_DISCOVERY);
      }).not.toThrow();
    });

    it('should handle all interaction types', () => {
      const interactions = [
        InteractionType.DEVICE_DISCOVERY,
        InteractionType.COOPERATION_START,
        InteractionType.COOPERATION_SUCCESS,
        InteractionType.CONFLICT_START,
        InteractionType.CONFLICT_ESCALATION,
        InteractionType.COMMUNICATION,
        InteractionType.RESOURCE_SHARING,
        InteractionType.LEARNING
      ];

      interactions.forEach(interaction => {
        expect(() => {
          deviceSoundEngine.playInteractionSound(interaction);
        }).not.toThrow();
      });
    });
  });

  describe('Cooperation Sound Generation', () => {
    it('should create cooperation chimes for multiple devices', () => {
      const deviceIds = ['device1', 'device2', 'device3'];
      const chime = deviceSoundEngine.createCooperationChime(deviceIds);

      expect(chime).toBeDefined();
      expect(chime.deviceCount).toBe(3);
      expect(chime.harmonyType).toBeDefined();
      expect(chime.audioBuffer).toBeDefined();
    });

    it('should create different chimes for different device counts', () => {
      const twoDeviceChime = deviceSoundEngine.createCooperationChime(['device1', 'device2']);
      const fiveDeviceChime = deviceSoundEngine.createCooperationChime([
        'device1', 'device2', 'device3', 'device4', 'device5'
      ]);

      expect(twoDeviceChime.deviceCount).toBe(2);
      expect(fiveDeviceChime.deviceCount).toBe(5);
      expect(twoDeviceChime.id).not.toBe(fiveDeviceChime.id);
    });

    it('should handle single device cooperation', () => {
      const singleDeviceChime = deviceSoundEngine.createCooperationChime(['device1']);
      
      expect(singleDeviceChime).toBeDefined();
      expect(singleDeviceChime.deviceCount).toBe(1);
    });

    it('should handle empty device list gracefully', () => {
      const emptyChime = deviceSoundEngine.createCooperationChime([]);
      
      expect(emptyChime).toBeDefined();
      expect(emptyChime.deviceCount).toBe(0);
    });
  });

  describe('Conflict Sound Generation', () => {
    it('should generate conflict sounds for different crisis types', () => {
      const crisisTypes = [
        CrisisType.FEEDBACK_LOOP,
        CrisisType.AUTHORITY_CONFLICT,
        CrisisType.PRIVACY_PARADOX,
        CrisisType.RESOURCE_EXHAUSTION,
        CrisisType.COMMUNICATION_BREAKDOWN
      ];

      crisisTypes.forEach(crisisType => {
        expect(() => {
          const conflictSound = deviceSoundEngine.generateConflictSound(crisisType, 0.5);
          expect(conflictSound).toBeDefined();
          expect(conflictSound.dissonanceType).toBeDefined();
          expect(conflictSound.conflictIntensity).toBe(0.5);
        }).not.toThrow();
      });
    });

    it('should scale sound intensity with severity', () => {
      const lowSeveritySound = deviceSoundEngine.generateConflictSound(
        CrisisType.AUTHORITY_CONFLICT, 
        0.2
      );
      const highSeveritySound = deviceSoundEngine.generateConflictSound(
        CrisisType.AUTHORITY_CONFLICT, 
        0.9
      );

      expect(lowSeveritySound.volume).toBeLessThan(highSeveritySound.volume);
      expect(lowSeveritySound.duration).toBeLessThan(highSeveritySound.duration);
    });

    it('should clamp severity values', () => {
      expect(() => {
        const negativeSound = deviceSoundEngine.generateConflictSound(
          CrisisType.FEEDBACK_LOOP, 
          -0.5
        );
        const excessiveSound = deviceSoundEngine.generateConflictSound(
          CrisisType.FEEDBACK_LOOP, 
          2.0
        );
        
        expect(negativeSound).toBeDefined();
        expect(excessiveSound).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Device Idle Sounds', () => {
    it('should play idle sounds for devices', () => {
      expect(() => {
        deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.HELPFUL);
      }).not.toThrow();
    });

    it('should stop existing idle sound when starting new one', () => {
      expect(() => {
        deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.HELPFUL);
        deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.STUBBORN);
      }).not.toThrow();
    });

    it('should handle multiple devices with idle sounds', () => {
      expect(() => {
        deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.HELPFUL);
        deviceSoundEngine.playDeviceIdleSound('device2', PersonalityTrait.ANXIOUS);
        deviceSoundEngine.playDeviceIdleSound('device3', PersonalityTrait.COMPETITIVE);
      }).not.toThrow();
    });

    it('should stop specific device sounds', () => {
      deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.HELPFUL);
      
      expect(() => {
        deviceSoundEngine.stopDeviceSound('device1');
      }).not.toThrow();
    });

    it('should stop all device sounds', () => {
      deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.HELPFUL);
      deviceSoundEngine.playDeviceIdleSound('device2', PersonalityTrait.ANXIOUS);
      
      expect(() => {
        deviceSoundEngine.stopAllSounds();
      }).not.toThrow();
    });
  });

  describe('Sound Quality and Characteristics', () => {
    it('should generate sounds with appropriate frequency ranges', () => {
      const personalities = [PersonalityTrait.HELPFUL, PersonalityTrait.STUBBORN, PersonalityTrait.ANXIOUS];
      
      personalities.forEach(personality => {
        const sound = deviceSoundEngine.generatePersonalitySound(personality, EmotionState.NEUTRAL);
        expect(sound.duration).toBeGreaterThan(0);
        expect(sound.duration).toBeLessThan(2); // Reasonable duration
        expect(sound.volume).toBeGreaterThan(0);
        expect(sound.volume).toBeLessThanOrEqual(1);
      });
    });

    it('should apply appropriate envelopes to sounds', () => {
      const sound = deviceSoundEngine.generatePersonalitySound(
        PersonalityTrait.HELPFUL, 
        EmotionState.HAPPY
      );
      
      expect(sound.fadeIn).toBeDefined();
      expect(sound.fadeOut).toBeDefined();
      expect(sound.fadeIn).toBeGreaterThan(0);
      expect(sound.fadeOut).toBeGreaterThan(0);
    });

    it('should generate harmonious frequencies for cooperation', () => {
      const chime = deviceSoundEngine.createCooperationChime(['device1', 'device2', 'device3']);
      
      expect(chime.resonanceFrequency).toBeGreaterThan(0);
      expect(chime.harmonyType).toBeDefined();
    });

    it('should generate dissonant frequencies for conflicts', () => {
      const conflictSound = deviceSoundEngine.generateConflictSound(
        CrisisType.AUTHORITY_CONFLICT, 
        0.7
      );
      
      expect(conflictSound.dissonanceType).toBeDefined();
      expect(conflictSound.chaosLevel).toBe(0.7);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid sound generation without memory leaks', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          deviceSoundEngine.generatePersonalitySound(
            PersonalityTrait.HELPFUL, 
            EmotionState.HAPPY
          );
        }
      }).not.toThrow();
    });

    it('should reuse cached sounds efficiently', () => {
      const startTime = performance.now();
      
      // First generation (should cache)
      deviceSoundEngine.generatePersonalitySound(PersonalityTrait.HELPFUL, EmotionState.HAPPY);
      
      const firstGenTime = performance.now() - startTime;
      const cacheStartTime = performance.now();
      
      // Second generation (should use cache)
      deviceSoundEngine.generatePersonalitySound(PersonalityTrait.HELPFUL, EmotionState.HAPPY);
      
      const cacheTime = performance.now() - cacheStartTime;
      
      // Cache access should be significantly faster
      expect(cacheTime).toBeLessThan(firstGenTime);
    });

    it('should handle concurrent sound playback', () => {
      expect(() => {
        // Simulate multiple simultaneous sounds
        for (let i = 0; i < 10; i++) {
          deviceSoundEngine.playInteractionSound(InteractionType.COMMUNICATION);
          deviceSoundEngine.playDeviceIdleSound(`device${i}`, PersonalityTrait.HELPFUL);
        }
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid device IDs gracefully', () => {
      expect(() => {
        deviceSoundEngine.stopDeviceSound('nonexistent-device');
      }).not.toThrow();
    });

    it('should handle audio buffer creation failures', () => {
      // Mock createBuffer to return null
      const originalCreateBuffer = mockAudioContext.context.createBuffer;
      mockAudioContext.context.createBuffer = jest.fn(() => null);
      
      expect(() => {
        deviceSoundEngine.generatePersonalitySound(PersonalityTrait.HELPFUL, EmotionState.HAPPY);
      }).not.toThrow();
      
      // Restore original method
      mockAudioContext.context.createBuffer = originalCreateBuffer;
    });

    it('should handle audio source creation failures', () => {
      // Mock createBufferSource to return null
      const originalCreateBufferSource = mockAudioContext.context.createBufferSource;
      mockAudioContext.context.createBufferSource = jest.fn(() => null);
      
      expect(() => {
        deviceSoundEngine.playInteractionSound(InteractionType.DEVICE_DISCOVERY);
      }).not.toThrow();
      
      // Restore original method
      mockAudioContext.context.createBufferSource = originalCreateBufferSource;
    });
  });

  describe('Audio Synchronization', () => {
    it('should maintain timing consistency across multiple sounds', () => {
      const sounds = [];
      const startTime = performance.now();
      
      // Generate multiple sounds rapidly
      for (let i = 0; i < 5; i++) {
        const sound = deviceSoundEngine.generatePersonalitySound(
          PersonalityTrait.HELPFUL, 
          EmotionState.HAPPY
        );
        sounds.push({ sound, timestamp: performance.now() - startTime });
      }
      
      // All sounds should be generated within reasonable time
      sounds.forEach(({ sound, timestamp }) => {
        expect(sound).toBeDefined();
        expect(timestamp).toBeLessThan(100); // Should be fast
      });
    });

    it('should handle overlapping sound playback', () => {
      expect(() => {
        // Start multiple overlapping sounds
        deviceSoundEngine.playDeviceIdleSound('device1', PersonalityTrait.HELPFUL);
        deviceSoundEngine.playInteractionSound(InteractionType.COOPERATION_START);
        deviceSoundEngine.createCooperationChime(['device1', 'device2']);
      }).not.toThrow();
    });
  });
});