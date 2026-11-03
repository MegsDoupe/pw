import test from 'node:test';
import assert from 'node:assert/strict';
import { isWalkable, canMove } from './map';
import { calculateCamera } from './camera';
import { resolveDirectionFromKeys, interpolatePosition } from './movement';
import { TileId } from '../types/game';

test('isWalkable validates boundaries and tile types correctly', () => {
  // Test map 5x5: 0=grass (walkable), 4=stone (solid)
  const map: TileId[][] = [
    [0, 0, 0, 0, 0],
    [0, 0, 4, 0, 0],
    [0, 4, 0, 4, 0],
    [0, 0, 4, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  assert.equal(isWalkable(map, 0, 0), true, 'Grass should be walkable');
  assert.equal(isWalkable(map, 2, 1), false, 'Stone wall should not be walkable');
  assert.equal(isWalkable(map, -1, 0), false, 'Negative X should be out of bounds');
  assert.equal(isWalkable(map, 0, 999), false, 'Excess Y should be out of bounds');
});

test('canMove handles cardinal collision correctly', () => {
  const map: TileId[][] = [
    [0, 0, 0],
    [0, 4, 0],
    [0, 0, 0],
  ];

  // Moving from (0, 1) to (1, 1) which is a stone wall
  assert.equal(canMove(map, 0, 1, 1, 0), false, 'Cannot move into stone wall');
  // Moving from (0, 1) to (0, 0) which is open grass
  assert.equal(canMove(map, 0, 1, 0, -1), true, 'Can move into open grass');
});

test('canMove prevents classic Tibia diagonal corner-cutting', () => {
  // Setup scenario where target diagonal is open, but cardinal edge is blocked:
  // Player at (0, 0).
  // (0, 0) = open, (1, 0) = WALL, (0, 1) = open, (1, 1) = open.
  // Trying to move diagonal (+1, +1):
  // Since (1, 0) is a WALL, moving diagonally would clip the corner of the wall!
  const map1: TileId[][] = [
    [0, 4],
    [0, 0],
  ];
  assert.equal(
    canMove(map1, 0, 0, 1, 1),
    false,
    'Diagonal move must be blocked if horizontal adjacent is a wall'
  );

  // Scenario 2: vertical adjacent is a WALL
  const map2: TileId[][] = [
    [0, 0],
    [4, 0],
  ];
  assert.equal(
    canMove(map2, 0, 0, 1, 1),
    false,
    'Diagonal move must be blocked if vertical adjacent is a wall'
  );

  // Scenario 3: both adjacent cardinals are open
  const map3: TileId[][] = [
    [0, 0],
    [0, 0],
  ];
  assert.equal(
    canMove(map3, 0, 0, 1, 1),
    true,
    'Diagonal move is allowed when both cardinals and target are clear'
  );
});

test('calculateCamera clamps smoothly to world boundaries', () => {
  const viewportW = 480;
  const viewportH = 352;
  const mapW = 40 * 32; // 1280
  const mapH = 40 * 32; // 1280

  // Near top-left origin (0, 0)
  const camOrigin = calculateCamera(0, 0, viewportW, viewportH, mapW, mapH);
  assert.equal(camOrigin.x, 0, 'Camera X should clamp to 0 at left edge');
  assert.equal(camOrigin.y, 0, 'Camera Y should clamp to 0 at top edge');

  // Near bottom-right edge (1280, 1280)
  const camFar = calculateCamera(1248, 1248, viewportW, viewportH, mapW, mapH);
  assert.equal(camFar.x, mapW - viewportW, 'Camera X should clamp to max scroll at right edge');
  assert.equal(camFar.y, mapH - viewportH, 'Camera Y should clamp to max scroll at bottom edge');

  // Center of world (640, 640)
  const camCenter = calculateCamera(640, 640, viewportW, viewportH, mapW, mapH);
  assert.equal(camCenter.x, 640 + 16 - viewportW / 2);
  assert.equal(camCenter.y, 640 + 16 - viewportH / 2);
});

test('resolveDirectionFromKeys handles single keys and diagonal combinations', () => {
  assert.equal(resolveDirectionFromKeys(new Set(['KeyW'])), 'UP');
  assert.equal(resolveDirectionFromKeys(new Set(['KeyW', 'KeyD'])), 'UP_RIGHT');
  assert.equal(resolveDirectionFromKeys(new Set(['ArrowDown', 'ArrowLeft'])), 'DOWN_LEFT');
  assert.equal(resolveDirectionFromKeys(new Set(['KeyA', 'KeyD'])), 'NONE', 'Opposites cancel out');
});

test('interpolatePosition calculates pixel coordinates accurately', () => {
  const atStart = interpolatePosition(2, 4, 3, 4, 0);
  assert.equal(atStart.renderX, 64);
  assert.equal(atStart.renderY, 128);

  const atMid = interpolatePosition(2, 4, 3, 4, 0.5);
  assert.equal(atMid.renderX, 80);
  assert.equal(atMid.renderY, 128);

  const atEnd = interpolatePosition(2, 4, 3, 4, 1.0);
  assert.equal(atEnd.renderX, 96);
  assert.equal(atEnd.renderY, 128);
});
