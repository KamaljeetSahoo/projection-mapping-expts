export const SHAPE_TYPES = ['circle', 'square', 'triangle', 'star', 'line', 'blob'];

export const DEFAULT_COLORS = [
  '#ff4488', '#ff8844', '#ffdd44', '#44ff88',
  '#44ddff', '#4488ff', '#8844ff', '#ff44dd',
];

const TAU = Math.PI * 2;

export function makeShape(type, cx = 0.5, cy = 0.5) {
  const base = {
    id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    x: cx,
    y: cy,
    size: 0.18,              // normalized to min(width, height)
    rotation: 0,             // radians
    color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
    opacity: 1,
    fill: 'solid',           // 'solid' | 'gradient' | 'glow'
    animation: 'none',       // 'none' | 'pulse' | 'rotate' | 'drift' | 'twinkle'
    speed: 1,
    phase: Math.random() * TAU,
    z: 0,                    // stacking; higher = front
  };
  if (type === 'line') base.size = 0.3;
  return base;
}

// Apply animation transforms and return the live rendered params for this frame.
function animate(shape, t) {
  const { x, y, size, rotation, opacity } = shape;
  const s = shape.speed;
  const ph = shape.phase;
  let nx = x, ny = y, nSize = size, nRot = rotation, nOpacity = opacity;
  switch (shape.animation) {
    case 'pulse': {
      const k = 1 + Math.sin(t * s * 2 + ph) * 0.22;
      nSize = size * k;
      break;
    }
    case 'rotate': {
      nRot = rotation + t * s * 0.8;
      break;
    }
    case 'drift': {
      nx = x + Math.sin(t * s * 0.7 + ph) * 0.04;
      ny = y + Math.cos(t * s * 0.5 + ph * 1.3) * 0.04;
      break;
    }
    case 'twinkle': {
      const k = 0.35 + 0.65 * Math.pow(Math.sin(t * s * 2 + ph), 2);
      nOpacity = opacity * k;
      break;
    }
  }
  return { x: nx, y: ny, size: nSize, rotation: nRot, opacity: nOpacity };
}

function tracePath(ctx, type, r) {
  ctx.beginPath();
  switch (type) {
    case 'circle': {
      ctx.arc(0, 0, r, 0, TAU);
      break;
    }
    case 'square': {
      ctx.rect(-r, -r, r * 2, r * 2);
      break;
    }
    case 'triangle': {
      const h = r * Math.sqrt(3);
      ctx.moveTo(0, -h / 1.5);
      ctx.lineTo(r, h / 3);
      ctx.lineTo(-r, h / 3);
      ctx.closePath();
      break;
    }
    case 'star': {
      const pts = 5;
      const inner = r * 0.45;
      for (let i = 0; i < pts * 2; i++) {
        const a = (i / (pts * 2)) * TAU - Math.PI / 2;
        const rr = i % 2 === 0 ? r : inner;
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'blob': {
      // Parametric squircle-ish blob
      const steps = 36;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * TAU;
        const rr = r * (1 + Math.sin(a * 3) * 0.14 + Math.cos(a * 5) * 0.08);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'line': {
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      break;
    }
  }
}

function applyFill(ctx, shape, r, liveOpacity) {
  const col = shape.color;
  ctx.globalAlpha = liveOpacity;
  if (shape.fill === 'gradient') {
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, col);
    g.addColorStop(1, shiftHue(col, 60));
    ctx.fillStyle = g;
  } else if (shape.fill === 'glow') {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
    g.addColorStop(0, col);
    g.addColorStop(0.55, hexWithAlpha(col, 0.55));
    g.addColorStop(1, hexWithAlpha(col, 0));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = col;
  }
}

export function renderShape(ctx, shape, canvasW, canvasH, t, isSelected) {
  const live = animate(shape, t);
  const minDim = Math.min(canvasW, canvasH);
  const r = (live.size / 2) * minDim;
  const px = live.x * canvasW;
  const py = live.y * canvasH;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(live.rotation);

  if (shape.type === 'line') {
    ctx.globalAlpha = live.opacity;
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = Math.max(2, minDim * 0.01);
    ctx.lineCap = 'round';
    tracePath(ctx, 'line', r);
    ctx.stroke();
  } else {
    applyFill(ctx, shape, r, live.opacity);
    tracePath(ctx, shape.type, r);
    ctx.fill();
  }
  ctx.restore();

  if (isSelected) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(live.rotation);
    const pad = r + Math.max(8, minDim * 0.012);
    ctx.strokeStyle = 'rgba(140, 200, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-pad, -pad, pad * 2, pad * 2);
    ctx.setLineDash([]);
    // Corner dots
    ctx.fillStyle = '#9cf';
    for (const [sx, sy] of [[-pad, -pad], [pad, -pad], [pad, pad], [-pad, pad]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Point-in-shape hit test in normalized coords (0..1). Generous padding for touch.
export function hitTestShape(shape, nx, ny, canvasW, canvasH, t) {
  const live = animate(shape, t);
  const minDim = Math.min(canvasW, canvasH);
  const px = (nx - live.x) * canvasW;
  const py = (ny - live.y) * canvasH;
  const cos = Math.cos(-live.rotation);
  const sin = Math.sin(-live.rotation);
  const lx = px * cos - py * sin;
  const ly = px * sin + py * cos;
  const r = (live.size / 2) * minDim;
  // A bit of touch slack
  const pad = Math.max(10, minDim * 0.015);
  if (shape.type === 'line') {
    return Math.abs(ly) <= pad && Math.abs(lx) <= r + pad;
  }
  // Approximate all shapes with a padded square for hit-test — more forgiving than exact
  return Math.abs(lx) <= r + pad && Math.abs(ly) <= r + pad;
}

function shiftHue(hex, deg) {
  const [h, s, l] = hexToHsl(hex);
  const nh = (h + deg) % 360;
  return hslToHex(nh, s, l);
}

function hexWithAlpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
