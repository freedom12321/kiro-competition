import { DeviceVisual, Vector3 } from '../types/core';

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

export interface CollisionPair {
  deviceA: DeviceVisual;
  deviceB: DeviceVisual;
  distance: number;
}

export interface SpatialGrid {
  cellSize: number;
  cells: Map<string, DeviceVisual[]>;
  bounds: BoundingBox;
}

export class CollisionOptimizer {
  private spatialGrid: SpatialGrid;
  private interactionRange: number;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 100; // Update every 100ms

  constructor(bounds: BoundingBox, cellSize: number = 10, interactionRange: number = 15) {
    this.interactionRange = interactionRange;
    this.spatialGrid = {
      cellSize,
      cells: new Map(),
      bounds
    };
  }

  public updateSpatialGrid(devices: DeviceVisual[]): void {
    const currentTime = performance.now();
    
    // Only update spatial grid periodically to reduce CPU overhead
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    
    this.lastUpdateTime = currentTime;
    this.forceUpdateSpatialGrid(devices);
  }

  public forceUpdateSpatialGrid(devices: DeviceVisual[]): void {
    this.spatialGrid.cells.clear();

    for (const device of devices) {
      const cellKey = this.getCellKey(device.position);
      
      if (!this.spatialGrid.cells.has(cellKey)) {
        this.spatialGrid.cells.set(cellKey, []);
      }
      
      this.spatialGrid.cells.get(cellKey)!.push(device);
    }
  }

  private getCellKey(position: Vector3): string {
    const x = Math.floor(position.x / this.spatialGrid.cellSize);
    const y = Math.floor(position.y / this.spatialGrid.cellSize);
    const z = Math.floor(position.z / this.spatialGrid.cellSize);
    return `${x},${y},${z}`;
  }

  private getNeighborCells(position: Vector3): string[] {
    const centerX = Math.floor(position.x / this.spatialGrid.cellSize);
    const centerY = Math.floor(position.y / this.spatialGrid.cellSize);
    const centerZ = Math.floor(position.z / this.spatialGrid.cellSize);
    
    const neighbors: string[] = [];
    
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      for (let y = centerY - 1; y <= centerY + 1; y++) {
        for (let z = centerZ - 1; z <= centerZ + 1; z++) {
          neighbors.push(`${x},${y},${z}`);
        }
      }
    }
    
    return neighbors;
  }

  public findNearbyDevices(device: DeviceVisual): DeviceVisual[] {
    const neighborCells = this.getNeighborCells(device.position);
    const nearbyDevices: DeviceVisual[] = [];
    
    for (const cellKey of neighborCells) {
      const cellDevices = this.spatialGrid.cells.get(cellKey);
      if (cellDevices) {
        for (const otherDevice of cellDevices) {
          if (otherDevice.id !== device.id) {
            const distance = this.calculateDistance(device.position, otherDevice.position);
            if (distance <= this.interactionRange) {
              nearbyDevices.push(otherDevice);
            }
          }
        }
      }
    }
    
    return nearbyDevices;
  }

  public findInteractionPairs(devices: DeviceVisual[]): CollisionPair[] {
    this.forceUpdateSpatialGrid(devices);
    const pairs: CollisionPair[] = [];
    const processedPairs = new Set<string>();

    for (const device of devices) {
      const nearbyDevices = this.findNearbyDevices(device);
      
      for (const otherDevice of nearbyDevices) {
        const pairKey = this.getPairKey(device.id, otherDevice.id);
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          const distance = this.calculateDistance(device.position, otherDevice.position);
          
          pairs.push({
            deviceA: device,
            deviceB: otherDevice,
            distance
          });
        }
      }
    }

    return pairs;
  }

  private getPairKey(idA: string, idB: string): string {
    return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
  }

  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public isInInteractionRange(deviceA: DeviceVisual, deviceB: DeviceVisual): boolean {
    const distance = this.calculateDistance(deviceA.position, deviceB.position);
    return distance <= this.interactionRange;
  }

  public getBoundingBox(device: DeviceVisual): BoundingBox {
    const size = 2; // Assume 2x2x2 unit bounding box for devices
    const halfSize = size / 2;
    
    return {
      min: {
        x: device.position.x - halfSize,
        y: device.position.y - halfSize,
        z: device.position.z - halfSize
      },
      max: {
        x: device.position.x + halfSize,
        y: device.position.y + halfSize,
        z: device.position.z + halfSize
      }
    };
  }

  public checkBoundingBoxCollision(boxA: BoundingBox, boxB: BoundingBox): boolean {
    return (
      boxA.min.x <= boxB.max.x && boxA.max.x >= boxB.min.x &&
      boxA.min.y <= boxB.max.y && boxA.max.y >= boxB.min.y &&
      boxA.min.z <= boxB.max.z && boxA.max.z >= boxB.min.z
    );
  }

  public optimizeInteractionRange(deviceCount: number, targetFPS: number, currentFPS: number): void {
    if (currentFPS < targetFPS * 0.8) {
      // Reduce interaction range to improve performance
      this.interactionRange = Math.max(5, this.interactionRange * 0.9);
    } else if (currentFPS > targetFPS * 1.1 && deviceCount < 30) {
      // Increase interaction range for better gameplay
      this.interactionRange = Math.min(25, this.interactionRange * 1.05);
    }
  }

  public getOptimizationStats(): {
    cellCount: number;
    averageDevicesPerCell: number;
    interactionRange: number;
    cellSize: number;
  } {
    const cellCount = this.spatialGrid.cells.size;
    const totalDevices = Array.from(this.spatialGrid.cells.values())
      .reduce((sum, devices) => sum + devices.length, 0);
    
    return {
      cellCount,
      averageDevicesPerCell: cellCount > 0 ? totalDevices / cellCount : 0,
      interactionRange: this.interactionRange,
      cellSize: this.spatialGrid.cellSize
    };
  }

  public updateInteractionRange(newRange: number): void {
    this.interactionRange = Math.max(1, Math.min(50, newRange));
  }

  public updateCellSize(newSize: number): void {
    this.spatialGrid.cellSize = Math.max(1, Math.min(20, newSize));
    // Clear grid to force rebuild with new cell size
    this.spatialGrid.cells.clear();
  }

  public getInteractionRange(): number {
    return this.interactionRange;
  }
}