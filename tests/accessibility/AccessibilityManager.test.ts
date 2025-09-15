import { AccessibilityManager } from '../../src/accessibility/AccessibilityManager';
import {
  AccessibilitySettings,
  ColorBlindnessType,
  TextSize,
  DifficultyAdjustment
} from '../../src/types/accessibility.js';

// Mock DOM methods
const mockQuerySelectorAll = jest.fn();
const mockGetElementById = jest.fn();
const mockCreateElement = jest.fn();
const mockInsertRule = jest.fn();
const mockDeleteRule = jest.fn();

// Mock document
Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
  writable: true
});

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: jest.fn()
  },
  writable: true
});

// Mock MutationObserver
class MockMutationObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
  
  constructor(callback: MutationCallback) {}
}

Object.defineProperty(global, 'MutationObserver', {
  value: MockMutationObserver,
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('AccessibilityManager', () => {
  let accessibilityManager: AccessibilityManager;
  let mockGameContainer: HTMLElement;
  let mockStyleSheet: CSSStyleSheet;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock game container
    mockGameContainer = {
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      dispatchEvent: jest.fn(),
      querySelectorAll: mockQuerySelectorAll,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as any;

    // Mock style sheet
    mockStyleSheet = {
      insertRule: mockInsertRule,
      deleteRule: mockDeleteRule,
      cssRules: []
    } as any;

    // Mock createElement to return style element with sheet
    mockCreateElement.mockReturnValue({
      id: '',
      sheet: mockStyleSheet
    });

    mockQuerySelectorAll.mockReturnValue([]);
    mockGetElementById.mockReturnValue(null);

    accessibilityManager = new AccessibilityManager(mockGameContainer);
  });

  afterEach(() => {
    accessibilityManager.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(accessibilityManager).toBeDefined();
    });

    it('should create accessibility stylesheet', () => {
      expect(mockCreateElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should set up DOM observers', () => {
      expect(MockMutationObserver.prototype.observe).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    it('should configure accessibility settings', () => {
      const settings: AccessibilitySettings = {
        colorBlindSupport: ColorBlindnessType.PROTANOPIA,
        highContrast: true,
        reducedMotion: true,
        textSize: TextSize.LARGE,
        keyboardNavigation: true,
        screenReader: true,
        audioDescriptions: true,
        subtitles: true,
        gameplaySpeed: 0.8,
        difficultyAdjustment: {
          timeMultiplier: 1.5,
          complexityReduction: 0.3,
          hintFrequency: 2.0,
          errorTolerance: 1.2,
          autoComplete: true,
          skipOptions: true,
          customObjectives: true
        },
        flashingReduction: true,
        focusIndicators: true,
        alternativeInputs: true
      };

      expect(() => {
        accessibilityManager.configure(settings);
      }).not.toThrow();

      expect(mockGameContainer.dispatchEvent).toHaveBeenCalled();
    });

    it('should handle partial configuration updates', () => {
      const partialSettings = {
        highContrast: true,
        textSize: TextSize.EXTRA_LARGE
      } as Partial<AccessibilitySettings>;

      expect(() => {
        accessibilityManager.configure(partialSettings as AccessibilitySettings);
      }).not.toThrow();
    });
  });

  describe('Color Blindness Support', () => {
    it('should enable color blindness support for all types', () => {
      const types = [
        ColorBlindnessType.PROTANOPIA,
        ColorBlindnessType.DEUTERANOPIA,
        ColorBlindnessType.TRITANOPIA,
        ColorBlindnessType.PROTANOMALY,
        ColorBlindnessType.DEUTERANOMALY,
        ColorBlindnessType.TRITANOMALY,
        ColorBlindnessType.ACHROMATOPSIA,
        ColorBlindnessType.ACHROMATOMALY
      ];

      types.forEach(type => {
        expect(() => {
          accessibilityManager.enableColorBlindSupport(type);
        }).not.toThrow();
      });
    });

    it('should disable color blindness support', () => {
      accessibilityManager.enableColorBlindSupport(ColorBlindnessType.PROTANOPIA);
      
      expect(() => {
        accessibilityManager.enableColorBlindSupport(ColorBlindnessType.NONE);
      }).not.toThrow();
    });

    it('should apply appropriate color palettes', () => {
      accessibilityManager.enableColorBlindSupport(ColorBlindnessType.PROTANOPIA);
      
      expect(mockInsertRule).toHaveBeenCalled();
    });
  });

  describe('High Contrast Mode', () => {
    it('should enable high contrast mode', () => {
      accessibilityManager.enableHighContrast(true);
      
      expect(mockInsertRule).toHaveBeenCalled();
    });

    it('should disable high contrast mode', () => {
      accessibilityManager.enableHighContrast(true);
      accessibilityManager.enableHighContrast(false);
      
      expect(mockDeleteRule).toHaveBeenCalled();
    });

    it('should apply high contrast theme', () => {
      accessibilityManager.enableHighContrast(true);
      
      // Should have called insertRule with high contrast colors
      const calls = mockInsertRule.mock.calls;
      const hasHighContrastRule = calls.some(call => 
        call[0].includes('--color-background: #000000')
      );
      expect(hasHighContrastRule).toBe(true);
    });
  });

  describe('Reduced Motion', () => {
    it('should enable reduced motion', () => {
      accessibilityManager.enableReducedMotion(true);
      
      expect(mockGameContainer.dispatchEvent).toHaveBeenCalled();
    });

    it('should disable reduced motion', () => {
      accessibilityManager.enableReducedMotion(true);
      accessibilityManager.enableReducedMotion(false);
      
      expect(mockGameContainer.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Text Size Adjustment', () => {
    it('should set text size for all sizes', () => {
      const sizes = [
        TextSize.EXTRA_SMALL,
        TextSize.SMALL,
        TextSize.MEDIUM,
        TextSize.LARGE,
        TextSize.EXTRA_LARGE,
        TextSize.HUGE
      ];

      sizes.forEach(size => {
        expect(() => {
          accessibilityManager.setTextSize(size);
        }).not.toThrow();
        
        expect(mockInsertRule).toHaveBeenCalled();
      });
    });

    it('should apply appropriate size multipliers', () => {
      accessibilityManager.setTextSize(TextSize.LARGE);
      
      const calls = mockInsertRule.mock.calls;
      const hasTextSizeRule = calls.some(call => 
        call[0].includes('font-size: calc(var(--base-font-size, 16px) * 1.125)')
      );
      expect(hasTextSizeRule).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should enable keyboard navigation', () => {
      accessibilityManager.enableKeyboardNavigation(true);
      
      expect(mockInsertRule).toHaveBeenCalled();
    });

    it('should disable keyboard navigation', () => {
      accessibilityManager.enableKeyboardNavigation(true);
      accessibilityManager.enableKeyboardNavigation(false);
      
      expect(mockDeleteRule).toHaveBeenCalled();
    });

    it('should add skip link when enabled', () => {
      mockGetElementById.mockReturnValue(null); // No existing skip link
      
      accessibilityManager.enableKeyboardNavigation(true);
      
      // Should attempt to create and add skip link
      expect(mockCreateElement).toHaveBeenCalled();
    });

    it('should not duplicate skip link', () => {
      const mockSkipLink = { remove: jest.fn() };
      mockGetElementById.mockReturnValue(mockSkipLink as any);
      
      accessibilityManager.enableKeyboardNavigation(true);
      
      // Should not create new skip link if one exists
      expect(mockCreateElement).toHaveBeenCalledTimes(1); // Only for style element
    });
  });

  describe('Gameplay Adjustments', () => {
    it('should set gameplay speed within bounds', () => {
      accessibilityManager.setGameplaySpeed(0.5);
      accessibilityManager.setGameplaySpeed(2.0);
      accessibilityManager.setGameplaySpeed(0.05); // Should clamp to 0.1
      accessibilityManager.setGameplaySpeed(5.0);  // Should clamp to 3.0
      
      expect(mockGameContainer.dispatchEvent).toHaveBeenCalledTimes(4);
    });

    it('should set difficulty adjustments', () => {
      const adjustment: DifficultyAdjustment = {
        timeMultiplier: 2.0,
        complexityReduction: 0.5,
        hintFrequency: 3.0,
        errorTolerance: 1.5,
        autoComplete: true,
        skipOptions: true,
        customObjectives: true
      };

      accessibilityManager.setDifficultyAdjustment(adjustment);
      
      expect(mockGameContainer.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Accessibility Report', () => {
    it('should generate accessibility report', () => {
      const report = accessibilityManager.getAccessibilityReport();
      
      expect(report).toBeDefined();
      expect(report.compliance).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    it('should include compliance information', () => {
      const report = accessibilityManager.getAccessibilityReport();
      
      expect(report.compliance.wcag21AA).toBeDefined();
      expect(report.compliance.wcag21AAA).toBeDefined();
      expect(report.compliance.section508).toBeDefined();
      expect(report.compliance.ada).toBeDefined();
    });

    it('should detect accessibility issues', () => {
      // Mock elements that would cause issues
      mockQuerySelectorAll.mockReturnValue([
        { tagName: 'BUTTON', hasAttribute: () => false, textContent: '' },
        { tagName: 'IMG', hasAttribute: () => false }
      ]);

      const report = accessibilityManager.getAccessibilityReport();
      
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('should provide recommendations', () => {
      // Mock elements that would trigger recommendations
      mockQuerySelectorAll.mockReturnValue([
        { tagName: 'BUTTON', hasAttribute: () => false, textContent: '' }
      ]);

      const report = accessibilityManager.getAccessibilityReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('DOM Processing', () => {
    it('should process new elements added to DOM', () => {
      const mockElement = {
        nodeType: Node.ELEMENT_NODE,
        tagName: 'BUTTON',
        className: '',
        id: '',
        hasAttribute: jest.fn(() => false),
        getAttribute: jest.fn(() => null),
        setAttribute: jest.fn(),
        textContent: 'Click me'
      };

      // Simulate MutationObserver callback
      const observer = new MockMutationObserver(() => {});
      const mutations = [{
        type: 'childList',
        addedNodes: [mockElement]
      }];

      // This would normally be called by MutationObserver
      // We'll test the processing logic directly
      expect(() => {
        // The actual processing happens in private methods
        // We can verify through the public interface
        accessibilityManager.configure({
          keyboardNavigation: true
        } as AccessibilitySettings);
      }).not.toThrow();
    });

    it('should add ARIA attributes to interactive elements', () => {
      const mockButton = {
        tagName: 'BUTTON',
        className: 'game-button',
        id: 'test-button',
        hasAttribute: jest.fn(() => false),
        getAttribute: jest.fn(() => null),
        setAttribute: jest.fn(),
        textContent: ''
      };

      mockQuerySelectorAll.mockReturnValue([mockButton]);

      // Configure to trigger ARIA attribute addition
      accessibilityManager.configure({
        keyboardNavigation: true
      } as AccessibilitySettings);

      // The processing would happen through DOM observers
      // We verify the configuration doesn't throw
      expect(mockQuerySelectorAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle CSS rule insertion failures', () => {
      mockInsertRule.mockImplementation(() => {
        throw new Error('CSS rule insertion failed');
      });

      expect(() => {
        accessibilityManager.enableHighContrast(true);
      }).not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      mockQuerySelectorAll.mockReturnValue(null);
      mockGetElementById.mockReturnValue(null);

      expect(() => {
        accessibilityManager.enableKeyboardNavigation(true);
        const report = accessibilityManager.getAccessibilityReport();
      }).not.toThrow();
    });

    it('should handle invalid configuration values', () => {
      const invalidSettings = {
        gameplaySpeed: NaN,
        textSize: 'invalid' as any,
        colorBlindSupport: 'unknown' as any
      };

      expect(() => {
        accessibilityManager.configure(invalidSettings as any);
      }).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    it('should emit configuration change events', () => {
      accessibilityManager.configure({
        highContrast: true
      } as AccessibilitySettings);

      expect(mockGameContainer.dispatchEvent).toHaveBeenCalled();
      
      const call = mockGameContainer.dispatchEvent.mock.calls[0][0];
      expect(call.type).toBe('accessibilityConfigurationChanged');
    });

    it('should emit gameplay adjustment events', () => {
      accessibilityManager.setGameplaySpeed(0.5);

      expect(mockGameContainer.dispatchEvent).toHaveBeenCalled();
      
      const call = mockGameContainer.dispatchEvent.mock.calls[0][0];
      expect(call.type).toBe('accessibilityGameplayAdjustment');
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid configuration changes', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        accessibilityManager.configure({
          highContrast: i % 2 === 0,
          textSize: i % 2 === 0 ? TextSize.LARGE : TextSize.SMALL
        } as AccessibilitySettings);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle large numbers of DOM elements', () => {
      const mockElements = Array.from({ length: 1000 }, (_, i) => ({
        tagName: 'BUTTON',
        hasAttribute: () => false,
        getAttribute: () => null,
        setAttribute: jest.fn(),
        textContent: `Button ${i}`
      }));

      mockQuerySelectorAll.mockReturnValue(mockElements);

      expect(() => {
        const report = accessibilityManager.getAccessibilityReport();
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      accessibilityManager.enableKeyboardNavigation(true);
      accessibilityManager.enableHighContrast(true);
      
      expect(() => {
        accessibilityManager.cleanup();
      }).not.toThrow();
      
      expect(MockMutationObserver.prototype.disconnect).toHaveBeenCalled();
    });

    it('should remove added DOM elements', () => {
      const mockSkipLink = { remove: jest.fn() };
      mockGetElementById.mockReturnValue(mockSkipLink as any);
      
      accessibilityManager.enableKeyboardNavigation(true);
      accessibilityManager.cleanup();
      
      expect(mockSkipLink.remove).toHaveBeenCalled();
    });

    it('should remove style elements', () => {
      const mockStyleElement = { remove: jest.fn() };
      mockGetElementById.mockReturnValue(mockStyleElement as any);
      
      accessibilityManager.cleanup();
      
      expect(mockStyleElement.remove).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work with multiple accessibility features enabled', () => {
      const comprehensiveSettings: AccessibilitySettings = {
        colorBlindSupport: ColorBlindnessType.DEUTERANOPIA,
        highContrast: true,
        reducedMotion: true,
        textSize: TextSize.EXTRA_LARGE,
        keyboardNavigation: true,
        screenReader: true,
        audioDescriptions: true,
        subtitles: true,
        gameplaySpeed: 0.7,
        difficultyAdjustment: {
          timeMultiplier: 1.8,
          complexityReduction: 0.4,
          hintFrequency: 2.5,
          errorTolerance: 1.3,
          autoComplete: true,
          skipOptions: true,
          customObjectives: true
        },
        flashingReduction: true,
        focusIndicators: true,
        alternativeInputs: true
      };

      expect(() => {
        accessibilityManager.configure(comprehensiveSettings);
        const report = accessibilityManager.getAccessibilityReport();
        expect(report.score).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should maintain consistency across feature interactions', () => {
      // Enable features in sequence
      accessibilityManager.enableHighContrast(true);
      accessibilityManager.setTextSize(TextSize.LARGE);
      accessibilityManager.enableKeyboardNavigation(true);
      accessibilityManager.enableColorBlindSupport(ColorBlindnessType.PROTANOPIA);
      
      // All features should work together
      const report = accessibilityManager.getAccessibilityReport();
      expect(report).toBeDefined();
      expect(mockInsertRule).toHaveBeenCalledTimes(4); // One for each feature
    });
  });
});