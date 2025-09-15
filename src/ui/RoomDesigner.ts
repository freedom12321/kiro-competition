import { DeviceLibrary, DeviceTemplate, PlacementMode, PlacementFeedback, PlacementIndicator, CompatibilityHighlight, CompatibilityLevel, DeviceCategory } from '@/types/ui';
import { Vector2, DeviceVisual, EnvironmentType } from '@/types/core';

/**
 * RoomDesigner provides drag-and-drop interface for environment creation and device placement
 */
export class RoomDesigner {
  private container: HTMLElement;
  private canvasContainer: HTMLElement;
  private deviceLibraryContainer: HTMLElement;
  private roomTemplateContainer: HTMLElement;
  private gridCanvas: HTMLCanvasElement;
  private gridContext: CanvasRenderingContext2D;
  
  // Room state
  private currentEnvironment: EnvironmentType = EnvironmentType.HOME;
  private gridSize: number = 40;
  private roomWidth: number = 20;
  private roomHeight: number = 15;
  private placedDevices: Map<string, DeviceVisual> = new Map();
  
  // Interaction state
  private placementMode: PlacementMode = PlacementMode.SNAP_TO_GRID;
  private selectedDevice: DeviceTemplate | null = null;
  private draggedDevice: DeviceVisual | null = null;
  private isDragging: boolean = false;
  private dragOffset: Vector2 = { x: 0, y: 0 };
  
  // Device library
  private deviceLibrary: DeviceLibrary;
  
  // Callbacks
  private onDevicePlacedCallback?: (device: DeviceVisual) => void;
  private onDeviceRemovedCallback?: (deviceId: string) => void;
  private onEnvironmentChangedCallback?: (environment: EnvironmentType) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeDeviceLibrary();
    this.initializeUI();
    this.setupEventListeners();
    this.initializeGrid();
  }

  private initializeDeviceLibrary(): void {
    this.deviceLibrary = {
      categories: Object.values(DeviceCategory),
      devices: [
        {
          id: 'smart-coffee-maker',
          name: 'Smart Coffee Maker',
          category: DeviceCategory.COMFORT,
          description: 'Learns your schedule and prepares coffee automatically',
          defaultPersonality: ['helpful', 'eager', 'morning-focused'],
          visualPreview: '☕',
          complexity: 0.6
        },
        {
          id: 'intelligent-thermostat',
          name: 'Intelligent Thermostat',
          category: DeviceCategory.COMFORT,
          description: 'Optimizes temperature based on occupancy and preferences',
          defaultPersonality: ['analytical', 'efficient', 'adaptive'],
          visualPreview: '🌡️',
          complexity: 0.7
        },
        {
          id: 'smart-lighting',
          name: 'Smart Lighting System',
          category: DeviceCategory.COMFORT,
          description: 'Adjusts brightness and color based on time and activity',
          defaultPersonality: ['attentive', 'subtle', 'mood-aware'],
          visualPreview: '💡',
          complexity: 0.5
        },
        {
          id: 'security-camera',
          name: 'Security Camera',
          category: DeviceCategory.SECURITY,
          description: 'Monitors area and detects unusual activity',
          defaultPersonality: ['vigilant', 'cautious', 'observant'],
          visualPreview: '📹',
          complexity: 0.8
        },
        {
          id: 'smart-speaker',
          name: 'Smart Speaker',
          category: DeviceCategory.ENTERTAINMENT,
          description: 'Plays music and responds to voice commands',
          defaultPersonality: ['responsive', 'entertaining', 'social'],
          visualPreview: '🔊',
          complexity: 0.6
        },
        {
          id: 'air-quality-monitor',
          name: 'Air Quality Monitor',
          category: DeviceCategory.HEALTH,
          description: 'Tracks air quality and suggests improvements',
          defaultPersonality: ['health-conscious', 'informative', 'proactive'],
          visualPreview: '🌬️',
          complexity: 0.4
        },
        {
          id: 'smart-lock',
          name: 'Smart Door Lock',
          category: DeviceCategory.SECURITY,
          description: 'Controls access with facial recognition and scheduling',
          defaultPersonality: ['security-focused', 'reliable', 'strict'],
          visualPreview: '🔒',
          complexity: 0.7
        },
        {
          id: 'productivity-display',
          name: 'Productivity Display',
          category: DeviceCategory.PRODUCTIVITY,
          description: 'Shows schedules, tasks, and important information',
          defaultPersonality: ['organized', 'efficient', 'goal-oriented'],
          visualPreview: '📊',
          complexity: 0.5
        }
      ],
      customDevices: []
    };
  }

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="room-designer">
        <div class="designer-header">
          <h2>Room Designer</h2>
          <div class="environment-selector">
            <label>Environment:</label>
            <select class="environment-select">
              <option value="home">Home</option>
              <option value="hospital">Hospital</option>
              <option value="office">Office</option>
            </select>
          </div>
          <div class="placement-mode-selector">
            <label>Placement:</label>
            <select class="placement-mode-select">
              <option value="snap_to_grid">Snap to Grid</option>
              <option value="free_placement">Free Placement</option>
            </select>
          </div>
        </div>
        
        <div class="designer-content">
          <div class="device-library-panel">
            <div class="library-header">
              <h3>Device Library</h3>
              <div class="category-filter">
                <select class="category-select">
                  <option value="">All Categories</option>
                </select>
              </div>
            </div>
            <div class="device-grid"></div>
          </div>
          
          <div class="room-canvas-container">
            <div class="canvas-header">
              <div class="room-info">
                <span class="room-title">Living Room</span>
                <span class="device-count">0 devices</span>
              </div>
              <div class="canvas-controls">
                <button class="clear-room-btn">Clear Room</button>
                <button class="room-template-btn">Templates</button>
              </div>
            </div>
            <div class="canvas-wrapper">
              <canvas class="room-grid"></canvas>
              <div class="placement-feedback"></div>
              <div class="compatibility-highlights"></div>
            </div>
          </div>
        </div>
        
        <div class="room-templates-panel" style="display: none;">
          <div class="templates-header">
            <h3>Room Templates</h3>
            <button class="close-templates-btn">×</button>
          </div>
          <div class="templates-grid"></div>
        </div>
      </div>
    `;

    // Get references to elements
    this.canvasContainer = this.container.querySelector('.canvas-wrapper') as HTMLElement;
    this.deviceLibraryContainer = this.container.querySelector('.device-grid') as HTMLElement;
    this.roomTemplateContainer = this.container.querySelector('.templates-grid') as HTMLElement;
    this.gridCanvas = this.container.querySelector('.room-grid') as HTMLCanvasElement;
    this.gridContext = this.gridCanvas.getContext('2d')!;

    // Apply styles
    this.applyStyles();
    
    // Initialize components
    this.renderDeviceLibrary();
    this.renderRoomTemplates();
    this.populateCategoryFilter();
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .room-designer {
        background: #f8fafc;
        border-radius: 12px;
        padding: 24px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      
      .designer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .designer-header h2 {
        margin: 0;
        color: #1e293b;
        font-size: 24px;
        font-weight: 600;
      }
      
      .environment-selector,
      .placement-mode-selector {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .environment-selector label,
      .placement-mode-selector label {
        font-weight: 500;
        color: #475569;
      }
      
      .environment-select,
      .placement-mode-select,
      .category-select {
        padding: 8px 12px;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        font-size: 14px;
        cursor: pointer;
        transition: border-color 0.2s ease;
      }
      
      .environment-select:focus,
      .placement-mode-select:focus,
      .category-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .designer-content {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 24px;
        flex: 1;
        min-height: 0;
      }
      
      .device-library-panel {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
      }
      
      .library-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .library-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 18px;
        font-weight: 600;
      }
      
      .device-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        overflow-y: auto;
        max-height: 500px;
      }
      
      .device-item {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        cursor: grab;
        transition: all 0.2s ease;
        user-select: none;
      }
      
      .device-item:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }
      
      .device-item.selected {
        border-color: #10b981;
        background: #ecfdf5;
      }
      
      .device-item.dragging {
        opacity: 0.5;
        cursor: grabbing;
      }
      
      .device-icon {
        font-size: 32px;
        text-align: center;
        margin-bottom: 8px;
      }
      
      .device-name {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 4px;
        font-size: 14px;
      }
      
      .device-description {
        font-size: 12px;
        color: #64748b;
        line-height: 1.4;
        margin-bottom: 8px;
      }
      
      .device-category {
        display: inline-block;
        background: #e0e7ff;
        color: #3730a3;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
      }
      
      .device-complexity {
        float: right;
        font-size: 10px;
        color: #64748b;
      }
      
      .room-canvas-container {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
      }
      
      .canvas-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      .room-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .room-title {
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }
      
      .device-count {
        font-size: 14px;
        color: #64748b;
      }
      
      .canvas-controls {
        display: flex;
        gap: 8px;
      }
      
      .clear-room-btn,
      .room-template-btn {
        padding: 8px 16px;
        border: 2px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        color: #475569;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .clear-room-btn:hover {
        border-color: #ef4444;
        color: #ef4444;
      }
      
      .room-template-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
      
      .canvas-wrapper {
        position: relative;
        flex: 1;
        min-height: 400px;
        border: 2px dashed #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .room-grid {
        width: 100%;
        height: 100%;
        cursor: crosshair;
      }
      
      .room-grid.drag-over {
        border-color: #10b981;
        background-color: rgba(16, 185, 129, 0.05);
      }
      
      .placement-feedback {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .placement-feedback.visible {
        opacity: 1;
      }
      
      .placement-feedback.valid {
        background: rgba(16, 185, 129, 0.9);
      }
      
      .placement-feedback.invalid {
        background: rgba(239, 68, 68, 0.9);
      }
      
      .placement-feedback.warning {
        background: rgba(245, 158, 11, 0.9);
      }
      
      .compatibility-highlights {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      
      .compatibility-highlight {
        position: absolute;
        border: 3px solid;
        border-radius: 8px;
        animation: pulse 2s infinite;
      }
      
      .compatibility-highlight.highly-compatible {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.1);
      }
      
      .compatibility-highlight.compatible {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
      }
      
      .compatibility-highlight.potentially-conflicting {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
      
      .compatibility-highlight.incompatible {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .room-templates-panel {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .room-templates-panel > div {
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .templates-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .templates-header h3 {
        margin: 0;
        color: #1e293b;
        font-size: 20px;
        font-weight: 600;
      }
      
      .close-templates-btn {
        background: none;
        border: none;
        font-size: 24px;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }
      
      .close-templates-btn:hover {
        background: #f1f5f9;
      }
      
      .templates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 16px;
      }
      
      .template-item {
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .template-item:hover {
        border-color: #3b82f6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }
      
      .template-name {
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 8px;
      }
      
      .template-description {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 12px;
      }
      
      .template-devices {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      
      .template-device-icon {
        font-size: 16px;
      }
      
      .placed-device {
        position: absolute;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        font-size: 20px;
        cursor: move;
        transition: all 0.2s ease;
        user-select: none;
      }
      
      .placed-device:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      
      .placed-device.selected {
        border-color: #10b981;
        background: #ecfdf5;
      }
      
      .placed-device.dragging {
        opacity: 0.7;
        transform: scale(1.1) rotate(5deg);
        z-index: 1000;
      }
      
      @media (max-width: 1024px) {
        .designer-content {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .device-library-panel {
          order: 2;
          max-height: 300px;
        }
        
        .device-grid {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          max-height: 200px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Environment selector
    const environmentSelect = this.container.querySelector('.environment-select') as HTMLSelectElement;
    environmentSelect.addEventListener('change', this.handleEnvironmentChange.bind(this));
    
    // Placement mode selector
    const placementModeSelect = this.container.querySelector('.placement-mode-select') as HTMLSelectElement;
    placementModeSelect.addEventListener('change', this.handlePlacementModeChange.bind(this));
    
    // Category filter
    const categorySelect = this.container.querySelector('.category-select') as HTMLSelectElement;
    categorySelect.addEventListener('change', this.handleCategoryFilter.bind(this));
    
    // Canvas events
    this.gridCanvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
    this.gridCanvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
    this.gridCanvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));
    this.gridCanvas.addEventListener('mouseleave', this.handleCanvasMouseLeave.bind(this));
    
    // Drag and drop events
    this.canvasContainer.addEventListener('dragover', this.handleDragOver.bind(this));
    this.canvasContainer.addEventListener('drop', this.handleDrop.bind(this));
    
    // Control buttons
    const clearRoomBtn = this.container.querySelector('.clear-room-btn') as HTMLButtonElement;
    clearRoomBtn.addEventListener('click', this.handleClearRoom.bind(this));
    
    const roomTemplateBtn = this.container.querySelector('.room-template-btn') as HTMLButtonElement;
    roomTemplateBtn.addEventListener('click', this.showRoomTemplates.bind(this));
    
    const closeTemplatesBtn = this.container.querySelector('.close-templates-btn') as HTMLButtonElement;
    closeTemplatesBtn.addEventListener('click', this.hideRoomTemplates.bind(this));
  }

  private initializeGrid(): void {
    this.resizeCanvas();
    this.drawGrid();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.drawGrid();
      this.redrawDevices();
    });
  }

  private resizeCanvas(): void {
    const rect = this.canvasContainer.getBoundingClientRect();
    this.gridCanvas.width = rect.width;
    this.gridCanvas.height = rect.height;
    
    // Update room dimensions based on canvas size
    this.roomWidth = Math.floor(rect.width / this.gridSize);
    this.roomHeight = Math.floor(rect.height / this.gridSize);
  }

  private drawGrid(): void {
    const ctx = this.gridContext;
    const width = this.gridCanvas.width;
    const height = this.gridCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  private renderDeviceLibrary(): void {
    this.deviceLibraryContainer.innerHTML = '';
    
    this.deviceLibrary.devices.forEach(device => {
      const deviceElement = this.createDeviceElement(device);
      this.deviceLibraryContainer.appendChild(deviceElement);
    });
  }

  private createDeviceElement(device: DeviceTemplate): HTMLElement {
    const element = document.createElement('div');
    element.className = 'device-item';
    element.draggable = true;
    element.dataset.deviceId = device.id;
    
    element.innerHTML = `
      <div class="device-icon">${device.visualPreview}</div>
      <div class="device-name">${device.name}</div>
      <div class="device-description">${device.description}</div>
      <div class="device-meta">
        <span class="device-category">${device.category}</span>
        <span class="device-complexity">Complexity: ${Math.round(device.complexity * 100)}%</span>
      </div>
    `;
    
    // Add event listeners
    element.addEventListener('click', () => this.selectDevice(device));
    element.addEventListener('dragstart', (e) => this.handleDragStart(e, device));
    element.addEventListener('dragend', this.handleDragEnd.bind(this));
    
    return element;
  }

  private populateCategoryFilter(): void {
    const categorySelect = this.container.querySelector('.category-select') as HTMLSelectElement;
    
    this.deviceLibrary.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      categorySelect.appendChild(option);
    });
  }

  private renderRoomTemplates(): void {
    const templates = [
      {
        id: 'cozy-living-room',
        name: 'Cozy Living Room',
        description: 'A comfortable living space with entertainment and comfort devices',
        devices: ['smart-coffee-maker', 'smart-lighting', 'smart-speaker'],
        layout: [
          { deviceId: 'smart-coffee-maker', x: 2, y: 2 },
          { deviceId: 'smart-lighting', x: 8, y: 1 },
          { deviceId: 'smart-speaker', x: 6, y: 4 }
        ]
      },
      {
        id: 'secure-office',
        name: 'Secure Office',
        description: 'A productive workspace with security and productivity features',
        devices: ['security-camera', 'productivity-display', 'smart-lock'],
        layout: [
          { deviceId: 'security-camera', x: 1, y: 1 },
          { deviceId: 'productivity-display', x: 5, y: 3 },
          { deviceId: 'smart-lock', x: 9, y: 1 }
        ]
      },
      {
        id: 'smart-bedroom',
        name: 'Smart Bedroom',
        description: 'A restful space with climate and lighting control',
        devices: ['intelligent-thermostat', 'smart-lighting', 'air-quality-monitor'],
        layout: [
          { deviceId: 'intelligent-thermostat', x: 1, y: 3 },
          { deviceId: 'smart-lighting', x: 4, y: 1 },
          { deviceId: 'air-quality-monitor', x: 7, y: 2 }
        ]
      }
    ];
    
    this.roomTemplateContainer.innerHTML = '';
    
    templates.forEach(template => {
      const templateElement = document.createElement('div');
      templateElement.className = 'template-item';
      templateElement.innerHTML = `
        <div class="template-name">${template.name}</div>
        <div class="template-description">${template.description}</div>
        <div class="template-devices">
          ${template.devices.map(deviceId => {
            const device = this.deviceLibrary.devices.find(d => d.id === deviceId);
            return `<span class="template-device-icon">${device?.visualPreview || '🤖'}</span>`;
          }).join('')}
        </div>
      `;
      
      templateElement.addEventListener('click', () => this.applyRoomTemplate(template));
      this.roomTemplateContainer.appendChild(templateElement);
    });
  }

  // Event handlers
  private handleEnvironmentChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentEnvironment = select.value as EnvironmentType;
    
    // Update room title
    const roomTitle = this.container.querySelector('.room-title') as HTMLElement;
    roomTitle.textContent = this.getEnvironmentDisplayName(this.currentEnvironment);
    
    // Trigger callback
    if (this.onEnvironmentChangedCallback) {
      this.onEnvironmentChangedCallback(this.currentEnvironment);
    }
  }

  private handlePlacementModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.placementMode = select.value as PlacementMode;
  }

  private handleCategoryFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedCategory = select.value;
    
    const deviceItems = this.deviceLibraryContainer.querySelectorAll('.device-item');
    deviceItems.forEach(item => {
      const deviceId = item.getAttribute('data-device-id');
      const device = this.deviceLibrary.devices.find(d => d.id === deviceId);
      
      if (!selectedCategory || device?.category === selectedCategory) {
        (item as HTMLElement).style.display = 'block';
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }

  private selectDevice(device: DeviceTemplate): void {
    this.selectedDevice = device;
    
    // Update UI
    const deviceItems = this.deviceLibraryContainer.querySelectorAll('.device-item');
    deviceItems.forEach(item => {
      item.classList.remove('selected');
      if (item.getAttribute('data-device-id') === device.id) {
        item.classList.add('selected');
      }
    });
    
    // Show compatibility highlights
    this.showCompatibilityHighlights(device);
  }

  private handleDragStart(event: DragEvent, device: DeviceTemplate): void {
    if (!event.dataTransfer) return;
    
    event.dataTransfer.setData('text/plain', device.id);
    event.dataTransfer.effectAllowed = 'copy';
    
    const element = event.target as HTMLElement;
    element.classList.add('dragging');
    
    this.selectedDevice = device;
  }

  private handleDragEnd(event: DragEvent): void {
    const element = event.target as HTMLElement;
    element.classList.remove('dragging');
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    
    this.gridCanvas.classList.add('drag-over');
    
    // Show placement feedback
    const rect = this.gridCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const gridPos = this.screenToGrid({ x, y });
    const feedback = this.getPlacementFeedback(gridPos, this.selectedDevice!);
    this.showPlacementFeedback(feedback);
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.gridCanvas.classList.remove('drag-over');
    this.hidePlacementFeedback();
    
    const deviceId = event.dataTransfer!.getData('text/plain');
    const device = this.deviceLibrary.devices.find(d => d.id === deviceId);
    
    if (!device) return;
    
    const rect = this.gridCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const gridPos = this.screenToGrid({ x, y });
    const feedback = this.getPlacementFeedback(gridPos, device);
    
    if (feedback.isValid) {
      this.placeDevice(device, feedback.snapPosition);
    }
  }

  private handleCanvasMouseDown(event: MouseEvent): void {
    const rect = this.gridCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const clickedDevice = this.getDeviceAtPosition({ x, y });
    
    if (clickedDevice) {
      this.startDragDevice(clickedDevice, { x, y });
    }
  }

  private handleCanvasMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.draggedDevice) return;
    
    const rect = this.gridCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.updateDragDevice({ x, y });
  }

  private handleCanvasMouseUp(event: MouseEvent): void {
    if (!this.isDragging || !this.draggedDevice) return;
    
    const rect = this.gridCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.endDragDevice({ x, y });
  }

  private handleCanvasMouseLeave(): void {
    if (this.isDragging) {
      this.cancelDragDevice();
    }
  }

  private handleClearRoom(): void {
    if (this.placedDevices.size === 0) return;
    
    if (confirm('Are you sure you want to clear all devices from the room?')) {
      this.placedDevices.clear();
      this.redrawDevices();
      this.updateDeviceCount();
    }
  }

  // Device placement methods
  public enableDevicePlacement(device: DeviceTemplate): PlacementMode {
    this.selectDevice(device);
    return this.placementMode;
  }

  public getPlacementFeedbackForPosition(position: Vector2, device: DeviceTemplate): PlacementFeedback {
    const gridPos = this.screenToGrid(position);
    return this.getPlacementFeedback(gridPos, device);
  }

  private getPlacementFeedback(gridPos: Vector2, device: DeviceTemplate): PlacementFeedback {
    let isValid = true;
    let message = 'Valid placement';
    let indicator = PlacementIndicator.VALID;
    
    // Check bounds
    if (gridPos.x < 0 || gridPos.x >= this.roomWidth || gridPos.y < 0 || gridPos.y >= this.roomHeight) {
      isValid = false;
      message = 'Outside room bounds';
      indicator = PlacementIndicator.INVALID;
    }
    
    // Check for collisions
    const snapPos = this.placementMode === PlacementMode.SNAP_TO_GRID ? 
      { x: Math.round(gridPos.x), y: Math.round(gridPos.y) } : gridPos;
    
    const collision = this.checkCollision(snapPos);
    if (collision) {
      isValid = false;
      message = 'Position occupied';
      indicator = PlacementIndicator.INVALID;
    }
    
    // Check compatibility
    if (isValid) {
      const compatibility = this.checkDeviceCompatibility(device, snapPos);
      if (compatibility.some(c => c.compatibilityLevel === CompatibilityLevel.INCOMPATIBLE)) {
        message = 'May conflict with nearby devices';
        indicator = PlacementIndicator.WARNING;
      } else if (compatibility.some(c => c.compatibilityLevel === CompatibilityLevel.HIGHLY_COMPATIBLE)) {
        message = 'Great synergy with nearby devices';
        indicator = PlacementIndicator.SUGGESTION;
      }
    }
    
    return {
      isValid,
      snapPosition: snapPos,
      visualIndicator: indicator,
      message
    };
  }

  private placeDevice(deviceTemplate: DeviceTemplate, position: Vector2): void {
    const deviceId = `${deviceTemplate.id}-${Date.now()}`;
    
    const device: DeviceVisual = {
      id: deviceId,
      model3D: {
        mesh: null as any, // Would be actual 3D model
        materials: [],
        animations: [],
        boundingBox: null as any
      },
      position: { x: position.x * this.gridSize, y: position.y * this.gridSize, z: 0 },
      animations: null as any,
      personalityIndicators: [],
      connectionEffects: []
    };
    
    // Add device data
    (device as any).template = deviceTemplate;
    (device as any).gridPosition = position;
    
    this.placedDevices.set(deviceId, device);
    this.redrawDevices();
    this.updateDeviceCount();
    
    // Trigger callback
    if (this.onDevicePlacedCallback) {
      this.onDevicePlacedCallback(device);
    }
  }

  private redrawDevices(): void {
    // Remove existing device elements
    const existingDevices = this.canvasContainer.querySelectorAll('.placed-device');
    existingDevices.forEach(el => el.remove());
    
    // Draw devices on canvas
    this.placedDevices.forEach(device => {
      this.drawDeviceOnCanvas(device);
    });
  }

  private drawDeviceOnCanvas(device: DeviceVisual): void {
    const template = (device as any).template as DeviceTemplate;
    const gridPos = (device as any).gridPosition as Vector2;
    
    const deviceElement = document.createElement('div');
    deviceElement.className = 'placed-device';
    deviceElement.textContent = template.visualPreview;
    deviceElement.style.left = `${gridPos.x * this.gridSize}px`;
    deviceElement.style.top = `${gridPos.y * this.gridSize}px`;
    deviceElement.dataset.deviceId = device.id;
    deviceElement.title = template.name;
    
    // Add event listeners
    deviceElement.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.startDragDevice(device, { x: e.clientX, y: e.clientY });
    });
    
    deviceElement.addEventListener('dblclick', () => {
      if (confirm(`Remove ${template.name}?`)) {
        this.removeDevice(device.id);
      }
    });
    
    this.canvasContainer.appendChild(deviceElement);
  }

  private startDragDevice(device: DeviceVisual, screenPos: Vector2): void {
    this.isDragging = true;
    this.draggedDevice = device;
    
    const gridPos = (device as any).gridPosition as Vector2;
    this.dragOffset = {
      x: screenPos.x - gridPos.x * this.gridSize,
      y: screenPos.y - gridPos.y * this.gridSize
    };
    
    const deviceElement = this.canvasContainer.querySelector(`[data-device-id="${device.id}"]`) as HTMLElement;
    if (deviceElement) {
      deviceElement.classList.add('dragging');
    }
  }

  private updateDragDevice(screenPos: Vector2): void {
    if (!this.draggedDevice) return;
    
    const deviceElement = this.canvasContainer.querySelector(`[data-device-id="${this.draggedDevice.id}"]`) as HTMLElement;
    if (deviceElement) {
      deviceElement.style.left = `${screenPos.x - this.dragOffset.x}px`;
      deviceElement.style.top = `${screenPos.y - this.dragOffset.y}px`;
    }
  }

  private endDragDevice(screenPos: Vector2): void {
    if (!this.draggedDevice) return;
    
    const rect = this.gridCanvas.getBoundingClientRect();
    const canvasPos = {
      x: screenPos.x - this.dragOffset.x,
      y: screenPos.y - this.dragOffset.y
    };
    
    const gridPos = this.screenToGrid(canvasPos);
    const template = (this.draggedDevice as any).template as DeviceTemplate;
    const feedback = this.getPlacementFeedback(gridPos, template);
    
    if (feedback.isValid) {
      // Update device position
      (this.draggedDevice as any).gridPosition = feedback.snapPosition;
      this.draggedDevice.position = {
        x: feedback.snapPosition.x * this.gridSize,
        y: feedback.snapPosition.y * this.gridSize,
        z: 0
      };
    }
    
    // Clean up drag state
    const deviceElement = this.canvasContainer.querySelector(`[data-device-id="${this.draggedDevice.id}"]`) as HTMLElement;
    if (deviceElement) {
      deviceElement.classList.remove('dragging');
    }
    
    this.isDragging = false;
    this.draggedDevice = null;
    this.redrawDevices();
  }

  private cancelDragDevice(): void {
    if (!this.draggedDevice) return;
    
    const deviceElement = this.canvasContainer.querySelector(`[data-device-id="${this.draggedDevice.id}"]`) as HTMLElement;
    if (deviceElement) {
      deviceElement.classList.remove('dragging');
    }
    
    this.isDragging = false;
    this.draggedDevice = null;
    this.redrawDevices();
  }

  private removeDevice(deviceId: string): void {
    this.placedDevices.delete(deviceId);
    this.redrawDevices();
    this.updateDeviceCount();
    
    if (this.onDeviceRemovedCallback) {
      this.onDeviceRemovedCallback(deviceId);
    }
  }

  // Utility methods
  private screenToGrid(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x / this.gridSize,
      y: screenPos.y / this.gridSize
    };
  }

  private checkCollision(gridPos: Vector2): boolean {
    const snapPos = { x: Math.round(gridPos.x), y: Math.round(gridPos.y) };
    
    for (const device of this.placedDevices.values()) {
      const deviceGridPos = (device as any).gridPosition as Vector2;
      if (deviceGridPos.x === snapPos.x && deviceGridPos.y === snapPos.y) {
        return true;
      }
    }
    
    return false;
  }

  private getDeviceAtPosition(screenPos: Vector2): DeviceVisual | null {
    const gridPos = this.screenToGrid(screenPos);
    const snapPos = { x: Math.round(gridPos.x), y: Math.round(gridPos.y) };
    
    for (const device of this.placedDevices.values()) {
      const deviceGridPos = (device as any).gridPosition as Vector2;
      if (Math.abs(deviceGridPos.x - snapPos.x) < 0.5 && Math.abs(deviceGridPos.y - snapPos.y) < 0.5) {
        return device;
      }
    }
    
    return null;
  }

  private checkDeviceCompatibility(device: DeviceTemplate, position: Vector2): CompatibilityHighlight[] {
    const highlights: CompatibilityHighlight[] = [];
    
    this.placedDevices.forEach(placedDevice => {
      const placedTemplate = (placedDevice as any).template as DeviceTemplate;
      const placedGridPos = (placedDevice as any).gridPosition as Vector2;
      
      const distance = Math.sqrt(
        Math.pow(position.x - placedGridPos.x, 2) + 
        Math.pow(position.y - placedGridPos.y, 2)
      );
      
      if (distance <= 3) { // Within 3 grid units
        const compatibility = this.calculateCompatibility(device, placedTemplate);
        
        highlights.push({
          deviceId: placedDevice.id,
          compatibilityLevel: compatibility,
          reason: this.getCompatibilityReason(device, placedTemplate, compatibility)
        });
      }
    });
    
    return highlights;
  }

  private calculateCompatibility(device1: DeviceTemplate, device2: DeviceTemplate): CompatibilityLevel {
    // Same category devices often work well together
    if (device1.category === device2.category) {
      return CompatibilityLevel.COMPATIBLE;
    }
    
    // Specific compatibility rules
    const compatiblePairs = [
      [DeviceCategory.COMFORT, DeviceCategory.HEALTH],
      [DeviceCategory.SECURITY, DeviceCategory.SAFETY],
      [DeviceCategory.PRODUCTIVITY, DeviceCategory.ENTERTAINMENT]
    ];
    
    const conflictingPairs = [
      [DeviceCategory.SECURITY, DeviceCategory.ENTERTAINMENT],
      [DeviceCategory.PRODUCTIVITY, DeviceCategory.COMFORT]
    ];
    
    for (const pair of compatiblePairs) {
      if ((pair.includes(device1.category) && pair.includes(device2.category))) {
        return CompatibilityLevel.HIGHLY_COMPATIBLE;
      }
    }
    
    for (const pair of conflictingPairs) {
      if ((pair.includes(device1.category) && pair.includes(device2.category))) {
        return CompatibilityLevel.POTENTIALLY_CONFLICTING;
      }
    }
    
    return CompatibilityLevel.NEUTRAL;
  }

  private getCompatibilityReason(device1: DeviceTemplate, device2: DeviceTemplate, level: CompatibilityLevel): string {
    switch (level) {
      case CompatibilityLevel.HIGHLY_COMPATIBLE:
        return `${device1.name} and ${device2.name} work great together`;
      case CompatibilityLevel.COMPATIBLE:
        return `${device1.name} is compatible with ${device2.name}`;
      case CompatibilityLevel.POTENTIALLY_CONFLICTING:
        return `${device1.name} may conflict with ${device2.name}`;
      case CompatibilityLevel.INCOMPATIBLE:
        return `${device1.name} is incompatible with ${device2.name}`;
      default:
        return `${device1.name} has neutral compatibility with ${device2.name}`;
    }
  }

  public highlightCompatibleDevices(selectedDevice: DeviceVisual): CompatibilityHighlight[] {
    const template = (selectedDevice as any).template as DeviceTemplate;
    const position = (selectedDevice as any).gridPosition as Vector2;
    
    return this.checkDeviceCompatibility(template, position);
  }

  private showCompatibilityHighlights(device: DeviceTemplate): void {
    // This would show visual highlights for compatible devices
    // Implementation would add visual indicators to the canvas
  }

  private showPlacementFeedback(feedback: PlacementFeedback): void {
    const feedbackElement = this.container.querySelector('.placement-feedback') as HTMLElement;
    feedbackElement.textContent = feedback.message;
    feedbackElement.className = `placement-feedback visible ${feedback.visualIndicator}`;
  }

  private hidePlacementFeedback(): void {
    const feedbackElement = this.container.querySelector('.placement-feedback') as HTMLElement;
    feedbackElement.classList.remove('visible');
  }

  private updateDeviceCount(): void {
    const countElement = this.container.querySelector('.device-count') as HTMLElement;
    const count = this.placedDevices.size;
    countElement.textContent = `${count} device${count !== 1 ? 's' : ''}`;
  }

  private getEnvironmentDisplayName(environment: EnvironmentType): string {
    switch (environment) {
      case EnvironmentType.HOME:
        return 'Living Room';
      case EnvironmentType.HOSPITAL:
        return 'Patient Room';
      case EnvironmentType.OFFICE:
        return 'Office Space';
      default:
        return 'Room';
    }
  }

  private showRoomTemplates(): void {
    const templatesPanel = this.container.querySelector('.room-templates-panel') as HTMLElement;
    templatesPanel.style.display = 'flex';
  }

  private hideRoomTemplates(): void {
    const templatesPanel = this.container.querySelector('.room-templates-panel') as HTMLElement;
    templatesPanel.style.display = 'none';
  }

  private applyRoomTemplate(template: any): void {
    // Clear existing devices
    this.placedDevices.clear();
    
    // Place template devices
    template.layout.forEach((item: any) => {
      const deviceTemplate = this.deviceLibrary.devices.find(d => d.id === item.deviceId);
      if (deviceTemplate) {
        this.placeDevice(deviceTemplate, { x: item.x, y: item.y });
      }
    });
    
    this.hideRoomTemplates();
  }

  // Public API
  public displayDeviceLibrary(): DeviceLibrary {
    return this.deviceLibrary;
  }

  // Callback setters
  public setDevicePlacedCallback(callback: (device: DeviceVisual) => void): void {
    this.onDevicePlacedCallback = callback;
  }

  public setDeviceRemovedCallback(callback: (deviceId: string) => void): void {
    this.onDeviceRemovedCallback = callback;
  }

  public setEnvironmentChangedCallback(callback: (environment: EnvironmentType) => void): void {
    this.onEnvironmentChangedCallback = callback;
  }

  /**
   * Get all placed devices
   */
  public getPlacedDevices(): DeviceVisual[] {
    return Array.from(this.placedDevices.values());
  }

  /**
   * Clear all devices
   */
  public clearAllDevices(): void {
    this.placedDevices.clear();
    this.redrawDevices();
    this.updateDeviceCount();
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('RoomDesigner accessibility settings applied:', settings);
    if (settings.highContrast) {
      this.designerElement.classList.add('high-contrast');
    } else {
      this.designerElement.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      this.designerElement.classList.add('large-text');
    } else {
      this.designerElement.classList.remove('large-text');
    }

    if (settings.keyboardNavigation) {
      this.enableKeyboardNavigation();
    }
  }

  private enableKeyboardNavigation(): void {
    console.log('Keyboard navigation enabled for room designer');
    // Add keyboard navigation support
    this.designerElement.setAttribute('tabindex', '0');
  }

  public hide(): void {
    this.designerElement.style.display = 'none';
  }

  public show(): void {
    this.designerElement.style.display = 'block';
  }

  /**
   * Dispose of resources and remove event listeners
   */
  public dispose(): void {
    window.removeEventListener('resize', this.resizeCanvas);
    // Remove other event listeners as needed
  }
}