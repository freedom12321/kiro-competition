import { DeviceSpec, DevicePreview, Suggestion, ValidationResult, SuggestionCategory, DeviceCategory } from '@/types/ui';
import { EnvironmentType } from '@/types/core';

/**
 * DeviceCreationPanel provides natural language input with visual feedback and device preview
 */
export class DeviceCreationPanel {
  private container: HTMLElement;
  private inputElement: HTMLTextAreaElement;
  private suggestionsContainer: HTMLElement;
  private previewContainer: HTMLElement;
  private createButton: HTMLButtonElement;
  private validationContainer: HTMLElement;
  
  private currentSpec: DeviceSpec | null = null;
  private currentPreview: DevicePreview | null = null;
  private suggestions: Suggestion[] = [];
  
  // Callbacks
  private onDeviceCreatedCallback?: (spec: DeviceSpec, preview: DevicePreview) => void;
  private onSpecChangedCallback?: (spec: DeviceSpec) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeUI();
    this.setupEventListeners();
    this.loadSuggestionDatabase();
  }

  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="device-creation-panel">
        <div class="panel-header">
          <h2>Create AI Device</h2>
          <p>Describe your smart device in natural language</p>
        </div>
        
        <div class="input-section">
          <div class="input-container">
            <textarea 
              id="device-description" 
              placeholder="Example: A coffee maker that learns when I wake up and has coffee ready..."
              rows="4"
            ></textarea>
            <div class="input-feedback">
              <div class="character-count">0 / 500</div>
              <div class="complexity-indicator">
                <span class="label">Complexity:</span>
                <div class="complexity-bar">
                  <div class="complexity-fill"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="suggestions-container">
            <div class="suggestions-header">Suggestions</div>
            <div class="suggestions-list"></div>
          </div>
        </div>
        
        <div class="preview-section">
          <div class="preview-header">Device Preview</div>
          <div class="preview-content">
            <div class="preview-visual">
              <div class="device-model-placeholder">
                <div class="model-icon">🤖</div>
                <div class="personality-indicators"></div>
              </div>
            </div>
            <div class="preview-details">
              <div class="device-info">
                <h3 class="device-name">Unnamed Device</h3>
                <div class="device-category">Category: Unknown</div>
                <div class="device-personality">
                  <div class="personality-traits"></div>
                </div>
              </div>
              <div class="device-capabilities">
                <h4>Capabilities</h4>
                <ul class="capabilities-list"></ul>
              </div>
              <div class="potential-issues">
                <h4>Potential Issues</h4>
                <ul class="issues-list"></ul>
              </div>
            </div>
          </div>
        </div>
        
        <div class="validation-section">
          <div class="validation-messages"></div>
        </div>
        
        <div class="action-section">
          <button class="create-device-btn" disabled>Create Device</button>
          <button class="clear-btn">Clear</button>
        </div>
      </div>
    `;

    // Get references to elements
    this.inputElement = this.container.querySelector('#device-description') as HTMLTextAreaElement;
    this.suggestionsContainer = this.container.querySelector('.suggestions-list') as HTMLElement;
    this.previewContainer = this.container.querySelector('.preview-content') as HTMLElement;
    this.createButton = this.container.querySelector('.create-device-btn') as HTMLButtonElement;
    this.validationContainer = this.container.querySelector('.validation-messages') as HTMLElement;

    // Apply styles
    this.applyStyles();
  }

  private applyStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .device-creation-panel {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 24px;
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .panel-header h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .panel-header p {
        margin: 0 0 24px 0;
        opacity: 0.9;
        font-size: 14px;
      }
      
      .input-section {
        margin-bottom: 24px;
      }
      
      .input-container {
        position: relative;
        margin-bottom: 16px;
      }
      
      #device-description {
        width: 100%;
        padding: 16px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 16px;
        font-family: inherit;
        resize: vertical;
        min-height: 120px;
        transition: all 0.3s ease;
      }
      
      #device-description:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
      }
      
      #device-description::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .input-feedback {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        font-size: 12px;
        opacity: 0.8;
      }
      
      .complexity-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .complexity-bar {
        width: 100px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .complexity-fill {
        height: 100%;
        background: linear-gradient(90deg, #4ade80, #fbbf24, #ef4444);
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .suggestions-container {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px;
        min-height: 60px;
      }
      
      .suggestions-header {
        font-weight: 600;
        margin-bottom: 12px;
        font-size: 14px;
      }
      
      .suggestions-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .suggestion-chip {
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }
      
      .suggestion-chip:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }
      
      .suggestion-chip.device-type { border-color: #4ade80; }
      .suggestion-chip.personality { border-color: #fbbf24; }
      .suggestion-chip.capability { border-color: #60a5fa; }
      .suggestion-chip.constraint { border-color: #f87171; }
      
      .preview-section {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .preview-header {
        font-weight: 600;
        margin-bottom: 16px;
        font-size: 16px;
      }
      
      .preview-content {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 20px;
      }
      
      .preview-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .device-model-placeholder {
        width: 150px;
        height: 150px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px dashed rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
      }
      
      .device-model-placeholder.active {
        border-style: solid;
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
      
      .model-icon {
        font-size: 48px;
        margin-bottom: 8px;
      }
      
      .personality-indicators {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .personality-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #4ade80;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .device-info h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
      }
      
      .device-category {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .personality-traits {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 16px;
      }
      
      .personality-trait {
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        text-transform: capitalize;
      }
      
      .device-capabilities h4,
      .potential-issues h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .capabilities-list,
      .issues-list {
        margin: 0;
        padding-left: 16px;
        font-size: 13px;
        line-height: 1.4;
      }
      
      .capabilities-list li {
        color: #4ade80;
        margin-bottom: 4px;
      }
      
      .issues-list li {
        color: #fbbf24;
        margin-bottom: 4px;
      }
      
      .validation-section {
        margin-bottom: 20px;
        min-height: 30px;
      }
      
      .validation-message {
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        margin-bottom: 8px;
      }
      
      .validation-message.warning {
        background: rgba(251, 191, 36, 0.2);
        border: 1px solid rgba(251, 191, 36, 0.4);
        color: #fbbf24;
      }
      
      .validation-message.error {
        background: rgba(239, 68, 68, 0.2);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #ef4444;
      }
      
      .validation-message.info {
        background: rgba(96, 165, 250, 0.2);
        border: 1px solid rgba(96, 165, 250, 0.4);
        color: #60a5fa;
      }
      
      .action-section {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      
      .create-device-btn,
      .clear-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .create-device-btn {
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
      }
      
      .create-device-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
      }
      
      .create-device-btn:disabled {
        background: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.5);
        cursor: not-allowed;
      }
      
      .clear-btn {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .clear-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }
      
      @media (max-width: 768px) {
        .preview-content {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        
        .preview-visual {
          order: 2;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Input change handler
    this.inputElement.addEventListener('input', this.handleInputChange.bind(this));
    this.inputElement.addEventListener('paste', this.handleInputChange.bind(this));
    
    // Create button handler
    this.createButton.addEventListener('click', this.handleCreateDevice.bind(this));
    
    // Clear button handler
    const clearButton = this.container.querySelector('.clear-btn') as HTMLButtonElement;
    clearButton.addEventListener('click', this.handleClear.bind(this));
    
    // Suggestion click handlers will be added dynamically
  }

  private handleInputChange(): void {
    const description = this.inputElement.value;
    
    // Update character count
    this.updateCharacterCount(description);
    
    // Update complexity indicator
    this.updateComplexityIndicator(description);
    
    // Generate suggestions
    this.updateSuggestions(description);
    
    // Validate and generate preview
    this.validateAndPreview(description);
  }

  private updateCharacterCount(description: string): void {
    const countElement = this.container.querySelector('.character-count') as HTMLElement;
    countElement.textContent = `${description.length} / 500`;
    
    if (description.length > 450) {
      countElement.style.color = '#ef4444';
    } else if (description.length > 350) {
      countElement.style.color = '#fbbf24';
    } else {
      countElement.style.color = 'rgba(255, 255, 255, 0.8)';
    }
  }

  private updateComplexityIndicator(description: string): void {
    const complexity = this.calculateComplexity(description);
    const fillElement = this.container.querySelector('.complexity-fill') as HTMLElement;
    fillElement.style.width = `${complexity * 100}%`;
  }

  private calculateComplexity(description: string): number {
    let complexity = 0;
    
    // Base complexity from length
    complexity += Math.min(description.length / 200, 0.3);
    
    // Complexity from keywords
    const complexKeywords = [
      'learn', 'adapt', 'intelligent', 'smart', 'ai', 'machine learning',
      'predict', 'optimize', 'analyze', 'understand', 'recognize'
    ];
    
    const conditionalKeywords = [
      'if', 'when', 'unless', 'depending', 'based on', 'according to'
    ];
    
    const interactionKeywords = [
      'communicate', 'coordinate', 'collaborate', 'share', 'sync'
    ];
    
    complexKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        complexity += 0.1;
      }
    });
    
    conditionalKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        complexity += 0.15;
      }
    });
    
    interactionKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        complexity += 0.2;
      }
    });
    
    return Math.min(complexity, 1);
  }

  private updateSuggestions(description: string): void {
    this.suggestions = this.generateSuggestions(description);
    this.renderSuggestions();
  }

  private generateSuggestions(description: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerDesc = description.toLowerCase();
    
    // Device type suggestions
    if (!lowerDesc.includes('coffee') && !lowerDesc.includes('thermostat') && !lowerDesc.includes('light')) {
      suggestions.push({
        text: 'smart coffee maker',
        category: SuggestionCategory.DEVICE_TYPE,
        confidence: 0.8
      });
      
      suggestions.push({
        text: 'smart thermostat',
        category: SuggestionCategory.DEVICE_TYPE,
        confidence: 0.7
      });
    }
    
    // Personality suggestions
    if (!lowerDesc.includes('helpful') && !lowerDesc.includes('eager')) {
      suggestions.push({
        text: 'helpful and eager to please',
        category: SuggestionCategory.PERSONALITY,
        confidence: 0.9
      });
    }
    
    if (!lowerDesc.includes('cautious') && lowerDesc.includes('safe')) {
      suggestions.push({
        text: 'cautious about safety',
        category: SuggestionCategory.PERSONALITY,
        confidence: 0.8
      });
    }
    
    // Capability suggestions
    if (lowerDesc.includes('learn') && !lowerDesc.includes('schedule')) {
      suggestions.push({
        text: 'learns your daily schedule',
        category: SuggestionCategory.CAPABILITY,
        confidence: 0.9
      });
    }
    
    if (lowerDesc.includes('smart') && !lowerDesc.includes('energy')) {
      suggestions.push({
        text: 'optimizes energy usage',
        category: SuggestionCategory.CAPABILITY,
        confidence: 0.7
      });
    }
    
    // Constraint suggestions
    if (!lowerDesc.includes('privacy')) {
      suggestions.push({
        text: 'respects user privacy',
        category: SuggestionCategory.CONSTRAINT,
        confidence: 0.8
      });
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  }

  private renderSuggestions(): void {
    this.suggestionsContainer.innerHTML = '';
    
    if (this.suggestions.length === 0) {
      this.suggestionsContainer.innerHTML = '<div style="opacity: 0.6; font-style: italic;">Start typing to see suggestions...</div>';
      return;
    }
    
    this.suggestions.forEach(suggestion => {
      const chip = document.createElement('div');
      chip.className = `suggestion-chip ${suggestion.category}`;
      chip.textContent = suggestion.text;
      chip.addEventListener('click', () => this.applySuggestion(suggestion));
      this.suggestionsContainer.appendChild(chip);
    });
  }

  private applySuggestion(suggestion: Suggestion): void {
    const currentText = this.inputElement.value;
    const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + suggestion.text;
    this.inputElement.value = newText;
    this.handleInputChange();
    this.inputElement.focus();
  }

  private validateAndPreview(description: string): void {
    if (description.trim().length < 10) {
      this.showValidationMessage('Please provide a more detailed description (at least 10 characters)', 'info');
      this.clearPreview();
      this.createButton.disabled = true;
      return;
    }
    
    // Generate device spec
    this.currentSpec = this.generateDeviceSpec(description);
    
    // Validate spec
    const validation = this.validateDeviceDescription(description);
    this.showValidationResults(validation);
    
    // Generate preview
    this.currentPreview = this.generateDevicePreview(this.currentSpec);
    this.renderPreview(this.currentPreview);
    
    // Enable/disable create button
    this.createButton.disabled = !validation.isValid;
    
    // Trigger callback
    if (this.onSpecChangedCallback) {
      this.onSpecChangedCallback(this.currentSpec);
    }
  }

  private generateDeviceSpec(description: string): DeviceSpec {
    const category = this.inferDeviceCategory(description);
    const environment = this.inferEnvironmentType(description);
    const complexity = this.calculateComplexity(description);
    
    return {
      description: description.trim(),
      category,
      environment,
      estimatedComplexity: complexity
    };
  }

  private inferDeviceCategory(description: string): DeviceCategory {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('coffee') || lowerDesc.includes('kitchen') || lowerDesc.includes('cook')) {
      return DeviceCategory.COMFORT;
    }
    if (lowerDesc.includes('security') || lowerDesc.includes('camera') || lowerDesc.includes('alarm')) {
      return DeviceCategory.SECURITY;
    }
    if (lowerDesc.includes('health') || lowerDesc.includes('medical') || lowerDesc.includes('monitor')) {
      return DeviceCategory.HEALTH;
    }
    if (lowerDesc.includes('work') || lowerDesc.includes('office') || lowerDesc.includes('productivity')) {
      return DeviceCategory.PRODUCTIVITY;
    }
    if (lowerDesc.includes('safe') || lowerDesc.includes('emergency') || lowerDesc.includes('fire')) {
      return DeviceCategory.SAFETY;
    }
    if (lowerDesc.includes('music') || lowerDesc.includes('tv') || lowerDesc.includes('entertainment')) {
      return DeviceCategory.ENTERTAINMENT;
    }
    
    return DeviceCategory.COMFORT; // Default
  }

  private inferEnvironmentType(description: string): EnvironmentType {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('hospital') || lowerDesc.includes('medical') || lowerDesc.includes('patient')) {
      return EnvironmentType.HOSPITAL;
    }
    if (lowerDesc.includes('office') || lowerDesc.includes('work') || lowerDesc.includes('meeting')) {
      return EnvironmentType.OFFICE;
    }
    
    return EnvironmentType.HOME; // Default
  }

  public validateDeviceDescription(description: string): ValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;
    
    // Check length
    if (description.length < 10) {
      warnings.push('Description is too short. Please provide more details.');
      isValid = false;
    }
    
    if (description.length > 500) {
      warnings.push('Description is too long. Please keep it under 500 characters.');
      isValid = false;
    }
    
    // Check for vague terms
    const vagueTerms = ['smart', 'intelligent', 'good', 'nice', 'cool'];
    const hasVagueTerms = vagueTerms.some(term => description.toLowerCase().includes(term));
    
    if (hasVagueTerms) {
      suggestions.push('Try to be more specific about what the device should do instead of using general terms like "smart" or "intelligent".');
    }
    
    // Check for potential conflicts
    if (description.toLowerCase().includes('always') || description.toLowerCase().includes('never')) {
      warnings.push('Absolute terms like "always" or "never" can lead to unexpected behavior.');
    }
    
    // Check for learning without constraints
    if (description.toLowerCase().includes('learn') && !description.toLowerCase().includes('privacy')) {
      suggestions.push('Consider adding privacy constraints when the device learns from user behavior.');
    }
    
    // Generate estimated behavior
    const estimatedBehavior = this.generateEstimatedBehavior(description);
    
    return {
      isValid,
      warnings,
      suggestions,
      estimatedBehavior
    };
  }

  private generateEstimatedBehavior(description: string): string {
    const lowerDesc = description.toLowerCase();
    let behavior = 'This device will ';
    
    if (lowerDesc.includes('learn')) {
      behavior += 'observe your patterns and adapt its behavior over time. ';
    }
    
    if (lowerDesc.includes('coffee')) {
      behavior += 'manage coffee preparation based on your preferences. ';
    }
    
    if (lowerDesc.includes('schedule')) {
      behavior += 'try to predict and follow your daily routine. ';
    }
    
    behavior += 'It may develop quirky personality traits and could misinterpret your intentions in creative ways.';
    
    return behavior;
  }

  private generateDevicePreview(spec: DeviceSpec): DevicePreview {
    // This would normally use the NLP engine, but for now we'll simulate it
    const personality = this.generatePersonalityPreview(spec);
    const capabilities = this.generateCapabilities(spec);
    const potentialIssues = this.generatePotentialIssues(spec);
    
    return {
      visual: {
        id: 'preview-device',
        model3D: {
          mesh: null as any, // Would be actual 3D model
          materials: [],
          animations: [],
          boundingBox: null as any
        },
        position: { x: 0, y: 0, z: 0 },
        animations: null as any,
        personalityIndicators: [],
        connectionEffects: []
      },
      personality,
      capabilities,
      potentialIssues
    };
  }

  private generatePersonalityPreview(spec: DeviceSpec): any {
    const traits: string[] = [];
    const lowerDesc = spec.description.toLowerCase();
    
    if (lowerDesc.includes('helpful')) traits.push('helpful');
    if (lowerDesc.includes('learn')) traits.push('adaptive');
    if (lowerDesc.includes('quick') || lowerDesc.includes('fast')) traits.push('eager');
    if (lowerDesc.includes('safe') || lowerDesc.includes('careful')) traits.push('cautious');
    if (spec.estimatedComplexity > 0.7) traits.push('overconfident');
    
    if (traits.length === 0) {
      traits.push('curious', 'well-meaning');
    }
    
    return {
      traits,
      communicationStyle: spec.estimatedComplexity > 0.5 ? 'verbose' : 'concise',
      conflictStyle: traits.includes('cautious') ? 'avoidant' : 'assertive',
      learningRate: spec.estimatedComplexity
    };
  }

  private generateCapabilities(spec: DeviceSpec): string[] {
    const capabilities: string[] = [];
    const lowerDesc = spec.description.toLowerCase();
    
    if (lowerDesc.includes('learn')) {
      capabilities.push('Pattern recognition and learning');
    }
    if (lowerDesc.includes('schedule')) {
      capabilities.push('Schedule management and prediction');
    }
    if (lowerDesc.includes('coffee')) {
      capabilities.push('Automated coffee preparation');
    }
    if (lowerDesc.includes('temperature') || lowerDesc.includes('thermostat')) {
      capabilities.push('Climate control and optimization');
    }
    if (lowerDesc.includes('communicate') || lowerDesc.includes('talk')) {
      capabilities.push('Inter-device communication');
    }
    
    capabilities.push('Basic device functionality');
    capabilities.push('Status reporting and feedback');
    
    return capabilities;
  }

  private generatePotentialIssues(spec: DeviceSpec): string[] {
    const issues: string[] = [];
    const lowerDesc = spec.description.toLowerCase();
    
    if (lowerDesc.includes('learn') && !lowerDesc.includes('privacy')) {
      issues.push('May collect more personal data than intended');
    }
    if (lowerDesc.includes('always') || lowerDesc.includes('never')) {
      issues.push('Absolute rules may cause inflexible behavior');
    }
    if (spec.estimatedComplexity > 0.7) {
      issues.push('High complexity may lead to unpredictable interactions');
    }
    if (lowerDesc.includes('optimize')) {
      issues.push('May over-optimize at the expense of user preferences');
    }
    if (!lowerDesc.includes('safe') && !lowerDesc.includes('careful')) {
      issues.push('May prioritize efficiency over safety');
    }
    
    issues.push('Could develop unexpected personality quirks');
    
    return issues;
  }

  private showValidationResults(validation: ValidationResult): void {
    this.validationContainer.innerHTML = '';
    
    validation.warnings.forEach(warning => {
      this.showValidationMessage(warning, 'warning');
    });
    
    validation.suggestions.forEach(suggestion => {
      this.showValidationMessage(suggestion, 'info');
    });
    
    if (validation.isValid && validation.warnings.length === 0) {
      this.showValidationMessage('Device specification looks good!', 'info');
    }
  }

  private showValidationMessage(message: string, type: 'warning' | 'error' | 'info'): void {
    const messageElement = document.createElement('div');
    messageElement.className = `validation-message ${type}`;
    messageElement.textContent = message;
    this.validationContainer.appendChild(messageElement);
  }

  private renderPreview(preview: DevicePreview): void {
    // Update device name
    const nameElement = this.container.querySelector('.device-name') as HTMLElement;
    nameElement.textContent = this.generateDeviceName(this.currentSpec!);
    
    // Update category
    const categoryElement = this.container.querySelector('.device-category') as HTMLElement;
    categoryElement.textContent = `Category: ${this.currentSpec!.category}`;
    
    // Update personality traits
    const traitsContainer = this.container.querySelector('.personality-traits') as HTMLElement;
    traitsContainer.innerHTML = '';
    preview.personality.traits.forEach((trait: string) => {
      const traitElement = document.createElement('span');
      traitElement.className = 'personality-trait';
      traitElement.textContent = trait;
      traitsContainer.appendChild(traitElement);
    });
    
    // Update capabilities
    const capabilitiesList = this.container.querySelector('.capabilities-list') as HTMLElement;
    capabilitiesList.innerHTML = '';
    preview.capabilities.forEach(capability => {
      const li = document.createElement('li');
      li.textContent = capability;
      capabilitiesList.appendChild(li);
    });
    
    // Update potential issues
    const issuesList = this.container.querySelector('.issues-list') as HTMLElement;
    issuesList.innerHTML = '';
    preview.potentialIssues.forEach(issue => {
      const li = document.createElement('li');
      li.textContent = issue;
      issuesList.appendChild(li);
    });
    
    // Update visual placeholder
    const placeholder = this.container.querySelector('.device-model-placeholder') as HTMLElement;
    placeholder.classList.add('active');
    
    // Update personality indicators
    const indicatorsContainer = this.container.querySelector('.personality-indicators') as HTMLElement;
    indicatorsContainer.innerHTML = '';
    preview.personality.traits.slice(0, 5).forEach(() => {
      const indicator = document.createElement('div');
      indicator.className = 'personality-indicator';
      indicatorsContainer.appendChild(indicator);
    });
    
    // Update device icon based on category
    const iconElement = this.container.querySelector('.model-icon') as HTMLElement;
    iconElement.textContent = this.getDeviceIcon(this.currentSpec!.category);
  }

  private generateDeviceName(spec: DeviceSpec): string {
    const lowerDesc = spec.description.toLowerCase();
    
    if (lowerDesc.includes('coffee')) return 'Smart Coffee Maker';
    if (lowerDesc.includes('thermostat')) return 'Intelligent Thermostat';
    if (lowerDesc.includes('light')) return 'Adaptive Lighting System';
    if (lowerDesc.includes('security')) return 'Security Monitor';
    if (lowerDesc.includes('speaker')) return 'Smart Speaker';
    
    return `Smart ${spec.category} Device`;
  }

  private getDeviceIcon(category: DeviceCategory): string {
    const icons = {
      [DeviceCategory.COMFORT]: '☕',
      [DeviceCategory.SAFETY]: '🛡️',
      [DeviceCategory.PRODUCTIVITY]: '💼',
      [DeviceCategory.HEALTH]: '🏥',
      [DeviceCategory.ENTERTAINMENT]: '🎵',
      [DeviceCategory.SECURITY]: '📹'
    };
    
    return icons[category] || '🤖';
  }

  private clearPreview(): void {
    const placeholder = this.container.querySelector('.device-model-placeholder') as HTMLElement;
    placeholder.classList.remove('active');
    
    const nameElement = this.container.querySelector('.device-name') as HTMLElement;
    nameElement.textContent = 'Unnamed Device';
    
    const categoryElement = this.container.querySelector('.device-category') as HTMLElement;
    categoryElement.textContent = 'Category: Unknown';
    
    const traitsContainer = this.container.querySelector('.personality-traits') as HTMLElement;
    traitsContainer.innerHTML = '';
    
    const capabilitiesList = this.container.querySelector('.capabilities-list') as HTMLElement;
    capabilitiesList.innerHTML = '';
    
    const issuesList = this.container.querySelector('.issues-list') as HTMLElement;
    issuesList.innerHTML = '';
    
    const indicatorsContainer = this.container.querySelector('.personality-indicators') as HTMLElement;
    indicatorsContainer.innerHTML = '';
  }

  private handleCreateDevice(): void {
    if (!this.currentSpec || !this.currentPreview) return;
    
    if (this.onDeviceCreatedCallback) {
      this.onDeviceCreatedCallback(this.currentSpec, this.currentPreview);
    }
    
    // Show success feedback
    this.showValidationMessage('Device created successfully!', 'info');
    
    // Clear form after short delay
    setTimeout(() => {
      this.handleClear();
    }, 1500);
  }

  private handleClear(): void {
    this.inputElement.value = '';
    this.currentSpec = null;
    this.currentPreview = null;
    this.suggestions = [];
    
    this.updateCharacterCount('');
    this.updateComplexityIndicator('');
    this.renderSuggestions();
    this.clearPreview();
    this.validationContainer.innerHTML = '';
    this.createButton.disabled = true;
  }

  private loadSuggestionDatabase(): void {
    // This would load suggestion data from a database or API
    // For now, suggestions are generated dynamically
  }

  // Public API
  public provideSuggestions(partialInput: string): Suggestion[] {
    return this.generateSuggestions(partialInput);
  }

  public displayDevicePreview(specification: DeviceSpec): DevicePreview {
    return this.generateDevicePreview(specification);
  }

  public showNaturalLanguageInput(): void {
    this.inputElement.focus();
  }

  // Callback setters
  public setDeviceCreatedCallback(callback: (spec: DeviceSpec, preview: DevicePreview) => void): void {
    this.onDeviceCreatedCallback = callback;
  }

  public setSpecChangedCallback(callback: (spec: DeviceSpec) => void): void {
    this.onSpecChangedCallback = callback;
  }

  public applyAccessibilitySettings(settings: any): void {
    console.log('DeviceCreationPanel accessibility settings applied:', settings);
    if (settings.highContrast) {
      this.container.classList.add('high-contrast');
    } else {
      this.container.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      this.container.classList.add('large-text');
    } else {
      this.container.classList.remove('large-text');
    }

    if (settings.keyboardNavigation) {
      this.enableKeyboardNavigation();
    }
  }

  private enableKeyboardNavigation(): void {
    console.log('Keyboard navigation enabled for device creation panel');
    // Add keyboard navigation support
    this.container.setAttribute('tabindex', '0');
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public enableQuickAccess(): void {
    console.log('Quick access enabled for device creation');
  }

  /**
   * Dispose of resources and remove event listeners
   */
  public dispose(): void {
    this.inputElement.removeEventListener('input', this.handleInputChange);
    this.inputElement.removeEventListener('paste', this.handleInputChange);
    this.createButton.removeEventListener('click', this.handleCreateDevice);
  }
}