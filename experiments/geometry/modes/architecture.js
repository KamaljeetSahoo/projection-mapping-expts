export function createArchitecture() {
  let time = 0;

  return {
    name: 'Portal',

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
      const hueBase = (time * 12) % 360;

      // Giant archway/portal
      const archW = width * 0.4;
      const archH = height * 0.75;
      const archX = cx - archW / 2;
      const archY = cy - archH / 2 + height * 0.05;
      const archRadius = archW / 2;

      // Outer wall (stone-like)
      const wallHue = hueBase + 30;
      ctx.fillStyle = `hsla(${wallHue}, 15%, 12%, 0.9)`;
      ctx.fillRect(0, 0, width, height);

      // Carved-out arch shape (dark void)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(archX, archY + archH);
      ctx.lineTo(archX, archY + archRadius);
      ctx.arc(cx, archY + archRadius, archRadius, Math.PI, 0, false);
      ctx.lineTo(archX + archW, archY + archH);
      ctx.closePath();
      ctx.fillStyle = '#020204';
      ctx.fill();

      // Depth layers inside the portal
      const depthLayers = 5;
      for (let d = depthLayers; d >= 0; d--) {
        const shrink = d * 0.06;
        const lw = archW * (1 - shrink);
        const lh = archH * (1 - shrink * 0.8);
        const lx = cx - lw / 2;
        const ly = archY + (archH - lh) * 0.5 + d * 3;
        const lr = lw / 2;
        const depth = d / depthLayers;

        ctx.beginPath();
        ctx.moveTo(lx, ly + lh);
        ctx.lineTo(lx, ly + lr);
        ctx.arc(cx, ly + lr, lr, Math.PI, 0, false);
        ctx.lineTo(lx + lw, ly + lh);
        ctx.closePath();

        const layerHue = (hueBase + d * 25 + Math.sin(time + d) * 15) % 360;
        ctx.strokeStyle = `hsla(${layerHue}, 50%, ${25 + depth * 20}%, ${0.15 + depth * 0.2})`;
        ctx.lineWidth = 2 + depth * 2;
        ctx.stroke();
      }

      // Portal glow from inside
      const glowR = archRadius * 1.2;
      const portalGlow = ctx.createRadialGradient(cx, archY + archRadius, 0, cx, archY + archRadius, glowR);
      const glowHue = (hueBase + 180) % 360;
      const pulse = 0.5 + Math.sin(time * 2) * 0.2;
      portalGlow.addColorStop(0, `hsla(${glowHue}, 70%, 50%, ${0.06 * pulse})`);
      portalGlow.addColorStop(0.6, `hsla(${glowHue}, 60%, 40%, ${0.03 * pulse})`);
      portalGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = portalGlow;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();

      // Arch frame — thick border with beveled edges
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(archX, archY + archH);
      ctx.lineTo(archX, archY + archRadius);
      ctx.arc(cx, archY + archRadius, archRadius, Math.PI, 0, false);
      ctx.lineTo(archX + archW, archY + archH);

      // Outer edge
      ctx.strokeStyle = `hsla(${wallHue}, 25%, 30%, 0.7)`;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Inner highlight
      ctx.strokeStyle = `hsla(${wallHue}, 30%, 45%, 0.3)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Pillar details on sides
      for (const side of [-1, 1]) {
        const pillarX = cx + side * (archW / 2 + 30);
        const pillarW = 25;
        const pillarH = archH * 0.65;
        const pillarY = archY + archH - pillarH;

        // Pillar body
        const pillarGrad = ctx.createLinearGradient(pillarX - pillarW / 2, 0, pillarX + pillarW / 2, 0);
        pillarGrad.addColorStop(0, `hsla(${wallHue}, 15%, 18%, 0.8)`);
        pillarGrad.addColorStop(0.5, `hsla(${wallHue}, 15%, 25%, 0.8)`);
        pillarGrad.addColorStop(1, `hsla(${wallHue}, 15%, 15%, 0.8)`);
        ctx.fillStyle = pillarGrad;
        ctx.fillRect(pillarX - pillarW / 2, pillarY, pillarW, pillarH);

        // Pillar cap
        ctx.fillStyle = `hsla(${wallHue}, 20%, 28%, 0.8)`;
        ctx.fillRect(pillarX - pillarW / 2 - 5, pillarY - 8, pillarW + 10, 12);

        // Pillar base
        ctx.fillRect(pillarX - pillarW / 2 - 5, pillarY + pillarH - 4, pillarW + 10, 12);
      }

      // Floating rune/symbol inside portal
      const runeSize = archRadius * 0.3;
      const runeY = archY + archRadius;
      const runeAlpha = 0.15 + Math.sin(time * 1.5) * 0.1;
      const runeHue = (hueBase + 120) % 360;

      ctx.save();
      ctx.translate(cx, runeY);
      ctx.rotate(time * 0.2);

      // Outer ring
      ctx.strokeStyle = `hsla(${runeHue}, 70%, 55%, ${runeAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, runeSize, 0, Math.PI * 2);
      ctx.stroke();

      // Inner triangle
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * runeSize * 0.65;
        const py = Math.sin(a) * runeSize * 0.65;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = `hsla(${runeHue}, 60%, 50%, ${runeAlpha * 0.8})`;
      ctx.stroke();

      // Center dot
      ctx.fillStyle = `hsla(${runeHue}, 80%, 60%, ${runeAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },

    destroy() {},
  };
}
