import { LearningMomentDetector, LearningMoment, LearningMomentContext } from './LearningMomentDetector';
import { EducationalPopupSystem, EducationalPopup } from './EducationalPopupSystem';
import { ReflectionJournal, JournalEntry } from './ReflectionJournal';
import { GameEvent, AIAgent } from '../types/core';

export interface EducationalSettings {
  enablePopups: boolean;
  popupFrequency: PopupFrequency;
  enableJournal: boolean;
  autoSaveReflections: boolean;
  showRealWorldExamples: boolean;
  adaptiveDifficulty: boolean;
  maxConcurrentPopups: number;
}

export enum PopupFrequency {
  MINIMAL = 'minimal',     // Only critical moments
  MODERATE = 'moderate',   // Important moments
  FREQUENT = 'frequent',   // Most learning moments
  MAXIMUM = 'maximum'      // All learning moments
}

export interface LearningSession {
  id: string;
  startTime: number;
  endTime?: number;
  momentsDetected: number;
  popupsShown: number;
  reflectionsWritten: number;
  conceptsExplored: Set<string>;
  playerEngagement: EngagementMetrics;
}

export interface EngagementMetrics {
  popupInteractionRate: number;
  averageReflectionLength: number;
  conceptConnectionsMade: number;
  sessionDuration: number;
  returnVisits: number;
}

export class EducationalIntegrationSystem {
  private momentDetector: LearningMomentDetector;
  private popupSystem: EducationalPopupSystem;
  private journal: ReflectionJournal;
  private settings: EducationalSettings;
  private currentSession: LearningSession | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(settings?: Partial<EducationalSettings>) {
    this.settings = {
      enablePopups: true,
      popupFrequency: PopupFrequency.MODERATE,
      enableJournal: true,
      autoSaveReflections: true,
      showRealWorldExamples: true,
      adaptiveDifficulty: true,
      maxConcurrentPopups: 2,
      ...settings
    };

    this.momentDetector = new LearningMomentDetector();
    this.popupSystem = new EducationalPopupSystem();
    this.journal = new ReflectionJournal();

    this.initializeSystem();
  }

  startLearningSession(): string {
    const sessionId = `session_${Date.now()}`;
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      momentsDetected: 0,
      popupsShown: 0,
      reflectionsWritten: 0,
      conceptsExplored: new Set(),
      playerEngagement: {
        popupInteractionRate: 0,
        averageReflectionLength: 0,
        conceptConnectionsMade: 0,
        sessionDuration: 0,
        returnVisits: 0
      }
    };

    this.emit('sessionStarted', this.currentSession);
    return sessionId;
  }

  endLearningSession(): LearningSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.playerEngagement.sessionDuration = 
      this.currentSession.endTime - this.currentSession.startTime;

    const completedSession = { ...this.currentSession };
    this.emit('sessionEnded', completedSession);
    
    this.currentSession = null;
    return completedSession;
  }

  processGameEvent(gameEvent: GameEvent, context: LearningMomentContext): void {
    // Detect learning moments
    const moments = this.momentDetector.detectLearningMoments(gameEvent, context);
    
    if (moments.length === 0) return;

    // Update session metrics
    if (this.currentSession) {
      this.currentSession.momentsDetected += moments.length;
      moments.forEach(moment => {
        this.currentSession!.conceptsExplored.add(moment.aiConcept);
      });
    }

    // Process each learning moment
    moments.forEach(moment => {
      this.processLearningMoment(moment);
    });
  }

  private processLearningMoment(moment: LearningMoment): void {
    // Determine if we should show a popup based on settings and moment importance
    if (this.shouldShowPopup(moment)) {
      this.showEducationalPopup(moment);
    }

    // Auto-create journal entry if enabled
    if (this.settings.enableJournal && this.settings.autoSaveReflections) {
      this.createJournalEntry(moment);
    }

    // Emit event for other systems to respond
    this.emit('learningMomentDetected', moment);
  }

  private shouldShowPopup(moment: LearningMoment): boolean {
    if (!this.settings.enablePopups) return false;

    const frequencyThresholds = {
      [PopupFrequency.MINIMAL]: 9,    // Only critical importance
      [PopupFrequency.MODERATE]: 7,   // High importance and above
      [PopupFrequency.FREQUENT]: 5,   // Medium importance and above
      [PopupFrequency.MAXIMUM]: 1     // All moments
    };

    const threshold = frequencyThresholds[this.settings.popupFrequency];
    return moment.importance >= threshold;
  }

  private showEducationalPopup(moment: LearningMoment): void {
    const popup = this.popupSystem.createPopupFromLearningMoment(moment);
    
    // Customize popup based on settings
    if (!this.settings.showRealWorldExamples) {
      popup.interactiveElements = popup.interactiveElements.filter(
        element => element.type !== 'real_world_example'
      );
    }

    this.popupSystem.showPopup(popup);

    // Update session metrics
    if (this.currentSession) {
      this.currentSession.popupsShown++;
    }

    this.emit('popupShown', { moment, popup });
  }

  private createJournalEntry(moment: LearningMoment): void {
    // Create a basic entry that can be expanded by the player
    const entry = this.journal.createEntry(moment, '');
    this.emit('journalEntryCreated', entry);
  }

  addReflection(learningMomentId: string, reflection: string): JournalEntry | null {
    const entry = this.journal.addReflection(learningMomentId, reflection);
    
    if (entry && this.currentSession) {
      this.currentSession.reflectionsWritten++;
      this.currentSession.playerEngagement.averageReflectionLength = 
        this.calculateAverageReflectionLength();
    }

    if (entry) {
      this.emit('reflectionAdded', entry);
    }

    return entry;
  }

  rateExperience(entryId: string, rating: number): boolean {
    const success = this.journal.rateEntry(entryId, rating);
    
    if (success) {
      this.emit('experienceRated', { entryId, rating });
    }

    return success;
  }

  getPersonalizedRecommendations(): LearningRecommendation[] {
    const journalReport = this.journal.generateLearningReport();
    const recommendations: LearningRecommendation[] = [];

    // Recommend focus areas based on weak concepts
    journalReport.recommendedFocus.forEach(concept => {
      recommendations.push({
        type: 'concept_focus',
        title: `Explore ${this.formatConceptName(concept)} Further`,
        description: `You've had limited exposure to this important AI concept. Try scenarios that highlight ${concept}.`,
        priority: 'high',
        actionable: true,
        suggestedActions: [
          `Look for scenarios involving ${concept}`,
          `Reflect on how ${concept} applies to real-world AI systems`,
          `Compare your experiences with ${concept} to other AI concepts you've explored`
        ]
      });
    });

    // Recommend reflection improvement if quality is low
    if (journalReport.reflectionQuality.insightDepth < 2) {
      recommendations.push({
        type: 'reflection_quality',
        title: 'Deepen Your Reflections',
        description: 'Your reflections could benefit from more detailed analysis and insight generation.',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Ask yourself "why" and "how" questions about AI behaviors you observe',
          'Connect game events to real-world AI applications',
          'Consider multiple perspectives on AI alignment challenges'
        ]
      });
    }

    // Recommend concept connections if few are being made
    if (journalReport.reflectionQuality.conceptConnections < 1) {
      recommendations.push({
        type: 'concept_connections',
        title: 'Make More Connections',
        description: 'Try connecting different AI concepts and relating them to real-world examples.',
        priority: 'medium',
        actionable: true,
        suggestedActions: [
          'Compare how different AI concepts relate to each other',
          'Think about how game scenarios might apply to real AI systems',
          'Consider the broader implications of AI behaviors you observe'
        ]
      });
    }

    return recommendations;
  }

  updateSettings(newSettings: Partial<EducationalSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Apply settings to subsystems
    this.popupSystem.setMaxConcurrentPopups(this.settings.maxConcurrentPopups);
    
    this.emit('settingsUpdated', this.settings);
  }

  getSessionAnalytics(): SessionAnalytics | null {
    if (!this.currentSession) return null;

    const currentTime = Date.now();
    const sessionDuration = currentTime - this.currentSession.startTime;

    return {
      sessionId: this.currentSession.id,
      duration: sessionDuration,
      momentsDetected: this.currentSession.momentsDetected,
      popupsShown: this.currentSession.popupsShown,
      reflectionsWritten: this.currentSession.reflectionsWritten,
      conceptsExplored: this.currentSession.conceptsExplored.size,
      engagementRate: this.calculateEngagementRate(),
      learningVelocity: this.calculateLearningVelocity()
    };
  }

  exportLearningData(): EducationalExport {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: this.settings,
      journalData: this.journal.exportJournal(),
      sessionHistory: this.getSessionHistory(),
      recommendations: this.getPersonalizedRecommendations()
    };
  }

  importLearningData(data: EducationalExport): boolean {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }
      
      // Check for required fields
      if (!data.version || !data.exportDate) {
        return false;
      }
      
      if (data.settings) {
        this.updateSettings(data.settings);
      }
      
      if (data.journalData) {
        const success = this.journal.importJournal(data.journalData);
        if (!success) {
          return false;
        }
      }

      this.emit('dataImported', data);
      return true;
    } catch (error) {
      console.error('Failed to import learning data:', error);
      return false;
    }
  }

  // Event system for integration with other game systems
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  private initializeSystem(): void {
    // Set up popup system configuration
    this.popupSystem.setMaxConcurrentPopups(this.settings.maxConcurrentPopups);

    // Initialize any required DOM elements or event listeners
    this.setupDOMIntegration();
  }

  private setupDOMIntegration(): void {
    // Create educational overlay container if it doesn't exist
    if (!document.getElementById('educational-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'educational-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
      `;
      document.body.appendChild(overlay);
    }
  }

  private calculateAverageReflectionLength(): number {
    if (!this.currentSession) return 0;
    
    const recentEntries = this.journal.getRecentEntries(1); // Last day
    if (recentEntries.length === 0) return 0;

    const totalLength = recentEntries.reduce((sum, entry) => sum + entry.playerReflection.length, 0);
    return totalLength / recentEntries.length;
  }

  private calculateEngagementRate(): number {
    if (!this.currentSession || this.currentSession.popupsShown === 0) return 0;
    
    // Simple engagement rate based on reflections written vs popups shown
    return this.currentSession.reflectionsWritten / this.currentSession.popupsShown;
  }

  private calculateLearningVelocity(): number {
    if (!this.currentSession) return 0;
    
    const sessionDuration = Date.now() - this.currentSession.startTime;
    const hoursElapsed = sessionDuration / (1000 * 60 * 60);
    
    if (hoursElapsed === 0) return 0;
    
    return this.currentSession.conceptsExplored.size / hoursElapsed;
  }

  private formatConceptName(concept: string): string {
    return concept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getSessionHistory(): LearningSession[] {
    // This would typically be stored in a database or local storage
    // For now, return empty array as this is just the current session
    return [];
  }

  // Public getters for subsystems
  get detector(): LearningMomentDetector {
    return this.momentDetector;
  }

  get popups(): EducationalPopupSystem {
    return this.popupSystem;
  }

  get reflectionJournal(): ReflectionJournal {
    return this.journal;
  }

  get currentSettings(): EducationalSettings {
    return { ...this.settings };
  }
}

export interface LearningRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
}

export interface SessionAnalytics {
  sessionId: string;
  duration: number;
  momentsDetected: number;
  popupsShown: number;
  reflectionsWritten: number;
  conceptsExplored: number;
  engagementRate: number;
  learningVelocity: number;
}

export interface EducationalExport {
  version: string;
  exportDate: string;
  settings: EducationalSettings;
  journalData: any;
  sessionHistory: LearningSession[];
  recommendations: LearningRecommendation[];
}