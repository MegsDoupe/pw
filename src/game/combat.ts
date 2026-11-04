import {
  CharacterClass,
  Monster,
  PlayerStats,
  TileId,
} from '../types/game';
import { isWalkable } from './map';
import { getTileDistance, getEuclideanDistanceSq } from './monsters';

export interface AbilityExecutionResult {
  success: boolean;
  message?: string;
  damage?: number;
  heal?: number;
  mpCost?: number;
  statusEffect?: {
    type: 'root' | 'confuse';
    durationMs: number;
  };
  knockbackDest?: { x: number; y: number };
  effectType?: 'whip_lash' | 'aether_beam' | 'cinder_burst' | 'gale_blast';
}

/**
 * Generates an integer between min and max inclusive.
 */
export function rollDamage(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Finds the nearest living monster to the player.
 * If cycling is requested (e.g. Tab key), cycles to the next nearest.
 */
export function findNearestMonster(
  playerGridX: number,
  playerGridY: number,
  monsters: Monster[],
  currentTargetId: string | null = null
): Monster | null {
  const living = monsters.filter(
    (m) => m.isAlive && getTileDistance(playerGridX, playerGridY, m.gridX, m.gridY) < 8
  );

  if (living.length === 0) return null;

  // Sort by Euclidean distance from player
  living.sort((a, b) => {
    const distA = getEuclideanDistanceSq(playerGridX, playerGridY, a.gridX, a.gridY);
    const distB = getEuclideanDistanceSq(playerGridX, playerGridY, b.gridX, b.gridY);
    return distA - distB;
  });

  if (!currentTargetId) {
    return living[0];
  }

  // Cycle to next
  const currentIndex = living.findIndex((m) => m.id === currentTargetId);
  if (currentIndex === -1 || currentIndex === living.length - 1) {
    return living[0];
  }
  return living[currentIndex + 1];
}

/**
 * Determines whether the targeting lock should automatically break.
 * Lock breaks if monster is dead or distance >= 8 tiles.
 */
export function shouldBreakTargetLock(
  playerGridX: number,
  playerGridY: number,
  monster: Monster | null
): boolean {
  if (!monster) return true;
  if (!monster.isAlive) return true;
  const dist = getTileDistance(playerGridX, playerGridY, monster.gridX, monster.gridY);
  return dist >= 8;
}

/**
 * Calculates 1-tile knockback destination directly away from attacker.
 * Checks that the destination tile is in-bounds, walkable, and not occupied by another monster.
 */
export function calculateKnockbackDestination(
  attackerX: number,
  attackerY: number,
  targetX: number,
  targetY: number,
  map: TileId[][],
  monsters: Monster[]
): { x: number; y: number } {
  const dx = Math.sign(targetX - attackerX);
  const dy = Math.sign(targetY - attackerY);

  if (dx === 0 && dy === 0) {
    return { x: targetX, y: targetY };
  }

  const destX = targetX + dx;
  const destY = targetY + dy;

  // Check map walkability
  if (!isWalkable(map, destX, destY)) {
    return { x: targetX, y: targetY }; // Wall collision blocks knockback
  }

  // Check monster occupancy
  const isOccupied = monsters.some(
    (m) =>
      m.isAlive &&
      (m.gridX === destX || m.targetX === destX) &&
      (m.gridY === destY || m.targetY === destY)
  );

  if (isOccupied) {
    return { x: targetX, y: targetY }; // Blocked by another entity
  }

  return { x: destX, y: destY };
}

/**
 * Executes an active ability (Slot 1 or 2) given the player class, target, and cooldowns.
 */
export function executeAbility(
  slotId: number,
  playerStats: PlayerStats,
  playerGridX: number,
  playerGridY: number,
  target: Monster | null,
  map: TileId[][],
  allMonsters: Monster[],
  cooldownUntil: number,
  now: number
): AbilityExecutionResult {
  if (now < cooldownUntil) {
    return { success: false, message: 'Ability on cooldown' };
  }

  if (!target || !target.isAlive) {
    return { success: false, message: 'No target selected' };
  }

  const dist = getTileDistance(playerGridX, playerGridY, target.gridX, target.gridY);
  const isAvenger = playerStats.classType === 'Avenger';

  if (slotId === 1) {
    // === ABILITY 1 ===
    if (isAvenger) {
      // Avenger 1: "Entangling Lash" (Roots for 2s, 8 MP, 6s CD, 2-tile reach, 6-10 dmg)
      if (dist > 2) return { success: false, message: 'Target out of reach (max 2 tiles)' };
      if (playerStats.mp < 8) return { success: false, message: 'Not enough MP' };

      const damage = rollDamage(6, 10);
      return {
        success: true,
        damage,
        mpCost: 8,
        statusEffect: { type: 'root', durationMs: 2000 },
        effectType: 'whip_lash',
      };
    } else {
      // Sage 1: "Aether Gale Shot" (10-14 air dmg, knocks 1 tile away, 10 MP, 2.5s CD, 4-tile reach)
      if (dist > 4) return { success: false, message: 'Target out of reach (max 4 tiles)' };
      if (playerStats.mp < 10) return { success: false, message: 'Not enough MP' };

      const damage = rollDamage(10, 14);
      const knockbackDest = calculateKnockbackDestination(
        playerGridX,
        playerGridY,
        target.gridX,
        target.gridY,
        map,
        allMonsters
      );

      return {
        success: true,
        damage,
        mpCost: 10,
        knockbackDest,
        effectType: 'gale_blast',
      };
    }
  } else if (slotId === 2) {
    // === ABILITY 2 ===
    if (isAvenger) {
      // Avenger 2: "Cinder Brand" (14-20 fire dmg, heals 4 HP, 12 MP, 3.5s CD, 2-tile reach)
      if (dist > 2) return { success: false, message: 'Target out of reach (max 2 tiles)' };
      if (playerStats.mp < 12) return { success: false, message: 'Not enough MP' };

      const damage = rollDamage(14, 20);
      return {
        success: true,
        damage,
        heal: 4,
        mpCost: 12,
        effectType: 'cinder_burst',
      };
    } else {
      // Sage 2: "Static Confusion" (Scrambles pathfinding for 3s, 16 MP, 9s CD, 4-tile reach, 4-8 arcane dmg)
      if (dist > 4) return { success: false, message: 'Target out of reach (max 4 tiles)' };
      if (playerStats.mp < 16) return { success: false, message: 'Not enough MP' };

      const damage = rollDamage(4, 8);
      return {
        success: true,
        damage,
        mpCost: 16,
        statusEffect: { type: 'confuse', durationMs: 3000 },
        effectType: 'aether_beam',
      };
    }
  }

  return { success: false, message: 'Ability not ready' };
}

/**
 * Checks whether the player's auto-attack should trigger against the targeted monster.
 */
export function checkAutoAttack(
  playerStats: PlayerStats,
  playerGridX: number,
  playerGridY: number,
  target: Monster | null,
  lastAttackTime: number,
  now: number
): {
  shouldAttack: boolean;
  damage?: number;
  mpCost?: number;
  effectType?: 'whip_lash' | 'aether_beam';
} {
  if (!target || !target.isAlive) {
    return { shouldAttack: false };
  }

  const isAvenger = playerStats.classType === 'Avenger';
  const dist = getTileDistance(playerGridX, playerGridY, target.gridX, target.gridY);
  const interval = isAvenger ? 1400 : 1600;
  const reach = isAvenger ? 2 : 4;

  if (now - lastAttackTime < interval) {
    return { shouldAttack: false };
  }

  if (dist > reach) {
    return { shouldAttack: false };
  }

  if (!isAvenger) {
    // Sage auto-attack costs 1 MP
    if (playerStats.mp < 1) {
      return { shouldAttack: false };
    }
    const damage = rollDamage(6, 10);
    return {
      shouldAttack: true,
      damage,
      mpCost: 1,
      effectType: 'aether_beam',
    };
  } else {
    // Avenger auto-attack
    const damage = rollDamage(8, 12);
    return {
      shouldAttack: true,
      damage,
      mpCost: 0,
      effectType: 'whip_lash',
    };
  }
}
