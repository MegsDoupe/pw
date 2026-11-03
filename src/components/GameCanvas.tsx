import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CharacterClass,
  Direction,
  TileId,
} from '../types/game';
import { calculateCamera } from '../game/camera';
import { renderGameScene } from '../game/renderer';
import { usePlayerMovement } from '../hooks/usePlayerMovement';

export interface GameCanvasProps {
  map: TileId[][];
  initialX: number;
  initialY: number;
  playerClass: CharacterClass;
  showGrid?: boolean;
  onCoordinateChange: (x: number, y: number) => void;
  onMovementHookReady?: (movementControls: {
    setTouchDirection: (dir: Direction) => void;
  }) => void;
}

export default function GameCanvas({
  map,
  initialX,
  initialY,
  playerClass,
  showGrid = false,
  onCoordinateChange,
  onMovementHookReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hook handles movement math, interpolation, and keyboard listeners without causing React re-renders
  const { movementState, tick, setTouchDirection } = usePlayerMovement({
    map,
    initialX,
    initialY,
    onCoordinateChange,
  });

  // Expose virtual touch direction control to parent/HUD
  useEffect(() => {
    if (onMovementHookReady) {
      onMovementHookReady({ setTouchDirection });
    }
  }, [onMovementHookReady, setTouchDirection]);

  // Keep rendering options in a ref so RAF loop accesses current props without re-binding
  const propsRef = useRef({
    map,
    playerClass,
    showGrid,
  });
  propsRef.current = { map, playerClass, showGrid };

  // Main 60 FPS requestAnimationFrame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Ensure crisp pixel rendering on the 2D context
    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;
    let isRunning = true;

    let lastRenderTime = 0;

    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      const state = movementState.current;
      const isMoving = state.isMoving;
      const timeSinceLast = timestamp - lastRenderTime;

      // When moving, run full 60fps for silky smooth interpolation.
      // When idle, limit to ~20fps (50ms) for ambient water ripple while saving CPU.
      const shouldRender = isMoving || timeSinceLast >= 50;

      if (shouldRender) {
        lastRenderTime = timestamp;

        // 1. Advance movement interpolation tick
        tick(timestamp);

        // 2. Read latest player position & facing from ref
        const { map: currentMap, playerClass: currentClass, showGrid: isGridOn } = propsRef.current;

        // 3. Compute clamped camera position centered on interpolated player
        const camera = calculateCamera(state.renderX, state.renderY);

        // 4. Render the game frame
        renderGameScene({
          ctx,
          map: currentMap,
          cameraX: camera.x,
          cameraY: camera.y,
          playerRenderX: state.renderX,
          playerRenderY: state.renderY,
          playerFacing: state.facing,
          playerClass: currentClass,
          isMoving: state.isMoving,
          showGrid: isGridOn,
          timeMs: timestamp,
        });
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [tick, movementState]);

  return (
    <div className="relative flex items-center justify-center bg-black/90 p-1 sm:p-2 rounded-lg shadow-2xl border-4 border-[#2d251e]">
      {/* 
        Native Viewport: 15 cols x 11 rows = 480 x 352 px.
        Rendered using crisp integer pixel scaling (image-rendering: pixelated) 
        Scaled 2x (960 x 704 px max-width) while remaining fully responsive on mobile.
      */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        data-testid="game-canvas"
        className="pixelated block w-full max-w-[960px] aspect-[480/352] select-none shadow-inner"
        style={{
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
