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

export type EquipSlot =
  | 'head'
  | 'body'
  | 'legs'
  | 'mainHand'
  | 'offHand'
  | 'ring'
  | 'consumable'
  | 'none';

export type EquipmentSlot = 'head' | 'body' | 'legs' | 'mainHand' | 'offHand' | 'ring';

export interface WeaponStats {
  family: WeaponFamily;
  minDamage: number;
  maxDamage: number;
  reach: number;
  speedMs: number;
  mpCost?: number;
  damageType: 'physical' | 'arcane';
}

export interface ArmorStats {
  armor: number;
  defenseSkillBonus?: number;
  maxMpBonus?: number;
  resistances?: {
    origins?: Partial<Record<MagicOrigin, number>>;
    elements?: Partial<Record<ElementSchool, number>>;
  };
}

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'consumable'
  | 'currency'
  | 'trophy';

export interface ConsumableStats {
  healHp?: number;
  restoreMp?: number;
  healMp?: number;
  capacityBonus?: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  slot: EquipSlot;
  category?: ItemCategory;
  description: string;
  stackable: boolean;
  maxStack?: number;
  weight: number;
  weaponStats?: WeaponStats;
  armorStats?: ArmorStats;
  consumableStats?: ConsumableStats;
  iconName: string;
  color?: string;
  buyPrice?: number;
  sellPrice?: number;
}

export interface ItemStack {
  itemId: string;
  quantity: number;
}

export interface EquipmentState {
  head?: ItemStack | null;
  body?: ItemStack | null;
  legs?: ItemStack | null;
  mainHand?: ItemStack | null;
  offHand?: ItemStack | null;
  ring?: ItemStack | null;
}

export interface CorpseEntity {
  id: string;
  archetype?: MonsterArchetypeId;
  monsterName: string;
  gridX: number;
  gridY: number;
  renderX?: number;
  renderY?: number;
  items: ItemStack[];
  spawnTime: number;
  decayTime?: number; // 60,000ms
}

export type QuestStatus = 'not_started' | 'active' | 'ready_to_turn_in' | 'completed';

export interface QuestProgress {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  ratsKilled: number;
  ratsRequired: number; // 5
  tailsRequired: number; // 3
  rewardGold: number; // 35
  rewardXp: number; // 50
  rewardChoice?: 'whipcord_wrap' | 'aether_coil';
}

export interface NpcEntity {
  id: string;
  name: string;
  title: string;
  role: 'merchant' | 'healer' | 'quest_giver';
  gridX: number;
  gridY: number;
  greeting: string;
  dialogue?: string;
  buyList?: { itemId: string; price: number }[];
  trophyPrices?: Record<string, number>;
  questId?: string;
  color: string;
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
  inventory?: (ItemStack | null)[];
  equipment?: EquipmentState;
  capacityWeight?: number;
  currentWeight?: number;
  attackSpeedMs?: number;
  attackReach?: number;
  activeWeaponFamily?: WeaponFamily;
  weaponMpCost?: number;
  gold?: number;
  bonusCapacity?: number;
  quests?: Record<string, QuestProgress>;
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
