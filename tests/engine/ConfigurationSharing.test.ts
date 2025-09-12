import { ConfigurationSharing, ConfigurationData, BrowseFilters } from '../../src/engine/ConfigurationSharing';
import { DeviceConfiguration } from '../../src/engine/SaveManager';

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
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://example.com'
  }
});

describe('ConfigurationSharing', () => {
  let sharingManager: ConfigurationSharing;
  let mockDeviceConfig: ConfigurationData;

  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.setItem('ai_habitat_user_id', 'test_user_123');
    sharingManager = new ConfigurationSharing();

    mockDeviceConfig = {
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
      ]
    };
  });

  describe('Configuration Sharing', () => {
    it('should share configuration successfully', async () => {
      const result = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Test Device Config',
        'A test device configuration',
        ['smart-home', 'thermostat'],
        true
      );

      expect(result.success).toBe(true);
      expect(result.configurationId).toBeDefined();
      expect(result.shareUrl).toBeDefined();
      expect(result.shareUrl).toContain('https://example.com/share/');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = { devices: [] }; // Empty devices array

      const result = await sharingManager.shareConfiguration(
        invalidConfig,
        'device',
        'Invalid Config',
        'An invalid configuration',
        [],
        true
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('at least one device');
    });

    it('should require name and description', async () => {
      const result = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        '', // Empty name
        '', // Empty description
        [],
        true
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Configuration name is required');
      expect(result.errors).toContain('Configuration description is required');
    });
  });

  describe('Configuration Browsing', () => {
    beforeEach(async () => {
      // Create test configurations
      await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Smart Thermostat',
        'A helpful thermostat device',
        ['smart-home', 'temperature'],
        true
      );

      await sharingManager.shareConfiguration(
        { environment: { type: 'home', name: 'Living Room', layout: { width: 20, height: 15, walls: [], furniture: [] }, environmentalFactors: [], resourceLimits: [] } },
        'room',
        'Cozy Living Room',
        'A comfortable living room setup',
        ['home', 'cozy'],
        true
      );

      await sharingManager.shareConfiguration(
        { governanceRules: [{ id: 'rule1', name: 'Safety First', description: 'Prioritize safety', priority: 1, conditions: [], actions: [], isActive: true, createdDate: Date.now(), lastModified: Date.now() }] },
        'governance',
        'Safety Rules',
        'Basic safety governance rules',
        ['safety', 'governance'],
        true
      );
    });

    it('should browse all configurations', () => {
      const results = sharingManager.browseSharedConfigurations();
      
      expect(results).toHaveLength(3);
      expect(results.map(r => r.type)).toContain('device');
      expect(results.map(r => r.type)).toContain('room');
      expect(results.map(r => r.type)).toContain('governance');
    });

    it('should filter by type', () => {
      const filters: BrowseFilters = { type: 'device' };
      const results = sharingManager.browseSharedConfigurations(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('device');
      expect(results[0].name).toBe('Smart Thermostat');
    });

    it('should filter by tags', () => {
      const filters: BrowseFilters = { tags: ['smart-home'] };
      const results = sharingManager.browseSharedConfigurations(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('smart-home');
    });

    it('should search by query', () => {
      const filters: BrowseFilters = { searchQuery: 'thermostat' };
      const results = sharingManager.browseSharedConfigurations(filters);
      
      expect(results).toHaveLength(1);
      expect(results[0].name.toLowerCase()).toContain('thermostat');
    });

    it('should sort by name', () => {
      const filters: BrowseFilters = { sortBy: 'name', sortOrder: 'asc' };
      const results = sharingManager.browseSharedConfigurations(filters);
      
      expect(results[0].name).toBe('Cozy Living Room');
      expect(results[1].name).toBe('Safety Rules');
      expect(results[2].name).toBe('Smart Thermostat');
    });

    it('should apply pagination', () => {
      const filters: BrowseFilters = { limit: 2, offset: 1 };
      const results = sharingManager.browseSharedConfigurations(filters);
      
      expect(results).toHaveLength(2);
    });
  });

  describe('Configuration Download', () => {
    let configId: string;

    beforeEach(async () => {
      const shareResult = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Downloadable Device',
        'A device for download testing',
        ['test'],
        true
      );
      configId = shareResult.configurationId!;
    });

    it('should download public configuration successfully', async () => {
      const result = await sharingManager.downloadConfiguration(configId);
      
      expect(result.success).toBe(true);
      expect(result.configuration).toBeDefined();
      expect(result.configuration!.name).toBe('Downloadable Device');
      expect(result.configuration!.downloadCount).toBe(1);
    });

    it('should increment download count', async () => {
      await sharingManager.downloadConfiguration(configId);
      await sharingManager.downloadConfiguration(configId);
      
      const config = sharingManager.getConfigurationDetails(configId);
      expect(config!.downloadCount).toBe(2);
    });

    it('should return error for non-existent configuration', async () => {
      const result = await sharingManager.downloadConfiguration('non_existent_id');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Configuration not found');
    });
  });

  describe('Configuration Rating', () => {
    let configId: string;

    beforeEach(async () => {
      const shareResult = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Ratable Device',
        'A device for rating testing',
        ['test'],
        true
      );
      configId = shareResult.configurationId!;
    });

    it('should rate configuration successfully', async () => {
      const result = await sharingManager.rateConfiguration(configId, 5, 'Excellent device!');
      
      expect(result.success).toBe(true);
      expect(result.newAverageRating).toBe(5);
    });

    it('should update existing rating', async () => {
      await sharingManager.rateConfiguration(configId, 3, 'Good device');
      const result = await sharingManager.rateConfiguration(configId, 5, 'Actually, excellent device!');
      
      expect(result.success).toBe(true);
      expect(result.newAverageRating).toBe(5);
      
      const config = sharingManager.getConfigurationDetails(configId);
      expect(config!.ratings).toHaveLength(1); // Should update, not add
    });

    it('should calculate average rating correctly', async () => {
      // Simulate multiple users rating (in real app, different user IDs)
      const config = sharingManager.getConfigurationDetails(configId)!;
      config.ratings = [
        { userId: 'user1', rating: 5, comment: 'Great!', date: Date.now(), helpful: 0 },
        { userId: 'user2', rating: 4, comment: 'Good', date: Date.now(), helpful: 0 },
        { userId: 'user3', rating: 3, comment: 'OK', date: Date.now(), helpful: 0 }
      ];
      
      const averageRating = sharingManager.getAverageRating(configId);
      expect(averageRating).toBeCloseTo(4, 1);
    });

    it('should reject invalid ratings', async () => {
      const result = await sharingManager.rateConfiguration(configId, 6, 'Invalid rating');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Rating must be between 1 and 5');
    });
  });

  describe('User Configuration Management', () => {
    it('should get user configurations', async () => {
      await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'My Device 1',
        'First device',
        [],
        true
      );

      await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'My Device 2',
        'Second device',
        [],
        false
      );

      const userConfigs = sharingManager.getUserConfigurations();
      
      expect(userConfigs).toHaveLength(2);
      expect(userConfigs.map(c => c.name)).toContain('My Device 1');
      expect(userConfigs.map(c => c.name)).toContain('My Device 2');
    });

    it('should update configuration', async () => {
      const shareResult = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Original Name',
        'Original description',
        ['original'],
        true
      );

      const updateResult = sharingManager.updateConfiguration(shareResult.configurationId!, {
        name: 'Updated Name',
        description: 'Updated description',
        tags: ['updated']
      });

      expect(updateResult).toBe(true);
      
      const config = sharingManager.getConfigurationDetails(shareResult.configurationId!);
      expect(config!.name).toBe('Updated Name');
      expect(config!.description).toBe('Updated description');
      expect(config!.tags).toContain('updated');
    });

    it('should delete configuration', async () => {
      const shareResult = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'To Be Deleted',
        'This will be deleted',
        [],
        true
      );

      const deleteResult = sharingManager.deleteConfiguration(shareResult.configurationId!);
      expect(deleteResult).toBe(true);
      
      const config = sharingManager.getConfigurationDetails(shareResult.configurationId!);
      expect(config).toBeNull();
    });
  });

  describe('Export/Import', () => {
    let configId: string;

    beforeEach(async () => {
      const shareResult = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Exportable Device',
        'A device for export testing',
        ['export', 'test'],
        true
      );
      configId = shareResult.configurationId!;
    });

    it('should export configuration', () => {
      const exportData = sharingManager.exportConfiguration(configId);
      
      expect(exportData).toBeDefined();
      expect(exportData!.type).toBe('device');
      expect(exportData!.name).toBe('Exportable Device');
      expect(exportData!.data).toEqual(mockDeviceConfig);
    });

    it('should import shared configuration', async () => {
      const exportData = {
        type: 'device' as const,
        name: 'Imported Device',
        description: 'An imported device',
        data: mockDeviceConfig,
        version: '1.0.0',
        createdBy: 'other_user',
        createdDate: Date.now()
      };

      const importResult = await sharingManager.importSharedConfiguration(exportData);
      
      expect(importResult.success).toBe(true);
      expect(importResult.data).toEqual(mockDeviceConfig);
      
      // Check that it was added to shared configurations
      const configs = sharingManager.browseSharedConfigurations({ searchQuery: 'Imported Device' });
      expect(configs).toHaveLength(1);
    });
  });

  describe('Popular Tags and Featured Content', () => {
    beforeEach(async () => {
      await sharingManager.shareConfiguration(mockDeviceConfig, 'device', 'Device 1', 'Description 1', ['smart-home', 'temperature'], true);
      await sharingManager.shareConfiguration(mockDeviceConfig, 'device', 'Device 2', 'Description 2', ['smart-home', 'lighting'], true);
      await sharingManager.shareConfiguration(mockDeviceConfig, 'device', 'Device 3', 'Description 3', ['temperature', 'energy'], true);
    });

    it('should get popular tags', () => {
      const popularTags = sharingManager.getPopularTags();
      
      expect(popularTags).toHaveLength(4);
      expect(popularTags[0].tag).toBe('smart-home'); // Most popular
      expect(popularTags[0].count).toBe(2);
      expect(popularTags[1].tag).toBe('temperature');
      expect(popularTags[1].count).toBe(2);
    });

    it('should get featured configurations', () => {
      // Mark one configuration as featured
      const configs = sharingManager.browseSharedConfigurations();
      const config = sharingManager.getConfigurationDetails(configs[0].id)!;
      config.isFeatured = true;

      const featuredConfigs = sharingManager.getFeaturedConfigurations();
      
      expect(featuredConfigs).toHaveLength(1);
      expect(featuredConfigs[0].isFeatured).toBe(true);
    });
  });

  describe('Download History', () => {
    it('should track download history', async () => {
      const shareResult = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Downloaded Device',
        'A device for download history testing',
        [],
        true
      );

      await sharingManager.downloadConfiguration(shareResult.configurationId!);
      
      const downloadHistory = sharingManager.getDownloadHistory();
      expect(downloadHistory).toHaveLength(1);
      expect(downloadHistory[0].name).toBe('Downloaded Device');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const result = await sharingManager.shareConfiguration(
        mockDeviceConfig,
        'device',
        'Error Test',
        'This should cause an error',
        [],
        true
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });

    it('should handle corrupted storage data', () => {
      // Corrupt the storage data
      localStorageMock.setItem('ai_habitat_shared_configs', 'corrupted data');
      
      // Creating a new instance should handle corrupted data gracefully
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => new ConfigurationSharing()).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});