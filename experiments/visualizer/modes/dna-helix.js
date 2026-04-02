export function createDnaHelix() {
  let time = 0;
  let beatPulse = 0;
  let hueOffset = 0;

  const POINTS_PER_STRAND = 80;
  const PARTICLE_COUNT = 60;
  let particles = [];

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        t: Math.random(), // position along helix (0-1)
        speed: 0.0002 + Math.random() * 0.0003,
        strand: Math.random() > 0.5 ? 0 : 1,
        size: 1 + Math.random() * 2,
      });
    }
  }

  return {
    name: 'DNA Helix',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      beatPulse = 0;
      hueOffset = 0;
      initParticles();
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.88)');

      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();
      const freq = audio.getFrequencyData();

      if (beat) beatPulse = 1;
      beatPulse *= 0.92;

      time += dt * 0.001 * (1 + bass * 0.5);
      hueOffset += dt * 0.008;

      const cx = width / 2;
      const cy = height / 2;
      const helixLength = height * 0.8;
      const helixRadius = width * 0.12 * (1 + beatPulse * 0.15);
      const startY = (height - helixLength) / 2;
      const twists = 3 + mid * 2;

      // Draw connecting rungs first (behind strands)
      const rungCount = 30;
      for (let i = 0; i < rungCount; i++) {
        const t = i / rungCount;
        const y = startY + t * helixLength;
        const angle = t * Math.PI * 2 * twists + time;

        // Frequency-modulated radius
        const freqIdx = Math.floor(t * freq.length * 0.3);
        const freqVal = freq ? (freq[freqIdx] || 0) / 255 : 0;
        const r = helixRadius * (1 + freqVal * 0.3);

        const x1 = cx + Math.cos(angle) * r;
        const x2 = cx + Math.cos(angle + Math.PI) * r;

        const alpha = 0.1 + freqVal * 0.25;
        const hue = (hueOffset + t * 120) % 360;
        ctx.strokeStyle = `hsla(${hue}, 50%, 45%, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      }

      // Draw two strands
      for (let strand = 0; strand < 2; strand++) {
        const phaseOffset = strand * Math.PI;
        const hueBase = strand === 0 ? hueOffset : hueOffset + 160;

        ctx.beginPath();
        for (let i = 0; i <= POINTS_PER_STRAND; i++) {
          const t = i / POINTS_PER_STRAND;
          const y = startY + t * helixLength;
          const angle = t * Math.PI * 2 * twists + time + phaseOffset;

          const freqIdx = Math.floor(t * freq.length * 0.3);
          const freqVal = freq ? (freq[freqIdx] || 0) / 255 : 0;
          const r = helixRadius * (1 + freqVal * 0.3);
          const x = cx + Math.cos(angle) * r;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const hue = hueBase % 360;
        ctx.strokeStyle = `hsla(${hue}, 75%, 55%, 0.8)`;
        ctx.lineWidth = 2.5 + bass * 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Glow pass
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.2)`;
        ctx.lineWidth = 8 + bass * 6;
        ctx.stroke();
      }

      // Floating particles along strands
      for (const p of particles) {
        p.t += p.speed * dt;
        if (p.t > 1) p.t -= 1;

        const y = startY + p.t * helixLength;
        const angle = p.t * Math.PI * 2 * twists + time + (p.strand * Math.PI);
        const freqIdx = Math.floor(p.t * freq.length * 0.3);
        const freqVal = freq ? (freq[freqIdx] || 0) / 255 : 0;
        const r = helixRadius * (1 + freqVal * 0.3);
        const x = cx + Math.cos(angle) * r;

        const hue = (hueOffset + p.t * 120 + p.strand * 160) % 360;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, p.size * (3 + freqVal * 4));
        glow.addColorStop(0, `hsla(${hue}, 90%, 70%, ${0.6 + freqVal * 0.3})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 15, y - 15, 30, 30);
      }
    },

    destroy() {
      particles = [];
    },
  };
}
