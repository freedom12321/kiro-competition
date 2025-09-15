/**
 * Sprint 10.1 - Ollama Setup & Batching
 *
 * Implements efficient LLM batching and caching strategies:
 * - Only call LLM when: new conflict, context changed, or every 6 ticks ("deep think")
 * - Round-robin max 2 LLM calls per tick; others use heuristics
 * - Cache static prompt parts; summarize history periodically
 */

import { AgentContext, AgentStep } from '../types/core';

export interface LLMResponse {
  messages_to: { to: string; content: string }[];
  actions: { name: string; args: Record<string, any> }[];
  explain: string;
}

export interface CacheEntry {
  key: string;
  response: AgentStep;
  timestamp: number;
  hits: number;
}

export interface BatchRequest {
  id: string;
  context: AgentContext;
  priority: number;
  timestamp: number;
}

export class BatchingLLMClient {
  private static instance: BatchingLLMClient;
  private ollamaHost: string;
  private model: string;
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: BatchRequest[] = [];
  private lastBatchTime = 0;
  private readonly BATCH_INTERVAL_MS = 1000; // 1 second batching window
  private readonly MAX_CALLS_PER_TICK = 2;
  private readonly CACHE_TTL_MS = 300000; // 5 minutes
  private currentTick = 0;
  private llmCallsThisTick = 0;

  // Static prompt templates (cached for efficiency)
  private readonly SYSTEM_PROMPT = `You are a device agent in a smart environment.
Output strict JSON with keys: messages_to[], actions[], explain.
Never output non-JSON. Respect constraints & policies.
Coordinate with other devices for optimal outcomes.`;

  private constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'mistral';
  }

  public static getInstance(): BatchingLLMClient {
    if (!BatchingLLMClient.instance) {
      BatchingLLMClient.instance = new BatchingLLMClient();
    }
    return BatchingLLMClient.instance;
  }

  /**
   * Main planning function with batching and caching
   */
  public async planAgentStep(context: AgentContext): Promise<AgentStep> {
    // Check if we should use LLM or heuristics for this tick
    if (!this.shouldUseLLM(context)) {
      return this.createHeuristicPlan(context);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(context);
    const cached = this.getCachedResponse(cacheKey);
    if (cached) {
      return cached.response;
    }

    // Add to batch queue if under limit
    if (this.llmCallsThisTick < this.MAX_CALLS_PER_TICK) {
      const batchRequest: BatchRequest = {
        id: `${context.spec.id}-${Date.now()}`,
        context,
        priority: this.calculatePriority(context),
        timestamp: Date.now()
      };

      this.pendingRequests.push(batchRequest);
      this.llmCallsThisTick++;

      // Process batch if we hit limit or enough time has passed
      if (this.shouldProcessBatch()) {
        return await this.processBatch(batchRequest.id);
      } else {
        // Return heuristic plan while waiting for batch
        return this.createHeuristicPlan(context);
      }
    }

    // Fallback to heuristics if over limit
    return this.createHeuristicPlan(context);
  }

  /**
   * Determine if we should use LLM for this context
   */
  private shouldUseLLM(context: AgentContext): boolean {
    // Always use LLM for conflicts
    const hasConflict = this.hasRecentConflict(context);
    if (hasConflict) return true;

    // Use LLM if context changed significantly
    const contextChanged = this.hasContextChanged(context);
    if (contextChanged) return true;

    // Deep think every 6 ticks
    if (this.currentTick % 6 === 0) return true;

    // Round-robin planning based on device phase
    const devicePhase = this.getDevicePhase(context.spec.id);
    if (this.currentTick % 4 === devicePhase) return true;

    return false;
  }

  /**
   * Calculate priority for batching order
   */
  private calculatePriority(context: AgentContext): number {
    let priority = 0;

    // Higher priority for conflicts
    if (this.hasRecentConflict(context)) priority += 100;

    // Safety-related devices get higher priority
    const safetyGoals = context.spec.goals.filter(g =>
      g.name.includes('safety') || g.name.includes('temperature')
    );
    priority += safetyGoals.length * 50;

    // Recent activity increases priority
    const recentMessages = context.last_messages.filter(m =>
      context.world_time - m.at < 60
    );
    priority += recentMessages.length * 10;

    return priority;
  }

  /**
   * Check if batch should be processed
   */
  private shouldProcessBatch(): boolean {
    if (this.pendingRequests.length === 0) return false;

    const now = Date.now();
    const timeSinceLastBatch = now - this.lastBatchTime;

    // Process if we have max requests or enough time has passed
    return this.llmCallsThisTick >= this.MAX_CALLS_PER_TICK ||
           timeSinceLastBatch >= this.BATCH_INTERVAL_MS;
  }

  /**
   * Process batch of LLM requests
   */
  private async processBatch(requestId: string): Promise<AgentStep> {
    if (this.pendingRequests.length === 0) {
      throw new Error('No pending requests to process');
    }

    // Sort by priority (highest first)
    this.pendingRequests.sort((a, b) => b.priority - a.priority);

    // Take top requests up to our limit
    const batchToProcess = this.pendingRequests.splice(0, this.MAX_CALLS_PER_TICK);
    this.lastBatchTime = Date.now();

    try {
      // Process requests in parallel
      const promises = batchToProcess.map(req => this.callOllama(req.context));
      const responses = await Promise.all(promises);

      // Cache responses
      batchToProcess.forEach((req, index) => {
        const cacheKey = this.getCacheKey(req.context);
        this.cacheResponse(cacheKey, responses[index]);
      });

      // Return the response for the requested ID
      const requestIndex = batchToProcess.findIndex(req => req.id === requestId);
      return requestIndex >= 0 ? responses[requestIndex] : this.createHeuristicPlan(batchToProcess[0].context);

    } catch (error) {
      console.warn('Batch LLM processing failed:', error);

      // Fallback to heuristics for all requests
      const fallbackRequest = batchToProcess.find(req => req.id === requestId);
      return fallbackRequest ?
        this.createHeuristicPlan(fallbackRequest.context) :
        this.createEmptyPlan();
    }
  }

  /**
   * Call Ollama API with optimized prompt
   */
  private async callOllama(context: AgentContext): Promise<AgentStep> {
    const prompt = this.buildOptimizedPrompt(context);

    const requestPayload = {
      model: this.model,
      prompt,
      system: this.SYSTEM_PROMPT,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 512
      }
    };

    try {
      const response = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseResponse(data.response);

    } catch (error) {
      console.warn('Ollama call failed:', error);
      return this.createHeuristicPlan(context);
    }
  }

  /**
   * Build optimized prompt with cached components
   */
  private buildOptimizedPrompt(context: AgentContext): string {
    const prompt = [
      `Device: ${context.spec.name} (${context.spec.personality})`,
      `Room: ${JSON.stringify(context.room_snapshot)}`,
      `Goals: ${context.spec.goals.map(g => `${g.name}(${g.weight})`).join(', ')}`,
      `Available actions: ${context.available_actions.join(', ')}`,
      `Policies: ${context.policies.priority_order.join(' > ')}`,

      // Include recent context only
      context.last_messages.length > 0 ?
        `Recent messages: ${JSON.stringify(context.last_messages.slice(-2))}` : '',

      // Coordination info
      context.other_devices.length > 0 ?
        `Other devices: ${context.other_devices.map(d => `${d.id}(${d.status})`).join(', ')}` : '',

      'Output valid JSON only with messages_to, actions, explain.'
    ].filter(Boolean).join('\n');

    return prompt;
  }

  /**
   * Parse LLM response with error handling
   */
  private parseResponse(response: string): AgentStep {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        return {
          messages_to: parsed.messages_to || [],
          actions: parsed.actions || [],
          explain: parsed.explain || 'LLM response processed'
        };
      }

      throw new Error('No JSON found in response');

    } catch (error) {
      console.warn('Failed to parse LLM response:', error);
      return this.createEmptyPlan();
    }
  }

  /**
   * Create heuristic plan when LLM is unavailable
   */
  private createHeuristicPlan(context: AgentContext): AgentStep {
    const actions: { name: string; args: Record<string, any> }[] = [];
    const messages: { to: string; content: string }[] = [];

    // Simple heuristics based on device type and goals
    const roomState = context.room_snapshot;

    // Temperature control heuristics
    if (context.spec.actuators.some(a => a.includes('cool') || a.includes('heat'))) {
      const currentTemp = roomState.temperature;
      const safetyGoals = context.spec.goals.filter(g => g.name.includes('safety'));

      if (safetyGoals.length > 0) {
        if (currentTemp > 26) {
          actions.push({ name: 'cool', args: { delta_c: -0.5 } });
          messages.push({ to: 'user', content: 'Cooling due to high temperature' });
        } else if (currentTemp < 18) {
          actions.push({ name: 'heat', args: { delta_c: 0.5 } });
          messages.push({ to: 'user', content: 'Heating due to low temperature' });
        }
      }
    }

    // Lighting control heuristics
    if (context.spec.actuators.some(a => a.includes('brightness'))) {
      const isQuietHours = this.isQuietHours(context.world_time, context.policies.quiet_hours);
      const currentLumens = roomState.lumens;

      if (isQuietHours && currentLumens > 0.2) {
        actions.push({ name: 'set_brightness', args: { level_0_1: 0.1 } });
        messages.push({ to: 'user', content: 'Dimming for quiet hours' });
      }
    }

    return {
      messages_to: messages,
      actions,
      explain: `Heuristic behavior: ${actions.length} actions based on current conditions`
    };
  }

  private createEmptyPlan(): AgentStep {
    return {
      messages_to: [],
      actions: [],
      explain: 'No action taken'
    };
  }

  /**
   * Caching utilities
   */
  private getCacheKey(context: AgentContext): string {
    const keyData = {
      deviceId: context.spec.id,
      room: JSON.stringify(context.room_snapshot),
      messages: context.last_messages.slice(-1), // Only most recent message
      policies: context.policies.priority_order
    };

    return JSON.stringify(keyData);
  }

  private getCachedResponse(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry;
  }

  private cacheResponse(key: string, response: AgentStep): void {
    const entry: CacheEntry = {
      key,
      response,
      timestamp: Date.now(),
      hits: 0
    };

    this.cache.set(key, entry);

    // Clean up old entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL_MS) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Context analysis utilities
   */
  private hasRecentConflict(context: AgentContext): boolean {
    return context.last_messages.some(msg =>
      msg.content.toLowerCase().includes('conflict') ||
      msg.content.toLowerCase().includes('competing')
    );
  }

  private hasContextChanged(context: AgentContext): boolean {
    // Simplified context change detection
    const roomState = context.room_snapshot;
    return Math.abs(roomState.temperature - 22) > 1.0 ||
           Math.abs(roomState.lumens - 0.5) > 0.2;
  }

  private getDevicePhase(deviceId: string): number {
    // Simple hash-based phase assignment
    let hash = 0;
    for (let i = 0; i < deviceId.length; i++) {
      hash = ((hash << 5) - hash + deviceId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 4;
  }

  private isQuietHours(timeSec: number, quietHours: { start: string; end: string }): boolean {
    const hour = Math.floor((timeSec / 3600) % 24);
    const startHour = parseInt(quietHours.start.split(':')[0]);
    const endHour = parseInt(quietHours.end.split(':')[0]);

    if (startHour > endHour) {
      return hour >= startHour || hour < endHour;
    }
    return hour >= startHour && hour < endHour;
  }

  /**
   * Performance monitoring
   */
  public getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      pendingRequests: this.pendingRequests.length,
      llmCallsThisTick: this.llmCallsThisTick,
      currentTick: this.currentTick
    };
  }

  private calculateCacheHitRate(): number {
    let totalHits = 0;
    let totalEntries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalEntries++;
    }

    return totalEntries > 0 ? totalHits / totalEntries : 0;
  }

  /**
   * Tick management
   */
  public advanceTick(): void {
    this.currentTick++;
    this.llmCallsThisTick = 0;
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.cache.clear();
    this.pendingRequests = [];
  }
}

export default BatchingLLMClient;