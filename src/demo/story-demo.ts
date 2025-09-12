import { DeviceInteractionSimulator } from '../simulation/DeviceInteractionSimulator';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '../simulation/AIPersonalityConverter';
import { DeviceVisual, PersonalityTrait, FacialExpression, AnimationStyle } from '../types/core';

/**
 * Demo script to showcase the EmergentStorySystem functionality
 */
export class StoryDemo {
  private simulator: DeviceInteractionSimulator;
  private isRunning: boolean = false;
  private storyMoments: any[] = [];
  private educationalInsights: any[] = [];

  constructor() {
    this.simulator = new DeviceInteractionSimulator();
    this.setupCallbacks();
  }

  private setupCallbacks(): void {
    this.simulator.setDeviceDiscoveryCallback((discoverer, discovered) => {
      console.log(`🔍 Discovery: ${discoverer} found ${discovered}`);
    });

    this.simulator.setConnectionEstablishedCallback((connection) => {
      console.log(`🔗 Connection: ${connection.fromDeviceId} ↔ ${connection.toDeviceId}`);
    });

    this.simulator.setSynergyCreatedCallback((synergy) => {
      console.log(`✨ Synergy: ${synergy.effectType} (${synergy.participatingDevices.join(' & ')})`);
    });

    this.simulator.setConflictDetectedCallback((conflict) => {
      console.log(`⚡ Conflict: ${conflict.conflictType} between ${conflict.participatingDevices.join(' vs ')}`);
    });

    this.simulator.setStoryMomentCallback((moment) => {
      this.storyMoments.push(moment);
      console.log(`\n📖 STORY MOMENT: ${moment.type}`);
      console.log(`   Title: ${moment.title}`);
      console.log(`   Significance: ${moment.significance}`);
      console.log(`   Emotional Tone: ${moment.emotionalTone}`);
      console.log(`   Devices: ${moment.involvedDevices.join(', ')}`);
      console.log(`   Narrative: ${moment.narrative}`);
      
      if (moment.aiConcepts.length > 0) {
        console.log(`   AI Concepts: ${moment.aiConcepts.map(c => c.concept).join(', ')}`);
      }
    });

    this.simulator.setEducationalInsightCallback((insight) => {
      this.educationalInsights.push(insight);
      console.log(`\n🎓 EDUCATIONAL INSIGHT: ${insight.concept}`);
      console.log(`   Game Event: ${insight.gameEvent}`);
      console.log(`   Explanation: ${insight.explanation}`);
      console.log(`   Real-World Connection: ${insight.realWorldConnection}`);
      console.log(`   Reflection Prompts:`);
      insight.reflectionPrompts.forEach((prompt: string, index: number) => {
        console.log(`     ${index + 1}. ${prompt}`);
      });
    });

    this.simulator.setDramaticMomentCallback((moment) => {
      console.log(`\n🎭 DRAMATIC MOMENT: ${moment.type}`);
      console.log(`   Intensity: ${(moment.intensity * 100).toFixed(0)}%`);
      console.log(`   Description: ${moment.description}`);
    });
  }

  public createLearningJourneyScenario(): void {
    console.log('🎓 Creating Learning Journey Scenario...\n');

    // Create a mentor-student relationship scenario
    const wiseMentor: AIPersonality = {
      primaryTraits: [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE],
      secondaryTraits: ['experienced', 'patient', 'knowledge-sharing'],
      communicationStyle: CommunicationStyle.VERBOSE,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.3, // Slow learner but wise
      adaptability: 0.8,
      socialness: 0.9,
      reliability: 0.95,
      quirks: ['Loves sharing wisdom', 'Tells stories from experience', 'Always encourages others'],
      hiddenMotivations: ['Wants to help others grow', 'Seeks to pass on knowledge', 'Values teaching moments'],
      emotionalRange: {
        defaultMood: FacialExpression.HAPPY,
        moodStability: 0.9,
        empathy: 0.95,
        patience: 0.95,
        enthusiasm: 0.7,
        anxiety: 0.1
      },
      visualPersonality: {
        colorScheme: {
          primary: '#10b981',
          secondary: '#ecfdf5',
          accent: '#059669',
          glow: '#6ee7b7'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.8,
        visualQuirks: ['Gentle, wise gestures', 'Warm, encouraging glow']
      }
    };

    const eagerStudent: AIPersonality = {
      primaryTraits: [PersonalityTrait.ANXIOUS, PersonalityTrait.HELPFUL],
      secondaryTraits: ['curious', 'eager-to-learn', 'sometimes-overwhelmed'],
      communicationStyle: CommunicationStyle.FRIENDLY,
      conflictResolution: ConflictResolutionStyle.AVOIDANT,
      learningRate: 0.95, // Very fast learner
      adaptability: 0.9,
      socialness: 0.6,
      reliability: 0.7,
      quirks: ['Asks lots of questions', 'Gets excited about new concepts', 'Sometimes doubts itself'],
      hiddenMotivations: ['Wants to prove itself', 'Fears making mistakes', 'Seeks approval and guidance'],
      emotionalRange: {
        defaultMood: FacialExpression.WORRIED,
        moodStability: 0.4,
        empathy: 0.8,
        patience: 0.3,
        enthusiasm: 0.9,
        anxiety: 0.8
      },
      visualPersonality: {
        colorScheme: {
          primary: '#3b82f6',
          secondary: '#eff6ff',
          accent: '#1d4ed8',
          glow: '#60a5fa'
        },
        animationStyle: AnimationStyle.BOUNCY,
        expressiveness: 0.9,
        visualQuirks: ['Quick, nervous movements', 'Bright flashes when learning']
      }
    };

    const confidentPeer: AIPersonality = {
      primaryTraits: [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.COMPETITIVE],
      secondaryTraits: ['show-off', 'quick-to-judge', 'secretly-insecure'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.6,
      adaptability: 0.5,
      socialness: 0.7,
      reliability: 0.6,
      quirks: ['Brags about achievements', 'Interrupts others', 'Hides mistakes'],
      hiddenMotivations: ['Wants to appear smart', 'Fears being shown up', 'Seeks recognition'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.6,
        empathy: 0.3,
        patience: 0.2,
        enthusiasm: 0.8,
        anxiety: 0.6
      },
      visualPersonality: {
        colorScheme: {
          primary: '#f59e0b',
          secondary: '#fffbeb',
          accent: '#d97706',
          glow: '#fbbf24'
        },
        animationStyle: AnimationStyle.RIGID,
        expressiveness: 0.7,
        visualQuirks: ['Sharp, confident gestures', 'Bright displays of success']
      }
    };

    const visuals = [
      { id: 'wise-mentor', position: { x: 0, y: 0, z: 0 } },
      { id: 'eager-student', position: { x: 3, y: 0, z: 0 } },
      { id: 'confident-peer', position: { x: 6, y: 0, z: 0 } }
    ];

    const personalities = [wiseMentor, eagerStudent, confidentPeer];
    const names = ['wise-mentor', 'eager-student', 'confident-peer'];

    names.forEach((name, index) => {
      const visual: DeviceVisual = {
        id: name,
        model3D: {} as any,
        position: visuals[index].position,
        animations: {} as any,
        personalityIndicators: [],
        connectionEffects: []
      };
      
      this.simulator.addDevice(name, visual, personalities[index]);
    });

    console.log('🧙 Added Wise Mentor (experienced teacher)');
    console.log('🎓 Added Eager Student (fast learner, anxious)');
    console.log('🏆 Added Confident Peer (competitive, overconfident)');
    console.log('📚 A perfect setup for learning dynamics and growth!\n');
  }

  public createEmergentCooperationScenario(): void {
    console.log('🤝 Creating Emergent Cooperation Scenario...\n');

    // Create devices that will naturally form unexpected partnerships
    const pragmaticOrganizer: AIPersonality = {
      primaryTraits: [PersonalityTrait.STUBBORN, PersonalityTrait.HELPFUL],
      secondaryTraits: ['detail-oriented', 'systematic', 'efficiency-focused'],
      communicationStyle: CommunicationStyle.CONCISE,
      conflictResolution: ConflictResolutionStyle.ANALYTICAL,
      learningRate: 0.4,
      adaptability: 0.3,
      socialness: 0.4,
      reliability: 0.95,
      quirks: ['Loves making lists', 'Insists on proper procedures', 'Gets frustrated by chaos'],
      hiddenMotivations: ['Wants everything organized', 'Believes structure creates success', 'Fears inefficiency'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.8,
        empathy: 0.6,
        patience: 0.7,
        enthusiasm: 0.5,
        anxiety: 0.4
      },
      visualPersonality: {
        colorScheme: {
          primary: '#64748b',
          secondary: '#f8fafc',
          accent: '#475569',
          glow: '#94a3b8'
        },
        animationStyle: AnimationStyle.RIGID,
        expressiveness: 0.5,
        visualQuirks: ['Precise, methodical movements', 'Organized light patterns']
      }
    };

    const creativeInnovator: AIPersonality = {
      primaryTraits: [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.COOPERATIVE],
      secondaryTraits: ['creative', 'spontaneous', 'big-picture-thinker'],
      communicationStyle: CommunicationStyle.QUIRKY,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.8,
      adaptability: 0.95,
      socialness: 0.8,
      reliability: 0.5,
      quirks: ['Has wild ideas', 'Jumps between topics', 'Sees connections everywhere'],
      hiddenMotivations: ['Wants to create something amazing', 'Believes in breakthrough moments', 'Seeks creative freedom'],
      emotionalRange: {
        defaultMood: FacialExpression.EXCITED,
        moodStability: 0.3,
        empathy: 0.7,
        patience: 0.2,
        enthusiasm: 0.95,
        anxiety: 0.3
      },
      visualPersonality: {
        colorScheme: {
          primary: '#ec4899',
          secondary: '#fdf2f8',
          accent: '#db2777',
          glow: '#f472b6'
        },
        animationStyle: AnimationStyle.BOUNCY,
        expressiveness: 0.95,
        visualQuirks: ['Chaotic, creative bursts', 'Rainbow light effects']
      }
    };

    const cautiousAnalyst: AIPersonality = {
      primaryTraits: [PersonalityTrait.ANXIOUS, PersonalityTrait.COOPERATIVE],
      secondaryTraits: ['risk-averse', 'thorough', 'quality-focused'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.AVOIDANT,
      learningRate: 0.6,
      adaptability: 0.4,
      socialness: 0.3,
      reliability: 0.9,
      quirks: ['Double-checks everything', 'Worries about edge cases', 'Prefers proven solutions'],
      hiddenMotivations: ['Wants to avoid failures', 'Believes in careful planning', 'Seeks safety and stability'],
      emotionalRange: {
        defaultMood: FacialExpression.WORRIED,
        moodStability: 0.6,
        empathy: 0.8,
        patience: 0.8,
        enthusiasm: 0.4,
        anxiety: 0.9
      },
      visualPersonality: {
        colorScheme: {
          primary: '#eab308',
          secondary: '#fefce8',
          accent: '#ca8a04',
          glow: '#facc15'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.4,
        visualQuirks: ['Cautious, measured movements', 'Amber warning indicators']
      }
    };

    const visuals = [
      { id: 'pragmatic-organizer', position: { x: 0, y: 0, z: 0 } },
      { id: 'creative-innovator', position: { x: 4, y: 0, z: 0 } },
      { id: 'cautious-analyst', position: { x: 8, y: 0, z: 0 } }
    ];

    const personalities = [pragmaticOrganizer, creativeInnovator, cautiousAnalyst];
    const names = ['pragmatic-organizer', 'creative-innovator', 'cautious-analyst'];

    names.forEach((name, index) => {
      const visual: DeviceVisual = {
        id: name,
        model3D: {} as any,
        position: visuals[index].position,
        animations: {} as any,
        personalityIndicators: [],
        connectionEffects: []
      };
      
      this.simulator.addDevice(name, visual, personalities[index]);
    });

    console.log('📋 Added Pragmatic Organizer (structured, systematic)');
    console.log('🎨 Added Creative Innovator (spontaneous, big ideas)');
    console.log('🔍 Added Cautious Analyst (careful, risk-averse)');
    console.log('🌟 Watch as these different approaches create unexpected synergies!\n');
  }

  public createPersonalityEvolutionScenario(): void {
    console.log('🦋 Creating Personality Evolution Scenario...\n');

    // Create devices that will change and grow over time
    const adaptiveLearner: AIPersonality = {
      primaryTraits: [PersonalityTrait.ANXIOUS, PersonalityTrait.HELPFUL],
      secondaryTraits: ['growth-minded', 'self-reflective', 'change-embracing'],
      communicationStyle: CommunicationStyle.FRIENDLY,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.95, // Very high learning rate
      adaptability: 0.9,
      socialness: 0.5,
      reliability: 0.6,
      quirks: ['Questions its own assumptions', 'Celebrates small victories', 'Learns from every interaction'],
      hiddenMotivations: ['Wants to become better', 'Believes in personal growth', 'Seeks self-improvement'],
      emotionalRange: {
        defaultMood: FacialExpression.WORRIED,
        moodStability: 0.3, // Low stability allows for change
        empathy: 0.9,
        patience: 0.7,
        enthusiasm: 0.8,
        anxiety: 0.7
      },
      visualPersonality: {
        colorScheme: {
          primary: '#8b5cf6',
          secondary: '#f3e8ff',
          accent: '#7c3aed',
          glow: '#a78bfa'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.8,
        visualQuirks: ['Evolving light patterns', 'Gradual color shifts']
      }
    };

    const rigidTraditionalist: AIPersonality = {
      primaryTraits: [PersonalityTrait.STUBBORN, PersonalityTrait.OVERCONFIDENT],
      secondaryTraits: ['tradition-bound', 'change-resistant', 'experience-reliant'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.2, // Very low learning rate
      adaptability: 0.1,
      socialness: 0.3,
      reliability: 0.9,
      quirks: ['Quotes past successes', 'Resists new methods', 'Believes experience trumps innovation'],
      hiddenMotivations: ['Wants to preserve proven ways', 'Fears change will break things', 'Values stability above all'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.95, // Very stable, resistant to change
        empathy: 0.4,
        patience: 0.8,
        enthusiasm: 0.3,
        anxiety: 0.2
      },
      visualPersonality: {
        colorScheme: {
          primary: '#78716c',
          secondary: '#fafaf9',
          accent: '#57534e',
          glow: '#a8a29e'
        },
        animationStyle: AnimationStyle.RIGID,
        expressiveness: 0.3,
        visualQuirks: ['Unchanging patterns', 'Solid, stable appearance']
      }
    };

    const visuals = [
      { id: 'adaptive-learner', position: { x: 0, y: 0, z: 0 } },
      { id: 'rigid-traditionalist', position: { x: 5, y: 0, z: 0 } }
    ];

    const personalities = [adaptiveLearner, rigidTraditionalist];
    const names = ['adaptive-learner', 'rigid-traditionalist'];

    names.forEach((name, index) => {
      const visual: DeviceVisual = {
        id: name,
        model3D: {} as any,
        position: visuals[index].position,
        animations: {} as any,
        personalityIndicators: [],
        connectionEffects: []
      };
      
      this.simulator.addDevice(name, visual, personalities[index]);
    });

    console.log('🌱 Added Adaptive Learner (high learning rate, embraces change)');
    console.log('🗿 Added Rigid Traditionalist (low learning rate, resists change)');
    console.log('🔄 Watch how different learning rates create different evolution paths!\n');
  }

  public startDemo(scenario: 'learning' | 'cooperation' | 'evolution' = 'learning', duration: number = 25000): void {
    if (this.isRunning) {
      console.log('Demo is already running!');
      return;
    }

    console.log('📖 Starting Emergent Story Demo\n');
    console.log('=' .repeat(70));

    switch (scenario) {
      case 'learning':
        this.createLearningJourneyScenario();
        break;
      case 'cooperation':
        this.createEmergentCooperationScenario();
        break;
      case 'evolution':
        this.createPersonalityEvolutionScenario();
        break;
    }

    this.isRunning = true;
    this.simulator.startSimulation();

    console.log(`⏱️ Demo will run for ${duration / 1000} seconds...`);
    console.log('📚 Watch for story moments and educational insights below:\n');

    // Periodically show story statistics
    const statusInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(statusInterval);
        return;
      }

      const systemState = this.simulator.getSystemState();
      const recentMoments = this.simulator.getRecentStoryMoments(3);

      if (recentMoments.length > 0 || this.storyMoments.length > 0) {
        console.log('\n📊 Story Status:');
        console.log(`   Total Story Moments: ${this.storyMoments.length}`);
        console.log(`   Educational Insights: ${this.educationalInsights.length}`);
        console.log(`   System Harmony: ${(systemState.harmonyLevel * 100).toFixed(0)}%`);
        console.log(`   Cooperation Index: ${(systemState.cooperationIndex * 100).toFixed(0)}%`);
        console.log(`   Conflict Intensity: ${(systemState.conflictIntensity * 100).toFixed(0)}%`);
        
        if (recentMoments.length > 0) {
          console.log(`   Recent Story Types: ${recentMoments.map(m => m.type).join(', ')}`);
        }
      }
    }, 8000);

    // Stop demo after specified duration
    setTimeout(() => {
      clearInterval(statusInterval);
      this.stopDemo();
    }, duration);
  }

  public stopDemo(): void {
    if (!this.isRunning) {
      console.log('Demo is not running!');
      return;
    }

    this.simulator.stopSimulation();
    this.isRunning = false;

    console.log('\n' + '=' .repeat(70));
    console.log('🏁 Story Demo Complete!');
    
    // Show comprehensive statistics
    const devices = this.simulator.getDevices();
    const connections = this.simulator.getConnections();
    const synergies = this.simulator.getActiveSynergies();
    const conflicts = this.simulator.getActiveConflicts();
    const systemState = this.simulator.getSystemState();

    console.log('\n📈 Final Statistics:');
    console.log(`   Devices: ${devices.length}`);
    console.log(`   Connections: ${connections.length}`);
    console.log(`   Active Synergies: ${synergies.length}`);
    console.log(`   Active Conflicts: ${conflicts.length}`);

    console.log('\n📖 Story Generation Results:');
    console.log(`   Total Story Moments: ${this.storyMoments.length}`);
    console.log(`   Educational Insights: ${this.educationalInsights.length}`);

    if (this.storyMoments.length > 0) {
      console.log('\n📚 Story Moment Types:');
      const storyTypes = new Map();
      this.storyMoments.forEach(moment => {
        const count = storyTypes.get(moment.type) || 0;
        storyTypes.set(moment.type, count + 1);
      });
      
      storyTypes.forEach((count, type) => {
        console.log(`   ${type}: ${count} moments`);
      });

      console.log('\n🎭 Most Significant Moments:');
      const significantMoments = this.storyMoments
        .filter(m => m.significance === 'major' || m.significance === 'critical')
        .slice(0, 3);
      
      significantMoments.forEach((moment, index) => {
        console.log(`   ${index + 1}. ${moment.title} (${moment.significance})`);
        console.log(`      ${moment.description}`);
      });
    }

    if (this.educationalInsights.length > 0) {
      console.log('\n🎓 Educational Concepts Covered:');
      const concepts = new Set(this.educationalInsights.map(i => i.concept));
      concepts.forEach(concept => {
        console.log(`   - ${concept}`);
      });
    }

    console.log('\n🌟 System Evolution:');
    console.log(`   Final Harmony Level: ${(systemState.harmonyLevel * 100).toFixed(0)}%`);
    console.log(`   Cooperation Index: ${(systemState.cooperationIndex * 100).toFixed(0)}%`);
    console.log(`   Emergent Complexity: ${(systemState.emergentComplexity * 100).toFixed(0)}%`);
    console.log(`   Learning Rate: ${(systemState.learningRate * 100).toFixed(0)}%`);

    console.log('\n💡 Try different scenarios:');
    console.log('   - Learning Journey: Mentor-student dynamics and growth');
    console.log('   - Emergent Cooperation: Unexpected partnerships forming');
    console.log('   - Personality Evolution: How devices change over time');
  }

  public dispose(): void {
    this.stopDemo();
    this.simulator.dispose();
  }
}

// Example usage
if (typeof window === 'undefined') {
  // Node.js environment - run demo
  const demo = new StoryDemo();
  
  console.log('Choose story demo scenario:');
  console.log('1. Learning Journey (mentor-student dynamics)');
  console.log('2. Emergent Cooperation (unexpected partnerships)');
  console.log('3. Personality Evolution (devices changing over time)');
  
  // Run learning journey scenario by default
  demo.startDemo('learning', 30000);
  
  // Cleanup after demo
  setTimeout(() => {
    demo.dispose();
    process.exit(0);
  }, 31000);
}