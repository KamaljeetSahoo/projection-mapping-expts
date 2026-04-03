export function createTrails() {
  let time = 0;
  let hueOffset = 0;

  // Persistent small circles that linger and fade
  const MAX_DOTS = 800;
  let dots = [];

  return {
    name: 'Glow Trails',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      hueOffset = 0;
      dots = [];
    },

    update(canvas, dt, motion) {
      const { ctx, width, height } = canvas;
      canvas.fadeOut(0.025);

      time += dt * 0.001;
      hueOffset += dt * 0.008;

      const grid = motion.getGrid();
      const cols = motion.getCols();
      const rows = motion.getRows();
      const cellW = width / cols;
      const cellH = height / rows;

      // Spawn small circles where motion is detected
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = grid[r][c];
          if (val < 0.08) continue;

          // Spawn multiple dots per active cell — more motion = more dots
          const spawnCount = Math.floor(val * 6);
          for (let s = 0; s < spawnCount; s++) {
            // Scatter within the cell area
            const x = (1 - (c + Math.random()) / cols) * width;
            const y = ((r + Math.random()) / rows) * height;

            dots.push({
              x,
              y,
              size: 2 + Math.random() * 6,
              life: 1,
              decay: 0.008 + Math.random() * 0.012,
              hue: (hueOffset + c * 8 + r * 12 + Math.random() * 30) % 360,
            });
          }
        }
      }

      // Cap dots
      if (dots.length > MAX_DOTS) {
        dots = dots.slice(-MAX_DOTS);
      }

      // Update and draw dots
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        d.life -= d.decay * dt * 0.06;

        if (d.life <= 0) {
          dots.splice(i, 1);
          continue;
        }

        const alpha = d.life * 0.7;
        const size = d.size * (0.3 + d.life * 0.7);

        // Outer glow
        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, size * 3);
        glow.addColorStop(0, `hsla(${d.hue}, 75%, 60%, ${alpha * 0.4})`);
        glow.addColorStop(0.5, `hsla(${d.hue}, 65%, 50%, ${alpha * 0.1})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(d.x - size * 3, d.y - size * 3, size * 6, size * 6);

        // Core circle
        ctx.fillStyle = `hsla(${d.hue}, 80%, 65%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ambient pulse at motion center
      const overall = motion.getOverallMotion();
      if (overall > 0.05) {
        const center = motion.getMotionCenter();
        const cx = center.x * width;
        const cy = center.y * height;
        const pulseR = 80 + overall * 200;
        const hue = (hueOffset + 180) % 360;
        const pulse = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        pulse.addColorStop(0, `hsla(${hue}, 70%, 55%, ${overall * 0.08})`);
        pulse.addColorStop(1, 'transparent');
        ctx.fillStyle = pulse;
        ctx.fillRect(cx - pulseR, cy - pulseR, pulseR * 2, pulseR * 2);
      }
    },

    destroy() { dots = []; },
  };
}
