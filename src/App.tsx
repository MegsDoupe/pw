import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CharacterClass, Direction, Monster, PlayerStats } from './types/game';
import { generateWorldMap } from './game/map';
import GameCanvas, { CombatEngineHandle } from './components/GameCanvas';
import RetroHUD from './components/RetroHUD';
import { Shield, Sparkles, Play, Skull, Crosshair } from 'lucide-react';

export default function App() {
  // Query parameter check for ultra-mode autostart
  const isAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>(
    isAutostart ? 'playing' : 'title'
  );

  // Discrete grid coordinates for HUD (updates strictly on discrete steps)
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Player Stats with XP Tracking
  const [stats, setStats] = useState<PlayerStats>({
    classType: 'Avenger',
    level: 1,
    hp: 150,
    maxHp: 150,
    mp: 60,
    maxMp: 60,
    xp: 0,
    totalXpEarned: 0,
  });

  // Active targeted monster for HUD display
  const [targetMonster, setTargetMonster] = useState<Monster | null>(null);

  // Active ability cooldown map (slotId -> timestamp ms)
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // Combat Engine handle
  const combatEngineRef = useRef<CombatEngineHandle | null>(null);

  // Generate 40x40 procedural map once
  const worldMap = useMemo(() => generateWorldMap(), []);

  // Sync document.body dataset state for ultra-mode state machine hygiene
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Start game handler
  const startGame = useCallback(() => {
    setGameState('playing');
  }, []);

  // Keyboard shortcut listener for Title screen and Pause
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame();
        }
      } else if (gameState === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          setGameState('paused');
        }
      } else if (gameState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter') {
          e.preventDefault();
          setGameState('playing');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameState, startGame]);

  // Discrete coordinate change callback from movement engine
  const handleCoordinateChange = useCallback((x: number, y: number) => {
    setCoords({ x, y });
  }, []);

  // Player stats update callback (damage taken, healing, MP spent)
  const handlePlayerStatsChange = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
  }, []);

  // Target change callback
  const handleTargetChange = useCallback(
    (targetId: string | null, monster: Monster | null) => {
      setTargetMonster(monster);
    },
    []
  );

  // XP gain callback
  const handleGainXp = useCallback((amount: number) => {
    setStats((prev) => ({
      ...prev,
      xp: prev.xp + amount,
      totalXpEarned: prev.totalXpEarned + amount,
    }));
  }, []);

  // Cooldowns update callback
  const handleCooldownsChange = useCallback((cds: Record<number, number>) => {
    setCooldowns(cds);
  }, []);

  // Class toggle
  const handleSelectClass = useCallback((c: CharacterClass) => {
    setStats((prev) => ({
      ...prev,
      classType: c,
      maxHp: c === 'Avenger' ? 150 : 110,
      hp: c === 'Avenger' ? 150 : 110,
      maxMp: c === 'Avenger' ? 60 : 120,
      mp: c === 'Avenger' ? 60 : 120,
    }));
  }, []);

  // Virtual touch dpad handler
  const handleDpadDirection = useCallback((dir: Direction) => {
    combatEngineRef.current?.setTouchDirection(dir);
  }, []);

  // Trigger active ability 1-4
  const handleTriggerAbility = useCallback((slotId: number) => {
    combatEngineRef.current?.triggerAbility(slotId);
  }, []);

  // Cycle or auto-target nearest rat
  const handleCycleTarget = useCallback(() => {
    combatEngineRef.current?.cycleTarget();
  }, []);

  // Combat engine handle registration
  const handleCombatEngineReady = useCallback((handle: CombatEngineHandle) => {
    combatEngineRef.current = handle;
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#0b0d12] flex flex-col items-center justify-center p-1 sm:p-4 text-zinc-100 overflow-hidden font-sans">
      {/* ================= TITLE SCREEN ================= */}
      {gameState === 'title' && (
        <div className="flex flex-col items-center justify-center max-w-lg w-full p-6 bg-[#141720]/95 border-2 border-[#433b32] rounded-xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Retro Title Lockup */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#251f18] border border-[#52412d] rounded text-amber-400 text-xs font-mono tracking-widest uppercase">
              <span>✦</span> Tibia-Style Combat & Targeting Engine <span>✦</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-amber-200 uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] font-mono">
              AETHELGARD
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono">
              Phase 2: Real-Time Combat, Giant Rats & Level 1 Spells
            </p>
          </div>

          {/* Class Selection Box */}
          <div className="w-full space-y-2">
            <span className="text-xs uppercase tracking-wider text-amber-400/90 font-mono font-bold">
              Select Starting Class
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Avenger Card (Medium Tyrian Purple) */}
              <button
                type="button"
                onClick={() => handleSelectClass('Avenger')}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  stats.classType === 'Avenger'
                    ? 'bg-[#3b0b23]/50 border-[#9b2263] shadow-[0_0_15px_rgba(155,34,99,0.35)]'
                    : 'bg-[#1b1f2b] border-[#2f374a] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 text-[#e879f9] font-bold text-sm mb-1 font-mono">
                  <Shield className="w-4 h-4 text-[#d946ef]" />
                  <span>Avenger</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Tyrian purple tabard. 2-tile radiant whip, Entangling Lash (root), & Cinder Brand (heal).
                </p>
              </button>

              {/* Sage Card (Medium-Light Azure Blue) */}
              <button
                type="button"
                onClick={() => handleSelectClass('Sage')}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  stats.classType === 'Sage'
                    ? 'bg-[#0c2f4d]/50 border-[#38a2f5] shadow-[0_0_15px_rgba(56,162,245,0.35)]'
                    : 'bg-[#1b1f2b] border-[#2f374a] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 text-[#60a5fa] font-bold text-sm mb-1 font-mono">
                  <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                  <span>Sage</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Azure blue robes. 4-tile aether wand, Gale Shot (knockback), & Static Confusion (scramble AI).
                </p>
              </button>
            </div>
          </div>

          {/* Key Bindings Summary */}
          <div className="bg-[#0f1118] border border-[#2d251d] p-3 rounded-md text-[11px] text-zinc-400 font-mono w-full text-left space-y-1">
            <div className="text-amber-300 font-bold text-xs mb-1">COMBAT CONTROLS:</div>
            <div>• <strong className="text-zinc-200">Click Rat or Press Tab</strong>: Lock Target / Cycle Nearest</div>
            <div>• <strong className="text-zinc-200">Auto-Attack</strong>: Fires automatically within weapon reach</div>
            <div>• <strong className="text-zinc-200">Abilities [1] & [2]</strong>: Trigger spells (Root, Knockback, Heal, Confusion)</div>
            <div>• <strong className="text-zinc-200">WASD / Arrow Keys</strong>: Grid movement with corner collision check</div>
          </div>

          {/* Primary Start CTA Button */}
          <button
            data-start="true"
            onClick={startGame}
            className="w-full py-3.5 bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-extrabold text-base rounded-md shadow-lg tracking-wider font-mono cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2 border border-amber-300"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>ENTER THE REALM (SPACE / ENTER)</span>
          </button>
        </div>
      )}

      {/* ================= ACTIVE PLAYING / PAUSED VIEW ================= */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="relative flex flex-col items-center justify-center max-w-full">
          {/* Main Game Shell: Canvas + HUD Overlay */}
          <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden">
            <GameCanvas
              map={worldMap}
              initialX={coords.x}
              initialY={coords.y}
              playerStats={stats}
              showGrid={showGrid}
              onCoordinateChange={handleCoordinateChange}
              onPlayerStatsChange={handlePlayerStatsChange}
              onTargetChange={handleTargetChange}
              onGainXp={handleGainXp}
              onCooldownsChange={handleCooldownsChange}
              onCombatEngineReady={handleCombatEngineReady}
            />

            {/* Retro HUD Overlay */}
            <RetroHUD
              stats={stats}
              currentX={coords.x}
              currentY={coords.y}
              targetMonster={targetMonster}
              cooldowns={cooldowns}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid((prev) => !prev)}
              onSelectClass={handleSelectClass}
              onDpadDirection={handleDpadDirection}
              onTriggerAbility={handleTriggerAbility}
              onCycleTarget={handleCycleTarget}
              onActionPress={() => {
                handleTriggerAbility(1);
              }}
            />

            {/* Pause Modal Overlay */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-40 p-4 font-mono text-center">
                <div className="bg-[#181a20] border-2 border-[#544638] p-6 rounded-lg max-w-sm w-full space-y-4 shadow-2xl text-amber-100">
                  <h2 className="text-xl font-bold text-amber-300 tracking-wider">
                    GAME PAUSED
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Simulation is paused. Current coordinates: ({coords.x}, {coords.y}) · XP: {stats.xp}
                  </p>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => setGameState('playing')}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded cursor-pointer transition-colors"
                    >
                      RESUME (ESC / P)
                    </button>
                    <button
                      onClick={() => setGameState('title')}
                      className="w-full py-2 bg-[#2d323e] hover:bg-[#3d4556] text-zinc-300 rounded cursor-pointer transition-colors"
                    >
                      RETURN TO TITLE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls Strip */}
          <div className="mt-2 text-[11px] text-zinc-500 font-mono flex items-center justify-between w-full max-w-[960px] px-2">
            <span>Aethelgard Phase 2 · Tibia-Style Combat · Giant Rats</span>
            <span>[Tab / 🎯] Target · [1-2] Abilities · [WASD] Move</span>
          </div>
        </div>
      )}
    </div>
  );
}
