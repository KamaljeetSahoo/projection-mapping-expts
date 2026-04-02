export function createSpectrumBars() {
  const BAR_COUNT = 64;
  let smoothedHeights = new Float32Array(BAR_COUNT);
  let peakHeights = new Float32Array(BAR_COUNT);
  let beatFlash = 0;

  return {
    name: 'Spectrum Bars',

    init(canvas) {
      canvas.clear('#000');
      smoothedHeights.fill(0);
      peakHeights.fill(0);
      beatFlash = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('#000');

      const freq = audio.getFrequencyData();
      if (!freq || !freq.length) return;

      const bass = audio.getBass();
      const beat = audio.isBeat();
      if (beat) beatFlash = 1;
      beatFlash *= 0.92;

      const gap = 3;
      const totalGaps = (BAR_COUNT - 1) * gap;
      const barWidth = (width - totalGaps) / BAR_COUNT;
      const maxBarHeight = height * 0.85;

      // Map frequency bins to bars (logarithmic scale for more bass detail)
      for (let i = 0; i < BAR_COUNT; i++) {
        // Logarithmic mapping: more bins for low frequencies
        const startFrac = Math.pow(i / BAR_COUNT, 1.5);
        const endFrac = Math.pow((i + 1) / BAR_COUNT, 1.5);
        const startBin = Math.floor(startFrac * freq.length * 0.5);
        const endBin = Math.max(startBin + 1, Math.floor(endFrac * freq.length * 0.5));

        let sum = 0;
        for (let b = startBin; b < endBin; b++) sum += freq[b];
        const avg = sum / (endBin - startBin) / 255;

        const targetHeight = avg * maxBarHeight;
        // Smooth rise, slower fall
        if (targetHeight > smoothedHeights[i]) {
          smoothedHeights[i] += (targetHeight - smoothedHeights[i]) * 0.4;
        } else {
          smoothedHeights[i] += (targetHeight - smoothedHeights[i]) * 0.08;
        }

        // Peak indicator (falls slowly)
        if (smoothedHeights[i] > peakHeights[i]) {
          peakHeights[i] = smoothedHeights[i];
        } else {
          peakHeights[i] -= dt * 0.05;
          if (peakHeights[i] < 0) peakHeights[i] = 0;
        }
      }

      // Draw bars
      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (barWidth + gap);
        const h = smoothedHeights[i];
        const y = height - h;

        // Color gradient: warm bass → cool treble
        const hue = 0 + (i / BAR_COUNT) * 240; // red → blue
        const sat = 75 + beatFlash * 20;
        const light = 45 + (h / maxBarHeight) * 20 + beatFlash * 15;

        // Bar gradient (brighter at top)
        const barGrad = ctx.createLinearGradient(x, y, x, height);
        barGrad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 10}%, 0.95)`);
        barGrad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light - 15}%, 0.6)`);

        ctx.fillStyle = barGrad;

        // Rounded top
        const radius = Math.min(barWidth / 2, 4);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, height);
        ctx.lineTo(x, height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();

        // Peak line
        const peakY = height - peakHeights[i];
        if (peakHeights[i] > 2) {
          ctx.fillStyle = `hsla(${hue}, 90%, 75%, 0.8)`;
          ctx.fillRect(x, peakY - 2, barWidth, 2);
        }
      }

      // Bottom reflection (subtle)
      ctx.globalAlpha = 0.08;
      ctx.scale(1, -0.3);
      ctx.translate(0, -height * (1 / 0.3) - height);
      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (barWidth + gap);
        const h = smoothedHeights[i];
        const y = height - h;
        const hue = 0 + (i / BAR_COUNT) * 240;
        ctx.fillStyle = `hsl(${hue}, 70%, 40%)`;
        ctx.fillRect(x, y, barWidth, h);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    },

    destroy() {
      smoothedHeights = new Float32Array(BAR_COUNT);
      peakHeights = new Float32Array(BAR_COUNT);
    },
  };
}
