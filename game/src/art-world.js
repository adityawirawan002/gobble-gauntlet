// Painterly storybook world renderer: 3 multi-tier autumn stages, platforms, updrafts, exits, and moonlit finale.

import { PALETTES, VIEW } from './constants.js';
const INK = PALETTES.ink, TAU = Math.PI * 2, GY = VIEW.groundY, W = VIEW.width, H = VIEW.height, FNT = '"Trebuchet MS", sans-serif';
let grainPattern = null;

export function linG(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i < stops.length; i += 2) gr.addColorStop(stops[i], stops[i + 1]);
  return gr;
}

export function radG(g, x0, y0, r0, x1, y1, r1, stops) {
  const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (let i = 0; i < stops.length; i += 2) gr.addColorStop(stops[i], stops[i + 1]);
  return gr;
}

export function roundRectPath(g, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}

export function dot(g, x, y, r, fill, stroke = null, lw = 2) {
  g.beginPath(); g.arc(x, y, r, 0, TAU);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
export function line(g, x0, y0, x1, y1, col, lw = 2) {
  g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
}

export function rBox(g, x, y, w, h, r, fill, stroke = INK, lw = 2.2) {
  roundRectPath(g, x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

function ensureGrainPattern(g) {
  if (grainPattern || typeof document === 'undefined') return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = tile.height = 96;
  const tg = tile.getContext('2d');
  if (!tg) return null;
  let s = 1337;
  for (let i = 0; i < 380; i += 1) {
    s = (s * 1664525 + 1013904223) >>> 0; const x = (s / 4294967296) * 96;
    s = (s * 1664525 + 1013904223) >>> 0; const y = (s / 4294967296) * 96;
    tg.fillStyle = (i & 1) ? 'rgba(255,244,214,0.03)' : 'rgba(38,16,8,0.032)';
    tg.fillRect(x, y, 2, 1.5);
  }
  grainPattern = g.createPattern(tile, 'repeat');
  return grainPattern;
}

export function drawMapleLeaf(g, x, y, s, ang, col, alpha = 1) {
  g.save();
  g.translate(x, y); g.rotate(ang); g.globalAlpha = alpha;
  g.fillStyle = col; g.strokeStyle = 'rgba(42,20,11,0.52)'; g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(0, -s); g.lineTo(s * 0.34, -s * 0.35); g.lineTo(s * 0.92, -s * 0.42);
  g.lineTo(s * 0.48, s * 0.08); g.lineTo(s * 0.68, s * 0.68); g.lineTo(0, s * 0.35);
  g.lineTo(-s * 0.68, s * 0.68); g.lineTo(-s * 0.48, s * 0.08); g.lineTo(-s * 0.92, -s * 0.42);
  g.lineTo(-s * 0.34, -s * 0.35);
  g.closePath(); g.fill(); g.stroke();
  g.restore();
}

function drawSunRays(g, x, y, count, spread, len, fill) {
  g.save(); g.fillStyle = fill;
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * TAU;
    g.beginPath(); g.moveTo(x, y);
    g.lineTo(x + Math.cos(a - spread) * len, y + Math.sin(a - spread) * len);
    g.lineTo(x + Math.cos(a + spread) * len, y + Math.sin(a + spread) * len);
    g.closePath(); g.fill();
  }
  g.restore();
}
// Organic hand-illustrated storybook autumn tree (matte layered canopy, sunlit leaf edge & silhouette sprigs).
function drawStorybookTree(g, x, baseY, scale, pal) {
  g.save();
  g.translate(x, baseY); g.scale(scale, scale);
  g.fillStyle = linG(g, -16, 0, 16, 0, [0, '#3D1E10', 0.55, '#64351C', 1, '#2D140B']);
  g.beginPath();
  g.moveTo(-16, 0); g.quadraticCurveTo(-10, -76, -13, -150);
  g.lineTo(-46, -198); g.lineTo(-34, -206); g.lineTo(-2, -166);
  g.lineTo(36, -208); g.lineTo(48, -196); g.lineTo(14, -150);
  g.quadraticCurveTo(11, -74, 18, 0); g.closePath(); g.fill();
  const basePuffs = [
    [-68, -172, 46], [-28, -196, 56], [28, -198, 56], [68, -174, 46],
    [-46, -228, 48], [46, -226, 48], [0, -246, 56],
  ];
  g.fillStyle = pal[0];
  g.beginPath();
  for (const [px, py, pr] of basePuffs) { g.moveTo(px + pr, py); g.arc(px, py, pr, 0, TAU); }
  g.fill();
  const midPuffs = [
    [-58, -184, 38], [-18, -208, 48], [32, -206, 46], [58, -184, 34],
    [-36, -236, 40], [34, -234, 40], [0, -254, 46],
  ];
  g.fillStyle = pal[1];
  g.beginPath();
  for (const [px, py, pr] of midPuffs) { g.moveTo(px + pr, py); g.arc(px, py, pr, 0, TAU); }
  g.fill();
  const hiPuffs = [[-42, -228, 26], [-8, -256, 32], [28, -244, 27], [-60, -196, 20], [50, -202, 20]];
  g.fillStyle = pal[2];
  g.beginPath();
  for (const [px, py, pr] of hiPuffs) { g.moveTo(px + pr, py); g.arc(px, py, pr, 0, TAU); }
  g.fill();
  const sprigs = [[-82, -198, 12, -0.5], [-44, -274, 13, -0.2], [26, -282, 12, 0.3], [84, -194, 11, 0.6]];
  for (const [lx, ly, ls, la] of sprigs) drawMapleLeaf(g, lx, ly, ls, la, pal[2], 0.9);
  g.restore();
}

function drawRedBarn(g, x, baseY, t, scale = 1) {
  g.save();
  g.translate(x, baseY); g.scale(scale, scale);
  g.fillStyle = linG(g, 156, 0, 222, 0, [0, '#D4C3A3', 0.55, '#EFE2C6', 1, '#AE9774']);
  g.strokeStyle = INK; g.lineWidth = 2.4;
  g.fillRect(156, -278, 66, 278); g.strokeRect(156, -278, 66, 278);
  g.strokeStyle = 'rgba(56,28,14,0.34)'; g.lineWidth = 1.5;
  for (let ry = -236; ry <= -36; ry += 40) { g.beginPath(); g.moveTo(156, ry); g.lineTo(222, ry); g.stroke(); }
  g.fillStyle = radG(g, 180, -296, 6, 189, -278, 40, [0, '#B93424', 1, '#6C1710']);
  g.strokeStyle = INK; g.lineWidth = 2.4;
  g.beginPath(); g.arc(189, -278, 33, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = linG(g, -156, -260, 156, 0, [0, '#AD291D', 0.55, '#8A1C14', 1, '#62130D']);
  g.beginPath();
  g.moveTo(-156, 0); g.lineTo(-156, -186); g.lineTo(-104, -274); g.lineTo(0, -322);
  g.lineTo(104, -274); g.lineTo(156, -186); g.lineTo(156, 0); g.closePath();
  g.fill(); g.stroke();
  g.strokeStyle = 'rgba(42,14,9,0.26)'; g.lineWidth = 1.4;
  for (let px = -132; px <= 132; px += 22) { g.beginPath(); g.moveTo(px, -184); g.lineTo(px, 0); g.stroke(); }
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(-166, -180); g.lineTo(-108, -278); g.lineTo(0, -328); g.lineTo(108, -278); g.lineTo(166, -180);
  g.strokeStyle = '#F7EAD0'; g.lineWidth = 6.5; g.stroke();
  g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();
  dot(g, 0, -230, 82, radG(g, 0, -230, 8, 0, -230, 82, [0, `rgba(255,222,120,${0.48 + Math.sin(t * 4) * 0.06})`, 1, 'rgba(255,150,40,0)']));
  g.fillStyle = '#FFE493'; g.strokeStyle = '#F7EAD0'; g.lineWidth = 4;
  g.fillRect(-30, -260, 60, 56); g.strokeRect(-30, -260, 60, 56);
  g.strokeStyle = '#5D2C15'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -260); g.lineTo(0, -204); g.moveTo(-30, -232); g.lineTo(30, -232); g.stroke();
  g.fillStyle = '#58120C'; g.strokeStyle = '#F7EAD0'; g.lineWidth = 4;
  g.fillRect(-68, -142, 136, 142); g.strokeRect(-68, -142, 136, 142);
  g.beginPath();
  g.moveTo(0, -142); g.lineTo(0, 0); g.moveTo(-68, -142); g.lineTo(0, 0);
  g.moveTo(0, -142); g.lineTo(-68, 0); g.moveTo(0, -142); g.lineTo(68, 0); g.moveTo(68, -142); g.lineTo(0, 0);
  g.stroke();
  g.restore();
}

function drawWindmill(g, x, baseY, t, scale = 1) {
  g.save();
  g.translate(x, baseY); g.scale(scale, scale);
  g.strokeStyle = '#4B2413'; g.lineWidth = 4;
  g.beginPath();
  g.moveTo(-28, 0); g.lineTo(-8, -182); g.moveTo(28, 0); g.lineTo(8, -182);
  g.moveTo(-22, -46); g.lineTo(22, -46); g.moveTo(-16, -98); g.lineTo(16, -98); g.moveTo(-11, -146); g.lineTo(11, -146);
  g.stroke();
  g.translate(0, -184); g.rotate(t * 0.55);
  for (let i = 0; i < 10; i += 1) {
    g.rotate((TAU) / 10);
    g.fillStyle = '#E8BE7A'; g.strokeStyle = '#4B2413'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(54, -9); g.lineTo(58, 9); g.closePath(); g.fill(); g.stroke();
  }
  dot(g, 0, 0, 9, '#A8261B'); g.stroke();
  g.restore();
}

function drawOverheadTrusses(g, camX, t, darkWood = false) {
  const step = 420;
  const start = -((camX * 0.85) % step) - step;
  const beam = darkWood ? '#2B150B' : '#4E2411';
  const hi = darkWood ? '#4C2816' : '#7D3E1E';
  g.fillStyle = linG(g, 0, 0, 0, 40, [0, darkWood ? '#1E0E07' : '#3C1B0D', 1, beam]);
  g.fillRect(0, 0, W, 32);
  for (let bx = start; bx < W + step; bx += step) {
    g.strokeStyle = beam; g.lineWidth = 16;
    g.beginPath(); g.moveTo(bx, 18); g.lineTo(bx + 122, 138); g.moveTo(bx + step, 18); g.lineTo(bx + step - 122, 138); g.stroke();
    g.strokeStyle = hi; g.lineWidth = 3;
    g.beginPath(); g.moveTo(bx + 3, 22); g.lineTo(bx + 120, 136); g.stroke();
    const lx = bx + step * 0.5;
    const sway = Math.sin(t * 2.1 + bx * 0.01) * 5;
    const ly = 132;
    g.strokeStyle = INK; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(lx, 24); g.lineTo(lx + sway, ly); g.stroke();
    dot(g, lx + sway, ly + 10, 74, radG(g, lx + sway, ly + 10, 4, lx + sway, ly + 10, 74, [0, 'rgba(255,232,145,0.6)', 0.5, 'rgba(255,156,42,0.2)', 1, 'rgba(255,130,20,0)']));
    rBox(g, lx + sway - 9, ly, 18, 22, 5, '#FFE07A', '#3B1C0D', 2);
    g.fillStyle = '#4B2413';
    g.fillRect(lx + sway - 12, ly - 3, 24, 5); g.fillRect(lx + sway - 11, ly + 21, 22, 4);
  }
}

function drawRidge(g, camX, mult, baseY, amp1, amp2, freq1, freq2, color, bottomY = GY) {
  g.fillStyle = color;
  g.beginPath(); g.moveTo(0, bottomY);
  for (let x = 0; x <= W + 80; x += 56) {
    const wx = x + camX * mult;
    g.lineTo(x, baseY + Math.sin(wx * freq1) * amp1 + Math.cos(wx * freq2) * amp2);
  }
  g.lineTo(W, bottomY); g.closePath(); g.fill();
}

function drawFarmyardBackdrop(g, camX, t, isTitle = false) {
  g.fillStyle = linG(g, 0, 0, 0, GY, [0, '#6B2416', 0.28, '#B8441A', 0.62, '#E87E29', 1, '#F9C966']);
  g.fillRect(0, 0, W, GY);
  const sunX = isTitle ? 640 : 940 - ((camX * 0.04) % 240);
  const sunY = isTitle ? 368 : 228;
  drawSunRays(g, sunX, sunY, 14, 0.06, 760, 'rgba(255,236,168,0.11)');
  dot(g, sunX, sunY, 225, radG(g, sunX, sunY, 26, sunX, sunY, 225, [0, 'rgba(255,250,224,0.96)', 0.36, 'rgba(255,212,112,0.52)', 1, 'rgba(255,155,48,0)']));
  for (let i = 0; i < 6; i += 1) {
    const cx = ((i * 270 - camX * 0.08 + W * 2) % (W + 260)) - 130;
    const cy = 128 + (i % 3) * 44;
    g.fillStyle = linG(g, cx, cy - 28, cx, cy + 20, [0, 'rgba(255,236,192,0.34)', 1, 'rgba(176,68,28,0.16)']);
    g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.arc(cx + 38, cy - 10, 42, 0, TAU); g.arc(cx + 80, cy, 30, 0, TAU); g.fill();
  }
  drawRidge(g, camX, 0.14, 412, 50, 22, 0.0042, 0.009, '#9C3B19');
  drawRidge(g, camX, 0.28, 480, 38, 18, 0.0065, 0.014, '#7D2E15');
  const wmStep = 940;
  for (let wx = -((camX * 0.34) % wmStep) + 320; wx < W + 240; wx += wmStep) drawWindmill(g, wx, 524, t, 0.88);
  const treePals = [
    ['#681D13', '#B83A1C', '#F29F33'],
    ['#7A2C12', '#CC5A19', '#F7C948'],
    ['#5B1818', '#A62820', '#E86A28'],
  ];
  const treeStep = 268;
  const tStart = -((camX * 0.54) % treeStep) - treeStep;
  for (let i = 0, tx = tStart; tx < W + treeStep; i += 1, tx += treeStep) {
    drawStorybookTree(g, tx, GY - 12, 1.38 + (i % 3) * 0.18, treePals[i % 3]);
  }
  const barnStep = 980;
  const bStart = isTitle ? 148 : -((camX * 0.72) % barnStep) + 170;
  for (let bx = bStart; bx < W + 360; bx += barnStep) {
    drawRedBarn(g, bx, GY - 4, t, 1.06);
  }
  if (!isTitle) drawOverheadTrusses(g, camX, t, false);
  else {
    drawStorybookTree(g, 38, 418, 1.32, treePals[0]);
    drawStorybookTree(g, 1242, 418, 1.32, treePals[1]);
  }
  const fenceY = GY - 62;
  g.fillStyle = '#5D2F17';
  g.fillRect(0, fenceY + 14, W, 9); g.fillRect(0, fenceY + 38, W, 9);
  for (let fx = -((camX * 0.9) % 108) - 108; fx < W + 110; fx += 108) {
    g.fillStyle = '#4B2310'; g.fillRect(fx, fenceY, 15, 66);
    g.fillStyle = '#7E4523'; g.fillRect(fx + 2, fenceY + 2, 4, 62);
  }
  g.fillStyle = '#495E22'; g.fillRect(0, GY - 10, W, 13);
  g.fillStyle = linG(g, 0, GY, 0, H, [0, '#5A3019', 0.28, '#3B1E10', 1, '#1D0E07']);
  g.fillRect(0, GY, W, H - GY);
  g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, GY); g.lineTo(W, GY); g.stroke();
  for (let sx = -(camX % 140) - 140; sx < W + 140; sx += 140) {
    g.fillStyle = '#854B27'; g.beginPath(); g.ellipse(sx + 44, GY + 22, 14, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#D9641A'; g.beginPath(); g.ellipse(sx + 104, GY + 14, 9, 4, 0.25, 0, TAU); g.fill();
  }
}

function drawSmokehouseBackdrop(g, camX, t) {
  g.fillStyle = linG(g, 0, 0, 0, GY, [0, '#1B1C3A', 0.45, '#4A2636', 0.82, '#964226', 1, '#D87C32']);
  g.fillRect(0, 0, W, GY);
  for (let tx = -((camX * 0.35) % 240) - 240; tx < W + 240; tx += 240) {
    drawStorybookTree(g, tx, GY - 40, 1.12, ['#331920', '#702A22', '#C25B2A']);
  }
  for (let cx = -((camX * 0.72) % 360) - 360; cx < W + 360; cx += 360) {
    g.fillStyle = linG(g, cx, 0, cx + 44, 0, [0, '#24120A', 0.5, '#452313', 1, '#1E0E07']);
    g.fillRect(cx, 24, 44, GY - 24);
    dot(g, cx + 22, 256, 92, radG(g, cx + 22, 256, 4, cx + 22, 256, 92, [0, `rgba(255,196,86,${0.56 + Math.sin(t * 5 + cx) * 0.08})`, 1, 'rgba(255,120,24,0)']));
    rBox(g, cx + 14, 246, 16, 20, 4, '#FFD76E', null);
  }
  drawOverheadTrusses(g, camX, t, true);
  g.fillStyle = linG(g, 0, GY, 0, H, [0, '#4E4138', 0.35, '#2E241E', 1, '#18110D']);
  g.fillRect(0, GY, W, H - GY);
  g.strokeStyle = 'rgba(20,12,8,0.65)'; g.lineWidth = 2;
  for (let sx = -(camX % 128) - 128; sx < W + 128; sx += 128) g.strokeRect(sx, GY + 2, 126, 48);
}

function drawKitchenBackdrop(g, camX, t) {
  g.fillStyle = linG(g, 0, 0, 0, GY, [0, '#5E341D', 0.18, '#B88456', 0.55, '#EED6B0', 1, '#C79667']);
  g.fillRect(0, 0, W, GY);
  const tile = 64;
  const txOff = -((camX * 0.65) % (tile * 2));
  for (let row = 1; row < 8; row += 1) {
    for (let col = -1; col < W / tile + 3; col += 1) {
      g.fillStyle = ((row + col) & 1) === 0 ? 'rgba(255,244,220,0.44)' : 'rgba(186,118,64,0.28)';
      g.fillRect(txOff + col * tile, 42 + row * tile, tile, tile);
    }
  }
  const hoodStep = 320;
  for (let hx = -((camX * 0.72) % hoodStep) - hoodStep; hx < W + hoodStep; hx += hoodStep) {
    dot(g, hx + 80, 210, 210, radG(g, hx + 80, 148, 8, hx + 80, 220, 210, [0, `rgba(255,226,154,${0.3 + Math.sin(t * 3 + hx) * 0.04})`, 1, 'rgba(255,165,68,0)']));
    g.fillStyle = linG(g, hx + 24, 56, hx + 136, 134, [0, '#783316', 0.45, '#E6924A', 1, '#5D230D']);
    g.strokeStyle = INK; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(hx + 46, 72); g.lineTo(hx + 114, 72); g.lineTo(hx + 136, 132); g.lineTo(hx + 24, 132); g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = '#4B2412'; g.fillRect(hx + 188, 128, 108, 10);
    const jars = ['#C92A2A', '#D97706', '#2B8A5B', '#E88D2A'];
    for (let j = 0; j < 4; j += 1) rBox(g, hx + 196 + j * 24, 92, 18, 36, 4, jars[j], INK, 1.5);
  }
  const cabY = GY - 154;
  g.fillStyle = linG(g, 0, cabY, 0, GY, [0, '#7C4321', 1, '#48220F']);
  g.fillRect(0, cabY, W, 154);
  g.fillStyle = '#A86234'; g.fillRect(0, cabY, W, 10);
  g.strokeStyle = INK; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(0, cabY); g.lineTo(W, cabY); g.stroke();
  for (let cx = -((camX * 0.9) % 160) - 160; cx < W + 160; cx += 160) {
    g.strokeStyle = '#3A1A0B'; g.strokeRect(cx + 12, cabY + 20, 136, 120);
    dot(g, cx + 128, cabY + 78, 4.5, '#F0BE52');
  }
  const ft = 52;
  const fOff = -(camX % (ft * 2));
  for (let row = 0; row < 3; row += 1) {
    for (let col = -1; col < W / ft + 3; col += 1) {
      g.fillStyle = ((row + col) & 1) === 0 ? '#F3DFC1' : '#7E241C';
      g.fillRect(fOff + col * ft, GY + row * ft, ft, ft);
    }
  }
  g.strokeStyle = INK; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, GY); g.lineTo(W, GY); g.stroke();
}

export function drawAutumnBackdrop(g, state) {
  const t = state.screen === 'title' ? state.titleTime : state.elapsed;
  const k = state.stage.key;
  if (k === 'kitchen') drawKitchenBackdrop(g, state.cameraX, t);
  else if (k === 'smokehouse') drawSmokehouseBackdrop(g, state.cameraX, t);
  else drawFarmyardBackdrop(g, state.cameraX, t, state.screen === 'title');
}

export function drawPlatforms(g, platforms, t) {
  for (const p of platforms) {
    g.save();
    g.strokeStyle = INK; g.lineWidth = 2.2;
    if (p.kind === 'barrels') {
      const topY = p.y + p.h;
      const bH = GY - topY;
      for (const bx of [p.x + 14, p.x + p.w - 72]) {
        rBox(g, bx, topY, 58, bH, 10, linG(g, bx, topY, bx + 58, topY, [0, '#6B3418', 0.45, '#BA723A', 1, '#582810']), INK, 2.2);
        g.fillStyle = '#3B3634';
        g.fillRect(bx - 1, topY + bH * 0.24, 60, 7); g.fillRect(bx - 1, topY + bH * 0.72, 60, 7);
      }
      rBox(g, p.x - 4, p.y, p.w + 8, p.h, 6, linG(g, p.x, p.y, p.x, p.y + p.h, [0, '#E3A458', 1, '#8C4D1E']), INK, 2.2);
      g.fillStyle = 'rgba(255,244,210,0.45)'; g.fillRect(p.x + 6, p.y + 3, p.w - 12, 4);
    } else if (p.kind === 'tractor') {
      const bodyY = p.y + p.h;
      rBox(g, p.x + 12, bodyY, p.w - 30, 88, 12, linG(g, p.x, bodyY, p.x, bodyY + 88, [0, '#C92A2A', 1, '#7A1614']), INK, 2.2);
      g.fillStyle = '#2B2420'; g.fillRect(p.x + 32, bodyY + 18, 44, 34);
      g.fillStyle = '#3B3330'; g.fillRect(p.x + 28, p.y - 26, 12, 28);
      for (const [wx, wr] of [[p.x + 48, 34], [p.x + p.w - 46, 52]]) {
        dot(g, wx, GY - wr, wr, '#241B17'); g.stroke();
        dot(g, wx, GY - wr, wr * 0.48, '#E8A838'); g.stroke();
      }
      rBox(g, p.x, p.y, p.w, p.h, 6, linG(g, p.x, p.y, p.x, p.y + p.h, [0, '#F0533A', 1, '#9E1F18']), INK, 2.2);
    } else if (p.kind === 'pot_rack' || p.kind === 'pantry_shelf') {
      g.strokeStyle = '#6B4226'; g.lineWidth = 3; g.setLineDash([6, 4]);
      g.beginPath(); g.moveTo(p.x + 24, p.y); g.lineTo(p.x + 24, 96); g.moveTo(p.x + p.w - 24, p.y); g.lineTo(p.x + p.w - 24, 96); g.stroke();
      g.setLineDash([]);
      if (p.kind === 'pot_rack') {
        for (let k = 0; k < 3; k += 1) {
          const px = p.x + 42 + k * ((p.w - 84) / 2);
          const sway = Math.sin(t * 2.5 + k * 1.4) * 3;
          g.strokeStyle = '#2A140B'; g.lineWidth = 2.4;
          g.beginPath(); g.moveTo(px, p.y + p.h); g.lineTo(px + sway, p.y + p.h + 16); g.stroke();
          dot(g, px + sway, p.y + p.h + 32, 19, radG(g, px + sway - 6, p.y + p.h + 26, 4, px + sway, p.y + p.h + 32, 22, [0, '#F5A65B', 0.65, '#B85420', 1, '#5D230C'])); g.stroke();
        }
      }
      rBox(g, p.x, p.y, p.w, p.h, 6, linG(g, p.x, p.y, p.x, p.y + p.h, p.kind === 'pot_rack' ? [0, '#594C46', 1, '#261D19'] : [0, '#C78A4B', 1, '#7A451D']), INK, 2.2);
      g.fillStyle = p.kind === 'pot_rack' ? '#E5A856' : '#F4D39E'; g.fillRect(p.x + 8, p.y + 3, p.w - 16, 4);
    } else if (p.kind === 'butcher_block') {
      g.fillStyle = '#4B2412';
      g.fillRect(p.x + 16, p.y + p.h, 16, GY - p.y - p.h); g.fillRect(p.x + p.w - 32, p.y + p.h, 16, GY - p.y - p.h);
      g.fillStyle = '#6C391D'; g.fillRect(p.x + 28, p.y + 92, p.w - 56, 14);
      rBox(g, p.x, p.y, p.w, p.h + 8, 6, linG(g, p.x, p.y, p.x, p.y + p.h + 10, [0, '#F5D6A1', 0.6, '#D39B5A', 1, '#8C5327']), INK, 2.2);
      g.fillStyle = 'rgba(255,250,235,0.45)'; g.fillRect(p.x + 8, p.y + 3, p.w - 16, 4);
    } else {
      if (p.tier === 2) {
        g.strokeStyle = '#3B1B0D'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(p.x + 22, p.y + p.h); g.lineTo(p.x + 22, p.y - 120); g.moveTo(p.x + p.w - 22, p.y + p.h); g.lineTo(p.x + p.w - 22, p.y - 120); g.stroke();
      } else {
        g.fillStyle = '#4D2512';
        g.fillRect(p.x + 18, p.y + p.h, 14, GY - p.y - p.h); g.fillRect(p.x + p.w - 32, p.y + p.h, 14, GY - p.y - p.h);
      }
      rBox(g, p.x, p.y, p.w, p.h, 6, linG(g, p.x, p.y, p.x, p.y + p.h, p.kind === 'silo_awning' ? [0, '#C43828', 1, '#701810'] : [0, '#B97236', 1, '#5D2E15']), INK, 2.2);
      g.fillStyle = 'rgba(255,232,175,0.42)'; g.fillRect(p.x + 8, p.y + 3, p.w - 16, 4);
      g.fillStyle = '#EAB853';
      g.beginPath(); g.arc(p.x + 16, p.y + p.h * 0.55, 3.5, 0, TAU); g.arc(p.x + p.w - 16, p.y + p.h * 0.55, 3.5, 0, TAU); g.fill();
      if (p.kind === 'apple_basket') {
        rBox(g, p.x + p.w * 0.5 - 24, p.y + p.h + 4, 48, 28, 7, '#B87233', INK, 2);
        g.fillStyle = '#D62828';
        for (let a = -12; a <= 12; a += 12) { g.beginPath(); g.arc(p.x + p.w * 0.5 + a, p.y + p.h + 5, 7, 0, TAU); g.fill(); }
      }
    }
    g.restore();
  }
}

export function drawUpdraftVents(g, updrafts, t) {
  for (let i = 0; i < updrafts.length; i += 1) {
    const u = updrafts[i];
    const cx = u.x + u.w * 0.5;
    g.save();
    g.fillStyle = linG(g, cx, GY - 40, cx, u.y, [0, u.kind === 'stockpot' ? 'rgba(255,252,244,0.46)' : 'rgba(232,216,200,0.38)', 0.72, 'rgba(255,248,236,0.18)', 1, 'rgba(255,248,236,0)']);
    g.fillRect(u.x + 6, u.y, u.w - 12, u.h - 32);
    g.strokeStyle = 'rgba(255,252,244,0.72)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let s = 0; s < 3; s += 1) {
      const sy = GY - 56 - ((t * 135 + s * 115 + i * 40) % (u.h - 60));
      const sx = cx + Math.sin(sy * 0.03 + s * 2) * 18;
      g.beginPath(); g.moveTo(sx - 10, sy + 14); g.quadraticCurveTo(sx + 8, sy, sx - 6, sy - 16); g.stroke();
    }
    if (u.kind === 'stockpot') {
      rBox(g, u.x + 4, GY - 52, u.w - 8, 52, 10, linG(g, u.x, GY - 52, u.x + u.w, GY - 52, [0, '#7F3616', 0.45, '#E9944C', 1, '#58220C']), INK, 2.4);
      g.fillStyle = '#FFE4A1'; g.strokeStyle = INK; g.lineWidth = 2.2;
      g.beginPath(); g.ellipse(cx, GY - 50, u.w * 0.42, 8, 0, 0, TAU); g.fill(); g.stroke();
    } else {
      rBox(g, u.x + 8, GY - 46, u.w - 16, 46, 6, '#5D2B1D', INK, 2.4);
      g.fillStyle = '#FF922B'; g.fillRect(u.x + 18, GY - 38, u.w - 36, 10);
    }
    g.restore();
  }
}

export function drawStageExit(g, exit, stage, t) {
  g.save();
  if (exit.kind === 'window') {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = linG(g, exit.x + 20, exit.y + 30, exit.x - 290, GY, [0, 'rgba(186,228,255,0.44)', 0.55, 'rgba(170,214,255,0.16)', 1, 'rgba(140,190,255,0)']);
    g.beginPath(); g.moveTo(exit.x + 8, exit.y + 8); g.lineTo(exit.x + exit.w - 6, exit.y + exit.h);
    g.lineTo(exit.x - 160, GY); g.lineTo(exit.x - 320, GY); g.closePath(); g.fill();
    g.restore();
    rBox(g, exit.x, exit.y, exit.w, exit.h, 12, linG(g, exit.x, exit.y, exit.x, exit.y + exit.h, [0, '#0D2144', 0.55, '#29517F', 1, '#DE8D42']), '#FFF6DF', 5);
    dot(g, exit.x + exit.w * 0.62, exit.y + 46, 56, radG(g, exit.x + exit.w * 0.62, exit.y + 46, 8, exit.x + exit.w * 0.62, exit.y + 46, 56, [0, 'rgba(255,252,226,0.98)', 0.5, 'rgba(176,224,255,0.34)', 1, 'rgba(140,190,255,0)']));
    dot(g, exit.x + exit.w * 0.62, exit.y + 46, 18, '#FFFCE6');
    g.fillStyle = '#1E304B';
    g.beginPath(); g.moveTo(exit.x + 4, exit.y + exit.h - 4); g.quadraticCurveTo(exit.x + exit.w * 0.5, exit.y + exit.h - 46, exit.x + exit.w - 4, exit.y + exit.h - 4); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 2.6; roundRectPath(g, exit.x, exit.y, exit.w, exit.h, 12); g.stroke();
    rBox(g, exit.x - 14, exit.y + exit.h - 6, exit.w + 28, 18, 5, '#7A3E1D', INK, 2.4);
    g.fillStyle = '#C92A2A'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(exit.x + 4, exit.y + 4);
    g.quadraticCurveTo(exit.x + 22 + Math.sin(t * 5) * 6, exit.y + 78, exit.x - 16, exit.y + exit.h - 6);
    g.lineTo(exit.x + 4, exit.y + exit.h - 6); g.closePath(); g.fill(); g.stroke();
  } else {
    dot(g, exit.x + exit.w * 0.5, exit.y + exit.h * 0.45, 136, radG(g, exit.x + exit.w * 0.5, exit.y + exit.h * 0.45, 10, exit.x + exit.w * 0.5, exit.y + exit.h * 0.45, 136, [0, 'rgba(255,232,140,0.68)', 1, 'rgba(255,155,40,0)']));
    rBox(g, exit.x, exit.y, 18, exit.h, 4, '#5C2C14', INK, 2.4);
    rBox(g, exit.x + exit.w - 18, exit.y, 18, exit.h, 4, '#5C2C14', INK, 2.4);
    rBox(g, exit.x - 10, exit.y - 12, exit.w + 20, 24, 6, '#8F4C22', INK, 2.4);
  }
  const tagW = exit.w + 26;
  const tagX = exit.x - 13;
  const tagY = exit.y - 50 + Math.sin(t * 4.5) * 3;
  rBox(g, tagX, tagY, tagW, 34, 10, '#1D7A4C', '#FFFDF5', 2.4);
  g.fillStyle = '#FFFDF5'; g.font = `800 15px ${FNT}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(stage.id === 3 ? 'ESCAPE WINDOW ↗' : 'NEXT STAGE →', tagX + tagW * 0.5, tagY + 17);
  g.restore();
}

export function drawFreedomPanorama(g, t, drawHeroTurkey) {
  g.fillStyle = linG(g, 0, 0, 0, H, [0, '#0B1730', 0.38, '#1D375E', 0.72, '#6A4246', 1, '#D1813E']);
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#FFF8DC';
  for (let i = 0; i < 44; i += 1) {
    g.globalAlpha = 0.45 + 0.55 * Math.sin(t * 2.4 + i * 1.7);
    g.beginPath(); g.arc((i * 197 + 43) % W, 22 + ((i * 89) % 280), (i & 3) === 0 ? 2.4 : 1.4, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // Harvest Full Moon placed cleanly in the open sky between top-left title & right summary card!
  const mx = 468; const my = 224;
  dot(g, mx, my, 215, radG(g, mx, my, 36, mx, my, 215, [0, 'rgba(255,248,218,0.96)', 0.34, 'rgba(182,222,255,0.4)', 1, 'rgba(120,175,240,0)']));
  dot(g, mx, my, 54, '#FFFCE6');
  drawRidge(g, 0, 0, 424, 38, 16, 0.005, 0.011, '#1E2D49', H);
  drawRidge(g, 0, 0, 496, 26, 10, 0.007, 0.013, '#2B2330', H);
  g.save();
  g.translate(494, 488); g.scale(0.24, 0.24);
  drawRedBarn(g, 0, 0, t, 1);
  g.restore();
  g.fillStyle = linG(g, 0, 560, 0, H, [0, '#3C281E', 1, '#190E09']);
  g.beginPath();
  g.moveTo(0, 622); g.quadraticCurveTo(320, 558, 680, 648); g.lineTo(W, 675);
  g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
  drawStorybookTree(g, 64, 650, 1.48, ['#361412', '#8B2E1A', '#E57A28']);
  for (const px of [154, 344, 534]) {
    rBox(g, px, 514, 26, 218, 5, '#4B2512', INK, 2.5);
    g.fillStyle = '#7F4824'; g.fillRect(px + 4, 518, 6, 208);
  }
  for (const ry of [544, 604]) {
    rBox(g, 114, ry, 472, 20, 5, linG(g, 114, ry, 114, ry + 20, [0, '#A56333', 1, '#582B14']), INK, 2.5);
  }
  drawHeroTurkey(g, {
    x: 282, y: 440 + Math.sin(t * 3.4) * 3, w: 60, h: 66, facing: 1, grounded: true,
    fluttering: true, dashIframes: 0, hitInvuln: 0, hidden: false, squashX: 1, squashY: 1,
    runCycle: t * 8, gobbleTimer: 0.3, eyeTargetX: 480, eyeTargetY: 360, afterimages: [],
  }, t, { scale: 1.56, triumphant: true });
  for (let i = 0; i < 16; i += 1) {
    const fx = ((i * 93 + t * 28) % 600) + 22;
    const fy = 268 + Math.sin(t * 2.1 + i * 1.3) * 86 + (i % 4) * 62;
    dot(g, fx, fy, 11, radG(g, fx, fy, 1, fx, fy, 11, [0, 'rgba(255,244,160,0.92)', 1, 'rgba(255,200,70,0)']));
  }
}

export function drawStorybookFinish(g) {
  const pat = ensureGrainPattern(g);
  if (pat) { g.save(); g.fillStyle = pat; g.fillRect(0, 0, W, H); g.restore(); }
  g.fillStyle = radG(g, W * 0.5, H * 0.46, W * 0.35, W * 0.5, H * 0.5, W * 0.72, [0, 'rgba(0,0,0,0)', 1, 'rgba(24,10,4,0.32)']);
  g.fillRect(0, 0, W, H);
}
