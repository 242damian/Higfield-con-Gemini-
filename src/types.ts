/**
 * HIGHFIELD - Core Types & State Definitions
 * Comprehensive definitions for autonomous behavior, 540x340 pixel renderer,
 * Earth Beacons, Lunar Relics, Dark Orbit & Bioluminescence, and Episodic Memory.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export enum HighfieldState {
  IDLE = 'IDLE',
  EXPLORING = 'EXPLORING',
  OBSERVING = 'OBSERVING',
  INSPECTING = 'INSPECTING',
  PLAYER_DETECTED = 'PLAYER_DETECTED',
  INTERACTING = 'INTERACTING',
  SITTING = 'SITTING',
  WEB_JUMP = 'WEB_JUMP',
  WEAVING_WEB = 'WEAVING_WEB',
  EXCAVATING_RELIC = 'EXCAVATING_RELIC',
  INTERCEPTING_BEACON = 'INTERCEPTING_BEACON',
}

export enum FacingDirection {
  LEFT = -1,
  RIGHT = 1,
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface LunarWaypoint {
  id: string;
  x: number;
  name: string;
  type: 'crater_rim' | 'viewpoint' | 'rock_formation' | 'plateau';
  description: string;
  observationFocus?: 'earth' | 'space' | 'ground' | 'horizon';
}

export interface HighfieldStatus {
  state: HighfieldState;
  position: Vector2D;
  targetPosition: Vector2D | null;
  facing: FacingDirection;
  currentAction: string;
  thought: string | null;
  thoughtTimer: number;
  emotion: 'calm' | 'curious' | 'wondrous' | 'focused' | 'alert' | 'friendly' | 'thoughtful';
  isInteracting: boolean;
  distanceToVisitor: number;
  nearVisitor: boolean;
  jumpProgress?: number;
  excavatingRelicId?: string | null;
  interceptingBeaconId?: string | null;
  activeFilamentColor?: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  isCross: boolean;
}

export interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  color: string;
  speed: number;
  active: boolean;
}

export interface Satellite {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  blinkTimer: number;
  active: boolean;
}

export interface Footprint {
  x: number;
  y: number;
  alpha: number;
  facing: FacingDirection;
  bioluminescent?: boolean;
}

export interface LunarCrater {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  depth: number;
  highlightColor: string;
  shadowColor: string;
}

export interface LunarRock {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface CosmicDustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  color?: string;
}

export interface CosmicWebState {
  active: boolean;
  deployProgress: number; // 0 to 1
  centerX: number;
  centerY: number;
  radius: number;
  rings: number;
  spokes: number;
  starlightEnergy: number; // 0 to 1 pulsation
  cinemaMode: 'AURORA_CINEMA' | 'CONSTELLATIONS' | 'EARTH_MEMORIES';
  filamentColor?: string;
}

export interface EarthBeacon {
  id: string;
  name: string;
  region: string;
  discRelX: number; // Offset from Earth center (-1 to 1)
  discRelY: number;
  type: 'LIGHTNING_STORM' | 'ROCKET_LAUNCH' | 'AURORA_BOREALIS' | 'CITY_LIGHTS_PULSE' | 'RADIO_TRANSMISSION';
  pulseTimer: number;
  active: boolean;
  thoughtOnIntercept: string;
  color: string;
}

export interface LunarRelic {
  id: string;
  name: string;
  category: 'spacecraft' | 'audio_relic' | 'crystal' | 'historical';
  description: string;
  x: number; // Position on lunar landscape
  y: number;
  discovered: boolean;
  iconName: string;
  shimmerTimer: number;
  effectType?: 'GOLDEN_WEB' | 'PLASMA_WEB' | 'NEON_GLOW' | 'SYNTH_TAPE';
}

export type PhenomenonType =
  | 'PASSING_ASTEROID'
  | 'SOLAR_FLARE'
  | 'COSMIC_RAY_BURST'
  | 'MICROMETEORITE_IMPACT'
  | 'SOLAR_WIND_AURORA';

export interface WorldPhenomenon {
  id: string;
  type: PhenomenonType;
  name: string;
  description: string;
  durationMs: number;
  elapsedMs: number;
  intensity: number; // 0 to 1
  params: Record<string, any>;
  active: boolean;
}

export interface EventTickerLog {
  id: string;
  timestamp: string;
  category: 'PHENOMENON' | 'TELEMETRY' | 'DISCOVERY' | 'AUTONOMY' | 'EARTH_SIGNAL';
  title: string;
  message: string;
  severity: 'info' | 'notice' | 'alert';
}

export interface DialogueNode {
  id: string;
  text: string;
  characterMood: 'calm' | 'curious' | 'wondrous' | 'thoughtful' | 'friendly';
  options?: DialogueOption[];
}

export interface DialogueOption {
  text: string;
  nextNodeId?: string;
  action?: () => void;
}

export interface WorldContext {
  timeInWorld: number;
  highfieldX: number;
  visitorX: number;
  visitorActive: boolean;
  shootingStarsSeen: number;
  lastStateChange: number;
}

export type CosmicEventType = 'NORMAL' | 'ECLIPSE' | 'METEOR_SHOWER';
export type EnvironmentLightingMode = 'STANDARD_ORBIT' | 'DEEP_DARK_NEBULA';
