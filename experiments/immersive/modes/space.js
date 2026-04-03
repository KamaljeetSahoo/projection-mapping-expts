export function createSpace() {
  let time = 0;
  const STAR_COUNT = 200;
  let stars = [];
  let shootingStars = [];

  function initStars(width, height) {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 2,
        twinkleSpeed: 1 + Math.random() * 3,
        twinklePhase: Math.random() * Math.PI * 2,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
  }

  let lastW = 0, lastH = 0;

  return {
    name: 'Deep Space',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      lastW = canvas.width;
      lastH = canvas.height;
      initStars(canvas.width, canvas.height);
      shootingStars = [];
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      time += dt * 0.001;

      if (width !== lastW || height !== lastH) {
        lastW = width; lastH = height;
        initStars(width, height);
      }

      // Deep space background
      const bg = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.5, height * 0.5, width * 0.8);
      bg.addColorStop(0, '#0a0418');
      bg.addColorStop(0.5, '#060210');
      bg.addColorStop(1, '#010108');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Nebula clouds
      const nebulaHue = (time * 5) % 360;
      const nebula1 = ctx.createRadialGradient(width * 0.7, height * 0.3, 0, width * 0.7, height * 0.3, width * 0.35);
      nebula1.addColorStop(0, `hsla(${nebulaHue + 280}, 60%, 30%, 0.06)`);
      nebula1.addColorStop(0.5, `hsla(${nebulaHue + 260}, 50%, 20%, 0.03)`);
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(width * 0.25, height * 0.65, 0, width * 0.25, height * 0.65, width * 0.3);
      nebula2.addColorStop(0, `hsla(${nebulaHue + 200}, 55%, 25%, 0.05)`);
      nebula2.addColorStop(0.6, `hsla(${nebulaHue + 220}, 40%, 15%, 0.02)`);
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // Stars
      for (const s of stars) {
        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.5 + 0.5;
        const alpha = s.brightness * (0.4 + twinkle * 0.6);
        const size = s.size * (0.8 + twinkle * 0.4);

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Cross flare on bright stars
        if (s.size > 1.5 && twinkle > 0.7) {
          const flareLen = size * 4;
          const flareAlpha = (twinkle - 0.7) * alpha;
          ctx.strokeStyle = `rgba(200, 220, 255, ${flareAlpha * 0.3})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - flareLen, s.y);
          ctx.lineTo(s.x + flareLen, s.y);
          ctx.moveTo(s.x, s.y - flareLen);
          ctx.lineTo(s.x, s.y + flareLen);
          ctx.stroke();
        }
      }

      // Shooting stars
      if (Math.random() < 0.003) {
        shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.5,
          vx: 3 + Math.random() * 5,
          vy: 1 + Math.random() * 3,
          life: 1,
          length: 40 + Math.random() * 80,
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx * dt * 0.06;
        ss.y += ss.vy * dt * 0.06;
        ss.life -= dt * 0.002;

        if (ss.life <= 0) { shootingStars.splice(i, 1); continue; }

        const tailX = ss.x - (ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.life;
        const tailY = ss.y - (ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)) * ss.length * ss.life;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `rgba(255, 255, 255, ${ss.life * 0.7})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();
      }

      // Distant planet
      const planetX = width * 0.82;
      const planetY = height * 0.75;
      const planetR = Math.min(width, height) * 0.06;
      const planetGrad = ctx.createRadialGradient(planetX - planetR * 0.3, planetY - planetR * 0.3, 0, planetX, planetY, planetR);
      planetGrad.addColorStop(0, `hsla(${nebulaHue + 30}, 40%, 35%, 0.8)`);
      planetGrad.addColorStop(0.7, `hsla(${nebulaHue + 20}, 35%, 20%, 0.7)`);
      planetGrad.addColorStop(1, `hsla(${nebulaHue + 10}, 30%, 10%, 0.5)`);
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fill();
    },

    destroy() { stars = []; shootingStars = []; },
  };
}
