// Pursuing Farmer / Chef Jed AI: volumetric lantern cone, patrol, suspicious search, hay-bale flush, chase, net & knife throws, corner lunge.

import { EVENTS, FARMER_AI_CONFIG, VIEW } from './constants.js';

export const FARMER_STATES = Object.freeze({
  PATROL: 'patrol', SUSPICIOUS: 'suspicious', CHASE: 'chase', THROW: 'throw', CORNER_LUNGE: 'corner_lunge',
});

export function createFarmer(stageConfig, startX = 48) {
  return {
    x: startX, y: VIEW.groundY - FARMER_AI_CONFIG.height, vx: 0,
    w: FARMER_AI_CONFIG.width, h: FARMER_AI_CONFIG.height,
    facing: 1, role: stageConfig.farmerRole, state: FARMER_STATES.PATROL,
    stateTimer: 0, alertLevel: 0, targetX: startX + 260, lastSeenX: startX + 240,
    throwCooldown: 1.45 * stageConfig.knifeCooldownScale, throwKind: 'knife',
    lungeCooldown: 2.3, lungeDir: 1, stridePhase: 0, lanternSwing: 0, lanternPitch: 0,
    visionRange: FARMER_AI_CONFIG.visionRangeBase + (stageConfig.id - 1) * FARMER_AI_CONFIG.visionRangeStageBonus,
    badgeText: '', badgeColor: '#F4B63F', wasChasing: false, brokeChaseInCover: false, flushingCoverId: null,
  };
}

export function computeFarmerVisionCone(f) {
  const hot = f.state === FARMER_STATES.CHASE || f.state === FARMER_STATES.CORNER_LUNGE || f.state === FARMER_STATES.THROW;
  const sweep = f.state === FARMER_STATES.SUSPICIOUS ? Math.sin(f.lanternSwing * 4.8) * 0.2 : 0;
  const pitch = f.lanternPitch + sweep;
  return {
    originX: f.x + f.w * 0.5 + f.facing * 26, originY: f.y + 52, range: f.visionRange,
    angle: f.facing >= 0 ? pitch : Math.PI - pitch, halfSpread: hot ? 0.36 : 0.28,
  };
}

export function alertFarmerToPoint(f, targetX, badge = '? HUH?', duration = 2.6) {
  const fCx = f.x + f.w * 0.5;
  if (Math.abs(targetX - fCx) > 640) return false;
  f.state = FARMER_STATES.SUSPICIOUS; f.targetX = targetX; f.stateTimer = duration;
  f.facing = targetX >= fCx ? 1 : -1;
  f.badgeText = badge; f.badgeColor = badge.startsWith('!') ? '#FF6B2B' : '#F4B63F';
  return true;
}

export function updateFarmerAI(f, t, layout, cfg, dt, cb = {}) {
  let ev = EVENTS.NONE;
  const { decoys, covers, ovens } = layout;
  f.lanternSwing += dt;
  if (f.throwCooldown > 0) f.throwCooldown = Math.max(0, f.throwCooldown - dt);
  if (f.lungeCooldown > 0) f.lungeCooldown = Math.max(0, f.lungeCooldown - dt);
  const fCx = f.x + f.w * 0.5, tCx = t.x + t.w * 0.5, dx = tCx - fCx, absDx = Math.abs(dx);
  const inFront = Math.sign(dx || 1) === f.facing;
  const aimPitch = Math.max(-0.56, Math.min(0.14, Math.atan2((t.y + t.h * 0.5) - (f.y + 52), Math.max(120, absDx))));
  f.lanternPitch += ((f.state === FARMER_STATES.PATROL ? 0.04 : aimPitch) - f.lanternPitch) * Math.min(1, dt * 7);
  for (const d of decoys) {
    if (d.landed && !d.fooledCredited && Math.abs(d.x - fCx) < 560) {
      d.fooledCredited = true;
      if (alertFarmerToPoint(f, d.x, '? DECOY!', FARMER_AI_CONFIG.searchDuration + 0.9)) {
        ev |= EVENTS.FOOLED; cb.onFooled?.(d);
      }
    }
  }
  const vision = t.hidden ? f.visionRange * FARMER_AI_CONFIG.visionHiddenFactor : f.visionRange * (inFront ? 1.2 : 0.78);
  const canSee = absDx <= vision && (!t.hidden || absDx < 56) && !(f.state === FARMER_STATES.SUSPICIOUS && f.badgeText.includes('DECOY') && f.stateTimer > 1.2);
  if (canSee && f.state !== FARMER_STATES.THROW && f.state !== FARMER_STATES.CORNER_LUNGE) {
    if (f.state !== FARMER_STATES.CHASE) ev |= EVENTS.SPOTTED;
    f.state = FARMER_STATES.CHASE; f.lastSeenX = tCx;
    f.alertLevel = Math.min(1, f.alertLevel + dt * 3.2);
    f.wasChasing = true; f.flushingCoverId = null;
  } else if (f.state === FARMER_STATES.CHASE && !canSee) {
    f.state = FARMER_STATES.SUSPICIOUS; f.stateTimer = FARMER_AI_CONFIG.searchDuration;
    f.targetX = t.hidden ? f.lastSeenX + f.facing * 50 : f.lastSeenX;
    f.badgeText = '? SEARCHING'; f.badgeColor = '#F4B63F';
    if (t.hidden && f.wasChasing) f.brokeChaseInCover = true;
  }
  const sScale = cfg.farmerSpeedScale;
  const chaseSpd = FARMER_AI_CONFIG.chaseSpeedBase * sScale;
  const patrolSpd = FARMER_AI_CONFIG.patrolSpeedBase * sScale;
  let rubber = 1;
  if (!t.hidden && dx > FARMER_AI_CONFIG.rubberBandFarDist && !f.badgeText.includes('DECOY')) {
    rubber = FARMER_AI_CONFIG.rubberBandBoost; f.state = FARMER_STATES.CHASE; f.lastSeenX = tCx;
  }
  for (const c of covers) if (c.id !== f.flushingCoverId) c.flushProgress = Math.max(0, c.flushProgress - dt * 1.4);
  if (f.state === FARMER_STATES.PATROL) {
    f.badgeText = ''; f.flushingCoverId = null; f.alertLevel = Math.max(0, f.alertLevel - dt * 0.9);
    if (Math.abs(f.targetX - fCx) < 26) f.targetX = Math.max(110, Math.min(cfg.length - 300, fCx + (f.facing > 0 ? -300 : 380)));
    f.facing = f.targetX >= fCx ? 1 : -1; f.vx = f.facing * patrolSpd;
  } else if (f.state === FARMER_STATES.SUSPICIOUS) {
    f.stateTimer -= dt;
    if (!f.badgeText.startsWith('?')) f.badgeText = '? SEARCHING';
    f.badgeColor = '#F4B63F';
    const susCov = t.hidden ? covers.find((c) => c.id === t.coverId && Math.abs(c.x + c.w * 0.5 - fCx) < 118) : null;
    if (susCov && !f.badgeText.includes('DECOY')) {
      f.flushingCoverId = susCov.id; f.vx = 0; f.facing = susCov.x + susCov.w * 0.5 >= fCx ? 1 : -1;
      f.badgeText = '? CHECKING!'; susCov.shakeTimer = 0.16;
      susCov.flushProgress += dt / FARMER_AI_CONFIG.flushDuration;
      if (susCov.flushProgress >= 1) {
        susCov.flushProgress = 0; f.flushingCoverId = null;
        t.hidden = false; t.coverId = null; t.vy = -520; t.vx = (tCx >= fCx ? 1 : -1) * 320; t.grounded = false;
        f.state = FARMER_STATES.CHASE; f.badgeText = '! FOUND YOU !'; f.badgeColor = '#E03131';
        ev |= EVENTS.FLUSH | EVENTS.SPOTTED; cb.onFlush?.(susCov);
      }
    } else if (Math.abs(f.targetX - fCx) > 20) {
      f.flushingCoverId = null; f.facing = f.targetX >= fCx ? 1 : -1; f.vx = f.facing * patrolSpd * 1.15;
    } else f.vx = 0;
    if (f.stateTimer <= 0) {
      f.state = FARMER_STATES.PATROL; f.flushingCoverId = null; f.targetX = Math.min(cfg.length - 280, fCx + 340);
    }
  } else if (f.state === FARMER_STATES.CHASE) {
    f.badgeText = '! SPOTTED !'; f.badgeColor = '#E03131'; f.facing = dx >= 0 ? 1 : -1;
    const goal = tCx + (t.tier > 0 ? Math.sign(t.vx || f.facing) * 65 : 0);
    f.vx = Math.abs(goal - fCx) > 18 ? Math.sign(goal - fCx) * chaseSpd * rubber : 0;
    if (absDx < 205 && absDx > 70 && t.tier === 0 && f.lungeCooldown <= 0) {
      f.state = FARMER_STATES.CORNER_LUNGE; f.stateTimer = FARMER_AI_CONFIG.lungeDuration;
      f.lungeDir = f.facing; f.lungeCooldown = FARMER_AI_CONFIG.lungeCooldown;
      f.badgeText = '! LUNGE !'; f.badgeColor = '#FF6B2B';
    } else if (absDx >= 170 && absDx <= 600 && f.throwCooldown <= 0) {
      f.state = FARMER_STATES.THROW; f.stateTimer = FARMER_AI_CONFIG.throwWindup;
      f.throwKind = (t.tier >= 1 || !t.grounded) && cfg.id !== 3 ? 'net' : 'knife';
      f.vx *= 0.25; f.badgeText = f.throwKind === 'net' ? '! NET !' : '! SPOTTED !'; f.badgeColor = '#E03131';
    }
  } else if (f.state === FARMER_STATES.THROW) {
    f.vx *= 0.85; f.facing = dx >= 0 ? 1 : -1; f.stateTimer -= dt;
    if (f.stateTimer <= 0) {
      f.throwCooldown = FARMER_AI_CONFIG.throwCooldownBase * cfg.knifeCooldownScale;
      if (f.throwKind === 'net') { cb.onSpawnNet?.(f, t); ev |= EVENTS.NET_THROW; }
      else { cb.onSpawnKnife?.(f, t); ev |= EVENTS.KNIFE_THROW; }
      f.state = FARMER_STATES.CHASE;
    }
  } else if (f.state === FARMER_STATES.CORNER_LUNGE) {
    f.stateTimer -= dt; f.facing = f.lungeDir; f.vx = f.lungeDir * FARMER_AI_CONFIG.lungeSpeed * sScale;
    if (f.stateTimer <= 0) f.state = FARMER_STATES.CHASE;
  }
  let nextX = f.x + f.vx * dt;
  for (const ov of ovens) {
    if (ov.state !== 'erupting') continue;
    if (nextX + f.w > ov.x - 8 && nextX < ov.x + ov.w + 8) {
      if (f.vx > 0 && f.x + f.w <= ov.x + 8) { nextX = ov.x - f.w - 8; f.vx = 0; }
      else if (f.vx < 0 && f.x >= ov.x + ov.w - 8) { nextX = ov.x + ov.w + 8; f.vx = 0; }
    }
  }
  f.x = Math.max(18, Math.min(cfg.length - 200, nextX));
  if (Math.abs(f.vx) > 15) f.stridePhase += dt * (Math.abs(f.vx) / 34);
  return ev;
}
