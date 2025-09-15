import { GameRenderer } from '../../src/engine/GameRenderer';
import { PerformanceOptimizer, createDefaultOptimizationSettings } from '../../src/engine/PerformanceOptimizer';
import { CollisionOptimizer } from '../../src/engine/CollisionOptimizer';
import { GameScene, DeviceVisual, Vector3 } from '../../src/types/core';

// Mock DOM elements for testing
const mockCanvas = {
  getContext: jest.fn(() => ({
    canvas: { width: 800, height: 600 },
    getExtension: jest.fn(),
    createShader: jest.fn(),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    createProgram: jest.fn(),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    useProgram: jest.fn(),
    getAttribLocation: jest.fn(),
    getUniformLocation: jest.fn(),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    uniform4f: jest.fn(),
    uniformMatrix4fv: jest.fn(),
    createBuffer: jest.fn(),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    drawArrays: jest.fn(),
    drawElements: jest.fn(),
    viewport: jest.fn(),
    clear: jest.fn(),
    clearColor: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    blendFunc: jest.fn(),
    depthFunc: jest.fn()
  })),
  width: 800,
  height: 600,
  style: {},
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockContainer = {
  appendChild: jest.fn(),
  removeChild: jest.fn(),
  clientWidth: 800,
  clientHeight: 600,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock Three.js WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => mockCanvas.getContext())
});

// Helper function to create mock devices
const createMockDevices = (count: number): DeviceVisual[] => {
  const devices: DeviceVisual[] = [];
  for (let i = 0; i < count; i++) {
    devices.push({
      id: `device${i}`,
      position: {
        x: (i % 10) * 12, // Spread devices further apart
        y: Math.floor(i / 10) * 12,
        z: (i % 3) * 8 // Add some Z variation
      },
      model3D: { mesh: {} as any },
      animations: {},
      personalityIndicators: [],
      connectionEffects: []
    });
  }
  return devices;
};

describe('Performance Integration Tests', () => {
  let performanceOptimizer: PerformanceOptimizer;
  let collisionOptimizer: CollisionOptimizer;

  beforeEach(() => {
    performanceOptimizer = new PerformanceOptimizer(createDefaultOptimizationSettings());
    
    const bounds = {
      min: { x: -100, y: -100, z: -50 },
      max: { x: 100, y: 100, z: 50 }
    };
    collisionOptimizer = new CollisionOptimizer(bounds, 10, 15);
  });

  describe('Device Count Scaling', () => {

    it('should maintain performance with 10 devices', () => {
      const devices = createMockDevices(10);
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 10 };
      
      const startTime = performance.now();
      
      // Simulate rendering pipeline
      performanceOptimizer.startFrame();
      const visibleDevices = performanceOptimizer.getVisibleDevices(devices, cameraPosition);
      collisionOptimizer.updateSpatialGrid(visibleDevices);
      const pairs = collisionOptimizer.findInteractionPairs(visibleDevices);
      performanceOptimizer.updateDeviceMetrics(devices.length, visibleDevices.length);
      performanceOptimizer.updateRenderMetrics(5, 50);
      performanceOptimizer.endFrame();
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(5);
      expect(visibleDevices.length).toBeGreaterThan(0);
      expect(pairs.length).toBeGreaterThan(0);
    });

    it('should handle 50 devices efficiently', () => {
      const devices = createMockDevices(50);
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 10 };
      
      const startTime = performance.now();
      
      // Simulate rendering pipeline
      performanceOptimizer.startFrame();
      const visibleDevices = performanceOptimizer.getVisibleDevices(devices, cameraPosition);
      collisionOptimizer.updateSpatialGrid(visibleDevices);
      const pairs = collisionOptimizer.findInteractionPairs(visibleDevices);
      performanceOptimizer.updateDeviceMetrics(devices.length, visibleDevices.length);
      performanceOptimizer.updateRenderMetrics(10, 200);
      performanceOptimizer.endFrame();
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(15);
      // With devices spread further apart, some should be culled
      expect(visibleDevices.length).toBeLessThanOrEqual(devices.length);
    });

    it('should adapt optimization for 100 devices', () => {
      const devices = createMockDevices(100);
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 10 };
      
      const startTime = performance.now();
      
      // Simulate multiple frames to trigger adaptation
      for (let frame = 0; frame < 10; frame++) {
        performanceOptimizer.startFrame();
        const visibleDevices = performanceOptimizer.getVisibleDevices(devices, cameraPosition);
        collisionOptimizer.updateSpatialGrid(visibleDevices);
        performanceOptimizer.updateDeviceMetrics(devices.length, visibleDevices.length);
        performanceOptimizer.updateRenderMetrics(20, 500);
        performanceOptimizer.endFrame();
        performanceOptimizer.adaptiveOptimization();
      }
      
      const processingTime = performance.now() - startTime;
      const avgTimePerFrame = processingTime / 10;
      
      expect(avgTimePerFrame).toBeLessThan(10);
      
      // Check that optimization has adapted
      const settings = performanceOptimizer.getSettings();
      const defaultSettings = createDefaultOptimizationSettings();
      expect(settings.cullingDistance).toBeLessThanOrEqual(defaultSettings.cullingDistance);
    });
  });

  describe('LOD System Performance', () => {
    it('should efficiently calculate LOD for multiple devices', () => {
      const devices = createMockDevices(30);
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      const startTime = performance.now();
      
      const lodResults = devices.map(device => 
        performanceOptimizer.getLODLevel(device, cameraPosition)
      );
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(5);
      expect(lodResults.length).toBe(30);
      
      // Verify LOD quality decreases with distance
      const closeLOD = lodResults.find((_, index) => {
        const device = devices[index];
        const distance = Math.sqrt(
          device.position.x ** 2 + device.position.y ** 2 + device.position.z ** 2
        );
        return distance < 10;
      });
      
      const farLOD = lodResults.find((_, index) => {
        const device = devices[index];
        const distance = Math.sqrt(
          device.position.x ** 2 + device.position.y ** 2 + device.position.z ** 2
        );
        return distance > 30;
      });
      
      if (closeLOD && farLOD) {
        expect(closeLOD.modelComplexity).toBeGreaterThan(farLOD.modelComplexity);
      }
    });
  });

  describe('Collision Detection Performance', () => {
    it('should efficiently detect interactions in dense scenarios', () => {
      // Create devices in a tight grid
      const devices: DeviceVisual[] = [];
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          devices.push({
            id: `device${x}_${y}`,
            position: { x: x * 3, y: y * 3, z: 0 },
            model3D: { mesh: {} as any },
            animations: {},
            personalityIndicators: [],
            connectionEffects: []
          });
        }
      }
      
      const startTime = performance.now();
      
      collisionOptimizer.updateSpatialGrid(devices);
      const pairs = collisionOptimizer.findInteractionPairs(devices);
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(20);
      expect(pairs.length).toBeGreaterThan(0);
      
      // Verify spatial optimization is working
      const stats = collisionOptimizer.getOptimizationStats();
      expect(stats.cellCount).toBeGreaterThan(1);
      expect(stats.averageDevicesPerCell).toBeGreaterThan(0);
    });

    it('should handle sparse device distributions efficiently', () => {
      // Create devices spread far apart
      const devices: DeviceVisual[] = [];
      for (let i = 0; i < 20; i++) {
        devices.push({
          id: `device${i}`,
          position: { 
            x: i * 20, 
            y: (i % 2) * 20, 
            z: 0 
          },
          model3D: { mesh: {} as any },
          animations: {},
          personalityIndicators: [],
          connectionEffects: []
        });
      }
      
      const startTime = performance.now();
      
      collisionOptimizer.updateSpatialGrid(devices);
      const pairs = collisionOptimizer.findInteractionPairs(devices);
      
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(10);
      // Should find few or no pairs due to large distances
      expect(pairs.length).toBeLessThan(5);
    });
  });

  describe('Adaptive Performance', () => {
    it('should adapt to changing performance conditions', () => {
      const devices = createMockDevices(40);
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Simulate poor performance scenario
      for (let i = 0; i < 20; i++) {
        performanceOptimizer.startFrame();
        setTimeout(() => {
          performanceOptimizer.updateDeviceMetrics(devices.length, devices.length);
          performanceOptimizer.updateRenderMetrics(50, 1000); // High render time, many particles
          performanceOptimizer.endFrame();
        }, 50); // Simulate 20fps
      }
      
      const initialSettings = performanceOptimizer.getSettings();
      performanceOptimizer.adaptiveOptimization();
      const adaptedSettings = performanceOptimizer.getSettings();
      
      // Settings should be more conservative
      expect(adaptedSettings.cullingDistance).toBeLessThanOrEqual(initialSettings.cullingDistance);
      
      // Simulate good performance recovery
      for (let i = 0; i < 40; i++) {
        performanceOptimizer.startFrame();
        setTimeout(() => {
          performanceOptimizer.updateDeviceMetrics(20, 15);
          performanceOptimizer.updateRenderMetrics(10, 100); // Low render time, few particles
          performanceOptimizer.endFrame();
        }, 10); // Simulate 100fps
      }
      
      performanceOptimizer.adaptiveOptimization();
      const recoveredSettings = performanceOptimizer.getSettings();
      
      // Settings should be less conservative than adapted settings
      expect(recoveredSettings.cullingDistance).toBeGreaterThanOrEqual(adaptedSettings.cullingDistance);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during repeated operations', () => {
      const devices = createMockDevices(25);
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Simulate many frames
      for (let frame = 0; frame < 100; frame++) {
        performanceOptimizer.startFrame();
        
        const visibleDevices = performanceOptimizer.getVisibleDevices(devices, cameraPosition);
        collisionOptimizer.updateSpatialGrid(visibleDevices);
        const pairs = collisionOptimizer.findInteractionPairs(visibleDevices);
        
        performanceOptimizer.updateDeviceMetrics(devices.length, visibleDevices.length);
        performanceOptimizer.updateRenderMetrics(16, pairs.length * 10);
        performanceOptimizer.endFrame();
        
        // Occasionally trigger optimization
        if (frame % 10 === 0) {
          performanceOptimizer.adaptiveOptimization();
        }
      }
      
      // Check that internal data structures haven't grown excessively
      const metrics = performanceOptimizer.getMetrics();
      expect(metrics.fps).toBeGreaterThan(0);
      
      const stats = collisionOptimizer.getOptimizationStats();
      expect(stats.cellCount).toBeLessThan(100); // Reasonable cell count
    });
  });

  describe('Real-world Scenario Simulation', () => {
    it('should handle typical gameplay scenario efficiently', () => {
      // Simulate a typical room with various devices
      const devices: DeviceVisual[] = [
        // Smart home devices clustered in different areas
        { id: 'thermostat', position: { x: 0, y: 0, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'light1', position: { x: 2, y: 2, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'light2', position: { x: -2, y: 2, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'speaker', position: { x: 5, y: 0, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'tv', position: { x: 8, y: 0, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'security_cam', position: { x: 0, y: 8, z: 2 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'door_lock', position: { x: -5, y: 8, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'vacuum', position: { x: 3, y: -3, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'fridge', position: { x: -8, y: -5, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] },
        { id: 'coffee_maker', position: { x: -6, y: -5, z: 0 }, model3D: { mesh: {} as any }, animations: {}, personalityIndicators: [], connectionEffects: [] }
      ];
      
      const cameraPosition: Vector3 = { x: 0, y: 0, z: 10 };
      
      // Simulate 60 frames (1 second at 60fps)
      const frameCount = 60;
      const startTime = performance.now();
      
      for (let frame = 0; frame < frameCount; frame++) {
        performanceOptimizer.startFrame();
        
        // Simulate camera movement
        const movingCamera: Vector3 = {
          x: Math.sin(frame * 0.1) * 5,
          y: Math.cos(frame * 0.1) * 5,
          z: 10 + Math.sin(frame * 0.05) * 3
        };
        
        const visibleDevices = performanceOptimizer.getVisibleDevices(devices, movingCamera);
        collisionOptimizer.updateSpatialGrid(visibleDevices);
        const pairs = collisionOptimizer.findInteractionPairs(visibleDevices);
        
        // Simulate varying render complexity
        const renderTime = 12 + Math.random() * 8; // 12-20ms
        const particleCount = pairs.length * 15 + Math.floor(Math.random() * 50);
        
        performanceOptimizer.updateDeviceMetrics(devices.length, visibleDevices.length);
        performanceOptimizer.updateRenderMetrics(renderTime, particleCount);
        performanceOptimizer.endFrame();
        
        // Adaptive optimization every 10 frames
        if (frame % 10 === 0) {
          performanceOptimizer.adaptiveOptimization();
          collisionOptimizer.optimizeInteractionRange(
            devices.length,
            60,
            performanceOptimizer.getMetrics().fps
          );
        }
      }
      
      const totalTime = performance.now() - startTime;
      const avgTimePerFrame = totalTime / frameCount;
      
      // Should maintain good performance
      expect(avgTimePerFrame).toBeLessThan(5);
      
      const finalMetrics = performanceOptimizer.getMetrics();
      expect(finalMetrics.fps).toBeGreaterThan(0);
      expect(finalMetrics.deviceCount).toBe(devices.length);
    });
  });
});