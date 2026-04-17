// Pointer-based gesture handling for the Go canvas.
// Dispatches high-level events: tap, doubleTap, longPress, dragStart/Move/End,
// pinchStart/Move/End (pinch covers both scale and rotate).

const DOUBLE_TAP_MS = 280;
const LONG_PRESS_MS = 480;
const TAP_SLOP_PX = 10;

export function attachGestures(el, handlers) {
  const pointers = new Map(); // id -> {x,y,startX,startY,startT}
  let mode = 'idle';          // 'idle' | 'drag' | 'pinch' | 'pending'
  let pinchStart = null;      // { dist, angle, centerX, centerY }
  let lastTap = { t: 0, x: 0, y: 0 };
  let longPressTimer = null;
  let longPressTriggered = false;

  function rectRelative(e) {
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e) {
    el.setPointerCapture(e.pointerId);
    const { x, y } = rectRelative(e);
    pointers.set(e.pointerId, { x, y, startX: x, startY: y, startT: performance.now() });

    if (pointers.size === 1) {
      mode = 'pending';
      longPressTriggered = false;
      clearTimeout(longPressTimer);
      longPressTimer = setTimeout(() => {
        if (mode === 'pending' && pointers.size === 1) {
          const p = [...pointers.values()][0];
          if (Math.hypot(p.x - p.startX, p.y - p.startY) <= TAP_SLOP_PX) {
            longPressTriggered = true;
            mode = 'idle';
            handlers.onLongPress?.({ x: p.x, y: p.y });
          }
        }
      }, LONG_PRESS_MS);
    } else if (pointers.size === 2) {
      clearTimeout(longPressTimer);
      // Cancel drag if it was pending
      if (mode === 'drag') handlers.onDragEnd?.();
      const [a, b] = [...pointers.values()];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      pinchStart = {
        dist: Math.hypot(dx, dy) || 1,
        angle: Math.atan2(dy, dx),
        centerX: (a.x + b.x) / 2,
        centerY: (a.y + b.y) / 2,
      };
      mode = 'pinch';
      handlers.onPinchStart?.({
        x: pinchStart.centerX,
        y: pinchStart.centerY,
      });
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    const { x, y } = rectRelative(e);
    p.x = x; p.y = y;

    if (mode === 'pending' && pointers.size === 1) {
      const dx = x - p.startX;
      const dy = y - p.startY;
      if (Math.hypot(dx, dy) > TAP_SLOP_PX) {
        clearTimeout(longPressTimer);
        mode = 'drag';
        handlers.onDragStart?.({ x: p.startX, y: p.startY });
        handlers.onDragMove?.({ x, y, dx: x - p.startX, dy: y - p.startY });
      }
    } else if (mode === 'drag' && pointers.size === 1) {
      handlers.onDragMove?.({ x, y, dx: x - p.startX, dy: y - p.startY });
    } else if (mode === 'pinch' && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const angle = Math.atan2(dy, dx);
      handlers.onPinchMove?.({
        scale: dist / pinchStart.dist,
        rotation: angle - pinchStart.angle,
        centerX: (a.x + b.x) / 2,
        centerY: (a.y + b.y) / 2,
      });
    }
  }

  function onPointerUp(e) {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    const { x, y } = rectRelative(e);
    pointers.delete(e.pointerId);
    try { el.releasePointerCapture(e.pointerId); } catch {}

    if (mode === 'pinch') {
      if (pointers.size < 2) {
        handlers.onPinchEnd?.();
        // If one pointer left, continue as a (new) drag on that finger
        if (pointers.size === 1) {
          const rem = [...pointers.values()][0];
          rem.startX = rem.x;
          rem.startY = rem.y;
          mode = 'drag';
          handlers.onDragStart?.({ x: rem.x, y: rem.y });
        } else {
          mode = 'idle';
        }
      }
      return;
    }

    if (mode === 'drag') {
      handlers.onDragEnd?.({ x, y });
      mode = pointers.size === 0 ? 'idle' : 'pending';
      return;
    }

    if (mode === 'pending') {
      clearTimeout(longPressTimer);
      if (longPressTriggered) {
        mode = 'idle';
        return;
      }
      const moved = Math.hypot(x - p.startX, y - p.startY);
      if (moved <= TAP_SLOP_PX) {
        const now = performance.now();
        const dt = now - lastTap.t;
        const close = Math.hypot(x - lastTap.x, y - lastTap.y) < 24;
        if (dt < DOUBLE_TAP_MS && close) {
          handlers.onDoubleTap?.({ x, y });
          lastTap = { t: 0, x: 0, y: 0 };
        } else {
          handlers.onTap?.({ x, y });
          lastTap = { t: now, x, y };
        }
      }
      mode = pointers.size === 0 ? 'idle' : 'pending';
    }
  }

  function onPointerCancel(e) {
    pointers.delete(e.pointerId);
    clearTimeout(longPressTimer);
    if (mode === 'drag') handlers.onDragEnd?.({ cancelled: true });
    if (mode === 'pinch') handlers.onPinchEnd?.({ cancelled: true });
    if (pointers.size === 0) mode = 'idle';
  }

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
    clearTimeout(longPressTimer);
  };
}
