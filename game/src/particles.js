// Visual juice: fluttering autumn maple leaves, turkey feather bursts, oven embers, sound ripples, and comic callouts.

import { VIEW } from './constants.js';

export function createParticleSystem(rng) {
  const leaves = [];
  for (let i = 0; i < 28; i += 1) {
    leaves.push({
      x: rng.range(0, VIEW.width),
      y: rng.range(0, VIEW.groundY),
      vx: rng.range(-48, -18),
      vy: rng.range(18, 46),
      size: rng.range(6, 12),
      angle: rng.range(0, Math.PI * 2),
      spin: rng.range(-2.6, 2.6),
      color: rng.pick(['#D9480F', '#F08C00', '#C92A2A', '#E8590C', '#F4B43A']),
    });
  }
  return {
    leaves,
    particles: [],
    ripples: [],
    callouts: [],
  };
}

export function emitFeatherBurst(sys, rng, x, y, count = 10, spreadSpeed = 240) {
  const colors = ['#9C4A1A', '#D97706', '#F4B43A', '#B91C1C', '#FFF3D6'];
  for (let i = 0; i < count; i += 1) {
    const angle = rng.range(0, Math.PI * 2);
    const speed = rng.range(spreadSpeed * 0.35, spreadSpeed);
    sys.particles.push({
      kind: 'feather',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 65,
      size: rng.range(8, 15),
      angle: rng.range(0, Math.PI * 2),
      spin: rng.range(-8, 8),
      life: rng.range(0.45, 0.95),
      maxLife: 0.95,
      color: rng.pick(colors),
    });
  }
}

export function emitOvenEmbers(sys, rng, x, y, count = 7) {
  const colors = ['#FFEC99', '#FFA94D', '#FF6B2B', '#E03131'];
  for (let i = 0; i < count; i += 1) {
    sys.particles.push({
      kind: 'ember',
      x: x + rng.range(-34, 34),
      y: y + rng.range(-12, 12),
      vx: rng.range(-55, 55),
      vy: rng.range(-210, -85),
      size: rng.range(3, 7),
      angle: 0,
      spin: 0,
      life: rng.range(0.35, 0.8),
      maxLife: 0.8,
      color: rng.pick(colors),
    });
  }
}

export function emitSparkBurst(sys, rng, x, y, color = '#FFE066', count = 10) {
  for (let i = 0; i < count; i += 1) {
    const a = rng.range(0, Math.PI * 2);
    const spd = rng.range(90, 290);
    sys.particles.push({
      kind: 'spark',
      x,
      y,
      vx: Math.cos(a) * spd,
      vy: Math.sin(a) * spd - 40,
      size: rng.range(3, 6),
      angle: a,
      spin: 0,
      life: rng.range(0.24, 0.48),
      maxLife: 0.48,
      color,
    });
  }
}

export function emitSoundRipple(sys, x, y, color = '#FFE066', maxRadius = 92) {
  sys.ripples.push({ x, y, radius: 12, maxRadius, life: 0.55, maxLife: 0.55, color });
}

export function emitFloatingCallout(sys, x, y, text, color = '#FFE066', scale = 1) {
  let finalY = Math.max(136, y);
  for (let pass = 0; pass < 4; pass += 1) {
    const conflict = sys.callouts.some(
      (c) => Math.abs(c.x - x) < 220 && Math.abs(c.y - finalY) < 38,
    );
    if (!conflict) break;
    finalY = Math.max(128, finalY - 38);
  }
  sys.callouts.push({
    x,
    y: finalY,
    vy: -68,
    text,
    color,
    scale,
    life: 1.05,
    maxLife: 1.05,
  });
}

export function updateParticles(sys, dt, windX = -35) {
  for (let i = 0; i < sys.leaves.length; i += 1) {
    const leaf = sys.leaves[i];
    leaf.x += (leaf.vx + windX) * dt;
    leaf.y += leaf.vy * dt + Math.sin(leaf.angle * 1.5) * 14 * dt;
    leaf.angle += leaf.spin * dt;
    if (leaf.x < -24) leaf.x = VIEW.width + 24;
    if (leaf.y > VIEW.groundY + 12) {
      leaf.y = -16;
      leaf.x = (leaf.x + 220) % VIEW.width;
    }
  }

  for (let i = sys.particles.length - 1; i >= 0; i -= 1) {
    const p = sys.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      sys.particles.splice(i, 1);
      continue;
    }
    if (p.kind === 'feather') {
      p.vy += 260 * dt;
      p.vx *= Math.max(0, 1 - dt * 2.4);
      p.angle += p.spin * dt;
    } else if (p.kind === 'ember') {
      p.vy -= 25 * dt;
      p.vx += Math.sin(p.life * 14) * 35 * dt;
    } else {
      p.vy += 520 * dt;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  for (let i = sys.ripples.length - 1; i >= 0; i -= 1) {
    const r = sys.ripples[i];
    r.life -= dt;
    if (r.life <= 0) {
      sys.ripples.splice(i, 1);
      continue;
    }
    const t = 1 - r.life / r.maxLife;
    r.radius = 12 + (r.maxRadius - 12) * t;
  }

  for (let i = sys.callouts.length - 1; i >= 0; i -= 1) {
    const c = sys.callouts[i];
    c.life -= dt;
    if (c.life <= 0) {
      sys.callouts.splice(i, 1);
      continue;
    }
    c.y += c.vy * dt;
    c.vy *= Math.max(0, 1 - dt * 3.1);
  }
}
