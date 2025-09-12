import {
  DynamicMusicSystem as IDynamicMusicSystem,
  HarmonyLevel,
  StingerType,
  MusicTrack,
  MusicLayer,
  MusicMood,
  AudioContext as GameAudioContext
} from '../types/audio';

export class DynamicMusicSystem implements IDynamicMusicSystem {
  private audioContext: GameAudioContext;
  private currentTrack: MusicTrack | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private activeLayers: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
  private currentHarmonyLevel: HarmonyLevel = HarmonyLevel.MODERATE;
  private transitionInProgress = false;
  private musicTracks: Map<string, MusicTrack> = new Map();
  private stingers: Map<StingerType, AudioBuffer> = new Map();

  constructor(audioContext: GameAudioContext) {
    this.audioContext = audioContext;
    this.initializeMusicTracks();
    this.initializeStingers();
  }

  private initializeMusicTracks(): void {
    // Create procedural music tracks for different harmony levels
    const tracks: Array<{ id: string; mood: MusicMood; harmonyLevel: HarmonyLevel }> = [
      { id: 'peaceful_harmony', mood: MusicMood.PEACEFUL, harmonyLevel: HarmonyLevel.PERFECT },
      { id: 'focused_cooperation', mood: MusicMood.FOCUSED, harmonyLevel: HarmonyLevel.HIGH },
      { id: 'neutral_ambient', mood: MusicMood.MYSTERIOUS, harmonyLevel: HarmonyLevel.MODERATE },
      { id: 'building_tension', mood: MusicMood.TENSE, harmonyLevel: HarmonyLevel.LOW },
      { id: 'rising_conflict', mood: MusicMood.DRAMATIC, harmonyLevel: HarmonyLevel.TENSION },
      { id: 'system_chaos', mood: MusicMood.CHAOTIC, harmonyLevel: HarmonyLevel.CHAOS }
    ];

    tracks.forEach(trackInfo => {
      const track = this.createProceduralTrack(trackInfo.id, trackInfo.mood, trackInfo.harmonyLevel);
      this.musicTracks.set(trackInfo.id, track);
    });
  }

  private createProceduralTrack(id: string, mood: MusicMood, harmonyLevel: HarmonyLevel): MusicTrack {
    const duration = 30; // 30 seconds loop
    const sampleRate = this.audioContext.context.sampleRate;
    const length = sampleRate * duration;
    
    // Create main track buffer
    const audioBuffer = this.audioContext.context.createBuffer(2, length, sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    // Generate music based on mood and harmony level
    this.generateMusicWaveform(leftChannel, rightChannel, mood, harmonyLevel, duration);

    // Create layers for dynamic mixing
    const layers = this.createMusicLayers(mood, harmonyLevel, duration);

    return {
      id,
      name: this.getMoodName(mood),
      audioBuffer,
      bpm: this.getBPMForMood(mood),
      key: 'C',
      mood,
      layers,
      loopStart: 0,
      loopEnd: duration
    };
  }

  private generateMusicWaveform(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    mood: MusicMood,
    harmonyLevel: HarmonyLevel,
    duration: number
  ): void {
    const sampleRate = this.audioContext.context.sampleRate;
    const baseFreq = 130.81; // C3
    
    // Get chord progression based on mood
    const chordProgression = this.getChordProgression(mood);
    const chordDuration = duration / chordProgression.length;

    for (let i = 0; i < leftChannel.length; i++) {
      const t = i / sampleRate;
      const chordIndex = Math.floor(t / chordDuration) % chordProgression.length;
      const chord = chordProgression[chordIndex];
      
      let leftSample = 0;
      let rightSample = 0;

      // Generate chord tones
      chord.forEach((interval, index) => {
        const freq = baseFreq * interval;
        const phase = 2 * Math.PI * freq * t;
        const amplitude = 0.15 / chord.length;
        
        // Add slight stereo separation
        const panLeft = Math.cos((index / chord.length) * Math.PI / 2);
        const panRight = Math.sin((index / chord.length) * Math.PI / 2);
        
        const sample = Math.sin(phase) * amplitude;
        leftSample += sample * panLeft;
        rightSample += sample * panRight;
      });

      // Apply mood-specific modifications
      const moodModifier = this.getMoodModifier(mood, t);
      leftSample *= moodModifier;
      rightSample *= moodModifier;

      // Apply harmony level effects
      const harmonyModifier = this.getHarmonyModifier(harmonyLevel, t);
      leftSample *= harmonyModifier;
      rightSample *= harmonyModifier;

      // Apply envelope
      const envelope = this.calculateMusicEnvelope(t, duration);
      leftChannel[i] = leftSample * envelope;
      rightChannel[i] = rightSample * envelope;
    }
  }

  private getChordProgression(mood: MusicMood): number[][] {
    const progressions: { [key in MusicMood]: number[][] } = {
      [MusicMood.PEACEFUL]: [[1, 5/4, 3/2], [6/5, 3/2, 9/5], [4/3, 5/3, 2], [1, 5/4, 3/2]], // I-vi-IV-I
      [MusicMood.FOCUSED]: [[1, 5/4, 3/2], [9/8, 3/2, 15/8], [4/3, 5/3, 2], [1, 5/4, 3/2]], // I-ii-IV-I
      [MusicMood.TENSE]: [[1, 6/5, 3/2], [9/8, 4/3, 5/3], [6/5, 3/2, 9/5], [1, 6/5, 3/2]], // i-ii°-vi-i
      [MusicMood.DRAMATIC]: [[1, 6/5, 3/2], [9/8, 4/3, 5/3], [5/4, 3/2, 15/8], [1, 6/5, 3/2]], // i-ii°-III-i
      [MusicMood.CHAOTIC]: [[1, 17/16, 9/8], [16/15, 6/5, 4/3], [5/4, 11/8, 3/2], [1, 17/16, 9/8]], // Dissonant intervals
      [MusicMood.TRIUMPHANT]: [[1, 5/4, 3/2], [4/3, 5/3, 2], [9/8, 3/2, 15/8], [1, 5/4, 3/2]], // I-IV-ii-I
      [MusicMood.MYSTERIOUS]: [[1, 6/5, 7/5], [9/8, 4/3, 8/5], [6/5, 3/2, 9/5], [1, 6/5, 7/5]], // Minor with 7ths
      [MusicMood.PLAYFUL]: [[1, 5/4, 3/2], [5/4, 3/2, 15/8], [4/3, 5/3, 2], [1, 5/4, 3/2]] // I-III-IV-I
    };

    return progressions[mood] || progressions[MusicMood.PEACEFUL];
  }

  private getMoodModifier(mood: MusicMood, t: number): number {
    switch (mood) {
      case MusicMood.TENSE:
        return 1 + Math.sin(t * 4) * 0.1; // Slight tremolo
      case MusicMood.DRAMATIC:
        return 1 + Math.sin(t * 2) * 0.2; // More pronounced tremolo
      case MusicMood.CHAOTIC:
        return 1 + (Math.random() - 0.5) * 0.3; // Random amplitude variation
      case MusicMood.PLAYFUL:
        return 1 + Math.sin(t * 8) * 0.05; // Light vibrato
      default:
        return 1;
    }
  }

  private getHarmonyModifier(harmonyLevel: HarmonyLevel, t: number): number {
    const modifiers: { [key in HarmonyLevel]: number } = {
      [HarmonyLevel.PERFECT]: 1.0,
      [HarmonyLevel.HIGH]: 0.95,
      [HarmonyLevel.MODERATE]: 0.9,
      [HarmonyLevel.LOW]: 0.85,
      [HarmonyLevel.TENSION]: 0.8,
      [HarmonyLevel.CHAOS]: 0.7 + Math.sin(t * 10) * 0.2
    };

    return modifiers[harmonyLevel];
  }

  private calculateMusicEnvelope(t: number, duration: number): number {
    const fadeTime = 2.0; // 2 second fade in/out
    
    if (t < fadeTime) {
      return t / fadeTime;
    } else if (t > duration - fadeTime) {
      return (duration - t) / fadeTime;
    }
    return 1;
  }

  private createMusicLayers(mood: MusicMood, harmonyLevel: HarmonyLevel, duration: number): MusicLayer[] {
    const layers: MusicLayer[] = [];

    // Base layer (always active)
    layers.push({
      id: 'base',
      name: 'Base Layer',
      audioBuffer: this.createLayerBuffer('base', mood, duration),
      volume: 1.0,
      harmonyThreshold: 0,
      tensionThreshold: 0
    });

    // Harmony layer (active when harmony is high)
    layers.push({
      id: 'harmony',
      name: 'Harmony Layer',
      audioBuffer: this.createLayerBuffer('harmony', mood, duration),
      volume: 0.6,
      harmonyThreshold: 0.7,
      tensionThreshold: 0
    });

    // Tension layer (active when tension is high)
    layers.push({
      id: 'tension',
      name: 'Tension Layer',
      audioBuffer: this.createLayerBuffer('tension', mood, duration),
      volume: 0.8,
      harmonyThreshold: 0,
      tensionThreshold: 0.6
    });

    return layers;
  }

  private createLayerBuffer(layerType: string, mood: MusicMood, duration: number): AudioBuffer {
    const sampleRate = this.audioContext.context.sampleRate;
    const length = sampleRate * duration;
    const audioBuffer = this.audioContext.context.createBuffer(2, length, sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    // Generate layer-specific content
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let leftSample = 0;
      let rightSample = 0;

      switch (layerType) {
        case 'base':
          // Simple bass line
          leftSample = rightSample = Math.sin(2 * Math.PI * 65.41 * t) * 0.3; // C2
          break;
        case 'harmony':
          // High frequency harmonics
          leftSample = Math.sin(2 * Math.PI * 523.25 * t) * 0.2; // C5
          rightSample = Math.sin(2 * Math.PI * 659.25 * t) * 0.2; // E5
          break;
        case 'tension':
          // Dissonant intervals
          leftSample = Math.sin(2 * Math.PI * 293.66 * t) * 0.25; // D4
          rightSample = Math.sin(2 * Math.PI * 311.13 * t) * 0.25; // D#4
          break;
      }

      leftChannel[i] = leftSample;
      rightChannel[i] = rightSample;
    }

    return audioBuffer;
  }

  private initializeStingers(): void {
    const stingerTypes = [
      StingerType.CRISIS_START,
      StingerType.CRISIS_RESOLVED,
      StingerType.ACHIEVEMENT_UNLOCKED,
      StingerType.LEVEL_COMPLETE,
      StingerType.DISCOVERY,
      StingerType.WARNING,
      StingerType.FAILURE,
      StingerType.SUCCESS
    ];

    stingerTypes.forEach(type => {
      const stinger = this.createStinger(type);
      this.stingers.set(type, stinger);
    });
  }

  private createStinger(type: StingerType): AudioBuffer {
    const duration = this.getStingerDuration(type);
    const sampleRate = this.audioContext.context.sampleRate;
    const length = sampleRate * duration;
    const audioBuffer = this.audioContext.context.createBuffer(2, length, sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    const frequencies = this.getStingerFrequencies(type);
    
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let leftSample = 0;
      let rightSample = 0;

      frequencies.forEach((freq, index) => {
        const phase = 2 * Math.PI * freq * t;
        const amplitude = 0.3 / frequencies.length;
        const sample = Math.sin(phase) * amplitude;
        
        if (index % 2 === 0) {
          leftSample += sample;
        } else {
          rightSample += sample;
        }
      });

      const envelope = this.calculateStingerEnvelope(t, duration, type);
      leftChannel[i] = leftSample * envelope;
      rightChannel[i] = rightSample * envelope;
    }

    return audioBuffer;
  }

  private getStingerDuration(type: StingerType): number {
    const durations: { [key in StingerType]: number } = {
      [StingerType.CRISIS_START]: 1.5,
      [StingerType.CRISIS_RESOLVED]: 2.0,
      [StingerType.ACHIEVEMENT_UNLOCKED]: 1.8,
      [StingerType.LEVEL_COMPLETE]: 2.5,
      [StingerType.DISCOVERY]: 1.0,
      [StingerType.WARNING]: 0.8,
      [StingerType.FAILURE]: 1.2,
      [StingerType.SUCCESS]: 1.5
    };

    return durations[type];
  }

  private getStingerFrequencies(type: StingerType): number[] {
    const frequencyMap: { [key in StingerType]: number[] } = {
      [StingerType.CRISIS_START]: [220, 233, 247], // Dissonant cluster
      [StingerType.CRISIS_RESOLVED]: [523, 659, 784], // C major chord
      [StingerType.ACHIEVEMENT_UNLOCKED]: [523, 659, 784, 1047], // C major with octave
      [StingerType.LEVEL_COMPLETE]: [392, 523, 659, 784], // G major 7th
      [StingerType.DISCOVERY]: [880, 1109], // A5 and C#6
      [StingerType.WARNING]: [349, 370], // F4 and F#4 (dissonant)
      [StingerType.FAILURE]: [196, 208], // G3 and G#3 (dissonant)
      [StingerType.SUCCESS]: [523, 659] // C5 and E5
    };

    return frequencyMap[type];
  }

  private calculateStingerEnvelope(t: number, duration: number, type: StingerType): number {
    switch (type) {
      case StingerType.CRISIS_START:
        // Sharp attack, sustained
        return t < 0.1 ? t / 0.1 : Math.max(0.7, 1 - (t - 0.1) / (duration - 0.1));
      case StingerType.CRISIS_RESOLVED:
        // Gentle rise and fall
        return Math.sin((t / duration) * Math.PI);
      case StingerType.ACHIEVEMENT_UNLOCKED:
        // Quick rise, sustained, gentle fall
        if (t < 0.2) return t / 0.2;
        if (t < duration * 0.7) return 1;
        return 1 - (t - duration * 0.7) / (duration * 0.3);
      default:
        // Standard envelope
        return Math.sin((t / duration) * Math.PI);
    }
  }

  private getBPMForMood(mood: MusicMood): number {
    const bpmMap: { [key in MusicMood]: number } = {
      [MusicMood.PEACEFUL]: 60,
      [MusicMood.FOCUSED]: 80,
      [MusicMood.TENSE]: 100,
      [MusicMood.DRAMATIC]: 120,
      [MusicMood.CHAOTIC]: 140,
      [MusicMood.TRIUMPHANT]: 110,
      [MusicMood.MYSTERIOUS]: 70,
      [MusicMood.PLAYFUL]: 90
    };

    return bpmMap[mood];
  }

  private getMoodName(mood: MusicMood): string {
    const nameMap: { [key in MusicMood]: string } = {
      [MusicMood.PEACEFUL]: 'Peaceful Harmony',
      [MusicMood.FOCUSED]: 'Focused Cooperation',
      [MusicMood.TENSE]: 'Building Tension',
      [MusicMood.DRAMATIC]: 'Rising Conflict',
      [MusicMood.CHAOTIC]: 'System Chaos',
      [MusicMood.TRIUMPHANT]: 'Triumphant Resolution',
      [MusicMood.MYSTERIOUS]: 'Mysterious Ambient',
      [MusicMood.PLAYFUL]: 'Playful Discovery'
    };

    return nameMap[mood];
  }

  updateHarmonyLevel(level: HarmonyLevel): void {
    if (this.currentHarmonyLevel === level) return;

    this.currentHarmonyLevel = level;
    const targetTrackId = this.getTrackForHarmonyLevel(level);
    this.transitionToTrack(targetTrackId, 2.0);
  }

  private getTrackForHarmonyLevel(level: HarmonyLevel): string {
    const trackMap: { [key in HarmonyLevel]: string } = {
      [HarmonyLevel.PERFECT]: 'peaceful_harmony',
      [HarmonyLevel.HIGH]: 'focused_cooperation',
      [HarmonyLevel.MODERATE]: 'neutral_ambient',
      [HarmonyLevel.LOW]: 'building_tension',
      [HarmonyLevel.TENSION]: 'rising_conflict',
      [HarmonyLevel.CHAOS]: 'system_chaos'
    };

    return trackMap[level];
  }

  transitionToTrack(trackId: string, fadeTime: number = 1.0): void {
    if (this.transitionInProgress) return;

    const newTrack = this.musicTracks.get(trackId);
    if (!newTrack) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    this.transitionInProgress = true;

    // Fade out current track
    if (this.currentSource) {
      const currentGain = this.audioContext.context.createGain();
      currentGain.gain.setValueAtTime(1, this.audioContext.context.currentTime);
      currentGain.gain.linearRampToValueAtTime(0, this.audioContext.context.currentTime + fadeTime);
      
      // Reconnect current source through fade gain
      this.currentSource.disconnect();
      this.currentSource.connect(currentGain);
      currentGain.connect(this.audioContext.musicGain);
      
      // Stop after fade
      setTimeout(() => {
        if (this.currentSource) {
          this.currentSource.stop();
        }
      }, fadeTime * 1000);
    }

    // Start new track
    setTimeout(() => {
      this.startTrack(newTrack, fadeTime);
      this.transitionInProgress = false;
    }, fadeTime * 500); // Start halfway through fade
  }

  private startTrack(track: MusicTrack, fadeTime: number = 0): void {
    const source = this.audioContext.context.createBufferSource();
    source.buffer = track.audioBuffer;
    source.loop = true;
    source.loopStart = track.loopStart;
    source.loopEnd = track.loopEnd;

    if (fadeTime > 0) {
      const fadeGain = this.audioContext.context.createGain();
      fadeGain.gain.setValueAtTime(0, this.audioContext.context.currentTime);
      fadeGain.gain.linearRampToValueAtTime(1, this.audioContext.context.currentTime + fadeTime);
      
      source.connect(fadeGain);
      fadeGain.connect(this.audioContext.musicGain);
    } else {
      source.connect(this.audioContext.musicGain);
    }

    source.start();
    this.currentSource = source;
    this.currentTrack = track;

    // Start appropriate layers
    this.updateLayers();
  }

  addTensionLayer(intensity: number): void {
    if (!this.currentTrack) return;

    const tensionLayer = this.currentTrack.layers.find(layer => layer.id === 'tension');
    if (!tensionLayer || this.activeLayers.has('tension')) return;

    const source = this.audioContext.context.createBufferSource();
    source.buffer = tensionLayer.audioBuffer;
    source.loop = true;

    const gainNode = this.audioContext.context.createGain();
    const targetVolume = tensionLayer.volume * intensity;
    gainNode.gain.setValueAtTime(0, this.audioContext.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, this.audioContext.context.currentTime + 1.0);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.musicGain);
    source.start();

    this.activeLayers.set('tension', { source, gain: gainNode });
  }

  removeTensionLayer(fadeTime: number = 1.0): void {
    const tensionLayer = this.activeLayers.get('tension');
    if (!tensionLayer) return;

    tensionLayer.gain.gain.linearRampToValueAtTime(0, this.audioContext.context.currentTime + fadeTime);
    
    setTimeout(() => {
      tensionLayer.source.stop();
      this.activeLayers.delete('tension');
    }, fadeTime * 1000);
  }

  private updateLayers(): void {
    if (!this.currentTrack) return;

    const harmonyValue = this.getHarmonyValue(this.currentHarmonyLevel);
    const tensionValue = 1 - harmonyValue; // Inverse relationship

    this.currentTrack.layers.forEach(layer => {
      const shouldBeActive = harmonyValue >= layer.harmonyThreshold && tensionValue >= layer.tensionThreshold;
      const isActive = this.activeLayers.has(layer.id);

      if (shouldBeActive && !isActive && layer.id !== 'base') {
        this.startLayer(layer);
      } else if (!shouldBeActive && isActive) {
        this.stopLayer(layer.id);
      }
    });
  }

  private getHarmonyValue(level: HarmonyLevel): number {
    const values: { [key in HarmonyLevel]: number } = {
      [HarmonyLevel.PERFECT]: 1.0,
      [HarmonyLevel.HIGH]: 0.8,
      [HarmonyLevel.MODERATE]: 0.6,
      [HarmonyLevel.LOW]: 0.4,
      [HarmonyLevel.TENSION]: 0.2,
      [HarmonyLevel.CHAOS]: 0.0
    };

    return values[level];
  }

  private startLayer(layer: MusicLayer): void {
    const source = this.audioContext.context.createBufferSource();
    source.buffer = layer.audioBuffer;
    source.loop = true;

    const gainNode = this.audioContext.context.createGain();
    gainNode.gain.setValueAtTime(0, this.audioContext.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(layer.volume, this.audioContext.context.currentTime + 1.0);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.musicGain);
    source.start();

    this.activeLayers.set(layer.id, { source, gain: gainNode });
  }

  private stopLayer(layerId: string): void {
    const layer = this.activeLayers.get(layerId);
    if (!layer) return;

    layer.gain.gain.linearRampToValueAtTime(0, this.audioContext.context.currentTime + 1.0);
    
    setTimeout(() => {
      layer.source.stop();
      this.activeLayers.delete(layerId);
    }, 1000);
  }

  playStinger(stingerType: StingerType): void {
    const stingerBuffer = this.stingers.get(stingerType);
    if (!stingerBuffer) {
      console.warn(`Stinger not found: ${stingerType}`);
      return;
    }

    const source = this.audioContext.context.createBufferSource();
    source.buffer = stingerBuffer;
    
    // Create gain node for stinger volume
    const gainNode = this.audioContext.context.createGain();
    gainNode.gain.setValueAtTime(0.8, this.audioContext.context.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.sfxGain);
    source.start();
  }

  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }

    this.activeLayers.forEach(layer => layer.source.stop());
    this.activeLayers.clear();
    this.currentTrack = null;
  }
}