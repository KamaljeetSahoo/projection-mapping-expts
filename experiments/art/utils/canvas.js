export function setupCanvas(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  let width, height, dpr;

  function resize() {
    // Cap DPR at 1 — output is a 1080p projector, Retina is wasted GPU work
    dpr = 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  return {
    ctx,
    get width() { return width; },
    get height() { return height; },
    get dpr() { return dpr; },
    clear(color = 'rgba(0,0,0,1)') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
    },
    fadeOut(alpha = 0.02) {
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(0, 0, width, height);
    },
    destroy() {
      window.removeEventListener('resize', resize);
    },
  };
}
