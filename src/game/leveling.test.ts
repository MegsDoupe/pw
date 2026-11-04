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
  assert.equal(avenger.skills.defense.level, 10);
  assert.equal(avenger.skills.defense.hitsBlocked, 0);
  assert.equal(avenger.skills.defense.hitsTaken, 0);
  assert.equal(avenger.skills.weapons.flexible.level, 10);
  assert.equal(avenger.skills.origins.radiant.level, 0);
  assert.equal(avenger.skills.elements.fire.level, 0);

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
  assert.equal(avenger.skills.melee!.tries, 2);

  // Sage marksmanship damage
  onDamageDealt(sage, 'air', 12);
  onDamageDealt(sage, 'arcane', 8);
  assert.equal(sage.skills.marksmanship!.tries, 2);

  // Mana spending
  onManaSpent(avenger, 'cinder_brand', 12);
  assert.equal(avenger.skills.magic!.manaSpent, 12);

  onManaSpent(sage, 'confusion', 16);
  assert.equal(sage.skills.magic!.manaSpent, 16);

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

test('Progression threshold formulas scale with skill level and aptitude multiplier', () => {
  // Magic threshold: Math.floor(60 * Math.pow(currentSkillLevel + 1, 1.4) * classAptitudeMultiplier)
  // Level 0, favored (1.0x): 60 * 1^1.4 * 1.0 = 60
  assert.equal(getManaNeededForNextMagicLevel(0, 1.0), 60);
  // Level 0, alien (4.0x): 60 * 1^1.4 * 4.0 = 240
  assert.equal(getManaNeededForNextMagicLevel(0, 4.0), 240);
  // Level 1, favored (1.0x): Math.floor(60 * 2^1.4 * 1.0) = Math.floor(60 * 2.639) = 158
  assert.equal(getManaNeededForNextMagicLevel(1, 1.0), 158);

  // Weapon threshold: Math.floor(25 * Math.pow(currentSkillLevel + 1, 1.2) * classAptitudeMultiplier)
  // Level 10, favored (1.0x): Math.floor(25 * 11^1.2 * 1.0) = 444
  assert.equal(getHitsNeededForNextWeaponLevel(10, 1.0), 444);
  // Level 10, difficult (2.5x): Math.floor(25 * 11^1.2 * 2.5) = 1110
  assert.equal(getHitsNeededForNextWeaponLevel(10, 2.5), 1110);

  // Defense threshold: Math.floor(20 * Math.pow(currentSkillLevel + 1, 1.2) * classDefenseMultiplier)
  // Level 10, favored (1.0x): Math.floor(20 * 11^1.2 * 1.0) = 355
  assert.equal(getHitsNeededForNextDefenseLevel(10, 1.0), 355);
});

test('recordSpellCast advances origin and element skills with rollover mana and level up events', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Radiant starting threshold is 60 MP (mult 1.0), Fire is 60 MP (mult 1.0)
  assert.equal(avenger.skills.origins.radiant.level, 0);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 0);
  assert.equal(avenger.skills.origins.radiant.manaToNextLevel, 60);

  // Cast Cinder Brand (12 MP, Radiant + Fire) 4 times = 48 MP spent
  for (let i = 0; i < 4; i++) {
    const events = recordSpellCast(avenger, 'radiant', 'fire', 12);
    assert.equal(events.length, 0, 'No level up yet at 48 MP');
  }
  assert.equal(avenger.skills.origins.radiant.manaSpent, 48);
  assert.equal(avenger.skills.elements.fire.manaSpent, 48);

  // 5th cast: 48 + 12 = 60 MP -> Hits 60 MP threshold!
  const events = recordSpellCast(avenger, 'radiant', 'fire', 12);
  assert.equal(events.length, 2, 'Both Radiant and Fire level up to 1!');
  assert.equal(events[0].skillName, 'Radiant');
  assert.equal(events[0].newLevel, 1);
  assert.equal(events[0].color, '#38bdf8');
  assert.equal(events[1].skillName, 'Fire');
  assert.equal(events[1].newLevel, 1);

  // Level 1 state
  assert.equal(avenger.skills.origins.radiant.level, 1);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 0);
  assert.equal(avenger.skills.origins.radiant.manaToNextLevel, 158);

  // Rollover test: Spend 165 MP when 158 MP needed -> level 2 with 7 MP rollover
  const rolloverEvents = recordSpellCast(avenger, 'radiant', 'fire', 165);
  assert.equal(avenger.skills.origins.radiant.level, 2);
  assert.equal(avenger.skills.origins.radiant.manaSpent, 7, 'Rollover mana should be 165 - 158 = 7');
  assert.ok(rolloverEvents.some((e) => e.skillName === 'Radiant' && e.newLevel === 2));
});

test('recordWeaponHit advances weapon skill and handles rollover hits', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Flexible starts at level 10 with hitsToNextLevel = 444 (mult 1.0)
  assert.equal(avenger.skills.weapons.flexible.level, 10);
  assert.equal(avenger.skills.weapons.flexible.hits, 0);
  assert.equal(avenger.skills.weapons.flexible.hitsToNextLevel, 444);

  // Set hits to 443 (1 hit away from level 11)
  avenger.skills.weapons.flexible.hits = 443;
  const events = recordWeaponHit(avenger, 'flexible');

  assert.equal(events.length, 1);
  assert.equal(events[0].skillName, 'Flexible');
  assert.equal(events[0].newLevel, 11);
  assert.equal(events[0].color, '#fb923c');
  assert.equal(avenger.skills.weapons.flexible.level, 11);
  assert.equal(avenger.skills.weapons.flexible.hits, 0);
  assert.equal(avenger.skills.weapons.flexible.hitsToNextLevel, getHitsNeededForNextWeaponLevel(11, 1.0));
});

test('recordDefenseHit advances defense skill and handles rollover', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Defense starts at level 10 with hitsToNextLevel = 355
  avenger.skills.defense.hitsTaken = 354;
  const events = recordDefenseHit(avenger);

  assert.equal(events.length, 1);
  assert.equal(events[0].skillName, 'Defense');
  assert.equal(events[0].newLevel, 11);
  assert.equal(avenger.skills.defense.level, 11);
  assert.equal(avenger.skills.defense.hitsTaken, 0);
});

test('Skill damage bonuses correctly scale combat output', () => {
  const avenger = createInitialPlayerStats('Avenger');
  // Weapon bonus at level 10: Math.floor(10 * 0.75) = 7
  assert.equal(getWeaponSkillDamageBonus(avenger, 'flexible'), 7);

  // Higher weapon level
  avenger.skills.weapons.flexible.level = 16;
  assert.equal(getWeaponSkillDamageBonus(avenger, 'flexible'), 12); // Math.floor(16 * 0.75)

  // Spell bonus at level 0: 0
  assert.equal(getSpellSkillBonus(avenger, 'radiant', 'fire'), 0);

  // After leveling origins & elements
  avenger.skills.origins.radiant.level = 3;
  avenger.skills.elements.fire.level = 4;
  // Math.floor(3 * 0.8) + Math.floor(4 * 0.8) = 2 + 3 = 5 bonus dmg
  assert.equal(getSpellSkillBonus(avenger, 'radiant', 'fire'), 5);
});
