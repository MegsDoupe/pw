import { MonsterArchetypeId, PlayerStats, QuestProgress, QuestStatus } from '../types/game';
import { countItemInInventory, removeItemFromInventory, addPlayerGold, addStackToPlayerInventory } from './items';
import { addXp, playLevelUpFanfare, playSkillAdvanceChime } from './leveling';

export const STARTER_QUEST_ID = 'quest_rat_menace';

export interface QuestDefinition {
  id: string;
  title: string;
  giverNpcId: string;
  giverName: string;
  description: string;
  greetingDialogue: string;
  inProgressDialogue: string;
  readyDialogue: string;
  completedDialogue: string;
  ratsRequired: number;
  tailsRequired: number;
  rewardGold: number;
  rewardXp: number;
  rewardChoices: {
    id: 'whipcord_wrap' | 'aether_coil';
    name: string;
    description: string;
    skillCategory: 'flexible' | 'sidearms';
  }[];
}

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  [STARTER_QUEST_ID]: {
    id: STARTER_QUEST_ID,
    title: 'Pestilence on the Perimeter',
    giverNpcId: 'sister_lucinda',
    giverName: 'Sister Lucinda',
    description: 'Vicious Giant Rats are gnawing at the outskirts near the cobblestone avenues. Cull 5 Giant Rats and bring 3 Rat Tails to Sister Lucinda at the Sacred Hearth.',
    greetingDialogue:
      'Blessings, traveler. The sacred ward keeps our hearth peaceful, but monstrous Giant Rats swarm the perimeter roads just outside. Slay 5 Giant Rats and bring me 3 of their coarse tails so I may brew protective salves. Do this, and the temple shall reward you handsomely.',
    inProgressDialogue:
      'The rats still harass our avenues, traveler. Remember: slay 5 Giant Rats and deliver 3 Rat Tails to cleanse the outskirts.',
    readyDialogue:
      'Praise the Sacred Hearth! You have stemmed the vermin tide. Give me the tails and select your consecration relic.',
    completedDialogue:
      'The village perimeter is secure thanks to your blade and fortitude. May the Hearth light your road into the deeper wilderness.',
    ratsRequired: 5,
    tailsRequired: 3,
    rewardGold: 35,
    rewardXp: 50,
    rewardChoices: [
      {
        id: 'whipcord_wrap',
        name: 'Whipcord Wrap',
        description: 'Knuckle wrap consecrated for whipping strikes. Permanently advances Flexible Weapon skill by +1.',
        skillCategory: 'flexible',
      },
      {
        id: 'aether_coil',
        name: 'Aether Coil',
        description: 'Galvanic focus ring tuned to sidearm ballistics. Permanently advances Sidearms Weapon skill by +1.',
        skillCategory: 'sidearms',
      },
    ],
  },
};

/**
 * Initializes quest records on PlayerStats if not already initialized.
 */
export function ensurePlayerQuests(stats: PlayerStats): Record<string, QuestProgress> {
  if (!stats.quests) {
    stats.quests = {};
  }
  if (!stats.quests[STARTER_QUEST_ID]) {
    const def = QUEST_DEFINITIONS[STARTER_QUEST_ID];
    stats.quests[STARTER_QUEST_ID] = {
      id: def.id,
      title: def.title,
      description: def.description,
      status: 'not_started',
      ratsKilled: 0,
      ratsRequired: def.ratsRequired,
      tailsRequired: def.tailsRequired,
      rewardGold: def.rewardGold,
      rewardXp: def.rewardXp,
    };
  }
  return stats.quests;
}

/**
 * Retrieves the starter quest progress.
 */
export function getStarterQuest(stats: PlayerStats): QuestProgress {
  const quests = ensurePlayerQuests(stats);
  return quests[STARTER_QUEST_ID];
}

/**
 * Begins the starter quest when spoken to Sister Lucinda.
 */
export function startQuest(stats: PlayerStats, questId = STARTER_QUEST_ID): boolean {
  const quests = ensurePlayerQuests(stats);
  const q = quests[questId];
  if (!q || q.status !== 'not_started') return false;

  q.status = 'active';
  return true;
}

/**
 * Tracks monster kill progress for all active quests.
 * Returns true if a quest objective made progress.
 */
export function onMonsterKilledForQuests(
  stats: PlayerStats,
  archetype: MonsterArchetypeId
): boolean {
  const quests = ensurePlayerQuests(stats);
  let updated = false;

  for (const q of Object.values(quests)) {
    if (q.status === 'active' && q.id === STARTER_QUEST_ID) {
      if (archetype === 'giant_rat') {
        if (q.ratsKilled < q.ratsRequired) {
          q.ratsKilled += 1;
          updated = true;
          // Check if ready to turn in
          if (isQuestReadyToTurnIn(q, stats)) {
            q.status = 'ready_to_turn_in';
          }
        }
      }
    }
  }

  return updated;
}

/**
 * Checks if a quest has satisfied both kill count and backpack item requirements.
 */
export function isQuestReadyToTurnIn(quest: QuestProgress, stats: PlayerStats): boolean {
  if (quest.status === 'completed') return false;
  if (quest.id === STARTER_QUEST_ID) {
    const tailsCount = countItemInInventory(stats, 'rat_tail');
    return quest.ratsKilled >= quest.ratsRequired && tailsCount >= quest.tailsRequired;
  }
  return false;
}

/**
 * Turns in the quest to the NPC:
 * 1. Deducts required items from backpack (3 Rat Tails).
 * 2. Awards gold coins (35g).
 * 3. Awards XP (50 XP) and triggers level-up check.
 * 4. Adds chosen relic and grants +1 skill level to chosen weapon family!
 * 5. Sets status to 'completed'.
 */
export function completeQuest(
  stats: PlayerStats,
  questId: string,
  chosenRewardId: 'whipcord_wrap' | 'aether_coil'
): { success: boolean; message: string; leveledUp: boolean } {
  const quests = ensurePlayerQuests(stats);
  const q = quests[questId];
  if (!q) {
    return { success: false, message: 'Quest not found.', leveledUp: false };
  }

  if (q.status === 'completed') {
    return { success: false, message: 'Quest already completed.', leveledUp: false };
  }

  if (!isQuestReadyToTurnIn(q, stats)) {
    return { success: false, message: 'Quest objectives are not yet complete.', leveledUp: false };
  }

  // 1. Remove 3 Rat Tails
  const removedTails = removeItemFromInventory(stats, 'rat_tail', q.tailsRequired);
  if (!removedTails) {
    return {
      success: false,
      message: `You need ${q.tailsRequired} Rat Tails in your backpack to complete this quest.`,
      leveledUp: false,
    };
  }

  // 2. Add 35 Gold
  addPlayerGold(stats, q.rewardGold);

  // 3. Add 50 XP
  const xpResult = addXp(stats, q.rewardXp);

  // 4. Grant chosen reward item & skill bump
  q.rewardChoice = chosenRewardId;
  addStackToPlayerInventory(stats, { itemId: chosenRewardId, quantity: 1 });

  if (chosenRewardId === 'whipcord_wrap') {
    stats.skills.weapons.flexible.level += 1;
    stats.skills.weapons.flexible.hitsToNextLevel = Math.floor(
      20 + 30 * Math.pow(Math.max(0, stats.skills.weapons.flexible.level - 10), 1.35)
    );
  } else if (chosenRewardId === 'aether_coil') {
    stats.skills.weapons.sidearms.level += 1;
    stats.skills.weapons.sidearms.hitsToNextLevel = Math.floor(
      20 + 30 * Math.pow(Math.max(0, stats.skills.weapons.sidearms.level - 10), 1.35)
    );
  }

  // Audio / visual fanfare
  if (xpResult.leveledUp) {
    playLevelUpFanfare();
  } else {
    playSkillAdvanceChime();
  }

  q.status = 'completed';

  return {
    success: true,
    message: `Quest Completed! Received 35 gold, 50 XP, and ${
      chosenRewardId === 'whipcord_wrap' ? 'Whipcord Wrap (+1 Flexible)' : 'Aether Coil (+1 Sidearms)'
    }!`,
    leveledUp: xpResult.leveledUp,
  };
}
