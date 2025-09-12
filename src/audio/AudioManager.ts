import { 
  AudioManager as IAudioManager, 
  DeviceSoundType, 
  HarmonyLevel, 
  UIAction, 
  AccessibilityOptions,
  AudioConfig,
  AudioContext as GameAudioContext,
  AudioAsset,
  AudioLoadingProgress,
  AudioCategory
} from '../types/audio';
import { PersonalityTrait } from '../types/core';
import { DeviceSoundEngine } from './DeviceSoundEngine';
import { DynamicMusicSystem } from './DynamicMusicSystem';
import { AccessibilityAudioSystem } from './AccessibilityAudioSystem';

export class AudioManager implements IAudioManager {
  private audioContext: GameAudioContext;
  private deviceSoundEngine: DeviceSoundEngine;
  private musicSystem: DynamicMusicSystem;
  private accessibilitySystem: AccessibilityAudioSystem;
  private config: AudioConfig;
  private audioAssets: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
  private initialized = false;

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = {
      masterVolume: 0.8,
      musicVolume: 0.6,
      sfxVolume: 0.8,
      voiceVolume: 1.0,
      enableReverb: true,
      enableCompression: true,
      sampleRate: 44100,
      bufferSize: 4096,
      ...config
    };

    this.initializeAudioContext();
    this.deviceSoundEngine = new DeviceSoundEngine(this.audioContext);
    this.musicSystem = new DynamicMusicSystem(this.audioContext);
    this.accessibilitySystem = new AccessibilityAudioSystem(this.audioContext);
  }

  private initializeAudioContext(): void {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate
      });

      // Create gain nodes for volume control
      const masterGain = context.createGain();
      const musicGain = context.createGain();
      const sfxGain = context.createGain();
      const voiceGain = context.createGain();

      // Create compressor for dynamic range control
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, context.currentTime);
      compressor.knee.setValueAtTime(30, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0.003, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);

      // Connect audio graph
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      voiceGain.connect(masterGain);

      if (this.config.enableCompression) {
        masterGain.connect(compressor);
        compressor.connect(context.destination);
      } else {
        masterGain.connect(context.destination);
      }

      // Set initial volumes
      masterGain.gain.setValueAtTime(this.config.masterVolume, context.currentTime);
      musicGain.gain.setValueAtTime(this.config.musicVolume, context.currentTime);
      sfxGain.gain.setValueAtTime(this.config.sfxVolume, context.currentTime);
      voiceGain.gain.setValueAtTime(this.config.voiceVolume, context.currentTime);

      this.audioContext = {
        context,
        masterGain,
        musicGain,
        sfxGain,
        voiceGain,
        compressor
      };

      // Add reverb if enabled
      if (this.config.enableReverb) {
        this.createReverbNode();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      this.initialized = false;
    }
  }

  private async createReverbNode(): Promise<void> {
    try {
      const convolver = this.audioContext.context.createConvolver();
      
      // Create impulse response for reverb
      const length = this.audioContext.context.sampleRate * 2; // 2 seconds
      const impulse = this.audioContext.context.createBuffer(2, length, this.audioContext.context.sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = Math.pow(1 - i / length, 2);
          channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
        }
      }
      
      convolver.buffer = impulse;
      this.audioContext.reverb = convolver;
      
      // Connect reverb to the audio graph
      const reverbGain = this.audioContext.context.createGain();
      reverbGain.gain.setValueAtTime(0.2, this.audioContext.context.currentTime);
      
      this.audioContext.sfxGain.connect(convolver);
      convolver.connect(reverbGain);
      reverbGain.connect(this.audioContext.masterGain);
    } catch (error) {
      console.warn('Failed to create reverb node:', error);
    }
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Audio context failed to initialize');
    }

    // Resume audio context if suspended (required by browser autoplay policies)
    if (this.audioContext.context.state === 'suspended') {
      await this.audioContext.context.resume();
    }

    // Load essential audio assets
    await this.loadEssentialAssets();
  }

  private async loadEssentialAssets(): Promise<void> {
    const essentialAssets: AudioAsset[] = [
      // UI sounds
      { id: 'ui_click', url: '/audio/ui/click.wav', type: 'sound_effect' as any, preload: true, volume: 0.8, category: AudioCategory.UI_SOUNDS },
      { id: 'ui_hover', url: '/audio/ui/hover.wav', type: 'sound_effect' as any, preload: true, volume: 0.6, category: AudioCategory.UI_SOUNDS },
      { id: 'ui_success', url: '/audio/ui/success.wav', type: 'sound_effect' as any, preload: true, volume: 0.9, category: AudioCategory.UI_SOUNDS },
      { id: 'ui_error', url: '/audio/ui/error.wav', type: 'sound_effect' as any, preload: true, volume: 0.8, category: AudioCategory.UI_SOUNDS },
      
      // Device sounds
      { id: 'device_happy', url: '/audio/devices/happy_beep.wav', type: 'sound_effect' as any, preload: true, volume: 0.7, category: AudioCategory.DEVICE_SOUNDS },
      { id: 'device_worried', url: '/audio/devices/worried_hum.wav', type: 'sound_effect' as any, preload: true, volume: 0.6, category: AudioCategory.DEVICE_SOUNDS },
      { id: 'device_angry', url: '/audio/devices/angry_buzz.wav', type: 'sound_effect' as any, preload: true, volume: 0.8, category: AudioCategory.DEVICE_SOUNDS },
      
      // Music
      { id: 'ambient_peaceful', url: '/audio/music/ambient_peaceful.mp3', type: 'music_track' as any, preload: true, volume: 0.5, category: AudioCategory.MUSIC },
      { id: 'ambient_tense', url: '/audio/music/ambient_tense.mp3', type: 'music_track' as any, preload: true, volume: 0.6, category: AudioCategory.MUSIC }
    ];

    const loadPromises = essentialAssets.map(asset => this.loadAudioAsset(asset));
    await Promise.all(loadPromises);
  }

  private async loadAudioAsset(asset: AudioAsset): Promise<void> {
    if (this.audioAssets.has(asset.id)) {
      return; // Already loaded
    }

    if (this.loadingPromises.has(asset.id)) {
      await this.loadingPromises.get(asset.id);
      return;
    }

    const loadPromise = this.fetchAndDecodeAudio(asset.url);
    this.loadingPromises.set(asset.id, loadPromise);

    try {
      const audioBuffer = await loadPromise;
      this.audioAssets.set(asset.id, audioBuffer);
      this.loadingPromises.delete(asset.id);
    } catch (error) {
      console.error(`Failed to load audio asset ${asset.id}:`, error);
      this.loadingPromises.delete(asset.id);
      throw error;
    }
  }

  private async fetchAndDecodeAudio(url: string): Promise<AudioBuffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.context.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      // Fallback: create a simple tone for missing audio files
      console.warn(`Audio file not found: ${url}, creating fallback tone`);
      return this.createFallbackTone();
    }
  }

  private createFallbackTone(frequency = 440, duration = 0.2): AudioBuffer {
    const sampleRate = this.audioContext.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
    }

    return buffer;
  }

  playDeviceSound(deviceId: string, soundType: DeviceSoundType, personality?: PersonalityTrait): void {
    if (!this.initialized) return;

    this.deviceSoundEngine.playDeviceSound(deviceId, soundType, personality);
  }

  updateAmbientMusic(harmonyLevel: HarmonyLevel): void {
    if (!this.initialized) return;

    this.musicSystem.updateHarmonyLevel(harmonyLevel);
  }

  playUIFeedback(action: UIAction): void {
    if (!this.initialized) return;

    const soundMap: { [key in UIAction]?: string } = {
      [UIAction.BUTTON_CLICK]: 'ui_click',
      [UIAction.BUTTON_HOVER]: 'ui_hover',
      [UIAction.SUCCESS]: 'ui_success',
      [UIAction.ERROR]: 'ui_error',
      [UIAction.ACHIEVEMENT]: 'ui_success',
      [UIAction.DRAG_DROP]: 'ui_click',
      [UIAction.DRAG_INVALID]: 'ui_error'
    };

    const soundId = soundMap[action];
    if (soundId) {
      this.playSound(soundId, this.audioContext.sfxGain);
    }
  }

  private playSound(soundId: string, gainNode: GainNode, options: { volume?: number; pitch?: number; loop?: boolean } = {}): void {
    const audioBuffer = this.audioAssets.get(soundId);
    if (!audioBuffer) {
      console.warn(`Audio asset not found: ${soundId}`);
      return;
    }

    const source = this.audioContext.context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = options.loop || false;

    // Apply pitch shifting if specified
    if (options.pitch && options.pitch !== 1.0) {
      source.playbackRate.setValueAtTime(options.pitch, this.audioContext.context.currentTime);
    }

    // Apply volume if specified
    if (options.volume && options.volume !== 1.0) {
      const volumeGain = this.audioContext.context.createGain();
      volumeGain.gain.setValueAtTime(options.volume, this.audioContext.context.currentTime);
      source.connect(volumeGain);
      volumeGain.connect(gainNode);
    } else {
      source.connect(gainNode);
    }

    source.start();
  }

  enableAccessibilityMode(options: AccessibilityOptions): void {
    this.accessibilitySystem.configure(options);
  }

  setMasterVolume(volume: number): void {
    if (!this.initialized) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.config.masterVolume = clampedVolume;
    this.audioContext.masterGain.gain.setValueAtTime(clampedVolume, this.audioContext.context.currentTime);
  }

  setMusicVolume(volume: number): void {
    if (!this.initialized) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.config.musicVolume = clampedVolume;
    this.audioContext.musicGain.gain.setValueAtTime(clampedVolume, this.audioContext.context.currentTime);
  }

  setSFXVolume(volume: number): void {
    if (!this.initialized) return;
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.config.sfxVolume = clampedVolume;
    this.audioContext.sfxGain.gain.setValueAtTime(clampedVolume, this.audioContext.context.currentTime);
  }

  mute(muted: boolean): void {
    if (!this.initialized) return;
    
    const volume = muted ? 0 : this.config.masterVolume;
    this.audioContext.masterGain.gain.setValueAtTime(volume, this.audioContext.context.currentTime);
  }

  getAudioBuffer(assetId: string): AudioBuffer | undefined {
    return this.audioAssets.get(assetId);
  }

  getAudioContext(): GameAudioContext {
    return this.audioContext;
  }

  cleanup(): void {
    if (this.audioContext?.context) {
      this.audioContext.context.close();
    }
    this.audioAssets.clear();
    this.loadingPromises.clear();
    this.initialized = false;
  }

  public playInteractionSound(interaction: any): void {
    console.log('Playing interaction sound for:', interaction);
  }

  public playStorySound(moment: any): void {
    console.log('Playing story sound for moment:', moment);
  }

  public playCrisisSound(crisis: any): void {
    console.log('Playing crisis sound:', crisis);
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('AudioManager accessibility settings applied:', settings);
    if (settings.audioDescriptions) {
      console.log('Audio descriptions enabled');
    }
  }
}