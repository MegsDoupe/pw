import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  TileId,
  Direction,
  CharacterClass,
} from '../types/game';
import { getVisibleTileBounds } from './camera';

interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  map: TileId[][];
  cameraX: number;
  cameraY: number;
  playerRenderX: number;
  playerRenderY: number;
  playerFacing: Direction;
  playerClass: CharacterClass;
  isMoving: boolean;
  moveProgress?: number;
  showGrid?: boolean;
  timeMs: number;
}

/**
 * Draws a single 32x32 procedural retro tile into the canvas buffer.
 */
function drawTile(
  ctx: CanvasRenderingContext2D,
  tileId: TileId,
  screenX: number,
  screenY: number,
  timeMs: number
) {
  switch (tileId) {
    case 0: {
      // Grass (walkable)
      ctx.fillStyle = '#2b5624';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Grass blade flecks
      ctx.fillStyle = '#396d30';
      ctx.fillRect(screenX + 6, screenY + 8, 2, 4);
      ctx.fillRect(screenX + 18, screenY + 14, 2, 5);
      ctx.fillRect(screenX + 24, screenY + 6, 2, 3);
      ctx.fillRect(screenX + 10, screenY + 22, 2, 4);

      // Darker shading accent
      ctx.fillStyle = '#22441d';
      ctx.fillRect(screenX + 7, screenY + 11, 2, 2);
      ctx.fillRect(screenX + 19, screenY + 18, 2, 2);
      break;
    }
    case 1: {
      // Dirt Path (walkable)
      ctx.fillStyle = '#7a5a32';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Small pebbles / texture
      ctx.fillStyle = '#947042';
      ctx.fillRect(screenX + 4, screenY + 5, 4, 3);
      ctx.fillRect(screenX + 16, screenY + 12, 5, 3);
      ctx.fillRect(screenX + 22, screenY + 20, 3, 3);
      ctx.fillRect(screenX + 10, screenY + 24, 4, 2);

      // Dark crevices
      ctx.fillStyle = '#593f21';
      ctx.fillRect(screenX + 8, screenY + 7, 2, 2);
      ctx.fillRect(screenX + 20, screenY + 14, 2, 2);
      break;
    }
    case 2: {
      // Cobblestone Plaza (walkable)
      ctx.fillStyle = '#424853';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Individual stone paving blocks
      ctx.fillStyle = '#586170';
      // Block 1
      ctx.fillRect(screenX + 2, screenY + 2, 12, 12);
      // Block 2
      ctx.fillRect(screenX + 16, screenY + 2, 14, 12);
      // Block 3
      ctx.fillRect(screenX + 2, screenY + 16, 14, 14);
      // Block 4
      ctx.fillRect(screenX + 18, screenY + 16, 12, 14);

      // Mortar highlights
      ctx.fillStyle = '#6d788b';
      ctx.fillRect(screenX + 3, screenY + 3, 10, 2);
      ctx.fillRect(screenX + 17, screenY + 3, 12, 2);
      ctx.fillRect(screenX + 3, screenY + 17, 12, 2);
      ctx.fillRect(screenX + 19, screenY + 17, 10, 2);

      // Mortar shadows
      ctx.fillStyle = '#2b3038';
      ctx.fillRect(screenX, screenY, TILE_SIZE, 2);
      ctx.fillRect(screenX, screenY, 2, TILE_SIZE);
      ctx.fillRect(screenX + 14, screenY, 2, TILE_SIZE);
      ctx.fillRect(screenX, screenY + 14, TILE_SIZE, 2);
      break;
    }
    case 3: {
      // Water (solid) with gentle animated ripple effect
      ctx.fillStyle = '#1b4163';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      const waveOffset = Math.sin((timeMs / 400) + (screenX + screenY) * 0.05) * 3;
      ctx.fillStyle = '#2b6294';
      ctx.fillRect(screenX + 4 + waveOffset, screenY + 8, 12, 2);
      ctx.fillRect(screenX + 14 - waveOffset, screenY + 18, 14, 2);
      ctx.fillRect(screenX + 6 + waveOffset, screenY + 26, 10, 2);

      // Shimmer dots
      ctx.fillStyle = '#5dade2';
      ctx.fillRect(screenX + 8 + waveOffset, screenY + 8, 3, 1);
      ctx.fillRect(screenX + 18 - waveOffset, screenY + 18, 4, 1);
      break;
    }
    case 4: {
      // Stone Wall (solid)
      ctx.fillStyle = '#2e3138';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Masonry rows
      ctx.fillStyle = '#454a54';
      ctx.fillRect(screenX + 2, screenY + 2, 28, 8);
      ctx.fillRect(screenX + 2, screenY + 12, 13, 8);
      ctx.fillRect(screenX + 17, screenY + 12, 13, 8);
      ctx.fillRect(screenX + 2, screenY + 22, 28, 8);

      // Highlights
      ctx.fillStyle = '#606775';
      ctx.fillRect(screenX + 2, screenY + 2, 28, 2);
      ctx.fillRect(screenX + 2, screenY + 12, 13, 2);
      ctx.fillRect(screenX + 17, screenY + 12, 13, 2);
      ctx.fillRect(screenX + 2, screenY + 22, 28, 2);

      // Dark mortar seams
      ctx.fillStyle = '#1c1e22';
      ctx.fillRect(screenX, screenY + 10, TILE_SIZE, 2);
      ctx.fillRect(screenX, screenY + 20, TILE_SIZE, 2);
      ctx.fillRect(screenX + 15, screenY + 10, 2, 10);
      break;
    }
    case 5: {
      // Tree (solid) - trunk with layered pine canopy
      // Base grass beneath trunk
      ctx.fillStyle = '#2b5624';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Tree shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 28, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#4a2f15';
      ctx.fillRect(screenX + 12, screenY + 18, 8, 10);
      ctx.fillStyle = '#321f0d';
      ctx.fillRect(screenX + 16, screenY + 18, 4, 10);

      // Foliage layers (dark green to highlight)
      ctx.fillStyle = '#133917';
      ctx.beginPath();
      ctx.arc(screenX + 16, screenY + 14, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e5223';
      ctx.beginPath();
      ctx.arc(screenX + 15, screenY + 12, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2d7334';
      ctx.beginPath();
      ctx.arc(screenX + 14, screenY + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Top leafy highlight
      ctx.fillStyle = '#449e4e';
      ctx.fillRect(screenX + 11, screenY + 6, 6, 4);
      break;
    }
    case 6: {
      // Flower Grass (walkable)
      ctx.fillStyle = '#2b5624';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Grass tufts
      ctx.fillStyle = '#396d30';
      ctx.fillRect(screenX + 4, screenY + 6, 2, 4);
      ctx.fillRect(screenX + 22, screenY + 18, 2, 4);

      // Flowers (golden buttercups & wild violets)
      ctx.fillStyle = '#e6b800';
      ctx.fillRect(screenX + 10, screenY + 12, 3, 3);
      ctx.fillRect(screenX + 20, screenY + 8, 3, 3);
      ctx.fillStyle = '#d94b7c';
      ctx.fillRect(screenX + 15, screenY + 22, 3, 3);

      // White centers
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(screenX + 11, screenY + 13, 1, 1);
      ctx.fillRect(screenX + 21, screenY + 9, 1, 1);
      ctx.fillRect(screenX + 16, screenY + 23, 1, 1);
      break;
    }
    case 7: {
      // Stone Ruin / Altar (solid)
      ctx.fillStyle = '#22252a';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Carved plinth
      ctx.fillStyle = '#4e5563';
      ctx.fillRect(screenX + 4, screenY + 6, 24, 20);
      ctx.fillStyle = '#656e80';
      ctx.fillRect(screenX + 6, screenY + 8, 20, 16);

      // Runic glowing core
      const pulse = Math.abs(Math.sin(timeMs / 500));
      ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + pulse * 0.5})`;
      ctx.fillRect(screenX + 13, screenY + 13, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 15, screenY + 15, 2, 2);
      break;
    }
    default:
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }
}

/**
 * Renders the player sprite with class gear, facing direction, and step-bob gait.
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  facing: Direction,
  characterClass: CharacterClass,
  isMoving: boolean,
  timeMs: number
) {
  // Step bob animation
  const bobOffset = isMoving ? Math.sin((timeMs / 100) * Math.PI) * 2 : 0;
  const drawY = screenY + bobOffset;

  // 1. Cast shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(screenX + 16, screenY + 29, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const isAvenger = characterClass === 'Avenger';

  if (isAvenger) {
    // === AVENGER SPRITE ===
    // Mid-range warrior: crimson tabard, steel armor, radiant whip
    // Boots
    ctx.fillStyle = '#2b1b11';
    ctx.fillRect(screenX + 10, drawY + 24, 4, 6);
    ctx.fillRect(screenX + 18, drawY + 24, 4, 6);

    // Legs / Pants
    ctx.fillStyle = '#3a2519';
    ctx.fillRect(screenX + 11, drawY + 20, 10, 5);

    // Crimson Tabard & Torso Armor
    ctx.fillStyle = '#881337'; // Dark ruby
    ctx.fillRect(screenX + 9, drawY + 12, 14, 9);
    ctx.fillStyle = '#dc2626'; // Bright crimson
    ctx.fillRect(screenX + 11, drawY + 13, 10, 7);

    // Radiant Gold Sun Crest on Chest
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX + 14, drawY + 15, 4, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(screenX + 15, drawY + 16, 2, 1);

    // Steel Pauldrons (Shoulders)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(screenX + 7, drawY + 12, 3, 5);
    ctx.fillRect(screenX + 22, drawY + 12, 3, 5);

    // Head / Helm
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(screenX + 11, drawY + 4, 10, 8);
    // Face / Visor
    if (facing === 'UP') {
      // Back of helmet + plume
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(screenX + 14, drawY + 2, 4, 4);
      // Cape back
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(screenX + 10, drawY + 14, 12, 8);
    } else {
      // Visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(screenX + (facing === 'LEFT' ? 10 : facing === 'RIGHT' ? 17 : 12), drawY + 7, facing === 'DOWN' ? 8 : 5, 2);
      ctx.fillStyle = '#f59e0b'; // glowing eye slit
      ctx.fillRect(screenX + (facing === 'LEFT' ? 11 : facing === 'RIGHT' ? 18 : 13), drawY + 7, 2, 1);
      if (facing === 'DOWN') {
        ctx.fillRect(screenX + 17, drawY + 7, 2, 1);
      }
    }

    // Coiled Radiant Whip on belt / hand
    ctx.fillStyle = '#eab308';
    if (facing === 'LEFT') {
      ctx.fillRect(screenX + 6, drawY + 16, 3, 7);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(screenX + 7, drawY + 17, 1, 5);
    } else if (facing === 'RIGHT') {
      ctx.fillRect(screenX + 23, drawY + 16, 3, 7);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(screenX + 24, drawY + 17, 1, 5);
    } else {
      ctx.fillRect(screenX + 21, drawY + 16, 3, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(screenX + 22, drawY + 17, 1, 4);
    }
  } else {
    // === SAGE SPRITE ===
    // Ranged spellcaster: aether robes, arcane wand, floating aura
    // Robe hem / lower body
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(screenX + 10, drawY + 24, 12, 6);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(screenX + 11, drawY + 22, 10, 4);

    // Robe Torso
    ctx.fillStyle = '#1d4ed8'; // Royal blue
    ctx.fillRect(screenX + 9, drawY + 11, 14, 12);
    ctx.fillStyle = '#38bdf8'; // Mystic cyan trim
    ctx.fillRect(screenX + 15, drawY + 11, 2, 12);

    // Hood / Head
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(screenX + 10, drawY + 3, 12, 9);
    // Face shadow & glowing eyes
    if (facing === 'UP') {
      // Hood back & cowl
      ctx.fillStyle = '#172554';
      ctx.fillRect(screenX + 12, drawY + 4, 8, 7);
    } else {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(screenX + 12, drawY + 6, 8, 4);
      // Cyan glowing eyes
      ctx.fillStyle = '#38bdf8';
      if (facing === 'LEFT') {
        ctx.fillRect(screenX + 12, drawY + 7, 2, 2);
      } else if (facing === 'RIGHT') {
        ctx.fillRect(screenX + 18, drawY + 7, 2, 2);
      } else {
        ctx.fillRect(screenX + 13, drawY + 7, 2, 2);
        ctx.fillRect(screenX + 17, drawY + 7, 2, 2);
      }
    }

    // Aether Wand / Staff
    ctx.fillStyle = '#78350f'; // Wood handle
    const wandX = facing === 'LEFT' ? screenX + 5 : screenX + 24;
    ctx.fillRect(wandX, drawY + 8, 2, 14);

    // Glowing Arcane Crystal Tip
    const crystalGlow = Math.abs(Math.sin(timeMs / 300));
    ctx.fillStyle = `rgba(56, 189, 248, ${0.7 + crystalGlow * 0.3})`;
    ctx.fillRect(wandX - 2, drawY + 5, 6, 5);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(wandX - 1, drawY + 6, 4, 3);
  }

  // Directional facing arrow or indicator under player feet
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  switch (facing) {
    case 'UP':
      ctx.fillRect(screenX + 15, screenY + 2, 2, 2);
      break;
    case 'DOWN':
      ctx.fillRect(screenX + 15, screenY + 29, 2, 2);
      break;
    case 'LEFT':
      ctx.fillRect(screenX + 2, screenY + 15, 2, 2);
      break;
    case 'RIGHT':
      ctx.fillRect(screenX + 28, screenY + 15, 2, 2);
      break;
    default:
      break;
  }
}

/**
 * Main render function that handles culling, tile drawing, entity rendering,
 * and camera viewport clipping.
 */
export function renderGameScene({
  ctx,
  map,
  cameraX,
  cameraY,
  playerRenderX,
  playerRenderY,
  playerFacing,
  playerClass,
  isMoving,
  showGrid = false,
  timeMs,
}: RenderOptions) {
  // Clear full native canvas buffer
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Calculate visible tiles to cull off-screen rendering
  const { startCol, endCol, startRow, endRow } = getVisibleTileBounds(
    cameraX,
    cameraY,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );

  // 2. Render visible tiles
  for (let y = startRow; y <= endRow; y++) {
    for (let x = startCol; x <= endCol; x++) {
      const tileId = map[y][x];
      const screenX = x * TILE_SIZE - cameraX;
      const screenY = y * TILE_SIZE - cameraY;

      drawTile(ctx, tileId, screenX, screenY, timeMs);

      // Subtle grid overlay if enabled
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX + 0.5, screenY + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }

  // 3. Render Player Entity
  const playerScreenX = Math.round(playerRenderX - cameraX);
  const playerScreenY = Math.round(playerRenderY - cameraY);

  drawPlayer(
    ctx,
    playerScreenX,
    playerScreenY,
    playerFacing,
    playerClass,
    isMoving,
    timeMs
  );

  // 4. Subtle Vignette Border around canvas for retro atmospheric depth
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_HEIGHT * 0.45,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_WIDTH * 0.75
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(11, 13, 18, 0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
