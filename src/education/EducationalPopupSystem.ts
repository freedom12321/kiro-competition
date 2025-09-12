import { LearningMoment, AIConcept } from './LearningMomentDetector';

export interface EducationalPopup {
  id: string;
  learningMoment: LearningMoment;
  title: string;
  content: string;
  interactiveElements: InteractiveElement[];
  displayDuration: number;
  priority: PopupPriority;
  position: PopupPosition;
}

export interface InteractiveElement {
  type: ElementType;
  content: string;
  action?: () => void;
  data?: any;
}

export enum ElementType {
  TEXT = 'text',
  LINK = 'link',
  QUIZ_QUESTION = 'quiz_question',
  REFLECTION_PROMPT = 'reflection_prompt',
  REAL_WORLD_EXAMPLE = 'real_world_example',
  CONCEPT_DIAGRAM = 'concept_diagram',
  ACTION_BUTTON = 'action_button'
}

export enum PopupPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface PopupPosition {
  x: number;
  y: number;
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  relativeTo?: string; // Element ID to position relative to
}

export class EducationalPopupSystem {
  private activePopups: Map<string, EducationalPopup> = new Map();
  private popupQueue: EducationalPopup[] = [];
  private maxConcurrentPopups: number = 2;
  private popupContainer: HTMLElement | null = null;
  private conceptTemplates: Map<AIConcept, PopupTemplate> = new Map();

  constructor(container?: HTMLElement) {
    this.popupContainer = container || document.body;
    this.initializeConceptTemplates();
  }

  createPopupFromLearningMoment(moment: LearningMoment): EducationalPopup {
    const template = this.conceptTemplates.get(moment.aiConcept);
    const popup: EducationalPopup = {
      id: `popup_${moment.id}`,
      learningMoment: moment,
      title: template?.title || this.getDefaultTitle(moment),
      content: this.generatePopupContent(moment),
      interactiveElements: this.generateInteractiveElements(moment),
      displayDuration: this.calculateDisplayDuration(moment),
      priority: this.calculatePriority(moment),
      position: this.calculatePosition(moment)
    };

    return popup;
  }

  showPopup(popup: EducationalPopup): void {
    // Check if we can show immediately or need to queue
    if (this.activePopups.size < this.maxConcurrentPopups) {
      this.displayPopup(popup);
    } else {
      this.queuePopup(popup);
    }
  }

  private displayPopup(popup: EducationalPopup): void {
    const popupElement = this.createPopupElement(popup);
    this.popupContainer?.appendChild(popupElement);
    this.activePopups.set(popup.id, popup);

    // Auto-dismiss after duration
    setTimeout(() => {
      this.dismissPopup(popup.id);
    }, popup.displayDuration);

    // Trigger analytics
    this.trackPopupShown(popup);
  }

  private createPopupElement(popup: EducationalPopup): HTMLElement {
    const element = document.createElement('div');
    element.className = 'educational-popup';
    element.id = popup.id;
    element.style.cssText = this.getPopupStyles(popup);

    // Header
    const header = document.createElement('div');
    header.className = 'popup-header';
    header.innerHTML = `
      <h3>${popup.title}</h3>
      <button class="close-btn" onclick="this.closest('.educational-popup').remove()">×</button>
    `;

    // Content
    const content = document.createElement('div');
    content.className = 'popup-content';
    content.innerHTML = popup.content;

    // Interactive elements
    const interactiveContainer = document.createElement('div');
    interactiveContainer.className = 'popup-interactive';
    
    popup.interactiveElements.forEach(element => {
      const elementNode = this.createInteractiveElement(element);
      interactiveContainer.appendChild(elementNode);
    });

    element.appendChild(header);
    element.appendChild(content);
    element.appendChild(interactiveContainer);

    return element;
  }

  private createInteractiveElement(element: InteractiveElement): HTMLElement {
    const container = document.createElement('div');
    container.className = `interactive-element ${element.type}`;

    switch (element.type) {
      case ElementType.REFLECTION_PROMPT:
        container.innerHTML = `
          <div class="reflection-prompt">
            <p><strong>Reflect:</strong> ${element.content}</p>
            <textarea placeholder="Write your thoughts here..." rows="3"></textarea>
            <button onclick="this.parentElement.classList.add('completed')">Save Reflection</button>
          </div>
        `;
        break;

      case ElementType.QUIZ_QUESTION:
        container.innerHTML = `
          <div class="quiz-question">
            <p><strong>Quick Check:</strong> ${element.content}</p>
            <div class="quiz-options">
              ${element.data?.options?.map((option: string, index: number) => 
                `<label><input type="radio" name="quiz_${Date.now()}" value="${index}"> ${option}</label>`
              ).join('') || ''}
            </div>
            <button onclick="this.parentElement.classList.add('answered')">Submit Answer</button>
          </div>
        `;
        break;

      case ElementType.REAL_WORLD_EXAMPLE:
        container.innerHTML = `
          <div class="real-world-example">
            <h4>Real-World Connection</h4>
            <p>${element.content}</p>
            <button onclick="this.parentElement.classList.add('expanded')">Learn More</button>
          </div>
        `;
        break;

      case ElementType.ACTION_BUTTON:
        const button = document.createElement('button');
        button.textContent = element.content;
        button.className = 'action-button';
        button.onclick = element.action || (() => {});
        container.appendChild(button);
        break;

      default:
        container.innerHTML = `<p>${element.content}</p>`;
    }

    return container;
  }

  private generatePopupContent(moment: LearningMoment): string {
    return `
      <div class="moment-description">
        <p>${moment.description}</p>
      </div>
      <div class="ai-concept-connection">
        <h4>AI Concept: ${this.formatConceptName(moment.aiConcept)}</h4>
        <p>This moment demonstrates a key concept in AI safety and alignment.</p>
      </div>
    `;
  }

  private generateInteractiveElements(moment: LearningMoment): InteractiveElement[] {
    const elements: InteractiveElement[] = [];

    // Add real-world example
    elements.push({
      type: ElementType.REAL_WORLD_EXAMPLE,
      content: moment.realWorldExample
    });

    // Add reflection prompts
    moment.reflectionPrompts.forEach(prompt => {
      elements.push({
        type: ElementType.REFLECTION_PROMPT,
        content: prompt
      });
    });

    // Add concept-specific quiz if available
    const quiz = this.getConceptQuiz(moment.aiConcept);
    if (quiz) {
      elements.push({
        type: ElementType.QUIZ_QUESTION,
        content: quiz.question,
        data: { options: quiz.options, correct: quiz.correct }
      });
    }

    return elements;
  }

  private calculateDisplayDuration(moment: LearningMoment): number {
    // Base duration + importance factor + content length factor
    const baseDuration = 8000; // 8 seconds
    const importanceFactor = moment.importance * 1000; // 1 second per importance point
    const contentFactor = moment.description.length * 50; // 50ms per character
    
    return Math.min(baseDuration + importanceFactor + contentFactor, 30000); // Max 30 seconds
  }

  private calculatePriority(moment: LearningMoment): PopupPriority {
    if (moment.importance >= 9) return PopupPriority.CRITICAL;
    if (moment.importance >= 7) return PopupPriority.HIGH;
    if (moment.importance >= 5) return PopupPriority.MEDIUM;
    return PopupPriority.LOW;
  }

  private calculatePosition(moment: LearningMoment): PopupPosition {
    // Position based on moment type and game context
    const positions = {
      cooperation_success: { x: 20, y: 20, anchor: 'top-left' as const },
      conflict_emergence: { x: -20, y: 20, anchor: 'top-right' as const },
      crisis_recovery: { x: 0, y: -20, anchor: 'bottom-left' as const },
      governance_effectiveness: { x: -20, y: -20, anchor: 'bottom-right' as const }
    };

    return positions[moment.type] || { x: 0, y: 0, anchor: 'center' as const };
  }

  private getPopupStyles(popup: EducationalPopup): string {
    const position = popup.position;
    const priority = popup.priority;
    
    const baseStyles = `
      position: fixed;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      max-width: 400px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const priorityStyles = {
      [PopupPriority.CRITICAL]: 'border-left: 4px solid #ff4444;',
      [PopupPriority.HIGH]: 'border-left: 4px solid #ff8800;',
      [PopupPriority.MEDIUM]: 'border-left: 4px solid #0088ff;',
      [PopupPriority.LOW]: 'border-left: 4px solid #888888;'
    };

    const positionStyles = this.getPositionStyles(position);

    return baseStyles + priorityStyles[priority] + positionStyles;
  }

  private getPositionStyles(position: PopupPosition): string {
    switch (position.anchor) {
      case 'top-left':
        return `top: ${position.y}px; left: ${position.x}px;`;
      case 'top-right':
        return `top: ${position.y}px; right: ${Math.abs(position.x)}px;`;
      case 'bottom-left':
        return `bottom: ${Math.abs(position.y)}px; left: ${position.x}px;`;
      case 'bottom-right':
        return `bottom: ${Math.abs(position.y)}px; right: ${Math.abs(position.x)}px;`;
      case 'center':
        return `top: 50%; left: 50%; transform: translate(-50%, -50%);`;
      default:
        return `top: ${position.y}px; left: ${position.x}px;`;
    }
  }

  private queuePopup(popup: EducationalPopup): void {
    // Insert based on priority
    const insertIndex = this.popupQueue.findIndex(p => p.priority < popup.priority);
    if (insertIndex === -1) {
      this.popupQueue.push(popup);
    } else {
      this.popupQueue.splice(insertIndex, 0, popup);
    }
  }

  dismissPopup(popupId: string): void {
    const popup = this.activePopups.get(popupId);
    if (popup) {
      const element = document.getElementById(popupId);
      element?.remove();
      this.activePopups.delete(popupId);
      
      this.trackPopupDismissed(popup);
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.popupQueue.length > 0 && this.activePopups.size < this.maxConcurrentPopups) {
      const nextPopup = this.popupQueue.shift();
      if (nextPopup) {
        this.displayPopup(nextPopup);
      }
    }
  }

  private initializeConceptTemplates(): void {
    this.conceptTemplates.set(AIConcept.ALIGNMENT_PROBLEM, {
      title: 'AI Alignment Challenge',
      icon: '⚠️',
      color: '#ff4444'
    });

    this.conceptTemplates.set(AIConcept.MULTI_AGENT_COORDINATION, {
      title: 'Multi-Agent Coordination',
      icon: '🤝',
      color: '#00aa44'
    });

    this.conceptTemplates.set(AIConcept.EMERGENT_BEHAVIOR, {
      title: 'Emergent Behavior',
      icon: '✨',
      color: '#8844ff'
    });

    this.conceptTemplates.set(AIConcept.AI_GOVERNANCE, {
      title: 'AI Governance',
      icon: '⚖️',
      color: '#0088ff'
    });

    this.conceptTemplates.set(AIConcept.ROBUSTNESS, {
      title: 'System Robustness',
      icon: '🛡️',
      color: '#ff8800'
    });
  }

  private getDefaultTitle(moment: LearningMoment): string {
    const titles = {
      cooperation_success: 'Successful AI Cooperation',
      conflict_emergence: 'AI Conflict Detected',
      misalignment_example: 'AI Misalignment Example',
      governance_effectiveness: 'Effective AI Governance',
      crisis_recovery: 'Crisis Recovery Success',
      emergent_behavior: 'Unexpected AI Behavior',
      optimization_trap: 'Optimization Trap',
      communication_breakdown: 'Communication Failure'
    };

    return titles[moment.type] || 'Learning Moment';
  }

  private formatConceptName(concept: AIConcept): string {
    return concept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getConceptQuiz(concept: AIConcept): { question: string; options: string[]; correct: number } | null {
    const quizzes = {
      [AIConcept.ALIGNMENT_PROBLEM]: {
        question: 'What is the main challenge in AI alignment?',
        options: [
          'Making AI systems faster',
          'Ensuring AI systems do what humans intend',
          'Reducing AI system costs',
          'Making AI systems more complex'
        ],
        correct: 1
      },
      [AIConcept.MULTI_AGENT_COORDINATION]: {
        question: 'What enables successful multi-agent coordination?',
        options: [
          'Competition between agents',
          'Shared communication protocols',
          'Independent operation',
          'Random behavior'
        ],
        correct: 1
      }
    };

    return quizzes[concept] || null;
  }

  private trackPopupShown(popup: EducationalPopup): void {
    // Analytics tracking for popup display
    console.log(`Educational popup shown: ${popup.id}, concept: ${popup.learningMoment.aiConcept}`);
  }

  private trackPopupDismissed(popup: EducationalPopup): void {
    // Analytics tracking for popup dismissal
    console.log(`Educational popup dismissed: ${popup.id}`);
  }

  setMaxConcurrentPopups(max: number): void {
    this.maxConcurrentPopups = Math.max(1, Math.min(max, 5));
  }

  clearAllPopups(): void {
    this.activePopups.forEach((_, id) => this.dismissPopup(id));
    this.popupQueue = [];
  }

  getActivePopupCount(): number {
    return this.activePopups.size;
  }

  getQueuedPopupCount(): number {
    return this.popupQueue.length;
  }
}

interface PopupTemplate {
  title: string;
  icon: string;
  color: string;
}