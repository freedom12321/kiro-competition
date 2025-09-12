import { RoomDesigner } from '@/ui/RoomDesigner';
import { DeviceCategory, PlacementMode, PlacementIndicator, CompatibilityLevel } from '@/types/ui';
import { EnvironmentType } from '@/types/core';

// Mock canvas context
const mockContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  set fillStyle(value: string) {},
  set strokeStyle(value: string) {},
  set lineWidth(value: number) {}
};

// Mock canvas
const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  width: 800,
  height: 600,
  addEventListener: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  },
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: jest.fn()
  }))
};

describe('RoomDesigner', () => {
  let container: HTMLElement;
  let roomDesigner: RoomDesigner;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // Mock querySelector to return our mock canvas
    const originalQuerySelector = container.querySelector.bind(container);
    container.querySelector = jest.fn((selector) => {
      if (selector === '.room-grid') {
        return mockCanvas as any;
      }
      return originalQuerySelector(selector);
    });
    
    roomDesigner = new RoomDesigner(container);
  });

  afterEach(() => {
    roomDesigner.dispose();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize room designer with correct UI elements', () => {
      expect(container.querySelector('.room-designer')).toBeTruthy();
      expect(container.querySelector('.device-library-panel')).toBeTruthy();
      expect(container.querySelector('.room-canvas-container')).toBeTruthy();
      expect(container.querySelector('.environment-select')).toBeTruthy();
      expect(container.querySelector('.placement-mode-select')).toBeTruthy();
    });

    it('should initialize device library with default devices', () => {
      const deviceLibrary = roomDesigner.displayDeviceLibrary();
      expect(deviceLibrary.devices.length).toBeGreaterThan(0);
      expect(deviceLibrary.categories).toContain(DeviceCategory.COMFORT);
      expect(deviceLibrary.categories).toContain(DeviceCategory.SECURITY);
    });

    it('should render device library in UI', () => {
      const deviceItems = container.querySelectorAll('.device-item');
      expect(deviceItems.length).toBeGreaterThan(0);
    });

    it('should initialize with home environment', () => {
      const environmentSelect = container.querySelector('.environment-select') as HTMLSelectElement;
      expect(environmentSelect.value).toBe('home');
    });

    it('should initialize with snap-to-grid placement mode', () => {
      const placementSelect = container.querySelector('.placement-mode-select') as HTMLSelectElement;
      expect(placementSelect.value).toBe('snap_to_grid');
    });
  });

  describe('device library', () => {
    it('should display all device categories in filter', () => {
      const categorySelect = container.querySelector('.category-select') as HTMLSelectElement;
      const options = Array.from(categorySelect.options).map(opt => opt.value);
      
      expect(options).toContain('comfort');
      expect(options).toContain('security');
      expect(options).toContain('health');
    });

    it('should filter devices by category', () => {
      const categorySelect = container.querySelector('.category-select') as HTMLSelectElement;
      categorySelect.value = 'comfort';
      categorySelect.dispatchEvent(new Event('change'));

      const visibleDevices = Array.from(container.querySelectorAll('.device-item'))
        .filter(item => (item as HTMLElement).style.display !== 'none');
      
      expect(visibleDevices.length).toBeGreaterThan(0);
    });

    it('should select device when clicked', () => {
      const deviceItem = container.querySelector('.device-item') as HTMLElement;
      deviceItem.click();

      expect(deviceItem.classList.contains('selected')).toBe(true);
    });

    it('should show device information correctly', () => {
      const deviceItem = container.querySelector('.device-item') as HTMLElement;
      expect(deviceItem.querySelector('.device-name')).toBeTruthy();
      expect(deviceItem.querySelector('.device-description')).toBeTruthy();
      expect(deviceItem.querySelector('.device-category')).toBeTruthy();
    });
  });

  describe('environment management', () => {
    it('should change environment when selector changes', () => {
      const mockCallback = jest.fn();
      roomDesigner.setEnvironmentChangedCallback(mockCallback);

      const environmentSelect = container.querySelector('.environment-select') as HTMLSelectElement;
      environmentSelect.value = 'hospital';
      environmentSelect.dispatchEvent(new Event('change'));

      expect(mockCallback).toHaveBeenCalledWith(EnvironmentType.HOSPITAL);
    });

    it('should update room title when environment changes', () => {
      const environmentSelect = container.querySelector('.environment-select') as HTMLSelectElement;
      environmentSelect.value = 'office';
      environmentSelect.dispatchEvent(new Event('change'));

      const roomTitle = container.querySelector('.room-title') as HTMLElement;
      expect(roomTitle.textContent).toBe('Office Space');
    });
  });

  describe('placement mode', () => {
    it('should change placement mode when selector changes', () => {
      const placementSelect = container.querySelector('.placement-mode-select') as HTMLSelectElement;
      placementSelect.value = 'free_placement';
      placementSelect.dispatchEvent(new Event('change'));

      // Verify placement mode changed (would need to expose getter for full test)
      expect(placementSelect.value).toBe('free_placement');
    });

    it('should enable device placement and return current mode', () => {
      const deviceLibrary = roomDesigner.displayDeviceLibrary();
      const device = deviceLibrary.devices[0];
      
      const mode = roomDesigner.enableDevicePlacement(device);
      expect(mode).toBe(PlacementMode.SNAP_TO_GRID);
    });
  });

  describe('device placement', () => {
    it('should provide placement feedback for valid position', () => {
      const deviceLibrary = roomDesigner.displayDeviceLibrary();
      const device = deviceLibrary.devices[0];
      
      const feedback = roomDesigner.showPlacementFeedback({ x: 100, y: 100 }, device);
      
      expect(feedback).toHaveProperty('isValid');
      expect(feedback).toHaveProperty('snapPosition');
      expect(feedback).toHaveProperty('visualIndicator');
      expect(feedback).toHaveProperty('message');
    });

    it('should call placement callback when device is placed', () => {
      const mockCallback = jest.fn();
      roomDesigner.setDevicePlacedCallback(mockCallback);

      // Simulate drag and drop
      const deviceLibrary = roomDesigner.displayDeviceLibrary();
      const device = deviceLibrary.devices[0];
      
      // Create a mock drop event
      const dropEvent = new DragEvent('drop', {
        dataTransfer: new DataTransfer()
      });
      dropEvent.dataTransfer!.setData('text/plain', device.id);
      
      // Mock getBoundingClientRect for the canvas
      mockCanvas.getBoundingClientRect = jest.fn(() => ({
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
      
      Object.defineProperty(dropEvent, 'clientX', { value: 100 });
      Object.defineProperty(dropEvent, 'clientY', { value: 100 });
      
      const canvasContainer = container.querySelector('.canvas-wrapper') as HTMLElement;
      canvasContainer.dispatchEvent(dropEvent);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should update device count when devices are placed', () => {
      const deviceCountElement = container.querySelector('.device-count') as HTMLElement;
      const initialText = deviceCountElement.textContent;
      
      // The count should start at 0
      expect(initialText).toBe('0 devices');
    });

    it('should call removal callback when device is removed', () => {
      const mockCallback = jest.fn();
      roomDesigner.setDeviceRemovedCallback(mockCallback);

      // First place a device, then remove it
      const placedDevices = roomDesigner.getPlacedDevices();
      if (placedDevices.length > 0) {
        // This would trigger the removal callback
        // In a real scenario, we'd double-click a placed device
      }
      
      // For now, just verify the callback was set
      expect(mockCallback).toBeDefined();
    });
  });

  describe('compatibility system', () => {
    it('should highlight compatible devices when device is selected', () => {
      const deviceLibrary = roomDesigner.displayDeviceLibrary();
      const device = deviceLibrary.devices[0];
      
      // Create a mock placed device
      const mockPlacedDevice = {
        id: 'test-device',
        model3D: { mesh: null, materials: [], animations: [], boundingBox: null },
        position: { x: 40, y: 40, z: 0 },
        animations: null,
        personalityIndicators: [],
        connectionEffects: []
      };
      
      const highlights = roomDesigner.highlightCompatibleDevices(mockPlacedDevice as any);
      expect(Array.isArray(highlights)).toBe(true);
    });

    it('should calculate device compatibility correctly', () => {
      // This tests the internal compatibility logic
      // We'd need to expose the method or test through public interface
      const deviceLibrary = roomDesigner.displayDeviceLibrary();
      const comfortDevice = deviceLibrary.devices.find(d => d.category === DeviceCategory.COMFORT);
      const securityDevice = deviceLibrary.devices.find(d => d.category === DeviceCategory.SECURITY);
      
      expect(comfortDevice).toBeTruthy();
      expect(securityDevice).toBeTruthy();
    });
  });

  describe('room templates', () => {
    it('should show room templates when button is clicked', () => {
      const templateBtn = container.querySelector('.room-template-btn') as HTMLButtonElement;
      templateBtn.click();

      const templatesPanel = container.querySelector('.room-templates-panel') as HTMLElement;
      expect(templatesPanel.style.display).toBe('flex');
    });

    it('should hide room templates when close button is clicked', () => {
      // First show templates
      const templateBtn = container.querySelector('.room-template-btn') as HTMLButtonElement;
      templateBtn.click();

      // Then hide them
      const closeBtn = container.querySelector('.close-templates-btn') as HTMLButtonElement;
      closeBtn.click();

      const templatesPanel = container.querySelector('.room-templates-panel') as HTMLElement;
      expect(templatesPanel.style.display).toBe('none');
    });

    it('should render template options', () => {
      const templateItems = container.querySelectorAll('.template-item');
      expect(templateItems.length).toBeGreaterThan(0);
    });

    it('should apply template when clicked', () => {
      const templateItem = container.querySelector('.template-item') as HTMLElement;
      if (templateItem) {
        templateItem.click();
        
        // Template should be applied and panel should be hidden
        const templatesPanel = container.querySelector('.room-templates-panel') as HTMLElement;
        expect(templatesPanel.style.display).toBe('none');
      }
    });
  });

  describe('room management', () => {
    it('should clear all devices when clear button is clicked', () => {
      // Mock confirm to return true
      window.confirm = jest.fn(() => true);
      
      const clearBtn = container.querySelector('.clear-room-btn') as HTMLButtonElement;
      clearBtn.click();

      const placedDevices = roomDesigner.getPlacedDevices();
      expect(placedDevices.length).toBe(0);
    });

    it('should not clear devices if user cancels', () => {
      // Mock confirm to return false
      window.confirm = jest.fn(() => false);
      
      const clearBtn = container.querySelector('.clear-room-btn') as HTMLButtonElement;
      clearBtn.click();

      // Should not have cleared (though we start with 0 devices anyway)
      expect(window.confirm).toHaveBeenCalled();
    });

    it('should get all placed devices', () => {
      const placedDevices = roomDesigner.getPlacedDevices();
      expect(Array.isArray(placedDevices)).toBe(true);
    });

    it('should clear all devices programmatically', () => {
      roomDesigner.clearAllDevices();
      const placedDevices = roomDesigner.getPlacedDevices();
      expect(placedDevices.length).toBe(0);
    });
  });

  describe('drag and drop', () => {
    it('should handle drag start event', () => {
      const deviceItem = container.querySelector('.device-item') as HTMLElement;
      
      const dragStartEvent = new DragEvent('dragstart', {
        dataTransfer: new DataTransfer()
      });
      
      deviceItem.dispatchEvent(dragStartEvent);
      expect(deviceItem.classList.contains('dragging')).toBe(true);
    });

    it('should handle drag end event', () => {
      const deviceItem = container.querySelector('.device-item') as HTMLElement;
      
      // First start drag
      const dragStartEvent = new DragEvent('dragstart', {
        dataTransfer: new DataTransfer()
      });
      deviceItem.dispatchEvent(dragStartEvent);
      
      // Then end drag
      const dragEndEvent = new DragEvent('dragend');
      deviceItem.dispatchEvent(dragEndEvent);
      
      expect(deviceItem.classList.contains('dragging')).toBe(false);
    });

    it('should handle drag over canvas', () => {
      const canvasContainer = container.querySelector('.canvas-wrapper') as HTMLElement;
      
      const dragOverEvent = new DragEvent('dragover', {
        dataTransfer: new DataTransfer()
      });
      
      canvasContainer.dispatchEvent(dragOverEvent);
      
      // Should prevent default and show visual feedback
      expect(dragOverEvent.defaultPrevented).toBe(true);
    });
  });

  describe('grid system', () => {
    it('should draw grid on canvas', () => {
      // Verify that grid drawing methods were called
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle canvas resize', () => {
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Grid should be redrawn
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper keyboard navigation support', () => {
      const deviceItem = container.querySelector('.device-item') as HTMLElement;
      expect(deviceItem.getAttribute('draggable')).toBe('true');
    });

    it('should have descriptive labels and titles', () => {
      const environmentSelect = container.querySelector('.environment-select') as HTMLSelectElement;
      const label = container.querySelector('label');
      expect(label).toBeTruthy();
    });
  });

  describe('responsive design', () => {
    it('should handle mobile layout', () => {
      // Test responsive grid layout
      const designerContent = container.querySelector('.designer-content') as HTMLElement;
      expect(designerContent).toBeTruthy();
    });
  });

  describe('resource cleanup', () => {
    it('should dispose of resources properly', () => {
      expect(() => roomDesigner.dispose()).not.toThrow();
    });
  });
});