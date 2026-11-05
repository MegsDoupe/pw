import {
  CharacterClass,
  DefenseSkillState,
  ElementSchool,
  ElementSkillState,
  MagicOrigin,
  MagicSkillState,
  PlayerSkills,
  PlayerStats,
  SkillLevelUpEvent,
  WeaponFamily,
  WeaponSkillState,
} from '../types/game';

/**
 * Tibia-style XP curve formula:
 * xpNeededForNextLevel = Math.floor(50 * Math.pow(currentLevel, 1.5))
 * Level 1 -> 2: Math.floor(50 * 1^1.5) = 50 XP (10 rat kills at 5 XP each).
 * Level 2 -> 3: Math.floor(50 * 2^1.5) = 141 XP.
 * Level 3 -> 4: Math.floor(50 * 3^1.5) = 259 XP.
 */
export function getXpNeededForLevel(level: number): number {
  return Math.floor(50 * Math.pow(Math.max(1, level), 1.5));
}

export interface ClassAptitudes {
  origins: Record<MagicOrigin, number>;
  elements: Record<ElementSchool, number>;
  weapons: Record<WeaponFamily, number>;
  defense: number;
}

/**
 * Phase 4 Class Aptitude Multipliers (Experience Scaling):
 * Lower multipliers mean faster progression (cost per level = baseRequirement * multiplier).
 */
export const CLASS_APTITUDES: Record<CharacterClass, ClassAptitudes> = {
  Avenger: {
    origins: {
      radiant: 1.0, // Favored
      wild: 1.5,
      arcane: 2.5,
      eldritch: 4.0, // Alien
    },
    elements: {
      fire: 1.0, // Favored
      earth: 1.5,
      air: 2.0,
      water: 2.5,
    },
    weapons: {
      flexible: 1.0, // Favored (whips, flails - 2-tile reach)
      blades: 1.5,
      sidearms: 2.5,
    },
    defense: 1.0,
  },
  Sage: {
    origins: {
      arcane: 1.0, // Favored
      eldritch: 1.5,
      wild: 2.0,
      radiant: 4.0, // Alien
    },
    elements: {
      air: 1.0, // Favored
      fire: 1.5,
      earth: 2.0,
      water: 2.5,
    },
    weapons: {
      sidearms: 1.0, // Favored (aether guns, wands - 4-tile reach)
      flexible: 2.0,
      blades: 2.0,
    },
    defense: 1.5,
  },
};

/**
 * Progression threshold calculators scaling from Level 10 baseline floor:
 * effectiveSkill = Math.max(0, currentSkillLevel - 10)
 *
 * 1. Weapon Families (Flexible, Sidearms, Blades):
 *    hitsToNextLevel = Math.floor((20 + 30 * Math.pow(effectiveSkill, 1.35)) * classAptitudeMultiplier)
 *    At 1.0x: 10->11: 20 hits, 11->12: 50 hits, 12->13: ~96 hits, 15->16: ~270 hits
 *
 * 2. Magic Origins & Elements (Radiant, Arcane, Eldritch, Wild | Air, Fire, Water, Earth):
 *    manaToNextLevel = Math.floor((40 + 50 * Math.pow(effectiveSkill, 1.35)) * classAptitudeMultiplier)
 *    At 1.0x: 10->11: 40 mana, 11->12: 90 mana, 12->13: ~167 mana
 *
 * 3. Defense (Evasion / Shielding):
 *    hitsToNextLevel = Math.floor((15 + 20 * Math.pow(effectiveSkill, 1.35)) * classDefenseMultiplier)
 *    At 1.0x: 10->11: 15 hits, 11->12: 35 hits
 */
export function getManaNeededForNextMagicLevel(
  currentLevel: number,
  aptitudeMultiplier: number
): number {
  const effectiveSkill = Math.max(0, currentLevel - 10);
  return Math.floor((40 + 50 * Math.pow(effectiveSkill, 1.35)) * aptitudeMultiplier);
}

export function getHitsNeededForNextWeaponLevel(
  currentLevel: number,
  aptitudeMultiplier: number
): number {
  const effectiveSkill = Math.max(0, currentLevel - 10);
  return Math.floor((20 + 30 * Math.pow(effectiveSkill, 1.35)) * aptitudeMultiplier);
}

export function getHitsNeededForNextDefenseLevel(
  currentLevel: number,
  defenseMultiplier: number
): number {
  const effectiveSkill = Math.max(0, currentLevel - 10);
  return Math.floor((15 + 20 * Math.pow(effectiveSkill, 1.35)) * defenseMultiplier);
}

/**
 * Helper to capitalize skill labels.
 */
export function formatSkillName(key: string): string {
  if (!key) return '';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Constructs initial player skills for the given class, applying aptitude multipliers.
 * All skills begin at classic Level 10 baseline floor.
 */
export function createInitialPlayerSkills(classType: CharacterClass): PlayerSkills {
  const aptitudes = CLASS_APTITUDES[classType];

  const origins: Record<MagicOrigin, MagicSkillState> = {
    radiant: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.origins.radiant),
    },
    arcane: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.origins.arcane),
    },
    eldritch: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.origins.eldritch),
    },
    wild: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.origins.wild),
    },
  };

  const elements: Record<ElementSchool, ElementSkillState> = {
    air: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.elements.air),
    },
    fire: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.elements.fire),
    },
    water: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.elements.water),
    },
    earth: {
      level: 10,
      manaSpent: 0,
      manaToNextLevel: getManaNeededForNextMagicLevel(10, aptitudes.elements.earth),
    },
  };

  const weapons: Record<WeaponFamily, WeaponSkillState> = {
    flexible: {
      level: 10,
      hits: 0,
      hitsToNextLevel: getHitsNeededForNextWeaponLevel(10, aptitudes.weapons.flexible),
    },
    sidearms: {
      level: 10,
      hits: 0,
      hitsToNextLevel: getHitsNeededForNextWeaponLevel(10, aptitudes.weapons.sidearms),
    },
    blades: {
      level: 10,
      hits: 0,
      hitsToNextLevel: getHitsNeededForNextWeaponLevel(10, aptitudes.weapons.blades),
    },
  };

  const defense: DefenseSkillState = {
    level: 10,
    hitsTaken: 0,
    hitsToNextLevel: getHitsNeededForNextDefenseLevel(10, aptitudes.defense),
    hitsBlocked: 0,
    nextLevelHits: getHitsNeededForNextDefenseLevel(10, aptitudes.defense),
  };

  return {
    origins,
    elements,
    weapons,
    defense,
    // Backward-compatible scaffolding
    melee: { level: 10, tries: 0, nextLevelTries: getHitsNeededForNextWeaponLevel(10, 1.0) },
    marksmanship: { level: 10, tries: 0, nextLevelTries: getHitsNeededForNextWeaponLevel(10, 1.0) },
    magic: { level: 10, manaSpent: 0, nextLevelMana: getManaNeededForNextMagicLevel(10, 1.0) },
  };
}

/**
 * Creates initial Level 1 stats and multi-axis skills for the chosen class.
 * - Avenger: maxHp 150, maxMp 60, whip dmg 8-12
 * - Sage: maxHp 110, maxMp 120, wand dmg 6-10
 */
export function createInitialPlayerStats(classType: CharacterClass): PlayerStats {
  const isAvenger = classType === 'Avenger';
  const initialSkills = createInitialPlayerSkills(classType);

  const maxHp = isAvenger ? 150 : 110;
  const maxMp = isAvenger ? 60 : 120;
  const baseMinDamage = isAvenger ? 8 : 6;
  const baseMaxDamage = isAvenger ? 12 : 10;

  return {
    classType,
    level: 1,
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    currentXp: 0,
    xpForNextLevel: getXpNeededForLevel(1),
    totalXpEarned: 0,
    baseMinDamage,
    baseMaxDamage,
    skills: initialSkills,
    xp: 0,
  };
}

export interface LevelUpResult {
  leveledUp: boolean;
  levelsGained: number[];
  finalLevel: number;
  totalHpGained: number;
  totalMpGained: number;
  totalMinDmgGained: number;
  totalMaxDmgGained: number;
}

/**
 * Adds XP to the player, evaluates level-up thresholds, supports rollover XP,
 * applies class-specific stat scaling (+12 HP/+8 MP/+1/+1 dmg for Avenger, +6 HP/+16 MP/+1/+1 dmg for Sage),
 * and restores HP & MP to their new maximums.
 */
export function addXp(player: PlayerStats, xpAmount: number): LevelUpResult {
  if (xpAmount <= 0) {
    return {
      leveledUp: false,
      levelsGained: [],
      finalLevel: player.level,
      totalHpGained: 0,
      totalMpGained: 0,
      totalMinDmgGained: 0,
      totalMaxDmgGained: 0,
    };
  }

  // Ensure current stats have proper defaults
  if (player.currentXp === undefined) player.currentXp = player.xp || 0;
  if (!player.xpForNextLevel) player.xpForNextLevel = getXpNeededForLevel(player.level || 1);
  if (player.totalXpEarned === undefined) player.totalXpEarned = player.currentXp;

  player.currentXp += xpAmount;
  player.totalXpEarned += xpAmount;
  player.xp = player.currentXp; // Keep backward-compatible alias in sync

  const levelsGained: number[] = [];
  let totalHpGained = 0;
  let totalMpGained = 0;
  let totalMinDmgGained = 0;
  let totalMaxDmgGained = 0;

  const isAvenger = player.classType === 'Avenger';
  const hpPerLevel = isAvenger ? 12 : 6;
  const mpPerLevel = isAvenger ? 8 : 16;
  const dmgPerLevel = 1;

  while (player.currentXp >= player.xpForNextLevel) {
    // Rollover: subtract the threshold cost of this tier
    player.currentXp -= player.xpForNextLevel;
    player.level += 1;
    levelsGained.push(player.level);

    // Apply class stat scaling
    player.maxHp += hpPerLevel;
    player.maxMp += mpPerLevel;
    player.baseMinDamage = (player.baseMinDamage ?? (isAvenger ? 8 : 6)) + dmgPerLevel;
    player.baseMaxDamage = (player.baseMaxDamage ?? (isAvenger ? 12 : 10)) + dmgPerLevel;

    // Reward: automatically restore HP and MP to new maximum values on level up
    player.hp = player.maxHp;
    player.mp = player.maxMp;

    totalHpGained += hpPerLevel;
    totalMpGained += mpPerLevel;
    totalMinDmgGained += dmgPerLevel;
    totalMaxDmgGained += dmgPerLevel;

    // Recalculate next tier threshold
    player.xpForNextLevel = getXpNeededForLevel(player.level);
  }

  player.xp = player.currentXp;

  return {
    leveledUp: levelsGained.length > 0,
    levelsGained,
    finalLevel: player.level,
    totalHpGained,
    totalMpGained,
    totalMinDmgGained,
    totalMaxDmgGained,
  };
}

/**
 * Combat Stat Scaling from Skills:
 * - Weapon swing damage bonus: + Math.floor(weaponSkillLevel * 0.75)
 * - Spell damage/healing bonus: + Math.floor(originSkillLevel * 0.8) + Math.floor(elementSkillLevel * 0.8)
 */
export function getWeaponSkillDamageBonus(
  player: PlayerStats,
  weaponFamily: WeaponFamily
): number {
  const skill = player.skills?.weapons?.[weaponFamily];
  if (!skill) return 0;
  return Math.floor(skill.level * 0.75);
}

export function getSpellSkillBonus(
  player: PlayerStats,
  origin: MagicOrigin,
  element: ElementSchool
): number {
  const originSkill = player.skills?.origins?.[origin];
  const elementSkill = player.skills?.elements?.[element];
  const originLvl = originSkill?.level ?? 0;
  const elementLvl = elementSkill?.level ?? 0;
  return Math.floor(originLvl * 0.8) + Math.floor(elementLvl * 0.8);
}

/**
 * Recalibrates player skills to ensure all skills start at or above Level 10 floor,
 * updates progression thresholds based on current levels and class aptitudes,
 * and sequentially resolves any overflow progress with rollover.
 */
export function recalibratePlayerSkills(player: PlayerStats): SkillLevelUpEvent[] {
  const events: SkillLevelUpEvent[] = [];
  const aptitudes = CLASS_APTITUDES[player.classType] || CLASS_APTITUDES.Avenger;

  if (!player.skills) {
    player.skills = createInitialPlayerSkills(player.classType);
    return events;
  }

  // 1. Recalibrate Magic Origins
  if (player.skills.origins) {
    (Object.keys(player.skills.origins) as MagicOrigin[]).forEach((origin) => {
      const skill = player.skills.origins[origin];
      if (!skill) return;
      if (skill.level < 10) {
        skill.level = 10;
      }
      const mult = aptitudes.origins[origin] || 1.0;
      skill.manaToNextLevel = getManaNeededForNextMagicLevel(skill.level, mult);

      while (skill.manaSpent >= skill.manaToNextLevel && skill.manaToNextLevel > 0) {
        skill.manaSpent -= skill.manaToNextLevel;
        skill.level += 1;
        skill.manaToNextLevel = getManaNeededForNextMagicLevel(skill.level, mult);
        events.push({
          skillName: formatSkillName(origin),
          category: 'origin',
          newLevel: skill.level,
          color: '#38bdf8',
        });
      }
    });
  }

  // 2. Recalibrate Elements
  if (player.skills.elements) {
    (Object.keys(player.skills.elements) as ElementSchool[]).forEach((el) => {
      const skill = player.skills.elements[el];
      if (!skill) return;
      if (skill.level < 10) {
        skill.level = 10;
      }
      const mult = aptitudes.elements[el] || 1.0;
      skill.manaToNextLevel = getManaNeededForNextMagicLevel(skill.level, mult);

      while (skill.manaSpent >= skill.manaToNextLevel && skill.manaToNextLevel > 0) {
        skill.manaSpent -= skill.manaToNextLevel;
        skill.level += 1;
        skill.manaToNextLevel = getManaNeededForNextMagicLevel(skill.level, mult);
        events.push({
          skillName: formatSkillName(el),
          category: 'element',
          newLevel: skill.level,
          color: '#38bdf8',
        });
      }
    });
  }

  // 3. Recalibrate Weapons
  if (player.skills.weapons) {
    (Object.keys(player.skills.weapons) as WeaponFamily[]).forEach((wf) => {
      const skill = player.skills.weapons[wf];
      if (!skill) return;
      if (skill.level < 10) {
        skill.level = 10;
      }
      const mult = aptitudes.weapons[wf] || 1.0;
      skill.hitsToNextLevel = getHitsNeededForNextWeaponLevel(skill.level, mult);

      while (skill.hits >= skill.hitsToNextLevel && skill.hitsToNextLevel > 0) {
        skill.hits -= skill.hitsToNextLevel;
        skill.level += 1;
        skill.hitsToNextLevel = getHitsNeededForNextWeaponLevel(skill.level, mult);
        events.push({
          skillName: formatSkillName(wf),
          category: 'weapon',
          newLevel: skill.level,
          color: '#fb923c',
        });
      }
    });
  }

  // 4. Recalibrate Defense
  if (player.skills.defense) {
    const def = player.skills.defense;
    if (def.level < 10) {
      def.level = 10;
    }
    const mult = aptitudes.defense || 1.0;
    def.hitsToNextLevel = getHitsNeededForNextDefenseLevel(def.level, mult);
    def.nextLevelHits = def.hitsToNextLevel;

    const currentHits = def.hitsTaken ?? def.hitsBlocked ?? 0;
    def.hitsTaken = currentHits;

    while (def.hitsTaken >= def.hitsToNextLevel && def.hitsToNextLevel > 0) {
      def.hitsTaken -= def.hitsToNextLevel;
      def.level += 1;
      def.hitsToNextLevel = getHitsNeededForNextDefenseLevel(def.level, mult);
      def.nextLevelHits = def.hitsToNextLevel;
      events.push({
        skillName: 'Defense',
        category: 'defense',
        newLevel: def.level,
        color: '#a3e635',
      });
    }
    def.hitsBlocked = def.hitsTaken;
  }

  // Sync backward compatibility scaffolding
  if (player.skills.melee && player.skills.weapons?.flexible) {
    player.skills.melee.level = player.skills.weapons.flexible.level;
    player.skills.melee.nextLevelTries = player.skills.weapons.flexible.hitsToNextLevel;
  }
  if (player.skills.marksmanship && player.skills.weapons?.sidearms) {
    player.skills.marksmanship.level = player.skills.weapons.sidearms.level;
    player.skills.marksmanship.nextLevelTries = player.skills.weapons.sidearms.hitsToNextLevel;
  }
  if (player.skills.magic && player.skills.origins?.arcane) {
    player.skills.magic.level = player.skills.origins.arcane.level;
    player.skills.magic.nextLevelMana = player.skills.origins.arcane.manaToNextLevel;
  }

  return events;
}

/**
 * Record a spell cast:
 * Both its Origin and Element gain manaSpent equal to the spell's cost.
 * When fighting dangerous threats (minLevel >= player.level), applies an active exploration
 * bonus of 1.5x mana value toward magic schools.
 * Evaluates level ups with rollover mana.
 * Spawns cyan floating text: "{SkillName} Up! ({NewLevel})"
 */
export function recordSpellCast(
  player: PlayerStats,
  origin: MagicOrigin,
  element: ElementSchool,
  manaCost: number,
  isDangerousThreat: boolean = false
): SkillLevelUpEvent[] {
  if (!player.skills || manaCost <= 0) return [];

  // Ensure skills structure exists
  if (!player.skills.origins || !player.skills.elements) {
    player.skills = createInitialPlayerSkills(player.classType);
  }

  // Active exploration bonus: 1.5x mana toward magic schools against dangerous threats
  const effectiveMana = isDangerousThreat ? Math.round(manaCost * 1.5) : manaCost;

  const events: SkillLevelUpEvent[] = [];
  const aptitudes = CLASS_APTITUDES[player.classType] || CLASS_APTITUDES.Avenger;

  // 1. Advance Magic Origin
  const originSkill = player.skills.origins[origin];
  if (originSkill) {
    originSkill.manaSpent += effectiveMana;
    const mult = aptitudes.origins[origin] || 1.0;
    while (originSkill.manaSpent >= originSkill.manaToNextLevel && originSkill.manaToNextLevel > 0) {
      originSkill.manaSpent -= originSkill.manaToNextLevel;
      originSkill.level += 1;
      originSkill.manaToNextLevel = getManaNeededForNextMagicLevel(originSkill.level, mult);
      events.push({
        skillName: formatSkillName(origin),
        category: 'origin',
        newLevel: originSkill.level,
        color: '#38bdf8', // Cyan
      });
    }
  }

  // 2. Advance Element School
  const elementSkill = player.skills.elements[element];
  if (elementSkill) {
    elementSkill.manaSpent += effectiveMana;
    const mult = aptitudes.elements[element] || 1.0;
    while (elementSkill.manaSpent >= elementSkill.manaToNextLevel && elementSkill.manaToNextLevel > 0) {
      elementSkill.manaSpent -= elementSkill.manaToNextLevel;
      elementSkill.level += 1;
      elementSkill.manaToNextLevel = getManaNeededForNextMagicLevel(elementSkill.level, mult);
      events.push({
        skillName: formatSkillName(element),
        category: 'element',
        newLevel: elementSkill.level,
        color: '#38bdf8', // Cyan
      });
    }
  }

  // Sync backward compatibility scaffolding
  if (player.skills.magic) {
    player.skills.magic.manaSpent += effectiveMana;
  }

  return events;
}

/**
 * Record a successful weapon hit from an auto-attack:
 * Increments equipped weapon family's hits.
 * When fighting dangerous threats (minLevel >= player.level), grants 2 tries per hit instead of 1.
 * Evaluates level ups with rollover hits.
 * Spawns orange floating text: "{WeaponFamily} Up! ({NewLevel})"
 */
export function recordWeaponHit(
  player: PlayerStats,
  weaponFamily: WeaponFamily,
  hitCountOrDangerous: number | boolean = 1
): SkillLevelUpEvent[] {
  if (!player.skills) return [];

  if (!player.skills.weapons) {
    player.skills = createInitialPlayerSkills(player.classType);
  }

  const hitsToAdd =
    typeof hitCountOrDangerous === 'boolean'
      ? (hitCountOrDangerous ? 2 : 1)
      : hitCountOrDangerous;

  if (hitsToAdd <= 0) return [];

  const events: SkillLevelUpEvent[] = [];
  const aptitudes = CLASS_APTITUDES[player.classType] || CLASS_APTITUDES.Avenger;
  const weaponSkill = player.skills.weapons[weaponFamily];

  if (weaponSkill) {
    weaponSkill.hits += hitsToAdd;
    const mult = aptitudes.weapons[weaponFamily] || 1.0;
    while (weaponSkill.hits >= weaponSkill.hitsToNextLevel && weaponSkill.hitsToNextLevel > 0) {
      weaponSkill.hits -= weaponSkill.hitsToNextLevel;
      weaponSkill.level += 1;
      weaponSkill.hitsToNextLevel = getHitsNeededForNextWeaponLevel(weaponSkill.level, mult);
      events.push({
        skillName: formatSkillName(weaponFamily),
        category: 'weapon',
        newLevel: weaponSkill.level,
        color: '#fb923c', // Orange
      });
    }
  }

  // Sync backward compatibility scaffolding
  if (weaponFamily === 'flexible' || weaponFamily === 'blades') {
    if (player.skills.melee) player.skills.melee.tries += hitsToAdd;
  } else if (weaponFamily === 'sidearms') {
    if (player.skills.marksmanship) player.skills.marksmanship.tries += hitsToAdd;
  }

  return events;
}

/**
 * Record damage taken by player:
 * Increments defense.hitsTaken.
 * When defending against dangerous threats (minLevel >= player.level), grants 2 tries per hit instead of 1.
 * Evaluates level ups with rollover hits.
 * Spawns lime floating text: "Defense Up! ({NewLevel})"
 */
export function recordDefenseHit(
  player: PlayerStats,
  hitCountOrDangerous: number | boolean = 1
): SkillLevelUpEvent[] {
  if (!player.skills) return [];

  if (!player.skills.defense) {
    player.skills = createInitialPlayerSkills(player.classType);
  }

  const hitsToAdd =
    typeof hitCountOrDangerous === 'boolean'
      ? (hitCountOrDangerous ? 2 : 1)
      : hitCountOrDangerous;

  if (hitsToAdd <= 0) return [];

  const events: SkillLevelUpEvent[] = [];
  const aptitudes = CLASS_APTITUDES[player.classType] || CLASS_APTITUDES.Avenger;
  const defSkill = player.skills.defense;

  if (defSkill) {
    defSkill.hitsTaken = (defSkill.hitsTaken ?? 0) + hitsToAdd;
    defSkill.hitsBlocked = defSkill.hitsTaken; // Keep alias in sync
    const mult = aptitudes.defense || 1.0;
    while (defSkill.hitsTaken >= defSkill.hitsToNextLevel && defSkill.hitsToNextLevel > 0) {
      defSkill.hitsTaken -= defSkill.hitsToNextLevel;
      defSkill.level += 1;
      defSkill.hitsToNextLevel = getHitsNeededForNextDefenseLevel(defSkill.level, mult);
      defSkill.nextLevelHits = defSkill.hitsToNextLevel;
      events.push({
        skillName: 'Defense',
        category: 'defense',
        newLevel: defSkill.level,
        color: '#a3e635', // Lime Green
      });
    }
  }

  return events;
}

/**
 * Legacy skill progression hooks (backward compatible with Phase 3 tests).
 */
export function onDamageDealt(
  player: PlayerStats,
  damageType: 'physical' | 'fire' | 'air' | 'arcane',
  _amount: number
): void {
  if (!player.skills) return;

  if (player.classType === 'Avenger' || damageType === 'physical' || damageType === 'fire') {
    recordWeaponHit(player, 'flexible');
  } else {
    recordWeaponHit(player, 'sidearms');
  }
}

export function onManaSpent(player: PlayerStats, spellType: string, amount: number): void {
  if (!player.skills || amount <= 0) return;

  // Map legacy spellType calls to origin/element
  if (spellType === 'cinder_brand' || spellType === 'slot_2') {
    if (player.classType === 'Avenger') {
      recordSpellCast(player, 'radiant', 'fire', amount);
    } else {
      recordSpellCast(player, 'arcane', 'air', amount);
    }
  } else if (spellType === 'entangling_lash' || spellType === 'slot_1') {
    if (player.classType === 'Avenger') {
      recordSpellCast(player, 'radiant', 'earth', amount);
    } else {
      recordSpellCast(player, 'arcane', 'air', amount);
    }
  } else if (
    spellType === 'wand' ||
    spellType === 'confusion' ||
    spellType === 'static_confusion' ||
    spellType === 'gale_shot'
  ) {
    recordSpellCast(player, 'arcane', 'air', amount);
  } else if (player.skills.magic) {
    player.skills.magic.manaSpent += amount;
  }
}

export function onDamageTaken(player: PlayerStats, _incomingDamage: number): void {
  recordDefenseHit(player);
}

/**
 * Web Audio API retro level-up / skill chime (non-blocking).
 */
export function playLevelUpFanfare(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [
      { freq: 440, time: 0, dur: 0.12 }, // A4
      { freq: 554.37, time: 0.11, dur: 0.12 }, // C#5
      { freq: 659.25, time: 0.22, dur: 0.12 }, // E5
      { freq: 880, time: 0.33, dur: 0.35 }, // A5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur);
    });
  } catch {
    // Graceful fallback if audio context is blocked
  }
}

/**
 * Web Audio API retro skill advance chime (lighter 2-note chime).
 */
export function playSkillAdvanceChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const notes = [
      { freq: 587.33, time: 0, dur: 0.1 }, // D5
      { freq: 880, time: 0.09, dur: 0.2 }, // A5
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.dur);
    });
  } catch {
    // Graceful fallback
  }
}
