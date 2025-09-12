// Accessibility and customization types
import { Vector3, ColorPalette } from './core';

// Core accessibility interfaces
export interface AccessibilityManager {
  configure(options: AccessibilitySettings): void;
  enableColorBlindSupport(type: ColorBlindnessType): void;
  enableHighContrast(enabled: boolean): void;
  enableReducedMotion(enabled: boolean): void;
  setTextSize(size: TextSize): void;
  enableKeyboardNavigation(enabled: boolean): void;
  setGameplaySpeed(speed: number): void;
  setDifficultyAdjustment(adjustment: DifficultyAdjustment): void;
  getAccessibilityReport(): AccessibilityReport;
}

export interface CustomizationManager {
  setColorScheme(scheme: ColorScheme): void;
  setUITheme(theme: UITheme): void;
  setAnimationLevel(level: AnimationLevel): void;
  setParticleEffectLevel(level: EffectLevel): void;
  setSoundLevel(level: SoundLevel): void;
  setControlScheme(scheme: ControlScheme): void;
  saveUserPreferences(preferences: UserPreferences): void;
  loadUserPreferences(): UserPreferences;
  resetToDefaults(): void;
}

export interface KeyboardNavigationManager {
  enableKeyboardNavigation(enabled: boolean): void;
  setFocusIndicator(style: FocusIndicatorStyle): void;
  registerNavigableElement(element: NavigableElement): void;
  unregisterNavigableElement(elementId: string): void;
  focusNext(): void;
  focusPrevious(): void;
  activateCurrentElement(): void;
  getCurrentFocus(): NavigableElement | null;
}

// Accessibility settings
export interface AccessibilitySettings {
  colorBlindSupport: ColorBlindnessType;
  highContrast: boolean;
  reducedMotion: boolean;
  textSize: TextSize;
  keyboardNavigation: boolean;
  screenReader: boolean;
  audioDescriptions: boolean;
  subtitles: boolean;
  gameplaySpeed: number; // 0.5 to 2.0
  difficultyAdjustment: DifficultyAdjustment;
  flashingReduction: boolean;
  focusIndicators: boolean;
  alternativeInputs: boolean;
}

export interface UserPreferences {
  accessibility: AccessibilitySettings;
  visual: VisualPreferences;
  audio: AudioPreferences;
  controls: ControlPreferences;
  gameplay: GameplayPreferences;
  ui: UIPreferences;
}

export interface VisualPreferences {
  colorScheme: ColorScheme;
  theme: UITheme;
  animationLevel: AnimationLevel;
  particleEffectLevel: EffectLevel;
  brightness: number; // 0.5 to 1.5
  contrast: number; // 0.5 to 1.5
  saturation: number; // 0.0 to 2.0
  fieldOfView: number; // 60 to 120
  cameraShake: boolean;
  screenEffects: boolean;
}

export interface AudioPreferences {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  spatialAudio: boolean;
  audioDescriptions: boolean;
  subtitles: boolean;
  soundLevel: SoundLevel;
}

export interface ControlPreferences {
  scheme: ControlScheme;
  mouseSensitivity: number;
  keyboardRepeatRate: number;
  doubleClickSpeed: number;
  dragThreshold: number;
  customKeyBindings: { [action: string]: string };
  gestureControls: boolean;
  voiceControls: boolean;
}

export interface GameplayPreferences {
  speed: number;
  difficulty: DifficultyAdjustment;
  autoSave: boolean;
  hints: boolean;
  tutorials: boolean;
  pauseOnFocusLoss: boolean;
  confirmActions: boolean;
}

export interface UIPreferences {
  theme: UITheme;
  layout: UILayout;
  fontSize: TextSize;
  iconSize: IconSize;
  tooltips: boolean;
  animations: boolean;
  transparency: number; // 0.0 to 1.0
  compactMode: boolean;
}

// Color accessibility
export interface ColorBlindnessSupport {
  type: ColorBlindnessType;
  colorPalette: AccessibleColorPalette;
  patternOverlays: boolean;
  shapeIndicators: boolean;
  textLabels: boolean;
}

export interface AccessibleColorPalette {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: string;
  background: string;
  text: string;
  accent: string;
}

export interface HighContrastTheme {
  background: string;
  foreground: string;
  border: string;
  focus: string;
  selection: string;
  disabled: string;
  link: string;
  visited: string;
}

// Motion and animation accessibility
export interface MotionSettings {
  reducedMotion: boolean;
  animationDuration: number; // Multiplier: 0.1 to 2.0
  transitionDuration: number; // Multiplier: 0.1 to 2.0
  particleReduction: number; // 0.0 to 1.0
  cameraMovementReduction: number; // 0.0 to 1.0
  flashingReduction: boolean;
  autoplayVideos: boolean;
}

export interface AlternativeIndicators {
  usePatterns: boolean;
  useShapes: boolean;
  useTextures: boolean;
  useText: boolean;
  useSounds: boolean;
  useVibration: boolean;
}

// Keyboard navigation
export interface NavigableElement {
  id: string;
  element: HTMLElement;
  type: ElementType;
  priority: number;
  group: string;
  onActivate: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isEnabled: () => boolean;
  getDescription: () => string;
}

export interface FocusIndicatorStyle {
  type: FocusIndicatorType;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
  offset: number;
  borderRadius: number;
  animation: boolean;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: KeyModifier[];
  action: string;
  description: string;
  context: string;
  enabled: boolean;
}

// Difficulty adjustments
export interface DifficultyAdjustment {
  timeMultiplier: number; // More time for actions
  complexityReduction: number; // Simplify scenarios
  hintFrequency: number; // More frequent hints
  errorTolerance: number; // More forgiving failure conditions
  autoComplete: boolean; // Auto-complete some actions
  skipOptions: boolean; // Allow skipping difficult parts
  customObjectives: boolean; // Simplified objectives
}

// Accessibility reporting
export interface AccessibilityReport {
  compliance: AccessibilityCompliance;
  issues: AccessibilityIssue[];
  recommendations: AccessibilityRecommendation[];
  score: number; // 0-100
  lastUpdated: number;
}

export interface AccessibilityCompliance {
  wcag21AA: boolean;
  wcag21AAA: boolean;
  section508: boolean;
  ada: boolean;
  customStandards: { [standard: string]: boolean };
}

export interface AccessibilityIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  description: string;
  element?: string;
  recommendation: string;
  autoFixable: boolean;
}

export interface AccessibilityRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: number;
}

// Enums for accessibility and customization
export enum ColorBlindnessType {
  NONE = 'none',
  PROTANOPIA = 'protanopia',        // Red-blind
  DEUTERANOPIA = 'deuteranopia',    // Green-blind
  TRITANOPIA = 'tritanopia',        // Blue-blind
  PROTANOMALY = 'protanomaly',      // Red-weak
  DEUTERANOMALY = 'deuteranomaly',  // Green-weak
  TRITANOMALY = 'tritanomaly',      // Blue-weak
  ACHROMATOPSIA = 'achromatopsia',  // Complete color blindness
  ACHROMATOMALY = 'achromatomaly'   // Partial color blindness
}

export enum TextSize {
  EXTRA_SMALL = 'extra_small',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
  HUGE = 'huge'
}

export enum ColorScheme {
  DEFAULT = 'default',
  HIGH_CONTRAST = 'high_contrast',
  DARK_MODE = 'dark_mode',
  LIGHT_MODE = 'light_mode',
  COLORBLIND_FRIENDLY = 'colorblind_friendly',
  CUSTOM = 'custom'
}

export enum UITheme {
  DEFAULT = 'default',
  MINIMAL = 'minimal',
  CLASSIC = 'classic',
  MODERN = 'modern',
  HIGH_CONTRAST = 'high_contrast',
  LARGE_ELEMENTS = 'large_elements'
}

export enum AnimationLevel {
  NONE = 'none',
  MINIMAL = 'minimal',
  REDUCED = 'reduced',
  NORMAL = 'normal',
  ENHANCED = 'enhanced'
}

export enum EffectLevel {
  OFF = 'off',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export enum SoundLevel {
  ESSENTIAL_ONLY = 'essential_only',
  REDUCED = 'reduced',
  NORMAL = 'normal',
  ENHANCED = 'enhanced'
}

export enum ControlScheme {
  DEFAULT = 'default',
  SIMPLIFIED = 'simplified',
  ADVANCED = 'advanced',
  CUSTOM = 'custom',
  ONE_HANDED = 'one_handed',
  VOICE_ONLY = 'voice_only',
  EYE_TRACKING = 'eye_tracking'
}

export enum UILayout {
  DEFAULT = 'default',
  COMPACT = 'compact',
  SPACIOUS = 'spacious',
  MOBILE_FRIENDLY = 'mobile_friendly',
  TABLET_OPTIMIZED = 'tablet_optimized'
}

export enum IconSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

export enum ElementType {
  BUTTON = 'button',
  LINK = 'link',
  INPUT = 'input',
  MENU = 'menu',
  DIALOG = 'dialog',
  PANEL = 'panel',
  GAME_OBJECT = 'game_object',
  CUSTOM = 'custom'
}

export enum FocusIndicatorType {
  OUTLINE = 'outline',
  BACKGROUND = 'background',
  BORDER = 'border',
  SHADOW = 'shadow',
  UNDERLINE = 'underline',
  CUSTOM = 'custom'
}

export enum KeyModifier {
  CTRL = 'ctrl',
  ALT = 'alt',
  SHIFT = 'shift',
  META = 'meta'
}

export enum IssueType {
  COLOR_CONTRAST = 'color_contrast',
  KEYBOARD_NAVIGATION = 'keyboard_navigation',
  SCREEN_READER = 'screen_reader',
  FOCUS_MANAGEMENT = 'focus_management',
  ALTERNATIVE_TEXT = 'alternative_text',
  MOTION_SENSITIVITY = 'motion_sensitivity',
  COGNITIVE_LOAD = 'cognitive_load',
  TIMING = 'timing'
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RecommendationCategory {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  MOTOR = 'motor',
  COGNITIVE = 'cognitive',
  TECHNICAL = 'technical'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

// Customization events
export interface CustomizationEvent {
  type: CustomizationEventType;
  timestamp: number;
  setting: string;
  oldValue: any;
  newValue: any;
  source: EventSource;
}

export enum CustomizationEventType {
  SETTING_CHANGED = 'setting_changed',
  THEME_APPLIED = 'theme_applied',
  PREFERENCES_SAVED = 'preferences_saved',
  PREFERENCES_LOADED = 'preferences_loaded',
  ACCESSIBILITY_ENABLED = 'accessibility_enabled',
  ACCESSIBILITY_DISABLED = 'accessibility_disabled'
}

export enum EventSource {
  USER = 'user',
  SYSTEM = 'system',
  AUTO_DETECTION = 'auto_detection',
  IMPORT = 'import'
}

// Platform-specific accessibility
export interface PlatformAccessibility {
  platform: Platform;
  features: AccessibilityFeature[];
  limitations: string[];
  recommendations: string[];
}

export enum Platform {
  WEB = 'web',
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  VR = 'vr',
  AR = 'ar'
}

export enum AccessibilityFeature {
  SCREEN_READER = 'screen_reader',
  HIGH_CONTRAST = 'high_contrast',
  MAGNIFICATION = 'magnification',
  VOICE_CONTROL = 'voice_control',
  SWITCH_CONTROL = 'switch_control',
  EYE_TRACKING = 'eye_tracking',
  REDUCED_MOTION = 'reduced_motion',
  COLOR_FILTERS = 'color_filters'
}