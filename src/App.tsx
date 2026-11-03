import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CharacterClass, Direction, PlayerStats } from './types/game';
import { generateWorldMap } from './game/map';
import GameCanvas from './components/GameCanvas';
import RetroHUD from './components/RetroHUD';
import { Shield, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

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

  // Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    classType: 'Avenger',
    level: 1,
    hp: 150,
    maxHp: 150,
    mp: 60,
    maxMp: 60,
  });

  // Touch controls delegate ref
  const movementControlsRef = useRef<{
    setTouchDirection: (dir: Direction) => void;
  } | null>(null);

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
    movementControlsRef.current?.setTouchDirection(dir);
  }, []);

  // Movement hook delegate registration
  const handleMovementHookReady = useCallback(
    (controls: { setTouchDirection: (dir: Direction) => void }) => {
      movementControlsRef.current = controls;
    },
    []
  );

  return (
    <div className="min-h-screen w-screen bg-[#0b0d12] flex flex-col items-center justify-center p-1 sm:p-4 text-zinc-100 overflow-hidden font-sans">
      {/* ================= TITLE SCREEN ================= */}
      {gameState === 'title' && (
        <div className="flex flex-col items-center justify-center max-w-lg w-full p-6 bg-[#141720]/95 border-2 border-[#433b32] rounded-xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Retro Title Lockup */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#251f18] border border-[#52412d] rounded text-amber-400 text-xs font-mono tracking-widest uppercase">
              <span>✦</span> Tibia-Style 2D Grid Engine <span>✦</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-amber-200 uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] font-mono">
              AETHELGARD
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono">
              Phase 1: Grid Movement, Camera Viewport & Retro HUD
            </p>
          </div>

          {/* Class Selection Box */}
          <div className="w-full space-y-2">
            <span className="text-xs uppercase tracking-wider text-amber-400/90 font-mono font-bold">
              Select Starting Class
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Avenger Card */}
              <button
                type="button"
                onClick={() => handleSelectClass('Avenger')}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  stats.classType === 'Avenger'
                    ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-[#1b1f2b] border-[#2f374a] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-1 font-mono">
                  <Shield className="w-4 h-4" />
                  <span>Avenger</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Mid-range 2-tile radiant whip, high vitality, and crowd displacement.
                </p>
              </button>

              {/* Sage Card */}
              <button
                type="button"
                onClick={() => handleSelectClass('Sage')}
                className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                  stats.classType === 'Sage'
                    ? 'bg-sky-950/40 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                    : 'bg-[#1b1f2b] border-[#2f374a] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1 font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>Sage</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Ranged 4-tile aether wand, mystic air spells, and mind confusion.
                </p>
              </button>
            </div>
          </div>

          {/* Key Bindings Summary */}
          <div className="bg-[#0f1118] border border-[#2d251d] p-3 rounded-md text-[11px] text-zinc-400 font-mono w-full text-left space-y-1">
            <div className="text-amber-300 font-bold text-xs mb-1">CONTROLS:</div>
            <div>• <strong className="text-zinc-200">WASD / Arrow Keys</strong>: Cardinal & Diagonal Tile Movement</div>
            <div>• <strong className="text-zinc-200">Corner Cutting Blocked</strong>: Classic solid wall corner collision</div>
            <div>• <strong className="text-zinc-200">Action Keys [1 - 4]</strong>: Trigger hotbar spells</div>
            <div>• <strong className="text-zinc-200">Touch D-Pad</strong>: Available for touchscreens / small viewports</div>
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
              playerClass={stats.classType}
              showGrid={showGrid}
              onCoordinateChange={handleCoordinateChange}
              onMovementHookReady={handleMovementHookReady}
            />

            {/* Retro HUD Overlay */}
            <RetroHUD
              stats={stats}
              currentX={coords.x}
              currentY={coords.y}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid((prev) => !prev)}
              onSelectClass={handleSelectClass}
              onDpadDirection={handleDpadDirection}
              onActionPress={() => {
                // Flash action feedback
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
                    Simulation is paused. Current coordinates: ({coords.x}, {coords.y})
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
            <span>Aethelgard Engine · 32x32 Tiles · 15x11 Viewport (2x Pixelated)</span>
            <span>[P] Pause · [WASD] Move · [1-4] Spells</span>
          </div>
        </div>
      )}
    </div>
  );
}
