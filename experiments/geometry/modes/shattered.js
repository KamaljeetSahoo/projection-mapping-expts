export function createShattered() {
  let time = 0;
  const SHARD_COUNT = 8;
  let shards = [];

  function initShards(width, height) {
    shards = [];
    // Large shards distributed across the screen with gaps
    const positions = [
      { xFrac: 0.15, yFrac: 0.25 },
      { xFrac: 0.45, yFrac: 0.15 },
      { xFrac: 0.75, yFrac: 0.3 },
      { xFrac: 0.25, yFrac: 0.6 },
      { xFrac: 0.55, yFrac: 0.55 },
      { xFrac: 0.8, yFrac: 0.65 },
      { xFrac: 0.35, yFrac: 0.85 },
      { xFrac: 0.65, yFrac: 0.8 },
    ];

    for (let i = 0; i < SHARD_COUNT; i++) {
      const pos = positions[i];
      const size = Math.min(width, height) * (0.12 + Math.random() * 0.1);

      const vertices = [];
      const sides = 3 + Math.floor(Math.random() * 3);
      for (let v = 0; v < sides; v++) {
        const angle = (v / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const r = size * (0.5 + Math.random() * 0.5);
        vertices.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
      }

      shards.push({
        cx: pos.xFrac * width,
        cy: pos.yFrac * height,
        vertices,
        hue: (i / SHARD_COUNT) * 360,
        speed: 0.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  let lastW = 0, lastH = 0;

  return {
    name: 'Shattered Wall',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
      lastW = canvas.width;
      lastH = canvas.height;
      initShards(canvas.width, canvas.height);
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      canvas.clear('#050505');

      if (width !== lastW || height !== lastH) {
        lastW = width; lastH = height;
        initShards(width, height);
      }

      time += dt * 0.001;

      // Sort by extrusion for painter's
      const sorted = [...shards].map(s => ({
        ...s,
        extrude: Math.sin(time * s.speed + s.phase) * 0.5 + 0.5,
      })).sort((a, b) => a.extrude - b.extrude);

      for (const shard of sorted) {
        const { extrude } = shard;
        const extrudeAmt = extrude * 35;
        const hue = (shard.hue + time * 12) % 360;
        const rot = time * shard.rotSpeed;

        ctx.save();
        ctx.translate(shard.cx, shard.cy);
        ctx.rotate(rot);

        // Shadow
        if (extrudeAmt > 3) {
          ctx.fillStyle = `rgba(0, 0, 0, ${extrude * 0.35})`;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 25 + extrude * 15;
          ctx.shadowOffsetX = extrudeAmt * 0.8;
          ctx.shadowOffsetY = extrudeAmt * 0.8;
          ctx.beginPath();
          for (let i = 0; i < shard.vertices.length; i++) {
            const v = shard.vertices[i];
            if (i === 0) ctx.moveTo(v.x, v.y);
            else ctx.lineTo(v.x, v.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Extrusion sides
        if (extrudeAmt > 2) {
          for (let i = 0; i < shard.vertices.length; i++) {
            const v1 = shard.vertices[i];
            const v2 = shard.vertices[(i + 1) % shard.vertices.length];
            ctx.fillStyle = `hsla(${hue}, 35%, ${15 + extrude * 12}%, 0.8)`;
            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.lineTo(v2.x + extrudeAmt * 0.6, v2.y + extrudeAmt * 0.6);
            ctx.lineTo(v1.x + extrudeAmt * 0.6, v1.y + extrudeAmt * 0.6);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Front face
        const lightness = 22 + extrude * 28;
        const faceGrad = ctx.createLinearGradient(
          shard.vertices[0].x, shard.vertices[0].y,
          shard.vertices[Math.floor(shard.vertices.length / 2)].x,
          shard.vertices[Math.floor(shard.vertices.length / 2)].y
        );
        faceGrad.addColorStop(0, `hsla(${hue}, 40%, ${lightness + 8}%, 0.9)`);
        faceGrad.addColorStop(1, `hsla(${hue + 20}, 35%, ${lightness - 5}%, 0.9)`);

        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        for (let i = 0; i < shard.vertices.length; i++) {
          const v = shard.vertices[i];
          if (i === 0) ctx.moveTo(v.x, v.y);
          else ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();
        ctx.fill();

        // Edge glow
        ctx.strokeStyle = `hsla(${hue}, 60%, ${lightness + 25}%, ${0.2 + extrude * 0.4})`;
        ctx.lineWidth = 1.5 + extrude * 1.5;
        ctx.stroke();

        ctx.restore();
      }
    },

    destroy() { shards = []; },
  };
}
