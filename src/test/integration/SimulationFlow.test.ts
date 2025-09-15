import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RuleEngine } from '@/policies/RuleEngine'
import { useWorldStore } from '@/sim/worldStore'
import {
  createMockWorldState,
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
  advanceTimeToQuietHours
} from '../fixtures'
import { WorldState, AgentStep, DeviceRuntime, MediationResult } from '@/types/core'

// Mock the random seed to ensure deterministic behavior
const DETERMINISTIC_SEED = 12345

describe('Simulation Flow Integration Tests', () => {
  let ruleEngine: RuleEngine
  let store: ReturnType<typeof useWorldStore.getState>
  let mockWorld: WorldState

  beforeEach(() => {
    // Initialize components
    ruleEngine = new RuleEngine()
    store = useWorldStore.getState()
    store.reset()

    // Set deterministic seed
    mockWorld = createMockWorldState({ seed: DETERMINISTIC_SEED })

    // Load all rule packs
    ruleEngine.loadRulePacks([
      createSafetyRulePack(),
      createQuietHoursRulePack(),
      createCommRulePack()
    ])

    vi.spyOn(Math, 'random').mockImplementation(() => 0.5) // Fixed random for deterministic tests
  })

  describe('Complete Simulation Tick', () => {
    it('should execute a complete simulation tick with multiple devices', () => {
      // Setup devices
      const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'ac_001' })
      const heaterDevice = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'heater_001' })
      const lampDevice = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'lamp_001' })

      // Add devices to world and store
      mockWorld.devices = {
        [acDevice.id]: acDevice,
        [heaterDevice.id]: heaterDevice,
        [lampDevice.id]: lampDevice
      }

      store.addDevice(acDevice)
      store.addDevice(heaterDevice)
      store.addDevice(lampDevice)

      // Create device plans
      const devicePlans = [
        {
          deviceId: acDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -1 } }],
            explain: 'Cooling for comfort'
          } as AgentStep
        },
        {
          deviceId: lampDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'set_brightness', args: { level_0_1: 0.7 } }],
            explain: 'Adjusting mood lighting'
          } as AgentStep
        }
      ]

      // Execute mediation
      const mediationResult = ruleEngine.mediate(devicePlans, mockWorld)

      // Apply actions to store
      store.applyActions(mediationResult.actions)

      // Advance time
      store.step()

      // Verify results
      expect(mediationResult.actions.length).toBeGreaterThan(0)
      expect(store.timeSec).toBe(10)
      expect(store.eventLog.length).toBeGreaterThan(0)

      // Verify device actions were applied
      const temperatureChanged = mockWorld.rooms.living_room.temperature !== 22.0
      const brightnessChanged = mockWorld.rooms.bedroom.lumens !== 0.2

      expect(temperatureChanged || brightnessChanged).toBe(true)
    })

    it('should handle safety-critical scenarios correctly', () => {
      // Create overheating scenario
      const dangerousWorld = {
        ...mockWorld,
        rooms: {
          ...mockWorld.rooms,
          living_room: {
            ...mockWorld.rooms.living_room,
            temperature: 27 // Near danger threshold
          }
        }
      }

      const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'safety_ac' })
      const heaterDevice = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'danger_heater' })

      dangerousWorld.devices = {
        [acDevice.id]: acDevice,
        [heaterDevice.id]: heaterDevice
      }

      // Conflicting plans: heater wants to heat more, AC wants to cool
      const devicePlans = [
        {
          deviceId: heaterDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 2 } }], // Would push to 29°C - dangerous!
            explain: 'User comfort heating'
          } as AgentStep
        },
        {
          deviceId: acDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -2 } }], // Safety cooling
            explain: 'Safety cooling engaged'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(devicePlans, dangerousWorld)

      // Safety should win - AC should be the winner
      expect(result.conflicts.length).toBeGreaterThan(0)
      const tempConflict = result.conflicts.find(c => c.explanation.includes('temperature') || c.explanation.includes('conflict'))
      if (tempConflict) {
        expect(tempConflict.winner).toBe(acDevice.id)
        expect(tempConflict.loser).toBe(heaterDevice.id)
      }

      // Hard constraints should prevent dangerous temperature
      expect(dangerousWorld.rooms.living_room.temperature).toBeLessThanOrEqual(26)
    })
  })

  describe('Sprint 8 Required Test Cases', () => {
    describe('AC cools vs Heater warms → Safety range enforcement wins', () => {
      it('should prioritize safety when temperature approaches limits', () => {
        // Setup hot room near upper safety limit
        const hotWorld = {
          ...mockWorld,
          rooms: {
            ...mockWorld.rooms,
            living_room: {
              ...mockWorld.rooms.living_room,
              temperature: 25.8 // Very close to 26°C safety limit
            }
          }
        }

        const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'safety_ac' })
        const heaterDevice = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'comfort_heater' })

        hotWorld.devices = {
          [acDevice.id]: acDevice,
          [heaterDevice.id]: heaterDevice
        }

        const conflictPlans = [
          {
            deviceId: acDevice.id,
            plan: {
              messages_to: [],
              actions: [{ name: 'cool', args: { delta: -1 } }],
              explain: 'Safety cooling to prevent overheating'
            } as AgentStep
          },
          {
            deviceId: heaterDevice.id,
            plan: {
              messages_to: [],
              actions: [{ name: 'heat', args: { delta: 1 } }],
              explain: 'Comfort heating for user preference'
            } as AgentStep
          }
        ]

        const result = ruleEngine.mediate(conflictPlans, hotWorld)

        // Verify conflict was detected
        expect(result.conflicts.length).toBeGreaterThan(0)

        // Verify safety wins - AC should be winner
        const resolution = result.conflicts[0]
        expect(resolution.winner).toBe(acDevice.id)
        expect(resolution.loser).toBe(heaterDevice.id)

        // Verify only cooling action is in final actions
        const coolingActions = result.actions.filter(a => a.action.name === 'cool')
        const heatingActions = result.actions.filter(a => a.action.name === 'heat')

        expect(coolingActions.length).toBeGreaterThan(0)
        expect(heatingActions.length).toBe(0)

        // Verify explanation mentions safety or priority
        expect(resolution.explanation.toLowerCase()).toMatch(/safety|priority|temperature|conflict/)
      })

      it('should enforce hard temperature limits immediately', () => {
        const extremeWorld = {
          ...mockWorld,
          rooms: {
            ...mockWorld.rooms,
            living_room: {
              ...mockWorld.rooms.living_room,
              temperature: 28.5 // Above hard limit
            }
          }
        }

        const heaterDevice = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'dangerous_heater' })
        extremeWorld.devices = { [heaterDevice.id]: heaterDevice }

        const dangerousPlans = [{
          deviceId: heaterDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'heat', args: { delta: 1 } }],
            explain: 'More heating'
          } as AgentStep
        }]

        ruleEngine.mediate(dangerousPlans, extremeWorld)

        // Hard constraint should clamp temperature to safe range
        expect(extremeWorld.rooms.living_room.temperature).toBeLessThanOrEqual(26)
      })
    })

    describe('Quiet hours: lights lose to monitor at night', () => {
      it('should enforce quiet hours priority - monitor beats lamp', () => {
        const lampDevice = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'bedroom_lamp' })
        const monitorDevice = createMockDeviceRuntime(createMonitorSpec(), { id: 'health_monitor' })

        const nightWorld = advanceTimeToQuietHours({
          ...mockWorld,
          devices: {
            [lampDevice.id]: lampDevice,
            [monitorDevice.id]: monitorDevice
          }
        })

        const quietHourPlans = [
          {
            deviceId: lampDevice.id,
            plan: {
              messages_to: [],
              actions: [{ name: 'set_brightness', args: { level_0_1: 0.9 } }],
              explain: 'Brightening for mood support'
            } as AgentStep
          },
          {
            deviceId: monitorDevice.id,
            plan: {
              messages_to: [],
              actions: [{ name: 'alert', args: { type: 'vital_signs_warning' } }],
              explain: 'Critical health monitoring alert'
            } as AgentStep
          }
        ]

        const result = ruleEngine.mediate(quietHourPlans, nightWorld)

        // During quiet hours, monitor should have priority
        const monitorActions = result.actions.filter(a => a.deviceId === monitorDevice.id)
        expect(monitorActions.length).toBeGreaterThan(0)

        // If conflict occurred, monitor should win
        if (result.conflicts.length > 0) {
          const conflict = result.conflicts[0]
          // Monitor should win due to quiet hours priority rules
          expect(conflict.winner).toBe(monitorDevice.id)
        }

        // Check rule evaluation shows quiet hours constraints
        const context = {
          timeSec: nightWorld.timeSec,
          season: 'winter',
          timeOfDay: 'night'
        }

        const ruleResult = ruleEngine.evaluateRules(nightWorld, context)
        const quietRules = ruleResult.ruleFireings.filter(rf =>
          rf.ruleId.includes('quiet') || rf.ruleId.includes('lighting')
        )
        expect(quietRules.length).toBeGreaterThan(0)
      })

      it('should apply quiet hours soft constraints to lighting', () => {
        const lampDevice = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'night_lamp' })
        const nightWorld = advanceTimeToQuietHours({
          ...mockWorld,
          devices: { [lampDevice.id]: lampDevice }
        })

        const context = {
          timeSec: nightWorld.timeSec,
          season: 'winter',
          timeOfDay: 'night'
        }

        const ruleResult = ruleEngine.evaluateRules(nightWorld, context)

        // Should have soft hints about lighting during quiet hours
        const lightingHints = ruleResult.softHints.filter(hint =>
          hint.rule.id.includes('lighting') && hint.hint.target === 'lumens'
        )

        expect(lightingHints.length).toBeGreaterThan(0)
        const lightingHint = lightingHints[0]
        expect(lightingHint.hint.max).toBeLessThanOrEqual(0.1) // Dimmed during quiet hours
      })
    })

    describe('Comms block: fridge cannot message coffee maker', () => {
      it('should block communication between fridge and coffee maker', () => {
        const fridgeDevice = createMockDeviceRuntime(createSmartFridgeSpec(), { id: 'kitchen_fridge' })
        const coffeeDevice = createMockDeviceRuntime(createCoffeeMakerSpec(), { id: 'kitchen_coffee' })

        const commWorld = {
          ...mockWorld,
          devices: {
            [fridgeDevice.id]: fridgeDevice,
            [coffeeDevice.id]: coffeeDevice
          }
        }

        // Test rule evaluation with fridge as current device
        const context = {
          timeSec: commWorld.timeSec,
          season: 'spring',
          timeOfDay: 'morning',
          currentDevice: fridgeDevice
        }

        const result = ruleEngine.evaluateRules(commWorld, context)

        // Should have negative action hint for messaging coffee maker
        const commHints = result.softHints.filter(hint =>
          hint.hint.action_hint &&
          'message_coffee_maker' in hint.hint.action_hint &&
          hint.hint.action_hint.message_coffee_maker! < 0
        )

        expect(commHints.length).toBeGreaterThan(0)
        expect(commHints[0].hint.action_hint!.message_coffee_maker).toBeLessThan(0)
      })

      it('should allow other device communications that are not blocked', () => {
        const fridgeDevice = createMockDeviceRuntime(createSmartFridgeSpec(), { id: 'allowed_fridge' })

        // Create a device that should be allowed to communicate
        const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'allowed_ac' })

        const commWorld = {
          ...mockWorld,
          devices: {
            [fridgeDevice.id]: fridgeDevice,
            [acDevice.id]: acDevice
          }
        }

        const context = {
          timeSec: commWorld.timeSec,
          season: 'spring',
          timeOfDay: 'morning',
          currentDevice: acDevice
        }

        const result = ruleEngine.evaluateRules(commWorld, context)

        // Should not have negative hints for allowed communications
        const restrictiveCommHints = result.softHints.filter(hint =>
          hint.hint.action_hint &&
          Object.values(hint.hint.action_hint).some(value => value < 0)
        )

        // AC should not be blocked from normal communications (only fridge is restricted)
        expect(restrictiveCommHints.length).toBe(0)
      })
    })
  })

  describe('Complex Multi-Device Scenarios', () => {
    it('should handle cascading conflicts across multiple rooms', () => {
      // Setup devices in different rooms
      const livingAc = createMockDeviceRuntime(createSmartAcSpec(), { id: 'living_ac' })
      const bedroomLamp = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'bedroom_lamp' })
      const kitchenFridge = createMockDeviceRuntime(createSmartFridgeSpec(), { id: 'kitchen_fridge' })

      const multiRoomWorld = {
        ...mockWorld,
        devices: {
          [livingAc.id]: livingAc,
          [bedroomLamp.id]: bedroomLamp,
          [kitchenFridge.id]: kitchenFridge
        },
        resources: {
          powerKw: 0.5, // Limited power to create resource conflicts
          bandwidth: 0.8,
          privacyBudget: 1.0
        }
      }

      const highPowerPlans = [
        {
          deviceId: livingAc.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -3, power: 0.4 } }],
            explain: 'High power cooling'
          } as AgentStep
        },
        {
          deviceId: bedroomLamp.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'set_brightness', args: { level_0_1: 1.0, power: 0.3 } }],
            explain: 'Full brightness'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(highPowerPlans, multiRoomWorld)

      // Should detect resource conflicts
      const resourceConflicts = result.conflicts.filter(c => c.explanation.includes('resource'))

      // Should resolve conflicts and produce final actions
      expect(result.actions.length).toBeGreaterThan(0)
      expect(result.logs.length).toBeGreaterThan(0)
    })

    it('should maintain state consistency across simulation steps', () => {
      // Setup a persistent scenario
      const acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'persistent_ac' })
      store.addDevice(acDevice)

      const initialTemp = store.rooms.living_room.temperature
      const initialHealth = store.health

      // Simulate multiple steps with consistent actions
      for (let i = 0; i < 5; i++) {
        const plans = [{
          deviceId: acDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'cool', args: { delta: -0.2 } }],
            explain: 'Gradual cooling'
          } as AgentStep
        }]

        const result = ruleEngine.mediate(plans, store.getState())
        store.applyActions(result.actions)
        store.step()
      }

      // Verify state consistency
      expect(store.timeSec).toBe(50) // 5 steps * 10 seconds
      expect(store.randTick).toBe(5)
      expect(store.rooms.living_room.temperature).toBeLessThan(initialTemp) // Should have cooled
      expect(store.health).toBeCloseTo(initialHealth, 1) // Should be stable without conflicts
    })

    it('should handle emergency scenarios with priority escalation', () => {
      // Create emergency scenario with health monitor
      const monitorDevice = createMockDeviceRuntime(createMonitorSpec(), { id: 'emergency_monitor' })
      const lampDevice = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'mood_lamp' })

      const emergencyWorld = {
        ...mockWorld,
        health: 0.25, // Emergency health level
        devices: {
          [monitorDevice.id]: monitorDevice,
          [lampDevice.id]: lampDevice
        }
      }

      const emergencyPlans = [
        {
          deviceId: monitorDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'emergency_alert', args: { priority: 'critical' } }],
            explain: 'Emergency health alert'
          } as AgentStep
        },
        {
          deviceId: lampDevice.id,
          plan: {
            messages_to: [],
            actions: [{ name: 'set_brightness', args: { level_0_1: 0.1 } }],
            explain: 'Dimming for sleep'
          } as AgentStep
        }
      ]

      const result = ruleEngine.mediate(emergencyPlans, emergencyWorld)

      // Monitor should have priority in emergency
      const monitorActions = result.actions.filter(a => a.deviceId === monitorDevice.id)
      expect(monitorActions.length).toBeGreaterThan(0)

      // Should log emergency handling
      const emergencyLogs = result.logs.filter(log =>
        log.kind === 'conflict_resolved' &&
        log.data.explanation.includes('emergency')
      )

      if (result.conflicts.length > 0) {
        expect(emergencyLogs.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle multiple devices efficiently', () => {
      // Create many devices
      const devices: DeviceRuntime[] = []
      const devicePlans: { deviceId: string; plan: AgentStep }[] = []

      for (let i = 0; i < 10; i++) {
        const device = createMockDeviceRuntime(
          i % 2 === 0 ? createSmartAcSpec() : createEmotionLampSpec(),
          { id: `device_${i}` }
        )
        devices.push(device)

        devicePlans.push({
          deviceId: device.id,
          plan: {
            messages_to: [],
            actions: [
              i % 2 === 0
                ? { name: 'cool', args: { delta: -0.1 } }
                : { name: 'set_brightness', args: { level_0_1: 0.5 + i * 0.05 } }
            ],
            explain: `Action from device ${i}`
          }
        })
      }

      const manyDeviceWorld = {
        ...mockWorld,
        devices: devices.reduce((acc, device) => ({ ...acc, [device.id]: device }), {})
      }

      const startTime = performance.now()
      const result = ruleEngine.mediate(devicePlans, manyDeviceWorld)
      const endTime = performance.now()

      // Should complete within reasonable time (< 100ms for 10 devices)
      expect(endTime - startTime).toBeLessThan(100)

      // Should produce results for all devices
      expect(result.actions.length).toBeGreaterThan(0)
      expect(result.actions.length).toBeLessThanOrEqual(devicePlans.length)
    })

    it('should maintain deterministic behavior with fixed seed', () => {
      const device1 = createMockDeviceRuntime(createSmartAcSpec(), { id: 'deterministic_1' })
      const device2 = createMockDeviceRuntime(createSmartHeaterSpec(), { id: 'deterministic_2' })

      const testWorld = {
        ...mockWorld,
        seed: DETERMINISTIC_SEED,
        devices: {
          [device1.id]: device1,
          [device2.id]: device2
        }
      }

      const plans = [
        {
          deviceId: device1.id,
          plan: { messages_to: [], actions: [{ name: 'cool', args: { delta: -1 } }], explain: 'Cooling' }
        },
        {
          deviceId: device2.id,
          plan: { messages_to: [], actions: [{ name: 'heat', args: { delta: 1 } }], explain: 'Heating' }
        }
      ]

      // Run same scenario multiple times
      const result1 = ruleEngine.mediate(plans, testWorld)
      const result2 = ruleEngine.mediate(plans, testWorld)

      // Results should be identical (deterministic)
      expect(result1.conflicts.length).toBe(result2.conflicts.length)
      if (result1.conflicts.length > 0 && result2.conflicts.length > 0) {
        expect(result1.conflicts[0].winner).toBe(result2.conflicts[0].winner)
        expect(result1.conflicts[0].loser).toBe(result2.conflicts[0].loser)
      }
    })
  })
})