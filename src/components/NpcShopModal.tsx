import React, { useState, useMemo } from 'react';
import { NpcEntity, PlayerStats, ItemStack, QuestProgress } from '../types/game';
import {
  getItemDef,
  getPlayerGold,
  addPlayerGold,
  deductPlayerGold,
  addStackToPlayerInventory,
  removeItemFromInventory,
  countItemInInventory,
} from '../game/items';
import { calculateSellPrice } from '../game/npcs';
import {
  getStarterQuest,
  startQuest,
  isQuestReadyToTurnIn,
  completeQuest,
  QUEST_DEFINITIONS,
  STARTER_QUEST_ID,
} from '../game/quests';
import {
  X,
  Coins,
  ShoppingBag,
  Sparkles,
  Shield,
  Heart,
  Zap,
  Sword,
  Backpack,
  Award,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

export interface NpcShopModalProps {
  npc: NpcEntity;
  playerStats: PlayerStats;
  onClose: () => void;
  onPlayerStatsChange: (stats: PlayerStats) => void;
  onLogMessage?: (msg: string) => void;
}

export default function NpcShopModal({
  npc,
  playerStats,
  onClose,
  onPlayerStatsChange,
  onLogMessage,
}: NpcShopModalProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>(
    npc.role === 'healer' ? 'buy' : 'buy'
  );
  const [selectedReward, setSelectedReward] = useState<'whipcord_wrap' | 'aether_coil'>('whipcord_wrap');
  const [blessingPlayed, setBlessingPlayed] = useState(false);

  const quest = useMemo(() => getStarterQuest(playerStats), [playerStats]);
  const currentGold = useMemo(() => getPlayerGold(playerStats), [playerStats]);
  const currentWeight = playerStats.currentWeight ?? 0;
  const maxCapacity = playerStats.capacityWeight ?? 300;

  // Handle Healing Blessing
  const handleReceiveBlessing = () => {
    const updated = { ...playerStats };
    const missingHp = updated.maxHp - updated.hp;
    const missingMp = updated.maxMp - updated.mp;

    updated.hp = updated.maxHp;
    updated.mp = updated.maxMp;

    setBlessingPlayed(true);
    setTimeout(() => setBlessingPlayed(false), 1200);

    onPlayerStatsChange(updated);
    onLogMessage?.(
      `Sister Lucinda bestows the Sacred Hearth's blessing! Restored ${missingHp} HP and ${missingMp} MP.`
    );
  };

  // Handle Starting Quest
  const handleStartQuest = () => {
    const updated = { ...playerStats };
    startQuest(updated, STARTER_QUEST_ID);
    onPlayerStatsChange(updated);
    onLogMessage?.(`Quest Accepted: "Pestilence on the Perimeter". Slay 5 Giant Rats and gather 3 Rat Tails.`);
  };

  // Handle Turning In Quest
  const handleCompleteQuest = () => {
    const updated = { ...playerStats };
    const result = completeQuest(updated, STARTER_QUEST_ID, selectedReward);
    if (result.success) {
      onPlayerStatsChange(updated);
      onLogMessage?.(result.message);
    } else {
      onLogMessage?.(result.message);
    }
  };

  // Handle Buying Item
  const handleBuyItem = (itemId: string, price: number) => {
    const def = getItemDef(itemId);
    if (currentGold < price) {
      onLogMessage?.(`Cannot purchase ${def.name}: Not enough gold (${currentGold}/${price}g).`);
      return;
    }

    if (currentWeight + def.weight > maxCapacity) {
      onLogMessage?.(`Cannot purchase ${def.name}: Exceeds carrying capacity (${currentWeight + def.weight}/${maxCapacity} oz).`);
      return;
    }

    const updated = { ...playerStats };
    const deducted = deductPlayerGold(updated, price);
    if (!deducted) {
      onLogMessage?.('Transaction failed: unable to deduct coins.');
      return;
    }

    const addRes = addStackToPlayerInventory(updated, { itemId, quantity: 1 });
    if (!addRes.success) {
      // Refund
      addPlayerGold(updated, price);
      onLogMessage?.('Backpack is full!');
      return;
    }

    onPlayerStatsChange(updated);
    onLogMessage?.(`Purchased ${def.name} for ${price} gold coins.`);
  };

  // Handle Selling Item
  const handleSellItem = (slotIndex: number) => {
    if (!playerStats.inventory) return;
    const slot = playerStats.inventory[slotIndex];
    if (!slot) return;

    const def = getItemDef(slot.itemId);
    if (slot.itemId === 'gold_coin') {
      onLogMessage?.('You cannot sell gold coins for gold!');
      return;
    }

    const sellPrice = calculateSellPrice(npc, slot.itemId, def.buyPrice);
    const updated = { ...playerStats };

    // Deduct 1 from stack
    slot.quantity -= 1;
    if (slot.quantity <= 0) {
      updated.inventory![slotIndex] = null;
    }

    addPlayerGold(updated, sellPrice);
    onPlayerStatsChange(updated);
    onLogMessage?.(`Sold 1x ${def.name} to ${npc.name} for ${sellPrice} gold coins.`);
  };

  const tailsCount = countItemInInventory(playerStats, 'rat_tail');
  const readyToTurnIn = isQuestReadyToTurnIn(quest, playerStats);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#2b1b12] to-[#1a100b] border-2 border-[#5c4026] rounded-lg shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]">
        {/* Decorative Golden Corner Accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#d4af37] pointer-events-none" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#d4af37] pointer-events-none" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#d4af37] pointer-events-none" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#d4af37] pointer-events-none" />

        {/* Modal Header */}
        <div className="bg-[#1f130c] border-b border-[#432d1d] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded border border-[#d4af37]/60 flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${npc.color}22` }}
            >
              {npc.role === 'healer' ? (
                <Sparkles className="w-5 h-5 text-amber-400" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-amber-200 tracking-wide">{npc.name}</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#382414] text-amber-400 border border-[#5a3a20]">
                  {npc.title}
                </span>
              </div>
              <p className="text-xs text-stone-400 italic mt-0.5">&ldquo;{npc.greeting}&rdquo;</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#342419] text-stone-400 hover:text-amber-200 transition-colors cursor-pointer"
            aria-label="Close Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet & Capacity Bar */}
        <div className="bg-[#150d08] border-b border-[#382414] px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>
              Purse: <strong className="text-yellow-300">{currentGold}</strong> Gold Coins
            </span>
          </div>
          <div className="flex items-center gap-2 text-stone-300">
            <Backpack className="w-3.5 h-3.5 text-stone-400" />
            <span>
              Carried: <strong className="text-emerald-400">{Math.round(currentWeight * 10) / 10}</strong> /{' '}
              {maxCapacity} oz
            </span>
          </div>
        </div>

        {/* ================= SISTER LUCINDA (HEALER & QUEST GIVER) ================= */}
        {npc.role === 'healer' ? (
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* Hearth Blessing Action */}
            <div className="bg-gradient-to-r from-amber-950/60 to-[#22150d] border border-amber-600/50 rounded-lg p-3.5 shadow-md flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-amber-200 flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 text-red-400" />
                  Sacred Hearth Blessing
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  Channel the altar&apos;s holy resonance to instantly mend all injuries and replenish mana to full.
                </p>
              </div>

              <button
                onClick={handleReceiveBlessing}
                className={`px-4 py-2 rounded font-bold text-xs border transition-all cursor-pointer whitespace-nowrap shadow-md ${
                  blessingPlayed
                    ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                    : 'bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 border-amber-400'
                }`}
              >
                {blessingPlayed ? 'Blessed!' : 'Receive Blessing'}
              </button>
            </div>

            {/* Starter Quest Panel */}
            <div className="bg-[#18110b] border border-[#432d1d] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#382414] pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm text-amber-200">
                    Starter Quest: Pestilence on the Perimeter
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    quest.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : quest.status === 'ready_to_turn_in'
                      ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                      : quest.status === 'active'
                      ? 'bg-sky-950 text-sky-300 border-sky-600'
                      : 'bg-stone-900 text-stone-400 border-stone-700'
                  }`}
                >
                  {quest.status === 'completed'
                    ? 'Completed'
                    : quest.status === 'ready_to_turn_in'
                    ? 'Ready to Turn In'
                    : quest.status === 'active'
                    ? 'In Progress'
                    : 'Available'}
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {quest.status === 'not_started' && QUEST_DEFINITIONS[STARTER_QUEST_ID].greetingDialogue}
                {quest.status === 'active' && !readyToTurnIn && QUEST_DEFINITIONS[STARTER_QUEST_ID].inProgressDialogue}
                {readyToTurnIn && quest.status !== 'completed' && QUEST_DEFINITIONS[STARTER_QUEST_ID].readyDialogue}
                {quest.status === 'completed' && QUEST_DEFINITIONS[STARTER_QUEST_ID].completedDialogue}
              </p>

              {/* Objectives List */}
              <div className="bg-[#120c08] border border-[#2b1b12] rounded p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-300">1. Slay Giant Rats in Outskirts:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      quest.ratsKilled >= quest.ratsRequired ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {quest.ratsKilled} / {quest.ratsRequired}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-300">2. Deliver Rat Tails in Backpack:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      tailsCount >= quest.tailsRequired ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {tailsCount} / {quest.tailsRequired}
                  </span>
                </div>
              </div>

              {/* Rewards Summary */}
              <div className="text-[11px] text-stone-400 flex items-center justify-between pt-1">
                <span>
                  Rewards: <strong className="text-amber-300">35 Gold</strong> +{' '}
                  <strong className="text-yellow-300">50 XP</strong> + Choice of Relic
                </span>
              </div>

              {/* Quest Action Buttons */}
              {quest.status === 'not_started' && (
                <button
                  onClick={handleStartQuest}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs rounded border border-amber-400 shadow-md cursor-pointer transition-all"
                >
                  Accept Quest
                </button>
              )}

              {readyToTurnIn && quest.status !== 'completed' && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-amber-200">Choose Your Reward:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedReward('whipcord_wrap')}
                      className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                        selectedReward === 'whipcord_wrap'
                          ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                          : 'bg-[#18110b] border-[#382414] text-stone-400 hover:border-stone-500'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-amber-300">
                        <Award className="w-3.5 h-3.5" />
                        Whipcord Wrap
                      </div>
                      <p className="text-[10px] text-stone-300 mt-1">+1 Flexible Weapon Skill (Avenger)</p>
                    </button>

                    <button
                      onClick={() => setSelectedReward('aether_coil')}
                      className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                        selectedReward === 'aether_coil'
                          ? 'bg-sky-950/80 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                          : 'bg-[#18110b] border-[#382414] text-stone-400 hover:border-stone-500'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-sky-300">
                        <Zap className="w-3.5 h-3.5" />
                        Aether Coil
                      </div>
                      <p className="text-[10px] text-stone-300 mt-1">+1 Sidearms Weapon Skill (Sage)</p>
                    </button>
                  </div>

                  <button
                    onClick={handleCompleteQuest}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-950 font-bold text-xs rounded border border-emerald-300 shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 animate-bounce"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Turn In Quest & Claim Rewards
                  </button>
                </div>
              )}

              {quest.status === 'completed' && (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/40 rounded text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Quest Completed! You have secured the Sacred Hearth.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= MERCHANT SHOPS (BRAM, CAELEN, TORIN) ================= */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex border-b border-[#382414] bg-[#120c08] shrink-0">
              <button
                onClick={() => setActiveTab('buy')}
                className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'buy'
                    ? 'border-amber-400 text-amber-200 bg-[#24170f]'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Buy Goods
              </button>

              <button
                onClick={() => setActiveTab('sell')}
                className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'sell'
                    ? 'border-amber-400 text-amber-200 bg-[#24170f]'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                Sell Trophies & Gear
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {activeTab === 'buy' ? (
                /* BUY LIST */
                npc.buyList && npc.buyList.length > 0 ? (
                  npc.buyList.map((item) => {
                    const def = getItemDef(item.itemId);
                    const canAfford = currentGold >= item.price;
                    const canCarry = currentWeight + def.weight <= maxCapacity;

                    return (
                      <div
                        key={item.itemId}
                        className="bg-[#1a120b] border border-[#382414] hover:border-[#5a3a20] rounded p-2.5 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded border border-amber-500/40 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${def.color || '#a1a1aa'}20` }}
                          >
                            <Sword className="w-4 h-4" style={{ color: def.color || '#f59e0b' }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-amber-200 text-xs truncate">{def.name}</div>
                            <div className="text-[10px] text-stone-400 truncate mt-0.5">
                              {def.description}
                            </div>
                            <div className="text-[9px] text-stone-400 flex items-center gap-2 mt-1">
                              <span>Weight: {def.weight} oz</span>
                              {def.weaponStats && (
                                <span className="text-amber-300">
                                  Dmg: {def.weaponStats.minDamage}-{def.weaponStats.maxDamage} (Reach: {def.weaponStats.reach})
                                </span>
                              )}
                              {def.armorStats && def.armorStats.armor > 0 && (
                                <span className="text-sky-300">Armor: +{def.armorStats.armor}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuyItem(item.itemId, item.price)}
                          disabled={!canAfford || !canCarry}
                          className={`px-3 py-1.5 rounded font-bold text-xs border shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                            canAfford && canCarry
                              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 border-amber-300 shadow-sm'
                              : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{item.price}g</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-stone-500 py-6 italic">
                    This shopkeeper currently has no goods for sale.
                  </div>
                )
              ) : (
                /* SELL LIST */
                playerStats.inventory && playerStats.inventory.some((s) => s && s.itemId !== 'gold_coin') ? (
                  playerStats.inventory.map((slot, idx) => {
                    if (!slot || slot.itemId === 'gold_coin') return null;
                    const def = getItemDef(slot.itemId);
                    const sellPrice = calculateSellPrice(npc, slot.itemId, def.buyPrice);

                    return (
                      <div
                        key={`${slot.itemId}_${idx}`}
                        className="bg-[#1a120b] border border-[#382414] hover:border-[#5a3a20] rounded p-2.5 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded border border-amber-500/40 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${def.color || '#a1a1aa'}20` }}
                          >
                            <Backpack className="w-4 h-4 text-amber-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-amber-200 text-xs truncate">
                              {def.name} <span className="text-stone-400 font-normal">x{slot.quantity}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 truncate mt-0.5">
                              {def.category === 'trophy' ? 'Monster Trophy' : def.category || 'Gear'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSellItem(idx)}
                          className="px-3 py-1.5 rounded font-bold text-xs bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400 shadow-sm shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Sell 1x for</span>
                          <span className="text-yellow-300">{sellPrice}g</span>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-stone-500 py-6 italic">
                    Your backpack contains no items to sell. Hunt monsters in the Outskirts to gather trophies!
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
