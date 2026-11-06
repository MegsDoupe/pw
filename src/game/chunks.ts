import { TileId, MonsterArchetypeId } from '../types/game';
import { TILE_PROPERTIES } from './map';
import { isTileOccupiedByNpc } from './npcs';

export const CHUNK_SIZE = 16;
export const DEFAULT_WORLD_SEED = 1337;

export interface Chunk {
  chunkX: number;
  chunkY: number;
  tiles: TileId[][]; // 16x16: tiles[localY][localX]
}

export interface ModifiedWorldData {
  modifiedTile?: TileId;
  corpses?: any[];
}

/**
 * 32-bit Mulberry PRNG generator for deterministic randomness from a single seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic 2D coordinate hash returning a float in [0, 1).
 */
export function hash2D(x: number, y: number, seed: number = DEFAULT_WORLD_SEED): number {
  let h = (seed ^ (x * 374761393 + y * 668265263)) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Smooth cubic Hermite interpolation.
 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic 2D Value Noise with smoothstep interpolation.
 */
export function valueNoise2D(x: number, y: number, seed: number = DEFAULT_WORLD_SEED): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const n00 = hash2D(x0, y0, seed);
  const n10 = hash2D(x1, y0, seed);
  const n01 = hash2D(x0, y1, seed);
  const n11 = hash2D(x1, y1, seed);

  const nx0 = n00 * (1 - tx) + n10 * tx;
  const nx1 = n01 * (1 - tx) + n11 * tx;

  return nx0 * (1 - ty) + nx1 * ty;
}

/**
 * Multi-octave fractal noise combining smooth octaves for organic landscapes.
 */
export function fractalNoise2D(
  x: number,
  y: number,
  seed: number = DEFAULT_WORLD_SEED,
  octaves: number = 3
): number {
  let total = 0;
  let frequency = 0.04;
  let amplitude = 1.0;
  let maxAmp = 0;

  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * frequency, y * frequency, seed + i * 31) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return total / maxAmp;
}

/**
 * Convert world coordinate to chunk coordinate.
 */
export function getChunkCoord(worldVal: number): number {
  return Math.floor(worldVal / CHUNK_SIZE);
}

/**
 * Convert world coordinate to local chunk index [0, 15].
 */
export function getLocalCoord(worldVal: number): number {
  const mod = worldVal % CHUNK_SIZE;
  const res = mod < 0 ? mod + CHUNK_SIZE : mod;
  return res === 0 ? 0 : res;
}

/**
 * Formats chunk key "chunkX,chunkY".
 */
export function getChunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

/**
 * Formats tile coordinate key "worldX,worldY".
 */
export function getTileKey(worldX: number, worldY: number): string {
  return `${worldX},${worldY}`;
}

/**
 * Checks whether world coordinate is within the peaceful starter sanctuary.
 * Hostile monsters can NEVER spawn inside Chunk (0, 0) or within 14 tiles of (0, 0).
 */
export function isSanctuary(worldX: number, worldY: number): boolean {
  if (Math.hypot(worldX, worldY) < 14) {
    return true;
  }
  const cx = getChunkCoord(worldX);
  const cy = getChunkCoord(worldY);
  return cx === 0 && cy === 0;
}

/**
 * Checks whether world coordinate is within the Aetheric Ward.
 * Outer monsters cannot enter within 8 tiles of the central altar at (0, 0).
 */
export function isAethericWard(worldX: number, worldY: number): boolean {
  return Math.hypot(worldX, worldY) <= 8;
}

/**
 * Determines the radial danger zone based on Euclidean distance from origin (0, 0).
 * Zone 1: Safe Sanctuary (< 14 tiles)
 * Zone 2: Outskirts (14 - 45 tiles, Lv 1-2)
 * Zone 3: Wilderness (46 - 90 tiles, Lv 2-4)
 * Zone 4: Deep Ruins (> 90 tiles, Lv 4+)
 */
export function getDangerZone(worldX: number, worldY: number): 1 | 2 | 3 | 4 {
  const dist = Math.hypot(worldX, worldY);
  if (dist < 14 || (getChunkCoord(worldX) === 0 && getChunkCoord(worldY) === 0)) {
    return 1;
  }
  if (dist <= 45) {
    return 2;
  }
  if (dist <= 90) {
    return 3;
  }
  return 4;
}

/**
 * Evaluates the starter village layout for coordinates in the sanctuary area.
 * Returns TileId if (worldX, worldY) has a handcrafted sanctuary feature, or null if default terrain.
 */
function getSanctuaryTownTile(worldX: number, worldY: number): TileId | null {
  // 1. Origin Altar (0, 0): Sacred Hearth
  if (worldX === 0 && worldY === 0) {
    return 2; // Walkable consecrated cobblestone dais with special rendering
  }

  // 2. Temple Pillars framing (0, 0) with open cardinal archways
  // Pillars placed at corners: (±2, ±2), (±2, ±1), (±1, ±2)
  if (
    (Math.abs(worldX) === 2 && Math.abs(worldY) === 2) ||
    (Math.abs(worldX) === 2 && Math.abs(worldY) === 1) ||
    (Math.abs(worldX) === 1 && Math.abs(worldY) === 2)
  ) {
    return 4; // Stone Wall pillars
  }

  // Open cardinal archways leading directly out from the altar
  // (0, -2..2) and (-2..2, 0) remain open Cobblestone
  if (
    (worldX === 0 && Math.abs(worldY) <= 3) ||
    (worldY === 0 && Math.abs(worldX) <= 3)
  ) {
    return 2; // Cobblestone archway
  }

  // Temple courtyard / altar floor
  if (Math.abs(worldX) <= 2 && Math.abs(worldY) <= 2) {
    return 2; // Cobblestone
  }

  // 3. Central Cobblestone Avenues (Connecting Paths)
  // North avenue: x in [-1, 1], y in [-14, -3]
  if (Math.abs(worldX) <= 1 && worldY >= -14 && worldY <= -3) {
    return 2;
  }
  // South avenue: x in [-1, 1], y in [3, 14]
  if (Math.abs(worldX) <= 1 && worldY >= 3 && worldY <= 14) {
    return 2;
  }
  // West avenue: x in [-14, -3], y in [-1, 1]
  if (worldX >= -14 && worldX <= -3 && Math.abs(worldY) <= 1) {
    return 2;
  }
  // East avenue: x in [3, 14], y in [-1, 1]
  if (worldX >= 3 && worldX <= 14 && Math.abs(worldY) <= 1) {
    return 2;
  }

  // Diagonal avenues connecting central plaza to the 4 shopfronts
  if (
    (Math.abs(worldX - worldY) <= 1 && Math.abs(worldX) <= 5 && Math.abs(worldY) <= 5) ||
    (Math.abs(worldX + worldY) <= 1 && Math.abs(worldX) <= 5 && Math.abs(worldY) <= 5)
  ) {
    return 2; // Cobblestone path to shops
  }

  // 4. Shopfront 1: Blacksmith (North-West: bounds x: -8..-4, y: -8..-4)
  if (worldX >= -8 && worldX <= -4 && worldY >= -8 && worldY <= -4) {
    // Open south entrance at (x: -6, y: -4)
    if (worldX === -6 && worldY === -4) {
      return 2; // Cobblestone entrance
    }
    // Exterior walls
    if (worldX === -8 || worldX === -4 || worldY === -8 || worldY === -4) {
      return 4; // Stone Wall
    }
    // Interior forge / anvil
    if (worldX === -7 && worldY === -7) {
      return 8; // Large Rock / Anvil block
    }
    // Shop floor
    return 2; // Cobblestone interior
  }

  // 5. Shopfront 2: General Store (North-East: bounds x: 4..8, y: -8..-4)
  if (worldX >= 4 && worldX <= 8 && worldY >= -8 && worldY <= -4) {
    // Open south entrance at (x: 6, y: -4)
    if (worldX === 6 && worldY === -4) {
      return 2; // Cobblestone entrance
    }
    // Exterior walls
    if (worldX === 4 || worldX === 8 || worldY === -8 || worldY === -4) {
      return 4; // Stone Wall
    }
    // Shop floor
    return 2; // Cobblestone interior
  }

  // 6. Shopfront 3: Magic & Arcana Emporium (South-West: bounds x: -8..-4, y: 4..8)
  if (worldX >= -8 && worldX <= -4 && worldY >= 4 && worldY <= 8) {
    // Open north entrance at (x: -6, y: 4)
    if (worldX === -6 && worldY === 4) {
      return 2; // Cobblestone entrance
    }
    // Exterior walls
    if (worldX === -8 || worldX === -4 || worldY === 4 || worldY === 8) {
      return 4; // Stone Wall
    }
    // Ruin bookshelf / relic altar
    if (worldX === -7 && worldY === 7) {
      return 7; // Ancient stone ruin relic
    }
    // Shop floor
    return 2; // Cobblestone interior
  }

  // 7. Shopfront 4: Food Merchant (South-East: bounds x: 4..8, y: 4..8)
  if (worldX >= 4 && worldX <= 8 && worldY >= 4 && worldY <= 8) {
    // Open north entrance at (x: 6, y: 4)
    if (worldX === 6 && worldY === 4) {
      return 2; // Cobblestone entrance
    }
    // Exterior walls
    if (worldX === 4 || worldX === 8 || worldY === 4 || worldY === 8) {
      return 4; // Stone Wall
    }
    // Shop floor
    return 2; // Cobblestone interior
  }

  // 8. Cobblestone Central Plaza rim around temple
  if (Math.hypot(worldX, worldY) <= 4.2) {
    return 2; // Cobblestone plaza
  }

  // 9. Manicured town gardens inside sanctuary radius
  if (Math.hypot(worldX, worldY) < 13.5) {
    const gardenHash = hash2D(worldX, worldY, DEFAULT_WORLD_SEED + 99);
    // Subtle flower patches
    if (gardenHash > 0.65 && gardenHash < 0.85) {
      return 6; // Flower Grass
    }
    // Small ornamental trees in corners, away from main avenues
    if (
      gardenHash > 0.94 &&
      Math.abs(worldX) > 2 &&
      Math.abs(worldY) > 2 &&
      !(Math.abs(worldX) <= 1 || Math.abs(worldY) <= 1)
    ) {
      return 5; // Tree
    }
    return 0; // Peaceful grass
  }

  return null;
}

/**
 * Generates procedural terrain tile for any coordinate outside the sanctuary town.
 * Strictly guarantees that chunk perimeter tiles (localX, localY in {0, 1, 14, 15})
 * are 100% walkable to prevent obstacle walls and entrapment.
 */
function generateWildernessTile(
  worldX: number,
  worldY: number,
  localX: number,
  localY: number,
  seed: number
): TileId {
  // Pathing Safety Guarantee: 2-tile wide perimeter clearing along all chunk edges
  const isChunkEdge = localX <= 1 || localX >= 14 || localY <= 1 || localY >= 14;

  const elevation = fractalNoise2D(worldX, worldY, seed, 3);
  const moisture = fractalNoise2D(worldX + 620, worldY + 410, seed + 101, 3);
  const obstacleRnd = hash2D(worldX, worldY, seed + 202);

  // 1. Water & Marsh Depression
  if (elevation < 0.22) {
    if (isChunkEdge) {
      // Must be walkable on border! Replace water with walkable marsh mud
      return 9; // Marsh Mud
    }
    return 3; // Water
  }

  // 2. Marsh / Mud Swamplands
  if (elevation < 0.32 || (moisture > 0.62 && elevation < 0.48)) {
    if (obstacleRnd < 0.05 && !isChunkEdge) {
      return 5; // Marsh tree
    }
    return 9; // Marsh Mud
  }

  // 3. Ancient Ruins / Rocky High Elevation
  if (elevation > 0.72) {
    if (isChunkEdge) {
      // Keep border open and walkable
      return 2; // Cobblestone
    }
    if (obstacleRnd < 0.08) {
      return 4; // Stone Wall ruin
    }
    if (obstacleRnd < 0.12) {
      return 7; // Ancient Stone Ruin
    }
    if (obstacleRnd < 0.16) {
      return 8; // Large Rock
    }
    return 2; // Cobblestone
  }

  // 4. Natural Dirt Paths / Trails
  const trailNoise = Math.abs(fractalNoise2D(worldX * 0.7, worldY * 0.7, seed + 303, 2) - 0.5);
  if (trailNoise < 0.025) {
    return 1; // Dirt path
  }

  // 5. Grassland & Meadows (Baseline)
  if (!isChunkEdge) {
    if (obstacleRnd < 0.06) {
      return 5; // Tree
    }
    if (obstacleRnd >= 0.06 && obstacleRnd < 0.09) {
      return 8; // Large Rock
    }
  }

  // Flower grass meadow accents
  if (obstacleRnd > 0.75 && obstacleRnd < 0.9) {
    return 6; // Flower grass
  }

  return 0; // Standard Grass
}

/**
 * Generates an entire 16x16 Chunk deterministically.
 */
export function generateChunk(
  chunkX: number,
  chunkY: number,
  seed: number = DEFAULT_WORLD_SEED
): Chunk {
  const tiles: TileId[][] = Array.from({ length: CHUNK_SIZE }, () =>
    Array(CHUNK_SIZE).fill(0 as TileId)
  );

  const startWorldX = chunkX * CHUNK_SIZE;
  const startWorldY = chunkY * CHUNK_SIZE;

  for (let localY = 0; localY < CHUNK_SIZE; localY++) {
    for (let localX = 0; localX < CHUNK_SIZE; localX++) {
      const worldX = startWorldX + localX;
      const worldY = startWorldY + localY;

      // Check if inside Chunk (0, 0) or Sanctuary Town
      const sanctuaryTile = getSanctuaryTownTile(worldX, worldY);
      if (sanctuaryTile !== null) {
        tiles[localY][localX] = sanctuaryTile;
        continue;
      }

      // If in Chunk (0, 0) but outside specific town features, fill with peaceful village grass/flowers
      if (chunkX === 0 && chunkY === 0) {
        const isChunkEdge = localX <= 1 || localX >= 14 || localY <= 1 || localY >= 14;
        const gardenRnd = hash2D(worldX, worldY, seed + 555);
        if (!isChunkEdge && gardenRnd > 0.95) {
          tiles[localY][localX] = 5; // Village tree
        } else if (gardenRnd > 0.8) {
          tiles[localY][localX] = 6; // Flower grass
        } else {
          tiles[localY][localX] = 0; // Grass
        }
        continue;
      }

      // Procedural wilderness generation with edge safety guarantee
      tiles[localY][localX] = generateWildernessTile(worldX, worldY, localX, localY, seed);
    }
  }

  return {
    chunkX,
    chunkY,
    tiles,
  };
}

/**
 * World Chunk Manager:
 * Manages active 3x3 chunks centered on the player, deterministic generation,
 * delta cache for modified tiles, and infinite world collision queries.
 */
export class ChunkManager {
  public readonly worldSeed: number;
  private readonly activeChunks: Map<string, Chunk> = new Map();
  private readonly modifiedTiles: Map<string, TileId> = new Map();
  private currentPlayerChunkX = 0;
  private currentPlayerChunkY = 0;

  constructor(seed: number = DEFAULT_WORLD_SEED) {
    this.worldSeed = seed;
    // Pre-populate Chunk (0, 0) and surrounding 3x3
    this.updateActiveChunks(0, 0);
  }

  /**
   * Retrieves a chunk from active cache or generates it deterministically.
   */
  public getChunk(chunkX: number, chunkY: number): Chunk {
    const key = getChunkKey(chunkX, chunkY);
    let chunk = this.activeChunks.get(key);
    if (!chunk) {
      chunk = generateChunk(chunkX, chunkY, this.worldSeed);
      this.activeChunks.set(key, chunk);
    }
    return chunk;
  }

  /**
   * Updates the active 3x3 chunk grid centered on the player's world coordinates.
   * Evicts chunks outside the active 3x3 window to ensure minimal memory overhead.
   */
  public updateActiveChunks(playerWorldX: number, playerWorldY: number): void {
    const playerChunkX = getChunkCoord(playerWorldX);
    const playerChunkY = getChunkCoord(playerWorldY);

    this.currentPlayerChunkX = playerChunkX;
    this.currentPlayerChunkY = playerChunkY;

    const neededKeys = new Set<string>();

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = playerChunkX + dx;
        const cy = playerChunkY + dy;
        const key = getChunkKey(cx, cy);
        neededKeys.add(key);

        if (!this.activeChunks.has(key)) {
          this.activeChunks.set(key, generateChunk(cx, cy, this.worldSeed));
        }
      }
    }

    // Safely unload chunks outside the active 3x3 boundary
    for (const key of this.activeChunks.keys()) {
      if (!neededKeys.has(key)) {
        this.activeChunks.delete(key);
      }
    }
  }

  /**
   * Returns list of currently active 3x3 chunks.
   */
  public getActiveChunks(): Chunk[] {
    return Array.from(this.activeChunks.values());
  }

  /**
   * Retrieves the TileId at any world coordinate (supports negative and unbounded coordinates).
   * Checks modified delta cache first, then the deterministic chunk tile.
   */
  public getTile(worldX: number, worldY: number): TileId {
    const key = getTileKey(worldX, worldY);
    const modified = this.modifiedTiles.get(key);
    if (modified !== undefined) {
      return modified;
    }

    const chunkX = getChunkCoord(worldX);
    const chunkY = getChunkCoord(worldY);
    const localX = getLocalCoord(worldX);
    const localY = getLocalCoord(worldY);

    const chunk = this.getChunk(chunkX, chunkY);
    return chunk.tiles[localY][localX];
  }

  /**
   * Records a modified tile into the persistent delta cache.
   */
  public setTile(worldX: number, worldY: number, tileId: TileId): void {
    this.modifiedTiles.set(getTileKey(worldX, worldY), tileId);
  }

  /**
   * Checks whether a world coordinate is walkable.
   */
  public isWalkable(worldX: number, worldY: number): boolean {
    const tileId = this.getTile(worldX, worldY);
    const meta = TILE_PROPERTIES[tileId];
    return meta ? meta.walkable : false;
  }

  /**
   * Grid RPG movement and collision validation:
   * - Target tile must be walkable.
   * - Diagonal movement prevents corner-cutting past solid walls.
   */
  public canMove(fromX: number, fromY: number, dx: number, dy: number): boolean {
    if (dx === 0 && dy === 0) return false;

    const targetX = fromX + dx;
    const targetY = fromY + dy;

    // Solid NPC collision check
    if (isTileOccupiedByNpc(targetX, targetY)) {
      return false;
    }

    if (!this.isWalkable(targetX, targetY)) {
      return false;
    }

    // Cardinal movement has no corner-cutting checks
    if (dx === 0 || dy === 0) {
      return true;
    }

    // Diagonal movement: adjacent cardinals must also be walkable and unoccupied by NPCs
    const horizontalAdjacent =
      this.isWalkable(fromX + dx, fromY) && !isTileOccupiedByNpc(fromX + dx, fromY);
    const verticalAdjacent =
      this.isWalkable(fromX, fromY + dy) && !isTileOccupiedByNpc(fromX, fromY + dy);

    return horizontalAdjacent && verticalAdjacent;
  }

  /**
   * Retrieves biome labels for a world coordinate.
   * Analyzes target tile and adjacent tiles within a 2-tile radius.
   */
  public getTileBiomes(worldX: number, worldY: number): string[] {
    const biomes = new Set<string>();
    const tileId = this.getTile(worldX, worldY);

    switch (tileId) {
      case 0:
      case 6:
        biomes.add('grass');
        break;
      case 1:
        biomes.add('dirt');
        break;
      case 2:
      case 4:
      case 7:
      case 8:
        biomes.add('stone');
        biomes.add('ruins');
        break;
      case 3:
      case 9:
        biomes.add('mud');
        biomes.add('marsh');
        break;
      default:
        biomes.add('grass');
        break;
    }

    // Proximity checks for mud/marsh/stone
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dy === 0) continue;
        const neighbor = this.getTile(worldX + dx, worldY + dy);
        if (neighbor === 3 || neighbor === 9) {
          biomes.add('mud');
          biomes.add('marsh');
        } else if (neighbor === 4 || neighbor === 7) {
          biomes.add('stone');
          biomes.add('ruins');
        }
      }
    }

    return Array.from(biomes);
  }

  /**
   * Checks if world coordinate is within peaceful sanctuary.
   */
  public isSanctuary(worldX: number, worldY: number): boolean {
    return isSanctuary(worldX, worldY);
  }

  /**
   * Checks if world coordinate is inside the Aetheric Ward.
   */
  public isAethericWard(worldX: number, worldY: number): boolean {
    return isAethericWard(worldX, worldY);
  }

  /**
   * Gets current danger zone (1: Safe, 2: Outskirts, 3: Wilderness, 4: Deep Ruins).
   */
  public getDangerZone(worldX: number, worldY: number): 1 | 2 | 3 | 4 {
    return getDangerZone(worldX, worldY);
  }
}

// Global default singleton instance
export const worldChunkManager = new ChunkManager(DEFAULT_WORLD_SEED);
