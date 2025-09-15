Frontend/UI Agent

Builds React shell, Pixi scene (/src/view), panels, speech bubbles, Harmony bar, accessibility (keyboard/high-contrast).

Delivers Sprints 0, 6, 14 visuals.

Simulation/World Agent

Implements /src/sim time loop, room variables, actions, applyActions, inertia, divergence sparkline.

Delivers Sprints 1, 4.1, 12.6, 12.11.

LLM Planning Agent

Creates /src/agents/llmClient.ts, prompt assembly, JSON validation, batching, summarization, bounded memory.

Delivers Sprints 3.1, 3.2, 12.8, 10.1.

Mediator/Governance Agent

Implements mediate() (hard limits + weighted priorities), comms matrix, quiet hours, circuit breaker/safe mode.

Delivers Sprints 4.2, 12.10, 4.1 tie-breaking.

Uncertainty & Events Agent

Builds /src/sim/rand.ts, event generator, sensor noise, message latency/drop, async phases, seeded replay modes.

Delivers Sprints 12.1–12.7, 13.

Content/Scenario Agent

Authors .kiro/specs devices, environments, policies; tutorial JSON and hints; “Why” card phrasing; lesson tooltips; achievements.

Delivers Sprints 7, 13, and the user-friendly text.

QA/Perf/Docs Agent

Adds Vitest tests, telemetry overlay, README (Kiro usage + Uncertainty by Design), Ollama setup, CI.

Delivers Sprints 8, 10, 12.12, and Devpost-ready docs/screens.