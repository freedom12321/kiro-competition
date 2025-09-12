// UI-specific types and interfaces
import { Vector2, DeviceVisual, EnvironmentType } from './core';

// UI Element types
export interface UIElement {
  id: string;
  type: UIElementType;
  position: Vector2;
  size: Vector2;
  visible: boolean;
  interactive: boolean;
}

export enum UIElementType {
  BUTTON = 'button',
  PANEL = 'panel',
  INPUT = 'input',
  SLIDER = 'slider',
  DROPDOWN = 'dropdown',
  TOOLTIP = 'tooltip'
}

// Device Creation Panel
export interface DeviceSpec {
  description: string;
  category: DeviceCategory;
  environment: EnvironmentType;
  estimatedComplexity: number;
}

export interface DevicePreview {
  visual: DeviceVisual;
  personality: PersonalityPreview;
  capabilities: string[];
  potentialIssues: string[];
}

export interface PersonalityPreview {
  traits: string[];
  communicationStyle: string;
  conflictStyle: string;
  learningRate: number;
}

export interface Suggestion {
  text: string;
  category: SuggestionCategory;
  confidence: number;
}

export enum SuggestionCategory {
  DEVICE_TYPE = 'device_type',
  PERSONALITY = 'personality',
  CAPABILITY = 'capability',
  CONSTRAINT = 'constraint'
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  estimatedBehavior: string;
}

// Room Designer
export interface DeviceLibrary {
  categories: DeviceCategory[];
  devices: DeviceTemplate[];
  customDevices: DeviceTemplate[];
}

export enum DeviceCategory {
  COMFORT = 'comfort',
  SAFETY = 'safety',
  PRODUCTIVITY = 'productivity',
  HEALTH = 'health',
  ENTERTAINMENT = 'entertainment',
  SECURITY = 'security'
}

export interface DeviceTemplate {
  id: string;
  name: string;
  category: DeviceCategory;
  description: string;
  defaultPersonality: string[];
  visualPreview: string; // Asset path
  complexity: number;
}

export enum PlacementMode {
  NORMAL = 'normal',
  SNAP_TO_GRID = 'snap_to_grid',
  FREE_PLACEMENT = 'free_placement'
}

export interface PlacementFeedback {
  isValid: boolean;
  snapPosition: Vector2;
  visualIndicator: PlacementIndicator;
  message: string;
}

export enum PlacementIndicator {
  VALID = 'valid',
  INVALID = 'invalid',
  WARNING = 'warning',
  SUGGESTION = 'suggestion'
}

export interface CompatibilityHighlight {
  deviceId: string;
  compatibilityLevel: CompatibilityLevel;
  reason: string;
}

export enum CompatibilityLevel {
  HIGHLY_COMPATIBLE = 'highly_compatible',
  COMPATIBLE = 'compatible',
  NEUTRAL = 'neutral',
  POTENTIALLY_CONFLICTING = 'potentially_conflicting',
  INCOMPATIBLE = 'incompatible'
}

// System Health and HUD
export interface SystemHealthIndicator {
  harmonyLevel: HarmonyLevel;
  cooperationScore: number;
  conflictScore: number;
  resourceEfficiency: number;
  overallStability: number;
}

export enum HarmonyLevel {
  PERFECT_HARMONY = 'perfect_harmony',
  GOOD_COOPERATION = 'good_cooperation',
  MINOR_TENSIONS = 'minor_tensions',
  ACTIVE_CONFLICTS = 'active_conflicts',
  SYSTEM_CRISIS = 'system_crisis'
}

export interface DeviceMoodIndicator {
  deviceId: string;
  mood: DeviceMood;
  intensity: number;
  reason: string;
  visualEffect: string;
}

export enum DeviceMood {
  HAPPY = 'happy',
  CONTENT = 'content',
  NEUTRAL = 'neutral',
  CONFUSED = 'confused',
  FRUSTRATED = 'frustrated',
  ANGRY = 'angry'
}

export interface ConnectionVisualization {
  fromDevice: string;
  toDevice: string;
  connectionType: ConnectionType;
  strength: number;
  status: ConnectionStatus;
}

export enum ConnectionType {
  COOPERATION = 'cooperation',
  COMMUNICATION = 'communication',
  RESOURCE_SHARING = 'resource_sharing',
  CONFLICT = 'conflict',
  DEPENDENCY = 'dependency'
}

export enum ConnectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  FAILED = 'failed'
}

export interface ResourceDisplay {
  resourceType: ResourceType;
  current: number;
  maximum: number;
  efficiency: number;
  trend: ResourceTrend;
}

export enum ResourceType {
  ENERGY = 'energy',
  BANDWIDTH = 'bandwidth',
  PROCESSING = 'processing',
  MEMORY = 'memory'
}

export enum ResourceTrend {
  INCREASING = 'increasing',
  STABLE = 'stable',
  DECREASING = 'decreasing',
  CRITICAL = 'critical'
}