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

test('calculateKnockbackDestination pushes target away, but stops at walls', () => {
  // 3x3 map: center is (1, 1), wall at (1, 2)
  const map: TileId[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 4, 0], // stone wall at x=1, y=2
  ];

  // Attacker at (1, 0), Target at (1, 1). Knockback direction is downwards (0, +1) -> dest (1, 2)
  // But (1, 2) is a stone wall (tile 4), so knockback should be blocked!
  const blockedDest = calculateKnockbackDestination(1, 0, 1, 1, map, []);
  assert.deepEqual(blockedDest, { x: 1, y: 1 }, 'Knockback blocked by wall');

  // Unobstructed: Attacker at (1, 1), Target at (1, 0). Push upwards -> dest (1, -1) out of bounds or (2, 1)
  const clearMap: TileId[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const clearDest = calculateKnockbackDestination(0, 1, 1, 1, clearMap, []);
  assert.deepEqual(clearDest, { x: 2, y: 1 }, 'Knockback moves target 1 tile away');
});

test('checkAutoAttack respects Avenger 2-tile reach and Sage 4-tile reach with MP cost', () => {
  const avengerStats: PlayerStats = {
    classType: 'Avenger',
    level: 1,
    hp: 150,
    maxHp: 150,
    mp: 60,
    maxMp: 60,
    xp: 0,
    totalXpEarned: 0,
  };

  const sageStats: PlayerStats = {
    classType: 'Sage',
    level: 1,
    hp: 110,
    maxHp: 110,
    mp: 120,
    maxMp: 120,
    xp: 0,
    totalXpEarned: 0,
  };

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

test('executeAbility validates cooldowns, reach, costs and status effects', () => {
  const avengerStats: PlayerStats = {
    classType: 'Avenger',
    level: 1,
    hp: 150,
    maxHp: 150,
    mp: 60,
    maxMp: 60,
    xp: 0,
    totalXpEarned: 0,
  };

  const map: TileId[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
  const monsterNear = createMockMonster({ gridX: 2, gridY: 2 }); // dist 2 from (0, 2)
  const monsterFar = createMockMonster({ gridX: 5, gridY: 2 }); // dist 5 from (0, 2)

  // Ability 1: Entangling Lash (Avenger)
  const lashNear = executeAbility(1, avengerStats, 0, 2, monsterNear, map, [], 0, 1000);
  assert.equal(lashNear.success, true);
  assert.equal(lashNear.mpCost, 8);
  assert.equal(lashNear.statusEffect?.type, 'root');

  const lashFar = executeAbility(1, avengerStats, 0, 2, monsterFar, map, [], 0, 1000);
  assert.equal(lashFar.success, false, 'Beyond 2 tiles reach fails');

  // Ability 2: Cinder Brand (Avenger)
  const cinder = executeAbility(2, avengerStats, 0, 2, monsterNear, map, [], 0, 1000);
  assert.equal(cinder.success, true);
  assert.equal(cinder.heal, 4);
  assert.equal(cinder.mpCost, 12);
});

test('calculateMonsterStep respects Root status and aggro radius', () => {
  const map: TileId[][] = Array.from({ length: 40 }, () => Array(40).fill(0));

  // Monster within 3 tiles of player (20, 20)
  const rat = createMockMonster({ gridX: 20, gridY: 23 }); // dist 3
  const step = calculateMonsterStep(rat, 20, 20, map, [rat], 1000);
  assert.notEqual(step, null, 'Rat should chase player');
  assert.equal(step?.dy, -1, 'Rat should move up toward player');

  // Rooted monster cannot step
  const rootedRat = createMockMonster({
    gridX: 20,
    gridY: 23,
    statusEffects: { rootedUntil: 5000 },
  });
  const rootedStep = calculateMonsterStep(rootedRat, 20, 20, map, [rootedRat], 1000);
  assert.equal(rootedStep, null, 'Rooted rat cannot move');
});
