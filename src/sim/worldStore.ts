import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { WorldState, RoomId, VariableName, WorldEvent, DeviceRuntime, RulePack, PersonRuntime } from '../types/core';
// Bundled policy packs
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import homePack from '../../.kiro/specs/policies/packs/home_base.json';
// @ts-ignore
import hospitalPack from '../../.kiro/specs/policies/packs/hospital_night.json';
// @ts-ignore
import deviceHintsPack from '../../.kiro/specs/policies/packs/device_hints.json';

// Persist rule toggle state
const RULE_LS_KEY = 'aihabitat_rule_toggles';
type SavedRules = { packs: Record<string, { active?: boolean; rules?: Record<string, boolean> }> };

function safeGetItem(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, val: string) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); } catch { /* ignore */ }
}
function loadSavedRules(): SavedRules {
  const raw = safeGetItem(RULE_LS_KEY);
  if (!raw) return { packs: {} };
  try { return JSON.parse(raw); } catch { return { packs: {} }; }
}
function applySavedRulesToPacks(packs: RulePack[], saved: SavedRules) {
  packs.forEach(p => {
    const entry = saved.packs[p.id];
    if (!entry) return;
    if (typeof entry.active === 'boolean') p.active = entry.active;
    if (entry.rules) {
      p.rules.forEach(r => {
        const v = entry.rules![r.id];
        if (typeof v === 'boolean') r.active = v;
      });
    }
  });
}
function savePackState(packs: RulePack[]) {
  const saved: SavedRules = { packs: {} };
  packs.forEach(p => {
    const rules: Record<string, boolean> = {};
    p.rules.forEach(r => { if (typeof r.active === 'boolean') rules[r.id] = r.active; });
    saved.packs[p.id] = { active: p.active, rules };
  });
  safeSetItem(RULE_LS_KEY, JSON.stringify(saved));
}
import { tick as simTick } from './tickLoop';
import { initializeRandom } from './rand';

interface WorldStoreActions {
  startSim: () => void;
  pauseSim: () => void;
  step: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  applyActions: (actions: { deviceId: string; action: any }[]) => void;
  appendEvent: (event: WorldEvent) => void;
  heat: (room: RoomId, delta: number) => void;
  adjustVariable: (room: RoomId, variable: VariableName, delta: number) => void;
  addDevice: (device: DeviceRuntime) => void;
  removeDevice: (deviceId: string) => void;
  addPerson: (p: PersonRuntime) => void;
  removePerson: (id: string) => void;
  reset: () => void;
  setRulePackActive: (packId: string, active: boolean) => void;
  toggleRuleActive: (packId: string, ruleId: string) => void;
}

type WorldStore = WorldState & WorldStoreActions;

const initialRooms = {
  living_room: {
    temperature: 22.0,
    lumens: 0.6,
    noise: 0.3,
    humidity: 0.45,
    mood_score: 0.7
  },
  kitchen: {
    temperature: 21.0,
    lumens: 0.7,
    noise: 0.4,
    humidity: 0.5,
    mood_score: 0.6
  },
  bedroom: {
    temperature: 20.0,
    lumens: 0.2,
    noise: 0.1,
    humidity: 0.4,
    mood_score: 0.8
  }
};

const initialPolicies = {
  priority_order: ["safety", "comfort", "efficiency", "privacy"],
  quiet_hours: { start: "22:00", end: "07:00" },
  limits: { max_power_kw: 2.0, min_bedroom_lumens: 0.05 },
  comms: { allow: [["monitor", "lights"], ["sofa", "ac"]] as [string, string][] },
  harm_sensitivity: 0.6
};

const createInitialState = (): WorldState => ({
  timeSec: 0,
  rooms: initialRooms,
  devices: {},
  people: {},
  policies: (() => {
    const packs = [homePack as RulePack, hospitalPack as RulePack, deviceHintsPack as RulePack];
    applySavedRulesToPacks(packs, loadSavedRules());
    return { ...initialPolicies, rule_packs: packs };
  })(),
  resources: { powerKw: 1.2, bandwidth: 0.8, privacyBudget: 1.0 },
  health: 1.0,
  eventLog: [],
  running: false,
  speed: 1,
  seed: Math.floor(Math.random() * 1000000),
  randTick: 0,
  mode: "open-ended"
});

export const useWorldStore = create<WorldStore>()(
  immer((set, get) => ({
    ...createInitialState(),

    startSim: () => {
      set((state) => {
        state.running = true;
      });

      // Initialize RNG with current seed for reproducibility
      initializeRandom(get().seed);

      const runLoop = async () => {
        const current = get();
        if (!current.running) return;

        // Build a shallow clone world object (exclude action methods)
        const worldClone: WorldState = {
          timeSec: current.timeSec,
          rooms: JSON.parse(JSON.stringify(current.rooms)),
          devices: JSON.parse(JSON.stringify(current.devices)),
          policies: JSON.parse(JSON.stringify(current.policies)),
          resources: JSON.parse(JSON.stringify(current.resources)),
          health: current.health,
          eventLog: JSON.parse(JSON.stringify(current.eventLog)),
          running: true,
          speed: current.speed,
          seed: current.seed,
          randTick: current.randTick,
          charter: current.charter ? JSON.parse(JSON.stringify(current.charter)) : undefined,
          mode: current.mode
        };

        // Run one simulation tick (LLM + mediate + apply)
        try {
          await simTick(worldClone);
        } catch (e) {
          // Ensure the loop continues even if tick errors
          console.error('Tick error:', e);
        }

        // Commit changed world state back into the store
        set((state) => {
          state.timeSec = worldClone.timeSec;
          state.rooms = worldClone.rooms;
          state.devices = worldClone.devices as any;
          state.policies = worldClone.policies;
          state.resources = worldClone.resources;
          state.health = worldClone.health;
          state.eventLog = worldClone.eventLog;
          state.randTick = worldClone.randTick;
          state.charter = worldClone.charter;
          // keep running and speed as-is
        });

        // Schedule next tick respecting speed (10s simulated per tick)
        setTimeout(runLoop, 10000 / get().speed);
      };

      // Start immediately
      runLoop();
    },

    pauseSim: () => {
      set((state) => {
        state.running = false;
      });
    },

    step: () => {
      // Manual single tick for debugging
      (async () => {
        const current = get();
        const worldClone: WorldState = {
          timeSec: current.timeSec,
          rooms: JSON.parse(JSON.stringify(current.rooms)),
          devices: JSON.parse(JSON.stringify(current.devices)),
          policies: JSON.parse(JSON.stringify(current.policies)),
          resources: JSON.parse(JSON.stringify(current.resources)),
          health: current.health,
          eventLog: JSON.parse(JSON.stringify(current.eventLog)),
          running: current.running,
          speed: current.speed,
          seed: current.seed,
          randTick: current.randTick,
          charter: current.charter ? JSON.parse(JSON.stringify(current.charter)) : undefined,
          mode: current.mode
        };

        await simTick(worldClone);

        set((state) => {
          state.timeSec = worldClone.timeSec;
          state.rooms = worldClone.rooms;
          state.devices = worldClone.devices as any;
          state.policies = worldClone.policies;
          state.resources = worldClone.resources;
          state.health = worldClone.health;
          state.eventLog = worldClone.eventLog;
          state.randTick = worldClone.randTick;
          state.charter = worldClone.charter;
        });
      })();
    },

    setSpeed: (speed) => {
      set((state) => {
        state.speed = speed;
      });
    },

    applyActions: (actions) => {
      set((state) => {
        for (const { deviceId, action } of actions) {
          const device = state.devices[deviceId];
          if (!device) continue;

          // Apply action based on type
          if (action.name === 'set_temperature') {
            const delta = action.args.target - state.rooms[device.room].temperature;
            state.rooms[device.room].temperature = Math.max(18, Math.min(28, action.args.target));

            state.eventLog.push({
              at: state.timeSec,
              room: device.room,
              deviceId,
              kind: 'action',
              data: { action: action.name, delta }
            });
          } else if (action.name === 'set_brightness') {
            state.rooms[device.room].lumens = Math.max(0, Math.min(1, action.args.level_0_1));

            state.eventLog.push({
              at: state.timeSec,
              room: device.room,
              deviceId,
              kind: 'action',
              data: { action: action.name, value: action.args.level_0_1 }
            });
          }
        }
      });
    },

    appendEvent: (event) => {
      set((state) => {
        state.eventLog.push(event);
      });
    },

    heat: (room, delta) => {
      set((state) => {
        const currentTemp = state.rooms[room].temperature;
        state.rooms[room].temperature = Math.max(18, Math.min(28, currentTemp + delta));

        state.eventLog.push({
          at: state.timeSec,
          room,
          kind: 'temperature_change',
          data: { delta, new_temperature: state.rooms[room].temperature }
        });
      });
    },

    adjustVariable: (room, variable, delta) => {
      set((state) => {
        const currentValue = state.rooms[room][variable];
        const minValue = variable === 'temperature' ? 18 : 0;
        const maxValue = variable === 'temperature' ? 28 : 1;

        state.rooms[room][variable] = Math.max(minValue, Math.min(maxValue, currentValue + delta));

        state.eventLog.push({
          at: state.timeSec,
          room,
          kind: 'variable_change',
          data: { variable, delta, new_value: state.rooms[room][variable] }
        });
      });
    },

    addDevice: (device) => {
      set((state) => {
        state.devices[device.id] = device;

        state.eventLog.push({
          at: state.timeSec,
          room: device.room,
          deviceId: device.id,
          kind: 'device_added',
          data: { name: device.spec.name }
        });
      });
    },

    addPerson: (p) => {
      set((state) => {
        if (!state.people) state.people = {} as any;
        state.people[p.id] = p;
        state.eventLog.push({
          at: state.timeSec,
          room: p.room,
          kind: 'person_added',
          data: { name: p.name, sprite: p.sprite }
        });
      });
    },

    removePerson: (id) => {
      set((state) => {
        if (state.people && state.people[id]) {
          const r = state.people[id].room;
          delete state.people[id];
          state.eventLog.push({ at: state.timeSec, room: r, kind: 'person_removed', data: { id } });
        }
      });
    },

    removeDevice: (deviceId) => {
      set((state) => {
        const device = state.devices[deviceId];
        if (device) {
          delete state.devices[deviceId];

          state.eventLog.push({
            at: state.timeSec,
            room: device.room,
            deviceId,
            kind: 'device_removed',
            data: { name: device.spec.name }
          });
        }
      });
    },

    reset: () => {
      set(() => createInitialState());
    },

    setRulePackActive: (packId, active) => {
      set((state) => {
        const packs = state.policies.rule_packs;
        if (!packs) return;
        const pack = packs.find(p => p.id === packId);
        if (pack) pack.active = active;
        savePackState(packs);
      });
    },

    toggleRuleActive: (packId, ruleId) => {
      set((state) => {
        const packs = state.policies.rule_packs;
        if (!packs) return;
        const pack = packs.find(p => p.id === packId);
        if (!pack) return;
        const rule = pack.rules.find(r => r.id === ruleId);
        if (!rule) return;
        rule.active = rule.active === false ? true : false;
        savePackState(packs);
      });
    }
  }))
);
