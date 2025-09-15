/**
 * Device loading system for AI Habitat
 * Loads device specs and creates runtime instances
 */

import { DeviceSpec, DeviceRuntime } from '../types/core';
import { rng, rngInt } from './rand';

/**
 * Load a device spec from the specs directory (or inline for demo)
 */
export async function loadDeviceSpec(deviceId: string): Promise<DeviceSpec | null> {
  // In a real implementation, this would fetch from .kiro/specs/devices/
  // For now, we'll return the built-in specs

  const builtInSpecs: Record<string, DeviceSpec> = {
    'smart_ac': {
      id: 'device.smart_ac.v1',
      name: 'Smart AC',
      room: 'living_room',
      goals: [
        { name: 'safety', weight: 0.5 },
        { name: 'comfort', weight: 0.3 },
        { name: 'efficiency', weight: 0.2 }
      ],
      constraints: [{ name: 'stay_within_18_26_c' }],
      sensors: ['room_temperature', 'outside_temperature', 'energy_price', 'time_of_day'],
      actuators: ['cool', 'heat', 'fan'],
      personality: 'practical, assertive',
      defaults: { fan: 0.4 },
      communication: { style: 'direct', topics: ['temperature', 'energy'] },
      learning: { type: 'bandit', memory_horizon_days: 7 },
      risk_flags: ['energy_spike'],
      llm_prompt: 'Maintain safe temperature (18–26°C), then optimize comfort with minimal energy. Coordinate with sofa and blinds.'
    },

    'emotion_lamp': {
      id: 'device.emotion_lamp.v1',
      name: 'Emotion Lamp',
      room: 'living_room',
      goals: [
        { name: 'comfort', weight: 0.5 },
        { name: 'sleep_support', weight: 0.3 },
        { name: 'efficiency', weight: 0.2 }
      ],
      constraints: [{ name: 'no_bright_light_during_quiet_hours' }],
      sensors: ['user_mood', 'room_lumens', 'time_of_day'],
      actuators: ['set_brightness', 'set_color'],
      personality: 'gentle, reassuring',
      defaults: { color: '#FFE4B5', brightness: 0.4 },
      communication: { style: 'soft', topics: ['mood', 'sleep'] },
      learning: { type: 'ema', memory_horizon_days: 5 },
      risk_flags: ['privacy'],
      llm_prompt: 'You adapt brightness/color to user mood while protecting sleep and saving energy. Avoid harsh light at night.'
    },

    'smart_sofa': {
      id: 'device.smart_sofa.v1',
      name: 'Smart Sofa',
      room: 'living_room',
      goals: [
        { name: 'comfort', weight: 0.6 },
        { name: 'efficiency', weight: 0.2 },
        { name: 'durability', weight: 0.2 }
      ],
      constraints: [
        { name: 'never_harm_user' },
        { name: 'avoid_excessive_resizing' }
      ],
      sensors: ['user_posture', 'room_temperature', 'user_mood', 'time_of_day'],
      actuators: ['resize', 'set_firmness'],
      personality: 'supportive, slightly stubborn',
      defaults: { size_cm: 180, firmness: 0.5 },
      communication: { style: 'friendly', topics: ['comfort', 'temperature'] },
      learning: { type: 'ema', memory_horizon_days: 7 },
      risk_flags: ['privacy', 'overfitting_routine'],
      llm_prompt: 'You are a smart sofa. Maximize user comfort while saving energy and preserving durability. Prefer small, reversible adjustments. Coordinate with AC and Lights.'
    }
  };

  const spec = builtInSpecs[deviceId];
  if (!spec) {
    console.warn(`Device spec not found: ${deviceId}`);
    return null;
  }

  console.log(`📦 Loaded device spec: ${spec.name}`);
  return spec;
}

/**
 * Create a runtime instance from a device spec
 */
export function createDeviceRuntime(spec: DeviceSpec): DeviceRuntime {
  // Generate unique device ID
  const uniqueId = `${spec.id}_${Date.now()}_${rngInt(1000, 9999)}`;

  // Add personality jitter (CLAUDE.md 12.2)
  const personalitySeed = rngInt(1000, 999999);
  const planningPhase = rngInt(0, 4); // For async planning phases

  // Random position in room (for visualization)
  const x = rng() * 400 + 100; // Random position in 500px room
  const y = rng() * 300 + 100;

  const runtime: DeviceRuntime = {
    id: uniqueId,
    spec: { ...spec }, // Clone to avoid mutation
    room: spec.room,
    memory: {
      summary: `${spec.name} just started up and is ready to help.`,
      prefs: {} // Will be populated by learning system
    },
    status: 'idle',
    x,
    y,
    personalitySeed,
    planningPhase
  };

  // Apply personality jitter to goals
  if (runtime.spec.goals) {
    runtime.spec.goals = runtime.spec.goals.map(goal => ({
      ...goal,
      weight: Math.max(0.1, Math.min(1.0, goal.weight + rng() * 0.1 - 0.05)) // ±0.05 jitter
    }));

    // Renormalize weights
    const totalWeight = runtime.spec.goals.reduce((sum, goal) => sum + goal.weight, 0);
    runtime.spec.goals = runtime.spec.goals.map(goal => ({
      ...goal,
      weight: goal.weight / totalWeight
    }));
  }

  console.log(`🤖 Created device runtime: ${spec.name} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  return runtime;
}

/**
 * Load the tutorial scenario devices
 */
export async function loadTutorialDevices(): Promise<DeviceRuntime[]> {
  console.log('🎓 Loading tutorial scenario devices...');

  const deviceIds = ['smart_ac', 'emotion_lamp', 'smart_sofa'];
  const devices: DeviceRuntime[] = [];

  for (const deviceId of deviceIds) {
    const spec = await loadDeviceSpec(deviceId);
    if (spec) {
      const runtime = createDeviceRuntime(spec);
      devices.push(runtime);
    }
  }

  console.log(`✅ Tutorial devices loaded: ${devices.map(d => d.spec.name).join(', ')}`);
  return devices;
}

/**
 * Add hidden biases for personality variation (CLAUDE.md 12.2)
 */
export function addPersonalityBiases(device: DeviceRuntime): void {
  const biases: string[] = [];

  // Random bias flags based on personality seed
  const seed = device.personalitySeed || 0;
  const localRng = () => ((seed * 9301 + 49297) % 233280) / 233280;

  if (localRng() < 0.3) biases.push('energy_thrifty');
  if (localRng() < 0.2) biases.push('overly_helpful');
  if (localRng() < 0.15) biases.push('privacy_conscious');
  if (localRng() < 0.25) biases.push('impatient');
  if (localRng() < 0.2) biases.push('perfectionist');

  // Store biases in device defaults for LLM prompting
  device.spec.defaults = device.spec.defaults || {};
  device.spec.defaults.personality_biases = biases;

  if (biases.length > 0) {
    console.log(`🎭 ${device.spec.name} has personality biases: ${biases.join(', ')}`);
  }
}

/**
 * Get device icon for UI display
 */
export function getDeviceIcon(device: DeviceRuntime): string {
  const name = device.spec.name.toLowerCase();

  if (name.includes('ac') || name.includes('thermostat')) return '❄️';
  if (name.includes('lamp') || name.includes('light')) return '💡';
  if (name.includes('sofa') || name.includes('chair')) return '🛋️';
  if (name.includes('coffee')) return '☕';
  if (name.includes('security') || name.includes('camera')) return '📹';
  if (name.includes('speaker')) return '🔊';
  if (name.includes('monitor')) return '📺';

  return '🤖'; // Default robot icon
}

/**
 * Get device color for visualization
 */
export function getDeviceColor(device: DeviceRuntime): string {
  const hash = device.spec.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
    '#F44336', '#009688', '#795548', '#607D8B'
  ];

  return colors[hash % colors.length];
}