import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findNearestMonster,
  shouldBreakTargetLock,
  calculateKnockbackDestination,
  executeAbility,
  checkAutoAttack,
} from './combat';
import { getTileDistance, calculateMonsterStep } from './monsters';
import { Monster, PlayerStats, TileId } from '../types/game';
import { createInitialPlayerStats } from './leveling';

function createMockMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'test_rat',
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

  // 1. Avenger Slot 1: Entangling Lash (Roots 2s, 8 MP, 6s CD, 2-tile reach, 6-10 dmg)
  const lashNear = executeAbility(1, avengerStats, 0, 2, monsterNear, map, [monsterNear], 0, 1000);
  assert.equal(lashNear.success, true);
  assert.equal(lashNear.mpCost, 8);
  assert.equal(lashNear.cooldownMs, 6000);
  assert.ok(lashNear.damage! >= 6 && lashNear.damage! <= 10);
  assert.ok(lashNear.statusEffect?.type === 'rooted' || lashNear.statusEffect?.type === 'root');
  assert.equal(lashNear.statusEffect?.durationMs, 2000);

  const lashFar = executeAbility(1, avengerStats, 0, 2, monsterFar, map, [monsterFar], 0, 1000);
  assert.equal(lashFar.success, false, 'Beyond 2 tiles reach fails');
  assert.equal(lashFar.reason, 'out_of_range');

  // 2. Avenger Slot 2: Cinder Brand (14-20 fire dmg, heals 4 HP, 12 MP, 3.5s CD, 2-tile reach)
  const cinder = executeAbility(2, avengerStats, 0, 2, monsterNear, map, [monsterNear], 0, 1000);
  assert.equal(cinder.success, true);
  assert.equal(cinder.heal, 4);
  assert.equal(cinder.mpCost, 12);
  assert.equal(cinder.cooldownMs, 3500);
  assert.ok(cinder.damage! >= 14 && cinder.damage! <= 20);

  // 3. Sage Slot 1: Aether Gale Shot (10-14 air dmg, knocks 1 tile away, 10 MP, 2.5s CD, 4-tile reach)
  const gale = executeAbility(1, sageStats, 0, 2, monsterMid, map, [monsterMid], 0, 1000);
  assert.equal(gale.success, true);
  assert.equal(gale.mpCost, 10);
  assert.equal(gale.cooldownMs, 2500);
  assert.ok(gale.damage! >= 10 && gale.damage! <= 14);
  assert.ok(gale.knockbackDest);
  assert.equal(gale.knockbackDest?.x, 5, 'Pushes right from x=4 away from player at x=0');

  // 4. Sage Slot 2: Static Confusion (Scrambles pathfinding for 3s, 16 MP, 9s CD, 4-tile reach, 4-8 arcane dmg)
  const confuse = executeAbility(2, sageStats, 0, 2, monsterMid, map, [monsterMid], 0, 1000);
  assert.equal(confuse.success, true);
  assert.equal(confuse.mpCost, 16);
  assert.equal(confuse.cooldownMs, 9000);
  assert.ok(confuse.damage! >= 4 && confuse.damage! <= 8);
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
