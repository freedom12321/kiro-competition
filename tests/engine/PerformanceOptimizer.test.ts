import { PerformanceOptimizer, createDefaultOptimizationSettings } from '../../src/engine/PerformanceOptimizer';
import { DeviceVisual, Vector3 } from '../../src/types/core';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockDevices: DeviceVisual[];

  beforeEach(() => {
    optimizer = new PerformanceOptimizer(createDefaultOptimizationSettings());
    
    mockDevices = [
      {
        id: 'device1',
        position: { x: 0, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      },
      {
        id: 'device2',
        position: { x: 10, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      },
      {
        id: 'device3',
        position: { x: 100, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      }
    ];
  });

  describe('Frame Performance Tracking', () => {
    it('should track frame performance metrics', () => {
      optimizer.startFrame();
      
      // Simulate frame processing time
      const startTime = performance.now();
      while (performance.now() - startTime < 20) {
        // Simulate work
      }
      
      optimizer.endFrame();
      
      const metrics = optimizer.getMetrics();
      expect(metrics.frameTime).toBeGreaterThan(15);
      expect(metrics.fps).toBeLessThan(60);
    });

    it('should calculate average FPS over multiple frames', () => {
      // Simulate multiple frames
      for (let i = 0; i < 10; i++) {
        optimizer.startFrame();
        setTimeout(() => optimizer.endFrame(), 16); // ~60fps
      }
      
      const metrics = optimizer.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
    });
  });

  describe('Level of Detail (LOD)', () => {
    it('should return appropriate LOD level based on distance', () => {
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Close device should get high quality LOD
      const closeLOD = optimizer.getLODLevel(mockDevices[0], cameraPosition);
      expect(closeLOD.modelComplexity).toBe(1.0);
      expect(closeLOD.animationQuality).toBe(1.0);
      
      // Distant device should get low quality LOD
      const distantLOD = optimizer.getLODLevel(mockDevices[2], cameraPosition);
      expect(distantLOD.modelComplexity).toBeLessThan(1.0);
      expect(distantLOD.animationQuality).toBeLessThan(1.0);
    });

    it('should cull devices beyond culling distance', () => {
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      expect(optimizer.shouldCullDevice(mockDevices[0], cameraPosition)).toBe(false);
      expect(optimizer.shouldCullDevice(mockDevices[2], cameraPosition)).toBe(false); // Distance is 100, default culling is 100
      
      // Test with a device that's definitely beyond culling distance
      const farDevice: DeviceVisual = {
        id: 'farDevice',
        position: { x: 150, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      };
      
      expect(optimizer.shouldCullDevice(farDevice, cameraPosition)).toBe(true);
    });

    it('should return only visible devices', () => {
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Add a device that's definitely beyond culling distance
      const farDevice: DeviceVisual = {
        id: 'farDevice',
        position: { x: 150, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      };
      
      const allDevices = [...mockDevices, farDevice];
      const visibleDevices = optimizer.getVisibleDevices(allDevices, cameraPosition);
      
      expect(visibleDevices.length).toBeLessThan(allDevices.length);
      expect(visibleDevices).toContain(mockDevices[0]);
      expect(visibleDevices).toContain(mockDevices[1]);
      expect(visibleDevices).toContain(mockDevices[2]); // Within culling distance
      expect(visibleDevices).not.toContain(farDevice); // Beyond culling distance
    });
  });

  describe('Adaptive Optimization', () => {
    it('should detect when quality reduction is needed', async () => {
      // Simulate low FPS by manually setting frame times
      optimizer.updateDeviceMetrics(50, 50);
      
      // Simulate multiple slow frames
      for (let i = 0; i < 10; i++) {
        optimizer.startFrame();
        // Simulate 50ms frame time (20fps)
        await new Promise(resolve => setTimeout(resolve, 50));
        optimizer.endFrame();
      }
      
      expect(optimizer.shouldReduceQuality()).toBe(true);
    });

    it('should detect when quality can be increased', async () => {
      // Simulate high FPS by manually setting frame times
      optimizer.updateDeviceMetrics(10, 10);
      
      // Simulate multiple fast frames
      for (let i = 0; i < 35; i++) {
        optimizer.startFrame();
        // Simulate 10ms frame time (100fps)
        await new Promise(resolve => setTimeout(resolve, 10));
        optimizer.endFrame();
      }
      
      expect(optimizer.shouldIncreaseQuality()).toBe(true);
    });

    it('should adapt optimization settings based on performance', async () => {
      const initialSettings = optimizer.getSettings();
      const initialCullingDistance = initialSettings.cullingDistance;
      
      // Force quality reduction by simulating poor performance
      optimizer.updateDeviceMetrics(100, 100);
      
      // Simulate multiple slow frames
      for (let i = 0; i < 10; i++) {
        optimizer.startFrame();
        await new Promise(resolve => setTimeout(resolve, 100)); // ~10fps
        optimizer.endFrame();
      }
      
      optimizer.adaptiveOptimization();
      
      const newSettings = optimizer.getSettings();
      expect(newSettings.cullingDistance).toBeLessThan(initialCullingDistance);
    });
  });

  describe('Performance Metrics', () => {
    it('should update device metrics correctly', () => {
      optimizer.updateDeviceMetrics(25, 20);
      
      const metrics = optimizer.getMetrics();
      expect(metrics.deviceCount).toBe(25);
      expect(metrics.visibleDevices).toBe(20);
    });

    it('should update render metrics correctly', () => {
      optimizer.updateRenderMetrics(12.5, 150);
      
      const metrics = optimizer.getMetrics();
      expect(metrics.renderTime).toBe(12.5);
      expect(metrics.particleCount).toBe(150);
    });

    it('should generate optimization report', () => {
      optimizer.updateDeviceMetrics(30, 25);
      optimizer.updateRenderMetrics(15, 200);
      
      const report = optimizer.getOptimizationReport();
      expect(report).toContain('Performance Report:');
      expect(report).toContain('FPS:');
      expect(report).toContain('Devices: 25/30');
      expect(report).toContain('Particles: 200');
    });
  });

  describe('Settings Management', () => {
    it('should update optimization settings', () => {
      const newSettings = {
        targetFPS: 30,
        maxDevices: 25
      };
      
      optimizer.updateSettings(newSettings);
      
      const settings = optimizer.getSettings();
      expect(settings.targetFPS).toBe(30);
      expect(settings.maxDevices).toBe(25);
    });

    it('should notify performance callbacks', (done) => {
      optimizer.onPerformanceUpdate((metrics) => {
        expect(metrics.fps).toBeGreaterThan(0);
        done();
      });
      
      optimizer.startFrame();
      optimizer.endFrame();
    });
  });

  describe('Stress Testing', () => {
    it('should handle high device counts efficiently', () => {
      const manyDevices: DeviceVisual[] = [];
      for (let i = 0; i < 100; i++) {
        manyDevices.push({
          id: `device${i}`,
          position: { x: i * 2, y: 0, z: 0 },
          model3D: { mesh: {} as any },
          animations: {},
          personalityIndicators: [],
          connectionEffects: []
        });
      }
      
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      const startTime = performance.now();
      
      const visibleDevices = optimizer.getVisibleDevices(manyDevices, cameraPosition);
      
      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(10); // Should process quickly
      expect(visibleDevices.length).toBeLessThan(manyDevices.length);
    });

    it('should maintain performance under rapid frame updates', () => {
      const frameCount = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < frameCount; i++) {
        optimizer.startFrame();
        optimizer.updateDeviceMetrics(50, 40);
        optimizer.updateRenderMetrics(16, 100);
        optimizer.endFrame();
      }
      
      const totalTime = performance.now() - startTime;
      const avgTimePerFrame = totalTime / frameCount;
      
      expect(avgTimePerFrame).toBeLessThan(1); // Should be very fast
    });
  });
});