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
  | 8 // LARGE_ROCK (solid)
  | 9; // MARSH_MUD (walkable)

export type MonsterArchetypeId =
  | 'giant_rat'
  | 'bramble_hound'
  | 'clockwork_drone'
  | 'spore_spitter';

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

export type MagicOrigin = 'radiant' | 'arcane' | 'eldritch' | 'wild';
export type ElementSchool = 'air' | 'fire' | 'water' | 'earth';
export type WeaponFamily = 'flexible' | 'sidearms' | 'blades';

export interface MagicSkillState {
  level: number;
  manaSpent: number;
  manaToNextLevel: number;
}

export type ElementSkillState = MagicSkillState;

export interface WeaponSkillState {
  level: number;
  hits: number;
  hitsToNextLevel: number;
}

export interface DefenseSkillState {
  level: number;
  hitsTaken: number;
  hitsToNextLevel: number;
  // Backward-compatible aliases
  hitsBlocked?: number;
  nextLevelHits?: number;
}

export interface SkillLevelUpEvent {
  skillName: string;
  category: 'origin' | 'element' | 'weapon' | 'defense';
  newLevel: number;
  color: string;
}

export interface PlayerSkills {
  origins: Record<MagicOrigin, MagicSkillState>;
  elements: Record<ElementSchool, ElementSkillState>;
  weapons: Record<WeaponFamily, WeaponSkillState>;
  defense: DefenseSkillState;

  // Backward-compatible scaffolding
  melee?: { level: number; tries: number; nextLevelTries: number };
  marksmanship?: { level: number; tries: number; nextLevelTries: number };
  magic?: { level: number; manaSpent: number; nextLevelMana: number };
}

export interface EntityResistances {
  origins: Record<MagicOrigin, number>;
  elements: Record<ElementSchool, number>;
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
  armor?: number;
  resistances?: EntityResistances;
  blocksThisRound?: number;
  blockRoundStartTime?: number;
  explorationSteps?: number;
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
  archetype: MonsterArchetypeId;
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
  minLevel?: number; // Minimum monster level for active exploration bonus checks
  attackReach?: number; // 1 for melee, 3 for Spore Spitter
  attackType?: 'physical' | 'earth';
  armorReduction?: number; // 2 for Clockwork Drone on physical attacks
  armor?: number; // flat physical armor soak
  defenseSkill?: number; // physical defense / evasion skill
  resistances?: EntityResistances;
  blocksThisRound?: number;
  blockRoundStartTime?: number;
  spawnStartupUntil?: number; // 500ms startup delay before AI actions begin
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
  type:
    | 'whip_lash'
    | 'aether_beam'
    | 'cinder_burst'
    | 'gale_blast'
    | 'level_up_nova'
    | 'spawn_puff'
    | 'spore_shot'
    | 'block_spark';
  fromX: number; // world pixel x
  fromY: number; // world pixel y
  toX: number; // world pixel x
  toY: number; // world pixel y
  startTime: number;
  durationMs: number;
  color: string;
}
