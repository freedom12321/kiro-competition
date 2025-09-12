import { DeviceVisual, GameScene, Vector3 } from '../types/core';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  deviceCount: number;
  visibleDevices: number;
  particleCount: number;
  memoryUsage: number;
}

export interface LODLevel {
  distance: number;
  modelComplexity: number;
  animationQuality: number;
  particleCount: number;
  shadowQuality: number;
}

export interface OptimizationSettings {
  targetFPS: number;
  maxDevices: number;
  cullingDistance: number;
  lodLevels: LODLevel[];
  enableOcclusion: boolean;
  enableInstancing: boolean;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private settings: OptimizationSettings;
  private frameTimeHistory: number[] = [];
  private lastFrameTime: number = 0;
  private performanceCallbacks: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor(settings: OptimizationSettings) {
    this.settings = settings;
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      renderTime: 0,
      deviceCount: 0,
      visibleDevices: 0,
      particleCount: 0,
      memoryUsage: 0
    };
  }

  public startFrame(): void {
    this.lastFrameTime = performance.now();
  }

  public endFrame(): void {
    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    this.updateMetrics(frameTime);
    this.notifyCallbacks();
  }

  private updateMetrics(frameTime: number): void {
    this.metrics.frameTime = frameTime;
    this.metrics.fps = 1000 / frameTime;
    
    // Calculate average FPS over last 60 frames
    if (this.frameTimeHistory.length > 0) {
      const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.metrics.fps = 1000 / avgFrameTime;
    }
  }

  public updateDeviceMetrics(deviceCount: number, visibleDevices: number): void {
    this.metrics.deviceCount = deviceCount;
    this.metrics.visibleDevices = visibleDevices;
  }

  public updateRenderMetrics(renderTime: number, particleCount: number): void {
    this.metrics.renderTime = renderTime;
    this.metrics.particleCount = particleCount;
  }

  public getLODLevel(device: DeviceVisual, cameraPosition: Vector3): LODLevel {
    const distance = this.calculateDistance(device.position, cameraPosition);
    
    for (let i = 0; i < this.settings.lodLevels.length; i++) {
      if (distance <= this.settings.lodLevels[i].distance) {
        return this.settings.lodLevels[i];
      }
    }
    
    // Return lowest quality LOD for very distant objects
    return this.settings.lodLevels[this.settings.lodLevels.length - 1];
  }

  public shouldCullDevice(device: DeviceVisual, cameraPosition: Vector3): boolean {
    const distance = this.calculateDistance(device.position, cameraPosition);
    return distance > this.settings.cullingDistance;
  }

  public getVisibleDevices(devices: DeviceVisual[], cameraPosition: Vector3): DeviceVisual[] {
    return devices.filter(device => !this.shouldCullDevice(device, cameraPosition));
  }

  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public shouldReduceQuality(): boolean {
    return this.metrics.fps < this.settings.targetFPS * 0.8;
  }

  public shouldIncreaseQuality(): boolean {
    return this.metrics.fps > this.settings.targetFPS * 1.1 && 
           this.frameTimeHistory.length >= 30 &&
           this.frameTimeHistory.every(time => 1000 / time > this.settings.targetFPS);
  }

  public adaptiveOptimization(): void {
    if (this.shouldReduceQuality()) {
      this.reduceQuality();
    } else if (this.shouldIncreaseQuality()) {
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    // Reduce particle count
    if (this.metrics.particleCount > 100) {
      this.settings.lodLevels.forEach(lod => {
        lod.particleCount = Math.max(1, Math.floor(lod.particleCount * 0.8));
      });
    }

    // Reduce culling distance
    this.settings.cullingDistance = Math.max(50, this.settings.cullingDistance * 0.9);

    // Reduce shadow quality
    this.settings.lodLevels.forEach(lod => {
      lod.shadowQuality = Math.max(0.1, lod.shadowQuality * 0.8);
    });
  }

  private increaseQuality(): void {
    // Increase particle count
    this.settings.lodLevels.forEach(lod => {
      lod.particleCount = Math.min(1000, Math.floor(lod.particleCount * 1.1));
    });

    // Increase culling distance
    this.settings.cullingDistance = Math.min(200, this.settings.cullingDistance * 1.1);

    // Increase shadow quality
    this.settings.lodLevels.forEach(lod => {
      lod.shadowQuality = Math.min(1.0, lod.shadowQuality * 1.1);
    });
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public onPerformanceUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.performanceCallbacks.push(callback);
  }

  private notifyCallbacks(): void {
    this.performanceCallbacks.forEach(callback => callback(this.metrics));
  }

  public getOptimizationReport(): string {
    const report = [
      `Performance Report:`,
      `FPS: ${this.metrics.fps.toFixed(1)} (Target: ${this.settings.targetFPS})`,
      `Frame Time: ${this.metrics.frameTime.toFixed(2)}ms`,
      `Devices: ${this.metrics.visibleDevices}/${this.metrics.deviceCount}`,
      `Particles: ${this.metrics.particleCount}`,
      `Culling Distance: ${this.settings.cullingDistance.toFixed(1)}`,
      `Memory Usage: ${this.metrics.memoryUsage.toFixed(1)}MB`
    ];
    
    return report.join('\n');
  }
}

export const createDefaultOptimizationSettings = (): OptimizationSettings => ({
  targetFPS: 60,
  maxDevices: 50,
  cullingDistance: 100,
  lodLevels: [
    { distance: 20, modelComplexity: 1.0, animationQuality: 1.0, particleCount: 100, shadowQuality: 1.0 },
    { distance: 50, modelComplexity: 0.7, animationQuality: 0.8, particleCount: 50, shadowQuality: 0.7 },
    { distance: 100, modelComplexity: 0.4, animationQuality: 0.5, particleCount: 20, shadowQuality: 0.4 },
    { distance: Infinity, modelComplexity: 0.2, animationQuality: 0.2, particleCount: 5, shadowQuality: 0.1 }
  ],
  enableOcclusion: true,
  enableInstancing: true
});