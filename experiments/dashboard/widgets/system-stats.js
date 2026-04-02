function createRingSVG(id, color) {
  const circumference = 2 * Math.PI * 20;
  return `
    <div class="stat-ring">
      <svg viewBox="0 0 50 50">
        <circle class="ring-bg" cx="25" cy="25" r="20"/>
        <circle class="ring-fill" id="ring-${id}" cx="25" cy="25" r="20"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference}"/>
      </svg>
      <span class="ring-label" id="ring-label-${id}">--</span>
    </div>
  `;
}

function setRing(id, fraction, label) {
  const circumference = 2 * Math.PI * 20;
  const el = document.getElementById(`ring-${id}`);
  const labelEl = document.getElementById(`ring-label-${id}`);
  if (el) {
    el.style.strokeDashoffset = circumference * (1 - Math.min(1, fraction));
  }
  if (labelEl && label !== undefined) {
    labelEl.textContent = label;
  }
}

// Measure download speed by fetching a small known resource
async function measureSpeed() {
  const testUrl = 'https://www.google.com/favicon.ico';
  const testSize = 5430; // approximate bytes of google favicon

  try {
    const start = performance.now();
    const res = await fetch(testUrl + '?_=' + Date.now(), { cache: 'no-store', mode: 'no-cors' });
    const end = performance.now();

    const durationSec = (end - start) / 1000;
    // Rough estimate — includes latency, not just throughput
    const bitsPerSec = (testSize * 8) / durationSec;
    const mbps = bitsPerSec / 1_000_000;

    return { latency: Math.round(end - start), mbps };
  } catch {
    return null;
  }
}

export async function initSystemStats() {
  const container = document.getElementById('stats-grid');

  const stats = [
    { id: 'download', name: 'Download', color: 'rgba(80, 200, 120, 0.7)' },
    { id: 'latency', name: 'Latency', color: 'rgba(100, 180, 255, 0.7)' },
    { id: 'connection', name: 'Connection', color: 'rgba(255, 180, 80, 0.7)' },
  ];

  let html = '';
  for (const s of stats) {
    html += `
      <div class="stat-item">
        ${createRingSVG(s.id, s.color)}
        <div class="stat-info">
          <div class="stat-name">${s.name}</div>
          <div class="stat-value" id="stat-val-${s.id}">Measuring...</div>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;

  async function update() {
    // Connection type (Navigator.connection API)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      const type = conn.effectiveType || conn.type || 'unknown';
      const downlink = conn.downlink; // Mbps estimate from browser

      if (downlink) {
        // Browser's own downlink estimate (more reliable than our fetch test)
        const maxMbps = 100;
        setRing('download', Math.min(1, downlink / maxMbps), `${downlink}`);
        document.getElementById('stat-val-download').textContent = `${downlink} Mbps`;
      }

      const rtt = conn.rtt; // round-trip time in ms
      if (rtt !== undefined) {
        const maxRtt = 500;
        setRing('latency', Math.min(1, 1 - rtt / maxRtt), `${rtt}`);
        document.getElementById('stat-val-latency').textContent = `${rtt} ms`;
      }

      const typeLabel = type.toUpperCase();
      const typeFrac = { 'slow-2g': 0.1, '2g': 0.25, '3g': 0.5, '4g': 0.85, '5g': 1 }[type] || 0.5;
      setRing('connection', typeFrac, typeLabel);
      document.getElementById('stat-val-connection').textContent = typeLabel;
    } else {
      // Fallback: use fetch-based measurement
      const result = await measureSpeed();
      if (result) {
        const maxMbps = 100;
        setRing('download', Math.min(1, result.mbps / maxMbps), `${result.mbps.toFixed(1)}`);
        document.getElementById('stat-val-download').textContent = `~${result.mbps.toFixed(1)} Mbps`;

        const maxLatency = 500;
        setRing('latency', Math.min(1, 1 - result.latency / maxLatency), `${result.latency}`);
        document.getElementById('stat-val-latency').textContent = `${result.latency} ms`;

        setRing('connection', navigator.onLine ? 0.8 : 0, navigator.onLine ? 'ON' : 'OFF');
        document.getElementById('stat-val-connection').textContent = navigator.onLine ? 'Online' : 'Offline';
      } else {
        setRing('download', 0, '--');
        document.getElementById('stat-val-download').textContent = 'N/A';
        setRing('latency', 0, '--');
        document.getElementById('stat-val-latency').textContent = 'N/A';
        setRing('connection', 0, 'OFF');
        document.getElementById('stat-val-connection').textContent = 'Offline';
      }
    }
  }

  await update();
  setInterval(update, 10000); // refresh every 10s
}
