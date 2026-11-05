import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEMS,
  getItemDef,
  calculateCarriedWeight,
  createStarterEquipmentAndInventory,
  recalculatePlayerGearStats,
  addItemToInventory,
  equipItem,
  unequipItem,
  useConsumable,
  rollMonsterLoot,
} from './items';
import { createInitialPlayerStats } from './leveling';
import { EquipmentState, ItemStack, PlayerStats } from '../types/game';

test('ITEMS catalog contains required Phase 7 equipment and commodities', () => {
  // Weapons
  assert.ok(ITEMS.braided_cord_whip);
  assert.equal(ITEMS.braided_cord_whip.weaponStats?.reach, 2);
  assert.equal(ITEMS.braided_cord_whip.weaponStats?.family, 'flexible');

  assert.ok(ITEMS.aether_pipe_pistol);
  assert.equal(ITEMS.aether_pipe_pistol.weaponStats?.reach, 4);
  assert.equal(ITEMS.aether_pipe_pistol.weaponStats?.family, 'sidearms');

  assert.ok(ITEMS.rusty_iron_shortsword);
  assert.equal(ITEMS.rusty_iron_shortsword.weaponStats?.reach, 1);
  assert.equal(ITEMS.rusty_iron_shortsword.weaponStats?.family, 'blades');

  // Armor & accessories
  assert.equal(ITEMS.duelists_tunic.armorStats?.armor, 2);
  assert.equal(ITEMS.tinkerers_duster.armorStats?.maxMpBonus, 20);
  assert.equal(ITEMS.scrap_iron_buckler.armorStats?.armor, 1);
  assert.equal(ITEMS.copper_ring_of_sparking.armorStats?.resistances?.elements?.air, 0.15);

  // Consumables & trophies
  assert.equal(ITEMS.minor_healing_salve.consumableStats?.healHp, 35);
  assert.equal(ITEMS.gold_coin.stackable, true);
  assert.ok(ITEMS.rat_tail && ITEMS.hound_sinew && ITEMS.scrap_clockwork_gear && ITEMS.acidic_spore_sac);
});

test('createStarterEquipmentAndInventory provisions class kit with accurate weight & equipment', () => {
  const avengerKit = createStarterEquipmentAndInventory('Avenger');
  assert.equal(avengerKit.equipment.mainHand?.itemId, 'braided_cord_whip');
  assert.equal(avengerKit.equipment.body?.itemId, 'duelists_tunic');
  assert.equal(avengerKit.inventory[0]?.itemId, 'minor_healing_salve');
  assert.equal(avengerKit.inventory[0]?.quantity, 2);
  assert.equal(avengerKit.inventory[1]?.itemId, 'gold_coin');
  assert.equal(avengerKit.inventory[1]?.quantity, 15);

  const sageKit = createStarterEquipmentAndInventory('Sage');
  assert.equal(sageKit.equipment.mainHand?.itemId, 'aether_pipe_pistol');
  assert.equal(sageKit.equipment.body?.itemId, 'tinkerers_duster');
  assert.equal(sageKit.inventory[0]?.itemId, 'minor_healing_salve');
  assert.equal(sageKit.inventory[1]?.quantity, 15);

  const weight = calculateCarriedWeight(avengerKit.inventory, avengerKit.equipment);
  // Whip: 25, Tunic: 40, Salves: 5*2=10, Coins: 15*0.1=1.5 -> Total = 76.5
  assert.equal(weight, 76.5);
});

test('recalculatePlayerGearStats alters combat reach, family, damage, armor, and resistances', () => {
  const stats = createInitialPlayerStats('Avenger');
  const starter = createStarterEquipmentAndInventory('Avenger');
  stats.equipment = starter.equipment;
  stats.inventory = starter.inventory;
  recalculatePlayerGearStats(stats);

  // Initial Avenger with Whip + Tunic
  assert.equal(stats.activeWeaponFamily, 'flexible');
  assert.equal(stats.attackReach, 2);
  assert.equal(stats.baseMinDamage, 8);
  assert.equal(stats.baseMaxDamage, 12);
  assert.equal(stats.armor, 2);
  // Base fire res 0.25 + Tunic fire res 0.10 = 0.35
  assert.equal(Math.round((stats.resistances?.elements.fire ?? 0) * 100) / 100, 0.35);

  // Put a Rusty Iron Shortsword in inventory slot 2 and equip it
  stats.inventory[2] = { itemId: 'rusty_iron_shortsword', quantity: 1 };
  const equipSuccess = equipItem(stats, 2);
  assert.equal(equipSuccess, true);

  // Weapon should now be Blades (1-tile reach, 10-15 damage)
  assert.equal(stats.equipment.mainHand?.itemId, 'rusty_iron_shortsword');
  assert.equal(stats.inventory[2]?.itemId, 'braided_cord_whip', 'Whip swapped to inventory');
  assert.equal(stats.activeWeaponFamily, 'blades');
  assert.equal(stats.attackReach, 1);
  assert.equal(stats.baseMinDamage, 10);
  assert.equal(stats.baseMaxDamage, 15);

  // Equip Scrap Iron Buckler into offHand
  stats.inventory[3] = { itemId: 'scrap_iron_buckler', quantity: 1 };
  equipItem(stats, 3);
  assert.equal(stats.armor, 3, 'Tunic (2) + Buckler (1) = 3 total armor');

  // Equip Copper Ring of Sparking
  stats.inventory[4] = { itemId: 'copper_ring_of_sparking', quantity: 1 };
  equipItem(stats, 4);
  assert.equal(stats.resistances?.elements.air, 0.15, 'Gained +15% Air resistance');

  // Unequip weapon
  unequipItem(stats, 'mainHand');
  assert.equal(stats.equipment.mainHand, null);
  assert.equal(stats.activeWeaponFamily, 'blades', 'Falls back to unarmed brawl');
  assert.equal(stats.baseMinDamage, 2);
  assert.equal(stats.baseMaxDamage, 4);
  assert.equal(stats.attackReach, 1);
});

test('addItemToInventory respects capacity weight and stack limits', () => {
  const inventory: (ItemStack | null)[] = Array(20).fill(null);
  const maxCap = 100;
  let currentWeight = 0;

  // Add 50 gold coins (5 weight)
  const addCoins = addItemToInventory(inventory, 'gold_coin', 50, maxCap, currentWeight);
  assert.equal(addCoins.success, true);
  assert.equal(inventory[0]?.quantity, 50);
  currentWeight = calculateCarriedWeight(inventory);
  assert.equal(currentWeight, 5.0);

  // Stack 40 more gold coins into same slot
  const stackCoins = addItemToInventory(inventory, 'gold_coin', 40, maxCap, currentWeight);
  assert.equal(stackCoins.success, true);
  assert.equal(inventory[0]?.quantity, 90);
  assert.equal(inventory[1], null, 'Stacked into first slot');

  // Exceeding capacity should reject
  const heavyItemWeight = 150; // would exceed 100 cap
  ITEMS.test_heavy = {
    id: 'test_heavy',
    name: 'Heavy Anvil',
    slot: 'none',
    description: 'Very heavy',
    stackable: false,
    weight: heavyItemWeight,
    iconName: 'Box',
  };
  const rejectHeavy = addItemToInventory(inventory, 'test_heavy', 1, maxCap, currentWeight);
  assert.equal(rejectHeavy.success, false);
  assert.ok(rejectHeavy.reason?.includes('exceed'));
});

test('useConsumable heals player and consumes from stack', () => {
  const stats = createInitialPlayerStats('Avenger');
  stats.hp = 50; // Damaged from max 150
  stats.inventory = Array(20).fill(null);
  stats.inventory[0] = { itemId: 'minor_healing_salve', quantity: 2 };

  const use1 = useConsumable(stats, 0);
  assert.equal(use1.success, true);
  assert.equal(use1.healedHp, 35);
  assert.equal(stats.hp, 85);
  assert.equal(stats.inventory[0]?.quantity, 1);

  // Use second salve to empty stack
  const use2 = useConsumable(stats, 0);
  assert.equal(use2.success, true);
  assert.equal(stats.hp, 120);
  assert.equal(stats.inventory[0], null, 'Stack consumed and cleared');
});

test('rollMonsterLoot drops expected loot for each archetype', () => {
  // Test 100 drops of each archetype to ensure valid generation
  const ratDrops = Array.from({ length: 50 }, () => rollMonsterLoot('giant_rat')).flat();
  assert.ok(ratDrops.some((d) => d.itemId === 'gold_coin'));
  assert.ok(ratDrops.every((d) => ['gold_coin', 'rat_tail', 'minor_healing_salve'].includes(d.itemId)));

  const houndDrops = Array.from({ length: 50 }, () => rollMonsterLoot('bramble_hound')).flat();
  assert.ok(houndDrops.some((d) => d.itemId === 'gold_coin'));
  assert.ok(houndDrops.every((d) => ['gold_coin', 'hound_sinew', 'rusty_iron_shortsword'].includes(d.itemId)));

  const droneDrops = Array.from({ length: 50 }, () => rollMonsterLoot('clockwork_drone')).flat();
  // Clockwork Drone has 100% chance for gold
  assert.ok(droneDrops.some((d) => d.itemId === 'gold_coin'));
  assert.ok(droneDrops.every((d) => ['gold_coin', 'scrap_clockwork_gear', 'scrap_iron_buckler'].includes(d.itemId)));

  const spitterDrops = Array.from({ length: 50 }, () => rollMonsterLoot('spore_spitter')).flat();
  assert.ok(spitterDrops.some((d) => d.itemId === 'gold_coin'));
  assert.ok(spitterDrops.every((d) => ['gold_coin', 'acidic_spore_sac', 'copper_ring_of_sparking'].includes(d.itemId)));
});
