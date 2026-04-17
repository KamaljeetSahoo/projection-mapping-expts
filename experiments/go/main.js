import { setupAutoUpdate } from '../_shared/pwa.js';
import {
  SHAPE_TYPES,
  DEFAULT_COLORS,
  makeShape,
  renderShape,
  hitTestShape,
} from './shapes.js';
import { attachGestures } from './gestures.js';
import { saveState, loadState } from './storage.js';

setupAutoUpdate();

// ---------- State ----------
const state = {
  shapes: [],
  selectedId: null,
  undoStack: [],
  redoStack: [],
  playMode: false,
};

const MAX_HISTORY = 40;

function snapshot() {
  return JSON.stringify(state.shapes);
}
function pushHistory() {
  state.undoStack.push(snapshot());
  if (state.undoStack.length > MAX_HISTORY) state.undoStack.shift();
  state.redoStack.length = 0;
  refreshHistoryButtons();
}
function undo() {
  if (!state.undoStack.length) return;
  state.redoStack.push(snapshot());
  state.shapes = JSON.parse(state.undoStack.pop());
  state.selectedId = null;
  closeSheet();
  refreshHistoryButtons();
  scheduleSave();
}
function redo() {
  if (!state.redoStack.length) return;
  state.undoStack.push(snapshot());
  state.shapes = JSON.parse(state.redoStack.pop());
  state.selectedId = null;
  closeSheet();
  refreshHistoryButtons();
  scheduleSave();
}
function refreshHistoryButtons() {
  btnUndo.disabled = state.undoStack.length === 0;
  btnRedo.disabled = state.redoStack.length === 0;
}

// ---------- Persistence ----------
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(state.shapes), 350);
}

// ---------- Canvas ----------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);

// ---------- Render loop ----------
let t = 0;
function render(ts) {
  t = ts * 0.001;
  ctx.clearRect(0, 0, W, H);
  const sorted = [...state.shapes].sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const shape of sorted) {
    renderShape(ctx, shape, W, H, t, shape.id === state.selectedId && !state.playMode);
  }
  requestAnimationFrame(render);
}

// ---------- Selection ----------
function selectById(id) {
  state.selectedId = id;
  if (id) openSheet();
  else closeSheet();
  syncSheet();
  updateEmptyHint();
}
function findShape(id) {
  return state.shapes.find((s) => s.id === id);
}
function hitTestAt(nx, ny) {
  const sorted = [...state.shapes].sort((a, b) => (b.z || 0) - (a.z || 0));
  for (const s of sorted) if (hitTestShape(s, nx, ny, W, H, t)) return s.id;
  return null;
}

// ---------- Gestures ----------
let dragCtx = null;   // { id, offsetX, offsetY }
let pinchCtx = null;  // { id, startSize, startRot }

attachGestures(canvas, {
  onTap({ x, y }) {
    if (state.playMode) {
      setPlayMode(false);
      return;
    }
    const nx = x / W, ny = y / H;
    const id = hitTestAt(nx, ny);
    selectById(id);
  },
  onDoubleTap({ x, y }) {
    if (state.playMode) return;
    const nx = x / W, ny = y / H;
    const id = hitTestAt(nx, ny);
    if (id) {
      duplicateShape(id);
    }
  },
  onLongPress({ x, y }) {
    if (state.playMode) return;
    const nx = x / W, ny = y / H;
    const id = hitTestAt(nx, ny);
    if (id) showContextMenu(id, x, y);
  },
  onDragStart({ x, y }) {
    if (state.playMode) return;
    const nx = x / W, ny = y / H;
    const id = hitTestAt(nx, ny);
    if (!id) return;
    const s = findShape(id);
    if (!s) return;
    state.selectedId = id;
    syncSheet();
    pushHistory();
    dragCtx = {
      id,
      offsetX: nx - s.x,
      offsetY: ny - s.y,
    };
    // Bring selected to front visually during drag
    const maxZ = Math.max(0, ...state.shapes.map((s2) => s2.z || 0));
    s.z = maxZ + 1;
  },
  onDragMove({ x, y }) {
    if (!dragCtx) return;
    const s = findShape(dragCtx.id);
    if (!s) return;
    s.x = Math.min(1.1, Math.max(-0.1, x / W - dragCtx.offsetX));
    s.y = Math.min(1.1, Math.max(-0.1, y / H - dragCtx.offsetY));
  },
  onDragEnd() {
    if (dragCtx) scheduleSave();
    dragCtx = null;
  },
  onPinchStart() {
    if (state.playMode) return;
    const id = state.selectedId;
    const s = id && findShape(id);
    if (!s) return;
    pushHistory();
    pinchCtx = { id: s.id, startSize: s.size, startRot: s.rotation };
  },
  onPinchMove({ scale, rotation }) {
    if (!pinchCtx) return;
    const s = findShape(pinchCtx.id);
    if (!s) return;
    s.size = Math.min(2, Math.max(0.04, pinchCtx.startSize * scale));
    s.rotation = pinchCtx.startRot + rotation;
    // Keep sheet value in sync if needed (no size/rotation sliders currently)
  },
  onPinchEnd() {
    if (pinchCtx) scheduleSave();
    pinchCtx = null;
  },
});

// ---------- UI: Palette ----------
const SHAPE_ICONS = {
  circle: '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="10" fill="currentColor"/></svg>',
  square: '<svg viewBox="0 0 28 28"><rect x="5" y="5" width="18" height="18" rx="2" fill="currentColor"/></svg>',
  triangle: '<svg viewBox="0 0 28 28"><path d="M14 4 L24 23 L4 23 Z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 28 28"><path d="M14 3 L17 11 L25 11 L18.5 16 L21 24 L14 19 L7 24 L9.5 16 L3 11 L11 11 Z" fill="currentColor"/></svg>',
  line: '<svg viewBox="0 0 28 28"><path d="M4 14 L24 14" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
  blob: '<svg viewBox="0 0 28 28"><path d="M14 4 C20 4 24 8 24 14 C24 20 20 24 14 24 C8 24 4 20 4 14 C4 8 9 4 14 4 Z" fill="currentColor" transform="rotate(15 14 14)"/></svg>',
};

const palette = document.getElementById('palette');
for (const type of SHAPE_TYPES) {
  const btn = document.createElement('button');
  btn.className = 'go-shape-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', `Add ${type}`);
  btn.innerHTML = SHAPE_ICONS[type];
  btn.addEventListener('click', () => addShape(type));
  palette.appendChild(btn);
}

function addShape(type) {
  pushHistory();
  const s = makeShape(type, 0.5, 0.5);
  const maxZ = Math.max(0, ...state.shapes.map((x) => x.z || 0));
  s.z = maxZ + 1;
  state.shapes.push(s);
  selectById(s.id);
  scheduleSave();
  updateEmptyHint();
}

function duplicateShape(id) {
  const s = findShape(id);
  if (!s) return;
  pushHistory();
  const clone = JSON.parse(JSON.stringify(s));
  clone.id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  clone.x = Math.min(0.95, s.x + 0.04);
  clone.y = Math.min(0.95, s.y + 0.04);
  const maxZ = Math.max(0, ...state.shapes.map((x) => x.z || 0));
  clone.z = maxZ + 1;
  state.shapes.push(clone);
  selectById(clone.id);
  scheduleSave();
}

function deleteShape(id) {
  pushHistory();
  state.shapes = state.shapes.filter((s) => s.id !== id);
  if (state.selectedId === id) selectById(null);
  scheduleSave();
  updateEmptyHint();
}

// ---------- UI: Bottom sheet ----------
const sheet = document.getElementById('sheet');
const sheetScrim = document.getElementById('sheet-scrim');
const swatchesEl = document.getElementById('swatches');
const fillPillsEl = document.getElementById('fill-pills');
const animPillsEl = document.getElementById('anim-pills');
const speedSlider = document.getElementById('speed');
const speedVal = document.getElementById('speed-val');
const speedRow = document.getElementById('speed-row');
const opacitySlider = document.getElementById('opacity');
const opacityVal = document.getElementById('opacity-val');
const btnDup = document.getElementById('btn-dup');
const btnDelete = document.getElementById('btn-delete');

// Swatches: default colors + a picker
for (const c of DEFAULT_COLORS) {
  const sw = document.createElement('button');
  sw.className = 'go-swatch';
  sw.style.background = c;
  sw.dataset.color = c;
  sw.addEventListener('click', () => setProp('color', c));
  swatchesEl.appendChild(sw);
}
const picker = document.createElement('label');
picker.className = 'go-swatch picker';
picker.innerHTML = '<span>+</span><input type="color" aria-label="Custom color">';
const pickerInput = picker.querySelector('input');
pickerInput.addEventListener('input', (e) => setProp('color', e.target.value));
swatchesEl.appendChild(picker);

// Fill pills
for (const f of ['solid', 'gradient', 'glow']) {
  const p = document.createElement('button');
  p.className = 'go-pill';
  p.type = 'button';
  p.textContent = f[0].toUpperCase() + f.slice(1);
  p.dataset.fill = f;
  p.addEventListener('click', () => setProp('fill', f));
  fillPillsEl.appendChild(p);
}

// Animation pills
for (const a of ['none', 'pulse', 'rotate', 'drift', 'twinkle']) {
  const p = document.createElement('button');
  p.className = 'go-pill';
  p.type = 'button';
  p.textContent = a === 'none' ? 'None' : a[0].toUpperCase() + a.slice(1);
  p.dataset.anim = a;
  p.addEventListener('click', () => setProp('animation', a));
  animPillsEl.appendChild(p);
}

speedSlider.addEventListener('input', (e) => setProp('speed', parseFloat(e.target.value)));
opacitySlider.addEventListener('input', (e) => setProp('opacity', parseFloat(e.target.value)));
btnDup.addEventListener('click', () => state.selectedId && duplicateShape(state.selectedId));
btnDelete.addEventListener('click', () => state.selectedId && deleteShape(state.selectedId));

let sheetOpen = false;
function openSheet() {
  sheet.classList.add('open');
  sheetScrim.classList.add('open');
  sheetOpen = true;
}
function closeSheet() {
  sheet.classList.remove('open');
  sheetScrim.classList.remove('open');
  sheetOpen = false;
}
sheetScrim.addEventListener('click', () => selectById(null));

// Swipe-down to dismiss
(() => {
  let startY = null;
  let base = 0;
  sheet.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, .go-swatch, .go-pill, .go-action')) return;
    startY = e.touches[0].clientY;
    base = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (startY == null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      base = dy;
      sheet.style.transform = `translateY(${dy}px)`;
    }
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    sheet.style.transform = '';
    if (base > 80) selectById(null);
    startY = null;
  });
})();

let syncing = false;
function syncSheet() {
  if (!state.selectedId) return;
  const s = findShape(state.selectedId);
  if (!s) return;
  syncing = true;
  swatchesEl.querySelectorAll('.go-swatch').forEach((el) => {
    el.classList.toggle('active', el.dataset.color === s.color);
  });
  pickerInput.value = s.color;
  fillPillsEl.querySelectorAll('.go-pill').forEach((el) => {
    el.classList.toggle('active', el.dataset.fill === s.fill);
  });
  animPillsEl.querySelectorAll('.go-pill').forEach((el) => {
    el.classList.toggle('active', el.dataset.anim === s.animation);
  });
  speedSlider.value = s.speed;
  speedVal.textContent = `${s.speed.toFixed(1)}×`;
  opacitySlider.value = s.opacity;
  opacityVal.textContent = `${Math.round(s.opacity * 100)}%`;
  speedRow.style.display = s.animation === 'none' ? 'none' : 'flex';
  syncing = false;
}

function setProp(key, value) {
  if (syncing) return;
  const s = state.selectedId && findShape(state.selectedId);
  if (!s) return;
  if (s[key] === value) return;
  // Coalesce rapid slider changes into a single history entry via debounce key
  queueHistoryFor(key);
  s[key] = value;
  syncSheet();
  scheduleSave();
}

let pendingHistoryKey = null;
let pendingHistoryTimer = null;
function queueHistoryFor(key) {
  if (pendingHistoryKey !== key) {
    pushHistory();
    pendingHistoryKey = key;
  }
  clearTimeout(pendingHistoryTimer);
  pendingHistoryTimer = setTimeout(() => { pendingHistoryKey = null; }, 500);
}

// ---------- UI: Toolbar + Play ----------
const btnHome = document.getElementById('btn-home');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnPlay = document.getElementById('btn-play');
const playHint = document.getElementById('play-hint');

btnHome.addEventListener('click', () => {
  window.location.href = (import.meta.env && import.meta.env.BASE_URL) || '/';
});
btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);
btnPlay.addEventListener('click', () => setPlayMode(true));

function setPlayMode(on) {
  state.playMode = on;
  document.body.classList.toggle('go-play', on);
  if (on) {
    selectById(null);
    playHint.classList.add('show');
    setTimeout(() => playHint.classList.remove('show'), 1800);
  }
}

// ---------- Empty-state hint ----------
const emptyHint = document.getElementById('empty-hint');
function updateEmptyHint() {
  emptyHint.classList.toggle('hidden', state.shapes.length > 0);
}

// ---------- Long-press context menu ----------
let ctxMenu = null;
function showContextMenu(id, x, y) {
  closeContextMenu();
  ctxMenu = document.createElement('div');
  ctxMenu.className = 'go-ctx';
  ctxMenu.innerHTML = `
    <button data-act="dup">Duplicate</button>
    <button data-act="front">Bring to front</button>
    <button data-act="back">Send to back</button>
    <button data-act="delete" class="danger">Delete</button>
  `;
  document.body.appendChild(ctxMenu);
  const rect = ctxMenu.getBoundingClientRect();
  const left = Math.min(window.innerWidth - rect.width - 8, Math.max(8, x - rect.width / 2));
  const top = Math.min(window.innerHeight - rect.height - 8, Math.max(8, y - rect.height - 12));
  ctxMenu.style.left = `${left}px`;
  ctxMenu.style.top = `${top}px`;
  ctxMenu.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'dup') duplicateShape(id);
    else if (act === 'delete') deleteShape(id);
    else if (act === 'front') {
      pushHistory();
      const s = findShape(id);
      if (s) s.z = Math.max(0, ...state.shapes.map((x) => x.z || 0)) + 1;
      scheduleSave();
    } else if (act === 'back') {
      pushHistory();
      const s = findShape(id);
      if (s) s.z = Math.min(0, ...state.shapes.map((x) => x.z || 0)) - 1;
      scheduleSave();
    }
    closeContextMenu();
  });
  setTimeout(() => {
    window.addEventListener('pointerdown', closeContextMenu, { once: true });
  }, 0);
}
function closeContextMenu() {
  if (ctxMenu) {
    ctxMenu.remove();
    ctxMenu = null;
  }
}

// ---------- Init ----------
(async () => {
  const loaded = await loadState();
  if (loaded && loaded.length) state.shapes = loaded;
  refreshHistoryButtons();
  updateEmptyHint();
  requestAnimationFrame(render);
})();
