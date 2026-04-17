import { renderShapes, hitTestShape } from './renderer/shape-renderer.js';
import { saveProject, loadProject } from './storage/db.js';
import { exportProject, importProject } from './storage/export.js';
import { setupAutoUpdate } from '../_shared/pwa.js';

setupAutoUpdate();

const canvasEl = document.getElementById('canvas');
const ctx = canvasEl.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const status = document.getElementById('status');
const propsPanel = document.getElementById('props-panel');

// --- State ---
let shapes = [];
let undoStack = [];
let currentTool = 'draw'; // 'draw' | 'select'
let selectedId = null;
let drawingPoints = []; // points being placed for current shape
let width, height;
let time = 0;

// --- Canvas setup ---
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvasEl.width = width;
  canvasEl.height = height;
}
resize();
window.addEventListener('resize', resize);

// --- ID generator ---
let idCounter = 0;
function newId() { return `shape_${Date.now()}_${idCounter++}`; }

// --- Undo ---
function pushUndo() {
  undoStack.push(JSON.stringify(shapes));
  if (undoStack.length > 50) undoStack.shift();
}

function undo() {
  if (!undoStack.length) return;
  shapes = JSON.parse(undoStack.pop());
  selectedId = null;
  updatePropsPanel();
  scheduleSave();
}

// --- Save/Load ---
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveProject(shapes), 500);
}

async function load() {
  try {
    const loaded = await loadProject();
    if (loaded && loaded.length) shapes = loaded;
  } catch (e) { /* first run, no data */ }
}

// --- Tools ---
function setTool(tool) {
  currentTool = tool;
  drawingPoints = [];
  document.getElementById('tool-draw').classList.toggle('active', tool === 'draw');
  document.getElementById('tool-select').classList.toggle('active', tool === 'select');
  status.textContent = tool === 'draw'
    ? 'Click to place points — double-click to close shape'
    : 'Click a shape to select — drag to move';
  if (tool === 'draw') { selectedId = null; updatePropsPanel(); }
}

function getDefaultFill() {
  const type = document.getElementById('fill-type').value;
  return {
    type,
    color: document.getElementById('fill-color').value,
    color2: '#4488ff',
    meshDensity: 8,
    glowSpeed: 1,
    opacity: 0.8,
  };
}

function getDefaultStroke() {
  return {
    color: document.getElementById('stroke-color').value,
    width: 2,
    opacity: 1,
  };
}

// --- Canvas click handling ---
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

canvasEl.addEventListener('click', (e) => {
  const nx = e.clientX / width;
  const ny = e.clientY / height;

  if (currentTool === 'draw') {
    drawingPoints.push({ x: nx, y: ny });
    status.textContent = `${drawingPoints.length} points — double-click to close`;
  } else if (currentTool === 'select') {
    const hitId = hitTestShape(shapes, nx, ny);
    selectedId = hitId;
    updatePropsPanel();
  }
  resetAutoHide();
});

canvasEl.addEventListener('dblclick', (e) => {
  if (currentTool === 'draw' && drawingPoints.length >= 3) {
    // Remove the last point added by the click event of the dblclick
    drawingPoints.pop();
    pushUndo();
    shapes.push({
      id: newId(),
      points: [...drawingPoints],
      closed: true,
      stroke: getDefaultStroke(),
      fill: getDefaultFill(),
      zIndex: shapes.length,
    });
    drawingPoints = [];
    scheduleSave();
    status.textContent = 'Shape created! Click to start a new one';
  }
});

// Dragging for select tool
let mouseDown = false;
canvasEl.addEventListener('mousedown', (e) => {
  if (currentTool !== 'select' || !selectedId) return;
  const nx = e.clientX / width;
  const ny = e.clientY / height;
  const hitId = hitTestShape(shapes, nx, ny);
  if (hitId === selectedId) {
    mouseDown = true;
    isDragging = false;
    const shape = shapes.find(s => s.id === selectedId);
    if (shape) {
      let cx = 0, cy = 0;
      for (const p of shape.points) { cx += p.x; cy += p.y; }
      cx /= shape.points.length; cy /= shape.points.length;
      dragOffset = { x: nx - cx, y: ny - cy };
    }
  }
});

canvasEl.addEventListener('mousemove', (e) => {
  resetAutoHide();
  if (!mouseDown || currentTool !== 'select' || !selectedId) return;
  isDragging = true;
  const nx = e.clientX / width;
  const ny = e.clientY / height;
  const shape = shapes.find(s => s.id === selectedId);
  if (!shape) return;

  let cx = 0, cy = 0;
  for (const p of shape.points) { cx += p.x; cy += p.y; }
  cx /= shape.points.length; cy /= shape.points.length;

  const dx = nx - dragOffset.x - cx;
  const dy = ny - dragOffset.y - cy;
  for (const p of shape.points) { p.x += dx; p.y += dy; }
});

canvasEl.addEventListener('mouseup', () => {
  if (mouseDown && isDragging) {
    pushUndo();
    scheduleSave();
  }
  mouseDown = false;
  isDragging = false;
});

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    drawingPoints = [];
    selectedId = null;
    updatePropsPanel();
    status.textContent = 'Cancelled';
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedId) {
      pushUndo();
      shapes = shapes.filter(s => s.id !== selectedId);
      selectedId = null;
      updatePropsPanel();
      scheduleSave();
    }
  }
  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveProject(shapes); status.textContent = 'Saved!'; }
  if (e.key === 'd' || e.key === 'D') setTool('draw');
  if (e.key === 'v' || e.key === 'V') setTool('select');
  if (e.key === 'f' || e.key === 'F') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }
  resetAutoHide();
});

// --- Toolbar buttons ---
document.getElementById('tool-draw').addEventListener('click', () => setTool('draw'));
document.getElementById('tool-select').addEventListener('click', () => setTool('select'));
document.getElementById('btn-save').addEventListener('click', () => { saveProject(shapes); status.textContent = 'Saved!'; });
document.getElementById('btn-export').addEventListener('click', () => { exportProject(shapes); status.textContent = 'Exported!'; });
document.getElementById('btn-import').addEventListener('click', async () => {
  try {
    const imported = await importProject();
    pushUndo();
    shapes = imported;
    scheduleSave();
    status.textContent = `Imported ${shapes.length} shapes`;
  } catch (e) { status.textContent = 'Import failed'; }
});
document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-home').addEventListener('click', () => {
  const home = (import.meta.env && import.meta.env.BASE_URL) || '/';
  window.location.href = home;
});

// --- Properties panel ---
function updatePropsPanel() {
  if (!selectedId) {
    propsPanel.classList.remove('visible');
    return;
  }
  const shape = shapes.find(s => s.id === selectedId);
  if (!shape) { propsPanel.classList.remove('visible'); return; }

  propsPanel.classList.add('visible');
  document.getElementById('prop-stroke-color').value = shape.stroke.color || '#ffffff';
  document.getElementById('prop-stroke-width').value = shape.stroke.width || 2;
  document.getElementById('prop-opacity').value = shape.fill.opacity !== undefined ? shape.fill.opacity : 0.8;
  document.getElementById('prop-fill-type').value = shape.fill.type || 'none';
  document.getElementById('prop-fill-color').value = shape.fill.color || '#ff4488';
  document.getElementById('prop-fill-color2').value = shape.fill.color2 || '#4488ff';
  document.getElementById('prop-mesh-density').value = shape.fill.meshDensity || 8;
  document.getElementById('prop-glow-speed').value = shape.fill.glowSpeed || 1;
}

function bindPropInput(id, fn) {
  document.getElementById(id).addEventListener('input', (e) => {
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    fn(shape, e.target.value);
    scheduleSave();
  });
}

bindPropInput('prop-stroke-color', (s, v) => s.stroke.color = v);
bindPropInput('prop-stroke-width', (s, v) => s.stroke.width = parseFloat(v));
bindPropInput('prop-opacity', (s, v) => s.fill.opacity = parseFloat(v));
bindPropInput('prop-fill-type', (s, v) => s.fill.type = v);
bindPropInput('prop-fill-color', (s, v) => s.fill.color = v);
bindPropInput('prop-fill-color2', (s, v) => s.fill.color2 = v);
bindPropInput('prop-mesh-density', (s, v) => s.fill.meshDensity = parseInt(v));
bindPropInput('prop-glow-speed', (s, v) => s.fill.glowSpeed = parseFloat(v));

document.getElementById('btn-delete').addEventListener('click', () => {
  if (!selectedId) return;
  pushUndo();
  shapes = shapes.filter(s => s.id !== selectedId);
  selectedId = null;
  updatePropsPanel();
  scheduleSave();
});

// --- Auto-hide UI ---
let hideTimer = null;
function resetAutoHide() {
  uiLayer.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { uiLayer.classList.add('hidden'); }, 3000);
}
resetAutoHide();

// --- Render loop ---
function render(timestamp) {
  time = timestamp * 0.001;
  ctx.clearRect(0, 0, width, height);

  renderShapes(ctx, shapes, width, height, time, selectedId);

  // Draw in-progress shape
  if (drawingPoints.length > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const first = drawingPoints[0];
    ctx.moveTo(first.x * width, first.y * height);
    for (let i = 1; i < drawingPoints.length; i++) {
      ctx.lineTo(drawingPoints[i].x * width, drawingPoints[i].y * height);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vertex dots
    for (const p of drawingPoints) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  requestAnimationFrame(render);
}

// --- Init ---
load().then(() => {
  requestAnimationFrame(render);
});
