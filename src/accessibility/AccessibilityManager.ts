import {
  AccessibilityManager as IAccessibilityManager,
  AccessibilitySettings,
  ColorBlindnessType,
  TextSize,
  DifficultyAdjustment,
  AccessibilityReport,
  AccessibilityCompliance,
  AccessibilityIssue,
  AccessibilityRecommendation,
  IssueType,
  IssueSeverity,
  RecommendationCategory,
  ImpactLevel,
  EffortLevel,
  AccessibleColorPalette,
  HighContrastTheme,
  MotionSettings,
  AlternativeIndicators
} from '../types/accessibility';
import { ColorBlindnessFilter } from './ColorBlindnessFilter';
import { HighContrastManager } from './HighContrastManager';
import { MotionReducer } from './MotionReducer';
import { KeyboardNavigationManager } from './KeyboardNavigationManager';

export class AccessibilityManager implements IAccessibilityManager {
  private settings: AccessibilitySettings;
  private colorBlindnessFilter: ColorBlindnessFilter;
  private highContrastManager: HighContrastManager;
  private motionReducer: MotionReducer;
  private keyboardNavigationManager: KeyboardNavigationManager;
  private gameContainer: HTMLElement;
  private styleSheet: CSSStyleSheet;
  private observers: MutationObserver[] = [];

  constructor(gameContainer: HTMLElement) {
    this.gameContainer = gameContainer;
    this.initializeDefaultSettings();
    this.createStyleSheet();
    this.initializeComponents();
    this.setupObservers();
  }

  private initializeDefaultSettings(): void {
    this.settings = {
      colorBlindSupport: ColorBlindnessType.NONE,
      highContrast: false,
      reducedMotion: false,
      textSize: TextSize.MEDIUM,
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
    };
  }

  private createStyleSheet(): void {
    const style = document.createElement('style');
    style.id = 'accessibility-styles';
    document.head.appendChild(style);
    this.styleSheet = style.sheet as CSSStyleSheet;
  }

  private initializeComponents(): void {
    this.colorBlindnessFilter = new ColorBlindnessFilter();
    this.highContrastManager = new HighContrastManager(this.styleSheet);
    this.motionReducer = new MotionReducer();
    this.keyboardNavigationManager = new KeyboardNavigationManager(this.gameContainer);
  }

  private setupObservers(): void {
    // Observe DOM changes to maintain accessibility
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processNewElement(node as HTMLElement);
            }
          });
        }
      });
    });

    observer.observe(this.gameContainer, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  private processNewElement(element: HTMLElement): void {
    // Apply current accessibility settings to new elements
    if (this.settings.highContrast) {
      this.highContrastManager.applyToElement(element);
    }

    if (this.settings.keyboardNavigation) {
      this.keyboardNavigationManager.processElement(element);
    }

    // Add ARIA attributes if missing
    this.addAriaAttributes(element);
  }

  private addAriaAttributes(element: HTMLElement): void {
    // Add role if interactive element lacks one
    if (this.isInteractiveElement(element) && !element.getAttribute('role')) {
      element.setAttribute('role', this.getAppropriateRole(element));
    }

    // Add aria-label if missing and no visible text
    if (this.needsAriaLabel(element) && !element.getAttribute('aria-label')) {
      const label = this.generateAriaLabel(element);
      if (label) {
        element.setAttribute('aria-label', label);
      }
    }

    // Add tabindex for keyboard navigation
    if (this.settings.keyboardNavigation && this.isInteractiveElement(element)) {
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    }
  }

  configure(options: AccessibilitySettings): void {
    const previousSettings = { ...this.settings };
    this.settings = { ...this.settings, ...options };

    // Apply changes
    this.applyColorBlindnessSupport();
    this.applyHighContrast();
    this.applyReducedMotion();
    this.applyTextSize();
    this.applyKeyboardNavigation();
    this.applyGameplayAdjustments();

    // Emit configuration change event
    this.emitConfigurationChange(previousSettings, this.settings);
  }

  enableColorBlindSupport(type: ColorBlindnessType): void {
    this.settings.colorBlindSupport = type;
    this.applyColorBlindnessSupport();
  }

  private applyColorBlindnessSupport(): void {
    if (this.settings.colorBlindSupport === ColorBlindnessType.NONE) {
      this.colorBlindnessFilter.disable();
      return;
    }

    const palette = this.getColorBlindFriendlyPalette(this.settings.colorBlindSupport);
    this.colorBlindnessFilter.enable(this.settings.colorBlindSupport, palette);
    this.updateColorPalette(palette);
  }

  private getColorBlindFriendlyPalette(type: ColorBlindnessType): AccessibleColorPalette {
    const palettes: { [key in ColorBlindnessType]: AccessibleColorPalette } = {
      [ColorBlindnessType.NONE]: this.getDefaultPalette(),
      [ColorBlindnessType.PROTANOPIA]: {
        primary: '#0066CC',    // Blue
        secondary: '#FFB300',  // Amber
        success: '#00AA44',    // Green (adjusted)
        warning: '#FF8800',    // Orange
        error: '#CC0000',      // Dark red
        info: '#0099CC',       // Light blue
        neutral: '#666666',    // Gray
        background: '#FFFFFF', // White
        text: '#000000',       // Black
        accent: '#9933CC'      // Purple
      },
      [ColorBlindnessType.DEUTERANOPIA]: {
        primary: '#0066CC',    // Blue
        secondary: '#FFB300',  // Amber
        success: '#0088AA',    // Teal
        warning: '#FF8800',    // Orange
        error: '#CC0000',      // Dark red
        info: '#0099CC',       // Light blue
        neutral: '#666666',    // Gray
        background: '#FFFFFF', // White
        text: '#000000',       // Black
        accent: '#9933CC'      // Purple
      },
      [ColorBlindnessType.TRITANOPIA]: {
        primary: '#CC0066',    // Magenta
        secondary: '#00AA44',  // Green
        success: '#0088AA',    // Teal
        warning: '#FF6600',    // Orange-red
        error: '#AA0000',      // Dark red
        info: '#0066CC',       // Blue
        neutral: '#666666',    // Gray
        background: '#FFFFFF', // White
        text: '#000000',       // Black
        accent: '#9933CC'      // Purple
      },
      [ColorBlindnessType.PROTANOMALY]: {
        primary: '#0066CC',
        secondary: '#FFB300',
        success: '#00BB55',
        warning: '#FF9900',
        error: '#DD0000',
        info: '#00AADD',
        neutral: '#666666',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#AA44CC'
      },
      [ColorBlindnessType.DEUTERANOMALY]: {
        primary: '#0066CC',
        secondary: '#FFB300',
        success: '#0099BB',
        warning: '#FF9900',
        error: '#DD0000',
        info: '#00AADD',
        neutral: '#666666',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#AA44CC'
      },
      [ColorBlindnessType.TRITANOMALY]: {
        primary: '#DD0066',
        secondary: '#00BB44',
        success: '#0099BB',
        warning: '#FF7700',
        error: '#BB0000',
        info: '#0066CC',
        neutral: '#666666',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#AA44CC'
      },
      [ColorBlindnessType.ACHROMATOPSIA]: {
        primary: '#000000',
        secondary: '#666666',
        success: '#333333',
        warning: '#999999',
        error: '#000000',
        info: '#444444',
        neutral: '#777777',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#555555'
      },
      [ColorBlindnessType.ACHROMATOMALY]: {
        primary: '#003366',
        secondary: '#996633',
        success: '#336633',
        warning: '#996600',
        error: '#660000',
        info: '#336699',
        neutral: '#666666',
        background: '#FFFFFF',
        text: '#000000',
        accent: '#663399'
      }
    };

    return palettes[type];
  }

  private getDefaultPalette(): AccessibleColorPalette {
    return {
      primary: '#007ACC',
      secondary: '#FF6B35',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
      info: '#17A2B8',
      neutral: '#6C757D',
      background: '#FFFFFF',
      text: '#212529',
      accent: '#6F42C1'
    };
  }

  private updateColorPalette(palette: AccessibleColorPalette): void {
    const cssVariables = `
      :root {
        --color-primary: ${palette.primary};
        --color-secondary: ${palette.secondary};
        --color-success: ${palette.success};
        --color-warning: ${palette.warning};
        --color-error: ${palette.error};
        --color-info: ${palette.info};
        --color-neutral: ${palette.neutral};
        --color-background: ${palette.background};
        --color-text: ${palette.text};
        --color-accent: ${palette.accent};
      }
    `;

    this.addOrUpdateRule('color-palette', cssVariables);
  }

  enableHighContrast(enabled: boolean): void {
    this.settings.highContrast = enabled;
    this.applyHighContrast();
  }

  private applyHighContrast(): void {
    if (this.settings.highContrast) {
      const theme = this.getHighContrastTheme();
      this.highContrastManager.enable(theme);
    } else {
      this.highContrastManager.disable();
    }
  }

  private getHighContrastTheme(): HighContrastTheme {
    return {
      background: '#000000',
      foreground: '#FFFFFF',
      border: '#FFFFFF',
      focus: '#FFFF00',
      selection: '#0078D4',
      disabled: '#808080',
      link: '#00FFFF',
      visited: '#FF00FF'
    };
  }

  enableReducedMotion(enabled: boolean): void {
    this.settings.reducedMotion = enabled;
    this.applyReducedMotion();
  }

  private applyReducedMotion(): void {
    const motionSettings: MotionSettings = {
      reducedMotion: this.settings.reducedMotion,
      animationDuration: this.settings.reducedMotion ? 0.1 : 1.0,
      transitionDuration: this.settings.reducedMotion ? 0.1 : 1.0,
      particleReduction: this.settings.reducedMotion ? 0.8 : 0.0,
      cameraMovementReduction: this.settings.reducedMotion ? 0.7 : 0.0,
      flashingReduction: this.settings.flashingReduction,
      autoplayVideos: !this.settings.reducedMotion
    };

    this.motionReducer.configure(motionSettings);
  }

  setTextSize(size: TextSize): void {
    this.settings.textSize = size;
    this.applyTextSize();
  }

  private applyTextSize(): void {
    const sizeMultipliers = {
      [TextSize.EXTRA_SMALL]: 0.75,
      [TextSize.SMALL]: 0.875,
      [TextSize.MEDIUM]: 1.0,
      [TextSize.LARGE]: 1.125,
      [TextSize.EXTRA_LARGE]: 1.25,
      [TextSize.HUGE]: 1.5
    };

    const multiplier = sizeMultipliers[this.settings.textSize];
    const cssRule = `
      .game-container,
      .game-container * {
        font-size: calc(var(--base-font-size, 16px) * ${multiplier}) !important;
      }
      
      .game-ui-button {
        padding: calc(8px * ${multiplier}) calc(16px * ${multiplier}) !important;
      }
      
      .game-ui-icon {
        width: calc(24px * ${multiplier}) !important;
        height: calc(24px * ${multiplier}) !important;
      }
    `;

    this.addOrUpdateRule('text-size', cssRule);
  }

  enableKeyboardNavigation(enabled: boolean): void {
    this.settings.keyboardNavigation = enabled;
    this.applyKeyboardNavigation();
  }

  private applyKeyboardNavigation(): void {
    if (this.settings.keyboardNavigation) {
      this.keyboardNavigationManager.enable();
      this.addKeyboardNavigationStyles();
    } else {
      this.keyboardNavigationManager.disable();
      this.removeKeyboardNavigationStyles();
    }
  }

  private addKeyboardNavigationStyles(): void {
    const cssRule = `
      .keyboard-focusable:focus {
        outline: 3px solid #0078D4 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 1px #FFFFFF !important;
      }
      
      .keyboard-navigation-active .game-ui-button:focus,
      .keyboard-navigation-active .game-ui-input:focus,
      .keyboard-navigation-active .game-ui-select:focus {
        outline: 3px solid #0078D4 !important;
        outline-offset: 2px !important;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000000;
        color: #FFFFFF;
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;

    this.addOrUpdateRule('keyboard-navigation', cssRule);
    
    // Add skip link
    this.addSkipLink();
  }

  private removeKeyboardNavigationStyles(): void {
    this.removeRule('keyboard-navigation');
    this.removeSkipLink();
  }

  private addSkipLink(): void {
    if (document.getElementById('skip-to-main')) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-main';
    skipLink.className = 'skip-link';
    skipLink.href = '#main-game-area';
    skipLink.textContent = 'Skip to main game area';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  private removeSkipLink(): void {
    const skipLink = document.getElementById('skip-to-main');
    if (skipLink) {
      skipLink.remove();
    }
  }

  setGameplaySpeed(speed: number): void {
    this.settings.gameplaySpeed = Math.max(0.1, Math.min(3.0, speed));
    this.applyGameplayAdjustments();
  }

  setDifficultyAdjustment(adjustment: DifficultyAdjustment): void {
    this.settings.difficultyAdjustment = { ...this.settings.difficultyAdjustment, ...adjustment };
    this.applyGameplayAdjustments();
  }

  private applyGameplayAdjustments(): void {
    // Emit event for game systems to adjust accordingly
    const event = new CustomEvent('accessibilityGameplayAdjustment', {
      detail: {
        speed: this.settings.gameplaySpeed,
        difficulty: this.settings.difficultyAdjustment
      }
    });
    
    this.gameContainer.dispatchEvent(event);
  }

  getAccessibilityReport(): AccessibilityReport {
    const issues = this.scanForIssues();
    const recommendations = this.generateRecommendations(issues);
    const compliance = this.checkCompliance();
    const score = this.calculateAccessibilityScore(issues, compliance);

    return {
      compliance,
      issues,
      recommendations,
      score,
      lastUpdated: Date.now()
    };
  }

  private scanForIssues(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check color contrast
    issues.push(...this.checkColorContrast());
    
    // Check keyboard navigation
    issues.push(...this.checkKeyboardNavigation());
    
    // Check screen reader support
    issues.push(...this.checkScreenReaderSupport());
    
    // Check focus management
    issues.push(...this.checkFocusManagement());
    
    // Check alternative text
    issues.push(...this.checkAlternativeText());
    
    // Check motion sensitivity
    issues.push(...this.checkMotionSensitivity());

    return issues;
  }

  private checkColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // This would normally check actual computed styles
    // For now, we'll check if high contrast is needed but not enabled
    if (!this.settings.highContrast && this.detectLowContrast()) {
      issues.push({
        id: 'low-contrast',
        type: IssueType.COLOR_CONTRAST,
        severity: IssueSeverity.MEDIUM,
        description: 'Some text may not meet minimum contrast requirements',
        recommendation: 'Enable high contrast mode or adjust color scheme',
        autoFixable: true
      });
    }

    return issues;
  }

  private checkKeyboardNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const interactiveElements = this.gameContainer.querySelectorAll(
      'button, input, select, textarea, a, [tabindex], [role="button"]'
    );
    
    interactiveElements.forEach((element, index) => {
      if (!element.hasAttribute('tabindex') && !this.isNaturallyFocusable(element)) {
        issues.push({
          id: `keyboard-nav-${index}`,
          type: IssueType.KEYBOARD_NAVIGATION,
          severity: IssueSeverity.HIGH,
          description: `Interactive element is not keyboard accessible`,
          element: element.tagName.toLowerCase(),
          recommendation: 'Add tabindex="0" to make element focusable',
          autoFixable: true
        });
      }
    });

    return issues;
  }

  private checkScreenReaderSupport(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const elementsNeedingLabels = this.gameContainer.querySelectorAll(
      'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby])'
    );
    
    elementsNeedingLabels.forEach((element, index) => {
      if (!element.textContent?.trim()) {
        issues.push({
          id: `screen-reader-${index}`,
          type: IssueType.SCREEN_READER,
          severity: IssueSeverity.HIGH,
          description: 'Interactive element lacks accessible name',
          element: element.tagName.toLowerCase(),
          recommendation: 'Add aria-label or aria-labelledby attribute',
          autoFixable: false
        });
      }
    });

    return issues;
  }

  private checkFocusManagement(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    // Check for focus traps in modals
    const modals = this.gameContainer.querySelectorAll('[role="dialog"], .modal');
    modals.forEach((modal, index) => {
      const focusableElements = modal.querySelectorAll(
        'button, input, select, textarea, a, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) {
        issues.push({
          id: `focus-trap-${index}`,
          type: IssueType.FOCUS_MANAGEMENT,
          severity: IssueSeverity.MEDIUM,
          description: 'Modal dialog has no focusable elements',
          element: 'dialog',
          recommendation: 'Ensure modal contains at least one focusable element',
          autoFixable: false
        });
      }
    });

    return issues;
  }

  private checkAlternativeText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    const images = this.gameContainer.querySelectorAll('img:not([alt]), canvas:not([aria-label])');
    images.forEach((img, index) => {
      issues.push({
        id: `alt-text-${index}`,
        type: IssueType.ALTERNATIVE_TEXT,
        severity: IssueSeverity.MEDIUM,
        description: 'Image or canvas element lacks alternative text',
        element: img.tagName.toLowerCase(),
        recommendation: 'Add alt attribute for images or aria-label for canvas',
        autoFixable: false
      });
    });

    return issues;
  }

  private checkMotionSensitivity(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    if (!this.settings.reducedMotion && this.detectExcessiveMotion()) {
      issues.push({
        id: 'excessive-motion',
        type: IssueType.MOTION_SENSITIVITY,
        severity: IssueSeverity.MEDIUM,
        description: 'Game contains motion that may trigger vestibular disorders',
        recommendation: 'Enable reduced motion settings',
        autoFixable: true
      });
    }

    return issues;
  }

  private generateRecommendations(issues: AccessibilityIssue[]): AccessibilityRecommendation[] {
    const recommendations: AccessibilityRecommendation[] = [];

    // Generate recommendations based on issues
    if (issues.some(issue => issue.type === IssueType.COLOR_CONTRAST)) {
      recommendations.push({
        id: 'enable-high-contrast',
        category: RecommendationCategory.VISUAL,
        title: 'Enable High Contrast Mode',
        description: 'Improve text readability by enabling high contrast colors',
        impact: ImpactLevel.HIGH,
        effort: EffortLevel.MINIMAL,
        priority: 1
      });
    }

    if (issues.some(issue => issue.type === IssueType.KEYBOARD_NAVIGATION)) {
      recommendations.push({
        id: 'improve-keyboard-nav',
        category: RecommendationCategory.MOTOR,
        title: 'Improve Keyboard Navigation',
        description: 'Ensure all interactive elements are keyboard accessible',
        impact: ImpactLevel.VERY_HIGH,
        effort: EffortLevel.MEDIUM,
        priority: 1
      });
    }

    if (issues.some(issue => issue.type === IssueType.MOTION_SENSITIVITY)) {
      recommendations.push({
        id: 'reduce-motion',
        category: RecommendationCategory.VISUAL,
        title: 'Reduce Motion and Animations',
        description: 'Minimize motion to prevent vestibular disorders',
        impact: ImpactLevel.HIGH,
        effort: EffortLevel.LOW,
        priority: 2
      });
    }

    return recommendations;
  }

  private checkCompliance(): AccessibilityCompliance {
    const issues = this.scanForIssues();
    const criticalIssues = issues.filter(issue => issue.severity === IssueSeverity.CRITICAL);
    const highIssues = issues.filter(issue => issue.severity === IssueSeverity.HIGH);

    return {
      wcag21AA: criticalIssues.length === 0 && highIssues.length === 0,
      wcag21AAA: issues.length === 0,
      section508: criticalIssues.length === 0,
      ada: criticalIssues.length === 0 && highIssues.length === 0,
      customStandards: {}
    };
  }

  private calculateAccessibilityScore(issues: AccessibilityIssue[], compliance: AccessibilityCompliance): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case IssueSeverity.CRITICAL:
          score -= 20;
          break;
        case IssueSeverity.HIGH:
          score -= 10;
          break;
        case IssueSeverity.MEDIUM:
          score -= 5;
          break;
        case IssueSeverity.LOW:
          score -= 2;
          break;
      }
    });

    // Bonus points for compliance
    if (compliance.wcag21AA) score += 5;
    if (compliance.wcag21AAA) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  // Utility methods
  private addOrUpdateRule(id: string, cssText: string): void {
    this.removeRule(id);
    
    try {
      const ruleIndex = this.styleSheet.insertRule(`/* ${id} */ ${cssText}`, this.styleSheet.cssRules.length);
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

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
    
    return interactiveTags.includes(element.tagName.toLowerCase()) ||
           interactiveRoles.includes(element.getAttribute('role') || '') ||
           element.hasAttribute('onclick') ||
           element.hasAttribute('tabindex');
  }

  private getAppropriateRole(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    
    if (element.hasAttribute('onclick')) return 'button';
    if (tagName === 'div' || tagName === 'span') return 'button';
    
    return 'generic';
  }

  private needsAriaLabel(element: HTMLElement): boolean {
    return this.isInteractiveElement(element) && 
           !element.textContent?.trim() &&
           !element.getAttribute('aria-labelledby');
  }

  private generateAriaLabel(element: HTMLElement): string | null {
    // Try to generate meaningful label from context
    const className = element.className;
    const id = element.id;
    
    if (className.includes('close')) return 'Close';
    if (className.includes('menu')) return 'Menu';
    if (className.includes('play')) return 'Play';
    if (className.includes('pause')) return 'Pause';
    if (className.includes('stop')) return 'Stop';
    
    if (id) {
      return id.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    return null;
  }

  private isNaturallyFocusable(element: Element): boolean {
    const focusableTags = ['button', 'input', 'select', 'textarea', 'a'];
    return focusableTags.includes(element.tagName.toLowerCase());
  }

  private detectLowContrast(): boolean {
    // This would normally analyze computed styles
    // For now, return false as a placeholder
    return false;
  }

  private detectExcessiveMotion(): boolean {
    // This would normally analyze animations and transitions
    // For now, return false as a placeholder
    return false;
  }

  private emitConfigurationChange(oldSettings: AccessibilitySettings, newSettings: AccessibilitySettings): void {
    const event = new CustomEvent('accessibilityConfigurationChanged', {
      detail: { oldSettings, newSettings }
    });
    
    this.gameContainer.dispatchEvent(event);
  }

  // Cleanup
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    this.keyboardNavigationManager.cleanup();
    
    const styleElement = document.getElementById('accessibility-styles');
    if (styleElement) {
      styleElement.remove();
    }
    
    this.removeSkipLink();
  }
}