import * as THREE from 'three';
import { GameScene, DeviceVisual, AnimationType, CrisisVisual, EffectType, Vector3 } from '@/types/core';
import { PerformanceOptimizer, PerformanceMetrics, createDefaultOptimizationSettings } from './PerformanceOptimizer';
import { CollisionOptimizer } from './CollisionOptimizer';

/**
 * GameRenderer manages 2.5D isometric rendering with smooth animations and visual effects
 */
export class GameRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private animationMixer: THREE.AnimationMixer;
  private clock: THREE.Clock;
  private container: HTMLElement;
  private performanceOptimizer: PerformanceOptimizer;
  private collisionOptimizer: CollisionOptimizer;
  private deviceMeshCache: Map<string, THREE.Mesh> = new Map();
  private lastRenderTime: number = 0;

  // Isometric camera settings
  private readonly CAMERA_DISTANCE = 20;
  private readonly CAMERA_ANGLE = Math.PI / 6; // 30 degrees
  private readonly FRUSTUM_SIZE = 20;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    
    // Initialize performance optimization
    this.performanceOptimizer = new PerformanceOptimizer(createDefaultOptimizationSettings());
    
    // Initialize collision optimization
    const bounds = {
      min: { x: -50, y: -50, z: -50 },
      max: { x: 50, y: 50, z: 50 }
    };
    this.collisionOptimizer = new CollisionOptimizer(bounds, 10, 15);
    
    this.initializeRenderer();
    this.initializeScene();
    this.initializeCamera();
    this.initializeLighting();
  }

  private initializeRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.container.appendChild(this.renderer.domElement);
  }

  private initializeScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.fog = new THREE.Fog(0xf0f0f0, 50, 200);
    
    this.animationMixer = new THREE.AnimationMixer(this.scene);
  }

  private initializeCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      -this.FRUSTUM_SIZE * aspect / 2,
      this.FRUSTUM_SIZE * aspect / 2,
      this.FRUSTUM_SIZE / 2,
      -this.FRUSTUM_SIZE / 2,
      0.1,
      1000
    );
    
    // Set isometric view
    this.camera.position.set(
      this.CAMERA_DISTANCE * Math.cos(this.CAMERA_ANGLE),
      this.CAMERA_DISTANCE * Math.sin(this.CAMERA_ANGLE),
      this.CAMERA_DISTANCE * Math.cos(this.CAMERA_ANGLE)
    );
    
    this.camera.lookAt(0, 0, 0);
  }

  private initializeLighting(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);
    
    // Fill light for softer shadows
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  /**
   * Render the complete game scene with performance optimization
   */
  public renderScene(gameScene: GameScene): void {
    this.performanceOptimizer.startFrame();
    const renderStartTime = performance.now();
    
    // Get camera position for LOD calculations
    const cameraPosition: Vector3 = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
    
    // Apply frustum culling and LOD
    const visibleDevices = this.performanceOptimizer.getVisibleDevices(gameScene.devices, cameraPosition);
    
    // Update collision optimizer
    this.collisionOptimizer.updateSpatialGrid(visibleDevices);
    
    // Clear previous scene objects (except lights)
    const objectsToRemove = this.scene.children.filter(child => 
      !(child instanceof THREE.Light) && !(child instanceof THREE.Camera)
    );
    objectsToRemove.forEach(obj => this.scene.remove(obj));
    
    // Add environment with LOD
    if (gameScene.environment) {
      gameScene.environment.meshes.forEach(mesh => {
        this.scene.add(mesh);
      });
    }
    
    // Add visible devices with LOD optimization
    let particleCount = 0;
    visibleDevices.forEach(device => {
      if (device.model3D && device.model3D.mesh) {
        const lodLevel = this.performanceOptimizer.getLODLevel(device, cameraPosition);
        
        // Apply LOD to device mesh
        this.applyLODToDevice(device, lodLevel);
        
        device.model3D.mesh.position.set(
          device.position.x,
          device.position.y,
          device.position.z
        );
        this.scene.add(device.model3D.mesh);
        
        particleCount += lodLevel.particleCount;
      }
    });
    
    // Update performance metrics
    this.performanceOptimizer.updateDeviceMetrics(gameScene.devices.length, visibleDevices.length);
    
    // Update camera if needed
    if (gameScene.camera) {
      this.updateCamera(gameScene.camera);
    }
    
    // Apply visual effects with performance consideration
    const effectsToRender = this.shouldReduceEffects() ? 
      gameScene.effects.slice(0, Math.min(5, gameScene.effects.length)) : 
      gameScene.effects;
      
    effectsToRender.forEach(effect => {
      this.applyVisualEffect(effect);
    });
    
    const renderTime = performance.now() - renderStartTime;
    this.performanceOptimizer.updateRenderMetrics(renderTime, particleCount);
    this.performanceOptimizer.endFrame();
    
    // Apply adaptive optimization
    this.performanceOptimizer.adaptiveOptimization();
    
    // Optimize collision detection based on performance
    const metrics = this.performanceOptimizer.getMetrics();
    this.collisionOptimizer.optimizeInteractionRange(
      gameScene.devices.length, 
      60, 
      metrics.fps
    );
  }

  /**
   * Animate a specific device with the given animation type
   */
  public animateDevice(device: DeviceVisual, animation: AnimationType): void {
    if (!device.model3D || !device.animations) return;
    
    const animationClip = device.animations[animation];
    if (!animationClip) return;
    
    // Stop previous animations for this device
    this.animationMixer.stopAllAction();
    
    // Create and play new animation
    const action = this.animationMixer.clipAction(animationClip, device.model3D.mesh);
    action.reset();
    action.fadeIn(0.2);
    action.play();
    
    // Add personality-based animation modifications
    this.applyPersonalityToAnimation(action, device.personalityIndicators);
  }

  /**
   * Show connection effect between two devices
   */
  public showConnectionEffect(from: DeviceVisual, to: DeviceVisual, effectType: EffectType): void {
    const startPos = new THREE.Vector3(from.position.x, from.position.y, from.position.z);
    const endPos = new THREE.Vector3(to.position.x, to.position.y, to.position.z);
    
    // Create connection line
    const geometry = new THREE.BufferGeometry().setFromPoints([startPos, endPos]);
    const material = this.getConnectionMaterial(effectType);
    const line = new THREE.Line(geometry, material);
    
    this.scene.add(line);
    
    // Animate the connection
    this.animateConnection(line, effectType);
    
    // Add particle effects
    this.createConnectionParticles(startPos, endPos, effectType);
  }

  /**
   * Display crisis visual effects
   */
  public displayCrisisEffect(crisis: CrisisVisual): void {
    // Screen shake effect
    if (crisis.screenShake) {
      this.applyScreenShake(crisis.severity);
    }
    
    // Color overlay
    if (crisis.colorOverlay) {
      this.applyColorOverlay(crisis.colorOverlay, crisis.severity);
    }
    
    // Apply crisis-specific effects
    crisis.effects.forEach(effect => {
      this.applyVisualEffect(effect);
    });
  }

  private updateCamera(cameraState: any): void {
    this.camera.position.set(
      cameraState.position.x,
      cameraState.position.y,
      cameraState.position.z
    );
    
    if (cameraState.target) {
      this.camera.lookAt(
        cameraState.target.x,
        cameraState.target.y,
        cameraState.target.z
      );
    }
  }

  private applyPersonalityToAnimation(action: THREE.AnimationAction, personality: any[]): void {
    // Modify animation based on personality traits
    personality.forEach(trait => {
      switch (trait.animationStyle) {
        case 'bouncy':
          action.setEffectiveTimeScale(1.2);
          break;
        case 'jerky':
          action.setEffectiveTimeScale(0.8);
          break;
        case 'smooth':
          action.setEffectiveTimeScale(1.0);
          break;
        case 'rigid':
          action.setEffectiveTimeScale(0.6);
          break;
      }
    });
  }

  private getConnectionMaterial(effectType: EffectType): THREE.Material {
    const colors = {
      [EffectType.CONNECTION]: 0x00ff00,
      [EffectType.COOPERATION]: 0x00aa00,
      [EffectType.CONFLICT]: 0xff0000,
      [EffectType.CRISIS]: 0xff4444,
      [EffectType.SUCCESS]: 0x00ffff
    };
    
    return new THREE.LineBasicMaterial({
      color: colors[effectType] || 0xffffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
  }

  private animateConnection(line: THREE.Line, effectType: EffectType): void {
    // Animate line opacity and scale
    const duration = effectType === EffectType.CRISIS ? 0.5 : 1.0;
    
    // Simple fade in/out animation
    let opacity = 0;
    const fadeIn = () => {
      opacity += 0.05;
      if (line.material instanceof THREE.LineBasicMaterial) {
        line.material.opacity = Math.min(opacity, 0.8);
      }
      
      if (opacity < 0.8) {
        requestAnimationFrame(fadeIn);
      } else {
        // Start fade out after delay
        setTimeout(() => {
          const fadeOut = () => {
            opacity -= 0.02;
            if (line.material instanceof THREE.LineBasicMaterial) {
              line.material.opacity = Math.max(opacity, 0);
            }
            
            if (opacity > 0) {
              requestAnimationFrame(fadeOut);
            } else {
              this.scene.remove(line);
            }
          };
          fadeOut();
        }, duration * 1000);
      }
    };
    
    fadeIn();
  }

  private createConnectionParticles(start: THREE.Vector3, end: THREE.Vector3, effectType: EffectType): void {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    // Create particles along the connection line
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1);
      positions[i * 3] = start.x + (end.x - start.x) * t;
      positions[i * 3 + 1] = start.y + (end.y - start.y) * t;
      positions[i * 3 + 2] = start.z + (end.z - start.z) * t;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: effectType === EffectType.CONFLICT ? 0xff0000 : 0x00ff00,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // Animate particles
    setTimeout(() => {
      this.scene.remove(particles);
    }, 2000);
  }

  private applyVisualEffect(effect: any): void {
    // Apply various visual effects based on type
    switch (effect.type) {
      case EffectType.CRISIS:
        this.applyCrisisEffect(effect);
        break;
      case EffectType.SUCCESS:
        this.applySuccessEffect(effect);
        break;
      default:
        // Generic effect application
        break;
    }
  }

  private applyCrisisEffect(effect: any): void {
    // Add red tint to scene
    this.scene.background = new THREE.Color(0xff4444);
    
    // Reset after duration
    setTimeout(() => {
      this.scene.background = new THREE.Color(0xf0f0f0);
    }, effect.duration * 1000);
  }

  private applySuccessEffect(effect: any): void {
    // Add green tint to scene
    this.scene.background = new THREE.Color(0x44ff44);
    
    // Reset after duration
    setTimeout(() => {
      this.scene.background = new THREE.Color(0xf0f0f0);
    }, effect.duration * 1000);
  }

  private applyScreenShake(severity: number): void {
    const shakeIntensity = severity * 0.1;
    const originalPosition = this.camera.position.clone();
    
    const shake = () => {
      this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
      this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
      this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
    };
    
    const shakeInterval = setInterval(shake, 50);
    
    setTimeout(() => {
      clearInterval(shakeInterval);
      this.camera.position.copy(originalPosition);
    }, 1000);
  }

  private applyColorOverlay(color: string, intensity: number): void {
    // Create overlay plane
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: intensity * 0.3
    });
    
    const overlay = new THREE.Mesh(geometry, material);
    overlay.position.z = 10; // In front of everything
    this.scene.add(overlay);
    
    // Remove overlay after duration
    setTimeout(() => {
      this.scene.remove(overlay);
    }, 2000);
  }

  private applyLODToDevice(device: DeviceVisual, lodLevel: any): void {
    if (!device.model3D || !device.model3D.mesh) return;
    
    const mesh = device.model3D.mesh;
    
    // Apply model complexity (simplified geometry for distant objects)
    if (lodLevel.modelComplexity < 1.0) {
      // Reduce geometry detail for distant objects
      if (mesh.geometry instanceof THREE.BufferGeometry) {
        const positionAttribute = mesh.geometry.getAttribute('position');
        if (positionAttribute && lodLevel.modelComplexity < 0.5) {
          // Use simplified geometry for very distant objects
          mesh.visible = lodLevel.modelComplexity > 0.2;
        }
      }
    }
    
    // Apply shadow quality
    mesh.castShadow = lodLevel.shadowQuality > 0.5;
    mesh.receiveShadow = lodLevel.shadowQuality > 0.3;
    
    // Apply animation quality (handled in animateDevice method)
  }

  private shouldReduceEffects(): boolean {
    const metrics = this.performanceOptimizer.getMetrics();
    return metrics.fps < 45 || metrics.deviceCount > 30;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceOptimizer.getMetrics();
  }

  public getCollisionOptimizer(): CollisionOptimizer {
    return this.collisionOptimizer;
  }

  public updateOptimizationSettings(settings: any): void {
    this.performanceOptimizer.updateSettings(settings);
  }

  private isAnimating: boolean = false;
  private animationId: number | null = null;

  /**
   * Start the render loop
   */
  public start(): void {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }

  /**
   * Stop the render loop
   */
  public stop(): void {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = (): void => {
    if (!this.isAnimating) return;
    
    this.animationId = requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    this.animationMixer.update(delta);
    
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Handle window resize
   */
  public onWindowResize(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    
    this.camera.left = -this.FRUSTUM_SIZE * aspect / 2;
    this.camera.right = this.FRUSTUM_SIZE * aspect / 2;
    this.camera.top = this.FRUSTUM_SIZE / 2;
    this.camera.bottom = -this.FRUSTUM_SIZE / 2;
    
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.renderer.dispose();
    this.animationMixer.stopAllAction();
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('GameRenderer accessibility settings applied:', settings);
    if (settings.highContrast) {
      this.renderer.setClearColor(0x000000);
    }
    if (settings.reducedMotion) {
      this.animationMixer.timeScale = 0.5;
    }
  }
}