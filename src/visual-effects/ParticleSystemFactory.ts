import * as THREE from 'three';
import {
  ParticleEffect,
  ParticleEffectType,
  EffectParameters,
  ParticleData,
  VisualQualitySettings,
  QualityLevel
} from '../types/visual-effects';
import { Vector3 } from '../types/core';

export class ParticleSystemFactory {
  private qualitySettings: VisualQualitySettings;
  private textureLoader: THREE.TextureLoader;
  private particleTextures: Map<string, THREE.Texture> = new Map();

  constructor(qualitySettings: VisualQualitySettings) {
    this.qualitySettings = qualitySettings;
    this.textureLoader = new THREE.TextureLoader();
    this.loadParticleTextures();
  }

  private loadParticleTextures(): void {
    // Create procedural textures for particles
    this.particleTextures.set('spark', this.createSparkTexture());
    this.particleTextures.set('glow', this.createGlowTexture());
    this.particleTextures.set('dot', this.createDotTexture());
    this.particleTextures.set('star', this.createStarTexture());
    this.particleTextures.set('energy', this.createEnergyTexture());
    this.particleTextures.set('data', this.createDataTexture());
  }

  createParticleEffect(
    id: string,
    type: ParticleEffectType,
    position: Vector3,
    parameters: EffectParameters
  ): ParticleEffect {
    const config = this.getParticleConfig(type);
    const mergedParams = { ...config.defaultParameters, ...parameters };
    
    const maxParticles = this.calculateMaxParticles(config.baseParticleCount);
    const geometry = this.createParticleGeometry(maxParticles);
    const material = this.createParticleMaterial(type, mergedParams);
    
    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.position.set(position.x, position.y, position.z);
    
    return {
      id,
      type,
      position,
      particleSystem,
      geometry,
      material,
      particles: [],
      emissionRate: config.emissionRate,
      lifetime: mergedParams.duration || -1,
      maxParticles,
      active: true,
      parameters: mergedParams
    };
  }

  private getParticleConfig(type: ParticleEffectType): {
    baseParticleCount: number;
    emissionRate: number;
    defaultParameters: EffectParameters;
    textureKey: string;
  } {
    const configs = {
      [ParticleEffectType.COMMUNICATION]: {
        baseParticleCount: 50,
        emissionRate: 20,
        defaultParameters: {
          color: new THREE.Color(0.3, 0.7, 1.0),
          size: 0.05,
          speed: 2,
          intensity: 1
        },
        textureKey: 'data'
      },
      [ParticleEffectType.COOPERATION]: {
        baseParticleCount: 100,
        emissionRate: 30,
        defaultParameters: {
          color: new THREE.Color(0.2, 1.0, 0.3),
          size: 0.08,
          speed: 1.5,
          intensity: 1
        },
        textureKey: 'glow'
      },
      [ParticleEffectType.CONFLICT]: {
        baseParticleCount: 80,
        emissionRate: 40,
        defaultParameters: {
          color: new THREE.Color(1.0, 0.2, 0.2),
          size: 0.06,
          speed: 3,
          intensity: 1
        },
        textureKey: 'spark'
      },
      [ParticleEffectType.ENERGY_FLOW]: {
        baseParticleCount: 60,
        emissionRate: 25,
        defaultParameters: {
          color: new THREE.Color(1.0, 0.8, 0.2),
          size: 0.04,
          speed: 4,
          intensity: 1
        },
        textureKey: 'energy'
      },
      [ParticleEffectType.DATA_TRANSFER]: {
        baseParticleCount: 40,
        emissionRate: 15,
        defaultParameters: {
          color: new THREE.Color(0.5, 0.5, 1.0),
          size: 0.03,
          speed: 5,
          intensity: 1
        },
        textureKey: 'data'
      },
      [ParticleEffectType.SYSTEM_OVERLOAD]: {
        baseParticleCount: 150,
        emissionRate: 60,
        defaultParameters: {
          color: new THREE.Color(1.0, 0.1, 0.1),
          size: 0.1,
          speed: 2,
          intensity: 1
        },
        textureKey: 'spark'
      },
      [ParticleEffectType.HARMONY_RESONANCE]: {
        baseParticleCount: 120,
        emissionRate: 35,
        defaultParameters: {
          color: new THREE.Color(0.8, 0.9, 1.0),
          size: 0.07,
          speed: 1,
          intensity: 1
        },
        textureKey: 'star'
      },
      [ParticleEffectType.DEVICE_STARTUP]: {
        baseParticleCount: 30,
        emissionRate: 50,
        defaultParameters: {
          color: new THREE.Color(0.2, 1.0, 0.8),
          size: 0.05,
          speed: 2,
          intensity: 1,
          duration: 2
        },
        textureKey: 'glow'
      },
      [ParticleEffectType.DEVICE_SHUTDOWN]: {
        baseParticleCount: 20,
        emissionRate: 30,
        defaultParameters: {
          color: new THREE.Color(0.8, 0.4, 0.2),
          size: 0.04,
          speed: 1,
          intensity: 1,
          duration: 1.5
        },
        textureKey: 'dot'
      },
      [ParticleEffectType.LEARNING_PROCESS]: {
        baseParticleCount: 70,
        emissionRate: 20,
        defaultParameters: {
          color: new THREE.Color(0.9, 0.7, 1.0),
          size: 0.06,
          speed: 1.5,
          intensity: 1
        },
        textureKey: 'star'
      },
      [ParticleEffectType.ERROR_INDICATION]: {
        baseParticleCount: 40,
        emissionRate: 25,
        defaultParameters: {
          color: new THREE.Color(1.0, 0.3, 0.0),
          size: 0.08,
          speed: 2.5,
          intensity: 1,
          duration: 3
        },
        textureKey: 'spark'
      },
      [ParticleEffectType.SUCCESS_CELEBRATION]: {
        baseParticleCount: 100,
        emissionRate: 80,
        defaultParameters: {
          color: new THREE.Color(1.0, 0.9, 0.2),
          size: 0.1,
          speed: 3,
          intensity: 1,
          duration: 4
        },
        textureKey: 'star'
      }
    };

    return configs[type] || configs[ParticleEffectType.COMMUNICATION];
  }

  private calculateMaxParticles(baseCount: number): number {
    const qualityMultiplier = this.getQualityMultiplier();
    const maxAllowed = this.qualitySettings.maxParticles;
    
    return Math.min(Math.floor(baseCount * qualityMultiplier), maxAllowed);
  }

  private getQualityMultiplier(): number {
    switch (this.qualitySettings.particleQuality) {
      case QualityLevel.LOW: return 0.3;
      case QualityLevel.MEDIUM: return 0.6;
      case QualityLevel.HIGH: return 1.0;
      case QualityLevel.ULTRA: return 1.5;
      default: return 0.6;
    }
  }

  private createParticleGeometry(maxParticles: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    
    // Create attribute arrays
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const opacities = new Float32Array(maxParticles);
    const rotations = new Float32Array(maxParticles);
    
    // Initialize with default values
    for (let i = 0; i < maxParticles; i++) {
      const i3 = i * 3;
      
      // Position (will be updated by particle system)
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Color (white by default)
      colors[i3] = 1;
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 1;
      
      // Size and opacity
      sizes[i] = 1;
      opacities[i] = 0; // Start invisible
      rotations[i] = 0;
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
    
    return geometry;
  }

  private createParticleMaterial(
    type: ParticleEffectType, 
    parameters: EffectParameters
  ): THREE.PointsMaterial | THREE.ShaderMaterial {
    const config = this.getParticleConfig(type);
    const texture = this.particleTextures.get(config.textureKey);
    
    if (this.qualitySettings.shaderQuality === QualityLevel.LOW) {
      // Use simple PointsMaterial for low quality
      return new THREE.PointsMaterial({
        color: parameters.color as THREE.Color || new THREE.Color(1, 1, 1),
        size: (parameters.size as number) || 0.1,
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
    } else {
      // Use custom shader for higher quality
      return this.createCustomParticleShader(type, parameters, texture);
    }
  }

  private createCustomParticleShader(
    type: ParticleEffectType,
    parameters: EffectParameters,
    texture?: THREE.Texture
  ): THREE.ShaderMaterial {
    const vertexShader = `
      attribute float size;
      attribute float opacity;
      attribute float rotation;
      
      varying vec3 vColor;
      varying float vOpacity;
      varying float vRotation;
      
      void main() {
        vColor = color;
        vOpacity = opacity;
        vRotation = rotation;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const fragmentShader = `
      uniform sampler2D map;
      uniform float time;
      
      varying vec3 vColor;
      varying float vOpacity;
      varying float vRotation;
      
      void main() {
        vec2 coords = gl_PointCoord;
        
        // Apply rotation
        float cosR = cos(vRotation);
        float sinR = sin(vRotation);
        coords = vec2(
          cosR * (coords.x - 0.5) + sinR * (coords.y - 0.5) + 0.5,
          cosR * (coords.y - 0.5) - sinR * (coords.x - 0.5) + 0.5
        );
        
        vec4 texColor = texture2D(map, coords);
        
        // Apply color and opacity
        gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vOpacity);
        
        // Add some sparkle effect for certain types
        ${this.getSparkleEffect(type)}
      }
    `;
    
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        time: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      alphaTest: 0.1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  private getSparkleEffect(type: ParticleEffectType): string {
    switch (type) {
      case ParticleEffectType.SUCCESS_CELEBRATION:
      case ParticleEffectType.HARMONY_RESONANCE:
        return `
          float sparkle = sin(time * 10.0 + gl_FragCoord.x * 0.1) * 0.5 + 0.5;
          gl_FragColor.rgb += sparkle * 0.3;
        `;
      case ParticleEffectType.ENERGY_FLOW:
        return `
          float pulse = sin(time * 5.0) * 0.5 + 0.5;
          gl_FragColor.rgb *= (1.0 + pulse * 0.5);
        `;
      default:
        return '';
    }
  }

  // Texture creation methods
  private createSparkTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    // Add spark rays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = 32 + Math.cos(angle) * 10;
      const y1 = 32 + Math.sin(angle) * 10;
      const x2 = 32 + Math.cos(angle) * 25;
      const y2 = 32 + Math.sin(angle) * 25;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createGlowTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createDotTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createStarTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Create star shape
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    
    const centerX = 32;
    const centerY = 32;
    const outerRadius = 25;
    const innerRadius = 12;
    const points = 5;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Add glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createEnergyTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // Create energy orb with electric effect
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 100, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 200, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    // Add electric arcs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(32, 32);
      
      const angle = (i / 6) * Math.PI * 2;
      let x = 32;
      let y = 32;
      
      for (let j = 0; j < 20; j++) {
        x += Math.cos(angle + (Math.random() - 0.5) * 0.5) * 1.5;
        y += Math.sin(angle + (Math.random() - 0.5) * 0.5) * 1.5;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createDataTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    
    // Create data packet visualization
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(8, 8, 16, 16);
    
    // Add data lines
    ctx.fillStyle = 'rgba(100, 150, 255, 1)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(10, 10 + i * 3, 12, 1);
    }
    
    // Add glow
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0)');
    gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}