import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CharacterClass,
  Direction,
  FloatingText,
  Monster,
  PlayerStats,
  TileId,
  TILE_SIZE,
  VisualEffect,
} from '../types/game';
import { calculateCamera } from '../game/camera';
import { renderGameScene } from '../game/renderer';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import {
  spawnGiantRats,
  calculateMonsterStep,
  getTileDistance,
  getRandomStepThreshold,
  attemptStepSpawn,
  leashMonsters,
} from '../game/monsters';
import {
  findNearestMonster,
  shouldBreakTargetLock,
  checkAutoAttack,
  executeAbility,
  rollDamage,
  calculateDamageAgainstMonster,
  resolvePhysicalAttack,
  resolveSpellAttack,
} from '../game/combat';
import {
  addXp,
  onDamageDealt,
  onManaSpent,
  onDamageTaken,
  recordSpellCast,
  recordWeaponHit,
  recordDefenseHit,
  playLevelUpFanfare,
  playSkillAdvanceChime,
} from '../game/leveling';

export interface CombatEngineHandle {
  setTouchDirection: (dir: Direction) => void;
  triggerAbility: (slotId: number) => { success: boolean; reason?: string; message?: string };
  cycleTarget: () => string | null;
  autoTargetNearest: () => string | null;
  clearTarget: () => void;
}

export interface GameCanvasProps {
  map: TileId[][];
  initialX: number;
  initialY: number;
  playerStats: PlayerStats;
  showGrid?: boolean;
  onCoordinateChange: (x: number, y: number) => void;
  onPlayerStatsChange: (stats: PlayerStats) => void;
  onTargetChange: (targetId: string | null, targetMonster: Monster | null) => void;
  onGainXp: (amount: number) => void;
  onCooldownsChange?: (cooldowns: Record<number, number>) => void;
  onLogMessage?: (msg: string) => void;
  onCombatEngineReady?: (handle: CombatEngineHandle) => void;
}

export default function GameCanvas({
  map,
  initialX,
  initialY,
  playerStats,
  showGrid = false,
  onCoordinateChange,
  onPlayerStatsChange,
  onTargetChange,
  onGainXp,
  onCooldownsChange,
  onLogMessage,
  onCombatEngineReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const onStepCompleteRef = useRef<((x: number, y: number) => void) | undefined>(undefined);

  // Hook handles movement math, interpolation, and keyboard listeners without causing React re-renders
  const { movementState, tick, setTouchDirection } = usePlayerMovement({
    map,
    initialX,
    initialY,
    onCoordinateChange,
    onStepComplete: (x, y) => onStepCompleteRef.current?.(x, y),
  });

  // Mutable combat & monster state stored in refs to prevent React 60 FPS re-render churning
  const monstersRef = useRef<Monster[]>(spawnGiantRats(map));
  const targetIdRef = useRef<string | null>(null);
  const visualEffectsRef = useRef<VisualEffect[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cooldownsRef = useRef<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const playerStatsRef = useRef<PlayerStats>(playerStats);
  playerStatsRef.current = playerStats;

  // Step-Based Mob Spawner state & oscillation detector
  const stepThresholdRef = useRef<number>(getRandomStepThreshold());
  const currentStepCountRef = useRef<number>(0);
  const recentPositionsRef = useRef<{ x: number; y: number }[]>([
    { x: initialX, y: initialY },
  ]);

  const lastAutoAttackTimeRef = useRef<number>(0);
  const lastMpRegenTimeRef = useRef<number>(0);
  const lastFrameTimestampRef = useRef<number>(0);
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Props ref for RAF loop
  const propsRef = useRef({
    map,
    showGrid,
    onPlayerStatsChange,
    onTargetChange,
    onGainXp,
    onCooldownsChange,
    onLogMessage,
  });
  propsRef.current = {
    map,
    showGrid,
    onPlayerStatsChange,
    onTargetChange,
    onGainXp,
    onCooldownsChange,
    onLogMessage,
  };

  // Helper to add floating combat text
  const addFloatingText = useCallback((text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: `ftext_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      color,
      startTime: performance.now(),
      durationMs: 950,
    });
  }, []);

  // Helper to add visual attack effects
  const addVisualEffect = useCallback(
    (type: VisualEffect['type'], fromX: number, fromY: number, toX: number, toY: number, color = '#f59e0b', durationOverride?: number) => {
      visualEffectsRef.current.push({
        id: `eff_${Date.now()}_${Math.random()}`,
        type,
        fromX,
        fromY,
        toX,
        toY,
        startTime: performance.now(),
        durationMs: durationOverride ?? (type === 'spawn_puff' ? 300 : type === 'level_up_nova' ? 600 : 250),
        color,
      });
    },
    []
  );

  // Step completion callback with oscillation detection and biome spawner invocation
  const handleStepComplete = useCallback(
    (stepX: number, stepY: number) => {
      const history = recentPositionsRef.current;
      // Oscillation check: if walking back and forth between the exact same 2 tiles repeatedly (A -> B -> A), do not count
      let isOscillation = false;
      if (history.length >= 2) {
        const prevPrev = history[history.length - 2];
        if (prevPrev.x === stepX && prevPrev.y === stepY) {
          isOscillation = true;
        }
      }

      history.push({ x: stepX, y: stepY });
      if (history.length > 4) history.shift();

      if (!isOscillation) {
        currentStepCountRef.current += 1;
        const stats = playerStatsRef.current;
        stats.explorationSteps = (stats.explorationSteps ?? 0) + 1;

        if (currentStepCountRef.current >= stepThresholdRef.current) {
          const now = performance.now();
          const spawnResult = attemptStepSpawn(
            stepX,
            stepY,
            stats.level,
            propsRef.current.map,
            monstersRef.current,
            now
          );

          if (spawnResult) {
            monstersRef.current.push(spawnResult.monster);
            // White/gray puff/dust effect on spawn tile for ~300ms
            addVisualEffect(
              'spawn_puff',
              spawnResult.spawnX * TILE_SIZE + TILE_SIZE / 2,
              spawnResult.spawnY * TILE_SIZE + TILE_SIZE / 2,
              spawnResult.spawnX * TILE_SIZE + TILE_SIZE / 2,
              spawnResult.spawnY * TILE_SIZE + TILE_SIZE / 2,
              '#cbd5e1'
            );
            propsRef.current.onLogMessage?.(
              `A wild ${spawnResult.monster.name} emerges from the terrain!`
            );
          }

          // Reset step counter and roll new threshold (12 to 18 steps)
          currentStepCountRef.current = 0;
          stepThresholdRef.current = getRandomStepThreshold();
        }
      }
    },
    [addVisualEffect]
  );
  onStepCompleteRef.current = handleStepComplete;

  // Helper to handle monster death, XP curve evaluation, level-up visual nova & floating text
  const handleMonsterSlay = useCallback(
    (target: Monster, timestamp: number) => {
      target.isAlive = false;
      target.deathTime = timestamp;

      const player = movementState.current;
      const stats = playerStatsRef.current;
      const xpReward = target.xpReward;

      // Floating XP gain text over monster corpse
      addFloatingText(
        `+${xpReward} XP`,
        target.renderX + TILE_SIZE / 2,
        target.renderY - 8,
        '#38bdf8'
      );

      // Evaluate Tibia-style XP curve & rollover level progression
      const result = addXp(stats, xpReward);

      if (result.leveledUp) {
        for (const newLvl of result.levelsGained) {
          // 1. Golden floating text over player sprite: "LEVEL UP! Level {newLevel}" rising & fading
          floatingTextsRef.current.push({
            id: `lvlup_${Date.now()}_${Math.random()}`,
            text: `LEVEL UP! Level ${newLvl}`,
            x: player.renderX + TILE_SIZE / 2,
            y: player.renderY - 10,
            color: '#facc15',
            startTime: performance.now(),
            durationMs: 1400,
          });

          // 2. Expanding golden nova / circular ring on player tile lasting ~600ms
          visualEffectsRef.current.push({
            id: `nova_${Date.now()}_${Math.random()}`,
            type: 'level_up_nova',
            fromX: player.renderX + TILE_SIZE / 2,
            fromY: player.renderY + TILE_SIZE / 2,
            toX: player.renderX + TILE_SIZE / 2,
            toY: player.renderY + TILE_SIZE / 2,
            startTime: performance.now(),
            durationMs: 600,
            color: '#facc15',
          });

          // 3. Audio fanfare chime
          playLevelUpFanfare();

          propsRef.current.onLogMessage?.(
            `✦ LEVEL UP! You reached Level ${newLvl}! Max HP +${result.totalHpGained}, Max MP +${result.totalMpGained}. HP/MP fully restored!`
          );
        }
      }

      targetIdRef.current = null;
      propsRef.current.onTargetChange(null, null);
      propsRef.current.onPlayerStatsChange({ ...stats });
      propsRef.current.onGainXp(xpReward);
      propsRef.current.onLogMessage?.(`${target.name} slain! +${xpReward} XP`);
    },
    [addFloatingText, movementState]
  );

  // Cycle or auto-target nearest rat
  const autoTargetNearest = useCallback((): string | null => {
    const player = movementState.current;
    const target = findNearestMonster(
      player.gridX,
      player.gridY,
      monstersRef.current,
      targetIdRef.current
    );

    const newTargetId = target ? target.id : null;
    targetIdRef.current = newTargetId;
    propsRef.current.onTargetChange(newTargetId, target);
    if (target) {
      propsRef.current.onLogMessage?.(`Targeted: ${target.name} (HP ${target.hp}/${target.maxHp})`);
    } else {
      propsRef.current.onLogMessage?.('No targets within 8 tiles');
    }
    return newTargetId;
  }, [movementState]);

  // Execute an active ability (Slot 1, 2, or 3)
  const triggerAbility = useCallback(
    (slotId: number): { success: boolean; reason?: string; message?: string } => {
      const now = performance.now();
      const player = movementState.current;
      const stats = playerStatsRef.current;
      let currentTarget = monstersRef.current.find(
        (m) => m.id === targetIdRef.current && m.isAlive
      );

      // If targeted ability (Slot 1 or 2) and no target selected, automatically acquire nearest living rat within 8 tiles
      if (!currentTarget && (slotId === 1 || slotId === 2)) {
        const nearest = findNearestMonster(player.gridX, player.gridY, monstersRef.current);
        if (nearest) {
          targetIdRef.current = nearest.id;
          currentTarget = nearest;
          propsRef.current.onTargetChange(nearest.id, nearest);
        }
      }

      const result = executeAbility(
        slotId,
        stats,
        player.gridX,
        player.gridY,
        currentTarget || null,
        propsRef.current.map,
        monstersRef.current,
        cooldownsRef.current[slotId] || 0,
        now
      );

      if (!result.success) {
        if (result.reason === 'no_mana') {
          addFloatingText('Not enough MP!', player.renderX + TILE_SIZE / 2, player.renderY - 8, '#f87171');
        } else if (result.reason === 'no_target') {
          addFloatingText('No target locked!', player.renderX + TILE_SIZE / 2, player.renderY - 8, '#fbbf24');
        } else if (result.reason === 'out_of_range') {
          addFloatingText('Out of range!', player.renderX + TILE_SIZE / 2, player.renderY - 8, '#fb923c');
        } else if (result.reason === 'cooldown') {
          const cdLeft = Math.max(0, (cooldownsRef.current[slotId] || 0) - now);
          addFloatingText(`${(cdLeft / 1000).toFixed(1)}s CD`, player.renderX + TILE_SIZE / 2, player.renderY - 8, '#94a3b8');
        }

        if (result.message) {
          propsRef.current.onLogMessage?.(result.message);
        }
        return { success: false, reason: result.reason, message: result.message };
      }

      // Valid Cast Execution!
      // 1. Deduct MP (or restore if negative)
      if (result.mpCost) {
        stats.mp = Math.max(0, Math.min(stats.maxMp, stats.mp - result.mpCost));
        if (result.mpCost > 0) {
          if (result.origin && result.element) {
            const isDangerous = currentTarget ? (currentTarget.minLevel ?? 1) >= stats.level : false;
            const skillEvents = recordSpellCast(stats, result.origin, result.element, result.mpCost, isDangerous);
            for (const ev of skillEvents) {
              addFloatingText(
                `${ev.skillName} Up! (${ev.newLevel})`,
                player.renderX + TILE_SIZE / 2,
                player.renderY - 14,
                ev.color
              );
              playSkillAdvanceChime();
              propsRef.current.onLogMessage?.(`✦ Skill Advance: ${ev.skillName} increased to Level ${ev.newLevel}!`);
            }
          } else {
            onManaSpent(stats, `slot_${slotId}`, result.mpCost);
          }
        }
      }

      // 2. Set Cooldown
      const cdDuration = result.cooldownMs || 3000;
      cooldownsRef.current[slotId] = now + cdDuration;
      propsRef.current.onCooldownsChange?.({ ...cooldownsRef.current });

      // 3. Self-healing / Restoration
      if (result.heal) {
        stats.hp = Math.min(stats.maxHp, stats.hp + result.heal);
        addFloatingText(
          `+${result.heal}`,
          player.renderX + TILE_SIZE / 2,
          player.renderY + 4,
          '#4ade80'
        );
      }

      // 4. Targeted ability effects on monster
      if (currentTarget) {
        // Apply Damage with Dual-Axis Spell Resolution (evaluating defender's origin and element resistances)
        if (result.damage) {
          const spellRes = resolveSpellAttack({
            rawDamage: result.damage,
            origin: result.origin,
            element: result.element,
            defenderResistances: currentTarget.resistances,
          });

          const finalDamage = spellRes.finalDamage;
          currentTarget.hp = Math.max(0, currentTarget.hp - finalDamage);
          onDamageDealt(
            stats,
            result.element ?? (stats.classType === 'Avenger' ? 'fire' : 'arcane'),
            finalDamage
          );

          if (spellRes.vulnerabilityBonus > 0) {
            addFloatingText(
              `${finalDamage}!`,
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY + 4,
              '#facc15'
            );
            addFloatingText(
              'WEAKNESS!',
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY - 10,
              '#f59e0b'
            );
            propsRef.current.onLogMessage?.(
              `✦ WEAKNESS! Spell dealt ${finalDamage} critical damage to ${currentTarget.name} (+${spellRes.vulnerabilityBonus})!`
            );
          } else if (spellRes.resistedAmount > 0) {
            addFloatingText(
              `${finalDamage}`,
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY + 4,
              '#94a3b8'
            );
            addFloatingText(
              'RESIST',
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY - 10,
              '#94a3b8'
            );
            propsRef.current.onLogMessage?.(
              `Spell dealt ${finalDamage} damage to ${currentTarget.name} (Resisted: -${spellRes.resistedAmount})`
            );
          } else {
            addFloatingText(
              `${finalDamage}`,
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY + 4,
              '#fbbf24'
            );
          }
        }

        // Apply Visual Spell Effect
        if (result.effectType) {
          addVisualEffect(
            result.effectType,
            player.renderX + TILE_SIZE / 2,
            player.renderY + TILE_SIZE / 2,
            currentTarget.renderX + TILE_SIZE / 2,
            currentTarget.renderY + TILE_SIZE / 2
          );
        }

        // Apply Status Effects (Rooted or Confused)
        if (result.statusEffect) {
          if (result.statusEffect.type === 'rooted' || result.statusEffect.type === 'root') {
            currentTarget.statusEffects.rootedUntil = now + result.statusEffect.durationMs;
            currentTarget.statusEffects.rootedRemainingMs = result.statusEffect.durationMs;

            // Instantly halt movement
            currentTarget.isMoving = false;
            currentTarget.targetX = currentTarget.gridX;
            currentTarget.targetY = currentTarget.gridY;
            currentTarget.renderX = currentTarget.gridX * TILE_SIZE;
            currentTarget.renderY = currentTarget.gridY * TILE_SIZE;

            addFloatingText(
              'ROOTED!',
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY - 8,
              '#f59e0b'
            );
          } else if (result.statusEffect.type === 'confused' || result.statusEffect.type === 'confuse') {
            currentTarget.statusEffects.confusedUntil = now + result.statusEffect.durationMs;
            currentTarget.statusEffects.confusedRemainingMs = result.statusEffect.durationMs;

            addFloatingText(
              'CONFUSED!',
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY - 8,
              '#c084fc'
            );
          }
        }

        // Apply Knockback (Aether Gale Shot)
        if (result.knockbackDest) {
          if (!result.knockbackDest.wasBlocked && (result.knockbackDest.x !== currentTarget.gridX || result.knockbackDest.y !== currentTarget.gridY)) {
            currentTarget.gridX = result.knockbackDest.x;
            currentTarget.gridY = result.knockbackDest.y;
            currentTarget.targetX = result.knockbackDest.x;
            currentTarget.targetY = result.knockbackDest.y;
            currentTarget.renderX = result.knockbackDest.x * TILE_SIZE;
            currentTarget.renderY = result.knockbackDest.y * TILE_SIZE;
            currentTarget.isMoving = false;

            addFloatingText(
              'KNOCKBACK!',
              currentTarget.renderX + TILE_SIZE / 2,
              currentTarget.renderY - 8,
              '#38bdf8'
            );
          }
        }

        // Check monster death
        if (currentTarget.hp <= 0) {
          handleMonsterSlay(currentTarget, now);
        } else {
          propsRef.current.onTargetChange(currentTarget.id, currentTarget);
        }
      }

      propsRef.current.onPlayerStatsChange({ ...stats });
      return { success: true };
    },
    [addFloatingText, addVisualEffect, movementState]
  );

  // Clear current target lock
  const clearTarget = useCallback(() => {
    targetIdRef.current = null;
    propsRef.current.onTargetChange(null, null);
    propsRef.current.onLogMessage?.('Target cleared');
  }, []);

  // Expose Combat Engine controls to parent
  useEffect(() => {
    if (onCombatEngineReady) {
      onCombatEngineReady({
        setTouchDirection,
        triggerAbility,
        cycleTarget: autoTargetNearest,
        autoTargetNearest,
        clearTarget,
      });
    }
  }, [onCombatEngineReady, setTouchDirection, triggerAbility, autoTargetNearest, clearTarget]);

  // Click on canvas to select target monster
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    const worldX = screenX + cameraRef.current.x;
    const worldY = screenY + cameraRef.current.y;

    const clickedTileX = Math.floor(worldX / TILE_SIZE);
    const clickedTileY = Math.floor(worldY / TILE_SIZE);

    // Find living monster at clicked tile or adjacent to click
    const clickedMonster = monstersRef.current.find(
      (m) =>
        m.isAlive &&
        (m.gridX === clickedTileX || m.targetX === clickedTileX) &&
        (m.gridY === clickedTileY || m.targetY === clickedTileY)
    );

    if (clickedMonster) {
      targetIdRef.current = clickedMonster.id;
      propsRef.current.onTargetChange(clickedMonster.id, clickedMonster);
      propsRef.current.onLogMessage?.(`Targeted: ${clickedMonster.name} (${clickedMonster.hp}/${clickedMonster.maxHp} HP)`);
    }
  };

  // Main 60 FPS requestAnimationFrame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;
    let isRunning = true;
    let lastRenderTime = 0;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      const player = movementState.current;
      const isPlayerMoving = player.isMoving;
      const timeSinceLast = timestamp - lastRenderTime;

      // Maintain high frame rate during combat, movement, or active effects
      const hasActiveEffects =
        visualEffectsRef.current.length > 0 ||
        floatingTextsRef.current.length > 0 ||
        monstersRef.current.some((m) => m.isMoving || (m.isAlive && getTileDistance(m.gridX, m.gridY, player.gridX, player.gridY) <= 4));

      const shouldRender = isPlayerMoving || hasActiveEffects || timeSinceLast >= 33;

      if (shouldRender) {
        lastRenderTime = timestamp;

        // Calculate deltaTime for smooth timer decrements
        const deltaTime = lastFrameTimestampRef.current ? Math.min(100, timestamp - lastFrameTimestampRef.current) : 16;
        lastFrameTimestampRef.current = timestamp;

        // Passive MP Regeneration (1 MP every 1500ms)
        if (timestamp - lastMpRegenTimeRef.current >= 1500) {
          lastMpRegenTimeRef.current = timestamp;
          const currentStats = playerStatsRef.current;
          if (currentStats.mp < currentStats.maxMp) {
            currentStats.mp = Math.min(currentStats.maxMp, currentStats.mp + 1);
            propsRef.current.onPlayerStatsChange({ ...currentStats });
          }
        }

        // 1. Advance player movement interpolation tick
        tick(timestamp);

        // 2. Advance Monster AI & Interpolation
        const monsters = monstersRef.current;
        for (const monster of monsters) {
          if (!monster.isAlive) continue;

          // Decrement status timers by deltaTime
          if (monster.statusEffects.rootedRemainingMs !== undefined && monster.statusEffects.rootedRemainingMs > 0) {
            monster.statusEffects.rootedRemainingMs = Math.max(0, monster.statusEffects.rootedRemainingMs - deltaTime);
            if (monster.statusEffects.rootedRemainingMs <= 0) {
              delete monster.statusEffects.rootedRemainingMs;
              delete monster.statusEffects.rootedUntil;
            }
          }

          if (monster.statusEffects.confusedRemainingMs !== undefined && monster.statusEffects.confusedRemainingMs > 0) {
            monster.statusEffects.confusedRemainingMs = Math.max(0, monster.statusEffects.confusedRemainingMs - deltaTime);
            if (monster.statusEffects.confusedRemainingMs <= 0) {
              delete monster.statusEffects.confusedRemainingMs;
              delete monster.statusEffects.confusedUntil;
            }
          }

          const isRooted =
            (monster.statusEffects.rootedRemainingMs !== undefined && monster.statusEffects.rootedRemainingMs > 0) ||
            (monster.statusEffects.rootedUntil !== undefined && timestamp < monster.statusEffects.rootedUntil);

          // A. Movement interpolation and decisions
          if (isRooted) {
            // Rooted: monster cannot step tiles. Halt any active movement step immediately
            if (monster.isMoving) {
              monster.isMoving = false;
              monster.targetX = monster.gridX;
              monster.targetY = monster.gridY;
              monster.renderX = monster.gridX * TILE_SIZE;
              monster.renderY = monster.gridY * TILE_SIZE;
            }
          } else if (monster.isMoving) {
            const elapsed = timestamp - monster.moveStartTime;
            const progress = elapsed / 200; // 200ms step
            if (progress >= 1.0) {
              monster.gridX = monster.targetX;
              monster.gridY = monster.targetY;
              monster.renderX = monster.gridX * TILE_SIZE;
              monster.renderY = monster.gridY * TILE_SIZE;
              monster.isMoving = false;
            } else {
              monster.renderX = (monster.gridX + (monster.targetX - monster.gridX) * progress) * TILE_SIZE;
              monster.renderY = (monster.gridY + (monster.targetY - monster.gridY) * progress) * TILE_SIZE;
            }
          } else {
            // Movement decision (every 800ms)
            if (timestamp - monster.lastMoveTime >= monster.moveIntervalMs) {
              const step = calculateMonsterStep(
                monster,
                player.gridX,
                player.gridY,
                propsRef.current.map,
                monsters,
                timestamp
              );
              if (step) {
                monster.targetX = monster.gridX + step.dx;
                monster.targetY = monster.gridY + step.dy;
                monster.isMoving = true;
                monster.moveStartTime = timestamp;
                monster.lastMoveTime = timestamp;
              }
            }
          }

          // B. Monster Attack (melee reach or ranged spore artillery, allowed even if rooted)
          const distToPlayer = getTileDistance(monster.gridX, monster.gridY, player.gridX, player.gridY);
          const reach = monster.attackReach ?? 1;
          if (distToPlayer <= reach && timestamp - monster.lastAttackTime >= monster.attackIntervalMs) {
            monster.lastAttackTime = timestamp;
            const dmg = rollDamage(monster.attackPower[0], monster.attackPower[1]);
            const stats = playerStatsRef.current;
            const isDangerousDefense = (monster.minLevel ?? 1) >= stats.level;

            if (monster.attackType === 'earth') {
              // Dual-Axis Spell Attack (Spore Spitter: wild + earth, bypasses physical armor & blocks)
              const spellRes = resolveSpellAttack({
                rawDamage: dmg,
                origin: 'wild',
                element: 'earth',
                defenderResistances: stats.resistances,
              });

              stats.hp = Math.max(0, stats.hp - spellRes.finalDamage);
              addFloatingText(
                `-${spellRes.finalDamage}`,
                player.renderX + TILE_SIZE / 2,
                player.renderY + 4,
                '#a855f7'
              );

              if (monster.archetype === 'spore_spitter') {
                addVisualEffect(
                  'spore_shot',
                  monster.renderX + TILE_SIZE / 2,
                  monster.renderY + TILE_SIZE / 2,
                  player.renderX + TILE_SIZE / 2,
                  player.renderY + TILE_SIZE / 2,
                  '#a855f7'
                );
              }

              if (spellRes.resistedAmount > 0) {
                propsRef.current.onLogMessage?.(
                  `${monster.name}'s Spore Shot hit for ${spellRes.finalDamage} earth damage (Resisted: -${spellRes.resistedAmount})`
                );
              } else {
                propsRef.current.onLogMessage?.(
                  `${monster.name}'s Spore Shot struck you for ${spellRes.finalDamage} earth damage!`
                );
              }

              // Train defense on taking damage
              const defEvents = recordDefenseHit(stats, isDangerousDefense);
              for (const ev of defEvents) {
                addFloatingText(
                  `${ev.skillName} Up! (${ev.newLevel})`,
                  player.renderX + TILE_SIZE / 2,
                  player.renderY - 14,
                  ev.color
                );
                playSkillAdvanceChime();
                propsRef.current.onLogMessage?.(`✦ Skill Advance: Defense increased to Level ${ev.newLevel}!`);
              }
            } else {
              // Physical Monster Attack (Giant Rat, Bramble Hound, Clockwork Drone):
              // 1. Accuracy/Evasion check -> 2. Shield Block limit -> 3. Flat Armor soak
              const physRes = resolvePhysicalAttack({
                attackerSkill: monster.defenseSkill ?? 10,
                defenderDefenseSkill: stats.skills.defense.level,
                defenderArmor: stats.armor ?? 2,
                rawDamage: dmg,
                defenderBlockState: stats,
                now: timestamp,
              });

              if (physRes.outcome === 'miss') {
                // MISS: render floating gray text "MISS", award defense training for avoiding blow
                addFloatingText(
                  'MISS',
                  player.renderX + TILE_SIZE / 2,
                  player.renderY - 8,
                  '#94a3b8'
                );
                propsRef.current.onLogMessage?.(`${monster.name}'s attack missed you!`);
                const defEvents = recordDefenseHit(stats, isDangerousDefense);
                for (const ev of defEvents) {
                  addFloatingText(
                    `${ev.skillName} Up! (${ev.newLevel})`,
                    player.renderX + TILE_SIZE / 2,
                    player.renderY - 14,
                    ev.color
                  );
                  playSkillAdvanceChime();
                  propsRef.current.onLogMessage?.(`✦ Skill Advance: Defense increased to Level ${ev.newLevel}!`);
                }
              } else if (physRes.outcome === 'blocked') {
                // BLOCKED: 100% damage absorbed! Render "BLOCK", block spark effect, award defense training, 0 HP damage
                addFloatingText(
                  'BLOCK',
                  player.renderX + TILE_SIZE / 2,
                  player.renderY - 8,
                  '#38bdf8'
                );
                addVisualEffect(
                  'block_spark',
                  player.renderX + TILE_SIZE / 2,
                  player.renderY + TILE_SIZE / 2,
                  player.renderX + TILE_SIZE / 2,
                  player.renderY + TILE_SIZE / 2,
                  '#38bdf8'
                );
                propsRef.current.onLogMessage?.(`You blocked ${monster.name}'s strike! (0 damage)`);
                const defEvents = recordDefenseHit(stats, isDangerousDefense);
                for (const ev of defEvents) {
                  addFloatingText(
                    `${ev.skillName} Up! (${ev.newLevel})`,
                    player.renderX + TILE_SIZE / 2,
                    player.renderY - 14,
                    ev.color
                  );
                  playSkillAdvanceChime();
                  propsRef.current.onLogMessage?.(`✦ Skill Advance: Defense increased to Level ${ev.newLevel}!`);
                }
              } else {
                // HIT: Armor soaked remaining physical damage
                stats.hp = Math.max(0, stats.hp - physRes.finalDamage);
                addFloatingText(
                  `-${physRes.finalDamage}`,
                  player.renderX + TILE_SIZE / 2,
                  player.renderY + 4,
                  '#ef4444'
                );

                if (physRes.defenseBroken) {
                  propsRef.current.onLogMessage?.(
                    `Defense broken! ${monster.name} struck you for ${physRes.finalDamage} damage!`
                  );
                } else if (physRes.armorSoaked > 0) {
                  propsRef.current.onLogMessage?.(
                    `${monster.name} hit for ${physRes.finalDamage} damage (Armor soaked ${physRes.armorSoaked})`
                  );
                } else {
                  propsRef.current.onLogMessage?.(`${monster.name} hit you for ${physRes.finalDamage} damage!`);
                }

                const defEvents = recordDefenseHit(stats, isDangerousDefense);
                for (const ev of defEvents) {
                  addFloatingText(
                    `${ev.skillName} Up! (${ev.newLevel})`,
                    player.renderX + TILE_SIZE / 2,
                    player.renderY - 14,
                    ev.color
                  );
                  playSkillAdvanceChime();
                  propsRef.current.onLogMessage?.(`✦ Skill Advance: Defense increased to Level ${ev.newLevel}!`);
                }
              }
            }
            propsRef.current.onPlayerStatsChange({ ...stats });
          }
        }

        // 3. Player Auto-Attack Loop
        const targetRat = monsters.find((m) => m.id === targetIdRef.current && m.isAlive);
        if (targetRat) {
          // De-targeting check (breaks if >= 8 tiles or dead)
          if (shouldBreakTargetLock(player.gridX, player.gridY, targetRat)) {
            targetIdRef.current = null;
            propsRef.current.onTargetChange(null, null);
          } else {
            // Auto-attack timer check
            const autoRes = checkAutoAttack(
              playerStatsRef.current,
              player.gridX,
              player.gridY,
              targetRat,
              lastAutoAttackTimeRef.current,
              timestamp
            );

            if (autoRes.shouldAttack && autoRes.damage) {
              lastAutoAttackTimeRef.current = timestamp;
              const stats = playerStatsRef.current;
              const isDangerous = (targetRat.minLevel ?? 1) >= stats.level;

              // Render visual attack effect (whip lash or aether beam)
              if (autoRes.effectType) {
                addVisualEffect(
                  autoRes.effectType,
                  player.renderX + TILE_SIZE / 2,
                  player.renderY + TILE_SIZE / 2,
                  targetRat.renderX + TILE_SIZE / 2,
                  targetRat.renderY + TILE_SIZE / 2
                );
              }

              if (stats.classType === 'Avenger') {
                // Avenger Physical Whip Attack:
                // 1. Accuracy / Evasion Check -> 2. Shield Block Limit -> 3. Armor Soak
                const physRes = resolvePhysicalAttack({
                  attackerSkill: stats.skills.weapons.flexible.level,
                  defenderDefenseSkill: targetRat.defenseSkill ?? 10,
                  defenderArmor: targetRat.armor ?? targetRat.armorReduction ?? 0,
                  rawDamage: autoRes.damage,
                  defenderBlockState: targetRat,
                  now: timestamp,
                });

                if (physRes.outcome === 'miss') {
                  addFloatingText(
                    'MISS',
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY - 6,
                    '#94a3b8'
                  );
                  propsRef.current.onLogMessage?.(`Your whip strike missed ${targetRat.name}!`);
                } else if (physRes.outcome === 'blocked') {
                  addFloatingText(
                    'BLOCK',
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY - 6,
                    '#38bdf8'
                  );
                  addVisualEffect(
                    'block_spark',
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY + TILE_SIZE / 2,
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY + TILE_SIZE / 2,
                    '#38bdf8'
                  );
                  propsRef.current.onLogMessage?.(`${targetRat.name} blocked your whip strike! (0 damage)`);
                } else {
                  // Successful Hit landed: advance flexible weapon skill
                  const weaponEvents = recordWeaponHit(stats, 'flexible', isDangerous);
                  for (const ev of weaponEvents) {
                    addFloatingText(
                      `${ev.skillName} Up! (${ev.newLevel})`,
                      player.renderX + TILE_SIZE / 2,
                      player.renderY - 14,
                      ev.color
                    );
                    playSkillAdvanceChime();
                    propsRef.current.onLogMessage?.(`✦ Skill Advance: ${ev.skillName} increased to Level ${ev.newLevel}!`);
                  }

                  targetRat.hp = Math.max(0, targetRat.hp - physRes.finalDamage);
                  onDamageDealt(stats, 'physical', physRes.finalDamage);

                  addFloatingText(
                    `${physRes.finalDamage}`,
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY + 4,
                    physRes.armorSoaked > 0 ? '#94a3b8' : '#fde047'
                  );
                  if (physRes.armorSoaked > 0) {
                    addFloatingText(
                      `ARMOR (-${physRes.armorSoaked})`,
                      targetRat.renderX + TILE_SIZE / 2,
                      targetRat.renderY - 10,
                      '#94a3b8'
                    );
                  }

                  // Check if monster died
                  if (targetRat.hp <= 0) {
                    handleMonsterSlay(targetRat, timestamp);
                  } else {
                    propsRef.current.onTargetChange(targetRat.id, targetRat);
                  }
                }
              } else {
                // Sage Magical Wand (Aether Gun):
                // Deducts 1 MP, advances marksmanship/sidearms and arcane/air, bypasses physical armor/blocks, evaluates spell resistance
                if (autoRes.mpCost) {
                  stats.mp = Math.max(0, stats.mp - autoRes.mpCost);
                  const spellEvents = recordSpellCast(stats, 'arcane', 'air', autoRes.mpCost, isDangerous);
                  for (const ev of spellEvents) {
                    addFloatingText(
                      `${ev.skillName} Up! (${ev.newLevel})`,
                      player.renderX + TILE_SIZE / 2,
                      player.renderY - 14,
                      ev.color
                    );
                    playSkillAdvanceChime();
                    propsRef.current.onLogMessage?.(`✦ Skill Advance: ${ev.skillName} increased to Level ${ev.newLevel}!`);
                  }
                }

                // Advance weapon skill
                const weaponEvents = recordWeaponHit(stats, 'sidearms', isDangerous);
                for (const ev of weaponEvents) {
                  addFloatingText(
                    `${ev.skillName} Up! (${ev.newLevel})`,
                    player.renderX + TILE_SIZE / 2,
                    player.renderY - 14,
                    ev.color
                  );
                  playSkillAdvanceChime();
                  propsRef.current.onLogMessage?.(`✦ Skill Advance: ${ev.skillName} increased to Level ${ev.newLevel}!`);
                }

                const spellRes = resolveSpellAttack({
                  rawDamage: autoRes.damage,
                  origin: 'arcane',
                  element: 'air',
                  defenderResistances: targetRat.resistances,
                });

                targetRat.hp = Math.max(0, targetRat.hp - spellRes.finalDamage);
                onDamageDealt(stats, 'air', spellRes.finalDamage);

                if (spellRes.vulnerabilityBonus > 0) {
                  addFloatingText(
                    `${spellRes.finalDamage}!`,
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY + 4,
                    '#facc15'
                  );
                  addFloatingText(
                    'WEAKNESS!',
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY - 10,
                    '#f59e0b'
                  );
                  propsRef.current.onLogMessage?.(
                    `✦ WEAKNESS! Aether beam dealt ${spellRes.finalDamage} critical damage to ${targetRat.name} (+${spellRes.vulnerabilityBonus})!`
                  );
                } else if (spellRes.resistedAmount > 0) {
                  addFloatingText(
                    `${spellRes.finalDamage}`,
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY + 4,
                    '#94a3b8'
                  );
                  addFloatingText(
                    'RESIST',
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY - 10,
                    '#94a3b8'
                  );
                  propsRef.current.onLogMessage?.(
                    `Aether beam dealt ${spellRes.finalDamage} damage to ${targetRat.name} (Resisted: -${spellRes.resistedAmount})`
                  );
                } else {
                  addFloatingText(
                    `${spellRes.finalDamage}`,
                    targetRat.renderX + TILE_SIZE / 2,
                    targetRat.renderY + 4,
                    '#38bdf8'
                  );
                }

                // Check if monster died
                if (targetRat.hp <= 0) {
                  handleMonsterSlay(targetRat, timestamp);
                } else {
                  propsRef.current.onTargetChange(targetRat.id, targetRat);
                }
              }

              propsRef.current.onPlayerStatsChange({ ...stats });
            }
          }
        }

        // 4. Prune expired visual effects and floating text
        const currentTime = performance.now();
        visualEffectsRef.current = visualEffectsRef.current.filter(
          (eff) => currentTime - eff.startTime <= eff.durationMs
        );
        floatingTextsRef.current = floatingTextsRef.current.filter(
          (f) => currentTime - f.startTime <= f.durationMs
        );

        // 5. Clean up expired corpses (after 6500ms) and leash monsters beyond 14 tiles
        const unexpiredCorpsesAndLiving = monstersRef.current.filter(
          (m) => m.isAlive || (m.deathTime && timestamp - m.deathTime < 6500)
        );
        monstersRef.current = leashMonsters(
          unexpiredCorpsesAndLiving,
          player.gridX,
          player.gridY,
          targetIdRef.current
        );

        // 6. Compute camera centered on interpolated player
        const camera = calculateCamera(player.renderX, player.renderY);
        cameraRef.current = camera;

        // 7. Render full game scene
        renderGameScene({
          ctx,
          map: propsRef.current.map,
          cameraX: camera.x,
          cameraY: camera.y,
          playerRenderX: player.renderX,
          playerRenderY: player.renderY,
          playerFacing: player.facing,
          playerClass: playerStatsRef.current.classType,
          isMoving: player.isMoving,
          monsters: monstersRef.current,
          targetId: targetIdRef.current,
          visualEffects: visualEffectsRef.current,
          floatingTexts: floatingTextsRef.current,
          showGrid: propsRef.current.showGrid,
          timeMs: currentTime,
        });
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [tick, movementState, addFloatingText, addVisualEffect]);

  return (
    <div className="relative flex items-center justify-center p-1 sm:p-2.5 rounded-lg bg-gradient-to-b from-[#2b1b12] via-[#1f130c] to-[#140b07] border-4 border-[#3e2718] shadow-[0_12px_36px_rgba(0,0,0,0.95),inset_0_0_16px_rgba(0,0,0,0.9)] max-h-full max-w-full">
      {/* Brass Corner Brackets */}
      <span className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#d4af37] rounded-tl-xs pointer-events-none shadow-[0_0_4px_rgba(212,175,55,0.6)]" />
      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#d4af37] rounded-tr-xs pointer-events-none shadow-[0_0_4px_rgba(212,175,55,0.6)]" />
      <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#d4af37] rounded-bl-xs pointer-events-none shadow-[0_0_4px_rgba(212,175,55,0.6)]" />
      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#d4af37] rounded-br-xs pointer-events-none shadow-[0_0_4px_rgba(212,175,55,0.6)]" />

      {/* Inner Bezel Frame */}
      <div className="relative rounded border-2 border-[#150d08] ring-1 ring-[#5c4026]/70 overflow-hidden bg-black shadow-[inset_0_0_12px_rgba(0,0,0,0.95)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          data-testid="game-canvas"
          className="pixelated block select-none cursor-crosshair max-h-[calc(100vh-190px)] max-w-[calc((100vh-190px)*(15/11))] aspect-[15/11] w-auto h-auto"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
