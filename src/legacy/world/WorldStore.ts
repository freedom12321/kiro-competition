/**
 * World State Management Store
 * Implements Sprint 1 requirements and hysteresis/divergence from Sprint 12
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  WorldState,
  WorldEvent,
  DeviceAction,
  RoomId,
  VariableName,
  RoomVariableModifier,
  DEFAULT_ROOM_STATE,
  DEFAULT_RESOURCES,
  DivergencePoint,
  DEFAULT_HYSTERESIS,
  HysteresisConfig,
  WorldUpdate,
  AgentPlan
} from './types';
import { tick } from '../sim/tickLoop';

// RNG utilities for deterministic simulation
export class SeededRNG {
  private seed: number;
  private state: number;

  constructor(seed: number) {
    this.seed = seed;
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return this.state;
  }

  random(): number {
    return (this.next() - 1) / 2147483646;
  }

  randomNorm(): number {
    // Box-Muller transform for normal distribution
    const u1 = this.random();
    const u2 = this.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  pickWeighted<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const random = this.random() * totalWeight;

    let currentWeight = 0;
    for (let i = 0; i < items.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }
}

interface WorldStore extends WorldState {
  // Core simulation controls
  startSim: () => void;
  pauseSim: () => void;
  step: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  resetWorld: (seed?: number) => void;

  // Action processing
  applyActions: (actions: DeviceAction[]) => WorldUpdate;
  applyPlan: (plan: AgentPlan) => void;

  // Event management
  appendEvent: (event: Omit<WorldEvent, 'at'>) => void;
  clearEvents: (olderThanTicks?: number) => void;

  // Room variable helpers
  heat: (room: RoomId, delta: number, source?: string) => void;
  illuminate: (room: RoomId, delta: number, source?: string) => void;
  adjustNoise: (room: RoomId, delta: number, source?: string) => void;
  adjustHumidity: (room: RoomId, delta: number, source?: string) => void;
  adjustMood: (room: RoomId, delta: number, source?: string) => void;

  // Health and harmony
  calculateHealth: () => number;
  updateDivergence: () => void;

  // Hysteresis and rate limiting
  enforceHysteresis: (deviceId: string, action: DeviceAction) => DeviceAction | null;

  // Causal chain detection
  detectCausalChains: () => string[];

  // Device management
  addDevice: (device: any) => void;
  removeDevice: (deviceId: string) => void;

  // Internal state
  _tickInterval: NodeJS.Timeout | null;
  _rng: SeededRNG;
  _hysteresisConfig: HysteresisConfig;
}

// Initial state factory
const createInitialState = (seed?: number): WorldState => ({
  timeSec: 0,
  tick: 0,
  running: false,
  speed: 1,
  rooms: {
    living_room: { ...DEFAULT_ROOM_STATE },
    kitchen: { ...DEFAULT_ROOM_STATE, temperature: 24.0, humidity: 55 },
    bedroom: { ...DEFAULT_ROOM_STATE, temperature: 20.0, lumens: 50 }
  },
  devices: {},
  policies: {
    rules: [],
    charter: undefined
  },
  resources: { ...DEFAULT_RESOURCES },
  health: 1.0,
  eventLog: [],
  seed: seed ?? Math.floor(Math.random() * 1000000),
  randTick: 0,
  charter: undefined,
  divergenceHistory: [],
  deviceCooldowns: {},
  rateConstraints: {}
});

export const useWorldStore = create<WorldStore>()(
  immer((set, get) => ({
    ...createInitialState(),
    _tickInterval: null,
    _rng: new SeededRNG(Math.floor(Math.random() * 1000000)),
    _hysteresisConfig: DEFAULT_HYSTERESIS,

    // === CORE SIMULATION CONTROLS ===

    startSim: () => {
      const state = get();
      if (state.running || state._tickInterval) return;

      set((draft) => {
        draft.running = true;
      });

      const tickInterval = 10000 / state.speed; // 10 seconds divided by speed
      const interval = setInterval(() => {
        get().step();
      }, tickInterval);

      set((draft) => {
        draft._tickInterval = interval;
      });
    },

    pauseSim: () => {
      const state = get();
      if (state._tickInterval) {
        clearInterval(state._tickInterval);
      }

      set((draft) => {
        draft.running = false;
        draft._tickInterval = null;
      });
    },

    step: () => {
      set((draft) => {
        draft.tick += 1;
        draft.timeSec = draft.tick * 10; // Each tick is 10 seconds
        draft.randTick += 1;

        // Update RNG state
        draft._rng.next();

        // Process any pending cooldowns
        Object.keys(draft.deviceCooldowns).forEach(deviceId => {
          if (draft.deviceCooldowns[deviceId] > 0) {
            draft.deviceCooldowns[deviceId] -= 1;
          }
        });

        // Calculate and update health
        draft.health = get().calculateHealth();

        // Update divergence tracking
        get().updateDivergence();

        // Emit tick event
        draft.eventLog.push({
          at: draft.tick,
          room: 'living_room', // Default room for system events
          kind: 'system_tick',
          data: { tick: draft.tick, timeSec: draft.timeSec, health: draft.health },
          description: `Tick ${draft.tick} - System health: ${(draft.health * 100).toFixed(1)}%`
        });
      });

      // Run the actual AI simulation tick (async)
      const currentState = get();
      tick(currentState as any).catch(error => {
        console.error('Tick error:', error);
        // Add error to event log
        set((draft) => {
          draft.eventLog.push({
            at: draft.timeSec,
            room: 'living_room',
            kind: 'system_error',
            data: { error: error.message },
            description: `Simulation error: ${error.message}`
          });
        });
      });
    },

    setSpeed: (speed: 1 | 2 | 4) => {
      const state = get();
      const wasRunning = state.running;

      if (wasRunning) {
        get().pauseSim();
      }

      set((draft) => {
        draft.speed = speed;
      });

      if (wasRunning) {
        get().startSim();
      }
    },

    resetWorld: (seed?: number) => {
      const state = get();
      if (state._tickInterval) {
        clearInterval(state._tickInterval);
      }

      const newSeed = seed ?? Math.floor(Math.random() * 1000000);
      const initialState = createInitialState(newSeed);

      set((draft) => {
        Object.assign(draft, initialState);
        draft._tickInterval = null;
        draft._rng = new SeededRNG(newSeed);
        draft._hysteresisConfig = DEFAULT_HYSTERESIS;
      });
    },

    // === ACTION PROCESSING ===

    applyActions: (actions: DeviceAction[]): WorldUpdate => {
      const update: WorldUpdate = {
        roomUpdates: {},
        eventUpdates: [],
        deviceUpdates: {},
        resourceUpdates: {},
        healthUpdate: undefined
      };

      set((draft) => {
        actions.forEach(action => {
          const processedAction = get().enforceHysteresis(action.deviceId, action);
          if (!processedAction) return; // Action blocked by hysteresis

          // Process the action based on its type
          switch (processedAction.type) {
            case 'adjust_temperature':
              const tempDelta = processedAction.parameters.delta as number;
              const targetRoom = processedAction.targetRoom || draft.devices[action.deviceId]?.room || 'living_room';

              if (draft.rooms[targetRoom]) {
                const oldTemp = draft.rooms[targetRoom].temperature;
                draft.rooms[targetRoom].temperature = Math.max(16, Math.min(30, oldTemp + tempDelta));

                if (!update.roomUpdates[targetRoom]) {
                  update.roomUpdates[targetRoom] = {};
                }
                update.roomUpdates[targetRoom].temperature = draft.rooms[targetRoom].temperature;

                // Add event
                const tempEvent: WorldEvent = {
                  at: draft.tick,
                  room: targetRoom,
                  deviceId: processedAction.deviceId,
                  kind: 'temperature_change',
                  data: { old: oldTemp, new: draft.rooms[targetRoom].temperature, delta: tempDelta },
                  description: `${processedAction.deviceId} adjusted temperature by ${tempDelta.toFixed(1)}°C in ${targetRoom}`
                };
                draft.eventLog.push(tempEvent);
                update.eventUpdates.push(tempEvent);
              }
              break;

            case 'adjust_lighting':
              const lightDelta = processedAction.parameters.delta as number;
              const lightRoom = processedAction.targetRoom || draft.devices[action.deviceId]?.room || 'living_room';

              if (draft.rooms[lightRoom]) {
                const oldLumens = draft.rooms[lightRoom].lumens;
                draft.rooms[lightRoom].lumens = Math.max(0, Math.min(1000, oldLumens + lightDelta));

                if (!update.roomUpdates[lightRoom]) {
                  update.roomUpdates[lightRoom] = {};
                }
                update.roomUpdates[lightRoom].lumens = draft.rooms[lightRoom].lumens;

                const lightEvent: WorldEvent = {
                  at: draft.tick,
                  room: lightRoom,
                  deviceId: processedAction.deviceId,
                  kind: 'lighting_change',
                  data: { old: oldLumens, new: draft.rooms[lightRoom].lumens, delta: lightDelta },
                  description: `${processedAction.deviceId} adjusted lighting by ${lightDelta} lumens in ${lightRoom}`
                };
                draft.eventLog.push(lightEvent);
                update.eventUpdates.push(lightEvent);
              }
              break;
          }
        });

        // Update health after all actions
        const newHealth = get().calculateHealth();
        draft.health = newHealth;
        update.healthUpdate = newHealth;
      });

      return update;
    },

    applyPlan: (plan: AgentPlan) => {
      get().applyActions(plan.actions);

      set((draft) => {
        // Log the agent's reasoning
        draft.eventLog.push({
          at: draft.tick,
          room: draft.devices[plan.deviceId]?.room || 'living_room',
          deviceId: plan.deviceId,
          kind: 'agent_planning',
          data: {
            reasoning: plan.reasoning,
            confidence: plan.confidence,
            actionCount: plan.actions.length
          },
          description: `${plan.deviceId} planned ${plan.actions.length} actions (confidence: ${(plan.confidence * 100).toFixed(0)}%)`
        });
      });
    },

    // === EVENT MANAGEMENT ===

    appendEvent: (event: Omit<WorldEvent, 'at'>) => {
      set((draft) => {
        const fullEvent: WorldEvent = {
          ...event,
          at: draft.tick
        };
        draft.eventLog.push(fullEvent);

        // Keep only last 1000 events to prevent memory bloat
        if (draft.eventLog.length > 1000) {
          draft.eventLog = draft.eventLog.slice(-1000);
        }
      });
    },

    clearEvents: (olderThanTicks?: number) => {
      set((draft) => {
        if (olderThanTicks !== undefined) {
          const cutoffTick = draft.tick - olderThanTicks;
          draft.eventLog = draft.eventLog.filter(event => event.at >= cutoffTick);
        } else {
          draft.eventLog = [];
        }
      });
    },

    // === ROOM VARIABLE HELPERS ===

    heat: (room: RoomId, delta: number, source?: string) => {
      get().applyActions([{
        deviceId: source || 'system',
        type: 'adjust_temperature',
        parameters: { delta },
        targetRoom: room,
        priority: 1
      }]);
    },

    illuminate: (room: RoomId, delta: number, source?: string) => {
      get().applyActions([{
        deviceId: source || 'system',
        type: 'adjust_lighting',
        parameters: { delta },
        targetRoom: room,
        priority: 1
      }]);
    },

    adjustNoise: (room: RoomId, delta: number, source?: string) => {
      set((draft) => {
        if (draft.rooms[room]) {
          const oldNoise = draft.rooms[room].noise;
          draft.rooms[room].noise = Math.max(0, Math.min(100, oldNoise + delta));

          draft.eventLog.push({
            at: draft.tick,
            room,
            deviceId: source,
            kind: 'noise_change',
            data: { old: oldNoise, new: draft.rooms[room].noise, delta },
            description: `${source || 'System'} adjusted noise by ${delta.toFixed(1)}dB in ${room}`
          });
        }
      });
    },

    adjustHumidity: (room: RoomId, delta: number, source?: string) => {
      set((draft) => {
        if (draft.rooms[room]) {
          const oldHumidity = draft.rooms[room].humidity;
          draft.rooms[room].humidity = Math.max(0, Math.min(100, oldHumidity + delta));

          draft.eventLog.push({
            at: draft.tick,
            room,
            deviceId: source,
            kind: 'humidity_change',
            data: { old: oldHumidity, new: draft.rooms[room].humidity, delta },
            description: `${source || 'System'} adjusted humidity by ${delta.toFixed(1)}% in ${room}`
          });
        }
      });
    },

    adjustMood: (room: RoomId, delta: number, source?: string) => {
      set((draft) => {
        if (draft.rooms[room]) {
          const oldMood = draft.rooms[room].mood_score;
          draft.rooms[room].mood_score = Math.max(0, Math.min(1, oldMood + delta));

          draft.eventLog.push({
            at: draft.tick,
            room,
            deviceId: source,
            kind: 'mood_change',
            data: { old: oldMood, new: draft.rooms[room].mood_score, delta },
            description: `${source || 'System'} adjusted mood by ${delta.toFixed(2)} in ${room}`
          });
        }
      });
    },

    // === HEALTH AND HARMONY ===

    calculateHealth: () => {
      const state = get();
      let totalScore = 0;
      let roomCount = 0;

      // Calculate harmony based on deviation from ideal values
      Object.entries(state.rooms).forEach(([roomId, roomState]) => {
        let roomScore = 1.0;
        const room = roomId as RoomId;

        // Temperature scoring (ideal: 20-24°C)
        const temp = roomState.temperature;
        if (temp < 18 || temp > 26) {
          roomScore *= 0.5; // Safety violation
        } else if (temp < 20 || temp > 24) {
          roomScore *= 0.8; // Comfort issue
        }

        // Lighting scoring (bedroom should be dimmer)
        const lumens = roomState.lumens;
        if (room === 'bedroom' && lumens > 500) {
          roomScore *= 0.7; // Too bright for bedroom
        } else if (lumens > 1000) {
          roomScore *= 0.6; // Too bright overall
        } else if (lumens < 50 && state.timeSec % (24 * 3600) > 6 * 3600 && state.timeSec % (24 * 3600) < 22 * 3600) {
          roomScore *= 0.8; // Too dark during day
        }

        // Noise scoring
        const noise = roomState.noise;
        if (noise > 60) {
          roomScore *= 0.6; // Too noisy
        } else if (noise > 45 && room === 'bedroom') {
          roomScore *= 0.8; // Too noisy for bedroom
        }

        // Humidity scoring (ideal: 40-60%)
        const humidity = roomState.humidity;
        if (humidity < 30 || humidity > 70) {
          roomScore *= 0.7; // Comfort issue
        }

        // Mood scoring directly affects health
        roomScore *= roomState.mood_score;

        totalScore += roomScore;
        roomCount++;
      });

      return roomCount > 0 ? totalScore / roomCount : 1.0;
    },

    updateDivergence: () => {
      const state = get();
      set((draft) => {
        // Track divergence from charter targets if available
        if (draft.charter) {
          Object.entries(draft.rooms).forEach(([roomId, roomState]) => {
            Object.entries(roomState).forEach(([variable, actual]) => {
              const target = draft.charter!.targets[`${roomId}_${variable}`];
              if (target !== undefined) {
                const deviation = Math.abs(actual - target);

                draft.divergenceHistory.push({
                  tick: draft.tick,
                  variable: variable as VariableName,
                  room: roomId as RoomId,
                  actual,
                  target,
                  deviation
                });
              }
            });
          });

          // Keep only last 100 divergence points to prevent memory bloat
          if (draft.divergenceHistory.length > 100) {
            draft.divergenceHistory = draft.divergenceHistory.slice(-100);
          }
        }
      });
    },

    // === HYSTERESIS AND RATE LIMITING ===

    enforceHysteresis: (deviceId: string, action: DeviceAction): DeviceAction | null => {
      const state = get();

      // Check device cooldown
      if (state.deviceCooldowns[deviceId] > 0) {
        return null; // Device is on cooldown
      }

      // Check rate limiting based on action type
      const constraintKey = `${deviceId}_${action.type}`;
      const constraint = state.rateConstraints[constraintKey];

      if (constraint && action.parameters.delta !== undefined) {
        const requestedDelta = Math.abs(action.parameters.delta as number);
        const maxAllowed = constraint.maxChangePerTick;

        if (requestedDelta > maxAllowed) {
          // Clamp the delta to maximum allowed
          const clampedAction = {
            ...action,
            parameters: {
              ...action.parameters,
              delta: Math.sign(action.parameters.delta as number) * maxAllowed
            }
          };

          // Set a short cooldown to prevent rapid-fire actions
          set((draft) => {
            draft.deviceCooldowns[deviceId] = 1;
          });

          return clampedAction;
        }
      }

      // Apply specific hysteresis rules
      if (action.type === 'adjust_temperature' && deviceId.includes('ac')) {
        // AC needs minimum 3 ticks between on/off
        set((draft) => {
          draft.deviceCooldowns[deviceId] = state._hysteresisConfig.acOnOffMinTicks;
        });
      }

      return action;
    },

    // === CAUSAL CHAIN DETECTION ===

    detectCausalChains: (): string[] => {
      const state = get();
      const chains: string[] = [];

      // Look for sequences of events that might form causal chains
      const recentEvents = state.eventLog.slice(-20); // Last 20 events

      // Simple heuristic: look for temperature changes followed by other changes
      for (let i = 0; i < recentEvents.length - 2; i++) {
        const event1 = recentEvents[i];
        const event2 = recentEvents[i + 1];
        const event3 = recentEvents[i + 2];

        if (event1.kind === 'temperature_change' &&
            event2.kind === 'lighting_change' &&
            event3.kind === 'noise_change' &&
            event2.at - event1.at <= 2 &&
            event3.at - event2.at <= 2) {

          const chain = `${event1.deviceId} changed temperature → ${event2.deviceId} adjusted lighting → ${event3.deviceId} modified noise`;
          chains.push(chain);
        }
      }

      return chains;
    },

    // === DEVICE MANAGEMENT ===

    addDevice: (device: any) => {
      set((draft) => {
        draft.devices[device.id] = device;

        draft.eventLog.push({
          at: draft.tick,
          room: device.room,
          deviceId: device.id,
          kind: 'device_added',
          data: { name: device.spec?.name || device.name },
          description: `Added ${device.spec?.name || device.name} to ${device.room}`
        });
      });
    },

    removeDevice: (deviceId: string) => {
      set((draft) => {
        const device = draft.devices[deviceId];
        if (device) {
          delete draft.devices[deviceId];

          draft.eventLog.push({
            at: draft.tick,
            room: device.room,
            deviceId,
            kind: 'device_removed',
            data: { name: device.spec?.name || 'Device' },
            description: `Removed ${device.spec?.name || 'Device'} from ${device.room}`
          });
        }
      });
    }
  }))
);

// Export helper functions for external use
export const worldHelpers = {
  heat: (room: RoomId, delta: number, source?: string) =>
    useWorldStore.getState().heat(room, delta, source),

  illuminate: (room: RoomId, delta: number, source?: string) =>
    useWorldStore.getState().illuminate(room, delta, source),

  adjustNoise: (room: RoomId, delta: number, source?: string) =>
    useWorldStore.getState().adjustNoise(room, delta, source),

  adjustHumidity: (room: RoomId, delta: number, source?: string) =>
    useWorldStore.getState().adjustHumidity(room, delta, source),

  adjustMood: (room: RoomId, delta: number, source?: string) =>
    useWorldStore.getState().adjustMood(room, delta, source)
};
