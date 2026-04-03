export function drawFill(ctx, points, fill, width, height, time) {
  if (!fill || fill.type === 'none' || !points.length) return;

  // Convert normalized points to pixel coordinates
  const px = points.map(p => ({ x: p.x * width, y: p.y * height }));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px[0].x, px[0].y);
  for (let i = 1; i < px.length; i++) ctx.lineTo(px[i].x, px[i].y);
  ctx.closePath();
  ctx.clip();

  const opacity = fill.opacity !== undefined ? fill.opacity : 0.8;

  switch (fill.type) {
    case 'solid':
      ctx.globalAlpha = opacity;
      ctx.fillStyle = fill.color || '#ffffff';
      ctx.fill();
      break;

    case 'gradient': {
      ctx.globalAlpha = opacity;
      // Find bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of px) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      }
      const grad = ctx.createLinearGradient(minX, minY, maxX, maxY);
      grad.addColorStop(0, fill.color || '#ff0066');
      grad.addColorStop(1, fill.color2 || '#0066ff');
      ctx.fillStyle = grad;
      ctx.fill();
      break;
    }

    case 'mesh': {
      ctx.globalAlpha = opacity;
      const density = fill.meshDensity || 8;
      // Find bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of px) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      }
      const stepX = (maxX - minX) / density;
      const stepY = (maxY - minY) / density;

      ctx.strokeStyle = fill.color || '#00ff88';
      ctx.lineWidth = 0.8;

      // Horizontal lines
      for (let y = minY; y <= maxY; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(minX, y);
        ctx.lineTo(maxX, y);
        ctx.stroke();
      }
      // Vertical lines
      for (let x = minX; x <= maxX; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, minY);
        ctx.lineTo(x, maxY);
        ctx.stroke();
      }
      // Diagonal lines for triangle mesh feel
      for (let y = minY; y <= maxY; y += stepY) {
        for (let x = minX; x <= maxX; x += stepX) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + stepX, y + stepY);
          ctx.stroke();
        }
      }
      break;
    }

    case 'glow': {
      const speed = fill.glowSpeed || 1;
      const pulse = Math.sin(time * speed) * 0.5 + 0.5;
      ctx.globalAlpha = opacity * (0.3 + pulse * 0.7);

      // Find center
      let cx = 0, cy = 0;
      for (const p of px) { cx += p.x; cy += p.y; }
      cx /= px.length; cy /= px.length;

      // Find max distance from center
      let maxDist = 0;
      for (const p of px) {
        const d = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        maxDist = Math.max(maxDist, d);
      }

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxDist);
      const color = fill.color || '#8844ff';
      grad.addColorStop(0, color);
      grad.addColorStop(0.6, color + '88');
      grad.addColorStop(1, color + '22');
      ctx.fillStyle = grad;
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}
