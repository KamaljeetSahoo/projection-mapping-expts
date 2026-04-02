export function createKaleidoscope() {
  let time = 0;
  let beatPulse = 0;
  let hueOffset = 0;

  const SEGMENTS = 8;

  return {
    name: 'Kaleidoscope',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      beatPulse = 0;
      hueOffset = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.88)');

      const freq = audio.getFrequencyData();
      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.9;

      time += dt * 0.0008 * (1 + bass);
      hueOffset += dt * 0.008;

      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.min(width, height) * 0.45;
      const segAngle = (Math.PI * 2) / SEGMENTS;

      ctx.save();
      ctx.translate(cx, cy);

      for (let seg = 0; seg < SEGMENTS; seg++) {
        ctx.save();
        ctx.rotate(seg * segAngle);
        if (seg % 2 === 1) {
          ctx.scale(1, -1);
        }

        // Draw shapes driven by frequency
        const shapes = 12;
        for (let s = 0; s < shapes; s++) {
          if (!freq || !freq.length) continue;

          const freqIdx = Math.floor((s / shapes) * freq.length * 0.3);
          const val = freq[freqIdx] / 255;

          const dist = (s / shapes) * maxR * (0.5 + val * 0.5);
          const angle = time * (1 + s * 0.1) + s * 0.5;
          const x = Math.cos(angle) * dist * 0.5;
          const y = Math.sin(angle) * dist;

          const shapeSize = 5 + val * 30 + beatPulse * 10;
          const hue = (hueOffset + s * 30 + val * 60) % 360;
          const sat = 70 + mid * 25;
          const light = 40 + val * 35;
          const alpha = 0.3 + val * 0.5;

          // Outer glow
          const glow = ctx.createRadialGradient(x, y, 0, x, y, shapeSize * 1.5);
          glow.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.4})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(x - shapeSize * 2, y - shapeSize * 2, shapeSize * 4, shapeSize * 4);

          // Core shape
          ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
          ctx.beginPath();
          const sides = 3 + (s % 3);
          for (let v = 0; v <= sides; v++) {
            const a = (v / sides) * Math.PI * 2 + time * 0.5;
            const px = x + Math.cos(a) * shapeSize * 0.4;
            const py = y + Math.sin(a) * shapeSize * 0.4;
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.fill();

          // Connecting lines
          if (s > 0) {
            const prevFreqIdx = Math.floor(((s - 1) / shapes) * freq.length * 0.3);
            const prevVal = freq[prevFreqIdx] / 255;
            const prevDist = ((s - 1) / shapes) * maxR * (0.5 + prevVal * 0.5);
            const prevAngle = time * (1 + (s - 1) * 0.1) + (s - 1) * 0.5;
            const px = Math.cos(prevAngle) * prevDist * 0.5;
            const py = Math.sin(prevAngle) * prevDist;

            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha * 0.3})`;
            ctx.lineWidth = 0.5 + val;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      ctx.restore();
    },

    destroy() {},
  };
}
