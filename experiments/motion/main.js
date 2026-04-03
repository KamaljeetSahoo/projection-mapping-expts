import { setupCanvas } from '../art/utils/canvas.js';
import { createMotionDetector } from './utils/motion-detect.js';
import { createRipples } from './modes/ripples.js';
import { createTrails } from './modes/trails.js';
import { createRepel } from './modes/repel.js';

const canvasEl = document.getElementById('canvas');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const errorMsg = document.getElementById('error-msg');
const helpOverlay = document.getElementById('help-overlay');
const modeLabel = document.getElementById('mode-label');

const canvas = setupCanvas(canvasEl);
const motion = createMotionDetector();

const modes = [createRipples, createTrails, createRepel];
let currentModeIndex = 0;
let currentMode = null;
let transitioning = false;
let transitionAlpha = 0;
let transitionPhase = 'none';
let pendingModeIndex = -1;
let running = false;

function switchMode(index) {
  if (index === currentModeIndex && currentMode) return;
  if (transitioning) return;
  pendingModeIndex = index;
  transitioning = true;
  transitionPhase = 'fadeOut';
  transitionAlpha = 0;
}

function applyPendingMode() {
  if (currentMode) currentMode.destroy();
  currentModeIndex = pendingModeIndex;
  currentMode = modes[currentModeIndex]();
  currentMode.init(canvas);
  showModeLabel(currentMode.name);
}

function showModeLabel(name) {
  modeLabel.textContent = name;
  modeLabel.style.opacity = '1';
  setTimeout(() => { modeLabel.style.opacity = '0'; }, 1500);
}

let lastTime = 0;
function loop(timestamp) {
  if (!running) return;
  const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
  lastTime = timestamp;

  motion.update();

  if (transitionPhase === 'fadeOut') {
    transitionAlpha += dt / 400;
    if (transitionAlpha >= 1) { transitionAlpha = 1; transitionPhase = 'fadeIn'; applyPendingMode(); }
  } else if (transitionPhase === 'fadeIn') {
    transitionAlpha -= dt / 400;
    if (transitionAlpha <= 0) { transitionAlpha = 0; transitionPhase = 'none'; transitioning = false; }
  }

  if (currentMode) currentMode.update(canvas, dt, motion);

  if (transitionAlpha > 0) {
    canvas.ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(loop);
}

let helpVisible = false;
document.addEventListener('keydown', (e) => {
  if (!running) return;
  switch (e.key) {
    case ' ': e.preventDefault(); switchMode((currentModeIndex + 1) % modes.length); break;
    case '1': switchMode(0); break;
    case '2': switchMode(1); break;
    case '3': switchMode(2); break;
    case 'f': case 'F':
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
      break;
    case 'h': case 'H':
      helpVisible = !helpVisible;
      helpOverlay.classList.toggle('visible', helpVisible);
      break;
  }
});

let cursorTimeout;
function resetCursorHide() {
  document.body.style.cursor = 'default';
  clearTimeout(cursorTimeout);
  cursorTimeout = setTimeout(() => { document.body.style.cursor = 'none'; }, 2000);
}
document.addEventListener('mousemove', resetCursorHide);

startBtn.addEventListener('click', async () => {
  try {
    startBtn.textContent = 'Initializing...';
    startBtn.disabled = true;
    await motion.init();
    startOverlay.classList.add('hidden');
    running = true;
    currentMode = modes[0]();
    currentMode.init(canvas);
    showModeLabel(currentMode.name);
    resetCursorHide();
    requestAnimationFrame(loop);
  } catch (err) {
    errorMsg.style.display = 'block';
    errorMsg.textContent = `Camera access denied: ${err.message}`;
    startBtn.textContent = 'Try Again';
    startBtn.disabled = false;
  }
});
