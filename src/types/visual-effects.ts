// Visual effects and animation types
import * as THREE from 'three';
import { Vector3, EffectType, PersonalityTrait, EmotionState } from './core';

// Core visual effects interfaces
export interface VisualEffectsManager {
  createParticleEffect(type: ParticleEffectType, position: Vector3, parameters?: EffectParameters): ParticleEffect;
  createConnectionEffect(from: Vector3, to: Vector3, type: ConnectionType): ConnectionEffect;
  createCooperationEffect(devices: Vector3[], intensity: number): CooperationEffect;
  createCrisisEffect(position: Vector3, crisisType: CrisisEffectType, severity: number): CrisisEffect;
  updateEffects(deltaTime: number): void;
  removeEffect(effectId: string): void;
  cleanup(): void;
}

export interface CameraController {
  smoothTransition(targetPosition: Vector3, targetLookAt: Vector3, duration: number): Promise<void>;
  zoomToDevice(devicePosition: Vector3, zoomLevel: number, duration: number): Promise<void>;
  shakeCamera(intensity: number, duration: number): void;
  focusOnArea(center: Vector3, radius: number, duration: number): Promise<void>;
  resetToDefault(duration: number): Promise<void>;
  enableCinematicMode(enabled: boolean): void;
}

export interface DeviceAnimationController {
  playIdleAnimation(deviceId: string, personality: PersonalityTrait): void;
  playEmotionAnimation(deviceId: string, emotion: EmotionState, intensity: number): void;
  playInteractionAnimation(deviceId: string, interactionType: InteractionAnimationType): void;
  playWorkingAnimation(deviceId: string, workType: WorkAnimationType): void;
  stopAnimation(deviceId: string): void;
  setAnimationSpeed(deviceId: string, speed: number): void;
  blendAnimations(deviceId: string, animations: AnimationBlend[]): void;
}

// Particle effect types
export interface ParticleEffect {
  id: string;
  type: ParticleEffectType;
  position: Vector3;
  particleSystem: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial | THREE.ShaderMaterial;
  particles: ParticleData[];
  emissionRate: number;
  lifetime: number;
  maxParticles: number;
  active: boolean;
  parameters: EffectParameters;
}

export interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

export interface ConnectionEffect {
  id: string;
  type: ConnectionType;
  startPosition: Vector3;
  endPosition: Vector3;
  line: THREE.Line;
  particles: ParticleEffect[];
  pulseSpeed: number;
  intensity: number;
  active: boolean;
}

export interface CooperationEffect {
  id: string;
  devicePositions: Vector3[];
  centerPosition: Vector3;
  resonanceField: THREE.Mesh;
  harmonyParticles: ParticleEffect[];
  pulseRings: THREE.Mesh[];
  intensity: number;
  active: boolean;
}

export interface CrisisEffect {
  id: string;
  type: CrisisEffectType;
  position: Vector3;
  severity: number;
  warningOverlay: THREE.Mesh;
  chaosParticles: ParticleEffect[];
  distortionField: THREE.Mesh;
  screenShake: boolean;
  active: boolean;
}

export interface EffectParameters {
  color?: THREE.Color;
  size?: number;
  speed?: number;
  intensity?: number;
  duration?: number;
  fadeIn?: number;
  fadeOut?: number;
  customProperties?: { [key: string]: any };
}

// Animation types
export interface AnimationBlend {
  animation: THREE.AnimationClip;
  weight: number;
  fadeTime: number;
}

export interface CameraTransition {
  startPosition: Vector3;
  endPosition: Vector3;
  startLookAt: Vector3;
  endLookAt: Vector3;
  duration: number;
  easing: EasingFunction;
  onComplete?: () => void;
}

export interface DeviceAnimation {
  deviceId: string;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAnimation: string | null;
  blendingAnimations: Map<string, { action: THREE.AnimationAction; weight: number }>;
  personality: PersonalityTrait;
}

// Shader effects
export interface ShaderEffect {
  id: string;
  type: ShaderEffectType;
  material: THREE.ShaderMaterial;
  uniforms: { [key: string]: THREE.IUniform };
  vertexShader: string;
  fragmentShader: string;
  active: boolean;
}

export interface PostProcessingEffect {
  id: string;
  type: PostProcessingType;
  pass: any; // THREE.Pass type
  enabled: boolean;
  parameters: { [key: string]: any };
}

// Enums for visual effects
export enum ParticleEffectType {
  COMMUNICATION = 'communication',
  COOPERATION = 'cooperation',
  CONFLICT = 'conflict',
  ENERGY_FLOW = 'energy_flow',
  DATA_TRANSFER = 'data_transfer',
  SYSTEM_OVERLOAD = 'system_overload',
  HARMONY_RESONANCE = 'harmony_resonance',
  DEVICE_STARTUP = 'device_startup',
  DEVICE_SHUTDOWN = 'device_shutdown',
  LEARNING_PROCESS = 'learning_process',
  ERROR_INDICATION = 'error_indication',
  SUCCESS_CELEBRATION = 'success_celebration'
}

export enum ConnectionType {
  DATA_FLOW = 'data_flow',
  ENERGY_TRANSFER = 'energy_transfer',
  COMMUNICATION_LINK = 'communication_link',
  COOPERATION_BOND = 'cooperation_bond',
  CONFLICT_TENSION = 'conflict_tension',
  RESOURCE_SHARING = 'resource_sharing',
  LEARNING_CONNECTION = 'learning_connection'
}

export enum CrisisEffectType {
  FEEDBACK_LOOP = 'feedback_loop',
  AUTHORITY_CONFLICT = 'authority_conflict',
  PRIVACY_BREACH = 'privacy_breach',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown',
  SYSTEM_OVERLOAD = 'system_overload'
}

export enum InteractionAnimationType {
  GREETING = 'greeting',
  HANDSHAKE = 'handshake',
  DATA_EXCHANGE = 'data_exchange',
  COOPERATION = 'cooperation',
  CONFLICT = 'conflict',
  LEARNING = 'learning',
  CELEBRATION = 'celebration',
  WARNING = 'warning'
}

export enum WorkAnimationType {
  PROCESSING = 'processing',
  MONITORING = 'monitoring',
  ANALYZING = 'analyzing',
  OPTIMIZING = 'optimizing',
  COMMUNICATING = 'communicating',
  LEARNING = 'learning',
  IDLE_WORK = 'idle_work'
}

export enum ShaderEffectType {
  GLOW = 'glow',
  DISTORTION = 'distortion',
  ENERGY_FIELD = 'energy_field',
  HOLOGRAM = 'hologram',
  GLITCH = 'glitch',
  PULSE = 'pulse',
  SHIMMER = 'shimmer'
}

export enum PostProcessingType {
  BLOOM = 'bloom',
  SCREEN_SHAKE = 'screen_shake',
  COLOR_GRADING = 'color_grading',
  VIGNETTE = 'vignette',
  CHROMATIC_ABERRATION = 'chromatic_aberration',
  FILM_GRAIN = 'film_grain',
  DEPTH_OF_FIELD = 'depth_of_field'
}

export enum EasingFunction {
  LINEAR = 'linear',
  EASE_IN = 'ease_in',
  EASE_OUT = 'ease_out',
  EASE_IN_OUT = 'ease_in_out',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  BACK = 'back'
}

// Performance and optimization
export interface EffectLOD {
  distance: number;
  particleCount: number;
  updateFrequency: number;
  enableShaders: boolean;
  enablePostProcessing: boolean;
}

export interface PerformanceMetrics {
  activeEffects: number;
  totalParticles: number;
  frameTime: number;
  memoryUsage: number;
  gpuUtilization: number;
}

export interface EffectPool {
  particleEffects: ParticleEffect[];
  connectionEffects: ConnectionEffect[];
  cooperationEffects: CooperationEffect[];
  crisisEffects: CrisisEffect[];
  availableEffects: Map<ParticleEffectType, ParticleEffect[]>;
  maxPoolSize: number;
}

// Animation curves and timing
export interface AnimationCurve {
  keyframes: KeyFrame[];
  interpolation: InterpolationType;
  loop: boolean;
  duration: number;
}

export interface KeyFrame {
  time: number;
  value: number;
  tangentIn?: number;
  tangentOut?: number;
}

export enum InterpolationType {
  LINEAR = 'linear',
  CUBIC = 'cubic',
  BEZIER = 'bezier',
  STEP = 'step'
}

// Visual effect events
export interface EffectEvent {
  type: EffectEventType;
  timestamp: number;
  effectId: string;
  parameters: { [key: string]: any };
}

export enum EffectEventType {
  EFFECT_STARTED = 'effect_started',
  EFFECT_COMPLETED = 'effect_completed',
  EFFECT_INTERRUPTED = 'effect_interrupted',
  ANIMATION_LOOP = 'animation_loop',
  PARTICLE_SPAWNED = 'particle_spawned',
  PARTICLE_DIED = 'particle_died'
}

// Quality settings
export interface VisualQualitySettings {
  particleQuality: QualityLevel;
  shaderQuality: QualityLevel;
  animationQuality: QualityLevel;
  postProcessingQuality: QualityLevel;
  maxParticles: number;
  maxEffects: number;
  enableLOD: boolean;
  enableOcclusion: boolean;
}

export enum QualityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

// Accessibility features for visual effects
export interface VisualAccessibility {
  reduceMotion: boolean;
  highContrast: boolean;
  colorBlindFriendly: boolean;
  flashingReduction: boolean;
  alternativeIndicators: boolean;
}

export interface AlternativeIndicator {
  type: IndicatorType;
  position: Vector3;
  message: string;
  duration: number;
  priority: number;
}

export enum IndicatorType {
  TEXT_OVERLAY = 'text_overlay',
  ICON_INDICATOR = 'icon_indicator',
  BORDER_HIGHLIGHT = 'border_highlight',
  SIZE_CHANGE = 'size_change',
  PATTERN_CHANGE = 'pattern_change'
}