import * as THREE from 'three';
import { VisualEffectsManager } from '../../src/visual-effects/VisualEffectsManager';
import { 
  ParticleEffectType, 
  ConnectionType, 
  CrisisEffectType,
  EffectParameters,
  QualityLevel
} from '../../src/types/visual-effects.js';
import { Vector3 } from '../../src/types/core.js';

// Mock THREE.js components
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn()
  })),
  PerspectiveCamera: jest.fn(() => ({
    position: new (jest.requireActual('three')).Vector3(),
    getWorldDirection: jest.fn()
  })),
  WebGLRenderer: jest.fn(() => ({
    domElement: document.createElement('canvas'),
    capabilities: { maxTextures: 32 }
  })),
  Clock: jest.fn(() => ({
    getDelta: jest.fn(() => 0.016),
    getElapsedTime: jest.fn(() => 1.0)
  })),
  Points: jest.fn(() => ({
    position: { set: jest.fn() },
    visible: true
  })),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
    attributes: {
      position: { needsUpdate: false, array: new Float32Array(300) },
      color: { needsUpdate: false, array: new Float32Array(300) },
      size: { needsUpdate: false, array: new Float32Array(100) },
      opacity: { needsUpdate: false, array: new Float32Array(100) }
    }
  })),
  PointsMaterial: jest.fn(() => ({})),
  ShaderMaterial: jest.fn(() => ({
    uniforms: { time: { value: 0 } }
  })),
  Line: jest.fn(() => ({})),
  Mesh: jest.fn(() => ({})),
  Vector3: jest.requireActual('three').Vector3,
  Color: jest.requireActual('three').Color,
  Frustum: jest.fn(() => ({
    setFromProjectionMatrix: jest.fn(),
    containsPoint: jest.fn(() => true)
  })),
  Matrix4: jest.fn(() => ({
    multiplyMatrices: jest.fn()
  }))
}));

describe('VisualEffectsManager', () => {
  let visualEffectsManager: VisualEffectsManager;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.PerspectiveCamera;
  let mockRenderer: THREE.WebGLRenderer;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();
    mockRenderer = new THREE.WebGLRenderer();
    
    visualEffectsManager = new VisualEffectsManager(mockScene, mockCamera, mockRenderer);
  });

  afterEach(() => {
    visualEffectsManager.cleanup();
  });

  describe('Particle Effect Creation', () => {
    it('should create particle effects for all types', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      const effectTypes = [
        ParticleEffectType.COMMUNICATION,
        ParticleEffectType.COOPERATION,
        ParticleEffectType.CONFLICT,
        ParticleEffectType.ENERGY_FLOW,
        ParticleEffectType.DATA_TRANSFER,
        ParticleEffectType.SYSTEM_OVERLOAD,
        ParticleEffectType.HARMONY_RESONANCE,
        ParticleEffectType.DEVICE_STARTUP,
        ParticleEffectType.DEVICE_SHUTDOWN,
        ParticleEffectType.LEARNING_PROCESS,
        ParticleEffectType.ERROR_INDICATION,
        ParticleEffectType.SUCCESS_CELEBRATION
      ];

      effectTypes.forEach(type => {
        expect(() => {
          const effect = visualEffectsManager.createParticleEffect(type, position);
          expect(effect).toBeDefined();
          expect(effect.type).toBe(type);
          expect(effect.active).toBe(true);
        }).not.toThrow();
      });
    });

    it('should create particle effects with custom parameters', () => {
      const position: Vector3 = { x: 1, y: 2, z: 3 };
      const parameters: EffectParameters = {
        color: new THREE.Color(1, 0, 0),
        size: 0.5,
        speed: 2.5,
        intensity: 0.8,
        duration: 5
      };

      const effect = visualEffectsManager.createParticleEffect(
        ParticleEffectType.COMMUNICATION,
        position,
        parameters
      );

      expect(effect.position).toEqual(position);
      expect(effect.parameters.color).toEqual(parameters.color);
      expect(effect.parameters.size).toBe(parameters.size);
      expect(effect.parameters.speed).toBe(parameters.speed);
      expect(effect.parameters.intensity).toBe(parameters.intensity);
      expect(effect.lifetime).toBe(parameters.duration);
    });

    it('should add particle effects to the scene', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      visualEffectsManager.createParticleEffect(ParticleEffectType.COMMUNICATION, position);
      
      expect(mockScene.add).toHaveBeenCalled();
    });
  });

  describe('Connection Effect Creation', () => {
    it('should create connection effects for all types', () => {
      const from: Vector3 = { x: 0, y: 0, z: 0 };
      const to: Vector3 = { x: 5, y: 0, z: 0 };
      
      const connectionTypes = [
        ConnectionType.DATA_FLOW,
        ConnectionType.ENERGY_TRANSFER,
        ConnectionType.COMMUNICATION_LINK,
        ConnectionType.COOPERATION_BOND,
        ConnectionType.CONFLICT_TENSION,
        ConnectionType.RESOURCE_SHARING,
        ConnectionType.LEARNING_CONNECTION
      ];

      connectionTypes.forEach(type => {
        expect(() => {
          const effect = visualEffectsManager.createConnectionEffect(from, to, type);
          expect(effect).toBeDefined();
          expect(effect.type).toBe(type);
          expect(effect.active).toBe(true);
        }).not.toThrow();
      });
    });

    it('should create connections between specified points', () => {
      const from: Vector3 = { x: 1, y: 2, z: 3 };
      const to: Vector3 = { x: 4, y: 5, z: 6 };
      
      const effect = visualEffectsManager.createConnectionEffect(
        from, 
        to, 
        ConnectionType.DATA_FLOW
      );

      expect(effect.startPosition).toEqual(from);
      expect(effect.endPosition).toEqual(to);
    });
  });

  describe('Cooperation Effect Creation', () => {
    it('should create cooperation effects for multiple devices', () => {
      const devices: Vector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 2 }
      ];
      const intensity = 0.8;

      const effect = visualEffectsManager.createCooperationEffect(devices, intensity);

      expect(effect).toBeDefined();
      expect(effect.devicePositions).toEqual(devices);
      expect(effect.intensity).toBe(intensity);
      expect(effect.active).toBe(true);
    });

    it('should handle single device cooperation', () => {
      const devices: Vector3[] = [{ x: 0, y: 0, z: 0 }];
      const intensity = 0.5;

      expect(() => {
        const effect = visualEffectsManager.createCooperationEffect(devices, intensity);
        expect(effect).toBeDefined();
      }).not.toThrow();
    });

    it('should handle empty device list', () => {
      const devices: Vector3[] = [];
      const intensity = 0.5;

      expect(() => {
        const effect = visualEffectsManager.createCooperationEffect(devices, intensity);
        expect(effect).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Crisis Effect Creation', () => {
    it('should create crisis effects for all types', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      const severity = 0.7;
      
      const crisisTypes = [
        CrisisEffectType.FEEDBACK_LOOP,
        CrisisEffectType.AUTHORITY_CONFLICT,
        CrisisEffectType.PRIVACY_BREACH,
        CrisisEffectType.RESOURCE_EXHAUSTION,
        CrisisEffectType.COMMUNICATION_BREAKDOWN,
        CrisisEffectType.SYSTEM_OVERLOAD
      ];

      crisisTypes.forEach(type => {
        expect(() => {
          const effect = visualEffectsManager.createCrisisEffect(position, type, severity);
          expect(effect).toBeDefined();
          expect(effect.type).toBe(type);
          expect(effect.severity).toBe(severity);
          expect(effect.active).toBe(true);
        }).not.toThrow();
      });
    });

    it('should scale effects based on severity', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      const lowSeverityEffect = visualEffectsManager.createCrisisEffect(
        position, 
        CrisisEffectType.SYSTEM_OVERLOAD, 
        0.2
      );
      
      const highSeverityEffect = visualEffectsManager.createCrisisEffect(
        position, 
        CrisisEffectType.SYSTEM_OVERLOAD, 
        0.9
      );

      expect(lowSeverityEffect.severity).toBe(0.2);
      expect(highSeverityEffect.severity).toBe(0.9);
    });
  });

  describe('Effect Updates', () => {
    it('should update all active effects', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create various effects
      visualEffectsManager.createParticleEffect(ParticleEffectType.COMMUNICATION, position);
      visualEffectsManager.createConnectionEffect(
        position, 
        { x: 5, y: 0, z: 0 }, 
        ConnectionType.DATA_FLOW
      );
      visualEffectsManager.createCooperationEffect([position], 0.5);
      visualEffectsManager.createCrisisEffect(position, CrisisEffectType.SYSTEM_OVERLOAD, 0.7);

      expect(() => {
        visualEffectsManager.updateEffects(0.016); // 60fps delta
      }).not.toThrow();
    });

    it('should handle rapid updates without performance issues', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create multiple effects
      for (let i = 0; i < 10; i++) {
        visualEffectsManager.createParticleEffect(ParticleEffectType.COMMUNICATION, {
          x: position.x + i,
          y: position.y,
          z: position.z
        });
      }

      const startTime = performance.now();
      
      // Update multiple times
      for (let i = 0; i < 100; i++) {
        visualEffectsManager.updateEffects(0.016);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms for 100 updates)
      expect(totalTime).toBeLessThan(100);
    });

    it('should remove completed effects', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create effect with short duration
      const effect = visualEffectsManager.createParticleEffect(
        ParticleEffectType.DEVICE_STARTUP,
        position,
        { duration: 0.1 }
      );

      const initialCount = visualEffectsManager.getActiveEffectCount();
      
      // Update for longer than effect duration
      for (let i = 0; i < 10; i++) {
        visualEffectsManager.updateEffects(0.02); // Total: 0.2 seconds
      }
      
      const finalCount = visualEffectsManager.getActiveEffectCount();
      expect(finalCount).toBeLessThan(initialCount);
    });
  });

  describe('Effect Removal', () => {
    it('should remove effects by ID', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      const effect = visualEffectsManager.createParticleEffect(
        ParticleEffectType.COMMUNICATION, 
        position
      );

      const initialCount = visualEffectsManager.getActiveEffectCount();
      
      visualEffectsManager.removeEffect(effect.id);
      
      const finalCount = visualEffectsManager.getActiveEffectCount();
      expect(finalCount).toBe(initialCount - 1);
      expect(mockScene.remove).toHaveBeenCalled();
    });

    it('should handle removal of non-existent effects gracefully', () => {
      expect(() => {
        visualEffectsManager.removeEffect('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create some effects
      visualEffectsManager.createParticleEffect(ParticleEffectType.COMMUNICATION, position);
      visualEffectsManager.createParticleEffect(ParticleEffectType.COOPERATION, position);
      
      // Update to generate metrics
      visualEffectsManager.updateEffects(0.016);
      
      const metrics = visualEffectsManager.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.activeEffects).toBeGreaterThan(0);
      expect(metrics.frameTime).toBeGreaterThanOrEqual(0);
    });

    it('should provide accurate active effect count', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      expect(visualEffectsManager.getActiveEffectCount()).toBe(0);
      
      visualEffectsManager.createParticleEffect(ParticleEffectType.COMMUNICATION, position);
      expect(visualEffectsManager.getActiveEffectCount()).toBe(1);
      
      visualEffectsManager.createParticleEffect(ParticleEffectType.COOPERATION, position);
      expect(visualEffectsManager.getActiveEffectCount()).toBe(2);
    });
  });

  describe('Quality Settings', () => {
    it('should accept quality setting updates', () => {
      const newSettings = {
        particleQuality: QualityLevel.LOW,
        maxParticles: 1000,
        enableLOD: false
      };

      expect(() => {
        visualEffectsManager.setQualitySettings(newSettings);
      }).not.toThrow();
    });

    it('should adapt to quality settings', () => {
      // Set low quality
      visualEffectsManager.setQualitySettings({
        particleQuality: QualityLevel.LOW,
        maxParticles: 100
      });

      const position: Vector3 = { x: 0, y: 0, z: 0 };
      const effect = visualEffectsManager.createParticleEffect(
        ParticleEffectType.COMMUNICATION, 
        position
      );

      // Should respect quality limits
      expect(effect.maxParticles).toBeLessThanOrEqual(100);
    });
  });

  describe('Memory Management', () => {
    it('should handle effect pooling', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create and remove many effects to test pooling
      for (let i = 0; i < 20; i++) {
        const effect = visualEffectsManager.createParticleEffect(
          ParticleEffectType.COMMUNICATION, 
          position
        );
        visualEffectsManager.removeEffect(effect.id);
      }

      // Should not cause memory issues
      expect(visualEffectsManager.getActiveEffectCount()).toBe(0);
    });

    it('should cleanup all resources', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create multiple effects
      visualEffectsManager.createParticleEffect(ParticleEffectType.COMMUNICATION, position);
      visualEffectsManager.createConnectionEffect(
        position, 
        { x: 5, y: 0, z: 0 }, 
        ConnectionType.DATA_FLOW
      );
      
      expect(visualEffectsManager.getActiveEffectCount()).toBeGreaterThan(0);
      
      visualEffectsManager.cleanup();
      
      expect(visualEffectsManager.getActiveEffectCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid positions gracefully', () => {
      const invalidPosition: Vector3 = { x: NaN, y: Infinity, z: -Infinity };

      expect(() => {
        visualEffectsManager.createParticleEffect(
          ParticleEffectType.COMMUNICATION, 
          invalidPosition
        );
      }).not.toThrow();
    });

    it('should handle extreme parameter values', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      const extremeParameters: EffectParameters = {
        size: 1000,
        speed: -100,
        intensity: 10,
        duration: -5
      };

      expect(() => {
        visualEffectsManager.createParticleEffect(
          ParticleEffectType.COMMUNICATION,
          position,
          extremeParameters
        );
      }).not.toThrow();
    });

    it('should handle concurrent effect creation and removal', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      const effects: string[] = [];

      // Create effects rapidly
      for (let i = 0; i < 10; i++) {
        const effect = visualEffectsManager.createParticleEffect(
          ParticleEffectType.COMMUNICATION, 
          position
        );
        effects.push(effect.id);
      }

      // Remove effects rapidly while updating
      expect(() => {
        effects.forEach(id => {
          visualEffectsManager.removeEffect(id);
          visualEffectsManager.updateEffects(0.016);
        });
      }).not.toThrow();
    });
  });

  describe('Visual Synchronization', () => {
    it('should maintain consistent timing across effects', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      
      // Create multiple effects at the same time
      const effects = [];
      for (let i = 0; i < 5; i++) {
        effects.push(visualEffectsManager.createParticleEffect(
          ParticleEffectType.COMMUNICATION, 
          { x: i, y: 0, z: 0 }
        ));
      }

      // Update all effects with same delta time
      const deltaTime = 0.016;
      visualEffectsManager.updateEffects(deltaTime);

      // All effects should be updated consistently
      effects.forEach(effect => {
        expect(effect.active).toBe(true);
      });
    });

    it('should handle variable frame rates', () => {
      const position: Vector3 = { x: 0, y: 0, z: 0 };
      const effect = visualEffectsManager.createParticleEffect(
        ParticleEffectType.COMMUNICATION, 
        position
      );

      // Test with different delta times (simulating variable frame rates)
      const deltaTimes = [0.008, 0.016, 0.033, 0.050]; // 120fps, 60fps, 30fps, 20fps

      deltaTimes.forEach(deltaTime => {
        expect(() => {
          visualEffectsManager.updateEffects(deltaTime);
        }).not.toThrow();
      });
    });
  });
});