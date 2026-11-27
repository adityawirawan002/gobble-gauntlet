// Core tuning, stage definitions, autumn storybook palettes, badges, and UI layout rects.

export const VIEW = Object.freeze({
  width: 1280,
  height: 720,
  groundY: 598,
  fixedDt: 1 / 60,
  maxFrameDt: 0.05,
});

export const SCREENS = Object.freeze({
  TITLE: 'title',
  PLAY: 'play',
  STAGE_CLEAR: 'stage_clear',
  PAUSE: 'pause',
  END: 'end',
});

export const MODES = Object.freeze({
  ESCAPE: 'escape',
  ENDLESS: 'endless',
});

export const EVENTS = Object.freeze({
  NONE: 0,
  JUMP: 1 << 0,
  FLUTTER: 1 << 1,
  DASH: 1 << 2,
  HIDE: 1 << 3,
  DECOY: 1 << 4,
  CORN: 1 << 5,
  BERRY: 1 << 6,
  CLOSE_SHAVE: 1 << 7,
  SPOTTED: 1 << 8,
  KNIFE_THROW: 1 << 9,
  OVEN_BURST: 1 << 10,
  BOUNCE: 1 << 11,
  HIT: 1 << 12,
  STAGE_CLEAR: 1 << 13,
  VICTORY: 1 << 14,
  CAUGHT: 1 << 15,
  FOOLED: 1 << 16,
});

export const TURKEY_TUNING = Object.freeze({
  width: 60,
  height: 68,
  maxSpeed: 382,
  accelGround: 2500,
  accelAir: 1800,
  frictionGround: 2400,
  gravySpeedFactor: 0.52,
  jumpVelocity: -660,
  gravity: 1620,
  flutterGravity: 400,
  maxFallSpeed: 820,
  flutterMaxFall: 168,
  coyoteTime: 0.12,
  jumpBuffer: 0.13,
  dashSpeed: 780,
  dashDuration: 0.22,
  dashIframes: 0.3,
  dashStaminaCost: 0.6,
  staminaRegen: 0.36,
  closeShaveStaminaRefund: 0.38,
  hitInvuln: 1.6,
  maxLives: 3,
  decoyCooldown: 2.6,
  decoyThrowSpeedX: 435,
  decoyThrowSpeedY: -360,
  bounceVelocity: -860,
});

export const FARMER_AI_CONFIG = Object.freeze({
  width: 74,
  height: 122,
  visionRangeBase: 375,
  visionRangeStageBonus: 36,
  visionHiddenFactor: 0.22,
  patrolSpeedBase: 170,
  chaseSpeedBase: 274,
  lungeSpeed: 415,
  lungeDuration: 0.34,
  lungeCooldown: 3.2,
  searchDuration: 2.35,
  throwWindup: 0.44,
  throwCooldownBase: 2.5,
  catchRadius: 46,
  rubberBandFarDist: 650,
  rubberBandBoost: 1.48,
});

export const HAZARD_CONFIG = Object.freeze({
  ovenWidth: 118,
  ovenHeight: 114,
  ovenFlameRangeX: 150,
  ovenFlameHeight: 82,
  knifeWidth: 62,
  knifeHeight: 24,
  knifeCloseShavePad: 48,
  ovenCloseShavePad: 42,
  coverWidth: 96,
  coverHeight: 70,
  bounceWidth: 74,
  bounceHeight: 34,
  gravyWidth: 140,
  gravyHeight: 18,
  cornRadius: 17,
  berryRadius: 16,
  exitWidth: 124,
  exitHeight: 166,
});

export const STAGES = Object.freeze([
  {
    id: 1,
    key: 'farmyard',
    title: 'GOLDEN FARMYARD',
    shortName: 'FARMYARD',
    bannerSub: 'Outrun the Farmer past the barn & outdoor roasting ovens!',
    length: 2950,
    coverKind: 'hay',
    coverLabel: 'HAY BALE',
    farmerRole: 'farmer',
    farmerSpeedScale: 1.0,
    knifeCooldownScale: 1.0,
    ovenCycle: 3.35,
    ovenActive: 1.15,
    ovenTelegraph: 0.72,
    sweeperKnives: 0,
    musicBpm: 122,
  },
  {
    id: 2,
    key: 'smokehouse',
    title: 'SMOKEHOUSE CELLAR',
    shortName: 'SMOKEHOUSE',
    bannerSub: 'Hide behind pumpkin crates and dodge twin knife arcs!',
    length: 3250,
    coverKind: 'crate',
    coverLabel: 'PUMPKIN CRATE',
    farmerRole: 'farmer',
    farmerSpeedScale: 1.1,
    knifeCooldownScale: 0.85,
    ovenCycle: 3.0,
    ovenActive: 1.15,
    ovenTelegraph: 0.66,
    sweeperKnives: 1,
    musicBpm: 134,
  },
  {
    id: 3,
    key: 'kitchen',
    title: 'THANKSGIVING KITCHEN',
    shortName: 'KITCHEN',
    bannerSub: 'Survive the Chef-Farmer & leap through the Open Escape Window!',
    length: 3480,
    coverKind: 'pot',
    coverLabel: 'COPPER POT',
    farmerRole: 'chef',
    farmerSpeedScale: 1.18,
    knifeCooldownScale: 0.74,
    ovenCycle: 2.75,
    ovenActive: 1.18,
    ovenTelegraph: 0.62,
    sweeperKnives: 2,
    musicBpm: 148,
  },
]);

export const PALETTES = Object.freeze({
  ink: '#24120A',
  inkSoft: '#4A2816',
  parchment: '#FBF1D6',
  parchmentDark: '#E6CFA0',
  woodDark: '#3A1D0F',
  woodMid: '#6E381A',
  harvestGold: '#F4B43A',
  amberGlow: '#FF8C24',
  cranberry: '#C92A2A',
  cranberryBright: '#F03E3E',
  sageStealth: '#2B8A5B',
});

export const RUN_BADGES = Object.freeze([
  { id: 'ghost', label: 'Ghost Turkey', desc: 'Broke chase using stealth cover' },
  { id: 'knife_dancer', label: 'Knife Dancer', desc: '3+ Close Shave near-misses' },
  { id: 'oven_dodger', label: 'Oven Dodger', desc: 'Never singed by a roasting oven' },
  { id: 'decoy_master', label: 'Decoy Master', desc: 'Lured Farmer with an Acorn Decoy' },
  { id: 'corn_hoarder', label: 'Corn Hoarder', desc: 'Collected 12+ Golden Corn' },
  { id: 'clean_escape', label: 'Clean Escape', desc: 'Escaped with full 3/3 lives' },
]);

export const UI_RECTS = Object.freeze({
  titlePlayBtn: { x: 378, y: 286, w: 282, h: 66 },
  titleModeBtn: { x: 678, y: 286, w: 226, h: 66 },
  hudPauseBtn: { x: 1178, y: 14, w: 86, h: 36 },
  hudMuteBtn: { x: 1178, y: 56, w: 86, h: 36 },
  pauseResumeBtn: { x: 486, y: 318, w: 308, h: 58 },
  pauseRestartBtn: { x: 486, y: 392, w: 308, h: 54 },
  pauseTitleBtn: { x: 486, y: 462, w: 308, h: 54 },
  endPlayAgainBtn: { x: 374, y: 584, w: 256, h: 62 },
  endTitleBtn: { x: 650, y: 584, w: 256, h: 62 },
});

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}
