// Painterly character, volumetric lantern cone, hazard, prop, and particle renderers.

import { dot, drawMapleLeaf, linG, radG, rBox } from './art-world.js';
import { PALETTES, VIEW } from './constants.js';
import { computeFarmerVisionCone, FARMER_STATES } from './farmer-ai.js';
const INK = PALETTES.ink, TAU = Math.PI * 2, FNT = '"Trebuchet MS", sans-serif';

export function drawTurkeyCharacter(g, turkey, t, opts = {}) {
  const scale = opts.scale ?? 1;
  if (turkey.hidden && !opts.ignoreHidden) return;
  for (const ghost of (turkey.afterimages || [])) {
    g.save();
    g.globalAlpha = ghost.alpha * 0.42;
    g.translate(ghost.x + turkey.w * 0.5, ghost.y + turkey.h * 0.54);
    g.scale(ghost.facing * scale, scale);
    g.fillStyle = '#FFD166';
    g.beginPath(); g.ellipse(0, 4, 24, 18, 0, 0, TAU); g.fill();
    g.restore();
  }
  if (turkey.hitInvuln > 0 && Math.floor(t * 20) % 2 === 0 && !opts.triumphant) return;
  const cx = turkey.x + turkey.w * 0.5;
  const cy = turkey.y + turkey.h * 0.56;
  const bob = turkey.grounded ? Math.abs(Math.sin(turkey.runCycle)) * 4.5 : Math.sin(t * 14) * 2.5;
  const tilt = turkey.dashIframes > 0 ? 0.19 : !turkey.grounded ? (turkey.vy < 0 ? -0.15 : 0.08) : Math.sin(turkey.runCycle) * 0.05;
  if (!opts.triumphant) {
    const shadowY = turkey.onPlatform ? turkey.onPlatform.y : VIEW.groundY;
    const hRatio = Math.max(0.28, 1 - Math.max(0, shadowY - (turkey.y + turkey.h)) / 240);
    g.fillStyle = `rgba(34,14,7,${0.32 * hRatio})`;
    g.beginPath(); g.ellipse(cx, shadowY + 2, 26 * hRatio, 7 * hRatio, 0, 0, TAU); g.fill();
  }
  g.save();
  g.translate(cx, cy - bob);
  g.scale(turkey.facing * turkey.squashX * scale, turkey.squashY * scale);
  g.rotate(tilt);
  if (turkey.dashIframes > 0) {
    g.strokeStyle = 'rgba(255,224,102,0.9)'; g.lineWidth = 3.5;
    g.beginPath(); g.arc(0, 2, 39, -Math.PI * 0.72, Math.PI * 0.72); g.stroke();
  }
  const spread = turkey.fluttering || turkey.dashIframes > 0 || opts.triumphant ? 1.24 : 0.92;
  const tailCols = ['#7C2D12', '#C2410C', '#EA580C', '#D97706', '#EA580C', '#C2410C', '#7C2D12'];
  for (let i = 0; i < 7; i += 1) {
    const ang = -2.42 + ((i - 3) / 3) * 0.92 * spread + Math.sin(t * 9 + i) * 0.04;
    const len = 34 + (3 - Math.abs(i - 3)) * 3.5;
    g.save();
    g.translate(-12, 4); g.rotate(ang);
    g.fillStyle = tailCols[i]; g.strokeStyle = INK; g.lineWidth = 1.9;
    g.beginPath(); g.ellipse(len * 0.52, 0, len * 0.54, 7.2, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#F7C948'; g.beginPath(); g.ellipse(len * 0.72, 0, 6.5, 4.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#FFF6DF'; g.beginPath(); g.ellipse(len * 0.9, 0, 5.4, 3.8, 0, 0, TAU); g.fill();
    g.restore();
  }
  const stride = turkey.grounded ? Math.sin(turkey.runCycle) * 10 : 7;
  g.strokeStyle = '#E89B2D'; g.lineWidth = 4.2; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-4, 15); g.lineTo(-4 - stride * 0.6, 28); g.lineTo(3 - stride * 0.6, 29);
  g.moveTo(7, 15); g.lineTo(7 + stride * 0.7, 28); g.lineTo(14 + stride * 0.7, 29);
  g.stroke();
  g.fillStyle = radG(g, 4, -5, 4, 0, 4, 29, [0, '#BC6528', 0.55, '#8A3E18', 1, '#4E1F0C']);
  g.strokeStyle = INK; g.lineWidth = 2.3;
  g.beginPath(); g.ellipse(0, 4, 24, 18.5, 0, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = linG(g, 2, -6, 18, 16, [0, '#FFF1CF', 1, '#E3BC82']);
  g.beginPath(); g.ellipse(10, 6, 12.5, 11.5, -0.15, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,222,155,0.58)'; g.lineWidth = 2.2;
  g.beginPath(); g.arc(0, 3, 21, -2.5, -0.65); g.stroke();
  const flap = turkey.fluttering ? Math.sin(t * 42) * 0.72 - 0.55 : !turkey.grounded ? -0.35 : Math.sin(turkey.runCycle) * 0.22;
  g.save();
  g.translate(-2, 4); g.rotate(flap);
  g.fillStyle = linG(g, -12, -8, 12, 8, [0, '#A84E1D', 1, '#5D240E']);
  g.strokeStyle = INK; g.lineWidth = 2.1;
  g.beginPath(); g.ellipse(0, 0, 14, 8.2, -0.18, 0, TAU); g.fill(); g.stroke();
  g.restore();
  g.fillStyle = radG(g, 19, -18, 2, 16, -14, 14, [0, '#A14D1E', 1, '#5C240E']);
  g.strokeStyle = INK; g.lineWidth = 2.3;
  g.beginPath(); g.arc(16, -14, 12.2, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#D9261C';
  g.beginPath();
  g.moveTo(23, -10);
  g.bezierCurveTo(30, -6 + Math.sin(t * 16) * 2, 29, 4, 21, 3);
  g.bezierCurveTo(17, 1, 18, -7, 23, -10);
  g.fill(); g.stroke();
  const open = turkey.gobbleTimer > 0 || opts.triumphant ? 4.8 : 1.4;
  g.fillStyle = '#F7BE38';
  g.beginPath(); g.moveTo(25, -17); g.lineTo(39, -13 - open * 0.3); g.lineTo(25, -11); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(25, -11); g.lineTo(36, -9 + open * 0.65); g.lineTo(24, -7); g.closePath(); g.fill(); g.stroke();
  const ldx = (turkey.eyeTargetX - cx) * turkey.facing;
  const ldy = turkey.eyeTargetY - (cy - 14);
  const la = Math.atan2(ldy, ldx);
  g.fillStyle = '#FFFDF8';
  g.beginPath(); g.ellipse(19.5, -17, 6.2, 6.8, 0, 0, TAU); g.fill(); g.stroke();
  dot(g, 19.5 + Math.cos(la) * 2.1, -17 + Math.sin(la) * 2.1, 2.7, '#180B06');
  dot(g, 18.6, -18.8, 1.3, '#FFFFFF');
  g.restore();
}

export function drawFarmerVisionCone(g, farmer, t) {
  const cone = computeFarmerVisionCone(farmer);
  const hot = farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.CORNER_LUNGE || farmer.state === FARMER_STATES.THROW;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const x2 = cone.originX + Math.cos(cone.angle - cone.halfSpread) * cone.range;
  const y2 = cone.originY + Math.sin(cone.angle - cone.halfSpread) * cone.range;
  const x3 = cone.originX + Math.cos(cone.angle + cone.halfSpread) * cone.range;
  const y3 = cone.originY + Math.sin(cone.angle + cone.halfSpread) * cone.range;
  g.fillStyle = radG(g, cone.originX, cone.originY, 10, cone.originX, cone.originY, cone.range, hot
    ? [0, 'rgba(255,214,102,0.56)', 0.45, 'rgba(255,118,45,0.26)', 1, 'rgba(240,55,35,0)']
    : [0, 'rgba(255,232,140,0.48)', 0.55, 'rgba(255,176,58,0.18)', 1, 'rgba(255,155,35,0)']);
  g.beginPath(); g.moveTo(cone.originX, cone.originY); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath(); g.fill();
  g.fillStyle = hot ? 'rgba(255,236,180,0.72)' : 'rgba(255,248,210,0.6)';
  for (let i = 0; i < 6; i += 1) {
    const dist = 60 + ((i * 58 + t * 28) % (cone.range - 90));
    const off = Math.sin(t * 2.2 + i * 1.9) * cone.halfSpread * 0.6;
    g.beginPath(); g.arc(cone.originX + Math.cos(cone.angle + off) * dist, cone.originY + Math.sin(cone.angle + off) * dist, 2.2, 0, TAU); g.fill();
  }
  g.restore();
}

export function drawFarmerChef(g, farmer, t) {
  drawFarmerVisionCone(g, farmer, t);
  const cx = farmer.x + farmer.w * 0.5;
  const baseY = farmer.y + farmer.h;
  const stride = Math.sin(farmer.stridePhase);
  const bob = Math.abs(stride) * 4.5;
  const isChef = farmer.role === 'chef';
  const lunging = farmer.state === FARMER_STATES.CORNER_LUNGE;
  const throwing = farmer.state === FARMER_STATES.THROW;
  g.fillStyle = 'rgba(30,12,6,0.34)';
  g.beginPath(); g.ellipse(cx, baseY + 2, 34, 9, 0, 0, TAU); g.fill();
  g.save();
  g.translate(cx, baseY - bob);
  g.scale(farmer.facing, 1);
  if (lunging) g.rotate(0.14);
  const legA = stride * 12;
  for (const [lx, sh] of [[-9, -legA], [9, legA]]) {
    rBox(g, lx - 9 + sh * 0.5, -42, 18, 30, 6, isChef ? '#2E2B2A' : '#244A86', INK, 2.3);
    rBox(g, lx - 10 + sh * 0.5, -16, 24, 15, 6, '#3C1D0E', INK, 2.3);
  }
  const armAng = throwing ? -2.42 : lunging ? -1.45 : -2.22 + Math.sin(t * 9) * 0.16;
  g.save();
  g.translate(-14, -74); g.rotate(armAng);
  rBox(g, -6, -6, 32, 14, 6, isChef ? '#F8F4EC' : '#B9291E', INK, 2.2);
  if (throwing && farmer.throwKind === 'net') {
    g.strokeStyle = '#D9A760'; g.lineWidth = 2.4;
    g.beginPath(); g.arc(32, 0, 18, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(18, -10); g.lineTo(46, 10); g.moveTo(18, 10); g.lineTo(46, -10); g.stroke();
  } else {
    rBox(g, 20, -4, 14, 9, 3, '#5D2C14', INK, 2);
    g.fillStyle = linG(g, 32, -14, 66, 8, [0, '#FFFFFF', 0.55, '#CED7DF', 1, '#8596A6']);
    g.strokeStyle = INK; g.lineWidth = 2.2;
    g.beginPath();
    if (isChef) { g.moveTo(33, -14); g.lineTo(66, -16); g.lineTo(64, 9); g.lineTo(33, 6); }
    else { g.moveTo(33, -6); g.quadraticCurveTo(58, -11, 70, 2); g.lineTo(33, 6); }
    g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,250,230,0.72)'; g.lineWidth = 2.4;
    g.beginPath(); g.arc(30, 0, 42, -0.55, 0.25); g.stroke();
  }
  g.restore();
  if (isChef) {
    rBox(g, -23, -86, 46, 52, 12, linG(g, -22, -88, 22, -32, [0, '#FFFDF7', 1, '#DDD1BE']), INK, 2.3);
    g.fillStyle = '#C92A2A'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-14, -85); g.lineTo(14, -85); g.lineTo(6, -73); g.lineTo(-6, -73); g.closePath(); g.fill(); g.stroke();
    rBox(g, -18, -62, 36, 28, 4, '#FFFFFF', INK, 2.1);
    g.fillStyle = '#3B2822';
    for (const [bx, by] of [[-7, -53], [7, -53], [-7, -43], [7, -43]]) { g.beginPath(); g.arc(bx, by, 2.2, 0, TAU); g.fill(); }
    dot(g, 9, -46, 4.5, '#7A421D');
  } else {
    rBox(g, -23, -86, 46, 52, 12, '#B9291E', INK, 2.3);
    rBox(g, -20, -68, 40, 36, 8, linG(g, -20, -68, 20, -32, [0, '#3668B8', 1, '#1E3F7A']), INK, 2.2);
    g.fillStyle = '#2A5499'; g.fillRect(-15, -84, 8, 18); g.fillRect(7, -84, 8, 18);
    g.fillStyle = '#F7C948';
    g.beginPath(); g.arc(-11, -67, 3.2, 0, TAU); g.arc(11, -67, 3.2, 0, TAU); g.fill();
  }
  g.fillStyle = radG(g, 4, -106, 3, 2, -101, 20, [0, '#FFE2C2', 1, '#E0A47A']);
  g.strokeStyle = INK; g.lineWidth = 2.3;
  g.beginPath(); g.arc(2, -101, 17, 0, TAU); g.fill(); g.stroke();
  dot(g, 9, -103, 5.2, '#FFFFFF'); g.stroke();
  dot(g, 10.8, -103, 2.4, '#180B06');
  g.strokeStyle = '#3C1B0D'; g.lineWidth = 3.2;
  g.beginPath(); g.moveTo(2, -110); g.lineTo(15, -107); g.stroke();
  g.fillStyle = '#6E3214'; g.strokeStyle = INK; g.lineWidth = 2;
  g.beginPath(); g.ellipse(12, -94, 11, 5, 0.14, 0, TAU); g.fill(); g.stroke();
  if (isChef) {
    g.fillStyle = '#FFFDF7'; g.strokeStyle = INK; g.lineWidth = 2.3;
    g.beginPath();
    g.arc(-9, -124, 11, 0, TAU); g.arc(3, -128, 12.5, 0, TAU); g.arc(14, -123, 10, 0, TAU);
    g.fill(); g.stroke();
    rBox(g, -15, -122, 34, 12, 3, '#FFFDF7', INK, 2.2);
  } else {
    g.save(); g.rotate(-0.08);
    g.fillStyle = linG(g, -26, -114, 30, -114, [0, '#D4922A', 0.5, '#F7C948', 1, '#B8721C']);
    g.strokeStyle = INK; g.lineWidth = 2.3;
    g.beginPath(); g.ellipse(2, -113, 30, 7.5, 0, 0, TAU); g.fill(); g.stroke();
    rBox(g, -15, -133, 34, 21, 5, '#EAB238', INK, 2.2);
    g.fillStyle = '#B9291E'; g.fillRect(-15, -118, 34, 5);
    g.restore();
  }
  const lSway = Math.sin(farmer.lanternSwing * 6) * 0.14;
  g.save();
  g.translate(14, -70); g.rotate(lSway);
  rBox(g, -4, -5, 22, 12, 5, isChef ? '#FFFDF7' : '#B9291E', INK, 2.1);
  g.translate(20, 4);
  dot(g, 0, 12, 28, radG(g, 0, 12, 2, 0, 12, 28, [0, 'rgba(255,235,140,0.86)', 1, 'rgba(255,155,40,0)']));
  rBox(g, -7, 3, 14, 18, 4, '#FFE07A', '#3B1C0D', 2);
  g.fillStyle = '#4B2413'; g.fillRect(-9, 0, 18, 4); g.fillRect(-9, 20, 18, 4);
  g.restore();
  g.restore();
  if (farmer.badgeText) {
    g.save();
    g.font = `900 14.5px ${FNT}`;
    const bw = Math.max(108, g.measureText(farmer.badgeText).width + 26);
    const bx = cx - bw * 0.5;
    const by = farmer.y - 54 + Math.sin(t * 10) * 2.5;
    rBox(g, bx, by, bw, 30, 9, farmer.badgeColor || '#D9261C', '#FFFDF5', 2.4);
    g.fillStyle = '#FFFDF5'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(farmer.badgeText, cx, by + 15);
    g.restore();
  }
}

export function drawFarmDog(g, dog, t) {
  g.save();
  g.translate(dog.x + dog.w * 0.5, dog.y + dog.h * 0.55);
  g.scale(dog.facing, 1);
  g.save(); g.translate(-26, -4); g.rotate(-0.6 + Math.sin(t * 16) * 0.35);
  rBox(g, -4, -18, 8, 20, 4, '#8A4E24', INK, 2); g.restore();
  const s = Math.sin(dog.stride) * 7;
  rBox(g, -22 + s * 0.5, 10, 9, 18, 4, '#7A411B', INK, 2);
  rBox(g, 12 - s * 0.5, 10, 9, 18, 4, '#7A411B', INK, 2);
  rBox(g, -28, -12, 50, 26, 12, linG(g, 0, -14, 0, 14, [0, '#BA7236', 1, '#753E18']), INK, 2.2);
  g.fillStyle = '#C92A2A'; g.strokeStyle = INK; g.lineWidth = 2;
  g.beginPath(); g.moveTo(10, -10); g.lineTo(24, -4); g.lineTo(14, 8); g.closePath(); g.fill(); g.stroke();
  dot(g, 24, -14, 14, '#BA7236'); g.stroke();
  g.fillStyle = '#5D2E10'; g.beginPath(); g.ellipse(17, -11, 5.5, 11, 0.25, 0, TAU); g.fill(); g.stroke();
  dot(g, 36, -15, 4, '#1E110B');
  dot(g, 27, -18, 3.6, '#FFFFFF');
  dot(g, 28.2, -18, 1.8, '#180B06');
  if (dog.barkTimer > 0) {
    g.strokeStyle = '#FFD43B'; g.lineWidth = 2.5;
    for (const r of [16, 24]) { g.beginPath(); g.arc(40, -14, r, -0.6, 0.6); g.stroke(); }
  }
  g.restore();
}

export function drawRoastingOven(g, oven, t) {
  const ox = oven.x + (oven.state === 'telegraph' ? Math.sin(t * 48) * 3 : 0);
  const oy = oven.y;
  const cx = ox + oven.w * 0.5;
  g.save();
  if (oven.state !== 'idle') {
    g.save(); g.globalCompositeOperation = 'lighter';
    const r = oven.state === 'erupting' ? 148 : 96;
    dot(g, cx, oy + oven.h * 0.45, r, radG(g, cx, oy + oven.h * 0.4, 14, cx, oy + oven.h * 0.55, r, [0, oven.state === 'erupting' ? 'rgba(255,155,45,0.44)' : 'rgba(255,130,30,0.22)', 1, 'rgba(255,80,10,0)']));
    g.restore();
  }
  g.fillStyle = '#3B2823'; g.strokeStyle = INK; g.lineWidth = 2.3;
  g.fillRect(ox + oven.w - 30, oy - 16, 20, 32); g.strokeRect(ox + oven.w - 30, oy - 16, 20, 32);
  g.fillStyle = linG(g, ox, oy, ox + oven.w, oy + oven.h, [0, '#B94827', 0.55, '#8A2F18', 1, '#581D10']);
  g.beginPath(); g.moveTo(ox + 6, oy + oven.h); g.lineTo(ox + 6, oy + 46);
  g.quadraticCurveTo(cx, oy - 16, ox + oven.w - 6, oy + 46); g.lineTo(ox + oven.w - 6, oy + oven.h); g.closePath();
  g.fill(); g.stroke();
  rBox(g, ox - 4, oy + oven.h - 14, oven.w + 8, 15, 4, '#4B4441', INK, 2.2);
  g.fillStyle = oven.state === 'erupting' ? '#FF922B' : oven.state === 'telegraph' ? '#F76707' : '#6A2311';
  g.beginPath(); g.moveTo(ox + 26, oy + oven.h - 14); g.lineTo(ox + 26, oy + 62);
  g.quadraticCurveTo(cx, oy + 32, ox + oven.w - 26, oy + 62); g.lineTo(ox + oven.w - 26, oy + oven.h - 14); g.closePath();
  g.fill(); g.stroke();
  if (oven.state === 'erupting') {
    const fH = 104 + Math.sin(t * 28) * 14;
    g.fillStyle = linG(g, cx, oy + oven.h - 18, cx, oy - fH * 0.55, [0, '#D9261C', 0.5, '#FF7B1C', 1, '#FFF3BF']);
    g.beginPath(); g.moveTo(ox + 22, oy + oven.h - 14);
    g.quadraticCurveTo(ox + 16, oy + 14, cx, oy - fH * 0.54);
    g.quadraticCurveTo(ox + oven.w - 16, oy + 14, ox + oven.w - 22, oy + oven.h - 14); g.closePath(); g.fill();
    g.fillStyle = '#FFF9DB';
    g.beginPath(); g.moveTo(ox + 38, oy + oven.h - 14);
    g.quadraticCurveTo(cx - 12, oy + 32, cx, oy - fH * 0.24);
    g.quadraticCurveTo(cx + 12, oy + 32, ox + oven.w - 38, oy + oven.h - 14); g.closePath(); g.fill();
  } else if (oven.state === 'telegraph') {
    g.fillStyle = '#FFD43B'; g.font = `900 18px ${FNT}`; g.textAlign = 'center';
    g.fillText('▲ HEAT ▲', cx, oy - 12);
  }
  g.restore();
}

export function drawCoverProp(g, cover, isHiddenHere, t) {
  const ox = cover.x + (cover.shakeTimer > 0 ? Math.sin(t * 58) * 4 : 0);
  const oy = cover.y;
  g.save();
  if (cover.kind === 'hay') {
    rBox(g, ox, oy, cover.w, cover.h, 11, linG(g, ox, oy, ox, oy + cover.h, [0, '#F5CE5E', 0.6, '#D49A2A', 1, '#9E6816']), INK, 2.3);
    g.strokeStyle = '#6A3E10'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(ox + 24, oy + 2); g.lineTo(ox + 24, oy + cover.h - 2); g.moveTo(ox + cover.w - 24, oy + 2); g.lineTo(ox + cover.w - 24, oy + cover.h - 2); g.stroke();
  } else if (cover.kind === 'barrel') {
    rBox(g, ox + 8, oy, cover.w - 16, cover.h, 14, linG(g, ox + 8, oy, ox + cover.w - 8, oy, [0, '#6A3418', 0.45, '#BA723A', 1, '#582810']), INK, 2.3);
    g.fillStyle = '#3B3634'; g.fillRect(ox + 7, oy + 16, cover.w - 14, 7); g.fillRect(ox + 7, oy + cover.h - 24, cover.w - 14, 7);
  } else {
    rBox(g, ox + 6, oy + 8, cover.w - 12, cover.h - 8, 12, linG(g, ox + 6, oy, ox + cover.w - 6, oy, [0, '#7F3416', 0.42, '#EE9B54', 1, '#5C220D']), INK, 2.3);
    g.strokeStyle = '#D98236'; g.lineWidth = 4;
    g.beginPath(); g.arc(ox + 6, oy + 36, 9, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.arc(ox + cover.w - 6, oy + 36, 9, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
    rBox(g, ox + 2, oy + 2, cover.w - 4, 11, 5, '#C4682E', INK, 2.2);
  }
  if (isHiddenHere) {
    const px = ox + cover.w * 0.5;
    g.fillStyle = '#FFFFFF'; g.strokeStyle = INK; g.lineWidth = 1.6;
    g.beginPath(); g.arc(px - 8, oy + 18, 5, 0, TAU); g.arc(px + 8, oy + 18, 5, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#180B06'; g.beginPath(); g.arc(px - 7, oy + 18, 2.2, 0, TAU); g.arc(px + 9, oy + 18, 2.2, 0, TAU); g.fill();
  }
  if (cover.flushProgress > 0.02) {
    g.fillStyle = 'rgba(20,10,5,0.82)'; g.fillRect(ox + 8, oy - 16, cover.w - 16, 9);
    g.fillStyle = '#FF6B2B'; g.fillRect(ox + 10, oy - 14, (cover.w - 20) * Math.min(1, cover.flushProgress), 5);
  }
  g.restore();
}

export function drawWorldProps(g, layout, turkey, t) {
  for (const gr of layout.gravyPuddles) {
    g.save();
    g.fillStyle = '#5E3219'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.ellipse(gr.x + gr.w * 0.5, gr.y + gr.h * 0.5, gr.w * 0.5, gr.h * 0.5, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#9C6239';
    for (let b = 0; b < 3; b += 1) {
      g.beginPath(); g.arc(gr.x + 28 + b * 44, gr.y + gr.h * 0.45, 3 + Math.sin(gr.bubblePhase + b) * 1.4, 0, TAU); g.fill();
    }
    g.restore();
  }
  for (const b of layout.bouncePads) {
    const sy = 1 - b.squash * 0.35;
    g.save(); g.translate(b.x + b.w * 0.5, b.y + b.h); g.scale(1 + b.squash * 0.2, sy);
    rBox(g, -b.w * 0.45, -b.h, b.w * 0.9, b.h * 0.65, 10, '#D62828', INK, 2.2);
    g.fillStyle = '#FF8787'; g.beginPath(); g.ellipse(0, -b.h + 6, b.w * 0.34, 6, 0, 0, TAU); g.fill();
    rBox(g, -b.w * 0.5, -14, b.w, 14, 5, '#C47D3B', INK, 2.2);
    g.restore();
  }
  for (const rp of layout.pumpkins) {
    g.save(); g.translate(rp.x, rp.y); g.rotate(rp.angle); g.strokeStyle = INK; g.lineWidth = 2.2;
    if (rp.kind === 'roast_pan') {
      rBox(g, -28, -14, 56, 28, 7, '#6C757D', INK, 2.2);
      g.fillStyle = '#ADB5BD'; g.fillRect(-20, -8, 40, 14);
    } else {
      dot(g, 0, 0, rp.radius, radG(g, -6, -6, 3, 0, 0, rp.radius, [0, '#FFA94D', 0.65, '#E8590C', 1, '#9C2B0E'])); g.stroke();
      g.strokeStyle = 'rgba(42,14,8,0.4)'; g.lineWidth = 1.6;
      g.beginPath(); g.ellipse(0, 0, rp.radius * 0.52, rp.radius, 0, 0, TAU); g.stroke();
      g.fillStyle = '#3B6E24'; g.fillRect(-3, -rp.radius - 6, 6, 8);
    }
    g.restore();
  }
  for (const p of layout.pickups) {
    if (p.collected) continue;
    const py = p.y + Math.sin(p.bobPhase) * 6;
    g.save(); g.translate(p.x, py);
    dot(g, 0, 0, 24, radG(g, 0, 0, 4, 0, 0, 24, [0, p.kind === 'corn' ? 'rgba(255,224,102,0.52)' : 'rgba(255,107,107,0.52)', 1, 'rgba(255,200,80,0)']));
    g.strokeStyle = INK; g.lineWidth = 2;
    if (p.kind === 'corn') {
      g.rotate(-0.2);
      g.fillStyle = '#FFD43B'; g.beginPath(); g.ellipse(0, -2, 10, 15, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#37B24D'; g.beginPath(); g.moveTo(-11, 4); g.quadraticCurveTo(0, 22, 11, 4); g.quadraticCurveTo(0, 11, -11, 4); g.fill(); g.stroke();
    } else {
      g.fillStyle = '#E03131';
      for (const [bx, by] of [[-6, 3], [6, 3], [0, -5]]) { g.beginPath(); g.arc(bx, by, 7.5, 0, TAU); g.fill(); g.stroke(); }
      g.fillStyle = '#37B24D'; g.beginPath(); g.ellipse(6, -12, 7, 3.5, -0.5, 0, TAU); g.fill();
    }
    g.restore();
  }
  for (const d of layout.decoys) {
    g.save(); g.translate(d.x, d.y);
    g.strokeStyle = 'rgba(255,224,102,0.85)'; g.lineWidth = 2.4;
    g.beginPath(); g.arc(0, 0, 18 + (t * 28) % 18, 0, TAU); g.stroke();
    g.fillStyle = '#9C5221'; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.arc(0, 2, 10, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = '#5C2C14'; g.beginPath(); g.arc(0, -4, 11, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  for (const k of layout.knives) {
    if (!k.active) continue;
    if (k.kind === 'thrown' && k.arcPoints.length > 2) {
      g.save(); g.strokeStyle = 'rgba(255,244,210,0.4)'; g.lineWidth = 2; g.setLineDash([5, 6]);
      g.beginPath(); g.moveTo(k.arcPoints[0].x, k.arcPoints[0].y);
      for (let j = 1; j < k.arcPoints.length; j += 1) g.lineTo(k.arcPoints[j].x, k.arcPoints[j].y);
      g.stroke(); g.restore();
    }
    for (const tr of k.trail) {
      g.save(); g.globalAlpha = tr.alpha * 0.35; g.translate(tr.x, tr.y); g.rotate(tr.angle);
      g.fillStyle = '#FFF9DB'; g.fillRect(-20, -4, 40, 8); g.restore();
    }
    g.save(); g.translate(k.x, k.y); g.rotate(k.angle);
    rBox(g, -28, -5, 16, 10, 3, '#5C2C14', INK, 2);
    g.fillStyle = linG(g, -12, -8, 30, 6, [0, '#FFFFFF', 0.6, '#CFD8E3', 1, '#8596A6']);
    g.strokeStyle = INK; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(-12, -7); g.quadraticCurveTo(14, -9, 32, 1); g.lineTo(-12, 7); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  for (const n of layout.nets) {
    if (!n.active) continue;
    g.save(); g.translate(n.x, n.y); g.rotate(n.angle);
    g.fillStyle = 'rgba(240,196,120,0.22)'; g.strokeStyle = '#E8B86A'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(0, 0, n.radius, 0, TAU); g.fill(); g.stroke();
    g.beginPath();
    for (let o = -16; o <= 16; o += 16) {
      g.moveTo(o, -n.radius + 4); g.lineTo(o, n.radius - 4);
      g.moveTo(-n.radius + 4, o); g.lineTo(n.radius - 4, o);
    }
    g.stroke(); g.restore();
  }
  const promptCover = turkey.nearbyCover || layout.covers.find((c) => c.x >= turkey.x - 40 && c.x - turkey.x < 460) || layout.covers.find((c) => Math.abs(c.x - turkey.x) < 420);
  if (promptCover) {
    const isHid = turkey.hidden && turkey.coverId === promptCover.id;
    const label = isHid ? 'HIDDEN [E]' : '[E] HIDE';
    g.save();
    const px = promptCover.x + promptCover.w * 0.5;
    const py = promptCover.y - 28 + Math.sin(t * 6) * 2;
    rBox(g, px - 46, py - 14, 92, 26, 8, isHid ? '#2B8A5B' : '#FFF4DC', INK, 2);
    g.fillStyle = isHid ? '#FFFDF5' : INK;
    g.font = `900 13px ${FNT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, px, py - 1);
    g.restore();
  }
}

export function drawParticlesLayer(g, sys, camX, isIndoor = false) {
  if (!isIndoor) {
    for (const leaf of sys.leaves) drawMapleLeaf(g, leaf.x, leaf.y, leaf.size, leaf.angle, leaf.color, 0.85);
  }
  for (const r of sys.ripples) {
    g.save(); g.globalAlpha = Math.max(0, r.life / r.maxLife);
    g.strokeStyle = r.color; g.lineWidth = 3.2;
    g.beginPath(); g.arc(r.x - camX, r.y, r.radius, 0, TAU); g.stroke(); g.restore();
  }
  for (const p of sys.particles) {
    const sx = p.x - camX;
    if (sx < -50 || sx > VIEW.width + 50) continue;
    g.save(); g.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    g.translate(sx, p.y); g.rotate(p.angle);
    if (p.kind === 'feather') {
      g.fillStyle = p.color; g.strokeStyle = INK; g.lineWidth = 1.4;
      g.beginPath(); g.ellipse(0, 0, p.size, p.size * 0.42, 0, 0, TAU); g.fill(); g.stroke();
    } else if (p.kind === 'steam') {
      dot(g, 0, 0, p.size * 0.5, p.color);
    } else {
      dot(g, 0, 0, p.size * 0.6, p.color);
    }
    g.restore();
  }
  for (const c of sys.callouts) {
    const sx = Math.max(130, Math.min(VIEW.width - 130, c.x - camX));
    g.save(); g.globalAlpha = Math.min(1, c.life * 2.2);
    g.font = `900 ${Math.round(18 * c.scale)}px "Trebuchet MS", sans-serif`;
    const w = g.measureText(c.text).width + 28;
    rBox(g, sx - w * 0.5, c.y - 18, w, 34, 10, 'rgba(34,14,7,0.92)', c.color, 2.5);
    g.fillStyle = c.color; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(c.text, sx, c.y - 1);
    g.restore();
  }
}
