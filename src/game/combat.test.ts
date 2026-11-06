import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findNearestMonster,
  shouldBreakTargetLock,
  calculateKnockbackDestination,
  executeAbility,
  checkAutoAttack,
  calculateDamageAgainstMonster,
  calculateHitChance,
  resolvePhysicalAttack,
  resolveSpellAttack,
} from './combat';
import {
  getTileDistance,
  calculateMonsterStep,
  attemptStepSpawn,
  leashMonsters,
  MONSTER_ARCHETYPES,
} from './monsters';
import { Monster, PlayerStats, TileId } from '../types/game';
import { createInitialPlayerStats, recordWeaponHit } from './leveling';
import { addStackToPlayerInventory, equipItem, recalculatePlayerGearStats } from './items';

function createMockMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'test_rat',
    archetype: 'giant_rat',
    name: 'Giant Rat',
    gridX: 20,
    gridY: 22,
    targetX: 20,
    targetY: 22,
    renderX: 20 * 32,
    renderY: 22 * 32,
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
    facing: 'UP',
    ...overrides,
  };
}

test('getTileDistance calculates Chebyshev distance correctly', () => {
  assert.equal(getTileDistance(20, 20, 20, 20), 0);
  assert.equal(getTileDistance(20, 20, 22, 20), 2);
  assert.equal(getTileDistance(20, 20, 22, 22), 2, 'Diagonal is 2 tiles in Chebyshev');
  assert.equal(getTileDistance(20, 20, 20, 28), 8);
});

test('Target lock breaks at distance >= 8 or on monster death', () => {
  const aliveNear = createMockMonster({ gridX: 20, gridY: 25 }); // dist 5
  assert.equal(shouldBreakTargetLock(20, 20, aliveNear), false);

  const aliveFar = createMockMonster({ gridX: 20, gridY: 28 }); // dist 8
  assert.equal(shouldBreakTargetLock(20, 20, aliveFar), true);

  const deadNear = createMockMonster({ gridX: 20, gridY: 21, isAlive: false });
  assert.equal(shouldBreakTargetLock(20, 20, deadNear), true);
});

test('findNearestMonster selects closest living monster and supports Tab cycling', () => {
  const m1 = createMockMonster({ id: 'm1', gridX: 20, gridY: 23 }); // dist 3
  const m2 = createMockMonster({ id: 'm2', gridX: 20, gridY: 21 }); // dist 1 (nearest)
  const m3 = createMockMonster({ id: 'm3', gridX: 20, gridY: 25 }); // dist 5

  const nearest = findNearestMonster(20, 20, [m1, m2, m3]);
  assert.equal(nearest?.id, 'm2', 'm2 should be selected first');

  // Cycle to next
  const cycled = findNearestMonster(20, 20, [m1, m2, m3], 'm2');
  assert.equal(cycled?.id, 'm1', 'Next closest is m1');
});

test('calculateKnockbackDestination pushes target away, but stops at walls and obstacles', () => {
  // 3x3 map: center is (1, 1), wall at (1, 2)
  const map: TileId[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 4, 0], // stone wall at x=1, y=2
  ];

  // Attacker at (1, 0), Target at (1, 1). Knockback direction is downwards (0, +1) -> dest (1, 2)
  // But (1, 2) is a stone wall (tile 4), so knockback should be blocked!
  const blockedDest = calculateKnockbackDestination(1, 0, 1, 1, map, []);
  assert.equal(blockedDest.x, 1);
  assert.equal(blockedDest.y, 1);
  assert.equal(blockedDest.wasBlocked, true, 'Knockback blocked by wall');

  // Unobstructed: Attacker at (0, 1), Target at (1, 1). Push rightwards -> dest (2, 1)
  const clearMap: TileId[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const clearDest = calculateKnockbackDestination(0, 1, 1, 1, clearMap, []);
  assert.equal(clearDest.x, 2);
  assert.equal(clearDest.y, 1);
  assert.equal(clearDest.wasBlocked, false, 'Knockback moves target 1 tile away');
});

test('checkAutoAttack respects Avenger 2-tile reach and Sage 4-tile reach with MP cost', () => {
  const avengerStats = createInitialPlayerStats('Avenger');
  const sageStats = createInitialPlayerStats('Sage');

  const monster2Tiles = createMockMonster({ gridX: 20, gridY: 22 }); // dist 2
  const monster3Tiles = createMockMonster({ gridX: 20, gridY: 23 }); // dist 3

  // Avenger auto-attack
  const avengerAt2 = checkAutoAttack(avengerStats, 20, 20, monster2Tiles, 0, 2000);
  assert.equal(avengerAt2.shouldAttack, true);
  assert.equal(avengerAt2.mpCost, 0);

  const avengerAt3 = checkAutoAttack(avengerStats, 20, 20, monster3Tiles, 0, 2000);
  assert.equal(avengerAt3.shouldAttack, false, 'Avenger cannot auto-attack beyond 2 tiles');

  // Sage auto-attack
  const sageAt3 = checkAutoAttack(sageStats, 20, 20, monster3Tiles, 0, 2000);
  assert.equal(sageAt3.shouldAttack, true, 'Sage can auto-attack at 3 tiles');
  assert.equal(sageAt3.mpCost, 1);

  // Sage with 0 MP cannot auto-attack
  const sageNoMp = { ...sageStats, mp: 0 };
  const sageAt3NoMp = checkAutoAttack(sageNoMp, 20, 20, monster3Tiles, 0, 2000);
  assert.equal(sageAt3NoMp.shouldAttack, false, 'Sage without MP cannot auto-attack');
});

test('executeAbility validates Level 1 signature abilities for Avenger and Sage', () => {
  const avengerStats = createInitialPlayerStats('Avenger');
  const sageStats = createInitialPlayerStats('Sage');

  const map: TileId[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  const monsterNear = createMockMonster({ id: 'rat_near', gridX: 2, gridY: 2 }); // dist 2 from (0, 2)
  const monsterMid = createMockMonster({ id: 'rat_mid', gridX: 4, gridY: 2 }); // dist 4 from (0, 2)
  const monsterFar = createMockMonster({ id: 'rat_far', gridX: 6, gridY: 2 }); // dist 6 from (0, 2)

  // 1. Avenger Slot 1: Entangling Lash (Roots 2s, 8 MP, 6s CD, 2-tile reach, 6-10 base dmg + spell bonus)
  const lashNear = executeAbility(1, avengerStats, 0, 2, monsterNear, map, [monsterNear], 0, 1000);
  assert.equal(lashNear.success, true);
  assert.equal(lashNear.mpCost, 8);
  assert.equal(lashNear.cooldownMs, 6000);
  assert.ok(lashNear.damage! >= 22 && lashNear.damage! <= 26, 'Base 6-10 + 16 skill bonus = 22-26');
  assert.ok(lashNear.statusEffect?.type === 'rooted' || lashNear.statusEffect?.type === 'root');
  assert.equal(lashNear.statusEffect?.durationMs, 2000);

  const lashFar = executeAbility(1, avengerStats, 0, 2, monsterFar, map, [monsterFar], 0, 1000);
  assert.equal(lashFar.success, false, 'Beyond 2 tiles reach fails');
  assert.equal(lashFar.reason, 'out_of_range');

  // 2. Avenger Slot 2: Cinder Brand (14-20 fire dmg + 16 skill bonus, heals 4 HP + 16 bonus, 12 MP, 3.5s CD, 2-tile reach)
  const cinder = executeAbility(2, avengerStats, 0, 2, monsterNear, map, [monsterNear], 0, 1000);
  assert.equal(cinder.success, true);
  assert.equal(cinder.heal, 20, '4 base + 16 skill bonus = 20 heal');
  assert.equal(cinder.mpCost, 12);
  assert.equal(cinder.cooldownMs, 3500);
  assert.ok(cinder.damage! >= 30 && cinder.damage! <= 36, 'Base 14-20 + 16 skill bonus = 30-36');

  // 3. Sage Slot 1: Aether Gale Shot (10-14 air dmg + 16 skill bonus, knocks 1 tile away, 10 MP, 2.5s CD, 4-tile reach)
  const gale = executeAbility(1, sageStats, 0, 2, monsterMid, map, [monsterMid], 0, 1000);
  assert.equal(gale.success, true);
  assert.equal(gale.mpCost, 10);
  assert.equal(gale.cooldownMs, 2500);
  assert.ok(gale.damage! >= 26 && gale.damage! <= 30, 'Base 10-14 + 16 skill bonus = 26-30');
  assert.ok(gale.knockbackDest);
  assert.equal(gale.knockbackDest?.x, 5, 'Pushes right from x=4 away from player at x=0');

  // 4. Sage Slot 2: Static Confusion (Scrambles pathfinding for 3s, 16 MP, 9s CD, 4-tile reach, 4-8 arcane dmg + 16 skill bonus)
  const confuse = executeAbility(2, sageStats, 0, 2, monsterMid, map, [monsterMid], 0, 1000);
  assert.equal(confuse.success, true);
  assert.equal(confuse.mpCost, 16);
  assert.equal(confuse.cooldownMs, 9000);
  assert.ok(confuse.damage! >= 20 && confuse.damage! <= 24, 'Base 4-8 + 16 skill bonus = 20-24');
  assert.ok(confuse.statusEffect?.type === 'confused' || confuse.statusEffect?.type === 'confuse');
  assert.equal(confuse.statusEffect?.durationMs, 3000);

  // 5. Cooldown check: Should reject when now < cooldownUntil
  const cdReject = executeAbility(1, avengerStats, 0, 2, monsterNear, map, [monsterNear], 5000, 2000);
  assert.equal(cdReject.success, false);
  assert.equal(cdReject.reason, 'cooldown');

  // 6. MP check: Should reject when MP < cost
  const lowMpStats = { ...avengerStats, mp: 2 };
  const mpReject = executeAbility(1, lowMpStats, 0, 2, monsterNear, map, [monsterNear], 0, 1000);
  assert.equal(mpReject.success, false);
  assert.equal(mpReject.reason, 'no_mana');

  // 7. No target check: Should reject when target is null
  const noTarget = executeAbility(1, avengerStats, 0, 2, null, map, [], 0, 1000);
  assert.equal(noTarget.success, false);
  assert.equal(noTarget.reason, 'no_target');
});

test('calculateMonsterStep respects Root status, Confusion, and aggro radius', () => {
  const map: TileId[][] = Array.from({ length: 40 }, () => Array(40).fill(0));

  // Monster within 3 tiles of player (20, 20)
  const rat = createMockMonster({ gridX: 20, gridY: 23 }); // dist 3
  const step = calculateMonsterStep(rat, 20, 20, map, [rat], 1000);
  assert.notEqual(step, null, 'Rat should chase player');
  assert.equal(step?.dy, -1, 'Rat should move up toward player');

  // Rooted monster cannot step (using rootedUntil)
  const rootedRat = createMockMonster({
    gridX: 20,
    gridY: 23,
    statusEffects: { rootedUntil: 5000 },
  });
  const rootedStep = calculateMonsterStep(rootedRat, 20, 20, map, [rootedRat], 1000);
  assert.equal(rootedStep, null, 'Rooted rat cannot move');

  // Rooted monster cannot step (using rootedRemainingMs)
  const rootedRatMs = createMockMonster({
    gridX: 20,
    gridY: 23,
    statusEffects: { rootedRemainingMs: 1500 },
  });
  const rootedStepMs = calculateMonsterStep(rootedRatMs, 20, 20, map, [rootedRatMs], 1000);
  assert.equal(rootedStepMs, null, 'Rooted rat with remaining ms cannot move');

  // Confused monster moves to an adjacent walkable tile instead of standard pathfinding
  const confusedRat = createMockMonster({
    gridX: 20,
    gridY: 23,
    statusEffects: { confusedUntil: 5000 },
  });
  const confusedStep = calculateMonsterStep(confusedRat, 20, 20, map, [confusedRat], 1000);
  assert.notEqual(confusedStep, null, 'Confused rat can wander');
  assert.ok(Math.abs(confusedStep!.dx) <= 1 && Math.abs(confusedStep!.dy) <= 1);
});

test('calculateDamageAgainstMonster handles Clockwork Drone physical armor reduction and full magic damage', () => {
  const drone = createMockMonster({
    id: 'drone_1',
    archetype: 'clockwork_drone',
    armorReduction: 2,
  });

  const rat = createMockMonster({
    id: 'rat_1',
    archetype: 'giant_rat',
  });

  // Physical attack against armored construct: reduced by flat 2
  const physDmg = calculateDamageAgainstMonster(10, true, drone);
  assert.equal(physDmg.finalDamage, 8);
  assert.equal(physDmg.reducedByArmor, 2);

  // Minimum 1 damage clamp on heavy reduction
  const weakPhysDmg = calculateDamageAgainstMonster(2, true, drone);
  assert.equal(weakPhysDmg.finalDamage, 1);
  assert.equal(weakPhysDmg.reducedByArmor, 1);

  // Magic/Spell attack (Air, Arcane, Fire) against drone: 100% full damage
  const magicDmg = calculateDamageAgainstMonster(10, false, drone);
  assert.equal(magicDmg.finalDamage, 10);
  assert.equal(magicDmg.reducedByArmor, 0);

  // Attack against unarmored rat: takes full damage
  const ratDmg = calculateDamageAgainstMonster(8, true, rat);
  assert.equal(ratDmg.finalDamage, 8);
  assert.equal(ratDmg.reducedByArmor, 0);
});

test('Spore Spitter kites player at <= 2 tiles, holds at 3 tiles, and approaches from 4+ tiles', () => {
  const map: TileId[][] = Array.from({ length: 40 }, () => Array(40).fill(0));
  
  // 1. Player at (20, 20), Spore Spitter at (20, 22) -> dist is 2 (too close!)
  const closeSpitter = createMockMonster({
    id: 'spitter_close',
    archetype: 'spore_spitter',
    gridX: 20,
    gridY: 22,
  });
  const kiteStep = calculateMonsterStep(closeSpitter, 20, 20, map, [closeSpitter], 1000);
  assert.notEqual(kiteStep, null, 'Spore Spitter should step away');
  assert.equal(kiteStep?.dy, 1, 'Spore Spitter should step south (away from player at y=20)');

  // 2. Player at (20, 20), Spore Spitter at (20, 23) -> dist is 3 (optimal artillery range!)
  const optimalSpitter = createMockMonster({
    id: 'spitter_opt',
    archetype: 'spore_spitter',
    gridX: 20,
    gridY: 23,
  });
  const holdStep = calculateMonsterStep(optimalSpitter, 20, 20, map, [optimalSpitter], 1000);
  assert.equal(holdStep, null, 'Spore Spitter holds position at 3-tile reach to fire spores');

  // 3. Player at (20, 20), Spore Spitter at (20, 25) -> dist is 5 (approaches to reach dist 3)
  const farSpitter = createMockMonster({
    id: 'spitter_far',
    archetype: 'spore_spitter',
    gridX: 20,
    gridY: 25,
  });
  const approachStep = calculateMonsterStep(farSpitter, 20, 20, map, [farSpitter], 1000);
  assert.notEqual(approachStep, null, 'Spore Spitter should approach player');
  assert.equal(approachStep?.dy, -1, 'Spore Spitter moves north toward player');
});

test('attemptStepSpawn enforces density checks, global cap, and leashes distant monsters', () => {
  const map: TileId[][] = Array.from({ length: 40 }, () => Array(40).fill(0));

  // 1. Density Check: >= 4 monsters within 8 tiles prevents spawn
  const denseMonsters = [
    createMockMonster({ id: 'm1', gridX: 21, gridY: 20 }),
    createMockMonster({ id: 'm2', gridX: 19, gridY: 20 }),
    createMockMonster({ id: 'm3', gridX: 20, gridY: 21 }),
    createMockMonster({ id: 'm4', gridX: 20, gridY: 19 }),
  ];
  const denseSpawn = attemptStepSpawn(20, 20, 1, map, denseMonsters, 1000);
  assert.equal(denseSpawn, null, 'Local density check aborts spawn when >= 4 nearby');

  // 2. Global Cap Check: >= 15 alive monsters prevents spawn
  const cappedMonsters: Monster[] = [];
  for (let i = 0; i < 15; i++) {
    cappedMonsters.push(createMockMonster({ id: `cap_${i}`, gridX: 1 + i, gridY: 1 }));
  }
  const cappedSpawn = attemptStepSpawn(20, 20, 1, map, cappedMonsters, 1000);
  assert.equal(cappedSpawn, null, 'Global cap aborts spawn when >= 15 alive');

  // 3. Valid Spawn in ring 4-6 tiles away
  const openSpawn = attemptStepSpawn(20, 20, 1, map, [], 1000);
  assert.notEqual(openSpawn, null);
  assert.ok(openSpawn);
  const spawnDist = getTileDistance(20, 20, openSpawn.spawnX, openSpawn.spawnY);
  assert.ok(spawnDist >= 4 && spawnDist <= 6, `Spawned in 4-6 tile ring: dist=${spawnDist}`);
  assert.equal(openSpawn.monster.spawnStartupUntil, 1500, 'Has 500ms startup delay');

  // 4. Monster Leashing: despawns at > 14 tiles distance unless locked target
  const nearMob = createMockMonster({ id: 'near', gridX: 20, gridY: 28 }); // dist 8
  const farMob = createMockMonster({ id: 'far', gridX: 20, gridY: 36 }); // dist 16 (> 14)
  const farTargetedMob = createMockMonster({ id: 'far_target', gridX: 20, gridY: 36 }); // dist 16, but targeted

  const leashed = leashMonsters([nearMob, farMob, farTargetedMob], 20, 20, 'far_target');
  assert.equal(leashed.some((m: Monster) => m.id === 'near'), true, 'Keeps near monster');
  assert.equal(leashed.some((m: Monster) => m.id === 'far'), false, 'Despawns far monster > 14 tiles');
  assert.equal(leashed.some((m: Monster) => m.id === 'far_target'), true, 'Keeps locked target even if > 14 tiles');
});

test('calculateHitChance accurately implements 40%-95% bounded accuracy formula', () => {
  // Baseline (10 vs 10): 0.75 + 0.10 - 0.10 = 0.75 (75%)
  assert.equal(calculateHitChance(10, 10), 0.75);

  // Attacker advantage (25 vs 10): 0.75 + 0.25 - 0.10 = 0.90 (90%)
  assert.equal(calculateHitChance(25, 10), 0.90);

  // Defender advantage (10 vs 25): 0.75 + 0.10 - 0.25 = 0.60 (60%)
  assert.equal(calculateHitChance(10, 25), 0.60);

  // Maximum cap clamp: 0.95 (always at least 5% miss chance)
  assert.equal(calculateHitChance(50, 10), 0.95);
  assert.equal(calculateHitChance(100, 10), 0.95);

  // Minimum floor clamp: 0.40 (always at least 40% hit chance)
  assert.equal(calculateHitChance(10, 60), 0.40);
  assert.equal(calculateHitChance(10, 100), 0.40);
});

test('resolvePhysicalAttack handles Miss, 2-Hit Shield Block, Defense Break, and Armor Soak', () => {
  const blockState = { blocksThisRound: 0, blockRoundStartTime: 1000 };

  // 1. Accuracy check: Roll > hitChance causes a complete MISS
  // Hit chance for 10 vs 10 is 0.75. Roll 0.80 should miss!
  const missResult = resolvePhysicalAttack({
    attackerSkill: 10,
    defenderDefenseSkill: 10,
    defenderArmor: 2,
    rawDamage: 12,
    defenderBlockState: blockState,
    now: 1100,
    forcedRoll: 0.80, // Miss
  });
  assert.equal(missResult.outcome, 'miss');
  assert.equal(missResult.finalDamage, 0);
  assert.equal(missResult.rolledMiss, true);
  assert.equal(missResult.blockedAmount, 0);
  assert.equal(blockState.blocksThisRound, 0, 'Miss does not consume a shield block');

  // 2. Shield Block (Hit 1 in window): Full block absorbs all damage
  // Max block for defense 10 is 10 * 0.8 + 2 = 10. Roll 0.9 gives floor(0.9 * 10) = 9 blocked.
  // Raw damage 8 - 9 = -1 -> absorbed!
  const blockResult = resolvePhysicalAttack({
    attackerSkill: 10,
    defenderDefenseSkill: 10,
    defenderArmor: 2,
    rawDamage: 8,
    defenderBlockState: blockState,
    now: 1200,
    forcedRoll: 0.50, // Hits
    forcedBlockRoll: 0.9, // Blocks 9 dmg
  });
  assert.equal(blockResult.outcome, 'blocked');
  assert.equal(blockResult.finalDamage, 0);
  assert.equal(blockResult.blockedAmount, 9);
  assert.equal(blockState.blocksThisRound, 1, 'First block consumed');

  // 3. Shield Block (Hit 2 in window): Partial block + Flat Armor soak
  // Raw damage 15. Max block is 10, roll 0.6 -> blockedAmount = 6.
  // Remaining = 15 - 6 = 9. Defender armor = 2 -> finalDamage = 9 - 2 = 7.
  const partialBlockResult = resolvePhysicalAttack({
    attackerSkill: 10,
    defenderDefenseSkill: 10,
    defenderArmor: 2,
    rawDamage: 15,
    defenderBlockState: blockState,
    now: 1300,
    forcedRoll: 0.50, // Hits
    forcedBlockRoll: 0.6, // Blocks 6 dmg
  });
  assert.equal(partialBlockResult.outcome, 'hit');
  assert.equal(partialBlockResult.blockedAmount, 6);
  assert.equal(partialBlockResult.armorSoaked, 2);
  assert.equal(partialBlockResult.finalDamage, 7);
  assert.equal(blockState.blocksThisRound, 2, 'Second block consumed');

  // 4. Defense Break (Hit 3 in same 1-second window): Bypasses shield block entirely
  // Raw damage 12. Block check bypassed! Armor 2 soaks -> finalDamage = 10.
  const brokenResult = resolvePhysicalAttack({
    attackerSkill: 10,
    defenderDefenseSkill: 10,
    defenderArmor: 2,
    rawDamage: 12,
    defenderBlockState: blockState,
    now: 1400, // within 1000ms from 1000
    forcedRoll: 0.50, // Hits
  });
  assert.equal(brokenResult.outcome, 'hit');
  assert.equal(brokenResult.defenseBroken, true, 'Subsequent hits bypass shield');
  assert.equal(brokenResult.blockedAmount, 0, 'No shield block applied when broken');
  assert.equal(brokenResult.armorSoaked, 2);
  assert.equal(brokenResult.finalDamage, 10);

  // 5. 1000ms Rolling Timer Reset: After 1.0s, blocks reset to 0
  const resetResult = resolvePhysicalAttack({
    attackerSkill: 10,
    defenderDefenseSkill: 10,
    defenderArmor: 2,
    rawDamage: 8,
    defenderBlockState: blockState,
    now: 2500, // > 1000ms later
    forcedRoll: 0.50,
    forcedBlockRoll: 0.9,
  });
  assert.equal(blockState.blocksThisRound, 1, 'Blocks reset on new 1s window');
  assert.equal(resetResult.outcome, 'blocked');
});

test('resolveSpellAttack evaluates dual-axis Origin and Element resistances correctly', () => {
  // 1. Clockwork Drone: Resistant to earth (+30%), takes 100% full damage from Arcane and Air
  const droneResistances = {
    origins: { radiant: 0.2, arcane: 0, eldritch: 0.3, wild: 0.2 },
    elements: { air: 0, fire: 0.2, water: -0.2, earth: 0.3 },
  };

  // Arcane + Air spell (Sage Aether Gale) deals 100% full damage
  const arcaneAir = resolveSpellAttack({
    rawDamage: 20,
    origin: 'arcane',
    element: 'air',
    defenderResistances: droneResistances,
  });
  assert.equal(arcaneAir.totalMultiplier, 1.0);
  assert.equal(arcaneAir.finalDamage, 20, 'Takes 100% full damage from Arcane and Air');
  assert.equal(arcaneAir.resistedAmount, 0);

  // Earth spell against Drone: 0.7x element multiplier
  const earthSpell = resolveSpellAttack({
    rawDamage: 20,
    origin: 'radiant', // 0.2 res (0.8x)
    element: 'earth', // 0.3 res (0.7x)
    defenderResistances: droneResistances,
  });
  // 20 * 0.8 * 0.7 = 20 * 0.56 = 11.2 -> 11
  assert.equal(earthSpell.finalDamage, 11);
  assert.equal(earthSpell.resistedAmount, 9);

  // 2. Bramble Hound: Vulnerable to Fire (-25% resistance / 25% vulnerability)
  const houndResistances = {
    origins: { radiant: 0, arcane: 0, eldritch: 0.1, wild: 0.2 },
    elements: { air: 0, fire: -0.25, water: 0, earth: 0.25 },
  };

  const fireSpell = resolveSpellAttack({
    rawDamage: 20,
    origin: 'radiant',
    element: 'fire',
    defenderResistances: houndResistances,
  });
  // 20 * (1 - 0) * (1 - (-0.25)) = 20 * 1.25 = 25
  assert.equal(fireSpell.finalDamage, 25);
  assert.equal(fireSpell.vulnerabilityBonus, 5, 'Fire vulnerability grants bonus damage');

  // 3. Spore Spitter: Resists Earth (+35%) and Wild (+20%), weak to Fire (-30%)
  const sporeResistances = {
    origins: { radiant: -0.2, arcane: 0, eldritch: 0.2, wild: 0.2 },
    elements: { air: 0, fire: -0.3, water: 0.1, earth: 0.35 },
  };

  const holyFire = resolveSpellAttack({
    rawDamage: 20,
    origin: 'radiant', // -0.2 -> 1.2x
    element: 'fire', // -0.3 -> 1.3x
    defenderResistances: sporeResistances,
  });
  // 20 * 1.2 * 1.3 = 20 * 1.56 = 31.2 -> 31
  assert.equal(holyFire.finalDamage, 31);
  assert.equal(holyFire.vulnerabilityBonus, 11);

  // 4. Immunity check: 100% resistance deals 0 damage
  const immuneTarget = {
    origins: { radiant: 1.0, arcane: 0, eldritch: 0, wild: 0 },
    elements: { air: 0, fire: 0, water: 0, earth: 0 },
  };
  const immuneHit = resolveSpellAttack({
    rawDamage: 30,
    origin: 'radiant',
    element: 'fire',
    defenderResistances: immuneTarget,
  });
  assert.equal(immuneHit.finalDamage, 0);
  assert.equal(immuneHit.totalMultiplier, 0);
});

test('Equipping sword changes weapon family to Blades and invokes/trains Blades skill rather than Flexible', () => {
  // 1. Avenger starts with Braided Cord Whip (flexible family)
  const avenger = createInitialPlayerStats('Avenger');
  assert.equal(avenger.activeWeaponFamily, 'flexible');
  assert.equal(avenger.attackReach, 2);

  const ratNear = createMockMonster({ gridX: 20, gridY: 21 }); // 1 tile away

  // Check auto-attack with whip
  const whipAttack = checkAutoAttack(avenger, 20, 20, ratNear, 0, 2000);
  assert.equal(whipAttack.shouldAttack, true);
  assert.equal(whipAttack.weaponFamily, 'flexible');
  assert.equal(whipAttack.effectType, 'whip_lash');
  assert.equal(whipAttack.damageType, 'physical');

  // 2. Put a Rusty Iron Shortsword into inventory and equip it
  addStackToPlayerInventory(avenger, { itemId: 'rusty_iron_shortsword', quantity: 1 });
  const swordSlot = avenger.inventory!.findIndex((s) => s?.itemId === 'rusty_iron_shortsword');
  assert.ok(swordSlot >= 0);

  const equipped = equipItem(avenger, swordSlot);
  assert.equal(equipped, true);

  // Stats must reflect Blades family
  assert.equal(avenger.activeWeaponFamily, 'blades');
  assert.equal(avenger.attackReach, 1);
  assert.equal(avenger.attackSpeedMs, 1200);
  assert.equal(avenger.weaponDamageType, 'physical');

  // 3. Auto-attack with shortsword now invokes Blades
  const swordAttack = checkAutoAttack(avenger, 20, 20, ratNear, 0, 2000);
  assert.equal(swordAttack.shouldAttack, true);
  assert.equal(swordAttack.weaponFamily, 'blades');
  assert.equal(swordAttack.effectType, 'sword_slash');
  assert.equal(swordAttack.damageType, 'physical');

  // Invoked skill accuracy uses Blades skill level
  const bladesLevel = avenger.skills.weapons.blades.level;
  const hitChance = calculateHitChance(bladesLevel, ratNear.defenseSkill ?? 10);
  assert.ok(hitChance >= 0.40 && hitChance <= 0.95);

  // 4. Training: Hitting with equipped sword advances Blades skill, not Flexible
  const initialBladesHits = avenger.skills.weapons.blades.hits;
  const initialFlexibleHits = avenger.skills.weapons.flexible.hits;

  // Record weapon hit for active weapon family ('blades')
  recordWeaponHit(avenger, avenger.activeWeaponFamily, false);

  assert.equal(
    avenger.skills.weapons.blades.hits,
    initialBladesHits + 1,
    'Blades hits should increment'
  );
  assert.equal(
    avenger.skills.weapons.flexible.hits,
    initialFlexibleHits,
    'Flexible hits must NOT increment when wielding a sword'
  );

  // 5. Test Sage equipping sword: also invokes and trains Blades
  const sage = createInitialPlayerStats('Sage');
  assert.equal(sage.activeWeaponFamily, 'sidearms');

  addStackToPlayerInventory(sage, { itemId: 'rusty_iron_shortsword', quantity: 1 });
  const sageSwordSlot = sage.inventory!.findIndex((s) => s?.itemId === 'rusty_iron_shortsword');
  equipItem(sage, sageSwordSlot);

  assert.equal(sage.activeWeaponFamily, 'blades');
  assert.equal(sage.attackReach, 1);
  assert.equal(sage.weaponMpCost, 0);

  const sageSwordAttack = checkAutoAttack(sage, 20, 20, ratNear, 0, 2000);
  assert.equal(sageSwordAttack.shouldAttack, true);
  assert.equal(sageSwordAttack.weaponFamily, 'blades');
  assert.equal(sageSwordAttack.effectType, 'sword_slash');
  assert.equal(sageSwordAttack.mpCost, 0);

  const initialSageBladesHits = sage.skills.weapons.blades.hits;
  const initialSageSidearmsHits = sage.skills.weapons.sidearms.hits;

  recordWeaponHit(sage, sage.activeWeaponFamily, false);

  assert.equal(sage.skills.weapons.blades.hits, initialSageBladesHits + 1);
  assert.equal(sage.skills.weapons.sidearms.hits, initialSageSidearmsHits);
});
