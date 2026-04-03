export function createRepel() {
  let time = 0;
  const PARTICLE_COUNT = 300;
  let particles = [];
  let hueOffset = 0;

  function initParticles(width, height) {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        homeX: Math.random() * width,
        homeY: Math.random() * height,
        vx: 0,
        vy: 0,
        size: 2 + Math.random() * 4,
        hue: Math.random() * 360,
      });
    }
  }

  let lastW = 0, lastH = 0;

  return {
    name: 'Particle Repel',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      hueOffset = 0;
      lastW = canvas.width;
      lastH = canvas.height;
      initParticles(canvas.width, canvas.height);
    },

    update(canvas, dt, motion) {
      const { ctx, width, height } = canvas;
      canvas.clear('rgba(0, 0, 0, 0.88)');

      if (width !== lastW || height !== lastH) {
        lastW = width; lastH = height;
        initParticles(width, height);
      }

      time += dt * 0.001;
      hueOffset += dt * 0.005;

      const grid = motion.getGrid();
      const cols = motion.getCols();
      const rows = motion.getRows();

      const dtSec = dt * 0.001;

      for (const p of particles) {
        // Find which grid cell this particle is in
        const gc = Math.floor((1 - p.x / width) * cols); // mirror
        const gr = Math.floor((p.y / height) * rows);

        if (gc >= 0 && gc < cols && gr >= 0 && gr < rows) {
          const motionVal = grid[gr][gc];

          if (motionVal > 0.15) {
            // Repel from motion — push away from grid cell center
            const cellCX = (1 - (gc + 0.5) / cols) * width;
            const cellCY = ((gr + 0.5) / rows) * height;
            const dx = p.x - cellCX;
            const dy = p.y - cellCY;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const force = motionVal * 800 / dist;
            p.vx += (dx / dist) * force * dtSec;
            p.vy += (dy / dist) * force * dtSec;
          }
        }

        // Spring back to home position
        const homeForce = 0.5;
        p.vx += (p.homeX - p.x) * homeForce * dtSec;
        p.vy += (p.homeY - p.y) * homeForce * dtSec;

        // Damping
        p.vx *= 0.95;
        p.vy *= 0.95;

        p.x += p.vx * dtSec * 60;
        p.y += p.vy * dtSec * 60;

        // Keep in bounds
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));

        // Draw
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const excitement = Math.min(1, speed * 0.01);
        const hue = (p.hue + hueOffset + excitement * 60) % 360;
        const alpha = 0.4 + excitement * 0.5;
        const size = p.size * (1 + excitement * 0.5);

        ctx.fillStyle = `hsla(${hue}, ${60 + excitement * 30}%, ${45 + excitement * 25}%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Glow when excited
        if (excitement > 0.3) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
          glow.addColorStop(0, `hsla(${hue}, 80%, 60%, ${excitement * 0.15})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(p.x - size * 4, p.y - size * 4, size * 8, size * 8);
        }
      }
    },

    destroy() { particles = []; },
  };
}
