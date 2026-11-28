// Visual juice: drifting autumn maple leaves, feather bursts, oven embers, steam puffs, ripples & comic callouts.

import { VIEW } from './constants.js';

export function createParticleSystem(rng) {
  const leaves = Array.from({ length: 28 }, () => ({
    x: rng.range(0, VIEW.width), y: rng.range(0, VIEW.groundY),
    vx: rng.range(-48, -18), vy: rng.range(16, 44), size: rng.range(6, 12),
    angle: rng.range(0, Math.PI * 2), spin: rng.range(-2.6, 2.6),
    color: rng.pick(['#D9480F', '#F08C00', '#C92A2A', '#E8590C', '#F4B43A']),
  }));
  return { leaves, particles: [], ripples: [], callouts: [] };
}

export function emitFeatherBurst(sys, rng, x, y, count = 10, spd = 240) {
  const cols = ['#9C4A1A', '#D97706', '#F4B43A', '#B91C1C', '#FFF3D6'];
  for (let i = 0; i < count; i += 1) {
    const a = rng.range(0, Math.PI * 2), s = rng.range(spd * 0.35, spd);
    sys.particles.push({ kind: 'feather', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 65, size: rng.range(8, 15), angle: rng.range(0, Math.PI * 2), spin: rng.range(-8, 8), life: rng.range(0.45, 0.95), maxLife: 0.95, color: rng.pick(cols) });
  }
}

export function emitOvenEmbers(sys, rng, x, y, count = 7) {
  const cols = ['#FFF3BF', '#FFA94D', '#FF6B2B', '#E03131'];
  for (let i = 0; i < count; i += 1) {
    sys.particles.push({ kind: 'ember', x: x + rng.range(-36, 36), y: y + rng.range(-12, 12), vx: rng.range(-55, 55), vy: rng.range(-220, -90), size: rng.range(3, 7), angle: 0, spin: 0, life: rng.range(0.35, 0.8), maxLife: 0.8, color: rng.pick(cols) });
  }
}

export function emitSteamPuff(sys, rng, x, y, count = 2, color = 'rgba(255,250,242,0.72)') {
  for (let i = 0; i < count; i += 1) {
    sys.particles.push({ kind: 'steam', x: x + rng.range(-24, 24), y: y + rng.range(-8, 8), vx: rng.range(-18, 18), vy: rng.range(-165, -95), size: rng.range(14, 28), angle: rng.range(0, Math.PI * 2), spin: rng.range(-1.2, 1.2), life: rng.range(0.65, 1.25), maxLife: 1.25, color });
  }
}

export function emitSparkBurst(sys, rng, x, y, color = '#FFE066', count = 10) {
  for (let i = 0; i < count; i += 1) {
    const a = rng.range(0, Math.PI * 2), s = rng.range(95, 295);
    sys.particles.push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, size: rng.range(3, 6), angle: a, spin: 0, life: rng.range(0.24, 0.48), maxLife: 0.48, color });
  }
}

export const emitSoundRipple = (sys, x, y, color = '#FFE066', maxRadius = 96, startRadius = 14) =>
  sys.ripples.push({ x, y, radius: startRadius, startRadius, maxRadius, life: 0.56, maxLife: 0.56, color });

export function emitFloatingCallout(sys, x, y, text, color = '#FFE066', scale = 1) {
  let fy = Math.max(122, y);
  for (let pass = 0; pass < 4; pass += 1) {
    if (!sys.callouts.some((c) => Math.abs(c.x - x) < 230 && Math.abs(c.y - fy) < 42)) break;
    fy = Math.max(116, fy - 42);
  }
  sys.callouts.push({ x, y: fy, vy: -62, text, color, scale, life: 1.28, maxLife: 1.28 });
}

export function updateParticles(sys, dt, windX = -36) {
  for (const l of sys.leaves) {
    l.x += (l.vx + windX) * dt; l.y += l.vy * dt + Math.sin(l.angle * 1.5) * 14 * dt; l.angle += l.spin * dt;
    if (l.x < -24) l.x = VIEW.width + 24;
    if (l.y > VIEW.groundY + 12) { l.y = -16; l.x = (l.x + 220) % VIEW.width; }
  }
  for (let i = sys.particles.length - 1; i >= 0; i -= 1) {
    const p = sys.particles[i];
    if ((p.life -= dt) <= 0) { sys.particles.splice(i, 1); continue; }
    if (p.kind === 'feather') { p.vy += 245 * dt; p.vx *= Math.max(0, 1 - dt * 2.4); p.angle += p.spin * dt; }
    else if (p.kind === 'ember') { p.vy -= 26 * dt; p.vx += Math.sin(p.life * 14) * 36 * dt; }
    else if (p.kind === 'steam') { p.size += dt * 16; p.vx += Math.sin(p.life * 7 + p.angle) * 24 * dt; }
    else p.vy += 520 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = sys.ripples.length - 1; i >= 0; i -= 1) {
    const r = sys.ripples[i];
    if ((r.life -= dt) <= 0) { sys.ripples.splice(i, 1); continue; }
    r.radius = r.startRadius + (r.maxRadius - r.startRadius) * (1 - r.life / r.maxLife);
  }
  for (let i = sys.callouts.length - 1; i >= 0; i -= 1) {
    const c = sys.callouts[i];
    if ((c.life -= dt) <= 0) { sys.callouts.splice(i, 1); continue; }
    c.y += c.vy * dt; c.vy *= Math.max(0, 1 - dt * 3.1);
  }
}
