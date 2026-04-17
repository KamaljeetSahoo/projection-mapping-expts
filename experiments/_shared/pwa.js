import { registerSW } from 'virtual:pwa-register';

const STYLE = `
  .pwa-toast {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: max(80px, env(safe-area-inset-bottom) + 72px);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(20, 22, 28, 0.92);
    border: 1px solid rgba(120, 180, 255, 0.25);
    border-radius: 12px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    font-family: 'Inter', 'SF Mono', monospace, sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    z-index: 100;
    max-width: calc(100vw - 32px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    animation: pwa-slide-up 0.3s ease;
  }
  @keyframes pwa-slide-up {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  .pwa-toast.pwa-top {
    top: max(16px, env(safe-area-inset-top));
    bottom: auto;
  }
  .pwa-toast-msg { flex: 1; min-width: 0; line-height: 1.35; }
  .pwa-toast-msg b { color: #9cf; font-weight: 500; }
  .pwa-toast-btn {
    background: rgba(90, 170, 255, 0.18);
    border: 1px solid rgba(90, 170, 255, 0.3);
    color: #9cf;
    padding: 6px 12px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  .pwa-toast-btn:hover { background: rgba(90, 170, 255, 0.3); }
  .pwa-toast-btn.pwa-ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.6);
  }
  .pwa-toast-btn.pwa-ghost:hover { background: rgba(255, 255, 255, 0.06); }

  /* ---- Install bottom sheet (iOS) ---- */
  .pwa-scrim {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
    animation: pwa-fade 0.25s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .pwa-scrim.pwa-closing { animation: pwa-fade 0.22s ease reverse forwards; }
  @keyframes pwa-fade { from { opacity: 0 } to { opacity: 1 } }

  .pwa-sheet {
    position: fixed;
    left: 0; right: 0;
    bottom: 0;
    margin: 0 auto;
    width: 100%;
    max-width: 520px;
    background: rgba(22, 24, 30, 0.97);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px 22px 0 0;
    padding: 24px 22px max(22px, calc(env(safe-area-inset-bottom) + 16px));
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.5);
    font-family: 'Inter', 'SF Mono', system-ui, sans-serif;
    color: rgba(255, 255, 255, 0.9);
    z-index: 100;
    animation: pwa-sheet-in 0.38s cubic-bezier(0.2, 0.9, 0.3, 1);
    -webkit-tap-highlight-color: transparent;
  }
  .pwa-sheet.pwa-closing { animation: pwa-sheet-out 0.25s cubic-bezier(0.4, 0, 0.7, 1) forwards; }
  @keyframes pwa-sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes pwa-sheet-out { from { transform: translateY(0); } to { transform: translateY(100%); } }

  .pwa-sheet-handle {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.18);
  }
  .pwa-sheet-close {
    position: absolute;
    top: 18px; right: 16px;
    width: 30px; height: 30px;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.65);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    touch-action: manipulation;
  }
  .pwa-sheet-close:active { background: rgba(255, 255, 255, 0.12); }
  .pwa-sheet-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 4px 40px 16px 0;
  }
  .pwa-sheet-icon {
    width: 54px; height: 54px;
    border-radius: 13px;
    background: #0a0a0a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    overflow: hidden;
  }
  .pwa-sheet-icon img { width: 100%; height: 100%; display: block; }
  .pwa-sheet-title { font-size: 17px; font-weight: 600; color: #fff; line-height: 1.3; }
  .pwa-sheet-sub {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    margin-top: 3px;
    line-height: 1.4;
  }
  .pwa-sheet-steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 8px 0 18px;
  }
  .pwa-sheet-step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.88);
  }
  .pwa-sheet-step .pwa-step-n {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(90, 170, 255, 0.15);
    color: #9cf;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .pwa-sheet-step b { color: #fff; font-weight: 500; }
  .pwa-glyph {
    display: inline-block;
    width: 16px; height: 16px;
    vertical-align: -3px;
    color: #9cf;
    margin: 0 2px;
  }
  .pwa-sheet-cta {
    width: 100%;
    padding: 14px;
    background: rgba(90, 170, 255, 0.18);
    border: 1px solid rgba(90, 170, 255, 0.32);
    color: #9cf;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.02em;
    border-radius: 12px;
    cursor: pointer;
    touch-action: manipulation;
  }
  .pwa-sheet-cta:active { background: rgba(90, 170, 255, 0.3); }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.id = 'pwa-style';
  s.textContent = STYLE;
  document.head.appendChild(s);
}

function toast({ message, actionLabel, onAction, onDismiss, top = false, autoDismiss = 0 }) {
  injectStyles();
  const el = document.createElement('div');
  el.className = 'pwa-toast' + (top ? ' pwa-top' : '');
  el.innerHTML = `
    <div class="pwa-toast-msg">${message}</div>
    ${actionLabel ? `<button class="pwa-toast-btn" data-role="action">${actionLabel}</button>` : ''}
    <button class="pwa-toast-btn pwa-ghost" data-role="dismiss" aria-label="Dismiss">Not now</button>
  `;
  document.body.appendChild(el);
  const close = () => { el.remove(); onDismiss?.(); };
  el.querySelector('[data-role="action"]')?.addEventListener('click', () => {
    onAction?.();
    el.remove();
  });
  el.querySelector('[data-role="dismiss"]')?.addEventListener('click', close);
  if (autoDismiss > 0) setTimeout(() => el.isConnected && close(), autoDismiss);
  return el;
}

const SHARE_SVG = `<svg class="pwa-glyph" viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M25 33 V 7 M15 17 L25 7 L35 17"/><path d="M11 23 H 7 V 43 H 43 V 23 H 39"/></svg>`;
const PLUS_SVG = `<svg class="pwa-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

function installSheet({ onDismiss } = {}) {
  injectStyles();
  const base = (import.meta.env && import.meta.env.BASE_URL) || '/';

  const scrim = document.createElement('div');
  scrim.className = 'pwa-scrim';

  const sheet = document.createElement('div');
  sheet.className = 'pwa-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Install Projection Lab');
  sheet.innerHTML = `
    <div class="pwa-sheet-handle"></div>
    <button class="pwa-sheet-close" data-role="close" aria-label="Close">×</button>
    <div class="pwa-sheet-header">
      <div class="pwa-sheet-icon"><img src="${base}icon.svg" alt=""></div>
      <div>
        <div class="pwa-sheet-title">Install Projection Lab</div>
        <div class="pwa-sheet-sub">Fullscreen, offline, great on AirPlay.</div>
      </div>
    </div>
    <div class="pwa-sheet-steps">
      <div class="pwa-sheet-step">
        <span class="pwa-step-n">1</span>
        <span>Tap the Share button ${SHARE_SVG} in the Safari toolbar.</span>
      </div>
      <div class="pwa-sheet-step">
        <span class="pwa-step-n">2</span>
        <span>Scroll and choose <b>Add to Home Screen</b> ${PLUS_SVG}.</span>
      </div>
    </div>
    <button class="pwa-sheet-cta" data-role="cta">Got it</button>
  `;

  document.body.appendChild(scrim);
  document.body.appendChild(sheet);

  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    sheet.classList.add('pwa-closing');
    scrim.classList.add('pwa-closing');
    setTimeout(() => { sheet.remove(); scrim.remove(); }, 260);
    onDismiss?.();
  };

  scrim.addEventListener('click', close);
  sheet.querySelector('[data-role="close"]').addEventListener('click', close);
  sheet.querySelector('[data-role="cta"]').addEventListener('click', close);
}

// ---------- Service worker update toast ----------
export function setupAutoUpdate() {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast({
        message: '<b>New version</b> available.',
        actionLabel: 'Reload',
        onAction: () => updateSW(true),
      });
    },
    onOfflineReady() {
      // quiet — app just works offline now
    },
  });
}

// ---------- Install prompt (landing page only) ----------
const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 14;

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
}

function isMobile() {
  return isIOS() || /Android|Mobi/i.test(navigator.userAgent || '');
}

function wasRecentlyDismissed() {
  const at = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
  if (!at) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
}

export function setupInstallPrompt() {
  if (isStandalone() || wasRecentlyDismissed() || !isMobile()) return;

  // Android / Chromium — beforeinstallprompt
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    toast({
      message: '<b>Install Projection Lab</b> — works fullscreen & offline.',
      actionLabel: 'Install',
      onAction: async () => {
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome !== 'accepted') markDismissed();
        deferred = null;
      },
      onDismiss: markDismissed,
    });
  });

  // iOS Safari — no install API. Show a native-feeling bottom sheet.
  if (isIOS()) {
    setTimeout(() => {
      if (isStandalone() || wasRecentlyDismissed()) return;
      installSheet({ onDismiss: markDismissed });
    }, 1200);
  }
}
