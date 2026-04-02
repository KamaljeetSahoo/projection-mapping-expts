export function createNeonRings() {
  let time = 0;
  let beatPulse = 0;
  let hueOffset = 0;

  const RING_COUNT = 8;
  let ringEnergies = new Float32Array(RING_COUNT);

  return {
    name: 'Neon Rings',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      beatPulse = 0;
      hueOffset = 0;
      ringEnergies.fill(0);
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.9)');

      const freq = audio.getFrequencyData();
      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.88;

      time += dt * 0.001;
      hueOffset += dt * 0.01;

      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.min(width, height) * 0.42;
      const minRadius = maxRadius * 0.08;

      // Map frequency bands to rings (log scale)
      if (freq && freq.length) {
        for (let i = 0; i < RING_COUNT; i++) {
          const startFrac = Math.pow(i / RING_COUNT, 1.8);
          const endFrac = Math.pow((i + 1) / RING_COUNT, 1.8);
          const startBin = Math.floor(startFrac * freq.length * 0.4);
          const endBin = Math.max(startBin + 1, Math.floor(endFrac * freq.length * 0.4));

          let sum = 0;
          for (let b = startBin; b < endBin; b++) sum += freq[b];
          const val = sum / (endBin - startBin) / 255;

          // Smooth
          ringEnergies[i] += (val - ringEnergies[i]) * 0.2;
        }
      }

      // Draw rings from outer to inner
      for (let i = RING_COUNT - 1; i >= 0; i--) {
        const ringFrac = i / (RING_COUNT - 1);
        const baseRadius = minRadius + (maxRadius - minRadius) * ringFrac;
        const energy = ringEnergies[i];

        // Ring radius pulses with its frequency band
        const radius = baseRadius * (1 + energy * 0.2 + beatPulse * 0.05);

        // Ring wobble
        const wobbleAmt = energy * 8;

        const hue = (hueOffset + ringFrac * 280) % 360;
        const sat = 75 + energy * 20;
        const light = 45 + energy * 30;

        // Glow layer (wide, dim)
        ctx.lineWidth = 6 + energy * 15;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${0.08 + energy * 0.12})`;
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 2) {
          const angle = (a / 180) * Math.PI;
          const wobble = Math.sin(angle * 3 + time * (2 + i * 0.3)) * wobbleAmt;
          const r = radius + wobble;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Core line (thin, bright)
        ctx.lineWidth = 1.5 + energy * 2;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 10}%, ${0.5 + energy * 0.4})`;
        ctx.beginPath();
        for (let a = 0; a <= 360; a += 2) {
          const angle = (a / 180) * Math.PI;
          const wobble = Math.sin(angle * 3 + time * (2 + i * 0.3)) * wobbleAmt;
          const r = radius + wobble;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Center dot
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, minRadius * 1.5);
      const centerHue = (hueOffset + 60) % 360;
      centerGlow.addColorStop(0, `hsla(${centerHue}, 90%, 70%, ${0.3 + bass * 0.4})`);
      centerGlow.addColorStop(0.5, `hsla(${centerHue}, 80%, 50%, ${0.1 + bass * 0.1})`);
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(cx - minRadius * 2, cy - minRadius * 2, minRadius * 4, minRadius * 4);
    },

    destroy() {
      ringEnergies = new Float32Array(RING_COUNT);
    },
  };
}
