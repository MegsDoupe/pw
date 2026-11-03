import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  CameraState,
} from '../types/game';

/**
 * Calculates camera pixel coordinates centered on the player's pixel position,
 * clamped tightly to world map boundaries so black void edges never show.
 */
export function calculateCamera(
  playerRenderX: number,
  playerRenderY: number,
  viewportWidth = CANVAS_WIDTH,
  viewportHeight = CANVAS_HEIGHT,
  mapWidth = MAP_WIDTH * TILE_SIZE,
  mapHeight = MAP_HEIGHT * TILE_SIZE
): CameraState {
  // Center of player sprite
  const playerCenterX = playerRenderX + TILE_SIZE / 2;
  const playerCenterY = playerRenderY + TILE_SIZE / 2;

  // Ideal top-left of camera
  const targetCamX = playerCenterX - viewportWidth / 2;
  const targetCamY = playerCenterY - viewportHeight / 2;

  // Maximum scroll offsets
  const maxCamX = Math.max(0, mapWidth - viewportWidth);
  const maxCamY = Math.max(0, mapHeight - viewportHeight);

  // Clamp within bounds
  const clampedX = Math.max(0, Math.min(targetCamX, maxCamX));
  const clampedY = Math.max(0, Math.min(targetCamY, maxCamY));

  return {
    x: Math.round(clampedX),
    y: Math.round(clampedY),
  };
}

/**
 * Determines which tile index range is visible within the current camera view.
 * Adds a 1-tile buffer on each side for smooth off-screen culling.
 */
export function getVisibleTileBounds(
  cameraX: number,
  cameraY: number,
  viewportWidth = CANVAS_WIDTH,
  viewportHeight = CANVAS_HEIGHT
) {
  const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
  const endCol = Math.min(MAP_WIDTH - 1, Math.ceil((cameraX + viewportWidth) / TILE_SIZE) + 1);

  const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE) - 1);
  const endRow = Math.min(MAP_HEIGHT - 1, Math.ceil((cameraY + viewportHeight) / TILE_SIZE) + 1);

  return {
    startCol,
    endCol,
    startRow,
    endRow,
  };
}
