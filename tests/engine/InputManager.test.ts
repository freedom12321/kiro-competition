import { InputManager } from '@/engine/InputManager';
import { DragResult, InteractionResult, ClickResult } from '@/types/core';

describe('InputManager', () => {
  let container: HTMLElement;
  let inputManager: InputManager;
  let mockCamera: any;
  let mockRenderer: any;

  beforeEach(() => {
    container = (global as any).createMockContainer();
    document.body.appendChild(container);
    
    mockCamera = new (window as any).THREE.OrthographicCamera();
    mockRenderer = new (window as any).THREE.WebGLRenderer();
    
    inputManager = new InputManager(mockCamera, mockRenderer, container);
  });

  afterEach(() => {
    inputManager.dispose();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize input manager without errors', () => {
      expect(inputManager).toBeDefined();
    });

    it('should set up event listeners', () => {
      // Test that event listeners are properly attached
      const mouseEvent = new MouseEvent('click', { clientX: 100, clientY: 100 });
      expect(() => container.dispatchEvent(mouseEvent)).not.toThrow();
    });
  });

  describe('device drag operations', () => {
    it('should handle successful device drag', () => {
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

      const result = inputManager.handleDeviceDrag(mockDevice, { x: 100, y: 100 });
      expect(result).toBe(DragResult.SUCCESS);
    });

    it('should detect out of bounds drag', () => {
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

      // Mock isWithinBounds to return false
      (inputManager as any).isWithinBounds = jest.fn(() => false);
      
      const result = inputManager.handleDeviceDrag(mockDevice, { x: 1000, y: 1000 });
      expect(result).toBe(DragResult.OUT_OF_BOUNDS);
    });

    it('should set drag callback and call it', () => {
      const mockCallback = jest.fn(() => DragResult.SUCCESS);
      inputManager.setDeviceDragCallback(mockCallback);

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

      inputManager.handleDeviceDrag(mockDevice, { x: 100, y: 100 });
      expect(mockCallback).toHaveBeenCalledWith(mockDevice, { x: 100, y: 100 });
    });
  });

  describe('room interactions', () => {
    it('should handle empty space interaction', () => {
      const result = inputManager.handleRoomInteraction({ x: 100, y: 100 });
      expect(result).toBe(InteractionResult.EMPTY_SPACE);
    });

    it('should set room interaction callback and call it', () => {
      const mockCallback = jest.fn(() => InteractionResult.EMPTY_SPACE);
      inputManager.setRoomInteractionCallback(mockCallback);

      inputManager.handleRoomInteraction({ x: 100, y: 100 });
      expect(mockCallback).toHaveBeenCalledWith({ x: 100, y: 100 });
    });
  });

  describe('UI interactions', () => {
    it('should handle UI element click', () => {
      const mockUIElement = {
        id: 'test-button',
        type: 'button' as any,
        position: { x: 100, y: 100 },
        size: { x: 50, y: 30 },
        visible: true,
        interactive: true
      };

      const result = inputManager.handleUIClick(mockUIElement);
      expect(result).toBe(ClickResult.HANDLED);
    });

    it('should set UI click callback and call it', () => {
      const mockCallback = jest.fn(() => ClickResult.HANDLED);
      inputManager.setUIClickCallback(mockCallback);

      const mockUIElement = {
        id: 'test-button',
        type: 'button' as any,
        position: { x: 100, y: 100 },
        size: { x: 50, y: 30 },
        visible: true,
        interactive: true
      };

      inputManager.handleUIClick(mockUIElement);
      expect(mockCallback).toHaveBeenCalledWith(mockUIElement);
    });
  });

  describe('tutorial mode', () => {
    it('should enable tutorial mode with constraints', () => {
      const constraints = {
        allowedActions: ['drag_device', 'ui_click'],
        highlightedElements: ['device-library'],
        restrictedAreas: [new (window as any).THREE.Box3()]
      };

      expect(() => inputManager.enableTutorialMode(constraints)).not.toThrow();
    });

    it('should disable tutorial mode', () => {
      const constraints = {
        allowedActions: ['drag_device'],
        highlightedElements: [],
        restrictedAreas: []
      };

      inputManager.enableTutorialMode(constraints);
      expect(() => inputManager.disableTutorialMode()).not.toThrow();
    });

    it('should restrict actions in tutorial mode', () => {
      const constraints = {
        allowedActions: [], // No actions allowed
        highlightedElements: [],
        restrictedAreas: []
      };

      inputManager.enableTutorialMode(constraints);

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

      const result = inputManager.handleDeviceDrag(mockDevice, { x: 100, y: 100 });
      expect(result).toBe(DragResult.INVALID_POSITION);
    });
  });

  describe('mouse events', () => {
    it('should handle mouse down event', () => {
      const mouseEvent = new MouseEvent('mousedown', { 
        clientX: 100, 
        clientY: 100,
        bubbles: true 
      });
      
      expect(() => container.dispatchEvent(mouseEvent)).not.toThrow();
    });

    it('should handle mouse move event', () => {
      const mouseEvent = new MouseEvent('mousemove', { 
        clientX: 150, 
        clientY: 150,
        bubbles: true 
      });
      
      expect(() => container.dispatchEvent(mouseEvent)).not.toThrow();
    });

    it('should handle mouse up event', () => {
      const mouseEvent = new MouseEvent('mouseup', { 
        clientX: 200, 
        clientY: 200,
        bubbles: true 
      });
      
      expect(() => container.dispatchEvent(mouseEvent)).not.toThrow();
    });
  });

  describe('touch events', () => {
    it('should handle touch start event', () => {
      const touchEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 1,
          target: container,
          clientX: 100,
          clientY: 100,
          radiusX: 10,
          radiusY: 10,
          rotationAngle: 0,
          force: 1
        })],
        bubbles: true
      });
      
      expect(() => container.dispatchEvent(touchEvent)).not.toThrow();
    });
  });

  describe('keyboard events', () => {
    it('should handle escape key to cancel drag', () => {
      const keyEvent = new KeyboardEvent('keydown', { 
        code: 'Escape',
        bubbles: true 
      });
      
      expect(() => document.dispatchEvent(keyEvent)).not.toThrow();
    });

    it('should handle delete key', () => {
      const keyEvent = new KeyboardEvent('keydown', { 
        code: 'Delete',
        bubbles: true 
      });
      
      expect(() => document.dispatchEvent(keyEvent)).not.toThrow();
    });
  });

  describe('resource cleanup', () => {
    it('should dispose of resources and remove event listeners', () => {
      expect(() => inputManager.dispose()).not.toThrow();
    });
  });
});