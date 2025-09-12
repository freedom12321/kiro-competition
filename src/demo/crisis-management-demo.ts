import { CrisisManagementSystem } from '../simulation/CrisisManagementSystem';
import { CrisisType } from '../types/core';

// Demo of Crisis Management System functionality
export function runCrisisManagementDemo(): void {
  console.log('🚨 Crisis Management System Demo Starting...');

  // Create container for the crisis management panel
  const container = document.createElement('div');
  container.id = 'crisis-demo-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '9999';
  container.style.display = 'none';
  document.body.appendChild(container);

  // Initialize crisis management system
  const crisisSystem = new CrisisManagementSystem(container, {
    autoDetectionEnabled: true,
    interventionThreshold: 0.7,
    emergencyProtocolsEnabled: true,
    manualOverrideAllowed: true
  });

  // Register some demo devices
  console.log('📱 Registering demo devices...');
  crisisSystem.registerDevice('smart-thermostat', {
    priority: 60,
    resourceUsage: 0.4,
    communicationActive: true
  });

  crisisSystem.registerDevice('security-camera', {
    priority: 80,
    resourceUsage: 0.6,
    communicationActive: true
  });

  crisisSystem.registerDevice('smart-speaker', {
    priority: 40,
    resourceUsage: 0.3,
    communicationActive: true
  });

  crisisSystem.registerDevice('smart-lights', {
    priority: 30,
    resourceUsage: 0.2,
    communicationActive: true
  });

  // Set up system update callback
  crisisSystem.setSystemUpdateCallback((devices) => {
    console.log('📊 System Update:', devices.map(d => ({
      id: d.id,
      operational: d.operational,
      isolated: d.isolated,
      priority: d.priority,
      resourceUsage: d.resourceUsage
    })));
  });

  // Demo scenario 1: Gradual system degradation
  console.log('\n🔄 Demo Scenario 1: Gradual System Degradation');
  
  setTimeout(() => {
    console.log('⚠️ System health declining...');
    crisisSystem.updateSystemHealth({
      harmonyLevel: 0.7,
      conflictIntensity: 0.3,
      resourceUtilization: 0.8
    });
  }, 2000);

  setTimeout(() => {
    console.log('🚨 Crisis threshold reached!');
    crisisSystem.updateSystemHealth({
      stabilityIndex: 0.6, // Below threshold
      conflictIntensity: 0.8,
      harmonyLevel: 0.2
    });
    
    // Show the crisis panel
    container.style.display = 'block';
  }, 4000);

  // Demo scenario 2: Manual crisis triggering after 10 seconds
  setTimeout(() => {
    console.log('\n🔄 Demo Scenario 2: Manual Authority Conflict');
    crisisSystem.triggerCrisis(CrisisType.AUTHORITY_CONFLICT, ['smart-thermostat', 'security-camera']);
  }, 10000);

  // Demo scenario 3: Resource exhaustion after 15 seconds
  setTimeout(() => {
    console.log('\n🔄 Demo Scenario 3: Resource Exhaustion Crisis');
    crisisSystem.triggerCrisis(CrisisType.RESOURCE_EXHAUSTION, ['smart-thermostat', 'security-camera', 'smart-speaker']);
  }, 15000);

  // Demo recovery wizard after 18 seconds
  setTimeout(() => {
    console.log('\n🧙‍♂️ Demo: Starting Recovery Wizard');
    if (crisisSystem.getActiveCrisis()) {
      crisisSystem.startRecoveryWizard(crisisSystem.getActiveCrisis()!);
    }
  }, 18000);

  // Demo intervention tools after 20 seconds
  setTimeout(() => {
    console.log('\n🛠️ Demo: Testing Intervention Tools');
    
    // Test emergency stop
    console.log('🛑 Testing Emergency Stop...');
    crisisSystem['handleIntervention']({
      type: 'emergency_stop',
      deviceIds: ['smart-thermostat', 'security-camera'],
      parameters: {},
      priority: 'critical'
    }).then(result => {
      console.log('Emergency Stop Result:', result);
    });
  }, 20000);

  setTimeout(() => {
    // Test device isolation
    console.log('🔌 Testing Device Isolation...');
    crisisSystem['handleIntervention']({
      type: 'isolate_device',
      deviceIds: ['smart-speaker'],
      parameters: { reason: 'Demo isolation test' },
      priority: 'high'
    }).then(result => {
      console.log('Device Isolation Result:', result);
    });
  }, 25000);

  setTimeout(() => {
    // Test manual override
    console.log('🎛️ Testing Manual Override...');
    crisisSystem['handleIntervention']({
      type: 'manual_override',
      deviceIds: ['smart-lights'],
      parameters: { priority: 90, resources: 10, communication: false },
      priority: 'medium'
    }).then(result => {
      console.log('Manual Override Result:', result);
    });
  }, 30000);

  setTimeout(() => {
    // Test system reset
    console.log('🔄 Testing System Reset...');
    crisisSystem['handleIntervention']({
      type: 'system_reset',
      deviceIds: ['smart-thermostat', 'security-camera', 'smart-speaker', 'smart-lights'],
      parameters: { preserveConfiguration: true },
      priority: 'critical'
    }).then(result => {
      console.log('System Reset Result:', result);
      console.log('✅ Crisis Management Demo Complete!');
      
      // Hide the panel after demo
      setTimeout(() => {
        container.style.display = 'none';
      }, 5000);
    });
  }, 35000);

  // Add demo controls
  const demoControls = document.createElement('div');
  demoControls.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; font-family: monospace;">
      <h3>🚨 Crisis Management Demo</h3>
      <p>Check console for demo progress...</p>
      <button id="trigger-crisis-btn" style="margin: 5px; padding: 8px 12px; background: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Trigger Crisis
      </button>
      <button id="show-panel-btn" style="margin: 5px; padding: 8px 12px; background: #4444ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Show Panel
      </button>
      <button id="start-wizard-btn" style="margin: 5px; padding: 8px 12px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Recovery Wizard
      </button>
      <button id="hide-panel-btn" style="margin: 5px; padding: 8px 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Hide Panel
      </button>
      <button id="close-demo-btn" style="margin: 5px; padding: 8px 12px; background: #888; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Close Demo
      </button>
    </div>
  `;
  document.body.appendChild(demoControls);

  // Add event listeners for demo controls
  document.getElementById('trigger-crisis-btn')?.addEventListener('click', () => {
    crisisSystem.triggerCrisis(CrisisType.FEEDBACK_LOOP, ['smart-thermostat', 'security-camera']);
    container.style.display = 'block';
  });

  document.getElementById('show-panel-btn')?.addEventListener('click', () => {
    container.style.display = 'block';
  });

  document.getElementById('hide-panel-btn')?.addEventListener('click', () => {
    container.style.display = 'none';
  });

  document.getElementById('start-wizard-btn')?.addEventListener('click', () => {
    if (crisisSystem.getActiveCrisis()) {
      crisisSystem.startRecoveryWizard(crisisSystem.getActiveCrisis()!);
    } else {
      // Create a demo crisis for the wizard
      crisisSystem.triggerCrisis(CrisisType.FEEDBACK_LOOP, ['smart-thermostat', 'security-camera']);
      setTimeout(() => {
        if (crisisSystem.getActiveCrisis()) {
          crisisSystem.startRecoveryWizard(crisisSystem.getActiveCrisis()!);
        }
      }, 500);
    }
  });

  document.getElementById('close-demo-btn')?.addEventListener('click', () => {
    container.remove();
    demoControls.remove();
    console.log('🏁 Crisis Management Demo Closed');
  });

  console.log('🎮 Demo controls added to top-right corner');
  console.log('📝 Watch the console for demo progress and results');
}

// Auto-run demo if this file is loaded directly
if (typeof window !== 'undefined') {
  // Add demo to window for manual triggering
  (window as any).runCrisisManagementDemo = runCrisisManagementDemo;
  
  // Auto-run after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCrisisManagementDemo);
  } else {
    runCrisisManagementDemo();
  }
}