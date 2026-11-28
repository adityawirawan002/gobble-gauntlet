// Deterministic real-simulation screenshot composer for ?shot=title|farm|kitchen|end&seed=1.

import { MODES, SCREENS, VIEW } from './constants.js';
const IDLE = Object.freeze({
  moveX: 0, jumpPressed: false, jumpHeld: false, dashPressed: false,
  hidePressed: false, hideHeld: false, decoyPressed: false,
  pointerX: 640, pointerY: 400, pointerInside: false,
});

function autopilot(state, opts = {}) {
  const t = state.turkey, f = state.farmer, layout = state.layout;
  const tcX = t.x + t.w * 0.5, tcY = t.y + t.h * 0.5;
  const inp = { ...IDLE, moveX: 1 };
  if (opts.useStealth && t.nearbyCover && !t.hidden && f.badgeText.startsWith('!') && tcX - f.x < 340) return { ...IDLE, hidePressed: true };
  if (t.hidden) {
    if (opts.useStealth && f.x + f.w < t.x + 115 && (t.nearbyCover?.flushProgress || 0) < 0.52) return { ...IDLE };
    return { ...IDLE, moveX: 1, jumpPressed: true, jumpHeld: true };
  }
  if (opts.useDecoy && t.decoyCooldown <= 0 && f.badgeText.startsWith('!') && tcX - f.x < 390 && tcX > 650) inp.decoyPressed = true;
  if (state.stage.id === 3 && tcX >= 3320 && t.y > layout.exit.y + 18) {
    inp.moveX = tcX < 3426 ? 0.8 : tcX > 3458 ? -0.65 : 0.25;
    if (t.grounded) inp.jumpPressed = true;
    inp.jumpHeld = true;
    return inp;
  }
  const nextPlat = layout.platforms.find((p) => p.x - tcX > 18 && p.x - tcX < 185 && p.y < t.y + t.h - 24 && t.y + t.h - p.y <= 205);
  const aheadOv = layout.ovens.find((o) => o.x - (t.x + t.w) > -16 && o.x - (t.x + t.w) < 125 && o.state !== 'idle');
  const aheadPm = layout.pumpkins.find((rp) => rp.x - tcX > -12 && rp.x - tcX < 125 && Math.abs(rp.y - tcY) < 70);
  const aheadGr = layout.gravyPuddles.find((g) => g.x - (t.x + t.w) > 0 && g.x - (t.x + t.w) < 60 && t.tier === 0);
  if ((nextPlat || aheadOv || aheadPm || aheadGr) && t.grounded) { inp.jumpPressed = true; inp.jumpHeld = true; }
  if (!t.grounded && t.vy > 10) inp.jumpHeld = true;
  const nearK = layout.knives.find((k) => k.active && Math.hypot(k.x - tcX, k.y - tcY) < 122);
  const nearN = layout.nets.find((n) => n.active && Math.hypot(n.x - tcX, n.y - tcY) < 126);
  const inFl = aheadOv && aheadOv.state === 'erupting' && t.x + t.w > aheadOv.x - 16 && t.y + t.h > aheadOv.y - 54;
  if ((nearK || nearN || inFl) && t.stamina >= 0.56 && t.dashIframes <= 0) inp.dashPressed = true;
  return inp;
}

export function applyDeterministicShot(world, shotName) {
  const dt = VIEW.fixedDt;
  if (shotName === 'title') {
    world.resetToTitle();
    for (let i = 0; i < 62; i += 1) world.stepWorld(dt, IDLE);
    for (let i = 0; i < 120; i += 1) {
      world.stepWorld(dt, IDLE);
      const k = world.state.layout.knives[0];
      if (k && k.x > 495 && k.x < 640 && k.y < 515 && world.state.turkey.y < 430) break;
    }
    return true;
  }
  if (shotName === 'farm') {
    world.startNewRun(MODES.ESCAPE, 0);
    let tossed = false, bestSnap = false;
    for (let i = 0; i < 420; i += 1) {
      const st = world.state;
      if (st.stageIndex > 0) break;
      const ov0 = st.layout.ovens[0];
      const inp = autopilot(st);
      if (st.turkey.x >= 560 && st.turkey.x <= 780) {
        const jedReady = st.farmer.x >= 470 && st.farmer.x <= 720;
        if (!jedReady || ov0.state !== 'erupting') {
          inp.moveX = st.turkey.x > 700 ? -0.42 : st.turkey.x < 610 ? 0.42 : 0;
          if (st.turkey.grounded && st.turkey.tier < 1) inp.jumpPressed = true;
          inp.jumpHeld = true; inp.dashPressed = false;
        } else {
          inp.moveX = 1; if (st.turkey.grounded) inp.jumpPressed = true; inp.jumpHeld = true;
          if (!tossed && st.turkey.decoyCooldown <= 0) { inp.decoyPressed = true; tossed = true; }
          if (st.turkey.x >= 775 && st.turkey.stamina >= 0.56 && st.turkey.dashIframes <= 0) inp.dashPressed = true;
        }
      } else if (st.turkey.x > 780 && st.turkey.x <= 990) {
        inp.moveX = 1; inp.jumpHeld = true;
        if (!tossed && st.turkey.decoyCooldown <= 0) { inp.decoyPressed = true; tossed = true; }
        if (st.turkey.stamina >= 0.56 && st.turkey.dashIframes <= 0 && ov0.state === 'erupting') inp.dashPressed = true;
      }
      world.stepWorld(dt, inp);
      const jedVis = st.farmer.x >= st.cameraX + 60 && st.farmer.x <= st.turkey.x - 140;
      const hasShave = st.particles.callouts.some((c) => c.text.startsWith('CLOSE SHAVE!') && c.life >= 0.4);
      const hasProj = st.layout.knives.some((k) => k.active && k.x > st.cameraX + 120 && k.x < st.cameraX + 1140) ||
        st.layout.nets.some((n) => n.active && n.x > st.cameraX + 120 && n.x < st.cameraX + 1140);
      if (st.stageIndex === 0 && st.lives === 3 && ov0.state === 'erupting' && st.turkey.x >= 775 && st.turkey.x <= 1040 && st.turkey.y <= 475 && jedVis && st.farmer.badgeText.startsWith('!') && (hasShave || hasProj)) {
        bestSnap = true;
        if (hasShave && hasProj) break;
      }
      if (bestSnap && st.turkey.x > 1035) break;
    }
    world.state.bannerTimer = 0;
    return true;
  }
  if (shotName === 'kitchen') {
    world.startNewRun(MODES.ESCAPE, 0);
    let steps = 0;
    while (world.state.stageIndex < 2 && steps < 3200) {
      steps += 1;
      const st = world.state;
      if (st.screen === SCREENS.STAGE_CLEAR) { world.advanceStage(); continue; }
      if (st.screen === SCREENS.END) { world.startNewRun(MODES.ESCAPE, 0); continue; }
      world.stepWorld(dt, autopilot(st));
    }
    for (let i = 0; i < 1400; i += 1) {
      const st = world.state;
      if (st.screen === SCREENS.END) break;
      const finalOv = st.layout.ovens[st.layout.ovens.length - 1];
      const inp = autopilot(st);
      if (st.turkey.x >= 2850 && st.turkey.x <= 3390) {
        const chefReady = st.farmer.x >= 2660 && (st.farmer.state === 'chase' || st.farmer.state === 'throw');
        if (st.turkey.y > 325 && st.turkey.x < 3145) {
          inp.moveX = st.turkey.x < 3045 ? 0.85 : st.turkey.x > 3100 ? -0.6 : 0.2;
          if (st.turkey.grounded) inp.jumpPressed = true;
          inp.jumpHeld = true; inp.dashPressed = false;
        } else if (!chefReady || finalOv.state !== 'erupting') {
          inp.moveX = st.turkey.x < 3175 ? 0.35 : 0;
          inp.jumpHeld = true; inp.dashPressed = false;
        } else {
          inp.moveX = 1; inp.jumpHeld = true;
          if (st.turkey.x >= 3245 && st.turkey.stamina >= 0.56 && st.turkey.dashIframes <= 0) inp.dashPressed = true;
        }
      }
      world.stepWorld(dt, inp);
      const visibleTurkey = st.turkey.hitInvuln <= 0 || Math.floor(st.elapsed * 20) % 2 === 1;
      const noOuch = !st.particles.callouts.some((c) => c.text.startsWith('OUCH!'));
      const exitVis = st.layout.exit.x + st.layout.exit.w <= st.cameraX + VIEW.width + 20;
      const chefHot = (st.farmer.state === 'chase' || st.farmer.state === 'throw') && st.farmer.x >= st.cameraX + 95 && st.farmer.x <= st.turkey.x - 140;
      const hasKnife = st.layout.knives.some((k) => k.active && k.x > st.cameraX + 160 && k.x < st.cameraX + 1160);
      if (visibleTurkey && noOuch && exitVis && chefHot && finalOv.state === 'erupting' && hasKnife && st.turkey.facing === 1 && st.turkey.x >= 3155 && st.turkey.x <= 3385 && st.turkey.y >= 210 && st.turkey.y <= 335) {
        break;
      }
    }
    world.state.bannerTimer = 0;
    return true;
  }
  if (shotName === 'end') {
    world.startNewRun(MODES.ESCAPE, 0);
    let steps = 0, stealthFrames = 0;
    while (world.state.screen !== SCREENS.END && steps < 6400) {
      steps += 1;
      const st = world.state;
      if (st.screen === SCREENS.STAGE_CLEAR) { world.advanceStage(); continue; }
      const inp = autopilot(st, { useDecoy: true, useStealth: st.stageIndex === 0 && stealthFrames < 65 });
      if (st.turkey.hidden) stealthFrames += 1;
      world.stepWorld(dt, inp);
      if (st.screen === SCREENS.END && st.outcome !== 'escaped') { world.startNewRun(MODES.ESCAPE, 0); stealthFrames = 0; }
    }
    for (let i = 0; i < 16; i += 1) world.stepWorld(dt, IDLE);
    return true;
  }
  return false;
}
