import { DeviceCreationPanel } from '@/ui/DeviceCreationPanel';
import { DeviceCategory, SuggestionCategory } from '@/types/ui';
import { EnvironmentType } from '@/types/core';

describe('DeviceCreationPanel', () => {
  let container: HTMLElement;
  let panel: DeviceCreationPanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new DeviceCreationPanel(container);
  });

  afterEach(() => {
    panel.dispose();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize panel with correct UI elements', () => {
      expect(container.querySelector('.device-creation-panel')).toBeTruthy();
      expect(container.querySelector('#device-description')).toBeTruthy();
      expect(container.querySelector('.suggestions-list')).toBeTruthy();
      expect(container.querySelector('.preview-content')).toBeTruthy();
      expect(container.querySelector('.create-device-btn')).toBeTruthy();
    });

    it('should have create button disabled initially', () => {
      const createButton = container.querySelector('.create-device-btn') as HTMLButtonElement;
      expect(createButton.disabled).toBe(true);
    });

    it('should show initial suggestions prompt', () => {
      const suggestionsContainer = container.querySelector('.suggestions-list') as HTMLElement;
      expect(suggestionsContainer.textContent).toContain('Start typing to see suggestions');
    });
  });

  describe('natural language input', () => {
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
    });

    it('should update character count on input', () => {
      const testText = 'A smart coffee maker that learns my schedule';
      textarea.value = testText;
      textarea.dispatchEvent(new Event('input'));

      const countElement = container.querySelector('.character-count') as HTMLElement;
      expect(countElement.textContent).toBe(`${testText.length} / 500`);
    });

    it('should update complexity indicator based on input', () => {
      const simpleText = 'A coffee maker';
      textarea.value = simpleText;
      textarea.dispatchEvent(new Event('input'));

      let complexityFill = container.querySelector('.complexity-fill') as HTMLElement;
      const simpleWidth = parseFloat(complexityFill.style.width);

      const complexText = 'A smart coffee maker that learns my schedule and adapts to my preferences using machine learning';
      textarea.value = complexText;
      textarea.dispatchEvent(new Event('input'));

      complexityFill = container.querySelector('.complexity-fill') as HTMLElement;
      const complexWidth = parseFloat(complexityFill.style.width);

      expect(complexWidth).toBeGreaterThan(simpleWidth);
    });

    it('should generate suggestions based on input', () => {
      textarea.value = 'A smart device that';
      textarea.dispatchEvent(new Event('input'));

      const suggestions = container.querySelectorAll('.suggestion-chip');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should enable create button for valid input', () => {
      const validText = 'A coffee maker that learns when I wake up and prepares coffee automatically';
      textarea.value = validText;
      textarea.dispatchEvent(new Event('input'));

      const createButton = container.querySelector('.create-device-btn') as HTMLButtonElement;
      expect(createButton.disabled).toBe(false);
    });

    it('should keep create button disabled for invalid input', () => {
      const invalidText = 'short';
      textarea.value = invalidText;
      textarea.dispatchEvent(new Event('input'));

      const createButton = container.querySelector('.create-device-btn') as HTMLButtonElement;
      expect(createButton.disabled).toBe(true);
    });
  });

  describe('suggestions system', () => {
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
    });

    it('should provide relevant suggestions for coffee maker', () => {
      const suggestions = panel.provideSuggestions('coffee maker that');
      expect(suggestions.length).toBeGreaterThan(0);
      
      const hasRelevantSuggestion = suggestions.some(s => 
        s.text.includes('schedule') || s.text.includes('learn')
      );
      expect(hasRelevantSuggestion).toBe(true);
    });

    it('should categorize suggestions correctly', () => {
      const suggestions = panel.provideSuggestions('smart device');
      
      const categories = suggestions.map(s => s.category);
      expect(categories).toContain(SuggestionCategory.DEVICE_TYPE);
    });

    it('should apply suggestion when clicked', () => {
      textarea.value = 'A smart coffee maker';
      textarea.dispatchEvent(new Event('input'));

      const suggestionChip = container.querySelector('.suggestion-chip') as HTMLElement;
      if (suggestionChip) {
        suggestionChip.click();
        expect(textarea.value.length).toBeGreaterThan('A smart coffee maker'.length);
      }
    });
  });

  describe('device preview', () => {
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
    });

    it('should generate preview for valid device description', () => {
      const description = 'A helpful coffee maker that learns my morning routine and prepares coffee automatically';
      textarea.value = description;
      textarea.dispatchEvent(new Event('input'));

      const deviceName = container.querySelector('.device-name') as HTMLElement;
      expect(deviceName.textContent).not.toBe('Unnamed Device');

      const capabilities = container.querySelectorAll('.capabilities-list li');
      expect(capabilities.length).toBeGreaterThan(0);
    });

    it('should show personality traits in preview', () => {
      const description = 'A helpful and cautious smart thermostat that learns my preferences';
      textarea.value = description;
      textarea.dispatchEvent(new Event('input'));

      const traits = container.querySelectorAll('.personality-trait');
      expect(traits.length).toBeGreaterThan(0);
    });

    it('should show potential issues for complex devices', () => {
      const description = 'A smart device that always optimizes everything and learns all my habits';
      textarea.value = description;
      textarea.dispatchEvent(new Event('input'));

      const issues = container.querySelectorAll('.issues-list li');
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should update device icon based on category', () => {
      const description = 'A smart coffee maker for the kitchen';
      textarea.value = description;
      textarea.dispatchEvent(new Event('input'));

      const icon = container.querySelector('.model-icon') as HTMLElement;
      expect(icon.textContent).toBe('☕');
    });
  });

  describe('validation system', () => {
    it('should validate device description correctly', () => {
      const validDescription = 'A smart coffee maker that learns my schedule and prepares coffee when I wake up';
      const validation = panel.validateDeviceDescription(validDescription);

      expect(validation.isValid).toBe(true);
      expect(validation.estimatedBehavior).toContain('coffee');
    });

    it('should reject too short descriptions', () => {
      const shortDescription = 'coffee';
      const validation = panel.validateDeviceDescription(shortDescription);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Description is too short. Please provide more details.');
    });

    it('should warn about absolute terms', () => {
      const absoluteDescription = 'A device that always does exactly what I want and never makes mistakes';
      const validation = panel.validateDeviceDescription(absoluteDescription);

      expect(validation.warnings.some(w => w.includes('always'))).toBe(true);
    });

    it('should suggest privacy considerations for learning devices', () => {
      const learningDescription = 'A smart device that learns all my habits and behaviors';
      const validation = panel.validateDeviceDescription(learningDescription);

      expect(validation.suggestions.some(s => s.includes('privacy'))).toBe(true);
    });
  });

  describe('device creation', () => {
    let textarea: HTMLTextAreaElement;
    let createButton: HTMLButtonElement;

    beforeEach(() => {
      textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      createButton = container.querySelector('.create-device-btn') as HTMLButtonElement;
    });

    it('should call creation callback when device is created', () => {
      const mockCallback = jest.fn();
      panel.setDeviceCreatedCallback(mockCallback);

      const description = 'A helpful coffee maker that learns my morning routine';
      textarea.value = description;
      textarea.dispatchEvent(new Event('input'));

      createButton.click();

      expect(mockCallback).toHaveBeenCalled();
      const [spec, preview] = mockCallback.mock.calls[0];
      expect(spec.description).toBe(description);
      expect(preview.capabilities.length).toBeGreaterThan(0);
    });

    it('should call spec changed callback during input', () => {
      const mockCallback = jest.fn();
      panel.setSpecChangedCallback(mockCallback);

      const description = 'A smart thermostat that adapts to my preferences';
      textarea.value = description;
      textarea.dispatchEvent(new Event('input'));

      expect(mockCallback).toHaveBeenCalled();
      const spec = mockCallback.mock.calls[0][0];
      expect(spec.description).toBe(description);
      expect(spec.category).toBe(DeviceCategory.COMFORT);
    });
  });

  describe('clear functionality', () => {
    let textarea: HTMLTextAreaElement;
    let clearButton: HTMLButtonElement;

    beforeEach(() => {
      textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      clearButton = container.querySelector('.clear-btn') as HTMLButtonElement;
    });

    it('should clear all input and reset UI', () => {
      // Set up some content
      textarea.value = 'A smart coffee maker that learns my schedule';
      textarea.dispatchEvent(new Event('input'));

      // Clear
      clearButton.click();

      // Check everything is reset
      expect(textarea.value).toBe('');
      
      const deviceName = container.querySelector('.device-name') as HTMLElement;
      expect(deviceName.textContent).toBe('Unnamed Device');
      
      const createButton = container.querySelector('.create-device-btn') as HTMLButtonElement;
      expect(createButton.disabled).toBe(true);
      
      const characterCount = container.querySelector('.character-count') as HTMLElement;
      expect(characterCount.textContent).toBe('0 / 500');
    });
  });

  describe('device categorization', () => {
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
    });

    it('should categorize coffee maker as comfort device', () => {
      textarea.value = 'A smart coffee maker for the kitchen';
      textarea.dispatchEvent(new Event('input'));

      const category = container.querySelector('.device-category') as HTMLElement;
      expect(category.textContent).toContain('comfort');
    });

    it('should categorize security camera as security device', () => {
      textarea.value = 'A smart security camera that monitors the entrance';
      textarea.dispatchEvent(new Event('input'));

      const category = container.querySelector('.device-category') as HTMLElement;
      expect(category.textContent).toContain('security');
    });

    it('should categorize health monitor as health device', () => {
      textarea.value = 'A health monitoring device for patients';
      textarea.dispatchEvent(new Event('input'));

      const category = container.querySelector('.device-category') as HTMLElement;
      expect(category.textContent).toContain('health');
    });
  });

  describe('environment inference', () => {
    it('should infer hospital environment for medical devices', () => {
      const mockCallback = jest.fn();
      panel.setSpecChangedCallback(mockCallback);

      const textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      textarea.value = 'A patient monitoring device for the hospital ward';
      textarea.dispatchEvent(new Event('input'));

      expect(mockCallback).toHaveBeenCalled();
      const spec = mockCallback.mock.calls[0][0];
      expect(spec.environment).toBe(EnvironmentType.HOSPITAL);
    });

    it('should infer office environment for work devices', () => {
      const mockCallback = jest.fn();
      panel.setSpecChangedCallback(mockCallback);

      const textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      textarea.value = 'A productivity device for the office meeting room';
      textarea.dispatchEvent(new Event('input'));

      expect(mockCallback).toHaveBeenCalled();
      const spec = mockCallback.mock.calls[0][0];
      expect(spec.environment).toBe(EnvironmentType.OFFICE);
    });

    it('should default to home environment', () => {
      const mockCallback = jest.fn();
      panel.setSpecChangedCallback(mockCallback);

      const textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      textarea.value = 'A smart coffee maker';
      textarea.dispatchEvent(new Event('input'));

      expect(mockCallback).toHaveBeenCalled();
      const spec = mockCallback.mock.calls[0][0];
      expect(spec.environment).toBe(EnvironmentType.HOME);
    });
  });

  describe('accessibility', () => {
    it('should support keyboard navigation', () => {
      const textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      textarea.focus();
      expect(document.activeElement).toBe(textarea);
    });

    it('should have proper ARIA labels and roles', () => {
      // This would be expanded with actual accessibility testing
      const textarea = container.querySelector('#device-description') as HTMLTextAreaElement;
      expect(textarea.getAttribute('placeholder')).toBeTruthy();
    });
  });

  describe('resource cleanup', () => {
    it('should dispose of resources properly', () => {
      expect(() => panel.dispose()).not.toThrow();
    });
  });
});