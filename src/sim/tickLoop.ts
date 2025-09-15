/**
 * Core simulation tick loop - the heart of the AI Habitat game
 * Implements the 10-second tick cycle that makes devices think, plan, and interact
 * Following CLAUDE.md Sprint 4.1 specification
 */

import { WorldState, AgentContext, AgentStep, MediationResult } from '../types/core';
import { planAgentStep } from '../agents/llmClient';
import { mediate } from '../policies/mediation';
import { applyActions } from './actions';
import { rng, rngNorm, rngBool } from './rand';

/**
 * Main tick function - runs every 10 seconds to simulate one "moment" in the world
 */
export async function tick(world: WorldState): Promise<void> {
  if (!world.running) return;

  console.log(`🔄 Tick ${world.timeSec / 10} - Time: ${world.timeSec}s`);

  // Increment time and random state
  world.timeSec += 10;
  world.randTick++;

  try {
    // Build contexts for all active devices, paired with runtime ids
    const contexts = buildAgentContexts(world);

    // Only plan for devices in their planning phase (for async planning)
    const devicesToPlan = contexts.filter(ctx => shouldPlanThisTick(ctx.deviceId, world));

    if (devicesToPlan.length === 0) {
      console.log('📋 No devices need planning this tick');
      updateDerivedState(world);
      return;
    }

    console.log(`🧠 Planning for ${devicesToPlan.length} devices: ${devicesToPlan.map(c => c.context.spec.name).join(', ')}`);

    // Get agent plans (with error handling for each device)
    const plans = await Promise.all(
      devicesToPlan.map(async (ctx) => {
        try {
          const plan = await planAgentStep(ctx.context);
          return { deviceId: ctx.deviceId, plan, success: true };
        } catch (error) {
          console.error(`❌ Planning failed for ${ctx.context.spec.name}:`, error);
          return {
            deviceId: ctx.deviceId,
            plan: createFallbackPlan(ctx.context.spec.name),
            success: false
          };
        }
      })
    );

    // Extract successful plans
    const validPlans = plans.filter(p => p.success).map(p => ({ deviceId: p.deviceId, ...p.plan }));

    if (validPlans.length === 0) {
      console.log('⚠️ No valid plans generated');
      updateDerivedState(world);
      return;
    }

    // Mediate conflicts and apply governance
    console.log('⚖️ Mediating actions and applying governance...');
    const mediationResult = mediate(validPlans as any, world.policies, world);

    // Apply the mediated actions to world state
    console.log(`🎬 Applying ${mediationResult.actions.length} actions`);
    applyActions(world, mediationResult.actions);

    // Log events and update device states
    logMediationResults(world, mediationResult);
    updateDeviceStates(world, validPlans);

    // Update derived world properties
    updateDerivedState(world);

    console.log(`✅ Tick complete - Harmony: ${world.health.toFixed(2)}, Events: ${world.eventLog.length}`);

  } catch (error) {
    console.error('💥 Tick failed:', error);
    // Don't crash the simulation, just log the error
    world.eventLog.push({
      at: world.timeSec,
      room: 'living_room', // fallback
      kind: 'system_error',
      data: { error: error instanceof Error ? error.message : String(error) },
      description: 'Simulation tick encountered an error'
    });
  }
}

/**
 * Build agent contexts for LLM planning
 */
function buildAgentContexts(world: WorldState): { deviceId: string; context: AgentContext }[] {
  const contexts: { deviceId: string; context: AgentContext }[] = [];

  for (const deviceId of Object.keys(world.devices)) {
    const device = world.devices[deviceId];
    // Skip devices that are in safe mode or inactive
    if (device.status === 'safe') continue;

    const roomState = world.rooms[device.room];
    const context: AgentContext = {
      spec: device.spec,
      room_snapshot: { ...roomState }, // snapshot to avoid mutation
      policies: world.policies,
      last_messages: getRecentMessages(deviceId, world),
      available_actions: device.spec.actuators || [],
      world_time: world.timeSec,
      other_devices: Object.values(world.devices)
        .filter(d => d.id !== deviceId)
        .map(d => ({ id: d.id, room: d.room, status: d.status }))
    };

    contexts.push({ deviceId, context });
  }

  return contexts;
}

/**
 * Determine if a device should plan this tick (async planning phases)
 */
function shouldPlanThisTick(deviceId: string, world: WorldState): boolean {
  const device = world.devices[deviceId];
  if (!device) return false;

  // If device has no planning phase, plan every tick
  if (device.planningPhase === undefined) return true;

  // Use planning phases for staggered execution (CLAUDE.md 12.7)
  return world.randTick % 4 === device.planningPhase;
}

/**
 * Get recent messages for a device's context
 */
function getRecentMessages(deviceId: string, world: WorldState): { from: string; content: string; at: number }[] {
  // Look through recent events for communication messages
  const recentEvents = world.eventLog
    .slice(-20) // Last 20 events
    .filter(event =>
      event.kind === 'device_message' &&
      event.data?.to === deviceId &&
      world.timeSec - event.at < 60 // Within last minute
    )
    .map(event => ({
      from: event.deviceId || 'unknown',
      content: event.data?.content || '',
      at: event.at
    }))
    .slice(-4); // Keep only last 4 messages for bounded rationality (CLAUDE.md 12.8)

  return recentEvents;
}

/**
 * Create a fallback plan when LLM planning fails
 */
function createFallbackPlan(deviceName: string): AgentStep {
  return {
    messages_to: [],
    actions: [],
    explain: `${deviceName} is experiencing technical difficulties and will wait before trying again.`
  };
}

/**
 * Log mediation results as world events
 */
function logMediationResults(world: WorldState, result: MediationResult): void {
  // Log successful actions
  result.actions.forEach(action => {
    world.eventLog.push({
      at: world.timeSec,
      room: world.devices[action.deviceId]?.room || 'living_room',
      deviceId: action.deviceId,
      kind: 'device_action',
      data: action.action,
      description: `${world.devices[action.deviceId]?.spec.name || action.deviceId} performed action`
    });
  });

  // Log conflicts and resolutions
  result.conflicts.forEach(conflict => {
    world.eventLog.push({
      at: world.timeSec,
      room: world.devices[conflict.winner]?.room || 'living_room',
      deviceId: conflict.winner,
      kind: 'conflict_resolution',
      data: {
        winner: conflict.winner,
        loser: conflict.loser,
        rule: conflict.rule_applied,
        explanation: conflict.explanation
      },
      description: `Conflict resolved: ${conflict.explanation}`
    });
  });

  // Log rule firings for educational "Why cards"
  result.rule_firings.forEach(firing => {
    world.eventLog.push({
      at: world.timeSec,
      room: firing.room || 'living_room',
      deviceId: firing.deviceId,
      kind: 'rule_fired',
      data: { ruleId: firing.ruleId },
      description: `Policy rule applied: ${firing.ruleId}`
    });
  });
}

/**
 * Update device states with their latest plans
 */
function updateDeviceStates(world: WorldState, plans: any[]): void {
  plans.forEach(planData => {
    const device = world.devices[planData.deviceId];
    if (device) {
      device.last = {
        messages_to: planData.messages_to || [],
        actions: planData.actions || [],
        explain: planData.explain || ''
      };

      // Update device status based on activity
      if (planData.actions && planData.actions.length > 0) {
        device.status = 'acting';
      } else {
        device.status = 'idle';
      }
    }
  });
}

/**
 * Update derived world state (harmony, resource usage, etc.)
 */
function updateDerivedState(world: WorldState): void {
  // Update harmony score based on recent conflicts
  const recentConflicts = world.eventLog
    .slice(-10)
    .filter(event => event.kind === 'conflict_resolution');

  const recentSynergies = world.eventLog
    .slice(-10)
    .filter(event => event.kind === 'device_cooperation');

  // Simple harmony calculation
  const conflictPenalty = recentConflicts.length * 0.1;
  const synergyBonus = recentSynergies.length * 0.05;

  world.health = Math.max(0, Math.min(1,
    world.health + synergyBonus - conflictPenalty + rngNorm(0, 0.01) // small noise
  ));

  // Clamp event log size
  if (world.eventLog.length > 100) {
    world.eventLog = world.eventLog.slice(-100);
  }

  // Add sensor noise to room variables (CLAUDE.md 12.3)
  addSensorNoise(world);

  // Simple director: if too calm, nudge a mild event
  maybeInjectDirectorEvent(world);
}

/**
 * Add realistic sensor noise to room variables
 */
function addSensorNoise(world: WorldState): void {
  Object.keys(world.rooms).forEach(roomId => {
    const room = world.rooms[roomId as keyof typeof world.rooms];

    // Add noise but store original values for simulation accuracy
    if (typeof room.temperature === 'number') {
      const noise = rngNorm(0, 0.3); // ±0.3°C noise
      // Store the "sensor reading" that agents will see
      (room as any)._sensor_temperature = room.temperature + noise;
    }

    if (typeof room.lumens === 'number') {
      const noise = rngNorm(0, 0.05); // ±0.05 lumens noise
      (room as any)._sensor_lumens = Math.max(0, room.lumens + noise);
    }

    if (typeof room.mood_score === 'number') {
      const noise = rngNorm(0, 0.1); // ±0.1 mood noise
      (room as any)._sensor_mood = Math.max(0, Math.min(1, room.mood_score + noise));
    }
  });
}

/**
 * Start the simulation tick loop
 */
export function startSimulation(world: WorldState): void {
  if (world.running) return;

  world.running = true;
  console.log('🚀 Starting AI Habitat simulation...');

  // Set up the interval for 10-second ticks
  const intervalMs = (10 * 1000) / world.speed; // Adjust for speed setting

  const tickInterval = setInterval(() => {
    if (!world.running) {
      clearInterval(tickInterval);
      return;
    }

    tick(world).catch(error => {
      console.error('Unhandled tick error:', error);
    });
  }, intervalMs);

  // Store interval ID for cleanup
  (world as any)._tickInterval = tickInterval;
}

/**
 * Stop the simulation
 */
export function stopSimulation(world: WorldState): void {
  world.running = false;
  console.log('⏹️ Simulation stopped');

  if ((world as any)._tickInterval) {
    clearInterval((world as any)._tickInterval);
    delete (world as any)._tickInterval;
  }
}

/**
 * Step the simulation forward one tick (for debugging)
 */
export async function stepSimulation(world: WorldState): Promise<void> {
  if (world.running) {
    console.warn('Cannot step while simulation is running');
    return;
  }

  await tick(world);
}

function maybeInjectDirectorEvent(world: WorldState): void {
  // Toggle via policies.soft_weights?.director_off
  const directorOff = (world.policies as any).director_off === true;
  if (directorOff) return;

  const recent = world.eventLog.slice(-20);
  const conflicts = recent.filter(e => e.kind === 'conflict_resolution');
  if (conflicts.length < 1) {
    // Inject a small cloudy event: reduce lumens a bit in living room
    const room = world.rooms['living_room'];
    if (room) {
      room.lumens = Math.max(0, room.lumens - 0.05);
      world.eventLog.push({
        at: world.timeSec,
        room: 'living_room',
        kind: 'director_event',
        data: { type: 'cloud_cover', delta: -0.05 },
        description: 'Director: cloud cover reduces ambient light'
      });
    }
  }
}
