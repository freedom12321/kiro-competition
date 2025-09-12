// Test script for DeviceConflictSystem
console.log('⚡ Testing Device Conflict System');
console.log('=' .repeat(50));

// Mock implementation for testing
class MockConflictSystem {
  constructor() {
    this.activeConflicts = new Map();
    this.tensionStates = new Map();
    this.resourceCompetitions = new Map();
    this.callbacks = {};
    console.log('✅ DeviceConflictSystem initialized');
  }

  analyzeDeviceInteractions(devices, connections) {
    console.log(`🔍 Analyzing ${devices.length} devices and ${connections.length} connections`);
    
    // Simulate conflict detection
    this.detectConflicts(devices, connections);
    this.updateTensions(devices);
    this.checkResourceCompetition(devices);
  }

  detectConflicts(devices, connections) {
    // Simulate authority conflicts between overconfident devices
    const overconfidentDevices = devices.filter(d => 
      d.personality.traits.includes('overconfident')
    );
    
    if (overconfidentDevices.length >= 2) {
      const conflict = {
        id: `authority-${Date.now()}`,
        type: 'authority_dispute',
        severity: 'serious_conflict',
        participatingDevices: overconfidentDevices.slice(0, 2).map(d => d.id),
        description: 'Two overconfident devices are fighting for system control',
        visualEffects: [
          {
            type: 'authority_clash',
            intensity: 0.8,
            duration: 8000,
            targetDevices: overconfidentDevices.slice(0, 2).map(d => d.id)
          }
        ]
      };
      
      this.activeConflicts.set(conflict.id, conflict);
      
      if (this.callbacks.onConflictDetected) {
        this.callbacks.onConflictDetected(conflict);
      }
    }

    // Simulate communication conflicts
    const failedConnections = connections.filter(c => c.successRate < 0.3);
    failedConnections.forEach(connection => {
      const conflict = {
        id: `comm-${connection.id}`,
        type: 'communication_breakdown',
        severity: 'moderate_disagreement',
        participatingDevices: [connection.fromDeviceId, connection.toDeviceId],
        description: `Communication has broken down between ${connection.fromDeviceId} and ${connection.toDeviceId}`,
        visualEffects: [
          {
            type: 'communication_static',
            intensity: 0.6,
            duration: 3000,
            targetDevices: [connection.fromDeviceId, connection.toDeviceId]
          }
        ]
      };
      
      this.activeConflicts.set(conflict.id, conflict);
      
      if (this.callbacks.onConflictDetected) {
        this.callbacks.onConflictDetected(conflict);
      }
    });
  }

  updateTensions(devices) {
    devices.forEach(device => {
      let tensionLevel = 0.2; // Base tension
      
      // Anxious devices have higher tension
      if (device.personality.traits.includes('anxious')) {
        tensionLevel += 0.3;
      }
      
      // Competitive devices create tension
      if (device.personality.traits.includes('competitive')) {
        tensionLevel += 0.2;
      }
      
      // Stubborn devices resist change, creating tension
      if (device.personality.traits.includes('stubborn')) {
        tensionLevel += 0.25;
      }
      
      const tension = {
        deviceId: device.id,
        tensionLevel: Math.min(1, tensionLevel),
        escalationRate: 0.1,
        lastEscalationTime: Date.now()
      };
      
      this.tensionStates.set(device.id, tension);
      
      // Trigger escalation callback for high tension
      if (tension.tensionLevel > 0.6 && this.callbacks.onTensionEscalated) {
        this.callbacks.onTensionEscalated(device.id, tension.tensionLevel);
      }
    });
  }

  checkResourceCompetition(devices) {
    // Simulate resource competition
    const resourceTypes = ['processing_power', 'network_bandwidth', 'energy'];
    
    resourceTypes.forEach(resourceType => {
      const demandingDevices = devices.filter(device => {
        // Overconfident and competitive devices demand more resources
        return device.personality.traits.includes('overconfident') ||
               device.personality.traits.includes('competitive') ||
               device.personality.traits.includes('anxious');
      });
      
      if (demandingDevices.length >= 2) {
        const competition = {
          resourceType,
          competingDevices: demandingDevices.map(d => d.id),
          totalDemand: demandingDevices.length * 0.8,
          availableSupply: 1.0,
          competitionIntensity: Math.min(1, demandingDevices.length * 0.4),
          visualIndicators: demandingDevices.map(device => ({
            deviceId: device.id,
            resourceType,
            currentUsage: Math.random() * 0.8 + 0.2,
            requestedAmount: Math.random() * 0.6 + 0.4,
            satisfactionLevel: Math.random() * 0.5 + 0.2,
            visualState: 'competing'
          }))
        };
        
        this.resourceCompetitions.set(resourceType, competition);
        
        if (this.callbacks.onResourceCompetition) {
          this.callbacks.onResourceCompetition(competition);
        }
        
        // Check for dramatic moments
        if (competition.competitionIntensity > 0.8) {
          const dramaticMoment = {
            type: 'resource_crisis',
            description: `Critical ${resourceType} shortage is causing system instability!`,
            involvedDevices: competition.competingDevices,
            intensity: 0.9,
            timestamp: Date.now()
          };
          
          if (this.callbacks.onDramaticMoment) {
            this.callbacks.onDramaticMoment(dramaticMoment);
          }
        }
      }
    });
  }

  // Callback setters
  setConflictDetectedCallback(callback) {
    this.callbacks.onConflictDetected = callback;
  }

  setTensionEscalatedCallback(callback) {
    this.callbacks.onTensionEscalated = callback;
  }

  setResourceCompetitionCallback(callback) {
    this.callbacks.onResourceCompetition = callback;
  }

  setDramaticMomentCallback(callback) {
    this.callbacks.onDramaticMoment = callback;
  }

  // Getters
  getActiveConflicts() {
    return Array.from(this.activeConflicts.values());
  }

  getTensionStates() {
    return Array.from(this.tensionStates.values());
  }

  getResourceCompetitions() {
    return Array.from(this.resourceCompetitions.values());
  }

  resolveConflict(conflictId) {
    if (this.activeConflicts.has(conflictId)) {
      this.activeConflicts.delete(conflictId);
      console.log(`✅ Resolved conflict: ${conflictId}`);
      return true;
    }
    return false;
  }

  dispose() {
    this.activeConflicts.clear();
    this.tensionStates.clear();
    this.resourceCompetitions.clear();
    console.log('✅ Conflict system disposed');
  }
}

// Test the conflict system
function runConflictTest() {
  console.log('\n🚀 Starting Conflict System Test\n');
  
  const conflictSystem = new MockConflictSystem();
  
  // Set up callbacks
  conflictSystem.setConflictDetectedCallback((conflict) => {
    console.log(`⚡ CONFLICT: ${conflict.type} between ${conflict.participatingDevices.join(' vs ')}`);
    console.log(`   Severity: ${conflict.severity}`);
    console.log(`   Description: ${conflict.description}`);
    console.log(`   Visual Effects: ${conflict.visualEffects.length} effects`);
  });
  
  conflictSystem.setTensionEscalatedCallback((deviceId, tensionLevel) => {
    console.log(`😤 TENSION: ${deviceId} tension escalated to ${(tensionLevel * 100).toFixed(0)}%`);
  });
  
  conflictSystem.setResourceCompetitionCallback((competition) => {
    console.log(`🔋 RESOURCE COMPETITION: ${competition.resourceType}`);
    console.log(`   Competing devices: ${competition.competingDevices.join(', ')}`);
    console.log(`   Intensity: ${(competition.competitionIntensity * 100).toFixed(0)}%`);
  });
  
  conflictSystem.setDramaticMomentCallback((moment) => {
    console.log(`🎭 DRAMATIC MOMENT: ${moment.type}`);
    console.log(`   Intensity: ${(moment.intensity * 100).toFixed(0)}%`);
    console.log(`   Description: ${moment.description}`);
    console.log(`   Involved: ${moment.involvedDevices.join(', ')}`);
  });
  
  // Create test devices with conflicting personalities
  const testDevices = [
    {
      id: 'bossy-thermostat',
      personality: {
        traits: ['overconfident', 'stubborn'],
        reliability: 0.9,
        socialness: 0.4
      }
    },
    {
      id: 'dominant-speaker',
      personality: {
        traits: ['overconfident', 'competitive'],
        reliability: 0.8,
        socialness: 0.8
      }
    },
    {
      id: 'anxious-camera',
      personality: {
        traits: ['anxious', 'stubborn'],
        reliability: 0.7,
        socialness: 0.3
      }
    },
    {
      id: 'competitive-assistant',
      personality: {
        traits: ['competitive', 'overconfident'],
        reliability: 0.6,
        socialness: 0.7
      }
    }
  ];
  
  // Create test connections with some failures
  const testConnections = [
    {
      id: 'conn-1',
      fromDeviceId: 'bossy-thermostat',
      toDeviceId: 'dominant-speaker',
      successRate: 0.2, // Poor communication
      type: 'communication'
    },
    {
      id: 'conn-2',
      fromDeviceId: 'anxious-camera',
      toDeviceId: 'competitive-assistant',
      successRate: 0.1, // Very poor communication
      type: 'communication'
    }
  ];
  
  console.log('📱 Created test devices with conflicting personalities');
  console.log('🔗 Created test connections with communication failures');
  console.log('\n🔍 Running conflict analysis...\n');
  
  // Run conflict analysis
  conflictSystem.analyzeDeviceInteractions(testDevices, testConnections);
  
  // Show results after a short delay
  setTimeout(() => {
    console.log('\n📊 Analysis Results:');
    console.log(`   Active Conflicts: ${conflictSystem.getActiveConflicts().length}`);
    console.log(`   Tension States: ${conflictSystem.getTensionStates().length}`);
    console.log(`   Resource Competitions: ${conflictSystem.getResourceCompetitions().length}`);
    
    // Test conflict resolution
    const conflicts = conflictSystem.getActiveConflicts();
    if (conflicts.length > 0) {
      console.log(`\n🛠️ Attempting to resolve conflict: ${conflicts[0].id}`);
      const resolved = conflictSystem.resolveConflict(conflicts[0].id);
      console.log(`   Resolution ${resolved ? 'successful' : 'failed'}`);
    }
    
    conflictSystem.dispose();
    console.log('\n🎉 Conflict system test completed successfully!');
  }, 1000);
}

// Run the test
runConflictTest();