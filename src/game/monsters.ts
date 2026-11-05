import {
  Monster,
  MonsterArchetypeId,
  TileId,
  TILE_SIZE,
  MAP_HEIGHT,
  MAP_WIDTH,
} from '../types/game';
import { canMove, getTileBiomes, isWalkable } from './map';

export interface MonsterArchetype {
  id: MonsterArchetypeId;
  name: string;
  biomes: string[];
  minLevel: number;
  maxHp: number;
  moveIntervalMs: number;
  attackIntervalMs: number;
  attackPower: [number, number];
  attackReach: number;
  attackType: 'physical' | 'earth';
  xpReward: number;
  armorReduction?: number;
}

export const MONSTER_ARCHETYPES: Record<MonsterArchetypeId, MonsterArchetype> = {
  giant_rat: {
    id: 'giant_rat',
    name: 'Giant Rat',
    biomes: ['grass', 'dirt'],
    minLevel: 1,
    maxHp: 20,
    moveIntervalMs: 800,
    attackIntervalMs: 1200,
    attackPower: [3, 5],
    attackReach: 1,
    attackType: 'physical',
    xpReward: 5,
  },
  bramble_hound: {
    id: 'bramble_hound',
    name: 'Bramble Hound',
    biomes: ['mud', 'marsh', 'grass'],
    minLevel: 1,
    maxHp: 35,
    moveIntervalMs: 500, // fast chaser
    attackIntervalMs: 1000,
    attackPower: [5, 8],
    attackReach: 1,
    attackType: 'physical',
    xpReward: 10,
  },
  clockwork_drone: {
    id: 'clockwork_drone',
    name: 'Clockwork Drone',
    biomes: ['stone', 'ruins'],
    minLevel: 2,
    maxHp: 50,
    moveIntervalMs: 900,
    attackIntervalMs: 1600,
    attackPower: [8, 11],
    attackReach: 1,
    attackType: 'physical',
    xpReward: 15,
    armorReduction: 2, // reduces physical damage by flat 2, min 1
  },
  spore_spitter: {
    id: 'spore_spitter',
    name: 'Spore Spitter',
    biomes: ['mud', 'marsh'],
    minLevel: 2,
    maxHp: 28,
    moveIntervalMs: 1000,
    attackIntervalMs: 1800,
    attackPower: [4, 6],
    attackReach: 3, // 3-tile ranged artillery
    attackType: 'earth',
    xpReward: 12,
  },
};

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
 * Factory to instantiate a monster from an archetype.
 */
export function createMonster(
  archetypeId: MonsterArchetypeId,
  gridX: number,
  gridY: number,
  id: string,
  now = 0
): Monster {
  const arch = MONSTER_ARCHETYPES[archetypeId] || MONSTER_ARCHETYPES.giant_rat;
  return {
    id,
    archetype: arch.id,
    name: arch.name,
    gridX,
    gridY,
    targetX: gridX,
    targetY: gridY,
    renderX: gridX * TILE_SIZE,
    renderY: gridY * TILE_SIZE,
    hp: arch.maxHp,
    maxHp: arch.maxHp,
    attackPower: [arch.attackPower[0], arch.attackPower[1]],
    attackIntervalMs: arch.attackIntervalMs,
    lastAttackTime: now,
    moveIntervalMs: arch.moveIntervalMs,
    lastMoveTime: now,
    isMoving: false,
    moveStartTime: 0,
    xpReward: arch.xpReward,
    isAlive: true,
    statusEffects: {},
    facing: 'DOWN',
    attackReach: arch.attackReach,
    attackType: arch.attackType,
    armorReduction: arch.armorReduction,
    spawnStartupUntil: now + 500, // 500ms startup delay
  };
}

/**
 * Spawns initial Giant Rats in walkable areas near the spawn crossroads.
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

    const rat = createMonster('giant_rat', spawnX, spawnY, `rat_${idx + 1}`, 0);
    delete rat.spawnStartupUntil; // initial rats are immediately active
    return rat;
  });
}

/**
 * Determines the next tile step for a monster chasing or kiting the player.
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

  // Startup delay on freshly spawned mobs (500ms delay before AI begins)
  if (monster.spawnStartupUntil !== undefined && now < monster.spawnStartupUntil) {
    return null;
  }

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

  const dist = getTileDistance(monster.gridX, monster.gridY, playerGridX, playerGridY);

  // 3. Spore Spitter Kiting Behavior (Ranged Artillery)
  // Reach is 3. Kiting: if dist <= 2, steps away to maintain range.
  // If dist == 3, holds position to fire. If 4 <= dist <= 6, approaches.
  if (monster.archetype === 'spore_spitter') {
    if (dist > 6) {
      // Outside Spore Spitter aggro range
      return null;
    }

    if (dist === 3) {
      // Optimal artillery range, hold ground and spit
      return null;
    }

    if (dist <= 2) {
      // Too close! Kite away from player
      const kiteSteps: { dx: number; dy: number; newDist: number; eucDist: number }[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nextX = monster.gridX + dx;
          const nextY = monster.gridY + dy;

          if (!canMove(map, monster.gridX, monster.gridY, dx, dy)) continue;
          if (nextX === playerGridX && nextY === playerGridY) continue;

          const isOccupied = allMonsters.some(
            (m) =>
              m.id !== monster.id &&
              m.isAlive &&
              (m.gridX === nextX || m.targetX === nextX) &&
              (m.gridY === nextY || m.targetY === nextY)
          );
          if (isOccupied) continue;

          const newDist = getTileDistance(nextX, nextY, playerGridX, playerGridY);
          if (newDist > dist) {
            const eucDist = getEuclideanDistanceSq(nextX, nextY, playerGridX, playerGridY);
            kiteSteps.push({ dx, dy, newDist, eucDist });
          }
        }
      }

      if (kiteSteps.length === 0) return null;

      // Pick step that maximizes distance from player
      kiteSteps.sort((a, b) => {
        if (a.newDist !== b.newDist) return b.newDist - a.newDist;
        return b.eucDist - a.eucDist;
      });

      return { dx: kiteSteps[0].dx, dy: kiteSteps[0].dy };
    }

    // dist > 3 && dist <= 6: Approach until dist == 3
    const approachSteps: { dx: number; dy: number; newDist: number; eucDist: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nextX = monster.gridX + dx;
        const nextY = monster.gridY + dy;

        if (!canMove(map, monster.gridX, monster.gridY, dx, dy)) continue;
        if (nextX === playerGridX && nextY === playerGridY) continue;

        const isOccupied = allMonsters.some(
          (m) =>
            m.id !== monster.id &&
            m.isAlive &&
            (m.gridX === nextX || m.targetX === nextX) &&
            (m.gridY === nextY || m.targetY === nextY)
        );
        if (isOccupied) continue;

        const newDist = getTileDistance(nextX, nextY, playerGridX, playerGridY);
        if (newDist < dist) {
          const eucDist = getEuclideanDistanceSq(nextX, nextY, playerGridX, playerGridY);
          approachSteps.push({ dx, dy, newDist, eucDist });
        }
      }
    }

    if (approachSteps.length === 0) return null;
    approachSteps.sort((a, b) => {
      if (a.newDist !== b.newDist) return a.newDist - b.newDist;
      return a.eucDist - b.eucDist;
    });

    return { dx: approachSteps[0].dx, dy: approachSteps[0].dy };
  }

  // 4. Standard Melee Chasers (Giant Rat, Bramble Hound, Clockwork Drone)
  if (dist > 4) {
    // Outside chase radius
    return null;
  }

  // Already adjacent (1 tile away) - in melee reach, no need to step
  if (dist <= 1) {
    return null;
  }

  // Greedy pathfinding toward player
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

/**
 * Rolls a randomized step threshold for spawning: 12 to 18 steps.
 */
export function getRandomStepThreshold(): number {
  return Math.floor(Math.random() * 7) + 12; // 12, 13, 14, 15, 16, 17, 18
}

/**
 * Step-based Biome Mob Spawner algorithm:
 * Called when player reaches their exploration step threshold.
 * Checks local density (< 4 within 8 tiles), global cap (< 15 alive),
 * selects a candidate tile in a 4-6 tile ring, filters archetypes by biome & player level,
 * and instantiates the new monster with a 500ms delay.
 */
export function attemptStepSpawn(
  playerGridX: number,
  playerGridY: number,
  playerLevel: number,
  map: TileId[][],
  monsters: Monster[],
  now: number
): { monster: Monster; spawnX: number; spawnY: number } | null {
  // 1. Density Check: if count of living monsters within 8-tile radius >= 4, abort
  const localCount = monsters.filter(
    (m) => m.isAlive && getTileDistance(playerGridX, playerGridY, m.gridX, m.gridY) <= 8
  ).length;
  if (localCount >= 4) {
    return null;
  }

  // 2. Global Cap Check: if total alive monsters >= 15, abort
  const globalCount = monsters.filter((m) => m.isAlive).length;
  if (globalCount >= 15) {
    return null;
  }

  // 3. Candidate Coordinate Selection:
  // Ring 4 to 6 tiles Chebyshev away from player, walkable, unoccupied. Try up to 6 random candidates.
  let targetCoord: { x: number; y: number } | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    // Generate an offset where max(abs(dx), abs(dy)) is in [4, 6]
    const ringRadius = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
    // Choose which axis gets the full ring radius
    const onX = Math.random() < 0.5;
    const sign = Math.random() < 0.5 ? -1 : 1;
    const otherOffset = Math.floor(Math.random() * (ringRadius * 2 + 1)) - ringRadius;

    const dx = onX ? sign * ringRadius : otherOffset;
    const dy = onX ? otherOffset : sign * ringRadius;

    const candX = playerGridX + dx;
    const candY = playerGridY + dy;

    if (candX < 1 || candY < 1 || candX >= MAP_WIDTH - 1 || candY >= MAP_HEIGHT - 1) {
      continue;
    }

    if (!isWalkable(map, candX, candY)) {
      continue;
    }

    // Must not be occupied by player
    if (candX === playerGridX && candY === playerGridY) {
      continue;
    }

    // Must not be occupied by any living monster
    const isOccupied = monsters.some(
      (m) =>
        m.isAlive &&
        (m.gridX === candX || m.targetX === candX) &&
        (m.gridY === candY || m.targetY === candY)
    );
    if (isOccupied) {
      continue;
    }

    targetCoord = { x: candX, y: candY };
    break;
  }

  if (!targetCoord) {
    return null;
  }

  // 4. Biome & Level Filter:
  const tileBiomes = getTileBiomes(map, targetCoord.x, targetCoord.y);
  const eligibleArchetypes = Object.values(MONSTER_ARCHETYPES).filter(
    (arch) =>
      arch.minLevel <= playerLevel &&
      arch.biomes.some((b) => tileBiomes.includes(b))
  );

  let chosenArchetype: MonsterArchetype;
  if (eligibleArchetypes.length > 0) {
    const pickedIdx = Math.floor(Math.random() * eligibleArchetypes.length);
    chosenArchetype = eligibleArchetypes[pickedIdx];
  } else {
    // Fallback archetype
    chosenArchetype = MONSTER_ARCHETYPES.giant_rat;
  }

  // 5. Spawn Execution
  const uniqueId = `mob_${chosenArchetype.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const newMonster = createMonster(
    chosenArchetype.id,
    targetCoord.x,
    targetCoord.y,
    uniqueId,
    now
  );

  return {
    monster: newMonster,
    spawnX: targetCoord.x,
    spawnY: targetCoord.y,
  };
}

/**
 * Despawns monsters that have wandered beyond 14 tiles Chebyshev distance from the player,
 * unless they are currently locked as the player's active target.
 */
export function leashMonsters(
  monsters: Monster[],
  playerGridX: number,
  playerGridY: number,
  targetId: string | null
): Monster[] {
  return monsters.filter((m) => {
    // Keep corpses (decay timer handles them)
    if (!m.isAlive) return true;

    // Never despawn player's current target
    if (targetId && m.id === targetId) return true;

    // Check Chebyshev distance
    const dist = getTileDistance(playerGridX, playerGridY, m.gridX, m.gridY);
    return dist <= 14;
  });
}

