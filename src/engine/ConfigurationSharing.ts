import { DeviceConfiguration, EnvironmentConfiguration, GovernanceRuleConfiguration, ExportData, ImportResult } from './SaveManager';

export interface SharedConfiguration {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  type: ConfigurationType;
  data: ConfigurationData;
  ratings: UserRating[];
  downloadCount: number;
  tags: string[];
  createdDate: number;
  lastModified: number;
  version: string;
  isPublic: boolean;
  isFeatured: boolean;
}

export interface ConfigurationData {
  devices?: DeviceConfiguration[];
  environment?: EnvironmentConfiguration;
  governanceRules?: GovernanceRuleConfiguration[];
  scenario?: ScenarioConfiguration;
}

export interface ScenarioConfiguration {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  objectives: ScenarioObjective[];
  environment: EnvironmentConfiguration;
  presetDevices: DeviceConfiguration[];
  governanceRules: GovernanceRuleConfiguration[];
  successCriteria: SuccessCriteria[];
  estimatedDuration: number;
}

export interface ScenarioObjective {
  id: string;
  description: string;
  type: 'cooperation' | 'conflict-resolution' | 'optimization' | 'crisis-management';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
}

export interface SuccessCriteria {
  id: string;
  description: string;
  condition: string;
  threshold: number;
  weight: number;
}

export interface UserRating {
  userId: string;
  rating: number; // 1-5 stars
  comment: string;
  date: number;
  helpful: number; // Number of users who found this helpful
}

export interface BrowseFilters {
  type?: ConfigurationType;
  tags?: string[];
  minRating?: number;
  maxRating?: number;
  sortBy?: 'newest' | 'oldest' | 'rating' | 'downloads' | 'name';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  creatorId?: string;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

export interface ShareResult {
  success: boolean;
  configurationId?: string;
  shareUrl?: string;
  errors: string[];
}

export interface DownloadResult {
  success: boolean;
  configuration?: SharedConfiguration;
  errors: string[];
}

export interface RatingResult {
  success: boolean;
  newAverageRating?: number;
  errors: string[];
}

export type ConfigurationType = 'device' | 'room' | 'governance' | 'scenario';

export class ConfigurationSharing {
  private readonly STORAGE_KEY = 'ai_habitat_shared_configs';
  private readonly USER_RATINGS_KEY = 'ai_habitat_user_ratings';
  private readonly DOWNLOAD_HISTORY_KEY = 'ai_habitat_downloads';
  private readonly CURRENT_VERSION = '1.0.0';

  private configurations: Map<string, SharedConfiguration> = new Map();
  private userRatings: Map<string, UserRating[]> = new Map();
  private downloadHistory: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  public async shareConfiguration(
    config: ConfigurationData,
    type: ConfigurationType,
    name: string,
    description: string,
    tags: string[] = [],
    isPublic: boolean = true
  ): Promise<ShareResult> {
    try {
      const configId = this.generateConfigId();
      const creatorId = this.getCurrentUserId();

      const sharedConfig: SharedConfiguration = {
        id: configId,
        creatorId,
        name,
        description,
        type,
        data: config,
        ratings: [],
        downloadCount: 0,
        tags,
        createdDate: Date.now(),
        lastModified: Date.now(),
        version: this.CURRENT_VERSION,
        isPublic,
        isFeatured: false
      };

      // Validate configuration
      const validationResult = this.validateConfiguration(sharedConfig);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }

      // Store configuration
      this.configurations.set(configId, sharedConfig);
      
      try {
        this.saveToStorage();
      } catch (storageError) {
        // Remove the configuration if storage fails
        this.configurations.delete(configId);
        throw storageError;
      }

      const shareUrl = this.generateShareUrl(configId);

      return {
        success: true,
        configurationId: configId,
        shareUrl,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown sharing error']
      };
    }
  }

  public browseSharedConfigurations(filters: BrowseFilters = {}): SharedConfiguration[] {
    let results = Array.from(this.configurations.values());

    // Apply filters
    if (filters.type) {
      results = results.filter(config => config.type === filters.type);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(config => 
        filters.tags!.some(tag => config.tags.includes(tag))
      );
    }

    if (filters.minRating !== undefined) {
      results = results.filter(config => this.getAverageRating(config.id) >= filters.minRating!);
    }

    if (filters.maxRating !== undefined) {
      results = results.filter(config => this.getAverageRating(config.id) <= filters.maxRating!);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(config => 
        config.name.toLowerCase().includes(query) ||
        config.description.toLowerCase().includes(query) ||
        config.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.creatorId) {
      results = results.filter(config => config.creatorId === filters.creatorId);
    }

    if (filters.isFeatured !== undefined) {
      results = results.filter(config => config.isFeatured === filters.isFeatured);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'newest';
    const sortOrder = filters.sortOrder || 'desc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'newest':
          comparison = a.createdDate - b.createdDate;
          break;
        case 'oldest':
          comparison = b.createdDate - a.createdDate;
          break;
        case 'rating':
          comparison = this.getAverageRating(a.id) - this.getAverageRating(b.id);
          break;
        case 'downloads':
          comparison = a.downloadCount - b.downloadCount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || results.length;
    
    return results.slice(offset, offset + limit);
  }

  public async downloadConfiguration(configId: string): Promise<DownloadResult> {
    try {
      const configuration = this.configurations.get(configId);
      
      if (!configuration) {
        return {
          success: false,
          errors: ['Configuration not found']
        };
      }

      if (!configuration.isPublic && configuration.creatorId !== this.getCurrentUserId()) {
        return {
          success: false,
          errors: ['Configuration is private']
        };
      }

      // Increment download count
      configuration.downloadCount++;
      this.downloadHistory.add(configId);
      this.saveToStorage();

      return {
        success: true,
        configuration,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown download error']
      };
    }
  }

  public async rateConfiguration(configId: string, rating: number, comment: string = ''): Promise<RatingResult> {
    try {
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          errors: ['Rating must be between 1 and 5']
        };
      }

      const configuration = this.configurations.get(configId);
      if (!configuration) {
        return {
          success: false,
          errors: ['Configuration not found']
        };
      }

      const userId = this.getCurrentUserId();
      
      // Check if user already rated this configuration
      const existingRatingIndex = configuration.ratings.findIndex(r => r.userId === userId);
      
      const newRating: UserRating = {
        userId,
        rating,
        comment,
        date: Date.now(),
        helpful: 0
      };

      if (existingRatingIndex >= 0) {
        // Update existing rating
        configuration.ratings[existingRatingIndex] = newRating;
      } else {
        // Add new rating
        configuration.ratings.push(newRating);
      }

      configuration.lastModified = Date.now();
      this.saveToStorage();

      const newAverageRating = this.getAverageRating(configId);

      return {
        success: true,
        newAverageRating,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown rating error']
      };
    }
  }

  public getConfigurationDetails(configId: string): SharedConfiguration | null {
    return this.configurations.get(configId) || null;
  }

  public getAverageRating(configId: string): number {
    const configuration = this.configurations.get(configId);
    if (!configuration || configuration.ratings.length === 0) {
      return 0;
    }

    const totalRating = configuration.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    return totalRating / configuration.ratings.length;
  }

  public getUserConfigurations(userId?: string): SharedConfiguration[] {
    const targetUserId = userId || this.getCurrentUserId();
    return Array.from(this.configurations.values())
      .filter(config => config.creatorId === targetUserId)
      .sort((a, b) => b.lastModified - a.lastModified);
  }

  public getDownloadHistory(): SharedConfiguration[] {
    const configs = Array.from(this.downloadHistory)
      .map(configId => this.configurations.get(configId))
      .filter(config => config !== undefined) as SharedConfiguration[];
    
    return configs.sort((a, b) => b.lastModified - a.lastModified);
  }

  public deleteConfiguration(configId: string): boolean {
    const configuration = this.configurations.get(configId);
    if (!configuration) {
      return false;
    }

    // Only allow deletion by creator
    if (configuration.creatorId !== this.getCurrentUserId()) {
      return false;
    }

    this.configurations.delete(configId);
    this.userRatings.delete(configId);
    this.downloadHistory.delete(configId);
    this.saveToStorage();

    return true;
  }

  public updateConfiguration(
    configId: string,
    updates: Partial<Pick<SharedConfiguration, 'name' | 'description' | 'tags' | 'isPublic' | 'data'>>
  ): boolean {
    const configuration = this.configurations.get(configId);
    if (!configuration) {
      return false;
    }

    // Only allow updates by creator
    if (configuration.creatorId !== this.getCurrentUserId()) {
      return false;
    }

    Object.assign(configuration, updates, { lastModified: Date.now() });
    this.saveToStorage();

    return true;
  }

  public exportConfiguration(configId: string): ExportData | null {
    const configuration = this.configurations.get(configId);
    if (!configuration) {
      return null;
    }

    return {
      type: configuration.type,
      name: configuration.name,
      description: configuration.description,
      data: configuration.data,
      version: configuration.version,
      createdBy: configuration.creatorId,
      createdDate: configuration.createdDate
    };
  }

  public async importSharedConfiguration(exportData: ExportData): Promise<ImportResult> {
    try {
      // Validate export data
      if (!this.validateExportData(exportData)) {
        return {
          success: false,
          errors: ['Invalid export data format'],
          warnings: []
        };
      }

      // Create shared configuration from export data
      const shareResult = await this.shareConfiguration(
        exportData.data,
        exportData.type,
        exportData.name,
        exportData.description,
        [],
        true
      );

      if (!shareResult.success) {
        return {
          success: false,
          errors: shareResult.errors,
          warnings: []
        };
      }

      return {
        success: true,
        data: exportData.data,
        errors: [],
        warnings: exportData.version !== this.CURRENT_VERSION ? 
          [`Version mismatch: expected ${this.CURRENT_VERSION}, got ${exportData.version}`] : []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown import error'],
        warnings: []
      };
    }
  }

  public getPopularTags(): Array<{ tag: string; count: number }> {
    const tagCounts = new Map<string, number>();
    
    this.configurations.forEach(config => {
      config.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  public getFeaturedConfigurations(): SharedConfiguration[] {
    return Array.from(this.configurations.values())
      .filter(config => config.isFeatured && config.isPublic)
      .sort((a, b) => this.getAverageRating(b.id) - this.getAverageRating(a.id));
  }

  private generateConfigId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // In a real implementation, this would come from authentication system
    return localStorage.getItem('ai_habitat_user_id') || 'anonymous_user';
  }

  private generateShareUrl(configId: string): string {
    // In a real implementation, this would generate a proper URL
    return `${window.location.origin}/share/${configId}`;
  }

  private validateConfiguration(config: SharedConfiguration): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Configuration name is required');
    }

    if (!config.description || config.description.trim().length === 0) {
      errors.push('Configuration description is required');
    }

    if (!config.data) {
      errors.push('Configuration data is required');
    }

    // Type-specific validation
    switch (config.type) {
      case 'device':
        if (!config.data.devices || config.data.devices.length === 0) {
          errors.push('Device configuration must contain at least one device');
        }
        break;
      case 'room':
        if (!config.data.environment) {
          errors.push('Room configuration must contain environment data');
        }
        break;
      case 'governance':
        if (!config.data.governanceRules || config.data.governanceRules.length === 0) {
          errors.push('Governance configuration must contain at least one rule');
        }
        break;
      case 'scenario':
        if (!config.data.scenario) {
          errors.push('Scenario configuration must contain scenario data');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateExportData(data: ExportData): boolean {
    return data && 
           data.type && 
           data.name && 
           data.data && 
           data.version && 
           data.createdDate;
  }

  private loadFromStorage(): void {
    try {
      const configData = localStorage.getItem(this.STORAGE_KEY);
      if (configData) {
        const configs = JSON.parse(configData);
        this.configurations = new Map(Object.entries(configs));
      }

      const ratingsData = localStorage.getItem(this.USER_RATINGS_KEY);
      if (ratingsData) {
        const ratings = JSON.parse(ratingsData);
        this.userRatings = new Map(Object.entries(ratings));
      }

      const downloadData = localStorage.getItem(this.DOWNLOAD_HISTORY_KEY);
      if (downloadData) {
        this.downloadHistory = new Set(JSON.parse(downloadData));
      }
    } catch (error) {
      console.error('Failed to load configurations from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const configData = Object.fromEntries(this.configurations);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configData));

      const ratingsData = Object.fromEntries(this.userRatings);
      localStorage.setItem(this.USER_RATINGS_KEY, JSON.stringify(ratingsData));

      const downloadData = Array.from(this.downloadHistory);
      localStorage.setItem(this.DOWNLOAD_HISTORY_KEY, JSON.stringify(downloadData));
    } catch (error) {
      console.error('Failed to save configurations to storage:', error);
      throw error; // Re-throw the error so it can be handled by the caller
    }
  }
}