const CSS = `
  canvas { touch-action: none; }

  .mc-tray {
    position: fixed;
    left: 50%;
    bottom: max(16px, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    display: flex;
    gap: 6px;
    padding: 6px;
    background: rgba(18, 18, 22, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    z-index: 50;
    transition: opacity 0.4s ease;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .mc-tray.mc-hidden { opacity: 0; pointer-events: none; }

  .mc-btn {
    min-width: 44px;
    height: 44px;
    padding: 0 10px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.72);
    font-family: inherit;
    font-size: 18px;
    font-weight: 500;
    line-height: 1;
    border-radius: 10px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .mc-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
  .mc-btn:active { background: rgba(255, 255, 255, 0.16); color: #fff; transform: scale(0.96); }
  .mc-btn.mc-active { background: rgba(90, 170, 255, 0.2); color: #9cf; }

  .mc-sep { width: 1px; align-self: stretch; background: rgba(255,255,255,0.1); margin: 4px 2px; }
`;

function injectStylesOnce() {
  if (document.getElementById('mc-style')) return;
  const style = document.createElement('style');
  style.id = 'mc-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

/**
 * Attach a floating, auto-hiding touch control tray.
 *
 * @param {object} opts
 * @param {() => void} [opts.onNext]    Next mode handler (shows a ▶ button)
 * @param {() => void} [opts.onHelp]    Toggle help handler (shows a ? button)
 * @param {boolean} [opts.fullscreen=true]  Show fullscreen toggle
 * @param {Array<{id:string,label:string,onClick:()=>void}>} [opts.extraButtons]
 * @returns {{ show: () => void, destroy: () => void, tray: HTMLElement }}
 */
export function attachMobileControls(opts = {}) {
  injectStylesOnce();

  const {
    onNext,
    onHelp,
    fullscreen = true,
    extraButtons = [],
  } = opts;

  const tray = document.createElement('div');
  tray.className = 'mc-tray';

  const buttons = [];
  if (onNext) buttons.push({ id: '__next', label: 'Next', icon: '▶', onClick: onNext });
  for (const b of extraButtons) buttons.push({ ...b });
  if (onHelp || fullscreen) buttons.push({ id: '__sep', sep: true });
  if (onHelp) buttons.push({ id: '__help', label: 'Help', icon: '?', onClick: onHelp });
  if (fullscreen) buttons.push({ id: '__fs', label: 'Fullscreen', icon: '⛶', onClick: toggleFullscreen });

  for (const b of buttons) {
    if (b.sep) {
      const sep = document.createElement('span');
      sep.className = 'mc-sep';
      tray.appendChild(sep);
      continue;
    }
    const btn = document.createElement('button');
    btn.className = 'mc-btn';
    btn.type = 'button';
    btn.textContent = b.icon ?? b.label;
    btn.setAttribute('aria-label', b.label);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      b.onClick();
      show();
    });
    tray.appendChild(btn);
  }
  document.body.appendChild(tray);

  let hideTimer = null;
  function show() {
    tray.classList.remove('mc-hidden');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => tray.classList.add('mc-hidden'), 3500);
  }

  const onActivity = () => show();
  window.addEventListener('pointermove', onActivity, { passive: true });
  window.addEventListener('pointerdown', onActivity, { passive: true });
  window.addEventListener('keydown', onActivity);

  show();

  return {
    show,
    tray,
    destroy() {
      window.removeEventListener('pointermove', onActivity);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      clearTimeout(hideTimer);
      tray.remove();
    },
  };
}
