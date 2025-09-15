/**
 * Sophisticated Rule Engine Implementation
 * Based on WORLDRULE.md layered rule system approach
 *
 * Features:
 * - Layered rule system (physical, human-norms, context, device, social)
 * - Composable rule schema with priorities and softness
 * - Rule packs per environment (home, hospital, office)
 * - Director system for maintaining activity levels
 * - Utility-based mediation with stochastic tie-breaking
 */
import { WorldRule, WorldState, RoomId, VariableName, Pred, Transform, MediationResult, ConflictResolution, WorldEvent, RulePack, DeviceRuntime, AgentStep, DirectorConfig, DirectorState } from '../types/core';

export class RuleEngine {
  private activePacks: RulePack[] = [];
  private ruleCache: Map<string, WorldRule[]> = new Map();
  private directorState: DirectorState;
  private ruleFireHistory: { ruleId: string; timestamp: number; room?: RoomId; deviceId?: string }[] = [];

  constructor() {
    this.clearCache();
    this.directorState = this.initializeDirector();
    this.loadDefaultRulePacks();
  }

  private initializeDirector(): DirectorState {
    return {
      config: {
        targets: {
          conflicts_per_day: [3, 8],
          synergies_per_day: [2, 6]
        },
        event_budget_per_day: 20,
        cooldown_ticks: 5
      },
      last_window_conflicts: 0,
      last_window_synergies: 0,
      event_budget_remaining: 20,
      cooldown_remaining: 0,
      activity_log: []
    };
  }

  private loadDefaultRulePacks(): void {
    // Load basic safety and operational rules
    const basicRules: WorldRule[] = [
      {
        id: 'basic_temp_safety',
        scope: 'room',
        priority: 1.0,
        hard: true,
        if: { temperature_gt: 26 },
        then: { target: 'temperature', max: 26, alarm: 'Temperature too high' },
        explain: 'Enforce temperature safety limits'
      }
    ];

    const defaultPack: RulePack = {
      id: 'default_rules',
      name: 'Default Safety Rules',
      description: 'Basic safety and operational constraints',
      environment: 'home',
      rules: basicRules,
      active: true
    };

    this.loadRulePacks([defaultPack]);
  }

  /**
   * Load and activate rule packs based on environment and context
   */
  public loadRulePacks(packs: RulePack[]): void {
    this.activePacks = packs.filter(pack => pack.active);
    this.clearCache();

    // Cache rules by scope for efficient lookup
    this.activePacks.forEach(pack => {
      pack.rules.forEach(rule => {
        const cacheKey = `${rule.scope}_${rule.device_type || 'all'}`;
        if (!this.ruleCache.has(cacheKey)) {
          this.ruleCache.set(cacheKey, []);
        }
        this.ruleCache.get(cacheKey)!.push(rule);
      });
    });
  }

  /**
   * Evaluate all applicable rules and return action hints and constraints
   */
  public evaluateRules(world: WorldState, context: RuleEvaluationContext): RuleEvaluationResult {
    const hardViolations: RuleViolation[] = [];
    const softHints: RuleHint[] = [];
    const ruleFireings: { ruleId: string; deviceId?: string; room?: RoomId }[] = [];

    // Evaluate world-scope rules
    const worldRules = this.ruleCache.get('world_all') || [];
    worldRules.forEach(rule => {
      const result = this.evaluateRule(rule, world, context);
      if (result) {
        ruleFireings.push({ ruleId: rule.id });
        if (rule.hard) {
          hardViolations.push({ rule, violation: result, severity: 'critical' });
        } else {
          softHints.push({ rule, hint: result, weight: rule.priority });
        }
      }
    });

    // Evaluate room-scope rules
    Object.keys(world.rooms).forEach(roomId => {
      const roomRules = this.ruleCache.get('room_all') || [];
      roomRules.forEach(rule => {
        const roomContext = { ...context, currentRoom: roomId as RoomId };
        const result = this.evaluateRule(rule, world, roomContext);
        if (result) {
          ruleFireings.push({ ruleId: rule.id, room: roomId as RoomId });
          if (rule.hard) {
            hardViolations.push({ rule, violation: result, severity: 'high' });
          } else {
            softHints.push({ rule, hint: result, weight: rule.priority });
          }
        }
      });
    });

    // Evaluate device-scope rules
    Object.values(world.devices).forEach(device => {
      const deviceRules = [
        ...(this.ruleCache.get('device_all') || []),
        ...(this.ruleCache.get(`device_${device.spec.id}`) || [])
      ];

      deviceRules.forEach(rule => {
        const deviceContext = { ...context, currentDevice: device };
        const result = this.evaluateRule(rule, world, deviceContext);
        if (result) {
          ruleFireings.push({ ruleId: rule.id, deviceId: device.id, room: device.room });
          if (rule.hard) {
            hardViolations.push({ rule, violation: result, severity: 'medium' });
          } else {
            softHints.push({ rule, hint: result, weight: rule.priority });
          }
        }
      });
    });

    return {
      hardViolations,
      softHints,
      ruleFireings,
      totalRulesEvaluated: this.countActiveRules(),
      evaluation_time: Date.now()
    };
  }

  /**
   * Mediate conflicts between device actions using rule-based utility scoring
   */
  public mediate(
    devicePlans: { deviceId: string; plan: AgentStep }[],
    world: WorldState
  ): MediationResult {
    const context: RuleEvaluationContext = {
      timeSec: world.timeSec,
      season: this.getSeason(world.timeSec),
      timeOfDay: this.getTimeOfDay(world.timeSec)
    };

    // Evaluate current rule state
    const ruleEval = this.evaluateRules(world, context);

    // Apply hard constraints immediately
    this.enforceHardConstraints(world, ruleEval.hardViolations);

    // Detect action conflicts
    const conflicts = this.detectActionConflicts(devicePlans, world);
    const resolutions: ConflictResolution[] = [];

    // Resolve conflicts using utility scoring
    conflicts.forEach(conflict => {
      const resolution = this.resolveConflict(conflict, world, ruleEval.softHints);
      resolutions.push(resolution);
    });

    // Filter actions based on conflict resolution
    const finalActions = this.filterActions(devicePlans, resolutions);

    // Generate mediation events
    const logs = this.generateMediationLogs(resolutions, ruleEval);

    return {
      actions: finalActions,
      conflicts: resolutions,
      logs,
      rule_firings: ruleEval.ruleFireings
    };
  }

  private evaluateRule(rule: WorldRule, world: WorldState, context: RuleEvaluationContext): Transform | null {
    // Check context predicates (when/unless)
    if (rule.when && !this.evaluatePredicate(rule.when, world, context)) {
      return null;
    }

    if (rule.unless && this.evaluatePredicate(rule.unless, world, context)) {
      return null;
    }

    // Check state predicate (if)
    if (rule.if && !this.evaluatePredicate(rule.if, world, context)) {
      return null;
    }

    return rule.then;
  }

  private evaluatePredicate(pred: Pred, world: WorldState, context: RuleEvaluationContext): boolean {
    for (const [key, value] of Object.entries(pred)) {
      switch (key) {
        case 'time_between':
          if (!this.isTimeBetween(context.timeSec, value[0], value[1])) return false;
          break;
        case 'room_tag':
          if (context.currentRoom && !value.includes(context.currentRoom)) return false;
          break;
        case 'season':
          if (context.season !== value) return false;
          break;
        case 'temperature_gt':
          if (context.currentRoom) {
            const temp = world.rooms[context.currentRoom]?.temperature || 20;
            if (temp <= value) return false;
          }
          break;
        case 'temperature_lt':
          if (context.currentRoom) {
            const temp = world.rooms[context.currentRoom]?.temperature || 20;
            if (temp >= value) return false;
          }
          break;
        case 'lumens_gt':
          if (context.currentRoom) {
            const lumens = world.rooms[context.currentRoom]?.lumens || 0.5;
            if (lumens <= value) return false;
          }
          break;
        case 'lumens_lt':
          if (context.currentRoom) {
            const lumens = world.rooms[context.currentRoom]?.lumens || 0.5;
            if (lumens >= value) return false;
          }
          break;
        case 'device_type':
          if (context.currentDevice && context.currentDevice.spec.id !== value) return false;
          break;
        case 'emergency':
          if (world.health < 0.3 !== value) return false;
          break;
        case 'meeting':
          // TODO: Implement meeting detection
          return true;
        default:
          console.warn(`Unknown predicate: ${key}`);
          return true;
      }
    }
    return true;
  }

  private detectActionConflicts(
    devicePlans: { deviceId: string; plan: AgentStep }[],
    world: WorldState
  ): ActionConflict[] {
    const conflicts: ActionConflict[] = [];
    const actionsByTarget: Map<string, { deviceId: string; action: any; room: RoomId }[]> = new Map();

    // Group actions by their target (room variable they affect)
    devicePlans.forEach(({ deviceId, plan }) => {
      const device = world.devices[deviceId];
      if (!device) return;

      plan.actions.forEach(action => {
        const target = this.getActionTarget(action);
        if (target) {
          const key = `${device.room}_${target}`;
          if (!actionsByTarget.has(key)) {
            actionsByTarget.set(key, []);
          }
          actionsByTarget.get(key)!.push({ deviceId, action, room: device.room });
        }
      });
    });

    // Detect conflicts within each target group
    actionsByTarget.forEach((actions, target) => {
      if (actions.length > 1) {
        const conflictType = this.getConflictType(actions);
        if (conflictType !== 'none') {
          conflicts.push({
            target,
            actions,
            type: conflictType,
            severity: this.getConflictSeverity(actions)
          });
        }
      }
    });

    return conflicts;
  }

  private resolveConflict(
    conflict: ActionConflict,
    world: WorldState,
    softHints: RuleHint[]
  ): ConflictResolution {
    const utilityScores: Record<string, number> = {};

    // Calculate utility score for each conflicting action
    conflict.actions.forEach(({ deviceId, action }) => {
      utilityScores[deviceId] = this.calculateUtilityScore(deviceId, action, world, softHints);
    });

    // Find winner (highest utility score)
    const winner = Object.entries(utilityScores).reduce((a, b) =>
      utilityScores[a[0]] > utilityScores[b[0]] ? a : b
    )[0];

    const losers = conflict.actions.filter(a => a.deviceId !== winner).map(a => a.deviceId);

    return {
      winner,
      loser: losers[0], // TODO: Handle multiple losers
      rule_applied: this.findAppliedRule(conflict, softHints),
      utility_scores: utilityScores,
      explanation: this.generateConflictExplanation(conflict, utilityScores, winner)
    };
  }

  private calculateUtilityScore(
    deviceId: string,
    action: any,
    world: WorldState,
    softHints: RuleHint[]
  ): number {
    let score = 0;
    const device = world.devices[deviceId];
    if (!device) return 0;

    // Base score from device goals
    device.spec.goals.forEach(goal => {
      const goalAlignment = this.getGoalAlignment(action, goal);
      score += goalAlignment * goal.weight;
    });

    // Apply soft rule hints
    softHints.forEach(hint => {
      const hintAlignment = this.getHintAlignment(action, hint.hint);
      score += hintAlignment * hint.weight;
    });

    // Priority from policy order
    const policyPriority = world.policies.priority_order.indexOf('safety') * 0.1;
    score += policyPriority;

    return score;
  }

  private filterActions(
    devicePlans: { deviceId: string; plan: AgentStep }[],
    resolutions: ConflictResolution[]
  ): { deviceId: string; action: any }[] {
    const blockedDevices = new Set(resolutions.map(r => r.loser));
    const finalActions: { deviceId: string; action: any }[] = [];

    devicePlans.forEach(({ deviceId, plan }) => {
      if (!blockedDevices.has(deviceId)) {
        plan.actions.forEach(action => {
          finalActions.push({ deviceId, action });
        });
      }
    });

    return finalActions;
  }

  private enforceHardConstraints(world: WorldState, violations: RuleViolation[]): void {
    violations.forEach(violation => {
      const transform = violation.violation;
      if (transform.target && transform.delta !== undefined) {
        // Apply constraint immediately to world state
        Object.keys(world.rooms).forEach(roomId => {
          const room = world.rooms[roomId as RoomId];
          if (room && room[transform.target as VariableName] !== undefined) {
            let newValue = room[transform.target as VariableName] + transform.delta;
            if (transform.min !== undefined) newValue = Math.max(newValue, transform.min);
            if (transform.max !== undefined) newValue = Math.min(newValue, transform.max);
            room[transform.target as VariableName] = newValue;
          }
        });
      }
    });
  }

  private generateMediationLogs(
    resolutions: ConflictResolution[],
    ruleEval: RuleEvaluationResult
  ): WorldEvent[] {
    const logs: WorldEvent[] = [];

    resolutions.forEach(resolution => {
      logs.push({
        at: Date.now(),
        room: 'living_room', // TODO: Get actual room
        deviceId: resolution.winner,
        kind: 'conflict_resolved',
        data: {
          winner: resolution.winner,
          loser: resolution.loser,
          rule: resolution.rule_applied,
          explanation: resolution.explanation
        }
      });
    });

    ruleEval.ruleFireings.forEach(firing => {
      logs.push({
        at: Date.now(),
        room: firing.room || 'living_room',
        deviceId: firing.deviceId,
        kind: 'rule_fired',
        data: { ruleId: firing.ruleId }
      });
    });

    return logs;
  }

  // Helper methods
  private clearCache(): void {
    this.ruleCache.clear();
  }

  private countActiveRules(): number {
    return this.activePacks.reduce((total, pack) => total + pack.rules.length, 0);
  }

  private getSeason(timeSec: number): string {
    const dayOfYear = Math.floor(timeSec / (24 * 60 * 60)) % 365;
    if (dayOfYear < 90 || dayOfYear >= 335) return 'winter';
    if (dayOfYear < 180) return 'spring';
    if (dayOfYear < 270) return 'summer';
    return 'fall';
  }

  private getTimeOfDay(timeSec: number): string {
    const hourOfDay = Math.floor((timeSec % (24 * 60 * 60)) / (60 * 60));
    if (hourOfDay < 6) return 'night';
    if (hourOfDay < 12) return 'morning';
    if (hourOfDay < 18) return 'afternoon';
    return 'evening';
  }

  private isTimeBetween(timeSec: number, startTime: string, endTime: string): boolean {
    const currentHour = Math.floor((timeSec % (24 * 60 * 60)) / (60 * 60));
    const currentMinute = Math.floor((timeSec % (60 * 60)) / 60);
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Handle time ranges that cross midnight
    if (startTime > endTime) {
      return currentTimeStr >= startTime || currentTimeStr <= endTime;
    }
    return currentTimeStr >= startTime && currentTimeStr <= endTime;
  }

  private getActionTarget(action: any): string | null {
    // Map action names to the room variables they affect
    const actionTargetMap: Record<string, string> = {
      'cool': 'temperature',
      'heat': 'temperature',
      'set_brightness': 'lumens',
      'set_color': 'lumens',
      'play_sound': 'noise',
      'set_volume': 'noise'
    };

    return actionTargetMap[action.name] || null;
  }

  private getConflictType(actions: { deviceId: string; action: any; room: RoomId }[]): string {
    // Determine if actions are actually conflicting
    const actionTypes = actions.map(a => a.action.name);

    // Check for opposing actions
    if (actionTypes.includes('cool') && actionTypes.includes('heat')) return 'temperature_conflict';
    if (actionTypes.includes('brighten') && actionTypes.includes('dim')) return 'lighting_conflict';
    if (actionTypes.includes('volume_up') && actionTypes.includes('volume_down')) return 'audio_conflict';

    // Check for resource competition
    const totalPowerDemand = actions.reduce((sum, a) => sum + (a.action.args?.power || 0), 0);
    if (totalPowerDemand > 1.0) return 'resource_conflict';

    return 'none';
  }

  private getConflictSeverity(actions: { deviceId: string; action: any; room: RoomId }[]): string {
    // Determine conflict severity based on action magnitude and safety implications
    const maxMagnitude = Math.max(...actions.map(a => Math.abs(a.action.args?.delta || 0)));

    if (maxMagnitude > 5) return 'high';
    if (maxMagnitude > 2) return 'medium';
    return 'low';
  }

  private getGoalAlignment(action: any, goal: { name: string; weight: number }): number {
    // Calculate how well an action aligns with a device goal
    const alignmentMap: Record<string, Record<string, number>> = {
      'comfort': {
        'heat': 0.8,
        'cool': 0.8,
        'set_brightness': 0.6,
        'set_firmness': 0.9
      },
      'efficiency': {
        'heat': -0.3,
        'cool': -0.3,
        'set_brightness': -0.2
      },
      'safety': {
        'heat': 0.1,
        'cool': 0.1,
        'emergency_stop': 1.0
      }
    };

    return alignmentMap[goal.name]?.[action.name] || 0;
  }

  private getHintAlignment(action: any, hint: Transform): number {
    // Calculate how well an action aligns with a rule hint
    if (hint.action_hint && action.name in hint.action_hint) {
      return hint.action_hint[action.name];
    }
    return 0;
  }

  private findAppliedRule(conflict: ActionConflict, softHints: RuleHint[]): string {
    // Find which rule was most influential in resolving the conflict
    const relevantHints = softHints.filter(hint =>
      hint.hint.target === conflict.target.split('_')[1]
    );

    if (relevantHints.length > 0) {
      return relevantHints.reduce((a, b) => a.weight > b.weight ? a : b).rule.id;
    }

    return 'default_priority';
  }

  private generateConflictExplanation(
    conflict: ActionConflict,
    utilityScores: Record<string, number>,
    winner: string
  ): string {
    const winnerScore = utilityScores[winner];
    const loserScores = Object.entries(utilityScores).filter(([id]) => id !== winner);

    return `${winner} won conflict with utility score ${winnerScore.toFixed(2)}, beating ${loserScores.map(([id, score]) => `${id}(${score.toFixed(2)})`).join(', ')}`;
  }
}

// Supporting types
export interface RuleEvaluationContext {
  timeSec: number;
  season: string;
  timeOfDay: string;
  currentRoom?: RoomId;
  currentDevice?: DeviceRuntime;
}

export interface RuleEvaluationResult {
  hardViolations: RuleViolation[];
  softHints: RuleHint[];
  ruleFireings: { ruleId: string; deviceId?: string; room?: RoomId }[];
  totalRulesEvaluated: number;
  evaluation_time: number;
}

export interface RuleViolation {
  rule: WorldRule;
  violation: Transform;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RuleHint {
  rule: WorldRule;
  hint: Transform;
  weight: number;
}

export interface ActionConflict {
  target: string;
  actions: { deviceId: string; action: any; room: RoomId }[];
  type: string;
  severity: string;
}