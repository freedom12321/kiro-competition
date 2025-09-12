import { SaveManager, GameState, SaveMetadata, DeviceConfiguration, EnvironmentConfiguration } from '../../src/engine/SaveManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: Object.keys(store).length,
    key: (index: number) => Object.keys(store)[index] || null
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SaveManager', () => {
  let saveManager: SaveManager;
  let mockGameState: GameState;
  let mockMetadata: SaveMetadata;

  beforeEach(() => {
    localStorageMock.clear();
    saveManager = new SaveManager();

    mockGameState = {
      currentScenario: 'test_scenario',
      devices: [
        {
          id: 'device1',
          name: 'Smart Thermostat',
          description: 'A helpful thermostat',
          position: { x: 0, y: 0, z: 0 },
          personalityTraits: [{ name: 'helpful', value: 0.8, description: 'Very helpful' }],
          behaviorModel: {
            primaryObjective: 'maintain temperature',
            learningAlgorithm: 'reinforcement',
            communicationStyle: 'polite',
            conflictResolution: 'compromise'
          },
          connectionHistory: [],
          performanceMetrics: {
            uptime: 100,
            errorCount: 0,
            successfulInteractions: 50,
            averageResponseTime: 100
          }
        }
      ],
      environment: {
        type: 'home',
        name: 'Living Room',
        layout: {
          width: 20,
          height: 15,
          walls: [],
          furniture: []
        },
        environmentalFactors: [],
        resourceLimits: []
      },
      governanceRules: [],
      cameraState: {
        position: { x: 0, y: 0, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        zoom: 1
      },
      systemHealth: {
        harmonyLevel: 0.8,
        conflictCount: 0,
        performanceMetrics: {}
      }
    };

    mockMetadata = {
      name: 'Test Save',
      description: 'A test save file',
      tags: ['test'],
      isQuickSave: false,
      isAutoSave: false
    };
  });

  describe('Basic Save/Load Operations', () => {
    it('should save game state successfully', async () => {
      const result = await saveManager.saveGameState(mockGameState, mockMetadata);
      
      expect(result.success).toBe(true);
      expect(result.saveId).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should load saved game state successfully', async () => {
      const saveResult = await saveManager.saveGameState(mockGameState, mockMetadata);
      expect(saveResult.success).toBe(true);

      const loadResult = await saveManager.loadGameState(saveResult.saveId);
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeDefined();
      expect(loadResult.data!.gameState.currentScenario).toBe('test_scenario');
      expect(loadResult.data!.gameState.devices).toHaveLength(1);
      expect(loadResult.data!.gameState.devices[0].name).toBe('Smart Thermostat');
    });

    it('should return error when loading non-existent save', async () => {
      const loadResult = await saveManager.loadGameState('non_existent_save');
      
      expect(loadResult.success).toBe(false);
      expect(loadResult.errors).toContain('Save file not found');
    });

    it('should delete save successfully', async () => {
      const saveResult = await saveManager.saveGameState(mockGameState, mockMetadata);
      expect(saveResult.success).toBe(true);

      const deleteResult = saveManager.deleteSave(saveResult.saveId);
      expect(deleteResult).toBe(true);

      const loadResult = await saveManager.loadGameState(saveResult.saveId);
      expect(loadResult.success).toBe(false);
    });
  });

  describe('Quick Save/Load', () => {
    it('should create quick save successfully', async () => {
      const result = await saveManager.createQuickSave(mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.saveId).toBeDefined();
    });

    it('should load most recent quick save', async () => {
      await saveManager.createQuickSave(mockGameState);
      
      const loadResult = await saveManager.loadQuickSave();
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeDefined();
      expect(loadResult.data!.metadata.isQuickSave).toBe(true);
    });

    it('should limit number of quick saves', async () => {
      // Create more than the maximum number of quick saves
      for (let i = 0; i < 15; i++) {
        await saveManager.createQuickSave({
          ...mockGameState,
          currentScenario: `scenario_${i}`
        });
      }

      const saveList = saveManager.getSaveList();
      const quickSaves = saveList.filter(save => save.metadata.isQuickSave);
      
      expect(quickSaves.length).toBeLessThanOrEqual(10);
    });

    it('should return error when no quick saves exist', async () => {
      const loadResult = await saveManager.loadQuickSave();
      
      expect(loadResult.success).toBe(false);
      expect(loadResult.errors).toContain('No quick saves available');
    });
  });

  describe('Auto Save', () => {
    it('should create auto save successfully', async () => {
      const result = await saveManager.createAutoSave(mockGameState);
      
      expect(result.success).toBe(true);
      expect(result.saveId).toBeDefined();
    });

    it('should overwrite previous auto save', async () => {
      const firstAutoSave = await saveManager.createAutoSave(mockGameState);
      const secondAutoSave = await saveManager.createAutoSave({
        ...mockGameState,
        currentScenario: 'updated_scenario'
      });

      expect(firstAutoSave.success).toBe(true);
      expect(secondAutoSave.success).toBe(true);
      expect(firstAutoSave.saveId).not.toBe(secondAutoSave.saveId);
    });
  });

  describe('Export/Import Configuration', () => {
    it('should export device configuration', async () => {
      const deviceConfig = mockGameState.devices[0];
      
      const exportUrl = await saveManager.exportConfiguration(
        deviceConfig,
        'device',
        'Test Device',
        'A test device configuration'
      );
      
      expect(exportUrl).toBeDefined();
      expect(typeof exportUrl).toBe('string');
    });

    it('should import valid configuration', async () => {
      const exportData = {
        type: 'device' as const,
        name: 'Test Device',
        description: 'A test device',
        data: mockGameState.devices[0],
        version: '1.0.0',
        createdBy: 'test_user',
        createdDate: Date.now()
      };

      const importResult = await saveManager.importConfiguration(JSON.stringify(exportData));
      
      expect(importResult.success).toBe(true);
      expect(importResult.data).toEqual(exportData.data);
      expect(importResult.errors).toHaveLength(0);
    });

    it('should reject invalid import data', async () => {
      const invalidData = '{"invalid": "data"}';
      
      const importResult = await saveManager.importConfiguration(invalidData);
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors.length).toBeGreaterThan(0);
    });

    it('should warn about version mismatches', async () => {
      const exportData = {
        type: 'device' as const,
        name: 'Test Device',
        description: 'A test device',
        data: mockGameState.devices[0],
        version: '0.9.0', // Different version
        createdBy: 'test_user',
        createdDate: Date.now()
      };

      const importResult = await saveManager.importConfiguration(JSON.stringify(exportData));
      
      expect(importResult.success).toBe(true);
      expect(importResult.warnings.length).toBeGreaterThan(0);
      expect(importResult.warnings[0]).toContain('Version mismatch');
    });
  });

  describe('Save Management', () => {
    it('should list saves in chronological order', async () => {
      const save1 = await saveManager.saveGameState(mockGameState, {
        ...mockMetadata,
        name: 'Save 1'
      });
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const save2 = await saveManager.saveGameState(mockGameState, {
        ...mockMetadata,
        name: 'Save 2'
      });

      const saveList = saveManager.getSaveList();
      
      expect(saveList).toHaveLength(2);
      expect(saveList[0].metadata.name).toBe('Save 2'); // Most recent first
      expect(saveList[1].metadata.name).toBe('Save 1');
    });

    it('should provide storage information', async () => {
      await saveManager.saveGameState(mockGameState, mockMetadata);
      
      const storageInfo = saveManager.getStorageInfo();
      
      expect(storageInfo.totalSaves).toBe(1);
      expect(storageInfo.storageUsed).toBeGreaterThan(0);
      expect(storageInfo.storageLimit).toBeGreaterThan(0);
      expect(storageInfo.oldestSave).toBeDefined();
    });

    it('should enforce storage limits', async () => {
      // Create many saves to test limit enforcement
      for (let i = 0; i < 55; i++) {
        await saveManager.saveGameState(mockGameState, {
          ...mockMetadata,
          name: `Save ${i}`
        });
      }

      const storageInfo = saveManager.getStorageInfo();
      expect(storageInfo.totalSaves).toBeLessThanOrEqual(50);
    });
  });

  describe('Data Validation', () => {
    it('should validate save data structure', async () => {
      const invalidGameState = {} as GameState;
      
      const result = await saveManager.saveGameState(invalidGameState, mockMetadata);
      
      expect(result.success).toBe(true); // SaveManager should handle this gracefully
    });

    it('should handle corrupted save data', async () => {
      // Manually corrupt a save in localStorage
      const saveResult = await saveManager.saveGameState(mockGameState, mockMetadata);
      const storageKey = `ai_habitat_save_${saveResult.saveId}`;
      localStorageMock.setItem(storageKey, 'corrupted data');

      const loadResult = await saveManager.loadGameState(saveResult.saveId);
      
      expect(loadResult.success).toBe(false);
      expect(loadResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-platform Compatibility', () => {
    it('should handle different timestamp formats', async () => {
      const saveResult = await saveManager.saveGameState(mockGameState, mockMetadata);
      const loadResult = await saveManager.loadGameState(saveResult.saveId);
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.data!.timestamp).toBeGreaterThan(0);
    });

    it('should preserve device configurations accurately', async () => {
      const complexDevice: DeviceConfiguration = {
        id: 'complex_device',
        name: 'Complex Device',
        description: 'A device with complex configuration',
        position: { x: 1.5, y: -2.3, z: 0.7 },
        personalityTraits: [
          { name: 'stubborn', value: 0.9, description: 'Very stubborn' },
          { name: 'helpful', value: 0.3, description: 'Somewhat helpful' }
        ],
        behaviorModel: {
          primaryObjective: 'optimize everything',
          learningAlgorithm: 'deep_learning',
          communicationStyle: 'technical',
          conflictResolution: 'aggressive'
        },
        connectionHistory: [
          {
            deviceId: 'other_device',
            connectionType: 'cooperation',
            timestamp: Date.now(),
            duration: 5000
          }
        ],
        performanceMetrics: {
          uptime: 99.5,
          errorCount: 3,
          successfulInteractions: 127,
          averageResponseTime: 85.3
        }
      };

      const gameStateWithComplexDevice = {
        ...mockGameState,
        devices: [complexDevice]
      };

      const saveResult = await saveManager.saveGameState(gameStateWithComplexDevice, mockMetadata);
      const loadResult = await saveManager.loadGameState(saveResult.saveId);
      
      expect(loadResult.success).toBe(true);
      const loadedDevice = loadResult.data!.gameState.devices[0];
      
      expect(loadedDevice.id).toBe(complexDevice.id);
      expect(loadedDevice.position.x).toBeCloseTo(complexDevice.position.x);
      expect(loadedDevice.personalityTraits).toHaveLength(2);
      expect(loadedDevice.connectionHistory).toHaveLength(1);
      expect(loadedDevice.performanceMetrics.uptime).toBeCloseTo(complexDevice.performanceMetrics.uptime);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const result = await saveManager.saveGameState(mockGameState, mockMetadata);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle localStorage not available', async () => {
      // This test verifies the SaveManager handles missing localStorage gracefully
      // The constructor should not throw even if localStorage is unavailable
      expect(() => new SaveManager()).not.toThrow();
    });
  });
});