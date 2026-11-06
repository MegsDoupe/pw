import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHUNK_SIZE,
  DEFAULT_WORLD_SEED,
  generateChunk,
  getChunkCoord,
  getLocalCoord,
  isSanctuary,
  isAethericWard,
  getDangerZone,
  ChunkManager,
  hash2D,
  mulberry32,
} from './chunks';
import { attemptStepSpawn, calculateMonsterStep, createMonster } from './monsters';
import { TILE_PROPERTIES } from './map';

test('Mulberry32 and Hash2D provide deterministic pseudo-randomness', () => {
  const prng1 = mulberry32(1337);
  const prng2 = mulberry32(1337);

  const seq1 = [prng1(), prng1(), prng1()];
  const seq2 = [prng2(), prng2(), prng2()];

  assert.deepEqual(seq1, seq2, 'Identical seed must yield identical PRNG sequence');

  const h1 = hash2D(12, -45, 1337);
  const h2 = hash2D(12, -45, 1337);
  const h3 = hash2D(13, -45, 1337);

  assert.equal(h1, h2, 'Hash of identical coordinates must match');
  assert.notEqual(h1, h3, 'Hash of adjacent coordinates must differ');
});

test('Chunk coordinate conversion accurately handles positive and negative world coordinates', () => {
  // Positive coordinates
  assert.equal(getChunkCoord(0), 0);
  assert.equal(getChunkCoord(15), 0);
  assert.equal(getChunkCoord(16), 1);
  assert.equal(getChunkCoord(31), 1);
  assert.equal(getLocalCoord(0), 0);
  assert.equal(getLocalCoord(15), 15);
  assert.equal(getLocalCoord(16), 0);

  // Negative coordinates
  assert.equal(getChunkCoord(-1), -1);
  assert.equal(getChunkCoord(-16), -1);
  assert.equal(getChunkCoord(-17), -2);
  assert.equal(getLocalCoord(-1), 15);
  assert.equal(getLocalCoord(-16), 0);
  assert.equal(getLocalCoord(-17), 15);
});

test('Chunk generation strictly respects 16x16 dimensions and is deterministic', () => {
  const chunk1 = generateChunk(3, -2, 1337);
  const chunk2 = generateChunk(3, -2, 1337);

  assert.equal(chunk1.tiles.length, CHUNK_SIZE);
  assert.equal(chunk1.tiles[0].length, CHUNK_SIZE);
  assert.deepEqual(chunk1.tiles, chunk2.tiles, 'Identical chunk coordinates and seed must yield identical layout');
});

test('Pathing Safety Guarantee: 2-tile wide perimeter clearing along all chunk edges is 100% walkable', () => {
  const sampleChunks = [
    generateChunk(1, 1),
    generateChunk(-4, 7),
    generateChunk(10, -8),
    generateChunk(5, 5),
  ];

  for (const chunk of sampleChunks) {
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const isBorder = x <= 1 || x >= 14 || y <= 1 || y >= 14;
        if (isBorder) {
          const tileId = chunk.tiles[y][x];
          const isTileWalkable = TILE_PROPERTIES[tileId].walkable;
          assert.equal(
            isTileWalkable,
            true,
            `Perimeter tile at (${x}, ${y}) in chunk (${chunk.chunkX}, ${chunk.chunkY}) with tileId ${tileId} must be walkable`
          );
        }
      }
    }
  }
});

test('Chunk (0, 0) Sanctuary: Origin altar is walkable and cardinal exits are open', () => {
  const manager = new ChunkManager(1337);

  // 1. Origin (0, 0) Sacred Hearth is walkable
  assert.equal(manager.isWalkable(0, 0), true, 'Sacred Hearth altar (0, 0) must be walkable');

  // 2. Cardinal passages from altar are open
  assert.equal(manager.canMove(0, 0, 0, -1), true, 'North step from altar must be clear');
  assert.equal(manager.canMove(0, 0, 0, 1), true, 'South step from altar must be clear');
  assert.equal(manager.canMove(0, 0, -1, 0), true, 'West step from altar must be clear');
  assert.equal(manager.canMove(0, 0, 1, 0), true, 'East step from altar must be clear');

  // 3. 4 Shop Entrances are open and accessible
  // Blacksmith (NW entrance at -6, -4)
  assert.equal(manager.isWalkable(-6, -4), true, 'Blacksmith entrance must be walkable');
  // General Store (NE entrance at 6, -4)
  assert.equal(manager.isWalkable(6, -4), true, 'General Store entrance must be walkable');
  // Magic Emporium (SW entrance at -6, 4)
  assert.equal(manager.isWalkable(-6, 4), true, 'Magic Emporium entrance must be walkable');
  // Food Merchant (SE entrance at 6, 4)
  assert.equal(manager.isWalkable(6, 4), true, 'Food Merchant entrance must be walkable');
});

test('Sanctuary protection: Hostile monsters cannot spawn inside safe radius (< 14 tiles)', () => {
  const manager = new ChunkManager(1337);

  // Directly at altar (0, 0)
  const spawnAtOrigin = attemptStepSpawn(0, 0, 1, manager, [], 1000);
  assert.equal(spawnAtOrigin, null, 'Monsters must NEVER spawn inside Sanctuary altar');

  // Within 14 tiles (e.g. at (8, 6) where hypot = 10 < 14)
  const spawnAt10 = attemptStepSpawn(8, 6, 1, manager, [], 1000);
  assert.equal(spawnAt10, null, 'Monsters must NEVER spawn inside 14-tile sanctuary radius');
});

test('Aetheric Ward blocks monsters from entering inner 8-tile sanctuary radius', () => {
  const manager = new ChunkManager(1337);
  const rat = createMonster('giant_rat', 9, 0, 'rat_ward_test');

  // Player at origin (0, 0), monster at (9, 0)
  // Step towards player would be (-1, 0) to (8, 0), which is within hypot <= 8!
  const step = calculateMonsterStep(rat, 0, 0, manager, [rat], 1000);
  assert.equal(step, null, 'Monster must be blocked from stepping into Aetheric Ward (radius <= 8)');
});

test('Radial distance danger zones scale monster archetypes and apply Veteran buffs in Zone 4', () => {
  assert.equal(getDangerZone(0, 0), 1, 'Zone 1: Safe Sanctuary');
  assert.equal(getDangerZone(20, 20), 2, 'Zone 2: Outskirts (dist ~28.3)');
  assert.equal(getDangerZone(50, 40), 3, 'Zone 3: Wilderness (dist ~64)');
  assert.equal(getDangerZone(80, 80), 4, 'Zone 4: Deep Ruins (dist ~113.1)');

  const manager = new ChunkManager(1337);

  // Spawn in Zone 4 (Deep Ruins: dist > 90)
  const zone4Spawn = attemptStepSpawn(100, 100, 5, manager, [], 1000);
  assert.notEqual(zone4Spawn, null, 'Must successfully spawn in Zone 4');
  assert.ok(zone4Spawn);

  const monster = zone4Spawn.monster;
  assert.ok(monster.name.startsWith('Veteran '), `Zone 4 mob must have Veteran prefix: ${monster.name}`);
  assert.ok(monster.xpReward >= 32, `Zone 4 mob receives +20 XP bonus: ${monster.xpReward}`);
  // Check +50% HP buff
  if (monster.archetype === 'clockwork_drone') {
    assert.equal(monster.maxHp, 75, 'Veteran Clockwork Drone has 50 * 1.5 = 75 HP');
    assert.deepEqual(monster.attackPower, [10, 13], 'Veteran Drone has +2/+2 dmg (8-11 -> 10-13)');
  } else if (monster.archetype === 'spore_spitter') {
    assert.equal(monster.maxHp, 42, 'Veteran Spore Spitter has 28 * 1.5 = 42 HP');
    assert.deepEqual(monster.attackPower, [6, 8], 'Veteran Spitter has +2/+2 dmg (4-6 -> 6-8)');
  }
});

test('ChunkManager maintains active 3x3 chunks and persistent delta cache', () => {
  const manager = new ChunkManager(1337);

  // Player at (0, 0): active chunks should be cx in [-1, 0, 1], cy in [-1, 0, 1] (total 9 chunks)
  assert.equal(manager.getActiveChunks().length, 9);

  // Player moves far away to chunk (5, 5) -> world (80, 80)
  manager.updateActiveChunks(80, 80);
  assert.equal(manager.getActiveChunks().length, 9);

  // Delta cache test: set a tile to Stone Wall (4) at (85, 85)
  assert.notEqual(manager.getTile(85, 85), 4);
  manager.setTile(85, 85, 4);
  assert.equal(manager.getTile(85, 85), 4, 'Modified tile must persist via delta cache');
  assert.equal(manager.isWalkable(85, 85), false, 'Modified stone wall tile must not be walkable');
});
