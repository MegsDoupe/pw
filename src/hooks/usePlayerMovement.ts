import { useEffect, useRef, useCallback } from 'react';
import {
  Direction,
  MOVE_DURATION_MS,
  PlayerMovementState,
  TileId,
  TILE_SIZE,
} from '../types/game';
import { canMove } from '../game/map';
import {
  DIRECTION_VECTORS,
  getFacingDirection,
  interpolatePosition,
  resolveDirectionFromKeys,
} from '../game/movement';

interface UsePlayerMovementOptions {
  map: TileId[][];
  initialX: number;
  initialY: number;
  onCoordinateChange?: (x: number, y: number) => void;
  onStepComplete?: (x: number, y: number) => void;
}

export function usePlayerMovement({
  map,
  initialX,
  initialY,
  onCoordinateChange,
  onStepComplete,
}: UsePlayerMovementOptions) {
  // Mutable state preserved across RAF renders without triggering React re-renders
  const stateRef = useRef<PlayerMovementState>({
    gridX: initialX,
    gridY: initialY,
    targetX: initialX,
    targetY: initialY,
    renderX: initialX * TILE_SIZE,
    renderY: initialY * TILE_SIZE,
    isMoving: false,
    moveStartTime: 0,
    facing: 'DOWN',
    bufferedDirection: 'NONE',
  });

  const heldKeysRef = useRef<Set<string>>(new Set());
  const touchDirectionRef = useRef<Direction>('NONE');

  // Keep callback refs fresh
  const onCoordRef = useRef(onCoordinateChange);
  onCoordRef.current = onCoordinateChange;
  const onStepRef = useRef(onStepComplete);
  onStepRef.current = onStepComplete;

  const mapRef = useRef(map);
  mapRef.current = map;

  /**
   * Attempt to start moving in a given direction.
   */
  const initiateMove = useCallback((direction: Direction, currentTime: number): boolean => {
    if (direction === 'NONE') return false;

    const state = stateRef.current;
    const vector = DIRECTION_VECTORS[direction];
    if (!vector || (vector.dx === 0 && vector.dy === 0)) return false;

    // Update facing direction immediately
    state.facing = getFacingDirection(direction, state.facing);

    // Collision check
    const currentMap = mapRef.current;
    if (!canMove(currentMap, state.gridX, state.gridY, vector.dx, vector.dy)) {
      return false;
    }

    // Begin movement transition
    state.isMoving = true;
    state.targetX = state.gridX + vector.dx;
    state.targetY = state.gridY + vector.dy;
    state.moveStartTime = currentTime;
    state.bufferedDirection = 'NONE';

    return true;
  }, []);

  /**
   * Check next intended direction from held keys or touch controls.
   */
  const getActiveInputDirection = useCallback((): Direction => {
    if (touchDirectionRef.current !== 'NONE') {
      return touchDirectionRef.current;
    }
    const keyDir = resolveDirectionFromKeys(heldKeysRef.current);
    if (keyDir !== 'NONE') {
      return keyDir;
    }
    const state = stateRef.current;
    if (state.bufferedDirection !== 'NONE') {
      const buffered = state.bufferedDirection;
      state.bufferedDirection = 'NONE';
      return buffered;
    }
    return 'NONE';
  }, []);

  /**
   * Frame tick called inside requestAnimationFrame loop.
   * Updates interpolation, handles step completions, and buffers next steps.
   */
  const tick = useCallback((now: number) => {
    const state = stateRef.current;

    if (state.isMoving) {
      const elapsed = now - state.moveStartTime;
      const progress = elapsed / MOVE_DURATION_MS;

      if (progress >= 1.0) {
        // Step complete! Snap to target grid
        state.gridX = state.targetX;
        state.gridY = state.targetY;
        state.renderX = state.gridX * TILE_SIZE;
        state.renderY = state.gridY * TILE_SIZE;
        state.isMoving = false;

        // Notify coordinate change for HUD
        onCoordRef.current?.(state.gridX, state.gridY);
        onStepRef.current?.(state.gridX, state.gridY);

        // Check for continuous or buffered input
        const nextDir = getActiveInputDirection();
        if (nextDir !== 'NONE') {
          initiateMove(nextDir, now);
        }
      } else {
        // Interpolate smoothly
        const interpolated = interpolatePosition(
          state.gridX,
          state.gridY,
          state.targetX,
          state.targetY,
          progress
        );
        state.renderX = interpolated.renderX;
        state.renderY = interpolated.renderY;
      }
    } else {
      // Idle: check if player just started pressing an input
      const nextDir = getActiveInputDirection();
      if (nextDir !== 'NONE') {
        initiateMove(nextDir, now);
      }
    }
  }, [getActiveInputDirection, initiateMove]);

  // Set directional input from virtual touch D-pad
  const setTouchDirection = useCallback((dir: Direction) => {
    touchDirectionRef.current = dir;
    if (!stateRef.current.isMoving && dir !== 'NONE') {
      initiateMove(dir, performance.now());
    } else if (stateRef.current.isMoving && dir !== 'NONE') {
      stateRef.current.bufferedDirection = dir;
    }
  }, [initiateMove]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default page scroll on navigation keys
      const movementKeyCodes = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'Numpad8', 'Numpad2', 'Numpad4', 'Numpad6',
        'Numpad7', 'Numpad9', 'Numpad1', 'Numpad3',
      ];

      if (movementKeyCodes.includes(e.code)) {
        e.preventDefault();
        heldKeysRef.current.add(e.code);

        const currentDir = resolveDirectionFromKeys(heldKeysRef.current);
        if (!stateRef.current.isMoving) {
          initiateMove(currentDir, performance.now());
        } else {
          stateRef.current.bufferedDirection = currentDir;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.code);
    };

    const handleBlur = () => {
      heldKeysRef.current.clear();
      touchDirectionRef.current = 'NONE';
      if (stateRef.current) {
        stateRef.current.bufferedDirection = 'NONE';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [initiateMove]);

  return {
    movementState: stateRef,
    tick,
    setTouchDirection,
  };
}
