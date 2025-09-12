import { GameIntegrationSystem } from '@/engine/GameIntegrationSystem';
import { GameScene, EnvironmentType, GameMode } from '@/types/core';
import { InteractionDemo } from '@/demo/interaction-demo';
import { runCrisisManagementDemo } from '@/demo/crisis-management-demo';
import { DeploymentPipeline } from '@/engine/DeploymentPipeline';
import { BrowserCompatibilityTester } from '@/engine/BrowserCompatibilityTester';

/**
 * Main entry point for AI Habitat game
 */
class AIHabitatGame {
  private gameIntegrationSystem: GameIntegrationSystem;
  private gameContainer: HTMLElement;
  private loadingScreen: HTMLElement;
  private interactionDemo: InteractionDemo;
  private deploymentPipeline: DeploymentPipeline;
  private compatibilityTester: BrowserCompatibilityTester;

  constructor() {
    this.gameContainer = document.getElementById('game-container')!;
    this.loadingScreen = document.getElementById('loading-screen')!;
    
    // Initialize deployment systems
    this.deploymentPipeline = new DeploymentPipeline();
    this.compatibilityTester = new BrowserCompatibilityTester();
    
    this.initializeGame();
  }

  private async initializeGame(): Promise<void> {
    try {
      // Run browser compatibility tests first
      this.showLoadingMessage('Checking browser compatibility...');
      const compatibilityReport = await this.compatibilityTester.runAllTests();
      
      if (compatibilityReport.criticalFailures.length > 0) {
        throw new Error(`Critical browser features not supported: ${compatibilityReport.criticalFailures.join(', ')}`);
      }

      if (compatibilityReport.overallScore < 70) {
        console.warn('⚠️ Browser compatibility score is low:', compatibilityReport.overallScore);
        this.showCompatibilityWarning(compatibilityReport);
      }

      // Initialize deployment pipeline for progressive loading
      this.showLoadingMessage('Initializing deployment pipeline...');
      this.deploymentPipeline.onLoadingProgress((progress) => {
        this.updateLoadingProgress(progress);
      });
      
      await this.deploymentPipeline.initialize();
      
      // Initialize the integrated game system
      this.showLoadingMessage('Initializing game integration system...');
      this.gameIntegrationSystem = new GameIntegrationSystem(this.gameContainer);
      
      this.showLoadingMessage('Loading game assets...');
      await this.loadGameAssets();
      
      this.showLoadingMessage('Setting up integrated systems...');
      
      // Wait for systems to be fully initialized
      while (!this.gameIntegrationSystem.areSystemsInitialized()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get system references for demos
      const systems = this.gameIntegrationSystem.getSystemReferences();
      this.interactionDemo = new InteractionDemo();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Hide loading screen
      this.hideLoadingScreen();
      
      console.log('AI Habitat game initialized successfully!');
      
      // Check if user should start with tutorial
      const shouldShowTutorial = !systems.tutorialManager.isModeTutorialCompleted(GameMode.TUTORIAL);
      if (shouldShowTutorial) {
        console.log('Starting tutorial for new player...');
        await this.gameIntegrationSystem.transitionToMode(GameMode.TUTORIAL);
      } else {
        console.log('Entering free play mode...');
        await this.gameIntegrationSystem.transitionToMode(GameMode.FREE_PLAY);
      }
      
      // Start demo interactions after a short delay
      setTimeout(() => {
        console.log('Starting device interaction demo...');
        this.interactionDemo.startDemo('cooperative', 30000);
      }, 3000);

      // Add crisis management demo after 8 seconds
      setTimeout(() => {
        console.log('Crisis Management Demo available - check top-right corner for controls');
        runCrisisManagementDemo();
      }, 8000);
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.showErrorScreen(error as Error);
    }
  }

  private showLoadingMessage(message: string): void {
    const loadingText = this.loadingScreen.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
  }

  private updateLoadingProgress(progress: any): void {
    const progressBar = this.loadingScreen.querySelector('.progress-bar') as HTMLElement;
    const progressText = this.loadingScreen.querySelector('.progress-text') as HTMLElement;
    const phaseText = this.loadingScreen.querySelector('.phase-text') as HTMLElement;

    if (progressBar) {
      progressBar.style.width = `${progress.progress}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress.progress)}%`;
    }

    if (phaseText) {
      const phaseNames = {
        'initializing': 'Initializing...',
        'loading-critical': 'Loading core systems...',
        'loading-core': 'Loading game engine...',
        'loading-assets': 'Loading assets...',
        'complete': 'Ready to play!'
      };
      phaseText.textContent = phaseNames[progress.phase as keyof typeof phaseNames] || progress.phase;
    }

    if (progress.currentAsset) {
      const assetText = this.loadingScreen.querySelector('.asset-text') as HTMLElement;
      if (assetText) {
        assetText.textContent = `Loading: ${progress.currentAsset}`;
      }
    }
  }

  private showCompatibilityWarning(report: any): void {
    const warningDiv = document.createElement('div');
    warningDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 15px;
        max-width: 400px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h3 style="color: #856404; margin-top: 0;">Browser Compatibility Warning</h3>
        <p style="margin: 10px 0;">Your browser scored ${Math.round(report.overallScore)}% on compatibility tests.</p>
        <p style="font-size: 0.9em; margin: 10px 0;">Some features may not work optimally. Consider updating your browser for the best experience.</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #ffc107;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">Dismiss</button>
      </div>
    `;
    document.body.appendChild(warningDiv);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (warningDiv.parentElement) {
        warningDiv.remove();
      }
    }, 10000);
  }

  private showErrorScreen(error: Error): void {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffebee;
        border: 2px solid #f44336;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        text-align: center;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h2 style="color: #d32f2f; margin-top: 0;">Failed to Load AI Habitat</h2>
        <p>There was an error initializing the game. Please check your browser compatibility and try refreshing the page.</p>
        <details style="margin: 15px 0; text-align: left;">
          <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
          <pre style="
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.8em;
            overflow: auto;
            margin-top: 10px;
          ">${error.message}</pre>
        </details>
        <button onclick="window.location.reload()" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          margin-right: 10px;
        ">Reload Page</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #666;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        ">Dismiss</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  private async loadGameAssets(): Promise<void> {
    // Placeholder for asset loading
    // In a real implementation, this would load 3D models, textures, sounds, etc.
    return new Promise(resolve => {
      setTimeout(resolve, 1000); // Simulate loading time
    });
  }

  private createInitialScene(): GameScene {
    // Create a basic scene for testing
    const scene: GameScene = {
      environment: {
        id: 'test-room',
        type: EnvironmentType.HOME,
        meshes: [], // Would contain actual 3D meshes
        bounds: new (window as any).THREE.Box3(
          new (window as any).THREE.Vector3(-10, 0, -10),
          new (window as any).THREE.Vector3(10, 5, 10)
        ),
        gridSize: 1
      },
      devices: [], // Start with no devices
      camera: {
        position: { x: 10, y: 10, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        zoom: 1,
        rotation: { x: 0, y: 0, z: 0 }
      },
      lighting: {
        ambient: new (window as any).THREE.AmbientLight(0x404040, 0.6),
        directional: [],
        point: []
      },
      effects: []
    };

    return scene;
  }

  private setupEventHandlers(): void {
    // The GameIntegrationSystem now handles all event setup
    // We just need to handle any app-level events
    
    // Handle app-specific shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        // Toggle debug mode
        this.toggleDebugMode();
      }
    });

    // Handle performance monitoring
    this.setupPerformanceMonitoring();
  }

  private toggleDebugMode(): void {
    const systems = this.gameIntegrationSystem.getSystemReferences();
    const health = this.gameIntegrationSystem.getSystemHealth();
    
    console.log('=== DEBUG INFO ===');
    console.log('System Health:', health);
    console.log('Current Mode:', this.gameIntegrationSystem.getCurrentMode());
    console.log('Device Count:', systems.deviceSimulator.getDeviceCount());
    console.log('==================');
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance every 5 seconds
    setInterval(() => {
      const health = this.gameIntegrationSystem.getSystemHealth();
      if (health.deviceCount > 10) {
        console.log('Performance check: High device count detected:', health.deviceCount);
      }
    }, 5000);

    // Perform health check every minute
    setInterval(() => {
      this.gameIntegrationSystem.performHealthCheck();
    }, 60000);
  }

  private hideLoadingScreen(): void {
    this.loadingScreen.style.opacity = '0';
    this.loadingScreen.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
      this.loadingScreen.style.display = 'none';
    }, 500);
  }

  /**
   * Clean up resources when the game is destroyed
   */
  public dispose(): void {
    this.gameIntegrationSystem?.shutdown();
    this.interactionDemo?.dispose();
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AIHabitatGame();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  // Clean up resources if needed
});