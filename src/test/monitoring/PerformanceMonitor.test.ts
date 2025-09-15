import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { PerformanceMonitor } from '@/monitoring/PerformanceMonitor'

// Mock performance.now() for deterministic testing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    }
  },
  writable: true
})

// Mock navigator.connection
Object.defineProperty(global, 'navigator', {
  value: {
    connection: {
      rtt: 50
    }
  },
  writable: true
})

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor
  let currentTime = 0

  beforeEach(() => {
    currentTime = 0
    mockPerformanceNow.mockImplementation(() => currentTime)

    monitor = new PerformanceMonitor()

    // Clear any existing timers
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics()

      expect(metrics.tickRate).toBe(0)
      expect(metrics.averageTickTime).toBe(0)
      expect(metrics.simulationHealth).toBe(1.0)
      expect(metrics.llmRequestCount).toBe(0)
      expect(metrics.fps).toBe(60)
      expect(metrics.startTime).toBe(0)
    })

    it('should initialize with default budgets', () => {
      const budgets = monitor.getBudgets()

      expect(budgets.maxTickTime).toBe(500)
      expect(budgets.minTickRate).toBe(0.08)
      expect(budgets.maxLlmResponseTime).toBe(3000)
      expect(budgets.maxMemoryUsage).toBe(256)
      expect(budgets.minFps).toBe(30)
    })
  })

  describe('Tick Performance Tracking', () => {
    it('should record tick times correctly', () => {
      const startTime = monitor.recordTickStart()
      expect(startTime).toBe(0)

      currentTime = 100
      monitor.recordTickEnd(startTime)

      const metrics = monitor.getMetrics()
      expect(metrics.lastTickTime).toBe(100)
      expect(metrics.averageTickTime).toBe(100)
    })

    it('should calculate average tick time over multiple ticks', () => {
      const times = [50, 100, 150, 200]

      times.forEach((tickTime, index) => {
        const start = monitor.recordTickStart()
        currentTime += tickTime
        monitor.recordTickEnd(start)
      })

      const metrics = monitor.getMetrics()
      const expectedAverage = times.reduce((a, b) => a + b, 0) / times.length
      expect(metrics.averageTickTime).toBe(expectedAverage)
    })

    it('should maintain tick history window', () => {
      // Record more than 60 ticks to test window limit
      for (let i = 0; i < 65; i++) {
        const start = monitor.recordTickStart()
        currentTime += 50
        monitor.recordTickEnd(start)
      }

      // Should only keep last 60 tick times for average calculation
      const metrics = monitor.getMetrics()
      expect(metrics.averageTickTime).toBe(50) // All ticks were 50ms
    })

    it('should calculate tick rate correctly', () => {
      // Simulate 10 ticks over 10 seconds
      for (let i = 0; i < 10; i++) {
        const start = monitor.recordTickStart()
        currentTime += 1000 // 1 second per tick
        monitor.recordTickEnd(start)
      }

      const metrics = monitor.getMetrics()
      // Should be approximately 1 tick per second
      expect(metrics.tickRate).toBeCloseTo(1, 1)
    })
  })

  describe('LLM Performance Tracking', () => {
    it('should track LLM request queue size', () => {
      const start1 = monitor.recordLlmRequestStart()
      const start2 = monitor.recordLlmRequestStart()

      let metrics = monitor.getMetrics()
      expect(metrics.llmQueueSize).toBe(2)

      currentTime = 1000
      monitor.recordLlmRequestEnd(start1, true)

      metrics = monitor.getMetrics()
      expect(metrics.llmQueueSize).toBe(1)
    })

    it('should calculate average LLM response time', () => {
      const responseTimes = [500, 1000, 1500]

      responseTimes.forEach((responseTime, index) => {
        const start = monitor.recordLlmRequestStart()
        currentTime += responseTime
        monitor.recordLlmRequestEnd(start, true)
      })

      const metrics = monitor.getMetrics()
      const expectedAverage = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      expect(metrics.llmResponseTime).toBe(expectedAverage)
      expect(metrics.llmRequestCount).toBe(3)
    })

    it('should track LLM error rate', () => {
      // Record 10 requests, 3 failures
      for (let i = 0; i < 10; i++) {
        const start = monitor.recordLlmRequestStart()
        currentTime += 500
        const success = i < 7 // First 7 succeed, last 3 fail
        monitor.recordLlmRequestEnd(start, success)
      }

      const metrics = monitor.getMetrics()
      expect(metrics.llmErrorRate).toBe(30) // 30% error rate
    })
  })

  describe('Frame Rate Tracking', () => {
    it('should track frame rate correctly', () => {
      vi.useFakeTimers()

      // Simulate 60 frames over 1 second (60 FPS)
      for (let i = 0; i < 60; i++) {
        currentTime += 16.67 // ~60fps
        monitor.recordFrame()
      }

      // Advance time to trigger FPS calculation
      currentTime += 1000
      vi.advanceTimersByTime(1000)

      const metrics = monitor.getMetrics()
      expect(metrics.fps).toBeCloseTo(60, 0)
    })

    it('should handle variable frame times', () => {
      vi.useFakeTimers()

      const frameTimes = [16, 20, 25, 30, 33] // Variable frame times
      frameTimes.forEach(frameTime => {
        currentTime += frameTime
        monitor.recordFrame()
      })

      currentTime += 1000
      vi.advanceTimersByTime(1000)

      const metrics = monitor.getMetrics()
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      const expectedFps = 1000 / averageFrameTime
      expect(metrics.fps).toBeCloseTo(expectedFps, 0)
    })
  })

  describe('Game Metrics Updates', () => {
    it('should update game-specific metrics', () => {
      monitor.updateGameMetrics(5, 10, 0.75)

      const metrics = monitor.getMetrics()
      expect(metrics.deviceCount).toBe(5)
      expect(metrics.simulationHealth).toBe(0.75)
      expect(metrics.conflictRate).toBeGreaterThan(0) // Should calculate rate based on time
    })

    it('should calculate conflict rate over time', () => {
      currentTime = 60000 // 1 minute
      monitor.updateGameMetrics(3, 30, 0.8) // 30 conflicts in 1 minute

      const metrics = monitor.getMetrics()
      expect(metrics.conflictRate).toBe(30) // 30 conflicts per minute
    })
  })

  describe('Performance Budget Checking', () => {
    it('should emit warnings when tick time exceeds budget', () => {
      const warnings: any[] = []
      monitor.onWarning(warning => warnings.push(warning))

      // Record a slow tick
      const start = monitor.recordTickStart()
      currentTime = 600 // 600ms tick (exceeds 500ms budget)
      monitor.recordTickEnd(start)

      expect(warnings).toHaveLength(1)
      expect(warnings[0].type).toBe('tick_performance')
      expect(warnings[0].severity).toBe('high')
      expect(warnings[0].value).toBe(600)
    })

    it('should emit warnings for slow LLM responses', () => {
      const warnings: any[] = []
      monitor.onWarning(warning => warnings.push(warning))

      const start = monitor.recordLlmRequestStart()
      currentTime = 4000 // 4 second response (exceeds 3 second budget)
      monitor.recordLlmRequestEnd(start, true)

      expect(warnings).toHaveLength(1)
      expect(warnings[0].type).toBe('llm_performance')
      expect(warnings[0].severity).toBe('medium')
    })

    it('should emit warnings for low frame rate', () => {
      vi.useFakeTimers()
      const warnings: any[] = []
      monitor.onWarning(warning => warnings.push(warning))

      // Simulate low frame rate (25 FPS, below 30 FPS budget)
      for (let i = 0; i < 25; i++) {
        currentTime += 40 // 40ms per frame = 25 FPS
        monitor.recordFrame()
      }

      currentTime += 1000
      vi.advanceTimersByTime(1000)

      expect(warnings.length).toBeGreaterThan(0)
      const frameWarning = warnings.find(w => w.type === 'frame_rate')
      expect(frameWarning).toBeDefined()
      expect(frameWarning.severity).toBe('low')
    })
  })

  describe('Observer Pattern', () => {
    it('should notify subscribers of metric updates', () => {
      const updates: any[] = []
      const unsubscribe = monitor.subscribe(metrics => updates.push(metrics))

      vi.useFakeTimers()

      // Trigger metric update
      vi.advanceTimersByTime(1000)

      expect(updates.length).toBeGreaterThan(0)

      unsubscribe()
      const previousLength = updates.length

      // Should not receive more updates after unsubscribing
      vi.advanceTimersByTime(1000)
      expect(updates.length).toBe(previousLength)
    })

    it('should handle multiple subscribers correctly', () => {
      const updates1: any[] = []
      const updates2: any[] = []

      monitor.subscribe(metrics => updates1.push(metrics))
      monitor.subscribe(metrics => updates2.push(metrics))

      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      expect(updates1.length).toBeGreaterThan(0)
      expect(updates2.length).toBeGreaterThan(0)
      expect(updates1.length).toBe(updates2.length)
    })
  })

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', () => {
      // Setup some performance data
      monitor.updateGameMetrics(3, 5, 0.8)

      const start = monitor.recordTickStart()
      currentTime = 200
      monitor.recordTickEnd(start)

      const report = monitor.generateReport()

      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('uptime')
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('budgets')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('recommendations')

      expect(report.summary).toHaveProperty('tickPerformance')
      expect(report.summary).toHaveProperty('llmPerformance')
      expect(report.summary).toHaveProperty('overallHealth')
    })

    it('should provide appropriate recommendations', () => {
      // Create performance issues
      const start1 = monitor.recordTickStart()
      currentTime = 600 // Slow tick
      monitor.recordTickEnd(start1)

      const start2 = monitor.recordLlmRequestStart()
      currentTime += 4000 // Slow LLM response
      monitor.recordLlmRequestEnd(start2, true)

      const report = monitor.generateReport()

      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.recommendations.some(r => r.includes('simulation complexity'))).toBe(true)
      expect(report.recommendations.some(r => r.includes('LLM request'))).toBe(true)
    })

    it('should calculate overall health correctly', () => {
      // Test excellent performance
      const start = monitor.recordTickStart()
      currentTime = 100 // Good tick time
      monitor.recordTickEnd(start)

      vi.useFakeTimers()
      // Good frame rate
      for (let i = 0; i < 60; i++) {
        currentTime += 16.67
        monitor.recordFrame()
      }
      currentTime += 1000
      vi.advanceTimersByTime(1000)

      const report = monitor.generateReport()
      expect(['excellent', 'good']).toContain(report.summary.overallHealth)
    })
  })

  describe('Reset and State Management', () => {
    it('should reset all metrics correctly', () => {
      // Generate some performance data
      monitor.updateGameMetrics(5, 10, 0.5)

      const start = monitor.recordTickStart()
      currentTime = 300
      monitor.recordTickEnd(start)

      monitor.reset()

      const metrics = monitor.getMetrics()
      expect(metrics.tickRate).toBe(0)
      expect(metrics.averageTickTime).toBe(0)
      expect(metrics.deviceCount).toBe(0)
      expect(metrics.llmRequestCount).toBe(0)
      expect(metrics.simulationHealth).toBe(1.0)
    })

    it('should allow budget customization', () => {
      const newBudgets = {
        maxTickTime: 1000,
        minFps: 20
      }

      monitor.updateBudgets(newBudgets)

      const budgets = monitor.getBudgets()
      expect(budgets.maxTickTime).toBe(1000)
      expect(budgets.minFps).toBe(20)
      expect(budgets.maxLlmResponseTime).toBe(3000) // Should keep original values
    })
  })

  describe('Memory and System Monitoring', () => {
    it('should read memory usage from performance API', () => {
      vi.useFakeTimers()

      // Advance time to trigger memory monitoring
      vi.advanceTimersByTime(5000)

      const metrics = monitor.getMetrics()
      expect(metrics.memoryUsage).toBeCloseTo(50, 0) // 50MB from mock
    })

    it('should emit memory warnings when usage is high', () => {
      // Mock high memory usage
      Object.defineProperty(global.performance, 'memory', {
        value: {
          usedJSHeapSize: 300 * 1024 * 1024 // 300MB (above 256MB budget)
        },
        configurable: true
      })

      const warnings: any[] = []
      monitor.onWarning(warning => warnings.push(warning))

      vi.useFakeTimers()
      vi.advanceTimersByTime(5000)

      const memoryWarning = warnings.find(w => w.type === 'memory_usage')
      expect(memoryWarning).toBeDefined()
      expect(memoryWarning.severity).toBe('high')
    })
  })
})