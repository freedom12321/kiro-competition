import * as THREE from 'three';
import {
  VisualEffectsManager as IVisualEffectsManager,
  ParticleEffect,
  ConnectionEffect,
  CooperationEffect,
  CrisisEffect,
  ParticleEffectType,
  ConnectionType,
  CrisisEffectType,
  EffectParameters,
  ParticleData,
  EffectPool,
  PerformanceMetrics,
  VisualQualitySettings,
  QualityLevel,
  EffectLOD
} from '../types/visual-effects';
import { Vector3 } from '../types/core';
import { ParticleSystemFactory } from './ParticleSystemFactory';
import { ConnectionEffectFactory } from './ConnectionEffectFactory';
import { CooperationEffectFactory } from './CooperationEffectFactory';
import { CrisisEffectFactory } from './CrisisEffectFactory';

export class VisualEffectsManager implements IVisualEffectsManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  private particleSystemFactory: ParticleSystemFactory;
  private connectionEffectFactory: ConnectionEffectFactory;
  private cooperationEffectFactory: CooperationEffectFactory;
  private crisisEffectFactory: CrisisEffectFactory;
  
  private activeEffects: Map<string, ParticleEffect | ConnectionEffect | CooperationEffect | CrisisEffect> = new Map();
  private effectPool: EffectPool;
  private qualitySettings: VisualQualitySettings;
  private performanceMetrics: PerformanceMetrics;
  
  private clock: THREE.Clock;
  private effectIdCounter = 0;
  
  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.clock = new THREE.Clock();
    
    this.initializeQualitySettings();
    this.initializeEffectPool();
    this.initializeFactories();
    this.initializePerformanceMetrics();
  }

  private initializeQualitySettings(): void {
    // Detect device capabilities and set appropriate quality
    const canvas = this.renderer.domElement;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const isHighEnd = gl && this.renderer.capabilities.maxTextures > 16;
    
    this.qualitySettings = {
      particleQuality: isHighEnd ? QualityLevel.HIGH : QualityLevel.MEDIUM,
      shaderQuality: isHighEnd ? QualityLevel.HIGH : QualityLevel.MEDIUM,
      animationQuality: QualityLevel.HIGH,
      postProcessingQuality: isHighEnd ? QualityLevel.MEDIUM : QualityLevel.LOW,
      maxParticles: isHighEnd ? 10000 : 5000,
      maxEffects: isHighEnd ? 50 : 25,
      enableLOD: true,
      enableOcclusion: isHighEnd
    };
  }

  private initializeEffectPool(): void {
    this.effectPool = {
      particleEffects: [],
      connectionEffects: [],
      cooperationEffects: [],
      crisisEffects: [],
      availableEffects: new Map(),
      maxPoolSize: 100
    };
  }

  private initializeFactories(): void {
    this.particleSystemFactory = new ParticleSystemFactory(this.qualitySettings);
    this.connectionEffectFactory = new ConnectionEffectFactory(this.qualitySettings);
    this.cooperationEffectFactory = new CooperationEffectFactory(this.qualitySettings);
    this.crisisEffectFactory = new CrisisEffectFactory(this.qualitySettings);
  }

  private initializePerformanceMetrics(): void {
    this.performanceMetrics = {
      activeEffects: 0,
      totalParticles: 0,
      frameTime: 0,
      memoryUsage: 0,
      gpuUtilization: 0
    };
  }

  createParticleEffect(
    type: ParticleEffectType, 
    position: Vector3, 
    parameters: EffectParameters = {}
  ): ParticleEffect {
    const effectId = this.generateEffectId();
    
    // Try to get from pool first
    let effect = this.getFromPool(type);
    
    if (!effect) {
      effect = this.particleSystemFactory.createParticleEffect(effectId, type, position, parameters);
    } else {
      // Reset pooled effect
      this.resetParticleEffect(effect, effectId, position, parameters);
    }
    
    this.activeEffects.set(effectId, effect);
    this.scene.add(effect.particleSystem);
    
    return effect;
  }

  createConnectionEffect(from: Vector3, to: Vector3, type: ConnectionType): ConnectionEffect {
    const effectId = this.generateEffectId();
    const effect = this.connectionEffectFactory.createConnectionEffect(effectId, from, to, type);
    
    this.activeEffects.set(effectId, effect);
    this.scene.add(effect.line);
    
    // Add particle effects along the connection
    effect.particles.forEach(particle => {
      this.scene.add(particle.particleSystem);
    });
    
    return effect;
  }

  createCooperationEffect(devices: Vector3[], intensity: number): CooperationEffect {
    const effectId = this.generateEffectId();
    const effect = this.cooperationEffectFactory.createCooperationEffect(effectId, devices, intensity);
    
    this.activeEffects.set(effectId, effect);
    
    // Add all visual components to scene
    if (effect.resonanceField) {
      this.scene.add(effect.resonanceField);
    }
    
    effect.harmonyParticles.forEach(particle => {
      this.scene.add(particle.particleSystem);
    });
    
    effect.pulseRings.forEach(ring => {
      this.scene.add(ring);
    });
    
    return effect;
  }

  createCrisisEffect(position: Vector3, crisisType: CrisisEffectType, severity: number): CrisisEffect {
    const effectId = this.generateEffectId();
    const effect = this.crisisEffectFactory.createCrisisEffect(effectId, position, crisisType, severity);
    
    this.activeEffects.set(effectId, effect);
    
    // Add visual components to scene
    if (effect.warningOverlay) {
      this.scene.add(effect.warningOverlay);
    }
    
    if (effect.distortionField) {
      this.scene.add(effect.distortionField);
    }
    
    effect.chaosParticles.forEach(particle => {
      this.scene.add(particle.particleSystem);
    });
    
    return effect;
  }

  updateEffects(deltaTime: number): void {
    const startTime = performance.now();
    
    this.performanceMetrics.activeEffects = this.activeEffects.size;
    this.performanceMetrics.totalParticles = 0;
    
    const effectsToRemove: string[] = [];
    
    this.activeEffects.forEach((effect, effectId) => {
      if (this.isParticleEffect(effect)) {
        this.updateParticleEffect(effect, deltaTime);
        this.performanceMetrics.totalParticles += effect.particles.length;
        
        if (!effect.active && effect.particles.length === 0) {
          effectsToRemove.push(effectId);
        }
      } else if (this.isConnectionEffect(effect)) {
        this.updateConnectionEffect(effect, deltaTime);
        
        if (!effect.active) {
          effectsToRemove.push(effectId);
        }
      } else if (this.isCooperationEffect(effect)) {
        this.updateCooperationEffect(effect, deltaTime);
        
        if (!effect.active) {
          effectsToRemove.push(effectId);
        }
      } else if (this.isCrisisEffect(effect)) {
        this.updateCrisisEffect(effect, deltaTime);
        
        if (!effect.active) {
          effectsToRemove.push(effectId);
        }
      }
    });
    
    // Remove completed effects
    effectsToRemove.forEach(effectId => {
      this.removeEffect(effectId);
    });
    
    // Update performance metrics
    this.performanceMetrics.frameTime = performance.now() - startTime;
    
    // Optimize performance if needed
    this.optimizePerformance();
  }

  private updateParticleEffect(effect: ParticleEffect, deltaTime: number): void {
    if (!effect.active) return;
    
    const positions = effect.geometry.attributes.position.array as Float32Array;
    const colors = effect.geometry.attributes.color?.array as Float32Array;
    const sizes = effect.geometry.attributes.size?.array as Float32Array;
    const opacities = effect.geometry.attributes.opacity?.array as Float32Array;
    
    let activeParticles = 0;
    
    // Update existing particles
    for (let i = 0; i < effect.particles.length; i++) {
      const particle = effect.particles[i];
      
      if (particle.life > 0) {
        // Update particle physics
        particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime));
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
        
        // Update life
        particle.life -= deltaTime;
        const lifeRatio = particle.life / particle.maxLife;
        
        // Update visual properties
        particle.opacity = Math.max(0, lifeRatio);
        particle.size = particle.size * (0.5 + lifeRatio * 0.5);
        particle.rotation += particle.rotationSpeed * deltaTime;
        
        // Update buffer attributes
        const index = i * 3;
        positions[index] = particle.position.x;
        positions[index + 1] = particle.position.y;
        positions[index + 2] = particle.position.z;
        
        if (colors) {
          colors[index] = particle.color.r;
          colors[index + 1] = particle.color.g;
          colors[index + 2] = particle.color.b;
        }
        
        if (sizes) {
          sizes[i] = particle.size;
        }
        
        if (opacities) {
          opacities[i] = particle.opacity;
        }
        
        activeParticles++;
      }
    }
    
    // Emit new particles
    if (effect.active && activeParticles < effect.maxParticles) {
      const particlesToEmit = Math.min(
        Math.floor(effect.emissionRate * deltaTime),
        effect.maxParticles - activeParticles
      );
      
      for (let i = 0; i < particlesToEmit; i++) {
        this.emitParticle(effect);
      }
    }
    
    // Update geometry
    effect.geometry.attributes.position.needsUpdate = true;
    if (colors) effect.geometry.attributes.color.needsUpdate = true;
    if (sizes) effect.geometry.attributes.size.needsUpdate = true;
    if (opacities) effect.geometry.attributes.opacity.needsUpdate = true;
    
    // Check if effect should be deactivated
    if (effect.lifetime > 0) {
      effect.lifetime -= deltaTime;
      if (effect.lifetime <= 0) {
        effect.active = false;
      }
    }
  }

  private updateConnectionEffect(effect: ConnectionEffect, deltaTime: number): void {
    if (!effect.active) return;
    
    // Update connection line animation
    const material = effect.line.material as THREE.LineBasicMaterial;
    if (material.userData.pulseTime !== undefined) {
      material.userData.pulseTime += deltaTime * effect.pulseSpeed;
      
      // Create pulsing effect
      const pulse = Math.sin(material.userData.pulseTime) * 0.5 + 0.5;
      material.opacity = 0.3 + pulse * 0.7 * effect.intensity;
    }
    
    // Update particles along connection
    effect.particles.forEach(particle => {
      this.updateParticleEffect(particle, deltaTime);
    });
  }

  private updateCooperationEffect(effect: CooperationEffect, deltaTime: number): void {
    if (!effect.active) return;
    
    // Update resonance field
    if (effect.resonanceField) {
      const material = effect.resonanceField.material as THREE.MeshBasicMaterial;
      if (material.userData.time !== undefined) {
        material.userData.time += deltaTime;
        
        // Create pulsing resonance effect
        const pulse = Math.sin(material.userData.time * 2) * 0.5 + 0.5;
        material.opacity = 0.1 + pulse * 0.3 * effect.intensity;
      }
    }
    
    // Update pulse rings
    effect.pulseRings.forEach((ring, index) => {
      const scale = 1 + Math.sin(performance.now() * 0.001 + index) * 0.2;
      ring.scale.setScalar(scale);
    });
    
    // Update harmony particles
    effect.harmonyParticles.forEach(particle => {
      this.updateParticleEffect(particle, deltaTime);
    });
  }

  private updateCrisisEffect(effect: CrisisEffect, deltaTime: number): void {
    if (!effect.active) return;
    
    // Update warning overlay
    if (effect.warningOverlay) {
      const material = effect.warningOverlay.material as THREE.MeshBasicMaterial;
      if (material.userData.flashTime !== undefined) {
        material.userData.flashTime += deltaTime;
        
        // Create flashing warning effect
        const flash = Math.sin(material.userData.flashTime * 10) > 0 ? 1 : 0;
        material.opacity = flash * 0.5 * effect.severity;
      }
    }
    
    // Update distortion field
    if (effect.distortionField) {
      const material = effect.distortionField.material as THREE.ShaderMaterial;
      if (material.uniforms.time) {
        material.uniforms.time.value += deltaTime;
      }
    }
    
    // Update chaos particles
    effect.chaosParticles.forEach(particle => {
      this.updateParticleEffect(particle, deltaTime);
    });
  }

  private emitParticle(effect: ParticleEffect): void {
    // Find dead particle to reuse
    let particle = effect.particles.find(p => p.life <= 0);
    
    if (!particle) {
      // Create new particle if under limit
      if (effect.particles.length < effect.maxParticles) {
        particle = this.createParticle();
        effect.particles.push(particle);
      } else {
        return; // No available particles
      }
    }
    
    // Initialize particle based on effect type
    this.initializeParticle(particle, effect);
  }

  private createParticle(): ParticleData {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      size: 1,
      color: new THREE.Color(1, 1, 1),
      opacity: 1,
      rotation: 0,
      rotationSpeed: 0
    };
  }

  private initializeParticle(particle: ParticleData, effect: ParticleEffect): void {
    // Set position near effect origin with some randomness
    particle.position.copy(new THREE.Vector3(effect.position.x, effect.position.y, effect.position.z));
    particle.position.add(new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ));
    
    // Set velocity based on effect type
    const speed = effect.parameters.speed || 1;
    particle.velocity.set(
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed,
      (Math.random() - 0.5) * speed
    );
    
    // Set acceleration (gravity, forces, etc.)
    particle.acceleration.set(0, -0.1, 0);
    
    // Set life
    particle.maxLife = 1 + Math.random() * 2;
    particle.life = particle.maxLife;
    
    // Set visual properties
    particle.size = effect.parameters.size || 0.1;
    particle.color = effect.parameters.color || new THREE.Color(1, 1, 1);
    particle.opacity = 1;
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed = (Math.random() - 0.5) * 2;
  }

  removeEffect(effectId: string): void {
    const effect = this.activeEffects.get(effectId);
    if (!effect) return;
    
    // Remove from scene
    if (this.isParticleEffect(effect)) {
      this.scene.remove(effect.particleSystem);
      this.returnToPool(effect);
    } else if (this.isConnectionEffect(effect)) {
      this.scene.remove(effect.line);
      effect.particles.forEach(particle => {
        this.scene.remove(particle.particleSystem);
      });
    } else if (this.isCooperationEffect(effect)) {
      if (effect.resonanceField) this.scene.remove(effect.resonanceField);
      effect.harmonyParticles.forEach(particle => {
        this.scene.remove(particle.particleSystem);
      });
      effect.pulseRings.forEach(ring => {
        this.scene.remove(ring);
      });
    } else if (this.isCrisisEffect(effect)) {
      if (effect.warningOverlay) this.scene.remove(effect.warningOverlay);
      if (effect.distortionField) this.scene.remove(effect.distortionField);
      effect.chaosParticles.forEach(particle => {
        this.scene.remove(particle.particleSystem);
      });
    }
    
    this.activeEffects.delete(effectId);
  }

  private getFromPool(type: ParticleEffectType): ParticleEffect | null {
    const pooledEffects = this.effectPool.availableEffects.get(type);
    return pooledEffects && pooledEffects.length > 0 ? pooledEffects.pop()! : null;
  }

  private returnToPool(effect: ParticleEffect): void {
    if (this.effectPool.particleEffects.length < this.effectPool.maxPoolSize) {
      // Reset effect for reuse
      effect.active = false;
      effect.particles.forEach(particle => {
        particle.life = 0;
      });
      
      // Add to appropriate pool
      if (!this.effectPool.availableEffects.has(effect.type)) {
        this.effectPool.availableEffects.set(effect.type, []);
      }
      this.effectPool.availableEffects.get(effect.type)!.push(effect);
    }
  }

  private resetParticleEffect(
    effect: ParticleEffect, 
    newId: string, 
    position: Vector3, 
    parameters: EffectParameters
  ): void {
    effect.id = newId;
    effect.position = position;
    effect.parameters = { ...effect.parameters, ...parameters };
    effect.active = true;
    effect.lifetime = parameters.duration || -1; // -1 means infinite
    
    // Reset all particles
    effect.particles.forEach(particle => {
      particle.life = 0;
    });
  }

  private optimizePerformance(): void {
    // Reduce quality if performance is poor
    if (this.performanceMetrics.frameTime > 16.67) { // 60fps threshold
      this.reduceQuality();
    }
    
    // Implement LOD based on camera distance
    if (this.qualitySettings.enableLOD) {
      this.applyLevelOfDetail();
    }
    
    // Cull effects outside view frustum
    if (this.qualitySettings.enableOcclusion) {
      this.cullInvisibleEffects();
    }
  }

  private reduceQuality(): void {
    // Reduce particle counts
    this.activeEffects.forEach(effect => {
      if (this.isParticleEffect(effect)) {
        effect.maxParticles = Math.max(10, Math.floor(effect.maxParticles * 0.8));
      }
    });
  }

  private applyLevelOfDetail(): void {
    const cameraPosition = this.camera.position;
    
    this.activeEffects.forEach(effect => {
      if (this.isParticleEffect(effect)) {
        const distance = cameraPosition.distanceTo(
          new THREE.Vector3(effect.position.x, effect.position.y, effect.position.z)
        );
        
        const lod = this.calculateLOD(distance);
        this.applyLODToEffect(effect, lod);
      }
    });
  }

  private calculateLOD(distance: number): EffectLOD {
    if (distance < 10) {
      return {
        distance,
        particleCount: 1.0,
        updateFrequency: 1.0,
        enableShaders: true,
        enablePostProcessing: true
      };
    } else if (distance < 25) {
      return {
        distance,
        particleCount: 0.7,
        updateFrequency: 0.8,
        enableShaders: true,
        enablePostProcessing: false
      };
    } else {
      return {
        distance,
        particleCount: 0.3,
        updateFrequency: 0.5,
        enableShaders: false,
        enablePostProcessing: false
      };
    }
  }

  private applyLODToEffect(effect: ParticleEffect, lod: EffectLOD): void {
    const targetParticles = Math.floor(effect.maxParticles * lod.particleCount);
    
    // Reduce active particles if needed
    if (effect.particles.length > targetParticles) {
      for (let i = targetParticles; i < effect.particles.length; i++) {
        effect.particles[i].life = 0;
      }
    }
  }

  private cullInvisibleEffects(): void {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      (this.camera as THREE.PerspectiveCamera).projectionMatrix,
      (this.camera as THREE.PerspectiveCamera).matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    
    this.activeEffects.forEach(effect => {
      if (this.isParticleEffect(effect)) {
        const position = new THREE.Vector3(effect.position.x, effect.position.y, effect.position.z);
        const visible = frustum.containsPoint(position);
        
        if (effect.particleSystem.visible !== visible) {
          effect.particleSystem.visible = visible;
        }
      }
    });
  }

  private generateEffectId(): string {
    return `effect_${++this.effectIdCounter}`;
  }

  // Type guards
  private isParticleEffect(effect: any): effect is ParticleEffect {
    return effect && effect.particleSystem !== undefined;
  }

  private isConnectionEffect(effect: any): effect is ConnectionEffect {
    return effect && effect.line !== undefined;
  }

  private isCooperationEffect(effect: any): effect is CooperationEffect {
    return effect && effect.harmonyParticles !== undefined;
  }

  private isCrisisEffect(effect: any): effect is CrisisEffect {
    return effect && effect.chaosParticles !== undefined;
  }

  // Public getters for monitoring
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getActiveEffectCount(): number {
    return this.activeEffects.size;
  }

  setQualitySettings(settings: Partial<VisualQualitySettings>): void {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
  }

  cleanup(): void {
    // Remove all effects
    this.activeEffects.forEach((_, effectId) => {
      this.removeEffect(effectId);
    });
    
    // Clear pools
    this.effectPool.particleEffects = [];
    this.effectPool.connectionEffects = [];
    this.effectPool.cooperationEffects = [];
    this.effectPool.crisisEffects = [];
    this.effectPool.availableEffects.clear();
  }

  public showInteractionEffect(interaction: any): void {
    console.log('Showing interaction effect:', interaction);
  }

  public shutdown(): void {
    console.log('Visual effects manager shutdown');
    this.activeEffects.clear();
  }

  public showCrisisEffect(crisis: any): void {
    console.log('Showing crisis effect:', crisis);
  }

  public showStoryEffect(moment: any): void {
    console.log('Showing story effect:', moment);
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('VisualEffectsManager accessibility settings applied:', settings);
    if (settings.reducedMotion) {
      this.activeEffects.clear();
    }
  }
}