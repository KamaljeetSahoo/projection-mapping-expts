import { createNoise } from '../../art/utils/noise.js';

export function createForest() {
  const noise = createNoise(33);
  let time = 0;

  const FIREFLY_COUNT = 30;
  let fireflies = [];

  function initFireflies(width, height) {
    fireflies = [];
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height * 0.3 + Math.random() * height * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        noiseOff: Math.random() * 1000,
      });
    }
  }

  let lastW = 0, lastH = 0;

  return {
    name: 'Enchanted Forest',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      lastW = canvas.width;
      lastH = canvas.height;
      initFireflies(canvas.width, canvas.height);
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      time += dt * 0.0004;

      if (width !== lastW || height !== lastH) {
        lastW = width; lastH = height;
        initFireflies(width, height);
      }

      // Night sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#060818');
      sky.addColorStop(0.3, '#0a1020');
      sky.addColorStop(0.6, '#0d1a15');
      sky.addColorStop(1, '#050a08');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Moon
      const moonX = width * 0.8;
      const moonY = height * 0.12;
      const moonR = Math.min(width, height) * 0.04;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 6);
      moonGlow.addColorStop(0, 'rgba(200, 210, 230, 0.15)');
      moonGlow.addColorStop(0.3, 'rgba(180, 200, 220, 0.04)');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(moonX - moonR * 6, moonY - moonR * 6, moonR * 12, moonR * 12);
      ctx.fillStyle = 'rgba(220, 225, 235, 0.85)';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // Tree silhouettes (large, few)
      const treePositions = [
        { x: 0.05, h: 0.7, w: 0.12 },
        { x: 0.2, h: 0.85, w: 0.1 },
        { x: 0.4, h: 0.65, w: 0.08 },
        { x: 0.6, h: 0.75, w: 0.11 },
        { x: 0.8, h: 0.8, w: 0.09 },
        { x: 0.92, h: 0.7, w: 0.1 },
      ];

      for (const tree of treePositions) {
        const tx = tree.x * width;
        const treeH = tree.h * height;
        const treeW = tree.w * width;
        const baseY = height;

        // Trunk
        ctx.fillStyle = '#0a0f0a';
        ctx.fillRect(tx + treeW * 0.4, baseY - treeH * 0.4, treeW * 0.15, treeH * 0.4);

        // Canopy (triangle layers)
        for (let layer = 0; layer < 3; layer++) {
          const layerY = baseY - treeH * (0.35 + layer * 0.22);
          const layerW = treeW * (1 - layer * 0.2);
          const layerH = treeH * 0.35;

          ctx.fillStyle = `rgba(8, ${15 + layer * 3}, 10, 0.95)`;
          ctx.beginPath();
          ctx.moveTo(tx + treeW * 0.5, layerY - layerH);
          ctx.lineTo(tx + treeW * 0.5 - layerW * 0.5, layerY);
          ctx.lineTo(tx + treeW * 0.5 + layerW * 0.5, layerY);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Ground fog
      for (let x = 0; x < width; x += 6) {
        const fogH = 40 + noise.noise2D(x * 0.005, time * 0.8) * 25;
        const fogAlpha = 0.03 + noise.noise2D(x * 0.01 + 50, time * 0.5) * 0.02;
        const fogY = height - fogH;
        const grad = ctx.createLinearGradient(x, fogY, x, height);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.4, `rgba(150, 180, 160, ${fogAlpha})`);
        grad.addColorStop(1, `rgba(120, 150, 140, ${fogAlpha * 0.5})`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, fogY, 6, fogH);
      }

      // Fireflies
      for (const f of fireflies) {
        f.phase += dt * 0.003;
        const nx = noise.noise2D(f.noiseOff, time * f.speed);
        const ny = noise.noise2D(f.noiseOff + 500, time * f.speed);
        const fx = f.x + nx * 60;
        const fy = f.y + ny * 40;

        const glow = Math.sin(f.phase) * 0.5 + 0.5;
        if (glow < 0.2) continue;

        const alpha = glow * 0.6;
        const glowR = f.size * (3 + glow * 5);

        const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowR);
        grad.addColorStop(0, `hsla(55, 90%, 70%, ${alpha})`);
        grad.addColorStop(0.3, `hsla(50, 80%, 55%, ${alpha * 0.3})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(fx - glowR, fy - glowR, glowR * 2, glowR * 2);

        // Core dot
        ctx.fillStyle = `hsla(55, 95%, 80%, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(fx, fy, f.size * 0.5 * glow, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    destroy() { fireflies = []; },
  };
}
