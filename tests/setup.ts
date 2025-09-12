// Jest setup file for AI Habitat tests

// Mock Three.js for testing
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    children: []
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: document.createElement('canvas'),
    shadowMap: {
      enabled: false,
      type: 0
    },
    outputColorSpace: '',
    toneMapping: 0,
    toneMappingExposure: 1
  })),
  OrthographicCamera: jest.fn(() => ({
    position: { set: jest.fn(), copy: jest.fn(), clone: jest.fn(() => ({ x: 0, y: 0, z: 0 })) },
    lookAt: jest.fn(),
    updateProjectionMatrix: jest.fn(),
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  })),
  AmbientLight: jest.fn(),
  DirectionalLight: jest.fn(() => ({
    position: { set: jest.fn() },
    castShadow: false,
    shadow: {
      mapSize: { width: 0, height: 0 },
      camera: { near: 0, far: 0 }
    }
  })),
  Color: jest.fn(),
  Fog: jest.fn(),
  AnimationMixer: jest.fn(() => ({
    update: jest.fn(),
    stopAllAction: jest.fn(),
    clipAction: jest.fn(() => ({
      reset: jest.fn(),
      fadeIn: jest.fn(),
      play: jest.fn(),
      setEffectiveTimeScale: jest.fn()
    }))
  })),
  Clock: jest.fn(() => ({
    getDelta: jest.fn(() => 0.016)
  })),
  Raycaster: jest.fn(() => ({
    setFromCamera: jest.fn(),
    ray: {
      intersectPlane: jest.fn()
    }
  })),
  Vector2: jest.fn(() => ({ x: 0, y: 0 })),
  Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
  Box3: jest.fn(() => ({
    containsPoint: jest.fn(() => true)
  })),
  Plane: jest.fn(),
  BufferGeometry: jest.fn(() => ({
    setFromPoints: jest.fn(() => ({})),
    setAttribute: jest.fn()
  })),
  BufferAttribute: jest.fn(),
  LineBasicMaterial: jest.fn(() => ({
    opacity: 1
  })),
  PointsMaterial: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  PlaneGeometry: jest.fn(),
  Line: jest.fn(() => ({
    material: { opacity: 1 }
  })),
  Points: jest.fn(),
  Mesh: jest.fn(() => ({
    position: { set: jest.fn() }
  })),
  PCFSoftShadowMap: 0,
  SRGBColorSpace: '',
  ACESFilmicToneMapping: 0
}));

// Mock GSAP for animations
jest.mock('gsap', () => ({
  to: jest.fn(),
  from: jest.fn(),
  timeline: jest.fn(() => ({
    to: jest.fn(),
    from: jest.fn()
  }))
}));

// Mock DOM methods
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((cb) => setTimeout(cb, 16))
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn()
});

// Mock HTMLElement methods
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
  left: 0,
  top: 0,
  width: 800,
  height: 600,
  right: 800,
  bottom: 600,
  x: 0,
  y: 0,
  toJSON: jest.fn()
}));

// Global test utilities
global.createMockContainer = () => {
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.height = '600px';
  return container;
};

// Console setup for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});