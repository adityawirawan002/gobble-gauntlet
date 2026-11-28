// Entity physics & hazard updates: multi-tier Barnaby platforming, updrafts, knives, nets, pumpkins & Buster the Dog.

import { EVENTS, HAZARD_CONFIG, TURKEY_TUNING, VIEW } from './constants.js';

export function createTurkey(startX = 240) {
  return {
    x: startX, y: VIEW.groundY - TURKEY_TUNING.height, vx: 0, vy: 0,
    w: TURKEY_TUNING.width, h: TURKEY_TUNING.height, facing: 1, grounded: true, tier: 0,
    onPlatform: null, dropThroughTimer: 0, inGravy: false, inUpdraft: false, updraftSoundCd: 0,
    coyoteTimer: 0, jumpBufferTimer: 0, fluttering: false, flutterTick: 0,
    dashTimer: 0, dashIframes: 0, dashDir: 1, stamina: 1, hitInvuln: 0,
    hidden: false, coverId: null, nearbyCover: null, decoyCooldown: 0,
    runCycle: 0, squashX: 1, squashY: 1, gobbleTimer: 0,
    eyeTargetX: startX + 140, eyeTargetY: VIEW.groundY - 40, afterimages: [],
  };
}

export function triggerFeatherDash(t, moveX) {
  if (t.dashTimer > 0 || t.stamina < TURKEY_TUNING.dashStaminaCost) return false;
  const dir = moveX !== 0 ? Math.sign(moveX) : t.facing;
  t.hidden = false; t.coverId = null; t.facing = dir; t.dashDir = dir;
  t.dashTimer = TURKEY_TUNING.dashDuration; t.dashIframes = TURKEY_TUNING.dashIframes;
  t.stamina = Math.max(0, t.stamina - TURKEY_TUNING.dashStaminaCost);
  t.vx = dir * TURKEY_TUNING.dashSpeed; t.vy = Math.min(t.vy, -85);
  t.squashX = 1.3; t.squashY = 0.76; t.gobbleTimer = 0.34;
  return true;
}

export function toggleStealthHide(t, cover) {
  if (!cover || (t.hidden && t.coverId === cover.id)) { t.hidden = false; t.coverId = null; return false; }
  t.hidden = true; t.coverId = cover.id; t.vx = 0; t.vy = 0;
  t.x = cover.x + (cover.w - t.w) * 0.5; t.y = VIEW.groundY - t.h;
  t.grounded = true; t.tier = 0; t.squashX = 1.16; t.squashY = 0.75;
  return true;
}

export function tossAcornDecoy(t, cameraX, pointerX, pointerInside) {
  if (t.decoyCooldown > 0) return null;
  t.decoyCooldown = TURKEY_TUNING.decoyCooldown; t.gobbleTimer = 0.22;
  let dir = t.facing;
  if (pointerInside) {
    const wp = cameraX + pointerX;
    if (Math.abs(wp - (t.x + t.w * 0.5)) > 40) dir = wp >= t.x + t.w * 0.5 ? 1 : -1;
  }
  t.facing = dir;
  return {
    x: t.x + t.w * 0.5 + dir * 24, y: t.y + 18,
    vx: dir * TURKEY_TUNING.decoyThrowSpeedX + t.vx * 0.22, vy: TURKEY_TUNING.decoyThrowSpeedY,
    radius: 11, bounces: 0, life: 5.5, landed: false, justBounced: false, pulseTimer: 0, fooledCredited: false,
  };
}

export function updateTurkeyPhysics(t, inp, layout, stageLen, dt) {
  let ev = EVENTS.NONE;
  const { covers, platforms, gravyPuddles, updrafts } = layout;
  t.hitInvuln = Math.max(0, t.hitInvuln - dt);
  t.dashIframes = Math.max(0, t.dashIframes - dt);
  t.decoyCooldown = Math.max(0, t.decoyCooldown - dt);
  t.gobbleTimer = Math.max(0, t.gobbleTimer - dt);
  t.dropThroughTimer = Math.max(0, t.dropThroughTimer - dt);
  t.updraftSoundCd = Math.max(0, t.updraftSoundCd - dt);
  t.squashX += (1 - t.squashX) * Math.min(1, dt * 14);
  t.squashY += (1 - t.squashY) * Math.min(1, dt * 14);
  for (let i = t.afterimages.length - 1; i >= 0; i -= 1) {
    if ((t.afterimages[i].alpha -= dt * 4.2) <= 0) t.afterimages.splice(i, 1);
  }
  const cx = t.x + t.w * 0.5;
  const cover = covers.find((c) => cx >= c.x - 18 && cx <= c.x + c.w + 18 && t.y + t.h >= VIEW.groundY - 48) || null;
  t.nearbyCover = cover;
  if (inp.hidePressed) {
    if (cover) { if (toggleStealthHide(t, cover)) ev |= EVENTS.HIDE; }
    else if (t.grounded && t.onPlatform) { t.dropThroughTimer = 0.24; t.grounded = false; t.onPlatform = null; t.y += 6; t.vy = Math.max(t.vy, 110); }
  } else if (t.hidden && (!cover || inp.jumpPressed || Math.abs(inp.moveX) > 0)) { t.hidden = false; t.coverId = null; }
  t.inGravy = t.grounded && t.tier === 0 && !t.hidden && gravyPuddles.some((g) => cx >= g.x + 8 && cx <= g.x + g.w - 8);
  if (inp.dashPressed && triggerFeatherDash(t, inp.moveX)) ev |= EVENTS.DASH;
  else if (t.dashTimer <= 0) t.stamina = Math.min(1, t.stamina + (t.hidden ? TURKEY_TUNING.staminaRegen * 1.35 : TURKEY_TUNING.staminaRegen) * dt);
  t.jumpBufferTimer = inp.jumpPressed ? TURKEY_TUNING.jumpBuffer : Math.max(0, t.jumpBufferTimer - dt);
  t.coyoteTimer = t.grounded ? TURKEY_TUNING.coyoteTime : Math.max(0, t.coyoteTimer - dt);
  if (t.hidden && cover) {
    t.vx = t.vy = 0; t.fluttering = false; t.x = cover.x + (cover.w - t.w) * 0.5; t.y = VIEW.groundY - t.h;
    return ev;
  }
  if (t.dashTimer > 0) {
    t.dashTimer = Math.max(0, t.dashTimer - dt);
    t.vx = t.dashDir * TURKEY_TUNING.dashSpeed; t.vy *= 0.84;
    if (t.afterimages.length < 7) t.afterimages.push({ x: t.x, y: t.y, facing: t.facing, alpha: 0.56 });
  } else {
    const cap = TURKEY_TUNING.maxSpeed * (t.inGravy ? TURKEY_TUNING.gravySpeedFactor : 1);
    const acc = t.grounded ? TURKEY_TUNING.accelGround : TURKEY_TUNING.accelAir;
    if (inp.moveX !== 0) {
      t.facing = Math.sign(inp.moveX); t.vx += inp.moveX * acc * dt;
      if (Math.abs(t.vx) > cap) t.vx += (Math.sign(t.vx) * cap - t.vx) * Math.min(1, dt * 14);
    } else if (t.grounded) {
      const dec = TURKEY_TUNING.frictionGround * dt;
      t.vx = Math.abs(t.vx) <= dec ? 0 : t.vx - Math.sign(t.vx) * dec;
    } else t.vx *= Math.max(0, 1 - dt * 1.35);
  }
  if (t.jumpBufferTimer > 0 && t.coyoteTimer > 0) {
    t.vy = TURKEY_TUNING.jumpVelocity; t.grounded = false; t.onPlatform = null;
    t.coyoteTimer = t.jumpBufferTimer = 0; t.squashX = 0.82; t.squashY = 1.24; ev |= EVENTS.JUMP;
  }
  t.inUpdraft = false;
  if (!t.hidden && t.dashTimer <= 0) {
    for (const u of updrafts) {
      if (cx >= u.x - 10 && cx <= u.x + u.w + 10 && t.y + t.h >= u.y && t.y <= u.y + u.h) {
        t.inUpdraft = true; t.grounded = false; t.onPlatform = null;
        t.vy = Math.max(TURKEY_TUNING.updraftMaxRise, t.vy - TURKEY_TUNING.updraftAccel * dt * (inp.jumpHeld ? 1.18 : 0.85));
        if (t.updraftSoundCd <= 0) { t.updraftSoundCd = 0.42; ev |= EVENTS.UPDRAFT; }
        break;
      }
    }
  }
  t.fluttering = false;
  if (!t.grounded && t.dashTimer <= 0 && !t.inUpdraft) {
    if (t.vy > 0 && inp.jumpHeld) {
      t.fluttering = true;
      t.vy = Math.min(TURKEY_TUNING.flutterMaxFall, t.vy + TURKEY_TUNING.flutterGravity * dt);
      if ((t.flutterTick += dt) >= 0.16) { t.flutterTick = 0; ev |= EVENTS.FLUTTER; }
    } else {
      t.vy = Math.min(TURKEY_TUNING.maxFallSpeed, t.vy + (t.vy < 0 && !inp.jumpHeld ? TURKEY_TUNING.gravity * 1.52 : TURKEY_TUNING.gravity) * dt);
    }
  }
  const prevBottom = t.y + t.h, wasGrounded = t.grounded;
  t.x = Math.max(36, Math.min(stageLen - t.w - 28, t.x + t.vx * dt));
  t.y += t.vy * dt;
  let landedPlat = null;
  if (t.vy >= 0 && t.dropThroughTimer <= 0) {
    const newBottom = t.y + t.h, fL = t.x + 12, fR = t.x + t.w - 12;
    for (const p of platforms) {
      if (fR >= p.x && fL <= p.x + p.w && prevBottom <= p.y + 14 && newBottom >= p.y) { landedPlat = p; break; }
    }
  }
  if (landedPlat) {
    t.y = landedPlat.y - t.h;
    if (!wasGrounded && t.vy > 180) { t.squashX = 1.2; t.squashY = 0.82; }
    t.vy = 0; t.grounded = true; t.onPlatform = landedPlat; t.tier = landedPlat.tier;
  } else if (t.y >= VIEW.groundY - t.h) {
    t.y = VIEW.groundY - t.h;
    if (!wasGrounded && t.vy > 190) { t.squashX = 1.22; t.squashY = 0.8; }
    t.vy = 0; t.grounded = true; t.onPlatform = null; t.tier = 0;
  } else {
    t.grounded = false; t.onPlatform = null;
    t.tier = t.y + t.h <= VIEW.highTierY + 42 ? 2 : t.y + t.h <= VIEW.midTierY + 42 ? 1 : 0;
  }
  if (t.grounded && Math.abs(t.vx) > 20) t.runCycle += dt * (Math.abs(t.vx) / 36);
  else if (!t.grounded) t.runCycle += dt * (t.fluttering || t.inUpdraft ? 26 : 10);
  return ev;
}

export function spawnThrownKnife(knives, farmer, turkey, cfg) {
  const sx = farmer.x + farmer.w * 0.5 + farmer.facing * 26, sy = farmer.y + 34;
  const dx = (turkey.x + turkey.w * 0.5 + turkey.vx * 0.24) - sx, dir = dx >= 0 ? 1 : -1;
  const vx = (475 + (cfg.id - 1) * 44) * dir;
  const ft = Math.max(0.42, Math.min(1.02, Math.abs(dx) / Math.abs(vx))), g = 430;
  const vy = Math.max(-460, Math.min(-60, ((turkey.y + turkey.h * 0.4) - sy - 0.5 * g * ft * ft) / ft));
  const arcPoints = [];
  for (let s = 0.06; s <= 0.78; s += 0.08) arcPoints.push({ x: sx + vx * s, y: sy + vy * s + 0.5 * g * s * s });
  knives.push({ kind: 'thrown', x: sx, y: sy, vx, vy, gravity: g, w: HAZARD_CONFIG.knifeWidth, h: HAZARD_CONFIG.knifeHeight, angle: Math.atan2(vy, vx), spin: dir * 13.5, age: 0, active: true, closeShaveAwarded: false, trail: [], arcPoints });
}

export function spawnCatcherNet(nets, farmer, turkey, cfg) {
  const sx = farmer.x + farmer.w * 0.5 + farmer.facing * 24, sy = farmer.y + 28;
  const dx = (turkey.x + turkey.w * 0.5 + turkey.vx * 0.28) - sx, dir = dx >= 0 ? 1 : -1;
  const vx = (420 + (cfg.id - 1) * 38) * dir;
  const ft = Math.max(0.45, Math.min(1.05, Math.abs(dx) / Math.abs(vx))), g = 470;
  const vy = Math.max(-540, Math.min(-140, ((turkey.y + turkey.h * 0.35) - sy - 0.5 * g * ft * ft) / ft));
  nets.push({ x: sx, y: sy, vx, vy, gravity: g, radius: HAZARD_CONFIG.netRadius, angle: 0, spin: dir * 5.2, active: true, closeShaveAwarded: false, trail: [] });
}

export function updateRoastingOvens(ovens, dt, onBurst) {
  let ev = EVENTS.NONE;
  for (const ov of ovens) {
    const prev = ov.state;
    ov.phase = (ov.phase + dt) % ov.cycle;
    const erupt = ov.cycle - ov.activeDur;
    if (ov.phase >= erupt) {
      ov.state = 'erupting';
      if (prev !== 'erupting') { ov.closeShaveAwarded = false; ev |= EVENTS.OVEN_BURST; onBurst?.(ov); }
    } else if (ov.phase >= erupt - ov.telegraphDur) ov.state = 'telegraph';
    else { ov.state = 'idle'; ov.closeShaveAwarded = false; }
  }
  return ev;
}

export const getOvenFlameBox = (ov) => ({ x: ov.x - 22, y: ov.y - 46, w: ov.w + 44, h: HAZARD_CONFIG.ovenFlameHeight + 30 });

export function updateProjectilesAndHazards(layout, dt, stageLen) {
  for (let i = layout.knives.length - 1; i >= 0; i -= 1) {
    const k = layout.knives[i];
    if (!k.active) { layout.knives.splice(i, 1); continue; }
    if (k.kind === 'sweeper') {
      k.phase += dt * 2.1; k.x = k.baseX + Math.sin(k.phase) * 190; k.y = k.baseY + Math.cos(k.phase * 2) * 18;
      k.vx = Math.cos(k.phase) * 399; k.angle = k.vx >= 0 ? 0 : Math.PI;
      k.trail.push({ x: k.x, y: k.y, angle: k.angle, alpha: 0.45 });
      if (k.trail.length > 6) k.trail.shift();
      continue;
    }
    k.age += dt; k.vy += k.gravity * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.angle += k.spin * dt;
    k.trail.push({ x: k.x, y: k.y, angle: k.angle, alpha: 0.65 });
    if (k.trail.length > 8) k.trail.shift();
    for (const tr of k.trail) tr.alpha *= 0.86;
    if (k.y > VIEW.groundY + 32 || k.x < -120 || k.x > stageLen + 140) layout.knives.splice(i, 1);
  }
  for (let i = layout.nets.length - 1; i >= 0; i -= 1) {
    const n = layout.nets[i];
    if (!n.active) { layout.nets.splice(i, 1); continue; }
    n.vy += n.gravity * dt; n.x += n.vx * dt; n.y += n.vy * dt; n.angle += n.spin * dt;
    if (n.y > VIEW.groundY + 36 || n.x < -120 || n.x > stageLen + 140) layout.nets.splice(i, 1);
  }
  for (const rp of layout.pumpkins) {
    rp.x += rp.vx * dt;
    if (rp.x <= rp.minX) { rp.x = rp.minX; rp.vx = Math.abs(rp.vx); rp.closeShaveAwarded = false; }
    else if (rp.x >= rp.maxX) { rp.x = rp.maxX; rp.vx = -Math.abs(rp.vx); rp.closeShaveAwarded = false; }
    rp.angle += (rp.vx * dt) / rp.radius;
  }
  for (const p of layout.pickups) p.bobPhase += dt * 4.2;
  for (const b of layout.bouncePads) b.squash = Math.max(0, b.squash - dt * 5.2);
  for (const g of layout.gravyPuddles) g.bubblePhase += dt * 3.4;
  for (const u of layout.updrafts) u.phase += dt * 3.8;
  for (const c of layout.covers) if (c.shakeTimer > 0) c.shakeTimer = Math.max(0, c.shakeTimer - dt);
  for (let i = layout.decoys.length - 1; i >= 0; i -= 1) {
    const d = layout.decoys[i];
    if ((d.life -= dt) <= 0) { layout.decoys.splice(i, 1); continue; }
    if (!d.landed) {
      const prevY = d.y; d.vy += 1260 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      let hitY = null;
      if (d.vy > 0) {
        const pl = layout.platforms.find((p) => d.x >= p.x && d.x <= p.x + p.w && prevY + d.radius <= p.y + 12 && d.y + d.radius >= p.y);
        if (pl) hitY = pl.y - d.radius;
      }
      if (hitY === null && d.y >= VIEW.groundY - d.radius) hitY = VIEW.groundY - d.radius;
      if (hitY !== null) {
        d.y = hitY; d.bounces += 1; d.justBounced = true;
        if (d.bounces >= 2 || Math.abs(d.vy) < 120) { d.vy = 0; d.vx *= 0.25; d.landed = true; d.pulseTimer = 0; }
        else { d.vy = -d.vy * 0.45; d.vx *= 0.62; }
      }
    } else { d.vx *= Math.max(0, 1 - dt * 8); d.x += d.vx * dt; d.pulseTimer += dt; }
  }
}

export function updateFarmDogs(dogs, turkey, decoys, dt, onBark) {
  let ev = EVENTS.NONE;
  const tcX = turkey.x + turkey.w * 0.5, tcY = turkey.y + turkey.h;
  for (const dog of dogs) {
    dog.barkCooldown = Math.max(0, dog.barkCooldown - dt);
    dog.barkTimer = Math.max(0, dog.barkTimer - dt);
    const lure = decoys.find((d) => d.landed && Math.abs(d.x - (dog.x + dog.w * 0.5)) < 260);
    if (lure) {
      const to = lure.x - (dog.x + dog.w * 0.5);
      dog.facing = to >= 0 ? 1 : -1;
      if (Math.abs(to) > 36) dog.x += Math.sign(to) * 145 * dt;
      dog.stride += dt * 7; continue;
    }
    dog.x += dog.vx * dt;
    if (dog.x <= dog.minX) { dog.x = dog.minX; dog.vx = Math.abs(dog.vx); }
    if (dog.x >= dog.maxX) { dog.x = dog.maxX; dog.vx = -Math.abs(dog.vx); }
    dog.facing = dog.vx >= 0 ? 1 : -1; dog.stride += dt * 6.5;
    if (!turkey.hidden && Math.abs(tcX - (dog.x + dog.w * 0.5)) < 250 && tcY > VIEW.midTierY + 20 && dog.barkCooldown <= 0) {
      dog.barkCooldown = 2.6; dog.barkTimer = 0.7; dog.facing = tcX >= dog.x + dog.w * 0.5 ? 1 : -1;
      ev |= EVENTS.DOG_BARK; onBark?.(dog, tcX);
    }
  }
  return ev;
}
