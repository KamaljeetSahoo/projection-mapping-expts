export function createFractals() {
  let time = 0;
  let hueShift = 0;

  function drawShape(ctx, cx, cy, radius, sides, depth, maxDepth, rotation, time) {
    if (depth > maxDepth || radius < 2) return;

    const alpha = 0.15 + (1 - depth / maxDepth) * 0.6;
    const hue = (hueShift + depth * 45 + rotation * 20) % 360;
    const sat = 70 + Math.sin(time + depth) * 20;

    ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${55 + depth * 5}%, ${alpha})`;
    ctx.lineWidth = Math.max(0.5, 2.5 - depth * 0.4);

    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = rotation + (i / sides) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Recurse at each vertex
    const childSides = sides === 6 ? 6 : (sides === 3 ? 3 : 4);
    const childCount = Math.min(sides, 3);
    const childRadius = radius * (0.38 + Math.sin(time * 0.5 + depth) * 0.05);
    const rotSpeed = 0.3 + depth * 0.15;

    for (let i = 0; i < childCount; i++) {
      const angle = rotation + (i / childCount) * Math.PI * 2;
      const nx = cx + Math.cos(angle) * radius * 0.65;
      const ny = cy + Math.sin(angle) * radius * 0.65;
      drawShape(ctx, nx, ny, childRadius, childSides, depth + 1, maxDepth, rotation + time * rotSpeed, time);
    }
  }

  return {
    name: 'Geometric Fractals',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      hueShift = Math.random() * 360;
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;

      canvas.clear('rgba(0, 0, 0, 0.92)');

      time += dt * 0.0005;
      hueShift += dt * 0.005;

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.42;

      // Draw multiple fractal layers
      const shapes = [
        { sides: 6, offset: 0, scale: 1 },
        { sides: 3, offset: Math.PI / 6, scale: 0.7 },
        { sides: 4, offset: Math.PI / 4, scale: 0.5 },
      ];

      for (const shape of shapes) {
        const rotation = time * 0.4 + shape.offset + Math.sin(time * 0.3) * 0.5;
        const pulse = 1 + Math.sin(time * 0.8 + shape.offset) * 0.08;
        const radius = baseRadius * shape.scale * pulse;
        const maxDepth = 4 + Math.floor(Math.sin(time * 0.2) + 1);
        drawShape(ctx, cx, cy, radius, shape.sides, 0, maxDepth, rotation, time);
      }

      // Central glow
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.3);
      const glowHue = (hueShift + 180) % 360;
      gradient.addColorStop(0, `hsla(${glowHue}, 80%, 60%, 0.08)`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },

    destroy() {},
  };
}
