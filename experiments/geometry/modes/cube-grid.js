export function createCubeGrid() {
  let time = 0;

  // Project a 3D point to 2D with perspective
  function project(x, y, z, cx, cy, fov) {
    const scale = fov / (fov + z);
    return {
      x: cx + x * scale,
      y: cy + y * scale,
      scale,
    };
  }

  function drawFace(ctx, points, fillColor, strokeColor) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  return {
    name: 'Monolith',

    init(canvas) {
      canvas.clear('#000');
      time = 0;
    },

    update(canvas, dt) {
      const { ctx, width, height } = canvas;
      canvas.clear('#000');

      time += dt * 0.0008;

      const cx = width / 2;
      const cy = height / 2;
      const size = Math.min(width, height) * 0.28;
      const fov = 600;

      const rotY = time;
      const rotX = Math.sin(time * 0.7) * 0.3;

      // Cube vertices in 3D
      const raw = [
        [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
        [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
      ];

      // Rotate
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      const verts = raw.map(([x, y, z]) => {
        // Rotate Y
        let rx = x * cosY - z * sinY;
        let rz = x * sinY + z * cosY;
        // Rotate X
        let ry = y * cosX - rz * sinX;
        rz = y * sinX + rz * cosX;
        return project(rx * size, ry * size, rz * size, cx, cy, fov);
      });

      // Faces with indices + normals for back-face culling
      const faces = [
        { idx: [0,1,2,3], normal: [0,0,-1], label: 'back' },
        { idx: [5,4,7,6], normal: [0,0,1], label: 'front' },
        { idx: [4,0,3,7], normal: [-1,0,0], label: 'left' },
        { idx: [1,5,6,2], normal: [1,0,0], label: 'right' },
        { idx: [4,5,1,0], normal: [0,-1,0], label: 'top' },
        { idx: [3,2,6,7], normal: [0,1,0], label: 'bottom' },
      ];

      // Transform normals for sorting
      const transformedFaces = faces.map(f => {
        let [nx, ny, nz] = f.normal;
        let rx = nx * cosY - nz * sinY;
        let rz = nx * sinY + nz * cosY;
        let ry = ny * cosX - rz * sinX;
        rz = ny * sinX + rz * cosX;
        const avgZ = f.idx.reduce((s, i) => {
          const [x,y,z] = raw[i];
          let rx2 = x * cosY - z * sinY;
          let rz2 = x * sinY + z * cosY;
          let ry2 = y * cosX - rz2 * sinX;
          rz2 = y * sinX + rz2 * cosX;
          return s + rz2;
        }, 0) / f.idx.length;
        return { ...f, nz: rz, avgZ };
      });

      // Sort back to front
      transformedFaces.sort((a, b) => a.avgZ - b.avgZ);

      // Ground shadow
      const shadowScale = 0.6 + Math.sin(time * 2) * 0.05;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 1.4, size * shadowScale * 1.5, size * shadowScale * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      const hueBase = (time * 40) % 360;

      // Draw visible faces
      for (const face of transformedFaces) {
        if (face.nz < -0.1) continue; // back-face cull

        const pts = face.idx.map(i => verts[i]);
        const brightness = 20 + face.nz * 40;
        const hue = (hueBase + face.avgZ * 20) % 360;

        drawFace(ctx, pts,
          `hsla(${hue}, 45%, ${brightness}%, 0.9)`,
          `hsla(${hue}, 55%, ${brightness + 20}%, 0.5)`
        );

        // Inner edge glow
        ctx.strokeStyle = `hsla(${hue}, 70%, ${brightness + 35}%, ${0.1 + face.nz * 0.15})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Ambient glow around the cube
      const glow = ctx.createRadialGradient(cx, cy, size * 0.5, cx, cy, size * 2);
      glow.addColorStop(0, `hsla(${hueBase}, 60%, 50%, 0.04)`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    },

    destroy() {},
  };
}
