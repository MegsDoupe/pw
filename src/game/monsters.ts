import {
  Monster,
  TileId,
  TILE_SIZE,
} from '../types/game';
import { canMove, isWalkable } from './map';

/**
 * Calculates Chebyshev grid distance (Tibia-style grid distance, diagonals count as 1 tile).
 */
export function getTileDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

/**
 * Calculates Euclidean distance squared for precise nearest-neighbor comparisons.
 */
export function getEuclideanDistanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Spawns 4 to 5 Giant Rats in walkable areas near the spawn crossroads.
 */
export function spawnGiantRats(map: TileId[][]): Monster[] {
  const spawnLocations = [
    { x: 16, y: 17 }, // North-west clearing
    { x: 24, y: 16 }, // North-east path bend
    { x: 16, y: 24 }, // South-west grove
    { x: 24, y: 24 }, // South-east meadow
    { x: 20, y: 15 }, // North highway
  ];

  return spawnLocations.map((loc, idx) => {
    // If designated tile is not walkable, find closest open tile
    let spawnX = loc.x;
    let spawnY = loc.y;
    if (!isWalkable(map, spawnX, spawnY)) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (isWalkable(map, spawnX + dx, spawnY + dy)) {
            spawnX += dx;
            spawnY += dy;
            break;
          }
        }
      }
    }

    return {
      id: `rat_${idx + 1}`,
      name: 'Giant Rat',
      gridX: spawnX,
      gridY: spawnY,
      targetX: spawnX,
      targetY: spawnY,
      renderX: spawnX * TILE_SIZE,
      renderY: spawnY * TILE_SIZE,
      hp: 20,
      maxHp: 20,
      attackPower: [3, 5],
      attackIntervalMs: 1200,
      lastAttackTime: 0,
      moveIntervalMs: 800,
      lastMoveTime: 0,
      isMoving: false,
      moveStartTime: 0,
      xpReward: 5,
      isAlive: true,
      statusEffects: {},
      facing: 'DOWN',
    };
  });
}

/**
 * Determines the next tile step for a monster chasing the player.
 * Returns { dx, dy } or null if cannot/should not step.
 */
export function calculateMonsterStep(
  monster: Monster,
  playerGridX: number,
  playerGridY: number,
  map: TileId[][],
  allMonsters: Monster[],
  now: number
): { dx: number; dy: number } | null {
  if (!monster.isAlive) return null;

  // 1. Status: Rooted prevents all movement
  const isRooted =
    (monster.statusEffects.rootedRemainingMs !== undefined && monster.statusEffects.rootedRemainingMs > 0) ||
    (monster.statusEffects.rootedUntil !== undefined && now < monster.statusEffects.rootedUntil);

  if (isRooted) {
    return null;
  }

  // 2. Status: Confusion picks a random walkable adjacent direction
  const isConfused =
    (monster.statusEffects.confusedRemainingMs !== undefined && monster.statusEffects.confusedRemainingMs > 0) ||
    (monster.statusEffects.confusedUntil !== undefined && now < monster.statusEffects.confusedUntil);

  if (isConfused) {
    const candidates = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ].sort(() => Math.random() - 0.5);

    for (const c of candidates) {
      const destX = monster.gridX + c.dx;
      const destY = monster.gridY + c.dy;

      // Don't step on player
      if (destX === playerGridX && destY === playerGridY) continue;

      // Don't step on other living monsters
      const isOccupied = allMonsters.some(
        (m) => m.id !== monster.id && m.isAlive && (m.gridX === destX || m.targetX === destX) && (m.gridY === destY || m.targetY === destY)
      );
      if (isOccupied) continue;

      if (canMove(map, monster.gridX, monster.gridY, c.dx, c.dy)) {
        return c;
      }
    }
    return null;
  }

  // 3. Normal Aggro: within 4 tiles radius
  const dist = getTileDistance(monster.gridX, monster.gridY, playerGridX, playerGridY);
  if (dist > 4) {
    // Outside chase radius
    return null;
  }

  // Already adjacent (1 tile away) - in melee reach, no need to step
  if (dist <= 1) {
    return null;
  }

  // 4. Greedy pathfinding toward player
  // Prioritize directions that reduce distance to player
  const possibleSteps: { dx: number; dy: number; dist: number }[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;

      const nextX = monster.gridX + dx;
      const nextY = monster.gridY + dy;

      // Check collision with world
      if (!canMove(map, monster.gridX, monster.gridY, dx, dy)) {
        continue;
      }

      // Check collision with player tile
      if (nextX === playerGridX && nextY === playerGridY) {
        continue;
      }

      // Check collision with other monsters
      const isOccupied = allMonsters.some(
        (m) =>
          m.id !== monster.id &&
          m.isAlive &&
          (m.gridX === nextX || m.targetX === nextX) &&
          (m.gridY === nextY || m.targetY === nextY)
      );
      if (isOccupied) {
        continue;
      }

      const newDist = getTileDistance(nextX, nextY, playerGridX, playerGridY);
      possibleSteps.push({ dx, dy, dist: newDist });
    }
  }

  if (possibleSteps.length === 0) return null;

  // Sort by shortest distance to player; break ties by Euclidean distance
  possibleSteps.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    const eucA = getEuclideanDistanceSq(monster.gridX + a.dx, monster.gridY + a.dy, playerGridX, playerGridY);
    const eucB = getEuclideanDistanceSq(monster.gridX + b.dx, monster.gridY + b.dy, playerGridX, playerGridY);
    return eucA - eucB;
  });

  const best = possibleSteps[0];
  if (best.dist < dist) {
    return { dx: best.dx, dy: best.dy };
  }

  return null;
}
