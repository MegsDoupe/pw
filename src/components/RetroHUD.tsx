import { useState, useEffect, useCallback } from 'react';
import {
  CharacterClass,
  Direction,
  HotbarSlot,
  Monster,
  PlayerStats,
} from '../types/game';
import {
  Compass,
  Grid,
  Gamepad2,
  HelpCircle,
  RefreshCw,
  Crosshair,
  Skull,
} from 'lucide-react';

interface RetroHUDProps {
  stats: PlayerStats;
  currentX: number;
  currentY: number;
  targetMonster: Monster | null;
  cooldowns: Record<number, number>;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSelectClass: (c: CharacterClass) => void;
  onDpadDirection: (dir: Direction) => void;
  onActionPress?: () => void;
  onTriggerAbility: (slotId: number) => { success: boolean; reason?: string; message?: string } | undefined;
  onCycleTarget: () => void;
}

export default function RetroHUD({
  stats,
  currentX,
  currentY,
  targetMonster,
  cooldowns,
  showGrid,
  onToggleGrid,
  onSelectClass,
  onDpadDirection,
  onActionPress,
  onTriggerAbility,
  onCycleTarget,
}: RetroHUDProps) {
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('NONE');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLowMpFlashing, setIsLowMpFlashing] = useState(false);
  const [now, setNow] = useState<number>(performance.now());

  // Tick for rendering cooldown counters
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(performance.now());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Auto-detect touch screen capability
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    if (isTouch || isSmallScreen) {
      setShowTouchControls(true);
    }
  }, []);

  // Phase 2 Level 1 Active Abilities Specs
  const avengerSlots: HotbarSlot[] = [
    {
      id: 1,
      keyLabel: '1',
      name: 'Entangling Lash',
      iconName: 'whip',
      color: '#f59e0b',
      description: 'Roots target for 2s (cannot step). 8 MP, 6s CD, 2-tile reach, 6-10 dmg.',
      mpCost: 8,
      cooldownMs: 6000,
    },
    {
      id: 2,
      keyLabel: '2',
      name: 'Cinder Brand',
      iconName: 'flame',
      color: '#ef4444',
      description: 'Deals 14-20 fire dmg & heals player for 4 HP. 12 MP, 3.5s CD, 2-tile reach.',
      mpCost: 12,
      cooldownMs: 3500,
    },
    {
      id: 3,
      keyLabel: '3',
      name: 'Sun Draught',
      iconName: 'potion',
      color: '#10b981',
      description: 'Restores 45 HP instantly.',
      mpCost: 0,
      cooldownMs: 8000,
    },
    {
      id: 4,
      keyLabel: '4',
      name: 'War Cry',
      iconName: 'shield',
      color: '#eab308',
      description: 'Bolsters defenses and repels weak monsters.',
      mpCost: 10,
      cooldownMs: 12000,
    },
  ];

  const sageSlots: HotbarSlot[] = [
    {
      id: 1,
      keyLabel: '1',
      name: 'Aether Gale Shot',
      iconName: 'wind',
      color: '#38bdf8',
      description: 'Deals 10-14 air dmg & knocks target 1 tile away. 10 MP, 2.5s CD, 4-tile reach.',
      mpCost: 10,
      cooldownMs: 2500,
    },
    {
      id: 2,
      keyLabel: '2',
      name: 'Static Confusion',
      iconName: 'sparkle',
      color: '#c084fc',
      description: 'Scrambles rat movement/pathfinding for 3s. 16 MP, 9s CD, 4-tile reach, 4-8 arcane dmg.',
      mpCost: 16,
      cooldownMs: 9000,
    },
    {
      id: 3,
      keyLabel: '3',
      name: 'Aether Flask',
      iconName: 'potion',
      color: '#06b6d4',
      description: 'Restores 35 MP over 2 seconds.',
      mpCost: 0,
      cooldownMs: 8000,
    },
    {
      id: 4,
      keyLabel: '4',
      name: 'Arcane Push',
      iconName: 'push',
      color: '#818cf8',
      description: 'Blasts adjacent tiles, shoving creatures back.',
      mpCost: 14,
      cooldownMs: 6000,
    },
  ];

  const activeHotbar = stats.classType === 'Avenger' ? avengerSlots : sageSlots;

  const handleSlotClick = useCallback(
    (slotId: number) => {
      setActiveSlot(slotId);
      const res = onTriggerAbility(slotId);
      if (res && !res.success && res.reason === 'no_mana') {
        setIsLowMpFlashing(true);
        setTimeout(() => setIsLowMpFlashing(false), 750);
      }
      setTimeout(() => setActiveSlot(null), 200);
    },
    [onTriggerAbility]
  );

  // Keyboard shortcut listeners (1, 2, 3, 4, Tab for target cycle, Space for Action)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        handleSlotClick(1);
      } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        handleSlotClick(2);
      } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        e.preventDefault();
        handleSlotClick(3);
      } else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
        e.preventDefault();
        handleSlotClick(4);
      } else if (e.code === 'Tab') {
        e.preventDefault();
        onCycleTarget();
      } else if (e.code === 'Space' || e.code === 'Enter') {
        onActionPress?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSlotClick, onCycleTarget, onActionPress]);

  // Touch D-Pad handlers
  const handleDpadPress = (dir: Direction) => {
    setActiveDirection(dir);
    onDpadDirection(dir);
  };

  const handleDpadRelease = () => {
    setActiveDirection('NONE');
    onDpadDirection('NONE');
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-2.5 font-mono select-none">
      {/* ================= TOP AREA: TARGET BAR & COORDINATES ================= */}
      <div className="flex items-center justify-between w-full gap-2">
        {/* Top-Left: Active Target Chip (if target is locked) */}
        {targetMonster && targetMonster.isAlive ? (
          <div className="pointer-events-auto bg-[#181a20]/95 border border-red-500/80 px-2 py-1 rounded shadow-lg flex items-center gap-2 text-xs animate-in fade-in duration-150">
            <Skull className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-bold text-amber-200 text-[10px]">
                  {targetMonster.name}
                </span>
                <span className="text-[9px] text-zinc-400">
                  {targetMonster.hp}/{targetMonster.maxHp} HP
                </span>
                {((targetMonster.statusEffects.rootedRemainingMs && targetMonster.statusEffects.rootedRemainingMs > 0) ||
                  (targetMonster.statusEffects.rootedUntil && now < targetMonster.statusEffects.rootedUntil)) && (
                  <span className="px-1 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-500 text-[8px] font-bold rounded tracking-wider animate-pulse">
                    ROOTED
                  </span>
                )}
                {((targetMonster.statusEffects.confusedRemainingMs && targetMonster.statusEffects.confusedRemainingMs > 0) ||
                  (targetMonster.statusEffects.confusedUntil && now < targetMonster.statusEffects.confusedUntil)) && (
                  <span className="px-1 py-0.5 bg-purple-950/90 text-purple-300 border border-purple-500 text-[8px] font-bold rounded tracking-wider animate-pulse">
                    CONFUSED
                  </span>
                )}
              </div>
              <div className="w-20 h-1.5 bg-[#260e10] border border-[#521b20] rounded-xs overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                  style={{
                    width: `${Math.max(0, (targetMonster.hp / targetMonster.maxHp) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-1" />
        )}

        {/* Top-Right: XP & Coordinates */}
        <div className="flex items-center gap-1.5">
          {/* XP Chip */}
          <div className="pointer-events-auto bg-[#141720]/85 border border-[#3e352b]/80 px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold shadow flex items-center gap-1">
            <span className="text-amber-400">XP:</span>
            <span className="text-cyan-300 tabular-nums">
              {stats.currentXp ?? stats.xp ?? 0}/{stats.xpForNextLevel || 50}
            </span>
          </div>

          {/* Coordinates Chip */}
          <div className="pointer-events-auto bg-[#141720]/80 border border-[#3e352b]/60 px-2 py-0.5 rounded text-[10px] text-amber-200/90 flex items-center gap-1.5 shadow">
            <Compass className="w-3 h-3 text-amber-400" />
            <span>
              X:<span className="text-emerald-400 font-bold">{currentX}</span> Y:
              <span className="text-emerald-400 font-bold">{currentY}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ================= FLOATING TOUCH OVERLAYS (WHEN ENABLED) ================= */}
      {showTouchControls && (
        <div className="flex items-end justify-between w-full mb-1">
          {/* Compact Virtual Touch D-Pad */}
          <div className="pointer-events-auto bg-black/60 border border-[#433b32]/70 p-1 rounded-md shadow-xl backdrop-blur-none">
            <div className="grid grid-cols-3 gap-0.5 w-20 h-20 sm:w-24 sm:h-24">
              <button
                onPointerDown={() => handleDpadPress('UP_LEFT')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center text-[9px] rounded border ${
                  activeDirection === 'UP_LEFT'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#1c202a]/80 text-zinc-400 border-[#2d3444]'
                }`}
                aria-label="Move Up Left"
              >
                ↖
              </button>
              <button
                onPointerDown={() => handleDpadPress('UP')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center font-bold text-xs rounded border ${
                  activeDirection === 'UP'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#222733]/90 text-amber-200 border-[#384255]'
                }`}
                aria-label="Move Up"
              >
                ▲
              </button>
              <button
                onPointerDown={() => handleDpadPress('UP_RIGHT')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center text-[9px] rounded border ${
                  activeDirection === 'UP_RIGHT'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#1c202a]/80 text-zinc-400 border-[#2d3444]'
                }`}
                aria-label="Move Up Right"
              >
                ↗
              </button>
              <button
                onPointerDown={() => handleDpadPress('LEFT')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center font-bold text-xs rounded border ${
                  activeDirection === 'LEFT'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#222733]/90 text-amber-200 border-[#384255]'
                }`}
                aria-label="Move Left"
              >
                ◀
              </button>
              <div className="flex items-center justify-center bg-[#10131a] rounded text-[8px] text-zinc-500">
                •
              </div>
              <button
                onPointerDown={() => handleDpadPress('RIGHT')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center font-bold text-xs rounded border ${
                  activeDirection === 'RIGHT'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#222733]/90 text-amber-200 border-[#384255]'
                }`}
                aria-label="Move Right"
              >
                ▶
              </button>
              <button
                onPointerDown={() => handleDpadPress('DOWN_LEFT')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center text-[9px] rounded border ${
                  activeDirection === 'DOWN_LEFT'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#1c202a]/80 text-zinc-400 border-[#2d3444]'
                }`}
                aria-label="Move Down Left"
              >
                ↙
              </button>
              <button
                onPointerDown={() => handleDpadPress('DOWN')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center font-bold text-xs rounded border ${
                  activeDirection === 'DOWN'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#222733]/90 text-amber-200 border-[#384255]'
                }`}
                aria-label="Move Down"
              >
                ▼
              </button>
              <button
                onPointerDown={() => handleDpadPress('DOWN_RIGHT')}
                onPointerUp={handleDpadRelease}
                onPointerLeave={handleDpadRelease}
                className={`flex items-center justify-center text-[9px] rounded border ${
                  activeDirection === 'DOWN_RIGHT'
                    ? 'bg-amber-600 text-black border-amber-400'
                    : 'bg-[#1c202a]/80 text-zinc-400 border-[#2d3444]'
                }`}
                aria-label="Move Down Right"
              >
                ↘
              </button>
            </div>
          </div>

          {/* Touch Combat Controls: Target Nearest & Action button */}
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            {/* Quick Target Button */}
            <button
              onClick={onCycleTarget}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-rose-950 border border-red-400 text-amber-100 font-bold text-[9px] shadow-lg flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
              title="Target Nearest Monster"
              aria-label="Target Nearest Monster"
            >
              <Crosshair className="w-4 h-4 text-red-300" />
            </button>

            {/* Action / Primary Spell Button */}
            <button
              onClick={() => {
                onActionPress?.();
                handleSlotClick(1);
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-300 text-amber-100 font-bold text-[10px] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              aria-label="Action Button"
            >
              ACT
            </button>
          </div>
        </div>
      )}

      {/* ================= COMPACT BOTTOM HUD BAR ================= */}
      <div className="w-full flex flex-col items-center gap-1 mt-auto">
        {/* Small Bottom Strip Dock */}
        <div className="pointer-events-auto bg-[#141720]/95 border border-[#3e352b] rounded-md shadow-2xl px-2 py-1.5 flex items-center justify-between gap-2 sm:gap-3 w-full max-w-[700px]">
          {/* Left: Character Card & Vitals (HP, MP & Thin XP Progress Bar) */}
          <div className="flex flex-col gap-1 min-w-[210px] sm:min-w-[260px]">
            {/* Top row: Character Card + HP & MP Bars */}
            <div className="flex items-center gap-2">
              {/* Character Card: Lvl {level} {className} */}
              <div className="flex items-center gap-1.5 text-[10px] bg-[#1a1d26] px-1.5 py-0.5 rounded border border-[#2e3547]">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    stats.classType === 'Avenger'
                      ? 'bg-[#9b2263] ring-1 ring-fuchsia-400'
                      : 'bg-[#38a2f5] ring-1 ring-sky-400'
                  }`}
                />
                <span className="font-bold text-amber-200 tracking-wide whitespace-nowrap">
                  Lvl {stats.level} {stats.classType}
                </span>
                {/* Class Switch Icon Button */}
                <button
                  onClick={() =>
                    onSelectClass(
                      stats.classType === 'Avenger' ? 'Sage' : 'Avenger'
                    )
                  }
                  className="p-0.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                  title="Switch Class (Avenger / Sage)"
                  aria-label="Switch Class"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Compact HP & MP Bars */}
              <div className="flex items-center gap-2 border-l border-[#2e2720] pl-1.5">
                {/* HP Meter */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-red-400">HP</span>
                  <div className="w-12 sm:w-16 h-2 bg-[#260e10] border border-[#521b20] rounded-xs overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                      style={{
                        width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-red-200 tabular-nums">
                    {stats.hp}
                  </span>
                </div>

                {/* MP Meter with Low-Mana Shake & Alert Feedback */}
                <div
                  className={`flex items-center gap-1 transition-all ${
                    isLowMpFlashing ? 'animate-shake' : ''
                  }`}
                >
                  <span
                    className={`text-[9px] font-bold ${
                      isLowMpFlashing
                        ? 'text-red-400 font-extrabold animate-pulse'
                        : 'text-cyan-400'
                    }`}
                  >
                    MP
                  </span>
                  <div
                    className={`w-11 sm:w-14 h-2 bg-[#0c1a2e] border rounded-xs overflow-hidden transition-all ${
                      isLowMpFlashing
                        ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                        : 'border-[#1b3558]'
                    }`}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        isLowMpFlashing
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min(100, (stats.mp / stats.maxMp) * 100))}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[9px] tabular-nums ${
                      isLowMpFlashing ? 'text-red-300 font-bold' : 'text-cyan-200'
                    }`}
                  >
                    {stats.mp}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom row: Thin XP Progress Bar under HP & MP bars */}
            {(() => {
              const curXp = stats.currentXp ?? stats.xp ?? 0;
              const nextXp = stats.xpForNextLevel || 50;
              const pct = Math.min(100, Math.max(0, (curXp / nextXp) * 100));
              return (
                <div className="flex items-center gap-1.5 w-full">
                  <span className="text-[8px] font-bold text-amber-400/90 leading-none">
                    XP
                  </span>
                  <div className="flex-1 h-1.5 bg-[#16120b] border border-[#52412d] rounded-xs overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-amber-200/90 font-mono tabular-nums leading-none whitespace-nowrap">
                    {curXp} / {nextXp} XP ({Math.floor(pct)}%)
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Center: Scaled-Down Action Hotbar (Slots 1 to 4 with CD timers & radial sweep) */}
          <div className="flex items-center gap-1">
            {activeHotbar.map((slot) => {
              const isSelected = activeSlot === slot.id;
              const cdUntil = cooldowns[slot.id] || 0;
              const remainingMs = Math.max(0, cdUntil - now);
              const isOnCooldown = remainingMs > 0;
              const cdSeconds = (remainingMs / 1000).toFixed(1);

              return (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  disabled={isOnCooldown}
                  className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded transition-all cursor-pointer border overflow-hidden select-none ${
                    isOnCooldown
                      ? 'bg-[#12151c] border-[#222836] opacity-80 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-500/40 border-amber-300 scale-95 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      : 'bg-[#1e232e] hover:bg-[#282f3d] border-[#363f52]'
                  }`}
                  title={`${slot.name} [${slot.keyLabel}] - ${slot.description}`}
                  aria-label={`${slot.name} slot ${slot.keyLabel}`}
                >
                  {/* Slot Key Badge */}
                  <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-amber-200/80 leading-none z-10">
                    {slot.keyLabel}
                  </span>

                  {/* Icon */}
                  <span
                    className={`text-xs font-bold ${isOnCooldown ? 'opacity-30' : ''}`}
                    style={{ color: slot.color }}
                  >
                    {slot.id === 1 ? '⚔' : slot.id === 2 ? '✦' : slot.id === 3 ? '✚' : '🛡'}
                  </span>

                  {/* Cooldown Dark Percentage Sweep & Numeric Counter Overlay */}
                  {isOnCooldown && (
                    <>
                      <div
                        className="absolute inset-0 bg-black/80 pointer-events-none z-10 transition-all duration-100"
                        style={{
                          clipPath: `inset(0 0 ${(1 - Math.min(1, remainingMs / slot.cooldownMs)) * 100}% 0)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <span className="text-[9px] font-extrabold text-amber-300 tabular-nums drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                          {cdSeconds}s
                        </span>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: Targeting & Small Utility Buttons */}
          <div className="flex items-center gap-1 border-l border-[#2e2720] pl-2">
            {/* Auto-Target Nearest Button */}
            <button
              onClick={onCycleTarget}
              className={`p-1 rounded transition-colors cursor-pointer border ${
                targetMonster
                  ? 'bg-red-950/80 text-red-300 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  : 'bg-[#1e232e] hover:bg-[#2a3140] text-zinc-300 border-[#343e52]'
              }`}
              title="Target Nearest Monster [Tab]"
              aria-label="Auto-Target Nearest"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleGrid}
              className={`p-1 rounded text-zinc-300 transition-colors cursor-pointer border ${
                showGrid
                  ? 'bg-amber-600 text-black border-amber-400'
                  : 'bg-[#1e232e] hover:bg-[#2a3140] border-[#343e52]'
              }`}
              title="Toggle 32x32 Grid Lines"
              aria-label="Toggle Grid"
            >
              <Grid className="w-3 h-3" />
            </button>

            <button
              onClick={() => setShowTouchControls(!showTouchControls)}
              className={`p-1 rounded text-zinc-300 transition-colors cursor-pointer border ${
                showTouchControls
                  ? 'bg-amber-600 text-black border-amber-400'
                  : 'bg-[#1e232e] hover:bg-[#2a3140] border-[#343e52]'
              }`}
              title="Toggle Touch Controls"
              aria-label="Toggle Touch Controls"
            >
              <Gamepad2 className="w-3 h-3" />
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1 bg-[#1e232e] hover:bg-[#2a3140] text-zinc-300 rounded border border-[#343e52] transition-colors cursor-pointer"
              title="Controls & Help"
              aria-label="Controls Help"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= HELP MODAL ================= */}
      {showHelpModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-[#181a20] border-2 border-[#544638] p-4 rounded-lg max-w-sm w-full shadow-2xl text-amber-100 text-xs space-y-3 font-sans">
            <div className="flex justify-between items-center border-b border-[#3e3428] pb-1.5 font-mono">
              <span className="font-bold text-sm text-amber-300 tracking-wider">
                PHASE 2 COMBAT CONTROLS
              </span>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-zinc-400 hover:text-white font-mono px-1.5 py-0.5 bg-[#262933] rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
              <p>
                <strong className="text-amber-200">Leveling & XP:</strong> Slay Giant Rats
                (+5 XP each) to advance along the Tibia XP curve. Leveling up grants stat
                scaling (+12 HP/+8 MP for Avenger, +6 HP/+16 MP for Sage, +1 base dmg)
                and fully restores HP & MP!
              </p>
              {stats.skills && (
                <div className="bg-[#11131a] p-2 rounded border border-[#2b3345] space-y-1">
                  <div className="text-[10px] font-bold text-amber-300">SKILL PROFICIENCIES (TRAIN BY DOING):</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div>• Melee: <span className="text-emerald-400">Lvl {stats.skills.melee.level}</span> ({stats.skills.melee.tries}/{stats.skills.melee.nextLevelTries})</div>
                    <div>• Marksmanship: <span className="text-emerald-400">Lvl {stats.skills.marksmanship.level}</span> ({stats.skills.marksmanship.tries}/{stats.skills.marksmanship.nextLevelTries})</div>
                    <div>• Magic: <span className="text-cyan-400">Lvl {stats.skills.magic.level}</span> ({stats.skills.magic.manaSpent}/{stats.skills.magic.nextLevelMana} MP)</div>
                    <div>• Defense: <span className="text-yellow-400">Lvl {stats.skills.defense.level}</span> ({stats.skills.defense.hitsBlocked}/{stats.skills.defense.nextLevelHits})</div>
                  </div>
                </div>
              )}
              <p>
                <strong className="text-amber-200">Targeting:</strong> Click directly
                on any Giant Rat, or press{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  Tab
                </kbd>{' '}
                / tap the Target crosshair button.
              </p>
              <p>
                <strong className="text-amber-200">Auto-Attack:</strong> Once locked,
                attacks trigger automatically within reach (Avenger: 2 tiles,
                Sage: 4 tiles, costs 1 MP).
              </p>
              <p>
                <strong className="text-amber-200">Abilities:</strong>
                <br />•{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  1
                </kbd>{' '}
                Avenger: <em>Entangling Lash</em> (Roots 2s) / Sage:{' '}
                <em>Aether Gale Shot</em> (Knockback 1 tile)
                <br />•{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  2
                </kbd>{' '}
                Avenger: <em>Cinder Brand</em> (Fire dmg + 4 HP heal) / Sage:{' '}
                <em>Static Confusion</em> (Scrambles rat AI 3s)
              </p>
              <p>
                <strong className="text-amber-200">Movement:</strong>{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  WASD
                </kbd>{' '}
                or Arrow Keys. Corner-cutting through obstacles is blocked.
              </p>
            </div>

            <div className="pt-1 text-center">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-1.5 bg-[#453728] hover:bg-[#5a4835] text-amber-200 font-bold rounded cursor-pointer transition-colors"
              >
                RETURN TO REALM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
