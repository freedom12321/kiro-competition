import {
  AccessibilityAudioSystem as IAccessibilityAudioSystem,
  AccessibilityOptions,
  NavigationDirection,
  AudioContext as GameAudioContext
} from '../types/audio';

export class AccessibilityAudioSystem implements IAccessibilityAudioSystem {
  private audioContext: GameAudioContext;
  private speechSynthesis: SpeechSynthesis;
  private options: AccessibilityOptions;
  private navigationSounds: Map<NavigationDirection, AudioBuffer> = new Map();
  private enabled = false;

  constructor(audioContext: GameAudioContext) {
    this.audioContext = audioContext;
    this.speechSynthesis = window.speechSynthesis;
    
    this.options = {
      enableAudioDescriptions: false,
      enableNavigationSounds: false,
      enableActionAnnouncements: false,
      speechRate: 1.0,
      speechPitch: 1.0,
      speechVolume: 1.0,
      preferredVoice: undefined
    };

    this.initializeNavigationSounds();
  }

  private initializeNavigationSounds(): void {
    const directions = [
      NavigationDirection.UP,
      NavigationDirection.DOWN,
      NavigationDirection.LEFT,
      NavigationDirection.RIGHT,
      NavigationDirection.ENTER,
      NavigationDirection.EXIT,
      NavigationDirection.NEXT,
      NavigationDirection.PREVIOUS
    ];

    directions.forEach(direction => {
      const sound = this.createNavigationSound(direction);
      this.navigationSounds.set(direction, sound);
    });
  }

  private createNavigationSound(direction: NavigationDirection): AudioBuffer {
    const duration = 0.2;
    const sampleRate = this.audioContext.context.sampleRate;
    const length = sampleRate * duration;
    const audioBuffer = this.audioContext.context.createBuffer(1, length, sampleRate);
    const data = audioBuffer.getChannelData(0);

    // Create distinct sounds for each direction
    const soundParams = this.getNavigationSoundParams(direction);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Generate sound based on direction
      soundParams.frequencies.forEach((freq, index) => {
        const phase = 2 * Math.PI * freq * t;
        const amplitude = soundParams.amplitude / soundParams.frequencies.length;
        sample += Math.sin(phase) * amplitude;
      });

      // Apply envelope
      const envelope = this.calculateNavigationEnvelope(t, duration, soundParams.envelopeType);
      data[i] = sample * envelope;
    }

    return audioBuffer;
  }

  private getNavigationSoundParams(direction: NavigationDirection): {
    frequencies: number[];
    amplitude: number;
    envelopeType: string;
  } {
    const paramMap: { [key in NavigationDirection]: any } = {
      [NavigationDirection.UP]: { 
        frequencies: [440, 554], // A4 to C#5 (ascending)
        amplitude: 0.3, 
        envelopeType: 'rising' 
      },
      [NavigationDirection.DOWN]: { 
        frequencies: [554, 440], // C#5 to A4 (descending)
        amplitude: 0.3, 
        envelopeType: 'falling' 
      },
      [NavigationDirection.LEFT]: { 
        frequencies: [392], // G4 (single tone, lower)
        amplitude: 0.4, 
        envelopeType: 'quick' 
      },
      [NavigationDirection.RIGHT]: { 
        frequencies: [523], // C5 (single tone, higher)
        amplitude: 0.4, 
        envelopeType: 'quick' 
      },
      [NavigationDirection.ENTER]: { 
        frequencies: [523, 659, 784], // C major chord
        amplitude: 0.5, 
        envelopeType: 'confirm' 
      },
      [NavigationDirection.EXIT]: { 
        frequencies: [349, 294], // F4 to D4 (descending)
        amplitude: 0.4, 
        envelopeType: 'exit' 
      },
      [NavigationDirection.NEXT]: { 
        frequencies: [440, 494], // A4 to B4
        amplitude: 0.3, 
        envelopeType: 'forward' 
      },
      [NavigationDirection.PREVIOUS]: { 
        frequencies: [494, 440], // B4 to A4
        amplitude: 0.3, 
        envelopeType: 'backward' 
      }
    };

    return paramMap[direction];
  }

  private calculateNavigationEnvelope(t: number, duration: number, envelopeType: string): number {
    switch (envelopeType) {
      case 'rising':
        return Math.min(1, t / duration * 2); // Quick rise, sustain
      case 'falling':
        return Math.max(0, 1 - t / duration * 2); // Quick fall from peak
      case 'quick':
        return Math.sin((t / duration) * Math.PI); // Quick bell curve
      case 'confirm':
        // Sharp attack, sustained, gentle release
        if (t < 0.05) return t / 0.05;
        if (t < duration * 0.7) return 1;
        return 1 - (t - duration * 0.7) / (duration * 0.3);
      case 'exit':
        return Math.max(0, 1 - t / duration); // Linear fade out
      case 'forward':
        return t < duration / 2 ? (t / (duration / 2)) : 1; // Rise then sustain
      case 'backward':
        return t > duration / 2 ? ((duration - t) / (duration / 2)) : 1; // Sustain then fall
      default:
        return Math.sin((t / duration) * Math.PI);
    }
  }

  configure(options: AccessibilityOptions): void {
    this.options = { ...this.options, ...options };
    this.enabled = options.enableAudioDescriptions || 
                   options.enableNavigationSounds || 
                   options.enableActionAnnouncements;
  }

  announceAction(action: string): void {
    if (!this.enabled || !this.options.enableActionAnnouncements) return;

    const announcement = this.formatActionAnnouncement(action);
    this.speak(announcement);
  }

  private formatActionAnnouncement(action: string): string {
    // Convert camelCase or snake_case to readable format
    const readable = action
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toLowerCase()
      .trim();

    // Add context for common actions
    const actionMap: { [key: string]: string } = {
      'button click': 'Button activated',
      'drag start': 'Started dragging item',
      'drag drop': 'Item placed',
      'drag invalid': 'Invalid placement',
      'device created': 'New device created',
      'device selected': 'Device selected',
      'crisis detected': 'Crisis detected! Attention required',
      'crisis resolved': 'Crisis successfully resolved',
      'achievement unlocked': 'Achievement unlocked!',
      'level complete': 'Level completed successfully'
    };

    return actionMap[readable] || readable;
  }

  describeVisualElement(elementId: string): void {
    if (!this.enabled || !this.options.enableAudioDescriptions) return;

    const description = this.getElementDescription(elementId);
    if (description) {
      this.speak(description);
    }
  }

  private getElementDescription(elementId: string): string | null {
    // Map element IDs to descriptions
    const descriptions: { [key: string]: string } = {
      'device-creation-panel': 'Device creation panel. Enter natural language description to create AI devices.',
      'room-designer': 'Room designer. Drag and drop devices to arrange your smart environment.',
      'crisis-management-panel': 'Crisis management panel. Monitor system health and resolve conflicts.',
      'governance-rule-designer': 'Governance rule designer. Create rules to manage device behavior.',
      'tutorial-overlay': 'Tutorial overlay. Follow the highlighted steps to learn the game.',
      'achievement-notification': 'Achievement notification. You have unlocked a new achievement.',
      'harmony-indicator': 'System harmony indicator. Shows how well your devices are cooperating.',
      'device-mood-display': 'Device mood display. Shows the emotional state of your AI devices.',
      'resource-usage-chart': 'Resource usage chart. Monitor energy, bandwidth, and processing usage.',
      'conflict-visualization': 'Conflict visualization. Shows active conflicts between devices.',
      'recovery-wizard': 'Recovery wizard. Step-by-step guidance to resolve system problems.'
    };

    return descriptions[elementId] || null;
  }

  playNavigationSound(direction: NavigationDirection): void {
    if (!this.enabled || !this.options.enableNavigationSounds) return;

    const soundBuffer = this.navigationSounds.get(direction);
    if (!soundBuffer) return;

    const source = this.audioContext.context.createBufferSource();
    source.buffer = soundBuffer;
    
    const gainNode = this.audioContext.context.createGain();
    gainNode.gain.setValueAtTime(0.6, this.audioContext.context.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.voiceGain);
    source.start();
  }

  enableAudioCues(enabled: boolean): void {
    this.options.enableNavigationSounds = enabled;
    this.enabled = this.options.enableAudioDescriptions || 
                   this.options.enableNavigationSounds || 
                   this.options.enableActionAnnouncements;
  }

  setAnnouncementSpeed(speed: number): void {
    this.options.speechRate = Math.max(0.5, Math.min(2.0, speed));
  }

  private speak(text: string): void {
    if (!this.speechSynthesis) {
      console.warn('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.options.speechRate;
    utterance.pitch = this.options.speechPitch;
    utterance.volume = this.options.speechVolume;

    // Set preferred voice if available
    if (this.options.preferredVoice) {
      const voices = this.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name === this.options.preferredVoice || 
        voice.lang.includes(this.options.preferredVoice!)
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    // Error handling
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
    };

    this.speechSynthesis.speak(utterance);
  }

  // Utility methods for common accessibility announcements
  announceDeviceCreated(deviceType: string, personality: string): void {
    if (!this.enabled) return;
    this.speak(`Created ${personality} ${deviceType} device`);
  }

  announceDevicePlaced(deviceType: string, location: string): void {
    if (!this.enabled) return;
    this.speak(`Placed ${deviceType} device at ${location}`);
  }

  announceCrisisLevel(level: string, deviceCount: number): void {
    if (!this.enabled) return;
    this.speak(`${level} level crisis detected involving ${deviceCount} devices`);
  }

  announceHarmonyLevel(level: string): void {
    if (!this.enabled) return;
    this.speak(`System harmony level: ${level}`);
  }

  announceResourceUsage(resource: string, percentage: number): void {
    if (!this.enabled) return;
    this.speak(`${resource} usage at ${percentage} percent`);
  }

  announceRuleCreated(ruleName: string): void {
    if (!this.enabled) return;
    this.speak(`Created governance rule: ${ruleName}`);
  }

  announceRuleViolation(ruleName: string, deviceName: string): void {
    if (!this.enabled) return;
    this.speak(`Rule violation: ${deviceName} violated ${ruleName}`);
  }

  announceScenarioStart(scenarioName: string, difficulty: string): void {
    if (!this.enabled) return;
    this.speak(`Starting ${difficulty} scenario: ${scenarioName}`);
  }

  announceScenarioComplete(scenarioName: string, score: number): void {
    if (!this.enabled) return;
    this.speak(`Scenario completed: ${scenarioName}. Score: ${score} points`);
  }

  announceAchievement(achievementName: string, description: string): void {
    if (!this.enabled) return;
    this.speak(`Achievement unlocked: ${achievementName}. ${description}`);
  }

  // Screen reader support
  setAriaLabel(elementId: string, label: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-label', label);
    }
  }

  setAriaDescription(elementId: string, description: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-description', description);
    }
  }

  announceRegionChange(regionName: string): void {
    if (!this.enabled) return;
    this.speak(`Entered ${regionName} region`);
  }

  announceModalOpen(modalTitle: string): void {
    if (!this.enabled) return;
    this.speak(`Opened ${modalTitle} dialog`);
  }

  announceModalClose(): void {
    if (!this.enabled) return;
    this.speak('Dialog closed');
  }

  // Cleanup
  stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
    this.enabled = false;
  }
}