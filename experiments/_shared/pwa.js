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
  .pwa-share-icon {
    display: inline-block;
    width: 14px;
    height: 14px;
    vertical-align: -2px;
    margin: 0 2px;
  }
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

const SHARE_ICON = `
  <svg class="pwa-share-icon" viewBox="0 0 50 50" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M25 33 V 7 M15 17 L25 7 L35 17"/>
    <path d="M11 23 H 7 V 43 H 43 V 23 H 39"/>
  </svg>`;

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

  // iOS Safari — no API. Show a one-time instruction banner.
  if (isIOS()) {
    // iOS fires no beforeinstallprompt; delay a bit so it doesn't clash with first paint.
    setTimeout(() => {
      if (isStandalone() || wasRecentlyDismissed()) return;
      toast({
        message: `<b>Add to Home Screen</b> for fullscreen mode: tap ${SHARE_ICON} then <b>Add to Home Screen</b>.`,
        onDismiss: markDismissed,
      });
    }, 1200);
  }
}
