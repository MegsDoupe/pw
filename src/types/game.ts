/**
 * Core game engine types and interfaces for the 2D retro grid RPG.
 */

export const TILE_SIZE = 32;
export const VIEWPORT_COLS = 15;
export const VIEWPORT_ROWS = 11;
export const CANVAS_WIDTH = VIEWPORT_COLS * TILE_SIZE; // 480px
export const CANVAS_HEIGHT = VIEWPORT_ROWS * TILE_SIZE; // 352px

export const MAP_WIDTH = 40;
export const MAP_HEIGHT = 40;
export const MOVE_DURATION_MS = 200;

export type TileId = 
  | 0 // GRASS (walkable)
  | 1 // DIRT_PATH (walkable)
  | 2 // COBBLESTONE (walkable)
  | 3 // WATER (solid)
  | 4 // STONE_WALL (solid)
  | 5 // TREE (solid)
  | 6 // FLOWER_GRASS (walkable)
  | 7 // STONE_RUIN (solid)
  | 8 // LARGE_ROCK (solid);

export interface TileMeta {
  id: TileId;
  name: string;
  walkable: boolean;
  baseColor: string;
  accentColor: string;
}

export type Direction = 
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'UP_LEFT'
  | 'UP_RIGHT'
  | 'DOWN_LEFT'
  | 'DOWN_RIGHT'
  | 'NONE';

export type CharacterClass = 'Avenger' | 'Sage';

export interface PlayerSkills {
  melee: { level: number; tries: number; nextLevelTries: number };
  marksmanship: { level: number; tries: number; nextLevelTries: number };
  magic: { level: number; manaSpent: number; nextLevelMana: number };
  defense: { level: number; hitsBlocked: number; nextLevelHits: number };
}

export interface PlayerStats {
  classType: CharacterClass;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXpEarned: number;
  baseMinDamage: number;
  baseMaxDamage: number;
  skills: PlayerSkills;
  xp?: number; // Backward-compatible alias for currentXp
}

export interface PlayerMovementState {
  gridX: number;
  gridY: number;
  targetX: number;
  targetY: number;
  renderX: number; // pixel units in world space
  renderY: number; // pixel units in world space
  isMoving: boolean;
  moveStartTime: number;
  facing: Direction;
  bufferedDirection: Direction;
}

export interface CameraState {
  x: number; // pixel offset
  y: number;
}

export interface HotbarSlot {
  id: number;
  keyLabel: string;
  name: string;
  iconName: string;
  color: string;
  description: string;
  mpCost: number;
  cooldownMs: number;
}

export interface MonsterStatusEffects {
  rootedUntil?: number;
  confusedUntil?: number;
  rootedRemainingMs?: number;
  confusedRemainingMs?: number;
}

export interface Monster {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  targetX: number;
  targetY: number;
  renderX: number; // in world pixels
  renderY: number;
  hp: number;
  maxHp: number;
  attackPower: [number, number];
  attackIntervalMs: number;
  lastAttackTime: number;
  moveIntervalMs: number;
  lastMoveTime: number;
  isMoving: boolean;
  moveStartTime: number;
  xpReward: number;
  isAlive: boolean;
  deathTime?: number;
  statusEffects: MonsterStatusEffects;
  facing: Direction;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number; // world pixel x
  y: number; // world pixel y
  color: string;
  startTime: number;
  durationMs: number;
}

export interface VisualEffect {
  id: string;
  type: 'whip_lash' | 'aether_beam' | 'cinder_burst' | 'gale_blast' | 'level_up_nova';
  fromX: number; // world pixel x
  fromY: number; // world pixel y
  toX: number; // world pixel x
  toY: number; // world pixel y
  startTime: number;
  durationMs: number;
  color: string;
}
