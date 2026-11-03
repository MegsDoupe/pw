import { useState, useEffect, useCallback } from 'react';
import {
  CharacterClass,
  Direction,
  HotbarSlot,
  PlayerStats,
} from '../types/game';
import {
  Compass,
  Grid,
  Gamepad2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface RetroHUDProps {
  stats: PlayerStats;
  currentX: number;
  currentY: number;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSelectClass: (c: CharacterClass) => void;
  onDpadDirection: (dir: Direction) => void;
  onActionPress?: () => void;
}

export default function RetroHUD({
  stats,
  currentX,
  currentY,
  showGrid,
  onToggleGrid,
  onSelectClass,
  onDpadDirection,
  onActionPress,
}: RetroHUDProps) {
  // Mobile / touch detection with fallback toggle
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('NONE');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [logMessage, setLogMessage] = useState<string | null>(null);

  // Auto-detect touch screen capability
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    if (isTouch || isSmallScreen) {
      setShowTouchControls(true);
    }
  }, []);

  // Class-specific hotbar spell slots
  const avengerSlots: HotbarSlot[] = [
    {
      id: 1,
      keyLabel: '1',
      name: 'Sun Lash',
      iconName: 'whip',
      color: '#f59e0b',
      description: 'Mid-range 2-tile reach whip strike. Radiant damage.',
      mpCost: 0,
      cooldownMs: 800,
    },
    {
      id: 2,
      keyLabel: '2',
      name: 'Radiant Cleave',
      iconName: 'flame',
      color: '#ef4444',
      description: 'Sweeps sacred fire, displacing foes.',
      mpCost: 15,
      cooldownMs: 2500,
    },
    {
      id: 3,
      keyLabel: '3',
      name: 'Chains of Light',
      iconName: 'root',
      color: '#eab308',
      description: 'Roots the target in place for 2.5s.',
      mpCost: 20,
      cooldownMs: 4000,
    },
    {
      id: 4,
      keyLabel: '4',
      name: 'Sun Draught',
      iconName: 'potion',
      color: '#10b981',
      description: 'Restores 45 HP instantly.',
      mpCost: 0,
      cooldownMs: 8000,
    },
  ];

  const sageSlots: HotbarSlot[] = [
    {
      id: 1,
      keyLabel: '1',
      name: 'Aether Bolt',
      iconName: 'wand',
      color: '#38bdf8',
      description: 'Long-range 4-tile reach arcane projectile.',
      mpCost: 6,
      cooldownMs: 600,
    },
    {
      id: 2,
      keyLabel: '2',
      name: 'Arcane Wave',
      iconName: 'push',
      color: '#818cf8',
      description: 'Pushes adjacent enemies backward.',
      mpCost: 18,
      cooldownMs: 2200,
    },
    {
      id: 3,
      keyLabel: '3',
      name: 'Mind Confusion',
      iconName: 'confuse',
      color: '#c084fc',
      description: 'Disorients target movement for 3s.',
      mpCost: 24,
      cooldownMs: 5000,
    },
    {
      id: 4,
      keyLabel: '4',
      name: 'Aether Flask',
      iconName: 'potion',
      color: '#06b6d4',
      description: 'Restores 35 MP over 2 seconds.',
      mpCost: 0,
      cooldownMs: 8000,
    },
  ];

  const activeHotbar = stats.classType === 'Avenger' ? avengerSlots : sageSlots;

  // Trigger hotbar action with brief transient notification
  const handleSlotTrigger = useCallback(
    (slot: HotbarSlot) => {
      setActiveSlot(slot.id);
      setLogMessage(`${slot.name} [${slot.keyLabel}]`);
      setTimeout(() => setActiveSlot(null), 250);
      setTimeout(() => setLogMessage(null), 2000);
    },
    []
  );

  // Listen for 1, 2, 3, 4 number keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const slotIdx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (activeHotbar[slotIdx]) {
          handleSlotTrigger(activeHotbar[slotIdx]);
        }
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        onActionPress?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHotbar, handleSlotTrigger, onActionPress]);

  // Touch D-Pad handler
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
      {/* ================= TOP AREA: UNOBSTRUCTED VIEW ================= */}
      <div className="flex items-start justify-end w-full">
        {/* Subtle, minimal top-right coordinate chip */}
        <div className="pointer-events-auto bg-[#141720]/80 border border-[#3e352b]/60 px-2 py-0.5 rounded text-[10px] text-amber-200/90 flex items-center gap-1.5 shadow">
          <Compass className="w-3 h-3 text-amber-400" />
          <span>
            X:<span className="text-emerald-400 font-bold">{currentX}</span> Y:
            <span className="text-emerald-400 font-bold">{currentY}</span>
          </span>
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

          {/* Compact Action Button */}
          <div className="pointer-events-auto">
            <button
              onClick={() => {
                onActionPress?.();
                handleSlotTrigger(activeHotbar[0]);
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-300 text-amber-100 font-bold text-[10px] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              aria-label="Action Button"
            >
              ACT
            </button>
          </div>
        </div>
      )}

      {/* ================= COMPACT BOTTOM HUD BAR ================= */}
      <div className="w-full flex flex-col items-center gap-1 mt-auto">
        {/* Subtle transient action feedback */}
        {logMessage && (
          <div className="pointer-events-none text-[10px] text-amber-300 bg-black/80 px-2 py-0.5 rounded border border-[#433b32] shadow animate-pulse">
            {logMessage}
          </div>
        )}

        {/* Small Bottom Strip Dock */}
        <div className="pointer-events-auto bg-[#141720]/95 border border-[#3e352b] rounded-md shadow-2xl px-2 py-1 flex items-center justify-between gap-2 sm:gap-4 w-full max-w-[620px]">
          {/* Left: Class Badge, Level & Compact HP/MP Bars */}
          <div className="flex items-center gap-2">
            {/* Class & Level Tag */}
            <div className="flex items-center gap-1 text-[10px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  stats.classType === 'Avenger' ? 'bg-[#9b2263]' : 'bg-[#38a2f5]'
                }`}
              />
              <span className="font-bold text-amber-300 tracking-wide">
                {stats.classType}
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">
                L{stats.level}
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
            <div className="flex items-center gap-2 border-l border-[#2e2720] pl-2">
              {/* HP Meter */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-red-400">HP</span>
                <div className="w-14 sm:w-20 h-2 bg-[#260e10] border border-[#521b20] rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                    style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-red-200 tabular-nums">
                  {stats.hp}
                </span>
              </div>

              {/* MP Meter */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-cyan-400">MP</span>
                <div className="w-12 sm:w-16 h-2 bg-[#0c1a2e] border border-[#1b3558] rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
                    style={{ width: `${(stats.mp / stats.maxMp) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-cyan-200 tabular-nums">
                  {stats.mp}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Scaled-Down Action Hotbar (Slots 1 to 4) */}
          <div className="flex items-center gap-1">
            {activeHotbar.map((slot) => {
              const isSelected = activeSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => handleSlotTrigger(slot)}
                  className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500/40 border-amber-300 scale-95 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                      : 'bg-[#1e232e] hover:bg-[#282f3d] border-[#363f52]'
                  }`}
                  title={`${slot.name} [${slot.keyLabel}] - ${slot.description}`}
                  aria-label={`${slot.name} slot ${slot.keyLabel}`}
                >
                  {/* Slot Key Badge */}
                  <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-amber-200/80 leading-none">
                    {slot.keyLabel}
                  </span>

                  {/* Icon */}
                  <span
                    className="text-xs font-bold"
                    style={{ color: slot.color }}
                  >
                    {slot.id === 1 ? '⚔' : slot.id === 2 ? '✦' : slot.id === 3 ? '⛓' : '✚'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Small Utility Buttons */}
          <div className="flex items-center gap-1 border-l border-[#2e2720] pl-2">
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
              title="Toggle Touch D-Pad"
              aria-label="Toggle D-Pad"
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
                AETHELGARD CONTROLS
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
                <strong className="text-amber-200">Movement:</strong> Use{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  W
                </kbd>{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  A
                </kbd>{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  S
                </kbd>{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  D
                </kbd>{' '}
                or Arrow Keys.
              </p>
              <p>
                <strong className="text-amber-200">Diagonals:</strong> Press two
                adjacent keys or Numpad (1, 3, 7, 9). Corner cutting through solid
                walls is prevented.
              </p>
              <p>
                <strong className="text-amber-200">Spells:</strong> Hotkeys{' '}
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  1
                </kbd>
                -
                <kbd className="px-1 py-0.5 bg-[#2a2e38] rounded text-amber-400 border border-zinc-700">
                  4
                </kbd>{' '}
                or click the slots in the bottom bar.
              </p>
              <p>
                <strong className="text-amber-200">Classes:</strong>
                <br />• <em>Avenger</em>: 2-tile radiant whip, high HP & displacement.
                <br />• <em>Sage</em>: 4-tile aether wand, high MP & confusion.
              </p>
            </div>

            <div className="pt-1 text-center">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-1.5 bg-[#453728] hover:bg-[#5a4835] text-amber-200 font-bold rounded cursor-pointer transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
