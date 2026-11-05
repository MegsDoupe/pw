import {
  CharacterClass,
  ElementSchool,
  EntityResistances,
  MagicOrigin,
  Monster,
  PlayerStats,
  TileId,
  WeaponFamily,
} from '../types/game';
import { isWalkable } from './map';
import { getTileDistance, getEuclideanDistanceSq } from './monsters';
import { getSpellSkillBonus, getWeaponSkillDamageBonus } from './leveling';

export interface AbilityExecutionResult {
  success: boolean;
  reason?: 'cooldown' | 'no_target' | 'out_of_range' | 'no_mana' | 'unknown';
  message?: string;
  damage?: number;
  heal?: number;
  mpCost?: number;
  cooldownMs?: number;
  origin?: MagicOrigin;
  element?: ElementSchool;
  weaponFamily?: WeaponFamily;
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
 * Phase 6 Accuracy / Evasion Check:
 * Hit Chance Formula:
 * hitChance = Math.min(0.95, Math.max(0.40, 0.75 + (attackerSkill * 0.01) - (defenderDefenseSkill * 0.01)))
 */
export function calculateHitChance(attackerSkill: number, defenderDefenseSkill: number): number {
  return Math.min(0.95, Math.max(0.40, 0.75 + (attackerSkill * 0.01) - (defenderDefenseSkill * 0.01)));
}

export interface PhysicalAttackResult {
  outcome: 'hit' | 'miss' | 'blocked';
  rawDamage: number;
  hitChance: number;
  rolledMiss: boolean;
  blockedAmount: number;
  defenseBroken: boolean;
  remainingDamage: number;
  armorSoaked: number;
  finalDamage: number;
}

export interface PhysicalAttackParams {
  attackerSkill: number;
  defenderDefenseSkill: number;
  defenderArmor: number;
  rawDamage: number;
  defenderBlockState?: { blocksThisRound?: number; blockRoundStartTime?: number };
  now?: number;
  forcedRoll?: number; // for deterministic testing
  forcedBlockRoll?: number; // for deterministic testing (0 to 1)
}

/**
 * Phase 6 Physical Attack Resolution Pipeline:
 * 1. Accuracy / Evasion Check:
 *    hitChance = Math.min(0.95, Math.max(0.40, 0.75 + (attackerSkill * 0.01) - (defenderDefenseSkill * 0.01)))
 *    If roll > hitChance, MISS! (Deal 0 dmg, end immediately)
 * 2. 2-Hit Shield Block Limit (Tibia-Style rolling 1000ms combat timer):
 *    If blocksThisRound < 2:
 *      blockedAmount = Math.floor(Math.random() * (defenderDefenseSkill * 0.8 + 2))
 *      If remainingDamage <= 0: BLOCKED! (Deal 0 dmg, halt)
 *    If blocksThisRound >= 2: "defense broken", subsequent hits bypass block check
 * 3. Armor Soak:
 *    finalDamage = Math.max(1, remainingDamage - defenderArmor)
 */
export function resolvePhysicalAttack(params: PhysicalAttackParams): PhysicalAttackResult {
  const {
    attackerSkill,
    defenderDefenseSkill,
    defenderArmor,
    rawDamage,
    defenderBlockState,
    now = 0,
    forcedRoll,
    forcedBlockRoll,
  } = params;

  // 1. Accuracy / Evasion Check
  const hitChance = calculateHitChance(attackerSkill, defenderDefenseSkill);
  const roll = forcedRoll !== undefined ? forcedRoll : Math.random();
  if (roll > hitChance) {
    return {
      outcome: 'miss',
      rawDamage,
      hitChance,
      rolledMiss: true,
      blockedAmount: 0,
      defenseBroken: false,
      remainingDamage: 0,
      armorSoaked: 0,
      finalDamage: 0,
    };
  }

  // 2. The 2-Hit Shield Block Limit
  let blockedAmount = 0;
  let defenseBroken = false;
  let remainingDamage = rawDamage;

  if (defenderBlockState) {
    if (!defenderBlockState.blockRoundStartTime || now - defenderBlockState.blockRoundStartTime >= 1000) {
      defenderBlockState.blocksThisRound = 0;
      defenderBlockState.blockRoundStartTime = now;
    }

    if ((defenderBlockState.blocksThisRound ?? 0) < 2) {
      const maxBlock = defenderDefenseSkill * 0.8 + 2;
      blockedAmount =
        forcedBlockRoll !== undefined
          ? Math.floor(forcedBlockRoll * maxBlock)
          : Math.floor(Math.random() * maxBlock);
      defenderBlockState.blocksThisRound = (defenderBlockState.blocksThisRound ?? 0) + 1;
      remainingDamage = Math.max(0, rawDamage - blockedAmount);

      if (remainingDamage <= 0) {
        return {
          outcome: 'blocked',
          rawDamage,
          hitChance,
          rolledMiss: false,
          blockedAmount,
          defenseBroken: false,
          remainingDamage: 0,
          armorSoaked: 0,
          finalDamage: 0,
        };
      }
    } else {
      defenseBroken = true;
    }
  }

  // 3. Flat Armor Soak
  const armor = Math.max(0, defenderArmor);
  const finalDamage = Math.max(1, remainingDamage - armor);
  const armorSoaked = remainingDamage - finalDamage;

  return {
    outcome: 'hit',
    rawDamage,
    hitChance,
    rolledMiss: false,
    blockedAmount,
    defenseBroken,
    remainingDamage,
    armorSoaked,
    finalDamage,
  };
}

export interface SpellAttackResult {
  rawDamage: number;
  origin?: MagicOrigin;
  element?: ElementSchool;
  originResistance: number;
  elementResistance: number;
  totalMultiplier: number;
  resistedAmount: number;
  vulnerabilityBonus: number;
  finalDamage: number;
}

/**
 * Phase 6 Dual-Axis Spell Resolution Engine:
 * Spells bypass physical accuracy, shield blocks, and flat armor.
 * Instead, they evaluate defender's resistance profile across Origin and Element:
 *   origins: { radiant, arcane, eldritch, wild }
 *   elements: { air, fire, water, earth }
 * Formula:
 *   originMult = 1 - originResistance
 *   elementMult = 1 - elementResistance
 *   finalDamage = Math.max(1, Math.round(rawDamage * originMult * elementMult)) (or 0 if totally immune)
 */
export function resolveSpellAttack(params: {
  rawDamage: number;
  origin?: MagicOrigin;
  element?: ElementSchool;
  defenderResistances?: EntityResistances;
}): SpellAttackResult {
  const { rawDamage, origin, element, defenderResistances } = params;
  const rawOriginRes = origin && defenderResistances?.origins ? (defenderResistances.origins[origin] ?? 0) : 0;
  const rawElementRes = element && defenderResistances?.elements ? (defenderResistances.elements[element] ?? 0) : 0;

  // Support decimals (0.25) or percentages (25)
  const normOrigin = Math.abs(rawOriginRes) > 1 ? rawOriginRes / 100 : rawOriginRes;
  const normElement = Math.abs(rawElementRes) > 1 ? rawElementRes / 100 : rawElementRes;

  const originMult = Math.max(0, 1 - normOrigin);
  const elementMult = Math.max(0, 1 - normElement);
  const totalMult = originMult * elementMult;

  if (totalMult <= 0.0001) {
    return {
      rawDamage,
      origin,
      element,
      originResistance: normOrigin,
      elementResistance: normElement,
      totalMultiplier: 0,
      resistedAmount: rawDamage,
      vulnerabilityBonus: 0,
      finalDamage: 0,
    };
  }

  const modifiedDamage = rawDamage * totalMult;
  const finalDamage = Math.max(1, Math.round(modifiedDamage));
  const diff = rawDamage - finalDamage;

  return {
    rawDamage,
    origin,
    element,
    originResistance: normOrigin,
    elementResistance: normElement,
    totalMultiplier: totalMult,
    resistedAmount: diff > 0 ? diff : 0,
    vulnerabilityBonus: diff < 0 ? -diff : 0,
    finalDamage,
  };
}

/**
 * Calculates final damage dealt to a monster, supporting both legacy simple armor checks
 * and full Phase 6 physical / spell resolution.
 */
export function calculateDamageAgainstMonster(
  rawDamage: number,
  isPhysical: boolean,
  monster: Monster,
  options?: {
    origin?: MagicOrigin;
    element?: ElementSchool;
    attackerSkill?: number;
    now?: number;
    forcedRoll?: number;
    forcedBlockRoll?: number;
  }
): {
  finalDamage: number;
  reducedByArmor: number;
  outcome?: 'hit' | 'miss' | 'blocked';
  blockedAmount?: number;
  defenseBroken?: boolean;
  resistedAmount?: number;
  vulnerabilityBonus?: number;
} {
  if (options) {
    if (isPhysical) {
      const res = resolvePhysicalAttack({
        attackerSkill: options.attackerSkill ?? 10,
        defenderDefenseSkill: monster.defenseSkill ?? 10,
        defenderArmor: monster.armor ?? monster.armorReduction ?? 0,
        rawDamage,
        defenderBlockState: monster,
        now: options.now ?? 0,
        forcedRoll: options.forcedRoll,
        forcedBlockRoll: options.forcedBlockRoll,
      });
      return {
        finalDamage: res.finalDamage,
        reducedByArmor: res.armorSoaked,
        outcome: res.outcome,
        blockedAmount: res.blockedAmount,
        defenseBroken: res.defenseBroken,
      };
    } else {
      const spellRes = resolveSpellAttack({
        rawDamage,
        origin: options.origin,
        element: options.element,
        defenderResistances: monster.resistances,
      });
      return {
        finalDamage: spellRes.finalDamage,
        reducedByArmor: 0,
        outcome: 'hit',
        resistedAmount: spellRes.resistedAmount,
        vulnerabilityBonus: spellRes.vulnerabilityBonus,
      };
    }
  }

  // Legacy fallback: preserves Clockwork Drone flat armor reduction & tests
  const armor = monster.armor ?? monster.armorReduction ?? 0;
  if (isPhysical && armor > 0) {
    const finalDamage = Math.max(1, rawDamage - armor);
    const reducedByArmor = rawDamage - finalDamage;
    return { finalDamage, reducedByArmor, outcome: 'hit' };
  }
  return { finalDamage: rawDamage, reducedByArmor: 0, outcome: 'hit' };
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

      const skillBonus = getSpellSkillBonus(playerStats, 'radiant', 'earth');
      const damage = rollDamage(6, 10) + skillBonus;
      return {
        success: true,
        damage,
        mpCost,
        cooldownMs,
        origin: 'radiant',
        element: 'earth',
        weaponFamily: 'flexible',
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

      const skillBonus = getSpellSkillBonus(playerStats, 'arcane', 'air');
      const damage = rollDamage(10, 14) + skillBonus;
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
        origin: 'arcane',
        element: 'air',
        weaponFamily: 'sidearms',
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

      const skillBonus = getSpellSkillBonus(playerStats, 'radiant', 'fire');
      const damage = rollDamage(14, 20) + skillBonus;
      const heal = 4 + skillBonus;
      return {
        success: true,
        damage,
        heal,
        mpCost,
        cooldownMs,
        origin: 'radiant',
        element: 'fire',
        weaponFamily: 'flexible',
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

      const skillBonus = getSpellSkillBonus(playerStats, 'arcane', 'air');
      const damage = rollDamage(4, 8) + skillBonus;
      return {
        success: true,
        damage,
        mpCost,
        cooldownMs,
        origin: 'arcane',
        element: 'air',
        weaponFamily: 'sidearms',
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
  weaponFamily?: WeaponFamily;
  effectType?: 'whip_lash' | 'aether_beam';
} {
  if (!target || !target.isAlive) {
    return { shouldAttack: false };
  }

  const isAvenger = playerStats.classType === 'Avenger';
  const dist = getTileDistance(playerGridX, playerGridY, target.gridX, target.gridY);
  const interval = playerStats.attackSpeedMs ?? (isAvenger ? 1400 : 1600);
  const reach = playerStats.attackReach ?? (isAvenger ? 2 : 4);
  const family = playerStats.activeWeaponFamily ?? (isAvenger ? 'flexible' : 'sidearms');
  const mpCost = playerStats.weaponMpCost !== undefined ? playerStats.weaponMpCost : (!isAvenger ? 1 : 0);

  if (now - lastAttackTime < interval) {
    return { shouldAttack: false };
  }

  if (dist > reach) {
    return { shouldAttack: false };
  }

  if (mpCost > 0 && playerStats.mp < mpCost) {
    return { shouldAttack: false };
  }

  const weaponBonus = getWeaponSkillDamageBonus(playerStats, family);
  const minDmg = playerStats.baseMinDamage ?? (isAvenger ? 8 : 6);
  const maxDmg = playerStats.baseMaxDamage ?? (isAvenger ? 12 : 10);
  const damage = rollDamage(minDmg, maxDmg) + weaponBonus;

  const effectType = family === 'sidearms' ? 'aether_beam' : 'whip_lash';

  return {
    shouldAttack: true,
    damage,
    mpCost,
    weaponFamily: family,
    effectType,
  };
}
