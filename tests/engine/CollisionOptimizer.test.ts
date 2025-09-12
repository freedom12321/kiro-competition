import { CollisionOptimizer } from '../../src/engine/CollisionOptimizer';
import { DeviceVisual, Vector3 } from '../../src/types/core';

describe('CollisionOptimizer', () => {
  let optimizer: CollisionOptimizer;
  let mockDevices: DeviceVisual[];

  beforeEach(() => {
    const bounds = {
      min: { x: -50, y: -50, z: -50 },
      max: { x: 50, y: 50, z: 50 }
    };
    optimizer = new CollisionOptimizer(bounds, 10, 15);
    
    mockDevices = [
      {
        id: 'device1',
        position: { x: 0, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      },
      {
        id: 'device2',
        position: { x: 5, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      },
      {
        id: 'device3',
        position: { x: 25, y: 0, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      },
      {
        id: 'device4',
        position: { x: 0, y: 25, z: 0 },
        model3D: { mesh: {} as any },
        animations: {},
        personalityIndicators: [],
        connectionEffects: []
      }
    ];
  });

  describe('Spatial Grid Management', () => {
    it('should update spatial grid with devices', () => {
      optimizer.updateSpatialGrid(mockDevices);
      
      const stats = optimizer.getOptimizationStats();
      expect(stats.cellCount).toBeGreaterThan(0);
      expect(stats.averageDevicesPerCell).toBeGreaterThan(0);
    });

    it('should find nearby devices efficiently', () => {
      optimizer.updateSpatialGrid(mockDevices);
      
      const nearbyDevices = optimizer.findNearbyDevices(mockDevices[0]);
      
      // Device1 should find Device2 (distance = 5) but not Device3 (distance = 25)
      expect(nearbyDevices).toContain(mockDevices[1]);
      expect(nearbyDevices).not.toContain(mockDevices[2]);
    });

    it('should handle empty spatial grid gracefully', () => {
      const nearbyDevices = optimizer.findNearbyDevices(mockDevices[0]);
      expect(nearbyDevices).toEqual([]);
    });
  });

  describe('Interaction Detection', () => {
    it('should detect devices in interaction range', () => {
      const inRange = optimizer.isInInteractionRange(mockDevices[0], mockDevices[1]);
      const outOfRange = optimizer.isInInteractionRange(mockDevices[0], mockDevices[2]);
      
      expect(inRange).toBe(true);
      expect(outOfRange).toBe(false);
    });

    it('should find interaction pairs efficiently', () => {
      const pairs = optimizer.findInteractionPairs(mockDevices);
      
      // Should find pair between device1 and device2
      const device1Device2Pair = pairs.find(pair => 
        (pair.deviceA.id === 'device1' && pair.deviceB.id === 'device2') ||
        (pair.deviceA.id === 'device2' && pair.deviceB.id === 'device1')
      );
      
      expect(device1Device2Pair).toBeDefined();
      expect(device1Device2Pair!.distance).toBeCloseTo(5, 1);
    });

    it('should not create duplicate pairs', () => {
      const pairs = optimizer.findInteractionPairs(mockDevices);
      
      const pairIds = pairs.map(pair => 
        pair.deviceA.id < pair.deviceB.id ? 
        `${pair.deviceA.id}-${pair.deviceB.id}` : 
        `${pair.deviceB.id}-${pair.deviceA.id}`
      );
      
      const uniquePairIds = new Set(pairIds);
      expect(pairIds.length).toBe(uniquePairIds.size);
    });
  });

  describe('Bounding Box Collision', () => {
    it('should calculate device bounding boxes', () => {
      const boundingBox = optimizer.getBoundingBox(mockDevices[0]);
      
      expect(boundingBox.min.x).toBe(-1);
      expect(boundingBox.max.x).toBe(1);
      expect(boundingBox.min.y).toBe(-1);
      expect(boundingBox.max.y).toBe(1);
      expect(boundingBox.min.z).toBe(-1);
      expect(boundingBox.max.z).toBe(1);
    });

    it('should detect bounding box collisions', () => {
      const box1 = optimizer.getBoundingBox(mockDevices[0]);
      const box2 = optimizer.getBoundingBox(mockDevices[1]);
      const box3 = optimizer.getBoundingBox(mockDevices[2]);
      
      // Devices 1 and 2 are close (distance = 5), should have overlapping bounding boxes
      const collision12 = optimizer.checkBoundingBoxCollision(box1, box2);
      // Devices 1 and 3 are far (distance = 25), should not have overlapping bounding boxes
      const collision13 = optimizer.checkBoundingBoxCollision(box1, box3);
      
      expect(collision12).toBe(false); // 5 units apart, boxes are 2 units wide each
      expect(collision13).toBe(false);
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize interaction range based on performance', () => {
      const initialRange = optimizer.getInteractionRange();
      
      // Simulate low FPS scenario
      optimizer.optimizeInteractionRange(50, 60, 30);
      
      const newRange = optimizer.getInteractionRange();
      expect(newRange).toBeLessThan(initialRange);
    });

    it('should increase interaction range when performance is good', () => {
      // First reduce the range
      optimizer.optimizeInteractionRange(50, 60, 30);
      const reducedRange = optimizer.getInteractionRange();
      
      // Then simulate good performance
      optimizer.optimizeInteractionRange(20, 60, 80);
      
      const increasedRange = optimizer.getInteractionRange();
      expect(increasedRange).toBeGreaterThan(reducedRange);
    });

    it('should update interaction range within bounds', () => {
      optimizer.updateInteractionRange(100);
      expect(optimizer.getInteractionRange()).toBe(50); // Clamped to max
      
      optimizer.updateInteractionRange(-5);
      expect(optimizer.getInteractionRange()).toBe(1); // Clamped to min
    });

    it('should update cell size within bounds', () => {
      optimizer.updateCellSize(50);
      const stats = optimizer.getOptimizationStats();
      expect(stats.cellSize).toBe(20); // Clamped to max
      
      optimizer.updateCellSize(-5);
      const newStats = optimizer.getOptimizationStats();
      expect(newStats.cellSize).toBe(1); // Clamped to min
    });
  });

  describe('Optimization Statistics', () => {
    it('should provide optimization statistics', () => {
      optimizer.updateSpatialGrid(mockDevices);
      
      const stats = optimizer.getOptimizationStats();
      
      expect(stats.cellCount).toBeGreaterThan(0);
      expect(stats.averageDevicesPerCell).toBeGreaterThan(0);
      expect(stats.interactionRange).toBe(15);
      expect(stats.cellSize).toBe(10);
    });

    it('should handle empty grid statistics', () => {
      const stats = optimizer.getOptimizationStats();
      
      expect(stats.cellCount).toBe(0);
      expect(stats.averageDevicesPerCell).toBe(0);
    });
  });

  describe('Stress Testing', () => {
    it('should handle large numbers of devices efficiently', () => {
      const manyDevices: DeviceVisual[] = [];
      for (let i = 0; i < 200; i++) {
        manyDevices.push({
          id: `device${i}`,
          position: { 
            x: (i % 20) * 3, 
            y: Math.floor(i / 20) * 3, 
            z: 0 
          },
          model3D: { mesh: {} as any },
          animations: {},
          personalityIndicators: [],
          connectionEffects: []
        });
      }
      
      const startTime = performance.now();
      const pairs = optimizer.findInteractionPairs(manyDevices);
      const processingTime = performance.now() - startTime;
      
      expect(processingTime).toBeLessThan(50); // Should process quickly
      expect(pairs.length).toBeGreaterThan(0);
    });

    it('should maintain performance with frequent updates', () => {
      const updateCount = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < updateCount; i++) {
        // Slightly move devices
        mockDevices.forEach(device => {
          device.position.x += Math.random() * 0.1 - 0.05;
          device.position.y += Math.random() * 0.1 - 0.05;
        });
        
        optimizer.updateSpatialGrid(mockDevices);
        optimizer.findInteractionPairs(mockDevices);
      }
      
      const totalTime = performance.now() - startTime;
      const avgTimePerUpdate = totalTime / updateCount;
      
      expect(avgTimePerUpdate).toBeLessThan(2); // Should be fast per update
    });

    it('should scale well with different cell sizes', () => {
      const manyDevices: DeviceVisual[] = [];
      for (let i = 0; i < 100; i++) {
        manyDevices.push({
          id: `device${i}`,
          position: { 
            x: Math.random() * 100 - 50, 
            y: Math.random() * 100 - 50, 
            z: Math.random() * 100 - 50 
          },
          model3D: { mesh: {} as any },
          animations: {},
          personalityIndicators: [],
          connectionEffects: []
        });
      }
      
      // Test different cell sizes
      const cellSizes = [5, 10, 20];
      const results: number[] = [];
      
      cellSizes.forEach(cellSize => {
        optimizer.updateCellSize(cellSize);
        
        const startTime = performance.now();
        optimizer.findInteractionPairs(manyDevices);
        const processingTime = performance.now() - startTime;
        
        results.push(processingTime);
      });
      
      // All should be reasonably fast
      results.forEach(time => {
        expect(time).toBeLessThan(20);
      });
    });
  });
});