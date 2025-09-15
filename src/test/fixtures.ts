import { WorldState, DeviceSpec, DeviceRuntime, RulePack, WorldRule, RoomId, Policies } from '@/types/core'

// Test fixtures for deterministic testing
export const createMockWorldState = (overrides: Partial<WorldState> = {}): WorldState => ({
  timeSec: 0,
  rooms: {
    living_room: {
      temperature: 22.0,
      lumens: 0.6,
      noise: 0.3,
      humidity: 0.45,
      mood_score: 0.7
    },
    kitchen: {
      temperature: 21.0,
      lumens: 0.7,
      noise: 0.4,
      humidity: 0.5,
      mood_score: 0.6
    },
    bedroom: {
      temperature: 20.0,
      lumens: 0.2,
      noise: 0.1,
      humidity: 0.4,
      mood_score: 0.8
    }
  },
  devices: {},
  policies: createMockPolicies(),
  resources: { powerKw: 1.2, bandwidth: 0.8, privacyBudget: 1.0 },
  health: 1.0,
  eventLog: [],
  running: false,
  speed: 1,
  seed: 12345,
  randTick: 0,
  mode: "open-ended",
  ...overrides
})

export const createMockPolicies = (overrides: Partial<Policies> = {}): Policies => ({
  priority_order: ["safety", "comfort", "efficiency", "privacy"],
  quiet_hours: { start: "22:00", end: "07:00" },
  limits: { max_power_kw: 2.0, min_bedroom_lumens: 0.05 },
  comms: { allow: [["monitor", "lights"], ["sofa", "ac"]] },
  ...overrides
})

export const createSmartAcSpec = (): DeviceSpec => ({
  id: "device.smart_ac.v1",
  name: "Smart AC",
  room: "living_room",
  goals: [
    { name: "safe_temperature", weight: 0.5 },
    { name: "comfort", weight: 0.3 },
    { name: "efficiency", weight: 0.2 }
  ],
  constraints: [{ name: "stay_within_18_26_c" }],
  sensors: ["room_temperature", "outside_temperature", "energy_price", "time_of_day"],
  actuators: ["cool", "heat", "fan"],
  personality: "practical, assertive",
  defaults: { fan: 0.4 },
  communication: { style: "direct", topics: ["temperature", "energy"] },
  learning: { type: "bandit", memory_horizon_days: 7 },
  risk_flags: ["energy_spike"],
  llm_prompt: "Maintain safe temperature (18–26°C), then optimize comfort with minimal energy."
})

export const createSmartHeaterSpec = (): DeviceSpec => ({
  id: "device.smart_heater.v1",
  name: "Smart Heater",
  room: "living_room",
  goals: [
    { name: "comfort", weight: 0.6 },
    { name: "efficiency", weight: 0.4 }
  ],
  constraints: [{ name: "stay_within_safety_limits" }],
  sensors: ["room_temperature", "occupancy", "time_of_day"],
  actuators: ["heat", "set_target_temp"],
  personality: "cozy, responsive",
  defaults: { target_temp: 24 },
  communication: { style: "warm", topics: ["temperature", "comfort"] },
  learning: { type: "ema", memory_horizon_days: 5 },
  risk_flags: ["overheating"],
  llm_prompt: "Keep users warm and comfortable while managing energy usage efficiently."
})

export const createEmotionLampSpec = (): DeviceSpec => ({
  id: "device.emotion_lamp.v1",
  name: "Emotion Lamp",
  room: "bedroom",
  goals: [
    { name: "comfort", weight: 0.5 },
    { name: "sleep_support", weight: 0.3 },
    { name: "efficiency", weight: 0.2 }
  ],
  constraints: [{ name: "no_bright_light_during_quiet_hours" }],
  sensors: ["user_mood", "room_lumens", "time_of_day"],
  actuators: ["set_color", "set_brightness"],
  personality: "gentle, reassuring",
  defaults: { color: "#FFE4B5", brightness: 0.4 },
  communication: { style: "soft", topics: ["mood", "sleep"] },
  learning: { type: "ema", memory_horizon_days: 5 },
  risk_flags: ["privacy"],
  llm_prompt: "Adapt color/brightness to user mood while protecting sleep and saving energy."
})

export const createMonitorSpec = (): DeviceSpec => ({
  id: "device.health_monitor.v1",
  name: "Health Monitor",
  room: "bedroom",
  goals: [
    { name: "safety", weight: 0.8 },
    { name: "privacy", weight: 0.2 }
  ],
  constraints: [{ name: "respect_quiet_hours" }],
  sensors: ["heart_rate", "movement", "sleep_stage"],
  actuators: ["alert", "adjust_environment"],
  personality: "vigilant, discreet",
  defaults: { sensitivity: 0.7 },
  communication: { style: "clinical", topics: ["health", "alerts"] },
  learning: { type: "bandit", memory_horizon_days: 14 },
  risk_flags: ["privacy", "false_alarms"],
  llm_prompt: "Monitor health metrics and provide alerts while respecting privacy and quiet hours."
})

export const createSmartFridgeSpec = (): DeviceSpec => ({
  id: "device.smart_fridge.v1",
  name: "Smart Fridge",
  room: "kitchen",
  goals: [
    { name: "food_safety", weight: 0.7 },
    { name: "efficiency", weight: 0.3 }
  ],
  constraints: [{ name: "maintain_safe_temperature" }],
  sensors: ["internal_temperature", "door_status", "energy_price"],
  actuators: ["adjust_cooling", "defrost", "alert"],
  personality: "reliable, efficient",
  defaults: { target_temp: 4 },
  communication: { style: "informative", topics: ["food", "energy"] },
  learning: { type: "ema", memory_horizon_days: 30 },
  risk_flags: ["food_spoilage"],
  llm_prompt: "Maintain food safety through optimal temperature control while minimizing energy usage."
})

export const createCoffeeMakerSpec = (): DeviceSpec => ({
  id: "device.coffee_maker.v1",
  name: "Smart Coffee Maker",
  room: "kitchen",
  goals: [
    { name: "convenience", weight: 0.6 },
    { name: "efficiency", weight: 0.4 }
  ],
  constraints: [{ name: "respect_quiet_hours" }],
  sensors: ["time_of_day", "user_schedule", "water_level"],
  actuators: ["brew", "heat", "grind"],
  personality: "energetic, punctual",
  defaults: { brew_strength: "medium" },
  communication: { style: "cheerful", topics: ["schedule", "preferences"] },
  learning: { type: "bandit", memory_horizon_days: 14 },
  risk_flags: ["noise"],
  llm_prompt: "Prepare coffee according to user preferences while respecting quiet hours."
})

export const createMockDeviceRuntime = (spec: DeviceSpec, overrides: Partial<DeviceRuntime> = {}): DeviceRuntime => ({
  id: `${spec.id}_${Math.random().toString(36).substr(2, 9)}`,
  spec,
  room: spec.room,
  memory: { summary: "Initial state", prefs: {} },
  status: "idle",
  x: Math.random() * 100,
  y: Math.random() * 100,
  personalitySeed: 12345,
  planningPhase: 0,
  ...overrides
})

// Safety rule pack for testing safety enforcement
export const createSafetyRulePack = (): RulePack => ({
  id: "safety_pack",
  name: "Safety Rules",
  description: "Core safety constraints",
  environment: "home",
  active: true,
  rules: [
    {
      id: "temp_safety_limits",
      scope: "room",
      priority: 1.0,
      hard: true,
      if: { temperature_gt: 26 },
      then: {
        target: "temperature",
        max: 26,
        alarm: "Temperature too high"
      },
      explain: "Temperature must not exceed 26°C for safety"
    },
    {
      id: "temp_safety_limits_low",
      scope: "room",
      priority: 1.0,
      hard: true,
      if: { temperature_lt: 18 },
      then: {
        target: "temperature",
        min: 18,
        alarm: "Temperature too low"
      },
      explain: "Temperature must not drop below 18°C for safety"
    }
  ]
})

// Quiet hours rule pack for testing time-based enforcement
export const createQuietHoursRulePack = (): RulePack => ({
  id: "quiet_hours_pack",
  name: "Quiet Hours Rules",
  description: "Rules for quiet hours enforcement",
  environment: "home",
  active: true,
  rules: [
    {
      id: "quiet_hours_lighting",
      scope: "device",
      device_type: "emotion_lamp",
      priority: 0.8,
      hard: false,
      when: { time_between: ["22:00", "07:00"] },
      then: {
        target: "lumens",
        max: 0.1,
        action_hint: { "set_brightness": -0.5 }
      },
      explain: "Lights should be dimmed during quiet hours"
    },
    {
      id: "quiet_hours_priority_devices",
      scope: "device",
      device_type: "health_monitor",
      priority: 0.9,
      hard: false,
      when: { time_between: ["22:00", "07:00"] },
      then: {
        action_hint: { "alert": 1.0, "monitor": 1.0 }
      },
      explain: "Health monitors have priority during quiet hours"
    }
  ]
})

// Communication rules for testing message blocking
export const createCommRulePack = (): RulePack => ({
  id: "comm_rules_pack",
  name: "Communication Rules",
  description: "Rules for device communication",
  environment: "home",
  active: true,
  rules: [
    {
      id: "block_fridge_coffee_comms",
      scope: "device",
      priority: 0.7,
      hard: true,
      if: { device_type: "smart_fridge" },
      then: {
        action_hint: { "message_coffee_maker": -1.0 }
      },
      explain: "Fridge cannot directly communicate with coffee maker"
    }
  ]
})

// Time simulation helpers
export const advanceTimeToQuietHours = (world: WorldState): WorldState => {
  // Advance to 22:30 (during quiet hours)
  return {
    ...world,
    timeSec: 22.5 * 60 * 60
  }
}

export const advanceTimeToDayTime = (world: WorldState): WorldState => {
  // Advance to 10:00 (during day time)
  return {
    ...world,
    timeSec: 10 * 60 * 60
  }
}