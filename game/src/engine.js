// Core simulation orchestrator: multi-tier stages, Close Shaves, scoring, badges, camera & persistence.

import { EVENTS, FARMER_AI_CONFIG, HAZARD_CONFIG, MODES, RUN_BADGES, SCREENS, TURKEY_TUNING, VIEW } from './constants.js';
import {
  createTurkey, getOvenFlameBox, spawnCatcherNet, spawnThrownKnife, tossAcornDecoy,
  updateFarmDogs, updateProjectilesAndHazards, updateRoastingOvens, updateTurkeyPhysics,
} from './entities.js';
import { alertFarmerToPoint, createFarmer, FARMER_STATES, updateFarmerAI } from './farmer-ai.js';
import {
  createParticleSystem, emitFeatherBurst, emitFloatingCallout, emitOvenEmbers,
  emitSoundRipple, emitSparkBurst, emitSteamPuff, updateParticles,
} from './particles.js';
import { createSeededRng } from './rng.js';
import { generateStageLayout, STAGES } from './stages.js';
const STORAGE_KEY = 'gobble_gauntlet_best_v3';

export function loadBestRecord() {
  try {
    const p = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return { score: Number.isFinite(p.score) ? p.score : 0, escapes: Number.isFinite(p.escapes) ? p.escapes : 0 };
  } catch { return { score: 0, escapes: 0 }; }
}
export function saveBestRecord(score, escapes) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, escapes })); } catch {}
}

export function evaluateRunBadges(s, out, lives) {
  const b = [];
  if (s.stealthEscapes >= 1) b.push(RUN_BADGES[0]);
  if (s.closeShaves >= 3) b.push(RUN_BADGES[1]);
  if (s.highTierTime >= 0.3) b.push(RUN_BADGES[2]);
  if (s.decoysFooled >= 1) b.push(RUN_BADGES[3]);
  if (s.cornCollected >= 6) b.push(RUN_BADGES[4]);
  if (out === 'escaped' && lives >= TURKEY_TUNING.maxLives) b.push(RUN_BADGES[5]);
  return b;
}

export const computeRank = (score, out, lives, shaves) =>
  (out === 'escaped' && (score >= 3200 || (lives === 3 && shaves >= 2)) ? 'S'
    : out === 'escaped' || score >= 2200 ? 'A' : score >= 1100 ? 'B' : 'C');
const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export function createEscapeWorld(seed = 1) {
  const rng = createSeededRng(seed);
  const saved = loadBestRecord();
  const state = {
    seed, screen: SCREENS.TITLE, mode: MODES.ESCAPE, selectedStartStage: 0, stageIndex: 0, endlessLoop: 1,
    stage: STAGES[0], stageClearTimer: 0, turkey: createTurkey(680), farmer: createFarmer(STAGES[0], 340),
    layout: generateStageLayout(STAGES[0], rng), particles: createParticleSystem(rng),
    cameraX: 0, shakeTime: 0, shakeMag: 0, shakeX: 0, shakeY: 0, hitStop: 0, elapsed: 0,
    titleTime: 0, titleKnifeTimer: 0.55, score: 0, stageScores: [0, 0, 0], stageClearedFlags: [false, false, false],
    bestScore: saved.score, totalEscapes: saved.escapes, lives: TURKEY_TUNING.maxLives,
    combo: 1, comboTimer: 0, distanceMeters: 0, stageStartMeters: 0,
    outcome: null, causeOfDemise: '', rank: 'S', earnedBadges: [],
    stats: { stagesCleared: 0, closeShaves: 0, cornCollected: 0, decoysFooled: 0, ovenBurns: 0, stealthEscapes: 0, highTierTime: 0 },
    bannerText: '', bannerTimer: 0, muted: false, hoverTarget: null,
  };
  const addScore = (pts) => { state.score += pts; state.stageScores[state.stageIndex] = (state.stageScores[state.stageIndex] || 0) + pts; };
  const addShake = (mag, dur = 0.24) => { state.shakeMag = Math.max(state.shakeMag, mag); state.shakeTime = Math.max(state.shakeTime, dur); };
  function setupStage(idx) {
    state.stageIndex = idx;
    const base = STAGES[idx], boost = 1 + (state.endlessLoop - 1) * 0.14;
    state.stage = { ...base, farmerSpeedScale: base.farmerSpeedScale * boost, knifeCooldownScale: Math.max(0.48, base.knifeCooldownScale / boost) };
    state.layout = generateStageLayout(state.stage, rng);
    state.turkey = createTurkey(250); state.farmer = createFarmer(state.stage, 48); state.cameraX = 0;
    state.particles.particles.length = state.particles.ripples.length = state.particles.callouts.length = 0;
    state.bannerText = `STAGE ${state.stage.id}/3 · ${state.stage.title}`; state.bannerTimer = 2.4;
  }
  function resetToTitle() {
    state.screen = SCREENS.TITLE; state.endlessLoop = 1; state.titleTime = 0; state.titleKnifeTimer = 0.5;
    state.outcome = null; state.stageIndex = 0; state.stage = STAGES[0];
    state.layout = generateStageLayout(STAGES[0], rng);
    state.layout.platforms = [
      { x: 515, y: 556, w: 208, h: 24, kind: 'barrels', tier: 1, oneWay: true },
      { x: 878, y: 454, w: 224, h: 24, kind: 'rafter', tier: 2, oneWay: true },
    ];
    state.layout.covers = [{ id: 'title_hay', x: 162, y: VIEW.groundY - HAZARD_CONFIG.coverHeight, w: HAZARD_CONFIG.coverWidth, h: HAZARD_CONFIG.coverHeight, kind: 'hay', shakeTimer: 0, flushProgress: 0 }];
    state.layout.ovens = [{ id: 'title_oven', x: 1032, y: VIEW.groundY - HAZARD_CONFIG.ovenHeight, w: HAZARD_CONFIG.ovenWidth, h: HAZARD_CONFIG.ovenHeight, cycle: 3.3, activeDur: 1.4, telegraphDur: 0.6, phase: 2.6, state: 'erupting', closeShaveAwarded: false }];
    state.layout.bouncePads = []; state.layout.gravyPuddles = []; state.layout.pumpkins = [];
    state.layout.knives = []; state.layout.nets = []; state.layout.decoys = [];
    state.layout.pickups = [
      { kind: 'corn', x: 580, y: 500, radius: 17, collected: false, bobPhase: 0.4 },
      { kind: 'corn', x: 654, y: 468, radius: 17, collected: false, bobPhase: 1.2 },
      { kind: 'berry', x: 990, y: 404, radius: 16, collected: false, bobPhase: 2.0 },
    ];
    state.turkey = createTurkey(675); state.farmer = createFarmer(STAGES[0], 335);
    state.farmer.state = FARMER_STATES.CHASE; state.farmer.lanternPitch = -0.28; state.farmer.badgeText = '';
    state.cameraX = state.shakeTime = state.shakeX = state.shakeY = state.hitStop = 0;
  }
  function startNewRun(mode = state.mode, startStage = state.selectedStartStage) {
    state.mode = mode; state.selectedStartStage = Math.max(0, Math.min(STAGES.length - 1, startStage));
    state.screen = SCREENS.PLAY; state.endlessLoop = 1; state.score = 0;
    state.stageScores = [0, 0, 0]; state.stageClearedFlags = [false, false, false];
    state.lives = TURKEY_TUNING.maxLives; state.combo = 1; state.comboTimer = state.elapsed = state.distanceMeters = state.stageStartMeters = 0;
    state.outcome = null; state.causeOfDemise = ''; state.earnedBadges = [];
    state.stats = { stagesCleared: 0, closeShaves: 0, cornCollected: 0, decoysFooled: 0, ovenBurns: 0, stealthEscapes: 0, highTierTime: 0 };
    setupStage(state.selectedStartStage);
  }
  function advanceStage() {
    state.stageStartMeters = state.distanceMeters;
    if (state.stageIndex < STAGES.length - 1) { setupStage(state.stageIndex + 1); state.screen = SCREENS.PLAY; return; }
    if (state.mode === MODES.ENDLESS) {
      state.endlessLoop += 1; setupStage(0); state.screen = SCREENS.PLAY;
      state.bannerText = `ENDLESS HARVEST · LOOP ${state.endlessLoop}!`; state.bannerTimer = 2.6;
    }
  }
  function bumpCombo(basePts, label, x, y, color = '#FFE066') {
    const pts = Math.round(basePts * state.combo);
    addScore(pts); state.combo = Math.min(5, state.combo + 1); state.comboTimer = 4.3;
    if (label) emitFloatingCallout(state.particles, x, y, `${label} +${pts}`, color, 1.08);
    return pts;
  }
  function finishRun(outcome, cause = '') {
    state.outcome = outcome; state.causeOfDemise = cause; state.screen = SCREENS.END;
    if (outcome === 'escaped') { addScore(1000 + state.lives * 250); state.totalEscapes += 1; }
    if (state.score > state.bestScore) state.bestScore = state.score;
    saveBestRecord(state.bestScore, state.totalEscapes);
    state.rank = computeRank(state.score, outcome, state.lives, state.stats.closeShaves);
    state.earnedBadges = evaluateRunBadges(state.stats, outcome, state.lives);
  }
  function damageTurkey(cause, sourceX) {
    const t = state.turkey;
    if (t.hitInvuln > 0 || t.dashIframes > 0) return EVENTS.NONE;
    state.lives -= 1; state.combo = 1; state.comboTimer = 0;
    t.hitInvuln = TURKEY_TUNING.hitInvuln; t.hidden = false; t.coverId = null;
    t.vx = (t.x + t.w * 0.5 >= sourceX ? 1 : -1) * 320; t.vy = -370; t.grounded = false; t.gobbleTimer = 0.45;
    state.hitStop = 0.085; addShake(11, 0.32);
    emitFeatherBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, 16, 300);
    emitFloatingCallout(state.particles, t.x + t.w * 0.5, t.y - 44, 'OUCH! -1 WISHBONE', '#FF6B6B', 1.12);
    if (cause.includes('oven')) state.stats.ovenBurns += 1;
    if (state.lives <= 0) { finishRun('caught', cause); return EVENTS.HIT | EVENTS.CAUGHT; }
    return EVENTS.HIT;
  }
  function awardCloseShave(x, y) {
    const t = state.turkey;
    state.stats.closeShaves += 1; t.stamina = Math.min(1, t.stamina + TURKEY_TUNING.closeShaveStaminaRefund);
    state.hitStop = 0.04; addShake(4.2, 0.14);
    emitSparkBurst(state.particles, rng, x, y, '#FFF3BF', 11);
    emitSoundRipple(state.particles, x, y + 18, '#FFE066', 80);
    bumpCombo(150, 'CLOSE SHAVE!', x, Math.min(y - 36, 390), '#FFE066');
    return EVENTS.CLOSE_SHAVE;
  }
  function updateEyeTracking() {
    const t = state.turkey, tx = t.x + t.w * 0.5, ty = t.y + t.h * 0.35;
    let nx = state.farmer.x + state.farmer.w * 0.5, ny = state.farmer.y + 42, best = (nx - tx) ** 2 + (ny - ty) ** 2;
    for (const k of state.layout.knives) {
      const d = (k.x - tx) ** 2 + (k.y - ty) ** 2;
      if (d < best) { best = d; nx = k.x; ny = k.y; }
    }
    t.eyeTargetX = nx; t.eyeTargetY = ny;
  }
  function stepTitleBackdrop(dt) {
    state.titleTime += dt;
    const t = state.turkey, f = state.farmer, hop = Math.abs(Math.sin(state.titleTime * 2.75));
    t.x = 695 + Math.sin(state.titleTime * 1.45) * 40; t.y = 446 - hop * 74;
    t.facing = 1; t.vx = 385; t.grounded = false; t.fluttering = true; t.dashIframes = 0.2;
    t.runCycle += dt * 19; t.gobbleTimer = hop > 0.45 ? 0.16 : 0;
    f.x = 342 + Math.cos(state.titleTime * 1.9) * 24; f.y = VIEW.groundY - f.h; f.facing = 1; f.vx = 295;
    f.stridePhase += dt * 9.5; f.lanternSwing += dt; f.lanternPitch = -0.3 + Math.sin(state.titleTime * 2.2) * 0.08;
    f.state = FARMER_STATES.CHASE; f.badgeText = '';
    if ((state.titleKnifeTimer -= dt) <= 0 && state.layout.knives.length === 0) {
      spawnThrownKnife(state.layout.knives, f, { ...t, x: t.x + 80, y: t.y - 45, vx: 0 }, state.stage);
      state.titleKnifeTimer = 1.65;
    }
    updateProjectilesAndHazards(state.layout, dt, state.stage.length);
    const ov = state.layout.ovens[0];
    if (ov) { ov.state = 'erupting'; if (rng.chance(dt * 24)) emitOvenEmbers(state.particles, rng, ov.x + ov.w * 0.5, ov.y + 18, 2); }
    if (rng.chance(dt * 14)) emitFeatherBurst(state.particles, rng, t.x + 6, t.y + 34, 1, 120);
    updateEyeTracking(); updateParticles(state.particles, dt, -52);
  }
  function stepWorld(dt, input) {
    if (state.screen === SCREENS.TITLE) { stepTitleBackdrop(dt); return EVENTS.NONE; }
    if (state.screen === SCREENS.PAUSE || state.screen === SCREENS.END) { updateParticles(state.particles, dt * 0.65, -24); return EVENTS.NONE; }
    if (state.screen === SCREENS.STAGE_CLEAR) {
      state.stageClearTimer -= dt; updateParticles(state.particles, dt, -35);
      if (state.stageClearTimer <= 0 || input.jumpPressed) advanceStage();
      return EVENTS.NONE;
    }
    if (state.shakeTime > 0) {
      state.shakeTime = Math.max(0, state.shakeTime - dt);
      const dec = state.shakeTime / 0.32;
      state.shakeX = state.shakeTime ? (rng.next() * 2 - 1) * state.shakeMag * dec : 0;
      state.shakeY = state.shakeTime ? (rng.next() * 2 - 1) * state.shakeMag * dec : 0;
      if (!state.shakeTime) state.shakeMag = 0;
    }
    if (state.hitStop > 0) { state.hitStop = Math.max(0, state.hitStop - dt); updateParticles(state.particles, dt * 0.35, -20); return EVENTS.NONE; }
    let ev = EVENTS.NONE;
    state.elapsed += dt;
    state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    if (state.comboTimer > 0 && (state.comboTimer = Math.max(0, state.comboTimer - dt)) === 0) state.combo = 1;
    const t = state.turkey, f = state.farmer, layout = state.layout;
    const tEv = updateTurkeyPhysics(t, input, layout, state.stage.length, dt);
    ev |= tEv;
    if (t.tier >= 2) state.stats.highTierTime += dt;
    if (tEv & EVENTS.DASH) { emitFeatherBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, 11, 250); addShake(3.2, 0.12); }
    if (tEv & EVENTS.HIDE) { emitSparkBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, '#69DB7C', 6); emitFloatingCallout(state.particles, t.x + t.w * 0.5, t.y - 38, 'HIDDEN!', '#69DB7C', 0.96); }
    if (tEv & EVENTS.UPDRAFT) emitSteamPuff(state.particles, rng, t.x + t.w * 0.5, t.y + t.h, 3);
    if (input.decoyPressed) {
      const dec = tossAcornDecoy(t, state.cameraX, input.pointerX, input.pointerInside);
      if (dec) { layout.decoys.push(dec); ev |= EVENTS.DECOY; emitSparkBurst(state.particles, rng, dec.x, dec.y, '#FFE066', 6); }
    }
    state.distanceMeters = Math.max(state.distanceMeters, state.stageStartMeters + Math.max(0, Math.floor((t.x - 240) / 14)));
    const prevGhost = f.brokeChaseInCover;
    ev |= updateFarmerAI(f, t, layout, state.stage, dt, {
      onSpawnKnife: (fr, tr) => spawnThrownKnife(layout.knives, fr, tr, state.stage),
      onSpawnNet: (fr, tr) => spawnCatcherNet(layout.nets, fr, tr, state.stage),
      onFooled: (d) => { state.stats.decoysFooled += 1; emitSoundRipple(state.particles, d.x, d.y, '#FFE066', 115); bumpCombo(100, 'DECOY LURED!', d.x, d.y - 48, '#FFD43B'); },
      onFlush: (c) => { emitFeatherBurst(state.particles, rng, c.x + c.w * 0.5, c.y + 18, 12, 230); emitFloatingCallout(state.particles, c.x + c.w * 0.5, c.y - 48, 'FLUSHED OUT!', '#FF8787', 1.05); },
    });
    if (f.brokeChaseInCover && !prevGhost) { state.stats.stealthEscapes += 1; bumpCombo(120, 'GHOST SLIP!', t.x + t.w * 0.5, t.y - 54, '#69DB7C'); }
    ev |= updateFarmDogs(layout.dogs, t, layout.decoys, dt, (dog, tx) => {
      emitSoundRipple(state.particles, dog.x + dog.w * 0.5, dog.y + 12, '#FF8787', 120);
      emitFloatingCallout(state.particles, dog.x + dog.w * 0.5, dog.y - 36, 'WOOF! ALERT!', '#FFA94D', 1.0);
      if (f.state !== FARMER_STATES.CHASE) alertFarmerToPoint(f, tx, '! DOG ALERT !', 2.8);
    });
    ev |= updateRoastingOvens(layout.ovens, dt, (ov) => emitOvenEmbers(state.particles, rng, ov.x + ov.w * 0.5, ov.y + 18, 12));
    updateProjectilesAndHazards(layout, dt, state.stage.length);
    for (const ov of layout.ovens) {
      if (ov.state === 'erupting' && rng.chance(dt * 30)) emitOvenEmbers(state.particles, rng, ov.x + ov.w * 0.5, ov.y + 10, 2);
      else if (ov.state === 'telegraph' && rng.chance(dt * 12)) emitOvenEmbers(state.particles, rng, ov.x + ov.w * 0.5, ov.y + 26, 1);
    }
    for (const u of layout.updrafts) if (rng.chance(dt * 11)) emitSteamPuff(state.particles, rng, u.x + u.w * 0.5, VIEW.groundY - 46, 1, u.kind === 'chimney' ? 'rgba(225,215,205,0.58)' : 'rgba(255,252,246,0.72)');
    for (const d of layout.decoys) {
      if (d.justBounced) { d.justBounced = false; emitSoundRipple(state.particles, d.x, d.y, '#FFE066', 96, 32); emitSoundRipple(state.particles, d.x, d.y, '#FFA94D', 62, 16); }
      if (d.landed && d.pulseTimer >= 0.36) { d.pulseTimer = 0; emitSoundRipple(state.particles, d.x, d.y, '#FFE066', 90); }
    }
    const hx = t.x + 10, hy = t.y + 10, hw = t.w - 20, hh = t.h - 14, tcX = t.x + t.w * 0.5, tcY = t.y + t.h * 0.5;
    for (const b of layout.bouncePads) {
      if (!t.hidden && t.vy >= -40 && overlap(hx, hy + hh - 12, hw, 18, b.x, b.y, b.w, b.h)) {
        t.vy = TURKEY_TUNING.bounceVelocity; t.grounded = false; t.onPlatform = null; t.squashX = 0.74; t.squashY = 1.32; b.squash = 1;
        ev |= EVENTS.BOUNCE; emitSparkBurst(state.particles, rng, b.x + b.w * 0.5, b.y + 8, '#FF6B6B', 9); emitSoundRipple(state.particles, b.x + b.w * 0.5, b.y + 8, '#FF8787', 58);
      }
    }
    for (const p of layout.pickups) {
      if (p.collected) continue;
      const py = p.y + Math.sin(p.bobPhase) * 6;
      if ((tcX - p.x) ** 2 + (tcY - py) ** 2 <= (p.radius + 31) ** 2) {
        p.collected = true;
        if (p.kind === 'corn') { state.stats.cornCollected += 1; bumpCombo(50, '', p.x, py); ev |= EVENTS.CORN; emitSparkBurst(state.particles, rng, p.x, py, '#FFE066', 7); }
        else {
          ev |= EVENTS.BERRY; emitSparkBurst(state.particles, rng, p.x, py, '#FF6B6B', 11);
          if (state.lives < TURKEY_TUNING.maxLives) { state.lives += 1; emitFloatingCallout(state.particles, p.x, py - 34, '+1 WISHBONE!', '#69DB7C', 1.05); }
          else bumpCombo(250, 'BERRY BONUS!', p.x, py - 34, '#FF8787');
        }
      }
    }
    for (const k of layout.knives) {
      if (!k.active) continue;
      const kx = k.x - k.w * 0.32, ky = k.y - k.h * 0.42, kw = k.w * 0.64, kh = k.h * 0.84;
      const hit = !t.hidden && overlap(hx, hy, hw, hh, kx, ky, kw, kh);
      if (hit && t.dashIframes <= 0 && t.hitInvuln <= 0) { if (k.kind === 'thrown') k.active = false; ev |= damageTurkey('carving knife', k.x); if (state.screen === SCREENS.END) return ev; continue; }
      const pad = HAZARD_CONFIG.knifeCloseShavePad;
      if (!k.closeShaveAwarded && !t.hidden && overlap(hx, hy, hw, hh, kx - pad, ky - pad, kw + pad * 2, kh + pad * 2) && (t.dashIframes > 0 || !hit)) {
        k.closeShaveAwarded = true; ev |= awardCloseShave(tcX, t.y - 46);
      }
    }
    for (const n of layout.nets) {
      if (!n.active) continue;
      const dist = Math.hypot(tcX - n.x, tcY - n.y), hit = !t.hidden && dist < n.radius + 16;
      if (hit && t.dashIframes <= 0 && t.hitInvuln <= 0) { n.active = false; ev |= damageTurkey('catcher net', n.x); if (state.screen === SCREENS.END) return ev; continue; }
      if (!n.closeShaveAwarded && !t.hidden && dist < n.radius + 64 && (t.dashIframes > 0 || !hit)) { n.closeShaveAwarded = true; ev |= awardCloseShave(tcX, t.y - 46); }
    }
    for (const rp of layout.pumpkins) {
      const dist = Math.hypot(tcX - rp.x, tcY - rp.y), hit = !t.hidden && dist < rp.radius + 18;
      if (hit && t.dashIframes <= 0 && t.hitInvuln <= 0) { ev |= damageTurkey(rp.kind === 'roast_pan' ? 'roasting pan' : 'rolling pumpkin', rp.x); if (state.screen === SCREENS.END) return ev; continue; }
      if (!rp.closeShaveAwarded && !t.hidden && dist < rp.radius + 62 && t.y + t.h < rp.y + 8) { rp.closeShaveAwarded = true; ev |= awardCloseShave(tcX, t.y - 42); }
    }
    for (const ov of layout.ovens) {
      if (ov.state !== 'erupting') continue;
      const fl = getOvenFlameBox(ov);
      const burn = !t.hidden && overlap(hx, hy, hw, hh, fl.x + 14, fl.y + 16, fl.w - 28, fl.h - 18);
      if (burn && t.dashIframes <= 0 && t.hitInvuln <= 0) { ev |= damageTurkey('roasting oven', ov.x + ov.w * 0.5); if (state.screen === SCREENS.END) return ev; }
      else if (!ov.closeShaveAwarded && !t.hidden && overlap(hx, hy, hw, hh, fl.x - HAZARD_CONFIG.ovenCloseShavePad, fl.y - HAZARD_CONFIG.ovenCloseShavePad, fl.w + HAZARD_CONFIG.ovenCloseShavePad * 2, fl.h + HAZARD_CONFIG.ovenCloseShavePad * 2)) {
        ov.closeShaveAwarded = true; ev |= awardCloseShave(tcX, ov.y - 72);
      }
    }
    if (!t.hidden && Math.abs(tcX - (f.x + f.w * 0.5)) < FARMER_AI_CONFIG.catchRadius && Math.abs(tcY - (f.y + f.h * 0.52)) < 54) {
      if (t.dashIframes > 0) ev |= awardCloseShave(tcX, t.y - 52);
      else if (t.hitInvuln <= 0) { ev |= damageTurkey(state.stage.farmerRole === 'chef' ? 'Chef Jed' : 'Farmer Jed', f.x + f.w * 0.5); if (state.screen === SCREENS.END) return ev; }
    }
    const ex = layout.exit;
    if (overlap(hx, hy, hw, hh, ex.x - 16, ex.y - 16, ex.w + 32, ex.h + 32)) {
      state.stats.stagesCleared += 1; state.stageClearedFlags[state.stageIndex] = true; addScore(500 + state.stage.id * 250);
      emitFeatherBurst(state.particles, rng, tcX, t.y + 20, 22, 320); emitSparkBurst(state.particles, rng, ex.x + ex.w * 0.5, ex.y + ex.h * 0.4, '#FFE066', 20);
      if (state.stageIndex === STAGES.length - 1 && state.mode === MODES.ESCAPE) { finishRun('escaped'); return ev | EVENTS.VICTORY; }
      state.screen = SCREENS.STAGE_CLEAR; state.stageClearTimer = 1.65; return ev | EVENTS.STAGE_CLEAR;
    }
    const desiredCam = Math.max(0, Math.min(state.stage.length - VIEW.width, t.x - VIEW.width * 0.37 + t.facing * 64));
    state.cameraX += (desiredCam - state.cameraX) * Math.min(1, dt * 7.8);
    updateEyeTracking(); updateParticles(state.particles, dt, -38 - Math.max(0, t.vx * 0.08));
    return ev;
  }
  resetToTitle();
  return { state, resetToTitle, startNewRun, advanceStage, setupStage, stepWorld };
}
