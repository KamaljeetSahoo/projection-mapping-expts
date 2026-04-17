import { setupCanvas } from '../art/utils/canvas.js';
import { createAudio } from './utils/audio.js';
import { createWaveform } from './modes/waveform.js';
import { createSpectrumBars } from './modes/spectrum-bars.js';
import { createCircular } from './modes/circular.js';
import { createDnaHelix } from './modes/dna-helix.js';
import { createParticleExplosion } from './modes/particle-explosion.js';
import { createMountainTerrain } from './modes/mountain-terrain.js';
import { createNeonRings } from './modes/neon-rings.js';
import { createStarfield } from './modes/starfield.js';
import { createKaleidoscope } from './modes/kaleidoscope.js';
import { createEqualizerGrid } from './modes/equalizer-grid.js';
import { createLiquidWave } from './modes/liquid-wave.js';
import { createAurora } from './modes/aurora.js';
import { attachMobileControls } from '../_shared/mobile-controls.js';

const canvasEl = document.getElementById('canvas');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');
const errorMsg = document.getElementById('error-msg');
const helpOverlay = document.getElementById('help-overlay');
const modeLabel = document.getElementById('mode-label');

const canvas = setupCanvas(canvasEl);
const audio = createAudio();

// Modes
const modes = [
  createWaveform,
  createSpectrumBars,
  createCircular,
  createDnaHelix,
  createParticleExplosion,
  createMountainTerrain,
  createNeonRings,
  createStarfield,
  createKaleidoscope,
  createEqualizerGrid,
  createLiquidWave,
  createAurora,
];
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

// Animation loop
let lastTime = 0;

function loop(timestamp) {
  if (!running) return;

  const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
  lastTime = timestamp;

  // Update audio data
  audio.update();

  if (transitionPhase === 'fadeOut') {
    transitionAlpha += dt / 400;
    if (transitionAlpha >= 1) {
      transitionAlpha = 1;
      transitionPhase = 'fadeIn';
      applyPendingMode();
    }
  } else if (transitionPhase === 'fadeIn') {
    transitionAlpha -= dt / 400;
    if (transitionAlpha <= 0) {
      transitionAlpha = 0;
      transitionPhase = 'none';
      transitioning = false;
    }
  }

  if (currentMode) {
    currentMode.update(canvas, dt, audio);
  }

  if (transitionAlpha > 0) {
    canvas.ctx.fillStyle = `rgba(0, 0, 0, ${transitionAlpha})`;
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(loop);
}

// Keyboard controls
let helpVisible = false;

document.addEventListener('keydown', (e) => {
  if (!running) return;
  switch (e.key) {
    case ' ':
      e.preventDefault();
      switchMode((currentModeIndex + 1) % modes.length);
      break;
    case '1': switchMode(0); break;
    case '2': switchMode(1); break;
    case '3': switchMode(2); break;
    case '4': switchMode(3); break;
    case '5': switchMode(4); break;
    case '6': switchMode(5); break;
    case '7': switchMode(6); break;
    case '8': switchMode(7); break;
    case '9': switchMode(8); break;
    case '0': switchMode(9); break;
    case 'q': switchMode(10); break;
    case 'w': switchMode(11); break;
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

// Start button
startBtn.addEventListener('click', async () => {
  try {
    startBtn.textContent = 'Initializing...';
    startBtn.disabled = true;
    await audio.init();
    startOverlay.classList.add('hidden');

    running = true;
    currentMode = modes[0]();
    currentMode.init(canvas);
    showModeLabel(currentMode.name);
    resetCursorHide();
    attachMobileControls({
      onNext: () => switchMode((currentModeIndex + 1) % modes.length),
      onHelp: () => {
        helpVisible = !helpVisible;
        helpOverlay.classList.toggle('visible', helpVisible);
      },
    });
    requestAnimationFrame(loop);
  } catch (err) {
    errorMsg.style.display = 'block';
    errorMsg.textContent = `Microphone access denied or unavailable: ${err.message}`;
    startBtn.textContent = 'Try Again';
    startBtn.disabled = false;
  }
});
