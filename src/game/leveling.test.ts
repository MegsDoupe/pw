import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getXpNeededForLevel,
  createInitialPlayerStats,
  addXp,
  onDamageDealt,
  onManaSpent,
  onDamageTaken,
  CLASS_APTITUDES,
  getManaNeededForNextMagicLevel,
  getHitsNeededForNextWeaponLevel,
  getHitsNeededForNextDefenseLevel,
  recalibratePlayerSkills,
  recordSpellCast,
  recordWeaponHit,
  recordDefenseHit,
  getWeaponSkillDamageBonus,
  getSpellSkillBonus,
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

test('createInitialPlayerStats initializes class stats and scaffolded skills at Level 10 baseline', () => {
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

  // Skill scaffolding & baseline level 10 floor
  assert.equal(avenger.skills.defense.level, 10);
  assert.equal(avenger.skills.defense.hitsBlocked, 0);
  assert.equal(avenger.skills.defense.hitsTaken, 0);
  assert.equal(avenger.skills.defense.hitsToNextLevel, 15); // 1.0x favored: 15 hits
  assert.equal(avenger.skills.weapons.flexible.level, 10);
  assert.equal(avenger.skills.weapons.flexible.hitsToNextLevel, 20); // 1.0x favored: 20 hits
  assert.equal(avenger.skills.origins.radiant.level, 10);
  assert.equal(avenger.skills.origins.radiant.manaToNextLevel, 40); // 1.0x favored: 40 mana
  assert.equal(avenger.skills.elements.fire.level, 10);
  assert.equal(avenger.skills.elements.fire.manaToNextLevel, 40); // 1.0x favored: 40 mana

  const sage = createInitialPlayerStats('Sage');
  assert.equal(sage.classType, 'Sage');
  assert.equal(sage.maxHp, 110);
  assert.equal(sage.maxMp, 140); // 120 base + 20 from Tinkerer's Duster
  assert.equal(sage.baseMinDamage, 6);
  assert.equal(sage.baseMaxDamage, 10);
  assert.equal(sage.skills.weapons.sidearms.level, 10);
  assert.equal(sage.skills.weapons.sidearms.hitsToNextLevel, 20); // 1.0x favored: 20 hits
  assert.equal(sage.skills.origins.arcane.level, 10);
  assert.equal(sage.skills.origins.arcane.manaToNextLevel, 40); // 1.0x favored: 40 mana
  assert.equal(sage.skills.elements.air.level, 10);
  assert.equal(sage.skills.elements.air.manaToNextLevel, 40); // 1.0x favored: 40 mana
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
  assert.equal(sage.maxMp, 156); // +16 MP (120 base + 16 scaling + 20 Tinkerer's Duster)
  assert.equal(sage.baseMinDamage, 7); // +1 min dmg
  assert.equal(sage.baseMaxDamage, 11); // +1 max dmg
  assert.equal(sage.hp, 116, 'Full HP restore on level up');
  assert.equal(sage.mp, 156, 'Full MP restore on level up');
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
  assert.equal(avenger.skills.melee!.tries, 2);

  // Sage marksmanship damage
  onDamageDealt(sage, 'air', 12);
  onDamageDealt(sage, 'arcane', 8);
  assert.equal(sage.skills.marksmanship!.tries, 2);

  // Mana spending
  onManaSpent(avenger, 'cinder_brand', 12);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 12);

  onManaSpent(sage, 'confusion', 16);
  assert.equal(sage.skills.origins.arcane.manaSpent, 16);

  // Defense hits blocked
  onDamageTaken(avenger, 5);
  onDamageTaken(avenger, 4);
  assert.equal(avenger.skills.defense.hitsBlocked, 2);
});

test('CLASS_APTITUDES strictly matches class specification', () => {
  // Avenger aptitudes
  assert.equal(CLASS_APTITUDES.Avenger.origins.radiant, 1.0); // Favored
  assert.equal(CLASS_APTITUDES.Avenger.origins.wild, 1.5);
  assert.equal(CLASS_APTITUDES.Avenger.origins.arcane, 2.5);
  assert.equal(CLASS_APTITUDES.Avenger.origins.eldritch, 4.0); // Alien
  assert.equal(CLASS_APTITUDES.Avenger.elements.fire, 1.0); // Favored
  assert.equal(CLASS_APTITUDES.Avenger.elements.earth, 1.5);
  assert.equal(CLASS_APTITUDES.Avenger.elements.air, 2.0);
  assert.equal(CLASS_APTITUDES.Avenger.elements.water, 2.5);
  assert.equal(CLASS_APTITUDES.Avenger.weapons.flexible, 1.0); // Favored
  assert.equal(CLASS_APTITUDES.Avenger.weapons.blades, 1.5);
  assert.equal(CLASS_APTITUDES.Avenger.weapons.sidearms, 2.5);
  assert.equal(CLASS_APTITUDES.Avenger.defense, 1.0);

  // Sage aptitudes
  assert.equal(CLASS_APTITUDES.Sage.origins.arcane, 1.0); // Favored
  assert.equal(CLASS_APTITUDES.Sage.origins.eldritch, 1.5);
  assert.equal(CLASS_APTITUDES.Sage.origins.wild, 2.0);
  assert.equal(CLASS_APTITUDES.Sage.origins.radiant, 4.0); // Alien
  assert.equal(CLASS_APTITUDES.Sage.elements.air, 1.0); // Favored
  assert.equal(CLASS_APTITUDES.Sage.elements.fire, 1.5);
  assert.equal(CLASS_APTITUDES.Sage.elements.earth, 2.0);
  assert.equal(CLASS_APTITUDES.Sage.elements.water, 2.5);
  assert.equal(CLASS_APTITUDES.Sage.weapons.sidearms, 1.0); // Favored
  assert.equal(CLASS_APTITUDES.Sage.weapons.flexible, 2.0);
  assert.equal(CLASS_APTITUDES.Sage.weapons.blades, 2.0);
  assert.equal(CLASS_APTITUDES.Sage.defense, 1.5);
});

test('Offset polynomial progression threshold formulas scale from Level 10 baseline floor', () => {
  // Weapon threshold: Math.floor((20 + 30 * Math.pow(effectiveSkill, 1.35)) * classAptitudeMultiplier)
  // Level 10 -> 11 (effectiveSkill = 0): 20 hits at 1.0x
  assert.equal(getHitsNeededForNextWeaponLevel(10, 1.0), 20);
  // Level 11 -> 12 (effectiveSkill = 1): 20 + 30 = 50 hits at 1.0x
  assert.equal(getHitsNeededForNextWeaponLevel(11, 1.0), 50);
  // Level 12 -> 13 (effectiveSkill = 2): Math.floor(20 + 30 * 2^1.35) = 96 hits at 1.0x
  assert.equal(getHitsNeededForNextWeaponLevel(12, 1.0), 96);
  // Difficult aptitude (2.5x) at Level 10: 20 * 2.5 = 50 hits
  assert.equal(getHitsNeededForNextWeaponLevel(10, 2.5), 50);

  // Magic threshold: Math.floor((40 + 50 * Math.pow(effectiveSkill, 1.35)) * classAptitudeMultiplier)
  // Level 10 -> 11 (effectiveSkill = 0): 40 mana at 1.0x
  assert.equal(getManaNeededForNextMagicLevel(10, 1.0), 40);
  // Level 11 -> 12 (effectiveSkill = 1): 40 + 50 = 90 mana at 1.0x
  assert.equal(getManaNeededForNextMagicLevel(11, 1.0), 90);
  // Level 12 -> 13 (effectiveSkill = 2): Math.floor(40 + 50 * 2^1.35) = 167 mana at 1.0x
  assert.equal(getManaNeededForNextMagicLevel(12, 1.0), 167);
  // Alien aptitude (4.0x) at Level 10: 40 * 4 = 160 mana
  assert.equal(getManaNeededForNextMagicLevel(10, 4.0), 160);

  // Defense threshold: Math.floor((15 + 20 * Math.pow(effectiveSkill, 1.35)) * classDefenseMultiplier)
  // Level 10 -> 11 (effectiveSkill = 0): 15 hits at 1.0x
  assert.equal(getHitsNeededForNextDefenseLevel(10, 1.0), 15);
  // Level 11 -> 12 (effectiveSkill = 1): 15 + 20 = 35 hits at 1.0x
  assert.equal(getHitsNeededForNextDefenseLevel(11, 1.0), 35);
  // Sage defense (1.5x) at Level 10: Math.floor(15 * 1.5) = 22 hits
  assert.equal(getHitsNeededForNextDefenseLevel(10, 1.5), 22);
});

test('recordSpellCast advances skills with rollover and active exploration threat bonus (1.5x mana)', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Radiant starting threshold is 40 MP (mult 1.0), Fire is 40 MP (mult 1.0)
  assert.equal(avenger.skills.origins.radiant.level, 10);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 0);
  assert.equal(avenger.skills.origins.radiant.manaToNextLevel, 40);

  // Cast Cinder Brand (12 MP, Radiant + Fire) 3 times = 36 MP spent
  for (let i = 0; i < 3; i++) {
    const events = recordSpellCast(avenger, 'radiant', 'fire', 12);
    assert.equal(events.length, 0, 'No level up yet at 36 MP');
  }
  assert.equal(avenger.skills.origins.radiant.manaSpent, 36);

  // 4th cast without dangerous threat: 36 + 12 = 48 MP -> hits 40 MP threshold, levels up to 11 with 8 rollover!
  const events = recordSpellCast(avenger, 'radiant', 'fire', 12, false);
  assert.equal(events.length, 2, 'Both Radiant and Fire level up to 11!');
  assert.equal(events[0].skillName, 'Radiant');
  assert.equal(events[0].newLevel, 11);
  assert.equal(events[1].skillName, 'Fire');
  assert.equal(events[1].newLevel, 11);

  // Level 11 state: needed for 11 -> 12 is 90 MP
  assert.equal(avenger.skills.origins.radiant.level, 11);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 8);
  assert.equal(avenger.skills.origins.radiant.manaToNextLevel, 90);

  // Cast with isDangerousThreat = true: 12 MP becomes Math.round(12 * 1.5) = 18 MP
  recordSpellCast(avenger, 'radiant', 'fire', 12, true);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 8 + 18); // 26 MP
});

test('recordWeaponHit advances weapon skill and applies active threat bonus (2 hits per strike)', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Flexible starts at level 10 with hitsToNextLevel = 20 (mult 1.0)
  assert.equal(avenger.skills.weapons.flexible.level, 10);
  assert.equal(avenger.skills.weapons.flexible.hits, 0);
  assert.equal(avenger.skills.weapons.flexible.hitsToNextLevel, 20);

  // Normal strike: 1 hit
  recordWeaponHit(avenger, 'flexible', false);
  assert.equal(avenger.skills.weapons.flexible.hits, 1);

  // Dangerous threat strike: 2 hits
  recordWeaponHit(avenger, 'flexible', true);
  assert.equal(avenger.skills.weapons.flexible.hits, 3);

  // Fast forward to 19 hits
  avenger.skills.weapons.flexible.hits = 19;
  // Next dangerous strike gives 2 hits -> 21 total -> levels to 11 with 1 rollover hit
  const events = recordWeaponHit(avenger, 'flexible', true);
  assert.equal(events.length, 1);
  assert.equal(events[0].newLevel, 11);
  assert.equal(avenger.skills.weapons.flexible.level, 11);
  assert.equal(avenger.skills.weapons.flexible.hits, 1);
  assert.equal(avenger.skills.weapons.flexible.hitsToNextLevel, 50); // Level 11 threshold
});

test('recordDefenseHit advances defense skill and applies active threat bonus (2 hits per strike)', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Defense starts at level 10 with hitsToNextLevel = 15
  assert.equal(avenger.skills.defense.level, 10);
  assert.equal(avenger.skills.defense.hitsToNextLevel, 15);

  // Dangerous threat defense: gives 2 hits
  recordDefenseHit(avenger, true);
  assert.equal(avenger.skills.defense.hitsTaken, 2);

  // Set hits to 14
  avenger.skills.defense.hitsTaken = 14;
  // Hit with dangerous threat: 14 + 2 = 16 -> level up to 11 with 1 rollover hit
  const events = recordDefenseHit(avenger, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].skillName, 'Defense');
  assert.equal(events[0].newLevel, 11);
  assert.equal(avenger.skills.defense.level, 11);
  assert.equal(avenger.skills.defense.hitsTaken, 1);
  assert.equal(avenger.skills.defense.hitsToNextLevel, 35); // Level 11 defense threshold
});

test('recalibratePlayerSkills brings legacy skills up to Level 10 and processes overflow rollover', () => {
  const player = createInitialPlayerStats('Avenger');
  // Simulate legacy uncalibrated state with level 0 and accumulated mana/hits
  player.skills.origins.radiant.level = 0;
  player.skills.origins.radiant.manaSpent = 150; // Enough for 10 -> 11 (40) and 11 -> 12 (90) = 130 MP, with 20 MP rollover
  player.skills.weapons.flexible.level = 0;
  player.skills.weapons.flexible.hits = 75; // Enough for 10 -> 11 (20) and 11 -> 12 (50) = 70 hits, with 5 rollover

  const recalEvents = recalibratePlayerSkills(player);

  assert.ok(recalEvents.length > 0);
  // Radiant should have advanced to Level 12 with 20 MP rollover into Tier 12 (needs 167 MP)
  assert.equal(player.skills.origins.radiant.level, 12);
  assert.equal(player.skills.origins.radiant.manaSpent, 20);
  assert.equal(player.skills.origins.radiant.manaToNextLevel, 167);

  // Flexible weapon should have advanced to Level 12 with 5 hits rollover into Tier 12 (needs 96 hits)
  assert.equal(player.skills.weapons.flexible.level, 12);
  assert.equal(player.skills.weapons.flexible.hits, 5);
  assert.equal(player.skills.weapons.flexible.hitsToNextLevel, 96);
});

test('Skill damage bonuses correctly scale combat output', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Weapon bonus at level 10: Math.floor(10 * 0.75) = 7
  assert.equal(getWeaponSkillDamageBonus(avenger, 'flexible'), 7);

  // Higher weapon level
  avenger.skills.weapons.flexible.level = 16;
  assert.equal(getWeaponSkillDamageBonus(avenger, 'flexible'), 12); // Math.floor(16 * 0.75)

  // Spell bonus at level 10: Math.floor(10 * 0.8) + Math.floor(10 * 0.8) = 8 + 8 = 16
  assert.equal(getSpellSkillBonus(avenger, 'radiant', 'fire'), 16);

  // After leveling origins & elements
  avenger.skills.origins.radiant.level = 13;
  avenger.skills.elements.fire.level = 14;
  // Math.floor(13 * 0.8) + Math.floor(14 * 0.8) = 10 + 11 = 21 bonus dmg
  assert.equal(getSpellSkillBonus(avenger, 'radiant', 'fire'), 21);
});
