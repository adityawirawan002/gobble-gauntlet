// Multi-tier stage configs and deterministic layout generator for all 3 Thanksgiving stages.

import { HAZARD_CONFIG, VIEW } from './constants.js';

export const STAGES = Object.freeze([
  {
    id: 1, key: 'farmyard', title: 'GOLDEN FARMYARD', shortName: 'FARMYARD',
    bannerSub: 'Vault barn rafters or hide in hay bales — outwit Farmer Jed!',
    length: 3120, coverKind: 'hay', farmerRole: 'farmer',
    farmerSpeedScale: 1.0, knifeCooldownScale: 1.0,
    ovenCycle: 3.3, ovenActive: 1.15, ovenTelegraph: 0.72, sweeperKnives: 0, hasDog: false,
  },
  {
    id: 2, key: 'smokehouse', title: 'SMOKEHOUSE & ORCHARD', shortName: 'SMOKEHOUSE',
    bannerSub: 'Ride chimney smoke updrafts over Buster the Dog & cider racks!',
    length: 3420, coverKind: 'barrel', farmerRole: 'farmer',
    farmerSpeedScale: 1.1, knifeCooldownScale: 0.86,
    ovenCycle: 2.95, ovenActive: 1.15, ovenTelegraph: 0.66, sweeperKnives: 1, hasDog: true,
  },
  {
    id: 3, key: 'kitchen', title: 'THANKSGIVING KITCHEN', shortName: 'KITCHEN',
    bannerSub: 'Ride copper pot steam onto hanging pot racks toward the Escape Window!',
    length: 3680, coverKind: 'pot', farmerRole: 'chef',
    farmerSpeedScale: 1.18, knifeCooldownScale: 0.75,
    ovenCycle: 2.75, ovenActive: 1.18, ovenTelegraph: 0.62, sweeperKnives: 2, hasDog: false,
  },
]);

function addCornArc(pickups, x0, x1, baseY, arcH, count, skipCenter = false) {
  for (let i = 0; i < count; i += 1) {
    if (skipCenter && count === 3 && i === 1) continue;
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = x0 + (x1 - x0) * t;
    pickups.push({ kind: 'corn', x, y: baseY - Math.sin(t * Math.PI) * arcH, radius: HAZARD_CONFIG.cornRadius, collected: false, bobPhase: x * 0.015 });
  }
}

function buildPlatforms(id, len) {
  const m = VIEW.midTierY, h = VIEW.highTierY;
  const specs = id === 1 ? [
    [420, m, 210, 24, 'barrels', 1], [690, h + 6, 250, 24, 'rafter', 2],
    [1010, m - 6, 220, 24, 'tractor', 1], [1310, h, 270, 24, 'rafter', 2],
    [1640, m + 6, 210, 24, 'fence_deck', 1], [1930, h + 4, 245, 24, 'silo_awning', 2],
    [2240, m - 4, 220, 24, 'barrels', 1], [2520, h + 8, 260, 24, 'windmill_ledge', 2],
  ] : id === 2 ? [
    [440, m, 220, 24, 'cider_press', 1], [740, h, 270, 24, 'smoke_beam', 2],
    [1090, m + 4, 230, 24, 'cider_press', 1], [1420, h + 6, 250, 24, 'apple_basket', 2],
    [1760, m - 4, 220, 24, 'cider_press', 1], [2070, h, 280, 24, 'smoke_beam', 2],
    [2430, m + 4, 230, 24, 'cider_press', 1], [2740, h + 4, 280, 24, 'apple_basket', 2],
  ] : [
    [440, m, 230, 26, 'butcher_block', 1], [730, h + 4, 275, 22, 'pot_rack', 2],
    [1100, m, 235, 26, 'butcher_block', 1], [1420, h, 270, 22, 'pantry_shelf', 2],
    [1780, m + 2, 240, 26, 'butcher_block', 1], [2110, h + 2, 280, 22, 'pot_rack', 2],
    [2470, m, 235, 26, 'butcher_block', 1], [2790, h + 4, 285, 22, 'pot_rack', 2],
    [3135, h + 6, 255, 22, 'pot_rack', 2],
  ];
  return specs.filter(([x, , w]) => x + w < len - 130)
    .map(([x, y, w, h2, kind, tier]) => ({ x, y, w, h: h2, kind, tier, oneWay: true }));
}

export function generateStageLayout(cfg, rng) {
  const len = cfg.length, gY = VIEW.groundY;
  const platforms = buildPlatforms(cfg.id, len);
  const coverXs = cfg.id === 1 ? [490, 1130, 1770, 2350] : cfg.id === 2 ? [530, 1210, 1920, 2575] : [550, 1270, 1975, 2585];
  const covers = coverXs.map((x, i) => ({
    id: `cover_${cfg.id}_${i}`, x, y: gY - HAZARD_CONFIG.coverHeight,
    w: HAZARD_CONFIG.coverWidth, h: HAZARD_CONFIG.coverHeight, kind: cfg.coverKind, shakeTimer: 0, flushProgress: 0,
  }));
  const ovenXs = cfg.id === 1 ? [855, 1485, 2095, 2690] : cfg.id === 2 ? [905, 1610, 2265, 2910] : [935, 1630, 2335, 3145];
  const ovens = ovenXs.map((x, i) => ({
    id: `oven_${cfg.id}_${i}`, x, y: gY - HAZARD_CONFIG.ovenHeight, w: HAZARD_CONFIG.ovenWidth, h: HAZARD_CONFIG.ovenHeight,
    cycle: cfg.ovenCycle, activeDur: cfg.ovenActive, telegraphDur: cfg.ovenTelegraph,
    phase: (i * 1.1 + cfg.id * 0.45) % cfg.ovenCycle, state: 'idle', closeShaveAwarded: false,
  }));
  const ventXs = cfg.id === 2 ? [685, 1365, 2020, 2695] : cfg.id === 3 ? [680, 1375, 2065, 2765, 3035, 3398] : [];
  const updrafts = ventXs.map((vx) => ({
    x: vx, y: VIEW.highTierY - 40, w: 88, h: gY - (VIEW.highTierY - 40), kind: cfg.id === 3 ? 'stockpot' : 'chimney', phase: vx * 0.02,
  }));
  const bounceXs = cfg.id === 1 ? [650, 1280, 1900, 2500] : cfg.id === 2 ? [1040, 2380] : [1045, 2410];
  const bouncePads = bounceXs.map((x) => ({ x, y: gY - HAZARD_CONFIG.bounceHeight, w: HAZARD_CONFIG.bounceWidth, h: HAZARD_CONFIG.bounceHeight, squash: 0 }));
  const puddleXs = cfg.id === 1 ? [1295, 2210] : cfg.id === 2 ? [1100, 2410] : [1120, 1810, 2880];
  const gravyPuddles = puddleXs.map((x) => ({
    x, y: gY - 8, w: HAZARD_CONFIG.gravyWidth, h: HAZARD_CONFIG.gravyHeight,
    kind: cfg.id === 3 ? 'gravy' : 'mud', bubblePhase: rng.range(0, Math.PI * 2),
  }));
  const rollSpecs = cfg.id === 1 ? [[1180, 1730, 1580, -155], [2210, 2660, 2560, -175]]
    : cfg.id === 2 ? [[1540, 2210, 2050, -185]] : [[1520, 2260, 2040, -190]];
  const pumpkins = rollSpecs.map(([minX, maxX, x, vx]) => ({
    x, y: gY - HAZARD_CONFIG.pumpkinRadius, vx, minX, maxX, radius: HAZARD_CONFIG.pumpkinRadius,
    angle: 0, kind: cfg.id === 3 ? 'roast_pan' : 'pumpkin', closeShaveAwarded: false,
  }));
  const dogs = cfg.hasDog ? [{ x: 1620, y: gY - 56, w: 76, h: 56, minX: 1320, maxX: 1940, vx: -115, facing: -1, barkCooldown: 0, barkTimer: 0, stride: 0 }] : [];
  const pickups = [];
  for (let i = 0; i < platforms.length; i += 1) {
    const p = platforms[i];
    const hasBerry = i % 3 === 1;
    addCornArc(pickups, p.x + 36, p.x + p.w - 36, p.y - 34, p.tier === 2 ? 36 : 24, hasBerry ? 3 : 2, hasBerry);
    if (hasBerry) pickups.push({ kind: 'berry', x: p.x + p.w * 0.5, y: p.y - 78, radius: HAZARD_CONFIG.berryRadius, collected: false, bobPhase: i * 1.1 });
  }
  for (let i = 0; i < ovens.length; i += 1) {
    const ov = ovens[i];
    if (i % 2 === 0) addCornArc(pickups, ov.x + 8, ov.x + ov.w - 8, ov.y - 96, 32, 2);
  }
  const knives = [];
  for (let i = 0; i < cfg.sweeperKnives; i += 1) {
    const baseX = Math.round(len * (0.44 + i * 0.25));
    const baseY = i === 0 ? VIEW.midTierY - 56 : VIEW.highTierY - 46;
    knives.push({
      kind: 'sweeper', x: baseX, y: baseY, baseX, baseY, vx: -230, vy: 0,
      w: HAZARD_CONFIG.knifeWidth + 8, h: HAZARD_CONFIG.knifeHeight + 4,
      angle: Math.PI, spin: 0, phase: i * 1.8, active: true, closeShaveAwarded: false, trail: [], arcPoints: [],
    });
  }
  const exit = cfg.id === 3
    ? { x: len - 186, y: VIEW.highTierY - 128, w: HAZARD_CONFIG.exitWidth + 14, h: HAZARD_CONFIG.exitHeight + 18, kind: 'window' }
    : { x: len - 178, y: gY - HAZARD_CONFIG.exitHeight, w: HAZARD_CONFIG.exitWidth, h: HAZARD_CONFIG.exitHeight, kind: 'gate' };
  return { platforms, covers, ovens, updrafts, bouncePads, gravyPuddles, pickups, knives, nets: [], pumpkins, decoys: [], dogs, exit };
}
