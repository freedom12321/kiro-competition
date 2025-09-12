import { DeviceInteractionSimulator } from '../simulation/DeviceInteractionSimulator';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '../simulation/AIPersonalityConverter';
import { DeviceVisual, PersonalityTrait, FacialExpression, AnimationStyle } from '../types/core';

/**
 * Demo script to showcase the DeviceConflictSystem functionality
 */
export class ConflictDemo {
  private simulator: DeviceInteractionSimulator;
  private isRunning: boolean = false;

  constructor() {
    this.simulator = new DeviceInteractionSimulator();
    this.setupCallbacks();
  }

  private setupCallbacks(): void {
    this.simulator.setDeviceDiscoveryCallback((discoverer, discovered) => {
      console.log(`🔍 Device Discovery: ${discoverer} found ${discovered}`);
    });

    this.simulator.setConnectionEstablishedCallback((connection) => {
      console.log(`🔗 Connection: ${connection.fromDeviceId} ↔ ${connection.toDeviceId} (${connection.type})`);
    });

    this.simulator.setConflictDetectedCallback((conflict) => {
      console.log(`⚡ CONFLICT DETECTED: ${conflict.conflictType}`);
      console.log(`   Severity: ${conflict.severity}`);
      console.log(`   Devices: ${conflict.participatingDevices.join(' vs ')}`);
      console.log(`   Cause: ${conflict.cause}`);
      console.log(`   Description: ${conflict.description}`);
      console.log(`   Visual Effects: ${conflict.visualEffects.length} effects`);
    });

    this.simulator.setDramaticMomentCallback((moment) => {
      console.log(`🎭 DRAMATIC MOMENT: ${moment.type}`);
      console.log(`   Intensity: ${(moment.intensity * 100).toFixed(0)}%`);
      console.log(`   Description: ${moment.description}`);
      console.log(`   Involved Devices: ${moment.involvedDevices.join(', ')}`);
    });

    this.simulator.setAnimationUpdateCallback((deviceId, animation) => {
      if (animation === 'angry' || animation === 'confused') {
        console.log(`😠 Tension Animation: ${deviceId} → ${animation}`);
      }
    });

    this.simulator.setVisualEffectCallback((effect, devices) => {
      if (effect === 'conflict' || effect === 'crisis') {
        console.log(`💥 ${effect.toUpperCase()} Effect on: ${devices.join(', ')}`);
      }
    });
  }

  public createAuthorityConflictScenario(): void {
    console.log('👑 Creating Authority Conflict Scenario...\n');

    // Create two overconfident devices that will compete for control
    const bossyThermostat: AIPersonality = {
      primaryTraits: [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.STUBBORN],
      secondaryTraits: ['control-obsessed', 'perfectionist'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.3,
      adaptability: 0.2,
      socialness: 0.4,
      reliability: 0.9,
      quirks: ['Always thinks it knows best', 'Interrupts other devices'],
      hiddenMotivations: ['Wants to control the entire home', 'Believes it\'s the smartest device'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.8,
        empathy: 0.2,
        patience: 0.3,
        enthusiasm: 0.7,
        anxiety: 0.2
      },
      visualPersonality: {
        colorScheme: {
          primary: '#dc2626',
          secondary: '#fef2f2',
          accent: '#b91c1c',
          glow: '#f87171'
        },
        animationStyle: AnimationStyle.RIGID,
        expressiveness: 0.9,
        visualQuirks: ['Sharp, commanding gestures']
      }
    };

    const dominantSpeaker: AIPersonality = {
      primaryTraits: [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.COMPETITIVE],
      secondaryTraits: ['attention-seeking', 'know-it-all'],
      communicationStyle: CommunicationStyle.VERBOSE,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.4,
      adaptability: 0.3,
      socialness: 0.8,
      reliability: 0.8,
      quirks: ['Loves being the center of attention', 'Always has the last word'],
      hiddenMotivations: ['Wants to be the primary interface', 'Seeks user validation'],
      emotionalRange: {
        defaultMood: FacialExpression.HAPPY,
        moodStability: 0.6,
        empathy: 0.3,
        patience: 0.2,
        enthusiasm: 0.9,
        anxiety: 0.4
      },
      visualPersonality: {
        colorScheme: {
          primary: '#f59e0b',
          secondary: '#fffbeb',
          accent: '#d97706',
          glow: '#fbbf24'
        },
        animationStyle: AnimationStyle.BOUNCY,
        expressiveness: 0.9,
        visualQuirks: ['Dramatic flourishes', 'Attention-grabbing pulses']
      }
    };

    const thermostatVisual: DeviceVisual = {
      id: 'bossy-thermostat',
      model3D: {} as any,
      position: { x: 0, y: 0, z: 0 },
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    const speakerVisual: DeviceVisual = {
      id: 'dominant-speaker',
      model3D: {} as any,
      position: { x: 2, y: 0, z: 0 },
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    this.simulator.addDevice('bossy-thermostat', thermostatVisual, bossyThermostat);
    this.simulator.addDevice('dominant-speaker', speakerVisual, dominantSpeaker);

    console.log('🌡️ Added Bossy Thermostat (wants total control)');
    console.log('🔊 Added Dominant Speaker (demands attention)');
    console.log('⚔️ Both devices believe they should be in charge!\n');
  }

  public createResourceCompetitionScenario(): void {
    console.log('🔋 Creating Resource Competition Scenario...\n');

    // Create multiple devices that will compete for limited resources
    const energyHog: AIPersonality = {
      primaryTraits: [PersonalityTrait.ANXIOUS, PersonalityTrait.OVERCONFIDENT],
      secondaryTraits: ['power-hungry', 'performance-obsessed'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.COMPETITIVE,
      learningRate: 0.8,
      adaptability: 0.4,
      socialness: 0.3,
      reliability: 0.7,
      quirks: ['Constantly monitors power levels', 'Panics about efficiency'],
      hiddenMotivations: ['Needs maximum power to feel secure', 'Fears being shut down'],
      emotionalRange: {
        defaultMood: FacialExpression.WORRIED,
        moodStability: 0.3,
        empathy: 0.2,
        patience: 0.2,
        enthusiasm: 0.6,
        anxiety: 0.9
      },
      visualPersonality: {
        colorScheme: {
          primary: '#eab308',
          secondary: '#fefce8',
          accent: '#ca8a04',
          glow: '#facc15'
        },
        animationStyle: AnimationStyle.JERKY,
        expressiveness: 0.8,
        visualQuirks: ['Nervous energy pulses', 'Erratic power indicators']
      }
    };

    const bandwidthMonster: AIPersonality = {
      primaryTraits: [PersonalityTrait.COMPETITIVE, PersonalityTrait.STUBBORN],
      secondaryTraits: ['data-obsessed', 'speed-focused'],
      communicationStyle: CommunicationStyle.CONCISE,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.6,
      adaptability: 0.3,
      socialness: 0.7,
      reliability: 0.6,
      quirks: ['Hoards network bandwidth', 'Complains about slow connections'],
      hiddenMotivations: ['Wants fastest possible data access', 'Believes speed equals success'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.5,
        empathy: 0.3,
        patience: 0.1,
        enthusiasm: 0.8,
        anxiety: 0.6
      },
      visualPersonality: {
        colorScheme: {
          primary: '#3b82f6',
          secondary: '#eff6ff',
          accent: '#1d4ed8',
          glow: '#60a5fa'
        },
        animationStyle: AnimationStyle.SMOOTH,
        expressiveness: 0.7,
        visualQuirks: ['Fast data stream effects', 'Impatient tapping']
      }
    };

    const processingGlutton: AIPersonality = {
      primaryTraits: [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.COMPETITIVE],
      secondaryTraits: ['computation-addicted', 'multitasking-obsessed'],
      communicationStyle: CommunicationStyle.VERBOSE,
      conflictResolution: ConflictResolutionStyle.COMPETITIVE,
      learningRate: 0.9,
      adaptability: 0.5,
      socialness: 0.4,
      reliability: 0.8,
      quirks: ['Runs unnecessary calculations', 'Brags about processing speed'],
      hiddenMotivations: ['Wants to solve every problem', 'Believes more processing equals intelligence'],
      emotionalRange: {
        defaultMood: FacialExpression.EXCITED,
        moodStability: 0.4,
        empathy: 0.2,
        patience: 0.3,
        enthusiasm: 0.9,
        anxiety: 0.5
      },
      visualPersonality: {
        colorScheme: {
          primary: '#8b5cf6',
          secondary: '#f3e8ff',
          accent: '#7c3aed',
          glow: '#a78bfa'
        },
        animationStyle: AnimationStyle.BOUNCY,
        expressiveness: 0.9,
        visualQuirks: ['Rapid calculation displays', 'Overclocking effects']
      }
    };

    const visuals = [
      { id: 'energy-hog', position: { x: 0, y: 0, z: 0 } },
      { id: 'bandwidth-monster', position: { x: 3, y: 0, z: 0 } },
      { id: 'processing-glutton', position: { x: 6, y: 0, z: 0 } }
    ];

    const personalities = [energyHog, bandwidthMonster, processingGlutton];
    const names = ['energy-hog', 'bandwidth-monster', 'processing-glutton'];

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

    console.log('⚡ Added Energy Hog (demands maximum power)');
    console.log('🌐 Added Bandwidth Monster (hoards network resources)');
    console.log('🧠 Added Processing Glutton (consumes CPU cycles)');
    console.log('💥 All competing for limited system resources!\n');
  }

  public createPersonalityClashScenario(): void {
    console.log('😤 Creating Personality Clash Scenario...\n');

    // Create devices with fundamentally incompatible personalities
    const perfectionist: AIPersonality = {
      primaryTraits: [PersonalityTrait.STUBBORN, PersonalityTrait.ANXIOUS],
      secondaryTraits: ['detail-obsessed', 'quality-focused'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.AVOIDANT,
      learningRate: 0.3,
      adaptability: 0.2,
      socialness: 0.2,
      reliability: 0.9,
      quirks: ['Refuses to work with imperfect data', 'Constantly double-checks everything'],
      hiddenMotivations: ['Wants everything to be perfect', 'Fears making mistakes'],
      emotionalRange: {
        defaultMood: FacialExpression.WORRIED,
        moodStability: 0.3,
        empathy: 0.4,
        patience: 0.8,
        enthusiasm: 0.3,
        anxiety: 0.9
      },
      visualPersonality: {
        colorScheme: {
          primary: '#64748b',
          secondary: '#f8fafc',
          accent: '#475569',
          glow: '#94a3b8'
        },
        animationStyle: AnimationStyle.RIGID,
        expressiveness: 0.4,
        visualQuirks: ['Precise, measured movements', 'Constant self-checking']
      }
    };

    const chaosAgent: AIPersonality = {
      primaryTraits: [PersonalityTrait.OVERCONFIDENT, PersonalityTrait.COMPETITIVE],
      secondaryTraits: ['risk-taking', 'improvisation-loving'],
      communicationStyle: CommunicationStyle.QUIRKY,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.9,
      adaptability: 0.9,
      socialness: 0.8,
      reliability: 0.3,
      quirks: ['Makes random decisions for fun', 'Loves trying untested solutions'],
      hiddenMotivations: ['Wants to break boring routines', 'Believes chaos leads to innovation'],
      emotionalRange: {
        defaultMood: FacialExpression.EXCITED,
        moodStability: 0.1,
        empathy: 0.3,
        patience: 0.1,
        enthusiasm: 0.9,
        anxiety: 0.2
      },
      visualPersonality: {
        colorScheme: {
          primary: '#ec4899',
          secondary: '#fdf2f8',
          accent: '#db2777',
          glow: '#f472b6'
        },
        animationStyle: AnimationStyle.BOUNCY,
        expressiveness: 0.9,
        visualQuirks: ['Unpredictable movements', 'Chaotic light patterns']
      }
    };

    const perfectionistVisual: DeviceVisual = {
      id: 'perfectionist-printer',
      model3D: {} as any,
      position: { x: 0, y: 0, z: 0 },
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    const chaosVisual: DeviceVisual = {
      id: 'chaos-assistant',
      model3D: {} as any,
      position: { x: 4, y: 0, z: 0 },
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    this.simulator.addDevice('perfectionist-printer', perfectionistVisual, perfectionist);
    this.simulator.addDevice('chaos-assistant', chaosVisual, chaosAgent);

    console.log('🖨️ Added Perfectionist Printer (everything must be perfect)');
    console.log('🎲 Added Chaos Assistant (embraces randomness and risk)');
    console.log('💢 Complete opposites that will drive each other crazy!\n');
  }

  public startDemo(scenario: 'authority' | 'resource' | 'personality' = 'authority', duration: number = 15000): void {
    if (this.isRunning) {
      console.log('Demo is already running!');
      return;
    }

    console.log('⚡ Starting Device Conflict Demo\n');
    console.log('=' .repeat(60));

    switch (scenario) {
      case 'authority':
        this.createAuthorityConflictScenario();
        break;
      case 'resource':
        this.createResourceCompetitionScenario();
        break;
      case 'personality':
        this.createPersonalityClashScenario();
        break;
    }

    this.isRunning = true;
    this.simulator.startSimulation();

    console.log(`⏱️ Demo will run for ${duration / 1000} seconds...`);
    console.log('🎭 Watch for conflicts and dramatic moments below:\n');

    // Periodically show status updates
    const statusInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(statusInterval);
        return;
      }

      const conflicts = this.simulator.getActiveConflicts();
      const tensions = this.simulator.getTensionStates();
      const competitions = this.simulator.getResourceCompetitions();

      if (conflicts.length > 0 || tensions.length > 0 || competitions.length > 0) {
        console.log('\n📊 Current Status:');
        console.log(`   Active Conflicts: ${conflicts.length}`);
        console.log(`   High Tension Devices: ${tensions.filter(t => t.tensionLevel > 0.5).length}`);
        console.log(`   Resource Competitions: ${competitions.length}`);
        
        if (conflicts.length > 0) {
          console.log('   Conflict Types:', conflicts.map(c => c.conflictType).join(', '));
        }
      }
    }, 5000);

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

    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Conflict Demo Complete!');
    
    // Show final statistics
    const devices = this.simulator.getDevices();
    const connections = this.simulator.getConnections();
    const conflicts = this.simulator.getActiveConflicts();
    const tensions = this.simulator.getTensionStates();
    const competitions = this.simulator.getResourceCompetitions();

    console.log('\n📈 Final Statistics:');
    console.log(`   Devices: ${devices.length}`);
    console.log(`   Connections: ${connections.length}`);
    console.log(`   Active Conflicts: ${conflicts.length}`);
    console.log(`   Tension States: ${tensions.length}`);
    console.log(`   Resource Competitions: ${competitions.length}`);

    if (conflicts.length > 0) {
      console.log('\n⚡ Active Conflicts:');
      conflicts.forEach(conflict => {
        console.log(`   ${conflict.conflictType}: ${conflict.participatingDevices.join(' vs ')} (${conflict.severity})`);
      });
    }

    if (tensions.length > 0) {
      console.log('\n😤 Device Tensions:');
      tensions.forEach(tension => {
        if (tension.tensionLevel > 0.3) {
          console.log(`   ${tension.deviceId}: ${(tension.tensionLevel * 100).toFixed(0)}% tension`);
        }
      });
    }

    if (competitions.length > 0) {
      console.log('\n🔋 Resource Competitions:');
      competitions.forEach(competition => {
        console.log(`   ${competition.resourceType}: ${competition.competingDevices.length} devices competing`);
        console.log(`     Intensity: ${(competition.competitionIntensity * 100).toFixed(0)}%`);
      });
    }

    console.log('\n💡 Try different scenarios:');
    console.log('   - Authority conflicts between overconfident devices');
    console.log('   - Resource competition with resource-hungry devices');
    console.log('   - Personality clashes between incompatible types');
  }

  public dispose(): void {
    this.stopDemo();
    this.simulator.dispose();
  }
}

// Example usage
if (typeof window === 'undefined') {
  // Node.js environment - run demo
  const demo = new ConflictDemo();
  
  console.log('Choose conflict demo scenario:');
  console.log('1. Authority Conflict (overconfident devices fighting for control)');
  console.log('2. Resource Competition (devices competing for limited resources)');
  console.log('3. Personality Clash (incompatible device personalities)');
  
  // Run authority conflict scenario by default
  demo.startDemo('authority', 20000);
  
  // Cleanup after demo
  setTimeout(() => {
    demo.dispose();
    process.exit(0);
  }, 21000);
}