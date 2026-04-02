export function createEqualizerGrid() {
  const COLS = 32;
  const ROWS = 16;
  let grid = [];
  let beatPulse = 0;
  let hueOffset = 0;

  for (let r = 0; r < ROWS; r++) {
    grid.push(new Float32Array(COLS));
  }

  return {
    name: 'Equalizer Grid',

    init(canvas) {
      canvas.clear('#000');
      for (let r = 0; r < ROWS; r++) grid[r].fill(0);
      beatPulse = 0;
      hueOffset = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('#000');

      const freq = audio.getFrequencyData();
      const bass = audio.getBass();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.9;
      hueOffset += dt * 0.008;

      const padding = 20;
      const gap = 4;
      const cellW = (width - padding * 2 - (COLS - 1) * gap) / COLS;
      const cellH = (height - padding * 2 - (ROWS - 1) * gap) / ROWS;

      // Map frequency to columns
      if (freq && freq.length) {
        for (let c = 0; c < COLS; c++) {
          const frac = Math.pow(c / COLS, 1.4);
          const bin = Math.floor(frac * freq.length * 0.4);
          const val = freq[bin] / 255;
          const litRows = Math.floor(val * ROWS);

          for (let r = 0; r < ROWS; r++) {
            const rowFromBottom = ROWS - 1 - r;
            const target = rowFromBottom < litRows ? 1 : 0;
            grid[r][c] += (target - grid[r][c]) * (target > grid[r][c] ? 0.5 : 0.12);
          }
        }
      }

      // Draw cells
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const val = grid[r][c];
          if (val < 0.02) continue;

          const x = padding + c * (cellW + gap);
          const y = padding + r * (cellH + gap);

          const rowFromBottom = ROWS - 1 - r;
          const rowFrac = rowFromBottom / ROWS;

          // Green at bottom, yellow in middle, red at top
          let hue;
          if (rowFrac < 0.6) hue = 120; // green
          else if (rowFrac < 0.85) hue = 60 - (rowFrac - 0.6) * 200; // yellow
          else hue = 0; // red

          hue = (hue + hueOffset * 3) % 360;
          const light = 35 + val * 30 + beatPulse * 10;
          const alpha = val * 0.9;

          ctx.fillStyle = `hsla(${hue}, 80%, ${light}%, ${alpha})`;

          // Rounded rect
          const radius = 2;
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + cellW - radius, y);
          ctx.quadraticCurveTo(x + cellW, y, x + cellW, y + radius);
          ctx.lineTo(x + cellW, y + cellH - radius);
          ctx.quadraticCurveTo(x + cellW, y + cellH, x + cellW - radius, y + cellH);
          ctx.lineTo(x + radius, y + cellH);
          ctx.quadraticCurveTo(x, y + cellH, x, y + cellH - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.fill();

          // Glow for bright cells
          if (val > 0.6) {
            ctx.shadowColor = `hsla(${hue}, 90%, 60%, 0.5)`;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    },

    destroy() {
      for (let r = 0; r < ROWS; r++) grid[r].fill(0);
    },
  };
}
