import * as THREE from 'three';
import { Vector2, DeviceVisual, DragResult, InteractionResult, ClickResult, TutorialConstraints, UIElement } from '@/types/core';

/**
 * InputManager handles mouse/touch input for drag-and-drop device placement and UI interactions
 */
export class InputManager {
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;
  
  // Drag and drop state
  private isDragging: boolean = false;
  private draggedDevice: DeviceVisual | null = null;
  private dragOffset: Vector2 = { x: 0, y: 0 };
  private validDropZones: THREE.Box3[] = [];
  
  // Tutorial constraints
  private tutorialMode: boolean = false;
  private tutorialConstraints: TutorialConstraints | null = null;
  
  // Event callbacks
  private onDeviceDragCallback?: (device: DeviceVisual, position: Vector2) => DragResult;
  private onRoomInteractionCallback?: (position: Vector2) => InteractionResult;
  private onUIClickCallback?: (element: UIElement) => ClickResult;

  constructor(camera: THREE.Camera, renderer: THREE.WebGLRenderer, container: HTMLElement) {
    this.camera = camera;
    this.renderer = renderer;
    this.container = container;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Mouse events
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('click', this.onClick.bind(this));
    
    // Touch events for mobile support
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Prevent context menu
    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  /**
   * Handle device drag operations
   */
  public handleDeviceDrag(device: DeviceVisual, position: Vector2): DragResult {
    // Check tutorial constraints
    if (this.tutorialMode && this.tutorialConstraints) {
      if (!this.isActionAllowed('drag_device')) {
        return DragResult.INVALID_POSITION;
      }
    }
    
    // Convert screen position to world position
    const worldPosition = this.screenToWorld(position);
    
    // Check if position is valid
    if (!this.isValidDropPosition(worldPosition)) {
      return DragResult.INVALID_POSITION;
    }
    
    // Check for collisions with other devices
    if (this.checkDeviceCollision(device, worldPosition)) {
      return DragResult.COLLISION;
    }
    
    // Check bounds
    if (!this.isWithinBounds(worldPosition)) {
      return DragResult.OUT_OF_BOUNDS;
    }
    
    // Update device position
    device.position = { x: worldPosition.x, y: worldPosition.y, z: worldPosition.z };
    
    // Trigger callback if set
    if (this.onDeviceDragCallback) {
      return this.onDeviceDragCallback(device, position);
    }
    
    return DragResult.SUCCESS;
  }

  /**
   * Handle room interaction (clicking on empty space, etc.)
   */
  public handleRoomInteraction(position: Vector2): InteractionResult {
    const worldPosition = this.screenToWorld(position);
    
    // Check if we hit a device
    const intersectedDevice = this.getDeviceAtPosition(worldPosition);
    if (intersectedDevice) {
      return InteractionResult.DEVICE_SELECTED;
    }
    
    // Check if we hit a UI element
    const uiElement = this.getUIElementAtPosition(position);
    if (uiElement) {
      return InteractionResult.UI_ELEMENT;
    }
    
    // Empty space clicked
    if (this.onRoomInteractionCallback) {
      return this.onRoomInteractionCallback(position);
    }
    
    return InteractionResult.EMPTY_SPACE;
  }

  /**
   * Handle UI element clicks
   */
  public handleUIClick(element: UIElement): ClickResult {
    // Check tutorial constraints
    if (this.tutorialMode && this.tutorialConstraints) {
      if (!this.tutorialConstraints.allowedActions.includes('ui_click')) {
        return ClickResult.IGNORED;
      }
    }
    
    if (this.onUIClickCallback) {
      return this.onUIClickCallback(element);
    }
    
    return ClickResult.HANDLED;
  }

  /**
   * Enable tutorial mode with constraints
   */
  public enableTutorialMode(constraints: TutorialConstraints): void {
    this.tutorialMode = true;
    this.tutorialConstraints = constraints;
    
    // Add visual indicators for tutorial constraints
    this.showTutorialHighlights();
  }

  /**
   * Disable tutorial mode
   */
  public disableTutorialMode(): void {
    this.tutorialMode = false;
    this.tutorialConstraints = null;
    
    // Remove tutorial visual indicators
    this.hideTutorialHighlights();
  }

  // Event handlers
  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    
    this.updateMousePosition(event);
    
    // Check if we're starting a drag operation
    const worldPos = this.screenToWorld(this.mouse);
    const device = this.getDeviceAtPosition(worldPos);
    
    if (device) {
      this.startDrag(device, this.mouse);
    }
  }

  private onMouseMove(event: MouseEvent): void {
    event.preventDefault();
    
    this.updateMousePosition(event);
    
    if (this.isDragging && this.draggedDevice) {
      this.updateDrag(this.mouse);
    }
  }

  private onMouseUp(event: MouseEvent): void {
    event.preventDefault();
    
    if (this.isDragging) {
      this.endDrag(this.mouse);
    }
  }

  private onClick(event: MouseEvent): void {
    event.preventDefault();
    
    this.updateMousePosition(event);
    this.handleRoomInteraction(this.mouse);
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.updateMousePositionFromTouch(touch);
      
      const worldPos = this.screenToWorld(this.mouse);
      const device = this.getDeviceAtPosition(worldPos);
      
      if (device) {
        this.startDrag(device, this.mouse);
      }
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    if (event.touches.length === 1 && this.isDragging) {
      const touch = event.touches[0];
      this.updateMousePositionFromTouch(touch);
      this.updateDrag(this.mouse);
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (this.isDragging) {
      this.endDrag(this.mouse);
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    switch (event.code) {
      case 'Escape':
        if (this.isDragging) {
          this.cancelDrag();
        }
        break;
      case 'Delete':
      case 'Backspace':
        // Delete selected device
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    // Handle key releases if needed
  }

  // Drag and drop implementation
  private startDrag(device: DeviceVisual, screenPos: Vector2): void {
    this.isDragging = true;
    this.draggedDevice = device;
    
    // Calculate drag offset
    this.dragOffset = {
      x: screenPos.x - device.position.x,
      y: screenPos.y - device.position.y
    };
    
    // Add visual feedback
    this.showDragFeedback(device);
  }

  private updateDrag(screenPos: Vector2): void {
    if (!this.draggedDevice) return;
    
    const adjustedPos = {
      x: screenPos.x - this.dragOffset.x,
      y: screenPos.y - this.dragOffset.y
    };
    
    const result = this.handleDeviceDrag(this.draggedDevice, adjustedPos);
    
    // Update visual feedback based on result
    this.updateDragFeedback(result);
  }

  private endDrag(screenPos: Vector2): void {
    if (!this.draggedDevice) return;
    
    const adjustedPos = {
      x: screenPos.x - this.dragOffset.x,
      y: screenPos.y - this.dragOffset.y
    };
    
    const result = this.handleDeviceDrag(this.draggedDevice, adjustedPos);
    
    if (result === DragResult.SUCCESS) {
      // Successful drop
      this.showDropSuccess();
    } else {
      // Failed drop - return to original position
      this.returnToOriginalPosition();
    }
    
    this.isDragging = false;
    this.draggedDevice = null;
    this.hideDragFeedback();
  }

  private cancelDrag(): void {
    if (this.draggedDevice) {
      this.returnToOriginalPosition();
    }
    
    this.isDragging = false;
    this.draggedDevice = null;
    this.hideDragFeedback();
  }

  // Utility methods
  private updateMousePosition(event: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private updateMousePositionFromTouch(touch: Touch): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private screenToWorld(screenPos: Vector2): THREE.Vector3 {
    this.raycaster.setFromCamera(screenPos, this.camera);
    
    // Intersect with ground plane (y = 0)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(groundPlane, intersection);
    
    return intersection;
  }

  private getDeviceAtPosition(worldPos: THREE.Vector3): DeviceVisual | null {
    // This would be implemented with actual device collision detection
    // For now, return null
    return null;
  }

  private getUIElementAtPosition(screenPos: Vector2): UIElement | null {
    // This would be implemented with UI element hit testing
    // For now, return null
    return null;
  }

  private isValidDropPosition(worldPos: THREE.Vector3): boolean {
    // Check if position is within valid drop zones
    return this.validDropZones.some(zone => zone.containsPoint(worldPos));
  }

  private checkDeviceCollision(device: DeviceVisual, worldPos: THREE.Vector3): boolean {
    // Check collision with other devices
    // This would be implemented with actual collision detection
    return false;
  }

  private isWithinBounds(worldPos: THREE.Vector3): boolean {
    // Check if position is within room bounds
    const bounds = new THREE.Box3(
      new THREE.Vector3(-10, -1, -10),
      new THREE.Vector3(10, 5, 10)
    );
    
    return bounds.containsPoint(worldPos);
  }

  private isActionAllowed(action: string): boolean {
    if (!this.tutorialConstraints) return true;
    return this.tutorialConstraints.allowedActions.includes(action);
  }

  // Visual feedback methods
  private showDragFeedback(device: DeviceVisual): void {
    // Add visual feedback for dragging
    // This would be implemented with actual visual effects
  }

  private updateDragFeedback(result: DragResult): void {
    // Update visual feedback based on drag result
    // This would be implemented with actual visual effects
  }

  private hideDragFeedback(): void {
    // Remove drag visual feedback
    // This would be implemented with actual visual effects
  }

  private showDropSuccess(): void {
    // Show success animation
    // This would be implemented with actual visual effects
  }

  private returnToOriginalPosition(): void {
    // Animate device back to original position
    // This would be implemented with actual animation
  }

  private showTutorialHighlights(): void {
    // Show tutorial visual indicators
    // This would be implemented with actual visual effects
  }

  private hideTutorialHighlights(): void {
    // Hide tutorial visual indicators
    // This would be implemented with actual visual effects
  }

  // Callback setters
  public setDeviceDragCallback(callback: (device: DeviceVisual, position: Vector2) => DragResult): void {
    this.onDeviceDragCallback = callback;
  }

  public setRoomInteractionCallback(callback: (position: Vector2) => InteractionResult): void {
    this.onRoomInteractionCallback = callback;
  }

  public setUIClickCallback(callback: (element: UIElement) => ClickResult): void {
    this.onUIClickCallback = callback;
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('InputManager accessibility settings applied:', settings);
    if (settings.keyboardNavigation) {
      console.log('Enhanced keyboard navigation enabled');
    }
  }

  /**
   * Dispose of resources and remove event listeners
   */
  public dispose(): void {
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('click', this.onClick);
    this.container.removeEventListener('touchstart', this.onTouchStart);
    this.container.removeEventListener('touchmove', this.onTouchMove);
    this.container.removeEventListener('touchend', this.onTouchEnd);
    this.container.removeEventListener('contextmenu', (e) => e.preventDefault());
    
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }
}