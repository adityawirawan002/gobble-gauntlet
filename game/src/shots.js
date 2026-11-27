// Deterministic real-simulation driver for ?shot=title|farm|kitchen|end&seed=1 captures.

import { MODES, SCREENS, VIEW } from './constants.js';

const IDLE_INPUT = Object.freeze({
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  dashPressed: false,
  hidePressed: false,
  hideHeld: false,
  decoyPressed: false,
  pointerX: VIEW.width * 0.78,
  pointerY: VIEW.height * 0.5,
  pointerInside: false,
});

function createSmartAutopilot(state, opts = {}) {
  const { turkey, farmer, layout } = state;
  const tx = turkey.x + turkey.w * 0.5;
  const ty = turkey.y + turkey.h * 0.5;
  const input = { ...IDLE_INPUT, moveX: opts.moveX ?? 1 };

  for (let i = 0; i < layout.ovens.length; i += 1) {
    const o = layout.ovens[i];
    const dist = o.x - tx;
    if (dist > -48 && dist < 185) {
      if (turkey.grounded && dist > 10) input.jumpPressed = true;
      input.jumpHeld = true;
      if (o.state === 'erupting' && dist < 105 && dist > -40 && ty > o.y - 68 && turkey.stamina >= 0.6) {
        input.dashPressed = true;
      }
    }
  }

  for (let i = 0; i < layout.gravyPuddles.length; i += 1) {
    const g = layout.gravyPuddles[i];
    const dist = g.x - tx;
    if (dist > -8 && dist < 76 && turkey.grounded) input.jumpPressed = true;
  }

  for (let i = 0; i < layout.knives.length; i += 1) {
    const k = layout.knives[i];
    const dist = Math.hypot(k.x - tx, k.y - ty);
    if (dist < 145) {
      if (turkey.stamina >= 0.6) input.dashPressed = true;
      else if (turkey.grounded) input.jumpPressed = true;
      input.jumpHeld = true;
    }
  }

  if (tx - (farmer.x + farmer.w * 0.5) < 122 && turkey.stamina >= 0.6) input.dashPressed = true;
  if (!turkey.grounded && turkey.vy > 20) input.jumpHeld = true;

  if (opts.useDecoy && state.stats.decoysFooled === 0 && turkey.decoyCooldown <= 0 && tx > 480 && tx - farmer.x < 380) {
    input.decoyPressed = true;
  }

  if (
    opts.useStealth &&
    state.stats.stealthEscapes === 0 &&
    turkey.nearbyCover &&
    tx - farmer.x > 165 &&
    tx - farmer.x < 350
  ) {
    input.moveX = 0;
    input.hidePressed = !turkey.hidden;
    input.hideHeld = true;
  }

  return input;
}

export function applyDeterministicShot(world, shotName) {
  const dt = VIEW.fixedDt;

  if (shotName === 'title' || shotName === 'start') {
    world.resetToTitle();
    for (let i = 0; i < 66; i += 1) world.stepWorld(dt, IDLE_INPUT);
    return true;
  }

  if (shotName === 'farm' || shotName === 'play') {
    world.startNewRun(MODES.ESCAPE);
    let launched = false;
    let tossedDecoy = false;
    for (let i = 0; i < 320; i += 1) {
      const st = world.state;
      const oven1 = st.layout.ovens[0];
      const inp = { ...IDLE_INPUT, moveX: 1 };
      const closeKnife = st.layout.knives.find(
        (k) => Math.hypot(k.x - (st.turkey.x + 30), k.y - (st.turkey.y + 34)) < 135,
      );

      if (!launched) {
        const timeToErupt = oven1.cycle - oven1.activeDur - oven1.phase;
        const ovenWindow = oven1.state === 'erupting' || (oven1.state === 'telegraph' && timeToErupt < 0.34);
        const hasThrown = st.layout.knives.some((k) => k.kind === 'thrown' && k.x > st.farmer.x + 40);
        if (st.turkey.x < 680) {
          inp.moveX = 1;
          if (closeKnife && st.turkey.grounded) inp.jumpPressed = true;
          if (!st.turkey.grounded && st.turkey.vy > 0) inp.jumpHeld = true;
        } else if (!ovenWindow || !hasThrown || st.farmer.x < 480) {
          const targetHold = Math.min(748, Math.max(705, st.farmer.x + 235));
          inp.moveX = st.turkey.x > targetHold + 12 ? -0.45 : st.turkey.x < targetHold - 12 ? 0.45 : 0;
          if (closeKnife && st.turkey.grounded) inp.jumpPressed = true;
          if (!st.turkey.grounded && st.turkey.vy > 0) inp.jumpHeld = true;
        } else {
          launched = true;
        }
      }

      if (launched) {
        inp.moveX = 1;
        if (!st.turkey.grounded) inp.jumpHeld = true;
        if (!tossedDecoy && st.turkey.decoyCooldown <= 0) {
          inp.decoyPressed = true;
          inp.pointerInside = true;
          inp.pointerX = VIEW.width - 40;
          tossedDecoy = true;
        }

        if (
          st.turkey.x >= 930 &&
          st.turkey.x <= 1040 &&
          !st.turkey.grounded &&
          st.turkey.stamina >= 0.6 &&
          st.turkey.dashIframes <= 0
        ) {
          inp.dashPressed = true;
        }
      }

      world.stepWorld(dt, inp);

      const thrownKnife = st.layout.knives.find(
        (k) =>
          k.kind === 'thrown' &&
          k.x > st.farmer.x + 135 &&
          k.x < st.turkey.x + 120 &&
          k.y < VIEW.groundY - 12,
      );
      const hasCloseShave = st.particles.callouts.some(
        (c) => c.text.startsWith('CLOSE SHAVE!') && c.life >= 0.65,
      );
      const hasOnlyCloseShave = st.particles.callouts.length === 1 && hasCloseShave;
      const decoyInLane = st.layout.decoys.find(
        (d) => d.x >= oven1.x + oven1.w - 8 && d.x <= 1235 && d.bounces >= 1,
      );

      if (
        launched &&
        st.lives === 3 &&
        hasOnlyCloseShave &&
        oven1.state === 'erupting' &&
        st.turkey.x >= 965 &&
        st.turkey.x <= 1135 &&
        st.turkey.y + st.turkey.h < oven1.y - 45 &&
        st.turkey.dashIframes > 0 &&
        st.farmer.x > st.cameraX + 45 &&
        st.farmer.x < st.turkey.x - 190 &&
        st.farmer.badgeText === '! SPOTTED!' &&
        thrownKnife &&
        decoyInLane
      ) {
        break;
      }
    }
    world.state.bannerTimer = 0;
    return true;
  }

  if (shotName === 'kitchen') {
    world.startNewRun(MODES.ESCAPE);
    let steps = 0;
    while (world.state.stageIndex < 2 && steps < 2800) {
      steps += 1;
      const st = world.state;
      if (st.screen === SCREENS.STAGE_CLEAR) { world.advanceStage(); continue; }
      if (st.screen === SCREENS.END) { world.startNewRun(MODES.ESCAPE); continue; }
      world.stepWorld(dt, createSmartAutopilot(st, { useDecoy: false, useStealth: false }));
    }

    for (let i = 0; i < 650; i += 1) {
      const st = world.state;
      if (st.screen === SCREENS.END) break;
      const finalOven = st.layout.ovens[st.layout.ovens.length - 1];
      const oven3 = st.layout.ovens[2];
      const inp = createSmartAutopilot(st, { useDecoy: false, useStealth: false });

      if (st.turkey.x >= 2660 && st.turkey.x <= 2920) {
        const chefOnFloor = st.farmer.x >= oven3.x + oven3.w + 150 && st.farmer.x <= 2580;
        const hasThrown = st.layout.knives.some((k) => k.kind === 'thrown' && k.x > st.farmer.x + 80);
        if (!chefOnFloor || !hasThrown || finalOven.state !== 'erupting') {
          inp.moveX = st.turkey.x > 2765 ? -0.42 : st.turkey.x < 2710 ? 0.35 : 0;
          inp.jumpPressed = false;
          inp.jumpHeld = false;
          inp.dashPressed = false;
          const nearThrown = st.layout.knives.find(
            (k) => k.kind === 'thrown' && Math.hypot(k.x - (st.turkey.x + 30), k.y - (st.turkey.y + 34)) < 115,
          );
          if (nearThrown && st.turkey.stamina >= 0.6) {
            inp.moveX = 1;
            inp.dashPressed = true;
          }
        } else {
          inp.moveX = 1;
          if (st.turkey.grounded) inp.jumpPressed = true;
          inp.jumpHeld = true;
          if (st.turkey.stamina >= 0.6 && st.turkey.dashIframes <= 0) inp.dashPressed = true;
        }
      }
      world.stepWorld(dt, inp);

      const chefClear = st.farmer.x >= oven3.x + oven3.w + 150 && st.farmer.x + st.farmer.w <= finalOven.x - 160;
      const thrownKnife = st.layout.knives.find(
        (k) => k.kind === 'thrown' && k.x > st.farmer.x + 150 && k.x < st.cameraX + 1060 && k.y < VIEW.groundY - 25,
      );
      const sweeperNearChef = st.layout.knives.some(
        (k) => k.kind === 'sweeper' && Math.abs(k.x - (st.farmer.x + st.farmer.w * 0.5)) < 150,
      );
      const hasCloseShave = st.particles.callouts.some(
        (c) => c.text.startsWith('CLOSE SHAVE!') && c.life >= 0.72,
      );
      const hasOuch = st.particles.callouts.some((c) => c.text.startsWith('OUCH!'));

      if (
        !hasOuch &&
        hasCloseShave &&
        (st.turkey.hitInvuln <= 0 || Math.floor(st.elapsed * 20) % 2 === 1) &&
        chefClear &&
        !sweeperNearChef &&
        finalOven.state === 'erupting' &&
        thrownKnife &&
        st.turkey.x >= 2740 &&
        st.turkey.x <= 2985 &&
        st.farmer.x > st.cameraX + 120 &&
        st.farmer.x < st.turkey.x - 185
      ) {
        break;
      }
    }
    world.state.bannerTimer = 0;
    return true;
  }

  if (shotName === 'end') {
    world.startNewRun(MODES.ESCAPE);
    let steps = 0;
    let stealthFrames = 0;
    while (world.state.screen !== SCREENS.END && steps < 5200) {
      steps += 1;
      const st = world.state;
      if (st.screen === SCREENS.STAGE_CLEAR) { world.advanceStage(); continue; }
      const useStealth = st.stageIndex === 0 && stealthFrames < 72;
      const inp = createSmartAutopilot(st, { useDecoy: true, useStealth });
      if (st.turkey.hidden) stealthFrames += 1;
      world.stepWorld(dt, inp);
      if (st.screen === SCREENS.END && st.outcome !== 'escaped') {
        world.startNewRun(MODES.ESCAPE);
        stealthFrames = 0;
      }
    }
    for (let i = 0; i < 16; i += 1) world.stepWorld(dt, IDLE_INPUT);
    return true;
  }

  return false;
}
