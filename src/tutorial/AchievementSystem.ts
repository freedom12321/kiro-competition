import {
  Achievement,
  UnlockCondition,
  Reward,
  PlayerProgress,
  SkillLevel,
  LearningData,
  AchievementCategory,
  AchievementRarity,
  UnlockType,
  RewardType,
  LearningCategory
} from '../types/core';

export interface AchievementSystemConfig {
  enableNotifications: boolean;
  trackDetailedStats: boolean;
  allowHiddenAchievements: boolean;
  pointsMultiplier: number;
}

export interface GameEvent {
  type: string;
  timestamp: number;
  data: any;
  playerId: string;
}

export interface UnlockNotification {
  achievement: Achievement;
  timestamp: number;
  newlyUnlocked: boolean;
  progress?: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  achievements: number;
  rank: number;
  category?: string;
}

export interface LeaderboardData {
  category: LeaderboardCategory;
  entries: LeaderboardEntry[];
  playerRank?: number;
  totalPlayers: number;
  lastUpdated: number;
}

export interface ProgressUpdate {
  category: LearningCategory;
  previousLevel: number;
  newLevel: number;
  experienceGained: number;
  nextLevelThreshold: number;
  leveledUp: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number; // 0-1
  completed: boolean;
  conditions: ConditionProgress[];
}

export interface ConditionProgress {
  conditionId: string;
  current: number;
  required: number;
  completed: boolean;
}

export enum LeaderboardCategory {
  OVERALL = 'overall',
  TUTORIALS = 'tutorials',
  SCENARIOS = 'scenarios',
  CREATIVITY = 'creativity',
  EFFICIENCY = 'efficiency',
  CRISIS_MANAGEMENT = 'crisis_management',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private playerProgress: Map<string, PlayerProgress> = new Map();
  private eventHistory: Map<string, GameEvent[]> = new Map();
  private config: AchievementSystemConfig;
  private eventListeners: Map<string, Function[]> = new Map();
  private leaderboards: Map<LeaderboardCategory, LeaderboardData> = new Map();

  constructor(config: AchievementSystemConfig) {
    this.config = config;
    this.initializeBuiltInAchievements();
    this.initializeLeaderboards();
  }

  // Achievement Management
  registerAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
    this.emit('achievementRegistered', { achievement });
  }

  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(includeHidden: boolean = false): Achievement[] {
    const achievements = Array.from(this.achievements.values());
    return includeHidden ? achievements : achievements.filter(a => !a.hidden);
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.category === category);
  }

  getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.rarity === rarity);
  }

  // Event Processing
  processGameEvent(event: GameEvent): Achievement[] {
    // Store event in history
    const playerEvents = this.eventHistory.get(event.playerId) || [];
    playerEvents.push(event);
    this.eventHistory.set(event.playerId, playerEvents);

    // Check for achievement unlocks
    const unlockedAchievements = this.checkAchievements(event);
    
    // Update player progress
    this.updatePlayerProgress(event);

    return unlockedAchievements;
  }

  checkAchievements(event: GameEvent): Achievement[] {
    const unlockedAchievements: Achievement[] = [];
    const playerProgress = this.getPlayerProgress(event.playerId);
    
    for (const achievement of this.achievements.values()) {
      // Skip if already unlocked
      if (playerProgress.achievements.some(a => a.id === achievement.id)) {
        continue;
      }

      // Check if conditions are met
      if (this.evaluateUnlockConditions(achievement, event.playerId, event)) {
        this.unlockAchievement(achievement.id, event.playerId);
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  private evaluateUnlockConditions(achievement: Achievement, playerId: string, triggerEvent?: GameEvent): boolean {
    const playerEvents = this.eventHistory.get(playerId) || [];
    const playerProgress = this.getPlayerProgress(playerId);

    return achievement.unlockConditions.every(condition => {
      switch (condition.type) {
        case UnlockType.TUTORIAL_COMPLETED:
          return playerProgress.completedTutorials.includes(condition.parameters.tutorialId);

        case UnlockType.SCENARIO_COMPLETED:
          // This would need to be tracked in player progress
          return this.hasCompletedScenario(playerId, condition.parameters.scenarioId);

        case UnlockType.SCORE_ACHIEVED:
          return this.getTotalScore(playerId) >= condition.parameters.score;

        case UnlockType.TIME_PLAYED:
          return playerProgress.totalPlayTime >= condition.parameters.minutes * 60 * 1000;

        case UnlockType.DEVICES_CREATED:
          return this.countEventsByType(playerEvents, 'device_created') >= condition.parameters.count;

        case UnlockType.CRISES_RESOLVED:
          return this.countEventsByType(playerEvents, 'crisis_resolved') >= condition.parameters.count;

        case UnlockType.PERFECT_SCORE:
          return this.hasPerfectScore(playerEvents, condition.parameters.scenarioId);

        case UnlockType.CREATIVE_SOLUTION:
          return this.hasCreativeSolution(playerEvents, condition.parameters.criteria);

        default:
          return false;
      }
    });
  }

  private hasCompletedScenario(playerId: string, scenarioId: string): boolean {
    const events = this.eventHistory.get(playerId) || [];
    return events.some(event => 
      event.type === 'scenario_completed' && 
      event.data.scenarioId === scenarioId &&
      event.data.success === true
    );
  }

  private getTotalScore(playerId: string): number {
    const events = this.eventHistory.get(playerId) || [];
    return events
      .filter(event => event.type === 'scenario_completed' || event.type === 'tutorial_completed')
      .reduce((total, event) => total + (event.data.score || 0), 0);
  }

  private countEventsByType(events: GameEvent[], eventType: string): number {
    return events.filter(event => event.type === eventType).length;
  }

  private hasPerfectScore(events: GameEvent[], scenarioId?: string): boolean {
    const completionEvents = events.filter(event => 
      event.type === 'scenario_completed' && 
      (!scenarioId || event.data.scenarioId === scenarioId)
    );
    
    return completionEvents.some(event => event.data.score >= event.data.maxScore);
  }

  private hasCreativeSolution(events: GameEvent[], criteria: any): boolean {
    // This would need to be implemented based on specific creativity metrics
    // For now, we'll check for unique device combinations or novel solutions
    const solutionEvents = events.filter(event => event.type === 'creative_solution');
    return solutionEvents.some(event => this.matchesCreativityCriteria(event.data, criteria));
  }

  private matchesCreativityCriteria(solutionData: any, criteria: any): boolean {
    // Implement specific creativity matching logic
    return solutionData.uniqueness >= (criteria.uniquenessThreshold || 0.8);
  }

  // Achievement Unlocking
  unlockAchievement(achievementId: string, playerId: string): UnlockNotification {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }

    const playerProgress = this.getPlayerProgress(playerId);
    
    // Check if already unlocked
    const alreadyUnlocked = playerProgress.achievements.some(a => a.id === achievementId);
    if (alreadyUnlocked) {
      return {
        achievement,
        timestamp: Date.now(),
        newlyUnlocked: false
      };
    }

    // Add to player's achievements
    playerProgress.achievements.push(achievement);

    // Apply rewards
    this.applyRewards(achievement.rewards, playerId);

    // Update skill levels if applicable
    this.updateSkillLevels(achievement, playerId);

    const notification: UnlockNotification = {
      achievement,
      timestamp: Date.now(),
      newlyUnlocked: true
    };

    // Emit notification
    if (this.config.enableNotifications) {
      this.emit('achievementUnlocked', { playerId, notification });
    }

    // Update leaderboards
    this.updateLeaderboards(playerId);

    return notification;
  }

  private applyRewards(rewards: Reward[], playerId: string): void {
    const playerProgress = this.getPlayerProgress(playerId);

    rewards.forEach(reward => {
      switch (reward.type) {
        case RewardType.EXPERIENCE_POINTS:
          this.addExperience(playerId, reward.value.category, reward.value.amount);
          break;

        case RewardType.UNLOCK_CONTENT:
          // This would unlock new scenarios, tutorials, or features
          this.unlockContent(playerId, reward.value);
          break;

        case RewardType.COSMETIC_ITEM:
          // Add cosmetic items to player's collection
          this.addCosmeticItem(playerId, reward.value);
          break;

        case RewardType.TITLE:
          // Add title to player's available titles
          this.addTitle(playerId, reward.value);
          break;

        case RewardType.BADGE:
          // Add badge to player's profile
          this.addBadge(playerId, reward.value);
          break;
      }
    });
  }

  private addExperience(playerId: string, category: LearningCategory, amount: number): void {
    const playerProgress = this.getPlayerProgress(playerId);
    let skillLevel = playerProgress.skillLevels.find(sl => sl.category === category);
    
    if (!skillLevel) {
      skillLevel = {
        category,
        level: 1,
        experience: 0,
        nextLevelThreshold: 100,
        improvements: []
      };
      playerProgress.skillLevels.push(skillLevel);
    }

    skillLevel.experience += amount * this.config.pointsMultiplier;
    
    // Check for level up
    while (skillLevel.experience >= skillLevel.nextLevelThreshold) {
      skillLevel.experience -= skillLevel.nextLevelThreshold;
      skillLevel.level++;
      skillLevel.nextLevelThreshold = this.calculateNextLevelThreshold(skillLevel.level);
      
      this.emit('levelUp', { 
        playerId, 
        category, 
        newLevel: skillLevel.level,
        experienceGained: amount
      });
    }
  }

  private calculateNextLevelThreshold(level: number): number {
    // Exponential growth: 100 * 1.5^(level-1)
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  private unlockContent(playerId: string, content: any): void {
    // Implementation would depend on content type
    this.emit('contentUnlocked', { playerId, content });
  }

  private addCosmeticItem(playerId: string, item: any): void {
    // Add to player's cosmetic collection
    this.emit('cosmeticUnlocked', { playerId, item });
  }

  private addTitle(playerId: string, title: string): void {
    // Add to player's available titles
    this.emit('titleUnlocked', { playerId, title });
  }

  private addBadge(playerId: string, badge: any): void {
    // Add to player's badge collection
    this.emit('badgeUnlocked', { playerId, badge });
  }

  private updateSkillLevels(achievement: Achievement, playerId: string): void {
    // Determine which skill categories this achievement affects
    const relevantCategories = this.getRelevantSkillCategories(achievement);
    
    relevantCategories.forEach(category => {
      this.addExperience(playerId, category, achievement.points);
    });
  }

  private getRelevantSkillCategories(achievement: Achievement): LearningCategory[] {
    // Map achievement categories to learning categories
    const categoryMap: { [key in AchievementCategory]: LearningCategory[] } = {
      [AchievementCategory.TUTORIAL]: [LearningCategory.AI_BASICS],
      [AchievementCategory.CREATIVITY]: [LearningCategory.DEVICE_CREATION, LearningCategory.INTERACTION_DESIGN],
      [AchievementCategory.EFFICIENCY]: [LearningCategory.SYSTEM_THINKING],
      [AchievementCategory.PROBLEM_SOLVING]: [LearningCategory.CRISIS_MANAGEMENT],
      [AchievementCategory.EXPLORATION]: [LearningCategory.AI_BASICS, LearningCategory.SYSTEM_THINKING],
      [AchievementCategory.MASTERY]: [LearningCategory.GOVERNANCE_DESIGN, LearningCategory.ETHICAL_AI],
      [AchievementCategory.COLLABORATION]: [LearningCategory.INTERACTION_DESIGN]
    };

    return categoryMap[achievement.category] || [LearningCategory.AI_BASICS];
  }

  // Progress Tracking
  trackProgress(playerId: string, category: LearningCategory, improvement: number): ProgressUpdate {
    const playerProgress = this.getPlayerProgress(playerId);
    let skillLevel = playerProgress.skillLevels.find(sl => sl.category === category);
    
    if (!skillLevel) {
      skillLevel = {
        category,
        level: 1,
        experience: 0,
        nextLevelThreshold: 100,
        improvements: []
      };
      playerProgress.skillLevels.push(skillLevel);
    }

    const previousLevel = skillLevel.level;
    const experienceGained = improvement * 10; // Convert improvement to experience
    
    skillLevel.improvements.push({
      timestamp: Date.now(),
      description: `Improved ${category} by ${improvement}`,
      experienceGained,
      source: 'gameplay'
    });

    this.addExperience(playerId, category, experienceGained);

    return {
      category,
      previousLevel,
      newLevel: skillLevel.level,
      experienceGained,
      nextLevelThreshold: skillLevel.nextLevelThreshold,
      leveledUp: skillLevel.level > previousLevel
    };
  }

  getAchievementProgress(playerId: string, achievementId?: string): AchievementProgress[] {
    const playerProgress = this.getPlayerProgress(playerId);
    const achievements = achievementId ? 
      [this.achievements.get(achievementId)!].filter(Boolean) :
      Array.from(this.achievements.values());

    return achievements.map(achievement => {
      const completed = playerProgress.achievements.some(a => a.id === achievement.id);
      const progress = completed ? 1 : this.calculateAchievementProgress(achievement, playerId);
      
      return {
        achievementId: achievement.id,
        progress,
        completed,
        conditions: achievement.unlockConditions.map(condition => ({
          conditionId: condition.type,
          current: this.getCurrentConditionValue(condition, playerId),
          required: this.getRequiredConditionValue(condition),
          completed: this.evaluateUnlockConditions(achievement, playerId)
        }))
      };
    });
  }

  private calculateAchievementProgress(achievement: Achievement, playerId: string): number {
    const conditionProgresses = achievement.unlockConditions.map(condition => {
      const current = this.getCurrentConditionValue(condition, playerId);
      const required = this.getRequiredConditionValue(condition);
      return Math.min(1, current / required);
    });

    return conditionProgresses.reduce((sum, progress) => sum + progress, 0) / conditionProgresses.length;
  }

  private getCurrentConditionValue(condition: UnlockCondition, playerId: string): number {
    const playerEvents = this.eventHistory.get(playerId) || [];
    const playerProgress = this.getPlayerProgress(playerId);

    switch (condition.type) {
      case UnlockType.TUTORIAL_COMPLETED:
        return playerProgress.completedTutorials.length;
      case UnlockType.SCORE_ACHIEVED:
        return this.getTotalScore(playerId);
      case UnlockType.TIME_PLAYED:
        return playerProgress.totalPlayTime / (60 * 1000); // Convert to minutes
      case UnlockType.DEVICES_CREATED:
        return this.countEventsByType(playerEvents, 'device_created');
      case UnlockType.CRISES_RESOLVED:
        return this.countEventsByType(playerEvents, 'crisis_resolved');
      default:
        return 0;
    }
  }

  private getRequiredConditionValue(condition: UnlockCondition): number {
    switch (condition.type) {
      case UnlockType.SCORE_ACHIEVED:
        return condition.parameters.score;
      case UnlockType.TIME_PLAYED:
        return condition.parameters.minutes;
      case UnlockType.DEVICES_CREATED:
        return condition.parameters.count;
      case UnlockType.CRISES_RESOLVED:
        return condition.parameters.count;
      default:
        return 1;
    }
  }

  // Leaderboards
  private initializeLeaderboards(): void {
    Object.values(LeaderboardCategory).forEach(category => {
      this.leaderboards.set(category, {
        category,
        entries: [],
        totalPlayers: 0,
        lastUpdated: Date.now()
      });
    });
  }

  updateLeaderboards(playerId: string): void {
    const playerProgress = this.getPlayerProgress(playerId);
    
    // Update overall leaderboard
    this.updateLeaderboard(LeaderboardCategory.OVERALL, playerId, {
      score: this.getTotalScore(playerId),
      achievements: playerProgress.achievements.length
    });

    // Update category-specific leaderboards
    this.updateLeaderboard(LeaderboardCategory.TUTORIALS, playerId, {
      score: playerProgress.completedTutorials.length,
      achievements: playerProgress.achievements.filter(a => a.category === AchievementCategory.TUTORIAL).length
    });

    // Update efficiency leaderboard
    const efficiencyScore = this.calculateEfficiencyScore(playerId);
    this.updateLeaderboard(LeaderboardCategory.EFFICIENCY, playerId, {
      score: efficiencyScore,
      achievements: playerProgress.achievements.filter(a => a.category === AchievementCategory.EFFICIENCY).length
    });
  }

  private updateLeaderboard(category: LeaderboardCategory, playerId: string, data: any): void {
    const leaderboard = this.leaderboards.get(category)!;
    
    // Remove existing entry
    leaderboard.entries = leaderboard.entries.filter(entry => entry.playerId !== playerId);
    
    // Add new entry
    leaderboard.entries.push({
      playerId,
      playerName: `Player ${playerId}`, // This would come from player data
      score: data.score,
      achievements: data.achievements,
      rank: 0, // Will be calculated
      category: category
    });

    // Sort and assign ranks
    leaderboard.entries.sort((a, b) => b.score - a.score);
    leaderboard.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    leaderboard.totalPlayers = leaderboard.entries.length;
    leaderboard.lastUpdated = Date.now();
  }

  private calculateEfficiencyScore(playerId: string): number {
    const events = this.eventHistory.get(playerId) || [];
    const completionEvents = events.filter(event => 
      event.type === 'scenario_completed' || event.type === 'tutorial_completed'
    );

    if (completionEvents.length === 0) return 0;

    const totalEfficiency = completionEvents.reduce((sum, event) => 
      sum + (event.data.efficiency || 0), 0
    );

    return totalEfficiency / completionEvents.length;
  }

  generateLeaderboard(category: LeaderboardCategory): LeaderboardData {
    return this.leaderboards.get(category) || {
      category,
      entries: [],
      totalPlayers: 0,
      lastUpdated: Date.now()
    };
  }

  // Player Progress Management
  private getPlayerProgress(playerId: string): PlayerProgress {
    if (!this.playerProgress.has(playerId)) {
      this.playerProgress.set(playerId, {
        completedTutorials: [],
        unlockedScenarios: [],
        achievements: [],
        skillLevels: [],
        learningAnalytics: [],
        totalPlayTime: 0,
        lastPlayed: Date.now(),
        preferences: {
          difficulty: 'intermediate' as any,
          hintFrequency: 'normal' as any,
          audioEnabled: true,
          visualEffectsLevel: 'normal' as any,
          colorScheme: 'default' as any,
          fontSize: 'medium' as any,
          autoSave: true,
          skipAnimations: false
        }
      });
    }
    return this.playerProgress.get(playerId)!;
  }

  private updatePlayerProgress(event: GameEvent): void {
    const playerProgress = this.getPlayerProgress(event.playerId);
    
    // Update total play time
    if (event.type === 'session_ended') {
      playerProgress.totalPlayTime += event.data.duration;
    }
    
    // Update last played
    playerProgress.lastPlayed = event.timestamp;
    
    // Add learning data
    if (event.type === 'learning_session_completed') {
      playerProgress.learningAnalytics.push(event.data);
    }
  }

  // Built-in Achievements
  private initializeBuiltInAchievements(): void {
    const achievements: Achievement[] = [
      {
        id: 'first-device',
        name: 'Device Creator',
        description: 'Create your first AI device',
        category: AchievementCategory.TUTORIAL,
        icon: '🤖',
        unlockConditions: [
          {
            type: UnlockType.DEVICES_CREATED,
            parameters: { count: 1 },
            description: 'Create 1 device'
          }
        ],
        rewards: [
          {
            type: RewardType.EXPERIENCE_POINTS,
            value: { category: LearningCategory.DEVICE_CREATION, amount: 50 },
            description: '50 Device Creation XP'
          }
        ],
        hidden: false,
        rarity: AchievementRarity.COMMON,
        points: 10
      },
      {
        id: 'tutorial-master',
        name: 'Tutorial Master',
        description: 'Complete all basic tutorials',
        category: AchievementCategory.TUTORIAL,
        icon: '🎓',
        unlockConditions: [
          {
            type: UnlockType.TUTORIAL_COMPLETED,
            parameters: { count: 3 },
            description: 'Complete 3 tutorials'
          }
        ],
        rewards: [
          {
            type: RewardType.UNLOCK_CONTENT,
            value: { type: 'scenario_category', category: 'advanced' },
            description: 'Unlock advanced scenarios'
          },
          {
            type: RewardType.TITLE,
            value: 'Tutorial Master',
            description: 'Tutorial Master title'
          }
        ],
        hidden: false,
        rarity: AchievementRarity.UNCOMMON,
        points: 50
      },
      {
        id: 'crisis-manager',
        name: 'Crisis Manager',
        description: 'Successfully resolve 10 device conflicts',
        category: AchievementCategory.PROBLEM_SOLVING,
        icon: '🚨',
        unlockConditions: [
          {
            type: UnlockType.CRISES_RESOLVED,
            parameters: { count: 10 },
            description: 'Resolve 10 crises'
          }
        ],
        rewards: [
          {
            type: RewardType.EXPERIENCE_POINTS,
            value: { category: LearningCategory.CRISIS_MANAGEMENT, amount: 100 },
            description: '100 Crisis Management XP'
          },
          {
            type: RewardType.BADGE,
            value: { name: 'Crisis Manager', icon: '🚨' },
            description: 'Crisis Manager badge'
          }
        ],
        hidden: false,
        rarity: AchievementRarity.RARE,
        points: 100
      },
      {
        id: 'perfect-harmony',
        name: 'Perfect Harmony',
        description: 'Achieve 100% device cooperation in a scenario',
        category: AchievementCategory.MASTERY,
        icon: '🎵',
        unlockConditions: [
          {
            type: UnlockType.PERFECT_SCORE,
            parameters: { metric: 'cooperation', threshold: 1.0 },
            description: 'Achieve perfect cooperation'
          }
        ],
        rewards: [
          {
            type: RewardType.EXPERIENCE_POINTS,
            value: { category: LearningCategory.INTERACTION_DESIGN, amount: 150 },
            description: '150 Interaction Design XP'
          },
          {
            type: RewardType.COSMETIC_ITEM,
            value: { type: 'device_skin', name: 'Harmony Glow' },
            description: 'Harmony Glow device skin'
          }
        ],
        hidden: false,
        rarity: AchievementRarity.EPIC,
        points: 200
      },
      {
        id: 'creative-genius',
        name: 'Creative Genius',
        description: 'Create a truly unique and innovative device solution',
        category: AchievementCategory.CREATIVITY,
        icon: '💡',
        unlockConditions: [
          {
            type: UnlockType.CREATIVE_SOLUTION,
            parameters: { uniquenessThreshold: 0.9, innovationScore: 0.8 },
            description: 'Create a highly unique solution'
          }
        ],
        rewards: [
          {
            type: RewardType.TITLE,
            value: 'Creative Genius',
            description: 'Creative Genius title'
          },
          {
            type: RewardType.UNLOCK_CONTENT,
            value: { type: 'creative_tools', tools: ['advanced_personality_editor'] },
            description: 'Unlock advanced creative tools'
          }
        ],
        hidden: true,
        rarity: AchievementRarity.LEGENDARY,
        points: 500
      }
    ];

    achievements.forEach(achievement => this.registerAchievement(achievement));
  }

  // Event system
  private on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  // Analytics
  getPlayerStats(playerId: string): any {
    const playerProgress = this.getPlayerProgress(playerId);
    const events = this.eventHistory.get(playerId) || [];

    return {
      totalAchievements: playerProgress.achievements.length,
      totalScore: this.getTotalScore(playerId),
      totalPlayTime: playerProgress.totalPlayTime,
      skillLevels: playerProgress.skillLevels,
      recentActivity: events.slice(-10),
      leaderboardRanks: this.getPlayerLeaderboardRanks(playerId)
    };
  }

  private getPlayerLeaderboardRanks(playerId: string): { [key: string]: number } {
    const ranks: { [key: string]: number } = {};
    
    this.leaderboards.forEach((leaderboard, category) => {
      const entry = leaderboard.entries.find(e => e.playerId === playerId);
      if (entry) {
        ranks[category] = entry.rank;
      }
    });

    return ranks;
  }

  // Cleanup
  cleanup(): void {
    this.eventListeners.clear();
  }

  public checkDeviceCreationAchievements(device: any): void {
    console.log('Checking device creation achievements for:', device);
  }

  public unlockTutorialAchievement(tutorialId: string): void {
    console.log('Tutorial achievement unlocked for:', tutorialId);
    const achievement = {
      id: `tutorial_${tutorialId}`,
      name: `Tutorial Completed: ${tutorialId}`,
      description: `Successfully completed the ${tutorialId} tutorial`,
      type: 'tutorial' as const,
      unlockedAt: Date.now()
    };
    this.unlockedAchievements.set(achievement.id, achievement);
  }

  public checkStoryAchievements(moment: any): void {
    console.log('Checking story achievements for:', moment);
  }
}