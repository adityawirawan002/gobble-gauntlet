// Entry point for Gobble Gauntlet: DPR canvas setup, fixed-step game loop, UI click routing, and audio wiring.

import { HarvestAudioSynth } from './audio-synth.js';
import { EVENTS, MODES, pointInRect, SCREENS, UI_RECTS, VIEW } from './constants.js';
import { createInputController } from './input.js';
import { renderGameFrame } from './renderer.js';
import { applyDeterministicShot } from './shots.js';
import { createEscapeWorld } from './world.js';

export function bootstrapGobbleGauntlet() {
  const canvas = document.getElementById('gobble-canvas');
  const statusEl = document.getElementById('hud-sr');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const params = new URLSearchParams(window.location.search);
  const seedParam = Number(params.get('seed'));
  const seed = Number.isFinite(seedParam) && seedParam > 0 ? Math.floor(seedParam) : 1;
  const shotParam = params.get('shot');

  const world = createEscapeWorld(seed);
  const audio = new HarvestAudioSynth();
  let accumulator = 0;
  let lastTimestamp = 0;
  let frozenShot = false;

  function syncCanvasResolution() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const targetW = Math.round(VIEW.width * dpr);
    const targetH = Math.round(VIEW.height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function dispatchAudioEvents(events) {
    if (!events) return;
    if (events & EVENTS.JUMP) audio.playJump();
    if (events & EVENTS.FLUTTER) audio.playFlutter();
    if (events & EVENTS.DASH) audio.playDash();
    if (events & EVENTS.HIDE) audio.playHideRustle();
    if (events & EVENTS.DECOY) audio.playDecoyBounce();
    if (events & EVENTS.CORN) audio.playCornChime(world.state.combo);
    if (events & EVENTS.BERRY) audio.playBerryHeal();
    if (events & EVENTS.CLOSE_SHAVE) audio.playCloseShave();
    if (events & EVENTS.SPOTTED) audio.playAlertSting();
    if (events & EVENTS.KNIFE_THROW) audio.playKnifeWhoosh();
    if (events & EVENTS.OVEN_BURST) audio.playOvenRoar();
    if (events & EVENTS.BOUNCE) audio.playBouncePad();
    if (events & EVENTS.HIT) audio.playHitThud();
    if (events & EVENTS.STAGE_CLEAR) {
      audio.playStageClear();
      announce(`Stage ${world.state.stage.id} cleared! Score ${world.state.score}.`);
    }
    if (events & EVENTS.VICTORY) {
      audio.playVictoryFanfare();
      announce(`Escaped the table! Final score ${world.state.score}, Rank ${world.state.rank}.`);
    }
    if (events & EVENTS.CAUGHT) {
      audio.playCaughtJingle();
      announce(`Almost dinner! Caught in ${world.state.stage.title}. Score ${world.state.score}.`);
    }
  }

  function startRunFromUi() {
    frozenShot = false;
    audio.unlock();
    world.startNewRun(world.state.mode);
    audio.playGobble(1.1);
    announce(`Run started in ${world.state.stage.title}.`);
  }

  function detectHoverTarget(px, py) {
    const scr = world.state.screen;
    if (scr === SCREENS.TITLE) {
      if (pointInRect(px, py, UI_RECTS.titlePlayBtn)) return 'titlePlayBtn';
      if (pointInRect(px, py, UI_RECTS.titleModeBtn)) return 'titleModeBtn';
    } else if (scr === SCREENS.PLAY) {
      if (pointInRect(px, py, UI_RECTS.hudPauseBtn)) return 'hudPauseBtn';
      if (pointInRect(px, py, UI_RECTS.hudMuteBtn)) return 'hudMuteBtn';
    } else if (scr === SCREENS.PAUSE) {
      if (pointInRect(px, py, UI_RECTS.pauseResumeBtn)) return 'pauseResumeBtn';
      if (pointInRect(px, py, UI_RECTS.pauseRestartBtn)) return 'pauseRestartBtn';
      if (pointInRect(px, py, UI_RECTS.pauseTitleBtn)) return 'pauseTitleBtn';
    } else if (scr === SCREENS.END) {
      if (pointInRect(px, py, UI_RECTS.endPlayAgainBtn)) return 'endPlayAgainBtn';
      if (pointInRect(px, py, UI_RECTS.endTitleBtn)) return 'endTitleBtn';
    }
    return null;
  }

  exportHoverCursor();
  function exportHoverCursor() {
    canvas.style.cursor = world.state.hoverTarget ? 'pointer' : 'default';
  }

  function handleUiClick(px, py) {
    const target = detectHoverTarget(px, py);
    world.state.hoverTarget = target;
    exportHoverCursor();
    if (!target) return false;

    audio.unlock();
    if (target === 'titlePlayBtn') {
      startRunFromUi();
      return true;
    }
    if (target === 'titleModeBtn') {
      world.state.mode = world.state.mode === MODES.ESCAPE ? MODES.ENDLESS : MODES.ESCAPE;
      audio.playCornChime(2);
      return true;
    }
    if (target === 'hudPauseBtn') {
      world.state.screen = SCREENS.PAUSE;
      announce('Game paused.');
      return true;
    }
    if (target === 'hudMuteBtn') {
      world.state.muted = audio.toggleMute();
      return true;
    }
    if (target === 'pauseResumeBtn') {
      world.state.screen = SCREENS.PLAY;
      announce('Resumed.');
      return true;
    }
    if (target === 'pauseRestartBtn') {
      startRunFromUi();
      return true;
    }
    if (target === 'pauseTitleBtn') {
      world.resetToTitle();
      announce('Returned to title.');
      return true;
    }
    if (target === 'endPlayAgainBtn') {
      startRunFromUi();
      return true;
    }
    if (target === 'endTitleBtn') {
      world.resetToTitle();
      announce('Returned to title.');
      return true;
    }
    return false;
  }

  const input = createInputController(canvas, {
    onUserGesture() {
      audio.unlock();
    },
    onHover(px, py) {
      world.state.hoverTarget = detectHoverTarget(px, py);
      exportHoverCursor();
    },
    onClick(px, py) {
      if (world.state.screen === SCREENS.STAGE_CLEAR) {
        world.advanceStage();
        return true;
      }
      return handleUiClick(px, py);
    },
    onConfirm() {
      audio.unlock();
      if (world.state.screen === SCREENS.TITLE || world.state.screen === SCREENS.END) {
        startRunFromUi();
      } else if (world.state.screen === SCREENS.STAGE_CLEAR) {
        world.advanceStage();
      }
    },
    onPause() {
      if (world.state.screen === SCREENS.PLAY) {
        world.state.screen = SCREENS.PAUSE;
        announce('Paused.');
      } else if (world.state.screen === SCREENS.PAUSE) {
        world.state.screen = SCREENS.PLAY;
        announce('Resumed.');
      }
    },
    onRestart() {
      if (world.state.screen !== SCREENS.TITLE) {
        startRunFromUi();
      }
    },
    onMute() {
      audio.unlock();
      world.state.muted = audio.toggleMute();
    },
  });

  syncCanvasResolution();
  window.addEventListener('resize', syncCanvasResolution);

  // Deterministic shot mode (?shot=title|farm|kitchen|end&seed=1).
  if (shotParam) {
    frozenShot = applyDeterministicShot(world, shotParam.toLowerCase());
    renderGameFrame(ctx, world.state);
    window.__GOBBLE_READY__ = {
      shot: shotParam,
      screen: world.state.screen,
      stage: world.state.stage.id,
      score: world.state.score,
      lives: world.state.lives,
      outcome: world.state.outcome,
      rank: world.state.rank,
      closeShaves: world.state.stats.closeShaves,
      badges: world.state.earnedBadges.map((b) => b.label),
    };
  }

  function runGameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const rawDt = Math.min(VIEW.maxFrameDt, Math.max(0, (timestamp - lastTimestamp) / 1000));
    lastTimestamp = timestamp;

    if (!frozenShot) {
      accumulator += rawDt;
      while (accumulator >= VIEW.fixedDt) {
        const frameInput = input.sampleFrameInput();
        const events = world.stepWorld(VIEW.fixedDt, frameInput);
        dispatchAudioEvents(events);
        const chased = world.state.farmer.badgeText.startsWith('!');
        audio.tickMusic(VIEW.fixedDt, world.state.screen === SCREENS.PLAY, world.state.stageIndex, chased);
        accumulator -= VIEW.fixedDt;
      }
      renderGameFrame(ctx, world.state);
    }

    window.requestAnimationFrame(runGameLoop);
  }

  window.requestAnimationFrame(runGameLoop);
  return { world, audio, input };
}

bootstrapGobbleGauntlet();
