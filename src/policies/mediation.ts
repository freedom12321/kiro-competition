/**
 * Mediation and conflict resolution system
 * Implements governance rules and priority-based conflict resolution
 * Following CLAUDE.md Sprint 4.2 and WORLDRULE.md specifications
 */

import { WorldState, Policies, AgentStep, MediationResult, ConflictResolution, WorldRule } from '../types/core';
import { rng } from '../sim/rand';

export interface PlanWithDevice extends AgentStep {
  deviceId: string;
}

/**
 * Mediate between competing device actions and apply governance
 */
export function mediate(
  plans: PlanWithDevice[],
  policies: Policies,
  world: WorldState
): MediationResult {
  console.log(`⚖️ Mediating ${plans.length} device plans`);

  const result: MediationResult = {
    actions: [],
    conflicts: [],
    logs: [],
    rule_firings: []
  };

  // Group actions by what they affect (same room variables, resources, etc.)
  const actionGroups = groupConflictingActions(plans, world);

  // Process each group for conflicts
  actionGroups.forEach(group => {
    if (group.length === 1) {
      // No conflict, approve action
      const plan = group[0];
      plan.actions.forEach(action => {
        result.actions.push({ deviceId: plan.deviceId, action });
      });
    } else {
      // Conflict detected - resolve it
      console.log(`⚔️ Conflict between ${group.map(p => world.devices[p.deviceId]?.spec.name).join(' vs ')}`);
      const resolution = resolveConflict(group, policies, world);
      result.conflicts.push(resolution);

      // Apply winner's action
      const winnerPlan = group.find(p => p.deviceId === resolution.winner);
      if (winnerPlan) {
        winnerPlan.actions.forEach(action => {
          result.actions.push({ deviceId: winnerPlan.deviceId, action });
        });
      }
    }
  });

  // Apply rule-based governance (soft nudges and hard limits)
  applyRuleBasedGovernance(result, world);

  // Check quiet hours constraints
  enforceQuietHours(result, policies, world);

  // Check hard resource limits
  enforceResourceLimits(result, policies, world);

  // Generate explanation logs
  generateExplanationLogs(result, world);

  console.log(`✅ Mediation complete: ${result.actions.length} actions approved, ${result.conflicts.length} conflicts resolved`);

  return result;
}

/**
 * Group actions that would conflict with each other
 */
function groupConflictingActions(plans: PlanWithDevice[], world: WorldState): PlanWithDevice[][] {
  const groups: PlanWithDevice[][] = [];
  const processed = new Set<string>();

  plans.forEach(plan => {
    if (processed.has(plan.deviceId)) return;

    const conflictGroup = [plan];
    processed.add(plan.deviceId);

    // Find other plans that would conflict with this one
    plans.forEach(otherPlan => {
      if (processed.has(otherPlan.deviceId)) return;

      if (plansConflict(plan, otherPlan, world)) {
        conflictGroup.push(otherPlan);
        processed.add(otherPlan.deviceId);
      }
    });

    groups.push(conflictGroup);
  });

  return groups;
}

/**
 * Determine if two plans conflict with each other
 */
function plansConflict(plan1: PlanWithDevice, plan2: PlanWithDevice, world: WorldState): boolean {
  const device1 = world.devices[plan1.deviceId];
  const device2 = world.devices[plan2.deviceId];

  if (!device1 || !device2) return false;

  // Same room and affecting same variables
  if (device1.room === device2.room) {
    const actions1 = plan1.actions.map(a => a.name);
    const actions2 = plan2.actions.map(a => a.name);

    // Temperature conflicts
    const tempActions = ['set_temperature', 'cool', 'heat'];
    const plan1HasTemp = actions1.some(a => tempActions.includes(a));
    const plan2HasTemp = actions2.some(a => tempActions.includes(a));
    if (plan1HasTemp && plan2HasTemp) return true;

    // Lighting conflicts
    const lightActions = ['set_brightness', 'set_lumens'];
    const plan1HasLight = actions1.some(a => lightActions.includes(a));
    const plan2HasLight = actions2.some(a => lightActions.includes(a));
    if (plan1HasLight && plan2HasLight) return true;

    // Resource conflicts (both high power usage)
    const highPowerActions = ['cool', 'heat', 'set_brightness'];
    const plan1HighPower = actions1.some(a => highPowerActions.includes(a));
    const plan2HighPower = actions2.some(a => highPowerActions.includes(a));
    if (plan1HighPower && plan2HighPower && world.resources.powerKw < 1.0) {
      return true;
    }
  }

  return false;
}

/**
 * Resolve conflict between devices using priority system
 */
function resolveConflict(
  conflictingPlans: PlanWithDevice[],
  policies: Policies,
  world: WorldState
): ConflictResolution {
  const deviceNames = conflictingPlans.map(p => world.devices[p.deviceId]?.spec.name || p.deviceId);
  console.log(`🥊 Resolving conflict between: ${deviceNames.join(', ')}`);

  // Calculate utility scores based on policy priorities
  const utilityScores: Record<string, number> = {};

  conflictingPlans.forEach(plan => {
    const device = world.devices[plan.deviceId];
    if (!device) return;

    let utility = 0;

    // Priority-based scoring with soft weights
    const deviceGoals = device.spec.goals || [];
    const soft = (policies.soft_weights || {}) as Record<string, number>;
    const defaultWeight = 0.5; // baseline if no mapping
    deviceGoals.forEach(goal => {
      const sw = soft[goal.name] ?? softAlias(soft, goal.name) ?? defaultWeight;
      utility += goal.weight * sw;
    });

    // Safety boost
    if (deviceGoals.some(g => g.name === 'safety' || g.name.includes('safe'))) {
      utility += 10; // Safety gets a significant boost
    }

    // Current room conditions influence
    const room = world.rooms[device.room];
    if (room.temperature < 18 || room.temperature > 28) {
      utility += 5; // Emergency temperature situations get priority
    }

    // Add small random factor for tie-breaking
    utility += rng() * 0.1;

    utilityScores[plan.deviceId] = utility;
  });

  // Find winner and loser
  const sortedByUtility = conflictingPlans.sort(
    (a, b) => utilityScores[b.deviceId] - utilityScores[a.deviceId]
  );

  const winner = sortedByUtility[0];
  const loser = sortedByUtility[1];

  const winnerDevice = world.devices[winner.deviceId];
  const loserDevice = world.devices[loser.deviceId];

  // Determine which rule was applied
  const winnerGoals = winnerDevice?.spec.goals || [];
  const topGoal = winnerGoals.reduce((max, goal) =>
    goal.weight > max.weight ? goal : max,
    winnerGoals[0] || { name: 'unknown', weight: 0 }
  );

  const ruleApplied = `${topGoal.name}_priority`;

  // Create explanation
  const explanation = generateConflictExplanation(
    winnerDevice?.spec.name || winner.deviceId,
    loserDevice?.spec.name || loser.deviceId,
    topGoal.name,
    policies.priority_order
  );

  return {
    winner: winner.deviceId,
    loser: loser.deviceId,
    rule_applied: ruleApplied,
    utility_scores: utilityScores,
    explanation
  };
}

function softAlias(soft: Record<string, number>, name: string): number | undefined {
  // Map synonyms like 'safe_temperature' -> 'safety'
  const map: Record<string, string> = {
    safe_temperature: 'safety',
    sleep_support: 'comfort'
  };
  const alias = map[name];
  return alias ? soft[alias] : undefined;
}

/**
 * Generate human-readable explanation for conflict resolution
 */
function generateConflictExplanation(
  winnerName: string,
  loserName: string,
  winningGoal: string,
  priorityOrder: string[]
): string {
  const priorityMessages = {
    safety: 'Safety takes precedence over all other concerns',
    comfort: 'User comfort is prioritized',
    efficiency: 'Energy efficiency wins out',
    privacy: 'Privacy protection is maintained',
    security: 'Security measures take priority'
  };

  const baseMessage = priorityMessages[winningGoal as keyof typeof priorityMessages] ||
    `${winningGoal} priority resolved the conflict`;

  return `${winnerName} wins over ${loserName}: ${baseMessage}`;
}

/**
 * Apply rule-based governance from WORLDRULE.md system
 */
function applyRuleBasedGovernance(result: MediationResult, world: WorldState): void {
  // Apply rule packs if available
  const rulePacks = world.policies.rule_packs || [];

  rulePacks.forEach(pack => {
    if (!pack.active) return;

    pack.rules.forEach(rule => {
      if (rule.active === false) return; // allow per-rule toggle
      if (ruleApplies(rule, world)) {
        console.log(`📜 Applying rule: ${rule.id}`);

        if (rule.hard) {
          // Hard rules override actions
          enforceHardRule(rule, result, world);
        } else {
          // Soft rules create gentle nudges
          applySoftRule(rule, result, world);
        }

        result.rule_firings.push({
          ruleId: rule.id,
          room: rule.scope === 'room' ? (getRelevantRoom(rule, world) as any) : undefined
        });
      }
    });
  });
}

/**
 * Check if a rule applies in current context
 */
function ruleApplies(rule: WorldRule, world: WorldState): boolean {
  // Check 'when' conditions (context)
  if (rule.when && !evaluatePredicate(rule.when, world)) {
    return false;
  }

  // Check 'unless' exceptions
  if (rule.unless && evaluatePredicate(rule.unless, world)) {
    return false;
  }

  // Check 'if' state conditions
  if (rule.if && !evaluatePredicate(rule.if, world)) {
    return false;
  }

  return true;
}

/**
 * Evaluate a rule predicate against world state
 */
function evaluatePredicate(pred: Record<string, any>, world: WorldState): boolean {
  // Time-based conditions
  if (pred.time_between) {
    const [start, end] = pred.time_between;
    const currentHour = Math.floor((world.timeSec / 60) % 24); // Very simplified time
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);

    if (startHour <= endHour) {
      if (currentHour < startHour || currentHour >= endHour) return false;
    } else {
      if (currentHour >= endHour && currentHour < startHour) return false;
    }
  }

  // Room conditions
  if (pred.room_tag) {
    // Simplified - would need proper room tagging system
    return true; // For now, assume all rooms match
  }

  // Temperature conditions
  if (pred.temperature_gt !== undefined) {
    const avgTemp = Object.values(world.rooms).reduce((sum, room) => sum + room.temperature, 0) /
      Object.values(world.rooms).length;
    if (avgTemp <= pred.temperature_gt) return false;
  }

  if (pred.temperature_lt !== undefined) {
    const avgTemp = Object.values(world.rooms).reduce((sum, room) => sum + room.temperature, 0) /
      Object.values(world.rooms).length;
    if (avgTemp >= pred.temperature_lt) return false;
  }

  // Lumens conditions
  if (pred.lumens_gt !== undefined) {
    const avgLumens = Object.values(world.rooms).reduce((sum, room) => sum + room.lumens, 0) /
      Object.values(world.rooms).length;
    if (avgLumens <= pred.lumens_gt) return false;
  }

  return true;
}

/**
 * Enforce hard rules that cannot be violated
 */
function enforceHardRule(rule: WorldRule, result: MediationResult, world: WorldState): void {
  if (rule.then.alarm) {
    // Trigger alarm
    result.logs.push({
      at: world.timeSec,
      room: 'living_room', // fallback
      kind: 'alarm',
      data: { alarm: rule.then.alarm, rule: rule.id },
      description: `ALARM: ${rule.explain}`
    });
  }

  if (rule.then.target && rule.then.delta !== undefined) {
    // Force state change - remove conflicting actions
    result.actions = result.actions.filter(action => {
      // Remove actions that would violate this hard rule
      return !actionViolatesRule(action, rule, world);
    });

    // Add corrective action if needed
    if (rule.then.min !== undefined || rule.then.max !== undefined) {
      // This would need more sophisticated implementation
      console.log(`🚨 Hard rule enforced: ${rule.explain}`);
    }
  }
}

/**
 * Apply soft rules that create gentle nudges
 */
function applySoftRule(rule: WorldRule, result: MediationResult, world: WorldState): void {
  // Soft rules could modify action parameters or add gentle corrections
  console.log(`🔄 Soft rule applied: ${rule.explain}`);

  // For now, just log the rule application
  result.logs.push({
    at: world.timeSec,
    room: getRelevantRoom(rule, world) || 'living_room',
    kind: 'soft_rule_applied',
    data: { rule: rule.id, explanation: rule.explain },
    description: rule.explain
  });
}

/**
 * Check if an action would violate a hard rule
 */
function actionViolatesRule(action: any, rule: WorldRule, world: WorldState): boolean {
  // Simplified implementation - would need more sophisticated logic
  if (rule.then.target === 'temperature' &&
      ['set_temperature', 'cool', 'heat'].includes(action.action.name)) {
    return true;
  }

  if (rule.then.target === 'lumens' &&
      ['set_brightness', 'set_lumens'].includes(action.action.name)) {
    return true;
  }

  return false;
}

/**
 * Get the relevant room for a rule
 */
function getRelevantRoom(rule: WorldRule, world: WorldState): string | undefined {
  if (rule.scope === 'room') {
    // For now, return first room - would need proper room detection
    return Object.keys(world.rooms)[0];
  }
  return undefined;
}

/**
 * Enforce quiet hours constraints
 */
function enforceQuietHours(result: MediationResult, policies: Policies, world: WorldState): void {
  if (!policies.quiet_hours) return;

  const currentHour = Math.floor((world.timeSec / 60) % 24);
  const quietStart = parseInt(policies.quiet_hours.start.split(':')[0]);
  const quietEnd = parseInt(policies.quiet_hours.end.split(':')[0]);

  let inQuietHours = false;
  if (quietStart <= quietEnd) {
    inQuietHours = currentHour >= quietStart && currentHour < quietEnd;
  } else {
    inQuietHours = currentHour >= quietStart || currentHour < quietEnd;
  }

  if (inQuietHours) {
    console.log('🤫 Quiet hours active - limiting loud actions');

    // Filter out loud actions during quiet hours
    result.actions = result.actions.filter(action => {
      const isLoudAction = ['set_brightness', 'fan'].includes(action.action.name);
      if (isLoudAction && action.action.args &&
          (action.action.args.level_0_1 > 0.3 || action.action.args.speed_0_1 > 0.3)) {

        result.logs.push({
          at: world.timeSec,
          room: world.devices[action.deviceId]?.room || 'living_room',
          deviceId: action.deviceId,
          kind: 'quiet_hours_block',
          data: { action: action.action.name },
          description: `Quiet hours: ${action.action.name} was limited`
        });

        return false;
      }
      return true;
    });
  }
}

/**
 * Enforce hard resource limits
 */
function enforceResourceLimits(result: MediationResult, policies: Policies, world: WorldState): void {
  const limits = policies.limits || {};

  // Check power limits
  if (limits.max_power_kw && world.resources.powerKw > limits.max_power_kw) {
    console.log('⚡ Power limit exceeded - blocking high-power actions');

    result.actions = result.actions.filter(action => {
      const highPowerActions = ['cool', 'heat', 'set_brightness'];
      if (highPowerActions.includes(action.action.name)) {
        result.logs.push({
          at: world.timeSec,
          room: world.devices[action.deviceId]?.room || 'living_room',
          deviceId: action.deviceId,
          kind: 'power_limit_block',
          data: { action: action.action.name },
          description: `Power limit: ${action.action.name} was blocked`
        });
        return false;
      }
      return true;
    });
  }
}

/**
 * Generate explanation logs for the UI
 */
function generateExplanationLogs(result: MediationResult, world: WorldState): void {
  result.conflicts.forEach(conflict => {
    const winnerDevice = world.devices[conflict.winner];
    const loserDevice = world.devices[conflict.loser];

    result.logs.push({
      at: world.timeSec,
      room: winnerDevice?.room || 'living_room',
      deviceId: conflict.winner,
      kind: 'conflict_explanation',
      data: {
        winner: winnerDevice?.spec.name,
        loser: loserDevice?.spec.name,
        rule: conflict.rule_applied,
        explanation: conflict.explanation,
        utility_scores: conflict.utility_scores
      },
      description: conflict.explanation
    });
  });
}
