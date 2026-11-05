import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CharacterClass, Direction, Monster, PlayerStats, CorpseEntity, EquipSlot, EquipmentSlot, EquipmentState } from './types/game';
import { generateWorldMap } from './game/map';
import GameCanvas, { CombatEngineHandle } from './components/GameCanvas';
import TopStatusBar from './components/TopStatusBar';
import BottomActionTray from './components/BottomActionTray';
import MobileTouchControls from './components/MobileTouchControls';
import SkillsWindow from './components/SkillsWindow';
import InventoryWindow from './components/InventoryWindow';
import CorpseLootModal from './components/CorpseLootModal';
import { Shield, Sparkles, Play, BookOpen } from 'lucide-react';
import {
  createInitialPlayerStats,
  createInitialPlayerSkills,
  recalibratePlayerSkills,
  addXp,
} from './game/leveling';
import {
  addStackToPlayerInventory,
  equipItem,
  unequipItem,
  useConsumable,
  getItemDef,
  createStarterEquipmentAndInventory,
  recalculatePlayerGearStats,
} from './game/items';

export default function App() {
  // Query parameter check for autostart
  const isAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused'>(
    isAutostart ? 'playing' : 'title'
  );

  // Discrete grid coordinates for HUD
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showSkills, setShowSkills] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [activeCorpse, setActiveCorpse] = useState<CorpseEntity | null>(null);

  // Smart mobile touch controls: auto-hides on keyboard, auto-shows on touch
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // Player Stats with XP Tracking & Skill scaffolding (recalibrated to Level 10 baseline)
  const [stats, setStats] = useState<PlayerStats>(() => {
    const initial = createInitialPlayerStats('Avenger');
    recalibratePlayerSkills(initial);
    return initial;
  });

  // Active targeted monster
  const [targetMonster, setTargetMonster] = useState<Monster | null>(null);

  // Active ability cooldown map (slotId -> timestamp ms)
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  // 2-line retro combat log state
  const [combatLog, setCombatLog] = useState<string[]>([
    'Welcome to Aethelgard. Explore the biomes and train your skills.',
    'Click a monster or press [Tab] to lock target.',
  ]);

  // Combat Engine handle
  const combatEngineRef = useRef<CombatEngineHandle | null>(null);

  // Generate 40x40 procedural map once
  const worldMap = useMemo(() => generateWorldMap(), []);

  // Sync document.body dataset state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Start game handler
  const startGame = useCallback(() => {
    setGameState('playing');
  }, []);

  // Touch listener on window to auto-show virtual controls
  useEffect(() => {
    const handleTouchStart = () => {
      setShowTouchControls(true);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => window.removeEventListener('touchstart', handleTouchStart);
  }, []);

  // Keyboard shortcut listener for Combat, Skills, Pause, and Smart Auto-Hide
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      // Smart mobile controls auto-hide: Hide virtual D-pad if physical keyboard inputs are detected
      const physicalMovementKeys = [
        'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Digit1', 'Digit2', 'Digit3', 'Digit4',
        'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4',
        'Tab', 'Space',
      ];
      if (physicalMovementKeys.includes(e.code)) {
        setShowTouchControls(false);
      }

      if (e.code === 'KeyK') {
        if (gameState === 'playing' || gameState === 'paused') {
          e.preventDefault();
          setShowSkills((prev) => !prev);
          return;
        }
      }

      if (e.code === 'KeyI') {
        if (gameState === 'playing' || gameState === 'paused') {
          e.preventDefault();
          setShowInventory((prev) => !prev);
          return;
        }
      }

      if (gameState === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame();
        }
      } else if (gameState === 'playing') {
        if (e.code === 'Escape') {
          e.preventDefault();
          if (activeCorpse) {
            setActiveCorpse(null);
          } else if (showInventory) {
            setShowInventory(false);
          } else if (showSkills) {
            setShowSkills(false);
          } else if (targetMonster) {
            combatEngineRef.current?.clearTarget();
          } else {
            setGameState('paused');
          }
        } else if (e.code === 'KeyP') {
          e.preventDefault();
          setGameState('paused');
        } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          combatEngineRef.current?.triggerAbility(1);
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          combatEngineRef.current?.triggerAbility(2);
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          combatEngineRef.current?.triggerAbility(3);
        } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          combatEngineRef.current?.triggerAbility(4);
        } else if (e.code === 'Tab') {
          e.preventDefault();
          combatEngineRef.current?.cycleTarget();
        }
      } else if (gameState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter') {
          e.preventDefault();
          if (activeCorpse) {
            setActiveCorpse(null);
          } else if (showInventory) {
            setShowInventory(false);
          } else if (showSkills) {
            setShowSkills(false);
          } else {
            setGameState('playing');
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameState, startGame, showSkills, showInventory, activeCorpse, targetMonster]);

  // Coordinate change callback from movement engine
  const handleCoordinateChange = useCallback((x: number, y: number) => {
    setCoords({ x, y });
  }, []);

  // Player stats update callback
  const handlePlayerStatsChange = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
  }, []);

  // Target change callback
  const handleTargetChange = useCallback(
    (_targetId: string | null, monster: Monster | null) => {
      setTargetMonster(monster);
    },
    []
  );

  // XP gain callback
  const handleGainXp = useCallback((amount: number) => {
    setStats((prev) => {
      const copy = { ...prev };
      addXp(copy, amount);
      return copy;
    });
  }, []);

  // Cooldowns update callback
  const handleCooldownsChange = useCallback((cds: Record<number, number>) => {
    setCooldowns(cds);
  }, []);

  // Combat log message callback
  const handleLogMessage = useCallback((msg: string) => {
    setCombatLog((prev) => [msg, ...prev.slice(0, 19)]);
  }, []);

  // Class toggle with preserved level scaling
  const handleSelectClass = useCallback((c: CharacterClass) => {
    setStats((prev) => {
      const isAvenger = c === 'Avenger';
      const baseHp = isAvenger ? 150 : 110;
      const baseMp = isAvenger ? 60 : 120;
      const hpPerLvl = isAvenger ? 12 : 6;
      const mpPerLvl = isAvenger ? 8 : 16;
      const levelsGained = Math.max(0, prev.level - 1);
      const maxHp = baseHp + levelsGained * hpPerLvl;
      const maxMp = baseMp + levelsGained * mpPerLvl;
      const baseMinDamage = (isAvenger ? 8 : 6) + levelsGained;
      const baseMaxDamage = (isAvenger ? 12 : 10) + levelsGained;
      const armor = isAvenger ? 2 : 1;
      const resistances = isAvenger
        ? {
            origins: { radiant: 0.25, wild: 0.1, arcane: 0.0, eldritch: -0.15 },
            elements: { fire: 0.25, earth: 0.1, air: 0.0, water: -0.15 },
          }
        : {
            origins: { arcane: 0.25, eldritch: 0.1, radiant: 0.0, wild: -0.15 },
            elements: { air: 0.25, water: 0.1, earth: 0.0, fire: -0.15 },
          };

      const { equipment, inventory } = createStarterEquipmentAndInventory(c);
      const newStats: PlayerStats = {
        ...prev,
        classType: c,
        maxHp,
        hp: maxHp,
        maxMp,
        mp: maxMp,
        baseMinDamage,
        baseMaxDamage,
        armor,
        resistances,
        blocksThisRound: 0,
        blockRoundStartTime: 0,
        skills: createInitialPlayerSkills(c),
        equipment,
        inventory,
        capacityWeight: c === 'Avenger' ? 350 : 280,
      };
      recalculatePlayerGearStats(newStats);
      recalibratePlayerSkills(newStats);
      return newStats;
    });
    setCombatLog((prev) => [`✦ Class switched to ${c}. Equipped class starter kit.`, ...prev.slice(0, 19)]);
  }, []);

  // Open corpse container
  const handleOpenCorpse = useCallback((corpse: CorpseEntity) => {
    setActiveCorpse(corpse);
  }, []);

  // Close corpse container
  const handleCloseCorpse = useCallback(() => {
    setActiveCorpse(null);
  }, []);

  // Loot single item from active corpse into player inventory
  const handleLootItem = useCallback((itemIndex: number) => {
    if (!activeCorpse || !activeCorpse.items[itemIndex]) return;
    const itemToLoot = activeCorpse.items[itemIndex];
    const def = getItemDef(itemToLoot.itemId);

    setStats((prev) => {
      const copy = { ...prev };
      const res = addStackToPlayerInventory(copy, itemToLoot);
      if (res.success) {
        activeCorpse.items.splice(itemIndex, 1);
        handleLogMessage(`Looted ${def?.name ?? itemToLoot.itemId} (${itemToLoot.quantity}x).`);
        return copy;
      } else {
        handleLogMessage(`Cannot loot: ${res.reason}`);
        return prev;
      }
    });
  }, [activeCorpse, handleLogMessage]);

  // Loot all items from active corpse
  const handleTakeAll = useCallback(() => {
    if (!activeCorpse || activeCorpse.items.length === 0) return;

    setStats((prev) => {
      const copy = { ...prev };
      let lootedCount = 0;
      const remaining: typeof activeCorpse.items = [];

      for (const item of activeCorpse.items) {
        const res = addStackToPlayerInventory(copy, item);
        if (res.success) {
          lootedCount += 1;
        } else {
          remaining.push(item);
        }
      }

      activeCorpse.items = remaining;

      if (lootedCount > 0) {
        handleLogMessage(`Took ${lootedCount} item stack(s) from ${activeCorpse.monsterName} remains.`);
      }
      if (remaining.length > 0) {
        handleLogMessage(`Backpack full or capacity reached! Some items remained.`);
      }

      return copy;
    });
  }, [activeCorpse, handleLogMessage]);

  // Equip item from backpack into equipment slot
  const handleEquipItem = useCallback((backpackIndex: number) => {
    setStats((prev) => {
      const copy = { ...prev };
      const item = copy.inventory?.[backpackIndex];
      const def = item ? getItemDef(item.itemId) : null;
      const success = equipItem(copy, backpackIndex);
      if (success) {
        handleLogMessage(`Equipped ${def?.name ?? 'item'}.`);
        return copy;
      } else {
        handleLogMessage(`Cannot equip item.`);
        return prev;
      }
    });
  }, [handleLogMessage]);

  // Unequip item from paperdoll slot into backpack
  const handleUnequipItem = useCallback((slot: EquipmentSlot) => {
    setStats((prev) => {
      const copy = { ...prev };
      const equipped = copy.equipment?.[slot];
      const def = equipped ? getItemDef(equipped.itemId) : null;
      const success = unequipItem(copy, slot);
      if (success) {
        handleLogMessage(`Unequipped ${def?.name ?? slot} into backpack.`);
        return copy;
      } else {
        handleLogMessage(`Cannot unequip (backpack full).`);
        return prev;
      }
    });
  }, [handleLogMessage]);

  // Use consumable from backpack
  const handleUseConsumable = useCallback((backpackIndex: number) => {
    setStats((prev) => {
      const copy = { ...prev };
      const item = copy.inventory?.[backpackIndex];
      const def = item ? getItemDef(item.itemId) : null;
      const prevHp = copy.hp;
      const res = useConsumable(copy, backpackIndex);
      if (res.success) {
        const healed = copy.hp - prevHp;
        handleLogMessage(`✦ Used ${def?.name ?? 'healing item'} (+${healed} HP).`);
        return copy;
      } else {
        handleLogMessage(`Cannot use item.`);
        return prev;
      }
    });
  }, [handleLogMessage]);

  // Virtual touch dpad handler
  const handleDpadDirection = useCallback((dir: Direction) => {
    combatEngineRef.current?.setTouchDirection(dir);
  }, []);

  // Trigger active ability 1-4
  const handleTriggerAbility = useCallback((slotId: number) => {
    return combatEngineRef.current?.triggerAbility(slotId);
  }, []);

  // Cycle or auto-target nearest
  const handleCycleTarget = useCallback(() => {
    combatEngineRef.current?.cycleTarget();
  }, []);

  // Clear target
  const handleClearTarget = useCallback(() => {
    combatEngineRef.current?.clearTarget();
  }, []);

  // Combat engine handle registration
  const handleCombatEngineReady = useCallback((handle: CombatEngineHandle) => {
    combatEngineRef.current = handle;
  }, []);

  return (
    <div className="h-screen w-screen bg-[#08090d] flex flex-col justify-between overflow-hidden text-zinc-100 font-sans select-none">
      {/* ================= TITLE SCREEN ================= */}
      {gameState === 'title' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center max-w-lg w-full p-6 bg-[#16100c] border-4 border-[#3e2718] rounded-xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Retro Title Lockup */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#261910] border border-[#543820] rounded text-amber-400 text-xs font-mono tracking-widest uppercase">
                <span>✦</span> Authentic Tibia-Style RPG Client <span>✦</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-amber-200 uppercase drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] font-mono">
                AETHELGARD
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                Grid-Based Exploration, Biome Spawners, & Multi-Axis Progression
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
                      ? 'bg-[#3b0b23]/60 border-[#9b2263] shadow-[0_0_15px_rgba(155,34,99,0.4)]'
                      : 'bg-[#1b140f] border-[#382619] opacity-60 hover:opacity-100'
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

                {/* Sage Card */}
                <button
                  type="button"
                  onClick={() => handleSelectClass('Sage')}
                  className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer ${
                    stats.classType === 'Sage'
                      ? 'bg-[#0c2f4d]/60 border-[#38a2f5] shadow-[0_0_15px_rgba(56,162,245,0.4)]'
                      : 'bg-[#1b140f] border-[#382619] opacity-60 hover:opacity-100'
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
            <div className="bg-[#100b08] border border-[#3b271a] p-3 rounded-md text-[11px] text-zinc-400 font-mono w-full text-left space-y-1">
              <div className="text-amber-300 font-bold text-xs mb-1">CLIENT KEYBINDS & CONTROLS:</div>
              <div>• <strong className="text-zinc-200">WASD / Arrow Keys</strong>: 8-Direction Grid Walk</div>
              <div>• <strong className="text-zinc-200">Tab / Click Monster</strong>: Lock Target / Cycle Nearest</div>
              <div>• <strong className="text-zinc-200">Click Corpse (≤1 tile)</strong>: Open Loot Container & Take All</div>
              <div>• <strong className="text-zinc-200">Key [I]</strong>: Open Equipment Paperdoll & Backpack Grid</div>
              <div>• <strong className="text-zinc-200">Abilities [1], [2], [3]</strong>: Cast Spells & Sun Draught / Flask</div>
              <div>• <strong className="text-zinc-200">Key [K]</strong>: Open Slide-out Skills Progression Drawer</div>
              <div>• <strong className="text-zinc-200">Key [Esc]</strong>: Close Windows / Clear Target / Pause</div>
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
        </div>
      )}

      {/* ================= ACTIVE PLAYING / PAUSED VIEW: AUTHENTIC 3-ZONE CLIENT ================= */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="h-full w-full flex flex-col justify-between overflow-hidden">
          {/* ZONE 1: Docked Top Status Bar */}
          <TopStatusBar
            stats={stats}
            currentX={coords.x}
            currentY={coords.y}
            targetMonster={targetMonster}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((prev) => !prev)}
            onSelectClass={handleSelectClass}
            showSkills={showSkills}
            onToggleSkills={() => setShowSkills((prev) => !prev)}
            showInventory={showInventory}
            onToggleInventory={() => setShowInventory((prev) => !prev)}
            showTouchControls={showTouchControls}
            onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
            onPause={() => setGameState('paused')}
          />

          {/* ZONE 2: Main Center Area (Fixed-Aspect Canvas in Timber Chassis + Smart Touch Overlays) */}
          <main className="flex-1 min-h-0 w-full flex items-center justify-center p-2 sm:p-3 relative bg-[#090b0e] overflow-hidden">
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
              onLogMessage={handleLogMessage}
              onCombatEngineReady={handleCombatEngineReady}
              onOpenCorpse={handleOpenCorpse}
              onCloseCorpse={handleCloseCorpse}
              activeCorpseId={activeCorpse?.id ?? null}
            />

            {/* Floating Mobile Touch Controls (Auto-hides on keyboard, auto-shows on touch) */}
            <MobileTouchControls
              visible={showTouchControls}
              onDpadDirection={handleDpadDirection}
              onCycleTarget={handleCycleTarget}
              onActionPress={() => handleTriggerAbility(1)}
            />
          </main>

          {/* ZONE 3: Bottom Docked Action Tray (Hotbar 1-4, Target controls, 2-line Combat Log) */}
          <BottomActionTray
            stats={stats}
            cooldowns={cooldowns}
            targetMonster={targetMonster}
            onTriggerAbility={handleTriggerAbility}
            onCycleTarget={handleCycleTarget}
            onClearTarget={handleClearTarget}
            combatLog={combatLog}
          />

          {/* Slide-Out Right Drawer (Skills & Aptitudes) */}
          <SkillsWindow
            stats={stats}
            isOpen={showSkills}
            onClose={() => setShowSkills(false)}
          />

          {/* Slide-Out / Floating Inventory & Equipment Paperdoll Drawer */}
          <InventoryWindow
            stats={stats}
            isOpen={showInventory}
            onClose={() => setShowInventory(false)}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
            onUseConsumable={handleUseConsumable}
          />

          {/* Clickable Monster Corpse Container Loot Modal */}
          <CorpseLootModal
            corpse={activeCorpse}
            isOpen={!!activeCorpse}
            currentWeight={stats.currentWeight ?? 0}
            capacityWeight={stats.capacityWeight ?? 300}
            onClose={handleCloseCorpse}
            onLootItem={handleLootItem}
            onTakeAll={handleTakeAll}
          />

          {/* Pause Modal Overlay */}
          {gameState === 'paused' && (
            <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4 font-mono text-center animate-in fade-in duration-200">
              <div className="bg-[#18120e] border-4 border-[#432d1d] p-6 rounded-lg max-w-sm w-full space-y-4 shadow-2xl text-amber-100">
                <h2 className="text-xl font-bold text-amber-300 tracking-wider">
                  GAME PAUSED
                </h2>
                <p className="text-xs text-zinc-400">
                  Simulation paused at ({coords.x}, {coords.y}) · Level {stats.level} {stats.classType}
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setGameState('playing')}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded cursor-pointer transition-colors"
                  >
                    RESUME (ESC / P)
                  </button>
                  <button
                    onClick={() => setShowInventory(true)}
                    className="w-full py-2 bg-[#251b14] hover:bg-[#342419] border border-[#523820] text-amber-200 rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <span>INVENTORY & GEAR [I]</span>
                  </button>
                  <button
                    onClick={() => setShowSkills(true)}
                    className="w-full py-2 bg-[#251b14] hover:bg-[#342419] border border-[#523820] text-amber-200 rounded cursor-pointer transition-colors flex items-center justify-center gap-1.5 text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>VIEW SKILLS [K]</span>
                  </button>
                  <button
                    onClick={() => setGameState('title')}
                    className="w-full py-2 bg-[#1b1511] hover:bg-[#2a1e16] border border-[#3b2719] text-zinc-400 hover:text-white rounded cursor-pointer transition-colors text-xs"
                  >
                    RETURN TO TITLE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
