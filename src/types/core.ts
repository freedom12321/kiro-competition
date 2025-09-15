// Core types for AI Habitat simulation
export type RoomId = "living_room" | "kitchen" | "bedroom";

export type EnvironmentType = "home" | "hospital" | "office";

export type VariableName = "temperature" | "lumens" | "noise" | "humidity" | "mood_score";

export type RoomState = Record<VariableName, number>;

export type WorldEvent = {
  at: number;
  room: RoomId;
  deviceId?: string;
  kind: string;
  data?: any;
  description?: string;
};

export type DeviceSpec = {
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
};

export type AgentStep = {
  messages_to: { to: string; content: string }[];
  actions: { name: string; args: Record<string, any> }[];
  explain: string;
};

export type DeviceRuntime = {
  id: string;
  spec: DeviceSpec;
  room: RoomId;
  memory: { summary: string; prefs: Record<string, number> };
  last?: AgentStep;
  status: "idle" | "acting" | "conflict" | "safe";
  x: number;
  y: number;
  personalitySeed?: number;
  planningPhase?: number;
  // Mutable bag for per-device runtime state (inertia, brightness, etc.)
  defaults?: Record<string, any>;
};

// World Rules System (WORLDRULE.md compliant)
export type Pred = Record<string, any>;
export type Transform = {
  target?: string;
  delta?: number;
  min?: number;
  max?: number;
  alarm?: string;
  action_hint?: Record<string, number>;
};

export type WorldRule = {
  id: string;
  scope: "world" | "room" | "device";
  device_type?: string;
  priority: number; // 0..1 soft weight
  hard: boolean;
  when?: Pred; // context predicate
  unless?: Pred; // exceptions
  if?: Pred; // state predicate
  then: Transform; // desired nudge/constraint/alarm
  explain: string;
  active?: boolean; // allow per-rule toggling in UI
};

export type RulePack = {
  id: string;
  name: string;
  description: string;
  environment: "home" | "hospital" | "office";
  rules: WorldRule[];
  active: boolean;
};

export type Policies = {
  priority_order: string[];
  quiet_hours: { start: string; end: string };
  limits: Record<string, number>;
  comms: { allow: [string, string][] };
  rule_packs?: RulePack[];
  soft_weights?: Record<string, number>;
};

export type WorldCharter = {
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
};

export type WorldState = {
  timeSec: number;
  rooms: Record<RoomId, RoomState>;
  devices: Record<string, DeviceRuntime>;
  policies: Policies;
  resources: { powerKw: number; bandwidth: number; privacyBudget: number };
  health: number; // 0..1 harmony
  eventLog: WorldEvent[];
  running: boolean;
  speed: 1 | 2 | 4;
  seed: number;
  randTick: number;
  charter?: WorldCharter;
  mode: "open-ended" | "seeded-replay" | "educator";
};

// Mediation and Conflict Resolution
export type ConflictResolution = {
  winner: string;
  loser: string;
  rule_applied: string;
  utility_scores: Record<string, number>;
  explanation: string;
};

export type MediationResult = {
  actions: { deviceId: string; action: any }[];
  conflicts: ConflictResolution[];
  logs: WorldEvent[];
  rule_firings: { ruleId: string; deviceId?: string; room?: RoomId }[];
};

// Director System for maintaining activity levels
export type DirectorConfig = {
  targets: {
    conflicts_per_day: [number, number];
    synergies_per_day: [number, number];
  };
  event_budget_per_day: number;
  cooldown_ticks: number;
};

export type DirectorState = {
  config: DirectorConfig;
  last_window_conflicts: number;
  last_window_synergies: number;
  event_budget_remaining: number;
  cooldown_remaining: number;
  activity_log: { timestamp: number; type: string; intensity: number }[];
};

// Agent Context for LLM planning
export type AgentContext = {
  spec: DeviceSpec;
  room_snapshot: RoomState;
  policies: Policies;
  last_messages: { from: string; content: string; at: number }[];
  available_actions: string[];
  world_time: number;
  other_devices: { id: string; room: RoomId; status: string }[];
};
