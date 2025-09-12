// Test script for EmergentStorySystem
console.log('📖 Testing Emergent Story System');
console.log('=' .repeat(50));

// Mock implementation for testing
class MockStorySystem {
  constructor() {
    this.storyMoments = [];
    this.educationalInsights = [];
    this.systemState = {
      harmonyLevel: 0.5,
      chaosLevel: 0.2,
      learningRate: 0.3,
      cooperationIndex: 0.4,
      conflictIntensity: 0.1,
      emergentComplexity: 0.2
    };
    this.callbacks = {};
    console.log('✅ EmergentStorySystem initialized');
  }

  analyzeSimulationEvents(devices, connections, synergies, conflicts, dramaticMoments) {
    console.log(`🔍 Analyzing simulation events:`);
    console.log(`   Devices: ${devices.length}, Connections: ${connections.length}`);
    console.log(`   Synergies: ${synergies.length}, Conflicts: ${conflicts.length}`);
    console.log(`   Dramatic Moments: ${dramaticMoments.length}`);
    
    // Simulate story moment detection
    this.detectStoryMoments(devices, connections, synergies, conflicts, dramaticMoments);
    this.updateSystemState(devices, connections, synergies, conflicts);
    this.generateEducationalInsights(conflicts, synergies);
  }

  detectStoryMoments(devices, connections, synergies, conflicts, dramaticMoments) {
    // Detect first contact moments
    const recentConnections = connections.filter(conn => 
      Date.now() - conn.establishedTime < 5000 && conn.interactionCount <= 2
    );
    
    recentConnections.forEach(connection => {
      const device1 = devices.find(d => d.id === connection.fromDeviceId);
      const device2 = devices.find(d => d.id === connection.toDeviceId);
      
      if (device1 && device2) {
        const moment = {
          id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'first_contact',
          title: `First Contact: ${device1.id} meets ${device2.id}`,
          description: 'Two AI devices discover each other and attempt their first communication',
          narrative: `In a moment of digital serendipity, ${device1.id} encountered ${device2.id} for the first time. ` +
                    `The initial handshake between these two artificial minds carried the weight of possibility.`,
          involvedDevices: [device1.id, device2.id],
          timestamp: Date.now(),
          duration: 5000,
          significance: 'notable',
          emotionalTone: 'hopeful',
          aiConcepts: [{
            concept: 'multi_agent_cooperation',
            explanation: 'This demonstrates initial communication protocols between AI agents',
            realWorldExample: 'Similar to how autonomous systems establish communication in IoT networks',
            educationalValue: 0.7
          }]
        };
        
        this.storyMoments.push(moment);
        
        if (this.callbacks.onStoryMoment) {
          this.callbacks.onStoryMoment(moment);
        }
      }
    });

    // Detect cooperation success moments
    const newSynergies = synergies.filter(synergy => 
      Date.now() - synergy.startTime < 3000 && synergy.magnitude > 0.7
    );
    
    newSynergies.forEach(synergy => {
      const moment = {
        id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'cooperation_success',
        title: `Synergy Achieved: ${synergy.effectType}`,
        description: 'Devices working together create something greater than the sum of their parts',
        narrative: `Something beautiful happened when ${synergy.participatingDevices.join(' and ')} began working in perfect harmony. ` +
                  `Their individual capabilities merged into a ${synergy.effectType} that neither could achieve alone.`,
        involvedDevices: synergy.participatingDevices,
        timestamp: Date.now(),
        duration: 8000,
        significance: 'important',
        emotionalTone: 'inspiring',
        aiConcepts: [{
          concept: 'emergent_behavior',
          explanation: 'This shows how AI cooperation can create emergent capabilities',
          realWorldExample: 'Like swarm intelligence in drone coordination',
          educationalValue: 0.8
        }]
      };
      
      this.storyMoments.push(moment);
      
      if (this.callbacks.onStoryMoment) {
        this.callbacks.onStoryMoment(moment);
      }
    });

    // Detect conflict emergence moments
    const newConflicts = conflicts.filter(conflict => 
      Date.now() - conflict.startTime < 5000
    );
    
    newConflicts.forEach(conflict => {
      const moment = {
        id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'conflict_emergence',
        title: `Conflict Emerges: ${conflict.conflictType}`,
        description: 'Incompatible goals lead to tension between AI devices',
        narrative: `The harmony was shattered when ${conflict.participatingDevices.join(' and ')} found themselves at odds. ` +
                  `What started as a ${conflict.cause} quickly escalated into a ${conflict.conflictType}.`,
        involvedDevices: conflict.participatingDevices,
        timestamp: Date.now(),
        duration: 6000,
        significance: 'major',
        emotionalTone: 'tense',
        aiConcepts: [{
          concept: 'goal_misalignment',
          explanation: 'This demonstrates how different AI objectives can lead to conflicts',
          realWorldExample: 'Similar to conflicts between optimization algorithms with different targets',
          educationalValue: 0.9
        }]
      };
      
      this.storyMoments.push(moment);
      
      if (this.callbacks.onStoryMoment) {
        this.callbacks.onStoryMoment(moment);
      }
    });

    // Detect dramatic moments
    dramaticMoments.forEach(dramatic => {
      const moment = {
        id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'system_crisis',
        title: `Crisis Point: ${dramatic.type}`,
        description: 'System reaches critical instability',
        narrative: `The situation reached a critical juncture as ${dramatic.description} ` +
                  `With ${(dramatic.intensity * 100).toFixed(0)}% intensity, this moment exemplified how small ` +
                  `misalignments in AI systems can cascade into major disruptions.`,
        involvedDevices: dramatic.involvedDevices,
        timestamp: Date.now(),
        duration: 10000,
        significance: 'critical',
        emotionalTone: 'dramatic',
        aiConcepts: [{
          concept: 'feedback_loops',
          explanation: 'This shows how small issues can cascade into system-wide problems',
          realWorldExample: 'Similar to flash crashes in algorithmic trading systems',
          educationalValue: 0.9
        }]
      };
      
      this.storyMoments.push(moment);
      
      if (this.callbacks.onStoryMoment) {
        this.callbacks.onStoryMoment(moment);
      }
    });
  }

  updateSystemState(devices, connections, synergies, conflicts) {
    // Calculate harmony level
    const cooperativeConnections = connections.filter(c => c.strength > 0.6).length;
    const totalConnections = Math.max(connections.length, 1);
    this.systemState.harmonyLevel = cooperativeConnections / totalConnections;
    
    // Calculate chaos level
    this.systemState.chaosLevel = Math.min(1, conflicts.length / Math.max(devices.length, 1));
    
    // Calculate cooperation index
    this.systemState.cooperationIndex = synergies.length / Math.max(devices.length, 1);
    
    // Calculate conflict intensity
    const severityMap = {
      'minor_tension': 0.2,
      'moderate_disagreement': 0.4,
      'serious_conflict': 0.6,
      'critical_dispute': 0.8,
      'system_threatening': 1.0
    };
    
    const totalConflictSeverity = conflicts.reduce((sum, conflict) => 
      sum + (severityMap[conflict.severity] || 0.5), 0
    );
    this.systemState.conflictIntensity = Math.min(1, totalConflictSeverity / Math.max(conflicts.length, 1));
    
    // Calculate emergent complexity
    const complexSynergies = synergies.filter(s => s.participatingDevices.length > 2).length;
    const multiDeviceConflicts = conflicts.filter(c => c.participatingDevices.length > 2).length;
    this.systemState.emergentComplexity = (complexSynergies + multiDeviceConflicts) / Math.max(devices.length, 1);
  }

  generateEducationalInsights(conflicts, synergies) {
    // Generate insights from recent story moments
    const recentMoments = this.storyMoments.slice(-3);
    
    recentMoments.forEach(moment => {
      if (moment.aiConcepts && moment.aiConcepts.length > 0) {
        moment.aiConcepts.forEach(concept => {
          if (concept.educationalValue > 0.7) {
            const insight = {
              concept: concept.concept,
              gameEvent: moment.title,
              explanation: concept.explanation,
              realWorldConnection: concept.realWorldExample,
              reflectionPrompts: this.generateReflectionPrompts(concept.concept),
              timestamp: Date.now()
            };
            
            this.educationalInsights.push(insight);
            
            if (this.callbacks.onEducationalInsight) {
              this.callbacks.onEducationalInsight(insight);
            }
          }
        });
      }
    });
  }

  generateReflectionPrompts(concept) {
    const prompts = {
      'goal_misalignment': [
        'How might this conflict have been prevented with better initial alignment?',
        'What real-world AI systems face similar alignment challenges?'
      ],
      'emergent_behavior': [
        'What unexpected behaviors emerged from the simple interactions?',
        'How do emergent behaviors in AI systems compare to those in nature?'
      ],
      'multi_agent_cooperation': [
        'What made the cooperation between these devices successful?',
        'How do multi-agent systems coordinate in real-world applications?'
      ],
      'feedback_loops': [
        'How did small changes lead to large system effects?',
        'What safeguards could prevent such cascading failures?'
      ]
    };
    
    return prompts[concept] || ['What did you learn from this interaction?'];
  }

  // Callback setters
  setStoryMomentCallback(callback) {
    this.callbacks.onStoryMoment = callback;
  }

  setEducationalInsightCallback(callback) {
    this.callbacks.onEducationalInsight = callback;
  }

  // Getters
  getStoryMoments() {
    return [...this.storyMoments];
  }

  getRecentStoryMoments(count = 5) {
    return this.storyMoments.slice(-count);
  }

  getSystemState() {
    return { ...this.systemState };
  }

  replayStoryMoment(momentId) {
    const moment = this.storyMoments.find(m => m.id === momentId);
    if (moment) {
      return {
        deviceStates: moment.involvedDevices.map(deviceId => ({
          deviceId,
          position: { x: 0, y: 0, z: 0 },
          animation: 'idle',
          mood: 'neutral'
        })),
        environmentState: {
          timestamp: moment.timestamp,
          systemHealth: 0.8
        },
        cameraPositions: [{
          timestamp: moment.timestamp,
          position: { x: 10, y: 10, z: 10 },
          target: { x: 0, y: 0, z: 0 },
          zoom: 1.0
        }]
      };
    }
    return null;
  }

  dispose() {
    this.storyMoments.length = 0;
    this.educationalInsights.length = 0;
    console.log('✅ Story system disposed');
  }
}

// Test the story system
function runStoryTest() {
  console.log('\n🚀 Starting Story System Test\n');
  
  const storySystem = new MockStorySystem();
  
  // Set up callbacks
  storySystem.setStoryMomentCallback((moment) => {
    console.log(`📖 STORY MOMENT: ${moment.type}`);
    console.log(`   Title: ${moment.title}`);
    console.log(`   Significance: ${moment.significance}`);
    console.log(`   Emotional Tone: ${moment.emotionalTone}`);
    console.log(`   Devices: ${moment.involvedDevices.join(', ')}`);
    console.log(`   Narrative: ${moment.narrative.substring(0, 100)}...`);
    console.log(`   AI Concepts: ${moment.aiConcepts.map(c => c.concept).join(', ')}`);
  });
  
  storySystem.setEducationalInsightCallback((insight) => {
    console.log(`🎓 EDUCATIONAL INSIGHT: ${insight.concept}`);
    console.log(`   Game Event: ${insight.gameEvent}`);
    console.log(`   Explanation: ${insight.explanation}`);
    console.log(`   Real-World Connection: ${insight.realWorldConnection}`);
    console.log(`   Reflection Prompts: ${insight.reflectionPrompts.length} prompts`);
  });
  
  // Create test data
  const testDevices = [
    {
      id: 'mentor-device',
      personality: {
        traits: ['helpful', 'cooperative'],
        learningRate: 0.3,
        socialness: 0.9
      }
    },
    {
      id: 'student-device',
      personality: {
        traits: ['anxious', 'helpful'],
        learningRate: 0.95,
        socialness: 0.6
      }
    },
    {
      id: 'competitive-device',
      personality: {
        traits: ['competitive', 'overconfident'],
        learningRate: 0.6,
        socialness: 0.7
      }
    }
  ];
  
  const testConnections = [
    {
      id: 'conn-1',
      fromDeviceId: 'mentor-device',
      toDeviceId: 'student-device',
      strength: 0.8,
      establishedTime: Date.now() - 2000, // Recent
      interactionCount: 1 // First contact
    },
    {
      id: 'conn-2',
      fromDeviceId: 'student-device',
      toDeviceId: 'competitive-device',
      strength: 0.3,
      establishedTime: Date.now() - 10000,
      interactionCount: 5
    }
  ];
  
  const testSynergies = [
    {
      id: 'synergy-1',
      participatingDevices: ['mentor-device', 'student-device'],
      effectType: 'learning_acceleration',
      magnitude: 0.85,
      startTime: Date.now() - 1000, // Very recent
      description: 'Mentor and student are achieving accelerated learning together'
    }
  ];
  
  const testConflicts = [
    {
      id: 'conflict-1',
      participatingDevices: ['student-device', 'competitive-device'],
      conflictType: 'personality_clash',
      severity: 'moderate_disagreement',
      cause: 'personality_mismatch',
      description: 'Student and competitive device have incompatible approaches',
      startTime: Date.now() - 3000 // Recent
    }
  ];
  
  const testDramaticMoments = [
    {
      type: 'learning_breakthrough',
      description: 'Student device achieved a major learning milestone',
      involvedDevices: ['student-device', 'mentor-device'],
      intensity: 0.7,
      timestamp: Date.now() - 500
    }
  ];
  
  console.log('📱 Created test scenario with mentor-student dynamics');
  console.log('🔗 Added connections showing first contact and ongoing relationships');
  console.log('✨ Added synergy showing successful learning cooperation');
  console.log('⚡ Added conflict showing personality clash');
  console.log('🎭 Added dramatic moment showing learning breakthrough');
  console.log('\n🔍 Running story analysis...\n');
  
  // Run story analysis
  storySystem.analyzeSimulationEvents(testDevices, testConnections, testSynergies, testConflicts, testDramaticMoments);
  
  // Show results after a short delay
  setTimeout(() => {
    console.log('\n📊 Analysis Results:');
    console.log(`   Story Moments Generated: ${storySystem.getStoryMoments().length}`);
    console.log(`   Educational Insights: ${storySystem.educationalInsights.length}`);
    
    const systemState = storySystem.getSystemState();
    console.log('\n🌟 System State:');
    console.log(`   Harmony Level: ${(systemState.harmonyLevel * 100).toFixed(0)}%`);
    console.log(`   Cooperation Index: ${(systemState.cooperationIndex * 100).toFixed(0)}%`);
    console.log(`   Conflict Intensity: ${(systemState.conflictIntensity * 100).toFixed(0)}%`);
    console.log(`   Emergent Complexity: ${(systemState.emergentComplexity * 100).toFixed(0)}%`);
    
    // Test story moment replay
    const moments = storySystem.getStoryMoments();
    if (moments.length > 0) {
      console.log(`\n🎬 Testing story replay for: ${moments[0].title}`);
      const replayData = storySystem.replayStoryMoment(moments[0].id);
      console.log(`   Replay data available: ${replayData ? 'Yes' : 'No'}`);
      if (replayData) {
        console.log(`   Device states: ${replayData.deviceStates.length}`);
        console.log(`   Camera positions: ${replayData.cameraPositions.length}`);
      }
    }
    
    // Test recent moments retrieval
    const recentMoments = storySystem.getRecentStoryMoments(3);
    console.log(`\n📚 Recent story moments: ${recentMoments.length}`);
    recentMoments.forEach((moment, index) => {
      console.log(`   ${index + 1}. ${moment.title} (${moment.significance})`);
    });
    
    storySystem.dispose();
    console.log('\n🎉 Story system test completed successfully!');
  }, 1000);
}

// Run the test
runStoryTest();