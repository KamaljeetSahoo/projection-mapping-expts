export function createTunnel() {
  let time = 0;

  return {
    name: 'Infinite Tunnel',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      canvas.clear('#000');

      time += dt * 0.001;

      const cx = width / 2;
      const cy = height / 2;
      const maxSize = Math.max(width, height) * 0.9;
      const layers = 20;
      const speed = time * 2;

      for (let i = layers - 1; i >= 0; i--) {
        // Each layer is a rectangle that shrinks toward center
        const t = ((i / layers) + (speed % 1)) % 1;
        const scale = t;
        const w = maxSize * scale;
        const h = maxSize * scale * (height / width);

        if (w < 2 || h < 2) continue;

        const x = cx - w / 2;
        const y = cy - h / 2;

        const hue = (time * 30 + i * 18) % 360;
        const alpha = 0.3 + (1 - scale) * 0.5;
        const lightness = 30 + (1 - scale) * 30;

        // Rotation per layer
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(time * 0.3 + i * 0.15) * 0.08);
        ctx.translate(-cx, -cy);

        // Rectangle outline
        ctx.strokeStyle = `hsla(${hue}, 60%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = 2 + (1 - scale) * 3;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const cornerSize = 10 + (1 - scale) * 15;
        ctx.strokeStyle = `hsla(${hue}, 70%, ${lightness + 15}%, ${alpha * 0.7})`;
        ctx.lineWidth = 1.5;
        const corners = [
          [x, y], [x + w, y], [x + w, y + h], [x, y + h]
        ];
        for (const [cx2, cy2] of corners) {
          ctx.beginPath();
          ctx.arc(cx2, cy2, cornerSize, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // Center glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      const glowHue = (time * 50) % 360;
      glow.addColorStop(0, `hsla(${glowHue}, 80%, 60%, 0.15)`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 80, cy - 80, 160, 160);
    },

    destroy() {},
  };
}
