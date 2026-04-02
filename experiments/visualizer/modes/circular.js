export function createCircular() {
  let smoothedFreq = null;
  let beatPulse = 0;
  let rotation = 0;
  let hueOffset = 0;

  const SEGMENTS = 128;

  return {
    name: 'Circular Spectrum',

    init(canvas) {
      canvas.clear('#000');
      smoothedFreq = new Float32Array(SEGMENTS);
      beatPulse = 0;
      rotation = 0;
      hueOffset = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.88)');

      const freq = audio.getFrequencyData();
      if (!freq || !freq.length) return;

      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();

      if (beat) beatPulse = 1;
      beatPulse *= 0.9;

      rotation += dt * 0.00008 * (1 + bass * 2);
      hueOffset += dt * 0.01;

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.15;
      const maxExtend = Math.min(width, height) * 0.32;

      // Map freq to segments
      for (let i = 0; i < SEGMENTS; i++) {
        const frac = Math.pow(i / SEGMENTS, 1.3);
        const bin = Math.floor(frac * freq.length * 0.4);
        const val = freq[bin] / 255;
        const target = val;
        if (target > smoothedFreq[i]) {
          smoothedFreq[i] += (target - smoothedFreq[i]) * 0.35;
        } else {
          smoothedFreq[i] += (target - smoothedFreq[i]) * 0.1;
        }
      }

      // Draw outer bars radiating from circle
      const pulseRadius = baseRadius * (1 + beatPulse * 0.15);

      for (let i = 0; i < SEGMENTS; i++) {
        const angle = (i / SEGMENTS) * Math.PI * 2 + rotation;
        const val = smoothedFreq[i];
        const barLen = val * maxExtend;

        const innerR = pulseRadius;
        const outerR = pulseRadius + barLen;

        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;

        const hue = (hueOffset + (i / SEGMENTS) * 300) % 360;
        const sat = 70 + val * 25;
        const light = 40 + val * 30;
        const alpha = 0.5 + val * 0.4;

        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
        ctx.lineWidth = Math.max(1, (Math.PI * 2 * innerR) / SEGMENTS * 0.7);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Mirror on inside (shorter, dimmer)
      for (let i = 0; i < SEGMENTS; i++) {
        const angle = (i / SEGMENTS) * Math.PI * 2 + rotation;
        const val = smoothedFreq[i];
        const barLen = val * maxExtend * 0.3;

        const outerR = pulseRadius;
        const innerR = pulseRadius - barLen;

        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * outerR;
        const y2 = cy + Math.sin(angle) * outerR;

        const hue = (hueOffset + (i / SEGMENTS) * 300) % 360;
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${0.2 + val * 0.2})`;
        ctx.lineWidth = Math.max(1, (Math.PI * 2 * outerR) / SEGMENTS * 0.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Center glow
      const glowRadius = pulseRadius * (1.2 + bass * 0.5);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      const glowHue = (hueOffset + 180) % 360;
      glow.addColorStop(0, `hsla(${glowHue}, 80%, 55%, ${0.15 + beatPulse * 0.15})`);
      glow.addColorStop(0.5, `hsla(${glowHue}, 60%, 40%, ${0.05 + beatPulse * 0.05})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Outer ambient ring on beat
      if (beatPulse > 0.3) {
        ctx.strokeStyle = `hsla(${glowHue}, 70%, 60%, ${beatPulse * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius + maxExtend * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    },

    destroy() {
      smoothedFreq = null;
    },
  };
}
