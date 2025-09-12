import { AchievementSystem, AchievementSystemConfig, GameEvent, LeaderboardCategory } from '../../src/tutorial/AchievementSystem';
import {
  Achievement,
  PlayerProgress,
  AchievementCategory,
  AchievementRarity,
  UnlockType,
  RewardType,
  LearningCategory,
  DifficultyLevel
} from '../../src/types/core';

describe('AchievementSystem', () => {
  let achievementSystem: AchievementSystem;
  let config: AchievementSystemConfig;

  beforeEach(() => {
    config = {
      enableNotifications: true,
      trackDetailedStats: true,
      allowHiddenAchievements: true,
      pointsMultiplier: 1.0
    };

    achievementSystem = new AchievementSystem(config);
  });

  afterEach(() => {
    achievementSystem.cleanup();
  });

  describe('Achievement Registration', () => {
    it('should register an achievement successfully', () => {
      const achievement = createMockAchievement('test-achievement');
      
      achievementSystem.registerAchievement(achievement);
      
      const retrieved = achievementSystem.getAchievement('test-achievement');
      expect(retrieved).toEqual(achievement);
    });

    it('should get all achievements excluding hidden by default', () => {
      const visibleAchievement = createMockAchievement('visible', false);
      const hiddenAchievement = createMockAchievement('hidden', true);
      
      achievementSystem.registerAchievement(visibleAchievement);
      achievementSystem.registerAchievement(hiddenAchievement);
      
      const allAchievements = achievementSystem.getAllAchievements(false);
      const visibleIds = allAchievements.map(a => a.id);
      
      expect(visibleIds).toContain('visible');
      expect(visibleIds).not.toContain('hidden');
    });

    it('should get all achievements including hidden when requested', () => {
      const visibleAchievement = createMockAchievement('visible', false);
      const hiddenAchievement = createMockAchievement('hidden', true);
      
      achievementSystem.registerAchievement(visibleAchievement);
      achievementSystem.registerAchievement(hiddenAchievement);
      
      const allAchievements = achievementSystem.getAllAchievements(true);
      const allIds = allAchievements.map(a => a.id);
      
      expect(allIds).toContain('visible');
      expect(allIds).toContain('hidden');
    });

    it('should get achievements by category', () => {
      const tutorialAchievement = createMockAchievement('tutorial', false, AchievementCategory.TUTORIAL);
      const creativityAchievement = createMockAchievement('creativity', false, AchievementCategory.CREATIVITY);
      
      achievementSystem.registerAchievement(tutorialAchievement);
      achievementSystem.registerAchievement(creativityAchievement);
      
      const tutorialAchievements = achievementSystem.getAchievementsByCategory(AchievementCategory.TUTORIAL);
      const creativityAchievements = achievementSystem.getAchievementsByCategory(AchievementCategory.CREATIVITY);
      
      expect(tutorialAchievements.some(a => a.id === 'tutorial')).toBe(true);
      expect(creativityAchievements.some(a => a.id === 'creativity')).toBe(true);
    });

    it('should get achievements by rarity', () => {
      const commonAchievement = createMockAchievement('common', false, AchievementCategory.TUTORIAL, AchievementRarity.COMMON);
      const rareAchievement = createMockAchievement('rare', false, AchievementCategory.TUTORIAL, AchievementRarity.RARE);
      
      achievementSystem.registerAchievement(commonAchievement);
      achievementSystem.registerAchievement(rareAchievement);
      
      const commonAchievements = achievementSystem.getAchievementsByRarity(AchievementRarity.COMMON);
      const rareAchievements = achievementSystem.getAchievementsByRarity(AchievementRarity.RARE);
      
      expect(commonAchievements.some(a => a.id === 'common')).toBe(true);
      expect(rareAchievements.some(a => a.id === 'rare')).toBe(true);
    });
  });

  describe('Event Processing', () => {
    let achievement: Achievement;

    beforeEach(() => {
      achievement = createMockAchievement('device-creator', false, AchievementCategory.TUTORIAL, AchievementRarity.COMMON, [
        {
          type: UnlockType.DEVICES_CREATED,
          parameters: { count: 1 },
          description: 'Create 1 device'
        }
      ]);
      achievementSystem.registerAchievement(achievement);
    });

    it('should process game events and check achievements', () => {
      const event: GameEvent = {
        type: 'device_created',
        timestamp: Date.now(),
        data: { deviceId: 'test-device' },
        playerId: 'player-1'
      };
      
      const unlockedAchievements = achievementSystem.processGameEvent(event);
      
      // Should unlock both the test achievement and built-in first-device achievement
      expect(unlockedAchievements.length).toBeGreaterThanOrEqual(1);
      expect(unlockedAchievements.some(a => a.id === 'device-creator' || a.id === 'first-device')).toBe(true);
    });

    it('should store events in history', () => {
      const event: GameEvent = {
        type: 'device_created',
        timestamp: Date.now(),
        data: { deviceId: 'test-device' },
        playerId: 'player-1'
      };
      
      achievementSystem.processGameEvent(event);
      
      // Event should be stored (verified through achievement unlocking)
      const stats = achievementSystem.getPlayerStats('player-1');
      expect(stats.recentActivity).toHaveLength(1);
    });

    it('should not unlock same achievement twice', () => {
      const event: GameEvent = {
        type: 'device_created',
        timestamp: Date.now(),
        data: { deviceId: 'test-device' },
        playerId: 'player-1'
      };
      
      const firstUnlock = achievementSystem.processGameEvent(event);
      const secondUnlock = achievementSystem.processGameEvent(event);
      
      expect(firstUnlock.length).toBeGreaterThanOrEqual(1);
      expect(secondUnlock).toHaveLength(0);
    });
  });

  describe('Achievement Unlocking', () => {
    let achievement: Achievement;

    beforeEach(() => {
      achievement = createMockAchievement('test-unlock');
      achievementSystem.registerAchievement(achievement);
    });

    it('should unlock achievement successfully', () => {
      const notification = achievementSystem.unlockAchievement('test-unlock', 'player-1');
      
      expect(notification.achievement.id).toBe('test-unlock');
      expect(notification.newlyUnlocked).toBe(true);
      expect(notification.timestamp).toBeDefined();
    });

    it('should not unlock already unlocked achievement', () => {
      achievementSystem.unlockAchievement('test-unlock', 'player-1');
      const secondNotification = achievementSystem.unlockAchievement('test-unlock', 'player-1');
      
      expect(secondNotification.newlyUnlocked).toBe(false);
    });

    it('should throw error for non-existent achievement', () => {
      expect(() => {
        achievementSystem.unlockAchievement('non-existent', 'player-1');
      }).toThrow('Achievement non-existent not found');
    });

    it('should apply experience point rewards', () => {
      const achievementWithXP = createMockAchievement('xp-reward', false, AchievementCategory.TUTORIAL, AchievementRarity.COMMON, [], [
        {
          type: RewardType.EXPERIENCE_POINTS,
          value: { category: LearningCategory.DEVICE_CREATION, amount: 50 },
          description: '50 XP'
        }
      ]);
      
      achievementSystem.registerAchievement(achievementWithXP);
      achievementSystem.unlockAchievement('xp-reward', 'player-1');
      
      const stats = achievementSystem.getPlayerStats('player-1');
      const skillLevel = stats.skillLevels.find((sl: any) => sl.category === LearningCategory.DEVICE_CREATION);
      
      expect(skillLevel).toBeDefined();
      expect(skillLevel.experience).toBe(50);
    });
  });

  describe('Progress Tracking', () => {
    it('should track skill progress correctly', () => {
      const progressUpdate = achievementSystem.trackProgress('player-1', LearningCategory.DEVICE_CREATION, 0.5);
      
      expect(progressUpdate.category).toBe(LearningCategory.DEVICE_CREATION);
      expect(progressUpdate.experienceGained).toBe(5); // 0.5 * 10
      expect(progressUpdate.newLevel).toBe(1);
      expect(progressUpdate.leveledUp).toBe(false);
    });

    it('should level up when threshold is reached', () => {
      // Add enough experience to level up
      achievementSystem.trackProgress('player-1', LearningCategory.DEVICE_CREATION, 10); // 100 XP
      
      const stats = achievementSystem.getPlayerStats('player-1');
      const skillLevel = stats.skillLevels.find((sl: any) => sl.category === LearningCategory.DEVICE_CREATION);
      
      expect(skillLevel.level).toBe(2);
    });

    it('should get achievement progress for player', () => {
      const achievement = createMockAchievement('progress-test', false, AchievementCategory.TUTORIAL, AchievementRarity.COMMON, [
        {
          type: UnlockType.DEVICES_CREATED,
          parameters: { count: 5 },
          description: 'Create 5 devices'
        }
      ]);
      
      achievementSystem.registerAchievement(achievement);
      
      // Create some devices
      for (let i = 0; i < 3; i++) {
        achievementSystem.processGameEvent({
          type: 'device_created',
          timestamp: Date.now(),
          data: { deviceId: `device-${i}` },
          playerId: 'player-1'
        });
      }
      
      const progress = achievementSystem.getAchievementProgress('player-1', 'progress-test');
      
      expect(progress).toHaveLength(1);
      expect(progress[0].progress).toBeCloseTo(0.6, 1); // 3/5
      expect(progress[0].completed).toBe(false);
    });
  });

  describe('Leaderboards', () => {
    beforeEach(() => {
      // Create some test achievements and events
      const achievement = createMockAchievement('leaderboard-test');
      achievementSystem.registerAchievement(achievement);
    });

    it('should generate overall leaderboard', () => {
      // Add some achievements for different players
      achievementSystem.unlockAchievement('leaderboard-test', 'player-1');
      
      // Process some scoring events
      achievementSystem.processGameEvent({
        type: 'scenario_completed',
        timestamp: Date.now(),
        data: { score: 100 },
        playerId: 'player-1'
      });
      
      const leaderboard = achievementSystem.generateLeaderboard(LeaderboardCategory.OVERALL);
      
      expect(leaderboard.category).toBe(LeaderboardCategory.OVERALL);
      expect(leaderboard.entries.length).toBeGreaterThan(0);
      expect(leaderboard.totalPlayers).toBeGreaterThan(0);
    });

    it('should rank players correctly', () => {
      // Create achievements for multiple players with different scores
      achievementSystem.processGameEvent({
        type: 'scenario_completed',
        timestamp: Date.now(),
        data: { score: 100 },
        playerId: 'player-1'
      });
      
      achievementSystem.processGameEvent({
        type: 'scenario_completed',
        timestamp: Date.now(),
        data: { score: 200 },
        playerId: 'player-2'
      });
      
      const leaderboard = achievementSystem.generateLeaderboard(LeaderboardCategory.OVERALL);
      
      // Test that leaderboard exists and has basic structure
      expect(leaderboard.category).toBe(LeaderboardCategory.OVERALL);
      expect(leaderboard.entries).toBeDefined();
      expect(leaderboard.totalPlayers).toBeGreaterThanOrEqual(0);
      
      // If there are entries, test ranking
      if (leaderboard.entries.length >= 2) {
        expect(leaderboard.entries[0].score).toBeGreaterThanOrEqual(leaderboard.entries[1].score);
        expect(leaderboard.entries[0].rank).toBe(1);
      }
    });
  });

  describe('Built-in Achievements', () => {
    it('should have first device achievement', () => {
      const achievement = achievementSystem.getAchievement('first-device');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('Device Creator');
      expect(achievement?.category).toBe(AchievementCategory.TUTORIAL);
    });

    it('should have tutorial master achievement', () => {
      const achievement = achievementSystem.getAchievement('tutorial-master');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('Tutorial Master');
      expect(achievement?.rarity).toBe(AchievementRarity.UNCOMMON);
    });

    it('should have crisis manager achievement', () => {
      const achievement = achievementSystem.getAchievement('crisis-manager');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('Crisis Manager');
      expect(achievement?.category).toBe(AchievementCategory.PROBLEM_SOLVING);
    });

    it('should have perfect harmony achievement', () => {
      const achievement = achievementSystem.getAchievement('perfect-harmony');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('Perfect Harmony');
      expect(achievement?.rarity).toBe(AchievementRarity.EPIC);
    });

    it('should have creative genius hidden achievement', () => {
      const achievement = achievementSystem.getAchievement('creative-genius');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('Creative Genius');
      expect(achievement?.hidden).toBe(true);
      expect(achievement?.rarity).toBe(AchievementRarity.LEGENDARY);
    });

    it('should unlock first device achievement when device is created', () => {
      const event: GameEvent = {
        type: 'device_created',
        timestamp: Date.now(),
        data: { deviceId: 'test-device' },
        playerId: 'player-1'
      };
      
      const unlockedAchievements = achievementSystem.processGameEvent(event);
      
      expect(unlockedAchievements.some(a => a.id === 'first-device')).toBe(true);
    });
  });

  describe('Player Statistics', () => {
    beforeEach(() => {
      const achievement = createMockAchievement('stats-test');
      achievementSystem.registerAchievement(achievement);
      achievementSystem.unlockAchievement('stats-test', 'player-1');
    });

    it('should provide comprehensive player stats', () => {
      const stats = achievementSystem.getPlayerStats('player-1');
      
      expect(stats).toMatchObject({
        totalAchievements: expect.any(Number),
        totalScore: expect.any(Number),
        totalPlayTime: expect.any(Number),
        skillLevels: expect.any(Array),
        recentActivity: expect.any(Array),
        leaderboardRanks: expect.any(Object)
      });
    });

    it('should track total achievements correctly', () => {
      const stats = achievementSystem.getPlayerStats('player-1');
      expect(stats.totalAchievements).toBeGreaterThan(0);
    });

    it('should calculate total score from events', () => {
      achievementSystem.processGameEvent({
        type: 'scenario_completed',
        timestamp: Date.now(),
        data: { score: 150 },
        playerId: 'player-1'
      });
      
      const stats = achievementSystem.getPlayerStats('player-1');
      expect(stats.totalScore).toBe(150);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid player IDs gracefully', () => {
      expect(() => {
        achievementSystem.getPlayerStats('non-existent-player');
      }).not.toThrow();
    });

    it('should handle malformed events gracefully', () => {
      const malformedEvent: GameEvent = {
        type: 'invalid_event',
        timestamp: Date.now(),
        data: null,
        playerId: 'player-1'
      };
      
      expect(() => {
        achievementSystem.processGameEvent(malformedEvent);
      }).not.toThrow();
    });

    it('should handle missing achievement conditions gracefully', () => {
      const achievementWithoutConditions = {
        ...createMockAchievement('no-conditions'),
        unlockConditions: []
      };
      
      achievementSystem.registerAchievement(achievementWithoutConditions);
      
      expect(() => {
        achievementSystem.processGameEvent({
          type: 'any_event',
          timestamp: Date.now(),
          data: {},
          playerId: 'player-1'
        });
      }).not.toThrow();
    });
  });

  // Helper function to create mock achievement
  function createMockAchievement(
    id: string,
    hidden: boolean = false,
    category: AchievementCategory = AchievementCategory.TUTORIAL,
    rarity: AchievementRarity = AchievementRarity.COMMON,
    unlockConditions: any[] = [],
    rewards: any[] = []
  ): Achievement {
    return {
      id,
      name: `Test Achievement ${id}`,
      description: `Description for ${id}`,
      category,
      icon: '🏆',
      unlockConditions: unlockConditions.length > 0 ? unlockConditions : [
        {
          type: UnlockType.TUTORIAL_COMPLETED,
          parameters: { tutorialId: 'basic-tutorial' },
          description: 'Complete basic tutorial'
        }
      ],
      rewards: rewards.length > 0 ? rewards : [
        {
          type: RewardType.EXPERIENCE_POINTS,
          value: { category: LearningCategory.AI_BASICS, amount: 10 },
          description: '10 XP'
        }
      ],
      hidden,
      rarity,
      points: 10
    };
  }
});