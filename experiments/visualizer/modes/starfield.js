export function createStarfield() {
  const STAR_COUNT = 600;
  let stars = [];
  let beatPulse = 0;
  let hueOffset = 0;

  function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random(),
        speed: 0.0005 + Math.random() * 0.001,
      });
    }
  }

  return {
    name: 'Starfield Warp',

    init(canvas) {
      canvas.clear('#000');
      initStars();
      beatPulse = 0;
      hueOffset = 0;
    },

    update(canvas, dt, audio) {
      const { ctx, width, height } = canvas;
      canvas.fadeOut(0.15);

      const bass = audio.getBass();
      const mid = audio.getMid();
      const treble = audio.getTreble();
      const beat = audio.isBeat();
      const overall = audio.getOverall();

      if (beat) beatPulse = 1;
      beatPulse *= 0.9;

      hueOffset += dt * 0.01;

      const cx = width / 2;
      const cy = height / 2;
      const warpSpeed = 1 + bass * 4 + beatPulse * 3;

      for (const star of stars) {
        const prevZ = star.z;
        star.z -= star.speed * dt * warpSpeed;

        if (star.z <= 0.001) {
          star.x = (Math.random() - 0.5) * 2;
          star.y = (Math.random() - 0.5) * 2;
          star.z = 1;
          continue;
        }

        const sx = cx + (star.x / star.z) * width * 0.5;
        const sy = cy + (star.y / star.z) * height * 0.5;
        const prevSx = cx + (star.x / prevZ) * width * 0.5;
        const prevSy = cy + (star.y / prevZ) * height * 0.5;

        if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) {
          star.x = (Math.random() - 0.5) * 2;
          star.y = (Math.random() - 0.5) * 2;
          star.z = 1;
          continue;
        }

        const depth = 1 - star.z;
        const size = depth * 3;
        const hue = (hueOffset + depth * 200 + star.x * 50) % 360;
        const alpha = depth * (0.5 + overall * 0.5);

        ctx.strokeStyle = `hsla(${hue}, 70%, ${50 + treble * 30}%, ${alpha})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(prevSx, prevSy);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        if (depth > 0.8) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 3);
          glow.addColorStop(0, `hsla(${hue}, 80%, 70%, ${alpha * 0.3})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(sx - size * 3, sy - size * 3, size * 6, size * 6);
        }
      }
    },

    destroy() { stars = []; },
  };
}
