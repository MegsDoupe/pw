import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TileId,
  TileMeta,
} from '../types/game';

export const TILE_PROPERTIES: Record<TileId, TileMeta> = {
  0: { id: 0, name: 'Grass', walkable: true, baseColor: '#2d5a27', accentColor: '#3d7834' },
  1: { id: 1, name: 'Dirt Path', walkable: true, baseColor: '#8a6538', accentColor: '#a17845' },
  2: { id: 2, name: 'Cobblestone', walkable: true, baseColor: '#5c6470', accentColor: '#7a8494' },
  3: { id: 3, name: 'Water', walkable: false, baseColor: '#1d4b73', accentColor: '#2b6ea6' },
  4: { id: 4, name: 'Stone Wall', walkable: false, baseColor: '#3c4048', accentColor: '#5a606d' },
  5: { id: 5, name: 'Tree', walkable: false, baseColor: '#1d421d', accentColor: '#163316' },
  6: { id: 6, name: 'Flower Grass', walkable: true, baseColor: '#2f6329', accentColor: '#e0af36' },
  7: { id: 7, name: 'Stone Ruin', walkable: false, baseColor: '#4d4f57', accentColor: '#2f3136' },
  8: { id: 8, name: 'Large Rock', walkable: false, baseColor: '#4b5059', accentColor: '#6c7482' },
};

/**
 * Generates a 40x40 world grid with natural grass patches, a winding dirt road,
 * cobblestone plaza, stone ruins, a pond, and perimeter trees/walls.
 */
export function generateWorldMap(seed = 12345): TileId[][] {
  const map: TileId[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => 0 as TileId)
  );

  // Simple deterministic pseudo-random generator
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // 1. Boundary trees (outer rim is impassable)
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1) {
        map[y][x] = 5; // Tree border
      } else if (x === 1 || y === 1 || x === MAP_WIDTH - 2 || y === MAP_HEIGHT - 2) {
        if (rnd() > 0.3) {
          map[y][x] = 5;
        }
      }
    }
  }

  // 2. Main Dirt Highway (horizontal winding through the middle)
  let pathY = 20;
  for (let x = 2; x < MAP_WIDTH - 2; x++) {
    map[pathY][x] = 1;
    map[pathY + 1][x] = 1;
    if (x % 6 === 0) {
      const shift = rnd() > 0.5 ? 1 : -1;
      pathY = Math.max(12, Math.min(26, pathY + shift));
      map[pathY][x] = 1;
      map[pathY + 1][x] = 1;
    }
  }

  // 3. Vertical Crossroad Path
  let pathX = 20;
  for (let y = 3; y < MAP_HEIGHT - 3; y++) {
    map[y][pathX] = 1;
    map[y][pathX + 1] = 1;
    if (y % 7 === 0) {
      const shift = rnd() > 0.5 ? 1 : -1;
      pathX = Math.max(14, Math.min(28, pathX + shift));
      map[y][pathX] = 1;
      map[y][pathX + 1] = 1;
    }
  }

  // 4. Cobblestone Plaza around crossroads (center area 18-24)
  for (let y = 18; y <= 23; y++) {
    for (let x = 18; x <= 23; x++) {
      map[y][x] = 2; // Cobblestone
    }
  }

  // 5. Ancient Stone Ruins (north-west quadrant: x 6..12, y 6..12)
  for (let y = 6; y <= 12; y++) {
    for (let x = 6; x <= 12; x++) {
      if (y === 6 || y === 12 || x === 6 || x === 12) {
        // Leave entry doors
        if (!(y === 12 && (x === 9 || x === 10)) && !(x === 12 && y === 9)) {
          map[y][x] = 4; // Stone wall
        }
      } else if (x === 9 && y === 9) {
        map[y][x] = 7; // Ancient stone ruin shrine
      } else {
        map[y][x] = 2; // Cobblestone interior
      }
    }
  }

  // 6. Mystic Pond (south-east quadrant: x 27..34, y 26..33)
  for (let y = 26; y <= 33; y++) {
    for (let x = 27; x <= 34; x++) {
      const dx = x - 30.5;
      const dy = y - 29.5;
      if (dx * dx + dy * dy <= 12) {
        map[y][x] = 3; // Water
      }
    }
  }

  // 7. Scatter trees, large rocks and flower grass clusters
  for (let y = 2; y < MAP_HEIGHT - 2; y++) {
    for (let x = 2; x < MAP_WIDTH - 2; x++) {
      if (map[y][x] === 0) {
        const val = rnd();
        if (val < 0.06) {
          map[y][x] = 5; // Tree
        } else if (val < 0.09) {
          map[y][x] = 8; // Large Rock (distinct boulder, fewer count)
        } else if (val < 0.20) {
          map[y][x] = 6; // Flower grass
        }
      }
    }
  }

  // Ensure initial spawn area (20, 20) is clear and open cobblestone
  for (let sy = 19; sy <= 21; sy++) {
    for (let sx = 19; sx <= 21; sx++) {
      map[sy][sx] = 2;
    }
  }

  return map;
}

/**
 * Check if the given tile coordinate is within map bounds and walkable.
 */
export function isWalkable(map: TileId[][], x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) {
    return false;
  }
  const tileId = map[y][x];
  const meta = TILE_PROPERTIES[tileId];
  return meta ? meta.walkable : false;
}

/**
 * Checks whether an entity at (fromX, fromY) can move by (dx, dy).
 * Applies classic grid RPG collision rules:
 * - Target tile must be in bounds and walkable.
 * - If moving diagonally, cardinal adjacent tiles cannot be blocking walls
 *   (prevents squeezing through wall corners / cutting corners).
 */
export function canMove(
  map: TileId[][],
  fromX: number,
  fromY: number,
  dx: number,
  dy: number
): boolean {
  if (dx === 0 && dy === 0) return false;

  const targetX = fromX + dx;
  const targetY = fromY + dy;

  // 1. Target must be walkable
  if (!isWalkable(map, targetX, targetY)) {
    return false;
  }

  // 2. Cardinal movement has no corner-cutting checks
  if (dx === 0 || dy === 0) {
    return true;
  }

  // 3. Diagonal movement: check adjacent cardinal tiles to prevent clipping through corners
  // Both adjacent cardinals must be walkable for classic Tibia-style corner integrity
  const horizontalAdjacent = isWalkable(map, fromX + dx, fromY);
  const verticalAdjacent = isWalkable(map, fromX, fromY + dy);

  if (!horizontalAdjacent || !verticalAdjacent) {
    return false;
  }

  return true;
}
