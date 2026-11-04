import { CharacterClass, PlayerSkills, PlayerStats } from '../types/game';

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

/**
 * Creates initial Level 1 stats and skills for the chosen class.
 * - Avenger: maxHp 150, maxMp 60, whip dmg 8-12
 * - Sage: maxHp 110, maxMp 120, wand dmg 6-10
 */
export function createInitialPlayerStats(classType: CharacterClass): PlayerStats {
  const isAvenger = classType === 'Avenger';
  const initialSkills: PlayerSkills = {
    melee: { level: 10, tries: 0, nextLevelTries: 50 },
    marksmanship: { level: 10, tries: 0, nextLevelTries: 50 },
    magic: { level: 0, manaSpent: 0, nextLevelMana: 100 },
    defense: { level: 10, hitsBlocked: 0, nextLevelHits: 40 },
  };

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
 * Skill progression hooks ("train skills by doing" scaffolding).
 * Hook points for future skill training without refactoring core loops.
 */
export function onDamageDealt(
  player: PlayerStats,
  damageType: 'physical' | 'fire' | 'air' | 'arcane',
  _amount: number
): void {
  if (!player.skills) return;

  if (player.classType === 'Avenger' || damageType === 'physical' || damageType === 'fire') {
    player.skills.melee.tries += 1;
  } else {
    player.skills.marksmanship.tries += 1;
  }
}

export function onManaSpent(player: PlayerStats, _spellType: string, amount: number): void {
  if (!player.skills) return;
  if (amount > 0) {
    player.skills.magic.manaSpent += amount;
  }
}

export function onDamageTaken(player: PlayerStats, _incomingDamage: number): void {
  if (!player.skills) return;
  player.skills.defense.hitsBlocked += 1;
}

/**
 * Web Audio API retro level-up fanfare chime (non-blocking).
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
