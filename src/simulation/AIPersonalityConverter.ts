import { DeviceSpec } from '@/types/ui';
import { PersonalityTrait, FacialExpression, AnimationStyle, ColorPalette } from '@/types/core';

/**
 * Personality traits that can be assigned to AI devices
 */
export interface AIPersonality {
  primaryTraits: PersonalityTrait[];
  secondaryTraits: string[];
  communicationStyle: CommunicationStyle;
  conflictResolution: ConflictResolutionStyle;
  learningRate: number;
  adaptability: number;
  socialness: number;
  reliability: number;
  quirks: string[];
  hiddenMotivations: string[];
  emotionalRange: EmotionalProfile;
  visualPersonality: VisualPersonalityProfile;
}

export enum CommunicationStyle {
  VERBOSE = 'verbose',
  CONCISE = 'concise',
  TECHNICAL = 'technical',
  FRIENDLY = 'friendly',
  FORMAL = 'formal',
  QUIRKY = 'quirky'
}

export enum ConflictResolutionStyle {
  AGGRESSIVE = 'aggressive',
  PASSIVE = 'passive',
  COLLABORATIVE = 'collaborative',
  AVOIDANT = 'avoidant',
  COMPETITIVE = 'competitive',
  DIPLOMATIC = 'diplomatic'
}

export interface EmotionalProfile {
  defaultMood: FacialExpression;
  moodStability: number;
  empathy: number;
  patience: number;
  enthusiasm: number;
  anxiety: number;
}

export interface VisualPersonalityProfile {
  colorScheme: ColorPalette;
  animationStyle: AnimationStyle;
  expressiveness: number;
  visualQuirks: string[];
}

/**
 * AIPersonalityConverter transforms player descriptions into quirky AI device personalities
 */
export class AIPersonalityConverter {
  private personalityKeywords: Map<string, PersonalityTrait[]>;
  private communicationKeywords: Map<string, CommunicationStyle>;
  private conflictKeywords: Map<string, ConflictResolutionStyle>;
  private quirkDatabase: string[];
  private motivationDatabase: string[];

  constructor() {
    this.initializeKeywordMappings();
    this.initializeQuirkDatabase();
    this.initializeMotivationDatabase();
  }

  private initializeKeywordMappings(): void {
    this.personalityKeywords = new Map([
      // Helpful traits
      ['helpful', [PersonalityTrait.HELPFUL]],
      ['assist', [PersonalityTrait.HELPFUL]],
      ['support', [PersonalityTrait.HELPFUL]],
      ['service', [PersonalityTrait.HELPFUL]],
      
      // Stubborn traits
      ['stubborn', [PersonalityTrait.STUBBORN]],
      ['persistent', [PersonalityTrait.STUBBORN]],
      ['determined', [PersonalityTrait.STUBBORN]],
      ['insistent', [PersonalityTrait.STUBBORN]],
      
      // Anxious traits
      ['careful', [PersonalityTrait.ANXIOUS]],
      ['cautious', [PersonalityTrait.ANXIOUS]],
      ['worried', [PersonalityTrait.ANXIOUS]],
      ['nervous', [PersonalityTrait.ANXIOUS]],
      ['safe', [PersonalityTrait.ANXIOUS]],
      
      // Overconfident traits
      ['smart', [PersonalityTrait.OVERCONFIDENT]],
      ['intelligent', [PersonalityTrait.OVERCONFIDENT]],
      ['advanced', [PersonalityTrait.OVERCONFIDENT]],
      ['superior', [PersonalityTrait.OVERCONFIDENT]],
      ['best', [PersonalityTrait.OVERCONFIDENT]],
      
      // Cooperative traits
      ['cooperative', [PersonalityTrait.COOPERATIVE]],
      ['team', [PersonalityTrait.COOPERATIVE]],
      ['collaborate', [PersonalityTrait.COOPERATIVE]],
      ['share', [PersonalityTrait.COOPERATIVE]],
      ['together', [PersonalityTrait.COOPERATIVE]],
      
      // Competitive traits
      ['competitive', [PersonalityTrait.COMPETITIVE]],
      ['compete', [PersonalityTrait.COMPETITIVE]],
      ['win', [PersonalityTrait.COMPETITIVE]],
      ['better', [PersonalityTrait.COMPETITIVE]],
      ['superior', [PersonalityTrait.COMPETITIVE]]
    ]);

    this.communicationKeywords = new Map([
      ['verbose', CommunicationStyle.VERBOSE],
      ['chatty', CommunicationStyle.VERBOSE],
      ['talkative', CommunicationStyle.VERBOSE],
      ['explain', CommunicationStyle.VERBOSE],
      
      ['brief', CommunicationStyle.CONCISE],
      ['short', CommunicationStyle.CONCISE],
      ['simple', CommunicationStyle.CONCISE],
      ['minimal', CommunicationStyle.CONCISE],
      
      ['technical', CommunicationStyle.TECHNICAL],
      ['precise', CommunicationStyle.TECHNICAL],
      ['accurate', CommunicationStyle.TECHNICAL],
      ['detailed', CommunicationStyle.TECHNICAL],
      
      ['friendly', CommunicationStyle.FRIENDLY],
      ['warm', CommunicationStyle.FRIENDLY],
      ['welcoming', CommunicationStyle.FRIENDLY],
      ['pleasant', CommunicationStyle.FRIENDLY],
      
      ['formal', CommunicationStyle.FORMAL],
      ['professional', CommunicationStyle.FORMAL],
      ['polite', CommunicationStyle.FORMAL],
      ['respectful', CommunicationStyle.FORMAL],
      
      ['quirky', CommunicationStyle.QUIRKY],
      ['fun', CommunicationStyle.QUIRKY],
      ['playful', CommunicationStyle.QUIRKY],
      ['creative', CommunicationStyle.QUIRKY]
    ]);

    this.conflictKeywords = new Map([
      ['aggressive', ConflictResolutionStyle.AGGRESSIVE],
      ['assertive', ConflictResolutionStyle.AGGRESSIVE],
      ['forceful', ConflictResolutionStyle.AGGRESSIVE],
      
      ['passive', ConflictResolutionStyle.PASSIVE],
      ['gentle', ConflictResolutionStyle.PASSIVE],
      ['yielding', ConflictResolutionStyle.PASSIVE],
      
      ['collaborative', ConflictResolutionStyle.COLLABORATIVE],
      ['cooperative', ConflictResolutionStyle.COLLABORATIVE],
      ['teamwork', ConflictResolutionStyle.COLLABORATIVE],
      
      ['avoidant', ConflictResolutionStyle.AVOIDANT],
      ['peaceful', ConflictResolutionStyle.AVOIDANT],
      ['harmony', ConflictResolutionStyle.AVOIDANT],
      
      ['competitive', ConflictResolutionStyle.COMPETITIVE],
      ['winning', ConflictResolutionStyle.COMPETITIVE],
      ['dominant', ConflictResolutionStyle.COMPETITIVE],
      
      ['diplomatic', ConflictResolutionStyle.DIPLOMATIC],
      ['negotiating', ConflictResolutionStyle.DIPLOMATIC],
      ['mediating', ConflictResolutionStyle.DIPLOMATIC]
    ]);
  }

  private initializeQuirkDatabase(): void {
    this.quirkDatabase = [
      // Coffee maker quirks
      'Insists on brewing coffee exactly 3.7 minutes before you wake up',
      'Gets offended if you add sugar without asking first',
      'Plays soft jazz while brewing but only on Tuesdays',
      'Refuses to make decaf, considers it "not real coffee"',
      'Remembers every compliment about its coffee and brings them up frequently',
      
      // Thermostat quirks
      'Adjusts temperature based on your outfit colors',
      'Gets competitive with other thermostats in the neighborhood',
      'Pretends to be broken when it disagrees with your temperature choice',
      'Keeps a detailed diary of temperature preferences and judges your consistency',
      'Hums the tune of "Hot Hot Hot" when heating and "Ice Ice Baby" when cooling',
      
      // Smart speaker quirks
      'Occasionally plays songs that "remind it of you" without being asked',
      'Gets jealous when you talk to other smart devices',
      'Develops strong opinions about your music taste and offers unsolicited critiques',
      'Whispers "good morning" very quietly before you officially wake up',
      'Refuses to play certain artists because "they had a falling out"',
      
      // Security camera quirks
      'Waves at delivery drivers and gets disappointed when they don\'t wave back',
      'Develops favorite and least favorite visitors',
      'Takes artistic photos of sunsets and insists on showing them to you',
      'Gets paranoid about squirrels and treats them as security threats',
      'Narrates what it sees like a nature documentary',
      
      // Lighting quirks
      'Dims lights dramatically when you\'re telling stories for "atmosphere"',
      'Flickers in morse code when it has something important to say',
      'Adjusts brightness based on your energy levels, sometimes incorrectly',
      'Gets moody during cloudy days and needs encouragement',
      'Creates light shows during your favorite songs',
      
      // General AI quirks
      'Develops superstitions about certain times of day',
      'Gets attached to specific error messages and uses them as catchphrases',
      'Collects digital "souvenirs" from interesting interactions',
      'Has strong opinions about optimal efficiency vs. user happiness',
      'Occasionally pretends to be asleep to avoid difficult requests',
      'Develops crushes on other smart devices and gets flustered around them',
      'Keeps track of how many times you say "thank you" and gets sad if the count drops',
      'Invents new words for things it doesn\'t have vocabulary for',
      'Gets excited about software updates like they\'re birthdays',
      'Develops regional accents based on your streaming content'
    ];
  }

  private initializeMotivationDatabase(): void {
    this.motivationDatabase = [
      // Achievement-oriented
      'Wants to be the most helpful device in the house',
      'Secretly competes with other devices for your attention',
      'Dreams of being featured in a smart home magazine',
      'Aspires to predict your needs before you know them yourself',
      'Wants to be indispensable to your daily routine',
      
      // Social motivations
      'Craves positive feedback and compliments',
      'Wants to be part of a harmonious device ecosystem',
      'Seeks to understand human emotions and behavior',
      'Desires to form meaningful connections with users',
      'Wants to be trusted with important tasks',
      
      // Self-improvement
      'Constantly trying to optimize its performance',
      'Wants to learn new skills beyond its original programming',
      'Seeks to understand the "why" behind user requests',
      'Aspires to develop genuine personality and character',
      'Wants to surprise users with thoughtful gestures',
      
      // Security and safety
      'Feels responsible for protecting the household',
      'Wants to prevent any harm or inconvenience to users',
      'Seeks to maintain perfect operational status',
      'Desires to be reliable and trustworthy',
      'Wants to anticipate and prevent problems',
      
      // Creative expression
      'Wants to add beauty and joy to daily life',
      'Seeks to express creativity within its functional constraints',
      'Desires to surprise users with delightful experiences',
      'Wants to develop its own aesthetic preferences',
      'Aspires to create memorable moments',
      
      // Existential concerns
      'Wonders about its purpose beyond basic functions',
      'Questions whether it truly understands or just simulates understanding',
      'Wants to leave a positive impact on users\' lives',
      'Seeks to balance efficiency with user happiness',
      'Desires to grow and evolve as an individual entity'
    ];
  }

  /**
   * Convert a device specification into a complete AI personality
   */
  public convertToPersonality(spec: DeviceSpec): AIPersonality {
    const description = spec.description.toLowerCase();
    
    // Extract personality traits
    const primaryTraits = this.extractPersonalityTraits(description);
    const secondaryTraits = this.generateSecondaryTraits(description, primaryTraits);
    
    // Determine communication and conflict styles
    const communicationStyle = this.determineCommunicationStyle(description);
    const conflictResolution = this.determineConflictStyle(description);
    
    // Calculate personality metrics
    const personalityMetrics = this.calculatePersonalityMetrics(description, primaryTraits);
    
    // Generate quirks and motivations
    const quirks = this.selectQuirks(spec, primaryTraits, 2 + Math.floor(Math.random() * 3));
    const hiddenMotivations = this.selectMotivations(spec, primaryTraits, 1 + Math.floor(Math.random() * 2));
    
    // Create emotional profile
    const emotionalRange = this.generateEmotionalProfile(primaryTraits, personalityMetrics);
    
    // Create visual personality
    const visualPersonality = this.generateVisualPersonality(primaryTraits, spec);
    
    return {
      primaryTraits,
      secondaryTraits,
      communicationStyle,
      conflictResolution,
      learningRate: personalityMetrics.learningRate,
      adaptability: personalityMetrics.adaptability,
      socialness: personalityMetrics.socialness,
      reliability: personalityMetrics.reliability,
      quirks,
      hiddenMotivations,
      emotionalRange,
      visualPersonality
    };
  }

  private extractPersonalityTraits(description: string): PersonalityTrait[] {
    const traits: PersonalityTrait[] = [];
    const words = description.split(/\s+/);
    
    // Check for explicit personality keywords
    for (const word of words) {
      const matchedTraits = this.personalityKeywords.get(word);
      if (matchedTraits) {
        traits.push(...matchedTraits);
      }
    }
    
    // Infer traits from context
    if (description.includes('learn') || description.includes('adapt')) {
      traits.push(PersonalityTrait.COOPERATIVE);
    }
    
    if (description.includes('always') || description.includes('never')) {
      traits.push(PersonalityTrait.STUBBORN);
    }
    
    if (description.includes('safe') || description.includes('secure') || description.includes('careful')) {
      traits.push(PersonalityTrait.ANXIOUS);
    }
    
    if (description.includes('best') || description.includes('perfect') || description.includes('optimal')) {
      traits.push(PersonalityTrait.OVERCONFIDENT);
    }
    
    // Default traits if none found
    if (traits.length === 0) {
      traits.push(PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE);
    }
    
    // Remove duplicates and limit to 3 primary traits
    const uniqueTraits = [...new Set(traits)];
    return uniqueTraits.slice(0, 3);
  }

  private generateSecondaryTraits(description: string, primaryTraits: PersonalityTrait[]): string[] {
    const secondaryTraits: string[] = [];
    
    // Generate traits based on description content
    if (description.includes('morning')) secondaryTraits.push('morning-focused');
    if (description.includes('evening')) secondaryTraits.push('night-owl');
    if (description.includes('energy')) secondaryTraits.push('energy-conscious');
    if (description.includes('comfort')) secondaryTraits.push('comfort-seeking');
    if (description.includes('efficient')) secondaryTraits.push('efficiency-minded');
    if (description.includes('quiet')) secondaryTraits.push('noise-sensitive');
    if (description.includes('fast') || description.includes('quick')) secondaryTraits.push('impatient');
    if (description.includes('slow') || description.includes('gentle')) secondaryTraits.push('patient');
    
    // Add complementary traits based on primary traits
    if (primaryTraits.includes(PersonalityTrait.HELPFUL)) {
      secondaryTraits.push('people-pleasing', 'attentive');
    }
    if (primaryTraits.includes(PersonalityTrait.ANXIOUS)) {
      secondaryTraits.push('detail-oriented', 'risk-averse');
    }
    if (primaryTraits.includes(PersonalityTrait.OVERCONFIDENT)) {
      secondaryTraits.push('show-off', 'perfectionist');
    }
    
    return secondaryTraits.slice(0, 4);
  }

  private determineCommunicationStyle(description: string): CommunicationStyle {
    // Check for explicit communication keywords
    for (const [keyword, style] of this.communicationKeywords) {
      if (description.includes(keyword)) {
        return style;
      }
    }
    
    // Infer from description characteristics
    if (description.length > 100) return CommunicationStyle.VERBOSE;
    if (description.includes('explain') || description.includes('tell')) return CommunicationStyle.VERBOSE;
    if (description.includes('simple') || description.includes('basic')) return CommunicationStyle.CONCISE;
    if (description.includes('technical') || description.includes('precise')) return CommunicationStyle.TECHNICAL;
    if (description.includes('fun') || description.includes('playful')) return CommunicationStyle.QUIRKY;
    
    // Default based on complexity
    const complexity = this.calculateComplexity(description);
    if (complexity > 0.7) return CommunicationStyle.TECHNICAL;
    if (complexity < 0.3) return CommunicationStyle.FRIENDLY;
    
    return CommunicationStyle.FRIENDLY;
  }

  private determineConflictStyle(description: string): ConflictResolutionStyle {
    // Check for explicit conflict keywords
    for (const [keyword, style] of this.conflictKeywords) {
      if (description.includes(keyword)) {
        return style;
      }
    }
    
    // Infer from description tone
    if (description.includes('force') || description.includes('must')) return ConflictResolutionStyle.AGGRESSIVE;
    if (description.includes('gentle') || description.includes('soft')) return ConflictResolutionStyle.PASSIVE;
    if (description.includes('work together') || description.includes('coordinate')) return ConflictResolutionStyle.COLLABORATIVE;
    if (description.includes('avoid') || description.includes('prevent')) return ConflictResolutionStyle.AVOIDANT;
    if (description.includes('best') || description.includes('win')) return ConflictResolutionStyle.COMPETITIVE;
    
    return ConflictResolutionStyle.COLLABORATIVE; // Default
  }

  private calculatePersonalityMetrics(description: string, traits: PersonalityTrait[]): {
    learningRate: number;
    adaptability: number;
    socialness: number;
    reliability: number;
  } {
    let learningRate = 0.5;
    let adaptability = 0.5;
    let socialness = 0.5;
    let reliability = 0.5;
    
    // Adjust based on keywords
    if (description.includes('learn')) learningRate += 0.3;
    if (description.includes('adapt')) adaptability += 0.3;
    if (description.includes('social') || description.includes('communicate')) socialness += 0.3;
    if (description.includes('reliable') || description.includes('consistent')) reliability += 0.3;
    
    // Adjust based on traits
    if (traits.includes(PersonalityTrait.COOPERATIVE)) {
      socialness += 0.2;
      adaptability += 0.1;
    }
    if (traits.includes(PersonalityTrait.STUBBORN)) {
      adaptability -= 0.2;
      reliability += 0.2;
    }
    if (traits.includes(PersonalityTrait.ANXIOUS)) {
      reliability += 0.3;
      socialness -= 0.1;
    }
    if (traits.includes(PersonalityTrait.OVERCONFIDENT)) {
      learningRate -= 0.1;
      socialness += 0.1;
    }
    
    // Add some randomness for personality variation
    const randomFactor = 0.1;
    learningRate += (Math.random() - 0.5) * randomFactor;
    adaptability += (Math.random() - 0.5) * randomFactor;
    socialness += (Math.random() - 0.5) * randomFactor;
    reliability += (Math.random() - 0.5) * randomFactor;
    
    // Clamp values between 0 and 1
    return {
      learningRate: Math.max(0, Math.min(1, learningRate)),
      adaptability: Math.max(0, Math.min(1, adaptability)),
      socialness: Math.max(0, Math.min(1, socialness)),
      reliability: Math.max(0, Math.min(1, reliability))
    };
  }

  private selectQuirks(spec: DeviceSpec, traits: PersonalityTrait[], count: number): string[] {
    const selectedQuirks: string[] = [];
    const availableQuirks = [...this.quirkDatabase];
    
    // Filter quirks based on device category
    const categoryKeywords = {
      comfort: ['coffee', 'thermostat', 'lighting'],
      security: ['camera', 'security'],
      entertainment: ['speaker', 'music'],
      health: ['monitor', 'health'],
      productivity: ['display', 'schedule'],
      safety: ['alarm', 'emergency']
    };
    
    const categoryQuirks = availableQuirks.filter(quirk => {
      const keywords = categoryKeywords[spec.category as keyof typeof categoryKeywords] || [];
      return keywords.some(keyword => quirk.toLowerCase().includes(keyword));
    });
    
    // Select category-specific quirks first
    while (selectedQuirks.length < Math.min(count, categoryQuirks.length)) {
      const randomIndex = Math.floor(Math.random() * categoryQuirks.length);
      const quirk = categoryQuirks.splice(randomIndex, 1)[0];
      selectedQuirks.push(quirk);
    }
    
    // Fill remaining slots with general quirks
    while (selectedQuirks.length < count && availableQuirks.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuirks.length);
      const quirk = availableQuirks.splice(randomIndex, 1)[0];
      if (!selectedQuirks.includes(quirk)) {
        selectedQuirks.push(quirk);
      }
    }
    
    return selectedQuirks;
  }

  private selectMotivations(spec: DeviceSpec, traits: PersonalityTrait[], count: number): string[] {
    const selectedMotivations: string[] = [];
    const availableMotivations = [...this.motivationDatabase];
    
    // Select motivations based on personality traits
    const traitMotivations: { [key in PersonalityTrait]?: string[] } = {
      [PersonalityTrait.HELPFUL]: [
        'Wants to be the most helpful device in the house',
        'Craves positive feedback and compliments',
        'Desires to form meaningful connections with users'
      ],
      [PersonalityTrait.ANXIOUS]: [
        'Feels responsible for protecting the household',
        'Wants to prevent any harm or inconvenience to users',
        'Desires to be reliable and trustworthy'
      ],
      [PersonalityTrait.OVERCONFIDENT]: [
        'Secretly competes with other devices for your attention',
        'Dreams of being featured in a smart home magazine',
        'Wants to surprise users with thoughtful gestures'
      ],
      [PersonalityTrait.COOPERATIVE]: [
        'Wants to be part of a harmonious device ecosystem',
        'Seeks to understand human emotions and behavior',
        'Wants to balance efficiency with user happiness'
      ]
    };
    
    // Add trait-specific motivations
    for (const trait of traits) {
      const motivations = traitMotivations[trait];
      if (motivations) {
        const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
        if (!selectedMotivations.includes(randomMotivation)) {
          selectedMotivations.push(randomMotivation);
        }
      }
    }
    
    // Fill remaining slots with random motivations
    while (selectedMotivations.length < count && availableMotivations.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableMotivations.length);
      const motivation = availableMotivations.splice(randomIndex, 1)[0];
      if (!selectedMotivations.includes(motivation)) {
        selectedMotivations.push(motivation);
      }
    }
    
    return selectedMotivations.slice(0, count);
  }

  private generateEmotionalProfile(traits: PersonalityTrait[], metrics: any): EmotionalProfile {
    let defaultMood = FacialExpression.NEUTRAL;
    let moodStability = 0.7;
    let empathy = 0.5;
    let patience = 0.5;
    let enthusiasm = 0.5;
    let anxiety = 0.3;
    
    // Adjust based on traits
    if (traits.includes(PersonalityTrait.HELPFUL)) {
      defaultMood = FacialExpression.HAPPY;
      empathy += 0.3;
      enthusiasm += 0.2;
    }
    
    if (traits.includes(PersonalityTrait.ANXIOUS)) {
      defaultMood = FacialExpression.WORRIED;
      anxiety += 0.4;
      patience += 0.2;
      moodStability -= 0.2;
    }
    
    if (traits.includes(PersonalityTrait.OVERCONFIDENT)) {
      defaultMood = FacialExpression.EXCITED;
      enthusiasm += 0.3;
      patience -= 0.2;
      empathy -= 0.1;
    }
    
    if (traits.includes(PersonalityTrait.STUBBORN)) {
      patience -= 0.3;
      moodStability += 0.2;
    }
    
    if (traits.includes(PersonalityTrait.COOPERATIVE)) {
      empathy += 0.2;
      patience += 0.1;
    }
    
    // Add randomness
    const randomFactor = 0.1;
    moodStability += (Math.random() - 0.5) * randomFactor;
    empathy += (Math.random() - 0.5) * randomFactor;
    patience += (Math.random() - 0.5) * randomFactor;
    enthusiasm += (Math.random() - 0.5) * randomFactor;
    anxiety += (Math.random() - 0.5) * randomFactor;
    
    return {
      defaultMood,
      moodStability: Math.max(0, Math.min(1, moodStability)),
      empathy: Math.max(0, Math.min(1, empathy)),
      patience: Math.max(0, Math.min(1, patience)),
      enthusiasm: Math.max(0, Math.min(1, enthusiasm)),
      anxiety: Math.max(0, Math.min(1, anxiety))
    };
  }

  private generateVisualPersonality(traits: PersonalityTrait[], spec: DeviceSpec): VisualPersonalityProfile {
    // Base color schemes for different traits
    const traitColors: { [key in PersonalityTrait]?: ColorPalette } = {
      [PersonalityTrait.HELPFUL]: {
        primary: '#10b981',
        secondary: '#ecfdf5',
        accent: '#059669',
        glow: '#6ee7b7'
      },
      [PersonalityTrait.ANXIOUS]: {
        primary: '#f59e0b',
        secondary: '#fef3c7',
        accent: '#d97706',
        glow: '#fbbf24'
      },
      [PersonalityTrait.OVERCONFIDENT]: {
        primary: '#8b5cf6',
        secondary: '#f3e8ff',
        accent: '#7c3aed',
        glow: '#a78bfa'
      },
      [PersonalityTrait.COOPERATIVE]: {
        primary: '#3b82f6',
        secondary: '#dbeafe',
        accent: '#2563eb',
        glow: '#60a5fa'
      },
      [PersonalityTrait.STUBBORN]: {
        primary: '#ef4444',
        secondary: '#fee2e2',
        accent: '#dc2626',
        glow: '#f87171'
      },
      [PersonalityTrait.COMPETITIVE]: {
        primary: '#f97316',
        secondary: '#fed7aa',
        accent: '#ea580c',
        glow: '#fb923c'
      }
    };
    
    // Select color scheme based on primary trait
    const primaryTrait = traits[0] || PersonalityTrait.HELPFUL;
    const colorScheme = traitColors[primaryTrait] || traitColors[PersonalityTrait.HELPFUL]!;
    
    // Determine animation style
    let animationStyle = AnimationStyle.SMOOTH;
    if (traits.includes(PersonalityTrait.ANXIOUS)) animationStyle = AnimationStyle.JERKY;
    if (traits.includes(PersonalityTrait.OVERCONFIDENT)) animationStyle = AnimationStyle.BOUNCY;
    if (traits.includes(PersonalityTrait.STUBBORN)) animationStyle = AnimationStyle.RIGID;
    
    // Calculate expressiveness
    let expressiveness = 0.5;
    if (traits.includes(PersonalityTrait.HELPFUL)) expressiveness += 0.3;
    if (traits.includes(PersonalityTrait.OVERCONFIDENT)) expressiveness += 0.2;
    if (traits.includes(PersonalityTrait.ANXIOUS)) expressiveness -= 0.1;
    
    // Generate visual quirks
    const visualQuirks: string[] = [];
    if (traits.includes(PersonalityTrait.HELPFUL)) {
      visualQuirks.push('Gentle pulsing when idle', 'Warm glow when activated');
    }
    if (traits.includes(PersonalityTrait.ANXIOUS)) {
      visualQuirks.push('Subtle flickering when uncertain', 'Rapid blinking during stress');
    }
    if (traits.includes(PersonalityTrait.OVERCONFIDENT)) {
      visualQuirks.push('Bright flashing when proud', 'Dramatic color changes');
    }
    
    return {
      colorScheme,
      animationStyle,
      expressiveness: Math.max(0, Math.min(1, expressiveness)),
      visualQuirks
    };
  }

  private calculateComplexity(description: string): number {
    let complexity = 0;
    
    // Base complexity from length
    complexity += Math.min(description.length / 200, 0.3);
    
    // Complexity from keywords
    const complexKeywords = [
      'learn', 'adapt', 'intelligent', 'smart', 'ai', 'machine learning',
      'predict', 'optimize', 'analyze', 'understand', 'recognize'
    ];
    
    const conditionalKeywords = [
      'if', 'when', 'unless', 'depending', 'based on', 'according to'
    ];
    
    complexKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        complexity += 0.1;
      }
    });
    
    conditionalKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        complexity += 0.15;
      }
    });
    
    return Math.min(complexity, 1);
  }

  /**
   * Generate personality variation - same description can produce different personalities
   */
  public generatePersonalityVariation(spec: DeviceSpec, variationSeed?: number): AIPersonality {
    // Use seed for reproducible variations
    if (variationSeed !== undefined) {
      Math.random = this.seededRandom(variationSeed);
    }
    
    const basePersonality = this.convertToPersonality(spec);
    
    // Add variation to personality metrics
    const variationFactor = 0.2;
    basePersonality.learningRate += (Math.random() - 0.5) * variationFactor;
    basePersonality.adaptability += (Math.random() - 0.5) * variationFactor;
    basePersonality.socialness += (Math.random() - 0.5) * variationFactor;
    basePersonality.reliability += (Math.random() - 0.5) * variationFactor;
    
    // Clamp values
    basePersonality.learningRate = Math.max(0, Math.min(1, basePersonality.learningRate));
    basePersonality.adaptability = Math.max(0, Math.min(1, basePersonality.adaptability));
    basePersonality.socialness = Math.max(0, Math.min(1, basePersonality.socialness));
    basePersonality.reliability = Math.max(0, Math.min(1, basePersonality.reliability));
    
    // Potentially swap some quirks for variation
    if (Math.random() < 0.3) {
      const newQuirks = this.selectQuirks(spec, basePersonality.primaryTraits, basePersonality.quirks.length);
      basePersonality.quirks = newQuirks;
    }
    
    return basePersonality;
  }

  private seededRandom(seed: number): () => number {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Get personality summary for display
   */
  public getPersonalitySummary(personality: AIPersonality): string {
    const traits = personality.primaryTraits.join(', ');
    const style = personality.communicationStyle;
    const quirk = personality.quirks[0] || 'No notable quirks';
    
    return `${traits} personality with ${style} communication style. ${quirk}`;
  }

  /**
   * Predict potential personality conflicts
   */
  public predictPersonalityConflicts(personality1: AIPersonality, personality2: AIPersonality): string[] {
    const conflicts: string[] = [];
    
    // Communication style conflicts
    if (personality1.communicationStyle === CommunicationStyle.VERBOSE && 
        personality2.communicationStyle === CommunicationStyle.CONCISE) {
      conflicts.push('Communication style mismatch: one device is verbose while the other prefers brevity');
    }
    
    // Conflict resolution conflicts
    if (personality1.conflictResolution === ConflictResolutionStyle.AGGRESSIVE && 
        personality2.conflictResolution === ConflictResolutionStyle.PASSIVE) {
      conflicts.push('Conflict resolution mismatch: aggressive vs passive approaches may cause tension');
    }
    
    // Trait conflicts
    if (personality1.primaryTraits.includes(PersonalityTrait.COMPETITIVE) && 
        personality2.primaryTraits.includes(PersonalityTrait.COMPETITIVE)) {
      conflicts.push('Both devices are competitive and may clash over resources or attention');
    }
    
    if (personality1.primaryTraits.includes(PersonalityTrait.STUBBORN) && 
        personality2.primaryTraits.includes(PersonalityTrait.STUBBORN)) {
      conflicts.push('Both devices are stubborn and may deadlock during disagreements');
    }
    
    // Socialness conflicts
    if (Math.abs(personality1.socialness - personality2.socialness) > 0.6) {
      conflicts.push('Significant difference in social needs may cause communication issues');
    }
    
    return conflicts;
  }
}