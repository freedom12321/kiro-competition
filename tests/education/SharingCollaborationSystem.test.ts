import { 
  SharingCollaborationSystem, 
  ConfigurationType, 
  DifficultyLevel, 
  CollaboratorRole,
  Permission,
  MessageType,
  ChangeType
} from '../../src/education/SharingCollaborationSystem';
import { AIConcept } from '../../src/education/LearningMomentDetector';

describe('SharingCollaborationSystem', () => {
  let sharingSystem: SharingCollaborationSystem;
  let mockConfiguration: any;

  beforeEach(() => {
    sharingSystem = new SharingCollaborationSystem();
    
    mockConfiguration = {
      creatorId: 'user1',
      creatorName: 'Alice',
      title: 'AI Cooperation Scenario',
      description: 'A scenario demonstrating multi-agent coordination',
      type: ConfigurationType.SCENARIO,
      data: {
        scenarioParameters: {
          id: 'scenario1',
          name: 'Cooperation Test',
          description: 'Test scenario',
          objectives: ['Achieve coordination'],
          initialState: {},
          successCriteria: []
        }
      },
      tags: ['cooperation', 'multi-agent', 'beginner'],
      difficulty: DifficultyLevel.BEGINNER,
      targetConcepts: [AIConcept.MULTI_AGENT_COORDINATION],
      version: '1.0',
      isPublic: true
    };
  });

  describe('Configuration Sharing', () => {
    it('should share a configuration successfully', () => {
      const configId = sharingSystem.shareConfiguration(mockConfiguration);

      expect(configId).toBeDefined();
      expect(configId).toContain('config_');

      const sharedConfig = sharingSystem.getConfiguration(configId);
      expect(sharedConfig).toBeDefined();
      expect(sharedConfig!.title).toBe(mockConfiguration.title);
      expect(sharedConfig!.downloadCount).toBe(0);
      expect(sharedConfig!.collaborators).toHaveLength(1);
      expect(sharedConfig!.collaborators[0].role).toBe(CollaboratorRole.OWNER);
    });

    it('should update configuration with proper permissions', () => {
      const configId = sharingSystem.shareConfiguration(mockConfiguration);
      
      const success = sharingSystem.updateConfiguration(
        configId, 
        { title: 'Updated Title' }, 
        'user1'
      );

      expect(success).toBe(true);
      
      const updatedConfig = sharingSystem.getConfiguration(configId);
      expect(updatedConfig!.title).toBe('Updated Title');
    });

    it('should reject updates without proper permissions', () => {
      const configId = sharingSystem.shareConfiguration(mockConfiguration);
      
      const success = sharingSystem.updateConfiguration(
        configId, 
        { title: 'Unauthorized Update' }, 
        'user2'
      );

      expect(success).toBe(false);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.title).toBe(mockConfiguration.title);
    });

    it('should download configuration and increment count', () => {
      const configId = sharingSystem.shareConfiguration(mockConfiguration);
      
      const downloaded = sharingSystem.downloadConfiguration(configId, 'user2');

      expect(downloaded).toBeDefined();
      expect(downloaded!.title).toBe(mockConfiguration.title);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.downloadCount).toBe(1);
    });

    it('should reject download of private configurations', () => {
      const privateConfig = { ...mockConfiguration, isPublic: false };
      const configId = sharingSystem.shareConfiguration(privateConfig);
      
      const downloaded = sharingSystem.downloadConfiguration(configId, 'user2');

      expect(downloaded).toBeNull();
    });
  });

  describe('Search and Discovery', () => {
    beforeEach(() => {
      // Create multiple configurations for testing
      const configs = [
        { ...mockConfiguration, title: 'Beginner AI Scenario', difficulty: DifficultyLevel.BEGINNER },
        { ...mockConfiguration, title: 'Advanced AI Challenge', difficulty: DifficultyLevel.ADVANCED, creatorId: 'user2', creatorName: 'Bob' },
        { ...mockConfiguration, title: 'Governance Rules Set', type: ConfigurationType.GOVERNANCE_RULES, tags: ['governance', 'rules'] }
      ];

      configs.forEach(config => sharingSystem.shareConfiguration(config));
    });

    it('should search configurations by text query', () => {
      const results = sharingSystem.searchConfigurations('Advanced');

      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Advanced');
    });

    it('should filter configurations by type', () => {
      const results = sharingSystem.searchConfigurations('', {
        type: ConfigurationType.GOVERNANCE_RULES
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe(ConfigurationType.GOVERNANCE_RULES);
    });

    it('should filter configurations by difficulty', () => {
      const results = sharingSystem.searchConfigurations('', {
        difficulty: DifficultyLevel.BEGINNER
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every(r => r.difficulty === DifficultyLevel.BEGINNER)).toBe(true);
    });

    it('should filter configurations by concepts', () => {
      const results = sharingSystem.searchConfigurations('', {
        concepts: [AIConcept.MULTI_AGENT_COORDINATION]
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.targetConcepts.includes(AIConcept.MULTI_AGENT_COORDINATION))).toBe(true);
    });

    it('should filter configurations by tags', () => {
      const results = sharingSystem.searchConfigurations('', {
        tags: ['governance']
      });

      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('governance');
    });
  });

  describe('Rating and Review System', () => {
    let configId: string;

    beforeEach(() => {
      configId = sharingSystem.shareConfiguration(mockConfiguration);
    });

    it('should add rating to configuration', () => {
      const success = sharingSystem.rateConfiguration(configId, 'user2', 'Bob', 5, 'Excellent scenario!');

      expect(success).toBe(true);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.ratings).toHaveLength(1);
      expect(config!.ratings[0].rating).toBe(5);
      expect(config!.ratings[0].review).toBe('Excellent scenario!');
    });

    it('should update existing rating from same user', () => {
      sharingSystem.rateConfiguration(configId, 'user2', 'Bob', 3, 'Good');
      sharingSystem.rateConfiguration(configId, 'user2', 'Bob', 5, 'Actually excellent!');

      const config = sharingSystem.getConfiguration(configId);
      expect(config!.ratings).toHaveLength(1);
      expect(config!.ratings[0].rating).toBe(5);
      expect(config!.ratings[0].review).toBe('Actually excellent!');
    });

    it('should reject invalid ratings', () => {
      const success = sharingSystem.rateConfiguration(configId, 'user2', 'Bob', 6);

      expect(success).toBe(false);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.ratings).toHaveLength(0);
    });

    it('should mark reviews as helpful', () => {
      sharingSystem.rateConfiguration(configId, 'user2', 'Bob', 5, 'Great!');
      
      const success = sharingSystem.markReviewHelpful(configId, 'user2', 'user3');

      expect(success).toBe(true);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.ratings[0].helpful).toBe(1);
    });
  });

  describe('Comment System', () => {
    let configId: string;

    beforeEach(() => {
      configId = sharingSystem.shareConfiguration(mockConfiguration);
    });

    it('should add comment to configuration', () => {
      const commentId = sharingSystem.addComment(configId, 'user2', 'Bob', 'This is a great scenario!');

      expect(commentId).toBeDefined();
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.comments).toHaveLength(1);
      expect(config!.comments[0].content).toBe('This is a great scenario!');
    });

    it('should add reply to existing comment', () => {
      const parentCommentId = sharingSystem.addComment(configId, 'user2', 'Bob', 'Great scenario!');
      const replyId = sharingSystem.addComment(configId, 'user3', 'Charlie', 'I agree!', parentCommentId!);

      expect(replyId).toBeDefined();
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.comments).toHaveLength(1);
      expect(config!.comments[0].replies).toHaveLength(1);
      expect(config!.comments[0].replies[0].content).toBe('I agree!');
    });

    it('should like comments', () => {
      const commentId = sharingSystem.addComment(configId, 'user2', 'Bob', 'Great!');
      
      const success = sharingSystem.likeComment(configId, commentId!, 'user3');

      expect(success).toBe(true);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.comments[0].likes).toBe(1);
    });
  });

  describe('Collaboration System', () => {
    let configId: string;

    beforeEach(() => {
      configId = sharingSystem.shareConfiguration(mockConfiguration);
    });

    it('should start collaboration session', () => {
      const sessionId = sharingSystem.startCollaborationSession(configId, 'user1', 'Alice');

      expect(sessionId).toBeDefined();
      
      const session = sharingSystem.getCollaborationSession(sessionId!);
      expect(session).toBeDefined();
      expect(session!.participants).toHaveLength(1);
      expect(session!.isActive).toBe(true);
    });

    it('should allow users to join collaboration session', () => {
      // First add user2 as collaborator
      sharingSystem.addCollaborator(configId, 'user1', 'user2', 'Bob', CollaboratorRole.EDITOR);
      
      const sessionId = sharingSystem.startCollaborationSession(configId, 'user1', 'Alice');
      const success = sharingSystem.joinCollaborationSession(sessionId!, 'user2', 'Bob');

      expect(success).toBe(true);
      
      const session = sharingSystem.getCollaborationSession(sessionId!);
      expect(session!.participants).toHaveLength(2);
    });

    it('should record changes during collaboration', () => {
      const sessionId = sharingSystem.startCollaborationSession(configId, 'user1', 'Alice');
      
      const success = sharingSystem.recordChange(sessionId!, 'user1', {
        type: ChangeType.ADD_DEVICE,
        target: 'device1',
        oldValue: null,
        newValue: { name: 'Smart Light' },
        description: 'Added smart light device'
      });

      expect(success).toBe(true);
      
      const session = sharingSystem.getCollaborationSession(sessionId!);
      expect(session!.changes).toHaveLength(1);
      expect(session!.changes[0].type).toBe(ChangeType.ADD_DEVICE);
    });

    it('should handle chat messages in collaboration', () => {
      const sessionId = sharingSystem.startCollaborationSession(configId, 'user1', 'Alice');
      
      const success = sharingSystem.sendChatMessage(sessionId!, 'user1', 'Alice', 'Let\'s work on this together!');

      expect(success).toBe(true);
      
      const session = sharingSystem.getCollaborationSession(sessionId!);
      expect(session!.chatMessages).toHaveLength(1);
      expect(session!.chatMessages[0].content).toBe('Let\'s work on this together!');
    });
  });

  describe('Collaborator Management', () => {
    let configId: string;

    beforeEach(() => {
      configId = sharingSystem.shareConfiguration(mockConfiguration);
    });

    it('should add collaborator with proper permissions', () => {
      const success = sharingSystem.addCollaborator(configId, 'user1', 'user2', 'Bob', CollaboratorRole.EDITOR);

      expect(success).toBe(true);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.collaborators).toHaveLength(2);
      
      const collaborator = config!.collaborators.find(c => c.userId === 'user2');
      expect(collaborator).toBeDefined();
      expect(collaborator!.role).toBe(CollaboratorRole.EDITOR);
      expect(collaborator!.permissions).toContain(Permission.READ);
      expect(collaborator!.permissions).toContain(Permission.WRITE);
    });

    it('should remove collaborator', () => {
      sharingSystem.addCollaborator(configId, 'user1', 'user2', 'Bob', CollaboratorRole.EDITOR);
      
      const success = sharingSystem.removeCollaborator(configId, 'user1', 'user2');

      expect(success).toBe(true);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.collaborators).toHaveLength(1);
      expect(config!.collaborators.every(c => c.userId !== 'user2')).toBe(true);
    });

    it('should reject collaborator management without permissions', () => {
      const success = sharingSystem.addCollaborator(configId, 'user2', 'user3', 'Charlie', CollaboratorRole.EDITOR);

      expect(success).toBe(false);
      
      const config = sharingSystem.getConfiguration(configId);
      expect(config!.collaborators).toHaveLength(1);
    });
  });

  describe('Analytics and Insights', () => {
    beforeEach(() => {
      // Create multiple configurations with ratings and downloads
      const configs = [
        { ...mockConfiguration, title: 'Config 1' },
        { ...mockConfiguration, title: 'Config 2', creatorId: 'user2', creatorName: 'Bob' },
        { ...mockConfiguration, title: 'Config 3', tags: ['popular', 'trending'] }
      ];

      configs.forEach(config => {
        const configId = sharingSystem.shareConfiguration(config);
        
        // Add some ratings and downloads
        sharingSystem.rateConfiguration(configId, 'user3', 'Charlie', 4);
        sharingSystem.rateConfiguration(configId, 'user4', 'David', 5);
        sharingSystem.downloadConfiguration(configId, 'user5');
        sharingSystem.downloadConfiguration(configId, 'user6');
      });
    });

    it('should generate sharing analytics', () => {
      const analytics = sharingSystem.getSharingAnalytics();

      expect(analytics.totalShares).toBeGreaterThan(0);
      expect(analytics.totalDownloads).toBeGreaterThan(0);
      expect(analytics.averageRating).toBeGreaterThan(0);
      expect(analytics.popularTags).toBeDefined();
      expect(analytics.topCreators).toBeDefined();
      expect(analytics.collaborationStats).toBeDefined();
    });

    it('should provide personalized recommendations', () => {
      const recommendations = sharingSystem.getPersonalizedRecommendations(
        'user7', 
        [AIConcept.MULTI_AGENT_COORDINATION]
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every(r => r.targetConcepts.includes(AIConcept.MULTI_AGENT_COORDINATION))).toBe(true);
    });
  });

  describe('Subscription System', () => {
    let configId: string;

    beforeEach(() => {
      configId = sharingSystem.shareConfiguration(mockConfiguration);
    });

    it('should subscribe to configuration', () => {
      const success = sharingSystem.subscribeToConfiguration('user2', configId);

      expect(success).toBe(true);
      
      const subscriptions = sharingSystem.getUserSubscriptions('user2');
      expect(subscriptions).toContain(configId);
    });

    it('should unsubscribe from configuration', () => {
      sharingSystem.subscribeToConfiguration('user2', configId);
      
      const success = sharingSystem.unsubscribeFromConfiguration('user2', configId);

      expect(success).toBe(true);
      
      const subscriptions = sharingSystem.getUserSubscriptions('user2');
      expect(subscriptions).not.toContain(configId);
    });

    it('should not duplicate subscriptions', () => {
      sharingSystem.subscribeToConfiguration('user2', configId);
      sharingSystem.subscribeToConfiguration('user2', configId);

      const subscriptions = sharingSystem.getUserSubscriptions('user2');
      expect(subscriptions.filter(id => id === configId)).toHaveLength(1);
    });
  });

  describe('User Configuration Management', () => {
    it('should get user configurations', () => {
      const configId1 = sharingSystem.shareConfiguration(mockConfiguration);
      const configId2 = sharingSystem.shareConfiguration({ 
        ...mockConfiguration, 
        title: 'Another Config',
        creatorId: 'user2',
        creatorName: 'Bob'
      });

      // Add user1 as collaborator to config2
      sharingSystem.addCollaborator(configId2, 'user2', 'user1', 'Alice', CollaboratorRole.EDITOR);

      const userConfigs = sharingSystem.getUserConfigurations('user1');

      expect(userConfigs).toHaveLength(2);
      expect(userConfigs.some(c => c.id === configId1)).toBe(true);
      expect(userConfigs.some(c => c.id === configId2)).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should emit events for configuration sharing', (done) => {
      sharingSystem.on('configurationShared', (data) => {
        expect(data.title).toBe(mockConfiguration.title);
        done();
      });

      sharingSystem.shareConfiguration(mockConfiguration);
    });

    it('should emit events for collaboration', (done) => {
      const configId = sharingSystem.shareConfiguration(mockConfiguration);
      
      sharingSystem.on('collaborationSessionStarted', (data) => {
        expect(data.configurationId).toBe(configId);
        done();
      });

      sharingSystem.startCollaborationSession(configId, 'user1', 'Alice');
    });
  });
});