import { AIConcept } from './LearningMomentDetector';

export interface SharedConfiguration {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  type: ConfigurationType;
  data: ConfigurationData;
  tags: string[];
  difficulty: DifficultyLevel;
  targetConcepts: AIConcept[];
  createdAt: number;
  updatedAt: number;
  version: string;
  isPublic: boolean;
  downloadCount: number;
  ratings: UserRating[];
  comments: Comment[];
  collaborators: Collaborator[];
}

export enum ConfigurationType {
  DEVICE_SETUP = 'device_setup',
  ROOM_LAYOUT = 'room_layout',
  GOVERNANCE_RULES = 'governance_rules',
  SCENARIO = 'scenario',
  LEARNING_PATH = 'learning_path',
  TUTORIAL = 'tutorial'
}

export interface ConfigurationData {
  devices?: DeviceConfiguration[];
  roomLayout?: RoomLayout;
  governanceRules?: GovernanceRule[];
  scenarioParameters?: ScenarioParameters;
  learningObjectives?: LearningObjective[];
  metadata?: Record<string, any>;
}

export interface DeviceConfiguration {
  id: string;
  name: string;
  description: string;
  position: { x: number; y: number; z: number };
  behaviorModel: any;
  connections: string[];
}

export interface RoomLayout {
  id: string;
  name: string;
  dimensions: { width: number; height: number };
  furniture: FurnitureItem[];
  devicePlacements: DevicePlacement[];
  environmentSettings: EnvironmentSettings;
}

export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  scope: string[];
}

export interface ScenarioParameters {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  initialState: any;
  successCriteria: SuccessCriteria[];
  timeLimit?: number;
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface UserRating {
  userId: string;
  userName: string;
  rating: number; // 1-5
  review?: string;
  timestamp: number;
  helpful: number; // Number of users who found this helpful
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  parentId?: string; // For replies
  likes: number;
  replies: Comment[];
}

export interface Collaborator {
  userId: string;
  userName: string;
  role: CollaboratorRole;
  permissions: Permission[];
  joinedAt: number;
}

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  CONTRIBUTOR = 'contributor'
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
  MANAGE_COLLABORATORS = 'manage_collaborators',
  PUBLISH = 'publish'
}

export interface CollaborationSession {
  id: string;
  configurationId: string;
  participants: SessionParticipant[];
  startTime: number;
  endTime?: number;
  changes: ChangeEvent[];
  chatMessages: ChatMessage[];
  isActive: boolean;
}

export interface SessionParticipant {
  userId: string;
  userName: string;
  joinedAt: number;
  lastActivity: number;
  cursor?: CursorPosition;
  isActive: boolean;
}

export interface ChangeEvent {
  id: string;
  userId: string;
  timestamp: number;
  type: ChangeType;
  target: string;
  oldValue: any;
  newValue: any;
  description: string;
}

export enum ChangeType {
  ADD_DEVICE = 'add_device',
  REMOVE_DEVICE = 'remove_device',
  MODIFY_DEVICE = 'modify_device',
  ADD_RULE = 'add_rule',
  MODIFY_RULE = 'modify_rule',
  REMOVE_RULE = 'remove_rule',
  LAYOUT_CHANGE = 'layout_change',
  METADATA_UPDATE = 'metadata_update'
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: MessageType;
  attachments?: Attachment[];
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  SUGGESTION = 'suggestion',
  QUESTION = 'question',
  CELEBRATION = 'celebration'
}

export interface SearchFilters {
  type?: ConfigurationType;
  difficulty?: DifficultyLevel;
  concepts?: AIConcept[];
  tags?: string[];
  creator?: string;
  minRating?: number;
  dateRange?: { start: number; end: number };
  hasComments?: boolean;
  isCollaborative?: boolean;
}

export interface SharingAnalytics {
  totalShares: number;
  totalDownloads: number;
  averageRating: number;
  popularTags: TagPopularity[];
  topCreators: CreatorStats[];
  trendingConfigurations: SharedConfiguration[];
  collaborationStats: CollaborationStats;
}

export interface TagPopularity {
  tag: string;
  count: number;
  trend: 'rising' | 'stable' | 'declining';
}

export interface CreatorStats {
  userId: string;
  userName: string;
  configurationsShared: number;
  totalDownloads: number;
  averageRating: number;
  specializations: AIConcept[];
}

export interface CollaborationStats {
  activeSessions: number;
  totalCollaborations: number;
  averageSessionDuration: number;
  mostCollaborativeTypes: ConfigurationType[];
}

export class SharingCollaborationSystem {
  private configurations: Map<string, SharedConfiguration> = new Map();
  private collaborationSessions: Map<string, CollaborationSession> = new Map();
  private userSubscriptions: Map<string, string[]> = new Map(); // userId -> configurationIds
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSystem();
  }

  // Configuration Sharing
  shareConfiguration(config: Omit<SharedConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'ratings' | 'comments'>): string {
    const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const sharedConfig: SharedConfiguration = {
      ...config,
      id: configId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      downloadCount: 0,
      ratings: [],
      comments: [],
      collaborators: [{
        userId: config.creatorId,
        userName: config.creatorName,
        role: CollaboratorRole.OWNER,
        permissions: Object.values(Permission),
        joinedAt: Date.now()
      }]
    };

    this.configurations.set(configId, sharedConfig);
    this.emit('configurationShared', sharedConfig);
    
    return configId;
  }

  updateConfiguration(configId: string, updates: Partial<SharedConfiguration>, userId: string): boolean {
    const config = this.configurations.get(configId);
    if (!config) return false;

    // Check permissions
    if (!this.hasPermission(userId, configId, Permission.WRITE)) {
      return false;
    }

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: Date.now()
    };

    this.configurations.set(configId, updatedConfig);
    this.emit('configurationUpdated', { configId, updates, userId });
    
    return true;
  }

  downloadConfiguration(configId: string, userId: string): SharedConfiguration | null {
    const config = this.configurations.get(configId);
    if (!config || (!config.isPublic && !this.hasPermission(userId, configId, Permission.READ))) {
      return null;
    }

    // Increment download count
    config.downloadCount++;
    this.configurations.set(configId, config);

    this.emit('configurationDownloaded', { configId, userId });
    return { ...config };
  }

  searchConfigurations(query: string, filters: SearchFilters = {}): SharedConfiguration[] {
    const results: SharedConfiguration[] = [];
    
    this.configurations.forEach(config => {
      if (!config.isPublic) return;

      // Text search
      const searchText = `${config.title} ${config.description} ${config.tags.join(' ')}`.toLowerCase();
      if (query && !searchText.includes(query.toLowerCase())) return;

      // Apply filters
      if (filters.type && config.type !== filters.type) return;
      if (filters.difficulty && config.difficulty !== filters.difficulty) return;
      if (filters.concepts && !filters.concepts.some(concept => config.targetConcepts.includes(concept))) return;
      if (filters.tags && !filters.tags.some(tag => config.tags.includes(tag))) return;
      if (filters.creator && config.creatorId !== filters.creator) return;
      if (filters.minRating && this.getAverageRating(config) < filters.minRating) return;
      if (filters.dateRange) {
        if (config.createdAt < filters.dateRange.start || config.createdAt > filters.dateRange.end) return;
      }
      if (filters.hasComments && config.comments.length === 0) return;
      if (filters.isCollaborative && config.collaborators.length <= 1) return;

      results.push(config);
    });

    // Sort by relevance (rating, downloads, recency)
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  }

  // Rating and Review System
  rateConfiguration(configId: string, userId: string, userName: string, rating: number, review?: string): boolean {
    const config = this.configurations.get(configId);
    if (!config || rating < 1 || rating > 5) return false;

    // Remove existing rating from this user
    config.ratings = config.ratings.filter(r => r.userId !== userId);

    // Add new rating
    config.ratings.push({
      userId,
      userName,
      rating,
      review,
      timestamp: Date.now(),
      helpful: 0
    });

    this.configurations.set(configId, config);
    this.emit('configurationRated', { configId, userId, rating, review });
    
    return true;
  }

  markReviewHelpful(configId: string, reviewUserId: string, markingUserId: string): boolean {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const rating = config.ratings.find(r => r.userId === reviewUserId);
    if (!rating) return false;

    rating.helpful++;
    this.configurations.set(configId, config);
    
    return true;
  }

  // Comment System
  addComment(configId: string, userId: string, userName: string, content: string, parentId?: string): string | null {
    const config = this.configurations.get(configId);
    if (!config) return null;

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const comment: Comment = {
      id: commentId,
      userId,
      userName,
      content,
      timestamp: Date.now(),
      parentId,
      likes: 0,
      replies: []
    };

    if (parentId) {
      // Add as reply
      const parentComment = this.findComment(config.comments, parentId);
      if (parentComment) {
        parentComment.replies.push(comment);
      }
    } else {
      // Add as top-level comment
      config.comments.push(comment);
    }

    this.configurations.set(configId, config);
    this.emit('commentAdded', { configId, comment });
    
    return commentId;
  }

  likeComment(configId: string, commentId: string, userId: string): boolean {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const comment = this.findComment(config.comments, commentId);
    if (!comment) return false;

    comment.likes++;
    this.configurations.set(configId, config);
    
    return true;
  }

  // Collaboration System
  startCollaborationSession(configId: string, userId: string, userName: string): string | null {
    const config = this.configurations.get(configId);
    if (!config || !this.hasPermission(userId, configId, Permission.WRITE)) {
      return null;
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: CollaborationSession = {
      id: sessionId,
      configurationId: configId,
      participants: [{
        userId,
        userName,
        joinedAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true
      }],
      startTime: Date.now(),
      changes: [],
      chatMessages: [],
      isActive: true
    };

    this.collaborationSessions.set(sessionId, session);
    this.emit('collaborationSessionStarted', session);
    
    return sessionId;
  }

  joinCollaborationSession(sessionId: string, userId: string, userName: string): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session || !session.isActive) return false;

    // Check if user has permission to collaborate on this configuration
    if (!this.hasPermission(userId, session.configurationId, Permission.WRITE)) {
      return false;
    }

    // Check if user is already in session
    const existingParticipant = session.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      existingParticipant.isActive = true;
      existingParticipant.lastActivity = Date.now();
    } else {
      session.participants.push({
        userId,
        userName,
        joinedAt: Date.now(),
        lastActivity: Date.now(),
        isActive: true
      });
    }

    this.collaborationSessions.set(sessionId, session);
    this.emit('participantJoined', { sessionId, userId, userName });
    
    return true;
  }

  recordChange(sessionId: string, userId: string, change: Omit<ChangeEvent, 'id' | 'userId' | 'timestamp'>): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session || !session.isActive) return false;

    const changeEvent: ChangeEvent = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      timestamp: Date.now()
    };

    session.changes.push(changeEvent);
    
    // Update participant activity
    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.lastActivity = Date.now();
    }

    this.collaborationSessions.set(sessionId, session);
    this.emit('changeRecorded', { sessionId, change: changeEvent });
    
    return true;
  }

  sendChatMessage(sessionId: string, userId: string, userName: string, content: string, type: MessageType = MessageType.TEXT): boolean {
    const session = this.collaborationSessions.get(sessionId);
    if (!session || !session.isActive) return false;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      content,
      timestamp: Date.now(),
      type
    };

    session.chatMessages.push(message);
    this.collaborationSessions.set(sessionId, session);
    this.emit('chatMessage', { sessionId, message });
    
    return true;
  }

  // Collaboration Management
  addCollaborator(configId: string, requesterId: string, collaboratorId: string, collaboratorName: string, role: CollaboratorRole): boolean {
    const config = this.configurations.get(configId);
    if (!config || !this.hasPermission(requesterId, configId, Permission.MANAGE_COLLABORATORS)) {
      return false;
    }

    // Check if already a collaborator
    const existing = config.collaborators.find(c => c.userId === collaboratorId);
    if (existing) {
      existing.role = role;
      existing.permissions = this.getPermissionsForRole(role);
    } else {
      config.collaborators.push({
        userId: collaboratorId,
        userName: collaboratorName,
        role,
        permissions: this.getPermissionsForRole(role),
        joinedAt: Date.now()
      });
    }

    this.configurations.set(configId, config);
    this.emit('collaboratorAdded', { configId, collaboratorId, role });
    
    return true;
  }

  removeCollaborator(configId: string, requesterId: string, collaboratorId: string): boolean {
    const config = this.configurations.get(configId);
    if (!config || !this.hasPermission(requesterId, configId, Permission.MANAGE_COLLABORATORS)) {
      return false;
    }

    config.collaborators = config.collaborators.filter(c => c.userId !== collaboratorId);
    this.configurations.set(configId, config);
    this.emit('collaboratorRemoved', { configId, collaboratorId });
    
    return true;
  }

  // Analytics and Insights
  getSharingAnalytics(): SharingAnalytics {
    const configs = Array.from(this.configurations.values()).filter(c => c.isPublic);
    
    return {
      totalShares: configs.length,
      totalDownloads: configs.reduce((sum, c) => sum + c.downloadCount, 0),
      averageRating: this.calculateOverallAverageRating(configs),
      popularTags: this.getPopularTags(configs),
      topCreators: this.getTopCreators(configs),
      trendingConfigurations: this.getTrendingConfigurations(configs),
      collaborationStats: this.getCollaborationStats()
    };
  }

  getPersonalizedRecommendations(userId: string, userConcepts: AIConcept[]): SharedConfiguration[] {
    const configs = Array.from(this.configurations.values()).filter(c => c.isPublic);
    
    return configs
      .filter(config => {
        // Filter by user's learning concepts
        return config.targetConcepts.some(concept => userConcepts.includes(concept));
      })
      .sort((a, b) => {
        // Sort by relevance to user's interests
        const relevanceA = this.calculateUserRelevance(a, userConcepts);
        const relevanceB = this.calculateUserRelevance(b, userConcepts);
        return relevanceB - relevanceA;
      })
      .slice(0, 10); // Top 10 recommendations
  }

  // Subscription System
  subscribeToConfiguration(userId: string, configId: string): boolean {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const subscriptions = this.userSubscriptions.get(userId) || [];
    if (!subscriptions.includes(configId)) {
      subscriptions.push(configId);
      this.userSubscriptions.set(userId, subscriptions);
      this.emit('subscriptionAdded', { userId, configId });
    }
    
    return true;
  }

  unsubscribeFromConfiguration(userId: string, configId: string): boolean {
    const subscriptions = this.userSubscriptions.get(userId) || [];
    const filtered = subscriptions.filter(id => id !== configId);
    
    if (filtered.length !== subscriptions.length) {
      this.userSubscriptions.set(userId, filtered);
      this.emit('subscriptionRemoved', { userId, configId });
      return true;
    }
    
    return false;
  }

  // Helper Methods
  private hasPermission(userId: string, configId: string, permission: Permission): boolean {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const collaborator = config.collaborators.find(c => c.userId === userId);
    return collaborator ? collaborator.permissions.includes(permission) : false;
  }

  private getPermissionsForRole(role: CollaboratorRole): Permission[] {
    switch (role) {
      case CollaboratorRole.OWNER:
        return Object.values(Permission);
      case CollaboratorRole.EDITOR:
        return [Permission.READ, Permission.WRITE, Permission.SHARE];
      case CollaboratorRole.CONTRIBUTOR:
        return [Permission.READ, Permission.WRITE];
      case CollaboratorRole.VIEWER:
        return [Permission.READ];
      default:
        return [Permission.READ];
    }
  }

  private getAverageRating(config: SharedConfiguration): number {
    if (config.ratings.length === 0) return 0;
    const sum = config.ratings.reduce((total, rating) => total + rating.rating, 0);
    return sum / config.ratings.length;
  }

  private calculateRelevanceScore(config: SharedConfiguration, query: string): number {
    let score = 0;
    
    // Rating weight
    score += this.getAverageRating(config) * 20;
    
    // Download count weight
    score += Math.log(config.downloadCount + 1) * 10;
    
    // Recency weight
    const daysSinceCreation = (Date.now() - config.createdAt) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceCreation);
    
    // Query relevance
    if (query) {
      const searchText = `${config.title} ${config.description}`.toLowerCase();
      const queryWords = query.toLowerCase().split(' ');
      const matches = queryWords.filter(word => searchText.includes(word)).length;
      score += (matches / queryWords.length) * 50;
    }
    
    return score;
  }

  private findComment(comments: Comment[], commentId: string): Comment | null {
    for (const comment of comments) {
      if (comment.id === commentId) return comment;
      
      const found = this.findComment(comment.replies, commentId);
      if (found) return found;
    }
    return null;
  }

  private calculateOverallAverageRating(configs: SharedConfiguration[]): number {
    const allRatings = configs.flatMap(c => c.ratings);
    if (allRatings.length === 0) return 0;
    
    const sum = allRatings.reduce((total, rating) => total + rating.rating, 0);
    return sum / allRatings.length;
  }

  private getPopularTags(configs: SharedConfiguration[]): TagPopularity[] {
    const tagCounts = new Map<string, number>();
    
    configs.forEach(config => {
      config.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count, trend: 'stable' as const }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  private getTopCreators(configs: SharedConfiguration[]): CreatorStats[] {
    const creatorStats = new Map<string, CreatorStats>();
    
    configs.forEach(config => {
      const existing = creatorStats.get(config.creatorId);
      if (existing) {
        existing.configurationsShared++;
        existing.totalDownloads += config.downloadCount;
        const ratings = config.ratings.map(r => r.rating);
        if (ratings.length > 0) {
          existing.averageRating = (existing.averageRating + ratings.reduce((a, b) => a + b) / ratings.length) / 2;
        }
        config.targetConcepts.forEach(concept => {
          if (!existing.specializations.includes(concept)) {
            existing.specializations.push(concept);
          }
        });
      } else {
        const ratings = config.ratings.map(r => r.rating);
        creatorStats.set(config.creatorId, {
          userId: config.creatorId,
          userName: config.creatorName,
          configurationsShared: 1,
          totalDownloads: config.downloadCount,
          averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0,
          specializations: [...config.targetConcepts]
        });
      }
    });

    return Array.from(creatorStats.values())
      .sort((a, b) => b.totalDownloads - a.totalDownloads)
      .slice(0, 10);
  }

  private getTrendingConfigurations(configs: SharedConfiguration[]): SharedConfiguration[] {
    const recentConfigs = configs.filter(c => Date.now() - c.createdAt < 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    return recentConfigs
      .sort((a, b) => {
        const scoreA = a.downloadCount + this.getAverageRating(a) * 10;
        const scoreB = b.downloadCount + this.getAverageRating(b) * 10;
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }

  private getCollaborationStats(): CollaborationStats {
    const activeSessions = Array.from(this.collaborationSessions.values()).filter(s => s.isActive);
    const allSessions = Array.from(this.collaborationSessions.values());
    
    const totalDuration = allSessions
      .filter(s => s.endTime)
      .reduce((sum, s) => sum + (s.endTime! - s.startTime), 0);
    
    const avgDuration = allSessions.length > 0 ? totalDuration / allSessions.length : 0;
    
    // Count collaborative configurations
    const collaborativeConfigs = Array.from(this.configurations.values())
      .filter(c => c.collaborators.length > 1);
    
    const typeStats = new Map<ConfigurationType, number>();
    collaborativeConfigs.forEach(config => {
      typeStats.set(config.type, (typeStats.get(config.type) || 0) + 1);
    });
    
    const mostCollaborativeTypes = Array.from(typeStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    return {
      activeSessions: activeSessions.length,
      totalCollaborations: collaborativeConfigs.length,
      averageSessionDuration: avgDuration,
      mostCollaborativeTypes
    };
  }

  private calculateUserRelevance(config: SharedConfiguration, userConcepts: AIConcept[]): number {
    let relevance = 0;
    
    // Concept match
    const conceptMatches = config.targetConcepts.filter(concept => userConcepts.includes(concept)).length;
    relevance += conceptMatches * 30;
    
    // Quality indicators
    relevance += this.getAverageRating(config) * 10;
    relevance += Math.log(config.downloadCount + 1) * 5;
    
    return relevance;
  }

  private initializeSystem(): void {
    // Set up periodic cleanup of inactive sessions
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    this.collaborationSessions.forEach((session, sessionId) => {
      const lastActivity = Math.max(...session.participants.map(p => p.lastActivity));
      
      if (now - lastActivity > inactiveThreshold) {
        session.isActive = false;
        session.endTime = now;
        this.emit('sessionEnded', { sessionId, reason: 'inactivity' });
      }
    });
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Getters for external access
  getConfiguration(configId: string): SharedConfiguration | null {
    return this.configurations.get(configId) || null;
  }

  getUserConfigurations(userId: string): SharedConfiguration[] {
    return Array.from(this.configurations.values())
      .filter(config => config.collaborators.some(c => c.userId === userId));
  }

  getCollaborationSession(sessionId: string): CollaborationSession | null {
    return this.collaborationSessions.get(sessionId) || null;
  }

  getUserSubscriptions(userId: string): string[] {
    return this.userSubscriptions.get(userId) || [];
  }
}

// Supporting interfaces
interface FurnitureItem {
  id: string;
  type: string;
  position: { x: number; y: number };
  rotation: number;
}

interface DevicePlacement {
  deviceId: string;
  position: { x: number; y: number; z: number };
  rotation: number;
}

interface EnvironmentSettings {
  lighting: string;
  temperature: number;
  ambientSound: string;
}

interface RuleCondition {
  type: string;
  parameters: Record<string, any>;
}

interface RuleAction {
  type: string;
  parameters: Record<string, any>;
}

interface LearningObjective {
  id: string;
  description: string;
  concept: AIConcept;
  difficulty: DifficultyLevel;
}

interface SuccessCriteria {
  id: string;
  description: string;
  metric: string;
  threshold: number;
}

interface CursorPosition {
  x: number;
  y: number;
  element?: string;
}

interface Attachment {
  id: string;
  type: string;
  url: string;
  name: string;
}