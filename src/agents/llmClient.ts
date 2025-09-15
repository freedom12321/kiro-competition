/**
 * LLM Client for AI Habitat - Ollama Integration
 *
 * Provides local LLM communication via Ollama API for device agent planning.
 * Supports mistral and llama3:8b-instruct models with JSON output validation.
 *
 * Based on CLAUDE.md Sprint 3.1 and Sprint 10.1 requirements.
 */

import { AgentContext, AgentStep } from '@/types/core';

// Configuration for Ollama client
export interface LLMConfig {
  endpoint: string;
  model: string;
  timeout: number;
  maxRetries: number;
  temperature: number;
  maxTokens: number;
}

// Default configuration
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  endpoint: 'http://localhost:11434/api/generate',
  model: 'mistral', // fallback to llama3:8b-instruct if needed
  timeout: 30000, // 30 seconds
  maxRetries: 2,
  temperature: 0.3, // Lower temperature for more consistent JSON output
  maxTokens: 1024
};

// Mutable runtime configuration and toggle
let CURRENT_LLM_CONFIG: LLMConfig = { ...DEFAULT_LLM_CONFIG };
let LLM_ENABLED = true;

// LocalStorage helpers
const LS_KEYS = {
  cfg: 'aihabitat_llm_config',
  enabled: 'aihabitat_llm_enabled'
} as const;

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch { return null; }
}
function safeSetItem(key: string, val: string) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, val);
  } catch { /* ignore */ }
}

// Load persisted settings
(() => {
  const rawCfg = safeGetItem(LS_KEYS.cfg);
  if (rawCfg) {
    try { CURRENT_LLM_CONFIG = { ...CURRENT_LLM_CONFIG, ...(JSON.parse(rawCfg)) }; } catch { /* ignore */ }
  }
  const rawEnabled = safeGetItem(LS_KEYS.enabled);
  if (rawEnabled != null) {
    LLM_ENABLED = rawEnabled === 'true';
  }
})();

export function setLLMConfig(partial: Partial<LLMConfig>) {
  CURRENT_LLM_CONFIG = { ...CURRENT_LLM_CONFIG, ...partial };
  safeSetItem(LS_KEYS.cfg, JSON.stringify(CURRENT_LLM_CONFIG));
}

export function getLLMConfig(): LLMConfig {
  return { ...CURRENT_LLM_CONFIG };
}

export function setLLMEnabled(enabled: boolean) {
  LLM_ENABLED = enabled;
  safeSetItem(LS_KEYS.enabled, enabled ? 'true' : 'false');
}

export function getLLMEnabled(): boolean {
  return LLM_ENABLED;
}

// LLM Response interface
export interface LLMResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Error types for LLM operations
export class LLMError extends Error {
  constructor(
    message: string,
    public type: 'network' | 'parse' | 'timeout' | 'validation' | 'model',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// Call statistics for performance monitoring
export interface LLMCallStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  lastCallTime: number;
  retryCount: number;
}

// Global stats tracking
let callStats: LLMCallStats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  averageResponseTime: 0,
  lastCallTime: 0,
  retryCount: 0
};

/**
 * Makes a raw API call to Ollama
 */
async function callOllamaAPI(prompt: string, config: LLMConfig = DEFAULT_LLM_CONFIG): Promise<LLMResponse> {
  const startTime = Date.now();
  callStats.totalCalls++;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false, // We want complete responses
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens,
          stop: ["\n\n", "```"], // Stop tokens to prevent over-generation
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new LLMError(
        `Ollama API error: ${response.status} ${response.statusText}`,
        'network'
      );
    }

    const data = await response.json() as LLMResponse;

    const responseTime = Date.now() - startTime;
    callStats.successfulCalls++;
    callStats.averageResponseTime = (callStats.averageResponseTime + responseTime) / 2;
    callStats.lastCallTime = Date.now();

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    callStats.failedCalls++;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new LLMError(`Request timeout after ${config.timeout}ms`, 'timeout', error);
      }
      throw new LLMError(`Network error: ${error.message}`, 'network', error);
    }

    throw new LLMError('Unknown network error', 'network');
  }
}

/**
 * Validates and parses AgentStep JSON from LLM response
 */
function parseAgentStepJSON(jsonString: string): AgentStep {
  let parsed: any;

  try {
    // Clean up common JSON issues
    let cleanJson = jsonString.trim();

    // Remove any markdown code blocks
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Find JSON object if there's extra text
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    parsed = JSON.parse(cleanJson);
  } catch (error) {
    throw new LLMError(
      `Failed to parse JSON response: ${jsonString}`,
      'parse',
      error instanceof Error ? error : undefined
    );
  }

  // Validate required fields
  if (!parsed.messages_to || !Array.isArray(parsed.messages_to)) {
    throw new LLMError('Missing or invalid messages_to field', 'validation');
  }

  if (!parsed.actions || !Array.isArray(parsed.actions)) {
    throw new LLMError('Missing or invalid actions field', 'validation');
  }

  if (!parsed.explain || typeof parsed.explain !== 'string') {
    throw new LLMError('Missing or invalid explain field', 'validation');
  }

  // Validate message structure
  for (const msg of parsed.messages_to) {
    if (!msg.to || !msg.content) {
      throw new LLMError('Invalid message structure: missing to or content', 'validation');
    }
  }

  // Validate action structure
  for (const action of parsed.actions) {
    if (!action.name || !action.args) {
      throw new LLMError('Invalid action structure: missing name or args', 'validation');
    }
  }

  return {
    messages_to: parsed.messages_to,
    actions: parsed.actions,
    explain: parsed.explain
  };
}

/**
 * Main function to plan agent step using LLM
 * Includes retry logic and validation
 */
export async function planAgentStep(
  context: AgentContext,
  config: LLMConfig = CURRENT_LLM_CONFIG
): Promise<AgentStep> {
  if (!LLM_ENABLED) {
    return createFallbackAgentStep(context, new LLMError('LLM disabled', 'model'));
  }
  const prompt = buildAgentPrompt(context);
  let lastError: LLMError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        callStats.retryCount++;
        // Add slight delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const response = await callOllamaAPI(prompt, config);

      if (!response.response) {
        throw new LLMError('Empty response from LLM', 'model');
      }

      const agentStep = parseAgentStepJSON(response.response);
      return agentStep;

    } catch (error) {
      lastError = error instanceof LLMError ? error : new LLMError(
        'Unknown error during planning',
        'model',
        error instanceof Error ? error : undefined
      );

      console.warn(`LLM planning attempt ${attempt + 1} failed:`, lastError.message);

      // If this is our last attempt or it's a validation error that won't improve
      if (attempt === config.maxRetries || lastError.type === 'validation') {
        break;
      }
    }
  }

  // All attempts failed, provide fallback
  console.error('All LLM planning attempts failed, using fallback behavior');
  return createFallbackAgentStep(context, lastError);
}

/**
 * Creates a fallback AgentStep when LLM fails
 */
function createFallbackAgentStep(context: AgentContext, error: LLMError | null): AgentStep {
  const deviceName = context.spec.name;
  const room = context.spec.room;

  // Simple heuristic-based fallback
  const fallbackAction = context.available_actions.length > 0
    ? { name: context.available_actions[0], args: {} }
    : { name: 'idle', args: {} };

  return {
    messages_to: [],
    actions: [fallbackAction],
    explain: `Fallback behavior due to LLM error: ${error?.message || 'Unknown error'}`
  };
}

/**
 * Builds the complete prompt for agent planning
 */
function buildAgentPrompt(context: AgentContext): string {
  const {
    spec,
    room_snapshot,
    policies,
    last_messages,
    available_actions,
    world_time,
    other_devices
  } = context;

  // System prompt
  const systemPrompt = `You are a device agent in a simulated smart environment.
You must output ONLY valid JSON with these exact keys: messages_to, actions, explain.
Never output explanatory text outside the JSON structure.

CRITICAL: Your response must be valid JSON that can be parsed directly.`;

  // Device identity and goals
  const identitySection = `
DEVICE IDENTITY:
Name: ${spec.name}
Room: ${spec.room}
Personality: ${spec.personality}
Goals: ${spec.goals.map(g => `${g.name} (weight: ${g.weight})`).join(', ')}
Constraints: ${spec.constraints.map(c => c.name).join(', ')}`;

  // Current state
  const stateSection = `
CURRENT STATE:
Time: ${Math.floor(world_time)}s
Room conditions: ${Object.entries(room_snapshot).map(([k, v]) => `${k}: ${v}`).join(', ')}`;

  // Available actions
  const actionsSection = `
AVAILABLE ACTIONS:
${available_actions.join(', ')}`;

  // Recent messages
  const messagesSection = last_messages.length > 0
    ? `\nRECENT MESSAGES:\n${last_messages.map(m => `${m.from}: ${m.content}`).join('\n')}`
    : '';

  // Other devices
  const devicesSection = other_devices.length > 0
    ? `\nOTHER DEVICES:\n${other_devices.map(d => `${d.id} in ${d.room} (${d.status})`).join('\n')}`
    : '';

  // Policies
  const policiesSection = `
POLICIES:
Priority order: ${policies.priority_order.join(' > ')}
Quiet hours: ${policies.quiet_hours.start} - ${policies.quiet_hours.end}`;

  // Custom LLM prompt from device spec
  const customPrompt = spec.llm_prompt || "Act according to your goals and constraints.";

  // Output format specification
  const outputFormat = `
OUTPUT REQUIREMENTS:
Return ONLY a JSON object with this structure:
{
  "messages_to": [{"to": "device_name", "content": "message"}],
  "actions": [{"name": "action_name", "args": {"param": "value"}}],
  "explain": "Brief explanation of your decision"
}

Do not include any text before or after the JSON object.`;

  return [
    systemPrompt,
    identitySection,
    stateSection,
    actionsSection,
    messagesSection,
    devicesSection,
    policiesSection,
    customPrompt,
    outputFormat
  ].join('\n');
}

/**
 * Gets current LLM call statistics
 */
export function getLLMStats(): LLMCallStats {
  return { ...callStats };
}

/**
 * Resets call statistics
 */
export function resetLLMStats(): void {
  callStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageResponseTime: 0,
    lastCallTime: 0,
    retryCount: 0
  };
}

/**
 * Tests LLM connection and model availability
 */
export async function testLLMConnection(config: LLMConfig = DEFAULT_LLM_CONFIG): Promise<boolean> {
  try {
    const testPrompt = 'Test connection. Respond with: {"test": true}';
    const response = await callOllamaAPI(testPrompt, config);
    return response.response.includes('"test"');
  } catch (error) {
    console.error('LLM connection test failed:', error);
    return false;
  }
}

/**
 * Checks if a model is available in Ollama
 */
export async function checkModelAvailability(modelName: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return false;

    const data = await response.json();
    return data.models?.some((model: any) => model.name.includes(modelName)) || false;
  } catch (error) {
    console.error('Failed to check model availability:', error);
    return false;
  }
}

/**
 * Lists available models in Ollama
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) return [];

    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.error('Failed to list models:', error);
    return [];
  }
}
