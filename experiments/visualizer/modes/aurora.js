import { createNoise } from '../../art/utils/noise.js';

export function createAurora() {
  const noise = createNoise(77);
  let time = 0;
  let beatPulse = 0;

  const CURTAIN_COUNT = 5;

  return {
    name: 'Aurora Borealis',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      beatPulse = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.93)');

      const freq = audio.getFrequencyData();
      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.92;

      time += dt * 0.0004;

      // Aurora curtains
      for (let c = 0; c < CURTAIN_COUNT; c++) {
        const curtainFrac = c / CURTAIN_COUNT;
        const baseY = height * (0.15 + curtainFrac * 0.2);

        // Band energy
        let energy = 0;
        if (freq && freq.length) {
          const bandStart = Math.floor(curtainFrac * freq.length * 0.3);
          const bandSize = Math.floor(freq.length * 0.3 / CURTAIN_COUNT);
          let sum = 0;
          for (let b = bandStart; b < bandStart + bandSize && b < freq.length; b++) sum += freq[b];
          energy = sum / bandSize / 255;
        }

        // Aurora colors: greens, cyans, purples
        const hues = [120, 160, 140, 280, 200];
        const hue = hues[c % hues.length] + energy * 30;

        const curtainHeight = 80 + energy * 200 + beatPulse * 60;
        const resolution = 8;
        const points = [];

        for (let x = -20; x <= width + 20; x += resolution) {
          const nx = x / width;
          const n1 = noise.noise3D(nx * 2 + c * 3, time * (0.8 + c * 0.15), c * 7);
          const n2 = noise.noise3D(nx * 4 + c * 3, time * (1.2 + c * 0.1), c * 7 + 3);
          const n3 = noise.noise3D(nx * 1.5, time * 0.5, c * 7 + 10);

          // Frequency modulation
          let freqMod = 0;
          if (freq && freq.length) {
            const fIdx = Math.floor(nx * freq.length * 0.3);
            freqMod = (freq[fIdx] || 0) / 255;
          }

          const waveY = baseY + n1 * 40 + n2 * 20;
          const intensity = Math.max(0, 0.5 + n3 * 0.5) * (0.3 + energy * 0.7 + freqMod * 0.3);

          points.push({ x, y: waveY, intensity });
        }

        // Draw vertical curtain strips
        for (let i = 0; i < points.length - 1; i++) {
          const p = points[i];
          const stripHeight = curtainHeight * p.intensity;

          const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + stripHeight);
          const sat = 60 + energy * 30;
          const light = 40 + energy * 25;
          const alpha = p.intensity * (0.06 + energy * 0.08);

          grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 15}%, ${alpha * 1.5})`);
          grad.addColorStop(0.3, `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`);
          grad.addColorStop(0.7, `hsla(${(hue + 40) % 360}, ${sat - 10}%, ${light - 10}%, ${alpha * 0.5})`);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.fillRect(p.x, p.y, resolution + 1, stripHeight);
        }

        // Top edge glow
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
        }
        ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.15 + energy * 0.3})`;
        ctx.lineWidth = 2 + energy * 3;
        ctx.stroke();

        // Wider glow
        ctx.strokeStyle = `hsla(${hue}, 70%, 55%, ${0.04 + energy * 0.06})`;
        ctx.lineWidth = 10 + energy * 15;
        ctx.stroke();
      }

      // Stars in the background
      if (beatPulse > 0.5) {
        for (let i = 0; i < 3; i++) {
          const sx = Math.random() * width;
          const sy = Math.random() * height * 0.4;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },

    destroy() {},
  };
}
