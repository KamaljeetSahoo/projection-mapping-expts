import { createNoise } from '../utils/noise.js';

export function createColorBlobs() {
  const noise = createNoise(Math.random() * 10000);
  let time = 0;
  const BLOB_COUNT = 7;
  let blobs = [];

  function initBlobs(width, height) {
    blobs = [];
    for (let i = 0; i < BLOB_COUNT; i++) {
      blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseRadius: 150 + Math.random() * 350,
        hue: (i / BLOB_COUNT) * 360,
        speed: 0.3 + Math.random() * 0.4,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
      });
    }
  }

  let lastWidth = 0, lastHeight = 0;

  return {
    name: 'Color Blobs',

    init(canvas) {
      lastWidth = canvas.width;
      lastHeight = canvas.height;
      initBlobs(canvas.width, canvas.height);
      canvas.clear('#000');
      time = 0;
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;

      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;
        initBlobs(width, height);
      }

      // Soft clear — creates ghosting trail
      canvas.clear('rgba(0, 0, 0, 0.85)');

      time += dt * 0.0004;

      // Update blob positions via noise
      for (const blob of blobs) {
        blob.x = width * 0.5 + noise.noise3D(blob.noiseOffsetX, 0, time * blob.speed) * width * 0.45;
        blob.y = height * 0.5 + noise.noise3D(0, blob.noiseOffsetY, time * blob.speed) * height * 0.4;

        const radiusPulse = 1 + noise.noise2D(blob.noiseOffsetX + time, blob.noiseOffsetY + time) * 0.35;
        const radius = blob.baseRadius * radiusPulse * (Math.min(width, height) / 900);

        blob.hue += dt * 0.002;

        // Draw layered radial gradients
        const layers = 3;
        for (let l = layers - 1; l >= 0; l--) {
          const layerRadius = radius * (1 + l * 0.5);
          const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, layerRadius);
          const alpha = (0.18 - l * 0.04);
          const sat = 75 - l * 10;
          const light = 55 + l * 5;
          gradient.addColorStop(0, `hsla(${blob.hue % 360}, ${sat}%, ${light}%, ${alpha})`);
          gradient.addColorStop(0.4, `hsla(${(blob.hue + 30) % 360}, ${sat}%, ${light - 10}%, ${alpha * 0.5})`);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Additive blend pass — where blobs overlap, colors mix brightly
      ctx.globalCompositeOperation = 'screen';
      for (const blob of blobs) {
        const radius = blob.baseRadius * 0.6 * (Math.min(width, height) / 900);
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, radius);
        gradient.addColorStop(0, `hsla(${(blob.hue + 60) % 360}, 90%, 60%, 0.06)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalCompositeOperation = 'source-over';
    },

    destroy() {
      blobs = [];
    },
  };
}
