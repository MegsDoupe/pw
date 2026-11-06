import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VILLAGE_NPCS,
  getNpcAt,
  isTileOccupiedByNpc,
  isNpcAdjacent,
  calculateSellPrice,
} from './npcs';
import {
  STARTER_QUEST_ID,
  QUEST_DEFINITIONS,
  ensurePlayerQuests,
  getStarterQuest,
  startQuest,
  onMonsterKilledForQuests,
  isQuestReadyToTurnIn,
  completeQuest,
} from './quests';
import {
  ITEMS,
  useConsumable,
  addStackToPlayerInventory,
  countItemInInventory,
  getPlayerGold,
} from './items';
import { createInitialPlayerStats } from './leveling';
import { worldChunkManager } from './chunks';

test('Village NPCs are correctly positioned in Sanctuary Chunk (0, 0)', () => {
  assert.equal(VILLAGE_NPCS.length, 4);

  const bram = VILLAGE_NPCS.find((n) => n.id === 'bram_provisioner');
  assert.ok(bram);
  assert.equal(bram.gridX, 6);
  assert.equal(bram.gridY, -6);
  assert.equal(bram.role, 'merchant');

  const caelen = VILLAGE_NPCS.find((n) => n.id === 'caelen_smith');
  assert.ok(caelen);
  assert.equal(caelen.gridX, -6);
  assert.equal(caelen.gridY, -6);
  assert.equal(caelen.role, 'merchant');

  const lucinda = VILLAGE_NPCS.find((n) => n.id === 'sister_lucinda');
  assert.ok(lucinda);
  assert.equal(lucinda.gridX, 1);
  assert.equal(lucinda.gridY, -1);
  assert.equal(lucinda.role, 'healer');

  const torin = VILLAGE_NPCS.find((n) => n.id === 'master_torin');
  assert.ok(torin);
  assert.equal(torin.gridX, -6);
  assert.equal(torin.gridY, 6);
  assert.equal(torin.role, 'merchant');

  // Tile lookup helpers
  assert.equal(getNpcAt(1, -1)?.id, 'sister_lucinda');
  assert.equal(getNpcAt(6, -6)?.id, 'bram_provisioner');
  assert.equal(getNpcAt(0, 0), undefined);
  assert.equal(isTileOccupiedByNpc(1, -1), true);
  assert.equal(isTileOccupiedByNpc(0, 0), false);
});

test('NPC adjacency check enforces Chebyshev distance <= 1', () => {
  const lucinda = VILLAGE_NPCS.find((n) => n.id === 'sister_lucinda')!;
  // Player at (0, 0) is diagonally adjacent to Lucinda at (1, -1) -> dist is max(1, 1) = 1
  assert.equal(isNpcAdjacent(0, 0, lucinda), true);
  assert.equal(isNpcAdjacent(1, 0, lucinda), true);
  assert.equal(isNpcAdjacent(2, -1, lucinda), true);

  // Player at (3, 3) is too far
  assert.equal(isNpcAdjacent(3, 3, lucinda), false);
});

test('World ChunkManager blocks movement onto NPC occupied tiles', () => {
  // Lucinda is at (1, -1). Step from (0, 0) with dx=1, dy=-1
  const canWalkIntoLucinda = worldChunkManager.canMove(0, 0, 1, -1);
  assert.equal(canWalkIntoLucinda, false, 'Should not be able to step into NPC tile');

  // Step south to (0, 1) from (0, 0) is walkable floor
  const canWalkHearth = worldChunkManager.canMove(0, 0, 0, 1);
  assert.equal(canWalkHearth, true, 'Hearth floor tile should be walkable');
});

test('Shop pricing and trophy bounties calculate accurately', () => {
  const bram = VILLAGE_NPCS.find((n) => n.id === 'bram_provisioner')!;
  const caelen = VILLAGE_NPCS.find((n) => n.id === 'caelen_smith')!;

  // Bram's special trophy bounty prices
  assert.equal(calculateSellPrice(bram, 'rat_tail', 10), 2);
  assert.equal(calculateSellPrice(bram, 'hound_sinew', 15), 4);
  assert.equal(calculateSellPrice(bram, 'scrap_clockwork_gear', 20), 6);
  assert.equal(calculateSellPrice(bram, 'acidic_spore_sac', 20), 5);

  // Standard non-bounty sell price is 50% of buy price
  assert.equal(calculateSellPrice(caelen, 'rusty_iron_shortsword', 25), 12);
  assert.equal(calculateSellPrice(caelen, 'scrap_iron_buckler', 30), 15);
});

test('Starter Quest lifecycle: from acceptance to turn-in and relic rewards', () => {
  const stats = createInitialPlayerStats('Avenger');
  const questDef = QUEST_DEFINITIONS[STARTER_QUEST_ID];
  assert.ok(questDef);

  // 1. Initial State
  const initialQuest = getStarterQuest(stats);
  assert.equal(initialQuest.status, 'not_started');
  assert.equal(initialQuest.ratsKilled, 0);
  assert.equal(initialQuest.ratsRequired, 5);
  assert.equal(initialQuest.tailsRequired, 3);
  assert.equal(isQuestReadyToTurnIn(initialQuest, stats), false);

  // 2. Accept Quest
  const started = startQuest(stats, STARTER_QUEST_ID);
  assert.equal(started, true);
  assert.equal(getStarterQuest(stats).status, 'active');

  // 3. Kill Monsters: only giant_rat advances the count
  const updatedBramble = onMonsterKilledForQuests(stats, 'bramble_hound');
  assert.equal(updatedBramble, false);
  assert.equal(getStarterQuest(stats).ratsKilled, 0);

  // Kill 4 rats
  for (let i = 0; i < 4; i++) {
    onMonsterKilledForQuests(stats, 'giant_rat');
  }
  assert.equal(getStarterQuest(stats).ratsKilled, 4);
  assert.equal(isQuestReadyToTurnIn(getStarterQuest(stats), stats), false);

  // Kill 5th rat
  onMonsterKilledForQuests(stats, 'giant_rat');
  assert.equal(getStarterQuest(stats).ratsKilled, 5);

  // Even with 5 rats killed, quest is NOT ready because backpack has 0 rat tails
  assert.equal(countItemInInventory(stats, 'rat_tail'), 0);
  assert.equal(isQuestReadyToTurnIn(getStarterQuest(stats), stats), false);

  // Try to complete prematurely
  const prematureTurnIn = completeQuest(stats, STARTER_QUEST_ID, 'whipcord_wrap');
  assert.equal(prematureTurnIn.success, false);

  // 4. Gather 3 Rat Tails into backpack
  addStackToPlayerInventory(stats, { itemId: 'rat_tail', quantity: 3 });
  assert.equal(countItemInInventory(stats, 'rat_tail'), 3);
  assert.equal(isQuestReadyToTurnIn(getStarterQuest(stats), stats), true);

  // 5. Complete Quest with Whipcord Wrap reward
  const startingGold = getPlayerGold(stats);
  const startingFlexibleSkill = stats.skills.weapons.flexible.level;

  const result = completeQuest(stats, STARTER_QUEST_ID, 'whipcord_wrap');
  assert.equal(result.success, true);
  assert.equal(getStarterQuest(stats).status, 'completed');

  // Verify rewards
  // Rat tails removed
  assert.equal(countItemInInventory(stats, 'rat_tail'), 0);
  // Gold increased by 35
  assert.equal(getPlayerGold(stats), startingGold + 35);
  // Leveled up with 50 XP (Level 1 -> Level 2)
  assert.equal(result.leveledUp, true);
  assert.equal(stats.level, 2);
  // Flexible weapon skill increased by +1
  assert.equal(stats.skills.weapons.flexible.level, startingFlexibleSkill + 1);
  // Whipcord wrap added to inventory
  assert.equal(countItemInInventory(stats, 'whipcord_wrap'), 1);
});

test('Phase 9 new items: Mana Phial and Traveler Backpack work properly', () => {
  const stats = createInitialPlayerStats('Sage');
  stats.mp = 10;
  stats.maxMp = 60;
  stats.capacityWeight = 300;

  // Add Mana Phial to inventory and consume it
  addStackToPlayerInventory(stats, { itemId: 'mana_phial', quantity: 1 });
  const phialSlot = stats.inventory!.findIndex((s) => s && s.itemId === 'mana_phial');
  assert.ok(phialSlot >= 0);

  const phialRes = useConsumable(stats, phialSlot);
  assert.equal(phialRes.success, true);
  assert.equal(stats.mp, 50); // 10 + 40

  // Add Traveler's Backpack to inventory and consume it
  addStackToPlayerInventory(stats, { itemId: 'travelers_backpack', quantity: 1 });
  const packSlot = stats.inventory!.findIndex((s) => s && s.itemId === 'travelers_backpack');
  assert.ok(packSlot >= 0);

  const packRes = useConsumable(stats, packSlot);
  assert.equal(packRes.success, true);
  assert.equal(stats.capacityWeight, 330); // Sage base 280 + 50 bonus

  // Padded Leather Vest catalog definition
  assert.ok(ITEMS.padded_leather_vest);
  assert.equal(ITEMS.padded_leather_vest.armorStats?.armor, 2);
  assert.equal(ITEMS.padded_leather_vest.buyPrice, 35);
});
