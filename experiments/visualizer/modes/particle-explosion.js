export function createParticleExplosion() {
  const MAX_PARTICLES = 600;
  let particles = [];
  let rockets = [];
  let beatPulse = 0;
  let hueOffset = 0;
  let time = 0;

  function spawnRocket(width, height, energy) {
    const launchX = width * (0.15 + Math.random() * 0.7);
    rockets.push({
      x: launchX,
      y: height + 10,
      targetY: height * (0.15 + Math.random() * 0.35),
      vx: (Math.random() - 0.5) * 2,
      vy: -(4 + energy * 6),
      hue: (hueOffset + Math.random() * 120) % 360,
      energy,
      trail: [],
    });
  }

  function explode(x, y, hue, energy) {
    // Main burst — large outward ring
    const count = Math.floor(25 + energy * 40);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 1.5 + Math.random() * 4 * energy;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.006 + Math.random() * 0.008,
        size: 2.5 + Math.random() * 3,
        hue: (hue + Math.random() * 30 - 15) % 360,
        type: 'burst',
        sparkle: Math.random() > 0.6,
      });
    }

    // Inner sparkle ring (smaller, faster decay)
    const sparkleCount = Math.floor(10 + energy * 15);
    for (let i = 0; i < sparkleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.01,
        size: 1 + Math.random() * 1.5,
        hue: (hue + 40) % 360,
        type: 'sparkle',
        sparkle: true,
      });
    }

    if (particles.length > MAX_PARTICLES) {
      particles = particles.slice(-MAX_PARTICLES);
    }
  }

  return {
    name: 'Fireworks',

    init(canvas) {
      canvas.clear('#000');
      particles = [];
      rockets = [];
      beatPulse = 0;
      hueOffset = 0;
      time = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.fadeOut(0.06);

      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();
      const overall = audio.getOverall();

      time += dt * 0.001;
      hueOffset += dt * 0.012;

      // Launch rockets on beats
      if (beat) {
        beatPulse = 1;
        const rocketCount = 1 + Math.floor(bass * 3);
        for (let r = 0; r < rocketCount; r++) {
          spawnRocket(width, height, bass + 0.3);
        }
      }
      beatPulse *= 0.93;

      // Ambient rockets on sustained energy
      if (overall > 0.08 && Math.random() < overall * 0.06) {
        spawnRocket(width, height, overall * 0.6);
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx * dt * 0.08;
        r.y += r.vy * dt * 0.08;
        r.vy += 0.01 * dt * 0.08; // slight gravity

        // Trail
        r.trail.push({ x: r.x, y: r.y, life: 1 });
        if (r.trail.length > 12) r.trail.shift();

        // Draw trail
        for (let t = 0; t < r.trail.length; t++) {
          const tp = r.trail[t];
          tp.life -= 0.08;
          if (tp.life > 0) {
            const tAlpha = tp.life * 0.6;
            ctx.fillStyle = `hsla(${r.hue}, 80%, 70%, ${tAlpha})`;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, 1.5 * tp.life, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Rocket head
        ctx.fillStyle = `hsla(${r.hue}, 90%, 80%, 0.9)`;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Explode when reaching target height
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.hue, r.energy);
          rockets.splice(i, 1);
        }
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Gravity (downward pull — fireworks fall)
        p.vy += 0.003 * dt * 0.08;

        // Air resistance
        p.vx *= 0.997;
        p.vy *= 0.997;

        p.x += p.vx * dt * 0.1;
        p.y += p.vy * dt * 0.1;
        p.life -= p.decay * dt * 0.06;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = p.life * (p.sparkle ? (0.5 + Math.sin(time * 20 + i) * 0.5) : 0.8);
        const size = p.size * (0.3 + p.life * 0.7);
        const sat = 75 + mid * 20;
        const light = p.type === 'sparkle' ? 70 + treble * 20 : 50 + p.life * 20;

        if (p.type === 'sparkle') {
          // Bright dots
          ctx.fillStyle = `hsla(${p.hue}, ${sat}%, ${light}%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Glowing streaks — draw a short line from velocity
          const tailLen = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 3;
          const tailX = p.x - (p.vx / (tailLen + 0.1)) * tailLen;
          const tailY = p.y - (p.vy / (tailLen + 0.1)) * tailLen;

          ctx.strokeStyle = `hsla(${p.hue}, ${sat}%, ${light}%, ${alpha})`;
          ctx.lineWidth = size * 0.7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          // Bright head
          ctx.fillStyle = `hsla(${p.hue}, ${sat}%, ${light + 15}%, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Flash on explosion
      if (beatPulse > 0.7) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(beatPulse - 0.7) * 0.06})`;
        ctx.fillRect(0, 0, width, height);
      }
    },

    destroy() {
      particles = [];
      rockets = [];
    },
  };
}
