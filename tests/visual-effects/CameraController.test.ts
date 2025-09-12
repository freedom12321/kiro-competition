import * as THREE from 'three';
import { CameraController } from '../../src/visual-effects/CameraController.js';
import { Vector3 } from '../../src/types/core.js';

// Mock THREE.js components
jest.mock('three', () => ({
  PerspectiveCamera: jest.fn(() => ({
    position: { x: 0, y: 5, z: 10, set: jest.fn(), copy: jest.fn() },
    fov: 75,
    updateProjectionMatrix: jest.fn(),
    getWorldDirection: jest.fn((target) => {
      target.set(0, 0, -1);
      return target;
    }),
    lookAt: jest.fn(),
    projectionMatrix: {},
    matrixWorldInverse: {}
  })),
  Vector3: jest.fn(() => ({
    x: 0, y: 0, z: 0,
    set: jest.fn(),
    copy: jest.fn(),
    add: jest.fn(),
    clone: jest.fn(() => ({ multiplyScalar: jest.fn(), add: jest.fn() })),
    multiplyScalar: jest.fn(),
    distanceTo: jest.fn(() => 5),
    length: jest.fn(() => 1)
  }))
}));

// Mock performance.now for consistent timing
const mockPerformanceNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16); // Simulate 60fps
  return 1;
});
Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true
});

describe('CameraController', () => {
  let cameraController: CameraController;
  let mockCamera: THREE.PerspectiveCamera;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
    
    mockCamera = new THREE.PerspectiveCamera();
    cameraController = new CameraController(mockCamera);
  });

  describe('Initialization', () => {
    it('should initialize with camera', () => {
      expect(cameraController).toBeDefined();
      expect(cameraController.getCurrentPosition()).toBeDefined();
    });

    it('should store default camera position', () => {
      const position = cameraController.getCurrentPosition();
      expect(position).toEqual({ x: 0, y: 5, z: 10 });
    });

    it('should not be transitioning initially', () => {
      expect(cameraController.isTransitioning()).toBe(false);
    });

    it('should not be shaking initially', () => {
      expect(cameraController.isShaking()).toBe(false);
    });

    it('should not be in cinematic mode initially', () => {
      expect(cameraController.isCinematicMode()).toBe(false);
    });
  });

  describe('Smooth Transitions', () => {
    it('should perform smooth transition to target position', async () => {
      const targetPosition: Vector3 = { x: 5, y: 3, z: 8 };
      const targetLookAt: Vector3 = { x: 0, y: 0, z: 0 };
      const duration = 1;

      // Mock time progression
      let timeStep = 0;
      mockPerformanceNow.mockImplementation(() => {
        timeStep += 100; // 100ms steps
        return timeStep;
      });

      const transitionPromise = cameraController.smoothTransition(
        targetPosition, 
        targetLookAt, 
        duration
      );

      expect(cameraController.isTransitioning()).toBe(true);

      await transitionPromise;

      expect(mockCamera.position.set).toHaveBeenCalledWith(
        targetPosition.x, 
        targetPosition.y, 
        targetPosition.z
      );
      expect(mockCamera.lookAt).toHaveBeenCalledWith(
        targetLookAt.x, 
        targetLookAt.y, 
        targetLookAt.z
      );
    });

    it('should handle multiple concurrent transitions', async () => {
      const position1: Vector3 = { x: 1, y: 1, z: 1 };
      const position2: Vector3 = { x: 2, y: 2, z: 2 };
      const lookAt: Vector3 = { x: 0, y: 0, z: 0 };

      // Start first transition
      const transition1 = cameraController.smoothTransition(position1, lookAt, 0.5);
      
      // Start second transition (should override first)
      const transition2 = cameraController.smoothTransition(position2, lookAt, 0.5);

      await Promise.all([transition1, transition2]);

      // Should end up at second position
      expect(mockCamera.position.set).toHaveBeenLastCalledWith(
        position2.x, 
        position2.y, 
        position2.z
      );
    });

    it('should handle zero duration transitions', async () => {
      const targetPosition: Vector3 = { x: 1, y: 1, z: 1 };
      const targetLookAt: Vector3 = { x: 0, y: 0, z: 0 };

      await cameraController.smoothTransition(targetPosition, targetLookAt, 0);

      expect(mockCamera.position.set).toHaveBeenCalledWith(
        targetPosition.x, 
        targetPosition.y, 
        targetPosition.z
      );
    });
  });

  describe('Device Zoom', () => {
    it('should zoom to device position', async () => {
      const devicePosition: Vector3 = { x: 2, y: 1, z: 3 };
      const zoomLevel = 1.5;
      const duration = 1;

      await cameraController.zoomToDevice(devicePosition, zoomLevel, duration);

      expect(mockCamera.position.set).toHaveBeenCalled();
      expect(mockCamera.lookAt).toHaveBeenCalledWith(
        devicePosition.x, 
        devicePosition.y, 
        devicePosition.z
      );
    });

    it('should adjust zoom distance based on zoom level', async () => {
      const devicePosition: Vector3 = { x: 0, y: 0, z: 0 };
      
      await cameraController.zoomToDevice(devicePosition, 0.5, 0.1);
      const closePosition = mockCamera.position.set.mock.calls[mockCamera.position.set.mock.calls.length - 1];
      
      await cameraController.zoomToDevice(devicePosition, 2.0, 0.1);
      const farPosition = mockCamera.position.set.mock.calls[mockCamera.position.set.mock.calls.length - 1];

      // Far position should be further from device than close position
      const closeDistance = Math.sqrt(closePosition[0]**2 + closePosition[1]**2 + closePosition[2]**2);
      const farDistance = Math.sqrt(farPosition[0]**2 + farPosition[1]**2 + farPosition[2]**2);
      
      expect(farDistance).toBeGreaterThan(closeDistance);
    });
  });

  describe('Camera Shake', () => {
    it('should start camera shake with specified intensity and duration', () => {
      const intensity = 0.5;
      const duration = 2;

      cameraController.shakeCamera(intensity, duration);

      expect(cameraController.isShaking()).toBe(true);
    });

    it('should handle different shake intensities', () => {
      cameraController.shakeCamera(0.1, 1);
      expect(cameraController.isShaking()).toBe(true);

      cameraController.shakeCamera(1.0, 1);
      expect(cameraController.isShaking()).toBe(true);
    });

    it('should handle zero intensity shake', () => {
      expect(() => {
        cameraController.shakeCamera(0, 1);
      }).not.toThrow();
    });

    it('should handle zero duration shake', () => {
      expect(() => {
        cameraController.shakeCamera(0.5, 0);
      }).not.toThrow();
    });
  });

  describe('Area Focus', () => {
    it('should focus on area with specified radius', async () => {
      const center: Vector3 = { x: 1, y: 2, z: 3 };
      const radius = 5;
      const duration = 1;

      await cameraController.focusOnArea(center, radius, duration);

      expect(mockCamera.lookAt).toHaveBeenCalledWith(
        center.x, 
        center.y, 
        center.z
      );
    });

    it('should adjust camera distance based on area radius', async () => {
      const center: Vector3 = { x: 0, y: 0, z: 0 };
      
      await cameraController.focusOnArea(center, 2, 0.1);
      const smallAreaPosition = mockCamera.position.set.mock.calls[mockCamera.position.set.mock.calls.length - 1];
      
      await cameraController.focusOnArea(center, 10, 0.1);
      const largeAreaPosition = mockCamera.position.set.mock.calls[mockCamera.position.set.mock.calls.length - 1];

      // Larger area should require camera to be further away
      const smallDistance = Math.sqrt(smallAreaPosition[0]**2 + smallAreaPosition[1]**2 + smallAreaPosition[2]**2);
      const largeDistance = Math.sqrt(largeAreaPosition[0]**2 + largeAreaPosition[1]**2 + largeAreaPosition[2]**2);
      
      expect(largeDistance).toBeGreaterThan(smallDistance);
    });
  });

  describe('Reset to Default', () => {
    it('should reset camera to default position', async () => {
      // Move camera away from default
      await cameraController.smoothTransition({ x: 10, y: 10, z: 10 }, { x: 0, y: 0, z: 0 }, 0.1);
      
      // Reset to default
      await cameraController.resetToDefault(0.5);

      expect(mockCamera.position.set).toHaveBeenLastCalledWith(0, 5, 10);
      expect(cameraController.isCinematicMode()).toBe(false);
    });

    it('should restore original FOV when resetting', async () => {
      // Enable cinematic mode (changes FOV)
      cameraController.enableCinematicMode(true);
      
      // Reset should restore original FOV
      await cameraController.resetToDefault(0.1);

      expect(mockCamera.fov).toBe(75); // Original FOV
      expect(mockCamera.updateProjectionMatrix).toHaveBeenCalled();
    });
  });

  describe('Cinematic Mode', () => {
    it('should enable cinematic mode', () => {
      cameraController.enableCinematicMode(true);

      expect(cameraController.isCinematicMode()).toBe(true);
      expect(mockCamera.fov).toBeGreaterThan(75); // Should increase FOV
      expect(mockCamera.updateProjectionMatrix).toHaveBeenCalled();
    });

    it('should disable cinematic mode', () => {
      cameraController.enableCinematicMode(true);
      cameraController.enableCinematicMode(false);

      expect(cameraController.isCinematicMode()).toBe(false);
      expect(mockCamera.fov).toBe(75); // Should restore original FOV
    });

    it('should toggle cinematic mode', () => {
      expect(cameraController.isCinematicMode()).toBe(false);
      
      cameraController.enableCinematicMode(true);
      expect(cameraController.isCinematicMode()).toBe(true);
      
      cameraController.enableCinematicMode(false);
      expect(cameraController.isCinematicMode()).toBe(false);
    });
  });

  describe('Update Method', () => {
    it('should update camera state', () => {
      const deltaTime = 0.016; // 60fps

      expect(() => {
        cameraController.update(deltaTime);
      }).not.toThrow();
    });

    it('should handle variable delta times', () => {
      const deltaTimes = [0.008, 0.016, 0.033, 0.050]; // Different frame rates

      deltaTimes.forEach(deltaTime => {
        expect(() => {
          cameraController.update(deltaTime);
        }).not.toThrow();
      });
    });

    it('should update shake effects', () => {
      cameraController.shakeCamera(0.5, 1);
      
      // Update should process shake
      expect(() => {
        cameraController.update(0.016);
      }).not.toThrow();
    });

    it('should update transitions', () => {
      const targetPosition: Vector3 = { x: 1, y: 1, z: 1 };
      const targetLookAt: Vector3 = { x: 0, y: 0, z: 0 };
      
      cameraController.smoothTransition(targetPosition, targetLookAt, 1);
      
      // Update should process transition
      expect(() => {
        cameraController.update(0.016);
      }).not.toThrow();
    });
  });

  describe('Preset Camera Movements', () => {
    it('should perform dramatic reveal', async () => {
      const target: Vector3 = { x: 0, y: 0, z: 0 };
      const duration = 2;

      await cameraController.dramaticReveal(target, duration);

      expect(cameraController.isCinematicMode()).toBe(true);
      expect(mockCamera.position.set).toHaveBeenCalled();
      expect(mockCamera.lookAt).toHaveBeenCalledWith(target.x, target.y, target.z);
    });

    it('should perform crisis zoom with shake', async () => {
      const crisisCenter: Vector3 = { x: 1, y: 1, z: 1 };
      const intensity = 0.8;

      await cameraController.crisisZoom(crisisCenter, intensity);

      expect(mockCamera.lookAt).toHaveBeenCalledWith(
        crisisCenter.x, 
        crisisCenter.y, 
        crisisCenter.z
      );
      expect(cameraController.isShaking()).toBe(true);
    });

    it('should perform celebration sweep', async () => {
      const devices: Vector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 2 }
      ];
      const duration = 3;

      await cameraController.celebrationSweep(devices, duration);

      expect(cameraController.isCinematicMode()).toBe(true);
      expect(mockCamera.position.set).toHaveBeenCalled();
    });

    it('should handle empty device list in celebration sweep', async () => {
      const devices: Vector3[] = [];
      const duration = 2;

      await expect(
        cameraController.celebrationSweep(devices, duration)
      ).resolves.not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should pan to target', async () => {
      const target: Vector3 = { x: 3, y: 2, z: 1 };
      const duration = 1;

      await cameraController.panTo(target, duration);

      expect(mockCamera.lookAt).toHaveBeenCalledWith(target.x, target.y, target.z);
    });

    it('should orbit around center', async () => {
      const center: Vector3 = { x: 0, y: 0, z: 0 };
      const angle = Math.PI / 2; // 90 degrees
      const duration = 1;

      await cameraController.orbitAround(center, angle, duration);

      expect(mockCamera.lookAt).toHaveBeenCalledWith(center.x, center.y, center.z);
    });

    it('should perform dolly zoom', async () => {
      const targetFOV = 90;
      const duration = 1;

      await cameraController.dollyZoom(targetFOV, duration);

      expect(mockCamera.fov).toBe(targetFOV);
      expect(mockCamera.updateProjectionMatrix).toHaveBeenCalled();
    });
  });

  describe('State Getters', () => {
    it('should return current position', () => {
      const position = cameraController.getCurrentPosition();
      expect(position).toEqual({ x: 0, y: 5, z: 10 });
    });

    it('should return current look-at point', () => {
      const lookAt = cameraController.getCurrentLookAtPoint();
      expect(lookAt).toBeDefined();
      expect(typeof lookAt.x).toBe('number');
      expect(typeof lookAt.y).toBe('number');
      expect(typeof lookAt.z).toBe('number');
    });

    it('should track transition state', () => {
      expect(cameraController.isTransitioning()).toBe(false);
      
      cameraController.smoothTransition({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, 1);
      expect(cameraController.isTransitioning()).toBe(true);
    });

    it('should track shake state', () => {
      expect(cameraController.isShaking()).toBe(false);
      
      cameraController.shakeCamera(0.5, 1);
      expect(cameraController.isShaking()).toBe(true);
    });

    it('should track cinematic mode state', () => {
      expect(cameraController.isCinematicMode()).toBe(false);
      
      cameraController.enableCinematicMode(true);
      expect(cameraController.isCinematicMode()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid positions gracefully', async () => {
      const invalidPosition: Vector3 = { x: NaN, y: Infinity, z: -Infinity };
      const validLookAt: Vector3 = { x: 0, y: 0, z: 0 };

      await expect(
        cameraController.smoothTransition(invalidPosition, validLookAt, 1)
      ).resolves.not.toThrow();
    });

    it('should handle negative durations', async () => {
      const position: Vector3 = { x: 1, y: 1, z: 1 };
      const lookAt: Vector3 = { x: 0, y: 0, z: 0 };

      await expect(
        cameraController.smoothTransition(position, lookAt, -1)
      ).resolves.not.toThrow();
    });

    it('should handle extreme shake values', () => {
      expect(() => {
        cameraController.shakeCamera(-1, 1);
        cameraController.shakeCamera(100, 1);
        cameraController.shakeCamera(0.5, -1);
        cameraController.shakeCamera(0.5, 1000);
      }).not.toThrow();
    });

    it('should handle rapid state changes', () => {
      expect(() => {
        cameraController.enableCinematicMode(true);
        cameraController.enableCinematicMode(false);
        cameraController.enableCinematicMode(true);
        cameraController.shakeCamera(0.5, 1);
        cameraController.shakeCamera(0, 0);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid updates', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        cameraController.update(0.016);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(100);
    });

    it('should handle concurrent operations', async () => {
      const operations = [
        cameraController.smoothTransition({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 }, 0.1),
        cameraController.zoomToDevice({ x: 2, y: 2, z: 2 }, 1, 0.1),
        cameraController.focusOnArea({ x: 3, y: 3, z: 3 }, 5, 0.1)
      ];

      cameraController.shakeCamera(0.5, 0.5);
      cameraController.enableCinematicMode(true);

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });
  });
});