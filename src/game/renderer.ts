import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  TileId,
  Direction,
  CharacterClass,
  Monster,
  FloatingText,
  VisualEffect,
  CorpseEntity,
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
  monsters?: Monster[];
  corpses?: CorpseEntity[];
  targetId?: string | null;
  visualEffects?: VisualEffect[];
  floatingTexts?: FloatingText[];
  showGrid?: boolean;
  timeMs: number;
}

/**
 * Draws a single 32x32 procedural retro tile into the canvas buffer.
 * Features detailed natural grass, textured dirt with pebbles, hewn masonry stone walls,
 * gnarled rooted trees (no lollipops), faceted boulders, and water ripples.
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
      // === GRASS (Detailed meadow with varied blade tufts and earthy flecks) ===
      // Base meadow green
      ctx.fillStyle = '#26511f';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Subtle under-shading patches
      ctx.fillStyle = '#22471b';
      ctx.fillRect(screenX, screenY + 4, 14, 12);
      ctx.fillRect(screenX + 16, screenY + 18, 16, 14);

      // Deep shadow crevices
      ctx.fillStyle = '#1a3715';
      ctx.fillRect(screenX + 5, screenY + 11, 2, 4);
      ctx.fillRect(screenX + 22, screenY + 14, 2, 4);
      ctx.fillRect(screenX + 12, screenY + 25, 3, 2);

      // Vibrant grass tufts (Cluster 1: Top-Left)
      ctx.fillStyle = '#3c7932';
      ctx.fillRect(screenX + 6, screenY + 7, 2, 5);
      ctx.fillRect(screenX + 4, screenY + 9, 2, 4);
      ctx.fillRect(screenX + 8, screenY + 8, 2, 4);
      // Bright tips
      ctx.fillStyle = '#55a347';
      ctx.fillRect(screenX + 6, screenY + 6, 2, 2);
      ctx.fillRect(screenX + 4, screenY + 8, 1, 2);

      // Grass tufts (Cluster 2: Center-Right)
      ctx.fillStyle = '#3c7932';
      ctx.fillRect(screenX + 20, screenY + 12, 2, 6);
      ctx.fillRect(screenX + 18, screenY + 14, 2, 4);
      ctx.fillRect(screenX + 22, screenY + 13, 2, 5);
      // Bright tips
      ctx.fillStyle = '#55a347';
      ctx.fillRect(screenX + 20, screenY + 11, 2, 2);
      ctx.fillRect(screenX + 22, screenY + 12, 1, 2);

      // Grass tufts (Cluster 3: Bottom-Left)
      ctx.fillStyle = '#38722f';
      ctx.fillRect(screenX + 9, screenY + 22, 2, 5);
      ctx.fillRect(screenX + 11, screenY + 23, 2, 4);
      ctx.fillStyle = '#4f9a42';
      ctx.fillRect(screenX + 9, screenY + 21, 2, 2);

      // Subtle earth/clover accents
      ctx.fillStyle = '#40702d';
      ctx.fillRect(screenX + 26, screenY + 26, 3, 2);
      ctx.fillRect(screenX + 2, screenY + 28, 2, 2);
      break;
    }

    case 1: {
      // === DIRT PATH (Detailed warm earth with pebbles, gravel, and track grain) ===
      // Base dirt tone
      ctx.fillStyle = '#6e512d';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Darker earthy ruts and soil variations
      ctx.fillStyle = '#563e21';
      ctx.fillRect(screenX + 2, screenY + 4, 12, 7);
      ctx.fillRect(screenX + 16, screenY + 14, 14, 8);
      ctx.fillRect(screenX + 6, screenY + 24, 18, 6);

      // Fine gravel / pebbles (small rounded stones embedded in dirt)
      // Pebble 1
      ctx.fillStyle = '#8f6c40';
      ctx.fillRect(screenX + 5, screenY + 6, 4, 3);
      ctx.fillStyle = '#a8814f';
      ctx.fillRect(screenX + 5, screenY + 6, 2, 1);
      ctx.fillStyle = '#3d2a15';
      ctx.fillRect(screenX + 6, screenY + 9, 3, 1);

      // Pebble 2
      ctx.fillStyle = '#87653c';
      ctx.fillRect(screenX + 19, screenY + 9, 5, 3);
      ctx.fillStyle = '#ab8553';
      ctx.fillRect(screenX + 19, screenY + 9, 3, 1);
      ctx.fillStyle = '#3d2a15';
      ctx.fillRect(screenX + 20, screenY + 12, 4, 1);

      // Pebble 3
      ctx.fillStyle = '#8f6c40';
      ctx.fillRect(screenX + 9, screenY + 18, 4, 3);
      ctx.fillStyle = '#ab8553';
      ctx.fillRect(screenX + 9, screenY + 18, 2, 1);
      ctx.fillStyle = '#3d2a15';
      ctx.fillRect(screenX + 10, screenY + 21, 3, 1);

      // Pebble 4
      ctx.fillStyle = '#836138';
      ctx.fillRect(screenX + 23, screenY + 23, 4, 3);
      ctx.fillStyle = '#a67f4c';
      ctx.fillRect(screenX + 23, screenY + 23, 2, 1);
      ctx.fillStyle = '#3d2a15';
      ctx.fillRect(screenX + 24, screenY + 26, 3, 1);

      // Fine grit / sand specks
      ctx.fillStyle = '#9e7949';
      ctx.fillRect(screenX + 15, screenY + 4, 2, 2);
      ctx.fillRect(screenX + 27, screenY + 16, 2, 2);
      ctx.fillRect(screenX + 2, screenY + 14, 2, 2);
      ctx.fillRect(screenX + 16, screenY + 27, 2, 2);
      break;
    }

    case 2: {
      // === COBBLESTONE (Stone plaza - already approved) ===
      ctx.fillStyle = '#424853';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Individual stone paving blocks
      ctx.fillStyle = '#586170';
      ctx.fillRect(screenX + 2, screenY + 2, 12, 12);
      ctx.fillRect(screenX + 16, screenY + 2, 14, 12);
      ctx.fillRect(screenX + 2, screenY + 16, 14, 14);
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
      // === WATER (with animated ripple) ===
      ctx.fillStyle = '#1b4163';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      const waveOffset = Math.sin((timeMs / 400) + (screenX + screenY) * 0.05) * 3;
      ctx.fillStyle = '#2b6294';
      ctx.fillRect(screenX + 4 + waveOffset, screenY + 8, 12, 2);
      ctx.fillRect(screenX + 14 - waveOffset, screenY + 18, 14, 2);
      ctx.fillRect(screenX + 6 + waveOffset, screenY + 26, 10, 2);

      ctx.fillStyle = '#5dade2';
      ctx.fillRect(screenX + 8 + waveOffset, screenY + 8, 3, 1);
      ctx.fillRect(screenX + 18 - waveOffset, screenY + 18, 4, 1);
      break;
    }

    case 4: {
      // === STONE WALL (Hewn ancient stone blocks, irregular courses, weathered texture & moss) ===
      // Deep dark mortar bed
      ctx.fillStyle = '#1c1f24';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Row 1 (Top course): Two irregular hewn blocks
      // Block 1A (Left, 17px wide)
      ctx.fillStyle = '#4c525e';
      ctx.fillRect(screenX + 1, screenY + 1, 16, 9);
      // Top & Left Chiseled Highlight
      ctx.fillStyle = '#687182';
      ctx.fillRect(screenX + 2, screenY + 2, 14, 2);
      ctx.fillRect(screenX + 2, screenY + 2, 2, 7);
      // Bottom & Right Stone Shade
      ctx.fillStyle = '#343842';
      ctx.fillRect(screenX + 3, screenY + 8, 14, 2);
      ctx.fillRect(screenX + 15, screenY + 3, 2, 7);

      // Block 1B (Right, 13px wide)
      ctx.fillStyle = '#454b57';
      ctx.fillRect(screenX + 19, screenY + 1, 12, 9);
      ctx.fillStyle = '#626a7a';
      ctx.fillRect(screenX + 20, screenY + 2, 10, 2);
      ctx.fillStyle = '#31353e';
      ctx.fillRect(screenX + 20, screenY + 8, 11, 2);

      // Row 2 (Middle course): Three staggered hewn stone blocks
      // Block 2A (Left, 9px)
      ctx.fillStyle = '#474d59';
      ctx.fillRect(screenX + 1, screenY + 12, 8, 9);
      ctx.fillStyle = '#626a7a';
      ctx.fillRect(screenX + 2, screenY + 13, 6, 2);
      ctx.fillStyle = '#2f333c';
      ctx.fillRect(screenX + 2, screenY + 19, 7, 2);

      // Block 2B (Center, 14px)
      ctx.fillStyle = '#505664';
      ctx.fillRect(screenX + 11, screenY + 12, 12, 9);
      ctx.fillStyle = '#6f798c';
      ctx.fillRect(screenX + 12, screenY + 13, 10, 2);
      ctx.fillRect(screenX + 12, screenY + 19, 11, 2);

      // Block 2C (Right, 7px)
      ctx.fillStyle = '#434954';
      ctx.fillRect(screenX + 25, screenY + 12, 6, 9);
      ctx.fillStyle = '#5e6675';
      ctx.fillRect(screenX + 26, screenY + 13, 4, 2);

      // Row 3 (Bottom course): Two large foundational hewn blocks
      // Block 3A (Left, 13px)
      ctx.fillStyle = '#3f444f';
      ctx.fillRect(screenX + 1, screenY + 23, 13, 8);
      ctx.fillStyle = '#5b6373';
      ctx.fillRect(screenX + 2, screenY + 24, 11, 2);
      ctx.fillStyle = '#282b32';
      ctx.fillRect(screenX + 2, screenY + 29, 12, 2);

      // Block 3B (Right, 16px)
      ctx.fillStyle = '#484e5b';
      ctx.fillRect(screenX + 16, screenY + 23, 15, 8);
      ctx.fillStyle = '#656e7f';
      ctx.fillRect(screenX + 17, screenY + 24, 13, 2);
      ctx.fillStyle = '#2a2d36';
      ctx.fillRect(screenX + 17, screenY + 29, 14, 2);

      // Weathered Stone Texture: Chiseled cracks & pitting
      ctx.fillStyle = '#23262c';
      ctx.fillRect(screenX + 7, screenY + 5, 3, 1);
      ctx.fillRect(screenX + 9, screenY + 6, 2, 1);
      ctx.fillRect(screenX + 18, screenY + 16, 3, 1);

      // Ancient Moss creeping in mortar seams
      ctx.fillStyle = '#2d4b25';
      ctx.fillRect(screenX + 17, screenY + 10, 2, 3);
      ctx.fillRect(screenX + 9, screenY + 21, 3, 2);
      ctx.fillRect(screenX + 23, screenY + 21, 2, 2);
      ctx.fillStyle = '#4a753d';
      ctx.fillRect(screenX + 17, screenY + 11, 1, 1);
      ctx.fillRect(screenX + 10, screenY + 21, 1, 1);
      break;
    }

    case 5: {
      // === TREE (Authentic RPG tree: gnarled bark trunk, root flares, organic leafy clumps) ===
      // Base grass
      ctx.fillStyle = '#26511f';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Tree ground shadow (organic oval spreading beneath canopy)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 28, 13, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- TRUNK & ROOTS ---
      // Root flare spreading into ground
      ctx.fillStyle = '#2c190b';
      // Left root
      ctx.fillRect(screenX + 9, screenY + 27, 4, 3);
      ctx.fillRect(screenX + 7, screenY + 29, 3, 2);
      // Right root
      ctx.fillRect(screenX + 19, screenY + 27, 5, 3);
      ctx.fillRect(screenX + 22, screenY + 29, 3, 2);
      // Main trunk core
      ctx.fillStyle = '#442713';
      ctx.fillRect(screenX + 12, screenY + 16, 8, 12);
      // Bark texture ridges & shadows
      ctx.fillStyle = '#2c190b';
      ctx.fillRect(screenX + 12, screenY + 17, 2, 11);
      ctx.fillRect(screenX + 17, screenY + 19, 2, 9);
      // Bark highlight
      ctx.fillStyle = '#653c1d';
      ctx.fillRect(screenX + 15, screenY + 18, 2, 10);
      // Branch splits at top of trunk
      ctx.fillStyle = '#3a200e';
      ctx.fillRect(screenX + 10, screenY + 14, 4, 4);
      ctx.fillRect(screenX + 18, screenY + 14, 4, 4);

      // --- CANOPY FOLIAGE (Layered organic clusters, NO LOLLIPOP CIRCLE) ---
      // 1. Deep Shadow Leaf Layer (Dark forest green)
      ctx.fillStyle = '#0f2c13';
      // Left lobe
      ctx.beginPath();
      ctx.arc(screenX + 9, screenY + 13, 8, 0, Math.PI * 2);
      ctx.fill();
      // Right lobe
      ctx.beginPath();
      ctx.arc(screenX + 23, screenY + 13, 8, 0, Math.PI * 2);
      ctx.fill();
      // Center & Top lobes
      ctx.beginPath();
      ctx.arc(screenX + 16, screenY + 9, 9, 0, Math.PI * 2);
      ctx.fill();

      // 2. Midtone Foliage Clumps (Rich woodland green)
      ctx.fillStyle = '#1d4d23';
      ctx.beginPath();
      ctx.arc(screenX + 10, screenY + 11, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + 22, screenY + 11, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + 16, screenY + 7, 8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Foliage Body Layer (Lush vibrant green)
      ctx.fillStyle = '#296b30';
      ctx.beginPath();
      ctx.arc(screenX + 11, screenY + 9, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + 21, screenY + 9, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(screenX + 15, screenY + 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // 4. Sunlit Leaf Clusters (Top highlights)
      ctx.fillStyle = '#41994b';
      // Top cluster highlights
      ctx.fillRect(screenX + 13, screenY + 2, 5, 3);
      ctx.fillRect(screenX + 12, screenY + 4, 7, 2);
      // Left cluster highlights
      ctx.fillRect(screenX + 8, screenY + 7, 4, 3);
      ctx.fillRect(screenX + 7, screenY + 8, 2, 2);
      // Right cluster highlights
      ctx.fillRect(screenX + 19, screenY + 7, 4, 3);
      // Bright sun flecks
      ctx.fillStyle = '#67be72';
      ctx.fillRect(screenX + 14, screenY + 3, 3, 1);
      ctx.fillRect(screenX + 9, screenY + 8, 2, 1);
      break;
    }

    case 6: {
      // === FLOWER GRASS (Detailed meadow with colorful wildflowers) ===
      ctx.fillStyle = '#26511f';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Grass tufts
      ctx.fillStyle = '#3c7932';
      ctx.fillRect(screenX + 3, screenY + 5, 2, 4);
      ctx.fillRect(screenX + 23, screenY + 16, 2, 4);

      // Wildflowers (Golden Buttercups)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(screenX + 9, screenY + 10, 4, 4);
      ctx.fillRect(screenX + 22, screenY + 6, 4, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 10, screenY + 11, 2, 2);
      ctx.fillRect(screenX + 23, screenY + 7, 2, 2);

      // Wildflowers (Crimson/Violet Blossoms)
      ctx.fillStyle = '#c026d3';
      ctx.fillRect(screenX + 15, screenY + 21, 4, 4);
      ctx.fillStyle = '#f5d0fe';
      ctx.fillRect(screenX + 16, screenY + 22, 2, 2);

      // Tiny white daisy petals
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(screenX + 4, screenY + 19, 2, 2);
      ctx.fillRect(screenX + 27, screenY + 23, 2, 2);
      break;
    }

    case 7: {
      // === STONE RUIN / SHRINE (Solid ancient pedestal with pulsing glow) ===
      ctx.fillStyle = '#1c1f24';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Plinth base
      ctx.fillStyle = '#474d59';
      ctx.fillRect(screenX + 3, screenY + 5, 26, 22);
      ctx.fillStyle = '#5c6473';
      ctx.fillRect(screenX + 5, screenY + 7, 22, 18);

      // Carved steps
      ctx.fillStyle = '#737c8e';
      ctx.fillRect(screenX + 7, screenY + 9, 18, 2);
      ctx.fillStyle = '#353942';
      ctx.fillRect(screenX + 7, screenY + 23, 18, 2);

      // Glowing runic emblem
      const pulse = Math.abs(Math.sin(timeMs / 450));
      ctx.fillStyle = `rgba(245, 158, 11, ${0.45 + pulse * 0.45})`;
      ctx.fillRect(screenX + 12, screenY + 12, 8, 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 14, screenY + 14, 4, 4);
      break;
    }

    case 8: {
      // === LARGE ROCK / BOULDER (Separate large natural boulder, craggy facets & moss) ===
      // Base grass
      ctx.fillStyle = '#26511f';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(screenX + 17, screenY + 27, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep Shadow Body of Boulder (Dark Charcoal Slate)
      ctx.fillStyle = '#262a33';
      ctx.beginPath();
      // Natural jagged polygon
      ctx.moveTo(screenX + 4, screenY + 25);
      ctx.lineTo(screenX + 2, screenY + 15);
      ctx.lineTo(screenX + 7, screenY + 8);
      ctx.lineTo(screenX + 15, screenY + 4);
      ctx.lineTo(screenX + 25, screenY + 6);
      ctx.lineTo(screenX + 29, screenY + 14);
      ctx.lineTo(screenX + 28, screenY + 24);
      ctx.lineTo(screenX + 18, screenY + 28);
      ctx.closePath();
      ctx.fill();

      // Mid-tone Rock Mass (Slate Gray)
      ctx.fillStyle = '#424856';
      ctx.beginPath();
      ctx.moveTo(screenX + 5, screenY + 23);
      ctx.lineTo(screenX + 4, screenY + 15);
      ctx.lineTo(screenX + 8, screenY + 9);
      ctx.lineTo(screenX + 15, screenY + 6);
      ctx.lineTo(screenX + 23, screenY + 8);
      ctx.lineTo(screenX + 26, screenY + 15);
      ctx.lineTo(screenX + 22, screenY + 22);
      ctx.lineTo(screenX + 15, screenY + 24);
      ctx.closePath();
      ctx.fill();

      // Sunlit Facet (Upper-Left highlight)
      ctx.fillStyle = '#626b7d';
      ctx.beginPath();
      ctx.moveTo(screenX + 6, screenY + 14);
      ctx.lineTo(screenX + 9, screenY + 9);
      ctx.lineTo(screenX + 16, screenY + 7);
      ctx.lineTo(screenX + 18, screenY + 13);
      ctx.lineTo(screenX + 11, screenY + 17);
      ctx.closePath();
      ctx.fill();

      // Sharp light crest on top edge
      ctx.fillStyle = '#818b9e';
      ctx.fillRect(screenX + 10, screenY + 8, 6, 2);
      ctx.fillRect(screenX + 8, screenY + 10, 3, 3);

      // Deep crevice fissure running diagonally
      ctx.fillStyle = '#181b21';
      ctx.fillRect(screenX + 16, screenY + 12, 2, 5);
      ctx.fillRect(screenX + 17, screenY + 17, 3, 4);

      // Moss / Lichen growing on the shaded rock base
      ctx.fillStyle = '#315428';
      ctx.fillRect(screenX + 5, screenY + 22, 5, 4);
      ctx.fillRect(screenX + 20, screenY + 21, 6, 4);
      ctx.fillStyle = '#4e823f';
      ctx.fillRect(screenX + 6, screenY + 23, 2, 2);
      ctx.fillRect(screenX + 22, screenY + 22, 2, 2);
      break;
    }

    case 9: {
      // === MARSH MUD (Damp marshland soil, dark mud puddles, organic sediment & marsh reeds) ===
      // Base peat / wet marsh tone
      ctx.fillStyle = '#323522';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

      // Deep dark mud puddles
      ctx.fillStyle = '#222417';
      ctx.fillRect(screenX + 3, screenY + 5, 14, 8);
      ctx.fillRect(screenX + 16, screenY + 16, 13, 10);
      ctx.fillRect(screenX + 6, screenY + 22, 12, 6);

      // Glistening wet surface reflections
      ctx.fillStyle = '#424a2f';
      ctx.fillRect(screenX + 5, screenY + 6, 8, 2);
      ctx.fillRect(screenX + 18, screenY + 17, 7, 2);

      // Tiny stagnant water sheen
      ctx.fillStyle = '#2a484f';
      ctx.fillRect(screenX + 7, screenY + 8, 4, 2);
      ctx.fillRect(screenX + 20, screenY + 19, 4, 2);

      // Silt specks & mud bubbles
      ctx.fillStyle = '#4e5436';
      ctx.fillRect(screenX + 2, screenY + 18, 2, 2);
      ctx.fillRect(screenX + 26, screenY + 7, 2, 2);
      ctx.fillRect(screenX + 13, screenY + 27, 2, 2);

      // Small marsh reed tuft
      ctx.fillStyle = '#5c693a';
      ctx.fillRect(screenX + 24, screenY + 22, 1, 5);
      ctx.fillRect(screenX + 26, screenY + 20, 1, 7);
      ctx.fillRect(screenX + 28, screenY + 23, 1, 4);
      break;
    }

    default:
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }
}

/**
 * Renders the player sprite with class gear, facing direction, and step-bob gait.
 * Coloration:
 * - Avenger: Medium Tyrian Purple (#78164b / #8a1c57) with burnished brass & radiant whip
 * - Sage: Medium-Light Azure Blue (#228ee5 / #38a2f5) with celestial trims & arcane crystal wand
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
    // Medium Tyrian Purple (#78164b / #8a1c57 / #9e2366), brass armor, radiant whip
    // Boots
    ctx.fillStyle = '#26140b';
    ctx.fillRect(screenX + 10, drawY + 24, 4, 6);
    ctx.fillRect(screenX + 18, drawY + 24, 4, 6);

    // Leather Pants
    ctx.fillStyle = '#361e12';
    ctx.fillRect(screenX + 11, drawY + 20, 10, 5);

    // Medium Tyrian Purple Tabard & Tunic
    // Shadow underfolds
    ctx.fillStyle = '#4e0d31';
    ctx.fillRect(screenX + 9, drawY + 12, 14, 9);
    // Medium Tyrian Purple main fabric
    ctx.fillStyle = '#7e184e';
    ctx.fillRect(screenX + 11, drawY + 13, 10, 7);
    // Lighter Tyrian purple fold highlight
    ctx.fillStyle = '#9b2263';
    ctx.fillRect(screenX + 12, drawY + 13, 4, 6);

    // Burnished Brass Sun Crest on Chest
    ctx.fillStyle = '#d99b26';
    ctx.fillRect(screenX + 14, drawY + 15, 4, 3);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(screenX + 15, drawY + 16, 2, 1);

    // Steel / Brass Pauldrons (Shoulders)
    ctx.fillStyle = '#838e9e';
    ctx.fillRect(screenX + 7, drawY + 12, 3, 5);
    ctx.fillRect(screenX + 22, drawY + 12, 3, 5);
    // Shoulder brass trim
    ctx.fillStyle = '#d99b26';
    ctx.fillRect(screenX + 7, drawY + 12, 3, 1);
    ctx.fillRect(screenX + 22, drawY + 12, 3, 1);

    // Head / Helm
    ctx.fillStyle = '#b4bfcc';
    ctx.fillRect(screenX + 11, drawY + 4, 10, 8);

    if (facing === 'UP') {
      // Back of helmet + Tyrian purple plume
      ctx.fillStyle = '#9b2263';
      ctx.fillRect(screenX + 14, drawY + 2, 4, 4);
      // Tyrian Purple Cape back
      ctx.fillStyle = '#681340';
      ctx.fillRect(screenX + 10, drawY + 14, 12, 8);
      ctx.fillStyle = '#891a56';
      ctx.fillRect(screenX + 13, drawY + 15, 6, 6);
    } else {
      // Visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(
        screenX + (facing === 'LEFT' ? 10 : facing === 'RIGHT' ? 17 : 12),
        drawY + 7,
        facing === 'DOWN' ? 8 : 5,
        2
      );
      // Glowing radiant amber eye slit
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(
        screenX + (facing === 'LEFT' ? 11 : facing === 'RIGHT' ? 18 : 13),
        drawY + 7,
        2,
        1
      );
      if (facing === 'DOWN') {
        ctx.fillRect(screenX + 17, drawY + 7, 2, 1);
      }
    }

    // Coiled Radiant Sun Whip on belt / hand
    ctx.fillStyle = '#f59e0b';
    if (facing === 'LEFT') {
      ctx.fillRect(screenX + 6, drawY + 16, 3, 7);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 7, drawY + 17, 1, 5);
    } else if (facing === 'RIGHT') {
      ctx.fillRect(screenX + 23, drawY + 16, 3, 7);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 24, drawY + 17, 1, 5);
    } else {
      ctx.fillRect(screenX + 21, drawY + 16, 3, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(screenX + 22, drawY + 17, 1, 4);
    }
  } else {
    // === SAGE SPRITE ===
    // Medium-Light Azure Blue (#228ee5 / #38a2f5 / #63b6f9) with arcane silver & crystal wand
    // Robe hem / lower body
    ctx.fillStyle = '#0d4e82';
    ctx.fillRect(screenX + 10, drawY + 24, 12, 6);
    ctx.fillStyle = '#1874b8';
    ctx.fillRect(screenX + 11, drawY + 22, 10, 4);

    // Robe Torso - Medium-Light Azure Blue
    ctx.fillStyle = '#1d7ec7'; // Darker fold
    ctx.fillRect(screenX + 9, drawY + 11, 14, 12);
    ctx.fillStyle = '#2998ea'; // Medium-Light Azure Blue body
    ctx.fillRect(screenX + 11, drawY + 12, 10, 10);
    // Light azure highlight
    ctx.fillStyle = '#68bcf9';
    ctx.fillRect(screenX + 13, drawY + 12, 3, 10);

    // Arcane Silver / Platinum Runic Trim
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(screenX + 15, drawY + 11, 2, 11);

    // Hood / Head - Medium Azure
    ctx.fillStyle = '#228ee5';
    ctx.fillRect(screenX + 10, drawY + 3, 12, 9);

    if (facing === 'UP') {
      // Hood back & cowl
      ctx.fillStyle = '#1669a8';
      ctx.fillRect(screenX + 12, drawY + 4, 8, 7);
      ctx.fillStyle = '#2aa0f5';
      ctx.fillRect(screenX + 14, drawY + 5, 4, 5);
    } else {
      // Deep cowl face shadow
      ctx.fillStyle = '#061a2b';
      ctx.fillRect(screenX + 12, drawY + 6, 8, 4);
      // Glowing Cyan/Azure Mystic Eyes
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
    ctx.fillStyle = '#5c3516'; // Polished elderwood
    const wandX = facing === 'LEFT' ? screenX + 5 : screenX + 24;
    ctx.fillRect(wandX, drawY + 8, 2, 14);

    // Glowing Azure Arcane Crystal Tip
    const crystalGlow = Math.abs(Math.sin(timeMs / 300));
    ctx.fillStyle = `rgba(56, 189, 248, ${0.75 + crystalGlow * 0.25})`;
    ctx.fillRect(wandX - 2, drawY + 5, 6, 5);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(wandX - 1, drawY + 6, 4, 3);
  }

  // Directional facing dot under player feet
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
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
 * Draws the targeting reticle brackets over the targeted monster's tile.
 */
function drawTargetReticle(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  timeMs: number
) {
  const pulse = Math.sin(timeMs / 180) * 0.35 + 0.65;
  const bracketLen = 6;

  // Ground highlight
  ctx.fillStyle = `rgba(239, 68, 68, ${0.12 * pulse})`;
  ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

  // Outer glowing brackets
  ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
  ctx.lineWidth = 1.5;

  // Top-Left bracket
  ctx.beginPath();
  ctx.moveTo(screenX + 2, screenY + 2 + bracketLen);
  ctx.lineTo(screenX + 2, screenY + 2);
  ctx.lineTo(screenX + 2 + bracketLen, screenY + 2);
  ctx.stroke();

  // Top-Right bracket
  ctx.beginPath();
  ctx.moveTo(screenX + TILE_SIZE - 2 - bracketLen, screenY + 2);
  ctx.lineTo(screenX + TILE_SIZE - 2, screenY + 2);
  ctx.lineTo(screenX + TILE_SIZE - 2, screenY + 2 + bracketLen);
  ctx.stroke();

  // Bottom-Left bracket
  ctx.beginPath();
  ctx.moveTo(screenX + 2, screenY + TILE_SIZE - 2 - bracketLen);
  ctx.lineTo(screenX + 2, screenY + TILE_SIZE - 2);
  ctx.lineTo(screenX + 2 + bracketLen, screenY + TILE_SIZE - 2);
  ctx.stroke();

  // Bottom-Right bracket
  ctx.beginPath();
  ctx.moveTo(screenX + TILE_SIZE - 2 - bracketLen, screenY + TILE_SIZE - 2);
  ctx.lineTo(screenX + TILE_SIZE - 2, screenY + TILE_SIZE - 2);
  ctx.lineTo(screenX + TILE_SIZE - 2, screenY + TILE_SIZE - 2 - bracketLen);
  ctx.stroke();
}

/**
 * Renders all 4 monster archetypes (Giant Rat, Bramble Hound, Clockwork Drone, Spore Spitter),
 * both when living (with gait/animations, status overlays, and floating mini health bars) and as corpses.
 */
function drawMonster(
  ctx: CanvasRenderingContext2D,
  monster: Monster,
  screenX: number,
  screenY: number,
  isTargeted: boolean,
  timeMs: number
) {
  const archetype = monster.archetype || 'giant_rat';

  if (!monster.isAlive) {
    // === CORPSE RENDERING ===
    const deathAge = monster.deathTime ? timeMs - monster.deathTime : 0;
    // Fades out near 6000ms despawn window
    let alpha = 1.0;
    if (deathAge > 4500) {
      alpha = Math.max(0, 1 - (deathAge - 4500) / 1500);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    if (archetype === 'clockwork_drone') {
      // Clockwork Drone Corpse: Shattered bronze chassis, broken gears, soot & dying spark
      // Soot and oil on ground
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 23, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dented bronze body plate
      ctx.fillStyle = '#784c19';
      ctx.fillRect(screenX + 10, screenY + 18, 12, 7);
      ctx.fillStyle = '#9d6526';
      ctx.fillRect(screenX + 12, screenY + 17, 8, 4);

      // Cracked gear piece
      ctx.fillStyle = '#d97706';
      ctx.fillRect(screenX + 7, screenY + 20, 5, 4);
      ctx.fillRect(screenX + 20, screenY + 19, 4, 5);

      // Shattered cyan glass optic fragment
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(screenX + 15, screenY + 19, 2, 2);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(screenX + 13, screenY + 22, 2, 2);
    } else if (archetype === 'spore_spitter') {
      // Spore Spitter Corpse: Wilted fungal stalk, split purple cap, toxic green sludge
      // Toxic ooze pool
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 23, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f1159';
      ctx.fillRect(screenX + 11, screenY + 20, 10, 4);

      // Wilted green stalk
      ctx.fillStyle = '#22421d';
      ctx.fillRect(screenX + 8, screenY + 22, 11, 4);

      // Deflated purple fungal cap
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(screenX + 14, screenY + 18, 9, 5);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(screenX + 16, screenY + 17, 5, 3);

      // Slime bubble
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(screenX + 12, screenY + 22, 2, 2);
      ctx.fillRect(screenX + 21, screenY + 21, 2, 2);
    } else if (archetype === 'bramble_hound') {
      // Bramble Hound Corpse: Curled dark briar hound, thorn spines, crimson pool
      ctx.fillStyle = '#3f0606';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 23, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Slumped briar body
      ctx.fillStyle = '#1a2217';
      ctx.fillRect(screenX + 9, screenY + 18, 14, 7);
      ctx.fillStyle = '#283323';
      ctx.fillRect(screenX + 11, screenY + 17, 9, 5);

      // Protruding wooden thorns
      ctx.fillStyle = '#5c4323';
      ctx.fillRect(screenX + 13, screenY + 15, 2, 3);
      ctx.fillRect(screenX + 17, screenY + 15, 2, 3);
      ctx.fillRect(screenX + 21, screenY + 18, 3, 2);
    } else {
      // Giant Rat Corpse: Blood stain, curled rat remains, limp tail
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.ellipse(screenX + 16, screenY + 22, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#261c16';
      ctx.fillRect(screenX + 10, screenY + 19, 11, 6);
      ctx.fillStyle = '#3a2b22';
      ctx.fillRect(screenX + 12, screenY + 18, 7, 4);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(screenX + 14, screenY + 20, 2, 2);
      ctx.fillRect(screenX + 18, screenY + 21, 2, 2);

      ctx.strokeStyle = '#9f6f60';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(screenX + 10, screenY + 22);
      ctx.lineTo(screenX + 5, screenY + 24);
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  // === LIVING MONSTER RENDERING ===
  // 1. Procedural sprite body based on archetype
  let drawY = screenY;

  if (archetype === 'bramble_hound') {
    // === BRAMBLE HOUND (Fast chaser, dark briar hound, thorn spines, red glowing feral eyes) ===
    const runBob = monster.isMoving ? Math.sin((timeMs / 55) * Math.PI) * 2 : 0;
    drawY = screenY + runBob;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 27, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark briar quadruped torso
    ctx.fillStyle = '#1c2419';
    ctx.fillRect(screenX + 7, drawY + 14, 14, 9);
    ctx.fillStyle = '#2a3726';
    ctx.fillRect(screenX + 9, drawY + 13, 11, 6);

    // Jagged wooden thorn spines along back
    ctx.fillStyle = '#5c4224';
    ctx.fillRect(screenX + 9, drawY + 10, 2, 4);
    ctx.fillRect(screenX + 13, drawY + 9, 2, 5);
    ctx.fillRect(screenX + 17, drawY + 10, 2, 4);
    ctx.fillStyle = '#856338';
    ctx.fillRect(screenX + 13, drawY + 8, 1, 2);

    // Canine Head & Snout (facing right/forward)
    ctx.fillStyle = '#222d1f';
    ctx.fillRect(screenX + 18, drawY + 12, 8, 7);
    ctx.fillRect(screenX + 24, drawY + 15, 4, 4); // muzzle

    // Fangs
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(screenX + 25, drawY + 18, 1, 2);

    // Glowing Feral Crimson Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX + 21, drawY + 13, 3, 2);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(screenX + 21, drawY + 13, 1, 1);

    // Four Agile Legs / Briar Paws
    ctx.fillStyle = '#141a12';
    ctx.fillRect(screenX + 8, drawY + 22, 3, 4);
    ctx.fillRect(screenX + 13, drawY + 22, 3, 4);
    ctx.fillRect(screenX + 18, drawY + 22, 3, 4);
    ctx.fillRect(screenX + 23, drawY + 22, 3, 4);
  } else if (archetype === 'clockwork_drone') {
    // === CLOCKWORK DRONE (Armored construct, floating bronze chassis, glowing cyan optic lens, brass rivets) ===
    const hoverBob = Math.sin(timeMs / 180) * 2;
    drawY = screenY + hoverBob;

    // Ground hover shadow (shrinks and expands with hover)
    const shadowScale = 1 + Math.sin(timeMs / 180) * 0.15;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 28, 9 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Side thruster / stabilizer fins
    ctx.fillStyle = '#663f14';
    ctx.fillRect(screenX + 4, drawY + 15, 3, 6);
    ctx.fillRect(screenX + 25, drawY + 15, 3, 6);

    // Burnished bronze octagonal chassis
    ctx.fillStyle = '#784c19';
    ctx.fillRect(screenX + 7, drawY + 10, 18, 14);
    ctx.fillRect(screenX + 9, drawY + 8, 14, 18);
    // Metallic midtone plate
    ctx.fillStyle = '#9d6526';
    ctx.fillRect(screenX + 9, drawY + 10, 14, 14);
    // Brass highlighted top rim
    ctx.fillStyle = '#c58e41';
    ctx.fillRect(screenX + 10, drawY + 9, 12, 2);

    // Revolving brass gears & bolt rivets
    ctx.fillStyle = '#eab308';
    ctx.fillRect(screenX + 8, drawY + 9, 2, 2);
    ctx.fillRect(screenX + 22, drawY + 9, 2, 2);
    ctx.fillRect(screenX + 8, drawY + 21, 2, 2);
    ctx.fillRect(screenX + 22, drawY + 21, 2, 2);

    // Central Optical Lens Ring (Dark Iron bezel)
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(screenX + 12, drawY + 13, 8, 8);

    // Pulsating Glowing Cyan Optic Eye
    const opticPulse = (Math.sin(timeMs / 140) + 1) * 0.5;
    ctx.fillStyle = opticPulse > 0.5 ? '#38bdf8' : '#0284c7';
    ctx.fillRect(screenX + 13, drawY + 14, 6, 6);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(screenX + 14, drawY + 15, 2, 2);

    // Bottom copper conduits / exhaust spark
    ctx.fillStyle = '#b45309';
    ctx.fillRect(screenX + 13, drawY + 24, 6, 2);
  } else if (archetype === 'spore_spitter') {
    // === SPORE SPITTER (Ranged artillery, thick knotted stalk, bulbous purple fungal cap, pulsating toxic pores) ===
    const sporeSway = Math.sin(timeMs / 220) * 1.5;
    drawY = screenY;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 27, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Knotted fungal stalk / base
    ctx.fillStyle = '#22421d';
    ctx.fillRect(screenX + 13, drawY + 17, 6, 9);
    ctx.fillStyle = '#34612b';
    ctx.fillRect(screenX + 14, drawY + 17, 3, 9);
    // Root tendrils into soil
    ctx.fillStyle = '#1a3316';
    ctx.fillRect(screenX + 11, drawY + 24, 3, 3);
    ctx.fillRect(screenX + 18, drawY + 24, 3, 3);

    // Bulbous Fungal Mushroom Cap (Violet/Magenta)
    const capX = screenX + 7 + sporeSway;
    ctx.fillStyle = '#4a044e';
    ctx.fillRect(capX, drawY + 11, 18, 7);
    ctx.fillRect(capX + 2, drawY + 8, 14, 6);
    ctx.fillRect(capX + 5, drawY + 6, 8, 3);

    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(capX + 3, drawY + 9, 12, 6);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(capX + 4, drawY + 8, 10, 3);

    // Pulsating Toxic Chartreuse Spore Pores
    const poreGlow = Math.sin(timeMs / 120) > 0 ? '#a3e635' : '#84cc16';
    ctx.fillStyle = poreGlow;
    ctx.fillRect(capX + 4, drawY + 11, 2, 2);
    ctx.fillRect(capX + 9, drawY + 9, 3, 2);
    ctx.fillRect(capX + 14, drawY + 12, 2, 2);

    // Spore Maw / Spitting Spout at the crown
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(capX + 7, drawY + 6, 4, 2);
    // Floating tiny spore speck
    const sporeSpeckY = (timeMs / 20) % 8;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(capX + 8, drawY + 4 - sporeSpeckY, 1, 1);
  } else {
    // === GIANT RAT (Baseline Vermin) ===
    const walkBob = monster.isMoving ? Math.sin((timeMs / 80) * Math.PI) * 1.5 : 0;
    drawY = screenY + walkBob;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 26, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    const tailSway = Math.sin(timeMs / 120) * 2;
    ctx.strokeStyle = '#d48b78';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screenX + 8, drawY + 19);
    ctx.quadraticCurveTo(screenX + 3 + tailSway, drawY + 16, screenX + 1 + tailSway, drawY + 22);
    ctx.stroke();

    // Rat Body
    ctx.fillStyle = '#3d2e24';
    ctx.fillRect(screenX + 8, drawY + 15, 13, 8);
    ctx.fillStyle = '#281d16';
    ctx.fillRect(screenX + 9, drawY + 14, 10, 4);
    ctx.fillStyle = '#5a4638';
    ctx.fillRect(screenX + 10, drawY + 21, 9, 2);

    // Head & Snout
    ctx.fillStyle = '#47362b';
    ctx.fillRect(screenX + 19, drawY + 16, 6, 6);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(screenX + 25, drawY + 19, 2, 2);

    // Red eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX + 22, drawY + 16, 2, 2);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(screenX + 22, drawY + 16, 1, 1);

    // Whiskers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(screenX + 24, drawY + 18);
    ctx.lineTo(screenX + 28, drawY + 16);
    ctx.moveTo(screenX + 24, drawY + 20);
    ctx.lineTo(screenX + 28, drawY + 22);
    ctx.stroke();

    // Small Paws
    ctx.fillStyle = '#b07062';
    ctx.fillRect(screenX + 10, drawY + 23, 3, 2);
    ctx.fillRect(screenX + 17, drawY + 23, 3, 2);
  }

  // 2. Status Effects Overlays
  const now = timeMs;
  if (monster.statusEffects.rootedUntil && now < monster.statusEffects.rootedUntil) {
    // Entangling Lash Roots (golden energy chains around paws)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(screenX + 16, drawY + 21, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(screenX + 12, drawY + 20, 2, 2);
    ctx.fillRect(screenX + 18, drawY + 20, 2, 2);
  }

  if (monster.statusEffects.confusedUntil && now < monster.statusEffects.confusedUntil) {
    // Static Confusion (swirling arcane stars above head)
    const starAngle = (timeMs / 150) % (Math.PI * 2);
    const starX = screenX + 16 + Math.cos(starAngle) * 6;
    const starY = drawY + 4 + Math.sin(starAngle) * 3;
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(starX, starY, 3, 3);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(starX + 1, starY + 1, 1, 1);
  }

  // 3. Floating Mini Health Bar (Green / Red)
  const barW = 18;
  const barH = 3;
  const barX = screenX + 7;
  const barY = drawY + 3;

  // Bar background border
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  // Red missing health
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(barX, barY, barW, barH);
  // Green current health
  const hpPercent = Math.max(0, monster.hp / monster.maxHp);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(barX, barY, Math.round(barW * hpPercent), barH);
}

/**
 * Draws active spell and projectile visuals, including spawn dust puffs and spore artillery shots.
 */
function drawVisualEffects(
  ctx: CanvasRenderingContext2D,
  effects: VisualEffect[],
  cameraX: number,
  cameraY: number,
  timeMs: number
) {
  for (const eff of effects) {
    const rawElapsed = timeMs - eff.startTime;
    if (rawElapsed < 0 || rawElapsed > eff.durationMs) continue;

    const progress = Math.max(0, Math.min(1, rawElapsed / (eff.durationMs || 1)));
    const startX = eff.fromX - cameraX;
    const startY = eff.fromY - cameraY;
    const targetX = eff.toX - cameraX;
    const targetY = eff.toY - cameraY;

    if (eff.type === 'whip_lash') {
      // Golden Radiant Whip Arc
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      const ctrlX = (startX + targetX) / 2 + Math.sin(progress * Math.PI) * 16;
      const ctrlY = (startY + targetY) / 2 - Math.cos(progress * Math.PI) * 16;
      ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
      ctx.stroke();

      // Whip tip spark flash
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (eff.type === 'aether_beam') {
      // Sage Arcane Cyan Beam
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // White inner core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // Target impact burst
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (eff.type === 'cinder_burst') {
      // Avenger Cinder Brand Explosion
      ctx.save();
      const radius = Math.max(0.1, 6 + progress * 14);
      const alpha = Math.max(0, 1 - progress);
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.beginPath();
      ctx.arc(targetX, targetY, Math.max(0.1, radius * 0.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (eff.type === 'gale_blast') {
      // Sage Aether Gale Shockwave
      ctx.save();
      const radius = Math.max(0.1, 4 + progress * 16);
      ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 1 - progress)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (eff.type === 'spawn_puff') {
      // White/gray expanding dust cloud for ~300ms on newly spawned monster tile
      ctx.save();
      const alpha = Math.max(0, 1 - progress);
      const radius = Math.max(0.1, 5 + progress * 12);
      const puffOffsets = [
        { x: 0, y: 0, r: Math.max(0.1, radius) },
        { x: -6 * progress, y: -4 * progress, r: Math.max(0.1, radius * 0.75) },
        { x: 6 * progress, y: -3 * progress, r: Math.max(0.1, radius * 0.75) },
        { x: -4 * progress, y: 5 * progress, r: Math.max(0.1, radius * 0.65) },
        { x: 5 * progress, y: 4 * progress, r: Math.max(0.1, radius * 0.65) },
      ];
      for (const off of puffOffsets) {
        ctx.fillStyle = `rgba(203, 213, 225, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(startX + off.x, startY + off.y, Math.max(0.1, off.r), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(241, 245, 249, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(startX + off.x, startY + off.y, Math.max(0.1, off.r * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (eff.type === 'spore_shot') {
      // Toxic Spore Projectile fired by Spore Spitter
      ctx.save();
      const currX = startX + (targetX - startX) * progress;
      const currY = startY + (targetY - startY) * progress;

      // Outer toxic glow
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(currX, currY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Slime core
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(currX, currY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Trailing spore flecks
      for (let i = 1; i <= 3; i++) {
        const tProgress = Math.max(0, progress - i * 0.08);
        const tx = startX + (targetX - startX) * tProgress;
        const ty = startY + (targetY - startY) * tProgress;
        ctx.fillStyle = `rgba(132, 204, 22, ${Math.max(0, 0.7 - i * 0.2)})`;
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(0.1, 2 - i * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (eff.type === 'level_up_nova') {
      // Golden Nova / Expanding Circular Ring on Level Up lasting ~600ms
      ctx.save();
      const radius = Math.max(0.1, 6 + progress * 34); // expands from 6px to ~40px
      const alpha = Math.max(0, 1 - progress);

      // 1. Soft radiant core glow
      const coreGrad = ctx.createRadialGradient(startX, startY, 0, startX, startY, radius);
      coreGrad.addColorStop(0, `rgba(254, 240, 138, ${alpha * 0.45})`);
      coreGrad.addColorStop(0.6, `rgba(245, 158, 11, ${alpha * 0.2})`);
      coreGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Primary golden glowing shockwave ring
      ctx.strokeStyle = `rgba(250, 204, 21, ${alpha * 0.95})`;
      ctx.lineWidth = Math.max(1, 3.5 - progress * 2);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Secondary bright white-gold inner shimmer ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(startX, startY, Math.max(0.1, radius * 0.7), 0, Math.PI * 2);
      ctx.stroke();

      // 4. Radiating 8-point golden light sparkles spinning outward
      const sparkDist = radius * 1.05;
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + progress * 1.5;
        const sx = startX + Math.cos(angle) * sparkDist;
        const sy = startY + Math.sin(angle) * sparkDist;
        const sparkSize = Math.max(0.1, 2.5 * (1 - progress * 0.6));
        ctx.beginPath();
        ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    } else if (eff.type === 'block_spark') {
      // Blue/gray/silver metallic spark & deflection shield ring
      ctx.save();
      const radius = Math.max(0.1, 4 + progress * 14); // expands 4px to 18px
      const alpha = Math.max(0, 1 - progress);

      // Outer bright cyan/white deflection ring
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner silver spark
      ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
      ctx.beginPath();
      ctx.arc(startX, startY, Math.max(0.1, radius * 0.4), 0, Math.PI * 2);
      ctx.fill();

      // 4 metallic glint spark points
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const dist = radius * 0.9;
        ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(startX + Math.cos(ang) * dist, startY + Math.sin(ang) * dist, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

/**
 * Draws floating damage and healing numbers.
 */
function drawFloatingCombatTexts(
  ctx: CanvasRenderingContext2D,
  texts: FloatingText[],
  cameraX: number,
  cameraY: number,
  timeMs: number
) {
  ctx.save();
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';

  for (const item of texts) {
    const rawElapsed = timeMs - item.startTime;
    if (rawElapsed < 0 || rawElapsed > item.durationMs) continue;

    const progress = Math.max(0, Math.min(1, rawElapsed / (item.durationMs || 1)));
    const floatY = item.y - cameraY - progress * 22; // float up 22px
    const screenX = item.x - cameraX;

    // Fade out near end
    const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1.0;
    ctx.globalAlpha = Math.max(0, alpha);

    // Crisp black outline for high readability on any background
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(item.text, screenX, floatY);

    // Text color fill
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, screenX, floatY);
  }

  ctx.restore();
}

/**
 * Draws a lootable corpse entity on the ground with monster-specific remains
 * and a pulsing gold sparkle if it contains unlooted items.
 */
function drawCorpseEntity(
  ctx: CanvasRenderingContext2D,
  corpse: CorpseEntity,
  screenX: number,
  screenY: number,
  timeMs: number
) {
  const archetype = corpse.archetype || 'giant_rat';
  ctx.save();

  if (archetype === 'clockwork_drone') {
    // Soot & scorched oil
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 23, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dented bronze body plate
    ctx.fillStyle = '#784c19';
    ctx.fillRect(screenX + 10, screenY + 18, 12, 7);
    ctx.fillStyle = '#9d6526';
    ctx.fillRect(screenX + 12, screenY + 17, 8, 4);

    // Cracked brass gears
    ctx.fillStyle = '#d97706';
    ctx.fillRect(screenX + 7, screenY + 20, 5, 4);
    ctx.fillRect(screenX + 20, screenY + 19, 4, 5);

    // Shattered cyan glass optic fragment
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(screenX + 15, screenY + 19, 2, 2);
  } else if (archetype === 'spore_spitter') {
    // Toxic slime puddle
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 23, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wilted green stalk
    ctx.fillStyle = '#22421d';
    ctx.fillRect(screenX + 8, screenY + 22, 11, 4);

    // Deflated purple fungal cap
    ctx.fillStyle = '#6b21a8';
    ctx.fillRect(screenX + 14, screenY + 18, 9, 5);
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(screenX + 16, screenY + 17, 5, 3);
  } else if (archetype === 'bramble_hound') {
    // Crimson blood pool
    ctx.fillStyle = '#3f0606';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 23, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slumped briar body
    ctx.fillStyle = '#1a2217';
    ctx.fillRect(screenX + 9, screenY + 18, 14, 7);
    ctx.fillStyle = '#283323';
    ctx.fillRect(screenX + 11, screenY + 17, 9, 5);

    // Wooden thorns
    ctx.fillStyle = '#5c4323';
    ctx.fillRect(screenX + 13, screenY + 15, 2, 3);
    ctx.fillRect(screenX + 17, screenY + 15, 2, 3);
  } else {
    // Giant Rat remains
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 22, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#261c16';
    ctx.fillRect(screenX + 10, screenY + 19, 11, 6);
    ctx.fillStyle = '#3a2b22';
    ctx.fillRect(screenX + 12, screenY + 18, 7, 4);

    ctx.strokeStyle = '#9f6f60';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX + 10, screenY + 22);
    ctx.lineTo(screenX + 5, screenY + 24);
    ctx.stroke();
  }

  // Pulsating golden loot glint sparkle if corpse holds items!
  if (corpse.items && corpse.items.length > 0) {
    const pulse = (Math.sin(timeMs / 180) + 1) * 0.5; // 0 to 1
    const sparkleX = screenX + 16;
    const sparkleY = screenY + 12;

    // Soft golden halo
    ctx.fillStyle = `rgba(245, 158, 11, ${0.25 + pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 4 + pulse * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4-point gold star glint
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sparkleX - 1, sparkleY - 3, 2, 6);
    ctx.fillRect(sparkleX - 3, sparkleY - 1, 6, 2);

    // Bright white center dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sparkleX, sparkleY, 1, 1);
  }

  ctx.restore();
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
  monsters = [],
  corpses = [],
  targetId = null,
  visualEffects = [],
  floatingTexts = [],
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

  // 3. Render Monster Corpses & Loot Containers on the floor
  for (const corpse of corpses) {
    const screenX = Math.round(corpse.gridX * TILE_SIZE - cameraX);
    const screenY = Math.round(corpse.gridY * TILE_SIZE - cameraY);
    // Viewport cull check
    if (
      screenX >= -TILE_SIZE &&
      screenX <= CANVAS_WIDTH &&
      screenY >= -TILE_SIZE &&
      screenY <= CANVAS_HEIGHT
    ) {
      drawCorpseEntity(ctx, corpse, screenX, screenY, timeMs);
    }
  }

  // 4. Render Target Reticle under or around targeted entity
  if (targetId) {
    const targetMonster = monsters.find((m) => m.id === targetId && m.isAlive);
    if (targetMonster) {
      const reticleX = Math.round(targetMonster.renderX - cameraX);
      const reticleY = Math.round(targetMonster.renderY - cameraY);
      drawTargetReticle(ctx, reticleX, reticleY, timeMs);
    }
  }

  // 5. Render Living Monsters
  for (const monster of monsters) {
    if (monster.isAlive) {
      const screenX = Math.round(monster.renderX - cameraX);
      const screenY = Math.round(monster.renderY - cameraY);
      const isTargeted = monster.id === targetId;
      drawMonster(ctx, monster, screenX, screenY, isTargeted, timeMs);
    }
  }

  // 6. Render Player Entity
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

  // 7. Render Visual Spell and Weapon Effects
  if (visualEffects.length > 0) {
    drawVisualEffects(ctx, visualEffects, cameraX, cameraY, timeMs);
  }

  // 8. Render Floating Combat Damage / Heal Numbers
  if (floatingTexts.length > 0) {
    drawFloatingCombatTexts(ctx, floatingTexts, cameraX, cameraY, timeMs);
  }

  // 9. Subtle Vignette Border around canvas for retro atmospheric depth
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_HEIGHT * 0.45,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_WIDTH * 0.75
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(11, 13, 18, 0.35)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
