import { WorldEvent, WorldState } from '../types/core';

export interface Lesson {
  id: string;
  type: 'insight' | 'warning' | 'tip' | 'surprise';
  message: string;
  trigger: string;
  position?: { x: number; y: number };
  duration?: number;
}

export class LessonSystem {
  private recentLessons: Map<string, number> = new Map();
  private readonly cooldownMs = 30000; // 30 seconds between same lesson type

  /**
   * Analyze world events and generate educational lessons
   */
  public generateLessonsFromEvents(events: WorldEvent[], world: WorldState): Lesson[] {
    const lessons: Lesson[] = [];
    const now = Date.now();

    // Clear old lessons from cooldown tracking
    for (const [key, timestamp] of this.recentLessons.entries()) {
      if (now - timestamp > this.cooldownMs) {
        this.recentLessons.delete(key);
      }
    }

    // Analyze recent events (last 5 events)
    const recentEvents = events.slice(-5);

    // Check for conflict patterns
    const conflicts = recentEvents.filter(e => e.kind === 'conflict_resolved');
    if (conflicts.length >= 2 && !this.recentLessons.has('conflict_pattern')) {
      lessons.push({
        id: 'conflict_pattern',
        type: 'insight',
        message: 'Notice how conflicts happen when devices want different things. Good governance rules help them coordinate instead of competing.',
        trigger: 'multiple_conflicts',
        position: { x: 75, y: 15 },
        duration: 5000
      });
      this.recentLessons.set('conflict_pattern', now);
    }

    // Check for cooperation emergence
    const cooperation = recentEvents.filter(e => e.kind === 'cooperation');
    if (cooperation.length >= 1 && !this.recentLessons.has('cooperation_insight')) {
      lessons.push({
        id: 'cooperation_insight',
        type: 'tip',
        message: 'When devices work together, 1+1 can equal more than 2! This is emergence in action.',
        trigger: 'cooperation_detected',
        position: { x: 70, y: 25 },
        duration: 4000
      });
      this.recentLessons.set('cooperation_insight', now);
    }

    // Check for safety violations
    const safetyEvents = recentEvents.filter(e => e.kind === 'safety_alarm');
    if (safetyEvents.length >= 1 && !this.recentLessons.has('safety_warning')) {
      lessons.push({
        id: 'safety_warning',
        type: 'warning',
        message: 'Safety constraints are hard limits that AI systems must never violate. They ensure optimization doesn\'t cause harm.',
        trigger: 'safety_violation',
        position: { x: 80, y: 10 },
        duration: 6000
      });
      this.recentLessons.set('safety_warning', now);
    }

    // Check for director interventions
    const directorEvents = recentEvents.filter(e => e.kind === 'director_event');
    if (directorEvents.length >= 1 && !this.recentLessons.has('director_insight')) {
      lessons.push({
        id: 'director_insight',
        type: 'surprise',
        message: 'The system injects variety to create learning opportunities. Real environments are never perfectly predictable!',
        trigger: 'director_intervention',
        position: { x: 65, y: 35 },
        duration: 4500
      });
      this.recentLessons.set('director_insight', now);
    }

    // Check for message delays/communication issues
    const messageEvents = recentEvents.filter(e => e.kind === 'message' && e.data?.delayed);
    if (messageEvents.length >= 1 && !this.recentLessons.has('communication_lesson')) {
      lessons.push({
        id: 'communication_lesson',
        type: 'insight',
        message: 'Message delays made devices act on outdated information. Real-world AI systems face similar communication challenges.',
        trigger: 'communication_delay',
        position: { x: 60, y: 40 },
        duration: 4000
      });
      this.recentLessons.set('communication_lesson', now);
    }

    // Check for rapid oscillations (instability)
    const tempEvents = recentEvents.filter(e => e.kind === 'temperature_change');
    if (tempEvents.length >= 3 && !this.recentLessons.has('stability_warning')) {
      lessons.push({
        id: 'stability_warning',
        type: 'warning',
        message: 'Rapid changes often indicate system instability. Sometimes slowing down leads to better outcomes.',
        trigger: 'system_oscillation',
        position: { x: 55, y: 20 },
        duration: 5000
      });
      this.recentLessons.set('stability_warning', now);
    }

    // Check for harmony improvements
    if (world.health > 0.8 && !this.recentLessons.has('harmony_success')) {
      lessons.push({
        id: 'harmony_success',
        type: 'tip',
        message: 'Great harmony! When AI agents coordinate well, everyone benefits. This is the goal of good AI governance.',
        trigger: 'high_harmony',
        position: { x: 50, y: 30 },
        duration: 4000
      });
      this.recentLessons.set('harmony_success', now);
    }

    // Check for learning adaptation
    const adaptationEvents = recentEvents.filter(e => e.data?.learned || e.data?.adapted);
    if (adaptationEvents.length >= 1 && !this.recentLessons.has('learning_insight')) {
      lessons.push({
        id: 'learning_insight',
        type: 'insight',
        message: 'Devices are learning from experience and adapting their behavior. This is how AI systems improve over time.',
        trigger: 'device_learning',
        position: { x: 85, y: 45 },
        duration: 4500
      });
      this.recentLessons.set('learning_insight', now);
    }

    return lessons;
  }

  /**
   * Generate lessons based on specific world conditions
   */
  public generateContextualLessons(world: WorldState): Lesson[] {
    const lessons: Lesson[] = [];
    const now = Date.now();

    // Low harmony warning
    if (world.health < 0.3 && !this.recentLessons.has('low_harmony')) {
      lessons.push({
        id: 'low_harmony',
        type: 'warning',
        message: 'System harmony is low. Try adjusting priorities or communication policies to help devices coordinate better.',
        trigger: 'low_harmony_detected',
        position: { x: 45, y: 15 },
        duration: 6000
      });
      this.recentLessons.set('low_harmony', now);
    }

    // High resource usage
    const totalPower = world.resources.powerKw;
    if (totalPower > 1.5 && !this.recentLessons.has('resource_usage')) {
      lessons.push({
        id: 'resource_usage',
        type: 'tip',
        message: 'High power usage detected. Energy efficiency can be improved through better device coordination.',
        trigger: 'high_resource_usage',
        position: { x: 90, y: 25 },
        duration: 4000
      });
      this.recentLessons.set('resource_usage', now);
    }

    // Many devices but low activity
    const deviceCount = Object.keys(world.devices).length;
    const activeDevices = Object.values(world.devices).filter(d => d.status === 'acting').length;
    if (deviceCount >= 4 && activeDevices < 2 && !this.recentLessons.has('underutilization')) {
      lessons.push({
        id: 'underutilization',
        type: 'insight',
        message: 'Many devices but little activity. Sometimes AI systems need variety or challenges to stay engaged.',
        trigger: 'device_underutilization',
        position: { x: 40, y: 35 },
        duration: 4500
      });
      this.recentLessons.set('underutilization', now);
    }

    return lessons;
  }

  /**
   * Get lesson for tutorial step progression
   */
  public getTutorialLesson(stepNumber: number): Lesson | null {
    const tutorialLessons: Record<number, Lesson> = {
      1: {
        id: 'tutorial_start',
        type: 'tip',
        message: 'Welcome! Watch how smart devices interact. They might cooperate... or compete!',
        trigger: 'tutorial_step_1',
        position: { x: 50, y: 10 },
        duration: 5000
      },
      3: {
        id: 'tutorial_conflict',
        type: 'insight',
        message: 'See the conflict? When devices optimize individually, 1+1+1 can be less than 3. Governance helps!',
        trigger: 'tutorial_step_3',
        position: { x: 60, y: 20 },
        duration: 6000
      },
      5: {
        id: 'tutorial_solution',
        type: 'tip',
        message: 'Try changing priority order! Put "Comfort" above "Efficiency" and watch the magic happen.',
        trigger: 'tutorial_step_5',
        position: { x: 30, y: 25 },
        duration: 5000
      },
      6: {
        id: 'tutorial_success',
        type: 'surprise',
        message: 'Amazing! Same devices, different rules, better outcomes. This is the power of AI governance!',
        trigger: 'tutorial_step_6',
        position: { x: 70, y: 35 },
        duration: 5000
      }
    };

    return tutorialLessons[stepNumber] || null;
  }

  /**
   * Clear all lesson cooldowns (useful for testing or resets)
   */
  public clearCooldowns(): void {
    this.recentLessons.clear();
  }

  /**
   * Get causal chain explanation for complex events
   */
  public generateCausalChain(primaryEvent: WorldEvent, relatedEvents: WorldEvent[]): string {
    const chains: Record<string, string> = {
      temperature_change: this.buildTemperatureChain(primaryEvent, relatedEvents),
      conflict_resolved: this.buildConflictChain(primaryEvent, relatedEvents),
      cooperation: this.buildCooperationChain(primaryEvent, relatedEvents),
      safety_alarm: this.buildSafetyChain(primaryEvent, relatedEvents),
      director_event: this.buildDirectorChain(primaryEvent, relatedEvents)
    };

    return chains[primaryEvent.kind] || `${primaryEvent.kind} → system adaptation → new equilibrium`;
  }

  private buildTemperatureChain(event: WorldEvent, related: WorldEvent[]): string {
    const causes = related.filter(e => e.at < event.at && e.at > event.at - 60);
    if (causes.length === 0) return 'Temperature changed due to environmental factors';

    const deviceActions = causes.filter(e => e.kind === 'action');
    const directorEvents = causes.filter(e => e.kind === 'director_event');

    if (directorEvents.length > 0) {
      return `${directorEvents[0].data?.type} → temperature change → device reactions → new equilibrium`;
    }
    if (deviceActions.length > 0) {
      return `Device ${deviceActions[0].deviceId} action → temperature change → system adaptation`;
    }

    return 'External factors → temperature change → device response chain';
  }

  private buildConflictChain(event: WorldEvent, related: WorldEvent[]): string {
    return `Multiple device goals → resource competition → policy mediation → ${event.data?.winner} wins`;
  }

  private buildCooperationChain(event: WorldEvent, related: WorldEvent[]): string {
    return `Aligned incentives → communication → coordinated actions → synergistic outcome`;
  }

  private buildSafetyChain(event: WorldEvent, related: WorldEvent[]): string {
    return `Approaching safety limit → automatic intervention → system stabilization → harm prevented`;
  }

  private buildDirectorChain(event: WorldEvent, related: WorldEvent[]): string {
    return `Activity level detection → director intervention → environmental change → renewed engagement`;
  }
}

export default LessonSystem;