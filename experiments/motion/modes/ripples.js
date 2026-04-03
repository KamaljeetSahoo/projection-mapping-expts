export function createRipples() {
  let time = 0;
  const MAX_RIPPLES = 15;
  let ripples = [];

  return {
    name: 'Ripples',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      ripples = [];
    },

    update(canvas, dt, motion) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.92)');

      time += dt * 0.001;

      const grid = motion.getGrid();
      const cols = motion.getCols();
      const rows = motion.getRows();
      const cellW = width / cols;
      const cellH = height / rows;

      // Spawn ripples where motion is detected
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] > 0.3 && Math.random() < grid[r][c] * 0.08) {
            ripples.push({
              x: (1 - c / cols) * width, // mirror
              y: (r / rows) * height,
              radius: 0,
              maxRadius: 80 + grid[r][c] * 200,
              speed: 80 + grid[r][c] * 120,
              life: 1,
              hue: (time * 30 + c * 10 + r * 15) % 360,
            });
            if (ripples.length > MAX_RIPPLES) ripples.shift();
          }
        }
      }

      // Draw and update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.radius += rip.speed * dt * 0.001;
        rip.life = 1 - rip.radius / rip.maxRadius;

        if (rip.life <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        const alpha = rip.life * 0.6;

        // Outer ring
        ctx.strokeStyle = `hsla(${rip.hue}, 60%, 55%, ${alpha})`;
        ctx.lineWidth = 2 + rip.life * 3;
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow ring
        ctx.strokeStyle = `hsla(${rip.hue}, 70%, 65%, ${alpha * 0.4})`;
        ctx.lineWidth = 6 + rip.life * 8;
        ctx.stroke();

        // Center dot (fades with life)
        if (rip.life > 0.7) {
          const dotAlpha = (rip.life - 0.7) * 3;
          ctx.fillStyle = `hsla(${rip.hue}, 80%, 70%, ${dotAlpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },

    destroy() { ripples = []; },
  };
}
