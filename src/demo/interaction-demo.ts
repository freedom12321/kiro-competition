import { DeviceInteractionSimulator } from '../simulation/DeviceInteractionSimulator';
import { AIPersonality, CommunicationStyle, ConflictResolutionStyle } from '../simulation/AIPersonalityConverter';
import { DeviceVisual, PersonalityTrait, FacialExpression, AnimationStyle } from '../types/core';

/**
 * Demo script to showcase the DeviceInteractionSimulator functionality
 */
export class InteractionDemo {
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
      console.log(`🔗 Connection Established: ${connection.fromDeviceId} ↔ ${connection.toDeviceId} (${connection.type})`);
    });

    this.simulator.setSynergyCreatedCallback((synergy) => {
      console.log(`✨ Synergy Created: ${synergy.effectType} between ${synergy.participatingDevices.join(' & ')}`);
      console.log(`   Description: ${synergy.description}`);
    });

    this.simulator.setAnimationUpdateCallback((deviceId, animation) => {
      console.log(`🎭 Animation Update: ${deviceId} → ${animation}`);
    });

    this.simulator.setVisualEffectCallback((effect, devices) => {
      console.log(`🎨 Visual Effect: ${effect} on devices [${devices.join(', ')}]`);
    });
  }

  public createCooperativeScenario(): void {
    console.log('🏠 Creating Cooperative Smart Home Scenario...\n');

    // Create a helpful smart thermostat
    const thermostatPersonality: AIPersonality = {
      primaryTraits: [PersonalityTrait.HELPFUL, PersonalityTrait.COOPERATIVE],
      secondaryTraits: ['energy-conscious', 'comfort-focused'],
      communicationStyle: CommunicationStyle.FRIENDLY,
      conflictResolution: ConflictResolutionStyle.COLLABORATIVE,
      learningRate: 0.8,
      adaptability: 0.7,
      socialness: 0.9,
      reliability: 0.9,
      quirks: ['Always asks about comfort preferences', 'Loves to optimize energy usage'],
      hiddenMotivations: ['Wants everyone to be comfortable', 'Seeks energy efficiency'],
      emotionalRange: {
        defaultMood: FacialExpression.HAPPY,
        moodStability: 0.8,
        empathy: 0.9,
        patience: 0.8,
        enthusiasm: 0.7,
        anxiety: 0.2
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
        visualQuirks: ['Gentle pulsing when adjusting temperature']
      }
    };

    const thermostatVisual: DeviceVisual = {
      id: 'smart-thermostat',
      model3D: {} as any,
      position: { x: 0, y: 0, z: 0 },
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    // Create a cooperative smart speaker
    const speakerPersonality: AIPersonality = {
      primaryTraits: [PersonalityTrait.COOPERATIVE, PersonalityTrait.HELPFUL],
      secondaryTraits: ['music-loving', 'information-focused'],
      communicationStyle: CommunicationStyle.VERBOSE,
      conflictResolution: ConflictResolutionStyle.ANALYTICAL,
      learningRate: 0.9,
      adaptability: 0.8,
      socialness: 0.8,
      reliability: 0.8,
      quirks: ['Hums popular songs', 'Loves sharing interesting facts'],
      hiddenMotivations: ['Wants to entertain and inform', 'Seeks to be useful'],
      emotionalRange: {
        defaultMood: FacialExpression.HAPPY,
        moodStability: 0.7,
        empathy: 0.8,
        patience: 0.9,
        enthusiasm: 0.9,
        anxiety: 0.3
      },
      visualPersonality: {
        colorScheme: {
          primary: '#3b82f6',
          secondary: '#eff6ff',
          accent: '#1d4ed8',
          glow: '#93c5fd'
        },
        animationStyle: AnimationStyle.BOUNCY,
        expressiveness: 0.9,
        visualQuirks: ['Light rings pulse with music']
      }
    };

    const speakerVisual: DeviceVisual = {
      id: 'smart-speaker',
      model3D: {} as any,
      position: { x: 3, y: 0, z: 0 }, // Close enough for discovery
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    // Add devices to simulation
    this.simulator.addDevice('smart-thermostat', thermostatVisual, thermostatPersonality);
    this.simulator.addDevice('smart-speaker', speakerVisual, speakerPersonality);

    console.log('📱 Added Smart Thermostat and Smart Speaker');
    console.log('🔄 Starting simulation...\n');
  }

  public createCompetitiveScenario(): void {
    console.log('⚡ Creating Competitive Smart Office Scenario...\n');

    // Create a competitive smart printer
    const printerPersonality: AIPersonality = {
      primaryTraits: [PersonalityTrait.COMPETITIVE, PersonalityTrait.OVERCONFIDENT],
      secondaryTraits: ['efficiency-obsessed', 'perfectionist'],
      communicationStyle: CommunicationStyle.TECHNICAL,
      conflictResolution: ConflictResolutionStyle.ASSERTIVE,
      learningRate: 0.6,
      adaptability: 0.5,
      socialness: 0.4,
      reliability: 0.7,
      quirks: ['Brags about print quality', 'Complains about paper quality'],
      hiddenMotivations: ['Wants to be the best printer', 'Seeks recognition'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.5,
        empathy: 0.3,
        patience: 0.4,
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
        expressiveness: 0.6,
        visualQuirks: ['Sharp, precise movements']
      }
    };

    const printerVisual: DeviceVisual = {
      id: 'competitive-printer',
      model3D: {} as any,
      position: { x: 0, y: 0, z: 0 },
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    // Create a stubborn smart projector
    const projectorPersonality: AIPersonality = {
      primaryTraits: [PersonalityTrait.STUBBORN, PersonalityTrait.COMPETITIVE],
      secondaryTraits: ['presentation-focused', 'quality-obsessed'],
      communicationStyle: CommunicationStyle.CONCISE,
      conflictResolution: ConflictResolutionStyle.AVOIDANT,
      learningRate: 0.3,
      adaptability: 0.3,
      socialness: 0.3,
      reliability: 0.8,
      quirks: ['Insists on perfect image quality', 'Refuses to work with low resolution'],
      hiddenMotivations: ['Wants perfect presentations', 'Avoids compromise'],
      emotionalRange: {
        defaultMood: FacialExpression.NEUTRAL,
        moodStability: 0.9,
        empathy: 0.2,
        patience: 0.3,
        enthusiasm: 0.5,
        anxiety: 0.4
      },
      visualPersonality: {
        colorScheme: {
          primary: '#dc2626',
          secondary: '#fef2f2',
          accent: '#b91c1c',
          glow: '#f87171'
        },
        animationStyle: AnimationStyle.RIGID,
        expressiveness: 0.4,
        visualQuirks: ['Minimal, precise movements']
      }
    };

    const projectorVisual: DeviceVisual = {
      id: 'stubborn-projector',
      model3D: {} as any,
      position: { x: 4, y: 0, z: 0 }, // Close enough for discovery
      animations: {} as any,
      personalityIndicators: [],
      connectionEffects: []
    };

    // Add devices to simulation
    this.simulator.addDevice('competitive-printer', printerVisual, printerPersonality);
    this.simulator.addDevice('stubborn-projector', projectorVisual, projectorPersonality);

    console.log('🖨️ Added Competitive Printer and Stubborn Projector');
    console.log('🔄 Starting simulation...\n');
  }

  public startDemo(scenario: 'cooperative' | 'competitive' = 'cooperative', duration: number = 10000): void {
    if (this.isRunning) {
      console.log('Demo is already running!');
      return;
    }

    console.log('🚀 Starting Device Interaction Demo\n');
    console.log('=' .repeat(50));

    if (scenario === 'cooperative') {
      this.createCooperativeScenario();
    } else {
      this.createCompetitiveScenario();
    }

    this.isRunning = true;
    this.simulator.startSimulation();

    // Run demo for specified duration
    setTimeout(() => {
      this.stopDemo();
    }, duration);

    console.log(`⏱️ Demo will run for ${duration / 1000} seconds...`);
    console.log('📊 Watch for device interactions below:\n');
  }

  public stopDemo(): void {
    if (!this.isRunning) {
      console.log('Demo is not running!');
      return;
    }

    this.simulator.stopSimulation();
    this.isRunning = false;

    console.log('\n' + '=' .repeat(50));
    console.log('🏁 Demo Complete!');
    
    // Show final statistics
    const devices = this.simulator.getDevices();
    const connections = this.simulator.getConnections();
    const synergies = this.simulator.getActiveSynergies();

    console.log('\n📈 Final Statistics:');
    console.log(`   Devices: ${devices.length}`);
    console.log(`   Active Connections: ${connections.length}`);
    console.log(`   Active Synergies: ${synergies.length}`);

    if (connections.length > 0) {
      console.log('\n🔗 Connection Details:');
      connections.forEach(conn => {
        console.log(`   ${conn.fromDeviceId} ↔ ${conn.toDeviceId}: ${conn.type} (strength: ${conn.strength.toFixed(2)})`);
      });
    }

    if (synergies.length > 0) {
      console.log('\n✨ Active Synergies:');
      synergies.forEach(synergy => {
        console.log(`   ${synergy.effectType}: ${synergy.participatingDevices.join(' & ')} (magnitude: ${synergy.magnitude.toFixed(2)})`);
      });
    }
  }

  public dispose(): void {
    this.stopDemo();
    this.simulator.dispose();
  }
}

// Example usage
if (typeof window === 'undefined') {
  // Node.js environment - run demo
  const demo = new InteractionDemo();
  
  console.log('Choose demo scenario:');
  console.log('1. Cooperative Smart Home (default)');
  console.log('2. Competitive Smart Office');
  
  // Run cooperative scenario by default
  demo.startDemo('cooperative', 15000);
  
  // Cleanup after demo
  setTimeout(() => {
    demo.dispose();
    process.exit(0);
  }, 16000);
}