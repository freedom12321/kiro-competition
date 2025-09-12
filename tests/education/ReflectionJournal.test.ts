import { ReflectionJournal, PromptCategory } from '../../src/education/ReflectionJournal';
import { LearningMoment, LearningMomentType, AIConcept } from '../../src/education/LearningMomentDetector';

describe('ReflectionJournal', () => {
  let journal: ReflectionJournal;
  let mockLearningMoment: LearningMoment;

  beforeEach(() => {
    journal = new ReflectionJournal();
    
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
      realWorldExample: 'Autonomous vehicles coordinating at intersections',
      reflectionPrompts: [
        'What enabled these AI devices to work together?',
        'How might this apply to real-world AI systems?'
      ],
      importance: 7
    };
  });

  describe('Entry Creation', () => {
    it('should create journal entry from learning moment', () => {
      const reflection = 'I learned that AI cooperation requires shared communication protocols.';
      const entry = journal.createEntry(mockLearningMoment, reflection);

      expect(entry.id).toBeDefined();
      expect(entry.learningMomentId).toBe(mockLearningMoment.id);
      expect(entry.playerReflection).toBe(reflection);
      expect(entry.aiConcept).toBe(AIConcept.MULTI_AGENT_COORDINATION);
      expect(entry.timestamp).toBeDefined();
    });

    it('should extract tags from reflection text', () => {
      const reflection = 'This shows how AI alignment and cooperation work together for safety.';
      const entry = journal.createEntry(mockLearningMoment, reflection);

      expect(entry.tags).toContain('alignment');
      expect(entry.tags).toContain('cooperation');
      expect(entry.tags).toContain('safety');
    });

    it('should extract insights from reflection text', () => {
      const reflection = 'I learned that coordination is key. This demonstrates the importance of communication.';
      const entry = journal.createEntry(mockLearningMoment, reflection);

      expect(entry.insights).toHaveLength(2);
      expect(entry.insights[0]).toContain('learned that coordination');
      expect(entry.insights[1]).toContain('demonstrates the importance');
    });

    it('should extract connections from reflection text', () => {
      const reflection = 'This is similar to real-world traffic systems. In practice, this could apply to smart cities.';
      const entry = journal.createEntry(mockLearningMoment, reflection);

      expect(entry.connections).toHaveLength(2);
      expect(entry.connections[0]).toContain('similar to real-world');
      expect(entry.connections[1].toLowerCase()).toContain('in practice');
    });
  });

  describe('Reflection Management', () => {
    it('should add reflection to existing entry', () => {
      const initialEntry = journal.createEntry(mockLearningMoment, '');
      const reflection = 'Updated reflection with more insights.';
      
      const updatedEntry = journal.addReflection(mockLearningMoment.id, reflection);

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry!.playerReflection).toBe(reflection);
      expect(updatedEntry!.id).toBe(initialEntry.id);
    });

    it('should return null when adding reflection to non-existent moment', () => {
      const result = journal.addReflection('non_existent_moment', 'Some reflection');

      expect(result).toBeNull();
    });

    it('should rate journal entries', () => {
      const entry = journal.createEntry(mockLearningMoment, 'Great learning moment!');
      const success = journal.rateEntry(entry.id, 5);

      expect(success).toBe(true);
      expect(entry.rating).toBe(5);
    });

    it('should reject invalid ratings', () => {
      const entry = journal.createEntry(mockLearningMoment, 'Some reflection');
      const success = journal.rateEntry(entry.id, 10); // Invalid rating

      expect(success).toBe(false);
      expect(entry.rating).toBe(0);
    });
  });

  describe('Reflection Prompts', () => {
    it('should provide prompts for specific concepts', () => {
      const prompts = journal.getReflectionPrompts(AIConcept.ALIGNMENT_PROBLEM);

      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0].concept).toBe(AIConcept.ALIGNMENT_PROBLEM);
      expect(prompts[0].question).toBeDefined();
      expect(prompts[0].followUpQuestions).toBeDefined();
    });

    it('should filter prompts by category', () => {
      const understandingPrompts = journal.getReflectionPrompts(
        AIConcept.ALIGNMENT_PROBLEM, 
        PromptCategory.UNDERSTANDING
      );

      expect(understandingPrompts.every(p => p.category === PromptCategory.UNDERSTANDING)).toBe(true);
    });

    it('should provide personalized prompts based on player history', () => {
      // Create entries with limited concept coverage
      journal.createEntry(mockLearningMoment, 'Basic reflection');
      
      const personalizedPrompts = journal.getPersonalizedPrompts([]);

      expect(personalizedPrompts.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Retrieval', () => {
    beforeEach(() => {
      // Create test entries
      const entry1 = journal.createEntry(mockLearningMoment, 'AI cooperation is fascinating and important for safety');
      
      const conflictMoment = {
        ...mockLearningMoment,
        id: 'moment_2',
        type: LearningMomentType.CONFLICT_EMERGENCE,
        aiConcept: AIConcept.ALIGNMENT_PROBLEM
      };
      const entry2 = journal.createEntry(conflictMoment, 'Conflicts show alignment challenges in multi-agent systems');
    });

    it('should search entries by text content', () => {
      const results = journal.searchEntries('cooperation safety');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].playerReflection).toContain('cooperation');
    });

    it('should retrieve entries by concept', () => {
      const coordinationEntries = journal.getEntriesByConcept(AIConcept.MULTI_AGENT_COORDINATION);
      const alignmentEntries = journal.getEntriesByConcept(AIConcept.ALIGNMENT_PROBLEM);

      expect(coordinationEntries.length).toBe(1);
      expect(alignmentEntries.length).toBe(1);
      expect(coordinationEntries[0].aiConcept).toBe(AIConcept.MULTI_AGENT_COORDINATION);
    });

    it('should retrieve recent entries', () => {
      const recentEntries = journal.getRecentEntries(1); // Last day

      expect(recentEntries.length).toBe(2);
      expect(recentEntries[0].timestamp).toBeGreaterThan(recentEntries[1].timestamp);
    });
  });

  describe('Analytics and Insights', () => {
    beforeEach(() => {
      // Create diverse entries for analytics
      const entries = [
        { reflection: 'I learned that cooperation requires communication protocols', rating: 5, concept: AIConcept.MULTI_AGENT_COORDINATION },
        { reflection: 'This demonstrates how alignment problems emerge in practice', rating: 4, concept: AIConcept.ALIGNMENT_PROBLEM },
        { reflection: 'Governance rules are essential for preventing conflicts', rating: 5, concept: AIConcept.AI_GOVERNANCE }
      ];

      entries.forEach((data, index) => {
        const moment = {
          ...mockLearningMoment,
          id: `moment_analytics_${index}`,
          aiConcept: data.concept
        };
        const entry = journal.createEntry(moment, data.reflection);
        journal.rateEntry(entry.id, data.rating);
      });
    });

    it('should generate comprehensive learning report', () => {
      const report = journal.generateLearningReport();

      expect(report.totalReflections).toBe(3);
      expect(report.conceptsCovered).toBe(3);
      expect(report.averageRating).toBeCloseTo(4.67, 1);
      expect(report.topConcepts).toBeDefined();
      expect(report.keyInsights).toBeDefined();
      expect(report.recommendedFocus).toBeDefined();
    });

    it('should identify top insights', () => {
      const insights = journal.getTopInsights(5);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0]).toContain('learned');
    });

    it('should calculate learning progression over time', () => {
      const report = journal.generateLearningReport();

      expect(report.learningProgression).toBeDefined();
      expect(report.learningProgression.length).toBeGreaterThan(0);
    });

    it('should assess reflection quality', () => {
      const report = journal.generateLearningReport();

      expect(report.reflectionQuality.averageReflectionLength).toBeGreaterThan(0);
      expect(report.reflectionQuality.insightDepth).toBeGreaterThan(0);
      expect(report.reflectionQuality.conceptConnections).toBeGreaterThan(0);
    });
  });

  describe('Import/Export', () => {
    beforeEach(() => {
      journal.createEntry(mockLearningMoment, 'Test reflection for export');
    });

    it('should export journal data', () => {
      const exportData = journal.exportJournal();

      expect(exportData.version).toBe('1.0');
      expect(exportData.exportDate).toBeDefined();
      expect(exportData.entries).toHaveLength(1);
      expect(exportData.analytics).toBeDefined();
      expect(exportData.summary).toBeDefined();
    });

    it('should import journal data successfully', () => {
      const exportData = journal.exportJournal();
      const newJournal = new ReflectionJournal();
      
      const success = newJournal.importJournal(exportData);

      expect(success).toBe(true);
      expect(newJournal.getRecentEntries(1)).toHaveLength(1);
    });

    it('should handle import errors gracefully', () => {
      const invalidData = { invalid: 'data' } as any;
      const success = journal.importJournal(invalidData);

      expect(success).toBe(false);
    });
  });
});