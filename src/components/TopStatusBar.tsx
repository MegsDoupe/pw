import React from 'react';
import { CharacterClass, Monster, PlayerStats } from '../types/game';
import {
  Compass,
  Grid,
  Gamepad2,
  Keyboard,
  BookOpen,
  RefreshCw,
  Skull,
  Pause,
  Shield,
  Sparkles,
  Backpack,
} from 'lucide-react';

export interface TopStatusBarProps {
  stats: PlayerStats;
  currentX: number;
  currentY: number;
  targetMonster: Monster | null;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSelectClass: (c: CharacterClass) => void;
  showSkills: boolean;
  onToggleSkills: () => void;
  showInventory?: boolean;
  onToggleInventory?: () => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
  onPause: () => void;
}

export default function TopStatusBar({
  stats,
  currentX,
  currentY,
  targetMonster,
  showGrid,
  onToggleGrid,
  onSelectClass,
  showSkills,
  onToggleSkills,
  showInventory = false,
  onToggleInventory,
  showTouchControls,
  onToggleTouchControls,
  onPause,
}: TopStatusBarProps) {
  const isAvenger = stats.classType === 'Avenger';
  const currentXp = stats.currentXp ?? stats.xp ?? 0;
  const xpNeeded = stats.xpForNextLevel || 50;
  const xpPct = Math.min(100, Math.max(0, Math.floor((currentXp / xpNeeded) * 100)));

  const hpPct = Math.min(100, Math.max(0, (stats.hp / stats.maxHp) * 100));
  const mpPct = Math.min(100, Math.max(0, (stats.mp / stats.maxMp) * 100));

  return (
    <header className="w-full bg-[#18130e] border-b-2 border-[#432d1d] shadow-lg px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 sm:gap-4 select-none z-30 font-mono text-xs shrink-0">
      {/* ================= LEFT: CHARACTER CARD & VITALS ================= */}
      <div className="flex items-center gap-2.5">
        {/* Class / Level Badge */}
        <div className="flex items-center gap-1.5 bg-[#241a13] border border-[#523820] px-2 py-1 rounded shadow-inner">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isAvenger
                ? 'bg-[#d946ef] shadow-[0_0_8px_rgba(217,70,239,0.8)]'
                : 'bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.8)]'
            }`}
          />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-amber-200 tracking-wider flex items-center gap-1">
              {isAvenger ? (
                <Shield className="w-3 h-3 text-[#e879f9]" />
              ) : (
                <Sparkles className="w-3 h-3 text-[#60a5fa]" />
              )}
              {stats.classType}
            </span>
            <span className="text-[10px] text-zinc-400">Lv {stats.level}</span>
          </div>
          {/* Class Switch Quick Toggle */}
          <button
            onClick={() => onSelectClass(isAvenger ? 'Sage' : 'Avenger')}
            className="p-1 ml-1 text-zinc-400 hover:text-amber-300 hover:bg-[#342419] rounded transition-colors cursor-pointer"
            title={`Switch to ${isAvenger ? 'Sage' : 'Avenger'}`}
            aria-label="Switch Class"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* HP, MP & XP Vitals Container */}
        <div className="flex flex-col gap-1">
          {/* Top Row: HP & MP Bars with centered text */}
          <div className="flex items-center gap-2">
            {/* HP Bar */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-red-400 w-4">HP</span>
              <div className="w-28 sm:w-40 md:w-48 h-4 bg-[#20080a] border border-[#6b1e26] rounded-xs relative overflow-hidden flex items-center justify-center shadow-inner">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-700 via-red-600 to-rose-500 transition-all duration-300"
                  style={{ width: `${hpPct}%` }}
                />
                <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] tabular-nums">
                  {stats.hp} / {stats.maxHp}
                </span>
              </div>
            </div>

            {/* MP Bar */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-sky-400 w-4">MP</span>
              <div className="w-28 sm:w-40 md:w-48 h-4 bg-[#081326] border border-[#1b3a6b] rounded-xs relative overflow-hidden flex items-center justify-center shadow-inner">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 transition-all duration-300"
                  style={{ width: `${mpPct}%` }}
                />
                <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] tabular-nums">
                  {stats.mp} / {stats.maxMp}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Sleek XP Progress Bar */}
          <div className="flex items-center gap-1.5 w-full">
            <span className="text-[9px] font-bold text-amber-400 w-4">XP</span>
            <div className="flex-1 h-1.5 sm:h-2 bg-[#1b1712] border border-[#4d3a24] rounded-xs relative overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="text-[9px] text-amber-200/90 tabular-nums whitespace-nowrap hidden sm:inline">
              {currentXp} / {xpNeeded} ({xpPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* ================= CENTER: TARGET & COORDINATES ================= */}
      <div className="hidden md:flex items-center gap-3">
        {/* Active Target Chip */}
        {targetMonster && targetMonster.isAlive ? (
          <div className="bg-[#1f1712] border border-red-500/80 px-2.5 py-1 rounded shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
            <Skull className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-200 text-[11px]">
                  {targetMonster.name}
                </span>
                <span className="text-[9px] text-zinc-400 tabular-nums">
                  {targetMonster.hp}/{targetMonster.maxHp} HP
                </span>
                {targetMonster.statusEffects.rootedRemainingMs !== undefined &&
                  targetMonster.statusEffects.rootedRemainingMs > 0 && (
                    <span className="px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-500 text-[8px] font-bold rounded">
                      ROOTED
                    </span>
                  )}
                {targetMonster.statusEffects.confusedRemainingMs !== undefined &&
                  targetMonster.statusEffects.confusedRemainingMs > 0 && (
                    <span className="px-1 py-0.2 bg-purple-950 text-purple-300 border border-purple-500 text-[8px] font-bold rounded">
                      CONFUSED
                    </span>
                  )}
              </div>
              <div className="w-24 h-1.5 bg-[#260e10] border border-[#521b20] rounded-xs overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-150"
                  style={{
                    width: `${Math.max(0, (targetMonster.hp / targetMonster.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-zinc-500 italic px-2 py-1 bg-[#1a130f] border border-[#3b2b1e] rounded">
            No Target <kbd className="text-zinc-400 not-italic font-bold">[Tab]</kbd>
          </div>
        )}

        {/* Coordinates */}
        <div className="bg-[#1f1712] border border-[#4a3422] px-2.5 py-1 rounded text-amber-200 flex items-center gap-1.5 shadow-inner">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>
            X: <strong className="text-emerald-400">{currentX}</strong> Y:{' '}
            <strong className="text-emerald-400">{currentY}</strong>
          </span>
        </div>
      </div>

      {/* ================= RIGHT: UTILITY BUTTONS ================= */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Inventory & Gear Button */}
        <button
          onClick={onToggleInventory}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 border transition-all cursor-pointer font-bold ${
            showInventory
              ? 'bg-amber-600 text-stone-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'bg-[#241a13] hover:bg-[#342419] text-amber-200 border-[#523820]'
          }`}
          title="Equipment & Inventory (Hotkey: I)"
          aria-label="Toggle Inventory Drawer"
        >
          <Backpack className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gear</span>
          <span className="text-[10px] opacity-75 font-mono">[I]</span>
          <span className="text-[10px] text-amber-300 font-mono hidden lg:inline">
            ({Math.round((stats.currentWeight ?? 0) * 10) / 10}/{stats.capacityWeight ?? 300} oz)
          </span>
        </button>

        {/* Skills Button */}
        <button
          onClick={onToggleSkills}
          className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 border transition-all cursor-pointer font-bold ${
            showSkills
              ? 'bg-amber-600 text-stone-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'bg-[#241a13] hover:bg-[#342419] text-amber-200 border-[#523820]'
          }`}
          title="Character Skills & Progression (Hotkey: K)"
          aria-label="Toggle Skills Drawer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Skills</span>
          <span className="text-[10px] opacity-75 font-mono">[K]</span>
        </button>

        {/* Mobile Controls Toggle Button */}
        <button
          onClick={onToggleTouchControls}
          className={`p-1.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
            showTouchControls
              ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
              : 'bg-[#241a13] hover:bg-[#342419] text-zinc-400 border-[#523820]'
          }`}
          title={showTouchControls ? 'Touch Controls Enabled (Click to Hide)' : 'Enable Touch Controls'}
          aria-label="Toggle Touch Controls"
        >
          {showTouchControls ? (
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Keyboard className="w-3.5 h-3.5" />
          )}
          <span className="hidden md:inline text-[10px]">
            {showTouchControls ? 'Touch On' : 'Touch Off'}
          </span>
        </button>

        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            showGrid
              ? 'bg-amber-600/30 text-amber-300 border-amber-500'
              : 'bg-[#241a13] hover:bg-[#342419] text-zinc-400 border-[#523820]'
          }`}
          title="Toggle Map Grid"
          aria-label="Toggle Grid"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Pause Button */}
        <button
          onClick={onPause}
          className="p-1.5 rounded bg-[#241a13] hover:bg-[#342419] text-zinc-400 hover:text-white border border-[#523820] transition-colors cursor-pointer flex items-center gap-1"
          title="Pause Game (Esc / P)"
          aria-label="Pause Game"
        >
          <Pause className="w-3.5 h-3.5" />
          <span className="hidden lg:inline text-[10px]">[P]</span>
        </button>
      </div>
    </header>
  );
}
