import { drawFill } from './fills.js';

export function renderShapes(ctx, shapes, width, height, time, selectedId) {
  // Sort by zIndex
  const sorted = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const shape of sorted) {
    if (!shape.points.length) continue;

    const px = shape.points.map(p => ({ x: p.x * width, y: p.y * height }));

    // Draw fill first (behind stroke)
    if (shape.closed && shape.fill && shape.fill.type !== 'none') {
      drawFill(ctx, shape.points, shape.fill, width, height, time);
    }

    // Draw stroke
    const stroke = shape.stroke || {};
    const strokeColor = stroke.color || '#ffffff';
    const strokeWidth = stroke.width || 2;
    const strokeOpacity = stroke.opacity !== undefined ? stroke.opacity : 1;

    ctx.save();
    ctx.globalAlpha = strokeOpacity;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(px[0].x, px[0].y);
    for (let i = 1; i < px.length; i++) ctx.lineTo(px[i].x, px[i].y);
    if (shape.closed) ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Selection highlight
    if (shape.id === selectedId) {
      ctx.save();
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(px[0].x, px[0].y);
      for (let i = 1; i < px.length; i++) ctx.lineTo(px[i].x, px[i].y);
      if (shape.closed) ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertex handles
      for (const p of px) {
        ctx.fillStyle = '#00aaff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export function hitTestShape(shapes, nx, ny) {
  // Check shapes in reverse z-order (top first)
  const sorted = [...shapes].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  for (const shape of sorted) {
    if (!shape.closed || shape.points.length < 3) continue;
    if (pointInPolygon(nx, ny, shape.points)) return shape.id;
  }
  return null;
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
