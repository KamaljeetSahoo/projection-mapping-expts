export function createFloatingPanels() {
  let time = 0;

  const panels = [
    { xFrac: 0.22, yFrac: 0.35, w: 320, h: 240, z: 0.9, hue: 220 },
    { xFrac: 0.65, yFrac: 0.28, w: 280, h: 380, z: 0.7, hue: 340 },
    { xFrac: 0.45, yFrac: 0.6,  w: 400, h: 260, z: 1.0, hue: 160 },
    { xFrac: 0.78, yFrac: 0.65, w: 260, h: 300, z: 0.5, hue: 40 },
  ];

  return {
    name: 'Floating Panels',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      canvas.clear('#000');

      time += dt * 0.001;

      // Sort by z for painter's
      const sorted = [...panels].sort((a, b) => a.z - b.z);

      for (const p of sorted) {
        const scale = Math.min(width / 1920, height / 1080);
        const w = p.w * scale;
        const h = p.h * scale;
        const baseX = p.xFrac * width;
        const baseY = p.yFrac * height;

        // Floating motion
        const hover = Math.sin(time * 1.2 + p.hue * 0.01) * 15 * p.z;
        const sway = Math.sin(time * 0.7 + p.hue * 0.02) * 8;
        const x = baseX + sway - w / 2;
        const y = baseY + hover - h / 2;

        const shadowDist = 12 + p.z * 20 + hover * 0.3;
        const rotation = Math.sin(time * 0.4 + p.hue) * 0.03;

        ctx.save();
        ctx.translate(baseX + sway, baseY + hover);
        ctx.rotate(rotation);

        // Shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${0.15 + p.z * 0.15})`;
        const blur = 20 + p.z * 15;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = shadowDist * 0.7;
        ctx.shadowOffsetY = shadowDist;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Panel body — gradient
        const hue = (p.hue + time * 8) % 360;
        const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
        grad.addColorStop(0, `hsla(${hue}, 35%, 18%, 0.92)`);
        grad.addColorStop(1, `hsla(${hue + 30}, 30%, 12%, 0.92)`);
        ctx.fillStyle = grad;
        ctx.fillRect(-w / 2, -h / 2, w, h);

        // Top edge highlight
        ctx.fillStyle = `hsla(${hue}, 50%, 50%, 0.15)`;
        ctx.fillRect(-w / 2, -h / 2, w, 3);

        // Left edge highlight
        ctx.fillStyle = `hsla(${hue}, 50%, 50%, 0.1)`;
        ctx.fillRect(-w / 2, -h / 2, 2, h);

        // Subtle inner content (abstract lines)
        ctx.strokeStyle = `hsla(${hue}, 40%, 35%, 0.15)`;
        ctx.lineWidth = 1;
        const lineCount = 3 + Math.floor(p.z * 3);
        for (let l = 0; l < lineCount; l++) {
          const ly = -h / 2 + 30 + l * (h - 60) / lineCount;
          const lw = w * (0.3 + Math.sin(time + l + p.hue) * 0.2);
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 20, ly);
          ctx.lineTo(-w / 2 + 20 + lw, ly);
          ctx.stroke();
        }

        // Border
        ctx.strokeStyle = `hsla(${hue}, 40%, 40%, 0.2)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        ctx.restore();
      }
    },

    destroy() {},
  };
}
