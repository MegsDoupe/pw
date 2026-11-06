import {
  CharacterClass,
  CorpseEntity,
  ElementSchool,
  EntityResistances,
  EquipmentState,
  EquipSlot,
  ItemDefinition,
  ItemStack,
  MagicOrigin,
  MonsterArchetypeId,
  PlayerStats,
  WeaponFamily,
} from '../types/game';

/**
 * Item Catalog: Comprehensive definitions for weapons, armor, accessories,
 * currencies, consumables, and monster trophies.
 */
export const ITEMS: Record<string, ItemDefinition> = {
  // === 1. WEAPONS ===
  braided_cord_whip: {
    id: 'braided_cord_whip',
    name: 'Braided Cord Whip',
    slot: 'mainHand',
    category: 'weapon',
    description: 'A supple leather whip reinforced with braided copper wire. 2-tile reach.',
    stackable: false,
    weight: 25,
    iconName: 'Whip',
    color: '#f59e0b',
    weaponStats: {
      family: 'flexible',
      minDamage: 8,
      maxDamage: 12,
      reach: 2,
      speedMs: 1400,
      damageType: 'physical',
    },
  },
  aether_pipe_pistol: {
    id: 'aether_pipe_pistol',
    name: 'Aether Pipe-Pistol',
    slot: 'mainHand',
    category: 'weapon',
    description: 'A brass conduit pistol focusing raw ambient aether into needle-point rays. 4-tile reach.',
    stackable: false,
    weight: 30,
    iconName: 'Zap',
    color: '#38bdf8',
    weaponStats: {
      family: 'sidearms',
      minDamage: 6,
      maxDamage: 10,
      reach: 4,
      speedMs: 1600,
      mpCost: 1,
      damageType: 'arcane',
    },
  },
  rusty_iron_shortsword: {
    id: 'rusty_iron_shortsword',
    name: 'Rusty Iron Shortsword',
    slot: 'mainHand',
    category: 'weapon',
    description: 'A notched scavenger blade. Short reach but strikes with swift, brutal physical force.',
    stackable: false,
    weight: 35,
    iconName: 'Sword',
    color: '#e2e8f0',
    weaponStats: {
      family: 'blades',
      minDamage: 10,
      maxDamage: 15,
      reach: 1,
      speedMs: 1200,
      damageType: 'physical',
    },
  },

  // === 2. ARMOR & ACCESSORIES ===
  duelists_tunic: {
    id: 'duelists_tunic',
    name: "Duelist's Tunic",
    slot: 'body',
    category: 'armor',
    description: 'Reinforced boiled-leather vest offering balanced mobility and flat damage soak.',
    stackable: false,
    weight: 40,
    iconName: 'Shirt',
    color: '#d97706',
    armorStats: {
      armor: 2,
      resistances: {
        elements: { fire: 0.10 },
      },
    },
  },
  tinkerers_duster: {
    id: 'tinkerers_duster',
    name: "Tinkerer's Duster",
    slot: 'body',
    category: 'armor',
    description: 'An insulated scholar overcoat stitched with conductive copper thread. Increases Max MP.',
    stackable: false,
    weight: 35,
    iconName: 'Shirt',
    color: '#0284c7',
    armorStats: {
      armor: 1,
      maxMpBonus: 20,
      resistances: {
        origins: { arcane: 0.10 },
        elements: { air: 0.10 },
      },
    },
  },
  scrap_iron_buckler: {
    id: 'scrap_iron_buckler',
    name: 'Scrap Iron Buckler',
    slot: 'offHand',
    category: 'armor',
    description: 'A riveted shield plate cobbled from clockwork chassis debris. Boosts defense and armor.',
    stackable: false,
    weight: 45,
    iconName: 'Shield',
    color: '#94a3b8',
    armorStats: {
      armor: 1,
      defenseSkillBonus: 2,
    },
  },
  copper_ring_of_sparking: {
    id: 'copper_ring_of_sparking',
    name: 'Copper Ring of Sparking',
    slot: 'ring',
    category: 'accessory',
    description: 'A coiled copper band that crackles softly with static charge. Grants +15% Air resistance.',
    stackable: false,
    weight: 2,
    iconName: 'CircleDot',
    color: '#facc15',
    armorStats: {
      armor: 0,
      resistances: {
        elements: { air: 0.15 },
      },
    },
  },

  // === 3. CURRENCY & CONSUMABLES ===
  gold_coin: {
    id: 'gold_coin',
    name: 'Gold Coin',
    slot: 'none',
    category: 'currency',
    description: 'Standard minted sovereign coin of the Old Realm.',
    stackable: true,
    maxStack: 100,
    weight: 0.1,
    iconName: 'Coins',
    color: '#f59e0b',
  },
  minor_healing_salve: {
    id: 'minor_healing_salve',
    name: 'Minor Healing Salve',
    slot: 'consumable',
    category: 'consumable',
    description: 'A soothing herbal tincture. Immediately restores 35 HP on use.',
    stackable: true,
    maxStack: 10,
    weight: 5,
    iconName: 'HeartHandshake',
    color: '#4ade80',
    consumableStats: {
      healHp: 35,
    },
  },

  // === 4. MONSTER TROPHIES ===
  rat_tail: {
    id: 'rat_tail',
    name: 'Rat Tail',
    slot: 'none',
    category: 'trophy',
    description: 'Coarse tail severed from a Giant Rat. Prized by apothecaries.',
    stackable: true,
    maxStack: 100,
    weight: 2,
    iconName: 'Feather',
    color: '#a1a1aa',
  },
  hound_sinew: {
    id: 'hound_sinew',
    name: 'Hound Sinew',
    slot: 'none',
    category: 'trophy',
    description: 'Tough, flexible tendon harvested from a Bramble Hound.',
    stackable: true,
    maxStack: 100,
    weight: 3,
    iconName: 'Activity',
    color: '#f87171',
  },
  scrap_clockwork_gear: {
    id: 'scrap_clockwork_gear',
    name: 'Scrap Clockwork Gear',
    slot: 'none',
    category: 'trophy',
    description: 'A precision-toothed brass gear retrieved from a fallen automaton.',
    stackable: true,
    maxStack: 100,
    weight: 4,
    iconName: 'Cog',
    color: '#fbbf24',
    buyPrice: 12,
    sellPrice: 6,
  },
  acidic_spore_sac: {
    id: 'acidic_spore_sac',
    name: 'Acidic Spore Sac',
    slot: 'none',
    category: 'trophy',
    description: 'A pulsing fungal organ brimming with caustic spores.',
    stackable: true,
    maxStack: 100,
    weight: 3,
    iconName: 'Biohazard',
    color: '#a855f7',
    buyPrice: 10,
    sellPrice: 5,
  },

  // === 5. PHASE 9 SHOP & QUEST ITEMS ===
  travelers_backpack: {
    id: 'travelers_backpack',
    name: "Traveler's Backpack",
    slot: 'consumable',
    category: 'consumable',
    description: 'A rugged oiled-leather rucksack with heavy brass buckles. Permanently grants +50 carrying capacity on use.',
    stackable: false,
    weight: 10,
    iconName: 'Backpack',
    color: '#d97706',
    buyPrice: 40,
    sellPrice: 20,
    consumableStats: {
      capacityBonus: 50,
    },
  },
  padded_leather_vest: {
    id: 'padded_leather_vest',
    name: 'Padded Leather Vest',
    slot: 'body',
    category: 'armor',
    description: 'Tough boiled leather lined with thick sheepskin. Provides +2 physical armor soak.',
    stackable: false,
    weight: 35,
    iconName: 'Shirt',
    color: '#b45309',
    buyPrice: 35,
    sellPrice: 17,
    armorStats: {
      armor: 2,
    },
  },
  mana_phial: {
    id: 'mana_phial',
    name: 'Mana Phial',
    slot: 'consumable',
    category: 'consumable',
    description: 'A pressurized glass ampoule of distilled radiant aether. Restores 40 MP on use.',
    stackable: true,
    maxStack: 10,
    weight: 5,
    iconName: 'Sparkles',
    color: '#38bdf8',
    buyPrice: 12,
    sellPrice: 6,
    consumableStats: {
      restoreMp: 40,
      healMp: 40,
    },
  },
  whipcord_wrap: {
    id: 'whipcord_wrap',
    name: 'Whipcord Wrap',
    slot: 'ring',
    category: 'accessory',
    description: 'Sanctified temple prayer cords wrapped tightly around the knuckles. Grants +1 Flexible Weapon skill.',
    stackable: false,
    weight: 1,
    iconName: 'Award',
    color: '#fbbf24',
    buyPrice: 60,
    sellPrice: 30,
    armorStats: {
      armor: 0,
      resistances: {
        origins: { radiant: 0.05 },
      },
    },
  },
  aether_coil: {
    id: 'aether_coil',
    name: 'Aether Coil',
    slot: 'ring',
    category: 'accessory',
    description: 'A finely tuned galvanic resonance band. Grants +1 Sidearms Weapon skill.',
    stackable: false,
    weight: 1,
    iconName: 'Zap',
    color: '#38bdf8',
    buyPrice: 60,
    sellPrice: 30,
    armorStats: {
      armor: 0,
      resistances: {
        elements: { air: 0.05 },
      },
    },
  },
};

export const BACKPACK_SLOTS_COUNT = 20;

/**
 * Retrieves item definition or a safe fallback.
 */
export function getItemDef(id: string): ItemDefinition {
  return (
    ITEMS[id] || {
      id,
      name: 'Unknown Item',
      slot: 'none',
      description: 'An unidentified relic.',
      stackable: false,
      weight: 1,
      iconName: 'HelpCircle',
    }
  );
}

/**
 * Calculates total carried weight across inventory and equipment.
 */
export function calculateCarriedWeight(
  inventory: (ItemStack | null)[] = [],
  equipment?: EquipmentState
): number {
  let total = 0;

  for (const item of inventory) {
    if (item && item.itemId) {
      const def = getItemDef(item.itemId);
      total += def.weight * item.quantity;
    }
  }

  if (equipment) {
    for (const key of Object.keys(equipment) as (keyof EquipmentState)[]) {
      const item = equipment[key];
      if (item && item.itemId) {
        const def = getItemDef(item.itemId);
        total += def.weight * item.quantity;
      }
    }
  }

  return Math.round(total * 10) / 10;
}

/**
 * Creates default empty equipment paperdoll.
 */
export function createEmptyEquipment(): EquipmentState {
  return {
    head: null,
    body: null,
    legs: null,
    mainHand: null,
    offHand: null,
    ring: null,
  };
}

/**
 * Creates initial 20-slot inventory and equipped starter kit based on class:
 * - Avenger:
 *   * Equipped: Braided Cord Whip in mainHand, Duelist's Tunic in body
 *   * Backpack: 2x Minor Healing Salves, 15x Gold Coins
 * - Sage:
 *   * Equipped: Aether Pipe-Pistol in mainHand, Tinkerer's Duster in body
 *   * Backpack: 2x Minor Healing Salves, 15x Gold Coins
 */
export function createStarterEquipmentAndInventory(classType: CharacterClass): {
  equipment: EquipmentState;
  inventory: (ItemStack | null)[];
} {
  const isAvenger = classType === 'Avenger';
  const equipment = createEmptyEquipment();

  if (isAvenger) {
    equipment.mainHand = { itemId: 'braided_cord_whip', quantity: 1 };
    equipment.body = { itemId: 'duelists_tunic', quantity: 1 };
  } else {
    equipment.mainHand = { itemId: 'aether_pipe_pistol', quantity: 1 };
    equipment.body = { itemId: 'tinkerers_duster', quantity: 1 };
  }

  const inventory: (ItemStack | null)[] = Array(BACKPACK_SLOTS_COUNT).fill(null);
  inventory[0] = { itemId: 'minor_healing_salve', quantity: 2 };
  inventory[1] = { itemId: 'gold_coin', quantity: 15 };

  return { equipment, inventory };
}

/**
 * Recalculates player base stats, weapon families, attack reach, speed, flat armor soak,
 * max MP bonuses, and resistances based on currently equipped gear and level scaling.
 */
export function recalculatePlayerGearStats(stats: PlayerStats): void {
  const isAvenger = stats.classType === 'Avenger';
  const levelBonus = Math.max(0, stats.level - 1);

  // 1. Capacity
  const baseCapacity = isAvenger ? 350 : 280;
  stats.capacityWeight = baseCapacity + (stats.bonusCapacity || 0);

  // 2. Base Innate Resistances
  const baseResistances: EntityResistances = isAvenger
    ? {
        origins: { radiant: 0.25, wild: 0.1, arcane: 0.0, eldritch: -0.15 },
        elements: { fire: 0.25, earth: 0.1, air: 0.0, water: -0.15 },
      }
    : {
        origins: { arcane: 0.25, eldritch: 0.1, radiant: 0.0, wild: -0.15 },
        elements: { air: 0.25, water: 0.1, earth: 0.0, fire: -0.15 },
      };

  let totalArmor = 0;
  let bonusMaxMp = 0;
  const mergedResistances: EntityResistances = {
    origins: { ...baseResistances.origins },
    elements: { ...baseResistances.elements },
  };

  const eq = stats.equipment || createEmptyEquipment();

  // Evaluate Armor & Accessories
  for (const slotKey of Object.keys(eq) as (keyof EquipmentState)[]) {
    const item = eq[slotKey];
    if (!item) continue;
    const def = getItemDef(item.itemId);

    if (def.armorStats) {
      totalArmor += def.armorStats.armor || 0;
      if (def.armorStats.maxMpBonus) {
        bonusMaxMp += def.armorStats.maxMpBonus;
      }
      if (def.armorStats.resistances?.origins) {
        for (const [orig, val] of Object.entries(def.armorStats.resistances.origins)) {
          mergedResistances.origins[orig as MagicOrigin] =
            (mergedResistances.origins[orig as MagicOrigin] || 0) + val;
        }
      }
      if (def.armorStats.resistances?.elements) {
        for (const [elem, val] of Object.entries(def.armorStats.resistances.elements)) {
          mergedResistances.elements[elem as ElementSchool] =
            (mergedResistances.elements[elem as ElementSchool] || 0) + val;
        }
      }
    }
  }

  // 3. Base HP & MP Scaling
  const baseMaxHp = (isAvenger ? 150 : 110) + levelBonus * (isAvenger ? 12 : 6);
  const baseMaxMp = (isAvenger ? 60 : 120) + levelBonus * (isAvenger ? 8 : 16);
  stats.maxHp = baseMaxHp;
  stats.maxMp = baseMaxMp + bonusMaxMp;
  stats.hp = Math.min(stats.maxHp, stats.hp ?? stats.maxHp);
  stats.mp = Math.min(stats.maxMp, stats.mp ?? stats.maxMp);

  // 4. Weapon Handling (mainHand)
  const weaponItem = eq.mainHand;
  if (weaponItem && weaponItem.itemId) {
    const weaponDef = getItemDef(weaponItem.itemId);
    if (weaponDef.weaponStats) {
      stats.baseMinDamage = weaponDef.weaponStats.minDamage + levelBonus;
      stats.baseMaxDamage = weaponDef.weaponStats.maxDamage + levelBonus;
      stats.attackReach = weaponDef.weaponStats.reach;
      stats.attackSpeedMs = weaponDef.weaponStats.speedMs;
      stats.activeWeaponFamily = weaponDef.weaponStats.family;
      stats.weaponMpCost = weaponDef.weaponStats.mpCost ?? 0;
      stats.weaponDamageType = weaponDef.weaponStats.damageType ?? 'physical';
      stats.weaponName = weaponDef.name;
    }
  } else {
    // Unarmed Melee (Fist/Brawl)
    stats.baseMinDamage = 2 + levelBonus;
    stats.baseMaxDamage = 4 + levelBonus;
    stats.attackReach = 1;
    stats.attackSpeedMs = 1500;
    stats.activeWeaponFamily = 'blades';
    stats.weaponMpCost = 0;
    stats.weaponDamageType = 'physical';
    stats.weaponName = 'Unarmed Strike';
  }

  // 5. Final Mitigations & Weight
  stats.armor = totalArmor;
  stats.resistances = mergedResistances;
  stats.currentWeight = calculateCarriedWeight(stats.inventory, eq);
}

/**
 * Attempts to add an item to the player's 20-slot inventory.
 * Stacks if stackable; otherwise places in first open slot.
 * Rejects if weight would exceed player's capacity.
 */
export function addItemToInventory(
  inventory: (ItemStack | null)[],
  itemId: string,
  quantity: number,
  maxCapacity: number,
  currentWeight: number
): { success: boolean; leftover: number; reason?: string } {
  if (quantity <= 0) return { success: true, leftover: 0 };
  const def = getItemDef(itemId);
  const itemWeight = def.weight * quantity;

  if (currentWeight + itemWeight > maxCapacity + 0.001) {
    return {
      success: false,
      leftover: quantity,
      reason: 'Carried weight would exceed maximum capacity.',
    };
  }

  let remaining = quantity;

  // 1. If stackable, find existing stacks
  if (def.stackable) {
    const maxStack = def.maxStack || 100;
    for (let i = 0; i < inventory.length; i++) {
      const slot = inventory[i];
      if (slot && slot.itemId === itemId && slot.quantity < maxStack) {
        const canTake = maxStack - slot.quantity;
        const toAdd = Math.min(canTake, remaining);
        slot.quantity += toAdd;
        remaining -= toAdd;
        if (remaining <= 0) break;
      }
    }
  }

  // 2. Place remaining into empty slots
  if (remaining > 0) {
    for (let i = 0; i < inventory.length; i++) {
      if (inventory[i] === null) {
        const maxStack = def.stackable ? def.maxStack || 100 : 1;
        const toAdd = Math.min(maxStack, remaining);
        inventory[i] = { itemId, quantity: toAdd };
        remaining -= toAdd;
        if (remaining <= 0) break;
      }
    }
  }

  if (remaining > 0) {
    return {
      success: remaining < quantity,
      leftover: remaining,
      reason: 'Backpack is full.',
    };
  }

  return { success: true, leftover: 0 };
}

/**
 * Convenience method to add an ItemStack directly to player inventory,
 * updating carried weight and respecting capacity.
 */
export function addStackToPlayerInventory(
  stats: PlayerStats,
  stack: ItemStack
): { success: boolean; reason?: string } {
  if (!stats.inventory) {
    stats.inventory = Array.from({ length: BACKPACK_SLOTS_COUNT }, () => null);
  }
  const maxCap = stats.capacityWeight ?? 300;
  const currentWt = stats.currentWeight ?? calculateCarriedWeight(stats.inventory, stats.equipment || {});
  const res = addItemToInventory(stats.inventory, stack.itemId, stack.quantity, maxCap, currentWt);
  if (res.success) {
    stats.currentWeight = calculateCarriedWeight(stats.inventory, stats.equipment || {});
    return { success: true };
  }
  return { success: false, reason: res.reason };
}

/**
 * Equips an equippable item from the backpack, swapping with whatever was in that paperdoll slot.
 */
export function equipItem(stats: PlayerStats, inventorySlotIndex: number): boolean {
  if (!stats.inventory || !stats.equipment) return false;
  const item = stats.inventory[inventorySlotIndex];
  if (!item) return false;

  const def = getItemDef(item.itemId);
  const targetSlot = def.slot;

  if (
    targetSlot !== 'head' &&
    targetSlot !== 'body' &&
    targetSlot !== 'legs' &&
    targetSlot !== 'mainHand' &&
    targetSlot !== 'offHand' &&
    targetSlot !== 'ring'
  ) {
    return false; // Not equippable
  }

  const currentlyEquipped = stats.equipment[targetSlot];

  // Move equipped item to inventory slot, and new item to paperdoll slot
  stats.equipment[targetSlot] = item;
  stats.inventory[inventorySlotIndex] = currentlyEquipped ?? null;

  recalculatePlayerGearStats(stats);
  return true;
}

/**
 * Unequips an equipped paperdoll slot back into the first empty inventory slot.
 */
export function unequipItem(stats: PlayerStats, slot: keyof EquipmentState): boolean {
  if (!stats.inventory || !stats.equipment) return false;
  const item = stats.equipment[slot];
  if (!item) return false;

  const emptyIndex = stats.inventory.findIndex((s) => s === null);
  if (emptyIndex === -1) {
    return false; // Backpack full!
  }

  stats.inventory[emptyIndex] = item;
  stats.equipment[slot] = null;

  recalculatePlayerGearStats(stats);
  return true;
}

/**
 * Consumes a consumable item (e.g. Minor Healing Salve) from the inventory slot.
 */
export function useConsumable(
  stats: PlayerStats,
  inventorySlotIndex: number
): { success: boolean; healedHp?: number; restoredMp?: number; capacityBonus?: number } {
  if (!stats.inventory) return { success: false };
  const slot = stats.inventory[inventorySlotIndex];
  if (!slot) return { success: false };

  const def = getItemDef(slot.itemId);
  if (def.slot !== 'consumable' || !def.consumableStats) {
    return { success: false };
  }

  let healedHp = 0;
  let restoredMp = 0;
  let capacityBonus = 0;

  if (def.consumableStats.healHp) {
    const prevHp = stats.hp;
    stats.hp = Math.min(stats.maxHp, stats.hp + def.consumableStats.healHp);
    healedHp = stats.hp - prevHp;
  }

  const mpRestore = def.consumableStats.healMp || def.consumableStats.restoreMp;
  if (mpRestore) {
    const prevMp = stats.mp;
    stats.mp = Math.min(stats.maxMp, stats.mp + mpRestore);
    restoredMp = stats.mp - prevMp;
  }

  if (def.consumableStats.capacityBonus) {
    stats.bonusCapacity = (stats.bonusCapacity || 0) + def.consumableStats.capacityBonus;
    stats.capacityWeight = (stats.capacityWeight || 300) + def.consumableStats.capacityBonus;
    capacityBonus = def.consumableStats.capacityBonus;
  }

  // Deduct 1 from stack
  slot.quantity -= 1;
  if (slot.quantity <= 0) {
    stats.inventory[inventorySlotIndex] = null;
  }

  recalculatePlayerGearStats(stats);
  return { success: true, healedHp, restoredMp, capacityBonus };
}

/**
 * Counts total quantity of an item across all inventory slots.
 */
export function countItemInInventory(stats: PlayerStats, itemId: string): number {
  if (!stats.inventory) return 0;
  return stats.inventory.reduce((total, slot) => {
    return slot && slot.itemId === itemId ? total + slot.quantity : total;
  }, 0);
}

/**
 * Removes a given quantity of an item from inventory across slots.
 * Returns true if successfully removed, or false if not enough items.
 */
export function removeItemFromInventory(
  stats: PlayerStats,
  itemId: string,
  quantity: number
): boolean {
  if (!stats.inventory || quantity <= 0) return false;
  const currentCount = countItemInInventory(stats, itemId);
  if (currentCount < quantity) return false;

  let remainingToRemove = quantity;
  for (let i = 0; i < stats.inventory.length; i++) {
    const slot = stats.inventory[i];
    if (slot && slot.itemId === itemId) {
      if (slot.quantity <= remainingToRemove) {
        remainingToRemove -= slot.quantity;
        stats.inventory[i] = null;
      } else {
        slot.quantity -= remainingToRemove;
        remainingToRemove = 0;
      }
      if (remainingToRemove <= 0) break;
    }
  }

  recalculatePlayerGearStats(stats);
  return true;
}

/**
 * Returns player's current total gold coin count.
 */
export function getPlayerGold(stats: PlayerStats): number {
  const inventoryCoins = countItemInInventory(stats, 'gold_coin');
  return Math.max(inventoryCoins, stats.gold ?? 0);
}

/**
 * Adds gold coins to the player's inventory and updates stats.gold.
 */
export function addPlayerGold(stats: PlayerStats, amount: number): boolean {
  if (amount <= 0) return true;
  const res = addStackToPlayerInventory(stats, { itemId: 'gold_coin', quantity: amount });
  stats.gold = countItemInInventory(stats, 'gold_coin');
  return res.success;
}

/**
 * Deducts gold coins from player inventory and updates stats.gold.
 */
export function deductPlayerGold(stats: PlayerStats, amount: number): boolean {
  if (amount <= 0) return true;
  const currentGold = getPlayerGold(stats);
  if (currentGold < amount) return false;

  const success = removeItemFromInventory(stats, 'gold_coin', amount);
  stats.gold = countItemInInventory(stats, 'gold_coin');
  return success;
}

/**
 * Monster Loot Generation Tables:
 * - Giant Rat: Gold Coins (1-5, 90%), Rat Tail (1, 60%), Minor Healing Salve (1, 15%)
 * - Bramble Hound: Gold Coins (3-8, 90%), Hound Sinew (1, 50%), Rusty Iron Shortsword (1, 8% rare drop)
 * - Clockwork Drone: Gold Coins (5-12, 100%), Scrap Clockwork Gear (1-2, 70%), Scrap Iron Buckler (1, 10% rare drop)
 * - Spore Spitter: Gold Coins (4-10, 90%), Acidic Spore Sac (1, 65%), Copper Ring of Sparking (1, 5% rare drop)
 */
export function rollMonsterLoot(archetype: MonsterArchetypeId): ItemStack[] {
  const drops: ItemStack[] = [];

  const rollRange = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  if (archetype === 'giant_rat') {
    if (Math.random() <= 0.9) {
      drops.push({ itemId: 'gold_coin', quantity: rollRange(1, 5) });
    }
    if (Math.random() <= 0.6) {
      drops.push({ itemId: 'rat_tail', quantity: 1 });
    }
    if (Math.random() <= 0.15) {
      drops.push({ itemId: 'minor_healing_salve', quantity: 1 });
    }
  } else if (archetype === 'bramble_hound') {
    if (Math.random() <= 0.9) {
      drops.push({ itemId: 'gold_coin', quantity: rollRange(3, 8) });
    }
    if (Math.random() <= 0.5) {
      drops.push({ itemId: 'hound_sinew', quantity: 1 });
    }
    if (Math.random() <= 0.08) {
      drops.push({ itemId: 'rusty_iron_shortsword', quantity: 1 });
    }
  } else if (archetype === 'clockwork_drone') {
    // 100% chance for 5-12 Gold Coins
    drops.push({ itemId: 'gold_coin', quantity: rollRange(5, 12) });
    if (Math.random() <= 0.7) {
      drops.push({ itemId: 'scrap_clockwork_gear', quantity: rollRange(1, 2) });
    }
    if (Math.random() <= 0.1) {
      drops.push({ itemId: 'scrap_iron_buckler', quantity: 1 });
    }
  } else if (archetype === 'spore_spitter') {
    if (Math.random() <= 0.9) {
      drops.push({ itemId: 'gold_coin', quantity: rollRange(4, 10) });
    }
    if (Math.random() <= 0.65) {
      drops.push({ itemId: 'acidic_spore_sac', quantity: 1 });
    }
    if (Math.random() <= 0.05) {
      drops.push({ itemId: 'copper_ring_of_sparking', quantity: 1 });
    }
  }

  return drops;
}
