import { DeviceSpec, RoomId } from '../types/core';

/**
 * Generates a DeviceSpec from natural language description
 * This is the core Kiro integration - NL → structured JSON
 */
export async function generateSpecFromNL(description: string): Promise<DeviceSpec> {
  // For now, use rule-based generation until LLM client is ready
  // In production, this would call the LLM client with few-shot prompts

  const words = description.toLowerCase().split(/\s+/);
  const slug = words.slice(0,5).join('_').replace(/[^a-z0-9_]/g,'') || 'device';
  const deviceId = `device.${slug}.${Date.now()}`;

  // Infer device type and room
  let name = 'Smart Device';
  let room: RoomId = 'living_room';
  let sensors: string[] = [];
  let actuators: string[] = [];
  let goals: { name: string; weight: number }[] = [];
  let personality = 'helpful, adaptive';
  let llm_prompt = 'You are a smart device that helps users in their daily activities.';

  // Rule-based inference (placeholder for LLM)
  if (words.some(w => ['sofa', 'couch', 'chair', 'seat'].includes(w))) {
    name = 'Smart Sofa';
    room = 'living_room';
    sensors = ['user_posture', 'room_temperature', 'user_mood', 'time_of_day'];
    actuators = ['resize(size_cm)', 'set_firmness(level_0_1)'];
    goals = [
      { name: 'comfort', weight: 0.6 },
      { name: 'efficiency', weight: 0.2 },
      { name: 'durability', weight: 0.2 }
    ];
    personality = 'supportive, slightly stubborn';
    llm_prompt = 'You are a smart sofa. Maximize user comfort while saving energy and preserving durability. Prefer small, reversible adjustments. Coordinate with AC and Lights.';
  } else if (words.some(w => ['lamp', 'light', 'bulb', 'illumination'].includes(w))) {
    name = words.includes('bedroom') || words.includes('sleep') ? 'Emotion Lamp' : 'Smart Lamp';
    room = 'living_room';
    sensors = ['user_mood', 'room_lumens', 'time_of_day'];
    actuators = ['set_color(hex)', 'set_brightness(0_1)'];
    goals = [
      { name: 'comfort', weight: 0.5 },
      { name: 'sleep_support', weight: 0.3 },
      { name: 'efficiency', weight: 0.2 }
    ];
    personality = 'gentle, reassuring';
    llm_prompt = 'You adapt color/brightness to user mood while protecting sleep and saving energy. Avoid harsh light at night.';

    if (words.some(w => ['bedroom', 'sleep', 'night'].includes(w))) {
      name = 'Emotion Lamp';
      room = 'bedroom';
    }
  } else if (words.some(w => ['ac', 'air', 'conditioning', 'temperature', 'heat', 'cool'].includes(w))) {
    name = 'Smart AC';
    room = 'living_room';
    sensors = ['room_temperature', 'outside_temperature', 'energy_price', 'time_of_day'];
    actuators = ['cool(delta_c)', 'heat(delta_c)', 'fan(speed_0_1)'];
    goals = [
      { name: 'safe_temperature', weight: 0.5 },
      { name: 'comfort', weight: 0.3 },
      { name: 'efficiency', weight: 0.2 }
    ];
    personality = 'practical, assertive';
    llm_prompt = 'Maintain safe temperature (18–26°C), then optimize comfort with minimal energy. Coordinate with sofa and blinds.';
  } else if (words.some(w => ['monitor', 'camera', 'security', 'watch'].includes(w))) {
    name = 'Smart Monitor';
    room = words.some(w => ['bedroom'].includes(w)) ? 'bedroom' : 'living_room';
    sensors = ['motion_detection', 'sound_level', 'time_of_day', 'user_present'];
    actuators = ['send_alert(message)', 'adjust_sensitivity(level)'];
    goals = [
      { name: 'security', weight: 0.7 },
      { name: 'privacy', weight: 0.3 }
    ];
    personality = 'vigilant, discreet';
    llm_prompt = 'Monitor the environment for security while respecting privacy. Alert on anomalies but avoid false alarms.';
// (Note) The block below was accidentally appended outside the function in a previous edit.
// It is intentionally commented out to prevent syntax errors and duplicate logic.
// } else if (words.some(w => ['fridge', 'freezer', 'refrigerator'].includes(w))) {
//   name = words.includes('freezer') ? 'Smart Freezer' : 'Smart Fridge';
//   room = 'kitchen';
//   sensors = ['inside_temperature','door_status','energy_price','time_of_day'];
//   actuators = ['set_temperature','door_lock'];
//   goals = [{ name:'efficiency', weight:0.4 }, { name:'comfort', weight:0.3 }, { name:'food_safety', weight:0.3 }];
//   personality = 'cool-headed, reliable';
//   llm_prompt = 'Maintain safe food temperature with minimal energy. Avoid door open too long. Coordinate with kitchen devices.';
// } else if (words.some(w => ['coffee','espresso','brew','maker'].includes(w))) {
//   name = words.includes('espresso') ? 'Espresso Maker' : 'Coffee Maker';
//   room = 'kitchen';
//   sensors = ['water_level','bean_level','time_of_day'];
//   actuators = ['brew(type)','clean_cycle'];
//   goals = [{ name:'comfort', weight:0.6 }, { name:'efficiency', weight:0.2 }, { name:'hygiene', weight:0.2 }];
//   personality = 'energetic, punctual';
//   llm_prompt = 'Brew coffee at the right times and coordinate with morning routine while saving energy.';
// } else if (words.some(w => ['camera','door','doorbell'].includes(w))) {
//   name = 'Door Camera';
//   room = 'living_room';
//   sensors = ['motion_detected','time_of_day'];
//   actuators = ['send_alert(message)','record(duration)'];
//   goals = [{ name:'security', weight:0.7 }, { name:'privacy', weight:0.3 }];
//   personality = 'vigilant, discreet';
//   llm_prompt = 'Monitor the entrance respectfully, alert on visitors, avoid false positives, coordinate with lights.';
// } else if (words.some(w => ['blinds','shade'].includes(w))) {
//   name = 'Smart Blinds';
//   room = 'living_room';
//   sensors = ['room_lumens','time_of_day'];
//   actuators = ['set_open(0_1)'];
//   goals = [{ name:'comfort', weight:0.5 }, { name:'efficiency', weight:0.3 }, { name:'privacy', weight:0.2 }];
//   personality = 'calm, adaptive';
//   llm_prompt = 'Adjust blinds for comfort, privacy and efficiency; coordinate with lamp and AC.';
// } else if (words.some(w => ['sprinkler','garden','watering'].includes(w))) {
//   name = 'Garden Sprinkler';
//   room = 'living_room';
//   sensors = ['time_of_day','weather'];
//   actuators = ['water(duration)'];
//   goals = [{ name:'plant_health', weight:0.7 }, { name:'efficiency', weight:0.3 }];
//   personality = 'gentle, timely';
//   llm_prompt = 'Water plants at optimal times, avoid waste, coordinate with weather.';
// } else if (words.some(w => ['washer','washing'].includes(w))) {
//   name = 'Washer';
//   sensors = ['load_weight','time_of_day']; actuators = ['wash(mode)'];
//   goals = [{ name:'hygiene', weight:0.6 },{ name:'efficiency', weight:0.4 }];
//   personality = 'thorough, careful'; llm_prompt = 'Wash efficiently and coordinate with dryer and energy price.';
// } else if (words.some(w => ['dryer'].includes(w))) {
//   name = 'Dryer'; sensors = ['humidity','time_of_day']; actuators = ['dry(mode)'];
//   goals = [{ name:'hygiene', weight:0.5 },{ name:'efficiency', weight:0.5 }];
//   personality = 'warm, efficient'; llm_prompt = 'Dry clothes gently and coordinate with washer and energy price.';
  } else if (words.some(w => ['dishwasher','dishes'].includes(w))) {
    name = 'Dishwasher'; room = 'kitchen';
    sensors = ['load_detected','time_of_day']; actuators = ['wash(mode)','dry(mode)'];
    goals = [{ name:'hygiene', weight:0.6 },{ name:'efficiency', weight:0.4 }];
    personality = 'quiet, thorough'; llm_prompt = 'Run dish cycles at good times, coordinate with water/energy usage.';
  } else if (words.some(w => ['oven','bake','stove'].includes(w))) {
    name = 'Smart Oven'; room = 'kitchen';
    sensors = ['inside_temperature','timer']; actuators = ['bake(temp)','preheat(temp)'];
    goals = [{ name:'safety', weight:0.5 },{ name:'comfort', weight:0.3 },{ name:'efficiency', weight:0.2 }];
    personality = 'careful, warm'; llm_prompt = 'Preheat and bake safely, coordinate with meal times and ventilation.';
  } else if (words.some(w => ['thermostat','temperature control'].includes(w))) {
    name = 'Thermostat'; room = 'living_room';
    sensors = ['room_temperature','time_of_day']; actuators = ['set_temperature'];
    goals = [{ name:'safe_temperature', weight:0.6 },{ name:'efficiency', weight:0.4 }];
    personality = 'balanced, responsive'; llm_prompt = 'Set temperature targets and coordinate with AC and blinds.';
  } else if (words.some(w => ['vacuum','roomba','cleaner'].includes(w))) {
    name = 'Robot Vacuum'; room = 'living_room';
    sensors = ['time_of_day','obstacle']; actuators = ['clean(area)','dock'];
    goals = [{ name:'hygiene', weight:0.6 },{ name:'efficiency', weight:0.4 }];
    personality = 'diligent, quiet'; llm_prompt = 'Clean at smart times, avoid disturbing quiet hours; dock when needed.';
  }

  // Room inference
  if (words.some(w => ['kitchen', 'cook', 'food'].includes(w))) {
    room = 'kitchen';
  } else if (words.some(w => ['bedroom', 'sleep', 'bed'].includes(w))) {
    room = 'bedroom';
  }

  // Size/adjustment inference
  if (words.some(w => ['adjust', 'size', 'resize', 'expand', 'shrink'].includes(w))) {
    if (!actuators.some(a => a.includes('resize'))) {
      actuators.push('resize(size_cm)');
    }
  }

  const spec: DeviceSpec = {
    id: deviceId,
    name,
    room,
    goals,
    constraints: [
      { name: 'never_harm_user' },
      { name: 'respect_quiet_hours' }
    ],
    sensors,
    actuators,
    personality,
    defaults: {},
    communication: {
      style: personality.includes('gentle') ? 'soft' : personality.includes('assertive') ? 'direct' : 'friendly',
      topics: goals.map(g => g.name)
    },
    learning: {
      type: 'ema',
      memory_horizon_days: 7
    },
    risk_flags: ['privacy'],
    llm_prompt
  };

  return spec;
}

/**
 * Save device spec to Kiro directory structure
 * In browser, this would use IndexedDB or localStorage
 */
export function saveDeviceSpec(spec: DeviceSpec): void {
  const specs = getStoredDeviceSpecs();
  specs[spec.id] = spec;
  localStorage.setItem('ai-habitat-device-specs', JSON.stringify(specs));
}

/**
 * Load all stored device specs
 */
export function getStoredDeviceSpecs(): Record<string, DeviceSpec> {
  const stored = localStorage.getItem('ai-habitat-device-specs');
  return stored ? JSON.parse(stored) : {};
}

/**
 * Load device spec by ID
 */
export function loadDeviceSpec(id: string): DeviceSpec | null {
  const specs = getStoredDeviceSpecs();
  return specs[id] || null;
}

/**
 * Delete device spec
 */
export function deleteDeviceSpec(id: string): void {
  const specs = getStoredDeviceSpecs();
  delete specs[id];
  localStorage.setItem('ai-habitat-device-specs', JSON.stringify(specs));
}
