import {
  CustomizationManager as ICustomizationManager,
  UserPreferences,
  ColorScheme,
  UITheme,
  AnimationLevel,
  EffectLevel,
  SoundLevel,
  ControlScheme,
  VisualPreferences,
  AudioPreferences,
  ControlPreferences,
  GameplayPreferences,
  UIPreferences,
  CustomizationEvent,
  CustomizationEventType,
  EventSource
} from '../types/accessibility';

export class CustomizationManager implements ICustomizationManager {
  private preferences: UserPreferences;
  private gameContainer: HTMLElement;
  private styleSheet: CSSStyleSheet;
  private eventListeners: Map<string, EventListener[]> = new Map();
  private storageKey = 'ai-habitat-user-preferences';

  constructor(gameContainer: HTMLElement) {
    this.gameContainer = gameContainer;
    this.createStyleSheet();
    this.initializeDefaultPreferences();
    this.loadUserPreferences();
  }

  private createStyleSheet(): void {
    const style = document.createElement('style');
    style.id = 'customization-styles';
    document.head.appendChild(style);
    this.styleSheet = style.sheet as CSSStyleSheet;
  }

  private initializeDefaultPreferences(): void {
    this.preferences = {
      accessibility: {
        colorBlindSupport: 'none' as any,
        highContrast: false,
        reducedMotion: false,
        textSize: 'medium' as any,
        keyboardNavigation: false,
        screenReader: false,
        audioDescriptions: false,
        subtitles: false,
        gameplaySpeed: 1.0,
        difficultyAdjustment: {
          timeMultiplier: 1.0,
          complexityReduction: 0.0,
          hintFrequency: 1.0,
          errorTolerance: 1.0,
          autoComplete: false,
          skipOptions: false,
          customObjectives: false
        },
        flashingReduction: false,
        focusIndicators: true,
        alternativeInputs: false
      },
      visual: {
        colorScheme: ColorScheme.DEFAULT,
        theme: UITheme.DEFAULT,
        animationLevel: AnimationLevel.NORMAL,
        particleEffectLevel: EffectLevel.MEDIUM,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        fieldOfView: 75,
        cameraShake: true,
        screenEffects: true
      },
      audio: {
        masterVolume: 0.8,
        musicVolume: 0.6,
        sfxVolume: 0.8,
        voiceVolume: 1.0,
        spatialAudio: true,
        audioDescriptions: false,
        subtitles: false,
        soundLevel: SoundLevel.NORMAL
      },
      controls: {
        scheme: ControlScheme.DEFAULT,
        mouseSensitivity: 1.0,
        keyboardRepeatRate: 1.0,
        doubleClickSpeed: 500,
        dragThreshold: 5,
        customKeyBindings: {},
        gestureControls: false,
        voiceControls: false
      },
      gameplay: {
        speed: 1.0,
        difficulty: {
          timeMultiplier: 1.0,
          complexityReduction: 0.0,
          hintFrequency: 1.0,
          errorTolerance: 1.0,
          autoComplete: false,
          skipOptions: false,
          customObjectives: false
        },
        autoSave: true,
        hints: true,
        tutorials: true,
        pauseOnFocusLoss: true,
        confirmActions: false
      },
      ui: {
        theme: UITheme.DEFAULT,
        layout: 'default' as any,
        fontSize: 'medium' as any,
        iconSize: 'medium' as any,
        tooltips: true,
        animations: true,
        transparency: 0.9,
        compactMode: false
      }
    };
  }

  setColorScheme(scheme: ColorScheme): void {
    const oldScheme = this.preferences.visual.colorScheme;
    this.preferences.visual.colorScheme = scheme;
    this.applyColorScheme(scheme);
    this.emitCustomizationEvent(CustomizationEventType.SETTING_CHANGED, 'colorScheme', oldScheme, scheme);
  }

  private applyColorScheme(scheme: ColorScheme): void {
    const schemes = {
      [ColorScheme.DEFAULT]: this.getDefaultColorScheme(),
      [ColorScheme.HIGH_CONTRAST]: this.getHighContrastColorScheme(),
      [ColorScheme.DARK_MODE]: this.getDarkModeColorScheme(),
      [ColorScheme.LIGHT_MODE]: this.getLightModeColorScheme(),
      [ColorScheme.COLORBLIND_FRIENDLY]: this.getColorBlindFriendlyColorScheme(),
      [ColorScheme.CUSTOM]: this.getCustomColorScheme()
    };

    const colors = schemes[scheme];
    this.applyColorVariables(colors);
  }

  private getDefaultColorScheme(): { [key: string]: string } {
    return {
      '--primary-color': '#007ACC',
      '--secondary-color': '#FF6B35',
      '--success-color': '#28A745',
      '--warning-color': '#FFC107',
      '--error-color': '#DC3545',
      '--info-color': '#17A2B8',
      '--background-color': '#FFFFFF',
      '--surface-color': '#F8F9FA',
      '--text-color': '#212529',
      '--text-secondary': '#6C757D',
      '--border-color': '#DEE2E6',
      '--shadow-color': 'rgba(0, 0, 0, 0.1)'
    };
  }

  private getHighContrastColorScheme(): { [key: string]: string } {
    return {
      '--primary-color': '#0000FF',
      '--secondary-color': '#FFFF00',
      '--success-color': '#00FF00',
      '--warning-color': '#FF8000',
      '--error-color': '#FF0000',
      '--info-color': '#00FFFF',
      '--background-color': '#000000',
      '--surface-color': '#1A1A1A',
      '--text-color': '#FFFFFF',
      '--text-secondary': '#CCCCCC',
      '--border-color': '#FFFFFF',
      '--shadow-color': 'rgba(255, 255, 255, 0.3)'
    };
  }

  private getDarkModeColorScheme(): { [key: string]: string } {
    return {
      '--primary-color': '#0078D4',
      '--secondary-color': '#FF8C00',
      '--success-color': '#107C10',
      '--warning-color': '#FFB900',
      '--error-color': '#D13438',
      '--info-color': '#00BCF2',
      '--background-color': '#1E1E1E',
      '--surface-color': '#2D2D30',
      '--text-color': '#FFFFFF',
      '--text-secondary': '#CCCCCC',
      '--border-color': '#3E3E42',
      '--shadow-color': 'rgba(0, 0, 0, 0.5)'
    };
  }

  private getLightModeColorScheme(): { [key: string]: string } {
    return {
      '--primary-color': '#0078D4',
      '--secondary-color': '#D83B01',
      '--success-color': '#107C10',
      '--warning-color': '#FF8C00',
      '--error-color': '#D13438',
      '--info-color': '#00BCF2',
      '--background-color': '#FFFFFF',
      '--surface-color': '#FAFAFA',
      '--text-color': '#323130',
      '--text-secondary': '#605E5C',
      '--border-color': '#EDEBE9',
      '--shadow-color': 'rgba(0, 0, 0, 0.1)'
    };
  }

  private getColorBlindFriendlyColorScheme(): { [key: string]: string } {
    return {
      '--primary-color': '#0066CC',
      '--secondary-color': '#FFB300',
      '--success-color': '#00AA44',
      '--warning-color': '#FF8800',
      '--error-color': '#CC0000',
      '--info-color': '#0099CC',
      '--background-color': '#FFFFFF',
      '--surface-color': '#F5F5F5',
      '--text-color': '#000000',
      '--text-secondary': '#666666',
      '--border-color': '#CCCCCC',
      '--shadow-color': 'rgba(0, 0, 0, 0.1)'
    };
  }

  private getCustomColorScheme(): { [key: string]: string } {
    // This would load from user's custom color settings
    return this.getDefaultColorScheme();
  }

  private applyColorVariables(colors: { [key: string]: string }): void {
    const cssRule = `:root { ${Object.entries(colors).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
    this.addOrUpdateRule('color-scheme', cssRule);
  }

  setUITheme(theme: UITheme): void {
    const oldTheme = this.preferences.ui.theme;
    this.preferences.ui.theme = theme;
    this.preferences.visual.theme = theme;
    this.applyUITheme(theme);
    this.emitCustomizationEvent(CustomizationEventType.THEME_APPLIED, 'uiTheme', oldTheme, theme);
  }

  private applyUITheme(theme: UITheme): void {
    // Remove existing theme classes
    this.gameContainer.classList.remove('theme-default', 'theme-minimal', 'theme-classic', 'theme-modern', 'theme-high-contrast', 'theme-large-elements');
    
    // Add new theme class
    this.gameContainer.classList.add(`theme-${theme.replace('_', '-')}`);

    // Apply theme-specific styles
    const themeStyles = this.getThemeStyles(theme);
    this.addOrUpdateRule('ui-theme', themeStyles);
  }

  private getThemeStyles(theme: UITheme): string {
    const styles = {
      [UITheme.DEFAULT]: `
        .game-ui-button {
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 500;
        }
        .game-ui-panel {
          border-radius: 8px;
          box-shadow: 0 2px 8px var(--shadow-color);
        }
      `,
      [UITheme.MINIMAL]: `
        .game-ui-button {
          border-radius: 0;
          padding: 6px 12px;
          font-weight: 400;
          border: 1px solid var(--border-color);
        }
        .game-ui-panel {
          border-radius: 0;
          box-shadow: none;
          border: 1px solid var(--border-color);
        }
      `,
      [UITheme.CLASSIC]: `
        .game-ui-button {
          border-radius: 2px;
          padding: 10px 20px;
          font-weight: 600;
          border: 2px solid var(--primary-color);
        }
        .game-ui-panel {
          border-radius: 4px;
          box-shadow: 0 4px 12px var(--shadow-color);
          border: 1px solid var(--border-color);
        }
      `,
      [UITheme.MODERN]: `
        .game-ui-button {
          border-radius: 12px;
          padding: 12px 24px;
          font-weight: 500;
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        }
        .game-ui-panel {
          border-radius: 16px;
          box-shadow: 0 8px 32px var(--shadow-color);
          backdrop-filter: blur(10px);
        }
      `,
      [UITheme.HIGH_CONTRAST]: `
        .game-ui-button {
          border-radius: 4px;
          padding: 12px 24px;
          font-weight: 700;
          border: 3px solid var(--text-color);
          background: var(--background-color);
          color: var(--text-color);
        }
        .game-ui-panel {
          border-radius: 0;
          border: 3px solid var(--text-color);
          background: var(--background-color);
        }
      `,
      [UITheme.LARGE_ELEMENTS]: `
        .game-ui-button {
          border-radius: 8px;
          padding: 16px 32px;
          font-size: 1.2em;
          font-weight: 600;
        }
        .game-ui-panel {
          border-radius: 12px;
          padding: 24px;
        }
        .game-ui-icon {
          width: 32px;
          height: 32px;
        }
      `
    };

    return styles[theme] || styles[UITheme.DEFAULT];
  }

  setAnimationLevel(level: AnimationLevel): void {
    const oldLevel = this.preferences.visual.animationLevel;
    this.preferences.visual.animationLevel = level;
    this.applyAnimationLevel(level);
    this.emitCustomizationEvent(CustomizationEventType.SETTING_CHANGED, 'animationLevel', oldLevel, level);
  }

  private applyAnimationLevel(level: AnimationLevel): void {
    const multipliers = {
      [AnimationLevel.NONE]: 0,
      [AnimationLevel.MINIMAL]: 0.2,
      [AnimationLevel.REDUCED]: 0.5,
      [AnimationLevel.NORMAL]: 1.0,
      [AnimationLevel.ENHANCED]: 1.5
    };

    const multiplier = multipliers[level];
    const cssRule = `
      * {
        animation-duration: calc(var(--base-animation-duration, 0.3s) * ${multiplier}) !important;
        transition-duration: calc(var(--base-transition-duration, 0.2s) * ${multiplier}) !important;
      }
      
      ${level === AnimationLevel.NONE ? `
        *, *::before, *::after {
          animation-delay: -1ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          background-attachment: initial !important;
          scroll-behavior: auto !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      ` : ''}
    `;

    this.addOrUpdateRule('animation-level', cssRule);
  }

  setParticleEffectLevel(level: EffectLevel): void {
    const oldLevel = this.preferences.visual.particleEffectLevel;
    this.preferences.visual.particleEffectLevel = level;
    this.emitCustomizationEvent(CustomizationEventType.SETTING_CHANGED, 'particleEffectLevel', oldLevel, level);
    
    // Emit event for visual effects system
    this.emitGameEvent('particleEffectLevelChanged', { level });
  }

  setSoundLevel(level: SoundLevel): void {
    const oldLevel = this.preferences.audio.soundLevel;
    this.preferences.audio.soundLevel = level;
    this.emitCustomizationEvent(CustomizationEventType.SETTING_CHANGED, 'soundLevel', oldLevel, level);
    
    // Emit event for audio system
    this.emitGameEvent('soundLevelChanged', { level });
  }

  setControlScheme(scheme: ControlScheme): void {
    const oldScheme = this.preferences.controls.scheme;
    this.preferences.controls.scheme = scheme;
    this.applyControlScheme(scheme);
    this.emitCustomizationEvent(CustomizationEventType.SETTING_CHANGED, 'controlScheme', oldScheme, scheme);
  }

  private applyControlScheme(scheme: ControlScheme): void {
    // Remove existing control scheme classes
    this.gameContainer.classList.remove('controls-default', 'controls-simplified', 'controls-advanced', 'controls-custom', 'controls-one-handed');
    
    // Add new control scheme class
    this.gameContainer.classList.add(`controls-${scheme.replace('_', '-')}`);

    // Apply scheme-specific settings
    const schemeSettings = this.getControlSchemeSettings(scheme);
    this.emitGameEvent('controlSchemeChanged', { scheme, settings: schemeSettings });
  }

  private getControlSchemeSettings(scheme: ControlScheme): any {
    const settings = {
      [ControlScheme.DEFAULT]: {
        mouseSensitivity: 1.0,
        keyboardShortcuts: true,
        gestureControls: false,
        voiceControls: false
      },
      [ControlScheme.SIMPLIFIED]: {
        mouseSensitivity: 0.7,
        keyboardShortcuts: false,
        gestureControls: true,
        voiceControls: false,
        largerClickTargets: true,
        reducedComplexity: true
      },
      [ControlScheme.ADVANCED]: {
        mouseSensitivity: 1.3,
        keyboardShortcuts: true,
        gestureControls: true,
        voiceControls: true,
        customKeyBindings: true,
        macroSupport: true
      },
      [ControlScheme.ONE_HANDED]: {
        mouseSensitivity: 0.8,
        keyboardShortcuts: true,
        gestureControls: true,
        voiceControls: true,
        stickyKeys: true,
        mouseKeys: true
      },
      [ControlScheme.VOICE_ONLY]: {
        mouseSensitivity: 0,
        keyboardShortcuts: false,
        gestureControls: false,
        voiceControls: true,
        voiceCommandsOnly: true
      },
      [ControlScheme.EYE_TRACKING]: {
        mouseSensitivity: 0,
        keyboardShortcuts: true,
        gestureControls: false,
        voiceControls: true,
        eyeTracking: true,
        dwellClick: true
      },
      [ControlScheme.CUSTOM]: this.preferences.controls
    };

    return settings[scheme] || settings[ControlScheme.DEFAULT];
  }

  saveUserPreferences(preferences: UserPreferences): void {
    this.preferences = { ...this.preferences, ...preferences };
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
      this.emitCustomizationEvent(CustomizationEventType.PREFERENCES_SAVED, 'all', null, this.preferences);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  loadUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const loadedPreferences = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...loadedPreferences };
        this.applyAllPreferences();
        this.emitCustomizationEvent(CustomizationEventType.PREFERENCES_LOADED, 'all', null, this.preferences);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    
    return this.preferences;
  }

  private applyAllPreferences(): void {
    this.applyColorScheme(this.preferences.visual.colorScheme);
    this.applyUITheme(this.preferences.ui.theme);
    this.applyAnimationLevel(this.preferences.visual.animationLevel);
    this.applyControlScheme(this.preferences.controls.scheme);
    
    // Apply visual preferences
    this.applyVisualPreferences();
    
    // Emit events for other systems
    this.emitGameEvent('preferencesLoaded', this.preferences);
  }

  private applyVisualPreferences(): void {
    const visual = this.preferences.visual;
    
    const cssRule = `
      .game-container {
        filter: 
          brightness(${visual.brightness}) 
          contrast(${visual.contrast}) 
          saturate(${visual.saturation});
      }
      
      .game-ui-panel {
        opacity: ${visual.transparency};
      }
      
      ${visual.compactMode ? `
        .game-ui-panel {
          padding: 8px;
          margin: 4px;
        }
        .game-ui-button {
          padding: 4px 8px;
          font-size: 0.9em;
        }
      ` : ''}
    `;

    this.addOrUpdateRule('visual-preferences', cssRule);
  }

  resetToDefaults(): void {
    const oldPreferences = { ...this.preferences };
    this.initializeDefaultPreferences();
    this.applyAllPreferences();
    this.saveUserPreferences(this.preferences);
    this.emitCustomizationEvent(CustomizationEventType.PREFERENCES_LOADED, 'all', oldPreferences, this.preferences);
  }

  // Utility methods
  private addOrUpdateRule(id: string, cssText: string): void {
    this.removeRule(id);
    
    try {
      this.styleSheet.insertRule(`/* ${id} */ ${cssText}`, this.styleSheet.cssRules.length);
    } catch (error) {
      console.warn('Failed to add CSS rule:', error);
    }
  }

  private removeRule(id: string): void {
    for (let i = this.styleSheet.cssRules.length - 1; i >= 0; i--) {
      const rule = this.styleSheet.cssRules[i];
      if (rule.cssText.includes(`/* ${id} */`)) {
        this.styleSheet.deleteRule(i);
      }
    }
  }

  private emitCustomizationEvent(type: CustomizationEventType, setting: string, oldValue: any, newValue: any): void {
    const event: CustomizationEvent = {
      type,
      timestamp: Date.now(),
      setting,
      oldValue,
      newValue,
      source: 'user' as any
    };

    const customEvent = new CustomEvent('customizationChanged', { detail: event });
    this.gameContainer.dispatchEvent(customEvent);
  }

  private emitGameEvent(eventName: string, data: any): void {
    const event = new CustomEvent(eventName, { detail: data });
    this.gameContainer.dispatchEvent(event);
  }

  // Getters
  getUserPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  getVisualPreferences(): VisualPreferences {
    return { ...this.preferences.visual };
  }

  getAudioPreferences(): AudioPreferences {
    return { ...this.preferences.audio };
  }

  getControlPreferences(): ControlPreferences {
    return { ...this.preferences.controls };
  }

  getGameplayPreferences(): GameplayPreferences {
    return { ...this.preferences.gameplay };
  }

  getUIPreferences(): UIPreferences {
    return { ...this.preferences.ui };
  }

  // Preset management
  savePreset(name: string): void {
    const presets = this.getStoredPresets();
    presets[name] = { ...this.preferences };
    
    try {
      localStorage.setItem(`${this.storageKey}-presets`, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }

  loadPreset(name: string): boolean {
    const presets = this.getStoredPresets();
    
    if (presets[name]) {
      this.preferences = { ...presets[name] };
      this.applyAllPreferences();
      this.emitCustomizationEvent(CustomizationEventType.PREFERENCES_LOADED, 'preset', name, this.preferences);
      return true;
    }
    
    return false;
  }

  getAvailablePresets(): string[] {
    const presets = this.getStoredPresets();
    return Object.keys(presets);
  }

  deletePreset(name: string): boolean {
    const presets = this.getStoredPresets();
    
    if (presets[name]) {
      delete presets[name];
      
      try {
        localStorage.setItem(`${this.storageKey}-presets`, JSON.stringify(presets));
        return true;
      } catch (error) {
        console.error('Failed to delete preset:', error);
      }
    }
    
    return false;
  }

  private getStoredPresets(): { [name: string]: UserPreferences } {
    try {
      const stored = localStorage.getItem(`${this.storageKey}-presets`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load presets:', error);
      return {};
    }
  }

  // Cleanup
  cleanup(): void {
    const styleElement = document.getElementById('customization-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    this.eventListeners.clear();
  }
}