// Core tuning, 1280x800 multi-tier metrics, palettes, badges, and UI hitboxes.

export const VIEW = Object.freeze({
  width: 1280, height: 800, groundY: 694, midTierY: 516, highTierY: 344,
  fixedDt: 1 / 60, maxFrameDt: 0.05,
});

export const SCREENS = Object.freeze({
  TITLE: 'title', PLAY: 'play', STAGE_CLEAR: 'stage_clear', PAUSE: 'pause', END: 'end',
});

export const MODES = Object.freeze({ ESCAPE: 'escape', ENDLESS: 'endless' });

export const EVENTS = Object.freeze({
  NONE: 0, JUMP: 1 << 0, FLUTTER: 1 << 1, DASH: 1 << 2, HIDE: 1 << 3, DECOY: 1 << 4,
  CORN: 1 << 5, BERRY: 1 << 6, CLOSE_SHAVE: 1 << 7, SPOTTED: 1 << 8, KNIFE_THROW: 1 << 9,
  OVEN_BURST: 1 << 10, BOUNCE: 1 << 11, HIT: 1 << 12, STAGE_CLEAR: 1 << 13,
  VICTORY: 1 << 14, CAUGHT: 1 << 15, FOOLED: 1 << 16, UPDRAFT: 1 << 17,
  DOG_BARK: 1 << 18, NET_THROW: 1 << 19, FLUSH: 1 << 20,
});

export const TURKEY_TUNING = Object.freeze({
  width: 60, height: 66, maxSpeed: 398, accelGround: 2680, accelAir: 1940,
  frictionGround: 2550, gravySpeedFactor: 0.54, jumpVelocity: -840, gravity: 1620,
  flutterGravity: 340, maxFallSpeed: 840, flutterMaxFall: 148,
  updraftAccel: 2600, updraftMaxRise: -560, coyoteTime: 0.13, jumpBuffer: 0.14,
  dashSpeed: 825, dashDuration: 0.23, dashIframes: 0.32, dashStaminaCost: 0.56,
  staminaRegen: 0.39, closeShaveStaminaRefund: 0.42, hitInvuln: 1.65, maxLives: 3,
  decoyCooldown: 2.3, decoyThrowSpeedX: 575, decoyThrowSpeedY: -390, bounceVelocity: -990,
});

export const FARMER_AI_CONFIG = Object.freeze({
  width: 78, height: 126, visionRangeBase: 420, visionRangeStageBonus: 38,
  visionHiddenFactor: 0.24, patrolSpeedBase: 178, chaseSpeedBase: 288,
  lungeSpeed: 440, lungeDuration: 0.34, lungeCooldown: 3.1,
  searchDuration: 2.55, flushDuration: 1.35, throwWindup: 0.42,
  throwCooldownBase: 2.3, catchRadius: 46, rubberBandFarDist: 620, rubberBandBoost: 1.56,
});

export const HAZARD_CONFIG = Object.freeze({
  ovenWidth: 120, ovenHeight: 118, ovenFlameHeight: 88, knifeWidth: 64, knifeHeight: 24,
  netRadius: 28, pumpkinRadius: 24, knifeCloseShavePad: 50, ovenCloseShavePad: 46,
  coverWidth: 98, coverHeight: 74, bounceWidth: 78, bounceHeight: 36,
  gravyWidth: 144, gravyHeight: 18, cornRadius: 17, berryRadius: 16,
  exitWidth: 132, exitHeight: 172,
});

export const PALETTES = Object.freeze({
  ink: '#2A140B', parchment: '#FDF3DB', woodDark: '#361A0D',
  harvestGold: '#F4B63F', cranberry: '#C92A2A', sageStealth: '#2B8A5B',
});

export const RUN_BADGES = Object.freeze([
  { id: 'ghost', label: 'Ghost Turkey', desc: 'Slipped Jed in stealth cover' },
  { id: 'knife_dancer', label: 'Feather Dancer', desc: '3+ Close Shave dodges' },
  { id: 'rafter_ace', label: 'Rafter Acrobat', desc: 'Mastered high-tier routes' },
  { id: 'decoy_master', label: 'Decoy Trickster', desc: 'Lured Jed with an Acorn' },
  { id: 'corn_hoarder', label: 'Harvest Raider', desc: 'Snagged 6+ Golden Corn' },
  { id: 'clean_escape', label: 'Golden Wishbone', desc: 'Escaped with full 3/3 lives' },
]);

export const UI_RECTS = Object.freeze({
  titleStage1Btn: { x: 244, y: 158, w: 252, h: 42 },
  titleStage2Btn: { x: 514, y: 158, w: 252, h: 42 },
  titleStage3Btn: { x: 784, y: 158, w: 252, h: 42 },
  titlePlayBtn: { x: 364, y: 214, w: 300, h: 62 },
  titleModeBtn: { x: 682, y: 214, w: 234, h: 62 },
  hudPauseBtn: { x: 1172, y: 12, w: 94, h: 32 },
  hudMuteBtn: { x: 1172, y: 50, w: 94, h: 32 },
  pauseResumeBtn: { x: 486, y: 356, w: 308, h: 58 },
  pauseRestartBtn: { x: 486, y: 428, w: 308, h: 54 },
  pauseTitleBtn: { x: 486, y: 496, w: 308, h: 54 },
  endPlayAgainBtn: { x: 678, y: 650, w: 256, h: 62 },
  endTitleBtn: { x: 952, y: 650, w: 256, h: 62 },
});

export const pointInRect = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
