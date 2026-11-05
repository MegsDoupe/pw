import React, { useEffect } from 'react';
import { CorpseEntity, ItemStack } from '../types/game';
import { getItemDef } from '../game/items';
import { Skull, X, Coins, PackageOpen, ArrowDownToLine, Sparkles, Shield, Swords } from 'lucide-react';

export interface CorpseLootModalProps {
  corpse: CorpseEntity | null;
  isOpen: boolean;
  currentWeight: number;
  capacityWeight: number;
  onClose: () => void;
  onLootItem: (index: number) => void;
  onTakeAll: () => void;
}

export default function CorpseLootModal({
  corpse,
  isOpen,
  currentWeight,
  capacityWeight,
  onClose,
  onLootItem,
  onTakeAll,
}: CorpseLootModalProps) {
  // Hotkey support for quick looting (Space/Enter: Take All, Esc: Close)
  useEffect(() => {
    if (!isOpen || !corpse) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space' || e.code === 'Enter') {
        // Only trigger Take All if not focused on another interactive input
        if ((e.target as HTMLElement)?.tagName !== 'BUTTON') {
          e.preventDefault();
          onTakeAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, corpse, onClose, onTakeAll]);

  if (!isOpen || !corpse) return null;

  const totalItemsCount = corpse.items.length;
  const freeCap = Math.max(0, capacityWeight - currentWeight);

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-150">
      <div className="bg-[#18120e] border-3 border-[#523820] shadow-[0_10px_35px_rgba(0,0,0,0.9)] rounded max-w-md w-full overflow-hidden text-amber-100 flex flex-col">
        {/* Header Bar */}
        <div className="bg-[#241a13] border-b-2 border-[#523820] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wider text-amber-200 uppercase">
              {corpse.monsterName} Remains
            </h3>
            <span className="text-[10px] text-zinc-400 bg-[#140e0b] px-1.5 py-0.5 rounded border border-[#3b2719]">
              ({corpse.gridX}, {corpse.gridY})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#3d2a1d] rounded transition-colors cursor-pointer"
            title="Close Container [Esc]"
            aria-label="Close Container"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpse Inventory Area */}
        <div className="p-3 bg-[#110c08] min-h-[160px] max-h-[300px] overflow-y-auto space-y-2">
          {totalItemsCount === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center text-zinc-500 italic text-xs gap-1">
              <PackageOpen className="w-8 h-8 text-zinc-600" />
              <span>This corpse is empty.</span>
              <span className="text-[10px] text-zinc-600">Remains will decay in time.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {corpse.items.map((item, idx) => {
                const def = getItemDef(item.itemId);
                if (!def) return null;
                const itemTotalWeight = Math.round(def.weight * item.quantity * 10) / 10;
                const canFitWeight = freeCap >= itemTotalWeight;

                return (
                  <button
                    key={`${item.itemId}_${idx}`}
                    onClick={() => onLootItem(idx)}
                    className="p-2 bg-[#1d1510] hover:bg-[#2b1f17] border border-[#3f2b1c] hover:border-amber-400/70 rounded transition-all cursor-pointer flex items-center gap-2.5 text-left group"
                    title={`Click to loot ${def.name} (${itemTotalWeight} oz)`}
                  >
                    {/* Item Icon Badge */}
                    <div className="w-9 h-9 rounded bg-[#130d09] border border-[#4d3623] flex items-center justify-center shrink-0 relative shadow-inner">
                      {def.category === 'currency' ? (
                        <Coins className="w-5 h-5 text-amber-400" />
                      ) : def.category === 'weapon' ? (
                        <Swords className="w-5 h-5 text-amber-200" />
                      ) : def.category === 'armor' ? (
                        <Shield className="w-5 h-5 text-indigo-300" />
                      ) : def.category === 'consumable' ? (
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <span className="text-sm">🦴</span>
                      )}

                      {/* Stack Count Badge */}
                      {item.quantity > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-black/85 text-amber-300 font-bold text-[9px] px-1 rounded border border-amber-600/60 leading-none">
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-amber-200 group-hover:text-amber-100 truncate">
                        {def.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between gap-1">
                        <span>{itemTotalWeight} oz</span>
                        {!canFitWeight && (
                          <span className="text-red-400 font-bold">Too heavy</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-[#1c140f] border-t-2 border-[#523820] px-3 py-2 flex items-center justify-between gap-2 text-xs">
          {/* Capacity Meter */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-zinc-400">Capacity:</span>
            <span
              className={`font-bold tabular-nums ${
                freeCap <= 5 ? 'text-red-400' : 'text-amber-300'
              }`}
            >
              {Math.round(currentWeight * 10) / 10} / {capacityWeight} oz
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {totalItemsCount > 0 && (
              <button
                onClick={onTakeAll}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded cursor-pointer transition-colors flex items-center gap-1 shadow-md"
                title="Loot All Items [Space]"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Take All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-[#2b1f17] hover:bg-[#3d2a1d] border border-[#523820] text-zinc-300 hover:text-white rounded cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
