import { GameRenderer } from '@/engine/GameRenderer';
import { GameScene, EnvironmentType, AnimationType, EffectType } from '@/types/core';

// Mock THREE.js
const mockTHREE = {
  Box3: jest.fn().mockImplementation(() => ({})),
  Mesh: jest.fn().mockImplementation(() => ({
    position: { 
      x: 0, y: 0, z: 0,
      set: jest.fn()
    },
    rotation: { 
      x: 0, y: 0, z: 0,
      set: jest.fn()
    },
    scale: { 
      x: 1, y: 1, z: 1,
      set: jest.fn()
    }
  })),
  Vector3: jest.fn().mockImplementation(() => ({ x: 0, y: 0, z: 0 })),
  Scene: jest.fn().mockImplementation(() => ({})),
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn()
  })),
  PerspectiveCamera: jest.fn().mockImplementation(() => ({})),
  AmbientLight: jest.fn().mockImplementation(() => ({})),
  DirectionalLight: jest.fn().mockImplementation(() => ({})),
  PointLight: jest.fn().mockImplementation(() => ({})),
  AnimationClip: jest.fn().mockImplementation(() => ({}))
};

(window as any).THREE = mockTHREE;

describe('GameRenderer', () => {
  let container: HTMLElement;
  let gameRenderer: GameRenderer;

  beforeEach(() => {
    container = (global as any).createMockContainer();
    document.body.appendChild(container);
    gameRenderer = new GameRenderer(container);
  });

  afterEach(() => {
    gameRenderer.dispose();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize renderer with correct settings', () => {
      expect(gameRenderer).toBeDefined();
      expect(container.children.length).toBe(1);
      expect(container.children[0].tagName).toBe('CANVAS');
    });

    it('should handle window resize', () => {
      const originalWidth = container.clientWidth;
      const originalHeight = container.clientHeight;
      
      // Mock resize
      Object.defineProperty(container, 'clientWidth', { value: 1200 });
      Object.defineProperty(container, 'clientHeight', { value: 800 });
      
      expect(() => gameRenderer.onWindowResize()).not.toThrow();
    });
  });

  describe('scene rendering', () => {
    it('should render a basic game scene', () => {
      const mockScene: GameScene = {
        environment: {
          id: 'test-room',
          type: EnvironmentType.HOME,
          meshes: [],
          bounds: new (window as any).THREE.Box3(),
          gridSize: 1
        },
        devices: [],
        camera: {
          position: { x: 10, y: 10, z: 10 },
          target: { x: 0, y: 0, z: 0 },
          zoom: 1,
          rotation: { x: 0, y: 0, z: 0 }
        },
        lighting: {
          ambient: new (window as any).THREE.AmbientLight(),
          directional: [],
          point: []
        },
        effects: []
      };

      expect(() => gameRenderer.renderScene(mockScene)).not.toThrow();
    });

    it('should handle scene with devices', () => {
      const mockDevice = {
        id: 'test-device',
        model3D: {
          mesh: new (window as any).THREE.Mesh(),
          materials: [],
          animations: [],
          boundingBox: new (window as any).THREE.Box3()
        },
        position: { x: 0, y: 0, z: 0 },
        animations: {
          idle: new (window as any).THREE.AnimationClip(),
          happy: new (window as any).THREE.AnimationClip(),
          confused: new (window as any).THREE.AnimationClip(),
          angry: new (window as any).THREE.AnimationClip(),
          communicating: new (window as any).THREE.AnimationClip()
        },
        personalityIndicators: [],
        connectionEffects: []
      };

      const mockScene: GameScene = {
        environment: {
          id: 'test-room',
          type: EnvironmentType.HOME,
          meshes: [],
          bounds: new (window as any).THREE.Box3(),
          gridSize: 1
        },
        devices: [mockDevice],
        camera: {
          position: { x: 10, y: 10, z: 10 },
          target: { x: 0, y: 0, z: 0 },
          zoom: 1,
          rotation: { x: 0, y: 0, z: 0 }
        },
        lighting: {
          ambient: new (window as any).THREE.AmbientLight(),
          directional: [],
          point: []
        },
        effects: []
      };

      expect(() => gameRenderer.renderScene(mockScene)).not.toThrow();
    });
  });

  describe('device animations', () => {
    it('should animate device with valid animation type', () => {
      const mockDevice = {
        id: 'test-device',
        model3D: {
          mesh: new (window as any).THREE.Mesh(),
          materials: [],
          animations: [],
          boundingBox: new (window as any).THREE.Box3()
        },
        position: { x: 0, y: 0, z: 0 },
        animations: {
          idle: new (window as any).THREE.AnimationClip(),
          happy: new (window as any).THREE.AnimationClip(),
          confused: new (window as any).THREE.AnimationClip(),
          angry: new (window as any).THREE.AnimationClip(),
          communicating: new (window as any).THREE.AnimationClip()
        },
        personalityIndicators: [{
          trait: 'helpful' as any,
          expression: 'happy' as any,
          colorScheme: { primary: '#00ff00', secondary: '#ffffff', accent: '#ffff00', glow: '#00ff00' },
          animationStyle: 'bouncy' as any
        }],
        connectionEffects: []
      };

      expect(() => gameRenderer.animateDevice(mockDevice, AnimationType.HAPPY)).not.toThrow();
    });

    it('should handle missing animation gracefully', () => {
      const mockDevice = {
        id: 'test-device',
        model3D: {
          mesh: new (window as any).THREE.Mesh(),
          materials: [],
          animations: [],
          boundingBox: new (window as any).THREE.Box3()
        },
        position: { x: 0, y: 0, z: 0 },
        animations: {
          idle: new (window as any).THREE.AnimationClip(),
          happy: new (window as any).THREE.AnimationClip(),
          confused: new (window as any).THREE.AnimationClip(),
          angry: new (window as any).THREE.AnimationClip(),
          communicating: new (window as any).THREE.AnimationClip()
        },
        personalityIndicators: [],
        connectionEffects: []
      };

      // Should not throw even if animation doesn't exist
      expect(() => gameRenderer.animateDevice(mockDevice, 'nonexistent' as any)).not.toThrow();
    });
  });

  describe('connection effects', () => {
    it('should show connection effect between devices', () => {
      const device1 = {
        id: 'device1',
        model3D: {
          mesh: new (window as any).THREE.Mesh(),
          materials: [],
          animations: [],
          boundingBox: new (window as any).THREE.Box3()
        },
        position: { x: 0, y: 0, z: 0 },
        animations: {
          idle: new (window as any).THREE.AnimationClip(),
          happy: new (window as any).THREE.AnimationClip(),
          confused: new (window as any).THREE.AnimationClip(),
          angry: new (window as any).THREE.AnimationClip(),
          communicating: new (window as any).THREE.AnimationClip()
        },
        personalityIndicators: [],
        connectionEffects: []
      };

      const device2 = {
        ...device1,
        id: 'device2',
        position: { x: 5, y: 0, z: 0 }
      };

      expect(() => gameRenderer.showConnectionEffect(device1, device2, EffectType.COOPERATION)).not.toThrow();
    });
  });

  describe('crisis effects', () => {
    it('should display crisis visual effects', () => {
      const mockCrisis = {
        type: 'system_overload',
        severity: 0.8,
        effects: [],
        screenShake: true,
        colorOverlay: '#ff0000'
      };

      expect(() => gameRenderer.displayCrisisEffect(mockCrisis)).not.toThrow();
    });

    it('should handle crisis without screen shake', () => {
      const mockCrisis = {
        type: 'minor_conflict',
        severity: 0.3,
        effects: [],
        screenShake: false,
        colorOverlay: '#ffaa00'
      };

      expect(() => gameRenderer.displayCrisisEffect(mockCrisis)).not.toThrow();
    });
  });

  describe('resource cleanup', () => {
    it('should dispose of resources properly', () => {
      expect(() => gameRenderer.dispose()).not.toThrow();
    });
  });
});