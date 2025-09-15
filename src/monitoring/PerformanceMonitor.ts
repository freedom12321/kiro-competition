/**
 * Performance Monitoring and Telemetry System
 *
 * Implements real-time performance metrics tracking:
 * - Simulation tick rates and timing
 * - LLM response latencies
 * - Memory and CPU usage indicators
 * - Resource utilization monitoring
 * - Visual overlay with real-time metrics
 */

export interface PerformanceMetrics {
  // Simulation Performance
  tickRate: number // Ticks per second
  averageTickTime: number // Average tick execution time in ms
  lastTickTime: number // Most recent tick time in ms
  simulationHealth: number // 0-1 health score

  // LLM Performance
  llmResponseTime: number // Average LLM response time in ms
  llmRequestCount: number // Total LLM requests made
  llmErrorRate: number // Percentage of failed LLM requests
  llmQueueSize: number // Pending LLM requests

  // System Resources
  memoryUsage: number // Estimated memory usage in MB
  cpuUsage: number // Estimated CPU usage percentage
  networkLatency: number // Network request latency in ms

  // Game Performance
  fps: number // Rendering frame rate
  deviceCount: number // Number of active devices
  conflictRate: number // Conflicts per minute

  // Timestamps
  lastUpdate: number
  startTime: number
}

export interface PerformanceBudgets {
  maxTickTime: number // Maximum acceptable tick time (ms)
  minTickRate: number // Minimum acceptable tick rate (tps)
  maxLlmResponseTime: number // Maximum acceptable LLM response (ms)
  maxMemoryUsage: number // Maximum memory usage (MB)
  minFps: number // Minimum acceptable FPS
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private budgets: PerformanceBudgets
  private tickTimes: number[] = []
  private llmTimes: number[] = []
  private frameTimeHistory: number[] = []
  private observers: ((metrics: PerformanceMetrics) => void)[] = []
  private warningCallbacks: ((warning: PerformanceWarning) => void)[] = []

  // Performance tracking
  private lastFrameTime = 0
  private frameCount = 0
  private lastFpsUpdate = 0

  constructor() {
    this.metrics = this.initializeMetrics()
    this.budgets = this.getDefaultBudgets()

    this.startMonitoring()
  }

  private initializeMetrics(): PerformanceMetrics {
    const now = performance.now()
    return {
      tickRate: 0,
      averageTickTime: 0,
      lastTickTime: 0,
      simulationHealth: 1.0,
      llmResponseTime: 0,
      llmRequestCount: 0,
      llmErrorRate: 0,
      llmQueueSize: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      fps: 60,
      deviceCount: 0,
      conflictRate: 0,
      lastUpdate: now,
      startTime: now
    }
  }

  private getDefaultBudgets(): PerformanceBudgets {
    return {
      maxTickTime: 500, // 500ms max per tick
      minTickRate: 0.08, // At least 1 tick per 12.5 seconds
      maxLlmResponseTime: 3000, // 3 seconds max LLM response
      maxMemoryUsage: 256, // 256MB max memory
      minFps: 30 // 30 FPS minimum
    }
  }

  private startMonitoring(): void {
    // Start performance observation
    this.observeMemoryUsage()
    this.observeNetworkPerformance()

    // Update metrics periodically
    setInterval(() => this.updateMetrics(), 1000)
  }

  // Simulation Performance Tracking
  public recordTickStart(): number {
    return performance.now()
  }

  public recordTickEnd(startTime: number): void {
    const tickTime = performance.now() - startTime

    this.tickTimes.push(tickTime)
    if (this.tickTimes.length > 60) { // Keep last 60 ticks
      this.tickTimes.shift()
    }

    this.metrics.lastTickTime = tickTime
    this.metrics.averageTickTime = this.tickTimes.reduce((a, b) => a + b, 0) / this.tickTimes.length

    // Calculate tick rate (ticks per second over last minute)
    const now = performance.now()
    const timeWindow = 60000 // 60 seconds
    const recentTicks = this.tickTimes.length
    const timeSinceStart = now - this.metrics.startTime
    this.metrics.tickRate = recentTicks / Math.min(timeSinceStart, timeWindow) * 1000

    // Check performance budgets
    this.checkTickPerformance(tickTime)
  }

  // LLM Performance Tracking
  public recordLlmRequestStart(): number {
    this.metrics.llmQueueSize++
    return performance.now()
  }

  public recordLlmRequestEnd(startTime: number, success: boolean = true): void {
    const responseTime = performance.now() - startTime

    this.llmTimes.push(responseTime)
    if (this.llmTimes.length > 100) { // Keep last 100 requests
      this.llmTimes.shift()
    }

    this.metrics.llmRequestCount++
    this.metrics.llmQueueSize = Math.max(0, this.metrics.llmQueueSize - 1)
    this.metrics.llmResponseTime = this.llmTimes.reduce((a, b) => a + b, 0) / this.llmTimes.length

    // Update error rate
    if (!success) {
      const errorCount = this.llmTimes.filter((_, i) => i >= this.llmTimes.length - 100).length
      this.metrics.llmErrorRate = (errorCount / Math.min(100, this.metrics.llmRequestCount)) * 100
    }

    // Check LLM performance
    this.checkLlmPerformance(responseTime)
  }

  // Frame Rate Tracking
  public recordFrame(): void {
    const now = performance.now()

    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime
      this.frameTimeHistory.push(frameTime)

      if (this.frameTimeHistory.length > 60) {
        this.frameTimeHistory.shift()
      }
    }

    this.frameCount++
    this.lastFrameTime = now

    // Update FPS every second
    if (now - this.lastFpsUpdate >= 1000) {
      const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
      this.metrics.fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 60
      this.lastFpsUpdate = now

      this.checkFramePerformance()
    }
  }

  // System Resource Monitoring
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory
        if (memInfo) {
          this.metrics.memoryUsage = memInfo.usedJSHeapSize / 1024 / 1024 // Convert to MB
          this.checkMemoryUsage()
        }
      }, 5000)
    }
  }

  private observeNetworkPerformance(): void {
    // Monitor network performance using navigation timing
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        this.metrics.networkLatency = connection.rtt || 0
      }
    }
  }

  // Game-Specific Metrics
  public updateGameMetrics(deviceCount: number, conflictCount: number, simulationHealth: number): void {
    this.metrics.deviceCount = deviceCount
    this.metrics.simulationHealth = simulationHealth

    // Calculate conflict rate (conflicts per minute)
    const timeElapsed = (performance.now() - this.metrics.startTime) / 60000 // minutes
    this.metrics.conflictRate = timeElapsed > 0 ? conflictCount / timeElapsed : 0
  }

  // Performance Budget Checking
  private checkTickPerformance(tickTime: number): void {
    if (tickTime > this.budgets.maxTickTime) {
      this.emitWarning({
        type: 'tick_performance',
        severity: 'high',
        message: `Tick time ${tickTime.toFixed(2)}ms exceeds budget of ${this.budgets.maxTickTime}ms`,
        value: tickTime,
        budget: this.budgets.maxTickTime
      })
    }

    if (this.metrics.tickRate < this.budgets.minTickRate) {
      this.emitWarning({
        type: 'tick_rate',
        severity: 'medium',
        message: `Tick rate ${this.metrics.tickRate.toFixed(3)} tps below minimum ${this.budgets.minTickRate} tps`,
        value: this.metrics.tickRate,
        budget: this.budgets.minTickRate
      })
    }
  }

  private checkLlmPerformance(responseTime: number): void {
    if (responseTime > this.budgets.maxLlmResponseTime) {
      this.emitWarning({
        type: 'llm_performance',
        severity: 'medium',
        message: `LLM response time ${responseTime.toFixed(2)}ms exceeds budget of ${this.budgets.maxLlmResponseTime}ms`,
        value: responseTime,
        budget: this.budgets.maxLlmResponseTime
      })
    }
  }

  private checkFramePerformance(): void {
    if (this.metrics.fps < this.budgets.minFps) {
      this.emitWarning({
        type: 'frame_rate',
        severity: 'low',
        message: `FPS ${this.metrics.fps.toFixed(1)} below minimum ${this.budgets.minFps}`,
        value: this.metrics.fps,
        budget: this.budgets.minFps
      })
    }
  }

  private checkMemoryUsage(): void {
    if (this.metrics.memoryUsage > this.budgets.maxMemoryUsage) {
      this.emitWarning({
        type: 'memory_usage',
        severity: 'high',
        message: `Memory usage ${this.metrics.memoryUsage.toFixed(1)}MB exceeds budget of ${this.budgets.maxMemoryUsage}MB`,
        value: this.metrics.memoryUsage,
        budget: this.budgets.maxMemoryUsage
      })
    }
  }

  private updateMetrics(): void {
    this.metrics.lastUpdate = performance.now()

    // Estimate CPU usage based on performance
    const recentTickTime = this.metrics.averageTickTime
    const expectedTickTime = 100 // Expected baseline tick time
    this.metrics.cpuUsage = Math.min(100, (recentTickTime / expectedTickTime) * 50)

    // Notify observers
    this.notifyObservers()
  }

  // Observer Pattern for Real-time Updates
  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  public onWarning(callback: (warning: PerformanceWarning) => void): () => void {
    this.warningCallbacks.push(callback)
    return () => {
      const index = this.warningCallbacks.indexOf(callback)
      if (index > -1) {
        this.warningCallbacks.splice(index, 1)
      }
    }
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => callback(this.metrics))
  }

  private emitWarning(warning: PerformanceWarning): void {
    this.warningCallbacks.forEach(callback => callback(warning))
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getBudgets(): PerformanceBudgets {
    return { ...this.budgets }
  }

  public updateBudgets(newBudgets: Partial<PerformanceBudgets>): void {
    this.budgets = { ...this.budgets, ...newBudgets }
  }

  public reset(): void {
    this.metrics = this.initializeMetrics()
    this.tickTimes = []
    this.llmTimes = []
    this.frameTimeHistory = []
    this.frameCount = 0
  }

  // Performance Report Generation
  public generateReport(): PerformanceReport {
    const now = performance.now()
    const uptime = now - this.metrics.startTime

    return {
      timestamp: now,
      uptime,
      metrics: this.getMetrics(),
      budgets: this.getBudgets(),
      summary: {
        tickPerformance: this.metrics.averageTickTime <= this.budgets.maxTickTime ? 'good' : 'poor',
        llmPerformance: this.metrics.llmResponseTime <= this.budgets.maxLlmResponseTime ? 'good' : 'poor',
        framePerformance: this.metrics.fps >= this.budgets.minFps ? 'good' : 'poor',
        memoryPerformance: this.metrics.memoryUsage <= this.budgets.maxMemoryUsage ? 'good' : 'poor',
        overallHealth: this.calculateOverallHealth()
      },
      recommendations: this.generateRecommendations()
    }
  }

  private calculateOverallHealth(): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0

    // Tick performance (25%)
    score += this.metrics.averageTickTime <= this.budgets.maxTickTime ? 25 : 0

    // LLM performance (25%)
    score += this.metrics.llmResponseTime <= this.budgets.maxLlmResponseTime ? 25 : 0

    // Frame performance (25%)
    score += this.metrics.fps >= this.budgets.minFps ? 25 : 0

    // Memory performance (25%)
    score += this.metrics.memoryUsage <= this.budgets.maxMemoryUsage ? 25 : 0

    if (score >= 90) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'fair'
    return 'poor'
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    if (this.metrics.averageTickTime > this.budgets.maxTickTime) {
      recommendations.push('Consider reducing simulation complexity or optimizing tick logic')
    }

    if (this.metrics.llmResponseTime > this.budgets.maxLlmResponseTime) {
      recommendations.push('Implement LLM request batching or use a faster model')
    }

    if (this.metrics.fps < this.budgets.minFps) {
      recommendations.push('Optimize rendering or reduce visual effects complexity')
    }

    if (this.metrics.memoryUsage > this.budgets.maxMemoryUsage) {
      recommendations.push('Implement memory cleanup or reduce object retention')
    }

    if (this.metrics.conflictRate > 10) {
      recommendations.push('Review rule engine efficiency or device interaction patterns')
    }

    return recommendations
  }
}

export interface PerformanceWarning {
  type: 'tick_performance' | 'llm_performance' | 'frame_rate' | 'memory_usage' | 'tick_rate'
  severity: 'low' | 'medium' | 'high'
  message: string
  value: number
  budget: number
}

export interface PerformanceReport {
  timestamp: number
  uptime: number
  metrics: PerformanceMetrics
  budgets: PerformanceBudgets
  summary: {
    tickPerformance: 'good' | 'poor'
    llmPerformance: 'good' | 'poor'
    framePerformance: 'good' | 'poor'
    memoryPerformance: 'good' | 'poor'
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  }
  recommendations: string[]
}

// Singleton instance for global access
export const performanceMonitor = new PerformanceMonitor()