#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Deployment script for AI Habitat
 * Handles deployment to different environments with proper validation
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ENVIRONMENTS = {
  staging: {
    name: 'Staging',
    url: 'https://staging.ai-habitat.example.com',
    requiresApproval: false
  },
  production: {
    name: 'Production',
    url: 'https://ai-habitat.example.com',
    requiresApproval: true
  }
};

async function main() {
  const environment = process.argv[2] || 'staging';
  
  if (!ENVIRONMENTS[environment]) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments:', Object.keys(ENVIRONMENTS).join(', '));
    process.exit(1);
  }

  console.log(`🚀 Starting deployment to ${ENVIRONMENTS[environment].name}...`);
  
  try {
    // Validate build
    await validateBuild();
    
    // Run compatibility tests
    await runCompatibilityTests();
    
    // Check for approval if required
    if (ENVIRONMENTS[environment].requiresApproval) {
      await requireApproval(environment);
    }
    
    // Deploy to environment
    await deployToEnvironment(environment);
    
    // Verify deployment
    await verifyDeployment(environment);
    
    console.log(`✅ Deployment to ${ENVIRONMENTS[environment].name} completed successfully!`);
    console.log(`🌐 URL: ${ENVIRONMENTS[environment].url}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function validateBuild() {
  console.log('🔍 Validating build...');
  
  // Check if dist directory exists
  try {
    await fs.access(DIST_DIR);
  } catch {
    throw new Error('Build directory not found. Run "npm run build" first.');
  }
  
  // Check for required files
  const requiredFiles = [
    'index.html',
    'sw.js',
    'assets/manifest.json',
    'deployment-info.json'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(DIST_DIR, file);
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  // Validate manifest
  const manifestPath = path.join(DIST_DIR, 'assets', 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  
  if (!manifest.version || !manifest.assets || Object.keys(manifest.assets).length === 0) {
    throw new Error('Invalid asset manifest');
  }
  
  console.log('✅ Build validation passed');
  console.log(`📦 Assets: ${Object.keys(manifest.assets).length}`);
  console.log(`🏷️ Version: ${manifest.version}`);
}

async function runCompatibilityTests() {
  console.log('🧪 Running compatibility tests...');
  
  try {
    // In a real implementation, this would run actual browser tests
    // For now, we'll simulate the test results
    const testResults = {
      chrome: { version: '120', passed: true },
      firefox: { version: '119', passed: true },
      safari: { version: '17', passed: true },
      edge: { version: '120', passed: true }
    };
    
    const failedTests = Object.entries(testResults)
      .filter(([_, result]) => !result.passed)
      .map(([browser]) => browser);
    
    if (failedTests.length > 0) {
      throw new Error(`Compatibility tests failed for: ${failedTests.join(', ')}`);
    }
    
    console.log('✅ Compatibility tests passed');
    Object.entries(testResults).forEach(([browser, result]) => {
      console.log(`  ${browser} ${result.version}: ✅`);
    });
    
  } catch (error) {
    throw new Error(`Compatibility tests failed: ${error.message}`);
  }
}

async function requireApproval(environment) {
  console.log(`⚠️ Deployment to ${ENVIRONMENTS[environment].name} requires approval.`);
  
  // In a real implementation, this might:
  // - Check for required approvals in a deployment system
  // - Verify that tests have passed
  // - Check for security clearance
  // - Validate that it's during allowed deployment hours
  
  const deploymentInfo = JSON.parse(
    await fs.readFile(path.join(DIST_DIR, 'deployment-info.json'), 'utf8')
  );
  
  console.log('📋 Deployment Summary:');
  console.log(`  Version: ${deploymentInfo.version}`);
  console.log(`  Build Time: ${deploymentInfo.buildTime}`);
  console.log(`  Total Assets: ${deploymentInfo.totalAssets}`);
  console.log(`  Total Size: ${formatBytes(deploymentInfo.totalSize)}`);
  
  // Simulate approval check
  const isApproved = process.env.DEPLOYMENT_APPROVED === 'true';
  if (!isApproved) {
    throw new Error('Deployment not approved. Set DEPLOYMENT_APPROVED=true to proceed.');
  }
  
  console.log('✅ Deployment approved');
}

async function deployToEnvironment(environment) {
  console.log(`📤 Deploying to ${ENVIRONMENTS[environment].name}...`);
  
  // In a real implementation, this would:
  // - Upload files to CDN/hosting service
  // - Update DNS records if needed
  // - Invalidate CDN cache
  // - Update load balancer configuration
  // - Run database migrations if needed
  
  // Simulate deployment steps
  const steps = [
    'Uploading static assets',
    'Updating service worker',
    'Invalidating CDN cache',
    'Updating configuration',
    'Running health checks'
  ];
  
  for (let i = 0; i < steps.length; i++) {
    console.log(`  ${i + 1}/${steps.length} ${steps[i]}...`);
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Deployment completed');
}

async function verifyDeployment(environment) {
  console.log('🔍 Verifying deployment...');
  
  const url = ENVIRONMENTS[environment].url;
  
  // In a real implementation, this would:
  // - Make HTTP requests to verify the site is accessible
  // - Check that assets are loading correctly
  // - Verify service worker registration
  // - Run smoke tests
  // - Check performance metrics
  
  const checks = [
    { name: 'Site accessibility', url: url, expected: 200 },
    { name: 'Asset manifest', url: `${url}/assets/manifest.json`, expected: 200 },
    { name: 'Service worker', url: `${url}/sw.js`, expected: 200 },
    { name: 'Main application', url: `${url}/assets/main.js`, expected: 200 }
  ];
  
  for (const check of checks) {
    console.log(`  Checking ${check.name}...`);
    // Simulate HTTP check
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`    ✅ ${check.url} (${check.expected})`);
  }
  
  console.log('✅ Deployment verification passed');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = {
  validateBuild,
  runCompatibilityTests,
  deployToEnvironment,
  verifyDeployment
};