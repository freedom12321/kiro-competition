#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Build optimization script for AI Habitat
 * Generates asset manifest, optimizes assets, and creates service worker
 */

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function main() {
  console.log('🚀 Starting build optimization...');
  
  try {
    // Ensure directories exist
    await ensureDirectories();
    
    // Generate asset manifest
    const manifest = await generateAssetManifest();
    await writeAssetManifest(manifest);
    
    // Generate service worker
    await generateServiceWorker(manifest);
    
    // Generate deployment info
    await generateDeploymentInfo(manifest);
    
    console.log('✅ Build optimization completed successfully!');
    console.log(`📦 Total assets: ${Object.keys(manifest.assets).length}`);
    console.log(`📊 Total size: ${formatBytes(getTotalSize(manifest))}`);
    
  } catch (error) {
    console.error('❌ Build optimization failed:', error);
    process.exit(1);
  }
}

async function ensureDirectories() {
  const dirs = [DIST_DIR, ASSETS_DIR, PUBLIC_DIR];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

async function generateAssetManifest() {
  console.log('📋 Generating asset manifest...');
  
  const manifest = {
    version: generateVersion(),
    buildTime: new Date().toISOString(),
    assets: {},
    chunks: {}
  };

  // Scan dist directory for assets
  const files = await scanDirectory(DIST_DIR);
  
  for (const file of files) {
    const relativePath = path.relative(DIST_DIR, file);
    const url = '/' + relativePath.replace(/\\/g, '/');
    
    const stats = await fs.stat(file);
    const content = await fs.readFile(file);
    const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    
    const asset = {
      url,
      size: stats.size,
      hash,
      priority: determineAssetPriority(file),
      type: determineAssetType(file)
    };
    
    manifest.assets[url] = asset;
  }

  // Define chunks based on file patterns
  manifest.chunks = await generateChunks(manifest.assets);
  
  return manifest;
}

async function scanDirectory(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await scanDirectory(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

function determineAssetPriority(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  // Critical assets needed for initial load
  if (fileName.includes('main') || fileName.includes('index')) {
    return 'critical';
  }
  
  // High priority for core functionality
  if (ext === '.js' || ext === '.css') {
    return 'high';
  }
  
  // Medium priority for visual assets
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.glb', '.gltf'].includes(ext)) {
    return 'medium';
  }
  
  // Low priority for audio and other assets
  return 'low';
}

function determineAssetType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const typeMap = {
    '.js': 'script',
    '.css': 'style',
    '.png': 'image',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.webp': 'image',
    '.svg': 'image',
    '.mp3': 'audio',
    '.ogg': 'audio',
    '.wav': 'audio',
    '.glb': 'model',
    '.gltf': 'model',
    '.obj': 'model',
    '.json': 'data',
    '.woff': 'font',
    '.woff2': 'font',
    '.ttf': 'font'
  };
  
  return typeMap[ext] || 'other';
}

async function generateChunks(assets) {
  const chunks = {};
  
  // Group assets by type and create logical chunks
  const scripts = Object.entries(assets).filter(([_, asset]) => asset.type === 'script');
  const styles = Object.entries(assets).filter(([_, asset]) => asset.type === 'style');
  const images = Object.entries(assets).filter(([_, asset]) => asset.type === 'image');
  const models = Object.entries(assets).filter(([_, asset]) => asset.type === 'model');
  const audio = Object.entries(assets).filter(([_, asset]) => asset.type === 'audio');
  
  // Main chunk (critical assets)
  const mainAssets = [...scripts, ...styles].filter(([_, asset]) => asset.priority === 'critical');
  if (mainAssets.length > 0) {
    chunks.main = {
      files: mainAssets.map(([url]) => url),
      dependencies: [],
      size: mainAssets.reduce((sum, [_, asset]) => sum + asset.size, 0)
    };
  }
  
  // Engine chunk (high priority scripts)
  const engineAssets = scripts.filter(([_, asset]) => asset.priority === 'high');
  if (engineAssets.length > 0) {
    chunks.engine = {
      files: engineAssets.map(([url]) => url),
      dependencies: ['main'],
      size: engineAssets.reduce((sum, [_, asset]) => sum + asset.size, 0)
    };
  }
  
  // Assets chunk (images and models)
  const visualAssets = [...images, ...models];
  if (visualAssets.length > 0) {
    chunks.assets = {
      files: visualAssets.map(([url]) => url),
      dependencies: ['engine'],
      size: visualAssets.reduce((sum, [_, asset]) => sum + asset.size, 0)
    };
  }
  
  // Audio chunk
  if (audio.length > 0) {
    chunks.audio = {
      files: audio.map(([url]) => url),
      dependencies: [],
      size: audio.reduce((sum, [_, asset]) => sum + asset.size, 0)
    };
  }
  
  return chunks;
}

async function writeAssetManifest(manifest) {
  const manifestPath = path.join(ASSETS_DIR, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('📄 Asset manifest written to:', manifestPath);
}

async function generateServiceWorker(manifest) {
  console.log('⚙️ Generating service worker...');
  
  const criticalAssets = Object.values(manifest.assets)
    .filter(asset => asset.priority === 'critical')
    .map(asset => asset.url);
    
  const cacheableAssets = Object.values(manifest.assets)
    .map(asset => asset.url);

  const swContent = `
// AI Habitat Service Worker - Generated at ${new Date().toISOString()}
const CACHE_NAME = 'ai-habitat-v${manifest.version}';
const CACHE_STRATEGY = 'stale-while-revalidate';

// Critical assets to cache immediately
const CRITICAL_ASSETS = ${JSON.stringify(criticalAssets, null, 2)};

// All cacheable assets
const CACHEABLE_ASSETS = ${JSON.stringify(cacheableAssets, null, 2)};

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching critical assets...');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('Critical assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache critical assets:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok && CACHEABLE_ASSETS.includes(new URL(request.url).pathname)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.warn('Network request failed:', error);
    throw error;
  });

  return cachedResponse || fetchPromise;
}

// Handle analytics events
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'TRACK_EVENT') {
    // Forward to analytics
    console.log('Analytics event:', event.data.payload);
  }
});

console.log('AI Habitat Service Worker loaded');
`;

  const swPath = path.join(DIST_DIR, 'sw.js');
  await fs.writeFile(swPath, swContent);
  console.log('🔧 Service worker written to:', swPath);
}

async function generateDeploymentInfo(manifest) {
  const deploymentInfo = {
    version: manifest.version,
    buildTime: manifest.buildTime,
    environment: process.env.NODE_ENV || 'development',
    totalAssets: Object.keys(manifest.assets).length,
    totalSize: getTotalSize(manifest),
    chunks: Object.keys(manifest.chunks),
    compatibility: {
      minBrowserVersions: {
        chrome: '80',
        firefox: '75',
        safari: '13',
        edge: '80'
      },
      requiredFeatures: [
        'webgl',
        'webAudio',
        'localStorage',
        'fetch',
        'promises',
        'requestAnimationFrame'
      ]
    }
  };

  const infoPath = path.join(DIST_DIR, 'deployment-info.json');
  await fs.writeFile(infoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('📊 Deployment info written to:', infoPath);
}

function getTotalSize(manifest) {
  return Object.values(manifest.assets).reduce((sum, asset) => sum + asset.size, 0);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateVersion() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const hash = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${hash}`;
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateAssetManifest,
  generateServiceWorker,
  generateDeploymentInfo
};