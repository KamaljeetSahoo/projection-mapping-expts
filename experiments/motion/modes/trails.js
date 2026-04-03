export function createTrails() {
  let time = 0;
  let hueOffset = 0;

  return {
    name: 'Glow Trails',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      hueOffset = 0;
    },

    update(canvas, dt, motion) {
      const { ctx, width, height } = canvas;
      canvas.fadeOut(0.04);

      time += dt * 0.001;
      hueOffset += dt * 0.008;

      const grid = motion.getGrid();
      const cols = motion.getCols();
      const rows = motion.getRows();
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r][c];
          if (val < 0.1) continue;

          const x = (1 - c / cols) * width; // mirror
          const y = (r / rows) * height;

          const hue = (hueOffset + c * 8 + r * 12) % 360;
          const radius = 15 + val * 60;

          // Glow blob
          const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
          glow.addColorStop(0, `hsla(${hue}, 70%, 60%, ${val * 0.5})`);
          glow.addColorStop(0.4, `hsla(${hue}, 60%, 45%, ${val * 0.2})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
      }

      // Overall motion drives a large ambient pulse
      const overall = motion.getOverallMotion();
      if (overall > 0.05) {
        const center = motion.getMotionCenter();
        const cx = center.x * width;
        const cy = center.y * height;
        const pulseR = 100 + overall * 300;
        const hue = (hueOffset + 180) % 360;
        const pulse = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        pulse.addColorStop(0, `hsla(${hue}, 70%, 55%, ${overall * 0.1})`);
        pulse.addColorStop(1, 'transparent');
        ctx.fillStyle = pulse;
        ctx.fillRect(cx - pulseR, cy - pulseR, pulseR * 2, pulseR * 2);
      }
    },

    destroy() {},
  };
}
