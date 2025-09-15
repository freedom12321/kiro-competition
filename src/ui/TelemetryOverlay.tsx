import React, { useState, useEffect, useRef } from 'react'
import { PerformanceMetrics, PerformanceWarning, performanceMonitor } from '../monitoring/PerformanceMonitor'

interface TelemetryOverlayProps {
  visible: boolean
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compact?: boolean
}

export const TelemetryOverlay: React.FC<TelemetryOverlayProps> = ({
  visible,
  position = 'top-right',
  compact = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([])
  const [expanded, setExpanded] = useState(!compact)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!visible) return

    // Subscribe to performance metrics
    const unsubscribeMetrics = performanceMonitor.subscribe(setMetrics)

    // Subscribe to warnings
    const unsubscribeWarnings = performanceMonitor.onWarning((warning) => {
      setWarnings(prev => {
        const newWarnings = [warning, ...prev.slice(0, 4)] // Keep last 5 warnings
        return newWarnings
      })

      // Auto-clear warnings after 10 seconds
      setTimeout(() => {
        setWarnings(prev => prev.filter(w => w !== warning))
      }, 10000)
    })

    return () => {
      unsubscribeMetrics()
      unsubscribeWarnings()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [visible])

  if (!visible || !metrics) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const getPerformanceColor = (value: number, threshold: number, inverse: boolean = false): string => {
    const ratio = inverse ? threshold / value : value / threshold
    if (ratio <= 0.5) return 'text-red-400'
    if (ratio <= 0.8) return 'text-yellow-400'
    return 'text-green-400'
  }

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes.toFixed(1)}MB`
    return `${(bytes / 1024).toFixed(1)}GB`
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-auto`}>
      <div className="bg-black bg-opacity-80 text-white text-sm font-mono rounded-lg shadow-lg border border-gray-600 min-w-64">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-gray-600 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-semibold">Performance Monitor</span>
          </div>
          <button className="text-gray-400 hover:text-white">
            {expanded ? '−' : '+'}
          </button>
        </div>

        {expanded && (
          <>
            {/* Core Metrics */}
            <div className="px-3 py-2 space-y-1">
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Simulation Performance */}
                <div>
                  <div className="text-blue-300 font-semibold mb-1">Simulation</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Tick Rate:</span>
                      <span className={getPerformanceColor(metrics.tickRate, 0.1)}>
                        {metrics.tickRate.toFixed(2)} tps
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tick Time:</span>
                      <span className={getPerformanceColor(metrics.averageTickTime, 500, true)}>
                        {formatTime(metrics.averageTickTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health:</span>
                      <span className={getPerformanceColor(metrics.simulationHealth, 0.8)}>
                        {(metrics.simulationHealth * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* LLM Performance */}
                <div>
                  <div className="text-purple-300 font-semibold mb-1">LLM</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Response:</span>
                      <span className={getPerformanceColor(metrics.llmResponseTime, 3000, true)}>
                        {formatTime(metrics.llmResponseTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue:</span>
                      <span className={metrics.llmQueueSize > 5 ? 'text-yellow-400' : 'text-green-400'}>
                        {metrics.llmQueueSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Rate:</span>
                      <span className={getPerformanceColor(metrics.llmErrorRate, 5, true)}>
                        {metrics.llmErrorRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Resources */}
                <div>
                  <div className="text-yellow-300 font-semibold mb-1">System</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className={getPerformanceColor(metrics.memoryUsage, 256, true)}>
                        {formatBytes(metrics.memoryUsage)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU:</span>
                      <span className={getPerformanceColor(metrics.cpuUsage, 80, true)}>
                        {metrics.cpuUsage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>FPS:</span>
                      <span className={getPerformanceColor(metrics.fps, 30)}>
                        {metrics.fps.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game State */}
                <div>
                  <div className="text-green-300 font-semibold mb-1">Game</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Devices:</span>
                      <span className="text-white">{metrics.deviceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conflicts/min:</span>
                      <span className={metrics.conflictRate > 5 ? 'text-red-400' : 'text-green-400'}>
                        {metrics.conflictRate.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span className={getPerformanceColor(metrics.networkLatency, 200, true)}>
                        {metrics.networkLatency.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Graph (Mini Sparklines) */}
            <div className="px-3 py-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Performance Trends</div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-blue-300">Tick Time</div>
                  <div className="h-6 bg-gray-800 rounded mt-1 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 bg-blue-500 transition-all duration-300"
                      style={{
                        width: '100%',
                        height: `${Math.min(100, (metrics.lastTickTime / 500) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-purple-300">LLM Queue</div>
                  <div className="h-6 bg-gray-800 rounded mt-1 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 bg-purple-500 transition-all duration-300"
                      style={{
                        width: '100%',
                        height: `${Math.min(100, (metrics.llmQueueSize / 10) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="text-yellow-300">Memory</div>
                  <div className="h-6 bg-gray-800 rounded mt-1 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 bg-yellow-500 transition-all duration-300"
                      style={{
                        width: '100%',
                        height: `${Math.min(100, (metrics.memoryUsage / 256) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700">
                <div className="text-xs text-red-400 mb-2 font-semibold">Performance Warnings</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {warnings.map((warning, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded border-l-2 ${
                        warning.severity === 'high'
                          ? 'bg-red-900 border-red-500 text-red-200'
                          : warning.severity === 'medium'
                          ? 'bg-yellow-900 border-yellow-500 text-yellow-200'
                          : 'bg-blue-900 border-blue-500 text-blue-200'
                      }`}
                    >
                      <div className="font-semibold capitalize">
                        {warning.type.replace('_', ' ')} - {warning.severity}
                      </div>
                      <div className="mt-1">{warning.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="px-3 py-2 border-t border-gray-700 flex justify-between items-center">
              <div className="text-xs text-gray-400">
                Uptime: {formatTime(metrics.lastUpdate - metrics.startTime)}
              </div>
              <div className="flex gap-2">
                <button
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => performanceMonitor.reset()}
                  title="Reset metrics"
                >
                  Reset
                </button>
                <button
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                  onClick={() => {
                    const report = performanceMonitor.generateReport()
                    console.log('Performance Report:', report)
                  }}
                  title="Generate report"
                >
                  Report
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Hook for easy integration
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    if (!isEnabled) return

    const unsubscribe = performanceMonitor.subscribe(setMetrics)
    return unsubscribe
  }, [isEnabled])

  const recordTick = () => {
    const start = performanceMonitor.recordTickStart()
    return () => performanceMonitor.recordTickEnd(start)
  }

  const recordLlmRequest = () => {
    const start = performanceMonitor.recordLlmRequestStart()
    return (success: boolean = true) => performanceMonitor.recordLlmRequestEnd(start, success)
  }

  const recordFrame = () => {
    performanceMonitor.recordFrame()
  }

  const updateGameMetrics = (deviceCount: number, conflictCount: number, health: number) => {
    performanceMonitor.updateGameMetrics(deviceCount, conflictCount, health)
  }

  return {
    metrics,
    isEnabled,
    setIsEnabled,
    recordTick,
    recordLlmRequest,
    recordFrame,
    updateGameMetrics,
    monitor: performanceMonitor
  }
}