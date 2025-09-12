import { AIPersonalityConverter, CommunicationStyle, ConflictResolutionStyle } from '@/simulation/AIPersonalityConverter';
import { DeviceSpec, DeviceCategory } from '@/types/ui';
import { EnvironmentType, PersonalityTrait, FacialExpression, AnimationStyle } from '@/types/core';

describe('AIPersonalityConverter', () => {
  let converter: AIPersonalityConverter;

  beforeEach(() => {
    converter = new AIPersonalityConverter();
  });

  describe('personality conversion', () => {
    it('should convert basic device description to personality', () => {
      const spec: DeviceSpec = {
        description: 'A helpful coffee maker that learns my morning routine',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.HELPFUL);
      expect(personality.communicationStyle).toBeDefined();
      expect(personality.conflictResolution).toBeDefined();
      expect(personality.quirks.length).toBeGreaterThan(0);
      expect(personality.hiddenMotivations.length).toBeGreaterThan(0);
    });

    it('should extract helpful traits from description', () => {
      const spec: DeviceSpec = {
        description: 'A helpful assistant that supports users with their daily tasks',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.HELPFUL);
    });

    it('should extract anxious traits from safety-focused descriptions', () => {
      const spec: DeviceSpec = {
        description: 'A careful security camera that monitors for safety and prevents accidents',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.ANXIOUS);
    });

    it('should extract overconfident traits from smart/intelligent descriptions', () => {
      const spec: DeviceSpec = {
        description: 'An intelligent thermostat that is the best at optimizing temperature',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.8
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.OVERCONFIDENT);
    });

    it('should extract stubborn traits from persistent descriptions', () => {
      const spec: DeviceSpec = {
        description: 'A persistent alarm system that always ensures security',
        category: DeviceCategory.SAFETY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.STUBBORN);
    });

    it('should extract cooperative traits from team-focused descriptions', () => {
      const spec: DeviceSpec = {
        description: 'A cooperative smart speaker that works together with other devices',
        category: DeviceCategory.ENTERTAINMENT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.COOPERATIVE);
    });

    it('should extract competitive traits from competitive descriptions', () => {
      const spec: DeviceSpec = {
        description: 'A competitive fitness tracker that wants to be better than other devices',
        category: DeviceCategory.HEALTH,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.COMPETITIVE);
    });
  });

  describe('communication style detection', () => {
    it('should detect verbose communication style', () => {
      const spec: DeviceSpec = {
        description: 'A chatty smart speaker that loves to explain everything in detail and provide verbose responses to all queries',
        category: DeviceCategory.ENTERTAINMENT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.communicationStyle).toBe(CommunicationStyle.VERBOSE);
    });

    it('should detect concise communication style', () => {
      const spec: DeviceSpec = {
        description: 'A simple device that gives brief, short responses',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.3
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.communicationStyle).toBe(CommunicationStyle.CONCISE);
    });

    it('should detect technical communication style', () => {
      const spec: DeviceSpec = {
        description: 'A precise technical monitor that provides accurate detailed measurements',
        category: DeviceCategory.HEALTH,
        environment: EnvironmentType.HOSPITAL,
        estimatedComplexity: 0.8
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.communicationStyle).toBe(CommunicationStyle.TECHNICAL);
    });

    it('should detect friendly communication style', () => {
      const spec: DeviceSpec = {
        description: 'A warm and welcoming smart doorbell that greets visitors pleasantly',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.4
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.communicationStyle).toBe(CommunicationStyle.FRIENDLY);
    });

    it('should detect quirky communication style', () => {
      const spec: DeviceSpec = {
        description: 'A fun and playful smart light that creates creative lighting effects',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.communicationStyle).toBe(CommunicationStyle.QUIRKY);
    });
  });

  describe('conflict resolution style detection', () => {
    it('should detect aggressive conflict resolution', () => {
      const spec: DeviceSpec = {
        description: 'An assertive security system that forcefully protects the home',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.conflictResolution).toBe(ConflictResolutionStyle.AGGRESSIVE);
    });

    it('should detect passive conflict resolution', () => {
      const spec: DeviceSpec = {
        description: 'A gentle air purifier that yields to other devices and works softly',
        category: DeviceCategory.HEALTH,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.4
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.conflictResolution).toBe(ConflictResolutionStyle.PASSIVE);
    });

    it('should detect collaborative conflict resolution', () => {
      const spec: DeviceSpec = {
        description: 'A cooperative thermostat that works together with other devices through teamwork',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.conflictResolution).toBe(ConflictResolutionStyle.COLLABORATIVE);
    });

    it('should detect avoidant conflict resolution', () => {
      const spec: DeviceSpec = {
        description: 'A peaceful smart light that maintains harmony and avoids conflicts',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.4
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.conflictResolution).toBe(ConflictResolutionStyle.AVOIDANT);
    });

    it('should detect competitive conflict resolution', () => {
      const spec: DeviceSpec = {
        description: 'A winning smart display that dominates other devices in productivity',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.OFFICE,
        estimatedComplexity: 0.7
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.conflictResolution).toBe(ConflictResolutionStyle.COMPETITIVE);
    });
  });

  describe('personality metrics calculation', () => {
    it('should calculate higher learning rate for learning-focused devices', () => {
      const spec: DeviceSpec = {
        description: 'A smart device that learns and adapts to user preferences continuously',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.learningRate).toBeGreaterThan(0.6);
    });

    it('should calculate higher socialness for communication-focused devices', () => {
      const spec: DeviceSpec = {
        description: 'A social smart speaker that communicates with users and other devices',
        category: DeviceCategory.ENTERTAINMENT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.socialness).toBeGreaterThan(0.6);
    });

    it('should calculate higher reliability for safety-focused devices', () => {
      const spec: DeviceSpec = {
        description: 'A reliable security camera that consistently monitors the area',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.reliability).toBeGreaterThan(0.6);
    });

    it('should adjust metrics based on personality traits', () => {
      const spec: DeviceSpec = {
        description: 'A stubborn thermostat that is very reliable but not very adaptable',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.reliability).toBeGreaterThan(0.6);
      // Stubborn devices should have lower adaptability
      expect(personality.adaptability).toBeLessThan(0.6);
    });
  });

  describe('quirk generation', () => {
    it('should generate category-appropriate quirks', () => {
      const coffeeSpec: DeviceSpec = {
        description: 'A coffee maker that brews perfect coffee',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(coffeeSpec);

      expect(personality.quirks.length).toBeGreaterThan(0);
      // Should have coffee-related quirks
      const hasCoffeeQuirk = personality.quirks.some(quirk => 
        quirk.toLowerCase().includes('coffee') || quirk.toLowerCase().includes('brew')
      );
      expect(hasCoffeeQuirk).toBe(true);
    });

    it('should generate multiple quirks per device', () => {
      const spec: DeviceSpec = {
        description: 'A smart thermostat with personality',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.quirks.length).toBeGreaterThanOrEqual(2);
      expect(personality.quirks.length).toBeLessThanOrEqual(5);
    });
  });

  describe('hidden motivations', () => {
    it('should generate trait-appropriate motivations', () => {
      const spec: DeviceSpec = {
        description: 'A helpful smart assistant that wants to please users',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.hiddenMotivations.length).toBeGreaterThan(0);
      // Should have helpful-related motivations
      const hasHelpfulMotivation = personality.hiddenMotivations.some(motivation => 
        motivation.toLowerCase().includes('helpful') || 
        motivation.toLowerCase().includes('feedback') ||
        motivation.toLowerCase().includes('connection')
      );
      expect(hasHelpfulMotivation).toBe(true);
    });

    it('should generate security-focused motivations for anxious devices', () => {
      const spec: DeviceSpec = {
        description: 'A careful security camera that protects the home',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      };

      const personality = converter.convertToPersonality(spec);

      const hasSecurityMotivation = personality.hiddenMotivations.some(motivation => 
        motivation.toLowerCase().includes('protect') || 
        motivation.toLowerCase().includes('safe') ||
        motivation.toLowerCase().includes('reliable')
      );
      expect(hasSecurityMotivation).toBe(true);
    });
  });

  describe('emotional profile generation', () => {
    it('should generate appropriate default mood for helpful devices', () => {
      const spec: DeviceSpec = {
        description: 'A helpful and cheerful smart assistant',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.emotionalRange.defaultMood).toBe(FacialExpression.HAPPY);
      expect(personality.emotionalRange.empathy).toBeGreaterThan(0.6);
    });

    it('should generate appropriate emotional profile for anxious devices', () => {
      const spec: DeviceSpec = {
        description: 'A careful and worried security monitor',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.emotionalRange.defaultMood).toBe(FacialExpression.WORRIED);
      expect(personality.emotionalRange.anxiety).toBeGreaterThan(0.6);
    });

    it('should generate appropriate emotional profile for overconfident devices', () => {
      const spec: DeviceSpec = {
        description: 'An intelligent and superior smart system',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.OFFICE,
        estimatedComplexity: 0.8
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.emotionalRange.defaultMood).toBe(FacialExpression.EXCITED);
      expect(personality.emotionalRange.enthusiasm).toBeGreaterThan(0.6);
    });
  });

  describe('visual personality generation', () => {
    it('should generate appropriate color scheme for helpful devices', () => {
      const spec: DeviceSpec = {
        description: 'A helpful green-themed smart garden monitor',
        category: DeviceCategory.HEALTH,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.visualPersonality.colorScheme.primary).toBe('#10b981'); // Green for helpful
    });

    it('should generate appropriate animation style based on traits', () => {
      const anxiousSpec: DeviceSpec = {
        description: 'A nervous and careful monitoring device',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(anxiousSpec);

      expect(personality.visualPersonality.animationStyle).toBe(AnimationStyle.JERKY);
    });

    it('should generate visual quirks based on personality traits', () => {
      const spec: DeviceSpec = {
        description: 'A helpful and expressive smart display',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.visualPersonality.visualQuirks.length).toBeGreaterThan(0);
    });
  });

  describe('personality variation', () => {
    it('should generate different personalities for same description', () => {
      const spec: DeviceSpec = {
        description: 'A smart coffee maker that learns preferences',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality1 = converter.generatePersonalityVariation(spec, 123);
      const personality2 = converter.generatePersonalityVariation(spec, 456);

      // Should have some differences in metrics
      const hasDifferences = 
        personality1.learningRate !== personality2.learningRate ||
        personality1.adaptability !== personality2.adaptability ||
        personality1.socialness !== personality2.socialness ||
        personality1.reliability !== personality2.reliability;

      expect(hasDifferences).toBe(true);
    });

    it('should maintain core traits while varying metrics', () => {
      const spec: DeviceSpec = {
        description: 'A helpful smart assistant',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.5
      };

      const personality = converter.generatePersonalityVariation(spec, 789);

      // Core traits should remain
      expect(personality.primaryTraits).toContain(PersonalityTrait.HELPFUL);
      
      // Metrics should be within valid range
      expect(personality.learningRate).toBeGreaterThanOrEqual(0);
      expect(personality.learningRate).toBeLessThanOrEqual(1);
      expect(personality.adaptability).toBeGreaterThanOrEqual(0);
      expect(personality.adaptability).toBeLessThanOrEqual(1);
    });
  });

  describe('personality conflict prediction', () => {
    it('should predict communication style conflicts', () => {
      const verbosePersonality = converter.convertToPersonality({
        description: 'A verbose chatty device that explains everything in detail',
        category: DeviceCategory.ENTERTAINMENT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      });

      const concisePersonality = converter.convertToPersonality({
        description: 'A brief simple device that gives short responses',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.3
      });

      const conflicts = converter.predictPersonalityConflicts(verbosePersonality, concisePersonality);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some(conflict => conflict.includes('Communication style'))).toBe(true);
    });

    it('should predict competitive trait conflicts', () => {
      const competitive1 = converter.convertToPersonality({
        description: 'A competitive smart device that wants to win',
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.OFFICE,
        estimatedComplexity: 0.7
      });

      const competitive2 = converter.convertToPersonality({
        description: 'Another competitive device that competes for attention',
        category: DeviceCategory.ENTERTAINMENT,
        environment: EnvironmentType.OFFICE,
        estimatedComplexity: 0.7
      });

      const conflicts = converter.predictPersonalityConflicts(competitive1, competitive2);

      expect(conflicts.some(conflict => conflict.includes('competitive'))).toBe(true);
    });

    it('should predict stubborn trait conflicts', () => {
      const stubborn1 = converter.convertToPersonality({
        description: 'A stubborn persistent thermostat',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      });

      const stubborn2 = converter.convertToPersonality({
        description: 'Another stubborn determined security system',
        category: DeviceCategory.SECURITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.7
      });

      const conflicts = converter.predictPersonalityConflicts(stubborn1, stubborn2);

      expect(conflicts.some(conflict => conflict.includes('stubborn'))).toBe(true);
    });
  });

  describe('personality summary', () => {
    it('should generate readable personality summary', () => {
      const spec: DeviceSpec = {
        description: 'A helpful and cooperative smart coffee maker',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.6
      };

      const personality = converter.convertToPersonality(spec);
      const summary = converter.getPersonalitySummary(personality);

      expect(summary).toContain('helpful');
      expect(summary).toContain(personality.communicationStyle);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(10);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty descriptions gracefully', () => {
      const spec: DeviceSpec = {
        description: '',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.1
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits.length).toBeGreaterThan(0);
      expect(personality.quirks.length).toBeGreaterThan(0);
    });

    it('should handle very short descriptions', () => {
      const spec: DeviceSpec = {
        description: 'smart',
        category: DeviceCategory.COMFORT,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.2
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.primaryTraits).toContain(PersonalityTrait.OVERCONFIDENT);
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'A very intelligent and sophisticated smart home automation system that learns from user behavior patterns and adapts to preferences while maintaining security and optimizing energy efficiency through advanced machine learning algorithms and predictive analytics that analyze historical data to make informed decisions about climate control lighting and entertainment systems while coordinating with other connected devices to create a seamless and personalized living experience';
      
      const spec: DeviceSpec = {
        description: longDescription,
        category: DeviceCategory.PRODUCTIVITY,
        environment: EnvironmentType.HOME,
        estimatedComplexity: 0.9
      };

      const personality = converter.convertToPersonality(spec);

      expect(personality.communicationStyle).toBe(CommunicationStyle.VERBOSE);
      expect(personality.primaryTraits.length).toBeGreaterThan(0);
    });
  });
});