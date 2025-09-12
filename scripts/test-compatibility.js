#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Browser compatibility testing script
 * Tests the application across different browsers and generates reports
 */

const BROWSERS = [
  {
    name: 'Chrome',
    product: 'chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  {
    name: 'Firefox',
    product: 'firefox',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0'
  }
];

const TEST_URL = process.env.TEST_URL || 'http://localhost:8080';
const REPORT_DIR = path.join(__dirname, '..', 'compatibility-reports');

async function main() {
  console.log('🧪 Starting browser compatibility tests...');
  console.log(`🌐 Testing URL: ${TEST_URL}`);
  
  try {
    // Ensure report directory exists
    await fs.mkdir(REPORT_DIR, { recursive: true });
    
    const results = [];
    
    // Test each browser
    for (const browser of BROWSERS) {
      console.log(`\n🔍 Testing ${browser.name}...`);
      const result = await testBrowser(browser);
      results.push(result);
      
      // Generate individual report
      await generateBrowserReport(browser.name, result);
    }
    
    // Generate summary report
    await generateSummaryReport(results);
    
    // Check if any critical tests failed
    const criticalFailures = results.filter(r => r.criticalFailures.length > 0);
    if (criticalFailures.length > 0) {
      console.log('\n❌ Critical compatibility issues found:');
      criticalFailures.forEach(result => {
        console.log(`  ${result.browser}: ${result.criticalFailures.join(', ')}`);
      });
      process.exit(1);
    }
    
    console.log('\n✅ All compatibility tests passed!');
    console.log(`📊 Reports generated in: ${REPORT_DIR}`);
    
  } catch (error) {
    console.error('❌ Compatibility testing failed:', error);
    process.exit(1);
  }
}

async function testBrowser(browserConfig) {
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      product: browserConfig.product,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent(browserConfig.userAgent);
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to test URL
    await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Run compatibility tests
    const testResults = await runCompatibilityTests(page);
    
    // Run performance tests
    const performanceResults = await runPerformanceTests(page);
    
    // Take screenshot
    const screenshotPath = path.join(REPORT_DIR, `${browserConfig.name.toLowerCase()}-screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    return {
      browser: browserConfig.name,
      userAgent: browserConfig.userAgent,
      testResults,
      performanceResults,
      screenshot: screenshotPath,
      timestamp: new Date().toISOString(),
      criticalFailures: testResults.filter(t => !t.passed && t.critical).map(t => t.name)
    };
    
  } catch (error) {
    return {
      browser: browserConfig.name,
      error: error.message,
      criticalFailures: ['Browser launch failed'],
      timestamp: new Date().toISOString()
    };
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

async function runCompatibilityTests(page) {
  console.log('  Running compatibility tests...');
  
  const tests = await page.evaluate(() => {
    const results = [];
    
    // WebGL test
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      results.push({
        name: 'WebGL',
        passed: !!gl,
        critical: true,
        details: gl ? `Vendor: ${gl.getParameter(gl.VENDOR)}` : 'Not supported'
      });
    } catch (error) {
      results.push({
        name: 'WebGL',
        passed: false,
        critical: true,
        error: error.message
      });
    }
    
    // WebGL 2 test
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      results.push({
        name: 'WebGL2',
        passed: !!gl2,
        critical: false,
        details: gl2 ? 'Supported' : 'Not supported'
      });
    } catch (error) {
      results.push({
        name: 'WebGL2',
        passed: false,
        critical: false,
        error: error.message
      });
    }
    
    // Web Audio test
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = AudioContext ? new AudioContext() : null;
      results.push({
        name: 'WebAudio',
        passed: !!audioContext,
        critical: true,
        details: audioContext ? `Sample rate: ${audioContext.sampleRate}Hz` : 'Not supported'
      });
      if (audioContext) audioContext.close();
    } catch (error) {
      results.push({
        name: 'WebAudio',
        passed: false,
        critical: true,
        error: error.message
      });
    }
    
    // Local Storage test
    try {
      localStorage.setItem('test', 'test');
      const canRead = localStorage.getItem('test') === 'test';
      localStorage.removeItem('test');
      results.push({
        name: 'LocalStorage',
        passed: canRead,
        critical: true,
        details: canRead ? 'Working' : 'Not working'
      });
    } catch (error) {
      results.push({
        name: 'LocalStorage',
        passed: false,
        critical: true,
        error: error.message
      });
    }
    
    // Service Worker test
    results.push({
      name: 'ServiceWorker',
      passed: 'serviceWorker' in navigator,
      critical: false,
      details: 'serviceWorker' in navigator ? 'Supported' : 'Not supported'
    });
    
    // Fetch API test
    results.push({
      name: 'Fetch',
      passed: 'fetch' in window,
      critical: true,
      details: 'fetch' in window ? 'Supported' : 'Not supported'
    });
    
    // ES6 features test
    try {
      new Function('() => {}');
      new Function('const x = 1');
      new Function('let x = 1');
      results.push({
        name: 'ES6',
        passed: true,
        critical: true,
        details: 'Arrow functions, const, let supported'
      });
    } catch (error) {
      results.push({
        name: 'ES6',
        passed: false,
        critical: true,
        error: error.message
      });
    }
    
    return results;
  });
  
  const passedTests = tests.filter(t => t.passed).length;
  console.log(`    ✅ ${passedTests}/${tests.length} tests passed`);
  
  return tests;
}

async function runPerformanceTests(page) {
  console.log('  Running performance tests...');
  
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      // Wait for page to be fully loaded
      if (document.readyState === 'complete') {
        measurePerformance();
      } else {
        window.addEventListener('load', measurePerformance);
      }
      
      function measurePerformance() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        const metrics = {
          loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
          memoryUsage: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null
        };
        
        resolve(metrics);
      }
    });
  });
  
  console.log(`    📊 Load time: ${metrics.loadTime.toFixed(2)}ms`);
  console.log(`    🎨 First paint: ${metrics.firstPaint.toFixed(2)}ms`);
  
  return metrics;
}

async function generateBrowserReport(browserName, result) {
  const reportPath = path.join(REPORT_DIR, `${browserName.toLowerCase()}-report.json`);
  await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(browserName, result);
  const htmlPath = path.join(REPORT_DIR, `${browserName.toLowerCase()}-report.html`);
  await fs.writeFile(htmlPath, htmlReport);
  
  console.log(`  📄 Report saved: ${reportPath}`);
}

async function generateSummaryReport(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalBrowsers: results.length,
    passedBrowsers: results.filter(r => r.criticalFailures.length === 0).length,
    results: results.map(r => ({
      browser: r.browser,
      passed: r.criticalFailures.length === 0,
      criticalFailures: r.criticalFailures,
      testsPassed: r.testResults ? r.testResults.filter(t => t.passed).length : 0,
      totalTests: r.testResults ? r.testResults.length : 0,
      loadTime: r.performanceResults ? r.performanceResults.loadTime : null
    }))
  };
  
  const summaryPath = path.join(REPORT_DIR, 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  // Generate HTML summary
  const htmlSummary = generateHTMLSummary(summary);
  const htmlPath = path.join(REPORT_DIR, 'summary.html');
  await fs.writeFile(htmlPath, htmlSummary);
  
  console.log(`📊 Summary report saved: ${summaryPath}`);
}

function generateHTMLReport(browserName, result) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>${browserName} Compatibility Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .test { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test.passed { border-color: #4CAF50; background: #f1f8e9; }
        .test.failed { border-color: #f44336; background: #ffebee; }
        .test.critical { font-weight: bold; }
        .metrics { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${browserName} Compatibility Report</h1>
        <p><strong>Generated:</strong> ${result.timestamp}</p>
        <p><strong>User Agent:</strong> ${result.userAgent || 'Unknown'}</p>
    </div>
    
    ${result.error ? `<div class="test failed critical">
        <h3>❌ Browser Error</h3>
        <p>${result.error}</p>
    </div>` : ''}
    
    ${result.testResults ? `
    <h2>Compatibility Tests</h2>
    ${result.testResults.map(test => `
        <div class="test ${test.passed ? 'passed' : 'failed'} ${test.critical ? 'critical' : ''}">
            <h3>${test.passed ? '✅' : '❌'} ${test.name} ${test.critical ? '(Critical)' : ''}</h3>
            <p>${test.details || test.error || 'No details'}</p>
        </div>
    `).join('')}
    ` : ''}
    
    ${result.performanceResults ? `
    <h2>Performance Metrics</h2>
    <div class="metrics">
        <p><strong>Load Time:</strong> ${result.performanceResults.loadTime.toFixed(2)}ms</p>
        <p><strong>DOM Content Loaded:</strong> ${result.performanceResults.domContentLoaded.toFixed(2)}ms</p>
        <p><strong>First Paint:</strong> ${result.performanceResults.firstPaint.toFixed(2)}ms</p>
        <p><strong>First Contentful Paint:</strong> ${result.performanceResults.firstContentfulPaint.toFixed(2)}ms</p>
        ${result.performanceResults.memoryUsage ? `
        <p><strong>Memory Usage:</strong> ${(result.performanceResults.memoryUsage.used / 1024 / 1024).toFixed(2)} MB</p>
        ` : ''}
    </div>
    ` : ''}
</body>
</html>
  `;
}

function generateHTMLSummary(summary) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Browser Compatibility Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; flex: 1; }
        .browser { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .browser.passed { background: #f1f8e9; border-left: 4px solid #4CAF50; }
        .browser.failed { background: #ffebee; border-left: 4px solid #f44336; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Browser Compatibility Summary</h1>
        <p><strong>Generated:</strong> ${summary.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <h3>${summary.totalBrowsers}</h3>
            <p>Browsers Tested</p>
        </div>
        <div class="stat">
            <h3>${summary.passedBrowsers}</h3>
            <p>Browsers Passed</p>
        </div>
        <div class="stat">
            <h3>${Math.round((summary.passedBrowsers / summary.totalBrowsers) * 100)}%</h3>
            <p>Success Rate</p>
        </div>
    </div>
    
    <h2>Browser Results</h2>
    ${summary.results.map(result => `
        <div class="browser ${result.passed ? 'passed' : 'failed'}">
            <h3>${result.passed ? '✅' : '❌'} ${result.browser}</h3>
            <p><strong>Tests:</strong> ${result.testsPassed}/${result.totalTests} passed</p>
            ${result.loadTime ? `<p><strong>Load Time:</strong> ${result.loadTime.toFixed(2)}ms</p>` : ''}
            ${result.criticalFailures.length > 0 ? `
                <p><strong>Critical Failures:</strong> ${result.criticalFailures.join(', ')}</p>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>
  `;
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testBrowser,
  runCompatibilityTests,
  runPerformanceTests
};