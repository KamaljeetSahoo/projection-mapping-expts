import { createNoise } from '../utils/noise.js';

export function createFlowField() {
  const noise = createNoise(Math.random() * 10000);
  const MAX_PARTICLES = 5000;
  let particles = [];
  let time = 0;
  let hueBase = Math.random() * 360;

  function initParticles(width, height) {
    // Scale to viewport but cap at MAX_PARTICLES for performance
    const count = Math.min(MAX_PARTICLES, Math.floor(width * height * 0.003));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        prevX: 0,
        prevY: 0,
        speed: 0.5 + Math.random() * 1.5,
        life: Math.random(),
      });
    }
    for (const p of particles) {
      p.prevX = p.x;
      p.prevY = p.y;
    }
  }

  let lastWidth = 0, lastHeight = 0;

  return {
    name: 'Flow Field',

    init(canvas) {
      lastWidth = canvas.width;
      lastHeight = canvas.height;
      initParticles(canvas.width, canvas.height);
      canvas.clear('#000');
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;

      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        initParticles(width, height);
      }

      canvas.fadeOut(0.012);

      time += dt * 0.0003;
      hueBase += dt * 0.003;

      const noiseScale = 0.002;

      // Batch particles by quantized hue (reduces strokeStyle changes)
      // Each particle still gets its own line segment but we group by color
      const HUE_BUCKETS = 36; // 10-degree buckets
      const buckets = new Array(HUE_BUCKETS);

      for (const p of particles) {
        p.prevX = p.x;
        p.prevY = p.y;

        const angle = noise.noise3D(p.x * noiseScale, p.y * noiseScale, time) * Math.PI * 4;
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;

        const wrapped = p.x < 0 || p.x > width || p.y < 0 || p.y > height;
        if (p.x < 0) p.x += width;
        if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height;
        if (p.y > height) p.y -= height;

        if (!wrapped) {
          const hue = ((hueBase + angle * 30 + p.y * 0.05) % 360 + 360) % 360;
          const bucketIdx = Math.floor(hue / 10) % HUE_BUCKETS;
          if (!buckets[bucketIdx]) buckets[bucketIdx] = [];
          buckets[bucketIdx].push(p);
        }

        p.life -= dt * 0.00005;
        if (p.life <= 0) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.prevX = p.x;
          p.prevY = p.y;
          p.life = 1;
          p.speed = 0.5 + Math.random() * 1.5;
        }
      }

      // Draw batched by color bucket — far fewer state changes
      for (let b = 0; b < HUE_BUCKETS; b++) {
        const bucket = buckets[b];
        if (!bucket) continue;

        const hue = b * 10 + 5;
        ctx.strokeStyle = `hsla(${hue}, 70%, 55%, 0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const p of bucket) {
          ctx.moveTo(p.prevX, p.prevY);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
    },

    destroy() {
      particles = [];
    },
  };
}
