import {
  Direction,
  TILE_SIZE,
} from '../types/game';

export interface Vector2D {
  dx: number;
  dy: number;
}

export const DIRECTION_VECTORS: Record<Direction, Vector2D> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
  UP_LEFT: { dx: -1, dy: -1 },
  UP_RIGHT: { dx: 1, dy: -1 },
  DOWN_LEFT: { dx: -1, dy: 1 },
  DOWN_RIGHT: { dx: 1, dy: 1 },
  NONE: { dx: 0, dy: 0 },
};

/**
 * Maps held keys to a net Direction.
 * Handles diagonal combinations (e.g. W + D -> UP_RIGHT) and numpad keys.
 */
export function resolveDirectionFromKeys(keys: Set<string>): Direction {
  let up = keys.has('KeyW') || keys.has('ArrowUp');
  let down = keys.has('KeyS') || keys.has('ArrowDown');
  let left = keys.has('KeyA') || keys.has('ArrowLeft');
  let right = keys.has('KeyD') || keys.has('ArrowRight');

  // Numpad support
  if (keys.has('Numpad8')) up = true;
  if (keys.has('Numpad2')) down = true;
  if (keys.has('Numpad4')) left = true;
  if (keys.has('Numpad6')) right = true;
  if (keys.has('Numpad7')) { up = true; left = true; }
  if (keys.has('Numpad9')) { up = true; right = true; }
  if (keys.has('Numpad1')) { down = true; left = true; }
  if (keys.has('Numpad3')) { down = true; right = true; }

  // Cancel opposites
  if (up && down) { up = false; down = false; }
  if (left && right) { left = false; right = false; }

  if (up && left) return 'UP_LEFT';
  if (up && right) return 'UP_RIGHT';
  if (down && left) return 'DOWN_LEFT';
  if (down && right) return 'DOWN_RIGHT';
  if (up) return 'UP';
  if (down) return 'DOWN';
  if (left) return 'LEFT';
  if (right) return 'RIGHT';

  return 'NONE';
}

/**
 * Linear or ease-in-out interpolation between tile coordinates converted to world pixels.
 */
export function interpolatePosition(
  fromGridX: number,
  fromGridY: number,
  toGridX: number,
  toGridY: number,
  progress: number
): { renderX: number; renderY: number } {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const startPixelX = fromGridX * TILE_SIZE;
  const startPixelY = fromGridY * TILE_SIZE;
  const endPixelX = toGridX * TILE_SIZE;
  const endPixelY = toGridY * TILE_SIZE;

  const renderX = startPixelX + (endPixelX - startPixelX) * clampedProgress;
  const renderY = startPixelY + (endPixelY - startPixelY) * clampedProgress;

  return { renderX, renderY };
}

/**
 * Returns primary cardinal facing for rendering sprite direction.
 */
export function getFacingDirection(dir: Direction, currentFacing: Direction): Direction {
  if (dir === 'UP' || dir === 'UP_LEFT' || dir === 'UP_RIGHT') return 'UP';
  if (dir === 'DOWN' || dir === 'DOWN_LEFT' || dir === 'DOWN_RIGHT') return 'DOWN';
  if (dir === 'LEFT') return 'LEFT';
  if (dir === 'RIGHT') return 'RIGHT';
  return currentFacing;
}
