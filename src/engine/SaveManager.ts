import { GameScene, DeviceVisual, Vector3 } from '../types/core';

export interface SaveData {
  version: string;
  timestamp: number;
  playerProgress: PlayerProgress;
  gameState: GameState;
  metadata: SaveMetadata;
}

export interface PlayerProgress {
  completedTutorials: string[];
  unlockedScenarios: string[];
  achievements: Achievement[];
  skillLevels: SkillLevel[];
  learningAnalytics: LearningData[];
  totalPlayTime: number;
  lastPlayedDate: number;
}

export interface GameState {
  currentScenario: string | null;
  devices: DeviceConfiguration[];
  environment: EnvironmentConfiguration;
  governanceRules: GovernanceRuleConfiguration[];
  cameraState: CameraState;
  systemHealth: SystemHealthState;
}

export interface DeviceConfiguration {
  id: string;
  name: string;
  description: string;
  position: Vector3;
  personalityTraits: PersonalityTrait[];
  behaviorModel: BehaviorModelData;
  connectionHistory: ConnectionRecord[];
  performanceMetrics: DevicePerformanceData;
}

export interface EnvironmentConfiguration {
  type: string;
  name: string;
  layout: RoomLayout;
  environmentalFactors: EnvironmentalFactor[];
  resourceLimits: ResourceLimit[];
}

export interface GovernanceRuleConfiguration {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  createdDate: number;
  lastModified: number;
}

export interface SaveMetadata {
  name: string;
  description: string;
  tags: string[];
  isQuickSave: boolean;
  isAutoSave: boolean;
  screenshotData?: string;
}

export interface ExportData {
  type: 'device' | 'room' | 'governance' | 'scenario';
  name: string;
  description: string;
  data: any;
  version: string;
  createdBy: string;
  createdDate: number;
}

export interface ImportResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
}

export interface SaveResult {
  success: boolean;
  saveId: string;
  errors: string[];
}

export interface LoadResult {
  success: boolean;
  data?: SaveData;
  errors: string[];
}

export class SaveManager {
  private readonly STORAGE_KEY_PREFIX = 'ai_habitat_save_';
  private readonly QUICK_SAVE_KEY = 'ai_habitat_quick_save';
  private readonly AUTO_SAVE_KEY = 'ai_habitat_auto_save';
  private readonly EXPORT_KEY_PREFIX = 'ai_habitat_export_';
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly MAX_SAVES = 50;
  private readonly MAX_QUICK_SAVES = 10;

  private compressionEnabled: boolean = true;
  private encryptionEnabled: boolean = false;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    // Check if localStorage is available
    if (typeof Storage === 'undefined') {
      console.warn('SaveManager: localStorage not available, saves will not persist');
    }
  }

  public async saveGameState(gameState: GameState, metadata: SaveMetadata): Promise<SaveResult> {
    try {
      const saveId = this.generateSaveId();
      const saveData: SaveData = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        playerProgress: this.getCurrentPlayerProgress(),
        gameState,
        metadata
      };

      const serializedData = await this.serializeData(saveData);
      const storageKey = `${this.STORAGE_KEY_PREFIX}${saveId}`;

      // Check storage limits
      await this.enforceStorageLimits();

      // Save to localStorage
      localStorage.setItem(storageKey, serializedData);

      // Update save index
      this.updateSaveIndex(saveId, metadata);

      return {
        success: true,
        saveId,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        saveId: '',
        errors: [error instanceof Error ? error.message : 'Unknown save error']
      };
    }
  }

  public async loadGameState(saveId: string): Promise<LoadResult> {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${saveId}`;
      const serializedData = localStorage.getItem(storageKey);

      if (!serializedData) {
        return {
          success: false,
          errors: ['Save file not found']
        };
      }

      const saveData = await this.deserializeData(serializedData);
      
      // Validate save data
      const validationResult = this.validateSaveData(saveData);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }

      // Migrate if necessary
      const migratedData = await this.migrateSaveData(saveData);

      return {
        success: true,
        data: migratedData,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown load error']
      };
    }
  }

  public async createQuickSave(gameState: GameState): Promise<SaveResult> {
    const metadata: SaveMetadata = {
      name: `Quick Save ${new Date().toLocaleString()}`,
      description: 'Automatically created quick save',
      tags: ['quick-save'],
      isQuickSave: true,
      isAutoSave: false
    };

    const result = await this.saveGameState(gameState, metadata);
    
    if (result.success) {
      // Store quick save reference
      const quickSaves = this.getQuickSaves();
      quickSaves.unshift(result.saveId);
      
      // Limit quick saves
      if (quickSaves.length > this.MAX_QUICK_SAVES) {
        const oldSaveId = quickSaves.pop();
        if (oldSaveId) {
          this.deleteSave(oldSaveId);
        }
      }
      
      localStorage.setItem(this.QUICK_SAVE_KEY, JSON.stringify(quickSaves));
    }

    return result;
  }

  public async loadQuickSave(): Promise<LoadResult> {
    const quickSaves = this.getQuickSaves();
    if (quickSaves.length === 0) {
      return {
        success: false,
        errors: ['No quick saves available']
      };
    }

    return this.loadGameState(quickSaves[0]);
  }

  public async createAutoSave(gameState: GameState): Promise<SaveResult> {
    const metadata: SaveMetadata = {
      name: `Auto Save ${new Date().toLocaleString()}`,
      description: 'Automatically created save',
      tags: ['auto-save'],
      isQuickSave: false,
      isAutoSave: true
    };

    const result = await this.saveGameState(gameState, metadata);
    
    if (result.success) {
      localStorage.setItem(this.AUTO_SAVE_KEY, result.saveId);
    }

    return result;
  }

  public async exportConfiguration(config: any, type: ExportData['type'], name: string, description: string): Promise<string> {
    const exportData: ExportData = {
      type,
      name,
      description,
      data: config,
      version: this.CURRENT_VERSION,
      createdBy: 'player', // Could be enhanced with user system
      createdDate: Date.now()
    };

    const serializedData = await this.serializeData(exportData);
    
    // Create downloadable blob
    const blob = new Blob([serializedData], { type: 'application/json' });
    
    // Handle test environment where URL.createObjectURL might not be available
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      const url = URL.createObjectURL(blob);
      return url;
    } else {
      // Return a mock URL for testing
      return `data:application/json;base64,${btoa(serializedData)}`;
    }
  }

  public async importConfiguration(data: string): Promise<ImportResult> {
    try {
      const exportData = await this.deserializeData(data) as ExportData;
      
      // Validate export data
      if (!this.validateExportData(exportData)) {
        return {
          success: false,
          errors: ['Invalid export data format'],
          warnings: []
        };
      }

      // Check version compatibility
      const warnings: string[] = [];
      if (exportData.version !== this.CURRENT_VERSION) {
        warnings.push(`Version mismatch: expected ${this.CURRENT_VERSION}, got ${exportData.version}`);
      }

      return {
        success: true,
        data: exportData.data,
        errors: [],
        warnings
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown import error'],
        warnings: []
      };
    }
  }

  public getSaveList(): Array<{ id: string; metadata: SaveMetadata; timestamp: number }> {
    const saveIndex = this.getSaveIndex();
    return Object.entries(saveIndex).map(([id, info]) => ({
      id,
      metadata: info.metadata,
      timestamp: info.timestamp
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  public deleteSave(saveId: string): boolean {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${saveId}`;
      localStorage.removeItem(storageKey);
      
      // Update save index
      const saveIndex = this.getSaveIndex();
      delete saveIndex[saveId];
      localStorage.setItem('ai_habitat_save_index', JSON.stringify(saveIndex));
      
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  public getStorageInfo(): {
    totalSaves: number;
    storageUsed: number;
    storageLimit: number;
    oldestSave?: { id: string; timestamp: number };
  } {
    const saveIndex = this.getSaveIndex();
    const saves = Object.entries(saveIndex);
    
    let storageUsed = 0;
    saves.forEach(([id]) => {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${id}`;
      const data = localStorage.getItem(storageKey);
      if (data) {
        storageUsed += data.length;
      }
    });

    const oldestSave = saves.length > 0 ? 
      saves.reduce((oldest, [id, info]) => 
        info.timestamp < oldest.timestamp ? { id, timestamp: info.timestamp } : oldest,
        { id: saves[0][0], timestamp: saves[0][1].timestamp }
      ) : undefined;

    return {
      totalSaves: saves.length,
      storageUsed,
      storageLimit: 5 * 1024 * 1024, // 5MB estimate
      oldestSave
    };
  }

  private generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async serializeData(data: any): Promise<string> {
    let serialized = JSON.stringify(data);
    
    if (this.compressionEnabled) {
      // Simple compression could be added here
      // For now, just return JSON string
    }
    
    if (this.encryptionEnabled) {
      // Simple encryption could be added here
      // For now, just return serialized data
    }
    
    return serialized;
  }

  private async deserializeData(data: string): Promise<any> {
    if (this.encryptionEnabled) {
      // Decrypt data here if encryption is enabled
    }
    
    if (this.compressionEnabled) {
      // Decompress data here if compression is enabled
    }
    
    return JSON.parse(data);
  }

  private validateSaveData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.version) {
      errors.push('Missing version information');
    }
    
    if (!data.timestamp) {
      errors.push('Missing timestamp');
    }
    
    if (!data.gameState) {
      errors.push('Missing game state');
    }
    
    if (!data.metadata) {
      errors.push('Missing metadata');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateExportData(data: any): boolean {
    return data && 
           data.type && 
           data.name && 
           data.data && 
           data.version && 
           data.createdDate;
  }

  private async migrateSaveData(data: SaveData): Promise<SaveData> {
    // Handle version migrations here
    if (data.version !== this.CURRENT_VERSION) {
      // Perform migration logic
      console.log(`Migrating save data from version ${data.version} to ${this.CURRENT_VERSION}`);
    }
    
    return data;
  }

  private getCurrentPlayerProgress(): PlayerProgress {
    // This would typically come from a player progress manager
    return {
      completedTutorials: [],
      unlockedScenarios: [],
      achievements: [],
      skillLevels: [],
      learningAnalytics: [],
      totalPlayTime: 0,
      lastPlayedDate: Date.now()
    };
  }

  private getSaveIndex(): Record<string, { metadata: SaveMetadata; timestamp: number }> {
    const indexData = localStorage.getItem('ai_habitat_save_index');
    return indexData ? JSON.parse(indexData) : {};
  }

  private updateSaveIndex(saveId: string, metadata: SaveMetadata): void {
    const saveIndex = this.getSaveIndex();
    saveIndex[saveId] = {
      metadata,
      timestamp: Date.now()
    };
    localStorage.setItem('ai_habitat_save_index', JSON.stringify(saveIndex));
  }

  private getQuickSaves(): string[] {
    const quickSaveData = localStorage.getItem(this.QUICK_SAVE_KEY);
    return quickSaveData ? JSON.parse(quickSaveData) : [];
  }

  private async enforceStorageLimits(): Promise<void> {
    const storageInfo = this.getStorageInfo();
    
    // Remove oldest saves if we exceed the limit
    if (storageInfo.totalSaves >= this.MAX_SAVES && storageInfo.oldestSave) {
      this.deleteSave(storageInfo.oldestSave.id);
    }
  }
}

// Type definitions for completeness
interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedDate: number;
}

interface SkillLevel {
  category: string;
  level: number;
  experience: number;
}

interface LearningData {
  concept: string;
  understanding: number;
  practiceTime: number;
  lastPracticed: number;
}

interface PersonalityTrait {
  name: string;
  value: number;
  description: string;
}

interface BehaviorModelData {
  primaryObjective: string;
  learningAlgorithm: string;
  communicationStyle: string;
  conflictResolution: string;
}

interface ConnectionRecord {
  deviceId: string;
  connectionType: string;
  timestamp: number;
  duration: number;
}

interface DevicePerformanceData {
  uptime: number;
  errorCount: number;
  successfulInteractions: number;
  averageResponseTime: number;
}

interface RoomLayout {
  width: number;
  height: number;
  walls: Array<{ start: Vector3; end: Vector3 }>;
  furniture: Array<{ type: string; position: Vector3; rotation: number }>;
}

interface EnvironmentalFactor {
  type: string;
  value: number;
  description: string;
}

interface ResourceLimit {
  type: string;
  limit: number;
  current: number;
}

interface RuleCondition {
  type: string;
  parameters: Record<string, any>;
}

interface RuleAction {
  type: string;
  parameters: Record<string, any>;
}

interface CameraState {
  position: Vector3;
  target: Vector3;
  zoom: number;
}

interface SystemHealthState {
  harmonyLevel: number;
  conflictCount: number;
  performanceMetrics: Record<string, number>;
}