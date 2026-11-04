import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getXpNeededForLevel,
  createInitialPlayerStats,
  addXp,
  onDamageDealt,
  onManaSpent,
  onDamageTaken,
} from './leveling';

test('getXpNeededForLevel calculates Tibia curve: Math.floor(50 * level^1.5)', () => {
  // Level 1: Math.floor(50 * 1^1.5) = 50 XP (10 rat kills)
  assert.equal(getXpNeededForLevel(1), 50);

  // Level 2: Math.floor(50 * 2^1.5) = Math.floor(50 * 2.828427) = 141 XP
  assert.equal(getXpNeededForLevel(2), 141);

  // Level 3: Math.floor(50 * 3^1.5) = Math.floor(50 * 5.196152) = 259 XP
  assert.equal(getXpNeededForLevel(3), 259);

  // Level 4: Math.floor(50 * 4^1.5) = Math.floor(50 * 8) = 400 XP
  assert.equal(getXpNeededForLevel(4), 400);

  // Level 5: Math.floor(50 * 5^1.5) = Math.floor(50 * 11.180339) = 559 XP
  assert.equal(getXpNeededForLevel(5), 559);
});

test('createInitialPlayerStats initializes class stats and scaffolded skills', () => {
  const avenger = createInitialPlayerStats('Avenger');
  assert.equal(avenger.classType, 'Avenger');
  assert.equal(avenger.level, 1);
  assert.equal(avenger.maxHp, 150);
  assert.equal(avenger.hp, 150);
  assert.equal(avenger.maxMp, 60);
  assert.equal(avenger.mp, 60);
  assert.equal(avenger.currentXp, 0);
  assert.equal(avenger.xpForNextLevel, 50);
  assert.equal(avenger.baseMinDamage, 8);
  assert.equal(avenger.baseMaxDamage, 12);

  // Skill scaffolding
  assert.deepEqual(avenger.skills.melee, { level: 10, tries: 0, nextLevelTries: 50 });
  assert.deepEqual(avenger.skills.marksmanship, { level: 10, tries: 0, nextLevelTries: 50 });
  assert.deepEqual(avenger.skills.magic, { level: 0, manaSpent: 0, nextLevelMana: 100 });
  assert.deepEqual(avenger.skills.defense, { level: 10, hitsBlocked: 0, nextLevelHits: 40 });

  const sage = createInitialPlayerStats('Sage');
  assert.equal(sage.classType, 'Sage');
  assert.equal(sage.maxHp, 110);
  assert.equal(sage.maxMp, 120);
  assert.equal(sage.baseMinDamage, 6);
  assert.equal(sage.baseMaxDamage, 10);
});

test('addXp triggers Level 1 -> 2 progression with Avenger stat scaling', () => {
  const player = createInitialPlayerStats('Avenger');
  player.hp = 80; // Wounded
  player.mp = 15; // Spent mana

  // Gain 50 XP (10 rat kills)
  const result = addXp(player, 50);

  assert.equal(result.leveledUp, true);
  assert.deepEqual(result.levelsGained, [2]);
  assert.equal(player.level, 2);

  // Avenger scaling: maxHp +12, maxMp +8, base dmg +1/+1
  assert.equal(player.maxHp, 162);
  assert.equal(player.maxMp, 68);
  assert.equal(player.baseMinDamage, 9);
  assert.equal(player.baseMaxDamage, 13);

  // Full restoration reward on level up
  assert.equal(player.hp, 162);
  assert.equal(player.mp, 68);

  // Tier tracking
  assert.equal(player.currentXp, 0);
  assert.equal(player.xpForNextLevel, 141); // Level 2 threshold
  assert.equal(player.totalXpEarned, 50);
});

test('addXp handles rollover XP properly (e.g. 48 XP + 5 XP = 53 XP)', () => {
  const player = createInitialPlayerStats('Avenger');
  player.currentXp = 48;
  player.totalXpEarned = 48;

  // Add 5 XP from 1 rat kill (total 53 XP, threshold was 50 XP)
  const result = addXp(player, 5);

  assert.equal(result.leveledUp, true);
  assert.equal(player.level, 2);
  assert.equal(player.currentXp, 3, 'Rollover XP should be 53 - 50 = 3');
  assert.equal(player.xpForNextLevel, 141, 'Next level requires 141 XP');
  assert.equal(player.totalXpEarned, 53);
});

test('addXp triggers Sage stat scaling (+6 HP, +16 MP, +1/+1 dmg)', () => {
  const sage = createInitialPlayerStats('Sage');
  sage.hp = 30;
  sage.mp = 20;

  const result = addXp(sage, 50);

  assert.equal(result.leveledUp, true);
  assert.equal(sage.level, 2);
  assert.equal(sage.maxHp, 116); // +6 HP
  assert.equal(sage.maxMp, 136); // +16 MP
  assert.equal(sage.baseMinDamage, 7); // +1 min dmg
  assert.equal(sage.baseMaxDamage, 11); // +1 max dmg
  assert.equal(sage.hp, 116, 'Full HP restore on level up');
  assert.equal(sage.mp, 136, 'Full MP restore on level up');
});

test('addXp handles multi-level jump with rollover across multiple tiers', () => {
  const player = createInitialPlayerStats('Avenger');

  // Level 1 -> 2: 50 XP
  // Level 2 -> 3: 141 XP
  // Level 3 -> 4: 259 XP
  // Total needed for Level 4: 50 + 141 + 259 = 450 XP
  // Granting 500 XP should level player up from 1 to 4 with 50 XP rollover into Tier 4 (needs 400 XP)
  const result = addXp(player, 500);

  assert.equal(result.leveledUp, true);
  assert.deepEqual(result.levelsGained, [2, 3, 4]);
  assert.equal(player.level, 4);
  assert.equal(player.currentXp, 50);
  assert.equal(player.xpForNextLevel, 400); // Level 4 tier threshold
  assert.equal(player.maxHp, 150 + 3 * 12); // 186
  assert.equal(player.maxMp, 60 + 3 * 8); // 84
  assert.equal(player.baseMinDamage, 8 + 3); // 11
  assert.equal(player.baseMaxDamage, 12 + 3); // 15
});

test('Skill hook points record progress on damage, mana spent, and damage taken', () => {
  const avenger = createInitialPlayerStats('Avenger');
  const sage = createInitialPlayerStats('Sage');

  // Avenger melee damage
  onDamageDealt(avenger, 'physical', 10);
  onDamageDealt(avenger, 'fire', 15);
  assert.equal(avenger.skills.melee.tries, 2);

  // Sage marksmanship damage
  onDamageDealt(sage, 'air', 12);
  onDamageDealt(sage, 'arcane', 8);
  assert.equal(sage.skills.marksmanship.tries, 2);

  // Mana spending
  onManaSpent(avenger, 'cinder_brand', 12);
  assert.equal(avenger.skills.magic.manaSpent, 12);

  onManaSpent(sage, 'confusion', 16);
  assert.equal(sage.skills.magic.manaSpent, 16);

  // Defense hits blocked
  onDamageTaken(avenger, 5);
  onDamageTaken(avenger, 4);
  assert.equal(avenger.skills.defense.hitsBlocked, 2);
});
