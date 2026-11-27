// Pure simulation orchestrator: stages, collisions, near-misses, scoring, badges, camera, and persistence.

import {
  EVENTS,
  FARMER_AI_CONFIG,
  HAZARD_CONFIG,
  MODES,
  RUN_BADGES,
  SCREENS,
  STAGES,
  TURKEY_TUNING,
  VIEW,
} from './constants.js';
import { createFarmer, FARMER_STATES, updateFarmerAI } from './farmer-ai.js';
import {
  generateStageLayout,
  getOvenFlameBox,
  spawnThrownKnife,
  updateCarvingKnives,
  updatePickupsAndProps,
  updateRoastingOvens,
} from './hazards.js';
import {
  createParticleSystem,
  emitFeatherBurst,
  emitFloatingCallout,
  emitOvenEmbers,
  emitSoundRipple,
  emitSparkBurst,
  updateParticles,
} from './particles.js';
import { createSeededRng } from './rng.js';
import { createTurkey, tossAcornDecoy, updateTurkeyPhysics } from './turkey.js';

const STORAGE_KEY = 'gobble_gauntlet_best_v1';

export function loadBestRecord() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { score: 0, escapes: 0 };
    const parsed = JSON.parse(raw);
    return {
      score: Number.isFinite(parsed.score) ? parsed.score : 0,
      escapes: Number.isFinite(parsed.escapes) ? parsed.escapes : 0,
    };
  } catch {
    return { score: 0, escapes: 0 };
  }
}

export function saveBestRecord(score, escapes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, escapes }));
  } catch {
    // Ignore restricted storage environments.
  }
}

export function evaluateRunBadges(stats, outcome, lives) {
  const earned = [];
  if (stats.stealthEscapes >= 1) earned.push(RUN_BADGES[0]);
  if (stats.closeShaves >= 3) earned.push(RUN_BADGES[1]);
  if (stats.ovenBurns === 0 && (outcome === 'escaped' || stats.stagesCleared >= 1)) earned.push(RUN_BADGES[2]);
  if (stats.decoysFooled >= 1) earned.push(RUN_BADGES[3]);
  if (stats.cornCollected >= 12) earned.push(RUN_BADGES[4]);
  if (outcome === 'escaped' && lives >= TURKEY_TUNING.maxLives) earned.push(RUN_BADGES[5]);
  return earned;
}

export function computeRank(score, outcome, lives, closeShaves) {
  if (outcome === 'escaped' && (score >= 3000 || (lives === 3 && closeShaves >= 2))) return 'S';
  if (outcome === 'escaped' || score >= 2200) return 'A';
  if (score >= 1100) return 'B';
  return 'C';
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function createEscapeWorld(seed = 1) {
  const rng = createSeededRng(seed);
  const saved = loadBestRecord();
  const particles = createParticleSystem(rng);

  const state = {
    seed,
    screen: SCREENS.TITLE,
    mode: MODES.ESCAPE,
    stageIndex: 0,
    endlessLoop: 1,
    stage: STAGES[0],
    stageClearTimer: 0,
    turkey: createTurkey(680),
    farmer: createFarmer(STAGES[0], 360),
    layout: generateStageLayout(STAGES[0], rng),
    particles,
    cameraX: 0,
    shakeTime: 0,
    shakeMag: 0,
    shakeX: 0,
    shakeY: 0,
    hitStop: 0,
    elapsed: 0,
    titleTime: 0,
    titleKnifeTimer: 0.7,
    score: 0,
    bestScore: saved.score,
    totalEscapes: saved.escapes,
    lives: TURKEY_TUNING.maxLives,
    combo: 1,
    comboTimer: 0,
    distanceMeters: 0,
    stageStartMeters: 0,
    outcome: null,
    causeOfDemise: '',
    rank: 'A',
    earnedBadges: [],
    stats: {
      stagesCleared: 0,
      closeShaves: 0,
      cornCollected: 0,
      decoysFooled: 0,
      ovenBurns: 0,
      stealthEscapes: 0,
    },
    bannerText: '',
    bannerTimer: 0,
    muted: false,
    hoverTarget: null,
  };

  function setupStage(index) {
    state.stageIndex = index;
    const baseStage = STAGES[index];
    const loopBoost = 1 + (state.endlessLoop - 1) * 0.14;
    state.stage = {
      ...baseStage,
      farmerSpeedScale: baseStage.farmerSpeedScale * loopBoost,
      knifeCooldownScale: Math.max(0.48, baseStage.knifeCooldownScale / loopBoost),
    };
    state.layout = generateStageLayout(state.stage, rng);
    state.turkey = createTurkey(250);
    state.farmer = createFarmer(state.stage, 44);
    state.cameraX = 0;
    state.particles.particles.length = 0;
    state.particles.ripples.length = 0;
    state.particles.callouts.length = 0;
    state.bannerText = `STAGE ${state.stage.id}/3 · ${state.stage.title}`;
    state.bannerTimer = 2.4;
  }

  function resetToTitle() {
    state.screen = SCREENS.TITLE;
    state.endlessLoop = 1;
    state.titleTime = 0;
    state.titleKnifeTimer = 0.55;
    state.outcome = null;
    state.stageIndex = 0;
    state.stage = STAGES[0];
    state.layout = generateStageLayout(STAGES[0], rng);
    // Clean scenic title showcase: single hay bale left, one roaring oven right, zero clutter!
    state.layout.covers = [state.layout.covers[0]];
    state.layout.covers[0].x = 180;
    state.layout.ovens = [state.layout.ovens[0]];
    state.layout.ovens[0].x = 1040;
    state.layout.ovens[0].phase = state.layout.ovens[0].cycle - state.layout.ovens[0].activeDur * 0.7;
    state.layout.bouncePads = [];
    state.layout.gravyPuddles = [];
    state.layout.pickups = [];
    state.layout.knives = [];
    state.turkey = createTurkey(710);
    state.farmer = createFarmer(STAGES[0], 395);
    state.farmer.state = FARMER_STATES.CHASE;
    state.farmer.badgeText = '';
    state.cameraX = 0;
    state.shakeTime = 0;
    state.shakeX = 0;
    state.shakeY = 0;
    state.hitStop = 0;
  }

  function startNewRun(mode = state.mode) {
    state.mode = mode;
    state.screen = SCREENS.PLAY;
    state.endlessLoop = 1;
    state.score = 0;
    state.lives = TURKEY_TUNING.maxLives;
    state.combo = 1;
    state.comboTimer = 0;
    state.elapsed = 0;
    state.distanceMeters = 0;
    state.stageStartMeters = 0;
    state.outcome = null;
    state.causeOfDemise = '';
    state.earnedBadges = [];
    state.stats = {
      stagesCleared: 0,
      closeShaves: 0,
      cornCollected: 0,
      decoysFooled: 0,
      ovenBurns: 0,
      stealthEscapes: 0,
    };
    setupStage(0);
  }

  function advanceStage() {
    state.stageStartMeters = state.distanceMeters;
    if (state.stageIndex < STAGES.length - 1) {
      setupStage(state.stageIndex + 1);
      state.screen = SCREENS.PLAY;
      return;
    }
    if (state.mode === MODES.ENDLESS) {
      state.endlessLoop += 1;
      setupStage(0);
      state.screen = SCREENS.PLAY;
      state.bannerText = `ENDLESS HARVEST · LOOP ${state.endlessLoop}!`;
      state.bannerTimer = 2.6;
    }
  }

  function addShake(mag, duration = 0.24) {
    state.shakeMag = Math.max(state.shakeMag, mag);
    state.shakeTime = Math.max(state.shakeTime, duration);
  }

  function bumpCombo(pointsBase, label, x, y, color = '#FFE066') {
    const awarded = Math.round(pointsBase * state.combo);
    state.score += awarded;
    state.combo = Math.min(5, state.combo + 1);
    state.comboTimer = 4.2;
    if (label) {
      emitFloatingCallout(state.particles, x, y, `${label} +${awarded}`, color, 1.06);
    }
    return awarded;
  }

  function finishRun(outcome, cause = '') {
    state.outcome = outcome;
    state.causeOfDemise = cause;
    state.screen = SCREENS.END;
    if (outcome === 'escaped') {
      state.score += 1000 + state.lives * 250;
      state.totalEscapes += 1;
    }
    if (state.score > state.bestScore) state.bestScore = state.score;
    saveBestRecord(state.bestScore, state.totalEscapes);
    state.rank = computeRank(state.score, outcome, state.lives, state.stats.closeShaves);
    state.earnedBadges = evaluateRunBadges(state.stats, outcome, state.lives);
  }

  function damageTurkey(cause, sourceX) {
    const t = state.turkey;
    if (t.hitInvuln > 0 || t.dashIframes > 0) return EVENTS.NONE;
    state.lives -= 1;
    state.combo = 1;
    state.comboTimer = 0;
    t.hitInvuln = TURKEY_TUNING.hitInvuln;
    t.hidden = false;
    t.coverId = null;
    const pushDir = t.x + t.w * 0.5 >= sourceX ? 1 : -1;
    t.vx = pushDir * 320;
    t.vy = -340;
    t.grounded = false;
    t.gobbleTimer = 0.45;
    state.hitStop = 0.085;
    addShake(11, 0.32);
    emitFeatherBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, 16, 300);
    emitFloatingCallout(state.particles, t.x + t.w * 0.5, t.y - 44, 'OUCH! -1 FEATHER', '#FF6B6B', 1.12);
    if (cause.includes('oven')) state.stats.ovenBurns += 1;
    if (state.lives <= 0) {
      finishRun('caught', cause);
      return EVENTS.HIT | EVENTS.CAUGHT;
    }
    return EVENTS.HIT;
  }

  function updateEyeTracking() {
    const t = state.turkey;
    const tx = t.x + t.w * 0.5;
    const ty = t.y + t.h * 0.35;
    let nearestX = state.farmer.x + state.farmer.w * 0.5;
    let nearestY = state.farmer.y + 42;
    let nearestDistSq = (nearestX - tx) ** 2 + (nearestY - ty) ** 2;

    for (let i = 0; i < state.layout.knives.length; i += 1) {
      const k = state.layout.knives[i];
      const dSq = (k.x - tx) ** 2 + (k.y - ty) ** 2;
      if (dSq < nearestDistSq) {
        nearestDistSq = dSq;
        nearestX = k.x;
        nearestY = k.y;
      }
    }
    t.eyeTargetX = nearestX;
    t.eyeTargetY = nearestY;
  }

  function stepTitleBackdrop(dt) {
    state.titleTime += dt;
    // Smooth scenic loop keeping Barn left, Farmer chasing mid-left, Barnaby dashing mid-right, roaring Oven right!
    state.cameraX = 28 + Math.sin(state.titleTime * 0.45) * 18;
    const t = state.turkey;
    const f = state.farmer;
    t.x = state.cameraX + 715 + Math.sin(state.titleTime * 2.1) * 28;
    t.y = VIEW.groundY - t.h - Math.abs(Math.sin(state.titleTime * 6.2)) * 28;
    t.facing = 1;
    t.vx = 355;
    t.runCycle += dt * 11.8;
    t.gobbleTimer = Math.sin(state.titleTime * 3.1) > 0.4 ? 0.25 : 0;

    f.x = state.cameraX + 388 + Math.cos(state.titleTime * 2.1) * 20;
    f.y = VIEW.groundY - f.h;
    f.facing = 1;
    f.vx = 295;
    f.stridePhase += dt * 9.5;
    f.lanternSwing += dt;
    f.state = FARMER_STATES.CHASE;
    f.badgeText = '';

    // Periodically toss a scenic arching carving knife between Farmer & Barnaby on the live title canvas!
    state.titleKnifeTimer -= dt;
    if (state.titleKnifeTimer <= 0 && state.layout.knives.length === 0) {
      spawnThrownKnife(state.layout.knives, f, { ...t, x: t.x + 120, y: t.y - 75, vx: 0 }, state.stage);
      state.titleKnifeTimer = 1.6;
    }
    updateCarvingKnives(state.layout.knives, dt, state.stage.length);

    const oven = state.layout.ovens[0];
    if (oven) {
      oven.x = state.cameraX + 1045;
      oven.state = 'erupting';
      if (rng.chance(dt * 24)) {
        emitOvenEmbers(state.particles, rng, oven.x + oven.w * 0.5, oven.y + 18, 2);
      }
    }
    if (rng.chance(dt * 14)) {
      emitFeatherBurst(state.particles, rng, t.x + 8, t.y + 34, 1, 110);
    }
    updateEyeTracking();
    updateParticles(state.particles, dt, -52);
  }

  function stepWorld(dt, input) {
    if (state.screen === SCREENS.TITLE) {
      stepTitleBackdrop(dt);
      return EVENTS.NONE;
    }
    if (state.screen === SCREENS.PAUSE || state.screen === SCREENS.END) {
      updateParticles(state.particles, dt * 0.65, -24);
      return EVENTS.NONE;
    }
    if (state.screen === SCREENS.STAGE_CLEAR) {
      state.stageClearTimer -= dt;
      updateParticles(state.particles, dt, -35);
      if (state.stageClearTimer <= 0 || input.jumpPressed) advanceStage();
      return EVENTS.NONE;
    }

    if (state.shakeTime > 0) {
      state.shakeTime = Math.max(0, state.shakeTime - dt);
      const decay = state.shakeTime / 0.32;
      state.shakeX = (rng.next() * 2 - 1) * state.shakeMag * decay;
      state.shakeY = (rng.next() * 2 - 1) * state.shakeMag * decay;
      if (state.shakeTime === 0) {
        state.shakeMag = 0;
        state.shakeX = 0;
        state.shakeY = 0;
      }
    }

    if (state.hitStop > 0) {
      state.hitStop = Math.max(0, state.hitStop - dt);
      updateParticles(state.particles, dt * 0.35, -20);
      return EVENTS.NONE;
    }

    let events = EVENTS.NONE;
    state.elapsed += dt;
    if (state.bannerTimer > 0) state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    if (state.comboTimer > 0) {
      state.comboTimer = Math.max(0, state.comboTimer - dt);
      if (state.comboTimer === 0) state.combo = 1;
    }

    const t = state.turkey;
    const f = state.farmer;
    const layout = state.layout;

    const turkeyEvents = updateTurkeyPhysics(t, input, layout.covers, layout.gravyPuddles, state.stage.length, dt);
    events |= turkeyEvents;

    if (turkeyEvents & EVENTS.DASH) {
      emitFeatherBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, 10, 240);
      addShake(3.2, 0.12);
    }
    if (turkeyEvents & EVENTS.HIDE) {
      emitSparkBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, '#69DB7C', 6);
      emitFloatingCallout(state.particles, t.x + t.w * 0.5, t.y - 36, 'HIDDEN!', '#69DB7C', 0.96);
    }

    if (input.decoyPressed) {
      const decoy = tossAcornDecoy(t, state.cameraX, input.pointerX, input.pointerInside);
      if (decoy) {
        layout.decoys.push(decoy);
        events |= EVENTS.DECOY;
        emitFloatingCallout(state.particles, t.x + t.w * 0.5, t.y - 42, 'ACORN DECOY!', '#FFD43B', 0.92);
      }
    }

    const stageMeters = Math.max(0, Math.floor((t.x - 240) / 14));
    state.distanceMeters = Math.max(state.distanceMeters, state.stageStartMeters + stageMeters);

    const prevBrokeChase = f.brokeChaseInCover;
    events |= updateFarmerAI(
      f,
      t,
      layout.decoys,
      state.stage,
      dt,
      (farmerRef, turkeyRef) => spawnThrownKnife(layout.knives, farmerRef, turkeyRef, state.stage),
      (decoy) => {
        state.stats.decoysFooled += 1;
        emitSoundRipple(state.particles, decoy.x, decoy.y, '#FFE066', 110);
        bumpCombo(100, 'FOOLED!', decoy.x, decoy.y - 48, '#FFD43B');
      },
    );
    if (f.brokeChaseInCover && !prevBrokeChase) {
      state.stats.stealthEscapes += 1;
      bumpCombo(120, 'GHOST SLIP!', t.x + t.w * 0.5, t.y - 54, '#69DB7C');
    }

    events |= updateRoastingOvens(layout.ovens, dt, (oven) => {
      emitOvenEmbers(state.particles, rng, oven.x + oven.w * 0.5, oven.y + 18, 12);
    });
    updateCarvingKnives(layout.knives, dt, state.stage.length);
    updatePickupsAndProps(layout, dt);

    for (let i = 0; i < layout.ovens.length; i += 1) {
      const oven = layout.ovens[i];
      if (oven.state === 'erupting' && rng.chance(dt * 32)) {
        emitOvenEmbers(state.particles, rng, oven.x + oven.w * 0.5, oven.y + 8, 2);
      } else if (oven.state === 'telegraph' && rng.chance(dt * 14)) {
        emitOvenEmbers(state.particles, rng, oven.x + oven.w * 0.5, oven.y + 26, 1);
      }
    }
    for (let i = 0; i < layout.decoys.length; i += 1) {
      const d = layout.decoys[i];
      if (d.landed && d.pulseTimer >= 0.42) {
        d.pulseTimer = 0;
        emitSoundRipple(state.particles, d.x, d.y, '#FFE066', 84);
      }
    }

    const hitX = t.x + 10;
    const hitY = t.y + 10;
    const hitW = t.w - 20;
    const hitH = t.h - 14;

    // 1. Cranberry bounce pads.
    for (let i = 0; i < layout.bouncePads.length; i += 1) {
      const b = layout.bouncePads[i];
      if (!t.hidden && t.vy >= -40 && rectsOverlap(hitX, hitY + hitH - 12, hitW, 16, b.x, b.y, b.w, b.h)) {
        t.vy = TURKEY_TUNING.bounceVelocity;
        t.grounded = false;
        t.squashX = 0.76;
        t.squashY = 1.3;
        b.squash = 1;
        events |= EVENTS.BOUNCE;
        emitSparkBurst(state.particles, rng, b.x + b.w * 0.5, b.y + 8, '#FF6B6B', 9);
        emitFloatingCallout(state.particles, b.x + b.w * 0.5, b.y - 38, 'BOING!', '#FF8787', 0.95);
      }
    }

    // 2. Pickups (Golden Corn & Wild Berries).
    for (let i = 0; i < layout.pickups.length; i += 1) {
      const p = layout.pickups[i];
      if (p.collected) continue;
      const py = p.y + Math.sin(p.bobPhase) * 6;
      const dx = t.x + t.w * 0.5 - p.x;
      const dy = t.y + t.h * 0.5 - py;
      if (dx * dx + dy * dy <= (p.radius + 30) ** 2) {
        p.collected = true;
        if (p.kind === 'corn') {
          state.stats.cornCollected += 1;
          bumpCombo(50, '', p.x, py);
          events |= EVENTS.CORN;
          emitSparkBurst(state.particles, rng, p.x, py, '#FFE066', 7);
        } else {
          events |= EVENTS.BERRY;
          emitSparkBurst(state.particles, rng, p.x, py, '#FF6B6B', 11);
          if (state.lives < TURKEY_TUNING.maxLives) {
            state.lives += 1;
            emitFloatingCallout(state.particles, p.x, py - 34, '+1 FEATHER LIFE!', '#69DB7C', 1.05);
          } else {
            bumpCombo(250, 'BERRY BONUS!', p.x, py - 34, '#FF8787');
          }
        }
      }
    }

    // 3. Carving Knives: hit vs CLOSE SHAVE near-miss!
    for (let i = 0; i < layout.knives.length; i += 1) {
      const k = layout.knives[i];
      if (!k.active) continue;
      const kx = k.x - k.w * 0.32;
      const ky = k.y - k.h * 0.42;
      const kw = k.w * 0.64;
      const kh = k.h * 0.84;

      const directOverlap = !t.hidden && rectsOverlap(hitX, hitY, hitW, hitH, kx, ky, kw, kh);
      if (directOverlap && t.dashIframes <= 0 && t.hitInvuln <= 0) {
        if (k.kind === 'thrown') k.active = false;
        events |= damageTurkey('carving knife', k.x);
        if (state.screen === SCREENS.END) return events;
        continue;
      }

      if (!k.closeShaveAwarded && !t.hidden) {
        const pad = HAZARD_CONFIG.knifeCloseShavePad;
        const near = rectsOverlap(hitX, hitY, hitW, hitH, kx - pad, ky - pad, kw + pad * 2, kh + pad * 2);
        if (near && (t.dashIframes > 0 || !directOverlap)) {
          k.closeShaveAwarded = true;
          state.stats.closeShaves += 1;
          t.stamina = Math.min(1, t.stamina + TURKEY_TUNING.closeShaveStaminaRefund);
          state.hitStop = 0.042;
          addShake(4.2, 0.14);
          events |= EVENTS.CLOSE_SHAVE;
          emitSparkBurst(state.particles, rng, t.x + t.w * 0.5, t.y + 18, '#FFF3BF', 12);
          emitSoundRipple(state.particles, t.x + t.w * 0.5, t.y + t.h * 0.45, '#FFE066', 78);
          bumpCombo(150, 'CLOSE SHAVE!', t.x + t.w * 0.5, Math.min(t.y - 48, 360), '#FFE066');
        }
      }
    }

    // 4. Roasting Ovens: erupting flame plume hit vs CLOSE SHAVE.
    for (let i = 0; i < layout.ovens.length; i += 1) {
      const oven = layout.ovens[i];
      if (oven.state !== 'erupting') continue;
      const flame = getOvenFlameBox(oven);
      const burned = !t.hidden && rectsOverlap(hitX, hitY, hitW, hitH, flame.x + 14, flame.y + 16, flame.w - 28, flame.h - 18);
      if (burned && t.dashIframes <= 0 && t.hitInvuln <= 0) {
        events |= damageTurkey('roasting oven', oven.x + oven.w * 0.5);
        if (state.screen === SCREENS.END) return events;
      } else if (!oven.closeShaveAwarded && !t.hidden) {
        const pad = HAZARD_CONFIG.ovenCloseShavePad;
        const skimmed = rectsOverlap(hitX, hitY, hitW, hitH, flame.x - pad, flame.y - pad, flame.w + pad * 2, flame.h + pad * 2);
        if (skimmed) {
          oven.closeShaveAwarded = true;
          state.stats.closeShaves += 1;
          t.stamina = Math.min(1, t.stamina + TURKEY_TUNING.closeShaveStaminaRefund * 0.8);
          events |= EVENTS.CLOSE_SHAVE;
          emitSparkBurst(state.particles, rng, t.x + t.w * 0.5, t.y + t.h * 0.5, '#FFA94D', 9);
          bumpCombo(120, 'CLOSE SHAVE!', t.x + t.w * 0.5, Math.min(t.y - 48, 360), '#FFE066');
        }
      }
    }

    // 5. Farmer catch check.
    if (!t.hidden && t.dashIframes <= 0 && t.hitInvuln <= 0) {
      const fcx = f.x + f.w * 0.5;
      const fcy = f.y + f.h * 0.58;
      const tcx = t.x + t.w * 0.5;
      const tcy = t.y + t.h * 0.5;
      if (Math.hypot(tcx - fcx, tcy - fcy) <= FARMER_AI_CONFIG.catchRadius) {
        events |= damageTurkey(f.role === 'chef' ? 'Chef-Farmer' : 'Farmer', fcx);
        if (state.screen === SCREENS.END) return events;
      }
    }

    // 6. Stage Exit / Open Escape Window check!
    const ex = layout.exit;
    const reachedExit =
      ex.kind === 'window'
        ? rectsOverlap(t.x, t.y, t.w, t.h, ex.x - 16, ex.y - 16, ex.w + 32, VIEW.groundY - ex.y + 30)
        : t.x + t.w >= ex.x + 18;
    if (reachedExit) {
      state.stats.stagesCleared += 1;
      state.score += 400;
      if (state.stageIndex === STAGES.length - 1 && state.mode === MODES.ESCAPE) {
        finishRun('escaped', '');
        emitFeatherBurst(state.particles, rng, t.x + t.w * 0.5, t.y + 20, 20, 260);
        return events | EVENTS.VICTORY;
      }
      state.screen = SCREENS.STAGE_CLEAR;
      state.stageClearTimer = 1.65;
      return events | EVENTS.STAGE_CLEAR;
    }

    const desiredCamX = Math.max(
      0,
      Math.min(state.stage.length - VIEW.width, t.x - VIEW.width * 0.38 + t.facing * 68),
    );
    state.cameraX += (desiredCamX - state.cameraX) * Math.min(1, dt * 6.5);

    updateEyeTracking();
    updateParticles(state.particles, dt, state.stageIndex === 2 ? -14 : -42);
    return events;
  }

  resetToTitle();
  return {
    state,
    rng,
    resetToTitle,
    startNewRun,
    advanceStage,
    setupStage,
    stepWorld,
    finishRun,
  };
}
