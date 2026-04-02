import { createNoise } from '../../art/utils/noise.js';

export function createLiquidWave() {
  const noise = createNoise(42);
  let time = 0;
  let beatPulse = 0;
  let hueOffset = 0;

  const WAVE_COUNT = 6;

  return {
    name: 'Liquid Waves',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      beatPulse = 0;
      hueOffset = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.92)');

      const freq = audio.getFrequencyData();
      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.88;

      time += dt * 0.0006;
      hueOffset += dt * 0.006;

      for (let w = 0; w < WAVE_COUNT; w++) {
        const waveFrac = w / WAVE_COUNT;
        const baseY = height * (0.2 + waveFrac * 0.6);

        // Frequency band for this wave
        const bandStart = Math.floor(waveFrac * 200);
        const bandEnd = Math.floor((waveFrac + 1 / WAVE_COUNT) * 200);
        let bandEnergy = 0;
        if (freq && freq.length) {
          let sum = 0;
          for (let b = bandStart; b < bandEnd && b < freq.length; b++) sum += freq[b];
          bandEnergy = sum / (bandEnd - bandStart) / 255;
        }

        const amplitude = 30 + bandEnergy * 80 + beatPulse * 20;
        const hue = (hueOffset + waveFrac * 50 + bandEnergy * 40) % 360;

        const points = [];
        const resolution = 3;
        for (let x = -10; x <= width + 10; x += resolution) {
          const nx = x / width;
          const n1 = noise.noise3D(nx * 3 + w * 0.7, time * (1.5 + w * 0.3), w * 10);
          const n2 = noise.noise3D(nx * 6 + w * 0.7, time * (2 + w * 0.2), w * 10 + 5);

          // Layer frequencies from audio
          let freqMod = 0;
          if (freq && freq.length) {
            const fIdx = Math.floor(nx * freq.length * 0.3);
            freqMod = (freq[fIdx] || 0) / 255 * 20;
          }

          const y = baseY + n1 * amplitude + n2 * amplitude * 0.3 + freqMod;
          points.push({ x, y });
        }

        // Fill below wave
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const cpx = (prev.x + curr.x) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
        }
        ctx.lineTo(width + 10, height + 10);
        ctx.lineTo(-10, height + 10);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - amplitude, 0, baseY + amplitude + 100);
        const sat = 65 + bandEnergy * 30;
        const light = 35 + bandEnergy * 20;
        const alpha = 0.12 + bandEnergy * 0.15;
        grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`);
        grad.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light - 10}%, ${alpha * 0.5})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();

        // Wave line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const cpx = (prev.x + curr.x) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, cpx, (prev.y + curr.y) / 2);
        }
        ctx.strokeStyle = `hsla(${hue}, ${sat + 10}%, ${light + 15}%, ${0.4 + bandEnergy * 0.4})`;
        ctx.lineWidth = 1.5 + bandEnergy * 2;
        ctx.stroke();
      }
    },

    destroy() {},
  };
}
