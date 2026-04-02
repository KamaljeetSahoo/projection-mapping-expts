import { setupCanvas } from './utils/canvas.js';
import { createFlowField } from './modes/flow-field.js';
import { createFractals } from './modes/fractals.js';
import { createColorBlobs } from './modes/color-blobs.js';

const canvasEl = document.getElementById('canvas');
const helpOverlay = document.getElementById('help-overlay');
const modeLabel = document.getElementById('mode-label');
const canvas = setupCanvas(canvasEl);

// Modes
const modes = [createFlowField, createFractals, createColorBlobs];
let currentModeIndex = 0;
let currentMode = null;
let transitioning = false;
let transitionAlpha = 0; // 0 = fully visible, 1 = fully black (fade out)
let transitionPhase = 'none'; // 'none' | 'fadeOut' | 'fadeIn'
let pendingModeIndex = -1;

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

// Animation loop
let lastTime = 0;

function loop(timestamp) {
  const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16; // cap dt at 50ms
  lastTime = timestamp;

  if (transitionPhase === 'fadeOut') {
    transitionAlpha += dt / 400; // 400ms fade out
    if (transitionAlpha >= 1) {
      transitionAlpha = 1;
      transitionPhase = 'fadeIn';
      applyPendingMode();
    }
  } else if (transitionPhase === 'fadeIn') {
    transitionAlpha -= dt / 400; // 400ms fade in
    if (transitionAlpha <= 0) {
      transitionAlpha = 0;
      transitionPhase = 'none';
      transitioning = false;
    }
  }

  // Update current mode
  if (currentMode) {
    currentMode.update(canvas, dt);
  }

  // Draw transition overlay
  if (transitionAlpha > 0) {
    canvas.ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(loop);
}

// Keyboard controls
let helpVisible = false;

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case ' ':
      e.preventDefault();
      switchMode((currentModeIndex + 1) % modes.length);
      break;
    case '1':
      switchMode(0);
      break;
    case '2':
      switchMode(1);
      break;
    case '3':
      switchMode(2);
      break;
    case 'f':
    case 'F':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      break;
    case 'h':
    case 'H':
      helpVisible = !helpVisible;
      helpOverlay.classList.toggle('visible', helpVisible);
      break;
  }
});

// Hide cursor after inactivity
let cursorTimeout;
function resetCursorHide() {
  document.body.style.cursor = 'default';
  clearTimeout(cursorTimeout);
  cursorTimeout = setTimeout(() => {
    document.body.style.cursor = 'none';
  }, 2000);
}
document.addEventListener('mousemove', resetCursorHide);
resetCursorHide();

// Start
currentMode = modes[0]();
currentMode.init(canvas);
showModeLabel(currentMode.name);
requestAnimationFrame(loop);
