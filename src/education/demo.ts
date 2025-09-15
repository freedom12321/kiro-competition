/**
 * Educational Features Demo
 *
 * This script demonstrates the key educational components implemented in Sprint 5:
 * - WhyCard system for cause-effect explanations
 * - LessonSystem for contextual insights
 * - Educational tooltips and learning moments
 */

import { WorldEvent } from '../types/core';
import LessonSystem from './LessonSystem';

// Sample world events that trigger educational lessons
const sampleEvents: WorldEvent[] = [
  {
    at: 100,
    room: 'living_room',
    deviceId: 'smart_ac_1',
    kind: 'action',
    data: { action: 'heat', delta_c: 2.0, deltas: { comfort: 0.2, efficiency: -0.1 } }
  },
  {
    at: 110,
    room: 'living_room',
    deviceId: 'emotion_lamp_1',
    kind: 'action',
    data: { action: 'set_brightness', level_0_1: 0.8, deltas: { comfort: 0.1, efficiency: -0.15 } }
  },
  {
    at: 120,
    room: 'living_room',
    kind: 'conflict_resolved',
    data: {
      winner: 'smart_ac_1',
      loser: 'emotion_lamp_1',
      rule_applied: 'Safety > Comfort',
      utility_scores: { smart_ac: 0.8, emotion_lamp: 0.6 }
    }
  },
  {
    at: 130,
    room: 'living_room',
    kind: 'cooperation',
    data: {
      devices: ['smart_ac_1', 'emotion_lamp_1'],
      synergy_bonus: 0.3
    }
  },
  {
    at: 140,
    room: 'living_room',
    kind: 'safety_alarm',
    data: { alarm: 'temperature_limit', threshold: 28, actual: 28.5 }
  }
];

const sampleWorldState = {
  timeSec: 150,
  rooms: {
    living_room: { temperature: 28.2, lumens: 0.7, noise: 0.1, humidity: 0.5, mood_score: 0.6 },
    kitchen: { temperature: 22.0, lumens: 0.4, noise: 0.2, humidity: 0.4, mood_score: 0.7 },
    bedroom: { temperature: 20.0, lumens: 0.1, noise: 0.05, humidity: 0.45, mood_score: 0.8 }
  },
  devices: {
    'smart_ac_1': { id: 'smart_ac_1', status: 'acting' as const, room: 'living_room' as const },
    'emotion_lamp_1': { id: 'emotion_lamp_1', status: 'conflict' as const, room: 'living_room' as const }
  },
  policies: { priority_order: ['safety', 'comfort', 'efficiency', 'privacy'] },
  resources: { powerKw: 1.2, bandwidth: 0.6, privacyBudget: 0.9 },
  health: 0.7,
  eventLog: sampleEvents,
  running: true,
  speed: 1 as const,
  seed: 12345,
  randTick: 15,
  mode: 'sandbox' as const
};

/**
 * Demonstrate the educational system
 */
export function demonstrateEducationalFeatures() {
  console.log('🎓 AI Habitat Educational Features Demo');
  console.log('=========================================');

  const lessonSystem = new LessonSystem();

  // 1. Generate lessons from world events
  console.log('\n📚 Event-Based Lessons:');
  const eventLessons = lessonSystem.generateLessonsFromEvents(sampleEvents, sampleWorldState);
  eventLessons.forEach((lesson, index) => {
    console.log(`${index + 1}. ${lesson.type.toUpperCase()}: ${lesson.message}`);
  });

  // 2. Generate contextual lessons
  console.log('\n🌍 Contextual Lessons:');
  const contextLessons = lessonSystem.generateContextualLessons(sampleWorldState);
  contextLessons.forEach((lesson, index) => {
    console.log(`${index + 1}. ${lesson.type.toUpperCase()}: ${lesson.message}`);
  });

  // 3. Tutorial lessons
  console.log('\n🎯 Tutorial Lessons:');
  [1, 3, 5, 6].forEach(step => {
    const tutorialLesson = lessonSystem.getTutorialLesson(step);
    if (tutorialLesson) {
      console.log(`Step ${step}: ${tutorialLesson.message}`);
    }
  });

  // 4. Causal chains
  console.log('\n🔗 Causal Chain Examples:');
  const conflictEvent = sampleEvents.find(e => e.kind === 'conflict_resolved')!;
  const relatedEvents = sampleEvents.filter(e => e.at < conflictEvent.at);
  const causalChain = lessonSystem.generateCausalChain(conflictEvent, relatedEvents);
  console.log(`Conflict: ${causalChain}`);

  // 5. WhyCard data structure examples
  console.log('\n💡 WhyCard Event Examples:');
  sampleEvents.forEach((event, index) => {
    console.log(`${index + 1}. ${event.kind} @ ${event.at}s in ${event.room}`);
    if (event.data) {
      console.log(`   Data: ${JSON.stringify(event.data, null, 2)}`);
    }
  });

  console.log('\n✨ Demo complete! The educational system provides:');
  console.log('   • Interactive WhyCard explanations for all events');
  console.log('   • Contextual lesson tooltips based on system state');
  console.log('   • Tutorial progression with guided insights');
  console.log('   • Causal chain analysis for complex events');
  console.log('   • Real-time learning moment detection');
}

// Export for use in testing or development
export { sampleEvents, sampleWorldState };