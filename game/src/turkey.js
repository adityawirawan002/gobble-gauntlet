// Player turkey entity: responsive platforming, flutter glide, feather dash, stealth hide, and decoy toss.

import { EVENTS, TURKEY_TUNING, VIEW } from './constants.js';

export function createTurkey(startX = 240) {
  return {
    x: startX,
    y: VIEW.groundY - TURKEY_TUNING.height,
    vx: 0,
    vy: 0,
    w: TURKEY_TUNING.width,
    h: TURKEY_TUNING.height,
    facing: 1,
    grounded: true,
    inGravy: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    fluttering: false,
    flutterTick: 0,
    dashTimer: 0,
    dashIframes: 0,
    dashDir: 1,
    stamina: 1,
    hitInvuln: 0,
    hidden: false,
    coverId: null,
    nearbyCover: null,
    decoyCooldown: 0,
    runCycle: 0,
    squashX: 1,
    squashY: 1,
    gobbleTimer: 0,
    eyeTargetX: startX + 120,
    eyeTargetY: VIEW.groundY - 40,
    afterimages: [],
  };
}

export function triggerFeatherDash(turkey, moveX) {
  if (turkey.dashTimer > 0 || turkey.stamina < TURKEY_TUNING.dashStaminaCost) {
    return false;
  }
  const dir = moveX !== 0 ? Math.sign(moveX) : turkey.facing;
  turkey.hidden = false;
  turkey.coverId = null;
  turkey.facing = dir;
  turkey.dashDir = dir;
  turkey.dashTimer = TURKEY_TUNING.dashDuration;
  turkey.dashIframes = TURKEY_TUNING.dashIframes;
  turkey.stamina = Math.max(0, turkey.stamina - TURKEY_TUNING.dashStaminaCost);
  turkey.vx = dir * TURKEY_TUNING.dashSpeed;
  turkey.vy = Math.min(turkey.vy, -75);
  turkey.squashX = 1.28;
  turkey.squashY = 0.78;
  turkey.gobbleTimer = 0.34;
  return true;
}

export function toggleStealthHide(turkey, cover) {
  if (!cover) {
    turkey.hidden = false;
    turkey.coverId = null;
    return false;
  }
  if (turkey.hidden && turkey.coverId === cover.id) {
    turkey.hidden = false;
    turkey.coverId = null;
    return false;
  }
  turkey.hidden = true;
  turkey.coverId = cover.id;
  turkey.vx *= 0.15;
  turkey.x = cover.x + (cover.w - turkey.w) * 0.5;
  turkey.y = VIEW.groundY - turkey.h;
  turkey.vy = 0;
  turkey.grounded = true;
  turkey.squashX = 1.15;
  turkey.squashY = 0.76;
  return true;
}

export function tossAcornDecoy(turkey, cameraX, pointerX, pointerInside) {
  if (turkey.decoyCooldown > 0) return null;
  turkey.decoyCooldown = TURKEY_TUNING.decoyCooldown;
  turkey.gobbleTimer = 0.2;
  let dir = turkey.facing;
  if (pointerInside) {
    const worldPointerX = cameraX + pointerX;
    if (Math.abs(worldPointerX - (turkey.x + turkey.w * 0.5)) > 36) {
      dir = worldPointerX >= turkey.x + turkey.w * 0.5 ? 1 : -1;
    }
  }
  turkey.facing = dir;
  return {
    x: turkey.x + turkey.w * 0.5 + dir * 24,
    y: turkey.y + 18,
    vx: dir * TURKEY_TUNING.decoyThrowSpeedX + turkey.vx * 0.25,
    vy: TURKEY_TUNING.decoyThrowSpeedY,
    radius: 10,
    bounces: 0,
    life: 5.2,
    landed: false,
    pulseTimer: 0,
    fooledCredited: false,
  };
}

export function updateTurkeyPhysics(turkey, input, covers, gravyPuddles, stageLength, dt) {
  let events = EVENTS.NONE;

  if (turkey.hitInvuln > 0) turkey.hitInvuln = Math.max(0, turkey.hitInvuln - dt);
  if (turkey.dashIframes > 0) turkey.dashIframes = Math.max(0, turkey.dashIframes - dt);
  if (turkey.decoyCooldown > 0) turkey.decoyCooldown = Math.max(0, turkey.decoyCooldown - dt);
  if (turkey.gobbleTimer > 0) turkey.gobbleTimer = Math.max(0, turkey.gobbleTimer - dt);

  turkey.squashX += (1 - turkey.squashX) * Math.min(1, dt * 14);
  turkey.squashY += (1 - turkey.squashY) * Math.min(1, dt * 14);

  // Decay dash afterimages.
  for (let i = turkey.afterimages.length - 1; i >= 0; i -= 1) {
    turkey.afterimages[i].alpha -= dt * 4.4;
    if (turkey.afterimages[i].alpha <= 0) turkey.afterimages.splice(i, 1);
  }

  // Locate overlapping stealth cover.
  const centerX = turkey.x + turkey.w * 0.5;
  let overlappingCover = null;
  for (let i = 0; i < covers.length; i += 1) {
    const c = covers[i];
    if (centerX >= c.x - 18 && centerX <= c.x + c.w + 18 && turkey.y + turkey.h >= VIEW.groundY - 46) {
      overlappingCover = c;
      break;
    }
  }
  turkey.nearbyCover = overlappingCover;

  // Toggle or release stealth hide.
  if (input.hidePressed && overlappingCover) {
    if (toggleStealthHide(turkey, overlappingCover)) {
      events |= EVENTS.HIDE;
    }
  } else if (turkey.hidden) {
    if (!overlappingCover || input.jumpPressed || Math.abs(input.moveX) > 0) {
      turkey.hidden = false;
      turkey.coverId = null;
    }
  }

  // Check spilled gravy puddle slowdown.
  turkey.inGravy = false;
  if (turkey.grounded && !turkey.hidden) {
    for (let i = 0; i < gravyPuddles.length; i += 1) {
      const g = gravyPuddles[i];
      if (centerX >= g.x + 8 && centerX <= g.x + g.w - 8) {
        turkey.inGravy = true;
        break;
      }
    }
  }

  // Dash trigger & stamina regen.
  if (input.dashPressed && triggerFeatherDash(turkey, input.moveX)) {
    events |= EVENTS.DASH;
  } else if (turkey.dashTimer <= 0) {
    const regenRate = turkey.hidden ? TURKEY_TUNING.staminaRegen * 1.35 : TURKEY_TUNING.staminaRegen;
    turkey.stamina = Math.min(1, turkey.stamina + regenRate * dt);
  }

  // Jump buffer & coyote time.
  if (input.jumpPressed) {
    turkey.jumpBufferTimer = TURKEY_TUNING.jumpBuffer;
  } else if (turkey.jumpBufferTimer > 0) {
    turkey.jumpBufferTimer = Math.max(0, turkey.jumpBufferTimer - dt);
  }
  if (turkey.grounded) {
    turkey.coyoteTimer = TURKEY_TUNING.coyoteTime;
  } else if (turkey.coyoteTimer > 0) {
    turkey.coyoteTimer = Math.max(0, turkey.coyoteTimer - dt);
  }

  // Stay tucked inside cover if hidden.
  if (turkey.hidden && overlappingCover) {
    turkey.vx = 0;
    turkey.vy = 0;
    turkey.fluttering = false;
    turkey.x = overlappingCover.x + (overlappingCover.w - turkey.w) * 0.5;
    turkey.y = VIEW.groundY - turkey.h;
    return events;
  }

  // Horizontal movement vs dash velocity.
  if (turkey.dashTimer > 0) {
    turkey.dashTimer = Math.max(0, turkey.dashTimer - dt);
    turkey.vx = turkey.dashDir * TURKEY_TUNING.dashSpeed;
    turkey.vy *= 0.85;
    if (turkey.afterimages.length < 7) {
      turkey.afterimages.push({
        x: turkey.x,
        y: turkey.y,
        facing: turkey.facing,
        alpha: 0.56,
      });
    }
  } else {
    const speedCap = TURKEY_TUNING.maxSpeed * (turkey.inGravy ? TURKEY_TUNING.gravySpeedFactor : 1);
    const accel = turkey.grounded ? TURKEY_TUNING.accelGround : TURKEY_TUNING.accelAir;
    if (input.moveX !== 0) {
      turkey.facing = Math.sign(input.moveX);
      turkey.vx += input.moveX * accel * dt;
      if (Math.abs(turkey.vx) > speedCap) {
        turkey.vx += (Math.sign(turkey.vx) * speedCap - turkey.vx) * Math.min(1, dt * 14);
      }
    } else if (turkey.grounded) {
      const decel = TURKEY_TUNING.frictionGround * dt;
      if (Math.abs(turkey.vx) <= decel) turkey.vx = 0;
      else turkey.vx -= Math.sign(turkey.vx) * decel;
    } else {
      turkey.vx *= Math.max(0, 1 - dt * 1.4);
    }
  }

  // Execute buffered jump with coyote forgiveness.
  if (turkey.jumpBufferTimer > 0 && turkey.coyoteTimer > 0) {
    turkey.vy = TURKEY_TUNING.jumpVelocity;
    turkey.grounded = false;
    turkey.coyoteTimer = 0;
    turkey.jumpBufferTimer = 0;
    turkey.squashX = 0.82;
    turkey.squashY = 1.22;
    events |= EVENTS.JUMP;
  }

  // Variable jump height & mid-air flutter glide.
  turkey.fluttering = false;
  if (!turkey.grounded && turkey.dashTimer <= 0) {
    if (turkey.vy > 0 && input.jumpHeld) {
      turkey.fluttering = true;
      turkey.vy = Math.min(TURKEY_TUNING.flutterMaxFall, turkey.vy + TURKEY_TUNING.flutterGravity * dt);
      turkey.flutterTick += dt;
      if (turkey.flutterTick >= 0.16) {
        turkey.flutterTick = 0;
        events |= EVENTS.FLUTTER;
      }
    } else {
      const grav = turkey.vy < 0 && !input.jumpHeld ? TURKEY_TUNING.gravity * 1.6 : TURKEY_TUNING.gravity;
      turkey.vy = Math.min(TURKEY_TUNING.maxFallSpeed, turkey.vy + grav * dt);
    }
  }

  // Integrate position.
  const wasGrounded = turkey.grounded;
  turkey.x += turkey.vx * dt;
  turkey.y += turkey.vy * dt;

  // World bounds.
  if (turkey.x < 36) {
    turkey.x = 36;
    if (turkey.vx < 0) turkey.vx = 0;
  }
  const maxX = stageLength - turkey.w - 28;
  if (turkey.x > maxX) {
    turkey.x = maxX;
    if (turkey.vx > 0) turkey.vx = 0;
  }

  // Ground collision.
  const floorY = VIEW.groundY - turkey.h;
  if (turkey.y >= floorY) {
    turkey.y = floorY;
    if (!wasGrounded && turkey.vy > 190) {
      turkey.squashX = 1.22;
      turkey.squashY = 0.8;
    }
    turkey.vy = 0;
    turkey.grounded = true;
  } else {
    turkey.grounded = false;
  }

  // Stride cycle animation.
  if (turkey.grounded && Math.abs(turkey.vx) > 20) {
    turkey.runCycle += dt * (Math.abs(turkey.vx) / 36);
  } else if (!turkey.grounded) {
    turkey.runCycle += dt * (turkey.fluttering ? 26 : 10);
  }

  return events;
}
