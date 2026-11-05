import React, { useState, useEffect } from 'react';
import { CharacterClass, HotbarSlot, Monster, PlayerStats } from '../types/game';
import {
  Crosshair,
  X,
  Lock,
  Flame,
  Wind,
  Sparkles,
  Shield,
  Heart,
  Droplets,
} from 'lucide-react';

export interface BottomActionTrayProps {
  stats: PlayerStats;
  cooldowns: Record<number, number>;
  targetMonster: Monster | null;
  onTriggerAbility: (slotId: number) => { success: boolean; reason?: string; message?: string } | undefined;
  onCycleTarget: () => void;
  onClearTarget: () => void;
  combatLog: string[];
}

export default function BottomActionTray({
  stats,
  cooldowns,
  targetMonster,
  onTriggerAbility,
  onCycleTarget,
  onClearTarget,
  combatLog,
}: BottomActionTrayProps) {
  const [now, setNow] = useState<number>(performance.now());
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  // Live timer tick for accurate cooldown countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(performance.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const isAvenger = stats.classType === 'Avenger';

  const avengerSlots: HotbarSlot[] = [
    {
      id: 1,
      keyLabel: '1',
      name: 'Entangling Lash',
      iconName: 'whip',
      color: '#f59e0b',
      description: 'Roots target for 2s (cannot step). 8 MP, 6s CD, 2-tile reach.',
      mpCost: 8,
      cooldownMs: 6000,
    },
    {
      id: 2,
      keyLabel: '2',
      name: 'Cinder Brand',
      iconName: 'flame',
      color: '#ef4444',
      description: 'Deals fire dmg & heals player. 12 MP, 3.5s CD, 2-tile reach.',
      mpCost: 12,
      cooldownMs: 3500,
    },
    {
      id: 3,
      keyLabel: '3',
      name: 'Sun Draught',
      iconName: 'potion',
      color: '#10b981',
      description: 'Restores 45 HP instantly. 0 MP, 8s CD.',
      mpCost: 0,
      cooldownMs: 8000,
    },
    {
      id: 4,
      keyLabel: '4',
      name: 'Empty Slot',
      iconName: 'lock',
      color: '#6b7280',
      description: 'Reserved for future spells/items.',
      mpCost: 0,
      cooldownMs: 0,
    },
  ];

  const sageSlots: HotbarSlot[] = [
    {
      id: 1,
      keyLabel: '1',
      name: 'Aether Gale Shot',
      iconName: 'wind',
      color: '#38bdf8',
      description: 'Deals air dmg & knocks target 1 tile away. 10 MP, 2.5s CD, 4-tile reach.',
      mpCost: 10,
      cooldownMs: 2500,
    },
    {
      id: 2,
      keyLabel: '2',
      name: 'Static Confusion',
      iconName: 'sparkle',
      color: '#c084fc',
      description: 'Scrambles enemy movement for 3s. 16 MP, 9s CD, 4-tile reach.',
      mpCost: 16,
      cooldownMs: 9000,
    },
    {
      id: 3,
      keyLabel: '3',
      name: 'Aether Flask',
      iconName: 'potion',
      color: '#06b6d4',
      description: 'Restores 35 MP instantly. 0 MP, 8s CD.',
      mpCost: 0,
      cooldownMs: 8000,
    },
    {
      id: 4,
      keyLabel: '4',
      name: 'Empty Slot',
      iconName: 'lock',
      color: '#6b7280',
      description: 'Reserved for future spells/items.',
      mpCost: 0,
      cooldownMs: 0,
    },
  ];

  const slots = isAvenger ? avengerSlots : sageSlots;

  const handleCast = (slotId: number) => {
    setActiveSlotId(slotId);
    onTriggerAbility(slotId);
    setTimeout(() => setActiveSlotId(null), 200);
  };

  const getSlotIcon = (slot: HotbarSlot) => {
    if (slot.id === 1) {
      return isAvenger ? (
        <span className="text-amber-400 font-extrabold text-sm sm:text-base">〰</span>
      ) : (
        <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
      );
    }
    if (slot.id === 2) {
      return isAvenger ? (
        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
      ) : (
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
      );
    }
    if (slot.id === 3) {
      return isAvenger ? (
        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
      ) : (
        <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
      );
    }
    return <Lock className="w-4 h-4 text-zinc-600" />;
  };

  return (
    <footer className="w-full bg-[#18130e] border-t-2 border-[#432d1d] shadow-2xl px-2 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 select-none z-30 font-mono text-xs shrink-0">
      {/* ================= LEFT / CENTER: ACTION HOTBAR & TARGET BUTTONS ================= */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
        {/* Ability Hotbar Slots (1 to 4) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {slots.map((slot) => {
            const cdUntil = cooldowns[slot.id] || 0;
            const cdRemaining = Math.max(0, cdUntil - now);
            const isOnCooldown = cdRemaining > 0;
            const isLocked = slot.id === 4;
            const hasEnoughMp = (slot.mpCost || 0) <= stats.mp;
            const isPressed = activeSlotId === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleCast(slot.id)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-md border-2 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
                  isLocked
                    ? 'bg-[#15171d]/60 border-[#2f3545] opacity-50 cursor-not-allowed'
                    : isOnCooldown
                    ? 'bg-[#1c1815] border-[#4a3424] opacity-80'
                    : !hasEnoughMp
                    ? 'bg-[#1f1515] border-[#6b2222] opacity-90'
                    : isPressed
                    ? 'scale-95 bg-amber-600/30 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                    : 'bg-[#221812] hover:bg-[#302016] border-[#5a3f28] hover:border-amber-400 shadow-md'
                }`}
                title={`${slot.name} - ${slot.description} [${slot.keyLabel}]`}
                aria-label={slot.name}
              >
                {/* Hotkey Badge in Top-Left Corner */}
                <span className="absolute top-0.5 left-1 text-[9px] font-bold text-amber-300/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  {slot.keyLabel}
                </span>

                {/* MP Cost Badge in Bottom-Right Corner */}
                {slot.mpCost ? (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[8px] sm:text-[9px] font-bold tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] ${
                      hasEnoughMp ? 'text-sky-300' : 'text-red-400 font-extrabold'
                    }`}
                  >
                    {slot.mpCost}m
                  </span>
                ) : null}

                {/* Ability Icon */}
                <div className="flex items-center justify-center z-10">
                  {getSlotIcon(slot)}
                </div>

                {/* Sub-label Name */}
                <span className="text-[7px] text-zinc-400 truncate max-w-[42px] leading-none mt-0.5 z-10 hidden sm:block">
                  {slot.name.split(' ')[0]}
                </span>

                {/* Cooldown Dark Overlay & Remaining Seconds */}
                {isOnCooldown && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-20">
                    <span className="font-bold text-amber-200 text-xs sm:text-sm tabular-nums drop-shadow">
                      {(cdRemaining / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Target Action Buttons */}
        <div className="flex items-center gap-1.5 border-l border-[#3d2b1d] pl-2 sm:pl-3">
          {/* Auto-Target Nearest Button */}
          <button
            type="button"
            onClick={onCycleTarget}
            className="h-12 sm:h-14 px-2.5 sm:px-3 bg-[#241a13] hover:bg-[#342419] border border-[#523820] hover:border-amber-400 rounded-md flex flex-col items-center justify-center text-amber-200 cursor-pointer shadow transition-all active:scale-95"
            title="Auto-Target Nearest Living Monster (Hotkey: Tab)"
            aria-label="Target Nearest"
          >
            <div className="flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-200">Target</span>
            </div>
            <span className="text-[9px] text-zinc-400 font-mono">[Tab]</span>
          </button>

          {/* Clear Target Button */}
          <button
            type="button"
            disabled={!targetMonster}
            onClick={onClearTarget}
            className={`h-12 sm:h-14 px-2 sm:px-2.5 rounded-md flex flex-col items-center justify-center border transition-all ${
              targetMonster
                ? 'bg-[#241a13] hover:bg-[#342419] border-[#523820] text-zinc-300 hover:text-white cursor-pointer active:scale-95'
                : 'bg-[#181310] border-[#312317] text-zinc-600 opacity-50 cursor-not-allowed'
            }`}
            title="Clear Target Lock (Hotkey: Esc)"
            aria-label="Clear Target"
          >
            <div className="flex items-center gap-0.5">
              <X className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[10px] font-bold">Clear</span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">[Esc]</span>
          </button>
        </div>
      </div>

      {/* ================= RIGHT: 2-LINE RETRO COMBAT LOG ================= */}
      <div className="hidden sm:flex flex-col justify-between w-64 md:w-80 lg:w-96 h-12 sm:h-14 bg-[#0d0a07] border border-[#3e2c1d] rounded p-1.5 shadow-inner overflow-hidden text-[10px] leading-snug">
        <div className="flex items-center justify-between border-b border-[#291c13] pb-0.5 mb-0.5">
          <span className="text-[9px] font-bold text-amber-400/90 tracking-wider uppercase">
            ✦ Combat Log
          </span>
          <span className="text-[8px] text-zinc-500">Live feed</span>
        </div>
        <div className="flex flex-col justify-end space-y-0.5 overflow-hidden">
          {combatLog.length === 0 ? (
            <span className="text-zinc-600 italic">No combat events recorded yet.</span>
          ) : (
            combatLog.slice(0, 2).map((entry, idx) => (
              <span
                key={idx}
                className={`truncate ${
                  entry.includes('slain') || entry.includes('✦ LEVEL')
                    ? 'text-yellow-300 font-bold'
                    : entry.includes('Advance')
                    ? 'text-cyan-300'
                    : entry.includes('-')
                    ? 'text-red-300'
                    : 'text-zinc-300'
                }`}
              >
                {entry}
              </span>
            ))
          )}
        </div>
      </div>
    </footer>
  );
}
