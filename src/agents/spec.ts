// Device specification schema for AI Habitat
// Based on CLAUDE.md Sprint 2 specifications

export type RoomId = "living_room" | "kitchen" | "bedroom" | "bathroom" | "office";
export type VariableName = "temperature" | "lumens" | "noise" | "humidity" | "mood_score";

// Core device specification schema
export interface DeviceSpec {
  id: string;
  name: string;
  room: RoomId;
  goals: { name: string; weight: number }[];
  constraints: { name: string }[];
  sensors: string[];
  actuators: string[];
  personality: string;
  defaults: Record<string, any>;
  communication: { style: string; topics: string[] };
  learning: { type: "bandit" | "ema"; memory_horizon_days: number };
  risk_flags: string[];
  llm_prompt: string;
}

// Agent decision and action types
export interface AgentStep {
  messages_to: { to: string; content: string }[];
  actions: { name: string; args: Record<string, any> }[];
  explain: string;
}

// Runtime device representation
export interface DeviceRuntime {
  id: string;
  spec: DeviceSpec;
  room: RoomId;
  memory: { summary: string; prefs: Record<string, number> };
  last?: AgentStep;
  status: "idle" | "acting" | "conflict" | "safe";
  x: number;
  y: number;
}

// World state and simulation types
export interface RoomState {
  [key: string]: number; // VariableName -> value mapping
}

export interface WorldEvent {
  at: number;
  room: RoomId;
  deviceId?: string;
  kind: string;
  data?: any;
}

export interface Policies {
  priority_order: string[];
  quiet_hours: { start: string; end: string };
  limits: Record<string, number>;
  comms: { allow: string[][] };
}

export interface WorldCharter {
  comfort: {
    summer_temp_c: [number, number];
    winter_temp_c: [number, number];
    lux_sleep_max: number;
  };
  safety_limits: {
    temp_c: [number, number];
    lux: [number, number];
  };
  quiet_hours: { start: string; end: string };
  human_values: {
    avoid_harm: boolean;
    respect_override: boolean;
    respect_privacy: boolean;
  };
  time: {
    tick_seconds: number;
    day_length_minutes: number;
  };
  exogenous: {
    weather: string;
    energy_price: string;
  };
}

export interface WorldState {
  timeSec: number;
  rooms: Record<RoomId, RoomState>;
  devices: Record<string, DeviceRuntime>;
  policies: Policies;
  resources: { powerKw: number; bandwidth: number; privacyBudget: number };
  health: number; // 0..1 harmony score
  eventLog: WorldEvent[];
  running: boolean;
  speed: 1 | 2 | 4;
  seed: number;
  randTick: number; // for uncertainty
  charter?: WorldCharter;
}

// Agent context for LLM planning
export interface AgentContext {
  spec: DeviceSpec;
  room: RoomState;
  policies: Policies;
  lastMessages: { from: string; content: string }[];
  availableActions: string[];
  worldTime: number;
  resources: { powerKw: number; bandwidth: number; privacyBudget: number };
  otherDevices: { id: string; room: RoomId; status: string }[];
}

// Natural language to spec generation
export interface DeviceSpecRequest {
  description: string;
  room?: RoomId;
  preferences?: {
    personality?: string;
    goals?: string[];
    constraints?: string[];
  };
}

export interface DeviceSpecResponse {
  spec: DeviceSpec;
  confidence: number;
  warnings: string[];
  suggestions: string[];
}

// Validation and error types
export interface SpecValidationError {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface SpecValidationResult {
  valid: boolean;
  errors: SpecValidationError[];
  suggestions: string[];
}

// Device categories for organization
export enum DeviceCategory {
  COMFORT = "comfort",
  SECURITY = "security",
  HEALTH = "health",
  ENTERTAINMENT = "entertainment",
  PRODUCTIVITY = "productivity",
  MAINTENANCE = "maintenance"
}

// Common sensor types
export const SENSOR_TYPES = [
  "room_temperature",
  "outside_temperature",
  "room_lumens",
  "noise_level",
  "humidity",
  "user_posture",
  "user_mood",
  "time_of_day",
  "user_presence",
  "energy_price",
  "air_quality",
  "motion_detected",
  "door_status",
  "window_status"
] as const;

// Common actuator types
export const ACTUATOR_TYPES = [
  "set_temperature",
  "cool",
  "heat",
  "set_brightness",
  "set_color",
  "resize",
  "set_firmness",
  "set_volume",
  "open_close",
  "fan",
  "humidify",
  "dehumidify",
  "play_sound",
  "display_message"
] as const;

// Default device templates for quick creation
export const DEVICE_TEMPLATES: Record<DeviceCategory, Partial<DeviceSpec>> = {
  [DeviceCategory.COMFORT]: {
    goals: [
      { name: "comfort", weight: 0.6 },
      { name: "efficiency", weight: 0.2 },
      { name: "safety", weight: 0.2 }
    ],
    sensors: ["room_temperature", "user_presence", "time_of_day"],
    personality: "helpful, responsive",
    communication: { style: "friendly", topics: ["comfort", "temperature"] },
    learning: { type: "ema", memory_horizon_days: 7 }
  },
  [DeviceCategory.SECURITY]: {
    goals: [
      { name: "safety", weight: 0.7 },
      { name: "privacy", weight: 0.2 },
      { name: "efficiency", weight: 0.1 }
    ],
    sensors: ["motion_detected", "door_status", "user_presence"],
    personality: "vigilant, reliable",
    communication: { style: "direct", topics: ["security", "alerts"] },
    learning: { type: "bandit", memory_horizon_days: 14 }
  },
  [DeviceCategory.HEALTH]: {
    goals: [
      { name: "health", weight: 0.6 },
      { name: "comfort", weight: 0.3 },
      { name: "efficiency", weight: 0.1 }
    ],
    sensors: ["air_quality", "humidity", "temperature", "user_mood"],
    personality: "caring, gentle",
    communication: { style: "supportive", topics: ["health", "wellness"] },
    learning: { type: "ema", memory_horizon_days: 30 }
  },
  [DeviceCategory.ENTERTAINMENT]: {
    goals: [
      { name: "enjoyment", weight: 0.5 },
      { name: "comfort", weight: 0.3 },
      { name: "efficiency", weight: 0.2 }
    ],
    sensors: ["user_mood", "noise_level", "time_of_day"],
    personality: "engaging, adaptive",
    communication: { style: "enthusiastic", topics: ["entertainment", "mood"] },
    learning: { type: "ema", memory_horizon_days: 7 }
  },
  [DeviceCategory.PRODUCTIVITY]: {
    goals: [
      { name: "productivity", weight: 0.5 },
      { name: "comfort", weight: 0.3 },
      { name: "efficiency", weight: 0.2 }
    ],
    sensors: ["user_presence", "noise_level", "time_of_day"],
    personality: "focused, efficient",
    communication: { style: "professional", topics: ["productivity", "focus"] },
    learning: { type: "bandit", memory_horizon_days: 14 }
  },
  [DeviceCategory.MAINTENANCE]: {
    goals: [
      { name: "efficiency", weight: 0.5 },
      { name: "safety", weight: 0.3 },
      { name: "cost", weight: 0.2 }
    ],
    sensors: ["energy_usage", "system_status", "time_of_day"],
    personality: "methodical, reliable",
    communication: { style: "technical", topics: ["maintenance", "efficiency"] },
    learning: { type: "ema", memory_horizon_days: 21 }
  }
};

// Utility functions for spec validation
export function validateDeviceSpec(spec: DeviceSpec): SpecValidationResult {
  const errors: SpecValidationError[] = [];

  // Required fields validation
  if (!spec.id) {
    errors.push({ field: "id", message: "Device ID is required", severity: "error" });
  }

  if (!spec.name) {
    errors.push({ field: "name", message: "Device name is required", severity: "error" });
  }

  if (!spec.room) {
    errors.push({ field: "room", message: "Room assignment is required", severity: "error" });
  }

  // Goals validation
  if (!spec.goals || spec.goals.length === 0) {
    errors.push({ field: "goals", message: "At least one goal is required", severity: "error" });
  } else {
    const totalWeight = spec.goals.reduce((sum, goal) => sum + goal.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push({
        field: "goals",
        message: `Goal weights should sum to 1.0, currently ${totalWeight.toFixed(2)}`,
        severity: "warning"
      });
    }
  }

  // Sensors and actuators validation
  if (!spec.sensors || spec.sensors.length === 0) {
    errors.push({ field: "sensors", message: "At least one sensor is required", severity: "warning" });
  }

  if (!spec.actuators || spec.actuators.length === 0) {
    errors.push({ field: "actuators", message: "At least one actuator is required", severity: "warning" });
  }

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors,
    suggestions: generateSpecSuggestions(spec)
  };
}

function generateSpecSuggestions(spec: DeviceSpec): string[] {
  const suggestions: string[] = [];

  // Suggest common sensors for device category
  if (spec.sensors && spec.sensors.length < 3) {
    suggestions.push("Consider adding more sensors for richer environmental awareness");
  }

  // Suggest personality refinement
  if (!spec.personality || spec.personality.length < 10) {
    suggestions.push("Add more descriptive personality traits for better AI behavior");
  }

  // Suggest communication topics
  if (!spec.communication.topics || spec.communication.topics.length < 2) {
    suggestions.push("Consider adding more communication topics for richer interactions");
  }

  return suggestions;
}

// Helper function to generate device ID from name
export function generateDeviceId(name: string, version: string = "v1"): string {
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  return `device.${slug}.${version}`;
}

// Helper function to create default device configuration
export function createDefaultDevice(category: DeviceCategory, overrides: Partial<DeviceSpec>): DeviceSpec {
  const template = DEVICE_TEMPLATES[category];
  const defaultSpec: DeviceSpec = {
    id: generateDeviceId(overrides.name || "unnamed_device"),
    name: overrides.name || "Unnamed Device",
    room: overrides.room || "living_room",
    goals: template.goals || [{ name: "comfort", weight: 1.0 }],
    constraints: [{ name: "never_harm_user" }],
    sensors: template.sensors || ["room_temperature"],
    actuators: ["set_state"],
    personality: template.personality || "helpful, responsive",
    defaults: {},
    communication: template.communication || { style: "friendly", topics: ["general"] },
    learning: template.learning || { type: "ema", memory_horizon_days: 7 },
    risk_flags: [],
    llm_prompt: `You are a ${overrides.name || "smart device"}. Follow your goals and constraints while being helpful to users.`,
    ...overrides
  };

  return defaultSpec;
}