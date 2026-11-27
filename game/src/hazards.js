// Stage obstacle layouts, roaring roasting ovens, spinning carving knives, stealth covers, bounce pads, and pickups.

import { EVENTS, HAZARD_CONFIG, VIEW } from './constants.js';

export function generateStageLayout(stageConfig, rng) {
  const len = stageConfig.length;
  const covers = [];
  const ovens = [];
  const bouncePads = [];
  const gravyPuddles = [];
  const pickups = [];
  const knives = [];
  const decoys = [];

  // Well-paced stage rhythm with clear sightlines so every landmark, trap, and cover reads at a glance.
  const coverPositions =
    stageConfig.id === 1
      ? [560, 1215, 1920, 2500]
      : stageConfig.id === 2
        ? [540, 1220, 1910, 2560]
        : [540, 1240, 1790, 2755];

  const ovenPositions =
    stageConfig.id === 1
      ? [980, 1680, 2340]
      : stageConfig.id === 2
        ? [920, 1600, 2270, 2860]
        : [920, 1620, 2085, 3035];

  const bouncePositions =
    stageConfig.id === 1
      ? [835, 1535, 2195]
      : stageConfig.id === 2
        ? [775, 1455, 2125, 2715]
        : [775, 1475, 1950, 2895];

  const gravyPositions =
    stageConfig.id === 1
      ? [1375, 2065]
      : stageConfig.id === 2
        ? [1335, 2015, 2630]
        : [1350, 2260, 2575];

  coverPositions.forEach((x, idx) => {
    covers.push({
      id: `cover-${stageConfig.id}-${idx}`,
      x,
      y: VIEW.groundY - HAZARD_CONFIG.coverHeight,
      w: HAZARD_CONFIG.coverWidth,
      h: HAZARD_CONFIG.coverHeight,
      kind: stageConfig.coverKind,
      label: stageConfig.coverLabel,
    });
  });

  ovenPositions.forEach((x, idx) => {
    ovens.push({
      id: `oven-${stageConfig.id}-${idx}`,
      x,
      y: VIEW.groundY - HAZARD_CONFIG.ovenHeight,
      w: HAZARD_CONFIG.ovenWidth,
      h: HAZARD_CONFIG.ovenHeight,
      cycle: stageConfig.ovenCycle,
      activeDur: stageConfig.ovenActive,
      telegraphDur: stageConfig.ovenTelegraph,
      phase: (idx * 1.1 + rng.range(0, 0.3)) % stageConfig.ovenCycle,
      state: 'idle',
      closeShaveAwarded: false,
      direction: -1,
    });
  });

  bouncePositions.forEach((x, idx) => {
    bouncePads.push({
      id: `bounce-${stageConfig.id}-${idx}`,
      x,
      y: VIEW.groundY - HAZARD_CONFIG.bounceHeight,
      w: HAZARD_CONFIG.bounceWidth,
      h: HAZARD_CONFIG.bounceHeight,
      squash: 0,
    });
  });

  gravyPositions.forEach((x, idx) => {
    gravyPuddles.push({
      id: `gravy-${stageConfig.id}-${idx}`,
      x,
      y: VIEW.groundY - HAZARD_CONFIG.gravyHeight + 8,
      w: HAZARD_CONFIG.gravyWidth,
      h: HAZARD_CONFIG.gravyHeight,
      bubblePhase: rng.range(0, Math.PI * 2),
    });
  });

  // Golden corn arcs over ovens and along sprint lanes.
  for (let x = 390; x < len - 280; x += 175) {
    const nearOven = ovens.some((o) => Math.abs(x - (o.x + o.w * 0.5)) < 120);
    const y = nearOven ? VIEW.groundY - 210 : VIEW.groundY - 68 - (x % 350 === 40 ? 48 : 0);
    pickups.push({
      kind: 'corn',
      x,
      y,
      radius: HAZARD_CONFIG.cornRadius,
      collected: false,
      bobPhase: rng.range(0, Math.PI * 2),
    });
  }

  // Wild cranberry heals on rewarding high arcs.
  [Math.floor(len * 0.38), Math.floor(len * 0.74)].forEach((x) => {
    pickups.push({
      kind: 'berry',
      x,
      y: VIEW.groundY - 188,
      radius: HAZARD_CONFIG.berryRadius,
      collected: false,
      bobPhase: rng.range(0, Math.PI * 2),
    });
  });

  // Stage 2 & 3 overhead sweeping carving knives!
  for (let i = 0; i < stageConfig.sweeperKnives; i += 1) {
    const baseX = stageConfig.id === 3 && i === 1 ? 2820 : Math.floor(len * (0.45 + i * 0.28));
    knives.push({
      kind: 'sweeper',
      x: baseX,
      y: VIEW.groundY - 134,
      baseX,
      baseY: VIEW.groundY - 134,
      vx: -225,
      vy: 0,
      w: HAZARD_CONFIG.knifeWidth + 8,
      h: HAZARD_CONFIG.knifeHeight + 4,
      angle: Math.PI,
      spin: 0,
      phase: i * 1.8,
      active: true,
      closeShaveAwarded: false,
      trail: [],
      arcPoints: [],
    });
  }

  const exit = {
    x: len - 172,
    y: stageConfig.id === 3 ? VIEW.groundY - 232 : VIEW.groundY - HAZARD_CONFIG.exitHeight,
    w: HAZARD_CONFIG.exitWidth,
    h: HAZARD_CONFIG.exitHeight,
    kind: stageConfig.id === 3 ? 'window' : 'gate',
  };

  return { covers, ovens, bouncePads, gravyPuddles, pickups, knives, decoys, exit };
}

export function spawnThrownKnife(knives, farmer, turkey, stageConfig) {
  const startX = farmer.x + farmer.w * 0.5 + farmer.facing * 26;
  const startY = farmer.y + 34;
  const targetX = turkey.x + turkey.w * 0.5 + turkey.vx * 0.26;
  const targetY = turkey.y + turkey.h * 0.4;
  const dx = targetX - startX;
  const dir = dx >= 0 ? 1 : -1;
  const speedX = (465 + (stageConfig.id - 1) * 44) * dir;
  const flightTime = Math.max(0.45, Math.min(1.05, Math.abs(dx) / Math.abs(speedX)));
  const gravity = 440;
  const speedY = Math.max(-330, Math.min(-65, (targetY - startY - 0.5 * gravity * flightTime * flightTime) / flightTime));

  const arcPoints = [];
  for (let t = 0.06; t <= 0.78; t += 0.08) {
    arcPoints.push({
      x: startX + speedX * t,
      y: startY + speedY * t + 0.5 * gravity * t * t,
    });
  }

  knives.push({
    kind: 'thrown',
    x: startX,
    y: startY,
    vx: speedX,
    vy: speedY,
    gravity,
    w: HAZARD_CONFIG.knifeWidth,
    h: HAZARD_CONFIG.knifeHeight,
    angle: Math.atan2(speedY, speedX),
    spin: dir * 13.5,
    age: 0,
    active: true,
    closeShaveAwarded: false,
    trail: [],
    arcPoints,
  });
}

export function updateRoastingOvens(ovens, dt, onBurst) {
  let events = EVENTS.NONE;
  for (let i = 0; i < ovens.length; i += 1) {
    const oven = ovens[i];
    const prevState = oven.state;
    oven.phase = (oven.phase + dt) % oven.cycle;
    const eruptStart = oven.cycle - oven.activeDur;
    const teleStart = eruptStart - oven.telegraphDur;

    if (oven.phase >= eruptStart) {
      oven.state = 'erupting';
      if (prevState !== 'erupting') {
        oven.closeShaveAwarded = false;
        events |= EVENTS.OVEN_BURST;
        onBurst?.(oven);
      }
    } else if (oven.phase >= teleStart) {
      oven.state = 'telegraph';
    } else {
      oven.state = 'idle';
      oven.closeShaveAwarded = false;
    }
  }
  return events;
}

export function getOvenFlameBox(oven) {
  return {
    x: oven.x - 24,
    y: oven.y - 44,
    w: oven.w + 48,
    h: HAZARD_CONFIG.ovenFlameHeight + 28,
  };
}

export function updateCarvingKnives(knives, dt, stageLength) {
  for (let i = knives.length - 1; i >= 0; i -= 1) {
    const k = knives[i];
    if (!k.active) {
      knives.splice(i, 1);
      continue;
    }

    if (k.kind === 'sweeper') {
      k.phase += dt * 2.15;
      k.x = k.baseX + Math.sin(k.phase) * 185;
      k.y = k.baseY + Math.cos(k.phase * 2) * 18;
      k.vx = Math.cos(k.phase) * 185 * 2.15;
      k.angle = k.vx >= 0 ? 0 : Math.PI;
      k.trail.push({ x: k.x, y: k.y, angle: k.angle, alpha: 0.45 });
      if (k.trail.length > 6) k.trail.shift();
      continue;
    }

    k.age += dt;
    k.vy += k.gravity * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
    k.angle += k.spin * dt;
    k.trail.push({ x: k.x, y: k.y, angle: k.angle, alpha: 0.65 });
    if (k.trail.length > 8) k.trail.shift();
    for (let t = 0; t < k.trail.length; t += 1) {
      k.trail[t].alpha *= 0.86;
    }

    if (k.y > VIEW.groundY + 30 || k.x < -120 || k.x > stageLength + 140) {
      k.active = false;
      knives.splice(i, 1);
    }
  }
}

export function updatePickupsAndProps(layout, dt) {
  for (let i = 0; i < layout.pickups.length; i += 1) {
    layout.pickups[i].bobPhase += dt * 4.2;
  }
  for (let i = 0; i < layout.bouncePads.length; i += 1) {
    layout.bouncePads[i].squash = Math.max(0, layout.bouncePads[i].squash - dt * 5.2);
  }
  for (let i = 0; i < layout.gravyPuddles.length; i += 1) {
    layout.gravyPuddles[i].bubblePhase += dt * 3.4;
  }
  for (let i = layout.decoys.length - 1; i >= 0; i -= 1) {
    const d = layout.decoys[i];
    d.life -= dt;
    if (!d.landed) {
      d.vy += 1280 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= VIEW.groundY - d.radius) {
        d.y = VIEW.groundY - d.radius;
        d.bounces += 1;
        d.justBounced = true;
        if (d.bounces >= 2 || Math.abs(d.vy) < 120) {
          d.vy = 0;
          d.vx *= 0.25;
          d.landed = true;
          d.pulseTimer = 0;
        } else {
          d.vy = -d.vy * 0.45;
          d.vx *= 0.62;
        }
      }
    } else {
      d.vx *= Math.max(0, 1 - dt * 8);
      d.x += d.vx * dt;
      d.pulseTimer += dt;
    }
    if (d.life <= 0) layout.decoys.splice(i, 1);
  }
}
