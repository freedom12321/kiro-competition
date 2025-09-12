// Audio system types and interfaces
import { PersonalityTrait, EmotionState, EffectType, InteractionResult, CrisisType } from './core';

// Core audio interfaces
export interface AudioManager {
  playDeviceSound(deviceId: string, soundType: DeviceSoundType, personality?: PersonalityTrait): void;
  updateAmbientMusic(harmonyLevel: HarmonyLevel): void;
  playUIFeedback(action: UIAction): void;
  enableAccessibilityMode(options: AccessibilityOptions): void;
  setMasterVolume(volume: number): void;
  setMusicVolume(volume: number): void;
  setSFXVolume(volume: number): void;
  mute(muted: boolean): void;
  cleanup(): void;
}

export interface DeviceSoundEngine {
  generatePersonalitySound(personality: PersonalityTrait, emotion: EmotionState): SoundEffect;
  playInteractionSound(interaction: InteractionType): void;
  createCooperationChime(deviceIds: string[]): HarmonySound;
  generateConflictSound(conflictType: CrisisType, severity: number): DissonanceSound;
  playDeviceIdleSound(deviceId: string, personality: PersonalityTrait): void;
}

export interface DynamicMusicSystem {
  updateHarmonyLevel(level: HarmonyLevel): void;
  transitionToTrack(trackId: string, fadeTime?: number): void;
  addTensionLayer(intensity: number): void;
  removeTensionLayer(fadeTime?: number): void;
  playStinger(stingerType: StingerType): void;
}

export interface AccessibilityAudioSystem {
  announceAction(action: string): void;
  describeVisualElement(elementId: string): void;
  playNavigationSound(direction: NavigationDirection): void;
  enableAudioCues(enabled: boolean): void;
  setAnnouncementSpeed(speed: number): void;
}

// Sound effect types
export interface SoundEffect {
  id: string;
  audioBuffer: AudioBuffer;
  volume: number;
  pitch: number;
  duration: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export interface HarmonySound extends SoundEffect {
  harmonyType: HarmonyType;
  deviceCount: number;
  resonanceFrequency: number;
}

export interface DissonanceSound extends SoundEffect {
  dissonanceType: DissonanceType;
  conflictIntensity: number;
  chaosLevel: number;
}

export interface MusicTrack {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  bpm: number;
  key: string;
  mood: MusicMood;
  layers: MusicLayer[];
  loopStart: number;
  loopEnd: number;
}

export interface MusicLayer {
  id: string;
  name: string;
  audioBuffer: AudioBuffer;
  volume: number;
  harmonyThreshold: number; // minimum harmony level to activate
  tensionThreshold: number; // minimum tension level to activate
}

export interface AudioContext {
  context: AudioContext;
  masterGain: GainNode;
  musicGain: GainNode;
  sfxGain: GainNode;
  voiceGain: GainNode;
  compressor: DynamicsCompressorNode;
  reverb?: ConvolverNode;
}

// Audio configuration
export interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  enableReverb: boolean;
  enableCompression: boolean;
  sampleRate: number;
  bufferSize: number;
}

export interface AccessibilityOptions {
  enableAudioDescriptions: boolean;
  enableNavigationSounds: boolean;
  enableActionAnnouncements: boolean;
  speechRate: number; // 0.5 to 2.0
  speechPitch: number; // 0.5 to 2.0
  speechVolume: number; // 0.0 to 1.0
  preferredVoice?: string;
}

// Enums for audio system
export enum DeviceSoundType {
  HAPPY_BEEP = 'happy_beep',
  WORRIED_HUM = 'worried_hum',
  ANGRY_BUZZ = 'angry_buzz',
  CONFUSED_CHIRP = 'confused_chirp',
  WORKING_WHIR = 'working_whir',
  IDLE_AMBIENT = 'idle_ambient',
  STARTUP = 'startup',
  SHUTDOWN = 'shutdown',
  ERROR = 'error',
  SUCCESS = 'success'
}

export enum InteractionType {
  DEVICE_DISCOVERY = 'device_discovery',
  COOPERATION_START = 'cooperation_start',
  COOPERATION_SUCCESS = 'cooperation_success',
  CONFLICT_START = 'conflict_start',
  CONFLICT_ESCALATION = 'conflict_escalation',
  COMMUNICATION = 'communication',
  RESOURCE_SHARING = 'resource_sharing',
  LEARNING = 'learning'
}

export enum HarmonyLevel {
  PERFECT = 'perfect',      // 0.9 - 1.0
  HIGH = 'high',           // 0.7 - 0.9
  MODERATE = 'moderate',   // 0.5 - 0.7
  LOW = 'low',            // 0.3 - 0.5
  TENSION = 'tension',    // 0.1 - 0.3
  CHAOS = 'chaos'         // 0.0 - 0.1
}

export enum HarmonyType {
  PERFECT_SYNC = 'perfect_sync',
  COMPLEMENTARY = 'complementary',
  COOPERATIVE = 'cooperative',
  EFFICIENT = 'efficient'
}

export enum DissonanceType {
  RESOURCE_CONFLICT = 'resource_conflict',
  AUTHORITY_CLASH = 'authority_clash',
  COMMUNICATION_NOISE = 'communication_noise',
  FEEDBACK_LOOP = 'feedback_loop',
  SYSTEM_OVERLOAD = 'system_overload'
}

export enum UIAction {
  BUTTON_CLICK = 'button_click',
  BUTTON_HOVER = 'button_hover',
  DRAG_START = 'drag_start',
  DRAG_DROP = 'drag_drop',
  DRAG_INVALID = 'drag_invalid',
  MENU_OPEN = 'menu_open',
  MENU_CLOSE = 'menu_close',
  NOTIFICATION = 'notification',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  ACHIEVEMENT = 'achievement',
  LEVEL_UP = 'level_up'
}

export enum MusicMood {
  PEACEFUL = 'peaceful',
  FOCUSED = 'focused',
  TENSE = 'tense',
  DRAMATIC = 'dramatic',
  CHAOTIC = 'chaotic',
  TRIUMPHANT = 'triumphant',
  MYSTERIOUS = 'mysterious',
  PLAYFUL = 'playful'
}

export enum StingerType {
  CRISIS_START = 'crisis_start',
  CRISIS_RESOLVED = 'crisis_resolved',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_COMPLETE = 'level_complete',
  DISCOVERY = 'discovery',
  WARNING = 'warning',
  FAILURE = 'failure',
  SUCCESS = 'success'
}

export enum NavigationDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  ENTER = 'enter',
  EXIT = 'exit',
  NEXT = 'next',
  PREVIOUS = 'previous'
}

// Audio event types
export interface AudioEvent {
  type: AudioEventType;
  timestamp: number;
  deviceId?: string;
  parameters: { [key: string]: any };
}

export enum AudioEventType {
  DEVICE_SOUND = 'device_sound',
  INTERACTION_SOUND = 'interaction_sound',
  MUSIC_CHANGE = 'music_change',
  UI_FEEDBACK = 'ui_feedback',
  ACCESSIBILITY_ANNOUNCEMENT = 'accessibility_announcement'
}

// Audio loading and management
export interface AudioAsset {
  id: string;
  url: string;
  type: AudioAssetType;
  preload: boolean;
  volume: number;
  category: AudioCategory;
}

export enum AudioAssetType {
  SOUND_EFFECT = 'sound_effect',
  MUSIC_TRACK = 'music_track',
  VOICE = 'voice',
  AMBIENT = 'ambient'
}

export enum AudioCategory {
  DEVICE_SOUNDS = 'device_sounds',
  UI_SOUNDS = 'ui_sounds',
  MUSIC = 'music',
  VOICE = 'voice',
  AMBIENT = 'ambient'
}

export interface AudioLoadingProgress {
  loaded: number;
  total: number;
  currentAsset: string;
  percentage: number;
}