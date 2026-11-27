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
  pointerX: VIEW.width * 0.65,
  pointerY: VIEW.height * 0.5,
  pointerInside: false,
});

function createSmartAutopilot(state, opts = {}) {
  const { turkey, farmer, layout } = state;
  const tx = turkey.x + turkey.w * 0.5;
  const ty = turkey.y + turkey.h * 0.5;
  const input = { ...IDLE_INPUT, moveX: opts.moveX ?? 1 };

  // Proactively jump & flutter well clear of every roasting oven (idle, telegraphing, or erupting)!
  for (let i = 0; i < layout.ovens.length; i += 1) {
    const o = layout.ovens[i];
    const dist = o.x - tx;
    if (dist > -45 && dist < 175) {
      if (turkey.grounded && dist > 10) input.jumpPressed = true;
      input.jumpHeld = true;
      if (o.state === 'erupting' && dist < 95 && dist > -35 && ty > o.y - 55 && turkey.stamina >= 0.6) {
        input.dashPressed = true;
      }
    }
  }

  // Hop over spilled gravy puddles cleanly.
  for (let i = 0; i < layout.gravyPuddles.length; i += 1) {
    const g = layout.gravyPuddles[i];
    const dist = g.x - tx;
    if (dist > -8 && dist < 76 && turkey.grounded) {
      input.jumpPressed = true;
    }
  }

  // Dash cleanly through incoming carving knives to trigger Close Shaves without getting hit!
  for (let i = 0; i < layout.knives.length; i += 1) {
    const k = layout.knives[i];
    const dist = Math.hypot(k.x - tx, k.y - ty);
    if (dist < 145) {
      if (turkey.stamina >= 0.6) input.dashPressed = true;
      else if (turkey.grounded) input.jumpPressed = true;
      input.jumpHeld = true;
    }
  }

  // If Farmer closes in dangerously near, dash ahead!
  if (tx - (farmer.x + farmer.w * 0.5) < 118 && turkey.stamina >= 0.6) {
    input.dashPressed = true;
  }

  // Hold flutter glide when airborne over hazards.
  if (!turkey.grounded && turkey.vy > 20) {
    input.jumpHeld = true;
  }

  // Optionally toss an Acorn Decoy once to earn Decoy Master badge!
  if (opts.useDecoy && state.stats.decoysFooled === 0 && turkey.decoyCooldown <= 0 && tx > 480 && tx - farmer.x < 380) {
    input.decoyPressed = true;
  }

  // Optionally duck briefly into stealth cover when safe to earn Ghost Turkey badge!
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
    // Step real title animation until a gleaming carving knife arcs cleanly between Farmer and dashing Barnaby!
    for (let i = 0; i < 66; i += 1) {
      world.stepWorld(dt, IDLE_INPUT);
    }
    return true;
  }

  if (shotName === 'farm' || shotName === 'play') {
    world.startNewRun(MODES.ESCAPE);
    // Run real Stage 1 Golden Farmyard gameplay into the showcase action zone around Oven #1 (x=980) & Hay Bale #2 (x=1215).
    for (let i = 0; i < 480; i += 1) {
      const st = world.state;
      const inp = createSmartAutopilot(st, { useDecoy: false, useStealth: false });
      // Pace near x=1010..1130 so the Farmer closes in with '! SPOTTED!' & throws a real spinning carving knife!
      if (st.turkey.x > 1020 && st.layout.knives.length === 0) {
        inp.moveX = st.turkey.x > 1135 ? -0.35 : 0.2;
      }
      world.stepWorld(dt, inp);
      const oven1 = st.layout.ovens[0];
      const activeThrown = st.layout.knives.find(
        (k) => k.kind === 'thrown' && k.x > st.farmer.x + 115 && k.x < st.turkey.x + 160 && k.y < VIEW.groundY - 45,
      );
      if (
        st.turkey.x > 995 &&
        st.turkey.x < 1210 &&
        st.farmer.x > st.cameraX + 45 &&
        st.farmer.x < st.turkey.x - 165 &&
        oven1 &&
        oven1.state === 'erupting' &&
        activeThrown
      ) {
        // Trigger a dramatic Feather Dash + Flutter right next to the flying knife!
        if (st.turkey.stamina >= 0.6) {
          world.stepWorld(dt, { ...IDLE_INPUT, moveX: 1, dashPressed: true, jumpPressed: st.turkey.grounded, jumpHeld: true });
        }
        for (let f = 0; f < 5; f += 1) {
          world.stepWorld(dt, { ...IDLE_INPUT, moveX: 1, jumpHeld: true });
        }
        break;
      }
    }
    world.state.bannerTimer = 0;
    return true;
  }

  if (shotName === 'kitchen') {
    world.startNewRun(MODES.ESCAPE);
    // Play cleanly through real Stage 1 & Stage 2 into Stage 3 (Thanksgiving Kitchen)!
    let steps = 0;
    while (world.state.stageIndex < 2 && steps < 2800) {
      steps += 1;
      const st = world.state;
      if (st.screen === SCREENS.STAGE_CLEAR) {
        world.advanceStage();
        continue;
      }
      if (st.screen === SCREENS.END) {
        world.startNewRun(MODES.ESCAPE);
        continue;
      }
      world.stepWorld(dt, createSmartAutopilot(st, { useDecoy: true, useStealth: false }));
    }

    // Play Stage 3 Kitchen right to the thrilling climax near Copper Pot (x=2765), Oven #4 (x=3035), and OPEN ESCAPE WINDOW (x=3308)!
    for (let i = 0; i < 1100; i += 1) {
      const st = world.state;
      if (st.screen === SCREENS.END) break;
      const inp = createSmartAutopilot(st, { useDecoy: false, useStealth: false });
      if (st.turkey.x > 2760 && st.turkey.x < 3060) {
        // Keep Chef-Farmer on screen and let the final oven erupt with a thrown knife in flight!
        if (st.farmer.x < st.cameraX + 95 || !st.layout.knives.some((k) => k.kind === 'thrown')) {
          inp.moveX = st.turkey.x > 2910 ? -0.3 : 0.15;
        }
      }
      world.stepWorld(dt, inp);

      const finalOven = st.layout.ovens[st.layout.ovens.length - 1];
      const thrownKnife = st.layout.knives.find(
        (k) => k.kind === 'thrown' && k.x > st.farmer.x + 95 && k.x < st.cameraX + 1140 && k.y < VIEW.groundY - 40,
      );
      if (
        st.turkey.x > 2740 &&
        st.turkey.x < 3040 &&
        st.farmer.x > st.cameraX + 40 &&
        st.farmer.x < st.turkey.x - 140 &&
        finalOven &&
        finalOven.state === 'erupting' &&
        thrownKnife
      ) {
        // Launch dramatic flutter-dash toward the sunlit Open Escape Window!
        world.stepWorld(dt, { ...IDLE_INPUT, moveX: 1, jumpPressed: st.turkey.grounded, dashPressed: st.turkey.stamina >= 0.6, jumpHeld: true });
        for (let f = 0; f < 6; f += 1) {
          world.stepWorld(dt, { ...IDLE_INPUT, moveX: 1, jumpHeld: true });
        }
        break;
      }
    }
    world.state.bannerTimer = 0;
    return true;
  }

  if (shotName === 'end') {
    world.startNewRun(MODES.ESCAPE);
    // Play a genuine full 3-stage victorious escape through the Kitchen Open Escape Window!
    let steps = 0;
    let stealthFrames = 0;
    while (world.state.screen !== SCREENS.END && steps < 5200) {
      steps += 1;
      const st = world.state;
      if (st.screen === SCREENS.STAGE_CLEAR) {
        world.advanceStage();
        continue;
      }
      const useStealth = st.stageIndex === 0 && stealthFrames < 72;
      const inp = createSmartAutopilot(st, { useDecoy: true, useStealth });
      if (st.turkey.hidden) stealthFrames += 1;
      world.stepWorld(dt, inp);
      if (st.screen === SCREENS.END && st.outcome !== 'escaped') {
        world.startNewRun(MODES.ESCAPE);
        stealthFrames = 0;
      }
    }
    for (let i = 0; i < 16; i += 1) {
      world.stepWorld(dt, IDLE_INPUT);
    }
    return true;
  }

  return false;
}
