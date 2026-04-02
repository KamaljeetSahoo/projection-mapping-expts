export function createMountainTerrain() {
  let time = 0;
  let beatPulse = 0;
  let hueOffset = 0;

  const ROWS = 40;
  const COLS = 80;

  // Store previous heights for smooth interpolation
  let heightMap = [];
  for (let r = 0; r < ROWS; r++) {
    heightMap.push(new Float32Array(COLS));
  }

  return {
    name: 'Mountain Terrain',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      beatPulse = 0;
      hueOffset = 0;
      for (let r = 0; r < ROWS; r++) heightMap[r].fill(0);
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('#000');

      const freq = audio.getFrequencyData();
      const bass = audio.getBass();
      const mid = audio.getMid();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.9;

      time += dt * 0.0008;
      hueOffset += dt * 0.006;

      // Scroll terrain: shift rows back, newest row at front
      for (let r = ROWS - 1; r > 0; r--) {
        for (let c = 0; c < COLS; c++) {
          heightMap[r][c] += (heightMap[r - 1][c] - heightMap[r][c]) * 0.3;
        }
      }

      // Front row from frequency data
      if (freq && freq.length) {
        for (let c = 0; c < COLS; c++) {
          const freqIdx = Math.floor((c / COLS) * freq.length * 0.5);
          const val = freq[freqIdx] / 255;
          heightMap[0][c] += (val - heightMap[0][c]) * 0.5;
        }
      }

      // 3D projection parameters
      const vanishY = height * 0.25;
      const baseY = height * 0.95;
      const horizon = vanishY;
      const maxHeight = height * 0.4;

      // Draw rows back to front (painter's algorithm)
      for (let r = ROWS - 1; r >= 0; r--) {
        const rowFrac = r / ROWS;
        const perspY = horizon + (baseY - horizon) * (1 - rowFrac);
        const perspScale = 1 - rowFrac * 0.7;
        const rowWidth = width * perspScale;
        const startX = (width - rowWidth) / 2;

        // Build path for this row
        const points = [];
        for (let c = 0; c < COLS; c++) {
          const colFrac = c / (COLS - 1);
          const x = startX + colFrac * rowWidth;
          const h = heightMap[r][c] * maxHeight * perspScale * (1 + beatPulse * 0.2);
          const y = perspY - h;
          points.push({ x, y });
        }

        // Fill below the line (terrain body)
        const depth = 1 - rowFrac;
        const hue = (hueOffset + rowFrac * 60 + bass * 40) % 360;
        const sat = 60 + mid * 30;
        const light = 15 + depth * 25 + beatPulse * 10;
        const alpha = 0.3 + depth * 0.5;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, perspY + 5);
        ctx.lineTo(points[0].x, perspY + 5);
        ctx.closePath();
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light * 0.4}%, ${alpha * 0.5})`;
        ctx.fill();

        // Wireframe line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.lineWidth = 0.8 + depth * 1.2;
        ctx.stroke();
      }

      // Ambient glow at horizon
      const glow = ctx.createLinearGradient(0, vanishY - 50, 0, vanishY + 100);
      const glowHue = (hueOffset + 180) % 360;
      glow.addColorStop(0, 'transparent');
      glow.addColorStop(0.5, `hsla(${glowHue}, 60%, 40%, ${0.05 + beatPulse * 0.08})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, vanishY - 50, width, 150);
    },

    destroy() {},
  };
}
