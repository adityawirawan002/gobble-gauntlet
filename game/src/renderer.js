// Autumn storybook 2D Canvas renderer for Gobble Gauntlet.
import { MODES, PALETTES, SCREENS, STAGES, TURKEY_TUNING, UI_RECTS, VIEW } from './constants.js';
import { computeFarmerVisionCone, FARMER_STATES } from './farmer-ai.js';
const INK = PALETTES.ink;
const PARCH = PALETTES.parchment;
const VW = VIEW.width;
const VH = VIEW.height;
const GY = VIEW.groundY;
const TAU = Math.PI * 2;
const sf = (s, w = 900) => `${w} ${s}px "Georgia", serif`;
const sn = (s, w = 900) => `${w} ${s}px "Trebuchet MS", sans-serif`;
const roundRect = (g, x, y, w, h, r = 10) => {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
};
const fs = (g, fill, stroke = null, lw = 2.8) => {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
};
const gradL = (g, x0, y0, x1, y1, stops) => {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (let i = 0; i < stops.length; i += 1) gr.addColorStop(stops[i][0], stops[i][1]);
  return gr;
};
const gradR = (g, x0, y0, r0, x1, y1, r1, stops) => {
  const gr = g.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (let i = 0; i < stops.length; i += 1) gr.addColorStop(stops[i][0], stops[i][1]);
  return gr;
};
const glow = (g, x, y, r0, r1, stops) => circ(g, x, y, r1, gradR(g, x, y, r0, x, y, r1, stops));
const circ = (g, x, y, r, fill, stroke = null, lw = 2.6) => {
  g.beginPath(); g.arc(x, y, r, 0, TAU); fs(g, fill, stroke, lw);
};
const ell = (g, x, y, rx, ry, rot, fill, stroke = null, lw = 2.6) => {
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); fs(g, fill, stroke, lw);
};
const rr = (g, x, y, w, h, r, fill, stroke = null, lw = 2.8) => {
  roundRect(g, x, y, w, h, r); fs(g, fill, stroke, lw);
};
const box = (g, x, y, w, h, fill, stroke = null, lw = 2.6) => {
  if (fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeRect(x, y, w, h); }
};
const poly = (g, pts, fill, stroke = null, lw = 2.8) => {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); fs(g, fill, stroke, lw);
};
const seg = (g, pts, stroke, lw = 2.5) => {
  g.strokeStyle = stroke; g.lineWidth = lw;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
};
const txt = (g, s, x, y, font, fill, align = 'center', base = 'middle', stroke = null, lw = 0) => {
  g.font = font; g.textAlign = align; g.textBaseline = base;
  if (stroke && lw > 0) {
    g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = 'round';
    g.strokeText(s, x, y);
  }
  g.fillStyle = fill; g.fillText(s, x, y);
};

function drawRays(g, x, y, n, hw, len, fill) {
  g.save(); g.translate(x, y);
  for (let i = 0; i < n; i += 1) { g.rotate(TAU / n); poly(g, [[0, 0], [-hw, -len], [hw, -len]], fill); }
  g.restore();
}

function drawPlaque(g, x, y, w, h, fill = PARCH, border = INK, r = 12) {
  g.save();
  rr(g, x + 3, y + 5, w, h, r, 'rgba(22,10,5,0.42)');
  rr(g, x, y, w, h, r, fill, border, 3);
  rr(g, x + 4, y + 4, w - 8, h - 8, Math.max(4, r - 3), null, 'rgba(255,245,220,0.42)', 1.25);
  g.restore();
}

function drawButton(g, rect, label, sub, hovered, primary = true) {
  const { x, w, h } = rect;
  const y = rect.y + (hovered ? -2 : 0);
  g.save();
  rr(g, x + 3, y + 6, w, h, 14, 'rgba(20,9,4,0.56)');
  const stops = primary
    ? [[0, hovered ? '#F54B3D' : '#DC3522'], [1, hovered ? '#B82318' : '#9A1A12']]
    : [[0, hovered ? '#F9CA5A' : '#E7A93B'], [1, hovered ? '#CC7A1C' : '#B56717']];
  rr(g, x, y, w, h, 14, gradL(g, x, y, x, y + h, stops), INK, 3.5);
  rr(g, x + 4, y + 4, w - 8, h - 8, 10, null, primary ? 'rgba(255,226,175,0.58)' : 'rgba(255,248,220,0.68)', 1.8);
  if (primary) { g.shadowColor = 'rgba(30,10,4,0.65)'; g.shadowOffsetY = 2; }
  txt(g, label, x + w * 0.5, y + (sub ? h * 0.4 : h * 0.52), sf(sub ? 21 : 23), primary ? '#FFF8E7' : '#26120A');
  if (sub) {
    g.shadowOffsetY = 0;
    txt(g, sub, x + w * 0.5, y + h * 0.75, sn(12, 800), primary ? '#FFE3B0' : '#4A2411');
  }
  g.restore();
}

function drawMapleLeaf(g, x, y, s, ang, col, alpha = 1) {
  g.save();
  g.translate(x, y); g.rotate(ang); g.globalAlpha = alpha;
  poly(g, [
    [0, -s], [s * 0.42, -s * 0.48], [s * 0.85, -s * 0.35], [s * 0.52, s * 0.12],
    [s * 0.68, s * 0.56], [s * 0.14, s * 0.38], [0, s * 0.78], [-s * 0.14, s * 0.38],
    [-s * 0.68, s * 0.56], [-s * 0.52, s * 0.12], [-s * 0.85, -s * 0.35], [-s * 0.42, -s * 0.48],
  ], col, INK, 1.4);
  g.restore();
}

function drawPumpkin(g, x, y, r = 18, shade = '#E86A17') {
  g.save(); g.translate(x, y);
  ell(g, -r * 0.42, 0, r * 0.64, r * 0.78, 0, shade, INK, 2.2);
  ell(g, r * 0.42, 0, r * 0.64, r * 0.78, 0, shade, INK, 2.2);
  ell(g, 0, 1, r * 0.58, r * 0.82, 0, '#F77F1E', INK, 2.3);
  ell(g, -r * 0.16, -r * 0.18, r * 0.16, r * 0.34, -0.2, 'rgba(255,232,175,0.38)');
  poly(g, [[-3, -r * 0.72], [3, -r * 0.72], [6, -r * 1.16], [-1, -r * 1.1]], '#3B6E22', INK, 2);
  g.restore();
}

function drawWindmill(g, x, baseY, t, scale = 1) {
  g.save(); g.translate(x, baseY); g.scale(scale, scale);
  g.strokeStyle = '#522712'; g.lineWidth = 3.2; g.beginPath();
  g.moveTo(-22, 0); g.lineTo(-6, -124); g.moveTo(22, 0); g.lineTo(6, -124);
  for (let i = 0; i < 4; i += 1) {
    const y1 = -24 - i * 26; const w1 = 19 - i * 3.5;
    g.moveTo(-w1, y1); g.lineTo(w1, y1);
    g.moveTo(-w1, y1); g.lineTo(w1 - 3, y1 - 24);
    g.moveTo(w1, y1); g.lineTo(-w1 + 3, y1 - 24);
  }
  g.stroke();
  g.translate(0, -128); g.rotate(t * 0.85);
  for (let i = 0; i < 8; i += 1) {
    g.rotate(Math.PI / 4);
    poly(g, [[-2, -6], [5, -6], [10, -40], [-3, -40]], '#D99B52', '#3B1B0D', 1.6);
  }
  circ(g, 0, 0, 8, '#B22422', INK, 2);
  g.restore();
}

function drawRedBarn(g, x, baseY, t = 0, scale = 1) {
  g.save(); g.translate(x, baseY); g.scale(scale, scale);
  box(g, 195, -198, 56, 198, '#E6D6BC', INK, 3);
  box(g, 233, -198, 18, 198, 'rgba(130,88,55,0.2)');
  g.beginPath(); g.arc(223, -198, 28, Math.PI, 0); g.closePath(); fs(g, '#9E2A2B', INK, 3);
  for (let y = -168; y < 0; y += 30) seg(g, [[195, y], [251, y]], 'rgba(38,20,13,0.35)', 2);
  poly(g, [[0, 0], [0, -118], [34, -180], [104, -214], [174, -180], [208, -118], [208, 0]], '#B22422', INK, 3.5);
  for (let px = 20; px < 196; px += 20) seg(g, [[px, -114], [px, 0]], 'rgba(65,12,10,0.28)', 1.6);
  seg(g, [[-6, -116], [34, -182], [104, -216], [174, -182], [214, -116]], '#F7EAD2', 5);
  const rad = 72 * (0.88 + Math.sin(t * 4) * 0.12);
  glow(g, 104, -148, 8, rad, [[0, 'rgba(255,232,130,0.62)'], [1, 'rgba(255,165,45,0)']]);
  box(g, 82, -166, 44, 36, '#FFE08A', '#F7EAD2', 3);
  seg(g, [[104, -166], [104, -152]], INK, 2);
  rr(g, 98, -152, 12, 14, 3, '#FFF3BF', INK, 1.8);
  box(g, 60, -96, 88, 96, '#8A1A18', '#F7EAD2', 4);
  g.strokeStyle = '#F7EAD2'; g.lineWidth = 4; g.beginPath();
  g.moveTo(104, -96); g.lineTo(104, 0);
  g.moveTo(60, -96); g.lineTo(104, 0); g.moveTo(104, -96); g.lineTo(60, 0);
  g.moveTo(104, -96); g.lineTo(148, 0); g.moveTo(148, -96); g.lineTo(104, 0);
  g.stroke();
  g.restore();
}

export function drawAutumnBackdrop(g, state) {
  const t = state.screen === SCREENS.TITLE ? state.titleTime : state.elapsed;
  if (state.stage.key === 'farmyard') drawFarmyardBackdrop(g, state.cameraX, t, state.screen === SCREENS.TITLE);
  else if (state.stage.key === 'smokehouse') drawSmokehouseBackdrop(g, state.cameraX, t);
  else drawKitchenBackdrop(g, state.cameraX, t);
}

function drawFarmyardBackdrop(g, camX, t, isTitle = false) {
  const gy = isTitle ? 612 : GY;
  box(g, 0, 0, VW, gy, gradL(g, 0, 0, 0, gy, [[0, '#852A0E'], [0.32, '#D95E1E'], [0.7, '#F5B342'], [1, '#FDE9A8']]));
  const sunX = isTitle ? 640 : 960 - (camX * 0.05) % 240;
  const sunY = isTitle ? 338 : 168;
  drawRays(g, sunX, sunY, 12, 28, 560, gradL(g, 0, 0, 0, -560, [[0, 'rgba(255,246,195,0.22)'], [1, 'rgba(255,215,110,0)']]));
  const hr = isTitle ? 310 : 255;
  glow(g, sunX, sunY, 26, hr, [[0, 'rgba(255,252,218,0.96)'], [0.32, 'rgba(255,224,130,0.56)'], [1, 'rgba(255,165,50,0)']]);
  circ(g, sunX, sunY, isTitle ? 68 : 54, '#FFF9DB');
  g.fillStyle = 'rgba(255,240,200,0.38)';
  for (let i = 0; i < 6; i += 1) {
    const cx = ((i * 290 - camX * 0.08 + t * 8) % (VW + 260)) - 130;
    const cy = 94 + (i % 3) * 44;
    g.beginPath();
    g.ellipse(cx, cy, 74, 21, 0, 0, TAU);
    g.ellipse(cx + 38, cy - 10, 48, 19, 0, 0, TAU);
    g.ellipse(cx - 40, cy + 4, 42, 15, 0, 0, TAU);
    g.fill();
  }
  g.fillStyle = '#C45B22'; g.beginPath(); g.moveTo(0, gy);
  for (let x = 0; x <= VW + 60; x += 36) {
    g.lineTo(x, gy - ((isTitle ? 210 : 172) + Math.sin((x + camX * 0.14) * 0.0048) * 44 + Math.cos((x + camX * 0.14) * 0.01) * 18));
  }
  g.lineTo(VW, gy); g.closePath(); g.fill();
  for (let i = 0; i < 26; i += 1) {
    const px = ((i * 64 - camX * 0.14) % (VW + 120) + VW + 120) % (VW + 120) - 60;
    const base = gy - ((isTitle ? 210 : 172) + Math.sin((px + camX * 0.14) * 0.0048) * 44 + Math.cos((px + camX * 0.14) * 0.01) * 18) + 6;
    if (i % 3 === 0) poly(g, [[px, base - 34], [px - 15, base + 4], [px + 15, base + 4]], '#B84D1B');
    else circ(g, px, base - 10, 15, '#C45B22');
  }
  box(g, 0, gy - 200, VW, 120, gradL(g, 0, gy - 200, 0, gy - 80, [[0, 'rgba(255,224,145,0)'], [0.6, 'rgba(255,224,145,0.2)'], [1, 'rgba(255,224,145,0)']]));
  g.fillStyle = '#8C3B14'; g.beginPath(); g.moveTo(0, gy);
  for (let x = 0; x <= VW + 60; x += 32) {
    g.lineTo(x, gy - ((isTitle ? 124 : 98) + Math.sin((x + camX * 0.26 + 140) * 0.0064) * 32));
  }
  g.lineTo(VW, gy); g.closePath(); g.fill();
  if (isTitle) {
    drawWindmill(g, 1020, gy - 110, t, 1.05);
    drawRedBarn(g, 32, gy - 48, t, 1.16);
  } else {
    const wmX = 560 - (camX * 0.3) % 1400;
    drawWindmill(g, wmX < -80 ? wmX + 1400 : wmX, gy - 102, t, 0.88);
    for (let b = 0; b < 3; b += 1) {
      const bx = 135 + b * 1060 - camX * 0.42;
      if (bx > -340 && bx < VW + 180) drawRedBarn(g, bx, gy - 46, t, 1);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    const tx = ((i * 235 + 480 - camX * 0.34) % (VW + 260) + VW + 260) % (VW + 260) - 130;
    if (isTitle && tx > 240 && tx < 980) continue;
    const by = gy - 54;
    box(g, tx - 6, by - 56, 12, 62, '#4B2412');
    const col = ['#C92A2A', '#D9480F', '#EB8817'][i % 3];
    circ(g, tx, by - 70, 35, col); circ(g, tx - 24, by - 52, 24, col); circ(g, tx + 24, by - 50, 24, col);
    circ(g, tx - 8, by - 78, 16, 'rgba(255,224,130,0.25)');
  }
  const cornShift = (camX * 0.62) % 38;
  g.strokeStyle = '#C98A1C'; g.lineWidth = 3.8;
  for (let x = -cornShift; x < VW + 38; x += 38) {
    const sw = Math.sin(t * 2.5 + x * 0.04) * 5;
    g.beginPath(); g.moveTo(x, gy - 12); g.quadraticCurveTo(x + sw * 0.5, gy - 58, x + sw, gy - 94); g.stroke();
    ell(g, x + sw * 0.7 + 4, gy - 64, 5, 11, 0.3, '#F2C14E');
  }
  const fenceOff = (camX * 0.78) % 120;
  box(g, 0, gy - 46, VW, 9, '#6C3D1E', INK, 2);
  box(g, 0, gy - 24, VW, 9, '#6C3D1E', INK, 2);
  for (let x = -fenceOff; x < VW + 120; x += 120) {
    box(g, x, gy - 62, 14, 62, '#5C3116', INK, 2);
    if (!isTitle && Math.floor((x + fenceOff) / 120) % 4 === 1) drawPumpkin(g, x + 56, gy - 14, 13, '#DF5E14');
  }
  box(g, 0, gy - 8, VW, 13, '#5E7A26');
  box(g, 0, gy, VW, VH - gy, gradL(g, 0, gy, 0, VH, [[0, '#854E26'], [0.28, '#5E3217'], [1, '#33170A']]));
  seg(g, [[0, gy], [VW, gy]], INK, 3.5);
  for (let x = -(camX % 96); x < VW + 96; x += 96) {
    ell(g, x + 28, gy + 26, 22, 6, 0, 'rgba(255,224,150,0.14)');
    ell(g, x + 68, gy + 18, 8, 4, 0.25, '#D95D1E');
  }
}

function drawSmokehouseBackdrop(g, camX, t) {
  box(g, 0, 0, VW, GY, gradL(g, 0, 0, 0, GY, [[0, '#24110A'], [0.55, '#4A2515'], [1, '#68351C']]));
  const shift = (camX * 0.55) % 280;
  for (let x = -shift; x < VW + 280; x += 280) {
    g.beginPath(); g.arc(x + 140, 310, 86, Math.PI, 0);
    g.lineTo(x + 226, GY); g.lineTo(x + 54, GY); g.closePath();
    fs(g, '#21100A', '#7F3F20', 5);
    const sway = Math.sin(t * 2.1 + x * 0.02) * 5;
    seg(g, [[x + 42, 96], [x + 42 + sway * 0.5, 168]], INK, 2.6);
    ell(g, x + 42 + sway * 0.5, 186, 17, 24, 0.08, '#9C4221', INK, 2.5);
    ell(g, x + 42 + sway * 0.5, 182, 9, 13, 0.08, 'rgba(255,220,180,0.24)');
    const lx = x + 140 + sway; const ly = 214;
    seg(g, [[x + 140, 110], [lx, ly]], INK, 2.6);
    poly(g, [[lx - 10, ly + 22], [lx + 10, ly + 22], [lx + 115, GY], [lx - 115, GY]], gradL(g, lx, ly, lx, GY, [[0, 'rgba(255,224,128,0.34)'], [1, 'rgba(255,145,30,0)']]));
    glow(g, lx, ly + 12, 8, 145, [[0, 'rgba(255,224,130,0.58)'], [1, 'rgba(255,135,30,0)']]);
    rr(g, lx - 11, ly, 22, 26, 6, '#FFE066', INK, 2.5);
    rr(g, x + 76, GY - 92, 58, 92, 12, '#733B1D', INK, 2.6);
    box(g, x + 76, GY - 70, 58, 7, '#3B2820');
    box(g, x + 76, GY - 26, 58, 7, '#3B2820');
  }
  box(g, 0, 0, VW, 96, '#381B0F');
  seg(g, [[0, 96], [VW, 96]], INK, 3);
  box(g, 0, GY, VW, VH - GY, '#4A362C');
  const off = camX % 84;
  for (let row = 0; row < 3; row += 1) {
    for (let x = -off - row * 34; x < VW + 84; x += 84) {
      rr(g, x + 2, GY + 4 + row * 36, 78, 30, 7, (row + Math.floor(x / 84)) % 2 === 0 ? '#5C4438' : '#4E392F', INK, 2.5);
    }
  }
}

function drawKitchenBackdrop(g, camX, t) {
  box(g, 0, 0, VW, GY, gradL(g, 0, 0, 0, GY, [[0, '#F5E4C4'], [0.62, '#E5C392'], [1, '#CE9E68']]));
  const tileOff = (camX * 0.65) % 64;
  for (let y = 104; y < GY - 126; y += 64) {
    for (let x = -tileOff; x < VW + 64; x += 64) {
      box(g, x, y, 64, 64, (Math.floor((x + tileOff) / 64) + Math.floor(y / 64)) % 2 === 0 ? 'rgba(255,249,236,0.45)' : 'rgba(217,123,58,0.16)', 'rgba(130,68,28,0.22)', 1.5);
    }
  }
  const cy = GY - 126;
  box(g, 0, cy, VW, 126, gradL(g, 0, cy, 0, GY, [[0, '#7D421E'], [1, '#582B11']]));
  box(g, 0, cy - 10, VW, 16, '#C98A4B');
  seg(g, [[0, cy - 10], [VW, cy - 10]], INK, 3);
  seg(g, [[0, cy + 6], [VW, cy + 6]], INK, 3);
  for (let x = -((camX * 0.72) % 340); x < VW + 340; x += 340) {
    [16, 178].forEach((ox) => {
      rr(g, x + ox, cy + 18, 144, 96, 6, '#6B3616', '#3D1D0B', 2.4);
      rr(g, x + ox + 10, cy + 28, 124, 76, 4, null, 'rgba(255,224,170,0.16)', 1.5);
      circ(g, x + ox + 124, cy + 66, 5, '#F4B43A', INK, 1.8);
    });
    poly(g, [[x + 36, cy - 10], [x + 116, cy - 10], [x + 106, cy - 24], [x + 46, cy - 24]], '#E5A95C', INK, 2.2);
    ell(g, x + 76, cy - 24, 34, 7, 0, '#D95D1E', INK, 2);
    rr(g, x + 220, cy - 40, 56, 30, 6, '#D97736', INK, 2.4);
    box(g, x + 228, cy - 35, 10, 18, 'rgba(255,238,210,0.45)');
    g.strokeStyle = 'rgba(255,252,240,0.58)'; g.lineWidth = 3;
    for (let s = 0; s < 3; s += 1) {
      const sx = x + 234 + s * 14; const wv = Math.sin(t * 3.5 + s * 1.4 + x * 0.01) * 7;
      g.beginPath(); g.moveTo(sx, cy - 46); g.quadraticCurveTo(sx + wv, cy - 72, sx - wv * 0.6, cy - 98); g.stroke();
    }
  }
  box(g, 0, 96, VW, 13, '#4B2412', INK, 2.6);
  for (let x = -((camX * 0.58) % 360); x < VW + 360; x += 360) {
    const sw = Math.sin(t * 1.9 + x * 0.02) * 3.5;
    poly(g, [[x + 242, 108], [x + 314, 108], [x + 338, 178], [x + 218, 178]], gradL(g, x + 220, 108, x + 340, 108, [[0, '#9E481B'], [0.45, '#F2A359'], [1, '#7D3512']]), INK, 2.8);
    rr(g, x + 214, 172, 128, 12, 4, '#D97B38', INK, 2.4);
    rr(g, x + 16, 170, 114, 11, 3, '#6B3416', INK, 2.2);
    ['#D62828', '#F08C00', '#2B8A5B', '#E8B339'].forEach((c, j) => rr(g, x + 24 + j * 25, 138, 18, 32, 4, c, INK, 2));
    seg(g, [[x + 158, 109], [x + 158 + sw, 152]], INK, 2.6);
    circ(g, x + 158 + sw, 180, 27, gradR(g, x + 152 + sw, 172, 4, x + 158 + sw, 180, 29, [[0, '#FFE0B8'], [0.55, '#D97736'], [1, '#8C3B14']]), INK, 2.8);
    seg(g, [[x + 196, 109], [x + 196 - sw * 0.7, 156]], INK, 2.6);
    circ(g, x + 192 - sw * 0.7, 152, 7, '#FFF8E7', INK, 1.8);
    circ(g, x + 201 - sw * 0.7, 160, 7, '#FFF8E7', INK, 1.8);
    circ(g, x + 194 - sw * 0.7, 168, 7, '#F5E6C8', INK, 1.8);
    ell(g, x + 204 - sw * 0.7, 146, 5, 11, 0.35, '#2B8A5B', INK, 1.6);
  }
  const fOff = camX % 96;
  for (let row = 0; row < 3; row += 1) {
    for (let x = -fOff; x < VW + 96; x += 96) {
      const idx = Math.floor((x + fOff) / 96);
      box(g, x, GY + row * 42, 96, 42, (idx + row) % 2 === 0 ? '#DCA168' : '#8C3E23', 'rgba(36,18,10,0.32)', 1.5);
    }
  }
  seg(g, [[0, GY], [VW, GY]], INK, 4);
}

export function drawStageExit(g, exit, stage, t) {
  const { x, y, w, h } = exit;
  g.save();
  if (exit.kind === 'window') {
    poly(g, [[x + 6, y + 8], [x + w - 6, y + 8], [x - 95, GY], [x - 265, GY]], gradL(g, x, y, x - 240, GY, [[0, 'rgba(255,245,185,0.62)'], [0.55, 'rgba(255,212,105,0.25)'], [1, 'rgba(255,200,90,0)']]));
    rr(g, x, y, w, h, 10, gradL(g, x, y, x, y + h, [[0, '#3D7EA6'], [0.48, '#F4A236'], [1, '#FCE7A2']]), '#FFF5DC', 6);
    rr(g, x - 3, y - 3, w + 6, h + 6, 12, null, INK, 3);
    g.save(); roundRect(g, x + 4, y + 4, w - 8, h - 8, 6); g.clip();
    circ(g, x + w * 0.35, y + 44, 19, '#FFF9DB');
    g.fillStyle = '#D96B1C'; g.beginPath(); g.arc(x + w * 0.72, y + h + 16, 68, Math.PI, 0); g.fill();
    g.fillStyle = '#9E3D16'; g.beginPath(); g.arc(x + w * 0.22, y + h + 28, 54, Math.PI, 0); g.fill();
    g.restore();
    const fl = Math.sin(t * 5.2) * 9;
    g.beginPath(); g.moveTo(x - 6, y - 6);
    g.quadraticCurveTo(x + 24 + fl, y + 50, x + 8 + fl * 0.5, y + h - 8);
    g.lineTo(x - 18, y + h - 18); g.closePath(); fs(g, '#C92A2A', INK, 2.5);
    rr(g, x - 16, y + h - 4, w + 32, 18, 5, '#7F4420', INK, 2.6);
    const bob = Math.sin(t * 5) * 6;
    drawPlaque(g, x - 16, y - 58 + bob, w + 32, 40, '#2B8A5B', INK, 10);
    txt(g, 'ESCAPE! ↗', x + w * 0.5, y - 38 + bob, sn(17), '#FFF8E7');
  } else {
    rr(g, x, y, w, h, 14, '#592C14', INK, 3.5);
    rr(g, x + 14, y + 18, w - 28, h - 18, 10, gradR(g, x + w * 0.5, y + h * 0.55, 8, x + w * 0.5, y + h * 0.55, 84, [[0, '#FFF3BF'], [0.55, '#F59F00'], [1, '#4A200E']]), INK, 3);
    const bob = Math.sin(t * 4.5) * 5;
    drawPlaque(g, x - 16, y - 48 + bob, w + 32, 36, '#F4B43A', INK, 10);
    txt(g, stage.id === 1 ? 'SMOKEHOUSE →' : 'KITCHEN →', x + w * 0.5, y - 30 + bob, sn(15), INK);
  }
  g.restore();
}

export function drawRoastingOven(g, oven, t) {
  const { x, y, w, h, state } = oven;
  g.save();
  if (state === 'erupting' || state === 'telegraph') {
    const rad = (state === 'erupting' ? 148 : 96) * (0.88 + Math.sin(t * 18) * 0.12);
    const stops = state === 'erupting'
      ? [[0, 'rgba(255,224,102,0.78)'], [0.55, 'rgba(255,90,20,0.42)'], [1, 'rgba(255,70,10,0)']]
      : [[0, 'rgba(255,169,77,0.45)'], [0.55, 'rgba(255,110,20,0.14)'], [1, 'rgba(255,70,10,0)']];
    glow(g, x + w * 0.5, y + h * 0.35, 16, rad, stops);
  }
  box(g, x + w * 0.68, y - 34, 24, 44, '#3B2F2F', INK, 3);
  box(g, x + w * 0.63, y - 40, 34, 9, '#3B2F2F', INK, 3);
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + 46);
  g.arc(x + w * 0.5, y + 46, w * 0.5, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
  fs(g, '#9C3D24', INK, 3);
  for (let row = 0; row < 4; row += 1) seg(g, [[x + 8, y + 34 + row * 21], [x + w - 8, y + 34 + row * 21]], 'rgba(38,18,10,0.45)', 2);
  rr(g, x - 6, y + h - 20, w + 12, 20, 5, '#6C584C', INK, 3);
  const mx = x + 22; const my = y + 44; const mw = w - 44; const mh = h - 62;
  const fStops = state === 'erupting'
    ? [[0, '#FFF9DB'], [0.45, '#FFA94D'], [1, '#E03131']]
    : state === 'telegraph'
      ? [[0, '#FFE066'], [0.6, '#FF6B2B'], [1, '#8C1D18']]
      : [[0, '#D9480F'], [0.6, '#5C1B10'], [1, '#26110C']];
  g.beginPath(); g.moveTo(mx, my + mh); g.lineTo(mx, my + 26);
  g.arc(mx + mw * 0.5, my + 26, mw * 0.5, Math.PI, 0); g.lineTo(mx + mw, my + mh); g.closePath();
  fs(g, gradL(g, mx, my, mx, my + mh, fStops), '#2B211E', 4);
  for (let c = 0; c < 4; c += 1) circ(g, mx + 12 + c * 15, my + mh - 5, 5, state === 'idle' ? '#D9480F' : '#FFE066');
  for (let i = 1; i <= 3; i += 1) seg(g, [[mx + (mw / 4) * i, my + mh - 18], [mx + (mw / 4) * i, my + mh]], INK, 2.5);
  if (state === 'telegraph') {
    g.globalAlpha = 0.55 + Math.sin(t * 22) * 0.45;
    drawPlaque(g, x + 12, y - 36, w - 24, 28, '#FF922B', INK, 8);
    txt(g, '▲ ROAST! ▲', x + w * 0.5, y - 22, sn(13), INK);
    g.globalAlpha = 1;
  }
  if (state === 'erupting') {
    const flick = Math.sin(t * 32) * 10;
    [[-16, 76 + flick, 38, '#F03E3E'], [18, 84 - flick * 0.7, 42, '#FF6B2B'], [0, 96 + flick * 0.5, 48, '#FF922B']].forEach(([ox, fh, fw, col]) => {
      const fx = x + w * 0.5 + ox; const fy = y + 36;
      g.beginPath(); g.moveTo(fx - fw * 0.5, fy + 24);
      g.quadraticCurveTo(fx - fw * 0.55, fy - fh * 0.45, fx, fy - fh);
      g.quadraticCurveTo(fx + fw * 0.55, fy - fh * 0.45, fx + fw * 0.5, fy + 24);
      g.closePath(); fs(g, col, INK, 2.5);
    });
    g.beginPath(); g.moveTo(x + w * 0.5 - 22, y + 48);
    g.quadraticCurveTo(x + w * 0.5 - 16, y - 16, x + w * 0.5, y - 36 + flick * 0.4);
    g.quadraticCurveTo(x + w * 0.5 + 16, y - 16, x + w * 0.5 + 22, y + 48);
    g.closePath(); fs(g, '#FFF3BF');
  }
  g.restore();
}

export function drawCoverProp(g, cover) {
  const { x, y, w, h, kind } = cover;
  g.save();
  if (kind === 'hay') {
    rr(g, x, y + 6, w, h - 6, 10, gradL(g, x, y, x, y + h, [[0, '#F5C445'], [1, '#C4841D']]), INK, 3);
    seg(g, [[x + 22, y + 6], [x + 22, y + h]], '#5C2C10', 4);
    seg(g, [[x + w - 22, y + 6], [x + w - 22, y + h]], '#5C2C10', 4);
    for (let i = 0; i < 6; i += 1) seg(g, [[x + 10 + i * 15, y + 14 + (i % 2) * 18], [x + 20 + i * 15, y + 8 + (i % 2) * 18]], '#FFE082', 2.2);
  } else if (kind === 'crate') {
    circ(g, x + 28, y + 14, 18, '#E86A17', INK, 2.8);
    circ(g, x + 64, y + 12, 20, '#E86A17', INK, 2.8);
    rr(g, x, y + 14, w, h - 14, 6, '#8B4F24', INK, 3);
    seg(g, [[x + 4, y + 34], [x + w - 4, y + 34]], '#4A2511', 2.5);
    seg(g, [[x + 4, y + 52], [x + w - 4, y + 52]], '#4A2511', 2.5);
  } else {
    rr(g, x + 6, y + 10, w - 12, h - 10, 12, gradL(g, x, y, x + w, y, [[0, '#9E481B'], [0.32, '#F29F58'], [0.55, '#FFD9B3'], [0.85, '#C46227'], [1, '#783412']]), INK, 3);
    rr(g, x + 2, y + 4, w - 4, 12, 5, '#E89B54', INK, 2.8);
    g.strokeStyle = '#F4B43A'; g.lineWidth = 4;
    g.beginPath(); g.arc(x + 4, y + 32, 9, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.arc(x + w - 4, y + 32, 9, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
  }
  g.restore();
}

export function drawCoverPrompt(g, cover, isHiddenHere, t) {
  const pw = isHiddenHere ? 104 : 92;
  const px = cover.x + (cover.w - pw) * 0.5;
  const py = cover.y - 44 + Math.sin(t * 6) * 3;
  drawPlaque(g, px, py, pw, 26, isHiddenHere ? PALETTES.sageStealth : PARCH, INK, 8);
  txt(g, isHiddenHere ? 'HIDDEN ✓' : '[E] HIDE', px + pw * 0.5, py + 13, sn(12), isHiddenHere ? '#FFFDF5' : INK);
}

export function drawBouncePad(g, pad) {
  const { x, y, w, h, squash } = pad;
  g.save(); g.translate(x + w * 0.5, y + h); g.scale(1 + squash * 0.18, 1 - squash * 0.34);
  poly(g, [[-w * 0.44, 0], [-w * 0.5, -h * 0.68], [w * 0.5, -h * 0.68], [w * 0.44, 0]], '#B07436', INK, 3);
  for (let i = -2; i <= 2; i += 1) {
    const cx = i * 12; const cy = -h * 0.78 - (2 - Math.abs(i)) * 4;
    circ(g, cx, cy, 10, '#D62828', INK, 2.8); circ(g, cx - 3, cy - 3, 2.8, '#FFC9C9');
  }
  g.restore();
}

export function drawGravyPuddle(g, p) {
  g.save();
  ell(g, p.x + p.w * 0.5, p.y + p.h * 0.65, p.w * 0.5, p.h * 0.55, 0, '#5C3317', INK, 2.5);
  ell(g, p.x + p.w * 0.44, p.y + p.h * 0.55, p.w * 0.34, p.h * 0.25, 0, '#8C5328');
  for (let i = 0; i < 3; i += 1) circ(g, p.x + 32 + i * 38, p.y + p.h * 0.48, 3.5 + Math.abs(Math.sin(p.bubblePhase + i * 1.4)) * 4.5, '#A8693B', INK, 2.2);
  g.restore();
}

export function drawPickup(g, p) {
  if (p.collected) return;
  g.save(); g.translate(p.x, p.y + Math.sin(p.bobPhase) * 6);
  glow(g, 0, 0, 3, 26, [[0, p.kind === 'corn' ? 'rgba(255,228,100,0.72)' : 'rgba(255,100,100,0.72)'], [1, 'rgba(255,200,50,0)']]);
  if (p.kind === 'corn') {
    g.rotate(-0.28);
    ell(g, 0, -2, 9.5, 16, 0, '#F7C948', INK, 2.6);
    [-8, 0, 8].forEach((ky) => seg(g, [[-6.5, ky], [6.5, ky]], '#C98A1C', 1.4));
    [-1, 1].forEach((d) => {
      g.beginPath(); g.moveTo(d * 10, 4); g.quadraticCurveTo(d * 15, 15, d * 2, 16); g.lineTo(0, 8); g.closePath();
      fs(g, '#40914C', INK, 2.2);
    });
  } else {
    [[-6, 3], [6, 3], [0, -5]].forEach(([ox, oy]) => {
      circ(g, ox, oy, 8.5, '#E03131', INK, 2.5); circ(g, ox - 2.5, oy - 2.5, 2.3, '#FFE3E3');
    });
    ell(g, 5, -13, 7, 4, -0.4, '#2B8A5B', INK, 2.2);
  }
  g.restore();
}

export function drawAcornDecoy(g, d) {
  g.save(); g.translate(d.x, d.y);
  glow(g, 0, 0, 4, 32, [[0, 'rgba(255,224,102,0.68)'], [1, 'rgba(255,200,50,0)']]);
  ell(g, 0, 3, 10.5, 11.5, 0, '#B86B27', INK, 2.6);
  g.beginPath(); g.arc(0, -2, 11.5, Math.PI, 0); g.closePath(); fs(g, '#5C2C10', INK, 2.6);
  seg(g, [[0, -13], [3, -19]], INK, 2.6);
  g.restore();
}

export function drawCarvingKnife(g, knife) {
  g.save();
  if (knife.kind === 'thrown' && knife.age < 0.62 && knife.arcPoints.length > 2) {
    g.save(); g.strokeStyle = 'rgba(255,232,115,0.82)'; g.lineWidth = 3; g.setLineDash([8, 8]);
    g.beginPath(); g.moveTo(knife.arcPoints[0].x, knife.arcPoints[0].y);
    for (let i = 1; i < knife.arcPoints.length; i += 1) g.lineTo(knife.arcPoints[i].x, knife.arcPoints[i].y);
    g.stroke(); g.restore();
  }
  for (let i = 0; i < knife.trail.length; i += 1) {
    const tr = knife.trail[i];
    g.save(); g.globalAlpha = tr.alpha * 0.35; g.translate(tr.x, tr.y); g.rotate(tr.angle);
    ell(g, 6, 0, 26, 7, 0, '#E2E8F0'); g.restore();
  }
  g.translate(knife.x, knife.y); g.rotate(knife.angle);
  glow(g, 4, 0, 4, 38, [[0, 'rgba(255,240,170,0.55)'], [1, 'rgba(240,62,62,0)']]);
  rr(g, -31, -6, 22, 12, 4, '#6B3416', INK, 2.8);
  circ(g, -24, 0, 2.2, '#F4B43A'); circ(g, -15, 0, 2.2, '#F4B43A');
  g.beginPath(); g.moveTo(-9, -7); g.lineTo(18, -8);
  g.quadraticCurveTo(33, -7, 36, 1); g.quadraticCurveTo(22, 10, -9, 7); g.closePath();
  fs(g, gradL(g, -8, -9, 34, 9, [[0, '#CBD5E1'], [0.45, '#FFFFFF'], [1, '#94A3B8']]), INK, 2.8);
  seg(g, [[-4, -3], [24, -3]], 'rgba(255,255,255,0.9)', 2);
  g.restore();
}

export function drawTurkeyCharacter(g, turkey, t, opts = {}) {
  const { scale = 1, shadowY = GY, skipGroundShadow = false } = opts;
  for (let i = 0; i < turkey.afterimages.length; i += 1) {
    const img = turkey.afterimages[i];
    g.save(); g.globalAlpha = img.alpha * 0.45;
    g.translate(img.x + turkey.w * 0.5, img.y + turkey.h); g.scale(img.facing * scale, scale);
    ell(g, -2, -26, 26, 20, 0, '#F59F00'); g.restore();
  }
  const invulnFlash = turkey.hitInvuln > 0 && Math.floor(t * 20) % 2 === 0;
  const cx = turkey.x + turkey.w * 0.5;
  const bottomY = turkey.y + turkey.h;
  g.save(); if (invulnFlash) g.globalAlpha = 0.56; g.translate(cx, bottomY);
  if (!skipGroundShadow) {
    const ha = Math.max(0, shadowY - bottomY);
    const ss = Math.max(0.35, 1 - ha / 260) * scale;
    ell(g, 0, ha + 2, 26 * ss, 7 * ss, 0, 'rgba(26,12,6,0.34)');
  }
  g.scale(scale, scale);
  if (turkey.hidden) {
    const ld = turkey.eyeTargetX >= cx ? 2.5 : -2.5;
    [-8, 8].forEach((ex) => { circ(g, ex, -42, 7.5, '#FFFDF5', INK, 2.6); circ(g, ex + ld, -42, 3, INK); });
    g.restore(); return;
  }
  if (turkey.dashIframes > 0) {
    g.save(); g.lineCap = 'round';
    for (let s = -1; s <= 1; s += 1) {
      seg(g, [[-36 * turkey.facing, -28 + s * 14], [-68 * turkey.facing, -28 + s * 17]], '#FFE066', 3.4);
    }
    ell(g, 0, -32, 41, 34, 0, null, '#FFE066', 3.4); g.restore();
  }
  g.rotate(turkey.dashTimer > 0 ? 0.22 : Math.max(-0.12, Math.min(0.12, turkey.vx / 2600)));
  g.scale(turkey.facing * turkey.squashX, turkey.squashY);
  const stride = Math.sin(turkey.runCycle);
  g.translate(0, turkey.grounded ? -Math.abs(Math.cos(turkey.runCycle)) * 4 : 0);
  const tCols = ['#9E1F1B', '#D9480F', '#F08C00', '#F4B43A', '#D9480F', '#9E1F1B', '#7C2D12'];
  const fan = turkey.dashTimer > 0 || !turkey.grounded ? 1.2 : 1;
  g.save(); g.translate(-16, -28);
  for (let i = 0; i < 7; i += 1) {
    g.save(); g.rotate((-2.42 + i * 0.25) * fan + Math.sin(t * 9 + i) * 0.04);
    ell(g, 0, -19, 7.6, 22, 0, tCols[i], INK, 2.5);
    ell(g, 0, -34, 5.2, 5.5, 0, '#FFF3D1'); g.restore();
  }
  g.restore();
  [[-5, -stride], [6, stride]].forEach(([hx, sw]) => {
    const fx = hx + sw * 14; const fy = turkey.grounded ? -2 - Math.max(0, sw) * 9 : -8 + sw * 5;
    g.lineCap = 'round';
    seg(g, [[hx, -14], [fx, fy], [fx + 9, fy]], '#F08C00', 5);
    seg(g, [[hx, -14], [fx, fy], [fx + 9, fy]], INK, 2);
  });
  ell(g, 0, -27, 24, 19, -0.08, gradR(g, 4, -30, 5, 0, -26, 28, [[0, '#B5602B'], [0.7, '#7F3A17'], [1, '#54230D']]), INK, 3);
  ell(g, 11, -24, 10, 12, 0.15, '#E8B376');
  const flap = turkey.fluttering ? Math.sin(t * 48) * 0.95 - 0.55 : !turkey.grounded ? -0.48 : Math.sin(turkey.runCycle) * 0.28;
  g.save(); g.translate(-1, -29); g.rotate(flap); ell(g, -2, 4, 14, 9, -0.25, '#6B2F12', INK, 2.8); g.restore();
  ell(g, 16, -45, 12, 13, 0.1, '#8C401B', INK, 3);
  g.beginPath(); g.moveTo(22, -45); g.quadraticCurveTo(31, -36, 23, -31); g.quadraticCurveTo(17, -34, 19, -43); g.closePath();
  fs(g, '#E03131', INK, 2.6);
  const open = turkey.gobbleTimer > 0 ? 5.5 : 0;
  poly(g, [[25, -49], [40, -45 - open * 0.4], [25, -42]], '#F9B826', INK, 2.6);
  if (open > 0) poly(g, [[25, -42], [37, -38 + open * 0.5], [24, -38]], '#F9B826', INK, 2.6);
  circ(g, 18, -49, 6.5, '#FFFFFF', INK, 2.6);
  const rdx = (turkey.eyeTargetX - cx) * turkey.facing;
  const rdy = turkey.eyeTargetY - (bottomY - 49 * scale);
  const mag = Math.hypot(rdx, rdy) || 1;
  const px = 18 + (rdx / mag) * 2.4; const py = -49 + (rdy / mag) * 2.4;
  circ(g, px, py, 2.8, '#180D08'); circ(g, px - 1, py - 1, 1.1, '#FFFFFF');
  g.strokeStyle = INK; g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(14, -57); g.quadraticCurveTo(10, -66, 17, -64); g.stroke();
  g.restore();
}

export function drawFarmerChef(g, farmer, t, opts = {}) {
  const { scale = 1, skipVisionCone = false, skipGroundShadow = false } = opts;
  const cx = farmer.x + farmer.w * 0.5;
  const bottomY = farmer.y + farmer.h;
  const isChef = farmer.role === 'chef';
  const alerted = farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.THROW_KNIFE || farmer.state === FARMER_STATES.CORNER_LUNGE;
  g.save();
  if (!skipVisionCone && farmer.visionRange > 0) {
    const c = computeFarmerVisionCone(farmer);
    const stops = alerted
      ? [[0, 'rgba(255,110,50,0.36)'], [0.6, 'rgba(224,49,49,0.14)'], [1, 'rgba(224,49,49,0)']]
      : [[0, 'rgba(255,224,102,0.4)'], [0.6, 'rgba(255,185,65,0.15)'], [1, 'rgba(255,170,50,0)']];
    g.beginPath(); g.moveTo(c.originX, c.originY);
    g.arc(c.originX, c.originY, c.range, c.angle - c.halfSpread, c.angle + c.halfSpread);
    g.closePath(); fs(g, gradR(g, c.originX, c.originY, 12, c.originX, c.originY, c.range, stops));
  }
  if (!skipGroundShadow) ell(g, cx, bottomY + 2, 34 * scale, 9 * scale, 0, 'rgba(24,10,4,0.36)');
  g.translate(cx, bottomY); g.scale(scale, scale);
  const stride = Math.sin(farmer.stridePhase);
  g.translate(0, -Math.abs(Math.cos(farmer.stridePhase)) * 5);
  g.scale(farmer.facing, 1);
  [[-10, -stride], [10, stride]].forEach(([ox, sw]) => {
    const lx = ox + sw * 13; const ly = -Math.max(0, sw) * 8;
    rr(g, lx - 9, -36 + ly, 16, 28, 5, isChef ? '#2F3640' : '#264673', INK, 2.8);
    rr(g, lx - 10, -13 + ly, 24, 13, 5, '#3D2212', INK, 2.8);
  });
  rr(g, -26, -86, 52, 52, 12, isChef ? '#F8F9FA' : '#C92A2A', INK, 3);
  if (isChef) {
    poly(g, [[-14, -84], [16, -84], [8, -71], [-4, -71]], '#E03131', INK, 2.5);
    rr(g, -21, -66, 42, 38, 6, '#FFFDF5', INK, 2.8);
    circ(g, 8, -46, 5, '#8C5328');
  } else {
    rr(g, -20, -72, 40, 39, 6, '#315A94', INK, 2.8);
    box(g, -16, -86, 9, 18, '#315A94', INK, 2.6);
    box(g, 7, -86, 9, 18, '#315A94', INK, 2.6);
    circ(g, -11, -70, 3.2, '#F4B43A'); circ(g, 11, -70, 3.2, '#F4B43A');
  }
  const armAng = farmer.state === FARMER_STATES.THROW_KNIFE ? -1.65 - Math.sin(t * 24) * 0.14 : alerted ? -0.95 + stride * 0.25 : -0.45;
  g.save(); g.translate(-14, -74); g.rotate(armAng);
  rr(g, -6, -8, 32, 14, 6, isChef ? '#F8F9FA' : '#C92A2A', INK, 2.8);
  circ(g, 28, -1, 8, '#F1C29B', INK, 2.6);
  box(g, 24, -14, 7, 14, '#6B3416', INK, 2.6);
  g.beginPath(); g.moveTo(23, -14); g.lineTo(32, -14); g.lineTo(36, -46); g.quadraticCurveTo(25, -42, 23, -14); g.closePath();
  fs(g, '#F1F5F9', INK, 2.6);
  g.restore();
  circ(g, 2, -100, 17, '#F4C29F', INK, 3);
  circ(g, 10, -102, 4.5, '#FFFFFF'); circ(g, 11.5, -102, 2.2, INK);
  seg(g, [[4, -109], [17, -105]], '#9C3B14', 4);
  g.beginPath(); g.moveTo(4, -93); g.quadraticCurveTo(14, -97, 23, -91); g.quadraticCurveTo(16, -86, 4, -89); g.closePath();
  fs(g, '#B84B14', INK, 2.4);
  if (isChef) {
    g.beginPath();
    g.arc(-10, -134, 14, 0, TAU); g.arc(3, -140, 16, 0, TAU); g.arc(16, -133, 13, 0, TAU);
    fs(g, '#FFFFFF', INK, 3);
    box(g, -15, -130, 34, 19, '#FFFFFF', INK, 3);
  } else {
    ell(g, 2, -112, 32, 7.5, -0.06, '#E8B339', INK, 3);
    poly(g, [[-16, -114], [-11, -132], [15, -132], [20, -114]], '#E8B339', INK, 3);
    box(g, -14, -119, 32, 5, '#C92A2A');
  }
  g.save(); g.translate(16, -70); g.rotate(Math.sin(farmer.lanternSwing * 5) * 0.12);
  rr(g, -4, -6, 26, 13, 6, isChef ? '#F8F9FA' : '#C92A2A', INK, 2.8);
  rr(g, 16, 4, 16, 20, 4, alerted ? '#FF922B' : '#FFE066', INK, 2.6);
  g.restore();
  g.restore();
  if (farmer.badgeText) {
    const bw = Math.max(98, farmer.badgeText.length * 10 + 24);
    const by = bottomY - (isChef ? 198 : 182) * scale + Math.sin(t * 10) * 3;
    drawPlaque(g, cx - bw * 0.5, by, bw, 30, farmer.badgeColor, INK, 9);
    txt(g, farmer.badgeText, cx, by + 15, sn(14), farmer.badgeColor === '#F4B43A' ? INK : '#FFFDF5');
  }
}

function drawAmbientLeaves(g, leaves, isIndoor) {
  const n = isIndoor ? 6 : leaves.length;
  for (let i = 0; i < n; i += 1) {
    const lf = leaves[i];
    drawMapleLeaf(g, lf.x, lf.y, lf.size, lf.angle, lf.color, isIndoor ? 0.32 : 0.82);
  }
}

function drawParticlesLayer(g, sys, camX) {
  g.save(); g.translate(-camX, 0);
  for (let i = 0; i < sys.particles.length; i += 1) {
    const p = sys.particles[i];
    const a = Math.max(0, Math.min(1, p.life / p.maxLife));
    g.save(); g.globalAlpha = a; g.translate(p.x, p.y); g.rotate(p.angle);
    if (p.kind === 'feather') ell(g, 0, 0, p.size * 0.72, p.size * 0.3, 0, p.color, INK, 1.5);
    else if (p.kind === 'ember') circ(g, 0, 0, p.size * a + 1.2, p.color);
    else box(g, -p.size * 0.5, -p.size * 0.5, p.size, p.size, p.color);
    g.restore();
  }
  for (let i = 0; i < sys.ripples.length; i += 1) {
    const r = sys.ripples[i];
    g.save(); g.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.92;
    circ(g, r.x, r.y, r.radius, null, r.color, 3.8);
    g.restore();
  }
  for (let i = 0; i < sys.callouts.length; i += 1) {
    const c = sys.callouts[i];
    const alpha = Math.min(1, (c.life / c.maxLife) * 3.6);
    g.save(); g.globalAlpha = alpha;
    const fsize = Math.round(21 * c.scale);
    g.font = sn(fsize);
    const pw = g.measureText(c.text).width + 30;
    const ph = fsize + 14;
    rr(g, c.x - pw * 0.5 + 2, c.y - ph * 0.5 + 3, pw, ph, 10, 'rgba(20,9,4,0.54)');
    rr(g, c.x - pw * 0.5, c.y - ph * 0.5, pw, ph, 10, 'rgba(38,17,9,0.92)', c.color, 2.5);
    txt(g, c.text, c.x, c.y + 1, sn(fsize), c.color, 'center', 'middle', INK, 5);
    g.restore();
  }
  g.restore();
}

function drawFeatherLifeIcon(g, x, y, alive) {
  g.save(); g.translate(x, y); g.rotate(-0.45);
  ell(g, 0, 0, 7, 15, 0, alive ? '#F08C00' : 'rgba(56,30,16,0.25)', INK, 2.2);
  if (alive) { ell(g, 0, -9, 5, 6, 0, '#C92A2A'); ell(g, 0, -13, 3.4, 3, 0, '#FFF3D1'); }
  g.restore();
}

export function drawParchmentHud(g, state) {
  const { turkey, farmer, stage, score, lives, combo, distanceMeters, hoverTarget, muted } = state;
  g.save();
  drawPlaque(g, 16, 14, 316, 78, PARCH, INK, 12);
  txt(g, 'SCORE', 32, 24, sn(12, 800), PALETTES.inkSoft, 'left', 'top');
  txt(g, String(score).padStart(5, '0'), 30, 40, sn(30), INK, 'left', 'top');
  if (combo >= 2) {
    drawPlaque(g, 134, 22, 82, 26, '#FF6B2B', INK, 8);
    txt(g, `COMBO x${combo}`, 175, 35, sn(13), '#FFFDF5');
  }
  txt(g, 'LIVES', 274, 27, sn(11, 800), PALETTES.inkSoft, 'center', 'top');
  for (let i = 0; i < TURKEY_TUNING.maxLives; i += 1) drawFeatherLifeIcon(g, 244 + i * 28, 60, i < lives);
  drawPlaque(g, 360, 14, 494, 78, PARCH, INK, 12);
  const sLab = state.mode === MODES.ENDLESS
    ? `LOOP ${state.endlessLoop} · STAGE ${stage.id}/3 · ${stage.shortName}`
    : `STAGE ${stage.id}/3 · ${stage.shortName}`;
  txt(g, sLab, 380, 24, sf(16), INK, 'left', 'top');
  txt(g, `${distanceMeters}m ESCAPED`, 834, 25, sn(15), '#9E2A2B', 'right', 'top');
  const bx = 380; const by = 56; const bw = 452; const bh = 18;
  const prog = Math.max(0, Math.min(1, (turkey.x - 200) / (stage.length - 360)));
  rr(g, bx, by, bw, bh, 9, '#D9BE8F', INK, 2.5);
  rr(g, bx + 2, by + 2, Math.max(16, (bw - 4) * prog), bh - 4, 7, gradL(g, bx, by, bx + bw, by, [[0, '#F08C00'], [1, '#2B8A5B']]));
  const fProg = Math.max(0, Math.min(1, (farmer.x - 40) / (stage.length - 260)));
  circ(g, bx + 8 + (bw - 16) * fProg, by + 9, 6.5, '#E03131', INK, 2.2);
  circ(g, bx + 8 + (bw - 16) * prog, by + 9, 7.5, '#FFE066', INK, 2.2);
  drawPlaque(g, 878, 14, 286, 78, PARCH, INK, 12);
  g.lineWidth = 7; g.strokeStyle = '#D6BC8E';
  g.beginPath(); g.arc(918, 53, 22, 0, TAU); g.stroke();
  const dReady = turkey.stamina >= TURKEY_TUNING.dashStaminaCost;
  g.strokeStyle = dReady ? '#F08C00' : '#94A3B8';
  g.beginPath(); g.arc(918, 53, 22, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * turkey.stamina); g.stroke();
  txt(g, 'DASH', 918, 50, sn(11), INK);
  txt(g, dReady ? 'SHIFT' : '...', 918, 62, sn(9, 800), INK);
  const decReady = turkey.decoyCooldown <= 0;
  drawPlaque(g, 956, 26, 86, 52, decReady ? '#FFE8A3' : '#DECBB0', INK, 8);
  txt(g, 'DECOY [Q]', 999, 43, sn(11), INK);
  txt(g, decReady ? 'READY' : `${turkey.decoyCooldown.toFixed(1)}s`, 999, 62, sn(12), decReady ? '#2B8A5B' : '#7D5A44');
  const stInfo = turkey.hidden
    ? { label: 'HIDDEN', fill: PALETTES.sageStealth, fg: '#FFFDF5' }
    : farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.THROW_KNIFE || farmer.state === FARMER_STATES.CORNER_LUNGE
      ? { label: 'SPOTTED!', fill: '#E03131', fg: '#FFFDF5' }
      : farmer.state === FARMER_STATES.INVESTIGATE
        ? { label: 'SEARCH', fill: '#F4B43A', fg: INK }
        : { label: 'CLEAR', fill: '#E6CFA0', fg: INK };
  drawPlaque(g, 1054, 26, 98, 52, stInfo.fill, INK, 8);
  txt(g, 'STEALTH', 1103, 41, sn(10, 800), stInfo.fg);
  txt(g, stInfo.label, 1103, 60, sn(13), stInfo.fg);
  const pb = UI_RECTS.hudPauseBtn;
  drawPlaque(g, pb.x, pb.y, pb.w, pb.h, hoverTarget === 'hudPauseBtn' ? '#FFE8A3' : PARCH, INK, 8);
  box(g, pb.x + 12, pb.y + 10, 4, 16, INK); box(g, pb.x + 19, pb.y + 10, 4, 16, INK);
  txt(g, 'PAUSE', pb.x + 29, pb.y + pb.h * 0.52, sn(12), INK, 'left');
  const mb = UI_RECTS.hudMuteBtn;
  drawPlaque(g, mb.x, mb.y, mb.w, mb.h, hoverTarget === 'hudMuteBtn' ? '#FFE8A3' : PARCH, INK, 8);
  const mc = muted ? PALETTES.cranberry : INK;
  poly(g, [[mb.x + 11, mb.y + 14], [mb.x + 16, mb.y + 14], [mb.x + 22, mb.y + 9], [mb.x + 22, mb.y + 27], [mb.x + 16, mb.y + 22], [mb.x + 11, mb.y + 22]], mc);
  g.strokeStyle = mc; g.lineWidth = 2.2;
  if (muted) {
    seg(g, [[mb.x + 25, mb.y + 13], [mb.x + 33, mb.y + 23]], mc, 2.2);
    seg(g, [[mb.x + 33, mb.y + 13], [mb.x + 25, mb.y + 23]], mc, 2.2);
  } else {
    g.beginPath(); g.arc(mb.x + 24, mb.y + 18, 4, -0.7, 0.7); g.stroke();
    g.beginPath(); g.arc(mb.x + 25, mb.y + 18, 7.5, -0.7, 0.7); g.stroke();
  }
  txt(g, muted ? 'MUTE' : 'SFX', mb.x + 38, mb.y + mb.h * 0.52, sn(12), mc, 'left');
  rr(g, 250, 682, 780, 28, 12, 'rgba(26,12,6,0.74)');
  txt(g, 'A/D Move  ·  Space / Click: Flutter Jump  ·  Shift / R-Click: Feather Dash  ·  E / S: Hide  ·  Q: Acorn Decoy  ·  P: Pause  ·  M: Audio', 640, 696, sn(13, 700), '#F7E7C4');
  if (state.bannerTimer > 0 && state.bannerText) {
    g.globalAlpha = Math.min(1, state.bannerTimer * 1.4);
    drawPlaque(g, 360, 108, 560, 64, '#3B1B0D', '#F4B43A', 14);
    txt(g, state.bannerText, 640, 132, sf(22), '#FFE066');
    txt(g, stage.bannerSub, 640, 156, sn(13, 700), '#FDE7B2');
  }
  g.restore();
}

function drawTitleHeroStage(g, state) {
  const t = state.titleTime; const gy = 612;
  g.save();
  const oven = state.layout.ovens[0];
  if (oven) drawRoastingOven(g, { ...oven, x: 1054, y: gy - 114, state: 'erupting' }, t);
  drawCoverProp(g, { x: 112, y: gy - 70, w: 96, h: 70, kind: 'hay' });
  drawPumpkin(g, 78, gy - 14, 24, '#DF5E14');
  drawPumpkin(g, 114, gy - 8, 17, '#EB7D1E');
  drawPumpkin(g, 1206, gy - 14, 22, '#DF5E14');
  for (let i = 0; i < 4; i += 1) {
    circ(g, 678 - i * 24 + Math.sin(t * 7 + i) * 5, gy - 10 - i * 5, 14 - i * 2, `rgba(255,236,195,${0.42 - i * 0.08})`);
  }
  g.save(); g.strokeStyle = 'rgba(255,244,175,0.85)'; g.lineWidth = 4; g.setLineDash([10, 9]);
  g.beginPath(); g.moveTo(458, 412); g.quadraticCurveTo(605, 316, 748, 392); g.stroke(); g.restore();
  drawFarmerChef(g, {
    ...state.farmer, x: 344 + Math.cos(t * 1.9) * 14, y: gy - state.farmer.h,
    facing: 1, state: FARMER_STATES.THROW_KNIFE, badgeText: '', visionRange: 0,
  }, t, { scale: 1.46, skipVisionCone: true });
  const kPhase = (t * 0.85) % 1;
  const kx = 540 + Math.sin(kPhase * Math.PI) * 95;
  const ky = 368 - Math.sin(kPhase * Math.PI) * 32;
  drawCarvingKnife(g, {
    kind: 'thrown', x: kx, y: ky, angle: -0.32 + t * 5.2, age: 1, arcPoints: [],
    trail: [{ x: kx - 24, y: ky + 8, angle: -0.32, alpha: 0.55 }, { x: kx - 48, y: ky + 18, angle: -0.32, alpha: 0.3 }],
  });
  const bob = Math.abs(Math.sin(t * 5.2)) * 24;
  drawTurkeyCharacter(g, {
    ...state.turkey, x: 780 + Math.sin(t * 1.9) * 18, y: gy - state.turkey.h - 42 - bob,
    facing: 1, vx: 440, grounded: false, fluttering: true, dashTimer: 0.18, dashIframes: 0.25,
    squashX: 1.12, squashY: 0.92, gobbleTimer: 0.3, eyeTargetX: kx, eyeTargetY: ky,
    afterimages: [
      { x: 734, y: gy - state.turkey.h - 36 - bob, facing: 1, alpha: 0.5 },
      { x: 696, y: gy - state.turkey.h - 28 - bob, facing: 1, alpha: 0.28 },
    ],
  }, t, { scale: 1.66, shadowY: gy });
  [[716, 476, -0.5, '#F4B43A'], [686, 514, 0.7, '#D9480F'], [742, 434, 0.3, '#FFF3D1'], [864, 444, -0.8, '#F08C00']].forEach(([fx, fy, ang, col], i) => {
    g.save(); g.translate(fx + Math.sin(t * 4 + i) * 8, fy + Math.cos(t * 3 + i) * 6); g.rotate(ang + t * 1.5);
    ell(g, 0, 0, 11, 4.5, 0, col, INK, 1.8); g.restore();
  });
  g.restore();
}

export function drawTitleOverlay(g, state) {
  g.save();
  box(g, 0, 0, VW, VH, gradR(g, 640, 380, 290, 640, 380, 790, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(26,9,4,0.52)']]));
  drawPlaque(g, 210, 18, 860, 138, '#3B1B0D', '#F4B43A', 22);
  [[230, 38], [1050, 38], [230, 136], [1050, 136]].forEach(([rx, ry]) => circ(g, rx, ry, 5, '#D98B2B', INK, 1.8));
  drawMapleLeaf(g, 260, 74, 18, -0.35, '#E8590C');
  drawMapleLeaf(g, 1020, 74, 18, 0.35, '#E8590C');
  txt(g, 'GOBBLE GAUNTLET', 640, 74, sf(68), gradL(g, 0, 34, 0, 112, [[0, '#FFF9DB'], [0.55, '#F9C74F'], [1, '#E86A17']]), 'center', 'middle', INK, 10);
  txt(g, 'Escape the Farmyard, Survive the Kitchen, Beat Thanksgiving Dinner', 640, 129, `italic 700 20px "Georgia", serif`, '#FDE7B2');
  ['1. GOLDEN FARMYARD', '2. SMOKEHOUSE CELLAR', '3. KITCHEN GAUNTLET'].forEach((label, idx) => {
    const px = 286 + idx * 242;
    drawPlaque(g, px, 168, 224, 34, PARCH, INK, 10);
    txt(g, label, px + 112, 185, sn(13), INK);
  });
  drawButton(g, UI_RECTS.titlePlayBtn, '▶ PLAY ESCAPE', 'SPACE / ENTER / CLICK', state.hoverTarget === 'titlePlayBtn', true);
  drawButton(g, UI_RECTS.titleModeBtn, state.mode === MODES.ESCAPE ? 'MODE: 3-STAGE' : 'MODE: ENDLESS', state.bestScore > 0 ? `BEST: ${state.bestScore}` : 'CLICK TO TOGGLE', state.hoverTarget === 'titleModeBtn', false);
  drawPlaque(g, 56, 654, 1168, 48, 'rgba(34,15,8,0.92)', '#F4B43A', 13);
  txt(g, 'WASD / Arrows: Move  ·  Space / Click: Flutter Jump  ·  Shift / R-Click: Feather Dash  ·  E / S: Hide in Cover  ·  Q: Toss Acorn Decoy  ·  M: Audio', 640, 678, sn(15.5, 800), '#FFF3D6');
  g.restore();
}

export function drawStageClearOverlay(g, state) {
  g.save();
  box(g, 0, 0, VW, VH, 'rgba(20,9,4,0.48)');
  drawPlaque(g, 330, 220, 620, 228, PARCH, INK, 18);
  txt(g, `STAGE ${state.stage.id} CLEARED!`, 640, 286, sf(40), '#2B8A5B');
  const next = STAGES[Math.min(STAGES.length - 1, state.stageIndex + 1)];
  txt(g, `Next up: ${next.title} (+400 Bonus)`, 640, 342, sn(20, 700), INK);
  txt(g, next.bannerSub, 640, 386, sn(16, 800), '#9E2A2B');
  g.restore();
}

export function drawPauseOverlay(g, state) {
  g.save();
  box(g, 0, 0, VW, VH, 'rgba(20,9,4,0.62)');
  drawPlaque(g, 410, 180, 460, 370, PARCH, INK, 20);
  txt(g, 'PAUSED', 640, 244, sf(42), INK);
  txt(g, `Stage ${state.stage.id}/3 · ${state.stage.title} · Score ${state.score}`, 640, 286, sn(16, 700), PALETTES.inkSoft);
  drawButton(g, UI_RECTS.pauseResumeBtn, '▶ RESUME', '', state.hoverTarget === 'pauseResumeBtn', true);
  drawButton(g, UI_RECTS.pauseRestartBtn, '↻ RESTART RUN', '', state.hoverTarget === 'pauseRestartBtn', false);
  drawButton(g, UI_RECTS.pauseTitleBtn, '⌂ TITLE SCREEN', '', state.hoverTarget === 'pauseTitleBtn', false);
  g.restore();
}

export function drawEndOverlay(g, state) {
  const escaped = state.outcome === 'escaped'; const t = state.elapsed;
  g.save();
  if (escaped) {
    box(g, 0, 0, VW, VH, gradL(g, 0, 0, 0, VH, [[0, '#4E89AE'], [0.45, '#F4A236'], [0.82, '#FCE29F'], [1, '#6C3B1C']]));
    drawRays(g, 640, 120, 16, 24, 640, 'rgba(255,249,219,0.14)');
    [[120, 90, '#FFE066'], [195, 124, '#F08C00'], [1085, 92, '#FFE066'], [1170, 134, '#FF6B2B'], [1140, 598, '#FFE066'], [970, 616, '#F4B43A'], [270, 622, '#FFE066'], [148, 608, '#E8590C'], [330, 118, '#FFF3BF'], [955, 116, '#FFF3BF'], [1225, 340, '#FFE066'], [28, 390, '#F4B43A']].forEach(([cx, cy, col], i) => {
      g.save(); g.translate(cx + Math.sin(t * 1.6 + i) * 8, cy + Math.cos(t * 2.1 + i) * 6); g.rotate(t * 0.9 + i * 0.7);
      if (i % 2 === 0) ell(g, 0, 0, 10, 4.2, 0, col, INK, 1.4);
      else drawMapleLeaf(g, 0, 0, 8, 0, col, 0.9);
      g.restore();
    });
    drawEndVictoryVignette(g, t);
  } else {
    box(g, 0, 0, VW, VH, 'rgba(24,9,4,0.74)');
  }
  drawPlaque(g, 240, 28, 800, 108, escaped ? '#22543D' : '#7F1D1D', '#F4B43A', 20);
  txt(g, escaped ? 'ESCAPED THE TABLE!' : 'ALMOST DINNER!', 640, 82, sf(54), escaped ? '#FFF3BF' : '#FFC9C9', 'center', 'middle', INK, 8);
  const cardX = escaped ? 446 : 254; const cardW = escaped ? 770 : 772; const cardY = 156;
  drawPlaque(g, cardX, cardY, cardW, 408, PARCH, INK, 18);
  txt(g, escaped ? 'Barnaby flew free into the golden autumn sunset!' : `Caught by ${state.causeOfDemise || 'the Farmer'} in ${state.stage.title}!`, cardX + 30, cardY + 38, sf(20), escaped ? '#2B8A5B' : '#B91C1C', 'left');
  const mx = cardX + cardW - 84; const my = cardY + 86;
  poly(g, [[mx - 24, my + 26], [mx - 34, my + 76], [mx - 12, my + 62], [mx, my + 78], [mx + 12, my + 62], [mx + 34, my + 76], [mx + 24, my + 26]], '#C92A2A', INK, 3);
  circ(g, mx, my, 46, gradR(g, mx - 12, my - 12, 6, mx, my, 48, [[0, '#FFF3BF'], [0.55, '#F4B43A'], [1, '#C97A12']]), INK, 3);
  txt(g, 'RANK', mx, my - 22, sn(12, 800), INK);
  txt(g, state.rank, mx, my + 12, sf(44), INK);
  [['FINAL SCORE', String(state.score)], ['BEST SCORE', String(state.bestScore)], ['STAGES CLEARED', `${Math.min(3, state.stats.stagesCleared)}/3`], ['DISTANCE', `${state.distanceMeters}m`], ['CLOSE SHAVES', String(state.stats.closeShaves)], ['GOLDEN CORN', String(state.stats.cornCollected)]].forEach(([lab, val], i) => {
    const bx = cardX + 30 + (i % 3) * 194; const by = cardY + 72 + Math.floor(i / 3) * 82;
    drawPlaque(g, bx, by, 180, 68, '#FFF9EB', '#7F4F24', 10);
    txt(g, lab, bx + 14, by + 21, sn(12, 800), '#7F4F24', 'left');
    txt(g, val, bx + 14, by + 49, sn(26), INK, 'left');
  });
  txt(g, 'RUN BADGES EARNED:', cardX + 30, cardY + 266, sn(14), PALETTES.inkSoft, 'left');
  const badges = state.earnedBadges.length > 0 ? state.earnedBadges.slice(0, 4) : [{ label: 'Keep Escaping!', desc: 'Use Dash, Cover & Decoys for badges' }];
  badges.forEach((b, i) => {
    const bx = cardX + 30 + (i % 2) * 356; const by = cardY + 286 + Math.floor(i / 2) * 54;
    drawPlaque(g, bx, by, 342, 44, '#FFE8A3', INK, 10);
    txt(g, `★ ${b.label}`, bx + 14, by + 17, sn(14), '#9E2A2B', 'left');
    txt(g, b.desc, bx + 14, by + 34, sn(12, 700), '#4A2816', 'left');
  });
  drawButton(g, UI_RECTS.endPlayAgainBtn, escaped ? '↻ PLAY AGAIN' : '↻ TRY AGAIN', 'PRESS R OR SPACE', state.hoverTarget === 'endPlayAgainBtn', true);
  drawButton(g, UI_RECTS.endTitleBtn, '⌂ TITLE MENU', 'CHANGE MODE', state.hoverTarget === 'endTitleBtn', false);
  g.restore();
}

function drawEndVictoryVignette(g, t) {
  g.save();
  drawPlaque(g, 46, 156, 376, 408, '#9C5C34', INK, 18);
  rr(g, 84, 194, 300, 234, 12, gradL(g, 84, 194, 84, 428, [[0, '#5E2E18'], [1, '#3A190C']]), '#FFF5DC', 6);
  g.save(); roundRect(g, 88, 198, 292, 226, 8); g.clip();
  drawFarmerChef(g, {
    x: 156, y: 292, w: 74, h: 122, facing: 1, role: 'chef', state: FARMER_STATES.THROW_KNIFE,
    stridePhase: t * 2, lanternSwing: t, visionRange: 0, badgeText: '! CURSES!', badgeColor: '#E03131',
  }, t, { skipVisionCone: true, skipGroundShadow: true });
  g.restore();
  rr(g, 64, 424, 340, 24, 6, '#6E381A', INK, 3.5);
  ell(g, 296, 429, 28, 6, 0, 'rgba(26,12,6,0.36)');
  drawTurkeyCharacter(g, {
    x: 266, y: 360, w: TURKEY_TUNING.width, h: TURKEY_TUNING.height,
    vx: 0, vy: 0, facing: 1, grounded: true, fluttering: false, dashTimer: 0, dashIframes: 0, hitInvuln: 0,
    hidden: false, runCycle: 0, squashX: 1.15, squashY: 1.15, gobbleTimer: 0.25,
    eyeTargetX: 180, eyeTargetY: 360, afterimages: [],
  }, t, { skipGroundShadow: true });
  drawPlaque(g, 74, 468, 320, 74, PARCH, INK, 12);
  txt(g, '"GOBBLE GOBBLE, CHEF!"', 234, 495, sf(18), INK);
  txt(g, 'Not on the Thanksgiving menu tonight!', 234, 521, sn(14, 800), '#2B8A5B');
  g.restore();
}

export function renderGameFrame(g, state) {
  const t = state.screen === SCREENS.TITLE ? state.titleTime : state.elapsed;
  g.save(); g.translate(state.shakeX, state.shakeY);
  drawAutumnBackdrop(g, state);
  if (state.screen !== SCREENS.END) drawAmbientLeaves(g, state.particles.leaves, state.stage.key !== 'farmyard');
  if (state.screen === SCREENS.TITLE) {
    drawTitleHeroStage(g, state);
  } else if (state.screen !== SCREENS.END || state.outcome === 'caught') {
    g.save(); g.translate(-state.cameraX, 0);
    const { layout, turkey, farmer, stage } = state;
    drawStageExit(g, layout.exit, stage, t);
    for (let i = 0; i < layout.gravyPuddles.length; i += 1) drawGravyPuddle(g, layout.gravyPuddles[i]);
    for (let i = 0; i < layout.ovens.length; i += 1) drawRoastingOven(g, layout.ovens[i], t);
    for (let i = 0; i < layout.bouncePads.length; i += 1) drawBouncePad(g, layout.bouncePads[i]);
    for (let i = 0; i < layout.pickups.length; i += 1) drawPickup(g, layout.pickups[i]);
    const prompted = [];
    for (let i = 0; i < layout.covers.length; i += 1) {
      const c = layout.covers[i];
      const hid = turkey.hidden && turkey.coverId === c.id;
      const near = turkey.nearbyCover && turkey.nearbyCover.id === c.id;
      if (state.screen === SCREENS.PLAY && (hid || near || Math.abs(c.x + c.w * 0.5 - (turkey.x + turkey.w * 0.5)) < 275)) prompted.push({ c, hid });
      if (!hid) drawCoverProp(g, c);
    }
    for (let i = 0; i < layout.decoys.length; i += 1) drawAcornDecoy(g, layout.decoys[i]);
    drawFarmerChef(g, farmer, t);
    drawTurkeyCharacter(g, turkey, t);
    if (turkey.hidden && turkey.coverId) {
      const c = layout.covers.find((item) => item.id === turkey.coverId);
      if (c) { drawCoverProp(g, c); drawTurkeyCharacter(g, turkey, t); }
    }
    for (let i = 0; i < prompted.length; i += 1) drawCoverPrompt(g, prompted[i].c, prompted[i].hid, t);
    for (let i = 0; i < layout.knives.length; i += 1) drawCarvingKnife(g, layout.knives[i]);
    g.restore();
  }
  if (state.screen !== SCREENS.END) drawParticlesLayer(g, state.particles, state.cameraX);
  if (state.screen === SCREENS.TITLE) drawTitleOverlay(g, state);
  else if (state.screen === SCREENS.PLAY) drawParchmentHud(g, state);
  else if (state.screen === SCREENS.STAGE_CLEAR) { drawParchmentHud(g, state); drawStageClearOverlay(g, state); }
  else if (state.screen === SCREENS.PAUSE) { drawParchmentHud(g, state); drawPauseOverlay(g, state); }
  else if (state.screen === SCREENS.END) drawEndOverlay(g, state);
  g.restore();
}
