// Unified keyboard & mouse input controller with edge-triggered actions and virtual 1280x800 coords.

import { VIEW } from './constants.js';

export function createInputController(canvas, cb = {}) {
  const held = new Set();
  let jumpPressed = false, dashPressed = false, hidePressed = false, decoyPressed = false, mouseJump = false;
  let px = VIEW.width * 0.5, py = VIEW.height * 0.5, inside = false;
  const prevent = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return r.width && r.height ? { x: ((e.clientX - r.left) / r.width) * VIEW.width, y: ((e.clientY - r.top) / r.height) * VIEW.height } : { x: px, y: py };
  };
  window.addEventListener('keydown', (e) => {
    const c = e.code;
    if (prevent.has(c)) e.preventDefault();
    if (e.repeat) return;
    if (c === 'KeyM') { cb.onMute?.(); return; }
    if (c === 'KeyP' || c === 'Escape') { cb.onPause?.(); return; }
    if (c === 'KeyR') { cb.onRestart?.(); return; }
    if (c === 'Digit1' || c === 'Digit2' || c === 'Digit3') { cb.onSelectStage?.(Number(c[5]) - 1); return; }
    if (c === 'Enter') cb.onConfirm?.();
    held.add(c);
    if (c === 'Space' || c === 'KeyW' || c === 'ArrowUp') { jumpPressed = true; cb.onConfirm?.(); }
    if (c === 'ShiftLeft' || c === 'ShiftRight' || c === 'KeyK') dashPressed = true;
    if (c === 'KeyE' || c === 'KeyS' || c === 'ArrowDown') hidePressed = true;
    if (c === 'KeyQ' || c === 'KeyF') decoyPressed = true;
  }, { passive: false });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => { held.clear(); mouseJump = false; });
  canvas.addEventListener('pointermove', (e) => { ({ x: px, y: py } = toCanvas(e)); inside = true; cb.onHover?.(px, py); });
  canvas.addEventListener('pointerdown', (e) => {
    canvas.focus?.(); ({ x: px, y: py } = toCanvas(e)); inside = true; cb.onUserGesture?.();
    if (e.button === 2) { dashPressed = true; return; }
    if (e.button === 0 && !cb.onClick?.(px, py)) { jumpPressed = true; mouseJump = true; }
  });
  window.addEventListener('pointerup', (e) => { if (e.button === 0) mouseJump = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  return {
    sampleFrameInput() {
      const f = {
        moveX: ((held.has('KeyD') || held.has('ArrowRight')) ? 1 : 0) - ((held.has('KeyA') || held.has('ArrowLeft')) ? 1 : 0),
        jumpPressed, jumpHeld: held.has('Space') || held.has('KeyW') || held.has('ArrowUp') || mouseJump,
        dashPressed, hidePressed, hideHeld: held.has('KeyE') || held.has('KeyS') || held.has('ArrowDown'),
        decoyPressed, pointerX: px, pointerY: py, pointerInside: inside,
      };
      jumpPressed = dashPressed = hidePressed = decoyPressed = false;
      return f;
    },
    clearEdges() { jumpPressed = dashPressed = hidePressed = decoyPressed = mouseJump = false; },
    getPointer() { return { x: px, y: py, inside }; },
  };
}
