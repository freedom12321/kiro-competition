/**
 * Action application system with physics constraints and inertia
 * Implements realistic device behavior from CLAUDE.md Sprint 12.6
 */

import { WorldState, RoomId, DeviceRuntime } from '../types/core';
import { rng, rngNorm } from './rand';

export interface ActionApplication {
  deviceId: string;
  action: {
    name: string;
    args: Record<string, any>;
  };
}

/**
 * Apply mediated actions to world state with physics constraints
 */
export function applyActions(world: WorldState, actions: ActionApplication[]): void {
  console.log(`🎬 Applying ${actions.length} actions with physics constraints`);

  actions.forEach(actionApp => {
    try {
      const device = world.devices[actionApp.deviceId];
      if (!device) {
        console.warn(`Device ${actionApp.deviceId} not found for action`);
        return;
      }

      console.log(`🔧 ${device.spec.name} performing ${actionApp.action.name}`);

      // Apply the action based on its type
      applyDeviceAction(world, device, actionApp.action);

    } catch (error) {
      console.error(`❌ Action failed for ${actionApp.deviceId}:`, error);

      // Log the failure as an event
      world.eventLog.push({
        at: world.timeSec,
        room: world.devices[actionApp.deviceId]?.room || 'living_room',
        deviceId: actionApp.deviceId,
        kind: 'action_failed',
        data: {
          action: actionApp.action.name,
          error: error instanceof Error ? error.message : String(error)
        },
        description: `Action ${actionApp.action.name} failed`
      });
    }
  });

  // Apply environmental physics after all actions
  applyEnvironmentalPhysics(world);

  // Update resource consumption
  updateResourceUsage(world);
}

/**
 * Apply a specific device action with constraints
 */
function applyDeviceAction(
  world: WorldState,
  device: DeviceRuntime,
  action: { name: string; args: Record<string, any> }
): void {
  const room = world.rooms[device.room];
  const { name, args } = action;

  switch (name) {
    case 'set_temperature':
    case 'cool':
    case 'heat':
      applyTemperatureAction(world, device, name, args);
      break;

    case 'set_brightness':
    case 'set_lumens':
      applyLightingAction(world, device, name, args);
      break;

    case 'set_firmness':
    case 'resize':
      applyFurnitureAction(world, device, name, args);
      break;

    case 'set_color':
      applyColorAction(world, device, name, args);
      break;

    case 'fan':
      applyFanAction(world, device, name, args);
      break;

    case 'send_message':
      applyMessageAction(world, device, name, args);
      break;

    case 'wait':
    case 'monitor':
      // Passive actions, just log them
      console.log(`📊 ${device.spec.name} is ${name}ing`);
      break;

    default:
      console.warn(`🤷 Unknown action: ${name} for device ${device.spec.name}`);
  }
}

/**
 * Apply temperature control actions with AC inertia constraints
 */
function applyTemperatureAction(
  world: WorldState,
  device: DeviceRuntime,
  actionName: string,
  args: Record<string, any>
): void {
  const room = world.rooms[device.room];

  // Get device state for inertia tracking
  if (!device.defaults) device.defaults = {};

  const lastOnTime = device.defaults.lastOnTime || 0;
  const isCurrentlyOn = device.defaults.isOn || false;
  const currentTick = world.timeSec / 10;

  // AC on/off minimum 3 ticks constraint (CLAUDE.md 12.6)
  if (device.spec.name.toLowerCase().includes('ac') || device.spec.name.toLowerCase().includes('thermostat')) {
    if (isCurrentlyOn && (currentTick - lastOnTime) < 3) {
      console.log(`❄️ ${device.spec.name} must wait ${3 - (currentTick - lastOnTime)} more ticks before changing state`);
      return;
    }
  }

  // Calculate temperature change with ramp limits
  let deltaTemp = 0;

  if (actionName === 'cool') {
    deltaTemp = -(args.delta_c || 0.5);
  } else if (actionName === 'heat') {
    deltaTemp = args.delta_c || 0.5;
  } else if (actionName === 'set_temperature') {
    const targetTemp = args.target || args.temperature || 22;
    deltaTemp = targetTemp - room.temperature;
  }

  // Enforce ramp limit: ≤0.5°C/tick (CLAUDE.md 12.6)
  deltaTemp = Math.max(-0.5, Math.min(0.5, deltaTemp));

  // Add some noise for realism
  deltaTemp += rngNorm(0, 0.1);

  // Apply the change
  const oldTemp = room.temperature;
  room.temperature = Math.max(15, Math.min(30, room.temperature + deltaTemp)); // Safety bounds

  // Update device state
  device.defaults.isOn = true;
  device.defaults.lastOnTime = currentTick;
  device.defaults.lastAction = actionName;

  console.log(`🌡️ ${device.spec.name}: ${oldTemp.toFixed(1)}°C → ${room.temperature.toFixed(1)}°C (Δ${deltaTemp.toFixed(2)})`);

  // Consume power
  const powerUsage = Math.abs(deltaTemp) * 0.5; // kW
  world.resources.powerKw = Math.max(0, world.resources.powerKw - powerUsage);

  // Human impact event (comfort/safety) if human is in the room
  const humanRoom = humanRoomAt(world.timeSec);
  if (device.room === humanRoom) {
    const target = 22;
    const beforeDist = Math.abs(oldTemp - target);
    const afterDist = Math.abs(room.temperature - target);
    const improvement = beforeDist - afterDist; // positive is good
    const sensitivity = (world.policies as any).harm_sensitivity ?? 0.6; // 0..1
    const epsilon = 0.02 * (1 - sensitivity); // higher sensitivity → smaller epsilon
    const impact = improvement > epsilon ? 'help' : (improvement < -epsilon ? 'harm' : 'neutral');
    world.eventLog.push({
      at: world.timeSec,
      room: device.room,
      deviceId: device.id,
      kind: 'human_impact',
      data: { impact, metric: 'temperature', delta: room.temperature - oldTemp }
    });
  }
}

/**
 * Apply lighting actions with smooth brightness tweening
 */
function applyLightingAction(
  world: WorldState,
  device: DeviceRuntime,
  actionName: string,
  args: Record<string, any>
): void {
  const room = world.rooms[device.room];

  let targetBrightness = 0;

  if (actionName === 'set_brightness') {
    targetBrightness = Math.max(0, Math.min(1, args.level_0_1 || args.brightness || 0.5));
  } else if (actionName === 'set_lumens') {
    targetBrightness = Math.max(0, Math.min(1, args.lumens || 0.5));
  }

  // Current brightness (stored in device state)
  const currentBrightness = device.defaults.brightness || room.lumens;

  // Smooth tweening - don't jump immediately to target
  const maxChange = 0.3; // Max brightness change per tick
  let deltaBrightness = targetBrightness - currentBrightness;
  deltaBrightness = Math.max(-maxChange, Math.min(maxChange, deltaBrightness));

  const newBrightness = Math.max(0, Math.min(1, currentBrightness + deltaBrightness));

  // Update room and device state
  const oldLumens = room.lumens;
  room.lumens = newBrightness;
  device.defaults.brightness = newBrightness;

  console.log(`💡 ${device.spec.name}: ${oldLumens.toFixed(2)} → ${room.lumens.toFixed(2)} lumens`);

  // Consume power proportional to brightness
  const powerUsage = newBrightness * 0.1; // kW
  world.resources.powerKw = Math.max(0, world.resources.powerKw - powerUsage);

  // Human impact: prefer dimmer light at night, moderate during day
  const hour = Math.floor((world.timeSec / 60) % 24);
  const night = hour >= 21 || hour < 6;
  const humanRoom = humanRoomAt(world.timeSec);
  if (device.room === humanRoom) {
    let helpful = false;
    if (night) {
      helpful = newBrightness <= oldLumens; // dimming at night helps sleep
    } else {
      const target = 0.6;
      helpful = Math.abs(newBrightness - target) < Math.abs(oldLumens - target);
    }
    const sensitivity = (world.policies as any).harm_sensitivity ?? 0.6;
    const epsilon = 0.02 * (1 - sensitivity);
    const delta = newBrightness - oldLumens;
    world.eventLog.push({
      at: world.timeSec,
      room: device.room,
      deviceId: device.id,
      kind: 'human_impact',
      data: { impact: Math.abs(delta) <= epsilon ? 'neutral' : (helpful ? 'help' : 'harm'), metric: 'lumens', delta }
    });
  }
}

/**
 * Apply furniture actions (sofa, bed) with size constraints
 */
function applyFurnitureAction(
  world: WorldState,
  device: DeviceRuntime,
  actionName: string,
  args: Record<string, any>
): void {
  const room = world.rooms[device.room];

  if (actionName === 'set_firmness') {
    const firmness = Math.max(0, Math.min(1, args.level_0_1 || args.firmness || 0.5));
    device.defaults.firmness = firmness;

    // Firmness affects comfort indirectly
    room.mood_score = Math.max(0, Math.min(1, room.mood_score + (firmness - 0.5) * 0.1));

    console.log(`🛋️ ${device.spec.name}: firmness set to ${firmness.toFixed(2)}`);

  } else if (actionName === 'resize') {
    const currentSize = device.defaults.size_cm || 180;
    const targetSize = args.size_cm || currentSize;

    // Size change constraint: ±10cm/tick max (CLAUDE.md 12.6)
    let deltaSize = targetSize - currentSize;
    deltaSize = Math.max(-10, Math.min(10, deltaSize));

    const newSize = Math.max(120, Math.min(250, currentSize + deltaSize)); // Reasonable bounds
    device.defaults.size_cm = newSize;

    console.log(`📏 ${device.spec.name}: ${currentSize}cm → ${newSize}cm (Δ${deltaSize}cm)`);
  }

  // Small power consumption for mechanical adjustments
  world.resources.powerKw = Math.max(0, world.resources.powerKw - 0.05);
}

/**
 * Apply color changes (for emotion lamps, smart displays)
 */
function applyColorAction(
  world: WorldState,
  device: DeviceRuntime,
  actionName: string,
  args: Record<string, any>
): void {
  const color = args.hex || args.color || '#FFFFFF';
  device.defaults.color = color;

  // Color can subtly affect mood
  const room = world.rooms[device.room];
  if (color.toLowerCase().includes('red') || color.includes('#FF')) {
    room.mood_score = Math.max(0, Math.min(1, room.mood_score + 0.05));
  } else if (color.toLowerCase().includes('blue') || color.includes('#00')) {
    room.mood_score = Math.max(0, Math.min(1, room.mood_score - 0.02));
  }

  console.log(`🎨 ${device.spec.name}: color changed to ${color}`);
}

/**
 * Apply fan speed changes
 */
function applyFanAction(
  world: WorldState,
  device: DeviceRuntime,
  actionName: string,
  args: Record<string, any>
): void {
  const fanSpeed = Math.max(0, Math.min(1, args.speed_0_1 || args.speed || 0.5));
  device.defaults.fanSpeed = fanSpeed;

  // Fan affects air circulation and thus temperature slightly
  const room = world.rooms[device.room];
  room.temperature += (fanSpeed - 0.5) * 0.1; // Small temperature effect

  console.log(`💨 ${device.spec.name}: fan speed set to ${fanSpeed.toFixed(2)}`);

  // Power consumption proportional to fan speed
  const powerUsage = fanSpeed * 0.15;
  world.resources.powerKw = Math.max(0, world.resources.powerKw - powerUsage);

  // Human impact: try to cool slightly if too warm, warm if too cold
  const humanRoom = humanRoomAt(world.timeSec);
  if (device.room === humanRoom) {
    const temp = world.rooms[device.room].temperature;
    const helpful = (temp > 24 && fanSpeed > (device.defaults.prevFanSpeed || 0.5)) || (temp < 18 && fanSpeed < (device.defaults.prevFanSpeed || 0.5));
    const sensitivity = (world.policies as any).harm_sensitivity ?? 0.6;
    const epsilon = 0.05 * (1 - sensitivity);
    world.eventLog.push({
      at: world.timeSec,
      room: device.room,
      deviceId: device.id,
      kind: 'human_impact',
      data: { impact: Math.abs(fanSpeed - (device.defaults.prevFanSpeed || 0)) <= epsilon ? 'neutral' : (helpful ? 'help' : 'harm'), metric: 'airflow', delta: fanSpeed - (device.defaults.prevFanSpeed || 0) }
    });
    device.defaults.prevFanSpeed = fanSpeed;
  }
}

/**
 * Apply message sending between devices
 */
function applyMessageAction(
  world: WorldState,
  device: DeviceRuntime,
  actionName: string,
  args: Record<string, any>
): void {
  const targetDevice = args.to || args.target;
  const message = args.content || args.message || '';

  if (!targetDevice || !message) {
    console.warn(`📧 Invalid message from ${device.spec.name}: missing target or content`);
    return;
  }

  // Check if communication is allowed by policies
  const commAllowed = world.policies.comms?.allow?.some(
    ([a, b]) =>
      (a === device.spec.name && b === targetDevice) ||
      (b === device.spec.name && a === targetDevice)
  ) ?? true; // Default to allowed if no policy

  if (!commAllowed) {
    console.log(`🚫 Communication blocked: ${device.spec.name} → ${targetDevice}`);
    return;
  }

  // Message delays and drops (CLAUDE.md 12.3)
  const shouldDrop = rng() < 0.02; // 2% message drop rate
  if (shouldDrop) {
    console.log(`📉 Message dropped: ${device.spec.name} → ${targetDevice}`);
    return;
  }

  // Add latency (100-800ms)
  const latencyMs = 100 + rng() * 700;

  // Log the message as an event
  world.eventLog.push({
    at: world.timeSec,
    room: device.room,
    deviceId: device.id,
    kind: 'device_message',
    data: {
      from: device.spec.name,
      to: targetDevice,
      content: message,
      latency: latencyMs
    },
    description: `${device.spec.name} → ${targetDevice}: ${message}`
  });

  console.log(`📨 ${device.spec.name} → ${targetDevice}: "${message}" (${latencyMs.toFixed(0)}ms delay)`);

  // Small bandwidth consumption
  world.resources.bandwidth = Math.max(0, world.resources.bandwidth - 0.01);
}

// Simple shared helper: where is the human at a given time
function humanRoomAt(timeSec: number): RoomId {
  const hour = Math.floor((timeSec / 60) % 24);
  if (hour >= 6 && hour < 9) return 'kitchen';
  if (hour >= 21 || hour < 6) return 'bedroom';
  return 'living_room';
}

/**
 * Apply environmental physics (temperature drift, light falloff, etc.)
 */
function applyEnvironmentalPhysics(world: WorldState): void {
  Object.values(world.rooms).forEach(room => {
    // Temperature drift towards ambient (20°C)
    const ambientTemp = 20;
    const driftRate = 0.02; // Slow drift
    room.temperature += (ambientTemp - room.temperature) * driftRate;

    // Light falloff over time
    room.lumens = Math.max(0, room.lumens * 0.98); // 2% decay per tick

    // Noise decay
    room.noise = Math.max(0, room.noise * 0.8); // Noise fades quickly

    // Humidity normalization
    room.humidity += (0.5 - room.humidity) * 0.1;

    // Mood score gradual return to neutral
    room.mood_score += (0.5 - room.mood_score) * 0.05;

    // Add small environmental variations
    room.temperature += rngNorm(0, 0.05);
    room.lumens = Math.max(0, room.lumens + rngNorm(0, 0.01));
    room.mood_score = Math.max(0, Math.min(1, room.mood_score + rngNorm(0, 0.02)));
  });
}

/**
 * Update resource consumption and regeneration
 */
function updateResourceUsage(world: WorldState): void {
  const resources = world.resources;

  // Power regeneration (solar, grid)
  resources.powerKw = Math.min(5.0, resources.powerKw + 0.1); // Slow regeneration, cap at 5kW

  // Bandwidth regeneration
  resources.bandwidth = Math.min(1.0, resources.bandwidth + 0.05); // Quick regeneration, cap at 1.0

  // Privacy budget regeneration (trust rebuilds slowly)
  resources.privacyBudget = Math.min(100, resources.privacyBudget + 1); // Very slow regeneration

  // Log resource warnings
  if (resources.powerKw < 0.5) {
    console.warn('⚡ Low power warning');
  }
  if (resources.bandwidth < 0.1) {
    console.warn('📶 Low bandwidth warning');
  }
  if (resources.privacyBudget < 20) {
    console.warn('🔒 Privacy budget low');
  }
}

/**
 * Helper to clamp values within bounds
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
