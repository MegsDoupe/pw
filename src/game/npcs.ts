import { NpcEntity } from '../types/game';

export const VILLAGE_NPCS: NpcEntity[] = [
  {
    id: 'bram_provisioner',
    name: 'Bram the Provisioner',
    title: 'General Store',
    role: 'merchant',
    gridX: 6,
    gridY: -6,
    greeting: 'Safe travels, wanderer. I buy monster trophies and stock essentials for the wilderness.',
    color: '#d97706', // warm amber merchant robe
    buyList: [
      { itemId: 'minor_healing_salve', price: 8 },
      { itemId: 'travelers_backpack', price: 40 },
    ],
    trophyPrices: {
      rat_tail: 2,
      hound_sinew: 4,
      scrap_clockwork_gear: 6,
      acidic_spore_sac: 5,
    },
  },
  {
    id: 'caelen_smith',
    name: 'Caelen the Smith',
    title: 'Blacksmith',
    role: 'merchant',
    gridX: -6,
    gridY: -6,
    greeting: 'Cold iron and forged brass. Need something sturdy that can take a beating?',
    color: '#94a3b8', // iron gray smith apron
    buyList: [
      { itemId: 'rusty_iron_shortsword', price: 25 },
      { itemId: 'scrap_iron_buckler', price: 30 },
      { itemId: 'padded_leather_vest', price: 35 },
    ],
    trophyPrices: {
      scrap_clockwork_gear: 7, // Smith pays a bonus for automaton clockwork gears!
    },
  },
  {
    id: 'sister_lucinda',
    name: 'Sister Lucinda',
    title: 'Temple Priestess & Healer',
    role: 'healer',
    gridX: 1,
    gridY: -1,
    greeting: 'Peace be with you, child. Rest by the Sacred Hearth and let its warmth restore your vigor.',
    color: '#fbbf24', // golden consecrated vestment
    questId: 'quest_rat_menace',
  },
  {
    id: 'master_torin',
    name: 'Master Torin',
    title: 'Arcana Emporium',
    role: 'merchant',
    gridX: -6,
    gridY: 6,
    greeting: 'The ambient aether hums with subtle resonance today. Care to inspect my curios?',
    color: '#38bdf8', // radiant cyan arcanist mantle
    buyList: [
      { itemId: 'copper_ring_of_sparking', price: 50 },
      { itemId: 'mana_phial', price: 12 },
    ],
    trophyPrices: {
      acidic_spore_sac: 6, // Arcanist pays extra for alchemical spore sacs
    },
  },
];

/**
 * Finds an NPC at a given world grid coordinate.
 */
export function getNpcAt(gridX: number, gridY: number): NpcEntity | undefined {
  return VILLAGE_NPCS.find((npc) => npc.gridX === gridX && npc.gridY === gridY);
}

/**
 * Checks if a tile is occupied by an NPC.
 */
export function isTileOccupiedByNpc(gridX: number, gridY: number): boolean {
  return VILLAGE_NPCS.some((npc) => npc.gridX === gridX && npc.gridY === gridY);
}

/**
 * Checks Chebyshev interaction distance (within 1 tile).
 */
export function isNpcAdjacent(playerX: number, playerY: number, npc: NpcEntity): boolean {
  return Math.max(Math.abs(playerX - npc.gridX), Math.abs(playerY - npc.gridY)) <= 1;
}

/**
 * Calculates sell price for an item when trading with an NPC.
 * Monster trophies use the NPC's specific bounty table if specified,
 * otherwise default trophy value or 50% catalog price.
 */
export function calculateSellPrice(npc: NpcEntity, itemId: string, itemCatalogPrice?: number): number {
  if (npc.trophyPrices && npc.trophyPrices[itemId] !== undefined) {
    return npc.trophyPrices[itemId];
  }
  // Default trophy prices
  if (itemId === 'rat_tail') return 2;
  if (itemId === 'hound_sinew') return 4;
  if (itemId === 'scrap_clockwork_gear') return 6;
  if (itemId === 'acidic_spore_sac') return 5;

  if (itemCatalogPrice && itemCatalogPrice > 0) {
    return Math.max(1, Math.floor(itemCatalogPrice * 0.5));
  }

  return 1;
}
