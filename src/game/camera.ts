import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  CameraState,
} from '../types/game';

/**
 * Calculates camera pixel coordinates centered on the player's pixel position.
 * In infinite chunk mode (default), the camera smoothly follows the player without clamping.
 * In bounded mode, clamps to world map boundaries.
 */
export function calculateCamera(
  playerRenderX: number,
  playerRenderY: number,
  viewportWidth = CANVAS_WIDTH,
  viewportHeight = CANVAS_HEIGHT,
  mapWidth?: number,
  mapHeight?: number,
  infinite = mapWidth === undefined || mapHeight === undefined
): CameraState {
  // Center of player sprite
  const playerCenterX = playerRenderX + TILE_SIZE / 2;
  const playerCenterY = playerRenderY + TILE_SIZE / 2;

  // Ideal top-left of camera
  const targetCamX = playerCenterX - viewportWidth / 2;
  const targetCamY = playerCenterY - viewportHeight / 2;

  // If bounded and dimensions specified, clamp
  if (!infinite && mapWidth !== undefined && mapHeight !== undefined) {
    const maxCamX = Math.max(0, mapWidth - viewportWidth);
    const maxCamY = Math.max(0, mapHeight - viewportHeight);
    const clampedX = Math.max(0, Math.min(targetCamX, maxCamX));
    const clampedY = Math.max(0, Math.min(targetCamY, maxCamY));
    return {
      x: Math.round(clampedX),
      y: Math.round(clampedY),
    };
  }

  return {
    x: Math.round(targetCamX),
    y: Math.round(targetCamY),
  };
}

/**
 * Determines which tile index range is visible within the current camera view.
 * Supports negative and unbounded world coordinates with a 1-tile buffer for smooth culling.
 */
export function getVisibleTileBounds(
  cameraX: number,
  cameraY: number,
  viewportWidth = CANVAS_WIDTH,
  viewportHeight = CANVAS_HEIGHT,
  bounded = false
) {
  const startCol = Math.floor(cameraX / TILE_SIZE) - 1;
  const endCol = Math.ceil((cameraX + viewportWidth) / TILE_SIZE) + 1;

  const startRow = Math.floor(cameraY / TILE_SIZE) - 1;
  const endRow = Math.ceil((cameraY + viewportHeight) / TILE_SIZE) + 1;

  if (bounded) {
    return {
      startCol: Math.max(0, startCol),
      endCol: Math.min(MAP_WIDTH - 1, endCol),
      startRow: Math.max(0, startRow),
      endRow: Math.min(MAP_HEIGHT - 1, endRow),
    };
  }

  return {
    startCol,
    endCol,
    startRow,
    endRow,
  };
}
