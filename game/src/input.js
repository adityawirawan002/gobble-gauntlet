// Unified keyboard and mouse input controller with edge-triggered actions and virtual canvas coordinates.

import { VIEW } from './constants.js';

export function createInputController(canvas, callbacks = {}) {
  const held = new Set();
  let jumpPressed = false;
  let dashPressed = false;
  let hidePressed = false;
  let decoyPressed = false;
  let mouseJumpHeld = false;
  let pointerX = VIEW.width * 0.5;
  let pointerY = VIEW.height * 0.5;
  let pointerInside = false;

  function toCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: pointerX, y: pointerY };
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
    };
  }

  function onKeyDown(event) {
    const code = event.code;
    if (
      code === 'Space' || code === 'ArrowUp' || code === 'ArrowDown' ||
      code === 'ArrowLeft' || code === 'ArrowRight'
    ) {
      event.preventDefault();
    }
    if (event.repeat) return;

    if (code === 'KeyM') {
      callbacks.onMute?.();
      return;
    }
    if (code === 'KeyP' || code === 'Escape') {
      callbacks.onPause?.();
      return;
    }
    if (code === 'KeyR') {
      callbacks.onRestart?.();
      return;
    }
    if (code === 'Enter') {
      callbacks.onConfirm?.();
    }

    held.add(code);
    if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
      jumpPressed = true;
      callbacks.onConfirm?.();
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyK') {
      dashPressed = true;
    }
    if (code === 'KeyE' || code === 'KeyS' || code === 'ArrowDown') {
      hidePressed = true;
    }
    if (code === 'KeyQ' || code === 'KeyF') {
      decoyPressed = true;
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onPointerMove(event) {
    const pt = toCanvasCoords(event);
    pointerX = pt.x;
    pointerY = pt.y;
    pointerInside = true;
    callbacks.onHover?.(pt.x, pt.y);
  }

  function onPointerDown(event) {
    canvas.focus?.();
    const pt = toCanvasCoords(event);
    pointerX = pt.x;
    pointerY = pt.y;
    pointerInside = true;
    callbacks.onUserGesture?.();

    if (event.button === 2) {
      dashPressed = true;
      return;
    }
    if (event.button === 0) {
      const consumedByUi = callbacks.onClick?.(pt.x, pt.y);
      if (!consumedByUi) {
        jumpPressed = true;
        mouseJumpHeld = true;
      }
    }
  }

  function onPointerUp(event) {
    if (event.button === 0) mouseJumpHeld = false;
  }

  function onContextMenu(event) {
    event.preventDefault();
  }

  function onBlur() {
    held.clear();
    mouseJumpHeld = false;
  }

  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('contextmenu', onContextMenu);

  function sampleFrameInput() {
    const left = held.has('KeyA') || held.has('ArrowLeft');
    const right = held.has('KeyD') || held.has('ArrowRight');
    const jumpHeld = held.has('Space') || held.has('KeyW') || held.has('ArrowUp') || mouseJumpHeld;
    const hideHeld = held.has('KeyE') || held.has('KeyS') || held.has('ArrowDown');

    const frame = {
      moveX: (right ? 1 : 0) - (left ? 1 : 0),
      jumpPressed,
      jumpHeld,
      dashPressed,
      hidePressed,
      hideHeld,
      decoyPressed,
      pointerX,
      pointerY,
      pointerInside,
    };

    jumpPressed = false;
    dashPressed = false;
    hidePressed = false;
    decoyPressed = false;
    return frame;
  }

  function clearEdges() {
    jumpPressed = false;
    dashPressed = false;
    hidePressed = false;
    decoyPressed = false;
    mouseJumpHeld = false;
  }

  return {
    sampleFrameInput,
    clearEdges,
    getPointer() {
      return { x: pointerX, y: pointerY, inside: pointerInside };
    },
  };
}
