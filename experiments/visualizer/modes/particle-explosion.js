export function createParticleExplosion() {
  const MAX_PARTICLES = 400;
  let particles = [];
  let beatPulse = 0;
  let hueOffset = 0;
  let time = 0;

  function spawnBurst(cx, cy, count, energy) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6 * energy;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.003 + Math.random() * 0.005,
        size: 2 + Math.random() * 3,
        hue: (hueOffset + Math.random() * 60) % 360,
      });
    }
    // Cap total particles
    if (particles.length > MAX_PARTICLES) {
      particles = particles.slice(-MAX_PARTICLES);
    }
  }

  return {
    name: 'Particle Explosion',

    init(canvas) {
      canvas.clear('#000');
      particles = [];
      beatPulse = 0;
      hueOffset = 0;
      time = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.fadeOut(0.04);

      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();
      const overall = audio.getOverall();

      time += dt * 0.001;
      hueOffset += dt * 0.015;

      if (beat) {
        beatPulse = 1;
        const burstCount = Math.floor(15 + bass * 30);
        spawnBurst(width / 2, height / 2, burstCount, bass + 0.3);
      }
      beatPulse *= 0.93;

      // Continuous ambient spawn based on overall energy
      if (overall > 0.1 && Math.random() < overall * 0.3) {
        spawnBurst(width / 2, height / 2, 2, overall * 0.5);
      }

      const cx = width / 2;
      const cy = height / 2;

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Gravity toward center (gentle pull back)
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          const pull = 0.015 * (1 - p.life * 0.5);
          p.vx += (dx / dist) * pull;
          p.vy += (dy / dist) * pull;
        }

        // Friction
        p.vx *= 0.995;
        p.vy *= 0.995;

        p.x += p.vx * dt * 0.1;
        p.y += p.vy * dt * 0.1;
        p.life -= p.decay * dt * 0.06;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle with glow
        const alpha = p.life * 0.8;
        const size = p.size * (0.5 + p.life * 0.5);
        const sat = 70 + mid * 25;
        const light = 50 + treble * 20;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        glow.addColorStop(0, `hsla(${p.hue}, ${sat}%, ${light}%, ${alpha})`);
        glow.addColorStop(0.4, `hsla(${p.hue}, ${sat}%, ${light - 10}%, ${alpha * 0.3})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - size * 3, p.y - size * 3, size * 6, size * 6);
      }

      // Central glow on beat
      if (beatPulse > 0.1) {
        const glowR = 80 + beatPulse * 150;
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        const hue = hueOffset % 360;
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, ${beatPulse * 0.25})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
      }
    },

    destroy() {
      particles = [];
    },
  };
}
