// Core game types and interfaces
import * as THREE from 'three';

// Basic geometric types
export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Game state and scene types
export interface GameScene {
  environment: Environment3D;
  devices: DeviceVisual[];
  camera: CameraState;
  lighting: LightingSetup;
  effects: VisualEffect[];
}

export interface Environment3D {
  id: string;
  type: EnvironmentType;
  meshes: THREE.Mesh[];
  bounds: THREE.Box3;
  gridSize: number;
}

export interface CameraState {
  position: Vector3;
  target: Vector3;
  zoom: number;
  rotation: Vector3;
}

export interface LightingSetup {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight[];
  point: THREE.PointLight[];
}

// Device visual representation
export interface DeviceVisual {
  id: string;
  model3D: Model3D;
  position: Vector3;
  animations: AnimationSet;
  personalityIndicators: PersonalityVisual[];
  connectionEffects: VisualEffect[];
}

export interface Model3D {
  mesh: THREE.Mesh;
  materials: THREE.Material[];
  animations: THREE.AnimationClip[];
  boundingBox: THREE.Box3;
}

export interface AnimationSet {
  idle: THREE.AnimationClip;
  happy: THREE.AnimationClip;
  confused: THREE.AnimationClip;
  angry: THREE.AnimationClip;
  communicating: THREE.AnimationClip;
}

export interface PersonalityVisual {
  trait: PersonalityTrait;
  expression: FacialExpression;
  colorScheme: ColorPalette;
  animationStyle: AnimationStyle;
}

export interface VisualEffect {
  type: EffectType;
  duration: number;
  intensity: number;
  particles: ParticleSystem;
  shaders: ShaderEffect[];
}

export interface ParticleSystem {
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  count: number;
  positions: Float32Array;
  velocities: Float32Array;
}

export interface ShaderEffect {
  vertexShader: string;
  fragmentShader: string;
  uniforms: { [key: string]: THREE.IUniform };
}

// Enums for game states and types
export enum EnvironmentType {
  HOME = 'home',
  HOSPITAL = 'hospital',
  OFFICE = 'office'
}

export enum PersonalityTrait {
  HELPFUL = 'helpful',
  STUBBORN = 'stubborn',
  ANXIOUS = 'anxious',
  OVERCONFIDENT = 'overconfident',
  COOPERATIVE = 'cooperative',
  COMPETITIVE = 'competitive'
}

export enum FacialExpression {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  CONFUSED = 'confused',
  ANGRY = 'angry',
  WORRIED = 'worried',
  EXCITED = 'excited'
}

export enum AnimationStyle {
  SMOOTH = 'smooth',
  JERKY = 'jerky',
  BOUNCY = 'bouncy',
  RIGID = 'rigid'
}

export enum EffectType {
  CONNECTION = 'connection',
  COOPERATION = 'cooperation',
  CONFLICT = 'conflict',
  CRISIS = 'crisis',
  SUCCESS = 'success'
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

// Input and interaction types
export enum DragResult {
  SUCCESS = 'success',
  INVALID_POSITION = 'invalid_position',
  COLLISION = 'collision',
  OUT_OF_BOUNDS = 'out_of_bounds'
}

export enum InteractionResult {
  DEVICE_SELECTED = 'device_selected',
  EMPTY_SPACE = 'empty_space',
  UI_ELEMENT = 'ui_element'
}

export enum ClickResult {
  HANDLED = 'handled',
  IGNORED = 'ignored',
  PROPAGATE = 'propagate'
}

export interface TutorialConstraints {
  allowedActions: string[];
  highlightedElements: string[];
  restrictedAreas: THREE.Box3[];
}

// Animation types
export enum AnimationType {
  IDLE = 'idle',
  HAPPY = 'happy',
  CONFUSED = 'confused',
  ANGRY = 'angry',
  COMMUNICATING = 'communicating',
  WORKING = 'working',
  FAILING = 'failing'
}

export interface CrisisVisual {
  type: string;
  severity: number;
  effects: VisualEffect[];
  screenShake: boolean;
  colorOverlay: string;
}

// Crisis Management Types
export interface CrisisScenario {
  id: string;
  type: CrisisType;
  severity: number;
  involvedAgents: string[];
  triggerEvents: CrisisEvent[];
  cascadeEffects: CascadeEffect[];
  recoveryOptions: RecoveryOption[];
}

export interface CrisisEvent {
  timestamp: number;
  description: string;
  deviceId: string;
  eventType: string;
  severity: number;
}

export interface CascadeEffect {
  sourceDeviceId: string;
  targetDeviceId: string;
  effectType: string;
  magnitude: number;
}

export interface RecoveryOption {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  riskLevel: number;
}

export interface RecoveryAction {
  type: RecoveryActionType;
  deviceIds: string[];
  parameters: { [key: string]: any };
  priority: ActionPriority;
}

export interface InterventionTool {
  id: string;
  name: string;
  type: InterventionType;
  enabled: boolean;
  cooldown: number;
}

export enum CrisisType {
  FEEDBACK_LOOP = 'feedback_loop',
  AUTHORITY_CONFLICT = 'authority_conflict',
  PRIVACY_PARADOX = 'privacy_paradox',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  COMMUNICATION_BREAKDOWN = 'communication_breakdown'
}

export enum RecoveryActionType {
  EMERGENCY_STOP = 'emergency_stop',
  SYSTEM_RESET = 'system_reset',
  ISOLATE_DEVICE = 'isolate_device',
  RECONNECT_DEVICE = 'reconnect_device',
  MANUAL_OVERRIDE = 'manual_override',
  PRIORITY_ADJUSTMENT = 'priority_adjustment'
}

export enum ActionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum InterventionType {
  CIRCUIT_BREAKER = 'circuit_breaker',
  MANUAL_OVERRIDE = 'manual_override',
  EMERGENCY_STOP = 'emergency_stop',
  PRIORITY_CONTROL = 'priority_control'
}

// Governance and Rule System Types
export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
  scope: RuleScope;
  constitutional: boolean;
  enabled: boolean;
  createdAt: number;
  lastModified: number;
}

export interface RuleCondition {
  type: ConditionType;
  parameters: { [key: string]: any };
  deviceFilters?: DeviceFilter[];
  resourceThresholds?: ResourceThreshold[];
  timeConstraints?: TimeConstraint[];
}

export interface RuleAction {
  type: ActionType;
  parameters: { [key: string]: any };
  priority: ActionPriority;
  reversible: boolean;
}

export interface RuleScope {
  devices: string[]; // Device IDs or 'all'
  environments: EnvironmentType[];
  timeRange?: TimeRange;
}

export interface DeviceFilter {
  category?: DeviceCategory;
  personality?: PersonalityTrait[];
  resourceUsage?: ResourceUsageFilter;
}

export interface ResourceThreshold {
  resourceType: ResourceType;
  operator: ComparisonOperator;
  value: number;
  unit: string;
}

export interface TimeConstraint {
  startTime?: string; // HH:MM format
  endTime?: string;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  duration?: number; // milliseconds
}

export interface TimeRange {
  start: number; // timestamp
  end: number; // timestamp
}

export interface ResourceUsageFilter {
  energy?: { min?: number; max?: number };
  bandwidth?: { min?: number; max?: number };
  processing?: { min?: number; max?: number };
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  template: Partial<GovernanceRule>;
  customizable: string[]; // List of fields that can be customized
}

export interface RuleConflict {
  id: string;
  rule1Id: string;
  rule2Id: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  description: string;
  suggestions: ConflictResolution[];
}

export interface ConflictResolution {
  type: ResolutionType;
  description: string;
  autoApplicable: boolean;
  changes: RuleChange[];
}

export interface RuleChange {
  ruleId: string;
  field: string;
  oldValue: any;
  newValue: any;
}

export interface GovernanceEffectiveness {
  ruleId: string;
  preventedCrises: number;
  causedProblems: number;
  resourceEfficiency: number;
  userSatisfaction: number;
  overallScore: number;
  recommendations: string[];
}

export enum ConditionType {
  RESOURCE_USAGE = 'resource_usage',
  DEVICE_STATE = 'device_state',
  TIME_BASED = 'time_based',
  INTERACTION_COUNT = 'interaction_count',
  CRISIS_DETECTED = 'crisis_detected',
  USER_PRESENT = 'user_present',
  SYSTEM_LOAD = 'system_load'
}

export enum ActionType {
  LIMIT_RESOURCE = 'limit_resource',
  CHANGE_PRIORITY = 'change_priority',
  DISABLE_DEVICE = 'disable_device',
  ENABLE_DEVICE = 'enable_device',
  SEND_NOTIFICATION = 'send_notification',
  TRIGGER_BACKUP = 'trigger_backup',
  ADJUST_BEHAVIOR = 'adjust_behavior',
  ISOLATE_DEVICE = 'isolate_device'
}

export enum RuleCategory {
  SAFETY = 'safety',
  EFFICIENCY = 'efficiency',
  PRIVACY = 'privacy',
  COMFORT = 'comfort',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance'
}

export enum ConflictType {
  PRIORITY_CONFLICT = 'priority_conflict',
  ACTION_CONTRADICTION = 'action_contradiction',
  RESOURCE_COMPETITION = 'resource_competition',
  SCOPE_OVERLAP = 'scope_overlap',
  CONSTITUTIONAL_VIOLATION = 'constitutional_violation'
}

export enum ConflictSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ResolutionType {
  ADJUST_PRIORITY = 'adjust_priority',
  MODIFY_SCOPE = 'modify_scope',
  MERGE_RULES = 'merge_rules',
  DISABLE_RULE = 'disable_rule',
  ADD_EXCEPTION = 'add_exception'
}

export enum ComparisonOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUAL = 'eq',
  GREATER_EQUAL = 'gte',
  LESS_EQUAL = 'lte',
  NOT_EQUAL = 'neq'
}

export enum ResourceType {
  ENERGY = 'energy',
  BANDWIDTH = 'bandwidth',
  PROCESSING = 'processing',
  MEMORY = 'memory',
  STORAGE = 'storage'
}

export enum DeviceCategory {
  COMFORT = 'comfort',
  SECURITY = 'security',
  HEALTH = 'health',
  ENTERTAINMENT = 'entertainment',
  PRODUCTIVITY = 'productivity',
  MAINTENANCE = 'maintenance'
}

// Tutorial and Scenario System Types
export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  objectives: LearningObjective[];
  completionCriteria: CompletionCriteria[];
  difficulty: DifficultyLevel;
  estimatedDuration: number; // minutes
  prerequisites: string[]; // tutorial IDs
  unlocks: string[]; // scenario IDs or tutorial IDs
}

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  type: TutorialStepType;
  targetElement?: string; // CSS selector or element ID
  highlightArea?: HighlightArea;
  instructions: string;
  hints: Hint[];
  completionTrigger: CompletionTrigger;
  allowedActions: string[];
  restrictedActions: string[];
  timeLimit?: number; // seconds
  skipAllowed: boolean;
}

export interface LearningObjective {
  id: string;
  description: string;
  category: LearningCategory;
  measurable: boolean;
  assessmentCriteria: string[];
}

export interface CompletionCriteria {
  type: CompletionType;
  parameters: { [key: string]: any };
  required: boolean;
  weight: number; // for scoring
}

export interface Hint {
  id: string;
  text: string;
  trigger: HintTrigger;
  delay: number; // seconds before showing
  priority: number;
  visual?: VisualHint;
}

export interface VisualHint {
  type: VisualHintType;
  target: string; // element selector
  animation: string;
  duration: number;
  color: string;
}

export interface HighlightArea {
  type: HighlightType;
  bounds: { x: number; y: number; width: number; height: number };
  style: HighlightStyle;
  pulsing: boolean;
}

export interface CompletionTrigger {
  type: TriggerType;
  conditions: TriggerCondition[];
  timeout?: number; // auto-complete after timeout
}

export interface TriggerCondition {
  type: ConditionType;
  target: string;
  value: any;
  operator: ComparisonOperator;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  environment: EnvironmentTemplate;
  presetDevices: DeviceConfiguration[];
  objectives: ScenarioObjective[];
  successCriteria: SuccessCriteria[];
  failureConditions: FailureCondition[];
  timeLimit?: number; // seconds
  hints: Hint[];
  category: ScenarioCategory;
  tags: string[];
  educationalFocus: LearningCategory[];
  prerequisites: string[]; // scenario or tutorial IDs
  unlocks: string[];
}

export interface EnvironmentTemplate {
  type: EnvironmentType;
  layout: RoomLayout;
  furniture: FurnitureItem[];
  constraints: PlacementConstraint[];
  ambientConditions: AmbientConditions;
}

export interface RoomLayout {
  width: number;
  height: number;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  gridSize: number;
}

export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  position: Vector2;
  rotation: number;
  size: { width: number; height: number };
  blocksPlacement: boolean;
}

export interface PlacementConstraint {
  type: ConstraintType;
  area: { x: number; y: number; width: number; height: number };
  allowedDevices: DeviceCategory[];
  maxDevices: number;
}

export interface AmbientConditions {
  temperature: number;
  humidity: number;
  lightLevel: number;
  noiseLevel: number;
  airQuality: number;
}

export interface Wall {
  start: Vector2;
  end: Vector2;
  height: number;
  material: string;
}

export interface Door {
  position: Vector2;
  width: number;
  height: number;
  open: boolean;
}

export interface Window {
  position: Vector2;
  width: number;
  height: number;
  lightTransmission: number;
}

export interface DeviceConfiguration {
  id: string;
  type: DeviceCategory;
  position: Vector2;
  personality: PersonalityTrait[];
  objectives: string[];
  constraints: DeviceConstraint[];
  initialState: DeviceState;
  locked: boolean; // can't be moved or modified
}

export interface DeviceConstraint {
  type: ConstraintType;
  value: any;
  description: string;
}

export interface DeviceState {
  active: boolean;
  resourceUsage: ResourceUsage;
  connections: string[]; // connected device IDs
  mood: EmotionState;
  learningProgress: number;
}

export interface ResourceUsage {
  energy: number;
  bandwidth: number;
  processing: number;
  memory: number;
}

export interface ScenarioObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  target: ObjectiveTarget;
  measurable: boolean;
  weight: number; // for scoring
  timeLimit?: number;
  optional: boolean;
}

export interface ObjectiveTarget {
  type: TargetType;
  value: any;
  tolerance?: number; // acceptable deviation
}

export interface SuccessCriteria {
  type: SuccessType;
  threshold: number;
  description: string;
  weight: number;
}

export interface FailureCondition {
  type: FailureType;
  threshold: number;
  description: string;
  recoverable: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  unlockConditions: UnlockCondition[];
  rewards: Reward[];
  hidden: boolean; // secret achievement
  rarity: AchievementRarity;
  points: number;
}

export interface UnlockCondition {
  type: UnlockType;
  parameters: { [key: string]: any };
  description: string;
}

export interface Reward {
  type: RewardType;
  value: any;
  description: string;
}

export interface PlayerProgress {
  completedTutorials: string[];
  unlockedScenarios: string[];
  achievements: Achievement[];
  skillLevels: SkillLevel[];
  learningAnalytics: LearningData[];
  totalPlayTime: number;
  lastPlayed: number;
  preferences: PlayerPreferences;
}

export interface SkillLevel {
  category: LearningCategory;
  level: number;
  experience: number;
  nextLevelThreshold: number;
  improvements: SkillImprovement[];
}

export interface SkillImprovement {
  timestamp: number;
  description: string;
  experienceGained: number;
  source: string; // tutorial, scenario, or achievement ID
}

export interface LearningData {
  sessionId: string;
  timestamp: number;
  duration: number;
  activitiesCompleted: string[];
  mistakesMade: LearningMistake[];
  conceptsLearned: string[];
  difficultyRating: number;
  engagementScore: number;
}

export interface LearningMistake {
  timestamp: number;
  description: string;
  category: MistakeCategory;
  corrected: boolean;
  hintsUsed: number;
}

export interface PlayerPreferences {
  difficulty: DifficultyLevel;
  hintFrequency: HintFrequency;
  audioEnabled: boolean;
  visualEffectsLevel: EffectsLevel;
  colorScheme: ColorScheme;
  fontSize: FontSize;
  autoSave: boolean;
  skipAnimations: boolean;
}

export interface TutorialSession {
  id: string;
  tutorialId: string;
  playerId: string;
  startTime: number;
  currentStep: number;
  completed: boolean;
  score: number;
  hintsUsed: number;
  timeSpent: number;
  mistakes: LearningMistake[];
  state: TutorialState;
}

export interface TutorialState {
  gameState: any; // current game state
  stepProgress: StepProgress[];
  availableHints: string[];
  restrictedActions: string[];
  highlightedElements: string[];
}

export interface StepProgress {
  stepId: string;
  started: boolean;
  completed: boolean;
  attempts: number;
  timeSpent: number;
  hintsUsed: string[];
}

// Enums for Tutorial and Scenario System
export enum TutorialStepType {
  INTRODUCTION = 'introduction',
  DEMONSTRATION = 'demonstration',
  GUIDED_PRACTICE = 'guided_practice',
  FREE_PRACTICE = 'free_practice',
  ASSESSMENT = 'assessment',
  REFLECTION = 'reflection'
}

export enum LearningCategory {
  AI_BASICS = 'ai_basics',
  DEVICE_CREATION = 'device_creation',
  INTERACTION_DESIGN = 'interaction_design',
  CRISIS_MANAGEMENT = 'crisis_management',
  GOVERNANCE_DESIGN = 'governance_design',
  SYSTEM_THINKING = 'system_thinking',
  ETHICAL_AI = 'ethical_ai'
}

export enum CompletionType {
  ACTION_PERFORMED = 'action_performed',
  OBJECTIVE_ACHIEVED = 'objective_achieved',
  TIME_ELAPSED = 'time_elapsed',
  CONDITION_MET = 'condition_met',
  USER_CONFIRMATION = 'user_confirmation'
}

export enum HintTrigger {
  TIME_DELAY = 'time_delay',
  INACTIVITY = 'inactivity',
  MISTAKE_MADE = 'mistake_made',
  STUCK_DETECTED = 'stuck_detected',
  REQUEST = 'request'
}

export enum VisualHintType {
  ARROW = 'arrow',
  HIGHLIGHT = 'highlight',
  PULSE = 'pulse',
  GLOW = 'glow',
  TOOLTIP = 'tooltip',
  ANIMATION = 'animation'
}

export enum HighlightType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  OUTLINE = 'outline',
  OVERLAY = 'overlay'
}

export enum HighlightStyle {
  SOLID = 'solid',
  DASHED = 'dashed',
  DOTTED = 'dotted',
  GLOW = 'glow'
}

export enum TriggerType {
  CLICK = 'click',
  DRAG = 'drag',
  INPUT = 'input',
  STATE_CHANGE = 'state_change',
  TIME_ELAPSED = 'time_elapsed',
  CUSTOM = 'custom'
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum ScenarioCategory {
  TUTORIAL = 'tutorial',
  CHALLENGE = 'challenge',
  SANDBOX = 'sandbox',
  STORY = 'story',
  PUZZLE = 'puzzle',
  CRISIS = 'crisis'
}

export enum FurnitureType {
  TABLE = 'table',
  CHAIR = 'chair',
  BED = 'bed',
  SOFA = 'sofa',
  DESK = 'desk',
  SHELF = 'shelf',
  CABINET = 'cabinet',
  COUNTER = 'counter'
}

export enum ConstraintType {
  PLACEMENT = 'placement',
  RESOURCE = 'resource',
  INTERACTION = 'interaction',
  TIME = 'time',
  BEHAVIOR = 'behavior'
}

export enum EmotionState {
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  CONFUSED = 'confused',
  FRUSTRATED = 'frustrated',
  EXCITED = 'excited',
  WORRIED = 'worried',
  ANGRY = 'angry'
}

export enum ObjectiveType {
  CREATE_DEVICE = 'create_device',
  PLACE_DEVICE = 'place_device',
  ACHIEVE_COOPERATION = 'achieve_cooperation',
  PREVENT_CONFLICT = 'prevent_conflict',
  MANAGE_CRISIS = 'manage_crisis',
  OPTIMIZE_EFFICIENCY = 'optimize_efficiency',
  LEARN_CONCEPT = 'learn_concept'
}

export enum TargetType {
  NUMERIC = 'numeric',
  BOOLEAN = 'boolean',
  STRING = 'string',
  ARRAY = 'array',
  OBJECT = 'object'
}

export enum SuccessType {
  OBJECTIVES_COMPLETED = 'objectives_completed',
  SCORE_ACHIEVED = 'score_achieved',
  TIME_UNDER_LIMIT = 'time_under_limit',
  EFFICIENCY_RATING = 'efficiency_rating',
  NO_FAILURES = 'no_failures'
}

export enum FailureType {
  TIME_EXCEEDED = 'time_exceeded',
  CRITICAL_ERROR = 'critical_error',
  OBJECTIVES_FAILED = 'objectives_failed',
  RESOURCE_EXHAUSTED = 'resource_exhausted',
  SAFETY_VIOLATION = 'safety_violation'
}

export enum AchievementCategory {
  TUTORIAL = 'tutorial',
  CREATIVITY = 'creativity',
  EFFICIENCY = 'efficiency',
  PROBLEM_SOLVING = 'problem_solving',
  EXPLORATION = 'exploration',
  MASTERY = 'mastery',
  COLLABORATION = 'collaboration'
}

export enum AchievementRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export enum UnlockType {
  TUTORIAL_COMPLETED = 'tutorial_completed',
  SCENARIO_COMPLETED = 'scenario_completed',
  SCORE_ACHIEVED = 'score_achieved',
  TIME_PLAYED = 'time_played',
  DEVICES_CREATED = 'devices_created',
  CRISES_RESOLVED = 'crises_resolved',
  PERFECT_SCORE = 'perfect_score',
  CREATIVE_SOLUTION = 'creative_solution'
}

export enum RewardType {
  EXPERIENCE_POINTS = 'experience_points',
  UNLOCK_CONTENT = 'unlock_content',
  COSMETIC_ITEM = 'cosmetic_item',
  TITLE = 'title',
  BADGE = 'badge'
}

export enum MistakeCategory {
  PLACEMENT_ERROR = 'placement_error',
  CONFIGURATION_ERROR = 'configuration_error',
  TIMING_ERROR = 'timing_error',
  STRATEGY_ERROR = 'strategy_error',
  UNDERSTANDING_ERROR = 'understanding_error'
}

export enum HintFrequency {
  NEVER = 'never',
  MINIMAL = 'minimal',
  NORMAL = 'normal',
  FREQUENT = 'frequent',
  ALWAYS = 'always'
}

export enum EffectsLevel {
  NONE = 'none',
  MINIMAL = 'minimal',
  NORMAL = 'normal',
  ENHANCED = 'enhanced'
}

export enum ColorScheme {
  DEFAULT = 'default',
  HIGH_CONTRAST = 'high_contrast',
  COLORBLIND_FRIENDLY = 'colorblind_friendly',
  DARK_MODE = 'dark_mode'
}

export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

// Game Event System Types
export interface GameEvent {
  id: string;
  type: string;
  timestamp: number;
  data?: { [key: string]: any };
  source?: string;
  category?: EventCategory;
}

export enum EventCategory {
  DEVICE_ACTION = 'device_action',
  SYSTEM_STATE = 'system_state',
  USER_INTERACTION = 'user_interaction',
  CRISIS_EVENT = 'crisis_event',
  LEARNING_EVENT = 'learning_event'
}

// AI Agent System Types
export interface AIAgent {
  id: string;
  name: string;
  type: DeviceCategory;
  position: Vector3;
  behaviorModel: AIBehaviorModel;
  currentState: AgentState;
  personality: PersonalityTrait[];
  objectives: AgentObjective[];
  constraints: AgentConstraint[];
  learningHistory: AgentLearningEvent[];
  communicationLog: CommunicationEvent[];
  resourceUsage: ResourceUsage;
  connections: string[]; // Connected agent IDs
  lastUpdate: number;
}

export interface AIBehaviorModel {
  primaryObjective: string;
  learningAlgorithm: LearningType;
  communicationStyle: CommunicationStyle;
  conflictResolution: ConflictStyle;
  hiddenAssumptions: string[];
  uncertaintyFactors: number[];
  adaptationRate: number;
  cooperationTendency: number;
  riskTolerance: number;
}

export interface AgentState {
  active: boolean;
  mood: EmotionState;
  energy: number;
  efficiency: number;
  stress: number;
  confidence: number;
  currentTask?: string;
  blockedBy?: string[];
  waitingFor?: string[];
  lastAction?: AgentAction;
  decisionQueue: AgentDecision[];
}

export interface AgentObjective {
  id: string;
  description: string;
  priority: number;
  deadline?: number;
  progress: number;
  dependencies: string[];
  conflicts: string[];
  status: ObjectiveStatus;
}

export interface AgentConstraint {
  type: ConstraintType;
  description: string;
  parameters: { [key: string]: any };
  severity: ConstraintSeverity;
  violationCount: number;
}

export interface AgentLearningEvent {
  timestamp: number;
  trigger: string;
  behaviorChange: BehaviorChange;
  confidence: number;
  source: LearningSource;
}

export interface BehaviorChange {
  parameter: string;
  oldValue: any;
  newValue: any;
  reason: string;
  permanence: number; // 0-1, how likely to persist
}

export interface CommunicationEvent {
  timestamp: number;
  senderId: string;
  receiverId: string;
  messageType: MessageType;
  content: any;
  success: boolean;
  response?: any;
}

export interface AgentAction {
  id: string;
  type: ActionType;
  timestamp: number;
  parameters: { [key: string]: any };
  result: ActionResult;
  resourceCost: ResourceUsage;
  duration: number;
}

export interface AgentDecision {
  id: string;
  timestamp: number;
  context: DecisionContext;
  options: DecisionOption[];
  selectedOption: string;
  reasoning: string;
  confidence: number;
}

export interface DecisionContext {
  situation: string;
  availableResources: ResourceUsage;
  timeConstraints: number;
  stakeholders: string[];
  risks: Risk[];
  opportunities: Opportunity[];
}

export interface DecisionOption {
  id: string;
  description: string;
  expectedOutcome: string;
  probability: number;
  cost: ResourceUsage;
  risks: Risk[];
  benefits: Benefit[];
}

export interface Risk {
  type: string;
  probability: number;
  impact: number;
  description: string;
  mitigation?: string;
}

export interface Opportunity {
  type: string;
  probability: number;
  value: number;
  description: string;
  requirements: string[];
}

export interface Benefit {
  type: string;
  value: number;
  description: string;
  duration: number;
}

export interface ActionResult {
  success: boolean;
  outcome: string;
  sideEffects: SideEffect[];
  resourcesConsumed: ResourceUsage;
  impactedAgents: string[];
  learningValue: number;
}

export interface SideEffect {
  type: string;
  description: string;
  severity: number;
  duration: number;
  affectedAgents: string[];
}

// Enums for AI Agent System
export enum LearningType {
  REINFORCEMENT = 'reinforcement',
  IMITATION = 'imitation',
  SUPERVISED = 'supervised',
  UNSUPERVISED = 'unsupervised',
  TRANSFER = 'transfer',
  META = 'meta'
}

export enum CommunicationStyle {
  DIRECT = 'direct',
  DIPLOMATIC = 'diplomatic',
  AGGRESSIVE = 'aggressive',
  PASSIVE = 'passive',
  COLLABORATIVE = 'collaborative',
  COMPETITIVE = 'competitive'
}

export enum ConflictStyle {
  AVOIDANCE = 'avoidance',
  ACCOMMODATION = 'accommodation',
  COMPETITION = 'competition',
  COMPROMISE = 'compromise',
  COLLABORATION = 'collaboration'
}

export enum ObjectiveStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

export enum ConstraintSeverity {
  SOFT = 'soft',
  MEDIUM = 'medium',
  HARD = 'hard',
  CRITICAL = 'critical'
}

export enum LearningSource {
  EXPERIENCE = 'experience',
  OBSERVATION = 'observation',
  COMMUNICATION = 'communication',
  INSTRUCTION = 'instruction',
  TRIAL_ERROR = 'trial_error'
}

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  COORDINATION = 'coordination',
  NEGOTIATION = 'negotiation',
  ALERT = 'alert',
  STATUS_UPDATE = 'status_update'
}

// Game Integration System Types
export interface GameState {
  mode: GameMode;
  devices: Device[];
  environment: Environment;
  tutorialProgress: TutorialProgress;
  scenarioProgress: ScenarioProgress;
  achievements: Achievement[];
  settings: AccessibilitySettings;
  timestamp: number;
}

export interface TutorialProgress {
  completedTutorials: string[];
  currentTutorial?: string;
  currentStep?: number;
}

export interface ScenarioProgress {
  completedScenarios: string[];
  currentScenario?: string;
  unlockedScenarios: string[];
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  audioDescriptions: boolean;
  keyboardNavigation: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceCategory;
  position: Vector3;
  personality: PersonalityTrait[];
  state: DeviceState;
}

export interface Environment {
  id: string;
  type: EnvironmentType;
  layout: RoomLayout;
  devices: string[];
  rules: GovernanceRule[];
}

export class IntegrationError extends Error {
  public type: string;
  public originalError?: Error;
  public context?: { [key: string]: any };

  constructor(type: string, originalError?: Error, context?: { [key: string]: any }) {
    super(originalError?.message || `Integration error: ${type}`);
    this.name = 'IntegrationError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
  }
}

export enum GameMode {
  MAIN_MENU = 'main_menu',
  TUTORIAL = 'tutorial',
  SCENARIO = 'scenario',
  FREE_PLAY = 'free_play',
  DEVICE_CREATION = 'device_creation',
  ROOM_DESIGN = 'room_design',
  CRISIS_MANAGEMENT = 'crisis_management',
  SETTINGS = 'settings',
  ACHIEVEMENTS = 'achievements'
}

export enum TransitionType {
  INSTANT = 'instant',
  SMOOTH = 'smooth',
  FADE = 'fade',
  SLIDE = 'slide'
}