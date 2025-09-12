import { LearningAnalytics, SkillLevel, MasteryType } from '../../src/education/LearningAnalytics';
import { LearningMoment, LearningMomentType, AIConcept } from '../../src/education/LearningMomentDetector';
import { JournalEntry } from '../../src/education/ReflectionJournal';

describe('LearningAnalytics', () => {
  let analytics: LearningAnalytics;
  let mockLearningMoment: LearningMoment;
  let mockJournalEntry: JournalEntry;

  beforeEach(() => {
    analytics = new LearningAnalytics();
    
    mockLearningMoment = {
      id: 'moment_1',
      type: LearningMomentType.COOPERATION_SUCCESS,
      timestamp: Date.now(),
      gameEvent: {
        id: 'event_1',
        type: 'cooperation_achieved',
        timestamp: Date.now(),
        data: { efficiency: 1.8 }
      },
      aiConcept: AIConcept.MULTI_AGENT_COORDINATION,
      description: 'Two AI devices successfully coordinated',
      realWorldExample: 'Autonomous vehicles coordinating',
      reflectionPrompts: ['What enabled cooperation?'],
      importance: 7
    };

    mockJournalEntry = {
      id: 'entry_1',
      timestamp: Date.now(),
      learningMomentId: 'moment_1',
      playerReflection: 'I learned that AI cooperation requires clear communication protocols because without them, agents cannot coordinate effectively.',
      aiConcept: AIConcept.MULTI_AGENT_COORDINATION,
      tags: ['cooperation', 'communication'],
      insights: ['AI cooperation requires clear communication protocols'],
      connections: ['This is similar to real-world team coordination'],
      rating: 4
    };
  });

  describe('Learning Moment Tracking', () => {
    it('should track learning moments and update skill levels', () => {
      analytics.trackLearningMoment(mockLearningMoment, mockJournalEntry);

      const skillLevels = analytics.playerSkillLevels;
      const coordinationSkill = skillLevels.get(AIConcept.MULTI_AGENT_COORDINATION);

      expect(coordinationSkill).toBeDefined();
      expect(coordinationSkill!.experiencePoints).toBeGreaterThan(0);
      expect(coordinationSkill!.lastUpdated).toBeGreaterThan(0);
    });

    it('should assess player engagement correctly', () => {
      analytics.trackLearningMoment(mockLearningMoment, mockJournalEntry);

      const metrics = analytics.currentProgressMetrics;
      expect(metrics.engagementLevel).toBeGreaterThan(0);
    });

    it('should identify demonstrated skills from reflections', () => {
      const detailedReflection = {
        ...mockJournalEntry,
        playerReflection: 'This is similar to real-world systems because both require coordination. Therefore, I think communication protocols are essential.'
      };

      analytics.trackLearningMoment(mockLearningMoment, detailedReflection);

      const skillLevels = analytics.playerSkillLevels;
      const skill = skillLevels.get(AIConcept.MULTI_AGENT_COORDINATION);
      
      expect(skill!.masteryIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Skill Level Calculation', () => {
    it('should start with novice level for new concepts', () => {
      const skillLevels = analytics.playerSkillLevels;
      const alignmentSkill = skillLevels.get(AIConcept.ALIGNMENT_PROBLEM);

      expect(alignmentSkill!.level).toBe(SkillLevel.NOVICE);
      expect(alignmentSkill!.confidence).toBeLessThan(0.5);
    });

    it('should progress skill levels with evidence', () => {
      // Simulate multiple learning moments with good performance
      for (let i = 0; i < 5; i++) {
        const moment = { ...mockLearningMoment, id: `moment_${i}` };
        const entry = { 
          ...mockJournalEntry, 
          id: `entry_${i}`,
          playerReflection: 'Detailed analysis showing deep understanding because I can explain the mechanisms and apply them to new situations.',
          insights: ['Deep insight 1', 'Deep insight 2'],
          connections: ['Real world connection 1', 'Real world connection 2'],
          rating: 5
        };
        
        analytics.trackLearningMoment(moment, entry);
      }

      const skillLevels = analytics.playerSkillLevels;
      const skill = skillLevels.get(AIConcept.MULTI_AGENT_COORDINATION);

      expect(skill!.level).not.toBe(SkillLevel.NOVICE);
      expect(skill!.confidence).toBeGreaterThan(0.3);
    });

    it('should calculate confidence based on consistency', () => {
      // Add consistent high-quality evidence
      for (let i = 0; i < 3; i++) {
        const moment = { ...mockLearningMoment, id: `moment_${i}` };
        const entry = { 
          ...mockJournalEntry, 
          id: `entry_${i}`,
          rating: 5
        };
        
        analytics.trackLearningMoment(moment, entry);
      }

      const skill = analytics.playerSkillLevels.get(AIConcept.MULTI_AGENT_COORDINATION);
      expect(skill!.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Learning Path Generation', () => {
    beforeEach(() => {
      // Create some learning history
      analytics.trackLearningMoment(mockLearningMoment, mockJournalEntry);
    });

    it('should generate personalized learning path', () => {
      const path = analytics.generateLearningPath();

      expect(path).toBeDefined();
      expect(path.currentFocus).toBeDefined();
      expect(path.skillGaps).toBeDefined();
      expect(path.learningGoals).toBeDefined();
      expect(path.recommendedScenarios).toBeDefined();
    });

    it('should identify skill gaps correctly', () => {
      const path = analytics.generateLearningPath();

      expect(path.skillGaps.length).toBeGreaterThan(0);
      expect(path.skillGaps[0].currentLevel).toBeDefined();
      expect(path.skillGaps[0].targetLevel).toBeDefined();
      expect(path.skillGaps[0].priority).toBeGreaterThan(0);
    });

    it('should recommend appropriate scenarios', () => {
      const path = analytics.generateLearningPath();

      expect(path.recommendedScenarios.length).toBeGreaterThan(0);
      expect(path.recommendedScenarios[0]).toContain('_');
    });

    it('should create learning goals with milestones', () => {
      const path = analytics.generateLearningPath();

      expect(path.learningGoals.length).toBeGreaterThan(0);
      expect(path.learningGoals[0].milestones).toBeDefined();
      expect(path.learningGoals[0].progress).toBe(0);
    });
  });

  describe('Adaptive Difficulty', () => {
    beforeEach(() => {
      // Create performance history
      for (let i = 0; i < 5; i++) {
        const moment = { ...mockLearningMoment, id: `moment_${i}`, importance: 5 + i };
        const entry = { 
          ...mockJournalEntry, 
          id: `entry_${i}`,
          rating: 3 + (i % 3)
        };
        
        analytics.trackLearningMoment(moment, entry);
      }
    });

    it('should adapt difficulty based on performance', () => {
      const initialSettings = analytics.currentDifficultySettings;
      const initialComplexity = initialSettings.scenarioComplexity;

      // Simulate high performance to trigger difficulty increase
      for (let i = 0; i < 3; i++) {
        const moment = { ...mockLearningMoment, id: `high_perf_${i}`, importance: 8 };
        const entry = { 
          ...mockJournalEntry, 
          id: `high_perf_entry_${i}`,
          rating: 5,
          insights: ['Great insight 1', 'Great insight 2'],
          connections: ['Connection 1', 'Connection 2']
        };
        
        analytics.trackLearningMoment(moment, entry);
      }

      const newSettings = analytics.currentDifficultySettings;
      // Difficulty should increase with good performance
      expect(newSettings.scenarioComplexity).toBeGreaterThanOrEqual(initialComplexity);
    });

    it('should reduce difficulty for struggling players', () => {
      const initialSettings = analytics.currentDifficultySettings;

      // Simulate poor performance
      for (let i = 0; i < 3; i++) {
        const moment = { ...mockLearningMoment, id: `low_perf_${i}`, importance: 3 };
        const entry = { 
          ...mockJournalEntry, 
          id: `low_perf_entry_${i}`,
          rating: 1,
          playerReflection: 'Short reflection',
          insights: [],
          connections: []
        };
        
        analytics.trackLearningMoment(moment, entry);
      }

      const newSettings = analytics.currentDifficultySettings;
      expect(newSettings.supportLevel).toBeGreaterThanOrEqual(initialSettings.supportLevel);
    });
  });

  describe('Personalized Recommendations', () => {
    beforeEach(() => {
      analytics.trackLearningMoment(mockLearningMoment, mockJournalEntry);
    });

    it('should generate personalized recommendations', () => {
      const recommendations = analytics.getPersonalizedRecommendations();

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBeDefined();
      expect(recommendations[0].title).toBeDefined();
      expect(recommendations[0].actions).toBeDefined();
    });

    it('should prioritize recommendations correctly', () => {
      const recommendations = analytics.getPersonalizedRecommendations();

      // Should be sorted by priority (highest first)
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].priority).toBeGreaterThanOrEqual(recommendations[i].priority);
      }
    });

    it('should recommend skill development for gaps', () => {
      const recommendations = analytics.getPersonalizedRecommendations();

      const skillDevRecs = recommendations.filter(rec => rec.type === 'skill_development');
      expect(skillDevRecs.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Reporting', () => {
    beforeEach(() => {
      // Create diverse learning history
      const concepts = [AIConcept.MULTI_AGENT_COORDINATION, AIConcept.ALIGNMENT_PROBLEM, AIConcept.AI_GOVERNANCE];
      
      concepts.forEach((concept, index) => {
        const moment = { 
          ...mockLearningMoment, 
          id: `moment_${index}`,
          aiConcept: concept,
          importance: 6 + index
        };
        const entry = { 
          ...mockJournalEntry, 
          id: `entry_${index}`,
          aiConcept: concept,
          rating: 3 + index
        };
        
        analytics.trackLearningMoment(moment, entry);
      });
    });

    it('should generate comprehensive progress report', () => {
      const report = analytics.getProgressReport();

      expect(report.overallProgress).toBeGreaterThanOrEqual(0);
      expect(report.conceptProgress).toBeDefined();
      expect(report.learningTrends).toBeDefined();
      expect(report.timeSpent).toBeGreaterThanOrEqual(0);
      expect(report.skillLevelDistribution).toBeDefined();
    });

    it('should track concept-specific progress', () => {
      const report = analytics.getProgressReport();

      expect(report.conceptProgress.size).toBeGreaterThan(0);
      expect(report.conceptProgress.has(AIConcept.MULTI_AGENT_COORDINATION)).toBe(true);
    });

    it('should calculate skill level distribution', () => {
      const report = analytics.getProgressReport();

      expect(report.skillLevelDistribution.size).toBeGreaterThan(0);
      
      let totalSkills = 0;
      report.skillLevelDistribution.forEach(count => {
        totalSkills += count;
      });
      
      expect(totalSkills).toBeGreaterThan(0);
    });

    it('should provide next step recommendations', () => {
      const report = analytics.getProgressReport();

      expect(report.recommendedNextSteps).toBeDefined();
      expect(report.recommendedNextSteps.length).toBeGreaterThan(0);
    });
  });

  describe('Progress Metrics', () => {
    it('should calculate learning velocity', () => {
      // Add learning events over time
      const baseTime = Date.now() - 3600000; // 1 hour ago
      
      for (let i = 0; i < 3; i++) {
        const moment = { 
          ...mockLearningMoment, 
          id: `velocity_${i}`,
          timestamp: baseTime + (i * 1200000), // 20 minutes apart
          aiConcept: Object.values(AIConcept)[i]
        };
        
        analytics.trackLearningMoment(moment, mockJournalEntry);
      }

      const metrics = analytics.currentProgressMetrics;
      expect(metrics.learningVelocity).toBeGreaterThan(0);
    });

    it('should track engagement levels', () => {
      analytics.trackLearningMoment(mockLearningMoment, mockJournalEntry);

      const metrics = analytics.currentProgressMetrics;
      expect(metrics.engagementLevel).toBeGreaterThanOrEqual(0);
      expect(metrics.engagementLevel).toBeLessThanOrEqual(1);
    });
  });
});