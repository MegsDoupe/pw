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
  reason?: 'cooldown' | 'no_target' | 'out_of_range' | 'no_mana' | 'unknown';
  message?: string;
  damage?: number;
  heal?: number;
  mpCost?: number;
  cooldownMs?: number;
  statusEffect?: {
    type: 'rooted' | 'confused' | 'root' | 'confuse';
    durationMs: number;
  };
  knockbackDest?: { x: number; y: number; wasBlocked?: boolean };
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
 * Formula: dx = Math.sign(target.x - player.x), dy = Math.sign(target.y - player.y)
 * Checks that the destination tile is in-bounds, walkable, and not occupied by another living monster.
 * If blocked, returns the current target coordinates with wasBlocked: true.
 */
export function calculateKnockbackDestination(
  attackerX: number,
  attackerY: number,
  targetX: number,
  targetY: number,
  map: TileId[][],
  monsters: Monster[],
  targetId?: string
): { x: number; y: number; wasBlocked: boolean } {
  const dx = Math.sign(targetX - attackerX);
  const dy = Math.sign(targetY - attackerY);

  if (dx === 0 && dy === 0) {
    return { x: targetX, y: targetY, wasBlocked: true };
  }

  const destX = targetX + dx;
  const destY = targetY + dy;

  // Check map walkability (in bounds and walkable)
  if (!isWalkable(map, destX, destY)) {
    return { x: targetX, y: targetY, wasBlocked: true }; // Wall collision blocks knockback
  }

  // Check collision with attacker/player
  if (destX === attackerX && destY === attackerY) {
    return { x: targetX, y: targetY, wasBlocked: true };
  }

  // Check monster occupancy (excluding target monster itself)
  const isOccupied = monsters.some(
    (m) =>
      m.id !== targetId &&
      m.isAlive &&
      (m.gridX === destX || m.targetX === destX) &&
      (m.gridY === destY || m.targetY === destY)
  );

  if (isOccupied) {
    return { x: targetX, y: targetY, wasBlocked: true }; // Blocked by another entity
  }

  return { x: destX, y: destY, wasBlocked: false };
}

/**
 * Executes an active ability (Slot 1 or 2, plus Slot 3 utility) with strict validation:
 * 1. Living target currently locked (for targeted offensive spells).
 * 2. Chebyshev distance <= ability range.
 * 3. player.mp >= ability.manaCost.
 * 4. currentTime >= abilityReadyAt.
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
  const isAvenger = playerStats.classType === 'Avenger';

  // === Self-Cast Utility Slots (Slot 3 Potion / Flask) ===
  if (slotId === 3) {
    if (now < cooldownUntil) {
      return { success: false, reason: 'cooldown', message: 'Potion on cooldown' };
    }
    if (isAvenger) {
      // Sun Draught: Restores 45 HP instantly, 0 MP cost, 8s CD
      return {
        success: true,
        heal: 45,
        mpCost: 0,
        cooldownMs: 8000,
        effectType: 'cinder_burst',
      };
    } else {
      // Aether Flask: Restores 35 MP instantly, 0 MP cost, 8s CD
      return {
        success: true,
        heal: 0,
        mpCost: -35,
        cooldownMs: 8000,
        effectType: 'aether_beam',
      };
    }
  }

  // === Targeted Signature Abilities (Slots 1 & 2) ===
  // 1. Living target currently locked check
  if (!target || !target.isAlive) {
    return { success: false, reason: 'no_target', message: 'No target selected' };
  }

  const dist = getTileDistance(playerGridX, playerGridY, target.gridX, target.gridY);

  if (slotId === 1) {
    // === SLOT 1 ===
    if (isAvenger) {
      // Avenger Slot 1: "Entangling Lash"
      // Cost: 8 MP | Cooldown: 6000ms | Range: 2 tiles. Deals 6-10 physical damage and applies status: { type: "rooted", durationMs: 2000 }
      const maxRange = 2;
      const mpCost = 8;
      const cooldownMs = 6000;

      // 2. Chebyshev distance <= ability range
      if (dist > maxRange) {
        return { success: false, reason: 'out_of_range', message: `Target out of reach (max ${maxRange} tiles)` };
      }
      // 3. player.mp >= ability.manaCost
      if (playerStats.mp < mpCost) {
        return { success: false, reason: 'no_mana', message: 'Not enough MP' };
      }
      // 4. currentTime >= abilityReadyAt
      if (now < cooldownUntil) {
        return { success: false, reason: 'cooldown', message: 'Ability on cooldown' };
      }

      const damage = rollDamage(6, 10);
      return {
        success: true,
        damage,
        mpCost,
        cooldownMs,
        statusEffect: { type: 'rooted', durationMs: 2000 },
        effectType: 'whip_lash',
      };
    } else {
      // Sage Slot 1: "Aether Gale Shot"
      // Cost: 10 MP | Cooldown: 2500ms | Range: 4 tiles. Deals 10-14 air damage and executes Knockback: pushes target 1 tile directly away from Sage
      const maxRange = 4;
      const mpCost = 10;
      const cooldownMs = 2500;

      // 2. Chebyshev distance <= ability range
      if (dist > maxRange) {
        return { success: false, reason: 'out_of_range', message: `Target out of reach (max ${maxRange} tiles)` };
      }
      // 3. player.mp >= ability.manaCost
      if (playerStats.mp < mpCost) {
        return { success: false, reason: 'no_mana', message: 'Not enough MP' };
      }
      // 4. currentTime >= abilityReadyAt
      if (now < cooldownUntil) {
        return { success: false, reason: 'cooldown', message: 'Ability on cooldown' };
      }

      const damage = rollDamage(10, 14);
      const knockbackDest = calculateKnockbackDestination(
        playerGridX,
        playerGridY,
        target.gridX,
        target.gridY,
        map,
        allMonsters,
        target.id
      );

      return {
        success: true,
        damage,
        mpCost,
        cooldownMs,
        knockbackDest,
        effectType: 'gale_blast',
      };
    }
  } else if (slotId === 2) {
    // === SLOT 2 ===
    if (isAvenger) {
      // Avenger Slot 2: "Cinder Brand"
      // Cost: 12 MP | Cooldown: 3500ms | Range: 2 tiles. Deals 14-20 fire damage and immediately restores 4 HP to the player (clamped to maxHp). Render floating green "+4" over player.
      const maxRange = 2;
      const mpCost = 12;
      const cooldownMs = 3500;

      // 2. Chebyshev distance <= ability range
      if (dist > maxRange) {
        return { success: false, reason: 'out_of_range', message: `Target out of reach (max ${maxRange} tiles)` };
      }
      // 3. player.mp >= ability.manaCost
      if (playerStats.mp < mpCost) {
        return { success: false, reason: 'no_mana', message: 'Not enough MP' };
      }
      // 4. currentTime >= abilityReadyAt
      if (now < cooldownUntil) {
        return { success: false, reason: 'cooldown', message: 'Ability on cooldown' };
      }

      const damage = rollDamage(14, 20);
      return {
        success: true,
        damage,
        heal: 4,
        mpCost,
        cooldownMs,
        effectType: 'cinder_burst',
      };
    } else {
      // Sage Slot 2: "Static Confusion"
      // Cost: 16 MP | Cooldown: 9000ms | Range: 4 tiles. Deals 4-8 arcane damage and applies status: { type: "confused", durationMs: 3000 } to target.
      const maxRange = 4;
      const mpCost = 16;
      const cooldownMs = 9000;

      // 2. Chebyshev distance <= ability range
      if (dist > maxRange) {
        return { success: false, reason: 'out_of_range', message: `Target out of reach (max ${maxRange} tiles)` };
      }
      // 3. player.mp >= ability.manaCost
      if (playerStats.mp < mpCost) {
        return { success: false, reason: 'no_mana', message: 'Not enough MP' };
      }
      // 4. currentTime >= abilityReadyAt
      if (now < cooldownUntil) {
        return { success: false, reason: 'cooldown', message: 'Ability on cooldown' };
      }

      const damage = rollDamage(4, 8);
      return {
        success: true,
        damage,
        mpCost,
        cooldownMs,
        statusEffect: { type: 'confused', durationMs: 3000 },
        effectType: 'aether_beam',
      };
    }
  }

  return { success: false, reason: 'unknown', message: 'Ability not ready' };
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
    const minDmg = playerStats.baseMinDamage ?? 6;
    const maxDmg = playerStats.baseMaxDamage ?? 10;
    const damage = rollDamage(minDmg, maxDmg);
    return {
      shouldAttack: true,
      damage,
      mpCost: 1,
      effectType: 'aether_beam',
    };
  } else {
    // Avenger auto-attack
    const minDmg = playerStats.baseMinDamage ?? 8;
    const maxDmg = playerStats.baseMaxDamage ?? 12;
    const damage = rollDamage(minDmg, maxDmg);
    return {
      shouldAttack: true,
      damage,
      mpCost: 0,
      effectType: 'whip_lash',
    };
  }
}
