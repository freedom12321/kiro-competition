import * as THREE from 'three';
import {
  CameraController as ICameraController,
  CameraTransition,
  EasingFunction
} from '../types/visual-effects';
import { Vector3 } from '../types/core';

export class CameraController implements ICameraController {
  private camera: THREE.PerspectiveCamera;
  private defaultPosition: Vector3;
  private defaultLookAt: Vector3;
  private currentTransition: CameraTransition | null = null;
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private cinematicMode = false;
  private originalFOV: number;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.originalFOV = camera.fov;
    
    // Store default camera position
    this.defaultPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    
    // Calculate default look-at point
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const lookAtPoint = camera.position.clone().add(direction.multiplyScalar(10));
    this.defaultLookAt = {
      x: lookAtPoint.x,
      y: lookAtPoint.y,
      z: lookAtPoint.z
    };
  }

  async smoothTransition(
    targetPosition: Vector3, 
    targetLookAt: Vector3, 
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      };
      
      const currentLookAt = this.getCurrentLookAt();
      
      this.currentTransition = {
        startPosition,
        endPosition: targetPosition,
        startLookAt: currentLookAt,
        endLookAt: targetLookAt,
        duration,
        easing: EasingFunction.EASE_IN_OUT,
        onComplete: resolve
      };
      
      this.startTransition();
    });
  }

  async zoomToDevice(
    devicePosition: Vector3, 
    zoomLevel: number, 
    duration: number
  ): Promise<void> {
    // Calculate camera position for optimal device viewing
    const offset = new THREE.Vector3(3, 2, 3).multiplyScalar(zoomLevel);
    const targetPosition = {
      x: devicePosition.x + offset.x,
      y: devicePosition.y + offset.y,
      z: devicePosition.z + offset.z
    };
    
    return this.smoothTransition(targetPosition, devicePosition, duration);
  }

  shakeCamera(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    
    // Start shake animation
    this.animateShake();
  }

  async focusOnArea(center: Vector3, radius: number, duration: number): Promise<void> {
    // Calculate optimal camera position to view the entire area
    const distance = radius * 2.5; // Adjust multiplier for desired framing
    const height = radius * 0.8;
    
    const targetPosition = {
      x: center.x + distance * 0.7,
      y: center.y + height,
      z: center.z + distance * 0.7
    };
    
    return this.smoothTransition(targetPosition, center, duration);
  }

  async resetToDefault(duration: number): Promise<void> {
    this.cinematicMode = false;
    this.camera.fov = this.originalFOV;
    this.camera.updateProjectionMatrix();
    
    return this.smoothTransition(this.defaultPosition, this.defaultLookAt, duration);
  }

  enableCinematicMode(enabled: boolean): void {
    this.cinematicMode = enabled;
    
    if (enabled) {
      // Slightly wider FOV for cinematic feel
      this.camera.fov = this.originalFOV * 1.1;
    } else {
      this.camera.fov = this.originalFOV;
    }
    
    this.camera.updateProjectionMatrix();
  }

  // Update method to be called in the render loop
  update(deltaTime: number): void {
    this.updateTransition(deltaTime);
    this.updateShake(deltaTime);
    this.applyCameraEffects();
  }

  private startTransition(): void {
    if (!this.currentTransition) return;
    
    const transition = this.currentTransition;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / transition.duration, 1);
      
      if (progress < 1) {
        this.updateTransition(elapsed);
        requestAnimationFrame(animate);
      } else {
        // Transition complete
        this.camera.position.set(
          transition.endPosition.x,
          transition.endPosition.y,
          transition.endPosition.z
        );
        this.camera.lookAt(
          transition.endLookAt.x,
          transition.endLookAt.y,
          transition.endLookAt.z
        );
        
        if (transition.onComplete) {
          transition.onComplete();
        }
        
        this.currentTransition = null;
      }
    };
    
    animate();
  }

  private updateTransition(deltaTime: number): void {
    if (!this.currentTransition) return;
    
    const transition = this.currentTransition;
    const elapsed = deltaTime;
    const progress = Math.min(elapsed / transition.duration, 1);
    const easedProgress = this.applyEasing(progress, transition.easing);
    
    // Interpolate position
    const currentPos = this.lerpVector3(
      transition.startPosition,
      transition.endPosition,
      easedProgress
    );
    
    // Interpolate look-at
    const currentLookAt = this.lerpVector3(
      transition.startLookAt,
      transition.endLookAt,
      easedProgress
    );
    
    // Apply to camera
    this.camera.position.set(currentPos.x, currentPos.y, currentPos.z);
    this.camera.lookAt(currentLookAt.x, currentLookAt.y, currentLookAt.z);
  }

  private updateShake(deltaTime: number): void {
    if (this.shakeDuration <= 0) {
      this.shakeOffset.set(0, 0, 0);
      return;
    }
    
    this.shakeDuration -= deltaTime;
    
    // Generate random shake offset
    const intensity = this.shakeIntensity * (this.shakeDuration / this.shakeDuration);
    this.shakeOffset.set(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity * 0.5 // Less Z shake
    );
  }

  private animateShake(): void {
    if (this.shakeDuration <= 0) return;
    
    const animate = () => {
      if (this.shakeDuration > 0) {
        requestAnimationFrame(animate);
      } else {
        this.shakeOffset.set(0, 0, 0);
      }
    };
    
    animate();
  }

  private applyCameraEffects(): void {
    // Apply shake offset
    if (this.shakeOffset.length() > 0) {
      const basePosition = new THREE.Vector3(
        this.camera.position.x - this.shakeOffset.x,
        this.camera.position.y - this.shakeOffset.y,
        this.camera.position.z - this.shakeOffset.z
      );
      
      this.camera.position.copy(basePosition.add(this.shakeOffset));
    }
    
    // Apply cinematic effects
    if (this.cinematicMode) {
      this.applyCinematicEffects();
    }
  }

  private applyCinematicEffects(): void {
    // Subtle camera sway for cinematic feel
    const time = performance.now() * 0.0005;
    const swayX = Math.sin(time) * 0.01;
    const swayY = Math.cos(time * 0.7) * 0.005;
    
    this.camera.position.x += swayX;
    this.camera.position.y += swayY;
  }

  private getCurrentLookAt(): Vector3 {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const lookAtPoint = this.camera.position.clone().add(direction.multiplyScalar(10));
    
    return {
      x: lookAtPoint.x,
      y: lookAtPoint.y,
      z: lookAtPoint.z
    };
  }

  private lerpVector3(start: Vector3, end: Vector3, t: number): Vector3 {
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      z: start.z + (end.z - start.z) * t
    };
  }

  private applyEasing(t: number, easing: EasingFunction): number {
    switch (easing) {
      case EasingFunction.LINEAR:
        return t;
      
      case EasingFunction.EASE_IN:
        return t * t;
      
      case EasingFunction.EASE_OUT:
        return 1 - Math.pow(1 - t, 2);
      
      case EasingFunction.EASE_IN_OUT:
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      case EasingFunction.BOUNCE:
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      
      case EasingFunction.ELASTIC:
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : 
               -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      
      case EasingFunction.BACK:
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
      
      default:
        return t;
    }
  }

  // Utility methods for specific camera movements
  async panTo(target: Vector3, duration: number): Promise<void> {
    const currentLookAt = this.getCurrentLookAt();
    const direction = new THREE.Vector3(
      target.x - currentLookAt.x,
      target.y - currentLookAt.y,
      target.z - currentLookAt.z
    );
    
    const newCameraPosition = {
      x: this.camera.position.x + direction.x,
      y: this.camera.position.y + direction.y,
      z: this.camera.position.z + direction.z
    };
    
    return this.smoothTransition(newCameraPosition, target, duration);
  }

  async orbitAround(center: Vector3, angle: number, duration: number): Promise<void> {
    const currentDistance = this.camera.position.distanceTo(
      new THREE.Vector3(center.x, center.y, center.z)
    );
    
    const newPosition = {
      x: center.x + Math.cos(angle) * currentDistance,
      y: this.camera.position.y,
      z: center.z + Math.sin(angle) * currentDistance
    };
    
    return this.smoothTransition(newPosition, center, duration);
  }

  async dollyZoom(targetFOV: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startFOV = this.camera.fov;
      const startTime = performance.now();
      
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.applyEasing(progress, EasingFunction.EASE_IN_OUT);
        
        this.camera.fov = startFOV + (targetFOV - startFOV) * easedProgress;
        this.camera.updateProjectionMatrix();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  // Preset camera movements for common scenarios
  async dramaticReveal(target: Vector3, duration: number = 3): Promise<void> {
    this.enableCinematicMode(true);
    
    // Start from a dramatic angle
    const dramaticPosition = {
      x: target.x - 8,
      y: target.y + 5,
      z: target.z - 8
    };
    
    // Move to dramatic position instantly
    this.camera.position.set(dramaticPosition.x, dramaticPosition.y, dramaticPosition.z);
    this.camera.lookAt(target.x, target.y, target.z);
    
    // Then smoothly move to a better viewing position
    const finalPosition = {
      x: target.x + 3,
      y: target.y + 2,
      z: target.z + 3
    };
    
    await this.smoothTransition(finalPosition, target, duration);
  }

  async crisisZoom(crisisCenter: Vector3, intensity: number): Promise<void> {
    // Quick zoom to crisis location
    const zoomDistance = Math.max(2, 5 - intensity * 3);
    await this.zoomToDevice(crisisCenter, zoomDistance, 0.5);
    
    // Add camera shake based on crisis intensity
    this.shakeCamera(intensity * 0.5, 2 + intensity);
  }

  async celebrationSweep(devices: Vector3[], duration: number = 4): Promise<void> {
    this.enableCinematicMode(true);
    
    // Calculate center of all devices
    const center = devices.reduce(
      (acc, device) => ({
        x: acc.x + device.x / devices.length,
        y: acc.y + device.y / devices.length,
        z: acc.z + device.z / devices.length
      }),
      { x: 0, y: 0, z: 0 }
    );
    
    // Perform orbital sweep around the devices
    const radius = Math.max(5, devices.length * 1.5);
    const sweepAngle = Math.PI * 1.5; // 270 degrees
    
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10;
      const angle = sweepAngle * progress;
      
      const position = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + 2 + Math.sin(progress * Math.PI) * 1,
        z: center.z + Math.sin(angle) * radius
      };
      
      if (i === 0) {
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.lookAt(center.x, center.y, center.z);
      } else {
        await this.smoothTransition(position, center, duration / 10);
      }
    }
  }

  // Getters for current camera state
  getCurrentPosition(): Vector3 {
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };
  }

  getCurrentLookAtPoint(): Vector3 {
    return this.getCurrentLookAt();
  }

  isTransitioning(): boolean {
    return this.currentTransition !== null;
  }

  isShaking(): boolean {
    return this.shakeDuration > 0;
  }

  isCinematicMode(): boolean {
    return this.cinematicMode;
  }
}