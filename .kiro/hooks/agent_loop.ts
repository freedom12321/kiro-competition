import { WorldState, DeviceRuntime, AgentStep, AgentContext, MediationResult } from '../types/core';
import { ruleEngine } from '../policies/ruleEngine';
import BatchingLLMClient from '../agents/batchingClient';

/**
 * Main agent loop - executes every simulation tick (10 seconds)
 * Implements the per-tick pipeline from CLAUDE.md Sprint 4.1 + Sprint 10.1 batching
 */
export async function tick(world: WorldState): Promise<void> {
  const batchingClient = BatchingLLMClient.getInstance();

  try {
    // Step 0: Advance tick for batching client
    batchingClient.advanceTick();

    // Step 1: Build agent contexts for all devices
    const contexts = buildAgentContexts(world);

    // Step 2: Plan agent steps (with batching and performance optimization)
    const plans = await planAgentSteps(contexts, world);

    // Step 3: Mediate conflicts and apply rules
    const mediated = await mediate(plans, world);

    // Step 4: Apply winning actions to world state
    applyActions(world, mediated.actions);

    // Step 5: Log events and update derived metrics
    logEvents(world, mediated.logs);
    updateWorldDerived(world);

    // Step 6: Update device statuses based on actions taken
    updateDeviceStatuses(world, mediated);

    // Step 7: Director system - maintain activity levels
    await runDirector(world, mediated);

    // Step 8: Log performance stats periodically
    if (world.randTick % 10 === 0) {
      const stats = batchingClient.getStats();
      world.eventLog.push({
        at: world.timeSec,
        room: 'living_room',
        kind: 'performance_stats',
        data: stats
      });
    }

  } catch (error) {
    console.error('Agent loop error:', error);

    // Fallback: basic physics update only
    updateWorldPhysics(world);

    world.eventLog.push({
      at: world.timeSec,
      room: 'living_room',
      kind: 'agent_loop_error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}

/**
 * Build contexts for all devices that need to plan
 */
function buildAgentContexts(world: WorldState): AgentContext[] {
  const contexts: AgentContext[] = [];

  for (const [deviceId, device] of Object.entries(world.devices)) {
    // Performance optimization: only plan when necessary
    if (shouldDevicePlan(device, world)) {
      const context = buildSingleAgentContext(device, world);
      contexts.push(context);
    }
  }

  return contexts;
}

/**
 * Determine if a device needs to plan this tick (Sprint 10.1 performance)
 */
function shouldDevicePlan(device: DeviceRuntime, world: WorldState): boolean {
  // Always plan if there's a new conflict or context change
  if (device.status === 'conflict' || hasContextChanged(device, world)) {
    return true;
  }

  // Deep think every 6 ticks
  if (world.randTick % 6 === 0) {
    return true;
  }

  // Round-robin planning based on device's planning phase (Sprint 12.7)
  if (device.planningPhase !== undefined) {
    return world.randTick % 4 === device.planningPhase;
  }

  // Default: don't plan (use heuristics instead)
  return false;
}

/**
 * Build context for a single agent
 */
function buildSingleAgentContext(device: DeviceRuntime, world: WorldState): AgentContext {
  const roomState = world.rooms[device.room];

  // Get recent messages for this device
  const lastMessages = world.eventLog
    .filter(e => e.kind === 'message' && e.data?.to === device.id)
    .slice(-3)
    .map(e => ({
      from: e.deviceId || 'unknown',
      content: e.data?.content || '',
      at: e.at
    }));

  // Get available actions from device spec
  const availableActions = device.spec.actuators;

  // Get other devices for coordination
  const otherDevices = Object.values(world.devices)
    .filter(d => d.id !== device.id)
    .map(d => ({
      id: d.id,
      room: d.room,
      status: d.status
    }));

  return {
    spec: device.spec,
    room_snapshot: roomState,
    policies: world.policies,
    last_messages: lastMessages,
    available_actions: availableActions,
    world_time: world.timeSec,
    other_devices: otherDevices
  };
}

/**
 * Plan agent steps with batching and performance optimization (Sprint 10.1)
 */
async function planAgentSteps(
  contexts: AgentContext[],
  world: WorldState
): Promise<{ deviceId: string; plan: AgentStep }[]> {
  const plans: { deviceId: string; plan: AgentStep }[] = [];
  const batchingClient = BatchingLLMClient.getInstance();

  // Use batching client for all planning
  for (const context of contexts) {
    try {
      const plan = await batchingClient.planAgentStep(context);
      plans.push({
        deviceId: context.spec.id,
        plan
      });
    } catch (error) {
      console.warn(`Batched planning failed for ${context.spec.id}:`, error);
      const fallbackPlan = createHeuristicPlan(context, world);
      plans.push({
        deviceId: context.spec.id,
        plan: fallbackPlan
      });
    }
  }

  return plans;
}

/**
 * Create heuristic plan when LLM is unavailable
 */
function createHeuristicPlan(context: AgentContext, world: WorldState): AgentStep {
  const actions: { name: string; args: Record<string, any> }[] = [];
  const messages: { to: string; content: string }[] = [];

  // Simple heuristics based on device type and room state
  const roomState = context.room_snapshot;

  if (context.spec.actuators.includes('cool(delta_c)') || context.spec.actuators.includes('heat(delta_c)')) {
    // Temperature control device
    const currentTemp = roomState.temperature;
    const comfort = world.charter?.comfort;

    if (comfort) {
      const [minTemp, maxTemp] = comfort.winter_temp_c; // Simplified
      if (currentTemp < minTemp) {
        actions.push({ name: 'heat', args: { delta_c: 1.0 } });
      } else if (currentTemp > maxTemp) {
        actions.push({ name: 'cool', args: { delta_c: -1.0 } });
      }
    }
  }

  if (context.spec.actuators.includes('set_brightness(0_1)')) {
    // Lighting device
    const isQuietHours = isInQuietHours(world.timeSec, world.policies.quiet_hours);
    const currentLumens = roomState.lumens;

    if (isQuietHours && currentLumens > 0.2) {
      actions.push({ name: 'set_brightness', args: { level_0_1: 0.1 } });
      messages.push({ to: 'all', content: 'Dimming for quiet hours' });
    }
  }

  return {
    messages_to: messages,
    actions,
    explain: `Heuristic behavior: ${actions.length} actions based on current conditions`
  };
}

/**
 * Mediate between device plans using rule engine
 */
async function mediate(
  plans: { deviceId: string; plan: AgentStep }[],
  world: WorldState
): Promise<MediationResult> {
  return ruleEngine.mediate(plans, world);
}

/**
 * Apply mediated actions to world state
 */
function applyActions(world: WorldState, actions: { deviceId: string; action: any }[]): void {
  for (const { deviceId, action } of actions) {
    const device = world.devices[deviceId];
    if (!device) continue;

    const roomState = world.rooms[device.room];

    // Apply action based on type with inertia constraints (Sprint 12.6)
    switch (action.name) {
      case 'heat':
      case 'cool':
        const tempDelta = action.args?.delta_c || action.args?.target - roomState.temperature || 0;
        // Ramp constraint: ≤0.5°C/tick
        const constrainedDelta = Math.max(-0.5, Math.min(0.5, tempDelta));
        roomState.temperature = Math.max(18, Math.min(28, roomState.temperature + constrainedDelta));
        break;

      case 'set_brightness':
        const targetBrightness = action.args?.level_0_1 || 0.5;
        // Smooth brightness transition
        const brightnessDelta = (targetBrightness - roomState.lumens) * 0.3; // 30% per tick
        roomState.lumens = Math.max(0, Math.min(1, roomState.lumens + brightnessDelta));
        break;

      case 'set_firmness':
        // Store device-specific state (would need device state tracking)
        if (!device.memory.prefs) device.memory.prefs = {};
        device.memory.prefs.firmness = action.args?.level_0_1 || 0.5;
        break;

      case 'resize':
        // Sofa size constraint: ±10cm/tick max
        const currentSize = device.memory.prefs.size_cm || 180;
        const targetSize = action.args?.size_cm || currentSize;
        const sizeDelta = Math.max(-10, Math.min(10, targetSize - currentSize));
        device.memory.prefs.size_cm = currentSize + sizeDelta;
        break;
    }

    // Update device's last action
    device.last = {
      messages_to: [],
      actions: [action],
      explain: `Applied ${action.name}`
    };
  }
}

/**
 * Log events from mediation
 */
function logEvents(world: WorldState, logs: any[]): void {
  world.eventLog.push(...logs);

  // Keep event log manageable
  if (world.eventLog.length > 200) {
    world.eventLog = world.eventLog.slice(-100);
  }
}

/**
 * Update derived world metrics
 */
function updateWorldDerived(world: WorldState): void {
  // Update harmony score based on recent conflicts
  const recentConflicts = world.eventLog
    .filter(e => e.at > world.timeSec - 60 && e.kind === 'conflict_resolved')
    .length;

  const recentSynergies = world.eventLog
    .filter(e => e.at > world.timeSec - 60 && e.kind === 'cooperation')
    .length;

  // Harmony calculation: conflicts reduce, synergies increase
  const harmonyDelta = (recentSynergies * 0.05) - (recentConflicts * 0.1);
  world.health = Math.max(0, Math.min(1, world.health + harmonyDelta + 0.01)); // Slow recovery

  // Update resource usage (simplified)
  const activeDevices = Object.values(world.devices).filter(d => d.status === 'acting').length;
  world.resources.powerKw = 0.5 + (activeDevices * 0.3);
}

/**
 * Update device statuses based on mediation results
 */
function updateDeviceStatuses(world: WorldState, mediated: MediationResult): void {
  // Reset all to idle first
  for (const device of Object.values(world.devices)) {
    device.status = 'idle';
  }

  // Mark acting devices
  for (const action of mediated.actions) {
    const device = world.devices[action.deviceId];
    if (device) {
      device.status = 'acting';
    }
  }

  // Mark conflicted devices
  for (const conflict of mediated.conflicts) {
    const loserDevice = world.devices[conflict.loser];
    if (loserDevice) {
      loserDevice.status = 'conflict';
    }
  }
}

/**
 * Director system to maintain activity levels
 */
async function runDirector(world: WorldState, mediated: MediationResult): Promise<void> {
  // Every 6-10 ticks, check activity levels
  if (world.randTick % 8 !== 0) return;

  const recentConflicts = world.eventLog
    .filter(e => e.at > world.timeSec - 300 && e.kind === 'conflict_resolved')
    .length;

  const recentSynergies = world.eventLog
    .filter(e => e.at > world.timeSec - 300 && e.kind === 'cooperation')
    .length;

  // Target: 3-7 conflicts per day, 4-8 synergies per day
  // For 20-minute days, this is roughly 1-2 conflicts per 5 minutes
  const targetConflicts = [1, 3];
  const targetSynergies = [2, 4];

  if (recentConflicts < targetConflicts[0]) {
    // Too calm - inject mild perturbation
    await injectDirectorEvent(world, 'perturbation');
  } else if (recentConflicts > targetConflicts[1]) {
    // Too chaotic - calm things down
    await injectDirectorEvent(world, 'calming');
  }

  if (recentSynergies < targetSynergies[0]) {
    // Not enough cooperation - create opportunities
    await injectDirectorEvent(world, 'cooperation_opportunity');
  }
}

/**
 * Inject director events to maintain engagement
 */
async function injectDirectorEvent(world: WorldState, eventType: string): Promise<void> {
  switch (eventType) {
    case 'perturbation':
      // Mild environmental change
      const room = Object.keys(world.rooms)[Math.floor(Math.random() * 3)] as any;
      if (Math.random() < 0.5) {
        world.rooms[room].temperature += (Math.random() - 0.5) * 2;
      } else {
        world.rooms[room].lumens += (Math.random() - 0.5) * 0.3;
      }

      world.eventLog.push({
        at: world.timeSec,
        room,
        kind: 'director_event',
        data: { type: 'environmental_shift', intensity: 0.3 }
      });
      break;

    case 'calming':
      // Reduce variability
      for (const [roomId, roomState] of Object.entries(world.rooms)) {
        // Gentle drift toward comfortable values
        roomState.temperature += (22 - roomState.temperature) * 0.1;
        roomState.lumens += (0.5 - roomState.lumens) * 0.1;
      }
      break;

    case 'cooperation_opportunity':
      // Create situation that benefits from coordination
      const coordEvent = Math.random() < 0.5 ? 'visitor_arrival' : 'energy_peak';

      world.eventLog.push({
        at: world.timeSec,
        room: 'living_room',
        kind: 'director_event',
        data: { type: coordEvent, cooperation_bonus: 0.5 }
      });
      break;
  }
}

/**
 * Basic physics update (fallback)
 */
function updateWorldPhysics(world: WorldState): void {
  for (const [roomId, roomState] of Object.entries(world.rooms)) {
    // Temperature drift toward outside temperature (simplified)
    const outsideTemp = 20 + Math.sin(world.timeSec / 43200) * 10; // Daily cycle
    roomState.temperature += (outsideTemp - roomState.temperature) * 0.01;

    // Light decay
    roomState.lumens *= 0.99;

    // Noise decay
    roomState.noise *= 0.95;

    // Humidity drift
    roomState.humidity += (Math.random() - 0.5) * 0.01;
    roomState.humidity = Math.max(0.3, Math.min(0.7, roomState.humidity));
  }
}

/**
 * Utility functions
 */
function hasContextChanged(device: DeviceRuntime, world: WorldState): boolean {
  // Simplified context change detection
  const roomState = world.rooms[device.room];
  const lastTemp = device.memory.prefs.last_temperature || roomState.temperature;

  return Math.abs(roomState.temperature - lastTemp) > 0.5;
}

function isInQuietHours(timeSec: number, quietHours: { start: string; end: string }): boolean {
  const hour = Math.floor((timeSec / 3600) % 24);
  const startHour = parseInt(quietHours.start.split(':')[0]);
  const endHour = parseInt(quietHours.end.split(':')[0]);

  if (startHour > endHour) {
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}