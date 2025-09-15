import { WorldState, DeviceRuntime } from '@/types/core';
import { createDeviceRuntime } from './deviceLoader';

// Import device specs JSON
// @ts-ignore
import smart_ac from '../../.kiro/specs/devices/smart_ac.json';
// @ts-ignore
import smart_sofa from '../../.kiro/specs/devices/smart_sofa.json';
// @ts-ignore
import emotion_lamp from '../../.kiro/specs/devices/emotion_lamp.json';
// @ts-ignore
import tutorial from '@/scenarios/tutorial_home.json';

const specMap: Record<string, any> = {
  'smart_ac.json': smart_ac,
  'smart_sofa.json': smart_sofa,
  'emotion_lamp.json': emotion_lamp
};

export async function loadTutorialScenario(world: WorldState): Promise<DeviceRuntime[]> {
  const devices: DeviceRuntime[] = [];

  // Apply initial world state if present
  if ((tutorial as any).initial_world_state) {
    const init = (tutorial as any).initial_world_state;
    world.timeSec = init.timeSec ?? world.timeSec;
    if (init.rooms) world.rooms = { ...world.rooms, ...init.rooms };
    if (init.resources) world.resources = { ...world.resources, ...init.resources };
    if (init.policies) world.policies = { ...world.policies, ...init.policies } as any;
    world.health = init.health ?? world.health;
    world.speed = init.speed ?? world.speed;
  }

  for (const preset of (tutorial as any).preset_devices || []) {
    const specJson = specMap[preset.spec_file];
    if (!specJson) continue;
    const runtime = createDeviceRuntime(specJson);
    if (preset.room_override) runtime.room = preset.room_override;
    if (preset.position) {
      runtime.x = preset.position.x;
      runtime.y = preset.position.y;
    }
    if (preset.initial_state?.status) runtime.status = preset.initial_state.status;
    if (preset.initial_state?.memory) runtime.memory = preset.initial_state.memory;
    devices.push(runtime);
  }

  return devices;
}

