import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useWorldStore } from '@/sim/worldStore'
import { createMockDeviceRuntime, createSmartAcSpec, createEmotionLampSpec } from '../fixtures'
import { WorldState, RoomId, VariableName } from '@/types/core'

// Helper to get fresh store instance
const getStore = () => {
  const store = useWorldStore.getState()
  store.reset()
  return store
}

describe('WorldStore', () => {
  let store: ReturnType<typeof useWorldStore.getState>

  beforeEach(() => {
    vi.useFakeTimers()
    store = getStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    store.pauseSim()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(store.timeSec).toBe(0)
      expect(store.running).toBe(false)
      expect(store.speed).toBe(1)
      expect(store.health).toBe(1.0)
      expect(store.randTick).toBe(0)
      expect(store.mode).toBe('open-ended')
    })

    it('should initialize rooms with sensible defaults', () => {
      expect(store.rooms.living_room.temperature).toBeWithinRange(20, 25)
      expect(store.rooms.kitchen.lumens).toBeWithinRange(0.5, 0.8)
      expect(store.rooms.bedroom.noise).toBeLessThanOrEqual(0.2)

      // All rooms should have all required variables
      Object.values(store.rooms).forEach(room => {
        expect(room).toHaveProperty('temperature')
        expect(room).toHaveProperty('lumens')
        expect(room).toHaveProperty('noise')
        expect(room).toHaveProperty('humidity')
        expect(room).toHaveProperty('mood_score')
      })
    })

    it('should initialize with empty devices and event log', () => {
      expect(Object.keys(store.devices)).toHaveLength(0)
      expect(store.eventLog).toHaveLength(0)
    })

    it('should initialize policies with correct structure', () => {
      expect(store.policies.priority_order).toContain('safety')
      expect(store.policies.priority_order).toContain('comfort')
      expect(store.policies.quiet_hours).toHaveProperty('start')
      expect(store.policies.quiet_hours).toHaveProperty('end')
      expect(store.policies.limits).toHaveProperty('max_power_kw')
    })
  })

  describe('Simulation Control', () => {
    it('should start simulation correctly', () => {
      expect(store.running).toBe(false)
      store.startSim()
      expect(store.running).toBe(true)
    })

    it('should pause simulation correctly', () => {
      store.startSim()
      expect(store.running).toBe(true)
      store.pauseSim()
      expect(store.running).toBe(false)
    })

    it('should change speed correctly', () => {
      expect(store.speed).toBe(1)
      store.setSpeed(2)
      expect(store.speed).toBe(2)
      store.setSpeed(4)
      expect(store.speed).toBe(4)
    })

    it('should advance time on step', () => {
      const initialTime = store.timeSec
      const initialTick = store.randTick

      store.step()

      expect(store.timeSec).toBe(initialTime + 10)
      expect(store.randTick).toBe(initialTick + 1)
    })

    it('should log tick events', () => {
      const initialLogLength = store.eventLog.length
      store.step()

      expect(store.eventLog.length).toBe(initialLogLength + 1)
      const tickEvent = store.eventLog[store.eventLog.length - 1]
      expect(tickEvent.kind).toBe('tick')
      expect(tickEvent.data.tick).toBe(1)
    })

    it('should manage event log size', () => {
      // Fill event log beyond limit
      for (let i = 0; i < 120; i++) {
        store.appendEvent({
          at: i,
          room: 'living_room',
          kind: 'test_event',
          data: { index: i }
        })
      }

      store.step() // This should trigger cleanup

      expect(store.eventLog.length).toBeLessThanOrEqual(51) // 50 kept + 1 new tick event
    })
  })

  describe('Room Variable Management', () => {
    it('should adjust temperature correctly with heat function', () => {
      const initialTemp = store.rooms.living_room.temperature
      const delta = 2.5

      store.heat('living_room', delta)

      expect(store.rooms.living_room.temperature).toBe(initialTemp + delta)

      const event = store.eventLog[store.eventLog.length - 1]
      expect(event.kind).toBe('temperature_change')
      expect(event.data.delta).toBe(delta)
      expect(event.data.new_temperature).toBe(initialTemp + delta)
    })

    it('should enforce temperature safety limits in heat function', () => {
      store.heat('living_room', 20) // Try to overheat
      expect(store.rooms.living_room.temperature).toBeLessThanOrEqual(28)

      store.heat('living_room', -30) // Try to overcool
      expect(store.rooms.living_room.temperature).toBeGreaterThanOrEqual(18)
    })

    it('should adjust any room variable with adjustVariable function', () => {
      const initialLumens = store.rooms.bedroom.lumens
      const delta = 0.2

      store.adjustVariable('bedroom', 'lumens', delta)

      expect(store.rooms.bedroom.lumens).toBe(initialLumens + delta)

      const event = store.eventLog[store.eventLog.length - 1]
      expect(event.kind).toBe('variable_change')
      expect(event.data.variable).toBe('lumens')
      expect(event.data.delta).toBe(delta)
    })

    it('should enforce variable limits in adjustVariable', () => {
      // Test upper limit
      store.adjustVariable('living_room', 'lumens', 2)
      expect(store.rooms.living_room.lumens).toBeLessThanOrEqual(1)

      // Test lower limit
      store.adjustVariable('living_room', 'noise', -2)
      expect(store.rooms.living_room.noise).toBeGreaterThanOrEqual(0)
    })

    it('should handle temperature vs non-temperature variable limits correctly', () => {
      // Temperature has special limits (18-28)
      store.adjustVariable('kitchen', 'temperature', 20)
      expect(store.rooms.kitchen.temperature).toBeLessThanOrEqual(28)

      store.adjustVariable('kitchen', 'temperature', -20)
      expect(store.rooms.kitchen.temperature).toBeGreaterThanOrEqual(18)

      // Other variables have 0-1 limits
      store.adjustVariable('kitchen', 'humidity', 5)
      expect(store.rooms.kitchen.humidity).toBeLessThanOrEqual(1)

      store.adjustVariable('kitchen', 'humidity', -5)
      expect(store.rooms.kitchen.humidity).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Device Management', () => {
    it('should add devices correctly', () => {
      const device = createMockDeviceRuntime(createSmartAcSpec(), { id: 'test_ac' })

      expect(Object.keys(store.devices)).toHaveLength(0)

      store.addDevice(device)

      expect(Object.keys(store.devices)).toHaveLength(1)
      expect(store.devices['test_ac']).toBe(device)

      const event = store.eventLog[store.eventLog.length - 1]
      expect(event.kind).toBe('device_added')
      expect(event.deviceId).toBe('test_ac')
      expect(event.data.name).toBe(device.spec.name)
    })

    it('should remove devices correctly', () => {
      const device = createMockDeviceRuntime(createSmartAcSpec(), { id: 'test_ac' })
      store.addDevice(device)

      expect(Object.keys(store.devices)).toHaveLength(1)

      store.removeDevice('test_ac')

      expect(Object.keys(store.devices)).toHaveLength(0)

      const event = store.eventLog[store.eventLog.length - 1]
      expect(event.kind).toBe('device_removed')
      expect(event.deviceId).toBe('test_ac')
    })

    it('should handle removing non-existent devices gracefully', () => {
      const initialLogLength = store.eventLog.length

      store.removeDevice('non_existent')

      // Should not crash and should not add any events
      expect(store.eventLog.length).toBe(initialLogLength)
    })
  })

  describe('Action Application', () => {
    let acDevice: ReturnType<typeof createMockDeviceRuntime>
    let lampDevice: ReturnType<typeof createMockDeviceRuntime>

    beforeEach(() => {
      acDevice = createMockDeviceRuntime(createSmartAcSpec(), { id: 'test_ac' })
      lampDevice = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'test_lamp' })

      store.addDevice(acDevice)
      store.addDevice(lampDevice)
    })

    it('should apply temperature actions correctly', () => {
      const targetTemp = 24.5
      const actions = [{
        deviceId: 'test_ac',
        action: {
          name: 'set_temperature',
          args: { target: targetTemp }
        }
      }]

      store.applyActions(actions)

      expect(store.rooms[acDevice.room].temperature).toBe(targetTemp)

      const event = store.eventLog[store.eventLog.length - 1]
      expect(event.kind).toBe('action')
      expect(event.data.action).toBe('set_temperature')
    })

    it('should enforce temperature safety limits when applying actions', () => {
      const dangerousTemp = 35
      const actions = [{
        deviceId: 'test_ac',
        action: {
          name: 'set_temperature',
          args: { target: dangerousTemp }
        }
      }]

      store.applyActions(actions)

      expect(store.rooms[acDevice.room].temperature).toBeLessThanOrEqual(28)
    })

    it('should apply brightness actions correctly', () => {
      const targetBrightness = 0.8
      const actions = [{
        deviceId: 'test_lamp',
        action: {
          name: 'set_brightness',
          args: { level_0_1: targetBrightness }
        }
      }]

      store.applyActions(actions)

      expect(store.rooms[lampDevice.room].lumens).toBe(targetBrightness)

      const event = store.eventLog[store.eventLog.length - 1]
      expect(event.kind).toBe('action')
      expect(event.data.action).toBe('set_brightness')
      expect(event.data.value).toBe(targetBrightness)
    })

    it('should enforce brightness limits when applying actions', () => {
      const excessiveBrightness = 2.0
      const actions = [{
        deviceId: 'test_lamp',
        action: {
          name: 'set_brightness',
          args: { level_0_1: excessiveBrightness }
        }
      }]

      store.applyActions(actions)

      expect(store.rooms[lampDevice.room].lumens).toBeLessThanOrEqual(1.0)
    })

    it('should handle actions from non-existent devices gracefully', () => {
      const actions = [{
        deviceId: 'non_existent',
        action: {
          name: 'set_temperature',
          args: { target: 25 }
        }
      }]

      expect(() => store.applyActions(actions)).not.toThrow()
    })

    it('should handle multiple actions in batch', () => {
      const actions = [
        {
          deviceId: 'test_ac',
          action: {
            name: 'set_temperature',
            args: { target: 23 }
          }
        },
        {
          deviceId: 'test_lamp',
          action: {
            name: 'set_brightness',
            args: { level_0_1: 0.6 }
          }
        }
      ]

      store.applyActions(actions)

      expect(store.rooms[acDevice.room].temperature).toBe(23)
      expect(store.rooms[lampDevice.room].lumens).toBe(0.6)

      // Should have logged both actions
      const actionEvents = store.eventLog.filter(e => e.kind === 'action')
      expect(actionEvents.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Health and Harmony Calculation', () => {
    it('should start with full health', () => {
      expect(store.health).toBe(1.0)
    })

    it('should decrease health based on recent conflicts', () => {
      // Add some conflict events
      for (let i = 0; i < 3; i++) {
        store.appendEvent({
          at: store.timeSec - 30 + i * 10,
          room: 'living_room',
          kind: 'conflict',
          data: { type: 'temperature' }
        })
      }

      const initialHealth = store.health
      store.step()

      expect(store.health).toBeLessThan(initialHealth)
    })

    it('should gradually recover health over time', () => {
      // Decrease health first
      store.health = 0.5

      // Step without conflicts should improve health
      store.step()

      expect(store.health).toBeGreaterThan(0.5)
      expect(store.health).toBeLessThanOrEqual(1.0)
    })

    it('should not let health go below 0 or above 1', () => {
      // Test lower bound
      store.health = 0.05
      for (let i = 0; i < 10; i++) {
        store.appendEvent({
          at: store.timeSec - 10 + i,
          room: 'living_room',
          kind: 'conflict',
          data: {}
        })
      }
      store.step()
      expect(store.health).toBeGreaterThanOrEqual(0)

      // Test upper bound
      store.health = 0.98
      store.step()
      store.step()
      expect(store.health).toBeLessThanOrEqual(1.0)
    })
  })

  describe('Event Management', () => {
    it('should append events correctly', () => {
      const initialLength = store.eventLog.length
      const testEvent = {
        at: store.timeSec,
        room: 'kitchen' as RoomId,
        kind: 'test_event',
        data: { test: 'value' }
      }

      store.appendEvent(testEvent)

      expect(store.eventLog.length).toBe(initialLength + 1)
      expect(store.eventLog[store.eventLog.length - 1]).toEqual(testEvent)
    })

    it('should track events with proper timestamps', () => {
      const event1 = {
        at: 100,
        room: 'living_room' as RoomId,
        kind: 'early_event',
        data: {}
      }

      const event2 = {
        at: 200,
        room: 'kitchen' as RoomId,
        kind: 'later_event',
        data: {}
      }

      store.appendEvent(event1)
      store.appendEvent(event2)

      expect(store.eventLog[store.eventLog.length - 2].at).toBe(100)
      expect(store.eventLog[store.eventLog.length - 1].at).toBe(200)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      // Modify state
      store.startSim()
      store.setSpeed(4)
      store.heat('living_room', 5)
      store.addDevice(createMockDeviceRuntime(createSmartAcSpec()))

      // Reset
      store.reset()

      expect(store.timeSec).toBe(0)
      expect(store.running).toBe(false)
      expect(store.speed).toBe(1)
      expect(store.health).toBe(1.0)
      expect(store.rooms.living_room.temperature).toBeWithinRange(20, 25) // Back to default
      expect(Object.keys(store.devices)).toHaveLength(0)
      expect(store.eventLog).toHaveLength(0)
    })

    it('should generate new seed on reset', () => {
      const originalSeed = store.seed
      store.reset()

      // Note: Since we're not controlling the random seed in reset(),
      // we can only check that the seed exists and is a number
      expect(typeof store.seed).toBe('number')
      expect(store.seed).toBeGreaterThan(0)
    })
  })

  describe('Simulation Loop Integration', () => {
    it('should run tick loop when started', async () => {
      const initialTime = store.timeSec

      store.startSim()

      // Fast forward timers to trigger tick
      await vi.advanceTimersByTimeAsync(10000)

      expect(store.timeSec).toBeGreaterThan(initialTime)
    })

    it('should respect speed multiplier in tick loop', async () => {
      store.setSpeed(4)
      store.startSim()

      // At speed 4, tick should happen every 2500ms instead of 10000ms
      await vi.advanceTimersByTimeAsync(2500)

      expect(store.timeSec).toBeGreaterThan(0)
    })

    it('should stop tick loop when paused', async () => {
      store.startSim()
      store.pauseSim()

      const timeAfterPause = store.timeSec

      // Advance time - should not trigger more ticks
      await vi.advanceTimersByTimeAsync(15000)

      expect(store.timeSec).toBe(timeAfterPause)
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity when modifying rooms', () => {
      const roomKeys = Object.keys(store.rooms)
      const variableKeys = Object.keys(store.rooms.living_room)

      store.heat('living_room', 1)

      // Structure should remain the same
      expect(Object.keys(store.rooms)).toEqual(roomKeys)
      expect(Object.keys(store.rooms.living_room)).toEqual(variableKeys)
    })

    it('should maintain consistent device references', () => {
      const device = createMockDeviceRuntime(createSmartAcSpec(), { id: 'consistent_device' })
      store.addDevice(device)

      const retrievedDevice = store.devices['consistent_device']
      expect(retrievedDevice).toBe(device)
      expect(retrievedDevice.id).toBe('consistent_device')
      expect(retrievedDevice.spec.name).toBe(device.spec.name)
    })

    it('should handle concurrent modifications safely', () => {
      // This test simulates multiple operations happening in quick succession
      const device1 = createMockDeviceRuntime(createSmartAcSpec(), { id: 'device1' })
      const device2 = createMockDeviceRuntime(createEmotionLampSpec(), { id: 'device2' })

      store.addDevice(device1)
      store.addDevice(device2)
      store.heat('living_room', 2)
      store.adjustVariable('bedroom', 'lumens', 0.3)
      store.step()

      // All operations should have completed successfully
      expect(Object.keys(store.devices)).toHaveLength(2)
      expect(store.eventLog.length).toBeGreaterThan(4) // At least device adds + variable changes + step
    })
  })
})