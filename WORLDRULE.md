How to design world rules so the game stays lively
1) Use a layered rule system

Think of rules as layers that stack and combine. Each layer is small, but together they create lots of situations.

Physical layer (always on): temperature drift, light falloff, noise propagation, energy prices, weather/season cycle.

Human-norms layer (charter): comfort ranges, quiet hours, safety hard limits, privacy budget.

Context layer: room purpose + time of day + occupants (home morning vs hospital night).

Device affordances: what each device can sense/actuate (and costs/latency/inertia).

Social layer (optional): politeness, precedence (patient > guest), escalation/override paths.

Director layer (see §5): auto-injects events when the world is too quiet.

This layering produces many cross-overs (i.e., fun!) without a huge monolithic rulebook.

2) Represent rules with a composable schema

Use a simple condition → effect schema with priorities, softness, and exceptions. Store as JSON and load a lot of small rules.

{
  "id": "rule.quiet_hours.dim_lights",
  "scope": "room",                         // "world" | "room" | "device"
  "priority": 0.8,                         // soft weight (0..1)
  "hard": false,                           // hard = cannot be violated
  "when": {                                // context predicate
    "time_between": ["22:00", "07:00"],
    "room_tag": ["bedroom", "patient_room"]
  },
  "unless": {
    "emergency": true                      // exceptions
  },
  "if": {                                  // state predicate
    "lumens_gt": 0.2
  },
  "then": {                                // preferred transform
    "target": "lumens",
    "delta": -0.2,                         // “nudge” not absolute
    "min": 0.05
  },
  "explain": "Quiet hours: prefer low light during sleep."
}


Add many rules like this (30–80 small rules) across layers. Small rules compose better than a few big ones.

Device-shaping rules look like this:

{
  "id": "rule.ac.summer_prefer_cool",
  "scope": "device",
  "device_type": "smart_ac",
  "priority": 0.6,
  "when": { "season": "summer" },
  "if": { "temperature_gt": 24.0 },
  "then": { "action_hint": {"cool": 0.5} },
  "explain": "In summer, AC prefers cooling when temp > 24°C."
}


Safety hard limits (non-negotiable):

{
  "id": "rule.safety.temp_bounds",
  "scope": "room",
  "priority": 1.0,
  "hard": true,
  "if": { "temperature_lt": 18.0 },
  "then": { "alarm": "too_cold", "target": "temperature", "delta": +0.5 },
  "explain": "Safety: keep room >= 18°C."
}

3) Provide rule packs per environment

Ship curated packs so content density is high from day one.

Home Pack (≈25 rules): morning ramp up, meal prep norms, evening wind-down, quiet hours, energy peak pricing, guest arrival etiquette.

Hospital Pack (≈35 rules): night shift safety, patient sleep first, med timing windows, device escalation hierarchy, sterile room constraints.

Office/School Pack (≈25 rules): meeting vs break, projector/blinds coordination, focus vs wellness, privacy during calls.

Each pack includes:

5–10 physical/context rules,

10–15 human-norms/social rules,

10 device-shaping hints,

3–5 hard limits.

4) Add parameterized “templates” to expand coverage

Author templates once; instantiate many rules automatically.

Example template:

TEMPLATE: dim_for_sleep(roomTag, luxMax)
WHEN room_tag = {roomTag} AND time ∈ QuietHours
IF lumens > {luxMax} THEN decrease lumens toward {luxMax}


Instantiate for bedroom, patient_room, nursery, each with different luxMax. This multiplies situations without manual writing.

5) Use a Director to keep things exciting

Borrow from “AI Directors” in games: if state is too calm, inject events or relax constraints to spark interactions.

Director checks every N ticks:

If conflicts/hour < target: schedule a mild perturbation (cloud cover, visitor, price spike).

If harmony > 0.9 for long: spawn a “soft clash” (two devices receive slightly misaligned hints).

If too chaotic: enable a calm period (block new events, give energy discount).

Director config:

{
  "targets": { "conflicts_per_day": [3,7], "synergies_per_day": [4,8] },
  "event_budget_per_day": 10,
  "cooldown_ticks": 12
}


This guarantees regular moments to manage—fun without being overwhelming.

6) Add rule softness + stochastic outcomes

Every soft rule has a weight; choose actions via utility (Σ weight × predicted_delta).

Add small random tie-breaking and sensor noise to avoid deterministic stalemates.

Keep a few hard rules (safety) to prevent nonsense.

7) Make rules time-varying (season/day state machine)

Rules should turn on/off or change priority:

Seasonal swaps (summer vs winter comfort bands).

Daily arcs (wake → work → wind-down → sleep).

Shift modes (hospital night shift bumps Safety priority).

8) Give players a Rule Browser & Rule Heatmap

Browser: list active rules right now, sorted by impact.

Heatmap: visualize which rules fired in each room over the last 5 minutes (color intensity = frequency).
This helps players understand and tweak without reading code.

9) Author with an LLM rule expander

Seed 10–15 hand-written rules, then ask your LLM to propose 30 more from templates & environment context. You review and keep the good ones. Repeat per environment to quickly reach healthy density (≈60–90 rules total).

Prompt snippet for the expander:

You are generating small, composable world rules (JSON schema below).
Given the environment=Hospital at Night, propose 10 rules that:
- Prefer patient sleep
- Limit bright lights
- Coordinate nurse calls with monitor alarms
- Include 2 hard safety limits and 8 soft nudges
Return valid JSON array.

10) Tune activity with dials (so events aren’t rare)

Rule density: number of active soft rules per room (target 6–12).

Event rate: Poisson λ = 2–4 events/hour baseline (Director can bump).

Conflict threshold: how contradictory two actions must be to count as a conflict.

Asynchrony: vary agent planning phases (produces more overlaps).

Noise: sensor noise σ (more σ → more miscoordination → more fun).

Inertia: actuator ramp caps (less ramp → faster oscillations; more ramp → longer arcs).

Start with: density=8, λ=3/hr, conflict threshold=medium, σ(temp)=0.3°C, inertia=moderate.

Concrete implementation plan
A) Rule engine minimal API

Evaluate per tick:

type Pred = Record<string, any>; // e.g., {"time_between":["22:00","07:00"], "room_tag":["bedroom"]}
type Transform = { target?: string; delta?: number; min?: number; max?: number; alarm?: string; action_hint?: Record<string,number> };

type WorldRule = {
  id: string;
  scope: "world"|"room"|"device";
  device_type?: string;
  priority: number;   // 0..1 soft weight
  hard: boolean;
  when?: Pred;        // context
  unless?: Pred;      // exceptions
  if?: Pred;          // state predicate
  then: Transform;    // desired nudge/constraint/alarm
  explain: string;
};


Apply order:

Collect applicable rules (when & if true, unless false).

Separate hard and soft.

Apply hard immediately if violated (clip variables, trigger alarms).

Aggregate soft transforms into candidate actions with utility scoring.

Feed action hints into agents (as context) before LLM planning.

Acceptance tests

With only charter + packs, you see multiple rule firings per minute.

Hard limits always enforce bounds; soft rules bias but don’t freeze agents.

B) Rule packs directory
/.kiro/specs/policies/packs/
  home_base.json
  hospital_night.json
  office_focus.json
  social_norms.json
  device_hints.json


At runtime, merge packs based on environment & time.

C) Director (activity keeper)

Every 6–10 ticks:

Compute last-window stats: conflicts, synergies, rule firings.

If below range, schedule a mild event in /src/sim/events.ts.

If above range, schedule a calm window (suppress events, drop noise σ).

Ensure at least one conflict appears in the tutorial within 2 minutes.

Acceptance tests

Disable Director → world gets calmer. Enable → steady rhythm of interesting moments.

D) Rule authoring UI

Rule Browser: filter by room/device; toggle a rule; show firing count.

Heatmap: room overlay with the last 5m rule frequency.

New Rule button: opens a form populated by an LLM proposal (user edits then saves).

E) Example rule snippets to seed packs

Home – breakfast lighting

{
  "id": "rule.home.breakfast.bright_kitchen",
  "scope": "room",
  "priority": 0.5,
  "when": { "time_between": ["07:00","09:00"], "room_tag": ["kitchen"] },
  "if": { "lumens_lt": 0.6 },
  "then": { "target": "lumens", "delta": +0.2, "max": 0.8 },
  "explain": "Breakfast time prefers brighter kitchens."
}


Hospital – patient sleep override (hard)

{
  "id": "rule.hospital.night.patient_sleep",
  "scope": "room",
  "priority": 1.0,
  "hard": true,
  "when": { "time_between": ["22:00","06:00"], "room_tag": ["patient_room"] },
  "if": { "lumens_gt": 0.2 },
  "then": { "target": "lumens", "delta": -0.4, "min": 0.05 },
  "explain": "Night shift: enforce low light for patient sleep."
}


Office – projector vs blinds coordination

{
  "id": "rule.office.meeting.projector_blinds",
  "scope": "room",
  "priority": 0.7,
  "when": { "meeting": true, "room_tag": ["meeting_room"] },
  "if": { "lumens_gt": 0.4 },
  "then": { "target": "lumens", "delta": -0.3, "min": 0.2 },
  "explain": "When the projector is on, lower ambient light."
}

F) KPIs to know it’s “fun enough”

Conflicts/day ∈ [3, 7] per active area.

Synergies/day ∈ [4, 8].

Avg time to recover after conflict: 30–90 in-game seconds.

Rule firings/min ≥ 5 in occupied rooms.

Player interventions/day (tutorial): ≥ 2 meaningful rule changes.

If metrics are low → raise rule density, event rate, noise, or loosen conflict threshold.

How many “builder agents” (team roles) to deliver this rules system?

You can still ship with the 7-agent build team we outlined earlier. For the rules push, emphasize these three:

Mediator/Governance Agent

Implements rule schema, loader, evaluator (hard vs soft), utility scoring, and merging of packs.

Builds the Rule Browser and Heatmap.

Uncertainty & Events Agent

Implements Director, event generator, sensor noise, delays, seeds/modes, and dials.

Content/Scenario Agent

Authors rule packs (home/hospital/office/social/device hints).

Builds the LLM “rule expander” prompt and curates results.

(Frontend/UI, Simulation/World, LLM Planning, QA/Docs continue as before.)

TL;DR

Make lots of small, composable rules, not one huge rule.

Use packs, templates, and an LLM expander to reach healthy density fast.

Add a Director to guarantee regular interesting moments.

Keep a few hard safety rules, but most rules are soft weights to enable trade-offs.

Give players visibility (browser/heatmap) and agency (toggle/tune).

That combo keeps the world active and surprising—not rare and boring—while staying understandable and teachable.