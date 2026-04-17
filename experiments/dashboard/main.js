import { initClock } from './widgets/clock.js';
import { initWeather } from './widgets/weather.js';
import { initCalendar } from './widgets/calendar.js';
import { initSystemStats } from './widgets/system-stats.js';
import { initNowPlaying } from './widgets/now-playing.js';
import { initQuote } from './widgets/quote.js';
import { attachMobileControls } from '../_shared/mobile-controls.js';

// Initialize all widgets
const clock = initClock();
initWeather();
initCalendar();
initSystemStats();
initNowPlaying();
initQuote();

// Clock tick loop (smooth analog hands)
function tick() {
  clock.update();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Keyboard controls
const helpOverlay = document.getElementById('help-overlay');
let helpVisible = false;

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'f':
    case 'F':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      break;
    case 't':
    case 'T':
      clock.toggle24h();
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
  }, 3000);
}
document.addEventListener('mousemove', resetCursorHide);
resetCursorHide();

attachMobileControls({
  onHelp: () => {
    helpVisible = !helpVisible;
    helpOverlay.classList.toggle('visible', helpVisible);
  },
  extraButtons: [
    { id: 'clock-format', label: '12/24h', onClick: () => clock.toggle24h() },
  ],
});
