import React, { useState } from 'react';
import { EquipSlot, EquipmentSlot, EquipmentState, ItemStack, PlayerStats } from '../types/game';
import { getItemDef } from '../game/items';
import {
  X,
  Shield,
  Swords,
  Coins,
  Sparkles,
  Info,
  Heart,
  Zap,
  Target,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

export interface InventoryWindowProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
  onEquipItem: (backpackIndex: number) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onUseConsumable: (backpackIndex: number) => void;
}

const PAPERDOLL_SLOTS: { slot: EquipmentSlot; label: string; icon: string }[] = [
  { slot: 'head', label: 'Helmet', icon: '🪖' },
  { slot: 'body', label: 'Armor', icon: '🥋' },
  { slot: 'legs', label: 'Legs', icon: '👖' },
  { slot: 'mainHand', label: 'Main Hand', icon: '🗡️' },
  { slot: 'offHand', label: 'Off-Hand', icon: '🛡️' },
  { slot: 'ring', label: 'Ring', icon: '💍' },
];

export default function InventoryWindow({
  stats,
  isOpen,
  onClose,
  onEquipItem,
  onUnequipItem,
  onUseConsumable,
}: InventoryWindowProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedEquipSlot, setSelectedEquipSlot] = useState<EquipmentSlot | null>(null);

  if (!isOpen) return null;

  const equipment: EquipmentState = stats.equipment || {};
  const inventory: (ItemStack | null)[] = stats.inventory || [];
  const currentWeight = Math.round((stats.currentWeight ?? 0) * 10) / 10;
  const capacityWeight = stats.capacityWeight ?? 300;
  const capPct = Math.min(100, Math.round((currentWeight / capacityWeight) * 100));

  // 20 fixed backpack slots (4 columns x 5 rows)
  const backpackSlots: (ItemStack | null)[] = Array.from({ length: 20 }, (_, i) => inventory[i] || null);

  // Selected item inspection details
  const inspectedItem: ItemStack | null =
    selectedSlotIndex !== null
      ? backpackSlots[selectedSlotIndex]
      : selectedEquipSlot && equipment[selectedEquipSlot]
      ? equipment[selectedEquipSlot]
      : null;
  const inspectedDef = inspectedItem ? getItemDef(inspectedItem.itemId) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-black/60 font-mono select-none animate-in fade-in duration-150">
      <div className="bg-[#18120e] border-3 border-[#523820] shadow-[0_12px_40px_rgba(0,0,0,0.95)] rounded-md max-w-2xl w-full max-h-[92vh] flex flex-col text-amber-100 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#241a13] border-b-2 border-[#523820] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-sm sm:text-base tracking-wider text-amber-200 uppercase">
              Equipment & Inventory
            </h2>
            <span className="text-[11px] text-zinc-400 bg-[#140e0b] px-2 py-0.5 rounded border border-[#3b2719]">
              {stats.classType} Lv {stats.level}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#3d2a1d] rounded transition-colors cursor-pointer"
            title="Close Inventory [I / Esc]"
            aria-label="Close Inventory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Left Paperdoll, Right 20-Slot Grid */}
        <div className="p-3 sm:p-4 bg-[#110c08] flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* ================= LEFT: EQUIPMENT PAPERDOLL (5 cols) ================= */}
          <div className="md:col-span-5 bg-[#17110c] border border-[#3e2a1b] rounded p-3 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3b2719] mb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Gear Paperdoll
                </span>
                <span className="text-[10px] text-zinc-400">Click to unequip</span>
              </div>

              {/* Paperdoll Slot Grid */}
              <div className="grid grid-cols-2 gap-2">
                {PAPERDOLL_SLOTS.map(({ slot, label, icon }) => {
                  const equipped = equipment[slot];
                  const def = equipped ? getItemDef(equipped.itemId) : null;
                  const isSelected = selectedEquipSlot === slot && selectedSlotIndex === null;

                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedEquipSlot(slot);
                        setSelectedSlotIndex(null);
                        if (equipped) {
                          onUnequipItem(slot);
                        }
                      }}
                      className={`p-2 rounded border text-left flex items-center gap-2 transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'border-amber-400 bg-[#342419] shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : equipped
                          ? 'border-[#5c3e24] bg-[#221710] hover:bg-[#2e1f16]'
                          : 'border-[#2f2015] bg-[#140e0b] hover:bg-[#1d140e] opacity-75'
                      }`}
                      title={
                        equipped && def
                          ? `${label}: ${def.name}\n${def.description}\nClick to Unequip`
                          : `Empty ${label} Slot`
                      }
                    >
                      {/* Slot Graphic */}
                      <div className="w-8 h-8 rounded bg-[#100a07] border border-[#442c1a] flex items-center justify-center shrink-0 text-base shadow-inner">
                        {equipped && def ? (
                          def.category === 'weapon' ? (
                            <Swords className="w-4 h-4 text-amber-200" />
                          ) : (
                            <Shield className="w-4 h-4 text-indigo-300" />
                          )
                        ) : (
                          <span className="opacity-40 text-xs">{icon}</span>
                        )}
                      </div>

                      {/* Slot Text */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                          {label}
                        </div>
                        <div
                          className={`text-[11px] font-bold truncate ${
                            equipped ? 'text-amber-200' : 'text-zinc-600 italic'
                          }`}
                        >
                          {def ? def.name : '(Empty)'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Combat Profile Derived Stats Readout */}
            <div className="bg-[#100b08] border border-[#3b271a] p-2.5 rounded text-[11px] space-y-1">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                Equipped Weapon & Armor
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Weapon Family:</span>
                <span className="text-amber-300 font-bold capitalize">
                  {stats.activeWeaponFamily || 'blades'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Attack Reach:</span>
                <span className="text-amber-300 font-bold">{stats.attackReach ?? 1} tiles</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Attack Speed:</span>
                <span className="text-amber-300 font-bold">
                  {stats.attackSpeedMs ? `${stats.attackSpeedMs}ms` : '1400ms'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Damage Range:</span>
                <span className="text-amber-300 font-bold">
                  {stats.baseMinDamage}-{stats.baseMaxDamage}{' '}
                  {stats.weaponMpCost ? `(${stats.weaponMpCost} MP)` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-400">Armor Soak:</span>
                <span className="text-indigo-300 font-bold">
                  {stats.armor} flat phys
                </span>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: 20-SLOT BACKPACK GRID (7 cols) ================= */}
          <div className="md:col-span-7 bg-[#17110c] border border-[#3e2a1b] rounded p-3 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#3b2719] mb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Backpack (20 Slots)
                </span>
                <span className="text-[10px] text-zinc-400">
                  Click to Equip or Consume
                </span>
              </div>

              {/* 4 columns x 5 rows grid */}
              <div className="grid grid-cols-4 gap-2">
                {backpackSlots.map((item, idx) => {
                  const def = item ? getItemDef(item.itemId) : null;
                  const isSelected = selectedSlotIndex === idx;

                  return (
                    <button
                      key={`slot_${idx}`}
                      onClick={() => {
                        setSelectedSlotIndex(idx);
                        setSelectedEquipSlot(null);
                        if (item && def) {
                          if (def.category === 'consumable') {
                            onUseConsumable(idx);
                          } else if (def.slot) {
                            onEquipItem(idx);
                          }
                        }
                      }}
                      className={`h-15 sm:h-16 rounded border flex flex-col items-center justify-center p-1 relative transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-amber-400 bg-[#342419] shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : item
                          ? 'border-[#523820] bg-[#1f1610] hover:bg-[#2d1f16] hover:border-amber-500/70'
                          : 'border-[#2d1e13] bg-[#130d09] hover:bg-[#1a120c] opacity-60'
                      }`}
                      title={
                        item && def
                          ? `${def.name} (${item.quantity}x)\n${def.description}\nWeight: ${
                              Math.round(def.weight * item.quantity * 10) / 10
                            } oz\nClick to ${
                              def.category === 'consumable' ? 'Use' : 'Equip'
                            }`
                          : `Empty Slot ${idx + 1}`
                      }
                    >
                      {item && def ? (
                        <>
                          {/* Item Icon */}
                          <div className="text-xl sm:text-2xl leading-none">
                            {def.category === 'currency' ? (
                              <Coins className="w-6 h-6 text-amber-400" />
                            ) : def.category === 'weapon' ? (
                              <Swords className="w-6 h-6 text-amber-200" />
                            ) : def.category === 'armor' ? (
                              <Shield className="w-6 h-6 text-indigo-300" />
                            ) : def.category === 'consumable' ? (
                              <Sparkles className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <span>🦴</span>
                            )}
                          </div>

                          {/* Stack Count Badge */}
                          {item.quantity > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/85 text-amber-300 font-bold text-[9px] px-1 rounded border border-amber-600/60 leading-none">
                              {item.quantity}
                            </span>
                          )}

                          {/* Consumable or Equip indicator marker */}
                          {def.category === 'consumable' && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                          )}
                          {def.slot && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]" />
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-zinc-700 font-mono">
                          {idx + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspected Item Tooltip Card */}
            <div className="bg-[#100b08] border border-[#3b271a] p-2.5 rounded min-h-[70px] flex items-center justify-between text-xs">
              {inspectedDef && inspectedItem ? (
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200 text-xs">
                      {inspectedDef.name}{' '}
                      {inspectedItem.quantity > 1 && (
                        <span className="text-amber-400">({inspectedItem.quantity}x)</span>
                      )}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {Math.round(inspectedDef.weight * inspectedItem.quantity * 10) / 10} oz
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    {inspectedDef.description}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] pt-0.5">
                    {inspectedDef.slot && (
                      <span className="text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded font-bold">
                        Slot: {inspectedDef.slot}
                      </span>
                    )}
                    {inspectedDef.weaponStats && (
                      <span className="text-amber-300">
                        {inspectedDef.weaponStats.minDamage}-{inspectedDef.weaponStats.maxDamage}{' '}
                        {inspectedDef.weaponStats.damageType} dmg ({inspectedDef.weaponStats.reach} reach)
                      </span>
                    )}
                    {inspectedDef.armorStats && (
                      <span className="text-indigo-300">
                        +{inspectedDef.armorStats.armor} Armor
                      </span>
                    )}
                    {inspectedDef.consumableStats && (
                      <span className="text-emerald-300 font-bold">
                        Restores {inspectedDef.consumableStats.healHp} HP
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 italic text-[11px] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Select an item in backpack or gear paperdoll to inspect details.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Capacity Weight Gauge */}
        <div className="bg-[#1c140f] border-t-2 border-[#523820] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          {/* Capacity Progress Bar */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
              Capacity:
            </span>
            <div className="flex-1 h-3 bg-[#120c08] border border-[#442f1d] rounded-xs overflow-hidden relative shadow-inner">
              <div
                className={`h-full transition-all duration-300 ${
                  capPct > 90
                    ? 'bg-gradient-to-r from-red-600 to-rose-500'
                    : capPct > 70
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-400'
                }`}
                style={{ width: `${capPct}%` }}
              />
            </div>
            <span
              className={`text-[11px] font-bold tabular-nums ${
                capPct > 90 ? 'text-red-400' : 'text-amber-300'
              }`}
            >
              {currentWeight} / {capacityWeight} oz ({capPct}%)
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#2b1f17] hover:bg-[#3d2a1d] border border-[#523820] text-zinc-300 hover:text-white rounded cursor-pointer transition-colors text-xs font-bold"
            >
              Close [I / Esc]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
