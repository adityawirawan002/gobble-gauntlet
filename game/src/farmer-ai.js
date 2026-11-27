// Pursuing Farmer / Chef AI state machine: patrol, investigate, chase, corner lunge, and carving knife throws.

import { EVENTS, FARMER_AI_CONFIG, VIEW } from './constants.js';

export const FARMER_STATES = Object.freeze({
  PATROL: 'patrol',
  INVESTIGATE: 'investigate',
  CHASE: 'chase',
  THROW_KNIFE: 'throw_knife',
  CORNER_LUNGE: 'corner_lunge',
});

export function createFarmer(stageConfig, startX = 48) {
  return {
    x: startX,
    y: VIEW.groundY - FARMER_AI_CONFIG.height,
    vx: 0,
    w: FARMER_AI_CONFIG.width,
    h: FARMER_AI_CONFIG.height,
    facing: 1,
    role: stageConfig.farmerRole,
    state: FARMER_STATES.PATROL,
    stateTimer: 0,
    alertLevel: 0,
    targetX: startX + 260,
    lastSeenX: startX + 240,
    throwCooldown: 1.5 * stageConfig.knifeCooldownScale,
    lungeCooldown: 2.4,
    lungeDir: 1,
    stridePhase: 0,
    lanternSwing: 0,
    visionRange: FARMER_AI_CONFIG.visionRangeBase + (stageConfig.id - 1) * FARMER_AI_CONFIG.visionRangeStageBonus,
    visionAngle: 0,
    badgeText: '',
    badgeColor: '#F4B43A',
    wasChasing: false,
    brokeChaseInCover: false,
  };
}

export function computeFarmerVisionCone(farmer) {
  const originX = farmer.x + farmer.w * 0.5 + farmer.facing * 26;
  const originY = farmer.y + 52;
  const spread = farmer.state === FARMER_STATES.CHASE || farmer.state === FARMER_STATES.CORNER_LUNGE ? 0.34 : 0.27;
  const sweep = farmer.state === FARMER_STATES.INVESTIGATE ? Math.sin(farmer.lanternSwing * 4.5) * 0.18 : 0;
  const baseAngle = farmer.facing >= 0 ? 0.05 + sweep : Math.PI - 0.05 + sweep;
  return {
    originX,
    originY,
    range: farmer.visionRange,
    angle: baseAngle,
    halfSpread: spread,
  };
}

export function alertFarmerToDecoy(farmer, decoy) {
  if (!decoy) return false;
  const farmerCenter = farmer.x + farmer.w * 0.5;
  const dist = Math.abs(decoy.x - farmerCenter);
  if (dist > 560) return false;
  farmer.state = FARMER_STATES.INVESTIGATE;
  farmer.targetX = decoy.x;
  farmer.stateTimer = FARMER_AI_CONFIG.searchDuration + 0.85;
  farmer.facing = decoy.x >= farmerCenter ? 1 : -1;
  farmer.badgeText = '? HUH?';
  farmer.badgeColor = '#F4B43A';
  return true;
}

export function updateFarmerAI(farmer, turkey, decoys, stageConfig, dt, onSpawnKnife, onFooled, ovens = []) {
  let events = EVENTS.NONE;
  farmer.lanternSwing += dt;
  if (farmer.throwCooldown > 0) farmer.throwCooldown = Math.max(0, farmer.throwCooldown - dt);
  if (farmer.lungeCooldown > 0) farmer.lungeCooldown = Math.max(0, farmer.lungeCooldown - dt);

  const farmerCenterX = farmer.x + farmer.w * 0.5;
  const turkeyCenterX = turkey.x + turkey.w * 0.5;
  const dx = turkeyCenterX - farmerCenterX;
  const absDx = Math.abs(dx);
  const inFront = Math.sign(dx || 1) === farmer.facing;

  // Active landed acorn decoys can lure Farmer away even mid-chase.
  for (let i = 0; i < decoys.length; i += 1) {
    const d = decoys[i];
    if (d.landed && !d.fooledCredited && Math.abs(d.x - farmerCenterX) < 520) {
      d.fooledCredited = true;
      if (alertFarmerToDecoy(farmer, d)) {
        events |= EVENTS.FOOLED;
        onFooled?.(d);
      }
    }
  }

  // Visibility check: hidden turkey shrinks detection range drastically.
  const effectiveVision = turkey.hidden
    ? farmer.visionRange * FARMER_AI_CONFIG.visionHiddenFactor
    : farmer.visionRange * (inFront ? 1.15 : 0.72);
  const canSeeTurkey = absDx <= effectiveVision && (!turkey.hidden || absDx < 58);

  if (canSeeTurkey && farmer.state !== FARMER_STATES.THROW_KNIFE && farmer.state !== FARMER_STATES.CORNER_LUNGE) {
    if (farmer.state !== FARMER_STATES.CHASE) {
      events |= EVENTS.SPOTTED;
    }
    farmer.state = FARMER_STATES.CHASE;
    farmer.lastSeenX = turkeyCenterX;
    farmer.alertLevel = Math.min(1, farmer.alertLevel + dt * 3.2);
    farmer.wasChasing = true;
  } else if (farmer.state === FARMER_STATES.CHASE && !canSeeTurkey) {
    // Turkey slipped into stealth cover or far out of range!
    farmer.state = FARMER_STATES.INVESTIGATE;
    farmer.stateTimer = FARMER_AI_CONFIG.searchDuration;
    farmer.targetX = turkey.hidden ? farmer.lastSeenX + farmer.facing * 95 : farmer.lastSeenX;
    if (turkey.hidden && farmer.wasChasing) {
      farmer.brokeChaseInCover = true;
    }
  }

  const speedScale = stageConfig.farmerSpeedScale;
  const chaseSpeed = FARMER_AI_CONFIG.chaseSpeedBase * speedScale;
  const patrolSpeed = FARMER_AI_CONFIG.patrolSpeedBase * speedScale;

  // Gentle rubber-banding if turkey sprints way far ahead (keeps dramatic tension without cheap teleporting).
  let rubberMult = 1;
  if (!turkey.hidden && dx > FARMER_AI_CONFIG.rubberBandFarDist && farmer.badgeText !== '? HUH?') {
    rubberMult = FARMER_AI_CONFIG.rubberBandBoost;
    farmer.state = FARMER_STATES.CHASE;
    farmer.lastSeenX = turkeyCenterX;
  }

  if (farmer.state === FARMER_STATES.PATROL) {
    farmer.badgeText = '';
    farmer.alertLevel = Math.max(0, farmer.alertLevel - dt * 0.9);
    const toTarget = farmer.targetX - farmerCenterX;
    if (Math.abs(toTarget) < 28) {
      // Advance steadily along the escape corridor while scanning.
      farmer.targetX = Math.min(stageConfig.length - 260, Math.max(120, turkeyCenterX - 90));
    }
    farmer.facing = toTarget >= 0 ? 1 : -1;
    farmer.vx = farmer.facing * patrolSpeed;
  } else if (farmer.state === FARMER_STATES.INVESTIGATE) {
    farmer.badgeText = '? SEARCHING';
    farmer.badgeColor = '#F4B43A';
    farmer.stateTimer -= dt;
    const toTarget = farmer.targetX - farmerCenterX;
    if (Math.abs(toTarget) > 22) {
      farmer.facing = Math.sign(toTarget);
      farmer.vx = farmer.facing * patrolSpeed * 0.92;
    } else {
      farmer.vx *= 0.78;
      // Look left and right suspiciously.
      if (Math.floor(farmer.lanternSwing * 2.2) % 2 === 0) farmer.facing = 1;
      else farmer.facing = -1;
    }
    if (farmer.stateTimer <= 0) {
      farmer.state = FARMER_STATES.PATROL;
      farmer.targetX = Math.max(110, farmerCenterX - 180);
      farmer.badgeText = '';
    }
  } else if (farmer.state === FARMER_STATES.CHASE) {
    farmer.badgeText = '! SPOTTED!';
    farmer.badgeColor = '#E03131';
    farmer.facing = dx >= 0 ? 1 : -1;
    farmer.vx = farmer.facing * chaseSpeed * rubberMult;

    // Corner lunge when closing in at mid-short range!
    if (absDx < 205 && absDx > 86 && farmer.lungeCooldown <= 0 && !turkey.hidden) {
      farmer.state = FARMER_STATES.CORNER_LUNGE;
      farmer.stateTimer = FARMER_AI_CONFIG.lungeDuration;
      farmer.lungeCooldown = FARMER_AI_CONFIG.lungeCooldown;
      farmer.lungeDir = farmer.facing;
      farmer.badgeText = '! LUNGE!';
    } else if (
      absDx > 165 &&
      absDx < 530 &&
      farmer.throwCooldown <= 0 &&
      !turkey.hidden &&
      !ovens.some((o) => farmer.x + farmer.w > o.x - 18 && farmer.x < o.x + o.w + 18)
    ) {
      // Wind up a spinning carving knife throw!
      farmer.state = FARMER_STATES.THROW_KNIFE;
      farmer.stateTimer = FARMER_AI_CONFIG.throwWindup;
      farmer.vx *= 0.35;
      farmer.badgeText = '! CARVE!';
    }
  } else if (farmer.state === FARMER_STATES.THROW_KNIFE) {
    farmer.badgeText = '! CARVE!';
    farmer.badgeColor = '#E03131';
    farmer.vx *= 0.85;
    farmer.facing = dx >= 0 ? 1 : -1;
    farmer.stateTimer -= dt;
    if (farmer.stateTimer <= 0) {
      onSpawnKnife?.(farmer, turkey);
      events |= EVENTS.KNIFE_THROW;
      farmer.throwCooldown = FARMER_AI_CONFIG.throwCooldownBase * stageConfig.knifeCooldownScale;
      farmer.state = FARMER_STATES.CHASE;
    }
  } else if (farmer.state === FARMER_STATES.CORNER_LUNGE) {
    farmer.badgeText = '! LUNGE!';
    farmer.badgeColor = '#FF5A1F';
    farmer.vx = farmer.lungeDir * FARMER_AI_CONFIG.lungeSpeed * speedScale;
    farmer.stateTimer -= dt;
    if (farmer.stateTimer <= 0) {
      farmer.state = FARMER_STATES.CHASE;
    }
  }

  // Advance along corridor; if winding up a throw or searching near an oven, step clear onto open floor.
  let nextX = farmer.x + farmer.vx * dt;
  for (let i = 0; i < ovens.length; i += 1) {
    const o = ovens[i];
    const overlapping = nextX + farmer.w > o.x - 12 && nextX < o.x + o.w + 12;
    if (!overlapping) continue;
    if (farmer.state === FARMER_STATES.THROW_KNIFE || Math.abs(farmer.vx) < 85) {
      const clearLeft = o.x - farmer.w - 16;
      const clearRight = o.x + o.w + 16;
      const goalX = Math.abs(nextX - clearLeft) <= Math.abs(nextX - clearRight) ? clearLeft : clearRight;
      const step = Math.sign(goalX - nextX) * Math.min(Math.abs(goalX - nextX), chaseSpeed * dt);
      nextX += step;
    }
  }
  farmer.x = nextX;
  if (farmer.x < 18) farmer.x = 18;
  if (farmer.x > stageConfig.length - 180) farmer.x = stageConfig.length - 180;

  if (Math.abs(farmer.vx) > 15) {
    farmer.stridePhase += dt * (Math.abs(farmer.vx) / 34);
  }

  return events;
}
