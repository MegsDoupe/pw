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
 * Renders a Giant Rat (alive with HP bar & status, or dead corpse).
 */
function drawMonster(
  ctx: CanvasRenderingContext2D,
  monster: Monster,
  screenX: number,
  screenY: number,
  isTargeted: boolean,
  timeMs: number
) {
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

    // Blood stain on ground
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.ellipse(screenX + 16, screenY + 22, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curled rat remains
    ctx.fillStyle = '#261c16';
    ctx.fillRect(screenX + 10, screenY + 19, 11, 6);
    ctx.fillStyle = '#3a2b22';
    ctx.fillRect(screenX + 12, screenY + 18, 7, 4);

    // Bone fragments
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(screenX + 14, screenY + 20, 2, 2);
    ctx.fillRect(screenX + 18, screenY + 21, 2, 2);

    // Limp tail
    ctx.strokeStyle = '#9f6f60';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX + 10, screenY + 22);
    ctx.lineTo(screenX + 5, screenY + 24);
    ctx.stroke();

    ctx.restore();
    return;
  }

  // === LIVING GIANT RAT ===
  const walkBob = monster.isMoving ? Math.sin((timeMs / 80) * Math.PI) * 1.5 : 0;
  const drawY = screenY + walkBob;

  // 1. Cast shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(screenX + 16, screenY + 26, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Long curving pink rat tail
  const tailSway = Math.sin(timeMs / 120) * 2;
  ctx.strokeStyle = '#d48b78';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(screenX + 8, drawY + 19);
  ctx.quadraticCurveTo(screenX + 3 + tailSway, drawY + 16, screenX + 1 + tailSway, drawY + 22);
  ctx.stroke();

  // 3. Rat Body
  // Main torso
  ctx.fillStyle = '#3d2e24';
  ctx.fillRect(screenX + 8, drawY + 15, 13, 8);
  // Darker back fur
  ctx.fillStyle = '#281d16';
  ctx.fillRect(screenX + 9, drawY + 14, 10, 4);
  // Underbelly
  ctx.fillStyle = '#5a4638';
  ctx.fillRect(screenX + 10, drawY + 21, 9, 2);

  // 4. Rat Head & Snout (facing right/down)
  ctx.fillStyle = '#47362b';
  ctx.fillRect(screenX + 19, drawY + 16, 6, 6);
  // Pointed snout & pink nose
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(screenX + 25, drawY + 19, 2, 2);

  // 5. Glowing Red Eye
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(screenX + 22, drawY + 16, 2, 2);
  ctx.fillStyle = '#fca5a5';
  ctx.fillRect(screenX + 22, drawY + 16, 1, 1);

  // 6. Whiskers
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(screenX + 24, drawY + 18);
  ctx.lineTo(screenX + 28, drawY + 16);
  ctx.moveTo(screenX + 24, drawY + 20);
  ctx.lineTo(screenX + 28, drawY + 22);
  ctx.stroke();

  // 7. Small Paws
  ctx.fillStyle = '#b07062';
  ctx.fillRect(screenX + 10, drawY + 23, 3, 2);
  ctx.fillRect(screenX + 17, drawY + 23, 3, 2);

  // 8. Status Effects Overlays
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
    const starY = drawY + 6 + Math.sin(starAngle) * 3;
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(starX, starY, 3, 3);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(starX + 1, starY + 1, 1, 1);
  }

  // 9. Floating Mini Health Bar (Green / Red)
  const barW = 18;
  const barH = 3;
  const barX = screenX + 7;
  const barY = drawY + 5;

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
 * Draws active spell and projectile visuals.
 */
function drawVisualEffects(
  ctx: CanvasRenderingContext2D,
  effects: VisualEffect[],
  cameraX: number,
  cameraY: number,
  timeMs: number
) {
  for (const eff of effects) {
    const elapsed = timeMs - eff.startTime;
    if (elapsed > eff.durationMs) continue;

    const progress = elapsed / eff.durationMs;
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
      const radius = 6 + progress * 14;
      const alpha = 1 - progress;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (eff.type === 'gale_blast') {
      // Sage Aether Gale Shockwave
      ctx.save();
      const radius = 4 + progress * 16;
      ctx.strokeStyle = `rgba(56, 189, 248, ${1 - progress})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (eff.type === 'level_up_nova') {
      // Golden Nova / Expanding Circular Ring on Level Up lasting ~600ms
      ctx.save();
      const radius = 6 + progress * 34; // expands from 6px to ~40px
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
      ctx.arc(startX, startY, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Radiating 8-point golden light sparkles spinning outward
      const sparkDist = radius * 1.05;
      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + progress * 1.5;
        const sx = startX + Math.cos(angle) * sparkDist;
        const sy = startY + Math.sin(angle) * sparkDist;
        const sparkSize = Math.max(1, 2.5 * (1 - progress * 0.6));
        ctx.beginPath();
        ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
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
    const elapsed = timeMs - item.startTime;
    if (elapsed > item.durationMs) continue;

    const progress = elapsed / item.durationMs;
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

  // 3. Render Monster Corpses on the floor
  for (const monster of monsters) {
    if (!monster.isAlive) {
      const screenX = Math.round(monster.renderX - cameraX);
      const screenY = Math.round(monster.renderY - cameraY);
      drawMonster(ctx, monster, screenX, screenY, false, timeMs);
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
