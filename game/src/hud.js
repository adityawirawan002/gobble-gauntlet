// Storybook parchment HUD, carved-wood Title crest, Stage Clear, Pause, Wax-Seal Victory & frame composer.

import {
  drawFarmerChef, drawFarmDog, drawParticlesLayer, drawRoastingOven,
  drawCoverProp, drawTurkeyCharacter, drawWorldProps,
} from './art-characters.js';
import {
  drawAutumnBackdrop, drawFreedomPanorama, drawMapleLeaf, drawPlatforms,
  drawStageExit, drawStorybookFinish, drawUpdraftVents, linG, radG, rBox, roundRectPath,
} from './art-world.js';
import { MODES, PALETTES, SCREENS, UI_RECTS, VIEW } from './constants.js';
const INK = PALETTES.ink, TAU = Math.PI * 2;
const PARCH = PALETTES.parchment;
const F = '"Trebuchet MS", sans-serif', S = 'Georgia, serif';

function txt(g, s, x, y, font, fill, align = 'left', base = 'middle') {
  g.font = font; g.fillStyle = fill; g.textAlign = align; g.textBaseline = base;
  g.fillText(s, x, y);
}

function drawPlaque(g, x, y, w, h, fill = PARCH, border = INK, r = 12) {
  g.save();
  g.fillStyle = 'rgba(20,9,4,0.34)';
  roundRectPath(g, x + 3, y + 5, w, h, r); g.fill();
  rBox(g, x, y, w, h, r, fill, border, 2.4);
  g.restore();
}

function drawButton(g, rect, label, sub, hovered, primary = true) {
  g.save();
  const yOff = hovered ? -2 : 0;
  const fill = primary
    ? linG(g, rect.x, rect.y, rect.x, rect.y + rect.h, [0, hovered ? '#EA402E' : '#CF2B1F', 1, '#7D1510'])
    : linG(g, rect.x, rect.y, rect.x, rect.y + rect.h, [0, hovered ? '#F9CD5C' : '#E8A838', 1, '#A45E18']);
  drawPlaque(g, rect.x, rect.y + yOff, rect.w, rect.h, fill, hovered ? '#FFF3BF' : INK, 12);
  g.fillStyle = 'rgba(255,255,255,0.22)';
  roundRectPath(g, rect.x + 6, rect.y + yOff + 4, rect.w - 12, rect.h * 0.36, 8); g.fill();
  txt(g, label, rect.x + rect.w * 0.5, rect.y + yOff + (sub ? rect.h * 0.4 : rect.h * 0.52),
    `900 20px ${S}`, primary ? '#FFFDF5' : '#261108', 'center');
  if (sub) {
    txt(g, sub, rect.x + rect.w * 0.5, rect.y + yOff + rect.h * 0.74,
      `700 11.5px ${F}`, primary ? '#FFE4C4' : '#4A240E', 'center');
  }
  g.restore();
}

function drawWishboneLife(g, x, y, alive) {
  g.save(); g.translate(x, y);
  g.strokeStyle = INK; g.lineWidth = 5.4; g.lineCap = 'round';
  const trace = () => {
    g.beginPath(); g.moveTo(0, -13); g.lineTo(0, -5);
    g.quadraticCurveTo(-10, 0, -9, 12); g.moveTo(0, -5); g.quadraticCurveTo(10, 0, 9, 12); g.stroke();
  };
  trace();
  g.strokeStyle = alive ? '#F7C948' : '#A99985'; g.lineWidth = 3; trace();
  g.restore();
}

export function drawParchmentHud(g, state) {
  g.save();
  drawPlaque(g, 14, 12, 306, 70, PARCH, INK, 12);
  txt(g, 'SCORE', 28, 28, `800 11.5px ${F}`, '#7A4A22');
  txt(g, String(state.score).padStart(5, '0'), 28, 56, `900 25px ${F}`, INK);
  if (state.combo > 1) {
    rBox(g, 118, 22, 78, 22, 7, '#F07128', INK, 1.8);
    txt(g, `COMBO x${state.combo}`, 157, 34, `900 11.5px ${F}`, '#FFFDF5', 'center');
  }
  txt(g, 'WISHBONES', 256, 26, `800 11px ${F}`, '#7A4A22', 'center');
  for (let i = 0; i < 3; i += 1) drawWishboneLife(g, 228 + i * 28, 54, i < state.lives);
  drawPlaque(g, 334, 12, 468, 70, PARCH, INK, 12);
  txt(g, `STAGE ${state.stage.id}/3 · ${state.stage.shortName}`, 350, 31, `900 14.5px ${S}`, INK);
  txt(g, `${state.distanceMeters}m ESCAPED`, 786, 31, `800 13px ${F}`, '#A8261B', 'right');
  const bx = 350, by = 46, bw = 436, bh = 18;
  rBox(g, bx, by, bw, bh, 9, '#DEC69A', INK, 2.2);
  const stageFrac = Math.max(0, Math.min(1, state.turkey.x / (state.stage.length - 150)));
  const totalFrac = (state.stageIndex + stageFrac) / 3;
  rBox(g, bx + 2, by + 2, Math.max(14, (bw - 4) * totalFrac), bh - 4, 7, linG(g, bx, by, bx + bw, by, [0, '#F59F00', 0.5, '#E8590C', 1, '#2B8A5B']), null);
  g.strokeStyle = 'rgba(42,20,11,0.5)'; g.lineWidth = 1.8;
  for (const d of [1, 2]) { const dx = bx + (bw * d) / 3; g.beginPath(); g.moveTo(dx, by + 1); g.lineTo(dx, by + bh - 1); g.stroke(); }
  const fFrac = (state.stageIndex + Math.max(0, Math.min(1, state.farmer.x / (state.stage.length - 150)))) / 3;
  g.strokeStyle = INK; g.lineWidth = 2;
  g.fillStyle = '#D9261C'; g.beginPath(); g.arc(bx + bw * fFrac, by + bh * 0.5, 6.5, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#FFE066'; g.beginPath(); g.arc(bx + bw * totalFrac, by + bh * 0.5, 7.5, 0, TAU); g.fill(); g.stroke();
  drawPlaque(g, 816, 12, 344, 70, PARCH, INK, 12);
  const dx = 856, dy = 47;
  g.lineWidth = 6.5; g.strokeStyle = '#DFC89F';
  g.beginPath(); g.arc(dx, dy, 21, 0, TAU); g.stroke();
  g.strokeStyle = state.turkey.stamina >= 0.56 ? '#E8590C' : '#9E856B';
  g.beginPath(); g.arc(dx, dy, 21, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * state.turkey.stamina); g.stroke();
  txt(g, 'DASH', dx, dy - 3, `900 10.5px ${F}`, INK, 'center');
  txt(g, state.turkey.stamina >= 0.56 ? 'RDY' : '...', dx, dy + 9, `800 9.5px ${F}`, INK, 'center');
  const decoyRdy = state.turkey.decoyCooldown <= 0;
  drawPlaque(g, 892, 22, 114, 50, decoyRdy ? '#FFF3C4' : '#E2D2B4', INK, 9);
  txt(g, 'DECOY [Q]', 949, 37, `800 11px ${F}`, INK, 'center');
  txt(g, decoyRdy ? 'READY' : `${state.turkey.decoyCooldown.toFixed(1)}s`, 949, 57, `900 13px ${F}`, decoyRdy ? '#2B8A5B' : '#7A5434', 'center');
  const isHid = state.turkey.hidden, isSpot = state.farmer.badgeText.startsWith('!'), isAlert = state.farmer.badgeText.startsWith('?');
  drawPlaque(g, 1018, 22, 128, 50, isHid ? '#2B8A5B' : isSpot ? '#D9261C' : isAlert ? '#F4B63F' : '#5D4432', INK, 9);
  const stInk = isAlert ? INK : '#FFFDF5';
  txt(g, 'STEALTH', 1082, 37, `800 11px ${F}`, stInk, 'center');
  txt(g, isHid ? 'HIDDEN' : isSpot ? 'SPOTTED!' : isAlert ? 'SEARCHING' : 'CLEAR', 1082, 57, `900 13.5px ${F}`, stInk, 'center');
  const pBtn = UI_RECTS.hudPauseBtn, mBtn = UI_RECTS.hudMuteBtn;
  drawPlaque(g, pBtn.x, pBtn.y, pBtn.w, pBtn.h, state.hoverTarget === 'hudPauseBtn' ? '#FFE8A3' : PARCH, INK, 8);
  txt(g, '❚❚ PAUSE', pBtn.x + pBtn.w * 0.5, pBtn.y + 17, `900 12.5px ${F}`, INK, 'center');
  drawPlaque(g, mBtn.x, mBtn.y, mBtn.w, mBtn.h, state.hoverTarget === 'hudMuteBtn' ? '#FFE8A3' : PARCH, INK, 8);
  txt(g, state.muted ? '✕ MUTED' : '♪ SFX ON', mBtn.x + mBtn.w * 0.5, mBtn.y + 17, `900 12.5px ${F}`, state.muted ? '#B9291E' : INK, 'center');
  if (state.bannerTimer > 0) {
    g.save(); g.globalAlpha = Math.min(1, state.bannerTimer * 1.6);
    drawPlaque(g, 338, 98, 604, 60, 'rgba(54,26,13,0.94)', '#F4B63F', 12);
    txt(g, state.bannerText, 640, 120, `900 20px ${F}`, '#FFE07A', 'center');
    txt(g, state.stage.bannerSub, 640, 142, `700 13px ${F}`, '#FFF4DC', 'center');
    g.restore();
  }
  rBox(g, 118, 756, 1044, 32, 10, 'rgba(26,11,5,0.82)', 'rgba(244,182,63,0.55)', 1.6);
  txt(g, 'A/D Move  ·  Space / Click: Jump & Hold Flutter  ·  Shift / R-Click: Feather Dash  ·  E / S: Hide / Drop  ·  Q: Acorn Decoy  ·  P: Pause',
    640, 772, `700 13px ${F}`, '#F7E7C4', 'center');
  g.restore();
}

export function drawTitleOverlay(g, state) {
  g.save();
  drawPlaque(g, 244, 20, 792, 122, linG(g, 244, 20, 244, 142, [0, '#4E2411', 0.55, '#33150A', 1, '#240E06']), '#F4B63F', 18);
  g.strokeStyle = 'rgba(255,222,138,0.45)'; g.lineWidth = 1.8;
  roundRectPath(g, 252, 28, 776, 106, 13); g.stroke();
  drawMapleLeaf(g, 290, 72, 15, -0.35, '#F08C00');
  drawMapleLeaf(g, 990, 72, 15, 0.35, '#E8590C');
  txt(g, 'GOBBLE GAUNTLET', 643, 73, `900 54px ${S}`, 'rgba(18,7,3,0.78)', 'center');
  txt(g, 'GOBBLE GAUNTLET', 640, 70, `900 54px ${S}`, linG(g, 0, 38, 0, 102, [0, '#FFF6CC', 0.45, '#F7C244', 1, '#E07A18']), 'center');
  txt(g, 'Vault Barn Rafters · Outwit Farmer Jed · Escape the Thanksgiving Kitchen', 640, 117, `italic 700 16.5px ${S}`, '#FDEFD2', 'center');
  const chips = [
    [UI_RECTS.titleStage1Btn, '1. GOLDEN FARMYARD', 0, 'titleStage1Btn'],
    [UI_RECTS.titleStage2Btn, '2. SMOKEHOUSE ORCHARD', 1, 'titleStage2Btn'],
    [UI_RECTS.titleStage3Btn, '3. KITCHEN GAUNTLET', 2, 'titleStage3Btn'],
  ];
  for (const [rect, label, idx, id] of chips) {
    const sel = state.selectedStartStage === idx;
    const hov = state.hoverTarget === id;
    drawPlaque(g, rect.x, rect.y, rect.w, rect.h, sel ? '#FFE499' : hov ? '#FFF6DD' : PARCH, sel ? '#D9480F' : INK, 11);
    txt(g, label, rect.x + rect.w * 0.5, rect.y + 21, `900 13px ${F}`, sel ? '#8A1C14' : INK, 'center');
  }
  drawButton(g, UI_RECTS.titlePlayBtn, '▶ PLAY ESCAPE', 'SPACE / ENTER / CLICK', state.hoverTarget === 'titlePlayBtn', true);
  drawButton(g, UI_RECTS.titleModeBtn, state.mode === MODES.ESCAPE ? 'MODE: 3-STAGE' : 'MODE: ENDLESS', 'CLICK TO TOGGLE', state.hoverTarget === 'titleModeBtn', false);
  rBox(g, 108, 742, 1064, 42, 12, 'rgba(26,11,5,0.88)', '#E8A838', 2);
  txt(g, 'WASD / Arrows: Move  ·  Space: Jump & Flutter-Glide  ·  Shift: Feather Dash  ·  E / S: Stealth Hide  ·  Q: Acorn Decoy  ·  1-3: Stage Select',
    640, 763, `700 14px ${F}`, '#FFF4DC', 'center');
  g.restore();
}

export function drawStageClearOverlay(g, state) {
  g.save();
  g.fillStyle = 'rgba(26,10,5,0.52)'; g.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPlaque(g, 330, 278, 620, 210, PARCH, '#F4B63F', 18);
  txt(g, `STAGE ${state.stage.id} CLEARED!`, 640, 334, `900 36px ${S}`, '#1F6E47', 'center');
  txt(g, `Score: ${state.score}  ·  Close Shaves: ${state.stats.closeShaves}`, 640, 392, `800 18px ${F}`, INK, 'center');
  txt(g, 'Advancing to next gauntlet... (Press Space to skip)', 640, 444, `700 15px ${F}`, '#7A4A22', 'center');
  g.restore();
}

export function drawPauseOverlay(g, state) {
  g.save();
  g.fillStyle = 'rgba(24,10,5,0.62)'; g.fillRect(0, 0, VIEW.width, VIEW.height);
  drawPlaque(g, 420, 268, 440, 316, PARCH, '#F4B63F', 18);
  txt(g, 'PAUSED', 640, 314, `900 34px ${S}`, INK, 'center');
  drawButton(g, UI_RECTS.pauseResumeBtn, '▶ RESUME RUN', 'PRESS P OR ESC', state.hoverTarget === 'pauseResumeBtn', true);
  drawButton(g, UI_RECTS.pauseRestartBtn, 'RESTART RUN', 'PRESS R', state.hoverTarget === 'pauseRestartBtn', false);
  drawButton(g, UI_RECTS.pauseTitleBtn, 'TITLE MENU', '', state.hoverTarget === 'pauseTitleBtn', false);
  g.restore();
}

export function drawEndOverlay(g, state) {
  const escaped = state.outcome === 'escaped';
  const t = state.elapsed + 1.4;
  if (escaped) {
    drawFreedomPanorama(g, t, drawTurkeyCharacter);
    g.save();
    txt(g, 'FREE UNDER THE', 46, 72, `900 44px ${S}`, 'rgba(8,14,28,0.82)');
    txt(g, 'HARVEST MOON!', 46, 122, `900 44px ${S}`, 'rgba(8,14,28,0.82)');
    txt(g, 'FREE UNDER THE', 44, 70, `900 44px ${S}`, '#FFF4CE');
    txt(g, 'HARVEST MOON!', 44, 120, `900 44px ${S}`, '#F7C948');
    txt(g, 'Barnaby outwitted Farmer Jed & soared past the roasting pan!', 45, 160, `italic 700 17px ${S}`, 'rgba(8,14,28,0.85)');
    txt(g, 'Barnaby outwitted Farmer Jed & soared past the roasting pan!', 44, 158, `italic 700 17px ${S}`, '#E4F2FF');
    g.restore();
  } else {
    g.fillStyle = 'rgba(26,10,5,0.72)'; g.fillRect(0, 0, VIEW.width, VIEW.height);
    drawPlaque(g, 54, 178, 534, 466, '#4B2312', '#F4B63F', 18);
    rBox(g, 76, 202, 490, 320, 12, '#2A120A', null);
    drawFarmerChef(g, { x: 185, y: 365, w: 78, h: 126, facing: 1, role: state.stage.farmerRole, state: 'chase', stridePhase: 0.4, lanternSwing: t, lanternPitch: 0.1, visionRange: 220, badgeText: '! GOTCHA !', badgeColor: '#E03131' }, t);
    drawTurkeyCharacter(g, { x: 345, y: 422, w: 60, h: 66, facing: -1, grounded: true, fluttering: false, dashIframes: 0, hitInvuln: 0, hidden: false, squashX: 1.08, squashY: 0.88, runCycle: 0, gobbleTimer: 0.3, eyeTargetX: 220, eyeTargetY: 390, afterimages: [] }, t, { scale: 1.25, triumphant: true });
    txt(g, `CAUGHT BY ${state.causeOfDemise.toUpperCase() || 'FARMER JED'}!`, 321, 566, `900 22px ${S}`, '#FFF4DC', 'center');
    txt(g, 'Feather-dash through threats or toss an Acorn Decoy [Q]!', 321, 602, `700 15px ${F}`, '#F7C948', 'center');
  }
  drawPlaque(g, 646, 52, 594, 692, PARCH, '#3B1B0D', 20);
  g.strokeStyle = 'rgba(138,74,28,0.35)'; g.lineWidth = 2;
  roundRectPath(g, 658, 64, 570, 668, 14); g.stroke();
  drawPlaque(g, 678, 76, 412, 54, escaped ? '#1F6E47' : '#A81F18', '#F4B63F', 12);
  txt(g, escaped ? 'ESCAPED THE TABLE!' : 'ALMOST DINNER!', 884, 104, `900 26px ${S}`, '#FFFDF5', 'center');
  const sx = 1160, sy = 122;
  g.save();
  g.fillStyle = '#B9201B'; g.strokeStyle = '#6E110D'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(sx - 18, sy + 36); g.lineTo(sx - 28, sy + 76); g.lineTo(sx - 8, sy + 64);
  g.lineTo(sx, sy + 76); g.lineTo(sx + 8, sy + 64); g.lineTo(sx + 28, sy + 76); g.lineTo(sx + 18, sy + 36); g.closePath();
  g.fill(); g.stroke();
  g.fillStyle = radG(g, sx - 12, sy - 14, 6, sx, sy, 48, [0, '#FFF0A6', 0.55, '#F0A929', 1, '#9E5610']);
  g.strokeStyle = '#4B210B'; g.lineWidth = 3.2;
  g.beginPath(); g.arc(sx, sy, 46, 0, TAU); g.fill(); g.stroke();
  txt(g, 'WISHBONE', sx, sy - 20, `900 11px ${F}`, '#3B1809', 'center');
  txt(g, state.rank, sx, sy + 10, `900 36px ${S}`, '#3B1809', 'center');
  g.restore();
  for (const [lbl, val, mx] of [['FINAL SCORE', String(state.score), 678], ['BEST SCORE', String(state.bestScore), 890]]) {
    drawPlaque(g, mx, 152, 200, 72, '#FFFDF5', '#9C6C3B', 11);
    txt(g, lbl, mx + 14, 174, `800 11.5px ${F}`, '#7A4A22');
    txt(g, val, mx + 14, 202, `900 28px ${F}`, INK);
  }
  txt(g, 'STAGE 1 / 2 / 3 BREAKDOWN:', 678, 246, `800 12px ${F}`, '#6E381A');
  const stageNames = ['1. FARMYARD', '2. SMOKEHOUSE', '3. KITCHEN'];
  for (let i = 0; i < 3; i += 1) {
    const bx = 678 + i * 180;
    const clr = state.stageClearedFlags[i];
    drawPlaque(g, bx, 260, 168, 72, clr ? '#E8F7EE' : '#F4E5C8', clr ? '#2B8A5B' : '#9C6C3B', 10);
    txt(g, stageNames[i], bx + 12, 282, `900 12px ${F}`, clr ? '#1B6B42' : '#6E381A');
    txt(g, clr ? '✓' : '—', bx + 154, 282, `900 14px ${F}`, clr ? '#1B6B42' : '#9C6C3B', 'right');
    txt(g, `${state.stageScores[i]} pts`, bx + 12, 310, `900 19px ${F}`, INK);
  }
  const statsRow = [
    ['CLOSE SHAVES', String(state.stats.closeShaves)],
    ['DECOYS LURED', String(state.stats.decoysFooled)],
    ['GOLDEN CORN', String(state.stats.cornCollected)],
    ['DISTANCE', `${state.distanceMeters}m`],
  ];
  for (let i = 0; i < statsRow.length; i += 1) {
    const sx2 = 678 + i * 135;
    drawPlaque(g, sx2, 348, 125, 68, '#FFFDF5', '#9C6C3B', 10);
    txt(g, statsRow[i][0], sx2 + 11, 368, `800 10.5px ${F}`, '#7A4A22');
    txt(g, statsRow[i][1], sx2 + 11, 396, `900 23px ${F}`, INK);
  }
  txt(g, 'RUN BADGES EARNED:', 678, 442, `800 12px ${F}`, '#6E381A');
  const shown = state.earnedBadges.slice(0, 4);
  if (shown.length === 0) {
    drawPlaque(g, 678, 456, 530, 56, '#FAF0D7', '#B58953', 10);
    txt(g, 'Vault rafters, hide in cover [E], or toss an Acorn Decoy [Q]!', 696, 488, `700 14px ${F}`, '#6E381A');
  } else {
    for (let i = 0; i < shown.length; i += 1) {
      const bx = 678 + (i % 2) * 268, by = 456 + Math.floor(i / 2) * 82;
      drawPlaque(g, bx, by, 258, 70, '#FFF1BD', '#9C6C3B', 10);
      txt(g, `★ ${shown[i].label}`, bx + 14, by + 26, `900 14.5px ${F}`, '#9C2B19');
      txt(g, shown[i].desc, bx + 14, by + 50, `700 12px ${F}`, '#58321A');
    }
  }
  drawButton(g, UI_RECTS.endPlayAgainBtn, '↻ PLAY AGAIN', 'PRESS R OR SPACE', state.hoverTarget === 'endPlayAgainBtn', true);
  drawButton(g, UI_RECTS.endTitleBtn, '⌂ TITLE MENU', 'STAGE SELECT / MODE', state.hoverTarget === 'endTitleBtn', false);
}

export function renderGameFrame(g, state) {
  const t = state.screen === SCREENS.TITLE ? state.titleTime : state.elapsed;
  g.save();
  g.clearRect(0, 0, VIEW.width, VIEW.height);
  if (state.screen === SCREENS.END && state.outcome === 'escaped') {
    drawEndOverlay(g, state);
    drawStorybookFinish(g);
    g.restore();
    return;
  }
  drawAutumnBackdrop(g, state);
  g.save();
  g.translate(-state.cameraX + state.shakeX, state.shakeY);
  drawUpdraftVents(g, state.layout.updrafts, t);
  drawPlatforms(g, state.layout.platforms, t);
  if (state.screen !== SCREENS.TITLE) drawStageExit(g, state.layout.exit, state.stage, t);
  for (const ov of state.layout.ovens) drawRoastingOven(g, ov, t);
  for (const c of state.layout.covers) drawCoverProp(g, c, state.turkey.hidden && state.turkey.coverId === c.id, t);
  for (const dog of state.layout.dogs) drawFarmDog(g, dog, t);
  drawWorldProps(g, state.layout, state.turkey, t);
  drawFarmerChef(g, state.farmer, t);
  drawTurkeyCharacter(g, state.turkey, t);
  g.restore();
  drawParticlesLayer(g, state.particles, state.cameraX - state.shakeX, state.stage.key === 'kitchen');
  drawStorybookFinish(g);
  if (state.screen === SCREENS.TITLE) drawTitleOverlay(g, state);
  else {
    drawParchmentHud(g, state);
    if (state.screen === SCREENS.STAGE_CLEAR) drawStageClearOverlay(g, state);
    if (state.screen === SCREENS.PAUSE) drawPauseOverlay(g, state);
    if (state.screen === SCREENS.END) drawEndOverlay(g, state);
  }
  g.restore();
}
