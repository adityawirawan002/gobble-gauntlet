// Entry point for Gobble Gauntlet v3: DPR canvas setup, fixed-step loop, UI clicks, audio & QA hook.

import { HarvestAudioSynth } from './audio.js';
import { EVENTS, MODES, pointInRect, SCREENS, UI_RECTS, VIEW } from './constants.js';
import { createEscapeWorld } from './engine.js';
import { renderGameFrame } from './hud.js';
import { createInputController } from './input.js';
import { applyDeterministicShot } from './shots.js';

export function bootstrapGobbleGauntlet() {
  const canvas = document.getElementById('gobble-canvas');
  const statusEl = document.getElementById('hud-sr');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return null;
  const params = new URLSearchParams(window.location.search);
  const seed = Math.max(1, Math.floor(Number(params.get('seed')) || 1));
  const shotParam = params.get('shot');
  const world = createEscapeWorld(seed);
  const audio = new HarvestAudioSynth();
  let accum = 0, lastTs = 0, frozenShot = false;
  const announce = (text) => { if (statusEl) statusEl.textContent = text; };
  function syncCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(VIEW.width * dpr), h = Math.round(VIEW.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const audioMap = [
    [EVENTS.JUMP, () => audio.playJump()], [EVENTS.FLUTTER, () => audio.playFlutter()],
    [EVENTS.UPDRAFT, () => audio.playUpdraft()], [EVENTS.DASH, () => audio.playDash()],
    [EVENTS.HIDE, () => audio.playHideRustle()], [EVENTS.DECOY, () => audio.playDecoyBounce()],
    [EVENTS.CORN, () => audio.playCornChime(world.state.combo)], [EVENTS.BERRY, () => audio.playBerryHeal()],
    [EVENTS.CLOSE_SHAVE, () => audio.playCloseShave()], [EVENTS.SPOTTED, () => audio.playAlertSting()],
    [EVENTS.KNIFE_THROW, () => audio.playKnifeWhoosh()], [EVENTS.NET_THROW, () => audio.playNetWhoosh()],
    [EVENTS.DOG_BARK, () => audio.playDogBark()], [EVENTS.OVEN_BURST, () => audio.playOvenRoar()],
    [EVENTS.BOUNCE, () => audio.playBouncePad()], [EVENTS.HIT, () => audio.playHitThud()],
    [EVENTS.STAGE_CLEAR, () => { audio.playStageClear(); announce(`Stage ${world.state.stage.id} cleared!`); }],
    [EVENTS.VICTORY, () => { audio.playVictoryFanfare(); announce(`Escaped! Score ${world.state.score}, Rank ${world.state.rank}.`); }],
    [EVENTS.CAUGHT, () => { audio.playCaughtJingle(); announce(`Caught in ${world.state.stage.title}.`); }],
  ];
  function startRun(stageIdx = world.state.selectedStartStage) {
    frozenShot = false; audio.unlock();
    world.startNewRun(world.state.mode, stageIdx);
    audio.playGobble(1.1);
    announce(`Run started in ${world.state.stage.title}.`);
  }
  const screenButtons = {
    [SCREENS.TITLE]: ['titleStage1Btn', 'titleStage2Btn', 'titleStage3Btn', 'titlePlayBtn', 'titleModeBtn'],
    [SCREENS.PLAY]: ['hudPauseBtn', 'hudMuteBtn'],
    [SCREENS.PAUSE]: ['pauseResumeBtn', 'pauseRestartBtn', 'pauseTitleBtn'],
    [SCREENS.END]: ['endPlayAgainBtn', 'endTitleBtn'],
  };
  function detectHover(px, py) {
    for (const id of (screenButtons[world.state.screen] || [])) {
      if (pointInRect(px, py, UI_RECTS[id])) return id;
    }
    return null;
  }
  const updateCursor = () => { canvas.style.cursor = world.state.hoverTarget ? 'pointer' : 'default'; };
  function handleClick(px, py) {
    const id = detectHover(px, py);
    world.state.hoverTarget = id; updateCursor();
    if (!id) return false;
    audio.unlock();
    if (id.startsWith('titleStage')) {
      const idx = Number(id[10]) - 1;
      world.state.selectedStartStage = idx; audio.playCornChime(idx + 1); return true;
    }
    if (id === 'titlePlayBtn') { startRun(); return true; }
    if (id === 'titleModeBtn') {
      world.state.mode = world.state.mode === MODES.ESCAPE ? MODES.ENDLESS : MODES.ESCAPE;
      audio.playCornChime(2); return true;
    }
    if (id === 'hudPauseBtn') { world.state.screen = SCREENS.PAUSE; return true; }
    if (id === 'hudMuteBtn') { world.state.muted = audio.toggleMute(); return true; }
    if (id === 'pauseResumeBtn') { world.state.screen = SCREENS.PLAY; return true; }
    if (id === 'pauseRestartBtn') { startRun(); return true; }
    if (id === 'pauseTitleBtn' || id === 'endTitleBtn') { world.resetToTitle(); return true; }
    if (id === 'endPlayAgainBtn') { startRun(0); return true; }
    return false;
  }
  const input = createInputController(canvas, {
    onUserGesture: () => audio.unlock(),
    onHover: (px, py) => { world.state.hoverTarget = detectHover(px, py); updateCursor(); },
    onClick: (px, py) => (world.state.screen === SCREENS.STAGE_CLEAR ? (world.advanceStage(), true) : handleClick(px, py)),
    onSelectStage: (idx) => {
      if (world.state.screen === SCREENS.TITLE) { audio.unlock(); world.state.selectedStartStage = idx; audio.playCornChime(idx + 1); }
    },
    onConfirm: () => {
      audio.unlock();
      if (world.state.screen === SCREENS.TITLE) startRun();
      else if (world.state.screen === SCREENS.END) startRun(0);
      else if (world.state.screen === SCREENS.STAGE_CLEAR) world.advanceStage();
    },
    onPause: () => {
      if (world.state.screen === SCREENS.PLAY) world.state.screen = SCREENS.PAUSE;
      else if (world.state.screen === SCREENS.PAUSE) world.state.screen = SCREENS.PLAY;
    },
    onRestart: () => { if (world.state.screen !== SCREENS.TITLE) startRun(0); },
    onMute: () => { audio.unlock(); world.state.muted = audio.toggleMute(); },
  });
  syncCanvas();
  window.addEventListener('resize', syncCanvas);
  window.__GOBBLE_STATE__ = () => ({
    screen: world.state.screen, stage: world.state.stage.id, score: world.state.score,
    lives: world.state.lives, muted: world.state.muted, outcome: world.state.outcome, rank: world.state.rank,
    turkey: { x: Math.round(world.state.turkey.x), y: Math.round(world.state.turkey.y), tier: world.state.turkey.tier, hidden: world.state.turkey.hidden, dashIframes: Number(world.state.turkey.dashIframes.toFixed(2)) },
    farmer: { x: Math.round(world.state.farmer.x), state: world.state.farmer.state, badge: world.state.farmer.badgeText },
    decoys: world.state.layout.decoys.length, stats: { ...world.state.stats },
  });
  if (shotParam) {
    frozenShot = applyDeterministicShot(world, shotParam.toLowerCase());
    renderGameFrame(ctx, world.state);
    window.__GOBBLE_READY__ = { shot: shotParam, ...window.__GOBBLE_STATE__(), badges: world.state.earnedBadges.map((b) => b.label) };
  }
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const rawDt = Math.min(VIEW.maxFrameDt, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;
    if (!frozenShot) {
      accum += rawDt;
      while (accum >= VIEW.fixedDt) {
        const ev = world.stepWorld(VIEW.fixedDt, input.sampleFrameInput());
        if (ev) for (const [bit, fn] of audioMap) if (ev & bit) fn();
        audio.tickMusic(VIEW.fixedDt, world.state.screen === SCREENS.PLAY, world.state.stageIndex, world.state.farmer.badgeText.startsWith('!'));
        accum -= VIEW.fixedDt;
      }
      renderGameFrame(ctx, world.state);
    }
    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);
  return { world, audio, input };
}
bootstrapGobbleGauntlet();
