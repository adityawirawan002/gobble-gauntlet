// Studio-quality storybook autumn 2D Canvas renderer for Gobble Gauntlet.

import {
  MODES,
  PALETTES,
  SCREENS,
  STAGES,
  TURKEY_TUNING,
  UI_RECTS,
  VIEW,
} from './constants.js';
import { computeFarmerVisionCone, FARMER_STATES } from './farmer-ai.js';

function roundRect(ctx, x, y, w, h, r = 10) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawPlaque(ctx, x, y, w, h, fill = PALETTES.parchment, border = PALETTES.ink, radius = 12) {
  ctx.save();
  ctx.fillStyle = 'rgba(22, 10, 5, 0.38)';
  roundRect(ctx, x + 3, y + 5, w, h, radius);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = border;
  ctx.stroke();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = 'rgba(255, 245, 220, 0.45)';
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, Math.max(4, radius - 3));
  ctx.stroke();
  ctx.restore();
}

function drawButton(ctx, rect, label, sublabel, hovered, primary = true) {
  const lift = hovered ? -2 : 0;
  const x = rect.x;
  const y = rect.y + lift;
  const { w, h } = rect;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 9, 4, 0.55)';
  roundRect(ctx, x + 3, y + 6, w, h, 14);
  ctx.fill();

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (primary) {
    grad.addColorStop(0, hovered ? '#F54B3D' : '#DC3522');
    grad.addColorStop(1, hovered ? '#B82318' : '#9E1C13');
  } else {
    grad.addColorStop(0, hovered ? '#F9CA5A' : '#E7A93B');
    grad.addColorStop(1, hovered ? '#CC7A1C' : '#B56717');
  }
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = PALETTES.ink;
  ctx.stroke();

  // Inner highlight bevel.
  ctx.strokeStyle = primary ? 'rgba(255, 226, 175, 0.55)' : 'rgba(255, 248, 220, 0.65)';
  ctx.lineWidth = 1.8;
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 10);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = primary ? '#FFF8E7' : '#26120A';
  ctx.font = sublabel
    ? '900 22px "Georgia", "Trebuchet MS", serif'
    : '900 24px "Georgia", "Trebuchet MS", serif';
  if (primary) {
    ctx.shadowColor = 'rgba(30, 10, 4, 0.65)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillText(label, x + w * 0.5, y + (sublabel ? h * 0.4 : h * 0.52));
  if (sublabel) {
    ctx.shadowOffsetY = 0;
    ctx.font = '700 12px "Trebuchet MS", sans-serif';
    ctx.fillStyle = primary ? '#FFE3B0' : '#4A2411';
    ctx.fillText(sublabel, x + w * 0.5, y + h * 0.74);
  }
  ctx.restore();
}

export function drawAutumnBackdrop(ctx, state) {
  const { stage, cameraX, elapsed, titleTime } = state;
  const t = state.screen === SCREENS.TITLE ? titleTime : elapsed;

  if (stage.key === 'farmyard') {
    drawFarmyardBackdrop(ctx, cameraX, t);
  } else if (stage.key === 'smokehouse') {
    drawSmokehouseBackdrop(ctx, cameraX, t);
  } else {
    drawKitchenBackdrop(ctx, cameraX, t);
  }
}

function drawFarmyardBackdrop(ctx, camX, t) {
  // Warm golden harvest sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  sky.addColorStop(0, '#9A3412');
  sky.addColorStop(0.36, '#DF6A23');
  sky.addColorStop(0.74, '#F5B547');
  sky.addColorStop(1, '#FCE7A2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.groundY);

  // Glowing harvest sun + soft atmospheric halo.
  const sunX = 960 - (camX * 0.05) % 240;
  const sunY = 172;
  const halo = ctx.createRadialGradient(sunX, sunY, 26, sunX, sunY, 250);
  halo.addColorStop(0, 'rgba(255, 250, 210, 0.96)');
  halo.addColorStop(0.28, 'rgba(255, 224, 130, 0.55)');
  halo.addColorStop(1, 'rgba(255, 165, 50, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF9DB';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 54, 0, Math.PI * 2);
  ctx.fill();

  // Warm harvest clouds.
  ctx.fillStyle = 'rgba(255, 240, 200, 0.42)';
  for (let i = 0; i < 6; i += 1) {
    const cx = ((i * 290 - camX * 0.08 + t * 8) % (VIEW.width + 260)) - 130;
    const cy = 96 + (i % 3) * 44;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 72, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 38, cy - 10, 48, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 40, cy + 4, 42, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far rolling autumn hills.
  ctx.fillStyle = '#B8531E';
  ctx.beginPath();
  ctx.moveTo(0, VIEW.groundY);
  for (let x = 0; x <= VIEW.width + 60; x += 40) {
    const h = 155 + Math.sin((x + camX * 0.16) * 0.0052) * 44 + Math.cos((x + camX * 0.16) * 0.011) * 18;
    ctx.lineTo(x, VIEW.groundY - h);
  }
  ctx.lineTo(VIEW.width, VIEW.groundY);
  ctx.closePath();
  ctx.fill();

  // Midground burnt-amber hills + autumn maples.
  ctx.fillStyle = '#8C3B14';
  ctx.beginPath();
  ctx.moveTo(0, VIEW.groundY);
  for (let x = 0; x <= VIEW.width + 60; x += 32) {
    const h = 95 + Math.sin((x + camX * 0.28 + 140) * 0.0068) * 32;
    ctx.lineTo(x, VIEW.groundY - h);
  }
  ctx.lineTo(VIEW.width, VIEW.groundY);
  ctx.closePath();
  ctx.fill();

  // Iconic Red Gambrel Barn & Grain Silo in parallax midground.
  const barnParallax = 0.42;
  for (let b = 0; b < 3; b += 1) {
    const bx = 135 + b * 1060 - camX * barnParallax;
    if (bx < -360 || bx > VIEW.width + 180) continue;
    drawRedBarn(ctx, bx, VIEW.groundY - 46);
  }

  // Autumn maple trees silhouetted along the pasture.
  for (let i = 0; i < 8; i += 1) {
    const tx = ((i * 235 + 480 - camX * 0.34) % (VIEW.width + 260) + (VIEW.width + 260)) % (VIEW.width + 260) - 130;
    const baseY = VIEW.groundY - 56;
    ctx.fillStyle = '#4B2412';
    ctx.fillRect(tx - 6, baseY - 54, 12, 62);
    ctx.fillStyle = i % 2 === 0 ? '#D9480F' : '#E87A14';
    ctx.beginPath();
    ctx.arc(tx, baseY - 68, 34, 0, Math.PI * 2);
    ctx.arc(tx - 24, baseY - 52, 24, 0, Math.PI * 2);
    ctx.arc(tx + 24, baseY - 50, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Swaying golden cornfield strip behind the split-rail fence.
  const cornShift = (camX * 0.62) % 36;
  ctx.strokeStyle = '#C98A1C';
  ctx.lineWidth = 4;
  for (let x = -cornShift; x < VIEW.width + 36; x += 36) {
    const sway = Math.sin(t * 2.5 + x * 0.04) * 5;
    ctx.beginPath();
    ctx.moveTo(x, VIEW.groundY - 12);
    ctx.quadraticCurveTo(x + sway * 0.5, VIEW.groundY - 58, x + sway, VIEW.groundY - 96);
    ctx.stroke();
    ctx.fillStyle = '#F2C14E';
    ctx.beginPath();
    ctx.ellipse(x + sway * 0.7 + 4, VIEW.groundY - 66, 5, 11, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rustic wooden split-rail fence.
  const fenceOffset = (camX * 0.78) % 120;
  ctx.fillStyle = '#6C3D1E';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2;
  ctx.fillRect(0, VIEW.groundY - 46, VIEW.width, 9);
  ctx.strokeRect(0, VIEW.groundY - 46, VIEW.width, 9);
  ctx.fillRect(0, VIEW.groundY - 24, VIEW.width, 9);
  ctx.strokeRect(0, VIEW.groundY - 24, VIEW.width, 9);
  for (let x = -fenceOffset; x < VIEW.width + 120; x += 120) {
    ctx.fillStyle = '#5C3116';
    ctx.fillRect(x, VIEW.groundY - 62, 14, 62);
    ctx.strokeRect(x, VIEW.groundY - 62, 14, 62);
  }

  // Rich autumn dirt road + grassy border.
  ctx.fillStyle = '#5E7A26';
  ctx.fillRect(0, VIEW.groundY - 8, VIEW.width, 14);
  const dirt = ctx.createLinearGradient(0, VIEW.groundY, 0, VIEW.height);
  dirt.addColorStop(0, '#7F4A24');
  dirt.addColorStop(0.28, '#5E3217');
  dirt.addColorStop(1, '#361A0C');
  ctx.fillStyle = dirt;
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.groundY);
  ctx.lineTo(VIEW.width, VIEW.groundY);
  ctx.stroke();

  // Scrolling pebbles & fallen leaves on the ground.
  const groundOffset = camX % 96;
  for (let x = -groundOffset; x < VIEW.width + 96; x += 96) {
    ctx.fillStyle = 'rgba(255, 224, 150, 0.14)';
    ctx.beginPath();
    ctx.ellipse(x + 28, VIEW.groundY + 26, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D95D1E';
    ctx.beginPath();
    ctx.ellipse(x + 68, VIEW.groundY + 18, 8, 4, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRedBarn(ctx, x, baseY) {
  ctx.save();
  // Cylindrical grain silo behind barn right side.
  ctx.fillStyle = '#E6D6BC';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.fillRect(x + 195, baseY - 196, 56, 196);
  ctx.strokeRect(x + 195, baseY - 196, 56, 196);
  ctx.fillStyle = '#9E2A2B';
  ctx.beginPath();
  ctx.arc(x + 223, baseY - 196, 28, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (let y = baseY - 165; y < baseY; y += 30) {
    ctx.strokeStyle = 'rgba(38, 20, 13, 0.35)';
    ctx.beginPath();
    ctx.moveTo(x + 195, y);
    ctx.lineTo(x + 251, y);
    ctx.stroke();
  }

  // Gambrel barn body.
  ctx.fillStyle = '#B22422';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - 116);
  ctx.lineTo(x + 34, baseY - 178);
  ctx.lineTo(x + 104, baseY - 210);
  ctx.lineTo(x + 174, baseY - 178);
  ctx.lineTo(x + 208, baseY - 116);
  ctx.lineTo(x + 208, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Timber roof trim.
  ctx.strokeStyle = '#F7EAD2';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x - 6, baseY - 114);
  ctx.lineTo(x + 34, baseY - 180);
  ctx.lineTo(x + 104, baseY - 213);
  ctx.lineTo(x + 174, baseY - 180);
  ctx.lineTo(x + 214, baseY - 114);
  ctx.stroke();

  // Warm glowing hayloft window.
  ctx.fillStyle = '#FFE08A';
  ctx.strokeStyle = '#F7EAD2';
  ctx.lineWidth = 3;
  ctx.fillRect(x + 84, baseY - 164, 40, 34);
  ctx.strokeRect(x + 84, baseY - 164, 40, 34);

  // Double X-braced white-trimmed barn doors.
  ctx.fillStyle = '#8F1B19';
  ctx.fillRect(x + 62, baseY - 94, 84, 94);
  ctx.strokeStyle = '#F7EAD2';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 62, baseY - 94, 84, 94);
  ctx.beginPath();
  ctx.moveTo(x + 104, baseY - 94);
  ctx.lineTo(x + 104, baseY);
  ctx.moveTo(x + 62, baseY - 94);
  ctx.lineTo(x + 104, baseY);
  ctx.moveTo(x + 104, baseY - 94);
  ctx.lineTo(x + 62, baseY);
  ctx.moveTo(x + 104, baseY - 94);
  ctx.lineTo(x + 146, baseY);
  ctx.moveTo(x + 146, baseY - 94);
  ctx.lineTo(x + 104, baseY);
  ctx.stroke();
  ctx.restore();
}

function drawSmokehouseBackdrop(ctx, camX, t) {
  // Warm lantern-lit timber & brick cellar interior.
  const bg = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  bg.addColorStop(0, '#2B160E');
  bg.addColorStop(0.55, '#4A2515');
  bg.addColorStop(1, '#66341C');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.groundY);

  // Repeating brick arches & cider barrels.
  const archShift = (camX * 0.55) % 280;
  for (let x = -archShift; x < VIEW.width + 280; x += 280) {
    ctx.fillStyle = '#24110B';
    ctx.beginPath();
    ctx.arc(x + 140, 310, 86, Math.PI, 0);
    ctx.lineTo(x + 226, VIEW.groundY);
    ctx.lineTo(x + 54, VIEW.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7F3F20';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Hanging glowing brass lantern inside each arch.
    const swing = Math.sin(t * 2.1 + x * 0.02) * 6;
    const lx = x + 140 + swing;
    const ly = 216;
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 140, 130);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    const glow = ctx.createRadialGradient(lx, ly + 12, 8, lx, ly + 12, 155);
    glow.addColorStop(0, 'rgba(255, 220, 125, 0.52)');
    glow.addColorStop(1, 'rgba(255, 135, 30, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly + 12, 155, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFE066';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.5;
    roundRect(ctx, lx - 11, ly, 22, 26, 6);
    ctx.fill();
    ctx.stroke();

    // Cider barrel sitting in the cellar alcove.
    ctx.fillStyle = '#733B1D';
    roundRect(ctx, x + 76, VIEW.groundY - 92, 58, 92, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3B2820';
    ctx.fillRect(x + 76, VIEW.groundY - 70, 58, 7);
    ctx.fillRect(x + 76, VIEW.groundY - 26, 58, 7);
  }

  // Timber ceiling rafters.
  ctx.fillStyle = '#381B0F';
  ctx.fillRect(0, 0, VIEW.width, 96);
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.lineTo(VIEW.width, 96);
  ctx.stroke();

  // Cobblestone smokehouse floor.
  ctx.fillStyle = '#4A362C';
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  const stoneOff = camX % 84;
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.5;
  for (let row = 0; row < 3; row += 1) {
    for (let x = -stoneOff - row * 34; x < VIEW.width + 84; x += 84) {
      ctx.fillStyle = (row + Math.floor(x / 84)) % 2 === 0 ? '#5C4438' : '#4E392F';
      roundRect(ctx, x + 2, VIEW.groundY + 4 + row * 36, 78, 30, 7);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawKitchenBackdrop(ctx, camX, t) {
  // Warm cream & terracotta tiled Thanksgiving kitchen walls!
  const wall = ctx.createLinearGradient(0, 0, 0, VIEW.groundY);
  wall.addColorStop(0, '#F5E1BE');
  wall.addColorStop(0.65, '#E4C08E');
  wall.addColorStop(1, '#CC9B64');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW.width, VIEW.groundY);

  // Subtle cream & copper backsplash diamond tiles.
  const tileOff = (camX * 0.65) % 64;
  ctx.strokeStyle = 'rgba(130, 68, 28, 0.22)';
  ctx.lineWidth = 1.5;
  for (let y = 110; y < VIEW.groundY - 120; y += 64) {
    for (let x = -tileOff; x < VIEW.width + 64; x += 64) {
      ctx.fillStyle = (Math.floor((x + tileOff) / 64) + Math.floor(y / 64)) % 2 === 0
        ? 'rgba(255, 248, 232, 0.42)'
        : 'rgba(217, 123, 58, 0.16)';
      ctx.fillRect(x, y, 64, 64);
      ctx.strokeRect(x, y, 64, 64);
    }
  }

  // Dark walnut kitchen wainscot & butcher-block background counters.
  const counterOff = (camX * 0.65) % 420;
  ctx.fillStyle = '#5C2F18';
  ctx.fillRect(0, VIEW.groundY - 118, VIEW.width, 118);
  ctx.fillStyle = '#C98A4B';
  ctx.fillRect(0, VIEW.groundY - 128, VIEW.width, 16);
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(-4, VIEW.groundY - 128, VIEW.width + 8, 16);

  for (let x = -counterOff; x < VIEW.width + 420; x += 420) {
    // Cabinet doors.
    ctx.strokeStyle = '#3B1B0D';
    ctx.lineWidth = 3;
    roundRect(ctx, x + 28, VIEW.groundY - 98, 112, 82, 6);
    ctx.stroke();
    roundRect(ctx, x + 162, VIEW.groundY - 98, 112, 82, 6);
    ctx.stroke();
    ctx.fillStyle = '#F4B43A';
    ctx.beginPath();
    ctx.arc(x + 126, VIEW.groundY - 58, 5, 0, Math.PI * 2);
    ctx.arc(x + 176, VIEW.groundY - 58, 5, 0, Math.PI * 2);
    ctx.fill();

    // Steaming pumpkin pie cooling on the butcher block!
    ctx.fillStyle = '#D9822B';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x + 335, VIEW.groundY - 134, 34, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E6B87A';
    ctx.beginPath();
    ctx.moveTo(x + 305, VIEW.groundY - 132);
    ctx.lineTo(x + 313, VIEW.groundY - 120);
    ctx.lineTo(x + 357, VIEW.groundY - 120);
    ctx.lineTo(x + 365, VIEW.groundY - 132);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Upper wooden spice shelf with jars.
    ctx.fillStyle = '#6E381A';
    ctx.fillRect(x + 36, 178, 198, 14);
    ctx.strokeRect(x + 36, 178, 198, 14);
    const jarColors = ['#C92A2A', '#E67700', '#2B8A5B', '#F4B43A'];
    jarColors.forEach((col, idx) => {
      ctx.fillStyle = col;
      roundRect(ctx, x + 52 + idx * 44, 146, 26, 32, 5);
      ctx.fill();
      ctx.stroke();
    });
  }

  // Overhead iron rack with hanging gleaming copper pots & pans!
  ctx.fillStyle = '#301A12';
  ctx.fillRect(0, 96, VIEW.width, 10);
  const rackOff = (camX * 0.72) % 260;
  for (let x = -rackOff; x < VIEW.width + 260; x += 260) {
    const sway = Math.sin(t * 2 + x * 0.01) * 3;
    // Skillet.
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 70, 106);
    ctx.lineTo(x + 70 + sway, 152);
    ctx.stroke();
    const panGrad = ctx.createRadialGradient(x + 62 + sway, 174, 4, x + 70 + sway, 180, 32);
    panGrad.addColorStop(0, '#FFD4A3');
    panGrad.addColorStop(0.55, '#D97B3A');
    panGrad.addColorStop(1, '#7D3A17');
    ctx.fillStyle = panGrad;
    ctx.beginPath();
    ctx.arc(x + 70 + sway, 180, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hanging copper saucepan.
    ctx.beginPath();
    ctx.moveTo(x + 190, 106);
    ctx.lineTo(x + 190 - sway, 144);
    ctx.stroke();
    ctx.fillStyle = '#C76A2D';
    roundRect(ctx, x + 162 - sway, 144, 56, 36, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 232, 200, 0.45)';
    ctx.fillRect(x + 170 - sway, 150, 10, 22);
  }

  // Terracotta & cream checkerboard kitchen floor!
  const floorOff = camX % 96;
  for (let row = 0; row < 3; row += 1) {
    for (let x = -floorOff; x < VIEW.width + 96; x += 96) {
      const idx = Math.floor((x + floorOff) / 96);
      ctx.fillStyle = (idx + row) % 2 === 0 ? '#D99E66' : '#8C3E23';
      ctx.fillRect(x, VIEW.groundY + row * 42, 96, 42);
      ctx.strokeStyle = 'rgba(36, 18, 10, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, VIEW.groundY + row * 42, 96, 42);
    }
  }
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.groundY);
  ctx.lineTo(VIEW.width, VIEW.groundY);
  ctx.stroke();
}

export function drawStageExit(ctx, exit, stage, t) {
  const { x, y, w, h } = exit;
  ctx.save();
  if (exit.kind === 'window') {
    // Sunlit OPEN ESCAPE WINDOW in the Thanksgiving Kitchen!
    // Diagonal golden sunlight beams pouring across the kitchen floor!
    const beam = ctx.createLinearGradient(x, y, x - 210, VIEW.groundY);
    beam.addColorStop(0, 'rgba(255, 245, 190, 0.56)');
    beam.addColorStop(0.55, 'rgba(255, 220, 120, 0.24)');
    beam.addColorStop(1, 'rgba(255, 210, 100, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 10);
    ctx.lineTo(x + w - 8, y + 10);
    ctx.lineTo(x - 105, VIEW.groundY);
    ctx.lineTo(x - 245, VIEW.groundY);
    ctx.closePath();
    ctx.fill();

    // Window frame & glowing autumn freedom sky outside.
    const outSky = ctx.createLinearGradient(x, y, x, y + h);
    outSky.addColorStop(0, '#5FA8D3');
    outSky.addColorStop(0.58, '#F6C25B');
    outSky.addColorStop(1, '#FCE7A2');
    ctx.fillStyle = outSky;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFF5DC';
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = PALETTES.ink;
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 12);
    ctx.stroke();

    // Distant golden hill & maple tree visible outside the window.
    ctx.save();
    roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 6);
    ctx.clip();
    ctx.fillStyle = '#D96B1C';
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h + 18, 68, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FFF9DB';
    ctx.beginPath();
    ctx.arc(x + w * 0.34, y + 42, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fluttering gingham curtains on sides of open window.
    const flutter = Math.sin(t * 5.2) * 8;
    ctx.fillStyle = '#C92A2A';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 6);
    ctx.quadraticCurveTo(x + 22 + flutter, y + 48, x + 6 + flutter * 0.5, y + h - 8);
    ctx.lineTo(x - 16, y + h - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wooden windowsill.
    ctx.fillStyle = '#7F4420';
    roundRect(ctx, x - 16, y + h - 4, w + 32, 18, 5);
    ctx.fill();
    ctx.stroke();

    // Gleaming animated ESCAPE! beacon plaque above window.
    const bob = Math.sin(t * 5) * 6;
    drawPlaque(ctx, x - 14, y - 58 + bob, w + 28, 40, '#2B8A5B', PALETTES.ink, 10);
    ctx.fillStyle = '#FFF8E7';
    ctx.font = '900 17px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ESCAPE! ↗', x + w * 0.5, y - 38 + bob);
  } else {
    // Rustic Farmyard / Smokehouse Stage Exit Archway.
    ctx.fillStyle = '#592C14';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 3.5;
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    const glow = ctx.createRadialGradient(x + w * 0.5, y + h * 0.55, 8, x + w * 0.5, y + h * 0.55, 84);
    glow.addColorStop(0, '#FFF3BF');
    glow.addColorStop(0.55, '#F59F00');
    glow.addColorStop(1, '#4A200E');
    ctx.fillStyle = glow;
    roundRect(ctx, x + 14, y + 18, w - 28, h - 18, 10);
    ctx.fill();
    ctx.stroke();

    const bob = Math.sin(t * 4.5) * 5;
    drawPlaque(ctx, x - 16, y - 48 + bob, w + 32, 36, '#F4B43A', PALETTES.ink, 10);
    ctx.fillStyle = PALETTES.ink;
    ctx.font = '900 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stage.id === 1 ? 'SMOKEHOUSE →' : 'KITCHEN →', x + w * 0.5, y - 30 + bob);
  }
  ctx.restore();
}

export function drawRoastingOven(ctx, oven, t) {
  const { x, y, w, h, state } = oven;
  ctx.save();

  // Warm heat bloom when telegraphing or erupting!
  if (state === 'erupting' || state === 'telegraph') {
    const pulse = 0.88 + Math.sin(t * 18) * 0.12;
    const rad = state === 'erupting' ? 148 * pulse : 96 * pulse;
    const bloom = ctx.createRadialGradient(x + w * 0.5, y + h * 0.35, 16, x + w * 0.5, y + h * 0.35, rad);
    bloom.addColorStop(0, state === 'erupting' ? 'rgba(255, 224, 102, 0.78)' : 'rgba(255, 169, 77, 0.45)');
    bloom.addColorStop(0.55, state === 'erupting' ? 'rgba(255, 90, 20, 0.42)' : 'rgba(255, 110, 20, 0.14)');
    bloom.addColorStop(1, 'rgba(255, 70, 10, 0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.35, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cast-iron chimney flue pipe.
  ctx.fillStyle = '#3B2F2F';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.fillRect(x + w * 0.68, y - 34, 24, 44);
  ctx.strokeRect(x + w * 0.68, y - 34, 24, 44);
  ctx.fillRect(x + w * 0.63, y - 40, 34, 9);
  ctx.strokeRect(x + w * 0.63, y - 40, 34, 9);

  // Brick dome roasting hearth body.
  ctx.fillStyle = '#9C3D24';
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 46);
  ctx.arc(x + w * 0.5, y + 46, w * 0.5, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Brick mortar courses.
  ctx.strokeStyle = 'rgba(38, 18, 10, 0.45)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    const ry = y + 34 + row * 21;
    ctx.beginPath();
    ctx.moveTo(x + 8, ry);
    ctx.lineTo(x + w - 8, ry);
    ctx.stroke();
  }

  // Stone hearth base ledge.
  ctx.fillStyle = '#6C584C';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  roundRect(ctx, x - 6, y + h - 20, w + 12, 20, 5);
  ctx.fill();
  ctx.stroke();

  // Arched cast-iron firebox opening.
  const mouthX = x + 22;
  const mouthY = y + 44;
  const mouthW = w - 44;
  const mouthH = h - 62;
  const fireGrad = ctx.createLinearGradient(mouthX, mouthY, mouthX, mouthY + mouthH);
  if (state === 'erupting') {
    fireGrad.addColorStop(0, '#FFF9DB');
    fireGrad.addColorStop(0.45, '#FFA94D');
    fireGrad.addColorStop(1, '#E03131');
  } else if (state === 'telegraph') {
    fireGrad.addColorStop(0, '#FFE066');
    fireGrad.addColorStop(0.6, '#FF6B2B');
    fireGrad.addColorStop(1, '#8C1D18');
  } else {
    fireGrad.addColorStop(0, '#D9480F');
    fireGrad.addColorStop(0.6, '#5C1B10');
    fireGrad.addColorStop(1, '#26110C');
  }
  ctx.fillStyle = fireGrad;
  ctx.beginPath();
  ctx.moveTo(mouthX, mouthY + mouthH);
  ctx.lineTo(mouthX, mouthY + 26);
  ctx.arc(mouthX + mouthW * 0.5, mouthY + 26, mouthW * 0.5, Math.PI, 0);
  ctx.lineTo(mouthX + mouthW, mouthY + mouthH);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#2B211E';
  ctx.stroke();

  // Roasting grill bars across lower firebox.
  ctx.strokeStyle = '#24120A';
  ctx.lineWidth = 2.5;
  for (let i = 1; i <= 3; i += 1) {
    const bx = mouthX + (mouthW / 4) * i;
    ctx.beginPath();
    ctx.moveTo(bx, mouthY + mouthH - 18);
    ctx.lineTo(bx, mouthY + mouthH);
    ctx.stroke();
  }

  // Telegraph amber heat warning chevron!
  if (state === 'telegraph') {
    const flash = 0.55 + Math.sin(t * 22) * 0.45;
    ctx.globalAlpha = flash;
    drawPlaque(ctx, x + 12, y - 36, w - 24, 28, '#FF922B', PALETTES.ink, 8);
    ctx.fillStyle = PALETTES.ink;
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▲ ROAST! ▲', x + w * 0.5, y - 22);
    ctx.globalAlpha = 1;
  }

  // Dramatic roaring flame plume when erupting!
  if (state === 'erupting') {
    const flicker = Math.sin(t * 32) * 10;
    // Outer crimson-orange flame tongues.
    const tongues = [
      { ox: -16, h: 78 + flicker, w: 38, col: '#F03E3E' },
      { ox: 18, h: 86 - flicker * 0.7, w: 42, col: '#FF6B2B' },
      { ox: 0, h: 98 + flicker * 0.5, w: 48, col: '#FF922B' },
    ];
    tongues.forEach((fl) => {
      const fx = x + w * 0.5 + fl.ox;
      const fy = y + 36;
      ctx.fillStyle = fl.col;
      ctx.strokeStyle = PALETTES.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx - fl.w * 0.5, fy + 24);
      ctx.quadraticCurveTo(fx - fl.w * 0.55, fy - fl.h * 0.45, fx, fy - fl.h);
      ctx.quadraticCurveTo(fx + fl.w * 0.55, fy - fl.h * 0.45, fx + fl.w * 0.5, fy + 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    // White-gold flame core.
    ctx.fillStyle = '#FFF3BF';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5 - 22, y + 48);
    ctx.quadraticCurveTo(x + w * 0.5 - 16, y - 16, x + w * 0.5, y - 36 + flicker * 0.4);
    ctx.quadraticCurveTo(x + w * 0.5 + 16, y - 16, x + w * 0.5 + 22, y + 48);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawCoverProp(ctx, cover, isNear, isHiddenHere, t) {
  const { x, y, w, h, kind } = cover;
  ctx.save();
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;

  if (kind === 'hay') {
    // Golden stacked farmyard Hay Bale with twine straps & loose straw tufts.
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#F5C445');
    grad.addColorStop(1, '#C4841D');
    ctx.fillStyle = grad;
    roundRect(ctx, x, y + 6, w, h - 6, 10);
    ctx.fill();
    ctx.stroke();

    // Twine bands.
    ctx.strokeStyle = '#5C2C10';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 22, y + 6);
    ctx.lineTo(x + 22, y + h);
    ctx.moveTo(x + w - 22, y + 6);
    ctx.lineTo(x + w - 22, y + h);
    ctx.stroke();

    // Loose straw whiskers.
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 6; i += 1) {
      const sx = x + 10 + i * 15;
      ctx.beginPath();
      ctx.moveTo(sx, y + 14 + (i % 2) * 18);
      ctx.lineTo(sx + 10, y + 8 + (i % 2) * 18);
      ctx.stroke();
    }
  } else if (kind === 'crate') {
    // Slatted wooden Pumpkin Crate overflowing with autumn pumpkins.
    ctx.fillStyle = '#E86A17';
    ctx.beginPath();
    ctx.arc(x + 28, y + 14, 18, 0, Math.PI * 2);
    ctx.arc(x + 64, y + 12, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#8B4F24';
    roundRect(ctx, x, y + 14, w, h - 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#4A2511';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 34);
    ctx.lineTo(x + w - 4, y + 34);
    ctx.moveTo(x + 4, y + 52);
    ctx.lineTo(x + w - 4, y + 52);
    ctx.stroke();
  } else {
    // Gleaming oversized Copper Stockpot in the Kitchen!
    const potGrad = ctx.createLinearGradient(x, y, x + w, y);
    potGrad.addColorStop(0, '#9E481B');
    potGrad.addColorStop(0.32, '#F29F58');
    potGrad.addColorStop(0.55, '#FFD9B3');
    potGrad.addColorStop(0.85, '#C46227');
    potGrad.addColorStop(1, '#783412');
    ctx.fillStyle = potGrad;
    roundRect(ctx, x + 6, y + 10, w - 12, h - 10, 12);
    ctx.fill();
    ctx.stroke();
    // Pot rim & brass side handles.
    ctx.fillStyle = '#E89B54';
    roundRect(ctx, x + 2, y + 4, w - 4, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#F4B43A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 4, y + 32, 9, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w - 4, y + 32, 9, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCoverPrompt(ctx, cover, isHiddenHere, t) {
  const { x, y, w } = cover;
  const bob = Math.sin(t * 6) * 3;
  const pillW = isHiddenHere ? 104 : 92;
  const px = x + (w - pillW) * 0.5;
  const py = y - 44 + bob;
  ctx.save();
  drawPlaque(ctx, px, py, pillW, 26, isHiddenHere ? PALETTES.sageStealth : PALETTES.parchment, PALETTES.ink, 8);
  ctx.fillStyle = isHiddenHere ? '#FFFDF5' : PALETTES.ink;
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isHiddenHere ? 'HIDDEN ✓' : '[E] HIDE', px + pillW * 0.5, py + 13);
  ctx.restore();
}

export function drawBouncePad(ctx, pad) {
  const { x, y, w, h, squash } = pad;
  const sy = 1 - squash * 0.34;
  const sx = 1 + squash * 0.18;
  ctx.save();
  ctx.translate(x + w * 0.5, y + h);
  ctx.scale(sx, sy);

  // Woven basket base.
  ctx.fillStyle = '#B07436';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.44, 0);
  ctx.lineTo(-w * 0.5, -h * 0.68);
  ctx.lineTo(w * 0.5, -h * 0.68);
  ctx.lineTo(w * 0.44, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Mound of glossy ruby cranberries on top!
  for (let i = -2; i <= 2; i += 1) {
    const cx = i * 12;
    const cy = -h * 0.78 - (2 - Math.abs(i)) * 4;
    ctx.fillStyle = '#D62828';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFC9C9';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGravyPuddle(ctx, gravy) {
  const { x, y, w, h, bubblePhase } = gravy;
  ctx.save();
  ctx.fillStyle = '#5C3317';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.65, w * 0.5, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Gloss highlight & bubbling gravy domes.
  ctx.fillStyle = '#8C5328';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.44, y + h * 0.55, w * 0.34, h * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const bx = x + 32 + i * 38;
    const r = 3.5 + Math.abs(Math.sin(bubblePhase + i * 1.4)) * 4.5;
    ctx.fillStyle = '#A8693B';
    ctx.beginPath();
    ctx.arc(bx, y + h * 0.48, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPickup(ctx, p) {
  if (p.collected) return;
  const py = p.y + Math.sin(p.bobPhase) * 6;
  ctx.save();
  ctx.translate(p.x, py);

  // Soft golden/ruby halo.
  const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 26);
  glow.addColorStop(0, p.kind === 'corn' ? 'rgba(255, 228, 100, 0.72)' : 'rgba(255, 100, 100, 0.72)');
  glow.addColorStop(1, 'rgba(255, 200, 50, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.6;
  if (p.kind === 'corn') {
    ctx.rotate(-0.28);
    // Golden corn cob.
    ctx.fillStyle = '#F7C948';
    ctx.beginPath();
    ctx.ellipse(0, -2, 9.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Kernel crisscross accents.
    ctx.strokeStyle = '#C98A1C';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(6, -8);
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(-6, 8);
    ctx.lineTo(6, 8);
    ctx.stroke();
    // Emerald corn husks.
    ctx.fillStyle = '#40914C';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.quadraticCurveTo(-15, 15, -2, 16);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 4);
    ctx.quadraticCurveTo(15, 15, 2, 16);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Wild Cranberry cluster (+1 Life / Bonus).
    const offsets = [[-6, 3], [6, 3], [0, -5]];
    offsets.forEach(([ox, oy]) => {
      ctx.fillStyle = '#E03131';
      ctx.beginPath();
      ctx.arc(ox, oy, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFE3E3';
      ctx.beginPath();
      ctx.arc(ox - 2.5, oy - 2.5, 2.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#2B8A5B';
    ctx.beginPath();
    ctx.ellipse(5, -13, 7, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function drawAcornDecoy(ctx, d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.5;
  ctx.fillStyle = '#B86B27';
  ctx.beginPath();
  ctx.ellipse(0, 3, 9, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#5C2C10';
  ctx.beginPath();
  ctx.arc(0, -2, 10, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(2, -17);
  ctx.stroke();
  ctx.restore();
}

export function drawCarvingKnife(ctx, knife) {
  ctx.save();

  // Bright dashed trajectory telegraph arc for thrown knives!
  if (knife.kind === 'thrown' && knife.age < 0.62 && knife.arcPoints.length > 2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 232, 115, 0.78)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(knife.arcPoints[0].x, knife.arcPoints[0].y);
    for (let i = 1; i < knife.arcPoints.length; i += 1) {
      ctx.lineTo(knife.arcPoints[i].x, knife.arcPoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Steel motion-smear trail.
  for (let i = 0; i < knife.trail.length; i += 1) {
    const tr = knife.trail[i];
    ctx.save();
    ctx.globalAlpha = tr.alpha * 0.35;
    ctx.translate(tr.x, tr.y);
    ctx.rotate(tr.angle);
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.ellipse(6, 0, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main gleaming forged carving knife!
  ctx.translate(knife.x, knife.y);
  ctx.rotate(knife.angle);

  // Subtle danger halo so knives pop instantly at thumbnail scale.
  const halo = ctx.createRadialGradient(4, 0, 4, 4, 0, 38);
  halo.addColorStop(0, 'rgba(255, 240, 170, 0.55)');
  halo.addColorStop(1, 'rgba(240, 62, 62, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(4, 0, 38, 0, Math.PI * 2);
  ctx.fill();

  // Walnut wooden handle with brass rivets.
  ctx.fillStyle = '#6B3416';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.8;
  roundRect(ctx, -31, -6, 22, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F4B43A';
  ctx.beginPath();
  ctx.arc(-24, 0, 2.2, 0, Math.PI * 2);
  ctx.arc(-15, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Brass bolster.
  ctx.fillStyle = '#D99B26';
  ctx.fillRect(-10, -8, 5, 16);
  ctx.strokeRect(-10, -8, 5, 16);

  // Curved gleaming forged-steel carving blade.
  const blade = ctx.createLinearGradient(-5, -10, 34, 8);
  blade.addColorStop(0, '#FFFFFF');
  blade.addColorStop(0.5, '#DCE6F2');
  blade.addColorStop(1, '#94A3B8');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(24, -7);
  ctx.quadraticCurveTo(36, -3, 35, 3);
  ctx.quadraticCurveTo(18, 10, -5, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Razor edge white specular glint.
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, 5);
  ctx.quadraticCurveTo(16, 6, 31, 1);
  ctx.stroke();

  ctx.restore();
}

export function drawTurkeyCharacter(ctx, turkey, t) {
  // Draw dash ghost afterimages first.
  for (let i = 0; i < turkey.afterimages.length; i += 1) {
    const img = turkey.afterimages[i];
    ctx.save();
    ctx.globalAlpha = img.alpha * 0.45;
    ctx.translate(img.x + turkey.w * 0.5, img.y + turkey.h);
    ctx.scale(img.facing, 1);
    ctx.fillStyle = '#F59F00';
    ctx.beginPath();
    ctx.ellipse(-2, -26, 26, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Blink softly when damage invulnerable.
  if (turkey.hitInvuln > 0 && Math.floor(t * 20) % 2 === 0) return;

  const cx = turkey.x + turkey.w * 0.5;
  const bottomY = turkey.y + turkey.h;

  ctx.save();
  ctx.translate(cx, bottomY);

  // Ground contact shadow.
  const heightAbove = Math.max(0, VIEW.groundY - bottomY);
  const shadowScale = Math.max(0.35, 1 - heightAbove / 260);
  ctx.fillStyle = 'rgba(26, 12, 6, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, heightAbove + 2, 26 * shadowScale, 7 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // If tucked inside stealth cover, draw cute peeking eyes + ruffled feather tip!
  if (turkey.hidden) {
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.6;
    ctx.fillStyle = '#FFFDF5';
    ctx.beginPath();
    ctx.arc(-8, -42, 7.5, 0, Math.PI * 2);
    ctx.arc(8, -42, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTES.ink;
    const lookDir = turkey.eyeTargetX >= cx ? 2.5 : -2.5;
    ctx.beginPath();
    ctx.arc(-8 + lookDir, -42, 3, 0, Math.PI * 2);
    ctx.arc(8 + lookDir, -42, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Dash invulnerability aura ring.
  if (turkey.dashIframes > 0) {
    ctx.strokeStyle = '#FFE066';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, -32, 40, 34, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Apply facing + squash/stretch + forward sprint lean.
  const lean = turkey.dashTimer > 0 ? 0.22 : Math.max(-0.12, Math.min(0.12, turkey.vx / 2600));
  ctx.rotate(lean);
  ctx.scale(turkey.facing * turkey.squashX, turkey.squashY);

  const stride = Math.sin(turkey.runCycle);
  const bounce = turkey.grounded ? Math.abs(Math.cos(turkey.runCycle)) * 4 : 0;
  ctx.translate(0, -bounce);

  // 1. Lush 7-plume fanned autumn tail feathers!
  const tailColors = ['#9E1F1B', '#D9480F', '#F08C00', '#F4B43A', '#D9480F', '#9E1F1B', '#7C2D12'];
  const fanSpread = turkey.dashTimer > 0 || !turkey.grounded ? 1.2 : 1;
  ctx.save();
  ctx.translate(-16, -28);
  for (let i = 0; i < 7; i += 1) {
    const ang = (-2.42 + i * 0.25) * fanSpread + Math.sin(t * 9 + i) * 0.04;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = tailColors[i];
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, -19, 7.5, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Cream feather tip band!
    ctx.fillStyle = '#FFF3D1';
    ctx.beginPath();
    ctx.ellipse(0, -34, 5.2, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 2. Comedic pumping orange turkey drumsticks & feet.
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  const drawLeg = (hipX, swing) => {
    const footX = hipX + swing * 14;
    const footY = turkey.grounded ? -2 - Math.max(0, swing) * 9 : -8 + swing * 5;
    ctx.strokeStyle = '#F08C00';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, -14);
    ctx.lineTo(footX, footY);
    ctx.lineTo(footX + 9, footY);
    ctx.stroke();
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  drawLeg(-5, -stride);
  drawLeg(6, stride);

  // 3. Plump chestnut body with warm scalloped breast.
  const bodyGrad = ctx.createRadialGradient(4, -30, 5, 0, -26, 28);
  bodyGrad.addColorStop(0, '#B5602B');
  bodyGrad.addColorStop(0.7, '#7F3A17');
  bodyGrad.addColorStop(1, '#54230D');
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -27, 24, 19, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Warm cream-gold breast plumage highlight.
  ctx.fillStyle = '#E8B376';
  ctx.beginPath();
  ctx.ellipse(11, -24, 10, 12, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // 4. Expressive flapping wing!
  const flapAngle = turkey.fluttering
    ? Math.sin(t * 48) * 0.95 - 0.55
    : !turkey.grounded
      ? -0.48
      : Math.sin(turkey.runCycle) * 0.28;
  ctx.save();
  ctx.translate(-1, -29);
  ctx.rotate(flapAngle);
  ctx.fillStyle = '#6B2F12';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.ellipse(-2, 4, 14, 9, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 5. Expressive neck & head!
  ctx.fillStyle = '#8C401B';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(16, -45, 12, 13, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Bright crimson dangling snood & wattle!
  ctx.fillStyle = '#E03131';
  ctx.beginPath();
  ctx.moveTo(22, -45);
  ctx.quadraticCurveTo(31, -36, 23, -31);
  ctx.quadraticCurveTo(17, -34, 19, -43);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden beak (opens wide to gobble on dash/hit!).
  const mouthOpen = turkey.gobbleTimer > 0 ? 5.5 : 0;
  ctx.fillStyle = '#F9B826';
  ctx.beginPath();
  ctx.moveTo(25, -49);
  ctx.lineTo(40, -45 - mouthOpen * 0.4);
  ctx.lineTo(25, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (mouthOpen > 0) {
    ctx.beginPath();
    ctx.moveTo(25, -42);
    ctx.lineTo(37, -38 + mouthOpen * 0.5);
    ctx.lineTo(24, -38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Expressive cartoon eye dynamically tracking nearest threat!
  const eyeX = 18;
  const eyeY = -49;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 6.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const relDx = (turkey.eyeTargetX - cx) * turkey.facing;
  const relDy = turkey.eyeTargetY - (bottomY - 49);
  const mag = Math.hypot(relDx, relDy) || 1;
  const px = eyeX + (relDx / mag) * 2.4;
  const py = eyeY + (relDy / mag) * 2.4;
  ctx.fillStyle = '#180D08';
  ctx.beginPath();
  ctx.arc(px, py, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(px - 1, py - 1, 1, 0, Math.PI * 2);
  ctx.fill();

  // Plucky little feather tuft on crown.
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(14, -57);
  ctx.quadraticCurveTo(10, -66, 17, -64);
  ctx.stroke();

  ctx.restore();
}

export function drawFarmerChef(ctx, farmer, t) {
  const cx = farmer.x + farmer.w * 0.5;
  const bottomY = farmer.y + farmer.h;
  const isChef = farmer.role === 'chef';
  const alerted =
    farmer.state === FARMER_STATES.CHASE ||
    farmer.state === FARMER_STATES.THROW_KNIFE ||
    farmer.state === FARMER_STATES.CORNER_LUNGE;

  ctx.save();

  // 1. Volumetric lantern / kitchen searchlight vision cone!
  const cone = computeFarmerVisionCone(farmer);
  const coneGrad = ctx.createRadialGradient(
    cone.originX,
    cone.originY,
    10,
    cone.originX,
    cone.originY,
    cone.range,
  );
  if (alerted) {
    coneGrad.addColorStop(0, 'rgba(255, 110, 40, 0.44)');
    coneGrad.addColorStop(0.55, 'rgba(255, 70, 35, 0.22)');
    coneGrad.addColorStop(1, 'rgba(255, 60, 20, 0)');
  } else {
    coneGrad.addColorStop(0, 'rgba(255, 224, 102, 0.42)');
    coneGrad.addColorStop(0.6, 'rgba(255, 185, 65, 0.16)');
    coneGrad.addColorStop(1, 'rgba(255, 170, 50, 0)');
  }
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(cone.originX, cone.originY);
  ctx.arc(cone.originX, cone.originY, cone.range, cone.angle - cone.halfSpread, cone.angle + cone.halfSpread);
  ctx.closePath();
  ctx.fill();

  // Ground shadow.
  ctx.fillStyle = 'rgba(24, 10, 4, 0.38)';
  ctx.beginPath();
  ctx.ellipse(cx, bottomY + 2, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Character body transform.
  ctx.translate(cx, bottomY);
  const stride = Math.sin(farmer.stridePhase);
  const bob = Math.abs(Math.cos(farmer.stridePhase)) * 5;
  ctx.translate(0, -bob);
  ctx.scale(farmer.facing, 1);

  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;

  // 2. Boots & sturdy denim / chef trousers.
  const drawBoot = (xOff, swing) => {
    const fx = xOff + swing * 18;
    const fy = -Math.max(0, swing) * 10;
    ctx.fillStyle = isChef ? '#2B2D42' : '#2E4F7D';
    roundRect(ctx, fx - 9, -40, 18, 28, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3B2314';
    roundRect(ctx, fx - 10, fy - 16, 25, 15, 5);
    ctx.fill();
    ctx.stroke();
  };
  drawBoot(-10, -stride);
  drawBoot(10, stride);

  // 3. Burly torso: Red plaid shirt + denim overalls OR crisp white Chef coat & stained apron!
  ctx.fillStyle = isChef ? '#F8F9FA' : '#C92A2A';
  roundRect(ctx, -26, -86, 52, 52, 12);
  ctx.fill();
  ctx.stroke();

  if (isChef) {
    // Chef double-breasted buttons, red neckerchief, and Thanksgiving apron!
    ctx.fillStyle = '#E03131';
    ctx.beginPath();
    ctx.moveTo(-14, -84);
    ctx.lineTo(16, -84);
    ctx.lineTo(8, -71);
    ctx.lineTo(-4, -71);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFDF5';
    roundRect(ctx, -21, -66, 42, 38, 6);
    ctx.fill();
    ctx.stroke();
    // Tiny gravy splatter on apron.
    ctx.fillStyle = '#8C5328';
    ctx.beginPath();
    ctx.arc(8, -46, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Denim overalls + brass buttons!
    ctx.fillStyle = '#315A94';
    roundRect(ctx, -20, -72, 40, 39, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-16, -86, 9, 18);
    ctx.strokeRect(-16, -86, 9, 18);
    ctx.fillRect(7, -86, 9, 18);
    ctx.strokeRect(7, -86, 9, 18);
    ctx.fillStyle = '#F4B43A';
    ctx.beginPath();
    ctx.arc(-11, -70, 3.2, 0, Math.PI * 2);
    ctx.arc(11, -70, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Back arm raising gleaming Carving Knife (cocks back dramatically on THROW_KNIFE!).
  const armAngle =
    farmer.state === FARMER_STATES.THROW_KNIFE
      ? -1.65 - Math.sin(t * 24) * 0.14
      : alerted
        ? -0.95 + Math.sin(farmer.stridePhase) * 0.25
        : -0.45;
  ctx.save();
  ctx.translate(-14, -74);
  ctx.rotate(armAngle);
  ctx.fillStyle = isChef ? '#F8F9FA' : '#C92A2A';
  roundRect(ctx, -6, -8, 32, 14, 6);
  ctx.fill();
  ctx.stroke();
  // Hand gripping raised carving knife!
  ctx.fillStyle = '#F1C29B';
  ctx.beginPath();
  ctx.arc(28, -1, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6B3416';
  ctx.fillRect(24, -14, 7, 14);
  ctx.strokeRect(24, -14, 7, 14);
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.moveTo(23, -14);
  ctx.lineTo(32, -14);
  ctx.lineTo(36, -46);
  ctx.quadraticCurveTo(25, -42, 23, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 5. Angry expressive head with ginger mustache & brows!
  ctx.fillStyle = '#F4C29F';
  ctx.beginPath();
  ctx.arc(2, -100, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Angry furrowed ginger eyebrow + fierce eye.
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(10, -102, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTES.ink;
  ctx.beginPath();
  ctx.arc(11.5, -102, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9C3B14';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(4, -109);
  ctx.lineTo(17, -105);
  ctx.stroke();

  // Bushy ginger handlebar mustache!
  ctx.fillStyle = '#B84B14';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(4, -93);
  ctx.quadraticCurveTo(14, -97, 23, -91);
  ctx.quadraticCurveTo(16, -86, 4, -89);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 6. Iconic Headgear: Wide-brimmed Golden Straw Hat OR Tall Fluted White Chef Toque!
  if (isChef) {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-10, -134, 14, 0, Math.PI * 2);
    ctx.arc(3, -140, 16, 0, Math.PI * 2);
    ctx.arc(16, -133, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-15, -130, 34, 19);
    ctx.strokeRect(-15, -130, 34, 19);
  } else {
    // Golden straw farm hat!
    ctx.fillStyle = '#E8B339';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(2, -112, 32, 7.5, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-16, -114);
    ctx.lineTo(-11, -132);
    ctx.lineTo(15, -132);
    ctx.lineTo(20, -114);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#C92A2A';
    ctx.fillRect(-14, -119, 32, 5);
  }

  // 7. Leading arm carrying glowing brass lantern!
  const lSwing = Math.sin(farmer.lanternSwing * 5) * 0.12;
  ctx.save();
  ctx.translate(16, -70);
  ctx.rotate(lSwing);
  ctx.fillStyle = isChef ? '#F8F9FA' : '#C92A2A';
  roundRect(ctx, -4, -6, 26, 13, 6);
  ctx.fill();
  ctx.stroke();
  // Brass lantern glowing warmly.
  ctx.fillStyle = alerted ? '#FF922B' : '#FFE066';
  roundRect(ctx, 16, 4, 16, 20, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // 8. Crisp AI State Alert Badge right above Farmer's hat!
  if (farmer.badgeText) {
    ctx.save();
    const bobBadge = Math.sin(t * 10) * 3;
    const bw = Math.max(96, farmer.badgeText.length * 10 + 22);
    const bx = cx - bw * 0.5;
    const by = bottomY - (isChef ? 194 : 178) + bobBadge;
    drawPlaque(ctx, bx, by, bw, 30, farmer.badgeColor, PALETTES.ink, 9);
    ctx.fillStyle = farmer.badgeColor === '#F4B43A' ? PALETTES.ink : '#FFFDF5';
    ctx.font = '900 14px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(farmer.badgeText, cx, by + 15);
    ctx.restore();
  }
}

function drawParticlesLayer(ctx, sys, camX, isIndoor) {
  // Drifting autumn maple leaves in screen space (lighter indoors).
  ctx.save();
  const leafCount = isIndoor ? 8 : sys.leaves.length;
  for (let i = 0; i < leafCount; i += 1) {
    const lf = sys.leaves[i];
    ctx.save();
    ctx.translate(lf.x, lf.y);
    ctx.rotate(lf.angle);
    ctx.globalAlpha = isIndoor ? 0.35 : 0.85;
    ctx.fillStyle = lf.color;
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -lf.size);
    ctx.lineTo(lf.size * 0.65, -lf.size * 0.2);
    ctx.lineTo(lf.size * 0.35, lf.size * 0.7);
    ctx.lineTo(0, lf.size * 0.4);
    ctx.lineTo(-lf.size * 0.35, lf.size * 0.7);
    ctx.lineTo(-lf.size * 0.65, -lf.size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // World-space particles (feathers, embers, sparks).
  ctx.save();
  ctx.translate(-camX, 0);
  for (let i = 0; i < sys.particles.length; i += 1) {
    const p = sys.particles[i];
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    if (p.kind === 'feather') {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = PALETTES.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.72, p.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === 'ember') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * alpha + 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
    }
    ctx.restore();
  }

  // Decoy / Close-Shave sound ripples.
  for (let i = 0; i < sys.ripples.length; i += 1) {
    const r = sys.ripples[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.85;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Punchy comic floating callouts (e.g. CLOSE SHAVE! +150).
  for (let i = 0; i < sys.callouts.length; i += 1) {
    const c = sys.callouts[i];
    const alpha = Math.min(1, (c.life / c.maxLife) * 1.6);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${Math.round(22 * c.scale)}px "Trebuchet MS", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = PALETTES.ink;
    ctx.strokeText(c.text, c.x, c.y);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, c.x, c.y);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

function drawFeatherLifeIcon(ctx, x, y, alive) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  ctx.fillStyle = alive ? '#F08C00' : 'rgba(56, 30, 16, 0.25)';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (alive) {
    ctx.fillStyle = '#C92A2A';
    ctx.beginPath();
    ctx.ellipse(0, -9, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF3D1';
    ctx.beginPath();
    ctx.ellipse(0, -13, 3.4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawParchmentHud(ctx, state) {
  const { turkey, farmer, stage, score, lives, combo, distanceMeters, hoverTarget, muted } = state;
  ctx.save();

  // 1. Top-Left Plaque: SCORE, COMBO, and 3 FEATHER LIVES.
  drawPlaque(ctx, 16, 14, 316, 78, PALETTES.parchment, PALETTES.ink, 12);
  ctx.fillStyle = PALETTES.inkSoft;
  ctx.font = '800 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE', 32, 24);
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '900 30px "Trebuchet MS", sans-serif';
  ctx.fillText(String(score).padStart(5, '0'), 30, 40);

  if (combo >= 2) {
    drawPlaque(ctx, 134, 22, 82, 26, '#FF6B2B', PALETTES.ink, 8);
    ctx.fillStyle = '#FFFDF5';
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`COMBO x${combo}`, 175, 35);
  }

  // 3 Feather Lives on right side of top-left plaque.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTES.inkSoft;
  ctx.font = '800 11px "Trebuchet MS", sans-serif';
  ctx.fillText('LIVES', 274, 27);
  for (let i = 0; i < TURKEY_TUNING.maxLives; i += 1) {
    drawFeatherLifeIcon(ctx, 244 + i * 28, 60, i < lives);
  }

  // 2. Top-Center Plaque: STAGE & ESCAPE DISTANCE BAR.
  drawPlaque(ctx, 360, 14, 494, 78, PALETTES.parchment, PALETTES.ink, 12);
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '900 16px "Georgia", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const stageLabel =
    state.mode === MODES.ENDLESS
      ? `LOOP ${state.endlessLoop} · STAGE ${stage.id}/3 · ${stage.shortName}`
      : `STAGE ${stage.id}/3 · ${stage.shortName}`;
  ctx.fillText(stageLabel, 380, 24);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9E2A2B';
  ctx.font = '900 15px "Trebuchet MS", sans-serif';
  ctx.fillText(`${distanceMeters}m ESCAPED`, 834, 25);

  // Escape progress track bar.
  const barX = 380;
  const barY = 56;
  const barW = 452;
  const barH = 18;
  const progress = Math.max(0, Math.min(1, (turkey.x - 200) / (stage.length - 360)));
  ctx.fillStyle = '#D9BE8F';
  roundRect(ctx, barX, barY, barW, barH, 9);
  ctx.fill();
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  fillGrad.addColorStop(0, '#F08C00');
  fillGrad.addColorStop(1, '#2B8A5B');
  ctx.fillStyle = fillGrad;
  roundRect(ctx, barX + 2, barY + 2, Math.max(16, (barW - 4) * progress), barH - 4, 7);
  ctx.fill();

  // Mini farmer & turkey pins on progress bar!
  const fProg = Math.max(0, Math.min(1, (farmer.x - 40) / (stage.length - 260)));
  ctx.fillStyle = '#E03131';
  ctx.beginPath();
  ctx.arc(barX + 8 + (barW - 16) * fProg, barY + 9, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFE066';
  ctx.beginPath();
  ctx.arc(barX + 8 + (barW - 16) * progress, barY + 9, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Top-Right Tactical Plaque: DASH RING, DECOY, STEALTH STATUS & PAUSE/MUTE.
  drawPlaque(ctx, 878, 14, 286, 78, PALETTES.parchment, PALETTES.ink, 12);

  // Radial Dash Stamina Ring.
  const ringX = 918;
  const ringY = 53;
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#D6BC8E';
  ctx.beginPath();
  ctx.arc(ringX, ringY, 22, 0, Math.PI * 2);
  ctx.stroke();
  const dashReady = turkey.stamina >= TURKEY_TUNING.dashStaminaCost;
  ctx.strokeStyle = dashReady ? '#F08C00' : '#94A3B8';
  ctx.beginPath();
  ctx.arc(ringX, ringY, 22, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * turkey.stamina);
  ctx.stroke();
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '900 11px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DASH', ringX, ringY - 3);
  ctx.font = '800 9px "Trebuchet MS", sans-serif';
  ctx.fillText(dashReady ? 'SHIFT' : '...', ringX, ringY + 9);

  // Acorn Decoy status chip.
  const decoyReady = turkey.decoyCooldown <= 0;
  drawPlaque(ctx, 956, 26, 86, 52, decoyReady ? '#FFE8A3' : '#DECBB0', PALETTES.ink, 8);
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '900 11px "Trebuchet MS", sans-serif';
  ctx.fillText('DECOY [Q]', 999, 43);
  ctx.fillStyle = decoyReady ? '#2B8A5B' : '#7D5A44';
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.fillText(decoyReady ? 'READY' : `${turkey.decoyCooldown.toFixed(1)}s`, 999, 62);

  // Stealth status indicator!
  const stealthState = turkey.hidden
    ? { label: 'HIDDEN', fill: PALETTES.sageStealth, fg: '#FFFDF5' }
    : farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.THROW_KNIFE || farmer.state === FARMER_STATES.CORNER_LUNGE
      ? { label: 'SPOTTED!', fill: '#E03131', fg: '#FFFDF5' }
      : farmer.state === FARMER_STATES.INVESTIGATE
        ? { label: 'SEARCH', fill: '#F4B43A', fg: PALETTES.ink }
        : { label: 'CLEAR', fill: '#E6CFA0', fg: PALETTES.ink };

  drawPlaque(ctx, 1054, 26, 98, 52, stealthState.fill, PALETTES.ink, 8);
  ctx.fillStyle = stealthState.fg;
  ctx.font = '800 10px "Trebuchet MS", sans-serif';
  ctx.fillText('STEALTH', 1103, 41);
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.fillText(stealthState.label, 1103, 60);

  // Crisp Pause & Audio icon buttons with bold vector icons + labels.
  const pb = UI_RECTS.hudPauseBtn;
  drawPlaque(ctx, pb.x, pb.y, pb.w, pb.h, hoverTarget === 'hudPauseBtn' ? '#FFE8A3' : PALETTES.parchment, PALETTES.ink, 8);
  ctx.fillStyle = PALETTES.ink;
  ctx.fillRect(pb.x + 12, pb.y + 10, 4, 16);
  ctx.fillRect(pb.x + 19, pb.y + 10, 4, 16);
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSE', pb.x + 29, pb.y + pb.h * 0.52);

  const mb = UI_RECTS.hudMuteBtn;
  drawPlaque(ctx, mb.x, mb.y, mb.w, mb.h, hoverTarget === 'hudMuteBtn' ? '#FFE8A3' : PALETTES.parchment, PALETTES.ink, 8);
  ctx.save();
  ctx.fillStyle = muted ? PALETTES.cranberry : PALETTES.ink;
  ctx.strokeStyle = muted ? PALETTES.cranberry : PALETTES.ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(mb.x + 11, mb.y + 14);
  ctx.lineTo(mb.x + 16, mb.y + 14);
  ctx.lineTo(mb.x + 22, mb.y + 9);
  ctx.lineTo(mb.x + 22, mb.y + 27);
  ctx.lineTo(mb.x + 16, mb.y + 22);
  ctx.lineTo(mb.x + 11, mb.y + 22);
  ctx.closePath();
  ctx.fill();
  if (muted) {
    ctx.beginPath();
    ctx.moveTo(mb.x + 25, mb.y + 13);
    ctx.lineTo(mb.x + 33, mb.y + 23);
    ctx.moveTo(mb.x + 33, mb.y + 13);
    ctx.lineTo(mb.x + 25, mb.y + 23);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(mb.x + 24, mb.y + 18, 4, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mb.x + 25, mb.y + 18, 7.5, -0.7, 0.7);
    ctx.stroke();
  }
  ctx.font = '900 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(muted ? 'MUTE' : 'SFX', mb.x + 38, mb.y + mb.h * 0.52);
  ctx.restore();

  // Subtle bottom control hint strip inside the dark floor margin (never blocks gameplay!).
  ctx.fillStyle = 'rgba(26, 12, 6, 0.72)';
  roundRect(ctx, 250, 682, 780, 28, 12);
  ctx.fill();
  ctx.fillStyle = '#F7E7C4';
  ctx.font = '700 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'A/D Move  ·  Space / Click: Flutter Jump  ·  Shift / R-Click: Feather Dash  ·  E / S: Hide  ·  Q: Acorn Decoy  ·  P: Pause  ·  M: Audio',
    640,
    696,
  );

  // Brief Stage Banner slide-in at stage start.
  if (state.bannerTimer > 0 && state.bannerText) {
    const alpha = Math.min(1, state.bannerTimer * 1.5);
    ctx.globalAlpha = alpha;
    drawPlaque(ctx, 410, 108, 460, 44, '#3A1D0F', '#F4B43A', 12);
    ctx.fillStyle = '#FFE8A3';
    ctx.font = '900 18px "Georgia", serif';
    ctx.fillText(state.bannerText, 640, 130);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function drawTitleOverlay(ctx, state) {
  ctx.save();

  // Warm soft vignette framing the live-animated farmyard scene.
  const vig = ctx.createRadialGradient(640, 360, 260, 640, 360, 760);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(28, 10, 4, 0.58)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Handcrafted woodblock title crest positioned cleanly in the upper sky!
  drawPlaque(ctx, 214, 40, 852, 166, '#3B1B0D', '#F4B43A', 22);
  // Decorative maple leaf accents on left & right of banner.
  [254, 1026].forEach((lx) => {
    ctx.fillStyle = '#E8590C';
    ctx.strokeStyle = PALETTES.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(lx, 106, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(lx, 106, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Giant woodblock title text: GOBBLE GAUNTLET
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 72px "Georgia", "Times New Roman", serif';
  ctx.lineWidth = 10;
  ctx.strokeStyle = PALETTES.ink;
  ctx.strokeText('GOBBLE GAUNTLET', 640, 106);

  const titleGrad = ctx.createLinearGradient(0, 66, 0, 146);
  titleGrad.addColorStop(0, '#FFF9DB');
  titleGrad.addColorStop(0.55, '#F9C74F');
  titleGrad.addColorStop(1, '#E86A17');
  ctx.fillStyle = titleGrad;
  ctx.fillText('GOBBLE GAUNTLET', 640, 106);

  // Subtitle ribbon!
  ctx.fillStyle = '#FDE7B2';
  ctx.font = 'italic 700 21px "Georgia", serif';
  ctx.fillText('Escape the Farmyard, Survive the Kitchen, Beat Thanksgiving Dinner', 640, 170);

  // Stage preview pill tags right below crest.
  const pills = ['1. GOLDEN FARMYARD', '2. SMOKEHOUSE CELLAR', '3. KITCHEN GAUNTLET'];
  pills.forEach((label, idx) => {
    const px = 286 + idx * 242;
    drawPlaque(ctx, px, 222, 224, 34, PALETTES.parchment, PALETTES.ink, 10);
    ctx.fillStyle = PALETTES.ink;
    ctx.font = '900 13px "Trebuchet MS", sans-serif';
    ctx.fillText(label, px + 112, 239);
  });

  // Prominent clickable PLAY ESCAPE + MODE TOGGLE buttons below the live chase band!
  const modeLabel = state.mode === MODES.ESCAPE ? 'MODE: 3-STAGE' : 'MODE: ENDLESS';
  const modeSub = state.bestScore > 0 ? `BEST: ${state.bestScore}` : 'CLICK TO TOGGLE';
  drawButton(
    ctx,
    UI_RECTS.titlePlayBtn,
    '▶ PLAY ESCAPE',
    'SPACE / ENTER / CLICK',
    state.hoverTarget === 'titlePlayBtn',
    true,
  );
  drawButton(
    ctx,
    UI_RECTS.titleModeBtn,
    modeLabel,
    modeSub,
    state.hoverTarget === 'titleModeBtn',
    false,
  );

  // Bottom crisp high-contrast control legend strip!
  drawPlaque(ctx, 48, 646, 1184, 52, 'rgba(34, 15, 8, 0.92)', '#F4B43A', 14);
  ctx.fillStyle = '#FFF3D6';
  ctx.font = '800 16px "Trebuchet MS", sans-serif';
  ctx.fillText(
    'WASD / Arrows: Move  ·  Space / Click: Flutter Jump  ·  Shift / R-Click: Feather Dash  ·  E / S: Hide in Cover  ·  Q: Toss Acorn Decoy  ·  M: Audio',
    640,
    672,
  );

  ctx.restore();
}

export function drawStageClearOverlay(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 9, 4, 0.48)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPlaque(ctx, 330, 220, 620, 228, PALETTES.parchment, PALETTES.ink, 18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2B8A5B';
  ctx.font = '900 40px "Georgia", serif';
  ctx.fillText(`STAGE ${state.stage.id} CLEARED!`, 640, 286);
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '700 20px "Trebuchet MS", sans-serif';
  const nextStage = STAGES[Math.min(STAGES.length - 1, state.stageIndex + 1)];
  ctx.fillText(`Next up: ${nextStage.title} (+400 Bonus)`, 640, 342);
  ctx.fillStyle = '#9E2A2B';
  ctx.font = '800 16px "Trebuchet MS", sans-serif';
  ctx.fillText(nextStage.bannerSub, 640, 386);
  ctx.restore();
}

export function drawPauseOverlay(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 9, 4, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPlaque(ctx, 410, 180, 460, 370, PALETTES.parchment, PALETTES.ink, 20);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '900 42px "Georgia", serif';
  ctx.fillText('PAUSED', 640, 244);
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillStyle = PALETTES.inkSoft;
  ctx.fillText(`Stage ${state.stage.id}/3 · ${state.stage.title} · Score ${state.score}`, 640, 286);

  drawButton(ctx, UI_RECTS.pauseResumeBtn, '▶ RESUME', '', state.hoverTarget === 'pauseResumeBtn', true);
  drawButton(ctx, UI_RECTS.pauseRestartBtn, '↻ RESTART RUN', '', state.hoverTarget === 'pauseRestartBtn', false);
  drawButton(ctx, UI_RECTS.pauseTitleBtn, '⌂ TITLE SCREEN', '', state.hoverTarget === 'pauseTitleBtn', false);
  ctx.restore();
}

export function drawEndOverlay(ctx, state) {
  const escaped = state.outcome === 'escaped';
  const t = state.elapsed;
  ctx.save();

  // Rich autumn sunset freedom backdrop for ESCAPED, warm dramatic vignette for CAUGHT.
  if (escaped) {
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    sky.addColorStop(0, '#4E89AE');
    sky.addColorStop(0.45, '#F4A236');
    sky.addColorStop(0.82, '#FCE29F');
    sky.addColorStop(1, '#6C3B1C');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Sunburst rays behind celebration crest!
    ctx.save();
    ctx.translate(640, 120);
    for (let i = 0; i < 16; i += 1) {
      ctx.rotate(Math.PI / 8);
      ctx.fillStyle = 'rgba(255, 249, 219, 0.14)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-24, -640);
      ctx.lineTo(24, -640);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Left Vignette: Frustrated Chef-Farmer trapped behind the Kitchen Window shaking his carving knife!
    drawEndVictoryVignette(ctx, t);
  } else {
    ctx.fillStyle = 'rgba(28, 10, 6, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  // Top Header Woodblock Banner!
  drawPlaque(ctx, 240, 32, 800, 104, escaped ? '#22543D' : '#7F1D1D', '#F4B43A', 20);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px "Georgia", serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = PALETTES.ink;
  const heading = escaped ? 'ESCAPED THE TABLE!' : 'ALMOST DINNER!';
  ctx.strokeText(heading, 640, 82);
  ctx.fillStyle = escaped ? '#FFF3BF' : '#FFC9C9';
  ctx.fillText(heading, 640, 82);

  // Main Parchment Results Card (offset slightly right on Victory to spotlight the hilarious window vignette!).
  const cardX = escaped ? 446 : 254;
  const cardW = escaped ? 770 : 772;
  const cardY = 156;
  const cardH = 408;
  drawPlaque(ctx, cardX, cardY, cardW, cardH, PALETTES.parchment, PALETTES.ink, 18);

  // Subtitle line.
  ctx.textAlign = 'left';
  ctx.fillStyle = escaped ? '#2B8A5B' : '#B91C1C';
  ctx.font = '900 20px "Georgia", serif';
  const sub = escaped
    ? 'Barnaby flew free into the golden autumn sunset!'
    : `Caught by ${state.causeOfDemise || 'the Farmer'} in ${state.stage.title}!`;
  ctx.fillText(sub, cardX + 30, cardY + 38);

  // Gleaming Rank Wax-Seal Medal on top-right of card!
  const medalX = cardX + cardW - 84;
  const medalY = cardY + 86;
  ctx.save();
  // Ribbon tails.
  ctx.fillStyle = '#C92A2A';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(medalX - 24, medalY + 26);
  ctx.lineTo(medalX - 34, medalY + 76);
  ctx.lineTo(medalX - 12, medalY + 62);
  ctx.lineTo(medalX, medalY + 78);
  ctx.lineTo(medalX + 12, medalY + 62);
  ctx.lineTo(medalX + 34, medalY + 76);
  ctx.lineTo(medalX + 24, medalY + 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const medalGrad = ctx.createRadialGradient(medalX - 12, medalY - 12, 6, medalX, medalY, 48);
  medalGrad.addColorStop(0, '#FFF3BF');
  medalGrad.addColorStop(0.55, '#F4B43A');
  medalGrad.addColorStop(1, '#C97A12');
  ctx.fillStyle = medalGrad;
  ctx.beginPath();
  ctx.arc(medalX, medalY, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '800 12px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RANK', medalX, medalY - 22);
  ctx.font = '900 44px "Georgia", serif';
  ctx.fillText(state.rank, medalX, medalY + 12);
  ctx.restore();

  // Clean 2x3 High-Contrast Run Stats Grid!
  const statsItems = [
    { label: 'FINAL SCORE', value: String(state.score) },
    { label: 'BEST SCORE', value: String(state.bestScore) },
    { label: 'STAGES CLEARED', value: `${Math.min(3, state.stats.stagesCleared)}/3` },
    { label: 'DISTANCE', value: `${state.distanceMeters}m` },
    { label: 'CLOSE SHAVES', value: String(state.stats.closeShaves) },
    { label: 'GOLDEN CORN', value: String(state.stats.cornCollected) },
  ];
  statsItems.forEach((item, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const bx = cardX + 30 + col * 194;
    const by = cardY + 72 + row * 82;
    drawPlaque(ctx, bx, by, 180, 68, '#FFF9EB', '#7F4F24', 10);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7F4F24';
    ctx.font = '800 12px "Trebuchet MS", sans-serif';
    ctx.fillText(item.label, bx + 14, by + 21);
    ctx.fillStyle = PALETTES.ink;
    ctx.font = '900 26px "Trebuchet MS", sans-serif';
    ctx.fillText(item.value, bx + 14, by + 49);
  });

  // Earned Run Badges section!
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTES.inkSoft;
  ctx.font = '900 14px "Trebuchet MS", sans-serif';
  ctx.fillText('RUN BADGES EARNED:', cardX + 30, cardY + 266);

  const badgesToShow = state.earnedBadges.length > 0
    ? state.earnedBadges.slice(0, 4)
    : [{ label: 'Keep Escaping!', desc: 'Use Dash, Cover & Decoys for badges' }];

  badgesToShow.forEach((badge, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = cardX + 30 + col * 356;
    const by = cardY + 286 + row * 54;
    drawPlaque(ctx, bx, by, 342, 44, '#FFE8A3', PALETTES.ink, 10);
    ctx.fillStyle = '#9E2A2B';
    ctx.font = '900 14px "Trebuchet MS", sans-serif';
    ctx.fillText(`★ ${badge.label}`, bx + 14, by + 17);
    ctx.fillStyle = '#4A2816';
    ctx.font = '700 12px "Trebuchet MS", sans-serif';
    ctx.fillText(badge.desc, bx + 14, by + 34);
  });

  // Prominent clickable PLAY AGAIN + TITLE buttons!
  drawButton(
    ctx,
    UI_RECTS.endPlayAgainBtn,
    escaped ? '↻ PLAY AGAIN' : '↻ TRY AGAIN',
    'PRESS R OR SPACE',
    state.hoverTarget === 'endPlayAgainBtn',
    true,
  );
  drawButton(
    ctx,
    UI_RECTS.endTitleBtn,
    '⌂ TITLE MENU',
    'CHANGE MODE',
    state.hoverTarget === 'endTitleBtn',
    false,
  );

  ctx.restore();
}

function drawEndVictoryVignette(ctx, t) {
  ctx.save();
  // Rustic exterior stone cottage wall framing the kitchen window on the left!
  drawPlaque(ctx, 46, 156, 376, 408, '#9C5C34', PALETTES.ink, 18);

  // Kitchen Window interior visible behind glass.
  ctx.fillStyle = '#522916';
  roundRect(ctx, 84, 194, 300, 234, 12);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#FFF5DC';
  ctx.stroke();

  // Warm orange oven glow inside kitchen behind the Chef-Farmer.
  const glow = ctx.createRadialGradient(234, 340, 20, 234, 340, 150);
  glow.addColorStop(0, 'rgba(255, 165, 60, 0.72)');
  glow.addColorStop(1, 'rgba(82, 41, 22, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(88, 198, 292, 226);

  // Frustrated Chef-Farmer shaking his carving knife inside the window!
  const fumingChef = {
    x: 158,
    y: 300,
    w: 72,
    h: 118,
    facing: 1,
    role: 'chef',
    state: FARMER_STATES.THROW_KNIFE,
    stridePhase: t * 2,
    lanternSwing: t,
    visionRange: 0,
    badgeText: '! CURSES!',
    badgeColor: '#E03131',
  };
  ctx.save();
  roundRect(ctx, 88, 198, 292, 226, 8);
  ctx.clip();
  drawFarmerChef(ctx, fumingChef, t);
  ctx.restore();

  // Window wooden sill & smug victorious Barnaby perched safely OUTSIDE on the sill!
  ctx.fillStyle = '#6E381A';
  ctx.strokeStyle = PALETTES.ink;
  ctx.lineWidth = 3.5;
  roundRect(ctx, 64, 424, 340, 24, 6);
  ctx.fill();
  ctx.stroke();

  const smugTurkey = {
    x: 266,
    y: 360,
    w: TURKEY_TUNING.width,
    h: TURKEY_TUNING.height,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    fluttering: false,
    dashTimer: 0,
    dashIframes: 0,
    hitInvuln: 0,
    hidden: false,
    runCycle: 0,
    squashX: 1.15,
    squashY: 1.15,
    gobbleTimer: 0.25,
    eyeTargetX: 180,
    eyeTargetY: 360,
    afterimages: [],
  };
  drawTurkeyCharacter(ctx, smugTurkey, t);

  // Caption plaque beneath window.
  drawPlaque(ctx, 74, 468, 320, 74, PALETTES.parchment, PALETTES.ink, 12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTES.ink;
  ctx.font = '900 18px "Georgia", serif';
  ctx.fillText('"GOBBLE GOBBLE, CHEF!"', 234, 495);
  ctx.fillStyle = '#2B8A5B';
  ctx.font = '800 14px "Trebuchet MS", sans-serif';
  ctx.fillText('Not on the Thanksgiving menu tonight!', 234, 521);

  ctx.restore();
}

export function renderGameFrame(ctx, state) {
  const t = state.screen === SCREENS.TITLE ? state.titleTime : state.elapsed;
  ctx.save();
  ctx.translate(state.shakeX, state.shakeY);

  // 1. Layered storybook environment backdrop.
  drawAutumnBackdrop(ctx, state);

  // 2. World-space gameplay entities (camera scrolled).
  if (state.screen !== SCREENS.END || state.outcome === 'caught') {
    ctx.save();
    ctx.translate(-state.cameraX, 0);

    const { layout, turkey, farmer, stage } = state;

    // Exit archway or Open Escape Window.
    drawStageExit(ctx, layout.exit, stage, t);

    // Spilled gravy puddles on ground.
    for (let i = 0; i < layout.gravyPuddles.length; i += 1) {
      drawGravyPuddle(ctx, layout.gravyPuddles[i]);
    }

    // Roasting ovens.
    for (let i = 0; i < layout.ovens.length; i += 1) {
      drawRoastingOven(ctx, layout.ovens[i], t);
    }

    // Cranberry bounce pads.
    for (let i = 0; i < layout.bouncePads.length; i += 1) {
      drawBouncePad(ctx, layout.bouncePads[i]);
    }

    // Golden corn & wild berry pickups.
    for (let i = 0; i < layout.pickups.length; i += 1) {
      drawPickup(ctx, layout.pickups[i]);
    }

    // Stealth covers behind turkey if turkey is NOT hidden, or in front when hidden!
    const promptedCovers = [];
    for (let i = 0; i < layout.covers.length; i += 1) {
      const c = layout.covers[i];
      const isHiddenHere = turkey.hidden && turkey.coverId === c.id;
      const isNear = turkey.nearbyCover && turkey.nearbyCover.id === c.id;
      const showPrompt = state.screen === SCREENS.PLAY && (isHiddenHere || isNear || Math.abs(c.x + c.w * 0.5 - (turkey.x + turkey.w * 0.5)) < 265);
      if (showPrompt) promptedCovers.push({ cover: c, isHiddenHere });
      if (!isHiddenHere) {
        drawCoverProp(ctx, c, false, false, t);
      }
    }

    // Acorn decoys.
    for (let i = 0; i < layout.decoys.length; i += 1) {
      drawAcornDecoy(ctx, layout.decoys[i]);
    }

    // Pursuing Farmer / Chef.
    drawFarmerChef(ctx, farmer, t);

    // Player Turkey!
    drawTurkeyCharacter(ctx, turkey, t);

    // Draw stealth cover foreground over hidden turkey so peeking eyes sit neatly on top!
    if (turkey.hidden && turkey.coverId) {
      const c = layout.covers.find((item) => item.id === turkey.coverId);
      if (c) {
        drawCoverProp(ctx, c, false, true, t);
        drawTurkeyCharacter(ctx, turkey, t);
      }
    }

    // Draw crisp [E] HIDE / HIDDEN prompts above characters so text is never clipped!
    for (let i = 0; i < promptedCovers.length; i += 1) {
      drawCoverPrompt(ctx, promptedCovers[i].cover, promptedCovers[i].isHiddenHere, t);
    }

    // Spinning & sweeping carving knives on top for razor-sharp readability!
    for (let i = 0; i < layout.knives.length; i += 1) {
      drawCarvingKnife(ctx, layout.knives[i]);
    }

    ctx.restore();
  }

  // 3. Particles, drifting maple leaves, ripples, and floating callouts.
  drawParticlesLayer(ctx, state.particles, state.cameraX, state.stage.key !== 'farmyard');

  // 4. Screen overlays & HUD.
  if (state.screen === SCREENS.TITLE) {
    drawTitleOverlay(ctx, state);
  } else if (state.screen === SCREENS.PLAY) {
    drawParchmentHud(ctx, state);
  } else if (state.screen === SCREENS.STAGE_CLEAR) {
    drawParchmentHud(ctx, state);
    drawStageClearOverlay(ctx, state);
  } else if (state.screen === SCREENS.PAUSE) {
    drawParchmentHud(ctx, state);
    drawPauseOverlay(ctx, state);
  } else if (state.screen === SCREENS.END) {
    drawEndOverlay(ctx, state);
  }

  ctx.restore();
}
