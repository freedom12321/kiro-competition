import {
  DeviceSoundEngine as IDeviceSoundEngine,
  SoundEffect,
  HarmonySound,
  DissonanceSound,
  DeviceSoundType,
  InteractionType,
  HarmonyType,
  DissonanceType,
  AudioContext as GameAudioContext
} from '../types/audio';
import { PersonalityTrait, EmotionState, CrisisType } from '../types/core';

export class DeviceSoundEngine implements IDeviceSoundEngine {
  private audioContext: GameAudioContext;
  private activeSounds: Map<string, AudioBufferSourceNode> = new Map();
  private personalitySoundCache: Map<string, SoundEffect> = new Map();

  constructor(audioContext: GameAudioContext) {
    this.audioContext = audioContext;
  }

  generatePersonalitySound(personality: PersonalityTrait, emotion: EmotionState): SoundEffect {
    const cacheKey = `${personality}_${emotion}`;
    
    if (this.personalitySoundCache.has(cacheKey)) {
      return this.personalitySoundCache.get(cacheKey)!;
    }

    const soundEffect = this.createPersonalitySound(personality, emotion);
    this.personalitySoundCache.set(cacheKey, soundEffect);
    return soundEffect;
  }

  private createPersonalitySound(personality: PersonalityTrait, emotion: EmotionState): SoundEffect {
    const baseFrequency = this.getPersonalityBaseFrequency(personality);
    const emotionModifier = this.getEmotionModifier(emotion);
    const duration = this.getPersonalityDuration(personality);

    // Create audio buffer for the sound
    const sampleRate = this.audioContext.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const audioBuffer = this.audioContext.context.createBuffer(1, length, sampleRate);
    const data = audioBuffer.getChannelData(0);

    // Generate waveform based on personality and emotion
    this.generateWaveform(data, baseFrequency * emotionModifier.pitch, duration, personality, emotion);

    return {
      id: `${personality}_${emotion}`,
      audioBuffer,
      volume: emotionModifier.volume,
      pitch: emotionModifier.pitch,
      duration,
      loop: false,
      fadeIn: 0.05,
      fadeOut: 0.1
    };
  }

  private getPersonalityBaseFrequency(personality: PersonalityTrait): number {
    const frequencyMap: { [key in PersonalityTrait]: number } = {
      [PersonalityTrait.HELPFUL]: 523.25,      // C5 - bright, helpful
      [PersonalityTrait.STUBBORN]: 293.66,     // D4 - lower, persistent
      [PersonalityTrait.ANXIOUS]: 659.25,      // E5 - higher, nervous
      [PersonalityTrait.OVERCONFIDENT]: 440.00, // A4 - bold, confident
      [PersonalityTrait.COOPERATIVE]: 392.00,   // G4 - harmonious
      [PersonalityTrait.COMPETITIVE]: 349.23    // F4 - assertive
    };

    return frequencyMap[personality] || 440.00;
  }

  private getEmotionModifier(emotion: EmotionState): { pitch: number; volume: number; timbre: string } {
    const modifierMap: { [key in EmotionState]: { pitch: number; volume: number; timbre: string } } = {
      [EmotionState.HAPPY]: { pitch: 1.2, volume: 0.8, timbre: 'bright' },
      [EmotionState.NEUTRAL]: { pitch: 1.0, volume: 0.6, timbre: 'clean' },
      [EmotionState.CONFUSED]: { pitch: 0.9, volume: 0.5, timbre: 'warbled' },
      [EmotionState.FRUSTRATED]: { pitch: 0.8, volume: 0.9, timbre: 'harsh' },
      [EmotionState.EXCITED]: { pitch: 1.4, volume: 0.9, timbre: 'energetic' },
      [EmotionState.WORRIED]: { pitch: 1.1, volume: 0.4, timbre: 'tremolo' },
      [EmotionState.ANGRY]: { pitch: 0.7, volume: 1.0, timbre: 'distorted' }
    };

    return modifierMap[emotion] || modifierMap[EmotionState.NEUTRAL];
  }

  private getPersonalityDuration(personality: PersonalityTrait): number {
    const durationMap: { [key in PersonalityTrait]: number } = {
      [PersonalityTrait.HELPFUL]: 0.3,
      [PersonalityTrait.STUBBORN]: 0.8,
      [PersonalityTrait.ANXIOUS]: 0.2,
      [PersonalityTrait.OVERCONFIDENT]: 0.5,
      [PersonalityTrait.COOPERATIVE]: 0.4,
      [PersonalityTrait.COMPETITIVE]: 0.6
    };

    return durationMap[personality] || 0.3;
  }

  private generateWaveform(
    data: Float32Array, 
    frequency: number, 
    duration: number, 
    personality: PersonalityTrait, 
    emotion: EmotionState
  ): void {
    const sampleRate = this.audioContext.context.sampleRate;
    const emotionModifier = this.getEmotionModifier(emotion);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const phase = 2 * Math.PI * frequency * t;
      
      let sample = 0;

      // Base waveform based on personality
      switch (personality) {
        case PersonalityTrait.HELPFUL:
          sample = Math.sin(phase) * 0.8; // Pure sine wave
          break;
        case PersonalityTrait.STUBBORN:
          sample = Math.sign(Math.sin(phase)) * 0.6; // Square wave
          break;
        case PersonalityTrait.ANXIOUS:
          sample = Math.sin(phase + Math.sin(phase * 8) * 0.3) * 0.7; // Vibrato
          break;
        case PersonalityTrait.OVERCONFIDENT:
          sample = Math.sin(phase) + Math.sin(phase * 2) * 0.3; // Harmonic
          break;
        case PersonalityTrait.COOPERATIVE:
          sample = (Math.sin(phase) + Math.sin(phase * 1.5)) * 0.4; // Chord
          break;
        case PersonalityTrait.COMPETITIVE:
          sample = Math.sin(phase) * (1 + Math.sin(phase * 0.5) * 0.2); // AM modulation
          break;
        default:
          sample = Math.sin(phase) * 0.6;
      }

      // Apply emotion-based modifications
      switch (emotionModifier.timbre) {
        case 'warbled':
          sample *= (1 + Math.sin(t * 20) * 0.3);
          break;
        case 'harsh':
          sample = Math.tanh(sample * 3) * 0.7;
          break;
        case 'tremolo':
          sample *= (1 + Math.sin(t * 8) * 0.4);
          break;
        case 'distorted':
          sample = Math.tanh(sample * 5) * 0.8;
          break;
        case 'energetic':
          sample += Math.sin(phase * 3) * 0.2;
          break;
      }

      // Apply envelope (fade in/out)
      const fadeInTime = 0.05;
      const fadeOutTime = 0.1;
      let envelope = 1;

      if (t < fadeInTime) {
        envelope = t / fadeInTime;
      } else if (t > duration - fadeOutTime) {
        envelope = (duration - t) / fadeOutTime;
      }

      data[i] = sample * envelope * emotionModifier.volume;
    }
  }

  playInteractionSound(interaction: InteractionType): void {
    const soundParams = this.getInteractionSoundParams(interaction);
    this.playGeneratedSound(soundParams);
  }

  private getInteractionSoundParams(interaction: InteractionType): {
    frequency: number;
    duration: number;
    waveform: string;
    volume: number;
  } {
    const paramMap: { [key in InteractionType]: any } = {
      [InteractionType.DEVICE_DISCOVERY]: { frequency: 880, duration: 0.2, waveform: 'sine', volume: 0.6 },
      [InteractionType.COOPERATION_START]: { frequency: 523, duration: 0.3, waveform: 'chord', volume: 0.7 },
      [InteractionType.COOPERATION_SUCCESS]: { frequency: 659, duration: 0.5, waveform: 'harmony', volume: 0.8 },
      [InteractionType.CONFLICT_START]: { frequency: 220, duration: 0.4, waveform: 'dissonance', volume: 0.7 },
      [InteractionType.CONFLICT_ESCALATION]: { frequency: 185, duration: 0.6, waveform: 'harsh', volume: 0.9 },
      [InteractionType.COMMUNICATION]: { frequency: 440, duration: 0.15, waveform: 'pulse', volume: 0.5 },
      [InteractionType.RESOURCE_SHARING]: { frequency: 392, duration: 0.25, waveform: 'warm', volume: 0.6 },
      [InteractionType.LEARNING]: { frequency: 698, duration: 0.3, waveform: 'evolving', volume: 0.6 }
    };

    return paramMap[interaction] || { frequency: 440, duration: 0.2, waveform: 'sine', volume: 0.5 };
  }

  createCooperationChime(deviceIds: string[]): HarmonySound {
    const deviceCount = deviceIds.length;
    const baseFrequency = 523.25; // C5
    const duration = 0.8;

    // Create harmonious chord based on device count
    const frequencies = this.generateHarmoniousFrequencies(baseFrequency, deviceCount);
    const audioBuffer = this.createChordBuffer(frequencies, duration);

    return {
      id: `cooperation_${deviceIds.join('_')}`,
      audioBuffer,
      volume: 0.7,
      pitch: 1.0,
      duration,
      loop: false,
      harmonyType: HarmonyType.COOPERATIVE,
      deviceCount,
      resonanceFrequency: baseFrequency
    };
  }

  generateConflictSound(conflictType: CrisisType, severity: number): DissonanceSound {
    const baseFrequency = 220; // A3
    const duration = Math.min(0.3 + severity * 0.5, 2.0);
    
    const dissonanceParams = this.getDissonanceParams(conflictType);
    const audioBuffer = this.createDissonanceBuffer(baseFrequency, duration, dissonanceParams, severity);

    return {
      id: `conflict_${conflictType}_${severity}`,
      audioBuffer,
      volume: Math.min(0.5 + severity * 0.3, 1.0),
      pitch: 1.0,
      duration,
      loop: false,
      dissonanceType: this.mapCrisisToDissonance(conflictType),
      conflictIntensity: severity,
      chaosLevel: severity
    };
  }

  private generateHarmoniousFrequencies(baseFreq: number, count: number): number[] {
    const harmonicRatios = [1, 5/4, 3/2, 2, 9/4, 3, 4]; // Major chord extensions
    const frequencies: number[] = [];

    for (let i = 0; i < Math.min(count, harmonicRatios.length); i++) {
      frequencies.push(baseFreq * harmonicRatios[i]);
    }

    return frequencies;
  }

  private createChordBuffer(frequencies: number[], duration: number): AudioBuffer {
    const sampleRate = this.audioContext.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const audioBuffer = this.audioContext.context.createBuffer(1, length, sampleRate);
    const data = audioBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Sum all frequencies with equal weight
      frequencies.forEach(freq => {
        sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length;
      });

      // Apply envelope
      const envelope = this.calculateEnvelope(t, duration, 0.1, 0.2);
      data[i] = sample * envelope * 0.6;
    }

    return audioBuffer;
  }

  private getDissonanceParams(conflictType: CrisisType): {
    intervals: number[];
    modulation: number;
    harshness: number;
  } {
    const paramMap: { [key in CrisisType]: any } = {
      [CrisisType.FEEDBACK_LOOP]: { intervals: [1, 1.1, 1.21], modulation: 0.8, harshness: 0.7 },
      [CrisisType.AUTHORITY_CONFLICT]: { intervals: [1, 1.414], modulation: 0.3, harshness: 0.9 },
      [CrisisType.PRIVACY_PARADOX]: { intervals: [1, 1.618], modulation: 0.6, harshness: 0.5 },
      [CrisisType.RESOURCE_EXHAUSTION]: { intervals: [1, 0.9, 0.8], modulation: 0.4, harshness: 0.8 },
      [CrisisType.COMMUNICATION_BREAKDOWN]: { intervals: [1, 1.3, 1.7], modulation: 0.9, harshness: 0.6 }
    };

    return paramMap[conflictType] || { intervals: [1, 1.2], modulation: 0.5, harshness: 0.7 };
  }

  private createDissonanceBuffer(
    baseFreq: number, 
    duration: number, 
    params: any, 
    severity: number
  ): AudioBuffer {
    const sampleRate = this.audioContext.context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const audioBuffer = this.audioContext.context.createBuffer(1, length, sampleRate);
    const data = audioBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Generate dissonant intervals
      params.intervals.forEach((interval: number) => {
        const freq = baseFreq * interval;
        sample += Math.sin(2 * Math.PI * freq * t) / params.intervals.length;
      });

      // Apply modulation based on conflict type
      if (params.modulation > 0) {
        sample *= (1 + Math.sin(t * 10 * params.modulation) * 0.3);
      }

      // Apply harshness (distortion)
      if (params.harshness > 0) {
        sample = Math.tanh(sample * (1 + params.harshness * severity)) * 0.8;
      }

      // Apply envelope
      const envelope = this.calculateEnvelope(t, duration, 0.05, 0.15);
      data[i] = sample * envelope * (0.4 + severity * 0.4);
    }

    return audioBuffer;
  }

  private mapCrisisToDissonance(crisisType: CrisisType): DissonanceType {
    const mapping: { [key in CrisisType]: DissonanceType } = {
      [CrisisType.FEEDBACK_LOOP]: DissonanceType.FEEDBACK_LOOP,
      [CrisisType.AUTHORITY_CONFLICT]: DissonanceType.AUTHORITY_CLASH,
      [CrisisType.PRIVACY_PARADOX]: DissonanceType.COMMUNICATION_NOISE,
      [CrisisType.RESOURCE_EXHAUSTION]: DissonanceType.RESOURCE_CONFLICT,
      [CrisisType.COMMUNICATION_BREAKDOWN]: DissonanceType.COMMUNICATION_NOISE
    };

    return mapping[crisisType] || DissonanceType.SYSTEM_OVERLOAD;
  }

  private calculateEnvelope(t: number, duration: number, attackTime: number, releaseTime: number): number {
    if (t < attackTime) {
      return t / attackTime;
    } else if (t > duration - releaseTime) {
      return (duration - t) / releaseTime;
    }
    return 1;
  }

  playDeviceIdleSound(deviceId: string, personality: PersonalityTrait): void {
    // Stop any existing idle sound for this device
    this.stopDeviceSound(deviceId);

    const idleSound = this.generateIdleSound(personality);
    const source = this.audioContext.context.createBufferSource();
    source.buffer = idleSound.audioBuffer;
    source.loop = true;

    const gainNode = this.audioContext.context.createGain();
    gainNode.gain.setValueAtTime(idleSound.volume * 0.3, this.audioContext.context.currentTime); // Quiet idle sounds

    source.connect(gainNode);
    gainNode.connect(this.audioContext.sfxGain);

    source.start();
    this.activeSounds.set(deviceId, source);
  }

  private generateIdleSound(personality: PersonalityTrait): SoundEffect {
    return this.generatePersonalitySound(personality, EmotionState.NEUTRAL);
  }

  private playGeneratedSound(params: any): void {
    const audioBuffer = this.createSimpleSound(params);
    const source = this.audioContext.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.sfxGain);
    source.start();
  }

  private createSimpleSound(params: any): AudioBuffer {
    const sampleRate = this.audioContext.context.sampleRate;
    const length = Math.floor(sampleRate * params.duration);
    const audioBuffer = this.audioContext.context.createBuffer(1, length, sampleRate);
    const data = audioBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const phase = 2 * Math.PI * params.frequency * t;
      
      let sample = Math.sin(phase);
      
      // Apply waveform modifications
      switch (params.waveform) {
        case 'chord':
          sample += Math.sin(phase * 1.25) * 0.5;
          break;
        case 'harmony':
          sample += Math.sin(phase * 1.5) * 0.3 + Math.sin(phase * 2) * 0.2;
          break;
        case 'dissonance':
          sample += Math.sin(phase * 1.1) * 0.8;
          break;
        case 'harsh':
          sample = Math.tanh(sample * 3);
          break;
        case 'pulse':
          sample = Math.sign(sample) * 0.5;
          break;
      }

      const envelope = this.calculateEnvelope(t, params.duration, 0.05, 0.1);
      data[i] = sample * envelope * params.volume;
    }

    return audioBuffer;
  }

  stopDeviceSound(deviceId: string): void {
    const source = this.activeSounds.get(deviceId);
    if (source) {
      source.stop();
      this.activeSounds.delete(deviceId);
    }
  }

  stopAllSounds(): void {
    this.activeSounds.forEach(source => source.stop());
    this.activeSounds.clear();
  }
}