import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RuleEngine } from '@/policies/RuleEngine'
import {
  createMockWorldState,
  createMockPolicies,
  createSmartAcSpec,
  createSmartHeaterSpec,
  createEmotionLampSpec,
  createMonitorSpec,
  createSmartFridgeSpec,
  createCoffeeMakerSpec,
  createMockDeviceRuntime,
  createSafetyRulePack,
  createQuietHoursRulePack,
  createCommRulePack,
  advanceTimeToQuietHours,
  advanceTimeToDayTime
} from '../fixtures'
import { WorldState, AgentStep, DeviceRuntime } from '@/types/core'

describe('RuleEngine', () => {
  let ruleEngine: RuleEngine
  let mockWorld: WorldState

  beforeEach(() => {
    ruleEngine = new RuleEngine()
    mockWorld = createMockWorldState()

    // Mock console.warn to avoid noise in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('Basic Rule Evaluation', () => {
    it('should initialize with empty rule cache', () => {
      expect(ruleEngine['ruleCache'].size).toBe(0)
    })

    it('should load and cache rule packs correctly', () => {
      const safetyPack = createSafetyRulePack()
      const quietPack = createQuietHoursRulePack()

      ruleEngine.loadRulePacks([safetyPack, quietPack])

      expect(ruleEngine['activePacks']).toHaveLength(2)
      expect(ruleEngine['ruleCache'].size).toBeGreaterThan(0)
    })

    it('should only load active rule packs', () => {
      const inactivePack = { ...createSafetyRulePack(), active: false }
      const activePack = createQuietHoursRulePack()

      ruleEngine.loadRulePacks([inactivePack, activePack])

      expect(ruleEngine['activePacks']).toHaveLength(1)
      expect(ruleEngine['activePacks'][0].id).toBe('quiet_hours_pack')
    })
  })

  describe('Predicate Evaluation', () => {
    beforeEach(() => {
      ruleEngine.loadRulePacks([createSafetyRulePack(), createQuietHoursRulePack()])
    })

    it('should correctly evaluate time_between predicates during quiet hours', () => {
      const quietWorld = advanceTimeToQuietHours(mockWorld)
      const context = {
        timeSec: quietWorld.timeSec,
        season: 'winter',
        timeOfDay: 'night'
      }

      const result = ruleEngine.evaluateRules(quietWorld, context)

      // Should have rule firings for quiet hours rules
      expect(result.ruleFireings.length).toBeGreaterThan(0)
      expect(result.softHints.length).toBeGreaterThan(0)
    })

    it('should correctly evaluate temperature predicates', () => {
      const hotWorld = createMockWorldState({
        rooms: {
          ...mockWorld.rooms,
          living_room: {
            ...mockWorld.rooms.living_room,
            temperature: 27 // Above safety limit
          }
        }
      })

      const context = {
        timeSec: 0,
        season: 'summer',
        timeOfDay: 'afternoon'
      }

      const result = ruleEngine.evaluateRules(hotWorld, context)

      expect(result.hardViolations.length).toBeGreaterThan(0)
      expect(result.hardViolations[0].rule.id).toBe('temp_safety_limits')
    })

    it('should correctly evaluate device_type predicates', () => {
      const lampDevice = createMockDeviceRuntime(createEmotionLampSpec())
      const testWorld = {
        ...mockWorld,
        devices: { [lampDevice.id]: lampDevice }
      }

      const context = {
        timeSec: 0,
        season: 'winter',
        timeOfDay: 'morning',
        currentDevice: lampDevice
      }

      const result = ruleEngine.evaluateRules(testWorld, context)

      // Should evaluate device-specific rules
      expect(result.totalRulesEvaluated).toBeGreaterThan(0)
    })
  })

  describe('Conflict Detection and Resolution', () => {
    let acDevice: DeviceRuntime
    let heaterDevice: DeviceRuntime
    let conflictWorld: WorldState

    beforeEach(() => {
      acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'ac_001' })
      heaterDevice = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'heater_001' })

      conflictWorld = {
        ...mockWorld,
        devices: {
          [acDevice.id]: acDevice,
          [heaterDevice.id]: heaterDevice
        }
      }

      ruleEngine.loadRulePacks([createSafetyRulePack()])
    })

    it('should detect temperature conflicts between AC and Heater', () => {
      const devicePlans = [
        {
          deviceId: acDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -2 } }],
            explain: 'Cooling room'
          } as AgentStep
        },
        {
          deviceId: heaterDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 3 } }],
            explain: 'Heating room'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, conflictWorld)

      expect(result.conflicts.length).toBeGreaterThan(0)
      const temperatureConflict = result.conflicts.find(c =>
        c.explanation.includes('temperature') || c.explanation.includes('conflict')
      )
      expect(temperatureConflict).toBeDefined()
    })

    it('should resolve conflicts with safety priority - AC cools vs Heater warms → Safety wins', () => {
      // Create a hot world where cooling is safer
      const hotWorld = {
        ...conflictWorld,
        rooms: {
          ...conflictWorld.rooms,
          living_room: {
            ...conflictWorld.rooms.living_room,
            temperature: 25.5 // Close to safety limit
          }
        }
      }

      const devicePlans = [
        {
          deviceId: acDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -1 } }], // Safer action
            explain: 'Cooling for safety'
          } as AgentStep
        },
        {
          deviceId: heaterDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 2 } }], // Less safe
            explain: 'Heating for comfort'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, hotWorld)

      expect(result.conflicts.length).toBeGreaterThan(0)
      const resolution = result.conflicts[0]

      // AC should win due to safety priority in hot conditions
      expect(resolution.winner).toBe(acDevice.id)
      expect(resolution.loser).toBe(heaterDevice.id)

      // Final actions should only include AC's cooling
      const acActions = result.actions.filter(a => a.deviceId === acDevice.id)
      const heaterActions = result.actions.filter(a => a.deviceId === heaterDevice.id)

      expect(acActions.length).toBeGreaterThan(0)
      expect(heaterActions.length).toBe(0)
    })

    it('should enforce hard safety constraints immediately', () => {
      const dangerousWorld = {
        ...conflictWorld,
        rooms: {
          ...conflictWorld.rooms,
          living_room: {
            ...conflictWorld.rooms.living_room,
            temperature: 28 // Above hard limit
          }
        }
      }

      const devicePlans = [
        {
          deviceId: heaterDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 2 } }],
            explain: 'Heating more'
          } as AgentStep
        }
      ]

      ruleEngine.mediate(devicePlans, dangerousWorld)

      // Hard constraints should clamp temperature
      expect(dangerousWorld.rooms.living_room.temperature).toBeLessThanOrEqual(26)
    })
  })

  describe('Quiet Hours Enforcement', () => {
    let lampDevice: DeviceRuntime
    let monitorDevice: DeviceRuntime
    let quietWorld: WorldState

    beforeEach(() => {
      lampDevice = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'lamp_001' })
      monitorDevice = createMockDeviceRuntime(createMonitorSpec(), { id: 'monitor_001' })

      quietWorld = advanceTimeToQuietHours({
        ...mockWorld,
        devices: {
          [lampDevice.id]: lampDevice,
          [monitorDevice.id]: monitorDevice
        }
      })

      ruleEngine.loadRulePacks([createQuietHoursRulePack()])
    })

    it('should enforce quiet hours: lights lose to monitor at night', () => {
      const devicePlans = [
        {
          deviceId: lampDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'set_brightness', args: { level_0_1: 0.8 } }],
            explain: 'Brightening for mood'
          } as AgentStep
        },
        {
          deviceId: monitorDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'alert', args: { type: 'health_warning' } }],
            explain: 'Health alert needed'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, quietWorld)

      // Monitor should have higher priority during quiet hours
      const monitorActions = result.actions.filter(a => a.deviceId === monitorDevice.id)
      const lampActions = result.actions.filter(a => a.deviceId === lampDevice.id)

      expect(monitorActions.length).toBeGreaterThan(0)

      // If there was a conflict, monitor should win
      if (result.conflicts.length > 0) {
        const conflict = result.conflicts[0]
        expect(conflict.winner).toBe(monitorDevice.id)
      }
    })

    it('should apply quiet hours soft constraints to lighting', () => {
      const context = {
        timeSec: quietWorld.timeSec,
        season: 'winter',
        timeOfDay: 'night'
      }

      const result = ruleEngine.evaluateRules(quietWorld, context)

      const lightingHints = result.softHints.filter(hint =>
        hint.rule.id.includes('lighting') && hint.hint.target === 'lumens'
      )

      expect(lightingHints.length).toBeGreaterThan(0)
      expect(lightingHints[0].hint.max).toBeLessThanOrEqual(0.1)
    })
  })

  describe('Communication Rules Enforcement', () => {
    let fridgeDevice: DeviceRuntime
    let coffeeDevice: DeviceRuntime

    beforeEach(() => {
      fridgeDevice = createMockDeviceRuntime(createSmartFridgeSpec(), { id: 'fridge_001' })
      coffeeDevice = createMockDeviceRuntime(createCoffeeMakerSpec(), { id: 'coffee_001' })

      mockWorld = {
        ...mockWorld,
        devices: {
          [fridgeDevice.id]: fridgeDevice,
          [coffeeDevice.id]: coffeeDevice
        }
      }

      ruleEngine.loadRulePacks([createCommRulePack()])
    })

    it('should block fridge from messaging coffee maker', () => {
      const context = {
        timeSec: mockWorld.timeSec,
        season: 'spring',
        timeOfDay: 'morning',
        currentDevice: fridgeDevice
      }

      const result = ruleEngine.evaluateRules(mockWorld, context)

      const commHints = result.softHints.filter(hint =>
        hint.hint.action_hint && 'message_coffee_maker' in hint.hint.action_hint
      )

      expect(commHints.length).toBeGreaterThan(0)
      expect(commHints[0].hint.action_hint!.message_coffee_maker).toBeLessThan(0)
    })
  })

  describe('Utility Scoring and Priority Resolution', () => {
    it('should calculate utility scores based on device goals', () => {
      const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'ac_001' })
      const world = {
        ...mockWorld,
        devices: { [acDevice.id]: acDevice }
      }

      const coolAction = { name: 'cool', args: { delta: -1 } }
      const score = ruleEngine['calculateUtilityScore'](acDevice.id, coolAction, world, [])

      expect(score).toBeGreaterThan(0)
    })

    it('should prefer higher utility scores in conflict resolution', () => {
      const highPriorityDevice = createMockDeviceRuntime(createSmartAcSpec(), {
        id: 'high_priority',
        spec: {
          ...createSmartAcSpec(),
          goals: [{ name: 'safety', weight: 1.0 }]
        }
      })

      const lowPriorityDevice = createMockDeviceRuntime(createSmartHeaterSpec(), {
        id: 'low_priority',
        spec: {
          ...createSmartHeaterSpec(),
          goals: [{ name: 'comfort', weight: 0.3 }]
        }
      })

      const world = {
        ...mockWorld,
        devices: {
          [highPriorityDevice.id]: highPriorityDevice,
          [lowPriorityDevice.id]: lowPriorityDevice
        }
      }

      const devicePlans = [
        {
          deviceId: highPriorityDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -1 } }],
            explain: 'Safety cooling'
          } as AgentStep
        },
        {
          deviceId: lowPriorityDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 1 } }],
            explain: 'Comfort heating'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, world)

      if (result.conflicts.length > 0) {
        expect(result.conflicts[0].winner).toBe(highPriorityDevice.id)
        expect(result.conflicts[0].utility_scores[highPriorityDevice.id])
          .toBeGreaterThan(result.conflicts[0].utility_scores[lowPriorityDevice.id])
      }
    })
  })

  describe('Mediation Logging and Events', () => {
    it('should generate appropriate mediation logs', () => {
      const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'ac_001' })
      const heaterDevice = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'heater_001' })

      const world = {
        ...mockWorld,
        devices: {
          [acDevice.id]: acDevice,
          [heaterDevice.id]: heaterDevice
        }
      }

      const devicePlans = [
        {
          deviceId: acDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -2 } }],
            explain: 'Cooling'
          } as AgentStep
        },
        {
          deviceId: heaterDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 1 } }],
            explain: 'Heating'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, world)

      expect(result.logs.length).toBeGreaterThan(0)

      const conflictLogs = result.logs.filter(log => log.kind === 'conflict_resolved')
      if (result.conflicts.length > 0) {
        expect(conflictLogs.length).toBeGreaterThan(0)
      }
    })

    it('should track rule firings correctly', () => {
      ruleEngine.loadRulePacks([createSafetyRulePack()])

      const hotWorld = createMockWorldState({
        rooms: {
          ...mockWorld.rooms,
          living_room: {
            ...mockWorld.rooms.living_room,
            temperature: 27
          }
        }
      })

      const result = ruleEngine.mediate([], hotWorld)

      expect(result.rule_firings.length).toBeGreaterThan(0)
      const safetyRuleFiring = result.rule_firings.find(rf => rf.ruleId === 'temp_safety_limits')
      expect(safetyRuleFiring).toBeDefined()
    })
  })

  describe('Time and Season Logic', () => {
    it('should correctly determine season from time', () => {
      const winterTime = 30 * 24 * 60 * 60 // 30 days = winter
      const summerTime = 200 * 24 * 60 * 60 // 200 days = summer

      expect(ruleEngine['getSeason'](winterTime)).toBe('winter')
      expect(ruleEngine['getSeason'](summerTime)).toBe('summer')
    })

    it('should correctly determine time of day', () => {
      const morningTime = 10 * 60 * 60 // 10:00
      const nightTime = 2 * 60 * 60 // 02:00

      expect(ruleEngine['getTimeOfDay'](morningTime)).toBe('morning')
      expect(ruleEngine['getTimeOfDay'](nightTime)).toBe('night')
    })

    it('should handle time ranges crossing midnight', () => {
      const lateNight = 23 * 60 * 60 + 30 * 60 // 23:30
      const earlyMorning = 6 * 60 * 60 + 30 * 60 // 06:30

      expect(ruleEngine['isTimeBetween'](lateNight, "22:00", "07:00")).toBe(true)
      expect(ruleEngine['isTimeBetween'](earlyMorning, "22:00", "07:00")).toBe(true)
    })
  })

  describe('Action Target Mapping', () => {
    it('should correctly map actions to room variables', () => {
      expect(ruleEngine['getActionTarget']({ name: 'cool' })).toBe('temperature')
      expect(ruleEngine['getActionTarget']({ name: 'heat' })).toBe('temperature')
      expect(ruleEngine['getActionTarget']({ name: 'set_brightness' })).toBe('lumens')
      expect(ruleEngine['getActionTarget']({ name: 'play_sound' })).toBe('noise')
      expect(ruleEngine['getActionTarget']({ name: 'unknown_action' })).toBeNull()
    })
  })

  describe('Conflict Type Detection', () => {
    it('should detect temperature conflicts', () => {
      const actions = [
        { deviceId: 'ac', action: { name: 'cool' }, room: 'living_room' as const },
        { deviceId: 'heater', action: { name: 'heat' }, room: 'living_room' as const }
      ]

      const conflictType = ruleEngine['getConflictType'](actions)
      expect(conflictType).toBe('temperature_conflict')
    })

    it('should detect resource conflicts', () => {
      const actions = [
        { deviceId: 'device1', action: { name: 'high_power', args: { power: 0.7 } }, room: 'living_room' as const },
        { deviceId: 'device2', action: { name: 'high_power', args: { power: 0.8 } }, room: 'living_room' as const }
      ]

      const conflictType = ruleEngine['getConflictType'](actions)
      expect(conflictType).toBe('resource_conflict')
    })

    it('should return none for non-conflicting actions', () => {
      const actions = [
        { deviceId: 'lamp', action: { name: 'set_color' }, room: 'bedroom' as const },
        { deviceId: 'monitor', action: { name: 'check_vitals' }, room: 'bedroom' as const }
      ]

      const conflictType = ruleEngine['getConflictType'](actions)
      expect(conflictType).toBe('none')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty device plans gracefully', () => {
      const result = ruleEngine.mediate([], mockWorld)

      expect(result.actions).toHaveLength(0)
      expect(result.conflicts).toHaveLength(0)
      expect(result.logs).toBeDefined()
    })

    it('should handle non-existent devices in plans', () => {
      const devicePlans = [
        {
          deviceId: 'non_existent_device',
          plan: {
            messages_to: [],
            actions: [{ name: 'do_something', args: {} }],
            explain: 'Testing non-existent device'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, mockWorld)

      // Should not crash and should handle gracefully
      expect(result.actions).toHaveLength(0)
    })

    it('should handle unknown predicates without crashing', () => {
      const customRulePack = {
        ...createSafetyRulePack(),
        rules: [{
          id: 'test_unknown_predicate',
          scope: 'world' as const,
          priority: 0.5,
          hard: false,
          if: { unknown_predicate: 'test_value' },
          then: { target: 'temperature', delta: 0 },
          explain: 'Test rule with unknown predicate'
        }]
      }

      expect(() => {
        ruleEngine.loadRulePacks([customRulePack])
        ruleEngine.evaluateRules(mockWorld, {
          timeSec: 0,
          season: 'spring',
          timeOfDay: 'morning'
        })
      }).not.toThrow()

      expect(console.warn).toHaveBeenCalledWith('Unknown predicate: unknown_predicate')
    })
  })
})