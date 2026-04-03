import { createNoise } from '../../art/utils/noise.js';

export function createUnderwater() {
  const noise = createNoise(55);
  let time = 0;

  const BUBBLE_COUNT = 20;
  let bubbles = [];

  function initBubbles(width, height) {
    bubbles = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: height + Math.random() * height,
        size: 5 + Math.random() * 25,
        speed: 0.3 + Math.random() * 0.8,
        wobble: Math.random() * Math.PI * 2,
      });
    }
  }

  let lastW = 0, lastH = 0;

  return {
    name: 'Underwater',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      lastW = canvas.width;
      lastH = canvas.height;
      initBubbles(canvas.width, canvas.height);
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      time += dt * 0.0005;

      if (width !== lastW || height !== lastH) {
        lastW = width; lastH = height;
        initBubbles(width, height);
      }

      // Deep ocean gradient
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, `hsla(200, 60%, ${8 + Math.sin(time) * 2}%, 1)`);
      bg.addColorStop(0.5, `hsla(210, 50%, ${5 + Math.sin(time * 0.7) * 1}%, 1)`);
      bg.addColorStop(1, '#010208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Light rays from surface
      const rayCount = 5;
      for (let i = 0; i < rayCount; i++) {
        const rx = width * (0.2 + (i / rayCount) * 0.6);
        const sway = noise.noise2D(i * 3, time * 0.5) * 80;

        ctx.save();
        ctx.globalAlpha = 0.03 + Math.sin(time + i) * 0.015;
        ctx.beginPath();
        ctx.moveTo(rx + sway - 40, 0);
        ctx.lineTo(rx + sway + 40, 0);
        ctx.lineTo(rx + sway + 200, height);
        ctx.lineTo(rx + sway - 200, height);
        ctx.closePath();
        ctx.fillStyle = `hsla(190, 70%, 60%, 1)`;
        ctx.fill();
        ctx.restore();
      }

      // Caustic light patterns on the "floor"
      const causticsY = height * 0.7;
      for (let x = 0; x < width; x += 8) {
        for (let y = causticsY; y < height; y += 8) {
          const n = noise.noise3D(x * 0.008, y * 0.008, time * 2);
          if (n > 0.3) {
            const alpha = (n - 0.3) * 0.12;
            ctx.fillStyle = `hsla(180, 70%, 60%, ${alpha})`;
            ctx.fillRect(x, y, 8, 8);
          }
        }
      }

      // Bubbles
      for (const b of bubbles) {
        b.y -= b.speed * dt * 0.04;
        b.wobble += dt * 0.002;
        const wx = b.x + Math.sin(b.wobble) * 15;

        if (b.y < -b.size * 2) {
          b.y = height + b.size;
          b.x = Math.random() * width;
        }

        // Bubble body
        ctx.strokeStyle = `hsla(190, 60%, 65%, ${0.15 + (1 - b.y / height) * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wx, b.y, b.size, 0, Math.PI * 2);
        ctx.stroke();

        // Highlight
        ctx.fillStyle = `hsla(190, 80%, 80%, ${0.05 + (1 - b.y / height) * 0.08})`;
        ctx.beginPath();
        ctx.arc(wx - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating particles (plankton)
      for (let i = 0; i < 40; i++) {
        const px = (noise.noise2D(i * 7, time * 0.3) * 0.5 + 0.5) * width;
        const py = (noise.noise2D(i * 7 + 100, time * 0.25) * 0.5 + 0.5) * height;
        const alpha = 0.1 + noise.noise2D(i * 3, time) * 0.1;
        ctx.fillStyle = `hsla(170, 50%, 60%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    destroy() { bubbles = []; },
  };
}
