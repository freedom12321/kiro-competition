// Simple test to check GameIntegrationSystem instantiation
const { GameIntegrationSystem } = require('./src/engine/GameIntegrationSystem');

console.log('Starting simple integration test...');

try {
  // Create a mock container
  const mockContainer = {
    id: 'game-container',
    appendChild: () => {},
    removeChild: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {} }
  };
  
  console.log('Creating GameIntegrationSystem...');
  const system = new GameIntegrationSystem(mockContainer);
  console.log('GameIntegrationSystem created successfully');
  console.log('Current mode:', system.getCurrentMode());
} catch (error) {
  console.error('Error creating GameIntegrationSystem:', error);
}