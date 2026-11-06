import React, { useState } from 'react';
import { PlayerStats, QuestProgress } from '../types/game';
import { countItemInInventory } from '../game/items';
import { isQuestReadyToTurnIn, getStarterQuest } from '../game/quests';
import { Scroll, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';

export interface QuestTrackerProps {
  playerStats: PlayerStats;
  onOpenQuestGiver?: () => void;
}

export default function QuestTracker({ playerStats, onOpenQuestGiver }: QuestTrackerProps) {
  const [collapsed, setCollapsed] = useState(false);

  const quest: QuestProgress = getStarterQuest(playerStats);
  const tailsCount = countItemInInventory(playerStats, 'rat_tail');
  const ready = isQuestReadyToTurnIn(quest, playerStats);

  // If completed, keep a discreet completed badge
  if (quest.status === 'completed') {
    return (
      <div className="absolute top-2 right-2 z-20 pointer-events-auto">
        <div className="bg-[#18110b]/90 border border-emerald-600/50 rounded px-2.5 py-1 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-md backdrop-blur-xs">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Perimeter Cleansed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-20 pointer-events-auto max-w-[210px] sm:max-w-[240px]">
      <div className="bg-[#18110b]/95 border border-[#5c4026] rounded-md shadow-xl backdrop-blur-xs overflow-hidden font-mono text-xs">
        {/* Header Bar */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="bg-[#24170f] px-2.5 py-1.5 flex items-center justify-between border-b border-[#3b2416] cursor-pointer select-none hover:bg-[#2d1e13] transition-colors"
        >
          <div className="flex items-center gap-1.5 text-amber-200 font-bold text-[11px] truncate">
            <Scroll className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{quest.title}</span>
          </div>

          <button className="text-stone-400 hover:text-amber-200 p-0.5">
            {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-2 space-y-1.5 text-[10px]">
            {quest.status === 'not_started' ? (
              <div className="text-stone-400 italic leading-snug">
                Speak with <strong className="text-amber-300">Sister Lucinda</strong> at the Sacred Hearth (0, 0) to receive your starter quest.
              </div>
            ) : ready ? (
              <div className="bg-amber-950/70 border border-amber-500/70 rounded p-1.5 text-amber-200 font-bold leading-tight animate-pulse text-center">
                ✨ Objectives Complete!
                <div className="text-[9px] text-amber-300 font-normal mt-0.5">
                  Return to Sister Lucinda at the Temple Altar.
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Objective 1: Rats */}
                <div className="flex items-center justify-between">
                  <span className="text-stone-300 flex items-center gap-1">
                    {quest.ratsKilled >= quest.ratsRequired ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    )}
                    Giant Rats Slain:
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      quest.ratsKilled >= quest.ratsRequired ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {quest.ratsKilled} / {quest.ratsRequired}
                  </span>
                </div>

                {/* Objective 2: Tails */}
                <div className="flex items-center justify-between">
                  <span className="text-stone-300 flex items-center gap-1">
                    {tailsCount >= quest.tailsRequired ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    )}
                    Rat Tails in Pack:
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      tailsCount >= quest.tailsRequired ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {tailsCount} / {quest.tailsRequired}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
