/**
 * World state types for AI Habitat simulation engine
 * Based on CLAUDE.md specifications
 */

// Core room and variable types
export type RoomId = "living_room" | "kitchen" | "bedroom";
export type VariableName = "temperature" | "lumens" | "noise" | "humidity" | "mood_score";
export type RoomState = Record<VariableName, number>;

// Device runtime state
export interface DeviceRuntime {
  id: string;
  name: string;
  room: RoomId;
  active: boolean;
  state: Record<string, any>;
  lastAction?: string;
  cooldownUntilTick?: number;
  rateLimit?: {
    parameter: string;
    maxChangePerTick: number;
    lastValue: number;
  };
}

// Policy system types
export interface PolicyRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  enabled: boolean;
}

export interface Policies {
  rules: PolicyRule[];
  charter?: WorldCharter;
}

// World charter for governance
export interface WorldCharter {
  id: string;
  name: string;
  description: string;
  principles: string[];
  targets: Record<string, number>; // Variable targets for harmony
  created: number;
  lastUpdated: number;
}

// Event system
export interface WorldEvent {
  at: number; // tick timestamp
  room: RoomId;
  deviceId?: string;
  kind: string;
  data?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Resource management
export interface WorldResources {
  powerKw: number;
  bandwidth: number;
  privacyBudget: number;
}

// Action system for device behaviors
export interface DeviceAction {
  deviceId: string;
  type: string;
  parameters: Record<string, any>;
  targetRoom?: RoomId;
  priority: number;
}

// Divergence tracking for sparklines
export interface DivergencePoint {
  tick: number;
  variable: VariableName;
  room: RoomId;
  actual: number;
  target: number;
  deviation: number;
}

// Main world state interface
export interface WorldState {
  // Time and simulation control
  timeSec: number; // Current time in seconds (tick * 10)
  tick: number; // Current tick count
  running: boolean;
  speed: 1 | 2 | 4; // Simulation speed multiplier
  
  // Room states with all variables
  rooms: Record<RoomId, RoomState>;
  
  // Device management
  devices: Record<string, DeviceRuntime>;
  
  // Governance and policies
  policies: Policies;
  
  // Resource tracking
  resources: WorldResources;
  
  // System health and harmony
  health: number; // 0..1 where 1 is perfect harmony
  
  // Event logging
  eventLog: WorldEvent[];
  
  // Random state for deterministic simulation
  seed: number;
  randTick: number;
  
  // Charter for governance targets
  charter?: WorldCharter;
  
  // Divergence tracking for analytics
  divergenceHistory: DivergencePoint[];
  
  // Hysteresis and inertia tracking
  deviceCooldowns: Record<string, number>;
  rateConstraints: Record<string, {
    lastValue: number;
    maxChangePerTick: number;
    parameter: string;
  }>;
}

// Action processing pipeline types
export interface AgentPlan {
  deviceId: string;
  actions: DeviceAction[];
  reasoning: string;
  confidence: number;
}

export interface WorldUpdate {
  roomUpdates: Record<RoomId, Partial<RoomState>>;
  eventUpdates: WorldEvent[];
  deviceUpdates: Record<string, Partial<DeviceRuntime>>;
  resourceUpdates: Partial<WorldResources>;
  healthUpdate?: number;
}

// Simulation control types
export interface SimulationConfig {
  tickIntervalMs: number; // Should be 10000 for 10-second ticks
  maxEventsPerTick: number;
  healthCalculationMethod: 'harmony' | 'performance' | 'safety';
  enableHysteresis: boolean;
  enableRateLimiting: boolean;
}

// Helper types for room variable manipulation
export type RoomVariableModifier = {
  room: RoomId;
  variable: VariableName;
  delta: number;
  source?: string;
  reason?: string;
};

// Crisis and conflict types
export interface CrisisEvent extends WorldEvent {
  kind: 'crisis';
  crisisType: 'feedback_loop' | 'authority_conflict' | 'privacy_paradox' | 'resource_exhaustion';
  affectedDevices: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  cascadeRisk: number;
}

// Hysteresis configuration
export interface HysteresisConfig {
  acOnOffMinTicks: number; // Minimum 3 ticks between AC on/off
  temperatureRampMax: number; // Maximum 0.5°C per tick
  humidityRampMax: number;
  lightingRampMax: number;
  noiseRampMax: number;
}

// Default configurations
export const DEFAULT_HYSTERESIS: HysteresisConfig = {
  acOnOffMinTicks: 3,
  temperatureRampMax: 0.5,
  humidityRampMax: 2.0,
  lightingRampMax: 50.0, // lumens
  noiseRampMax: 5.0
};

export const DEFAULT_ROOM_STATE: RoomState = {
  temperature: 22.0, // Celsius
  lumens: 300, // Lighting level
  noise: 35, // Decibels
  humidity: 45, // Percentage
  mood_score: 0.7 // 0-1 scale
};

export const DEFAULT_RESOURCES: WorldResources = {
  powerKw: 5.0,
  bandwidth: 100.0, // Mbps
  privacyBudget: 1.0 // Normalized budget
};
